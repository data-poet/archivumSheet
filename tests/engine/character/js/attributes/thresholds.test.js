const {
  computeThresholds,
} = require("engine/character/js/attributes/thresholds");

const HT = {
  base_value: 11,
  race_modifier: 1,
  modifier: 3,
  enchantment_modifier: 2,
};
const vital = (natural, value = natural) => ({
  final_base_value: natural,
  value,
});

describe("computeThresholds", () => {
  test("uses natural HT (base + race), ignoring modifiers and enchantments", () => {
    const t = computeThresholds({ HT, HP: vital(32), FP: vital(12) });
    expect(t.ht).toBe(12);
    expect(t.hp).toMatchObject({
      death_checks_from: -12,
      death_check_step: 12,
      death_at: -60,
      destroyed_at: -120,
    });
  });

  test("wound thresholds come from natural PV", () => {
    const t = computeThresholds({ HT, HP: vital(32, 5), FP: vital(12) });
    expect(t.hp.major_wound_over).toBe(16);
    expect(t.hp.head_stun_over).toBeCloseTo(10.67, 2);
    expect(t.hp.reeling_below).toBeCloseTo(10.67, 2);
    expect(t.fp.exhausted_below).toBe(4);
    expect(t.fp.unconscious_at).toBe(-12);
  });

  test("lists the four death-check values and the next one to roll", () => {
    const fresh = computeThresholds({ HT, HP: vital(32, -5), FP: vital(12) });
    expect(fresh.hp.death_check_values).toEqual([-12, -24, -36, -48]);
    expect(fresh.hp.next_death_check).toBe(-12);

    const deep = computeThresholds({ HT, HP: vital(32, -30), FP: vital(12) });
    expect(deep.hp.next_death_check).toBe(-36);

    const lastDoor = computeThresholds({
      HT,
      HP: vital(32, -50),
      FP: vital(12),
    });
    expect(lastDoor.hp.death_checks).toBe(4);
    expect(lastDoor.hp.next_death_check).toBeNull();
  });

  test.each([
    [32, "ok", 0],
    [10, "reeling", 0],
    [0, "collapsing", 0],
    [-12, "dying", 1],
    [-35, "dying", 2],
    [-60, "dead", 5],
    [-120, "destroyed", 10],
  ])("PV %i → %s with %i death checks", (value, state, checks) => {
    const t = computeThresholds({ HT, HP: vital(32, value), FP: vital(12) });
    expect(t.hp.state).toBe(state);
    expect(t.hp.death_checks).toBe(checks);
  });

  test.each([
    [12, "ok"],
    [3, "exhausted"],
    [0, "collapsing"],
    [-12, "unconscious"],
  ])("PF %i → %s", (value, state) => {
    const t = computeThresholds({ HT, HP: vital(32), FP: vital(12, value) });
    expect(t.fp.state).toBe(state);
  });
});
