// compute/index.test.js already pins this mapping as it's used by the live sheet. These
// tests cover the mapper directly, including the stored-sheet path (a catalog ally) that
// the sheet never exercises.
import {
  toEngineCharacter,
  toEngineInventory,
  toEnginePayload,
} from "dev/public/js/shared/enginePayload.js";

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
    expect(character.meta_race_ids).toEqual([]);
    expect(character.conditions).toEqual([]);
  });

  test("sends the keys of the conditions that are on, ignoring any that are off", () => {
    const character = toEngineCharacter({
      conditions: { "dor-grave": true, nauseado: false, coma: true },
    });

    expect(character.conditions).toEqual(["dor-grave", "coma"]);
  });

  test("passes meta_race_ids through untouched", () => {
    const character = toEngineCharacter({
      meta_race_ids: ["META-000"],
    });

    expect(character.meta_race_ids).toEqual(["META-000"]);
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
      "race_id",
    ]);
    expect(payload.character.advantages).toEqual(["ADV-031"]);
    expect(payload.character.primaryAttributes).toEqual({
      ST: { base_value: 11, modifier: 0 },
    });
    expect(payload.inventory.armor).toEqual([{ armor_id: "ARMOR-015" }]);
  });

  // The engine reads the race from the dataset by id; the snapshot only matters for a custom race.
  test("takes the race id from the stored snapshot and passes the snapshot along", () => {
    const payload = toEnginePayload(STORED);
    expect(payload.race_id).toBe("RACE-023");
    expect(payload.race).toBe(STORED.race);
  });

  test("an explicit race_id wins over the snapshot's", () => {
    expect(toEnginePayload({ ...STORED, race_id: "RACE-001" }).race_id).toBe(
      "RACE-001",
    );
  });

  test("drops the persistence-only version field", () => {
    expect(toEnginePayload(STORED).version).toBeUndefined();
  });

  test("tolerates an entirely empty payload", () => {
    const payload = toEnginePayload();

    expect(payload.pc).toEqual({});
    expect(payload.race).toEqual({});
    expect(payload.race_id).toBeNull();
    expect(payload.character.advantages).toEqual([]);
    expect(payload.inventory.weight).toBe(0);
  });
});
