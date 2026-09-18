function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Values are signed at the validation layer (fortify/add positive, weaken/remove negative), so a plain sum is the net modifier.
function sumEnchantmentValues(enchantments, types) {
  return enchantments
    .filter((entry) => types.includes(entry.enchantment_effect_type))
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
}

function sumEnchantmentValuesByTarget(enchantments, types, target) {
  return enchantments
    .filter(
      (entry) =>
        types.includes(entry.enchantment_effect_type) &&
        entry.target === target,
    )
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
}

module.exports = {
  round2,
  sumEnchantmentValues,
  sumEnchantmentValuesByTarget,
};
