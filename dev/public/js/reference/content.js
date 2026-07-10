/**
 * reference/content.js
 *
 * Builds the reference page's <section>/tab-strip/tab-panel DOM from
 * LABELS.reference.sections, then fetches + renders each subsection's
 * markdown file into its tab-panel.
 *
 * This is generated (unlike the main sheet, where every section's HTML is
 * hand-written in index.html) because reference sections are uniform:
 * just a title, tabs, and prose. Adding a new reference section is then
 * config-only (see the comment in localization/pt-BR.js) — no HTML edits.
 *
 * Reuses the exact classes the main sheet uses for its own sections
 * (.l-section, .box, .tab-strip, .tab-btn, .tab-panel) so styling and the
 * [data-section] accent-color mechanism in style.css apply for free.
 */

import { LABELS } from "../localization/pt-BR.js";

const MAIN_ID = "reference-main";

// ─────────────────────────────────────────────────────────────────────────────
// DOM building
// ─────────────────────────────────────────────────────────────────────────────

function _buildSectionHTML(section) {
  const tabButtons = section.tabs
    .map(
      (tab) => `
      <button class="tab-btn" data-tab="${tab.key}" id="tab-btn-${tab.key}">
        ${tab.label}
      </button>`,
    )
    .join("");

  const tabPanels = section.tabs
    .map(
      (tab) => `
      <div class="tab-panel" id="${tab.key}" data-file="${tab.file}">
        <p class="reference-loading">…</p>
      </div>`,
    )
    .join("");

  return `
    <section id="${section.key}" class="l-section" data-section="${section.key}">
      <div class="box box--reference">
        <nav class="tab-strip" data-section="${section.key}">
          ${tabButtons}
          <button
            class="tab-strip-collapse"
            aria-expanded="true"
            aria-label="Recolher seção"
            type="button"
          >
            &#8250;
          </button>
        </nav>
        ${tabPanels}
      </div>
    </section>`;
}

/**
 * Builds every configured section into #reference-main.
 * Call once, before initReferenceNav() / initReferenceTabs().
 */
export function buildReferenceSections() {
  const main = document.getElementById(MAIN_ID);
  if (!main) return;

  main.innerHTML = LABELS.reference.sections
    .map((section) => _buildSectionHTML(section))
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// Content loading
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches every tab-panel's markdown file and renders it inline.
 * Panels are small consultation texts, so all subsections load eagerly —
 * no need for lazy-loading per tab click.
 */
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
        _renderMath(panel);
      } catch (err) {
        console.error(`Failed to load reference content: ${file}`, err);
        panel.innerHTML = `<p class="reference-error">${LABELS.reference.loadError}</p>`;
      }
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Math rendering (KaTeX)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders LaTeX math formulas inside a freshly-rendered panel.
 *
 * Runs after marked has already turned the markdown into HTML, so this
 * walks the resulting DOM (via KaTeX's auto-render extension) looking for
 * delimited math and replacing it in place. Supports both inline math
 * ($...$ or \(...\)) and display/block math ($$...$$ or \[...\]).
 *
 * KaTeX is loaded from CDN in reference.html (deferred, before this module
 * script), so window.renderMathInElement should already be defined by the
 * time this runs. Guarded regardless, in case the CDN script fails to load.
 */
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
