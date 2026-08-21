const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const inputValA = document.getElementById('valA');
const inputAngA = document.getElementById('angA');
const inputValB = document.getElementById('valB');
const inputAngB = document.getElementById('angB');
const inputGramsB = document.getElementById('gramsB');
const inputGramsMode = document.getElementById('gramsMode');
const inputColorV = document.getElementById('colorV');
const inputColorV1 = document.getElementById('colorV1');
const inputColorV2 = document.getElementById('colorV2');
const inputColorV3 = document.getElementById('colorV3');
const inputColorV4 = document.getElementById('colorV4');
const inputNameV = document.getElementById('nameV');
const inputNameV1 = document.getElementById('nameV1');
const inputNameV2 = document.getElementById('nameV2');
const inputNameV3 = document.getElementById('nameV3');
const inputNameV4 = document.getElementById('nameV4');

const dpr = window.devicePixelRatio || 1;

// 视图变换状态：平移偏移（物理像素）与缩放系数
let offsetX = 0, offsetY = 0, zoom = 1;

// 文字标注（标签/数值）统一收集，最后在最上层绘制
let labels = [];

function resize() {
  const wrap = canvas.parentElement;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  draw();
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function fmtTick(v) {
  const r = Math.round(v * 100) / 100;
  return String(r);
}

function vLabel(input, fallback) {
  const t = input.value.trim();
  return t ? t : fallback;
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2 + offsetX;
  const cy = h / 2 + offsetY;
  const rangeMax = 1; // 坐标轴最大刻度半径（固定）
  const scale = (Math.min(w, h) / 2) / (rangeMax * 1.2) * zoom;

  ctx.clearRect(0, 0, w, h);
  labels = [];

  // 坐标轴
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.stroke();

  // 刻度标记
  ctx.fillStyle = '#ccc';
  ctx.font = `${10 * dpr}px sans-serif`;
  ctx.textAlign = 'center';
  const segs = 5;
  const step = (rangeMax * scale) / segs;
  for (let i = 1; i <= segs; i++) {
    const r = step * i;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#f0f0f0';
    ctx.stroke();
    ctx.fillText(fmtTick(r / scale), cx + r, cy + 14 * dpr);
  }

  // 箭头
  ctx.fillStyle = '#999';
  ctx.beginPath();
  ctx.moveTo(w, cy);
  ctx.lineTo(w - 8 * dpr, cy - 4 * dpr);
  ctx.lineTo(w - 8 * dpr, cy + 4 * dpr);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx - 4 * dpr, 8 * dpr);
  ctx.lineTo(cx + 4 * dpr, 8 * dpr);
  ctx.fill();

  // 原点标记
  ctx.fillStyle = '#999';
  ctx.fillText('O', cx - 10 * dpr, cy + 14 * dpr);

  // 计算端点
  const a = getEndpoint(inputValA.value, inputAngA.value, scale, cx, cy);
  const b = getEndpoint(inputValB.value, inputAngB.value, scale, cx, cy);

  // 画向量 A
  drawVector(cx, cy, a.x, a.y, '#e74c3c', '第一次', parseFloat(inputValA.value) || 0, parseFloat(inputAngA.value) || 0, 1.5);
  // 画向量 B
  drawVector(cx, cy, b.x, b.y, '#2ecc71', '第二次', parseFloat(inputValB.value) || 0, parseFloat(inputAngB.value) || 0, 1.5);
  // 虚线连接第一次(A)末端到第二次(B)末端，展示几何关系
  // 由第一次、第二次向量确定 V1：增重 = 第二次−第一次，减重 = 反向（第一次−第二次）
  const modeSign = inputGramsMode.value === 'remove' ? -1 : 1;
  const dx = (b.x - a.x) * modeSign;
  const dy = (b.y - a.y) * modeSign;
  const diffLen = Math.sqrt(dx * dx + dy * dy) / scale;
  const diffAng = Math.atan2(-dy, dx) * 180 / Math.PI;

  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1.5 * dpr;
  ctx.setLineDash([5 * dpr, 5 * dpr]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // V1 桨叶（减重时反向）从原点画出
  const diffEndX = cx + dx;
  const diffEndY = cy + dy;
  const nameV = vLabel(inputNameV, '桨叶1');
  drawBlade(cx, cy, diffEndX, diffEndY, inputColorV.value, nameV);

  // A 的反向量（虚线）
  const valA = parseFloat(inputValA.value) || 0;
  const angA = parseFloat(inputAngA.value) || 0;
  const negAng = ((angA + 180) % 360 + 360) % 360;
  const negRad = degToRad(negAng);
  const negX = cx + valA * Math.cos(negRad) * scale;
  const negY = cy - valA * Math.sin(negRad) * scale;
  ctx.setLineDash([6 * dpr, 4 * dpr]);
  drawVector(cx, cy, negX, negY, '#e74c3c', '反向第一次', valA, negAng, 1.5);
  ctx.setLineDash([]);

  // 构建 V1~V5 向量列表：V1 由两次输入确定，V2~V5 为 V1 依次旋转 72° 得到；角度归一化到 [0, 360)
  const allV = [];
  const vNames = [null, vLabel(inputNameV1, '桨叶2'), vLabel(inputNameV2, '桨叶3'), vLabel(inputNameV3, '桨叶4'), vLabel(inputNameV4, '桨叶5')];
  const vColors = [null, inputColorV1.value, inputColorV2.value, inputColorV3.value, inputColorV4.value];
  // V1（主向量，由第一次、第二次输入确定）
  allV.push({
    ang: ((diffAng % 360) + 360) % 360,
    ex: diffEndX, ey: diffEndY,
    color: inputColorV.value, label: nameV, isMain: true
  });
  // V2~V5：V1 依次旋转 72°（第 i 根旋转 i×72°）得到
  for (let i = 1; i <= 4; i++) {
    const ang = diffAng - 72 * i;
    const normAng = ((ang % 360) + 360) % 360;
    const rad = degToRad(ang);
    const ex = cx + diffLen * Math.cos(rad) * scale;
    const ey = cy - diffLen * Math.sin(rad) * scale;
    allV.push({ ang: normAng, ex, ey, color: vColors[i], label: vNames[i], isMain: false });
    drawBlade(cx, cy, ex, ey, vColors[i], vNames[i]);
  }

  // 按角度排序
  allV.sort((p, q) => p.ang - q.ang);

  // 找到反向第一次落在哪两个 V 向量之间
  const negAngNorm = ((negAng % 360) + 360) % 360;
  let pair = [allV[allV.length - 1], allV[0]]; // 默认最后一根和第一根
  for (let i = 0; i < allV.length - 1; i++) {
    if (negAngNorm >= allV[i].ang && negAngNorm <= allV[i + 1].ang) {
      pair = [allV[i], allV[i + 1]];
      break;
    }
  }

  // 矢量分解：将反向第一次向量分解到周围两个V向量方向上（力的分解）
  const projLengths = [];
  const Px = negX - cx;
  const Py = negY - cy;

  const [v1, v2] = pair;
  const dx1 = v1.ex - cx, dy1 = v1.ey - cy;
  const dx2 = v2.ex - cx, dy2 = v2.ey - cy;
  const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
  const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  // 单位方向向量
  const ux = dx1 / len1, uy = dy1 / len1;
  const vx = dx2 / len2, vy = dy2 / len2;

  // Cramer's rule: 解 P = k1·U + k2·V（像素空间）
  const det = ux * vy - uy * vx;
  const k1_px = (Px * vy - Py * vx) / det;
  const k2_px = (ux * Py - uy * Px) / det;

  // 转换到 IPs
  const k1 = k1_px / scale;
  const k2 = k2_px / scale;

  // 同时计算投影值用于角度计算（角度 = acos(proj / |P|)）
  const proj1 = (Px * dx1 + Py * dy1) / len1 / scale;
  const proj2 = (Px * dx2 + Py * dy2) / len2 / scale;

  projLengths.push({ label: v1.label, val: k1, proj: proj1 });
  projLengths.push({ label: v2.label, val: k2, proj: proj2 });

  // 绘制两个分量向量
  const comp1EndX = cx + k1_px * ux;
  const comp1EndY = cy + k1_px * uy;
  const comp2EndX = cx + k2_px * vx;
  const comp2EndY = cy + k2_px * vy;

  // 分量向量的统一颜色
  const compColor = '#9b59b6';

  drawArrowOnly(cx, cy, comp1EndX, comp1EndY, compColor, null, 2.5);
  drawArrowOnly(cx, cy, comp2EndX, comp2EndY, compColor, null, 2.5);

  // 补全平行四边形（虚线）
  ctx.strokeStyle = compColor;
  ctx.lineWidth = 1.5 * dpr;
  ctx.setLineDash([4 * dpr, 4 * dpr]);
  ctx.beginPath();
  ctx.moveTo(comp1EndX, comp1EndY);
  ctx.lineTo(negX, negY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(comp2EndX, comp2EndY);
  ctx.lineTo(negX, negY);
  ctx.stroke();
  ctx.setLineDash([]);

  // 标注反向第一次与两个分量 V 向量的夹角
  const arcR1 = Math.min(0.05 * scale, valA * scale * 0.4);
  const arcR2 = Math.min(0.09 * scale, valA * scale * 0.4);
  const thetaP = Math.atan2(negY - cy, negX - cx);
  drawAngleArc(cx, cy, arcR1, thetaP, Math.atan2(v1.ey - cy, v1.ex - cx), v1.color);
  drawAngleArc(cx, cy, arcR2, thetaP, Math.atan2(v2.ey - cy, v2.ex - cx), v2.color);

  // 文字标注统一在最上层绘制
  for (const l of labels) {
    drawLabel(l.text, l.x, l.y, l.fontPx, l.bold);
  }

  // 更新信息栏
  const gramsB = parseFloat(inputGramsB.value) || 0;
  const gMul = diffLen > 0 ? gramsB / diffLen : 0;
  let infoHTML = `<table class="info-table"><tr>`;
  for (const p of projLengths) {
    infoHTML += `<td>分解 反向第一次→<span class="vl">${p.label}</span>: <b>${(p.val * gMul).toFixed(1)} g</b></td>`;
  }
  infoHTML += `</tr><tr>`;
  for (const p of projLengths) {
    const ang = Math.acos(Math.max(-1, Math.min(1, p.proj / valA))) * 180 / Math.PI;
    infoHTML += `<td>夹角 反向第一次→<span class="vl">${p.label}</span>: <b>${ang.toFixed(1)}°</b></td>`;
  }
  infoHTML += `</tr></table>`;
  document.getElementById('infoBar').innerHTML = infoHTML;

  // 存下计算数据给弹框用
  window._calcData = {
    valA, angA,
    valB: parseFloat(inputValB.value) || 0,
    angB: parseFloat(inputAngB.value) || 0,
    gramsB,
    mode: inputGramsMode.value,
    modeLabel: inputGramsMode.value === 'remove' ? '减重' : '增重',
    diffLen, diffAng: ((diffAng % 360) + 360) % 360,
    vName: nameV,
    negAng, negAngNorm,
    v1Label: v1.label, v1Ang: v1.ang,
    v2Label: v2.label, v2Ang: v2.ang,
    k1, k2, proj1, proj2, gMul,
    allV: allV
  };
}

function drawLabel(text, x, y, fontPx, bold) {
  const fs = fontPx * dpr;
  ctx.font = `${bold ? 'bold ' : ''}${fs}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  const h = fs * 1.2;
  const padX = 5 * dpr;
  const padY = 3 * dpr;
  // 标注统一用深灰文字 + 白底，颜色区分交给向量线条本身
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillRect(x - w / 2 - padX, y - h / 2 - padY, w + 2 * padX, h + 2 * padY);
  ctx.fillStyle = '#333';
  ctx.fillText(text, x, y);
}

function drawAngleArc(cx, cy, r, startAng, endAng, color) {
  let delta = endAng - startAng;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const ccw = delta < 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * dpr;
  ctx.setLineDash([3 * dpr, 3 * dpr]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAng, endAng, ccw);
  ctx.stroke();
  ctx.setLineDash([]);

  const deg = Math.abs(delta) * 180 / Math.PI;
  const midAng = startAng + delta / 2;
  const lx = cx + (r + 10 * dpr) * Math.cos(midAng);
  const ly = cy + (r + 10 * dpr) * Math.sin(midAng);
  labels.push({ text: `${deg.toFixed(1)}°`, x: lx, y: ly, fontPx: 9, bold: false });
}

function getEndpoint(valStr, angStr, scale, cx, cy) {
  const val = parseFloat(valStr) || 0;
  const ang = parseFloat(angStr) || 0;
  const rad = degToRad(ang);
  return {
    x: cx + val * Math.cos(rad) * scale,
    y: cy - val * Math.sin(rad) * scale
  };
}

function drawVector(sx, sy, ex, ey, color, label, val, ang, lw) {
  // 画线
  ctx.strokeStyle = color;
  ctx.lineWidth = (lw || 2.5) * dpr;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // 箭头
  const arrowLen = 12 * dpr;
  const arrowAngle = degToRad(25);
  const baseAngle = Math.atan2(ey - sy, ex - sx);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(
    ex - arrowLen * Math.cos(baseAngle - arrowAngle),
    ey - arrowLen * Math.sin(baseAngle - arrowAngle)
  );
  ctx.lineTo(
    ex - arrowLen * Math.cos(baseAngle + arrowAngle),
    ey - arrowLen * Math.sin(baseAngle + arrowAngle)
  );
  ctx.closePath();
  ctx.fill();

  // 标签
  const labelDist = 16 * dpr;
  const lx = ex + labelDist * Math.cos(baseAngle);
  const ly = ey + labelDist * Math.sin(baseAngle);
  labels.push({ text: label, x: lx, y: ly, fontPx: 13, bold: true });

  // 数值标注（画在向量中间偏上）
  const midX = (sx + ex) * 0.5;
  const midY = (sy + ey) * 0.5;
  const tagX = -10 * dpr * Math.sin(baseAngle);
  const tagY = -10 * dpr * Math.cos(baseAngle);
  const angNorm = ((ang % 360) + 360) % 360;
  labels.push({ text: `|${label}|=${val.toFixed(1)} IPs  ${angNorm.toFixed(1)}°`, x: midX + tagX, y: midY + tagY, fontPx: 10, bold: false });
}

function drawArrowOnly(sx, sy, ex, ey, color, label, lw) {
  ctx.strokeStyle = color;
  ctx.lineWidth = (lw || 2) * dpr;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  const arrowLen = 10 * dpr;
  const arrowAngle = degToRad(25);
  const baseAngle = Math.atan2(ey - sy, ex - sx);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(
    ex - arrowLen * Math.cos(baseAngle - arrowAngle),
    ey - arrowLen * Math.sin(baseAngle - arrowAngle)
  );
  ctx.lineTo(
    ex - arrowLen * Math.cos(baseAngle + arrowAngle),
    ey - arrowLen * Math.sin(baseAngle + arrowAngle)
  );
  ctx.closePath();
  ctx.fill();

  if (label) {
    const labelDist = 16 * dpr;
    const lx = ex + labelDist * Math.cos(baseAngle);
    const ly = ey + labelDist * Math.sin(baseAngle);
    labels.push({ text: label, x: lx, y: ly, fontPx: 12, bold: true });
  }
}

// 噪点纹理：懒生成并缓存，打破桨叶纯色的生硬感
let bladeNoise = null;
function bladeNoisePattern() {
  if (bladeNoise) return bladeNoise;
  const size = 128;
  const nc = document.createElement('canvas');
  nc.width = size;
  nc.height = size;
  const nctx = nc.getContext('2d');
  const data = nctx.createImageData(size, size);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = (Math.random() * 255) | 0;
  }
  nctx.putImageData(data, 0, 0);
  bladeNoise = ctx.createPattern(nc, 'repeat');
  return bladeNoise;
}

function drawBlade(sx, sy, ex, ey, color, label) {
  const L = Math.hypot(ex - sx, ey - sy);
  if (L < 1) return;
  const ux = (ex - sx) / L;
  const uy = (ey - sy) / L;
  const px = -uy; // 单位垂直方向
  const py = ux;

  // 桨叶半宽与长度成正比，随缩放同步变化，保持叶片比例一致
  const wMax = L * 0.04;
  const rTip = wMax * 0.6; // 尖端圆头半径

  // 圆头圆心：末端往回退 rTip，让圆头正好凸在叶尖
  const cx0 = ex - ux * rTip;
  const cy0 = ey - uy * rTip;

  // 圆头与叶片相接的上/下两点
  const topX = cx0 + px * rTip, topY = cy0 + py * rTip;
  const botX = cx0 - px * rTip, botY = cy0 - py * rTip;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx, sy); // 根部（原点）

  // 上边缘：根部 → 圆头上接点（三次贝塞尔，中段鼓起、端点切线沿轴向，与圆头平滑相接）
  ctx.bezierCurveTo(
    sx + ux * L * 0.40 + px * wMax * 1.4, sy + uy * L * 0.40 + py * wMax * 1.4,
    topX - ux * L * 0.16, topY - uy * L * 0.16,
    topX, topY
  );

  // 尖端圆头：从上接点经最外点(ex,ey)到下接点（半圆弧，切向连续）
  ctx.arc(cx0, cy0, rTip, Math.atan2(py, px), Math.atan2(py, px) - Math.PI, true);

  // 下边缘：圆头下接点 → 根部
  ctx.bezierCurveTo(
    botX - ux * L * 0.16, botY - uy * L * 0.16,
    sx + ux * L * 0.40 - px * wMax * 1.4, sy + uy * L * 0.40 - py * wMax * 1.4,
    sx, sy
  );

  ctx.closePath();

  // 投影：柔和的下方阴影，让桨叶看起来浮在画布上
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 5 * dpr;
  ctx.shadowOffsetX = 1.5 * dpr;
  ctx.shadowOffsetY = 2 * dpr;
  ctx.fill();
  ctx.restore();

  // 立体渐变：沿叶片宽度方向叠加高光与暗面，模拟圆柱/翼型曲面
  const g = ctx.createLinearGradient(
    sx - px * wMax, sy - py * wMax,
    sx + px * wMax, sy + py * wMax
  );
  g.addColorStop(0, 'rgba(0,0,0,0.16)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,0.32)');
  ctx.fillStyle = g;
  ctx.fill();

  // 噪点叠加：随机颗粒打破纯色的生硬感
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = bladeNoisePattern();
  ctx.fill();
  ctx.restore();

  if (label) {
    const labelDist = 18 * dpr;
    const baseAngle = Math.atan2(ey - sy, ex - sx);
    const lx = ex + labelDist * Math.cos(baseAngle);
    const ly = ey + labelDist * Math.sin(baseAngle);
    labels.push({ text: label, x: lx, y: ly, fontPx: 12, bold: true });
  }
}

function showCalc() {
  const d = window._calcData;
  if (!d) return;
  const steps = [
    { t: '输入',
      v: `第一次：大小 ${d.valA} IPs，方向 ${d.angA}°<br>第二次：大小 ${d.valB} IPs，方向 ${d.angB}°<br>克数 = ${d.gramsB}` },
    { t: d.mode === 'remove' ? `1. ${d.vName} = 第一次 − 第二次（减重）` : `1. ${d.vName} = 第二次 − 第一次`,
      v: `${d.vName} 长度 = ${d.diffLen.toFixed(2)} IPs，${d.vName} 方向 = ${d.diffAng.toFixed(1)}°` },
    { t: '2. 反向第一次 P',
      v: `方向 = ${d.negAng.toFixed(1)}°，大小 = ${d.valA} IPs` },
    { t: '3. 桨叶2 ~ 桨叶5',
      v: d.allV.filter(x => !x.isMain).map(x => `${x.label} = ${x.ang.toFixed(1)}°`).join('，') },
    { t: '4. P 挨着哪两根',
      v: `P 方向 = ${d.negAngNorm.toFixed(1)}°，落在 ${d.v1Label}(${d.v1Ang.toFixed(1)}°) 和 ${d.v2Label}(${d.v2Ang.toFixed(1)}°) 之间` },
    { t: '5. 力的分解',
      v: `沿 ${d.v1Label}：${d.k1.toFixed(3)} IPs<br>沿 ${d.v2Label}：${d.k2.toFixed(3)} IPs` },
    { t: '6. 夹角',
      v: `P → ${d.v1Label}：${(Math.acos(Math.max(-1,Math.min(1,d.proj1/d.valA)))*180/Math.PI).toFixed(1)}°<br>P → ${d.v2Label}：${(Math.acos(Math.max(-1,Math.min(1,d.proj2/d.valA)))*180/Math.PI).toFixed(1)}°` },
    { t: '7. 克数换算',
      v: `每份 = ${d.gramsB} / ${d.diffLen.toFixed(2)} = ${d.gMul.toFixed(1)}<br>${d.v1Label}：${d.k1.toFixed(3)} × ${d.gMul.toFixed(1)} = ${(d.k1*d.gMul).toFixed(1)} g<br>${d.v2Label}：${d.k2.toFixed(3)} × ${d.gMul.toFixed(1)} = ${(d.k2*d.gMul).toFixed(1)} g` }
  ];
  document.getElementById('modalContent').innerHTML = steps.map(s =>
    `<div class="step"><div class="step-title">${s.t}</div><div class="step-val">${s.v}</div></div>`
  ).join('');
  document.getElementById('modalOverlay').classList.add('show');
}

function closeCalc(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('show');
}

function showSettings() {
  document.getElementById('settingsOverlay').classList.add('show');
}

function closeSettings(e) {
  if (e && e.target !== document.getElementById('settingsOverlay')) return;
  document.getElementById('settingsOverlay').classList.remove('show');
}

window.addEventListener('resize', resize);

const allInputs = [inputValA, inputAngA, inputValB, inputAngB, inputGramsB, inputGramsMode, inputNameV, inputNameV1, inputNameV2, inputNameV3, inputNameV4, inputColorV, inputColorV1, inputColorV2, inputColorV3, inputColorV4];

// 从 localStorage 恢复所有值
allInputs.forEach(el => {
  const saved = localStorage.getItem('vec-' + el.id);
  if (saved) el.value = saved;
});

allInputs.forEach(el => {
  el.addEventListener('input', () => {
    // valA / valB 不允许负数
    if ((el.id === 'valA' || el.id === 'valB') && parseFloat(el.value) < 0) {
      el.value = '0';
    }
    localStorage.setItem('vec-' + el.id, el.value);
    draw();
  });
});

// 视图变换辅助函数与手势交互
function resetView() {
  offsetX = 0; offsetY = 0; zoom = 1;
  draw();
}

function clampZoom(z) {
  return Math.min(10, Math.max(0.1, z));
}

function zoomAt(factor, x, y) {
  const oldZoom = zoom;
  const newZoom = clampZoom(oldZoom * factor);
  const realFactor = newZoom / oldZoom;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const px = x - centerX - offsetX;
  const py = y - centerY - offsetY;
  offsetX += px * (1 - realFactor);
  offsetY += py * (1 - realFactor);
  zoom = newZoom;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const pointers = new Map();
let dragState = null;   // { x, y, ox, oy }
let pinchState = null;  // { lastDist }

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  const p = { x: e.offsetX * dpr, y: e.offsetY * dpr };
  pointers.set(e.pointerId, p);
  if (pointers.size === 1) {
    dragState = { x: p.x, y: p.y, ox: offsetX, oy: offsetY };
  } else if (pointers.size === 2) {
    dragState = null;
    const [p1, p2] = [...pointers.values()];
    pinchState = { lastDist: dist(p1, p2) };
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const p = { x: e.offsetX * dpr, y: e.offsetY * dpr };
  pointers.set(e.pointerId, p);
  if (pointers.size === 1 && dragState) {
    offsetX = dragState.ox + (p.x - dragState.x);
    offsetY = dragState.oy + (p.y - dragState.y);
    draw();
  } else if (pointers.size === 2 && pinchState) {
    const [p1, p2] = [...pointers.values()];
    const d = dist(p1, p2);
    const factor = d / pinchState.lastDist;
    pinchState.lastDist = d;
    zoomAt(factor, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    draw();
  }
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size === 1) {
    const [p] = [...pointers.values()];
    dragState = { x: p.x, y: p.y, ox: offsetX, oy: offsetY };
    pinchState = null;
  } else if (pointers.size === 0) {
    dragState = null;
    pinchState = null;
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  zoomAt(Math.exp(-e.deltaY * 0.0015), e.offsetX * dpr, e.offsetY * dpr);
  draw();
}, { passive: false });

canvas.addEventListener('dblclick', resetView);

resize();

// 首次打开自动弹出设置弹窗，并用 localStorage 记录，之后不再自动弹
if (!localStorage.getItem('vec-first-open')) {
  showSettings();
  localStorage.setItem('vec-first-open', '1');
}
