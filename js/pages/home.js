import { el, mountInto } from "../components/dom.js";
import { CHAPTERS } from "../data/questions.js";
import { SPECTRUM_AXES } from "../data/spectrum.js";

export async function mountHome(main, ctx) {
  const [answers, relationships, dueRelationships, spectrumCurrent] = await Promise.all([
    ctx.db.getAllAnswers(),
    ctx.db.listRelationships(),
    ctx.db.listDueRelationships(),
    ctx.db.getSpectrumCurrent(),
  ]);
  const totalQuestions = CHAPTERS.reduce((n, c) => n + c.questions.length, 0);
  const answeredCount = CHAPTERS.flatMap((c) => c.questions).filter(
    (q) => answers[q.id] !== undefined
  ).length;
  const activeRelCount = relationships.filter((r) => !r.archived).length;
  const markedAxesCount = SPECTRUM_AXES.filter(
    (a) => spectrumCurrent.axes[a.id] !== null && spectrumCurrent.axes[a.id] !== undefined
  ).length;

  const hero = el("div", { class: "hero" }, [
    el("h2", {}, ["理清你想要的关系"]),
    el("p", {}, [
      "一个纯本地的酷儿柏拉图关系自我探索与关系管理工具。所有内容只保存在这台设备上。",
    ]),
  ]);

  const grid = el("div", { class: "module-grid" }, [
    el(
      "a",
      {
        class: "module-card",
        href: "#/explore",
      },
      [
        el("div", { class: "icon" }, ["🧭"]),
        el("div", { class: "body" }, [
          el("h3", {}, ["自我探索"]),
          el("p", {}, [
            answeredCount === 0
              ? "还没开始 · 共 " + totalQuestions + " 题"
              : `已完成 ${answeredCount} / ${totalQuestions} 题`,
          ]),
        ]),
      ]
    ),
    el(
      "a",
      { class: "module-card", href: "#/spectrum" },
      [
        el("div", { class: "icon" }, ["🌈"]),
        el("div", { class: "body" }, [
          el("h3", {}, ["我的光谱"]),
          el("p", {}, [
            markedAxesCount === 0
              ? "七条光谱轴,标记你此刻的位置"
              : `已标记 ${markedAxesCount} / ${SPECTRUM_AXES.length} 条轴`,
          ]),
        ]),
      ]
    ),
    el(
      "a",
      { class: "module-card", href: "#/relationships" },
      [
        el("div", { class: "icon" }, ["🗂️"]),
        el("div", { class: "body" }, [
          el("h3", {}, ["关系档案"]),
          el("p", {}, [
            activeRelCount === 0
              ? "记录边界、承诺与纪念日,内置边界协商模板与定期回顾"
              : `${activeRelCount} 段进行中的关系`,
          ]),
        ]),
        dueRelationships.length > 0
          ? el("span", { class: "badge-soon", style: "background:var(--primary-soft);color:var(--primary-dark);" }, [
              `${dueRelationships.length} 个待回顾`,
            ])
          : null,
      ]
    ),
    el(
      "a",
      {
        class: "module-card",
        href: "#/wiki",
      },
      [
        el("div", { class: "icon" }, ["📖"]),
        el("div", { class: "body" }, [
          el("h3", {}, ["小百科"]),
          el("p", {}, ["了解 QPR 相关的概念和词汇"]),
        ]),
      ]
    ),
  ]);

  const settingsLink = el("div", { class: "cta-row" }, [
    el("a", { class: "btn btn-ghost btn-block", href: "#/settings" }, [
      "设置与隐私说明",
    ]),
  ]);

  mountInto(main, el("div", {}, [hero, grid, settingsLink]));
}
