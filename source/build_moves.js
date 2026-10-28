// 重新推演 S01–S17 的球员流动（转会）。
// 保留：每名球员每季是否出现在联赛（出现的赛季不变）、出道那一季的球队（含青训出身）、S18 资料库里的球队，以及 DSON 传奇设定里的球员（整段生涯不动）。
// 其余每一季在哪支球队，按新规则重新推演：天才 / 球星从小球队去豪门，豪门的老将和替补去小球队找出场机会，
// 死敌之间不交易，实力相近的竞争对手交易少；每支球队每季仍是 18 人的核心名单。
// 用法：node build_moves.js [seed]   → 读 hist_pre_moves.json（第一次运行时从 hist.json 备份），写回 hist.json
const fs = require('fs');
const D = __dirname + '/';
if (!fs.existsSync(D + 'hist_pre_moves.json')) fs.copyFileSync(D + 'hist.json', D + 'hist_pre_moves.json');
const H = JSON.parse(fs.readFileSync(D + 'hist_pre_moves.json', 'utf8'));
const RR = JSON.parse(fs.readFileSync(D + 'rerate.json', 'utf8')).p;
const SEED = process.argv[2] || 'moves-v1';
const ghash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const rand = k => ghash(SEED + '|' + k);
const LINE = p => { p = String(p || '').replace(/^[LR](?=(CB|CM|DM|AM|ST|WB))/, ''); return p === 'GK' ? 'GK' : /B$/.test(p) ? 'DF' : /M/.test(p) ? 'MF' : 'FW'; };
const RIVAL = {}; [['威龙', '威尔福特'], ['猎豹', '花豹'], ['金狮', '森利西亚虎'], ['狂蜂', '蜜蜂'], ['猛龙', '猛虎'], ['罗联', '华尔兹'], ['切狐', '炎狼'], ['龙王宫殿', '科摩多尊龙'], ['罗杰剧院', '普雷斯顿'], ['阿尔法骑士', '泽尼联'], ['雷克夏', '岚'], ['威廉斯', '沃特梅兹'], ['拉普兰德', '飞鹰']].forEach(([a, b]) => { RIVAL[a] = b; RIVAL[b] = a; });
const SIZE = 18, S0 = 1, S1 = 17;

// 原始资料：每季每队名单 [pid, slot, rating]
const orig = {}; for (let s = S0; s <= S1; s++) { orig[s] = {}; Object.entries(H.squads[s] || {}).forEach(([t, L]) => L.forEach(([pid, slot, r]) => { orig[s][pid] = { t, slot, r }; })); }
const app = {}; for (let s = S0; s <= S1; s++) Object.keys(orig[s]).forEach(pid => (app[pid] = app[pid] || []).push(s));
const lock = new Set(Object.values(H.lorePid || {}).map(String));
const endClub = {}; H.players.forEach((pp, pid) => { if (pp && pp[3]) endClub[pid] = pp[3]; });
const born = pid => RR[pid] ? RR[pid][2] : null;
const str = {}; for (let s = S0; s <= S1; s++) { str[s] = {}; Object.entries(H.squads[s]).forEach(([t, L]) => { const v = L.map(x => x[2]).sort((a, b) => b - a).slice(0, 11); str[s][t] = v.reduce((a, b) => a + b, 0) / v.length; }); }
const rankOf = s => Object.keys(str[s]).sort((a, b) => str[s][b] - str[s][a]);
const rel = (a, b, s) => RIVAL[a] === b ? 'rival' : Math.abs((str[s][a] || 0) - (str[s][b] || 0)) <= 2 ? 'comp' : null;
function pick(list, w, k) { const W = list.map(w), tot = W.reduce((a, b) => a + b, 0); if (!tot) return null; let x = rand(k) * tot; for (let i = 0; i < list.length; i++) { x -= W[i]; if (x <= 0) return list[i]; } return list[list.length - 1]; }

