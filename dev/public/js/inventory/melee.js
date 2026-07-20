import { state } from "../state.js";
import { fetchMeleeWeapons, fetchMaterials } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../shared/constants.js";
import { nextMeleeInstanceId, nextRangedInstanceId } from "../store/instanceId.js";
import { MELEE_TO_RANGED } from "../shared/dualUseWeapons.js";
import { t } from "../localization/pt-BR.js";

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
  updateMeleeTypeOptions();
  updateMeleeMaterialOptions();
}

export function updateMeleeTypeOptions() {
  const select = el("meleeTypeFilter");
  if (!select) return;

  const types = [...new Set(data.melee_weapons.map((w) => w.weapon_type))].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">${t("traits.typeFilter")}</option>` +
    types
      .map(
        (type) =>
          `<option value="${type}" ${type === current ? "selected" : ""}>${type}</option>`,
      )
      .join("");

  updateMeleeNameOptions();
}

export function updateMeleeNameOptions() {
  const typeSelect = el("meleeTypeFilter");
  const nameSelect = el("meleeNameSelect");
  if (!nameSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.melee_weapons.filter((w) => w.weapon_type === typeFilter)
    : data.melee_weapons;

  const names = [...new Set(filtered.map((w) => w.weapon_name))];
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

  // Mirror equip state to ranged counterpart (bidirectional lookup).
  const linked = _findLinkedRanged(instance);
  if (linked) {
    linked.is_equipped = true;
    linked.storedAt = null;
  }

  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// DUAL-USE SYNC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the ranged counterpart for a melee instance, regardless of which side
 * created the pair. Two cases:
 *   • Melee was created first  → ranged has _linkedInstanceId === melee._instanceId
 *   • Ranged was created first → melee has _linkedInstanceId === ranged._instanceId
 */
function _findLinkedRanged(meleeInstance) {
  if (!meleeInstance) return null;
  const byRangedLink = selected.ranged_weapons.find(
    (r) => r._linkedInstanceId === meleeInstance._instanceId,
  );
  if (byRangedLink) return byRangedLink;
  if (meleeInstance._linkedInstanceId) {
    return (
      selected.ranged_weapons.find(
        (r) => r._instanceId === meleeInstance._linkedInstanceId,
      ) ?? null
    );
  }
  return null;
}

/**
 * If weaponId is a dual-use melee weapon, push a mirrored ranged instance
 * into selected.ranged_weapons with the same storage/equip state, material,
 * and a _linkedInstanceId pointing back to meleeInstanceId.
 */
function _syncRangedCounterpart(meleeInstanceId, weaponId, materialId, isEquipped, storedAt) {
  const rangedWeaponId = MELEE_TO_RANGED[weaponId];
  if (!rangedWeaponId) return;

  // Guard: counterpart already exists (prevents loops from ranged-side sync).
  const alreadyLinked = selected.ranged_weapons.some(
    (r) => r._linkedInstanceId === meleeInstanceId,
  );
  if (alreadyLinked) return;

  selected.ranged_weapons.push({
    _instanceId: nextRangedInstanceId(),
    _linkedInstanceId: meleeInstanceId,
    weapon_id: rangedWeaponId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: isEquipped,
    storedAt,
  });
}

/**
 * Remove the ranged counterpart linked to a given melee instance.
 */
function _removeRangedCounterpart(meleeInstance) {
  const linked = _findLinkedRanged(meleeInstance);
  if (!linked) return;
  selected.ranged_weapons = selected.ranged_weapons.filter(
    (r) => r._instanceId !== linked._instanceId,
  );
}

/** Add a melee weapon directly as equipped. */
export function addEquippedMelee(weaponId, materialId = null) {
  if (!weaponId) return;

  const instanceId = nextMeleeInstanceId();

  selected.melee_weapons.push({
    _instanceId: instanceId,
    weapon_id: weaponId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: true,
    storedAt: null,
  });

  _syncRangedCounterpart(instanceId, weaponId, materialId, true, null);

  renderLists(selected, data);
  triggerAutoRun();
}

/** Add a melee weapon directly to storage (not equipped). */
export function addStoredMelee(meleeId, materialId = null, storedAt = "backpack") {
  if (!meleeId) return;

  const instanceId = nextMeleeInstanceId();

  selected.melee_weapons.push({
    _instanceId: instanceId,
    weapon_id: meleeId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
  });

  _syncRangedCounterpart(instanceId, meleeId, materialId, false, storedAt);

  renderLists(selected, data);
  triggerAutoRun();
}

/** Move a stored melee weapon to a different storage location. Uses instanceId. */
export function moveMelee(instanceId, storedAt) {
  const melee = findMeleeByInstanceId(instanceId);
  if (!melee) return;

  melee.is_equipped = false;
  melee.storedAt = storedAt;

  // Mirror storage move to ranged counterpart (bidirectional lookup).
  const linked = _findLinkedRanged(melee);
  if (linked) {
    linked.is_equipped = false;
    linked.storedAt = storedAt;
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove a melee weapon instance by instanceId. */
export function removeMelee(instanceId) {
  const melee = findMeleeByInstanceId(instanceId);
  _removeRangedCounterpart(melee);

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
