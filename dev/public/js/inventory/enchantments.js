import { state } from "../state.js";
import { fetchEnchantments } from "../api.js";
import { nextEnchantmentInstanceId } from "../store/instanceId.js";

const data = state.data;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadEnchantments() {
  data.enchantments = await fetchEnchantments();
}

// ─────────────────────────────────────────────────────────────────────────────
// EFFECT TYPE GROUPS
//
// Mirrors engine/inventory/js/shared/enchantmentsConstants.js — kept in sync
// by hand since this is the browser side and can't require() the engine file.
// ─────────────────────────────────────────────────────────────────────────────

const ATTRIBUTE_EFFECT_TYPES = ["fortify_attribute", "weaken_attribute"];
const POINT_EFFECT_TYPES = ["advantage", "disadvantage"];
const SKILL_EFFECT_TYPES = ["skill", "fortify_skill", "weaken_skill"];
const SPELL_EFFECT_TYPES = ["spell", "fortify_spell", "weaken_spell"];

// Sign convention: fortify types are always a positive integer, weaken
// types always negative. Mirrors engine/inventory/js/shared/
// enchantmentsConstants.js's FORTIFY_EFFECT_TYPES/WEAKEN_EFFECT_TYPES.
const FORTIFY_EFFECT_TYPES = ["fortify_attribute", "fortify_skill", "fortify_spell"];
const WEAKEN_EFFECT_TYPES = ["weaken_attribute", "weaken_skill", "weaken_spell"];

export function isAttributeType(effectType) {
  return ATTRIBUTE_EFFECT_TYPES.includes(effectType);
}

export function isAdvantageType(effectType) {
  return effectType === "advantage";
}

export function isDisadvantageType(effectType) {
  return effectType === "disadvantage";
}

export function isPointType(effectType) {
  return POINT_EFFECT_TYPES.includes(effectType);
}

export function isSkillType(effectType) {
  return SKILL_EFFECT_TYPES.includes(effectType);
}

export function isSpellType(effectType) {
  return SPELL_EFFECT_TYPES.includes(effectType);
}

export function isFortifyType(effectType) {
  return FORTIFY_EFFECT_TYPES.includes(effectType);
}

export function isWeakenType(effectType) {
  return WEAKEN_EFFECT_TYPES.includes(effectType);
}

// ─────────────────────────────────────────────────────────────────────────────
// CATALOG LOOKUPS
// ─────────────────────────────────────────────────────────────────────────────

export function getEnchantmentRecord(enchantmentId) {
  return (
    data.enchantments.find((e) => e.enchantment_id === enchantmentId) || null
  );
}

/**
 * Enchantments allowed on a given item category ("Acessórios", "Cabeça",
 * "Pés", ... — matches SLOT_MAP's Portuguese keys). This is the raw
 * /api/enchantments row (unparsed CSV), so enchantment_allowed_itens is
 * still a comma string here, unlike the engine's own parsed DB.
 */
export function getAllowedEnchantments(itemCategory) {
  return data.enchantments.filter((e) =>
    (e.enchantment_allowed_itens || "")
      .split(",")
      .map((s) => s.trim())
      .includes(itemCategory),
  );
}

/**
 * Unique spell names, deduplicated across the 5 tier-rows every spell has
 * in data.spells — see engine/inventory/js/shared/enchantmentTargetsDB.js
 * for why spells are targeted by name, not spell_id.
 */
export function getUniqueSpellNames() {
  const seen = new Set();
  const names = [];

  for (const spell of data.spells) {
    if (!seen.has(spell.spell_name)) {
      seen.add(spell.spell_name);
      names.push(spell.spell_name);
    }
  }

  return names;
}

/**
 * Same dedup as getUniqueSpellNames, but keeps the full row (first
 * tier-row seen) — needed for the target picker's school filter and
 * spell_box_name display, which are identical across every tier of the
 * same spell.
 */
