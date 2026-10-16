import { STORED_AT } from "../../../shared/constants.js";
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
  sendMagicGearToAlly,
} from "./model.js";
import { renderEquippedMagicGear, renderStoredMagicGear } from "./render.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import { createSendToAllyHandler } from "../shared/sendToAllyControl.js";
import { withOpenState } from "../../../shared/openState.js";
import { createCustomFieldsClickHandler } from "../shared/customFieldsDispatch.js";

const data = state.data;
const selected = state.selected;

// Re-renders only the magic gear lists, not the full sweep, so the enchantment-type select does not flicker.
function _renderMagicGearLists(sheet) {
  renderEquippedMagicGear(selected, data, sheet);
  renderStoredMagicGear(selected, data, sheet);
}

function _withPreservedOpenState(e, mutateAndRenderFn) {
  const scope = e.target.closest("#magicGearSlots")
    ? "#magicGearSlots"
    : "#magicGearStorageList";
  withOpenState(scope, mutateAndRenderFn);
}

const _handleMagicGearCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findMagicGearByInstanceId,
  saveCustomFields: saveMagicGearCustomFields,
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

const _handleSendMagicGearToAllyClick = createSendToAllyHandler({
  sendFn: sendMagicGearToAlly,
  render: () => _renderMagicGearLists(state.sheet),
  canHandle: (instanceId) =>
    selected.magicGear.some((m) => m.id === instanceId),
});

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
  if (_handleMagicGearCustomFieldsClick(e)) return true;
  if (_magicGearEnchantments.handleClick(e)) return true;

  if (_handleSendMagicGearToAllyClick(e)) return true;

  return false;
}

export function handleMagicGearInput() {
  // No user-input numeric fields on magic gear (price/weight are DB-driven).
  return false;
}

export function handleMagicGearChange(e) {
  if (
    e.target.classList.contains("magic-gear-storage-select") ||
    e.target.classList.contains("equipped-magic-gear-move")
  ) {
    moveMagicGear(e.target.dataset.instanceId, e.target.value);
    return true;
  }
  if (_magicGearEnchantments.handleChange(e)) return true;

  return false;
}

export function handleAddMagicGear() {
  const nameEl = document.getElementById("magicGearNameSelect");
  const storageEl = document.getElementById("magicGearStorage");
  if (!nameEl || !storageEl) return;

  const magicGearId = nameEl.value;
  if (!magicGearId) return;

  if (storageEl.value === STORED_AT.EQUIPPED) {
    addEquippedMagicGear(magicGearId);
  } else {
    addStoredMagicGear(magicGearId, storageEl.value);
  }

  updateMagicGearEquipOptionAvailability();
}
