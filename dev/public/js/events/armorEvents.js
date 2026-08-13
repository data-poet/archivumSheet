import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipArmor, addStoredArmor, moveArmor, removeArmor,
  findEquippedArmorInSlot, findArmorByInstanceId, saveArmorCustomFields,
} from "../inventory/armor.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { renderArmorSlots, renderStoredArmors } from "../ui/lists/renderArmor.js";
import { snapshotAll, restoreAll } from "../shared/openState.js";
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "../ui/lists/renderUtils.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Re-renders ONLY the armor lists (equipped slots + storage), not a full
 * renderLists() sweep of all 21 sections — same reasoning as accessories'
 * _renderAccessoryLists.
 *
 * Uses the shared snapshotAll()/restoreAll() pair (all managed containers)
 * rather than a single-scope helper like withOpenState: several armor
 * actions move an item BETWEEN #armorSlots and #armorStorageList in one
 * step (equip/unequip/move), so both need their open/closed state captured
 * and restored together, not just whichever one the click originated in.
 * snapshotAll/restoreAll's generic key function already understands both
 * armor's div-block (data-slot) and table-row (data-instance-id) patterns,
 * plus scroll-position and nested data-detail-kind handling that this file
 * previously didn't have at all.
 *
 * Deferred by one requestAnimationFrame for the same reason withOpenState
 * defers its render: several callers below fire from native <select>
 * "change" handlers, and replacing that select's DOM ancestor before the
 * browser has finished its own change-event/native-picker cycle causes a
 * visible flicker (worst on mobile Safari). Restore happens in the SAME
 * frame as the render — not a later one — to avoid the opposite bug:
 * painting the freshly-rebuilt DOM in its default-collapsed state before
 * it reopens. See openState.js's withOpenState doc comment for the full
 * rationale; this mirrors it exactly.
 */
