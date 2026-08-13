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
 * Each attached enchantment is its own nested <details> — expand it to
 * edit or swap it in place (same underlying form as "add", just pre-filled
 * with the entry's current values and keyed by the entry's own
 * _instanceId instead of the parent item's). Both the add-form and every
 * entry's edit-form share the same rendering + a `formKey` that scopes
 * their in-progress (uncommitted) category/type/target/filter selections —
 * see inventory/enchantments.js's _resolveFormSelectionId.
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
import { RACIAL_TRAIT_TYPE } from "../../shared/constants.js";
import { escapeHtml, escapeAttr, numStepper, formatRichText } from "./renderUtils.js";
import {
  getAllowedEnchantments,
  getEnchantmentTypeValues,
  getEnchantmentRecord,
  getEnchantmentAddFormSelection,
  getEnchantmentEditFormSelection,
  getEnchantmentAddFormTargetFilter,
  getEnchantmentAddFormTypeFilter,
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

// ─────────────────────────────────────────────────────────────────────────────
// TARGET DISPLAY LOOKUPS (for the attached-entry summary line)
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

/**
 * Rules-text line for the currently-selected enchantment, shown between the
 * type select and its parameter inputs so a player can see what they're
 * about to attach without leaving the sheet. Uses enchantment_description
 * straight from the catalog (already GM-authored Portuguese rules text).
 */
function recordDescriptionMarkup(record) {
  const desc = formatRichText(record.enchantment_description);
  if (desc === "—") return "";

  return `<div class="item-detail-block"><em>${t("traits.description")}:</em>${desc}</div>`;
}

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
    rows: () => data.advantages.filter((a) => a.advantage_type !== RACIAL_TRAIT_TYPE),
    filterField: "advantage_type",
    valueField: "advantage_id",
    labelField: "advantage_box_name",
    filterPlaceholder: () => t("traits.typeFilter"),
  },
  disadvantage: {
    rows: () =>
      data.disadvantages.filter((d) => d.disadvantage_type !== RACIAL_TRAIT_TYPE),
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

/**
 * "Categoria" filter — narrows the "Tipo de Encantamento" select itself,
 * one level upstream of the target picker above. Carries the same
 * <em>Filtro</em> label as the target picker's own filter select (see
 * renderTargetPicker below) purely so the label row's height lines up
 * with labeled fields ("Alvo", "Tipo de Encantamento", ...) it sits
 * beside or above — an empty/no-label field looks visually "cut off"
 * next to one that has a bold label pushing its input down.
 *
 * Own full-width row so it reads as a distinct step before
 * "Tipo de Encantamento", not a paired field.
 *
 * Omitted entirely when the item category only ever offers one
 * enchantment_type — a single-option filter narrows nothing.
 */
function renderCategoryFilter(formKey, itemCategory, typeFilter) {
  const typeValues = getEnchantmentTypeValues(itemCategory);
  if (typeValues.length <= 1) return "";

  return `
    <label class="item-detail-field item-detail-field--full">
      <em>${t("enchantments.filterLabel")}</em>
      <select class="enchantment-category-filter" data-form-key="${formKey}">
        <option value="">${t("enchantments.categoryFilter")}</option>
        ${typeValues
          .map(
            (v) =>
              `<option value="${escapeAttr(v)}" ${v === typeFilter ? "selected" : ""}>${escapeHtml(v)}</option>`,
          )
          .join("")}
      </select>
    </label>`;
}

function targetPickerKind(type) {
  if (isAdvantageType(type)) return "advantage";
  if (isDisadvantageType(type)) return "disadvantage";
  if (isSkillType(type)) return "skill";
  if (isSpellType(type)) return "spell";
  return null;
}

/**
 * @param {string} formKey - the add-form's parent instanceId, OR an
 *   existing entry's own _instanceId when editing/swapping it.
 * @param {object|null} currentEntry - the entry being edited, so its
 *   current target can be pre-selected. null for the add-form (nothing to
 *   pre-select yet).
 */
function renderTargetPicker(formKey, type, currentEntry) {
  const kind = targetPickerKind(type);
  const config = TARGET_PICKER_CONFIG[kind];
  if (!config) return "";

  const allRows = config.rows();
  const currentFilter = getEnchantmentAddFormTargetFilter(formKey);
  const currentTarget = currentEntry?.target ?? null;

  const filterValues = [
    ...new Set(allRows.map((r) => r[config.filterField]).filter(Boolean)),
  ].sort();

  const filteredRows = currentFilter
    ? allRows.filter((r) => r[config.filterField] === currentFilter)
    : allRows;

  return `
    <label class="item-detail-field">
      <em>${t("enchantments.filterLabel")}</em>
      <select class="enchantment-target-filter" data-form-key="${formKey}">
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
      <select class="enchantment-target-select" data-form-key="${formKey}">
        ${filteredRows
          .map(
            (r) =>
              `<option value="${escapeAttr(r[config.valueField])}" ${r[config.valueField] === currentTarget ? "selected" : ""}>${escapeHtml(r[config.labelField])}</option>`,
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
// Uses the shared numStepper (± buttons, wired globally in events/index.js
// via data-step/data-min/data-max) rather than a bare number input, same
// component used for skill/spell/secondary-attribute modifiers elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

function attributeValueInput(record, formKey, currentEntry) {
  const base = Number(record.enchantment_base_value);
  const step = Number(record.enchantment_step);
  const weaken = isWeakenType(record.enchantment_effect_type);

  const bound = weaken ? `data-max="${-base}"` : `data-min="${base}"`;
  const typeDefault = weaken ? -base : base;
  const currentValue = currentEntry?.value ?? typeDefault;

  return `
    <label class="item-detail-field">
      <em>${t("enchantments.value")}</em>
      ${numStepper(
        "enchantment-value-input",
        `data-form-key="${formKey}" ${bound}`,
        currentValue,
        `data-step="${step}"`,
      )}
    </label>`;
}

function extraPointsInput(type, formKey, currentEntry) {
  const isFortify = isFortifyType(type);
  const weaken = isWeakenType(type);

  const bound = isFortify
    ? `data-min="1"`
    : weaken
      ? `data-max="-1"`
      : `data-min="0"`;
  const typeDefault = isFortify ? 1 : weaken ? -1 : 0;
  const currentValue = currentEntry?.extraPoints ?? typeDefault;

  return `
    <label class="item-detail-field">
      <em>${t("enchantments.extraPoints")}</em>
      ${numStepper(
        "enchantment-extra-points-input",
        `data-form-key="${formKey}" ${bound}`,
        currentValue,
        `data-step="1"`,
      )}
    </label>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED FORM (used for both "add" and "edit an existing entry")
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object|null} currentEntry - non-null only when editing an
 *   existing entry AND the type hasn't been swapped away from it yet, so
 *   its own value/target/extraPoints can pre-fill the inputs. null means
 *   "use fresh defaults for this enchantment type" (add-form, or an
 *   in-progress swap to a different type).
 */
function paramsMarkup(record, formKey, currentEntry) {
  const type = record.enchantment_effect_type;

  if (isAttributeType(type)) {
    return attributeValueInput(record, formKey, currentEntry);
  }

  if (isAdvantageType(type) || isDisadvantageType(type)) {
    return renderTargetPicker(formKey, type, currentEntry);
  }

  if (isSkillType(type) || isSpellType(type)) {
    return (
      renderTargetPicker(formKey, type, currentEntry) +
      extraPointsInput(type, formKey, currentEntry)
    );
  }

  return "";
}

/**
 * "Tipo de Encantamento" <select> options — grouped into <optgroup>s by
 * enchantment_type once more than one type is present in the list (e.g.
 * before a Categoria filter narrows it down, or for an item category that
 * simply offers several types with the same allowed_itens value). A single
 * flat list when there's only one type, since a lone optgroup label would
 * just repeat the Categoria filter for no benefit.
 */
function typeSelectOptionsMarkup(allowed, selectedId) {
  const optionMarkup = (e) =>
    `<option value="${e.enchantment_id}" ${e.enchantment_id === selectedId ? "selected" : ""}>${escapeHtml(e.enchantment_name)}</option>`;

  const types = [...new Set(allowed.map((e) => e.enchantment_type))];
  if (types.length <= 1) {
    return allowed.map(optionMarkup).join("");
  }

  return types
    .map(
      (type) => `
        <optgroup label="${escapeAttr(type)}">
          ${allowed
            .filter((e) => e.enchantment_type === type)
            .map(optionMarkup)
            .join("")}
        </optgroup>`,
    )
    .join("");
}

/**
 * Shared form body for both "add a new enchantment" and "edit/swap an
 * already-attached entry" — same fields (category filter, type select,
 * description, params), only the formKey, defaulted selection, empty-state
 * guard, and action buttons differ between the two callers below.
 */
function renderEnchantmentForm({
  formKey,
  itemCategory,
  selectedId,
  currentEntry,
  guardEmpty,
  actionsMarkup,
}) {
  const typeFilter = getEnchantmentAddFormTypeFilter(formKey);
  const allowed = getAllowedEnchantments(itemCategory, typeFilter);

  if (guardEmpty && allowed.length === 0) {
    return `<p class="custom-fields-empty">${t("enchantments.noneAvailable")}</p>`;
  }

  const record = selectedId ? getEnchantmentRecord(selectedId) : null;

  return `
    <div class="enchantment-form" data-form-key="${formKey}">
      <div class="item-detail-grid custom-fields-grid">
        ${renderCategoryFilter(formKey, itemCategory, typeFilter)}
        <label class="item-detail-field item-detail-field--full">
          <em>${t("enchantments.type")}</em>
          <select class="enchantment-type-select" data-form-key="${formKey}">
            ${typeSelectOptionsMarkup(allowed, selectedId)}
          </select>
        </label>
        ${record ? recordDescriptionMarkup(record) : ""}
        ${record ? paramsMarkup(record, formKey, currentEntry) : ""}
      </div>
      <div class="custom-fields-actions">
        ${actionsMarkup}
      </div>
    </div>`;
}

function renderAddForm(instanceId, itemCategory) {
  const selectedId = getEnchantmentAddFormSelection(instanceId, itemCategory);

  return renderEnchantmentForm({
    formKey: instanceId,
    itemCategory,
    selectedId,
    currentEntry: null,
    guardEmpty: true,
    actionsMarkup: `
        <button
          type="button"
          class="enchantment-add-btn"
          data-instance-id="${instanceId}"
        >${t("common.add")}</button>`,
  });
}

/**
 * Edit/swap form for one already-attached entry. Same shape as the
 * add-form, but formKey is the entry's own _instanceId (so its in-progress
 * type/target selection is tracked independently of the item's add-form
 * and of every other entry on the same item), and defaults to the entry's
 * CURRENT enchantment_id rather than the first allowed one.
 */
function renderEntryEditForm(parentInstanceId, entry, itemCategory) {
  const formKey = entry._instanceId;
  const selectedId = getEnchantmentEditFormSelection(
    formKey,
    itemCategory,
    entry.enchantment_id,
  );
  const swapped = selectedId !== entry.enchantment_id;

  return renderEnchantmentForm({
    formKey,
    itemCategory,
    selectedId,
    currentEntry: swapped ? null : entry,
    guardEmpty: false,
    actionsMarkup: `
        <button
          type="button"
          class="enchantment-save-btn"
          data-instance-id="${parentInstanceId}"
          data-entry-instance-id="${formKey}"
        >${t("common.save")}</button>
        <button
          type="button"
          class="btn-remove enchantment-remove-btn"
          data-instance-id="${parentInstanceId}"
          data-entry-instance-id="${formKey}"
        >${t("common.remove")}</button>`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTACHED ENCHANTMENTS LIST — each entry is its own <details>
// ─────────────────────────────────────────────────────────────────────────────

function renderEnchantmentEntry(
  instanceId,
  entry,
  resolvedEntries,
  itemCategory,
) {
  const record = getEnchantmentRecord(entry.enchantment_id);
  if (!record) return "";

  const targetLabel = entryTargetLabel(record, entry);
  const magnitudeLabel = entryMagnitudeLabel(record, entry);
  const price = resolvedPrice(resolvedEntries, entry._instanceId);

  const parts = [record.enchantment_name];
  if (targetLabel) parts.push(escapeHtml(targetLabel));
  if (magnitudeLabel) parts.push(magnitudeLabel);

  return `
    <details class="enchantment-entry" data-detail-kind="entry:${entry._instanceId}">
      <summary class="enchantment-entry-summary">
        <span class="enchantment-entry-label">${parts.join(": ")}</span>
        <span class="enchantment-entry-price">${price != null ? price : "—"}</span>
      </summary>
      <div class="enchantment-entry-edit">
        ${renderEntryEditForm(instanceId, entry, itemCategory)}
      </div>
    </details>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY + WRAPPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sum of resolved prices across every attached entry, for the block-level
 * summary line — null (not 0) when there are no entries yet, or when none
 * of them have a resolved price yet (e.g. right after an edit, before the
 * debounced engine run catches up), so the caller can fall back to showing
 * nothing rather than a misleading "0".
 */
function enchantmentsSubtotal(entries, resolvedEntries) {
  if (entries.length === 0) return null;

  let total = 0;
  let hasResolvedPrice = false;

  for (const entry of entries) {
    const price = resolvedPrice(resolvedEntries, entry._instanceId);
    if (price != null) {
      total += price;
      hasResolvedPrice = true;
    }
  }

  return hasResolvedPrice ? total : null;
}

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
            renderEnchantmentEntry(
              instanceId,
              entry,
              resolvedEntries,
              itemCategory,
            ),
          )
          .join("")}</div>`;

  return `
    <div class="enchantments-block" data-instance-id="${instanceId}">
      ${list}
      ${renderAddForm(instanceId, itemCategory)}
    </div>`;
}

/**
 * The bare "Encantamentos" <details> expander, with no outer wrapper —
 * for nesting INSIDE another <details> (currently: accessories'
 * "Personalizar" block, see customFieldsEquippedDetail/customFieldsDetailRow's
 * extraContent param). A nested <details> needs no .equipped-detail div or
 * <tr> of its own since it already sits inside its parent's.
 */
function enchantmentsExpanderMarkup(params) {
  const subtotal = enchantmentsSubtotal(params.entries, params.resolvedEntries);

  return `
    <details data-detail-kind="enchantments">
      <summary class="enchantments-summary">
        <span>${t("enchantments.title")}</span>
        ${subtotal != null ? `<span class="enchantments-subtotal">${t("enchantments.subtotalLabel")}: ${subtotal}</span>` : ""}
      </summary>
      ${enchantmentsBody(params)}
    </details>`;
}

export function enchantmentsExpander(params) {
  return enchantmentsExpanderMarkup(params);
}

/**
 * Own dedicated <details> expander for equipped-slot (div-based) layouts —
 * a sibling to customFieldsEquippedDetail, not nested inside it.
 * data-detail-kind lets openState.js track this block's open/closed state
 * independently of the sibling "customize"/"stats" blocks.
 *
 * Kept for equipment types that want enchantments as a standalone block
 * rather than nested inside "Personalizar" — see enchantmentsExpander for
 * the nested form accessories now uses.
 */
export function enchantmentsEquippedDetail(params) {
  return `
    <div class="equipped-detail">
      ${enchantmentsExpanderMarkup(params)}
    </div>`;
}

/**
 * Own dedicated <details> expander for stored-table (tr/td-based) layouts —
 * a sibling to customFieldsDetailRow, not nested inside it. See
 * enchantmentsEquippedDetail's note above.
 */
export function enchantmentsDetailRow(colspan, params) {
  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        ${enchantmentsExpanderMarkup(params)}
      </td>
    </tr>`;
}
