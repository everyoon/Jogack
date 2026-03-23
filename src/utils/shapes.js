export function getShapeRect(shapeId, cw, ch) {
  let w, h;
  const margin = 8; // 4px on each side
  const availableW = cw - margin;
  const availableH = ch - margin;

  switch (shapeId) {
    case 'st-land':
      w = availableW;
      h = availableW * 0.75;
      if (h > availableH) {
        h = availableH;
        w = availableH / 0.75;
      }
      break;
    case 'st-port':
      h = availableH;
      w = availableH * 0.75;
      if (w > availableW) {
        w = availableW;
        h = availableW / 0.75;
      }
      break;
    case 'ci-oval':
      w = availableW;
      h = availableW * 0.6;
      if (h > availableH) {
        h = availableH;
        w = availableH / 0.6;
      }
      break;
    case 'sq-basic':
    case 'sq-rounded':
    case 'ci-circle':
    case 'tr-basic':
    case 'st-square':
    case 'ht-basic':
    default:
      w = h = Math.min(availableW, availableH);
      break;
  }
  const x = (cw - w) / 2;
  const y = (ch - h) / 2;
  return { x, y, w, h };
}

export function applyClipPath(ctx, shapeId, cw, ch) {
  const { x, y, w, h } = getShapeRect(shapeId, cw, ch);
  
  switch (shapeId) {
    case 'sq-basic':
      ctx.rect(x, y, w, h);
      break;
    case 'sq-rounded':
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.15);
      } else {
        const r = Math.min(w, h) * 0.15;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
      }
      break;
    case 'ci-circle':
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      break;
    case 'ci-oval':
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'tr-basic':
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      break;
    case 'st-square':
    case 'st-land':
    case 'st-port':
      applyStampClip(ctx, x, y, w, h);
      break;
    case 'ht-basic':
      applyHeartClip(ctx, x, y, w, h);
      break;
    default:
      ctx.rect(x, y, w, h);
  }
}

function applyStampClip(ctx, x, y, w, h) {
  const r = 8;
  const spacing = 22;
  const padding = 12;

  if (ctx.roundRect) {
    ctx.roundRect(x + padding, y + padding, w - padding * 2, h - padding * 2, 4);
  } else {
    ctx.rect(x + padding, y + padding, w - padding * 2, h - padding * 2);
  }

  const drawHoles = (startX, startY, endX, endY, isHorizontal) => {
    const dist = isHorizontal ? endX - startX : endY - startY;
    const count = Math.floor(dist / spacing);
    const actualSpacing = dist / count;

    for (let i = 0; i <= count; i++) {
      const hx = isHorizontal ? startX + i * actualSpacing : startX;
      const hy = isHorizontal ? startY : startY + i * actualSpacing;
      ctx.moveTo(hx + r, hy);
      ctx.arc(hx, hy, r, 0, Math.PI * 2);
    }
  };

  drawHoles(x + padding, y + padding, x + w - padding, y + padding, true);
  drawHoles(x + padding, y + h - padding, x + w - padding, y + h - padding, true);
  drawHoles(x + padding, y + padding, x + padding, y + h - padding, false);
  drawHoles(x + w - padding, y + padding, x + w - padding, y + h - padding, false);
}

function applyHeartClip(ctx, x, y, w, h) {
  const heartPath = "M 50 95 C 50 95 5 65 5 35 C 5 15 25 5 50 25 C 75 5 95 15 95 35 C 95 65 50 95 50 95 Z";
  const p = new Path2D(heartPath);
  
  const matrix = new DOMMatrix();
  matrix.translateSelf(x, y);
  matrix.scaleSelf(w / 100, h / 100);
  
  const scaledPath = new Path2D();
  scaledPath.addPath(p, matrix);
  
  const sw = w / 100;
  const sh = h / 100;

  ctx.moveTo(x + 50 * sw, y + 95 * sh);
  ctx.bezierCurveTo(x + 50 * sw, y + 95 * sh, x + 5 * sw, y + 65 * sh, x + 5 * sw, y + 35 * sh);
  ctx.bezierCurveTo(x + 5 * sw, y + 15 * sh, x + 25 * sw, y + 5 * sh, x + 50 * sw, y + 25 * sh);
  ctx.bezierCurveTo(x + 75 * sw, y + 5 * sh, x + 95 * sw, y + 15 * sh, x + 95 * sw, y + 35 * sh);
  ctx.bezierCurveTo(x + 95 * sw, y + 65 * sh, x + 50 * sw, y + 95 * sh, x + 50 * sw, y + 95 * sh);
  ctx.closePath();
}
