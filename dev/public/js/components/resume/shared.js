// Cross-section resume helpers: the collapsible-section machinery and the two
// stepper cells reused by the equipment and supplies sections.

import { t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { morphHTML } from "../../shared/morph.js";
import { modifiedNumber } from "../../shared/conditionDisplay.js";
import { calcActualHp } from "../../engine/inventory/shared/durabilityUtils.js";
import { cardTitleCell } from "../../shared/renderUtils.js";

const _collapseOpen = new Map();

// A consult-only cell deliberately carries neither an <input> nor the stepper's class:
// the delegated handlers in engine/**/events.js match on that class, so omitting it makes
// an unwritable sheet (an ally) structurally unable to dispatch a write, not just guarded.
function stepperCell({
  tdClass = "",
  dataLabel,
  wrapped = true,
  cssClass,
  dataAttrs,
  inputAttrs = "",
  inputStyle = "",
  value,
  suffix = "",
}) {
  const stepper = `
        <div class="num-stepper">
          <input
            type="text"
            inputmode="numeric"
            class="${cssClass}"
            ${dataAttrs}
            ${inputAttrs}
            value="${value}"
            ${inputStyle ? `style="${inputStyle}"` : ""}
          />
          <div class="stepper-btns">
            <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
            <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
          </div>
        </div>`;

  const body = wrapped
    ? `<div class="hp-modifier">${stepper}${suffix}</div>`
    : stepper;

  const classAttr = tdClass ? ` class="${tdClass}"` : "";
  const labelAttr = dataLabel ? ` data-label="${dataLabel}"` : "";
  return `<td${classAttr}${labelAttr}>${body}</td>`;
}

export function hpStepperCell({
  cssClass,
  dataAttrs,
  maxHp,
  modifier,
  actualHp,
  dataLabel,
}) {
  const actual = `<strong class="resume-hp-actual">${actualHp}</strong>/<strong>${maxHp}</strong>`;

  return stepperCell({
    cssClass,
    dataAttrs,
    value: modifier,
    suffix: actual,
    dataLabel,
  });
}

export function roundsStepperCell({
  cssClass,
  dataAttrs,
  magazineSize,
  roundsLoaded,
  dataLabel,
}) {
  const suffix = `/ <strong>${magazineSize}</strong>`;

  return stepperCell({
    cssClass,
    dataAttrs,
    inputAttrs: `data-min="0" data-max="${magazineSize}"`,
    value: roundsLoaded,
    suffix,
    dataLabel,
  });
}

export function quantityStepperCell({
  cssClass,
  dataAttrs,
  quantity,
  dataLabel,
}) {
  return stepperCell({
    tdClass: "col-num",
    wrapped: false,
    cssClass,
    dataAttrs,
    inputStyle: "width:50px",
    value: quantity,
    dataLabel,
  });
}

export function collapsibleHeader(title, { defaultOpen = false } = {}) {
  return `
    <button class="resume-section-toggle" type="button" aria-expanded="false" data-default-open="${defaultOpen}">
      <span class="resume-expander-arrow">&#8250;</span>
      <span class="resume-section-title">${title}</span>
    </button>
  `;
}

// Scoped per toggle (its own parent, not the whole container) so a card with nested
// collapsibles — conditions.js wraps its own card toggle around the edit-list's toggle —
// gets each one's initial state set independently, matching the click handler's own scoping.
export function bindCollapse(container) {
  container.querySelectorAll(".resume-section-toggle").forEach((btn) => {
    const body = btn.parentElement?.querySelector(".resume-collapse-body");
    if (!body) return;

    const title = btn.querySelector(".resume-section-title")?.textContent ?? "";
    const defaultOpen = btn.dataset.defaultOpen === "true";
    const isOpen = _collapseOpen.get(title) ?? defaultOpen;

    body.hidden = !isOpen;
    btn.setAttribute("aria-expanded", String(isOpen));
    const arrow = btn.querySelector(".resume-expander-arrow");
    if (arrow) arrow.classList.toggle("resume-expander-arrow--open", isOpen);
  });
}

// Shared shape for melee/ranged/firearms' equipped-weapon tables: a name column, caller-supplied
// stat columns, and an HP stepper (maxHp computed per weapon type — melee alone falls back to a
// derived value when weapon_final_hit_points is absent, so that stays a per-caller function
// rather than a fixed field name). `secondaryStepper` (firearms' loaded-rounds) shares the HP
// rather than a fixed field name), and an optional extra column (firearms' loaded-rounds stepper).
export function renderResumeWeaponTable({
  containerId,
  title,
  weapons,
  columns,
  hpCssClass,
  computeMaxHp,
  extraHeader = "",
  extraCell = null,
}) {
  const container = el(containerId);
  if (!container) return;

  if (weapons.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = weapons
    .map((w, i) => {
      const maxHp = computeMaxHp(w);
      const modifier = w.hit_points_modifier ?? 0;
      const actualHp = calcActualHp(maxHp, modifier);
      const instanceId = w.id ?? "";
      // Unarmed entries (no instance id — they're derived from skills, not equipped gear)
      // still need a stable row id for the morph to track; their position is all there is.
      const rowId = instanceId
        ? `resume-weapon-${containerId}-${instanceId}`
        : `resume-weapon-${containerId}-unarmed-${i}`;

      const hpLabel = t("armor.hp");
      const hpCell =
        maxHp > 0
          ? hpStepperCell({
              cssClass: hpCssClass,
              dataAttrs: `data-instance-id="${instanceId}"`,
              maxHp,
              modifier,
              actualHp,
              dataLabel: hpLabel,
            })
          : `<td data-label="${hpLabel}"></td>`;

      const statCells = columns
        .map(
          (col) =>
            `<td class="col-num${col.tdClass ? ` ${col.tdClass}` : ""}" data-label="${col.header}">${col.cell(w)}</td>`,
        )
        .join("");

      return `
        <tr id="${rowId}">
          ${cardTitleCell(w.weapon_name ?? "—")}
          ${statCells}
          ${hpCell}
          ${extraCell ? extraCell(w, instanceId) : ""}
        </tr>
      `;
    })
    .join("");

  const headerCells = columns
    .map((col) => `<th class="col-num">${col.header}</th>`)
    .join("");

  morphHTML(
    container,
    `
    ${collapsibleHeader(title, { defaultOpen: true })}
    <div class="resume-collapse-body">
      <div class="table-wrapper table-wrapper--stack">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              ${headerCells}
              <th class="col-num">${t("armor.hp")}</th>
              ${extraHeader}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `,
  );
  bindCollapse(container);
}

// Row keys across the resume are mostly dataset ids (safe as bare DOM ids already) but some
// are display names (advantages/disadvantages/grimoire) with no character guarantee.
export function safeId(raw) {
  return String(raw).replace(/[^a-zA-Z0-9_-]+/g, "-");
}

export function formatCritical(critical) {
  return critical ? `≤${critical.success} · ≥${critical.failure}` : "—";
}

// A defaulted or ST-penalized NH gets a "*" and a tooltip naming the source, so it isn't mistaken for a trained level.
export function nhCell(check, skills = {}) {
  if (!check || check.level == null) return "—";

  const notes = [];
  if (check.source?.type === "skill") {
    const name = skills[check.source.skill_id]?.name ?? check.source.skill_id;
    notes.push(`padrão: ${name} ${check.source.penalty}`);
  } else if (check.source?.type === "attribute") {
    notes.push(`padrão: ${check.source.attribute} ${check.source.penalty}`);
  }
  if (check.st_penalty > 0) notes.push(`ST -${check.st_penalty}`);

  const baseHtml =
    notes.length === 0
      ? String(check.level)
      : `<span class="resume-nh-default" title="${notes.join(" · ")}">${check.level}*</span>`;
  if (check.effective_level == null) return baseHtml;

  return modifiedNumber({
    base: check.level,
    baseHtml,
    effective: check.effective_level,
  });
}

// entries are [id, item] pairs (e.g. Object.entries(sheet.character.advantages)) — the id is
// only ever the object key, never a field on the item itself, so it can't be dropped upstream.
export function renderCollapsibleNameList(containerId, entries, title) {
  const container = el(containerId);
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = entries
    .map(
      ([id, item]) =>
        `<tr id="resume-trait-${containerId}-${safeId(id)}"><td>${item.name ?? "—"}</td></tr>`,
    )
    .join("");

  morphHTML(
    container,
    `
    ${collapsibleHeader(title)}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `,
  );
  bindCollapse(container);
}

let _expandersBound = false;
export function initResumeExpanders() {
  if (_expandersBound) return;
  _expandersBound = true;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".resume-section-toggle");
    if (!btn) return;
    const parent = btn.parentElement;
    if (!parent) return;
    const body = parent.querySelector(".resume-collapse-body");
    if (!body) return;

    const isOpen = body.hidden === false;
    const title = btn.querySelector(".resume-section-title")?.textContent ?? "";

    body.hidden = isOpen;
    btn.setAttribute("aria-expanded", String(!isOpen));
    const arrow = btn.querySelector(".resume-expander-arrow");
    if (arrow) arrow.classList.toggle("resume-expander-arrow--open", !isOpen);

    _collapseOpen.set(title, !isOpen);
  });
}
