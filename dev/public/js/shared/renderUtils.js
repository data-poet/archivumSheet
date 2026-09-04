// The old .spell-detail* class names are kept as CSS aliases in style.css so render files
// that haven't migrated to .item-detail* yet still work.

import { t } from "../localization/pt-BR/index.js";

// ± buttons are wired globally in events/index.js, which reads data-step/data-min/data-max
// off the input — pass bounds via dataAttrs, not native min/max/step (input is type="text").
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

// Deliberately not a hover-only tooltip: mobile-first app, so the delta is always visible
// rather than hidden behind a hover most users can't trigger. `title` is still set as a bonus
// for mouse users, caller-supplied since each equipment type localizes its own string.
export function withEnchantmentBadge(
  finalValue,
  delta,
  { suffix = "", title = "" } = {},
) {
  if (finalValue == null) return "—";
  if (!delta) return `${finalValue}`;

  const sign = delta > 0 ? "+" : "";
  return `${finalValue}<span class="detail-enchantment-badge" title="${title}">${sign}${delta}${suffix}</span>`;
}

export function formatRichText(raw) {
  if (!raw || raw.trim() === "") return "—";

  const parsed = raw
    .split("\n")
    .map((l) => {
      const match = l.match(/^(\s*)(.*)$/);
      const indent = match[1].replace(/\t/g, "    ").length;
      return { indent, text: match[2].trim() };
    })
    .filter((l) => l.text.length > 0);

  const bulletLines = parsed.filter((l) => l.text.startsWith("-"));

  if (bulletLines.length === 0)
    return `<p class="scaling-note">${raw.trim()}</p>`;

  const uniqueIndents = [...new Set(bulletLines.map((l) => l.indent))].sort(
    (a, b) => a - b,
  );
  const levelOf = (indent) => uniqueIndents.indexOf(indent);

  const items = bulletLines.map((l) => ({
    level: levelOf(l.indent),
    content: l.text.slice(1).trim(),
  }));

  const note = parsed
    .filter((l) => !l.text.startsWith("-"))
    .map((l) => l.text)
    .join(" ");

  const list = _buildNestedList(items);

  return `${list}${note ? `<p class="scaling-note">${note}</p>` : ""}`;
}

function _buildNestedList(items) {
  const root = { children: [] };
  const stack = [{ level: -1, node: root }];

  for (const item of items) {
    while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].node;
    const node = { content: item.content, children: [] };
    parent.children.push(node);
    stack.push({ level: item.level, node });
  }

  const render = (node) =>
    node.children.length
      ? `<ul class="scaling-list">${node.children
          .map((child) => `<li>${child.content}${render(child)}</li>`)
          .join("")}</ul>`
      : "";

  return render(root);
}

function _buildDetailContent(fields) {
  return fields
    .filter(({ value }) => value && value !== "—")
    .map(({ label, value, rich }) =>
      rich
        ? `<div class="item-detail-block"><em>${label}:</em>${value}</div>`
        : `<span class="item-detail"><em>${label}:</em> ${value}</span>`,
    )
    .join("");
}

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

export function emptyRow(colspan) {
  return `<tr class="empty-row"><td colspan="${colspan}">—</td></tr>`;
}

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

// Kept generic (not accessory-specific) for adoption by other equipment types once they gain
// the same custom_* fields. Edit form is detached/uncontrolled — nothing writes to state on
// keystroke, only "Salvar"/"Cancelar" — and open/closed editor state is tracked module-level
// (keyed by _instanceId) so it survives re-renders triggered by unrelated actions.
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

export function readCustomFieldsEditorValues(instanceId) {
  const container = document.querySelector(
    `.custom-fields-block[data-instance-id="${instanceId}"]`,
  );
  if (!container) return null;

  return {
    name: container.querySelector(".custom-fields-input-name")?.value ?? "",
    description:
      container.querySelector(".custom-fields-input-description")?.value ?? "",
    effect: container.querySelector(".custom-fields-input-effect")?.value ?? "",
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

// Mirrors equippedDetailBlock's wrapper exactly, so open/closed state survives re-renders via
// the existing generic openState.js key functions.
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

// Unlike customFieldsBlock (optional flavor on top of catalog data), a custom-inventory entry
// has no catalog record behind it — name/weight/price/description ARE the item — so this lets
// the person edit those fields directly. Reuses customFieldsBlock's editor-state Set (keyed
// generically by id) so the interaction pattern (read-only → "Editar" → uncontrolled form →
// "Salvar"/"Cancelar") stays identical.
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

export function customItemEditRow(
  colspan,
  { customItemId, name, weight, price, description },
) {
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
