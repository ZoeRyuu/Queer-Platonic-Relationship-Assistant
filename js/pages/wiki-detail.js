import { el, mountInto } from "../components/dom.js";
import { getWikiEntry, WIKI_ENTRIES } from "../data/wiki.js";

export async function mountWikiDetail(main, ctx, { id }) {
  const entry = getWikiEntry(id);
  if (!entry) {
    mountInto(
      main,
      el("div", { class: "wiki-detail" }, [
        el("p", {}, ["没有找到这个词条。"]),
        el("a", { class: "btn btn-secondary", href: "#/wiki" }, ["返回小百科"]),
      ])
    );
    return;
  }

  const paragraphs = entry.body.split(/(?<=[。])/).filter((s) => s.trim());

  const detail = el("div", { class: "wiki-detail" }, [
    el("h2", {}, [entry.term]),
    ...paragraphs.map((p) => el("p", {}, [p])),
  ]);

  mountInto(
    main,
    el("div", {}, [
      detail,
      el("a", { class: "btn btn-secondary btn-block", href: "#/wiki", style: "margin-top:16px;" }, [
        "返回小百科列表",
      ]),
    ])
  );
}
