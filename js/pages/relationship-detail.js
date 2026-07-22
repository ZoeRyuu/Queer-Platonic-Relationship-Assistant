import { el, mountInto, clear } from "../components/dom.js";
import { openModal, confirmModal, promptText, showToast } from "../components/ui.js";
import { openRelationshipForm } from "../components/relationship-form.js";

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const REVIEW_CYCLE_OPTIONS = [
  { value: "", label: "不提醒" },
  { value: "30", label: "每月" },
  { value: "90", label: "每 3 个月" },
  { value: "180", label: "每半年" },
  { value: "365", label: "每年" },
];

function versionedItem(item, { onEdit, onDelete }) {
  const historyWrap = el("div", { style: "display:none;margin-top:8px;padding-left:10px;border-left:2px solid var(--border);" });
  for (const h of [...item.history].reverse()) {
    historyWrap.appendChild(
      el("div", { style: "font-size:0.82rem;color:var(--text-muted);margin-bottom:6px;" }, [
        el("div", {}, [h.text]),
        el("div", {}, [`更新于 ${formatDate(h.updatedAt)}`]),
      ])
    );
  }

  const row = el("div", { class: "settings-item" }, [
    el("p", { style: "margin:0 0 6px;" }, [item.text]),
    el("div", { class: "row", style: "font-size:0.78rem;color:var(--text-muted);" }, [
      el("span", {}, [`更新于 ${formatDate(item.updatedAt)}`]),
      el("div", { style: "display:flex;gap:10px;" }, [
        item.history.length > 0
          ? el(
              "a",
              {
                href: "#",
                onclick: (e) => {
                  e.preventDefault();
                  historyWrap.style.display = historyWrap.style.display === "none" ? "block" : "none";
                },
              },
              [`历史版本 (${item.history.length})`]
            )
          : null,
        el("a", { href: "#", onclick: (e) => { e.preventDefault(); onEdit(); } }, ["编辑"]),
        el("a", { href: "#", onclick: (e) => { e.preventDefault(); onDelete(); } }, ["删除"]),
      ]),
    ]),
    historyWrap,
  ]);
  return row;
}

function agreementItem(item, { onEdit, onDelete }) {
  return el("div", { class: "settings-item" }, [
    el("div", { class: "row" }, [
      el("strong", {}, [item.title || "共同约定"]),
      el("div", { style: "display:flex;gap:10px;font-size:0.85rem;" }, [
        el("a", { href: "#", onclick: (e) => { e.preventDefault(); onEdit(); } }, ["编辑"]),
        el("a", { href: "#", onclick: (e) => { e.preventDefault(); onDelete(); } }, ["删除"]),
      ]),
    ]),
    item.note ? el("p", { style: "margin:6px 0 0;white-space:pre-wrap;" }, [item.note]) : null,
    el("p", { class: "desc" }, [`更新于 ${formatDate(item.updatedAt)}`]),
  ]);
}

function openAgreementForm({ title, initial = {} }) {
  return new Promise((resolve) => {
    const titleInput = el("input", {
      type: "text",
      class: "text-input",
      style: "min-height:auto;margin-bottom:10px;",
      placeholder: "约定标题,例如: 对外介绍方式",
      value: initial.title || "",
    });
    const noteInput = el("textarea", {
      class: "text-input",
      placeholder: "具体内容",
      value: initial.note || "",
    });
    openModal({
      title,
      body: el("div", {}, [titleInput, noteInput]),
      actions: [
        { label: "取消", className: "btn-secondary", onClick: () => resolve(null) },
        {
          label: "保存",
          className: "btn-primary",
          onClick: () => {
            const t = titleInput.value.trim();
            if (!t) {
              resolve(null);
              return;
            }
            resolve({ title: t, note: noteInput.value.trim() });
          },
        },
      ],
    });
  });
}

