import { el, mountInto, clear } from "../components/dom.js";
import { openModal, confirmModal, showToast } from "../components/ui.js";
import { hashPin } from "../components/pin.js";

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function exportDataAction(ctx) {
  return async () => {
    const data = await ctx.db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qpr-assistant-备份-${formatDate(Date.now())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast("已导出备份文件");
  };
}

function importDataAction(ctx, rerender) {
  return () => {
    const input = el("input", { type: "file", accept: "application/json", style: "display:none" });
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      const ok = await confirmModal({
        title: "导入数据?",
        body: "导入会覆盖当前本机已有的全部数据(问卷答案、快照、设置)。建议先导出一份备份。",
        confirmLabel: "覆盖导入",
        danger: true,
      });
      if (!ok) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await ctx.db.importAll(data);
        showToast("导入成功");
        rerender();
      } catch (err) {
        await confirmModal({
          title: "导入失败",
          body: err.message || "文件内容无法解析,请确认这是本应用导出的备份文件。",
          confirmLabel: "知道了",
          cancelLabel: "关闭",
        });
      }
    });
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 5000);
  };
}

function clearAllAction(ctx) {
  return async () => {
    const ok = await confirmModal({
      title: "清除全部数据?",
      body: "这将永久删除本机保存的所有问卷答案、画像快照与设置,且无法恢复。建议先导出备份。",
      confirmLabel: "永久清除",
      danger: true,
    });
    if (!ok) return;
    const ok2 = await confirmModal({
      title: "再次确认",
      body: "真的要清除全部数据吗?这个操作不能撤销。",
      confirmLabel: "确定清除",
      danger: true,
    });
    if (!ok2) return;
    await ctx.db.clearAll();
    showToast("已清除全部数据");
    ctx.navigate("#/");
  };
}

async function setupPinFlow(ctx, rerender) {
  const step1Input = el("input", {
    type: "tel",
    inputmode: "numeric",
    maxlength: "6",
    class: "text-input",
    style: "min-height:auto;text-align:center;letter-spacing:6px;font-size:1.3rem;",
    placeholder: "输入 4-6 位数字",
  });

  openModal({
    title: "设置 PIN 码",
    body: step1Input,
    actions: [
      { label: "取消", className: "btn-secondary" },
      {
        label: "下一步",
        className: "btn-primary",
        onClick: () => {
          const pin = step1Input.value.trim();
          if (!/^\d{4,6}$/.test(pin)) {
            showToast("PIN 码需为 4-6 位数字");
            return;
          }
          confirmPinFlow(ctx, pin, rerender);
        },
      },
    ],
  });
}

function confirmPinFlow(ctx, pin, rerender) {
  const step2Input = el("input", {
    type: "tel",
    inputmode: "numeric",
    maxlength: "6",
    class: "text-input",
    style: "min-height:auto;text-align:center;letter-spacing:6px;font-size:1.3rem;",
    placeholder: "再次输入以确认",
  });

  openModal({
    title: "确认 PIN 码",
    body: step2Input,
    actions: [
      { label: "取消", className: "btn-secondary" },
      {
        label: "确认设置",
        className: "btn-primary",
        onClick: async () => {
          if (step2Input.value.trim() !== pin) {
            showToast("两次输入不一致,请重新设置");
            return;
          }
          const hash = await hashPin(pin);
          await ctx.db.setMeta("pin", { hash, length: pin.length });
          showToast("PIN 码已开启");
          rerender();
        },
      },
    ],
  });
}

async function disablePinFlow(ctx, rerender) {
  const currentPin = await ctx.db.getMeta("pin");
  const input = el("input", {
    type: "tel",
    inputmode: "numeric",
    maxlength: "6",
    class: "text-input",
    style: "min-height:auto;text-align:center;letter-spacing:6px;font-size:1.3rem;",
    placeholder: "输入当前 PIN 码以关闭",
  });
  openModal({
    title: "关闭 PIN 码",
    body: input,
    actions: [
      { label: "取消", className: "btn-secondary" },
      {
        label: "关闭",
        className: "btn-danger",
        onClick: async () => {
          const hash = await hashPin(input.value.trim());
          if (hash !== currentPin.hash) {
            showToast("PIN 不正确");
            return;
          }
          await ctx.db.deleteMeta("pin");
          showToast("已关闭 PIN 码");
          rerender();
        },
      },
    ],
  });
}

