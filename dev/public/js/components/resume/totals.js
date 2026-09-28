// Whole-sheet aggregates: carry weight/encumbrance, monetary value, spent points.

import {
  t,
  getEncumbranceLabel,
  getCarryLimitLabel,
} from "../../localization/pt-BR/index.js";
import { el } from "../../shared/dom.js";
import { renderSumTable } from "../../shared/renderUtils.js";

export function renderResumeWeight(sheet) {
  const carry = sheet?.inventory?.carry_weight;

  const weightEl = el("weight");
  const baseWeight = weightEl
    ? Number(weightEl.value) || 0
    : Number(sheet?.inventory?.weight) || 0;

  const armorWeight = sheet?.inventory?.armor?.carried_armor_weight || 0;
  const shieldWeight = sheet?.inventory?.shield?.carried_shield_weight || 0;
  const meleeWeight =
    sheet?.inventory?.melee?.carried_melee_weapons_weight || 0;
  const rangedWeight =
    sheet?.inventory?.ranged?.carried_ranged_weapons_weight || 0;
  const firearmsWeight =
    sheet?.inventory?.firearms?.carried_firearms_weight || 0;
  const ammoWeight = sheet?.inventory?.ammo?.carried_ammo_weight || 0;
  const alchemyWeight = sheet?.inventory?.alchemy?.carried_alchemy_weight || 0;
  const survivalGearWeight =
    sheet?.inventory?.survivalGear?.carried_survival_gear_weight || 0;
  const magicGearWeight =
    sheet?.inventory?.magicGear?.carried_magic_gear_weight || 0;
  const customWeight =
    sheet?.inventory?.customInventory?.carried_custom_inventory_weight || 0;
  const coinPurseWeight =
    sheet?.inventory?.coinPurse?.carried_coin_purse_weight || 0;

  const totalWeight =
    Math.ceil(
      (baseWeight +
        armorWeight +
        shieldWeight +
        meleeWeight +
        rangedWeight +
        firearmsWeight +
        ammoWeight +
        alchemyWeight +
        survivalGearWeight +
        magicGearWeight +
        customWeight +
        coinPurseWeight) *
        1000,
    ) / 1000;

  let stateKey = "none";
  if (carry) {
    if (totalWeight >= carry.limits.veryHeavy) stateKey = "overloaded";
    else if (totalWeight >= carry.limits.heavy) stateKey = "veryHeavy";
    else if (totalWeight >= carry.limits.medium) stateKey = "heavy";
    else if (totalWeight >= carry.limits.light) stateKey = "medium";
    else if (totalWeight > carry.limits.none) stateKey = "light";
  }

  const encumbranceLabel = carry
    ? `${getEncumbranceLabel(stateKey)} (×${carry.weight_modifier})`
    : "—";

  renderSumTable(
    [
      { label: t("resume.armorWeight"), value: armorWeight },
      { label: t("resume.shieldWeight"), value: shieldWeight },
      { label: t("resume.meleeWeight"), value: meleeWeight },
      { label: t("resume.rangedWeight"), value: rangedWeight },
      { label: t("sections.firearms"), value: firearmsWeight },
      { label: t("ammo.ammoWeight"), value: ammoWeight },
      { label: t("alchemy.alchemyWeight"), value: alchemyWeight },
      {
        label: t("survivalGear.survivalGearWeight"),
        value: survivalGearWeight,
      },
      { label: t("magicGear.magicGearWeight"), value: magicGearWeight },
      {
        label: t("customInventory.customInventoryWeight"),
        value: customWeight,
      },
      { label: t("coinPurse.coinPurseWeight"), value: coinPurseWeight },
    ],
    {
      tbodyId: "resume_weight_tbody",
      totalCellId: "resume_total_weight_cell",
      total: totalWeight,
    },
  );

  const set = (id, val) => {
    const e = el(id);
    if (e) e.textContent = val;
  };
  set("armor_weight", armorWeight);
  set("shield_weight", shieldWeight);
  set("melee_weight", meleeWeight);
  set("ranged_weight", rangedWeight);
  set("firearms_weight", firearmsWeight);
  set("ammo_weight", ammoWeight);
  set("alchemy_weight", alchemyWeight);
  set("survival_gear_weight", survivalGearWeight);
  set("magic_gear_weight", magicGearWeight);
  set("custom_inventory_weight", customWeight);
  set("total_weight", totalWeight);
  set("encumbrance", encumbranceLabel);

  const limitsEl = el("carry_limits");
  if (limitsEl && carry) {
    limitsEl.innerHTML = `
      <div class="table-wrapper">
        <table class="resume-limits-table">
          <thead>
            <tr>
              <th>${getCarryLimitLabel("none")}</th>
              <th>${getCarryLimitLabel("light")}</th>
              <th>${getCarryLimitLabel("medium")}</th>
              <th>${getCarryLimitLabel("heavy")}</th>
              <th>${getCarryLimitLabel("veryHeavy")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="col-num">${carry.limits.none}</td>
              <td class="col-num">${carry.limits.light}</td>
              <td class="col-num">${carry.limits.medium}</td>
              <td class="col-num">${carry.limits.heavy}</td>
              <td class="col-num">${carry.limits.veryHeavy}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
}

export function renderResumeValue(sheet) {
  const armorValue = sheet?.inventory?.armor?.carried_armor_value || 0;
  const shieldValue = sheet?.inventory?.shield?.carried_shield_value || 0;
  const meleeValue = sheet?.inventory?.melee?.carried_melee_weapons_value || 0;
  const rangedValue =
    sheet?.inventory?.ranged?.carried_ranged_weapons_value || 0;
  const firearmsValue = sheet?.inventory?.firearms?.carried_firearms_value || 0;
  const ammoValue = sheet?.inventory?.ammo?.carried_ammo_value || 0;
  const alchemyValue = sheet?.inventory?.alchemy?.carried_alchemy_value || 0;
  const survivalGearValue =
    sheet?.inventory?.survivalGear?.carried_survival_gear_value || 0;
  const accessoryValue =
    sheet?.inventory?.accessories?.carried_accessory_value || 0;
  const magicGearValue =
    sheet?.inventory?.magicGear?.carried_magic_gear_value || 0;
  const customValue =
    sheet?.inventory?.customInventory?.carried_custom_inventory_value || 0;

  const totalValue = renderSumTable(
    [
      { label: t("resume.armorWeight"), value: armorValue },
      { label: t("resume.shieldWeight"), value: shieldValue },
      { label: t("resume.meleeWeight"), value: meleeValue },
      { label: t("resume.rangedWeight"), value: rangedValue },
      { label: t("sections.firearms"), value: firearmsValue },
      { label: t("ammo.ammoWeight"), value: ammoValue },
      { label: t("alchemy.alchemyWeight"), value: alchemyValue },
      { label: t("survivalGear.survivalGearWeight"), value: survivalGearValue },
      { label: t("sections.accessories"), value: accessoryValue },
      { label: t("magicGear.title"), value: magicGearValue },
      { label: t("customInventory.customInventoryWeight"), value: customValue },
    ],
    { tbodyId: "resume_value_tbody", totalCellId: "resume_total_value_cell" },
  );

  const backpackCoins = sheet?.inventory?.coinPurse?.backpack ?? [];
  const totalCoins = backpackCoins.reduce(
    (sum, entry) => sum + (entry.total_value ?? 0),
    0,
  );
  const hasCoins = backpackCoins.length > 0;

  const coinsRowEl = el("resume_coins_row");
  if (coinsRowEl) coinsRowEl.hidden = !hasCoins;

  document.querySelectorAll(".resume-coins-value").forEach((span) => {
    span.textContent = totalCoins.toLocaleString("pt-BR");
  });
}

export function renderResumePoints(sheet) {
  const primaryAttributesPoints =
    sheet?.character?.character_points?.primary_attributes ?? 0;
  const secondaryAttributesPoints =
    sheet?.character?.character_points?.secondary_attributes ?? 0;
  const advantagesPoints = sheet?.character?.character_points?.advantages ?? 0;
  const disadvantagesPoints =
    sheet?.character?.character_points?.disadvantages ?? 0;
  const skillsPoints = sheet?.character?.character_points?.skills ?? 0;
  const spellsPoints = sheet?.character?.character_points?.spells ?? 0;

  renderSumTable(
    [
      { label: t("resume.primaryAttributes"), value: primaryAttributesPoints },
      {
        label: t("resume.secondaryAttributes"),
        value: secondaryAttributesPoints,
      },
      { label: t("resume.advantages"), value: advantagesPoints },
      { label: t("resume.disadvantages"), value: disadvantagesPoints },
      { label: t("resume.skills"), value: skillsPoints },
      { label: t("resume.spells"), value: spellsPoints },
    ],
    { tbodyId: "resume_points_tbody", totalCellId: "resume_total_points_cell" },
  );
}
