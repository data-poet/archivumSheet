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

  return _splitIntoBlocks(raw.split("\n"))
    .map((block) =>
      block.type === "table" ? _buildTable(block.rows) : _formatTextBlock(block.lines),
    )
    .join("");
}

// A GFM-style pipe table is only recognized when a "|"-bearing line is immediately
// followed by a separator line (cells of just dashes/colons) — otherwise ordinary
// prose that happens to contain "|" would be misread as a table.
const TABLE_SEPARATOR_CELL_RE = /^:?-+:?$/;

function _isTableStart(lines, i) {
  const header = lines[i];
  const separator = lines[i + 1];
  if (header == null || separator == null) return false;
  if (!header.includes("|")) return false;

  const sepCells = _splitTableRow(separator);
  return (
    sepCells.length > 0 &&
    sepCells.every((cell) => TABLE_SEPARATOR_CELL_RE.test(cell))
  );
}

function _splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function _splitIntoBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    if (_isTableStart(lines, i)) {
      const rows = [_splitTableRow(lines[i])];
      i += 2; // header + separator

      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(_splitTableRow(lines[i]));
        i++;
      }

      blocks.push({ type: "table", rows });
    } else {
      const start = i;
      while (i < lines.length && !_isTableStart(lines, i)) i++;
      blocks.push({ type: "text", lines: lines.slice(start, i) });
    }
  }

  return blocks;
}

function _buildTable(rows) {
  const [headerCells, ...bodyRows] = rows;
  const head = `<thead><tr>${headerCells
    .map((cell) => `<th>${cell}</th>`)
    .join("")}</tr></thead>`;
  const body = bodyRows.length
    ? `<tbody>${bodyRows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody>`
    : "";

  return `<div class="scaling-table-wrapper"><table class="scaling-table">${head}${body}</table></div>`;
}

function _formatTextBlock(lines) {
  const parsed = lines
    .map((l) => {
      const match = l.match(/^(\s*)(.*)$/);
      const indent = match[1].replace(/\t/g, "    ").length;
      return { indent, text: match[2].trim() };
    })
    .filter((l) => l.text.length > 0);

  if (parsed.length === 0) return "";

  const bulletLines = parsed.filter((l) => l.text.startsWith("-"));

  if (bulletLines.length === 0)
    return `<p class="scaling-note">${parsed.map((l) => l.text).join(" ")}</p>`;

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

export function buildDetailContent(fields) {
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
  const content = buildDetailContent(fields);
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

export function customFieldsBody({ instanceId, name, description, effect }) {
  if (isCustomFieldsEditorOpen(instanceId)) {
    return `
      <div class="custom-fields-block custom-fields-block--editing" data-instance-id="${instanceId}">
        <div class="item-detail-grid custom-fields-grid">
          <label class="item-detail-field item-detail-field--full">
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
              ${name ? `<div class="item-detail-field item-detail-field--full"><em>${t("common.customName")}</em><span>${escapeHtml(name)}</span></div>` : ""}
              ${description ? `<div class="item-detail-field item-detail-field--full"><em>${t("common.customDescription")}</em><span>${escapeHtml(description)}</span></div>` : ""}
              ${effect ? `<div class="item-detail-field item-detail-field--full"><em>${t("common.customEffect")}</em><span>${escapeHtml(effect)}</span></div>` : ""}
            </div>`
          : `<p class="custom-fields-empty">${t("common.noCustomFields")}</p>`
      }
      <button type="button" class="custom-fields-edit-btn" data-instance-id="${instanceId}">${t("common.customize")}</button>
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
