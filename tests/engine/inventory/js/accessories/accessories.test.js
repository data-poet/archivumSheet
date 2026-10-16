const { ACCESSORY, ADVANTAGE, ENCHANTMENT } = require("tests/helpers/dataRefs");
const { loadDataset } = require("helpers/datasets.js");
const { buildAdvantages } = require("engine/character/js/traits/advantages");
const {
  buildAccessorySlots,
  VALID_STORED_AT,
  _getAccessoriesDB,
} = require("engine/inventory/js/accessories/accessories");

describe("EQUIPMENT ACCESSORIES", () => {
  const db = _getAccessoriesDB();

  const ringId = ACCESSORY.anel;
  const crownId = ACCESSORY.coroa;

  const rowOf = (dataset, idColumn, id) =>
    loadDataset(dataset).find((row) => row[idColumn] === id);
  const enchantmentRow = (id) => rowOf("ENCHANTMENTS", "enchantment_id", id);

  describe("Constants", () => {
    test("Should export VALID_STORED_AT", () => {
      expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("getAccessoriesDB", () => {
    test("Should load accessories database", () => {
      expect(db).toBeDefined();
      expect(typeof db).toBe("object");
      expect(Object.keys(db).length).toBeGreaterThan(0);
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

    test("Should load each accessory with its name and limit from the CSV row", () => {
      [ringId, crownId].forEach((id) => {
        const row = rowOf("ACCESSORIES", "accessory_id", id);
        expect(db[id]).toMatchObject({
          accessory_id: id,
          accessory_name: row.accessory_name,
          accessory_equip_limit: Number(row.accessory_equip_limit),
        });
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

    test("Should resolve a real attribute enchantment end-to-end and add its price to total_value", () => {
      const result = buildAccessorySlots([
        {
          accessory_id: ringId,
          is_equipped: true,
          storedAt: null,
          price: 0,
          enchantments: [
            {
              id: "ench-1",
              enchantment_id: ENCHANTMENT.fortifyST,
              value: 1,
            },
          ],
        },
      ]);

      const basePrice = Number(
        enchantmentRow(ENCHANTMENT.fortifyST).enchantment_base_price,
      );
      expect(result.equipped[0].enchantments_total_price).toBe(basePrice);
      expect(result.equipped[0].total_value).toBe(basePrice);
      expect(result.carried_accessory_value).toBe(basePrice);
    });

    test("Should resolve a real advantage-granting enchantment using the target's own point cost", () => {
      const result = buildAccessorySlots([
        {
          accessory_id: ringId,
          is_equipped: true,
          storedAt: null,
          price: 0,
          enchantments: [
            {
              id: "ench-1",
              enchantment_id: ENCHANTMENT.addAdvantage,
              target: ADVANTAGE.atraente,
            },
          ],
        },
      ]);

      const pricePerPoint = Number(
        enchantmentRow(ENCHANTMENT.addAdvantage).enchantment_price_per_point,
      );
      const { points } = buildAdvantages([ADVANTAGE.atraente]).advantages[
        ADVANTAGE.atraente
      ];
      expect(result.equipped[0].enchantments_total_price).toBe(
        pricePerPoint * points,
      );
    });

    test("Should throw for an unknown enchantment_id", () => {
      expect(() =>
        buildAccessorySlots([
          {
            accessory_id: ringId,
            is_equipped: true,
            storedAt: null,
            price: 0,
            enchantments: [
              { enchantment_id: "ENCHANTMENT-DOES-NOT-EXIST", value: 1 },
            ],
          },
        ]),
      ).toThrow(/Invalid enchantments/);
    });

    test("Should throw when an attribute enchantment's value doesn't align to whole-number steps", () => {
      // non-integer values are valid at the shape level (percentage types use fractions), so this is caught later by the DB-aware step-alignment check, under "Invalid enchantments" not "Invalid accessoryInventory"
      expect(() =>
        buildAccessorySlots([
          {
            accessory_id: ringId,
            is_equipped: true,
            storedAt: null,
            price: 0,
            enchantments: [
              { enchantment_id: ENCHANTMENT.fortifyST, value: 1.5 },
            ],
          },
        ]),
      ).toThrow(/Invalid enchantments/);
    });

    test("Should throw when a fortify_attribute enchantment's value is negative", () => {
      expect(() =>
        buildAccessorySlots([
          {
            accessory_id: ringId,
            is_equipped: true,
            storedAt: null,
            price: 0,
            enchantments: [
              { enchantment_id: ENCHANTMENT.fortifyST, value: -1 },
            ],
          },
        ]),
      ).toThrow(/Invalid enchantments/);
    });

    test("Should throw when a weaken_attribute enchantment's value is positive", () => {
      expect(() =>
        buildAccessorySlots([
          {
            accessory_id: ringId,
            is_equipped: true,
            storedAt: null,
            price: 0,
            enchantments: [{ enchantment_id: ENCHANTMENT.weakenST, value: 1 }],
          },
        ]),
      ).toThrow(/Invalid enchantments/);
    });

    test("Should throw when an advantage-granting enchantment's target doesn't exist", () => {
      expect(() =>
        buildAccessorySlots([
          {
            accessory_id: ringId,
            is_equipped: true,
            storedAt: null,
            price: 0,
            enchantments: [
              {
                enchantment_id: ENCHANTMENT.addAdvantage,
                target: "ADV-DOES-NOT-EXIST",
              },
            ],
          },
        ]),
      ).toThrow(/Invalid enchantments/);
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
