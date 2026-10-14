import {
  SHEET_LAYOUT,
  LAYOUT_SECTIONS,
} from "dev/public/js/layout/sheetLayout.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";

const html = require("fs").readFileSync("dev/public/index.html", "utf8");
const pool = new DOMParser()
  .parseFromString(html, "text/html")
  .getElementById("sheet-panels");

const placedIds = LAYOUT_SECTIONS.flatMap((section) =>
  section.content ? [section.content] : section.tabs,
);

describe("SHEET_LAYOUT ↔ index.html", () => {
  test("every tab panel in the pool is placed by the layout, and every placed id exists", () => {
    const poolPanels = Array.from(
      pool.querySelectorAll(":scope > .tab-panel"),
      (el) => el.id,
    );
    const layoutTabs = LAYOUT_SECTIONS.flatMap((s) => s.tabs ?? []);

    expect([...poolPanels].sort()).toEqual([...layoutTabs].sort());
    placedIds.forEach((id) =>
      expect(pool.querySelector(`#${id}`)).not.toBeNull(),
    );
  });

  test("nothing is placed twice", () => {
    expect(new Set(placedIds).size).toBe(placedIds.length);
    const sectionIds = LAYOUT_SECTIONS.map((s) => s.id);
    expect(new Set(sectionIds).size).toBe(sectionIds.length);
  });

  test("index.html no longer hand-writes section shells", () => {
    expect(html).not.toMatch(/class="l-section"/);
  });
});

describe("SHEET_LAYOUT shape", () => {
  test("each section holds either tabs (with a box) or a single content element", () => {
    LAYOUT_SECTIONS.forEach((section) => {
      if (section.content) {
        expect(section.tabs).toBeUndefined();
      } else {
        expect(section.tabs.length).toBeGreaterThan(0);
        expect(section.box).toMatch(/^box--/);
      }
    });
  });

  test("every accent maps to an --accent-* token rule in navigation.css", () => {
    const css = require("fs").readFileSync(
      "dev/public/css/layout/navigation.css",
      "utf8",
    );
    LAYOUT_SECTIONS.filter((s) => s.accent).forEach(({ accent }) =>
      expect(css).toContain(`[data-accent="${accent}"]`),
    );
  });
});

describe("SHEET_LAYOUT ↔ localization", () => {
  test("every group (with its mobile short label), section and tab has a label", () => {
    SHEET_LAYOUT.forEach(({ group }) =>
      expect(LABELS.nav.groups[group]).toEqual(
        expect.objectContaining({
          label: expect.any(String),
          short: expect.any(String),
        }),
      ),
    );
    LAYOUT_SECTIONS.forEach(({ id, tabs = [] }) => {
      expect(LABELS.nav.sections[id]?.label).toBeTruthy();
      tabs.forEach((tabId) => expect(LABELS.tabs[tabId]).toBeTruthy());
    });
  });
});
