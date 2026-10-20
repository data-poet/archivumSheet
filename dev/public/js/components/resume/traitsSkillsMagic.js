import { t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import {
  collapsibleHeader,
  bindCollapse,
  renderCollapsibleNameList,
  formatCritical,
} from "./shared.js";
import { conditionCell } from "../../shared/conditionDisplay.js";

export function renderResumeTraits(sheet) {
  const advantages = sheet?.character?.advantages || {};
  const disadvantages = sheet?.character?.disadvantages || {};

  renderCollapsibleNameList(
    "resume_advantages_container",
    Object.values(advantages),
    t("resume.advantages"),
  );
  renderCollapsibleNameList(
    "resume_disadvantages_container",
    Object.values(disadvantages),
    t("resume.disadvantages"),
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
  const entries = Object.entries(skills)
    .filter(([id]) => !shown.has(id))
    .map(([, skill]) => skill);
  const container = el("resume_skills_container");
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = entries
    .map(
      (s) => `
      <tr>
        <td>${s.name ?? "—"}</td>
        <td class="col-num">${conditionCell(s, "value")}</td>
        <td class="col-num resume-critical">${formatCritical(s.critical)}</td>
        <td class="col-num">${conditionCell(s, "parry")}</td>
        <td class="col-num">${s.actions ?? "—"}</td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(t("resume.skills"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
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
    </div>
  `;
  bindCollapse(container);
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
        <tr>
          <td>${s.name ?? "—"}</td>
          <td class="col-num">${cost}</td>
          <td class="col-num">${conditionCell(s, "value")}</td>
          <td class="col-num resume-critical">${formatCritical(s.critical)}</td>
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(t("resume.spells"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
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
    </div>
  `;
  bindCollapse(container);
}
