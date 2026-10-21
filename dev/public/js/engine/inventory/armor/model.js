import { state } from "../../../state.js";
import { fetchArmors } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { DEFAULT_MATERIAL_ID, STORED_AT } from "../../../shared/constants.js";
import { generateInstanceId } from "../../../store/instanceId.js";
import { createEquippableItemActions } from "../shared/equippableItemActions.js";

const data = state.data;
const selected = state.selected;

const {
  findByInstanceId: findArmorByInstanceId,
  move: moveArmor,
  remove: removeArmor,
  sendToAlly: sendArmorToAlly,
  saveCustomFields: saveArmorCustomFields,
  addEnchantment: addArmorEnchantment,
  updateEnchantment: updateArmorEnchantment,
  removeEnchantment: removeArmorEnchantment,
} = createEquippableItemActions("armors", "armor");

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadArmors() {
  data.armors = await fetchArmors();

  loadArmorSelectors();
}

export function loadArmorSelectors() {
  const slotSelect = el("armorSlotSelect");
  if (!slotSelect) return;

  const slots = [...new Set(data.armors.map((a) => a.armor_piece_location))];
  populateSelect(
    slotSelect,
    slots.map((s) => ({ value: s, label: s })),
  );

  updateArmorNameOptions();
  updateArmorTierOptions();
  updateArmorMaterialOptions();
}

export function updateArmorNameOptions() {
  const slotSelect = el("armorSlotSelect");
  const nameSelect = el("armorNameSelect");
  if (!slotSelect || !nameSelect) return;

  const slot = slotSelect.value;
  const names = [
    ...new Set(
      data.armors
        .filter((a) => a.armor_piece_location === slot)
        .map((a) => a.armor_name),
    ),
  ];

  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );
  updateArmorTierOptions();
}

export function updateArmorTierOptions() {
  const slotSelect = el("armorSlotSelect");
  const nameSelect = el("armorNameSelect");
  const tierSelect = el("armorTierSelect");
  if (!slotSelect || !nameSelect || !tierSelect) return;

  const slot = slotSelect.value;
  const name = nameSelect.value;
  const tiers = [
    ...new Set(
      data.armors
        .filter((a) => a.armor_piece_location === slot && a.armor_name === name)
        .map((a) => a.armor_tier),
    ),
  ];

  populateSelect(
    tierSelect,
    tiers.map((t) => ({ value: t, label: t })),
  );
}

export function updateArmorMaterialOptions() {
  const materialSelect = el("armorMaterialSelect");
  if (!materialSelect) return;

  populateSelect(
    materialSelect,
    data.materials.map((m) => ({
      value: m.material_name,
      label: m.material_name,
    })),
  );
}

/** Only one armor per slot; passing an empty armorId clears the slot. */
export function equipArmor(slot, armorId, materialId = DEFAULT_MATERIAL_ID) {
  const currentEquipped = findEquippedArmorInSlot(slot);
  const preservedMaterialId = currentEquipped?.material_id || materialId;

  selected.armors = selected.armors.filter((inst) => {
    if (!inst.is_equipped) return true;
    const db = data.armors.find((a) => a.armor_id === inst.armor_id);
    return db?.armor_piece_location !== slot;
  });

  if (!armorId) {
    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    return;
  }

  selected.armors.push({
    id: generateInstanceId(),
    armor_id: armorId,
    material_id: preservedMaterialId,
    hit_points_modifier: 0,
    is_equipped: true,
    storedAt: null,
    armor_custom_name: null,
    armor_custom_description: null,
    armor_custom_effect: null,
    enchantments: [],
  });

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export function addStoredArmor(
  armorId,
  materialId = null,
  storedAt = STORED_AT.BACKPACK,
) {
  if (!armorId) return;

  selected.armors.push({
    id: generateInstanceId(),
    armor_id: armorId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
    armor_custom_name: null,
    armor_custom_description: null,
    armor_custom_effect: null,
    enchantments: [],
  });

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export {
  moveArmor,
  removeArmor,
  sendArmorToAlly,
  saveArmorCustomFields,
  addArmorEnchantment,
  updateArmorEnchantment,
  removeArmorEnchantment,
  findArmorByInstanceId,
};

export function findEquippedArmorInSlot(slot) {
  return selected.armors.find((inst) => {
    if (!inst.is_equipped) return false;
    const db = data.armors.find((a) => a.armor_id === inst.armor_id);
    return db?.armor_piece_location === slot;
  });
}
