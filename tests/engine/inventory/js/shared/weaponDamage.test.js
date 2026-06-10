const {
  computeWeaponDamage,
  formatDamageString,
} = require("engine/inventory/js/shared/weaponDamage");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

// ─── formatDamageString ───────────────────────────────────────────────────────

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

// ─── computeWeaponDamage — guard clauses ─────────────────────────────────────

describe("computeWeaponDamage — guard clauses", () => {
  test("returns empty object when base_damage is null", () => {
    expect(computeWeaponDamage("Perfuração", 1, null, null)).toEqual({});
  });

  test("returns empty object when base_damage is undefined", () => {
    expect(computeWeaponDamage("Perfuração", 1, null, undefined)).toEqual({});
  });

  test("returns empty object when weapon_damage_type is null", () => {
    expect(computeWeaponDamage(null, 1, 1, BASE_DAMAGE_ST10)).toEqual({});
  });

  test("returns empty object when weapon_damage_type is undefined", () => {
    expect(computeWeaponDamage(undefined, 1, 1, BASE_DAMAGE_ST10)).toEqual({});
  });

  test("returns empty object when damage type has no matching substring", () => {
    expect(computeWeaponDamage("Outro", 1, 1, BASE_DAMAGE_ST10)).toEqual({});
  });
});

// ─── computeWeaponDamage — Perfuração only ───────────────────────────────────

describe("computeWeaponDamage — Perfuração", () => {
  test("computes weapon_gdp_damage only for Perfuração type", () => {
    // GDP.final_modifier -2 + weapon_gdp_modifier +1 = -1 → "1d6-1"
    const result = computeWeaponDamage("Perfuração", 1, null, BASE_DAMAGE_ST10);

    expect(result).toEqual({ weapon_gdp_damage: "1d6-1" });
    expect(result.weapon_bal_damage).toBeUndefined();
  });

  test("zero sum → 1d6+0", () => {
    // GDP.final_modifier -2 + weapon_gdp_modifier +2 = 0
    const result = computeWeaponDamage("Perfuração", 2, null, BASE_DAMAGE_ST10);

    expect(result.weapon_gdp_damage).toBe("1d6+0");
  });

  test("positive sum → plus sign", () => {
    // GDP.final_modifier +1 + weapon_gdp_modifier +3 = +4
    const result = computeWeaponDamage("Perfuração", 3, null, BASE_DAMAGE_ST15);

    expect(result.weapon_gdp_damage).toBe("1d6+4");
  });

  test("weapon_gdp_modifier = 0 works correctly", () => {
    // GDP.final_modifier -2 + 0 = -2
    const result = computeWeaponDamage("Perfuração", 0, null, BASE_DAMAGE_ST10);

    expect(result.weapon_gdp_damage).toBe("1d6-2");
  });

  test("omits weapon_gdp_damage when GDP key is missing from base_damage", () => {
    const baseDamageNoGDP = { BAL: BASE_DAMAGE_ST10.BAL };

    const result = computeWeaponDamage("Perfuração", 1, null, baseDamageNoGDP);

    expect(result.weapon_gdp_damage).toBeUndefined();
  });
});

// ─── computeWeaponDamage — Corte ─────────────────────────────────────────────

describe("computeWeaponDamage — Corte", () => {
  test("computes weapon_bal_damage only for Corte type", () => {
    // BAL.final_modifier 0 + weapon_bal_modifier +3 = +3 → "1d6+3"
    const result = computeWeaponDamage("Corte", null, 3, BASE_DAMAGE_ST10);

    expect(result).toEqual({ weapon_bal_damage: "1d6+3" });
    expect(result.weapon_gdp_damage).toBeUndefined();
  });

  test("zero sum → 1d6+0", () => {
    // BAL.final_modifier 0 + weapon_bal_modifier 0 = 0
    const result = computeWeaponDamage("Corte", null, 0, BASE_DAMAGE_ST10);

    expect(result.weapon_bal_damage).toBe("1d6+0");
  });

  test("negative sum from base modifier", () => {
    // Override: BAL.final_modifier -1 + weapon_bal_modifier +0 = -1
    const baseDamageNeg = {
      GDP: BASE_DAMAGE_ST10.GDP,
      BAL: { dice: "1d6", base_modifier: -1, modifier: 0, final_modifier: -1 },
    };

    const result = computeWeaponDamage("Corte", null, 0, baseDamageNeg);

    expect(result.weapon_bal_damage).toBe("1d6-1");
  });

  test("omits weapon_bal_damage when weapon_bal_modifier is null", () => {
    // Ranged weapons have no bal_modifier
    const result = computeWeaponDamage("Corte", 0, null, BASE_DAMAGE_ST10);

    expect(result.weapon_bal_damage).toBeUndefined();
  });

  test("omits weapon_bal_damage when weapon_bal_modifier is undefined", () => {
    const result = computeWeaponDamage("Corte", 0, undefined, BASE_DAMAGE_ST10);

    expect(result.weapon_bal_damage).toBeUndefined();
  });

  test("omits weapon_bal_damage when BAL key is missing from base_damage", () => {
    const baseDamageNoBAL = { GDP: BASE_DAMAGE_ST10.GDP };

    const result = computeWeaponDamage("Corte", null, 2, baseDamageNoBAL);

    expect(result.weapon_bal_damage).toBeUndefined();
  });
});

// ─── computeWeaponDamage — Contusão ──────────────────────────────────────────

describe("computeWeaponDamage — Contusão", () => {
  test("computes weapon_bal_damage for Contusão type", () => {
    // BAL.final_modifier 0 + weapon_bal_modifier +1 = +1
    const result = computeWeaponDamage("Contusão", null, 1, BASE_DAMAGE_ST10);

    expect(result).toEqual({ weapon_bal_damage: "1d6+1" });
  });
});

// ─── computeWeaponDamage — both fields ───────────────────────────────────────

describe("computeWeaponDamage — both Perfuração and Corte", () => {
  test("computes both fields when type contains Perfuração and Corte", () => {
    // GDP: -2 + 1 = -1 → "1d6-1"
    // BAL:  0 + 3 =  3 → "1d6+3"
    const result = computeWeaponDamage(
      "Corte, Perfuração",
      1,
      3,
      BASE_DAMAGE_ST10,
    );

    expect(result).toEqual({
      weapon_gdp_damage: "1d6-1",
      weapon_bal_damage: "1d6+3",
    });
  });

  test("computes both fields when type contains Perfuração and Contusão", () => {
    // GDP: +1 + 2 = +3 → "1d6+3"
    // BAL: +2 + 1 = +3 → "1d6+3"
    const result = computeWeaponDamage(
      "Perfuração, Contusão",
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
      "Corte, Perfuração",
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
    // bal_modifier absent (e.g. ranged-style record with Corte somehow)
    const result = computeWeaponDamage(
      "Corte, Perfuração",
      1,
      null,
      BASE_DAMAGE_ST10,
    );

    expect(result).toEqual({ weapon_gdp_damage: "1d6-1" });
    expect(result.weapon_bal_damage).toBeUndefined();
  });
});

// ─── computeWeaponDamage — return type ───────────────────────────────────────

describe("computeWeaponDamage — return types", () => {
  test("returned damage values are always strings", () => {
    const result = computeWeaponDamage(
      "Corte, Perfuração",
      1,
      2,
      BASE_DAMAGE_ST10,
    );

    expect(typeof result.weapon_gdp_damage).toBe("string");
    expect(typeof result.weapon_bal_damage).toBe("string");
  });
});
