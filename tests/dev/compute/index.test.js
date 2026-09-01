// runEngine() orchestrates a wide dependency tree. api.js, store/characters.js,
// components/characterSelector.js, store/persistence.js, and ui.js's render
// functions are all mocked — their job here is "were you called with the
// right thing", not logic this module owns. state.js and
// compute/attributes.js (via the DOM fixture) are real, since
// runEngine()'s own contract is defined in terms of what it reads from them.
// shared/openState.js is also real (spied-but-passthrough) specifically to
// verify the snapshot → renderLists → restore call ORDER for real.
jest.mock("dev/public/js/api.js", () => ({ buildSheet: jest.fn() }));
jest.mock("dev/public/js/store/characters.js", () => ({
  saveActiveCharacter: jest.fn(),
}));
jest.mock("dev/public/js/components/characterSelector.js", () => ({
  updateSelectorButton: jest.fn(),
}));
jest.mock("dev/public/js/store/persistence.js", () => ({
  showToast: jest.fn(),
}));
jest.mock("dev/public/js/ui.js", () => ({
  renderOutput: jest.fn(),
  renderLists: jest.fn(),
  updateInventoryUI: jest.fn(),
  renderSecondaryAttributes: jest.fn(),
  renderDamage: jest.fn(),
  renderElementalResistances: jest.fn(),
  renderResume: jest.fn(),
  syncViewMode: jest.fn(),
}));

import { buildSheet } from "dev/public/js/api.js";
import { saveActiveCharacter } from "dev/public/js/store/characters.js";
import { updateSelectorButton } from "dev/public/js/components/characterSelector.js";
import { showToast } from "dev/public/js/store/persistence.js";
import {
  renderOutput,
  renderLists,
  updateInventoryUI,
  renderSecondaryAttributes,
  renderDamage,
  renderElementalResistances,
  renderResume,
  syncViewMode,
} from "dev/public/js/ui.js";
import { state } from "dev/public/js/state.js";
import { runEngine } from "dev/public/js/compute/index.js";
import * as openStateModule from "dev/public/js/shared/openState.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const selected = state.selected;

let callOrder;
const realSnapshotAll = openStateModule.snapshotAll;
const realRestoreAll = openStateModule.restoreAll;

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();
  callOrder = [];

  jest.spyOn(openStateModule, "snapshotAll").mockImplementation((...args) => {
    callOrder.push("snapshotAll");
    return realSnapshotAll(...args);
  });
  jest.spyOn(openStateModule, "restoreAll").mockImplementation((...args) => {
    callOrder.push("restoreAll");
    return realRestoreAll(...args);
  });
  renderLists.mockImplementation(() => callOrder.push("renderLists"));

  buildSheet.mockResolvedValue(makeJson());
});

afterEach(() => {
  jest.restoreAllMocks();
});

