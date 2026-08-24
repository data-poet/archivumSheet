jest.mock("dev/public/js/engine/inventory/magicGear/model.js", () => ({
  addEquippedMagicGear: jest.fn(),
  addStoredMagicGear: jest.fn(),
  equipMagicGear: jest.fn(),
  moveMagicGear: jest.fn(),
  removeMagicGear: jest.fn(),
  saveMagicGearCustomFields: jest.fn(),
  findMagicGearByInstanceId: jest.fn(() => ({ instance_id: "MG-1" })),
  updateMagicGearEquipOptionAvailability: jest.fn(),
  addMagicGearEnchantment: jest.fn(),
  updateMagicGearEnchantment: jest.fn(),
  removeMagicGearEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/magicGear/render.js", () => ({
  renderEquippedMagicGear: jest.fn(),
  renderStoredMagicGear: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/magicGear/model.js";
import * as render from "dev/public/js/engine/inventory/magicGear/render.js";
import {
  handleMagicGearClick,
  handleMagicGearInput,
  handleMagicGearChange,
  handleAddMagicGear,
} from "dev/public/js/engine/inventory/magicGear/events.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function elWithClass(tag, className, dataset = {}) {
  const el = document.createElement(tag);
  className.split(" ").forEach((c) => el.classList.add(c));
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  return el;
}

function selectWithValue(className, dataset, value) {
  const select = elWithClass("select", className, dataset);
  const option = document.createElement("option");
  option.value = value;
  select.appendChild(option);
  select.value = value;
  return select;
}

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();
  model.findMagicGearByInstanceId.mockReturnValue({ instance_id: "MG-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("handleMagicGearClick", () => {
  test("remove-magic-gear and remove-equipped-magic-gear both remove by instanceId", () => {
    const a = elWithClass("button", "remove-magic-gear", {
      instanceId: "MG-1",
    });
    expect(handleMagicGearClick({ target: a })).toBe(true);
    expect(model.removeMagicGear).toHaveBeenCalledWith("MG-1");

    const b = elWithClass("button", "remove-equipped-magic-gear", {
      instanceId: "MG-2",
    });
    handleMagicGearClick({ target: b });
    expect(model.removeMagicGear).toHaveBeenCalledWith("MG-2");
  });

  test("equip-stored-magic-gear equips by instanceId", () => {
    const target = elWithClass("button", "equip-stored-magic-gear", {
      instanceId: "MG-3",
    });
    expect(handleMagicGearClick({ target })).toBe(true);
    expect(model.equipMagicGear).toHaveBeenCalledWith("MG-3");
  });

  test("custom-fields save reads the real editor DOM (real shared dispatch integration)", () => {
    resetDOM(`
      <div class="custom-fields-block" data-instance-id="MG-1">
        <input class="custom-fields-input-name" value="Cajado" />
        <input class="custom-fields-input-description" value="Brilhante" />
        <input class="custom-fields-input-effect" value="+2 Magia" />
      </div>
    `);
    const target = elWithClass("button", "custom-fields-save-btn", {
      instanceId: "MG-1",
    });

    handleMagicGearClick({ target });
    jest.advanceTimersToNextFrame();

    expect(model.saveMagicGearCustomFields).toHaveBeenCalledWith("MG-1", {
      name: "Cajado",
      description: "Brilhante",
      effect: "+2 Magia",
    });
  });

  test("enchantment remove delegates to the shared dispatch factory", () => {
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "MG-1",
      entryInstanceId: "ENTRY-1",
    });

    const result = handleMagicGearClick({ target });
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(model.removeMagicGearEnchantment).toHaveBeenCalledWith(
      "MG-1",
      "ENTRY-1",
    );
  });

  test("ownership rejection blocks both custom-fields and enchantment buttons", () => {
    model.findMagicGearByInstanceId.mockReturnValue(undefined);

    const customFields = elWithClass("button", "custom-fields-edit-btn", {
      instanceId: "MG-1",
    });
    expect(handleMagicGearClick({ target: customFields })).toBe(false);

    const enchantment = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "MG-1",
      entryInstanceId: "ENTRY-1",
    });
    expect(handleMagicGearClick({ target: enchantment })).toBe(false);
    expect(model.removeMagicGearEnchantment).not.toHaveBeenCalled();
  });

  test("an unrelated click target is not handled", () => {
    const target = elWithClass("button", "something-else");
    expect(handleMagicGearClick({ target })).toBe(false);
  });
});

