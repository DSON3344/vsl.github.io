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
  const assign = (p, team, kind) => {
    if (!p || typeof p !== 'object') return;
    const key = String(p.uid || [kind, team || p.team || '', p.name || '', p.pos || '', p.nat || '', p.age0 ?? p.age ?? '', p.s0 ?? ''].join('|'));
    let id = registry[key];
    if (!id) {
      const base = 'PLY-' + hash(key);
      id = base;
      let n = 2;
      while (used.has(id)) id = base + '-' + n++;
      registry[key] = id;
      used.add(id);
    }
    p.identityUid = id;
    if (p.firstSeason == null && Number.isFinite(p.s0)) p.firstSeason = p.s0;
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
  assignAll();
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
