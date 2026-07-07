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
