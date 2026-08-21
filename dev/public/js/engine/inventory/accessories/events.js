import { state } from "../../../state.js";
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
} from "./model.js";
import {
  renderEquippedAccessories,
  renderStoredAccessories,
} from "./render.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import { withOpenState, tableRowKeyFn, divBlockKeyFn } from "../../../shared/openState.js";
import { createCustomFieldsClickHandler } from "../shared/customFieldsDispatch.js";

const data = state.data;
const selected = state.selected;

// Global snapshotAll/restoreAll (wired into runEngine) already preserves the
// open/closed state of #accessorySlots and #accessoryStorageList across the
// debounced re-render triggered by triggerAutoRun() — see openState.js's
// MANAGED_CONTAINER_IDS. For the direct renders below (outside that flow),
// _withPreservedOpenState does the same thing locally so the custom-fields
// <details> the user is actively working in doesn't collapse out from under
// them mid-edit.

/**
 * Re-renders ONLY the accessory lists (equipped + stored), not the full
 * renderLists() sweep of all 21 sections on the page. Every direct render
 * call in this file is triggered by UI-state-only changes scoped to a
 * single accessory (opening/closing a custom-fields editor, picking a
 * cascading enchantment filter) — none of them touch other equipment
 * types' data, so there's no reason for e.g. skills or armor to be torn
 * down and rebuilt too. That full-page rebuild was the actual cause of the
 * enchantment-type-select flicker: the fix isn't in the deferred-render
 * timing (withOpenState's rAF already handles that), it's in how much DOM
 * gets destroyed and recreated on every change.
 */
function _renderAccessoryLists(sheet) {
  renderEquippedAccessories(selected, data, sheet);
  renderStoredAccessories(selected, data, sheet);
}

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

const _handleAccessoryCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findAccessoryByInstanceId,
  saveCustomFields: saveAccessoryCustomFields, // mutates + renders + runs engine
  render: _renderAccessoryLists,
  runWithOpenState: _withPreservedOpenState,
});

const _accessoryEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findAccessoryByInstanceId,
  getItems: () => selected.accessories,
  addEnchantment: addAccessoryEnchantment,
  updateEnchantment: updateAccessoryEnchantment,
  removeEnchantment: removeAccessoryEnchantment,
  render: () => _renderAccessoryLists(state.sheet),
  runWithOpenState: _withPreservedOpenState,
});

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
  // delegated to the shared factory, which itself only acts if the
  // instanceId belongs to an accessory (see createCustomFieldsClickHandler) —
  // this is what lets other equipment types safely reuse the same block/
  // button classes without collisions.

  if (_handleAccessoryCustomFieldsClick(e)) return true;

  // ── Enchantments: remove / add / save (edit or swap) ───────────────────────
  // Generic .enchantment-* classes rendered by renderEnchantments.js;
  // delegated to the shared factory, which ownership-checks the instanceId
  // the same way as the custom-fields factory above, so armor (Phase 2)
  // can safely reuse the same block/button classes.

  if (_accessoryEnchantments.handleClick(e)) return true;

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

  // ── Enchantments: cascading category/type/target filters ───────────────────
  // Delegated to the shared factory — see accessoriesEvents.js's click
  // section above for the ownership-guard rationale.

  if (_accessoryEnchantments.handleChange(e)) return true;

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
