// bindUI() dispatches via a hard-coded if-chain, not shared/eventDispatch.js's registry (production hasn't adopted that yet) — tests wiring only.

jest.mock("dev/public/js/shared/dom.js", () => ({
  on: jest.fn(),
}));
jest.mock("dev/public/js/compute/index.js", () => ({
  runEngine: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/index.js", () => ({
  filterSubRacesByName: jest.fn(),
  selectSubRace: jest.fn(),
  handleCharacterInput: jest.fn(() => false),
  handleCharacterChange: jest.fn(() => false),
  handleCharacterImageClick: jest.fn(() => false),
  handleCharacterImageChange: jest.fn(() => false),
  handleCharacterImageInput: jest.fn(() => false),
  addAdv: jest.fn(),
  filterAdvByType: jest.fn(),
  addDis: jest.fn(),
  filterDisByType: jest.fn(),
  addSkill: jest.fn(),
  filterSkillsByCategory: jest.fn(),
  handleTraitClick: jest.fn(() => false),
  handleTraitInput: jest.fn(() => false),
  handleSkillClick: jest.fn(() => false),
  handleSkillChange: jest.fn(() => false),
  handleSkillInput: jest.fn(() => false),
}));
jest.mock("dev/public/js/engine/magic/index.js", () => ({
  addSpell: jest.fn(),
  filterSpellsBySchool: jest.fn(),
  handleSpellClick: jest.fn(() => false),
  handleSpellInput: jest.fn(() => false),
}));
jest.mock("dev/public/js/engine/inventory/armor/index.js", () => ({
  updateArmorNameOptions: jest.fn(),
  updateArmorTierOptions: jest.fn(),
  handleArmorClick: jest.fn(() => false),
  handleArmorInput: jest.fn(() => false),
  handleArmorChange: jest.fn(() => false),
  handleAddArmor: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/shield/index.js", () => ({
  updateShieldTierOptions: jest.fn(),
  handleShieldClick: jest.fn(() => false),
  handleShieldInput: jest.fn(() => false),
  handleShieldChange: jest.fn(() => false),
  handleAddShield: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/melee/index.js", () => ({
  updateMeleeTierOptions: jest.fn(),
  updateMeleeTypeOptions: jest.fn(),
  handleMeleeClick: jest.fn(() => false),
  handleMeleeInput: jest.fn(() => false),
  handleMeleeChange: jest.fn(() => false),
  handleAddMelee: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/ranged/index.js", () => ({
  updateRangedTierOptions: jest.fn(),
  updateRangedTypeOptions: jest.fn(),
  handleRangedClick: jest.fn(() => false),
  handleRangedInput: jest.fn(() => false),
  handleRangedChange: jest.fn(() => false),
  handleAddRanged: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/firearms/index.js", () => ({
  updateFirearmTierOptions: jest.fn(),
  updateFirearmTypeOptions: jest.fn(),
  handleFirearmClick: jest.fn(() => false),
  handleFirearmInput: jest.fn(() => false),
  handleFirearmChange: jest.fn(() => false),
  handleAddFirearm: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/ammo/index.js", () => ({
  updateLooseAmmoOptions: jest.fn(),
  updateContainerTypeOptions: jest.fn(),
  handleAmmoClick: jest.fn(() => false),
  handleAmmoInput: jest.fn(() => false),
  handleAmmoChange: jest.fn(() => false),
  handleAddContainer: jest.fn(),
  handleAddLooseAmmo: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/alchemy/index.js", () => ({
  updateAlchemyTypeOptions: jest.fn(),
  updateAlchemyTierOptions: jest.fn(),
  handleAlchemyClick: jest.fn(() => false),
  handleAlchemyInput: jest.fn(() => false),
  handleAlchemyChange: jest.fn(() => false),
  handleAddAlchemy: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/survivalGear/index.js", () => ({
  handleSurvivalGearClick: jest.fn(() => false),
  handleSurvivalGearInput: jest.fn(() => false),
  handleSurvivalGearChange: jest.fn(() => false),
  handleAddSurvivalGear: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/accessories/index.js", () => ({
  handleAccessoryClick: jest.fn(() => false),
  handleAccessoryInput: jest.fn(() => false),
  handleAccessoryChange: jest.fn(() => false),
  handleAddAccessory: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/magicGear/index.js", () => ({
  updateMagicGearTypeOptions: jest.fn(),
  handleMagicGearClick: jest.fn(() => false),
  handleMagicGearInput: jest.fn(() => false),
  handleMagicGearChange: jest.fn(() => false),
  handleAddMagicGear: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/customInventory/index.js", () => ({
  handleCustomInventoryClick: jest.fn(() => false),
  handleCustomInventoryInput: jest.fn(() => false),
  handleCustomInventoryChange: jest.fn(() => false),
  handleAddCustomItem: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/coinPurse/index.js", () => ({
  handleCoinPurseClick: jest.fn(() => false),
  handleCoinPurseInput: jest.fn(() => false),
  handleCoinPurseChange: jest.fn(() => false),
}));

