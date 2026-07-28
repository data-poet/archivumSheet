const {
  buildAccessorySlots,
  VALID_STORED_AT,
  _getAccessoriesDB,
} = require("engine/inventory/js/accessories/accessories");

describe("EQUIPMENT ACCESSORIES", () => {
  const db = _getAccessoriesDB();

  const ringId = Object.keys(db).find(
    (id) => db[id].accessory_name === "Anel",
  );
  const crownId = Object.keys(db).find(
    (id) => db[id].accessory_name === "Coroa",
  );

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("getAccessoriesDB", () => {
    test("Should load accessories database", () => {
      expect(db).toBeDefined();
      expect(typeof db).toBe("object");
      expect(Object.keys(db).length).toBe(6);
    });

    test("Should parse accessory_equip_limit as a number", () => {
      const accessory = db[ringId];
      expect(typeof accessory.accessory_equip_limit).toBe("number");
    });

    test("Should never load a weight or price field from the DB", () => {
      const accessory = db[ringId];
      expect(accessory).not.toHaveProperty("accessory_weight");
      expect(accessory).not.toHaveProperty("accessory_price");
    });

    test("Should load known accessory names with their limits", () => {
      expect(db[ringId]).toEqual({
        accessory_id: ringId,
        accessory_name: "Anel",
        accessory_equip_limit: 10,
      });
      expect(db[crownId]).toEqual({
        accessory_id: crownId,
        accessory_name: "Coroa",
        accessory_equip_limit: 1,
      });
    });
  });

  describe("buildAccessorySlots", () => {
    test("Should build empty accessories inventory", () => {
      const result = buildAccessorySlots();

      expect(result.equipped).toEqual([]);
      expect(result.stash).toEqual([]);
      expect(result.camp).toEqual([]);
      expect(result.backpack).toEqual([]);
      expect(result.carried_accessory_value).toBe(0);
    });

    test("Should equip accessory correctly", () => {
      const result = buildAccessorySlots([
        {
          accessory_id: ringId,
          is_equipped: true,
          storedAt: null,
          price: 100,
        },
      ]);

      expect(result.equipped.length).toBe(1);
      expect(result.equipped[0].accessory_id).toBe(ringId);
      expect(result.carried_accessory_value).toBe(100);
    });

    test("Should place accessory in backpack correctly", () => {
      const result = buildAccessorySlots([
        {
          accessory_id: ringId,
          is_equipped: false,
          storedAt: "backpack",
          price: 100,
        },
      ]);

      expect(result.backpack.length).toBe(1);
      expect(result.backpack[0].accessory_id).toBe(ringId);
      expect(result.carried_accessory_value).toBe(100);
    });

    test("Should place accessory in stash correctly and exclude it from carried value", () => {
      const result = buildAccessorySlots([
        {
          accessory_id: ringId,
          is_equipped: false,
          storedAt: "stash",
          price: 100,
        },
      ]);

      expect(result.stash.length).toBe(1);
      expect(result.stash[0].accessory_id).toBe(ringId);
      expect(result.carried_accessory_value).toBe(0);
    });

    test("Should place accessory in camp correctly and exclude it from carried value", () => {
      const result = buildAccessorySlots([
        {
          accessory_id: ringId,
          is_equipped: false,
          storedAt: "camp",
          price: 100,
        },
      ]);

      expect(result.camp.length).toBe(1);
      expect(result.camp[0].accessory_id).toBe(ringId);
      expect(result.carried_accessory_value).toBe(0);
    });

    test("Should allow multiple different accessory types to be equipped simultaneously", () => {
      const result = buildAccessorySlots([
        { accessory_id: ringId, is_equipped: true, storedAt: null, price: 10 },
        { accessory_id: crownId, is_equipped: true, storedAt: null, price: 20 },
      ]);

      expect(result.equipped.length).toBe(2);
      expect(result.carried_accessory_value).toBe(30);
    });

    test("Should allow equipping up to the limit for a single type", () => {
      const instances = Array.from({ length: 10 }, () => ({
        accessory_id: ringId,
        is_equipped: true,
        storedAt: null,
        price: 1,
      }));

      const result = buildAccessorySlots(instances);

      expect(result.equipped.length).toBe(10);
    });

    test("Should throw when equipping beyond the accessory's limit", () => {
      const instances = [
        { accessory_id: crownId, is_equipped: true, storedAt: null, price: 0 },
        { accessory_id: crownId, is_equipped: true, storedAt: null, price: 0 },
      ];

      expect(() => buildAccessorySlots(instances)).toThrow(
        /Equip limit exceeded/,
      );
    });

    test("Should allow the same type to be equipped once and stored elsewhere without hitting the limit", () => {
      const result = buildAccessorySlots([
        { accessory_id: crownId, is_equipped: true, storedAt: null, price: 0 },
        {
          accessory_id: crownId,
          is_equipped: false,
          storedAt: "stash",
          price: 0,
        },
      ]);

      expect(result.equipped.length).toBe(1);
      expect(result.stash.length).toBe(1);
    });

    test("Should throw for invalid instance shape", () => {
      expect(() =>
        buildAccessorySlots([{ is_equipped: true, storedAt: null }]),
      ).toThrow(/Invalid accessoryInventory/);
    });

    test("Should throw for unknown accessory_id", () => {
      expect(() =>
        buildAccessorySlots([
          {
            accessory_id: "ACCESSORY-DOES-NOT-EXIST",
            is_equipped: true,
            storedAt: null,
            price: 0,
          },
        ]),
      ).toThrow(/Unknown accessory_id/);
    });

    test("Should carry the custom fields through onto the resolved entry", () => {
      const result = buildAccessorySlots([
        {
          accessory_id: ringId,
          is_equipped: true,
          storedAt: null,
          price: 500,
          accessory_custom_name: "Anel do Vazio",
          accessory_custom_description: "Frio ao toque.",
          accessory_custom_effect: "+1 Vontade.",
        },
      ]);

      expect(result.equipped[0]).toMatchObject({
        accessory_custom_name: "Anel do Vazio",
        accessory_custom_description: "Frio ao toque.",
        accessory_custom_effect: "+1 Vontade.",
      });
    });

    test("Should never produce a weight field anywhere in the result", () => {
      const result = buildAccessorySlots([
        { accessory_id: ringId, is_equipped: true, storedAt: null, price: 10 },
        {
          accessory_id: ringId,
          is_equipped: false,
          storedAt: "backpack",
          price: 10,
        },
      ]);

      expect(result).not.toHaveProperty("carried_accessory_weight");
      expect(result).not.toHaveProperty("total_accessory_weight");
    });
  });
});
