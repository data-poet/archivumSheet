// ===== HELPERS =====
export function getMaterialName(materialId, materials = []) {
  if (!materialId) return "Common";

  const material = materials.find(
    (material) => material.material_id === materialId,
  );

  return material?.material_name || "Unknown";
}

// ===== INVENTORY UI =====
export function updateInventoryUI(sheet) {
  const carry = sheet?.inventory?.carry_weight;
  if (!carry) return;

  const baseWeight = Number(document.getElementById("weight").value) || 0;
  const armorWeight = sheet?.inventory?.armor?.carried_armor_weight || 0;
  const weight = baseWeight + armorWeight;

  document.getElementById("armor_weight").textContent = armorWeight;
  document.getElementById("total_weight").textContent = weight;

  let stateLabel = "None";

  if (weight >= carry.limits.veryHeavy) stateLabel = "Overloaded";
  else if (weight >= carry.limits.heavy) stateLabel = "Very Heavy";
  else if (weight >= carry.limits.medium) stateLabel = "Heavy";
  else if (weight >= carry.limits.light) stateLabel = "Medium";
  else if (weight > carry.limits.none) stateLabel = "Light";

  document.getElementById("encumbrance").textContent =
    `${stateLabel} (${carry.weight_modifier})`;

  const limitsText = `
    None: ${carry.limits.none} |
    Light: ${carry.limits.light} |
    Medium: ${carry.limits.medium} |
    Heavy: ${carry.limits.heavy} |
    Very Heavy: ${carry.limits.veryHeavy}
  `;

  document.getElementById("carry_limits").textContent = limitsText
    .replace(/\s+/g, " ")
    .trim();
}