function openAnniversaryForm() {
  return new Promise((resolve) => {
    const labelInput = el("input", {
      type: "text",
      class: "text-input",
      style: "min-height:auto;margin-bottom:10px;",
      placeholder: "纪念日名称,例如: 第一次见面",
    });
    const dateInput = el("input", { type: "date", class: "text-input", style: "min-height:auto;" });
    openModal({
      title: "添加纪念日",
      body: el("div", {}, [labelInput, dateInput]),
      actions: [
        { label: "取消", className: "btn-secondary", onClick: () => resolve(null) },
        {
          label: "保存",
          className: "btn-primary",
          onClick: () => {
            const label = labelInput.value.trim();
            if (!label || !dateInput.value) {
              resolve(null);
              return;
            }
            resolve({ label, date: dateInput.value });
          },
        },
      ],
    });
  });
}

export async function mountRelationshipDetail(main, ctx, { id }) {
  const relId = Number(id);
  const rel = await ctx.db.getRelationship(relId);

  if (!rel) {
    mountInto(
      main,
      el("div", {}, [
        el("p", {}, ["没有找到这份关系档案。"]),
        el("a", { class: "btn btn-secondary", href: "#/relationships" }, ["返回档案列表"]),
      ])
    );
    return;
  }

  function rerender() {
    mountRelationshipDetail(main, ctx, { id });
  }

  const isDue = rel.nextReviewAt && rel.nextReviewAt <= Date.now() && !rel.archived;

  const wrap = el("div", {});

  if (rel.archived) {
    wrap.appendChild(
      el("div", { class: "settings-item", style: "border-color:var(--warn);" }, [
        el("p", { style: "margin:0;" }, ["这份档案已归档"]),
      ])
    );
  }

  if (isDue) {
    wrap.appendChild(
      el("div", { class: "settings-item", style: "border-color:var(--primary);background:var(--primary-soft);" }, [
        el("div", { class: "row" }, [
          el("strong", {}, ["该做一次关系回顾了"]),
          el("a", { class: "btn btn-primary", href: `#/relationships/${relId}/review` }, ["开始回顾"]),
        ]),
      ])
    );
  }

  // ---- basic info ----
  const infoSection = el("div", { class: "profile-section" }, [
    el("div", { class: "row" }, [
      el("h3", { style: "color:var(--text);font-size:1.2rem;" }, [rel.name]),
      el(
        "button",
        {
          class: "btn btn-ghost",
          onclick: async () => {
            const fields = await openRelationshipForm({ title: "编辑基本信息", initial: rel, submitLabel: "保存" });
            if (!fields) return;
            await ctx.db.updateRelationshipBasic(relId, fields);
            rerender();
          },
        },
        ["编辑"]
      ),
    ]),
    rel.tags.length
      ? el("div", { class: "tag-list", style: "margin-bottom:10px;" }, rel.tags.map((t) => el("span", { class: "tag" }, [t])))
      : null,
    rel.startDate ? el("div", { class: "kv-row" }, [el("span", { class: "k" }, ["开始时间"]), el("span", {}, [rel.startDate])]) : null,
    rel.status ? el("div", { class: "kv-row" }, [el("span", { class: "k" }, ["当前状态"]), el("span", {}, [rel.status])]) : null,
    el(
      "button",
      {
        class: `btn ${rel.archived ? "btn-secondary" : "btn-ghost"} btn-block`,
        style: "margin-top:12px;",
        onclick: async () => {
          const ok = await confirmModal({
            title: rel.archived ? "取消归档?" : "归档这份档案?",
            body: rel.archived ? "取消归档后会重新出现在进行中列表。" : "归档不会删除任何记录,关系结束不等于删除记忆,随时可以取消归档。",
          });
          if (!ok) return;
          await ctx.db.setRelationshipArchived(relId, !rel.archived);
          showToast(rel.archived ? "已取消归档" : "已归档");
          rerender();
        },
      },
      [rel.archived ? "取消归档" : "归档这份档案"]
    ),
  ]);
  wrap.appendChild(infoSection);

  // ---- boundaries ----
  const boundariesSection = el("div", { class: "profile-section" }, [el("h3", {}, ["边界"])]);
  if (rel.boundaries.length === 0) {
    boundariesSection.appendChild(el("p", { class: "empty-note" }, ["还没有记录任何边界"]));
  }
  for (const item of rel.boundaries) {
    boundariesSection.appendChild(
      versionedItem(item, {
        onEdit: async () => {
          const text = await promptText({ title: "编辑边界", initial: item.text });
          if (!text) return;
          await ctx.db.updateBoundary(relId, item.id, text);
          rerender();
        },
        onDelete: async () => {
          const ok = await confirmModal({ title: "删除这条边界?", danger: true, confirmLabel: "删除" });
          if (!ok) return;
          await ctx.db.removeBoundary(relId, item.id);
          rerender();
        },
      })
    );
  }
  boundariesSection.appendChild(
    el(
      "button",
      {
        class: "btn btn-secondary btn-block",
        style: "margin-top:8px;",
        onclick: async () => {
          const text = await promptText({ title: "添加边界", placeholder: "例如: 需要提前商量再对外介绍关系" });
          if (!text) return;
          await ctx.db.addBoundary(relId, text);
          rerender();
        },
      },
      ["+ 添加边界"]
    )
  );
  wrap.appendChild(boundariesSection);

  // ---- commitments ----
  const commitmentsSection = el("div", { class: "profile-section" }, [el("h3", {}, ["承诺"])]);
  if (rel.commitments.length === 0) {
    commitmentsSection.appendChild(el("p", { class: "empty-note" }, ["还没有记录任何承诺"]));
  }
  for (const item of rel.commitments) {
    commitmentsSection.appendChild(
      versionedItem(item, {
        onEdit: async () => {
          const text = await promptText({ title: "编辑承诺", initial: item.text });
          if (!text) return;
          await ctx.db.updateCommitment(relId, item.id, text);
          rerender();
        },
        onDelete: async () => {
          const ok = await confirmModal({ title: "删除这条承诺?", danger: true, confirmLabel: "删除" });
          if (!ok) return;
          await ctx.db.removeCommitment(relId, item.id);
          rerender();
        },
      })
    );
  }
  commitmentsSection.appendChild(
    el(
      "button",
      {
        class: "btn btn-secondary btn-block",
        style: "margin-top:8px;",
        onclick: async () => {
          const text = await promptText({ title: "添加承诺", placeholder: "例如: 互为紧急联系人" });
          if (!text) return;
          await ctx.db.addCommitment(relId, text);
          rerender();
        },
      },
      ["+ 添加承诺"]
    )
  );
  wrap.appendChild(commitmentsSection);

  // ---- anniversaries ----
  const anniversariesSection = el("div", { class: "profile-section" }, [el("h3", {}, ["重要纪念日"])]);
  if (rel.anniversaries.length === 0) {
    anniversariesSection.appendChild(el("p", { class: "empty-note" }, ["还没有添加纪念日"]));
  }
  for (const item of [...rel.anniversaries].sort((a, b) => a.date.localeCompare(b.date))) {
    anniversariesSection.appendChild(
      el("div", { class: "kv-row" }, [
        el("span", { class: "k" }, [item.label]),
        el("div", { style: "display:flex;gap:10px;align-items:center;" }, [
          el("span", {}, [item.date]),
          el(
            "a",
            {
              href: "#",
              onclick: async (e) => {
                e.preventDefault();
                const ok = await confirmModal({ title: "删除这个纪念日?", danger: true, confirmLabel: "删除" });
                if (!ok) return;
                await ctx.db.removeAnniversary(relId, item.id);
                rerender();
              },
            },
            ["删除"]
          ),
        ]),
      ])
    );
  }
  anniversariesSection.appendChild(
    el(
      "button",
      {
        class: "btn btn-secondary btn-block",
        style: "margin-top:8px;",
        onclick: async () => {
          const fields = await openAnniversaryForm();
          if (!fields) return;
          await ctx.db.addAnniversary(relId, fields);
          rerender();
        },
      },
      ["+ 添加纪念日"]
    )
  );
  wrap.appendChild(anniversariesSection);

  // ---- agreements ----
  const agreementsSection = el("div", { class: "profile-section" }, [el("h3", {}, ["共同约定"])]);
  if (rel.agreements.length === 0) {
    agreementsSection.appendChild(el("p", { class: "empty-note" }, ["还没有记录共同约定"]));
  }
  for (const item of [...rel.agreements].sort((a, b) => b.updatedAt - a.updatedAt)) {
    agreementsSection.appendChild(
      agreementItem(item, {
        onEdit: async () => {
          const fields = await openAgreementForm({ title: "编辑共同约定", initial: item });
          if (!fields) return;
          await ctx.db.updateAgreement(relId, item.id, fields);
          rerender();
        },
        onDelete: async () => {
          const ok = await confirmModal({ title: "删除这条约定?", danger: true, confirmLabel: "删除" });
          if (!ok) return;
          await ctx.db.removeAgreement(relId, item.id);
          rerender();
        },
      })
    );
  }
  agreementsSection.appendChild(
    el(
      "button",
      {
        class: "btn btn-secondary btn-block",
        style: "margin-top:8px;",
        onclick: async () => {
          const fields = await openAgreementForm({ title: "添加共同约定" });
          if (!fields) return;
          await ctx.db.addAgreement(relId, fields);
          rerender();
        },
      },
      ["+ 添加共同约定"]
    )
  );
  agreementsSection.appendChild(
    el("a", { class: "btn btn-secondary btn-block", style: "margin-top:10px;", href: `#/relationships/${relId}/negotiate` }, [
      "开始边界协商",
    ])
  );
  wrap.appendChild(agreementsSection);

  // ---- review cycle ----
  const reviewSection = el("div", { class: "profile-section" }, [el("h3", {}, ["定期回顾"])]);
  const cycleSelect = el(
    "select",
    {
      class: "text-input",
      style: "min-height:auto;",
      onchange: async (e) => {
        const days = e.target.value ? Number(e.target.value) : null;
        await ctx.db.setReviewCycle(relId, days);
        showToast("已更新回顾周期");
        rerender();
      },
    },
    REVIEW_CYCLE_OPTIONS.map((opt) =>
      el(
        "option",
        {
          value: opt.value,
          selected: String(rel.reviewCycleDays || "") === opt.value,
        },
        [opt.label]
      )
    )
  );
  reviewSection.appendChild(el("div", { style: "margin-bottom:10px;" }, [cycleSelect]));
  if (rel.lastReviewAt) {
    reviewSection.appendChild(
      el("div", { class: "kv-row" }, [el("span", { class: "k" }, ["上次回顾"]), el("span", {}, [formatDate(rel.lastReviewAt)])])
    );
  }
  if (rel.nextReviewAt) {
    reviewSection.appendChild(
      el("div", { class: "kv-row" }, [el("span", { class: "k" }, ["下次回顾"]), el("span", {}, [formatDate(rel.nextReviewAt)])])
    );
  }
  if (!isDue) {
    reviewSection.appendChild(
      el("a", { class: "btn btn-secondary btn-block", style: "margin-top:10px;", href: `#/relationships/${relId}/review` }, [
        "现在做一次回顾",
      ])
    );
  }
  if (rel.reviews.length > 0) {
    const historyToggle = el(
      "a",
      { href: "#", style: "display:inline-block;margin-top:10px;" },
      [`查看历史回顾记录 (${rel.reviews.length})`]
    );
    const historyList = el("div", { style: "display:none;margin-top:10px;" });
    for (const r of [...rel.reviews].sort((a, b) => b.date - a.date)) {
      historyList.appendChild(
        el("div", { class: "settings-item" }, [
          el("p", { class: "desc", style: "margin:0 0 6px;" }, [formatDate(r.date)]),
          r.workingWell ? el("p", { style: "margin:0 0 6px;" }, [el("strong", {}, ["运行良好: "]), r.workingWell]) : null,
          r.needsAdjustment ? el("p", { style: "margin:0 0 6px;" }, [el("strong", {}, ["需要调整: "]), r.needsAdjustment]) : null,
          r.notes ? el("p", { style: "margin:0;" }, [el("strong", {}, ["其他: "]), r.notes]) : null,
        ])
      );
    }
    historyToggle.addEventListener("click", (e) => {
      e.preventDefault();
      historyList.style.display = historyList.style.display === "none" ? "block" : "none";
    });
    reviewSection.appendChild(historyToggle);
    reviewSection.appendChild(historyList);
  }
  wrap.appendChild(reviewSection);

  mountInto(main, wrap);
}
