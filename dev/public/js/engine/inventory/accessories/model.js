import { STORED_AT } from "../../../shared/constants.js";
import { state } from "../../../state.js";
import { fetchAccessories } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { generateInstanceId } from "../../../store/instanceId.js";
import { createEquippableItemActions } from "../shared/equippableItemActions.js";

const data = state.data;
const selected = state.selected;

const {
  remove: removeAccessory,
  sendToAlly: sendAccessoryToAlly,
  saveCustomFields: saveAccessoryCustomFields,
  addEnchantment: addAccessoryEnchantment,
  updateEnchantment: updateAccessoryEnchantment,
  removeEnchantment: removeAccessoryEnchantment,
  findByInstanceId: findAccessoryByInstanceId,
} = createEquippableItemActions("accessories", "accessory", {
  onEquipStateChanged: () => updateAccessoryEquipOptionAvailability(),
});

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadAccessories() {
  data.accessories = await fetchAccessories();

  loadAccessorySelectors();
}

export function loadAccessorySelectors() {
  updateAccessoryNameOptions();
}

export function updateAccessoryNameOptions() {
  const select = el("accessoryNameSelect");
  if (!select) return;

  populateSelect(
    select,
    data.accessories.map((a) => ({
      value: a.accessory_id,
      label: a.accessory_name,
    })),
  );

  updateAccessoryEquipOptionAvailability();
}

// Disables "Equipado" when at the equip limit — paired with the engine-side check in buildAccessorySlots.
export function updateAccessoryEquipOptionAvailability() {
  const nameSelect = el("accessoryNameSelect");
  const storageSelect = el("accessoryStorage");
  if (!nameSelect || !storageSelect) return;

  const equipOption = Array.from(storageSelect.options).find(
    (o) => o.value === STORED_AT.EQUIPPED,
  );
  if (!equipOption) return;

  const atLimit = isAccessoryAtEquipLimit(nameSelect.value);
  equipOption.disabled = atLimit;

  if (atLimit && storageSelect.value === STORED_AT.EQUIPPED) {
    storageSelect.value = STORED_AT.BACKPACK;
  }
}

export function countEquippedAccessories(accessoryId) {
  return selected.accessories.filter(
    (a) => a.accessory_id === accessoryId && a.is_equipped,
  ).length;
}

export function getAccessoryEquipLimit(accessoryId) {
  const accessory = data.accessories.find(
    (a) => a.accessory_id === accessoryId,
  );
  return Number(accessory?.accessory_equip_limit ?? 0);
}

export function isAccessoryAtEquipLimit(accessoryId) {
  if (!accessoryId) return false;
  return (
    countEquippedAccessories(accessoryId) >= getAccessoryEquipLimit(accessoryId)
  );
}

function _newAccessoryInstance(accessoryId, price, isEquipped, storedAt) {
  return {
    id: generateInstanceId(),
    accessory_id: accessoryId,
    price: Number(price) || 0,
    is_equipped: isEquipped,
    storedAt,
    accessory_custom_name: null,
    accessory_custom_description: null,
    accessory_custom_effect: null,
    enchantments: [],
  };
}

/** Add an accessory directly as equipped. Refuses silently if at the type's equip limit. */
export function addEquippedAccessory(accessoryId, price = 0) {
  if (!accessoryId) return;
  if (isAccessoryAtEquipLimit(accessoryId)) return;

  selected.accessories.push(
    _newAccessoryInstance(accessoryId, price, true, null),
  );

  updateAccessoryEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

/** Add an accessory directly to storage (not equipped). */
export function addStoredAccessory(
  accessoryId,
  price = 0,
  storedAt = STORED_AT.BACKPACK,
) {
  if (!accessoryId) return;

  selected.accessories.push(
    _newAccessoryInstance(accessoryId, price, false, storedAt),
  );

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

/** Equip a stored accessory. Refuses silently if at the type's equip limit. */
export function equipAccessory(instanceId) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance) return;
  if (isAccessoryAtEquipLimit(instance.accessory_id)) return;

  instance.is_equipped = true;
  instance.storedAt = null;

  updateAccessoryEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

/** Moves to storedAt, or back to equipped if storedAt is empty (used by the equipped-move select). */
export function moveAccessory(instanceId, storedAt) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance) return;

  if (!storedAt) {
    if (
      isAccessoryAtEquipLimit(instance.accessory_id) &&
      !instance.is_equipped
    ) {
      return;
    }
    instance.is_equipped = true;
    instance.storedAt = null;
  } else {
    instance.is_equipped = false;
    instance.storedAt = storedAt;
  }

  updateAccessoryEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export { removeAccessory, sendAccessoryToAlly };

export function updateAccessoryPrice(instanceId, rawValue) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance) return;

  const parsed = parseFloat(rawValue);
  instance.price = isNaN(parsed) || parsed < 0 ? 0 : parsed;

  triggerAutoRun();
}

// Saves from before enchantments existed have no enchantments field.
export {
  saveAccessoryCustomFields,
  addAccessoryEnchantment,
  updateAccessoryEnchantment,
  removeAccessoryEnchantment,
  findAccessoryByInstanceId,
};
