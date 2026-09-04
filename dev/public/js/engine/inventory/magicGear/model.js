import { state } from "../../../state.js";
import { fetchMagicGear, fetchMagicGearEquipLimits } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { nextMagicGearInstanceId } from "../../../store/instanceId.js";
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

export async function loadMagicGear() {
  const [magicGear, equipLimits] = await Promise.all([
    fetchMagicGear(),
    fetchMagicGearEquipLimits(),
  ]);

  data.magicGear = magicGear;
  data.magicGearEquipLimits = equipLimits;

  loadMagicGearSelectors();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadMagicGearSelectors() {
  updateMagicGearTypeOptions();
}

// Mirrors melee/ranged/firearms' updateXTypeOptions pattern, then re-narrows the name select to match.
export function updateMagicGearTypeOptions() {
  const select = el("magicGearTypeFilter");
  if (!select) return;

  const types = [
    ...new Set(data.magicGear.map((g) => g.magic_gear_type)),
  ].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">${t("magicGear.typeFilter")}</option>` +
    types
      .map(
        (type) =>
          `<option value="${type}" ${type === current ? "selected" : ""}>${type}</option>`,
      )
      .join("");

  updateMagicGearNameOptions();
}

export function updateMagicGearNameOptions() {
  const typeSelect = el("magicGearTypeFilter");
  const select = el("magicGearNameSelect");
  if (!select) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.magicGear.filter((g) => g.magic_gear_type === typeFilter)
    : data.magicGear;

  populateSelect(
    select,
    filtered.map((g) => ({
      value: g.magic_gear_id,
      label: g.magic_gear_name,
    })),
  );

  updateMagicGearEquipOptionAvailability();
}

// Disables "Equipado" in the add-form when the selected item's type is at its equip limit — the
// hard-block half of enforcement, paired with the engine-side check in buildMagicGearSlots.
export function updateMagicGearEquipOptionAvailability() {
  const storageSelect = el("magicGearStorage");
  const nameSelect = el("magicGearNameSelect");
  if (!storageSelect || !nameSelect) return;

  const equipOption = Array.from(storageSelect.options).find(
    (o) => o.value === "equipped",
  );
  if (!equipOption) return;

  const atLimit = isMagicGearAtEquipLimit(nameSelect.value);
  equipOption.disabled = atLimit;

  if (atLimit && storageSelect.value === "equipped") {
    storageSelect.value = "backpack";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP LIMITS
//
// Per-magic_gear_type caps fetched from the engine at bootstrap; the client never hardcodes them.
// ─────────────────────────────────────────────────────────────────────────────

function magicGearType(magicGearId) {
  return data.magicGear.find((g) => g.magic_gear_id === magicGearId)
    ?.magic_gear_type;
}

export function countEquippedMagicGearByType(type) {
  return selected.magicGear.filter(
    (g) => g.is_equipped && magicGearType(g.magic_gear_id) === type,
  ).length;
}

// A magic_gear_id whose type has no known cap is never considered at limit.
export function isMagicGearAtEquipLimit(magicGearId) {
  const type = magicGearType(magicGearId);
  const limit = data.magicGearEquipLimits[type];
  if (limit == null) return false;

  return countEquippedMagicGearByType(type) >= limit;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD
// ─────────────────────────────────────────────────────────────────────────────

function _newMagicGearInstance(magicGearId, isEquipped, storedAt) {
  return {
    _instanceId: nextMagicGearInstanceId(),
    magic_gear_id: magicGearId,
    is_equipped: isEquipped,
    storedAt,
    magic_gear_custom_name: null,
    magic_gear_custom_description: null,
    magic_gear_custom_effect: null,
    enchantments: [],
  };
}

// Refuses silently if the item's type is at its equip limit.
export function addEquippedMagicGear(magicGearId) {
  if (!magicGearId) return;
  if (isMagicGearAtEquipLimit(magicGearId)) return;

  selected.magicGear.push(_newMagicGearInstance(magicGearId, true, null));

  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function addStoredMagicGear(magicGearId, storedAt = "backpack") {
  if (!magicGearId) return;

  selected.magicGear.push(_newMagicGearInstance(magicGearId, false, storedAt));

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP / STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// Refuses silently if the item's type is at its equip limit.
export function equipMagicGear(instanceId) {
  const instance = findMagicGearByInstanceId(instanceId);
  if (!instance) return;
  if (isMagicGearAtEquipLimit(instance.magic_gear_id)) return;

  instance.is_equipped = true;
  instance.storedAt = null;

  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// Empty storedAt means "back to equipped" — used by the equipped-move select.
export function moveMagicGear(instanceId, storedAt) {
  const instance = findMagicGearByInstanceId(instanceId);
  if (!instance) return;

  if (!storedAt) {
    if (
      isMagicGearAtEquipLimit(instance.magic_gear_id) &&
      !instance.is_equipped
    ) {
      return;
    }
    instance.is_equipped = true;
    instance.storedAt = null;
  } else {
    instance.is_equipped = false;
    instance.storedAt = storedAt;
  }

  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeMagicGear(instanceId) {
  const before = structuredClone(selected.magicGear);

  selected.magicGear = selected.magicGear.filter(
    (g) => g._instanceId !== instanceId,
  );
  clearEnchantmentAddFormSelection(instanceId);
  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.magicGear = before;
    updateMagicGearEquipOptionAvailability();
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES (custom fields only — price/weight are DB-driven, not user-input)
// ─────────────────────────────────────────────────────────────────────────────

// Called only on "Salvar" in the custom-fields editor, never per keystroke. Blank strings normalize to null.
export function saveMagicGearCustomFields(
  instanceId,
  { name, description, effect },
) {
  const instance = findMagicGearByInstanceId(instanceId);
  if (!instance) return;

  const norm = (v) => (v == null || v.trim() === "" ? null : v.trim());

  instance.magic_gear_custom_name = norm(name);
  instance.magic_gear_custom_description = norm(description);
  instance.magic_gear_custom_effect = norm(effect);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCHANTMENTS
//
// Thin wrappers around the generic entry helpers in enchantments.js.
// ─────────────────────────────────────────────────────────────────────────────

export function addMagicGearEnchantment(instanceId, enchantmentId, params) {
  const instance = findMagicGearByInstanceId(instanceId);
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

// Keeps the entry's own _instanceId so its list position and price-lookup identity survive the edit.
export function updateMagicGearEnchantment(
  instanceId,
  entryInstanceId,
  enchantmentId,
  params,
) {
  const instance = findMagicGearByInstanceId(instanceId);
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

export function removeMagicGearEnchantment(instanceId, entryInstanceId) {
  const instance = findMagicGearByInstanceId(instanceId);
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

export function findMagicGearByInstanceId(instanceId) {
  return selected.magicGear.find((g) => g._instanceId === instanceId) || null;
}
