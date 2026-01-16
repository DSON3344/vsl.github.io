/* ===================================================
    render_field.js - 修正版
    职责：
    - 绘制完美连接的静态球场
    - 将阵型坐标严格映射到左右半场 (左主右客)
   =================================================== */

let fieldCanvas = null;
let fieldCtx = null;

const FIELD_WIDTH = 860;
const FIELD_HEIGHT = 560;

function initFieldCanvas() {
    fieldCanvas = document.getElementById("matchPitch");
    if (!fieldCanvas) return;
    fieldCtx = fieldCanvas.getContext("2d");
    drawStaticPitch(fieldCtx);
}

/* ===============================
    1. 静态球场绘制 (修正弧线连接)
   =============================== */
function drawStaticPitch(ctx) {
    const w = FIELD_WIDTH, h = FIELD_HEIGHT;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#166534"; 
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    // 边线与中线
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.beginPath();
    ctx.moveTo(w / 2, 20); ctx.lineTo(w / 2, h - 20);
    ctx.stroke();

    // 中圈
    ctx.beginPath(); ctx.arc(w/2, h/2, 70, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(w/2, h/2, 3, 0, Math.PI*2); ctx.fill();

    // 禁区绘制 (大禁区120宽，小禁区50宽)
    const boxH = 220, smallH = 110;
    ctx.strokeRect(20, h/2 - boxH/2, 120, boxH);      
    ctx.strokeRect(w - 140, h/2 - boxH/2, 120, boxH);  
    ctx.strokeRect(20, h/2 - smallH/2, 50, smallH);   
    ctx.strokeRect(w - 70, h/2 - smallH/2, 50, smallH); 

    // --- 修正禁区弧线 (D-Box) ---
    // 逻辑：大禁区线在 X=140，点球点在 X=110，距离是30。半径70。
    // 使用 Math.acos(30/70) 计算精确的起始角度，确保弧线末端刚好贴在禁区线上。
    const pSpotX = 110; 
    const radius = 70;
    const distToLine = 30; 
    const arcAngle = Math.acos(distToLine / radius); 

    // 左弧线
    ctx.beginPath(); 
    ctx.arc(pSpotX, h/2, radius, -arcAngle, arcAngle); 
    ctx.stroke(); 
    ctx.beginPath(); ctx.arc(pSpotX, h/2, 3, 0, Math.PI*2); ctx.fill();

    // 右弧线
    ctx.beginPath(); 
    ctx.arc(w - pSpotX, h / 2, radius, Math.PI - arcAngle, Math.PI + arcAngle); 
    ctx.stroke(); 
    ctx.beginPath(); ctx.arc(w - pSpotX, h / 2, 3, 0, Math.PI*2); ctx.fill();

    // 角球弧与球门
    const cr = 15;
    ctx.beginPath(); ctx.arc(20, 20, cr, 0, Math.PI/2); ctx.stroke();
    ctx.beginPath(); ctx.arc(20, h-20, cr, -Math.PI/2, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(w-20, 20, cr, Math.PI/2, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(w-20, h-20, cr, Math.PI, -Math.PI/2); ctx.stroke();

    ctx.lineWidth = 4;
    ctx.strokeRect(5, h/2 - 45, 15, 90); 
    ctx.strokeRect(w - 20, h / 2 - 45, 15, 90); 
}