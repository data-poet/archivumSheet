import { state } from "../../../state.js";
import {
  addEquippedMagicGear,
  addStoredMagicGear,
  equipMagicGear,
  moveMagicGear,
  removeMagicGear,
  saveMagicGearCustomFields,
  findMagicGearByInstanceId,
  updateMagicGearEquipOptionAvailability,
  addMagicGearEnchantment,
  updateMagicGearEnchantment,
  removeMagicGearEnchantment,
} from "./model.js";
import {
  renderEquippedMagicGear,
  renderStoredMagicGear,
} from "./render.js";
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "../../../shared/renderUtils.js";
import {
  setEnchantmentAddFormSelection,
  setEnchantmentAddFormTargetFilter,
  setEnchantmentAddFormTypeFilter,
  clearEnchantmentAddFormSelection,
} from "../shared/enchantments/model.js";
import {
  withOpenState,
  tableRowKeyFn,
  divBlockKeyFn,
} from "../../../shared/openState.js";

const data = state.data;
const selected = state.selected;

// Same rationale as accessoriesEvents.js's _renderAccessoryLists — re-render
// ONLY the magic gear lists (equipped + stored), not the full renderLists()
// sweep of all managed sections. See that file's comment block for the full
// explanation of why this scoping matters for the enchantment-type-select
// flicker fix.

function _renderMagicGearLists(sheet) {
  renderEquippedMagicGear(selected, data, sheet);
  renderStoredMagicGear(selected, data, sheet);
}

function _withPreservedOpenState(e, mutateAndRenderFn) {
  if (e.target.closest("#magicGearSlots")) {
    withOpenState(
      "#magicGearSlots",
      divBlockKeyFn("data-instance-id"),
      mutateAndRenderFn,
    );
  } else {
    withOpenState(
      "#magicGearStorageList",
      tableRowKeyFn("data-instance-id"),
      mutateAndRenderFn,
    );
  }
}

/**
 * Whether `formKey` belongs to a magic gear item — either as an item's own
 * instanceId (the add-form) or as one of its enchantment entries' own
 * _instanceId (an entry's edit-form).
 *
 * The three enchantment-filter branches below match on CSS classes shared
 * across every equipment type that carries enchantments (see
 * renderEnchantments.js — enchantment-category-filter/-type-select/
 * -target-filter aren't magic-gear-specific markup). Without this guard,
 * whichever type's handler runs FIRST in the dispatch chain
 * (events/index.js — accessories, then magic gear) would catch the OTHER
 * type's enchantment-filter interactions too: it updates the shared
 * UI-state Maps in inventory/enchantments.js correctly (those writes
 * really are harmless regardless of formKey), but then re-renders only ITS
 * OWN list — leaving the item the user is actually looking at stuck on
 * stale markup, unable to switch category/type/target at all. See
 * accessoriesEvents.js's own copy of this guard for the full writeup.
 */
function _ownsEnchantmentFormKey(formKey) {
  if (findMagicGearByInstanceId(formKey)) return true;
  return selected.magicGear.some((g) =>
    (g.enchantments || []).some((entry) => entry._instanceId === formKey),
  );
}

