import fs from "fs";
import path from "path";
import {
  REFERENCE_LAYOUT,
  REFERENCE_SECTIONS,
} from "dev/public/js/reference/referenceLayout.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";

const tabs = REFERENCE_SECTIONS.flatMap((section) => section.tabs);

describe("REFERENCE_LAYOUT ↔ disk", () => {
  it.each(tabs.map(({ file }) => file))("%s exists on disk", (file) => {
    const resolved = path.join(__dirname, "../../../dev/public", file);
    expect(fs.existsSync(resolved)).toBe(true);
  });

  test("every markdown file under reference-content is placed by the layout", () => {
    const root = path.join(__dirname, "../../../dev/public/reference-content");
    const onDisk = fs
      .readdirSync(root, { recursive: true })
      .filter((file) => file.endsWith(".md") && !file.endsWith("README.md"))
      .map((file) => `/reference-content/${file.split(path.sep).join("/")}`);

    expect([...onDisk].sort()).toEqual(tabs.map(({ file }) => file).sort());
  });
});

describe("REFERENCE_LAYOUT shape", () => {
  test("group, section and tab ids are unique", () => {
    [
      REFERENCE_LAYOUT.map(({ group }) => group),
      REFERENCE_SECTIONS.map(({ id }) => id),
      tabs.map(({ id }) => id),
    ].forEach((ids) => expect(new Set(ids).size).toBe(ids.length));
  });

  test("every group and section accent maps to an --accent-* token rule in navigation.css", () => {
    const css = fs.readFileSync("dev/public/css/layout/navigation.css", "utf8");
    [...REFERENCE_LAYOUT, ...REFERENCE_SECTIONS].forEach(({ accent }) =>
      expect(css).toContain(`[data-accent="${accent}"]`),
    );
  });
});

describe("REFERENCE_LAYOUT numbered sections", () => {
  test("a migrated group's sections are <group>-<n>, capped at 2-3 tabs each", () => {
    const migrated = ["system", "character", "combat", "magic"];
    REFERENCE_LAYOUT.filter(({ group }) => migrated.includes(group)).forEach(
      ({ group, sections }) => {
        sections.forEach(({ id, tabs }, i) => {
          expect(id).toBe(`${group}-${i + 1}`);
          expect(tabs.length).toBeGreaterThanOrEqual(2);
          expect(tabs.length).toBeLessThanOrEqual(3);
        });
      },
    );
  });
});

describe("REFERENCE_LAYOUT ↔ localization", () => {
  test("every group (with its mobile short label), section and tab has a label", () => {
    REFERENCE_LAYOUT.forEach(({ group }) =>
      expect(LABELS.reference.nav.groups[group]).toEqual(
        expect.objectContaining({
          label: expect.any(String),
          short: expect.any(String),
        }),
      ),
    );
    REFERENCE_SECTIONS.forEach(({ id }) =>
      expect(LABELS.reference.nav.sections[id]?.label).toBeTruthy(),
    );
    tabs.forEach(({ id }) => expect(LABELS.reference.tabs[id]).toBeTruthy());
  });
});
