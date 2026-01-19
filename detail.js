/* ===================================================
   VES League 2026 赛季 - 27队集成核心逻辑 (终极版)
   包含：动态数据转换、国籍/体重支持、鲁棒排序、雷达图分析
   =================================================== */

// --- 1. 原始数据库 (直接嵌入你提供的 27 支球队数据) ---
window.TEAMS_DATA = {
    "阿尔法骑士": {
        color: "#000000",
        style: "快速反击",
        stadium: "奥德赛足球场",
        coach: { name: "特罗萨姆", gp: 524, w: 229, d: 95, l: 200, rate: "43.70%" },
        status: { best: "阴天 · 晚上", worst: "晴天 · 早上", injury: "0", tactic: "快速反击" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 1, seasons: "S-97赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 3, seasons: "S-90赛季、S-95赛季、S-99赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 1, seasons: "02赛季", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 6, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 9, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 14, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (3-5-2)",
                players: {
                    "GK": "阿利布克", "LCB": "伊纳", "CB": "范博梅尔", "RCB": "范德凯隆",
                    "LWB": "斯滕斯", "RWB": "加西亚", "LDM": "卡尔", "RDM": "卢卡斯",
                    "CAM": "伊斯塔", "LST": "安德烈", "RST": "霍尔"
                },
                coords: {
                    "GK": [5, 50], "LCB": [22, 25], "CB": [18, 50], "RCB": [22, 75],
                    "LWB": [48, 10], "RWB": [48, 90], "LDM": [42, 35], "RDM": [42, 65],
                    "CAM": [65, 50], "LST": [85, 38], "RST": [85, 62]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "奥兹兰", "LB": "史密斯", "LCB": "特尔森", "RCB": "巴雷尔", "RB": "纳乔",
                    "LDM": "马科斯", "RDM": "纳格尔斯曼", "CAM": "弗朗吉", "LW": "席尔瓦", "RW": "丘库",
                    "ST": "托雷斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "LDM": [40, 35], "RDM": [40, 65], "CAM": [65, 50], "LW": [72, 15], "RW": [72, 85], "ST": [85, 50]
                }
            }
        },
        roster: [
            { no: 4, pos: "CB", nat: "荷兰", name: "范博梅尔", rating: 91, height: 191, weight: 89, age: 31, cGP: 512, cG: 38, cA: 12, tGP: 180, tG: 12, tA: 2, value: "ⰵ85M", attributes: { spd: 75, sho: 60, pas: 82, dri: 75, def: 94, phy: 91, men: 96, sta: 84 } },
            { no: 1, pos: "GK", nat: "英国", name: "阿利布克", rating: 89, height: 189, weight: 85, age: 29, cGP: 385, cG: 0, cA: 5, tGP: 156, tG: 0, tA: 1, value: "ⰵ68M", attributes: { div: 88, han: 87, kic: 82, ref: 91, spd: 58, pos_s: 90, men: 89, sta: 84 } },
            { no: 8, pos: "CDM", nat: "德国", name: "卡尔", rating: 90, height: 184, weight: 80, age: 23, cGP: 125, cG: 18, cA: 32, tGP: 65, tG: 8, tA: 15, value: "ⰵ125M", attributes: { spd: 85, sho: 78, pas: 91, dri: 88, def: 86, phy: 84, men: 84, sta: 94 } },
            { no: 11, pos: "ST", nat: "葡萄牙", name: "安德烈", rating: 86, height: 182, weight: 77, age: 27, cGP: 280, cG: 142, cA: 35, tGP: 125, tG: 56, tA: 15, value: "ⰵ62M", attributes: { spd: 85, sho: 90, pas: 78, dri: 84, def: 38, phy: 80, men: 86, sta: 82 } },
            { no: 16, pos: "CDM", nat: "巴西", name: "卢卡斯", rating: 86, height: 183, weight: 79, age: 25, cGP: 185, cG: 15, cA: 28, tGP: 90, tG: 6, tA: 12, value: "ⰵ58M", attributes: { spd: 80, sho: 70, pas: 85, dri: 82, def: 85, phy: 86, men: 80, sta: 90 } },
            { no: 30, pos: "ST", nat: "丹麦", name: "霍尔", rating: 86, height: 184, weight: 81, age: 24, cGP: 80, cG: 45, cA: 10, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 92, sho: 88, pas: 72, dri: 85, def: 35, phy: 83, men: 82, sta: 84 } },
            { no: 31, pos: "CB", nat: "荷兰", name: "范德凯隆", rating: 85, height: 192, weight: 88, age: 26, cGP: 120, cG: 5, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 78, sho: 45, pas: 75, dri: 70, def: 87, phy: 89, men: 82, sta: 84 } },
            { no: 2, pos: "RWB", nat: "西班牙", name: "加西亚", rating: 85, height: 179, weight: 72, age: 25, cGP: 195, cG: 15, cA: 52, tGP: 115, tG: 8, tA: 24, value: "ⰵ50M", attributes: { spd: 90, sho: 68, pas: 83, dri: 85, def: 78, phy: 75, men: 80, sta: 92 } },
            { no: 32, pos: "CB", nat: "葡萄牙", name: "伊纳", rating: 84, height: 186, weight: 82, age: 25, cGP: 105, cG: 3, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { spd: 75, sho: 50, pas: 85, dri: 76, def: 86, phy: 82, men: 83, sta: 81 } },
            { no: 10, pos: "CAM", nat: "西班牙", name: "伊斯塔", rating: 83, height: 177, weight: 70, age: 27, cGP: 245, cG: 45, cA: 95, tGP: 135, tG: 18, tA: 42, value: "ⰵ42M", attributes: { spd: 82, sho: 80, pas: 88, dri: 87, def: 55, phy: 72, men: 86, sta: 80 } },
            { no: 33, pos: "CDM", nat: "西班牙", name: "马科斯", rating: 84, height: 184, weight: 79, age: 24, cGP: 95, cG: 8, cA: 12, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 78, sho: 72, pas: 86, dri: 81, def: 83, phy: 80, men: 82, sta: 89 } },
            { no: 20, pos: "CDM", nat: "德国", name: "纳格尔斯曼", rating: 81, height: 181, weight: 78, age: 31, cGP: 480, cG: 32, cA: 65, tGP: 110, tG: 6, tA: 18, value: "ⰵ18M", attributes: { spd: 72, sho: 72, pas: 84, dri: 77, def: 82, phy: 82, men: 91, sta: 76 } },
            { no: 5, pos: "CB", nat: "瑞典", name: "特尔森", rating: 83, height: 189, weight: 86, age: 26, cGP: 165, cG: 8, cA: 3, tGP: 85, tG: 4, tA: 1, value: "ⰵ28M", attributes: { spd: 76, sho: 45, pas: 68, dri: 65, def: 86, phy: 88, men: 80, sta: 82 } },
            { no: 3, pos: "LWB", nat: "荷兰", name: "斯滕斯", rating: 82, height: 178, weight: 71, age: 25, cGP: 155, cG: 12, cA: 42, tGP: 88, tG: 4, tA: 21, value: "ⰵ25M", attributes: { spd: 88, sho: 65, pas: 81, dri: 82, def: 76, phy: 72, men: 78, sta: 89 } },
            { no: 34, pos: "RWB", nat: "尼日利亚", name: "丘库", rating: 83, height: 176, weight: 70, age: 27, cGP: 210, cG: 32, cA: 45, tGP: 0, tG: 0, tA: 0, value: "ⰵ25M", attributes: { spd: 90, sho: 78, pas: 75, dri: 88, def: 50, phy: 70, men: 78, sta: 82 } },
            { no: 21, pos: "CB", nat: "美国", name: "克里斯", rating: 80, height: 186, weight: 83, age: 35, cGP: 580, cG: 22, cA: 5, tGP: 95, tG: 3, tA: 0, value: "ⰵ5M", attributes: { spd: 62, sho: 55, pas: 70, dri: 62, def: 86, phy: 82, men: 93, sta: 68 } },
            { no: 18, pos: "CM", nat: "葡萄牙", name: "席尔瓦", rating: 82, height: 178, weight: 73, age: 26, cGP: 190, cG: 22, cA: 48, tGP: 55, tG: 4, tA: 12, value: "ⰵ24M", attributes: { spd: 82, sho: 75, pas: 82, dri: 83, def: 72, phy: 74, men: 80, sta: 85 } },
            { no: 19, pos: "ST", nat: "西班牙", name: "托雷斯", rating: 82, height: 184, weight: 79, age: 26, cGP: 185, cG: 85, cA: 22, tGP: 50, tG: 18, tA: 4, value: "ⰵ26M", attributes: { spd: 84, sho: 86, pas: 70, dri: 80, def: 35, phy: 82, men: 78, sta: 80 } },
            { no: 12, pos: "GK", nat: "土耳其", name: "奥兹兰", rating: 82, height: 188, weight: 84, age: 22, cGP: 95, cG: 0, cA: 0, tGP: 85, tG: 0, tA: 0, value: "ⰵ20M", attributes: { div: 82, han: 79, kic: 76, ref: 85, spd: 60, pos_s: 81, men: 77, sta: 80 } },
            { no: 23, pos: "GK", nat: "比利时", name: "卡斯特", rating: 80, height: 190, weight: 86, age: 25, cGP: 110, cG: 0, cA: 0, tGP: 40, tG: 0, tA: 0, value: "ⰵ12M", attributes: { div: 82, han: 80, kic: 72, ref: 81, spd: 55, pos_s: 82, men: 78, sta: 78 } },
            { no: 15, pos: "CB", nat: "英格兰", name: "巴雷尔", rating: 81, height: 186, weight: 84, age: 24, cGP: 125, cG: 6, cA: 2, tGP: 110, tG: 4, tA: 1, value: "ⰵ14M", attributes: { spd: 74, sho: 40, pas: 65, dri: 62, def: 84, phy: 85, men: 78, sta: 82 } },
            { no: 25, pos: "CB", nat: "日本", name: "工藤健次", rating: 81, height: 185, weight: 79, age: 25, cGP: 140, cG: 5, cA: 1, tGP: 80, tG: 3, tA: 0, value: "ⰵ13M", attributes: { spd: 75, sho: 42, pas: 68, dri: 65, def: 83, phy: 83, men: 84, sta: 81 } },
            { no: 14, pos: "CAM", nat: "意大利", name: "弗朗吉", rating: 82, height: 175, weight: 69, age: 24, cGP: 135, cG: 22, cA: 45, tGP: 48, tG: 6, tA: 14, value: "ⰵ22M", attributes: { spd: 84, sho: 76, pas: 83, dri: 86, def: 45, phy: 68, men: 76, sta: 82 } },
            { no: 22, pos: "RWB", nat: "西班牙", name: "纳乔", rating: 80, height: 177, weight: 71, age: 25, cGP: 145, cG: 8, cA: 38, tGP: 42, tG: 1, tA: 11, value: "ⰵ11M", attributes: { spd: 86, sho: 62, pas: 78, dri: 79, def: 74, phy: 70, men: 75, sta: 85 } },
            { no: 26, pos: "ST", nat: "英格兰", name: "莱尔斯", rating: 80, height: 181, weight: 76, age: 24, cGP: 120, cG: 52, cA: 15, tGP: 45, tG: 12, tA: 2, value: "ⰵ12M", attributes: { spd: 82, sho: 84, pas: 65, dri: 78, def: 32, phy: 78, men: 74, sta: 80 } },
            { no: 24, pos: "LB", nat: "美国", name: "史密斯", rating: 79, height: 176, weight: 70, age: 25, cGP: 160, cG: 5, cA: 42, tGP: 130, tG: 2, tA: 28, value: "ⰵ7M", attributes: { spd: 84, sho: 58, pas: 76, dri: 75, def: 76, phy: 71, men: 74, sta: 82 } }
        ]
    },

    "猎豹": {
        color: "#fbbf24",
        style: "极致压制",
        stadium: "歌德尼特足球场",
        coach: { name: "梅东斯", gp: 284, w: 183, d: 32, l: 69, rate: "64.44%" },
        status: { best: "晴天 · 晚上", worst: "雨天 · 下午", injury: "0", tactic: "强力压制" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 2, seasons: "S-92赛季、15赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 3, seasons: "S-87赛季、S-91赛季、06赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 2, seasons: "13赛季、14赛季", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 1, seasons: "15赛季", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 8, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 6, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 14, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-2-4)",
                players: {
                    "GK": "亨德森", "LB": "戴维斯", "LCB": "佩德斯", "RCB": "丹尼尔", "RB": "帕奎奥",
                    "LDM": "凯恩斯", "RDM": "拉希姆", "LW": "拉凯德", "RW": "亚玛",
                    "LST": "司炎尚武", "RST": "米林特维奇"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LDM": [45, 38], "RDM": [45, 62], "LW": [75, 15], "RW": [75, 85],
                    "LST": [88, 38], "RST": [88, 62]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "与塔诺", "LB": "安德森", "LCB": "克莱尔", "RCB": "阿拉比亚", "RB": "雷谷龙",
                    "LDM": "郑宇辰", "RDM": "林腾", "CAM": "图雷", "LW": "夸雷斯曼", "ST": "桑托斯", "RW": "维罗尼克"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "LDM": [40, 35], "RDM": [40, 65], "CAM": [65, 50], "LW": [72, 15], "ST": [88, 50], "RW": [72, 85]
                }
            }
        },
        roster: [
            { no: 37, pos: "RW", nat: "西班牙", name: "亚玛", rating: 92, height: 180, weight: 72, age: 20, cGP: 85, cG: 32, cA: 28, tGP: 0, tG: 0, tA: 0, value: "ⰵ185M", attributes: { spd: 97, sho: 86, pas: 89, dri: 96, def: 45, phy: 72, men: 84, sta: 89 } },
            { no: 9, pos: "ST", nat: "中国", name: "司炎尚武", rating: 91, height: 186, weight: 82, age: 28, cGP: 315, cG: 185, cA: 42, tGP: 105, tG: 82, tA: 18, value: "ⰵ145M", attributes: { spd: 92, sho: 96, pas: 78, dri: 90, def: 35, phy: 88, men: 92, sta: 85 } },
            { no: 7, pos: "LM", nat: "阿根廷", name: "拉凯德", rating: 91, height: 176, weight: 71, age: 29, cGP: 340, cG: 92, cA: 155, tGP: 120, tG: 48, tA: 59, value: "ⰵ120M", attributes: { spd: 94, sho: 86, pas: 92, dri: 94, def: 42, phy: 74, men: 90, sta: 90 } },
            { no: 8, pos: "CM", nat: "英格兰", name: "凯恩斯", rating: 92, height: 183, weight: 79, age: 28, cGP: 325, cG: 48, cA: 112, tGP: 160, tG: 24, tA: 62, value: "ⰵ130M", attributes: { spd: 80, sho: 84, pas: 96, dri: 91, def: 78, phy: 82, men: 97, sta: 94 } },
            { no: 4, pos: "CB", nat: "葡萄牙", name: "佩德斯", rating: 91, height: 190, weight: 86, age: 29, cGP: 340, cG: 35, cA: 12, tGP: 180, tG: 12, tA: 3, value: "ⰵ92M", attributes: { spd: 77, sho: 55, pas: 80, dri: 74, def: 95, phy: 92, men: 98, sta: 84 } },
            { no: 3, pos: "LB", nat: "加拿大", name: "戴维斯", rating: 90, height: 181, weight: 75, age: 30, cGP: 365, cG: 22, cA: 85, tGP: 135, tG: 12, tA: 39, value: "ⰵ80M", attributes: { spd: 95, sho: 68, pas: 85, dri: 88, def: 84, phy: 82, men: 86, sta: 94 } },
            { no: 11, pos: "ST", nat: "克罗地亚", name: "米林特维奇", rating: 90, height: 185, weight: 80, age: 27, cGP: 220, cG: 145, cA: 28, tGP: 154, tG: 112, tA: 15, value: "ⰵ115M", attributes: { spd: 84, sho: 93, pas: 78, dri: 85, def: 38, phy: 90, men: 95, sta: 82 } },
            { no: 17, pos: "RM", nat: "法国", name: "维罗尼克", rating: 90, height: 178, weight: 74, age: 26, cGP: 215, cG: 42, cA: 78, tGP: 112, tG: 21, tA: 39, value: "ⰵ110M", attributes: { spd: 91, sho: 83, pas: 88, dri: 91, def: 48, phy: 76, men: 85, sta: 92 } },
            { no: 26, pos: "ST", nat: "巴西", name: "桑托斯", rating: 89, height: 182, weight: 78, age: 25, cGP: 195, cG: 132, cA: 28, tGP: 120, tG: 88, tA: 11, value: "ⰵ105M", attributes: { spd: 88, sho: 91, pas: 74, dri: 88, def: 32, phy: 84, men: 84, sta: 88 } },
            { no: 1, pos: "GK", nat: "英格兰", name: "亨德森", rating: 89, height: 188, weight: 85, age: 24, cGP: 115, cG: 0, cA: 2, tGP: 110, tG: 0, tA: 0, value: "ⰵ125M", attributes: { div: 89, han: 86, kic: 82, ref: 91, spd: 55, pos_s: 90, men: 93, sta: 84 } },
            { no: 16, pos: "CM", nat: "埃及", name: "拉希姆", rating: 87, height: 182, weight: 77, age: 33, cGP: 510, cG: 62, cA: 135, tGP: 90, tG: 8, tA: 21, value: "ⰵ22M", attributes: { spd: 80, sho: 78, pas: 89, dri: 85, def: 84, phy: 83, men: 84, sta: 88 } },
            { no: 2, pos: "RB", nat: "美国", name: "帕奎奥", rating: 88, height: 179, weight: 74, age: 27, cGP: 215, cG: 12, cA: 45, tGP: 108, tG: 4, tA: 21, value: "ⰵ58M", attributes: { spd: 90, sho: 65, pas: 82, dri: 84, def: 82, phy: 78, men: 85, sta: 91 } },
            { no: 15, pos: "ST", nat: "意大利", name: "格罗索", rating: 87, height: 184, weight: 82, age: 29, cGP: 335, cG: 165, cA: 38, tGP: 50, tG: 28, tA: 3, value: "ⰵ68M", attributes: { spd: 85, sho: 89, pas: 70, dri: 84, def: 38, phy: 85, men: 91, sta: 82 } },
            { no: 22, pos: "ST", nat: "加纳", name: "威廉姆斯", rating: 88, height: 181, weight: 77, age: 20, cGP: 30, cG: 12, cA: 4, tGP: 45, tG: 15, tA: 2, value: "ⰵ125M", attributes: { spd: 90, sho: 89, pas: 68, dri: 85, def: 35, phy: 80, men: 80, sta: 84 } },
            { no: 5, pos: "CB", nat: "印尼", name: "丹尼尔", rating: 87, height: 188, weight: 84, age: 27, cGP: 205, cG: 22, cA: 5, tGP: 55, tG: 3, tA: 0, value: "ⰵ48M", attributes: { spd: 74, sho: 48, pas: 72, dri: 68, def: 89, phy: 91, men: 89, sta: 81 } },
            { no: 24, pos: "RB", nat: "瑞典", name: "安德森", rating: 88, height: 180, weight: 76, age: 23, cGP: 85, cG: 4, cA: 18, tGP: 70, tG: 2, tA: 15, value: "ⰵ90M", attributes: { spd: 89, sho: 62, pas: 83, dri: 84, def: 81, phy: 80, men: 85, sta: 92 } },
            { no: 25, pos: "RB", nat: "西班牙", name: "雷谷龙", rating: 87, height: 178, weight: 71, age: 29, cGP: 325, cG: 8, cA: 52, tGP: 50, tG: 1, tA: 9, value: "ⰵ42M", attributes: { spd: 90, sho: 64, pas: 78, dri: 86, def: 78, phy: 73, men: 82, sta: 91 } },
            { no: 27, pos: "RM", nat: "牙买加", name: "格雷", rating: 89, height: 177, weight: 72, age: 21, cGP: 45, cG: 12, cA: 18, tGP: 65, tG: 10, tA: 14, value: "ⰵ150M", attributes: { spd: 91, sho: 80, pas: 85, dri: 90, def: 52, phy: 72, men: 87, sta: 90 } },
            { no: 22, pos: "CM", nat: "马来西亚", name: "郑宇辰", rating: 86, height: 179, weight: 73, age: 31, cGP: 460, cG: 55, cA: 118, tGP: 105, tG: 14, tA: 38, value: "ⰵ28M", attributes: { spd: 83, sho: 76, pas: 90, dri: 88, def: 72, phy: 73, men: 84, sta: 86 } },
            { no: 12, pos: "GK", nat: "喀麦隆", name: "与塔诺", rating: 86, height: 190, weight: 88, age: 32, cGP: 480, cG: 0, cA: 1, tGP: 45, tG: 0, tA: 0, value: "ⰵ20M", attributes: { div: 84, han: 86, kic: 80, ref: 88, spd: 60, pos_s: 85, men: 82, sta: 80 } },
            { no: 15, pos: "CB", nat: "法国", name: "克莱尔", rating: 85, height: 187, weight: 83, age: 34, cGP: 555, cG: 28, cA: 5, tGP: 82, tG: 4, tA: 1, value: "ⰵ12M", attributes: { spd: 68, sho: 42, pas: 65, dri: 62, def: 88, phy: 87, men: 84, sta: 81 } },
            { no: 21, pos: "CB", nat: "沙特阿拉伯", name: "阿拉比亚", rating: 85, height: 186, weight: 81, age: 33, cGP: 510, cG: 32, cA: 5, tGP: 45, tG: 2, tA: 0, value: "ⰵ10M", attributes: { spd: 70, sho: 45, pas: 68, dri: 65, def: 86, phy: 85, men: 85, sta: 80 } },
            { no: 18, pos: "CM", nat: "德国", name: "林腾", rating: 85, height: 176, weight: 74, age: 33, cGP: 490, cG: 55, cA: 110, tGP: 40, tG: 4, tA: 9, value: "ⰵ10M", attributes: { spd: 76, sho: 74, pas: 85, dri: 86, def: 70, phy: 70, men: 85, sta: 88 } },
            { no: 10, pos: "CAM", nat: "科特迪瓦", name: "图雷", rating: 84, height: 181, weight: 76, age: 34, cGP: 540, cG: 88, cA: 182, tGP: 48, tG: 9, tA: 16, value: "ⰵ12M", attributes: { spd: 81, sho: 80, pas: 88, dri: 87, def: 55, phy: 70, men: 88, sta: 80 } },
            { no: 28, pos: "LM", nat: "葡萄牙", name: "夸雷斯曼", rating: 84, height: 174, weight: 70, age: 32, cGP: 485, cG: 112, cA: 140, tGP: 60, tG: 15, tA: 22, value: "ⰵ14M", attributes: { spd: 86, sho: 74, pas: 80, dri: 88, def: 40, phy: 63, men: 76, sta: 80 } },
            { no: 8, pos: "CM", nat: "英格兰", name: "摩根", rating: 84, height: 177, weight: 75, age: 31, cGP: 445, cG: 38, cA: 92, tGP: 35, tG: 2, tA: 8, value: "ⰵ20M", attributes: { spd: 78, sho: 70, pas: 86, dri: 84, def: 68, phy: 74, men: 82, sta: 91 } }
        ]
    },

    "切狐": {
        color: "#1e3a8a",
        style: "双核爆破",
        stadium: "荷鲁斯足球场",
        coach: { name: "法尔考", gp: 409, w: 248, d: 51, l: 110, rate: "60.64%" },
        status: { best: "晴天 · 中午", worst: "雨天 · 傍晚", injury: "0", tactic: "双核爆破" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 1, seasons: "S-79赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 1, seasons: "11赛季", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 2, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 3, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 10, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (3-4-1-2)",
                players: {
                    "GK": "迈格", "LCB": "努诺", "CB": "德约科维奇", "RCB": "巴斯托",
                    "CDM": "克莱恩", "LM": "扎法", "RM": "贝尔", "CM": "霍伊",
                    "CAM": "佩德", "LST": "杰米", "RST": "席尔瓦"
                },
                coords: {
                    "GK": [5, 50], "LCB": [22, 25], "CB": [18, 50], "RCB": [22, 75],
                    "CDM": [40, 50], "LM": [55, 12], "RM": [55, 88], "CM": [58, 50],
                    "CAM": [72, 50], "LST": [85, 35], "RST": [85, 65]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "加扎尼斯", "LB": "罗杰", "LCB": "劳尔", "RCB": "法波", "RB": "佩尔顿",
                    "LDM": "索切克", "RDM": "菲利普", "CAM": "格林纳尔", "LW": "扎法", "ST": "基力亚尔", "RW": "肯尼"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "LDM": [40, 35], "RDM": [40, 65], "CAM": [65, 50], "LW": [72, 15], "ST": [88, 50], "RW": [72, 85]
                }
            }
        },
        roster: [
            { no: 12, pos: "GK", nat: "法国", name: "迈格", rating: 89, height: 191, weight: 80, age: 31, cGP: 410, cG: 0, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { div: 88, han: 86, kic: 82, ref: 92, spd: 55, pos_s: 90, men: 88, sta: 82 } },
            { no: 9, pos: "ST", nat: "英格兰", name: "杰米", rating: 92, height: 187, weight: 82, age: 31, cGP: 485, cG: 295, cA: 62, tGP: 120, tG: 88, tA: 15, value: "ⰵ95M", attributes: { spd: 88, sho: 96, pas: 82, dri: 92, def: 38, phy: 90, men: 98, sta: 84 } },
            { no: 11, pos: "ST", nat: "葡萄牙", name: "席尔瓦", rating: 92, height: 184, weight: 78, age: 26, cGP: 245, cG: 158, cA: 35, tGP: 110, tG: 62, tA: 12, value: "ⰵ195M", attributes: { spd: 94, sho: 93, pas: 85, dri: 95, def: 42, phy: 86, men: 90, sta: 89 } },
            { no: 10, pos: "CAM", nat: "西班牙", name: "佩德", rating: 88, height: 174, weight: 60, age: 23, cGP: 180, cG: 32, cA: 75, tGP: 0, tG: 0, tA: 0, value: "ⰵ91M", attributes: { spd: 84, sho: 78, pas: 92, dri: 94, def: 52, phy: 65, men: 88, sta: 85 } },
            { no: 31, pos: "CB", nat: "意大利", name: "巴斯托", rating: 88, height: 190, weight: 85, age: 27, cGP: 320, cG: 12, cA: 15, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 78, sho: 45, pas: 84, dri: 75, def: 91, phy: 88, men: 85, sta: 85 } },
            { no: 7, pos: "LM", nat: "法国", name: "扎法", rating: 89, height: 175, weight: 70, age: 30, cGP: 362, cG: 85, cA: 142, tGP: 65, tG: 12, tA: 24, value: "ⰵ72M", attributes: { spd: 91, sho: 78, pas: 90, dri: 93, def: 45, phy: 72, men: 88, sta: 82 } },
            { no: 33, pos: "CM", nat: "丹麦", name: "霍伊", rating: 87, height: 185, weight: 82, age: 29, cGP: 340, cG: 22, cA: 18, tGP: 0, tG: 0, tA: 0, value: "70M", attributes: { spd: 75, sho: 78, pas: 84, dri: 78, def: 88, phy: 91, men: 92, sta: 94 } },
            { no: 17, pos: "RM", nat: "威尔士", name: "贝尔", rating: 87, height: 180, weight: 74, age: 26, cGP: 220, cG: 48, cA: 65, tGP: 112, tG: 15, tA: 32, value: "ⰵ85M", attributes: { spd: 92, sho: 80, pas: 84, dri: 91, def: 45, phy: 74, men: 82, sta: 88 } },
            { no: 6, pos: "CDM", nat: "德国", name: "克莱恩", rating: 87, height: 183, weight: 79, age: 27, cGP: 235, cG: 15, cA: 45, tGP: 125, tG: 5, tA: 21, value: "ⰵ75M", attributes: { spd: 78, sho: 65, pas: 86, dri: 82, def: 89, phy: 85, men: 88, sta: 92 } },
            { no: 13, pos: "CAM", nat: "英格兰", name: "格林纳尔", rating: 87, height: 176, weight: 71, age: 32, cGP: 410, cG: 92, cA: 118, tGP: 95, tG: 21, tA: 38, value: "ⰵ22M", attributes: { spd: 85, sho: 82, pas: 88, dri: 86, def: 48, phy: 70, men: 85, sta: 78 } },
            { no: 26, pos: "ST", nat: "希腊", name: "基力亚尔", rating: 87, height: 182, weight: 76, age: 24, cGP: 140, cG: 76, cA: 21, tGP: 140, tG: 76, tA: 21, value: "ⰵ95M", attributes: { spd: 89, sho: 88, pas: 72, dri: 87, def: 35, phy: 82, men: 78, sta: 85 } },
            { no: 1, pos: "GK", nat: "阿根廷", name: "加扎尼斯", rating: 86, height: 191, weight: 88, age: 26, cGP: 195, cG: 0, cA: 1, tGP: 156, tG: 0, tA: 0, value: "ⰵ48M", attributes: { div: 88, han: 84, kic: 80, ref: 89, spd: 58, pos_s: 85, men: 80, sta: 84 } },
            { no: 4, pos: "CB", nat: "塞尔维亚", name: "德约科维奇", rating: 86, height: 188, weight: 85, age: 26, cGP: 210, cG: 15, cA: 2, tGP: 180, tG: 9, tA: 2, value: "ⰵ45M", attributes: { spd: 82, sho: 45, pas: 74, dri: 72, def: 88, phy: 92, men: 84, sta: 88 } },
            { no: 19, pos: "ST", nat: "日本", name: "佐藤健", rating: 86, height: 177, weight: 70, age: 24, cGP: 95, cG: 58, cA: 15, tGP: 95, tG: 58, tA: 15, value: "ⰵ78M", attributes: { spd: 90, sho: 86, pas: 75, dri: 89, def: 32, phy: 68, men: 76, sta: 82 } },
            { no: 18, pos: "CM", nat: "捷克", name: "索切克", rating: 85, height: 188, weight: 86, age: 29, cGP: 312, cG: 42, cA: 31, tGP: 140, tG: 12, tA: 15, value: "ⰵ38M", attributes: { spd: 76, sho: 82, pas: 84, dri: 80, def: 82, phy: 88, men: 85, sta: 90 } },
            { no: 5, pos: "CB", nat: "葡萄牙", name: "努诺", rating: 84, height: 186, weight: 82, age: 29, cGP: 245, cG: 12, cA: 4, tGP: 85, tG: 4, tA: 1, value: "ⰵ28M", attributes: { spd: 78, sho: 42, pas: 70, dri: 68, def: 86, phy: 84, men: 80, sta: 82 } },
            { no: 14, pos: "CB", nat: "法国", name: "法波", rating: 84, height: 185, weight: 81, age: 32, cGP: 420, cG: 22, cA: 5, tGP: 50, tG: 2, tA: 0, value: "ⰵ12M", attributes: { spd: 72, sho: 40, pas: 72, dri: 65, def: 87, phy: 82, men: 90, sta: 75 } },
            { no: 3, pos: "LB", nat: "巴西", name: "罗杰", rating: 84, height: 178, weight: 73, age: 29, cGP: 210, cG: 6, cA: 42, tGP: 60, tG: 1, tA: 15, value: "ⰵ26M", attributes: { spd: 88, sho: 62, pas: 84, dri: 83, def: 81, phy: 75, men: 82, sta: 88 } },
            { no: 16, pos: "CM", nat: "德国", name: "菲利普", rating: 84, height: 179, weight: 75, age: 27, cGP: 185, cG: 18, cA: 52, tGP: 50, tG: 4, tA: 11, value: "ⰵ32M", attributes: { spd: 80, sho: 74, pas: 85, dri: 84, def: 78, phy: 76, men: 80, sta: 85 } },
            { no: 27, pos: "RM", nat: "爱尔兰", name: "肯尼", rating: 84, height: 175, weight: 69, age: 28, cGP: 240, cG: 38, cA: 55, tGP: 65, tG: 8, tA: 15, value: "ⰵ29M", attributes: { spd: 89, sho: 76, pas: 78, dri: 87, def: 52, phy: 70, men: 78, sta: 82 } },
            { no: 2, pos: "RB", nat: "美国", name: "佩尔顿", rating: 83, height: 180, weight: 77, age: 24, cGP: 115, cG: 4, cA: 28, tGP: 55, tG: 1, tA: 12, value: "ⰵ42M", attributes: { spd: 91, sho: 60, pas: 80, dri: 84, def: 79, phy: 74, men: 72, sta: 94 } },
            { no: 15, pos: "CB", nat: "西班牙", name: "劳尔", rating: 82, height: 188, weight: 83, age: 25, cGP: 85, cG: 3, cA: 0, tGP: 85, tG: 3, tA: 0, value: "ⰵ35M", attributes: { spd: 76, sho: 40, pas: 62, dri: 60, def: 84, phy: 88, men: 78, sta: 80 } },
            { no: 25, pos: "CB", nat: "葡萄牙", name: "德萨", rating: 82, height: 186, weight: 82, age: 29, cGP: 155, cG: 8, cA: 2, tGP: 75, tG: 4, tA: 0, value: "ⰵ18M", attributes: { spd: 74, sho: 38, pas: 64, dri: 62, def: 83, phy: 85, men: 75, sta: 82 } },
            { no: 20, pos: "CM", nat: "葡萄牙", name: "門德斯", rating: 82, height: 181, weight: 77, age: 31, cGP: 295, cG: 22, cA: 58, tGP: 48, tG: 3, tA: 8, value: "ⰵ14M", attributes: { spd: 78, sho: 72, pas: 83, dri: 80, def: 74, phy: 76, men: 82, sta: 85 } },
            { no: 22, pos: "CM", nat: "以色列", name: "拉兹", rating: 82, height: 177, weight: 72, age: 35, cGP: 510, cG: 32, cA: 85, tGP: 80, tG: 5, tA: 18, value: "ⰵ7.5M", attributes: { spd: 72, sho: 74, pas: 85, dri: 81, def: 70, phy: 72, men: 88, sta: 78 } },
            { no: 28, pos: "ST", nat: "法国", name: "厄兰纳", rating: 82, height: 183, weight: 80, age: 30, cGP: 315, cG: 142, cA: 21, tGP: 45, tG: 12, tA: 2, value: "ⰵ16M", attributes: { spd: 84, sho: 85, pas: 68, dri: 82, def: 35, phy: 80, men: 74, sta: 82 } }
        ]
    },

    // 4. 岚 (Arashi)
    "岚": {
        color: "#10b981",
        style: "稳固防守",
        stadium: "东方足球场",
        coach: { name: "斯帕莱迪", gp: 200, w: 75, d: 27, l: 98, rate: "37.50%" },
        status: { best: "阴天 · 下午", worst: "雨天 · 早上", injury: "0", tactic: "固守阵型" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 0, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 2, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-5-1)",
                players: {
                    "GK": "雷恩", "LB": "比萨卡", "LCB": "阿克塞尔", "RCB": "科内", "RB": "阿方索",
                    "CDM": "普拉维尼", "LM": "安利克", "CM": "萨比策", "CAM": "席尔瓦", "RM": "斯顿斯", "ST": "梅西亚"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "CDM": [42, 50], "LM": [70, 15], "CM": [62, 38], "CAM": [62, 62], "RM": [70, 85], "ST": [85, 50]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-3-3)",
                players: {
                    "GK": "夏兰特", "LB": "阿隆", "LCB": "梅里耶", "RCB": "巴恩斯", "RB": "特维斯",
                    "LCM": "科尔", "CDM": "李思德", "RCM": "德鲁涅", "LW": "迪达", "ST": "基尔克特", "RW": "维克特"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LCM": [52, 30], "CDM": [45, 50], "RCM": [52, 70], "LW": [78, 18], "ST": [85, 50], "RW": [78, 82]
                }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "法国", name: "雷恩", rating: 82, height: 188, weight: 83, age: 27, cGP: 360, cG: 0, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { div: 83, han: 79, kic: 76, ref: 85, spd: 55, pos_s: 82, men: 80, sta: 82 } },
            { no: 3, pos: "LB", nat: "英格兰", name: "比萨卡", rating: 87, height: 183, weight: 76, age: 28, cGP: 462, cG: 16, cA: 103, tGP: 0, tG: 0, tA: 0, value: "ⰵ62M", attributes: { spd: 88, sho: 65, pas: 82, dri: 84, def: 88, phy: 82, men: 85, sta: 92 } },
            { no: 4, pos: "CB", nat: "德国", name: "阿克塞尔", rating: 85, height: 189, weight: 85, age: 27, cGP: 355, cG: 20, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 77, sho: 45, pas: 70, dri: 72, def: 90, phy: 91, men: 84, sta: 85 } },
            { no: 14, pos: "CB", nat: "法国", name: "科内", rating: 81, height: 186, weight: 80, age: 23, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 85, sho: 40, pas: 72, dri: 68, def: 82, phy: 84, men: 78, sta: 82 } },
            { no: 2, pos: "RB", nat: "加拿大", name: "阿方索", rating: 83, height: 181, weight: 75, age: 25, cGP: 247, cG: 11, cA: 63, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 94, sho: 62, pas: 78, dri: 87, def: 79, phy: 76, men: 78, sta: 95 } },
            { no: 6, pos: "CDM", nat: "意大利", name: "普拉维尼", rating: 85, height: 182, weight: 78, age: 26, cGP: 320, cG: 24, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 78, sho: 70, pas: 86, dri: 81, def: 84, phy: 86, men: 86, sta: 92 } },
            { no: 8, pos: "CM", nat: "奥地利", name: "萨比策", rating: 82, height: 178, weight: 74, age: 29, cGP: 577, cG: 97, cA: 113, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { spd: 78, sho: 80, pas: 84, dri: 81, def: 75, phy: 78, men: 85, sta: 82 } },
            { no: 10, pos: "CAM", nat: "葡萄牙", name: "席尔瓦", rating: 83, height: 176, weight: 70, age: 25, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 80, sho: 78, pas: 86, dri: 85, def: 45, phy: 68, men: 80, sta: 82 } },
            { no: 7, pos: "LM", nat: "西班牙", name: "安利克", rating: 82, height: 177, weight: 70, age: 25, cGP: 200, cG: 37, cA: 57, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 87, sho: 78, pas: 80, dri: 84, def: 45, phy: 70, men: 76, sta: 86 } },
            { no: 17, pos: "RM", nat: "英格兰", name: "斯顿斯", rating: 81, height: 188, weight: 80, age: 26, cGP: 185, cG: 20, cA: 36, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { spd: 75, sho: 66, pas: 76, dri: 74, def: 83, phy: 86, men: 80, sta: 84 } },
            { no: 9, pos: "ST", nat: "巴西", name: "梅西亚", rating: 83, height: 184, weight: 79, age: 24, cGP: 205, cG: 100, cA: 22, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 86, sho: 87, pas: 70, dri: 82, def: 35, phy: 83, men: 80, sta: 82 } },
            { no: 12, pos: "GK", nat: "挪威", name: "夏兰特", rating: 81, height: 191, weight: 90, age: 24, cGP: 145, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ16M", attributes: { div: 82, han: 80, kic: 83, ref: 82, spd: 50, pos_s: 82, men: 76, sta: 78 } },
            { no: 22, pos: "LB", nat: "西班牙", name: "阿隆", rating: 81, height: 176, weight: 72, age: 23, cGP: 160, cG: 6, cA: 39, tGP: 0, tG: 0, tA: 0, value: "ⰵ20M", attributes: { spd: 86, sho: 58, pas: 80, dri: 80, def: 75, phy: 71, men: 74, sta: 85 } },
            { no: 5, pos: "CB", nat: "法国", name: "梅里耶", rating: 80, height: 187, weight: 82, age: 25, cGP: 177, cG: 7, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ13M", attributes: { spd: 73, sho: 40, pas: 66, dri: 65, def: 82, phy: 84, men: 80, sta: 80 } },
            { no: 15, pos: "CB", nat: "英格兰", name: "巴恩斯", rating: 79, height: 185, weight: 81, age: 23, cGP: 155, cG: 7, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 76, sho: 42, pas: 64, dri: 62, def: 80, phy: 82, men: 76, sta: 78 } },
            { no: 20, pos: "RB", nat: "阿根廷", name: "特维斯", rating: 80, height: 179, weight: 77, age: 26, cGP: 203, cG: 14, cA: 34, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 85, sho: 62, pas: 75, dri: 79, def: 76, phy: 75, men: 78, sta: 82 } },
            { no: 16, pos: "CDM", nat: "中国", name: "李思德", rating: 78, height: 180, weight: 78, age: 22, cGP: 80, cG: 4, cA: 13, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { spd: 77, sho: 62, pas: 78, dri: 76, def: 80, phy: 80, men: 82, sta: 90 } },
            { no: 18, pos: "CM", nat: "英格兰", name: "科尔", rating: 82, height: 180, weight: 75, age: 24, cGP: 210, cG: 37, cA: 66, tGP: 0, tG: 0, tA: 0, value: "ⰵ40M", attributes: { spd: 81, sho: 76, pas: 83, dri: 84, def: 70, phy: 73, men: 82, sta: 86 } },
            { no: 21, pos: "CM", nat: "比利时", name: "德鲁涅", rating: 80, height: 181, weight: 74, age: 24, cGP: 160, cG: 22, cA: 43, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 79, sho: 74, pas: 82, dri: 80, def: 68, phy: 75, men: 77, sta: 82 } },
            { no: 11, pos: "LW", nat: "巴西", name: "迪达", rating: 78, height: 172, weight: 68, age: 25, cGP: 220, cG: 46, cA: 61, tGP: 0, tG: 0, tA: 0, value: "ⰵ14M", attributes: { spd: 91, sho: 75, pas: 73, dri: 83, def: 42, phy: 63, men: 72, sta: 85 } },
            { no: 26, pos: "ST", nat: "德国", name: "基尔克特", rating: 82, height: 183, weight: 80, age: 24, cGP: 180, cG: 100, cA: 22, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 83, sho: 84, pas: 66, dri: 80, def: 30, phy: 78, men: 76, sta: 81 } },
            { no: 19, pos: "RW", nat: "葡萄牙", name: "维克特", rating: 80, height: 174, weight: 69, age: 23, cGP: 137, cG: 25, cA: 39, tGP: 0, tG: 0, tA: 0, value: "ⰵ20M", attributes: { spd: 89, sho: 78, pas: 76, dri: 83, def: 40, phy: 66, men: 74, sta: 84 } },
            { no: 28, pos: "ST", nat: "意大利", name: "费雷莫", rating: 79, height: 182, weight: 78, age: 22, cGP: 95, cG: 33, cA: 6, tGP: 0, tG: 0, tA: 0, value: "ⰵ15M", attributes: { spd: 84, sho: 78, pas: 63, dri: 76, def: 35, phy: 80, men: 72, sta: 76 } },
            { no: 24, pos: "LB", nat: "意大利", name: "赞多罗", rating: 79, height: 173, weight: 70, age: 21, cGP: 62, cG: 1, cA: 20, tGP: 0, tG: 0, tA: 0, value: "ⰵ14M", attributes: { spd: 87, sho: 56, pas: 76, dri: 80, def: 74, phy: 67, men: 72, sta: 86 } },
            { no: 23, pos: "GK", nat: "瑞士", name: "费雷特", rating: 79, height: 189, weight: 86, age: 22, cGP: 80, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ11M", attributes: { div: 79, han: 77, kic: 81, ref: 83, spd: 48, pos_s: 77, men: 74, sta: 76 } },
            { no: 25, pos: "CAM", nat: "荷兰", name: "弗朗吉", rating: 80, height: 177, weight: 71, age: 23, cGP: 170, cG: 23, cA: 43, tGP: 0, tG: 0, tA: 0, value: "ⰵ30M", attributes: { spd: 85, sho: 75, pas: 82, dri: 84, def: 50, phy: 66, men: 74, sta: 81 } }
        ]
    },

    // 5. 蜜蜂 (Bees)
    "蜜蜂": {
        color: "#facc15",
        style: "中路渗透",
        stadium: "黄蜂足球场",
        coach: { name: "罗纳德", gp: 198, w: 113, d: 53, l: 32, rate: "57.07%" },
        status: { best: "晴天 · 晚上", worst: "阴天 · 早上", injury: "0", tactic: "中路渗透" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 0, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 7, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-5-1)",
                players: {
                    "GK": "德约罗", "LB": "特雷森", "LCB": "布朗", "RCB": "伊恩", "RB": "卡纳威",
                    "CDM": "克斯特里奇", "LM": "万亚尔", "CM": "莱昂内尔", "CAM": "卢卡莫德", "RM": "萨维尼奥", "ST": "巴尔加斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "CDM": [42, 50], "LM": [70, 15], "CM": [62, 38], "CAM": [62, 62], "RM": [70, 85], "ST": [85, 50]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-3-3)",
                players: {
                    "GK": "祖安", "LB": "里比斯", "LCB": "孔蒂", "RCB": "葛雷洛", "RB": "阿兰",
                    "LCM": "塔尔萨", "CDM": "埃斯托", "RCM": "马可", "LW": "赫南德斯", "ST": "雷诺", "RW": "加内蒂"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LCM": [52, 30], "CDM": [45, 50], "RCM": [52, 70], "LW": [78, 18], "ST": [85, 50], "RW": [78, 82]
                }
            },
        },
        roster: [
            { no: 1, pos: "GK", nat: "瑞士", name: "德约罗", rating: 85, height: 191, weight: 86, age: 30, cGP: 508, cG: 0, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ26M", attributes: { div: 86, han: 83, kic: 78, ref: 87, spd: 52, pos_s: 85, men: 90, sta: 80 } },
            { no: 3, pos: "LB", nat: "挪威", name: "特雷森", rating: 82, height: 182, weight: 75, age: 25, cGP: 227, cG: 6, cA: 46, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 90, sho: 60, pas: 80, dri: 84, def: 78, phy: 74, men: 76, sta: 94 } },
            { no: 4, pos: "CB", nat: "英格兰", name: "布朗", rating: 85, height: 188, weight: 85, age: 27, cGP: 320, cG: 20, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 79, sho: 50, pas: 72, dri: 70, def: 89, phy: 91, men: 86, sta: 85 } },
            { no: 5, pos: "CB", nat: "苏格兰", name: "伊恩", rating: 84, height: 186, weight: 83, age: 26, cGP: 257, cG: 11, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { spd: 81, sho: 45, pas: 68, dri: 72, def: 86, phy: 88, men: 82, sta: 84 } },
            { no: 2, pos: "RB", nat: "爱尔兰", name: "卡纳威", rating: 82, height: 178, weight: 72, age: 25, cGP: 190, cG: 6, cA: 34, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 92, sho: 62, pas: 78, dri: 86, def: 79, phy: 72, men: 74, sta: 96 } },
            { no: 6, pos: "CDM", nat: "奥地利", name: "克斯特里奇", rating: 84, height: 184, weight: 80, age: 27, cGP: 345, cG: 24, cA: 44, tGP: 0, tG: 0, tA: 0, value: "ⰵ40M", attributes: { spd: 78, sho: 70, pas: 85, dri: 79, def: 84, phy: 86, men: 86, sta: 94 } },
            { no: 10, pos: "CAM", nat: "克罗地亚", name: "卢卡莫德", rating: 85, height: 174, weight: 68, age: 29, cGP: 522, cG: 70, cA: 176, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 78, sho: 82, pas: 91, dri: 88, def: 60, phy: 70, men: 96, sta: 80 } },
            { no: 8, pos: "CM", nat: "阿根廷", name: "莱昂内尔", rating: 85, height: 177, weight: 73, age: 26, cGP: 243, cG: 40, cA: 74, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 82, sho: 78, pas: 87, dri: 85, def: 75, phy: 77, men: 84, sta: 88 } },
            { no: 7, pos: "LM", nat: "西班牙", name: "万亚尔", rating: 80, height: 175, weight: 66, age: 22, cGP: 110, cG: 20, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { spd: 90, sho: 74, pas: 76, dri: 83, def: 42, phy: 64, men: 72, sta: 86 } },
            { no: 11, pos: "RM", nat: "巴西", name: "萨维尼奥", rating: 83, height: 176, weight: 68, age: 21, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 90, sho: 76, pas: 80, dri: 88, def: 45, phy: 68, men: 74, sta: 84 } },
            { no: 9, pos: "ST", nat: "乌拉圭", name: "巴尔加斯", rating: 84, height: 182, weight: 78, age: 23, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 86, sho: 88, pas: 66, dri: 81, def: 35, phy: 82, men: 80, sta: 82 } },
            { no: 12, pos: "GK", nat: "巴西", name: "祖安", rating: 81, height: 190, weight: 85, age: 24, cGP: 180, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ17M", attributes: { div: 82, han: 81, kic: 76, ref: 84, spd: 55, pos_s: 80, men: 77, sta: 78 } },
            { no: 16, pos: "CDM", nat: "西班牙", name: "埃斯托", rating: 83, height: 187, weight: 81, age: 26, cGP: 243, cG: 16, cA: 27, tGP: 0, tG: 0, tA: 0, value: "ⰵ34M", attributes: { spd: 76, sho: 68, pas: 83, dri: 77, def: 82, phy: 83, men: 82, sta: 91 } },
            { no: 17, pos: "LW", nat: "墨西哥", name: "赫南德斯", rating: 81, height: 175, weight: 70, age: 23, cGP: 150, cG: 34, cA: 53, tGP: 0, tG: 0, tA: 0, value: "ⰵ26M", attributes: { spd: 87, sho: 79, pas: 78, dri: 84, def: 48, phy: 70, men: 76, sta: 85 } },
            { no: 15, pos: "CB", nat: "意大利", name: "孔蒂", rating: 82, height: 187, weight: 83, age: 24, cGP: 205, cG: 13, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { spd: 75, sho: 40, pas: 66, dri: 63, def: 85, phy: 88, men: 82, sta: 82 } },
            { no: 18, pos: "CM", nat: "意大利", name: "马可", rating: 80, height: 180, weight: 74, age: 21, cGP: 60, cG: 7, cA: 23, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 81, sho: 74, pas: 82, dri: 84, def: 68, phy: 72, men: 75, sta: 86 } },
            { no: 21, pos: "CAM", nat: "美国", name: "塔尔萨", rating: 80, height: 181, weight: 75, age: 25, cGP: 160, cG: 25, cA: 46, tGP: 0, tG: 0, tA: 0, value: "ⰵ20M", attributes: { spd: 82, sho: 76, pas: 84, dri: 86, def: 52, phy: 68, men: 77, sta: 82 } },
            { no: 24, pos: "ST", nat: "乌拉圭", name: "卡瓦龙", rating: 80, height: 185, weight: 79, age: 25, cGP: 225, cG: 114, cA: 19, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { spd: 85, sho: 84, pas: 65, dri: 79, def: 32, phy: 80, men: 78, sta: 82 } },
            { no: 25, pos: "CB", nat: "西班牙", name: "葛雷洛", rating: 79, height: 185, weight: 80, age: 23, cGP: 130, cG: 6, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ16M", attributes: { spd: 76, sho: 42, pas: 63, dri: 61, def: 82, phy: 83, men: 75, sta: 78 } },
            { no: 20, pos: "RB", nat: "巴西", name: "阿兰", rating: 78, height: 176, weight: 70, age: 22, cGP: 83, cG: 3, cA: 21, tGP: 0, tG: 0, tA: 0, value: "ⰵ14M", attributes: { spd: 86, sho: 60, pas: 74, dri: 79, def: 75, phy: 69, men: 71, sta: 83 } },
            { no: 22, pos: "LB", nat: "葡萄牙", name: "里比斯", rating: 77, height: 177, weight: 71, age: 23, cGP: 95, cG: 3, cA: 23, tGP: 0, tG: 0, tA: 0, value: "ⰵ13M", attributes: { spd: 85, sho: 55, pas: 75, dri: 79, def: 73, phy: 66, men: 71, sta: 85 } },
            { no: 26, pos: "ST", nat: "法国", name: "雷诺", rating: 79, height: 184, weight: 78, age: 22, cGP: 90, cG: 34, cA: 6, tGP: 0, tG: 0, tA: 0, value: "ⰵ14M", attributes: { spd: 84, sho: 80, pas: 61, dri: 74, def: 35, phy: 79, men: 72, sta: 78 } },
            { no: 19, pos: "RW", nat: "意大利", name: "加内蒂", rating: 78, height: 175, weight: 67, age: 21, cGP: 52, cG: 13, cA: 23, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 89, sho: 74, pas: 75, dri: 82, def: 40, phy: 65, men: 70, sta: 83 } },
            { no: 23, pos: "GK", nat: "俄罗斯", name: "尤里", rating: 78, height: 191, weight: 87, age: 22, cGP: 75, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ10M", attributes: { div: 79, han: 77, kic: 75, ref: 81, spd: 55, pos_s: 76, men: 74, sta: 75 } },
            { no: 27, pos: "CDM", nat: "比利时", name: "温克森", rating: 79, height: 186, weight: 82, age: 24, cGP: 145, cG: 10, cA: 27, tGP: 0, tG: 0, tA: 0, value: "ⰵ16M", attributes: { spd: 75, sho: 62, pas: 82, dri: 73, def: 81, phy: 81, men: 80, sta: 89 } }
        ]
    },

    // 6. 狂蜂 (Crazbee)
    "狂蜂": {
        color: "#eab308",
        style: "极速攻守转换",
        stadium: "里维尔足球场",
        coach: { name: "亨理奇", gp: 610, w: 422, d: 53, l: 135, rate: "69.18%" },
        status: { best: "晴天 · 早上", worst: "阴天 · 晚上", injury: "0", tactic: "极速攻守转换" },
        honors: [
            { name: "世联赛冠军", count: 2, seasons: "12赛季、13赛季", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 1, seasons: "12赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 2, seasons: "S-79赛季、S-82赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 2, seasons: "10赛季、15赛季", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 3, seasons: "06赛季、12赛季、13赛季", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 4, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 6, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 11, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-2-3-1)",
                players: {
                    "GK": "斯莱斯欧", "LB": "德斯特", "LCB": "范德克", "RCB": "鲁本斯", "RB": "拉米欧斯",
                    "LDM": "坎德", "RDM": "索萨", "CAM": "帕尔诺", "LM": "儒尼奥", "RM": "特劳纳多", "ST": "瓦尔"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LDM": [40, 35], "RDM": [40, 65], "CAM": [60, 50], "LM": [72, 15], "RM": [72, 85], "ST": [86, 50]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-3-3)",
                players: {
                    "GK": "迪奥·科斯", "LB": "阿莱德", "LCB": "德泽比", "RCB": "马基", "RB": "维亚纳",
                    "LDM": "邓佩莱", "LCM": "菲力克", "RCM": "维尔梅伦", "LW": "中村太郎", "ST": "海拉德", "RW": "艾斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LDM": [45, 50], "LCM": [58, 28], "RCM": [58, 72], "LW": [82, 15], "ST": [86, 50], "RW": [82, 85]
                }
            }
        },
        roster: [
            { no: 11, pos: "LM", nat: "巴西", name: "儒尼奥", rating: 91, height: 176, weight: 69, age: 25, cGP: 285, cG: 82, cA: 74, tGP: 0, tG: 0, tA: 0, value: "ⰵ145M", attributes: { spd: 97, sho: 85, pas: 80, dri: 94, def: 40, phy: 75, men: 85, sta: 90 } },
            { no: 4, pos: "CB", nat: "荷兰", name: "范德克", rating: 93, height: 193, weight: 92, age: 30, cGP: 722, cG: 47, cA: 11, tGP: 0, tG: 0, tA: 0, value: "ⰵ110M", attributes: { spd: 84, sho: 60, pas: 88, dri: 78, def: 96, phy: 94, men: 99, sta: 86 } },
            { no: 9, pos: "ST", nat: "英格兰", name: "瓦尔", rating: 92, height: 187, weight: 83, age: 28, cGP: 776, cG: 612, cA: 64, tGP: 0, tG: 0, tA: 0, value: "ⰵ140M", attributes: { spd: 90, sho: 97, pas: 78, dri: 92, def: 38, phy: 89, men: 95, sta: 86 } },
            { no: 5, pos: "CB", nat: "葡萄牙", name: "鲁本斯", rating: 92, height: 187, weight: 85, age: 28, cGP: 365, cG: 20, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 82, sho: 50, pas: 80, dri: 75, def: 95, phy: 92, men: 96, sta: 85 } },
            { no: 17, pos: "RM", nat: "阿根廷", name: "特劳纳多", rating: 92, height: 172, weight: 67, age: 30, cGP: 730, cG: 334, cA: 177, tGP: 0, tG: 0, tA: 0, value: "ⰵ110M", attributes: { spd: 97, sho: 86, pas: 92, dri: 94, def: 55, phy: 78, men: 95, sta: 87 } },
            { no: 10, pos: "CAM", nat: "意大利", name: "帕尔诺", rating: 89, height: 176, weight: 72, age: 25, cGP: 245, cG: 53, cA: 102, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 87, sho: 85, pas: 91, dri: 90, def: 52, phy: 76, men: 82, sta: 89 } },
            { no: 16, pos: "CDM", nat: "葡萄牙", name: "索萨", rating: 89, height: 182, weight: 78, age: 25, cGP: 263, cG: 17, cA: 60, tGP: 0, tG: 0, tA: 0, value: "ⰵ105M", attributes: { spd: 81, sho: 72, pas: 87, dri: 85, def: 86, phy: 89, men: 84, sta: 96 } },
            { no: 6, pos: "CDM", nat: "法国", name: "坎德", rating: 89, height: 168, weight: 70, age: 31, cGP: 625, cG: 31, cA: 113, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 82, sho: 70, pas: 88, dri: 85, def: 91, phy: 94, men: 96, sta: 96 } },
            { no: 3, pos: "LB", nat: "美国", name: "德斯特", rating: 88, height: 175, weight: 68, age: 26, cGP: 290, cG: 19, cA: 60, tGP: 0, tG: 0, tA: 0, value: "ⰵ82M", attributes: { spd: 93, sho: 68, pas: 85, dri: 89, def: 82, phy: 75, men: 82, sta: 95 } },
            { no: 2, pos: "RB", nat: "西班牙", name: "拉米欧斯", rating: 88, height: 178, weight: 74, age: 32, cGP: 545, cG: 15, cA: 84, tGP: 0, tG: 0, tA: 0, value: "ⰵ30M", attributes: { spd: 86, sho: 65, pas: 86, dri: 83, def: 84, phy: 78, men: 90, sta: 82 } },
            { no: 1, pos: "GK", nat: "荷兰", name: "斯莱斯欧", rating: 89, height: 189, weight: 84, age: 33, cGP: 665, cG: 0, cA: 6, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { div: 90, han: 87, kic: 84, ref: 91, spd: 55, pos_s: 92, men: 95, sta: 82 } },
            { no: 8, pos: "CB", nat: "巴西", name: "马基", rating: 90, height: 183, weight: 79, age: 31, cGP: 485, cG: 32, cA: 15, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 78, sho: 55, pas: 78, dri: 72, def: 92, phy: 85, men: 94, sta: 85 } },
            { no: 88, pos: "GK", nat: "葡萄牙", name: "迪奥科斯", rating: 87, height: 192, weight: 86, age: 26, cGP: 215, cG: 0, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ60M", attributes: { div: 88, han: 85, kic: 88, ref: 90, spd: 58, pos_s: 86, men: 84, sta: 82 } },
            { no: 28, pos: "CAM", nat: "葡萄牙", name: "菲力克", rating: 88, height: 181, weight: 71, age: 19, cGP: 35, cG: 9, cA: 14, tGP: 0, tG: 0, tA: 0, value: "ⰵ135M", attributes: { spd: 89, sho: 84, pas: 87, dri: 93, def: 45, phy: 72, men: 76, sta: 96 } },
            { no: 33, pos: "ST", nat: "丹麦", name: "海拉德", rating: 84, height: 191, weight: 84, age: 22, cGP: 125, cG: 48, cA: 12, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 88, sho: 85, pas: 68, dri: 78, def: 30, phy: 86, men: 78, sta: 80 } },
            { no: 21, pos: "CB", nat: "意大利", name: "德泽比", rating: 90, height: 186, weight: 81, age: 27, cGP: 320, cG: 21, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 83, sho: 48, pas: 74, dri: 72, def: 92, phy: 90, men: 84, sta: 87 } },
            { no: 35, pos: "CM", nat: "德国", name: "克洛", rating: 86, height: 183, weight: 78, age: 35, cGP: 720, cG: 78, cA: 185, tGP: 0, tG: 0, tA: 0, value: "ⰵ8M", attributes: { spd: 65, sho: 80, pas: 95, dri: 82, def: 68, phy: 65, men: 98, sta: 70 } },
            { no: 26, pos: "RB", nat: "西班牙", name: "维亚纳", rating: 82, height: 178, weight: 71, age: 22, cGP: 110, cG: 4, cA: 28, tGP: 0, tG: 0, tA: 0, value: "ⰵ25M", attributes: { spd: 91, sho: 65, pas: 82, dri: 84, def: 75, phy: 70, men: 78, sta: 88 } },
            { no: 11, pos: "LB", nat: "西班牙", name: "阿莱德", rating: 83, height: 176, weight: 70, age: 22, cGP: 132, cG: 6, cA: 35, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 92, sho: 55, pas: 78, dri: 86, def: 78, phy: 72, men: 75, sta: 90 } },
            { no: 20, pos: "CM", nat: "比利时", name: "维尔梅伦", rating: 88, height: 180, weight: 74, age: 24, cGP: 160, cG: 15, cA: 50, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 86, sho: 76, pas: 90, dri: 89, def: 79, phy: 75, men: 84, sta: 93 } },
            { no: 19, pos: "LW", nat: "日本", name: "中村太郎", rating: 87, height: 173, weight: 66, age: 26, cGP: 250, cG: 93, cA: 70, tGP: 0, tG: 0, tA: 0, value: "ⰵ70M", attributes: { spd: 91, sho: 79, pas: 84, dri: 93, def: 42, phy: 66, men: 78, sta: 83 } },
            { no: 27, pos: "RM", nat: "西班牙", name: "艾斯", rating: 87, height: 174, weight: 68, age: 25, cGP: 182, cG: 31, cA: 53, tGP: 0, tG: 0, tA: 0, value: "ⰵ78M", attributes: { spd: 91, sho: 82, pas: 84, dri: 89, def: 48, phy: 70, men: 76, sta: 85 } },
            { no: 42, pos: "CM", nat: "西班牙", name: "扎伊", rating: 78, height: 178, weight: 70, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ5M", attributes: { spd: 80, sho: 70, pas: 84, dri: 82, def: 65, phy: 68, men: 74, sta: 85 } },
            { no: 44, pos: "CB", nat: "荷兰", name: "古利", rating: 76, height: 188, weight: 83, age: 18, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ4M", attributes: { spd: 78, sho: 40, pas: 65, dri: 60, def: 80, phy: 86, men: 72, sta: 82 } },
            { no: 49, pos: "ST", nat: "英格兰", name: "库阿", rating: 75, height: 177, weight: 65, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ7M", attributes: { spd: 92, sho: 78, pas: 60, dri: 75, def: 25, phy: 65, men: 70, sta: 80 } },
            { no: 14, pos: "CDM", nat: "比利时", name: "邓佩莱", rating: 87, height: 185, weight: 82, age: 33, cGP: 510, cG: 29, cA: 90, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 76, sho: 72, pas: 87, dri: 82, def: 85, phy: 82, men: 88, sta: 80 } }
        ]
    },

    // 7. 龙王宫殿 (Dragon Palace)
    "龙王宫殿": {
        color: "#270f71",
        style: "区域联防",
        stadium: "伊泽勒斯足球场",
        coach: { name: "努涅兹", gp: 846, w: 563, d: 106, l: 177, rate: "66.55%" },
        status: { best: "阴天 · 早上", worst: "雨天 · 晚上", injury: "0", tactic: "区域联防" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "12赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 2, seasons: "S-63赛季、07赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 2, seasons: "11赛季、16赛季", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 2, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 9, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛最强阵容 (3-1-4-2)",
                players: {
                    "GK": "菲戈",
                    "LCB": "阿兹兰", "CB": "卢西奥", "RCB": "马科斯",
                    "CDM": "戈萨",
                    "LM": "拉法尔", "LCM": "贝林", "RCM": "莫雷", "RM": "布卡",
                    "LST": "莫雷拉", "RST": "范德维奇"
                },
                coords: {
                    "GK": [5, 50], "LCB": [20, 28], "CB": [16, 50], "RCB": [20, 72],
                    "CDM": [38, 50], "LM": [58, 12], "LCM": [55, 35], "RCM": [55, 65], "RM": [58, 88],
                    "LST": [85, 38], "RST": [85, 62]
                }
            },
            CUP: {
                title: "杯赛潜力阵容 (4-2-3-1)",
                players: {
                    "GK": "迪奥戈",
                    "LB": "阿莱德", "LCB": "玉本太郎", "RCB": "丹尼尔斯", "RB": "维亚纳",
                    "LDM": "希勒", "RDM": "沃克",
                    "CAM": "莫德",
                    "LW": "肯迪尼", "RW": "马丁内斯", "ST": "格洛克"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 10], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 90],
                    "LDM": [40, 35], "RDM": [40, 65], "CAM": [65, 50], "LW": [82, 15], "RW": [82, 85], "ST": [85, 50]
                }
            }
        },
        roster: [
            { no: 11, pos: "ST", nat: "巴西", name: "莫雷拉", rating: 92, height: 184, weight: 79, age: 31, cGP: 645, cG: 407, cA: 83, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 87, sho: 96, pas: 82, dri: 91, def: 38, phy: 89, men: 98, sta: 82 } },
            { no: 22, pos: "ST", nat: "德国", name: "格洛克", rating: 86, height: 189, weight: 82, age: 19, cGP: 73, cG: 36, cA: 8, tGP: 0, tG: 0, tA: 0, value: "ⰵ125M", attributes: { spd: 92, sho: 89, pas: 70, dri: 85, def: 35, phy: 83, men: 78, sta: 94 } },
            { no: 4, pos: "CB", nat: "巴西", name: "卢西奥", rating: 92, height: 188, weight: 84, age: 28, cGP: 492, cG: 30, cA: 7, tGP: 0, tG: 0, tA: 0, value: "ⰵ115M", attributes: { spd: 83, sho: 50, pas: 78, dri: 74, def: 96, phy: 93, men: 99, sta: 85 } },
            { no: 8, pos: "CM", nat: "苏格兰", name: "莫雷", rating: 91, height: 178, weight: 73, age: 31, cGP: 605, cG: 84, cA: 231, tGP: 0, tG: 0, tA: 0, value: "ⰵ88M", attributes: { spd: 79, sho: 84, pas: 96, dri: 91, def: 75, phy: 80, men: 98, sta: 85 } },
            { no: 10, pos: "CM", nat: "英格兰", name: "贝林", rating: 91, height: 186, weight: 75, age: 22, cGP: 185, cG: 45, cA: 32, tGP: 0, tG: 0, tA: 0, value: "ⰵ125M", attributes: { spd: 85, sho: 84, pas: 90, dri: 88, def: 75, phy: 88, men: 82, sta: 91 } },
            { no: 6, pos: "CDM", nat: "西班牙", name: "戈萨", rating: 91, height: 183, weight: 80, age: 26, cGP: 315, cG: 26, cA: 66, tGP: 0, tG: 0, tA: 0, value: "ⰵ130M", attributes: { spd: 84, sho: 72, pas: 91, dri: 86, def: 89, phy: 91, men: 93, sta: 97 } },
            { no: 7, pos: "RM", nat: "英格兰", name: "布卡", rating: 90, height: 178, weight: 72, age: 24, cGP: 220, cG: 65, cA: 78, tGP: 0, tG: 0, tA: 0, value: "ⰵ110M", attributes: { spd: 92, sho: 85, pas: 88, dri: 90, def: 45, phy: 72, men: 80, sta: 88 } },
            { no: 13, pos: "LM", nat: "葡萄牙", name: "拉法尔", rating: 90, height: 188, weight: 83, age: 26, cGP: 265, cG: 72, cA: 55, tGP: 0, tG: 0, tA: 0, value: "ⰵ98M", attributes: { spd: 94, sho: 82, pas: 80, dri: 92, def: 42, phy: 78, men: 84, sta: 85 } },
            { no: 80, pos: "CB", nat: "巴西", name: "马科斯", rating: 90, height: 183, weight: 79, age: 31, cGP: 485, cG: 32, cA: 15, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 78, sho: 55, pas: 78, dri: 72, def: 92, phy: 85, men: 94, sta: 85 } },
            { no: 5, pos: "CB", nat: "伊朗", name: "阿兹兰", rating: 88, height: 185, weight: 82, age: 31, cGP: 565, cG: 27, cA: 6, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 77, sho: 45, pas: 72, dri: 70, def: 91, phy: 91, men: 94, sta: 82 } },
            { no: 15, pos: "CB", nat: "日本", name: "玉本太郎", rating: 88, height: 186, weight: 78, age: 25, cGP: 233, cG: 12, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ82M", attributes: { spd: 85, sho: 52, pas: 75, dri: 78, def: 89, phy: 85, men: 84, sta: 91 } },
            { no: 1, pos: "GK", nat: "葡萄牙", name: "菲戈", rating: 88, height: 190, weight: 85, age: 33, cGP: 702, cG: 0, cA: 7, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { div: 88, han: 87, kic: 84, ref: 91, spd: 55, pos_s: 90, men: 95, sta: 80 } },
            { no: 88, pos: "GK", nat: "巴西", name: "迪奥戈", rating: 84, height: 192, weight: 88, age: 25, cGP: 180, cG: 0, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ30M", attributes: { div: 84, han: 82, kic: 78, ref: 88, spd: 65, pos_s: 82, men: 80, sta: 84 } },
            { no: 33, pos: "LB", nat: "西班牙", name: "阿莱德", rating: 83, height: 176, weight: 70, age: 22, cGP: 132, cG: 6, cA: 35, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 92, sho: 55, pas: 78, dri: 86, def: 78, phy: 72, men: 75, sta: 90 } },
            { no: 26, pos: "RB", nat: "西班牙", name: "维亚纳", rating: 82, height: 178, weight: 71, age: 22, cGP: 110, cG: 4, cA: 28, tGP: 0, tG: 0, tA: 0, value: "ⰵ25M", attributes: { spd: 91, sho: 65, pas: 82, dri: 84, def: 75, phy: 70, men: 78, sta: 88 } },
            { no: 14, pos: "CAM", nat: "克罗地亚", name: "莫德", rating: 86, height: 172, weight: 66, age: 35, cGP: 720, cG: 78, cA: 185, tGP: 0, tG: 0, tA: 0, value: "ⰵ8M", attributes: { spd: 70, sho: 78, pas: 94, dri: 92, def: 72, phy: 68, men: 99, sta: 75 } },
            { no: 9, pos: "ST", nat: "荷兰", name: "范德维奇", rating: 88, height: 185, weight: 80, age: 33, cGP: 635, cG: 354, cA: 60, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { spd: 84, sho: 90, pas: 78, dri: 83, def: 38, phy: 87, men: 92, sta: 80 } },
            { no: 21, pos: "CB", nat: "印尼", name: "丹尼尔斯", rating: 87, height: 185, weight: 82, age: 27, cGP: 260, cG: 15, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 76, sho: 45, pas: 70, dri: 68, def: 88, phy: 91, men: 86, sta: 82 } },
            { no: 25, pos: "CB", nat: "巴西", name: "艾利森", rating: 84, height: 188, weight: 83, age: 34, cGP: 535, cG: 24, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ8M", attributes: { spd: 72, sho: 40, pas: 68, dri: 65, def: 85, phy: 88, men: 84, sta: 72 } },
            { no: 2, pos: "CDM", nat: "英格兰", name: "沃克", rating: 86, height: 183, weight: 80, age: 34, cGP: 600, cG: 32, cA: 73, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 80, sho: 68, pas: 84, dri: 81, def: 87, phy: 88, men: 92, sta: 82 } },
            { no: 16, pos: "CM", nat: "挪威", name: "奥丁", rating: 85, height: 180, weight: 75, age: 34, cGP: 597, cG: 50, cA: 149, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 78, sho: 76, pas: 86, dri: 84, def: 74, phy: 75, men: 84, sta: 80 } },
            { no: 18, pos: "CM", nat: "西班牙", name: "埃罗", rating: 85, height: 175, weight: 71, age: 31, cGP: 460, cG: 47, cA: 113, tGP: 0, tG: 0, tA: 0, value: "ⰵ26M", attributes: { spd: 82, sho: 78, pas: 86, dri: 84, def: 72, phy: 76, men: 80, sta: 87 } },
            { no: 19, pos: "LW", nat: "意大利", name: "肯迪尼", rating: 85, height: 175, weight: 68, age: 32, cGP: 455, cG: 89, cA: 90, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { spd: 90, sho: 80, pas: 78, dri: 92, def: 40, phy: 65, men: 82, sta: 80 } },
            { no: 20, pos: "RW", nat: "墨西哥", name: "马丁内斯", rating: 85, height: 172, weight: 65, age: 24, cGP: 142, cG: 39, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 91, sho: 82, pas: 80, dri: 88, def: 45, phy: 73, men: 76, sta: 89 } },
            { no: 28, pos: "CM", nat: "英格兰", name: "希勒", rating: 84, height: 181, weight: 73, age: 21, cGP: 72, cG: 7, cA: 20, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { spd: 83, sho: 72, pas: 86, dri: 87, def: 68, phy: 71, men: 72, sta: 86 } },
            { no: 99, pos: "ST", nat: "中国", name: "张峰", rating: 77, height: 182, weight: 75, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ6M", attributes: { spd: 85, sho: 78, pas: 65, dri: 75, def: 30, phy: 72, men: 70, sta: 80 } },
            { no: 81, pos: "RW", nat: "沙特", name: "阿里", rating: 76, height: 170, weight: 63, age: 18, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ5M", attributes: { spd: 91, sho: 72, pas: 70, dri: 84, def: 35, phy: 60, men: 68, sta: 78 } },
            { no: 66, pos: "CDM", nat: "日本", name: "佐藤", rating: 78, height: 178, weight: 72, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ7M", attributes: { spd: 78, sho: 60, pas: 82, dri: 78, def: 75, phy: 70, men: 80, sta: 90 } },
            { no: 12, pos: "GK", nat: "塞尔维亚", name: "科斯蒂奇", rating: 85, height: 194, weight: 90, age: 24, cGP: 133, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { div: 85, han: 81, kic: 78, ref: 86, spd: 60, pos_s: 82, men: 78, sta: 84 } }
        ]
    },

    // 8. 飞鹰 (Eagles)
    "飞鹰": {
        color: "#60a5fa",
        style: "边路突破",
        stadium: "天空体育场",
        coach: { name: "伊戈尔", gp: 120, w: 65, d: 22, l: 33, rate: "54.17%" },
        status: { best: "晴天 · 下午", worst: "阴天 · 早上", injury: "0", tactic: "边路突破" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 2, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 5, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-3)",
                players: { "GK": "阿奎拉", "LB": "赫隆", "LCB": "克雷亚", "RCB": "哈德森", "RB": "斯威夫特", "CDM": "埃德勒", "LCM": "霍克", "RCM": "佩雷格林", "LW": "范加尔", "RW": "塔隆", "ST": "贝尔纳" },
                coords: { "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88], "CDM": [45, 50], "LCM": [58, 28], "RCM": [58, 72], "LW": [82, 15], "ST": [88, 50], "RW": [82, 85] }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: { "GK": "派克", "LB": "斯考特", "LCB": "罗宾", "RCB": "特内尔", "RB": "康多尔", "LDM": "斯派洛", "RDM": "奎利亚", "CAM": "杰伊", "LW": "斯凯", "RW": "佩里", "ST": "奥斯普雷" },
                coords: { "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88], "LDM": [42, 35], "RDM": [42, 65], "CAM": [62, 50], "LW": [82, 15], "ST": [88, 50], "RW": [82, 85] }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "西班牙", name: "阿奎拉", rating: 72, height: 189, weight: 84, age: 28, cGP: 242, cG: 0, cA: 2, tGP: 120, tG: 0, tA: 0, value: "ⰵ6.5M", attributes: { div: 74, han: 71, kic: 68, ref: 75, spd: 52, pos_s: 73, men: 76, sta: 70 } },
            { no: 3, pos: "LB", nat: "英格兰", name: "赫隆", rating: 70, height: 177, weight: 71, age: 25, cGP: 128, cG: 4, cA: 28, tGP: 88, tG: 2, tA: 15, value: "ⰵ7.8M", attributes: { spd: 82, sho: 58, pas: 72, dri: 74, def: 68, phy: 65, men: 68, sta: 85 } },
            { no: 4, pos: "CB", nat: "意大利", name: "克雷亚", rating: 73, height: 191, weight: 87, age: 26, cGP: 155, cG: 10, cA: 2, tGP: 120, tG: 8, tA: 1, value: "ⰵ9.2M", attributes: { spd: 68, sho: 45, pas: 62, dri: 58, def: 76, phy: 82, men: 74, sta: 75 } },
            { no: 5, pos: "CB", nat: "美国", name: "哈德森", rating: 71, height: 188, weight: 83, age: 27, cGP: 182, cG: 8, cA: 1, tGP: 110, tG: 5, tA: 0, value: "ⰵ6.8M", attributes: { spd: 65, sho: 42, pas: 60, dri: 55, def: 74, phy: 78, men: 72, sta: 72 } },
            { no: 2, pos: "RB", nat: "英格兰", name: "斯威夫特", rating: 72, height: 180, weight: 74, age: 24, cGP: 105, cG: 5, cA: 35, tGP: 95, tG: 3, tA: 18, value: "ⰵ10.5M", attributes: { spd: 88, sho: 62, pas: 74, dri: 78, def: 70, phy: 68, men: 65, sta: 92 } },
            { no: 6, pos: "CDM", nat: "德国", name: "埃德勒", rating: 71, height: 182, weight: 78, age: 26, cGP: 162, cG: 12, cA: 18, tGP: 115, tG: 8, tA: 12, value: "ⰵ7.5M", attributes: { spd: 72, sho: 65, pas: 70, dri: 68, def: 73, phy: 75, men: 74, sta: 88 } },
            { no: 8, pos: "CM", nat: "美国", name: "霍克", rating: 74, height: 181, weight: 76, age: 27, cGP: 205, cG: 22, cA: 78, tGP: 165, tG: 12, tA: 45, value: "ⰵ11.8M", attributes: { spd: 75, sho: 70, pas: 78, dri: 76, def: 65, phy: 72, men: 78, sta: 82 } },
            { no: 10, pos: "CAM", nat: "英格兰", name: "佩雷格林", rating: 75, height: 179, weight: 72, age: 25, cGP: 138, cG: 38, cA: 62, tGP: 130, tG: 24, tA: 48, value: "ⰵ16.2M", attributes: { spd: 78, sho: 76, pas: 82, dri: 80, def: 45, phy: 68, men: 75, sta: 78 } },
            { no: 11, pos: "LW", nat: "荷兰", name: "范加尔", rating: 74, height: 176, weight: 69, age: 24, cGP: 118, cG: 62, cA: 45, tGP: 112, tG: 41, tA: 31, value: "ⰵ15.5M", attributes: { spd: 88, sho: 78, pas: 72, dri: 82, def: 35, phy: 62, men: 70, sta: 84 } },
            { no: 7, pos: "RW", nat: "法国", name: "塔隆", rating: 73, height: 175, weight: 68, age: 23, cGP: 92, cG: 42, cA: 48, tGP: 88, tG: 28, tA: 24, value: "ⰵ14.2M", attributes: { spd: 91, sho: 74, pas: 70, dri: 80, def: 32, phy: 60, men: 68, sta: 82 } },
            { no: 9, pos: "ST", nat: "法国", name: "贝尔纳", rating: 76, height: 185, weight: 80, age: 26, cGP: 185, cG: 118, cA: 28, tGP: 160, tG: 105, tA: 18, value: "ⰵ18.5M", attributes: { spd: 82, sho: 84, pas: 65, dri: 74, def: 30, phy: 78, men: 76, sta: 80 } },
            { no: 12, pos: "GK", nat: "英格兰", name: "派克", rating: 69, height: 192, weight: 88, age: 24, cGP: 72, cG: 0, cA: 0, tGP: 45, tG: 0, tA: 0, value: "ⰵ4.2M", attributes: { div: 70, han: 68, kic: 65, ref: 72, spd: 55, pos_s: 68, men: 65, sta: 62 } },
            { no: 23, pos: "GK", nat: "美国", name: "芬奇", rating: 67, height: 188, weight: 85, age: 21, cGP: 28, cG: 0, cA: 0, tGP: 35, tG: 0, tA: 0, value: "ⰵ3.8M", attributes: { div: 68, han: 66, kic: 70, ref: 70, spd: 58, pos_s: 65, men: 62, sta: 65 } },
            { no: 15, pos: "CB", nat: "荷兰", name: "罗宾", rating: 69, height: 187, weight: 82, age: 25, cGP: 88, cG: 4, cA: 1, tGP: 55, tG: 2, tA: 0, value: "ⰵ4.5M", attributes: { spd: 72, sho: 38, pas: 55, dri: 52, def: 72, phy: 75, men: 68, sta: 70 } },
            { no: 13, pos: "LB", nat: "苏格兰", name: "斯考特", rating: 68, height: 178, weight: 72, age: 23, cGP: 65, cG: 1, cA: 12, tGP: 48, tG: 1, tA: 6, value: "ⰵ5.1M", attributes: { spd: 84, sho: 52, pas: 68, dri: 70, def: 65, phy: 62, men: 64, sta: 82 } },
            { no: 14, pos: "CB", nat: "德国", name: "特内尔", rating: 67, height: 189, weight: 86, age: 24, cGP: 60, cG: 3, cA: 0, tGP: 60, tG: 3, tA: 0, value: "ⰵ3.2M", attributes: { spd: 65, sho: 40, pas: 52, dri: 50, def: 70, phy: 76, men: 65, sta: 68 } },
            { no: 22, pos: "RB", nat: "阿根廷", name: "康多尔", rating: 68, height: 181, weight: 76, age: 25, cGP: 92, cG: 2, cA: 10, tGP: 42, tG: 1, tA: 5, value: "ⰵ4.1M", attributes: { spd: 80, sho: 58, pas: 65, dri: 68, def: 68, phy: 66, men: 64, sta: 78 } },
            { no: 16, pos: "CM", nat: "美国", name: "斯派洛", rating: 70, height: 179, weight: 73, age: 26, cGP: 125, cG: 10, cA: 32, tGP: 50, tG: 6, tA: 12, value: "ⰵ6.2M", attributes: { spd: 74, sho: 68, pas: 74, dri: 72, def: 62, phy: 65, men: 72, sta: 80 } },
            { no: 18, pos: "CAM", nat: "英格兰", name: "杰伊", rating: 69, height: 175, weight: 68, age: 22, cGP: 52, cG: 12, cA: 25, tGP: 65, tG: 15, tA: 28, value: "ⰵ7.6M", attributes: { spd: 82, sho: 70, pas: 72, dri: 76, def: 40, phy: 60, men: 65, sta: 75 } },
            { no: 21, pos: "LM", nat: "法国", name: "马丁", rating: 68, height: 174, weight: 69, age: 22, cGP: 48, cG: 6, cA: 18, tGP: 55, tG: 8, tA: 21, value: "ⰵ6.1M", attributes: { spd: 84, sho: 65, pas: 70, dri: 74, def: 42, phy: 58, men: 62, sta: 78 } },
            { no: 25, pos: "RM", nat: "威尔士", name: "柯基", rating: 67, height: 176, weight: 70, age: 23, cGP: 55, cG: 5, cA: 12, tGP: 48, tG: 5, tA: 12, value: "ⰵ4.8M", attributes: { spd: 82, sho: 64, pas: 68, dri: 72, def: 44, phy: 60, men: 60, sta: 74 } },
            { no: 20, pos: "CDM", nat: "西班牙", name: "奎利亚", rating: 66, height: 183, weight: 79, age: 24, cGP: 78, cG: 3, cA: 8, tGP: 45, tG: 1, tA: 2, value: "ⰵ3.5M", attributes: { spd: 70, sho: 58, pas: 65, dri: 62, def: 68, phy: 70, men: 68, sta: 85 } },
            { no: 26, pos: "CM", nat: "英格兰", name: "斯塔林", rating: 65, height: 178, weight: 73, age: 20, cGP: 22, cG: 1, cA: 4, tGP: 25, tG: 1, tA: 4, value: "ⰵ5.2M", attributes: { spd: 78, sho: 62, pas: 70, dri: 72, def: 55, phy: 62, men: 68, sta: 82 } },
            { no: 19, pos: "ST", nat: "澳大利亚", name: "奥斯普雷", rating: 71, height: 184, weight: 78, age: 24, cGP: 95, cG: 32, cA: 12, tGP: 45, tG: 21, tA: 4, value: "ⰵ8.8M", attributes: { spd: 80, sho: 76, pas: 60, dri: 68, def: 32, phy: 74, men: 70, sta: 75 } },
            { no: 28, pos: "LW", nat: "美国", name: "斯凯", rating: 68, height: 177, weight: 69, age: 22, cGP: 58, cG: 18, cA: 15, tGP: 74, tG: 22, tA: 18, value: "ⰵ6.2M", attributes: { spd: 85, sho: 70, pas: 64, dri: 75, def: 38, phy: 58, men: 64, sta: 78 } },
            { no: 27, pos: "RW", nat: "英格兰", name: "佩里", rating: 66, height: 174, weight: 68, age: 21, cGP: 38, cG: 8, cA: 11, tGP: 42, tG: 8, tA: 11, value: "ⰵ4.9M", attributes: { spd: 86, sho: 68, pas: 62, dri: 74, def: 35, phy: 55, men: 60, sta: 74 } }
        ]
    },

    // 9. 炎狼 (Fire Wolf)
    "炎狼": {
        color: "#f97316",
        style: "高位逼抢",
        stadium: "星际足球场",
        coach: { name: "但丁", gp: 412, w: 185, d: 82, l: 145, rate: "44.90%" },
        status: { best: "晴天 · 下午", worst: "阴天 · 深夜", injury: "0", tactic: "高位逼抢" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 2, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 5, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (3-5-2)",
                players: {
                    "GK": "弗莱尔", "LCB": "伊格内修斯", "CB": "萨拉曼德", "RCB": "伯内尔",
                    "LWB": "布雷斯", "RWB": "菲尼克斯",
                    "LDM": "恩博", "RDM": "派罗", "CAM": "赫利奥斯", "LST": "沃尔卡诺", "RST": "因弗诺"
                },
                coords: {
                    "GK": [5, 50], "LCB": [20, 28], "CB": [16, 50], "RCB": [20, 72],
                    "LWB": [45, 12], "RWB": [45, 88],
                    "LDM": [42, 35], "RDM": [42, 65], "CAM": [62, 50], "LST": [85, 38], "RST": [85, 62]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "辛德", "LB": "斯帕克", "LCB": "斯科奇", "RCB": "马格马", "RB": "弗林特",
                    "LDM": "格劳", "RDM": "希特", "LM": "费罗", "CAM": "雷", "RM": "金德尔", "ST": "托奇"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88],
                    "LDM": [45, 35], "RDM": [45, 65], "LM": [72, 15], "CAM": [65, 50], "RM": [72, 85], "ST": [85, 50]
                }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "法国", name: "弗莱尔", rating: 76, height: 190, weight: 86, age: 27, cGP: 238, cG: 0, cA: 2, tGP: 120, tG: 0, tA: 0, value: "ⰵ14.5M", attributes: { div: 78, han: 75, kic: 72, ref: 79, spd: 55, pos_s: 76, men: 80, sta: 72 } },
            { no: 4, pos: "CB", nat: "希腊", name: "萨拉曼德", rating: 80, height: 192, weight: 89, age: 28, cGP: 295, cG: 18, cA: 5, tGP: 180, tG: 8, tA: 1, value: "ⰵ26.5M", attributes: { spd: 72, sho: 48, pas: 65, dri: 60, def: 84, phy: 86, men: 85, sta: 82 } },
            { no: 5, pos: "CB", nat: "意大利", name: "伊格内修斯", rating: 74, height: 188, weight: 84, age: 26, cGP: 175, cG: 8, cA: 2, tGP: 110, tG: 4, tA: 1, value: "ⰵ12.8M", attributes: { spd: 70, sho: 42, pas: 60, dri: 58, def: 78, phy: 80, men: 74, sta: 78 } },
            { no: 6, pos: "CB", nat: "英格兰", name: "伯内尔", rating: 72, height: 186, weight: 82, age: 25, cGP: 142, cG: 4, cA: 1, tGP: 92, tG: 2, tA: 0, value: "ⰵ10.2M", attributes: { spd: 74, sho: 38, pas: 55, dri: 52, def: 75, phy: 78, men: 70, sta: 84 } },
            { no: 3, pos: "LWB", nat: "美国", name: "布雷斯", rating: 71, height: 178, weight: 72, age: 24, cGP: 115, cG: 3, cA: 25, tGP: 85, tG: 1, tA: 12, value: "ⰵ9.5M", attributes: { spd: 84, sho: 55, pas: 70, dri: 75, def: 68, phy: 62, men: 68, sta: 94 } },
            { no: 16, pos: "CDM", nat: "尼日利亚", name: "恩博", rating: 73, height: 182, weight: 78, age: 26, cGP: 165, cG: 8, cA: 18, tGP: 115, tG: 3, tA: 8, value: "ⰵ11.8M", attributes: { spd: 72, sho: 60, pas: 74, dri: 70, def: 76, phy: 75, men: 72, sta: 88 } },
            { no: 14, pos: "CDM", nat: "西班牙", name: "派罗", rating: 78, height: 184, weight: 79, age: 27, cGP: 198, cG: 15, cA: 32, tGP: 35, tG: 4, tA: 8, value: "ⰵ21.2M", attributes: { spd: 76, sho: 72, pas: 80, dri: 75, def: 81, phy: 82, men: 82, sta: 92 } },
            { no: 10, pos: "CAM", nat: "希腊", name: "赫利奥斯", rating: 75, height: 180, weight: 73, age: 25, cGP: 148, cG: 28, cA: 55, tGP: 112, tG: 14, tA: 31, value: "ⰵ15.8M", attributes: { spd: 78, sho: 74, pas: 82, dri: 79, def: 42, phy: 65, men: 76, sta: 80 } },
            { no: 2, pos: "RWB", nat: "美国", name: "菲尼克斯", rating: 74, height: 181, weight: 74, age: 25, cGP: 135, cG: 6, cA: 42, tGP: 95, tG: 2, tA: 14, value: "ⰵ12.4M", attributes: { spd: 88, sho: 62, pas: 76, dri: 80, def: 70, phy: 68, men: 72, sta: 91 } },
            { no: 9, pos: "ST", nat: "意大利", name: "沃尔卡诺", rating: 79, height: 185, weight: 81, age: 26, cGP: 185, cG: 118, cA: 28, tGP: 160, tG: 82, tA: 15, value: "ⰵ24.2M", attributes: { spd: 84, sho: 86, pas: 68, dri: 78, def: 32, phy: 80, men: 88, sta: 82 } },
            { no: 11, pos: "ST", nat: "意大利", name: "因弗诺", rating: 76, height: 184, weight: 80, age: 25, cGP: 152, cG: 72, cA: 15, tGP: 125, tG: 52, tA: 10, value: "ⰵ17.5M", attributes: { spd: 82, sho: 84, pas: 65, dri: 74, def: 30, phy: 78, men: 75, sta: 80 } },
            { no: 12, pos: "GK", nat: "挪威", name: "辛德", rating: 70, height: 191, weight: 87, age: 24, cGP: 88, cG: 0, cA: 0, tGP: 45, tG: 0, tA: 0, value: "ⰵ5.2M", attributes: { div: 72, han: 68, kic: 65, ref: 74, spd: 50, pos_s: 68, men: 65, sta: 62 } },
            { no: 23, pos: "GK", nat: "英格兰", name: "阿什", rating: 68, height: 188, weight: 85, age: 21, cGP: 38, cG: 0, cA: 0, tGP: 35, tG: 0, tA: 0, value: "ⰵ4.8M", attributes: { div: 70, han: 66, kic: 62, ref: 71, spd: 55, pos_s: 64, men: 60, sta: 65 } },
            { no: 15, pos: "CB", nat: "澳大利亚", name: "斯科奇", rating: 71, height: 187, weight: 83, age: 25, cGP: 112, cG: 5, cA: 1, tGP: 55, tG: 2, tA: 0, value: "ⰵ6.5M", attributes: { spd: 72, sho: 35, pas: 55, dri: 50, def: 74, phy: 76, men: 68, sta: 72 } },
            { no: 25, pos: "CB", nat: "冰岛", name: "马格马", rating: 69, height: 188, weight: 86, age: 24, cGP: 82, cG: 2, cA: 0, tGP: 60, tG: 1, tA: 0, value: "ⰵ4.1M", attributes: { spd: 68, sho: 32, pas: 50, dri: 48, def: 72, phy: 75, men: 65, sta: 68 } },
            { no: 13, pos: "CB", nat: "英格兰", name: "弗林特", rating: 69, height: 185, weight: 84, age: 23, cGP: 68, cG: 3, cA: 0, tGP: 88, tG: 3, tA: 0, value: "ⰵ4.4M", attributes: { spd: 70, sho: 35, pas: 52, dri: 45, def: 70, phy: 78, men: 62, sta: 70 } },
            { no: 22, pos: "LB", nat: "比利时", name: "斯帕克", rating: 67, height: 176, weight: 70, age: 22, cGP: 58, cG: 1, cA: 12, tGP: 80, tG: 1, tA: 12, value: "ⰵ3.8M", attributes: { spd: 85, sho: 48, pas: 65, dri: 68, def: 64, phy: 58, men: 62, sta: 88 } },
            { no: 8, pos: "CM", nat: "西班牙", name: "索尔", rating: 72, height: 179, weight: 73, age: 26, cGP: 145, cG: 15, cA: 42, tGP: 50, tG: 6, tA: 12, value: "ⰵ9.6M", attributes: { spd: 74, sho: 68, pas: 75, dri: 72, def: 60, phy: 65, men: 72, sta: 82 } },
            { no: 18, pos: "CAM", nat: "法国", name: "雷", rating: 69, height: 175, weight: 68, age: 23, cGP: 62, cG: 10, cA: 25, tGP: 65, tG: 8, tA: 21, value: "ⰵ7.2M", attributes: { spd: 82, sho: 70, pas: 72, dri: 75, def: 38, phy: 60, men: 65, sta: 76 } },
            { no: 17, pos: "RWB", nat: "德国", name: "金德尔", rating: 68, height: 180, weight: 75, age: 22, cGP: 52, cG: 1, cA: 15, tGP: 74, tG: 1, tA: 15, value: "ⰵ6.4M", attributes: { spd: 86, sho: 58, pas: 68, dri: 70, def: 65, phy: 62, men: 64, sta: 85 } },
            { no: 20, pos: "CDM", nat: "荷兰", name: "格劳", rating: 67, height: 183, weight: 78, age: 24, cGP: 75, cG: 2, cA: 8, tGP: 48, tG: 1, tA: 5, value: "ⰵ4.2M", attributes: { spd: 68, sho: 55, pas: 65, dri: 62, def: 70, phy: 72, men: 68, sta: 82 } },
            { no: 21, pos: "CDM", nat: "美国", name: "希特", rating: 74, height: 182, weight: 77, age: 25, cGP: 110, cG: 6, cA: 18, tGP: 60, tG: 2, tA: 4, value: "ⰵ11.5M", attributes: { spd: 72, sho: 62, pas: 76, dri: 70, def: 78, phy: 77, men: 74, sta: 85 } },
            { no: 24, pos: "LM", nat: "葡萄牙", name: "费罗", rating: 67, height: 177, weight: 71, age: 21, cGP: 45, cG: 4, cA: 8, tGP: 55, tG: 4, tA: 8, value: "ⰵ4.8M", attributes: { spd: 88, sho: 60, pas: 65, dri: 72, def: 40, phy: 58, men: 62, sta: 80 } },
            { no: 19, pos: "ST", nat: "巴西", name: "托奇", rating: 70, height: 183, weight: 79, age: 24, cGP: 95, cG: 38, cA: 12, tGP: 42, tG: 12, tA: 4, value: "ⰵ8.2M", attributes: { spd: 80, sho: 78, pas: 60, dri: 72, def: 32, phy: 75, men: 70, sta: 78 } },
            { no: 26, pos: "ST", nat: "印度", name: "辛格", rating: 68, height: 184, weight: 80, age: 23, cGP: 65, cG: 25, cA: 5, tGP: 40, tG: 8, tA: 2, value: "ⰵ6.8M", attributes: { spd: 78, sho: 76, pas: 58, dri: 68, def: 35, phy: 72, men: 68, sta: 74 } },
            { no: 28, pos: "CM", nat: "塞尔维亚", name: "萨维奇", rating: 65, height: 178, weight: 74, age: 20, cGP: 32, cG: 1, cA: 5, tGP: 25, tG: 1, tA: 4, value: "ⰵ5.5M", attributes: { spd: 80, sho: 62, pas: 72, dri: 74, def: 55, phy: 62, men: 72, sta: 82 } }
        ],
    },

    // 10. 金狮 (Golden Lion)
    "金狮": {
        color: "#f59e0b",
        style: "攻击性控球",
        stadium: "莱昂内尔足球场",
        coach: { name: "马绍尔", gp: 693, w: 444, d: 62, l: 187, rate: "64.07%" },
        status: { best: "阴天 · 傍晚", worst: "雨天 · 晚上", injury: "0", tactic: "攻击性控球" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 1, seasons: "S-83赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 1, seasons: "S-88赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 1, seasons: "10赛季", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 5, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 6, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 11, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (3-1-4-2)",
                players: {
                    "GK": "库尔图", "LCB": "瓦尔内", "CB": "德谟克利特", "RCB": "阿德里亚德",
                    "CDM": "赖斯利", "LM": "迪斯特法诺", "LCM": "托内利", "RCM": "凯文·布雷恩", "RM": "赫雷拉", "LST": "罗伯特·维克", "RST": "桑奇斯"
                },
                coords: {
                    "GK": [5, 50], "LCB": [22, 28], "CB": [18, 50], "RCB": [22, 72],
                    "CDM": [38, 50], "LM": [58, 12], "LCM": [55, 35], "RCM": [55, 65], "RM": [58, 88], "LST": [85, 38], "RST": [85, 62]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "迪达", "LB": "利桑德罗", "LCB": "卡莱斯", "RCB": "汉斯", "RB": "拉比奥特",
                    "LDM": "罗伯逊", "RDM": "石磊", "CAM": "威纳德", "LW": "阿诺舍瓦", "RW": "凯·布兰特", "ST": "巴尔加斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [28, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [28, 88],
                    "LDM": [48, 35], "RDM": [48, 65], "CAM": [68, 50], "LW": [82, 15], "RW": [82, 85], "ST": [85, 50]
                }
            }
        },
        roster: [
            { no: 9, pos: "ST", nat: "德国", name: "罗伯特·维克", rating: 92, height: 185, weight: 82, age: 25, cGP: 272, cG: 207, cA: 43, tGP: 0, tG: 0, tA: 0, value: "ⰵ195M", attributes: { spd: 95, sho: 97, pas: 78, dri: 92, def: 35, phy: 89, men: 92, sta: 87 } },
            { no: 11, pos: "ST", nat: "西班牙", name: "桑奇斯", rating: 90, height: 182, weight: 78, age: 29, cGP: 545, cG: 304, cA: 50, tGP: 0, tG: 0, tA: 0, value: "ⰵ115M", attributes: { spd: 85, sho: 93, pas: 74, dri: 88, def: 32, phy: 82, men: 96, sta: 82 } },
            { no: 19, pos: "ST", nat: "智利", name: "巴尔加斯", rating: 86, height: 184, weight: 81, age: 25, cGP: 245, cG: 110, cA: 19, tGP: 0, tG: 0, tA: 0, value: "ⰵ82M", attributes: { spd: 88, sho: 90, pas: 72, dri: 84, def: 30, phy: 86, men: 78, sta: 80 } },
            { no: 22, pos: "ST", nat: "荷兰", name: "法恩", rating: 85, height: 183, weight: 79, age: 24, cGP: 170, cG: 76, cA: 20, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 86, sho: 87, pas: 68, dri: 82, def: 28, phy: 78, men: 74, sta: 78 } },
            { no: 1, pos: "GK", nat: "比利时", name: "库尔图", rating: 89, height: 199, weight: 94, age: 26, cGP: 320, cG: 0, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { div: 89, han: 85, kic: 82, ref: 91, spd: 58, pos_s: 94, men: 95, sta: 84 } },
            { no: 10, pos: "CDM", nat: "英格兰", name: "赖斯利", rating: 89, height: 185, weight: 80, age: 24, cGP: 215, cG: 15, cA: 38, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 82, sho: 70, pas: 85, dri: 84, def: 92, phy: 91, men: 88, sta: 96 } },
            { no: 8, pos: "CM", nat: "意大利", name: "托内利", rating: 89, height: 181, weight: 76, age: 28, cGP: 505, cG: 60, cA: 177, tGP: 0, tG: 0, tA: 0, value: "ⰵ88M", attributes: { spd: 80, sho: 82, pas: 93, dri: 90, def: 72, phy: 76, men: 94, sta: 88 } },
            { no: 17, pos: "CM", nat: "比利时", name: "凯文·布雷恩", rating: 88, height: 182, weight: 75, age: 27, cGP: 410, cG: 44, cA: 133, tGP: 0, tG: 0, tA: 0, value: "ⰵ84M", attributes: { spd: 82, sho: 78, pas: 91, dri: 88, def: 68, phy: 74, men: 90, sta: 92 } },
            { no: 6, pos: "CM", nat: "法国", name: "阿德里亚德", rating: 87, height: 183, weight: 80, age: 26, cGP: 287, cG: 19, cA: 63, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 78, sho: 70, pas: 86, dri: 82, def: 88, phy: 90, men: 82, sta: 95 } },
            { no: 21, pos: "CM", nat: "中国", name: "石磊", rating: 84, height: 181, weight: 74, age: 24, cGP: 250, cG: 24, cA: 62, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 78, sho: 75, pas: 84, dri: 82, def: 65, phy: 72, men: 74, sta: 90 } },
            { no: 28, pos: "CDM", nat: "苏格兰", name: "罗伯逊", rating: 83, height: 180, weight: 71, age: 26, cGP: 185, cG: 6, cA: 50, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 84, sho: 65, pas: 82, dri: 80, def: 81, phy: 75, men: 78, sta: 92 } },
            { no: 7, pos: "LM", nat: "阿根廷", name: "迪斯特法诺", rating: 88, height: 178, weight: 74, age: 27, cGP: 405, cG: 104, cA: 171, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 93, sho: 82, pas: 89, dri: 92, def: 42, phy: 72, men: 86, sta: 92 } },
            { no: 17, pos: "RM", nat: "墨西哥", name: "赫雷拉", rating: 86, height: 176, weight: 70, age: 26, cGP: 325, cG: 66, cA: 66, tGP: 0, tG: 0, tA: 0, value: "ⰵ78M", attributes: { spd: 91, sho: 84, pas: 82, dri: 89, def: 38, phy: 68, men: 80, sta: 85 } },
            { no: 25, pos: "LW", nat: "俄罗斯", name: "阿诺舍瓦", rating: 84, height: 175, weight: 68, age: 23, cGP: 173, cG: 27, cA: 45, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 90, sho: 78, pas: 80, dri: 86, def: 35, phy: 65, men: 72, sta: 84 } },
            { no: 20, pos: "CAM", nat: "英格兰", name: "威纳德", rating: 84, height: 179, weight: 72, age: 25, cGP: 215, cG: 28, cA: 56, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { spd: 82, sho: 80, pas: 85, dri: 86, def: 48, phy: 70, men: 76, sta: 82 } },
            { no: 4, pos: "CB", nat: "希腊", name: "德谟克利特", rating: 87, height: 188, weight: 85, age: 28, cGP: 430, cG: 24, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 76, sho: 45, pas: 70, dri: 68, def: 91, phy: 89, men: 94, sta: 84 } },
            { no: 2, pos: "RB", nat: "法国", name: "拉比奥特", rating: 87, height: 184, weight: 80, age: 27, cGP: 392, cG: 17, cA: 53, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 88, sho: 60, pas: 84, dri: 82, def: 85, phy: 80, men: 82, sta: 95 } },
            { no: 3, pos: "LB", nat: "阿根廷", name: "利桑德罗", rating: 86, height: 175, weight: 72, age: 26, cGP: 290, cG: 13, cA: 63, tGP: 0, tG: 0, tA: 0, value: "ⰵ46M", attributes: { spd: 91, sho: 58, pas: 82, dri: 85, def: 83, phy: 74, men: 80, sta: 94 } },
            { no: 5, pos: "CB", nat: "法国", name: "瓦尔内", rating: 86, height: 187, weight: 82, age: 27, cGP: 333, cG: 18, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 82, sho: 42, pas: 68, dri: 70, def: 89, phy: 91, men: 88, sta: 80 } },
            { no: 15, pos: "CB", nat: "西班牙", name: "卡莱斯", rating: 84, height: 186, weight: 83, age: 25, cGP: 230, cG: 14, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 74, sho: 40, pas: 65, dri: 62, def: 86, phy: 88, men: 82, sta: 82 } },
            { no: 24, pos: "CB", nat: "奥地利", name: "汉斯", rating: 83, height: 189, weight: 86, age: 25, cGP: 190, cG: 8, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { spd: 70, sho: 38, pas: 60, dri: 58, def: 84, phy: 90, men: 78, sta: 76 } },
            { no: 13, pos: "LB", nat: "荷兰", name: "范恩", rating: 82, height: 177, weight: 70, age: 23, cGP: 190, cG: 8, cA: 36, tGP: 0, tG: 0, tA: 0, value: "ⰵ25M", attributes: { spd: 88, sho: 55, pas: 76, dri: 78, def: 74, phy: 68, men: 72, sta: 90 } },
            { no: 12, pos: "GK", nat: "巴西", name: "迪达", rating: 80, height: 191, weight: 88, age: 25, cGP: 140, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ15M", attributes: { div: 80, han: 78, kic: 75, ref: 82, spd: 55, pos_s: 78, men: 75, sta: 80 } },
            { no: 99, pos: "CM", nat: "德国", name: "凯·布兰特", rating: 78, height: 183, weight: 75, age: 18, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 82, sho: 70, pas: 88, dri: 84, def: 60, phy: 68, men: 72, sta: 85 } },
            { no: 81, pos: "CB", nat: "巴西", name: "卢卡斯·席尔瓦", rating: 77, height: 188, weight: 82, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ8M", attributes: { spd: 78, sho: 40, pas: 80, dri: 72, def: 79, phy: 82, men: 75, sta: 82 } },
            { no: 66, pos: "CDM", nat: "日本", name: "中村弘", rating: 76, height: 176, weight: 72, age: 18, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ7M", attributes: { spd: 84, sho: 60, pas: 75, dri: 72, def: 78, phy: 72, men: 78, sta: 95 } }
        ]
    },

    // 11. 科摩多尊龙 (Komodo Dragon)
    "科摩多尊龙": {
        color: "#166534",
        style: "核心终结",
        stadium: "埃斯图丁足球场",
        coach: { name: "但丁", gp: 412, w: 185, d: 82, l: 145, rate: "44.90%" },
        status: { best: "晴天 · 下午", worst: "阴天 · 深夜", injury: "0", tactic: "高位逼抢" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 3, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 5, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (5-3-2)",
                players: {
                    "GK": "贾布拉罕", "LB": "阿诺舍瓦", "LCB": "多尔瓦", "CB": "萨内", "RCB": "索萨", "RB": "莱尔斯",
                    "LCM": "费德里克", "CM": "布林德", "RCM": "莫尔德", "LST": "多拉贡", "RST": "王泽伦"
                },
                coords: {
                    "GK": [5, 50], "LB": [32, 10], "LCB": [20, 30], "CB": [16, 50], "RCB": [20, 70], "RB": [32, 90],
                    "LCM": [55, 28], "CM": [52, 50], "RCM": [55, 72], "LST": [85, 38], "RST": [85, 62]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-3-3)",
                players: {
                    "GK": "萨尔勒斯", "LB": "皮尔尼科", "LCB": "尼尔洛", "RCB": "泽凯勒", "RB": "埃尔维",
                    "LCM": "麦卡利", "CM": "拉摩拉", "RCM": "赫姆克", "LW": "奥兹尔", "ST": "勒文", "RW": "奥多耶"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88],
                    "LCM": [52, 28], "CM": [45, 50], "RCM": [52, 72], "LW": [82, 15], "ST": [88, 50], "RW": [82, 85]
                }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "阿联酋", name: "贾布拉罕", rating: 85, height: 192, weight: 88, age: 28, cGP: 312, cG: 0, cA: 2, tGP: 156, tG: 0, tA: 1, value: "ⰵ42M", attributes: { div: 86, han: 84, kic: 78, ref: 88, spd: 55, pos_s: 85, men: 82, sta: 78 } },
            { no: 3, pos: "LB", nat: "乌兹别克斯坦", name: "阿诺舍瓦", rating: 83, height: 178, weight: 73, age: 24, cGP: 145, cG: 8, cA: 42, tGP: 110, tG: 4, tA: 22, value: "ⰵ52M", attributes: { spd: 88, sho: 60, pas: 82, dri: 84, def: 78, phy: 72, men: 76, sta: 90 } },
            { no: 4, pos: "CB", nat: "塞尔维亚", name: "多尔瓦", rating: 80, height: 186, weight: 84, age: 25, cGP: 162, cG: 8, cA: 2, tGP: 90, tG: 3, tA: 1, value: "ⰵ28M", attributes: { spd: 74, sho: 40, pas: 65, dri: 58, def: 82, phy: 84, men: 78, sta: 82 } },
            { no: 5, pos: "CB", nat: "塞内加尔", name: "萨内", rating: 81, height: 189, weight: 82, age: 26, cGP: 185, cG: 12, cA: 2, tGP: 92, tG: 2, tA: 0, value: "ⰵ32M", attributes: { spd: 72, sho: 45, pas: 68, dri: 60, def: 84, phy: 86, men: 80, sta: 80 } },
            { no: 15, pos: "CB", nat: "巴西", name: "索萨", rating: 84, height: 188, weight: 85, age: 27, cGP: 235, cG: 15, cA: 3, tGP: 110, tG: 5, tA: 1, value: "ⰵ48M", attributes: { spd: 78, sho: 42, pas: 72, dri: 65, def: 88, phy: 88, men: 84, sta: 84 } },
            { no: 2, pos: "RB", nat: "美国", name: "莱尔斯", rating: 83, height: 181, weight: 75, age: 24, cGP: 138, cG: 5, cA: 32, tGP: 88, tG: 1, tA: 12, value: "ⰵ51M", attributes: { spd: 90, sho: 62, pas: 78, dri: 82, def: 76, phy: 70, men: 75, sta: 92 } },
            { no: 8, pos: "CM", nat: "荷兰", name: "布林德", rating: 84, height: 180, weight: 74, age: 26, cGP: 215, cG: 22, cA: 58, tGP: 112, tG: 5, tA: 28, value: "ⰵ45M", attributes: { spd: 78, sho: 74, pas: 88, dri: 84, def: 72, phy: 74, men: 82, sta: 85 } },
            { no: 10, pos: "CM", nat: "丹麦", name: "费德里克", rating: 83, height: 179, weight: 72, age: 25, cGP: 175, cG: 14, cA: 42, tGP: 92, tG: 12, tA: 31, value: "ⰵ44M", attributes: { spd: 80, sho: 78, pas: 85, dri: 86, def: 65, phy: 70, men: 78, sta: 84 } },
            { no: 21, pos: "CM", nat: "挪威", name: "莫尔德", rating: 83, height: 182, weight: 76, age: 24, cGP: 155, cG: 18, cA: 45, tGP: 85, tG: 4, tA: 15, value: "ⰵ46M", attributes: { spd: 76, sho: 72, pas: 86, dri: 85, def: 70, phy: 76, men: 75, sta: 88 } },
            { no: 9, pos: "ST", nat: "巴拉圭", name: "多拉贡", rating: 85, height: 184, weight: 80, age: 25, cGP: 210, cG: 168, cA: 25, tGP: 115, tG: 82, tA: 9, value: "ⰵ98M", attributes: { spd: 91, sho: 92, pas: 72, dri: 88, def: 35, phy: 86, men: 90, sta: 82 } },
            { no: 7, pos: "RM", nat: "中国", name: "王泽伦", rating: 82, height: 176, weight: 69, age: 23, cGP: 115, cG: 35, cA: 42, tGP: 120, tG: 32, tA: 28, value: "ⰵ48M", attributes: { spd: 92, sho: 82, pas: 78, dri: 89, def: 42, phy: 68, men: 74, sta: 85 } },
            { no: 12, pos: "GK", nat: "土耳其", name: "萨尔勒斯", rating: 82, height: 189, weight: 85, age: 23, cGP: 85, cG: 0, cA: 0, tGP: 35, tG: 0, tA: 0, value: "ⰵ35M", attributes: { div: 83, han: 80, kic: 75, ref: 86, spd: 58, pos_s: 79, men: 72, sta: 80 } },
            { no: 22, pos: "LB", nat: "克罗地亚", name: "皮尔尼科", rating: 82, height: 176, weight: 70, age: 22, cGP: 78, cG: 2, cA: 24, tGP: 85, tG: 2, tA: 18, value: "ⰵ42M", attributes: { spd: 91, sho: 62, pas: 76, dri: 85, def: 74, phy: 65, men: 70, sta: 92 } },
            { no: 13, pos: "CB", nat: "意大利", name: "尼尔洛", rating: 81, height: 187, weight: 84, age: 24, cGP: 105, cG: 4, cA: 1, tGP: 42, tG: 1, tA: 0, value: "ⰵ28M", attributes: { spd: 74, sho: 38, pas: 60, dri: 55, def: 83, phy: 85, men: 76, sta: 80 } },
            { no: 24, pos: "CB", nat: "匈牙利", name: "泽凯勒", rating: 79, height: 185, weight: 81, age: 22, cGP: 58, cG: 3, cA: 0, tGP: 65, tG: 3, tA: 0, value: "ⰵ22M", attributes: { spd: 70, sho: 35, pas: 58, dri: 52, def: 81, phy: 82, men: 72, sta: 78 } },
            { no: 14, pos: "RB", nat: "法国", name: "埃尔维", rating: 80, height: 180, weight: 74, age: 24, cGP: 115, cG: 8, cA: 18, tGP: 48, tG: 2, tA: 6, value: "ⰵ26M", attributes: { spd: 88, sho: 65, pas: 72, dri: 80, def: 75, phy: 70, men: 74, sta: 88 } },
            { no: 18, pos: "CM", nat: "苏格兰", name: "麦卡利", rating: 83, height: 178, weight: 73, age: 25, cGP: 155, cG: 15, cA: 35, tGP: 45, tG: 3, tA: 11, value: "ⰵ42M", attributes: { spd: 82, sho: 76, pas: 84, dri: 86, def: 62, phy: 68, men: 78, sta: 85 } },
            { no: 20, pos: "CM", nat: "西班牙", name: "拉摩拉", rating: 82, height: 177, weight: 71, age: 23, cGP: 92, cG: 12, cA: 31, tGP: 40, tG: 4, tA: 12, value: "ⰵ38M", attributes: { spd: 78, sho: 72, pas: 82, dri: 84, def: 65, phy: 70, men: 75, sta: 82 } },
            { no: 25, pos: "CM", nat: "德国", name: "赫姆克", rating: 80, height: 181, weight: 75, age: 22, cGP: 85, cG: 8, cA: 15, tGP: 85, tG: 8, tA: 15, value: "ⰵ25M", attributes: { spd: 80, sho: 74, pas: 78, dri: 80, def: 58, phy: 72, men: 70, sta: 84 } },
            { no: 17, pos: "LM", nat: "土耳其", name: "奥兹尔", rating: 80, height: 175, weight: 68, age: 21, cGP: 48, cG: 15, cA: 22, tGP: 45, tG: 15, tA: 22, value: "ⰵ45M", attributes: { spd: 91, sho: 76, pas: 80, dri: 88, def: 35, phy: 60, men: 72, sta: 85 } },
            { no: 11, pos: "ST", nat: "瑞典", name: "勒文", rating: 80, height: 183, weight: 78, age: 23, cGP: 95, cG: 52, cA: 11, tGP: 45, tG: 18, tA: 4, value: "ⰵ32M", attributes: { spd: 85, sho: 84, pas: 65, dri: 78, def: 28, phy: 74, men: 72, sta: 78 } },
            { no: 19, pos: "ST", nat: "英格兰", name: "奥多耶", rating: 79, height: 185, weight: 79, age: 21, cGP: 38, cG: 12, cA: 5, tGP: 35, tG: 12, tA: 4, value: "ⰵ28M", attributes: { spd: 88, sho: 80, pas: 62, dri: 82, def: 25, phy: 76, men: 70, sta: 82 } },
            { no: 23, pos: "GK", nat: "摩洛哥", name: "萨克雷", rating: 79, height: 191, weight: 88, age: 21, cGP: 32, cG: 0, cA: 0, tGP: 30, tG: 0, tA: 0, value: "ⰵ15M", attributes: { div: 80, han: 78, kic: 72, ref: 82, spd: 55, pos_s: 75, men: 74, sta: 76 } },
            { no: 16, pos: "LB", nat: "黑山", name: "莫维奇", rating: 80, height: 174, weight: 69, age: 22, cGP: 52, cG: 1, cA: 14, tGP: 55, tG: 1, tA: 12, value: "ⰵ21M", attributes: { spd: 84, sho: 58, pas: 74, dri: 78, def: 72, phy: 65, men: 68, sta: 85 } },
            { no: 26, pos: "RB", nat: "意大利", name: "特伦托", rating: 80, height: 179, weight: 72, age: 23, cGP: 88, cG: 4, cA: 18, tGP: 40, tG: 1, tA: 8, value: "ⰵ24M", attributes: { spd: 86, sho: 60, pas: 75, dri: 78, def: 74, phy: 70, men: 72, sta: 88 } },
            { no: 28, pos: "CDM", nat: "威尔士", name: "格里芬", rating: 79, height: 182, weight: 77, age: 20, cGP: 32, cG: 1, cA: 6, tGP: 25, tG: 1, tA: 4, value: "ⰵ32M", attributes: { spd: 78, sho: 65, pas: 75, dri: 72, def: 80, phy: 82, men: 74, sta: 92 } }
        ]
    },

    // 12. 拉普兰德 (Lapland)
    "拉普兰德": {
        color: "#22d3ee",
        style: "高强度反抢",
        stadium: "基尔科德足球场",
        coach: { name: "但丁", gp: 412, w: 185, d: 82, l: 145, rate: "44.90%" },
        status: { best: "阴天 · 下午", worst: "雨天 · 晚上", injury: "0", tactic: "高强度反抢" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 1, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 3, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-3)",
                players: {
                    "GK": "诺德", "LB": "埃里克森", "LCB": "伯格", "RCB": "约根森", "RB": "拉尔森",
                    "CDM": "赫斯特", "LCM": "斯文森", "RCM": "索伦森", "LW": "阿斯特里德", "RW": "芬恩", "ST": "尼尔森"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "CDM": [45, 50], "LCM": [58, 28], "RCM": [58, 72], "LW": [82, 15], "ST": [85, 50], "RW": [82, 85]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "汉森", "LB": "隆德", "LCB": "霍尔姆", "RCB": "达林", "RB": "瓦尔",
                    "LDM": "桑德", "RDM": "延森", "LM": "维克", "CAM": "彼得森", "RM": "埃克", "ST": "比约恩"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88],
                    "LDM": [45, 35], "RDM": [45, 65], "LM": [72, 15], "CAM": [65, 50], "RM": [72, 85], "ST": [85, 50]
                }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "挪威", name: "诺德", rating: 78, height: 191, weight: 86, age: 26, cGP: 185, cG: 0, cA: 2, tGP: 88, tG: 0, tA: 0, value: "ⰵ22.5M", attributes: { div: 80, han: 76, kic: 74, ref: 82, spd: 55, pos_s: 78, men: 82, sta: 75 } },
            { no: 3, pos: "LB", nat: "丹麦", name: "埃里克森", rating: 76, height: 178, weight: 74, age: 24, cGP: 142, cG: 4, cA: 28, tGP: 72, tG: 1, tA: 9, value: "ⰵ28.2M", attributes: { spd: 85, sho: 52, pas: 74, dri: 76, def: 72, phy: 68, men: 70, sta: 88 } },
            { no: 4, pos: "CB", nat: "丹麦", name: "约根森", rating: 81, height: 190, weight: 88, age: 27, cGP: 288, cG: 15, cA: 4, tGP: 110, tG: 5, tA: 1, value: "ⰵ38.5M", attributes: { spd: 74, sho: 42, pas: 65, dri: 60, def: 84, phy: 86, men: 82, sta: 80 } },
            { no: 5, pos: "CB", nat: "挪威", name: "伯格", rating: 79, height: 188, weight: 84, age: 25, cGP: 165, cG: 8, cA: 2, tGP: 85, tG: 3, tA: 0, value: "ⰵ32.8M", attributes: { spd: 70, sho: 40, pas: 62, dri: 58, def: 81, phy: 84, men: 78, sta: 82 } },
            { no: 2, pos: "RB", nat: "瑞典", name: "拉尔森", rating: 77, height: 181, weight: 77, age: 24, cGP: 135, cG: 3, cA: 25, tGP: 68, tG: 1, tA: 11, value: "ⰵ24.5M", attributes: { spd: 88, sho: 58, pas: 72, dri: 78, def: 74, phy: 70, men: 72, sta: 90 } },
            { no: 6, pos: "CDM", nat: "德国", name: "赫斯特", rating: 78, height: 183, weight: 80, age: 26, cGP: 192, cG: 8, cA: 32, tGP: 95, tG: 2, tA: 12, value: "ⰵ26.0M", attributes: { spd: 76, sho: 65, pas: 78, dri: 72, def: 80, phy: 82, men: 85, sta: 92 } },
            { no: 8, pos: "CM", nat: "瑞典", name: "斯文森", rating: 80, height: 180, weight: 76, age: 27, cGP: 245, cG: 18, cA: 55, tGP: 120, tG: 8, tA: 24, value: "ⰵ35.8M", attributes: { spd: 78, sho: 72, pas: 85, dri: 82, def: 70, phy: 75, men: 82, sta: 85 } },
            { no: 10, pos: "CAM", nat: "丹麦", name: "索伦森", rating: 82, height: 179, weight: 75, age: 25, cGP: 210, cG: 42, cA: 82, tGP: 110, tG: 18, tA: 31, value: "ⰵ52.5M", attributes: { spd: 80, sho: 78, pas: 86, dri: 85, def: 52, phy: 72, men: 80, sta: 82 } },
            { no: 11, pos: "LW", nat: "瑞典", name: "阿斯特里德", rating: 79, height: 176, weight: 71, age: 23, cGP: 118, cG: 45, cA: 32, tGP: 65, tG: 24, tA: 12, value: "ⰵ45.2M", attributes: { spd: 92, sho: 80, pas: 72, dri: 88, def: 35, phy: 64, men: 76, sta: 85 } },
            { no: 7, pos: "RW", nat: "芬兰", name: "芬恩", rating: 77, height: 175, weight: 70, age: 24, cGP: 125, cG: 18, cA: 42, tGP: 45, tG: 6, tA: 14, value: "ⰵ31.8M", attributes: { spd: 90, sho: 74, pas: 78, dri: 84, def: 42, phy: 68, men: 72, sta: 82 } },
            { no: 9, pos: "ST", nat: "丹麦", name: "尼尔森", rating: 84, height: 186, weight: 82, age: 26, cGP: 325, cG: 178, cA: 32, tGP: 156, tG: 82, tA: 15, value: "ⰵ68.5M", attributes: { spd: 84, sho: 90, pas: 68, dri: 80, def: 32, phy: 86, men: 88, sta: 84 } },
            { no: 12, pos: "GK", nat: "丹麦", name: "奥尔森", rating: 72, height: 189, weight: 85, age: 23, cGP: 82, cG: 0, cA: 0, tGP: 42, tG: 0, tA: 0, value: "ⰵ8.8M", attributes: { div: 74, han: 70, kic: 68, ref: 75, spd: 52, pos_s: 72, men: 70, sta: 68 } },
            { no: 23, pos: "GK", nat: "挪威", name: "汉森", rating: 70, height: 187, weight: 83, age: 21, cGP: 35, cG: 0, cA: 0, tGP: 20, tG: 0, tA: 0, value: "ⰵ12.2M", attributes: { div: 72, han: 68, kic: 65, ref: 78, spd: 60, pos_s: 68, men: 65, sta: 70 } },
            { no: 15, pos: "CB", nat: "瑞典", name: "达林", rating: 74, height: 188, weight: 84, age: 25, cGP: 112, cG: 5, cA: 1, tGP: 50, tG: 2, tA: 0, value: "ⰵ16.4M", attributes: { spd: 70, sho: 38, pas: 55, dri: 50, def: 78, phy: 82, men: 75, sta: 78 } },
            { no: 13, pos: "LB", nat: "挪威", name: "隆德", rating: 72, height: 177, weight: 73, age: 22, cGP: 68, cG: 2, cA: 15, tGP: 55, tG: 1, tA: 12, value: "ⰵ14.6M", attributes: { spd: 84, sho: 48, pas: 70, dri: 72, def: 68, phy: 64, men: 62, sta: 85 } },
            { no: 24, pos: "RB", nat: "瑞典", name: "瓦尔", rating: 71, height: 180, weight: 76, age: 23, cGP: 75, cG: 1, cA: 12, tGP: 48, tG: 1, tA: 9, value: "ⰵ13.4M", attributes: { spd: 86, sho: 50, pas: 68, dri: 74, def: 65, phy: 62, men: 64, sta: 88 } },
            { no: 14, pos: "CB", nat: "挪威", name: "霍尔姆", rating: 70, height: 192, weight: 89, age: 22, cGP: 52, cG: 3, cA: 0, tGP: 35, tG: 2, tA: 0, value: "ⰵ12.2M", attributes: { spd: 65, sho: 35, pas: 50, dri: 45, def: 74, phy: 78, men: 68, sta: 72 } },
            { no: 16, pos: "CM", nat: "丹麦", name: "延森", rating: 73, height: 181, weight: 76, age: 24, cGP: 110, cG: 10, cA: 21, tGP: 45, tG: 3, tA: 6, value: "ⰵ18.2M", attributes: { spd: 75, sho: 68, pas: 78, dri: 76, def: 65, phy: 72, men: 74, sta: 82 } },
            { no: 18, pos: "CAM", nat: "丹麦", name: "彼得森", rating: 72, height: 175, weight: 71, age: 23, cGP: 82, cG: 15, cA: 18, tGP: 62, tG: 12, tA: 11, value: "ⰵ15.8M", attributes: { spd: 78, sho: 70, pas: 74, dri: 78, def: 40, phy: 62, men: 68, sta: 75 } },
            { no: 22, pos: "LM", nat: "挪威", name: "维克", rating: 71, height: 174, weight: 70, age: 22, cGP: 65, cG: 8, cA: 15, tGP: 40, tG: 4, tA: 8, value: "ⰵ12.5M", attributes: { spd: 85, sho: 65, pas: 68, dri: 75, def: 38, phy: 60, men: 62, sta: 80 } },
            { no: 25, pos: "RM", nat: "瑞典", name: "埃克", rating: 70, height: 176, weight: 72, age: 23, cGP: 60, cG: 5, cA: 12, tGP: 45, tG: 4, tA: 8, value: "ⰵ11.4M", attributes: { spd: 82, sho: 62, pas: 70, dri: 72, def: 42, phy: 64, men: 60, sta: 78 } },
            { no: 20, pos: "CDM", nat: "丹麦", name: "桑德", rating: 69, height: 182, weight: 78, age: 20, cGP: 38, cG: 1, cA: 6, tGP: 25, tG: 1, tA: 4, value: "ⰵ18.0M", attributes: { spd: 74, sho: 58, pas: 72, dri: 68, def: 75, phy: 78, men: 72, sta: 90 } },
            { no: 26, pos: "CM", nat: "冰岛", name: "弗罗斯特", rating: 68, height: 178, weight: 74, age: 21, cGP: 45, cG: 2, cA: 8, tGP: 18, tG: 1, tA: 3, value: "ⰵ8.8M", attributes: { spd: 78, sho: 60, pas: 70, dri: 72, def: 55, phy: 62, men: 68, sta: 82 } },
            { no: 19, pos: "ST", nat: "瑞典", name: "比约恩", rating: 75, height: 184, weight: 81, age: 24, cGP: 138, cG: 52, cA: 15, tGP: 42, tG: 15, tA: 4, value: "ⰵ24.2M", attributes: { spd: 82, sho: 82, pas: 62, dri: 74, def: 28, phy: 76, men: 72, sta: 78 } },
            { no: 28, pos: "LW", nat: "挪威", name: "斯凯", rating: 73, height: 177, weight: 72, age: 22, cGP: 85, cG: 22, cA: 18, tGP: 74, tG: 18, tA: 14, value: "ⰵ21.1M", attributes: { spd: 88, sho: 76, pas: 68, dri: 82, def: 32, phy: 60, men: 65, sta: 80 } },
            { no: 27, pos: "RW", nat: "冰岛", name: "索尔", rating: 71, height: 174, weight: 70, age: 21, cGP: 62, cG: 12, cA: 15, tGP: 38, tG: 9, tA: 11, value: "ⰵ18.6M", attributes: { spd: 91, sho: 70, pas: 65, dri: 80, def: 30, phy: 58, men: 60, sta: 76 } }
        ]
    },

    // 13. 花豹 (Leopards)
    "花豹": {
        color: "#fde047",
        style: "高位逼抢",
        stadium: "克莱德足球场",
        coach: { name: "阿尔萨佩斯", gp: 188, w: 81, d: 31, l: 76, rate: "43.08%" },
        status: { best: "阴天 · 傍晚", worst: "晴天 · 早上", injury: "0", tactic: "高位逼抢" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 1, seasons: "S-70赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 4, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 7, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-3)",
                players: {
                    "GK": "马丁尼斯", "LB": "迈克尔", "LCB": "马科斯", "RCB": "孔帕内", "RB": "门德兹",
                    "LCM": "朴智胜", "CM": "阿尔格莱", "RCM": "库尔图", "LW": "布伦南", "ST": "哈里", "RW": "马内斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "LCM": [50, 28], "CM": [45, 50], "RCM": [50, 72], "LW": [82, 15], "ST": [85, 50], "RW": [82, 85]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-3-3)",
                players: {
                    "GK": "雷恩", "LB": "德勒阿莱", "LCB": "巴顿", "RCB": "桑德罗", "RB": "德雷诺",
                    "LCM": "维格霍德", "CDM": "切赫", "RCM": "德尚", "LW": "雷德尔", "ST": "萨穆埃尔", "RW": "格林菲德"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "LCM": [52, 28], "CDM": [45, 50], "RCM": [52, 72], "LW": [82, 15], "ST": [85, 50], "RW": [82, 85]
                }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "阿根廷", name: "马丁尼斯", rating: 82, height: 188, weight: 83, age: 26, cGP: 182, cG: 0, cA: 2, tGP: 145, tG: 0, tA: 1, value: "ⰵ38M", attributes: { div: 84, han: 80, kic: 78, ref: 86, spd: 60, pos_s: 82, men: 78, sta: 84 } },
            { no: 3, pos: "LB", nat: "英格兰", name: "迈克尔", rating: 80, height: 178, weight: 74, age: 24, cGP: 145, cG: 5, cA: 32, tGP: 110, tG: 4, tA: 15, value: "ⰵ32M", attributes: { spd: 88, sho: 60, pas: 78, dri: 82, def: 74, phy: 70, men: 72, sta: 92 } },
            { no: 4, pos: "CB", nat: "西班牙", name: "马科斯", rating: 82, height: 186, weight: 82, age: 25, cGP: 165, cG: 8, cA: 2, tGP: 90, tG: 3, tA: 1, value: "ⰵ35M", attributes: { spd: 74, sho: 40, pas: 65, dri: 58, def: 84, phy: 86, men: 82, sta: 82 } },
            { no: 5, pos: "CB", nat: "比利时", name: "孔帕内", rating: 84, height: 190, weight: 88, age: 27, cGP: 315, cG: 18, cA: 5, tGP: 120, tG: 5, tA: 1, value: "ⰵ48M", attributes: { spd: 72, sho: 45, pas: 70, dri: 65, def: 88, phy: 90, men: 94, sta: 80 } },
            { no: 2, pos: "RB", nat: "葡萄牙", name: "门德兹", rating: 81, height: 181, weight: 76, age: 24, cGP: 140, cG: 6, cA: 42, tGP: 88, tG: 2, tA: 18, value: "ⰵ36M", attributes: { spd: 91, sho: 58, pas: 76, dri: 80, def: 78, phy: 74, men: 76, sta: 94 } },
            { no: 8, pos: "CM", nat: "韩国", name: "朴智胜", rating: 82, height: 178, weight: 72, age: 26, cGP: 215, cG: 28, cA: 65, tGP: 112, tG: 5, tA: 28, value: "ⰵ42M", attributes: { spd: 85, sho: 74, pas: 84, dri: 82, def: 78, phy: 86, men: 95, sta: 98 } },
            { no: 10, pos: "CM", nat: "意大利", name: "阿尔格莱", rating: 82, height: 179, weight: 75, age: 25, cGP: 185, cG: 35, cA: 78, tGP: 92, tG: 12, tA: 31, value: "ⰵ40M", attributes: { spd: 80, sho: 78, pas: 86, dri: 85, def: 65, phy: 72, men: 82, sta: 88 } },
            { no: 16, pos: "CM", nat: "比利时", name: "库尔图", rating: 81, height: 180, weight: 76, age: 24, cGP: 162, cG: 18, cA: 42, tGP: 88, tG: 4, tA: 15, value: "ⰵ34M", attributes: { spd: 82, sho: 72, pas: 85, dri: 84, def: 68, phy: 74, men: 78, sta: 92 } },
            { no: 11, pos: "LW", nat: "威尔士", name: "布伦南", rating: 82, height: 175, weight: 69, age: 23, cGP: 135, cG: 48, cA: 42, tGP: 115, tG: 31, tA: 22, value: "ⰵ55M", attributes: { spd: 92, sho: 80, pas: 78, dri: 89, def: 40, phy: 68, men: 75, sta: 90 } },
            { no: 9, pos: "ST", nat: "英格兰", name: "哈里", rating: 87, height: 185, weight: 82, age: 25, cGP: 215, cG: 162, cA: 31, tGP: 115, tG: 82, tA: 9, value: "ⰵ115M", attributes: { spd: 91, sho: 95, pas: 82, dri: 90, def: 35, phy: 88, men: 92, sta: 86 } },
            { no: 7, pos: "RW", nat: "塞内加尔", name: "马内斯", rating: 85, height: 184, weight: 80, age: 25, cGP: 198, cG: 118, cA: 35, tGP: 85, tG: 48, tA: 12, value: "ⰵ88M", attributes: { spd: 94, sho: 88, pas: 80, dri: 92, def: 42, phy: 80, men: 85, sta: 91 } },
            { no: 12, pos: "GK", nat: "英格兰", name: "雷恩", rating: 81, height: 189, weight: 84, age: 23, cGP: 88, cG: 0, cA: 0, tGP: 85, tG: 0, tA: 0, value: "ⰵ28M", attributes: { div: 82, han: 78, kic: 74, ref: 85, spd: 58, pos_s: 80, men: 74, sta: 76 } },
            { no: 22, pos: "LB", nat: "英格兰", name: "德勒阿莱", rating: 79, height: 176, weight: 72, age: 22, cGP: 78, cG: 2, cA: 18, tGP: 75, tG: 2, tA: 18, value: "ⰵ22M", attributes: { spd: 86, sho: 58, pas: 74, dri: 78, def: 72, phy: 65, men: 68, sta: 88 } },
            { no: 15, pos: "CB", nat: "英格兰", name: "巴顿", rating: 80, height: 188, weight: 85, age: 25, cGP: 135, cG: 10, cA: 1, tGP: 82, tG: 4, tA: 0, value: "ⰵ24M", attributes: { spd: 72, sho: 42, pas: 62, dri: 55, def: 82, phy: 84, men: 76, sta: 80 } },
            { no: 25, pos: "CB", nat: "巴西", name: "桑德罗", rating: 79, height: 187, weight: 81, age: 24, cGP: 122, cG: 6, cA: 2, tGP: 115, tG: 5, tA: 2, value: "ⰵ21M", attributes: { spd: 75, sho: 38, pas: 58, dri: 52, def: 80, phy: 82, men: 72, sta: 78 } },
            { no: 13, pos: "RB", nat: "巴西", name: "德雷诺", rating: 79, height: 180, weight: 78, age: 23, cGP: 110, cG: 4, cA: 32, tGP: 48, tG: 1, tA: 12, value: "ⰵ20M", attributes: { spd: 88, sho: 55, pas: 72, dri: 80, def: 75, phy: 70, men: 74, sta: 90 } },
            { no: 20, pos: "CDM", nat: "捷克", name: "切赫", rating: 79, height: 191, weight: 86, age: 21, cGP: 52, cG: 1, cA: 5, tGP: 45, tG: 0, tA: 1, value: "ⰵ25M", attributes: { div: 80, han: 78, kic: 72, ref: 82, spd: 55, pos_s: 75, men: 82, sta: 78 } },
            { no: 18, pos: "CM", nat: "荷兰", name: "维格霍德", rating: 81, height: 182, weight: 80, age: 22, cGP: 92, cG: 15, cA: 28, tGP: 42, tG: 3, tA: 11, value: "ⰵ38M", attributes: { spd: 82, sho: 76, pas: 84, dri: 86, def: 62, phy: 68, men: 78, sta: 85 } },
            { no: 21, pos: "CM", nat: "法国", name: "德尚", rating: 78, height: 177, weight: 74, age: 24, cGP: 135, cG: 18, cA: 42, tGP: 50, tG: 6, tA: 15, value: "ⰵ18M", attributes: { spd: 78, sho: 72, pas: 82, dri: 84, def: 65, phy: 70, men: 75, sta: 82 } },
            { no: 28, pos: "LW", nat: "瑞士", name: "雷德尔", rating: 79, height: 174, weight: 70, age: 22, cGP: 95, cG: 22, cA: 18, tGP: 42, tG: 3, tA: 11, value: "ⰵ26M", attributes: { spd: 91, sho: 76, pas: 80, dri: 88, def: 35, phy: 60, men: 72, sta: 85 } },
            { no: 22, pos: "ST", nat: "喀麦隆", name: "萨穆埃尔", rating: 80, height: 186, weight: 83, age: 22, cGP: 110, cG: 52, cA: 12, tGP: 95, tG: 42, tA: 8, value: "ⰵ45M", attributes: { spd: 85, sho: 84, pas: 65, dri: 78, def: 28, phy: 74, men: 72, sta: 78 } },
            { no: 27, pos: "RW", nat: "苏格兰", name: "格林菲德", rating: 80, height: 172, weight: 69, age: 20, cGP: 38, cG: 14, cA: 12, tGP: 35, tG: 12, tA: 9, value: "ⰵ42M", attributes: { spd: 88, sho: 80, pas: 62, dri: 82, def: 25, phy: 76, men: 70, sta: 82 } },
            { no: 23, pos: "GK", nat: "波兰", name: "莱万夫", rating: 77, height: 191, weight: 88, age: 20, cGP: 28, cG: 0, cA: 0, tGP: 25, tG: 0, tA: 0, value: "ⰵ15M", attributes: { div: 78, han: 76, kic: 72, ref: 80, spd: 55, pos_s: 72, men: 70, sta: 72 } },
            { no: 14, pos: "CB", nat: "苏格兰", name: "柯林斯顿", rating: 77, height: 185, weight: 80, age: 22, cGP: 72, cG: 4, cA: 0, tGP: 65, tG: 3, tA: 0, value: "ⰵ12M", attributes: { spd: 70, sho: 35, pas: 55, dri: 50, def: 78, phy: 80, men: 68, sta: 75 } },
            { no: 26, pos: "CM", nat: "德国", name: "艾德勒", rating: 76, height: 175, weight: 73, age: 20, cGP: 25, cG: 2, cA: 6, tGP: 20, tG: 1, tA: 4, value: "ⰵ18M", attributes: { spd: 80, sho: 65, pas: 78, dri: 82, def: 55, phy: 62, men: 70, sta: 80 } },
            { no: 24, pos: "LM", nat: "意大利", name: "法诺", rating: 78, height: 174, weight: 68, age: 21, cGP: 48, cG: 12, cA: 18, tGP: 40, tG: 8, tA: 15, value: "ⰵ22M", attributes: { spd: 90, sho: 74, pas: 76, dri: 85, def: 32, phy: 58, men: 65, sta: 82 } },
            { no: 19, pos: "ST", nat: "美国", name: "亚历山大", rating: 79, height: 183, weight: 78, age: 23, cGP: 125, cG: 62, cA: 15, tGP: 45, tG: 18, tA: 4, value: "ⰵ26M", attributes: { spd: 82, sho: 81, pas: 60, dri: 72, def: 25, phy: 72, men: 68, sta: 76 } }
        ]
    },

    // 14. 罗联 (Los United)
    "罗联": {
        color: "#0e8fe6",
        style: "极致攻击性控球",
        stadium: "罗伯森足球场",
        coach: { name: "基尔特斯", gp: 291, w: 185, d: 27, l: 79, rate: "63.57%" },
        status: { best: "阴天 · 晚上", worst: "晴天 · 早上", injury: "0", tactic: "极致攻击性控球" },
        honors: [
            { name: "世联赛冠军", count: 1, seasons: "17赛季", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 5, seasons: "S-86赛季、S-95赛季、S-99赛季、04赛季、11赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 4, seasons: "S-74赛季、S-78赛季、12赛季、14赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 2, seasons: "15赛季、17赛季", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 3, seasons: "04赛季、05赛季、11赛季", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 5, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 6, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 13, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-3)",
                players: { "GK": "法拉第", "LB": "罗梅罗", "LCB": "约什·瓦迪", "RCB": "艾特维尔德", "RB": "达伦特", "CDM": "维蒂尼亚", "LCM": "弗洛里安·维尔", "RCM": "艾迪森", "LW": "拉法·维尼", "ST": "巴洛蒂", "RW": "桑德乔" },
                coords: { "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88], "CDM": [45, 50], "LCM": [58, 28], "RCM": [58, 72], "LW": [82, 15], "ST": [85, 50], "RW": [82, 85] }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: { "GK": "索莫斯", "LB": "罗德里格夫斯", "LCB": "范德贝克", "RCB": "法蒂", "RB": "蒂亚戈", "LDM": "科密奇", "RDM": "德保路", "CAM": "麦迪森", "LW": "罗德里奇", "RW": "艾力夫曼", "ST": "杰雷特" },
                coords: { "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88], "LDM": [45, 35], "RDM": [45, 65], "CAM": [62, 50], "LW": [82, 15], "ST": [85, 50], "RW": [82, 85] }
            }
        },
        roster: [
            { no: 7, pos: "RW", nat: "英格兰", name: "桑德乔", rating: 93, height: 180, weight: 75, age: 27, cGP: 481, cG: 184, cA: 223, tGP: 0, tG: 0, tA: 0, value: "ⰵ195M", attributes: { spd: 90, sho: 87, pas: 95, dri: 97, def: 38, phy: 73, men: 92, sta: 85 } },
            { no: 9, pos: "ST", nat: "意大利", name: "巴洛蒂", rating: 91, height: 186, weight: 81, age: 26, cGP: 358, cG: 273, cA: 37, tGP: 0, tG: 0, tA: 0, value: "ⰵ165M", attributes: { spd: 92, sho: 95, pas: 72, dri: 89, def: 30, phy: 87, men: 83, sta: 85 } },
            { no: 22, pos: "LW", nat: "巴西", name: "拉法·维尼", rating: 92, height: 176, weight: 73, age: 25, cGP: 320, cG: 145, cA: 88, tGP: 0, tG: 0, tA: 0, value: "ⰵ200M", attributes: { spd: 98, sho: 88, pas: 82, dri: 96, def: 35, phy: 76, men: 85, sta: 92 } },
            { no: 10, pos: "CM", nat: "德国", name: "弗洛里安·维尔", rating: 90, height: 177, weight: 71, age: 23, cGP: 215, cG: 62, cA: 115, tGP: 0, tG: 0, tA: 0, value: "ⰵ125M", attributes: { spd: 85, sho: 86, pas: 94, dri: 95, def: 55, phy: 72, men: 88, sta: 86 } },
            { no: 27, pos: "CB", nat: "克罗地亚", name: "约什·瓦迪", rating: 91, height: 186, weight: 82, age: 24, cGP: 245, cG: 12, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ145M", attributes: { spd: 88, sho: 55, pas: 84, dri: 80, def: 92, phy: 90, men: 91, sta: 88 } },
            { no: 11, pos: "LW", nat: "克罗地亚", name: "罗德里奇", rating: 90, height: 177, weight: 70, age: 25, cGP: 287, cG: 123, cA: 77, tGP: 0, tG: 0, tA: 0, value: "ⰵ130M", attributes: { spd: 96, sho: 85, pas: 80, dri: 93, def: 35, phy: 71, men: 89, sta: 87 } },
            { no: 17, pos: "RW", nat: "德国", name: "艾力夫曼", rating: 88, height: 178, weight: 73, age: 25, cGP: 227, cG: 60, cA: 47, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 93, sho: 82, pas: 84, dri: 89, def: 42, phy: 75, men: 76, sta: 82 } },
            { no: 25, pos: "LW", nat: "英格兰", name: "比萨卡", rating: 87, height: 176, weight: 71, age: 28, cGP: 353, cG: 76, cA: 80, tGP: 0, tG: 0, tA: 0, value: "ⰵ65M", attributes: { spd: 90, sho: 80, pas: 78, dri: 91, def: 48, phy: 74, men: 80, sta: 85 } },
            { no: 19, pos: "ST", nat: "美国", name: "杰雷特", rating: 87, height: 185, weight: 80, age: 27, cGP: 282, cG: 149, cA: 30, tGP: 0, tG: 0, tA: 0, value: "ⰵ72M", attributes: { spd: 84, sho: 89, pas: 70, dri: 82, def: 30, phy: 84, men: 82, sta: 80 } },
            { no: 6, pos: "CDM", nat: "葡萄牙", name: "维蒂尼亚", rating: 91, height: 178, weight: 72, age: 25, cGP: 313, cG: 34, cA: 83, tGP: 0, tG: 0, tA: 0, value: "ⰵ172M", attributes: { spd: 83, sho: 77, pas: 95, dri: 92, def: 86, phy: 83, men: 89, sta: 95 } },
            { no: 8, pos: "CM", nat: "巴西", name: "艾迪森", rating: 91, height: 181, weight: 76, age: 29, cGP: 455, cG: 66, cA: 154, tGP: 0, tG: 0, tA: 0, value: "ⰵ105M", attributes: { spd: 78, sho: 82, pas: 91, dri: 88, def: 74, phy: 76, men: 92, sta: 84 } },
            { no: 18, pos: "CM", nat: "阿根廷", name: "帕耶罗", rating: 89, height: 182, weight: 75, age: 30, cGP: 464, cG: 70, cA: 126, tGP: 0, tG: 0, tA: 0, value: "ⰵ90M", attributes: { spd: 79, sho: 80, pas: 88, dri: 86, def: 70, phy: 74, men: 85, sta: 86 } },
            { no: 16, pos: "CDM", nat: "德国", name: "科密奇", rating: 89, height: 177, weight: 73, age: 33, cGP: 590, cG: 49, cA: 150, tGP: 0, tG: 0, tA: 0, value: "ⰵ40M", attributes: { spd: 73, sho: 72, pas: 92, dri: 85, def: 88, phy: 81, men: 96, sta: 78 } },
            { no: 20, pos: "CM", nat: "英格兰", name: "麦迪森", rating: 88, height: 175, weight: 70, age: 28, cGP: 345, cG: 80, cA: 132, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 84, sho: 86, pas: 91, dri: 92, def: 55, phy: 68, men: 85, sta: 81 } },
            { no: 21, pos: "CDM", nat: "阿根廷", name: "德保路", rating: 88, height: 180, weight: 75, age: 31, cGP: 500, cG: 41, cA: 63, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 77, sho: 70, pas: 82, dri: 80, def: 84, phy: 88, men: 91, sta: 91 } },
            { no: 28, pos: "CM", nat: "英格兰", name: "哈里", rating: 87, height: 181, weight: 76, age: 22, cGP: 154, cG: 22, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ102M", attributes: { spd: 87, sho: 81, pas: 86, dri: 89, def: 60, phy: 75, men: 83, sta: 90 } },
            { no: 1, pos: "GK", nat: "英格兰", name: "法拉第", rating: 93, height: 189, weight: 85, age: 31, cGP: 568, cG: 0, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ72M", attributes: { div: 94, han: 90, kic: 86, ref: 95, spd: 55, pos_s: 93, men: 96, sta: 80 } },
            { no: 4, pos: "CB", nat: "比利时", name: "艾特维尔德", rating: 89, height: 190, weight: 89, age: 33, cGP: 675, cG: 39, cA: 7, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 77, sho: 50, pas: 75, dri: 68, def: 92, phy: 91, men: 96, sta: 80 } },
            { no: 5, pos: "CB", nat: "西班牙", name: "蒂亚戈", rating: 89, height: 188, weight: 84, age: 31, cGP: 502, cG: 34, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 81, sho: 45, pas: 70, dri: 65, def: 90, phy: 88, men: 95, sta: 82 } },
            { no: 3, pos: "LB", nat: "阿根廷", name: "罗梅罗", rating: 88, height: 181, weight: 77, age: 28, cGP: 325, cG: 16, cA: 69, tGP: 0, tG: 0, tA: 0, value: "ⰵ70M", attributes: { spd: 91, sho: 62, pas: 84, dri: 86, def: 83, phy: 80, men: 85, sta: 92 } },
            { no: 2, pos: "RB", nat: "荷兰", name: "达伦特", rating: 87, height: 179, weight: 74, age: 28, cGP: 327, cG: 10, cA: 60, tGP: 0, tG: 0, tA: 0, value: "ⰵ65M", attributes: { spd: 92, sho: 65, pas: 82, dri: 84, def: 81, phy: 78, men: 78, sta: 91 } },
            { no: 13, pos: "LB", nat: "葡萄牙", name: "罗德里格夫斯", rating: 88, height: 178, weight: 72, age: 21, cGP: 225, cG: 8, cA: 59, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 95, sho: 55, pas: 81, dri: 83, def: 85, phy: 73, men: 75, sta: 96 } },
            { no: 15, pos: "CB", nat: "西班牙", name: "法蒂", rating: 88, height: 185, weight: 78, age: 20, cGP: 193, cG: 12, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ112M", attributes: { spd: 87, sho: 48, pas: 73, dri: 75, def: 89, phy: 92, men: 81, sta: 89 } },
            { no: 24, pos: "CB", nat: "荷兰", name: "范德贝克", rating: 88, height: 184, weight: 79, age: 20, cGP: 122, cG: 9, cA: 17, tGP: 0, tG: 0, tA: 0, value: "ⰵ120M", attributes: { spd: 85, sho: 52, pas: 69, dri: 71, def: 90, phy: 94, men: 83, sta: 91 } },
            { no: 12, pos: "GK", nat: "瑞士", name: "索莫斯", rating: 89, height: 188, weight: 83, age: 26, cGP: 260, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { div: 89, han: 85, kic: 82, ref: 92, spd: 62, pos_s: 87, men: 81, sta: 85 } },
            { no: 23, pos: "GK", nat: "葡萄牙", name: "帕特里西塞", rating: 87, height: 190, weight: 86, age: 19, cGP: 83, cG: 0, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { div: 90, han: 83, kic: 80, ref: 94, spd: 65, pos_s: 85, men: 79, sta: 85 } }
        ]
    },

    // 15. 猛虎 (Mighty Tiger)
    "猛虎": {
        color: "#fb923c",
        style: "对抗至上",
        stadium: "斯特拉足球场",
        coach: { name: "蒂洛尼克", gp: 678, w: 401, d: 74, l: 203, rate: "59.14%" },
        status: { best: "晴天 · 早上", worst: "雨天 · 傍晚", injury: "0", tactic: "对抗至上" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 6, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 5, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 10, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-1-2)",
                players: {
                    "GK": "麦尼耶", "LB": "加图索", "LCB": "威廉·萨利", "RCB": "诺瓦辛格", "RB": "杰里米·弗林",
                    "LCM": "费德里科·巴尔", "CM": "佩里西吉", "RCM": "哈里",
                    "CAM": "沃特劳斯", "LST": "鲁尼尔", "RST": "维克多·奥斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LCM": [45, 25], "CM": [42, 50], "RCM": [45, 75], "CAM": [65, 50], "LST": [85, 35], "RST": [85, 65]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "福斯特森", "LB": "里哈多", "LCB": "圣马西斯", "RCB": "纳赛尔", "RB": "儒日内奥",
                    "LDM": "迪福", "RDM": "派特", "LM": "罗马迪尼奥", "CAM": "维尔兹", "RM": "施密特", "ST": "伍迪"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88],
                    "LDM": [45, 35], "RDM": [45, 65], "LM": [65, 20], "CAM": [62, 50], "RM": [65, 80], "ST": [85, 50]
                }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "法国", name: "麦尼耶", rating: 89, height: 191, weight: 87, age: 28, cGP: 448, cG: 0, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ105M", attributes: { div: 90, han: 88, kic: 84, ref: 91, spd: 55, pos_s: 92, men: 89, sta: 80 } },
            { no: 99, pos: "ST", nat: "尼日利亚", name: "维克多·奥斯", rating: 89, height: 186, weight: 80, age: 26, cGP: 280, cG: 145, cA: 22, tGP: 0, tG: 0, tA: 0, value: "ⰵ115M", attributes: { spd: 93, sho: 88, pas: 72, dri: 84, def: 42, phy: 94, men: 85, sta: 88 } },
            { no: 10, pos: "CAM", nat: "英格兰", name: "沃特劳斯", rating: 88, height: 178, weight: 73, age: 29, cGP: 577, cG: 92, cA: 190, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 80, sho: 84, pas: 92, dri: 89, def: 45, phy: 72, men: 91, sta: 84 } },
            { no: 9, pos: "ST", nat: "英格兰", name: "鲁尼尔", rating: 86, height: 184, weight: 82, age: 27, cGP: 383, cG: 264, cA: 34, tGP: 0, tG: 0, tA: 0, value: "ⰵ88M", attributes: { spd: 86, sho: 91, pas: 70, dri: 84, def: 35, phy: 88, men: 93, sta: 82 } },
            { no: 4, pos: "CB", nat: "法国", name: "威廉·萨利", rating: 90, height: 192, weight: 89, age: 24, cGP: 210, cG: 8, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ115M", attributes: { spd: 88, sho: 40, pas: 75, dri: 72, def: 93, phy: 89, men: 88, sta: 85 } },
            { no: 8, pos: "CM", nat: "乌拉圭", name: "费德里科·巴尔", rating: 91, height: 182, weight: 78, age: 27, cGP: 315, cG: 45, cA: 62, tGP: 0, tG: 0, tA: 0, value: "ⰵ125M", attributes: { spd: 92, sho: 86, pas: 85, dri: 88, def: 82, phy: 88, men: 90, sta: 99 } },
            { no: 30, pos: "RB", nat: "荷兰", name: "杰里米·弗林", rating: 90, height: 171, weight: 65, age: 24, cGP: 185, cG: 15, cA: 52, tGP: 0, tG: 0, tA: 0, value: "ⰵ110M", attributes: { spd: 98, sho: 68, pas: 85, dri: 94, def: 81, phy: 72, men: 82, sta: 91 } },
            { no: 2, pos: "RB", nat: "意大利", name: "儒日内奥", rating: 87, height: 181, weight: 75, age: 26, cGP: 317, cG: 11, cA: 60, tGP: 0, tG: 0, tA: 0, value: "ⰵ98M", attributes: { spd: 92, sho: 65, pas: 87, dri: 88, def: 83, phy: 78, men: 86, sta: 94 } },
            { no: 3, pos: "LB", nat: "意大利", name: "加图索", rating: 87, height: 177, weight: 78, age: 27, cGP: 345, cG: 19, cA: 56, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 88, sho: 72, pas: 84, dri: 82, def: 86, phy: 91, men: 96, sta: 92 } },
            { no: 5, pos: "CB", nat: "印度", name: "诺瓦辛格", rating: 85, height: 186, weight: 82, age: 26, cGP: 264, cG: 12, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ82M", attributes: { spd: 80, sho: 42, pas: 68, dri: 70, def: 87, phy: 90, men: 84, sta: 82 } },
            { no: 6, pos: "CM", nat: "克罗地亚", name: "佩里西吉", rating: 85, height: 182, weight: 77, age: 27, cGP: 343, cG: 37, cA: 89, tGP: 0, tG: 0, tA: 0, value: "ⰵ78M", attributes: { spd: 84, sho: 82, pas: 82, dri: 86, def: 74, phy: 80, men: 84, sta: 90 } },
            { no: 28, pos: "CM", nat: "英格兰", name: "哈里", rating: 87, height: 181, weight: 76, age: 22, cGP: 154, cG: 22, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 86, sho: 81, pas: 86, dri: 89, def: 60, phy: 75, men: 82, sta: 89 } },
            { no: 17, pos: "CAM", nat: "英格兰", name: "伍迪", rating: 85, height: 175, weight: 70, age: 24, cGP: 173, cG: 40, cA: 67, tGP: 0, tG: 0, tA: 0, value: "ⰵ72M", attributes: { spd: 87, sho: 83, pas: 86, dri: 89, def: 40, phy: 68, men: 77, sta: 82 } },
            { no: 11, pos: "CAM", nat: "德国", name: "维尔兹", rating: 85, height: 182, weight: 75, age: 24, cGP: 150, cG: 77, cA: 22, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 82, sho: 87, pas: 86, dri: 92, def: 42, phy: 73, men: 89, sta: 85 } },
            { no: 12, pos: "GK", nat: "英格兰", name: "福斯特森", rating: 85, height: 190, weight: 89, age: 25, cGP: 143, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ78M", attributes: { div: 86, han: 82, kic: 80, ref: 88, spd: 58, pos_s: 84, men: 80, sta: 82 } },
            { no: 13, pos: "LB", nat: "葡萄牙", name: "里哈多", rating: 84, height: 181, weight: 75, age: 23, cGP: 177, cG: 5, cA: 36, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { spd: 91, sho: 58, pas: 78, dri: 84, def: 78, phy: 72, men: 74, sta: 90 } },
            { no: 15, pos: "CB", nat: "法国", name: "圣马西斯", rating: 85, height: 189, weight: 82, age: 26, cGP: 243, cG: 18, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ74M", attributes: { spd: 76, sho: 40, pas: 72, dri: 65, def: 90, phy: 88, men: 82, sta: 80 } },
            { no: 24, pos: "CB", nat: "摩洛哥", name: "纳赛尔", rating: 85, height: 187, weight: 83, age: 25, cGP: 240, cG: 11, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 75, sho: 38, pas: 68, dri: 62, def: 87, phy: 89, men: 79, sta: 82 } },
            { no: 22, pos: "RB", nat: "意大利", name: "罗马尼欧", rating: 84, height: 180, weight: 77, age: 24, cGP: 166, cG: 6, cA: 44, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { spd: 90, sho: 55, pas: 82, dri: 85, def: 81, phy: 75, men: 78, sta: 92 } },
            { no: 16, pos: "CDM", nat: "英格兰", name: "迪福", rating: 81, height: 178, weight: 72, age: 22, cGP: 103, cG: 5, cA: 20, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { spd: 84, sho: 65, pas: 78, dri: 80, def: 78, phy: 76, men: 72, sta: 88 } },
            { no: 26, pos: "CDM", nat: "德国", name: "贾马鲁斯", rating: 80, height: 183, weight: 78, age: 21, cGP: 67, cG: 2, cA: 10, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 78, sho: 62, pas: 74, dri: 72, def: 80, phy: 82, men: 74, sta: 85 } },
            { no: 7, pos: "LM", nat: "巴西", name: "罗马迪尼奥", rating: 85, height: 176, weight: 73, age: 25, cGP: 203, cG: 60, cA: 80, tGP: 0, tG: 0, tA: 0, value: "ⰵ70M", attributes: { spd: 88, sho: 81, pas: 82, dri: 92, def: 42, phy: 68, men: 82, sta: 80 } },
            { no: 20, pos: "CAM", nat: "荷兰", name: "德佩林", rating: 83, height: 179, weight: 76, age: 23, cGP: 137, cG: 26, cA: 46, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 80, sho: 76, pas: 85, dri: 86, def: 48, phy: 70, men: 74, sta: 78 } },
            { no: 25, pos: "RM", nat: "德国", name: "施密特", rating: 81, height: 174, weight: 68, age: 22, cGP: 98, cG: 20, cA: 33, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 91, sho: 74, pas: 76, dri: 88, def: 35, phy: 60, men: 70, sta: 84 } },
            { no: 23, pos: "GK", nat: "尼日利亚", name: "恩迪斯", rating: 83, height: 188, weight: 85, age: 23, cGP: 117, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { div: 84, han: 80, kic: 78, ref: 85, spd: 58, pos_s: 82, men: 75, sta: 80 } },
            { no: 21, pos: "CB", nat: "英格兰", name: "卡里克", rating: 83, height: 185, weight: 80, age: 24, cGP: 155, cG: 10, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 72, sho: 45, pas: 74, dri: 68, def: 84, phy: 80, men: 85, sta: 75 } },
            { no: 27, pos: "CDM", nat: "英格兰", name: "派特", rating: 76, height: 185, weight: 78, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ15M", attributes: { spd: 75, sho: 60, pas: 80, dri: 72, def: 78, phy: 82, men: 75, sta: 88 } }
        ]
    },

    // 16. 普雷斯顿 (Preston)
    "普雷斯顿": {
        color: "#ffffff",
        style: "压缩空间",
        stadium: "格里芬足球场",
        coach: { name: "穆德利", gp: 115, w: 52, d: 24, l: 39, rate: "45.22%" },
        status: { best: "雨天 · 晚上", worst: "晴天 · 中午", injury: "0", tactic: "压缩空间" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 4, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 7, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-3)",
                players: { "GK": "萨坦", "LB": "维克托", "LCB": "罗宾", "RCB": "奥巴内", "RB": "道森", "LCM": "恩佐", "CM": "莱姆", "RCM": "夏奇拉", "LW": "埃兰加", "ST": "胡里奥", "RW": "孙兴浩" },
                coords: { "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88], "LCM": [50, 28], "CM": [45, 50], "RCM": [50, 72], "LW": [82, 15], "ST": [85, 50], "RW": [82, 85] }
            },
            CUP: {
                title: "杯赛阵容 (5-4-1)",
                players: { "GK": "麦诺", "LB": "雷吉洛克", "LCB": "加斯", "CB": "克洛格", "RCB": "法拉格", "RB": "劳塔纳", "LM": "韦洛克", "LCM": "米利克", "RCM": "安道尔", "RM": "杰克罗斯", "ST": "维扎" },
                coords: { "GK": [5, 50], "LB": [25, 12], "LCB": [20, 31], "CB": [18, 50], "RCB": [20, 69], "RB": [25, 88], "LM": [52, 15], "LCM": [45, 38], "RCM": [45, 62], "RM": [52, 85], "ST": [85, 50] }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "巴西", name: "萨坦", rating: 80, height: 189, weight: 85, age: 29, cGP: 445, cG: 0, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { div: 82, han: 78, kic: 74, ref: 81, spd: 55, pos_s: 83, men: 82, sta: 75 } },
            { no: 9, pos: "ST", nat: "西班牙", name: "胡里奥", rating: 83, height: 184, weight: 81, age: 27, cGP: 370, cG: 261, cA: 42, tGP: 0, tG: 0, tA: 0, value: "ⰵ88M", attributes: { spd: 89, sho: 92, pas: 70, dri: 85, def: 30, phy: 87, men: 86, sta: 82 } },
            { no: 8, pos: "CM", nat: "阿根廷", name: "恩佐", rating: 82, height: 180, weight: 77, age: 25, cGP: 222, cG: 27, cA: 69, tGP: 0, tG: 0, tA: 0, value: "ⰵ78M", attributes: { spd: 82, sho: 74, pas: 90, dri: 85, def: 72, phy: 73, men: 84, sta: 91 } },
            { no: 7, pos: "RW", nat: "韩国", name: "孙兴浩", rating: 81, height: 183, weight: 78, age: 27, cGP: 263, cG: 140, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 91, sho: 87, pas: 68, dri: 83, def: 28, phy: 78, men: 81, sta: 80 } },
            { no: 3, pos: "LB", nat: "尼日利亚", name: "维克托", rating: 82, height: 178, weight: 73, age: 27, cGP: 333, cG: 18, cA: 54, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 89, sho: 62, pas: 79, dri: 81, def: 79, phy: 73, men: 81, sta: 93 } },
            { no: 4, pos: "CB", nat: "德国", name: "罗宾", rating: 82, height: 187, weight: 84, age: 28, cGP: 395, cG: 17, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { spd: 74, sho: 40, pas: 65, dri: 58, def: 85, phy: 87, men: 86, sta: 80 } },
            { no: 5, pos: "CB", nat: "科特迪瓦", name: "奥巴内", rating: 80, height: 189, weight: 86, age: 27, cGP: 267, cG: 15, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ30M", attributes: { spd: 70, sho: 38, pas: 60, dri: 55, def: 82, phy: 85, men: 79, sta: 82 } },
            { no: 15, pos: "CB", nat: "德国", name: "克洛格", rating: 80, height: 190, weight: 88, age: 26, cGP: 256, cG: 11, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ36M", attributes: { spd: 72, sho: 35, pas: 58, dri: 52, def: 81, phy: 89, men: 76, sta: 84 } },
            { no: 13, pos: "LB", nat: "西班牙", name: "雷吉洛克", rating: 80, height: 177, weight: 71, age: 26, cGP: 213, cG: 10, cA: 43, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 86, sho: 55, pas: 75, dri: 79, def: 76, phy: 69, men: 73, sta: 88 } },
            { no: 18, pos: "CM", nat: "哥伦比亚", name: "夏奇拉", rating: 81, height: 178, weight: 72, age: 28, cGP: 275, cG: 38, cA: 59, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 80, sho: 76, pas: 83, dri: 86, def: 55, phy: 68, men: 81, sta: 82 } },
            { no: 30, pos: "CM", nat: "英格兰", name: "莱姆", rating: 76, height: 182, weight: 75, age: 18, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ15M", attributes: { spd: 84, sho: 70, pas: 82, dri: 80, def: 65, phy: 74, men: 72, sta: 88 } },
            { no: 12, pos: "GK", nat: "意大利", name: "麦诺", rating: 78, height: 192, weight: 88, age: 25, cGP: 137, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ25M", attributes: { div: 80, han: 76, kic: 72, ref: 82, spd: 55, pos_s: 78, men: 72, sta: 74 } },
            { no: 23, pos: "GK", nat: "西班牙", name: "门多", rating: 78, height: 188, weight: 83, age: 22, cGP: 73, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ20M", attributes: { div: 79, han: 74, kic: 70, ref: 85, spd: 60, pos_s: 76, men: 68, sta: 70 } },
            { no: 14, pos: "CB", nat: "英格兰", name: "加斯", rating: 79, height: 191, weight: 89, age: 25, cGP: 172, cG: 9, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 70, sho: 35, pas: 55, dri: 50, def: 82, phy: 89, men: 77, sta: 80 } },
            { no: 24, pos: "CB", nat: "埃及", name: "法拉格", rating: 78, height: 186, weight: 82, age: 25, cGP: 170, cG: 6, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ20M", attributes: { spd: 72, sho: 32, pas: 52, dri: 48, def: 79, phy: 85, men: 74, sta: 78 } },
            { no: 2, pos: "RB", nat: "乌拉圭", name: "劳塔纳", rating: 78, height: 180, weight: 75, age: 24, cGP: 140, cG: 4, cA: 26, tGP: 0, tG: 0, tA: 0, value: "ⰵ24M", attributes: { spd: 91, sho: 58, pas: 73, dri: 81, def: 75, phy: 71, men: 68, sta: 92 } },
            { no: 22, pos: "RB", nat: "英格兰", name: "道森", rating: 78, height: 181, weight: 77, age: 26, cGP: 237, cG: 7, cA: 37, tGP: 0, tG: 0, tA: 0, value: "ⰵ25M", attributes: { spd: 88, sho: 55, pas: 75, dri: 79, def: 77, phy: 76, men: 74, sta: 85 } },
            { no: 17, pos: "CAM", nat: "波兰", name: "米利克", rating: 80, height: 181, weight: 76, age: 26, cGP: 193, cG: 54, cA: 39, tGP: 0, tG: 0, tA: 0, value: "ⰵ36M", attributes: { spd: 82, sho: 85, pas: 81, dri: 85, def: 42, phy: 76, men: 79, sta: 82 } },
            { no: 11, pos: "LM", nat: "瑞典", name: "埃兰加", rating: 79, height: 176, weight: 70, age: 24, cGP: 153, cG: 30, cA: 30, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 93, sho: 79, pas: 72, dri: 87, def: 35, phy: 64, men: 70, sta: 85 } },
            { no: 6, pos: "CDM", nat: "法国", name: "安道尔", rating: 78, height: 183, weight: 79, age: 25, cGP: 175, cG: 7, cA: 20, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { spd: 76, sho: 60, pas: 75, dri: 71, def: 79, phy: 83, men: 72, sta: 90 } },
            { no: 20, pos: "CM", nat: "美国", name: "查罗克", rating: 78, height: 178, weight: 74, age: 23, cGP: 173, cG: 16, cA: 27, tGP: 0, tG: 0, tA: 0, value: "ⰵ30M", attributes: { spd: 85, sho: 71, pas: 79, dri: 83, def: 62, phy: 69, men: 75, sta: 88 } },
            { no: 25, pos: "RM", nat: "英格兰", name: "杰克罗斯", rating: 77, height: 179, weight: 72, age: 25, cGP: 135, cG: 16, cA: 21, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 86, sho: 75, pas: 76, dri: 81, def: 45, phy: 62, men: 68, sta: 80 } },
            { no: 21, pos: "LB", nat: "英格兰", name: "韦洛克", rating: 77, height: 175, weight: 70, age: 23, cGP: 156, cG: 2, cA: 24, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 89, sho: 58, pas: 73, dri: 85, def: 73, phy: 65, men: 64, sta: 85 } },
            { no: 28, pos: "ST", nat: "匈牙利", name: "维扎", rating: 77, height: 181, weight: 77, age: 23, cGP: 88, cG: 29, cA: 7, tGP: 0, tG: 0, tA: 0, value: "ⰵ20M", attributes: { spd: 91, sho: 82, pas: 62, dri: 83, def: 25, phy: 75, men: 68, sta: 82 } },
            { no: 26, pos: "CB", nat: "英格兰", name: "查洛巴", rating: 75, height: 190, weight: 87, age: 21, cGP: 60, cG: 2, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { spd: 68, sho: 28, pas: 50, dri: 42, def: 79, phy: 86, men: 74, sta: 72 } },
            { no: 29, pos: "RM", nat: "丹麦", name: "欧克伦森", rating: 76, height: 180, weight: 75, age: 22, cGP: 82, cG: 8, cA: 16, tGP: 0, tG: 0, tA: 0, value: "ⰵ16M", attributes: { spd: 85, sho: 65, pas: 71, dri: 79, def: 42, phy: 60, men: 62, sta: 78 } }
        ]
    },

    // 17. 猛龙 (Raptors)
    "猛龙": {
        color: "#6b0eb3",
        style: "窒息式逼抢",
        stadium: "罗斯顿公园球场",
        coach: { name: "范德哈特", gp: 683, w: 472, d: 61, l: 150, rate: "69.11%" },
        status: { best: "阴天 · 中午", worst: "晴天 · 晚上", injury: "0", tactic: "窒息式逼抢" },
        honors: [
            { name: "世联赛冠军", count: 1, seasons: "17赛季", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 2, seasons: "05赛季、17赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 4, seasons: "S-92赛季、02赛季、04赛季、11赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 2, seasons: "10赛季、12赛季", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 4, seasons: "05赛季、11赛季、16赛季、17赛季", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 6, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 7, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 13, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-3 Attack)",
                players: {
                    "GK": "皮克勒", "LB": "拉斐尔", "LCB": "鲁本·迪亚", "RCB": "金旻奎", "RB": "罗梅罗",
                    "CM": "蒂尔尼", "LCM": "德布鲁诺", "RCM": "贝林厄姆", "LW": "斯丁格", "ST": "杰拉尔", "RW": "拉米雷斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "CM": [42, 50], "LCM": [58, 28], "RCM": [58, 72], "LW": [82, 15], "ST": [85, 50], "RW": [82, 85]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-4-2)",
                players: {
                    "GK": "朴贤洙", "LB": "佩莱林", "LCB": "门迪", "RCB": "沃尔夫斯", "RB": "奥塔门诺",
                    "LM": "霍尔格", "LCM": "莫雷诺", "RCM": "米斯特卡纳", "RM": "范尼", "LST": "米林特维奇", "RST": "希门尼斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "LM": [52, 15], "LCM": [45, 38], "RCM": [45, 62], "RM": [52, 85], "LST": [80, 35], "RST": [80, 65]
                }
            }
        },
        roster: [
            { no: 9, pos: "ST", nat: "西班牙", name: "杰拉尔", rating: 96, height: 181, weight: 81, age: 27, cGP: 605, cG: 660, cA: 73, tGP: 0, tG: 0, tA: 0, value: "ⰵ245M", attributes: { spd: 94, sho: 98, pas: 82, dri: 94, def: 42, phy: 89, men: 99, sta: 92 } },
            { no: 11, pos: "LW", nat: "德国", name: "斯丁格", rating: 94, height: 177, weight: 73, age: 28, cGP: 540, cG: 280, cA: 145, tGP: 0, tG: 0, tA: 0, value: "ⰵ190M", attributes: { spd: 96, sho: 90, pas: 87, dri: 95, def: 45, phy: 81, men: 91, sta: 94 } },
            { no: 7, pos: "CAM", nat: "比利时", name: "德布鲁诺", rating: 94, height: 181, weight: 75, age: 31, cGP: 695, cG: 137, cA: 510, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 78, sho: 88, pas: 97, dri: 93, def: 75, phy: 82, men: 99, sta: 84 } },
            { no: 4, pos: "CB", nat: "葡萄牙", name: "鲁本·迪亚", rating: 92, height: 187, weight: 82, age: 28, cGP: 310, cG: 15, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ145M", attributes: { spd: 85, sho: 40, pas: 78, dri: 72, def: 94, phy: 91, men: 95, sta: 88 } },
            { no: 10, pos: "CAM", nat: "英格兰", name: "贝林厄姆", rating: 92, height: 186, weight: 82, age: 21, cGP: 230, cG: 57, cA: 106, tGP: 0, tG: 0, tA: 0, value: "ⰵ225M", attributes: { spd: 87, sho: 85, pas: 91, dri: 93, def: 83, phy: 90, men: 94, sta: 96 } },
            { no: 8, pos: "CM", nat: "苏格兰", name: "蒂尔尼", rating: 92, height: 179, weight: 74, age: 29, cGP: 550, cG: 93, cA: 282, tGP: 0, tG: 0, tA: 0, value: "ⰵ130M", attributes: { spd: 85, sho: 82, pas: 93, dri: 90, def: 84, phy: 87, men: 93, sta: 95 } },
            { no: 5, pos: "CB", nat: "韩国", name: "金旻奎", rating: 91, height: 188, weight: 88, age: 28, cGP: 520, cG: 25, cA: 6, tGP: 0, tG: 0, tA: 0, value: "ⰵ90M", attributes: { spd: 84, sho: 50, pas: 75, dri: 76, def: 93, phy: 91, men: 95, sta: 89 } },
            { no: 14, pos: "LW", nat: "西班牙", name: "亚马鲁", rating: 82, height: 172, weight: 68, age: 21, cGP: 58, cG: 18, cA: 12, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 94, sho: 78, pas: 74, dri: 94, def: 33, phy: 73, men: 75, sta: 92 } },
            { no: 27, pos: "RW", nat: "巴西", name: "拉米雷斯", rating: 91, height: 181, weight: 78, age: 29, cGP: 530, cG: 240, cA: 120, tGP: 0, tG: 0, tA: 0, value: "ⰵ140M", attributes: { spd: 90, sho: 89, pas: 89, dri: 92, def: 48, phy: 83, men: 91, sta: 91 } },
            { no: 3, pos: "LB", nat: "巴西", name: "拉斐尔", rating: 90, height: 176, weight: 73, age: 29, cGP: 525, cG: 22, cA: 94, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 91, sho: 72, pas: 88, dri: 86, def: 84, phy: 78, men: 86, sta: 93 } },
            { no: 1, pos: "GK", nat: "德国", name: "皮克勒", rating: 90, height: 193, weight: 92, age: 31, cGP: 640, cG: 0, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ40M", attributes: { div: 88, han: 91, kic: 84, ref: 92, spd: 55, pos_s: 93, men: 96, sta: 82 } },
            { no: 2, pos: "RB", nat: "阿根廷", name: "罗梅罗", rating: 90, height: 178, weight: 76, age: 29, cGP: 535, cG: 18, cA: 86, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 92, sho: 70, pas: 87, dri: 88, def: 83, phy: 77, men: 85, sta: 94 } },
            { no: 26, pos: "ST", nat: "塞尔维亚", name: "米林特维奇", rating: 89, height: 184, weight: 82, age: 29, cGP: 535, cG: 255, cA: 57, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 86, sho: 91, pas: 78, dri: 85, def: 38, phy: 88, men: 92, sta: 86 } },
            { no: 16, pos: "CDM", nat: "西班牙", name: "莫雷诺", rating: 90, height: 182, weight: 77, age: 26, cGP: 385, cG: 27, cA: 62, tGP: 0, tG: 0, tA: 0, value: "ⰵ115M", attributes: { spd: 84, sho: 72, pas: 87, dri: 86, def: 87, phy: 89, men: 89, sta: 96 } },
            { no: 6, pos: "CB", nat: "法国", name: "门迪", rating: 88, height: 185, weight: 83, age: 31, cGP: 585, cG: 17, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ30M", attributes: { spd: 78, sho: 45, pas: 72, dri: 70, def: 89, phy: 87, men: 86, sta: 84 } },
            { no: 15, pos: "CB", nat: "荷兰", name: "沃尔夫斯", rating: 88, height: 187, weight: 85, age: 26, cGP: 365, cG: 16, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 83, sho: 48, pas: 70, dri: 72, def: 88, phy: 91, men: 82, sta: 86 } },
            { no: 12, pos: "GK", nat: "韩国", name: "朴贤洙", rating: 88, height: 187, weight: 84, age: 21, cGP: 130, cG: 0, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { div: 90, han: 83, kic: 80, ref: 94, spd: 62, pos_s: 85, men: 79, sta: 86 } },
            { no: 21, pos: "CB", nat: "科特迪瓦", name: "德罗格巴", rating: 87, height: 186, weight: 89, age: 27, cGP: 400, cG: 27, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ40M", attributes: { spd: 76, sho: 52, pas: 68, dri: 68, def: 87, phy: 93, men: 88, sta: 82 } },
            { no: 24, pos: "RB", nat: "阿根廷", name: "奥塔门诺", rating: 87, height: 179, weight: 78, age: 27, cGP: 405, cG: 12, cA: 52, tGP: 0, tG: 0, tA: 0, value: "ⰵ40M", attributes: { spd: 89, sho: 65, pas: 82, dri: 83, def: 81, phy: 79, men: 78, sta: 91 } },
            { no: 18, pos: "CM", nat: "葡萄牙", name: "米斯特卡纳", rating: 87, height: 178, weight: 73, age: 27, cGP: 400, cG: 43, cA: 77, tGP: 0, tG: 0, tA: 0, value: "ⰵ58M", attributes: { spd: 84, sho: 78, pas: 86, dri: 88, def: 74, phy: 76, men: 80, sta: 90 } },
            { no: 19, pos: "CM", nat: "尼日利亚", name: "阿德巴约", rating: 87, height: 182, weight: 80, age: 24, cGP: 255, cG: 38, cA: 63, tGP: 0, tG: 0, tA: 0, value: "ⰵ90M", attributes: { spd: 81, sho: 76, pas: 85, dri: 86, def: 80, phy: 84, men: 82, sta: 92 } },
            { no: 20, pos: "CAM", nat: "墨西哥", name: "希门尼斯", rating: 86, height: 175, weight: 71, age: 30, cGP: 540, cG: 65, cA: 115, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { spd: 78, sho: 80, pas: 88, dri: 87, def: 60, phy: 72, men: 85, sta: 82 } },
            { no: 25, pos: "LW", nat: "丹麦", name: "霍尔格", rating: 86, height: 173, weight: 70, age: 23, cGP: 205, cG: 70, cA: 54, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 92, sho: 82, pas: 80, dri: 89, def: 40, phy: 74, men: 76, sta: 90 } },
            { no: 28, pos: "RW", nat: "荷兰", name: "范尼", rating: 86, height: 174, weight: 72, age: 23, cGP: 210, cG: 84, cA: 73, tGP: 0, tG: 0, tA: 0, value: "ⰵ78M", attributes: { spd: 91, sho: 84, pas: 82, dri: 88, def: 42, phy: 75, men: 78, sta: 89 } },
            { no: 23, pos: "GK", nat: "英格兰", name: "夏克斯", rating: 85, height: 185, weight: 81, age: 28, cGP: 375, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ15M", attributes: { div: 84, han: 86, kic: 78, ref: 85, spd: 50, pos_s: 86, men: 82, sta: 80 } },
            { no: 22, pos: "LB", nat: "西班牙", name: "佩莱林", rating: 87, height: 176, weight: 72, age: 29, cGP: 475, cG: 14, cA: 70, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 88, sho: 68, pas: 84, dri: 82, def: 84, phy: 80, men: 80, sta: 88 } }
        ]
    },

    // 18. 雷克夏 (Rexia)
    "雷克夏": {
        color: "#f8ff2b",
        style: "全面攻守",
        stadium: "赫罗斯足球场",
        coach: { name: "帕金森", gp: 185, w: 92, d: 38, l: 55, rate: "49.73%" },
        status: { best: "阴天 · 下午", worst: "晴天 · 中午", injury: "0", tactic: "全面攻守" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 0, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 2, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-2-3-1)",
                players: { "GK": "卡洛斯", "LB": "埃德加", "LCB": "瓦伦丁", "RCB": "罗德里", "RB": "哈维", "LDM": "塞尔吉", "RDM": "莫德", "CAM": "雷奥", "LM": "佩德罗", "RM": "卢卡斯", "ST": "克里斯蒂安" },
                coords: { "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88], "LDM": [42, 35], "RDM": [42, 65], "CAM": [65, 50], "LM": [72, 15], "RM": [72, 85], "ST": [88, 50] }
            },
            CUP: {
                title: "杯赛阵容 (4-4-2)",
                players: { "GK": "马特", "LB": "路易斯", "LCB": "乔", "RCB": "西蒙", "RB": "马科斯", "LM": "马克", "LCM": "米勒", "RCM": "奥斯卡", "RM": "丹尼", "LST": "亚当", "RST": "本" },
                coords: { "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88], "LM": [55, 12], "LCM": [48, 38], "RCM": [48, 62], "RM": [55, 88], "LST": [82, 35], "RST": [82, 65] }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "西班牙", name: "卡洛斯", rating: 75, height: 188, weight: 84, age: 26, cGP: 215, cG: 0, cA: 2, tGP: 92, tG: 0, tA: 0, value: "ⰵ22M", attributes: { div: 76, han: 74, kic: 72, ref: 78, spd: 52, pos_s: 75, men: 78, sta: 70 } },
            { no: 3, pos: "LB", nat: "葡萄牙", name: "埃德加", rating: 71, height: 176, weight: 71, age: 23, cGP: 122, cG: 4, cA: 25, tGP: 45, tG: 1, tA: 8, value: "ⰵ16M", attributes: { spd: 82, sho: 45, pas: 68, dri: 72, def: 68, phy: 60, men: 65, sta: 84 } },
            { no: 4, pos: "CB", nat: "西班牙", name: "罗德里", rating: 79, height: 191, weight: 88, age: 27, cGP: 268, cG: 15, cA: 4, tGP: 110, tG: 5, tA: 1, value: "ⰵ38M", attributes: { spd: 72, sho: 40, pas: 62, dri: 55, def: 81, phy: 84, men: 82, sta: 78 } },
            { no: 5, pos: "CB", nat: "阿根廷", name: "瓦伦丁", rating: 75, height: 189, weight: 85, age: 25, cGP: 165, cG: 8, cA: 2, tGP: 88, tG: 3, tA: 0, value: "ⰵ26M", attributes: { spd: 70, sho: 38, pas: 58, dri: 52, def: 78, phy: 82, men: 74, sta: 80 } },
            { no: 2, pos: "RB", nat: "西班牙", name: "哈维", rating: 73, height: 180, weight: 75, age: 24, cGP: 138, cG: 3, cA: 22, tGP: 72, tG: 1, tA: 9, value: "ⰵ18M", attributes: { spd: 85, sho: 52, pas: 70, dri: 74, def: 72, phy: 68, men: 70, sta: 88 } },
            { no: 6, pos: "CDM", nat: "西班牙", name: "塞尔吉", rating: 73, height: 182, weight: 77, age: 25, cGP: 155, cG: 5, cA: 18, tGP: 65, tG: 2, tA: 5, value: "ⰵ18M", attributes: { spd: 74, sho: 55, pas: 72, dri: 68, def: 75, phy: 78, men: 76, sta: 90 } },
            { no: 8, pos: "CM", nat: "克罗地亚", name: "莫德", rating: 75, height: 179, weight: 72, age: 26, cGP: 182, cG: 18, cA: 45, tGP: 95, tG: 6, tA: 22, value: "ⰵ25M", attributes: { spd: 75, sho: 68, pas: 78, dri: 76, def: 65, phy: 70, men: 80, sta: 82 } },
            { no: 10, pos: "CAM", nat: "巴西", name: "雷奥", rating: 80, height: 181, weight: 76, age: 28, cGP: 345, cG: 72, cA: 142, tGP: 156, tG: 24, tA: 45, value: "ⰵ48M", attributes: { spd: 78, sho: 76, pas: 85, dri: 84, def: 42, phy: 68, men: 88, sta: 80 } },
            { no: 11, pos: "LM", nat: "西班牙", name: "佩德罗", rating: 73, height: 175, weight: 68, age: 22, cGP: 105, cG: 22, cA: 32, tGP: 45, tG: 8, tA: 12, value: "ⰵ20M", attributes: { spd: 88, sho: 70, pas: 72, dri: 82, def: 35, phy: 58, men: 70, sta: 82 } },
            { no: 7, pos: "RM", nat: "巴西", name: "卢卡斯", rating: 73, height: 177, weight: 70, age: 24, cGP: 142, cG: 15, cA: 28, tGP: 40, tG: 4, tA: 6, value: "ⰵ19M", attributes: { spd: 86, sho: 65, pas: 74, dri: 78, def: 40, phy: 62, men: 72, sta: 85 } },
            { no: 9, pos: "ST", nat: "智利", name: "克里斯蒂安", rating: 76, height: 185, weight: 81, age: 25, cGP: 188, cG: 102, cA: 22, tGP: 82, tG: 48, tA: 5, value: "ⰵ32M", attributes: { spd: 82, sho: 84, pas: 62, dri: 75, def: 28, phy: 80, men: 78, sta: 76 } },
            { no: 12, pos: "GK", nat: "美国", name: "马特", rating: 69, height: 191, weight: 86, age: 24, cGP: 88, cG: 0, cA: 0, tGP: 30, tG: 0, tA: 0, value: "ⰵ12M", attributes: { div: 72, han: 68, kic: 65, ref: 74, spd: 50, pos_s: 68, men: 65, sta: 62 } },
            { no: 23, pos: "GK", nat: "德国", name: "托马斯", rating: 67, height: 187, weight: 83, age: 21, cGP: 35, cG: 0, cA: 0, tGP: 22, tG: 0, tA: 0, value: "ⰵ9M", attributes: { div: 70, han: 65, kic: 60, ref: 71, spd: 55, pos_s: 64, men: 60, sta: 65 } },
            { no: 15, pos: "CB", nat: "荷兰", name: "西蒙", rating: 71, height: 188, weight: 84, age: 25, cGP: 142, cG: 6, cA: 1, tGP: 55, tG: 2, tA: 0, value: "ⰵ16M", attributes: { spd: 68, sho: 32, pas: 52, dri: 48, def: 74, phy: 78, men: 68, sta: 72 } },
            { no: 13, pos: "LB", nat: "乌拉圭", name: "路易斯", rating: 69, height: 178, weight: 73, age: 23, cGP: 98, cG: 2, cA: 15, tGP: 48, tG: 1, tA: 6, value: "ⰵ11M", attributes: { spd: 80, sho: 40, pas: 65, dri: 70, def: 64, phy: 58, men: 62, sta: 82 } },
            { no: 14, pos: "RB", nat: "墨西哥", name: "马科斯", rating: 69, height: 181, weight: 76, age: 25, cGP: 125, cG: 4, cA: 22, tGP: 42, tG: 1, tA: 5, value: "ⰵ11M", attributes: { spd: 82, sho: 42, pas: 68, dri: 72, def: 65, phy: 62, men: 64, sta: 85 } },
            { no: 24, pos: "CB", nat: "英格兰", name: "乔", rating: 68, height: 186, weight: 82, age: 22, cGP: 72, cG: 3, cA: 0, tGP: 48, tG: 2, tA: 0, value: "ⰵ9M", attributes: { spd: 65, sho: 30, pas: 50, dri: 45, def: 70, phy: 75, men: 62, sta: 68 } },
            { no: 16, pos: "CM", nat: "巴西", name: "奥斯卡", rating: 71, height: 180, weight: 74, age: 24, cGP: 118, cG: 12, cA: 24, tGP: 50, tG: 3, tA: 8, value: "ⰵ15M", attributes: { spd: 74, sho: 60, pas: 75, dri: 72, def: 62, phy: 65, men: 72, sta: 82 } },
            { no: 18, pos: "CAM", nat: "俄罗斯", name: "伊万", rating: 70, height: 175, weight: 69, age: 23, cGP: 92, cG: 18, cA: 21, tGP: 65, tG: 12, tA: 14, value: "ⰵ14M", attributes: { spd: 78, sho: 68, pas: 72, dri: 75, def: 38, phy: 60, men: 65, sta: 76 } },
            { no: 20, pos: "LM", nat: "英格兰", name: "尼克", rating: 69, height: 174, weight: 68, age: 22, cGP: 78, cG: 10, cA: 18, tGP: 55, tG: 6, tA: 11, value: "ⰵ12M", attributes: { spd: 84, sho: 62, pas: 68, dri: 74, def: 35, phy: 55, men: 62, sta: 80 } },
            { no: 25, pos: "RM", nat: "英格兰", name: "丹尼", rating: 68, height: 176, weight: 70, age: 23, cGP: 88, cG: 8, cA: 15, tGP: 42, tG: 4, tA: 8, value: "ⰵ10M", attributes: { spd: 82, sho: 58, pas: 70, dri: 72, def: 38, phy: 64, men: 60, sta: 78 } },
            { no: 17, pos: "CDM", nat: "苏格兰", name: "米勒", rating: 68, height: 183, weight: 79, age: 24, cGP: 112, cG: 5, cA: 11, tGP: 45, tG: 1, tA: 2, value: "ⰵ10M", attributes: { spd: 68, sho: 50, pas: 65, dri: 62, def: 70, phy: 72, men: 68, sta: 82 } },
            { no: 26, pos: "CM", nat: "英格兰", name: "班克斯", rating: 66, height: 178, weight: 73, age: 20, cGP: 32, cG: 1, cA: 6, tGP: 25, tG: 1, tA: 4, value: "ⰵ8M", attributes: { spd: 80, sho: 55, pas: 72, dri: 74, def: 55, phy: 62, men: 72, sta: 82 } },
            { no: 19, pos: "ST", nat: "英格兰", name: "亚当", rating: 72, height: 184, weight: 80, age: 24, cGP: 128, cG: 52, cA: 18, tGP: 35, tG: 12, tA: 4, value: "ⰵ18M", attributes: { spd: 80, sho: 78, pas: 60, dri: 72, def: 32, phy: 75, men: 70, sta: 78 } },
            { no: 21, pos: "ST", nat: "澳大利亚", name: "本", rating: 70, height: 182, weight: 77, age: 23, cGP: 105, cG: 38, cA: 12, tGP: 40, tG: 12, tA: 2, value: "ⰵ14M", attributes: { spd: 78, sho: 76, pas: 58, dri: 68, def: 35, phy: 72, men: 68, sta: 74 } },
            { no: 28, pos: "LW", nat: "南非", name: "马克", rating: 69, height: 177, weight: 72, age: 22, cGP: 82, cG: 22, cA: 18, tGP: 62, tG: 18, tA: 15, value: "ⰵ12M", attributes: { spd: 88, sho: 72, pas: 65, dri: 76, def: 30, phy: 58, men: 65, sta: 80 } }
        ]
    },

    // 19. 罗杰剧院 (Roger Theatre)
    "罗杰剧院": {
        color: "#ab00e0",
        style: "极致摆大巴 + 造越位",
        stadium: "罗杰斯歌剧院球场",
        coach: { name: "范恩图斯", gp: 321, w: 157, d: 23, l: 141, rate: "48.91%" },
        status: { best: "雨天 · 早上", worst: "阴天 · 晚上", injury: "0", tactic: "极致摆大巴 + 造越位" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 4, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 7, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (5-4-1)",
                players: { "GK": "波特", "LB": "谭德萨", "LCB": "德米尔", "CB": "哈坎", "RCB": "哈雷森", "RB": "豪斯", "LM": "马杰斯", "LCM": "米斯特", "RCM": "桑保罗", "RM": "奥德赛", "ST": "巴劳" },
                coords: { "GK": [5, 50], "LB": [20, 12], "LCB": [18, 31], "CB": [15, 50], "RCB": [18, 69], "RB": [20, 88], "LM": [48, 15], "LCM": [45, 38], "RCM": [45, 62], "RM": [48, 85], "ST": [85, 50] }
            },
            CUP: {
                title: "杯赛阵容 (4-3-3)",
                players: { "GK": "安德鲁", "LB": "约瑟夫", "LCB": "冈萨雷斯", "RCB": "范德雷斯", "RB": "兰多", "LCM": "艾利克斯", "CDM": "法雷加尔", "RCM": "库里", "LW": "穆尼尔", "ST": "爱德华", "RW": "里斯本斯" },
                coords: { "GK": [5, 50], "LB": [25, 10], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 90], "LCM": [52, 30], "CDM": [45, 50], "RCM": [52, 70], "LW": [80, 18], "ST": [86, 50], "RW": [80, 82] }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "英格兰", name: "波特", rating: 81, height: 188, weight: 84, age: 27, cGP: 285, cG: 0, cA: 2, tGP: 110, tG: 0, tA: 0, value: "ⰵ38M", attributes: { div: 82, han: 79, kic: 75, ref: 84, spd: 52, pos_s: 80, men: 82, sta: 78 } },
            { no: 3, pos: "LB", nat: "希腊", name: "谭德萨", rating: 75, height: 176, weight: 70, age: 24, cGP: 135, cG: 4, cA: 28, tGP: 65, tG: 1, tA: 9, value: "ⰵ22M", attributes: { spd: 84, sho: 58, pas: 72, dri: 74, def: 68, phy: 62, men: 70, sta: 88 } },
            { no: 4, pos: "CB", nat: "丹麦", name: "哈雷森", rating: 75, height: 186, weight: 81, age: 25, cGP: 115, cG: 6, cA: 1, tGP: 45, tG: 1, tA: 0, value: "ⰵ20M", attributes: { spd: 72, sho: 35, pas: 55, dri: 48, def: 78, phy: 82, men: 75, sta: 80 } },
            { no: 5, pos: "CB", nat: "土耳其", name: "哈坎", rating: 82, height: 191, weight: 88, age: 28, cGP: 312, cG: 15, cA: 2, tGP: 156, tG: 8, tA: 1, value: "ⰵ42M", attributes: { spd: 74, sho: 45, pas: 68, dri: 55, def: 85, phy: 88, men: 88, sta: 82 } },
            { no: 15, pos: "CB", nat: "土耳其", name: "德米尔", rating: 81, height: 189, weight: 85, age: 26, cGP: 245, cG: 11, cA: 1, tGP: 120, tG: 4, tA: 1, value: "ⰵ35M", attributes: { spd: 76, sho: 40, pas: 62, dri: 52, def: 83, phy: 85, men: 80, sta: 84 } },
            { no: 2, pos: "RB", nat: "英格兰", name: "豪斯", rating: 78, height: 180, weight: 75, age: 25, cGP: 168, cG: 3, cA: 22, tGP: 72, tG: 1, tA: 11, value: "ⰵ24M", attributes: { spd: 88, sho: 52, pas: 74, dri: 78, def: 75, phy: 70, men: 72, sta: 92 } },
            { no: 10, pos: "CM", nat: "德国", name: "米斯特", rating: 80, height: 182, weight: 77, age: 31, cGP: 548, cG: 48, cA: 115, tGP: 184, tG: 12, tA: 38, value: "ⰵ18M", attributes: { spd: 70, sho: 78, pas: 86, dri: 80, def: 72, phy: 76, men: 95, sta: 78 } },
            { no: 8, pos: "CM", nat: "西班牙", name: "桑保罗", rating: 80, height: 179, weight: 74, age: 29, cGP: 367, cG: 34, cA: 56, tGP: 95, tG: 10, tA: 15, value: "ⰵ26M", attributes: { spd: 76, sho: 75, pas: 84, dri: 82, def: 65, phy: 72, men: 85, sta: 82 } },
            { no: 7, pos: "LM", nat: "瑞典", name: "马杰斯", rating: 79, height: 175, weight: 70, age: 23, cGP: 125, cG: 22, cA: 35, tGP: 45, tG: 5, tA: 12, value: "ⰵ32M", attributes: { spd: 91, sho: 76, pas: 78, dri: 86, def: 40, phy: 64, men: 78, sta: 88 } },
            { no: 11, pos: "RM", nat: "希腊", name: "奥德赛", rating: 78, height: 178, weight: 73, age: 24, cGP: 118, cG: 15, cA: 28, tGP: 40, tG: 3, tA: 8, value: "ⰵ25M", attributes: { spd: 86, sho: 72, pas: 76, dri: 82, def: 45, phy: 68, men: 74, sta: 85 } },
            { no: 9, pos: "ST", nat: "葡萄牙", name: "巴劳", rating: 80, height: 184, weight: 81, age: 26, cGP: 256, cG: 152, cA: 21, tGP: 125, tG: 68, tA: 5, value: "ⰵ36M", attributes: { spd: 85, sho: 88, pas: 65, dri: 82, def: 32, phy: 80, men: 82, sta: 80 } },
            { no: 12, pos: "GK", nat: "苏格兰", name: "安德鲁", rating: 79, height: 192, weight: 88, age: 24, cGP: 92, cG: 0, cA: 0, tGP: 45, tG: 0, tA: 0, value: "ⰵ26M", attributes: { div: 80, han: 76, kic: 72, ref: 82, spd: 55, pos_s: 78, men: 74, sta: 75 } },
            { no: 14, pos: "CB", nat: "墨西哥", name: "冈萨雷斯", rating: 79, height: 189, weight: 85, age: 26, cGP: 175, cG: 12, cA: 1, tGP: 60, tG: 3, tA: 0, value: "ⰵ22M", attributes: { spd: 74, sho: 32, pas: 58, dri: 50, def: 81, phy: 84, men: 76, sta: 78 } },
            { no: 17, pos: "LM", nat: "瑞士", name: "艾利克斯", rating: 79, height: 176, weight: 71, age: 24, cGP: 148, cG: 32, cA: 38, tGP: 75, tG: 12, tA: 14, value: "ⰵ28M", attributes: { spd: 88, sho: 74, pas: 76, dri: 84, def: 42, phy: 60, men: 72, sta: 85 } },
            { no: 19, pos: "ST", nat: "英格兰", name: "爱德华", rating: 79, height: 185, weight: 80, age: 35, cGP: 638, cG: 198, cA: 65, tGP: 35, tG: 18, tA: 4, value: "ⰵ6M", attributes: { spd: 82, sho: 84, pas: 60, dri: 72, def: 35, phy: 78, men: 75, sta: 74 } },
            { no: 20, pos: "ST", nat: "尼日利亚", name: "萨齐拉", rating: 78, height: 182, weight: 78, age: 24, cGP: 105, cG: 48, cA: 10, tGP: 45, tG: 22, tA: 3, value: "ⰵ22M", attributes: { spd: 80, sho: 82, pas: 62, dri: 75, def: 28, phy: 72, men: 68, sta: 76 } },
            { no: 24, pos: "CB", nat: "荷兰", name: "范德雷斯", rating: 77, height: 188, weight: 86, age: 24, cGP: 110, cG: 6, cA: 0, tGP: 92, tG: 5, tA: 0, value: "ⰵ18M", attributes: { spd: 70, sho: 30, pas: 52, dri: 45, def: 78, phy: 80, men: 72, sta: 75 } },
            { no: 16, pos: "CM", nat: "美国", name: "库里", rating: 77, height: 181, weight: 76, age: 34, cGP: 532, cG: 78, cA: 81, tGP: 45, tG: 6, tA: 12, value: "ⰵ9M", attributes: { spd: 75, sho: 65, pas: 78, dri: 76, def: 60, phy: 68, men: 74, sta: 82 } },
            { no: 23, pos: "GK", nat: "波兰", name: "瑟菲斯", rating: 77, height: 187, weight: 83, age: 22, cGP: 45, cG: 0, cA: 0, tGP: 35, tG: 0, tA: 0, value: "ⰵ18M", attributes: { div: 78, han: 75, kic: 70, ref: 80, spd: 58, pos_s: 76, men: 65, sta: 70 } },
            { no: 25, pos: "RM", nat: "葡萄牙", name: "里斯本斯", rating: 77, height: 179, weight: 74, age: 25, cGP: 125, cG: 15, cA: 24, tGP: 60, tG: 5, tA: 9, value: "ⰵ17M", attributes: { spd: 84, sho: 70, pas: 74, dri: 78, def: 40, phy: 62, men: 68, sta: 80 } },
            { no: 22, pos: "RB", nat: "比利时", name: "兰多", rating: 75, height: 179, weight: 75, age: 23, cGP: 95, cG: 2, cA: 18, tGP: 48, tG: 1, tA: 6, value: "ⰵ14M", attributes: { spd: 82, sho: 48, pas: 68, dri: 72, def: 74, phy: 60, men: 64, sta: 85 } },
            { no: 6, pos: "CDM", nat: "西班牙", name: "法雷加尔", rating: 75, height: 183, weight: 79, age: 23, cGP: 92, cG: 4, cA: 14, tGP: 88, tG: 3, tA: 12, value: "ⰵ15M", attributes: { spd: 68, sho: 55, pas: 72, dri: 65, def: 76, phy: 78, men: 72, sta: 82 } },
            { no: 28, pos: "ST", nat: "摩洛哥", name: "穆尼尔", rating: 75, height: 180, weight: 76, age: 21, cGP: 58, cG: 22, cA: 8, tGP: 55, tG: 21, tA: 6, value: "ⰵ16M", attributes: { spd: 88, sho: 80, pas: 58, dri: 74, def: 25, phy: 65, men: 70, sta: 80 } },
            { no: 21, pos: "LB", nat: "英格兰", name: "约瑟夫", rating: 74, height: 174, weight: 69, age: 21, cGP: 52, cG: 1, cA: 10, tGP: 45, tG: 1, tA: 8, value: "ⰵ14M", attributes: { spd: 85, sho: 42, pas: 65, dri: 70, def: 72, phy: 58, men: 62, sta: 84 } },
            { no: 18, pos: "CAM", nat: "意大利", name: "德罗西", rating: 74, height: 175, weight: 69, age: 22, cGP: 48, cG: 6, cA: 18, tGP: 42, tG: 5, tA: 15, value: "ⰵ15M", attributes: { spd: 78, sho: 68, pas: 75, dri: 78, def: 35, phy: 55, men: 74, sta: 78 } },
            { no: 26, pos: "CB", nat: "土耳其", name: "冈德斯", rating: 74, height: 192, weight: 89, age: 20, cGP: 35, cG: 1, cA: 0, tGP: 22, tG: 1, tA: 0, value: "ⰵ15M", attributes: { spd: 68, sho: 28, pas: 50, dri: 42, def: 78, phy: 84, men: 68, sta: 72 } }
        ]
    },

    // 20. 森利西亚虎 (Senlicia Tiger)
    "森利西亚虎": {
        color: "#0f766e",
        style: "暴力突击",
        stadium: "世源足球场",
        coach: { name: "斯德尔雷特", gp: 399, w: 197, d: 71, l: 131, rate: "49.37%" },
        status: { best: "阴天 · 中午", worst: "雨天 · 早上", injury: "0", tactic: "暴力突击" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 2, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 2, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 7, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (3-4-3)",
                players: {
                    "GK": "图格涅夫", "LCB": "泽尼特", "CB": "巴斯托古", "RCB": "帕夫洛",
                    "LM": "迪洛·费德", "LCM": "皮尔萨", "RCM": "凯西·杜尔", "RM": "布什", "LW": "拉什·德福", "ST": "法罗莱纳", "RW": "斯特罗"
                },
                coords: {
                    "GK": [5, 50], "LCB": [20, 28], "CB": [16, 50], "RCB": [20, 72],
                    "LM": [48, 12], "LCM": [42, 38], "RCM": [42, 62], "RM": [48, 88], "LW": [78, 18], "ST": [85, 50], "RW": [78, 82]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "马格林", "LB": "洛特纳", "LCB": "巴雷特", "RCB": "哈格曼", "RB": "洛夫林",
                    "LDM": "萨科", "RDM": "梅罗姆", "CAM": "德利赫芬", "LW": "穆克什尼", "ST": "斯卡洛夫", "RW": "克鲁格"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LDM": [45, 30], "RDM": [45, 70], "CAM": [60, 50], "LW": [80, 18], "ST": [86, 50], "RW": [80, 82]
                }
            }
        },
        roster: [
            { no: 14, pos: "CDM", nat: "意大利", name: "皮尔萨", rating: 91, height: 183, weight: 79, age: 30, cGP: 590, cG: 46, cA: 137, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 78, sho: 75, pas: 91, dri: 84, def: 89, phy: 86, men: 93, sta: 95 } },
            { no: 7, pos: "LW", nat: "英格兰", name: "拉什·德福", rating: 88, height: 180, weight: 75, age: 25, cGP: 308, cG: 143, cA: 76, tGP: 0, tG: 0, tA: 0, value: "ⰵ125M", attributes: { spd: 95, sho: 89, pas: 82, dri: 93, def: 38, phy: 79, men: 88, sta: 91 } },
            { no: 10, pos: "CB", nat: "俄罗斯", name: "帕夫洛", rating: 87, height: 188, weight: 85, age: 24, cGP: 215, cG: 8, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ65M", attributes: { spd: 84, sho: 40, pas: 68, dri: 62, def: 88, phy: 92, men: 80, sta: 85 } },
            { no: 8, pos: "CM", nat: "意大利", name: "迪奥利", rating: 87, height: 181, weight: 76, age: 29, cGP: 550, cG: 57, cA: 116, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 76, sho: 80, pas: 90, dri: 84, def: 70, phy: 75, men: 92, sta: 86 } },
            { no: 9, pos: "ST", nat: "西班牙", name: "法罗莱纳", rating: 86, height: 184, weight: 81, age: 26, cGP: 365, cG: 220, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ90M", attributes: { spd: 88, sho: 93, pas: 70, dri: 85, def: 30, phy: 86, men: 86, sta: 82 } },
            { no: 21, pos: "CDM", nat: "科特迪瓦", name: "凯西·杜尔", rating: 86, height: 183, weight: 82, age: 26, cGP: 185, cG: 12, cA: 24, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 82, sho: 70, pas: 80, dri: 78, def: 84, phy: 90, men: 82, sta: 95 } },
            { no: 19, pos: "RW", nat: "德国", name: "斯特罗", rating: 86, height: 175, weight: 70, age: 24, cGP: 263, cG: 79, cA: 67, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 93, sho: 84, pas: 80, dri: 91, def: 35, phy: 65, men: 79, sta: 88 } },
            { no: 11, pos: "LM", nat: "克罗地亚", name: "穆克什尼", rating: 85, height: 178, weight: 74, age: 26, cGP: 307, cG: 34, cA: 86, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { spd: 91, sho: 74, pas: 83, dri: 88, def: 52, phy: 71, men: 79, sta: 94 } },
            { no: 4, pos: "CB", nat: "俄罗斯", name: "泽尼特", rating: 85, height: 187, weight: 84, age: 27, cGP: 345, cG: 17, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ58M", attributes: { spd: 78, sho: 40, pas: 65, dri: 58, def: 86, phy: 88, men: 82, sta: 85 } },
            { no: 5, pos: "CB", nat: "意大利", name: "巴斯托古", rating: 85, height: 189, weight: 86, age: 26, cGP: 310, cG: 12, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ62M", attributes: { spd: 74, sho: 35, pas: 68, dri: 62, def: 88, phy: 90, men: 85, sta: 82 } },
            { no: 26, pos: "LM", nat: "意大利", name: "迪洛·费德", rating: 85, height: 175, weight: 70, age: 25, cGP: 190, cG: 22, cA: 45, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 90, sho: 74, pas: 85, dri: 84, def: 60, phy: 72, men: 78, sta: 90 } },
            { no: 17, pos: "RM", nat: "德国", name: "布什", rating: 85, height: 177, weight: 73, age: 24, cGP: 230, cG: 34, cA: 76, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 88, sho: 70, pas: 85, dri: 86, def: 58, phy: 68, men: 77, sta: 90 } },
            { no: 18, pos: "CM", nat: "巴拉圭", name: "库巴斯", rating: 85, height: 182, weight: 78, age: 27, cGP: 268, cG: 25, cA: 60, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 80, sho: 76, pas: 86, dri: 84, def: 74, phy: 78, men: 80, sta: 88 } },
            { no: 14, pos: "CB", nat: "英格兰", name: "巴雷特", rating: 84, height: 188, weight: 85, age: 26, cGP: 247, cG: 14, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 72, sho: 32, pas: 60, dri: 52, def: 88, phy: 91, men: 78, sta: 82 } },
            { no: 22, pos: "RW", nat: "德国", name: "克鲁格", rating: 84, height: 176, weight: 73, age: 25, cGP: 220, cG: 50, cA: 46, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 90, sho: 80, pas: 82, dri: 88, def: 40, phy: 74, men: 80, sta: 86 } },
            { no: 21, pos: "ST", nat: "保加利亚", name: "斯卡洛夫", rating: 82, height: 183, weight: 79, age: 23, cGP: 163, cG: 63, cA: 20, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 84, sho: 87, pas: 65, dri: 78, def: 25, phy: 76, men: 73, sta: 78 } },
            { no: 12, pos: "GK", nat: "俄罗斯", name: "图格涅夫", rating: 81, height: 189, weight: 87, age: 24, cGP: 180, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { div: 82, han: 78, kic: 74, ref: 85, spd: 58, pos_s: 80, men: 74, sta: 76 } },
            { no: 20, pos: "CAM", nat: "荷兰", name: "德利赫芬", rating: 81, height: 177, weight: 74, age: 25, cGP: 178, cG: 24, cA: 57, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { spd: 80, sho: 76, pas: 86, dri: 88, def: 42, phy: 65, men: 82, sta: 84 } },
            { no: 6, pos: "CDM", nat: "法国", name: "萨科", rating: 80, height: 179, weight: 79, age: 24, cGP: 160, cG: 6, cA: 21, tGP: 0, tG: 0, tA: 0, value: "ⰵ34M", attributes: { spd: 78, sho: 60, pas: 78, dri: 75, def: 82, phy: 80, men: 82, sta: 92 } },
            { no: 16, pos: "CDM", nat: "以色列", name: "梅罗姆", rating: 80, height: 181, weight: 77, age: 22, cGP: 102, cG: 2, cA: 22, tGP: 0, tG: 0, tA: 0, value: "ⰵ36M", attributes: { spd: 76, sho: 58, pas: 80, dri: 78, def: 78, phy: 82, men: 75, sta: 88 } },
            { no: 24, pos: "CB", nat: "德国", name: "哈格曼", rating: 80, height: 186, weight: 83, age: 23, cGP: 143, cG: 6, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 75, sho: 30, pas: 55, dri: 48, def: 81, phy: 85, men: 73, sta: 78 } },
            { no: 2, pos: "RB", nat: "克罗地亚", name: "洛夫林", rating: 79, height: 180, weight: 76, age: 23, cGP: 127, cG: 4, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 85, sho: 48, pas: 75, dri: 79, def: 77, phy: 69, men: 71, sta: 90 } },
            { no: 27, pos: "CB", nat: "丹麦", name: "佩德尔格", rating: 78, height: 187, weight: 84, age: 24, cGP: 133, cG: 5, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ20M", attributes: { spd: 70, sho: 32, pas: 55, dri: 50, def: 82, phy: 86, men: 72, sta: 78 } },
            { no: 23, pos: "GK", nat: "爱尔兰", name: "马格林", rating: 78, height: 190, weight: 87, age: 22, cGP: 65, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { div: 80, han: 76, kic: 72, ref: 82, spd: 55, pos_s: 75, men: 70, sta: 72 } },
            { no: 3, pos: "LB", nat: "德国", name: "洛特纳", rating: 78, height: 174, weight: 69, age: 22, cGP: 103, cG: 2, cA: 37, tGP: 0, tG: 0, tA: 0, value: "ⰵ24M", attributes: { spd: 89, sho: 45, pas: 73, dri: 76, def: 75, phy: 56, men: 69, sta: 87 } },
            { no: 99, pos: "CDM", nat: "日本", name: "德川幸村", rating: 75, height: 178, weight: 72, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 80, sho: 60, pas: 85, dri: 82, def: 68, phy: 70, men: 75, sta: 85 } }
        ]
    },

    // 21. 威龙 (Vejron)
    "威龙": {
        color: "#d41515",
        style: "全能反击",
        stadium: "威灵顿足球场",
        coach: { name: "维拉", gp: 57, w: 40, d: 8, l: 9, rate: "70.18%" },
        status: { best: "晴天 · 早上", worst: "雨天 · 晚上", injury: "0", tactic: "全能反击" },
        honors: [
            { name: "世联赛冠军", count: 1, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 3, seasons: "S-65赛季、S-80赛季、14赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 3, seasons: "S-83赛季、02赛季、10赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 1, seasons: "15赛季", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 2, seasons: "03赛季、14赛季", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 9, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 8, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 15, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-3)",
                players: {
                    "GK": "奥斯卡", "LB": "郑宰明", "LCB": "陆坚", "RCB": "阿劳霍", "RB": "卡瓦尼斯",
                    "CDM": "梅诺", "LCM": "丁智寅", "RCM": "亚当斯", "LW": "林宇辉", "ST": "金海秀", "RW": "马尔奎托"
                },
                coords: {
                    "GK": [5, 50], "LB": [20, 15], "LCB": [20, 40], "RCB": [20, 60], "RB": [20, 85],
                    "CDM": [45, 50], "LCM": [45, 30], "RCM": [45, 70], "LW": [75, 20], "ST": [85, 50], "RW": [75, 80]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "克浦", "LB": "卡瓦略", "LCB": "罗伯特", "RCB": "特罗萨德", "RB": "邵子豪",
                    "LDM": "亚雷科森", "RDM": "凯撒多", "CAM": "姜敏勋", "LW": "内达尔", "RW": "纳维斯", "ST": "费尔南德斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LDM": [45, 30], "RDM": [45, 70], "CAM": [60, 50], "LW": [80, 18], "ST": [86, 50], "RW": [80, 82]
                }
            }
        },
        roster: [
            { no: 9, pos: "ST", nat: "韩国", name: "金海秀", rating: 95, height: 184, weight: 81, age: 27, cGP: 468, cG: 393, cA: 57, tGP: 0, tG: 0, tA: 0, value: "ⰵ245M", attributes: { spd: 92, sho: 98, pas: 82, dri: 92, def: 32, phy: 88, men: 95, sta: 88 } },
            { no: 18, pos: "CM", nat: "韩国", name: "丁智寅", rating: 95, height: 181, weight: 77, age: 27, cGP: 505, cG: 124, cA: 246, tGP: 0, tG: 0, tA: 0, value: "ⰵ215M", attributes: { spd: 82, sho: 89, pas: 98, dri: 95, def: 78, phy: 81, men: 96, sta: 90 } },
            { no: 4, pos: "CB", nat: "乌拉圭", name: "阿劳霍", rating: 91, height: 192, weight: 91, age: 26, cGP: 280, cG: 15, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ125M", attributes: { spd: 88, sho: 45, pas: 68, dri: 65, def: 92, phy: 94, men: 88, sta: 85 } },
            { no: 37, pos: "LW", nat: "中国", name: "林宇辉", rating: 90, height: 177, weight: 71, age: 20, cGP: 193, cG: 113, cA: 83, tGP: 0, tG: 0, tA: 0, value: "ⰵ155M", attributes: { spd: 97, sho: 85, pas: 82, dri: 94, def: 35, phy: 70, men: 78, sta: 88 } },
            { no: 11, pos: "RW", nat: "巴西", name: "马尔奎托", rating: 91, height: 175, weight: 69, age: 25, cGP: 340, cG: 146, cA: 111, tGP: 0, tG: 0, tA: 0, value: "ⰵ118M", attributes: { spd: 94, sho: 89, pas: 86, dri: 97, def: 40, phy: 72, men: 82, sta: 90 } },
            { no: 1, pos: "GK", nat: "西班牙", name: "奥斯卡", rating: 91, height: 191, weight: 88, age: 28, cGP: 541, cG: 0, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { div: 92, han: 88, kic: 84, ref: 93, spd: 55, pos_s: 94, men: 90, sta: 82 } },
            { no: 5, pos: "CB", nat: "中国", name: "陆坚", rating: 91, height: 187, weight: 85, age: 30, cGP: 527, cG: 25, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 82, sho: 50, pas: 72, dri: 70, def: 93, phy: 91, men: 88, sta: 86 } },
            { no: 6, pos: "CDM", nat: "英格兰", name: "梅诺", rating: 89, height: 182, weight: 79, age: 20, cGP: 240, cG: 28, cA: 36, tGP: 0, tG: 0, tA: 0, value: "ⰵ145M", attributes: { spd: 84, sho: 72, pas: 87, dri: 90, def: 86, phy: 82, men: 80, sta: 92 } },
            { no: 2, pos: "RB", nat: "乌拉圭", name: "卡瓦尼斯", rating: 89, height: 181, weight: 77, age: 26, cGP: 373, cG: 15, cA: 86, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 92, sho: 65, pas: 87, dri: 85, def: 83, phy: 76, men: 81, sta: 94 } },
            { no: 3, pos: "LB", nat: "韩国", name: "郑宰明", rating: 88, height: 178, weight: 74, age: 32, cGP: 585, cG: 23, cA: 100, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 84, sho: 68, pas: 88, dri: 84, def: 85, phy: 78, men: 92, sta: 85 } },
            { no: 28, pos: "CM", nat: "美国", name: "亚当斯", rating: 88, height: 178, weight: 75, age: 31, cGP: 445, cG: 44, cA: 106, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 80, sho: 76, pas: 88, dri: 86, def: 75, phy: 74, men: 88, sta: 85 } },
            { no: 20, pos: "CM", nat: "厄瓜多尔", name: "凯撒多", rating: 87, height: 177, weight: 74, age: 22, cGP: 170, cG: 21, cA: 39, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 85, sho: 70, pas: 83, dri: 85, def: 81, phy: 83, men: 77, sta: 92 } },
            { no: 12, pos: "GK", nat: "德国", name: "克浦", rating: 89, height: 189, weight: 87, age: 24, cGP: 180, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { div: 89, han: 85, kic: 80, ref: 91, spd: 55, pos_s: 87, men: 78, sta: 75 } },
            { no: 14, pos: "CB", nat: "比利时", name: "特罗萨德", rating: 88, height: 185, weight: 82, age: 26, cGP: 252, cG: 14, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 80, sho: 45, pas: 68, dri: 72, def: 88, phy: 87, men: 82, sta: 84 } },
            { no: 13, pos: "LB", nat: "葡萄牙", name: "卡瓦略", rating: 88, height: 174, weight: 70, age: 25, cGP: 245, cG: 9, cA: 51, tGP: 0, tG: 0, tA: 0, value: "ⰵ58M", attributes: { spd: 90, sho: 62, pas: 84, dri: 86, def: 82, phy: 74, men: 78, sta: 91 } },
            { no: 16, pos: "CDM", nat: "丹麦", name: "亚雷科森", rating: 88, height: 183, weight: 80, age: 23, cGP: 305, cG: 19, cA: 33, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 78, sho: 65, pas: 85, dri: 81, def: 86, phy: 83, men: 82, sta: 91 } },
            { no: 17, pos: "RW", nat: "葡萄牙", name: "纳维斯", rating: 88, height: 174, weight: 68, age: 27, cGP: 270, cG: 77, cA: 65, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 92, sho: 85, pas: 81, dri: 89, def: 42, phy: 65, men: 79, sta: 82 } },
            { no: 25, pos: "LW", nat: "荷兰", name: "内达尔", rating: 90, height: 178, weight: 75, age: 27, cGP: 240, cG: 104, cA: 82, tGP: 0, tG: 0, tA: 0, value: "ⰵ115M", attributes: { spd: 95, sho: 87, pas: 83, dri: 93, def: 38, phy: 79, men: 83, sta: 91 } },
            { no: 21, pos: "ST", nat: "阿根廷", name: "费尔南德斯", rating: 87, height: 182, weight: 80, age: 28, cGP: 290, cG: 133, cA: 39, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 86, sho: 89, pas: 72, dri: 83, def: 35, phy: 80, men: 81, sta: 82 } },
            { no: 27, pos: "CDM", nat: "西班牙", name: "加维里", rating: 86, height: 181, weight: 78, age: 21, cGP: 95, cG: 6, cA: 17, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { spd: 83, sho: 55, pas: 79, dri: 81, def: 85, phy: 79, men: 73, sta: 89 } },
            { no: 23, pos: "GK", nat: "巴西", name: "艾利森纳", rating: 86, height: 188, weight: 85, age: 21, cGP: 93, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { div: 86, han: 82, kic: 78, ref: 89, spd: 60, pos_s: 83, men: 72, sta: 78 } },
            { no: 44, pos: "CB", nat: "英格兰", name: "罗伯特", rating: 87, height: 186, weight: 84, age: 19, cGP: 190, cG: 12, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 83, sho: 38, pas: 65, dri: 62, def: 87, phy: 86, men: 75, sta: 88 } },
            { no: 40, pos: "RB", nat: "中国", name: "邵子豪", rating: 76, height: 184, weight: 77, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { spd: 91, sho: 58, pas: 74, dri: 78, def: 75, phy: 72, men: 68, sta: 88 } },
            { no: 41, pos: "CAM", nat: "韩国", name: "姜敏勋", rating: 78, height: 179, weight: 73, age: 18, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 80, sho: 72, pas: 86, dri: 84, def: 60, phy: 68, men: 74, sta: 82 } },
            { no: 42, pos: "ST", nat: "巴西", name: "卢卡斯·维拉", rating: 75, height: 182, weight: 76, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ15M", attributes: { spd: 86, sho: 80, pas: 68, dri: 88, def: 28, phy: 70, men: 65, sta: 78 } },
            { no: 43, pos: "CDM", nat: "德国", name: "汉斯·舒尔茨", rating: 75, height: 188, weight: 82, age: 18, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ12M", attributes: { spd: 74, sho: 55, pas: 72, dri: 70, def: 82, phy: 85, men: 78, sta: 84 } }
        ]
    },

    // 22. 华尔兹 (Waltz)
    "华尔兹": {
        color: "#cea52b",
        style: "三叉戟齐飞",
        stadium: "华兰街足球场",
        coach: { name: "安德森", gp: 412, w: 218, d: 75, l: 119, rate: "52.91%" },
        status: { best: "阴天 · 中午", worst: "晴天 · 晚上", injury: "0", tactic: "三叉戟齐飞" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 1, seasons: "S-55赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 2, seasons: "S-58赛季、S-59赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 3, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 2, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 5, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (4-3-3)",
                desc: "超速反击：全联盟最快的双翼卫配合，伊朗双塔在禁区内拥有绝对统治力。",
                players: {
                    "GK": "迪奥戈·科斯", "LB": "巴尔德", "LCB": "克林顿", "RCB": "强森", "RB": "古斯托",
                    "CDM": "洛佩斯", "LCM": "法布雷特", "RCM": "克里斯蒂安", "LW": "奥赛梅恩", "ST": "德拉西亚", "RW": "坎波拉"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88],
                    "CDM": [45, 50], "LCM": [52, 28], "RCM": [52, 72], "LW": [82, 15], "ST": [85, 50], "RW": [82, 85]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-2-3-1)",
                players: {
                    "GK": "斯帕雷恩", "LB": "乌帕梅斯", "LCB": "埃兰加", "RCB": "兰恩", "RB": "范德萨克",
                    "LDM": "伯顿肯", "RDM": "法拉赫", "CAM": "坎通恩", "LW": "桑托斯", "RW": "门德兹", "ST": "巴尔加斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 88],
                    "LDM": [45, 30], "RDM": [45, 70], "CAM": [60, 50], "LW": [80, 18], "ST": [86, 50], "RW": [80, 82]
                }
            }
        },
        roster: [
            { no: 30, pos: "GK", nat: "葡萄牙", name: "迪奥戈·科斯", rating: 89, height: 188, weight: 82, age: 26, cGP: 310, cG: 0, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ105M", attributes: { div: 88, han: 86, kic: 85, ref: 93, spd: 58, pos_s: 89, men: 82, sta: 80 } },
            { no: 9, pos: "ST", nat: "伊朗", name: "德拉西亚", rating: 91, height: 194, weight: 90, age: 26, cGP: 335, cG: 270, cA: 41, tGP: 0, tG: 0, tA: 0, value: "ⰵ145M", attributes: { spd: 90, sho: 95, pas: 75, dri: 88, def: 35, phy: 91, men: 86, sta: 90 } },
            { no: 7, pos: "LW", nat: "尼日利亚", name: "奥赛梅恩", rating: 89, height: 185, weight: 79, age: 25, cGP: 275, cG: 170, cA: 47, tGP: 0, tG: 0, tA: 0, value: "ⰵ125M", attributes: { spd: 96, sho: 90, pas: 78, dri: 93, def: 38, phy: 84, men: 83, sta: 90 } },
            { no: 28, pos: "LB", nat: "西班牙", name: "巴尔德", rating: 88, height: 175, weight: 69, age: 22, cGP: 150, cG: 4, cA: 35, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 96, sho: 62, pas: 79, dri: 87, def: 82, phy: 75, men: 76, sta: 90 } },
            { no: 29, pos: "RB", nat: "法国", name: "古斯托", rating: 86, height: 179, weight: 74, age: 22, cGP: 110, cG: 2, cA: 25, tGP: 0, tG: 0, tA: 0, value: "ⰵ72M", attributes: { spd: 91, sho: 55, pas: 80, dri: 84, def: 85, phy: 82, men: 76, sta: 88 } },
            { no: 6, pos: "CDM", nat: "西班牙", name: "洛佩斯", rating: 89, height: 184, weight: 81, age: 29, cGP: 547, cG: 34, cA: 77, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 78, sho: 70, pas: 89, dri: 82, def: 88, phy: 87, men: 93, sta: 96 } },
            { no: 5, pos: "CB", nat: "美国", name: "克林顿", rating: 88, height: 190, weight: 89, age: 27, cGP: 365, cG: 21, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 78, sho: 40, pas: 68, dri: 62, def: 91, phy: 92, men: 86, sta: 84 } },
            { no: 11, pos: "RW", nat: "伊朗", name: "坎波拉", rating: 88, height: 176, weight: 72, age: 25, cGP: 325, cG: 120, cA: 110, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 94, sho: 83, pas: 86, dri: 95, def: 42, phy: 70, men: 81, sta: 88 } },
            { no: 8, pos: "CM", nat: "法国", name: "法布雷特", rating: 87, height: 179, weight: 73, age: 26, cGP: 287, cG: 50, cA: 103, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 82, sho: 78, pas: 91, dri: 89, def: 72, phy: 70, men: 83, sta: 88 } },
            { no: 14, pos: "CB", nat: "英格兰", name: "强森", rating: 86, height: 189, weight: 85, age: 26, cGP: 215, cG: 13, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 72, sho: 32, pas: 60, dri: 52, def: 89, phy: 92, men: 78, sta: 82 } },
            { no: 10, pos: "CM", nat: "丹麦", name: "克里斯蒂安", rating: 86, height: 180, weight: 75, age: 27, cGP: 332, cG: 27, cA: 93, tGP: 0, tG: 0, tA: 0, value: "ⰵ72M", attributes: { spd: 76, sho: 74, pas: 87, dri: 85, def: 68, phy: 72, men: 89, sta: 82 } },
            { no: 1, pos: "GK", nat: "德国", name: "斯帕雷恩", rating: 85, height: 188, weight: 85, age: 27, cGP: 395, cG: 0, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { div: 87, han: 83, kic: 78, ref: 86, spd: 55, pos_s: 85, men: 80, sta: 78 } },
            { no: 2, pos: "RB", nat: "荷兰", name: "范德萨克", rating: 86, height: 181, weight: 76, age: 25, cGP: 256, cG: 10, cA: 63, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 91, sho: 55, pas: 81, dri: 85, def: 82, phy: 76, men: 78, sta: 94 } },
            { no: 12, pos: "GK", nat: "瑞典", name: "艾克松", rating: 83, height: 191, weight: 88, age: 25, cGP: 130, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ30M", attributes: { div: 85, han: 81, kic: 76, ref: 87, spd: 55, pos_s: 83, men: 74, sta: 75 } },
            { no: 13, pos: "LB", nat: "法国", name: "乌帕梅斯", rating: 84, height: 186, weight: 83, age: 23, cGP: 170, cG: 4, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 89, sho: 40, pas: 72, dri: 78, def: 85, phy: 88, men: 80, sta: 86 } },
            { no: 24, pos: "CB", nat: "瑞典", name: "埃兰加", rating: 84, height: 187, weight: 82, age: 23, cGP: 150, cG: 10, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 82, sho: 45, pas: 65, dri: 70, def: 84, phy: 85, men: 72, sta: 78 } },
            { no: 22, pos: "RB", nat: "英格兰", name: "兰恩", rating: 85, height: 180, weight: 75, age: 24, cGP: 230, cG: 8, cA: 54, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { spd: 90, sho: 52, pas: 79, dri: 83, def: 77, phy: 70, men: 74, sta: 92 } },
            { no: 16, pos: "CDM", nat: "英格兰", name: "伯顿肯", rating: 83, height: 182, weight: 78, age: 22, cGP: 108, cG: 8, cA: 20, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 84, sho: 65, pas: 78, dri: 80, def: 82, phy: 85, men: 76, sta: 92 } },
            { no: 20, pos: "CAM", nat: "法国", name: "坎通恩", rating: 86, height: 182, weight: 79, age: 29, cGP: 477, cG: 117, cA: 127, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 74, sho: 86, pas: 89, dri: 87, def: 55, phy: 78, men: 96, sta: 80 } },
            { no: 18, pos: "CAM", nat: "西班牙", name: "贝莱林", rating: 85, height: 175, weight: 70, age: 24, cGP: 167, cG: 21, cA: 67, tGP: 0, tG: 0, tA: 0, value: "ⰵ58M", attributes: { spd: 82, sho: 70, pas: 85, dri: 89, def: 42, phy: 60, men: 78, sta: 85 } },
            { no: 25, pos: "RM", nat: "葡萄牙", name: "门德兹", rating: 85, height: 177, weight: 72, age: 25, cGP: 178, cG: 34, cA: 56, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 88, sho: 75, pas: 83, dri: 86, def: 45, phy: 68, men: 74, sta: 86 } },
            { no: 21, pos: "ST", nat: "智利", name: "巴尔加斯", rating: 86, height: 184, weight: 81, age: 25, cGP: 245, cG: 117, cA: 26, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 86, sho: 89, pas: 68, dri: 82, def: 32, phy: 80, men: 72, sta: 78 } },
            { no: 27, pos: "RB", nat: "法国", name: "马夏乐", rating: 84, height: 179, weight: 74, age: 25, cGP: 170, cG: 6, cA: 47, tGP: 0, tG: 0, tA: 0, value: "ⰵ40M", attributes: { spd: 91, sho: 60, pas: 81, dri: 84, def: 75, phy: 71, men: 65, sta: 92 } },
            { no: 17, pos: "CM", nat: "埃及", name: "法拉赫", rating: 82, height: 178, weight: 73, age: 22, cGP: 100, cG: 7, cA: 36, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 85, sho: 72, pas: 83, dri: 88, def: 52, phy: 60, men: 70, sta: 88 } },
            { no: 23, pos: "LW", nat: "巴西", name: "桑托斯", rating: 82, height: 174, weight: 69, age: 22, cGP: 88, cG: 27, cA: 21, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 94, sho: 78, pas: 70, dri: 90, def: 30, phy: 62, men: 72, sta: 90 } },
            { no: 19, pos: "ST", nat: "波兰", name: "雷克斯塔", rating: 82, height: 183, weight: 80, age: 21, cGP: 60, cG: 20, cA: 6, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 88, sho: 83, pas: 60, dri: 81, def: 28, phy: 76, men: 68, sta: 82 } }
        ]
    },

    // 23. 沃特梅兹 (Wat Mez)
    "沃特梅兹": {
        color: "#464646",
        style: "亚洲流",
        stadium: "麒麟公园足球场",
        coach: { name: "安德森", gp: 412, w: 218, d: 75, l: 119, rate: "52.91%" },
        status: { best: "阴天 · 晚上", worst: "晴天 · 中午", injury: "0", tactic: "亚洲流" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 2, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 7, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (3-5-2)",
                players: {
                    "GK": "韩旭俊", "LCB": "金载沅", "CB": "富安义一", "RCB": "町田龙",
                    "LDM": "远藤胜", "RDM": "德川信治", "LM": "孙亦峰", "RM": "久保雄也", "CAM": "三苫健绪", "LST": "本田魁梧", "RST": "黄大烈"
                },
                coords: {
                    "GK": [5, 50], "LCB": [22, 25], "CB": [18, 50], "RCB": [22, 75],
                    "LDM": [42, 35], "RDM": [42, 65], "LM": [58, 12], "RM": [58, 88], "CAM": [65, 50], "LST": [85, 38], "RST": [85, 62]
                }
            },
            CUP: {
                title: "杯赛精英阵容 (4-2-3-1)",
                players: {
                    "GK": "郑成民", "LB": "李在勋", "LCB": "田中筑波", "RCB": "金正贤", "RB": "金泰焕",
                    "LDM": "林南俊", "RDM": "南俊浩", "CAM": "谷原健英", "LW": "黄义勋", "RW": "李承范", "ST": "裴秀斌"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88],
                    "LDM": [40, 35], "RDM": [40, 65], "CAM": [62, 50], "LW": [75, 15], "RW": [75, 85], "ST": [85, 50]
                }
            }
        },
        roster: [
            { no: 22, pos: "RW", nat: "日本", name: "久保雄也", rating: 88, height: 173, weight: 67, age: 24, cGP: 220, cG: 45, cA: 78, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 88, sho: 80, pas: 88, dri: 94, def: 40, phy: 68, men: 82, sta: 85 } },
            { no: 19, pos: "ST", nat: "韩国", name: "黄大烈", rating: 87, height: 177, weight: 77, age: 29, cGP: 310, cG: 112, cA: 35, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 91, sho: 86, pas: 72, dri: 84, def: 35, phy: 89, men: 80, sta: 82 } },
            { no: 23, pos: "CB", nat: "日本", name: "町田龙", rating: 85, height: 190, weight: 84, age: 28, cGP: 180, cG: 5, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { spd: 78, sho: 32, pas: 68, dri: 60, def: 86, phy: 88, men: 78, sta: 82 } },
            { no: 24, pos: "LW", nat: "韩国", name: "李承范", rating: 85, height: 178, weight: 72, age: 24, cGP: 120, cG: 28, cA: 35, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 93, sho: 78, pas: 82, dri: 88, def: 42, phy: 70, men: 76, sta: 88 } },
            { no: 31, pos: "RB", nat: "日本", name: "林拓海", rating: 76, height: 178, weight: 70, age: 18, cGP: 0, cG: 0, cA: 0, value: "ⰵ18M", attributes: { spd: 92, sho: 55, pas: 72, dri: 78, def: 74, phy: 68, men: 65, sta: 88 } },
            { no: 32, pos: "CAM", nat: "韩国", name: "朴俊熙", rating: 75, height: 176, weight: 68, age: 17, cGP: 0, cG: 0, cA: 0, value: "ⰵ22M", attributes: { spd: 82, sho: 70, pas: 88, dri: 84, def: 45, phy: 62, men: 72, sta: 80 } },
            { no: 33, pos: "CB", nat: "日本", name: "高桥陆", rating: 74, height: 187, weight: 82, age: 18, cGP: 0, cG: 0, cA: 0, value: "ⰵ15M", attributes: { spd: 78, sho: 35, pas: 65, dri: 60, def: 82, phy: 84, men: 70, sta: 78 } },
            { no: 36, pos: "GK", nat: "韩国", name: "郑成民", rating: 73, height: 189, weight: 81, age: 18, cGP: 0, cG: 0, cA: 0, value: "ⰵ10M", attributes: { div: 75, han: 72, kic: 70, ref: 85, spd: 50, pos_s: 74, men: 68, sta: 70 } },
            { no: 28, pos: "CM", nat: "日本", name: "德川信治", rating: 92, height: 176, weight: 71, age: 32, cGP: 440, cG: 177, cA: 303, tGP: 0, tG: 0, tA: 0, value: "ⰵ165M", attributes: { spd: 85, sho: 88, pas: 97, dri: 95, def: 72, phy: 76, men: 93, sta: 95 } },
            { no: 4, pos: "CB", nat: "日本", name: "富安义一", rating: 91, height: 188, weight: 84, age: 28, cGP: 422, cG: 12, cA: 17, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 84, sho: 50, pas: 78, dri: 72, def: 94, phy: 90, men: 88, sta: 90 } },
            { no: 11, pos: "LM", nat: "韩国", name: "孙亦峰", rating: 90, height: 183, weight: 77, age: 29, cGP: 550, cG: 80, cA: 190, tGP: 0, tG: 0, tA: 0, value: "ⰵ82M", attributes: { spd: 88, sho: 76, pas: 92, dri: 94, def: 52, phy: 72, men: 83, sta: 94 } },
            { no: 10, pos: "CAM", nat: "日本", name: "三苫健绪", rating: 89, height: 178, weight: 71, age: 27, cGP: 355, cG: 74, cA: 154, tGP: 0, tG: 0, tA: 0, value: "ⰵ115M", attributes: { spd: 92, sho: 78, pas: 88, dri: 97, def: 45, phy: 64, men: 90, sta: 91 } },
            { no: 9, pos: "ST", nat: "日本", name: "本田魁梧", rating: 88, height: 184, weight: 80, age: 27, cGP: 255, cG: 133, cA: 25, tGP: 0, tG: 0, tA: 0, value: "ⰵ78M", attributes: { spd: 86, sho: 91, pas: 65, dri: 82, def: 28, phy: 89, men: 86, sta: 82 } },
            { no: 5, pos: "CB", nat: "韩国", name: "金载沅", rating: 87, height: 186, weight: 81, age: 26, cGP: 286, cG: 15, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ70M", attributes: { spd: 80, sho: 38, pas: 65, dri: 60, def: 89, phy: 92, men: 82, sta: 85 } },
            { no: 12, pos: "GK", nat: "韩国", name: "韩旭俊", rating: 85, height: 188, weight: 85, age: 25, cGP: 195, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { div: 86, han: 84, kic: 82, ref: 89, spd: 55, pos_s: 85, men: 76, sta: 74 } },
            { no: 8, pos: "CDM", nat: "日本", name: "远藤胜", rating: 85, height: 178, weight: 75, age: 30, cGP: 505, cG: 24, cA: 60, tGP: 0, tG: 0, tA: 0, value: "ⰵ32M", attributes: { spd: 74, sho: 60, pas: 83, dri: 78, def: 87, phy: 82, men: 92, sta: 95 } },
            { no: 15, pos: "CB", nat: "韩国", name: "金正贤", rating: 85, height: 185, weight: 80, age: 26, cGP: 247, cG: 9, cA: 2, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 78, sho: 35, pas: 62, dri: 55, def: 86, phy: 87, men: 78, sta: 82 } },
            { no: 2, pos: "RB", nat: "韩国", name: "金泰焕", rating: 86, height: 177, weight: 72, age: 22, cGP: 85, cG: 4, cA: 28, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 93, sho: 60, pas: 81, dri: 83, def: 79, phy: 74, men: 82, sta: 95 } },
            { no: 6, pos: "CDM", nat: "韩国", name: "林南俊", rating: 84, height: 182, weight: 76, age: 26, cGP: 230, cG: 15, cA: 34, tGP: 0, tG: 0, tA: 0, value: "ⰵ45M", attributes: { spd: 76, sho: 58, pas: 78, dri: 72, def: 81, phy: 83, men: 76, sta: 88 } },
            { no: 14, pos: "CB", nat: "日本", name: "田中筑波", rating: 85, height: 187, weight: 83, age: 25, cGP: 215, cG: 7, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 75, sho: 32, pas: 60, dri: 52, def: 87, phy: 86, men: 74, sta: 80 } },
            { no: 20, pos: "RM", nat: "日本", name: "中田健二", rating: 85, height: 176, weight: 70, age: 25, cGP: 180, cG: 27, cA: 54, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { spd: 89, sho: 74, pas: 83, dri: 87, def: 42, phy: 65, men: 78, sta: 89 } },
            { no: 25, pos: "RM", nat: "日本", name: "谷原健英", rating: 85, height: 175, weight: 69, age: 24, cGP: 154, cG: 24, cA: 49, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 91, sho: 76, pas: 80, dri: 93, def: 38, phy: 62, men: 76, sta: 86 } },
            { no: 18, pos: "LM", nat: "韩国", name: "李在勋", rating: 86, height: 178, weight: 73, age: 27, cGP: 237, cG: 42, cA: 70, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 85, sho: 78, pas: 86, dri: 89, def: 50, phy: 70, men: 83, sta: 84 } },
            { no: 21, pos: "ST", nat: "韩国", name: "裴秀斌", rating: 86, height: 183, weight: 79, age: 25, cGP: 253, cG: 133, cA: 29, tGP: 0, tG: 0, tA: 0, value: "ⰵ62M", attributes: { spd: 85, sho: 88, pas: 72, dri: 82, def: 30, phy: 80, men: 76, sta: 78 } },
            { no: 17, pos: "LW", nat: "韩国", name: "黄义勋", rating: 84, height: 177, weight: 72, age: 26, cGP: 215, cG: 40, cA: 66, tGP: 0, tG: 0, tA: 0, value: "ⰵ42M", attributes: { spd: 92, sho: 78, pas: 81, dri: 89, def: 40, phy: 68, men: 72, sta: 87 } },
            { no: 16, pos: "CDM", nat: "韩国", name: "南俊浩", rating: 84, height: 180, weight: 75, age: 24, cGP: 207, cG: 13, cA: 40, tGP: 0, tG: 0, tA: 0, value: "ⰵ36M", attributes: { spd: 78, sho: 62, pas: 79, dri: 76, def: 83, phy: 81, men: 68, sta: 93 } }
        ]
    },

    // 24. 威尔顿联 (Weldon United)
    "威尔顿联": {
        color: "#9cc4ff",
        style: "中场控制和组织进攻",
        stadium: "威斯利高校足球场",
        coach: { name: "奥拉多", gp: 432, w: 205, d: 34, l: 193, rate: "47.45%" },
        status: { best: "阴天 · 中午", worst: "雨天 · 早上", injury: "0", tactic: "中场控制和组织进攻" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 2, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 6, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (3-4-3)",
                players: { "GK": "南特", "LCB": "格雷", "CB": "奥古斯", "RCB": "兰帕尔", "LM": "戈麦斯", "LCM": "库西蒂尼", "RCM": "皮特", "RM": "伍德", "LW": "马尔科姆", "ST": "维克", "RW": "安东尼" },
                coords: { "GK": [5, 50], "LCB": [20, 28], "CB": [16, 50], "RCB": [20, 72], "LM": [48, 12], "LCM": [45, 38], "RCM": [45, 62], "RM": [48, 88], "LW": [80, 18], "ST": [85, 50], "RW": [80, 82] }
            },
            CUP: {
                title: "杯赛阵容 (4-3-3)",
                players: { "GK": "泽雷夫", "LB": "哈德森", "LCB": "巴雷斯", "RCB": "德拉古希", "RB": "贝拉尔格", "LCM": "卡斯特鲁伊", "CDM": "吉普图鲁", "RCM": "萨卡", "LW": "道格拉斯", "ST": "达卡", "RW": "爱德森" },
                coords: { "GK": [5, 50], "LB": [25, 10], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 90], "LCM": [52, 30], "CDM": [45, 50], "RCM": [52, 70], "LW": [80, 18], "ST": [86, 50], "RW": [80, 82] }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "法国", name: "南特", rating: 79, height: 188, weight: 83, age: 29, cGP: 382, cG: 0, cA: 2, tGP: 88, tG: 0, tA: 0, value: "ⰵ35M", attributes: { div: 80, han: 77, kic: 75, ref: 82, spd: 52, pos_s: 84, men: 88, sta: 70 } },
            { no: 4, pos: "CB", nat: "德国", name: "奥古斯", rating: 82, height: 190, weight: 87, age: 27, cGP: 265, cG: 18, cA: 2, tGP: 120, tG: 9, tA: 1, value: "ⰵ72M", attributes: { spd: 74, sho: 45, pas: 65, dri: 52, def: 88, phy: 90, men: 85, sta: 82 } },
            { no: 5, pos: "CB", nat: "英格兰", name: "兰帕尔", rating: 77, height: 188, weight: 84, age: 26, cGP: 192, cG: 12, cA: 2, tGP: 55, tG: 3, tA: 0, value: "ⰵ26M", attributes: { spd: 76, sho: 38, pas: 58, dri: 50, def: 81, phy: 84, men: 76, sta: 78 } },
            { no: 15, pos: "CB", nat: "美国", name: "格雷", rating: 76, height: 185, weight: 82, age: 24, cGP: 168, cG: 6, cA: 1, tGP: 60, tG: 2, tA: 0, value: "ⰵ28M", attributes: { spd: 82, sho: 32, pas: 55, dri: 48, def: 78, phy: 80, men: 72, sta: 84 } },
            { no: 10, pos: "CM", nat: "阿根廷", name: "库西蒂尼", rating: 81, height: 172, weight: 68, age: 31, cGP: 525, cG: 65, cA: 158, tGP: 180, tG: 15, tA: 42, value: "ⰵ24M", attributes: { spd: 68, sho: 78, pas: 90, dri: 88, def: 60, phy: 58, men: 98, sta: 76 } },
            { no: 8, pos: "CM", nat: "英格兰", name: "皮特", rating: 81, height: 180, weight: 76, age: 26, cGP: 285, cG: 38, cA: 62, tGP: 95, tG: 12, tA: 18, value: "ⰵ42M", attributes: { spd: 78, sho: 72, pas: 84, dri: 80, def: 70, phy: 75, men: 82, sta: 86 } },
            { no: 7, pos: "RM", nat: "英格兰", name: "伍德", rating: 80, height: 178, weight: 74, age: 25, cGP: 215, cG: 28, cA: 55, tGP: 72, tG: 8, tA: 14, value: "ⰵ38M", attributes: { spd: 88, sho: 68, pas: 82, dri: 84, def: 55, phy: 68, men: 78, sta: 92 } },
            { no: 11, pos: "LM", nat: "西班牙", name: "戈麦斯", rating: 79, height: 175, weight: 71, age: 23, cGP: 142, cG: 18, cA: 38, tGP: 132, tG: 15, tA: 31, value: "ⰵ45M", attributes: { spd: 91, sho: 74, pas: 78, dri: 88, def: 40, phy: 60, men: 72, sta: 88 } },
            { no: 20, pos: "LW", nat: "巴西", name: "马尔科姆", rating: 80, height: 176, weight: 72, age: 24, cGP: 192, cG: 62, cA: 48, tGP: 65, tG: 18, tA: 12, value: "ⰵ42M", attributes: { spd: 94, sho: 84, pas: 76, dri: 88, def: 35, phy: 62, men: 75, sta: 85 } },
            { no: 9, pos: "ST", nat: "法国", name: "维克", rating: 82, height: 184, weight: 80, age: 26, cGP: 288, cG: 152, cA: 28, tGP: 110, tG: 68, tA: 9, value: "ⰵ78M", attributes: { spd: 88, sho: 90, pas: 65, dri: 82, def: 28, phy: 86, men: 84, sta: 80 } },
            { no: 17, pos: "RW", nat: "巴西", name: "安东尼", rating: 78, height: 174, weight: 69, age: 22, cGP: 112, cG: 25, cA: 22, tGP: 95, tG: 21, tA: 18, value: "ⰵ36M", attributes: { spd: 93, sho: 78, pas: 72, dri: 89, def: 32, phy: 58, men: 68, sta: 88 } },
            { no: 12, pos: "GK", nat: "俄罗斯", name: "泽雷夫", rating: 78, height: 191, weight: 86, age: 25, cGP: 125, cG: 0, cA: 0, tGP: 40, tG: 0, tA: 0, value: "ⰵ18M", attributes: { div: 80, han: 76, kic: 72, ref: 82, spd: 55, pos_s: 78, men: 70, sta: 74 } },
            { no: 23, pos: "GK", nat: "阿根廷", name: "梅西塔纳", rating: 77, height: 186, weight: 81, age: 21, cGP: 48, cG: 0, cA: 0, tGP: 35, tG: 0, tA: 0, value: "ⰵ15M", attributes: { div: 78, han: 74, kic: 70, ref: 84, spd: 60, pos_s: 76, men: 65, sta: 70 } },
            { no: 14, pos: "CB", nat: "意大利", name: "巴雷斯", rating: 76, height: 187, weight: 84, age: 25, cGP: 168, cG: 7, cA: 3, tGP: 45, tG: 1, tA: 1, value: "ⰵ16M", attributes: { spd: 70, sho: 32, pas: 55, dri: 48, def: 78, phy: 82, men: 72, sta: 78 } },
            { no: 3, pos: "LB", nat: "英格兰", name: "哈德森", rating: 75, height: 177, weight: 73, age: 23, cGP: 88, cG: 2, cA: 14, tGP: 30, tG: 0, tA: 5, value: "ⰵ19M", attributes: { spd: 82, sho: 40, pas: 72, dri: 75, def: 74, phy: 62, men: 65, sta: 88 } },
            { no: 2, pos: "RB", nat: "法国", name: "贝拉尔格", rating: 75, height: 179, weight: 75, age: 24, cGP: 112, cG: 3, cA: 19, tGP: 48, tG: 1, tA: 6, value: "ⰵ20M", attributes: { spd: 84, sho: 45, pas: 70, dri: 72, def: 75, phy: 68, men: 68, sta: 92 } },
            { no: 24, pos: "CB", nat: "罗马尼亚", name: "德拉古希", rating: 74, height: 191, weight: 88, age: 22, cGP: 65, cG: 4, cA: 0, tGP: 65, tG: 4, tA: 0, value: "ⰵ18M", attributes: { spd: 72, sho: 30, pas: 52, dri: 45, def: 76, phy: 84, men: 70, sta: 75 } },
            { no: 16, pos: "CM", nat: "葡萄牙", name: "卡斯特鲁伊", rating: 78, height: 182, weight: 77, age: 28, cGP: 310, cG: 28, cA: 45, tGP: 90, tG: 5, tA: 12, value: "ⰵ22M", attributes: { spd: 75, sho: 68, pas: 82, dri: 78, def: 65, phy: 70, men: 82, sta: 84 } },
            { no: 18, pos: "CM", nat: "英格兰", name: "萨卡", rating: 78, height: 178, weight: 72, age: 24, cGP: 145, cG: 19, cA: 25, tGP: 60, tG: 8, tA: 11, value: "ⰵ26M", attributes: { spd: 82, sho: 70, pas: 75, dri: 84, def: 52, phy: 62, men: 74, sta: 88 } },
            { no: 13, pos: "LM", nat: "土耳其", name: "贝吉塔克斯", rating: 76, height: 176, weight: 70, age: 23, cGP: 95, cG: 12, cA: 18, tGP: 45, tG: 4, tA: 7, value: "ⰵ18M", attributes: { spd: 85, sho: 72, pas: 70, dri: 80, def: 40, phy: 60, men: 65, sta: 82 } },
            { no: 6, pos: "CDM", nat: "尼日利亚", name: "吉普图鲁", rating: 75, height: 183, weight: 79, age: 25, cGP: 160, cG: 6, cA: 9, tGP: 42, tG: 1, tA: 2, value: "ⰵ21M", attributes: { spd: 72, sho: 55, pas: 74, dri: 68, def: 78, phy: 80, men: 72, sta: 90 } },
            { no: 19, pos: "CAM", nat: "美国", name: "基德", rating: 73, height: 174, weight: 69, age: 20, cGP: 45, cG: 3, cA: 12, tGP: 25, tG: 3, tA: 6, value: "ⰵ22M", attributes: { spd: 80, sho: 68, pas: 78, dri: 82, def: 35, phy: 58, men: 74, sta: 85 } },
            { no: 25, pos: "RM", nat: "丹麦", name: "米斯特", rating: 72, height: 180, weight: 75, age: 21, cGP: 52, cG: 2, cA: 8, tGP: 32, tG: 2, tA: 4, value: "ⰵ15M", attributes: { spd: 82, sho: 62, pas: 72, dri: 75, def: 42, phy: 60, men: 64, sta: 78 } },
            { no: 21, pos: "ST", nat: "赞比亚", name: "达卡", rating: 75, height: 181, weight: 76, age: 24, cGP: 120, cG: 45, cA: 8, tGP: 35, tG: 12, tA: 2, value: "ⰵ24M", attributes: { spd: 88, sho: 82, pas: 60, dri: 78, def: 25, phy: 74, men: 70, sta: 80 } },
            { no: 22, pos: "RW", nat: "巴西", name: "爱德森", rating: 75, height: 175, weight: 70, age: 22, cGP: 78, cG: 18, cA: 12, tGP: 68, tG: 14, tA: 11, value: "ⰵ25M", attributes: { spd: 90, sho: 78, pas: 72, dri: 85, def: 30, phy: 58, men: 68, sta: 85 } },
            { no: 26, pos: "LW", nat: "巴西", name: "道格拉斯", rating: 73, height: 178, weight: 74, age: 23, cGP: 82, cG: 15, cA: 18, tGP: 30, tG: 3, tA: 6, value: "ⰵ16M", attributes: { spd: 84, sho: 74, pas: 68, dri: 78, def: 35, phy: 62, men: 65, sta: 80 } }
        ]
    },

    // 25. 威尔福特 (Welford)
    "威尔福特": {
        color: "#761414",
        style: "控球进攻",
        stadium: "诺维亚足球场",
        coach: { name: "亨利", gp: 806, w: 565, d: 75, l: 166, rate: "70.10%" },
        status: { best: "阴天 · 中午", worst: "雨天 · 早上", injury: "0", tactic: "中场控制和组织进攻" },
        honors: [
            { name: "世联赛冠军", count: 1, seasons: "10赛季", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 4, seasons: "S-91赛季、S95赛季、07赛季、09赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 3, seasons: "S-82赛季、S-87赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 3, seasons: "07赛季、08赛季、09赛季", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 6, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 7, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 13, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛最强阵容 (4-2-3-1)",
                players: {
                    "GK": "川岛富康", "LB": "雷谷龙", "LCB": "鲁本斯", "RCB": "德里赫", "RB": "姆西塔西",
                    "LDM": "托内利", "RDM": "麦克提莫提", "CAM": "埃尔林", "LM": "莱昂纳多", "RM": "帕瓦尔德", "ST": "哈希特"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [25, 90],
                    "LDM": [40, 35], "RDM": [40, 65], "CAM": [60, 50], "LM": [72, 15], "RM": [72, 85], "ST": [86, 50]
                }
            },
            CUP: {
                title: "杯赛精英阵容 (4-2-3-1)",
                players: {
                    "GK": "里皮", "LB": "斯通斯", "LCB": "戈登", "RCB": "科鲁伊曼", "RB": "基纳",
                    "LDM": "乔治", "RDM": "凯迪拉克", "CAM": "埃克森", "LW": "纳尔罗斯", "RW": "托雷斯", "ST": "恩凯狄恩"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 12], "LCB": [20, 38], "RCB": [20, 62], "RB": [25, 88],
                    "LDM": [40, 35], "RDM": [40, 65], "CAM": [62, 50], "LW": [75, 15], "RW": [75, 85], "ST": [85, 50]
                }
            }
        },
        roster: [
            { no: 9, pos: "ST", nat: "英格兰", name: "哈希特", rating: 95, height: 188, weight: 85, age: 31, cGP: 592, cG: 457, cA: 60, tGP: 0, tG: 0, tA: 0, value: "ⰵ145M", attributes: { spd: 92, sho: 97, pas: 78, dri: 88, def: 45, phy: 91, men: 95, sta: 89 } },
            { no: 11, pos: "CAM", nat: "挪威", name: "埃尔林", rating: 94, height: 185, weight: 86, age: 27, cGP: 460, cG: 174, cA: 210, tGP: 0, tG: 0, tA: 0, value: "ⰵ180M", attributes: { spd: 88, sho: 85, pas: 95, dri: 92, def: 70, phy: 80, men: 92, sta: 87 } },
            { no: 7, pos: "RM", nat: "法国", name: "帕瓦尔德", rating: 93, height: 181, weight: 77, age: 28, cGP: 501, cG: 80, cA: 177, tGP: 0, tG: 0, tA: 0, value: "ⰵ150M", attributes: { spd: 94, sho: 83, pas: 90, dri: 92, def: 65, phy: 78, men: 89, sta: 92 } },
            { no: 28, pos: "LW", nat: "葡萄牙", name: "莱昂纳多", rating: 92, height: 188, weight: 82, age: 26, cGP: 150, cG: 45, cA: 38, tGP: 0, tG: 0, tA: 0, value: "ⰵ115M", attributes: { spd: 96, sho: 84, pas: 82, dri: 94, def: 35, phy: 88, men: 80, sta: 86 } },
            { no: 4, pos: "CB", nat: "葡萄牙", name: "鲁本斯", rating: 92, height: 191, weight: 89, age: 29, cGP: 533, cG: 29, cA: 7, tGP: 0, tG: 0, tA: 0, value: "ⰵ105M", attributes: { spd: 78, sho: 50, pas: 72, dri: 70, def: 95, phy: 94, men: 97, sta: 88 } },
            { no: 33, pos: "CB", nat: "荷兰", name: "德里赫", rating: 91, height: 189, weight: 86, age: 26, cGP: 280, cG: 12, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 80, sho: 55, pas: 75, dri: 72, def: 92, phy: 93, men: 88, sta: 90 } },
            { no: 30, pos: "GK", nat: "意大利", name: "里皮", rating: 87, height: 186, weight: 83, age: 19, cGP: 90, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { div: 88, han: 82, kic: 85, ref: 92, spd: 65, pos_s: 85, men: 80, sta: 82 } },
            { no: 10, pos: "CAM", nat: "丹麦", name: "埃克森", rating: 91, height: 184, weight: 79, age: 28, cGP: 480, cG: 73, cA: 131, tGP: 0, tG: 0, tA: 0, value: "ⰵ95M", attributes: { spd: 82, sho: 78, pas: 93, dri: 89, def: 74, phy: 76, men: 91, sta: 88 } },
            { no: 6, pos: "CDM", nat: "意大利", name: "托内利", rating: 90, height: 183, weight: 80, age: 27, cGP: 415, cG: 25, cA: 66, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 76, sho: 65, pas: 87, dri: 81, def: 91, phy: 89, men: 88, sta: 91 } },
            { no: 17, pos: "LM", nat: "西班牙", name: "纳尔罗斯", rating: 90, height: 177, weight: 72, age: 26, cGP: 282, cG: 66, cA: 80, tGP: 0, tG: 0, tA: 0, value: "ⰵ110M", attributes: { spd: 92, sho: 81, pas: 85, dri: 91, def: 42, phy: 72, men: 85, sta: 88 } },
            { no: 16, pos: "CDM", nat: "苏格兰", name: "麦克提莫提", rating: 89, height: 182, weight: 81, age: 29, cGP: 475, cG: 34, cA: 87, tGP: 0, tG: 0, tA: 0, value: "ⰵ60M", attributes: { spd: 78, sho: 71, pas: 83, dri: 80, def: 89, phy: 93, men: 87, sta: 94 } },
            { no: 1, pos: "GK", nat: "日本", name: "川岛富康", rating: 89, height: 187, weight: 82, age: 30, cGP: 636, cG: 0, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ35M", attributes: { div: 88, han: 87, kic: 82, ref: 91, spd: 58, pos_s: 90, men: 92, sta: 80 } },
            { no: 27, pos: "RM", nat: "西班牙", name: "托雷斯", rating: 88, height: 176, weight: 70, age: 27, cGP: 285, cG: 62, cA: 52, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 89, sho: 84, pas: 85, dri: 87, def: 50, phy: 74, men: 80, sta: 86 } },
            { no: 19, pos: "ST", nat: "英格兰", name: "恩凯狄恩", rating: 88, height: 183, weight: 78, age: 24, cGP: 240, cG: 123, cA: 17, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 91, sho: 89, pas: 72, dri: 85, def: 38, phy: 83, men: 81, sta: 84 } },
            { no: 20, pos: "CAM", nat: "美国", name: "凯迪拉克", rating: 88, height: 180, weight: 75, age: 24, cGP: 215, cG: 44, cA: 73, tGP: 0, tG: 0, tA: 0, value: "ⰵ78M", attributes: { spd: 82, sho: 82, pas: 89, dri: 90, def: 55, phy: 74, men: 83, sta: 85 } },
            { no: 2, pos: "RB", nat: "西班牙", name: "雷谷龙", rating: 87, height: 180, weight: 73, age: 30, cGP: 242, cG: 7, cA: 53, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { spd: 87, sho: 60, pas: 82, dri: 81, def: 83, phy: 76, men: 82, sta: 89 } },
            { no: 22, pos: "CB", nat: "英格兰", name: "戈登", rating: 88, height: 190, weight: 88, age: 23, cGP: 260, cG: 21, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ72M", attributes: { spd: 81, sho: 42, pas: 63, dri: 66, def: 87, phy: 92, men: 79, sta: 88 } },
            { no: 15, pos: "CB", nat: "荷兰", name: "科鲁伊曼", rating: 88, height: 189, weight: 85, age: 26, cGP: 230, cG: 15, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ58M", attributes: { spd: 76, sho: 40, pas: 65, dri: 65, def: 89, phy: 91, men: 81, sta: 85 } },
            { no: 26, pos: "ST", nat: "巴西", name: "马丁内利", rating: 87, height: 180, weight: 75, age: 23, cGP: 135, cG: 60, cA: 27, tGP: 0, tG: 0, tA: 0, value: "ⰵ68M", attributes: { spd: 89, sho: 86, pas: 77, dri: 85, def: 40, phy: 79, men: 80, sta: 82 } },
            { no: 14, pos: "CDM", nat: "英格兰", name: "乔治", rating: 87, height: 182, weight: 80, age: 24, cGP: 170, cG: 12, cA: 27, tGP: 0, tG: 0, tA: 0, value: "ⰵ55M", attributes: { spd: 78, sho: 62, pas: 81, dri: 77, def: 86, phy: 85, men: 82, sta: 89 } },
            { no: 24, pos: "RB", nat: "伊朗", name: "姆西塔西", rating: 87, height: 179, weight: 72, age: 21, cGP: 182, cG: 6, cA: 44, tGP: 0, tG: 0, tA: 0, value: "ⰵ62M", attributes: { spd: 92, sho: 58, pas: 80, dri: 83, def: 81, phy: 75, men: 76, sta: 91 } },
            { no: 23, pos: "LB", nat: "英格兰", name: "斯通斯", rating: 87, height: 181, weight: 78, age: 24, cGP: 163, cG: 5, cA: 29, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 86, sho: 55, pas: 81, dri: 79, def: 85, phy: 81, men: 79, sta: 86 } },
            { no: 13, pos: "CB", nat: "葡萄牙", name: "基纳", rating: 87, height: 188, weight: 85, age: 23, cGP: 180, cG: 12, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ52M", attributes: { spd: 77, sho: 40, pas: 60, dri: 63, def: 88, phy: 90, men: 83, sta: 84 } },
            { no: 21, pos: "CM", nat: "法国", name: "韦尔尼", rating: 82, height: 181, weight: 75, age: 19, cGP: 50, cG: 4, cA: 8, tGP: 0, tG: 0, tA: 0, value: "ⰵ40M", attributes: { spd: 81, sho: 73, pas: 83, dri: 84, def: 65, phy: 75, men: 73, sta: 85 } },
            { no: 5, pos: "CB", nat: "意大利", name: "乌多伊", rating: 88, height: 188, weight: 84, age: 34, cGP: 283, cG: 17, cA: 5, tGP: 0, tG: 0, tA: 0, value: "ⰵ15M", attributes: { spd: 71, sho: 48, pas: 70, dri: 67, def: 92, phy: 89, men: 95, sta: 76 } },
            { no: 35, pos: "LB", nat: "葡萄牙", name: "贝尔纳多", rating: 76, height: 179, weight: 72, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ18M", attributes: { spd: 91, sho: 58, pas: 75, dri: 78, def: 72, phy: 68, men: 70, sta: 85 } }
        ]
    },

    // 26. 威廉斯 (Williams)
    "威廉斯": {
        color: "#1d4ed8",
        style: "坚固的防守",
        stadium: "银河天空足球场",
        coach: { name: "亨德森", gp: 284, w: 133, d: 38, l: 113, rate: "46.83%" },
        status: { best: "阴天 · 下午", worst: "雨天 · 晚上", injury: "0", tactic: "坚固的防守" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 0, seasons: "暂无", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 0, seasons: "暂无", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 1, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 3, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛阵容 (5-3-2)",
                players: {
                    "GK": "张寒", "LB": "赞库洛", "LCB": "莫里斯", "CB": "奥尼尔", "RCB": "胡德尔斯", "RB": "罗贝鲁特",
                    "LCM": "威廉斯", "CM": "托内利", "RCM": "尼尔森", "LST": "里奇", "RST": "里格斯"
                },
                coords: {
                    "GK": [5, 50], "LB": [35, 10], "LCB": [20, 28], "CB": [16, 50], "RCB": [20, 72], "RB": [35, 90],
                    "LCM": [55, 25], "CM": [52, 50], "RCM": [55, 75], "LST": [85, 38], "RST": [85, 62]
                }
            },
            CUP: {
                title: "杯赛阵容 (4-3-3)",
                players: {
                    "GK": "法布雷加斯", "LB": "埃吉尔", "LCB": "卡恩", "RCB": "艾利奥特", "RB": "亚克森",
                    "LCM": "德容", "CM": "罗杰森", "RCM": "图洛克", "LW": "桑托斯", "ST": "科纳卡", "RW": "马加拉"
                },
                coords: {
                    "GK": [5, 50], "LB": [25, 10], "LCB": [20, 35], "RCB": [20, 65], "RB": [25, 90],
                    "LCM": [48, 28], "CM": [45, 50], "RCM": [48, 72], "LW": [82, 15], "ST": [86, 50], "RW": [82, 85]
                }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "中国", name: "张寒", rating: 85, height: 188, weight: 84, age: 28, cGP: 312, cG: 0, cA: 2, tGP: 156, tG: 0, tA: 1, value: "ⰵ42M", attributes: { div: 84, han: 82, kic: 80, ref: 88, spd: 52, pos_s: 86, men: 89, sta: 80 } },
            { no: 3, pos: "LB", nat: "巴西", name: "赞库洛", rating: 80, height: 176, weight: 72, age: 24, cGP: 145, cG: 6, cA: 28, tGP: 92, tG: 3, tA: 18, value: "ⰵ32M", attributes: { spd: 86, sho: 65, pas: 78, dri: 80, def: 76, phy: 72, men: 78, sta: 88 } },
            { no: 4, pos: "CB", nat: "英格兰", name: "莫里斯", rating: 83, height: 187, weight: 83, age: 26, cGP: 210, cG: 15, cA: 4, tGP: 120, tG: 8, tA: 2, value: "ⰵ38M", attributes: { spd: 75, sho: 52, pas: 68, dri: 65, def: 85, phy: 86, men: 82, sta: 84 } },
            { no: 5, pos: "CB", nat: "爱尔兰", name: "奥尼尔", rating: 79, height: 185, weight: 82, age: 25, cGP: 170, cG: 9, cA: 2, tGP: 95, tG: 4, tA: 1, value: "ⰵ22M", attributes: { spd: 72, sho: 48, pas: 65, dri: 62, def: 81, phy: 84, men: 80, sta: 82 } },
            { no: 15, pos: "CB", nat: "英格兰", name: "胡德尔斯", rating: 78, height: 186, weight: 81, age: 23, cGP: 125, cG: 5, cA: 1, tGP: 48, tG: 2, tA: 0, value: "ⰵ18M", attributes: { spd: 70, sho: 45, pas: 62, dri: 60, def: 80, phy: 82, men: 76, sta: 80 } },
            { no: 2, pos: "RB", nat: "葡萄牙", name: "罗贝鲁特", rating: 78, height: 180, weight: 75, age: 24, cGP: 135, cG: 4, cA: 22, tGP: 60, tG: 1, tA: 10, value: "ⰵ19.5M", attributes: { spd: 84, sho: 58, pas: 75, dri: 74, def: 75, phy: 70, men: 75, sta: 86 } },
            { no: 7, pos: "LW", nat: "英格兰", name: "威廉斯", rating: 83, height: 178, weight: 73, age: 22, cGP: 110, cG: 35, cA: 42, tGP: 45, tG: 12, tA: 18, value: "ⰵ65M", attributes: { spd: 92, sho: 81, pas: 80, dri: 88, def: 42, phy: 74, men: 82, sta: 85 } },
            { no: 8, pos: "CM", nat: "意大利", name: "托内利", rating: 84, height: 182, weight: 76, age: 26, cGP: 220, cG: 22, cA: 68, tGP: 130, tG: 12, tA: 45, value: "ⰵ48M", attributes: { spd: 78, sho: 72, pas: 88, dri: 82, def: 78, phy: 80, men: 85, sta: 90 } },
            { no: 10, pos: "CM", nat: "丹麦", name: "尼尔森", rating: 80, height: 179, weight: 74, age: 25, cGP: 155, cG: 12, cA: 35, tGP: 90, tG: 6, tA: 18, value: "ⰵ28M", attributes: { spd: 76, sho: 68, pas: 82, dri: 79, def: 74, phy: 72, men: 78, sta: 84 } },
            { no: 9, pos: "ST", nat: "英格兰", name: "里奇", rating: 85, height: 184, weight: 78, age: 24, cGP: 165, cG: 88, cA: 15, tGP: 85, tG: 45, tA: 8, value: "ⰵ75M", attributes: { spd: 88, sho: 89, pas: 70, dri: 82, def: 35, phy: 84, men: 86, sta: 82 } },
            { no: 11, pos: "ST", nat: "英格兰", name: "里格斯", rating: 82, height: 185, weight: 80, age: 25, cGP: 195, cG: 115, cA: 28, tGP: 115, tG: 52, tA: 14, value: "ⰵ45M", attributes: { spd: 82, sho: 85, pas: 72, dri: 78, def: 38, phy: 86, men: 80, sta: 80 } },
            { no: 12, pos: "GK", nat: "西班牙", name: "法布雷加斯", rating: 79, height: 189, weight: 85, age: 23, cGP: 88, cG: 0, cA: 0, tGP: 88, tG: 0, tA: 0, value: "ⰵ15M", attributes: { div: 80, han: 78, kic: 82, ref: 83, spd: 55, pos_s: 78, men: 75, sta: 78 } },
            { no: 13, pos: "LB", nat: "挪威", name: "埃吉尔", rating: 78, height: 175, weight: 71, age: 22, cGP: 65, cG: 2, cA: 15, tGP: 65, tG: 2, tA: 15, value: "ⰵ16M", attributes: { spd: 82, sho: 55, pas: 72, dri: 75, def: 74, phy: 68, men: 72, sta: 82 } },
            { no: 6, pos: "CB", nat: "德国", name: "卡恩", rating: 79, height: 186, weight: 84, age: 23, cGP: 95, cG: 6, cA: 1, tGP: 95, tG: 6, tA: 1, value: "ⰵ18.5M", attributes: { spd: 74, sho: 42, pas: 60, dri: 58, def: 81, phy: 85, men: 79, sta: 80 } },
            { no: 16, pos: "CB", nat: "英格兰", name: "艾利奥特", rating: 77, height: 185, weight: 82, age: 22, cGP: 60, cG: 2, cA: 0, tGP: 60, tG: 2, tA: 0, value: "ⰵ12M", attributes: { spd: 72, sho: 40, pas: 58, dri: 55, def: 78, phy: 83, men: 74, sta: 78 } },
            { no: 24, pos: "RB", nat: "英格兰", name: "亚克森", rating: 76, height: 177, weight: 72, age: 21, cGP: 45, cG: 1, cA: 12, tGP: 45, tG: 1, tA: 12, value: "ⰵ11M", attributes: { spd: 85, sho: 52, pas: 70, dri: 72, def: 70, phy: 68, men: 70, sta: 84 } },
            { no: 14, pos: "CM", nat: "荷兰", name: "德容", rating: 80, height: 181, weight: 75, age: 24, cGP: 125, cG: 8, cA: 22, tGP: 125, tG: 8, tA: 22, value: "ⰵ26M", attributes: { spd: 78, sho: 65, pas: 84, dri: 81, def: 72, phy: 75, men: 79, sta: 88 } },
            { no: 18, pos: "CM", nat: "英格兰", name: "罗杰森", rating: 78, height: 178, weight: 74, age: 20, cGP: 40, cG: 5, cA: 18, tGP: 40, tG: 5, tA: 18, value: "ⰵ24M", attributes: { spd: 80, sho: 70, pas: 80, dri: 82, def: 62, phy: 70, men: 72, sta: 85 } },
            { no: 20, pos: "CDM", nat: "苏格兰", name: "图洛克", rating: 76, height: 180, weight: 78, age: 21, cGP: 55, cG: 1, cA: 8, tGP: 55, tG: 1, tA: 8, value: "ⰵ9.5M", attributes: { spd: 72, sho: 58, pas: 75, dri: 70, def: 78, phy: 80, men: 74, sta: 90 } },
            { no: 17, pos: "ST", nat: "南非", name: "马加拉", rating: 78, height: 182, weight: 77, age: 21, cGP: 50, cG: 22, cA: 5, tGP: 50, tG: 22, tA: 5, value: "ⰵ21M", attributes: { spd: 84, sho: 80, pas: 65, dri: 78, def: 32, phy: 78, men: 75, sta: 80 } },
            { no: 19, pos: "ST", nat: "法国", name: "科纳卡", rating: 79, height: 183, weight: 76, age: 23, cGP: 120, cG: 58, cA: 14, tGP: 55, tG: 24, tA: 6, value: "ⰵ23M", attributes: { spd: 81, sho: 82, pas: 68, dri: 76, def: 36, phy: 80, men: 78, sta: 82 } },
            { no: 21, pos: "ST", nat: "巴西", name: "桑托斯", rating: 77, height: 174, weight: 70, age: 20, cGP: 35, cG: 12, cA: 10, tGP: 35, tG: 12, tA: 10, value: "ⰵ18M", attributes: { spd: 88, sho: 78, pas: 72, dri: 84, def: 30, phy: 68, men: 74, sta: 80 } },
            { no: 30, pos: "GK", nat: "德国", name: "库尔特", rating: 77, height: 186, weight: 83, age: 21, cGP: 30, cG: 0, cA: 0, tGP: 30, tG: 0, tA: 0, value: "ⰵ8M", attributes: { div: 78, han: 75, kic: 74, ref: 80, spd: 50, pos_s: 76, men: 72, sta: 75 } },
            { no: 22, pos: "CB", nat: "西班牙", name: "桑切斯", rating: 77, height: 187, weight: 85, age: 22, cGP: 55, cG: 3, cA: 1, tGP: 55, tG: 3, tA: 1, value: "ⰵ11M", attributes: { spd: 70, sho: 40, pas: 55, dri: 52, def: 79, phy: 84, men: 74, sta: 76 } },
            { no: 23, pos: "CM", nat: "塞尔维亚", name: "古德尔", rating: 76, height: 179, weight: 74, age: 23, cGP: 95, cG: 6, cA: 15, tGP: 45, tG: 3, tA: 8, value: "ⰵ10.5M", attributes: { spd: 74, sho: 62, pas: 78, dri: 75, def: 68, phy: 70, men: 74, sta: 82 } },
            { no: 25, pos: "CAM", nat: "意大利", name: "杰拉迪亚", rating: 76, height: 177, weight: 71, age: 24, cGP: 115, cG: 18, cA: 26, tGP: 40, tG: 5, tA: 11, value: "ⰵ12M", attributes: { spd: 78, sho: 74, pas: 80, dri: 81, def: 52, phy: 65, men: 78, sta: 80 } }
        ]
    },

    // 27. 泽尼联 (Zenith United)
    "泽尼联": {
        color: "#07650c",
        style: "全攻全守",
        stadium: "劳伦特足球场",
        coach: { name: "钟塔西", gp: 581, w: 326, d: 79, l: 176, rate: "56.11%" },
        status: { best: "阴天 · 中午", worst: "雨天 · 早上", injury: "0", tactic: "全攻全守" },
        honors: [
            { name: "世联赛冠军", count: 0, seasons: "暂无", icon: "fas fa-globe-americas", level: "world" },
            { name: "全联冠", count: 1, seasons: "S-77赛季", icon: "fas fa-crown", level: "teal-glow" },
            { name: "全联杯", count: 1, seasons: "13赛季", icon: "fas fa-trophy", level: "teal-glow" },
            { name: "全协联", count: 0, seasons: "暂无", icon: "fas fa-shield-halved", level: "teal-glow" },
            { name: "威超冠军", count: 0, seasons: "暂无", icon: "fas fa-star", level: "blue-glow" },
            { name: "威联赛冠军", count: 0, seasons: "威伊士超级联赛前身", icon: "fas fa-history", level: "blue-glow" },
            { name: "威联赛杯", count: 4, seasons: "威伊士足总杯赛", icon: "fas fa-medal", level: "standard" },
            { name: "社区杯", count: 8, seasons: "社区球队杯赛", icon: "fas fa-award", level: "standard" }
        ],
        coords: {
            LEAGUE: {
                title: "联赛最强阵容 (4-2-3-1)",
                players: {
                    "GK": "奥德拉克", "LB": "库库雷迪亚", "LCB": "迪亚斯", "RCB": "格瓦迪奥", "RB": "阿什拉夫",
                    "LDM": "苏博斯洛伊", "RDM": "阿隆索", "LM": "拉斐尔", "CAM": "德雷姆", "RM": "麦卡雷斯特", "ST": "德赫雷特"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "LDM": [40, 35], "RDM": [40, 65], "LM": [65, 15], "CAM": [65, 50], "RM": [65, 85], "ST": [85, 50]
                }
            },
            CUP: {
                title: "杯赛精英阵容 (4-4-2)",
                players: {
                    "GK": "普斯卡诺", "LB": "马尔库斯", "LCB": "马尔基尼", "RCB": "古雷斯托", "RB": "吉马伦萨",
                    "LM": "若昂", "LCM": "迈凯伦", "RCM": "盖尔", "RM": "图安泽兰", "LST": "莫雷诺", "RST": "姆哈特"
                },
                coords: {
                    "GK": [5, 50], "LB": [22, 10], "LCB": [18, 35], "RCB": [18, 65], "RB": [22, 90],
                    "LM": [50, 10], "LCM": [45, 38], "RCM": [45, 62], "RM": [50, 90], "LST": [80, 35], "RST": [80, 65]
                }
            }
        },
        roster: [
            { no: 1, pos: "GK", nat: "斯洛文尼亚", name: "奥德拉克", rating: 90, height: 188, weight: 87, age: 33, cGP: 450, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ65M", attributes: { div: 88, han: 91, kic: 78, ref: 92, spd: 50, pos_s: 90, men: 93, sta: 75 } },
            { no: 33, pos: "CB", nat: "克罗地亚", name: "格瓦迪奥", rating: 89, height: 185, weight: 80, age: 24, cGP: 180, cG: 5, cA: 4, tGP: 0, tG: 0, tA: 0, value: "ⰵ92M", attributes: { spd: 85, sho: 60, pas: 78, dri: 82, def: 89, phy: 91, men: 84, sta: 90 } },
            { no: 17, pos: "LM", nat: "葡萄牙", name: "拉斐尔", rating: 89, height: 188, weight: 82, age: 26, cGP: 145, cG: 48, cA: 35, tGP: 0, tG: 0, tA: 0, value: "ⰵ110M", attributes: { spd: 93, sho: 84, pas: 80, dri: 92, def: 35, phy: 90, men: 80, sta: 85 } },
            { no: 2, pos: "RB", nat: "摩洛哥", name: "阿什拉夫", rating: 88, height: 181, weight: 73, age: 27, cGP: 310, cG: 18, cA: 65, tGP: 0, tG: 0, tA: 0, value: "ⰵ85M", attributes: { spd: 95, sho: 72, pas: 84, dri: 88, def: 80, phy: 78, men: 82, sta: 92 } },
            { no: 4, pos: "CB", nat: "葡萄牙", name: "迪亚斯", rating: 89, height: 187, weight: 82, age: 29, cGP: 535, cG: 30, cA: 7, tGP: 0, tG: 0, tA: 0, value: "ⰵ82M", attributes: { spd: 78, sho: 55, pas: 72, dri: 68, def: 91, phy: 90, men: 93, sta: 86 } },
            { no: 9, pos: "ST", nat: "荷兰", name: "德赫雷特", rating: 89, height: 184, weight: 79, age: 26, cGP: 380, cG: 200, cA: 36, tGP: 0, tG: 0, tA: 0, value: "ⰵ145M", attributes: { spd: 90, sho: 94, pas: 75, dri: 87, def: 40, phy: 85, men: 86, sta: 82 } },
            { no: 10, pos: "CAM", nat: "比利时", name: "德雷姆", rating: 88, height: 179, weight: 73, age: 27, cGP: 410, cG: 96, cA: 150, tGP: 0, tG: 0, tA: 0, value: "ⰵ105M", attributes: { spd: 84, sho: 83, pas: 93, dri: 90, def: 52, phy: 72, men: 90, sta: 85 } },
            { no: 8, pos: "CDM", nat: "匈牙利", name: "苏博斯洛伊", rating: 87, height: 186, weight: 77, age: 26, cGP: 320, cG: 56, cA: 77, tGP: 0, tG: 0, tA: 0, value: "ⰵ88M", attributes: { spd: 81, sho: 85, pas: 89, dri: 83, def: 78, phy: 82, men: 85, sta: 91 } },
            { no: 3, pos: "LB", nat: "西班牙", name: "库库雷迪亚", rating: 87, height: 173, weight: 68, age: 28, cGP: 455, cG: 18, cA: 80, tGP: 0, tG: 0, tA: 0, value: "ⰵ65M", attributes: { spd: 87, sho: 68, pas: 85, dri: 82, def: 85, phy: 75, men: 83, sta: 95 } },
            { no: 11, pos: "RM", nat: "阿根廷", name: "麦卡雷斯特", rating: 86, height: 177, weight: 72, age: 26, cGP: 305, cG: 50, cA: 70, tGP: 0, tG: 0, tA: 0, value: "ⰵ72M", attributes: { spd: 84, sho: 83, pas: 88, dri: 86, def: 55, phy: 76, men: 85, sta: 88 } },
            { no: 7, pos: "LM", nat: "葡萄牙", name: "若昂", rating: 86, height: 176, weight: 70, age: 25, cGP: 315, cG: 67, cA: 90, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 92, sho: 81, pas: 83, dri: 89, def: 45, phy: 74, men: 82, sta: 86 } },
            { no: 14, pos: "CDM", nat: "西班牙", name: "阿隆索", rating: 86, height: 183, weight: 78, age: 25, cGP: 260, cG: 24, cA: 53, tGP: 0, tG: 0, tA: 0, value: "ⰵ75M", attributes: { spd: 78, sho: 75, pas: 87, dri: 81, def: 83, phy: 85, men: 86, sta: 93 } },
            { no: 5, pos: "RB", nat: "巴西", name: "吉马伦萨", rating: 86, height: 182, weight: 75, age: 27, cGP: 367, cG: 20, cA: 63, tGP: 0, tG: 0, tA: 0, value: "ⰵ60M", attributes: { spd: 86, sho: 62, pas: 82, dri: 81, def: 83, phy: 79, men: 81, sta: 90 } },
            { no: 19, pos: "ST", nat: "西班牙", name: "莫雷诺", rating: 86, height: 181, weight: 74, age: 25, cGP: 230, cG: 110, cA: 24, tGP: 0, tG: 0, tA: 0, value: "ⰵ80M", attributes: { spd: 91, sho: 89, pas: 72, dri: 85, def: 35, phy: 81, men: 81, sta: 82 } },
            { no: 15, pos: "LM", nat: "法国", name: "普斯雷特", rating: 85, height: 175, weight: 69, age: 24, cGP: 260, cG: 54, cA: 86, tGP: 0, tG: 0, tA: 0, value: "ⰵ65M", attributes: { spd: 89, sho: 79, pas: 81, dri: 86, def: 42, phy: 70, men: 79, sta: 85 } },
            { no: 29, pos: "ST", nat: "英格兰", name: "姆哈特", rating: 84, height: 185, weight: 80, age: 23, cGP: 205, cG: 90, cA: 20, tGP: 0, tG: 0, tA: 0, value: "ⰵ62M", attributes: { spd: 86, sho: 87, pas: 68, dri: 79, def: 38, phy: 83, men: 76, sta: 80 } },
            { no: 27, pos: "RM", nat: "乌克兰", name: "津琴科姆", rating: 84, height: 176, weight: 70, age: 25, cGP: 215, cG: 30, cA: 74, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 83, sho: 75, pas: 85, dri: 82, def: 65, phy: 73, men: 81, sta: 86 } },
            { no: 20, pos: "CB", nat: "意大利", name: "古雷斯托", rating: 83, height: 186, weight: 82, age: 24, cGP: 195, cG: 10, cA: 1, tGP: 0, tG: 0, tA: 0, value: "ⰵ30M", attributes: { spd: 73, sho: 40, pas: 62, dri: 60, def: 84, phy: 87, men: 77, sta: 80 } },
            { no: 6, pos: "CB", nat: "巴西", name: "马尔基尼", rating: 83, height: 183, weight: 79, age: 25, cGP: 230, cG: 13, cA: 3, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { spd: 77, sho: 45, pas: 65, dri: 63, def: 85, phy: 82, men: 80, sta: 82 } },
            { no: 21, pos: "CM", nat: "苏格兰", name: "迈凯伦", rating: 83, height: 178, weight: 73, age: 23, cGP: 180, cG: 21, cA: 69, tGP: 0, tG: 0, tA: 0, value: "ⰵ38M", attributes: { spd: 80, sho: 71, pas: 83, dri: 84, def: 70, phy: 73, men: 77, sta: 85 } },
            { no: 12, pos: "RB", nat: "英格兰", name: "迈克尔", rating: 83, height: 180, weight: 75, age: 25, cGP: 200, cG: 7, cA: 53, tGP: 0, tG: 0, tA: 0, value: "ⰵ26M", attributes: { spd: 84, sho: 58, pas: 80, dri: 79, def: 79, phy: 73, men: 76, sta: 88 } },
            { no: 23, pos: "LB", nat: "德国", name: "京多尔尼", rating: 82, height: 174, weight: 68, age: 22, cGP: 130, cG: 5, cA: 30, tGP: 0, tG: 0, tA: 0, value: "ⰵ28M", attributes: { spd: 85, sho: 60, pas: 77, dri: 79, def: 77, phy: 69, men: 75, sta: 86 } },
            { no: 25, pos: "LM", nat: "法国", name: "图安泽兰", rating: 83, height: 172, weight: 67, age: 21, cGP: 90, cG: 12, cA: 37, tGP: 0, tG: 0, tA: 0, value: "ⰵ48M", attributes: { spd: 92, sho: 75, pas: 79, dri: 87, def: 42, phy: 66, men: 74, sta: 88 } },
            { no: 13, pos: "GK", nat: "匈牙利", name: "普斯卡诺", rating: 81, height: 191, weight: 88, age: 23, cGP: 110, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ16M", attributes: { div: 82, han: 78, kic: 80, ref: 83, spd: 50, pos_s: 79, men: 74, sta: 76 } },
            { no: 24, pos: "CDM", nat: "英格兰", name: "盖尔", rating: 81, height: 179, weight: 76, age: 22, cGP: 80, cG: 6, cA: 15, tGP: 0, tG: 0, tA: 0, value: "ⰵ22M", attributes: { spd: 75, sho: 60, pas: 78, dri: 72, def: 79, phy: 78, men: 72, sta: 85 } },
            { no: 35, pos: "LB", nat: "西班牙", name: "马尔库斯", rating: 73, height: 177, weight: 69, age: 17, cGP: 0, cG: 0, cA: 0, tGP: 0, tG: 0, tA: 0, value: "ⰵ15M", attributes: { spd: 88, sho: 55, pas: 72, dri: 80, def: 70, phy: 65, men: 72, sta: 84 } }
        ]
    }
};

