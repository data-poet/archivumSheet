import { setHTML } from "../../shared/dom.js";
import { ARMOR_SLOTS, STORAGE_LABELS } from "../../shared/constants.js";
import { resolveMaterial } from "../../shared/durabilityUtils.js";
import { hpModifierBlock } from "../../shared/inventoryRenderUtils.js";
import { materialOptions, tierOptions, equippedMoveSelect, storageOptions } from "../../shared/equipmentSelectors.js";

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED ARMOR SLOTS
// ─────────────────────────────────────────────────────────────────────────────

export function renderArmorSlots(selected, data) {
  const html = ARMOR_SLOTS.map((slot) => renderArmorSlot(slot, selected, data)).join("");
  setHTML("armorSlots", html);
}

function renderArmorSlot(slot, selected, data) {
  const slotArmors = data.armors.filter((a) => a.armor_piece_location === slot);

  const equippedInstance = selected.armors.find((inst) => {
    if (!inst.is_equipped) return false;
    const db = data.armors.find((a) => a.armor_id === inst.armor_id);
    return db?.armor_piece_location === slot;
  });

  const equippedArmor = equippedInstance
    ? data.armors.find((a) => a.armor_id === equippedInstance.armor_id)
    : null;

  const names = [...new Set(slotArmors.map((a) => a.armor_name))];
  const tiers = equippedArmor
    ? slotArmors.filter((a) => a.armor_name === equippedArmor.armor_name).map((a) => a.armor_tier)
    : [];

  const material = resolveMaterial(equippedInstance, data.materials);

  return `
    <div class="equipped-slot-grid">
      <div class="equipped-slot-label">${slot}</div>
      <div class="equipped-slot-controls">
        <select class="equipped-armor-name" data-slot="${slot}">
          <option value="">Empty</option>
          ${names.map((name) =>
            `<option value="${name}" ${equippedArmor?.armor_name === name ? "selected" : ""}>${name}</option>`
          ).join("")}
        </select>

        <select class="equipped-armor-tier" data-slot="${slot}">
          ${tierOptions(tiers, equippedArmor?.armor_tier)}
        </select>

        <select class="equipped-armor-material" data-slot="${slot}">
          ${materialOptions(data.materials, equippedInstance?.material_id)}
        </select>

        ${equippedInstance
          ? hpModifierBlock({
              baseHp: equippedArmor?.armor_hit_points ?? 0,
              material,
              hpModifier: equippedInstance.hit_points_modifier,
              cssClass: "equipped-armor-hp",
              dataAttrs: `data-slot="${slot}"`,
            })
          : ""}

        ${equippedMoveSelect("equipped-armor-move", `data-slot="${slot}"`)}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED ARMORS
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredArmors(selected, data) {
  const stored = selected.armors.filter((a) => !a.is_equipped);
  const sections = ["backpack", "stash", "camp"]
    .map((loc) => renderStorageSection(loc, stored, selected, data))
    .join("");
  setHTML("armorStorageList", sections);
}

function renderStorageSection(location, storedArmors, selected, data) {
  const armorsInLocation = storedArmors.filter((a) => a.storedAt === location);

  let bodyRows = "";
  if (armorsInLocation.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="7">Empty</td></tr>`;
  } else {
    bodyRows = armorsInLocation.map((inst) => {
      const armorData = data.armors.find((a) => a.armor_id === inst.armor_id);
      if (!armorData) return "";
      const material = resolveMaterial(inst, data.materials);
      const maxHp = armorData.armor_hit_points ?? 0;
      const instanceId = inst._instanceId;
      return `
        <tr>
          <td>${armorData.armor_piece_location}</td>
          <td>${armorData.armor_name}</td>
          <td>${armorData.armor_tier}</td>
          <td>${material?.material_name ?? "—"}</td>
          <td class="col-num">
            ${hpModifierBlock({
              baseHp: maxHp,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-armor-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td>
            <select class="armor-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button class="equip-stored-armor" data-instance-id="${instanceId}">Equip</button>
            <button class="btn-remove remove-armor" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>`;
    }).join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <table>
      <thead>
        <tr>
          <th>Slot</th><th>Name</th><th>Tier</th><th>Material</th>
          <th>HP</th><th>Storage</th><th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}
