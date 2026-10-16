const fs = require("fs");
const os = require("os");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { runChecks } = require("scripts/checkData.js");

const ROOT = path.join(__dirname, "../..");

function toCsv(rows) {
  const header = Object.keys(rows[0]).join(",");
  const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = rows.map((row) => Object.values(row).map(quote).join(","));
  return `${[header, ...lines].join("\n")}\n`;
}

// Runs the checks on a copy of data/ where one cell of one row has been changed.
function checksAfterEdit(file, rowIndex, column, value) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "check-data-"));
  const previous = process.cwd();
  try {
    fs.cpSync(path.join(ROOT, "data"), path.join(directory, "data"), {
      recursive: true,
    });
    const target = path.join(directory, "data", file);
    const rows = parse(fs.readFileSync(target, "utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    rows[rowIndex][column] = value;
    fs.writeFileSync(target, toCsv(rows));
    process.chdir(directory);
    return runChecks();
  } finally {
    process.chdir(previous);
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

// Same copy, but a column of the header is renamed (what a spreadsheet edit of a header looks like).
function checksAfterRenamingColumn(file, from, to) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "check-data-"));
  const previous = process.cwd();
  try {
    fs.cpSync(path.join(ROOT, "data"), path.join(directory, "data"), {
      recursive: true,
    });
    const target = path.join(directory, "data", file);
    const text = fs.readFileSync(target, "utf8");
    fs.writeFileSync(target, text.replace(from, to));
    process.chdir(directory);
    return runChecks();
  } finally {
    process.chdir(previous);
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

describe("check:data on the real datasets", () => {
  test("has no errors beyond the known issues", () => {
    const { errors } = runChecks();
    expect(
      errors.map((e) => `${e.dataset} ${e.id} ${e.check}: ${e.message}`),
    ).toEqual([]);
  });
});

describe("check:data catches the mistakes a hand edit or export makes", () => {
  test.each([
    [
      "a malformed id",
      "db_equipment_armors.csv",
      0,
      "armor_id",
      "BAD",
      "id-format",
    ],
    [
      "a repeated key",
      "db_equipment_armors.csv",
      1,
      "armor_key",
      "capuz-comum",
      "key-unique",
    ],
    [
      "an empty key",
      "db_equipment_armors.csv",
      0,
      "armor_key",
      "",
      "key-missing",
    ],
    [
      "a key that is not a slug",
      "db_equipment_armors.csv",
      0,
      "armor_key",
      "Capuz Comum",
      "key-format",
    ],
    [
      "an unknown tier",
      "db_equipment_armors.csv",
      0,
      "armor_tier",
      "Lendária",
      "enum",
    ],
    [
      "a dangling skill reference",
      "db_equipment_melee_weapons.csv",
      0,
      "weapon_skill_id",
      "SKILL-999",
      "reference",
    ],
    [
      "a decimal comma",
      "db_equipment_melee_weapons.csv",
      0,
      "weapon_weight",
      "1,5",
      "decimal-comma",
    ],
    [
      "a skill attribute with no cost table",
      "db_skills.csv",
      0,
      "skill_base_attribute",
      "ST",
      "skill-cost-table",
    ],
    [
      "an unknown damage type",
      "db_equipment_melee_weapons.csv",
      0,
      "weapon_damage_type",
      "Perfuação",
      "enum",
    ],
  ])("%s", (_label, file, rowIndex, column, value, expectedCheck) => {
    const { errors } = checksAfterEdit(file, rowIndex, column, value);
    expect(errors.map((e) => e.check)).toContain(expectedCheck);
  });
});

describe("check:data catches a header the code still reads", () => {
  test("a renamed column", () => {
    const { errors } = checksAfterRenamingColumn(
      "db_equipment_armors.csv",
      "armor_price",
      "armor_preco",
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        check: "column-read",
        message: expect.stringContaining("row.armor_price"),
      }),
    );
  });
});
