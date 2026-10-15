import fs from "fs";
import path from "path";
import { ICONS, icon } from "dev/public/js/shared/icons.js";
import { SHEET_LAYOUT } from "dev/public/js/layout/sheetLayout.js";
import { REFERENCE_LAYOUT } from "dev/public/js/reference/referenceLayout.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";

const PUBLIC = path.join(__dirname, "../../../dev/public");

function filesUnder(dir, ext) {
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith(ext))
    .map((f) => path.join(dir, f));
}

describe("icon()", () => {
  test("returns the icon markup, or an empty string for unknown names", () => {
    expect(icon("search")).toBe(ICONS.search);
    expect(icon("nope")).toBe("");
  });
});

describe("every icon name in use exists in ICONS", () => {
  const layoutEntries = [SHEET_LAYOUT, REFERENCE_LAYOUT].flatMap((layout) =>
    layout.flatMap(({ group, icon: name, sections }) => [
      [group, name],
      ...sections.map(({ id, icon: sectionIcon }) => [id, sectionIcon]),
    ]),
  );

  test.each(layoutEntries)("%s → %s", (_id, name) => {
    expect(ICONS).toHaveProperty([name]);
  });

  test.each(Object.keys(LABELS.reference.alerts))("callout %s", (type) => {
    expect(ICONS).toHaveProperty([`callout-${type}`]);
  });
});

// Keeps icons in one place: an emoji or the ✕ glyph anywhere else means it bypassed icons.js.
describe("no hardcoded icons outside icons.js", () => {
  const files = [
    ...filesUnder(path.join(PUBLIC, "js"), ".js"),
    path.join(PUBLIC, "index.html"),
    path.join(PUBLIC, "reference.html"),
  ].filter((f) => !f.endsWith(path.join("shared", "icons.js")));

  test.each(files.map((f) => [path.relative(PUBLIC, f), f]))(
    "%s",
    (_rel, file) => {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(source).not.toContain("✕");
    },
  );
});
