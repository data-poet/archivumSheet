const fs = require("fs");
const os = require("os");
const path = require("path");
const { DATASETS, datasetPath } = require("helpers/datasets.js");
const { ID_COLUMN, KEY_COLUMN } = require("helpers/datasetColumns.js");
const { parseCsvText, serializeCsv } = require("helpers/csvText.js");
const { carryKeys } = require("scripts/carryKeys.js");
const { runImport } = require("scripts/importData.js");
const { runChecks } = require("scripts/checkData.js");

const ROOT = path.join(__dirname, "../..");
const originalText = (dataset) =>
  fs.readFileSync(
    path.join(ROOT, "data", path.basename(datasetPath(dataset))),
    "utf8",
  );

const SKILLS_HEAD =
  "skill_id,skill_key,skill_name,skill_category\nSKILL-000,a,Alpha,X\nSKILL-001,b,Beta,X\nSKILL-002,c,Gamma,Y\n";

describe("carryKeys", () => {
  test("keeps a key that is already there", () => {
    const { text, kept, created } = carryKeys("SKILLS", {
      headText: SKILLS_HEAD,
      workingText: SKILLS_HEAD,
    });
    expect(text).toBe(SKILLS_HEAD);
    expect(kept).toBe(3);
    expect(created).toEqual([]);
  });

  test("adds the key column after the id and carries keys over by id and name", () => {
    const working =
      "skill_id,skill_name,skill_category\nSKILL-000,Alpha,X\nSKILL-001,Beta,X\nSKILL-002,Gamma,Y\n";
    expect(
      carryKeys("SKILLS", { headText: SKILLS_HEAD, workingText: working }).text,
    ).toBe(SKILLS_HEAD);
  });

  test("a renumbered and reordered row keeps its key", () => {
    const working =
      "skill_id,skill_name,skill_category\nSKILL-900,Gamma,Y\nSKILL-901,Alpha,X\nSKILL-902,Beta,X\n";
    const { text, carried, created } = carryKeys("SKILLS", {
      headText: SKILLS_HEAD,
      workingText: working,
    });
    expect(carried).toBe(3);
    expect(created).toEqual([]);
    expect(text).toBe(
      "skill_id,skill_key,skill_name,skill_category\nSKILL-900,c,Gamma,Y\nSKILL-901,a,Alpha,X\nSKILL-902,b,Beta,X\n",
    );
  });

  test("a renamed row at the same id keeps its key only if something else still matches", () => {
    const working =
      "skill_id,skill_name,skill_category\nSKILL-000,Alpha,X\nSKILL-001,Beta renamed,X\nSKILL-002,Gamma,Y\n";
    const { created, gone } = carryKeys("SKILLS", {
      headText: SKILLS_HEAD,
      workingText: working,
    });
    expect(created).toEqual([
      { id: "SKILL-001", key: "beta-renamed", name: "Beta renamed" },
    ]);
    expect(gone).toEqual([{ key: "b", name: "Beta" }]);
  });

  test("a new row gets a derived key that never collides with an existing one", () => {
    const working =
      "skill_id,skill_name,skill_category\nSKILL-000,Alpha,X\nSKILL-001,Beta,X\nSKILL-002,Gamma,Y\nSKILL-003,Alpha,Z\n";
    const { created } = carryKeys("SKILLS", {
      headText: SKILLS_HEAD,
      workingText: working,
    });
    expect(created).toHaveLength(1);
    expect(["a", "b", "c"]).not.toContain(created[0].key);
  });

  test("works without a committed version", () => {
    const { created } = carryKeys("SKILLS", {
      headText: null,
      workingText: "skill_id,skill_name,skill_category\nSKILL-000,Alpha,X\n",
    });
    expect(created).toEqual([{ id: "SKILL-000", key: "alpha", name: "Alpha" }]);
  });
});

// Makes the data/ of a temp copy look like a fresh spreadsheet export: no key columns, CRLF endings, no
// final newline, optionally edited by `edit(dataset, rows)`.
function exportedCopy(edit = () => {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "import-data-"));
  fs.mkdirSync(path.join(directory, "data"));
  Object.keys(DATASETS).forEach((dataset) => {
    const [header, ...records] = parseCsvText(originalText(dataset));
    const keyAt = header.findIndex((column) => column.endsWith("_key"));
    const strip = (row) =>
      keyAt === -1 ? row : row.filter((_c, i) => i !== keyAt);
    const rows = edit(dataset, [strip(header), ...records.map(strip)]) ?? [
      strip(header),
      ...records.map(strip),
    ];
    const text = rows
      .map((row) => serializeCsv([row]).slice(0, -1))
      .join("\r\n");
    fs.writeFileSync(
      path.join(directory, "data", path.basename(datasetPath(dataset))),
      text,
    );
  });
  return directory;
}

