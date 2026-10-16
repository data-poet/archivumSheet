const refs = require("tests/helpers/dataRefs");
const ids = require("helpers/ids.js");

const { LEGACY_IDS, remapLegacyIds, ...groups } = refs;

describe("dataRefs", () => {
  test.each(Object.entries(groups))(
    "%s: every ref resolves to a distinct id",
    (_group, entries) => {
      const values = Object.values(entries);
      values.forEach((id) => expect(id).toMatch(/^[A-Z][A-Z-]*-\d{3}$/));
      expect(new Set(values).size).toBe(values.length);
    },
  );

  test("ids owned by production code are not looked up a second way", () => {
    expect(refs.ADVANTAGE.reflexosEmCombate).toBe(ids.REFLEXOS_EM_COMBATE_ID);
    expect(refs.SKILL.escudo).toBe(ids.ESCUDO_SKILL_ID);
  });

  test("every legacy id maps to a ref that exists", () => {
    Object.values(LEGACY_IDS).forEach((id) => expect(typeof id).toBe("string"));
  });
});

describe("remapLegacyIds", () => {
  test("replaces whole-string legacy ids at any depth and leaves everything else alone", () => {
    const legacyId = Object.keys(LEGACY_IDS)[0];
    const input = {
      list: [legacyId, "not-an-id", 7],
      nested: { id: legacyId, text: `mentions ${legacyId} inside text` },
    };

    const output = remapLegacyIds(input);

    expect(output.list).toEqual([LEGACY_IDS[legacyId], "not-an-id", 7]);
    expect(output.nested.id).toBe(LEGACY_IDS[legacyId]);
    expect(output.nested.text).toBe(`mentions ${legacyId} inside text`);
    expect(input.list[0]).toBe(legacyId);
  });

  test("ids that were never in the datasets are left as they are", () => {
    expect(remapLegacyIds({ id: "SKILL-999" })).toEqual({ id: "SKILL-999" });
  });
});
