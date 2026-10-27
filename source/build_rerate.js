// 重新推演 S01–S17（以及 S18 初始阵容）所有历史球员的能力值。
// 旧资料只保留：名字、位置、国籍、年龄（出生季）、每季在哪支球队（出现 / 离开）。
// 旧的能力值、生涯数据一律不用：潜力按「你的设定（GOAT / 梯队 / 银河战舰 / 传奇）」+ 球队档次 + 随机推演，
// 一部分有天赋的球员会因为伤病或个人原因兑现不了天赋。
// 用法：node build_rerate.js   → 写出 hist.json（能力已重算）与 rerate.json
const fs = require('fs'), vm = require('vm');
const D = __dirname + '/';
if (!fs.existsSync(D + 'hist_orig.json')) fs.copyFileSync(D + 'hist.json', D + 'hist_orig.json');
const H = JSON.parse(fs.readFileSync(D + 'hist_orig.json', 'utf8'));
const LORE = JSON.parse(fs.readFileSync(D + 'lore.json', 'utf8'));
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(D + 'player_data.js', 'utf8').replace('const PLAYER_DATABASE', 'var PLAYER_DATABASE'), ctx);
const PDB = ctx.PLAYER_DATABASE; JSON.parse(fs.readFileSync(D + 'extra_players.json', 'utf8')).forEach(p => (PDB[p.team] = PDB[p.team] || []).push(p));

const ghash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const LINE = p => { p = String(p || '').replace(/^[LR](?=(CB|CM|DM|AM|ST|WB))/, ''); return p === 'GK' ? 'GK' : /B$/.test(p) ? 'DF' : /M/.test(p) ? 'MF' : 'FW'; };
const TIER = { S: ['威龙', '猎豹', '金狮', '猛虎', '狂蜂'], A: ['威尔福特', '切狐', '阿尔法骑士', '猛龙', '罗联', '森利西亚虎'] };
const bias = t => TIER.S.includes(t) ? 3 : TIER.A.includes(t) ? 1 : -1.5;
const gauss = (k) => { const u = Math.max(1e-6, ghash(k + 'u')), v = ghash(k + 'v'); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

// 你的设定：GOAT / 梯队 / 银河战舰 / 传奇设定里的球员
const anchor = {}; const LP = H.lorePid || {};
const setA = (k, v) => { const pid = LP[k]; if (pid != null) anchor[pid] = Math.max(anchor[pid] || 0, v); };
Object.keys(LP).forEach(k => setA(k, 90));
(LORE.galactico || []).forEach(G => G.squad.forEach(([n]) => Object.keys(LP).filter(k => k.split('@')[0] === n).forEach(k => setA(k, 91))));
const TV = { T0: 96, 'T0.5': 95, T1: 94, T2: 92 };
[LORE.tiers || {}, LORE.tiersAll || {}].forEach(T => Object.entries(T).forEach(([t, L]) => Array.isArray(L) && L.forEach(k => setA(k, TV[t] || 90))));
(LORE.goat || []).forEach(k => setA(k, 97));

// 出生季（相对 S 季）：S18 资料库球员按 S18 年龄，其余按出道季和出道年龄
const ageAt18 = {}; Object.entries(PDB).forEach(([t, L]) => L.forEach(p => { ageAt18[t + '|' + p.name] = p.age; }));
const firstTeam = {}; Object.keys(H.squads).map(Number).sort((a, b) => a - b).forEach(s => Object.entries(H.squads[s]).forEach(([t, L]) => L.forEach(x => { if (!firstTeam[x[0]]) firstTeam[x[0]] = t; })));
const POT_MEAN = +(process.env.POT_MEAN || 83.5);
const out = {};
H.players.forEach((pp, pid) => {
  if (!pp) return; const [name, pos, , cur, , , , , f1, a1] = pp;
  const born = cur && ageAt18[cur + '|' + name] != null ? 18 - ageAt18[cur + '|' + name] : f1 != null && a1 != null ? f1 - a1 : 18 - 26;
  const k = 'rr|' + pid + '|' + name, team = firstTeam[pid] || cur || '';
  let pot, bt = 0, ba = 0, loss = 0;
  if (anchor[pid]) pot = Math.min(97, anchor[pid] + Math.round((ghash(k + 'a') - 0.5) * 2));
  else {
    pot = Math.round(Math.max(70, Math.min(93, POT_MEAN + bias(team) + 5 * gauss(k))));
    if (ghash(k + 'w') < 0.015) pot = 93 + Math.floor(ghash(k + 'w2') * 4);
    if (pot >= 83 && ghash(k + 'b') < 0.14) { bt = ghash(k + 'bt') < 0.55 ? 1 : 2; ba = bt === 1 ? 20 + Math.floor(ghash(k + 'ba') * 6) : 20 + Math.floor(ghash(k + 'ba') * 4); loss = bt === 1 ? 5 + Math.floor(ghash(k + 'bl') * 8) : 4 + Math.floor(ghash(k + 'bl') * 6); }
  }
  const pAge = (LINE(pos) === 'GK' ? 28 : 26) + Math.floor(ghash(k + 'pa') * 3);
  out[pid] = [pot, pAge, born, bt, ba, loss];
});
// 能力曲线（网站里用同一个公式）
const curveP = (P, pAge, a) => a < pAge ? P - Math.pow(pAge - a, 1.2) * 0.8 : a <= pAge + 2 ? P : P - Math.pow(a - pAge - 2, 1.45) * 0.85;
function rateAt(pid, a) {
  const [pot, pAge, , bt, ba, loss] = out[pid];
  let P = pot; if (bt === 1 && a >= ba) P = pot - loss; else if (bt === 2 && a >= ba) P = pot - loss * Math.min(1, (a - ba + 1) / 3);
  const r = curveP(P, pAge, a) + (ghash('rn|' + pid + '|' + a) - 0.5) * 1.6;
  return Math.max(50, Math.min(99, Math.round(r)));
}
// 改写每季阵容的能力值，并按新能力重新排首发（保留阵型的位置）
const Hn = JSON.parse(JSON.stringify(H));
Object.entries(Hn.squads).forEach(([s, T]) => Object.entries(T).forEach(([t, L]) => {
  L.forEach(x => { const born = out[x[0]][2]; x[2] = rateAt(x[0], +s - born); });
  const slots = L.map(x => x[1]).filter(Boolean); L.forEach(x => x[1] = '');
  const used = new Set();
  slots.forEach(sl => { const ln = LINE(sl); const c = L.filter(x => !used.has(x[0])).sort((a, b) => (LINE(Hn.players[b[0]][1]) === ln) - (LINE(Hn.players[a[0]][1]) === ln) || b[2] - a[2])[0]; if (c) { c[1] = sl; used.add(c[0]); } });
}));
// 巅峰 = 职业生涯里最高的能力
Hn.players.forEach((pp, pid) => { if (!pp) return; const born = out[pid][2]; let m = 0; for (let a = 17; a <= 38; a++) m = Math.max(m, rateAt(pid, a)); pp[7] = m; });
// 转会费不再用旧数字
Hn.transfers = Hn.transfers.map(x => [x[0], x[1], x[2], x[3], 0]);
fs.writeFileSync(D + 'hist.json', JSON.stringify(Hn));
fs.writeFileSync(D + 'rerate.json', JSON.stringify({ v: 1, p: out }));
const pots = Object.values(out).map(x => x[0]), busts = Object.values(out).filter(x => x[3]).length;
console.log('players', pots.length, 'mean pot', (pots.reduce((a, b) => a + b, 0) / pots.length).toFixed(1), 'busts', busts, 'anchors', Object.keys(anchor).length);
