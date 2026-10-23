/* ===== VES League 比赛模拟引擎 =====
   依赖全局：PLAYER_DATABASE, TEAMS_DATA, HISTORY */
const ENGINE = (() => {
  const clean = s => String(s || '').replace(/[·\s]/g, '');
  const LINE = p => {
    if (p === 'GK') return 'GK';
    if (/CB|LB|RB|WB/.test(p)) return 'DF';
    if (/DM|CM|LM|RM|AM/.test(p)) return 'MF';
    return 'FW';
  };
  // 进球/助攻倾向（按位置）
  const GOAL_W = { GK: 0, DF: 0.35, MF: 1.1, FW: 4.2 };
  const POS_GOAL = p => /CAM|LAM|RAM/.test(p) ? 1.9 : /LW|RW/.test(p) ? 2.3 : /ST/.test(p) ? 3.1 : /WB/.test(p) ? 0.7 : GOAL_W[LINE(p)];
  const POS_AST = p => /CAM|LAM|RAM/.test(p) ? 3.4 : /LW|RW|LM|RM/.test(p) ? 2.8 : /WB|LB|RB/.test(p) ? 1.6 : /CM/.test(p) ? 2 : /CDM|DM/.test(p) ? 1 : /ST/.test(p) ? 1.6 : LINE(p) === 'GK' ? 0.05 : 0.5;

  // ---------- 阵容 ----------
  const lineupCache = {};
  function lineup(team) {
    if (lineupCache[team]) return lineupCache[team];
    const T = TEAMS_DATA[team], squad = PLAYER_DATABASE[team] || [];
    const used = new Set();
    const xi = T.roster.map(r => {
      const n = clean(r.name);
      let p = squad.find(s => !used.has(s) && clean(s.name) === n)
        || squad.find(s => !used.has(s) && (clean(s.name).includes(n) || n.includes(clean(s.name))));
      if (p) used.add(p);
      const coord = T.coords[r.pos] || [50, 50];
      return {
        slot: r.pos, name: p ? p.name : r.name, rating: p ? p.rating - (r.pen || 0) : r.rating,
        p: p || { name: r.name, pos: r.pos, rating: r.rating, attributes: {} },
        x: coord[0], y: coord[1], line: LINE(r.pos)
      };
    });
    const bench = squad.filter(s => !used.has(s)).sort((a, b) => b.rating - a.rating);
    return (lineupCache[team] = { xi, bench });
  }

  // ---------- 球队实力 ----------
  function strengthOf(L) {
    const { xi, bench } = L;
    const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 75;
    const by = l => xi.filter(s => s.line === l).map(s => s.rating);
    const gk = avg(by('GK')), df = avg(by('DF')), mf = avg(by('MF')), fw = avg(by('FW'));
    const xiAvg = avg(xi.map(s => s.rating));
    const depth = avg(bench.slice(0, 7).map(p => p.rating));
    const atk = fw * 0.5 + mf * 0.35 + df * 0.05 + xiAvg * 0.1;
    const def = df * 0.45 + gk * 0.25 + mf * 0.2 + xiAvg * 0.1;
    const ctl = mf * 0.6 + xiAvg * 0.4;
    return { gk, df, mf, fw, atk, def, ctl, xiAvg, depth, ovr: xiAvg * 0.8 + depth * 0.2 };
  }
  const strengthCache = {};
  function strength(team) { return strengthCache[team] || (strengthCache[team] = strengthOf(lineup(team))); }

  // ---------- 轮换 / 伤停后的实际首发 ----------
  // ctx: { out: {球员名: 缺阵原因}, streak: {球员名: 连续首发场数} }
  const baseRole = pos => roleOf(String(pos || '').replace(/-.*/, ''));
  function fitCost(slot, pos) {
    if (!pos) return 6;
    const a = String(slot).replace(/-.*/, ''), b = String(pos);
    if (a.replace(/^[LR]/, '') === b.replace(/^[LR]/, '') || a === b) return 0;
    if (LINE(a) === 'GK' || LINE(b) === 'GK') return 30;
    if (baseRole(a) === baseRole(b)) return 1;
    if (LINE(a) === LINE(b)) return 4;
    return 10;
  }
  function pickXI(team, ctx) {
    const base = lineup(team);
    if (!ctx) return { xi: base.xi.map(x => ({ ...x, start: 1 })), bench: base.bench.slice(), out: [], rested: [] };
    const out = ctx.out || {}, streak = ctx.streak || {};
    const pool = base.bench.filter(p => !out[p.name]);
    const usedB = new Set();
    const best = base.xi.reduce((m, x) => Math.max(m, x.rating), 0);
    const repl = (slot, minR) => {
      let bp = null, bv = -1e9;
      pool.forEach(p => { if (usedB.has(p)) return; const v = p.rating - fitCost(slot, p.pos) * 1.2; if (v > bv) { bv = v; bp = p; } });
      if (!bp || (minR != null && bp.rating - fitCost(slot, bp.pos) < minR)) return null;
      usedB.add(bp); return bp;
    };
    const missing = [], rested = [];
    const xi = base.xi.map(x => {
      let why = out[x.name];
      if (!why) {
        const st = streak[x.name] || 0;
        let pr = st >= 4 ? 0.04 + 0.035 * (st - 4) : 0.012;
        if (x.line === 'GK') pr *= 0.12;
        if (x.rating >= best - 1) pr *= 0.55;
        if (rnd() < Math.min(0.32, pr)) why = 'rest';
      }
      if (!why) return { ...x, start: 1 };
      const p = repl(x.slot, why === 'rest' ? x.rating - 7 : null);
      if (!p) return { ...x, start: 1 };
      if (why === 'rest') rested.push(x.name); else missing.push({ name: x.name, why });
      const cost = fitCost(x.slot, p.pos);
      return { slot: x.slot, name: p.name, rating: Math.max(60, p.rating - cost), p, x: x.x, y: x.y, line: x.line, start: 1, sub4: x.name };
    });
    const onXI = new Set(xi.map(x => x.name));
    const bench = base.bench.filter(p => !onXI.has(p.name) && !out[p.name]).concat(base.xi.filter(x => !onXI.has(x.name) && !out[x.name]).map(x => x.p)).sort((a, b) => b.rating - a.rating);
    return { xi, bench, out: missing, rested };
  }

  // ---------- 天气/时段状态 ----------
  const WEATHERS = ['晴天', '阴天', '雨天'];
  const SLOTS = ['早上', '上午', '中午', '下午', '傍晚', '晚上', '深夜', '凌晨'];
  let teamMod = null;
  const setTeamMod = f => { teamMod = f; };
  function condition(team, weather, slot) {
    const P = HISTORY.profiles[team] || {};
    const parse = s => (s || '').split(/[；;]/).map(x => x.trim());
    const [bw, bt] = parse(P.best), [ww, wt] = parse(P.worst);
    let m = 1, tags = [], mods = [];
    const add = (txt, d) => { m += d / 100; tags.push(txt); mods.push({ txt, d }); };
    if (bw === weather) add('喜欢' + weather, 4);
    if (bt === slot) add('擅长' + slot, 4);
    if (ww === weather) add('怕' + weather, -4.5);
    if (wt === slot) add('不适应' + slot, -4.5);
    if (teamMod) (teamMod(team) || []).forEach(x => add(x.txt, x.d));
    const level = m >= 1.075 ? '最佳' : m > 1.01 ? '良好' : m <= 0.925 ? '最差' : m < 0.99 ? '低迷' : '正常';
    return { m, level, tags, mods };
  }

  // ---------- 随机工具 ----------
  let seed = Date.now() % 2147483647;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  function gauss() { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }
  function pick(arr, w) { const t = w.reduce((a, b) => a + b, 0); let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; }

  // ---------- 战术打法：进攻型多进也多丢，防守型少丢也少进，反击克制控球 ----------
  function styleFx(s, opp) {
    s = s || ''; opp = opp || ''; let a = 0, d = 0;
    if (/极致攻击|攻击性控球|控球进攻|三叉戟|暴力突击|双核|核心终结|边路突破|中路渗透|攻击型/.test(s)) { a += 0.035; d -= 0.02; }
    if (/摆大巴|极致防守|稳固防守|坚固的防守|区域联防|压缩空间/.test(s)) { a -= 0.04; d += 0.055; }
    if (/反击/.test(s)) { a += 0.01; d += 0.02; if (/控球|压制/.test(opp)) a += 0.03; }
    if (/逼抢|压制|反抢/.test(s)) { a += 0.015; d += 0.01; if (/控球/.test(opp)) a += 0.015; }
    if (/控球|中场控制/.test(s)) { a += 0.01; d += 0.01; }
    return { a, d };
  }
  // ---------- 期望进球 ----------
  // opt.L = { h: pickXI(...), a: pickXI(...) } 时按实际首发计算
  function expected(home, away, opt = {}) {
    const H = opt.L ? strengthOf(opt.L.h) : strength(home), A = opt.L ? strengthOf(opt.L.a) : strength(away);
    const ch = condition(home, opt.weather, opt.slot), ca = condition(away, opt.weather, opt.slot);
    const homeAdv = opt.neutral ? 1 : 1.12, awayPen = opt.neutral ? 1 : 0.94;
    const k = 0.078;
    const sh = styleFx((TEAMS_DATA[home] || {}).style, (TEAMS_DATA[away] || {}).style), sa = styleFx((TEAMS_DATA[away] || {}).style, (TEAMS_DATA[home] || {}).style);
    let lh = 1.06 * Math.exp(k * (H.atk - A.def)) * Math.exp(0.04 * (H.ctl - A.ctl)) * homeAdv * ch.m / Math.sqrt(ca.m) * (1 + sh.a) * (1 - sa.d);
    let la = 1.06 * Math.exp(k * (A.atk - H.def)) * Math.exp(0.04 * (A.ctl - H.ctl)) * awayPen * ca.m / Math.sqrt(ch.m) * (1 + sa.a) * (1 - sh.d);
    return { lh: Math.min(lh, 5), la: Math.min(la, 5), ch, ca, H, A };
  }

  function quickScore(home, away, opt) {
    const e = expected(home, away, opt);
    const fh = Math.max(0.6, 1 + gauss() * 0.13), fa = Math.max(0.6, 1 + gauss() * 0.13);
    return [poisson(e.lh * fh), poisson(e.la * fa)];
  }

  function probabilities(home, away, opt, n = 1500) {
    let w = 0, d = 0, l = 0;
    for (let i = 0; i < n; i++) { const [a, b] = quickScore(home, away, opt); a > b ? w++ : a === b ? d++ : l++; }
    return { w: w / n, d: d / n, l: l / n };
  }

  // ---------- 完整比赛 ----------
  const shoOf = s => (s.p && s.p.attributes && s.p.attributes.sho) || s.rating;
  const pasOf = s => (s.p && s.p.attributes && s.p.attributes.pas) || s.rating;
  function goalScorer(on) {
    const w = on.map(s => POS_GOAL(s.slot) * Math.pow(shoOf(s) / 80, 2) * Math.pow(s.rating / 85, 2));
    return pick(on, w);
  }
  function assister(on, scorer) {
    if (rnd() < 0.22) return null;
    const pool = on.filter(s => s !== scorer); if (!pool.length) return null;
    const w = pool.map(s => POS_AST(s.slot) * Math.pow(pasOf(s) / 80, 3));
    return pick(pool, w);
  }
  function carder(on) {
    const w = on.map(s => (s.line === 'DF' ? 2 : /DM/.test(s.slot) ? 2.6 : s.line === 'MF' ? 1.3 : s.line === 'GK' ? 0.15 : 0.8) * (1 + ((s.p && s.p.attributes && s.p.attributes.phy) || 75) / 200));
    return pick(on, w);
  }
  // 点球手：场上射门能力最好的球员（前锋优先）
  function penTaker(on) {
    const c = on.filter(s => s.line !== 'GK'); if (!c.length) return on[0];
    return c.reduce((b, s) => { const v = shoOf(s) + (/ST/.test(s.slot) ? 4 : /AM|W/.test(s.slot) ? 2 : 0) + s.rating * 0.2; return v > b.v ? { s, v } : b; }, { s: c[0], v: -1 }).s;
  }
  // 伤病休战轮数：多数是一两轮的小伤，偶尔长期伤停
  function injuryRounds() { const r = rnd(); return r < 0.34 ? 1 : r < 0.58 ? 2 : r < 0.74 ? 3 : r < 0.84 ? 4 : r < 0.93 ? 5 + Math.floor(rnd() * 4) : 10 + Math.floor(rnd() * 11); }

  const GOAL_TXT = [
    (s, a) => a ? `${a} 送出直塞，${s} 推射远角得手` : `${s} 禁区线前突然起脚，皮球直挂死角`,
    (s, a) => a ? `${a} 传中，${s} 前点抢点头球破门` : `${s} 抢断后单刀推射，干净利落`,
    (s, a) => a ? `${a} 横传门前，${s} 包抄推空门` : `${s} 连过两人后低射入网`,
    (s, a) => a ? `${s} 接 ${a} 的回做，一脚弧线球兜进远角` : `${s} 主罚任意球，绕过人墙直入网窝`,
    (s, a) => a ? `${a} 角球开出，${s} 力压后卫头槌建功` : `${s} 冷静罚进点球`,
    (s, a) => a ? `快速反击！${a} 长传找到 ${s}，单刀挑射得分` : `${s} 补射破门，门将扑救脱手`,
  ];
  const PEN_TXT = [
    s => `${s} 主罚点球，推射死角，门将判断对了方向也够不着`, s => `${s} 冷静罚进点球`, s => `点球！${s} 骗倒门将后轻松推射空门`,
  ];
  const PMISS_TXT = [
    (s, g) => g ? `${s} 主罚点球，被 ${g} 判断对方向扑出！` : `${s} 主罚点球，被门将扑出！`, s => `${s} 主罚点球，皮球击中立柱弹出！`, s => `${s} 主罚点球，打飞了！`,
  ];
  const INJ_TXT = (n, d) => `${n} 拉伤倒地，无法坚持，被担架抬下（预计缺阵 ${d} 轮）`;
  const SUB_TXT = (i, o) => `换人：${i} 替下 ${o}`;
  const CHANCE_TXT = [
    (s) => `${s} 远射击中横梁！`, (s) => `${s} 单刀被门将神勇扑出`, (s) => `${s} 头球稍稍偏出立柱`,
    (s) => `${s} 禁区内倒地，裁判示意比赛继续`, (s) => `${s} 的射门被后卫门线解围`,
  ];

  // ---------- 位置化的赛后数据与评分 ----------
  function roleOf(slot) {
    const p = String(slot).replace(/-.*/, '');
    if (p === 'GK') return 'GK';
    if (/WB/.test(p) || p === 'LB' || p === 'RB') return 'FB';
    if (/CB/.test(p)) return 'CB';
    if (/DM/.test(p)) return 'DM';
    if (/AM/.test(p)) return 'AM';
    if (p === 'LM' || p === 'RM') return 'WM';
    if (/CM/.test(p)) return 'CM';
    if (/LW|RW/.test(p)) return 'W';
    return 'ST';
  }
  const ROLE_ZH = { GK: '门将', CB: '中卫', FB: '边卫', DM: '后腰', CM: '中场', WM: '边前卫', AM: '前腰', W: '边锋', ST: '前锋' };
  // 每个位置看重的数据不同：门将看扑救和零封、中卫看抢断拦截和失球、中场看关键传球和控球、锋线看进球和射正
  function matchRating(r, o) {
    const res = o.gf > o.ga ? 0.3 : o.gf < o.ga ? -0.3 : 0;
    const cs = o.ga === 0;
    const ROLE_BASE = { GK: 6.25, CB: 6.5, FB: 6.35, DM: 6.15, CM: 6.5, WM: 6.45, AM: 6.2, W: 6.1, ST: 6.35 };
    let v = ROLE_BASE[r.role] + (r.ovr - 82) * 0.035 + res + gauss() * 0.22;
    switch (r.role) {
      case 'GK': v += r.sv * 0.22 + (cs ? 0.9 : 0) - o.ga * 0.32; break;
      case 'CB': v += r.tk * 0.10 + r.int * 0.12 + (cs ? 0.6 : 0) - o.ga * 0.22 + r.g * 0.9 + r.a * 0.6; break;
      case 'FB': v += r.tk * 0.08 + r.int * 0.08 + r.kp * 0.12 + (cs ? 0.4 : 0) - o.ga * 0.15 + r.g * 0.9 + r.a * 0.7; break;
      case 'DM': v += r.tk * 0.10 + r.int * 0.10 + r.kp * 0.08 + (o.poss - 50) * 0.015 + (cs ? 0.25 : 0) - o.ga * 0.08 + r.g * 0.9 + r.a * 0.6; break;
      case 'CM': v += r.tk * 0.06 + r.int * 0.05 + r.kp * 0.14 + (o.poss - 50) * 0.02 + r.g * 0.9 + r.a * 0.7; break;
      case 'WM': case 'AM': case 'W': v += r.kp * 0.16 + r.ot * 0.12 - (r.sh - r.ot) * 0.03 + r.g * 0.95 + r.a * 0.75 - (r.g + r.a === 0 ? 0.15 : 0); break;
      default: v += r.g * 1.05 + r.ot * 0.15 - (r.sh - r.ot) * 0.05 + r.a * 0.6 + r.kp * 0.08 - (r.g === 0 ? 0.35 : 0);
    }
    if (r.ps >= 15 && (r.role === 'CB' || r.role === 'DM' || r.role === 'CM')) v += (r.pc / r.ps - 0.85) * 2;
    v -= r.yc * 0.3 + r.rc * 1.5 + (r.pm || 0) * 0.6;
    if (r.min < 60) v = 6 + (v - 6) * Math.max(0.3, r.min / 90);
    return +Math.max(4.5, Math.min(10, v)).toFixed(1);
  }
  // X: [{slot,line,r,attr,min?,start?}]；o: {goals:[[进球者下标,助攻者下标,是否点球]], pmiss:[[下标,是否被扑]], cards:[[下标,是否红牌,分钟]], shots, ot, oppOt, gf, ga, poss, press}
  const PASS_W = { GK: 0.45, CB: 1.25, FB: 1.0, DM: 1.35, CM: 1.35, WM: 0.95, AM: 1.05, W: 0.75, ST: 0.55 };
  const PASS_ACC = { GK: 0.68, CB: 0.89, FB: 0.80, DM: 0.88, CM: 0.87, WM: 0.79, AM: 0.80, W: 0.76, ST: 0.71 };
  function sideStats(X, o) {
    const rows = X.map(x => ({ slot: x.slot, line: x.line, role: roleOf(x.slot), ovr: x.r, min: x.min == null ? 90 : x.min, start: x.start == null ? 1 : x.start, sh: 0, ot: 0, tk: 0, int: 0, kp: 0, sv: 0, g: 0, a: 0, yc: 0, rc: 0, ps: 0, pc: 0, pg: 0, pm: 0, da: 0, ds: 0 }));
    const att = (x, k) => (x.attr && x.attr[k]) || x.r;
    const mf = k => Math.max(0.05, rows[k].min / 90);
    o.goals.forEach(([gi, ai, pen]) => { if (gi >= 0) { rows[gi].g++; rows[gi].sh++; rows[gi].ot++; if (pen) rows[gi].pg++; } if (ai >= 0) { rows[ai].a++; rows[ai].kp++; } });
    (o.pmiss || []).forEach(([pi, saved]) => { if (pi >= 0) { rows[pi].pm++; rows[pi].sh++; if (saved) rows[pi].ot++; } });
    const gf = o.goals.length;
    const used = rows.reduce((a, r) => a + r.sh, 0), usedOt = rows.reduce((a, r) => a + r.ot, 0);
    const shW = X.map((x, k) => x.line === 'GK' ? 0 : (Math.sqrt(POS_GOAL(x.slot)) * att(x, 'sho') / 80 + 0.25) * mf(k));
    const extra = [];
    for (let n = Math.max(0, o.shots - used); n > 0; n--) { const k = X.indexOf(pick(X, shW)); rows[k].sh++; extra.push(k); }
    for (let n = Math.max(0, o.ot - usedOt); n > 0 && extra.length; n--) { const j = Math.floor(rnd() * extra.length); rows[extra[j]].ot++; extra.splice(j, 1); }
    const kpW = X.map((x, k) => POS_AST(x.slot) * Math.pow(att(x, 'pas') / 80, 2) * mf(k));
    for (let n = Math.max(0, Math.round(o.shots * 0.7) - rows.reduce((a, r) => a + r.kp, 0)); n > 0; n--) rows[X.indexOf(pick(X, kpW))].kp++;
    const tkW = X.map((x, k) => (x.line === 'GK' ? 0.02 : x.line === 'DF' ? 2.8 : /DM/.test(x.slot) ? 3.4 : x.line === 'MF' ? 1.8 : 0.6) * Math.pow(att(x, 'def') / 75, 2) * mf(k));
    const tk = Math.max(6, Math.round(15 + gauss() * 3.5 + (o.press ? 3 : 0) + (50 - o.poss) * 0.12));
    for (let n = 0; n < tk; n++) rows[X.indexOf(pick(X, tkW))].tk++;
    const inW = X.map((x, k) => (x.line === 'GK' ? 0.01 : /CB/.test(x.slot) ? 3.2 : x.line === 'DF' ? 2.2 : /DM/.test(x.slot) ? 3 : x.line === 'MF' ? 1.2 : 0.3) * Math.pow(att(x, 'def') / 75, 2) * mf(k));
    const it = Math.max(3, Math.round(9 + gauss() * 2.5 + (50 - o.poss) * 0.1));
    for (let n = 0; n < it; n++) rows[X.indexOf(pick(X, inW))].int++;
    // 过人：边锋、前腰、前锋尝试最多，成功率看盘带能力
    rows.forEach((r, k) => { const x = X[k], sl = x.slot || ''; const base = x.line === 'GK' ? 0 : /W/.test(sl) && !/WB/.test(sl) ? 2.6 : /AM/.test(sl) ? 1.9 : /ST|CF/.test(sl) ? 1.7 : x.line === 'MF' ? 0.8 : /WB|LB|RB/.test(sl) ? 0.6 : 0.2;
      const exp = base * Math.pow(att(x, 'dri') / 80, 2) * mf(k) * Math.max(0.6, 1 + (o.poss - 50) * 0.01);
      r.da = Math.max(0, Math.round(exp + gauss() * Math.sqrt(exp + 0.01) * 0.7));
      r.ds = Math.round(r.da * Math.max(0.15, Math.min(0.88, 0.4 + (att(x, 'dri') - 75) * 0.012 + gauss() * 0.08))); });
    // 传球：总数跟控球率走，按位置和传球能力分给场上球员，成功率看位置、传球能力和控球
    const tot = Math.max(180, Math.round(420 + (o.poss - 50) * 13 + gauss() * 35));
    const pw = X.map((x, k) => PASS_W[rows[k].role] * Math.pow(att(x, 'pas') / 80, 1.5) * mf(k));
    const pws = pw.reduce((a, b) => a + b, 0) || 1;
    rows.forEach((r, k) => {
      const exp = tot * pw[k] / pws;
      r.ps = Math.max(0, Math.round(exp + gauss() * Math.sqrt(exp) * 0.6));
      const acc = Math.max(0.5, Math.min(0.97, PASS_ACC[r.role] + (att(X[k], 'pas') - 80) * 0.004 + (o.poss - 50) * 0.002 + gauss() * 0.03));
      r.pc = Math.round(r.ps * acc);
    });
    const gk = rows.find(r => r.line === 'GK' && r.start) || rows.find(r => r.line === 'GK'); if (gk) gk.sv = Math.max(0, o.oppOt - o.ga);
    o.cards.forEach(([ci, red, m]) => { if (ci < 0) return; if (red) { rows[ci].rc++; rows[ci].min = Math.min(rows[ci].min, Math.max(1, Math.floor(m) - (90 - rows[ci].min) * 0)); } else rows[ci].yc++; });
    rows.forEach(r => r.r = matchRating(r, o));
    return rows;
  }

  // opt: { weather, slot, neutral, ctx: { h, a }（伤停/轮换上下文，可省略）}
  function simulate(home, away, opt = {}) {
    const L = opt.L || { h: pickXI(home, opt.ctx && opt.ctx.h), a: pickXI(away, opt.ctx && opt.ctx.a) };
    const e = expected(home, away, { ...opt, L });
    const fh = Math.max(0.6, 1 + gauss() * 0.13), fa = Math.max(0.6, 1 + gauss() * 0.13);
    let hg = poisson(e.lh * fh), ag = poisson(e.la * fa);
    const events = [];
    const minute = () => 1 + Math.floor(rnd() * 90);
    const T = { h: home, a: away };
    // 每队的出场名单：首发 + 换人，记录上下场分钟
    const squad = {};
    ['h', 'a'].forEach(side => {
      const Ls = L[side];
      const roster = Ls.xi.map(x => ({ ...x, on: 0, off: 95 }));
      const bench = Ls.bench.slice();
      const streak = (opt.ctx && opt.ctx[side] && opt.ctx[side].streak) || {};
      const takeSub = (slot) => {
        let bp = null, bv = -1e9;
        bench.forEach(p => { const v = p.rating - fitCost(slot, p.pos) * 1.5; if (v > bv) { bv = v; bp = p; } });
        if (!bp) return null;
        bench.splice(bench.indexOf(bp), 1); return bp;
      };
      const subs = [];
      let left = rnd() < 0.1 ? 2 : rnd() < 0.45 ? 3 : rnd() < 0.7 ? 4 : 5;
      // 伤病（小概率）：连续首发越多越容易受伤
      roster.slice().forEach(x => {
        const pr = 0.0105 + Math.max(0, (streak[x.name] || 0) - 5) * 0.0015;
        if (rnd() < pr && left > 0) {
          const m = 3 + Math.floor(rnd() * 85), d = injuryRounds();
          const inP = takeSub(x.slot);
          events.push({ m, type: 'inj', side, team: T[side], player: x.name, dur: d, txt: INJ_TXT(x.name, d) });
          x.off = m;
          if (inP) { roster.push({ slot: x.slot, name: inP.name, rating: Math.max(60, inP.rating - fitCost(x.slot, inP.pos)), p: inP, line: x.line, on: m, off: 95, start: 0 }); subs.push([m + 0.01, inP.name, x.name]); left--; }
        }
      });
      // 常规换人：多在下半场，优先换下进攻球员和体能差的
      const nPlan = Math.max(0, left - (rnd() < 0.25 ? 1 : 0));
      for (let i = 0; i < nPlan; i++) {
        const m = rnd() < 0.08 ? 46 : 55 + Math.floor(rnd() * 33);
        const cand = roster.filter(x => x.on <= m && x.off > m && x.line !== 'GK');
        if (!cand.length) break;
        const w = cand.map(x => (x.line === 'FW' ? 2.6 : x.line === 'MF' ? 1.8 : 1) * (x.start ? 1 : 0.15) * (1 + Math.max(0, 88 - x.rating) * 0.04));
        const x = pick(cand, w);
        const inP = takeSub(x.slot); if (!inP) break;
        x.off = m;
        roster.push({ slot: x.slot, name: inP.name, rating: Math.max(60, inP.rating - fitCost(x.slot, inP.pos)), p: inP, line: x.line, on: m, off: 95, start: 0 });
        subs.push([m, inP.name, x.name]);
      }
      subs.forEach(([m, i, o]) => events.push({ m, type: 'sub', side, team: T[side], player: i, out: o, txt: SUB_TXT(i, o) }));
      squad[side] = roster;
    });
    const onAt = (side, m) => squad[side].filter(x => x.on <= m && x.off > m && !x.sent);
    // 牌（先发生，红牌会让球员提前离场）
    [['h'], ['a']].forEach(([side]) => {
      const t = T[side], st = TEAMS_DATA[t].style || '';
      const yc = poisson(1.6 + (/逼抢|压制|对抗|绞杀/.test(st) ? 0.6 : 0));
      const ms = []; for (let i = 0; i < yc; i++) ms.push(5 + Math.floor(rnd() * 88));
      if (rnd() < 0.035) ms.push(-(10 + Math.floor(rnd() * 80)));
      ms.sort((x, y) => Math.abs(x) - Math.abs(y));
      const used = {};
      ms.forEach(mm => {
        const m = Math.abs(mm), on = onAt(side, m); if (!on.length) return;
        const p = carder(on);
        if (mm < 0) { events.push({ m, type: 'red', side, team: t, player: p.name, straight: 1, txt: `${p.name} 背后铲抢，直接红牌！` }); p.sent = m; p.off = Math.min(p.off, m); return; }
        used[p.name] = (used[p.name] || 0) + 1;
        if (used[p.name] === 2) { events.push({ m, type: 'red', side, team: t, player: p.name, txt: `${p.name} 两黄变一红，被罚下场` }); p.sent = m; p.off = Math.min(p.off, m); }
        else if (used[p.name] < 2) events.push({ m, type: 'yellow', side, team: t, player: p.name, txt: `${p.name} 战术犯规，吃到黄牌` });
      });
    });
    // 被罚下的球员如果原本计划被换下，那次换人取消
    ['h', 'a'].forEach(side => squad[side].forEach(x => {
      if (!x.sent) return;
      const ev = events.find(e => e.type === 'sub' && e.side === side && e.out === x.name && e.m > x.sent);
      if (ev) { events.splice(events.indexOf(ev), 1); const sb = squad[side].find(y => y.name === ev.player && !y.start); if (sb) squad[side].splice(squad[side].indexOf(sb), 1); }
    }));
    const onPitch = (side, m) => squad[side].filter(x => x.on <= m && x.off > m);
    // 进球（含点球）
    const addGoals = (side, n) => {
      for (let i = 0; i < n; i++) {
        let m = minute(); if (m === 45 && rnd() < 0.4) m = 45.1; if (m === 90 && rnd() < 0.6) m = 90 + 1 + Math.floor(rnd() * 5);
        const on = onPitch(side, Math.min(m, 89.9)); if (!on.length) continue;
        const pen = rnd() < 0.07;
        const sc = pen ? penTaker(on) : goalScorer(on), as = pen ? null : assister(on, sc);
        events.push({ m, type: 'goal', side, team: T[side], player: sc.name, assist: as ? as.name : null, pen: pen ? 1 : 0, txt: pen ? PEN_TXT[Math.floor(rnd() * PEN_TXT.length)](sc.name) : GOAL_TXT[Math.floor(rnd() * GOAL_TXT.length)](sc.name, as && as.name) });
      }
    };
    addGoals('h', hg); addGoals('a', ag);
    // 罚丢的点球
    const pmiss = { h: [], a: [] };
    ['h', 'a'].forEach(side => {
      if (rnd() >= 0.032) return;
      const m = minute(), on = onPitch(side, m); if (!on.length) return;
      const tk = penTaker(on), saved = rnd() < 0.62;
      const og = onPitch(side === 'h' ? 'a' : 'h', m).find(x => x.line === 'GK');
      const txt = saved ? PMISS_TXT[0](tk.name, og && og.name) : PMISS_TXT[1 + Math.floor(rnd() * 2)](tk.name);
      events.push({ m, type: 'pmiss', side, team: T[side], player: tk.name, saved: saved ? 1 : 0, txt });
      pmiss[side].push([tk.name, saved]);
    });
    // 机会
    const chances = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < chances; i++) {
      const side = rnd() < e.lh / (e.lh + e.la) ? 'h' : 'a', m = minute();
      const on = onPitch(side, m); if (!on.length) continue;
      const s = goalScorer(on);
      events.push({ m, type: 'chance', side, team: T[side], player: s.name, txt: CHANCE_TXT[Math.floor(rnd() * CHANCE_TXT.length)](s.name) });
    }
    events.sort((a, b) => a.m - b.m);
    hg = events.filter(ev => ev.type === 'goal' && ev.side === 'h').length; ag = events.filter(ev => ev.type === 'goal' && ev.side === 'a').length;
    // 统计
    const share = e.H.ctl * (opt.neutral ? 1 : 1.03) / (e.H.ctl + e.A.ctl);
    let poss = Math.round(50 + (share - 0.5) * 420 + gauss() * 4);
    const styleAdj = s => /控球/.test(s) ? 4 : /摆大巴|反击|防守/.test(s) ? -4 : 0;
    poss += styleAdj(TEAMS_DATA[home].style) - styleAdj(TEAMS_DATA[away].style);
    poss = Math.max(28, Math.min(72, poss));
    const savedPens = side => pmiss[side].filter(x => x[1]).length;
    const shots = (lam, g, side) => Math.max(g + 1 + pmiss[side].length, Math.round(lam * 4.2 + gauss() * 2.5 + 6));
    const hs = shots(e.lh, hg, 'h'), as = shots(e.la, ag, 'a');
    const ot = (s, g, side) => Math.max(g + savedPens(side), Math.min(s, Math.round(s * (0.36 + rnd() * 0.14))));
    const stats = {
      poss: [poss, 100 - poss], shots: [hs, as], onTarget: [ot(hs, hg, 'h'), ot(as, ag, 'a')],
      corners: [Math.round(hs * 0.38 + rnd() * 3), Math.round(as * 0.38 + rnd() * 3)],
      xg: [+(e.lh * fh * 0.92).toFixed(2), +(e.la * fa * 0.92).toFixed(2)],
    };
    // ---------- 球员个人数据 ----------
    const players = {};
    [['h', 0, 1], ['a', 1, 0]].forEach(([side, i, o]) => {
      const R = squad[side], t = T[side];
      const idx = n => R.findIndex(s => s.name === n);
      const rows = sideStats(R.map(s => ({ slot: s.slot, line: s.line, r: s.rating, attr: s.p && s.p.attributes, min: Math.max(1, Math.min(90, s.off) - s.on), start: s.start ? 1 : 0 })), {
        goals: events.filter(ev => ev.type === 'goal' && ev.side === side).map(ev => [idx(ev.player), ev.assist ? idx(ev.assist) : -1, ev.pen]),
        pmiss: pmiss[side].map(([n, sv]) => [idx(n), sv]),
        cards: events.filter(ev => (ev.type === 'yellow' || ev.type === 'red') && ev.side === side).map(ev => [idx(ev.player), ev.type === 'red' ? 1 : 0, ev.m]),
        shots: stats.shots[i], ot: stats.onTarget[i], oppOt: stats.onTarget[o], gf: side === 'h' ? hg : ag, ga: side === 'h' ? ag : hg, poss: stats.poss[i],
        press: /防守|逼抢|压制|摆大巴|对抗/.test(TEAMS_DATA[t].style || ''),
      });
      players[side] = rows.map((r, k) => ({ ...r, name: R[k].name, slot: R[k].slot }));
    });
    const sum = (k, f) => players[k].reduce((a, r) => a + r[f], 0);
    stats.tackles = [sum('h', 'tk'), sum('a', 'tk')];
    stats.saves = [sum('h', 'sv'), sum('a', 'sv')];
    stats.interceptions = [sum('h', 'int'), sum('a', 'int')];
    stats.keyPasses = [sum('h', 'kp'), sum('a', 'kp')];
    stats.passes = [sum('h', 'ps'), sum('a', 'ps')];
    stats.passesOk = [sum('h', 'pc'), sum('a', 'pc')];
    const all = [...players.h.map(r => ({ ...r, team: home })), ...players.a.map(r => ({ ...r, team: away }))].filter(r => r.min >= 20);
    const motm = all.sort((a, b) => b.r - a.r)[0];
    return { home, away, hg, ag, events, stats, players, lineups: { h: L.h, a: L.a }, motm: { team: motm.team, name: motm.name, r: motm.r }, cond: { h: e.ch, a: e.ca }, opt: { weather: opt.weather, slot: opt.slot } };
  }

  // ---------- 赛程（双循环） ----------
  function fixtures(teams) {
    const t = teams.slice(); const n = t.length; const rounds = [];
    const arr = t.slice(1);
    for (let r = 0; r < n - 1; r++) {
      const ring = [t[0], ...arr];
      const ms = [];
      for (let i = 0; i < n / 2; i++) {
        const a = ring[i], b = ring[n - 1 - i];
        ms.push((r + i) % 2 === 0 ? { h: a, a: b } : { h: b, a: a });
      }
      rounds.push(ms);
      arr.unshift(arr.pop());
    }
    const second = rounds.map(ms => ms.map(m => ({ h: m.a, a: m.h })));
    return rounds.concat(second);
  }

  function randomConditions() { return { weather: pick(WEATHERS, [5, 3, 2]), slot: pick(SLOTS, [1, 1.5, 2, 3, 3, 4, 1, 0.5]) }; }

  function clearCache() { Object.keys(lineupCache).forEach(k => delete lineupCache[k]); Object.keys(strengthCache).forEach(k => delete strengthCache[k]); }
  // 用固定种子跑一段（杯赛球员数据要可重现）
  function withSeed(sd, fn) { const old = seed; seed = sd; try { return fn(); } finally { seed = old; } }
  return { withSeed, setTeamMod, clearCache, roleOf, ROLE_ZH, matchRating, sideStats, lineup, pickXI, strengthOf, fitCost, strength, condition, expected, probabilities, simulate, quickScore, fixtures, randomConditions, WEATHERS, SLOTS, LINE, clean };
})();
if (typeof module !== 'undefined') module.exports = ENGINE;
