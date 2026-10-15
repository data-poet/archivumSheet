import {
  normalizeTerm,
  collectDocuments,
  createIndex,
  initSearch,
} from "dev/public/js/reference/search.js";
import { REFERENCE_LAYOUT } from "dev/public/js/reference/referenceLayout.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

// Stand-in for the CDN MiniSearch: substring match over title and text, same API surface.
class FakeMiniSearch {
  constructor(options) {
    this.options = options;
    this.docs = [];
  }
  addAll(docs) {
    this.docs.push(...docs);
  }
  search(query) {
    const q = normalizeTerm(query);
    return this.docs.filter((d) =>
      normalizeTerm(`${d.title} ${d.text}`).includes(q),
    );
  }
}

const { group, sections } = REFERENCE_LAYOUT.find(({ sections }) =>
  sections.some((s) => s.tabs.length > 1),
);
const section = sections.find((s) => s.tabs.length > 1);
const tab = section.tabs[0];

function referenceDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<button id="reference-search-btn"></button><div id="reference-search" hidden></div>
    <section id="${section.id}" class="l-section"><div class="tab-panel" id="${tab.id}" data-file="x.md">
      <div class="reference-prose">
        <h3 id="${tab.id}--secao">Seção</h3>
        <div class="reference-list">
          <details id="${tab.id}--esquiva"><summary><span class="summary-title">Esquiva</span><span class="summary-badge">+4</span></summary><p>Defesa ativa contra ataques.</p></details>
        </div>
        <details class="reference-example"><summary>Exemplo</summary><p>ignorado</p></details>
      </div></div></section>`,
  );
}

beforeEach(() => {
  resetDOM();
  window.MiniSearch = FakeMiniSearch;
});

afterEach(() => delete window.MiniSearch);

describe("normalizeTerm", () => {
  test("drops accents and case", () => {
    expect(normalizeTerm("Ação Esquiva")).toBe("acao esquiva");
  });
});

describe("collectDocuments", () => {
  test("indexes tabs, headings and items (not examples) with a group › section › tab path", () => {
    referenceDOM();
    const docs = collectDocuments();

    const path = [
      LABELS.reference.nav.groups[group].label,
      LABELS.reference.nav.sections[section.id].label,
      LABELS.reference.tabs[tab.id],
    ].join(" › ");
    expect(docs).toEqual([
      { id: tab.id, title: LABELS.reference.tabs[tab.id], text: "", path },
      { id: `${tab.id}--secao`, title: "Seção", text: "", path },
      {
        id: `${tab.id}--esquiva`,
        title: "Esquiva",
        text: "Defesa ativa contra ataques.",
        path,
      },
    ]);
  });
});

describe("createIndex", () => {
  test("configures accent-insensitive prefix and fuzzy search boosted on titles", () => {
    const index = createIndex([], FakeMiniSearch);
    expect(index.options.processTerm("Ação")).toBe("acao");
    expect(index.options.searchOptions).toMatchObject({
      prefix: true,
      boost: { title: 3 },
    });
  });

  test("returns null when the CDN script is missing", () => {
    delete window.MiniSearch;
    expect(createIndex([])).toBeNull();
  });
});

describe("initSearch", () => {
  test("opens from the button, lists matches and navigates to the chosen one", () => {
    referenceDOM();
    initSearch();
    const panel = document.getElementById("reference-search");
    const input = panel.querySelector("input");

    document.getElementById("reference-search-btn").click();
    expect(panel.hidden).toBe(false);

    input.value = "esquiva";
    input.dispatchEvent(new Event("input"));
    const results = panel.querySelectorAll(".reference-search-result");
    expect(results).toHaveLength(1);
    expect(results[0].textContent).toContain("Esquiva");

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(window.location.hash).toBe(`#${tab.id}--esquiva`);
    expect(panel.hidden).toBe(true);
    window.location.hash = "";
  });

  test("shows the empty message when nothing matches, and '/' opens the panel", () => {
    referenceDOM();
    initSearch();
    const panel = document.getElementById("reference-search");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
    expect(panel.hidden).toBe(false);

    const input = panel.querySelector("input");
    input.value = "zzz";
    input.dispatchEvent(new Event("input"));
    expect(panel.querySelector(".reference-search-empty").textContent).toBe(
      LABELS.reference.search.empty,
    );
  });
});