describe("open-state preservation scoping", () => {
  test("scopes to #magicGearSlots vs #magicGearStorageList based on click location", () => {
    resetDOM(`
      <div id="magicGearSlots">
        <div class="custom-fields-block" data-instance-id="MG-1">
          <button class="custom-fields-edit-btn" data-instance-id="MG-1"></button>
        </div>
      </div>
      <div id="magicGearStorageList"></div>
    `);
    const target = document.querySelector(".custom-fields-edit-btn");

    handleMagicGearClick({ target });
    jest.advanceTimersToNextFrame();

    expect(render.renderEquippedMagicGear).toHaveBeenCalledTimes(1);
  });
});

describe("handleMagicGearInput", () => {
  test("always returns false — magic gear has no user-editable numeric fields", () => {
    const target = elWithClass("input", "anything");
    expect(handleMagicGearInput({ target })).toBe(false);
  });
});

describe("handleMagicGearChange", () => {
  test("magic-gear-storage-select and equipped-magic-gear-move both move the item", () => {
    const storageSelect = selectWithValue(
      "magic-gear-storage-select",
      { instanceId: "MG-1" },
      "stash",
    );
    handleMagicGearChange({ target: storageSelect });
    expect(model.moveMagicGear).toHaveBeenCalledWith("MG-1", "stash");

    const moveSelect = selectWithValue(
      "equipped-magic-gear-move",
      { instanceId: "MG-2" },
      "camp",
    );
    handleMagicGearChange({ target: moveSelect });
    expect(model.moveMagicGear).toHaveBeenCalledWith("MG-2", "camp");
  });

  test("an unrelated change target is not handled", () => {
    const target = elWithClass("select", "something-else");
    expect(handleMagicGearChange({ target })).toBe(false);
  });
});

describe("handleAddMagicGear", () => {
  function buildAddForm({ name = "MG-CATALOG-1", storage = "backpack" } = {}) {
    resetDOM(`
      <select id="magicGearNameSelect"><option value="${name}" selected>x</option></select>
      <select id="magicGearStorage"><option value="${storage}" selected>x</option></select>
    `);
  }

  test("does nothing when a required element is missing", () => {
    resetDOM(`<select id="magicGearNameSelect"></select>`); // storage missing
    expect(() => handleAddMagicGear()).not.toThrow();
    expect(model.addEquippedMagicGear).not.toHaveBeenCalled();
  });

  test("does nothing when no item is selected", () => {
    buildAddForm({ name: "" });
    handleAddMagicGear();
    expect(model.addEquippedMagicGear).not.toHaveBeenCalled();
    expect(model.addStoredMagicGear).not.toHaveBeenCalled();
  });

  test("adds as equipped when storage is 'equipped', otherwise as stored at the chosen location", () => {
    buildAddForm({ name: "MG-CATALOG-1", storage: "equipped" });
    handleAddMagicGear();
    expect(model.addEquippedMagicGear).toHaveBeenCalledWith("MG-CATALOG-1");

    buildAddForm({ name: "MG-CATALOG-1", storage: "stash" });
    handleAddMagicGear();
    expect(model.addStoredMagicGear).toHaveBeenCalledWith(
      "MG-CATALOG-1",
      "stash",
    );
  });

  test("always refreshes equip-option availability afterward", () => {
    buildAddForm();
    handleAddMagicGear();
    expect(model.updateMagicGearEquipOptionAvailability).toHaveBeenCalledTimes(
      1,
    );
  });
});
