// The conditions card: one entry per active condition, what the engine made of them, and the full list to toggle from.

import { LABELS, t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { escapeAttr, escapeHtml } from "../../shared/renderUtils.js";
import { collapsibleHeader, bindCollapse } from "./shared.js";
import {
  signedModifier,
  conditionCell,
} from "../../shared/conditionDisplay.js";

export const TARGET_ORDER = [
  "DX",
  "IQ",
  "Per",
  "skills",
  "all_rolls",
  "self_control",
  "defense",
];
export const TAG_ORDER = [
  "stunned",
  "incapacitated",
  "unconscious",
  "paralyzed",
  "cannot_act",
];

function _immuneTitle(immunity) {
  return t("conditions.immuneTitle").replace(
    "{trait}",
    immunity.trait_name ?? immunity.trait_key,
  );
}

// The engine closes the tags (paralysis brings stunned and cannot_act); only the ones no other tag implies are worth showing.
function _visibleTags(tags, implies) {
  return tags.filter(
    (tag) =>
      !tags.some((other) => other !== tag && implies[other]?.includes(tag)),
  );
}

function _summaryLine({ modifiers, tags }, implies) {
  const numbers = TARGET_ORDER.filter((target) => modifiers[target]).map(
    (target) =>
      `${LABELS.conditions.targets[target]} ${signedModifier(modifiers[target])}`,
  );
  const shown = _visibleTags(tags, implies);
  const statuses = TAG_ORDER.filter((tag) => shown.includes(tag)).map(
    (tag) => LABELS.conditions.tags[tag],
  );
  return [...numbers, ...statuses].join(" · ");
}

// The number to roll under is the sheet's own, conditions included; without it (the engine has not run) only the name shows.
function _recoveryHtml({ attributes, interval }, attributeEntries) {
  const targets = attributes.map((attribute) => {
    const label = escapeHtml(
      LABELS.conditions.attributes[attribute] ?? attribute,
    );
    const entry = attributeEntries[attribute];
    return entry?.value == null
      ? label
      : `${label} ${conditionCell(entry, "value")}`;
  });
  const when = escapeHtml(LABELS.conditions.intervals[interval] ?? interval);

  return `${escapeHtml(t("conditions.recovery"))}: ${targets.join(escapeHtml(t("conditions.recoveryOr")))} ${when}`;
}

function _entry({ row, immunity, notes }) {
  const key = row.condition_key;
  const name = escapeHtml(row.condition_name);
  const label = `${t("conditions.removeTitle")}: ${row.condition_name}`;
  const noteItems = notes.map((note) => `<li>${note}</li>`).join("");

  return `
    <li class="condition-entry${immunity ? " condition-entry--immune" : ""}"${immunity ? ` title="${escapeAttr(_immuneTitle(immunity))}"` : ""}>
      <span class="condition-entry-head">
        <span class="condition-entry-name">${name}${immunity ? ` (${t("conditions.immune")})` : ""}</span>
        <button type="button" class="condition-remove"
          data-condition-key="${escapeAttr(key)}"
          title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}">×</button>
      </span>
      ${noteItems ? `<ul class="condition-entry-notes">${noteItems}</ul>` : ""}
    </li>`;
}

// A flag the engine dropped (unknown or excluded) has nothing to show; an immune one is shown so it can still be removed.
function _activeList(catalog, flags, immune, resolved, attributeEntries) {
  const active = new Set((resolved?.active ?? []).map((c) => c.key));
  const recoveryOf = new Map(
    (resolved?.recoveries ?? []).map((r) => [r.key, r]),
  );
  const reminderOf = new Map(
    (resolved?.reminders ?? []).map((r) => [r.key, r.text]),
  );

  return catalog
    .filter((row) => flags[row.condition_key])
    .map((row) => {
      const key = row.condition_key;
      const immunity = immune.get(key);
      if (!immunity && !active.has(key)) return "";

      const notes = [];
      if (!immunity && recoveryOf.has(key)) {
        notes.push(_recoveryHtml(recoveryOf.get(key), attributeEntries));
      }
      if (!immunity && reminderOf.has(key)) {
        notes.push(escapeHtml(reminderOf.get(key)));
      }

      return _entry({ row, immunity, notes });
    })
    .join("");
}

function _checklist(catalog, flags, immune) {
  const groups = [];
  catalog.forEach((row) => {
    const name = row.condition_group;
    let group = groups.find((g) => g.name === name);
    if (!group) groups.push((group = { name, rows: [] }));
    group.rows.push(row);
  });

  return groups
    .map(({ name, rows }) => {
      const options = rows
        .map((row) => {
          const key = row.condition_key;
          const immunity = immune.get(key);
          const hint = immunity
            ? _immuneTitle(immunity)
            : row.condition_reminders;
          return `
            <label class="condition-option${immunity ? " is-immune" : ""}"${hint ? ` title="${escapeAttr(hint)}"` : ""}>
              <input type="checkbox" class="condition-toggle"
                data-condition-key="${escapeAttr(key)}"
                ${flags[key] ? "checked" : ""} ${immunity ? "disabled" : ""} />
              <span>${escapeHtml(row.condition_name)}</span>
            </label>`;
        })
        .join("");
      return `
        <fieldset class="conditions-group">
          <legend>${escapeHtml(LABELS.conditions.groups[name] ?? name)}</legend>
          ${options}
        </fieldset>`;
    })
    .join("");
}

export function renderResumeConditions(sheet, data = {}, selected = {}) {
  const container = el("resume_conditions_container");
  if (!container) return;

  const catalog = data.conditions ?? [];
  if (catalog.length === 0) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  container.hidden = false;

  const flags = selected.conditions ?? {};
  const resolved = sheet?.character?.conditions;
  const immune = new Map(
    (sheet?.character?.condition_immunities ?? []).map((i) => [i.key, i]),
  );
  const implies = data.rules?.CONDITION_RULES?.tagImplies ?? {};

  const attributeEntries = {
    ...sheet?.character?.secondary_attributes,
    ...sheet?.character?.primary_attributes,
  };
  const entries = _activeList(
    catalog,
    flags,
    immune,
    resolved,
    attributeEntries,
  );
  const summary = resolved ? _summaryLine(resolved, implies) : "";

  container.innerHTML = `
    <h3 class="resume-col-title">${t("conditions.title")}</h3>
    ${
      entries
        ? `<ul class="conditions-active">${entries}</ul>`
        : `<p class="conditions-none">${t("conditions.noneActive")}</p>`
    }
    ${summary ? `<p class="conditions-summary">${escapeHtml(summary)}</p>` : ""}
    <div class="conditions-list">
      ${collapsibleHeader(t("conditions.listToggle"))}
      <div class="resume-collapse-body">
        ${_checklist(catalog, flags, immune)}
        <button type="button" class="conditions-clear">${t("conditions.clear")}</button>
      </div>
    </div>
  `;
  bindCollapse(container);
}
