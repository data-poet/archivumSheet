const { computeShieldBlock } = require("engine/inventory/js/shield/shieldBlock");
const {
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
} = require("engine/inventory/js/shield/shieldConstants");

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DX = 12;

// Pick one broquel shield and one non-broquel shield from the constants
const A_BROQUEL_SHIELD = "SHIELD-002";  // inside  BROQUEL_SHIELD_IDS
const AN_ESCUDO_SHIELD  = "SHIELD-007"; // outside BROQUEL_SHIELD_IDS

function skillsWithBoth(broquelValue, escudoValue) {
  return {
    [BROQUEL_SKILL_ID]: { value: broquelValue },
    [ESCUDO_SKILL_ID]:  { value: escudoValue  },
  };
}

function skillsOnlyBroquel(value) {
  return { [BROQUEL_SKILL_ID]: { value } };
}

function skillsOnlyEscudo(value) {
  return { [ESCUDO_SKILL_ID]: { value } };
}

// ─── BROQUEL_SHIELD_IDS sanity ────────────────────────────────────────────────

describe("BROQUEL_SHIELD_IDS", () => {
  test("should contain exactly SHIELD-000 through SHIELD-004", () => {
    expect([...BROQUEL_SHIELD_IDS]).toEqual(
      expect.arrayContaining(["SHIELD-000","SHIELD-001","SHIELD-002","SHIELD-003","SHIELD-004"]),
    );
    expect(BROQUEL_SHIELD_IDS.size).toBe(5);
  });

  test("should not contain SHIELD-005 or higher", () => {
    expect(BROQUEL_SHIELD_IDS.has("SHIELD-005")).toBe(false);
    expect(BROQUEL_SHIELD_IDS.has(AN_ESCUDO_SHIELD)).toBe(false);
  });
});

// ─── Both skills present ──────────────────────────────────────────────────────

describe("computeShieldBlock — both skills present", () => {
  test("broquel shield uses SKILL-045 → floor(value/2)+3", () => {
    // value 14 → floor(7)+3 = 10
    const result = computeShieldBlock(A_BROQUEL_SHIELD, skillsWithBoth(14, 12), DX);
    expect(result).toBe(10);
  });

  test("escudo shield uses SKILL-082 → floor(value/2)+3", () => {
    // value 12 → floor(6)+3 = 9
    const result = computeShieldBlock(AN_ESCUDO_SHIELD, skillsWithBoth(14, 12), DX);
    expect(result).toBe(9);
  });

  test("floor is applied for odd skill values", () => {
    // value 15 → floor(7.5)+3 = floor(7)+3 = 10
    const result = computeShieldBlock(A_BROQUEL_SHIELD, skillsWithBoth(15, 10), DX);
    expect(result).toBe(10);
  });
});

// ─── Only the cross-skill present ────────────────────────────────────────────

describe("computeShieldBlock — cross-skill penalty", () => {
  test("broquel shield with only SKILL-082 → floor(value/2)+1", () => {
    // value 14 → floor(7)+1 = 8
    const result = computeShieldBlock(A_BROQUEL_SHIELD, skillsOnlyEscudo(14), DX);
    expect(result).toBe(8);
  });

  test("escudo shield with only SKILL-045 → floor(value/2)+1", () => {
    // value 12 → floor(6)+1 = 7
    const result = computeShieldBlock(AN_ESCUDO_SHIELD, skillsOnlyBroquel(12), DX);
    expect(result).toBe(7);
  });

  test("floor is applied for odd cross-skill values", () => {
    // value 15 → floor(7.5)+1 = floor(7)+1 = 8
    const result = computeShieldBlock(A_BROQUEL_SHIELD, skillsOnlyEscudo(15), DX);
    expect(result).toBe(8);
  });
});

// ─── No shield skill ─────────────────────────────────────────────────────────

describe("computeShieldBlock — no shield skill", () => {
  test("broquel shield with no skill → DX - 4", () => {
    const result = computeShieldBlock(A_BROQUEL_SHIELD, {}, DX);
    expect(result).toBe(DX - 4);
  });

  test("escudo shield with no skill → DX - 4", () => {
    const result = computeShieldBlock(AN_ESCUDO_SHIELD, {}, DX);
    expect(result).toBe(DX - 4);
  });

  test("empty skills map produces DX - 4", () => {
    expect(computeShieldBlock(A_BROQUEL_SHIELD, {}, 10)).toBe(6);
    expect(computeShieldBlock(AN_ESCUDO_SHIELD, {}, 8)).toBe(4);
  });

  test("undefined skills defaults to DX - 4", () => {
    const result = computeShieldBlock(A_BROQUEL_SHIELD, undefined, DX);
    expect(result).toBe(DX - 4);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("computeShieldBlock — edge cases", () => {
  test("skill value 0 with matching skill → floor(0)+3 = 3", () => {
    const result = computeShieldBlock(A_BROQUEL_SHIELD, skillsOnlyBroquel(0), DX);
    expect(result).toBe(3);
  });

  test("all SHIELD-000 through SHIELD-004 use SKILL-045", () => {
    const skills = skillsOnlyBroquel(10); // floor(5)+3 = 8
    for (const id of ["SHIELD-000","SHIELD-001","SHIELD-002","SHIELD-003","SHIELD-004"]) {
      expect(computeShieldBlock(id, skills, DX)).toBe(8);
    }
  });

  test("returns a number in all branches", () => {
    expect(typeof computeShieldBlock(A_BROQUEL_SHIELD, skillsWithBoth(12, 12), DX)).toBe("number");
    expect(typeof computeShieldBlock(A_BROQUEL_SHIELD, skillsOnlyEscudo(12),   DX)).toBe("number");
    expect(typeof computeShieldBlock(A_BROQUEL_SHIELD, {},                      DX)).toBe("number");
  });
});
