import { state } from "dev/public/js/state.js";

// state.js is a single object literal treated as a mutable singleton app-wide; an accidentally dropped/renamed top-level key would silently break every module that reads it, so its shape is pinned here.

describe("state singleton contract", () => {
  test("importing state.js from a second spot in the same file resolves to the exact same object reference", () => {
    // eslint-disable-next-line no-duplicate-imports -- deliberate: proves the module registry returns the same object, not a fresh copy.
    const { state: stateAgain } = require("dev/public/js/state.js");
    expect(stateAgain).toBe(state);
  });

  test("mutating a nested property is visible to every other holder of the reference", () => {
    // Mirrors store/characters.js's _applyData(), which mutates a sub-property in place rather than reassigning state.
    const original = state.selected.character.player_name;
    state.selected.character.player_name = "Teste";

    expect(state.selected.character.player_name).toBe("Teste");

    // Restore it — this singleton persists across every test in this file that doesn't explicitly reset it.
    state.selected.character.player_name = original;
  });
});

describe("state.data shape", () => {
  test("has exactly the expected top-level keys", () => {
    expect(Object.keys(state.data).sort()).toEqual(
      [
        "accessories",
        "advantages",
        "alchemy",
        "ammo",
        "ammo_containers",
        "armors",
        "customInventory",
        "disadvantages",
        "dualUseWeapons",
        "enchantmentEffectTypes",
        "enchantments",
        "firearms",
        "itemCategories",
        "magicGear",
        "magicGearEquipLimits",
        "materials",
        "melee_weapons",
        "races",
        "ranged_weapons",
        "shields",
        "skills",
        "spells",
        "survivalGear",
      ].sort(),
    );
  });

  test.each([
    "advantages",
    "disadvantages",
    "skills",
    "spells",
    "armors",
    "shields",
    "melee_weapons",
    "ranged_weapons",
    "firearms",
    "materials",
    "races",
    "ammo",
    "ammo_containers",
    "alchemy",
    "survivalGear",
    "accessories",
    "magicGear",
    "customInventory",
    "enchantments",
  ])("data.%s defaults to an empty array", (key) => {
    expect(state.data[key]).toEqual([]);
  });

  test("enchantmentEffectTypes defaults every category to an empty array (so isAttributeType() and friends are safe pre-load)", () => {
    expect(state.data.enchantmentEffectTypes).toEqual({
      ATTRIBUTE_EFFECT_TYPES: [],
      POINT_EFFECT_TYPES: [],
      SKILL_EFFECT_TYPES: [],
      SPELL_EFFECT_TYPES: [],
      DIFFICULTY_EFFECT_TYPES: [],
      FORTIFY_EFFECT_TYPES: [],
      WEAKEN_EFFECT_TYPES: [],
    });
  });

  test("dualUseWeapons defaults both direction maps to empty objects", () => {
    expect(state.data.dualUseWeapons).toEqual({
      MELEE_TO_RANGED: {},
      RANGED_TO_MELEE: {},
    });
  });

  test("magicGearEquipLimits and itemCategories default to their documented empty shapes", () => {
    expect(state.data.magicGearEquipLimits).toEqual({});
    expect(state.data.itemCategories).toEqual({
      ACCESSORY: "",
      MAGIC_GEAR: "",
    });
  });
});

describe("state.selected shape", () => {
  test("has exactly the expected top-level keys", () => {
    expect(Object.keys(state.selected).sort()).toEqual(
      [
        "character",
        "advantages",
        "disadvantages",
        "skills",
        "spells",
        "secondary",
        "damage",
        "resistances",
        "armors",
        "shields",
        "melee_weapons",
        "ranged_weapons",
        "firearms",
        "ammo_containers",
        "loose_ammo",
        "alchemy",
        "survivalGear",
        "customInventory",
        "accessories",
        "magicGear",
        "coins",
      ].sort(),
    );
  });

  test.each([
    "armors",
    "shields",
    "melee_weapons",
    "ranged_weapons",
    "firearms",
    "ammo_containers",
    "loose_ammo",
    "alchemy",
    "survivalGear",
    "customInventory",
    "accessories",
    "magicGear",
    "coins",
  ])("selected.%s defaults to an empty array", (key) => {
    expect(state.selected[key]).toEqual([]);
  });

  test.each([
    "advantages",
    "disadvantages",
    "skills",
    "spells",
    "secondary",
    "damage",
    "resistances",
  ])("selected.%s defaults to an empty object", (key) => {
    expect(state.selected[key]).toEqual({});
  });

  test("character defaults to blank/null fields with a fully-shaped image sub-object", () => {
    expect(state.selected.character).toEqual({
      player_name: "",
      character_name: "",
      character_sex: "",
      character_age: null,
      character_weight: null,
      race_id: null,
      starting_points: null,
      experience_points: null,
      image: {
        uploaded: false,
        data: "",
        background: "",
        color: { r: "", g: "", b: "" },
        orientation: "",
        position: { x: "", y: "" },
        size: { width: "", height: "" },
        scale: "",
      },
    });
  });
});

describe("state.ui shape", () => {
  test("has exactly the expected top-level keys, defaulting debounceTimer to null", () => {
    expect(Object.keys(state.ui)).toEqual(["debounceTimer"]);
    expect(state.ui.debounceTimer).toBeNull();
  });
});
