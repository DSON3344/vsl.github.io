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
const LAST = 17;

/* ---------- RNG ---------- */
let _s = 20261020;
let _s2 = 20261020;
const rnd2 = () => { _s2 |= 0; _s2 = _s2 + 0x6D2B79F5 | 0; let t = Math.imul(_s2 ^ _s2 >>> 15, 1 | _s2); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
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
const put = (id, s, team, prio) => { if (s < 1 || s > LAST || !teamsIn(s).includes(team)) return; const cur = assign[id][s]; if (!cur || cur.prio < prio) assign[id][s] = { team, prio }; };
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
    p.join = join;
    for (let s = Math.max(join, proSeason(p)); s <= LAST; s++) put(id, s, p.cur, 2);
  }
});
P.forEach((p, id) => { if (p.kind === 'db') Object.keys(assign[id]).forEach(s => { if (+s < proSeason(p) && assign[id][s].prio <= 2) delete assign[id][s]; }); });

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
function ratingAt(p, s) {
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
    else { const gk = NAT_GROUP[nat], g = NG[gk]; n = one(g[0]) + one(g[1]); if (k > 60) n = one(FIRST[gk]) + '·' + n; }
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
const target = (s, t) => clubBase(t) + (10.5 - rankIn(s, t)) * 0.3;
const lineOf = sl => LINE(sl.replace(/-.*/, ''));
for (let s = 1; s <= LAST; s++) {
  XI[s] = {};
  const used = new Set();
  const pinned = {}; teamsIn(s).forEach(t => pinned[t] = []);
  P.forEach((p, id) => { const a = assign[id][s]; if (a && a.prio >= 2) pinned[a.team].push(id); });
  // 自由球员
  const free = [];
  P.forEach((p, id) => {
    if (assign[id][s] && assign[id][s].prio >= 2) return;
    if (p.kind === 'db') { if (s >= proSeason(p) && s < (p.join || 18)) free.push(id); }
    else if (p.kind === 'gen' && s >= p.born && s <= p.until) free.push(id);
  });
  const slotsOf = {};
  for (const team of teamsIn(s)) {
    const slots = TD[team].roster.map(r => ({ slot: r.pos, line: lineOf(r.pos), pid: null }));
    const cands = pinned[team].map(id => ({ id, pr: assign[id][s].prio >= 3 ? 1 : 0, r: ratingAt(P[id], s), line: P[id].line, pos: P[id].pos })).sort((a, b) => b.pr - a.pr || b.r - a.r);
    for (const c of cands) {
      const sl = slots.find(x => !x.pid && x.line === c.line && clean(x.slot).replace(/-.*/, '') === c.pos) || slots.find(x => !x.pid && x.line === c.line);
      if (sl) { sl.pid = c.id; sl.r = c.r; used.add(c.id); }
    }
    slotsOf[team] = slots;
  }
  for (const team of teamsIn(s)) {
    const tgt = target(s, team);
    slotsOf[team].forEach(sl => {
      if (sl.pid != null) return;
      let best = null, bestScore = -7;
      for (const id of free) {
        if (used.has(id) || P[id].line !== sl.line) continue;
        const r = ratingAt(P[id], s);
        const sc = -Math.abs(r - tgt) - (r < tgt - 5 ? 4 : 0) + (prevTeam[id] === team ? 4 : 0) + gauss() * 0.8;
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
    XI[s][team].forEach(x => prevTeam[x.pid] = team);
  }
}

/* ---------- 转会记录 ---------- */
const valueOf = (r, age) => { const base = 15 * Math.exp(0.17 * (r - 80)); const af = age == null ? 1 : age < 24 ? 1.4 : age <= 28 ? 1.15 : age <= 30 ? 0.95 : 0.75; return Math.max(1, Math.round(base * af)); };
const ageAt = (p, s) => p.kind === 'db' ? p.age - (18 - s) : null;
const seasonTeam = {}; // pid -> {s: team}
for (let s = 1; s <= LAST; s++) for (const [t, X] of Object.entries(XI[s])) X.forEach(x => (seasonTeam[x.pid] = seasonTeam[x.pid] || {})[s] = t);
// 在名单上但没首发的赛季也算效力（板凳）
P.forEach((p, id) => { for (const [s, a] of Object.entries(assign[id] || {})) if (a.prio >= 2) (seasonTeam[id] = seasonTeam[id] || {})[s] = a.team; });
const transfers = [];
for (const [id, m] of Object.entries(seasonTeam)) {
  const ss = Object.keys(m).map(Number).sort((a, b) => a - b);
  for (let i = 1; i < ss.length; i++) if (m[ss[i]] !== m[ss[i - 1]]) { const p = P[id]; const r = ratingAt(p, ss[i]); transfers.push([ss[i], +id, m[ss[i - 1]], m[ss[i]], valueOf(r, ageAt(p, ss[i]))]); }
}
// S18：资料库现队与 S17 球队不同
P.forEach((p, id) => { if (p.kind !== 'db' || !seasonTeam[id]) return; const ss = Object.keys(seasonTeam[id]).map(Number); const last = Math.max(...ss); const from = seasonTeam[id][last]; if (from !== p.cur) transfers.push([18, id, from, p.cur, valueOf(p.dbr, p.age)]); });
transfers.sort((a, b) => a[0] - b[0] || b[4] - a[4]);

/* ---------- 推演比赛：结果服从官网名次，比分和球员数据自然产生 ---------- */
function fixtures(teams) {
  const n = teams.length, arr = teams.slice(1), rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const ring = [teams[0], ...arr], ms = [];
    for (let i = 0; i < n / 2; i++) { const a = ring[i], b = ring[n - 1 - i]; ms.push((r + i) % 2 === 0 ? [a, b] : [b, a]); }
    rounds.push(ms); arr.unshift(arr.pop());
  }
  return rounds.concat(rounds.map(ms => ms.map(([a, b]) => [b, a])));
}
const WEATHERS = ['晴天', '阴天', '雨天'], SLOTS = ['早上', '上午', '中午', '下午', '傍晚', '晚上', '深夜', '凌晨'];


const pois = (l, k) => { let p = Math.exp(-l); for (let i = 1; i <= k; i++) p *= l / i; return p; };
function outcomeProbs(lh, la) { let H = 0, Dw = 0, A = 0; for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) { const q = pois(lh, i) * pois(la, j); if (i > j) H += q; else if (i === j) Dw += q; else A += q; } return { 1: H, 0: Dw, '-1': A }; }
function poissonSample(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }
function simulateSeason(s) {
  const teams = teamsIn(s), N = teams.length;
  const str = teams.map(t => XI[s][t].reduce((a, x) => a + x.r, 0) / 11);
  const order = shuffle(teams.map((_, i) => i));
  const M = []; fixtures(order).forEach((ms, ri) => ms.forEach(([h, a]) => {
    const d = str[h] - str[a];
    const lh = 1.3 * Math.exp(0.034 * d) * 1.08, la = 1.3 * Math.exp(-0.034 * d) * 0.93;
    const pr = outcomeProbs(lh, la);
    M.push({ ri, h, a, lh, la, lp: { 1: Math.log(pr[1]), 0: Math.log(pr[0]), '-1': Math.log(pr[-1]) }, o: 0, hg: 0, ag: 0 });
  }));
  const W = new Array(N).fill(0), Dd = new Array(N).fill(0), L = new Array(N).fill(0);
  const apply = (m, sg) => { if (m.o === 1) { W[m.h] += sg; L[m.a] += sg; } else if (m.o === 0) { Dd[m.h] += sg; Dd[m.a] += sg; } else { L[m.h] += sg; W[m.a] += sg; } };
  M.forEach(m => { const r = rnd(), pH = Math.exp(m.lp[1]), pD = Math.exp(m.lp[0]); m.o = r < pH ? 1 : r < pH + pD ? 0 : -1; apply(m, 1); });
  const pts = i => W[i] * 3 + Dd[i];
  const viol = () => { let c = 0; for (let i = 0; i < N - 1; i++) { const d = pts(i + 1) - pts(i); if (d > 0) c += d + 1; else if (d === 0) c += 0.3; } return c; };
  const hard = () => { for (let i = 0; i < N - 1; i++) if (pts(i + 1) > pts(i)) return true; return false; };
  // 以 T=1 采样（保持比赛结果的随机性），名次约束的权重逐步加大，满足后变成硬约束
  const ties = () => { let c = 0; for (let i = 0; i < N - 1; i++) if (pts(i) === pts(i + 1)) c++; return c; };
  let v = viol();
  const IT = 300000;
  for (let it = 0; it < IT * 4; it++) {
    const m = M[Math.floor(rnd() * M.length)];
    const old = m.o, nw = [1, 0, -1].filter(x => x !== old)[Math.floor(rnd() * 2)];
    apply(m, -1); m.o = nw; apply(m, 1);
    let dc = m.lp[old] - m.lp[nw];
    if (it < IT) { const v2 = viol(); dc += (0.5 + 30 * it / IT) * (v2 - v); if (dc <= 0 || rnd() < Math.exp(-dc)) { v = v2; continue; } }
    else { if (hard()) { const v2 = viol(); dc += 40 * (v2 - v); if (dc <= 0 || rnd() < Math.exp(-dc)) { v = v2; continue; } }
      else { const okNow = !hard(); if (okNow) { const t2 = ties(); dc += 1.0 * t2; if (dc <= 0 || rnd() < Math.exp(-dc)) { v = viol(); continue; } } } }
    apply(m, -1); m.o = old; apply(m, 1);
  }
  // 若仍有名次冲突，用贪心修正
  for (let k = 0; k < 200000 && hard(); k++) {
    const m = M[Math.floor(rnd() * M.length)];
    const old = m.o, nw = [1, 0, -1].filter(x => x !== old)[Math.floor(rnd() * 2)];
    const v0 = viol(); apply(m, -1); m.o = nw; apply(m, 1);
    if (viol() > v0) { apply(m, -1); m.o = old; apply(m, 1); }
  }
  // 比分：按期望进球抽样，并与胜平负一致
  const sampleScore = m => { for (let k = 0; k < 400; k++) { const h = poissonSample(m.lh), a = poissonSample(m.la); if ((m.o === 1 && h > a) || (m.o === 0 && h === a) || (m.o === -1 && h < a)) return [h, a]; } return m.o === 1 ? [1, 0] : m.o === 0 ? [1, 1] : [0, 1]; };
  M.forEach(m => { [m.hg, m.ag] = sampleScore(m); });
  const GF = new Array(N).fill(0), GA = new Array(N).fill(0);
  const recount = () => { GF.fill(0); GA.fill(0); M.forEach(m => { GF[m.h] += m.hg; GA[m.h] += m.ag; GF[m.a] += m.ag; GA[m.a] += m.hg; }); };
  recount();
  const tieBad = () => { const bad = []; for (let i = 0; i < N - 1; i++) if (pts(i) === pts(i + 1)) { const a = GF[i] - GA[i], b = GF[i + 1] - GA[i + 1]; if (b > a || (b === a && GF[i + 1] >= GF[i])) bad.push(i); } return bad; };
  for (let k = 0; k < 20000; k++) {
    const bad = tieBad(); if (!bad.length) break;
    const i = bad[Math.floor(rnd() * bad.length)], t = rnd() < 0.5 ? i : i + 1;
    const ms = M.filter(m => m.h === t || m.a === t); const m = ms[Math.floor(rnd() * ms.length)];
    const old = [m.hg, m.ag]; [m.hg, m.ag] = sampleScore(m); recount();
    if (tieBad().length > bad.length) { [m.hg, m.ag] = old; recount(); }
  }
  const table = teams.map((t, i) => ({ t, i, w: W[i], d: Dd[i], l: L[i], gf: GF[i], ga: GA[i], pts: pts(i) }));
  const sorted = table.slice().sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  const exp = teams.map((_, i) => M.reduce((a, m) => a + (m.h === i ? 3 * Math.exp(m.lp[1]) + Math.exp(m.lp[0]) : m.a === i ? 3 * Math.exp(m.lp[-1]) + Math.exp(m.lp[0]) : 0), 0));
  if (process.env.DBG) console.log('S' + s, 'str', str.map(x => x.toFixed(0)).join(','), '| exp', exp.map(x => x.toFixed(0)).join(','), '| got', table.map(r => r.pts).join(','));
  return { teams, M, table, orderOk: sorted.every((r, k) => r.i === k) };
}

/* ---------- 比赛事件与球员数据 ---------- */
const PS = {}, CS = {}, OUT = { seasons: {} };
const stat = (s, pid, team) => { const o = (PS[s] = PS[s] || {}); return o[pid] || (o[pid] = { team, apps: 0, min: 0, g: 0, a: 0, y: 0, r: 0, sh: 0, ot: 0, tk: 0, sv: 0, cs: 0, motm: 0, rs: 0, kp: 0, int: 0, ps: 0, pc: 0, pg: 0, pm: 0 }); };
const attrOf = pid => (P[pid].kind === 'db' && (PDB[P[pid].cur] || []).find(q => q.name === P[pid].name) || {}).attributes;
const report = [];
for (let s = 1; s <= LAST; s++) {
  const R = simulateSeason(s);
  const { teams, M } = R;
  const goals = M.reduce((a, m) => a + m.hg + m.ag, 0);
  report.push(`S${s} 名次${R.orderOk ? '一致' : '不一致'} · 冠军 ${R.table[0].pts} 分 · 场均进球 ${(goals / M.length).toFixed(2)}`);
  const xi = teams.map(t => XI[s][t]);
  const csT = {}; teams.forEach(t => csT[t] = { poss: 0, sh: 0, ot: 0, tk: 0, sv: 0, cor: 0, y: 0, rc: 0, cs: 0, hp: 0, ap: 0, ps: 0, pc: 0, pg: 0, pm: 0 });
  const rounds = [];
  M.forEach(m => {
    const ev = { goals: [], cards: [], pmiss: [] };
    [[m.h, m.hg], [m.a, m.ag]].forEach(([ti, g]) => {
      const X = xi[ti];
      const wG = X.map(x => POS_GOAL(x.slot) * Math.pow(x.r / 85, 3) * Math.pow(((attrOf(x.pid) || {}).sho || x.r) / 80, 2));
      const wA = X.map(x => POS_AST(x.slot) * Math.pow(x.r / 85, 3) * Math.pow(((attrOf(x.pid) || {}).pas || x.r) / 80, 2));
      for (let k = 0; k < g; k++) {
        const sc = pick(X, wG);
        let as = -1;
        if (rnd() < 0.78) { const w = X.map((x, j) => x === sc ? 0 : wA[j]); as = pick(X, w).pid; }
        let mn = 1 + Math.floor(rnd() * 90); if (mn === 90 && rnd() < 0.6) mn = 91 + Math.floor(rnd() * 4);
        ev.goals.push([mn, ti, sc.pid, as, 0]);
      }
      // 点球（独立随机数，不影响其余推演）：部分进球改由点球手罚进，另有少量罚丢
      const taker = X.filter(x => x.line !== 'GK').reduce((b, x) => { const v = ((attrOf(x.pid) || {}).sho || x.r) + (/ST/.test(x.slot) ? 4 : /AM|W/.test(x.slot) ? 2 : 0) + x.r * 0.2; return v > b.v ? { x, v } : b; }, { x: null, v: -1 }).x;
      ev.goals.forEach(gl => { if (gl[1] === ti && taker && rnd2() < 0.07) { gl[2] = taker.pid; gl[3] = -1; gl[4] = 1; } });
      if (taker && rnd2() < 0.032) ev.pmiss.push([ti, taker.pid, rnd2() < 0.62 ? 1 : 0]);
      const press = /逼抢|压制|对抗|防守/.test(TD[teams[ti]].style || '');
      const wC = X.map(x => (x.line === 'DF' ? 2 : /DM/.test(x.slot) ? 2.6 : x.line === 'MF' ? 1.3 : x.line === 'GK' ? 0.15 : 0.8));
      const ny = poissonSample(1.6 + (press ? 0.4 : 0));
      const yc = {};
      for (let k = 0; k < ny; k++) { const x = pick(X, wC); const mn = 5 + Math.floor(rnd() * 88); yc[x.pid] = (yc[x.pid] || 0) + 1; ev.cards.push([mn, ti, yc[x.pid] === 2 ? 1 : 0, x.pid]); }
      if (rnd() < 0.04) { const x = pick(X, wC); ev.cards.push([10 + Math.floor(rnd() * 80), ti, 1, x.pid]); }
    });
    ev.goals.sort((a, b) => a[0] - b[0]); ev.cards.sort((a, b) => a[0] - b[0]);
    const sides = [[m.h, m.hg, m.ag], [m.a, m.ag, m.hg]];
    const avg = ti => xi[ti].reduce((a, x) => a + x.r, 0) / 11;
    const poss = Math.round(Math.max(30, Math.min(70, 51.5 + (avg(m.h) - avg(m.a)) * 1.6 + gauss() * 5)));
    const shots = [Math.max(m.hg + 1, Math.round(m.lh * 4.2 + 6 + gauss() * 2.5)), Math.max(m.ag + 1, Math.round(m.la * 4.2 + 6 + gauss() * 2.5))];
    const ots = shots.map((sh, k) => { const g = k ? m.ag : m.hg; return Math.max(g, Math.min(sh, Math.round(sh * (0.34 + rnd() * 0.14)))); });
    const pmOf = k => ev.pmiss.filter(x => x[0] === (k ? m.a : m.h));
    [0, 1].forEach(k => { const pm = pmOf(k), g = k ? m.ag : m.hg; shots[k] = Math.max(shots[k], g + 1 + pm.length); ots[k] = Math.min(shots[k], Math.max(ots[k], g + pm.filter(x => x[2]).length)); });
    const rows = sides.map(([ti, gf, ga], k) => {
      const X = xi[ti];
      const idx = id => X.findIndex(x => x.pid === id);
      return ENGINE.sideStats(X.map(x => ({ slot: x.slot, line: x.line, r: x.r, attr: attrOf(x.pid) })), {
        goals: ev.goals.filter(g => g[1] === ti).map(g => [idx(g[2]), g[3] >= 0 ? idx(g[3]) : -1, g[4]]),
        pmiss: pmOf(k).map(x => [idx(x[1]), x[2]]),
        cards: ev.cards.filter(c => c[1] === ti).map(c => [idx(c[3]), c[2], c[0]]),
        shots: shots[k], ot: ots[k], oppOt: ots[1 - k], gf, ga, poss: k ? 100 - poss : poss, press: /防守|逼抢|压制|摆大巴|对抗/.test(TD[teams[ti]].style || ''),
      }).map((r, q) => ({ ...r, pid: X[q].pid, rt: r.r }));
    });
    const all = rows.flat(); const motm = all.reduce((a, b) => b.rt > a.rt ? b : a);
    sides.forEach(([ti, gf, ga], k) => {
      const t = teams[ti], c = csT[t];
      c.poss += k ? 100 - poss : poss; c.sh += shots[k]; c.ot += ots[k];
      c.tk += rows[k].reduce((a, x) => a + x.tk, 0); c.sv += rows[k].reduce((a, x) => a + x.sv, 0);
      c.cor += Math.round(shots[k] * 0.38 + rnd() * 3); if (ga === 0) c.cs++;
      const p = gf > ga ? 3 : gf === ga ? 1 : 0; if (k) c.ap += p; else c.hp += p;
      ev.cards.filter(x => x[1] === ti).forEach(x => x[2] ? c.rc++ : c.y++);
      rows[k].forEach(x => {
        const o = stat(s, x.pid, t); o.apps++; o.min += x.min; o.sh += x.sh; o.ot += x.ot; o.tk += x.tk; o.sv += x.sv; o.rs += x.rt; o.g += x.g; o.a += x.a; o.kp += x.kp; o.int += x.int; o.ps += x.ps; o.pc += x.pc; o.pg += x.pg; o.pm += x.pm; c.ps += x.ps; c.pc += x.pc; c.pg += x.pg; c.pm += x.pm;
        if (ga === 0 && x.min >= 60 && (x.line === 'GK' || x.line === 'DF')) o.cs++;
      });
      ev.cards.filter(x => x[1] === ti).forEach(x => { const o = stat(s, x[3], t); x[2] ? o.r++ : o.y++; });
    });
    stat(s, motm.pid, teams[rows[0].includes(motm) ? m.h : m.a]).motm++;
    const w = WEATHERS[Math.floor(rnd() * 3)], sl = SLOTS[Math.floor(rnd() * 8)];
    (rounds[m.ri] = rounds[m.ri] || []).push([m.h, m.a, m.hg, m.ag, w, sl, ev.goals.map(g => [g[0], g[1] === m.h ? 0 : 1, g[2], g[3], g[4]]), ev.cards.map(c => [c[0], c[1] === m.h ? 0 : 1, c[2], c[3]]), motm.pid, poss, shots[0], shots[1]]);
  });
  CS[s] = csT;
  const table = R.table.map(r => ({ team: r.t, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.pts }));
  OUT.seasons[s] = { teams, table, official: SITE.standings[s].map(r => ({ team: r.team, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.w * 3 + r.d })), rounds, xi: Object.fromEntries(teams.map(t => [t, XI[s][t].map(x => [x.pid, x.slot, x.r])])), club: csT };
}

/* ---------- 输出 ---------- */
const used = new Set();
for (const s in PS) for (const id in PS[s]) used.add(+id);
P.forEach((p, i) => { if (p.kind === 'db') used.add(i); });
// 现役阵容里有、球员资料库里没有的名字 -> 历史人物
const rosterLinks = {}, activeSet = new Set();
P.forEach((p, i) => { if (p.kind === 'db') activeSet.add(i); if (p.stints.some(st => st.end === LAST && PDF.legends && true)) {} });
for (const [team, list] of Object.entries(PDF.legends)) list.forEach(l => { if (false) { const id = (byName[clean(l.name.replace(/^.*换成/, ''))] || []).find(i => P[i].stints.some(st => st.team === team)); if (id != null) activeSet.add(id); } });
for (const [team, T] of Object.entries(TD)) T.roster.forEach(r => {
  const sq = PDB[team] || [];
  if (sq.some(x => clean(x.name) === clean(r.name) || clean(x.name).includes(clean(r.name)) || clean(r.name).includes(clean(x.name)))) return;
  const cands = (byName[clean(r.name)] || []).filter(i => P[i].kind !== 'db' && P[i].kind !== 'gen');
  const id = cands.find(i => Object.values(assign[i] || {}).some(a => a.team === team)) ?? cands[0];
  if (id != null) { rosterLinks[team + '|' + r.name] = id; activeSet.add(id); used.add(id); }
});
P.forEach(p => { if (!p.nat && NATMAP[clean(p.name)]) p.nat = NATMAP[clean(p.name)]; });
OUT.rosterLinks = rosterLinks;
// 撞名 = 父子：历史球员与同名的现役资料库球员
const family = [];
P.forEach((p, i) => { if (p.kind === 'db' || p.kind === 'gen' || !used.has(i)) return; (byName[clean(p.name)] || []).forEach(j => { if (j !== i && P[j].kind === 'db') family.push([i, j]); }); });
OUT.family = family;
family.forEach(([f, c]) => { if (!P[f].nat) P[f].nat = P[c].nat; });
const activeTeam = {}; P.forEach((p, i) => { const st = p.stints.find(x => x.ongoing); if (p.kind !== 'db' && st) activeTeam[i] = st.team; });
OUT.players = P.map((p, i) => used.has(i) ? [p.name, p.pos, p.nat || '', p.kind === 'db' ? p.cur : '', p.kind[0], activeSet.has(i) ? 1 : 0, activeTeam[i] || '', p.kind === 'db' ? p.dbr : p.peak] : null);
OUT.pstats = {};
for (const s in PS) OUT.pstats[s] = Object.entries(PS[s]).map(([id, o]) => [+id, o.team, o.apps, o.min, o.g, o.a, o.y, o.r, o.sh, o.ot, o.tk, o.sv, o.cs, o.motm, Math.round(o.rs * 10), o.kp, o.int, o.ps, o.pc, o.pg, o.pm]);
OUT.officialStats = SITE.stats;
OUT.transfers = transfers;
OUT.officialAllTime = SITE.standings.history;
fs.writeFileSync(D + 'hist.json', JSON.stringify(OUT));
console.log(report.join('\n'));
console.log('players', OUT.players.filter(Boolean).length, 'generated', P.filter(p => p.kind === 'gen').length, 'size', (fs.statSync(D + 'hist.json').size / 1e6).toFixed(2) + 'MB');
for (const s of [1, 9, 17]) console.log('S' + s, Object.entries(PS[s]).map(([id, o]) => [P[id].name, o.team, o.g]).sort((a, b) => b[2] - a[2]).slice(0, 6).map(x => x.join(' ')).join(' | '));
console.log('transfers', transfers.length);
