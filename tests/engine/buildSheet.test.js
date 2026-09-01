const { buildSheet } = require("engine/buildSheet");
const assertShape = require("tests/helpers/assertShape");

describe("BUILD SHEET", () => {
  const mockInput = {
    character: {
      advantages: [],
      disadvantages: [],
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
    },
    inventory: {
      weight: 40,
    },
  };

  describe("Structure", () => {
    it("Should return character and inventory sections", () => {
      const result = buildSheet(mockInput);

      assertShape(result, ["character", "inventory"]);
    });

    it("Character should contain all expected sections", () => {
      const { character } = buildSheet(mockInput);

      assertShape(character, [
        "primary_attributes",
        "secondary_attributes",
        "advantages",
        "disadvantages",
        "character_points",
      ]);
    });
  });

  describe("Primary → Inventory → Secondary flow", () => {
    it("Should use ST from primary attributes in inventory", () => {
      const result = buildSheet(mockInput);

      const ST = result.character.primary_attributes.ST.value;

      expect(result.inventory).toHaveProperty("carry_weight");
      expect(result.inventory.carry_weight.limits.none).toBe(ST);
    });

    it("Movement should be affected by weight", () => {
      const result = buildSheet(mockInput);

      const { character } = result;

      const movement = character.secondary_attributes.Movement;

      const HT = character.primary_attributes.HT.value;
      const DX = character.primary_attributes.DX.value;

      const baseSpeed = (HT + DX) / 4 + 2 * 0.5;

      const expected = Math.floor(baseSpeed - 2);

      expect(movement.base_value).toBe(expected);
    });
  });

  describe("Inventory integration", () => {
    it("Should include weight modifier from inventory", () => {
      const result = buildSheet(mockInput);

      expect(result.inventory.carry_weight).toHaveProperty("weight_modifier");
    });

    it("Should correctly classify weight tiers", () => {
      const result = buildSheet(mockInput);

      const { limits } = result.inventory.carry_weight;

      expect(limits).toHaveProperty("none");
      expect(limits).toHaveProperty("light");
      expect(limits).toHaveProperty("medium");
      expect(limits).toHaveProperty("heavy");
      expect(limits).toHaveProperty("veryHeavy");
    });
  });

  describe("Points integrity (UPDATED MODEL)", () => {
    it("Should include all point categories", () => {
      const { character } = buildSheet(mockInput);

      assertShape(character.character_points, [
        "primary_attributes",
        "secondary_attributes",
        "skills",
        "advantages",
        "disadvantages",
        "spells",
      ]);
    });

    it("Should have numeric totals for attributes", () => {
      const { character } = buildSheet(mockInput);

      const points = character.character_points;

      expect(typeof points.primary_attributes).toBe("number");
      expect(typeof points.secondary_attributes).toBe("number");
    });

    it("Skills, advantages and disadvantages should be numeric totals", () => {
      const { character } = buildSheet(mockInput);

      const points = character.character_points;

      expect(typeof points.skills).toBe("number");
      expect(typeof points.advantages).toBe("number");
      expect(typeof points.disadvantages).toBe("number");
    });
  });

  describe("Consistency", () => {
    it("Primary attributes should have correct structure", () => {
      const { character } = buildSheet(mockInput);

      Object.values(character.primary_attributes).forEach((attr) => {
        expect(attr).toHaveProperty("base_value");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
      });
    });

    it("Secondary attributes should have correct structure", () => {
      const { character } = buildSheet(mockInput);

      Object.values(character.secondary_attributes).forEach((attr) => {
        expect(attr).toHaveProperty("base_value");
        expect(attr).toHaveProperty("bought");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
        expect(attr).toHaveProperty("points");
      });
    });
  });

  describe("Elemental resistances propagation (race → character, full pipeline)", () => {
    it("Should default every element to race_base 1 when no race is given", () => {
      const { character } = buildSheet(mockInput);

      expect(character.elemental_resistances.Fire).toEqual({
        race_base: 1,
        modifier: 0,
        enchantment_modifier: 0,
        has_enchantment_modifier: false,
        final: 1,
      });
    });

    it("Should thread race.elemental_modifiers through to character.elemental_resistances", () => {
      const { character } = buildSheet({
        ...mockInput,
        race: {
          elemental_modifiers: { Fire: 0.5, Necrotic: 2 },
        },
      });

      expect(character.elemental_resistances.Fire.race_base).toBe(0.5);
      expect(character.elemental_resistances.Fire.final).toBe(0.5);
      expect(character.elemental_resistances.Necrotic.race_base).toBe(2);
      // Untouched types stay at the default
      expect(character.elemental_resistances.Ice.race_base).toBe(1);
    });

    it("Should combine the race base with a player-entered modifier from character.secondaryAttributes.elementalResistances", () => {
      const { character } = buildSheet({
        ...mockInput,
        race: { elemental_modifiers: { Fire: 1 } },
        character: {
          ...mockInput.character,
          secondaryAttributes: {
            ...mockInput.character.secondaryAttributes,
            elementalResistances: { Fire: { modifier: -0.3 } },
          },
        },
      });

      expect(character.elemental_resistances.Fire.final).toBeCloseTo(0.7);
    });

    it("Should floor the final value at 0 rather than allow it to go negative", () => {
      const { character } = buildSheet({
        ...mockInput,
        race: { elemental_modifiers: { Fire: 0.2 } },
        character: {
          ...mockInput.character,
          secondaryAttributes: {
            ...mockInput.character.secondaryAttributes,
            elementalResistances: { Fire: { modifier: -5 } },
          },
        },
      });

      expect(character.elemental_resistances.Fire.final).toBe(0);
    });
  });

  describe("Equipped enchantment integration (full pipeline: inventory → character)", () => {
    it("Should boost a primary attribute from an equipped fortify_attribute accessory", () => {
      const enchantedInput = {
        ...mockInput,
        inventory: {
          ...mockInput.inventory,
          accessories: [
            {
              _instanceId: "acc-1",
              accessory_id: "ACCESSORY-000",
              is_equipped: true,
              storedAt: null,
              price: 0,
              enchantments: [
                {
                  _instanceId: "ench-1",
                  enchantment_id: "ENCHANTMENT-000",
                  value: 2,
                },
              ],
            },
          ],
        },
      };

      const baseline = buildSheet(mockInput);
      const enchanted = buildSheet(enchantedInput);

      expect(enchanted.character.primary_attributes.ST.value).toBe(
        baseline.character.primary_attributes.ST.value + 2,
      );
      expect(
        enchanted.character.primary_attributes.ST.has_enchantment_modifier,
      ).toBe(true);
      // Fortifying costs no character points
      expect(enchanted.character.character_points.primary_attributes).toBe(
        baseline.character.character_points.primary_attributes,
      );
    });

    it("Should NOT apply an enchantment from an item that isn't equipped", () => {
      const unequippedInput = {
        ...mockInput,
        inventory: {
          ...mockInput.inventory,
          accessories: [
            {
              _instanceId: "acc-1",
              accessory_id: "ACCESSORY-000",
              is_equipped: false,
              storedAt: "backpack",
              price: 0,
              enchantments: [
                {
                  _instanceId: "ench-1",
                  enchantment_id: "ENCHANTMENT-000",
                  value: 2,
                },
              ],
            },
          ],
        },
      };

      const baseline = buildSheet(mockInput);
      const result = buildSheet(unequippedInput);

      expect(result.character.primary_attributes.ST.value).toBe(
        baseline.character.primary_attributes.ST.value,
      );
      expect(
        result.character.primary_attributes.ST.has_enchantment_modifier,
      ).toBe(false);
    });

    it("Should grant an advantage from an equipped item with 0 point cost", () => {
      const result = buildSheet({
        ...mockInput,
        inventory: {
          ...mockInput.inventory,
          accessories: [
            {
              _instanceId: "acc-1",
              accessory_id: "ACCESSORY-000",
              is_equipped: true,
              storedAt: null,
              price: 0,
              enchantments: [
                {
                  _instanceId: "ench-1",
                  enchantment_id: "ENCHANTMENT-028",
                  target: "ADV-000",
                },
              ],
            },
          ],
        },
      });

      expect(result.character.advantages["ADV-000"]).toBeDefined();
      expect(result.character.advantages["ADV-000"].is_enchantment).toBe(true);
      expect(result.character.advantages["ADV-000"].points).toBe(0);
    });

    it("Should boost a secondary attribute from an equipped fortify_attribute magic gear item", () => {
      const enchantedInput = {
        ...mockInput,
        inventory: {
          ...mockInput.inventory,
          magic_gear: [
            {
              _instanceId: "mg-1",
              magic_gear_id: "MAGIC_GEAR-001",
              is_equipped: true,
              storedAt: null,
              enchantments: [
                {
                  _instanceId: "ench-1",
                  enchantment_id: "ENCHANTMENT-010",
                  value: 2,
                },
              ],
            },
          ],
        },
      };

      const baseline = buildSheet(mockInput);
      const enchanted = buildSheet(enchantedInput);

      expect(enchanted.character.secondary_attributes.Mana.value).toBe(
        baseline.character.secondary_attributes.Mana.value + 2,
      );
      expect(
        enchanted.character.secondary_attributes.Mana.has_enchantment_modifier,
      ).toBe(true);
    });

    it("Should NOT apply an enchantment from a magic gear item that isn't equipped", () => {
      const unequippedInput = {
        ...mockInput,
        inventory: {
          ...mockInput.inventory,
          magic_gear: [
            {
              _instanceId: "mg-1",
              magic_gear_id: "MAGIC_GEAR-001",
              is_equipped: false,
              storedAt: "backpack",
              enchantments: [
                {
                  _instanceId: "ench-1",
                  enchantment_id: "ENCHANTMENT-010",
                  value: 2,
                },
              ],
            },
          ],
        },
      };

      const baseline = buildSheet(mockInput);
      const result = buildSheet(unequippedInput);

      expect(result.character.secondary_attributes.Mana.value).toBe(
        baseline.character.secondary_attributes.Mana.value,
      );
      expect(
        result.character.secondary_attributes.Mana.has_enchantment_modifier,
      ).toBe(false);
    });

    it("Should combine enchantment effects from equipped accessories and magic gear simultaneously", () => {
      const result = buildSheet({
        ...mockInput,
        inventory: {
          ...mockInput.inventory,
          accessories: [
            {
              _instanceId: "acc-1",
              accessory_id: "ACCESSORY-000",
              is_equipped: true,
              storedAt: null,
              price: 0,
              enchantments: [
                {
                  _instanceId: "ench-1",
                  enchantment_id: "ENCHANTMENT-000",
                  value: 1,
                },
              ],
            },
          ],
          magic_gear: [
            {
              _instanceId: "mg-1",
              magic_gear_id: "MAGIC_GEAR-001",
              is_equipped: true,
              storedAt: null,
              enchantments: [
                {
                  _instanceId: "ench-2",
                  enchantment_id: "ENCHANTMENT-010",
                  value: 1,
                },
              ],
            },
          ],
        },
      });

      const baseline = buildSheet(mockInput);

      expect(result.character.primary_attributes.ST.value).toBe(
        baseline.character.primary_attributes.ST.value + 1,
      );
      expect(result.character.secondary_attributes.Mana.value).toBe(
        baseline.character.secondary_attributes.Mana.value + 1,
      );
    });
  });
});
