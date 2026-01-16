/* ===================================================
   match_setup.js
   职责：
   - 填充主客队下拉框及各自的阵型下拉框
   - 处理比赛部署：更新 UI 标签、调用引擎部署逻辑
   - 切换 UI 状态：关闭遮罩层，激活开始按钮
   =================================================== */

// 1. 获取 DOM 元素
const homeSelect = document.getElementById("homeSelect");
const awaySelect = document.getElementById("awaySelect");
const hFormSelect = document.getElementById("homeFormationSelect");
const aFormSelect = document.getElementById("awayFormationSelect");
const deployBtn = document.getElementById("deployBtn");

// UI 标签元素
const homeNameLabel = document.getElementById("homeName");
const awayNameLabel = document.getElementById("awayName");
const setupOverlay = document.getElementById("setupOverlay");
const startBtn = document.getElementById("startBtn");

/* ===============================
   填充下拉数据
   =============================== */
function populateSelects() {
    // 获取数据库中的键名
    const teams = Object.keys(PLAYER_DATABASE);
    const forms = Object.keys(FORMATION_COORDS);

    // 填充球队选择
    teams.forEach(team => {
        homeSelect.add(new Option(team, team));
        awaySelect.add(new Option(team, team));
    });

    // 填充主客队各自的阵型选择
    forms.forEach(f => {
        hFormSelect.add(new Option(f, f));
        aFormSelect.add(new Option(f, f));
    });

    console.log("match_setup.js: 下拉列表初始化完成。");
}

/* ===============================
   部署按钮逻辑
   =============================== */
// match_setup.js 修正后的部署按钮逻辑
deployBtn.addEventListener("click", () => {
    const hT = homeSelect.value;
    const aT = awaySelect.value;
    const hF = hFormSelect.value;
    const aF = aFormSelect.value;

    if (!hT || !aT || !hF || !aF) {
        alert("请完整选择主客队及其阵型！");
        return;
    }

    // 1. 更新球队名称文字
    if (homeNameLabel) homeNameLabel.innerText = hT;
    if (awayNameLabel) awayNameLabel.innerText = aT;

    // 2. 【核心新增】更新球队 Logo
    // 注意：请确保你的 assets/logos/ 文件夹下有对应队名的 .png 文件
    const hLogoImg = document.getElementById("homeLogo");
    const aLogoImg = document.getElementById("awayLogo");
    
    if (hLogoImg) hLogoImg.src = `Image/Team Logo/${hT}.png`;
    if (aLogoImg) aLogoImg.src = `Image/Team Logo/${aT}.png`;

    // 如果图片加载失败，可以设置一个默认 Logo 的处理（可选）
    hLogoImg.onerror = () => { hLogoImg.src = 'assets/logos/default.png'; };
    aLogoImg.onerror = () => { aLogoImg.src = 'assets/logos/default.png'; };

    // 3. 执行核心部署逻辑
    if (typeof deployMatch === "function") {
        deployMatch(hT, aT, hF, aF);
    }

    // 4. UI 状态切换
    if (setupOverlay) setupOverlay.style.display = "none";
    if (startBtn) startBtn.style.display = "inline-block";
});

/* ===============================
   页面启动初始化
   =============================== */
window.onload = () => {
    // 1. 初始化球场画布
    if (typeof initFieldCanvas === "function") {
        initFieldCanvas();
    }
    
    // 2. 填充下拉框数据
    populateSelects();
};