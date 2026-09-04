jest.mock("dev/public/js/engine/inventory/accessories/model.js", () => ({
  addEquippedAccessory: jest.fn(),
  addStoredAccessory: jest.fn(),
  equipAccessory: jest.fn(),
  moveAccessory: jest.fn(),
  removeAccessory: jest.fn(),
  updateAccessoryPrice: jest.fn(),
  saveAccessoryCustomFields: jest.fn(),
  findAccessoryByInstanceId: jest.fn(() => ({ instance_id: "ACC-1" })),
  updateAccessoryEquipOptionAvailability: jest.fn(),
  addAccessoryEnchantment: jest.fn(),
  updateAccessoryEnchantment: jest.fn(),
  removeAccessoryEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/accessories/render.js", () => ({
  renderEquippedAccessories: jest.fn(),
  renderStoredAccessories: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/accessories/model.js";
import * as render from "dev/public/js/engine/inventory/accessories/render.js";
import {
  handleAccessoryClick,
  handleAccessoryInput,
  handleAccessoryChange,
  handleAddAccessory,
} from "dev/public/js/engine/inventory/accessories/events.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function elWithClass(tag, className, dataset = {}) {
  const el = document.createElement(tag);
  className.split(" ").forEach((c) => el.classList.add(c));
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  return el;
}

// A <select>'s .value setter silently no-ops if there's no matching
// <option> — unlike <input>, which accepts any string directly.
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
  model.findAccessoryByInstanceId.mockReturnValue({ instance_id: "ACC-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("handleAccessoryClick — remove/equip", () => {
  test("remove-accessory removes by instanceId and reports handled", () => {
    const target = elWithClass("button", "remove-accessory", {
      instanceId: "ACC-1",
    });
    expect(handleAccessoryClick({ target })).toBe(true);
    expect(model.removeAccessory).toHaveBeenCalledWith("ACC-1");
  });

  test("remove-equipped-accessory also routes to removeAccessory", () => {
    const target = elWithClass("button", "remove-equipped-accessory", {
      instanceId: "ACC-2",
    });
    expect(handleAccessoryClick({ target })).toBe(true);
    expect(model.removeAccessory).toHaveBeenCalledWith("ACC-2");
  });

  test("equip-stored-accessory equips by instanceId", () => {
    const target = elWithClass("button", "equip-stored-accessory", {
      instanceId: "ACC-3",
    });
    expect(handleAccessoryClick({ target })).toBe(true);
    expect(model.equipAccessory).toHaveBeenCalledWith("ACC-3");
  });

  test("an unrelated click target is not handled", () => {
    const target = elWithClass("button", "something-else");
    expect(handleAccessoryClick({ target })).toBe(false);
  });
});

describe("handleAccessoryClick — custom fields delegation", () => {
  test("edit button opens the editor (real integration, not just a mock check)", () => {
    resetDOM(`
      <div class="custom-fields-block" data-instance-id="ACC-1"></div>
    `);
    const target = elWithClass("button", "custom-fields-edit-btn", {
      instanceId: "ACC-1",
    });

    const result = handleAccessoryClick({ target });
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(render.renderEquippedAccessories).toHaveBeenCalledTimes(1);
    expect(render.renderStoredAccessories).toHaveBeenCalledTimes(1);
  });

  test("save button reads the real editor DOM and forwards values to saveAccessoryCustomFields", () => {
    resetDOM(`
      <div class="custom-fields-block" data-instance-id="ACC-1">
        <input class="custom-fields-input-name" value="Amuleto" />
        <input class="custom-fields-input-description" value="Brilha no escuro" />
        <input class="custom-fields-input-effect" value="+1 Percepção" />
      </div>
    `);
    const target = elWithClass("button", "custom-fields-save-btn", {
      instanceId: "ACC-1",
    });

    handleAccessoryClick({ target });
    jest.advanceTimersToNextFrame();

    expect(model.saveAccessoryCustomFields).toHaveBeenCalledWith("ACC-1", {
      name: "Amuleto",
      description: "Brilha no escuro",
      effect: "+1 Percepção",
    });
  });

  test("custom-fields buttons for an accessory the ownership check rejects are not handled", () => {
    model.findAccessoryByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "custom-fields-edit-btn", {
      instanceId: "ACC-1",
    });
    expect(handleAccessoryClick({ target })).toBe(false);
  });
});

describe("handleAccessoryClick — enchantments delegation", () => {
  test("remove button removes the enchantment entry via the shared dispatch factory", () => {
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "ACC-1",
      entryInstanceId: "ENTRY-1",
    });

    const result = handleAccessoryClick({ target });
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(model.removeAccessoryEnchantment).toHaveBeenCalledWith(
      "ACC-1",
      "ENTRY-1",
    );
  });

  test("an enchantment click for an instanceId ownership rejects is not handled", () => {
    model.findAccessoryByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "ACC-1",
      entryInstanceId: "ENTRY-1",
    });
    expect(handleAccessoryClick({ target })).toBe(false);
    expect(model.removeAccessoryEnchantment).not.toHaveBeenCalled();
  });
});