/* ===================================================
   VES League 球队详情页核心引擎 - 2026 终极集成版
   =================================================== */

// --- 1. 状态管理 ---
const leagueDatabase = {};
let radarChartInstance = null;
let currentMode = "LEAGUE"; 
let sortOrder = {};
let currentTeam = null;

// --- 2. 数据库补全引擎 ---
function initializeDatabase() {
    if (!window.TEAMS_DATA) {
        console.error("未找到数据源：请确保 TEAMS_DATA 已在 detail.js 之前定义或加载。");
        return false;
    }

    Object.keys(window.TEAMS_DATA).forEach(id => {
        const raw = window.TEAMS_DATA[id];
        const sourceRoster = raw.roster || raw.players || [];
        
        leagueDatabase[id] = {
            name: id,
            logo: raw.logo || `Image/Team Logo/${id}.png`,
            style: raw.style || "战术均衡",
            stadium: raw.stadium || "VES 官方球场",
            coach: raw.coach || { name: "待定", gp: 0, w: 0, d: 0, l: 0, rate: "0%" },
            status: raw.status || { best: "未知", worst: "未知", injury: "0", tactic: "平衡" },
            honors: raw.honors || [],
            players: sourceRoster.map(p => ({
                ...p,
                nat: p.nat || "未知",
                height: p.height || 180,
                weight: p.weight || 75,
                age: p.age || 25,
                cGP: p.cGP || 0, cG: p.cG || 0, cA: p.cA || 0,
                tGP: p.tGP || 0, tG: p.tG || 0, tA: p.tA || 0,
                value: p.value || "ⰵ1.0M",
                attributes: p.attributes || {}
            })),
            coords: raw.coords || {}
        };
    });
    return true;
}

