// Identity, experience, and the attribute/bar readouts at the top of the resume.

import {
  LABELS,
  t,
  getSecondaryAttributeLabel,
  getExperienceRankName,
} from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { morphHTML } from "../../shared/morph.js";
import { state } from "../../state.js";
import {
  PRIMARY_ATTRIBUTES,
  VITAL_ATTRIBUTES,
} from "../../shared/constants.js";
import { thresholdChip, fillThreshold } from "../thresholds.js";
import { getExperienceRank } from "../../engine/character/experienceRank.js";
import { collapsibleHeader, bindCollapse } from "./shared.js";
import { conditionCell } from "../../shared/conditionDisplay.js";

export function renderResumeHeader(sheet) {
  const nameEl = el("resume_header_name");
  if (!nameEl) return;

  const charName = sheet?.pc?.character_name || "";
  const subRace = sheet?.race?.race_sub_name || "";
  // tier_label only exists on a forked catalog ally that had no character_name to begin
  // with (see allies/tier.js) — race leads in that case, name leads in every other one.
  const tierLabel =
    !charName && sheet?.pc?.tier_label ? sheet.pc.tier_label : "";

  const parts = charName ? [charName, subRace] : [subRace, tierLabel];

  nameEl.textContent = parts.filter(Boolean).join(" | ");
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

  morphHTML(
    container,
    `
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
  `,
  );
}

