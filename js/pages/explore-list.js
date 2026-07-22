import { el, mountInto } from "../components/dom.js";
import { CHAPTERS, chapterProgress, isAnswered } from "../data/questions.js";

export async function mountExploreList(main, ctx) {
  const answers = await ctx.db.getAllAnswers();

  const list = el("div", { class: "chapter-list" });
  for (const chapter of CHAPTERS) {
    const { done, total } = chapterProgress(chapter.id, answers);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const card = el(
      "a",
      { class: "chapter-card", href: `#/explore/${chapter.id}/0` },
      [
        el("div", { class: "row" }, [
          el("h3", {}, [
            `${chapter.id} · ${chapter.title}`,
            chapter.optional ? el("span", { class: "badge-soon", style: "margin-left:8px;" }, ["可选"]) : null,
          ]),
          el("span", { class: "count" }, [`${done}/${total}`]),
        ]),
        el("div", { class: "progress-bar" }, [
          el("div", { style: `width:${pct}%` }),
        ]),
      ]
    );
    list.appendChild(card);
  }

  const anyAnswered = CHAPTERS.flatMap((c) => c.questions).some((q) =>
    isAnswered(answers[q.id])
  );

  const wrap = el("div", {}, [
    el("p", { class: "page-subtitle" }, [
      '分成几个章节,想到哪答到哪,随时可以回来继续。答案会自动保存,标"可选"的章节可以完全跳过。',
    ]),
    list,
    anyAnswered
      ? el("div", { class: "cta-row" }, [
          el("a", { class: "btn btn-primary btn-block", href: "#/profile" }, [
            "查看我的关系画像",
          ]),
        ])
      : null,
  ]);

  mountInto(main, wrap);
}