// --- 3. 页面初始化 ---
document.addEventListener("DOMContentLoaded", () => {
    if (!initializeDatabase()) return;

    const urlParams = new URLSearchParams(window.location.search);
    const teamKey = urlParams.get('team') || "阿尔法骑士";
    currentTeam = leagueDatabase[teamKey] || Object.values(leagueDatabase)[0];

    if (currentTeam) {
        // 渲染基础文字
        document.getElementById("dynamic-team-name").innerText = currentTeam.name;
        document.getElementById("dynamic-logo").src = currentTeam.logo;
        document.getElementById("dynamic-style").innerText = `风格：${currentTeam.style}`;
        document.getElementById("dynamic-stadium").innerText = `主场：${currentTeam.stadium}`;
        renderAll();
    }
});

// --- 4. 渲染核心控制 ---
function renderAll() {
    if (!currentTeam) return;

    // 获取当前阵型配置
    const config = currentTeam.coords[currentMode] || Object.values(currentTeam.coords)[0];
    if (!config) return;

    const xiNames = Object.values(config.players || {});
    const xi = currentTeam.players.filter(p => xiNames.includes(p.name));
    const subs = currentTeam.players.filter(p => !xiNames.includes(p.name));

    // 1. 阵型文本
    document.getElementById("currentLineupText").textContent = `阵容：${config.title}`;

    // 2. 依次渲染所有模块
    renderTable(xi, "#mainPlayerTable");
    renderTable(subs, "#subsTable");
    syncPitch(config); 
    renderStrength(xi);     
    renderStatus(currentTeam.status); 
    renderHonors(currentTeam.honors); 
    renderCoach(currentTeam.coach);   
    renderBottomStats();              
}

