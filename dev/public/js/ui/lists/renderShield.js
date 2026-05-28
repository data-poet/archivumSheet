import { setHTML } from "../../shared/dom.js";
import { STORAGE_LABELS } from "../../shared/constants.js";
import { resolveMaterial } from "../../shared/durabilityUtils.js";
import { hpModifierBlock } from "../../shared/inventoryRenderUtils.js";
import { materialOptions, tierOptions, equippedMoveSelect, storageOptions } from "../../shared/equipmentSelectors.js";

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED SHIELD
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedShield(selected, data) {
  const equippedInstance = selected.shields.find((s) => s.is_equipped);
  const equippedShield = equippedInstance
    ? data.shields.find((s) => s.shield_id === equippedInstance.shield_id)
    : null;

  const names = [...new Set(data.shields.map((s) => s.shield_name))];
  const tiers = equippedShield
    ? data.shields.filter((s) => s.shield_name === equippedShield.shield_name).map((s) => s.shield_tier)
    : [];

  const material = resolveMaterial(equippedInstance, data.materials);

  setHTML("shieldSlot", `
    <div class="equipped-slot-grid">
      <div class="equipped-slot-label">Shield</div>
      <div class="equipped-slot-controls">
        <select class="equipped-shield-name">
          <option value="">Empty</option>
          ${names.map((name) =>
            `<option value="${name}" ${equippedShield?.shield_name === name ? "selected" : ""}>${name}</option>`
          ).join("")}
        </select>

        <select class="equipped-shield-tier">
          ${tierOptions(tiers, equippedShield?.shield_tier)}
        </select>

        <select class="equipped-shield-material">
          ${materialOptions(data.materials, equippedInstance?.material_id)}
        </select>

        ${equippedInstance
          ? hpModifierBlock({
              baseHp: equippedShield?.shield_hit_points ?? 0,
              material,
              hpModifier: equippedInstance.hit_points_modifier,
              cssClass: "equipped-shield-hp",
            })
          : ""}

        ${equippedMoveSelect("equipped-shield-move")}
      </div>
    </div>
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED SHIELDS
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredShields(selected, data) {
  const stored = selected.shields.filter((s) => !s.is_equipped);
  const sections = ["backpack", "stash", "camp"]
    .map((loc) => renderStorageSection(loc, stored, data))
    .join("");
  setHTML("shieldStorageList", sections);
}

function renderStorageSection(location, stored, data) {
  const shields = stored.filter((s) => s.storedAt === location);

  let bodyRows = "";
  if (shields.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="6">Empty</td></tr>`;
  } else {
    bodyRows = shields.map((inst) => {
      const shieldData = data.shields.find((s) => s.shield_id === inst.shield_id);
      if (!shieldData) return "";
      const material = resolveMaterial(inst, data.materials);
      const instanceId = inst._instanceId;
      return `
        <tr>
          <td>${shieldData.shield_name}</td>
          <td>${shieldData.shield_tier}</td>
          <td>${material?.material_name ?? "—"}</td>
          <td class="col-num">
            ${hpModifierBlock({
              baseHp: shieldData.shield_hit_points ?? 0,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-shield-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td>
            <select class="shield-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button class="equip-stored-shield" data-instance-id="${instanceId}">Equip</button>
            <button class="btn-remove remove-shield" data-instance-id="${instanceId}">✕</button>
          </td>
        </tr>`;
    }).join("");
  }

  return `
    <div class="storage-section-header">${STORAGE_LABELS[location]}</div>
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Tier</th><th>Material</th>
          <th>HP</th><th>Storage</th><th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}
