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

  setHTML(
    "meleeSlots",
    equippedWeapons.length === 0
      ? `<p class="empty-storage">No Equipped Weapons</p>`
      : equippedWeapons.map((inst) => renderEquippedMeleeSlot(inst, names, data)).join(""),
  );
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
    <div class="melee-slot">
      <select class="equipped-melee-name" data-instance-id="${instanceId}">
        ${names
          .map(
            (name) =>
              `<option value="${name}" ${equippedWeapon.weapon_name === name ? "selected" : ""}>${name}</option>`,
          )
          .join("")}
      </select>

      <select class="equipped-melee-tier" data-instance-id="${instanceId}">
        ${tiers
          .map(
            (tier) =>
              `<option value="${tier}" ${equippedWeapon.weapon_tier === tier ? "selected" : ""}>${tier}</option>`,
          )
          .join("")}
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

  return `
    <div class="melee-storage-section">
      <h3>${STORAGE_LABELS[location]}</h3>
      ${weapons.length === 0 ? `<p class="empty-storage">Empty</p>` : renderWeaponList(weapons, data)}
    </div>
  `;
}

function renderWeaponList(weapons, data) {
  return `
    <ul>
      ${weapons.map((inst) => renderStoredMeleeItem(inst, data)).join("")}
    </ul>
  `;
}

function renderStoredMeleeItem(inst, data) {
  const weaponData = data.melee_weapons.find((w) => w.weapon_id === inst.weapon_id);
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
        cssClass: "stored-melee-hp",
        dataAttrs: `data-instance-id="${instanceId}"`,
      })}

      <select class="melee-storage-select" data-instance-id="${instanceId}">
        ${storageOptions(inst.storedAt)}
      </select>

      <button class="equip-stored-melee" data-instance-id="${instanceId}">Equip</button>
      <button class="remove-melee" data-instance-id="${instanceId}">❌</button>
    </li>
  `;
}
