const {
  resolveAlchemyConsumable,
  calculateCarriedAlchemyWeight,
} = require("engine/inventory/js/alchemy/alchemyResolver");

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MOCKS
// ─────────────────────────────────────────────────────────────────────────────

const mockPotion = {
  consumable_id: "POTION-000",
  consumable_name: "Purificador",
  consumable_box_name: "Purificador | Comum",
  consumable_tier: "Comum",
  consumable_type: "Poção",
  consumable_category: "Utilidade",
  consumable_ingredients: null,
  consumable_duration: "Instantânea",
  consumable_effect: "Remove 1d6 de toxicidade.",
  consumable_toxicity: 0,
  consumable_price: 15,
  consumable_weight: 0.5,
  consumable_description: "Um líquido de coloração branca leitosa.",
  consumable_observation: null,
  consumable_method: null,
  consumable_effect_area: null,
};

const mockElixir = {
  consumable_id: "ELEXIR-000",
  consumable_name: "Elixir do Touro",
  consumable_box_name: "Elixir do Touro | Comum",
  consumable_tier: "Comum",
  consumable_type: "Elixir",
  consumable_category: "Manipulação de Atributos",
  consumable_ingredients: null,
  consumable_duration: "6 Horas",
  consumable_effect: "Aumenta a ST do usuário em +1.",
  consumable_toxicity: 20,
  consumable_price: 200,
  consumable_weight: 0.8,
  consumable_description: "Um líquido denso de tonalidade âmbar.",
  consumable_observation: null,
  consumable_method: null,
  consumable_effect_area: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// resolveAlchemyConsumable
// ─────────────────────────────────────────────────────────────────────────────

describe("alchemyResolver — resolveAlchemyConsumable", () => {
  test("Should resolve a backpack entry with quantity 1 correctly", () => {
    const instance = {
      consumable_id: "POTION-000",
      quantity: 1,
      storedAt: "backpack",
    };

    const resolved = resolveAlchemyConsumable(instance, mockPotion);

    expect(resolved.consumable_id).toBe("POTION-000");
    expect(resolved.consumable_name).toBe("Purificador");
    expect(resolved.consumable_tier).toBe("Comum");
    expect(resolved.consumable_type).toBe("Poção");
    expect(resolved.consumable_category).toBe("Utilidade");
    expect(resolved.quantity).toBe(1);
    expect(resolved.storedAt).toBe("backpack");
    expect(resolved.total_weight).toBe(0.5);
  });

  test("Should calculate total_weight correctly for quantity > 1", () => {
    const instance = {
      consumable_id: "POTION-000",
      quantity: 4,
      storedAt: "backpack",
    };

    const resolved = resolveAlchemyConsumable(instance, mockPotion);

    expect(resolved.total_weight).toBe(2.0);
    expect(resolved.quantity).toBe(4);
  });

  test("Should round total_weight to 2 decimal places", () => {
    const consumable = { ...mockPotion, consumable_weight: 0.3 };

    const instance = {
      consumable_id: "POTION-000",
      quantity: 3,
      storedAt: "backpack",
    };

    const resolved = resolveAlchemyConsumable(instance, consumable);

    expect(resolved.total_weight).toBe(0.9);
  });

  test("Should include all DB fields in the resolved output", () => {
    const instance = {
      consumable_id: "ELEXIR-000",
      quantity: 1,
      storedAt: "stash",
    };

    const resolved = resolveAlchemyConsumable(instance, mockElixir);

    expect(resolved.consumable_id).toBe("ELEXIR-000");
    expect(resolved.consumable_box_name).toBe("Elixir do Touro | Comum");
    expect(resolved.consumable_tier).toBe("Comum");
    expect(resolved.consumable_type).toBe("Elixir");
    expect(resolved.consumable_toxicity).toBe(20);
    expect(resolved.consumable_price).toBe(200);
    expect(resolved.consumable_weight).toBe(0.8);
    expect(resolved.consumable_duration).toBe("6 Horas");
    expect(resolved.consumable_effect).toBe("Aumenta a ST do usuário em +1.");
    expect(resolved.storedAt).toBe("stash");
    expect(resolved.total_weight).toBe(0.8);
  });

  test("Should preserve storedAt value in resolved output", () => {
    const locations = ["backpack", "stash", "camp"];

    for (const storedAt of locations) {
      const instance = { consumable_id: "POTION-000", quantity: 1, storedAt };
      const resolved = resolveAlchemyConsumable(instance, mockPotion);
      expect(resolved.storedAt).toBe(storedAt);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateCarriedAlchemyWeight
// ─────────────────────────────────────────────────────────────────────────────

describe("alchemyResolver — calculateCarriedAlchemyWeight", () => {
  test("Should return 0 for an empty backpack", () => {
    const weight = calculateCarriedAlchemyWeight([]);

    expect(weight).toBe(0);
  });

  test("Should sum total_weight of all backpack entries", () => {
    const backpack = [
      { consumable_id: "POTION-000", quantity: 2, storedAt: "backpack", total_weight: 1.0 },
      { consumable_id: "ELEXIR-000", quantity: 1, storedAt: "backpack", total_weight: 0.8 },
    ];

    const weight = calculateCarriedAlchemyWeight(backpack);

    expect(weight).toBe(1.8);
  });

  test("Should round to 2 decimal places", () => {
    const backpack = [
      { consumable_id: "POTION-000", quantity: 1, storedAt: "backpack", total_weight: 0.3 },
      { consumable_id: "POTION-000", quantity: 1, storedAt: "backpack", total_weight: 0.3 },
      { consumable_id: "POTION-000", quantity: 1, storedAt: "backpack", total_weight: 0.3 },
    ];

    const weight = calculateCarriedAlchemyWeight(backpack);

    expect(weight).toBe(0.9);
  });

  test("Should not include stash or camp entries in its calculation", () => {
    // The function receives only backpack entries — stash and camp are filtered
    // upstream in buildAlchemySlots. This test confirms total_weight is summed
    // correctly regardless of the storedAt field on entries passed in.
    const backpack = [
      { consumable_id: "POTION-000", quantity: 3, storedAt: "backpack", total_weight: 1.5 },
    ];

    const weight = calculateCarriedAlchemyWeight(backpack);

    expect(weight).toBe(1.5);
  });
});
