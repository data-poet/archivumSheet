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
  updateAccessoryEnchantment,
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
  clearEnchantmentAddFormSelection,
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
 * Reads a not-yet-committed enchantment form's current values straight out
 * of the DOM (uncontrolled inputs — nothing writes to state until
 * "Adicionar"/"Salvar" is pressed, same spirit as
 * readCustomFieldsEditorValues). Works for both the add-form (formKey =
 * parent item instanceId) and an entry's edit-form (formKey = the entry's
 * own _instanceId) — same shared markup, see renderEnchantments.js.
 * Returns null if the form isn't found or has no type selected.
 */
function _readEnchantmentFormParams(formKey) {
  const form = document.querySelector(
    `.enchantment-form[data-form-key="${formKey}"]`,
  );
  if (!form) return null;

  const enchantmentId = form.querySelector(".enchantment-type-select")?.value;
  if (!enchantmentId) return null;

  const valueEl = form.querySelector(".enchantment-value-input");
  const targetEl = form.querySelector(".enchantment-target-select");
  const extraPointsEl = form.querySelector(".enchantment-extra-points-input");

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

  // ── Enchantments: remove / add / save (edit or swap) ───────────────────────
  // Generic .enchantment-* classes rendered by renderEnchantments.js; same
  // ownership-check pattern as the custom-fields buttons above, so armor
  // (Phase 2) can safely reuse the same block/button classes.

  if (e.target.classList.contains("enchantment-remove-btn")) {
    const instanceId = e.target.dataset.instanceId;
    const entryInstanceId = e.target.dataset.entryInstanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    // Drop any in-progress edit-form selection for this entry — its
    // _instanceId won't be reused, but there's no reason to keep it around.
    clearEnchantmentAddFormSelection(entryInstanceId);

    _withPreservedOpenState(e, () => {
      removeAccessoryEnchantment(instanceId, entryInstanceId);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-add-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    const params = _readEnchantmentFormParams(instanceId);
    if (!params) return true;

    _withPreservedOpenState(e, () => {
      addAccessoryEnchantment(instanceId, params.enchantmentId, params);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-save-btn")) {
    const instanceId = e.target.dataset.instanceId;
    const entryInstanceId = e.target.dataset.entryInstanceId;
    if (!findAccessoryByInstanceId(instanceId)) return false;

    const params = _readEnchantmentFormParams(entryInstanceId);
    if (!params) return true;

    // Reset so the next time this entry is expanded, its type-select
    // starts fresh from whatever just got saved, not the pre-save choice.
    clearEnchantmentAddFormSelection(entryInstanceId);

    _withPreservedOpenState(e, () => {
      updateAccessoryEnchantment(
        instanceId,
        entryInstanceId,
        params.enchantmentId,
        params,
      );
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

  if (e.target.classList.contains("enchantment-type-select")) {
    const formKey = e.target.dataset.formKey;
    if (!formKey) return false;

    setEnchantmentAddFormSelection(formKey, e.target.value);

    // Re-render so the params markup (value input vs. target select vs.
    // target+extraPoints) switches to match the newly chosen effect_type.
    // No ownership check here (unlike the mutation handlers below) — this
    // only writes to a UI-state Map keyed by formKey (either the item's
    // own instanceId for the add-form, or an entry's _instanceId for an
    // edit-form), never touches accessory data, so a stale formKey is
    // harmless.
    _withPreservedOpenState(e, () => {
      renderLists(selected, data, state.sheet);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-target-filter")) {
    const formKey = e.target.dataset.formKey;
    if (!formKey) return false;

    setEnchantmentAddFormTargetFilter(formKey, e.target.value);

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
