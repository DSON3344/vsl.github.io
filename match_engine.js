// ===================================================
// match_engine.js - 核心引擎（整合版）
// ===================================================

// ============================
// 1. GAME STATE (全局状态)
// ============================
let gameState = {
    isRunning: false,
    isWaitingRestart: true,
    matchTimer: 0,
    homeScore: 0,
    awayScore: 0,
    currentState: "PLAYING",
    half1InjuryScheduled: false,
    half2InjuryScheduled: false,
    injuryTime: 0,
    eventLock: false,
    activePlayers: [],
    ball: {
        x: 430, y: 280, r: 5, vx: 0, vy: 0,
        holder: null, friction: 0.988, lastSide: null
    }
};

const canvas = document.getElementById('matchPitch');
const ctx = canvas.getContext('2d');

// ============================
// 2. LOG & UI (交互)
// ============================
function logEvent(msg) {
    const log = document.getElementById('eventLog');
    const div = document.createElement('div');
    div.className = "event-item";
    div.innerText = msg;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

function updateScoreUI() {
    const scoreBox = document.getElementById('scoreBoard');
    if (scoreBox) scoreBox.innerText = `${gameState.homeScore} - ${gameState.awayScore}`;

    const timeEl = document.getElementById('matchTime');
    if (timeEl) {
        // 假设引擎每秒运行 60 次 update
        const totalSeconds = Math.floor(gameState.matchTimer / 60);
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        timeEl.innerText = `${mins}:${secs}`;
    }
}

// ============================
// 3. DEPLOY MATCH (部署逻辑 - 整合修正版)
// ============================
function deployMatch(homeName, awayName, homeFormName, awayFormName) {
    gameState.activePlayers = [];

    function spawn(teamName, side, color, fName) {
        const formation = FORMATION_COORDS[fName];
        let availableRoster = [...PLAYER_DATABASE[teamName]]; // 拷贝一份球员名单
        let slots = []; // 暂存阵型中的所有坑位

        // 1. 摊平阵型，收集所有坑位需求
        Object.keys(formation).forEach(role => {
            formation[role].forEach(posCoord => {
                slots.push({ role: role, coord: posCoord, assignedPlayer: null });
            });
        });

        // 2. 第一轮：专业对位 (优先匹配本职工作，且评分最高者先选)
        slots.forEach(slot => {
            // 找出所有位置匹配的球员，并按能力值降序排列
            let candidates = availableRoster
                .filter(p => p.pos === slot.role)
                .sort((a, b) => b.rating - a.rating);

            if (candidates.length > 0) {
                let bestMatch = candidates[0];
                slot.assignedPlayer = bestMatch;
                // 从可用名单中移除该球员，防止重复
                availableRoster = availableRoster.filter(p => p !== bestMatch);
            }
        });

        // 3. 第二轮：强行补位 (没有专业球员的坑，由剩下最强的人顶上)
        slots.forEach(slot => {
            if (!slot.assignedPlayer) {
                // 按能力值排序剩下的所有人
                availableRoster.sort((a, b) => b.rating - a.rating);
                let fallbackPlayer = availableRoster.shift(); // 取出最强的一位
                slot.assignedPlayer = fallbackPlayer;
            }
        });

        // 4. 正式创建球员实体并注入地图
        slots.forEach((slot, i) => {
            const pData = slot.assignedPlayer;
            let screenX, screenY;
            const margin = 20;
            const midLine = 430;
            const halfPlayableDepth = (midLine - margin) - 30;
            const fullPlayableWidth = 560 - (margin * 2);

            screenY = margin + (slot.coord.y / 100) * fullPlayableWidth;
            if (side === "HOME") {
                screenX = margin + (slot.coord.x / 100) * halfPlayableDepth;
            } else {
                screenX = (860 - margin) - (slot.coord.x / 100) * halfPlayableDepth;
            }

            gameState.activePlayers.push({
                id: `${side}_${i}`,
                name: pData.name,
                no: pData.no,
                pos: slot.role, // 阵型中的位置
                side: side,
                color: color,
                x: screenX,
                y: screenY,
                homeX: screenX, homeY: screenY,
                angle: side === "HOME" ? 0 : Math.PI,
                tackleCD: 0, stunTimer: 0, decisionTimer: 0,
                isSentOff: false
            });

            const player = {
                id: `${side}_${i}`,
                name: pData.name,
                no: pData.no,
                pos: slot.role,
                side: side,
                color: color,
                x: screenX,
                y: screenY,
                homeX: screenX, homeY: screenY,
                angle: side === "HOME" ? 0 : Math.PI,
                tackleCD: 0, stunTimer: 0, decisionTimer: 0,
                isSentOff: false,
                // --- 新增体力属性 ---
                maxSta: pData.attributes.sta || 80, // 从数据库获取初始体力
                currSta: pData.attributes.sta || 80  // 当前实时体力
            };
        });
    }

    spawn(homeName, "HOME", "#3b82f6", homeFormName);
    spawn(awayName, "AWAY", "#ef4444", awayFormName);

    resetBallToCenter();
    renderMatch();
    logEvent(`最强阵容部署完成：已优先根据位置与评分分人`);
}

function resetBallToCenter() {
    const b = gameState.ball;
    b.x = 430; b.y = 280; b.vx = 0; b.vy = 0; b.holder = null; b.lastSide = null;
    gameState.isWaitingRestart = true;
}

// ============================
// 4. SKILLS & PHYSICS (AI 与物理)
// ============================
const SkillsPhysics = {
    updatePlayerMovement(p, ball, players, gs) {
        if (!p || p.isSentOff) return;
        this.tickTimers(p);

        const isGK = p.pos === "GK";
        const dx = ball.x - p.x, dy = ball.y - p.y;
        const distToBall = Math.hypot(dx, dy);
        p.angle = Math.atan2(dy, dx);

        // 1. 接球判定 (优化：扩大开球时的触碰判定，由 34 提高到 45)
        if (!ball.holder && p.tackleCD <= 0 && Math.hypot(ball.vx, ball.vy) < 7 && distToBall < (isGK ? 25 : 45)) {
            this.receiveBall(p, ball);
            gs.isWaitingRestart = false; // 只要有人触球，立即解除死锁
        }

        // 2. 处理开球/死球状态下的行为
        if (gs.isWaitingRestart) {
            // 只有前锋(ST)或前腰(CAM)在开球时会走向球，其他人保持阵型
            if (p.pos === "ST" || p.pos === "CAM") {
                this.moveTo(p, ball.x, ball.y, 1.2);
            } else {
                this.returnHome(p, 0.1);
            }
            return;
        }

        // 3. 正常比赛 AI 分流
        if (isGK) {
            this.handleGK(p, ball);
        } else if (ball.holder === p) {
            this.handleCarrier(p, ball, players, gs);
        } else if (ball.holder && ball.holder.side === p.side) {
            // 队友持球：拉开空间，向对方底线跑动
            const targetX = p.side === "HOME" ? Math.min(800, p.homeX + 150) : Math.max(60, p.homeX - 150);
            this.moveTo(p, targetX, p.homeY, 0.8);
        } else {
            // 敌方持球或无球：区域防守 (修正“叠罗汉”问题的关键)
            this.tacticalDefend(p, ball);
        }

        this.applyRoleConstraints(p, isGK);
    },

    tacticalDefend(p, ball) {
        const distToBall = Math.hypot(ball.x - p.x, ball.y - p.y);
        const distToHome = Math.hypot(p.homeX - p.x, p.homeY - p.y);

        // 只有球进入球员“管辖范围”(180px) 且 离家不远时才去抢
        if (distToBall < 180 && distToHome < 250) {
            this.moveTo(p, ball.x, ball.y, 1.1);
            // 抢球逻辑
            if (ball.holder && ball.holder.side !== p.side && distToBall < 32 && p.tackleCD <= 0) {
                const r = Math.random();
                if (r < 0.35) this.receiveBall(p, ball);
                else if (r > 0.995) handleFoul(p, ball.holder); // 降低犯规率
                p.tackleCD = 60;
            }
        } else {
            this.returnHome(p, 0.05); // 否则回到阵型位置
        }
    },

    applyRoleConstraints(p, isGK) {
        if (isGK) {
            if (p.side === "HOME") p.x = Math.max(25, Math.min(180, p.x));
            else p.x = Math.max(680, Math.min(835, p.x));
        }
        p.x = Math.max(20, Math.min(840, p.x));
        p.y = Math.max(20, Math.min(540, p.y));
    },

    receiveBall(p, ball) {
        ball.holder = p; ball.vx = 0; ball.vy = 0; ball.lastSide = p.side;
        p.decisionTimer = 40;
    },

    moveTo(p, tx, ty, spd) {
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
        p.x += (dx / d) * spd; p.y += (dy / d) * spd;
    },

    returnHome(p, power) {
        p.x += (p.homeX - p.x) * power; p.y += (p.homeY - p.y) * power;
    },

    handleCarrier(p, ball, players, gs) {
        const goalX = p.side === "HOME" ? 835 : 25;
        // 距离球门 220 像素以内尝试射门
        if (Math.abs(goalX - p.x) < 220) { this.shoot(p, ball); return; }

        if (p.decisionTimer <= 0) {
            const t = this.findPassTarget(p, players);
            if (t && Math.random() < 0.4) { // 增加传球概率
                this.passBall(p, t, ball, players, gs); return;
            }
        }

        // 带球推进
        const dir = p.side === "HOME" ? 1.3 : -1.3;
        p.x += dir;
        ball.x = p.x + (p.side === "HOME" ? 8 : -8); // 球在球员身前
        ball.y = p.y;
    },

    passBall(p, target, ball, players, gs) {
        ball.holder = null;
        const dx = target.x - p.x, dy = target.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        ball.vx = (dx / d) * 11; ball.vy = (dy / d) * 11;
    },

    shoot(p, ball) {
        ball.holder = null;
        const tx = p.side === "HOME" ? 865 : -5;
        const ty = 280 + (Math.random() - 0.5) * 40;
        const dx = tx - p.x, dy = ty - p.y;
        const d = Math.hypot(dx, dy) || 1;
        ball.vx = (dx / d) * 24; ball.vy = (dy / d) * 24;
    },

    defend(p, ball, players, gs) {
        const dx = ball.x - p.x, dy = ball.y - p.y;
        const dist = Math.hypot(dx, dy);
        this.moveTo(p, ball.x, ball.y, 1.05);

        if (ball.holder && ball.holder.side !== p.side && dist < 32 && p.tackleCD <= 0) {
            const r = Math.random();
            if (r < 0.35) this.receiveBall(p, ball);
            else if (r > 0.96) handleFoul(p, ball.holder);
            p.tackleCD = 60;
        }
    },

    handleSetPieceBehavior(p, ball) {
        if (ball.holder === p) return;
        if (p.side !== ball.lastSide) this.returnHome(p, 0.08);
    },

    handleGK(p, ball) {
        const gx = p.side === "HOME" ? 35 : 825;
        this.moveTo(p, gx, 280 + (ball.y - 280) * 0.2, 1.0);
    },

    moveTo(p, tx, ty, spd) {
        const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
        p.x += (dx / d) * spd; p.y += (dy / d) * spd;
    },

    returnHome(p, power) {
        p.x += (p.homeX - p.x) * power; p.y += (p.homeY - p.y) * power;
    },

    applyRoleConstraints(p, isGK) {
        if (isGK) {
            if (p.side === "HOME") {
                p.x = Math.max(25, Math.min(180, p.x)); // 主队 GK 锁在左侧
            } else {
                p.x = Math.max(680, Math.min(835, p.x)); // 客队 GK 锁在右侧
            }
        }
        p.x = Math.max(20, Math.min(840, p.x));
        p.y = Math.max(20, Math.min(540, p.y));
    },

    findPassTarget(p, players) {
        return players.filter(t => t.side === p.side && t !== p && t.pos !== "GK" && !t.isSentOff)
            .sort((a, b) => Math.hypot(p.x - a.x, p.y - b.y) - Math.hypot(p.x - b.x, p.y - b.y))[0];
    },

    tickTimers(p) {
        ["tackleCD", "stunTimer", "decisionTimer"].forEach(k => { if (p[k] > 0) p[k]--; });
    },

    support(p, holder) {
        this.moveTo(p, holder.x + (Math.random() - 0.5) * 50, holder.y + (Math.random() - 0.5) * 30, 0.7);
    },

    applyHardCollisions(players) {
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const a = players[i], b = players[j];
                const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy) || 1;
                if (d < 22) {
                    const overlap = 0.5 * (22 - d);
                    a.x += dx / d * overlap; a.y += dy / d * overlap;
                    b.x -= dx / d * overlap; b.y -= dy / d * overlap;
                }
            }
        }
    },

    applyStaminaDrain(p) {
        if (p.isSentOff || gameState.isWaitingRestart) return;

        // 基础消耗 + 运动额外消耗
        // 假设正常移动每帧消耗 0.002，静止不消耗
        const moveDist = Math.hypot(p.x - p.homeX, p.y - p.homeY); 
        const drainRate = moveDist > 1 ? 0.003 : 0.001; 
        
        p.currSta = Math.max(0, p.currSta - drainRate);

        // 体力对速度的影响：体力低于 30% 时，速度线性下降
        p.speedFactor = p.currSta < (p.maxSta * 0.3) ? (p.currSta / p.maxSta) + 0.7 : 1.0;
    },
};

