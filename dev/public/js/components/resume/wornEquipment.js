// Equipped protective gear and melee/ranged weapons — the sections whose rows
// carry an editable HP-damage stepper.

import { t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { calcActualHp } from "../../engine/inventory/shared/durabilityUtils.js";
import {
  collapsibleHeader,
  bindCollapse,
  hpStepperCell,
  renderResumeWeaponTable,
} from "./shared.js";

const ARMOR_SLOTS = [
  { key: "head", label: "Cabeça" },
  { key: "torso", label: "Tronco" },
  { key: "arms", label: "Braços" },
  { key: "hands", label: "Mãos" },
  { key: "legs", label: "Pernas" },
  { key: "feet", label: "Pés" },
];

export function renderResumeArmor(sheet, { editable = true } = {}) {
  const equipped = sheet?.inventory?.armor?.equipped || {};
  const container = el("resume_armor_container");
  if (!container) return;

  const hasAny = ARMOR_SLOTS.some((s) => equipped[s.key] != null);
  if (!hasAny) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = ARMOR_SLOTS.map(({ key, label }) => {
    const piece = equipped[key];
    if (!piece) {
      return `<tr><td>${label}</td><td class="col-num">—</td><td></td></tr>`;
    }
    // final_damage_resistance includes enchantments; armor_final_damage_resistance is material-only.
    const dr = piece.final_damage_resistance ?? "—";
    const maxHp = piece.armor_final_hit_points ?? 0;
    const modifier = piece.hit_points_modifier ?? 0;
    const actualHp = calcActualHp(maxHp, modifier);
    const hpCell =
      maxHp > 0
        ? hpStepperCell({
            cssClass: "resume-armor-hp",
            dataAttrs: `data-slot="${label}"`,
            maxHp,
            modifier,
            actualHp,
            editable,
          })
        : `<td></td>`;

    return `<tr><td>${label}</td><td class="col-num">${dr}</td>${hpCell}</tr>`;
  }).join("");

  container.innerHTML = `
    ${collapsibleHeader(t("sections.armor"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("armor.slot")}</th>
              <th class="col-num">${t("armor.dr")}</th>
              <th class="col-num">${t("armor.hp")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  bindCollapse(container);
}

export function renderResumeShield(sheet, { editable = true } = {}) {
  const equippedShield = sheet?.inventory?.shield?.equipped;
  const container = el("resume_shield_container");
  if (!container) return;

  if (!equippedShield) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  // final_damage_resistance includes enchantments, same as renderResumeArmor.
  const dr = equippedShield.final_damage_resistance ?? "—";
  const block = equippedShield.block ?? "—";
  const maxHp = equippedShield.shield_final_hit_points ?? 0;
  const modifier = equippedShield.hit_points_modifier ?? 0;
  const actualHp = calcActualHp(maxHp, modifier);

  const hpCell =
    maxHp > 0
      ? hpStepperCell({
          cssClass: "resume-shield-hp",
          dataAttrs: "",
          maxHp,
          modifier,
          actualHp,
          editable,
        })
      : `<td></td>`;

  container.innerHTML = `
    ${collapsibleHeader(t("sections.shields"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("shield.dr")}</th>
              <th class="col-num">${t("shield.block")}</th>
              <th class="col-num">${t("armor.hp")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${equippedShield.shield_name ?? "—"}</td>
              <td class="col-num">${dr}</td>
              <td class="col-num">${block}</td>
              ${hpCell}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  bindCollapse(container);
}

// Melee alone falls back to a derived max HP (final_hit_points minus the modifier) when
// weapon_final_hit_points is absent; ranged/firearms only ever trust weapon_final_hit_points.
function meleeMaxHp(w) {
  if (w.weapon_final_hit_points != null) return w.weapon_final_hit_points;
  return w.final_hit_points != null
    ? w.final_hit_points - (w.hit_points_modifier ?? 0)
    : 0;
}

export function renderResumeMelee(sheet, { editable = true } = {}) {
  renderResumeWeaponTable({
    containerId: "resume_melee_container",
    title: t("sections.melee"),
    weapons: sheet?.inventory?.melee?.equipped ?? [],
    hpCssClass: "resume-melee-hp",
    computeMaxHp: meleeMaxHp,
    editable,
    columns: [
      { header: t("melee.reach"), cell: (w) => w.weapon_reach ?? "—" },
      { header: t("melee.balDmg"), cell: (w) => w.weapon_bal_damage ?? "—" },
      { header: t("melee.gdpDmg"), cell: (w) => w.weapon_gdp_damage ?? "—" },
    ],
  });
}

export function renderResumeRanged(sheet, { editable = true } = {}) {
  renderResumeWeaponTable({
    containerId: "resume_ranged_container",
    title: t("sections.ranged"),
    weapons: sheet?.inventory?.ranged?.equipped ?? [],
    hpCssClass: "resume-ranged-hp",
    computeMaxHp: (w) => w.weapon_final_hit_points ?? 0,
    editable,
    columns: [
      { header: t("ranged.tr"), cell: (w) => w.weapon_tr ?? "—" },
      { header: t("ranged.prec"), cell: (w) => w.weapon_prec ?? "—" },
      { header: t("ranged.gdpDmg"), cell: (w) => w.weapon_gdp_damage ?? "—" },
    ],
  });
}
