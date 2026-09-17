import { t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import {
  collapsibleHeader,
  bindCollapse,
  renderCollapsibleNameList,
} from "./shared.js";

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

export function renderResumeSkills(sheet) {
  const skills = sheet?.character?.skills || {};
  const entries = Object.values(skills);
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
        <td class="col-num">${s.value ?? "—"}</td>
        <td class="col-num">${s.parry != null ? s.parry : "—"}</td>
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
          <td class="col-num">${s.value ?? "—"}</td>
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
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  bindCollapse(container);
}
