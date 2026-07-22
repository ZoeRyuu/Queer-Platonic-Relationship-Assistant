const WIDTH = 720;
const PADDING = 40;
const COLORS = {
  bg: "#faf6f1",
  card: "#ffffff",
  border: "#e6dccd",
  text: "#362f28",
  muted: "#7a6f62",
  primary: "#a9765a",
};

function wrapText(ctx, text, maxWidth) {
  const words = text.split("");
  const lines = [];
  let current = "";
  for (const ch of words) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function itemToLines(item) {
  if (item.kind === "tags") return [`${item.label}: ${item.tags.join("、")}`];
  if (item.kind === "kv") return [`${item.label}: ${item.value}${item.note ? `(${item.note})` : ""}`];
  if (item.kind === "statelist") {
    const entriesText = item.entries.map((e) => `${e.label}(${e.stateLabel})`).join("、");
    return [`${item.label}: ${entriesText}${item.note ? ` / 补充: ${item.note}` : ""}`];
  }
  if (item.kind === "text") return [`${item.label}: ${item.value}`];
  if (item.kind === "textpair") {
    return [`${item.label}:`, ...item.parts.map((p) => `  ${p.label}: ${p.value}`)];
  }
  return [];
}

export function renderProfileCanvas(sections, { title = "我的关系画像", generatedAt = "" } = {}) {
  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");
  const contentWidth = WIDTH - PADDING * 2;

  const blocks = [];
  mctx.font = "600 26px sans-serif";
  blocks.push({ type: "title", text: title, height: 40 });
  if (generatedAt) {
    mctx.font = "13px sans-serif";
    blocks.push({ type: "meta", text: generatedAt, height: 22 });
  }
  blocks.push({ type: "gap", height: 16 });

  for (const section of sections) {
    if (section.items.length === 0) continue;
    mctx.font = "700 18px sans-serif";
    blocks.push({ type: "section", text: section.title, height: 34 });
    for (const item of section.items) {
      mctx.font = "15px sans-serif";
      for (const rawLine of itemToLines(item)) {
        const wrapped = wrapText(mctx, rawLine, contentWidth - 16);
        for (const line of wrapped) {
          blocks.push({ type: "line", text: line, height: 24 });
        }
      }
    }
    blocks.push({ type: "gap", height: 14 });
  }

  const totalHeight = PADDING * 2 + blocks.reduce((sum, b) => sum + b.height, 0);
  const canvas = document.createElement("canvas");
  const scale = window.devicePixelRatio > 1 ? 2 : 1;
  canvas.width = WIDTH * scale;
  canvas.height = totalHeight * scale;
  canvas.style.width = `${WIDTH}px`;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, WIDTH, totalHeight);

  let y = PADDING;
  ctx.textBaseline = "top";
  for (const block of blocks) {
    if (block.type === "title") {
      ctx.fillStyle = COLORS.text;
      ctx.font = "600 26px sans-serif";
      ctx.fillText(block.text, PADDING, y);
    } else if (block.type === "meta") {
      ctx.fillStyle = COLORS.muted;
      ctx.font = "13px sans-serif";
      ctx.fillText(block.text, PADDING, y);
    } else if (block.type === "section") {
      ctx.fillStyle = COLORS.primary;
      ctx.font = "700 18px sans-serif";
      ctx.fillText(block.text, PADDING, y + 6);
    } else if (block.type === "line") {
      ctx.fillStyle = COLORS.text;
      ctx.font = "15px sans-serif";
      ctx.fillText(block.text, PADDING + 12, y);
    }
    y += block.height;
  }

  return canvas;
}

export function downloadCanvasAsPng(canvas, filename) {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, "image/png");
}
