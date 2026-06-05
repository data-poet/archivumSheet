const {
  buildAlchemySlots,
  VALID_STORED_AT,
  _getAlchemyDB,
} = require("engine/inventory/js/alchemy/alchemy");

describe("ALCHEMY CONSUMABLES", () => {
  const db = _getAlchemyDB();

  const consumableId = Object.keys(db)[0];

  describe("Constants", () => {
    test("Should export VALID_STORED_AT with stash, camp and backpack only", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });

    test("Should not include equipped in VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).not.toContain("equipped");
    });
  });

  describe("getAlchemyDB", () => {
    test("Should load alchemy database", () => {
      expect(db).toBeDefined();

      expect(typeof db).toBe("object");

      expect(Object.keys(db).length).toBeGreaterThan(0);
    });

    test("Should contain all required fields on each entry", () => {
      const entry = db[consumableId];

      expect(entry).toHaveProperty("consumable_id");
      expect(entry).toHaveProperty("consumable_name");
      expect(entry).toHaveProperty("consumable_box_name");
      expect(entry).toHaveProperty("consumable_tier");
      expect(entry).toHaveProperty("consumable_type");
      expect(entry).toHaveProperty("consumable_category");
      expect(entry).toHaveProperty("consumable_weight");
      expect(entry).toHaveProperty("consumable_price");
    });

    test("Should parse consumable_weight as a number", () => {
      const entry = db[consumableId];

      expect(typeof entry.consumable_weight).toBe("number");
    });

    test("Should parse consumable_price as a number", () => {
      const entry = db[consumableId];

      expect(typeof entry.consumable_price).toBe("number");
    });

    test("Should contain all five tiers", () => {
      const tiers = new Set(Object.values(db).map((e) => e.consumable_tier));

      expect(tiers).toContain("Comum");
      expect(tiers).toContain("Boa");
      expect(tiers).toContain("Superior");
      expect(tiers).toContain("Excelente");
      expect(tiers).toContain("Obra-Prima");
    });

    test("Should contain all four types", () => {
      const types = new Set(Object.values(db).map((e) => e.consumable_type));

      expect(types).toContain("Poção");
      expect(types).toContain("Elixir");
      expect(types).toContain("Veneno");
      expect(types).toContain("Bomba");
    });
  });

  describe("buildAlchemySlots", () => {
    test("Should build empty alchemy inventory", () => {
      const result = buildAlchemySlots();

      expect(result.stash).toEqual([]);
      expect(result.camp).toEqual([]);
      expect(result.backpack).toEqual([]);
      expect(result.carried_alchemy_weight).toBe(0);
    });

    test("Should place consumable in backpack correctly", () => {
      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 1,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack.length).toBe(1);
      expect(result.backpack[0].consumable_id).toBe(consumableId);
      expect(result.carried_alchemy_weight).toBeGreaterThan(0);
    });

    test("Should place consumable in stash correctly", () => {
      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 1,
          storedAt: "stash",
        },
      ]);

      expect(result.stash.length).toBe(1);
      expect(result.stash[0].consumable_id).toBe(consumableId);
      expect(result.carried_alchemy_weight).toBe(0);
    });

    test("Should place consumable in camp correctly", () => {
      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 1,
          storedAt: "camp",
        },
      ]);

      expect(result.camp.length).toBe(1);
      expect(result.camp[0].consumable_id).toBe(consumableId);
      expect(result.carried_alchemy_weight).toBe(0);
    });

    test("Should not count stash weight toward carried_alchemy_weight", () => {
      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 10,
          storedAt: "stash",
        },
      ]);

      expect(result.carried_alchemy_weight).toBe(0);
    });

    test("Should not count camp weight toward carried_alchemy_weight", () => {
      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 10,
          storedAt: "camp",
        },
      ]);

      expect(result.carried_alchemy_weight).toBe(0);
    });

    test("Should count backpack weight toward carried_alchemy_weight", () => {
      const consumable = db[consumableId];

      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 3,
          storedAt: "backpack",
        },
      ]);

      const expectedWeight =
        Math.round(consumable.consumable_weight * 3 * 100) / 100;

      expect(result.carried_alchemy_weight).toBe(expectedWeight);
    });

    test("Should resolve quantity on backpack entry", () => {
      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 5,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack[0].quantity).toBe(5);
    });

    test("Should distribute entries across all three locations", () => {
      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 1,
          storedAt: "backpack",
        },
        {
          consumable_id: consumableId,
          quantity: 2,
          storedAt: "stash",
        },
        {
          consumable_id: consumableId,
          quantity: 3,
          storedAt: "camp",
        },
      ]);

      expect(result.backpack.length).toBe(1);
      expect(result.stash.length).toBe(1);
      expect(result.camp.length).toBe(1);
    });

    test("Should allow multiple entries of the same consumable in the same location", () => {
      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 1,
          storedAt: "backpack",
        },
        {
          consumable_id: consumableId,
          quantity: 2,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack.length).toBe(2);
    });

    test("Should sum carried weight across multiple backpack entries", () => {
      const consumable = db[consumableId];

      const result = buildAlchemySlots([
        {
          consumable_id: consumableId,
          quantity: 2,
          storedAt: "backpack",
        },
        {
          consumable_id: consumableId,
          quantity: 1,
          storedAt: "backpack",
        },
      ]);

      const expectedWeight =
        Math.round(consumable.consumable_weight * 3 * 100) / 100;

      expect(result.carried_alchemy_weight).toBe(expectedWeight);
    });

    test("Should throw for unknown consumable_id", () => {
      expect(() => {
        buildAlchemySlots([
          {
            consumable_id: "INVALID-999",
            quantity: 1,
            storedAt: "backpack",
          },
        ]);
      }).toThrow("Unknown consumable_id(s)");
    });

    test("Should throw for invalid storedAt", () => {
      expect(() => {
        buildAlchemySlots([
          {
            consumable_id: consumableId,
            quantity: 1,
            storedAt: "equipped",
          },
        ]);
      }).toThrow("storedAt must be one of");
    });

    test("Should throw for invalid instance shape", () => {
      expect(() => {
        buildAlchemySlots([null]);
      }).toThrow("Invalid alchemyInventory");
    });

    test("Should throw when quantity is missing", () => {
      expect(() => {
        buildAlchemySlots([
          {
            consumable_id: consumableId,
            storedAt: "backpack",
          },
        ]);
      }).toThrow("quantity must be a positive integer");
    });
  });
});
