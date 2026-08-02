import { state } from "../state.js";
import { renderLists } from "../ui.js";
import {
  addEquippedAccessory,
  addStoredAccessory,
  equipAccessory,
  moveAccessory,
  removeAccessory,
  updateAccessoryPrice,
  saveAccessoryCustomFields,
  findAccessoryByInstanceId,
  updateAccessoryEquipOptionAvailability,
  addAccessoryEnchantment,
  removeAccessoryEnchantment,
} from "../inventory/accessories.js";
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "../ui/lists/renderUtils.js";
import {
  setEnchantmentAddFormSelection,
  setEnchantmentAddFormTargetFilter,
} from "../inventory/enchantments.js";
import { withOpenState, tableRowKeyFn, divBlockKeyFn } from "../shared/openState.js";

const data = state.data;
const selected = state.selected;

// Global snapshotAll/restoreAll (wired into runEngine) already preserves the
// open/closed state of #accessorySlots and #accessoryStorageList across the
// debounced re-render triggered by triggerAutoRun() — see openState.js's
// MANAGED_CONTAINER_IDS. For the direct renderLists() calls below (outside
// that flow), _withPreservedOpenState does the same thing locally so the
// custom-fields <details> the user is actively working in doesn't collapse
// out from under them mid-edit.

function _withPreservedOpenState(e, mutateAndRenderFn) {
  if (e.target.closest("#accessorySlots")) {
    withOpenState(
      "#accessorySlots",
      divBlockKeyFn("data-instance-id"),
      mutateAndRenderFn,
    );
  } else {
    withOpenState(
      "#accessoryStorageList",
      tableRowKeyFn("data-instance-id"),
      mutateAndRenderFn,
    );
  }
}

/**
 * Reads the not-yet-committed enchantment "add" mini-form's current values
 * straight out of the DOM (uncontrolled inputs — nothing writes to state
 * until "Adicionar" is pressed, same spirit as readCustomFieldsEditorValues).
 * Returns null if the form isn't found or has no type selected.
 */
function _readEnchantmentAddFormParams(instanceId) {
  const form = document.querySelector(
    `.enchantment-add-form[data-instance-id="${instanceId}"]`,
  );
  if (!form) return null;

  const enchantmentId = form.querySelector(".enchantment-add-select")?.value;
  if (!enchantmentId) return null;

  const valueEl = form.querySelector(".enchantment-add-value");
  const targetEl = form.querySelector(".enchantment-add-target");
  const extraPointsEl = form.querySelector(".enchantment-add-extra-points");

  return {
    enchantmentId,
    value: valueEl ? parseInt(valueEl.value, 10) : undefined,
    target: targetEl ? targetEl.value : undefined,
    extraPoints: extraPointsEl
      ? parseInt(extraPointsEl.value, 10) || 0
      : undefined,
  };
}

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleAccessoryClick(e) {
  if (
    e.target.classList.contains("remove-accessory") ||
    e.target.classList.contains("remove-equipped-accessory")
  ) {
    removeAccessory(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("equip-stored-accessory")) {
    equipAccessory(e.target.dataset.instanceId);
    return true;
  }

  // ── Custom fields: edit / save / cancel ───────────────────────────────────
  // Generic buttons (not accessory-namespaced) rendered by customFieldsBlock;
  // only acted on here if the instanceId actually belongs to an accessory —
  // this is what lets future equipment types safely reuse the same block/
  // button classes without collisions (each type's click handler no-ops on
  // an instanceId it doesn't own, per the existing handler-chain pattern).

  if (e.target.classList.contains("custom-fields-edit-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    _withPreservedOpenState(e, () => {
      openCustomFieldsEditor(instanceId);
      renderLists(selected, data);
    });
    return true;
  }

  if (e.target.classList.contains("custom-fields-cancel-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    _withPreservedOpenState(e, () => {
      closeCustomFieldsEditor(instanceId);
      renderLists(selected, data);
    });
    return true;
  }

  if (e.target.classList.contains("custom-fields-save-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    const values = readCustomFieldsEditorValues(instanceId);

    _withPreservedOpenState(e, () => {
      // Close first so the single render below (whichever branch fires)
      // reflects the read-only view with the saved values, not the form.
      closeCustomFieldsEditor(instanceId);
      if (values) {
        saveAccessoryCustomFields(instanceId, values); // mutates + renders + runs engine
      } else {
        renderLists(selected, data);
      }
    });
    return true;
  }

  // ── Enchantments: remove / add ─────────────────────────────────────────────
  // Generic .enchantment-* classes rendered by renderEnchantments.js; same
  // ownership-check pattern as the custom-fields buttons above, so armor
  // (Phase 2) can safely reuse the same block/button classes.

  if (e.target.classList.contains("enchantment-remove-btn")) {
    const instanceId = e.target.dataset.instanceId;
    const entryInstanceId = e.target.dataset.entryInstanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    _withPreservedOpenState(e, () => {
      removeAccessoryEnchantment(instanceId, entryInstanceId);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-add-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    const params = _readEnchantmentAddFormParams(instanceId);
    if (!params) return true;

    _withPreservedOpenState(e, () => {
      addAccessoryEnchantment(instanceId, params.enchantmentId, params);
    });
    return true;
  }

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleAccessoryInput(e) {
  if (
    e.target.classList.contains("equipped-accessory-price") ||
    e.target.classList.contains("stored-accessory-price")
  ) {
    const instanceId = e.target.dataset.instanceId;
    if (e.target.value === "") return true; // allow mid-typing
    updateAccessoryPrice(instanceId, e.target.value);
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleAccessoryChange(e) {
  if (e.target.id === "accessoryNameSelect") {
    updateAccessoryEquipOptionAvailability();
    return true;
  }

  if (
    e.target.classList.contains("accessory-storage-select") ||
    e.target.classList.contains("equipped-accessory-move")
  ) {
    moveAccessory(e.target.dataset.instanceId, e.target.value);
    return true;
  }

  if (e.target.classList.contains("enchantment-add-select")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    setEnchantmentAddFormSelection(instanceId, e.target.value);

    // Re-render so the params markup (value input vs. target select vs.
    // target+extraPoints) switches to match the newly chosen effect_type.
    _withPreservedOpenState(e, () => {
      renderLists(selected, data, state.sheet);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-target-filter")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    setEnchantmentAddFormTargetFilter(instanceId, e.target.value);

    // Re-render so the target select narrows to the chosen
    // type/category/school — same cascading-filter pattern used
    // elsewhere in the app for adding advantages/skills/spells directly.
    _withPreservedOpenState(e, () => {
      renderLists(selected, data, state.sheet);
    });
    return true;
  }

  return false;
}

// ─── Add form ─────────────────────────────────────────────────────────────────

export function handleAddAccessory() {
  const nameEl = document.getElementById("accessoryNameSelect");
  const priceEl = document.getElementById("accessoryPriceInput");
  const storageEl = document.getElementById("accessoryStorage");
  if (!nameEl || !priceEl || !storageEl) return;

  const accessoryId = nameEl.value;
  if (!accessoryId) return;

  const price = parseFloat(priceEl.value) || 0;

  if (storageEl.value === "equipped") {
    addEquippedAccessory(accessoryId, price);
  } else {
    addStoredAccessory(accessoryId, price, storageEl.value);
  }

  updateAccessoryEquipOptionAvailability();
}
