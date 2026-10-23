/* 威联赛 W01–W50：一次生成的固定历史（威超 S01 的前身）
   输入：hist.json（S01 起的球员与名单）、lore.json（传奇设定）、teams_data.js
   输出：wl.json
   规则：
   - 27 支俱乐部，每季 20 队踢威联赛，其余踢次级联赛；每季降 3 升 3
   - W01–W36 的球员全部原创；威超 S01 那批人按 S01 时的年龄倒推，大约 W37–W40 出道
   - 传奇球员的威联赛时代数据（出场 / 进球 / 助攻 / 金球 / 金手套）对齐 lore.json 的 pre
   - W50 结束后联赛改制为威超，W50 的参赛队里前 17 名 + 次级联赛升上来的 3 队 = 威超 S01 的 20 队 */
const fs = require('fs'), vm = require('vm');
const D = __dirname + '/';
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(D + 'teams_data.js', 'utf8'), ctx);
const TD = ctx.window.TEAMS_DATA;
const HIST = JSON.parse(fs.readFileSync(D + 'hist.json', 'utf8'));
const LORE = JSON.parse(fs.readFileSync(D + 'lore.json', 'utf8'));
const PL = HIST.players;
// 名字生成：沿用 build_history.js 的音节表
{ const src = fs.readFileSync(D + 'build_history.js', 'utf8'); const a = src.indexOf('const NG = {'), b = src.indexOf('const usedNames'); vm.runInContext(src.slice(a, b).replace(/^const /gm, 'var '), ctx); }
const { NG, NAT_GROUP, MID, KR, JP } = ctx;

