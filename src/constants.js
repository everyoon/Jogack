export const CATEGORIES = [
  { id: 'square', label: '네모' },
  { id: 'circle', label: '동그라미' },
  { id: 'heart', label: '하트' },
  { id: 'star', label: '별' },
  { id: 'etc', label: '기타' },
];

export const SHAPES = {
  square: [
    { id: 'sq-basic', label: '기본 네모', path: (ctx, x, y, size) => ctx.rect(x, y, size, size) },
    { id: 'sq-rounded', label: '둥근 네모', path: (ctx, x, y, size) => {
      const r = size * 0.2;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + size, y, x + size, y + size, r);
      ctx.arcTo(x + size, y + size, x, y + size, r);
      ctx.arcTo(x, y + size, x, y, r);
      ctx.arcTo(x, y, x + size, y, r);
    }},
  ],
  circle: [
    { id: 'cir-basic', label: '기본 원', path: (ctx, x, y, size) => {
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    }},
    { id: 'cir-oval', label: '타원', path: (ctx, x, y, size) => {
      ctx.ellipse(x + size / 2, y + size / 2, size / 2, size / 3, 0, 0, Math.PI * 2);
    }},
  ],
  heart: [
    { id: 'heart-basic', label: '기본 하트', path: (ctx, x, y, size) => {
      const x0 = x + size / 2;
      const y0 = y + size * 0.3;
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x0, y0 - size * 0.3, x0 - size * 0.5, y0 - size * 0.3, x0 - size * 0.5, y0);
      ctx.bezierCurveTo(x0 - size * 0.5, y0 + size * 0.4, x0, y0 + size * 0.6, x0, y + size);
      ctx.bezierCurveTo(x0, y0 + size * 0.6, x0 + size * 0.5, y0 + size * 0.4, x0 + size * 0.5, y0);
      ctx.bezierCurveTo(x0 + size * 0.5, y0 - size * 0.3, x0, y0 - size * 0.3, x0, y0);
    }},
  ],
  star: [
    { id: 'star-basic', label: '기본 별', path: (ctx, x, y, size) => {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
    }},
  ],
  etc: [
    { id: 'etc-cloud', label: '구름', path: (ctx, x, y, size) => {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.moveTo(cx - size * 0.3, cy);
      ctx.bezierCurveTo(cx - size * 0.5, cy - size * 0.4, cx - size * 0.1, cy - size * 0.5, cx, cy - size * 0.2);
      ctx.bezierCurveTo(cx + size * 0.4, cy - size * 0.5, cx + size * 0.6, cy - size * 0.1, cx + size * 0.3, cy);
      ctx.bezierCurveTo(cx + size * 0.5, cy + size * 0.4, cx + size * 0.1, cy + size * 0.5, cx, cy + size * 0.2);
      ctx.bezierCurveTo(cx - size * 0.4, cy + size * 0.5, cx - size * 0.6, cy + size * 0.1, cx - size * 0.3, cy);
    }},
  ]
};
