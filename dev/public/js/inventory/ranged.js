import { state } from "../state.js";
import { fetchRangedWeapons, fetchMaterials } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../shared/constants.js";
import { nextRangedInstanceId } from "../store/instanceId.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadRangedWeapons() {
  [data.ranged_weapons, data.materials] = await Promise.all([
    fetchRangedWeapons(),
    fetchMaterials(),
  ]);

  loadRangedSelectors();
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadRangedSelectors() {
  updateRangedNameOptions();
  updateRangedTierOptions();
  updateRangedMaterialOptions();
}

export function updateRangedNameOptions() {
  const nameSelect = el("rangedNameSelect");
  if (!nameSelect) return;

  const names = [...new Set(data.ranged_weapons.map((w) => w.weapon_name))];
  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );
  updateRangedTierOptions();
}

export function updateRangedTierOptions() {
  const nameSelect = el("rangedNameSelect");
  const tierSelect = el("rangedTierSelect");
  if (!nameSelect || !tierSelect) return;

  const name = nameSelect.value;
  const tiers = [
    ...new Set(
      data.ranged_weapons
        .filter((w) => w.weapon_name === name)
        .map((w) => w.weapon_tier),
    ),
  ];

  populateSelect(
    tierSelect,
    tiers.map((t) => ({ value: t, label: t })),
  );
}

export function updateRangedMaterialOptions() {
  const materialSelect = el("rangedMaterialSelect");
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

/**
 * Equip or update a ranged weapon instance by its instanceId.
 * Multiple ranged weapons can be equipped simultaneously.
 */
export function equipRanged(
  instanceId,
  weaponId,
  materialId = DEFAULT_MATERIAL_ID,
) {
  const instance = findRangedByInstanceId(instanceId);
  if (!instance) return;

  instance.weapon_id = weaponId;
  instance.material_id = materialId;
  instance.is_equipped = true;
  instance.storedAt = null;

  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add a ranged weapon directly as equipped. */
export function addEquippedRanged(weaponId, materialId = null) {
  if (!weaponId) return;

  selected.ranged_weapons.push({
    _instanceId: nextRangedInstanceId(),
    weapon_id: weaponId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: true,
    storedAt: null,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/** Add a ranged weapon directly to storage (not equipped). */
export function addStoredRanged(
  rangedId,
  materialId = null,
  storedAt = "backpack",
) {
  if (!rangedId) return;

  selected.ranged_weapons.push({
    _instanceId: nextRangedInstanceId(),
    weapon_id: rangedId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/** Move a stored ranged weapon to a different storage location. Uses instanceId. */
export function moveRanged(instanceId, storedAt) {
  const ranged = findRangedByInstanceId(instanceId);
  if (!ranged) return;

  ranged.is_equipped = false;
  ranged.storedAt = storedAt;

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove a ranged instance by instanceId. */
export function removeRanged(instanceId) {
  selected.ranged_weapons = selected.ranged_weapons.filter(
    (w) => w._instanceId !== instanceId,
  );
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findRangedByInstanceId(instanceId) {
  return (
    selected.ranged_weapons.find((w) => w._instanceId === instanceId) || null
  );
}
