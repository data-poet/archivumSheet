import { state } from "../../../state.js";
import { fetchRangedWeapons, fetchMaterials } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../../../shared/constants.js";
import {
  nextRangedInstanceId,
  nextMeleeInstanceId,
} from "../../../store/instanceId.js";
import { getMeleeCounterpart } from "../shared/dualUseWeapons.js";
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

export async function loadRangedWeapons() {
  [data.ranged_weapons, data.materials] = await Promise.all([
    fetchRangedWeapons(),
    fetchMaterials(),
  ]);

  loadRangedSelectors();
  renderListsPreserving(selected, data);
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

  const types = [
    ...new Set(data.ranged_weapons.map((w) => w.weapon_type)),
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

// Multiple ranged weapons can be equipped simultaneously.
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

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// DUAL-USE SYNC HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// If weaponId is dual-use, pushes a mirrored melee instance linked back via _linkedInstanceId.
function _syncMeleeCounterpart(
  rangedInstanceId,
  weaponId,
  materialId,
  isEquipped,
  storedAt,
) {
  const meleeWeaponId = getMeleeCounterpart(weaponId);
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
    weapon_custom_name: null,
    weapon_custom_description: null,
    weapon_custom_effect: null,
    enchantments: [],
  });
}

// Handles both link directions: ranged created first (melee points at ranged) or melee created first (ranged points at melee).
function _findLinkedMelee(rangedInstance) {
  if (!rangedInstance) return null;
  const byMeleeLink = selected.melee_weapons.find(
    (m) => m._linkedInstanceId === rangedInstance._instanceId,
  );
  if (byMeleeLink) return byMeleeLink;
  if (rangedInstance._linkedInstanceId) {
    return (
      selected.melee_weapons.find(
        (m) => m._instanceId === rangedInstance._linkedInstanceId,
      ) ?? null
    );
  }
  return null;
}

function _removeMeleeCounterpart(rangedInstance) {
  const linked = _findLinkedMelee(rangedInstance);
  if (!linked) return;
  selected.melee_weapons = selected.melee_weapons.filter(
    (m) => m._instanceId !== linked._instanceId,
  );
}

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
    weapon_custom_name: null,
    weapon_custom_description: null,
    weapon_custom_effect: null,
    enchantments: [],
  });

  _syncMeleeCounterpart(instanceId, weaponId, materialId, true, null);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

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
    weapon_custom_name: null,
    weapon_custom_description: null,
    weapon_custom_effect: null,
    enchantments: [],
  });

  _syncMeleeCounterpart(instanceId, rangedId, materialId, false, storedAt);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

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

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeRanged(instanceId) {
  const beforeRanged = structuredClone(selected.ranged_weapons);
  const beforeMelee = structuredClone(selected.melee_weapons);

  const ranged = findRangedByInstanceId(instanceId);
  _removeMeleeCounterpart(ranged);

  selected.ranged_weapons = selected.ranged_weapons.filter(
    (w) => w._instanceId !== instanceId,
  );
  clearEnchantmentAddFormSelection(instanceId);
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.ranged_weapons = beforeRanged;
    selected.melee_weapons = beforeMelee;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES (custom fields)
// ─────────────────────────────────────────────────────────────────────────────

// Called only on "Salvar" in the custom-fields editor, never per keystroke. Blank strings normalize to null.
// Mirrors to the linked melee counterpart, same as hit_points_modifier/equip/storage state.
export function saveRangedCustomFields(
  instanceId,
  { name, description, effect },
) {
  const instance = findRangedByInstanceId(instanceId);
  if (!instance) return;

  const norm = (v) => (v == null || v.trim() === "" ? null : v.trim());

  instance.weapon_custom_name = norm(name);
  instance.weapon_custom_description = norm(description);
  instance.weapon_custom_effect = norm(effect);

  const linked = _findLinkedMelee(instance);
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
// ─────────────────────────────────────────────────────────────────────────────

export function addRangedEnchantment(instanceId, enchantmentId, params) {
  const instance = findRangedByInstanceId(instanceId);
  if (!instance) return;
  if (!instance.enchantments) instance.enchantments = [];

  const before = structuredClone(instance.enchantments);

  const added = addEnchantmentEntry(
    instance.enchantments,
    enchantmentId,
    params,
  );
  if (!added) return;

  const linked = _findLinkedMelee(instance);
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

export function updateRangedEnchantment(
  instanceId,
  entryInstanceId,
  enchantmentId,
  params,
) {
  const instance = findRangedByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  const updated = updateEnchantmentEntry(
    instance.enchantments,
    entryInstanceId,
    enchantmentId,
    params,
  );
  if (!updated) return;

  const linked = _findLinkedMelee(instance);
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

export function removeRangedEnchantment(instanceId, entryInstanceId) {
  const instance = findRangedByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  removeEnchantmentEntry(instance.enchantments, entryInstanceId);

  const linked = _findLinkedMelee(instance);
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

export function findRangedByInstanceId(instanceId) {
  return (
    selected.ranged_weapons.find((w) => w._instanceId === instanceId) || null
  );
}
