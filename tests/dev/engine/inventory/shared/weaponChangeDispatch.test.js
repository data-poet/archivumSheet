jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { createWeaponChangeHandler } from "dev/public/js/engine/inventory/shared/weaponChangeDispatch.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const CATALOG = [
  { weapon_id: "W-1", weapon_name: "Espada", weapon_tier: "I" },
  { weapon_id: "W-2", weapon_name: "Espada", weapon_tier: "II" },
  { weapon_id: "W-3", weapon_name: "Machado", weapon_tier: "I" },
];

function selectWithValue(className, value, dataset = {}) {
  const el = document.createElement("select");
  el.classList.add(className);
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  const option = document.createElement("option");
  option.value = value;
  el.appendChild(option);
  el.value = value;
  return el;
}

function buildHandler(overrides = {}) {
  return createWeaponChangeHandler({
    classPrefix: "melee",
    catalog: () => CATALOG,
    findByInstanceId: overrides.findByInstanceId ?? (() => overrides.instance),
    move: overrides.move ?? jest.fn(),
    renderAfterMaterial: overrides.renderAfterMaterial ?? jest.fn(),
    renderAfterMove: overrides.renderAfterMove ?? jest.fn(),
    ...(overrides.onMoved ? { onMoved: overrides.onMoved } : {}),
  });
}

beforeEach(() => {
  resetDOM();
  jest.clearAllMocks();
});

