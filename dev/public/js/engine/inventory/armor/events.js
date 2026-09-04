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
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { renderArmorSlots, renderStoredArmors } from "./render.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";
import { createCustomFieldsClickHandler } from "../shared/customFieldsDispatch.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Re-renders only the armor lists, not a full renderLists() sweep — same reasoning as accessories' _renderAccessoryLists.
//
// Uses snapshotAll()/restoreAll() rather than a single-scope helper because armor actions can move an item BETWEEN
// #armorSlots and #armorStorageList in one step (equip/unequip/move), so both need their state captured together.
//
// Deferred by one rAF because several callers fire from native <select> "change" handlers, and replacing the
// select's DOM ancestor before the browser finishes its own change/native-picker cycle causes a visible flicker
// (worst on mobile Safari). Restore happens in the same frame as the render to avoid painting the rebuilt DOM
// in its default-collapsed state first. Mirrors openState.js's withOpenState.
function _renderArmorLists(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderArmorSlots(selected, data, sheet);
    renderStoredArmors(selected, data, sheet);
    restoreAll(snapshots);
  });
}

// saveArmorCustomFields calls its own renderLists()+triggerAutoRun() internally (unwrapped); snapshot/restore
// synchronously around it here so that internal render doesn't blow away open state elsewhere on the page.
function _saveArmorCustomFieldsWrapped(instanceId, values) {
  const snapshots = snapshotAll();
  saveArmorCustomFields(instanceId, values);
  restoreAll(snapshots);
}

const _handleArmorCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findArmorByInstanceId,
  saveCustomFields: _saveArmorCustomFieldsWrapped,
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

export function handleArmorInput(e) {
  if (e.target.classList.contains("resume-armor-hp")) {
    const slot = e.target.dataset.slot;
    const equippedArmor = findEquippedArmorInSlot(slot);
    if (!equippedArmor) return true;
    if (/^-$/.test(e.target.value)) return true;
    const armorData = data.armors.find(
      (a) => a.armor_id === equippedArmor.armor_id,
    );
    const { maxHp } = resolveHp(
      equippedArmor,
      armorData?.armor_hit_points ?? 0,
      data.materials,
    );
    equippedArmor.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateResumeHpDisplay(e.target, maxHp, equippedArmor.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-armor-hp")) {
    const slot = e.target.dataset.slot;
    const equippedArmor = findEquippedArmorInSlot(slot);
    if (!equippedArmor) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const armorData = data.armors.find(
      (a) => a.armor_id === equippedArmor.armor_id,
    );
    const { maxHp } = resolveHp(
      equippedArmor,
      armorData?.armor_hit_points ?? 0,
      data.materials,
    );
    equippedArmor.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, equippedArmor.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("stored-armor-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const armorInstance = findArmorByInstanceId(instanceId);
    if (!armorInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const armorData = data.armors.find(
      (a) => a.armor_id === armorInstance.armor_id,
    );
    const { maxHp } = resolveHp(
      armorInstance,
      armorData?.armor_hit_points ?? 0,
      data.materials,
    );
    armorInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, armorInstance.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  return false;
}

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

// ─── Private helpers ──────────────────────────────────────────────────────────

// 300ms-debounced render for HP-modifier inputs so typing doesn't trigger a re-render per keystroke.
let _deferTimer = null;
function _deferRender() {
  clearTimeout(_deferTimer);
  _deferTimer = setTimeout(() => {
    _renderArmorLists();
  }, 300);
}

function _updateResumeHpDisplay(inputEl, maxHp, modifier) {
  const cell = inputEl.closest("td");
  if (!cell) return;
  const actual = cell.querySelector(".resume-hp-actual");
  if (actual) actual.textContent = maxHp + (modifier || 0);
}

function _updateActualHpDisplay(inputEl, maxHp, modifier) {
  const block = inputEl.closest(".hp-modifier");
  if (!block) return;
  const strongs = block.querySelectorAll("strong");
  if (strongs.length >= 2) strongs[1].textContent = maxHp + (modifier || 0);
}
