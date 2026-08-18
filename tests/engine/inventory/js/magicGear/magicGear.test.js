const {
  buildMagicGearSlots,
  VALID_STORED_AT,
  _getMagicGearDB,
} = require("engine/inventory/js/magicGear/magicGear");

describe("MAGIC GEAR", () => {
  const db = _getMagicGearDB();

  const wandId = Object.keys(db).find(
    (id) => db[id].magic_gear_name === "Varinha",
  );
  const staffId = Object.keys(db).find(
    (id) => db[id].magic_gear_name === "Cajado",
  );
  const grimoireId = Object.keys(db).find(
    (id) => db[id].magic_gear_name === "Grimório",
  );

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("getMagicGearDB", () => {
    test("Should load magic gear database", () => {
      expect(db).toBeDefined();
      expect(typeof db).toBe("object");
      expect(Object.keys(db).length).toBe(7);
    });

    test("Should parse magic_gear_price and magic_gear_weight as numbers", () => {
      const wand = db[wandId];
      expect(typeof wand.magic_gear_price).toBe("number");
      expect(typeof wand.magic_gear_weight).toBe("number");
    });

    test("Should load known magic gear names with their price/weight", () => {
      expect(db[wandId]).toEqual({
        magic_gear_id: wandId,
        magic_gear_name: "Varinha",
        magic_gear_price: 150,
        magic_gear_weight: 0.3,
      });
    });
  });

  describe("buildMagicGearSlots", () => {
    test("Should build empty magic gear inventory", () => {
      const result = buildMagicGearSlots();

      expect(result.equipped).toEqual([]);
      expect(result.stash).toEqual([]);
      expect(result.camp).toEqual([]);
      expect(result.backpack).toEqual([]);
      expect(result.carried_magic_gear_value).toBe(0);
      expect(result.carried_magic_gear_weight).toBe(0);
    });

    test("Should equip magic gear correctly, pulling price/weight from the DB", () => {
      const result = buildMagicGearSlots([
        { magic_gear_id: wandId, is_equipped: true, storedAt: null },
      ]);

      expect(result.equipped.length).toBe(1);
      expect(result.equipped[0].magic_gear_id).toBe(wandId);
      expect(result.equipped[0].magic_gear_price).toBe(150);
      expect(result.equipped[0].magic_gear_weight).toBe(0.3);
      expect(result.carried_magic_gear_value).toBe(150);
      expect(result.carried_magic_gear_weight).toBe(0.3);
    });

    test("Should place magic gear in backpack correctly and count it toward carried totals", () => {
      const result = buildMagicGearSlots([
        { magic_gear_id: wandId, is_equipped: false, storedAt: "backpack" },
      ]);

      expect(result.backpack.length).toBe(1);
      expect(result.carried_magic_gear_value).toBe(150);
      expect(result.carried_magic_gear_weight).toBe(0.3);
    });

    test("Should place magic gear in stash correctly and exclude it from carried totals", () => {
      const result = buildMagicGearSlots([
        { magic_gear_id: wandId, is_equipped: false, storedAt: "stash" },
      ]);

      expect(result.stash.length).toBe(1);
      expect(result.carried_magic_gear_value).toBe(0);
      expect(result.carried_magic_gear_weight).toBe(0);
    });

    test("Should place magic gear in camp correctly and exclude it from carried totals", () => {
      const result = buildMagicGearSlots([
        { magic_gear_id: wandId, is_equipped: false, storedAt: "camp" },
      ]);

      expect(result.camp.length).toBe(1);
      expect(result.carried_magic_gear_value).toBe(0);
      expect(result.carried_magic_gear_weight).toBe(0);
    });

    test("Should allow equipping up to the global limit across different types", () => {
      const result = buildMagicGearSlots([
        { magic_gear_id: wandId, is_equipped: true, storedAt: null },
        { magic_gear_id: staffId, is_equipped: true, storedAt: null },
      ]);

      expect(result.equipped.length).toBe(2);
    });

    test("Should allow equipping up to the global limit with the same type twice", () => {
      const result = buildMagicGearSlots([
        { magic_gear_id: wandId, is_equipped: true, storedAt: null },
        { magic_gear_id: wandId, is_equipped: true, storedAt: null },
      ]);

      expect(result.equipped.length).toBe(2);
    });

    test("Should throw when equipping a 3rd magic gear item, regardless of combination", () => {
      const instances = [
        { magic_gear_id: wandId, is_equipped: true, storedAt: null },
        { magic_gear_id: staffId, is_equipped: true, storedAt: null },
        { magic_gear_id: grimoireId, is_equipped: true, storedAt: null },
      ];

      expect(() => buildMagicGearSlots(instances)).toThrow(
        /Equip limit exceeded/,
      );
    });

    test("Should allow more than 2 owned items as long as only 2 are equipped", () => {
      const result = buildMagicGearSlots([
        { magic_gear_id: wandId, is_equipped: true, storedAt: null },
        { magic_gear_id: staffId, is_equipped: true, storedAt: null },
        { magic_gear_id: grimoireId, is_equipped: false, storedAt: "stash" },
      ]);

      expect(result.equipped.length).toBe(2);
      expect(result.stash.length).toBe(1);
    });

    test("Should throw for invalid instance shape", () => {
      expect(() =>
        buildMagicGearSlots([{ is_equipped: true, storedAt: null }]),
      ).toThrow(/Invalid magicGearInventory/);
    });

    test("Should throw for unknown magic_gear_id", () => {
      expect(() =>
        buildMagicGearSlots([
          {
            magic_gear_id: "MAGIC_GEAR-DOES-NOT-EXIST",
            is_equipped: true,
            storedAt: null,
          },
        ]),
      ).toThrow(/Unknown magic_gear_id/);
    });

    test("Should carry the custom fields through onto the resolved entry", () => {
      const result = buildMagicGearSlots([
        {
          magic_gear_id: wandId,
          is_equipped: true,
          storedAt: null,
          magic_gear_custom_name: "Varinha de Sabugueiro",
          magic_gear_custom_description: "Feita de madeira clara.",
          magic_gear_custom_effect: "+1 NH em feitiços de Piromancia.",
        },
      ]);

      expect(result.equipped[0]).toMatchObject({
        magic_gear_custom_name: "Varinha de Sabugueiro",
        magic_gear_custom_description: "Feita de madeira clara.",
        magic_gear_custom_effect: "+1 NH em feitiços de Piromancia.",
      });
    });

    test("Should resolve a real Mana enchantment end-to-end and add its price to total_value", () => {
      const result = buildMagicGearSlots([
        {
          magic_gear_id: wandId,
          is_equipped: true,
          storedAt: null,
          enchantments: [
            {
              _instanceId: "ench-1",
              enchantment_id: "ENCHANTMENT-010",
              value: 1,
            },
          ],
        },
      ]);

      // ENCHANTMENT-010 (Fortificar Mana) at base value: base_price 2500
      expect(result.equipped[0].enchantments_total_price).toBe(2500);
      expect(result.equipped[0].total_value).toBe(2650); // 150 (wand) + 2500
      expect(result.carried_magic_gear_value).toBe(2650);
    });

    test("Should throw when applying an enchantment not allowed on magic gear", () => {
      // ENCHANTMENT-000 (Fortificar ST) is only allowed on "Acessórios"
      expect(() =>
        buildMagicGearSlots([
          {
            magic_gear_id: wandId,
            is_equipped: true,
            storedAt: null,
            enchantments: [{ enchantment_id: "ENCHANTMENT-000", value: 1 }],
          },
        ]),
      ).toThrow(/Invalid enchantments/);
    });

    test("Should throw for an unknown enchantment_id", () => {
      expect(() =>
        buildMagicGearSlots([
          {
            magic_gear_id: wandId,
            is_equipped: true,
            storedAt: null,
            enchantments: [
              { enchantment_id: "ENCHANTMENT-DOES-NOT-EXIST", value: 1 },
            ],
          },
        ]),
      ).toThrow(/Invalid enchantments/);
    });

    test("Should never produce a user-input price field anywhere in the result", () => {
      const result = buildMagicGearSlots([
        { magic_gear_id: wandId, is_equipped: true, storedAt: null },
      ]);

      expect(result.equipped[0]).not.toHaveProperty("price");
    });
  });
});
