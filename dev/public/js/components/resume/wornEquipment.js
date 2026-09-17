// Equipped protective gear and melee/ranged weapons — the sections whose rows
// carry an editable HP-damage stepper.

import { t } from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { calcActualHp } from "../../engine/inventory/shared/durabilityUtils.js";
import { collapsibleHeader, bindCollapse, hpStepperCell } from "./shared.js";

const ARMOR_SLOTS = [
  { key: "head", label: "Cabeça" },
  { key: "torso", label: "Tronco" },
  { key: "arms", label: "Braços" },
  { key: "hands", label: "Mãos" },
  { key: "legs", label: "Pernas" },
  { key: "feet", label: "Pés" },
];

export function renderResumeArmor(sheet) {
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

export function renderResumeShield(sheet) {
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

export function renderResumeMelee(sheet) {
  const equipped = sheet?.inventory?.melee?.equipped ?? [];
  const container = el("resume_melee_container");
  if (!container) return;

  if (equipped.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = equipped
    .map((w) => {
      const maxHp =
        w.final_hit_points != null
          ? w.final_hit_points - (w.hit_points_modifier ?? 0)
          : 0;
      // Prefer weapon_final_hit_points from the resolver over the derived maxHp when available.
      const baseMaxHp = w.weapon_final_hit_points ?? maxHp;
      const modifier = w.hit_points_modifier ?? 0;
      const actualHp = calcActualHp(baseMaxHp, modifier);
      const instanceId = w._instanceId ?? "";

      const hpCell =
        baseMaxHp > 0
          ? hpStepperCell({
              cssClass: "resume-melee-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
              maxHp: baseMaxHp,
              modifier,
              actualHp,
            })
          : `<td></td>`;

      return `
        <tr>
          <td>${w.weapon_name ?? "—"}</td>
          <td class="col-num">${w.weapon_reach ?? "—"}</td>
          <td class="col-num">${w.weapon_bal_damage ?? "—"}</td>
          <td class="col-num">${w.weapon_gdp_damage ?? "—"}</td>
          ${hpCell}
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(t("sections.melee"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("melee.reach")}</th>
              <th class="col-num">${t("melee.balDmg")}</th>
              <th class="col-num">${t("melee.gdpDmg")}</th>
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

export function renderResumeRanged(sheet) {
  const equipped = sheet?.inventory?.ranged?.equipped ?? [];
  const container = el("resume_ranged_container");
  if (!container) return;

  if (equipped.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = equipped
    .map((w) => {
      const baseMaxHp = w.weapon_final_hit_points ?? 0;
      const modifier = w.hit_points_modifier ?? 0;
      const actualHp = calcActualHp(baseMaxHp, modifier);
      const instanceId = w._instanceId ?? "";

      const hpCell =
        baseMaxHp > 0
          ? hpStepperCell({
              cssClass: "resume-ranged-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
              maxHp: baseMaxHp,
              modifier,
              actualHp,
            })
          : `<td></td>`;

      return `
        <tr>
          <td>${w.weapon_name ?? "—"}</td>
          <td class="col-num">${w.weapon_tr ?? "—"}</td>
          <td class="col-num">${w.weapon_prec ?? "—"}</td>
          <td class="col-num">${w.weapon_gdp_damage ?? "—"}</td>
          ${hpCell}
        </tr>
      `;
    })
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(t("sections.ranged"))}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <thead>
            <tr>
              <th>${t("common.name")}</th>
              <th class="col-num">${t("ranged.tr")}</th>
              <th class="col-num">${t("ranged.prec")}</th>
              <th class="col-num">${t("ranged.gdpDmg")}</th>
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
