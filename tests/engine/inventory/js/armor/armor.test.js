const {
  buildArmorSlots,
  SLOTS,
  VALID_STORED_AT,
  _getArmorDB,
} = require("engine/inventory/js/armor/armor.js");

describe("EQUIPMENT ARMOR", () => {
  const db = _getArmorDB();

  const armorId = Object.keys(db)[0];

  const materialId = "MAT-003"; // assuming exists in your CSV DB

  const slotMap = {
    Cabeça: "head",
    Torso: "torso",
    Braços: "arms",
    Mãos: "hands",
    Pernas: "legs",
    Pés: "feet",
  };

  describe("Constants", () => {
    test("Should export SLOTS", () => {
      expect(SLOTS).toEqual([
        "Cabeça",
        "Torso",
        "Braços",
        "Mãos",
        "Pernas",
        "Pés",
      ]);
    });

    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["camp", "stash", "backpack"]);
    });
  });

  describe("getArmorDB", () => {
    test("Should load armor database", () => {
      expect(db).toBeDefined();

      expect(typeof db).toBe("object");

      expect(Object.keys(db).length).toBeGreaterThan(0);
    });
  });

  describe("buildArmorSlots", () => {
    test("Should build empty armor inventory", () => {
      const result = buildArmorSlots();

      expect(result.equipped).toEqual({
        head: null,
        torso: null,
        arms: null,
        hands: null,
        legs: null,
        feet: null,
      });

      expect(result.stash).toEqual({
        head: [],
        torso: [],
        arms: [],
        hands: [],
        legs: [],
        feet: [],
      });

      expect(result.camp).toEqual({
        head: [],
        torso: [],
        arms: [],
        hands: [],
        legs: [],
        feet: [],
      });

      expect(result.backpack).toEqual({
        head: [],
        torso: [],
        arms: [],
        hands: [],
        legs: [],
        feet: [],
      });

      expect(result.total_armor_weight).toBe(0);

      expect(result.carried_armor_weight).toBe(0);
    });

    test("Should equip armor correctly", () => {
      const result = buildArmorSlots([
        {
          armor_id: armorId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      expect(Object.values(result.equipped).some(Boolean)).toBe(true);
    });

    test("Should place equipped armor in correct slot", () => {
      const armor = db[armorId];

      const result = buildArmorSlots([
        {
          armor_id: armorId,
          is_equipped: true,
          storedAt: null,
        },
      ]);

      const slot = slotMap[armor.armor_piece_location];

      expect(result.equipped[slot]).not.toBeNull();

      expect(result.equipped[slot].armor_id).toBe(armorId);
    });

    test("Should carry backpack armor correctly", () => {
      const armor = db[armorId];

      const slot = slotMap[armor.armor_piece_location];

      const result = buildArmorSlots([
        {
          armor_id: armorId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack[slot].length).toBe(1);

      expect(result.carried_armor_weight).toBeGreaterThan(0);
    });

    test("Should not count stash armor as carried weight", () => {
      const armor = db[armorId];

      const slot = slotMap[armor.armor_piece_location];

      const result = buildArmorSlots([
        {
          armor_id: armorId,
          is_equipped: false,
          storedAt: "stash",
        },
      ]);

      expect(result.stash[slot].length).toBe(1);

      expect(result.carried_armor_weight).toBe(0);
    });

    test("Should match total_armor_weight with carried_armor_weight logic", () => {
      const result = buildArmorSlots([
        {
          armor_id: armorId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.total_armor_weight).toBe(result.carried_armor_weight);
    });

    test("Should throw for invalid armor_id", () => {
      expect(() => {
        buildArmorSlots([
          {
            armor_id: "INVALID",
            is_equipped: true,
            storedAt: null,
          },
        ]);
      }).toThrow("Unknown armor_id(s)");
    });

    test("Should throw for invalid material_id", () => {
      expect(() => {
        buildArmorSlots([
          {
            armor_id: armorId,
            material_id: "INVALID_MAT",
            is_equipped: false,
            storedAt: "backpack",
          },
        ]);
      }).toThrow("Unknown material_id(s)");
    });

    test("Should not throw when material_id is valid", () => {
      const armor = db[armorId];

      const slot = slotMap[armor.armor_piece_location];

      const result = buildArmorSlots([
        {
          armor_id: armorId,
          material_id: materialId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ]);

      expect(result.backpack[slot].length).toBe(1);
    });

    test("Should respect VALID_STORED_AT implicitly via no crash", () => {
      const armor = db[armorId];

      const slot = slotMap[armor.armor_piece_location];

      const result = buildArmorSlots([
        {
          armor_id: armorId,
          is_equipped: false,
          storedAt: "camp",
        },
      ]);

      expect(result.camp[slot].length).toBe(1);

      expect(result.carried_armor_weight).toBe(0);
    });
  });
});
