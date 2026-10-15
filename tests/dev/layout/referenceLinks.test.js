import { REFERENCE_LINKS } from "dev/public/js/layout/referenceLinks.js";
import { LAYOUT_SECTIONS } from "dev/public/js/layout/sheetLayout.js";
import { REFERENCE_SECTIONS } from "dev/public/js/reference/referenceLayout.js";

const sheetTabs = new Set(LAYOUT_SECTIONS.flatMap(({ tabs = [] }) => tabs));
const referenceTabs = new Set(
  REFERENCE_SECTIONS.flatMap(({ tabs }) => tabs.map(({ id }) => id)),
);

describe.each(Object.entries(REFERENCE_LINKS))(
  "%s → %s",
  (sheetTab, anchor) => {
    test("links a real sheet tab to a real reference tab", () => {
      expect(sheetTabs.has(sheetTab)).toBe(true);
      expect(referenceTabs.has(anchor)).toBe(true);
    });
  },
);
