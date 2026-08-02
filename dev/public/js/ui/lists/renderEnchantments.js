/**
 * renderEnchantments.js
 *
 * PILOT: reusable "attached enchantments" block for a single equipment
 * instance — mirrors customFieldsBlock's structure in renderUtils.js, but
 * lives in its OWN <details> expander rather than sharing "Personalizar",
 * since enchantments are a distinct concern (mechanical, DB-priced) from
 * free-text customization. Intended to be adopted by armor once Phase 2
 * starts — kept generic, not accessory-specific.
 *
 * Reads catalog/target data (data.enchantments, data.advantages,
 * data.disadvantages, data.skills, data.spells) directly — all loaded at
 * bootstrap alongside the equipment types that consume them.
 *
 * Computed price display comes from the engine's resolved output (sheet),
 * not recomputed here — the engine is the sole source of truth for
 * anything derived. Until the debounced engine run catches up after an
 * edit, price shows "—" rather than a stale or guessed number.
 */

import { t } from "../../localization/pt-BR.js";
import { state } from "../../state.js";
import { escapeHtml, escapeAttr } from "./renderUtils.js";
import {
  getAllowedEnchantments,
  getEnchantmentRecord,
  getEnchantmentAddFormSelection,
  getEnchantmentAddFormTargetFilter,
  getUniqueSpellRows,
  isAttributeType,
  isAdvantageType,
  isDisadvantageType,
  isSkillType,
  isSpellType,
  isFortifyType,
  isWeakenType,
} from "../../inventory/enchantments.js";

const data = state.data;

// Traits of this type only ever exist as race-innate grants and are never
// player-browsable — matches the RACIAL_TYPE exclusion already established
// in traits/advantages.js's own "add advantage" picker. A magic item
// shouldn't be able to grant a race-only trait either.
const RACIAL_TYPE = "Racial";

// ─────────────────────────────────────────────────────────────────────────────
// TARGET DISPLAY LOOKUPS
// ─────────────────────────────────────────────────────────────────────────────

function advantageName(id) {
  return (
    data.advantages.find((a) => a.advantage_id === id)?.advantage_name ?? id
  );
}

function disadvantageName(id) {
  return (
    data.disadvantages.find((d) => d.disadvantage_id === id)
      ?.disadvantage_name ?? id
  );
}