import { on } from "dev/public/js/shared/dom.js";
import { runEngine } from "dev/public/js/compute/index.js";
import * as character from "dev/public/js/engine/character/index.js";
import * as magic from "dev/public/js/engine/magic/index.js";
import * as armor from "dev/public/js/engine/inventory/armor/index.js";
import * as shield from "dev/public/js/engine/inventory/shield/index.js";
import * as melee from "dev/public/js/engine/inventory/melee/index.js";
import * as ranged from "dev/public/js/engine/inventory/ranged/index.js";
import * as firearms from "dev/public/js/engine/inventory/firearms/index.js";
import * as ammo from "dev/public/js/engine/inventory/ammo/index.js";
import * as alchemy from "dev/public/js/engine/inventory/alchemy/index.js";
import * as survivalGear from "dev/public/js/engine/inventory/survivalGear/index.js";
import * as accessories from "dev/public/js/engine/inventory/accessories/index.js";
import * as magicGear from "dev/public/js/engine/inventory/magicGear/index.js";
import * as customInventory from "dev/public/js/engine/inventory/customInventory/index.js";
import * as coinPurse from "dev/public/js/engine/inventory/coinPurse/index.js";
import { bindUI } from "dev/public/js/events/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

// jsdom gives one `document` per test FILE, so bindUI() runs once here (in
// beforeAll), mirroring bootstrap — calling it per-test would stack listeners.
let onCallsSnapshot;

beforeAll(() => {
  bindUI();
  // Snapshotted because later jest.clearAllMocks() calls would wipe on()'s call record too.
  onCallsSnapshot = [...on.mock.calls];
});

beforeEach(() => {
  resetDOM("<div></div>");
  jest.clearAllMocks();
});

