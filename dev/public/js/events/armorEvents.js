import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipArmor, addStoredArmor, moveArmor, removeArmor,
  findEquippedArmorInSlot, findArmorByInstanceId,
} from "../inventory/armor.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { withOpenState, tableRowKeyFn, divBlockKeyFn } from "../shared/openState.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _renderWithState(renderFn) {
  withOpenState("#armorSlots",       divBlockKeyFn("data-slot"),         renderFn);
  withOpenState("#armorStorageList", tableRowKeyFn("data-instance-id"),  () => {});
  // Re-run combined so both containers are covered in one pass
}

function _renderAll() {
  const snap = _snapshotAll();
  renderLists(selected, data);
  _restoreAll(snap);
}

function _snapshotAll() {
  return {
    slots:   _snapshotContainer("#armorSlots",       (d) => divBlockKeyFn("data-slot")(d)),
    storage: _snapshotContainer("#armorStorageList", tableRowKeyFn("data-instance-id")),
  };
}

function _snapshotContainer(sel, keyFn) {
  const el = document.querySelector(sel);
  if (!el) return new Set();
  const open = new Set();
  el.querySelectorAll("details[open]").forEach((d) => {
    const k = keyFn(d); if (k) open.add(k);
  });
  return open;
}

function _restoreAll(snap) {
  _restoreContainer("#armorSlots",       (d) => divBlockKeyFn("data-slot")(d),       snap.slots);
  _restoreContainer("#armorStorageList", tableRowKeyFn("data-instance-id"), snap.storage);
}

function _restoreContainer(sel, keyFn, open) {
  if (!open.size) return;
  const el = document.querySelector(sel);
  if (!el) return;
  el.querySelectorAll("details").forEach((d) => {
    const k = keyFn(d); if (k && open.has(k)) d.setAttribute("open", "");
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
    _renderAll();
    triggerAutoRun();
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
    _renderAll();
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
    _renderAll();
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
    _renderAll();
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

let _deferTimer = null;
function _deferRender() {
  clearTimeout(_deferTimer);
  const snap = _snapshotAll();
  _deferTimer = setTimeout(() => {
    renderLists(selected, data);
    _restoreAll(snap);
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
