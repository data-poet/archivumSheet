const { buildInventory } = require("engine/inventory/buildInventory");

const assertShape = require("tests/helpers/assertShape");

describe("INVENTORY BUILDER", () => {
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

    // modifier (35 → between 30 and 60 → -3)
    expect(carry.weight_modifier).toBe(-3);
  });
});
