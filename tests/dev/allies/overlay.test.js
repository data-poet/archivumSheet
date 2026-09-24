import { applyOverlay } from "dev/public/js/allies/overlay.js";

const catalogAlly = {
  ally_id: "ALLY_HUMANOID_001",
  character: {
    primary: {
      ST: { base_value: 11, modifier: 0 },
      DX: { base_value: 12, modifier: 0 },
    },
    secondary: { HP: { modifier: 0 } },
    skills: { "SKILL-044": { base_value: 12 } },
  },
};

describe("applyOverlay", () => {
  test("returns the catalog ally unchanged when there are no overrides", () => {
    expect(applyOverlay(catalogAlly, {})).toBe(catalogAlly);
    expect(applyOverlay(catalogAlly, undefined)).toBe(catalogAlly);
  });

  test("merges only the patched primary attribute, leaving siblings intact", () => {
    const result = applyOverlay(catalogAlly, { primary: { ST: { modifier: 2 } } });

    expect(result.character.primary.ST).toEqual({ base_value: 11, modifier: 2 });
    expect(result.character.primary.DX).toEqual({ base_value: 12, modifier: 0 });
  });

  test("merges secondary overrides independently of primary", () => {
    const result = applyOverlay(catalogAlly, { secondary: { HP: { modifier: -3 } } });

    expect(result.character.secondary.HP).toEqual({ modifier: -3 });
    expect(result.character.primary).toEqual(catalogAlly.character.primary);
  });

  test("never touches sections outside primary/secondary", () => {
    const result = applyOverlay(catalogAlly, { primary: { ST: { modifier: 2 } } });

    expect(result.character.skills).toBe(catalogAlly.character.skills);
  });

  test("does not mutate the original catalog ally", () => {
    applyOverlay(catalogAlly, { primary: { ST: { modifier: 2 } } });
    expect(catalogAlly.character.primary.ST.modifier).toBe(0);
  });

  test("passes through a null/undefined catalog ally unchanged", () => {
    expect(applyOverlay(null, { primary: {} })).toBeNull();
    expect(applyOverlay(undefined, { primary: {} })).toBeUndefined();
  });
});
