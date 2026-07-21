import { state } from "../state.js";
import { fetchRangedWeapons, fetchMaterials } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../shared/constants.js";
import { nextRangedInstanceId, nextMeleeInstanceId } from "../store/instanceId.js";
import { RANGED_TO_MELEE } from "../shared/dualUseWeapons.js";
import { t } from "../localization/pt-BR.js";
import { offerUndo } from "../ui/undo.js";

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
  updateRangedTypeOptions();
  updateRangedMaterialOptions();
}

export function updateRangedTypeOptions() {
  const select = el("rangedTypeFilter");
  if (!select) return;

  const types = [...new Set(data.ranged_weapons.map((w) => w.weapon_type))].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">${t("traits.typeFilter")}</option>` +
    types
      .map(
        (type) =>
          `<option value="${type}" ${type === current ? "selected" : ""}>${type}</option>`,
      )
      .join("");

  updateRangedNameOptions();
}

export function updateRangedNameOptions() {
  const typeSelect = el("rangedTypeFilter");
  const nameSelect = el("rangedNameSelect");
  if (!nameSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.ranged_weapons.filter((w) => w.weapon_type === typeFilter)
    : data.ranged_weapons;

  const names = [...new Set(filtered.map((w) => w.weapon_name))];
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

  // Mirror equip state to melee counterpart (bidirectional lookup).
  const linked = _findLinkedMelee(instance);
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
 * If weaponId is a dual-use ranged weapon, push a mirrored melee instance
 * into selected.melee_weapons with the same storage/equip state, material,
 * and a _linkedInstanceId pointing back to rangedInstanceId.
 */
function _syncMeleeCounterpart(rangedInstanceId, weaponId, materialId, isEquipped, storedAt) {
  const meleeWeaponId = RANGED_TO_MELEE[weaponId];
  if (!meleeWeaponId) return;

  // Guard: counterpart already exists (prevents loops from melee-side sync).
  const alreadyLinked = selected.melee_weapons.some(
    (m) => m._linkedInstanceId === rangedInstanceId,
  );
  if (alreadyLinked) return;

  selected.melee_weapons.push({
    _instanceId: nextMeleeInstanceId(),
    _linkedInstanceId: rangedInstanceId,
    weapon_id: meleeWeaponId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: isEquipped,
    storedAt,
  });
}

/**
 * Find the melee counterpart for a ranged instance, regardless of which side
 * created the pair. Two cases:
 *   • Ranged was created first → melee has _linkedInstanceId === ranged._instanceId
 *   • Melee was created first  → ranged has _linkedInstanceId === melee._instanceId
 */
function _findLinkedMelee(rangedInstance) {
  if (!rangedInstance) return null;
  // Case 1: melee points at us.
  const byMeleeLink = selected.melee_weapons.find(
    (m) => m._linkedInstanceId === rangedInstance._instanceId,
  );
  if (byMeleeLink) return byMeleeLink;
  // Case 2: we point at melee.
  if (rangedInstance._linkedInstanceId) {
    return (
      selected.melee_weapons.find(
        (m) => m._instanceId === rangedInstance._linkedInstanceId,
      ) ?? null
    );
  }
  return null;
}

/**
 * Remove the melee counterpart linked to a given ranged instance.
 */
function _removeMeleeCounterpart(rangedInstance) {
  const linked = _findLinkedMelee(rangedInstance);
  if (!linked) return;
  selected.melee_weapons = selected.melee_weapons.filter(
    (m) => m._instanceId !== linked._instanceId,
  );
}

/** Add a ranged weapon directly as equipped. */
export function addEquippedRanged(weaponId, materialId = null) {
  if (!weaponId) return;

  const instanceId = nextRangedInstanceId();

  selected.ranged_weapons.push({
    _instanceId: instanceId,
    weapon_id: weaponId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: true,
    storedAt: null,
  });

  _syncMeleeCounterpart(instanceId, weaponId, materialId, true, null);

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

  const instanceId = nextRangedInstanceId();

  selected.ranged_weapons.push({
    _instanceId: instanceId,
    weapon_id: rangedId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
  });

  _syncMeleeCounterpart(instanceId, rangedId, materialId, false, storedAt);

  renderLists(selected, data);
  triggerAutoRun();
}

/** Move a stored ranged weapon to a different storage location. Uses instanceId. */
export function moveRanged(instanceId, storedAt) {
  const ranged = findRangedByInstanceId(instanceId);
  if (!ranged) return;

  ranged.is_equipped = false;
  ranged.storedAt = storedAt;

  // Mirror storage move to melee counterpart (bidirectional lookup).
  const linked = _findLinkedMelee(ranged);
  if (linked) {
    linked.is_equipped = false;
    linked.storedAt = storedAt;
  }

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove a ranged instance by instanceId. */
export function removeRanged(instanceId) {
  const beforeRanged = structuredClone(selected.ranged_weapons);
  const beforeMelee = structuredClone(selected.melee_weapons);

  const ranged = findRangedByInstanceId(instanceId);
  _removeMeleeCounterpart(ranged);

  selected.ranged_weapons = selected.ranged_weapons.filter(
    (w) => w._instanceId !== instanceId,
  );
  renderLists(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.ranged_weapons = beforeRanged;
    selected.melee_weapons = beforeMelee;
    renderLists(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findRangedByInstanceId(instanceId) {
  return (
    selected.ranged_weapons.find((w) => w._instanceId === instanceId) || null
  );
}
