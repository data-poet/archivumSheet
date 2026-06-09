const { buildSkills, computeActions, MASTER_ELIGIBLE_CATEGORIES } = require("engine/character/js/skills/skills");

const assertShape = require("tests/helpers/assertShape");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const character = {
  primary_attributes: {
    DX: { base_value: 12 },
    IQ: { base_value: 10 },
  },
};

// SKILL-068 = ESPADAS LONGAS (parry_modifier 0.5, category Armas e Combate)
// SKILL-000 = ADESTRAMENTO DE ANIMAIS (no parry, category Animais)
const selectedSkills = {
  "SKILL-000": { base_value: 14, modifier: 0, isTrainedWithMaster: false },
  "SKILL-001": { base_value: 12, modifier: 1, isTrainedWithMaster: false },
};

// ─── Existing shape / cost tests ──────────────────────────────────────────────

describe("BUILD SKILLS (ENGINE)", () => {
  test("Should build selected skills only", () => {
    const result = buildSkills(selectedSkills, character);
    assertShape(result, ["skills", "character_points"]);
    expect(typeof result.character_points.skills).toBe("number");
  });

  test("Should only include selected skill IDs", () => {
    const result = buildSkills(selectedSkills, character);
    const skillIds = Object.keys(result.skills);
    expect(skillIds.length).toBe(Object.keys(selectedSkills).length);
    skillIds.forEach((id) => {
      expect(Object.keys(selectedSkills)).toContain(id);
    });
  });

  test("Should compute points for selected skills", () => {
    const result = buildSkills(selectedSkills, character);
    const skills = Object.values(result.skills);
    expect(skills.length).toBe(Object.keys(selectedSkills).length);
    const allHavePoints = skills.every((s) => typeof s.points === "number");
    expect(allHavePoints).toBe(true);
  });

  test("Should ensure attribute mapping correct (DX/IQ)", () => {
    const result = buildSkills(selectedSkills, character);
    Object.values(result.skills).forEach((skill) => {
      expect(["DX", "IQ", "ST", "HT"]).toContain(skill.attribute);
    });
  });

  test("Should ensure total equals sum of individual points", () => {
    const result = buildSkills(selectedSkills, character);
    const manualSum = Object.values(result.skills).reduce(
      (sum, s) => sum + s.points,
      0,
    );
    expect(result.character_points.skills).toBe(manualSum);
  });

  test("Should be deterministic (same input = same output)", () => {
    const r1 = buildSkills(selectedSkills, character);
    const r2 = buildSkills(selectedSkills, character);
    expect(r1.character_points.skills).toBe(r2.character_points.skills);
  });
});

// ─── skill_parry tests ────────────────────────────────────────────────────────

describe("SKILL PARRY", () => {
  // ESPADAS LONGAS is SKILL-068 based on the CSV; find any parry skill at runtime
  // We test via a known parry skill: ESPADAS LONGAS (parry_modifier = 0.5)
  const parrySkillId = "SKILL-044"; // ESPADAS LONGAS
  const nonParrySkillId = "SKILL-000"; // ADESTRAMENTO DE ANIMAIS

  const skillsWithParry = {
    [parrySkillId]: { base_value: 14, modifier: 0, isTrainedWithMaster: false },
    [nonParrySkillId]: { base_value: 10, modifier: 0, isTrainedWithMaster: false },
  };

  test("Skill with parry_modifier should have a numeric parry value", () => {
    const result = buildSkills(skillsWithParry, character);
    const parrySkill = result.skills[parrySkillId];
    expect(parrySkill).toBeDefined();
    expect(typeof parrySkill.parry).toBe("number");
  });

  test("Skill without parry_modifier should have parry = null", () => {
    const result = buildSkills(skillsWithParry, character);
    const nonParrySkill = result.skills[nonParrySkillId];
    expect(nonParrySkill).toBeDefined();
    expect(nonParrySkill.parry).toBeNull();
  });

  test("parry = floor(parry_modifier * level) — no ADV-055", () => {
    // ESPADAS LONGAS parry_modifier = 0.5, level = 14 → floor(0.5 * 14) = 7
    const result = buildSkills(skillsWithParry, character);
    expect(result.skills[parrySkillId].parry).toBe(7);
  });

  test("parry = floor(parry_modifier * level) + 1 when ADV-055 present", () => {
    // same: floor(0.5 * 14) + 1 = 8
    const result = buildSkills(
      skillsWithParry,
      character,
      { "ADV-055": { advantage_name: "REFLEXOS EM COMBATE" } },
    );
    expect(result.skills[parrySkillId].parry).toBe(8);
  });

  test("parry uses floored result (no decimal)", () => {
    // BRIGA parry_modifier = 0.6666…, level = 10 → floor(6.666…) = 6
    // Find BRIGA in the CSV to confirm, but test the floor behavior generally
    const skills = {
      [parrySkillId]: { base_value: 11, modifier: 0, isTrainedWithMaster: false },
    };
    const result = buildSkills(skills, character);
    expect(Number.isInteger(result.skills[parrySkillId].parry)).toBe(true);
  });

  test("modifier contributes to parry (level = base_value + modifier)", () => {
    // level = 14 + 2 = 16 → floor(0.5 * 16) = 8
    const skills = {
      [parrySkillId]: { base_value: 14, modifier: 2, isTrainedWithMaster: false },
    };
    const result = buildSkills(skills, character);
    expect(result.skills[parrySkillId].parry).toBe(8);
  });
});

