import { setHTML } from "../../shared/dom.js";
import { STORAGE_LABELS } from "../../shared/constants.js";
import { resolveMaterial } from "../../shared/durabilityUtils.js";
import { hpModifierBlock } from "../../shared/inventoryRenderUtils.js";
import {
  materialOptions,
  equippedMoveSelect,
  storageOptions,
} from "../../shared/equipmentSelectors.js";

// ─────────────────────────────────────────────────────────────────────────────
// EQUIPPED RANGED
// ─────────────────────────────────────────────────────────────────────────────

export function renderEquippedRanged(selected, data) {
  const equippedWeapons = selected.ranged_weapons.filter((w) => w.is_equipped);
  const names = [...new Set(data.ranged_weapons.map((w) => w.weapon_name))];

  setHTML(
    "rangedSlots",
    equippedWeapons.length === 0
      ? `<p class="empty-storage">No Equipped Weapons</p>`
      : equippedWeapons
          .map((inst) => renderEquippedRangedSlot(inst, names, data))
          .join(""),
  );
}

function renderEquippedRangedSlot(inst, names, data) {
  const equippedWeapon = data.ranged_weapons.find(
    (w) => w.weapon_id === inst.weapon_id,
  );
  if (!equippedWeapon) return "";

  const tiers = data.ranged_weapons
    .filter((w) => w.weapon_name === equippedWeapon.weapon_name)
    .map((w) => w.weapon_tier);

  const material = resolveMaterial(inst, data.materials);
  const instanceId = inst._instanceId;

  return `
    <div class="ranged-slot">
      <select class="equipped-ranged-name" data-instance-id="${instanceId}">
        ${names
          .map(
            (name) =>
              `<option value="${name}" ${equippedWeapon.weapon_name === name ? "selected" : ""}>${name}</option>`,
          )
          .join("")}
      </select>

      <select class="equipped-ranged-tier" data-instance-id="${instanceId}">
        ${tiers
          .map(
            (tier) =>
              `<option value="${tier}" ${equippedWeapon.weapon_tier === tier ? "selected" : ""}>${tier}</option>`,
          )
          .join("")}
      </select>

      <select class="equipped-ranged-material" data-instance-id="${instanceId}">
        ${materialOptions(data.materials, inst.material_id)}
      </select>

      ${hpModifierBlock({
        baseHp: equippedWeapon.weapon_hit_points ?? 0,
        material,
        hpModifier: inst.hit_points_modifier,
        cssClass: "equipped-ranged-hp",
        dataAttrs: `data-instance-id="${instanceId}"`,
      })}

      ${equippedMoveSelect("equipped-ranged-move", `data-instance-id="${instanceId}"`)}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED RANGED
// ─────────────────────────────────────────────────────────────────────────────

export function renderStoredRanged(selected, data) {
  const stored = selected.ranged_weapons.filter((w) => !w.is_equipped);
  const sections = ["backpack", "stash", "camp"]
    .map((loc) => renderStorageSection(loc, stored, data))
    .join("");

  setHTML("rangedStorageList", sections);
}

function renderStorageSection(location, stored, data) {
  const weapons = stored.filter((w) => w.storedAt === location);

  return `
    <div class="ranged-storage-section">
      <h3>${STORAGE_LABELS[location]}</h3>
      ${weapons.length === 0 ? `<p class="empty-storage">Empty</p>` : renderWeaponList(weapons, data)}
    </div>
  `;
}

function renderWeaponList(weapons, data) {
  return `
    <ul>
      ${weapons.map((inst) => renderStoredRangedItem(inst, data)).join("")}
    </ul>
  `;
}

function renderStoredRangedItem(inst, data) {
  const weaponData = data.ranged_weapons.find(
    (w) => w.weapon_id === inst.weapon_id,
  );
  if (!weaponData) return "";

  const material = resolveMaterial(inst, data.materials);
  const instanceId = inst._instanceId;

  return `
    <li>
      <strong>
        ${weaponData.weapon_name} | ${weaponData.weapon_tier} | ${material?.material_name ?? "No Material"}
      </strong>

      ${hpModifierBlock({
        baseHp: weaponData.weapon_hit_points ?? 0,
        material,
        hpModifier: inst.hit_points_modifier,
        cssClass: "stored-ranged-hp",
        dataAttrs: `data-instance-id="${instanceId}"`,
      })}

      <select class="ranged-storage-select" data-instance-id="${instanceId}">
        ${storageOptions(inst.storedAt)}
      </select>

      <button class="equip-stored-ranged" data-instance-id="${instanceId}">Equip</button>
      <button class="remove-ranged" data-instance-id="${instanceId}">❌</button>
    </li>
  `;
}
