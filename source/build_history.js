/* 推演威超 S01–S17：按官网最终名次推演每场比赛，球员数据、转会自然产生
   输入：player_data.js, teams_data.js, history.json (PDF), site_data.json (官网名次)
   输出：hist.json */
const fs = require('fs'), vm = require('vm');
const D = __dirname + '/';
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(D + 'player_data.js', 'utf8').replace('const PLAYER_DATABASE', 'var PLAYER_DATABASE'), ctx);
vm.runInContext(fs.readFileSync(D + 'teams_data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync(D + 'roster_overrides.js', 'utf8'), ctx);
const PDB = ctx.PLAYER_DATABASE, TD = ctx.window.TEAMS_DATA;
JSON.parse(fs.readFileSync(__dirname + '/extra_players.json', 'utf8')).forEach(p => PDB[p.team].push(p));
const PDF = JSON.parse(fs.readFileSync(D + 'history.json', 'utf8'));
ctx.TEAMS_DATA = TD; ctx.HISTORY = PDF;
vm.runInContext(fs.readFileSync(D + 'engine.js', 'utf8').replace('const ENGINE', 'var ENGINE'), ctx);
const ENGINE = ctx.ENGINE;
// S18 前的变动：转会与退役（PDF 写“至今”的，到 S17 为止）
for (const list of Object.values(PDF.legends)) list.forEach(l => { if (!l.end) l.end = 17; });
const SITE = JSON.parse(fs.readFileSync(D + 'site_data.json', 'utf8'));
// 官网参赛名单前后矛盾的赛季做合理化：该降级的不留、没降级的不消失、每季正好降 3 升 3（只换队名，名次积分不变）
const OFFICIAL = JSON.parse(JSON.stringify(SITE.standings));
const REALIGN = JSON.parse(fs.readFileSync(D + 'realign.json', 'utf8'));
for (const [s, map] of Object.entries(REALIGN)) if (/^\d+$/.test(s)) for (const [pos, team] of Object.entries(map)) SITE.standings[s][+pos - 1].team = team;
const LAST = 17;

/* ---------- RNG ---------- */
let _s = 20261020;
let _s2 = 20261020;
const rnd2 = () => { _s2 |= 0; _s2 = _s2 + 0x6D2B79F5 | 0; let t = Math.imul(_s2 ^ _s2 >>> 15, 1 | _s2); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let _s3 = 77012;
const rnd3 = () => { _s3 |= 0; _s3 = _s3 + 0x6D2B79F5 | 0; let t = Math.imul(_s3 ^ _s3 >>> 15, 1 | _s3); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rnd = () => { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const pick = (arr, w) => { const t = w.reduce((a, b) => a + b, 0); if (t <= 0) return arr[Math.floor(rnd() * arr.length)]; let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clean = s => String(s || '').replace(/[·\s]/g, '');

const LINE = p => { p = String(p || ''); if (p === 'GK') return 'GK'; if (/CB|LB|RB|WB/.test(p)) return 'DF'; if (/DM|CM|LM|RM|AM/.test(p)) return 'MF'; return 'FW'; };
const POS_GOAL = p => /CAM|LAM|RAM/.test(p) ? 1.9 : /LW|RW/.test(p) ? 2.3 : /ST/.test(p) ? 3.1 : /WB/.test(p) ? 0.7 : { GK: 0, DF: 0.35, MF: 1.1, FW: 3 }[LINE(p)];
const POS_AST = p => /CAM|LAM|RAM/.test(p) ? 3.4 : /LW|RW|LM|RM/.test(p) ? 2.8 : /WB|LB|RB/.test(p) ? 1.6 : /CM/.test(p) ? 2 : /DM/.test(p) ? 1 : /ST/.test(p) ? 1.6 : LINE(p) === 'GK' ? 0.05 : 0.5;
const TIER = { 'S++': 94, 'S+': 92, 'S': 90, 'A+': 88, 'A': 86 };

/* ---------- persons ---------- */
const P = []; // {name,pos,line,nat,cur,dbr,age,tgp,stints:[],site:[], kind}
const nameCount = {};
Object.values(PDB).flat().forEach(p => { nameCount[clean(p.name)] = (nameCount[clean(p.name)] || 0) + 1; });
const dbIdx = {}; // team|name -> pid
for (const [t, list] of Object.entries(PDB)) list.forEach(p => {
  const id = P.length;
  P.push({ name: p.name, pos: p.pos, line: LINE(p.pos), nat: p.nat, cur: t, dbr: p.rating, age: p.age, tgp: p.tGP, stints: [], site: [], kind: 'db' });
  dbIdx[t + '|' + p.name] = id;
});
const byName = {}; // clean name -> [pid]
P.forEach((p, i) => (byName[clean(p.name)] = byName[clean(p.name)] || []).push(i));
const proSeason = p => 18 - (p.age - 17);
const NATMAP = Object.assign(JSON.parse(fs.readFileSync(D + 'natmap.json', 'utf8')), { '托雷斯': '西班牙' });
function findPerson(name, team, season, ongoing) {
  const c = clean(name);
  const l = (byName[c] || []).filter(i => (P[i].kind !== 'db' || season == null || season >= proSeason(P[i])) && !(ongoing && P[i].kind === 'db' && P[i].cur !== team) && !(P[i].kind === 'db' && NATMAP[c] && P[i].nat && P[i].nat !== NATMAP[c]));
  if (l.length === 1) return l[0];
  if (!l.length && team) {
    const fz = (PDB[team] || []).filter(x => { const d = clean(x.name); return d.length >= 2 && d !== c && c.startsWith(d); });
    if (fz.length === 1 && (season == null || season >= proSeason(fz[0]))) return dbIdx[team + '|' + fz[0].name];
  }
  if (l.length > 1 && season != null) { const cont = l.find(i => P[i].stints.some(st => st.team === team && season >= st.start && season <= st.end) || P[i].site.some(x => x.team === team && x.s < season && season - x.s <= 2)); if (cont != null) return cont; }
  if (l.length > 1) { const same = l.find(i => P[i].cur === team || P[i].stints.some(s => s.team === team) || P[i].site.some(s => s.team === team)); if (same != null) return same; }
  return null;
}
function newPerson(o) { const id = P.length; P.push({ stints: [], site: [], ...o }); (byName[clean(o.name)] = byName[clean(o.name)] || []).push(id); return id; }

// legends
for (const [team, list] of Object.entries(PDF.legends)) list.forEach(l => {
  const name = l.name.replace(/^.*换成/, '');
  let id = findPerson(name, team, l.start, !l.end);
  if (id == null) id = newPerson({ name, pos: l.pos.split('/')[0], line: LINE(l.pos.split('/')[0]), nat: NATMAP[clean(name)] || null, kind: 'legend' });
  P[id].stints.push({ team, start: l.start, end: l.end || LAST, ongoing: !l.end, tier: TIER[l.tier.replace(/[^SA+]/g, '')] || 85, pos: l.pos.split('/')[0] });
  if (P[id].kind !== 'db') P[id].kind = 'legend';
});
// 官网榜单上、资料库里没有的早期球员：只记录他们在哪个赛季效力哪支球队（数据不再按榜单）
for (let s = 1; s <= LAST; s++) {
  const inLeague = new Set(SITE.standings[s].map(r => r.team));
  for (const cat of ['goals', 'assists', 'cards']) SITE.stats[s][cat].forEach((r, rank) => {
    if (!inLeague.has(r.team)) return;
    let id = findPerson(r.player, r.team, s);
    if (id != null && P[id].kind === 'db') return;
    if (id == null) id = newPerson({ name: r.player, pos: cat === 'goals' ? 'ST' : cat === 'assists' ? 'CAM' : 'CDM', line: cat === 'goals' ? 'FW' : cat === 'assists' ? 'MF' : 'DF', nat: NATMAP[clean(r.player)] || null, kind: 'site' });
    P[id].site.push({ s, team: r.team, cat, rank });
    if (P[id].kind === 'site' && cat === 'goals') { P[id].pos = 'ST'; P[id].line = 'FW'; }
  });
}

/* ---------- 固定的效力关系（传奇时期、早期球员、现役球员在现队的年份） ---------- */
const teamsIn = s => SITE.standings[s].map(r => r.team);
const rankIn = (s, t) => teamsIn(s).indexOf(t);
const assign = P.map(() => ({}));
const put = (id, s, team, prio) => { if (s < 1 || s > LAST || !TD[team]) return; const cur = assign[id][s]; if (!cur || cur.prio < prio) assign[id][s] = { team, prio }; };
P.forEach((p, id) => {
  p.stints.forEach(st => { for (let s = st.start; s <= st.end; s++) put(id, s, st.team, 3); });
  const byTeam = {};
  p.site.forEach(x => (byTeam[x.team] = byTeam[x.team] || []).push(x.s));
  for (const [team, ss] of Object.entries(byTeam)) { for (let s = Math.min(...ss); s <= Math.max(...ss); s++) put(id, s, team, 2.5); }
  if (p.kind === 'db') {
    const leg = p.stints.find(st => st.team === p.cur);
    // 资料库没写本队出场数的，视为 1–3 季前加盟；用户指定 S18 才转会的除外
    const S18_MOVES = ['皮尔萨'];
    let join = leg ? leg.start : (p.tgp > 0 ? Math.max(1, 18 - Math.ceil(p.tgp / 42)) : S18_MOVES.includes(p.name) ? 18 : 17 - Math.floor(rnd() * 3));
    const other = p.stints.filter(st => st.team !== p.cur).map(st => st.end);
    if (other.length) join = Math.max(join, Math.max(...other) + 1);
    // 撞名 = 父子：儿子要等父亲离开同一家俱乐部之后才加盟
    (byName[clean(p.name)] || []).forEach(j => { if (P[j] === p || P[j].kind === 'db') return; const ends = [...P[j].stints.filter(st => st.team === p.cur).map(st => st.end), ...P[j].site.filter(x => x.team === p.cur).map(x => x.s)]; if (ends.length) join = Math.max(join, Math.min(18, Math.max(...ends) + 1)); });
    p.join = join;
    for (let s = Math.max(join, proSeason(p)); s <= LAST; s++) put(id, s, p.cur, 2);
  }
});
P.forEach((p, id) => { if (p.kind === 'db') Object.keys(assign[id]).forEach(s => { if (+s < proSeason(p) && assign[id][s].prio <= 2) delete assign[id][s]; }); });
// 用户指定的球员生涯（careers.json）：只按这里的球队和年份效力，外赛区年份不在威超出场
const CAREERS = JSON.parse(fs.readFileSync(D + 'careers.json', 'utf8'));
const fixedCareer = {};
for (const [key, st] of Object.entries(CAREERS)) {
  if (key.startsWith('_')) continue;
  const [name, cur] = key.split('@');
  const ids = (byName[clean(name)] || []).filter(i => cur ? P[i].kind === 'db' && P[i].cur === cur : P[i].kind !== 'db' && P[i].kind !== 'gen');
  if (!ids.length) { console.warn('careers.json 找不到球员：', key); continue; }
  const id = ids[0]; fixedCareer[id] = st;
  assign[id] = {};
  st.forEach(([team, a, b]) => { if (team.endsWith('*')) return; for (let s = a; s <= Math.min(b, LAST); s++) put(id, s, team, 4); });
}

/* ---------- 评分 ---------- */
const ageCurve = a => -1.1 * Math.max(0, 27 - a) - 0.8 * Math.max(0, a - 31);
/* 俱乐部底蕴：S01–S17 平均积分 → 球员能力基准（豪门球员不会太低） */
const AVGPTS = {};
for (let s = 1; s <= LAST; s++) SITE.standings[s].forEach(r => { (AVGPTS[r.team] = AVGPTS[r.team] || []).push(r.w * 3 + r.d); });
const clubBase = t => { const a = AVGPTS[t] || [30]; const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.max(75, Math.min(89, 72 + m * 0.2)); };
/* 巅峰能力值：传奇按等级、官网榜单按排名、补充球员按俱乐部底蕴 */
function setPeak(p) {
  if (p.kind === 'db') return;
  const clubs = [...new Set([...p.stints.map(x => x.team), ...p.site.map(x => x.team)])];
  const floor = clubs.length ? Math.max(...clubs.map(clubBase)) : 80;
  let pk = 0;
  if (p.stints.length) pk = Math.max(...p.stints.map(x => x.tier));
  if (p.site.length) pk = Math.max(pk, ...p.site.map(x => x.cat === 'cards' ? 86 - x.rank * 0.3 : 92 - x.rank * 0.7));
  p.peak = Math.round(Math.max(pk, floor + 1));
}
/* 生涯曲线：前两季成长、最后两季下滑，中段为巅峰 */
function arc(s, c0, c1) {
  const len = c1 - c0 + 1, k = s - c0, back = c1 - s;
  let d = 0;
  if (len >= 3) d += [3, 1.5, 0.5][k] || 0;
  if (len >= 5) d += [2, 1][back] || 0;
  return d;
}
// 第一代银河战舰：巅峰在威联赛时代，S01 起是生涯末段，能力逐季下滑
const TWILIGHT = new Set(Object.entries(JSON.parse(fs.readFileSync(D + 'lore.json', 'utf8')).players).filter(([k, v]) => v.pre && v.span[0] === 1).map(([k]) => k.split('@')[0]));
function ratingAt(p, s) {
  if (p.kind === 'legend' && TWILIGHT.has(p.name) && p.stints.some(st => st.start === 1)) return Math.round((p.peak || 88) - 0.6 - 1.4 * (s - 1));
  if (p.kind === 'db' && s >= proSeason(p)) return Math.round(p.dbr + ageCurve(p.age - (18 - s)) - ageCurve(p.age));
  const ss = Object.keys(assign[P.indexOf(p)] || {}).map(Number);
  const c0 = p.kind === 'gen' ? p.born : (ss.length ? Math.min(...ss) : s), c1 = p.kind === 'gen' ? p.until : (ss.length ? Math.max(...ss) : s);
  return Math.round((p.peak || 84) - arc(s, c0, Math.max(c1, s)));
}

P.forEach(setPeak);
/* ---------- 虚构球员 ---------- */
/* 按国籍生成名字：先定国籍，再用该国常见的音节组合 */
const NG = {
  es: [['阿尔瓦', '贝尔穆', '卡斯特', '德尔加', '费尔南', '加列', '洛佩', '马丁内', '纳瓦', '奥尔特', '佩德', '拉莫', '桑切', '托雷', '巴尔德', '门多', '伊格莱', '索拉'], ['斯', '萨', '雷斯', '罗', '加', '多', '内斯', '特斯', '诺']],
  pt: [['阿劳', '巴罗', '卡瓦', '多斯桑', '费雷', '戈梅', '利马', '马托', '内维', '奥利维', '佩雷', '罗沙', '席尔', '索萨', '特谢', '阿尔梅', '科雷', '平托'], ['若', '斯', '拉', '伊拉', '罗', '卡', '尼奥', '达']],
  it: [['贝尔纳', '卡尔', '德卢', '法布', '加利', '洛伦', '马尔蒂', '帕斯夸', '罗西', '桑蒂', '托马', '维塔', '孔蒂', '巴尔扎', '费拉'], ['尼', '蒂', '齐', '奥', '洛', '伊尼', '佐', '利']],
  de: [['贝克', '费舍', '哈特', '克劳', '莱曼', '米勒', '诺伊', '施瓦', '韦伯', '齐默', '布兰', '霍夫', '凯斯', '沃尔'], ['曼', '特', '尔', '伯格', '斯坦', '纳', '茨']],
  nl: [['范德', '德扬', '范胡', '维尔', '德弗', '扬', '巴克', '斯海', '范贝', '赫特'], ['克', '森', '斯', '默', '特', '布鲁克', '霍文']],
  en: [['哈里', '威尔', '汤普', '斯图', '卡特', '布莱', '沃克', '米尔', '泰勒', '罗伯', '贝内', '霍尔', '马歇', '帕克'], ['森', '斯', '顿', '特', '沃斯', '利', '尔']],
  fr: [['杜邦', '勒布', '马蒂', '贝尔纳', '吉鲁', '拉孔', '蒙塔', '佩蒂', '鲁索', '瓦朗', '舍瓦', '博纳', '莫罗'], ['特', '尔', '内', '伊', '昂', '迪', '谢']],
  nord: [['安德', '拉尔', '尼尔', '约翰', '汉', '埃里克', '斯文', '奥尔', '彼得', '克里斯滕'], ['森', '松', '斯塔德', '贝克']],
  slav: [['彼得罗', '约万', '马尔科', '诺瓦', '科瓦', '米洛', '斯特凡', '佩里', '尼科利', '巴比'], ['维奇', '奇', '斯基', '夫', '克']],
  afr: [['奥卡', '恩迪', '阿德', '恩戈', '迪奥', '奥孔', '西塞', '巴巴', '科内', '恩多'], ['耶', '姆', '洛', '乌', '尔', '巴', '莱']],
};
const FIRST = { es: ['何塞', '迭戈', '卡洛斯', '哈维', '路易斯', '巴勃罗', '塞尔吉', '安德烈斯', '马里奥', '劳尔'], pt: ['若昂', '佩德罗', '蒂亚戈', '拉斐尔', '布鲁诺', '安德烈', '若泽', '达尼洛', '维克多', '卡约'], it: ['马尔科', '卢卡', '安德烈亚', '费德里科', '洛伦佐', '达维德', '西蒙内', '朱塞佩', '马泰奥', '里卡多'], de: ['托马斯', '马蒂亚斯', '尤利安', '斯特凡', '菲利普', '扬', '蒂莫', '约纳斯', '本', '马克斯'], nl: ['扬', '彼得', '蒂姆', '巴斯', '斯泰恩', '达安', '约里', '基斯', '维姆', '赫斯'], en: ['杰克', '哈里', '詹姆斯', '汤姆', '乔', '丹尼', '卢克', '萨姆', '威尔', '康纳'], fr: ['让', '皮埃尔', '吕卡', '安托万', '马蒂斯', '朱尔', '泰奥', '雨果', '克莱芒', '巴蒂斯特'], nord: ['拉斯穆斯', '奥勒', '马格努斯', '埃米尔', '托比亚斯', '克里斯蒂安', '安东', '弗雷德里克', '西蒙', '约纳斯'], slav: ['伊万', '马尔科', '尼古拉', '斯特凡', '德扬', '米兰', '约西普', '达里奥', '鲁卡', '亚当'], afr: ['穆萨', '易卜拉欣', '萨迪奥', '维克托', '伊德里萨', '恩戈洛', '埃马纽埃尔', '奥马尔', '塞库', '阿马杜'] };
const NAT_GROUP = { 西班牙: 'es', 阿根廷: 'es', 墨西哥: 'es', 哥伦比亚: 'es', 乌拉圭: 'es', 葡萄牙: 'pt', 巴西: 'pt', 意大利: 'it', 德国: 'de', 奥地利: 'de', 瑞士: 'de', 荷兰: 'nl', 比利时: 'nl', 英格兰: 'en', 美国: 'en', 苏格兰: 'en', 法国: 'fr', 丹麦: 'nord', 瑞典: 'nord', 挪威: 'nord', 克罗地亚: 'slav', 塞尔维亚: 'slav', 波兰: 'slav', 尼日利亚: 'afr', 塞内加尔: 'afr', 科特迪瓦: 'afr' };
const NATS = Object.keys(NAT_GROUP);
const MID = { es: ['里', '德', '尔', '维', '拉', '塔'], pt: ['里', '维', '拉', '德', '托'], it: ['尼', '里', '莱', '蒂', '卡'], de: ['尔', '林', '德', '克'], nl: ['德', '尔', '斯', '林'], en: ['林', '德', '顿', '尔'], fr: ['尔', '蒂', '拉', '维'], nord: ['德', '尔', '林', '斯'], slav: ['尔', '诺', '科', '达'], afr: ['巴', '杜', '拉', '科'] };
const KR = [['金', '朴', '李', '崔', '郑', '韩', '吴', '黄', '孙', '安', '赵', '姜'], ['民', '俊', '成', '在', '泰', '东', '浩', '智', '贤', '秀', '永', '承'], ['勋', '宇', '镇', '洙', '赫', '焕', '锡', '浩', '民', '俊']];
const JP = [['田中', '佐藤', '山本', '小林', '中岛', '高桥', '松井', '渡边', '铃木', '伊藤', '中村', '加藤', '森田', '冈崎'], ['翔太', '健太', '大辉', '拓海', '悠斗', '和也', '直树', '隼人', '达也', '圭佑', '亮太', '优马']];
const usedNames = new Set([...Object.keys(byName), ...Object.values(TD).flatMap(t => t.roster.map(r => clean(r.name))), '马尔蒂尼', '马歇尔', '贝内特', '诺伊尔']);
const one = a => a[Math.floor(rnd() * a.length)];
function genPerson(team) {
  let nat;
  if (team === '沃特梅兹') nat = rnd() < 0.55 ? '韩国' : '日本';
  else nat = one(NATS);
  for (let k = 0; k < 800; k++) {
    let n;
    if (nat === '韩国') n = one(KR[0]) + one(KR[1]) + one(KR[2]);
    else if (nat === '日本') n = one(JP[0]) + one(JP[1]);
    else { const gk = NAT_GROUP[nat], g = NG[gk]; n = k < 60 ? one(g[0]) + one(g[1]) : one(g[0]) + one(MID[gk]) + one(g[1]); }
    if (!usedNames.has(n)) { usedNames.add(n); return { name: n, nat }; }
  }
  throw new Error('name');
}

/* ---------- 每季阵容 + 转会市场 ----------
   固定效力的球员先上；空位从自由球员里挑（资料库球员在加盟现队之前的年份、往季的补充球员），
   豪门先挑，评分贴近球队水平者优先，留队有加分 → 自然出现转会；仍空缺就补新球员。 */
const XI = {};
const prevTeam = {};           // pid -> 上一季效力的球队
const genPool = [];            // 补充球员
const target = (s, t) => rankIn(s, t) < 0 ? clubBase(t) - 1.5 : clubBase(t) + (10.5 - rankIn(s, t)) * 0.3;
const lineOf = sl => LINE(sl.replace(/-.*/, ''));
const stayDown = {}, leftAt = {};
for (let s = 1; s <= LAST; s++) {
  XI[s] = {};
  const used = new Set();
  // 每季 27 支球队都有阵容（不在威超的球队踢次级联赛），威超球队先挑
  const ORDER = teamsIn(s).concat(Object.keys(TD).filter(t => !teamsIn(s).includes(t)).sort((a, b) => clubBase(b) - clubBase(a)));
  const pinned = {}; ORDER.forEach(t => pinned[t] = []);
  P.forEach((p, id) => { if (stayDown[id] && !teamsIn(s).includes(stayDown[id]) && (p.kind !== 'gen' || (s >= p.born && s <= p.until)) && !(assign[id][s] && assign[id][s].prio >= 2)) assign[id][s] = { team: stayDown[id], prio: 2 }; });
  P.forEach((p, id) => { const a = assign[id][s]; if (a && a.prio >= 2) pinned[a.team].push(id); });
  // 自由球员
  const free = [];
  P.forEach((p, id) => {
    if (assign[id][s] && assign[id][s].prio >= 2) return;
    if (fixedCareer[id]) return;
    if (p.kind === 'db') { if (s >= proSeason(p) && s < (p.join || 18)) free.push(id); }
    else if (p.kind === 'gen' && s >= p.born && s <= p.until) {
      // 球队降级后，多数球员留队踢次级联赛（这一季没有威超出场），球队升回来再一起回来
      const pt = prevTeam[id];
      if (pt && !teamsIn(s).includes(pt) && teamsIn(s - 1).includes(pt) && rnd() < 0.65) { stayDown[id] = pt; return; }
      if (stayDown[id] && !teamsIn(s).includes(stayDown[id])) return;
      free.push(id);
    }
  });
  const slotsOf = {};
  for (const team of ORDER) {
    const slots = TD[team].roster.map(r => ({ slot: r.pos, line: lineOf(r.pos), pid: null }));
    const cands = pinned[team].map(id => ({ id, pr: assign[id][s].prio >= 3 ? 1 : 0, r: ratingAt(P[id], s), line: P[id].line, pos: P[id].pos })).sort((a, b) => b.pr - a.pr || b.r - a.r);
    for (const c of cands) {
      const sl = slots.find(x => !x.pid && x.line === c.line && clean(x.slot).replace(/-.*/, '') === c.pos) || slots.find(x => !x.pid && x.line === c.line);
      if (sl) { sl.pid = c.id; sl.r = c.r; used.add(c.id); }
    }
    slotsOf[team] = slots;
  }
  for (const team of ORDER) {
    const tgt = target(s, team);
    slotsOf[team].forEach(sl => {
      if (sl.pid != null) return;
      let best = null, bestScore = -7;
      for (const id of free) {
        if (used.has(id) || P[id].line !== sl.line) continue;
        const r = ratingAt(P[id], s);
        const back = leftAt[id] && leftAt[id].team === team && s - leftAt[id].s <= 2;
        const sc = -Math.abs(r - tgt) - (r < tgt - 5 ? 4 : 0) + (prevTeam[id] === team || stayDown[id] === team ? 4 : 0) - (back ? 6 : 0) + gauss() * 0.8;
        if (sc > bestScore) { bestScore = sc; best = id; }
      }
      if (best == null) {
        const pos = sl.slot.replace(/-.*/, '').replace(/^(L|R)(?=CB$)/, '');
        const gp = genPerson(team);
        const born = s - Math.floor(rnd() * 3);
        best = newPerson({ name: gp.name, pos, line: sl.line, nat: gp.nat, kind: 'gen', born, until: born + 7 + Math.floor(rnd() * 6), peak: Math.round(tgt + 1 + gauss() * 1.5) });
        assign[best] = {};
        free.push(best);
      }
      sl.pid = best; sl.r = ratingAt(P[best], s); used.add(best);
      assign[best][s] = assign[best][s] || { team, prio: 0 };
    });
    XI[s][team] = slotsOf[team].map(x => ({ pid: x.pid, slot: x.slot, line: x.line, r: x.r }));
    // 替补席补到 7 人（至少 1 名门将）：优先上季同队的球员，不够就从自由球员里挑，再不够就生成
    const benchNow = pinned[team].filter(id => !used.has(id));
    benchNow.forEach(id => used.add(id));
    const needLines = ['GK', 'DF', 'DF', 'MF', 'MF', 'FW', 'MF'];
    benchNow.forEach(id => { const k = needLines.indexOf(P[id].line); if (k >= 0) needLines.splice(k, 1); });
    for (const line of needLines.slice(0, Math.max(0, 7 - benchNow.length))) {
      let best = null, bs = -99;
      for (const id of free) { if (used.has(id) || P[id].line !== line) continue; const r = ratingAt(P[id], s); const sc = -Math.abs(r - (tgt - 3)) + (prevTeam[id] === team ? 6 : 0) + gauss() * 0.8; if (sc > bs) { bs = sc; best = id; } }
      if (best == null || bs < -9) {
        const gp = genPerson(team), born = s - Math.floor(rnd() * 3);
        const pos = line === 'GK' ? 'GK' : line === 'DF' ? (rnd() < 0.5 ? 'CB' : rnd() < 0.5 ? 'LB' : 'RB') : line === 'MF' ? (rnd() < 0.5 ? 'CM' : 'CDM') : (rnd() < 0.6 ? 'ST' : 'LW');
        best = newPerson({ name: gp.name, pos, line, nat: gp.nat, kind: 'gen', born, until: born + 7 + Math.floor(rnd() * 6), peak: Math.round(tgt - 3 + gauss() * 1.5) });
        assign[best] = {}; free.push(best);
      }
      used.add(best); assign[best][s] = { team, prio: 1 }; prevTeam[best] = team;
    }
    XI[s][team].forEach(x => { if (prevTeam[x.pid] && prevTeam[x.pid] !== team) leftAt[x.pid] = { team: prevTeam[x.pid], s }; prevTeam[x.pid] = team; delete stayDown[x.pid];
      // 资料库球员提前以自由身来到现在的球队，就从这季起一直留队
      const q = P[x.pid]; if (q.kind === 'db' && team === q.cur && s < (q.join || 18)) { for (let k = s + 1; k < (q.join || 18); k++) put(x.pid, k, team, 2); q.join = s; } });
  }
}

/* ---------- 转会记录 ---------- */
const valueOf = (r, age) => { const base = 15 * Math.exp(0.17 * (r - 80)); const af = age == null ? 1 : age < 24 ? 1.4 : age <= 28 ? 1.15 : age <= 30 ? 0.95 : 0.75; return Math.max(1, Math.round(base * af)); };
const ageAt = (p, s) => p.kind === 'db' ? p.age - (18 - s) : null;
const seasonTeam = {}; // pid -> {s: team}
for (let s = 1; s <= LAST; s++) for (const [t, X] of Object.entries(XI[s])) X.forEach(x => (seasonTeam[x.pid] = seasonTeam[x.pid] || {})[s] = t);
// 在名单上但没首发的赛季也算效力（板凳）
P.forEach((p, id) => { for (const [s, a] of Object.entries(assign[id] || {})) if (a.prio >= 1) (seasonTeam[id] = seasonTeam[id] || {})[s] = a.team; });
const transfers = [];
for (const [id, m] of Object.entries(seasonTeam)) {
  const ss = Object.keys(m).map(Number).sort((a, b) => a - b);
  for (let i = 1; i < ss.length; i++) if (m[ss[i]] !== m[ss[i - 1]]) { const p = P[id]; const r = ratingAt(p, ss[i]); transfers.push([ss[i], +id, m[ss[i - 1]], m[ss[i]], valueOf(r, ageAt(p, ss[i]))]); }
}
// S18：资料库现队与 S17 球队不同
P.forEach((p, id) => { if (p.kind !== 'db' || !seasonTeam[id] || fixedCareer[id]) return; const ss = Object.keys(seasonTeam[id]).map(Number); const last = Math.max(...ss); const from = seasonTeam[id][last]; if (from !== p.cur) transfers.push([18, id, from, p.cur, valueOf(p.dbr, p.age)]); });
// 指定生涯的球员：转会按 careers.json 的顺序生成（含外赛区球队）
for (let i = transfers.length - 1; i >= 0; i--) if (fixedCareer[transfers[i][1]]) transfers.splice(i, 1);
const EXT = new Set();
for (const [id, st] of Object.entries(fixedCareer)) for (let k = 1; k < st.length; k++) {
  const nm = t => { const e = t.endsWith('*'); const n = t.replace(/\*$/, ''); if (e) EXT.add(n); return n; };
  const p = P[id], s = st[k][1];
  transfers.push([s, +id, nm(st[k - 1][0]), nm(st[k][0]), valueOf(s >= 18 && p.dbr ? p.dbr : ratingAt(p, Math.min(s, LAST)), ageAt(p, s))]);
}
transfers.sort((a, b) => a[0] - b[0] || b[4] - a[4]);

/* ---------- 输出：S01–S17 每季 27 支球队的阵容（首发 11 人 + 替补），比赛结果交给网站重新模拟 ---------- */
const OUT = {};
const used = new Set();
const SQUADS = {};
for (let s = 1; s <= LAST; s++) {
  SQUADS[s] = {};
  for (const [t, X] of Object.entries(XI[s])) {
    const onXI = new Set(X.map(x => x.pid));
    const bench = P.map((p, id) => id).filter(id => assign[id] && assign[id][s] && assign[id][s].team === t && !onXI.has(id)).map(id => [id, '', ratingAt(P[id], s)]).sort((a, b) => b[2] - a[2]).slice(0, 12);
    SQUADS[s][t] = X.map(x => [x.pid, x.slot, x.r]).concat(bench);
    SQUADS[s][t].forEach(([id]) => used.add(id));
  }
}
P.forEach((p, i) => { if (p.kind === 'db') used.add(i); });
const rosterLinks = {}, activeSet = new Set();
P.forEach((p, i) => { if (p.kind === 'db') activeSet.add(i); });
for (const [team, T] of Object.entries(TD)) T.roster.forEach(r => {
  const sq = PDB[team] || [];
  if (sq.some(x => clean(x.name) === clean(r.name) || clean(x.name).includes(clean(r.name)) || clean(r.name).includes(clean(x.name)))) return;
  const cands = (byName[clean(r.name)] || []).filter(i => P[i].kind !== 'db' && P[i].kind !== 'gen');
  const id = cands.find(i => Object.values(assign[i] || {}).some(a => a.team === team)) ?? cands[0];
  if (id != null) { rosterLinks[team + '|' + r.name] = id; activeSet.add(id); used.add(id); }
});
P.forEach(p => { if (!p.nat && NATMAP[clean(p.name)]) p.nat = NATMAP[clean(p.name)]; });
const family = [];
P.forEach((p, i) => { if (p.kind === 'db' || p.kind === 'gen' || !used.has(i)) return; (byName[clean(p.name)] || []).forEach(j => { if (j !== i && P[j].kind === 'db') family.push([i, j]); }); });
family.forEach(([f, c]) => { if (!P[f].nat) P[f].nat = P[c].nat; });
const activeTeam = {}; P.forEach((p, i) => { const st = p.stints.find(x => x.ongoing); if (p.kind !== 'db' && st) activeTeam[i] = st.team; });
// 每人第一次出现在阵容里的赛季和当时年龄（网站用来算各季年龄）
const LORE0 = JSON.parse(fs.readFileSync(D + 'lore.json', 'utf8'));
const PRE = new Set(Object.entries(LORE0.players).filter(([k, v]) => v.pre).map(([k]) => k.split('@')[0]));
const first = {}; for (let s = LAST; s >= 1; s--) for (const L of Object.values(SQUADS[s])) L.forEach(([id]) => first[id] = s);
const ageFirst = i => { const p = P[i], f = first[i] || 18; if (p.kind === 'db') return p.age - (18 - f); if (p.kind === 'gen') return 19 + (f - p.born); if (p.kind === 'legend' && PRE.has(p.name) && f === 1) return 30 + Math.floor(((i * 7) % 3)); return 20 + ((i * 13) % 3); };
OUT.players = P.map((p, i) => used.has(i) ? [p.name, p.pos, p.nat || '', p.kind === 'db' ? p.cur : '', p.kind[0], activeSet.has(i) ? 1 : 0, activeTeam[i] || '', p.kind === 'db' ? p.dbr : p.peak, first[i] || 18, ageFirst(i)] : null);
OUT.squads = SQUADS;
OUT.lorePid = {};
for (const [k, v] of Object.entries(LORE0.players)) { const [name, team] = k.split('@'); const ids = byName[clean(name)] || [];
  const hit = ids.find(i => { for (let s = v.span[0]; s <= Math.min(v.span[1], LAST); s++) if (SQUADS[s][team] && SQUADS[s][team].some(([id]) => id === i)) return true; return false; }) ?? ids.find(i => used.has(i) && P[i].kind !== 'gen');
  if (hit != null) OUT.lorePid[k] = hit; }
OUT.rosterLinks = rosterLinks; OUT.family = family; OUT.transfers = transfers; OUT.extClubs = [...EXT];
OUT.s1 = teamsIn(1);
OUT.leagueTeams = Object.fromEntries([...Array(LAST)].map((_, i) => [i + 1, teamsIn(i + 1)]));
fs.writeFileSync(D + 'hist.json', JSON.stringify(OUT));
// 同一季同一队有没有重名
let dup = 0; for (let s = 1; s <= LAST; s++) for (const [t, L] of Object.entries(SQUADS[s])) { const n = L.map(([id]) => P[id].name); if (new Set(n).size !== n.length) { dup++; if (dup < 6) console.log('重名', s, t, n.filter((x, k) => n.indexOf(x) !== k)); } }
console.log('players', OUT.players.filter(Boolean).length, 'generated', P.filter(p => p.kind === 'gen').length, 'dup squads', dup, 'size', (fs.statSync(D + 'hist.json').size / 1e6).toFixed(2) + 'MB');
console.log('S1 威龙', SQUADS[1]['威龙'].map(([id, sl, r]) => P[id].name + (sl ? ':' + sl : '') + ':' + r).join(' '));
console.log('S5 out-of-league sample', Object.keys(SQUADS[5]).filter(t => !teamsIn(5).includes(t)).slice(0, 2).map(t => t + ' ' + SQUADS[5][t].slice(0, 11).map(([id, , r]) => P[id].name + ':' + r).join(',')).join(' | '));
console.log('transfers', transfers.length);