describe("bindUI — individual element bindings", () => {
  test.each([
    ["raceNameSelect", "change", () => character.filterSubRacesByName],
    ["raceSubSelect", "change", () => character.selectSubRace],
    ["advTypeSelect", "change", () => character.filterAdvByType],
    ["addAdvBtn", "click", () => character.addAdv],
    ["disTypeSelect", "change", () => character.filterDisByType],
    ["addDisBtn", "click", () => character.addDis],
    ["skillCategorySelect", "change", () => character.filterSkillsByCategory],
    ["addSkillBtn", "click", () => character.addSkill],
    ["spellSchoolSelect", "change", () => magic.filterSpellsBySchool],
    ["addSpellBtn", "click", () => magic.addSpell],
    ["armorSlotSelect", "change", () => armor.updateArmorNameOptions],
    ["armorNameSelect", "change", () => armor.updateArmorTierOptions],
    ["addArmorBtn", "click", () => armor.handleAddArmor],
    ["shieldNameSelect", "change", () => shield.updateShieldTierOptions],
    ["addShieldBtn", "click", () => shield.handleAddShield],
    ["meleeTypeFilter", "change", () => melee.updateMeleeTypeOptions],
    ["meleeNameSelect", "change", () => melee.updateMeleeTierOptions],
    ["addMeleeBtn", "click", () => melee.handleAddMelee],
    ["rangedTypeFilter", "change", () => ranged.updateRangedTypeOptions],
    ["rangedNameSelect", "change", () => ranged.updateRangedTierOptions],
    ["addRangedBtn", "click", () => ranged.handleAddRanged],
    ["firearmTypeFilter", "change", () => firearms.updateFirearmTypeOptions],
    ["firearmNameSelect", "change", () => firearms.updateFirearmTierOptions],
    ["addFirearmBtn", "click", () => firearms.handleAddFirearm],
    [
      "ammoContainerTypeFilter",
      "change",
      () => ammo.updateContainerTypeOptions,
    ],
    ["looseAmmoTypeFilter", "change", () => ammo.updateLooseAmmoOptions],
    ["addAmmoContainerBtn", "click", () => ammo.handleAddContainer],
    ["addLooseAmmoBtn", "click", () => ammo.handleAddLooseAmmo],
    ["alchemyTypeFilter", "change", () => alchemy.updateAlchemyTypeOptions],
    ["alchemyNameSelect", "change", () => alchemy.updateAlchemyTierOptions],
    ["addAlchemyBtn", "click", () => alchemy.handleAddAlchemy],
    [
      "survivalGearTypeFilter",
      "change",
      () => survivalGear.handleSurvivalGearChange,
    ],
    ["addSurvivalGearBtn", "click", () => survivalGear.handleAddSurvivalGear],
    ["addAccessoryBtn", "click", () => accessories.handleAddAccessory],
    [
      "magicGearTypeFilter",
      "change",
      () => magicGear.updateMagicGearTypeOptions,
    ],
    ["addMagicGearBtn", "click", () => magicGear.handleAddMagicGear],
    ["addCustomItemBtn", "click", () => customInventory.handleAddCustomItem],
    ["runEngineBtn", "click", () => runEngine],
  ])("binds #%s's %s event to the correct handler", (id, event, getHandler) => {
    expect(onCallsSnapshot).toContainEqual([id, event, getHandler()]);
  });

  test("advSelect and disSelect are bound to a change no-op (kept reactive, no handler logic)", () => {
    const advCall = onCallsSnapshot.find(
      (call) => call[0] === "advSelect" && call[1] === "change",
    );
    const disCall = onCallsSnapshot.find(
      (call) => call[0] === "disSelect" && call[1] === "change",
    );
    expect(advCall).toBeDefined();
    expect(disCall).toBeDefined();
    expect(typeof advCall[2]).toBe("function");
    expect(typeof disCall[2]).toBe("function");
  });
});

const CLICK_CHAIN_HANDLERS = [
  character.handleTraitClick,
  character.handleSkillClick,
  magic.handleSpellClick,
  armor.handleArmorClick,
  shield.handleShieldClick,
  melee.handleMeleeClick,
  ranged.handleRangedClick,
  firearms.handleFirearmClick,
  ammo.handleAmmoClick,
  alchemy.handleAlchemyClick,
  survivalGear.handleSurvivalGearClick,
  accessories.handleAccessoryClick,
  magicGear.handleMagicGearClick,
  customInventory.handleCustomInventoryClick,
  coinPurse.handleCoinPurseClick,
  character.handleCharacterImageClick,
];

describe("bindUI — delegated click chain", () => {
  beforeEach(() => {
    // jest.clearAllMocks() resets call counts but not a prior mockReturnValue(true).
    CLICK_CHAIN_HANDLERS.forEach((fn) => fn.mockReturnValue(false));
  });

  test("the first handler in the chain (handleTraitClick) is tried first — returning true stops everything after it", () => {
    character.handleTraitClick.mockReturnValue(true);

    document.body.click();

    expect(character.handleTraitClick).toHaveBeenCalledTimes(1);
    expect(character.handleSkillClick).not.toHaveBeenCalled();
    expect(magic.handleSpellClick).not.toHaveBeenCalled();
  });

  test("when an earlier handler returns false, the chain falls through to the next one", () => {
    character.handleTraitClick.mockReturnValue(false);
    character.handleSkillClick.mockReturnValue(true);

    document.body.click();

    expect(character.handleTraitClick).toHaveBeenCalledTimes(1);
    expect(character.handleSkillClick).toHaveBeenCalledTimes(1);
    expect(magic.handleSpellClick).not.toHaveBeenCalled();
  });

  test("the last handler in the chain (handleCharacterImageClick) still fires when every earlier handler returns false", () => {
    document.body.click();

    expect(character.handleCharacterImageClick).toHaveBeenCalledTimes(1);
  });

  test("a click that no handler claims does not throw", () => {
    expect(() => document.body.click()).not.toThrow();
  });
});