/**
 * Reads a not-yet-committed enchantment form's current values straight out
 * of the DOM — identical logic to accessoriesEvents.js's
 * _readEnchantmentFormParams (kept as a local copy rather than shared,
 * matching the existing per-type duplication pattern in this codebase).
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

export function handleMagicGearClick(e) {
  if (
    e.target.classList.contains("remove-magic-gear") ||
    e.target.classList.contains("remove-equipped-magic-gear")
  ) {
    removeMagicGear(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("equip-stored-magic-gear")) {
    equipMagicGear(e.target.dataset.instanceId);
    return true;
  }

  // ── Custom fields: edit / save / cancel ───────────────────────────────────

  if (e.target.classList.contains("custom-fields-edit-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findMagicGearByInstanceId(instanceId)) return false;

    _withPreservedOpenState(e, () => {
      openCustomFieldsEditor(instanceId);
      _renderMagicGearLists();
    });
    return true;
  }

  if (e.target.classList.contains("custom-fields-cancel-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findMagicGearByInstanceId(instanceId)) return false;

    _withPreservedOpenState(e, () => {
      closeCustomFieldsEditor(instanceId);
      _renderMagicGearLists();
    });
    return true;
  }

  if (e.target.classList.contains("custom-fields-save-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findMagicGearByInstanceId(instanceId)) return false;

    const values = readCustomFieldsEditorValues(instanceId);

    _withPreservedOpenState(e, () => {
      closeCustomFieldsEditor(instanceId);
      if (values) {
        saveMagicGearCustomFields(instanceId, values); // mutates + renders + runs engine
      } else {
        _renderMagicGearLists();
      }
    });
    return true;
  }

  // ── Enchantments: remove / add / save (edit or swap) ───────────────────────

  if (e.target.classList.contains("enchantment-remove-btn")) {
    const instanceId = e.target.dataset.instanceId;
    const entryInstanceId = e.target.dataset.entryInstanceId;
    if (!findMagicGearByInstanceId(instanceId)) return false;

    clearEnchantmentAddFormSelection(entryInstanceId);

    _withPreservedOpenState(e, () => {
      removeMagicGearEnchantment(instanceId, entryInstanceId);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-add-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findMagicGearByInstanceId(instanceId)) return false;

    const params = _readEnchantmentFormParams(instanceId);
    if (!params) return true;

    _withPreservedOpenState(e, () => {
      addMagicGearEnchantment(instanceId, params.enchantmentId, params);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-save-btn")) {
    const instanceId = e.target.dataset.instanceId;
    const entryInstanceId = e.target.dataset.entryInstanceId;
    if (!findMagicGearByInstanceId(instanceId)) return false;

    const params = _readEnchantmentFormParams(entryInstanceId);
    if (!params) return true;

    clearEnchantmentAddFormSelection(entryInstanceId);

    _withPreservedOpenState(e, () => {
      updateMagicGearEnchantment(
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

export function handleMagicGearInput() {
  // No user-input numeric fields on magic gear (price/weight are DB-driven).
  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleMagicGearChange(e) {
  if (
    e.target.classList.contains("magic-gear-storage-select") ||
    e.target.classList.contains("equipped-magic-gear-move")
  ) {
    moveMagicGear(e.target.dataset.instanceId, e.target.value);
    return true;
  }

  if (e.target.classList.contains("enchantment-category-filter")) {
    const formKey = e.target.dataset.formKey;
    if (!formKey || !_ownsEnchantmentFormKey(formKey)) return false;

    setEnchantmentAddFormTypeFilter(formKey, e.target.value);

    _withPreservedOpenState(e, () => {
      _renderMagicGearLists(state.sheet);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-type-select")) {
    const formKey = e.target.dataset.formKey;
    if (!formKey || !_ownsEnchantmentFormKey(formKey)) return false;

    setEnchantmentAddFormSelection(formKey, e.target.value);

    _withPreservedOpenState(e, () => {
      _renderMagicGearLists(state.sheet);
    });
    return true;
  }

  if (e.target.classList.contains("enchantment-target-filter")) {
    const formKey = e.target.dataset.formKey;
    if (!formKey || !_ownsEnchantmentFormKey(formKey)) return false;

    setEnchantmentAddFormTargetFilter(formKey, e.target.value);

    _withPreservedOpenState(e, () => {
      _renderMagicGearLists(state.sheet);
    });
    return true;
  }

  return false;
}

// ─── Add form ─────────────────────────────────────────────────────────────────

export function handleAddMagicGear() {
  const nameEl = document.getElementById("magicGearNameSelect");
  const storageEl = document.getElementById("magicGearStorage");
  if (!nameEl || !storageEl) return;

  const magicGearId = nameEl.value;
  if (!magicGearId) return;

  if (storageEl.value === "equipped") {
    addEquippedMagicGear(magicGearId);
  } else {
    addStoredMagicGear(magicGearId, storageEl.value);
  }

  updateMagicGearEquipOptionAvailability();
}
