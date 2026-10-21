import { t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { morphHTML } from "../../shared/morph.js";
import {
  renderNameList,
  formatCritical,
  safeId,
} from "./shared.js";
import { conditionCell } from "../../shared/conditionDisplay.js";
import { cardTitleCell } from "../../shared/renderUtils.js";

export function renderResumeTraits(sheet) {
  const advantages = sheet?.character?.advantages || {};
  const disadvantages = sheet?.character?.disadvantages || {};

  renderNameList("resume_advantages_container", Object.entries(advantages));
  renderNameList(
    "resume_disadvantages_container",
    Object.entries(disadvantages),
  );
}

// Hides a skill already shown through an equipped weapon, shield or unarmed row, so it isn't listed twice.
function _shownSkillIds(sheet) {
  const ids = new Set();
  const add = (check) => {
    if (check?.skill_id) ids.add(check.skill_id);
  };

  (sheet?.inventory?.melee?.equipped ?? []).forEach((w) => add(w.skill_check));
  (sheet?.inventory?.ranged?.equipped ?? []).forEach((w) => add(w.skill_check));
  (sheet?.inventory?.firearms?.equipped ?? []).forEach((w) =>
    add(w.skill_check),
  );
  add(sheet?.inventory?.shield?.equipped?.skill_check);
  (sheet?.character?.unarmed ?? []).forEach((u) => {
    if (u.skill_id) ids.add(u.skill_id);
  });

  return ids;
}

export function renderResumeSkills(sheet) {
  const skills = sheet?.character?.skills || {};
  const shown = _shownSkillIds(sheet);
  const entries = Object.entries(skills).filter(([id]) => !shown.has(id));
  const container = el("resume_skills_container");
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = entries
    .map(
      ([id, s]) => `
      <tr id="resume-skill-${id}">
        ${cardTitleCell(s.name ?? "—")}
        <td class="col-num" data-label="${t("traits.final")}">${conditionCell(s, "value")}</td>
        <td class="col-num resume-critical" data-label="${t("traits.critical")}">${formatCritical(s.critical)}</td>
        <td class="col-num" data-label="${t("traits.parry")}">${conditionCell(s, "parry")}</td>
        <td class="col-num" data-label="${t("traits.actions")}">${s.actions ?? "—"}</td>
      </tr>
    `,
    )
    .join("");

  morphHTML(
    container,
    `
    <div class="table-wrapper table-wrapper--stack">
      <table class="resume-table resume-table--skills">
        <thead>
          <tr>
            <th>${t("common.name")}</th>
            <th class="col-num">${t("traits.final")}</th>
            <th class="col-num">${t("traits.critical")}</th>
            <th class="col-num">${t("traits.parry")}</th>
            <th class="col-num">${t("traits.actions")}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `,
  );
}

export function renderResumeMagic(sheet, data) {
  const spells = sheet?.grimoire || {};
  const spellsDb = data?.spells ?? [];
  const entries = Object.entries(spells);
  const container = el("resume_magic_container");
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = entries
    .map(([id, s]) => {
      const dbRow = spellsDb.find((r) => r.spell_id === id);
      const cost = dbRow?.spell_cost ?? "—";
      return `
        <tr id="resume-spell-${safeId(id)}">
          ${cardTitleCell(s.name ?? "—")}
          <td class="col-num" data-label="${t("traits.spellCost")}">${cost}</td>
          <td class="col-num" data-label="${t("traits.final")}">${conditionCell(s, "value")}</td>
          <td class="col-num resume-critical" data-label="${t("traits.critical")}">${formatCritical(s.critical)}</td>
        </tr>
      `;
    })
    .join("");

  morphHTML(
    container,
    `
    <div class="table-wrapper table-wrapper--stack">
      <table class="resume-table resume-table--magic">
        <thead>
          <tr>
            <th>${t("common.name")}</th>
            <th class="col-num">${t("traits.spellCost")}</th>
            <th class="col-num">${t("traits.final")}</th>
            <th class="col-num">${t("traits.critical")}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `,
  );
}
