import { state } from "../../../state.js";
import { fetchFirearms, fetchMaterials } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { nextFirearmInstanceId } from "../../../store/instanceId.js";
import { offerUndo } from "../../../components/undo.js";
import { updateContainerAmmoQuantity } from "../ammo/model.js";
import { t } from "../../../localization/pt-BR.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadFirearms() {
  [data.firearms, data.materials] = await Promise.all([
    fetchFirearms(),
    fetchMaterials(),
  ]);

  loadFirearmSelectors();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
//
// Firearms have their own dedicated tab/section, separate from Ranged, so
// these selectors only ever pull from data.firearms.
// ─────────────────────────────────────────────────────────────────────────────

export function loadFirearmSelectors() {
  updateFirearmTypeOptions();
  updateFirearmMaterialOptions();
}

export function updateFirearmTypeOptions() {
  const select = el("firearmTypeFilter");
  if (!select) return;

  const types = [...new Set(data.firearms.map((w) => w.weapon_type))].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">${t("traits.typeFilter")}</option>` +
    types
      .map(
        (type) =>
          `<option value="${type}" ${type === current ? "selected" : ""}>${type}</option>`,
      )
      .join("");

  updateFirearmNameOptions();
}

export function updateFirearmNameOptions() {
  const typeSelect = el("firearmTypeFilter");
  const nameSelect = el("firearmNameSelect");
  if (!nameSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.firearms.filter((w) => w.weapon_type === typeFilter)
    : data.firearms;

  const names = [...new Set(filtered.map((w) => w.weapon_name))];
  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );
  updateFirearmTierOptions();
}

export function updateFirearmTierOptions() {
  const nameSelect = el("firearmNameSelect");
  const tierSelect = el("firearmTierSelect");
  if (!nameSelect || !tierSelect) return;

  const name = nameSelect.value;
  const tiers = [
    ...new Set(
      data.firearms
        .filter((w) => w.weapon_name === name)
        .map((w) => w.weapon_tier),
    ),
  ];

  populateSelect(
    tierSelect,
    tiers.map((tier) => ({ value: tier, label: tier })),
  );
}

export function updateFirearmMaterialOptions() {
  const materialSelect = el("firearmMaterialSelect");
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

/** Equip or update a firearm instance by its instanceId. */
export function equipFirearm(instanceId, weaponId, materialId = null) {
  const instance = findFirearmByInstanceId(instanceId);
  if (!instance) return;

  instance.weapon_id = weaponId;
  instance.material_id = materialId;
  instance.is_equipped = true;
  instance.storedAt = null;

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD
// ─────────────────────────────────────────────────────────────────────────────

function _newFirearmInstance(weaponId, materialId, isEquipped, storedAt) {
  return {
    _instanceId: nextFirearmInstanceId(),
    weapon_id: weaponId,
    material_id: materialId,
    hit_points_modifier: 0,
    gdp_modifier: 0,
    tr_modifier: 0,
    prec_modifier: 0,
    magazine_size_modifier: 0,
    rounds_loaded: 0,
    is_equipped: isEquipped,
    storedAt,
    weapon_custom_name: null,
    weapon_custom_description: null,
    weapon_custom_effect: null,
  };
}

/** Add a firearm directly as equipped. */
export function addEquippedFirearm(weaponId, materialId = null) {
  if (!weaponId) return;

  selected.firearms.push(_newFirearmInstance(weaponId, materialId, true, null));

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Add a firearm directly to storage (not equipped). */
export function addStoredFirearm(weaponId, materialId = null, storedAt = "backpack") {
  if (!weaponId) return;

  selected.firearms.push(
    _newFirearmInstance(weaponId, materialId, false, storedAt),
  );

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Move a stored firearm to a different storage location. Uses instanceId. */
export function moveFirearm(instanceId, storedAt) {
  const firearm = findFirearmByInstanceId(instanceId);
  if (!firearm) return;

  firearm.is_equipped = false;
  firearm.storedAt = storedAt;

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Remove a firearm instance by instanceId. */
export function removeFirearm(instanceId) {
  const before = structuredClone(selected.firearms);

  selected.firearms = selected.firearms.filter(
    (w) => w._instanceId !== instanceId,
  );
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.firearms = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AMMO / RELOAD
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve the numeric base magazine size + runtime modifier for an instance. */
export function computeFinalMagazineSize(instance, weaponData) {
  const base = Number(weaponData?.weapon_magazine_size || 0);
  const modifier = Number(instance.magazine_size_modifier || 0);
  return Math.max(0, base + modifier);
}

/** Directly set rounds_loaded (clamped 0..final magazine size), no ammo consumed. */
export function setFirearmRoundsLoaded(instanceId, rawValue) {
  const instance = findFirearmByInstanceId(instanceId);
  if (!instance) return;

  const weaponData = data.firearms.find((w) => w.weapon_id === instance.weapon_id);
  const max = computeFinalMagazineSize(instance, weaponData);

  const parsed = parseInt(rawValue, 10);
  instance.rounds_loaded = Math.min(Math.max(isNaN(parsed) ? 0 : parsed, 0), max);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/**
 * Reload a firearm: drains matching ammo (by weapon_type === ammo_type) from
 * equipped ammo containers — first container first, by insertion order —
 * mirroring the aggregate drain used by the resume ranged-ammo stepper.
 * Partially reloads if there isn't enough stock.
 */
export function reloadFirearm(instanceId) {
  const instance = findFirearmByInstanceId(instanceId);
  if (!instance) return;

  const weaponData = data.firearms.find((w) => w.weapon_id === instance.weapon_id);
  if (!weaponData) return;

  const maxRounds = computeFinalMagazineSize(instance, weaponData);
  const current = Number(instance.rounds_loaded || 0);
  let needed = maxRounds - current;
  if (needed <= 0) return;

  const matchingAmmoIds = new Set(
    data.ammo
      .filter((a) => a.ammo_type === weaponData.weapon_type)
      .map((a) => a.ammo_id),
  );
  if (matchingAmmoIds.size === 0) return;

  const equippedContainers = selected.ammo_containers.filter(
    (c) => c.storedAt === "equipped",
  );

  let drained = 0;
  for (const container of equippedContainers) {
    if (needed <= 0) break;
    for (const entry of container.contents) {
      if (needed <= 0) break;
      if (!matchingAmmoIds.has(entry.ammo_id) || entry.quantity <= 0) continue;

      const toRemove = Math.min(needed, entry.quantity);
      updateContainerAmmoQuantity(
        container._instanceId,
        entry.ammo_id,
        entry.quantity - toRemove,
      );

      needed -= toRemove;
      drained += toRemove;
    }
  }

  if (drained > 0) {
    instance.rounds_loaded = current + drained;
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES (custom fields)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Commits all three custom fields at once — called only when the user
 * presses "Salvar" in the custom-fields editor, never on individual
 * keystrokes. Blank strings are normalized to null.
 */
export function saveFirearmCustomFields(instanceId, { name, description, effect }) {
  const instance = findFirearmByInstanceId(instanceId);
  if (!instance) return;

  const norm = (v) => (v == null || v.trim() === "" ? null : v.trim());

  instance.weapon_custom_name = norm(name);
  instance.weapon_custom_description = norm(description);
  instance.weapon_custom_effect = norm(effect);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findFirearmByInstanceId(instanceId) {
  return selected.firearms.find((w) => w._instanceId === instanceId) || null;
}
