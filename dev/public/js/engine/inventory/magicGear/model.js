import { STORED_AT } from "../../../shared/constants.js";
import { state } from "../../../state.js";
import { fetchMagicGear, fetchMagicGearEquipLimits } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { generateInstanceId } from "../../../store/instanceId.js";
import { t } from "../../../localization/pt-BR/index.js";
import { createEquippableItemActions } from "../shared/equippableItemActions.js";

const data = state.data;
const selected = state.selected;

const {
  remove: removeMagicGear,
  sendToAlly: sendMagicGearToAlly,
  saveCustomFields: saveMagicGearCustomFields,
  addEnchantment: addMagicGearEnchantment,
  updateEnchantment: updateMagicGearEnchantment,
  removeEnchantment: removeMagicGearEnchantment,
  findByInstanceId: findMagicGearByInstanceId,
} = createEquippableItemActions("magicGear", "magic_gear", {
  onEquipStateChanged: () => updateMagicGearEquipOptionAvailability(),
});

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadMagicGear() {
  const [magicGear, equipLimits] = await Promise.all([
    fetchMagicGear(),
    fetchMagicGearEquipLimits(),
  ]);

  data.magicGear = magicGear;
  data.magicGearEquipLimits = equipLimits;

  loadMagicGearSelectors();
}

export function loadMagicGearSelectors() {
  updateMagicGearTypeOptions();
}

// Mirrors melee/ranged/firearms' updateXTypeOptions pattern, then re-narrows the name select to match.
export function updateMagicGearTypeOptions() {
  const select = el("magicGearTypeFilter");
  if (!select) return;

  const types = [
    ...new Set(data.magicGear.map((g) => g.magic_gear_type)),
  ].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">${t("magicGear.typeFilter")}</option>` +
    types
      .map(
        (type) =>
          `<option value="${type}" ${type === current ? "selected" : ""}>${type}</option>`,
      )
      .join("");

  updateMagicGearNameOptions();
}

export function updateMagicGearNameOptions() {
  const typeSelect = el("magicGearTypeFilter");
  const select = el("magicGearNameSelect");
  if (!select) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.magicGear.filter((g) => g.magic_gear_type === typeFilter)
    : data.magicGear;

  populateSelect(
    select,
    filtered.map((g) => ({
      value: g.magic_gear_id,
      label: g.magic_gear_name,
    })),
  );

  updateMagicGearEquipOptionAvailability();
}

// Disables "Equipado" in the add-form when the selected item's type is at its equip limit — the
// hard-block half of enforcement, paired with the engine-side check in buildMagicGearSlots.
export function updateMagicGearEquipOptionAvailability() {
  const storageSelect = el("magicGearStorage");
  const nameSelect = el("magicGearNameSelect");
  if (!storageSelect || !nameSelect) return;

  const equipOption = Array.from(storageSelect.options).find(
    (o) => o.value === STORED_AT.EQUIPPED,
  );
  if (!equipOption) return;

  const atLimit = isMagicGearAtEquipLimit(nameSelect.value);
  equipOption.disabled = atLimit;

  if (atLimit && storageSelect.value === STORED_AT.EQUIPPED) {
    storageSelect.value = STORED_AT.BACKPACK;
  }
}

// Caps per magic_gear_type come from the engine at bootstrap.

function magicGearType(magicGearId) {
  return data.magicGear.find((g) => g.magic_gear_id === magicGearId)
    ?.magic_gear_type;
}

export function countEquippedMagicGearByType(type) {
  return selected.magicGear.filter(
    (g) => g.is_equipped && magicGearType(g.magic_gear_id) === type,
  ).length;
}

// A magic_gear_id whose type has no known cap is never considered at limit.
export function isMagicGearAtEquipLimit(magicGearId) {
  const type = magicGearType(magicGearId);
  const limit = data.magicGearEquipLimits[type];
  if (limit == null) return false;

  return countEquippedMagicGearByType(type) >= limit;
}

function _newMagicGearInstance(magicGearId, isEquipped, storedAt) {
  return {
    id: generateInstanceId(),
    magic_gear_id: magicGearId,
    is_equipped: isEquipped,
    storedAt,
    magic_gear_custom_name: null,
    magic_gear_custom_description: null,
    magic_gear_custom_effect: null,
    enchantments: [],
  };
}

// Refuses silently if the item's type is at its equip limit.
export function addEquippedMagicGear(magicGearId) {
  if (!magicGearId) return;
  if (isMagicGearAtEquipLimit(magicGearId)) return;

  selected.magicGear.push(_newMagicGearInstance(magicGearId, true, null));

  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export function addStoredMagicGear(magicGearId, storedAt = STORED_AT.BACKPACK) {
  if (!magicGearId) return;

  selected.magicGear.push(_newMagicGearInstance(magicGearId, false, storedAt));

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

// Refuses silently if the item's type is at its equip limit.
export function equipMagicGear(instanceId) {
  const instance = findMagicGearByInstanceId(instanceId);
  if (!instance) return;
  if (isMagicGearAtEquipLimit(instance.magic_gear_id)) return;

  instance.is_equipped = true;
  instance.storedAt = null;

  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

// Empty storedAt means "back to equipped" — used by the equipped-move select.
export function moveMagicGear(instanceId, storedAt) {
  const instance = findMagicGearByInstanceId(instanceId);
  if (!instance) return;

  if (!storedAt) {
    if (
      isMagicGearAtEquipLimit(instance.magic_gear_id) &&
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

  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export {
  removeMagicGear,
  sendMagicGearToAlly,
  saveMagicGearCustomFields,
  addMagicGearEnchantment,
  updateMagicGearEnchantment,
  removeMagicGearEnchantment,
  findMagicGearByInstanceId,
};