export async function mountSettings(main, ctx) {
  async function rerender() {
    mountSettings(main, ctx);
  }

  const pin = await ctx.db.getMeta("pin");

  const dataGroup = el("div", { class: "settings-group" }, [
    el("h3", {}, ["数据管理"]),
    el("div", { class: "settings-item" }, [
      el("div", { class: "row" }, [
        el("strong", {}, ["导出全部数据"]),
        el("button", { class: "btn btn-secondary", onclick: exportDataAction(ctx) }, ["导出 JSON"]),
      ]),
      el("p", { class: "desc" }, ["生成备份文件,方便更换设备或手动保存"]),
    ]),
    el("div", { class: "settings-item" }, [
      el("div", { class: "row" }, [
        el("strong", {}, ["从备份导入"]),
        el("button", { class: "btn btn-secondary", onclick: importDataAction(ctx, rerender) }, ["选择文件"]),
      ]),
      el("p", { class: "desc" }, ["导入会覆盖当前本机的全部数据"]),
    ]),
    el("div", { class: "settings-item" }, [
      el("div", { class: "row" }, [
        el("strong", {}, ["清除全部数据"]),
        el("button", { class: "btn btn-danger", onclick: clearAllAction(ctx) }, ["清除"]),
      ]),
      el("p", { class: "desc" }, ["需二次确认,清除后无法恢复"]),
    ]),
  ]);

  const lockGroup = el("div", { class: "settings-group" }, [
    el("h3", {}, ["应用锁"]),
    el("div", { class: "settings-item" }, [
      el("div", { class: "row" }, [
        el("strong", {}, [pin ? "PIN 码已开启" : "未开启 PIN 码"]),
        pin
          ? el("button", { class: "btn btn-secondary", onclick: () => disablePinFlow(ctx, rerender) }, ["关闭"])
          : el("button", { class: "btn btn-primary", onclick: () => setupPinFlow(ctx, rerender) }, ["设置 PIN"]),
      ]),
      el("p", { class: "desc" }, [
        "PIN 码只是打开应用时的轻量遮挡,并不会加密你的数据。请勿依赖它防止能直接访问此设备存储的人查看数据。",
      ]),
    ]),
  ]);

  const notifySupported = "Notification" in window;
  const notifyPermission = notifySupported ? Notification.permission : "unsupported";
  const reminderGroup = el("div", { class: "settings-group" }, [
    el("h3", {}, ["回顾提醒通知"]),
    el("div", { class: "settings-item" }, [
      el("div", { class: "row" }, [
        el("strong", {}, [
          !notifySupported
            ? "此浏览器不支持通知"
            : notifyPermission === "granted"
              ? "通知已开启"
              : notifyPermission === "denied"
                ? "通知已被拒绝"
                : "未开启通知",
        ]),
        notifySupported && notifyPermission === "default"
          ? el(
              "button",
              {
                class: "btn btn-primary",
                onclick: async () => {
                  const result = await Notification.requestPermission();
                  showToast(result === "granted" ? "通知已开启" : "未获得通知权限");
                  rerender();
                },
              },
              ["开启通知"]
            )
          : null,
      ]),
      el("p", { class: "desc" }, [
        "开启后,当有关系档案到了自定的回顾周期,打开本应用时会尝试发送一条本地通知提醒你。这不依赖任何服务器,也不会在应用未打开时唤起提醒。",
      ]),
    ]),
  ]);

  const aboutGroup = el("div", { class: "settings-group" }, [
    el("h3", {}, ["关于本应用"]),
    el("div", { class: "settings-item" }, [
      el("p", {}, [
        "QPR 助手是一个纯本地运行的自我探索与关系管理工具。你的问卷答案、关系档案、画像快照与设置只保存在这台设备的浏览器存储中,不会上传到任何服务器,没有账号系统,也没有任何数据统计或追踪。",
      ]),
      el("p", {}, ["清除浏览器数据、卸载浏览器或更换设备都可能导致数据丢失,建议定期导出备份。"]),
    ]),
  ]);

  mountInto(main, el("div", {}, [dataGroup, lockGroup, reminderGroup, aboutGroup]));
}
