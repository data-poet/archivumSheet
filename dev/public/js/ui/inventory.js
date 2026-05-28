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

  const armorWeight  = sheet?.inventory?.armor?.carried_armor_weight   || 0;
  const shieldWeight = sheet?.inventory?.shield?.carried_shield_weight || 0;
  const meleeWeight  = sheet?.inventory?.melee?.carried_melee_weight   || 0;
  const rangedWeight = sheet?.inventory?.ranged?.carried_ranged_weight || 0;
  const weight = baseWeight + armorWeight + shieldWeight + meleeWeight + rangedWeight;

  // Update weight detail spans
  const set = (id, val) => { const e = el(id); if (e) e.textContent = val; };
  set("armor_weight",  armorWeight);
  set("shield_weight", shieldWeight);
  set("melee_weight",  meleeWeight);
  set("ranged_weight", rangedWeight);
  set("total_weight",  weight);

  // Encumbrance state
  let stateLabel = "None";
  if      (weight >= carry.limits.veryHeavy) stateLabel = "Overloaded";
  else if (weight >= carry.limits.heavy)     stateLabel = "Very Heavy";
  else if (weight >= carry.limits.medium)    stateLabel = "Heavy";
  else if (weight >= carry.limits.light)     stateLabel = "Medium";
  else if (weight > carry.limits.none)       stateLabel = "Light";

  set("encumbrance", `${stateLabel} (×${carry.weight_modifier})`);

  // Carry limits table
  const limitsEl = el("carry_limits");
  if (limitsEl) {
    limitsEl.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>None</th><th>Light</th><th>Medium</th><th>Heavy</th><th>Very Heavy</th>
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
