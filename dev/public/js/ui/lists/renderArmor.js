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
    ? slotArmors
        .filter((a) => a.armor_name === equippedArmor.armor_name)
        .map((a) => a.armor_tier)
    : [];

  const material = resolveMaterial(equippedInstance, data.materials);

  const instanceId = equippedInstance?._instanceId ?? "";

  return `
    <div class="armor-slot">
      <strong>${slot}</strong>

      <select class="equipped-armor-name" data-slot="${slot}">
        <option value="">Empty</option>
        ${names
          .map(
            (name) =>
              `<option value="${name}" ${equippedArmor?.armor_name === name ? "selected" : ""}>${name}</option>`,
          )
          .join("")}
      </select>

      <select class="equipped-armor-tier" data-slot="${slot}">
        ${tierOptions(tiers, equippedArmor?.armor_tier)}
      </select>

      <select class="equipped-armor-material" data-slot="${slot}">
        ${materialOptions(data.materials, equippedInstance?.material_id)}
      </select>

      ${
        equippedInstance
          ? hpModifierBlock({
              baseHp: equippedArmor?.armor_hit_points ?? 0,
              material,
              hpModifier: equippedInstance.hit_points_modifier,
              cssClass: "equipped-armor-hp",
              dataAttrs: `data-slot="${slot}"`,
            })
          : ""
      }

      ${equippedMoveSelect("equipped-armor-move", `data-slot="${slot}"`)}
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

  const visibleSlots = ARMOR_SLOTS.filter((slot) =>
    armorsInLocation.some((inst) => {
      const db = data.armors.find((a) => a.armor_id === inst.armor_id);
      return db?.armor_piece_location === slot;
    }),
  );

  return `
    <div class="armor-storage-section">
      <h3>${STORAGE_LABELS[location]}</h3>
      ${
        visibleSlots.length === 0
          ? `<p class="empty-storage">Empty</p>`
          : visibleSlots.map((slot) => renderSlotGroup(slot, armorsInLocation, data)).join("")
      }
    </div>
  `;
}

function renderSlotGroup(slot, armors, data) {
  const slotArmors = armors.filter((inst) => {
    const db = data.armors.find((a) => a.armor_id === inst.armor_id);
    return db?.armor_piece_location === slot;
  });

  if (slotArmors.length === 0) return "";

  return `
    <div class="armor-slot-group">
      <h4>${slot}</h4>
      <ul>
        ${slotArmors.map((inst) => renderStoredArmorItem(inst, data)).join("")}
      </ul>
    </div>
  `;
}

function renderStoredArmorItem(inst, data) {
  const armorData = data.armors.find((a) => a.armor_id === inst.armor_id);
  if (!armorData) return "";

  const material = resolveMaterial(inst, data.materials);
  const instanceId = inst._instanceId;

  return `
    <li>
      <strong>
        ${armorData.armor_name} | ${armorData.armor_tier} | ${material?.material_name ?? "No Material"}
      </strong>

      ${hpModifierBlock({
        baseHp: armorData.armor_hit_points ?? 0,
        material,
        hpModifier: inst.hit_points_modifier,
        cssClass: "stored-armor-hp",
        dataAttrs: `data-instance-id="${instanceId}"`,
      })}

      <select class="armor-storage-select" data-instance-id="${instanceId}">
        ${storageOptions(inst.storedAt)}
      </select>

      <button class="equip-stored-armor" data-instance-id="${instanceId}">Equip</button>
      <button class="remove-armor" data-instance-id="${instanceId}">❌</button>
    </li>
  `;
}
