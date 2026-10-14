// index.html holds each panel's markup once, in the hidden #sheet-panels pool. This builds the
// section shells from SHEET_LAYOUT and moves the panels into them with appendChild — a real DOM
// move (as in viewMode.js), so IDs and any listeners survive.
// Must run before initNav(), initGroupNav() and initTabs(), which query the built shells.
import { LABELS } from "../localization/pt-BR/index.js";
import { SHEET_LAYOUT } from "./sheetLayout.js";

const MAIN_ID = "main-content";
const POOL_ID = "sheet-panels";

// A lone tab gets a plain heading instead of a button: there's nothing to switch to.
function _buildTabStripItems(section) {
  if (section.tabs.length === 1) {
    return `<span class="tab-strip-title">${LABELS.nav.sections[section.id]?.label ?? ""}</span>`;
  }
  return section.tabs
    .map(
      (tabId) =>
        `<button class="tab-btn" data-tab="${tabId}">${LABELS.tabs[tabId] ?? ""}</button>`,
    )
    .join("");
}

function _buildTabStrip(section) {
  const strip = document.createElement("nav");
  strip.className = "tab-strip";
  strip.dataset.section = section.id;
  // The collapse button's aria-label is set by initTabs() along with its state.
  strip.innerHTML = `
    ${_buildTabStripItems(section)}
    <button class="tab-strip-collapse" aria-expanded="false" type="button">&#8250;</button>`;
  return strip;
}

function _appendById(parent, id) {
  const el = document.getElementById(id);
  if (el) parent.appendChild(el);
}

function _buildSection(section) {
  const el = document.createElement("section");
  el.id = section.id;
  el.className = "l-section";
  el.dataset.section = section.id;
  if (section.accent) el.dataset.accent = section.accent;

  if (section.content) {
    _appendById(el, section.content);
    return el;
  }

  const box = document.createElement("div");
  box.className = `box ${section.box}`;
  box.appendChild(_buildTabStrip(section));
  section.tabs.forEach((tabId) => _appendById(box, tabId));
  // initTabs() only activates panels through tab buttons, and a lone tab has none.
  if (section.tabs.length === 1) {
    box.querySelector(".tab-panel")?.classList.add("is-active");
  }
  el.appendChild(box);
  return el;
}

export function buildSheetLayout() {
  const main = document.getElementById(MAIN_ID);
  if (!main) return;

  const pool = document.getElementById(POOL_ID);
  SHEET_LAYOUT.forEach(({ sections }) =>
    sections.forEach((section) =>
      main.insertBefore(_buildSection(section), pool),
    ),
  );

  // Anything left would be a panel missing from SHEET_LAYOUT; keeping it hidden still
  // lets events/index.js find its controls instead of crashing the boot.
  if (pool && pool.children.length === 0) pool.remove();
}
