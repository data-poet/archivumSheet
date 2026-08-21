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
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import {
  withOpenState,
  tableRowKeyFn,
  divBlockKeyFn,
} from "../../../shared/openState.js";
import { createCustomFieldsClickHandler } from "../shared/customFieldsDispatch.js";

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

const _handleMagicGearCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findMagicGearByInstanceId,
  saveCustomFields: saveMagicGearCustomFields, // mutates + renders + runs engine
  render: _renderMagicGearLists,
  runWithOpenState: _withPreservedOpenState,
});

const _magicGearEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findMagicGearByInstanceId,
  getItems: () => selected.magicGear,
  addEnchantment: addMagicGearEnchantment,
  updateEnchantment: updateMagicGearEnchantment,
  removeEnchantment: removeMagicGearEnchantment,
  render: () => _renderMagicGearLists(state.sheet),
  runWithOpenState: _withPreservedOpenState,
});

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
  // Delegated to the shared factory — see accessoriesEvents.js's identical
  // usage for the full rationale.

  if (_handleMagicGearCustomFieldsClick(e)) return true;

  // ── Enchantments: remove / add / save (edit or swap) ───────────────────────
  // Delegated to the shared factory — see accessoriesEvents.js's identical
  // usage for the full rationale.

  if (_magicGearEnchantments.handleClick(e)) return true;

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

  // ── Enchantments: cascading category/type/target filters ───────────────────
  // Delegated to the shared factory — see accessoriesEvents.js's click
  // section for the ownership-guard rationale.

  if (_magicGearEnchantments.handleChange(e)) return true;

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
