const {
  computeWeaponDamage,
  formatDamageString,
} = require("engine/inventory/js/shared/weaponDamage");
const { DAMAGE_TYPES } = require("helpers/taxonomy.js");

const BASE_DAMAGE_ST10 = {
  GDP: {
    dice: "1d6",
    base_modifier: -2,
    modifier: 0,
    final_modifier: -2,
  },
  BAL: {
    dice: "1d6",
    base_modifier: 0,
    modifier: 0,
    final_modifier: 0,
  },
};

const BASE_DAMAGE_ST15 = {
  GDP: {
    dice: "1d6",
    base_modifier: 1,
    modifier: 0,
    final_modifier: 1,
  },
  BAL: {
    dice: "1d6",
    base_modifier: 2,
    modifier: 0,
    final_modifier: 2,
  },
};

describe("formatDamageString", () => {
  test("negative sum uses minus sign without space", () => {
    expect(formatDamageString("1d6", -1)).toBe("1d6-1");
  });

  test("zero sum uses plus sign", () => {
    expect(formatDamageString("1d6", 0)).toBe("1d6+0");
  });

  test("positive sum uses plus sign", () => {
    expect(formatDamageString("1d6", 3)).toBe("1d6+3");
  });

  test("works with multi-dice expressions", () => {
    expect(formatDamageString("2d6", -2)).toBe("2d6-2");
    expect(formatDamageString("3d6", 5)).toBe("3d6+5");
  });

  test("large negative absolute value is preserved", () => {
    expect(formatDamageString("1d6", -5)).toBe("1d6-5");
  });
});

describe("computeWeaponDamage — guard clauses", () => {
  test("returns empty object when base_damage is null", () => {
    expect(computeWeaponDamage(DAMAGE_TYPES.PIERCING, 1, null, null)).toEqual(
      {},
    );
  });

  test("returns empty object when base_damage is undefined", () => {
    expect(
      computeWeaponDamage(DAMAGE_TYPES.PIERCING, 1, null, undefined),
    ).toEqual({});
  });

  test("returns empty object when weapon_damage_type is null", () => {
    expect(computeWeaponDamage(null, 1, 1, BASE_DAMAGE_ST10)).toEqual({});
  });

  test("returns empty object when weapon_damage_type is undefined", () => {
    expect(computeWeaponDamage(undefined, 1, 1, BASE_DAMAGE_ST10)).toEqual({});
  });

  test("returns empty object when damage type matches no known sigla", () => {
    expect(computeWeaponDamage("outro", 1, 1, BASE_DAMAGE_ST10)).toEqual({});
  });
});

describe("computeWeaponDamage — pi (thrust-based)", () => {
  test("computes weapon_gdp_damage only for pi type", () => {
    // GDP.final_modifier -2 + weapon_gdp_modifier +1 = -1 → "1d6-1"
    const result = computeWeaponDamage(
      DAMAGE_TYPES.PIERCING,
      1,
      null,
      BASE_DAMAGE_ST10,
    );

    expect(result).toEqual({ weapon_gdp_damage: "1d6-1" });
    expect(result.weapon_bal_damage).toBeUndefined();
  });

  test("zero sum → 1d6+0", () => {
    // GDP.final_modifier -2 + weapon_gdp_modifier +2 = 0
    const result = computeWeaponDamage(
      DAMAGE_TYPES.PIERCING,
      2,
      null,
      BASE_DAMAGE_ST10,
    );

    expect(result.weapon_gdp_damage).toBe("1d6+0");
  });

  test("positive sum → plus sign", () => {
    // GDP.final_modifier +1 + weapon_gdp_modifier +3 = +4
    const result = computeWeaponDamage(
      DAMAGE_TYPES.PIERCING,
      3,
      null,
      BASE_DAMAGE_ST15,
    );

    expect(result.weapon_gdp_damage).toBe("1d6+4");
  });

  test("weapon_gdp_modifier = 0 works correctly", () => {
    // GDP.final_modifier -2 + 0 = -2
    const result = computeWeaponDamage(
      DAMAGE_TYPES.PIERCING,
      0,
      null,
      BASE_DAMAGE_ST10,
    );

    expect(result.weapon_gdp_damage).toBe("1d6-2");
  });

  test("omits weapon_gdp_damage when GDP key is missing from base_damage", () => {
    const baseDamageNoGDP = { BAL: BASE_DAMAGE_ST10.BAL };

    const result = computeWeaponDamage(
      DAMAGE_TYPES.PIERCING,
      1,
      null,
      baseDamageNoGDP,
    );

    expect(result.weapon_gdp_damage).toBeUndefined();
  });
});

