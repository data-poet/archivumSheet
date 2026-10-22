const { loadDataset } = require("helpers/datasets.js");
const {
  DAMAGE_TYPES,
  MASTER_ELIGIBLE_CATEGORIES,
  ATTRIBUTE_TARGET_MAP,
} = require("helpers/taxonomy.js");

describe("taxonomy registry resolves against the real datasets", () => {
  // pi-, pi, pi+ and pi++ aren't assigned to any melee weapon row — thrusting weapons use the
  // more precise "imp" (impaling) type instead; piercing only appears on firearms in this dataset.
  test.each([
    DAMAGE_TYPES.CRUSHING,
    DAMAGE_TYPES.CUTTING,
    DAMAGE_TYPES.IMPALING,
  ])(
    "damage type %s appears in the melee weapon_damage_type column",
    (damageType) => {
      const rows = loadDataset("MELEE_WEAPONS");
      const found = rows.some((row) =>
        String(row.weapon_damage_type).includes(damageType),
      );
      expect(found).toBe(true);
    },
  );

  test.each([...MASTER_ELIGIBLE_CATEGORIES])(
    "skill category %s appears in the skills dataset",
    (category) => {
      const rows = loadDataset("SKILLS");
      const found = rows.some((row) => row.skill_category === category);
      expect(found).toBe(true);
    },
  );

  test.each(Object.keys(ATTRIBUTE_TARGET_MAP))(
    "attribute target %s appears as an enchantment_target in ENCHANTMENTS",
    (target) => {
      const rows = loadDataset("ENCHANTMENTS");
      const found = rows.some((row) => row.enchantment_target === target);
      expect(found).toBe(true);
    },
  );
});
