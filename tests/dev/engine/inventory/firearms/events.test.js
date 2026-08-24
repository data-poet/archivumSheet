jest.mock("dev/public/js/engine/inventory/firearms/model.js", () => ({
  equipFirearm: jest.fn(),
  moveFirearm: jest.fn(),
  removeFirearm: jest.fn(),
  findFirearmByInstanceId: jest.fn(),
  reloadFirearm: jest.fn(),
  addEquippedFirearm: jest.fn(),
  addStoredFirearm: jest.fn(),
  saveFirearmCustomFields: jest.fn(),
  // computeFinalMagazineSize is intentionally NOT mocked — it's pure and
  // imported directly by events.js, so using the real implementation
  // exercises genuine clamp-bound math instead of an arbitrary stub.
  computeFinalMagazineSize: jest.requireActual(
    "dev/public/js/engine/inventory/firearms/model.js",
  ).computeFinalMagazineSize,
}));
jest.mock("dev/public/js/engine/inventory/firearms/render.js", () => ({
  renderEquippedFirearms: jest.fn(),
  renderStoredFirearms: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/firearms/model.js";
import * as render from "dev/public/js/engine/inventory/firearms/render.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  handleFirearmClick,
  handleFirearmInput,
  handleFirearmChange,
  handleAddFirearm,
} from "dev/public/js/engine/inventory/firearms/events.js";
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

  state.data.firearms = [
    {
      weapon_id: "FIREARM-DB-1",
      weapon_name: "Pistola",
      weapon_tier: "I",
      weapon_hit_points: 6,
      weapon_magazine_size: 8,
      weapon_gdp_modifier: 2,
      weapon_tr: 10,
      weapon_prec: 1,
    },
    {
      weapon_id: "FIREARM-DB-2",
      weapon_name: "Pistola",
      weapon_tier: "II",
      weapon_hit_points: 6,
      weapon_magazine_size: 10,
    },
  ];
  state.data.materials = [{ material_id: "MAT-001", material_name: "Aço" }];
  model.findFirearmByInstanceId.mockReturnValue({ instance_id: "FIREARM-1" });
});

afterEach(() => {
  jest.useRealTimers();
});

