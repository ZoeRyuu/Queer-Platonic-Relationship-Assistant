import { el, mountInto } from "../components/dom.js";
import { CHAPTERS, getChapter } from "../data/questions.js";
import { renderQuestion } from "../components/question-renderer.js";
import { showToast } from "../components/ui.js";

function findNav({ chapterId, index }) {
  const ci = CHAPTERS.findIndex((c) => c.id === chapterId);
  const chapter = CHAPTERS[ci];

  let prevHash = null;
  if (index > 0) {
    prevHash = `#/explore/${chapter.id}/${index - 1}`;
  } else if (ci > 0) {
    const prevChapter = CHAPTERS[ci - 1];
    prevHash = `#/explore/${prevChapter.id}/${prevChapter.questions.length - 1}`;
  } else {
    prevHash = "#/explore";
  }

  let nextHash = null;
  let isLast = false;
  if (index < chapter.questions.length - 1) {
    nextHash = `#/explore/${chapter.id}/${index + 1}`;
  } else if (ci < CHAPTERS.length - 1) {
    nextHash = `#/explore/${CHAPTERS[ci + 1].id}/0`;
  } else {
    nextHash = "#/profile";
    isLast = true;
  }

  return { prevHash, nextHash, isLast };
}

function skipChapterHash(chapterId) {
  const ci = CHAPTERS.findIndex((c) => c.id === chapterId);
  const chapter = CHAPTERS[ci];
  const { nextHash } = findNav({ chapterId, index: chapter.questions.length - 1 });
  return nextHash;
}

export async function mountExploreQuestion(main, ctx, { chapterId, index }) {
  const chapter = getChapter(chapterId);
  if (!chapter || index < 0 || index >= chapter.questions.length) {
    ctx.navigate("#/explore");
    return;
  }

  const question = chapter.questions[index];
  const answer = await ctx.db.getAnswer(question.id);
  const { prevHash, nextHash, isLast } = findNav({ chapterId, index });

  const totalInChapter = chapter.questions.length;
  const progressBar = el("div", { class: "progress-bar" }, [
    el("div", { style: `width:${((index + 1) / totalInChapter) * 100}%` }),
  ]);

  const progressRow = el("div", { class: "question-progress" }, [
    progressBar,
    el("span", { class: "label" }, [`${chapter.title} · ${index + 1}/${totalInChapter}`]),
  ]);

  const warningBanner =
    chapter.optional && chapter.warning
      ? el("div", { class: "settings-item", style: "border-color:var(--primary);background:var(--primary-soft);" }, [
          el("p", { style: "margin:0 0 8px;" }, [chapter.warning]),
          index === 0
            ? el(
                "a",
                { href: skipChapterHash(chapterId), style: "font-size:0.85rem;" },
                ["跳过整个" + chapter.title + "章节"]
              )
            : null,
        ])
      : null;

  const questionBlock = el("div", { class: "question-block" }, [
    renderQuestion(question, answer, (value) => {
      ctx.db.setAnswer(question.id, value);
    }),
  ]);

  const nav = el("div", { class: "question-nav" }, [
    el("div", { class: "left" }, [
      el(
        "button",
        {
          class: "btn btn-ghost",
          onclick: () => ctx.navigate(prevHash),
        },
        ["上一题"]
      ),
    ]),
    el("div", { class: "right" }, [
      el(
        "button",
        {
          class: "btn btn-secondary",
          onclick: () => ctx.navigate(nextHash),
        },
        ["跳过"]
      ),
      el(
        "button",
        {
          class: "btn btn-primary",
          onclick: () => {
            if (isLast) showToast("已完成全部问题,这是你的关系画像");
            ctx.navigate(nextHash);
          },
        },
        [isLast ? "完成" : "下一题"]
      ),
    ]),
  ]);

  mountInto(main, el("div", {}, [progressRow, warningBanner, questionBlock, nav]));
}
