// has_enchantment_modifier is presence-based (item touches this key), not magnitude-based (nonzero sum).
function withEnchantmentModifier(base = {}, modifiers = {}, keys, extra) {
  const result = {};

  for (const key of keys) {
    result[key] = {
      ...(base[key] || {}),
      ...(extra ? extra(key) : {}),
      enchantment_modifier: modifiers[key] ?? 0,
      has_enchantment_modifier: key in modifiers,
    };
  }

  return result;
}

module.exports = {
  withEnchantmentModifier,
};
