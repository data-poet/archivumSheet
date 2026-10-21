jest.mock("dev/public/js/api.js", () => ({
  buildSheet: jest.fn(),
  getLastServerTiming: jest.fn(() => null),
}));
jest.mock("dev/public/js/shared/toast.js", () => ({
  showToast: jest.fn(),
}));
jest.mock("dev/public/js/ui.js", () => ({
  renderOutput: jest.fn(),
  renderLists: jest.fn(),
  renderSecondaryAttributes: jest.fn(),
  renderDamage: jest.fn(),
  renderElementalResistances: jest.fn(),
  renderThresholds: jest.fn(),
  renderEditConditions: jest.fn(),
  renderResume: jest.fn(),
  syncViewMode: jest.fn(),
}));

import { buildSheet, getLastServerTiming } from "dev/public/js/api.js";
import { showToast } from "dev/public/js/shared/toast.js";
import {
  renderOutput,
  renderLists,
  renderSecondaryAttributes,
  renderDamage,
  renderElementalResistances,
  renderThresholds,
  renderEditConditions,
  renderResume,
  syncViewMode,
} from "dev/public/js/ui.js";
import { state } from "dev/public/js/state.js";
import { runEngine } from "dev/public/js/compute/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const selected = state.selected;

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();

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
      ability_points: null,
      magic_points: null,
      tier_label: "",
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

  // image can be several KB of base64 and the engine never reads it back — see pcPayload.js.
  test("never sends image, however it is set", async () => {
    selected.character.image = {
      uploaded: true,
      data: "data:image/png;base64,AAAA",
    };

    await runEngine();

    const { pc } = buildSheet.mock.calls[0][0];
    expect(pc.image).toBeUndefined();
  });
});

