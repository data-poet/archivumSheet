const { loadDataset } = require("helpers/datasets.js");
const {
  WILL_BONUS_TIERS,
  WILL_PENALTY_TIERS,
  HEARING_BONUS_TIERS,
  SMELL_BONUS_TIERS,
  VISION_BONUS_TIERS,
  FULL_SENSE_BONUS_TIERS,
  REFLEXOS_EM_COMBATE_ID,
  MAGIC_APTITUDE_TIERS,
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
  MAGIC_RETURN_ENCHANTMENT_ID,
  DUAL_USE_WEAPON_PAIRS,
} = require("helpers/ids.js");

// Guards against a dataset revamp silently dropping/renumbering an id this
// registry hardcodes — every id here must resolve to a real CSV row.
function idsOf(datasetKey, column) {
  return new Set(loadDataset(datasetKey).map((row) => row[column]));
}

describe("ids registry resolves against the real datasets", () => {
  const advantageIds = idsOf("ADVANTAGES", "advantage_id");
  const disadvantageIds = idsOf("DISADVANTAGES", "disadvantage_id");
  const skillIds = idsOf("SKILLS", "skill_id");
  const shieldIds = idsOf("SHIELDS", "shield_id");
  const enchantmentIds = idsOf("ENCHANTMENTS", "enchantment_id");
  const meleeIds = idsOf("MELEE_WEAPONS", "weapon_id");
  const rangedIds = idsOf("RANGED_WEAPONS", "weapon_id");

  test.each(Object.keys(WILL_BONUS_TIERS))(
    "WILL_BONUS_TIERS id %s exists in ADVANTAGES",
    (id) => {
      expect(advantageIds.has(id)).toBe(true);
    },
  );

  test.each(Object.keys(WILL_PENALTY_TIERS))(
    "WILL_PENALTY_TIERS id %s exists in DISADVANTAGES",
    (id) => {
      expect(disadvantageIds.has(id)).toBe(true);
    },
  );

  test.each(Object.keys(HEARING_BONUS_TIERS))(
    "HEARING_BONUS_TIERS id %s exists in ADVANTAGES",
    (id) => {
      expect(advantageIds.has(id)).toBe(true);
    },
  );

  test.each(Object.keys(SMELL_BONUS_TIERS))(
    "SMELL_BONUS_TIERS id %s exists in ADVANTAGES",
    (id) => {
      expect(advantageIds.has(id)).toBe(true);
    },
  );

  test.each(Object.keys(VISION_BONUS_TIERS))(
    "VISION_BONUS_TIERS id %s exists in ADVANTAGES",
    (id) => {
      expect(advantageIds.has(id)).toBe(true);
    },
  );

  test.each(Object.keys(FULL_SENSE_BONUS_TIERS))(
    "FULL_SENSE_BONUS_TIERS id %s exists in ADVANTAGES",
    (id) => {
      expect(advantageIds.has(id)).toBe(true);
    },
  );

  test("REFLEXOS_EM_COMBATE_ID exists in ADVANTAGES", () => {
    expect(advantageIds.has(REFLEXOS_EM_COMBATE_ID)).toBe(true);
  });

  test.each(Object.keys(MAGIC_APTITUDE_TIERS))(
    "MAGIC_APTITUDE_TIERS id %s exists in ADVANTAGES",
    (id) => {
      expect(advantageIds.has(id)).toBe(true);
    },
  );

  test("BROQUEL_SKILL_ID exists in SKILLS", () => {
    expect(skillIds.has(BROQUEL_SKILL_ID)).toBe(true);
  });

  test("ESCUDO_SKILL_ID exists in SKILLS", () => {
    expect(skillIds.has(ESCUDO_SKILL_ID)).toBe(true);
  });

  test.each([...BROQUEL_SHIELD_IDS])(
    "BROQUEL_SHIELD_IDS id %s exists in SHIELDS",
    (id) => {
      expect(shieldIds.has(id)).toBe(true);
    },
  );

  test("MAGIC_RETURN_ENCHANTMENT_ID is still the magic-return special effect", () => {
    const row = loadDataset("ENCHANTMENTS").find(
      (r) => r.enchantment_id === MAGIC_RETURN_ENCHANTMENT_ID,
    );
    expect(row.enchantment_effect_type).toBe("special_effect");
    expect(row.enchantment_name).toBe("Retorno Mágico");
  });

  test.each(DUAL_USE_WEAPON_PAIRS)(
    "dual-use pair [%s, %s] exists in both the melee and ranged datasets",
    (meleeId, rangedId) => {
      expect(meleeIds.has(meleeId)).toBe(true);
      expect(rangedIds.has(rangedId)).toBe(true);
    },
  );
});
