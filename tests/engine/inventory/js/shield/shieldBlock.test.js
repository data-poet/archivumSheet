const {
  shieldSkillId,
  blockFromLevel,
} = require("engine/inventory/js/shield/shieldBlock");
const {
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
} = require("helpers/ids.js");

describe("shieldSkillId", () => {
  test.each([...BROQUEL_SHIELD_IDS])(
    `%s uses Broquel (${BROQUEL_SKILL_ID})`,
    (id) => {
      expect(shieldSkillId(id)).toBe(BROQUEL_SKILL_ID);
    },
  );

  test(`any other shield uses Escudo (${ESCUDO_SKILL_ID})`, () => {
    expect(shieldSkillId("SHIELD-010")).toBe(ESCUDO_SKILL_ID);
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