// ─── isTrainedWithMaster tests ────────────────────────────────────────────────

describe("IS TRAINED WITH MASTER", () => {
  const eligibleSkillId  = "SKILL-044"; // Armas e Combate
  const ineligibleSkillId = "SKILL-000"; // Animais

  test("isTrainedWithMaster defaults to false if not provided", () => {
    const result = buildSkills(
      { [eligibleSkillId]: { base_value: 10, modifier: 0 } },
      character,
    );
    expect(result.skills[eligibleSkillId].isTrainedWithMaster).toBe(false);
  });

  test("isTrainedWithMaster is stored as true for eligible category", () => {
    const result = buildSkills(
      { [eligibleSkillId]: { base_value: 10, modifier: 0, isTrainedWithMaster: true } },
      character,
    );
    expect(result.skills[eligibleSkillId].isTrainedWithMaster).toBe(true);
  });

  test("isTrainedWithMaster is always false for non-eligible category regardless of input", () => {
    const result = buildSkills(
      { [ineligibleSkillId]: { base_value: 10, modifier: 0, isTrainedWithMaster: true } },
      character,
    );
    expect(result.skills[ineligibleSkillId].isTrainedWithMaster).toBe(false);
  });

  test("MASTER_ELIGIBLE_CATEGORIES contains Armas e Combate and Mágicas", () => {
    expect(MASTER_ELIGIBLE_CATEGORIES.has("Armas e Combate")).toBe(true);
    expect(MASTER_ELIGIBLE_CATEGORIES.has("Mágicas")).toBe(true);
    expect(MASTER_ELIGIBLE_CATEGORIES.has("Animais")).toBe(false);
  });
});

// ─── computeActions unit tests ────────────────────────────────────────────────

describe("COMPUTE ACTIONS", () => {
  describe("Non-eligible category always returns 1", () => {
    test.each([
      ["Animais", 8, 8, false],
      ["Animais", 16, 16, false],
      ["Animais", 24, 24, true],
      ["Sociais", 30, 30, true],
    ])("category=%s base=%d level=%d master=%s → 1", (category, base_value, level, isTrainedWithMaster) => {
      expect(computeActions({ category, base_value, level, isTrainedWithMaster })).toBe(1);
    });
  });

  describe("Eligible category WITHOUT master — every 8 levels above 8", () => {
    test.each([
      [1,  1,  1],
      [8,  8,  1],
      [9,  9,  1],  // 9 - 8 = 1 → floor(1/8) = 0 → 1 action
      [15, 15, 1],  // 15 - 8 = 7 → floor(7/8) = 0 → 1 action
      [16, 16, 2],
      [23, 23, 2],
      [24, 24, 3],
    ])("level=%d → %d actions", (base_value, level, expected) => {
      expect(computeActions({ category: "Armas e Combate", base_value, level, isTrainedWithMaster: false })).toBe(expected);
    });
  });

  describe("Eligible category WITH master — every 4 levels of base_value above 12", () => {
    test.each([
      [1,  1],
      [12, 1],
      [13, 1],  // 13 - 12 = 1 → floor(1/4) = 0 → 1 action
      [15, 1],
      [16, 2],
      [19, 2],
      [20, 3],
      [24, 4],
    ])("base_value=%d → %d actions", (base_value, expected) => {
      expect(computeActions({ category: "Armas e Combate", base_value, level: base_value, isTrainedWithMaster: true })).toBe(expected);
    });
  });

  describe("Mágicas category also respects master formula", () => {
    test("Mágicas with master, base 16 → 2 actions", () => {
      expect(computeActions({ category: "Mágicas", base_value: 16, level: 16, isTrainedWithMaster: true })).toBe(2);
    });

    test("Mágicas without master, level 16 → 2 actions", () => {
      expect(computeActions({ category: "Mágicas", base_value: 16, level: 16, isTrainedWithMaster: false })).toBe(2);
    });
  });
});

// ─── Integration: actions in buildSkills output ───────────────────────────────

describe("ACTIONS in buildSkills output", () => {
  const eligibleId = "SKILL-044"; // ESPADAS LONGAS

  test("All skills have an actions field", () => {
    const result = buildSkills(
      { [eligibleId]: { base_value: 10, modifier: 0, isTrainedWithMaster: false } },
      character,
    );
    expect(typeof result.skills[eligibleId].actions).toBe("number");
  });

  test("Eligible skill at level 8 → 1 action (no master)", () => {
    const result = buildSkills(
      { [eligibleId]: { base_value: 8, modifier: 0, isTrainedWithMaster: false } },
      character,
    );
    expect(result.skills[eligibleId].actions).toBe(1);
  });

  test("Eligible skill at level 16 → 2 actions (no master)", () => {
    const result = buildSkills(
      { [eligibleId]: { base_value: 16, modifier: 0, isTrainedWithMaster: false } },
      character,
    );
    expect(result.skills[eligibleId].actions).toBe(2);
  });

  test("Eligible skill base_value 16 with master → 2 actions", () => {
    const result = buildSkills(
      { [eligibleId]: { base_value: 16, modifier: 0, isTrainedWithMaster: true } },
      character,
    );
    expect(result.skills[eligibleId].actions).toBe(2);
  });

  test("Eligible skill base_value 20 with master → 3 actions", () => {
    const result = buildSkills(
      { [eligibleId]: { base_value: 20, modifier: 0, isTrainedWithMaster: true } },
      character,
    );
    expect(result.skills[eligibleId].actions).toBe(3);
  });
});
