import { el } from "./dom.js";
import { getWikiEntry } from "../data/wiki.js";

const TRI_LABELS = {
  comfortable: "舒适",
  depends: "视情况",
  uncomfortable: "不适",
};

function relatedTermsRow(question) {
  if (!question.relatedTerms || question.relatedTerms.length === 0) return null;
  const row = el("div", {}, []);
  for (const termId of question.relatedTerms) {
    const entry = getWikiEntry(termId);
    if (!entry) continue;
    row.appendChild(
      el(
        "a",
        { class: "term-link", href: `#/wiki/${termId}` },
        [`${entry.term} ?`]
      )
    );
  }
  return row.childNodes.length ? row : null;
}

function questionHeader(question) {
  const wrap = el("div", {}, []);
  const titleRow = el("div", { style: "display:flex;align-items:baseline;flex-wrap:wrap;gap:4px;" }, [
    el("p", { class: "question-text", style: "margin:0;" }, [question.text]),
    relatedTermsRow(question),
  ]);
  wrap.appendChild(titleRow);
  if (question.hint) {
    wrap.appendChild(el("p", { class: "question-hint" }, [question.hint]));
  }
  return wrap;
}

export function renderQuestion(question, value, onChange) {
  const container = el("div", {});
  container.appendChild(questionHeader(question));

  const body = el("div", {});
  container.appendChild(body);

  switch (question.type) {
    case "multi":
      body.appendChild(renderMulti(question, value, onChange));
      break;
    case "single":
      body.appendChild(renderSingle(question, value, onChange));
      break;
    case "slider":
      body.appendChild(renderSlider(question, value, onChange));
      break;
    case "touch":
      body.appendChild(renderTouch(question, value, onChange));
      break;
    case "willingness":
      body.appendChild(renderWillingness(question, value, onChange));
      break;
    case "text":
      body.appendChild(renderText(question, value, onChange));
      break;
    case "text-pair":
      body.appendChild(renderTextPair(question, value, onChange));
      break;
    default:
      body.appendChild(el("p", {}, [`未知题型: ${question.type}`]));
  }

  return container;
}

function renderMulti(question, value, onChange) {
  const current = value || { values: [], other: "" };
  const list = el("div", { class: "option-list" });

  const commit = (next) => {
    Object.assign(current, next);
    onChange({ ...current });
  };

  for (const opt of question.options) {
    const checked = current.values.includes(opt.value);
    const id = `${question.id}_${opt.value}`;
    const item = el(
      "label",
      { class: `option-item${checked ? " checked" : ""}` },
      [
        el("input", {
          type: "checkbox",
          id,
          checked,
          autocomplete: "off",
          onchange: (e) => {
            const values = new Set(current.values);
            if (e.target.checked) values.add(opt.value);
            else values.delete(opt.value);
            commit({ values: Array.from(values) });
            item.classList.toggle("checked", e.target.checked);
          },
        }),
        el("span", { class: "txt" }, [opt.label]),
      ]
    );
    list.appendChild(item);
  }

  const wrap = el("div", {}, [list]);

  if (question.allowOther) {
    wrap.appendChild(
      el("textarea", {
        class: "text-input",
        style: "margin-top:10px;min-height:60px;",
        placeholder: "还有其他想补充的吗?",
        value: current.other || "",
        oninput: (e) => commit({ other: e.target.value }),
      })
    );
  }

  return wrap;
}

function renderSingle(question, value, onChange) {
  const current = value || { value: "", otherText: "" };
  const list = el("div", { class: "option-list" });

  const options = question.allowOther
    ? [...question.options, { value: "other", label: "其他" }]
    : question.options;

  const commit = (next) => {
    Object.assign(current, next);
    onChange({ ...current });
  };

  for (const opt of options) {
    const checked = current.value === opt.value;
    const id = `${question.id}_${opt.value}`;
    const item = el(
      "label",
      { class: `option-item${checked ? " checked" : ""}` },
      [
        el("input", {
          type: "radio",
          name: question.id,
          id,
          checked,
          autocomplete: "off",
          onchange: () => {
            commit({ value: opt.value });
            for (const sib of list.querySelectorAll(".option-item")) {
              sib.classList.remove("checked");
            }
            item.classList.add("checked");
          },
        }),
        el("span", { class: "txt" }, [opt.label]),
      ]
    );
    list.appendChild(item);
  }

  const wrap = el("div", {}, [list]);

  if (question.allowOther) {
    wrap.appendChild(
      el("textarea", {
        class: "text-input",
        style: "margin-top:10px;min-height:60px;",
        placeholder: "请补充说明",
        value: current.otherText || "",
        oninput: (e) => commit({ otherText: e.target.value }),
      })
    );
  }

  return wrap;
}

