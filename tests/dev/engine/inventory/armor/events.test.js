jest.mock("dev/public/js/engine/inventory/armor/model.js", () => ({
  equipArmor: jest.fn(),
  addStoredArmor: jest.fn(),
  moveArmor: jest.fn(),
  removeArmor: jest.fn(),
  findEquippedArmorInSlot: jest.fn(),
  findArmorByInstanceId: jest.fn(),
  saveArmorCustomFields: jest.fn(),
  addArmorEnchantment: jest.fn(),
  updateArmorEnchantment: jest.fn(),
  removeArmorEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/armor/render.js", () => ({
  renderArmorSlots: jest.fn(),
  renderStoredArmors: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/armor/model.js";
import * as render from "dev/public/js/engine/inventory/armor/render.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  handleArmorClick,
  handleArmorInput,
  handleArmorChange,
  handleAddArmor,
} from "dev/public/js/engine/inventory/armor/events.js";
import { state } from "dev/public/js/state.js";
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

const ARMOR_HIT_POINTS = 10;

beforeEach(() => {
  resetDOM(`<div id="armorSlots"></div><div id="armorStorageList"></div>`);
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();

  state.data.armors = [
    {
      armor_id: "ARMOR-DB-1",
      armor_piece_location: "Cabeça",
      armor_name: "Elmo de Ferro",
      armor_tier: "I",
      armor_hit_points: ARMOR_HIT_POINTS,
    },
    {
      armor_id: "ARMOR-DB-2",
      armor_piece_location: "Cabeça",
      armor_name: "Elmo de Ferro",
      armor_tier: "II",
      armor_hit_points: ARMOR_HIT_POINTS,
    },
  ];
  state.data.materials = [{ material_id: "MAT-001", material_name: "Aço" }];
  model.findArmorByInstanceId.mockReturnValue({ instance_id: "ARMOR-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────
// handleArmorClick
// ─────────────────────────────────────────────────────────────────────────
describe("handleArmorClick — remove", () => {
  test("remove-armor and remove-equipped-armor both remove by instanceId", () => {
    const a = elWithClass("button", "remove-armor", { instanceId: "ARMOR-1" });
    expect(handleArmorClick({ target: a })).toBe(true);
    expect(model.removeArmor).toHaveBeenCalledWith("ARMOR-1");

    const b = elWithClass("button", "remove-equipped-armor", {
      instanceId: "ARMOR-2",
    });
    handleArmorClick({ target: b });
    expect(model.removeArmor).toHaveBeenCalledWith("ARMOR-2");
  });
});

describe("handleArmorClick — equip-stored-armor", () => {
  function equipButton(instanceId) {
    return {
      target: elWithClass("button", "equip-stored-armor", { instanceId }),
    };
  }

  test("reports handled but does nothing when the stored armor can't be found", () => {
    model.findArmorByInstanceId.mockReturnValue(undefined);
    expect(handleArmorClick(equipButton("GHOST"))).toBe(true);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("reports handled but does nothing when the armor's catalog row can't be found", () => {
    model.findArmorByInstanceId.mockReturnValue({ armor_id: "GHOST-DB-ID" });
    expect(handleArmorClick(equipButton("ARMOR-1"))).toBe(true);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("unequips any other item already equipped in the SAME slot", () => {
    const incoming = { armor_id: "ARMOR-DB-1" }; // Cabeça
    model.findArmorByInstanceId.mockReturnValue(incoming);
    const conflicting = {
      instance_id: "OLD-HELMET",
      armor_id: "ARMOR-DB-2", // also Cabeça
      is_equipped: true,
    };
    const untouched = {
      instance_id: "OTHER-SLOT-ITEM",
      armor_id: "ARMOR-DB-1", // pretend a different slot for this check's purpose
      is_equipped: true,
    };
    state.selected.armors = [conflicting, untouched, incoming];

    handleArmorClick(equipButton("ARMOR-1"));

    expect(conflicting.is_equipped).toBe(false);
    expect(conflicting.storedAt).toBe("backpack");
    expect(incoming.is_equipped).toBe(true);
    expect(incoming.storedAt).toBeNull();
  });

  test("leaves items in OTHER slots untouched", () => {
    const incoming = { armor_id: "ARMOR-DB-1" }; // Cabeça
    model.findArmorByInstanceId.mockReturnValue(incoming);
    state.data.armors.push({
      armor_id: "ARMOR-DB-BOOTS",
      armor_piece_location: "Pés",
    });
    const bootsItem = {
      instance_id: "BOOTS",
      armor_id: "ARMOR-DB-BOOTS", // Pés, different slot
      is_equipped: true,
    };
    state.selected.armors = [bootsItem, incoming];

    handleArmorClick(equipButton("ARMOR-1"));

    expect(bootsItem.is_equipped).toBe(true); // untouched
  });

  test("re-renders and triggers autorun on success", () => {
    model.findArmorByInstanceId.mockReturnValue({ armor_id: "ARMOR-DB-1" });
    state.selected.armors = [];

    handleArmorClick(equipButton("ARMOR-1"));
    jest.advanceTimersToNextFrame();

    expect(render.renderArmorSlots).toHaveBeenCalledTimes(1);
    expect(render.renderStoredArmors).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

describe("handleArmorClick — custom fields (real shared dispatch, sync flavor)", () => {
  test("save reads the real editor DOM, wrapped synchronously by snapshotAll/restoreAll", () => {
    resetDOM(`
      <div id="armorSlots"></div>
      <div id="armorStorageList"></div>
      <div class="custom-fields-block" data-instance-id="ARMOR-1">
        <input class="custom-fields-input-name" value="Elmo Lendário" />
        <input class="custom-fields-input-description" value="Brilha" />
        <input class="custom-fields-input-effect" value="+2 DEF" />
      </div>
    `);
    const target = elWithClass("button", "custom-fields-save-btn", {
      instanceId: "ARMOR-1",
    });

    const result = handleArmorClick({ target });

    // Flavor B is synchronous — no rAF flush needed, unlike accessories'
    // Flavor A. This is the actual regression check for that distinction.
    expect(result).toBe(true);
    expect(model.saveArmorCustomFields).toHaveBeenCalledWith("ARMOR-1", {
      name: "Elmo Lendário",
      description: "Brilha",
      effect: "+2 DEF",
    });
  });

  test("ownership rejection blocks the custom-fields buttons", () => {
    model.findArmorByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "custom-fields-edit-btn", {
      instanceId: "ARMOR-1",
    });
    expect(handleArmorClick({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleArmorClick — enchantments (real shared dispatch)
// ─────────────────────────────────────────────────────────────────────────
describe("handleArmorClick — enchantments delegation", () => {
  test("remove button removes the enchantment entry via the shared dispatch factory", () => {
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "ARMOR-1",
      entryInstanceId: "ENTRY-1",
    });

    const result = handleArmorClick({ target });

    expect(result).toBe(true);
    expect(model.removeArmorEnchantment).toHaveBeenCalledWith(
      "ARMOR-1",
      "ENTRY-1",
    );
  });

  test("an enchantment click for an instanceId ownership rejects is not handled", () => {
    model.findArmorByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "ARMOR-1",
      entryInstanceId: "ENTRY-1",
    });
    expect(handleArmorClick({ target })).toBe(false);
    expect(model.removeArmorEnchantment).not.toHaveBeenCalled();
  });

  test("removing an enchantment does NOT go through the rAF-deferred render — model.js's own renderListsPreserving already ran synchronously", () => {
    // Unlike accessories (which needs _withPreservedOpenState to render),
    // armor's addArmorEnchantment/updateArmorEnchantment/
    // removeArmorEnchantment call the global renderListsPreserving()
    // themselves — model.js is mocked here, so this test only proves the
    // dispatch reaches removeArmorEnchantment without also asserting on
    // render.renderArmorSlots, which would only fire from a REAL
    // (unmocked) model.js.
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "ARMOR-1",
      entryInstanceId: "ENTRY-1",
    });
    handleArmorClick({ target });
    expect(render.renderArmorSlots).not.toHaveBeenCalled();
  });
});

test("handleArmorClick returns false for an unrelated click target", () => {
  const target = elWithClass("button", "something-else");
  expect(handleArmorClick({ target })).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────
// handleArmorInput
// ─────────────────────────────────────────────────────────────────────────
describe("handleArmorInput", () => {
  function hpInput(className, dataset, value) {
    const el = elWithClass("input", className, dataset);
    el.value = value;
    return el;
  }

  test("resume-armor-hp: no-op (but handled) when nothing is equipped in that slot", () => {
    model.findEquippedArmorInSlot.mockReturnValue(undefined);
    const target = hpInput("resume-armor-hp", { slot: "Cabeça" }, "-2");
    expect(handleArmorInput({ target })).toBe(true);
  });

  test("resume-armor-hp: allows a lone '-' mid-typing without mutating", () => {
    const equipped = { armor_id: "ARMOR-DB-1", hit_points_modifier: 0 };
    model.findEquippedArmorInSlot.mockReturnValue(equipped);
    const target = hpInput("resume-armor-hp", { slot: "Cabeça" }, "-");
    handleArmorInput({ target });
    expect(equipped.hit_points_modifier).toBe(0);
  });

  test("resume-armor-hp: clamps the modifier using real HP math and patches the display", () => {
    const equipped = { armor_id: "ARMOR-DB-1", hit_points_modifier: 0 };
    model.findEquippedArmorInSlot.mockReturnValue(equipped);
    resetDOM(`
      <table><tr><td>
        <input class="resume-armor-hp" data-slot="Cabeça" value="-999" />
        <span class="resume-hp-actual"></span>
      </td></tr></table>
    `);
    const target = document.querySelector(".resume-armor-hp");
    target.value = "-999"; // way past -maxHp(10), should clamp

    handleArmorInput({ target });

    expect(equipped.hit_points_modifier).toBe(-10); // clamped to -maxHp
    expect(
      target.closest("td").querySelector(".resume-hp-actual").textContent,
    ).toBe(
      "0", // maxHp(10) + (-10)
    );
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("equipped-armor-hp patches the second <strong> inside .hp-modifier", () => {
    const equipped = { armor_id: "ARMOR-DB-1", hit_points_modifier: 0 };
    model.findEquippedArmorInSlot.mockReturnValue(equipped);
    resetDOM(`
      <div class="hp-modifier">
        <strong>10</strong>
        <input class="equipped-armor-hp" data-slot="Cabeça" value="-3" />
        <strong>10</strong>
      </div>
    `);
    const target = document.querySelector(".equipped-armor-hp");

    handleArmorInput({ target });

    const strongs = target.closest(".hp-modifier").querySelectorAll("strong");
    expect(equipped.hit_points_modifier).toBe(-3);
    expect(strongs[1].textContent).toBe("7"); // 10 - 3
    expect(strongs[0].textContent).toBe("10"); // untouched
  });

  test("stored-armor-hp looks up the instance by instanceId rather than slot", () => {
    const storedInstance = { armor_id: "ARMOR-DB-1", hit_points_modifier: 0 };
    model.findArmorByInstanceId.mockReturnValue(storedInstance);
    resetDOM(`
      <div class="hp-modifier">
        <strong>x</strong>
        <input class="stored-armor-hp" data-instance-id="ARMOR-1" value="-1" />
        <strong>x</strong>
      </div>
    `);
    const target = document.querySelector(".stored-armor-hp");

    handleArmorInput({ target });

    expect(storedInstance.hit_points_modifier).toBe(-1);
  });

  test("debounces the eventual re-render by 300ms", () => {
    const equipped = { armor_id: "ARMOR-DB-1", hit_points_modifier: 0 };
    model.findEquippedArmorInSlot.mockReturnValue(equipped);
    resetDOM(
      `<input class="equipped-armor-hp" data-slot="Cabeça" value="-1" />`,
    );
    const target = document.querySelector(".equipped-armor-hp");

    handleArmorInput({ target });
    expect(render.renderArmorSlots).not.toHaveBeenCalled();

    jest.advanceTimersByTime(299);
    expect(render.renderArmorSlots).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    jest.advanceTimersToNextFrame(); // _renderArmorLists' own internal rAF
    expect(render.renderArmorSlots).toHaveBeenCalledTimes(1);
  });

  test("an unrelated input target is not handled", () => {
    const target = elWithClass("input", "something-else");
    expect(handleArmorInput({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleArmorChange
// ─────────────────────────────────────────────────────────────────────────
describe("handleArmorChange — equipped-armor-name", () => {
  test("an empty selection unequips the slot", () => {
    const target = selectWithValue(
      "equipped-armor-name",
      { slot: "Cabeça" },
      "",
    );
    handleArmorChange({ target });
    expect(model.equipArmor).toHaveBeenCalledWith("Cabeça", "");
  });

  test("populates the tier <select> with the matching name's tiers", () => {
    resetDOM(`
      <div id="armorSlots">
        <select class="equipped-armor-tier" data-slot="Cabeça"></select>
      </div>
      <div id="armorStorageList"></div>
    `);
    const target = selectWithValue(
      "equipped-armor-name",
      { slot: "Cabeça" },
      "Elmo de Ferro",
    );

    handleArmorChange({ target });

    const tierSelect = document.querySelector(".equipped-armor-tier");
    expect(Array.from(tierSelect.options).map((o) => o.value)).toEqual([
      "I",
      "II",
    ]);
  });

  test("when nothing is equipped in the slot, creates a fresh instance via equipArmor()", () => {
    model.findEquippedArmorInSlot.mockReturnValue(undefined);
    const target = selectWithValue(
      "equipped-armor-name",
      { slot: "Cabeça" },
      "Elmo de Ferro",
    );

    handleArmorChange({ target });
    jest.advanceTimersToNextFrame();

    expect(model.equipArmor).toHaveBeenCalledWith(
      "Cabeça",
      "ARMOR-DB-1",
      "MAT-000",
    );
    expect(render.renderArmorSlots).toHaveBeenCalledTimes(1);
  });

  test("[fixed] when something is already equipped in the slot, edits it IN PLACE instead of calling equipArmor()", () => {
    // This is the fix: equipArmor() unequips-and-recreates on every call
    // (fresh _instanceId, armor_custom_* reset to null) — even for a
    // same-slot name swap. That silently wiped any custom fields the
    // player had set. Editing the existing instance's armor_id directly
    // (matching melee/ranged/firearms/shield's pattern) preserves both
    // instance identity and customization.
    const currentEquipped = {
      instance_id: "EQUIPPED-1",
      armor_id: "OLD-ARMOR-DB-ID",
      hit_points_modifier: -5,
      armor_custom_name: "Elmo do Avô",
    };
    model.findEquippedArmorInSlot.mockReturnValue(currentEquipped);
    const target = selectWithValue(
      "equipped-armor-name",
      { slot: "Cabeça" },
      "Elmo de Ferro",
    );

    handleArmorChange({ target });

    expect(currentEquipped.armor_id).toBe("ARMOR-DB-1");
    expect(currentEquipped.hit_points_modifier).toBe(0);
    expect(currentEquipped.armor_custom_name).toBe("Elmo do Avô"); // preserved
    expect(model.equipArmor).not.toHaveBeenCalled();
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("does nothing further if the chosen name doesn't match any catalog row", () => {
    const target = selectWithValue(
      "equipped-armor-name",
      { slot: "Cabeça" },
      "Nome Inexistente",
    );
    handleArmorChange({ target });
    expect(model.equipArmor).not.toHaveBeenCalled();
  });
});

describe("handleArmorChange — equipped-armor-tier", () => {
  test("no-ops when the sibling name <select> is missing", () => {
    resetDOM(`<div id="armorSlots"></div><div id="armorStorageList"></div>`);
    const target = selectWithValue(
      "equipped-armor-tier",
      { slot: "Cabeça" },
      "I",
    );
    expect(handleArmorChange({ target })).toBe(true);
    expect(model.equipArmor).not.toHaveBeenCalled();
  });

  test("when nothing is equipped in the slot, creates a fresh instance via equipArmor()", () => {
    resetDOM(`
      <div id="armorSlots">
        <select class="equipped-armor-name" data-slot="Cabeça">
          <option value="Elmo de Ferro" selected>x</option>
        </select>
      </div>
      <div id="armorStorageList"></div>
    `);
    model.findEquippedArmorInSlot.mockReturnValue(undefined);
    const target = selectWithValue(
      "equipped-armor-tier",
      { slot: "Cabeça" },
      "I",
    );

    handleArmorChange({ target });

    expect(model.equipArmor).toHaveBeenCalledWith(
      "Cabeça",
      "ARMOR-DB-1",
      "MAT-000",
    );
  });

  test("[fixed] when something is already equipped, edits it IN PLACE, preserving identity and custom fields", () => {
    resetDOM(`
      <div id="armorSlots">
        <select class="equipped-armor-name" data-slot="Cabeça">
          <option value="Elmo de Ferro" selected>x</option>
        </select>
      </div>
      <div id="armorStorageList"></div>
    `);
    const currentEquipped = {
      instance_id: "EQUIPPED-1",
      armor_id: "ARMOR-DB-1",
      material_id: "MAT-001",
      hit_points_modifier: -3,
      armor_custom_effect: "+1 DEF",
    };
    model.findEquippedArmorInSlot.mockReturnValue(currentEquipped);
    const target = selectWithValue(
      "equipped-armor-tier",
      { slot: "Cabeça" },
      "II",
    );

    handleArmorChange({ target });

    expect(currentEquipped.armor_id).toBe("ARMOR-DB-2");
    expect(currentEquipped.hit_points_modifier).toBe(0);
    expect(currentEquipped.material_id).toBe("MAT-001"); // preserved (never touched)
    expect(currentEquipped.armor_custom_effect).toBe("+1 DEF"); // preserved
    expect(model.equipArmor).not.toHaveBeenCalled();
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

describe("handleArmorChange — material / storage / move", () => {
  test("equipped-armor-material sets material_id and resets hit_points_modifier", () => {
    const equipped = { material_id: "MAT-OLD", hit_points_modifier: -5 };
    model.findEquippedArmorInSlot.mockReturnValue(equipped);
    const target = selectWithValue(
      "equipped-armor-material",
      { slot: "Cabeça" },
      "MAT-001",
    );

    handleArmorChange({ target });

    expect(equipped.material_id).toBe("MAT-001");
    expect(equipped.hit_points_modifier).toBe(0);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("armor-storage-select moves the item", () => {
    const target = selectWithValue(
      "armor-storage-select",
      { instanceId: "ARMOR-1" },
      "stash",
    );
    handleArmorChange({ target });
    expect(model.moveArmor).toHaveBeenCalledWith("ARMOR-1", "stash");
  });

  test("equipped-armor-move to a real destination unequips into storage", () => {
    const equipped = { is_equipped: true, storedAt: null };
    model.findEquippedArmorInSlot.mockReturnValue(equipped);
    const target = selectWithValue(
      "equipped-armor-move",
      { slot: "Cabeça" },
      "camp",
    );

    handleArmorChange({ target });

    expect(equipped.is_equipped).toBe(false);
    expect(equipped.storedAt).toBe("camp");
  });

  test("equipped-armor-move back to '' (Equipped) re-equips", () => {
    const equipped = { is_equipped: false, storedAt: "stash" };
    model.findEquippedArmorInSlot.mockReturnValue(equipped);
    const target = selectWithValue(
      "equipped-armor-move",
      { slot: "Cabeça" },
      "",
    );

    handleArmorChange({ target });

    expect(equipped.is_equipped).toBe(true);
    expect(equipped.storedAt).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleArmorChange — enchantments (real shared dispatch)
// ─────────────────────────────────────────────────────────────────────────
describe("handleArmorChange — enchantments delegation", () => {
  test("an enchantment filter change delegates to the shared dispatch factory", () => {
    const target = elWithClass("select", "enchantment-type-select", {
      formKey: "ARMOR-1",
    });
    target.value = "SOME-ENCH";
    // findArmorByInstanceId (mocked truthy) confirms ownership; the
    // actual Map-mutation is model.js internals covered in Batch 5 — this
    // just proves the wiring reaches it without throwing.
    expect(() => handleArmorChange({ target })).not.toThrow();
  });

  test("an enchantment filter change for a rejected ownership is not handled", () => {
    model.findArmorByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("select", "enchantment-type-select", {
      formKey: "ARMOR-1",
    });
    expect(handleArmorChange({ target })).toBe(false);
  });
});

test("handleArmorChange returns false for an unrelated change target", () => {
  const target = elWithClass("select", "something-else");
  expect(handleArmorChange({ target })).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────
// handleAddArmor
// ─────────────────────────────────────────────────────────────────────────
describe("handleAddArmor", () => {
  function buildAddForm({
    slot = "Cabeça",
    name = "Elmo de Ferro",
    tier = "I",
    material = "Aço",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <div id="armorSlots"></div>
      <div id="armorStorageList"></div>
      <select id="armorSlotSelect"><option value="${slot}" selected>x</option></select>
      <select id="armorNameSelect"><option value="${name}" selected>x</option></select>
      <select id="armorTierSelect"><option value="${tier}" selected>x</option></select>
      <select id="armorMaterialSelect"><option value="${material}" selected>x</option></select>
      <select id="armorStorage"><option value="${storage}" selected>x</option></select>
    `);
  }

  test("does nothing when a required element is missing", () => {
    resetDOM(`<select id="armorSlotSelect"></select>`);
    expect(() => handleAddArmor()).not.toThrow();
    expect(model.addStoredArmor).not.toHaveBeenCalled();
  });

  test("does nothing when the slot+name+tier combination doesn't match any catalog row", () => {
    buildAddForm({ tier: "III" }); // no ARMOR-DB row has tier III
    handleAddArmor();
    expect(model.addStoredArmor).not.toHaveBeenCalled();
  });

  test("adds the matching armor with its resolved material id and chosen storage", () => {
    buildAddForm({ tier: "II", material: "Aço", storage: "stash" });
    handleAddArmor();
    expect(model.addStoredArmor).toHaveBeenCalledWith(
      "ARMOR-DB-2",
      "MAT-001",
      "stash",
    );
  });

  test("passes null when the chosen material doesn't match any catalog row", () => {
    buildAddForm({ material: "Material Inexistente" });
    handleAddArmor();
    expect(model.addStoredArmor).toHaveBeenCalledWith(
      "ARMOR-DB-1",
      null,
      "backpack",
    );
  });
});