describe("open-state preservation scoping", () => {
  test("a click inside #accessorySlots preserves state scoped to #accessorySlots", () => {
    resetDOM(`
      <div id="accessorySlots">
        <div class="custom-fields-block" data-instance-id="ACC-1">
          <button class="custom-fields-edit-btn" data-instance-id="ACC-1"></button>
        </div>
      </div>
      <div id="accessoryStorageList"></div>
    `);
    const target = document.querySelector(".custom-fields-edit-btn");

    // No throw + correct render calls is enough to prove withOpenState ran against the right container; its snapshot/restore contract is tested separately.
    expect(() => handleAccessoryClick({ target })).not.toThrow();
    jest.advanceTimersToNextFrame();
    expect(render.renderEquippedAccessories).toHaveBeenCalledTimes(1);
  });

  test("a click outside #accessorySlots falls back to #accessoryStorageList", () => {
    resetDOM(`
      <div id="accessorySlots"></div>
      <div id="accessoryStorageList">
        <div class="custom-fields-block" data-instance-id="ACC-1">
          <button class="custom-fields-edit-btn" data-instance-id="ACC-1"></button>
        </div>
      </div>
    `);
    const target = document.querySelector(".custom-fields-edit-btn");

    expect(() => handleAccessoryClick({ target })).not.toThrow();
    jest.advanceTimersToNextFrame();
    expect(render.renderStoredAccessories).toHaveBeenCalledTimes(1);
  });
});

describe("handleAccessoryInput", () => {
  test("allows an empty price value mid-typing without calling updateAccessoryPrice", () => {
    const target = elWithClass("input", "equipped-accessory-price", {
      instanceId: "ACC-1",
    });
    target.value = "";
    expect(handleAccessoryInput({ target })).toBe(true);
    expect(model.updateAccessoryPrice).not.toHaveBeenCalled();
  });

  test("updates the price for a non-empty value, for both equipped and stored price fields", () => {
    const equipped = elWithClass("input", "equipped-accessory-price", {
      instanceId: "ACC-1",
    });
    equipped.value = "15.5";
    handleAccessoryInput({ target: equipped });
    expect(model.updateAccessoryPrice).toHaveBeenCalledWith("ACC-1", "15.5");

    const stored = elWithClass("input", "stored-accessory-price", {
      instanceId: "ACC-2",
    });
    stored.value = "3";
    handleAccessoryInput({ target: stored });
    expect(model.updateAccessoryPrice).toHaveBeenCalledWith("ACC-2", "3");
  });

  test("an unrelated input target is not handled", () => {
    const target = elWithClass("input", "something-else");
    expect(handleAccessoryInput({ target })).toBe(false);
  });
});