function renderSlider(question, value, onChange) {
  const current = value || { value: Math.round((question.min + question.max) / 2), note: "" };
  const wrap = el("div", { class: "slider-wrap" });

  const valueLabel = el("div", { class: "slider-value" }, [String(current.value)]);

  const slider = el("input", {
    type: "range",
    min: question.min,
    max: question.max,
    step: question.step || 1,
    value: current.value,
    oninput: (e) => {
      const v = Number(e.target.value);
      valueLabel.textContent = String(v);
      current.value = v;
      onChange({ ...current });
    },
  });

  wrap.appendChild(slider);
  wrap.appendChild(
    el("div", { class: "slider-labels" }, [
      el("span", {}, [question.labels[0]]),
      el("span", {}, [question.labels[1]]),
    ])
  );
  wrap.appendChild(valueLabel);

  if (question.withNote) {
    wrap.appendChild(
      el("textarea", {
        class: "text-input",
        style: "margin-top:14px;",
        placeholder: question.notePlaceholder || "补充说明(可选)",
        value: current.note || "",
        oninput: (e) => {
          current.note = e.target.value;
          onChange({ ...current });
        },
      })
    );
  }

  return wrap;
}

function renderTouch(question, value, onChange) {
  const current = value || { states: {}, note: "" };
  const wrap = el("div", {});

  for (const item of question.items) {
    const row = el("div", { class: "touch-item" }, [
      el("div", { class: "label" }, [item.label]),
    ]);
    const buttonsRow = el("div", { class: "tri-state" });
    for (const stateKey of ["comfortable", "depends", "uncomfortable"]) {
      const isActive = current.states[item.value] === stateKey;
      const btn = el(
        "button",
        {
          type: "button",
          "data-v": stateKey,
          class: isActive ? "active" : "",
          onclick: () => {
            current.states = { ...current.states, [item.value]: stateKey };
            onChange({ ...current });
            for (const sib of buttonsRow.children) sib.classList.remove("active");
            btn.classList.add("active");
          },
        },
        [TRI_LABELS[stateKey]]
      );
      buttonsRow.appendChild(btn);
    }
    row.appendChild(buttonsRow);
    wrap.appendChild(row);
  }

  if (question.allowNote) {
    wrap.appendChild(
      el("textarea", {
        class: "text-input",
        style: "margin-top:4px;",
        placeholder: question.notePlaceholder || "补充说明(可选)",
        value: current.note || "",
        oninput: (e) => {
          current.note = e.target.value;
          onChange({ ...current });
        },
      })
    );
  }

  return wrap;
}

function renderWillingness(question, value, onChange) {
  const current = value || { states: {} };
  const wrap = el("div", {});

  for (const item of question.items) {
    const row = el("div", { class: "touch-item" }, [
      el("div", { class: "label" }, [item.label]),
    ]);
    const buttonsRow = el("div", { class: "multi-state" });
    for (const state of question.states) {
      const isActive = current.states[item.value] === state.value;
      const btn = el(
        "button",
        {
          type: "button",
          "data-v": state.value,
          class: isActive ? "active" : "",
          onclick: () => {
            current.states = { ...current.states, [item.value]: state.value };
            onChange({ ...current });
            for (const sib of buttonsRow.children) sib.classList.remove("active");
            btn.classList.add("active");
          },
        },
        [state.label]
      );
      buttonsRow.appendChild(btn);
    }
    row.appendChild(buttonsRow);
    wrap.appendChild(row);
  }

  return wrap;
}

function renderText(question, value, onChange) {
  return el("textarea", {
    class: "text-input",
    placeholder: question.placeholder || "",
    value: value || "",
    oninput: (e) => onChange(e.target.value),
  });
}

function renderTextPair(question, value, onChange) {
  const current = value || {};
  const wrap = el("div", {});
  for (const field of question.fields) {
    wrap.appendChild(
      el("div", { style: "margin-bottom:14px;" }, [
        el("div", { style: "font-weight:500;margin-bottom:6px;" }, [field.label]),
        el("textarea", {
          class: "text-input",
          style: "min-height:80px;",
          placeholder: field.placeholder || "",
          value: current[field.key] || "",
          oninput: (e) => {
            current[field.key] = e.target.value;
            onChange({ ...current });
          },
        }),
      ])
    );
  }
  return wrap;
}