// ─────────────────────────────────────────────────────────────────────────
// handleFirearmClick
// ─────────────────────────────────────────────────────────────────────────
describe("handleFirearmClick", () => {
  test("remove-firearm and remove-equipped-firearm both remove by instanceId", () => {
    const a = elWithClass("button", "remove-firearm", {
      instanceId: "FIREARM-1",
    });
    expect(handleFirearmClick({ target: a })).toBe(true);
    expect(model.removeFirearm).toHaveBeenCalledWith("FIREARM-1");

    const b = elWithClass("button", "remove-equipped-firearm", {
      instanceId: "FIREARM-2",
    });
    handleFirearmClick({ target: b });
    expect(model.removeFirearm).toHaveBeenCalledWith("FIREARM-2");
  });

  test("equip-stored-firearm equips using the found instance's weapon/material", () => {
    model.findFirearmByInstanceId.mockReturnValue({
      weapon_id: "FIREARM-DB-1",
      material_id: "MAT-001",
    });
    const target = elWithClass("button", "equip-stored-firearm", {
      instanceId: "FIREARM-1",
    });
    expect(handleFirearmClick({ target })).toBe(true);
    expect(model.equipFirearm).toHaveBeenCalledWith(
      "FIREARM-1",
      "FIREARM-DB-1",
      "MAT-001",
    );
  });

  test("equip-stored-firearm falls back to null (not 'MAT-000') when no material_id is set", () => {
    // Unlike armor/melee/ranged/shield's "MAT-000" default, firearms falls
    // back to null here — matching handleAddFirearm's own null fallback.
    model.findFirearmByInstanceId.mockReturnValue({
      weapon_id: "FIREARM-DB-1",
    });
    const target = elWithClass("button", "equip-stored-firearm", {
      instanceId: "FIREARM-1",
    });
    handleFirearmClick({ target });
    expect(model.equipFirearm).toHaveBeenCalledWith(
      "FIREARM-1",
      "FIREARM-DB-1",
      null,
    );
  });

  test("reports handled but does nothing when the stored firearm can't be found", () => {
    model.findFirearmByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("button", "equip-stored-firearm", {
      instanceId: "GHOST",
    });
    expect(handleFirearmClick({ target })).toBe(true);
    expect(model.equipFirearm).not.toHaveBeenCalled();
  });

  test("reload-firearm and resume-reload-firearm both reload by instanceId", () => {
    const a = elWithClass("button", "reload-firearm", {
      instanceId: "FIREARM-1",
    });
    expect(handleFirearmClick({ target: a })).toBe(true);
    expect(model.reloadFirearm).toHaveBeenCalledWith("FIREARM-1");

    const b = elWithClass("button", "resume-reload-firearm", {
      instanceId: "FIREARM-2",
    });
    handleFirearmClick({ target: b });
    expect(model.reloadFirearm).toHaveBeenCalledWith("FIREARM-2");
  });

  test("custom-fields save is synchronous (wrapped directly by snapshotAll/restoreAll, no rAF)", () => {
    resetDOM(`
      <div class="custom-fields-block" data-instance-id="FIREARM-1">
        <input class="custom-fields-input-name" value="Justiceira" />
        <input class="custom-fields-input-description" value="Confiável" />
        <input class="custom-fields-input-effect" value="+1 TR" />
      </div>
    `);
    const target = elWithClass("button", "custom-fields-save-btn", {
      instanceId: "FIREARM-1",
    });

    const result = handleFirearmClick({ target });

    expect(result).toBe(true);
    expect(model.saveFirearmCustomFields).toHaveBeenCalledWith("FIREARM-1", {
      name: "Justiceira",
      description: "Confiável",
      effect: "+1 TR",
    });
  });

  test("custom-fields edit routes through the rAF-deferred _renderFirearmLists", () => {
    resetDOM(
      `<div class="custom-fields-block" data-instance-id="FIREARM-1"></div>`,
    );
    const target = elWithClass("button", "custom-fields-edit-btn", {
      instanceId: "FIREARM-1",
    });

    handleFirearmClick({ target });
    jest.advanceTimersToNextFrame();

    expect(render.renderEquippedFirearms).toHaveBeenCalledTimes(1);
    expect(render.renderStoredFirearms).toHaveBeenCalledTimes(1);
  });

  test("an unrelated click target is not handled", () => {
    const target = elWithClass("button", "something-else");
    expect(handleFirearmClick({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleFirearmInput — HP
// ─────────────────────────────────────────────────────────────────────────
describe("handleFirearmInput — HP modifiers", () => {
  test("no-ops (but handled) when the instance can't be found", () => {
    model.findFirearmByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("input", "resume-firearm-hp", {
      instanceId: "GHOST",
    });
    target.value = "-1";
    expect(handleFirearmInput({ target })).toBe(true);
  });

  test("allows a lone '-' mid-typing without mutating", () => {
    const instance = { weapon_id: "FIREARM-DB-1", hit_points_modifier: 0 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "equipped-firearm-hp", {
      instanceId: "FIREARM-1",
    });
    target.value = "-";
    handleFirearmInput({ target });
    expect(instance.hit_points_modifier).toBe(0);
  });

  test("resume-firearm-hp clamps using real HP math and patches the resume display", () => {
    const instance = { weapon_id: "FIREARM-DB-1", hit_points_modifier: 0 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    resetDOM(`
      <table><tr><td>
        <input class="resume-firearm-hp" data-instance-id="FIREARM-1" value="-999" />
        <span class="resume-hp-actual"></span>
      </td></tr></table>
    `);
    const target = document.querySelector(".resume-firearm-hp");

    handleFirearmInput({ target });

    expect(instance.hit_points_modifier).toBe(-6); // clamped to -maxHp(6)
    expect(
      target.closest("td").querySelector(".resume-hp-actual").textContent,
    ).toBe("0");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("equipped-firearm-hp / stored-firearm-hp both patch the .hp-modifier block's second <strong>", () => {
    const instance = { weapon_id: "FIREARM-DB-1", hit_points_modifier: 0 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    resetDOM(`
      <div class="hp-modifier">
        <strong>x</strong>
        <input class="stored-firearm-hp" data-instance-id="FIREARM-1" value="-2" />
        <strong>x</strong>
      </div>
    `);
    const target = document.querySelector(".stored-firearm-hp");

    handleFirearmInput({ target });

    const strongs = target.closest(".hp-modifier").querySelectorAll("strong");
    expect(strongs[1].textContent).toBe("4"); // 6 - 2
  });

  test("debounces the eventual re-render by 300ms", () => {
    const instance = { weapon_id: "FIREARM-DB-1", hit_points_modifier: 0 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "equipped-firearm-hp", {
      instanceId: "FIREARM-1",
    });
    target.value = "-1";

    handleFirearmInput({ target });
    expect(render.renderEquippedFirearms).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    jest.advanceTimersToNextFrame();

    expect(render.renderEquippedFirearms).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleFirearmInput — rounds loaded (magazine clamp)
// ─────────────────────────────────────────────────────────────────────────
describe("handleFirearmInput — rounds loaded", () => {
  test("allows an empty value mid-typing without mutating", () => {
    const instance = { weapon_id: "FIREARM-DB-1", rounds_loaded: 5 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "resume-firearm-rounds", {
      instanceId: "FIREARM-1",
    });
    target.value = "";
    handleFirearmInput({ target });
    expect(instance.rounds_loaded).toBe(5);
  });

  test("clamps to the real computed magazine size (base + modifier)", () => {
    const instance = {
      weapon_id: "FIREARM-DB-1",
      magazine_size_modifier: 2, // real max = 8 + 2 = 10
    };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "equipped-firearm-rounds", {
      instanceId: "FIREARM-1",
    });
    target.value = "999";

    handleFirearmInput({ target });

    expect(instance.rounds_loaded).toBe(10);
  });

  test("clamps a negative value up to 0", () => {
    const instance = { weapon_id: "FIREARM-DB-1" };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "stored-firearm-rounds", {
      instanceId: "FIREARM-1",
    });
    target.value = "-5";

    handleFirearmInput({ target });

    expect(instance.rounds_loaded).toBe(0);
  });

  test("falls back to 0 for an unparsable value", () => {
    const instance = { weapon_id: "FIREARM-DB-1" };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "equipped-firearm-rounds", {
      instanceId: "FIREARM-1",
    });
    target.value = "abc";

    handleFirearmInput({ target });

    expect(instance.rounds_loaded).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleFirearmInput — TUNING_FIELDS generic dispatch (gdp/tr/prec/magazine-mod)
// ─────────────────────────────────────────────────────────────────────────
describe("handleFirearmInput — tuning fields", () => {
  test("equipped-firearm-gdp sets gdp_modifier and patches the single-value display", () => {
    const instance = { weapon_id: "FIREARM-DB-1", gdp_modifier: 0 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    resetDOM(`
      <div class="hp-modifier">
        <input class="equipped-firearm-gdp" data-instance-id="FIREARM-1" value="3" />
        <strong>x</strong>
      </div>
    `);
    const target = document.querySelector(".equipped-firearm-gdp");

    handleFirearmInput({ target });

    expect(instance.gdp_modifier).toBe(3);
    // weapon_gdp_modifier base is 2 -> displayed actual = 2 + 3 = 5
    expect(
      target.closest(".hp-modifier").querySelector("strong").textContent,
    ).toBe("5");
  });

  test("stored-firearm-tr sets tr_modifier independently of gdp", () => {
    const instance = {
      weapon_id: "FIREARM-DB-1",
      tr_modifier: 0,
      gdp_modifier: 99,
    };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "stored-firearm-tr", {
      instanceId: "FIREARM-1",
    });
    target.value = "1";

    handleFirearmInput({ target });

    expect(instance.tr_modifier).toBe(1);
    expect(instance.gdp_modifier).toBe(99); // untouched
  });

  test("allows '-' and '' mid-typing without mutating", () => {
    const instance = { weapon_id: "FIREARM-DB-1", prec_modifier: 0 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "equipped-firearm-prec", {
      instanceId: "FIREARM-1",
    });

    target.value = "-";
    handleFirearmInput({ target });
    target.value = "";
    handleFirearmInput({ target });

    expect(instance.prec_modifier).toBe(0);
  });

  test("falls back to 0 for an unparsable value", () => {
    const instance = { weapon_id: "FIREARM-DB-1", magazine_size_modifier: 0 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = elWithClass("input", "equipped-firearm-magazine-mod", {
      instanceId: "FIREARM-1",
    });
    target.value = "abc";

    handleFirearmInput({ target });

    expect(instance.magazine_size_modifier).toBe(0);
  });

  test("no-ops (but handled) when the instance can't be found", () => {
    model.findFirearmByInstanceId.mockReturnValue(undefined);
    const target = elWithClass("input", "equipped-firearm-gdp", {
      instanceId: "GHOST",
    });
    target.value = "3";
    expect(handleFirearmInput({ target })).toBe(true);
  });
});

test("handleFirearmInput returns false for an unrelated input target", () => {
  const target = elWithClass("input", "something-else");
  expect(handleFirearmInput({ target })).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────
// handleFirearmChange
// ─────────────────────────────────────────────────────────────────────────
describe("handleFirearmChange — equipped-firearm-name / tier", () => {
  test("edits the instance in place — no equipFirearm() call, no local render", () => {
    const instance = { weapon_id: "OLD-ID", hit_points_modifier: -5 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-firearm-name",
      { instanceId: "FIREARM-1" },
      "Pistola",
    );

    handleFirearmChange({ target });

    expect(instance.weapon_id).toBe("FIREARM-DB-1");
    expect(instance.hit_points_modifier).toBe(0);
    expect(model.equipFirearm).not.toHaveBeenCalled();
    expect(render.renderEquippedFirearms).not.toHaveBeenCalled();
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("populates the tier <select> with the matching name's tiers", () => {
    resetDOM(
      `<select class="equipped-firearm-tier" data-instance-id="FIREARM-1"></select>`,
    );
    model.findFirearmByInstanceId.mockReturnValue({
      weapon_id: "X",
      hit_points_modifier: 0,
    });
    const target = selectWithValue(
      "equipped-firearm-name",
      { instanceId: "FIREARM-1" },
      "Pistola",
    );

    handleFirearmChange({ target });

    const tierSelect = document.querySelector(".equipped-firearm-tier");
    expect(Array.from(tierSelect.options).map((o) => o.value)).toEqual([
      "I",
      "II",
    ]);
  });

  test("equipped-firearm-tier requires the sibling name <select>", () => {
    resetDOM();
    model.findFirearmByInstanceId.mockReturnValue({ weapon_id: "X" });
    const target = selectWithValue(
      "equipped-firearm-tier",
      { instanceId: "FIREARM-1" },
      "I",
    );
    expect(handleFirearmChange({ target })).toBe(true);
  });

  test("equipped-firearm-tier resolves the name+tier combination and edits in place", () => {
    resetDOM(`
      <select class="equipped-firearm-name" data-instance-id="FIREARM-1">
        <option value="Pistola" selected>x</option>
      </select>
    `);
    const instance = { weapon_id: "FIREARM-DB-1", hit_points_modifier: -1 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-firearm-tier",
      { instanceId: "FIREARM-1" },
      "II",
    );

    handleFirearmChange({ target });

    expect(instance.weapon_id).toBe("FIREARM-DB-2");
    expect(instance.hit_points_modifier).toBe(0);
  });
});

describe("handleFirearmChange — material / storage / move", () => {
  test("equipped-firearm-material sets material, resets HP, and DOES re-render", () => {
    const instance = { material_id: "MAT-OLD", hit_points_modifier: -3 };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-firearm-material",
      { instanceId: "FIREARM-1" },
      "MAT-001",
    );

    handleFirearmChange({ target });
    jest.advanceTimersToNextFrame();

    expect(instance.material_id).toBe("MAT-001");
    expect(instance.hit_points_modifier).toBe(0);
    expect(render.renderEquippedFirearms).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("firearm-storage-select moves via the model function", () => {
    const target = selectWithValue(
      "firearm-storage-select",
      { instanceId: "FIREARM-1" },
      "stash",
    );
    handleFirearmChange({ target });
    expect(model.moveFirearm).toHaveBeenCalledWith("FIREARM-1", "stash");
  });

  test("equipped-firearm-move to a destination unequips into storage and re-renders", () => {
    const instance = { is_equipped: true, storedAt: null };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-firearm-move",
      { instanceId: "FIREARM-1" },
      "camp",
    );

    handleFirearmChange({ target });
    jest.advanceTimersToNextFrame();

    expect(instance.is_equipped).toBe(false);
    expect(instance.storedAt).toBe("camp");
    expect(render.renderEquippedFirearms).toHaveBeenCalledTimes(1);
  });

  test("equipped-firearm-move back to '' re-equips", () => {
    const instance = { is_equipped: false, storedAt: "stash" };
    model.findFirearmByInstanceId.mockReturnValue(instance);
    const target = selectWithValue(
      "equipped-firearm-move",
      { instanceId: "FIREARM-1" },
      "",
    );

    handleFirearmChange({ target });

    expect(instance.is_equipped).toBe(true);
    expect(instance.storedAt).toBeNull();
  });
});

test("handleFirearmChange returns false for an unrelated change target", () => {
  const target = elWithClass("select", "something-else");
  expect(handleFirearmChange({ target })).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────
// handleAddFirearm
// ─────────────────────────────────────────────────────────────────────────
describe("handleAddFirearm", () => {
  function buildAddForm({
    name = "Pistola",
    tier = "I",
    material = "Aço",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <select id="firearmNameSelect"><option value="${name}" selected>x</option></select>
      <select id="firearmTierSelect"><option value="${tier}" selected>x</option></select>
      <select id="firearmMaterialSelect"><option value="${material}" selected>x</option></select>
      <select id="firearmStorage"><option value="${storage}" selected>x</option></select>
    `);
  }

  test("does nothing when a required element is missing", () => {
    resetDOM(`<select id="firearmNameSelect"></select>`);
    expect(() => handleAddFirearm()).not.toThrow();
    expect(model.addStoredFirearm).not.toHaveBeenCalled();
  });

  test("does nothing when the name+tier combination doesn't match any catalog row", () => {
    buildAddForm({ tier: "III" });
    handleAddFirearm();
    expect(model.addStoredFirearm).not.toHaveBeenCalled();
  });

  test("adds as equipped when storage is 'equipped'", () => {
    buildAddForm({ tier: "II", material: "Aço", storage: "equipped" });
    handleAddFirearm();
    expect(model.addEquippedFirearm).toHaveBeenCalledWith(
      "FIREARM-DB-2",
      "MAT-001",
    );
    expect(model.addStoredFirearm).not.toHaveBeenCalled();
  });

  test("adds as stored, at the chosen location, otherwise", () => {
    buildAddForm({ storage: "stash" });
    handleAddFirearm();
    expect(model.addStoredFirearm).toHaveBeenCalledWith(
      "FIREARM-DB-1",
      "MAT-001",
      "stash",
    );
  });

  test("passes null when the chosen material doesn't match any catalog row", () => {
    buildAddForm({ material: "Material Inexistente" });
    handleAddFirearm();
    expect(model.addStoredFirearm).toHaveBeenCalledWith(
      "FIREARM-DB-1",
      null,
      "backpack",
    );
  });
});
