import { el, mountInto } from "../components/dom.js";
import { buildProfileSections, profileToText } from "../components/profile-model.js";
import { renderProfileCanvas, downloadCanvasAsPng } from "../components/export-image.js";
import { renderSpectrumCanvas } from "../components/export-spectrum-image.js";
import { openModal, confirmModal, showToast } from "../components/ui.js";
import { isAnswered } from "../data/questions.js";
import { SPECTRUM_AXES } from "../data/spectrum.js";
import { renderStaticTrack, COMPARE_COLORS } from "../components/spectrum-track.js";

function stackCanvases(a, b) {
  const width = Math.max(a.width, b.width);
  const height = a.height + b.height;
  const combined = document.createElement("canvas");
  combined.width = width;
  combined.height = height;
  const ctx = combined.getContext("2d");
  ctx.fillStyle = "#faf6f1";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(a, 0, 0);
  ctx.drawImage(b, 0, a.height);
  return combined;
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function renderItem(item, editable) {
  const head = el("div", { class: "kv-row", style: "border-bottom:none;padding-bottom:2px;" }, [
    el("span", { class: "k" }, [item.label]),
    editable
      ? el("a", { href: item.editHash, style: "font-size:0.8rem;" }, ["编辑"])
      : null,
  ]);

  let body;
  if (item.kind === "tags") {
    body = el("div", { class: "tag-list" }, item.tags.map((t) => el("span", { class: "tag" }, [t])));
  } else if (item.kind === "kv") {
    body = el("div", {}, [item.value + (item.note ? `(${item.note})` : "")]);
  } else if (item.kind === "statelist") {
    body = el("div", { class: "tag-list" }, [
      ...item.entries.map((e) => el("span", { class: `tag ${e.state}` }, [`${e.label} · ${e.stateLabel}`])),
      item.note ? el("div", { class: "empty-note", style: "width:100%;margin-top:6px;" }, [item.note]) : null,
    ]);
  } else if (item.kind === "text") {
    body = el("div", {}, [item.value]);
  } else if (item.kind === "textpair") {
    body = el(
      "div",
      {},
      item.parts.map((p) => el("div", { style: "margin-bottom:4px;" }, [el("strong", {}, [p.label + ": "]), p.value]))
    );
  }

  return el("div", { style: "margin-bottom:14px;" }, [head, body]);
}

function renderSection(section, editable) {
  const wrap = el("div", { class: "profile-section" }, [el("h3", {}, [section.title])]);
  if (section.items.length === 0) {
    wrap.appendChild(el("p", { class: "empty-note" }, ["还没有相关回答"]));
  } else {
    for (const item of section.items) wrap.appendChild(renderItem(item, editable));
  }
  return wrap;
}

export async function mountProfile(main, ctx, { snapshotId } = {}) {
  const liveAnswers = await ctx.db.getAllAnswers();
  const snapshots = await ctx.db.listSnapshots();
  const spectrumCurrent = await ctx.db.getSpectrumCurrent();

  let viewingSnapshot = null;
  if (snapshotId) {
    viewingSnapshot = snapshots.find((s) => String(s.id) === String(snapshotId));
  }

  const answers = viewingSnapshot ? viewingSnapshot.answers : liveAnswers;
  const editable = !viewingSnapshot;
  const hasAnyAnswer = Object.keys(liveAnswers).some((qid) => isAnswered(liveAnswers[qid]));

  const sections = buildProfileSections(answers);
  const sexSection = sections.find((s) => s.key === "sexBoundaries");
  const hasSexContent = sexSection && sexSection.items.length > 0;
  const hasSpectrumContent = SPECTRUM_AXES.some(
    (a) => spectrumCurrent.axes[a.id] !== null && spectrumCurrent.axes[a.id] !== undefined
  );

  async function getExportOptions() {
    if (!hasSexContent && !hasSpectrumContent) return { sections, includeSpectrum: false };
    const sexCheckbox = hasSexContent ? el("input", { type: "checkbox" }) : null;
    const spectrumCheckbox = hasSpectrumContent ? el("input", { type: "checkbox" }) : null;
    const body = el("div", {}, [
      sexCheckbox
        ? el("label", { style: "display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:10px;" }, [
            sexCheckbox,
            el("span", {}, ['包含"性与身体边界"分区']),
          ])
        : null,
      spectrumCheckbox
        ? el("label", { style: "display:flex;align-items:center;gap:8px;cursor:pointer;" }, [
            spectrumCheckbox,
            el("span", {}, ['包含"我的光谱"分区']),
          ])
        : null,
      el("p", { class: "desc", style: "margin-top:8px;" }, ["默认不包含,勾选后本次导出会带上对应内容"]),
    ]);
    return new Promise((resolve) => {
      openModal({
        title: "导出前确认",
        body,
        actions: [
          { label: "取消", className: "btn-secondary", onClick: () => resolve(null) },
          {
            label: "导出",
            className: "btn-primary",
            onClick: () => {
              const includeSex = sexCheckbox ? sexCheckbox.checked : false;
              const includeSpectrum = spectrumCheckbox ? spectrumCheckbox.checked : false;
              resolve({
                sections: includeSex ? sections : sections.filter((s) => s.key !== "sexBoundaries"),
                includeSpectrum,
              });
            },
          },
        ],
      });
    });
  }

  const chipBar = el("div", { class: "snapshot-bar" }, [
    el(
      "button",
      {
        class: `snapshot-chip${!viewingSnapshot ? " active" : ""}`,
        onclick: () => ctx.navigate("#/profile"),
      },
      ["当前"]
    ),
    ...snapshots.map((s) =>
      el(
        "button",
        {
          class: `snapshot-chip${viewingSnapshot && String(viewingSnapshot.id) === String(s.id) ? " active" : ""}`,
          onclick: () => ctx.navigate(`#/profile/${s.id}`),
        },
        [s.name || formatDate(s.createdAt)]
      )
    ),
  ]);

  const wrap = el("div", {});
  wrap.appendChild(el("p", { class: "page-subtitle" }, ["随时可以回去修改任意一项回答,画像会实时更新"]));

  if (snapshots.length > 0 || viewingSnapshot) {
    wrap.appendChild(chipBar);
  }

  if (viewingSnapshot) {
    const banner = el("div", { class: "settings-item" }, [
      el("div", { class: "row" }, [
        el("strong", {}, [viewingSnapshot.name || "未命名快照"]),
        el(
          "button",
          {
            class: "btn btn-danger",
            onclick: async () => {
              const ok = await confirmModal({
                title: "删除这份快照?",
                body: "删除后无法恢复。",
                danger: true,
                confirmLabel: "删除",
              });
              if (ok) {
                await ctx.db.deleteSnapshot(viewingSnapshot.id);
                showToast("已删除快照");
                ctx.navigate("#/profile");
              }
            },
          },
          ["删除快照"]
        ),
      ]),
      el("p", { class: "desc" }, [`创建于 ${formatDate(viewingSnapshot.createdAt)} · 只读,不能在此修改答案`]),
    ]);
    wrap.appendChild(banner);
  }

  if (!hasAnyAnswer && !viewingSnapshot && !hasSpectrumContent) {
    wrap.appendChild(
      el("div", { class: "profile-section", style: "text-align:center;" }, [
        el("p", { class: "empty-note" }, ["还没有开始自我探索问卷"]),
        el("a", { class: "btn btn-primary", href: "#/explore", style: "margin-top:8px;" }, ["开始探索"]),
      ])
    );
    mountInto(main, wrap);
    return;
  }

  for (const section of sections) wrap.appendChild(renderSection(section, editable));

  const spectrumSection = el("div", { class: "profile-section" }, [
    el("div", { class: "row" }, [
      el("h3", {}, ["我的光谱"]),
      editable ? el("a", { href: "#/spectrum", style: "font-size:0.8rem;" }, ["编辑"]) : null,
    ]),
  ]);
  if (!hasSpectrumContent) {
    spectrumSection.appendChild(el("p", { class: "empty-note" }, ["还没有标记任何一条轴"]));
  } else {
    for (const axis of SPECTRUM_AXES) {
      spectrumSection.appendChild(
        renderStaticTrack(axis, [{ value: spectrumCurrent.axes[axis.id], color: COMPARE_COLORS[0] }])
      );
    }
  }
  wrap.appendChild(spectrumSection);

  const actions = el("div", { class: "cta-row", style: "flex-wrap:wrap;" }, [
    el(
      "button",
      {
        class: "btn btn-secondary",
        onclick: async () => {
          const options = await getExportOptions();
          if (!options) return;
          let text = profileToText(options.sections, { generatedAt: formatDate(Date.now()) });
          if (options.includeSpectrum) {
            text += "\n\n【我的光谱】\n";
            text += SPECTRUM_AXES.map((axis) => {
              const v = spectrumCurrent.axes[axis.id];
              return `· ${axis.label}: ${v === null || v === undefined ? "未标记" : `${v}/100(${axis.leftLabel} → ${axis.rightLabel})`}`;
            }).join("\n");
          }
          try {
            await navigator.clipboard.writeText(text);
            showToast("已复制到剪贴板");
          } catch {
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "我的关系画像.txt";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          }
        },
      },
      ["导出为文本"]
    ),
    el(
      "button",
      {
        class: "btn btn-secondary",
        onclick: async () => {
          const options = await getExportOptions();
          if (!options) return;
          const profileCanvas = renderProfileCanvas(options.sections, { generatedAt: formatDate(Date.now()) });
          let canvas = profileCanvas;
          if (options.includeSpectrum) {
            const spectrumCanvas = renderSpectrumCanvas(SPECTRUM_AXES, spectrumCurrent.axes, { title: "我的光谱" });
            canvas = stackCanvases(profileCanvas, spectrumCanvas);
          }
          downloadCanvasAsPng(canvas, "我的关系画像.png");
        },
      },
      ["导出为图片"]
    ),
  ]);

  if (!viewingSnapshot) {
    actions.appendChild(
      el(
        "button",
        {
          class: "btn btn-primary",
          onclick: () => {
            const input = el("input", {
              type: "text",
              class: "text-input",
              placeholder: `例如: ${formatDate(Date.now())}`,
              style: "min-height:auto;",
            });
            openModal({
              title: "创建画像快照",
              body: input,
              actions: [
                { label: "取消", className: "btn-secondary" },
                {
                  label: "保存",
                  className: "btn-primary",
                  onClick: async () => {
                    const name = input.value.trim() || formatDate(Date.now());
                    const snap = await ctx.db.createSnapshot(name);
                    showToast("已创建快照");
                    ctx.navigate(`#/profile/${snap.id}`);
                  },
                },
              ],
            });
          },
        },
        ["创建快照"]
      )
    );
  }

  wrap.appendChild(actions);
  mountInto(main, wrap);
}
