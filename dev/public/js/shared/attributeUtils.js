// attributeUtils.js
//
// Shared helper for defaulting a newly added skill or spell's base_value to
// the character's corresponding primary attribute, so a brand new entry
// starts at relative level 0 instead of an arbitrary flat number.
//
// Reads from state.sheet (engine output) rather than state.selected (raw
// input) — the engine is the single source of truth for computed attribute
// values.
//
// NOTE: the two lookups below intentionally mirror two different engine
// calculations rather than a single shared definition of "attribute base":
//   - engine/character/js/skills/skills.js prefers the attribute's
//     base_value (unmodified score) over its fully modified value.
//   - engine/magic/js/spellsResolver.js (via buildSheet.js) always uses
//     IQ's fully modified value (race + manual modifiers included).
// Matching each engine calculation exactly means the UI default always
// lines up with what the engine will compute as attribute_base once the
// sheet re-runs, even though the two differ from each other.

const DEFAULT_ATTRIBUTE_VALUE = 10;

/**
 * Mirrors the attribute-base lookup used by engine/character/js/skills/skills.js
 * for a given primary attribute (ST, DX, IQ, HT).
 */
export function getSkillAttributeBase(state, attribute) {
  const attr = state.sheet?.character?.primary_attributes?.[attribute];
  return attr?.base_value ?? attr?.value ?? DEFAULT_ATTRIBUTE_VALUE;
}

/**
 * Mirrors the IQ lookup used by engine/magic/js/spellsResolver.js
 * (via the `iq` field buildSheet.js attaches to the character before
 * spell resolution).
 */
export function getSpellAttributeBase(state) {
  const iq = state.sheet?.character?.primary_attributes?.IQ;
  return iq?.value ?? iq?.base_value ?? DEFAULT_ATTRIBUTE_VALUE;
}
