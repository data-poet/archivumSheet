const { loadDataset } = require("helpers/datasets.js");
const { ATTRIBUTE_TARGET_MAP } = require("helpers/taxonomy.js");
const { PRIMARY_KEYS, SECONDARY_PURCHASE } = require("helpers/rules.js");

// An attribute enchantment aimed at an unknown key is summed and then ignored, so it would silently do nothing.
test("every attribute enchantment targets an attribute the engine builds", () => {
  const known = new Set([...PRIMARY_KEYS, ...Object.keys(SECONDARY_PURCHASE)]);
  const targets = loadDataset("ENCHANTMENTS")
    .filter((row) =>
      ["fortify_attribute", "weaken_attribute"].includes(
        row.enchantment_effect_type,
      ),
    )
    .map(
      (row) =>
        ATTRIBUTE_TARGET_MAP[row.enchantment_target] || row.enchantment_target,
    );

  expect(targets.length).toBeGreaterThan(0);
  targets.forEach((target) => expect(known).toContain(target));
});
