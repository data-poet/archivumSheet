/**
 * Shared rendering utilities for detail rows across all list renders.
 */

import { t } from "../../localization/pt-BR.js";

export function formatRichText(raw) {
  if (!raw || raw.trim() === "") return "—";

  const lines = raw.split("\n").map((l) => l.trim());
  const bulletLines = lines.filter((l) => l.startsWith("-"));

  if (bulletLines.length === 0)
    return `<p class="scaling-note">${raw.trim()}</p>`;

  const items = bulletLines
    .map((l) => `<li>${l.slice(1).trim()}</li>`)
    .join("");
  const note = lines
    .filter((l) => l.length > 0 && !l.startsWith("-"))
    .join(" ");

  return `<ul class="scaling-list">${items}</ul>${note ? `<p class="scaling-note">${note}</p>` : ""}`;
}

export function detailRow(colspan, fields) {
  const content = fields
    .filter(({ value }) => value && value !== "—")
    .map(({ label, value, rich }) =>
      rich
        ? `<div class="spell-detail-block"><em>${label}:</em>${value}</div>`
        : `<span class="spell-detail"><em>${label}:</em> ${value}</span>`,
    )
    .join("");

  if (!content) return "";

  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        <details>
          <summary>${t("common.details")}</summary>
          <div class="spell-detail-grid">${content}</div>
        </details>
      </td>
    </tr>`;
}

/**
 * Detail block for equipped items (div-based, not table-row).
 * Attaches below the .equipped-slot-grid.
 */
export function equippedDetailBlock(fields) {
  const content = fields
    .filter(({ value }) => value && value !== "—")
    .map(({ label, value, rich }) =>
      rich
        ? `<div class="spell-detail-block"><em>${label}:</em>${value}</div>`
        : `<span class="spell-detail"><em>${label}:</em> ${value}</span>`,
    )
    .join("");

  if (!content) return "";

  return `
    <div class="equipped-detail">
      <details>
        <summary>${t("common.details")}</summary>
        <div class="spell-detail-grid">${content}</div>
      </details>
    </div>`;
}
