/* VES season policy foundation.
 * Legacy uid is preserved because existing saves and transfer logs reference it.
 */
(function installSeasonPolicy() {
  const registry = S.identityRegistry || (S.identityRegistry = {});
  const used = new Set(Object.values(registry));
  const hash = value => {
    let h = 2166136261;
    for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
  };
  const identitySource = typeof PLAYER_IDENTITY_INDEX !== 'undefined' ? PLAYER_IDENTITY_INDEX : (window.__PLAYER_IDENTITY_INDEX__ || {});
  const identityByLegacyUid = Object.fromEntries(((identitySource && identitySource.players) || []).map(p => [p.uid, p]));
  const assign = (p, team, kind) => {
    if (!p || typeof p !== 'object') return;
    let pid = p.uid != null ? UIDPID[p.uid] : null;
    if (pid == null && /^H\|\d+$/.test(String(p.uid || ''))) pid = Number(String(p.uid).slice(2));
    const identity = pid != null ? identityByLegacyUid['H|' + pid] : null;
    const key = String(identity ? identity.uid : (p.uid || [kind, team || p.team || '', p.name || '', p.pos || '', p.nat || '', p.age0 ?? p.age ?? '', p.s0 ?? ''].join('|')));
    let id = registry[key];
    if (!id) {
      const base = identity ? 'PLY-' + String(pid + 1).padStart(6, '0') : 'PLY-' + hash(key);
      id = base;
      let n = 2;
      while (used.has(id)) id = base + '-' + n++;
      registry[key] = id;
      used.add(id);
    }
    p.identityUid = id;
    if (p.firstSeason == null) {
      if (identity && identity.firstSeason != null) p.firstSeason = identity.firstSeason;
      else if (Number.isFinite(p.s0)) p.firstSeason = p.s0;
    }
  };
  const assignAll = () => {
    Object.entries(PDB || {}).forEach(([t, list]) => (list || []).forEach(p => assign(p, t, 'player')));
    Object.entries(FDB || {}).forEach(([t, list]) => (list || []).forEach(p => assign(p, t, 'external')));
    Object.entries(ACAD || {}).forEach(([t, list]) => (list || []).forEach(p => assign(p, t, 'academy')));
  };
  const rosterStatus = team => {
    const count = (PDB[team] || []).length;
    return { team, count, max: 32, min: 28, over: count > 32, short: count < 28, canBuy: count <= 32 };
  };
  const academyEligible = (kid, season = SEASON) => {
    const age = season - kid.born;
    return kid.status === 'academy' && (age >= 18 || (age >= 16 && Number(kid.pot) >= 90));
  };
  const rosterPanel = team => {
    const st = rosterStatus(team);
    const kids = (ACAD[team] || []).filter(k => k.status === 'academy');
    const color = st.over ? '#e66' : st.short ? 'var(--gold)' : 'var(--line)';
    const msg = st.over ? '超出 32 人上限：必须先处理冗员，买人交易应中止。' :
      st.short ? '一线队少于 28 人：应优先提拔符合年龄/天赋规则的青训球员。' : '一线队人数正常。';
    const rows = kids.map(k => {
      const age = SEASON - k.born;
      const eligible = academyEligible(k);
      return '<tr><td class="l">' + esc(k.name) + '</td><td>' + esc(k.pos || k.line || '—') + '</td><td>' + age +
        '</td><td>' + (Number(k.pot) || '—') + '</td><td>' + (eligible ? '<span class="chip good">可提拔</span>' : '<span class="muted">青训梯队</span>') +
        '</td><td class="mono">' + esc(k.id || k.identityUid || '—') + '</td></tr>';
    }).join('');
    return '<div class="panel" style="border-color:' + color + '"><div class="ph"><div><div class="eyebrow">Squad policy · ' +
      SN(SEASON) + '</div><h2>一线队与青训名单</h2></div><span class="chip ' + (st.over ? 'bad' : st.short ? 'gold' : 'good') +
      '">' + st.count + '/32</span></div><p class="note" style="margin:0 0 10px;' + (st.over ? 'color:#e66;font-weight:800' : '') +
      '">' + msg + '</p><div class="tw"><table><thead><tr><th class="l">青训球员</th><th>位置</th><th>年龄</th><th>潜力</th><th>状态</th><th>青训 ID</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6" class="muted">暂无青训梯队球员记录</td></tr>') +
      '</tbody></table></div><p class="note" style="margin:8px 0 0">常规提拔年龄为 18 岁；16–17 岁仅在潜力达到 90 以上时符合天才球员例外。此版本先加入 UID 与名单诊断；自动提拔和所有交易入口的硬性阻断仍需后续接入结算流程。</p></div>';
  };

  const promoteEligibleAcademy = () => {
    if (!S) return;
    S.academyPromotions = S.academyPromotions || {};
    const records = S.academyPromotions;
    const makePlayer = (team, kid, season) => {
      const age = season - kid.born, rating = kidRating(kid, season);
      return { no: 30, team, pos:kid.pos, nat:kid.nat, name:kid.name, rating, height:kid.height, weight:kid.weight,
        age, cGP:0,cG:0,cA:0,tGP:0,tG:0,tA:0,value:'ⰵ'+valueM(rating,age)+'M',attributes:kidAttrs(kid,season),
        youth:1,acad:kid.id,potFix:kid.pot,rating0:rating,age0:age,s0:season,uid:'Y|'+team+'|'+kid.id,cEnd:season+3 };
    };
    Object.entries(records).forEach(([team, list]) => (list || []).forEach(saved => {
      if (!TD[team] || (PDB[team] || []).some(p => p.uid === saved.uid)) return;
      const p = { ...saved, age: saved.age0 + Math.max(0, SEASON - saved.s0) };
      try { p.rating = growthOf(p).at(p.age); p.value = 'ⰵ'+valueM(p.rating,p.age)+'M'; } catch {}
      PDB[team] = PDB[team] || []; PDB[team].push(p);
    }));
    Object.keys(TD).forEach(team => {
      PDB[team] = PDB[team] || [];
      let guard = 0;
      while (PDB[team].length < 28 && guard++ < 8) {
        const candidates = (ACAD[team] || []).filter(k => k.status === 'academy' &&
          (SEASON - k.born >= 18 || (SEASON - k.born >= 16 && SEASON - k.born < 18 && Number(k.pot) >= 90)) &&
          !(records[team] || []).some(p => p.acad === k.id));
        candidates.sort((a,b) => kidRating(b,SEASON)-kidRating(a,SEASON) || b.pot-a.pot);
        let kid = candidates[0];
        if (!kid) break;
        kid.status = 'first'; kid.promoted = SEASON;
        const p = makePlayer(team,kid,SEASON);
        (records[team] = records[team] || []).push(p);
        PDB[team].push(p);
      }
      PDB[team].forEach(p => { p.team = team; if (p.uid) { BY_TN[team+'|'+p.name]=p; TEAM_OF_UID[p.uid]=team; } });
    });
    if (typeof buildAllPlayers === 'function') buildAllPlayers();
  };
  const oldApplyGrowth = applyGrowth;
  applyGrowth = function() { oldApplyGrowth(); promoteEligibleAcademy(); assignAll(); };
  promoteEligibleAcademy();
  assignAll();
  // Enforce the 32-player cap at the point a user accepts an incoming transfer offer.
  // The existing next-season check remains as a second safety net.
  const oldMktAct = mktAct;
  mktAct = function(kind, id) {
    if (kind === 'accept') {
      const market = mktGet();
      const offer = (market.offers || []).find(o => o.id === id);
      if (offer && TD[offer.to] && projSize(offer.to) >= 32) {
        toast(offer.to + ' 一线队已达 32 人上限，必须先处理冗员；本次交易已中止。');
        return;
      }
    }
    return oldMktAct(kind, id);
  };
  const oldTeamDetail = teamDetail;
  teamDetail = function(team) {
    return oldTeamDetail(team).replace('</section>', rosterPanel(team) + '</section>');
  };
  const oldVTeams = vTeams;
  vTeams = function() {
    const html = oldVTeams();
    if (teamSel) return html;
    const rows = S.teams.map(t => {
      const st = rosterStatus(t);
      return '<tr><td class="l">' + esc(t) + '</td><td>' + st.count + '/32</td><td>' +
        (st.over ? '<span class="chip bad">超员 · 禁止买人</span>' : st.short ? '<span class="chip gold">少于 28 人</span>' : '<span class="chip good">正常</span>') +
        '</td></tr>';
    }).join('');
    return html.replace('</section>', '<div class="panel"><div class="ph"><div><div class="eyebrow">Squad compliance</div><h2>一线队人数检查</h2></div><span class="note">最多 32 人 · 少于 28 人触发青训补员规则</span></div><div class="tw"><table><thead><tr><th class="l">球队</th><th>一线队人数</th><th>名单状态</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></section>');
  };
  const oldOpenPlayer = openPlayer;
  openPlayer = function(team, name) {
    const result = oldOpenPlayer(team, name);
    const p = (PDB[team] || []).find(x => x.name === name) || (FDB[team] || []).find(x => x.name === name);
    if (p && p.identityUid) {
      const card = document.querySelector('#dlg .pcard');
      if (card && !card.querySelector('[data-identity-uid]')) {
        const badge = document.createElement('span');
        badge.className = 'chip mono';
        badge.dataset.identityUid = '1';
        badge.textContent = 'UID ' + p.identityUid;
        card.appendChild(badge);
      }
    }
    return result;
  };

  // Deterministic per-season finance model. Monetary units follow the existing game economy
  // (100 units = 1 hundred million in the UI formatter).
  const financeLedger = (team, season) => {
    const archived = (S.archive || []).find(a => a.s === season);
    const rank = archived ? (archived.table.findIndex(r => r.team === team) + 1) : (season === SEASON ? (table().findIndex(r => r.team === team) + 1) : 10);
    const ratings = archived && archived.sq && archived.sq[team]
      ? archived.sq[team].map(p => p[5]).filter(Number.isFinite)
      : (PDB[team] || []).map(p => p.rating).filter(Number.isFinite);
    const avg = ratings.length ? ratings.reduce((a,b)=>a+b,0)/ratings.length : 75;
    const crowd = Math.max(18, Math.round(22 + avg * 0.55 + (21 - rank) * 1.8));
    const merch = Math.round(18 + avg * 0.9 + (21-rank)*1.1);
    const sponsor = Math.round(45 + avg * 1.35 + (rank <= 4 ? 24 : rank <= 10 ? 10 : 0));
    const ads = Math.round(18 + avg * 0.55 + crowd * 0.22);
    const stadium = Math.round(crowd * (season <= SEASON ? 0.9 : 0.7));
    const prizeData = prizeOf(season);
    const prize = prizeData && prizeData[team] ? prizeData[team].total : 0;
    const market = S.market && S.market[season] || {};
    const completed = (market.offers || []).filter(x => x.st === 'a' && !x.sched && x.fee);
    const sold = completed.filter(x => x.from === team).reduce((a,x)=>a+x.fee,0);
    const bought = completed.filter(x => x.to === team).reduce((a,x)=>a+x.fee,0);
    const inv = Math.round(Math.max(0, avg - 82) * 1.5 + (rank <= 5 ? 12 : 0));
    const wage = season === SEASON ? (wagesOf(season)[team] || 0) : archived ? (wagesOf(season)[team] || 0) : 0;
    const income = { '卖人收入': sold, '周边商品营收': merch, '投资方赞助': inv, '广告营收': ads, '球场营收': stadium, '比赛奖金': prize, '商业赞助': sponsor };
    const expense = { '周边商品生产': Math.round(merch * 0.38), '税务': Math.round((sponsor+ads+stadium+merch+prize) * 0.12), '球场维护': Math.round(12 + crowd * 0.18), '买人支出': bought, '球员工资': wage };
    return { team, season, rank, income, expense, totalIncome:Object.values(income).reduce((a,b)=>a+b,0), totalExpense:Object.values(expense).reduce((a,b)=>a+b,0) };
  };
  const financeBars = (ledger, title) => {
    if (!ledger.length) return '';
    const max = Math.max(1, ...ledger.flatMap(x => [x.totalIncome,x.totalExpense]));
    return '<div class="panel"><div class="ph"><div><div class="eyebrow">Season finance</div><h2>'+title+'</h2></div><span class="note">不含威联赛时期 · 单位沿用俱乐部财务</span></div>' +
      ledger.slice().reverse().map(x => '<div style="display:grid;grid-template-columns:54px minmax(0,1fr) 82px;gap:8px;align-items:center;margin:10px 0"><span class="mono">'+SN(x.season)+'</span><div style="display:grid;gap:4px"><div style="height:8px;background:var(--line);border-radius:2px;overflow:hidden"><i title="收入 '+money(x.totalIncome)+'" style="display:block;height:100%;width:'+Math.min(100,x.totalIncome/max*100)+'%;background:var(--win)"></i></div><div style="height:8px;background:var(--line);border-radius:2px;overflow:hidden"><i title="支出 '+money(x.totalExpense)+'" style="display:block;height:100%;width:'+Math.min(100,x.totalExpense/max*100)+'%;background:var(--loss)"></i></div></div><span class="mono" style="font-size:11px;text-align:right">'+(x.totalIncome-x.totalExpense>=0?'+':'')+money(x.totalIncome-x.totalExpense)+'</span></div>' +
      '<details style="margin-top:8px"><summary class="note" style="cursor:pointer">'+SN(x.season)+' 收入 '+money(x.totalIncome)+' · 支出 '+money(x.totalExpense)+'</summary><div class="grid g-2" style="margin-top:8px"><div><b>收入明细</b>'+Object.entries(x.income).map(([k,v])=>'<div class="rk" style="grid-template-columns:minmax(0,1fr) auto"><span>'+k+'</span><span class="v">'+money(v)+'</span></div>').join('')+'</div><div><b>支出明细</b>'+Object.entries(x.expense).map(([k,v])=>'<div class="rk" style="grid-template-columns:minmax(0,1fr) auto"><span>'+k+'</span><span class="v">'+money(v)+'</span></div>').join('')+'</div></div></details>').join('')+'</div>';
  };
  const oldTeamFinPanel = teamFinPanel;
  teamFinPanel = function(team) {
    const base = oldTeamFinPanel(team);
    const ledger = Array.from({length:Math.max(1,SEASON)},(_,i)=>financeLedger(team,i+1));
    return base + financeBars(ledger, esc(team)+' · 每季收入与支出');
  };
  const transferSummary = () => {
    const seasons = Array.from({length:Math.max(1,SEASON)},(_,i)=>i+1).reverse();
    const oneSeason = season => {
      const market = S.market && S.market[season] || {};
      const completed = (market.offers || []).filter(o => o.st === 'a' && !o.sched);
      const rows = Object.keys(TD).map(team => {
        const incoming = completed.filter(o=>o.to===team), outgoing=completed.filter(o=>o.from===team);
        const bought = incoming.reduce((a,x)=>a+(x.fee||0),0), sold=outgoing.reduce((a,x)=>a+(x.fee||0),0);
        return {team,incoming,outgoing,bought,sold};
      });
      return '<details '+(season===SEASON?'open':'')+' style="margin-top:10px"><summary style="cursor:pointer"><b>'+SN(season)+'</b> <span class="note">买入 '+completed.filter(o=>TD[o.to]).length+' 人 · 卖出 '+completed.filter(o=>TD[o.from]).length+' 人</span></summary><div class="tw" style="margin-top:8px"><table><thead><tr><th class="l">球队</th><th>买入人数</th><th class="l">买入球员</th><th>卖出人数</th><th class="l">卖出球员</th><th>总支出</th><th>总收益</th></tr></thead><tbody>'+
        rows.map(x=>'<tr><td class="l">'+esc(x.team)+'</td><td>'+x.incoming.length+'</td><td class="l">'+(x.incoming.length?x.incoming.map(o=>esc(o.name)).join('、'):'–')+'</td><td>'+x.outgoing.length+'</td><td class="l">'+(x.outgoing.length?x.outgoing.map(o=>esc(o.name)).join('、'):'–')+'</td><td>'+money(x.bought)+'</td><td>'+money(x.sold)+'</td></tr>').join('')+'</tbody></table></div></details>';
    };
    return '<div class="panel"><div class="ph"><div><div class="eyebrow">Transfer ledger</div><h2>各赛季各队转会汇总</h2></div><span class="note">只计入新模拟期实际成交；旧历史预设交易不计入</span></div>'+seasons.map(oneSeason).join('')+'</div>';
  };
  const oldMarketPanel = marketPanel;
  marketPanel = function() { return oldMarketPanel() + transferSummary(); };
  window.__VES_SEASON_POLICY__ = {
    version: 1,
    rosterStatus,
    academyEligible,
    assignAll,
    identityMap: () => Object.entries(registry).map(([source, identityUid]) => ({ source, identityUid })),
    duplicateIdentityUids: () => {
      const seen = new Set(), dup = new Set();
      Object.values(PDB || {}).flat().forEach(p => {
        if (!p.identityUid) return;
        if (seen.has(p.identityUid)) dup.add(p.identityUid);
        seen.add(p.identityUid);
      });
      return [...dup];
    }
  };
})();
