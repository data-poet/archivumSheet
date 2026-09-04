import { state } from "../../../../state.js";
import {
  fetchEnchantments,
  fetchEnchantmentEffectTypes,
  fetchItemCategories,
} from "../../../../api.js";
import { nextEnchantmentInstanceId } from "../../../../store/instanceId.js";
import {
  decimalToPercent,
  percentToDecimal,
} from "../../../../components/resistances.js";

const data = state.data;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadEnchantments() {
  const [enchantments, effectTypes, itemCategories] = await Promise.all([
    fetchEnchantments(),
    fetchEnchantmentEffectTypes(),
    fetchItemCategories(),
  ]);

  data.enchantments = enchantments;
  data.enchantmentEffectTypes = effectTypes;
  data.itemCategories = itemCategories;
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM CATEGORIES
//
// Read straight from data.itemCategories, fetched from
// /api/inventory/item-categories at bootstrap (see loadEnchantments above)
// — which itself serves each equipment type's own
// ACCESSORY_ITEM_CATEGORY/MAGIC_GEAR_ITEM_CATEGORY validation constant
// directly, not a hand-copied mirror of it.
// ─────────────────────────────────────────────────────────────────────────────

export function getAccessoryItemCategory() {
  return data.itemCategories.ACCESSORY;
}

export function getMagicGearItemCategory() {
  return data.itemCategories.MAGIC_GEAR;
}

export function getShieldItemCategory() {
  return data.itemCategories.SHIELD;
}

export function getMeleeItemCategory() {
  return data.itemCategories.MELEE;
}

export function getRangedItemCategory() {
  return data.itemCategories.RANGED;
}

export function getFirearmsItemCategory() {
  return data.itemCategories.FIREARMS;
}

// ─────────────────────────────────────────────────────────────────────────────
// EFFECT TYPE GROUPS
//
// Read straight from data.enchantmentEffectTypes, fetched from
// /api/enchantments/effect-types at bootstrap (see loadEnchantments above) —
// which itself serves engine/inventory/js/shared/enchantmentsConstants.js
// directly. This is the SAME object the engine prices/validates against,
// not a hand-copied mirror of it.
// ─────────────────────────────────────────────────────────────────────────────

export function isAttributeType(effectType) {
  return data.enchantmentEffectTypes.ATTRIBUTE_EFFECT_TYPES.includes(
    effectType,
  );
}

/**
 * Any effect type whose application entry carries a magnitude `value` —
 * attribute, weight, damage-resistance, and elemental-resistance (Phase 2/
 * armor). All four share the same value-stepper UI, gated further by
 * isPercentageType below for the two that carry decimal fractions instead
 * of whole numbers. See VALUE_EFFECT_TYPES in enchantmentsConstants.js.
 */
export function isValueType(effectType) {
  return data.enchantmentEffectTypes.VALUE_EFFECT_TYPES.includes(effectType);
}

export function isElementalResistanceType(effectType) {
  return data.enchantmentEffectTypes.ELEMENTAL_RESISTANCE_EFFECT_TYPES.includes(
    effectType,
  );
}

/**
 * Whether an enchantment's `value` is a decimal fraction (0.05 = 5%)
 * rather than a whole number — true for weight and elemental-resistance
 * types (see enchantmentsConstants.js's WEIGHT_EFFECT_TYPES/
 * ELEMENTAL_RESISTANCE_EFFECT_TYPES), false for attribute/
 * damage-resistance.
 *
 * Reads the RAW catalog record (data.enchantments, unparsed CSV — see
 * getEnchantmentRecord below), so this checks the CSV's own typo'd column
 * name directly rather than the engine's cleaned-up
 * enchantment_is_percentage field; contained to this one function so nothing
 * else needs to know about it.
 */
export function isPercentageType(record) {
  return record?.enenchantment_is_percentage === "TRUE";
}

export function isAdvantageType(effectType) {
  return effectType === "advantage";
}

export function isDisadvantageType(effectType) {
  return effectType === "disadvantage";
}

export function isPointType(effectType) {
  return data.enchantmentEffectTypes.POINT_EFFECT_TYPES.includes(effectType);
}

export function isSkillType(effectType) {
  return data.enchantmentEffectTypes.SKILL_EFFECT_TYPES.includes(effectType);
}

export function isSpellType(effectType) {
  return data.enchantmentEffectTypes.SPELL_EFFECT_TYPES.includes(effectType);
}

export function isFortifyType(effectType) {
  return data.enchantmentEffectTypes.FORTIFY_EFFECT_TYPES.includes(effectType);
}

export function isWeakenType(effectType) {
  return data.enchantmentEffectTypes.WEAKEN_EFFECT_TYPES.includes(effectType);
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
 *
 * @param {string} [typeFilter] - optional enchantment_type ("Fortificar
 *   Atributo", "Peculiaridade", "Perícia", "Feitiço", ...) to narrow the
 *   result further. Omitted/empty means no narrowing.
 */
export function getAllowedEnchantments(itemCategory, typeFilter) {
  const allowed = data.enchantments.filter((e) =>
    (e.enchantment_allowed_itens || "")
      .split(",")
      .map((s) => s.trim())
      .includes(itemCategory),
  );

  return typeFilter
    ? allowed.filter((e) => e.enchantment_type === typeFilter)
    : allowed;
}

/**
 * Unique enchantment_type values among the enchantments allowed on a given
 * item category — powers the "Categoria" filter that narrows the
 * "Tipo de Encantamento" select before it lists individual enchantments.
 * Same alphabetical-sort convention as the target picker's own filter
 * value lists (advantage_type, skill_category, spell_school).
 */
export function getEnchantmentTypeValues(itemCategory) {
  const allowed = getAllowedEnchantments(itemCategory);
  return [
    ...new Set(allowed.map((e) => e.enchantment_type).filter(Boolean)),
  ].sort();
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

/**
 * Which enchantment_type ("Categoria") is currently chosen to narrow the
 * "Tipo de Encantamento" select itself — one level upstream of
 * _addFormSelection. Same per-instance tracking pattern.
 */
const _addFormTypeFilter = new Map();

export function setEnchantmentAddFormSelection(instanceId, enchantmentId) {
  _addFormSelection.set(instanceId, enchantmentId);
  // A different enchantment type means a different target domain entirely
  // (e.g. switching from "Adicionar Vantagem" to "Fortificar Perícia") —
  // any category/type/school filter chosen for the previous domain no
  // longer applies.
  _addFormTargetFilter.delete(instanceId);
}

/**
 * Generic getter behind getEnchantmentAddFormSelection — takes an explicit
 * fallback instead of assuming "first allowed enchantment", since an edit
 * form (swapping an existing entry) should default to that entry's OWN
 * current enchantment_id, not the first one in the catalog.
 */
export function getEnchantmentFormSelection(formKey, fallbackId) {
  return _addFormSelection.get(formKey) || fallbackId;
}

/**
 * Resolves the enchantment_id to show as selected in a "Tipo de
 * Encantamento" select — shared by the add-form (no preferred id) and the
 * edit-form (preferred id = the entry's current enchantment_id). Falls
 * back to the first enchantment in the (possibly category-filtered) list
 * whenever the preferred id isn't in it — e.g. right after the Categoria
 * filter changes and excludes the previously chosen enchantment.
 */
function _resolveFormSelectionId(formKey, itemCategory, preferredId) {
  const typeFilter = getEnchantmentAddFormTypeFilter(formKey);
  const allowed = getAllowedEnchantments(itemCategory, typeFilter);
  const inFilteredList =
    preferredId && allowed.some((e) => e.enchantment_id === preferredId);

  return getEnchantmentFormSelection(
    formKey,
    inFilteredList ? preferredId : allowed[0]?.enchantment_id || null,
  );
}

export function getEnchantmentAddFormSelection(instanceId, itemCategory) {
  return _resolveFormSelectionId(instanceId, itemCategory, null);
}

/**
 * Same resolution as getEnchantmentAddFormSelection, but for an existing
 * entry's edit/swap form, preferring the entry's own current
 * enchantment_id over "first in list".
 */
export function getEnchantmentEditFormSelection(
  formKey,
  itemCategory,
  currentEnchantmentId,
) {
  return _resolveFormSelectionId(formKey, itemCategory, currentEnchantmentId);
}

export function clearEnchantmentAddFormSelection(instanceId) {
  _addFormSelection.delete(instanceId);
  _addFormTargetFilter.delete(instanceId);
  _addFormTypeFilter.delete(instanceId);
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

export function setEnchantmentAddFormTypeFilter(instanceId, filterValue) {
  // A different category changes which enchantments are even selectable —
  // any enchantment_id (and its own downstream target filter) chosen under
  // the previous category no longer applies. Clear BEFORE setting the new
  // filter value below, since clearEnchantmentAddFormSelection also wipes
  // _addFormTypeFilter.
  clearEnchantmentAddFormSelection(instanceId);

  if (filterValue) {
    _addFormTypeFilter.set(instanceId, filterValue);
  }
}

export function getEnchantmentAddFormTypeFilter(instanceId) {
  return _addFormTypeFilter.get(instanceId) || "";
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
 * Builds the type-specific fields (value / target / extraPoints) for an
 * enchantment application, shared by both adding a new entry and swapping
 * an existing one so the two can never drift out of sync.
 *
 * `params.value` always arrives as a plain integer regardless of type —
 * the DOM stepper itself displays/steps in PERCENT units for
 * percentage-flagged enchantments (see valueInput in render.js), so
 * dispatch.js's parseInt never has to deal with a fraction. Converting
 * that percent-integer down to the decimal fraction the engine expects
 * (0.05, not 5) happens right here, the one place both the add-form and
 * the edit-form funnel through.
 */
function _buildEntryFields(record, params = {}) {
  const type = record.enchantment_effect_type;
  const weaken = isWeakenType(type);
  const fields = {};

  if (isValueType(type)) {
    const percentage = isPercentageType(record);
    const rawDefault = weaken
      ? -record.enchantment_base_value
      : record.enchantment_base_value;
    const displayDefault = percentage
      ? decimalToPercent(rawDefault)
      : rawDefault;
    const displayValue = Number(params.value ?? displayDefault);

    fields.value = percentage ? percentToDecimal(displayValue) : displayValue;
  } else if (isPointType(type)) {
    fields.target = params.target ?? null;
  } else if (isSkillType(type) || isSpellType(type)) {
    fields.target = params.target ?? null;
    const isFortify = isFortifyType(type);
    const defaultExtraPoints = isFortify ? 1 : weaken ? -1 : 0;
    fields.extraPoints = Number(params.extraPoints ?? defaultExtraPoints);
  }

  return fields;
}

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
    ..._buildEntryFields(record, params),
  };

  entries.push(entry);
  return entry;
}

/**
 * Replaces an existing entry's enchantment_id + fields in place, keeping
 * its own _instanceId — used to "swap" an attached enchantment for a
 * different one (or just change its target/value/extraPoints) without
 * losing its position in the list or its price-lookup identity mid-render.
 * Returns the updated entry, or null if the entry or enchantment_id isn't
 * found.
 */
export function updateEnchantmentEntry(
  entries,
  entryInstanceId,
  enchantmentId,
  params = {},
) {
  const record = getEnchantmentRecord(enchantmentId);
  if (!record) return null;

  const index = entries.findIndex((e) => e._instanceId === entryInstanceId);
  if (index === -1) return null;

  const entry = {
    _instanceId: entryInstanceId,
    enchantment_id: enchantmentId,
    ..._buildEntryFields(record, params),
  };

  entries[index] = entry;
  return entry;
}

export function removeEnchantmentEntry(entries, entryInstanceId) {
  const index = entries.findIndex((e) => e._instanceId === entryInstanceId);
  if (index === -1) return;
  entries.splice(index, 1);
}