function skillName(id) {
  return data.skills.find((s) => s.skill_id === id)?.skill_name ?? id;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACHED ENCHANTMENTS LIST
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Looks up an entry's computed price from the engine's resolved output.
 * resolvedEntries is the `enchantments` array off the item's OWN resolved
 * record (already found by the caller via its usual resolvedX(sheet, id)
 * helper) — null/undefined until the first engine run completes.
 */
function resolvedPrice(resolvedEntries, entryInstanceId) {
  const resolved = resolvedEntries?.find(
    (r) => r._instanceId === entryInstanceId,
  );
  return resolved ? resolved.price : null;
}

function entryTargetLabel(record, entry) {
  const type = record.enchantment_effect_type;

  if (isAdvantageType(type)) return advantageName(entry.target);
  if (isDisadvantageType(type)) return disadvantageName(entry.target);
  if (isSkillType(type)) return skillName(entry.target);
  if (isSpellType(type)) return entry.target ?? "—";

  return null;
}

function entryMagnitudeLabel(record, entry) {
  const type = record.enchantment_effect_type;

  if (isAttributeType(type)) {
    return entry.value > 0 ? `+${entry.value}` : `${entry.value}`;
  }

  if (isSkillType(type) || isSpellType(type)) {
    return entry.extraPoints ? `+${entry.extraPoints}` : null;
  }

  return null;
}

function renderEnchantmentEntry(instanceId, entry, resolvedEntries) {
  const record = getEnchantmentRecord(entry.enchantment_id);
  if (!record) return "";

  const targetLabel = entryTargetLabel(record, entry);
  const magnitudeLabel = entryMagnitudeLabel(record, entry);
  const price = resolvedPrice(resolvedEntries, entry._instanceId);

  const parts = [record.enchantment_name];
  if (targetLabel) parts.push(escapeHtml(targetLabel));
  if (magnitudeLabel) parts.push(magnitudeLabel);

  return `
    <div class="enchantment-entry" data-entry-instance-id="${entry._instanceId}">
      <span class="enchantment-entry-label">${parts.join(" — ")}</span>
      <span class="enchantment-entry-price">${price != null ? price : "—"}</span>
      <button
        type="button"
        class="btn-remove enchantment-remove-btn"
        data-instance-id="${instanceId}"
        data-entry-instance-id="${entry._instanceId}"
      >✕</button>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// TARGET PICKER (cascading filter + name select)
//
// Matches the pattern already established elsewhere in the app for adding
// advantages/disadvantages/skills/spells directly (advTypeSelect+advSelect,
// skillCategorySelect, spell school filter) — a filter dropdown narrows a
// second dropdown of actual targets, both showing each row's *_box_name
// (which encodes cost/difficulty, e.g. "ATRAENTE | 5") rather than the bare
// name, same as those existing pickers.
// ─────────────────────────────────────────────────────────────────────────────

const TARGET_PICKER_CONFIG = {
  advantage: {
    rows: () => data.advantages.filter((a) => a.advantage_type !== RACIAL_TYPE),
    filterField: "advantage_type",
    valueField: "advantage_id",
    labelField: "advantage_box_name",
    filterPlaceholder: () => t("traits.typeFilter"),
  },
  disadvantage: {
    rows: () => data.disadvantages.filter((d) => d.disadvantage_type !== RACIAL_TYPE),
    filterField: "disadvantage_type",
    valueField: "disadvantage_id",
    labelField: "disadvantage_box_name",
    filterPlaceholder: () => t("traits.typeFilter"),
  },
  skill: {
    rows: () => data.skills,
    filterField: "skill_category",
    valueField: "skill_id",
    labelField: "skill_box_name",
    filterPlaceholder: () => t("traits.categoryFilter"),
  },
  spell: {
    // Deduplicated one row per spell name — target is the spell's NAME,
    // not spell_id, since data.spells has 5 tier-rows per spell and the
    // engine resolves granted/fortified spells by name (see
    // engine/inventory/js/shared/enchantmentTargetsDB.js). School and
    // box_name are identical across every tier of the same spell.
    rows: () => getUniqueSpellRows(),
    filterField: "spell_school",
    valueField: "spell_name",
    labelField: "spell_box_name",
    filterPlaceholder: () => t("magic.schoolFilter"),
  },
};

function targetPickerKind(type) {
  if (isAdvantageType(type)) return "advantage";
  if (isDisadvantageType(type)) return "disadvantage";
  if (isSkillType(type)) return "skill";
  if (isSpellType(type)) return "spell";
  return null;
}

function renderTargetPicker(instanceId, type) {
  const kind = targetPickerKind(type);
  const config = TARGET_PICKER_CONFIG[kind];
  if (!config) return "";

  const allRows = config.rows();
  const currentFilter = getEnchantmentAddFormTargetFilter(instanceId);

  const filterValues = [
    ...new Set(allRows.map((r) => r[config.filterField]).filter(Boolean)),
  ].sort();

  const filteredRows = currentFilter
    ? allRows.filter((r) => r[config.filterField] === currentFilter)
    : allRows;

  return `
    <label class="item-detail-field">
      <select class="enchantment-target-filter" data-instance-id="${instanceId}">
        <option value="">${config.filterPlaceholder()}</option>
        ${filterValues
          .map(
            (v) =>
              `<option value="${escapeAttr(v)}" ${v === currentFilter ? "selected" : ""}>${escapeHtml(v)}</option>`,
          )
          .join("")}
      </select>
    </label>
    <label class="item-detail-field">
      <em>${t("enchantments.target")}</em>
      <select class="enchantment-add-target" data-instance-id="${instanceId}">
        ${filteredRows
          .map(
            (r) =>
              `<option value="${escapeAttr(r[config.valueField])}">${escapeHtml(r[config.labelField])}</option>`,
          )
          .join("")}
      </select>
    </label>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN-AWARE NUMBER INPUTS
//
// Fortify types are always a positive integer, weaken types always
// negative (enforced server-side too — see enchantmentsValidation.js).
// Defaults and min/max are set so the input opens on a valid value and the
// browser's native stepper can't drift it out of range.
// ─────────────────────────────────────────────────────────────────────────────

function attributeValueInput(record, instanceId) {
  const base = Number(record.enchantment_base_value);
  const step = Number(record.enchantment_step);
  const weaken = isWeakenType(record.enchantment_effect_type);

  const bound = weaken ? `max="${-base}"` : `min="${base}"`;
  const defaultValue = weaken ? -base : base;

  return `
    <label class="item-detail-field">
      <em>${t("enchantments.value")}</em>
      <input
        type="number"
        class="enchantment-add-value"
        data-instance-id="${instanceId}"
        ${bound}
        step="${step}"
        value="${defaultValue}"
      />
    </label>`;
}

function extraPointsInput(type, instanceId) {
  const isFortify = isFortifyType(type);
  const weaken = isWeakenType(type);

  const bound = isFortify ? `min="1"` : weaken ? `max="-1"` : `min="0"`;
  const defaultValue = isFortify ? 1 : weaken ? -1 : 0;

  return `
    <label class="item-detail-field">
      <em>${t("enchantments.extraPoints")}</em>
      <input
        type="number"
        class="enchantment-add-extra-points"
        data-instance-id="${instanceId}"
        ${bound}
        step="1"
        value="${defaultValue}"
      />
    </label>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM
// ─────────────────────────────────────────────────────────────────────────────

function addFormParamsMarkup(record, instanceId) {
  const type = record.enchantment_effect_type;

  if (isAttributeType(type)) {
    return attributeValueInput(record, instanceId);
  }

  if (isAdvantageType(type) || isDisadvantageType(type)) {
    return renderTargetPicker(instanceId, type);
  }

  if (isSkillType(type) || isSpellType(type)) {
    return (
      renderTargetPicker(instanceId, type) + extraPointsInput(type, instanceId)
    );
  }

  return "";
}

function renderAddForm(instanceId, itemCategory) {
  const allowed = getAllowedEnchantments(itemCategory);

  if (allowed.length === 0) {
    return `<p class="custom-fields-empty">${t("enchantments.noneAvailable")}</p>`;
  }

  const selectedId = getEnchantmentAddFormSelection(instanceId, itemCategory);
  const record = selectedId ? getEnchantmentRecord(selectedId) : null;

  return `
    <div class="enchantment-add-form" data-instance-id="${instanceId}">
      <div class="item-detail-grid custom-fields-grid">
        <label class="item-detail-field">
          <em>${t("enchantments.type")}</em>
          <select class="enchantment-add-select" data-instance-id="${instanceId}">
            ${allowed
              .map(
                (e) =>
                  `<option value="${e.enchantment_id}" ${e.enchantment_id === selectedId ? "selected" : ""}>${escapeHtml(e.enchantment_name)}</option>`,
              )
              .join("")}
          </select>
        </label>
        ${record ? addFormParamsMarkup(record, instanceId) : ""}
      </div>
      <div class="custom-fields-actions">
        <button
          type="button"
          class="enchantment-add-btn"
          data-instance-id="${instanceId}"
        >${t("common.add")}</button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY + WRAPPERS
// ─────────────────────────────────────────────────────────────────────────────

function enchantmentsBody({
  instanceId,
  entries,
  itemCategory,
  resolvedEntries,
}) {
  const list =
    entries.length === 0
      ? `<p class="custom-fields-empty">${t("enchantments.noneAttached")}</p>`
      : `<div class="enchantment-list">${entries
          .map((entry) =>
            renderEnchantmentEntry(instanceId, entry, resolvedEntries),
          )
          .join("")}</div>`;

  return `
    <div class="enchantments-block" data-instance-id="${instanceId}">
      ${list}
      ${renderAddForm(instanceId, itemCategory)}
    </div>`;
}

/**
 * Own dedicated <details> expander for equipped-slot (div-based) layouts —
 * a sibling to customFieldsEquippedDetail, not nested inside it.
 */
export function enchantmentsEquippedDetail(params) {
  return `
    <div class="equipped-detail">
      <details>
        <summary>${t("enchantments.title")}</summary>
        ${enchantmentsBody(params)}
      </details>
    </div>`;
}

/**
 * Own dedicated <details> expander for stored-table (tr/td-based) layouts —
 * a sibling to customFieldsDetailRow, not nested inside it.
 */
export function enchantmentsDetailRow(colspan, params) {
  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        <details>
          <summary>${t("enchantments.title")}</summary>
          ${enchantmentsBody(params)}
        </details>
      </td>
    </tr>`;
}
