const { buildCharacter } = require("engine/character/buildCharacter");

const assertShape = require("tests/helpers/assertShape");

describe("BUILD CHARACTER", () => {
  const mockInput = {
    advantages: ["ADV-001"],

    disadvantages: ["DIS-001"],

    primaryAttributes: {
      ST: { bought: 2 },

      HT: { bought: 1 },

      IQ: { bought: 0 },

      DX: { bought: 0 },
    },

    secondaryAttributes: {
      BasicSpeed: { bought: 2 },

      HP: { bought: 1 },
    },

    skills: {
      "SKILL-000": { base: 14, modifier: 0 },

      "SKILL-001": { base: 12, modifier: 1 },
    },

    carry_weight: {
      weight_modifier: -3,
    },
  };

  describe("Structure", () => {
    it("Should return character object with all sections", () => {
      const result = buildCharacter(mockInput);

      assertShape(result, ["character"]);

      assertShape(result.character, [
        "primary_attributes",
        "secondary_attributes",
        "base_damage",
        "advantages",
        "disadvantages",
        "skills",
        "character_points",
      ]);
    });
  });

  describe("Skills integration", () => {
    it("Should include selected skills only", () => {
      const { character } = buildCharacter(mockInput);

      const skills = character.skills;

      const skillIds = Object.keys(skills);

      expect(skillIds.length).toBe(Object.keys(mockInput.skills).length);

      skillIds.forEach((id) => {
        expect(Object.keys(mockInput.skills)).toContain(id);
      });
    });

    it("Should compute skills points correctly", () => {
      const { character } = buildCharacter(mockInput);

      const skills = Object.values(character.skills);

      const allHavePoints = skills.every(
        (skill) => typeof skill.points === "number",
      );

      expect(allHavePoints).toBe(true);

      const manualSum = skills.reduce((sum, skill) => sum + skill.points, 0);

      expect(character.character_points.skills).toBe(manualSum);
    });
  });

  describe("Primary and Secondary integration", () => {
    it("Should include both primary and secondary attributes", () => {
      const { character } = buildCharacter(mockInput);

      expect(character.primary_attributes).toBeDefined();

      expect(character.secondary_attributes).toBeDefined();
    });
  });

  describe("Movement integration", () => {
    it("Should reflect carry weight modifier on Movement", () => {
      const { character } = buildCharacter(mockInput);

      const movement = character.secondary_attributes.Movement;

      const HT = character.primary_attributes.HT.value;

      const DX = character.primary_attributes.DX.value;

      const basicSpeed =
        (HT + DX) / 4 + character.secondary_attributes.BasicSpeed.bought * 0.5;

      const expected = Math.floor(
        basicSpeed + mockInput.carry_weight.weight_modifier,
      );

      expect(movement.base_value).toBe(expected);
    });
  });

  describe("Carry weight propagation", () => {
    it("Should pass carry_weight into secondary builder", () => {
      const { character } = buildCharacter(mockInput);

      expect(character.secondary_attributes.Movement).toBeDefined();

      expect(character.secondary_attributes.Movement.base_value).toBeLessThan(
        character.secondary_attributes.BasicSpeed.value,
      );
    });
  });

  describe("Points aggregation", () => {
    it("Should include all point categories including skills", () => {
      const { character } = buildCharacter(mockInput);

      const points = character.character_points;

      assertShape(points, [
        "primary_attributes",
        "secondary_attributes",
        "advantages",
        "disadvantages",
        "skills",
      ]);
    });
  });

  describe("Advantages and Disadvantages", () => {
    it("Should return empty objects when none provided", () => {
      const { character } = buildCharacter(mockInput);

      expect(typeof character.advantages).toBe("object");

      expect(typeof character.disadvantages).toBe("object");
    });
  });

  describe("Equipped enchantment integration (end-to-end through buildCharacter)", () => {
    it("Should carry an attribute enchantment_modifier from input into the final primary attribute value", () => {
      const { character } = buildCharacter({
        ...mockInput,
        enchantmentAttributeModifiers: { ST: 3 },
      });

      const { character: withoutEnchantment } = buildCharacter(mockInput);

      expect(character.primary_attributes.ST.value).toBe(
        withoutEnchantment.primary_attributes.ST.value + 3,
      );
      expect(character.primary_attributes.ST.has_enchantment_modifier).toBe(
        true,
      );
    });

    it("Should carry a granted advantage through with 0 cost and is_enchantment true", () => {
      const { character } = buildCharacter({
        ...mockInput,
        enchantmentAdvantageIds: ["ADV-002"],
      });

      expect(character.advantages["ADV-002"]).toBeDefined();
      expect(character.advantages["ADV-002"].is_enchantment).toBe(true);
      expect(character.advantages["ADV-002"].points).toBe(0);
      expect(character.character_points.advantages).toBe(
        buildCharacter(mockInput).character.character_points.advantages,
      );
    });

    it("Should carry a granted skill through using the final (enchanted) attribute value as its base", () => {
      // SKILL-000 is IQ-based; give IQ a +2 enchantment_modifier and grant
      // the skill fresh — the granted base_value should equal the final
      // (enchanted) IQ, not the pre-enchantment one.
      const { character } = buildCharacter({
        ...mockInput,
        advantages: [],
        disadvantages: [],
        skills: {},
        enchantmentAttributeModifiers: { IQ: 2 },
        enchantmentSkillGrants: { "SKILL-000": [0] },
      });

      const finalIQ = character.primary_attributes.IQ.value;

      expect(character.skills["SKILL-000"]).toBeDefined();
      expect(character.skills["SKILL-000"].base_value).toBe(finalIQ);
      expect(character.skills["SKILL-000"].is_enchantment).toBe(true);
      expect(character.skills["SKILL-000"].points).toBe(0);
    });

    it("Should carry a fortify_skill enchantment_modifier through to the final skill value", () => {
      const { character } = buildCharacter({
        ...mockInput,
        skills: { "SKILL-000": { base_value: 14, modifier: 0 } },
        enchantmentSkillModifiers: { "SKILL-000": 3 },
      });

      expect(character.skills["SKILL-000"].enchantment_modifier).toBe(3);
      expect(character.skills["SKILL-000"].value).toBe(17);
    });
  });
});
