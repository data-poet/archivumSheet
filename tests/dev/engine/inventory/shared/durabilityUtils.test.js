import {
  calcMaxHp,
  clampHpModifier,
  calcActualHp,
  resolveMaterial,
} from "dev/public/js/engine/inventory/shared/durabilityUtils.js";

describe("calcMaxHp", () => {
  test("multiplies base HP by the material's modifier", () => {
    expect(calcMaxHp(10, { material_hit_points_modifier: 2 })).toBe(20);
  });

  test("uses a modifier of 1 when material is null", () => {
    expect(calcMaxHp(10, null)).toBe(10);
  });

  test("uses a modifier of 1 when the material lacks the modifier field", () => {
    expect(calcMaxHp(10, {})).toBe(10);
  });

  test("coerces a non-numeric baseHp to 0", () => {
    expect(calcMaxHp("not a number", null)).toBe(0);
  });
});

describe("clampHpModifier", () => {
  test("treats an empty string as 0 (user is still typing)", () => {
    expect(clampHpModifier("", 10)).toBe(0);
  });

  test("treats a lone '-' as 0 (user is still typing a negative)", () => {
    expect(clampHpModifier("-", 10)).toBe(0);
  });

  test("treats a non-numeric value as 0", () => {
    expect(clampHpModifier("abc", 10)).toBe(0);
  });

  test("passes through a valid negative value within range", () => {
    expect(clampHpModifier("-4", 10)).toBe(-4);
  });

  test("clamps a value below -maxHp up to -maxHp", () => {
    expect(clampHpModifier("-99", 10)).toBe(-10);
  });

  test("clamps any positive value down to 0", () => {
    expect(clampHpModifier("5", 10)).toBe(0);
  });
});

describe("calcActualHp", () => {
  test("adds the modifier to maxHp", () => {
    expect(calcActualHp(20, -5)).toBe(15);
  });

  test("coerces a non-numeric modifier to 0", () => {
    expect(calcActualHp(20, "abc")).toBe(20);
  });
});

describe("resolveMaterial", () => {
  const materials = [
    { material_id: "MAT-001", material_name: "Aço" },
    { material_id: "MAT-002", material_name: "Mithril" },
  ];

  test("finds the material matching the instance's material_id", () => {
    expect(resolveMaterial({ material_id: "MAT-002" }, materials)).toBe(
      materials[1],
    );
  });

  test("returns null when the instance has no material_id", () => {
    expect(resolveMaterial({}, materials)).toBeNull();
  });

  test("returns null when the instance itself is null", () => {
    expect(resolveMaterial(null, materials)).toBeNull();
  });

  test("returns null when material_id doesn't match any material", () => {
    expect(resolveMaterial({ material_id: "GHOST" }, materials)).toBeNull();
  });
});
