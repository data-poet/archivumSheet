const {
  resolveArmorPiece,
  buildEquippedSlots,
  calculateTotalArmorWeight,
} = require("engine/inventory/js/equipmentArmorResolver");

describe("ARMOR RESOLVER", () => {
  describe("resolveArmorPiece", () => {
    test("Should merge armor and instance data", () => {
      const instance = {
        is_equipped: true,
        storedAt: null,
      };

      const armor = {
        armor_id: "ARM-0001",
        armor_name: "Leather Cap",
        armor_box_name: "Leather",
        armor_piece_location: "Cabeça",
        armor_type: "Light",
        armor_tier: "Common",
        armor_damage_resistence: 1,
        armor_weight: 2,
        armor_price: 50,
        armor_hit_points: 10,
      };

      const result = resolveArmorPiece(instance, armor);

      expect(result).toEqual({
        armor_id: "ARM-0001",
        armor_name: "Leather Cap",
        armor_box_name: "Leather",
        armor_piece_location: "Cabeça",
        armor_type: "Light",
        armor_tier: "Common",
        armor_damage_resistence: 1,
        armor_weight: 2,
        armor_price: 50,
        armor_hit_points: 10,
        is_equipped: true,
        storedAt: null,
      });
    });
  });

  describe("buildEquippedSlots", () => {
    test("Should build all slots as null", () => {
      const result = buildEquippedSlots();

      expect(result).toEqual({
        Cabeça: null,
        Torso: null,
        Braços: null,
        Mãos: null,
        Pernas: null,
        Pés: null,
      });
    });
  });

  describe("calculateTotalArmorWeight", () => {
    test("Should sum all armor weights", () => {
      const inventory = [
        {
          armor_id: "ARM-0001",
        },
        {
          armor_id: "ARM-0002",
        },
      ];

      const db = {
        "ARM-0001": {
          armor_weight: 2,
        },
        "ARM-0002": {
          armor_weight: 5,
        },
      };

      const result = calculateTotalArmorWeight(inventory, db);

      expect(result).toBe(7);
    });
  });
});