// --- 5. 渲染子函数 ---

function renderHonors(honors) {
    const el = document.getElementById("teamHonors");
    if (!el) return;
    el.innerHTML = honors.length ? honors.map(h => `
        <div class="honor-card ${h.level}">
            <div class="honor-icon-wrapper">
                <i class="${h.icon}"></i>
                <span class="honor-count">${h.count}</span>
            </div>
            <div class="honor-info">
                <div style="font-weight:bold; color:#fff;">${h.name}</div>
                <div style="font-size:10px; opacity:0.6;">${h.seasons}</div>
            </div>
        </div>`).join('') : '<p style="color:#64748b; padding-left:15px;">暂无荣誉记录</p>';
}

function renderStrength(xi) {
    const el = document.getElementById("strengthStats");
    if (!el) return;
    const avgXi = (xi.reduce((m, n) => m + n.rating, 0) / (xi.length || 1)).toFixed(1);
    const avgAll = (currentTeam.players.reduce((m, n) => m + n.rating, 0) / currentTeam.players.length).toFixed(1);
    el.innerHTML = `
        <div class="stat-card"><span>首发评分</span><strong>${avgXi}</strong></div>
        <div class="stat-card"><span>全队评分</span><strong>${avgAll}</strong></div>
    `;
}

function renderStatus(status) {
    const el = document.getElementById("teamStatusGrid");
    if (!el) return;
    const labels = { best: "最佳环境", worst: "最差环境", injury: "伤情禁赛", tactic: "战术倾向" };
    el.innerHTML = Object.entries(status).map(([k, v]) => `
        <div class="stat-card"><span>${labels[k] || k}</span><strong>${v}</strong></div>
    `).join('');
}

