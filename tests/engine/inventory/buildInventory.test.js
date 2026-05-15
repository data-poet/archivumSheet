const { buildInventory } = require("engine/inventory/buildInventory");

const { _getArmorDB } = require("engine/inventory/js/armor/armor");

const { _getShieldDB } = require("engine/inventory/js/shield/shield");

const assertShape = require("tests/helpers/assertShape");

describe("INVENTORY BUILDER", () => {
  const armorDb = _getArmorDB();

  const shieldDb = _getShieldDB();

  const armorId = Object.keys(armorDb)[0];

  const shieldId = Object.keys(shieldDb)[0];

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

  test("Should include shield inventory", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      shieldInventory: [],
    });

    expect(result.inventory).toHaveProperty("shield");
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

  test("Should include equipped shield weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,

      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: true,
          storedAt: null,
        },
      ],
    });

    expect(result.inventory.shield.carried_shield_weight).toBeGreaterThan(0);
  });

  test("Should include backpack shield weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,

      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ],
    });

    expect(result.inventory.shield.carried_shield_weight).toBeGreaterThan(0);
  });

  test("Should ignore stash shield weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,

      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "stash",
        },
      ],
    });

    expect(result.inventory.shield.carried_shield_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should ignore camp shield weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,

      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "camp",
        },
      ],
    });

    expect(result.inventory.shield.carried_shield_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should combine armor and shield carried weight", () => {
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

      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBeGreaterThan(0);

    expect(result.inventory.shield.carried_shield_weight).toBeGreaterThan(0);

    const totalCarriedWeight =
      result.inventory.armor.carried_armor_weight +
      result.inventory.shield.carried_shield_weight;

    expect(totalCarriedWeight).toBeGreaterThan(0);
  });
});