function _renderArmorLists(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderArmorSlots(selected, data, sheet);
    renderStoredArmors(selected, data, sheet);
    restoreAll(snapshots);
  });
}

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
    const dbArmor = data.armors.find((a) => a.armor_id === armorToEquip.armor_id);
    if (!dbArmor) return true;
    const slot = dbArmor.armor_piece_location;
    selected.armors.forEach((inst) => {
      if (!inst.is_equipped) return;
      const db = data.armors.find((a) => a.armor_id === inst.armor_id);
      if (db?.armor_piece_location === slot) { inst.is_equipped = false; inst.storedAt = "backpack"; }
    });
    armorToEquip.is_equipped = true;
    armorToEquip.storedAt = null;
    _renderArmorLists();
    triggerAutoRun();
    return true;
  }

  // ── Custom fields: edit / save / cancel ───────────────────────────────────
  // Generic buttons rendered by customFieldsBlock; only acted on here if the
  // instanceId actually belongs to an armor piece — lets other equipment
  // types safely reuse the same button classes without collisions.

  if (e.target.classList.contains("custom-fields-edit-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findArmorByInstanceId(instanceId)) return false;
    openCustomFieldsEditor(instanceId);
    _renderArmorLists();
    return true;
  }

  if (e.target.classList.contains("custom-fields-cancel-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findArmorByInstanceId(instanceId)) return false;
    closeCustomFieldsEditor(instanceId);
    _renderArmorLists();
    return true;
  }

  if (e.target.classList.contains("custom-fields-save-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findArmorByInstanceId(instanceId)) return false;
    const values = readCustomFieldsEditorValues(instanceId);
    closeCustomFieldsEditor(instanceId);
    if (values) {
      // saveArmorCustomFields mutates + calls its own renderLists()+
      // triggerAutoRun() internally (unwrapped) — snapshot right before it
      // and restore right after it returns (both synchronous) so that
      // internal render doesn't blow away open state anywhere on the page.
      const snapshots = snapshotAll();
      saveArmorCustomFields(instanceId, values);
      restoreAll(snapshots);
    } else {
      _renderArmorLists();
    }
    return true;
  }

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleArmorInput(e) {
  if (e.target.classList.contains("resume-armor-hp")) {
    const slot         = e.target.dataset.slot;
    const equippedArmor = findEquippedArmorInSlot(slot);
    if (!equippedArmor) return true;
    if (/^-$/.test(e.target.value)) return true;
    const armorData = data.armors.find((a) => a.armor_id === equippedArmor.armor_id);
    const { maxHp } = resolveHp(equippedArmor, armorData?.armor_hit_points ?? 0, data.materials);
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
    const armorData = data.armors.find((a) => a.armor_id === equippedArmor.armor_id);
    const { maxHp } = resolveHp(equippedArmor, armorData?.armor_hit_points ?? 0, data.materials);
    equippedArmor.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    // Update displayed actual HP cheaply without full re-render
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
    const armorData = data.armors.find((a) => a.armor_id === armorInstance.armor_id);
    const { maxHp } = resolveHp(armorInstance, armorData?.armor_hit_points ?? 0, data.materials);
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
    if (!name) { equipArmor(slot, ""); return true; }
    const tierSelect = document.querySelector(`.equipped-armor-tier[data-slot="${slot}"]`);
    const availableArmors = data.armors.filter(
      (a) => a.armor_piece_location === slot && a.armor_name === name,
    );
    if (tierSelect) {
      tierSelect.innerHTML = availableArmors
        .map((a) => `<option value="${a.armor_tier}">${a.armor_tier}</option>`).join("");
    }
    const firstArmor = availableArmors[0];
    if (!firstArmor) return true;
    equipArmor(slot, firstArmor.armor_id, "MAT-000");
    _renderArmorLists();
    return true;
  }

  if (e.target.classList.contains("equipped-armor-tier")) {
    const slot = e.target.dataset.slot;
    const tier = e.target.value;
    const nameEl = document.querySelector(`.equipped-armor-name[data-slot="${slot}"]`);
    if (!nameEl) return true;
    const armor = data.armors.find(
      (a) => a.armor_piece_location === slot && a.armor_name === nameEl.value && a.armor_tier === tier,
    );
    if (!armor) return true;
    const currentEquipped = findEquippedArmorInSlot(slot);
    equipArmor(slot, armor.armor_id, currentEquipped?.material_id || "MAT-000");
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
    if (!destination) { equippedArmor.is_equipped = true; equippedArmor.storedAt = null; }
    else { equippedArmor.is_equipped = false; equippedArmor.storedAt = destination; }
    _renderArmorLists();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddArmor() {
  const slotEl     = document.getElementById("armorSlotSelect");
  const nameEl     = document.getElementById("armorNameSelect");
  const tierEl     = document.getElementById("armorTierSelect");
  const materialEl = document.getElementById("armorMaterialSelect");
  const storageEl  = document.getElementById("armorStorage");
  if (!slotEl || !nameEl || !tierEl || !materialEl || !storageEl) return;
  const armor = data.armors.find(
    (a) => a.armor_piece_location === slotEl.value && a.armor_name === nameEl.value && a.armor_tier === tierEl.value,
  );
  if (!armor) return;
  const material = data.materials.find((m) => m.material_name === materialEl.value);
  addStoredArmor(armor.armor_id, material?.material_id ?? null, storageEl.value);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * 300ms-debounced render for HP-modifier inputs (typing shouldn't trigger a
 * re-render per keystroke). Delegates to the same _renderArmorLists used
 * everywhere else in this file — single render/snapshot/restore path, no
 * separate local logic. The open/closed state of <details> panels doesn't
 * change while someone's mid-typing a number, so snapshotting when the
 * debounce finally fires (inside _renderArmorLists) rather than at every
 * keystroke produces the same result with less redundant work.
 */
let _deferTimer = null;
function _deferRender() {
  clearTimeout(_deferTimer);
  _deferTimer = setTimeout(() => {
    _renderArmorLists();
  }, 300);
}

/** Patch the "atual" strong inside a resume HP cell without re-rendering. */
function _updateResumeHpDisplay(inputEl, maxHp, modifier) {
  const cell = inputEl.closest("td");
  if (!cell) return;
  const actual = cell.querySelector(".resume-hp-actual");
  if (actual) actual.textContent = maxHp + (modifier || 0);
}

/** Patch just the "atual" strong next to the HP modifier input without re-rendering. */
function _updateActualHpDisplay(inputEl, maxHp, modifier) {
  const block = inputEl.closest(".hp-modifier");
  if (!block) return;
  const strongs = block.querySelectorAll("strong");
  if (strongs.length >= 2) strongs[1].textContent = maxHp + (modifier || 0);
}
