jest.mock(
  "dev/public/js/engine/inventory/shared/enchantments/model.js",
  () => ({
    setEnchantmentAddFormSelection: jest.fn(),
    setEnchantmentAddFormTargetFilter: jest.fn(),
    setEnchantmentAddFormTypeFilter: jest.fn(),
    clearEnchantmentAddFormSelection: jest.fn(),
  }),
);

import {
  setEnchantmentAddFormSelection,
  setEnchantmentAddFormTargetFilter,
  setEnchantmentAddFormTypeFilter,
  clearEnchantmentAddFormSelection,
} from "dev/public/js/engine/inventory/shared/enchantments/model.js";
import {
  readEnchantmentFormParams,
  createEnchantmentsHandlers,
} from "dev/public/js/engine/inventory/shared/enchantments/dispatch.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function buildForm(
  formKey,
  { type = "SKILL-1", value, target, extraPoints } = {},
) {
  const parts = [`<div class="enchantment-form" data-form-key="${formKey}">`];
  parts.push(
    `<select class="enchantment-type-select">
       <option value="">-</option>
       <option value="SKILL-1" ${type === "SKILL-1" ? "selected" : ""}>Skill</option>
     </select>`,
  );
  if (value !== undefined) {
    parts.push(`<input class="enchantment-value-input" value="${value}" />`);
  }
  if (target !== undefined) {
    parts.push(
      `<select class="enchantment-target-select"><option value="${target}" selected>${target}</option></select>`,
    );
  }
  if (extraPoints !== undefined) {
    parts.push(
      `<input class="enchantment-extra-points-input" value="${extraPoints}" />`,
    );
  }
  parts.push("</div>");
  resetDOM(parts.join(""));
}

function clickEvent(className, dataset) {
  const target = document.createElement("button");
  target.classList.add(className);
  Object.entries(dataset).forEach(([k, v]) => {
    if (v !== undefined) target.dataset[k] = v;
  });
  return { target };
}