// ============================
// 5. 特殊事件 (犯规, 定位球, 进球)
// ============================
function handleFoul(p, victim) {
    if (gameState.eventLock) return;
    gameState.eventLock = true;
    logEvent(`${p.name} 对 ${victim.name} 犯规！`);

    const cardChance = Math.random();
    if (cardChance < 0.1) {
        p.card = "RED"; p.isSentOff = true; logEvent(`${p.name} 被红牌罚下！`);
    } else if (cardChance < 0.3) {
        p.card = "YELLOW"; logEvent(`${p.name} 获得黄牌！`);
    }
    setTimeout(() => { gameState.eventLock = false; }, 800);
}

function triggerSetPiece(type, side) {
    if (gameState.eventLock) return;
    gameState.eventLock = true;
    gameState.currentState = "SET_PIECE";
    logEvent(`${type} 由 ${side} 执行！`);

    const b = gameState.ball;
    // 修正：将放球位置向场内偏移 5-10 像素，避免再次触发出界判定
    if (type === "FREE_KICK") { b.x = side === "HOME" ? 210 : 650; b.y = 280; }
    if (type === "CORNER") {
        b.x = side === "HOME" ? 820 : 40; // 从 830/30 缩进到 820/40
        b.y = side === "HOME" ? 520 : 40; // 从 530/30 缩进到 520/40
    }
    if (type === "PENALTY") { b.x = side === "HOME" ? 790 : 70; b.y = 280; }

    b.vx = 0; b.vy = 0; // 确保球静止
    setTimeout(() => { gameState.eventLock = false; gameState.currentState = "PLAYING"; }, 1200);
}

