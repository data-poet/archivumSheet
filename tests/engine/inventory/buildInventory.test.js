const { buildInventory } = require("engine/inventory/buildInventory");

const { _getArmorDB } = require("engine/inventory/js/equipmentArmor");

const assertShape = require("tests/helpers/assertShape");

describe("INVENTORY BUILDER", () => {
  const db = _getArmorDB();

  const armorId = Object.keys(db)[0];

  test("Should build inventory with carry weight correctly", () => {
    const result = buildInventory({
      ST: 10,
      weight: 35,
    });

    assertShape(result, ["inventory"]);

    const carry = result.inventory.carry_weight;

    // limits
    expect(carry.limits.none).toBe(10);

    expect(carry.limits.light).toBe(20);

    expect(carry.limits.medium).toBe(30);

    expect(carry.limits.heavy).toBe(60);

    expect(carry.limits.veryHeavy).toBe(100);

    // modifier
    // 35 → between 30 and 60
    expect(carry.weight_modifier).toBe(-3);
  });

  test("Should include armor inventory", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      armorInventory: [],
    });

    expect(result.inventory).toHaveProperty("armor");
  });

  test("Should include equipped armor weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,

      armorInventory: [
        {
          armor_id: armorId,

          is_equipped: true,

          storedAt: null,
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBeGreaterThan(0);
  });

  test("Should include backpack armor weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,

      armorInventory: [
        {
          armor_id: armorId,

          is_equipped: false,

          storedAt: "backpack",
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBeGreaterThan(0);
  });

  test("Should ignore stash armor weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,

      armorInventory: [
        {
          armor_id: armorId,

          is_equipped: false,

          storedAt: "stash",
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should ignore camp armor weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,

      armorInventory: [
        {
          armor_id: armorId,

          is_equipped: false,

          storedAt: "camp",
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });
});
