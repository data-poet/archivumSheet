import { state } from "../../../state.js";
import { fetchShields, fetchMaterials } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../../../shared/constants.js";
import { nextShieldInstanceId } from "../../../store/instanceId.js";
import { offerUndo } from "../../../components/undo.js";
import { t } from "../../../localization/pt-BR/index.js";
import {
  addEnchantmentEntry,
  updateEnchantmentEntry,
  removeEnchantmentEntry,
  clearEnchantmentAddFormSelection,
} from "../shared/enchantments/model.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadShields() {
  [data.shields, data.materials] = await Promise.all([
    fetchShields(),
    fetchMaterials(),
  ]);

  loadShieldSelectors();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP
// ─────────────────────────────────────────────────────────────────────────────

// Only one shield can be equipped at a time; pass an empty shieldId to clear.
export function equipShield(shieldId, materialId = DEFAULT_MATERIAL_ID) {
  const currentEquipped = selected.shields.find((s) => s.is_equipped);
  const preservedMaterialId = currentEquipped?.material_id || materialId;

  selected.shields = selected.shields.filter((s) => !s.is_equipped);

  if (!shieldId) {
    renderListsPreserving(selected, data);
    triggerAutoRun();
    return;
  }

  selected.shields.push({
    _instanceId: nextShieldInstanceId(),
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
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function addStoredShield(
  shieldId,
  materialId = null,
  storedAt = "backpack",
) {
  if (!shieldId) return;

  selected.shields.push({
    _instanceId: nextShieldInstanceId(),
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
  triggerAutoRun();
}

export function moveShield(instanceId, storedAt) {
  const shield = findShieldByInstanceId(instanceId);
  if (!shield) return;

  shield.is_equipped = false;
  shield.storedAt = storedAt;

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeShield(instanceId) {
  const before = structuredClone(selected.shields);
  selected.shields = selected.shields.filter(
    (s) => s._instanceId !== instanceId,
  );
  clearEnchantmentAddFormSelection(instanceId);
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.shields = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES (custom fields)
// ─────────────────────────────────────────────────────────────────────────────

// Blank strings are normalized to null.
export function saveShieldCustomFields(
  instanceId,
  { name, description, effect },
) {
  const instance = findShieldByInstanceId(instanceId);
  if (!instance) return;

  const norm = (v) => (v == null || v.trim() === "" ? null : v.trim());

  instance.shield_custom_name = norm(name);
  instance.shield_custom_description = norm(description);
  instance.shield_custom_effect = norm(effect);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCHANTMENTS
// ─────────────────────────────────────────────────────────────────────────────

export function addShieldEnchantment(instanceId, enchantmentId, params) {
  const instance = findShieldByInstanceId(instanceId);
  if (!instance) return;
  if (!instance.enchantments) instance.enchantments = [];

  const before = structuredClone(instance.enchantments);

  const added = addEnchantmentEntry(
    instance.enchantments,
    enchantmentId,
    params,
  );
  if (!added) return;

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun();
  }, t("common.added"));
}

export function updateShieldEnchantment(
  instanceId,
  entryInstanceId,
  enchantmentId,
  params,
) {
  const instance = findShieldByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  const updated = updateEnchantmentEntry(
    instance.enchantments,
    entryInstanceId,
    enchantmentId,
    params,
  );
  if (!updated) return;

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun();
  });
}

export function removeShieldEnchantment(instanceId, entryInstanceId) {
  const instance = findShieldByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  removeEnchantmentEntry(instance.enchantments, entryInstanceId);

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findShieldByInstanceId(instanceId) {
  return selected.shields.find((s) => s._instanceId === instanceId) || null;
}