function triggerGoal(side) {
    logEvent(`进球！${side} 得分`);
    if (side === "HOME") gameState.homeScore++; else gameState.awayScore++;
    updateScoreUI();
    resetBallToCenter();
}

// ============================
// 6. 更新与主循环
// ============================
function updateMatchLogic() {
    if (!gameState.isRunning || gameState.eventLock) return;

    // 修正计时器逻辑：即使在等待重开，逻辑也应运行，只是 matchTimer 不加
    gameState.matchTimer++; // 建议让时间一直走，或者用 logicTick 区分

    const b = gameState.ball;
    gameState.activePlayers.forEach(p => SkillsPhysics.updatePlayerMovement(p, b, gameState.activePlayers, gameState));
    SkillsPhysics.applyHardCollisions(gameState.activePlayers);

    if (!b.holder) {
        b.x += b.vx; b.y += b.vy; b.vx *= b.friction; b.vy *= b.friction;
        // 边界检测
        if (b.x < 30 || b.x > 830) {
            if (b.y > 235 && b.y < 325) triggerGoal(b.x > 430 ? "HOME" : "AWAY");
            else triggerSetPiece("CORNER", b.x > 430 ? "HOME" : "AWAY");
        }
    }
    updateScoreUI(); // 确保 UI 每帧更新
}

