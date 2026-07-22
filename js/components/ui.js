import { el } from "./dom.js";

let toastTimer = null;

export function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = el("div", { class: "toast" }, [message]);
  document.body.appendChild(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 2400);
}

export function openModal({ title, body, actions }) {
  const backdrop = el("div", { class: "modal-backdrop" });
  const modal = el("div", { class: "modal" });
  modal.appendChild(el("h3", {}, [title]));
  if (body) {
    if (typeof body === "string") {
      modal.appendChild(el("p", {}, [body]));
    } else {
      modal.appendChild(body);
    }
  }
  const actionsRow = el("div", { class: "actions" });
  for (const action of actions) {
    const btn = el(
      "button",
      {
        class: `btn ${action.className || "btn-secondary"} btn-block`,
        onclick: () => {
          backdrop.remove();
          if (action.onClick) action.onClick();
        },
      },
      [action.label]
    );
    actionsRow.appendChild(btn);
  }
  modal.appendChild(actionsRow);
  backdrop.appendChild(modal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  document.body.appendChild(backdrop);
  return backdrop;
}

export function promptText({ title, hint, placeholder = "", initial = "", submitLabel = "保存" }) {
  return new Promise((resolve) => {
    const textarea = el("textarea", {
      class: "text-input",
      placeholder,
      value: initial,
    });
    const body = el("div", {}, [
      hint ? el("p", { class: "question-hint", style: "margin-top:0;" }, [hint]) : null,
      textarea,
    ]);
    openModal({
      title,
      body,
      actions: [
        { label: "取消", className: "btn-secondary", onClick: () => resolve(null) },
        {
          label: submitLabel,
          className: "btn-primary",
          onClick: () => {
            const value = textarea.value.trim();
            resolve(value || null);
          },
        },
      ],
    });
  });
}

export function confirmModal({ title, body, confirmLabel = "确认", cancelLabel = "取消", danger = false }) {
  return new Promise((resolve) => {
    openModal({
      title,
      body,
      actions: [
        {
          label: cancelLabel,
          className: "btn-secondary",
          onClick: () => resolve(false),
        },
        {
          label: confirmLabel,
          className: danger ? "btn-danger" : "btn-primary",
          onClick: () => resolve(true),
        },
      ],
    });
  });
}
