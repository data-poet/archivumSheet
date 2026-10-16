const fs = require("fs");
const path = require("path");
const { DATASETS, datasetPath } = require("helpers/datasets.js");
const { parseCsvText, serializeCsv } = require("helpers/csvText.js");
const { mapIdsInCell, idsInCell } = require("helpers/datasetReferences.js");
const {
  buildIdMap,
  remapCsv,
  planRemap,
} = require("scripts/remapReferences.js");
const { runChecks } = require("scripts/checkData.js");
const { withEditedData } = require("tests/helpers/tempData");

const ROOT = path.join(__dirname, "../..");

describe("csvText", () => {
  test.each(Object.keys(DATASETS))(
    "%s round-trips byte for byte, so a rewrite touches only changed cells",
    (dataset) => {
      const text = fs.readFileSync(datasetPath(dataset), "utf8");
      expect(serializeCsv(parseCsvText(text))).toBe(text);
    },
  );
});

describe("cell mapping", () => {
  test("repoints ids in lists and pairs and keeps separators", () => {
    const map = (id) =>
      ({ "SKILL-001": "SKILL-501", "SKILL-002": "SKILL-502" })[id];
    expect(mapIdsInCell("SKILL-001, SKILL-002", map)).toBe(
      "SKILL-501, SKILL-502",
    );
    expect(mapIdsInCell("SKILL-001:-2;SKILL-003:-3", map)).toBe(
      "SKILL-501:-2;SKILL-003:-3",
    );
    expect(mapIdsInCell("", map)).toBe("");
  });

  test("a swap of two ids is applied in one pass", () => {
    const map = (id) =>
      ({ "SKILL-001": "SKILL-002", "SKILL-002": "SKILL-001" })[id];
    expect(mapIdsInCell("SKILL-001;SKILL-002", map)).toBe(
      "SKILL-002;SKILL-001",
    );
  });

  test("finds ids of every dataset prefix", () => {
    expect(idsInCell("ADV-001, MAGIC_GEAR-002 and DIS-300")).toEqual([
      "ADV-001",
      "MAGIC_GEAR-002",
      "DIS-300",
    ]);
  });
});

describe("buildIdMap", () => {
  const before =
    "skill_id,skill_key,skill_name\nSKILL-000,a,A\nSKILL-001,b,B\nSKILL-002,c,C\n";

  test("matches rows by key and reports changed, gone and new rows", () => {
    const after =
      "skill_id,skill_key,skill_name\nSKILL-010,b,B renamed\nSKILL-011,a,A\nSKILL-012,d,D\n";
    const { mapping, removed, added } = buildIdMap("SKILLS", before, after);
    expect([...mapping]).toEqual([
      ["SKILL-000", "SKILL-011"],
      ["SKILL-001", "SKILL-010"],
    ]);
    expect(removed).toEqual([{ key: "c", id: "SKILL-002" }]);
    expect(added).toEqual(["d"]);
  });

  test("refuses a version without keys", () => {
    expect(() =>
      buildIdMap("SKILLS", "skill_id,skill_name\nSKILL-000,A\n", before),
    ).toThrow(/no skill_key column/);
  });
});

describe("remapCsv", () => {
  test("rewrites only the reference cells and reports references to rows that are gone", () => {
    const text =
      "weapon_id,weapon_skill_id,weapon_name\nW-1,SKILL-000,Sword\nW-2,SKILL-002,Axe\nW-3,,Club\n";
    const mappings = {
      SKILLS: {
        mapping: new Map([["SKILL-000", "SKILL-500"]]),
        removed: [{ key: "c", id: "SKILL-002" }],
        added: [],
      },
    };
    const {
      text: out,
      changedCells,
      dangling,
    } = remapCsv(
      text,
      [{ column: "weapon_skill_id", target: "SKILLS" }],
      mappings,
    );
    expect(out).toBe(
      "weapon_id,weapon_skill_id,weapon_name\nW-1,SKILL-500,Sword\nW-2,SKILL-002,Axe\nW-3,,Club\n",
    );
    expect(changedCells).toBe(1);
    expect(dangling).toEqual([{ column: "weapon_skill_id", id: "SKILL-002" }]);
  });
});

describe("renumbering a whole dataset", () => {
  test("repointing every reference leaves check:data without reference errors", () => {
    const original = (dataset) =>
      fs.readFileSync(
        path.join(ROOT, "data", path.basename(datasetPath(dataset))),
        "utf8",
      );
    const referenceErrors = (result) =>
      result.errors.filter((e) => e.check === "reference");

    withEditedData(
      "db_skills.csv",
      (rows) =>
        rows.map((row) => ({
          ...row,
          skill_id: `SKILL-${String(Number(row.skill_id.slice(6)) + 500).padStart(3, "0")}`,
        })),
      () => {
        expect(referenceErrors(runChecks()).length).toBeGreaterThan(100);

        const readNow = (dataset) =>
          fs.readFileSync(datasetPath(dataset), "utf8");
        const { mappings, files } = planRemap(["SKILLS"], {
          readOld: original,
          readNew: readNow,
          readReferencing: readNow,
        });
        expect(mappings.SKILLS.mapping.size).toBe(258);
        files.forEach(({ dataset, text }) =>
          fs.writeFileSync(datasetPath(dataset), text),
        );

        expect(referenceErrors(runChecks())).toEqual([]);
        expect(files.map((f) => f.dataset).sort()).toEqual([
          "FIREARMS",
          "MELEE_WEAPONS",
          "RANGED_WEAPONS",
          "SKILLS",
        ]);
      },
    );
  });
});
