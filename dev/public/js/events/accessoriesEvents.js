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
} from "../inventory/accessories.js";
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "../ui/lists/renderUtils.js";
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
