const { calculateDamage } = require("engine/character/js/baseDamage");

describe("Damage System (GDP / BAL)", () => {
  // =========================
  // BASE TESTS
  // =========================

  test("ST 10 returns correct base values", () => {
    const result = calculateDamage(10);

    expect(result.GDP.dice).toBe("1d6");
    expect(result.GDP.base_modifier).toBe(-2);

    expect(result.BAL.dice).toBe("1d6");
    expect(result.BAL.base_modifier).toBe(0);
  });

  test("ST 5 starts damage correctly (1d6 -5)", () => {
    const result = calculateDamage(5);

    expect(result.GDP.dice).toBe("1d6");
    expect(result.GDP.base_modifier).toBe(-5);

    expect(result.BAL.dice).toBe("1d6");
    expect(result.BAL.base_modifier).toBe(-5);
  });

  test("ST 4 deals no damage (0d6)", () => {
    const result = calculateDamage(4);

    expect(result.GDP.dice).toBe("0d6");
    expect(result.GDP.base_modifier).toBe(0);

    expect(result.BAL.dice).toBe("0d6");
    expect(result.BAL.base_modifier).toBe(0);
  });

  test("High ST scales correctly", () => {
    const result = calculateDamage(20);

    expect(result.GDP.dice).toBe("2d6");
    expect(result.GDP.base_modifier).toBe(-1);

    expect(result.BAL.dice).toBe("3d6");
    expect(result.BAL.base_modifier).toBe(2);
  });

  // =========================
  // MODIFIERS
  // =========================

  test("External modifiers affect only final modifier", () => {
    const result = calculateDamage(10, {
      GDP: { modifier: 3 },
      BAL: { modifier: 2 },
    });

    expect(result.GDP.base_modifier).toBe(-2);
    expect(result.GDP.final_modifier).toBe(1); // -2 + 3

    expect(result.BAL.base_modifier).toBe(0);
    expect(result.BAL.final_modifier).toBe(2); // 0 + 2
  });

  test("Modifiers do not affect dice", () => {
    const result = calculateDamage(10, {
      GDP: { modifier: 999 },
    });

    expect(result.GDP.dice).toBe("1d6");
  });

  // =========================
  // STRUCTURE
  // =========================

  test("Return structure is correct", () => {
    const result = calculateDamage(10, {
      GDP: { modifier: 1 },
      BAL: { modifier: -1 },
    });

    expect(result.GDP).toHaveProperty("dice");
    expect(result.GDP).toHaveProperty("base_modifier");
    expect(result.GDP).toHaveProperty("modifier");
    expect(result.GDP).toHaveProperty("final_modifier");

    expect(result.BAL).toHaveProperty("dice");
    expect(result.BAL).toHaveProperty("base_modifier");
    expect(result.BAL).toHaveProperty("modifier");
    expect(result.BAL).toHaveProperty("final_modifier");
  });

  // =========================
  // FULL TABLE (1 → 30)
  // =========================

  describe("Damage Table - Thresholds (ST 1 to 30)", () => {
    const table = [
      [1, "0d6", 0, "0d6", 0],
      [2, "0d6", 0, "0d6", 0],
      [3, "0d6", 0, "0d6", 0],
      [4, "0d6", 0, "0d6", 0],
      [5, "1d6", -5, "1d6", -5],
      [6, "1d6", -4, "1d6", -4],
      [7, "1d6", -3, "1d6", -3],
      [8, "1d6", -3, "1d6", -2],
      [9, "1d6", -2, "1d6", -1],
      [10, "1d6", -2, "1d6", 0],
      [11, "1d6", -1, "1d6", 1],
      [12, "1d6", -1, "1d6", 2],
      [13, "1d6", 0, "2d6", -1],
      [14, "1d6", 0, "2d6", 0],
      [15, "1d6", 1, "2d6", 1],
      [16, "1d6", 1, "2d6", 2],
      [17, "1d6", 2, "3d6", -1],
      [18, "1d6", 2, "3d6", 0],
      [19, "2d6", -1, "3d6", 1],
      [20, "2d6", -1, "3d6", 2],
      [21, "2d6", 0, "4d6", -1],
      [22, "2d6", 0, "4d6", 0],
      [23, "2d6", 1, "4d6", 1],
      [24, "2d6", 1, "4d6", 2],
      [25, "2d6", 2, "5d6", -1],
      [26, "2d6", 2, "5d6", 0],
      [27, "3d6", -1, "5d6", 1],
      [28, "3d6", -1, "5d6", 2],
      [29, "3d6", 0, "6d6", -1],
      [30, "3d6", 0, "6d6", 0],
    ];

    test.each(table)(
      "ST %i → GDP %s (%i) | BAL %s (%i)",
      (st, gdpDice, gdpMod, balDice, balMod) => {
        const result = calculateDamage(st);

        expect(result.GDP.dice).toBe(gdpDice);
        expect(result.GDP.base_modifier).toBe(gdpMod);

        expect(result.BAL.dice).toBe(balDice);
        expect(result.BAL.base_modifier).toBe(balMod);
      },
    );
  });
});
