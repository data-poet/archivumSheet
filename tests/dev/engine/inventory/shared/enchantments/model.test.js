jest.mock("dev/public/js/api.js", () => ({
  fetchEnchantments: jest.fn(),
  fetchEnchantmentEffectTypes: jest.fn(),
  fetchItemCategories: jest.fn(),
}));

import {
  fetchEnchantments,
  fetchEnchantmentEffectTypes,
  fetchItemCategories,
} from "dev/public/js/api.js";
import { state } from "dev/public/js/state.js";
import {
  loadEnchantments,
  getAccessoryItemCategory,
  getMagicGearItemCategory,
  isAttributeType,
  isValueType,
  isElementalResistanceType,
  isPercentageType,
  isAdvantageType,
  isDisadvantageType,
  isPointType,
  isSkillType,
  isSpellType,
  isFortifyType,
  isWeakenType,
  getEnchantmentRecord,
  getAllowedEnchantments,
  getEnchantmentTypeValues,
  getUniqueSpellNames,
  getUniqueSpellRows,
  setEnchantmentAddFormSelection,
  getEnchantmentFormSelection,
  getEnchantmentAddFormSelection,
  getEnchantmentEditFormSelection,
  clearEnchantmentAddFormSelection,
  setEnchantmentAddFormTargetFilter,
  getEnchantmentAddFormTargetFilter,
  setEnchantmentAddFormTypeFilter,
  getEnchantmentAddFormTypeFilter,
  addEnchantmentEntry,
  updateEnchantmentEntry,
  removeEnchantmentEntry,
} from "dev/public/js/engine/inventory/shared/enchantments/model.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────
// loadEnchantments
// ─────────────────────────────────────────────────────────────────────────
describe("loadEnchantments", () => {
  test("loads all three catalogs in parallel and stores them on state.data", async () => {
    const enchantments = [{ enchantment_id: "ENCH-001" }];
    const effectTypes = { ATTRIBUTE_EFFECT_TYPES: ["attribute"] };
    const itemCategories = {
      ACCESSORY: "Acessórios",
      MAGIC_GEAR: "Instrumentos Mágicos",
    };
    fetchEnchantments.mockResolvedValue(enchantments);
    fetchEnchantmentEffectTypes.mockResolvedValue(effectTypes);
    fetchItemCategories.mockResolvedValue(itemCategories);

    await loadEnchantments();

    expect(state.data.enchantments).toBe(enchantments);
    expect(state.data.enchantmentEffectTypes).toBe(effectTypes);
    expect(state.data.itemCategories).toBe(itemCategories);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getAccessoryItemCategory / getMagicGearItemCategory
// ─────────────────────────────────────────────────────────────────────────
describe("getAccessoryItemCategory / getMagicGearItemCategory", () => {
  test("read straight from state.data.itemCategories, fetched from the engine", async () => {
    fetchEnchantments.mockResolvedValue([]);
    fetchEnchantmentEffectTypes.mockResolvedValue({});
    fetchItemCategories.mockResolvedValue({
      ACCESSORY: "Acessórios",
      MAGIC_GEAR: "Instrumentos Mágicos",
    });

    await loadEnchantments();

    expect(getAccessoryItemCategory()).toBe("Acessórios");
    expect(getMagicGearItemCategory()).toBe("Instrumentos Mágicos");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Effect type group predicates
// ─────────────────────────────────────────────────────────────────────────
describe("effect type predicates", () => {
  beforeEach(() => {
    state.data.enchantmentEffectTypes = {
      ATTRIBUTE_EFFECT_TYPES: ["attribute"],
      POINT_EFFECT_TYPES: ["point"],
      SKILL_EFFECT_TYPES: ["skill"],
      SPELL_EFFECT_TYPES: ["spell"],
      WEIGHT_EFFECT_TYPES: ["add_weight", "remove_weight"],
      DAMAGE_RESISTANCE_EFFECT_TYPES: [
        "fortify_damage_resistance",
        "weaken_damage_resistance",
      ],
      ELEMENTAL_RESISTANCE_EFFECT_TYPES: [
        "fortify_resistance",
        "weaken_resistance",
      ],
      VALUE_EFFECT_TYPES: [
        "attribute",
        "add_weight",
        "remove_weight",
        "fortify_damage_resistance",
        "weaken_damage_resistance",
        "fortify_resistance",
        "weaken_resistance",
      ],
      FORTIFY_EFFECT_TYPES: ["fortify_skill", "fortify_attribute"],
      WEAKEN_EFFECT_TYPES: ["weaken_skill", "weaken_attribute"],
    };
  });

  test("isAttributeType checks membership in ATTRIBUTE_EFFECT_TYPES", () => {
    expect(isAttributeType("attribute")).toBe(true);
    expect(isAttributeType("point")).toBe(false);
  });

  test("isValueType checks membership in VALUE_EFFECT_TYPES (attribute + weight + damage-resistance + elemental-resistance)", () => {
    expect(isValueType("attribute")).toBe(true);
    expect(isValueType("add_weight")).toBe(true);
    expect(isValueType("fortify_damage_resistance")).toBe(true);
    expect(isValueType("fortify_resistance")).toBe(true);
    expect(isValueType("point")).toBe(false);
    expect(isValueType("skill")).toBe(false);
  });

  test("isElementalResistanceType checks membership in ELEMENTAL_RESISTANCE_EFFECT_TYPES", () => {
    expect(isElementalResistanceType("fortify_resistance")).toBe(true);
    expect(isElementalResistanceType("weaken_resistance")).toBe(true);
    expect(isElementalResistanceType("fortify_damage_resistance")).toBe(false);
  });

  test("isAdvantageType / isDisadvantageType are literal string checks, not list-based", () => {
    expect(isAdvantageType("advantage")).toBe(true);
    expect(isAdvantageType("disadvantage")).toBe(false);
    expect(isDisadvantageType("disadvantage")).toBe(true);
  });

  test("isPointType checks membership in POINT_EFFECT_TYPES", () => {
    expect(isPointType("point")).toBe(true);
    expect(isPointType("skill")).toBe(false);
  });

  test("isSkillType / isSpellType check their respective lists", () => {
    expect(isSkillType("skill")).toBe(true);
    expect(isSpellType("spell")).toBe(true);
    expect(isSkillType("spell")).toBe(false);
  });

  test("isFortifyType / isWeakenType check their respective lists", () => {
    expect(isFortifyType("fortify_skill")).toBe(true);
    expect(isWeakenType("weaken_attribute")).toBe(true);
    expect(isFortifyType("weaken_attribute")).toBe(false);
  });
});

describe("isPercentageType", () => {
  test("reads the raw CSV's typo'd column name (enenchantment_is_percentage)", () => {
    expect(isPercentageType({ enenchantment_is_percentage: "TRUE" })).toBe(
      true,
    );
    expect(isPercentageType({ enenchantment_is_percentage: "FALSE" })).toBe(
      false,
    );
  });

  test("defaults to false when the column is missing or the record is null", () => {
    expect(isPercentageType({})).toBe(false);
    expect(isPercentageType(null)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Catalog lookups
// ─────────────────────────────────────────────────────────────────────────
describe("getEnchantmentRecord", () => {
  test("finds the record by enchantment_id", () => {
    state.data.enchantments = [
      { enchantment_id: "ENCH-001", enchantment_type: "X" },
    ];
    expect(getEnchantmentRecord("ENCH-001")).toEqual({
      enchantment_id: "ENCH-001",
      enchantment_type: "X",
    });
  });

  test("returns null when not found", () => {
    state.data.enchantments = [];
    expect(getEnchantmentRecord("GHOST")).toBeNull();
  });
});

describe("getAllowedEnchantments", () => {
  beforeEach(() => {
    state.data.enchantments = [
      {
        enchantment_id: "ENCH-001",
        enchantment_allowed_itens: "Acessórios, Cabeça",
        enchantment_type: "Peculiaridade",
      },
      {
        enchantment_id: "ENCH-002",
        enchantment_allowed_itens: "Cabeça",
        enchantment_type: "Perícia",
      },
      {
        enchantment_id: "ENCH-003",
        enchantment_allowed_itens: "Pés",
        enchantment_type: "Peculiaridade",
      },
    ];
  });

  test("filters by item category, trimming the comma-separated list", () => {
    const allowed = getAllowedEnchantments("Acessórios");
    expect(allowed.map((e) => e.enchantment_id)).toEqual(["ENCH-001"]);
  });

  test("an item appearing in multiple categories matches each of them", () => {
    const allowed = getAllowedEnchantments("Cabeça");
    expect(allowed.map((e) => e.enchantment_id)).toEqual([
      "ENCH-001",
      "ENCH-002",
    ]);
  });

  test("narrows further by an optional type filter", () => {
    const allowed = getAllowedEnchantments("Cabeça", "Perícia");
    expect(allowed.map((e) => e.enchantment_id)).toEqual(["ENCH-002"]);
  });

  test("returns an empty array for a category nothing is allowed on", () => {
    expect(getAllowedEnchantments("Tronco")).toEqual([]);
  });

  test("tolerates a missing enchantment_allowed_itens field", () => {
    state.data.enchantments = [{ enchantment_id: "ENCH-004" }];
    expect(getAllowedEnchantments("Cabeça")).toEqual([]);
  });
});

describe("getEnchantmentTypeValues", () => {
  test("returns unique, sorted enchantment_type values for the category", () => {
    state.data.enchantments = [
      { enchantment_allowed_itens: "Cabeça", enchantment_type: "Perícia" },
      { enchantment_allowed_itens: "Cabeça", enchantment_type: "Feitiço" },
      { enchantment_allowed_itens: "Cabeça", enchantment_type: "Perícia" },
    ];
    expect(getEnchantmentTypeValues("Cabeça")).toEqual(["Feitiço", "Perícia"]);
  });

  test("filters out falsy/blank enchantment_type values", () => {
    state.data.enchantments = [
      { enchantment_allowed_itens: "Cabeça", enchantment_type: "" },
      { enchantment_allowed_itens: "Cabeça", enchantment_type: "Perícia" },
    ];
    expect(getEnchantmentTypeValues("Cabeça")).toEqual(["Perícia"]);
  });
});

describe("getUniqueSpellNames / getUniqueSpellRows", () => {
  beforeEach(() => {
    state.data.spells = [
      { spell_name: "Bola de Fogo", tier: 1, school: "Fogo" },
      { spell_name: "Bola de Fogo", tier: 2, school: "Fogo" },
      { spell_name: "Cura Leve", tier: 1, school: "Cura" },
    ];
  });

  test("getUniqueSpellNames dedupes by spell_name, preserving first-seen order", () => {
    expect(getUniqueSpellNames()).toEqual(["Bola de Fogo", "Cura Leve"]);
  });

  test("getUniqueSpellRows keeps the first full row seen for each name", () => {
    expect(getUniqueSpellRows()).toEqual([
      { spell_name: "Bola de Fogo", tier: 1, school: "Fogo" },
      { spell_name: "Cura Leve", tier: 1, school: "Cura" },
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Add-form selection state
// ─────────────────────────────────────────────────────────────────────────
describe("add-form selection state", () => {
  test("setEnchantmentAddFormSelection / getEnchantmentFormSelection round trip", () => {
    setEnchantmentAddFormSelection("INST-1", "ENCH-001");
    expect(getEnchantmentFormSelection("INST-1", "FALLBACK")).toBe("ENCH-001");
  });

  test("getEnchantmentFormSelection falls back when nothing was ever selected", () => {
    expect(getEnchantmentFormSelection("INST-never-set", "FALLBACK")).toBe(
      "FALLBACK",
    );
  });

  test("choosing a new enchantment_id clears that instance's target filter", () => {
    setEnchantmentAddFormTargetFilter("INST-1", "some-target-type");
    setEnchantmentAddFormSelection("INST-1", "ENCH-001");
    expect(getEnchantmentAddFormTargetFilter("INST-1")).toBe("");
  });

  test("clearEnchantmentAddFormSelection wipes selection, target filter, and type filter together", () => {
    setEnchantmentAddFormSelection("INST-1", "ENCH-001");
    setEnchantmentAddFormTargetFilter("INST-1", "target-x");
    setEnchantmentAddFormTypeFilter("INST-1", "Perícia");

    clearEnchantmentAddFormSelection("INST-1");

    expect(getEnchantmentFormSelection("INST-1", "FALLBACK")).toBe("FALLBACK");
    expect(getEnchantmentAddFormTargetFilter("INST-1")).toBe("");
    expect(getEnchantmentAddFormTypeFilter("INST-1")).toBe("");
  });

  test("setEnchantmentAddFormTargetFilter with a falsy value clears rather than stores it", () => {
    setEnchantmentAddFormTargetFilter("INST-1", "target-x");
    setEnchantmentAddFormTargetFilter("INST-1", "");
    expect(getEnchantmentAddFormTargetFilter("INST-1")).toBe("");
  });

  test("setEnchantmentAddFormTypeFilter clears selection/targetFilter before applying the new type filter", () => {
    setEnchantmentAddFormSelection("INST-1", "ENCH-001");
    setEnchantmentAddFormTargetFilter("INST-1", "target-x");

    setEnchantmentAddFormTypeFilter("INST-1", "Perícia");

    expect(getEnchantmentFormSelection("INST-1", "FALLBACK")).toBe("FALLBACK");
    expect(getEnchantmentAddFormTargetFilter("INST-1")).toBe("");
    expect(getEnchantmentAddFormTypeFilter("INST-1")).toBe("Perícia");
  });

  test("setEnchantmentAddFormTypeFilter with a falsy value just clears, without setting a new filter", () => {
    setEnchantmentAddFormTypeFilter("INST-1", "Perícia");
    setEnchantmentAddFormTypeFilter("INST-1", "");
    expect(getEnchantmentAddFormTypeFilter("INST-1")).toBe("");
  });

  describe("resolution (getEnchantmentAddFormSelection / getEnchantmentEditFormSelection)", () => {
    beforeEach(() => {
      state.data.enchantments = [
        {
          enchantment_id: "ENCH-001",
          enchantment_allowed_itens: "Cabeça",
          enchantment_type: "Perícia",
        },
        {
          enchantment_id: "ENCH-002",
          enchantment_allowed_itens: "Cabeça",
          enchantment_type: "Feitiço",
        },
      ];
    });

    test("add-form defaults to the first allowed enchantment when nothing is explicitly chosen", () => {
      expect(getEnchantmentAddFormSelection("INST-1", "Cabeça")).toBe(
        "ENCH-001",
      );
    });

    test("an explicit selection takes precedence over the default", () => {
      setEnchantmentAddFormSelection("INST-1", "ENCH-002");
      expect(getEnchantmentAddFormSelection("INST-1", "Cabeça")).toBe(
        "ENCH-002",
      );
    });

    test("respects an active type (category) filter when picking the default", () => {
      setEnchantmentAddFormTypeFilter("INST-1", "Feitiço");
      expect(getEnchantmentAddFormSelection("INST-1", "Cabeça")).toBe(
        "ENCH-002",
      );
    });

    test("edit-form prefers the entry's current enchantment_id when it's still in the allowed list", () => {
      expect(
        getEnchantmentEditFormSelection("ENTRY-1", "Cabeça", "ENCH-002"),
      ).toBe("ENCH-002");
    });

    test("edit-form falls back to the first allowed entry when the current id is filtered out", () => {
      setEnchantmentAddFormTypeFilter("ENTRY-1", "Perícia");
      // ENCH-002 is a "Feitiço", excluded once the "Perícia" filter is active
      expect(
        getEnchantmentEditFormSelection("ENTRY-1", "Cabeça", "ENCH-002"),
      ).toBe("ENCH-001");
    });

    test("an explicit selection still overrides the edit-form's preferred current id", () => {
      setEnchantmentAddFormSelection("ENTRY-1", "ENCH-001");
      expect(
        getEnchantmentEditFormSelection("ENTRY-1", "Cabeça", "ENCH-002"),
      ).toBe("ENCH-001");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Entry mutation
// ─────────────────────────────────────────────────────────────────────────
describe("entry mutation", () => {
  beforeEach(() => {
    state.data.enchantmentEffectTypes = {
      ATTRIBUTE_EFFECT_TYPES: ["attribute", "weaken_attribute"],
      POINT_EFFECT_TYPES: ["point"],
      SKILL_EFFECT_TYPES: ["skill", "fortify_skill", "weaken_skill"],
      SPELL_EFFECT_TYPES: ["spell"],
      WEIGHT_EFFECT_TYPES: ["add_weight", "remove_weight"],
      DAMAGE_RESISTANCE_EFFECT_TYPES: ["fortify_damage_resistance"],
      ELEMENTAL_RESISTANCE_EFFECT_TYPES: ["fortify_resistance"],
      VALUE_EFFECT_TYPES: [
        "attribute",
        "weaken_attribute",
        "add_weight",
        "remove_weight",
        "fortify_damage_resistance",
        "fortify_resistance",
      ],
      FORTIFY_EFFECT_TYPES: ["fortify_skill", "add_weight"],
      WEAKEN_EFFECT_TYPES: [
        "weaken_attribute",
        "weaken_skill",
        "remove_weight",
      ],
    };
    state.data.enchantments = [
      {
        enchantment_id: "ATTR-1",
        enchantment_effect_type: "attribute",
        enchantment_base_value: 2,
      },
      {
        enchantment_id: "WEAKEN-ATTR-1",
        enchantment_effect_type: "weaken_attribute",
        enchantment_base_value: 2,
      },
      { enchantment_id: "POINT-1", enchantment_effect_type: "point" },
      { enchantment_id: "SKILL-1", enchantment_effect_type: "skill" },
      {
        enchantment_id: "FORTIFY-SKILL-1",
        enchantment_effect_type: "fortify_skill",
      },
      {
        enchantment_id: "WEAKEN-SKILL-1",
        enchantment_effect_type: "weaken_skill",
      },
      {
        enchantment_id: "ADD-WEIGHT-1",
        enchantment_effect_type: "add_weight",
        enchantment_base_value: 0.1,
        enenchantment_is_percentage: "TRUE",
      },
      {
        enchantment_id: "REMOVE-WEIGHT-1",
        enchantment_effect_type: "remove_weight",
        enchantment_base_value: 0.1,
        enenchantment_is_percentage: "TRUE",
      },
      {
        enchantment_id: "FORTIFY-DR-1",
        enchantment_effect_type: "fortify_damage_resistance",
        enchantment_base_value: 1,
        enenchantment_is_percentage: "FALSE",
      },
      {
        enchantment_id: "FORTIFY-RESIST-1",
        enchantment_effect_type: "fortify_resistance",
        enchantment_base_value: 0.05,
        enenchantment_is_percentage: "TRUE",
      },
    ];
  });

  describe("addEnchantmentEntry", () => {
    test("returns null and leaves entries untouched for an unknown enchantment_id", () => {
      const entries = [];
      expect(addEnchantmentEntry(entries, "GHOST")).toBeNull();
      expect(entries).toEqual([]);
    });

    test("attribute type: value defaults to the record's base_value", () => {
      const entries = [];
      const entry = addEnchantmentEntry(entries, "ATTR-1");
      expect(entry.value).toBe(2);
      expect(entries).toContain(entry);
    });

    test("attribute type: an explicit params.value overrides the default", () => {
      const entry = addEnchantmentEntry([], "ATTR-1", { value: 5 });
      expect(entry.value).toBe(5);
    });

    test("weaken-attribute type: value defaults to the NEGATIVE of base_value", () => {
      const entry = addEnchantmentEntry([], "WEAKEN-ATTR-1");
      expect(entry.value).toBe(-2);
    });

    test("add_weight (percentage) type: value defaults to the DECIMAL fraction of base_value, from a percent-integer default", () => {
      // base_value 0.1 -> displayed/defaulted as 10 (percent), converted
      // back to 0.1 (decimal) for the stored entry — see _buildEntryFields.
      const entry = addEnchantmentEntry([], "ADD-WEIGHT-1");
      expect(entry.value).toBe(0.1);
    });

    test("add_weight (percentage) type: an explicit params.value arrives as a percent-integer and is converted to decimal", () => {
      // params.value = 20 means "20%" as typed/stepped in the UI
      const entry = addEnchantmentEntry([], "ADD-WEIGHT-1", { value: 20 });
      expect(entry.value).toBe(0.2);
    });

    test("remove_weight (percentage) type: value defaults to the negative decimal fraction", () => {
      const entry = addEnchantmentEntry([], "REMOVE-WEIGHT-1");
      expect(entry.value).toBe(-0.1);
    });

    test("fortify_damage_resistance (flat, not percentage) type: value stays a whole number, unaffected by percent conversion", () => {
      const entry = addEnchantmentEntry([], "FORTIFY-DR-1");
      expect(entry.value).toBe(1);
    });

    test("fortify_resistance (percentage) type: value defaults to the decimal fraction, with no target set on the entry itself", () => {
      // target is fixed on the DB row (enchantment_target), never chosen
      // via the form for this type — see collectEquippedEnchantments.js.
      const entry = addEnchantmentEntry([], "FORTIFY-RESIST-1");
      expect(entry.value).toBe(0.05);
      expect(entry.target).toBeUndefined();
    });

    test("fortify_resistance (percentage) type: an explicit percent-integer params.value converts correctly", () => {
      const entry = addEnchantmentEntry([], "FORTIFY-RESIST-1", {
        value: 15,
      });
      expect(entry.value).toBe(0.15);
    });

    test("point type: only sets target, defaulting to null", () => {
      const entry = addEnchantmentEntry([], "POINT-1");
      expect(entry.target).toBeNull();
      expect(entry.value).toBeUndefined();
      expect(entry.extraPoints).toBeUndefined();
    });

    test("point type: an explicit target is kept", () => {
      const entry = addEnchantmentEntry([], "POINT-1", { target: "ST" });
      expect(entry.target).toBe("ST");
    });

    test("skill type: extraPoints defaults to 0 (neither fortify nor weaken)", () => {
      const entry = addEnchantmentEntry([], "SKILL-1", { target: "SK-001" });
      expect(entry.target).toBe("SK-001");
      expect(entry.extraPoints).toBe(0);
    });

    test("fortify-skill type: extraPoints defaults to +1", () => {
      const entry = addEnchantmentEntry([], "FORTIFY-SKILL-1");
      expect(entry.extraPoints).toBe(1);
    });

    test("weaken-skill type: extraPoints defaults to -1", () => {
      const entry = addEnchantmentEntry([], "WEAKEN-SKILL-1");
      expect(entry.extraPoints).toBe(-1);
    });

    test("assigns a fresh _instanceId and keeps the enchantment_id", () => {
      const entry = addEnchantmentEntry([], "SKILL-1");
      expect(entry._instanceId).toEqual(
        expect.stringContaining("enchantment-inst-"),
      );
      expect(entry.enchantment_id).toBe("SKILL-1");
    });
  });

  describe("updateEnchantmentEntry", () => {
    function existingEntries() {
      return [
        {
          _instanceId: "enchantment-inst-1",
          enchantment_id: "ATTR-1",
          value: 2,
        },
        {
          _instanceId: "enchantment-inst-2",
          enchantment_id: "POINT-1",
          target: "DX",
        },
      ];
    }

    test("returns null for an unknown enchantment_id, leaving entries untouched", () => {
      const entries = existingEntries();
      const before = JSON.parse(JSON.stringify(entries));
      expect(
        updateEnchantmentEntry(entries, "enchantment-inst-1", "GHOST"),
      ).toBeNull();
      expect(entries).toEqual(before);
    });

    test("returns null for an unknown entryInstanceId", () => {
      const entries = existingEntries();
      expect(
        updateEnchantmentEntry(entries, "ghost-inst", "SKILL-1"),
      ).toBeNull();
    });

    test("replaces the entry in place, keeping its _instanceId but swapping fields", () => {
      const entries = existingEntries();
      const updated = updateEnchantmentEntry(
        entries,
        "enchantment-inst-1",
        "SKILL-1",
        { target: "SK-002" },
      );

      expect(updated._instanceId).toBe("enchantment-inst-1");
      expect(updated.enchantment_id).toBe("SKILL-1");
      expect(updated.target).toBe("SK-002");
      expect(entries[0]).toBe(updated); // same index, same array position
      expect(entries[1].enchantment_id).toBe("POINT-1"); // untouched
    });
  });

  describe("removeEnchantmentEntry", () => {
    test("removes the matching entry", () => {
      const entries = [
        { _instanceId: "enchantment-inst-1" },
        { _instanceId: "enchantment-inst-2" },
      ];
      removeEnchantmentEntry(entries, "enchantment-inst-1");
      expect(entries.map((e) => e._instanceId)).toEqual(["enchantment-inst-2"]);
    });

    test("is a no-op for an unknown entryInstanceId", () => {
      const entries = [{ _instanceId: "enchantment-inst-1" }];
      removeEnchantmentEntry(entries, "ghost");
      expect(entries).toHaveLength(1);
    });
  });
});
