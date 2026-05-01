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
});
