/* ---------- 球员技能（特长）：稀有度 C < B < A < S，越稀有触发率越高、效果越强 ----------
   触发：每到对应的动作（任意球、点球、远射、过人、传球……）掷一次触发率；触发时这一下的成功率提高，场上球员头顶亮起技能图标。
   没有这项技能的球员也能做这个动作，只是没有加成、也不会触发。技能由位置、属性和身材决定（同一个球员永远是同一套） */
const SK_T = { C: { trig: 0.15, pw: 1, col: '#8d99a6', n: '普通' }, B: { trig: 0.25, pw: 1.5, col: '#3b82f6', n: '稀有' }, A: { trig: 0.35, pw: 2, col: '#a855f7', n: '史诗' }, S: { trig: 0.5, pw: 3, col: '#f5b300', n: '传说' } };
const SK_ICON = {
  fk: '<circle cx="7" cy="17" r="3.2"/><path d="M9.5 14.5C12 8 17 6 21 7.5"/><path d="M18.2 5.6 21 7.5l-1.6 3"/><path d="M13 20v-6m3 6v-6m3 6v-6" stroke-width="1.6"/>',
  pen: '<path d="M3 18V6h18v12"/><path d="M3 9h18M9 6v12M15 6v12" stroke-width="1" opacity=".55"/><circle cx="12" cy="20.5" r="1.6" fill="currentColor"/>',
  long: '<circle cx="5.5" cy="17.5" r="2.8"/><path d="M8.5 15.5 20 6"/><path d="M15.5 5.6 20 6l-.6 4.5"/><path d="M3 21h4" stroke-width="1.4"/>',
  flair: '<path d="M4 18c2-8 6-12 9-10s-1 7-3 6 1-7 6-8 4 2 4 2"/><circle cx="18.5" cy="18" r="2.4"/>',
  pass: '<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/><path d="M7.5 10.5c3-3 6-3 9 0"/><path d="M14.4 9.2l2.1 1.3-.6 2.3"/><path d="M16.5 13.5c-3 3-6 3-9 0" opacity=".6"/>',
  thru: '<path d="M3 20 20 3"/><path d="M14.5 3H20v5.5"/><path d="M6 6.5l3 3M14.5 15l3 3" stroke-width="2.4"/>',
  cross: '<path d="M4 20V9"/><path d="M4 9c4-6 12-6 15 2"/><path d="M16.2 9.8l2.8 1.2.6-3"/><circle cx="19" cy="17" r="2.4"/>',
  head: '<circle cx="10" cy="14" r="4.6"/><path d="M6.5 18.5 5 22M13.5 18.5 15 22"/><circle cx="17.5" cy="5.5" r="2.6"/><path d="M14.5 8.5l-1.5 1.5" stroke-width="1.4"/>',
  solo: '<circle cx="5" cy="14" r="2.2"/><path d="M7.5 14H17"/><path d="M14 11l3 3-3 3"/><path d="M20 6v16" stroke-width="2.4"/>',
  box: '<path d="M2 21V9h20v12"/><path d="M7 21v-6h10v6"/><circle cx="12" cy="11.5" r="3"/><circle cx="12" cy="11.5" r=".8" fill="currentColor"/>',
  pace: '<path d="M13 2 5 13h6l-2 9 9-12h-6z" fill="currentColor" stroke="none"/>',
  engine: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M7 12h3l1.5-2.5 2 5 1.5-2.5h2" stroke-width="1.5"/>',
  tackle: '<path d="M3 15h9l5 4H5z" fill="currentColor" stroke="none" opacity=".85"/><path d="M12 15V5"/><circle cx="19" cy="9" r="2.6"/><path d="M14 9h2" stroke-width="1.4"/>',
  icpt: '<path d="M3 12h7M14 12h7"/><path d="M17.5 8.5 21 12l-3.5 3.5"/><path d="M12 4v16" stroke-width="2.6"/>',
  aerial: '<path d="M12 21V8"/><path d="M7 12l5-5 5 5"/><path d="M5 5l3-2 3 2M13 5l3-2 3 2" stroke-width="1.4"/>',
  save: '<path d="M7 21v-7l-3-4 1.6-1.2L8 11V4.5a1.3 1.3 0 0 1 2.6 0V10V3.5a1.3 1.3 0 0 1 2.6 0V10V4.5a1.3 1.3 0 0 1 2.6 0V11V6.5a1.3 1.3 0 0 1 2.6 0V15c0 3-2 6-5 6z"/>',
  pstop: '<path d="M6 21v-6l-2.5-3.5 1.4-1L7 12V6a1.2 1.2 0 0 1 2.4 0v5V5a1.2 1.2 0 0 1 2.4 0v6V6.5a1.2 1.2 0 0 1 2.4 0V14c0 3-1.6 7-4.6 7z"/><text x="19" y="11" font-size="9" font-weight="900" text-anchor="middle" fill="currentColor" stroke="none">P</text>'
};
const SK_DEF = {
  fk: { n: '任意球大师', g: '定位球', d: '直接任意球的弧线和落点更刁钻，门将更难扑', pos: x => x !== 'GK', sc: A => A.sho * 0.45 + A.pas * 0.35 + A.dri * 0.2 },
  pen: { n: '点球高手', g: '定位球', d: '罚点球更稳、更会骗门将', pos: x => x === 'FW' || x === 'MF', sc: A => A.sho * 0.6 + A.men * 0.4 },
  long: { n: '远射专家', g: '射门', d: '更愿意在禁区外起脚，远射更准、更有力', pos: x => x === 'FW' || x === 'MF', sc: A => A.sho * 0.7 + A.phy * 0.3 },
  flair: { n: '花式过人', g: '盘带', d: '一对一时使出彩虹过人、踩单车、油炸丸子、马赛回旋等动作，过人成功率更高', pos: (x, p) => x === 'FW' || (x === 'MF' && /AM|W|M$/.test(p)), sc: A => A.dri * 0.75 + A.spd * 0.25 },
  pass: { n: '传球大师', g: '传球', d: '传球的方向和力度更准，失误更少', pos: x => x === 'MF' || x === 'DF', sc: A => A.pas * 0.7 + A.men * 0.3 },
  thru: { n: '直塞大师', g: '传球', d: '更会找前插队友的身后空当，直塞球更准', pos: (x, p) => x === 'MF' && /AM|CM/.test(p), sc: A => A.pas * 0.6 + A.men * 0.4 },
  cross: { n: '传中大师', g: '传球', d: '边路传中的落点更准，更容易找到抢点的队友', pos: (x, p) => /^[LR]/.test(p) || /W/.test(p), sc: A => A.pas * 0.6 + A.dri * 0.2 + A.spd * 0.2 },
  head: { n: '头球之王', g: '射门', d: '头球攻门更准、更有力', pos: (x, p) => p === 'ST' || p === 'CF' || /CB/.test(p), sc: (A, h) => A.phy * 0.6 + A.sho * 0.25 + 12 + (h - 182) * 0.6 },
  solo: { n: '单刀之王', g: '射门', d: '面对门将一对一时更冷静，进球率更高', pos: (x, p) => x === 'FW', sc: A => A.sho * 0.6 + A.men * 0.2 + A.spd * 0.2 },
  box: { n: '禁区杀手', g: '射门', d: '禁区里的射门更准', pos: (x, p) => x === 'FW' && !/W/.test(p), sc: A => A.sho * 0.7 + A.men * 0.3 },
  pace: { n: '速度之王', g: '身体', d: '冲刺速度更快，前插和反击时甩开对手', pos: x => x !== 'GK', sc: A => A.spd },
  engine: { n: '马拉松体能', g: '身体', d: '体力消耗更少，下半场依然能跑', pos: x => x !== 'GK', sc: A => A.sta },
  tackle: { n: '抢断大师', g: '防守', d: '上抢的成功率更高', pos: (x, p) => x === 'DF' || p === 'CDM' || p === 'DM', sc: A => A.def * 0.75 + A.phy * 0.25 },
  icpt: { n: '拦截专家', g: '防守', d: '预判传球线路，更容易切断对手的传球', pos: x => x === 'DF' || x === 'MF', sc: A => A.def * 0.5 + A.men * 0.5 },
  aerial: { n: '空中霸主', g: '防守', d: '高空球争顶更容易抢到第一点', pos: (x, p) => /CB/.test(p) || p === 'ST' || p === 'CF' || p === 'CDM', sc: (A, h) => A.phy * 0.6 + A.def * 0.3 + 9 + (h - 182) * 0.5 },
  save: { n: '扑救大师', g: '门将', d: '扑救范围和反应更好', pos: x => x === 'GK', sc: A => (A.ref || 70) * 0.5 + (A.div || 70) * 0.5 },
  pstop: { n: '点球克星', g: '门将', d: '扑点球的成功率更高', pos: x => x === 'GK', sc: A => (A.div || 70) * 0.6 + (A.ref || 70) * 0.4 - 1.5 }
};
const SK_FX = { fk: '任意球误差 −{12}% · 门将扑救 −{5}%', pen: '点球误差 −{15}% · 门将扑救 −{6}%', long: '远射误差 −{12}% · 门将扑救 −{3}%（平时也更爱远射）', flair: '过人成功率 +{10}%', pass: '传球误差 −{15}%', thru: '直塞误差 −{15}%（平时也更爱找前插的人）', cross: '传中误差 −{18}%', head: '头球误差 −{12}% · 门将扑救 −{4}%', solo: '单刀误差 −{12}% · 门将扑救 −{5}%', box: '禁区内射门误差 −{10}% · 门将扑救 −{3}%', pace: '冲刺速度 +{1.5}%（一直生效）', engine: '体力消耗 −{8}%（一直生效）', tackle: '抢断成功率 +{8}%', icpt: '拦截反应 +{6}%（一直生效）', aerial: '争顶 +{6}%（一直生效）', save: '扑救成功率 +{4}%', pstop: '扑点球成功率 +{10}%' };
const SK_MOVES = ['彩虹过人', '踩单车', '油炸丸子', '马赛回旋', '牛尾巴', '脚后跟磕球', '克鲁伊夫转身', '穿裆'];
const SK_ORD = 'SABC';
const SK_C = new Map();
function skillsOf(p, auto) {
  if (p && !auto && Array.isArray(p.skEd)) return p.skEd.filter(x => SK_DEF[x.id] && SK_T[x.t]); /* 编辑资料里手动设的技能 */
  if (!p || !p.attributes) return []; const A0 = p.attributes, ck = (p.name || '') + '|' + (p.pos || '') + '|' + (p.rating || '') + '|' + Object.values(A0).join(','); if (SK_C.has(ck)) return SK_C.get(ck);
  const A = { spd: 60, sho: 50, pas: 60, dri: 60, def: 50, phy: 65, men: 65, sta: 70, ...A0 }, pos = String(p.pos || ''), line = typeof ENGINE !== 'undefined' ? ENGINE.LINE(pos) : 'MF', h = p.height || 180, out = [];
  Object.entries(SK_DEF).forEach(([id, D]) => { if (!D.pos(line, pos)) return; const g = ghash('sk|' + (p.name || '') + '|' + id), v = D.sc(A, h) + (g - 0.5) * 5; let t = v >= 95.5 ? 'S' : v >= 92 ? 'A' : v >= 88 ? 'B' : v >= 83.5 ? 'C' : null; if (!t) return; if (t === 'C' && g > 0.65) return; if (t === 'B' && g > 0.85) return; out.push({ id, t, v }); });
  const r = p.rating || 75, maxS = r >= 94 ? 2 : r >= 88 ? 1 : 0; let nS = 0; /* S 级只属于顶级球员：88+ 最多一项、94+ 最多两项 */
  const L = out.sort((a, b) => SK_ORD.indexOf(a.t) - SK_ORD.indexOf(b.t) || b.v - a.v).slice(0, line === 'GK' ? 2 : 3).map(({ id, t }) => { if (t === 'S' && nS++ >= maxS) t = 'A'; if (t === 'A' && r < 82) t = 'B'; return { id, t }; }).sort((a, b) => SK_ORD.indexOf(a.t) - SK_ORD.indexOf(b.t));
  SK_C.set(ck, L); return L;
}
const skBadge = (id, t, px = 30) => { const T = SK_T[t]; return `<svg class="skb" width="${px}" height="${px}" viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="skg${t}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="${T.col}"/><stop offset="1" stop-color="${T.col}" stop-opacity=".75"/></radialGradient></defs><circle cx="16" cy="16" r="14.5" fill="url(#skg${t})" stroke="${T.col}" stroke-width="1.5"/><circle cx="16" cy="16" r="12" fill="rgba(10,12,18,.35)"/><g transform="translate(5 5) scale(.917)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="color:#fff">${SK_ICON[id]}</g><circle cx="26" cy="26" r="5.4" fill="#0f1115" stroke="${T.col}" stroke-width="1.2"/><text x="26" y="28.6" text-anchor="middle" font-size="7.4" font-weight="900" fill="${T.col}" font-family="system-ui,sans-serif">${t}</text></svg>`; };
const skFxTxt = (id, t) => (SK_FX[id] || '').replace(/\{([\d.]+)\}/g, (_, v) => +(+v * SK_T[t].pw).toFixed(1));
function skillBlock(L) {
  if (!L || !L.length) return `<div class="skw"><div class="eyebrow" style="margin-bottom:6px">球员技能</div><div class="dim" style="font-size:12px">暂无特长技能</div></div>`;
  return `<div class="skw"><div class="eyebrow" style="margin-bottom:6px">球员技能 <span class="dim" style="font-weight:400;text-transform:none;letter-spacing:0">· 稀有度 C &lt; B &lt; A &lt; S</span></div><div class="skl">${L.map(({ id, t }) => { const D = SK_DEF[id], T = SK_T[t]; return `<div class="ski" style="--c:${T.col}" title="${esc(D.d)}">${skBadge(id, t, 38)}<div style="min-width:0"><div class="skn"><b>${D.n}</b><span class="skt">${t} · ${T.n}</span></div><div class="skd">${esc(D.d)}</div><div class="skd mono">触发率 ${Math.round(T.trig * 100)}% · ${skFxTxt(id, t)}</div></div></div>`; }).join('')}</div></div>`;
}
