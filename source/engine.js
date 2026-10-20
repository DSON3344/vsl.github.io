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
        slot: r.pos, name: p ? p.name : r.name, rating: p ? p.rating : r.rating,
        p: p || { name: r.name, pos: r.pos, rating: r.rating, attributes: {} },
        x: coord[0], y: coord[1], line: LINE(r.pos)
      };
    });
    const bench = squad.filter(s => !used.has(s)).sort((a, b) => b.rating - a.rating);
    return (lineupCache[team] = { xi, bench });
  }

  // ---------- 球队实力 ----------
  const strengthCache = {};
  function strength(team) {
    if (strengthCache[team]) return strengthCache[team];
    const { xi, bench } = lineup(team);
    const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 75;
    const by = l => xi.filter(s => s.line === l).map(s => s.rating);
    const gk = avg(by('GK')), df = avg(by('DF')), mf = avg(by('MF')), fw = avg(by('FW'));
    const xiAvg = avg(xi.map(s => s.rating));
    const depth = avg(bench.slice(0, 7).map(p => p.rating));
    const atk = fw * 0.5 + mf * 0.35 + df * 0.05 + xiAvg * 0.1;
    const def = df * 0.45 + gk * 0.25 + mf * 0.2 + xiAvg * 0.1;
    const ctl = mf * 0.6 + xiAvg * 0.4;
    return (strengthCache[team] = { gk, df, mf, fw, atk, def, ctl, xiAvg, depth, ovr: xiAvg * 0.8 + depth * 0.2 });
  }

  // ---------- 天气/时段状态 ----------
  const WEATHERS = ['晴天', '阴天', '雨天'];
  const SLOTS = ['早上', '上午', '中午', '下午', '傍晚', '晚上', '深夜', '凌晨'];
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
    const level = m >= 1.075 ? '最佳' : m > 1.01 ? '良好' : m <= 0.925 ? '最差' : m < 0.99 ? '低迷' : '正常';
    return { m, level, tags, mods };
  }

  // ---------- 随机工具 ----------
  let seed = Date.now() % 2147483647;
  const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  function gauss() { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function poisson(l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }
  function pick(arr, w) { const t = w.reduce((a, b) => a + b, 0); let r = rnd() * t; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; }

  // ---------- 期望进球 ----------
  function expected(home, away, opt = {}) {
    const H = strength(home), A = strength(away);
    const ch = condition(home, opt.weather, opt.slot), ca = condition(away, opt.weather, opt.slot);
    const homeAdv = opt.neutral ? 1 : 1.12, awayPen = opt.neutral ? 1 : 0.94;
    const k = 0.078;
    let lh = 1.06 * Math.exp(k * (H.atk - A.def)) * Math.exp(0.04 * (H.ctl - A.ctl)) * homeAdv * ch.m / Math.sqrt(ca.m);
    let la = 1.06 * Math.exp(k * (A.atk - H.def)) * Math.exp(0.04 * (A.ctl - H.ctl)) * awayPen * ca.m / Math.sqrt(ch.m);
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
  function goalScorer(team) {
    const { xi } = lineup(team);
    const w = xi.map(s => POS_GOAL(s.slot) * Math.pow(((s.p.attributes && s.p.attributes.sho) || s.rating) / 80, 2) * Math.pow(s.rating / 85, 2));
    return pick(xi, w);
  }
  function assister(team, scorer) {
    if (rnd() < 0.22) return null;
    const { xi } = lineup(team);
    const pool = xi.filter(s => s !== scorer);
    const w = pool.map(s => POS_AST(s.slot) * Math.pow(((s.p.attributes && s.p.attributes.pas) || s.rating) / 80, 3));
    return pick(pool, w);
  }
  function carder(team) {
    const { xi } = lineup(team);
    const w = xi.map(s => (s.line === 'DF' ? 2 : /DM/.test(s.slot) ? 2.6 : s.line === 'MF' ? 1.3 : s.line === 'GK' ? 0.15 : 0.8) * (1 + ((s.p.attributes && s.p.attributes.phy) || 75) / 200));
    return pick(xi, w);
  }

  const GOAL_TXT = [
    (s, a) => a ? `${a} 送出直塞，${s} 推射远角得手` : `${s} 禁区线前突然起脚，皮球直挂死角`,
    (s, a) => a ? `${a} 传中，${s} 前点抢点头球破门` : `${s} 抢断后单刀推射，干净利落`,
    (s, a) => a ? `${a} 横传门前，${s} 包抄推空门` : `${s} 连过两人后低射入网`,
    (s, a) => a ? `${s} 接 ${a} 的回做，一脚弧线球兜进远角` : `${s} 主罚任意球，绕过人墙直入网窝`,
    (s, a) => a ? `${a} 角球开出，${s} 力压后卫头槌建功` : `${s} 冷静罚进点球`,
    (s, a) => a ? `快速反击！${a} 长传找到 ${s}，单刀挑射得分` : `${s} 补射破门，门将扑救脱手`,
  ];
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
    v -= r.yc * 0.3 + r.rc * 1.5;
    if (r.min < 60) v = 6 + (v - 6) * Math.max(0.3, r.min / 90);
    return +Math.max(4.5, Math.min(10, v)).toFixed(1);
  }
  // X: [{slot,line,r,attr}]；o: {goals:[[进球者下标,助攻者下标]], cards:[[下标,是否红牌,分钟]], shots, ot, oppOt, gf, ga, poss, press}
  function sideStats(X, o) {
    const rows = X.map(x => ({ slot: x.slot, line: x.line, role: roleOf(x.slot), ovr: x.r, min: 90, sh: 0, ot: 0, tk: 0, int: 0, kp: 0, sv: 0, g: 0, a: 0, yc: 0, rc: 0 }));
    const att = (x, k) => (x.attr && x.attr[k]) || x.r;
    o.goals.forEach(([gi, ai]) => { if (gi >= 0) { rows[gi].g++; rows[gi].sh++; rows[gi].ot++; } if (ai >= 0) { rows[ai].a++; rows[ai].kp++; } });
    const gf = o.goals.length;
    const shW = X.map(x => x.line === 'GK' ? 0 : Math.sqrt(POS_GOAL(x.slot)) * att(x, 'sho') / 80 + 0.25);
    const extra = [];
    for (let n = Math.max(0, o.shots - gf); n > 0; n--) { const k = X.indexOf(pick(X, shW)); rows[k].sh++; extra.push(k); }
    for (let n = Math.max(0, o.ot - gf); n > 0 && extra.length; n--) { const j = Math.floor(rnd() * extra.length); rows[extra[j]].ot++; extra.splice(j, 1); }
    const kpW = X.map(x => POS_AST(x.slot) * Math.pow(att(x, 'pas') / 80, 2));
    for (let n = Math.max(0, Math.round(o.shots * 0.7) - rows.reduce((a, r) => a + r.kp, 0)); n > 0; n--) rows[X.indexOf(pick(X, kpW))].kp++;
    const tkW = X.map(x => (x.line === 'GK' ? 0.02 : x.line === 'DF' ? 2.8 : /DM/.test(x.slot) ? 3.4 : x.line === 'MF' ? 1.8 : 0.6) * Math.pow(att(x, 'def') / 75, 2));
    const tk = Math.max(6, Math.round(15 + gauss() * 3.5 + (o.press ? 3 : 0) + (50 - o.poss) * 0.12));
    for (let n = 0; n < tk; n++) rows[X.indexOf(pick(X, tkW))].tk++;
    const inW = X.map(x => (x.line === 'GK' ? 0.01 : /CB/.test(x.slot) ? 3.2 : x.line === 'DF' ? 2.2 : /DM/.test(x.slot) ? 3 : x.line === 'MF' ? 1.2 : 0.3) * Math.pow(att(x, 'def') / 75, 2));
    const it = Math.max(3, Math.round(9 + gauss() * 2.5 + (50 - o.poss) * 0.1));
    for (let n = 0; n < it; n++) rows[X.indexOf(pick(X, inW))].int++;
    const gk = rows.find(r => r.line === 'GK'); if (gk) gk.sv = Math.max(0, o.oppOt - o.ga);
    o.cards.forEach(([ci, red, m]) => { if (ci < 0) return; if (red) { rows[ci].rc++; rows[ci].min = Math.min(rows[ci].min, Math.max(1, Math.floor(m))); } else rows[ci].yc++; });
    rows.forEach(r => r.r = matchRating(r, o));
    return rows;
  }

  function simulate(home, away, opt = {}) {
    const e = expected(home, away, opt);
    const fh = Math.max(0.6, 1 + gauss() * 0.13), fa = Math.max(0.6, 1 + gauss() * 0.13);
    let hg = poisson(e.lh * fh), ag = poisson(e.la * fa);
    const events = [];
    const minute = () => { const m = 1 + Math.floor(rnd() * 90); return m; };
    const addGoals = (team, n, side) => {
      for (let i = 0; i < n; i++) {
        const sc = goalScorer(team), as = assister(team, sc);
        let m = minute(); if (m === 45 && rnd() < 0.4) m = 45.1; if (m === 90 && rnd() < 0.6) m = 90 + 1 + Math.floor(rnd() * 5);
        events.push({ m, type: 'goal', side, team, player: sc.name, assist: as ? as.name : null, txt: GOAL_TXT[Math.floor(rnd() * GOAL_TXT.length)](sc.name, as && as.name) });
      }
    };
    addGoals(home, hg, 'h'); addGoals(away, ag, 'a');
    // 牌
    [[home, 'h'], [away, 'a']].forEach(([t, side]) => {
      const st = TEAMS_DATA[t].style || '';
      const yc = poisson(1.6 + (/逼抢|压制|对抗|绞杀/.test(st) ? 0.6 : 0));
      const used = {};
      for (let i = 0; i < yc; i++) {
        const p = carder(t); const m = 5 + Math.floor(rnd() * 88);
        used[p.name] = (used[p.name] || 0) + 1;
        if (used[p.name] === 2) events.push({ m, type: 'red', side, team: t, player: p.name, txt: `${p.name} 两黄变一红，被罚下场` });
        else if (used[p.name] < 2) events.push({ m, type: 'yellow', side, team: t, player: p.name, txt: `${p.name} 战术犯规，吃到黄牌` });
      }
      if (rnd() < 0.035) { const p = carder(t); events.push({ m: 10 + Math.floor(rnd() * 80), type: 'red', side, team: t, player: p.name, txt: `${p.name} 背后铲抢，直接红牌！` }); }
    });
    // 机会
    const chances = 2 + Math.floor(rnd() * 4);
    for (let i = 0; i < chances; i++) {
      const side = rnd() < e.lh / (e.lh + e.la) ? 'h' : 'a'; const t = side === 'h' ? home : away;
      const s = goalScorer(t);
      events.push({ m: minute(), type: 'chance', side, team: t, player: s.name, txt: CHANCE_TXT[Math.floor(rnd() * CHANCE_TXT.length)](s.name) });
    }
    events.sort((a, b) => a.m - b.m);
    // 统计
    const share = e.H.ctl * (opt.neutral ? 1 : 1.03) / (e.H.ctl + e.A.ctl);
    let poss = Math.round(50 + (share - 0.5) * 420 + gauss() * 4);
    const styleAdj = s => /控球/.test(s) ? 4 : /摆大巴|反击|防守/.test(s) ? -4 : 0;
    poss += styleAdj(TEAMS_DATA[home].style) - styleAdj(TEAMS_DATA[away].style);
    poss = Math.max(28, Math.min(72, poss));
    const shots = (lam, g) => Math.max(g + 1, Math.round(lam * 4.2 + gauss() * 2.5 + 6));
    const hs = shots(e.lh, hg), as = shots(e.la, ag);
    const ot = (s, g) => Math.max(g, Math.min(s, Math.round(s * (0.36 + rnd() * 0.14))));
    const stats = {
      poss: [poss, 100 - poss], shots: [hs, as], onTarget: [ot(hs, hg), ot(as, ag)],
      corners: [Math.round(hs * 0.38 + rnd() * 3), Math.round(as * 0.38 + rnd() * 3)],
      xg: [+(e.lh * fh * 0.92).toFixed(2), +(e.la * fa * 0.92).toFixed(2)],
    };
    // ---------- 球员个人数据 ----------
    const players = {};
    [[home, 'h', 0, 1], [away, 'a', 1, 0]].forEach(([t, side, i, o]) => {
      const xi = lineup(t).xi;
      const idx = n => xi.findIndex(s => s.name === n);
      const rows = sideStats(xi.map(s => ({ slot: s.slot, line: s.line, r: s.rating, attr: s.p.attributes })), {
        goals: events.filter(ev => ev.type === 'goal' && ev.side === side).map(ev => [idx(ev.player), ev.assist ? idx(ev.assist) : -1]),
        cards: events.filter(ev => (ev.type === 'yellow' || ev.type === 'red') && ev.side === side).map(ev => [idx(ev.player), ev.type === 'red' ? 1 : 0, ev.m]),
        shots: stats.shots[i], ot: stats.onTarget[i], oppOt: stats.onTarget[o], gf: side === 'h' ? hg : ag, ga: side === 'h' ? ag : hg, poss: stats.poss[i],
        press: /防守|逼抢|压制|摆大巴|对抗/.test(TEAMS_DATA[t].style || ''),
      });
      players[side] = rows.map((r, k) => ({ ...r, name: xi[k].name }));
    });
    stats.tackles = [players.h.reduce((a, r) => a + r.tk, 0), players.a.reduce((a, r) => a + r.tk, 0)];
    stats.saves = [players.h.reduce((a, r) => a + r.sv, 0), players.a.reduce((a, r) => a + r.sv, 0)];
    stats.interceptions = [players.h.reduce((a, r) => a + r.int, 0), players.a.reduce((a, r) => a + r.int, 0)];
    stats.keyPasses = [players.h.reduce((a, r) => a + r.kp, 0), players.a.reduce((a, r) => a + r.kp, 0)];
    const all = [...players.h.map(r => ({ ...r, team: home })), ...players.a.map(r => ({ ...r, team: away }))];
    const motm = all.sort((a, b) => b.r - a.r)[0];
    return { home, away, hg, ag, events, stats, players, motm: { team: motm.team, name: motm.name, r: motm.r }, cond: { h: e.ch, a: e.ca }, opt: { weather: opt.weather, slot: opt.slot } };
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

  return { roleOf, ROLE_ZH, matchRating, sideStats, lineup, strength, condition, expected, probabilities, simulate, quickScore, fixtures, randomConditions, WEATHERS, SLOTS, LINE, clean };
})();
if (typeof module !== 'undefined') module.exports = ENGINE;
