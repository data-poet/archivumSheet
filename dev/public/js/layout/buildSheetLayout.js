// index.html holds each panel's markup once, in the hidden #sheet-panels pool. This builds the
// section shells from SHEET_LAYOUT and moves the panels into them with appendChild — a real DOM
// move (as in viewMode.js), so IDs and any listeners survive.
// Must run before initNav(), initGroupNav() and initTabs(), which query the built shells.
import { LABELS } from "../localization/pt-BR/index.js";
import { SHEET_LAYOUT } from "./sheetLayout.js";
import { REFERENCE_LINKS, referenceHref } from "./referenceLinks.js";

const MAIN_ID = "main-content";
const POOL_ID = "sheet-panels";

// A lone tab gets a plain heading instead of a button: there's nothing to switch to.
function _buildTabStripItems(section) {
  if (section.tabs.length === 1) {
    return `<span class="tab-strip-title">${LABELS.nav.sections[section.id]?.label ?? ""}</span>`;
  }
  return section.tabs
    .map((tabId) => {
      const reference = REFERENCE_LINKS[tabId];
      const data = reference ? ` data-reference="${reference}"` : "";
      return `<button class="tab-btn" data-tab="${tabId}"${data}>${LABELS.tabs[tabId] ?? ""}</button>`;
    })
    .join("");
}

// Opens in a new tab on purpose: the reference never writes the character, so it can't race the sheet
// (see components/pageSelector.js), and the player keeps their place. tabs.js retargets it per tab.
function _buildHelpLink(section) {
  const anchors = section.tabs.map((tabId) => REFERENCE_LINKS[tabId]);
  if (!anchors.some(Boolean)) return "";
  const first = anchors[0];
  return `<a class="tab-strip-help" target="_blank" rel="noopener" aria-label="${LABELS.nav.referenceHelp}" title="${LABELS.nav.referenceHelp}"${first ? ` href="${referenceHref(first)}"` : " hidden"}>?</a>`;
}

function _buildTabStrip(section) {
  const strip = document.createElement("nav");
  strip.className = "tab-strip";
  strip.dataset.section = section.id;
  // The collapse button's aria-label is set by initTabs() along with its state.
  strip.innerHTML = `
    ${_buildTabStripItems(section)}
    ${_buildHelpLink(section)}
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
