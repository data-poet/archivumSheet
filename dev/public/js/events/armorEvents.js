import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipArmor,
  addStoredArmor,
  moveArmor,
  removeArmor,
  findEquippedArmorInSlot,
  findArmorByInstanceId,
} from "../inventory/armor.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";

const data = state.data;
const selected = state.selected;

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleArmorClick(e) {
  if (e.target.classList.contains("remove-armor")) {
    removeArmor(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("equip-stored-armor")) {
    const instanceId = e.target.dataset.instanceId;
    const armorToEquip = findArmorByInstanceId(instanceId);
    if (!armorToEquip) return true;

    const dbArmor = data.armors.find(
      (a) => a.armor_id === armorToEquip.armor_id,
    );
    if (!dbArmor) return true;

    const slot = dbArmor.armor_piece_location;

    // Unequip anything already in this slot
    selected.armors.forEach((inst) => {
      if (!inst.is_equipped) return;
      const db = data.armors.find((a) => a.armor_id === inst.armor_id);
      if (db?.armor_piece_location === slot) {
        inst.is_equipped = false;
        inst.storedAt = "backpack";
      }
    });

    armorToEquip.is_equipped = true;
    armorToEquip.storedAt = null;

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleArmorInput(e) {
  // Equipped armor HP modifier
  if (e.target.classList.contains("equipped-armor-hp")) {
    const slot = e.target.dataset.slot;
    const equippedArmor = findEquippedArmorInSlot(slot);
    if (!equippedArmor) return true;

    const armorData = data.armors.find(
      (a) => a.armor_id === equippedArmor.armor_id,
    );
    const { maxHp } = resolveHp(
      equippedArmor,
      armorData?.armor_hit_points ?? 0,
      data.materials,
    );

    equippedArmor.hit_points_modifier = clampHpModifier(e.target.value, maxHp);

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  // Stored armor HP modifier
  if (e.target.classList.contains("stored-armor-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const armorInstance = findArmorByInstanceId(instanceId);
    if (!armorInstance) return true;

    const armorData = data.armors.find(
      (a) => a.armor_id === armorInstance.armor_id,
    );
    const { maxHp } = resolveHp(
      armorInstance,
      armorData?.armor_hit_points ?? 0,
      data.materials,
    );

    armorInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleArmorChange(e) {
  // Name changed on equipped slot
  if (e.target.classList.contains("equipped-armor-name")) {
    const slot = e.target.dataset.slot;
    const name = e.target.value;

    if (!name) {
      equipArmor(slot, "");
      return true;
    }

    const tierSelect = document.querySelector(
      `.equipped-armor-tier[data-slot="${slot}"]`,
    );
    const availableArmors = data.armors.filter(
      (a) => a.armor_piece_location === slot && a.armor_name === name,
    );

    if (tierSelect) {
      tierSelect.innerHTML = availableArmors
        .map((a) => `<option value="${a.armor_tier}">${a.armor_tier}</option>`)
        .join("");
    }

    const firstArmor = availableArmors[0];
    if (!firstArmor) return true;

    equipArmor(slot, firstArmor.armor_id, "MAT-000");
    renderLists(selected, data);
    return true;
  }

  // Tier changed on equipped slot
  if (e.target.classList.contains("equipped-armor-tier")) {
    const slot = e.target.dataset.slot;
    const tier = e.target.value;
    const nameEl = document.querySelector(
      `.equipped-armor-name[data-slot="${slot}"]`,
    );
    if (!nameEl) return true;

    const armor = data.armors.find(
      (a) =>
        a.armor_piece_location === slot &&
        a.armor_name === nameEl.value &&
        a.armor_tier === tier,
    );
    if (!armor) return true;

    const currentEquipped = findEquippedArmorInSlot(slot);
    equipArmor(slot, armor.armor_id, currentEquipped?.material_id || "MAT-000");
    return true;
  }

  // Material changed on equipped slot
  if (e.target.classList.contains("equipped-armor-material")) {
    const slot = e.target.dataset.slot;
    const equippedArmor = findEquippedArmorInSlot(slot);
    if (!equippedArmor) return true;

    equippedArmor.material_id = e.target.value;
    equippedArmor.hit_points_modifier = 0;

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  // Stored armor storage location changed
  if (e.target.classList.contains("armor-storage-select")) {
    moveArmor(e.target.dataset.instanceId, e.target.value);
    return true;
  }

  // Equipped armor moved to storage
  if (e.target.classList.contains("equipped-armor-move")) {
    const slot = e.target.dataset.slot;
    const destination = e.target.value;
    const equippedArmor = findEquippedArmorInSlot(slot);
    if (!equippedArmor) return true;

    if (!destination) {
      equippedArmor.is_equipped = true;
      equippedArmor.storedAt = null;
    } else {
      equippedArmor.is_equipped = false;
      equippedArmor.storedAt = destination;
    }

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddArmor() {
  const slotEl = document.getElementById("armorSlotSelect");
  const nameEl = document.getElementById("armorNameSelect");
  const tierEl = document.getElementById("armorTierSelect");
  const materialEl = document.getElementById("armorMaterialSelect");
  const storageEl = document.getElementById("armorStorage");

  if (!slotEl || !nameEl || !tierEl || !materialEl || !storageEl) return;

  const armor = data.armors.find(
    (a) =>
      a.armor_piece_location === slotEl.value &&
      a.armor_name === nameEl.value &&
      a.armor_tier === tierEl.value,
  );
  if (!armor) return;

  const material = data.materials.find(
    (m) => m.material_name === materialEl.value,
  );
  addStoredArmor(
    armor.armor_id,
    material?.material_id ?? null,
    storageEl.value,
  );
}
