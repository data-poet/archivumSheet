import { buildSheetLayout } from "dev/public/js/layout/buildSheetLayout.js";
import { LAYOUT_SECTIONS } from "dev/public/js/layout/sheetLayout.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const tabbed = LAYOUT_SECTIONS.find((s) => s.tabs?.length > 1);
const single = LAYOUT_SECTIONS.find((s) => s.tabs?.length === 1);
const plain = LAYOUT_SECTIONS.find((s) => s.content);

function poolDOM({ extra = "" } = {}) {
  const panels = LAYOUT_SECTIONS.flatMap((s) =>
    s.content
      ? [`<div id="${s.content}"></div>`]
      : s.tabs.map(
          (id) =>
            `<div class="tab-panel" id="${id}"><input id="${id}-input" /></div>`,
        ),
  ).join("");
  document.body.insertAdjacentHTML(
    "beforeend",
    `<main id="main-content"><div id="sheet-panels" hidden>${panels}${extra}</div></main>`,
  );
}

beforeEach(() => {
  resetDOM();
});

describe("buildSheetLayout", () => {
  test("creates one .l-section per layout section, in layout order", () => {
    poolDOM();
    buildSheetLayout();

    const ids = Array.from(
      document.querySelectorAll("#main-content > .l-section"),
      (s) => s.id,
    );
    expect(ids).toEqual(LAYOUT_SECTIONS.map((s) => s.id));
  });

  test("tabbed sections get a box, a labelled tab strip and their panels, in order", () => {
    poolDOM();
    buildSheetLayout();

    const section = document.getElementById(tabbed.id);
    expect(section.dataset.section).toBe(tabbed.id);
    expect(section.dataset.accent).toBe(tabbed.accent);

    const box = section.querySelector(":scope > .box");
    expect(box.classList).toContain(tabbed.box);

    const strip = box.querySelector(".tab-strip");
    expect(strip.dataset.section).toBe(tabbed.id);
    const buttons = Array.from(strip.querySelectorAll(".tab-btn"));
    expect(buttons.map((b) => b.dataset.tab)).toEqual(tabbed.tabs);
    expect(buttons.map((b) => b.textContent)).toEqual(
      tabbed.tabs.map((id) => LABELS.tabs[id]),
    );
    expect(strip.querySelector(".tab-strip-collapse")).not.toBeNull();

    expect(
      Array.from(box.querySelectorAll(":scope > .tab-panel"), (p) => p.id),
    ).toEqual(tabbed.tabs);
  });

  test("single-tab sections get a section-title heading instead of a tab button, with the panel pre-activated", () => {
    poolDOM();
    buildSheetLayout();

    const strip = document.querySelector(`#${single.id} .tab-strip`);
    expect(strip.querySelector(".tab-btn")).toBeNull();
    expect(strip.querySelector(".tab-strip-title").textContent).toBe(
      LABELS.nav.sections[single.id].label,
    );
    expect(strip.querySelector(".tab-strip-collapse")).not.toBeNull();
    expect(
      document.getElementById(single.tabs[0]).classList.contains("is-active"),
    ).toBe(true);
  });

  test("multi-tab panels are left for initTabs() to activate", () => {
    poolDOM();
    buildSheetLayout();

    tabbed.tabs.forEach((id) =>
      expect(document.getElementById(id).classList.contains("is-active")).toBe(
        false,
      ),
    );
  });

  test("content sections wrap their element directly, without a box or strip", () => {
    poolDOM();
    buildSheetLayout();

    const section = document.getElementById(plain.id);
    expect(section.firstElementChild.id).toBe(plain.content);
    expect(section.querySelector(".tab-strip")).toBeNull();
  });

  test("moves the original panel nodes, so references and listeners survive", () => {
    poolDOM();
    const input = document.getElementById(`${tabbed.tabs[0]}-input`);
    const listener = jest.fn();
    input.addEventListener("input", listener);

    buildSheetLayout();
    document
      .getElementById(`${tabbed.tabs[0]}-input`)
      .dispatchEvent(new Event("input"));

    expect(document.getElementById(`${tabbed.tabs[0]}-input`)).toBe(input);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("removes the pool once every panel is placed", () => {
    poolDOM();
    buildSheetLayout();
    expect(document.getElementById("sheet-panels")).toBeNull();
  });

  test("keeps the pool hidden with any panel the layout doesn't place", () => {
    poolDOM({ extra: `<div class="tab-panel" id="tab-orphan"></div>` });
    buildSheetLayout();

    const pool = document.getElementById("sheet-panels");
    expect(pool.hidden).toBe(true);
    expect(pool.querySelector("#tab-orphan")).not.toBeNull();
  });

  test("does not throw when #main-content is missing", () => {
    expect(() => buildSheetLayout()).not.toThrow();
  });
});

describe("buildSheetLayout — reference help links", () => {
  const { REFERENCE_LINKS } = require("dev/public/js/layout/referenceLinks.js");

  test("sections with a mapped tab get a '?' link opening the reference in a new tab", () => {
    poolDOM();
    buildSheetLayout();

    const strip = document.querySelector("#section-attributes .tab-strip");
    const help = strip.querySelector(".tab-strip-help");
    expect(help.getAttribute("href")).toBe(
      `/reference.html#${REFERENCE_LINKS["tab-attr-primary"]}`,
    );
    expect(help.target).toBe("_blank");
    expect(help.getAttribute("aria-label")).toBe(LABELS.nav.referenceHelp);
    expect(
      strip.querySelector('.tab-btn[data-tab="tab-attr-secondary"]').dataset
        .reference,
    ).toBe(REFERENCE_LINKS["tab-attr-secondary"]);
    const survival = document.querySelector("#section-survival .tab-strip");
    expect(
      survival.querySelector('.tab-btn[data-tab="tab-attr-damage"]').dataset
        .reference,
    ).toBe(REFERENCE_LINKS["tab-attr-damage"]);
    expect(survival.querySelector(".tab-strip-help").getAttribute("href")).toBe(
      `/reference.html#${REFERENCE_LINKS["tab-attr-damage"]}`,
    );
    expect(
      help.nextElementSibling.classList.contains("tab-strip-collapse"),
    ).toBe(true);
  });

  test("sections without mapped tabs get no link", () => {
    poolDOM();
    buildSheetLayout();

    expect(
      document.querySelector("#section-skills .tab-strip-help"),
    ).toBeNull();
  });
});
