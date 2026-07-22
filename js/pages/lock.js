import { el, mountInto, clear } from "../components/dom.js";
import { hashPin } from "../components/pin.js";
import { confirmModal, showToast } from "../components/ui.js";

export async function mountLock(main, ctx, onUnlock) {
  const pin = await ctx.db.getMeta("pin");
  let entered = "";

  const dots = el("div", { class: "pin-dots" });
  const pad = el("div", { class: "pin-pad" });

  function renderDots() {
    clear(dots);
    for (let i = 0; i < pin.length; i++) {
      dots.appendChild(el("span", { class: entered.length > i ? "filled" : "" }));
    }
  }

  async function checkComplete() {
    if (entered.length !== pin.length) return;
    const hash = await hashPin(entered);
    if (hash === pin.hash) {
      onUnlock();
    } else {
      showToast("PIN 不正确");
      entered = "";
      renderDots();
    }
  }

  function press(digit) {
    if (entered.length >= pin.length) return;
    entered += digit;
    renderDots();
    checkComplete();
  }

  for (const n of ["1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
    pad.appendChild(el("button", { type: "button", onclick: () => press(n) }, [n]));
  }
  pad.appendChild(
    el(
      "button",
      {
        type: "button",
        onclick: async () => {
          const ok = await confirmModal({
            title: "忘记 PIN 码?",
            body: "本应用不会加密或上传你的数据,无法找回 PIN。若要继续使用,只能清除全部本地数据。",
            confirmLabel: "清除全部数据",
            danger: true,
          });
          if (ok) {
            await ctx.db.clearAll();
            onUnlock();
          }
        },
      },
      ["忘记?"]
    )
  );
  pad.appendChild(el("button", { type: "button", onclick: () => press("0") }, ["0"]));
  pad.appendChild(
    el(
      "button",
      {
        type: "button",
        onclick: () => {
          entered = entered.slice(0, -1);
          renderDots();
        },
      },
      ["⌫"]
    )
  );

  renderDots();

  mountInto(
    main,
    el("div", { class: "center-view" }, [
      el("p", { class: "page-title" }, ["🔒 已锁定"]),
      el("p", { class: "page-subtitle" }, ["输入 PIN 码解锁"]),
      dots,
      pad,
    ])
  );
}
