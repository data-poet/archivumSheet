const { loadDataset } = require("helpers/datasets.js");
const { resolveRace, pickRace } = require("engine/character/js/traits/races");
const {
  ELEMENTAL_TYPES,
} = require("engine/character/js/attributes/elementalResistances");
const { withEditedData } = require("tests/helpers/tempData");

const races = loadDataset("RACES");
const [first] = races;

// Resolves the first race after `edit` changed its row, so a cell can be set to any value.
function resolveEdited(edit) {
  return withEditedData(
    "db_yrth_races.csv",
    (rows) => {
      edit(rows[0]);
      return rows;
    },
    () => resolveRace(first.race_id),
  );
}

describe("resolveRace", () => {
  test("is an empty object without a race id or for an id the dataset lacks", () => {
    expect(resolveRace(null)).toEqual({});
    expect(resolveRace(undefined)).toEqual({});
    expect(resolveRace("RACE-NOPE")).toEqual({});
  });

  test.each(races.map((row) => [row.race_id, row]))(
    "%s carries the row's identity, modifiers and innate traits",
    (id, row) => {
      const race = resolveRace(id);
      expect(race.race_id).toBe(id);
      expect(race.race_name).toBe(row.race_name);
      expect(race.modifiers).toEqual({
        ST: Number(row.race_st_modifier) || 0,
        DX: Number(row.race_dx_modifier) || 0,
        IQ: Number(row.race_iq_modifier) || 0,
        HT: Number(row.race_ht_modifier) || 0,
      });
      expect(Object.keys(race.elemental_modifiers).sort()).toEqual(
        [...ELEMENTAL_TYPES].sort(),
      );
      const innate = (column) =>
        row[column]
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
      expect(race.innate_advantage_ids).toEqual(
        innate("race_innate_advantage_id"),
      );
      expect(race.innate_disadvantage_ids).toEqual(
        innate("race_innate_disadvantage_id"),
      );
    },
  );

  test("coerces modifiers to numbers, treating a blank cell as 0", () => {
    const race = resolveEdited((row) => {
      row.race_st_modifier = "-1";
      row.race_dx_modifier = "2";
      row.race_iq_modifier = "";
      row.race_ht_modifier = "0";
    });
    expect(race.modifiers).toEqual({ ST: -1, DX: 2, IQ: 0, HT: 0 });
  });

  test("defaults a blank or non-numeric multiplier to 1 but keeps a literal 0", () => {
    const race = resolveEdited((row) => {
      row.race_fire_damage_multiplier = "0.5";
      row.race_water_damage_multiplier = "";
      row.race_electricity_damage_multiplier = "not-a-number";
      row.race_corrosion_damage_multiplier = "0";
    });
    expect(race.elemental_modifiers.Fire).toBe(0.5);
    expect(race.elemental_modifiers.Water).toBe(1);
    expect(race.elemental_modifiers.Electricity).toBe(1);
    // A 0 multiplier means immune: `|| 1` would silently erase it.
    expect(race.elemental_modifiers.Corrosion).toBe(0);
  });

  test("splits the comma-joined innate trait columns and trims each id", () => {
    const race = resolveEdited((row) => {
      row.race_innate_advantage_id = "ADV-001, ADV-002";
      row.race_innate_disadvantage_id = "";
    });
    expect(race.innate_advantage_ids).toEqual(["ADV-001", "ADV-002"]);
    expect(race.innate_disadvantage_ids).toEqual([]);
  });

  test("normalizes empty optional columns to null", () => {
    const race = resolveEdited((row) => {
      row.race_sub_name = "";
      row.race_life_expectancy = "";
    });
    expect(race.race_sub_name).toBeNull();
    expect(race.race_life_expectancy).toBeNull();
  });
});

describe("pickRace", () => {
  const snapshot = { race_id: "RACE-CUSTOM", race_name: "Custom" };

  test("reads a dataset race fresh, whatever a stored snapshot says", () => {
    const stale = { race_id: first.race_id, modifiers: { ST: 99 } };
    expect(pickRace({ race: stale })).toEqual(resolveRace(first.race_id));
    expect(pickRace({ race_id: first.race_id })).toEqual(
      resolveRace(first.race_id),
    );
  });

  test("falls back to the snapshot of a race the dataset does not have", () => {
    expect(pickRace({ race: snapshot })).toBe(snapshot);
  });

  test("is an empty object with nothing to go on", () => {
    expect(pickRace()).toEqual({});
    expect(pickRace({ race_id: "RACE-NOPE" })).toEqual({});
  });
});
