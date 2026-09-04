// Own <details> rather than sharing "Personalizar" — enchantments are a distinct (mechanical, DB-priced) concern from free-text customization.
// Price comes from the engine's resolved output only; shows "—" until the debounced engine run catches up, rather than a stale or guessed number.

import {
  t,
  getElementalResistanceLabel,
} from "../../../../localization/pt-BR/index.js";
import { state } from "../../../../state.js";
import { RACIAL_TRAIT_TYPE } from "../../../../shared/constants.js";
import {
  escapeHtml,
  escapeAttr,
  numStepper,
  formatRichText,
} from "../../../../shared/renderUtils.js";
import {
  decimalToPercent,
  percentToDecimal,
} from "../../../../components/resistances.js";
import {
  getAllowedEnchantments,
  getEnchantmentTypeValues,
  getEnchantmentRecord,
  getEnchantmentAddFormSelection,
  getEnchantmentEditFormSelection,
  getEnchantmentAddFormTargetFilter,
  getEnchantmentAddFormTypeFilter,
  getUniqueSpellRows,
  isValueType,
  isPercentageType,
  isElementalResistanceType,
  isDamageType,
  isRequisiteType,
  isAdvantageType,
  isDisadvantageType,
  isSkillType,
  isSpellType,
  isFortifyType,
  isWeakenType,
} from "./model.js";

const data = state.data;

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

  // Fixed on the DB row, not picked in the form, so read from record — the entry itself never carries a target for this type.
  if (isElementalResistanceType(type)) {
    return getElementalResistanceLabel(record.enchantment_target);
  }

  // Same "not player-picked, fixed on the DB row" shape as elemental-resistance above.
  if (isDamageType(type) || isRequisiteType(type)) {
    return record.enchantment_target ?? null;
  }

  return null;
}

function entryMagnitudeLabel(record, entry) {
  const type = record.enchantment_effect_type;

  if (isValueType(type)) {
    const percentage = isPercentageType(record);
    const displayValue = percentage
      ? decimalToPercent(entry.value)
      : entry.value;
    const suffix = percentage ? "%" : "";
    return displayValue > 0
      ? `+${displayValue}${suffix}`
      : `${displayValue}${suffix}`;
  }

  if (isSkillType(type) || isSpellType(type)) {
    return entry.extraPoints ? `+${entry.extraPoints}` : null;
  }

  return null;
}

// Shown between the type select and its param inputs so a player can preview it before attaching, without leaving the sheet.
function recordDescriptionMarkup(record) {
  const desc = formatRichText(record.enchantment_description);
  if (desc === "—") return "";

  return `<div class="item-detail-block"><em>${t("traits.description")}:</em>${desc}</div>`;
}

// Matches the existing advantage/disadvantage/skill/spell pickers elsewhere in the app: a filter narrows a second select of *_box_name targets (which encode cost/difficulty, e.g. "ATRAENTE | 5").
const TARGET_PICKER_CONFIG = {
  advantage: {
    rows: () =>
      data.advantages.filter((a) => a.advantage_type !== RACIAL_TRAIT_TYPE),
    filterField: "advantage_type",
    valueField: "advantage_id",
    labelField: "advantage_box_name",
    filterPlaceholder: () => t("traits.typeFilter"),
  },
  disadvantage: {
    rows: () =>
      data.disadvantages.filter(
        (d) => d.disadvantage_type !== RACIAL_TRAIT_TYPE,
      ),
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
    // Target is the spell's NAME, not spell_id — the engine resolves granted/fortified spells by name.
    rows: () => getUniqueSpellRows(),
    filterField: "spell_school",
    valueField: "spell_name",
    labelField: "spell_box_name",
    filterPlaceholder: () => t("magic.schoolFilter"),
  },
};

// Shares the target picker's <em>Filtro</em> label purely so row heights line up with neighboring labeled fields.
// Omitted when the item category only ever offers one enchantment_type — a single-option filter narrows nothing.
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

// formKey: add-form's parent instanceId, or an existing entry's own _instanceId when editing/swapping.
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

// Fortify types are always positive, weaken types always negative (enforced server-side too).
// Percentage-flagged types display/step in whole percent units; currentEntry.value stays the raw decimal fraction and is converted here for display only — model.js's _buildEntryFields converts back on submit.
function valueInput(record, formKey, currentEntry) {
  const percentage = isPercentageType(record);
  const weaken = isWeakenType(record.enchantment_effect_type);

  const rawBase = Number(record.enchantment_base_value);
  const rawStep = Number(record.enchantment_step);
  const base = percentage ? decimalToPercent(rawBase) : rawBase;
  const step = percentage ? decimalToPercent(rawStep) : rawStep;

  const bound = weaken ? `data-max="${-base}"` : `data-min="${base}"`;
  const typeDefault = weaken ? -base : base;
  const rawCurrentValue = currentEntry?.value;
  const currentValue =
    rawCurrentValue != null
      ? percentage
        ? decimalToPercent(rawCurrentValue)
        : rawCurrentValue
      : typeDefault;

  return `
    <label class="item-detail-field">
      <em>${percentage ? t("enchantments.valuePercent") : t("enchantments.value")}</em>
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

// currentEntry is null to mean "use fresh defaults for this type" (add-form, or an in-progress swap to a different type).
function paramsMarkup(record, formKey, currentEntry) {
  const type = record.enchantment_effect_type;

  if (isValueType(type)) {
    return valueInput(record, formKey, currentEntry);
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

// Flat list (no optgroup) when there's only one type — a lone optgroup label would just repeat the Categoria filter for no benefit.
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

// formKey is the entry's own _instanceId, so its in-progress selection is tracked independently of the item's add-form and other entries.
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

// Returns null (not 0) when nothing has a resolved price yet, so the caller can show nothing rather than a misleading "0".
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

// No outer wrapper — for nesting inside another <details> (e.g. accessories' "Personalizar" block), which already provides its own .equipped-detail/<tr>.
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

// Sibling to customFieldsEquippedDetail, not nested inside it — for equipment types that want enchantments as a standalone block.
export function enchantmentsEquippedDetail(params) {
  return `
    <div class="equipped-detail">
      ${enchantmentsExpanderMarkup(params)}
    </div>`;
}

// Sibling to customFieldsDetailRow, not nested inside it — see enchantmentsEquippedDetail above.
export function enchantmentsDetailRow(colspan, params) {
  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        ${enchantmentsExpanderMarkup(params)}
      </td>
    </tr>`;
}