const INPUT_CHAIN_HANDLERS = [
  character.handleCharacterInput,
  character.handleTraitInput,
  character.handleSkillInput,
  magic.handleSpellInput,
  armor.handleArmorInput,
  shield.handleShieldInput,
  melee.handleMeleeInput,
  ranged.handleRangedInput,
  firearms.handleFirearmInput,
  ammo.handleAmmoInput,
  alchemy.handleAlchemyInput,
  survivalGear.handleSurvivalGearInput,
  accessories.handleAccessoryInput,
  magicGear.handleMagicGearInput,
  customInventory.handleCustomInventoryInput,
  coinPurse.handleCoinPurseInput,
  character.handleCharacterImageInput,
];

describe("bindUI — delegated input chain", () => {
  beforeEach(() => {
    INPUT_CHAIN_HANDLERS.forEach((fn) => fn.mockReturnValue(false));
  });

  function fireInput() {
    document.body.dispatchEvent(new Event("input", { bubbles: true }));
  }

  test("the first handler in the chain (handleCharacterInput) is tried first — returning true stops everything after it", () => {
    character.handleCharacterInput.mockReturnValue(true);

    fireInput();

    expect(character.handleCharacterInput).toHaveBeenCalledTimes(1);
    expect(character.handleTraitInput).not.toHaveBeenCalled();
  });

  test("when an earlier handler returns false, the chain falls through to the next one", () => {
    character.handleCharacterInput.mockReturnValue(false);
    character.handleTraitInput.mockReturnValue(true);

    fireInput();

    expect(character.handleTraitInput).toHaveBeenCalledTimes(1);
    expect(character.handleSkillInput).not.toHaveBeenCalled();
  });

  test("the last handler in the chain (handleCharacterImageInput) still fires when every earlier handler returns false", () => {
    fireInput();

    expect(character.handleCharacterImageInput).toHaveBeenCalledTimes(1);
  });

  test("an input event that no handler claims does not throw", () => {
    expect(() => fireInput()).not.toThrow();
  });
});

const CHANGE_CHAIN_HANDLERS = [
  character.handleSkillChange,
  character.handleCharacterChange,
  armor.handleArmorChange,
  shield.handleShieldChange,
  melee.handleMeleeChange,
  ranged.handleRangedChange,
  firearms.handleFirearmChange,
  ammo.handleAmmoChange,
  alchemy.handleAlchemyChange,
  survivalGear.handleSurvivalGearChange,
  accessories.handleAccessoryChange,
  magicGear.handleMagicGearChange,
  customInventory.handleCustomInventoryChange,
  coinPurse.handleCoinPurseChange,
  character.handleCharacterImageChange,
];

describe("bindUI — delegated change chain", () => {
  beforeEach(() => {
    CHANGE_CHAIN_HANDLERS.forEach((fn) => fn.mockReturnValue(false));
  });

  function fireChange() {
    document.body.dispatchEvent(new Event("change", { bubbles: true }));
  }

  test("the first handler in the chain (handleSkillChange) is tried first — returning true stops everything after it", () => {
    character.handleSkillChange.mockReturnValue(true);

    fireChange();

    expect(character.handleSkillChange).toHaveBeenCalledTimes(1);
    expect(character.handleCharacterChange).not.toHaveBeenCalled();
  });

  test("when an earlier handler returns false, the chain falls through to the next one", () => {
    character.handleSkillChange.mockReturnValue(false);
    character.handleCharacterChange.mockReturnValue(true);

    fireChange();

    expect(character.handleCharacterChange).toHaveBeenCalledTimes(1);
    expect(armor.handleArmorChange).not.toHaveBeenCalled();
  });

  test("the last handler in the chain (handleCharacterImageChange) still fires when every earlier handler returns false", () => {
    fireChange();

    expect(character.handleCharacterImageChange).toHaveBeenCalledTimes(1);
  });

  test("a change event that no handler claims does not throw", () => {
    expect(() => fireChange()).not.toThrow();
  });
});

