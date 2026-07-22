import { el, mountInto, clear } from "../components/dom.js";
import { SPECTRUM_AXES } from "../data/spectrum.js";
import { renderAxisTitle, renderAxisLabels } from "../components/spectrum-track.js";
import { openModal, showToast } from "../components/ui.js";
import { renderSpectrumCanvas } from "../components/export-spectrum-image.js";
import { downloadCanvasAsPng } from "../components/export-image.js";

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function renderAxisEditor(axis, initialValue, onChange) {
  let value = initialValue === undefined ? null : initialValue;
  const body = el("div", {});

  function renderControl() {
    clear(body);
    if (value === null) {
      body.appendChild(
        el("div", { class: "spectrum-track-empty" })
      );
      body.appendChild(
        el(
          "button",
          {
            class: "btn btn-secondary",
            onclick: () => {
              value = 50;
              onChange(value);
              renderControl();
            },
          },
          ["点击标记我的位置"]
        )
      );
      return;
    }

    const valueLabel = el("span", { style: "font-size:0.8rem;color:var(--text-muted);" }, [`${value}`]);
    const slider = el("input", {
      type: "range",
      min: 0,
      max: 100,
      step: 1,
      value,
      oninput: (e) => {
        value = Number(e.target.value);
        valueLabel.textContent = `${value}`;
        onChange(value);
      },
    });
    body.appendChild(slider);
    body.appendChild(
      el("div", { class: "spectrum-controls", style: "margin-top:8px;justify-content:space-between;" }, [
        valueLabel,
        el(
          "a",
          {
            href: "#",
            style: "font-size:0.82rem;",
            onclick: (e) => {
              e.preventDefault();
              value = null;
              onChange(null);
              renderControl();
            },
          },
          ["跳过此轴"]
        ),
      ])
    );
  }

  renderControl();

  const wrap = el("div", { class: "spectrum-axis" }, [renderAxisTitle(axis), renderAxisLabels(axis), body]);
  return wrap;
}

export async function mountSpectrumEdit(main, ctx) {
  const current = await ctx.db.getSpectrumCurrent();

  const wrap = el("div", {});
  wrap.appendChild(
    el("p", { class: "page-subtitle" }, [
      '这是一个自我探索工具,不是测试。每条轴都没有"正确"位置,两端也不代表对立或优劣,标记之后随时可以修改。',
    ])
  );

  for (const axis of SPECTRUM_AXES) {
    wrap.appendChild(
      renderAxisEditor(axis, current.axes[axis.id], (value) => {
        ctx.db.setSpectrumAxisValue(axis.id, value);
      })
    );
  }

  const actions = el("div", { class: "cta-row", style: "flex-wrap:wrap;" }, [
    el(
      "button",
      {
        class: "btn btn-primary",
        onclick: () => {
          const input = el("input", {
            type: "text",
            class: "text-input",
            style: "min-height:auto;",
            placeholder: "可选备注,例如: 刚出柜的这段时间",
          });
          openModal({
            title: "保存本次光谱快照",
            body: input,
            actions: [
              { label: "取消", className: "btn-secondary" },
              {
                label: "保存",
                className: "btn-primary",
                onClick: async () => {
                  await ctx.db.createSpectrumSnapshot(input.value.trim());
                  showToast("已保存快照");
                },
              },
            ],
          });
        },
      },
      ["创建快照"]
    ),
    el("a", { class: "btn btn-secondary", href: "#/spectrum/snapshots" }, ["查看快照与对比"]),
    el(
      "button",
      {
        class: "btn btn-secondary",
        onclick: async () => {
          const latest = await ctx.db.getSpectrumCurrent();
          const canvas = renderSpectrumCanvas(SPECTRUM_AXES, latest.axes, { generatedAt: formatDate(Date.now()) });
          downloadCanvasAsPng(canvas, "我的光谱.png");
        },
      },
      ["导出为图片"]
    ),
  ]);
  wrap.appendChild(actions);

  mountInto(main, wrap);
}