// ============================
// 7. 渲染 (高级视觉效果)
// ============================
function renderMatch() {
    ctx.clearRect(0, 0, 860, 560);
    if (typeof drawStaticPitch === 'function') drawStaticPitch(ctx);

    const b = gameState.ball;
    // 绘制球阴影
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(b.x, b.y + 4, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    // 绘制球
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();

    gameState.activePlayers.forEach(p => {
        if (p.isSentOff) return;
        ctx.save();
        // 球员阴影
        ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 12, 10, 5, 0, 0, Math.PI * 2); ctx.fill();

        // 控球高亮
        if (gameState.ball.holder === p) {
            ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.stroke();
        }

        // 球员身体
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();

        // 方向指示器 (朝向球)
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(p.angle) * 5, p.y + Math.sin(p.angle) * 5);
        ctx.lineTo(p.x + Math.cos(p.angle) * 14, p.y + Math.sin(p.angle) * 14);
        ctx.stroke();

        // 姓名
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px Arial"; ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y + 25);
        ctx.restore();

        // --- 新增：绘制体力条 ---
    const barW = 24;  // 体力条总宽度
    const barH = 4;   // 体力条高度
    const barX = p.x - barW / 2;
    const barY = p.y - 22; // 位于球员上方

    // 1. 背景（深色）
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(barX, barY, barW, barH);

    // 2. 进度条颜色（根据百分比变换：绿 -> 黄 -> 红）
    const staPct = p.currSta / p.maxSta;
    if (staPct > 0.6) ctx.fillStyle = "#22c55e";      // 绿色
    else if (staPct > 0.3) ctx.fillStyle = "#eab308"; // 黄色
    else ctx.fillStyle = "#ef4444";                 // 红色

    // 3. 绘制当前体力
    ctx.fillRect(barX, barY, barW * staPct, barH);

    // 4. 姓名（位置微调，避免被体力条遮挡）
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.name, p.x, p.y + 25);
    
    ctx.restore();
    });
}

function renderAIDecisions() {
    const b = gameState.ball;
    gameState.activePlayers.forEach(p => {
        if (p.isSentOff) return;
        ctx.save();
        if (p === b.holder) {
            // 绘制射门/传球目标线
            const goalX = p.side === "HOME" ? 835 : 25;
            ctx.strokeStyle = "rgba(255,0,0,0.5)";
            ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(goalX, 280); ctx.stroke();
        }
        ctx.restore();
    });
}

function gameLoop() {
    updateMatchLogic();
    renderMatch();
    renderAIDecisions();
    requestAnimationFrame(gameLoop);
}

// ============================
// 8. 初始化与按钮控制
// ============================
document.getElementById("startBtn").addEventListener("click", () => {
    if (gameState.isRunning) return;
    gameState.isRunning = true;
    logEvent("裁判鸣哨，比赛开始！");
    gameLoop();
});