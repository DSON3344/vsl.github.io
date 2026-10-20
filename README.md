# 威伊士超联赛（VES League）联赛中心

网站：https://dson3344.github.io/vsl.github.io/

整个网站是根目录的一个 `index.html`（数据、队徽、比赛引擎都已打包在里面），GitHub Pages 直接发布。

## 功能
- 总览：S18 赛程、积分榜、射手榜、冠军争夺走势
- 积分榜：S01–S18 每季积分榜与逐轮赛果（S01–S17 可切换「还原数据 / 官网记录」）
- 数据榜：球员与球队各项榜单，可选单个赛季或历史总计
- 比赛模拟：天气 / 时段抽签、加成或减益、逐分钟直播、赛后球员评分
- 球队 / 球员 / 历史总榜

S18 的模拟进度只保存在各自浏览器里。

## 修改数据
源文件在 `source/`：
- `player_data.js`、`teams_data.js`：球员与球队资料
- `extra_players.json`：资料库以外的现役首发球员补充资料
- `roster_overrides.js`：S18 阵容调整（如转会）
- `natmap.json`：历史球员国籍
- `site_data.json`：官网 S01–S17 积分榜与榜单
- `app.html`、`engine.js`：网页与比赛引擎

改完后：
```
cd source
node build_history.js   # 重新还原 S01–S17（改了球员或历史数据才需要）
python3 build.py        # 生成根目录 index.html
```

旧版网站保存在 `backup-old-site` 分支。