function renderCoach(c) {
    const el = document.getElementById("coachInfoBody");
    if (!el) return;
    el.innerHTML = `
        <tr>
            <td style="font-weight:bold; color:#fff;">${c.name}</td>
            <td>${c.gp}</td><td>${c.w}</td><td>${c.d}</td><td>${c.l}</td>
            <td style="color:#00f5ff; font-weight:bold;">${c.rate}</td>
        </tr>`;
}

function renderBottomStats() {
    const el = document.getElementById("teamStats");
    if (!el) return;
    const totalV = currentTeam.players.reduce((s, p) => s + (parseFloat(p.value.replace(/[^\d.]/g, '')) || 0), 0);
    el.innerHTML = `
        <div class="stat-card"><span>身价总值</span><strong>ⰵ${totalV.toFixed(1)}M</strong></div>
        <div class="stat-card"><span>注册人数</span><strong>${currentTeam.players.length} 名</strong></div>
    `;
}

function renderTable(players, selector) {
    const tbody = document.querySelector(`${selector} tbody`);
    if (!tbody) return;
    tbody.innerHTML = players.map(p => `
        <tr data-name="${p.name}" data-pos="${p.pos}" onclick="window.openPlayerModal(this)">
            <td style="color:#94a3b8; font-weight:bold;">${p.no}</td>
            <td><span class="pos-badge ${getPositionClass(p.pos)}">${p.pos}</span></td>
            <td>${p.nat}</td>
            <td style="text-align:left; padding-left:15px; font-weight:bold;">${p.name}</td>
            <td><strong class="${getRatingClass(p.rating)}">${p.rating}</strong></td>
            <td>${p.height}cm</td><td>${p.weight}kg</td><td>${p.age}</td>
            <td>${p.cGP}</td><td>${p.cG}</td><td>${p.cA}</td>
            <td>${p.tGP}</td><td>${p.tG}</td><td>${p.tA}</td>
            <td class="value-text">${p.value}</td>
        </tr>`).join('');
}

