function assertBasePlusModifier(attr, baseKey = "base_value") {
  const base = attr[baseKey] ?? attr.base;
  const modifier = attr.modifier ?? 0;

  expect(attr.value).toBe(base + modifier);
}

module.exports = assertBasePlusModifier;
