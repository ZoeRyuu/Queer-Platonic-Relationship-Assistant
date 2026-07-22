import { el } from "./dom.js";
import { openModal } from "./ui.js";

export function openRelationshipForm({ title, initial = {}, submitLabel = "保存" }) {
  return new Promise((resolve) => {
    const nameInput = el("input", {
      type: "text",
      class: "text-input",
      style: "min-height:auto;",
      placeholder: "怎么称呼这段关系 / 对方?",
      value: initial.name || "",
    });
    const tagsInput = el("input", {
      type: "text",
      class: "text-input",
      style: "min-height:auto;",
      placeholder: "自定义标签,用逗号分隔,例如: 柏拉图伴侣, 同居",
      value: (initial.tags || []).join(", "),
    });
    const startDateInput = el("input", {
      type: "date",
      class: "text-input",
      style: "min-height:auto;",
      value: initial.startDate || "",
    });
    const statusInput = el("input", {
      type: "text",
      class: "text-input",
      style: "min-height:auto;",
      placeholder: "当前状态,例如: 稳定进行中 / 正在磨合",
      value: initial.status || "",
    });

    const body = el("div", {}, [
      el("div", { style: "margin-bottom:12px;" }, [
        el("label", { style: "font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:4px;" }, ["称呼"]),
        nameInput,
      ]),
      el("div", { style: "margin-bottom:12px;" }, [
        el("label", { style: "font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:4px;" }, ["关系性质标签"]),
        tagsInput,
      ]),
      el("div", { style: "margin-bottom:12px;" }, [
        el("label", { style: "font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:4px;" }, ["开始时间"]),
        startDateInput,
      ]),
      el("div", {}, [
        el("label", { style: "font-size:0.8rem;color:var(--text-muted);display:block;margin-bottom:4px;" }, ["当前状态"]),
        statusInput,
      ]),
    ]);

    let resolved = false;
    const backdrop = openModal({
      title,
      body,
      actions: [
        {
          label: "取消",
          className: "btn-secondary",
          onClick: () => {
            resolved = true;
            resolve(null);
          },
        },
        {
          label: submitLabel,
          className: "btn-primary",
          onClick: () => {
            resolved = true;
            const name = nameInput.value.trim();
            if (!name) {
              resolve(null);
              return;
            }
            resolve({
              name,
              tags: tagsInput.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              startDate: startDateInput.value || null,
              status: statusInput.value.trim(),
            });
          },
        },
      ],
    });
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop && !resolved) resolve(null);
    });
  });
}
