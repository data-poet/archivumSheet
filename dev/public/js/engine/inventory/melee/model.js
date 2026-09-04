import { state } from "../../../state.js";
import { fetchMeleeWeapons, fetchMaterials } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../../../shared/constants.js";
import {
  nextMeleeInstanceId,
  nextRangedInstanceId,
} from "../../../store/instanceId.js";
import { getRangedCounterpart } from "../shared/dualUseWeapons.js";
import { t } from "../../../localization/pt-BR/index.js";
import { offerUndo } from "../../../components/undo.js";
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

export async function loadMeleeWeapons() {
  [data.melee_weapons, data.materials] = await Promise.all([
    fetchMeleeWeapons(),
    fetchMaterials(),
  ]);

  loadMeleeSelectors();
  renderListsPreserving(selected, data);
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

  const types = [
    ...new Set(data.melee_weapons.map((w) => w.weapon_type)),
  ].sort();
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
  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );
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

  populateSelect(
    tierSelect,
    tiers.map((t) => ({ value: t, label: t })),
  );
}

export function updateMeleeMaterialOptions() {
  const materialSelect = el("meleeMaterialSelect");
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

// Multiple melee weapons can be equipped simultaneously.
export function equipMelee(
  instanceId,
  weaponId,
  materialId = DEFAULT_MATERIAL_ID,
) {
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

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// DUAL-USE SYNC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Handles both link directions: melee created first (ranged points at melee) or ranged created first (melee points at ranged).
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

// If weaponId is dual-use, pushes a mirrored ranged instance linked back via _linkedInstanceId.
function _syncRangedCounterpart(
  meleeInstanceId,
  weaponId,
  materialId,
  isEquipped,
  storedAt,
) {
  const rangedWeaponId = getRangedCounterpart(weaponId);
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
    weapon_custom_name: null,
    weapon_custom_description: null,
    weapon_custom_effect: null,
    enchantments: [],
  });
}

function _removeRangedCounterpart(meleeInstance) {
  const linked = _findLinkedRanged(meleeInstance);
  if (!linked) return;
  selected.ranged_weapons = selected.ranged_weapons.filter(
    (r) => r._instanceId !== linked._instanceId,
  );
}

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
    weapon_custom_name: null,
    weapon_custom_description: null,
    weapon_custom_effect: null,
    enchantments: [],
  });

  _syncRangedCounterpart(instanceId, weaponId, materialId, true, null);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function addStoredMelee(
  meleeId,
  materialId = null,
  storedAt = "backpack",
) {
  if (!meleeId) return;

  const instanceId = nextMeleeInstanceId();

  selected.melee_weapons.push({
    _instanceId: instanceId,
    weapon_id: meleeId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
    weapon_custom_name: null,
    weapon_custom_description: null,
    weapon_custom_effect: null,
    enchantments: [],
  });

  _syncRangedCounterpart(instanceId, meleeId, materialId, false, storedAt);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

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

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeMelee(instanceId) {
  const beforeMelee = structuredClone(selected.melee_weapons);
  const beforeRanged = structuredClone(selected.ranged_weapons);

  const melee = findMeleeByInstanceId(instanceId);
  _removeRangedCounterpart(melee);

  selected.melee_weapons = selected.melee_weapons.filter(
    (w) => w._instanceId !== instanceId,
  );
  clearEnchantmentAddFormSelection(instanceId);
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.melee_weapons = beforeMelee;
    selected.ranged_weapons = beforeRanged;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES (custom fields)
// ─────────────────────────────────────────────────────────────────────────────

// Called only on "Salvar" in the custom-fields editor, never per keystroke. Blank strings normalize to null.
// Mirrors to the linked ranged counterpart — a dual-use weapon is one physical item, so renaming applies to both sides.
export function saveMeleeCustomFields(
  instanceId,
  { name, description, effect },
) {
  const instance = findMeleeByInstanceId(instanceId);
  if (!instance) return;

  const norm = (v) => (v == null || v.trim() === "" ? null : v.trim());

  instance.weapon_custom_name = norm(name);
  instance.weapon_custom_description = norm(description);
  instance.weapon_custom_effect = norm(effect);

  const linked = _findLinkedRanged(instance);
  if (linked) {
    linked.weapon_custom_name = instance.weapon_custom_name;
    linked.weapon_custom_description = instance.weapon_custom_description;
    linked.weapon_custom_effect = instance.weapon_custom_effect;
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCHANTMENTS
//
// Thin wrappers around the generic entry helpers in shared/enchantments/model.js. instance.enchantments
// defaults to [] defensively since melee weapons saved before this feature existed won't have the field.
//
// A melee/ranged pair is one physical weapon, so enchantments stay identical on both sides via the same
// bidirectional-lookup mirroring used by saveMeleeCustomFields/equipMelee/moveMelee. Ranged's own
// add/update/remove wrappers mirror back onto melee the same way.
// ─────────────────────────────────────────────────────────────────────────────

export function addMeleeEnchantment(instanceId, enchantmentId, params) {
  const instance = findMeleeByInstanceId(instanceId);
  if (!instance) return;
  if (!instance.enchantments) instance.enchantments = [];

  const before = structuredClone(instance.enchantments);

  const added = addEnchantmentEntry(
    instance.enchantments,
    enchantmentId,
    params,
  );
  if (!added) return;

  const linked = _findLinkedRanged(instance);
  if (linked) linked.enchantments = structuredClone(instance.enchantments);

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    if (linked) linked.enchantments = structuredClone(before);
    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun();
  }, t("common.added"));
}

// Keeps the entry's own _instanceId so its list position and price-lookup identity survive the edit.
export function updateMeleeEnchantment(
  instanceId,
  entryInstanceId,
  enchantmentId,
  params,
) {
  const instance = findMeleeByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  const updated = updateEnchantmentEntry(
    instance.enchantments,
    entryInstanceId,
    enchantmentId,
    params,
  );
  if (!updated) return;

  const linked = _findLinkedRanged(instance);
  if (linked) linked.enchantments = structuredClone(instance.enchantments);

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    if (linked) linked.enchantments = structuredClone(before);
    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun();
  });
}

export function removeMeleeEnchantment(instanceId, entryInstanceId) {
  const instance = findMeleeByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  removeEnchantmentEntry(instance.enchantments, entryInstanceId);

  const linked = _findLinkedRanged(instance);
  if (linked) linked.enchantments = structuredClone(instance.enchantments);

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    if (linked) linked.enchantments = structuredClone(before);
    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findMeleeByInstanceId(instanceId) {
  return (
    selected.melee_weapons.find((w) => w._instanceId === instanceId) || null
  );
}