describe("computeWeaponDamage — other thrust-based siglas also resolve through GDP", () => {
  test.each([
    DAMAGE_TYPES.IMPALING,
    DAMAGE_TYPES.PIERCING_SMALL,
    DAMAGE_TYPES.PIERCING_LARGE,
    DAMAGE_TYPES.PIERCING_HUGE,
  ])("%s computes weapon_gdp_damage, not weapon_bal_damage", (sigla) => {
    const result = computeWeaponDamage(sigla, 1, 1, BASE_DAMAGE_ST10);

    expect(result.weapon_gdp_damage).toBe("1d6-1");
    expect(result.weapon_bal_damage).toBeUndefined();
  });
});

describe("computeWeaponDamage — cut (swing-based)", () => {
  test("computes weapon_bal_damage only for cut type", () => {
    // BAL.final_modifier 0 + weapon_bal_modifier +3 = +3 → "1d6+3"
    const result = computeWeaponDamage(
      DAMAGE_TYPES.CUTTING,
      null,
      3,
      BASE_DAMAGE_ST10,
    );

    expect(result).toEqual({ weapon_bal_damage: "1d6+3" });
    expect(result.weapon_gdp_damage).toBeUndefined();
  });

  test("zero sum → 1d6+0", () => {
    // BAL.final_modifier 0 + weapon_bal_modifier 0 = 0
    const result = computeWeaponDamage(
      DAMAGE_TYPES.CUTTING,
      null,
      0,
      BASE_DAMAGE_ST10,
    );

    expect(result.weapon_bal_damage).toBe("1d6+0");
  });

  test("negative sum from base modifier", () => {
    // Override: BAL.final_modifier -1 + weapon_bal_modifier +0 = -1
    const baseDamageNeg = {
      GDP: BASE_DAMAGE_ST10.GDP,
      BAL: { dice: "1d6", base_modifier: -1, modifier: 0, final_modifier: -1 },
    };

    const result = computeWeaponDamage(
      DAMAGE_TYPES.CUTTING,
      null,
      0,
      baseDamageNeg,
    );

    expect(result.weapon_bal_damage).toBe("1d6-1");
  });

  test("omits weapon_bal_damage when weapon_bal_modifier is null (ranged cut falls through to nothing, not swing)", () => {
    // Ranged/firearms rows never populate weapon_bal_modifier.
    const result = computeWeaponDamage(
      DAMAGE_TYPES.CUTTING,
      0,
      null,
      BASE_DAMAGE_ST10,
    );

    expect(result.weapon_bal_damage).toBeUndefined();
  });

  test("omits weapon_bal_damage when weapon_bal_modifier is undefined", () => {
    const result = computeWeaponDamage(
      DAMAGE_TYPES.CUTTING,
      0,
      undefined,
      BASE_DAMAGE_ST10,
    );

    expect(result.weapon_bal_damage).toBeUndefined();
  });

  test("omits weapon_bal_damage when BAL key is missing from base_damage", () => {
    const baseDamageNoBAL = { GDP: BASE_DAMAGE_ST10.GDP };

    const result = computeWeaponDamage(
      DAMAGE_TYPES.CUTTING,
      null,
      2,
      baseDamageNoBAL,
    );

    expect(result.weapon_bal_damage).toBeUndefined();
  });
});

