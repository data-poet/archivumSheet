const { round2 } = require("./enchantmentMath.js");

// Material-less items keep their base stat; material items add or multiply by the matching material field.
function applyMaterialModifiers(item, material, prefix, fields) {
  const result = {};

  for (const { key, materialField, mode } of fields) {
    const base = item[`${prefix}_${key}`];

    if (!material) {
      result[`${prefix}_final_${key}`] = round2(base);
      continue;
    }

    const value = Number(material[materialField] || (mode === "add" ? 0 : 1));

    result[`${prefix}_final_${key}`] = round2(
      mode === "add" ? base + value : base * value,
    );
  }

  return result;
}

function resolveCustomFields(instance, prefix) {
  return {
    [`${prefix}_custom_name`]: instance[`${prefix}_custom_name`]?.trim() || null,
    [`${prefix}_custom_description`]:
      instance[`${prefix}_custom_description`]?.trim() || null,
    [`${prefix}_custom_effect`]:
      instance[`${prefix}_custom_effect`]?.trim() || null,
  };
}

// Shared tail for every equippable resolver: hit points/weight/value derived from finalStats plus enchantments, then custom fields and placement.
function resolveCommonEquippableTail(
  instance,
  finalStats,
  { prefix, enchantments_total_price, enchantment_weight_modifier },
) {
  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  return {
    hit_points_modifier: hitPointsModifier,
    final_hit_points: round2(
      finalStats[`${prefix}_final_hit_points`] + hitPointsModifier,
    ),
    final_weight: round2(
      finalStats[`${prefix}_final_weight`] * (1 + enchantment_weight_modifier),
    ),
    total_value: round2(
      finalStats[`${prefix}_final_price`] + enchantments_total_price,
    ),

    ...resolveCustomFields(instance, prefix),

    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
    id: instance.id ?? null,
  };
}

module.exports = {
  applyMaterialModifiers,
  resolveCustomFields,
  resolveCommonEquippableTail,
};