export function getUniqueSpellRows() {
  const seen = new Set();
  const rows = [];

  for (const spell of data.spells) {
    if (!seen.has(spell.spell_name)) {
      seen.add(spell.spell_name);
      rows.push(spell);
    }
  }

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTION
//
// Which enchantment_id (and, for target-typed enchantments, which target)
// is currently chosen in an item's not-yet-committed "add enchantment"
// mini-form. Tracked here (module-level, keyed by the item instance's
// _instanceId) rather than in each equipment type's own state, mirroring
// customFieldsBlock's open/close tracking in renderUtils.js — same reason:
// survives re-renders triggered by unrelated actions, stays generic for
// reuse by future equipment types.
// ─────────────────────────────────────────────────────────────────────────────

const _addFormSelection = new Map();

/**
 * Which type/category/school filter value is currently chosen in the
 * cascading target picker (advantage/disadvantage type, skill category,
 * spell school) — same per-instance tracking pattern as the enchantment_id
 * selection below, so it survives re-renders triggered by unrelated
 * actions elsewhere on the sheet.
 */
const _addFormTargetFilter = new Map();

export function setEnchantmentAddFormSelection(instanceId, enchantmentId) {
  _addFormSelection.set(instanceId, enchantmentId);
  // A different enchantment type means a different target domain entirely
  // (e.g. switching from "Adicionar Vantagem" to "Fortificar Perícia") —
  // any category/type/school filter chosen for the previous domain no
  // longer applies.
  _addFormTargetFilter.delete(instanceId);
}

export function getEnchantmentAddFormSelection(instanceId, itemCategory) {
  const selected = _addFormSelection.get(instanceId);
  if (selected) return selected;

  const allowed = getAllowedEnchantments(itemCategory);
  return allowed[0]?.enchantment_id || null;
}

export function clearEnchantmentAddFormSelection(instanceId) {
  _addFormSelection.delete(instanceId);
  _addFormTargetFilter.delete(instanceId);
}

export function setEnchantmentAddFormTargetFilter(instanceId, filterValue) {
  if (filterValue) {
    _addFormTargetFilter.set(instanceId, filterValue);
  } else {
    _addFormTargetFilter.delete(instanceId);
  }
}

export function getEnchantmentAddFormTargetFilter(instanceId) {
  return _addFormTargetFilter.get(instanceId) || "";
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY MUTATION
//
// Operates directly on an item instance's `enchantments` array — generic
// across equipment types. Each equipment type's own state module (e.g.
// inventory/accessories.js) wraps these with its own findByInstanceId +
// renderLists + triggerAutoRun, the same relationship customFieldsBlock has
// with saveAccessoryCustomFields.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Appends a new enchantment application entry, shaped according to the
 * enchantment's effect_type. Returns the new entry, or null if the
 * enchantment_id is unknown.
 */
export function addEnchantmentEntry(entries, enchantmentId, params = {}) {
  const record = getEnchantmentRecord(enchantmentId);
  if (!record) return null;

  const entry = {
    _instanceId: nextEnchantmentInstanceId(),
    enchantment_id: enchantmentId,
  };

  const type = record.enchantment_effect_type;
  const weaken = isWeakenType(type);

  if (isAttributeType(type)) {
    const defaultValue = weaken
      ? -record.enchantment_base_value
      : record.enchantment_base_value;
    entry.value = Number(params.value ?? defaultValue);
  } else if (isPointType(type)) {
    entry.target = params.target ?? null;
  } else if (isSkillType(type) || isSpellType(type)) {
    entry.target = params.target ?? null;
    const isFortify = isFortifyType(type);
    const defaultExtraPoints = isFortify ? 1 : weaken ? -1 : 0;
    entry.extraPoints = Number(params.extraPoints ?? defaultExtraPoints);
  }

  entries.push(entry);
  return entry;
}

export function removeEnchantmentEntry(entries, entryInstanceId) {
  const index = entries.findIndex((e) => e._instanceId === entryInstanceId);
  if (index === -1) return;
  entries.splice(index, 1);
}

export function updateEnchantmentEntryField(
  entries,
  entryInstanceId,
  field,
  value,
) {
  const entry = entries.find((e) => e._instanceId === entryInstanceId);
  if (!entry) return;
  entry[field] = value;
}
