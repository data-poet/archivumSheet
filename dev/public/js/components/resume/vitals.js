// Identity, experience, and the attribute/bar readouts at the top of the resume.

import {
  t,
  getSecondaryAttributeLabel,
  getExperienceRankName,
} from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { getExperienceRank } from "../../engine/character/experienceRank.js";
import { collapsibleHeader, bindCollapse } from "./shared.js";

export function renderResumeHeader(sheet) {
  const nameEl = el("resume_header_name");
  if (!nameEl) return;

  const charName = sheet?.pc?.character_name || "";
  const subRace = sheet?.race?.race_sub_name || "";
  const separator = charName && subRace ? " | " : "";

  nameEl.textContent = charName + separator + subRace;
}

export function renderExperienceBar(sheet) {
  const container = el("resume_bar_experience");
  if (!container) return;

  const cp = sheet?.character?.character_points ?? {};
  const spentPoints =
    (cp.primary_attributes ?? 0) +
    (cp.secondary_attributes ?? 0) +
    (cp.advantages ?? 0) +
    (cp.disadvantages ?? 0) +
    (cp.skills ?? 0) +
    (cp.spells ?? 0);

  const sex = sheet?.pc?.character_sex;
  const rank = getExperienceRank(spentPoints);
  const rankName = getExperienceRankName(rank.index, sex);
  const caption = rank.isMaxRank
    ? t("experience.maxRank")
    : `${rank.pointsToNext} ${t("experience.pointsToNextRank")}`;

  container.innerHTML = `
    <div class="resume-bar-header">
      <span>
        <span class="resume-bar-badge">${rank.badge}</span>
        <span class="resume-bar-label">${rankName}</span>
      </span>
      <span class="resume-bar-values">${spentPoints}${rank.isMaxRank ? "" : "/" + rank.nextThreshold}</span>
    </div>
    <div class="resume-bar-track">
      <div
        class="resume-bar-fill resume-bar--experience"
        style="width: ${rank.progress}%"
        role="progressbar"
        aria-valuenow="${spentPoints}"
        aria-valuemin="${rank.tierMin}"
        aria-valuemax="${rank.isMaxRank ? spentPoints : rank.nextThreshold}"
      ></div>
    </div>
    <div class="resume-bar-caption">${caption}</div>
  `;
}

export function renderResumePrimaryAttributes(sheet) {
  const container = el("resume_primary_attrs");
  if (!container) return;

  const primary = sheet?.character?.primary_attributes;
  if (!primary) {
    container.innerHTML = "";
    return;
  }

  const attrs = ["ST", "DX", "IQ", "HT"];

  container.innerHTML = attrs
    .map((key) => {
      const value = primary[key]?.value ?? "—";
      const modVal = primary[key]?.modifier ?? 0;
      return `
        <div class="resume-attr-box">
          <span class="resume-attr-acronym">${key}</span>
          <span class="resume-attr-value">${value}</span>
          <div class="num-stepper resume-attr-mod-stepper">
            <input
              type="text"
              inputmode="numeric"
              class="resume-primary-mod-input"
              data-attr="${key}"
              value="${modVal}"
            />
            <div class="stepper-btns">
              <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
              <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

const SECONDARY_SNAPSHOT_KEYS = [
  "Will",
  "Vision",
  "Hearing",
  "Smell",
  "BasicSpeed",
  "Movement",
  "Dodge",
];

export function renderResumeSecondarySnapshot(sheet) {
  const container = el("resume_secondary_snapshot");
  if (!container) return;

  const sec = sheet?.character?.secondary_attributes;
  if (!sec) {
    container.innerHTML = "";
    return;
  }

  const rows = SECONDARY_SNAPSHOT_KEYS.map((key) => {
    const attr = sec[key];
    if (!attr) return "";
    const isBasicSpeed = key === "BasicSpeed";
    const value = isBasicSpeed
      ? Number(attr.value).toFixed(2)
      : (attr.value ?? "—");
    const modifierStep = isBasicSpeed ? 0.5 : 1;
    const rawMod = attr.modifier ?? 0;

    return `
      <tr>
        <td>${getSecondaryAttributeLabel(key)}</td>
        <td class="col-num">${value}</td>
        <td>
          <div class="num-stepper resume-secondary-mod-stepper">
            <input
              type="text"
              inputmode="numeric"
              class="secondary-input"
              data-name="${key}"
              data-field="modifier"
              data-step="${modifierStep}"
              value="${rawMod}"
            />
            <div class="stepper-btns">
              <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
              <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    ${collapsibleHeader(t("resume.secondarySnapshot"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table resume-table--secondary-snapshot">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  bindCollapse(container);
}

export function renderResumeBars(sheet) {
  const attrs = sheet?.character?.secondary_attributes;
  if (!attrs) return;

  _renderBar("resume_bar_hp", attrs.HP, "resume-bar--hp", "HP");
  _renderBar("resume_bar_mana", attrs.Mana, "resume-bar--mana", "Mana");
  _renderBar(
    "resume_bar_toxicity",
    attrs.Toxicity,
    "resume-bar--toxicity",
    "Toxicity",
  );
}

function _renderBar(containerId, attr, modifierClass, attrName) {
  const container = el(containerId);
  if (!container || !attr) return;

  // Bar max includes equipment/enchantment bonuses (e.g. a Fortify Mana ring), not just base+bought.
  const finalBase =
    attr.final_base_value ?? (attr.base_value ?? 0) + (attr.bought ?? 0) * 4;
  const enchantMod = attr.enchantment_modifier ?? 0;
  const total = finalBase + enchantMod;

  // modifier tracks missing/spent points (always ≤ 0, enforced in traits/events.js).
  const rawMod = attr.modifier ?? 0;
  const current = Math.max(0, total + rawMod);
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const label = getSecondaryAttributeLabel(attrName);

  container.innerHTML = `
    <div class="resume-bar-header">
      <span class="resume-bar-label">${label}</span>
      <span class="resume-bar-values">${current}/${total}</span>
    </div>
    <div class="resume-bar-track">
      <div
        class="resume-bar-fill ${modifierClass}"
        style="width: ${pct}%"
        role="progressbar"
        aria-valuenow="${current}"
        aria-valuemin="0"
        aria-valuemax="${total}"
      ></div>
    </div>
    <div class="resume-bar-stepper">
      <div class="num-stepper">
        <input
          type="text"
          inputmode="numeric"
          class="secondary-input"
          data-name="${attrName}"
          data-field="modifier"
          data-max="0"
          value="${rawMod}"
        />
        <div class="stepper-btns">
          <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
          <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
        </div>
      </div>
    </div>
  `;
}

// Read-only here — the editable modifier stepper lives in components/resistances.js.
// Filtered to elements that differ from normal damage, to avoid noise from a full "1" row per element.
