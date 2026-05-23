import { state } from "../state.js";
import { fetchShields, fetchMaterials } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../shared/constants.js";
import { nextShieldInstanceId } from "../store/instanceId.js";

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
  renderLists(selected, data);
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
  populateSelect(nameSelect, names.map((n) => ({ value: n, label: n })));
  updateShieldTierOptions();
}

export function updateShieldTierOptions() {
  const nameSelect = el("shieldNameSelect");
  const tierSelect = el("shieldTierSelect");
  if (!nameSelect || !tierSelect) return;

  const name = nameSelect.value;
  const tiers = [
    ...new Set(
      data.shields.filter((s) => s.shield_name === name).map((s) => s.shield_tier),
    ),
  ];

  populateSelect(tierSelect, tiers.map((t) => ({ value: t, label: t })));
}

export function updateShieldMaterialOptions() {
  const materialSelect = el("shieldMaterialSelect");
  if (!materialSelect) return;

  populateSelect(
    materialSelect,
    data.materials.map((m) => ({ value: m.material_name, label: m.material_name })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Equip a shield. Only one shield can be equipped at a time.
 * Pass an empty shieldId to clear.
 */
export function equipShield(shieldId, materialId = DEFAULT_MATERIAL_ID) {
  const currentEquipped = selected.shields.find((s) => s.is_equipped);
  const preservedMaterialId = currentEquipped?.material_id || materialId;

  selected.shields = selected.shields.filter((s) => !s.is_equipped);

  if (!shieldId) {
    renderLists(selected, data);
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
  });

  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add a shield directly to storage (not equipped). */
export function addStoredShield(shieldId, materialId = null, storedAt = "backpack") {
  if (!shieldId) return;

  selected.shields.push({
    _instanceId: nextShieldInstanceId(),
    shield_id: shieldId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/** Move a stored shield to a different storage location. Uses instanceId. */
export function moveShield(instanceId, storedAt) {
  const shield = findShieldByInstanceId(instanceId);
  if (!shield) return;

  shield.is_equipped = false;
  shield.storedAt = storedAt;

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove a shield instance by instanceId. */
export function removeShield(instanceId) {
  selected.shields = selected.shields.filter((s) => s._instanceId !== instanceId);
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findShieldByInstanceId(instanceId) {
  return selected.shields.find((s) => s._instanceId === instanceId) || null;
}
