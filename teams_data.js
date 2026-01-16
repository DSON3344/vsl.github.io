window.TEAMS_DATA = {
    "阿尔法骑士": {
        color: "#3b82f6", style: "快速反击", stadium: "奥德赛足球场", 
        coords: { "GK":[5,50], "LCB":[22,25], "CB":[18,50], "RCB":[22,75], "LWB":[48,10], "RWB":[48,90], "LDM":[42,35], "RDM":[42,65], "CAM":[65,50], "LST":[85,38], "RST":[85,62] },
        roster: [
            { pos: "GK", name: "阿利·布克", rating: 89 }, { pos: "LCB", name: "莱昂斯", rating: 83 }, { pos: "CB", name: "范·博梅尔", rating: 91 }, { pos: "RCB", name: "特尔森", rating: 82 },
            { pos: "LWB", name: "斯滕斯", rating: 81 }, { pos: "RWB", name: "加西亚", rating: 84 }, { pos: "LDM", name: "卡尔·施密特", rating: 88 }, { pos: "RDM", name: "卢卡斯", rating: 85 },
            { pos: "CAM", name: "伊斯塔", rating: 83 }, { pos: "LST", name: "梅泽", rating: 86 }, { pos: "RST", name: "安德烈", rating: 85 }
        ]
    },

    "猎豹": {
        color: "#fbbf24", style: "极致压制", stadium: "歌德尼特足球场", 
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "LDM":[45,38], "RDM":[45,62], "LW":[75,15], "RW":[75,85], "LST":[85,38], "RST":[85,62] },
        roster: [
            { pos: "GK", name: "亨德森", rating: 88 }, { pos: "LB", name: "戴维斯", rating: 90 }, { pos: "LCB", name: "佩德斯", rating: 91 }, { pos: "RCB", name: "丹尼尔", rating: 87 },
            { pos: "RB", name: "帕奎奥", rating: 88 }, { pos: "LDM", name: "凯恩斯", rating: 91 }, { pos: "RDM", name: "拉希姆", rating: 88 }, { pos: "LW", name: "拉凯德", rating: 91 },
            { pos: "RW", name: "维罗尼克", rating: 89 }, { pos: "LST", name: "司炎尚武", rating: 90 }, { pos: "RST", name: "米林特维奇", rating: 89 }
        ]
    },

    "切狐": {
        color: "#1e3a8a", style: "双核爆破", stadium: "荷鲁斯足球场",
        coords: { "GK":[5,50], "LCB":[22,25], "CB":[18,50], "RCB":[22,75], "CDM":[40,50], "LM":[55,12], "RM":[55,88], "CM":[58,50], "CAM":[72,50], "LST":[85,35], "RST":[85,65] },
        roster: [
            { pos: "GK", name: "加扎尼斯", rating: 86 }, { pos: "LCB", name: "努诺", rating: 84 }, { pos: "CB", name: "德约科维奇", rating: 86 }, { pos: "RCB", name: "法波", rating: 84 },
            { pos: "CDM", name: "克莱恩", rating: 87 }, { pos: "LM", name: "格林纳尔", rating: 87 }, { pos: "RM", name: "贝尔", rating: 87 }, { pos: "CM", name: "普拉迪亚", rating: 88 },
            { pos: "CAM", name: "扎法", rating: 89 }, { pos: "LST", name: "杰米", rating: 92 }, { pos: "RST", name: "席尔瓦", rating: 92 }
        ]
    },

    // 4. 岚 (Arashi)
    "岚": {
        color: "#10b981", style: "稳固防守", stadium: "东方足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[18,35], "RCB":[18,65], "RB":[25,90], "CDM":[40,50], "LCM":[55,32], "RCM":[55,68], "LM":[62,12], "RM":[62,88], "ST":[86,50] },
        roster: [
            { pos: "GK", name: "雷恩", rating: 81 }, { pos: "LB", name: "比萨卡", rating: 87 }, { pos: "LCB", name: "阿克塞尔", rating: 84 }, { pos: "RCB", name: "马斯切拉诺", rating: 83 },
            { pos: "RB", name: "阿方索", rating: 82 }, { pos: "CDM", name: "普拉维尼", rating: 84 }, { pos: "LCM", name: "萨比策", rating: 82 }, { pos: "RCM", name: "弗朗吉", rating: 78 },
            { pos: "LM", name: "安利克", rating: 81 }, { pos: "RM", name: "斯顿斯", rating: 80 }, { pos: "ST", name: "梅西亚", rating: 81 }
        ]
    },

    // 5. 蜜蜂 (Bees)
    "蜜蜂": {
        color: "#facc15", style: "中路渗透", stadium: "黄蜂足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "LDM":[42,35], "RDM":[42,65], "LM":[65,15], "CAM":[62,50], "RM":[65,85], "ST":[86,50] },
        roster: [
            { pos: "GK", name: "德约罗", rating: 84 }, { pos: "LB", name: "特雷森", rating: 80 }, { pos: "LCB", name: "布朗", rating: 84 }, { pos: "RCB", name: "伊恩", rating: 83 },
            { pos: "RB", name: "卡纳威", rating: 80 }, { pos: "LDM", name: "克斯特里奇", rating: 83 }, { pos: "RDM", name: "埃斯托", rating: 82 }, { pos: "LM", name: "万亚尔", rating: 77 },
            { pos: "CAM", name: "卢卡·莫德", rating: 85 }, { pos: "RM", name: "赫南德斯", rating: 79 }, { pos:"ST" ,name:"卡瓦龙" ,rating :80 }
        ]
    },

    // 6. 狂蜂 (Crazbee)
    "狂蜂": {
        color: "#eab308", style: "极致防守反击", stadium: "里维尔足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[18,35], "RCB":[18,65], "RB":[25,90], "LDM":[40,35], "RDM":[40,65], "CAM":[60,50], "LM":[72,15], "RM":[72,85], "ST":[86,50] },
        roster: [
            { pos: "GK", name: "斯莱斯欧", rating: 90 }, { pos: "LB", name: "德斯特", rating: 87 }, { pos: "LCB", name: "范德克", rating: 94 }, { pos: "RCB", name: "鲁本斯", rating: 91 },
            { pos: "RB", name: "拉米欧斯", rating: 89 }, { pos: "LDM", name: "坎德", rating: 90 }, { pos: "RDM", name: "索萨", rating: 88 }, { pos: "CAM", name: "帕尔诺", rating: 88 },
            { pos: "LM", name: "特里", rating: 87 }, { pos:"RM" ,name:"特劳纳多" ,rating :92 }, { pos:"ST" ,name:"瓦尔" ,rating :91 }
        ]
    },

    // 7. 龙王宫殿 (Dragon Palace)
    "龙王宫殿": {
        color: "#dc2626", style: "区域联防", stadium: "伊泽勒斯足球场",
        coords: { "GK":[5,50], "LCB":[20,28], "CB-中":[16,50], "RCB":[20,72], "CDM":[38,50], "LM":[58,12], "LCM":[55,35], "RCM":[55,65], "RM":[58,88], "LST":[85,38], "RST":[85,62] },
        roster: [
            { pos: "GK", name: "菲戈", rating: 88 }, { pos: "LCB", name: "阿兹兰", rating: 89 }, { pos: "CB-中", name: "卢西奥", rating: 91 }, { pos: "RCB", name: "玉本太郎", rating: 87 },
            { pos: "CDM", name: "罗德里·戈萨", rating: 90 }, { pos: "LM", name: "罗德里戈", rating: 88 }, { pos: "LCM", name: "莫雷", rating: 91 }, { pos: "RCM", name: "沃克", rating: 87 },
            { pos: "RM", name: "戴巴利亚", rating: 86 }, { pos:"LST" ,name:"莫雷拉" ,rating :92 }, { pos:"RST" ,name:"范德维奇" ,rating :89 }
        ]
    },

    // 8. 飞鹰 (Eagles)
    "飞鹰": {
        color: "#60a5fa", style: "边路突破", stadium: "天空体育场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "CDM":[45,50], "LCM":[58,28], "RCM":[58,72], "LW":[82,15], "ST":[86,50], "RW":[82,85] },
        roster: [
            { pos: "GK", name: "阿奎拉", rating: 72 }, { pos: "LB", name: "赫隆", rating: 70 }, { pos: "LCB", name: "克雷亚", rating: 73 }, { pos: "RCB", name: "哈德森", rating: 71 },
            { pos: "RB", name: "斯威夫特", rating: 72 }, { pos: "CDM", name: "埃德勒", rating: 71 }, { pos: "LCM", name: "霍克", rating: 74 }, { pos: "RCM", name: "佩雷格林", rating: 75 },
            { pos: "LW", name: "范加尔", rating: 74 }, { pos:"RW" ,name:"塔隆" ,rating :73 }, { pos:"ST" ,name:"贝尔纳" ,rating :76 }
        ]
    },

    // 9. 炎狼 (Fire Wolf)
    "炎狼": {
        color: "#f97316", style: "高位逼抢", stadium: "星际足球场",
        coords: { "GK":[5,50], "LCB":[20,28], "CB":[16,50], "RCB":[20,72], "LWB":[42,12], "LDM":[45,38], "RDM":[45,62], "CAM":[62,50], "RWB":[42,88], "LST":[85,38], "RST":[85,62] },
        roster: [
            { pos: "GK", name: "弗莱尔", rating: 76 }, { pos: "LCB", name: "伊格内修斯", rating: 74 }, { pos: "CB", name: "萨拉曼德", rating: 80 }, { pos: "RCB", name: "伯内尔", rating: 72 },
            { pos: "LWB", name: "布雷斯", rating: 71 }, { pos: "LDM", name: "恩博", rating: 73 }, { pos: "RDM", name: "派罗", rating: 78 }, { pos: "CAM", name: "赫利奥斯", rating: 75 },
            { pos: "RWB", name: "菲尼克斯", rating: 74 }, { pos:"LST" ,name:"沃尔卡诺" ,rating :79 }, { pos:"RST" ,name:"因弗诺" ,rating :76 }
        ]
    },

    // 10. 金狮 (Golden Lion)
    "金狮": {
        color: "#f59e0b", style: "攻击性控球", stadium: "莱昂内尔足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "LDM":[45,38], "RDM":[45,62], "LW":[75,12], "RW":[75,88], "LST":[85,38], "RST":[85,62] },
        roster: [
            { pos: "GK", name: "格温", rating: 82 }, { pos: "LB", name: "利桑德罗", rating: 85 }, { pos: "LCB", name: "德谟克利特", rating: 86 }, { pos: "RCB", name: "瓦尔内", rating: 85 },
            { pos: "RB", name: "拉比奥特", rating: 86 }, { pos: "LDM", name: "托内利", rating: 88 }, { pos: "RDM", name: "凯文·布雷恩", rating: 87 }, { pos: "LW", name: "迪斯特法诺", rating: 87 },
            { pos: "RW", name: "赫雷拉", rating: 85 }, { pos:"LST" ,name:"罗伯特·维克" ,rating :90 }, { pos:"RST" ,name:"桑奇斯" ,rating :89 }
        ]
    },

    // 11. 科摩多尊龙 (Komodo Dragon)
    "科摩多尊龙": {
        color: "#166534", style: "核心终结", stadium: "埃斯图丁足球场",
        coords: { "GK":[5,50], "LB":[32,10], "LCB":[20,28], "CB":[16,50], "RCB":[20,72], "RB":[32,90], "LCM":[55,28], "CM":[52,50], "RCM":[55,72], "LST":[85,38], "RST":[85,62] },
        roster: [
            { pos: "GK", name: "贾布拉罕", rating: 85 }, { pos: "LB", name: "阿诺舍瓦", rating: 83 }, { pos: "LCB", name: "多尔瓦", rating: 80 }, { pos: "CB", name: "萨内", rating: 81 },
            { pos: "RCB", name: "索萨", rating: 84 }, { pos: "RB", name: "莱尔斯", rating: 83 }, { pos: "LCM", name: "布林德", rating: 84 }, { pos: "CM", name: "费德里克", rating: 83 },
            { pos: "RCM", name: "莫尔德", rating: 83 }, { pos:"LST" ,name:"多拉贡" ,rating :85 }, { pos:"RST" ,name:"王泽伦" ,rating :82 }
        ]
    },

    // 12. 拉普兰德 (Lapland)
    "拉普兰德": {
        color: "#22d3ee", style: "高强度反抢", stadium: "基尔科德足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "CDM":[45,50], "CM-L":[58,28], "CM-R":[58,72], "LW":[82,15], "ST":[86,50], "RW":[82,85] },
        roster: [
            { pos: "GK", name: "诺德", rating: 78 }, { pos: "LB", name: "埃里克森", rating: 76 }, { pos: "LCB", name: "伯格", rating: 79 }, { pos: "RCB", name: "约根森", rating: 81 },
            { pos: "RB", name: "拉尔森", rating: 77 }, { pos: "CDM", name: "赫斯特", rating: 78 }, { pos: "CM-L", name: "斯文森", rating: 80 }, { pos: "CM-R", name: "索伦森", rating: 82 },
            { pos: "LW", name: "阿斯特里德", rating: 79 }, { pos:"RW" ,name:"芬恩" ,rating :77 }, { pos:"ST" ,name:"尼尔森" ,rating :84 }
        ]
    },

    // 13. 花豹 (Leopards)
    "花豹": {
        color: "#fde047", style: "高位逼抢", stadium: "克莱德足球场",
        coords: { "GK":[5,50], "LB":[22,10], "LCB":[18,35], "RCB":[18,65], "RB":[22,90], "LCM":[50,28], "CM":[45,50], "RCM":[50,72], "LW":[82,15], "ST":[86,50], "RW":[82,85] },
        roster: [
            { pos: "GK", name: "马丁尼斯", rating: 82 }, { pos: "LB", name: "迈克尔", rating: 80 }, { pos: "LCB", name: "马科斯", rating: 82 }, { pos: "RCB", name: "孔帕内", rating: 84 },
            { pos: "RB", name: "门德兹", rating: 81 }, { pos: "LCM", name: "朴智胜", rating: 82 }, { pos: "CM", name: "阿尔格莱", rating: 82 }, { pos: "RCM", name: "库尔图", rating: 81 },
            { pos: "LW", name: "布伦南", rating: 82 }, { pos:"ST" ,name:"哈里" ,rating :87 }, { pos:"RW" ,name:"马内斯" ,rating :85 }
        ]
    },

    // 14. 罗联 (Los United)
    "罗联": {
        color: "#1e1b4b", style: "极致攻击性控球", stadium: "罗伯森足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "CDM":[45,50], "LCM":[60,28], "RCM":[60,72], "LW":[82,15], "ST":[86,50], "RW":[82,85] },
        roster: [
            { pos: "GK", name: "法拉第", rating: 92 }, { pos: "LB", name: "罗梅罗", rating: 88 }, { pos: "LCB", name: "蒂亚戈", rating: 89 }, { pos: "RCB", name: "艾特维尔德", rating: 89 },
            { pos: "RB", name: "达伦特", rating: 87 }, { pos: "CDM", name: "维蒂尼亚", rating: 90 }, { pos: "LCM", name: "艾迪森", rating: 90 }, { pos: "RCM", name: "帕耶罗", rating: 89 },
            { pos: "LW", name: "罗德里奇", rating: 89 }, { pos:"ST" ,name:"巴洛蒂" ,rating :90 }, { pos:"RW" ,name:"桑乔" ,rating :92 }
        ]
    },

    // 15. 猛虎 (Mighty Tiger)
    "猛虎": {
        color: "#fb923c", style: "极致攻击性控球", stadium: "罗伯森足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "LCM":[45,25], "CM":[42,50], "RCM":[45,75], "LAM":[65,35], "RAM":[65,65], "ST":[86,50] },
        roster: [
            { pos: "GK", name: "麦尼耶", rating: 88 }, { pos: "LB", name: "加图索", rating: 86 }, { pos: "LCB", name: "格瓦蒂内斯", rating: 85 }, { pos: "RCB", name: "诺瓦辛格", rating: 85 },
            { pos: "RB", name: "儒日内奥", rating: 86 }, { pos: "LCM", name: "佩里西吉", rating: 85 }, { pos: "CM", name: "孔德", rating: 83 }, { pos: "RCM", name: "维纳尔", rating: 84 },
            { pos: "LAM", name: "沃特劳斯", rating: 87 }, { pos:"RAM" ,name:"伍迪" ,rating :84 }, { pos:"ST" ,name:"鲁尼尔" ,rating :85 }
        ]
    },

    // 16. 普雷斯顿 (Preston)
    "普雷斯顿": {
        color: "#ffffff", style: "压缩空间", stadium: "格里芬足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "LCM":[48,28], "CM":[45,50], "RCM":[48,72], "LW":[78,15], "ST":[85,50], "RW":[78,85] },
        roster: [
            { pos: "GK", name: "萨坦", rating: 80 }, { pos: "LB", name: "维克托", rating: 81 }, { pos: "LCB", name: "罗宾", rating: 81 }, { pos: "RCB", name: "奥巴内", rating: 79 },
            { pos: "RB", name: "道森", rating: 77 }, { pos: "LCM", name: "恩佐", rating: 81 }, { pos: "CM", name: "穆克尔", rating: 80 }, { pos: "RCM", name: "夏奇拉", rating: 80 },
            { pos: "LW", name: "埃兰加", rating: 78 }, { pos:"ST" ,name:"胡里奥" ,rating :82 }, { pos:"RW" ,name:"孙兴浩" ,rating :80 }
        ]
    },

    // 17. 猛龙 (Raptors)
    "猛龙": {
        color: "#ef4444", style: "窒息式逼抢", stadium: "罗斯顿公园球场",
        coords: { "GK":[5,50],"LB":[22,10],"LCB":[18,35],"RCB":[18,65],"RB":[22,90],"LDM":[40,35],"RDM":[40,65],"LW":[65,15],"CAM":[65,50],"RW":[65,85],"ST":[85,50] },
        roster: [
            { pos: "GK", name: "皮克勒", rating: 90 }, { pos: "LB", name: "拉斐尔", rating: 89 }, { pos: "LCB", name: "马奎塔", rating: 91 }, { pos: "RCB", name: "金旻奎", rating: 90 },
            { pos: "RB", name: "罗梅罗", rating: 89 }, { pos: "LDM", name: "皮尔萨", rating: 90 }, { pos: "RDM", name: "蒂尔尼", rating: 91 }, { pos: "LW", name: "斯丁格", rating: 93 },
            { pos: "CAM", name: "德布鲁诺", rating: 93 }, { pos:"RW" ,name:"拉米雷斯" ,rating :90 }, { pos:"ST" ,name:"杰拉尔" ,rating :95 }
        ]
    },

    // 18. 雷克夏 (Rexia)
    "雷克夏": {
        color: "#6366f1", style: "全面攻守", stadium: "赫罗斯足球场",
        coords: { "GK":[5,50], "LB":[22,10], "LCB":[18,35], "RCB":[18,65], "RB":[22,90], "LDM":[40,35], "RDM":[40,65], "LM":[65,15], "CAM":[65,50], "RM":[65,85], "ST":[85,50] },
        roster: [
            { pos: "GK", name: "卡洛斯", rating: 75 }, { pos: "LB", name: "埃德加", rating: 71 }, { pos: "LCB", name: "瓦伦丁", rating: 75 }, { pos: "RCB", name: "罗德里", rating: 79 },
            { pos: "RB", name: "哈维", rating: 73 }, { pos: "LDM", name: "塞尔吉", rating: 73 }, { pos: "RDM", name: "莫德", rating: 75 }, { pos: "LM", name: "佩德罗", rating: 73 },
            { pos:"CAM" ,name:"雷奥" ,rating :80 }, { pos:"RM" ,name:"卢卡斯" ,rating :73 }, { pos:"ST" ,name:"克里斯蒂安" ,rating :76 }
        ]
    },

    // 19. 罗杰剧院 (Roger Theatre)
    "罗杰剧院": {
        color: "#be123c", style: "极致摆大巴 + 造越位", stadium: "罗杰斯歌剧院球场",
        coords: { "GK":[5,50], "LB":[20,12], "LCB":[18,31], "CB":[15,50], "RCB":[18,69], "RB":[20,88], "LM":[48,15], "LCM":[45,38], "RCM":[45,62], "RM":[48,85], "ST":[85,50] },
        roster: [
            { pos: "GK", name: "波特", rating: 81 }, { pos: "LB", name: "谭德萨", rating: 75 }, { pos: "LCB", name: "德米尔", rating: 81 }, { pos: "CB", name: "哈坎", rating: 82 },
            { pos: "RCB", name: "哈雷森", rating: 75 }, { pos: "RB", name: "豪斯", rating: 78 }, { pos: "LM", name: "马杰斯", rating: 79 }, { pos: "LCM", name: "米斯特", rating: 80 },
            { pos:"RCM" ,name:"桑保罗" ,rating :80 }, { pos:"RM" ,name:"奥德赛" ,rating :78 }, { pos:"ST" ,name:"巴洛" ,rating :80 }
        ]
    },

    // 20. 森利西亚虎 (Senlicia Tiger)
    "森利西亚虎": {
        color: "#0f766e", style: "暴力突击", stadium: "世源足球场",
        coords: { "GK":[5,50], "LCB":[20,28], "CB":[16,50], "RCB":[20,72], "LM":[48,12], "LCM":[42,38], "RCM":[42,62], "RM":[48,88], "LW":[78,18], "ST":[85,50], "RW":[78,82] },
        roster: [
            { pos: "GK", name: "汉达诺威基", rating: 85 }, { pos: "LCB", name: "泽尼特", rating: 85 }, { pos: "CB", name: "巴斯托古", rating: 85 }, { pos: "RCB", name: "普拉迪姆", rating: 85 },
            { pos: "LM", name: "穆克什尼", rating: 84 }, { pos: "LCM", name: "德川信治", rating: 91 }, { pos: "RCM", name: "迪奥利", rating: 86 }, { pos: "RM", name: "布什", rating: 84 },
            { pos:"LW" ,name:"拉什·德福" ,rating :87 }, { pos:"ST" ,name:"法罗莱纳" ,rating :85 }, { pos:"RW" ,name:"斯特罗" ,rating :85 }
        ]
    },

    // 21. 威龙 (Vejron)
    "威龙": {
        color: "#ffffff", style: "全能反击", stadium: "威灵顿足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "CDM":[45,50], "LCM":[58,28], "RCM":[58,72], "LW":[82,15], "ST":[86,50], "RW":[82,85] },
        roster: [
            { pos: "GK", name: "奥斯卡", rating: 90 }, { pos: "LB", name: "郑宰明", rating: 88 }, { pos: "LCB", name: "陆坚", rating: 90 }, { pos: "RCB", name: "佩奎", rating: 89 },
            { pos: "RB", name: "卡瓦尼斯", rating: 88 }, { pos: "CDM", name: "梅诺", rating: 88 }, { pos: "LCM", name: "丁智寅", rating: 94 }, { pos: "RCM", name: "范德容", rating: 88 },
            { pos: "LW", name: "内达尔", rating: 89 }, { pos: "ST", name: "金海秀", rating: 94 }, { pos: "RW", name: "马尔奎托", rating: 90 }
        ]
    },

    // 22. 华尔兹 (Waltz)
    "华尔兹": {
        color: "#8b5cf6", style: "三叉戟齐飞", stadium: "华兰街足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "CDM":[45,50], "LCM":[58,28], "RCM":[58,72], "LW":[82,15], "ST":[86,50], "RW":[82,85] },
        roster: [
            { pos: "GK", name: "斯帕雷恩", rating: 84 }, { pos: "LB", name: "马提普", rating: 84 }, { pos: "LCB", name: "扎卡", rating: 85 }, { pos: "RCB", name: "克林顿", rating: 87 },
            { pos: "RB", name: "范·德萨克", rating: 85 }, { pos: "CDM", name: "洛佩斯", rating: 88 }, { pos: "LCM", name: "克里斯蒂安", rating: 85 }, { pos: "RCM", name: "法布雷特", rating: 86 },
            { pos:"LW" ,name:"奥赛梅恩" ,rating :87 }, { pos:"ST" ,name:"德拉西亚" ,rating :88 }, { pos:"RW" ,name:"坎波拉" ,rating :86 }
        ]
    },

    // 23. 沃特梅兹 (Wat Mez)
    "沃特梅兹": {
        color: "#06b6d4", style: "亚洲风暴", stadium: "麒麟公园足球场",
        coords: { "GK":[5,50], "LCB":[22,25], "CB":[18,50], "RCB":[22,75], "LDM":[42,35], "RDM":[42,65], "LM":[58,12], "RM":[58,88], "CAM":[65,50], "LST":[85,38], "RST":[85,62] },
        roster: [
            { pos: "GK", name: "诺伊尔", rating: 90 }, { pos: "LCB", name: "金载沅", rating: 86 }, { pos: "CB", name: "富安义一", rating: 89 }, { pos: "RCB", name: "金正贤", rating: 84 },
            { pos: "LDM", name: "远藤胜", rating: 83 }, { pos: "RDM", name: "林南俊", rating: 83 }, { pos: "LM", name: "孙一峰", rating: 88 }, { pos: "RM", name: "安宰旭", rating: 85 },
            { pos: "CAM", name: "三苫健绪", rating: 87 }, { pos:"LST" ,name:"本田魁梧" ,rating :86 }, { pos:"RST" ,name:"长野和人" ,rating :86 }
        ]
    },

    // 24. 威尔顿联 (Weldon United)
    "威尔顿联": {
        color: "#a8a29e", style: "中场控制和组织进攻", stadium: "威斯利高校足球场",
        coords: { "GK":[5,50], "LCB":[20,28], "CB":[18,50], "RCB":[20,72], "LM":[48,12], "LCM":[45,38], "RCM":[45,62], "RM":[48,88], "LW":[80,18], "ST":[85,50], "RW":[80,82] },
        roster: [
            { pos: "GK", name: "南特", rating: 79 }, { pos: "LCB", name: "格雷", rating: 76 }, { pos: "CB", name: "奥古斯", rating: 82 }, { pos: "RCB", name: "兰帕尔", rating: 77 },
            { pos: "LM", name: "戈麦斯", rating: 79 }, { pos: "LCM", name: "库西蒂尼", rating: 81 }, { pos: "RCM", name: "皮特", rating: 81 }, { pos: "RM", name: "伍德", rating: 80 },
            { pos:"LW" ,name:"马尔科姆" ,rating :80 }, { pos:"ST" ,name:"维克" ,rating :82 }, { pos:"RW" ,name:"安东尼" ,rating :78 }
        ]
    },

    // 25. 威尔福特 (Welford)
    "威尔福特": {
        color: "#7c3aed", style: "控球进攻", stadium: "诺维亚足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[18,35], "RCB":[18,65], "RB":[25,90], "LDM":[40,35], "RDM":[40,65], "CAM":[60,50], "LM":[72,15], "RM":[72,85], "ST":[86,50] },
        roster: [
            { pos: "GK", name: "川岛富康", rating: 89 }, { pos: "LB", name: "塞尔吉奥", rating: 89 }, { pos: "LCB", name: "鲁本斯", rating: 91 }, { pos: "RCB", name: "乌多伊", rating: 89 },
            { pos: "RB", name: "雷谷龙", rating: 87 }, { pos: "LDM", name: "托内利", rating: 89 }, { pos: "RDM", name: "麦克提莫提", rating: 88 }, { pos: "CAM", name: "埃尔林", rating: 93 },
            { pos: "LM", name: "纳尔罗斯", rating: 89 }, { pos: "RM", name: "帕瓦尔德", rating: 92 }, { pos: "ST", name: "哈希特", rating: 94 }
        ]
    },

    // 26. 威廉斯 (Williams)
    "威廉斯": {
        color: "#1d4ed8", style: "坚固的防守", stadium: "银河天空足球场",
        coords: { "GK":[5,50], "LB":[35,10], "LCB":[20,28], "CB":[16,50], "RCB":[20,72], "RB":[35,90], "LCM":[55,28], "CM":[52,50], "RCM":[55,72], "LST":[85,38], "RST":[85,62] },
        roster: [
            { pos: "GK", name: "张寒", rating: 85 }, { pos: "LB", name: "赞库洛", rating: 80 }, { pos: "LCB", name: "莫里斯", rating: 83 }, { pos: "CB", name: "奥尼尔", rating: 79 },
            { pos: "RCB", name: "胡德尔斯", rating: 78 }, { pos: "RB", name: "罗贝鲁特", rating: 78 }, { pos: "LCM", name: "托内利·卡鲁", rating: 84 }, { pos: "CM", name: "尼尔森", rating: 80 },
            { pos: "RCM", name: "维拉蒂尼", rating: 79 }, { pos:"LST" ,name:"里奇" ,rating :85 }, { pos:"RST" ,name:"里格斯" ,rating :82 }
        ]
    },

    // 27. 泽尼联 (Zenith United)
    "泽尼联": {
        color: "#525252", style: "攻击型中场的支援", stadium: "劳伦特足球场",
        coords: { "GK":[5,50], "LB":[25,10], "LCB":[20,35], "RCB":[20,65], "RB":[25,90], "LDM":[42,35], "RDM":[42,65], "LM":[65,15], "CAM":[65,50], "RM":[65,85], "ST":[86,50] },
        roster: [
            { pos: "GK", name: "塔利斯卡", rating: 82 }, { pos: "LB", name: "库库雷迪亚", rating: 86 }, { pos: "LCB", name: "迪亚斯", rating: 88 }, { pos: "RCB", name: "劳伦斯", rating: 85 },
            { pos: "RB", name: "吉马伦萨", rating: 85 }, { pos: "LDM", name: "苏博斯洛伊", rating: 86 }, { pos: "RDM", name: "阿隆索", rating: 85 }, { pos: "LM", name: "若昂", rating: 85 },
            { pos: "CAM", name: "德雷姆", rating: 87 }, { pos: "RM", name: "麦卡雷斯特", rating: 85 }, { pos:"ST" ,name:"德赫雷特" ,rating :87 }
        ]
    }
};