import { el, mountInto } from "../components/dom.js";
import { showToast } from "../components/ui.js";

export async function mountReview(main, ctx, { id }) {
  const relId = Number(id);
  const rel = await ctx.db.getRelationship(relId);

  if (!rel) {
    mountInto(main, el("p", {}, ["没有找到这份关系档案。"]));
    return;
  }

  const answers = { workingWell: "", needsAdjustment: "", notes: "" };

  function field(key, label, hint) {
    return el("div", { class: "question-block", style: "margin-bottom:12px;padding:16px 18px;" }, [
      el("p", { class: "question-text", style: "font-size:1rem;" }, [label]),
      hint ? el("p", { class: "question-hint" }, [hint]) : null,
      el("textarea", {
        class: "text-input",
        oninput: (e) => {
          answers[key] = e.target.value;
        },
      }),
    ]);
  }

  const saveBtn = el(
    "button",
    {
      class: "btn btn-primary btn-block",
      onclick: async () => {
        await ctx.db.recordReview(relId, { ...answers });
        showToast("回顾已记录到档案");
        ctx.navigate(`#/relationships/${relId}`);
      },
    },
    ["保存本次回顾"]
  );

  mountInto(
    main,
    el("div", {}, [
      el("p", { class: "page-subtitle" }, [`和「${rel.name}」一起做一次关系回顾`]),
      field("workingWell", "哪些约定运行良好?"),
      field("needsAdjustment", "哪些需要调整?"),
      field("notes", "其他想法(可选)", "任何想记录下来的感受或变化"),
      saveBtn,
      el("a", { class: "btn btn-ghost btn-block", style: "margin-top:10px;", href: `#/relationships/${relId}` }, [
        "取消,返回档案",
      ]),
    ])
  );
}
