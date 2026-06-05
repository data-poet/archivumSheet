import { el } from "../shared/dom.js";
import {
  t,
  getEncumbranceLabel,
  getCarryLimitLabel,
} from "../localization/pt-BR.js";

// ===== HELPERS =====
export function getMaterialName(materialId, materials = []) {
  if (!materialId) return t("common.common");
  const material = materials.find((m) => m.material_id === materialId);
  return material?.material_name || t("common.unknown");
}

// ===== INVENTORY UI =====
export function updateInventoryUI(sheet) {
  const carry = sheet?.inventory?.carry_weight;
  if (!carry) return;

  const weightEl = el("weight");
  const baseWeight = weightEl ? Number(weightEl.value) || 0 : 0;

  const armorWeight = sheet?.inventory?.armor?.carried_armor_weight || 0;
  const shieldWeight = sheet?.inventory?.shield?.carried_shield_weight || 0;
  const meleeWeight = sheet?.inventory?.melee?.carried_melee_weight || 0;
  const rangedWeight = sheet?.inventory?.ranged?.carried_ranged_weight || 0;
  const ammoWeight = sheet?.inventory?.ammo?.carried_ammo_weight || 0;
  const alchemyWeight = sheet?.inventory?.alchemy?.carried_alchemy_weight || 0;
  const survivalGearWeight = sheet?.inventory?.survivalGear?.carried_survival_gear_weight || 0;
  const customInventoryWeight = sheet?.inventory?.customInventory?.carried_custom_inventory_weight || 0;
  const weight =
    baseWeight + armorWeight + shieldWeight + meleeWeight + rangedWeight + ammoWeight + alchemyWeight + survivalGearWeight + customInventoryWeight;

  // Update weight detail spans
  const set = (id, val) => {
    const e = el(id);
    if (e) e.textContent = val;
  };
  set("armor_weight", armorWeight);
  set("shield_weight", shieldWeight);
  set("melee_weight", meleeWeight);
  set("ranged_weight", rangedWeight);
  set("ammo_weight", ammoWeight);
  set("alchemy_weight", alchemyWeight);
  set("survival_gear_weight", survivalGearWeight);
  set("custom_inventory_weight", customInventoryWeight);
  set("total_weight", weight);

  // Encumbrance state
  let stateKey = "none";

  if (weight >= carry.limits.veryHeavy) stateKey = "overloaded";
  else if (weight >= carry.limits.heavy) stateKey = "veryHeavy";
  else if (weight >= carry.limits.medium) stateKey = "heavy";
  else if (weight >= carry.limits.light) stateKey = "medium";
  else if (weight > carry.limits.none) stateKey = "light";

  set(
    "encumbrance",
    `${getEncumbranceLabel(stateKey)} (×${carry.weight_modifier})`,
  );

  // Carry limits table
  const limitsEl = el("carry_limits");
  if (limitsEl) {
    limitsEl.innerHTML = `
      <table>
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
    `;
  }
}
