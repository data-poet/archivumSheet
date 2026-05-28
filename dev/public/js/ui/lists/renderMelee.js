import { setHTML } from "../../shared/dom.js";
import { STORAGE_LABELS } from "../../shared/constants.js";
import { resolveMaterial } from "../../shared/durabilityUtils.js";
import { hpModifierBlock } from "../../shared/inventoryRenderUtils.js";
import { materialOptions, equippedMoveSelect, storageOptions } from "../../shared/equipmentSelectors.js";

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED MELEE
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedMelee(selected, data) {
  const equippedWeapons = selected.melee_weapons.filter((w) => w.is_equipped);
  const names = [...new Set(data.melee_weapons.map((w) => w.weapon_name))];

  if (equippedWeapons.length === 0) {
    setHTML("meleeSlots", `<p class="empty-storage">No equipped weapons</p>`);
    return;
  }

  setHTML("meleeSlots", equippedWeapons.map((inst) => renderEquippedMeleeSlot(inst, names, data)).join(""));
}

function renderEquippedMeleeSlot(inst, names, data) {
  const equippedWeapon = data.melee_weapons.find((w) => w.weapon_id === inst.weapon_id);
  if (!equippedWeapon) return "";

  const tiers = data.melee_weapons
    .filter((w) => w.weapon_name === equippedWeapon.weapon_name)
    .map((w) => w.weapon_tier);

  const material = resolveMaterial(inst, data.materials);
  const instanceId = inst._instanceId;

  return `
    <div class="equipped-slot-grid">
      <div class="equipped-slot-label">Melee</div>
      <div class="equipped-slot-controls">
        <select class="equipped-melee-name" data-instance-id="${instanceId}">
          ${names.map((name) =>
            `<option value="${name}" ${equippedWeapon.weapon_name === name ? "selected" : ""}>${name}</option>`
          ).join("")}
        </select>

        <select class="equipped-melee-tier" data-instance-id="${instanceId}">
          ${tiers.map((tier) =>
            `<option value="${tier}" ${equippedWeapon.weapon_tier === tier ? "selected" : ""}>${tier}</option>`
          ).join("")}
        </select>

        <select class="equipped-melee-material" data-instance-id="${instanceId}">
          ${materialOptions(data.materials, inst.material_id)}
        </select>

        ${hpModifierBlock({
          baseHp: equippedWeapon.weapon_hit_points ?? 0,
          material,
          hpModifier: inst.hit_points_modifier,
          cssClass: "equipped-melee-hp",
          dataAttrs: `data-instance-id="${instanceId}"`,
        })}

        ${equippedMoveSelect("equipped-melee-move", `data-instance-id="${instanceId}"`)}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED MELEE
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredMelee(selected, data) {
  const stored = selected.melee_weapons.filter((w) => !w.is_equipped);
  const sections = ["backpack", "stash", "camp"]
    .map((loc) => renderStorageSection(loc, stored, data))
    .join("");
  setHTML("meleeStorageList", sections);
}

function renderStorageSection(location, stored, data) {
  const weapons = stored.filter((w) => w.storedAt === location);

  let bodyRows = "";
  if (weapons.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="6">Empty</td></tr>`;
  } else {
    bodyRows = weapons.map((inst) => {
      const weaponData = data.melee_weapons.find((w) => w.weapon_id === inst.weapon_id);
      if (!weaponData) return "";
      const material = resolveMaterial(inst, data.materials);
      const instanceId = inst._instanceId;
      return `
        <tr>
          <td>${weaponData.weapon_name}</td>
          <td>${weaponData.weapon_tier}</td>
          <td>${material?.material_name ?? "—"}</td>
          <td class="col-num">
            ${hpModifierBlock({
              baseHp: weaponData.weapon_hit_points ?? 0,
              material,
              hpModifier: inst.hit_points_modifier,
              cssClass: "stored-melee-hp",
              dataAttrs: `data-instance-id="${instanceId}"`,
            })}
          </td>
          <td>
            <select class="melee-storage-select" data-instance-id="${instanceId}">
              ${storageOptions(inst.storedAt)}
            </select>
          </td>
          <td class="col-action">
            <button class="equip-stored-melee" data-instance-id="${instanceId}">Equip</button>
            <button class="btn-remove remove-melee" data-instance-id="${instanceId}">✕</button>
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