const PARAMS = (() => { try { return JSON.parse(fs.readFileSync(D + 'wl_params.json', 'utf8')); } catch (e) { return {}; } })();
let SEED = +(process.argv[2] || PARAMS.seed || 51001);
function mkRng(seed) { let s = seed >>> 0; return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rnd = mkRng(SEED);
const one = a => a[Math.floor(rnd() * a.length)];
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const pois = l => { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const LINE = p => p === 'GK' ? 'GK' : /CB|LB|RB|WB/.test(p) ? 'DF' : /DM|CM|LM|RM|AM/.test(p) ? 'MF' : 'FW';
const W = 50;

const CLUBS = Object.keys(TD);
const CI = Object.fromEntries(CLUBS.map((c, i) => [c, i]));
const S1 = HIST.s1.slice();
// 俱乐部底蕴：S01 名单前 11 人均分；早年按随机的「黄金时代」起伏，越接近 W50 越贴近 S01 的实力
const base = {}; CLUBS.forEach(c => { const l = ((HIST.squads['1'] || {})[c] || []).map(x => x[2]).sort((a, b) => b - a).slice(0, 11); base[c] = l.length ? l.reduce((a, b) => a + b, 0) / l.length : 80; });
const wave = {}; CLUBS.forEach(c => { wave[c] = { ph: rnd() * 6.28, fr: 0.06 + rnd() * 0.12, amp: 2 + rnd() * 1.8, tilt: gauss() * 0.5 }; });
// DSON 设定的威联赛时期（W01–W50）俱乐部纵观实力，按综合实力排序
const TIER = { S: ['威龙', '猎豹', '金狮', '猛虎', '狂蜂'], A: ['威尔福特', '切狐', '阿尔法骑士', '猛龙', '罗联', '森利西亚虎'], B: ['花豹', '蜜蜂', '飞鹰', '炎狼', '华尔兹', '龙王宫殿', '科摩多尊龙', '沃特梅兹', '泽尼联', '普雷斯顿', '岚', '罗杰剧院', '雷克夏', '威廉斯', '拉普兰德', '威尔顿联'] };
const TVAL = {}; TIER.S.forEach((c, k) => TVAL[c] = 89.6 - k * 0.15 * k); TIER.A.forEach((c, k) => TVAL[c] = 87.4 - k * 0.35); TIER.B.forEach((c, k) => TVAL[c] = 84.4 - k * 0.28);
CLUBS.forEach(c => { if (TVAL[c] == null) TVAL[c] = 80; });
// 没进威超 S01 的俱乐部：W40 之后逐渐衰落（财政困难、卖掉主力）
const prest = (c, w) => { if (c === '威尔福特' && w >= 44) return prest0(c, w) + Math.min(3, (w - 43) * 0.8); return prest0(c, w); };
const prest0 = (c, w) => { const v = wave[c], lam = clamp((w - 38) / 10, 0, 0.8); return (1 - lam) * (TVAL[c] + v.amp * Math.sin(v.ph + w * v.fr) + v.tilt) + lam * base[c] - (S1.includes(c) ? 0 : Math.max(0, w - 38) * 0.9); };

/* ---------- 球员 ---------- */
const P = [];   // { name, nat, pos, born, pid, peak, pAge, club, ret, mult:{g,a}, curve }
const usedNames = new Set(PL.filter(Boolean).map(p => p[0]));
const NATPOOL = PL.filter(p => p && p[2]).map(p => p[2]);
function genName(nat) {
  for (let k = 0; k < 900; k++) {
    let n;
    if (nat === '韩国') n = one(KR[0]) + one(KR[1]) + one(KR[2]);
    else if (nat === '日本') n = one(JP[0]) + one(JP[1]);
    else { const gk = NAT_GROUP[nat] || 'en', g = NG[gk]; n = k < 80 ? one(g[0]) + one(g[1]) : one(g[0]) + one(MID[gk]) + one(g[1]); }
    if (!usedNames.has(n)) { usedNames.add(n); return n; }
  }
  return null;
}
const POS_NEED = { GK: 3, DF: 8, MF: 7, FW: 5 };
const POS_OF = { GK: ['GK'], DF: ['CB', 'CB', 'LB', 'RB'], MF: ['CDM', 'CM', 'CM', 'CAM'], FW: ['ST', 'LW', 'RW', 'ST'] };
function newGen(club, w, line, star) {
  let nat = one(NATPOOL); if (!NAT_GROUP[nat] && nat !== '韩国' && nat !== '日本') nat = one(['英格兰', '西班牙', '巴西', '德国', '法国', '荷兰', '阿根廷', '意大利']);
  const name = genName(nat) || genName('英格兰');
  const age = 17 + Math.floor(rnd() * 3);
  const pr = prest(club, w + 6);
  const peak = star ? (line === 'DF' ? 90 + rnd() * 2 : 91 + rnd() * 3) : clamp(pr - 1.5 + gauss() * 3.4, 70, line === 'DF' ? 92 : 93);
  const p = { name, nat, pos: one(POS_OF[line]), born: w - age, pid: -1, peak: Math.round(peak), pAge: 26 + Math.floor(rnd() * 4), club, ret: 33 + Math.floor(rnd() * 5), mult: { g: 1, a: 1 }, kind: 'gen' };
  P.push(p); return P.length - 1;
}
const ageOf = (p, w) => w - p.born;
function ratingOf(p, w) {
  const a = ageOf(p, w);
  if (p.kind === 'mod') return p.rf(a);
  let r;
  if (a < p.pAge) r = p.peak - Math.pow(p.pAge - a, 1.25) * 1.05;
  else if (a <= p.pAge + 3) r = p.peak;
  else r = p.peak - Math.pow(a - p.pAge - 3, 1.2) * 1.5;
  return Math.round(clamp(r, 55, 99));
}

// 现代球员（威超资料里的人）：按 S01 时的年龄倒推威联赛生涯
const LPID = HIST.lorePid || {}, LORE_BY_PID = {};
Object.entries(LPID).forEach(([k, pid]) => { const o = LORE.players[k]; if (o && o.pre) LORE_BY_PID[pid] = { key: k, ...o.pre, team: k.split('@')[1] }; });
const T0 = new Set((LORE.tiersAll.T0 || []).map(k => LPID[k]));
const firstSq = {}; // pid -> {s, team, rating}
Object.keys(HIST.squads).map(Number).sort((a, b) => a - b).forEach(s => Object.entries(HIST.squads[s]).forEach(([t, l]) => l.forEach(([pid, , r]) => { if (!firstSq[pid]) firstSq[pid] = { s, team: t, r }; })));
const MOD = {}; // pid -> P index
PL.forEach((pp, pid) => {
  if (!pp || !firstSq[pid]) return;
  const f = firstSq[pid].s, aF = pp[9]; if (aF == null) return;
  const a1 = aF - (f - 1);                 // S01 时的年龄
  const lore = LORE_BY_PID[pid];
  const debA = lore ? null : 17 + Math.floor(rnd() * 2);
  if (!lore && a1 - debA < 1) return;      // S01 之前还没出道
  const rF = firstSq[pid].r, peak = pp[7] || rF;
  const p = { name: pp[0], nat: pp[2], pos: pp[1] || 'CM', born: 51 - a1, pid, peak, pAge: 0, club: CI[firstSq[pid].team] != null ? firstSq[pid].team : null, kind: 'mod', mult: { g: 1, a: 1 }, debut: lore ? null : 51 - (a1 - debA), lore: lore || null };
  if (lore) {
    // 传奇：早熟，20 岁前后就到达巅峰；按设定的出场数定出道季（每季约 44 场）
    const seasons = Math.round(lore.apps / 44);
    p.debut = Math.max(33, 51 - seasons); p.club = lore.team;
    const fast = T0.has(pid) ? 19 : 21;
    p.rf = a => Math.round(clamp(a < fast ? peak - (fast - a) * 1.7 : peak, 60, 99));
  } else {
    const aFirst = aF, top = Math.min(aFirst, 26);
    p.rf = a => Math.round(clamp(rF - Math.max(0, top - a) * 1.45, 56, 99));
  }
  if (p.club == null) return;
  if (lore && ['范文西@威龙', '基尔特斯@威龙', '罗纳德@威龙'].includes(lore.key)) lore.legend = 'VJR 三叉戟';
  if (lore && ['金格森@猎豹', '梅东斯@猎豹', '本泰克@猎豹'].includes(lore.key)) lore.legend = '猎豹三叉戟';
  if (lore && lore.key === '沃夫伦@威尔福特') lore.legend = '威尔福特三叉戟';
  // 威尔福特 W45 崛起：萨科、沃夫伦、马尔科姆的进攻三叉戟（马尔科姆 16 岁 W46 出道）
  if (pid === 771 || pid === 770) { p.lore = { legend: '威尔福特三叉戟' }; p.club = '威尔福特'; if (pid === 770) p.debut = 46; }
  if (!lore && !S1.includes(p.club)) { const sim = S1.slice().sort((x, y) => Math.abs(base[x] - base[p.club]) - Math.abs(base[y] - base[p.club])); p.club = sim[Math.floor(rnd() * 4)]; p.s01Club = firstSq[pid].team; }
  const m = (PARAMS.mult || {})[pid]; if (m) p.mult = { g: m[0], a: m[1] };
  P.push(p); MOD[pid] = P.length - 1;
});

// DSON 设定的威联赛专属球星（只在威联赛时期效力，W50 前退役）
const LEGENDS = [
  // 威龙 第一代进攻三叉戟「MVP」W05–W09
  ['摩德赛', 'LW', '葡萄牙', '威龙', 2, 5, 9, 12, 93, 'MVP 三叉戟'], ['凡恩', 'ST', '荷兰', '威龙', 2, 5, 9, 12, 93, 'MVP 三叉戟'], ['佩雷拉', 'RW', '巴西', '威龙', 2, 5, 9, 12, 92.5, 'MVP 三叉戟'],
  // 威龙 第二代进攻三叉戟「3M」W20–W30
  ['穆斯科茨', 'LW', '苏格兰', '威龙', 17, 20, 30, 32, 93, '3M 三叉戟'], ['莫林', 'ST', '法国', '威龙', 17, 20, 30, 32, 93, '3M 三叉戟'], ['迈凯伦', 'RW', '英格兰', '威龙', 17, 20, 30, 32, 92.5, '3M 三叉戟'],
  // 威龙 历史最强右后卫
  ['巴赫雷拉', 'RB', '西班牙', '威龙', 43, 43, 50, 50, 94.5, '历史最强右后卫'],
  // 猎豹 威联赛时期最强双中场
  ['曼祖基奇', 'CM', '克罗地亚', '猎豹', 35, 40, 50, 50, 93.5, '最强双中场'], ['沃尔斯特', 'CM', '德国', '猎豹', 35, 40, 50, 50, 93.5, '最强双中场'],
  // 猛龙 威联赛时期最强进攻三叉戟「3佩」，W50 落幕
  ['佩德洛', 'LW', '西班牙', '猛龙', 36, 43, 50, 50, 94, '3佩 三叉戟'], ['佩雷斯', 'ST', '阿根廷', '猛龙', 36, 43, 50, 50, 94, '3佩 三叉戟'], ['佩德格', 'RW', '葡萄牙', '猛龙', 36, 43, 50, 50, 94, '3佩 三叉戟'],
];
LEGENDS.forEach(([name, pos, nat, club, debut, pf, pt, last, peak, tag]) => {
  usedNames.add(name);
  const rf = a => { const w = a + born; return Math.round(clamp(w < pf ? peak - (pf - w) * 1.7 : w > pt ? peak - (w - pt) * 2.2 : peak, 60, 99)); };
  const born = debut - (name === '巴赫雷拉' ? 24 : 18);
  P.push({ name, nat, pos, born, pid: -1, peak: Math.round(peak), club, kind: 'mod', mult: { g: LINE(pos) === 'FW' ? 1.35 : pos === 'RB' ? 1.6 : 1, a: LINE(pos) === 'MF' ? 1.4 : pos === 'RB' ? 9 : 1 }, debut, last, lore: { legend: tag }, rf });
});

/* ---------- 外赛区对手（洲际赛） ---------- */
const FOREIGN = ['阿罗拉', '莱纳', '狮鹫', '阿伯杜拉', '银河联队', '凤凰', '蛮城', '礼物铺', '阿仙纳', '切尔锡', '蛮联', '热茨', '皇族马', '巴瑟雷纳', '马体会', '瓦伦溪亚', '塞唯利亚', '白仁梅尼黑', '多德蒙特', '勒沃酷森', '国际梅兰', '尊云杜斯', '拿浦勒斯', 'BD米兰', '罗玛', '巴黎圣泽门', '玛赛', '本菲咖', '波耳图', '阿贾克丝', '凯耳特人', '博咖青年', '河牀'];
const FSTR = {}; FOREIGN.forEach((c, i) => FSTR[c] = { b: 2.5 - i * 0.12 + gauss() * 0.8, ph: rnd() * 6.28 });

/* ---------- 赛季模拟 ---------- */
const squads = {}; CLUBS.forEach(c => squads[c] = []);
function lineOf(i) { return LINE(P[i].pos); }
function fillSquad(c, w) {
  const sq = squads[c];
  // 新星：每季全联赛约 1 名（豪门机会大）
  for (const line of ['GK', 'DF', 'MF', 'FW']) {
    let n = sq.filter(i => lineOf(i) === line).length;
    while (n < POS_NEED[line]) { const star = line !== 'GK' && rnd() < 0.012 * (prest(c, w) > 88 ? 2 : 1); sq.push(newGen(c, w, line, star)); n++; }
  }
}
const seasons = [];
let league = CLUBS.slice().sort((a, b) => prest(b, 1) - prest(a, 1)).slice(0, 20);
// 起始阵容：每队按位置配齐，年龄错开
CLUBS.forEach(c => { for (const line of ['GK', 'DF', 'MF', 'FW']) for (let k = 0; k < POS_NEED[line]; k++) { const i = newGen(c, 1, line, false); P[i].born -= Math.floor(rnd() * 14); squads[c].push(i); } });

let RCACHE = {};
function ranked(c, w) { const k = c + '|' + w; return RCACHE[k] || (RCACHE[k] = squads[c].map(i => ({ i, r: ratingOf(P[i], w), l: lineOf(i) })).sort((a, b) => (b.r + (P[b.i].lore ? 6 : 0)) - (a.r + (P[a.i].lore ? 6 : 0)))); }
function pickXI(c, w, avail) {
  const sq = ranked(c, w).filter(x => avail(x.i));
  const by = l => sq.filter(x => x.l === l);
  const gk = by('GK').slice(0, 1), df = by('DF').slice(0, 4), mf = by('MF').slice(0, 3), fw = by('FW').slice(0, 3);
  let xi = gk.concat(df, mf, fw);
  if (xi.length < 11) { const rest = sq.filter(x => !xi.includes(x)).sort((a, b) => b.r - a.r); xi = xi.concat(rest.slice(0, 11 - xi.length)); }
  const bench = sq.filter(x => !xi.includes(x)).sort((a, b) => b.r - a.r).slice(0, 7);
  return { xi, bench, str: xi.reduce((a, x) => a + x.r, 0) / Math.max(1, xi.length) };
}
const GW = { GK: 0, DF: 0.3, MF: 1.0, FW: 4.4 }, AW = { GK: 0.03, DF: 0.8, MF: 2.6, FW: 1.4 };
const posG = x => x.l === 'FW' ? (/ST/.test(P[x.i].pos) ? 1.25 : 0.95) : x.l === 'MF' ? (/CAM/.test(P[x.i].pos) ? 1.5 : /CDM/.test(P[x.i].pos) ? 0.5 : 1) : 1;
function wpick(L, f) { const w = L.map(f); let t = w.reduce((a, b) => a + b, 0) * rnd(); for (let k = 0; k < L.length; k++) { t -= w[k]; if (t <= 0) return L[k]; } return L[L.length - 1]; }
let ROW = null; // 当季个人数据 { i: {apps,g,a,rs,motm,cs,capps,cg,ca, club} }
function row(i, c) { return ROW[i] || (ROW[i] = { club: c, apps: 0, g: 0, a: 0, rs: 0, motm: 0, cs: 0, capps: 0, cg: 0, ca: 0, crs: 0 }); }
const injured = {};
function playMatch(h, a, w, opt = {}) {
  // opt.cup: 计入杯赛数据；h/a 可以是外赛区队名（不记个人数据）
  const side = c => {
    if (CI[c] == null) { const f = FSTR[c]; return { foreign: true, c, str: domTop(w) - 1.4 + f.b * 0.6 + Math.sin(f.ph + w * 0.1) * 1.2 + gauss() * 0.6 }; }
    const L = pickXI(c, w, i => !(injured[i] > 0)); if (c === '威尔福特' && w >= 45) L.str += Math.min(2.6, (w - 44) * 0.9); return { c, ...L };
  };
  const H = side(h), A = side(a);
  const adv = opt.neutral ? 0 : 0.14;
  const boost = S => S.foreign ? 1 : 1 + 0.075 * S.xi.filter(x => P[x.i].lore && x.l !== 'GK' && x.l !== 'DF').length;
  const lh = 1.32 * boost(H) * Math.exp((H.str - A.str) * 0.085 + adv), la = 1.32 * boost(A) * Math.exp((A.str - H.str) * 0.085 - adv * 0.4);
  let hg = pois(lh), ag = pois(la);
  const stat = (S, gf, ga) => {
    if (S.foreign) return;
    const on = S.xi.slice(), subs = S.bench.filter(() => rnd() < 0.4).slice(0, 3);
    const mr = {}; on.concat(subs).forEach(x => { const r = row(x.i, S.c); if (opt.cup) r.capps++; else r.apps++; mr[x.i] = 6.45 + (gf - ga) * 0.16 + (x.r - 83) * 0.03 + gauss() * 0.38 - (subs.includes(x) ? 0.25 : 0); });
    for (let k = 0; k < gf; k++) {
      const sc = wpick(on, x => GW[x.l] * posG(x) * Math.pow(x.r / 85, 3) * P[x.i].mult.g);
      const r = row(sc.i, S.c); if (opt.cup) r.cg++; else r.g++; mr[sc.i] += 0.95;
      const asOk = rnd() < (sc.l === 'FW' || P[sc.i].lore ? 0.86 : 0.74), asP = wpick(on.filter(x => x !== sc), x => AW[x.l] * (/CAM|LW|RW/.test(P[x.i].pos) ? 1.4 : 1) * Math.pow(x.r / 85, 2) * P[x.i].mult.a); if (asOk) { const q = row(asP.i, S.c); if (opt.cup) q.ca++; else q.a++; mr[asP.i] += 0.55; }
    }
    if (ga === 0) on.forEach(x => { if (x.l === 'GK' || x.l === 'DF') { row(x.i, S.c).cs++; mr[x.i] += 0.35; } });
    Object.entries(mr).forEach(([i, v]) => { const r = ROW[i]; const vv = clamp(v, 4.5, 10); if (opt.cup) r.crs += vv; else r.rs += vv; });
    // 伤病：很少，偶尔缺阵几场
    on.forEach(x => { if (rnd() < 0.012 && !P[x.i].lore) injured[x.i] = 1 + Math.floor(rnd() * 5); });
    return mr;
  };
  const mh = stat(H, hg, ag), ma = stat(A, ag, hg);
  // 全场最佳
  let best = null; [mh, ma].forEach(m => m && Object.entries(m).forEach(([i, v]) => { if (!best || v > best.v) best = { i, v }; }));
  if (best) row(+best.i, P[best.i].club).motm++;
  Object.keys(injured).forEach(k => { if (injured[k] > 0) injured[k]--; });
  return [hg, ag];
}
let DOMTOP = {};
function domTop(w) { if (DOMTOP[w]) return DOMTOP[w]; const l = league.map(c => pickXI(c, w, () => true).str).sort((a, b) => b - a); return (DOMTOP[w] = (l[0] + l[1] + l[2]) / 3); }
function ko(teams, w, single = true) {
  let alive = teams.slice(), rounds = []; const fin = {};
  while (alive.length > 1) {
    for (let i = alive.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [alive[i], alive[j]] = [alive[j], alive[i]]; }
    const nx = [], rd = [];
    if (alive.length % 2) nx.push(alive.pop());
    for (let k = 0; k < alive.length; k += 2) {
      const a = alive[k], b = alive[k + 1], last = alive.length === 2;
      let [x, y] = playMatch(a, b, w, { cup: true, neutral: last });
      let win = x > y ? a : x < y ? b : (rnd() < 0.5 ? a : b), sc = `${Math.max(x, y)}–${Math.min(x, y)}${x === y ? '（点球）' : ''}`;
      rd.push([a, b, sc, win]); nx.push(win);
      if (last) { fin.w = win; fin.r = win === a ? b : a; fin.sc = sc; }
    }
    rounds.push(rd); alive = nx;
  }
  return fin;
}
const TRACE = [];
function simSeason(w) {
  ROW = {}; DOMTOP = {}; RCACHE = {};
  // 年龄、退役、新人
  CLUBS.forEach(c => {
    squads[c] = squads[c].filter(i => { const p = P[i]; if (p.kind === 'mod') return !(p.last && w > p.last); const a = ageOf(p, w), r = ratingOf(p, w); return !(a >= p.ret || (a > 29 && r < 66)); });
  });
  // 现代球员出道 / 回到 S01 的俱乐部
  P.forEach((p, i) => { if (p.kind !== 'mod' || w < p.debut || (p.last && w > p.last)) return; const cur = CLUBS.find(c => squads[c].includes(i)); if (cur) return; let c = p.club; if (!p.lore && rnd() < 0.35 && w < 47) { const others = CLUBS.filter(x => Math.abs(prest(x, w) - prest(c, w)) < 4 && x !== c); if (others.length) c = one(others); p.moveAt = w + 2 + Math.floor(rnd() * 5); p.startClub = c; } squads[c].push(i); });
  P.forEach((p, i) => { if (p.kind === 'mod' && p.moveAt === w) { CLUBS.forEach(c => squads[c] = squads[c].filter(x => x !== i)); squads[p.club].push(i); } });
  // 转会：原创球员里的好手被底蕴更强的球队买走
  if (w > 1) CLUBS.forEach(c => squads[c].slice().forEach(i => { const p = P[i]; if (p.kind === 'mod') return; const r = ratingOf(p, w); const crisis = w >= 43 && !S1.includes(c) && r >= 76; if (!crisis && (r < prest(c, w) + 3 || rnd() > 0.35)) return; if (crisis && rnd() > 0.55) return; const buyers = CLUBS.filter(x => prest(x, w) > prest(c, w) + 1.5 && squads[x].length < 26); if (!buyers.length) return; const to = wpick(buyers, x => Math.pow(prest(x, w) - 80, 2) + 1); squads[c] = squads[c].filter(x => x !== i); squads[to].push(i); p.club = to; }));
  // 人太多：放走最弱的原创球员到缺人的球队
  CLUBS.forEach(c => { let guard = 0; while (squads[c].length > 27 && guard++ < 40) { const weak = squads[c].filter(i => P[i].kind !== 'mod').sort((a, b) => ratingOf(P[a], w) - ratingOf(P[b], w))[0]; if (weak == null) break; squads[c] = squads[c].filter(x => x !== weak); const to = CLUBS.slice().sort((a, b) => squads[a].length - squads[b].length)[0]; if (squads[to].length >= 26) { squads[c].push(weak); break; } squads[to].push(weak); P[weak].club = to; } });
  CLUBS.forEach(c => { squads[c].forEach(i => P[i].club = c); fillSquad(c, w); squads[c].forEach(i => P[i].club = c); });
  RCACHE = {}; DOMTOP = {};
  // 联赛：双循环
  const T = {}; league.forEach(c => T[c] = { c, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  for (const h of league) for (const a of league) { if (h === a) continue; const [x, y] = playMatch(h, a, w); const A = T[h], B = T[a]; A.gf += x; A.ga += y; B.gf += y; B.ga += x; if (x > y) { A.w++; A.pts += 3; B.l++; } else if (x < y) { B.w++; B.pts += 3; A.l++; } else { A.d++; B.d++; A.pts++; B.pts++; } }
  const tb = Object.values(T).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  const order = tb.map(r => r.c);
  // 杯赛
  const cups = {};
  const fpick = n => { const l = FOREIGN.slice(); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l.slice(0, n); };
  cups['世联赛'] = ko(order.slice(0, 4).concat(fpick(28)), w);
  cups['全联杯'] = ko(order.slice(4, 6).concat(fpick(30).filter(x => !cups['世联赛'] || true)), w);
  cups['威联赛杯'] = ko(CLUBS.slice().concat(['', '', '', '', '']).filter(Boolean), w);
  const cw = cups['威联赛杯'].w, sh = cw === order[0] ? order[1] : cw;
  { const [x, y] = playMatch(order[0], sh, w, { cup: true, neutral: true }); const win = x > y ? order[0] : x < y ? sh : (rnd() < 0.5 ? order[0] : sh); cups['社区杯'] = { w: win, r: win === order[0] ? sh : order[0], sc: `${Math.max(x, y)}–${Math.min(x, y)}${x === y ? '（点球）' : ''}` }; }
  // 升降级
  const down = order.slice(-3), lower = CLUBS.filter(c => !league.includes(c));
  let up;
  if (w === 49) { const stay = order.slice(0, 17), N = stay.filter(c => !S1.includes(c)).length, k = clamp(3 - N, 0, 3); const nonS1 = lower.filter(c => !S1.includes(c)).sort((a, b) => prest(a, w) - prest(b, w)), s1l = lower.filter(c => S1.includes(c)); up = nonS1.slice(0, k).concat(s1l.slice(0, 3 - Math.min(k, nonS1.length))); while (up.length < 3) { const rest = lower.filter(c => !up.includes(c)); up.push(rest[0]); } }
  else if (w >= 46) { const want = S1.filter(c => lower.includes(c)); up = want.slice(0, 3); while (up.length < 3) { const rest = lower.filter(c => !up.includes(c)); up.push(wpick(rest, c => Math.pow(Math.max(1, prest(c, w) - 74), 2))); } }
  else { up = []; const pool = lower.slice(); while (up.length < 3) { const c = wpick(pool, x => Math.pow(Math.max(1, prest(x, w) - 74), 2)); up.push(c); pool.splice(pool.indexOf(c), 1); } }
  const res = { w, order, tb, down, up, lower, cups, rows: ROW, sq: Object.fromEntries(CLUBS.map(c => [c, squads[c].slice()])) };
  league = order.slice(0, 17).concat(up);
  return res;
}

/* ---------- 奖项 ---------- */
const CUPV = { 世联赛: 14, 全联杯: 6, 威联赛杯: 2, 社区杯: 0.5 };
function awards(S) {
  const w = S.w, champ = S.order[0];
  const rows = Object.entries(S.rows).map(([i, r]) => ({ i: +i, ...r, avg: r.apps ? r.rs / r.apps : 0 })).filter(r => S.order.includes(r.club));
  const elig = rows.filter(r => r.apps >= 20);
  const line = r => LINE(P[r.i].pos);
  const base = r => r.avg * 10 + r.g * 0.8 + r.a * 0.5 + r.motm * 0.35 + (line(r) === 'GK' ? r.cs * 0.3 - 2 : line(r) === 'DF' ? r.cs * 0.15 : 0);
  const hon = r => { let s = r.club === champ ? 14 : r.club === S.order[1] ? 4 : 0, n = r.club === champ ? 1 : 0; Object.entries(S.cups).forEach(([k, c]) => { if (c.w === r.club) { s += CUPV[k]; if (k !== '社区杯' && k !== '威联赛杯') n++; } }); if (!n) s -= 3; else s += (n - 1) * 2.5; return s * 0.75; };
  const bsc = r => base(r) + (r.cg * 0.75 + r.ca * 0.45) * 1.1 + hon(r);
  let ballon = elig.map(r => ({ i: r.i, sc: bsc(r) })).sort((a, b) => b.sc - a.sc);
  const mvpSc = r => base(r) + [3, 1.8, 1.2, 0.8][S.order.indexOf(r.club)] || 0;
  const mvp = elig.map(r => ({ i: r.i, sc: base(r) + ([3, 1.8, 1.2, 0.8][S.order.indexOf(r.club)] || 0) })).sort((a, b) => b.sc - a.sc);
  const boot = rows.slice().sort((a, b) => b.g - a.g || a.apps - b.apps)[0];
  const ast = rows.slice().sort((a, b) => b.a - a.a || a.apps - b.apps)[0];
  const glove = rows.filter(r => line(r) === 'GK' && r.apps >= 20).sort((a, b) => b.cs - a.cs || b.avg - a.avg)[0];
  const young = elig.filter(r => ageOf(P[r.i], w) <= 21).sort((a, b) => base(b) - base(a))[0];
  // 杯赛 MVP：冠军队在该项赛事表现最好的人（这里只有总的杯赛数据，按冠军队里杯赛进球助攻最多者）
  const cupMvp = {}; Object.entries(S.cups).forEach(([k, c]) => { if (CI[c.w] == null) return; const l = rows.filter(r => r.club === c.w && r.capps).sort((a, b) => (b.cg * 2 + b.ca * 1.3 + b.avg) - (a.cg * 2 + a.ca * 1.3 + a.avg)); if (l[0]) cupMvp[k] = l[0].i; });
  return { ballon, mvp, boot: boot && boot.i, ast: ast && ast.i, glove: glove && glove.i, young: young && young.i, cupMvp };
}
const shares = (L, T) => { if (!L.length) return []; const top = L[0].sc, w = L.map(x => Math.exp((x.sc - top) / T)), s = w.reduce((a, b) => a + b, 0); return L.map((x, k) => ({ ...x, pct: Math.round(w[k] / s * 1000) / 10 })); };

/* ---------- 跑 50 季（W46 起的尾段重试，直到 W50 收尾能接上威超 S01 的 20 队） ---------- */
function runAll(seed) {
  rnd = mkRng(seed);
  return null;
}
const OUT = [];
for (let w = 1; w <= W - 2; w++) OUT.push(simSeason(w));
// 最后两季：衔接威超 S01（W50 前 17 名 + 升级 3 队 = S01 的 20 队）。接不上就用别的随机数重踢 W49–W50，前面 48 季不变
{
  const snap = { sq: JSON.stringify(squads), inj: JSON.stringify(injured), lg: league.slice(), n: P.length, pm: P.map(p => [p.club, p.moveAt, p.startClub]), names: new Set(usedNames) };
  const okNow = () => { const L = OUT[W - 1], k = L.order.slice(0, 17), s1 = new Set(S1); return k.every(c => s1.has(c)) && S1.filter(c => !k.includes(c)).every(c => L.lower.includes(c) || L.up.includes(c)); };
  for (let t = 0; t < 600; t++) {
    if (t) { Object.keys(squads).forEach(c => delete squads[c]); Object.assign(squads, JSON.parse(snap.sq)); Object.keys(injured).forEach(k => delete injured[k]); Object.assign(injured, JSON.parse(snap.inj)); league = snap.lg.slice(); P.length = snap.n; P.forEach((p, i) => { [p.club, p.moveAt, p.startClub] = snap.pm[i]; }); usedNames.clear(); snap.names.forEach(n => usedNames.add(n)); OUT.length = W - 2; rnd = mkRng(SEED * 13 + t * 7919); }
    OUT.push(simSeason(W - 1)); OUT.push(simSeason(W));
    if (okNow()) break;
  }
}
// 收尾检查
const last = OUT[W - 1], keep = last.order.slice(0, 17), s1set = new Set(S1);
const ok = keep.every(c => s1set.has(c)) && S1.filter(c => !keep.includes(c)).every(c => last.lower.includes(c) || last.up.includes(c));
const AWD = OUT.map(awards);

module.exports = { OUT, AWD, P, CLUBS, ok, last, S1, LORE_BY_PID, MOD, shares, ratingOf, ageOf, LINE, FOREIGN, T0, prest };

/* ---------- 定稿：金球 / 金手套按设定分配，传奇数据精确对齐，导出 ---------- */
function finalize() {
  const quotaB = {}, quotaG = {};
  Object.entries(LORE_BY_PID).forEach(([pid, L]) => { const i = MOD[pid]; if (i == null) return; if (L.ballon) quotaB[i] = L.ballon; if (L.glove) quotaG[i] = L.glove; });
  // 1) 传奇数据精确对齐：差额从同季同队的非传奇队友那里挪（球队总进球 / 助攻不变）
  Object.entries(LORE_BY_PID).forEach(([pid, L]) => {
    const i = MOD[pid]; if (i == null) return;
    // 在队但没上场的赛季也算进来（补出场时用）
    OUT.forEach(S => { const c = Object.keys(S.sq).find(t => S.sq[t].includes(i)); if (c && !S.rows[i] && S.order.includes(c)) S.rows[i] = { club: c, apps: 0, g: 0, a: 0, rs: 0, motm: 0, cs: 0, capps: 0, cg: 0, ca: 0, crs: 0 }; });
    const seasonsOf = () => OUT.map((S, k) => ({ S, k, r: S.rows[i] })).filter(x => x.r);
    const adjust = (field, cfield, target) => {
      let cur = 0; seasonsOf().forEach(x => cur += x.r[field] + x.r[cfield]); let d = target - cur, guard = 0;
      while (d !== 0 && guard++ < 40000) {
        const L2 = seasonsOf(); if (!L2.length) break; const x = L2[guard % L2.length]; const useCup = guard % 3 === 0 && x.r.capps > 0; const f = useCup ? cfield : field;
        const mates = Object.entries(x.S.rows).filter(([j, r]) => +j !== i && r.club === x.r.club && !P[j].lore && (d > 0 ? r[f] > 0 : (useCup ? r.capps : r.apps) > 0)).sort((a, b) => d > 0 ? b[1][f] - a[1][f] : (LINE(P[b[0]].pos) === 'FW') - (LINE(P[a[0]].pos) === 'FW') || b[1].apps - a[1].apps);
        if (!mates.length && d > 0 && x.r.capps > 0 && guard > 20000) { if (f === 'g' || f === 'cg') x.r.cg++; else x.r.ca++; d--; continue; } // 联赛里没人可让时，算进杯赛（杯赛没有积分表约束）
        if (!mates.length) { if (d > 0 && f !== 'g' && f !== 'cg') { const gf = f === 'a' ? 'g' : 'cg'; const team = Object.values(x.S.rows).filter(r => r.club === x.r.club); if (team.reduce((s2, r) => s2 + r[f], 0) < team.reduce((s2, r) => s2 + r[gf], 0)) { x.r[f]++; d--; } } continue; }
        const m = mates[0][1];
        if (d > 0) { m[f]--; x.r[f]++; d--; } else { if (x.r[f] <= 0) continue; m[f]++; x.r[f]--; d++; }
      }
    };
    if (L.g != null) adjust('g', 'cg', L.g); if (L.a != null) adjust('a', 'ca', L.a);
    // 出场：联赛最多 38、杯赛最多 12
    let cur = 0; seasonsOf().forEach(x => cur += x.r.apps + x.r.capps); let d = L.apps - cur, guard = 0;
    while (d !== 0 && guard++ < 5000) { const L2 = seasonsOf(); const x = L2[guard % L2.length]; if (d > 0) { if (x.r.apps < 38) { x.r.rs += x.r.apps ? x.r.rs / x.r.apps : 6.8; x.r.apps++; d--; } else if (x.r.capps < 12) { x.r.crs += x.r.capps ? x.r.crs / x.r.capps : 6.8; x.r.capps++; d--; } } else { if (x.r.capps > 0) { x.r.crs -= x.r.crs / x.r.capps; x.r.capps--; d++; } else if (x.r.apps > 20) { x.r.rs -= x.r.rs / x.r.apps; x.r.apps--; d++; } } }
  });
  // 2) 奖项（重新计算，因为数据对齐过）
  const A = OUT.map(awards);
  // 金球：W37–W50 按设定名额分给传奇。用动态规划找「爆冷最少」的分配：每季得主和当季最高分的差距总和最小
  const forced = {}; const Q = Object.entries(quotaB).map(([i, n]) => ({ i: +i, n }));
  const gap = (w, i) => { const L = A[w - 1].ballon, k = L.findIndex(x => x.i === i); if (k < 0) return 1e6; if (ageOf(P[i], w) < MINAGE) return 1e6; if (P[i].pid === 783 && w > 46) return 1e6; const top = L.filter(x => !quotaB[x.i] || true)[0].sc; return Math.max(0, top - L[k].sc) + k * 0.05; };
  const memo = new Map(); var MINAGE;
  const solve = (w, rem) => { if (w > 50) return rem.every(x => x === 0) ? { c: 0, pick: [] } : { c: 1e9 }; const key = w + '|' + rem.join(','); if (memo.has(key)) return memo.get(key); let best = { c: 1e9 }; const left = rem.reduce((a, b) => a + b, 0); if (left > 51 - w) { memo.set(key, best); return best; }
    Q.forEach((q, k) => { if (!rem[k]) return; const g = gap(w, q.i); if (g >= 1e6) return; const r2 = rem.slice(); r2[k]--; const sub = solve(w + 1, r2); if (sub.c + g < best.c) best = { c: sub.c + g, pick: [q.i].concat(sub.pick) }; });
    if (left < 51 - w) { const sub = solve(w + 1, rem); if (sub.c < best.c) best = { c: sub.c, pick: [null].concat(sub.pick) }; }
    memo.set(key, best); return best; };
  let sol; for (MINAGE of [18, 17, 16, 0]) { memo.clear(); sol = solve(37, Q.map(q => q.n)); if (sol.c < 1e8) break; }
  (sol.pick || []).forEach((i, k) => { if (i != null) forced[37 + k] = i; });
  if (process.env.WLDBG2) console.error('ballon DP cost', sol.c.toFixed(1), JSON.stringify(forced));
  const quotaSet = new Set(Object.keys(quotaB).map(Number));
  const natCnt = {};
  A.forEach((a, k) => { const w = k + 1; let L = a.ballon.slice(); if (forced[w] != null) { const j = L.findIndex(x => x.i === forced[w]); const it = j >= 0 ? L.splice(j, 1)[0] : { i: forced[w], sc: 0 }; it.sc = Math.max(it.sc, (L[0] ? L[0].sc : 0) + 1.2); L.unshift(it); } else { let g = 0; while (L.length && (quotaSet.has(L[0].i) || (natCnt[L[0].i] || 0) >= 5) && g++ < L.length) L.push(L.shift()); if (L[0]) natCnt[L[0].i] = (natCnt[L[0].i] || 0) + 1; } a.ballon = L; });
  // 金手套：奥兹兰等按名额拿下表现最好的几季
  Object.entries(quotaG).forEach(([i, n]) => { const ws = OUT.map((S, k) => ({ k, r: S.rows[i] })).filter(x => x.r && x.r.apps >= 20).sort((a, b) => b.r.cs - a.r.cs).slice(0, n), set = new Set(ws.map(x => x.k)); ws.forEach(x => A[x.k].glove = +i);
    OUT.forEach((S, k) => { if (A[k].glove == +i && !set.has(k)) { const alt = Object.entries(S.rows).filter(([j, r]) => +j != i && LINE(P[j].pos) === 'GK' && r.apps >= 20 && S.order.includes(r.club)).sort((a, b) => b[1].cs - a[1].cs)[0]; A[k].glove = alt ? +alt[0] : null; } }); });
  OUT.forEach((S, k) => { const g = A[k].glove; if (g != null && !quotaG[g]) { /* 名额外的照常 */ } });
  return A;
}
function exportWL() {
  const A = finalize();
  // 名字修正：避免「巴巴巴巴」「马丁内内斯」这类叠字（模拟已跑完，换名不影响任何结果）
  { const keep = rnd, bad = n => !n || (/(.)\1/.test(n) && !/^巴巴.$/.test(n)); P.forEach((p, i) => { if (p.kind !== 'gen' || !bad(p.name)) return; usedNames.delete(p.name); for (let t = 0; t < 30; t++) { rnd = mkRng(777000 + i * 31 + t); const n = genName(p.nat) || genName('英格兰'); if (!bad(n)) { p.name = n; break; } if (n) usedNames.delete(n); }
    if (bad(p.name)) { const d = p.name.replace(/(.)\1+/g, '$1'); const tries = [d, d + '特', d + '森', d.slice(0, -1) + '维' + d.slice(-1)]; const ok = tries.find(x => !usedNames.has(x) && !bad(x)); if (ok) p.name = ok; }
    usedNames.add(p.name); }); rnd = keep; }
  const used = new Set(); OUT.forEach(S => { Object.keys(S.rows).forEach(i => used.add(+i)); Object.values(S.sq).forEach(l => l.forEach(i => used.add(i))); });
  const ids = [...used].sort((a, b) => a - b), NID = {}; ids.forEach((i, k) => NID[i] = k);
  const b36 = n => Math.round(n).toString(36);
  const pl = ids.map(i => { const p = P[i]; return [p.name, p.nat, p.pos, p.born, p.pid, p.kind === 'mod' && p.pid >= 0 ? 0 : p.peak, p.lore && p.lore.legend ? p.lore.legend : '']; });
  const seasons = OUT.map((S, k) => {
    const w = k + 1, a = A[k];
    const rows = [];
    CLUBS.forEach((c, ci) => S.sq[c].forEach(i => { const r = S.rows[i]; const rt = ratingOf(P[i], w); if (!r || r.club !== c) { rows.push([NID[i], ci, rt].map(b36).join('.')); return; } rows.push([NID[i], ci, rt, r.apps, r.g, r.a, r.apps ? r.rs / r.apps * 10 : 0, r.motm, r.cs, r.capps, r.cg, r.ca, r.capps ? r.crs / r.capps * 10 : 0].map(b36).join('.')); }));
    const pct = (L, T, n) => shares(L.slice(0, 10), T).slice(0, n).map(x => [NID[x.i], x.pct]);
    return {
      o: S.order.map(c => CI[c]), t: S.tb.map(r => [r.w, r.d, r.l, r.gf, r.ga]), up: S.up.map(c => CI[c]), dn: S.down.map(c => CI[c]),
      c: Object.fromEntries(Object.entries(S.cups).map(([kk, v]) => [kk, [v.w, v.r, v.sc, a.cupMvp[kk] != null ? NID[a.cupMvp[kk]] : -1]])),
      a: { b: pct(a.ballon, 6, 5), m: pct(a.mvp, 3, 3), gb: a.boot != null ? NID[a.boot] : -1, as: a.ast != null ? NID[a.ast] : -1, gl: a.glove != null ? NID[a.glove] : -1, y: a.young != null ? NID[a.young] : -1 },
      r: rows.join(' ')
    };
  });
  const out = { v: 1, clubs: CLUBS, pl, s: seasons };
  fs.writeFileSync(D + 'wl.json', JSON.stringify(out));
  return out;
}
if (process.env.WLMETRIC) {
  const m = { seed: SEED, ok, lore: {}, champs: OUT.map(S => S.order[0]) };
  Object.entries(LORE_BY_PID).forEach(([pid, L]) => { const i = MOD[pid]; if (i == null) return; let apps = 0, g = 0, a = 0; OUT.forEach(S => { const r = S.rows[i]; if (r) { apps += r.apps + r.capps; g += r.g + r.cg; a += r.a + r.ca; } }); m.lore[pid] = { apps, g, a, tg: L.g || 0, ta: L.a || 0, tapps: L.apps, mult: [P[i].mult.g, P[i].mult.a] }; });
  console.log(JSON.stringify(m)); process.exit(0);
}
if (require.main === module) {
  if (process.env.WLEXPORT) { const o = exportWL(); console.log('wl.json', (fs.statSync(D + 'wl.json').size / 1e3).toFixed(0) + 'KB', '球员', o.pl.length); }
  console.log('seed', SEED, 'W50 接 S01：', ok, 'W50 前 17：', keep.filter(c => !s1set.has(c)), '升级：', last.up);
  const champs = OUT.map(S => S.order[0]); const cnt = {}; champs.forEach(c => cnt[c] = (cnt[c] || 0) + 1);
  console.log('冠军次数', cnt);
  console.log('W41–W50 冠军', champs.slice(40).join(' '));
  let G = 0, M = 0; OUT.forEach(S => S.tb.forEach(r => { G += r.gf; M += r.w + r.d + r.l; })); console.log('场均进球', (G / (M / 2)).toFixed(2));
  Object.entries(LORE_BY_PID).forEach(([pid, L]) => { const i = MOD[pid]; if (i == null) return console.log('missing', L.key); let apps = 0, g = 0, a = 0; OUT.forEach(S => { const r = S.rows[i]; if (r) { apps += r.apps + r.capps; g += r.g + r.cg; a += r.a + r.ca; } }); console.log(L.key, '出道 W' + P[i].debut, `出场 ${apps}/${L.apps} 进球 ${g}/${L.g || 0} 助攻 ${a}/${L.a || 0}`); });
  const tops = OUT.map((S, k) => { const b = AWD[k].ballon[0]; return 'W' + (k + 1) + ':' + (b ? P[b.i].name + '(' + ageOf(P[b.i], k + 1) + ')' : '-'); });
  console.log(tops.join(' '));
  console.log('球员总数', P.length);
}
