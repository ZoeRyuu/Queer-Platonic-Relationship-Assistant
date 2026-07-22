import { el, clear, mountInto } from "./components/dom.js";
import * as db from "./db.js";
import { mountHome } from "./pages/home.js";
import { mountExploreList } from "./pages/explore-list.js";
import { mountExploreQuestion } from "./pages/explore-question.js";
import { mountProfile } from "./pages/profile.js";
import { mountWikiList } from "./pages/wiki-list.js";
import { mountWikiDetail } from "./pages/wiki-detail.js";
import { mountSettings } from "./pages/settings.js";
import { mountLock } from "./pages/lock.js";
import { mountRelationshipList } from "./pages/relationship-list.js";
import { mountRelationshipDetail } from "./pages/relationship-detail.js";
import { mountNegotiation } from "./pages/negotiation.js";
import { mountReview } from "./pages/review.js";
import { mountSpectrumEdit } from "./pages/spectrum.js";
import { mountSpectrumSnapshots } from "./pages/spectrum-snapshots.js";

const appRoot = document.getElementById("app");
const header = el("header", { class: "app-header" });
const main = el("main", { class: "view" });
appRoot.appendChild(header);
appRoot.appendChild(main);

const SESSION_UNLOCK_KEY = "qpr_unlocked";

export function navigate(hash) {
  location.hash = hash;
}

function setHeader({ title, showBack }) {
  clear(header);
  if (showBack) {
    header.appendChild(
      el("button", {
        class: "back-btn",
        "aria-label": "返回",
        onclick: () => history.back(),
      }, ["←"])
    );
  }
  header.appendChild(el("h1", {}, [title]));
  if (showBack) {
    header.appendChild(
      el("button", {
        class: "home-btn",
        "aria-label": "回到主页",
        onclick: () => navigate("#/"),
      }, ["🏠"])
    );
  }
}

const ctx = {
  navigate,
  setHeader,
  db,
};

function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/";
  return raw.split("/").filter(Boolean);
}

async function needsLock() {
  const pin = await db.getMeta("pin");
  if (!pin) return false;
  return sessionStorage.getItem(SESSION_UNLOCK_KEY) !== "1";
}

async function router() {
  window.scrollTo(0, 0);

  if (await needsLock()) {
    setHeader({ title: "QPR 助手", showBack: false });
    mountLock(main, ctx, () => {
      sessionStorage.setItem(SESSION_UNLOCK_KEY, "1");
      router();
    });
    return;
  }

  const parts = parseHash();

  if (parts.length === 0) {
    setHeader({ title: "QPR 助手", showBack: false });
    return mountHome(main, ctx);
  }

  if (parts[0] === "explore") {
    if (parts.length === 1) {
      setHeader({ title: "自我探索", showBack: true });
      return mountExploreList(main, ctx);
    }
    const chapterId = parts[1];
    const index = parseInt(parts[2] || "0", 10) || 0;
    setHeader({ title: "自我探索", showBack: true });
    return mountExploreQuestion(main, ctx, { chapterId, index });
  }

  if (parts[0] === "profile") {
    setHeader({ title: "我的关系画像", showBack: true });
    return mountProfile(main, ctx, { snapshotId: parts[1] });
  }

  if (parts[0] === "wiki") {
    if (parts.length === 1) {
      setHeader({ title: "小百科", showBack: true });
      return mountWikiList(main, ctx);
    }
    setHeader({ title: "小百科", showBack: true });
    return mountWikiDetail(main, ctx, { id: parts[1] });
  }

  if (parts[0] === "settings") {
    setHeader({ title: "设置", showBack: true });
    return mountSettings(main, ctx);
  }

  if (parts[0] === "relationships") {
    if (parts.length === 1) {
      setHeader({ title: "关系档案", showBack: true });
      return mountRelationshipList(main, ctx);
    }
    const relId = parts[1];
    if (parts[2] === "negotiate") {
      setHeader({ title: "边界协商", showBack: true });
      return mountNegotiation(main, ctx, { id: relId });
    }
    if (parts[2] === "review") {
      setHeader({ title: "关系回顾", showBack: true });
      return mountReview(main, ctx, { id: relId });
    }
    setHeader({ title: "关系档案", showBack: true });
    return mountRelationshipDetail(main, ctx, { id: relId });
  }

  if (parts[0] === "spectrum") {
    if (parts[1] === "snapshots") {
      setHeader({ title: "光谱快照", showBack: true });
      return mountSpectrumSnapshots(main, ctx);
    }
    setHeader({ title: "我的光谱", showBack: true });
    return mountSpectrumEdit(main, ctx);
  }

  setHeader({ title: "QPR 助手", showBack: false });
  return mountHome(main, ctx);
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {});
router();
checkDueNotifications();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      // offline caching is a progressive enhancement; ignore registration failures
    });
  });
}

const NOTIFIED_TODAY_KEY = "qpr_notified_date";

async function checkDueNotifications() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = new Date().toDateString();
  if (sessionStorage.getItem(NOTIFIED_TODAY_KEY) === today) return;
  const due = await db.listDueRelationships();
  if (due.length === 0) return;
  sessionStorage.setItem(NOTIFIED_TODAY_KEY, today);
  new Notification("QPR 助手", {
    body: due.length === 1 ? `「${due[0].name}」该做一次关系回顾了` : `有 ${due.length} 段关系该做回顾了`,
    icon: "icons/icon-192.png",
  });
}
