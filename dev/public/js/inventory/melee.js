import { state } from "../state.js";
import { fetchMeleeWeapons, fetchMaterials } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../shared/constants.js";
import { nextMeleeInstanceId } from "../store/instanceId.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadMeleeWeapons() {
  [data.melee_weapons, data.materials] = await Promise.all([
    fetchMeleeWeapons(),
    fetchMaterials(),
  ]);

  loadMeleeSelectors();
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadMeleeSelectors() {
  updateMeleeNameOptions();
  updateMeleeTierOptions();
  updateMeleeMaterialOptions();
}

export function updateMeleeNameOptions() {
  const nameSelect = el("meleeNameSelect");
  if (!nameSelect) return;

  const names = [...new Set(data.melee_weapons.map((w) => w.weapon_name))];
  populateSelect(nameSelect, names.map((n) => ({ value: n, label: n })));
  updateMeleeTierOptions();
}

export function updateMeleeTierOptions() {
  const nameSelect = el("meleeNameSelect");
  const tierSelect = el("meleeTierSelect");
  if (!nameSelect || !tierSelect) return;

  const name = nameSelect.value;
  const tiers = [
    ...new Set(
      data.melee_weapons
        .filter((w) => w.weapon_name === name)
        .map((w) => w.weapon_tier),
    ),
  ];

  populateSelect(tierSelect, tiers.map((t) => ({ value: t, label: t })));
}

export function updateMeleeMaterialOptions() {
  const materialSelect = el("meleeMaterialSelect");
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
 * Equip or update a melee weapon instance by its instanceId.
 * Multiple melee weapons can be equipped simultaneously.
 */
export function equipMelee(instanceId, weaponId, materialId = DEFAULT_MATERIAL_ID) {
  const instance = findMeleeByInstanceId(instanceId);
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

/** Add a melee weapon directly as equipped. */
export function addEquippedMelee(weaponId, materialId = null) {
  if (!weaponId) return;

  selected.melee_weapons.push({
    _instanceId: nextMeleeInstanceId(),
    weapon_id: weaponId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: true,
    storedAt: null,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/** Add a melee weapon directly to storage (not equipped). */
export function addStoredMelee(meleeId, materialId = null, storedAt = "backpack") {
  if (!meleeId) return;

  selected.melee_weapons.push({
    _instanceId: nextMeleeInstanceId(),
    weapon_id: meleeId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/** Move a stored melee weapon to a different storage location. Uses instanceId. */
export function moveMelee(instanceId, storedAt) {
  const melee = findMeleeByInstanceId(instanceId);
  if (!melee) return;

  melee.is_equipped = false;
  melee.storedAt = storedAt;

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove a melee weapon instance by instanceId. */
export function removeMelee(instanceId) {
  selected.melee_weapons = selected.melee_weapons.filter(
    (w) => w._instanceId !== instanceId,
  );
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findMeleeByInstanceId(instanceId) {
  return selected.melee_weapons.find((w) => w._instanceId === instanceId) || null;
}
