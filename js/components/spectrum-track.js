import { el } from "./dom.js";
import { getWikiEntry } from "../data/wiki.js";

export const COMPARE_COLORS = ["#a9765a", "#7c8c74", "#b5654f", "#6b7fb0"];

export function renderAxisTitle(axis) {
  const row = el("div", { class: "spectrum-axis-title" }, [el("span", {}, [axis.label])]);
  for (const termId of axis.relatedTerms || []) {
    const entry = getWikiEntry(termId);
    if (!entry) continue;
    row.appendChild(el("a", { class: "term-link", href: `#/wiki/${termId}` }, [`${entry.term} ?`]));
  }
  return row;
}

export function renderAxisLabels(axis) {
  return el("div", { class: "spectrum-labels" }, [
    el("span", {}, [axis.leftLabel]),
    el("span", {}, [axis.midLabel]),
    el("span", {}, [axis.rightLabel]),
  ]);
}

// points: [{ value, color, label }] — value in 0-100, or null/undefined to skip
export function renderStaticTrack(axis, points) {
  const wrap = el("div", { class: "spectrum-axis" }, [renderAxisTitle(axis), renderAxisLabels(axis)]);
  const track = el("div", { class: "spectrum-compare-track" });
  const validPoints = points.filter((p) => p.value !== null && p.value !== undefined);
  for (const p of validPoints) {
    track.appendChild(
      el("div", {
        class: "spectrum-compare-dot",
        style: `left:${p.value}%;background:${p.color};`,
        title: p.label || "",
      })
    );
  }
  wrap.appendChild(track);
  if (validPoints.length === 0) {
    wrap.appendChild(el("p", { class: "empty-note", style: "margin:0;" }, ["尚未标记"]));
  } else if (points.length > 1) {
    const legend = el(
      "div",
      { class: "spectrum-legend" },
      points.map((p) =>
        el("span", {}, [
          el("span", { class: "swatch", style: `background:${p.color};` }),
          p.label + (p.value === null || p.value === undefined ? "(跳过此轴)" : ""),
        ])
      )
    );
    wrap.appendChild(legend);
  }
  return wrap;
}
