import fs from "fs";
import path from "path";
import { REFERENCE_SECTIONS } from "dev/public/js/reference/referenceLayout.js";
import { slugify } from "dev/public/js/reference/enhance.js";
import { loadDataset } from "helpers/datasets.js";

const PUBLIC = path.join(__dirname, "../../../dev/public");
const tabs = REFERENCE_SECTIONS.flatMap((section) => section.tabs);

// Mirrors enhance.js's _assignAnchors: "<tab id>--<slug of the title>", numbered when a title repeats.
function anchorsOf(tab) {
  const markdown = fs.readFileSync(path.join(PUBLIC, tab.file), "utf8");
  const used = new Set();

  for (const match of markdown.matchAll(
    /^### (.+)$|^<summary>(.*)<\/summary>$/gm,
  )) {
    const label = (match[1] ?? match[2]).trim();
    if (/^Exemplos?$/.test(label)) continue;

    const base = `${tab.id}--${slugify(label.split(" | ")[0].trim())}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
  }
  return used;
}

const anchors = new Set(tabs.flatMap((tab) => [...anchorsOf(tab)]));
const rows = loadDataset("CONDITIONS");

describe("the reference anchors the conditions link to", () => {
  test("the column exists and every condition has one", () => {
    expect(Object.keys(rows[0])).toContain("condition_reference_anchor");
    expect(
      rows
        .filter((row) => !row.condition_reference_anchor)
        .map((r) => r.condition_key),
    ).toEqual([]);
  });

  test.each(
    rows.map((row) => [row.condition_key, row.condition_reference_anchor]),
  )("%s points at an entry that exists (%s)", (_key, anchor) => {
    expect(anchors.has(anchor)).toBe(true);
  });

  test("the stuns and shock point at the combat page, the rest at the conditions page", () => {
    const byKey = Object.fromEntries(
      rows.map((row) => [row.condition_key, row.condition_reference_anchor]),
    );

    expect(byKey["atordoamento-fisico"]).toBe(
      "tab-combat-rules--atordoamento-e-nocaute",
    );
    expect(byKey["atordoamento-mental"]).toBe(byKey["atordoamento-fisico"]);
    expect(byKey["choque-4"]).toBe("tab-combat-rules--choque");
    expect(byKey["dor-grave"]).toBe("tab-conditions-general--dor");
    expect(byKey["paralisia"]).toBe("tab-conditions-general--paralisia");
  });

  test("the anchor helper finds titles with accents and a numbered repeat", () => {
    const general = anchorsOf({
      id: "tab-x",
      file: "reference-content/effects/conditions_general.md",
    });
    const mortal = anchorsOf({
      id: "tab-x",
      file: "reference-content/effects/mortal_conditions.md",
    });

    expect(general.has("tab-x--extase")).toBe(true);
    expect(mortal.has("tab-x--ataque-cardiaco")).toBe(true);
  });
});
