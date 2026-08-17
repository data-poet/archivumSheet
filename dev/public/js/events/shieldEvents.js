import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipShield, addStoredShield, moveShield, removeShield, findShieldByInstanceId,
  saveShieldCustomFields,
} from "../inventory/shield.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { renderEquippedShield, renderStoredShields } from "../ui/lists/renderShield.js";
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
 * Re-renders ONLY the shield lists (equipped slot + storage), not a full
 * renderLists() sweep of all 21 sections — same reasoning as armor's
 * _renderArmorLists.
 *
 * Uses the shared snapshotAll()/restoreAll() pair (all managed containers)
 * rather than a single-scope helper: shield actions can move an item
 * BETWEEN #shieldSlot and #shieldStorageList in one step (equip/unequip/
 * move), so both need their open/closed state captured and restored
 * together, not just whichever one the click originated in.
 *
 * Deferred by one requestAnimationFrame for the same reason armor's
 * equivalent defers: several callers below fire from native <select>
 * "change" handlers, and replacing that select's DOM ancestor before the
 * browser has finished its own change-event/native-picker cycle causes a
 * visible flicker (worst on mobile Safari). Restore happens in the SAME
 * frame as the render — not a later one — to avoid painting the freshly-
 * rebuilt DOM in its default-collapsed state before it reopens. See
 * openState.js's withOpenState doc comment for the full rationale.
 */
function _renderShieldLists(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderEquippedShield(selected, data, sheet);
    renderStoredShields(selected, data, sheet);
    restoreAll(snapshots);
  });
}

/**
 * 300ms-debounced render for HP-modifier inputs (typing shouldn't trigger a
 * re-render per keystroke). Delegates to _renderShieldLists — single
 * render/snapshot/restore path, no separate local logic.
 */
let _deferTimer = null;
function _deferRender() {
  clearTimeout(_deferTimer);
  _deferTimer = setTimeout(() => {
    _renderShieldLists();
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

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleShieldClick(e) {
  if (e.target.classList.contains("remove-shield")) {
    removeShield(e.target.dataset.instanceId); return true;
  }

  if (e.target.classList.contains("remove-equipped-shield")) {
    removeShield(e.target.dataset.instanceId); return true;
  }

  if (e.target.classList.contains("equip-stored-shield")) {
    const instanceId = e.target.dataset.instanceId;
    const shieldToEquip = findShieldByInstanceId(instanceId);
    if (!shieldToEquip) return true;
    selected.shields.forEach((inst) => {
      if (!inst.is_equipped) return;
      inst.is_equipped = false; inst.storedAt = "backpack";
    });
    shieldToEquip.is_equipped = true;
    shieldToEquip.storedAt = null;
    _renderShieldLists();
    triggerAutoRun();
    return true;
  }

  // ── Custom fields: edit / save / cancel ───────────────────────────────────
  if (e.target.classList.contains("custom-fields-edit-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findShieldByInstanceId(instanceId)) return false;
    openCustomFieldsEditor(instanceId);
    _renderShieldLists();
    return true;
  }

  if (e.target.classList.contains("custom-fields-cancel-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findShieldByInstanceId(instanceId)) return false;
    closeCustomFieldsEditor(instanceId);
    _renderShieldLists();
    return true;
  }

  if (e.target.classList.contains("custom-fields-save-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findShieldByInstanceId(instanceId)) return false;
    const values = readCustomFieldsEditorValues(instanceId);
    closeCustomFieldsEditor(instanceId);
    if (values) {
      // saveShieldCustomFields mutates + calls its own renderListsPreserving()
      // internally (unwrapped call site) — snapshot right before it and
      // restore right after it returns (both synchronous) so that internal
      // render doesn't blow away open state anywhere on the page, same
      // pattern as armorEvents.js's equivalent branch.
      const snapshots = snapshotAll();
      saveShieldCustomFields(instanceId, values);
      restoreAll(snapshots);
    } else {
      _renderShieldLists();
    }
    return true;
  }

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleShieldInput(e) {
  if (e.target.classList.contains("resume-shield-hp")) {
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;
    if (/^-$/.test(e.target.value)) return true;
    const shieldData = data.shields.find((s) => s.shield_id === equippedShield.shield_id);
    const { maxHp }  = resolveHp(equippedShield, shieldData?.shield_hit_points ?? 0, data.materials);
    equippedShield.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateResumeHpDisplay(e.target, maxHp, equippedShield.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-shield-hp")) {
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const shieldData = data.shields.find((s) => s.shield_id === equippedShield.shield_id);
    const { maxHp } = resolveHp(equippedShield, shieldData?.shield_hit_points ?? 0, data.materials);
    equippedShield.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, equippedShield.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("stored-shield-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const shieldInstance = findShieldByInstanceId(instanceId);
    if (!shieldInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const shieldData = data.shields.find((s) => s.shield_id === shieldInstance.shield_id);
    const { maxHp } = resolveHp(shieldInstance, shieldData?.shield_hit_points ?? 0, data.materials);
    shieldInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, shieldInstance.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleShieldChange(e) {
  if (e.target.classList.contains("equipped-shield-name")) {
    const name = e.target.value;
    if (!name) { equipShield(""); return true; }
    const availableShields = data.shields.filter((s) => s.shield_name === name);
    const firstShield = availableShields[0];
    if (!firstShield) return true;
    const tierSelect = document.querySelector(".equipped-shield-tier");
    if (tierSelect) {
      tierSelect.innerHTML = availableShields
        .map((s) => `<option value="${s.shield_tier}">${s.shield_tier}</option>`).join("");
    }
    const equippedInstance = selected.shields.find((s) => s.is_equipped);
    if (equippedInstance) {
      equippedInstance.shield_id = firstShield.shield_id;
      equippedInstance.hit_points_modifier = 0;
    } else {
      equipShield(firstShield.shield_id, "MAT-000"); return true;
    }
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-shield-tier")) {
    const tier = e.target.value;
    const nameEl = document.querySelector(".equipped-shield-name");
    if (!nameEl) return true;
    const shield = data.shields.find((s) => s.shield_name === nameEl.value && s.shield_tier === tier);
    if (!shield) return true;
    const equippedInstance = selected.shields.find((s) => s.is_equipped);
    if (equippedInstance) {
      equippedInstance.shield_id = shield.shield_id;
      equippedInstance.hit_points_modifier = 0;
    } else {
      equipShield(shield.shield_id, "MAT-000"); return true;
    }
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-shield-material")) {
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;
    equippedShield.material_id = e.target.value;
    equippedShield.hit_points_modifier = 0;
    _renderShieldLists();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("shield-storage-select")) {
    moveShield(e.target.dataset.instanceId, e.target.value); return true;
  }

  if (e.target.classList.contains("equipped-shield-move")) {
    const destination = e.target.value;
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;
    if (!destination) { equippedShield.is_equipped = true; equippedShield.storedAt = null; }
    else { equippedShield.is_equipped = false; equippedShield.storedAt = destination; }
    _renderShieldLists();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddShield() {
  const nameEl     = document.getElementById("shieldNameSelect");
  const tierEl     = document.getElementById("shieldTierSelect");
  const materialEl = document.getElementById("shieldMaterialSelect");
  const storageEl  = document.getElementById("shieldStorage");
  if (!nameEl || !tierEl || !materialEl || !storageEl) return;
  const shield = data.shields.find(
    (s) => s.shield_name === nameEl.value && s.shield_tier === tierEl.value,
  );
  if (!shield) return;
  const material = data.materials.find((m) => m.material_name === materialEl.value);
  addStoredShield(shield.shield_id, material?.material_id ?? null, storageEl.value);
}
