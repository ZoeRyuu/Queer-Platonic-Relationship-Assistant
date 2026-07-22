import { el, mountInto, clear } from "../components/dom.js";
import { SPECTRUM_AXES } from "../data/spectrum.js";
import { renderStaticTrack, COMPARE_COLORS } from "../components/spectrum-track.js";
import { confirmModal, showToast } from "../components/ui.js";

const MAX_COMPARE = 3;

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function mountSpectrumSnapshots(main, ctx) {
  const [snapshots, current] = await Promise.all([ctx.db.listSpectrumSnapshots(), ctx.db.getSpectrumCurrent()]);

  const entries = [
    { id: "current", label: "当前", createdAt: Date.now(), axes: current.axes, isCurrent: true },
    ...snapshots.map((s) => ({ id: s.id, label: s.note || formatDate(s.createdAt), createdAt: s.createdAt, axes: s.axes })),
  ];

  const selected = new Set(["current"]);
  const compareWrap = el("div", {});

  function renderCompare() {
    clear(compareWrap);
    const chosen = entries.filter((e) => selected.has(e.id));
    if (chosen.length < 2) {
      compareWrap.appendChild(el("p", { class: "empty-note" }, ["选择 2-3 份记录即可叠加对比"]));
      return;
    }
    const points = chosen.map((e, i) => ({ entry: e, color: COMPARE_COLORS[i % COMPARE_COLORS.length] }));
    for (const axis of SPECTRUM_AXES) {
      compareWrap.appendChild(
        renderStaticTrack(
          axis,
          points.map((p) => ({ value: p.entry.axes[axis.id], color: p.color, label: p.entry.label }))
        )
      );
    }
  }

  const listWrap = el("div", { class: "chapter-list" });
  for (const entry of entries) {
    const checkbox = el("input", {
      type: "checkbox",
      checked: selected.has(entry.id),
      onchange: (e) => {
        if (e.target.checked) {
          if (selected.size >= MAX_COMPARE) {
            e.target.checked = false;
            showToast(`最多同时对比 ${MAX_COMPARE} 份`);
            return;
          }
          selected.add(entry.id);
        } else {
          selected.delete(entry.id);
        }
        renderCompare();
      },
    });

    const row = el("div", { class: "chapter-card", style: "display:flex;align-items:center;gap:12px;" }, [
      checkbox,
      el("div", { style: "flex:1;" }, [
        el("div", { class: "row" }, [
          el("h3", {}, [entry.label]),
          entry.isCurrent ? null : el("span", { class: "count" }, [formatDate(entry.createdAt)]),
        ]),
      ]),
      entry.isCurrent
        ? null
        : el(
            "button",
            {
              class: "btn btn-danger",
              onclick: async () => {
                const ok = await confirmModal({ title: "删除这份光谱快照?", danger: true, confirmLabel: "删除" });
                if (!ok) return;
                await ctx.db.deleteSpectrumSnapshot(entry.id);
                showToast("已删除快照");
                mountSpectrumSnapshots(main, ctx);
              },
            },
            ["删除"]
          ),
    ]);
    listWrap.appendChild(row);
  }

  renderCompare();

  mountInto(
    main,
    el("div", {}, [
      el("p", { class: "page-subtitle" }, ["快照按时间排序,勾选 2-3 份可以叠加对比,呈现光谱随时间的变化"]),
      listWrap,
      el("h3", { style: "margin:22px 0 12px;" }, ["对比视图"]),
      compareWrap,
    ])
  );
}