const club = {}, N = {};
let natural = 0, forced = 0;
for (let s = S0; s <= S1; s++) {
  const teams = Object.keys(H.squads[s]), sp = s > S0 ? s - 1 : s, big = new Set(rankOf(sp).slice(0, 6));
  const asg = {}, stay = [], movers = [], cap = {}; teams.forEach(t => cap[t] = H.squads[s][t].length); // 每队人数和原来一样
  const put = (pid, t) => { asg[pid] = t; cap[t]--; };
  Object.keys(orig[s]).forEach(pid => {
    const o = orig[s][pid], first = app[pid][0] === s, E = endClub[pid];
    if (s === S0 || lock.has(pid) || first || !club[pid]) return put(pid, o.t);            // 出道球队 / 传奇设定不动
    let c = club[pid]; if (!teams.includes(c)) c = o.t;
    if (E && teams.includes(E) && s === S1) return put(pid, E); // S17 必须在 S18 资料库的球队
    // 越接近 S18，越多球员提前转去 S18 资料库里的球队；已经在那支球队的球员很少再离开
    if (E && teams.includes(E) && E !== c && s >= 7 && RIVAL[c] !== E && rand('end|' + pid + '|' + s) < (s - 6) * 0.1) return movers.push({ pid, c, r: o.r, a: 0, mode: 'end', cand: [E] });
    const a = born(pid) != null ? s - born(pid) : 26, r = o.r, sc = str[sp][c] || 80, gap = !orig[s - 1][pid];
    let pm = gap ? 0.25 : 0.05, mode = 'lat';
    if (a <= 23 && r >= sc + 3 && !big.has(c)) { pm = 0.45; mode = 'up'; }          // 小球队的天才被豪门买走
    else if (a <= 29 && r >= sc + 4 && !big.has(c)) { pm = 0.35; mode = 'up'; }     // 小球队的球星
    else if (big.has(c) && a >= 31 && r <= sc) { pm = 0.28; mode = 'down'; }       // 豪门的老将去小球队
    else if (r < sc - 5 && a >= 24) { pm = 0.25; mode = 'down'; }                  // 踢不上主力的去小球队
    if (E && c === E) pm *= 0.3;
    if (rand('mv|' + pid + '|' + s) >= pm) return stay.push({ pid, c, r });
    const cand = teams.filter(t => t !== c && RIVAL[c] !== t && (mode === 'up' ? (str[sp][t] || 0) >= sc + 2 && !(big.has(t) && a >= 30) : mode === 'down' ? (str[sp][t] || 99) <= sc - 2 && r >= (str[sp][t] || 0) - 2 : Math.abs((str[sp][t] || 0) - sc) <= 3));
    movers.push({ pid, c, r, a, mode, cand });
  });
  // 1 留队的球员先占位（同队按能力高低）；位置不够的成为冗员
  const left = [];
  stay.sort((x, y) => y.r - x.r).forEach(x => { if (cap[x.c] > 0) put(x.pid, x.c); else left.push(x); });
  // 2 想走的球员去有空位的目标球队（死敌不去，竞争对手机会小）；都没空位就留队
  movers.sort((x, y) => y.r - x.r).forEach(x => { const C = x.cand.filter(t => cap[t] > 0);
    const to = pick(C, t => (rel(x.c, t, sp) === 'comp' ? 0.35 : 1) * (x.mode === 'up' ? Math.pow(Math.max(1, (str[sp][t] || 70) - 70), 2) : 1), 'to|' + x.pid + '|' + s);
    if (!to && x.mode === 'end') { // 目标球队满了：和那边一名不属于该队 S18 名单、能力最低的球员对调
      const E = x.cand[0], sw = Object.keys(asg).filter(q => asg[q] === E && endClub[q] !== E && !lock.has(q) && app[q][0] !== s && RIVAL[E] !== x.c).sort((u, v) => orig[s][u].r - orig[s][v].r)[0];
      if (sw && cap[x.c] > 0) { asg[sw] = x.c; cap[x.c]--; asg[x.pid] = E; natural += 2; return; } }
    if (to) { put(x.pid, to); natural++; } else if (cap[x.c] > 0) put(x.pid, x.c); else left.push(x); });
  // 3 冗员去还有空位的球队（实力相近、不去死敌）
  left.sort((x, y) => y.r - x.r).forEach(x => { const C = teams.filter(t => cap[t] > 0); let to = C.filter(t => RIVAL[x.c] !== t).sort((a, b) => Math.abs((str[sp][a] || 80) - x.r) - Math.abs((str[sp][b] || 80) - x.r))[0] || C[0];
    if (!to) to = x.c; put(x.pid, to); if (to !== x.c) forced++; });
  N[s] = {}; teams.forEach(t => N[s][t] = []);
  Object.entries(asg).forEach(([pid, t]) => { N[s][t].push(+pid); club[pid] = t; });
}
// 首发：按原来每队每季的阵型位置，挑最合适的人
for (let s = S0; s <= S1; s++) Object.keys(N[s]).forEach(t => {
  const slots = (H.squads[s][t] || []).map(x => x[1]).filter(Boolean), L = N[s][t].map(pid => [pid, '', orig[s][pid].r]), used = new Set();
  slots.forEach(sl => { const ln = LINE(sl); const c = L.filter(x => !used.has(x[0])).sort((a, b) => (LINE(H.players[b[0]][1]) === ln) - (LINE(H.players[a[0]][1]) === ln) || b[2] - a[2])[0]; if (c) { c[1] = sl; used.add(c[0]); } });
  H.squads[s][t] = L;
});
// 转会记录：相邻两次出现换了球队就算一次；S17 → S18 去资料库里的球队
const T = [], last = {};
for (let s = S0; s <= S1; s++) Object.entries(H.squads[s]).forEach(([t, L]) => L.forEach(([pid]) => { if (last[pid] && last[pid] !== t) T.push([s, pid, last[pid], t, 0]); last[pid] = t; }));
Object.entries(endClub).forEach(([pid, E]) => { if (last[pid] && last[pid] !== E && app[pid] && app[pid].includes(S1)) T.push([18, +pid, last[pid], E, 0]); });
(H.transfers || []).forEach(x => { const ts = Object.keys(H.squads[Math.min(S1, Math.max(S0, x[0]))] || {}); if (!ts.includes(x[2]) || !ts.includes(x[3])) T.push(x); }); // 外赛区来回的原样保留
T.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
H.transfers = T; H.movesSeed = SEED;
fs.writeFileSync(D + 'hist.json', JSON.stringify(H));
// 统计
const per = {}; T.forEach(x => per[x[0]] = (per[x[0]] || 0) + 1);
const rivalMoves = T.filter(x => RIVAL[x[2]] === x[3]).length;
let lockOk = 0; lock.forEach(pid => { const ok = (app[pid] || []).every(s => H.squads[s][orig[s][pid].t].some(x => x[0] === +pid)); if (ok) lockOk++; });
let debutOk = 0, tot = 0; Object.keys(app).forEach(pid => { tot++; const s = app[pid][0]; if (H.squads[s][orig[s][pid].t].some(x => x[0] === +pid)) debutOk++; });
console.log('seed', SEED, 'transfers', T.length, 'per season', JSON.stringify(per), 'natural', natural, 'forced', forced, 'rival moves', rivalMoves, 'lore kept', lockOk + '/' + lock.size, 'debut kept', debutOk + '/' + tot);
const bad = []; Object.entries(H.squads).forEach(([k, S]) => { if (+k > S1) return; Object.entries(S).forEach(([t, L]) => { if (L.length !== JSON.parse(fs.readFileSync(D + 'hist_pre_moves.json', 'utf8')).squads[k][t].length) bad.push(k + t + L.length); }); }); console.log('sizes off', bad.length, bad.slice(0, 10).join(' '));