describe("createWeaponChangeHandler", () => {
  test("returns false for markup it doesn't own, so other handlers get a turn", () => {
    const handler = buildHandler({ instance: {} });
    const target = selectWithValue("enchantment-type-select", "x");

    expect(handler({ target })).toBe(false);
  });

  test("derives all five class names from classPrefix", () => {
    const handler = createWeaponChangeHandler({
      classPrefix: "firearm",
      catalog: () => CATALOG,
      findByInstanceId: () => ({}),
      move: jest.fn(),
      renderAfterMaterial: jest.fn(),
      renderAfterMove: jest.fn(),
    });

    for (const cls of [
      "equipped-firearm-name",
      "equipped-firearm-tier",
      "equipped-firearm-material",
      "firearm-storage-select",
      "equipped-firearm-move",
    ]) {
      expect(handler({ target: selectWithValue(cls, "") })).toBe(true);
    }
  });

  describe("name select", () => {
    test("switches to the first weapon of the chosen name and resets HP damage", () => {
      const instance = { weapon_id: "W-3", hit_points_modifier: -5 };
      const handler = buildHandler({ instance });

      handler({
        target: selectWithValue("equipped-melee-name", "Espada", {
          instanceId: "M-1",
        }),
      });

      expect(instance.weapon_id).toBe("W-1");
      expect(instance.hit_points_modifier).toBe(0);
      expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    });

    test("re-narrows the sibling tier select to the tiers that name actually has", () => {
      resetDOM(`
        <select class="equipped-melee-tier" data-instance-id="M-1"></select>
      `);
      const handler = buildHandler({
        instance: { weapon_id: "W-3", hit_points_modifier: 0 },
      });

      handler({
        target: selectWithValue("equipped-melee-name", "Espada", {
          instanceId: "M-1",
        }),
      });

      const options = document.querySelectorAll(
        ".equipped-melee-tier option",
      );
      expect([...options].map((o) => o.value)).toEqual(["I", "II"]);
    });

    test("does nothing when the chosen name matches no catalog row", () => {
      const instance = { weapon_id: "W-1", hit_points_modifier: -2 };
      const handler = buildHandler({ instance });

      handler({
        target: selectWithValue("equipped-melee-name", "Inexistente", {
          instanceId: "M-1",
        }),
      });

      expect(instance.weapon_id).toBe("W-1");
      expect(instance.hit_points_modifier).toBe(-2);
      expect(triggerAutoRun).not.toHaveBeenCalled();
    });
  });

  describe("tier select", () => {
    test("resolves name + tier to a weapon id and resets HP damage", () => {
      resetDOM(`
        <select class="equipped-melee-name" data-instance-id="M-1">
          <option value="Espada" selected>Espada</option>
        </select>
      `);
      const instance = { weapon_id: "W-1", hit_points_modifier: -3 };
      const handler = buildHandler({ instance });

      handler({
        target: selectWithValue("equipped-melee-tier", "II", {
          instanceId: "M-1",
        }),
      });

      expect(instance.weapon_id).toBe("W-2");
      expect(instance.hit_points_modifier).toBe(0);
    });

    test("bails when the sibling name select is missing from the DOM", () => {
      const instance = { weapon_id: "W-1", hit_points_modifier: -3 };
      const handler = buildHandler({ instance });

      handler({
        target: selectWithValue("equipped-melee-tier", "II", {
          instanceId: "M-1",
        }),
      });

      expect(instance.weapon_id).toBe("W-1");
      expect(triggerAutoRun).not.toHaveBeenCalled();
    });
  });

  test("material select stores the new material, resets HP damage and re-renders", () => {
    const instance = { material_id: "MAT-000", hit_points_modifier: -4 };
    const renderAfterMaterial = jest.fn();
    const handler = buildHandler({ instance, renderAfterMaterial });

    handler({
      target: selectWithValue("equipped-melee-material", "MAT-007", {
        instanceId: "M-1",
      }),
    });

    expect(instance.material_id).toBe("MAT-007");
    expect(instance.hit_points_modifier).toBe(0);
    expect(renderAfterMaterial).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("storage select delegates to move() and lets it own the re-render", () => {
    const move = jest.fn();
    const renderAfterMove = jest.fn();
    const handler = buildHandler({ instance: {}, move, renderAfterMove });

    handler({
      target: selectWithValue("melee-storage-select", "stash", {
        instanceId: "M-1",
      }),
    });

    expect(move).toHaveBeenCalledWith("M-1", "stash");
    expect(renderAfterMove).not.toHaveBeenCalled();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  describe("move select", () => {
    test("a destination unequips the item and records where it went", () => {
      const instance = { is_equipped: true, storedAt: null };
      const renderAfterMove = jest.fn();
      const handler = buildHandler({ instance, renderAfterMove });

      handler({
        target: selectWithValue("equipped-melee-move", "camp", {
          instanceId: "M-1",
        }),
      });

      expect(instance.is_equipped).toBe(false);
      expect(instance.storedAt).toBe("camp");
      expect(renderAfterMove).toHaveBeenCalledTimes(1);
      expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    });

    test("an empty destination means 'keep equipped' and clears storedAt", () => {
      const instance = { is_equipped: false, storedAt: "stash" };
      const handler = buildHandler({ instance });

      handler({
        target: selectWithValue("equipped-melee-move", "", {
          instanceId: "M-1",
        }),
      });

      expect(instance.is_equipped).toBe(true);
      expect(instance.storedAt).toBe(null);
    });

    test("onMoved runs after the fields are written, so a mirror sees final values", () => {
      const instance = { is_equipped: true, storedAt: null };
      const seen = [];
      const handler = buildHandler({
        instance,
        onMoved: (inst) => seen.push({ ...inst }),
      });

      handler({
        target: selectWithValue("equipped-melee-move", "backpack", {
          instanceId: "M-1",
        }),
      });

      expect(seen).toEqual([{ is_equipped: false, storedAt: "backpack" }]);
    });

    test("reports handled but mutates nothing when the instance is gone", () => {
      const renderAfterMove = jest.fn();
      const handler = buildHandler({ instance: undefined, renderAfterMove });

      const target = selectWithValue("equipped-melee-move", "camp", {
        instanceId: "M-1",
      });

      expect(handler({ target })).toBe(true);
      expect(renderAfterMove).not.toHaveBeenCalled();
    });
  });
});
