jest.mock("dev/public/js/engine/inventory/shield/model.js", () => ({
  equipShield: jest.fn(),
  addStoredShield: jest.fn(),
  moveShield: jest.fn(),
  removeShield: jest.fn(),
  findShieldByInstanceId: jest.fn(),
  saveShieldCustomFields: jest.fn(),
  addShieldEnchantment: jest.fn(),
  updateShieldEnchantment: jest.fn(),
  removeShieldEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/shield/render.js", () => ({
  renderEquippedShield: jest.fn(),
  renderStoredShields: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/shield/model.js";
import * as render from "dev/public/js/engine/inventory/shield/render.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  handleShieldClick,
  handleShieldInput,
  handleShieldChange,
  handleAddShield,
} from "dev/public/js/engine/inventory/shield/events.js";
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

beforeEach(() => {
  resetDOM(`<div id="shieldSlot"></div><div id="shieldStorageList"></div>`);
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();

  state.data.shields = [
    {
      shield_id: "SHIELD-DB-1",
      shield_name: "Broquel",
      shield_tier: "I",
      shield_hit_points: 10,
    },
    {
      shield_id: "SHIELD-DB-2",
      shield_name: "Broquel",
      shield_tier: "II",
      shield_hit_points: 10,
    },
  ];
  state.data.materials = [{ material_id: "MAT-001", material_name: "Aço" }];
  model.findShieldByInstanceId.mockReturnValue({ instance_id: "SHIELD-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("handleShieldClick — remove", () => {
  test("remove-shield and remove-equipped-shield both remove by instanceId", () => {
    const a = elWithClass("button", "remove-shield", {
      instanceId: "SHIELD-1",
    });
    expect(handleShieldClick({ target: a })).toBe(true);
    expect(model.removeShield).toHaveBeenCalledWith("SHIELD-1");

    const b = elWithClass("button", "remove-equipped-shield", {
      instanceId: "SHIELD-2",
    });
    handleShieldClick({ target: b });
    expect(model.removeShield).toHaveBeenCalledWith("SHIELD-2");
  });
});

describe("handleShieldClick — equip-stored-shield", () => {
  test("reports handled but does nothing when the stored shield can't be found", () => {
    model.findShieldByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "equip-stored-shield", {
      instanceId: "GHOST",
    });
    expect(handleShieldClick({ target })).toBe(true);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("unequips any other shield already equipped (single-slot, so this is the ONLY other item)", () => {
    const incoming = { instance_id: "SHIELD-1" };
    model.findShieldByInstanceId.mockReturnValue(incoming);
    const currentlyEquipped = {
      instance_id: "OLD-SHIELD",
      is_equipped: true,
    };
    state.selected.shields = [currentlyEquipped, incoming];

    const target = elWithClass("button", "equip-stored-shield", {
      instanceId: "SHIELD-1",
    });
    handleShieldClick({ target });
    jest.advanceTimersToNextFrame();

    expect(currentlyEquipped.is_equipped).toBe(false);
    expect(currentlyEquipped.storedAt).toBe("backpack");
    expect(incoming.is_equipped).toBe(true);
    expect(incoming.storedAt).toBeNull();
    expect(render.renderEquippedShield).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

describe("handleShieldClick — custom fields (real shared dispatch)", () => {
  test("save reads the real editor DOM synchronously (Flavor B, no rAF needed for this path)", () => {
    resetDOM(`
      <div id="shieldSlot"></div>
      <div id="shieldStorageList"></div>
      <div class="custom-fields-block" data-instance-id="SHIELD-1">
        <input class="custom-fields-input-name" value="Broquel Élfico" />
        <input class="custom-fields-input-description" value="Leve" />
        <input class="custom-fields-input-effect" value="+1 Bloqueio" />
      </div>
    `);
    const target = elWithClass("button", "custom-fields-save-btn", {
      instanceId: "SHIELD-1",
    });

    const result = handleShieldClick({ target });

    expect(result).toBe(true);
    expect(model.saveShieldCustomFields).toHaveBeenCalledWith("SHIELD-1", {
      name: "Broquel Élfico",
      description: "Leve",
      effect: "+1 Bloqueio",
    });
  });
});

test("handleShieldClick returns false for an unrelated click target", () => {
  const target = elWithClass("button", "something-else");
  expect(handleShieldClick({ target })).toBe(false);
});

describe("handleShieldClick — enchantments delegation", () => {
  test("remove button removes the enchantment entry via the shared dispatch factory", () => {
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "SHIELD-1",
      entryInstanceId: "ENTRY-1",
    });

    const result = handleShieldClick({ target });

    expect(result).toBe(true);
    expect(model.removeShieldEnchantment).toHaveBeenCalledWith(
      "SHIELD-1",
      "ENTRY-1",
    );
  });

  test("an enchantment click for an instanceId ownership rejects is not handled", () => {
    model.findShieldByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "SHIELD-1",
      entryInstanceId: "ENTRY-1",
    });
    expect(handleShieldClick({ target })).toBe(false);
    expect(model.removeShieldEnchantment).not.toHaveBeenCalled();
  });

  test("removing an enchantment does NOT go through the rAF-deferred render — model.js's own renderListsPreserving already ran synchronously", () => {
    // model.js is mocked, so this only proves the dispatch reaches removeShieldEnchantment — render.renderEquippedShield only fires from a real (unmocked) model.js.
    const target = elWithClass("button", "enchantment-remove-btn", {
      instanceId: "SHIELD-1",
      entryInstanceId: "ENTRY-1",
    });
    handleShieldClick({ target });
    expect(render.renderEquippedShield).not.toHaveBeenCalled();
  });
});

describe("handleShieldInput", () => {
  test("no-ops (but handled) when nothing is equipped", () => {
    state.selected.shields = [];
    const target = elWithClass("input", "resume-shield-hp");
    target.value = "-2";
    expect(handleShieldInput({ target })).toBe(true);
  });

  test("allows a lone '-' mid-typing without mutating", () => {
    const equipped = {
      shield_id: "SHIELD-DB-1",
      is_equipped: true,
      hit_points_modifier: 0,
    };
    state.selected.shields = [equipped];
    const target = elWithClass("input", "resume-shield-hp");
    target.value = "-";
    handleShieldInput({ target });
    expect(equipped.hit_points_modifier).toBe(0);
  });

  test("resume-shield-hp clamps using real HP math and patches the resume display", () => {
    const equipped = {
      shield_id: "SHIELD-DB-1",
      is_equipped: true,
      hit_points_modifier: 0,
    };
    state.selected.shields = [equipped];
    resetDOM(`
      <table><tr><td>
        <input class="resume-shield-hp" value="-999" />
        <span class="resume-hp-actual"></span>
      </td></tr></table>
    `);
    const target = document.querySelector(".resume-shield-hp");

    handleShieldInput({ target });

    expect(equipped.hit_points_modifier).toBe(-10); // clamped to -maxHp(10)
    expect(
      target.closest("td").querySelector(".resume-hp-actual").textContent,
    ).toBe("0");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("equipped-shield-hp patches the .hp-modifier block's second <strong>", () => {
    const equipped = {
      shield_id: "SHIELD-DB-1",
      is_equipped: true,
      hit_points_modifier: 0,
    };
    state.selected.shields = [equipped];
    resetDOM(`
      <div class="hp-modifier">
        <strong>x</strong>
        <input class="equipped-shield-hp" value="-3" />
        <strong>x</strong>
      </div>
    `);
    const target = document.querySelector(".equipped-shield-hp");

    handleShieldInput({ target });

    const strongs = target.closest(".hp-modifier").querySelectorAll("strong");
    expect(strongs[1].textContent).toBe("7"); // 10 - 3
  });

  test("stored-shield-hp looks up by instanceId, independent of equip state", () => {
    const stored = { shield_id: "SHIELD-DB-1", hit_points_modifier: 0 };
    model.findShieldByInstanceId.mockReturnValue(stored);
    resetDOM(`
      <div class="hp-modifier">
        <strong>x</strong>
        <input class="stored-shield-hp" data-instance-id="SHIELD-1" value="-2" />
        <strong>x</strong>
      </div>
    `);
    const target = document.querySelector(".stored-shield-hp");

    handleShieldInput({ target });

    expect(stored.hit_points_modifier).toBe(-2);
  });

  test("debounces the eventual re-render by 300ms, via the shared _renderShieldLists path", () => {
    const equipped = {
      shield_id: "SHIELD-DB-1",
      is_equipped: true,
      hit_points_modifier: 0,
    };
    state.selected.shields = [equipped];
    const target = elWithClass("input", "equipped-shield-hp");
    target.value = "-1";

    handleShieldInput({ target });
    expect(render.renderEquippedShield).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    jest.advanceTimersToNextFrame();

    expect(render.renderEquippedShield).toHaveBeenCalledTimes(1);
  });

  test("an unrelated input target is not handled", () => {
    const target = elWithClass("input", "something-else");
    expect(handleShieldInput({ target })).toBe(false);
  });
});

describe("handleShieldChange — equipped-shield-name", () => {
  test("an empty selection unequips via equipShield('')", () => {
    const target = selectWithValue("equipped-shield-name", {}, "");
    handleShieldChange({ target });
    expect(model.equipShield).toHaveBeenCalledWith("");
  });

  test("[asymmetry vs armor] when something is already equipped, mutates it IN PLACE and does NOT call _renderShieldLists", () => {
    // Unlike armor's handler (always re-renders via model.equipArmor()), shield's mutates the already-equipped instance in place, calling only triggerAutoRun() — a real behavioral difference worth locking in.
    resetDOM(`
      <div id="shieldSlot">
        <select class="equipped-shield-tier"></select>
      </div>
      <div id="shieldStorageList"></div>
    `);
    const equippedInstance = { shield_id: "OLD-ID", hit_points_modifier: -5 };
    state.selected.shields = [{ ...equippedInstance, is_equipped: true }];
    // Re-point selected.shields to the SAME object so mutation is observable.
    state.selected.shields[0] = equippedInstance;
    equippedInstance.is_equipped = true;

    const target = selectWithValue("equipped-shield-name", {}, "Broquel");
    handleShieldChange({ target });

    expect(equippedInstance.shield_id).toBe("SHIELD-DB-1");
    expect(equippedInstance.hit_points_modifier).toBe(0);
    expect(model.equipShield).not.toHaveBeenCalled();
    expect(render.renderEquippedShield).not.toHaveBeenCalled();
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);

    const tierSelect = document.querySelector(".equipped-shield-tier");
    expect(Array.from(tierSelect.options).map((o) => o.value)).toEqual([
      "I",
      "II",
    ]);
  });

  test("when nothing is equipped, calls equipShield() with the first tier and returns WITHOUT triggerAutoRun", () => {
    // Asymmetry: this branch returns right after equipShield(), skipping the triggerAutoRun() other branches reach — equipShield() presumably triggers its own update.
    state.selected.shields = [];
    const target = selectWithValue("equipped-shield-name", {}, "Broquel");

    handleShieldChange({ target });

    expect(model.equipShield).toHaveBeenCalledWith("SHIELD-DB-1", "MAT-000");
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("does nothing further when the chosen name matches no catalog row", () => {
    const target = selectWithValue(
      "equipped-shield-name",
      {},
      "Nome Inexistente",
    );
    handleShieldChange({ target });
    expect(model.equipShield).not.toHaveBeenCalled();
  });
});

describe("handleShieldChange — equipped-shield-tier", () => {
  test("no-ops when the sibling name <select> is missing", () => {
    const target = selectWithValue("equipped-shield-tier", {}, "I");
    expect(handleShieldChange({ target })).toBe(true);
    expect(model.equipShield).not.toHaveBeenCalled();
  });

  test("mutates the equipped instance in place when one exists (same asymmetry as name)", () => {
    resetDOM(`
      <div id="shieldSlot">
        <select class="equipped-shield-name"><option value="Broquel" selected>x</option></select>
      </div>
      <div id="shieldStorageList"></div>
    `);
    const equippedInstance = {
      shield_id: "SHIELD-DB-1",
      is_equipped: true,
      hit_points_modifier: -2,
    };
    state.selected.shields = [equippedInstance];
    const target = selectWithValue("equipped-shield-tier", {}, "II");

    handleShieldChange({ target });

    expect(equippedInstance.shield_id).toBe("SHIELD-DB-2");
    expect(equippedInstance.hit_points_modifier).toBe(0);
    expect(model.equipShield).not.toHaveBeenCalled();
  });
});

describe("handleShieldChange — material / storage / move", () => {
  test("equipped-shield-material sets material_id, resets hit_points_modifier, and DOES re-render", () => {
    const equipped = {
      is_equipped: true,
      material_id: "MAT-OLD",
      hit_points_modifier: -5,
    };
    state.selected.shields = [equipped];
    const target = selectWithValue("equipped-shield-material", {}, "MAT-001");

    handleShieldChange({ target });
    jest.advanceTimersToNextFrame();

    expect(equipped.material_id).toBe("MAT-001");
    expect(equipped.hit_points_modifier).toBe(0);
    expect(render.renderEquippedShield).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("shield-storage-select moves the item", () => {
    const target = selectWithValue(
      "shield-storage-select",
      { instanceId: "SHIELD-1" },
      "stash",
    );
    handleShieldChange({ target });
    expect(model.moveShield).toHaveBeenCalledWith("SHIELD-1", "stash");
  });

  test("equipped-shield-move to a destination unequips into storage", () => {
    const equipped = { is_equipped: true, storedAt: null };
    state.selected.shields = [equipped];
    const target = selectWithValue("equipped-shield-move", {}, "camp");

    handleShieldChange({ target });

    expect(equipped.is_equipped).toBe(false);
    expect(equipped.storedAt).toBe("camp");
  });

  test("equipped-shield-move with an empty destination confirms it stays equipped", () => {
    // The handler always operates on whichever shield is currently is_equipped: true — an empty destination re-affirms that, it doesn't restore a previously-unequipped one.
    const equipped = { is_equipped: true, storedAt: null };
    state.selected.shields = [equipped];
    const target = selectWithValue("equipped-shield-move", {}, "");

    handleShieldChange({ target });

    expect(equipped.is_equipped).toBe(true);
    expect(equipped.storedAt).toBeNull();
  });
});

test("handleShieldChange returns false for an unrelated change target", () => {
  const target = elWithClass("select", "something-else");
  expect(handleShieldChange({ target })).toBe(false);
});

describe("handleShieldChange — enchantments delegation", () => {
  test("an enchantment filter change delegates to the shared dispatch factory", () => {
    const target = elWithClass("select", "enchantment-type-select", {
      formKey: "SHIELD-1",
    });
    target.value = "SOME-ENCH";
    // findShieldByInstanceId (mocked truthy) confirms ownership; the actual Map-mutation is model.js internals covered elsewhere.
    expect(() => handleShieldChange({ target })).not.toThrow();
  });

  test("an enchantment filter change for a rejected ownership is not handled", () => {
    model.findShieldByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("select", "enchantment-type-select", {
      formKey: "SHIELD-1",
    });
    expect(handleShieldChange({ target })).toBe(false);
  });
});

describe("handleAddShield", () => {
  function buildAddForm({
    name = "Broquel",
    tier = "I",
    material = "Aço",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <select id="shieldNameSelect"><option value="${name}" selected>x</option></select>
      <select id="shieldTierSelect"><option value="${tier}" selected>x</option></select>
      <select id="shieldMaterialSelect"><option value="${material}" selected>x</option></select>
      <select id="shieldStorage"><option value="${storage}" selected>x</option></select>
    `);
  }

  test("does nothing when a required element is missing", () => {
    resetDOM(`<select id="shieldNameSelect"></select>`);
    expect(() => handleAddShield()).not.toThrow();
    expect(model.addStoredShield).not.toHaveBeenCalled();
  });

  test("does nothing when the name+tier combination doesn't match any catalog row", () => {
    buildAddForm({ tier: "III" });
    handleAddShield();
    expect(model.addStoredShield).not.toHaveBeenCalled();
  });

  test("adds the matching shield with its resolved material and chosen storage", () => {
    buildAddForm({ tier: "II", material: "Aço", storage: "stash" });
    handleAddShield();
    expect(model.addStoredShield).toHaveBeenCalledWith(
      "SHIELD-DB-2",
      "MAT-001",
      "stash",
    );
  });

  test("passes null when the chosen material doesn't match any catalog row", () => {
    buildAddForm({ material: "Material Inexistente" });
    handleAddShield();
    expect(model.addStoredShield).toHaveBeenCalledWith(
      "SHIELD-DB-1",
      null,
      "backpack",
    );
  });
});
