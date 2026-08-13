/**
 * renderUtils.js
 *
 * Shared rendering utilities for detail rows across ALL list renders.
 * Class names use the unified .item-detail / .item-detail-grid / .item-detail-block
 * naming convention. The old .spell-detail* names are kept as CSS aliases in
 * style.css so existing render files that haven't been touched yet still work.
 */

import { t } from "../../localization/pt-BR.js";

// ─────────────────────────────────────────────────────────────────────────────
// formatRichText
// Converts raw text (possibly containing bullet lines starting with "-")
// into an HTML list + optional note paragraph. Bullet lines may be indented
// (spaces or tabs) to express nested sub-bullets; indentation depth is
// normalized into list-nesting levels, so any consistent indent step works.
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Shared "text input + increment/decrement buttons" control, used
 * anywhere a numeric field needs mobile-friendly ± buttons rather than
 * relying on the native (tiny, easy-to-mistap) number spinner. The ±
 * buttons themselves are wired globally in events/index.js — it reads
 * data-step/data-min/data-max off the input, so any caller that needs
 * bounds should pass them as data-* attributes via dataAttrs, not native
 * min/max/step (the input is type="text", not type="number").
 */
export function numStepper(cls, dataAttrs, value, stepAttr = "") {
  return `
    <div class="num-stepper">
      <input
        type="text"
        inputmode="numeric"
        class="${cls}"
        ${dataAttrs}
        ${stepAttr}
        value="${value}"
      />
      <div class="stepper-btns">
        <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
        <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
      </div>
    </div>`;
}