describe("buildSheet payload — race", () => {
  test("race_id is null when no race is selected", async () => {
    await runEngine();
    expect(buildSheet.mock.calls[0][0].race_id).toBeNull();
  });

  // The engine resolves the race from its dataset; the frontend only says which one.
  test("sends the selected race_id and no race object", async () => {
    selected.character.race_id = "R1";

    await runEngine();

    const payload = buildSheet.mock.calls[0][0];
    expect(payload.race_id).toBe("R1");
    expect(payload).not.toHaveProperty("race");
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

  test("conditions are the keys of the ones switched on", async () => {
    selected.conditions = { "atordoamento-fisico": true, "dor-grave": true };

    await runEngine();

    const { character } = buildSheet.mock.calls[0][0];
    expect(character.conditions).toEqual(["atordoamento-fisico", "dor-grave"]);
  });

  test("a flag the engine reports as unknown is dropped from the saved conditions, the rest are kept", async () => {
    selected.conditions = {
      "nao-existe": true,
      "dor-moderada": true,
      coma: true,
    };
    buildSheet.mockResolvedValue(
      makeJson({
        character: {
          secondary_attributes: {},
          base_damage: {},
          character_points: {},
          conditions: {
            dropped: [
              { key: "nao-existe", reason: "unknown" },
              { key: "dor-moderada", reason: "exclusive", kept: "dor-grave" },
            ],
          },
        },
      }),
    );

    await runEngine();

    expect(selected.conditions).toEqual({ "dor-moderada": true, coma: true });
  });

  test("leaves the conditions object alone when nothing is unknown", async () => {
    const flags = { coma: true };
    selected.conditions = flags;

    await runEngine();

    expect(selected.conditions).toBe(flags);
  });

  test("no conditions means an empty list, not a missing key", async () => {
    await runEngine();

    expect(buildSheet.mock.calls[0][0].character.conditions).toEqual([]);
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

describe("render orchestration", () => {
  test("calls every render function with the engine's output", async () => {
    const json = makeJson();
    buildSheet.mockResolvedValue(json);

    await runEngine();

    expect(renderOutput).toHaveBeenCalledWith(json);
    expect(renderSecondaryAttributes).toHaveBeenCalledWith(json);
    expect(renderDamage).toHaveBeenCalledWith(json);
    expect(renderElementalResistances).toHaveBeenCalledWith(json);
    expect(renderThresholds).toHaveBeenCalledWith(json);
    expect(renderEditConditions).toHaveBeenCalledWith(
      json,
      state.data,
      state.selected,
    );
    expect(renderResume).toHaveBeenCalledWith(json, state.data, state.selected);
    expect(syncViewMode).toHaveBeenCalledTimes(1);
    expect(state.sheet).toBe(json);
  });

  test("calls renderLists once with the sheet's selected/data/sheet", async () => {
    await runEngine();

    expect(renderLists).toHaveBeenCalledTimes(1);
    expect(renderLists).toHaveBeenCalledWith(selected, state.data, state.sheet);
  });
});

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
    expect(showToast).not.toHaveBeenCalled();
  });
});

describe("error handling", () => {
  test("renders the error and skips every other render step when buildSheet rejects", async () => {
    buildSheet.mockRejectedValue(new Error("network exploded"));

    await runEngine();

    expect(renderOutput).toHaveBeenCalledWith({ error: "network exploded" });
    expect(renderLists).not.toHaveBeenCalled();
    expect(state.sheet).toBeUndefined();
  });

  test("does not throw out of runEngine when buildSheet rejects", async () => {
    buildSheet.mockRejectedValue(new Error("boom"));
    await expect(runEngine()).resolves.toBeUndefined();
  });

  test("a superseded request's own abort is silent: no error render, no state write", async () => {
    const abortError = new DOMException(
      "The operation was aborted.",
      "AbortError",
    );
    buildSheet.mockRejectedValue(abortError);

    await runEngine();

    expect(renderOutput).not.toHaveBeenCalled();
    expect(state.sheet).toBeUndefined();
  });

  test("a stale response (isCurrent() false) is dropped: no render, no state write", async () => {
    await runEngine({ isCurrent: () => false });

    expect(renderOutput).not.toHaveBeenCalled();
    expect(renderLists).not.toHaveBeenCalled();
    expect(state.sheet).toBeUndefined();
  });

  test("a current response (isCurrent() true, or omitted) renders as usual", async () => {
    await runEngine({ isCurrent: () => true });

    expect(renderOutput).toHaveBeenCalledWith(makeJson());
  });
});

// Opt-in instrumentation that must stay inert for everyone who hasn't flipped the flag.
describe("timing (shared/timing.js's debugTiming flag)", () => {
  beforeEach(() => localStorage.clear());

  test("logs nothing when the flag is unset", async () => {
    const spy = jest.spyOn(console, "table").mockImplementation(() => {});
    await runEngine();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("logs a full breakdown when the flag is set", async () => {
    localStorage.setItem("archivum:debugTiming", "1");
    getLastServerTiming.mockReturnValue("build;dur=1.23");
    const spy = jest.spyOn(console, "table").mockImplementation(() => {});

    await runEngine();

    expect(spy).toHaveBeenCalledTimes(1);
    const entry = spy.mock.calls[0][0];
    expect(Object.keys(entry)).toEqual([
      "payloadBuildMs",
      "requestMs",
      "serverTiming",
      "renderMs",
      "listsMs",
      "totalMs",
      "requestBytes",
      "responseBytes",
    ]);
    expect(entry.serverTiming).toBe("build;dur=1.23");
    expect(entry.requestBytes).toBeGreaterThan(0);
    expect(entry.responseBytes).toBeGreaterThan(0);
    spy.mockRestore();
  });

  test("does not log when buildSheet rejects, even with the flag set", async () => {
    localStorage.setItem("archivum:debugTiming", "1");
    buildSheet.mockRejectedValue(new Error("boom"));
    const spy = jest.spyOn(console, "table").mockImplementation(() => {});

    await runEngine();

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
