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
// into an HTML list + optional note paragraph.
// ─────────────────────────────────────────────────────────────────────────────
export function formatRichText(raw) {
  if (!raw || raw.trim() === "") return "—";

  const lines       = raw.split("\n").map(l => l.trim());
  const bulletLines = lines.filter(l => l.startsWith("-"));

  if (bulletLines.length === 0)
    return `<p class="scaling-note">${raw.trim()}</p>`;

  const items = bulletLines.map(l => `<li>${l.slice(1).trim()}</li>`).join("");
  const note  = lines
    .filter(l => l.length > 0 && !l.startsWith("-"))
    .join(" ");

  return `<ul class="scaling-list">${items}</ul>${note ? `<p class="scaling-note">${note}</p>` : ""}`;
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
