const { loadDataset } = require("helpers/datasets.js");
const {
  CONDITION_MODIFIER_COLUMNS,
  CONDITION_STATUS_TAGS,
} = require("helpers/taxonomy.js");
const { IMMUNITY_TRAIT_KEYS } = require("helpers/ruleKeys.js");
const { runChecks } = require("scripts/checkData.js");
const { withEditedData } = require("tests/helpers/tempData");

const rows = loadDataset("CONDITIONS");
const byKey = (key) => rows.find((row) => row.condition_key === key);
const list = (cell) => cell.split(",").filter(Boolean);

function conditionErrorsAfterEdit(key, column, value) {
  const { errors } = withEditedData(
    "db_conditions.csv",
    (edited) => {
      edited.find((row) => row.condition_key === key)[column] = value;
      return edited;
    },
    () => runChecks(),
  );
  return errors.filter((error) => error.dataset === "CONDITIONS");
}

describe("the conditions dataset", () => {
  test("has every column the code reads", () => {
    const header = Object.keys(rows[0]);
    [
      "condition_id",
      "condition_key",
      "condition_name",
      "condition_group",
      "condition_exclusive_group",
      ...Object.values(CONDITION_MODIFIER_COLUMNS),
      "condition_grants",
      "condition_recovery_attribute",
      "condition_recovery_interval",
      "condition_scales_with_pain_threshold",
      "condition_immune_trait_keys",
      "condition_reminders",
    ].forEach((column) => expect(header).toContain(column));
  });

  test("ids are COND-NNN", () => {
    expect(
      rows.filter((row) => !/^COND-\d{3}$/.test(row.condition_id)),
    ).toEqual([]);
  });

  test("every granted tag is a known one", () => {
    const granted = rows.flatMap((row) => list(row.condition_grants));
    expect(
      granted.filter((tag) => !CONDITION_STATUS_TAGS.includes(tag)),
    ).toEqual([]);
  });

  test("every immunity key is registered in helpers/ruleKeys.js", () => {
    const registered = IMMUNITY_TRAIT_KEYS.map(([, key]) => key);
    const used = rows.flatMap((row) => list(row.condition_immune_trait_keys));
    expect(used.filter((key) => !registered.includes(key))).toEqual([]);
  });

  test("check:data reports nothing on it", () => {
    const { errors } = runChecks();
    expect(errors.filter((error) => error.dataset === "CONDITIONS")).toEqual(
      [],
    );
  });
});

describe("the rules the engine will key off", () => {
  test("both stuns grant the stunned tag and carry no number", () => {
    ["atordoamento-fisico", "atordoamento-mental"].forEach((key) => {
      const row = byKey(key);
      expect(list(row.condition_grants)).toEqual(["stunned"]);
      Object.values(CONDITION_MODIFIER_COLUMNS).forEach((column) =>
        expect(row[column]).toBe(""),
      );
    });
  });

  test("conditions that can still act do not grant incapacitation", () => {
    ["alucinacao", "gravemente-nauseado"].forEach((key) =>
      expect(byKey(key).condition_grants).toBe(""),
    );
  });

  test("pain, drunkenness and nausea variants exclude each other", () => {
    const groups = {};
    rows
      .filter((row) => row.condition_exclusive_group)
      .forEach((row) => {
        (groups[row.condition_exclusive_group] ??= []).push(row.condition_key);
      });
    expect(groups).toEqual({
      embriaguez: ["embriaguez", "ligeiramente-embriagado"],
      nausea: ["nauseado", "gravemente-nauseado"],
      dor: ["dor-moderada", "dor-grave", "dor-terrivel"],
    });
  });

  test("only the pain rows scale with the pain threshold", () => {
    expect(
      rows
        .filter((row) => row.condition_scales_with_pain_threshold === "TRUE")
        .map((row) => row.condition_key),
    ).toEqual(["dor-moderada", "dor-grave", "dor-terrivel"]);
  });
});

describe("check:data catches a bad conditions edit", () => {
  test.each([
    [
      "a non-numeric modifier",
      "tosse-ou-espirro",
      "condition_dx_modifier",
      "-3x",
      "condition-number",
    ],
    [
      "an unknown status tag",
      "coma",
      "condition_grants",
      "comatose",
      "condition-tag",
    ],
    [
      "an unknown recovery attribute",
      "coma",
      "condition_recovery_attribute",
      "Per",
      "condition-recovery",
    ],
    [
      "a recovery interval with no attribute",
      "coma",
      "condition_recovery_attribute",
      "",
      "condition-recovery",
    ],
    [
      "an unregistered immunity key",
      "sufocamento",
      "condition_immune_trait_keys",
      "nao-respria",
      "condition-immune-key",
    ],
    [
      "an exclusive group left with one row",
      "ligeiramente-embriagado",
      "condition_exclusive_group",
      "",
      "condition-exclusive-group",
    ],
  ])("%s", (_label, key, column, value, expectedCheck) => {
    expect(
      conditionErrorsAfterEdit(key, column, value).map((e) => e.check),
    ).toContain(expectedCheck);
  });

  test("an immunity trait whose row is gone is pending, never an error", () => {
    const { errors, info } = withEditedData(
      "db_traits_advantages.csv",
      (edited) => {
        edited.find(
          (row) => row.advantage_key === "nao-respira",
        ).advantage_key = "nao-respira-antigo";
        return edited;
      },
      () => runChecks(),
    );
    expect(
      errors.filter((e) =>
        ["condition-immune-key", "rule-key"].includes(e.check),
      ),
    ).toEqual([]);
    expect(info).toContainEqual(
      expect.objectContaining({ check: "immunity-pending", id: "nao-respira" }),
    );
  });
});
