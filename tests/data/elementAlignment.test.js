import { ELEMENTAL_TYPES } from "engine/character/js/attributes/elementalResistances.js";
import { ELEMENT_COLUMN } from "engine/character/js/traits/metaRaces.js";
import { toEngineRace } from "dev/public/js/shared/enginePayload.js";
import { loadDataset } from "helpers/datasets.js";
import fs from "fs";
import path from "path";

const DATA = path.join(__dirname, "../../../data");

function headerOf(file) {
  return fs
    .readFileSync(path.join(DATA, file), "utf8")
    .split(/\r?\n/)[0]
    .split(",");
}

const raceColumn = (element) =>
  `race_${element.toLowerCase()}_damage_multiplier`;
const metaRaceColumn = (element) =>
  `meta_race_${element.toLowerCase()}_damage_multiplier`;

// A misspelled column reads as "no multiplier" (1) instead of failing, so the names are pinned to the element keys.
describe.each(ELEMENTAL_TYPES)("%s columns", (element) => {
  test("the races CSV has the column, and toEngineRace reads it", () => {
    expect(headerOf("db_yrth_races.csv")).toContain(raceColumn(element));

    const race = toEngineRace({ race_id: "R", [raceColumn(element)]: "0" });
    expect(race.elemental_modifiers[element]).toBe(0);
  });

  test("the meta-races CSV has the column, and the engine reads it", () => {
    expect(ELEMENT_COLUMN[element]).toBe(metaRaceColumn(element));
    expect(headerOf("db_yrth_meta_races.csv")).toContain(
      metaRaceColumn(element),
    );
  });
});

test("every elemental multiplier column in the CSVs belongs to an engine element", () => {
  const expected = [
    ...ELEMENTAL_TYPES.map(raceColumn),
    ...ELEMENTAL_TYPES.map(metaRaceColumn),
  ].sort();
  const actual = [
    ...headerOf("db_yrth_races.csv"),
    ...headerOf("db_yrth_meta_races.csv"),
  ]
    .filter((column) => column.endsWith("_damage_multiplier"))
    .sort();

  expect(actual).toEqual(expected);
});

// An unknown target is accumulated and then silently dropped, so the enchantment would do nothing.
test("every elemental-resistance enchantment targets an engine element", () => {
  const targets = loadDataset("ENCHANTMENTS")
    .filter((row) =>
      ["fortify_resistance", "weaken_resistance"].includes(
        row.enchantment_effect_type,
      ),
    )
    .map((row) => row.enchantment_target);

  expect(targets.length).toBeGreaterThan(0);
  targets.forEach((target) => expect(ELEMENTAL_TYPES).toContain(target));
});
