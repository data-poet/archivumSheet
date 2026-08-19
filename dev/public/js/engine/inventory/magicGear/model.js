import { state } from "../../../state.js";
import { fetchMagicGear } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { nextMagicGearInstanceId } from "../../../store/instanceId.js";
import { offerUndo } from "../../../components/undo.js";
import { t } from "../../../localization/pt-BR.js";
import {
  addEnchantmentEntry,
  updateEnchantmentEntry,
  removeEnchantmentEntry,
  clearEnchantmentAddFormSelection,
} from "../shared/enchantments/model.js";

const data = state.data;
const selected = state.selected;

// Global equip cap — must match engine/inventory/js/magicGear/magicGearConstants.js's
// MAGIC_GEAR_EQUIP_LIMIT. Kept in sync manually since the client bundle
// doesn't share modules with the server-side engine layer.
const MAGIC_GEAR_EQUIP_LIMIT = 2;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadMagicGear() {
  data.magicGear = await fetchMagicGear();

  loadMagicGearSelectors();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadMagicGearSelectors() {
  updateMagicGearNameOptions();
}

export function updateMagicGearNameOptions() {
  const select = el("magicGearNameSelect");
  if (!select) return;

  populateSelect(
    select,
    data.magicGear.map((g) => ({
      value: g.magic_gear_id,
      label: g.magic_gear_name,
    })),
  );

  updateMagicGearEquipOptionAvailability();
}

/**
 * Disables the "Equipado" option in the add-form storage select whenever the
 * character is already at the GLOBAL magic gear equip limit — the
 * hard-block half of equip-limit enforcement (paired with the engine-side
 * safety check in buildMagicGearSlots). Unlike accessories, this check
 * doesn't depend on which magic_gear_id is selected — the cap is shared
 * across every type.
 */
export function updateMagicGearEquipOptionAvailability() {
  const storageSelect = el("magicGearStorage");
  if (!storageSelect) return;

  const equipOption = Array.from(storageSelect.options).find(
    (o) => o.value === "equipped",
  );
  if (!equipOption) return;

  const atLimit = isMagicGearAtEquipLimit();
  equipOption.disabled = atLimit;

  if (atLimit && storageSelect.value === "equipped") {
    storageSelect.value = "backpack";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP LIMITS
// ─────────────────────────────────────────────────────────────────────────────

export function countEquippedMagicGear() {
  return selected.magicGear.filter((g) => g.is_equipped).length;
}

export function isMagicGearAtEquipLimit() {
  return countEquippedMagicGear() >= MAGIC_GEAR_EQUIP_LIMIT;
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

/** Add a magic gear item directly as equipped. Refuses silently if at the global equip limit. */
export function addEquippedMagicGear(magicGearId) {
  if (!magicGearId) return;
  if (isMagicGearAtEquipLimit()) return;

  selected.magicGear.push(_newMagicGearInstance(magicGearId, true, null));

  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Add a magic gear item directly to storage (not equipped). */
export function addStoredMagicGear(magicGearId, storedAt = "backpack") {
  if (!magicGearId) return;

  selected.magicGear.push(_newMagicGearInstance(magicGearId, false, storedAt));

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP / STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Equip a stored magic gear item. Refuses silently if at the global equip limit. */
export function equipMagicGear(instanceId) {
  const instance = findMagicGearByInstanceId(instanceId);
  if (!instance) return;
  if (isMagicGearAtEquipLimit()) return;

  instance.is_equipped = true;
  instance.storedAt = null;

  updateMagicGearEquipOptionAvailability();
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Move an equipped/stored magic gear item to a different storage location, or
 *  back to equipped if destination is empty (used by the equipped-move select). */
export function moveMagicGear(instanceId, storedAt) {
  const instance = findMagicGearByInstanceId(instanceId);
  if (!instance) return;

  if (!storedAt) {
    if (isMagicGearAtEquipLimit() && !instance.is_equipped) {
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

/** Remove a magic gear instance by instanceId, with undo support. */
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

/**
 * Commits all three custom fields at once — called only when the user
 * presses "Salvar" in the custom-fields editor (see renderUtils.js /
 * magicGearEvents.js), never on individual keystrokes. Blank strings are
 * normalized to null.
 */
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
// Thin magic-gear-specific wrappers around the generic entry helpers in
// enchantments.js — same relationship saveMagicGearCustomFields has with
// customFieldsBlock.
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

/**
 * Edits an already-attached entry in place — swapping it for a different
 * enchantment entirely, or just changing its target/value/extraPoints.
 * Keeps the entry's own _instanceId so its position in the list and its
 * price-lookup identity survive the edit.
 */
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