export function renderResumePrimaryAttributes(sheet) {
  const container = el("resume_primary_attrs");
  if (!container) return;

  const primary = sheet?.character?.primary_attributes;
  if (!primary) {
    container.innerHTML = "";
    return;
  }

  morphHTML(
    container,
    PRIMARY_ATTRIBUTES.map((key) => {
      const value = conditionCell(primary[key], "value");
      const modVal = primary[key]?.modifier ?? 0;
      return `
        <div id="resume-primary-${key}" class="resume-attr-box">
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
    }).join(""),
  );
}

const SECONDARY_SNAPSHOT_KEYS = [
  "Will",
  "Vision",
  "Hearing",
  "Smell",
  "BasicSpeed",
  "Movement",
  "Dodge",
  "DamageResistance",
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
      : conditionCell(attr, "value");
    const modifierStep = isBasicSpeed ? 0.5 : 1;
    const rawMod = attr.modifier ?? 0;

    return `
      <tr id="resume-secondary-${key}">
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

  morphHTML(
    container,
    `
    ${collapsibleHeader(t("resume.secondarySnapshot"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table resume-table--secondary-snapshot">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `,
  );
  bindCollapse(container);
}

export function renderResumeBars(sheet) {
  const attrs = sheet?.character?.secondary_attributes;
  if (!attrs) return;

  const thresholds = sheet?.character?.thresholds;
  VITAL_ATTRIBUTES.forEach(({ key, bar }) =>
    _renderBar(bar, attrs[key], key, {
      chip: _chipFor(key, thresholds),
      zone: thresholds ? ZONES[key]?.(thresholds) : null,
    }),
  );
}

const CHIP_KIND = { HP: "hp", FP: "fp" };

function _chipFor(key, thresholds) {
  const kind = CHIP_KIND[key];
  return kind && thresholds ? thresholdChip(kind, thresholds[kind]) : "";
}

// Vitals whose value can go below 0 get a negative zone that runs from 0 down to its floor.
const ZONES = {
  HP: ({ hp }) => ({
    floor: hp.death_at,
    ticks: hp.death_check_values,
    caption: (current) => {
      if (current <= hp.death_at) return "";
      if (hp.next_death_check !== null)
        return fillThreshold(LABELS.thresholds.bar.nextDeathCheck, {
          x: hp.next_death_check,
        });
      return fillThreshold(LABELS.thresholds.bar.deathAt, { x: hp.death_at });
    },
  }),
  FP: ({ fp }) => ({
    floor: fp.unconscious_at,
    ticks: [],
    caption: (current) =>
      current > fp.unconscious_at
        ? fillThreshold(LABELS.thresholds.bar.unconsciousAt, {
            x: fp.unconscious_at,
          })
        : "",
  }),
};

function _negativeTrack(current, zone) {
  const pct = Math.min(100, Math.round((current / zone.floor) * 100));
  const ticks = zone.ticks
    .map(
      (value) =>
        `<span class="resume-bar-tick${current <= value ? " is-passed" : ""}" style="left: ${(value / zone.floor) * 100}%"></span>`,
    )
    .join("");
  return `
    <div class="resume-bar-track resume-bar-track--negative">
      <div
        class="resume-bar-fill resume-bar-fill--negative"
        style="width: ${pct}%"
        role="progressbar"
        aria-valuenow="${current}"
        aria-valuemin="${zone.floor}"
        aria-valuemax="0"
      ></div>
      ${ticks}
    </div>`;
}

function _vitalStepper(attrName, field, value, label) {
  return `
      <label class="resume-bar-stepper-field">
        <span class="resume-bar-stepper-label">${label}</span>
        <div class="num-stepper">
          <input
            type="text"
            inputmode="numeric"
            class="secondary-input"
            data-name="${attrName}"
            data-field="${field}"
            data-max="0"
            value="${value}"
          />
          <div class="stepper-btns">
            <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
            <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
          </div>
        </div>
      </label>`;
}

// Pure arithmetic the client already has every number for — no rule, just re-display (see
// updateResumeVitalDisplay, the instant-feedback path that reuses this between engine runs).
function _vitalDisplay(attr, zone) {
  // Max includes equipment/enchantment bonuses (e.g. a Fortify Mana ring) and any max reduction, not just base+bought.
  const maxMod = attr.max_modifier ?? 0;
  const total = Math.max(
    0,
    (attr.final_base_value ?? attr.base_value ?? 0) +
      (attr.enchantment_modifier ?? 0) +
      maxMod,
  );

  const rawMod = attr.modifier ?? 0;
  const current = zone ? total + rawMod : Math.max(0, total + rawMod);
  const pct = total > 0 ? Math.round((Math.max(0, current) / total) * 100) : 0;
  const caption = zone && current <= 0 ? zone.caption(current) : "";

  return { maxMod, total, rawMod, current, pct, caption };
}

function _renderBar(bar, attr, attrName, { chip = "", zone = null } = {}) {
  const container = el(`resume_bar_${bar}`);
  if (!container || !attr) return;

  const { maxMod, total, rawMod, current, pct, caption } = _vitalDisplay(
    attr,
    zone,
  );
  const label = getSecondaryAttributeLabel(attrName);

  morphHTML(
    container,
    `
    <div class="resume-bar-header">
      <span class="resume-bar-label">${label}</span>
      <span class="resume-bar-values">${current}/${total}${caption ? ` · ${caption}` : ""}</span>
    </div>
    ${
      zone && current < 0
        ? _negativeTrack(current, zone)
        : `<div class="resume-bar-track">
      <div
        class="resume-bar-fill resume-bar--${bar}"
        style="width: ${pct}%; background: var(--color-bar-${bar})"
        role="progressbar"
        aria-valuenow="${current}"
        aria-valuemin="0"
        aria-valuemax="${total}"
      ></div>
    </div>`
    }
    ${chip ? `<p class="resume-bar-chip">${chip}</p>` : ""}
    <div class="resume-bar-stepper">
      ${_vitalStepper(attrName, "modifier", rawMod, t("resume.vitalCurrent"))}
      ${_vitalStepper(attrName, "max_modifier", maxMod, t("resume.vitalMax"))}
    </div>
  `,
  );
}

// Instant feedback for a vital's modifier/max_modifier stepper: patches the bar's text and
// (track shape permitting) its width from the last engine response plus whatever was just
// typed, without touching the stepper inputs — the engine response due moments later still
// fully re-renders the bar via _renderBar, same as before this existed.
export function updateResumeVitalDisplay(attrName) {
  const vital = VITAL_ATTRIBUTES.find((v) => v.key === attrName);
  if (!vital) return;

  const sheetAttr = state.sheet?.character?.secondary_attributes?.[attrName];
  if (!sheetAttr) return;

  const liveSelected = state.selected.secondary[attrName];
  const attr = {
    ...sheetAttr,
    modifier: liveSelected?.modifier ?? sheetAttr.modifier,
    max_modifier: liveSelected?.max_modifier ?? sheetAttr.max_modifier,
  };

  const thresholds = state.sheet?.character?.thresholds;
  const zone = thresholds ? ZONES[attrName]?.(thresholds) : null;
  const { total, current, pct, caption } = _vitalDisplay(attr, zone);

  const container = el(`resume_bar_${vital.bar}`);
  if (!container) return;

  const valuesEl = container.querySelector(".resume-bar-values");
  if (valuesEl) {
    valuesEl.textContent = `${current}/${total}${caption ? ` · ${caption}` : ""}`;
  }

  // The negative-zone track (death-check ticks) is a different shape; a mode switch needs
  // _renderBar's full markup, which the engine response due moments later supplies — skip
  // the width patch here rather than risk a half-updated track.
  const fillEl = container.querySelector(
    ".resume-bar-track:not(.resume-bar-track--negative) .resume-bar-fill",
  );
  if (fillEl && !(zone && current < 0)) {
    fillEl.style.width = `${pct}%`;
    fillEl.setAttribute("aria-valuenow", String(current));
  }
}

// Read-only here — the editable modifier stepper lives in components/resistances.js.
// Filtered to elements that differ from normal damage, to avoid noise from a full "1" row per element.