export function formatRichText(raw) {
  if (!raw || raw.trim() === "") return "—";

  const parsed = raw
    .split("\n")
    .map(l => {
      const match  = l.match(/^(\s*)(.*)$/);
      const indent = match[1].replace(/\t/g, "    ").length;
      return { indent, text: match[2].trim() };
    })
    .filter(l => l.text.length > 0);

  const bulletLines = parsed.filter(l => l.text.startsWith("-"));

  if (bulletLines.length === 0)
    return `<p class="scaling-note">${raw.trim()}</p>`;

  const uniqueIndents = [...new Set(bulletLines.map(l => l.indent))].sort((a, b) => a - b);
  const levelOf        = indent => uniqueIndents.indexOf(indent);

  const items = bulletLines.map(l => ({
    level:   levelOf(l.indent),
    content: l.text.slice(1).trim(),
  }));

  const note = parsed
    .filter(l => !l.text.startsWith("-"))
    .map(l => l.text)
    .join(" ");

  const list = _buildNestedList(items);

  return `${list}${note ? `<p class="scaling-note">${note}</p>` : ""}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// _buildNestedList
// Internal helper: turns a flat array of { level, content } bullet items into
// nested <ul class="scaling-list"> markup, one level of nesting per indent
// step found in the source text.
// ─────────────────────────────────────────────────────────────────────────────
function _buildNestedList(items) {
  const root  = { children: [] };
  const stack = [{ level: -1, node: root }];

  for (const item of items) {
    while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].node;
    const node   = { content: item.content, children: [] };
    parent.children.push(node);
    stack.push({ level: item.level, node });
  }

  const render = node =>
    node.children.length
      ? `<ul class="scaling-list">${node.children
          .map(child => `<li>${child.content}${render(child)}</li>`)
          .join("")}</ul>`
      : "";

  return render(root);
}

// ─────────────────────────────────────────────────────────────────────────────
// _buildDetailContent
// Internal helper: maps an array of field descriptors to HTML spans/divs.
// Each field: { label: string, value: string, rich?: boolean }
// Rich fields (description, scaling) span the full grid width.
// Empty or "—" values are filtered out to keep the panel clean.
// ─────────────────────────────────────────────────────────────────────────────
function _buildDetailContent(fields) {
  return fields
    .filter(({ value }) => value && value !== "—")
    .map(({ label, value, rich }) =>
      rich
        ? `<div class="item-detail-block"><em>${label}:</em>${value}</div>`
        : `<span class="item-detail"><em>${label}:</em> ${value}</span>`
    )
    .join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// detailRow
// Renders a collapsible <tr> detail row for use inside <tbody> tables.
// colspan should match the number of columns in the parent table.
// ─────────────────────────────────────────────────────────────────────────────
export function detailRow(colspan, fields) {
  const content = _buildDetailContent(fields);
  if (!content) return "";

  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        <details>
          <summary>${t("common.details")}</summary>
          <div class="item-detail-grid">${content}</div>
        </details>
      </td>
    </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// escapeHtml / escapeAttr
// Minimal escaping for user-typed text dropped into innerHTML — used by
// customFieldsBlock (and anywhere else user free-text ends up in markup).
// ─────────────────────────────────────────────────────────────────────────────
export function escapeHtml(raw) {
  if (raw == null) return "";
  return String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(raw) {
  return escapeHtml(raw).replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────────────────────
// customFieldsBlock (pilot)
//
// PILOT: reusable "custom name / description / effect" editable block for a
// single equipment instance. Intended to be adopted by other equipment types
// (armor, melee, ranged, firearms, shields...) once they gain the same
// custom_* fields — keep this generic, not accessory-specific.
//
// Lives in its own dedicated <details> expander (closed by default), mirroring
// detailRow / equippedDetailBlock below — so it's out of the way until opened.
//
// Inside: read-only text until "Personalizar" is pressed, then a detached,
// uncontrolled edit form (nothing writes to state on keystroke — only
// "Salvar" commits, "Cancelar" discards). See openCustomFieldsEditor et al.
//
// Which instance's editor is open is tracked here (module-level, keyed by
// the globally-unique _instanceId) rather than in each equipment type's own
// state, so it survives re-renders triggered by unrelated actions and stays
// generic for reuse by future equipment types.
// ─────────────────────────────────────────────────────────────────────────────

const _openCustomFieldEditors = new Set();

export function openCustomFieldsEditor(instanceId) {
  _openCustomFieldEditors.add(instanceId);
}

export function closeCustomFieldsEditor(instanceId) {
  _openCustomFieldEditors.delete(instanceId);
}

export function isCustomFieldsEditorOpen(instanceId) {
  return _openCustomFieldEditors.has(instanceId);
}

/**
 * Reads the current (uncommitted) values out of an open editor's DOM, scoped
 * to the .custom-fields-block matching instanceId. Returns null if that
 * editor isn't open/found.
 */
export function readCustomFieldsEditorValues(instanceId) {
  const container = document.querySelector(
    `.custom-fields-block[data-instance-id="${instanceId}"]`,
  );
  if (!container) return null;

  return {
    name: container.querySelector(".custom-fields-input-name")?.value ?? "",
    description:
      container.querySelector(".custom-fields-input-description")?.value ??
      "",
    effect:
      container.querySelector(".custom-fields-input-effect")?.value ?? "",
  };
}

function _customFieldsBody({ instanceId, name, description, effect }) {
  if (isCustomFieldsEditorOpen(instanceId)) {
    return `
      <div class="custom-fields-block custom-fields-block--editing" data-instance-id="${instanceId}">
        <div class="item-detail-grid custom-fields-grid">
          <label class="item-detail-field">
            <em>${t("common.customName")}</em>
            <input
              type="text"
              class="custom-fields-input-name"
              value="${escapeAttr(name)}"
              placeholder="${t("common.customNamePlaceholder")}"
            />
          </label>
          <label class="item-detail-field item-detail-field--full">
            <em>${t("common.customDescription")}</em>
            <textarea
              class="custom-fields-input-description"
              rows="2"
              placeholder="${t("common.customDescriptionPlaceholder")}"
            >${escapeHtml(description)}</textarea>
          </label>
          <label class="item-detail-field item-detail-field--full">
            <em>${t("common.customEffect")}</em>
            <textarea
              class="custom-fields-input-effect"
              rows="2"
              placeholder="${t("common.customEffectPlaceholder")}"
            >${escapeHtml(effect)}</textarea>
          </label>
        </div>
        <div class="custom-fields-actions">
          <button type="button" class="custom-fields-save-btn" data-instance-id="${instanceId}">${t("common.save")}</button>
          <button type="button" class="custom-fields-cancel-btn" data-instance-id="${instanceId}">${t("common.cancel")}</button>
        </div>
      </div>`;
  }

  const hasAny = Boolean(name || description || effect);

  return `
    <div class="custom-fields-block" data-instance-id="${instanceId}">
      ${
        hasAny
          ? `<div class="item-detail-grid custom-fields-grid">
              ${name ? `<div class="item-detail-field"><em>${t("common.customName")}</em><span>${escapeHtml(name)}</span></div>` : ""}
              ${description ? `<div class="item-detail-field item-detail-field--full"><em>${t("common.customDescription")}</em><span>${escapeHtml(description)}</span></div>` : ""}
              ${effect ? `<div class="item-detail-field item-detail-field--full"><em>${t("common.customEffect")}</em><span>${escapeHtml(effect)}</span></div>` : ""}
            </div>`
          : `<p class="custom-fields-empty">${t("common.noCustomFields")}</p>`
      }
      <button type="button" class="custom-fields-edit-btn" data-instance-id="${instanceId}">${t("common.customize")}</button>
    </div>`;
}

/**
 * customFieldsBlock for equipped-slot (div-based) layouts — mirrors
 * equippedDetailBlock's wrapper exactly, so open/closed state survives
 * re-renders via the existing generic openState.js key functions.
 *
 * @param {string} [extraContent] - additional markup nested INSIDE the
 *   "Personalizar" <details>, after the custom-fields body — e.g. the
 *   accessories "Encantamentos" expander (see enchantmentsExpander in
 *   renderEnchantments.js). Optional so every other equipment type that
 *   hasn't adopted enchantments yet renders exactly as before.
 */
export function customFieldsEquippedDetail(params, extraContent = "") {
  return `
    <div class="equipped-detail">
      <details data-detail-kind="customize">
        <summary>${t("common.customize")}</summary>
        ${_customFieldsBody(params)}
        ${extraContent}
      </details>
    </div>`;
}

/**
 * customFieldsBlock for stored-table (tr/td-based) layouts — mirrors
 * detailRow's wrapper exactly, for the same open-state-preservation reason.
 *
 * @param {string} [extraContent] - see customFieldsEquippedDetail.
 */
export function customFieldsDetailRow(colspan, params, extraContent = "") {
  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        <details data-detail-kind="customize">
          <summary>${t("common.customize")}</summary>
          ${_customFieldsBody(params)}
          ${extraContent}
        </details>
      </td>
    </tr>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// equippedDetailBlock
// Renders a collapsible <div> detail block for equipped items.
// Attaches visually below the .equipped-slot-grid.
// ─────────────────────────────────────────────────────────────────────────────
export function equippedDetailBlock(fields) {
  const content = _buildDetailContent(fields);
  if (!content) return "";

  return `
    <div class="equipped-detail">
      <details data-detail-kind="stats">
        <summary>${t("common.details")}</summary>
        <div class="item-detail-grid">${content}</div>
      </details>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// customItemEditRow
//
// Fully user-defined custom-inventory entries have no catalog record behind
// them — name/weight/price/description ARE the item, not an overlay on top
// of one. So unlike customFieldsBlock (which only ever adds optional flavor
// on top of catalog data), this block lets the person edit the entry's real
// fields directly. Reuses the same open/close editor-state Set as
// customFieldsBlock (keyed generically by id) so the interaction pattern
// stays identical: closed read-only summary → "Editar" → detached uncontrolled
// form → "Salvar"/"Cancelar".
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads the current (uncommitted) values out of an open custom-item editor's
 * DOM. Returns null if that editor isn't open/found.
 */
export function readCustomItemEditorValues(customItemId) {
  const container = document.querySelector(
    `.custom-item-edit-block[data-custom-item-id="${customItemId}"]`,
  );
  if (!container) return null;

  return {
    name: container.querySelector(".custom-item-input-name")?.value ?? "",
    weight: parseFloat(
      container.querySelector(".custom-item-input-weight")?.value ?? "",
    ),
    price: parseFloat(
      container.querySelector(".custom-item-input-price")?.value ?? "",
    ),
    description:
      container.querySelector(".custom-item-input-description")?.value ?? "",
  };
}

export function customItemEditRow(colspan, { customItemId, name, weight, price, description }) {
  const editing = isCustomFieldsEditorOpen(customItemId);

  const body = editing
    ? `
      <div class="custom-item-edit-block custom-item-edit-block--editing" data-custom-item-id="${customItemId}">
        <div class="item-detail-grid custom-fields-grid">
          <label class="item-detail-field">
            <em>${t("common.name")}</em>
            <input type="text" class="custom-item-input-name" value="${escapeAttr(name)}" />
          </label>
          <label class="item-detail-field">
            <em>${t("common.weight")}</em>
            <input type="number" min="0" step="0.01" class="custom-item-input-weight" value="${escapeAttr(weight)}" />
          </label>
          <label class="item-detail-field">
            <em>${t("common.price")}</em>
            <input type="number" min="0" step="0.01" class="custom-item-input-price" value="${escapeAttr(price)}" />
          </label>
          <label class="item-detail-field item-detail-field--full">
            <em>${t("customInventory.description")}</em>
            <textarea class="custom-item-input-description" rows="2">${escapeHtml(description)}</textarea>
          </label>
        </div>
        <div class="custom-fields-actions">
          <button type="button" class="custom-item-save-btn" data-custom-item-id="${customItemId}">${t("common.save")}</button>
          <button type="button" class="custom-item-cancel-btn" data-custom-item-id="${customItemId}">${t("common.cancel")}</button>
        </div>
      </div>`
    : `
      <div class="custom-item-edit-block" data-custom-item-id="${customItemId}">
        <div class="item-detail-grid">
          <span class="item-detail"><em>${t("common.price")}:</em> ${price}</span>
          <span class="item-detail"><em>${t("common.weight")}:</em> ${weight}</span>
          ${description ? `<div class="item-detail-block"><em>${t("customInventory.description")}:</em>${escapeHtml(description)}</div>` : ""}
        </div>
        <button type="button" class="custom-item-edit-btn" data-custom-item-id="${customItemId}">${t("common.edit")}</button>
      </div>`;

  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        <details ${editing ? "open" : ""}>
          <summary>${editing ? t("common.edit") : t("common.details")}</summary>
          ${body}
        </details>
      </td>
    </tr>`;
}
