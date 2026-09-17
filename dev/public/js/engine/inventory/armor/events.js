import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import {
  equipArmor,
  addStoredArmor,
  moveArmor,
  removeArmor,
  findEquippedArmorInSlot,
  findArmorByInstanceId,
  saveArmorCustomFields,
  addArmorEnchantment,
  updateArmorEnchantment,
  removeArmorEnchantment,
} from "./model.js";
import { renderArmorSlots, renderStoredArmors } from "./render.js";
import {
  createCustomFieldsClickHandler,
  withPreservedOpenState,
} from "../shared/customFieldsDispatch.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import {
  createListRenderer,
  createDeferredRender,
} from "../shared/renderScheduling.js";
import {
  createHpInputHandler,
  updateResumeHpDisplay,
  updateActualHpDisplay,
} from "../shared/durabilityDispatch.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const _renderArmorLists = createListRenderer(
  renderArmorSlots,
  renderStoredArmors,
);

const _deferRender = createDeferredRender(() => _renderArmorLists());

const _handleArmorCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findArmorByInstanceId,
  saveCustomFields: withPreservedOpenState(saveArmorCustomFields),
  render: _renderArmorLists,
});

// No runWithOpenState override needed here: armor's own enchantment model functions call the global
// renderListsPreserving() directly, which already snapshots+restores synchronously on its own.
const _armorEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findArmorByInstanceId,
  getItems: () => selected.armors,
  addEnchantment: addArmorEnchantment,
  updateEnchantment: updateArmorEnchantment,
  removeEnchantment: removeArmorEnchantment,
  render: () => _renderArmorLists(state.sheet),
});

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleArmorClick(e) {
  if (e.target.classList.contains("remove-armor")) {
    removeArmor(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("remove-equipped-armor")) {
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
    _renderArmorLists();
    triggerAutoRun();
    return true;
  }

  // ── Custom fields: edit / save / cancel ───────────────────────────────────
  if (_handleArmorCustomFieldsClick(e)) return true;

  // ── Enchantments: remove / add / save (edit or swap) ───────────────────────
  if (_armorEnchantments.handleClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

// Armor's equipped rows are addressed by slot (one piece per body location), not by
// instance id — only the storage rows carry data-instance-id.
export const handleArmorInput = createHpInputHandler({
  variants: [
    {
      cssClass: "resume-armor-hp",
      findInstance: (el) => findEquippedArmorInSlot(el.dataset.slot),
      display: updateResumeHpDisplay,
    },
    {
      cssClass: "equipped-armor-hp",
      findInstance: (el) => findEquippedArmorInSlot(el.dataset.slot),
      display: updateActualHpDisplay,
    },
    {
      cssClass: "stored-armor-hp",
      findInstance: (el) => findArmorByInstanceId(el.dataset.instanceId),
      display: updateActualHpDisplay,
    },
  ],
  catalog: () => data.armors,
  catalogIdField: "armor_id",
  baseHpField: "armor_hit_points",
  deferRender: _deferRender,
});

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleArmorChange(e) {
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

    // Edit in place to preserve _instanceId and armor_custom_* fields (matches melee/ranged/firearms/shield) —
    // equipArmor() would otherwise unequip-and-recreate, resetting customizations on a same-slot tier/name swap.
    const currentEquipped = findEquippedArmorInSlot(slot);
    if (currentEquipped) {
      currentEquipped.armor_id = firstArmor.armor_id;
      currentEquipped.hit_points_modifier = 0;
      triggerAutoRun();
      return true;
    }

    equipArmor(slot, firstArmor.armor_id, "MAT-000");
    _renderArmorLists();
    return true;
  }

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

    // Same in-place-edit rationale as equipped-armor-name above.
    const currentEquipped = findEquippedArmorInSlot(slot);
    if (currentEquipped) {
      currentEquipped.armor_id = armor.armor_id;
      currentEquipped.hit_points_modifier = 0;
      triggerAutoRun();
      return true;
    }

    equipArmor(slot, armor.armor_id, "MAT-000");
    return true;
  }

  if (e.target.classList.contains("equipped-armor-material")) {
    const slot = e.target.dataset.slot;
    const equippedArmor = findEquippedArmorInSlot(slot);
    if (!equippedArmor) return true;
    equippedArmor.material_id = e.target.value;
    equippedArmor.hit_points_modifier = 0;
    _renderArmorLists();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("armor-storage-select")) {
    moveArmor(e.target.dataset.instanceId, e.target.value);
    return true;
  }

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
    _renderArmorLists();
    triggerAutoRun();
    return true;
  }

  // ── Enchantments: cascading category/type/target filters ───────────────────
  if (_armorEnchantments.handleChange(e)) return true;

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

