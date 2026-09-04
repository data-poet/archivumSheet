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

// data.itemCategories serves each equipment type's own *_ITEM_CATEGORY validation constant directly, not a hand-copied mirror.
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

// data.enchantmentEffectTypes is the same object the engine prices/validates against, not a hand-copied mirror.
export function isAttributeType(effectType) {
  return data.enchantmentEffectTypes.ATTRIBUTE_EFFECT_TYPES.includes(
    effectType,
  );
}

// Types with a magnitude `value` (attribute/weight/damage-resistance/elemental-resistance); share one value-stepper UI, gated by isPercentageType below.
export function isValueType(effectType) {
  return data.enchantmentEffectTypes.VALUE_EFFECT_TYPES.includes(effectType);
}

export function isElementalResistanceType(effectType) {
  return data.enchantmentEffectTypes.ELEMENTAL_RESISTANCE_EFFECT_TYPES.includes(
    effectType,
  );
}

// Fixed target (BAL/GDP), baked into the DB row rather than player-picked.
export function isDamageType(effectType) {
  return data.enchantmentEffectTypes.DAMAGE_EFFECT_TYPES.includes(effectType);
}

// Fixed target (Min Strength/PREC/TR), same shape as isDamageType above.
export function isRequisiteType(effectType) {
  return data.enchantmentEffectTypes.REQUISITE_EFFECT_TYPES.includes(
    effectType,
  );
}

// Reads the raw catalog record (unparsed CSV), so checks the string "TRUE" rather than a parsed boolean.
export function isPercentageType(record) {
  return record?.enchantment_is_percentage === "TRUE";
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

export function getEnchantmentRecord(enchantmentId) {
  return (
    data.enchantments.find((e) => e.enchantment_id === enchantmentId) || null
  );
}

// enchantment_allowed_itens is still a raw comma string here (unparsed CSV row), unlike the engine's own parsed DB.
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

// Powers the "Categoria" filter that narrows "Tipo de Encantamento" before individual enchantments are listed.
export function getEnchantmentTypeValues(itemCategory) {
  const allowed = getAllowedEnchantments(itemCategory);
  return [
    ...new Set(allowed.map((e) => e.enchantment_type).filter(Boolean)),
  ].sort();
}

// Deduplicated across the 5 tier-rows every spell has in data.spells.
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

// Same dedup as getUniqueSpellNames, but keeps the full row for the target picker's school filter and display name.
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

// Tracked module-level, keyed by item instance _instanceId, so selections survive re-renders triggered by unrelated actions elsewhere on the sheet.
const _addFormSelection = new Map();

const _addFormTargetFilter = new Map();

const _addFormTypeFilter = new Map();

export function setEnchantmentAddFormSelection(instanceId, enchantmentId) {
  _addFormSelection.set(instanceId, enchantmentId);
  // A different enchantment type is a different target domain; any target filter chosen for the previous one no longer applies.
  _addFormTargetFilter.delete(instanceId);
}

// Takes an explicit fallback since an edit form should default to the entry's own current enchantment_id, not the first in the catalog.
export function getEnchantmentFormSelection(formKey, fallbackId) {
  return _addFormSelection.get(formKey) || fallbackId;
}

// Falls back to the first enchantment in the filtered list when preferredId isn't in it (e.g. after a Categoria change excludes it).
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
  // Must clear before setting below — clearEnchantmentAddFormSelection also wipes _addFormTypeFilter.
  clearEnchantmentAddFormSelection(instanceId);

  if (filterValue) {
    _addFormTypeFilter.set(instanceId, filterValue);
  }
}

export function getEnchantmentAddFormTypeFilter(instanceId) {
  return _addFormTypeFilter.get(instanceId) || "";
}

// Shared by add and swap so the two field-shaping paths can never drift out of sync.
// params.value always arrives as a plain integer (the DOM stepper steps in percent units); converted to the engine's decimal fraction (0.05, not 5) here.
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

// Keeps the entry's own _instanceId so its position and price-lookup identity survive a swap mid-render.
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
