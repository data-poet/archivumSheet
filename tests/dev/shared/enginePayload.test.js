// compute/index.test.js already pins this mapping as it's used by the live sheet. These
// tests cover the mapper directly, including the stored-sheet path (a catalog ally) that
// the sheet never exercises.
import {
  toEngineRace,
  toEngineCharacter,
  toEngineInventory,
  toEnginePayload,
} from "dev/public/js/shared/enginePayload.js";

describe("toEngineRace", () => {
  test("returns an empty object for a missing row", () => {
    expect(toEngineRace(null)).toEqual({});
    expect(toEngineRace(undefined)).toEqual({});
  });

  test("coerces modifiers to numbers, treating a blank cell as 0", () => {
    const race = toEngineRace({
      race_id: "R1",
      race_st_modifier: "-1",
      race_dx_modifier: "2",
      race_iq_modifier: "",
      race_ht_modifier: "0",
    });

    expect(race.modifiers).toEqual({ ST: -1, DX: 2, IQ: 0, HT: 0 });
  });

  test("defaults a blank or non-numeric elemental multiplier to 1 but keeps a literal 0", () => {
    const race = toEngineRace({
      race_id: "R1",
      race_fire_damage_multiplier: "0.5",
      race_water_damage_multiplier: "",
      race_electricity_damage_multiplier: "not-a-number",
      race_corrossion_damage_multiplier: "0",
    });

    expect(race.elemental_modifiers.Fire).toBe(0.5);
    expect(race.elemental_modifiers.Water).toBe(1);
    expect(race.elemental_modifiers.Electricity).toBe(1);
    // A 0 multiplier means immune — `|| 1` would silently erase it.
    expect(race.elemental_modifiers.Corrosion).toBe(0);
  });

  test("splits the comma-joined innate trait columns and trims each id", () => {
    const race = toEngineRace({
      race_id: "R1",
      race_innate_advantage_id: "ADV-001, ADV-002",
      race_innate_disadvantage_id: "",
      race_innate_advantage_name: "Visão Noturna, Ágil",
    });

    expect(race.innate_advantage_ids).toEqual(["ADV-001", "ADV-002"]);
    expect(race.innate_disadvantage_ids).toEqual([]);
    expect(race.innate_advantage_names).toEqual(["Visão Noturna", "Ágil"]);
  });

  test("normalizes absent optional columns to null", () => {
    const race = toEngineRace({ race_id: "R1", race_name: "Elfo" });

    expect(race.race_sub_name).toBeNull();
    expect(race.race_life_expectancy).toBeNull();
  });
});

describe("toEngineCharacter", () => {
  test("turns the trait maps into id arrays", () => {
    const character = toEngineCharacter({
      advantages: { "ADV-1": {}, "ADV-2": {} },
      disadvantages: { "DIS-1": {} },
    });

    expect(character.advantages).toEqual(["ADV-1", "ADV-2"]);
    expect(character.disadvantages).toEqual(["DIS-1"]);
  });

  test("folds damage and resistances into secondaryAttributes as modifier maps", () => {
    const character = toEngineCharacter({
      secondary: { HP: { bought: 1, modifier: -3 } },
      damage: { thrust: { modifier: "2" } },
      resistances: { Fire: { modifier: -0.3 } },
    });

    expect(character.secondaryAttributes.HP).toEqual({
      bought: 1,
      modifier: -3,
    });
    expect(character.secondaryAttributes.damage).toEqual({
      thrust: { modifier: 2 },
    });
    expect(character.secondaryAttributes.elementalResistances).toEqual({
      Fire: { modifier: -0.3 },
    });
  });

  test("coerces an unparsable modifier to 0 rather than NaN", () => {
    const character = toEngineCharacter({
      damage: { thrust: { modifier: "abc" } },
      resistances: { Fire: {} },
    });

    expect(character.secondaryAttributes.damage.thrust.modifier).toBe(0);
    expect(
      character.secondaryAttributes.elementalResistances.Fire.modifier,
    ).toBe(0);
  });

  test("turns the skills map into an array keyed by skill_id", () => {
    const character = toEngineCharacter({
      skills: {
        "SKILL-1": { base_value: 12, modifier: 2, isTrainedWithMaster: true },
      },
    });

    expect(character.skills).toEqual([
      {
        skill_id: "SKILL-1",
        base_value: 12,
        modifier: 2,
        isTrainedWithMaster: true,
      },
    ]);
  });

  test("accepts the older persisted `base` spelling for a skill's base value", () => {
    const character = toEngineCharacter({
      skills: { "SKILL-1": { base: 10 } },
    });

    expect(character.skills[0].base_value).toBe(10);
    expect(character.skills[0].isTrainedWithMaster).toBe(false);
  });

  test("reads primaryAttributes from the stored sheet when none is passed", () => {
    const character = toEngineCharacter({
      primary: { ST: { base_value: 11, modifier: 0 } },
    });

    expect(character.primaryAttributes).toEqual({
      ST: { base_value: 11, modifier: 0 },
    });
  });

  // The live sheet keeps the PC's primary attributes in the edit view's inputs, not state.
  test("an explicit primary argument wins over the stored one", () => {
    const character = toEngineCharacter(
      { primary: { ST: { base_value: 11, modifier: 0 } } },
      { ST: { base_value: 14, modifier: 1 } },
    );

    expect(character.primaryAttributes).toEqual({
      ST: { base_value: 14, modifier: 1 },
    });
  });

  test("an empty character maps to empty collections, not undefined", () => {
    const character = toEngineCharacter();

    expect(character.advantages).toEqual([]);
    expect(character.disadvantages).toEqual([]);
    expect(character.skills).toEqual([]);
    expect(character.spells).toEqual({});
    expect(character.primaryAttributes).toEqual({});
  });
});

