// marked setup for reference content: GFM-style callouts (marked-alert, CDN) and [[glossary]] terms.
// Conventions for authors live in reference-content/README.md.
import { LABELS } from "../localization/pt-BR/index.js";

const ALERT_ICONS = {
  note: "ℹ️",
  tip: "💡",
  important: "❗",
  warning: "⚠️",
  caution: "🛑",
  house: "🏠",
};

// Variants replace marked-alert's defaults by type, which also swaps its English titles.
function _alertVariants() {
  return Object.entries(ALERT_ICONS).map(([type, icon]) => ({
    type,
    icon: `<span class="markdown-alert-icon" aria-hidden="true">${icon}</span>`,
    title: LABELS.reference.alerts[type],
  }));
}

const TERM_PATTERN = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;

export function glossaryPopoverId(key) {
  const slug = key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .toLowerCase();
  return `glossary-${slug}`;
}

// Unknown keys render as plain text, so a typo degrades gracefully; the guard test catches it.
export const glossaryExtension = {
  name: "glossary",
  level: "inline",
  start(src) {
    const index = src.indexOf("[[");
    return index === -1 ? undefined : index;
  },
  tokenizer(src) {
    const match = TERM_PATTERN.exec(src);
    if (!match) return undefined;
    const key = match[1].trim();
    return {
      type: "glossary",
      raw: match[0],
      key,
      text: (match[2] ?? key).trim(),
    };
  },
  renderer({ key, text }) {
    if (!LABELS.glossary[key]) return text;
    return `<button type="button" class="glossary-term" popovertarget="${glossaryPopoverId(key)}">${text}</button>`;
  },
};

export function configureMarked(marked = window.marked) {
  if (!marked) return;
  if (typeof window.markedAlert === "function") {
    marked.use(window.markedAlert({ variants: _alertVariants() }));
  }
  marked.use({ extensions: [glossaryExtension] });
}

// One popover per term, shared by every [[term]] on the page.
export function mountGlossaryPopovers(root = document.body) {
  Object.entries(LABELS.glossary).forEach(([key, { term, definition }]) => {
    const id = glossaryPopoverId(key);
    if (document.getElementById(id)) return;

    const popover = document.createElement("div");
    popover.id = id;
    popover.className = "glossary-popover";
    popover.setAttribute("popover", "");
    const heading = key === term ? term : `${key} — ${term}`;
    popover.innerHTML = `<p class="glossary-popover-term">${heading}</p><p>${definition}</p>`;
    root.appendChild(popover);
  });
}
