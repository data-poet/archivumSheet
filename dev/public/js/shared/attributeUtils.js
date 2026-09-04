// The two lookups below intentionally mirror two different engine calculations rather than
// a single shared "attribute base" definition: skills.js prefers base_value (unmodified),
// while spellsResolver.js always uses IQ's fully modified value.
const DEFAULT_ATTRIBUTE_VALUE = 10;

// Mirrors the attribute-base lookup in engine/character/js/skills/skills.js.
export function getSkillAttributeBase(state, attribute) {
  const attr = state.sheet?.character?.primary_attributes?.[attribute];
  return attr?.base_value ?? attr?.value ?? DEFAULT_ATTRIBUTE_VALUE;
}

// Mirrors the IQ lookup in engine/magic/js/spellsResolver.js.
export function getSpellAttributeBase(state) {
  const iq = state.sheet?.character?.primary_attributes?.IQ;
  return iq?.value ?? iq?.base_value ?? DEFAULT_ATTRIBUTE_VALUE;
}