function importInto(directory) {
  const previous = process.cwd();
  process.chdir(directory);
  try {
    const result = runImport({
      readHead: originalText,
      readWorking: (dataset) => fs.readFileSync(datasetPath(dataset), "utf8"),
    });
    Object.entries(result.texts).forEach(([dataset, text]) =>
      fs.writeFileSync(datasetPath(dataset), text),
    );
    return { result, checks: runChecks() };
  } finally {
    process.chdir(previous);
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

const shiftId = (rows, idColumn, by = 500) => {
  const at = rows[0].indexOf(idColumn);
  return rows.map((row, i) =>
    i === 0
      ? row
      : row.map((cell, c) =>
          c === at
            ? cell.replace(/\d+$/, (n) =>
                String(Number(n) + by).padStart(n.length, "0"),
              )
            : cell,
        ),
  );
};

describe("data:import on a fresh export", () => {
  test("an untouched export gets its keys back and nothing else changes", () => {
    const { result, checks } = importInto(exportedCopy());
    Object.entries(result.keyReports).forEach(([, report]) => {
      expect(report.created).toEqual([]);
      expect(report.gone).toEqual([]);
    });
    Object.keys(DATASETS).forEach((dataset) => {
      expect(result.texts[dataset]).toBe(originalText(dataset));
    });
    expect(checks.errors).toEqual([]);
  });

  test("renumbered, reordered skills and traits keep their keys and every reference follows", () => {
    const { result, checks } = importInto(
      exportedCopy((dataset, rows) => {
        if (["SKILLS", "ADVANTAGES", "DISADVANTAGES"].includes(dataset)) {
          const shifted = shiftId(rows, ID_COLUMN[dataset]);
          const [header, ...records] = shifted;
          return dataset === "SKILLS"
            ? [header, ...records.reverse()]
            : shifted;
        }
        return undefined;
      }),
    );

    ["SKILLS", "ADVANTAGES", "DISADVANTAGES"].forEach((dataset) => {
      expect(result.keyReports[dataset].created).toEqual([]);
      expect(result.keyReports[dataset].carried).toBeGreaterThan(100);
    });
    expect(result.targets.sort()).toEqual([
      "ADVANTAGES",
      "DISADVANTAGES",
      "SKILLS",
    ]);
    expect(checks.errors).toEqual([]);

    const rows = parseCsvText(result.texts.MELEE_WEAPONS);
    const skillAt = rows[0].indexOf("weapon_skill_id");
    const referenced = rows
      .slice(1)
      .map((row) => row[skillAt])
      .filter(Boolean);
    expect(referenced.every((id) => Number(id.slice(6)) >= 500)).toBe(true);
  });

  test("a row renamed and renumbered together is reported as new, with its references dangling", () => {
    const { result } = importInto(
      exportedCopy((dataset, rows) => {
        if (dataset !== "SKILLS") return undefined;
        const [header, ...records] = shiftId(rows, "skill_id");
        const nameAt = header.indexOf("skill_name");
        const target = records.find((r) => r[nameAt] === "ARCO");
        target[nameAt] = "ARCO LONGO RENOMEADO";
        return [header, ...records];
      }),
    );
    expect(result.keyReports.SKILLS.created.map((c) => c.name)).toEqual([
      "ARCO LONGO RENOMEADO",
    ]);
    expect(result.keyReports.SKILLS.gone.map((g) => g.name)).toEqual(["ARCO"]);
    const dangling = result.remap.files.flatMap((f) => f.dangling);
    expect(dangling.length).toBeGreaterThan(0);
  });

  test("a new row gets a derived key", () => {
    const { result } = importInto(
      exportedCopy((dataset, rows) => {
        if (dataset !== "ARMORS") return undefined;
        const [header, ...records] = rows;
        const copy = [...records[0]];
        copy[header.indexOf("armor_id")] = "ARMOR-999";
        copy[header.indexOf("armor_name")] = "Elmo Novo";
        return [header, ...records, copy];
      }),
    );
    expect(result.keyReports.ARMORS.created).toEqual([
      expect.objectContaining({ id: "ARMOR-999", key: "elmo-novo-comum" }),
    ]);
  });
});
