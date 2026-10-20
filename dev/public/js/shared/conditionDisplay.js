// How a number modified by an active condition is written, wherever it appears (the resume and the edit tables).

import { t } from "../localization/pt-BR/index.js";
import { escapeAttr } from "./renderUtils.js";

export function signedModifier(value) {
  return `${value < 0 ? "−" : "+"}${Math.abs(value)}`;
}

// The number you actually roll, with the unmodified one beside it; the tooltip gives the total the conditions add.
export function modifiedNumber({ base, baseHtml = String(base), effective }) {
  const title = t("conditions.modifiedTitle")
    .replace("{modifier}", signedModifier(effective - base))
    .replace("{base}", base);
  return `<span class="condition-modified" title="${escapeAttr(title)}">${effective} <span class="condition-base">(${baseHtml})</span></span>`;
}

// A plain number, or `effective (base)` when the engine attached an effective_<field> to the entry.
export function conditionCell(entry, field) {
  const base = entry?.[field];
  if (base == null) return "—";

  const effective = entry[`effective_${field}`];
  return effective == null ? String(base) : modifiedNumber({ base, effective });
}