// --- 6. 阵型逻辑 (修复偏移问题) ---
function syncPitch(config) {
    const pitch = document.getElementById('pitchContainer');
    if (!pitch) return;

    // 清除旧标签
    document.querySelectorAll('.player.dynamic-pos').forEach(el => el.remove());

    // 遍历阵型配置
    for (const [tag, name] of Object.entries(config.players)) {
        const p = currentTeam.players.find(x => x.name === name);
        if (!p) continue;
        
        const coords = config.coords[tag];
        if (!coords) continue;

        const el = document.createElement('div');
        el.className = 'player dynamic-pos';
        
        // 关键：JS 只传百分比位置，居中由 CSS transform 负责
        el.style.bottom = coords[0] + '%';
        el.style.left = coords[1] + '%';
        
        el.innerHTML = `
            <div class="player-no">${p.no}</div>
            <div class="player-meta">
                <div class="player-pos-label">${tag}</div> <div class="${getRatingClass(p.rating)}">${p.rating}</div>
            </div>
        `;
        
        el.onclick = (e) => { 
            e.stopPropagation(); 
            highlightRow(p.name); 
        };
        pitch.appendChild(el);
    }
}

// --- 7. 交互 & 弹窗逻辑 ---
window.openPlayerModal = function (row) {
    const name = row.getAttribute("data-name");
    const p = currentTeam.players.find(x => x.name === name);
    if (!p) return;

    const isGK = p.pos.includes("GK");
    const labelMap = isGK ?
        { div: "下潜", han: "手持", kic: "脚力", ref: "反应", spd: "速度", pos_s: "站位", men: "心理", sta: "体能" } :
        { spd: "速度", sho: "射门", pas: "传球", dri: "盘带", def: "拦截", phy: "身体", men: "心理", sta: "体能" };

    const attrHtml = Object.entries(p.attributes).map(([key, val]) => {
        const rClass = getRatingClass(val);
        return `
            <div style="margin-bottom: 10px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
                    <span style="color:#94a3b8;">${labelMap[key] || key}</span>
                    <strong class="${rClass}">${val}</strong>
                </div>
                <div class="attr-bar-container">
                    <div class="attr-bar-fill ${rClass.replace('rating', 'bg-rating')}" style="width:${val}%;"></div>
                </div>
            </div>`;
    }).join('');

    document.getElementById("modalBody").innerHTML = `
        <div style="text-align:center; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:15px;">
            <h2 class="${getRatingClass(p.rating)}" style="margin:0; font-size:24px;">[${p.no}] ${p.name}</h2>
            <p style="color:#94a3b8; font-size:12px; margin:5px 0;">${p.nat} | ${p.pos} | ${p.height}cm / ${p.weight}kg | ${p.age}岁</p>
            <p style="color:#00f5ff; font-weight:bold; margin:0;">估值：${p.value}</p>
        </div>
        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:20px;">
            <div>
                <div style="background:rgba(255,255,255,0.02); padding:12px; border-radius:10px; font-size:12px;">
                    <h4 style="color:#00f5ff; margin:0 0 5px 0;">生涯概览</h4>
                    出场 ${p.cGP} | 进球 ${p.cG} | 助攻 ${p.cA}
                </div>
                <div style="height:180px; margin-top:15px;"><canvas id="playerRadarCanvas"></canvas></div>
            </div>
            <div>${attrHtml}</div>
        </div>
    `;

    document.getElementById("playerModal").style.display = "flex";
    if (window.Chart) setTimeout(() => initRadar(p, labelMap), 50);
};

