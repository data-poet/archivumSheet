// Reference sections are DOM-generated (unlike the main sheet's hand-written index.html)
// since they're uniform (title, tabs, prose), making a new section config-only. Reuses the
// main sheet's section classes so styling and the [data-section] accent mechanism apply free.
import { LABELS } from "../localization/pt-BR/index.js";

const MAIN_ID = "reference-main";

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

// Call once, before initReferenceNav() / initReferenceTabs().
export function buildReferenceSections() {
  const main = document.getElementById(MAIN_ID);
  if (!main) return;

  main.innerHTML = LABELS.reference.sections
    .map((section) => _buildSectionHTML(section))
    .join("");
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
        _renderMath(panel);
      } catch (err) {
        console.error(`Failed to load reference content: ${file}`, err);
        panel.innerHTML = `<p class="reference-error">${LABELS.reference.loadError}</p>`;
      }
    }),
  );
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
