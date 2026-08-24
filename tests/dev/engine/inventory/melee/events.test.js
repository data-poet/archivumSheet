jest.mock("dev/public/js/engine/inventory/melee/model.js", () => ({
  equipMelee: jest.fn(),
  addStoredMelee: jest.fn(),
  addEquippedMelee: jest.fn(),
  moveMelee: jest.fn(),
  removeMelee: jest.fn(),
  findMeleeByInstanceId: jest.fn(),
  saveMeleeCustomFields: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/melee/render.js", () => ({
  renderEquippedMelee: jest.fn(),
  renderStoredMelee: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/ranged/render.js", () => ({
  renderEquippedRanged: jest.fn(),
  renderStoredRanged: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/melee/model.js";
import * as meleeRender from "dev/public/js/engine/inventory/melee/render.js";
import * as rangedRender from "dev/public/js/engine/inventory/ranged/render.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  handleMeleeClick,
  handleMeleeInput,
  handleMeleeChange,
  handleAddMelee,
} from "dev/public/js/engine/inventory/melee/events.js";
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

  state.data.melee_weapons = [
    {
      weapon_id: "MELEE-DB-1",
      weapon_name: "Espada Longa",
      weapon_tier: "I",
      weapon_hit_points: 10,
    },
    {
      weapon_id: "MELEE-DB-2",
      weapon_name: "Espada Longa",
      weapon_tier: "II",
      weapon_hit_points: 10,
    },
  ];
  state.data.materials = [{ material_id: "MAT-001", material_name: "Aço" }];
  model.findMeleeByInstanceId.mockReturnValue({ instance_id: "MELEE-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────
// handleMeleeClick
// ─────────────────────────────────────────────────────────────────────────
describe("handleMeleeClick", () => {
  test("remove-melee and remove-equipped-melee both remove by instanceId", () => {
    const a = elWithClass("button", "remove-melee", { instanceId: "MELEE-1" });
    expect(handleMeleeClick({ target: a })).toBe(true);
    expect(model.removeMelee).toHaveBeenCalledWith("MELEE-1");

    const b = elWithClass("button", "remove-equipped-melee", {
      instanceId: "MELEE-2",
    });
    handleMeleeClick({ target: b });
    expect(model.removeMelee).toHaveBeenCalledWith("MELEE-2");
  });

  test("equip-stored-melee delegates entirely to the model's equipMelee()", () => {
    model.findMeleeByInstanceId.mockReturnValue({
      weapon_id: "MELEE-DB-1",
      material_id: "MAT-001",
    });
    const target = elWithClass("button", "equip-stored-melee", {
      instanceId: "MELEE-1",
    });

    expect(handleMeleeClick({ target })).toBe(true);
    expect(model.equipMelee).toHaveBeenCalledWith(
      "MELEE-1",
      "MELEE-DB-1",
      "MAT-001",
    );
  });

  test("equip-stored-melee falls back to MAT-000 when the stored instance has no material_id", () => {
    model.findMeleeByInstanceId.mockReturnValue({ weapon_id: "MELEE-DB-1" });
    const target = elWithClass("button", "equip-stored-melee", {
      instanceId: "MELEE-1",
    });
    handleMeleeClick({ target });
    expect(model.equipMelee).toHaveBeenCalledWith(
      "MELEE-1",
      "MELEE-DB-1",
      "MAT-000",
    );
  });

  test("reports handled but does nothing when the stored instance can't be found", () => {
    model.findMeleeByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "equip-stored-melee", {
      instanceId: "GHOST",
    });
    expect(handleMeleeClick({ target })).toBe(true);
    expect(model.equipMelee).not.toHaveBeenCalled();
  });

  test("custom-fields save reads the real editor DOM (real shared dispatch integration)", () => {
    resetDOM(`
      <div class="custom-fields-block" data-instance-id="MELEE-1">
        <input class="custom-fields-input-name" value="Excalibur" />
        <input class="custom-fields-input-description" value="Lendária" />
        <input class="custom-fields-input-effect" value="+2 dano" />
      </div>
    `);
    const target = elWithClass("button", "custom-fields-save-btn", {
      instanceId: "MELEE-1",
    });

    handleMeleeClick({ target });

    expect(model.saveMeleeCustomFields).toHaveBeenCalledWith("MELEE-1", {
      name: "Excalibur",
      description: "Lendária",
      effect: "+2 dano",
    });
  });

  test("an unrelated click target is not handled", () => {
    const target = elWithClass("button", "something-else");
    expect(handleMeleeClick({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleMeleeInput — HP modifiers + dual-use mirroring to ranged
// ─────────────────────────────────────────────────────────────────────────
describe("handleMeleeInput", () => {
  test("no-ops (but handled) when the instance can't be found", () => {
    model.findMeleeByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("input", "resume-melee-hp", {
      instanceId: "GHOST",
    });
    target.value = "-2";
    expect(handleMeleeInput({ target })).toBe(true);
  });

  test("allows a lone '-' mid-typing without mutating", () => {
    const instance = { weapon_id: "MELEE-DB-1", hit_points_modifier: 0 };
    model.findMeleeByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "equipped-melee-hp", {
      instanceId: "MELEE-1",
    });
    target.value = "-";
    handleMeleeInput({ target });
    expect(instance.hit_points_modifier).toBe(0);
  });

  test("resume-melee-hp clamps using real HP math and patches the resume display", () => {
    const instance = { weapon_id: "MELEE-DB-1", hit_points_modifier: 0 };
    model.findMeleeByInstanceId.mockReturnValue(instance);
    resetDOM(`
      <table><tr><td>
        <input class="resume-melee-hp" data-instance-id="MELEE-1" value="-999" />
        <span class="resume-hp-actual"></span>
      </td></tr></table>
    `);
    const target = document.querySelector(".resume-melee-hp");

    handleMeleeInput({ target });

    expect(instance.hit_points_modifier).toBe(-10); // clamped to -maxHp(10)
    expect(
      target.closest("td").querySelector(".resume-hp-actual").textContent,
    ).toBe("0");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("equipped-melee-hp patches the .hp-modifier block's second <strong>", () => {
    const instance = { weapon_id: "MELEE-DB-1", hit_points_modifier: 0 };
    model.findMeleeByInstanceId.mockReturnValue(instance);
    resetDOM(`
      <div class="hp-modifier">
        <strong>x</strong>
        <input class="equipped-melee-hp" data-instance-id="MELEE-1" value="-3" />
        <strong>x</strong>
      </div>
    `);
    const target = document.querySelector(".equipped-melee-hp");

    handleMeleeInput({ target });

    const strongs = target.closest(".hp-modifier").querySelectorAll("strong");
    expect(strongs[1].textContent).toBe("7"); // 10 - 3
  });

  test("mirrors the HP modifier to a linked ranged instance found via r._linkedInstanceId (ranged points at us)", () => {
    const meleeInstance = { weapon_id: "MELEE-DB-1", hit_points_modifier: 0 };
    model.findMeleeByInstanceId.mockReturnValue(meleeInstance);
    const linkedRanged = {
      _linkedInstanceId: "MELEE-1",
      hit_points_modifier: 0,
    };
    state.selected.ranged_weapons = [linkedRanged];
    const target = elWithClass("input", "equipped-melee-hp", {
      instanceId: "MELEE-1",
    });
    target.value = "-4";

    handleMeleeInput({ target });

    expect(linkedRanged.hit_points_modifier).toBe(-4);
  });

  test("mirrors the HP modifier via meleeInstance._linkedInstanceId (we point at ranged)", () => {
    const meleeInstance = {
      weapon_id: "MELEE-DB-1",
      hit_points_modifier: 0,
      _linkedInstanceId: "RANGED-1",
    };
    model.findMeleeByInstanceId.mockReturnValue(meleeInstance);
    const linkedRanged = { _instanceId: "RANGED-1", hit_points_modifier: 0 };
    state.selected.ranged_weapons = [linkedRanged];
    const target = elWithClass("input", "equipped-melee-hp", {
      instanceId: "MELEE-1",
    });
    target.value = "-2";

    handleMeleeInput({ target });

    expect(linkedRanged.hit_points_modifier).toBe(-2);
  });

  test("does not touch ranged_weapons when there's no link at all", () => {
    const meleeInstance = { weapon_id: "MELEE-DB-1", hit_points_modifier: 0 };
    model.findMeleeByInstanceId.mockReturnValue(meleeInstance);
    const unrelatedRanged = { hit_points_modifier: 5 };
    state.selected.ranged_weapons = [unrelatedRanged];
    const target = elWithClass("input", "equipped-melee-hp", {
      instanceId: "MELEE-1",
    });
    target.value = "-2";

    handleMeleeInput({ target });

    expect(unrelatedRanged.hit_points_modifier).toBe(5); // untouched
  });

  test("debounces the eventual re-render (of BOTH melee and ranged lists) by 300ms", () => {
    const instance = { weapon_id: "MELEE-DB-1", hit_points_modifier: 0 };
    model.findMeleeByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "stored-melee-hp", {
      instanceId: "MELEE-1",
    });
    target.value = "-1";

    handleMeleeInput({ target });
    expect(meleeRender.renderEquippedMelee).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    jest.advanceTimersToNextFrame();

    expect(meleeRender.renderEquippedMelee).toHaveBeenCalledTimes(1);
    expect(meleeRender.renderStoredMelee).toHaveBeenCalledTimes(1);
    expect(rangedRender.renderEquippedRanged).toHaveBeenCalledTimes(1);
    expect(rangedRender.renderStoredRanged).toHaveBeenCalledTimes(1);
  });

  test("an unrelated input target is not handled", () => {
    const target = elWithClass("input", "something-else");
    expect(handleMeleeInput({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleMeleeChange
// ─────────────────────────────────────────────────────────────────────────
describe("handleMeleeChange — equipped-melee-name / tier", () => {
  test("edits the instance in place (no equipMelee() call, no local render, no ranged mirror)", () => {
    const instance = { weapon_id: "OLD-ID", hit_points_modifier: -5 };
    model.findMeleeByInstanceId.mockReturnValue(instance);
    const linkedRanged = {
      _linkedInstanceId: "MELEE-1",
      weapon_id: "UNTOUCHED",
    };
    state.selected.ranged_weapons = [linkedRanged];
    const target = selectWithValue(
      "equipped-melee-name",
      { instanceId: "MELEE-1" },
      "Espada Longa",
    );

    handleMeleeChange({ target });

    expect(instance.weapon_id).toBe("MELEE-DB-1");
    expect(instance.hit_points_modifier).toBe(0);
    expect(model.equipMelee).not.toHaveBeenCalled();
    expect(meleeRender.renderEquippedMelee).not.toHaveBeenCalled();
    // Name/tier changes are explicitly NOT part of the dual-use sync scope
    // (only HP and equip/storage location are mirrored) — the linked
    // ranged instance's weapon_id must be untouched.
    expect(linkedRanged.weapon_id).toBe("UNTOUCHED");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("populates the tier <select> with the matching name's tiers", () => {
    resetDOM(
      `<select class="equipped-melee-tier" data-instance-id="MELEE-1"></select>`,
    );
    model.findMeleeByInstanceId.mockReturnValue({
      weapon_id: "X",
      hit_points_modifier: 0,
    });
    const target = selectWithValue(
      "equipped-melee-name",
      { instanceId: "MELEE-1" },
      "Espada Longa",
    );

    handleMeleeChange({ target });

    const tierSelect = document.querySelector(".equipped-melee-tier");
    expect(Array.from(tierSelect.options).map((o) => o.value)).toEqual([
      "I",
      "II",
    ]);
  });

  test("equipped-melee-tier requires the sibling name <select>", () => {
    resetDOM(); // no .equipped-melee-name present
    model.findMeleeByInstanceId.mockReturnValue({ weapon_id: "X" });
    const target = selectWithValue(
      "equipped-melee-tier",
      { instanceId: "MELEE-1" },
      "I",
    );
    expect(handleMeleeChange({ target })).toBe(true);
    expect(model.equipMelee).not.toHaveBeenCalled();
  });

  test("equipped-melee-tier resolves the name+tier combination and edits in place", () => {
    resetDOM(`
      <select class="equipped-melee-name" data-instance-id="MELEE-1">
        <option value="Espada Longa" selected>x</option>
      </select>
    `);
    const instance = { weapon_id: "MELEE-DB-1", hit_points_modifier: -1 };
    model.findMeleeByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-melee-tier",
      { instanceId: "MELEE-1" },
      "II",
    );

    handleMeleeChange({ target });

    expect(instance.weapon_id).toBe("MELEE-DB-2");
    expect(instance.hit_points_modifier).toBe(0);
  });
});

describe("handleMeleeChange — equipped-melee-material", () => {
  test("sets material, resets HP modifier, re-renders melee only (not ranged)", () => {
    const instance = { material_id: "MAT-OLD", hit_points_modifier: -3 };
    model.findMeleeByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-melee-material",
      { instanceId: "MELEE-1" },
      "MAT-001",
    );

    handleMeleeChange({ target });
    jest.advanceTimersToNextFrame();

    expect(instance.material_id).toBe("MAT-001");
    expect(instance.hit_points_modifier).toBe(0);
    expect(meleeRender.renderEquippedMelee).toHaveBeenCalledTimes(1);
    expect(rangedRender.renderEquippedRanged).not.toHaveBeenCalled();
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

describe("handleMeleeChange — storage / move", () => {
  test("melee-storage-select moves via the model function", () => {
    const target = selectWithValue(
      "melee-storage-select",
      { instanceId: "MELEE-1" },
      "stash",
    );
    handleMeleeChange({ target });
    expect(model.moveMelee).toHaveBeenCalledWith("MELEE-1", "stash");
  });

  test("equipped-melee-move mirrors is_equipped/storedAt onto the linked ranged instance and renders both", () => {
    const meleeInstance = { is_equipped: true, storedAt: null };
    model.findMeleeByInstanceId.mockReturnValue(meleeInstance);
    const linkedRanged = {
      _linkedInstanceId: "MELEE-1",
      is_equipped: true,
      storedAt: null,
    };
    state.selected.ranged_weapons = [linkedRanged];
    const target = selectWithValue(
      "equipped-melee-move",
      { instanceId: "MELEE-1" },
      "camp",
    );

    handleMeleeChange({ target });
    jest.advanceTimersToNextFrame();

    expect(meleeInstance.is_equipped).toBe(false);
    expect(meleeInstance.storedAt).toBe("camp");
    expect(linkedRanged.is_equipped).toBe(false);
    expect(linkedRanged.storedAt).toBe("camp");
    expect(meleeRender.renderEquippedMelee).toHaveBeenCalledTimes(1);
    expect(rangedRender.renderEquippedRanged).toHaveBeenCalledTimes(1);
  });

  test("equipped-melee-move with no link leaves ranged_weapons untouched", () => {
    const meleeInstance = { is_equipped: true, storedAt: null };
    model.findMeleeByInstanceId.mockReturnValue(meleeInstance);
    const unrelatedRanged = { is_equipped: true, storedAt: null };
    state.selected.ranged_weapons = [unrelatedRanged];
    const target = selectWithValue(
      "equipped-melee-move",
      { instanceId: "MELEE-1" },
      "camp",
    );

    handleMeleeChange({ target });

    expect(unrelatedRanged.is_equipped).toBe(true); // untouched
  });
});

test("handleMeleeChange returns false for an unrelated change target", () => {
  const target = elWithClass("select", "something-else");
  expect(handleMeleeChange({ target })).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────
// handleAddMelee
// ─────────────────────────────────────────────────────────────────────────
describe("handleAddMelee", () => {
  function buildAddForm({
    name = "Espada Longa",
    tier = "I",
    material = "Aço",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <select id="meleeNameSelect"><option value="${name}" selected>x</option></select>
      <select id="meleeTierSelect"><option value="${tier}" selected>x</option></select>
      <select id="meleeMaterialSelect"><option value="${material}" selected>x</option></select>
      <select id="meleeStorage"><option value="${storage}" selected>x</option></select>
    `);
  }

  test("does nothing when a required element is missing", () => {
    resetDOM(`<select id="meleeNameSelect"></select>`);
    expect(() => handleAddMelee()).not.toThrow();
    expect(model.addStoredMelee).not.toHaveBeenCalled();
  });

  test("does nothing when the name+tier combination doesn't match any catalog row", () => {
    buildAddForm({ tier: "III" });
    handleAddMelee();
    expect(model.addStoredMelee).not.toHaveBeenCalled();
  });

  test("adds as equipped when storage is 'equipped'", () => {
    buildAddForm({ tier: "II", material: "Aço", storage: "equipped" });
    handleAddMelee();
    expect(model.addEquippedMelee).toHaveBeenCalledWith(
      "MELEE-DB-2",
      "MAT-001",
    );
    expect(model.addStoredMelee).not.toHaveBeenCalled();
  });

  test("adds as stored, at the chosen location, otherwise", () => {
    buildAddForm({ storage: "stash" });
    handleAddMelee();
    expect(model.addStoredMelee).toHaveBeenCalledWith(
      "MELEE-DB-1",
      "MAT-001",
      "stash",
    );
  });

  test("passes null material when the chosen material doesn't match any catalog row", () => {
    buildAddForm({ material: "Material Inexistente" });
    handleAddMelee();
    expect(model.addStoredMelee).toHaveBeenCalledWith(
      "MELEE-DB-1",
      null,
      "backpack",
    );
  });
});
