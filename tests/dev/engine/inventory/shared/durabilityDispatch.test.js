jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  createHpInputHandler,
  updateResumeHpDisplay,
  updateActualHpDisplay,
} from "dev/public/js/engine/inventory/shared/durabilityDispatch.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function inputWithValue(className, value, dataset = {}) {
  const el = document.createElement("input");
  el.classList.add(className);
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  el.value = value;
  return el;
}

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();

  state.data.armors = [{ armor_id: "ARM-1", armor_hit_points: 10 }];
  state.data.materials = [];
});

afterEach(() => {
  jest.useRealTimers();
});

function buildHandler(overrides = {}) {
  return createHpInputHandler({
    variants: [
      {
        cssClass: "stored-armor-hp",
        findInstance: () => overrides.instance,
        display: updateActualHpDisplay,
      },
    ],
    catalog: () => state.data.armors,
    catalogIdField: "armor_id",
    baseHpField: "armor_hit_points",
    deferRender: overrides.deferRender ?? jest.fn(),
    ...(overrides.onApplied ? { onApplied: overrides.onApplied } : {}),
  });
}

describe("updateResumeHpDisplay", () => {
  test("writes maxHp + modifier into the cell's .resume-hp-actual", () => {
    resetDOM(`
      <table><tr><td>
        <span class="resume-hp-actual">?</span>
        <input class="x" />
      </td></tr></table>
    `);
    const input = document.querySelector(".x");

    updateResumeHpDisplay(input, 10, -3);

    expect(document.querySelector(".resume-hp-actual").textContent).toBe("7");
  });

  test("treats a null/zero modifier as no change", () => {
    resetDOM(`
      <table><tr><td>
        <span class="resume-hp-actual">?</span><input class="x" />
      </td></tr></table>
    `);

    updateResumeHpDisplay(document.querySelector(".x"), 10, null);

    expect(document.querySelector(".resume-hp-actual").textContent).toBe("10");
  });

  test("is a no-op when the input isn't inside a table cell", () => {
    const orphan = document.createElement("input");
    expect(() => updateResumeHpDisplay(orphan, 10, -3)).not.toThrow();
  });
});

describe("updateActualHpDisplay", () => {
  test("writes into the SECOND <strong> of the .hp-modifier block, leaving max alone", () => {
    resetDOM(`
      <div class="hp-modifier">
        <strong>10</strong><input class="x" /><strong>?</strong>
      </div>
    `);

    updateActualHpDisplay(document.querySelector(".x"), 10, -4);

    const strongs = document.querySelectorAll(".hp-modifier strong");
    expect(strongs[0].textContent).toBe("10"); // max untouched
    expect(strongs[1].textContent).toBe("6");
  });

  test("is a no-op when the block has fewer than two <strong> elements", () => {
    resetDOM(`<div class="hp-modifier"><strong>10</strong><input class="x" /></div>`);

    updateActualHpDisplay(document.querySelector(".x"), 10, -4);

    expect(document.querySelector("strong").textContent).toBe("10");
  });
});

describe("createHpInputHandler", () => {
  test("returns false for an input that matches no variant, so other handlers get a turn", () => {
    const handler = buildHandler({ instance: {} });
    const target = inputWithValue("something-else", "-2");

    expect(handler({ target })).toBe(false);
  });

  test("reports handled but mutates nothing when the instance can't be found", () => {
    const deferRender = jest.fn();
    const handler = buildHandler({ instance: undefined, deferRender });
    const target = inputWithValue("stored-armor-hp", "-2");

    expect(handler({ target })).toBe(true);
    expect(deferRender).not.toHaveBeenCalled();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("clamps the typed value against maxHp derived from the catalog row", () => {
    const instance = { armor_id: "ARM-1", hit_points_modifier: 0 };
    const handler = buildHandler({ instance });
    const target = inputWithValue("stored-armor-hp", "-999");

    handler({ target });

    expect(instance.hit_points_modifier).toBe(-10); // clamped to -maxHp
  });

  test("clamps positive input to 0 (damage only lowers hit points)", () => {
    const instance = { armor_id: "ARM-1", hit_points_modifier: 0 };
    const handler = buildHandler({ instance });

    handler({ target: inputWithValue("stored-armor-hp", "5") });

    expect(instance.hit_points_modifier).toBe(0);
  });

  test("leaves a lone '-' alone so the minus key works mid-typing", () => {
    const instance = { armor_id: "ARM-1", hit_points_modifier: -5 };
    const deferRender = jest.fn();
    const handler = buildHandler({ instance, deferRender });

    expect(handler({ target: inputWithValue("stored-armor-hp", "-") })).toBe(
      true,
    );
    expect(instance.hit_points_modifier).toBe(-5); // untouched
    expect(deferRender).not.toHaveBeenCalled();
  });

  test("falls back to a base of 0 when the instance has no matching catalog row", () => {
    const instance = { armor_id: "NOT-IN-CATALOG", hit_points_modifier: 0 };
    const handler = buildHandler({ instance });

    handler({ target: inputWithValue("stored-armor-hp", "-3") });

    // maxHp of 0 clamps everything to zero (signed -0, hence toBeCloseTo)
    expect(instance.hit_points_modifier).toBeCloseTo(0);
  });

  test("schedules a re-render and an engine run after a successful edit", () => {
    const instance = { armor_id: "ARM-1", hit_points_modifier: 0 };
    const deferRender = jest.fn();
    const handler = buildHandler({ instance, deferRender });

    handler({ target: inputWithValue("stored-armor-hp", "-2") });

    expect(deferRender).toHaveBeenCalledTimes(1);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("runs onApplied after writing the modifier, so mirrors see the final value", () => {
    const instance = { armor_id: "ARM-1", hit_points_modifier: 0 };
    const seen = [];
    const handler = buildHandler({
      instance,
      onApplied: (inst) => seen.push(inst.hit_points_modifier),
    });

    handler({ target: inputWithValue("stored-armor-hp", "-6") });

    expect(seen).toEqual([-6]);
  });

  test("matches variants in declaration order and uses that variant's own finder and display", () => {
    const equipped = { armor_id: "ARM-1", hit_points_modifier: 0 };
    const stored = { armor_id: "ARM-1", hit_points_modifier: 0 };
    const handler = createHpInputHandler({
      variants: [
        {
          cssClass: "equipped-armor-hp",
          findInstance: () => equipped,
          display: jest.fn(),
        },
        {
          cssClass: "stored-armor-hp",
          findInstance: () => stored,
          display: jest.fn(),
        },
      ],
      catalog: () => state.data.armors,
      catalogIdField: "armor_id",
      baseHpField: "armor_hit_points",
      deferRender: jest.fn(),
    });

    handler({ target: inputWithValue("stored-armor-hp", "-2") });

    expect(stored.hit_points_modifier).toBe(-2);
    expect(equipped.hit_points_modifier).toBe(0); // untouched
  });
});
