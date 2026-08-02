const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("engine/inventory/js/shared/enchantmentsValidation");

describe("enchantmentsValidation", () => {
  describe("validateEnchantmentEntryShape", () => {
    test("Should return empty array for a valid attribute-type entry", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-000", value: 2 },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for a valid target-type entry", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-026", target: "ADV-000" },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should allow a negative integer value (weaken types)", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-001", value: -2 },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should allow a negative integer extraPoints (weaken skill/spell)", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-030", extraPoints: -1 },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when entry is not an object", () => {
      const errors = validateEnchantmentEntryShape(
        null,
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([
        "accessoryInventory[0].enchantments[0]: must be an object",
      ]);
    });

    test("Should fail when enchantment_id is missing", () => {
      const errors = validateEnchantmentEntryShape(
        {},
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: enchantment_id is required",
      );
    });

    test("Should fail when value is present but not an integer", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-000", value: 1.5 },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: value must be an integer when present",
      );
    });

    test("Should fail when value is present but not a number at all", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-000", value: "2" },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: value must be an integer when present",
      );
    });

    test("Should fail when target is present but not a string", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-026", target: 123 },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: target must be a string when present",
      );
    });

    test("Should allow target to be explicitly null", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-000", value: 1, target: null },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when extraPoints is not an integer", () => {
      const errors = validateEnchantmentEntryShape(
        { enchantment_id: "ENCHANTMENT-030", extraPoints: 1.5 },
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: extraPoints must be an integer when present",
      );
    });
  });

  describe("validateEnchantmentEntryApplication", () => {
    const enchantmentsDb = {
      "ENCHANTMENT-000": {
        enchantment_id: "ENCHANTMENT-000",
        enchantment_name: "Fortificar ST",
        enchantment_effect_type: "fortify_attribute",
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-001": {
        enchantment_id: "ENCHANTMENT-001",
        enchantment_name: "Enfraquecer ST",
        enchantment_effect_type: "weaken_attribute",
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-026": {
        enchantment_id: "ENCHANTMENT-026",
        enchantment_name: "Adicionar Vantagem",
        enchantment_effect_type: "advantage",
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-028": {
        enchantment_id: "ENCHANTMENT-028",
        enchantment_name: "Adicionar Perícia",
        enchantment_effect_type: "skill",
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-029": {
        enchantment_id: "ENCHANTMENT-029",
        enchantment_name: "Fortificar Perícia",
        enchantment_effect_type: "fortify_skill",
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-030": {
        enchantment_id: "ENCHANTMENT-030",
        enchantment_name: "Enfraquecer Perícia",
        enchantment_effect_type: "weaken_skill",
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-HEAD-ONLY": {
        enchantment_id: "ENCHANTMENT-HEAD-ONLY",
        enchantment_name: "Só Cabeça",
        enchantment_effect_type: "fortify_attribute",
        enchantment_base_value: 1,
        enchantment_step: 1,
        enchantment_allowed_itens: ["Cabeça"],
      },
      "ENCHANTMENT-HIGH-BASE": {
        enchantment_id: "ENCHANTMENT-HIGH-BASE",
        enchantment_name: "Fortificar ST Alto",
        enchantment_effect_type: "fortify_attribute",
        enchantment_base_value: 3,
        enchantment_step: 1,
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-STEP-2-FORTIFY": {
        enchantment_id: "ENCHANTMENT-STEP-2-FORTIFY",
        enchantment_name: "Fortificar ST (passo 2)",
        enchantment_effect_type: "fortify_attribute",
        enchantment_base_value: 2,
        enchantment_step: 2,
        enchantment_allowed_itens: ["Acessórios"],
      },
      "ENCHANTMENT-STEP-2-WEAKEN": {
        enchantment_id: "ENCHANTMENT-STEP-2-WEAKEN",
        enchantment_name: "Enfraquecer ST (passo 2)",
        enchantment_effect_type: "weaken_attribute",
        enchantment_base_value: 2,
        enchantment_step: 2,
        enchantment_allowed_itens: ["Acessórios"],
      },
    };

    const targetsDb = {
      advantages: { "ADV-000": { name: "Atraente", cost: 5 } },
      disadvantages: {},
      skills: { "SKILL-014": { name: "Esquiva e Aparo", difficulty: "D" } },
      spells: {},
    };

    test("Should return empty array for a valid fortify attribute application", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-000", value: 3 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should return empty array for a valid weaken attribute application", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-001", value: -3 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when a fortify_attribute value is negative", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-000", value: -1 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: value must be a positive integer for fortify_attribute",
      );
    });

    test("Should fail when a fortify_attribute value is 0", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-000", value: 0 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: value must be a positive integer for fortify_attribute",
      );
    });

    test("Should fail when a weaken_attribute value is positive", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-001", value: 1 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: value must be a negative integer for weaken_attribute",
      );
    });

    test("Should fail when the enchantment isn't allowed on this item category", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-HEAD-ONLY", value: 1 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        'accessoryInventory[0].enchantments[0]: enchantment "Só Cabeça" is not allowed on Acessórios',
      );
    });

    test("Should fail when value is missing for an attribute type", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-000" },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: value is required for fortify_attribute",
      );
    });

    test("Should fail when |value| is below base_value", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-HIGH-BASE", value: 1 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: |value| must be >= base value (3)",
      );
    });

    test("Should fail when |value| doesn't align to step increments", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-STEP-2-FORTIFY", value: 3 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: |value| must align to steps of 2 from base 2",
      );
    });

    test("Should accept a matching negative magnitude for a weaken step alignment", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-STEP-2-WEAKEN", value: -4 },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when target is missing for an advantage type", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-026" },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: target is required for advantage",
      );
    });

    test("Should fail when target advantage id doesn't exist", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-026", target: "ADV-DOES-NOT-EXIST" },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        'accessoryInventory[0].enchantments[0]: unknown advantage target "ADV-DOES-NOT-EXIST"',
      );
    });

    test("Should return empty array for a valid advantage application", () => {
      const errors = validateEnchantmentEntryApplication(
        { enchantment_id: "ENCHANTMENT-026", target: "ADV-000" },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when target skill id doesn't exist", () => {
      const errors = validateEnchantmentEntryApplication(
        {
          enchantment_id: "ENCHANTMENT-029",
          target: "SKILL-DOES-NOT-EXIST",
          extraPoints: 1,
        },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        'accessoryInventory[0].enchantments[0]: unknown skill target "SKILL-DOES-NOT-EXIST"',
      );
    });

    test("Should return empty array for a valid skill grant application (unsigned extraPoints)", () => {
      const errors = validateEnchantmentEntryApplication(
        {
          enchantment_id: "ENCHANTMENT-028",
          target: "SKILL-014",
          extraPoints: 0,
        },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when a skill grant's extraPoints is negative (unsigned type)", () => {
      const errors = validateEnchantmentEntryApplication(
        {
          enchantment_id: "ENCHANTMENT-028",
          target: "SKILL-014",
          extraPoints: -1,
        },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: extraPoints must be >= 0 for skill",
      );
    });

    test("Should return empty array for a valid fortify_skill application (positive extraPoints)", () => {
      const errors = validateEnchantmentEntryApplication(
        {
          enchantment_id: "ENCHANTMENT-029",
          target: "SKILL-014",
          extraPoints: 1,
        },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when fortify_skill extraPoints is 0 or negative", () => {
      const errors = validateEnchantmentEntryApplication(
        {
          enchantment_id: "ENCHANTMENT-029",
          target: "SKILL-014",
          extraPoints: 0,
        },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: extraPoints must be a positive integer for fortify_skill",
      );
    });

    test("Should return empty array for a valid weaken_skill application (negative extraPoints)", () => {
      const errors = validateEnchantmentEntryApplication(
        {
          enchantment_id: "ENCHANTMENT-030",
          target: "SKILL-014",
          extraPoints: -2,
        },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toEqual([]);
    });

    test("Should fail when weaken_skill extraPoints is positive", () => {
      const errors = validateEnchantmentEntryApplication(
        {
          enchantment_id: "ENCHANTMENT-030",
          target: "SKILL-014",
          extraPoints: 2,
        },
        enchantmentsDb,
        targetsDb,
        "Acessórios",
        0,
        "accessoryInventory[0]",
      );

      expect(errors).toContain(
        "accessoryInventory[0].enchantments[0]: extraPoints must be a negative integer for weaken_skill",
      );
    });
  });
});
