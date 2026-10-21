import { state } from "../../../state.js";
import { fetchShields } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { DEFAULT_MATERIAL_ID, STORED_AT } from "../../../shared/constants.js";
import { generateInstanceId } from "../../../store/instanceId.js";
import { createEquippableItemActions } from "../shared/equippableItemActions.js";

const data = state.data;
const selected = state.selected;

const {
  move: moveShield,
  remove: removeShield,
  sendToAlly: sendShieldToAlly,
  saveCustomFields: saveShieldCustomFields,
  addEnchantment: addShieldEnchantment,
  updateEnchantment: updateShieldEnchantment,
  removeEnchantment: removeShieldEnchantment,
  findByInstanceId: findShieldByInstanceId,
} = createEquippableItemActions("shields", "shield");

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadShields() {
  data.shields = await fetchShields();

  loadShieldSelectors();
}

export function loadShieldSelectors() {
  updateShieldNameOptions();
  updateShieldTierOptions();
  updateShieldMaterialOptions();
}

export function updateShieldNameOptions() {
  const nameSelect = el("shieldNameSelect");
  if (!nameSelect) return;

  const names = [...new Set(data.shields.map((s) => s.shield_name))];
  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );
  updateShieldTierOptions();
}

export function updateShieldTierOptions() {
  const nameSelect = el("shieldNameSelect");
  const tierSelect = el("shieldTierSelect");
  if (!nameSelect || !tierSelect) return;

  const name = nameSelect.value;
  const tiers = [
    ...new Set(
      data.shields
        .filter((s) => s.shield_name === name)
        .map((s) => s.shield_tier),
    ),
  ];

  populateSelect(
    tierSelect,
    tiers.map((t) => ({ value: t, label: t })),
  );
}

export function updateShieldMaterialOptions() {
  const materialSelect = el("shieldMaterialSelect");
  if (!materialSelect) return;

  populateSelect(
    materialSelect,
    data.materials.map((m) => ({
      value: m.material_name,
      label: m.material_name,
    })),
  );
}

// Only one shield can be equipped at a time; pass an empty shieldId to clear.
export function equipShield(shieldId, materialId = DEFAULT_MATERIAL_ID) {
  const currentEquipped = selected.shields.find((s) => s.is_equipped);
  const preservedMaterialId = currentEquipped?.material_id || materialId;

  selected.shields = selected.shields.filter((s) => !s.is_equipped);

  if (!shieldId) {
    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    return;
  }

  selected.shields.push({
    id: generateInstanceId(),
    shield_id: shieldId,
    material_id: preservedMaterialId,
    hit_points_modifier: 0,
    is_equipped: true,
    storedAt: null,
    shield_custom_name: null,
    shield_custom_description: null,
    shield_custom_effect: null,
    enchantments: [],
  });

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export function addStoredShield(
  shieldId,
  materialId = null,
  storedAt = STORED_AT.BACKPACK,
) {
  if (!shieldId) return;

  selected.shields.push({
    id: generateInstanceId(),
    shield_id: shieldId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
    shield_custom_name: null,
    shield_custom_description: null,
    shield_custom_effect: null,
    enchantments: [],
  });

  renderListsPreserving(selected, data);
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export {
  moveShield,
  removeShield,
  sendShieldToAlly,
  saveShieldCustomFields,
  addShieldEnchantment,
  updateShieldEnchantment,
  removeShieldEnchantment,
  findShieldByInstanceId,
};