describe("toEngineInventory", () => {
  test("renames every persisted bucket to its engine key", () => {
    const inventory = toEngineInventory({
      weight: "12",
      armors: ["a"],
      shields: ["s"],
      melee_weapons: ["m"],
      ranged_weapons: ["r"],
      firearms: ["f"],
      survivalGear: ["sg"],
      magicGear: ["mg"],
      customInventory: ["ci"],
    });

    expect(inventory.weight).toBe(12);
    expect(inventory.armor).toEqual(["a"]);
    expect(inventory.shield).toEqual(["s"]);
    expect(inventory.melee).toEqual(["m"]);
    expect(inventory.ranged).toEqual(["r"]);
    expect(inventory.firearms).toEqual(["f"]);
    expect(inventory.survival_gear).toEqual(["sg"]);
    expect(inventory.magic_gear).toEqual(["mg"]);
    expect(inventory.custom_inventory).toEqual(["ci"]);
  });

  test("defaults a blank or unparsable weight to 0", () => {
    expect(toEngineInventory({ weight: "" }).weight).toBe(0);
    expect(toEngineInventory({ weight: "abc" }).weight).toBe(0);
    expect(toEngineInventory({}).weight).toBe(0);
  });

  test("an empty inventory maps every bucket to an array", () => {
    const inventory = toEngineInventory();

    Object.entries(inventory).forEach(([key, value]) => {
      if (key === "weight") return;
      expect(Array.isArray(value)).toBe(true);
      expect(value).toHaveLength(0);
    });
  });
});

describe("toEnginePayload", () => {
  const STORED = {
    version: 1,
    pc: { character_name: "Bran" },
    race: { race_id: "RACE-023", modifiers: { ST: 0, DX: 0, IQ: 0, HT: 0 } },
    character: {
      primary: { ST: { base_value: 11, modifier: 0 } },
      advantages: { "ADV-031": {} },
      skills: { "SKILL-044": { base_value: 12, modifier: 0 } },
    },
    inventory: { weight: 0, armors: [{ armor_id: "ARMOR-015" }] },
  };

  test("maps a stored sheet into the four engine sections", () => {
    const payload = toEnginePayload(STORED);

    expect(Object.keys(payload).sort()).toEqual([
      "character",
      "inventory",
      "pc",
      "race",
    ]);
    expect(payload.character.advantages).toEqual(["ADV-031"]);
    expect(payload.character.primaryAttributes).toEqual({
      ST: { base_value: 11, modifier: 0 },
    });
    expect(payload.inventory.armor).toEqual([{ armor_id: "ARMOR-015" }]);
  });

  // A stored sheet's `race` is already the built engine object (export keeps sheet.race),
  // so it must pass through untouched rather than being re-derived from a CSV row.
  test("passes a stored race through unchanged", () => {
    expect(toEnginePayload(STORED).race).toBe(STORED.race);
  });

  test("drops the persistence-only version field", () => {
    expect(toEnginePayload(STORED).version).toBeUndefined();
  });

  test("tolerates an entirely empty payload", () => {
    const payload = toEnginePayload();

    expect(payload.pc).toEqual({});
    expect(payload.race).toEqual({});
    expect(payload.character.advantages).toEqual([]);
    expect(payload.inventory.weight).toBe(0);
  });
});
