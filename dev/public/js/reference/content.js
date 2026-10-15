// Reference sections are DOM-generated from REFERENCE_LAYOUT, reusing the sheet's section/tab markup
// so components/tabs.js, nav.js, groupNav.js and the [data-accent] styling apply unchanged.
import { LABELS } from "../localization/pt-BR/index.js";
import { REFERENCE_SECTIONS } from "./referenceLayout.js";

const MAIN_ID = "reference-main";

// A lone tab gets a plain heading instead of a button: there's nothing to switch to.
function _buildTabStripItems(section) {
  if (section.tabs.length === 1) {
    return `<span class="tab-strip-title">${LABELS.reference.nav.sections[section.id]?.label ?? ""}</span>`;
  }
  return section.tabs
    .map(
      ({ id }) =>
        `<button class="tab-btn" data-tab="${id}">${LABELS.reference.tabs[id] ?? ""}</button>`,
    )
    .join("");
}

function _buildSectionHTML(section) {
  const isLone = section.tabs.length === 1;
  const tabPanels = section.tabs
    .map(
      ({ id, file }) => `
      <div class="tab-panel${isLone ? " is-active" : ""}" id="${id}" data-file="${file}">
        <p class="reference-loading">…</p>
      </div>`,
    )
    .join("");

  // The collapse button's aria-label is set by initTabs() along with its state.
  return `
    <section id="${section.id}" class="l-section" data-section="${section.id}" data-accent="${section.accent}">
      <div class="box box--reference">
        <nav class="tab-strip" data-section="${section.id}">
          ${_buildTabStripItems(section)}
          <button class="tab-strip-collapse" aria-expanded="false" type="button">&#8250;</button>
        </nav>
        ${tabPanels}
      </div>
    </section>`;
}

// Call once, before initNav() / initGroupNav() / initTabs().
export function buildReferenceSections() {
  const main = document.getElementById(MAIN_ID);
  if (!main) return;

  main.innerHTML = REFERENCE_SECTIONS.map(_buildSectionHTML).join("");
}

// Panels are small consultation texts, so all subsections load eagerly rather than per tab click.
export async function loadReferenceContent() {
  const panels = Array.from(document.querySelectorAll(".tab-panel[data-file]"));

  await Promise.all(
    panels.map(async (panel) => {
      const file = panel.dataset.file;
      try {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const markdown = await res.text();
        const html = window.marked.parse(markdown);
        panel.innerHTML = `<div class="reference-prose">${html}</div>`;
        _wrapTables(panel);
        _renderMath(panel);
      } catch (err) {
        console.error(`Failed to load reference content: ${file}`, err);
        panel.innerHTML = `<p class="reference-error">${LABELS.reference.loadError}</p>`;
      }
    }),
  );
}

// Tables keep their natural width and scroll sideways on narrow screens instead of crushing columns.
function _wrapTables(panel) {
  panel.querySelectorAll(".reference-prose table").forEach((table) => {
    const wrapper = document.createElement("div");
    wrapper.className = "reference-table-scroll";
    table.replaceWith(wrapper);
    wrapper.appendChild(table);
  });
}

// KaTeX loads from CDN in reference.html before this module script runs, but guard
// renderMathInElement anyway in case that CDN script fails to load.
function _renderMath(panel) {
  if (typeof window.renderMathInElement !== "function") return;

  window.renderMathInElement(panel, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
    ],
    throwOnError: false,
  });
}