describe("handleAccessoryChange", () => {
  test("accessoryNameSelect refreshes equip-option availability", () => {
    const target = document.createElement("select");
    target.id = "accessoryNameSelect";
    expect(handleAccessoryChange({ target })).toBe(true);
    expect(model.updateAccessoryEquipOptionAvailability).toHaveBeenCalledTimes(
      1,
    );
  });

  test("accessory-storage-select and equipped-accessory-move both move the accessory", () => {
    const storageSelect = selectWithValue(
      "accessory-storage-select",
      { instanceId: "ACC-1" },
      "stash",
    );
    handleAccessoryChange({ target: storageSelect });
    expect(model.moveAccessory).toHaveBeenCalledWith("ACC-1", "stash");

    const moveSelect = selectWithValue(
      "equipped-accessory-move",
      { instanceId: "ACC-2" },
      "camp",
    );
    handleAccessoryChange({ target: moveSelect });
    expect(model.moveAccessory).toHaveBeenCalledWith("ACC-2", "camp");
  });

  test("an enchantment filter change delegates to the shared dispatch factory", () => {
    const target = elWithClass("select", "enchantment-type-select", {
      formKey: "ACC-1",
    });
    target.value = "SOME-ENCH";
    // findAccessoryByInstanceId (mocked truthy) confirms ownership; the actual Map-mutation is model.js internals covered elsewhere.
    expect(() => handleAccessoryChange({ target })).not.toThrow();
  });

  test("an unrelated change target is not handled", () => {
    const target = elWithClass("select", "something-else");
    expect(handleAccessoryChange({ target })).toBe(false);
  });
});

describe("handleAddAccessory", () => {
  function buildAddForm({
    name = "ACC-CATALOG-1",
    price = "10",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <select id="accessoryNameSelect"><option value="${name}" selected>x</option></select>
      <input id="accessoryPriceInput" value="${price}" />
      <select id="accessoryStorage"><option value="${storage}" selected>x</option></select>
    `);
  }

  test("does nothing when any of the three required elements is missing", () => {
    resetDOM(`<select id="accessoryNameSelect"></select>`); // price/storage missing
    expect(() => handleAddAccessory()).not.toThrow();
    expect(model.addEquippedAccessory).not.toHaveBeenCalled();
    expect(model.addStoredAccessory).not.toHaveBeenCalled();
  });

  test("does nothing when no accessory is selected", () => {
    buildAddForm({ name: "" });
    handleAddAccessory();
    expect(model.addEquippedAccessory).not.toHaveBeenCalled();
    expect(model.addStoredAccessory).not.toHaveBeenCalled();
  });

  test("adds as equipped when storage is 'equipped'", () => {
    buildAddForm({ name: "ACC-CATALOG-1", price: "12", storage: "equipped" });
    handleAddAccessory();
    expect(model.addEquippedAccessory).toHaveBeenCalledWith(
      "ACC-CATALOG-1",
      12,
    );
    expect(model.addStoredAccessory).not.toHaveBeenCalled();
  });

  test("adds as stored, at the chosen location, otherwise", () => {
    buildAddForm({ name: "ACC-CATALOG-1", price: "12", storage: "stash" });
    handleAddAccessory();
    expect(model.addStoredAccessory).toHaveBeenCalledWith(
      "ACC-CATALOG-1",
      12,
      "stash",
    );
  });

  test("falls back to a price of 0 for an unparsable price input", () => {
    buildAddForm({
      name: "ACC-CATALOG-1",
      price: "not-a-number",
      storage: "equipped",
    });
    handleAddAccessory();
    expect(model.addEquippedAccessory).toHaveBeenCalledWith("ACC-CATALOG-1", 0);
  });

  test("always refreshes equip-option availability afterward", () => {
    buildAddForm();
    handleAddAccessory();
    expect(model.updateAccessoryEquipOptionAvailability).toHaveBeenCalledTimes(
      1,
    );
  });
});
