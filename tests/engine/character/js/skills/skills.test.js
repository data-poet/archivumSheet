const {
  buildSkills,
  computeActions,
  MASTER_ELIGIBLE_CATEGORIES,
} = require("engine/character/js/skills/skills");
const { SKILL } = require("tests/helpers/dataRefs");
const { REFLEXOS_EM_COMBATE_ID } = require("helpers/ids.js");
const { loadDataset } = require("helpers/datasets.js");
const { getSkillCost } = require("engine/character/js/skills/skillsCost");

const assertShape = require("tests/helpers/assertShape");

const character = {
  primary_attributes: {
    DX: { base_value: 12 },
    IQ: { base_value: 10 },
  },
};

const selectedSkills = {
  [SKILL.adestramentoDeAnimais]: {
    base_value: 14,
    modifier: 0,
    isTrainedWithMaster: false,
  }, // ADESTRAMENTO DE ANIMAIS
  [SKILL.falcoaria]: {
    base_value: 12,
    modifier: 1,
    isTrainedWithMaster: false,
  },
};

describe("BUILD SKILLS (ENGINE)", () => {
  test("Should price an HT skill like the same skill on DX", () => {
    const htCharacter = {
      primary_attributes: { HT: { base_value: 12 } },
    };
    const row = loadDataset("SKILLS").find((r) => r.skill_id === SKILL.corrida);
    expect(row.skill_base_attribute).toBe("HT");

    const { skills } = buildSkills(
      { [SKILL.corrida]: { base_value: 14, modifier: 0 } },
      htCharacter,
    );

    const expected = getSkillCost({
      attribute: "DX",
      base: 12,
      level: 14,
      difficulty: row.skill_difficulty,
    });
    expect(expected).toBeGreaterThan(0);
    expect(skills[SKILL.corrida].points).toBe(expected);
  });

  test("Should build selected skills only", () => {
    const result = buildSkills(selectedSkills, character);
    assertShape(result, ["skills", "character_points"]);
    expect(typeof result.character_points.skills).toBe("number");
  });

  test("Should attach the 4e critical ranges for each skill's final level", () => {
    const { criticalRanges } = require("helpers/criticalRanges");
    const result = buildSkills(selectedSkills, character);
    Object.values(result.skills).forEach((skill) => {
      expect(skill.critical).toEqual(criticalRanges(skill.value));
    });
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

describe("SKILL PARRY", () => {
  const parrySkillId = SKILL.espadasLongas; // ESPADAS LONGAS
  const nonParrySkillId = SKILL.adestramentoDeAnimais; // ADESTRAMENTO DE ANIMAIS

  const skillsWithParry = {
    [parrySkillId]: { base_value: 14, modifier: 0, isTrainedWithMaster: false },
    [nonParrySkillId]: {
      base_value: 10,
      modifier: 0,
      isTrainedWithMaster: false,
    },
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

  test("parry = 3 + floor(level / 2) + bonus (4e) — no Reflexos em Combate", () => {
    // ESPADAS LONGAS bonus 0, level 14 → 3 + 7 = 10
    const result = buildSkills(skillsWithParry, character);
    expect(result.skills[parrySkillId].parry).toBe(10);
  });

  test("parry = 3 + floor(level / 2) + bonus + 1 when Reflexos em Combate present", () => {
    // same: 3 + 7 + 1 = 11
    const result = buildSkills(skillsWithParry, character, {
      [REFLEXOS_EM_COMBATE_ID]: { advantage_name: "REFLEXOS EM COMBATE" },
    });
    expect(result.skills[parrySkillId].parry).toBe(11);
  });

  test("parry uses floored result (no decimal)", () => {
    // level 11 → 3 + floor(5.5) = 8
    const skills = {
      [parrySkillId]: {
        base_value: 11,
        modifier: 0,
        isTrainedWithMaster: false,
      },
    };
    const result = buildSkills(skills, character);
    expect(Number.isInteger(result.skills[parrySkillId].parry)).toBe(true);
  });

  test("modifier contributes to parry (level = base_value + modifier)", () => {
    // level = 14 + 2 = 16 → 3 + 8 = 11
    const skills = {
      [parrySkillId]: {
        base_value: 14,
        modifier: 2,
        isTrainedWithMaster: false,
      },
    };
    const result = buildSkills(skills, character);
    expect(result.skills[parrySkillId].parry).toBe(11);
  });
});

describe("SKILL PARRY — 4e bonuses", () => {
  test.each([
    [SKILL.bastao, "BASTÃO", 2],
    [SKILL.faca, "FACA", -1],
  ])("%s (%s) adds %i to 3 + floor(level / 2)", (id, _name, bonus) => {
    const result = buildSkills(
      { [id]: { base_value: 12, modifier: 0, isTrainedWithMaster: false } },
      character,
    );
    expect(result.skills[id].parry).toBe(3 + 6 + bonus);
  });
});

describe("IS TRAINED WITH MASTER", () => {
  const eligibleSkillId = SKILL.espadasLongas; // Armas e Combate
  const ineligibleSkillId = SKILL.adestramentoDeAnimais; // Animais

  test("isTrainedWithMaster defaults to false if not provided", () => {
    const result = buildSkills(
      { [eligibleSkillId]: { base_value: 10, modifier: 0 } },
      character,
    );
    expect(result.skills[eligibleSkillId].isTrainedWithMaster).toBe(false);
  });

  test("isTrainedWithMaster is stored as true for eligible category", () => {
    const result = buildSkills(
      {
        [eligibleSkillId]: {
          base_value: 10,
          modifier: 0,
          isTrainedWithMaster: true,
        },
      },
      character,
    );
    expect(result.skills[eligibleSkillId].isTrainedWithMaster).toBe(true);
  });

  test("isTrainedWithMaster is always false for non-eligible category regardless of input", () => {
    const result = buildSkills(
      {
        [ineligibleSkillId]: {
          base_value: 10,
          modifier: 0,
          isTrainedWithMaster: true,
        },
      },
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

describe("COMPUTE ACTIONS", () => {
  describe("Non-eligible category always returns 1", () => {
    test.each([
      ["Animais", 8, 8, false],
      ["Animais", 16, 16, false],
      ["Animais", 24, 24, true],
      ["Sociais", 30, 30, true],
    ])(
      "category=%s base=%d level=%d master=%s → 1",
      (category, base_value, level, isTrainedWithMaster) => {
        expect(
          computeActions({ category, base_value, level, isTrainedWithMaster }),
        ).toBe(1);
      },
    );
  });

  describe("Eligible category WITHOUT master — every 8 levels above 8", () => {
    test.each([
      [1, 1, 1],
      [8, 8, 1],
      [9, 9, 1], // 9 - 8 = 1 → floor(1/8) = 0 → 1 action
      [15, 15, 1], // 15 - 8 = 7 → floor(7/8) = 0 → 1 action
      [16, 16, 2],
      [23, 23, 2],
      [24, 24, 3],
    ])("level=%d → %d actions", (base_value, level, expected) => {
      expect(
        computeActions({
          category: "Armas e Combate",
          base_value,
          level,
          isTrainedWithMaster: false,
        }),
      ).toBe(expected);
    });
  });

  describe("Eligible category WITH master — every 4 levels of base_value above 12", () => {
    test.each([
      [1, 1],
      [12, 1],
      [13, 1], // 13 - 12 = 1 → floor(1/4) = 0 → 1 action
      [15, 1],
      [16, 2],
      [19, 2],
      [20, 3],
      [24, 4],
    ])("base_value=%d → %d actions", (base_value, expected) => {
      expect(
        computeActions({
          category: "Armas e Combate",
          base_value,
          level: base_value,
          isTrainedWithMaster: true,
        }),
      ).toBe(expected);
    });
  });

  describe("Mágicas category also respects master formula", () => {
    test("Mágicas with master, base 16 → 2 actions", () => {
      expect(
        computeActions({
          category: "Mágicas",
          base_value: 16,
          level: 16,
          isTrainedWithMaster: true,
        }),
      ).toBe(2);
    });

    test("Mágicas without master, level 16 → 2 actions", () => {
      expect(
        computeActions({
          category: "Mágicas",
          base_value: 16,
          level: 16,
          isTrainedWithMaster: false,
        }),
      ).toBe(2);
    });
  });
});

describe("ACTIONS in buildSkills output", () => {
  const eligibleId = SKILL.espadasLongas; // ESPADAS LONGAS

  test("All skills have an actions field", () => {
    const result = buildSkills(
      {
        [eligibleId]: {
          base_value: 10,
          modifier: 0,
          isTrainedWithMaster: false,
        },
      },
      character,
    );
    expect(typeof result.skills[eligibleId].actions).toBe("number");
  });

  test("Eligible skill at level 8 → 1 action (no master)", () => {
    const result = buildSkills(
      {
        [eligibleId]: {
          base_value: 8,
          modifier: 0,
          isTrainedWithMaster: false,
        },
      },
      character,
    );
    expect(result.skills[eligibleId].actions).toBe(1);
  });

  test("Eligible skill at level 16 → 2 actions (no master)", () => {
    const result = buildSkills(
      {
        [eligibleId]: {
          base_value: 16,
          modifier: 0,
          isTrainedWithMaster: false,
        },
      },
      character,
    );
    expect(result.skills[eligibleId].actions).toBe(2);
  });

  test("Eligible skill base_value 16 with master → 2 actions", () => {
    const result = buildSkills(
      {
        [eligibleId]: {
          base_value: 16,
          modifier: 0,
          isTrainedWithMaster: true,
        },
      },
      character,
    );
    expect(result.skills[eligibleId].actions).toBe(2);
  });

  test("Eligible skill base_value 20 with master → 3 actions", () => {
    const result = buildSkills(
      {
        [eligibleId]: {
          base_value: 20,
          modifier: 0,
          isTrainedWithMaster: true,
        },
      },
      character,
    );
    expect(result.skills[eligibleId].actions).toBe(3);
  });
});

describe("BUILD SKILLS — equipped enchantment grants and modifiers", () => {
  test("Should create a skill purely from a grant when the player doesn't have it", () => {
    const result = buildSkills(
      {},
      character,
      {},
      { [SKILL.adestramentoDeAnimais]: [2] }, // grant: attributeBase(10) + 2 extra = 12
    );

    expect(result.skills[SKILL.adestramentoDeAnimais]).toBeDefined();
    expect(result.skills[SKILL.adestramentoDeAnimais].base_value).toBe(10);
    expect(result.skills[SKILL.adestramentoDeAnimais].modifier).toBe(2);
    expect(result.skills[SKILL.adestramentoDeAnimais].value).toBe(12);
    expect(result.skills[SKILL.adestramentoDeAnimais].is_enchantment).toBe(
      true,
    );
    expect(result.skills[SKILL.adestramentoDeAnimais].points).toBe(0);
    expect(result.character_points.skills).toBe(0);
  });

  test("Should not create any entry from a fortify_skill modifier alone (no-op if not known)", () => {
    const result = buildSkills(
      {},
      character,
      {},
      {},
      { [SKILL.adestramentoDeAnimais]: 3 },
    );

    expect(result.skills[SKILL.adestramentoDeAnimais]).toBeUndefined();
  });

  test("Should prefer the player's own purchase when it's higher than the best grant", () => {
    const result = buildSkills(
      { [SKILL.adestramentoDeAnimais]: { base_value: 16, modifier: 0 } }, // player level 16
      character,
      {},
      { [SKILL.adestramentoDeAnimais]: [2] }, // grant level 12
    );

    expect(result.skills[SKILL.adestramentoDeAnimais].is_enchantment).toBe(
      false,
    );
    expect(result.skills[SKILL.adestramentoDeAnimais].value).toBe(16);
    expect(result.skills[SKILL.adestramentoDeAnimais].points).toBeGreaterThan(
      0,
    );
  });

  test("Should prefer the grant when it's higher than the player's own purchase", () => {
    const result = buildSkills(
      { [SKILL.adestramentoDeAnimais]: { base_value: 11, modifier: 0 } }, // player level 11
      character,
      {},
      { [SKILL.adestramentoDeAnimais]: [5] }, // grant level 10 + 5 = 15
    );

    expect(result.skills[SKILL.adestramentoDeAnimais].is_enchantment).toBe(
      true,
    );
    expect(result.skills[SKILL.adestramentoDeAnimais].value).toBe(15);
    expect(result.skills[SKILL.adestramentoDeAnimais].points).toBe(0);
  });

  test("Should prefer the player's own purchase on a tie", () => {
    const result = buildSkills(
      { [SKILL.adestramentoDeAnimais]: { base_value: 12, modifier: 0 } }, // player level 12
      character,
      {},
      { [SKILL.adestramentoDeAnimais]: [2] }, // grant level 10 + 2 = 12 (tie)
    );

    expect(result.skills[SKILL.adestramentoDeAnimais].is_enchantment).toBe(
      false,
    );
    expect(result.skills[SKILL.adestramentoDeAnimais].points).toBeGreaterThan(
      0,
    );
  });

  test("Should use the single highest grant when multiple items grant the same skill (no stacking)", () => {
    const result = buildSkills(
      {},
      character,
      {},
      { [SKILL.adestramentoDeAnimais]: [1, 4, 2] }, // best is +4 -> level 14
    );

    expect(result.skills[SKILL.adestramentoDeAnimais].modifier).toBe(4);
    expect(result.skills[SKILL.adestramentoDeAnimais].value).toBe(14);
  });

  test("Should add a positive fortify_skill enchantment_modifier on top of the winning source", () => {
    const result = buildSkills(
      { [SKILL.adestramentoDeAnimais]: { base_value: 14, modifier: 0 } },
      character,
      {},
      {},
      { [SKILL.adestramentoDeAnimais]: 3 },
    );

    expect(
      result.skills[SKILL.adestramentoDeAnimais].enchantment_modifier,
    ).toBe(3);
    expect(
      result.skills[SKILL.adestramentoDeAnimais].has_enchantment_modifier,
    ).toBe(true);
    expect(result.skills[SKILL.adestramentoDeAnimais].value).toBe(17); // 14 + 3
  });

  test("Should subtract a negative weaken_skill enchantment_modifier", () => {
    const result = buildSkills(
      { [SKILL.adestramentoDeAnimais]: { base_value: 14, modifier: 0 } },
      character,
      {},
      {},
      { [SKILL.adestramentoDeAnimais]: -3 },
    );

    expect(result.skills[SKILL.adestramentoDeAnimais].value).toBe(11); // 14 - 3
  });

  test("Should not let enchantment_modifier affect points cost (cost reflects investment only)", () => {
    const withoutModifier = buildSkills(
      { [SKILL.adestramentoDeAnimais]: { base_value: 14, modifier: 0 } },
      character,
    );
    const withModifier = buildSkills(
      { [SKILL.adestramentoDeAnimais]: { base_value: 14, modifier: 0 } },
      character,
      {},
      {},
      { [SKILL.adestramentoDeAnimais]: 5 },
    );

    expect(withModifier.skills[SKILL.adestramentoDeAnimais].points).toBe(
      withoutModifier.skills[SKILL.adestramentoDeAnimais].points,
    );
    expect(withModifier.character_points.skills).toBe(
      withoutModifier.character_points.skills,
    );
  });

  test("Should default has_enchantment_modifier to false for a skill with no equipped fortify/weaken", () => {
    const result = buildSkills(
      { [SKILL.adestramentoDeAnimais]: { base_value: 14, modifier: 0 } },
      character,
    );

    expect(
      result.skills[SKILL.adestramentoDeAnimais].enchantment_modifier,
    ).toBe(0);
    expect(
      result.skills[SKILL.adestramentoDeAnimais].has_enchantment_modifier,
    ).toBe(false);
  });

  test("Should default is_enchantment to false for a normal player purchase", () => {
    const result = buildSkills(selectedSkills, character);

    expect(result.skills[SKILL.adestramentoDeAnimais].is_enchantment).toBe(
      false,
    );
  });

  test("Should use the FINAL (post-enchantment) attribute value as the grant base, not the pre-enchantment base_value", () => {
    const enchantedCharacter = {
      primary_attributes: {
        ...character.primary_attributes,
        IQ: { base_value: 10, value: 12 }, // IQ fortified by another equipped item
      },
    };

    const result = buildSkills(
      {},
      enchantedCharacter,
      {},
      { [SKILL.adestramentoDeAnimais]: [0] },
    );

    expect(result.skills[SKILL.adestramentoDeAnimais].base_value).toBe(12); // final IQ, not base_value 10
  });
});