function initRadar(p, labels) {
    const ctx = document.getElementById('playerRadarCanvas').getContext('2d');
    if (radarChartInstance) radarChartInstance.destroy();
    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.values(labels),
            datasets: [{
                data: Object.values(p.attributes),
                backgroundColor: 'rgba(0, 245, 255, 0.2)',
                borderColor: '#00f5ff',
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: { 
            scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' } } },
            plugins: { legend: { display: false } },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// --- 8. 工具功能 ---
window.switchLineup = (mode) => {
    currentMode = mode;
    document.querySelectorAll('.lineup-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${mode}`).classList.add('active');
    renderAll();
};

window.applyFilter = () => {
    const val = document.querySelector(".positionFilter").value;
    document.querySelectorAll(".player-table tbody tr").forEach(r => {
        const pos = r.getAttribute("data-pos");
        let group = "OTHER";
        if (pos.includes("GK")) group = "GK";
        else if (pos.includes("CB") || pos.includes("LB") || pos.includes("RB")) group = "DF";
        else if (pos.includes("M")) group = "MF";
        else if (pos.includes("ST") || pos.includes("LW") || pos.includes("RW")) group = "FW";
        r.style.display = (val === "all" || group === val) ? "" : "none";
    });
};

window.sortByColumn = (tableId, col) => {
    const tbody = document.querySelector(`#${tableId} tbody`);
    const rows = Array.from(tbody.querySelectorAll("tr"));
    const key = `${tableId}-${col}`;
    sortOrder[key] = !sortOrder[key];
    rows.sort((a, b) => {
        let vA = a.cells[col].innerText.trim();
        let vB = b.cells[col].innerText.trim();
        let nA = parseFloat(vA.replace(/[^\d.-]/g, ''));
        let nB = parseFloat(vB.replace(/[^\d.-]/g, ''));
        if (!isNaN(nA) && !isNaN(nB)) return sortOrder[key] ? nA - nB : nB - nA;
        return sortOrder[key] ? vA.localeCompare(vB, 'zh-CN') : vB.localeCompare(vA, 'zh-CN');
    });
    rows.forEach(r => tbody.appendChild(r));
};

window.closeModal = () => document.getElementById("playerModal").style.display = "none";

function highlightRow(name) {
    document.querySelectorAll("tr").forEach(r => r.classList.remove("active-player-row"));
    const t = document.querySelector(`tr[data-name="${name}"]`);
    if (t) {
        t.classList.add("active-player-row");
        t.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function getRatingClass(r) {
    if (r >= 90) return 'rating-elite';
    if (r >= 85) return 'rating-excellent';
    if (r >= 80) return 'rating-good';
    return 'rating-average';
}

function getPositionClass(pos) {
    if (pos.includes("GK")) return "pos-GK";
    if (pos.includes("CB") || pos.includes("LB") || pos.includes("RB")) return "pos-DF";
    if (pos.includes("ST") || pos.includes("LW") || pos.includes("RW")) return "pos-FW";
    return "pos-MF";
}
