const { buildSheet } = require("engine/buildSheet");

describe("SHEET BUILDER", () => {
  test("Should use character ST to calculate carry weight", () => {
    const result = buildSheet({
      character: {
        primaryAttributes: {
          ST: { value: 14 },
          DX: { value: 10 },
          IQ: { value: 10 },
          HT: { value: 10 },
        },
      },
      inventory: {
        weight: 20,
      },
    });

    const ST = result.character.primary_attributes.ST.value;

    const carry = result.inventory.carry_weight;

    // 🔥 Core assertion: inventory uses character ST
    expect(carry.limits.none).toBe(ST);

    // sanity check (14 * 2 = 28)
    expect(carry.limits.light).toBe(28);
  });

  test("Should ignore ST passed in inventory and use character ST", () => {
    const result = buildSheet({
      character: {
        primaryAttributes: { ST: { value: 14 } },
      },
      inventory: {
        ST: 999, // should be ignored
        weight: 5,
      },
    });

    const carry = result.inventory.carry_weight;

    expect(carry.limits.none).toBe(14);
  });
});