describe("computeWeaponDamage — cr (swing-based)", () => {
  test("computes weapon_bal_damage for cr type", () => {
    // BAL.final_modifier 0 + weapon_bal_modifier +1 = +1
    const result = computeWeaponDamage(
      DAMAGE_TYPES.CRUSHING,
      null,
      1,
      BASE_DAMAGE_ST10,
    );

    expect(result).toEqual({ weapon_bal_damage: "1d6+1" });
  });
});

describe("computeWeaponDamage — ranged/firearms cr or cut still uses GDP, never BAL", () => {
  test.each([DAMAGE_TYPES.CRUSHING, DAMAGE_TYPES.CUTTING])(
    "%s with no weapon_bal_modifier (ranged shape) yields weapon_gdp_damage only if combined with a thrust type",
    (sigla) => {
      // A ranged row listing only a swing-based sigla and no bal_modifier gets no damage field at all —
      // this is the signal that such a row's data is wrong, not a silent fallback to GDP.
      const soloResult = computeWeaponDamage(sigla, 1, null, BASE_DAMAGE_ST10);
      expect(soloResult).toEqual({});

      // Dual-listed (e.g. a thrown weapon tagged "cr, pi") still resolves GDP for the pi part.
      const dualResult = computeWeaponDamage(
        `${sigla}, ${DAMAGE_TYPES.PIERCING}`,
        1,
        null,
        BASE_DAMAGE_ST10,
      );
      expect(dualResult).toEqual({ weapon_gdp_damage: "1d6-1" });
    },
  );
});

describe("computeWeaponDamage — both pi and cut", () => {
  test("computes both fields when type contains pi and cut", () => {
    // GDP: -2 + 1 = -1 → "1d6-1"
    // BAL:  0 + 3 =  3 → "1d6+3"
    const result = computeWeaponDamage(
      `${DAMAGE_TYPES.CUTTING}, ${DAMAGE_TYPES.PIERCING}`,
      1,
      3,
      BASE_DAMAGE_ST10,
    );

    expect(result).toEqual({
      weapon_gdp_damage: "1d6-1",
      weapon_bal_damage: "1d6+3",
    });
  });

  test("computes both fields when type contains pi and cr", () => {
    // GDP: +1 + 2 = +3 → "1d6+3"
    // BAL: +2 + 1 = +3 → "1d6+3"
    const result = computeWeaponDamage(
      `${DAMAGE_TYPES.PIERCING}, ${DAMAGE_TYPES.CRUSHING}`,
      2,
      1,
      BASE_DAMAGE_ST15,
    );

    expect(result).toEqual({
      weapon_gdp_damage: "1d6+3",
      weapon_bal_damage: "1d6+3",
    });
  });

  test("both at zero sum → both show +0", () => {
    // GDP: -2 + 2 = 0
    // BAL:  0 + 0 = 0
    const result = computeWeaponDamage(
      `${DAMAGE_TYPES.CUTTING}, ${DAMAGE_TYPES.PIERCING}`,
      2,
      0,
      BASE_DAMAGE_ST10,
    );

    expect(result).toEqual({
      weapon_gdp_damage: "1d6+0",
      weapon_bal_damage: "1d6+0",
    });
  });

  test("missing weapon_bal_modifier yields only weapon_gdp_damage", () => {
    // bal_modifier absent (e.g. ranged-style record with cut somehow)
    const result = computeWeaponDamage(
      `${DAMAGE_TYPES.CUTTING}, ${DAMAGE_TYPES.PIERCING}`,
      1,
      null,
      BASE_DAMAGE_ST10,
    );

    expect(result).toEqual({ weapon_gdp_damage: "1d6-1" });
    expect(result.weapon_bal_damage).toBeUndefined();
  });
});

describe("computeWeaponDamage — return types", () => {
  test("returned damage values are always strings", () => {
    const result = computeWeaponDamage(
      `${DAMAGE_TYPES.CUTTING}, ${DAMAGE_TYPES.PIERCING}`,
      1,
      2,
      BASE_DAMAGE_ST10,
    );

    expect(typeof result.weapon_gdp_damage).toBe("string");
    expect(typeof result.weapon_bal_damage).toBe("string");
  });
});
