const { runChecks } = require("scripts/checkData.js");
const { withEditedData } = require("tests/helpers/tempData");

function checksAfterEdit(file, rowIndex, column, value) {
  return withEditedData(
    file,
    (rows) => {
      rows[rowIndex][column] = value;
      return rows;
    },
    () => runChecks(),
  );
}

// A renamed header, which is what a spreadsheet edit of a column name looks like.
function checksAfterRenamingColumn(file, from, to) {
  return withEditedData(
    file,
    (_rows, text) => text.replace(from, to),
    () => runChecks(),
  );
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

describe("check:data guards the keys the code depends on", () => {
  test("a renamed rule key is an error", () => {
    const { errors } = withEditedData(
      "db_traits_advantages.csv",
      (rows) => {
        rows.find(
          (r) => r.advantage_key === "reflexos-em-combate",
        ).advantage_key = "reflexos";
        return rows;
      },
      () => runChecks(),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        check: "rule-key",
        id: "reflexos-em-combate",
      }),
    );
  });

  test("a tier beyond the registered ones is an error", () => {
    const { errors } = withEditedData(
      "db_traits_advantages.csv",
      (rows) => [
        ...rows,
        {
          ...rows.find((r) => r.advantage_key === "prontidao-5"),
          advantage_id: "ADV-999",
          advantage_key: "prontidao-6",
        },
      ],
      () => runChecks(),
    );
    expect(errors.map((e) => e.check)).toContain("rule-tier");
  });
});
