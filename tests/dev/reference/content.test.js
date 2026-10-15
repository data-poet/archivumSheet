import {
  buildReferenceSections,
  loadReferenceContent,
} from "dev/public/js/reference/content.js";
import { REFERENCE_SECTIONS } from "dev/public/js/reference/referenceLayout.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const multiTab = REFERENCE_SECTIONS.find((s) => s.tabs.length > 1);
const loneTab = REFERENCE_SECTIONS.find((s) => s.tabs.length === 1);

beforeEach(() => {
  resetDOM();
  document.body.insertAdjacentHTML(
    "beforeend",
    `<main id="reference-main"></main>`,
  );
});

describe("buildReferenceSections", () => {
  test("renders one accented section per layout section, in order", () => {
    buildReferenceSections();

    const sections = document.querySelectorAll(".l-section");
    expect(Array.from(sections, (s) => s.id)).toEqual(
      REFERENCE_SECTIONS.map(({ id }) => id),
    );
    sections.forEach((section, i) => {
      expect(section.dataset.accent).toBe(REFERENCE_SECTIONS[i].accent);
      expect(section.querySelector(".tab-strip").dataset.section).toBe(
        section.id,
      );
    });
  });

  test("multi-tab sections get one labelled button and one panel per tab", () => {
    buildReferenceSections();

    const section = document.getElementById(multiTab.id);
    const buttons = section.querySelectorAll(".tab-btn");
    expect(Array.from(buttons, (b) => b.dataset.tab)).toEqual(
      multiTab.tabs.map(({ id }) => id),
    );
    expect(buttons[0].textContent).toBe(
      LABELS.reference.tabs[multiTab.tabs[0].id],
    );
    expect(section.querySelector(`#${multiTab.tabs[0].id}`).dataset.file).toBe(
      multiTab.tabs[0].file,
    );
  });

  test("single-tab sections show the section title and pre-activate their panel", () => {
    buildReferenceSections();

    const section = document.getElementById(loneTab.id);
    expect(section.querySelector(".tab-btn")).toBeNull();
    expect(section.querySelector(".tab-strip-title").textContent).toBe(
      LABELS.reference.nav.sections[loneTab.id].label,
    );
    expect(
      section.querySelector(".tab-panel").classList.contains("is-active"),
    ).toBe(true);
  });
});

describe("loadReferenceContent", () => {
  beforeEach(() => {
    window.marked = { parse: (md) => md };
    delete window.renderMathInElement;
  });

  test("renders markdown into each panel and wraps tables in a scroll container", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<table><tr><td>1</td></tr></table>"),
    });
    buildReferenceSections();
    await loadReferenceContent();

    const panel = document.getElementById(loneTab.tabs[0].id);
    const table = panel.querySelector(".reference-prose table");
    expect(
      table.parentElement.classList.contains("reference-table-scroll"),
    ).toBe(true);
  });

  test("shows the load error when a file fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    jest.spyOn(console, "error").mockImplementation(() => {});
    buildReferenceSections();
    await loadReferenceContent();

    const panel = document.getElementById(loneTab.tabs[0].id);
    expect(panel.querySelector(".reference-error").textContent).toBe(
      LABELS.reference.loadError,
    );
  });
});
