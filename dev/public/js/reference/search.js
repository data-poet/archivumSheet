// Full-text search over the loaded reference (MiniSearch, CDN). Every item, heading and tab with an
// anchor id is a document; picking a result sets the hash, and deepLink.js reveals it.
import { LABELS } from "../localization/pt-BR/index.js";
import { REFERENCE_LAYOUT } from "./referenceLayout.js";
import { revealAnchor } from "./deepLink.js";

const BUTTON_ID = "reference-search-btn";
const PANEL_ID = "reference-search";
const MAX_RESULTS = 12;

// Accent- and case-insensitive, so "esquiva" finds "Esquiva" and "acao" finds "Ação".
export function normalizeTerm(term) {
  return term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function _pathOf(sectionId, tabId) {
  const L = LABELS.reference;
  for (const { group, sections } of REFERENCE_LAYOUT) {
    const section = sections.find(({ id }) => id === sectionId);
    if (!section) continue;
    const parts = [
      L.nav.groups[group]?.label,
      L.nav.sections[section.id]?.label,
    ];
    if (section.tabs.length > 1) parts.push(L.tabs[tabId]);
    return parts.filter(Boolean).join(" › ");
  }
  return "";
}

function _textWithoutSummary(details) {
  const clone = details.cloneNode(true);
  clone.querySelector(":scope > summary")?.remove();
  return clone.textContent.replace(/\s+/g, " ").trim();
}

export function collectDocuments(root = document) {
  const docs = [];
  root.querySelectorAll(".tab-panel[data-file]").forEach((panel) => {
    const sectionId = panel.closest(".l-section")?.id;
    const path = _pathOf(sectionId, panel.id);
    docs.push({
      id: panel.id,
      title: LABELS.reference.tabs[panel.id] ?? "",
      text: "",
      path,
    });
    panel.querySelectorAll(".reference-prose h3[id]").forEach((h3) => {
      docs.push({ id: h3.id, title: h3.textContent.trim(), text: "", path });
    });
    panel
      .querySelectorAll(".reference-prose details[id]:not(.reference-example)")
      .forEach((details) => {
        const summary = details.querySelector(":scope > summary");
        const title = (
          summary?.querySelector(".summary-title") ?? summary
        )?.textContent.trim();
        docs.push({
          id: details.id,
          title: title ?? "",
          text: _textWithoutSummary(details),
          path,
        });
      });
  });
  return docs;
}

export function createIndex(docs, MiniSearch = window.MiniSearch) {
  if (typeof MiniSearch !== "function") return null;
  const index = new MiniSearch({
    fields: ["title", "text", "path"],
    storeFields: ["title", "path"],
    processTerm: normalizeTerm,
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 3, path: 1.5 },
      processTerm: normalizeTerm,
    },
  });
  index.addAll(docs);
  return index;
}

function _escape(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function initSearch() {
  const button = document.getElementById(BUTTON_ID);
  const panel = document.getElementById(PANEL_ID);
  if (!button || !panel) return;

  const L = LABELS.reference.search;
  button.setAttribute("aria-label", L.open);
  panel.innerHTML = `
    <input type="search" class="reference-search-input" placeholder="${L.placeholder}" aria-label="${L.open}" autocomplete="off" />
    <ul class="reference-search-results" role="listbox" aria-label="${L.resultsLabel}"></ul>`;

  const input = panel.querySelector("input");
  const list = panel.querySelector("ul");
  let index = null;
  let results = [];
  let selected = 0;

  const render = () => {
    if (!input.value.trim()) {
      list.innerHTML = "";
      return;
    }
    if (results.length === 0) {
      list.innerHTML = `<li class="reference-search-empty">${L.empty}</li>`;
      return;
    }
    list.innerHTML = results
      .map(
        (r, i) => `
        <li role="option" aria-selected="${i === selected}" data-id="${r.id}" class="reference-search-result${i === selected ? " is-selected" : ""}">
          <span class="reference-search-title">${_escape(r.title)}</span>
          <span class="reference-search-path">${_escape(r.path)}</span>
        </li>`,
      )
      .join("");
  };

  const close = () => {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  };

  const open = () => {
    index ??= createIndex(collectDocuments());
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    input.focus();
    input.select();
  };

  const go = (id) => {
    if (!id) return;
    close();
    if (window.location.hash === `#${id}`) revealAnchor(id);
    else window.location.hash = id;
  };

  close();
  button.addEventListener("click", () => (panel.hidden ? open() : close()));

  input.addEventListener("input", () => {
    results = index ? index.search(input.value).slice(0, MAX_RESULTS) : [];
    selected = 0;
    render();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      selected = (selected + step + results.length) % results.length;
      render();
    } else if (e.key === "Enter") {
      go(results[selected]?.id);
    } else if (e.key === "Escape") {
      close();
      button.focus();
    }
  });

  list.addEventListener("click", (e) => {
    go(e.target.closest("[data-id]")?.dataset.id);
  });

  document.addEventListener("keydown", (e) => {
    const typing = e.target.closest?.(
      "input, textarea, select, [contenteditable]",
    );
    if (e.key === "/" && !typing && panel.hidden) {
      e.preventDefault();
      open();
    }
  });

  document.addEventListener("click", (e) => {
    if (panel.hidden) return;
    if (!panel.contains(e.target) && !button.contains(e.target)) close();
  });
}
