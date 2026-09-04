jest.mock("dev/public/js/engine/inventory/ranged/model.js", () => ({
  equipRanged: jest.fn(),
  addStoredRanged: jest.fn(),
  addEquippedRanged: jest.fn(),
  moveRanged: jest.fn(),
  removeRanged: jest.fn(),
  findRangedByInstanceId: jest.fn(),
  saveRangedCustomFields: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/ranged/render.js", () => ({
  renderEquippedRanged: jest.fn(),
  renderStoredRanged: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/melee/render.js", () => ({
  renderEquippedMelee: jest.fn(),
  renderStoredMelee: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/ranged/model.js";
import * as rangedRender from "dev/public/js/engine/inventory/ranged/render.js";
import * as meleeRender from "dev/public/js/engine/inventory/melee/render.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  handleRangedClick,
  handleRangedInput,
  handleRangedChange,
  handleAddRanged,
} from "dev/public/js/engine/inventory/ranged/events.js";
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
  resetDOM();
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();

  state.data.ranged_weapons = [
    {
      weapon_id: "RANGED-DB-1",
      weapon_name: "Arco Curto",
      weapon_tier: "I",
      weapon_hit_points: 8,
    },
    {
      weapon_id: "RANGED-DB-2",
      weapon_name: "Arco Curto",
      weapon_tier: "II",
      weapon_hit_points: 8,
    },
  ];
  state.data.materials = [{ material_id: "MAT-001", material_name: "Madeira" }];
  model.findRangedByInstanceId.mockReturnValue({ instance_id: "RANGED-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("handleRangedClick", () => {
  test("remove-ranged and remove-equipped-ranged both remove by instanceId", () => {
    const a = elWithClass("button", "remove-ranged", {
      instanceId: "RANGED-1",
    });
    expect(handleRangedClick({ target: a })).toBe(true);
    expect(model.removeRanged).toHaveBeenCalledWith("RANGED-1");

    const b = elWithClass("button", "remove-equipped-ranged", {
      instanceId: "RANGED-2",
    });
    handleRangedClick({ target: b });
    expect(model.removeRanged).toHaveBeenCalledWith("RANGED-2");
  });

  test("equip-stored-ranged delegates to the model's equipRanged()", () => {
    model.findRangedByInstanceId.mockReturnValue({
      weapon_id: "RANGED-DB-1",
      material_id: "MAT-001",
    });
    const target = elWithClass("button", "equip-stored-ranged", {
      instanceId: "RANGED-1",
    });

    expect(handleRangedClick({ target })).toBe(true);
    expect(model.equipRanged).toHaveBeenCalledWith(
      "RANGED-1",
      "RANGED-DB-1",
      "MAT-001",
    );
  });

  test("equip-stored-ranged falls back to MAT-000 when the stored instance has no material_id", () => {
    model.findRangedByInstanceId.mockReturnValue({ weapon_id: "RANGED-DB-1" });
    const target = elWithClass("button", "equip-stored-ranged", {
      instanceId: "RANGED-1",
    });
    handleRangedClick({ target });
    expect(model.equipRanged).toHaveBeenCalledWith(
      "RANGED-1",
      "RANGED-DB-1",
      "MAT-000",
    );
  });

  test("reports handled but does nothing when the stored instance can't be found", () => {
    model.findRangedByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "equip-stored-ranged", {
      instanceId: "GHOST",
    });
    expect(handleRangedClick({ target })).toBe(true);
    expect(model.equipRanged).not.toHaveBeenCalled();
  });

  test("custom-fields save reads the real editor DOM (real shared dispatch integration)", () => {
    resetDOM(`
      <div class="custom-fields-block" data-instance-id="RANGED-1">
        <input class="custom-fields-input-name" value="Arco Élfico" />
        <input class="custom-fields-input-description" value="Preciso" />
        <input class="custom-fields-input-effect" value="+1 alcance" />
      </div>
    `);
    const target = elWithClass("button", "custom-fields-save-btn", {
      instanceId: "RANGED-1",
    });

    handleRangedClick({ target });

    expect(model.saveRangedCustomFields).toHaveBeenCalledWith("RANGED-1", {
      name: "Arco Élfico",
      description: "Preciso",
      effect: "+1 alcance",
    });
  });

  test("an unrelated click target is not handled", () => {
    const target = elWithClass("button", "something-else");
    expect(handleRangedClick({ target })).toBe(false);
  });
});

describe("handleRangedInput", () => {
  test("no-ops (but handled) when the instance can't be found", () => {
    model.findRangedByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("input", "resume-ranged-hp", {
      instanceId: "GHOST",
    });
    target.value = "-2";
    expect(handleRangedInput({ target })).toBe(true);
  });

  test("allows a lone '-' mid-typing without mutating", () => {
    const instance = { weapon_id: "RANGED-DB-1", hit_points_modifier: 0 };
    model.findRangedByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "equipped-ranged-hp", {
      instanceId: "RANGED-1",
    });
    target.value = "-";
    handleRangedInput({ target });
    expect(instance.hit_points_modifier).toBe(0);
  });

  test("resume-ranged-hp clamps using real HP math and patches the resume display", () => {
    const instance = { weapon_id: "RANGED-DB-1", hit_points_modifier: 0 };
    model.findRangedByInstanceId.mockReturnValue(instance);
    resetDOM(`
      <table><tr><td>
        <input class="resume-ranged-hp" data-instance-id="RANGED-1" value="-999" />
        <span class="resume-hp-actual"></span>
      </td></tr></table>
    `);
    const target = document.querySelector(".resume-ranged-hp");

    handleRangedInput({ target });

    expect(instance.hit_points_modifier).toBe(-8); // clamped to -maxHp(8)
    expect(
      target.closest("td").querySelector(".resume-hp-actual").textContent,
    ).toBe("0");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("[documented asymmetry] does NOT mirror the HP modifier to a linked melee instance", () => {
    // Per ranged/events.js's own comment: only equip/storage moves mirror bidirectionally; HP-modifier inputs are melee -> ranged only, never the reverse — pre-existing, intentional behavior.
    const rangedInstance = { weapon_id: "RANGED-DB-1", hit_points_modifier: 0 };
    model.findRangedByInstanceId.mockReturnValue(rangedInstance);
    const linkedMelee = {
      _linkedInstanceId: "RANGED-1",
      hit_points_modifier: 0,
    };
    state.selected.melee_weapons = [linkedMelee];
    const target = elWithClass("input", "equipped-ranged-hp", {
      instanceId: "RANGED-1",
    });
    target.value = "-3";

    handleRangedInput({ target });

    expect(rangedInstance.hit_points_modifier).toBe(-3);
    expect(linkedMelee.hit_points_modifier).toBe(0); // untouched
  });

  test("debounces the eventual re-render, of ranged lists ONLY (not melee)", () => {
    const instance = { weapon_id: "RANGED-DB-1", hit_points_modifier: 0 };
    model.findRangedByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "stored-ranged-hp", {
      instanceId: "RANGED-1",
    });
    target.value = "-1";

    handleRangedInput({ target });
    jest.advanceTimersByTime(300);
    jest.advanceTimersToNextFrame();

    expect(rangedRender.renderEquippedRanged).toHaveBeenCalledTimes(1);
    expect(rangedRender.renderStoredRanged).toHaveBeenCalledTimes(1);
    expect(meleeRender.renderEquippedMelee).not.toHaveBeenCalled();
    expect(meleeRender.renderStoredMelee).not.toHaveBeenCalled();
  });

  test("an unrelated input target is not handled", () => {
    const target = elWithClass("input", "something-else");
    expect(handleRangedInput({ target })).toBe(false);
  });
});

describe("handleRangedChange — equipped-ranged-name / tier", () => {
  test("edits the instance in place, no equipRanged() call, no local render", () => {
    const instance = { weapon_id: "OLD-ID", hit_points_modifier: -5 };
    model.findRangedByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-ranged-name",
      { instanceId: "RANGED-1" },
      "Arco Curto",
    );

    handleRangedChange({ target });

    expect(instance.weapon_id).toBe("RANGED-DB-1");
    expect(instance.hit_points_modifier).toBe(0);
    expect(model.equipRanged).not.toHaveBeenCalled();
    expect(rangedRender.renderEquippedRanged).not.toHaveBeenCalled();
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("populates the tier <select> with the matching name's tiers", () => {
    resetDOM(
      `<select class="equipped-ranged-tier" data-instance-id="RANGED-1"></select>`,
    );
    model.findRangedByInstanceId.mockReturnValue({
      weapon_id: "X",
      hit_points_modifier: 0,
    });
    const target = selectWithValue(
      "equipped-ranged-name",
      { instanceId: "RANGED-1" },
      "Arco Curto",
    );

    handleRangedChange({ target });

    const tierSelect = document.querySelector(".equipped-ranged-tier");
    expect(Array.from(tierSelect.options).map((o) => o.value)).toEqual([
      "I",
      "II",
    ]);
  });

  test("equipped-ranged-tier requires the sibling name <select>", () => {
    resetDOM();
    model.findRangedByInstanceId.mockReturnValue({ weapon_id: "X" });
    const target = selectWithValue(
      "equipped-ranged-tier",
      { instanceId: "RANGED-1" },
      "I",
    );
    expect(handleRangedChange({ target })).toBe(true);
    expect(model.equipRanged).not.toHaveBeenCalled();
  });

  test("equipped-ranged-tier resolves the name+tier combination and edits in place", () => {
    resetDOM(`
      <select class="equipped-ranged-name" data-instance-id="RANGED-1">
        <option value="Arco Curto" selected>x</option>
      </select>
    `);
    const instance = { weapon_id: "RANGED-DB-1", hit_points_modifier: -1 };
    model.findRangedByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-ranged-tier",
      { instanceId: "RANGED-1" },
      "II",
    );

    handleRangedChange({ target });

    expect(instance.weapon_id).toBe("RANGED-DB-2");
    expect(instance.hit_points_modifier).toBe(0);
  });
});

describe("handleRangedChange — equipped-ranged-material", () => {
  test("sets material, resets HP modifier, re-renders ranged only (not melee)", () => {
    const instance = { material_id: "MAT-OLD", hit_points_modifier: -3 };
    model.findRangedByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-ranged-material",
      { instanceId: "RANGED-1" },
      "MAT-001",
    );

    handleRangedChange({ target });
    jest.advanceTimersToNextFrame();

    expect(instance.material_id).toBe("MAT-001");
    expect(instance.hit_points_modifier).toBe(0);
    expect(rangedRender.renderEquippedRanged).toHaveBeenCalledTimes(1);
    expect(meleeRender.renderEquippedMelee).not.toHaveBeenCalled();
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

describe("handleRangedChange — storage / move", () => {
  test("ranged-storage-select moves via the model function", () => {
    const target = selectWithValue(
      "ranged-storage-select",
      { instanceId: "RANGED-1" },
      "stash",
    );
    handleRangedChange({ target });
    expect(model.moveRanged).toHaveBeenCalledWith("RANGED-1", "stash");
  });

  test("equipped-ranged-move DOES mirror is_equipped/storedAt onto the linked melee instance and renders both", () => {
    const rangedInstance = { is_equipped: true, storedAt: null };
    model.findRangedByInstanceId.mockReturnValue(rangedInstance);
    const linkedMelee = {
      _linkedInstanceId: "RANGED-1",
      is_equipped: true,
      storedAt: null,
    };
    state.selected.melee_weapons = [linkedMelee];
    const target = selectWithValue(
      "equipped-ranged-move",
      { instanceId: "RANGED-1" },
      "camp",
    );

    handleRangedChange({ target });
    jest.advanceTimersToNextFrame();

    expect(rangedInstance.is_equipped).toBe(false);
    expect(rangedInstance.storedAt).toBe("camp");
    expect(linkedMelee.is_equipped).toBe(false);
    expect(linkedMelee.storedAt).toBe("camp");
    expect(rangedRender.renderEquippedRanged).toHaveBeenCalledTimes(1);
    expect(meleeRender.renderEquippedMelee).toHaveBeenCalledTimes(1);
  });

  test("mirrors via rangedInstance._linkedInstanceId direction too (we point at melee)", () => {
    const rangedInstance = {
      is_equipped: true,
      storedAt: null,
      _linkedInstanceId: "MELEE-1",
    };
    model.findRangedByInstanceId.mockReturnValue(rangedInstance);
    const linkedMelee = {
      _instanceId: "MELEE-1",
      is_equipped: true,
      storedAt: null,
    };
    state.selected.melee_weapons = [linkedMelee];
    const target = selectWithValue(
      "equipped-ranged-move",
      { instanceId: "RANGED-1" },
      "stash",
    );

    handleRangedChange({ target });

    expect(linkedMelee.storedAt).toBe("stash");
  });

  test("with no link, melee_weapons is left untouched", () => {
    const rangedInstance = { is_equipped: true, storedAt: null };
    model.findRangedByInstanceId.mockReturnValue(rangedInstance);
    const unrelatedMelee = { is_equipped: true, storedAt: null };
    state.selected.melee_weapons = [unrelatedMelee];
    const target = selectWithValue(
      "equipped-ranged-move",
      { instanceId: "RANGED-1" },
      "camp",
    );

    handleRangedChange({ target });

    expect(unrelatedMelee.is_equipped).toBe(true); // untouched
  });
});

test("handleRangedChange returns false for an unrelated change target", () => {
  const target = elWithClass("select", "something-else");
  expect(handleRangedChange({ target })).toBe(false);
});

describe("handleAddRanged", () => {
  function buildAddForm({
    name = "Arco Curto",
    tier = "I",
    material = "Madeira",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <select id="rangedNameSelect"><option value="${name}" selected>x</option></select>
      <select id="rangedTierSelect"><option value="${tier}" selected>x</option></select>
      <select id="rangedMaterialSelect"><option value="${material}" selected>x</option></select>
      <select id="rangedStorage"><option value="${storage}" selected>x</option></select>
    `);
  }

  test("does nothing when a required element is missing", () => {
    resetDOM(`<select id="rangedNameSelect"></select>`);
    expect(() => handleAddRanged()).not.toThrow();
    expect(model.addStoredRanged).not.toHaveBeenCalled();
  });

  test("does nothing when the name+tier combination doesn't match any catalog row", () => {
    buildAddForm({ tier: "III" });
    handleAddRanged();
    expect(model.addStoredRanged).not.toHaveBeenCalled();
  });

  test("adds as equipped when storage is 'equipped'", () => {
    buildAddForm({ tier: "II", material: "Madeira", storage: "equipped" });
    handleAddRanged();
    expect(model.addEquippedRanged).toHaveBeenCalledWith(
      "RANGED-DB-2",
      "MAT-001",
    );
    expect(model.addStoredRanged).not.toHaveBeenCalled();
  });

  test("adds as stored, at the chosen location, otherwise", () => {
    buildAddForm({ storage: "stash" });
    handleAddRanged();
    expect(model.addStoredRanged).toHaveBeenCalledWith(
      "RANGED-DB-1",
      "MAT-001",
      "stash",
    );
  });

  test("passes null material when the chosen material doesn't match any catalog row", () => {
    buildAddForm({ material: "Material Inexistente" });
    handleAddRanged();
    expect(model.addStoredRanged).toHaveBeenCalledWith(
      "RANGED-DB-1",
      null,
      "backpack",
    );
  });
});
