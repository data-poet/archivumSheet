const { SKILL } = require("tests/helpers/dataRefs");
const {
  computeParry,
  parseSkillDefaults,
  loadSkillRows,
  resolveSkillCheck,
} = require("engine/character/js/skills/skillCheck");

const rows = loadSkillRows();
const primary = { DX: { value: 12 }, IQ: { value: 10 }, ST: { value: 10 } };
const check = (skillId, extra = {}) =>
  resolveSkillCheck(skillId, { rows, skills: {}, primary, ...extra });

describe("parseSkillDefaults", () => {
  test("reads SKILL-ID:-N entries and ignores blanks or malformed ones", () => {
    expect(
      parseSkillDefaults(`${SKILL.espadasLongas}:-2; ${SKILL.bastao}:-3;;bad`),
    ).toEqual([
      { skillId: SKILL.espadasLongas, penalty: -2 },
      { skillId: SKILL.bastao, penalty: -3 },
    ]);
    expect(parseSkillDefaults("")).toEqual([]);
  });
});

describe("computeParry (4e)", () => {
  test("3 + floor(level / 2) + bonus, +1 with Reflexos; empty column means no parry", () => {
    expect(computeParry({ skill_parry_modifier: "0" }, 13, false)).toBe(9);
    expect(computeParry({ skill_parry_modifier: "2" }, 12, true)).toBe(12);
    expect(computeParry({ skill_parry_modifier: "" }, 12, false)).toBeNull();
  });
});

describe("resolveSkillCheck", () => {
  test("a learned skill uses its own level, parry and actions", () => {
    const result = check(SKILL.espadasLongas, {
      skills: { [SKILL.espadasLongas]: { value: 14, actions: 2 } },
    });
    expect(result).toMatchObject({
      level: 14,
      source: { type: "learned" },
      parry: 10,
      actions: 2,
      critical: { success: 4, failure: 17 },
    });
  });

  test("an unlearned M skill defaults to DX-5 with 1 action", () => {
    expect(check(SKILL.espadasLongas)).toMatchObject({
      level: 7,
      source: { type: "attribute", attribute: "DX", penalty: -5 },
      parry: 6,
      actions: 1,
    });
  });

  test("a related skill default wins when it is better than the attribute default", () => {
    const result = check(SKILL.espadasCurtas, {
      skills: { [SKILL.espadasLongas]: { value: 14 } },
    });
    expect(result.level).toBe(12);
    expect(result.source).toEqual({
      type: "skill",
      skill_id: SKILL.espadasLongas,
      penalty: -2,
    });
  });

  test("the attribute default wins when the related skill is too low", () => {
    const result = check(SKILL.espadasCurtas, {
      skills: { [SKILL.espadasLongas]: { value: 8 } },
    });
    expect(result.level).toBe(7);
    expect(result.source.type).toBe("attribute");
  });

  test("a D skill with no parry column defaults to attribute-6 and cannot parry", () => {
    expect(check(SKILL.arco)).toMatchObject({ level: 6, parry: null });
  });

  test("the minimum-ST penalty lowers the level and the parry", () => {
    const result = check(SKILL.espadasLongas, {
      skills: { [SKILL.espadasLongas]: { value: 14, actions: 1 } },
      stPenalty: 2,
    });
    expect(result.level).toBe(12);
    expect(result.st_penalty).toBe(2);
    expect(result.parry).toBe(9);
  });

  test("an MD skill with no related skill known has no level", () => {
    const md = Object.values(rows).find(
      (row) => row.skill_difficulty === "MD" && !row.skill_defaults,
    );
    expect(check(md.skill_id)).toMatchObject({
      level: null,
      source: { type: "none" },
      critical: null,
    });
  });

  test("an unknown skill id resolves to null", () => {
    expect(check("SKILL-DOES-NOT-EXIST")).toBeNull();
  });
});
