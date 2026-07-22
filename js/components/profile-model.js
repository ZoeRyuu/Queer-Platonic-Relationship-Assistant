import { getChapter } from "../data/questions.js";

function optLabel(question, value) {
  const opt = question.options?.find((o) => o.value === value);
  return opt ? opt.label : value;
}

function editHashFor(chapterId, questionId) {
  const chapter = getChapter(chapterId);
  const idx = chapter.questions.findIndex((q) => q.id === questionId);
  return `#/explore/${chapterId}/${idx}`;
}

function summarizeQuestion(question, chapterId, value) {
  const editHash = editHashFor(chapterId, question.id);
  const base = { label: question.text, editHash };

  if (value === undefined) return null;

  switch (question.type) {
    case "multi": {
      const tags = (value.values || []).map((v) => optLabel(question, v));
      if (value.other) tags.push(value.other);
      if (tags.length === 0) return null;
      return { ...base, kind: "tags", tags };
    }
    case "single": {
      if (!value.value) return null;
      const text = value.value === "other" ? value.otherText || "其他" : optLabel(question, value.value);
      if (!text) return null;
      return { ...base, kind: "kv", value: text };
    }
    case "slider": {
      if (value.value === undefined) return null;
      return {
        ...base,
        kind: "kv",
        value: `${value.value} / ${question.max}${question.labels ? `(${question.labels[0]} → ${question.labels[1]})` : ""}`,
        note: value.note || "",
      };
    }
    case "touch": {
      const entries = Object.entries(value.states || {}).map(([itemValue, state]) => {
        const item = question.items.find((i) => i.value === itemValue);
        return { label: item ? item.label : itemValue, state, stateLabel: TRI_LABELS[state] || state };
      });
      if (entries.length === 0 && !value.note) return null;
      return { ...base, kind: "statelist", entries, note: value.note || "" };
    }
    case "willingness": {
      const entries = Object.entries(value.states || {}).map(([itemValue, state]) => {
        const item = question.items.find((i) => i.value === itemValue);
        const stateDef = question.states.find((s) => s.value === state);
        return { label: item ? item.label : itemValue, state, stateLabel: stateDef ? stateDef.label : state };
      });
      if (entries.length === 0) return null;
      return { ...base, kind: "statelist", entries, note: "" };
    }
    case "text": {
      if (!value || !value.trim()) return null;
      return { ...base, kind: "text", value };
    }
    case "text-pair": {
      const parts = question.fields
        .map((f) => ({ label: f.label, value: value[f.key] }))
        .filter((p) => p.value && p.value.trim());
      if (parts.length === 0) return null;
      return { ...base, kind: "textpair", parts };
    }
    default:
      return null;
  }
}

const SECTION_DEFS = [
  { key: "intimacy", title: "亲密需求", chapterId: "A" },
  { key: "commitment", title: "承诺期待", chapterId: "B" },
  { key: "boundaries", title: "边界清单", chapterId: "C" },
  { key: "communication", title: "沟通偏好", chapterId: "D" },
  { key: "sexBoundaries", title: "性与身体边界", chapterId: "E", optional: true },
];

export function buildProfileSections(answers, { includeOptional = true } = {}) {
  return SECTION_DEFS.filter((def) => includeOptional || !def.optional).map((def) => {
    const chapter = getChapter(def.chapterId);
    const items = chapter.questions
      .map((q) => summarizeQuestion(q, def.chapterId, answers[q.id]))
      .filter(Boolean);
    return { ...def, items };
  });
}

export const TRI_LABELS = {
  comfortable: "舒适",
  depends: "视情况",
  uncomfortable: "不适",
};

export function profileToText(sections, { title = "我的关系画像", generatedAt } = {}) {
  const lines = [title];
  if (generatedAt) lines.push(generatedAt);
  lines.push("");
  for (const section of sections) {
    if (section.items.length === 0) continue;
    lines.push(`【${section.title}】`);
    for (const item of section.items) {
      if (item.kind === "tags") {
        lines.push(`· ${item.label}: ${item.tags.join("、")}`);
      } else if (item.kind === "kv") {
        lines.push(`· ${item.label}: ${item.value}${item.note ? `(${item.note})` : ""}`);
      } else if (item.kind === "statelist") {
        const entriesText = item.entries.map((e) => `${e.label}(${e.stateLabel})`).join("、");
        lines.push(`· ${item.label}: ${entriesText}${item.note ? ` / 补充: ${item.note}` : ""}`);
      } else if (item.kind === "text") {
        lines.push(`· ${item.label}: ${item.value}`);
      } else if (item.kind === "textpair") {
        lines.push(`· ${item.label}:`);
        for (const p of item.parts) lines.push(`  - ${p.label}: ${p.value}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