function changeEvent(className, dataset, value) {
  const target = document.createElement("select");
  target.classList.add(className);
  // A <select>'s .value setter silently no-ops if there's no matching
  // <option> — it isn't a free-text input like <input>.
  const option = document.createElement("option");
  option.value = value;
  target.appendChild(option);
  target.value = value;
  Object.entries(dataset).forEach(([k, v]) => {
    if (v !== undefined) target.dataset[k] = v;
  });
  return { target };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("readEnchantmentFormParams", () => {
  test("returns null when the form isn't found", () => {
    resetDOM();
    expect(readEnchantmentFormParams("nope")).toBeNull();
  });

  test("returns null when the type-select has no value chosen", () => {
    resetDOM(
      `<div class="enchantment-form" data-form-key="F1">
         <select class="enchantment-type-select"><option value="">-</option></select>
       </div>`,
    );
    expect(readEnchantmentFormParams("F1")).toBeNull();
  });

  test("reads the enchantmentId with no optional fields present", () => {
    buildForm("F1");
    expect(readEnchantmentFormParams("F1")).toEqual({
      enchantmentId: "SKILL-1",
      value: undefined,
      target: undefined,
      extraPoints: undefined,
    });
  });

  test("parses the value input as an integer", () => {
    buildForm("F1", { value: "7" });
    expect(readEnchantmentFormParams("F1").value).toBe(7);
  });

  test("reads the target select's value", () => {
    buildForm("F1", { target: "ST" });
    expect(readEnchantmentFormParams("F1").target).toBe("ST");
  });

  test("parses extraPoints as an integer, defaulting to 0 for an invalid value", () => {
    buildForm("F1", { extraPoints: "3" });
    expect(readEnchantmentFormParams("F1").extraPoints).toBe(3);

    buildForm("F1", { extraPoints: "" });
    expect(readEnchantmentFormParams("F1").extraPoints).toBe(0);
  });
});

describe("createEnchantmentsHandlers", () => {
  function makeConfig(overrides = {}) {
    return {
      findByInstanceId: jest.fn(() => ({ instance_id: "ITEM-1" })),
      getItems: jest.fn(() => []),
      addEnchantment: jest.fn(),
      updateEnchantment: jest.fn(),
      removeEnchantment: jest.fn(),
      render: jest.fn(),
      ...overrides,
    };
  }

  describe("ownsFormKey", () => {
    test("true when findByInstanceId recognizes the key as an item", () => {
      const { ownsFormKey } = createEnchantmentsHandlers(
        makeConfig({ findByInstanceId: jest.fn(() => ({})) }),
      );
      expect(ownsFormKey("ITEM-1")).toBe(true);
    });

    test("true when the key matches a nested enchantment entry's _instanceId", () => {
      const { ownsFormKey } = createEnchantmentsHandlers(
        makeConfig({
          findByInstanceId: jest.fn(() => undefined),
          getItems: jest.fn(() => [
            { enchantments: [{ _instanceId: "ENTRY-1" }] },
          ]),
        }),
      );
      expect(ownsFormKey("ENTRY-1")).toBe(true);
    });

    test("false when the key matches neither an item nor a nested entry", () => {
      const { ownsFormKey } = createEnchantmentsHandlers(
        makeConfig({
          findByInstanceId: jest.fn(() => undefined),
          getItems: jest.fn(() => [{ enchantments: [] }]),
        }),
      );
      expect(ownsFormKey("GHOST")).toBe(false);
    });

    test("respects a custom getEnchantments accessor", () => {
      const { ownsFormKey } = createEnchantmentsHandlers(
        makeConfig({
          findByInstanceId: jest.fn(() => undefined),
          getItems: jest.fn(() => [
            { magicalEffects: [{ _instanceId: "E1" }] },
          ]),
          getEnchantments: (item) => item.magicalEffects,
        }),
      );
      expect(ownsFormKey("E1")).toBe(true);
    });
  });

  describe("handleClick — remove", () => {
    test("denies and does not clear form state when ownership is denied", () => {
      const { handleClick } = createEnchantmentsHandlers(
        makeConfig({ findByInstanceId: jest.fn(() => undefined) }),
      );
      const result = handleClick(
        clickEvent("enchantment-remove-btn", {
          instanceId: "ITEM-1",
          entryInstanceId: "ENTRY-1",
        }),
      );
      expect(result).toBe(false);
      expect(clearEnchantmentAddFormSelection).not.toHaveBeenCalled();
    });

    test("clears the entry's form state and removes it via runWithOpenState", () => {
      const removeEnchantment = jest.fn();
      const runWithOpenState = jest.fn((e, fn) => fn());
      const { handleClick } = createEnchantmentsHandlers(
        makeConfig({ removeEnchantment, runWithOpenState }),
      );

      const result = handleClick(
        clickEvent("enchantment-remove-btn", {
          instanceId: "ITEM-1",
          entryInstanceId: "ENTRY-1",
        }),
      );

      expect(result).toBe(true);
      expect(clearEnchantmentAddFormSelection).toHaveBeenCalledWith("ENTRY-1");
      expect(removeEnchantment).toHaveBeenCalledWith("ITEM-1", "ENTRY-1");
    });
  });

  describe("handleClick — add", () => {
    test("denies without reading the form when ownership is denied", () => {
      const addEnchantment = jest.fn();
      const { handleClick } = createEnchantmentsHandlers(
        makeConfig({
          findByInstanceId: jest.fn(() => undefined),
          addEnchantment,
        }),
      );
      resetDOM(); // no form present

      const result = handleClick(
        clickEvent("enchantment-add-btn", { instanceId: "ITEM-1" }),
      );

      expect(result).toBe(false);
      expect(addEnchantment).not.toHaveBeenCalled();
    });

    test("reports handled but adds nothing when the form has no type selected", () => {
      const addEnchantment = jest.fn();
      const { handleClick } = createEnchantmentsHandlers(
        makeConfig({ addEnchantment }),
      );
      resetDOM(
        `<div class="enchantment-form" data-form-key="ITEM-1">
           <select class="enchantment-type-select"><option value="">-</option></select>
         </div>`,
      );

      const result = handleClick(
        clickEvent("enchantment-add-btn", { instanceId: "ITEM-1" }),
      );

      expect(result).toBe(true);
      expect(addEnchantment).not.toHaveBeenCalled();
    });

    test("adds the enchantment with the form's params via runWithOpenState", () => {
      const addEnchantment = jest.fn();
      const runWithOpenState = jest.fn((e, fn) => fn());
      const { handleClick } = createEnchantmentsHandlers(
        makeConfig({ addEnchantment, runWithOpenState }),
      );
      buildForm("ITEM-1", { target: "ST" });

      const result = handleClick(
        clickEvent("enchantment-add-btn", { instanceId: "ITEM-1" }),
      );

      expect(result).toBe(true);
      expect(addEnchantment).toHaveBeenCalledWith(
        "ITEM-1",
        "SKILL-1",
        expect.objectContaining({ enchantmentId: "SKILL-1", target: "ST" }),
      );
    });
  });

  describe("handleClick — save", () => {
    test("denies without reading the form when ownership is denied", () => {
      const updateEnchantment = jest.fn();
      const { handleClick } = createEnchantmentsHandlers(
        makeConfig({
          findByInstanceId: jest.fn(() => undefined),
          updateEnchantment,
        }),
      );
      const result = handleClick(
        clickEvent("enchantment-save-btn", {
          instanceId: "ITEM-1",
          entryInstanceId: "ENTRY-1",
        }),
      );
      expect(result).toBe(false);
      expect(updateEnchantment).not.toHaveBeenCalled();
    });

    test("when the form has no type selected: handled, but neither updates nor clears form state", () => {
      const updateEnchantment = jest.fn();
      const { handleClick } = createEnchantmentsHandlers(
        makeConfig({ updateEnchantment }),
      );
      resetDOM(
        `<div class="enchantment-form" data-form-key="ENTRY-1">
           <select class="enchantment-type-select"><option value="">-</option></select>
         </div>`,
      );

      const result = handleClick(
        clickEvent("enchantment-save-btn", {
          instanceId: "ITEM-1",
          entryInstanceId: "ENTRY-1",
        }),
      );

      expect(result).toBe(true);
      expect(updateEnchantment).not.toHaveBeenCalled();
      // Unlike remove, save only clears form state AFTER confirming there
      // are real params to save — an early "nothing selected" return skips it.
      expect(clearEnchantmentAddFormSelection).not.toHaveBeenCalled();
    });

    test("clears the entry's form state and updates it via runWithOpenState", () => {
      const updateEnchantment = jest.fn();
      const runWithOpenState = jest.fn((e, fn) => fn());
      const { handleClick } = createEnchantmentsHandlers(
        makeConfig({ updateEnchantment, runWithOpenState }),
      );
      buildForm("ENTRY-1");

      const result = handleClick(
        clickEvent("enchantment-save-btn", {
          instanceId: "ITEM-1",
          entryInstanceId: "ENTRY-1",
        }),
      );

      expect(result).toBe(true);
      expect(clearEnchantmentAddFormSelection).toHaveBeenCalledWith("ENTRY-1");
      expect(updateEnchantment).toHaveBeenCalledWith(
        "ITEM-1",
        "ENTRY-1",
        "SKILL-1",
        expect.objectContaining({ enchantmentId: "SKILL-1" }),
      );
    });
  });

  test("handleClick returns false for an unrelated click target", () => {
    const { handleClick } = createEnchantmentsHandlers(makeConfig());
    const target = document.createElement("button");
    target.classList.add("something-else");
    expect(handleClick({ target })).toBe(false);
  });

  describe("handleChange — category filter", () => {
    test("denies when there's no formKey", () => {
      const { handleChange } = createEnchantmentsHandlers(makeConfig());
      const result = handleChange(
        changeEvent("enchantment-category-filter", {}, "Perícia"),
      );
      expect(result).toBe(false);
      expect(setEnchantmentAddFormTypeFilter).not.toHaveBeenCalled();
    });

    test("denies when ownsFormKey rejects the formKey", () => {
      const { handleChange } = createEnchantmentsHandlers(
        makeConfig({ findByInstanceId: jest.fn(() => undefined) }),
      );
      const result = handleChange(
        changeEvent(
          "enchantment-category-filter",
          { formKey: "GHOST" },
          "Perícia",
        ),
      );
      expect(result).toBe(false);
      expect(setEnchantmentAddFormTypeFilter).not.toHaveBeenCalled();
    });

    test("sets the type filter and re-renders via runWithOpenState when owned", () => {
      const render = jest.fn();
      const runWithOpenState = jest.fn((e, fn) => fn());
      const { handleChange } = createEnchantmentsHandlers(
        makeConfig({ render, runWithOpenState }),
      );

      const result = handleChange(
        changeEvent(
          "enchantment-category-filter",
          { formKey: "ITEM-1" },
          "Perícia",
        ),
      );

      expect(result).toBe(true);
      expect(setEnchantmentAddFormTypeFilter).toHaveBeenCalledWith(
        "ITEM-1",
        "Perícia",
      );
      expect(render).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleChange — type select", () => {
    test("sets the enchantment selection and re-renders when owned", () => {
      const render = jest.fn();
      const runWithOpenState = jest.fn((e, fn) => fn());
      const { handleChange } = createEnchantmentsHandlers(
        makeConfig({ render, runWithOpenState }),
      );

      const result = handleChange(
        changeEvent(
          "enchantment-type-select",
          { formKey: "ITEM-1" },
          "SKILL-2",
        ),
      );

      expect(result).toBe(true);
      expect(setEnchantmentAddFormSelection).toHaveBeenCalledWith(
        "ITEM-1",
        "SKILL-2",
      );
      expect(render).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleChange — target filter", () => {
    test("sets the target filter and re-renders when owned", () => {
      const render = jest.fn();
      const runWithOpenState = jest.fn((e, fn) => fn());
      const { handleChange } = createEnchantmentsHandlers(
        makeConfig({ render, runWithOpenState }),
      );

      const result = handleChange(
        changeEvent("enchantment-target-filter", { formKey: "ITEM-1" }, "ST"),
      );

      expect(result).toBe(true);
      expect(setEnchantmentAddFormTargetFilter).toHaveBeenCalledWith(
        "ITEM-1",
        "ST",
      );
      expect(render).toHaveBeenCalledTimes(1);
    });
  });

  test("handleChange returns false for an unrelated change target", () => {
    const { handleChange } = createEnchantmentsHandlers(makeConfig());
    const target = document.createElement("select");
    target.classList.add("something-else");
    expect(handleChange({ target })).toBe(false);
  });

  test("runWithOpenState defaults to invoking the work immediately when not provided", () => {
    const addEnchantment = jest.fn();
    const { handleClick } = createEnchantmentsHandlers(
      makeConfig({ addEnchantment }),
    );
    buildForm("ITEM-1");

    handleClick(clickEvent("enchantment-add-btn", { instanceId: "ITEM-1" }));

    expect(addEnchantment).toHaveBeenCalledTimes(1);
  });
});
