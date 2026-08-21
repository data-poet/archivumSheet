// shared/attributeUtils.js is pure logic — no DOM, no imports of its own,
// state is passed in as a plain object. Covers the fallback chain each
// function documents in its own comment (base_value -> value -> default of
// 10), since that chain is what keeps the UI default lined up with what
// each engine calculation actually produces.
import {
  getSkillAttributeBase,
  getSpellAttributeBase,
} from "dev/public/js/shared/attributeUtils.js";

const DEFAULT_ATTRIBUTE_VALUE = 10;

function makeState(primaryAttributes) {
  return {
    sheet: {
      character: {
        primary_attributes: primaryAttributes,
      },
    },
  };
}

describe("getSkillAttributeBase", () => {
  test.each(["ST", "DX", "IQ", "HT"])(
    "reads %s's base_value when present",
    (attribute) => {
      const state = makeState({ [attribute]: { base_value: 13, value: 14 } });
      expect(getSkillAttributeBase(state, attribute)).toBe(13);
    },
  );

  test("falls back to value when base_value is missing", () => {
    const state = makeState({ ST: { value: 12 } });
    expect(getSkillAttributeBase(state, "ST")).toBe(12);
  });

  test("falls back to the default when both base_value and value are missing", () => {
    const state = makeState({ ST: {} });
    expect(getSkillAttributeBase(state, "ST")).toBe(DEFAULT_ATTRIBUTE_VALUE);
  });

  test("falls back to the default when the attribute itself is absent", () => {
    const state = makeState({});
    expect(getSkillAttributeBase(state, "ST")).toBe(DEFAULT_ATTRIBUTE_VALUE);
  });

  test("falls back to the default when state.sheet is entirely absent", () => {
    expect(getSkillAttributeBase({}, "ST")).toBe(DEFAULT_ATTRIBUTE_VALUE);
  });

  test("treats base_value 0 as a real value, not a missing one", () => {
    const state = makeState({ ST: { base_value: 0, value: 14 } });
    expect(getSkillAttributeBase(state, "ST")).toBe(0);
  });
});

describe("getSpellAttributeBase", () => {
  test("reads IQ's value (fully modified), not base_value", () => {
    const state = makeState({ IQ: { base_value: 11, value: 15 } });
    expect(getSpellAttributeBase(state)).toBe(15);
  });

  test("falls back to base_value when value is missing", () => {
    const state = makeState({ IQ: { base_value: 11 } });
    expect(getSpellAttributeBase(state)).toBe(11);
  });

  test("falls back to the default when both are missing", () => {
    const state = makeState({ IQ: {} });
    expect(getSpellAttributeBase(state)).toBe(DEFAULT_ATTRIBUTE_VALUE);
  });

  test("falls back to the default when IQ itself is absent", () => {
    const state = makeState({});
    expect(getSpellAttributeBase(state)).toBe(DEFAULT_ATTRIBUTE_VALUE);
  });

  test("falls back to the default when state.sheet is entirely absent", () => {
    expect(getSpellAttributeBase({})).toBe(DEFAULT_ATTRIBUTE_VALUE);
  });

  test("treats value 0 as a real value, not a missing one", () => {
    const state = makeState({ IQ: { base_value: 11, value: 0 } });
    expect(getSpellAttributeBase(state)).toBe(0);
  });
});