// Stepper buttons are the real implementation, not a dispatch to another module.
describe("bindUI — stepper ± buttons", () => {
  // Relies on the single beforeAll() bindUI() call plus event delegation
  // (closest(".stepper-btn")) — no per-test re-attachment needed.

  function stepperFixture({ value = "5", step, min, max } = {}) {
    resetDOM(`
      <div class="num-stepper">
        <input
          class="qty-input"
          value="${value}"
          ${step !== undefined ? `data-step="${step}"` : ""}
          ${min !== undefined ? `data-min="${min}"` : ""}
          ${max !== undefined ? `data-max="${max}"` : ""}
        />
        <div class="stepper-btns">
          <button class="stepper-btn stepper-inc">+</button>
          <button class="stepper-btn stepper-dec">−</button>
        </div>
      </div>
    `);
  }

  test("clicking the increment button adds the step to the current value", () => {
    stepperFixture({ value: "5", step: "2" });

    document.querySelector(".stepper-inc").click();

    expect(document.querySelector(".qty-input").value).toBe("7");
  });

  test("clicking the decrement button subtracts the step from the current value", () => {
    stepperFixture({ value: "5", step: "2" });

    document.querySelector(".stepper-dec").click();

    expect(document.querySelector(".qty-input").value).toBe("3");
  });

  test("defaults the step to 1 when no data-step (or input.step) is present", () => {
    stepperFixture({ value: "5" });

    document.querySelector(".stepper-inc").click();

    expect(document.querySelector(".qty-input").value).toBe("6");
  });

  test("treats a non-numeric current value as 0 before applying the step", () => {
    resetDOM(`
      <div class="num-stepper">
        <input class="qty-input" value="" data-step="3" />
        <div class="stepper-btns">
          <button class="stepper-btn stepper-inc">+</button>
        </div>
      </div>
    `);

    document.querySelector(".stepper-inc").click();

    expect(document.querySelector(".qty-input").value).toBe("3");
  });

  test("clamps the result to data-min when decrementing below it", () => {
    stepperFixture({ value: "2", step: "5", min: "0" });

    document.querySelector(".stepper-dec").click();

    expect(document.querySelector(".qty-input").value).toBe("0");
  });

  test("clamps the result to data-max when incrementing above it", () => {
    stepperFixture({ value: "9", step: "5", max: "10" });

    document.querySelector(".stepper-inc").click();

    expect(document.querySelector(".qty-input").value).toBe("10");
  });

  test("with no data-min/data-max present, the value is never clamped", () => {
    stepperFixture({ value: "1000", step: "1000" });

    document.querySelector(".stepper-inc").click();

    expect(document.querySelector(".qty-input").value).toBe("2000");
  });

  test("dispatches a real 'input' event on the field after updating its value, so model listeners react", () => {
    stepperFixture({ value: "5", step: "1" });
    const input = document.querySelector(".qty-input");
    const inputListener = jest.fn();
    input.addEventListener("input", inputListener);

    document.querySelector(".stepper-inc").click();

    expect(inputListener).toHaveBeenCalledTimes(1);
  });

  test("clicking outside any .stepper-btn does nothing and does not throw", () => {
    stepperFixture({ value: "5" });

    expect(() => document.querySelector(".num-stepper").click()).not.toThrow();
    expect(document.querySelector(".qty-input").value).toBe("5");
  });

  test("a stepper button with no accompanying input in its .num-stepper does nothing and does not throw", () => {
    resetDOM(`
      <div class="num-stepper">
        <button class="stepper-btn stepper-inc">+</button>
      </div>
    `);

    expect(() => document.querySelector(".stepper-inc").click()).not.toThrow();
  });
});