function makeJson(overrides = {}) {
  return {
    character: {
      secondary_attributes: {},
      base_damage: {},
      character_points: {},
    },
    pc: {},
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Payload construction
// ─────────────────────────────────────────────────────────────────────────
describe("buildSheet payload — pc", () => {
  test("defaults every pc field when selected.character is blank", async () => {
    await runEngine();

    const { pc } = buildSheet.mock.calls[0][0];
    expect(pc).toEqual({
      player_name: "",
      character_name: "",
      character_sex: "",
      character_age: null,
      character_weight: null,
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

  test("carries through set pc fields", async () => {
    selected.character.player_name = "Player One";
    selected.character.character_name = "Aria";
    selected.character.character_age = 27;

    await runEngine();

    const { pc } = buildSheet.mock.calls[0][0];
    expect(pc.player_name).toBe("Player One");
    expect(pc.character_name).toBe("Aria");
    expect(pc.character_age).toBe(27);
  });
});

describe("buildSheet payload — race", () => {
  test("is an empty object when race_id is unset", async () => {
    await runEngine();
    expect(buildSheet.mock.calls[0][0].race).toEqual({});
  });

  test("is an empty object when race_id doesn't match any loaded race", async () => {
    selected.character.race_id = "GHOST";
    state.data.races = [{ race_id: "R1", race_name: "Elfo" }];

    await runEngine();

    expect(buildSheet.mock.calls[0][0].race).toEqual({});
  });

  test("resolves the full race row, coercing modifiers to numbers", async () => {
    selected.character.race_id = "R1";
    state.data.races = [
      {
        race_id: "R1",
        race_name: "Elfo",
        race_sub_name: "Elfo Silvestre",
        race_st_modifier: "-1",
        race_dx_modifier: "2",
        race_iq_modifier: "",
        race_ht_modifier: "0",
        race_innate_advantage_id: "ADV-001, ADV-002",
        race_innate_advantage_name: "Visão Noturna, Ágil",
      },
    ];

    await runEngine();

    const { race } = buildSheet.mock.calls[0][0];
    expect(race.race_id).toBe("R1");
    expect(race.race_sub_name).toBe("Elfo Silvestre");
    expect(race.modifiers).toEqual({ ST: -1, DX: 2, IQ: 0, HT: 0 });
    expect(race.innate_advantage_ids).toEqual(["ADV-001", "ADV-002"]);
    expect(race.innate_advantage_names).toEqual(["Visão Noturna", "Ágil"]);
    expect(race.innate_disadvantage_ids).toEqual([]);
  });

  test("resolves elemental_modifiers, defaulting blank/missing/non-numeric cells to 1 while preserving a literal 0", async () => {
    selected.character.race_id = "R1";
    state.data.races = [
      {
        race_id: "R1",
        race_name: "Elfo",
        race_fire_damage_multiplier: "0.5",
        race_water_damage_multiplier: "",
        race_earth_damage_multiplier: "1",
        // race_air_damage_multiplier intentionally absent
        race_electricity_damage_multiplier: "not-a-number",
        // A literal 0 ("immune") must survive, not collapse to the 1
        // default — this is the case a naive `Number(x) || 1` gets wrong.
        race_corrossion_damage_multiplier: "0",
        race_necrotic_damage_multiplier: "2",
        race_holy_damage_multiplier: "1",
        race_void_damage_multiplier: "1",
        race_arcane_damage_multiplier: "1.5",
      },
    ];

    await runEngine();

    const { race } = buildSheet.mock.calls[0][0];
    expect(race.elemental_modifiers).toEqual({
      Fire: 0.5,
      Water: 1,
      Earth: 1,
      Air: 1,
      Electricity: 1,
      Corrosion: 0,
      Necrotic: 2,
      Holy: 1,
      Void: 1,
      Arcane: 1.5,
    });
  });
});

describe("buildSheet payload — character", () => {
  test("advantages/disadvantages are the selected keys", async () => {
    selected.advantages = { "ADV-001": { level: 2 }, "ADV-002": {} };
    selected.disadvantages = { "DIS-001": {} };

    await runEngine();

    const { character } = buildSheet.mock.calls[0][0];
    expect(character.advantages).toEqual(["ADV-001", "ADV-002"]);
    expect(character.disadvantages).toEqual(["DIS-001"]);
  });

  test("primaryAttributes reflects the DOM inputs", async () => {
    document.getElementById("ST_base").value = "14";
    document.getElementById("ST_mod").value = "1";

    await runEngine();

    const { character } = buildSheet.mock.calls[0][0];
    expect(character.primaryAttributes.ST).toEqual({
      base_value: 14,
      modifier: 1,
    });
  });

  test("secondaryAttributes.damage coerces modifiers to numbers, defaulting invalid to 0", async () => {
    selected.damage = { swing: { modifier: "2" }, thrust: { modifier: "x" } };

    await runEngine();

    const { character } = buildSheet.mock.calls[0][0];
    expect(character.secondaryAttributes.damage).toEqual({
      swing: { modifier: 2 },
      thrust: { modifier: 0 },
    });
  });

  test("secondaryAttributes.elementalResistances coerces modifiers to numbers, defaulting invalid to 0", async () => {
    selected.resistances = {
      Fire: { modifier: "-0.5" },
      Arcane: { modifier: "x" },
    };

    await runEngine();

    const { character } = buildSheet.mock.calls[0][0];
    expect(character.secondaryAttributes.elementalResistances).toEqual({
      Fire: { modifier: -0.5 },
      Arcane: { modifier: 0 },
    });
  });

  test("skills map base_value (falling back to base), modifier, and isTrainedWithMaster", async () => {
    selected.skills = {
      "SK-001": { base_value: 12, modifier: 2, isTrainedWithMaster: true },
      "SK-002": { base: 10 },
    };

    await runEngine();

    const { character } = buildSheet.mock.calls[0][0];
    expect(character.skills).toEqual([
      {
        skill_id: "SK-001",
        base_value: 12,
        modifier: 2,
        isTrainedWithMaster: true,
      },
      {
        skill_id: "SK-002",
        base_value: 10,
        modifier: 0,
        isTrainedWithMaster: false,
      },
    ]);
  });

  test("spells pass through as-is", async () => {
    selected.spells = { "SP-001": { points: 3 } };
    await runEngine();
    expect(buildSheet.mock.calls[0][0].character.spells).toEqual({
      "SP-001": { points: 3 },
    });
  });
});

describe("buildSheet payload — inventory", () => {
  test("weight comes from the DOM #weight input", async () => {
    document.getElementById("weight").value = "23.5";
    await runEngine();
    expect(buildSheet.mock.calls[0][0].inventory.weight).toBe(23.5);
  });

  test("each selected.* array maps to its differently-named inventory.* key", async () => {
    selected.armors = [{ instance_id: "armor-inst-1" }];
    selected.shields = [{ instance_id: "shield-inst-1" }];
    selected.melee_weapons = [{ instance_id: "melee-inst-1" }];
    selected.ranged_weapons = [{ instance_id: "ranged-inst-1" }];
    selected.firearms = [{ instance_id: "firearm-inst-1" }];
    selected.ammo_containers = [{ instance_id: "ammo-cont-inst-1" }];
    selected.loose_ammo = [{ instance_id: "loose-ammo-inst-1" }];
    selected.alchemy = [{ instance_id: "alchemy-inst-1" }];
    selected.survivalGear = [{ instance_id: "sg-1" }];
    selected.accessories = [{ instance_id: "accessory-inst-1" }];
    selected.magicGear = [{ instance_id: "magic-gear-inst-1" }];
    selected.customInventory = [{ instance_id: "custom-1" }];
    selected.coins = [{ type: "gold", amount: 5 }];

    await runEngine();

    const { inventory } = buildSheet.mock.calls[0][0];
    expect(inventory.armor).toBe(selected.armors);
    expect(inventory.shield).toBe(selected.shields);
    expect(inventory.melee).toBe(selected.melee_weapons);
    expect(inventory.ranged).toBe(selected.ranged_weapons);
    expect(inventory.firearms).toBe(selected.firearms);
    expect(inventory.ammo_containers).toBe(selected.ammo_containers);
    expect(inventory.loose_ammo).toBe(selected.loose_ammo);
    expect(inventory.alchemy).toBe(selected.alchemy);
    expect(inventory.survival_gear).toBe(selected.survivalGear);
    expect(inventory.accessories).toBe(selected.accessories);
    expect(inventory.magic_gear).toBe(selected.magicGear);
    expect(inventory.custom_inventory).toBe(selected.customInventory);
    expect(inventory.coins).toBe(selected.coins);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Syncing secondary attributes / damage back onto state.selected
// ─────────────────────────────────────────────────────────────────────────
describe("syncing engine output back onto state.selected", () => {
  test("adds a secondary attribute entry that wasn't already selected", async () => {
    buildSheet.mockResolvedValue(
      makeJson({
        character: {
          secondary_attributes: { will: { bought: 2, modifier: 1 } },
          base_damage: {},
          character_points: {},
        },
      }),
    );

    await runEngine();

    expect(selected.secondary.will).toEqual({ bought: 2, modifier: 1 });
  });

  test("does not overwrite a secondary attribute that's already selected", async () => {
    selected.secondary.will = { bought: 9, modifier: 9 };
    buildSheet.mockResolvedValue(
      makeJson({
        character: {
          secondary_attributes: { will: { bought: 2, modifier: 1 } },
          base_damage: {},
          character_points: {},
        },
      }),
    );

    await runEngine();

    expect(selected.secondary.will).toEqual({ bought: 9, modifier: 9 });
  });

  test("adds a damage entry that wasn't already selected", async () => {
    buildSheet.mockResolvedValue(
      makeJson({
        character: {
          secondary_attributes: {},
          base_damage: { swing: { modifier: 3 } },
          character_points: {},
        },
      }),
    );

    await runEngine();

    expect(selected.damage.swing).toEqual({ modifier: 3 });
  });

  test("does not overwrite a damage entry that's already selected", async () => {
    selected.damage.swing = { modifier: 99 };
    buildSheet.mockResolvedValue(
      makeJson({
        character: {
          secondary_attributes: {},
          base_damage: { swing: { modifier: 3 } },
          character_points: {},
        },
      }),
    );

    await runEngine();

    expect(selected.damage.swing).toEqual({ modifier: 99 });
  });

  test("adds an elemental resistance entry that wasn't already selected", async () => {
    buildSheet.mockResolvedValue(
      makeJson({
        character: {
          secondary_attributes: {},
          base_damage: {},
          elemental_resistances: { Fire: { modifier: -0.2 } },
          character_points: {},
        },
      }),
    );

    await runEngine();

    expect(selected.resistances.Fire).toEqual({ modifier: -0.2 });
  });

  test("does not overwrite an elemental resistance entry that's already selected", async () => {
    selected.resistances.Fire = { modifier: 99 };
    buildSheet.mockResolvedValue(
      makeJson({
        character: {
          secondary_attributes: {},
          base_damage: {},
          elemental_resistances: { Fire: { modifier: -0.2 } },
          character_points: {},
        },
      }),
    );

    await runEngine();

    expect(selected.resistances.Fire).toEqual({ modifier: 99 });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Render orchestration
// ─────────────────────────────────────────────────────────────────────────
describe("render orchestration", () => {
  test("calls every render function with the engine's output", async () => {
    const json = makeJson();
    buildSheet.mockResolvedValue(json);

    await runEngine();

    expect(renderOutput).toHaveBeenCalledWith(json);
    expect(updateInventoryUI).toHaveBeenCalledWith(json);
    expect(renderSecondaryAttributes).toHaveBeenCalledWith(json);
    expect(renderDamage).toHaveBeenCalledWith(json);
    expect(renderElementalResistances).toHaveBeenCalledWith(json);
    expect(renderResume).toHaveBeenCalledWith(json, state.data, state.selected);
    expect(syncViewMode).toHaveBeenCalledTimes(1);
    expect(state.sheet).toBe(json);
  });

  // NOTE: the file's top-of-module comment says runEngine "intentionally
  // does NOT call renderLists()". That comment is stale — the code below it
  // calls renderLists() directly, wrapped in snapshotAll()/restoreAll() with
  // its own (accurate) explanation of why the restore happens synchronously
  // rather than on a later frame. This test locks in the ACTUAL behavior;
  // flagged to r4ven separately rather than "fixed" here.
  test("calls renderLists once, wrapped by a synchronous snapshotAll → restoreAll pair", async () => {
    await runEngine();

    expect(renderLists).toHaveBeenCalledWith(selected, state.data, state.sheet);
    expect(callOrder).toEqual(["snapshotAll", "renderLists", "restoreAll"]);
  });

  test("persists the character and refreshes the selector after a successful run", async () => {
    await runEngine();
    expect(saveActiveCharacter).toHaveBeenCalledTimes(1);
    expect(updateSelectorButton).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Insufficient points warning
// ─────────────────────────────────────────────────────────────────────────
describe("insufficient points warning", () => {
  function jsonWithPoints(cp, pc) {
    return makeJson({
      character: {
        secondary_attributes: {},
        base_damage: {},
        character_points: cp,
      },
      pc,
    });
  }

  test("shows no toast when neither starting_points nor experience_points is set", async () => {
    buildSheet.mockResolvedValue(jsonWithPoints({ advantages: 999 }, {}));
    await runEngine();
    expect(showToast).not.toHaveBeenCalled();
  });

  test("shows no toast when total spent is within the available budget", async () => {
    buildSheet.mockResolvedValue(
      jsonWithPoints(
        { primary_attributes: 20, advantages: 10 },
        { starting_points: 100 },
      ),
    );
    await runEngine();
    expect(showToast).not.toHaveBeenCalled();
  });

  test("shows an error toast when total spent exceeds the available budget", async () => {
    buildSheet.mockResolvedValue(
      jsonWithPoints(
        { primary_attributes: 80, advantages: 40 },
        { starting_points: 100 },
      ),
    );
    await runEngine();
    expect(showToast).toHaveBeenCalledWith(expect.any(String), "error");
  });

  test("available budget sums starting_points and experience_points when both are set", async () => {
    buildSheet.mockResolvedValue(
      jsonWithPoints(
        { primary_attributes: 120 },
        { starting_points: 100, experience_points: 30 },
      ),
    );
    await runEngine();
    expect(showToast).not.toHaveBeenCalled(); // 120 <= 100 + 30
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────────────────
describe("error handling", () => {
  test("renders the error and skips every other render/persist step when buildSheet rejects", async () => {
    buildSheet.mockRejectedValue(new Error("network exploded"));

    await runEngine();

    expect(renderOutput).toHaveBeenCalledWith({ error: "network exploded" });
    expect(updateInventoryUI).not.toHaveBeenCalled();
    expect(renderLists).not.toHaveBeenCalled();
    expect(saveActiveCharacter).not.toHaveBeenCalled();
    expect(updateSelectorButton).not.toHaveBeenCalled();
    expect(state.sheet).toBeUndefined();
  });

  test("does not throw out of runEngine when buildSheet rejects", async () => {
    buildSheet.mockRejectedValue(new Error("boom"));
    await expect(runEngine()).resolves.toBeUndefined();
  });
});
