import { el, mountInto } from "../components/dom.js";
import { openRelationshipForm } from "../components/relationship-form.js";
import { showToast } from "../components/ui.js";

function relCard(rel) {
  return el("a", { class: "chapter-card", href: `#/relationships/${rel.id}` }, [
    el("div", { class: "row" }, [
      el("h3", {}, [rel.name]),
      rel.startDate ? el("span", { class: "count" }, [rel.startDate]) : null,
    ]),
    rel.tags.length
      ? el("div", { class: "tag-list", style: "margin-bottom:6px;" }, rel.tags.map((t) => el("span", { class: "tag" }, [t])))
      : null,
    rel.status ? el("p", { class: "empty-note", style: "margin:0;" }, [rel.status]) : null,
  ]);
}

export async function mountRelationshipList(main, ctx) {
  const all = await ctx.db.listRelationships();
  const active = all.filter((r) => !r.archived);
  const archived = all.filter((r) => r.archived);

  let showArchived = false;

  const listWrap = el("div", { class: "chapter-list" });

  function renderList() {
    listWrap.innerHTML = "";
    const items = showArchived ? archived : active;
    if (items.length === 0) {
      listWrap.appendChild(
        el("p", { class: "empty-note" }, [showArchived ? "还没有已归档的档案" : "还没有建立任何关系档案"])
      );
    } else {
      for (const rel of items) listWrap.appendChild(relCard(rel));
    }
  }
  renderList();

  const tabs = el("div", { class: "cta-row" }, [
    el(
      "button",
      {
        class: `btn ${!showArchived ? "btn-primary" : "btn-secondary"}`,
        onclick: () => {
          showArchived = false;
          tabs.children[0].className = "btn btn-primary";
          tabs.children[1].className = "btn btn-secondary";
          renderList();
        },
      },
      [`进行中 (${active.length})`]
    ),
    el(
      "button",
      {
        class: `btn ${showArchived ? "btn-primary" : "btn-secondary"}`,
        onclick: () => {
          showArchived = true;
          tabs.children[0].className = "btn btn-secondary";
          tabs.children[1].className = "btn btn-primary";
          renderList();
        },
      },
      [`已归档 (${archived.length})`]
    ),
  ]);

  const newBtn = el(
    "button",
    {
      class: "btn btn-primary btn-block",
      style: "margin-top:16px;",
      onclick: async () => {
        const fields = await openRelationshipForm({ title: "新建关系档案" });
        if (!fields) return;
        const rel = await ctx.db.createRelationship(fields);
        showToast("已创建档案");
        ctx.navigate(`#/relationships/${rel.id}`);
      },
    },
    ["+ 新建档案"]
  );

  mountInto(
    main,
    el("div", {}, [
      el("p", { class: "page-subtitle" }, ["每段关系都可以有自己的形状,标签由你自己定义"]),
      tabs,
      listWrap,
      newBtn,
    ])
  );
}
