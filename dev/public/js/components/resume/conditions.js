// The conditions card: one entry per active condition, what the engine made of them, and the full list to toggle from.

import { LABELS, t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { morphHTML } from "../../shared/morph.js";
import { escapeAttr, escapeHtml } from "../../shared/renderUtils.js";
import { collapsibleHeader, bindCollapse, safeId } from "./shared.js";
import {
  signedModifier,
  conditionCell,
} from "../../shared/conditionDisplay.js";
import { referenceHref } from "../../layout/referenceLinks.js";

function _immuneTitle(immunity) {
  return t("conditions.immuneTitle").replace(
    "{trait}",
    immunity.trait_name ?? immunity.trait_key,
  );
}

// The engine closes the tags (paralysis brings stunned and cannot_act); only the ones no other tag implies are worth showing.
function _visibleTags(tags, ruleTags) {
  return tags.filter(
    (tag) =>
      !tags.some(
        (other) => other !== tag && ruleTags[other]?.implies?.includes(tag),
      ),
  );
}

// The labels' key order is the order the summary lists targets and tags in.
function _summaryLine({ modifiers, tags }, ruleTags) {
  const numbers = Object.keys(LABELS.conditions.targets)
    .filter((target) => modifiers[target])
    .map(
      (target) =>
        `${LABELS.conditions.targets[target]} ${signedModifier(modifiers[target])}`,
    );
  const shown = _visibleTags(tags, ruleTags);
  const statuses = Object.keys(LABELS.conditions.tags)
    .filter((tag) => shown.includes(tag))
    .map((tag) => LABELS.conditions.tags[tag]);
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

function _scaleMark(scale) {
  if (!scale) return "";
  const text = LABELS.conditions.scales[scale] ?? `×${scale}`;
  return ` <span class="condition-scale" title="${escapeAttr(t("conditions.scaledTitle"))}">(${escapeHtml(text)})</span>`;
}

// The name opens the rule in the reference; a condition with no anchor stays plain text.
function _nameHtml(row) {
  const name = escapeHtml(row.condition_name);
  const anchor = row.condition_reference_anchor;
  if (!anchor) return name;

  return `<a class="condition-entry-link" href="${escapeAttr(referenceHref(anchor))}" target="_blank" rel="noopener noreferrer" title="${escapeAttr(t("conditions.ruleTitle"))}">${name}</a>`;
}

// `scope` namespaces ids by container (the resume card and the edit tab run this same
// template into two different containers, live in the DOM at once — a bare condition_key
// would collide between them).
function _entry(scope, { row, immunity, scale, notes }) {
  const key = row.condition_key;
  const name = _nameHtml(row);
  const label = `${t("conditions.removeTitle")}: ${row.condition_name}`;
  const noteItems = notes.map((note) => `<li>${note}</li>`).join("");

  return `
    <li id="${scope}-active-${safeId(key)}" class="condition-entry${immunity ? " condition-entry--immune" : ""}"${immunity ? ` title="${escapeAttr(_immuneTitle(immunity))}"` : ""}>
      <span class="condition-entry-head">
        <span class="condition-entry-name">${name}${immunity ? ` (${t("conditions.immune")})` : ""}${_scaleMark(scale)}</span>
        <button type="button" class="condition-remove"
          data-condition-key="${escapeAttr(key)}"
          title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}">×</button>
      </span>
      ${noteItems ? `<ul class="condition-entry-notes">${noteItems}</ul>` : ""}
    </li>`;
}

// A flag the engine dropped (unknown or excluded) has nothing to show; an immune one is shown so it can still be removed.
function _activeList(
  scope,
  catalog,
  flags,
  immune,
  resolved,
  attributeEntries,
) {
  const active = new Map((resolved?.active ?? []).map((c) => [c.key, c]));
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

      return _entry(scope, {
        row,
        immunity,
        scale: active.get(key)?.scale,
        notes,
      });
    })
    .join("");
}

function _checklist(scope, catalog, flags, immune) {
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
            <label id="${scope}-option-${safeId(key)}" class="condition-option${immunity ? " is-immune" : ""}"${hint ? ` title="${escapeAttr(hint)}"` : ""}>
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

// The edit tab shows the list open under its own tab title, so it drops the heading and the collapse toggle.
function _renderCard(container, sheet, data, selected, { inTab }) {
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
  const ruleTags = data.rules?.CONDITION_RULES?.tags ?? {};

  const attributeEntries = {
    ...sheet?.character?.secondary_attributes,
    ...sheet?.character?.primary_attributes,
  };
  const scope = container.id;
  const entries = _activeList(
    scope,
    catalog,
    flags,
    immune,
    resolved,
    attributeEntries,
  );
  const summary = resolved ? _summaryLine(resolved, ruleTags) : "";
  const list = `
    ${_checklist(scope, catalog, flags, immune)}
    <button type="button" class="conditions-clear">${t("conditions.clear")}</button>`;

  morphHTML(
    container,
    `
    ${inTab ? "" : `<h3 class="resume-col-title">${t("conditions.title")}</h3>`}
    ${
      entries
        ? `<ul class="conditions-active">${entries}</ul>`
        : `<p class="conditions-none">${t("conditions.noneActive")}</p>`
    }
    ${summary ? `<p class="conditions-summary">${escapeHtml(summary)}</p>` : ""}
    <div class="conditions-list">
      ${
        inTab
          ? list
          : `${collapsibleHeader(t("conditions.listToggle"))}
      <div class="resume-collapse-body">${list}</div>`
      }
    </div>
  `,
  );
  if (!inTab) bindCollapse(container);
}

export function renderResumeConditions(sheet, data = {}, selected = {}) {
  const container = el("resume_conditions_container");
  if (!container) return;

  _renderCard(container, sheet, data, selected, { inTab: false });
}

// Silent when the tab is absent: only the full page has it.
export function renderEditConditions(sheet, data = {}, selected = {}) {
  const container = document.getElementById("edit_conditions_container");
  if (!container) return;

  _renderCard(container, sheet, data, selected, { inTab: true });
}
