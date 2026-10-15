const {
  shieldSkillId,
  blockFromLevel,
} = require("engine/inventory/js/shield/shieldBlock");

describe("shieldSkillId", () => {
  test.each([
    "SHIELD-000",
    "SHIELD-001",
    "SHIELD-002",
    "SHIELD-003",
    "SHIELD-004",
  ])("%s uses Broquel (SKILL-045)", (id) => {
    expect(shieldSkillId(id)).toBe("SKILL-045");
  });

  test("any other shield uses Escudo (SKILL-082)", () => {
    expect(shieldSkillId("SHIELD-010")).toBe("SKILL-082");
  });
});

describe("blockFromLevel (4e)", () => {
  test.each([
    [12, false, 9],
    [13, false, 9],
    [8, false, 7],
    [12, true, 10],
  ])("NH %i (Reflexos %s) → Block %i", (level, reflexos, block) => {
    expect(blockFromLevel(level, reflexos)).toBe(block);
  });

  test("no level means no block", () => {
    expect(blockFromLevel(null)).toBeNull();
  });
});
