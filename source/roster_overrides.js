// S18 阵容调整：皮尔萨 S18 从猛龙转会到森利西亚虎
(function () {
  const T = window.TEAMS_DATA;
  const set = (team, pos, name, rating) => { const r = T[team].roster.find(x => x.pos === pos); r.name = name; r.rating = rating; };
  set('猛龙', 'LDM', '莫雷诺', 90);
  set('森利西亚虎', 'RCM', '皮尔萨', 91);
})();
