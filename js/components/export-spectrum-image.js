const WIDTH = 720;
const PADDING = 40;
const ROW_HEIGHT = 92;
const COLORS = {
  bg: "#faf6f1",
  track: "#e6dccd",
  text: "#362f28",
  muted: "#7a6f62",
  primary: "#a9765a",
};

export function renderSpectrumCanvas(axes, axesValues, { title = "我的光谱", generatedAt = "" } = {}) {
  const totalHeight = PADDING * 2 + 50 + (generatedAt ? 24 : 0) + axes.length * ROW_HEIGHT;
  const canvas = document.createElement("canvas");
  const scale = window.devicePixelRatio > 1 ? 2 : 1;
  canvas.width = WIDTH * scale;
  canvas.height = totalHeight * scale;
  canvas.style.width = `${WIDTH}px`;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, totalHeight);
  ctx.textBaseline = "top";

  let y = PADDING;
  ctx.fillStyle = COLORS.text;
  ctx.font = "600 24px sans-serif";
  ctx.fillText(title, PADDING, y);
  y += 36;

  if (generatedAt) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = "13px sans-serif";
    ctx.fillText(generatedAt, PADDING, y);
    y += 24;
  }

  const trackWidth = WIDTH - PADDING * 2;

  for (const axis of axes) {
    ctx.fillStyle = COLORS.text;
    ctx.font = "600 15px sans-serif";
    ctx.fillText(axis.label, PADDING, y);
    y += 24;

    ctx.strokeStyle = COLORS.track;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(PADDING, y + 4);
    ctx.lineTo(PADDING + trackWidth, y + 4);
    ctx.stroke();

    const value = axesValues[axis.id];
    if (value !== null && value !== undefined) {
      const x = PADDING + (trackWidth * value) / 100;
      ctx.fillStyle = COLORS.primary;
      ctx.beginPath();
      ctx.arc(x, y + 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    y += 20;

    ctx.fillStyle = COLORS.muted;
    ctx.font = "12px sans-serif";
    ctx.fillText(axis.leftLabel, PADDING, y);
    const midWidth = ctx.measureText(axis.midLabel).width;
    ctx.fillText(axis.midLabel, PADDING + trackWidth / 2 - midWidth / 2, y);
    const rightWidth = ctx.measureText(axis.rightLabel).width;
    ctx.fillText(axis.rightLabel, PADDING + trackWidth - rightWidth, y);

    y += ROW_HEIGHT - 44;
  }

  return canvas;
}
