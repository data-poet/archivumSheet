import { el } from "../shared/dom.js";

// ===== HELPERS =====
export function getMaterialName(materialId, materials = []) {
  if (!materialId) return "Common";
  const material = materials.find((m) => m.material_id === materialId);
  return material?.material_name || "Unknown";
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
  const weight = baseWeight + armorWeight + shieldWeight + meleeWeight;

  const armorWeightEl = el("armor_weight");
  const shieldWeightEl = el("shield_weight");
  const meleeWeightEl = el("melee_weight");
  const totalWeightEl = el("total_weight");
  const encumbranceEl = el("encumbrance");
  const carryLimitsEl = el("carry_limits");

  if (armorWeightEl)  armorWeightEl.textContent  = armorWeight;
  if (shieldWeightEl) shieldWeightEl.textContent = shieldWeight;
  if (meleeWeightEl)  meleeWeightEl.textContent  = meleeWeight;
  if (totalWeightEl)  totalWeightEl.textContent  = weight;

  let stateLabel = "None";
  if (weight >= carry.limits.veryHeavy)    stateLabel = "Overloaded";
  else if (weight >= carry.limits.heavy)   stateLabel = "Very Heavy";
  else if (weight >= carry.limits.medium)  stateLabel = "Heavy";
  else if (weight >= carry.limits.light)   stateLabel = "Medium";
  else if (weight > carry.limits.none)     stateLabel = "Light";

  if (encumbranceEl) {
    encumbranceEl.textContent = `${stateLabel} (${carry.weight_modifier})`;
  }

  const limitsText = `
    None: ${carry.limits.none} |
    Light: ${carry.limits.light} |
    Medium: ${carry.limits.medium} |
    Heavy: ${carry.limits.heavy} |
    Very Heavy: ${carry.limits.veryHeavy}
  `;

  if (carryLimitsEl) {
    carryLimitsEl.textContent = limitsText.replace(/\s+/g, " ").trim();
  }
}
