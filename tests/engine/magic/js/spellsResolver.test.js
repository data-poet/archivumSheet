const {
  resolveSpells,
  getSpellTierByLevel,
} = require("engine/magic/js/spellsResolver");

const assertShape = require("tests/helpers/assertShape");

describe("SPELL RESOLVER", () => {
  const mockRows = [
    {
      spell_id: "ARC-001-A",
      spell_name: "Moldar Mana",
      spell_tier: "Aprendiz",
      spell_school: "Arcano",
      spell_type: "Controle",
    },
    {
      spell_id: "ARC-001-E",
      spell_name: "Moldar Mana",
      spell_tier: "Experiente",
      spell_school: "Arcano",
      spell_type: "Controle",
    },
    {
      spell_id: "ARC-001-V",
      spell_name: "Moldar Mana",
      spell_tier: "Veterano",
      spell_school: "Arcano",
      spell_type: "Controle",
    },
  ];

  describe("Tier Resolution", () => {
    test("Should resolve correct tiers based on level", () => {
      expect(getSpellTierByLevel(10)).toBe("Aprendiz");
      expect(getSpellTierByLevel(13)).toBe("Experiente");
      expect(getSpellTierByLevel(16)).toBe("Veterano");
      expect(getSpellTierByLevel(18)).toBe("Especialista");
      expect(getSpellTierByLevel(21)).toBe("Mestre");
    });
  });

  describe("Spell Matching", () => {
    test("Should resolve correct spell_id based on level", () => {
      const result = resolveSpells({
        selectedSpells: {
          "Moldar Mana": { base_value: 14, modifier: 0 }, // level 14 → Experiente
        },
        rows: mockRows,
        character: {},
      });

      expect(result["ARC-001-E"]).toBeDefined();
      expect(result["ARC-001-E"].tier).toBe("Experiente");
    });

    test("Should resolve Aprendiz tier correctly", () => {
      const result = resolveSpells({
        selectedSpells: {
          "Moldar Mana": { base_value: 10, modifier: 0 },
        },
        rows: mockRows,
        character: {},
      });

      expect(result["ARC-001-A"]).toBeDefined();
    });
  });

  describe("Normalization", () => {
    test("Should match ignoring case", () => {
      const result = resolveSpells({
        selectedSpells: {
          "moldar mana": { base_value: 10, modifier: 0 },
        },
        rows: mockRows,
        character: {},
      });

      expect(result["ARC-001-A"]).toBeDefined();
    });

    test("Should match ignoring accents", () => {
      const rowsWithAccent = [
        {
          spell_id: "ARC-002-A",
          spell_name: "Moldár Mana",
          spell_tier: "Aprendiz",
          spell_school: "Arcano",
          spell_type: "Controle",
        },
      ];

      const result = resolveSpells({
        selectedSpells: {
          "Moldar Mana": { base_value: 10, modifier: 0 },
        },
        rows: rowsWithAccent,
        character: {},
      });

      expect(result["ARC-002-A"]).toBeDefined();
    });
  });

  describe("Failure Cases", () => {
    test("Should return empty if spell not found", () => {
      const result = resolveSpells({
        selectedSpells: {
          "Spell Inexistente": { base_value: 10, modifier: 0 },
        },
        rows: mockRows,
        character: {},
      });

      expect(Object.keys(result).length).toBe(0);
    });

    test("Should return empty if tier not found", () => {
      const result = resolveSpells({
        selectedSpells: {
          "Moldar Mana": { base_value: 20, modifier: 0 }, // Mestre not in mock
        },
        rows: mockRows,
        character: {},
      });

      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe("Structure", () => {
    test("Resolved spell should have correct structure", () => {
      const result = resolveSpells({
        selectedSpells: {
          "Moldar Mana": { base_value: 10, modifier: 0 },
        },
        rows: mockRows,
        character: { iq: 12 },
      });

      const spell = Object.values(result)[0];

      assertShape(spell, [
        "spell_id",
        "name",
        "school",
        "category",
        "tier",
        "attribute",
        "attribute_base",
        "base_value",
        "modifier",
        "level",
      ]);
    });
  });

  describe("Equipped enchantment integration", () => {
    test("Should create a spell purely from a grant when the player doesn't have it", () => {
      const result = resolveSpells({
        selectedSpells: {},
        rows: mockRows,
        character: { iq: 10 },
        enchantmentSpellGrants: { "Moldar Mana": [0] }, // level 10 -> Aprendiz
      });

      expect(result["ARC-001-A"]).toBeDefined();
      expect(result["ARC-001-A"].base_value).toBe(10);
      expect(result["ARC-001-A"].modifier).toBe(0);
      expect(result["ARC-001-A"].is_enchantment).toBe(true);
      expect(result["ARC-001-A"].level).toBe(10);
    });

    test("Should not create any entry from a fortify_spell modifier alone (no-op if not known)", () => {
      const result = resolveSpells({
        selectedSpells: {},
        rows: mockRows,
        character: { iq: 10 },
        enchantmentSpellModifiers: { "Moldar Mana": 3 },
      });

      expect(Object.keys(result).length).toBe(0);
    });

    test("Should prefer the player's own purchase when it's higher than the best grant", () => {
      const result = resolveSpells({
        selectedSpells: { "Moldar Mana": { base_value: 14, modifier: 0 } }, // player level 14
        rows: mockRows,
        character: { iq: 10 },
        enchantmentSpellGrants: { "Moldar Mana": [2] }, // grant level 12
      });

      const spell = result["ARC-001-E"]; // tier for level 14
      expect(spell).toBeDefined();
      expect(spell.is_enchantment).toBe(false);
      expect(spell.level).toBe(14);
    });

    test("Should prefer the grant when it's higher than the player's own purchase", () => {
      const result = resolveSpells({
        selectedSpells: { "Moldar Mana": { base_value: 10, modifier: 0 } }, // player level 10
        rows: mockRows,
        character: { iq: 10 },
        enchantmentSpellGrants: { "Moldar Mana": [4] }, // grant level 14
      });

      const spell = result["ARC-001-E"];
      expect(spell).toBeDefined();
      expect(spell.is_enchantment).toBe(true);
      expect(spell.level).toBe(14);
    });

    test("Should prefer the player's own purchase on a tie", () => {
      const result = resolveSpells({
        selectedSpells: { "Moldar Mana": { base_value: 10, modifier: 0 } }, // player level 10
        rows: mockRows,
        character: { iq: 10 },
        enchantmentSpellGrants: { "Moldar Mana": [0] }, // grant level 10 (tie)
      });

      expect(result["ARC-001-A"].is_enchantment).toBe(false);
    });

    test("Should use the single highest grant when multiple items grant the same spell (no stacking)", () => {
      const result = resolveSpells({
        selectedSpells: {},
        rows: mockRows,
        character: { iq: 10 },
        enchantmentSpellGrants: { "Moldar Mana": [0, 4, 2] }, // best is +4 -> level 14
      });

      expect(result["ARC-001-E"]).toBeDefined();
      expect(result["ARC-001-E"].modifier).toBe(4);
    });

    test("Should add a positive fortify_spell enchantment_modifier on top of the winning source", () => {
      const result = resolveSpells({
        selectedSpells: { "Moldar Mana": { base_value: 10, modifier: 0 } },
        rows: mockRows,
        character: { iq: 10 },
        enchantmentSpellModifiers: { "Moldar Mana": 3 }, // level 10 + 3 = 13 -> Experiente
      });

      expect(result["ARC-001-E"]).toBeDefined();
      expect(result["ARC-001-E"].enchantment_modifier).toBe(3);
      expect(result["ARC-001-E"].has_enchantment_modifier).toBe(true);
      expect(result["ARC-001-E"].level).toBe(13);
    });

    test("Should subtract a negative weaken_spell enchantment_modifier", () => {
      const result = resolveSpells({
        selectedSpells: { "Moldar Mana": { base_value: 16, modifier: 0 } },
        rows: mockRows,
        character: { iq: 10 },
        enchantmentSpellModifiers: { "Moldar Mana": -3 }, // level 16 - 3 = 13 -> Experiente
      });

      expect(result["ARC-001-E"]).toBeDefined();
      expect(result["ARC-001-E"].level).toBe(13);
    });

    test("Should default has_enchantment_modifier to false for a spell with no equipped fortify/weaken", () => {
      const result = resolveSpells({
        selectedSpells: { "Moldar Mana": { base_value: 10, modifier: 0 } },
        rows: mockRows,
        character: { iq: 10 },
      });

      expect(result["ARC-001-A"].enchantment_modifier).toBe(0);
      expect(result["ARC-001-A"].has_enchantment_modifier).toBe(false);
    });

    test("Should default is_enchantment to false for a normal player purchase", () => {
      const result = resolveSpells({
        selectedSpells: { "Moldar Mana": { base_value: 10, modifier: 0 } },
        rows: mockRows,
        character: { iq: 10 },
      });

      expect(result["ARC-001-A"].is_enchantment).toBe(false);
    });
  });
});
