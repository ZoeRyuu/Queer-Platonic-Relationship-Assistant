import { el, mountInto } from "../components/dom.js";
import { WIKI_ENTRIES } from "../data/wiki.js";

export async function mountWikiList(main, ctx) {
  const list = el(
    "div",
    { class: "wiki-list" },
    WIKI_ENTRIES.map((entry) =>
      el("a", { class: "wiki-card", href: `#/wiki/${entry.id}` }, [
        el("div", {}, [
          el("div", { class: "term" }, [entry.term]),
          el("div", { class: "short" }, [entry.short]),
        ]),
        el("span", {}, ["›"]),
      ])
    )
  );

  mountInto(
    main,
    el("div", {}, [
      el("p", { class: "page-subtitle" }, ["一些关于非传统关系的词汇"]),
      list,
    ])
  );
}
