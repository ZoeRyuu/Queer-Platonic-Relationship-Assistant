import { el, mountInto } from "../components/dom.js";
import { showToast } from "../components/ui.js";

const TOPICS = [
  "身体接触",
  "时间分配",
  "对外介绍方式",
  "财务",
  "排他性",
  "紧急联系人角色",
  "独处与社交需求",
];

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function mountNegotiation(main, ctx, { id }) {
  const relId = Number(id);
  const rel = await ctx.db.getRelationship(relId);

  if (!rel) {
    mountInto(main, el("p", {}, ["没有找到这份关系档案。"]));
    return;
  }

  const notesByTopic = {};

  const topicBlocks = TOPICS.map((topic) =>
    el("div", { class: "question-block", style: "margin-bottom:12px;padding:16px 18px;" }, [
      el("p", { class: "question-text", style: "font-size:1rem;" }, [topic]),
      el("textarea", {
        class: "text-input",
        style: "min-height:70px;",
        placeholder: "记录你们就这个话题达成的共识,可以留空跳过",
        oninput: (e) => {
          notesByTopic[topic] = e.target.value;
        },
      }),
    ])
  );

  const saveBtn = el(
    "button",
    {
      class: "btn btn-primary btn-block",
      onclick: async () => {
        const filled = TOPICS.filter((t) => (notesByTopic[t] || "").trim());
        if (filled.length === 0) {
          showToast("至少记录一个话题的共识再保存");
          return;
        }
        const note = filled.map((t) => `【${t}】${notesByTopic[t].trim()}`).join("\n\n");
        await ctx.db.addAgreement(relId, { title: `边界协商 · ${formatDate(Date.now())}`, note });
        showToast("协商记录已保存到共同约定");
        ctx.navigate(`#/relationships/${relId}`);
      },
    },
    ["保存协商记录到档案"]
  );

  mountInto(
    main,
    el("div", {}, [
      el("p", { class: "page-subtitle" }, [
        `和「${rel.name}」一起过一遍这些话题,记录你们达成的共识。没有讨论到的话题可以留空。`,
      ]),
      ...topicBlocks,
      saveBtn,
      el("a", { class: "btn btn-ghost btn-block", style: "margin-top:10px;", href: `#/relationships/${relId}` }, [
        "取消,返回档案",
      ]),
    ])
  );
}
