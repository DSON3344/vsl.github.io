// S18 阵容调整：皮尔萨 S18 从猛龙转会到森利西亚虎
(function () {
  const T = window.TEAMS_DATA;
  const set = (team, pos, name, rating) => { const r = T[team].roster.find(x => x.pos === pos); r.name = name; r.rating = rating; };
  set('猛龙', 'LDM', '莫雷诺', 90);
  set('森利西亚虎', 'RCM', '皮尔萨', 91);
})();
// 德川信治属于沃特梅兹；森利西亚虎的 LCM 改由卡斯蒂略首发
(function () {
  const r = window.TEAMS_DATA['森利西亚虎'].roster.find(x => x.pos === 'LCM');
  r.name = '卡斯蒂略'; r.rating = 88;
})();
// S18：杰米从切狐转会到龙王宫殿（顶替范德维奇首发），切狐的 LST 由基力亚尔顶上
(function () {
  const T = window.TEAMS_DATA, DB = typeof PLAYER_DATABASE !== 'undefined' ? PLAYER_DATABASE : null;
  if (DB && DB['切狐']) { const i = DB['切狐'].findIndex(p => p.name === '杰米'); if (i >= 0) { const p = DB['切狐'].splice(i, 1)[0]; p.team = '龙王宫殿'; p.tGP = 0; p.tG = 0; p.tA = 0; DB['龙王宫殿'].push(p); } }
  const set = (team, pos, name, rating) => { const r = T[team].roster.find(x => x.pos === pos); r.name = name; r.rating = rating; };
  set('切狐', 'LST', '基力亚尔', 87);
  set('龙王宫殿', 'RST', '杰米', 92);
})();
