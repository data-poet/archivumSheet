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
 */
export function customFieldsEquippedDetail(params) {
  return `
    <div class="equipped-detail">
      <details>
        <summary>${t("common.customize")}</summary>
        ${_customFieldsBody(params)}
      </details>
    </div>`;
}

/**
 * customFieldsBlock for stored-table (tr/td-based) layouts — mirrors
 * detailRow's wrapper exactly, for the same open-state-preservation reason.
 */
export function customFieldsDetailRow(colspan, params) {
  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        <details>
          <summary>${t("common.customize")}</summary>
          ${_customFieldsBody(params)}
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
      <details>
        <summary>${t("common.details")}</summary>
        <div class="item-detail-grid">${content}</div>
      </details>
    </div>`;
}
