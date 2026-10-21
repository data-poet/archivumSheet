import { STORED_AT } from "../../../shared/constants.js";
import { state } from "../../../state.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { offerUndo } from "../../../components/undo.js";
import { t } from "../../../localization/pt-BR/index.js";
import {
  addEnchantmentEntry,
  updateEnchantmentEntry,
  removeEnchantmentEntry,
  clearEnchantmentAddFormSelection,
} from "./enchantments/model.js";
import { transferInstance, undoTransferInstance } from "./transfer.js";

const data = state.data;
const selected = state.selected;

// Shared CRUD for single-instance equippable items carrying enchantments: armor, shield,
// firearms, accessories, magicGear. Melee/ranged keep their own wrappers — dual-use mirroring
// to a linked counterpart is real per-feature behavior, not boilerplate.
export function createEquippableItemActions(
  arrayKey,
  customFieldPrefix,
  { onEquipStateChanged = () => {} } = {},
) {
  function findByInstanceId(instanceId) {
    return selected[arrayKey].find((e) => e.id === instanceId) || null;
  }

  function move(instanceId, storedAt) {
    const instance = findByInstanceId(instanceId);
    if (!instance) return;

    instance.is_equipped = false;
    instance.storedAt = storedAt;

    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
  }

  function remove(instanceId) {
    const before = structuredClone(selected[arrayKey]);
    selected[arrayKey] = selected[arrayKey].filter((e) => e.id !== instanceId);
    clearEnchantmentAddFormSelection(instanceId);
    onEquipStateChanged();
    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

    offerUndo(() => {
      selected[arrayKey] = before;
      onEquipStateChanged();
      renderListsPreserving(selected, data);
      triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    });
  }

  function sendToAlly(
    instanceId,
    destinationCharacterId,
    storedAt = STORED_AT.BACKPACK,
  ) {
    const before = structuredClone(selected[arrayKey]);

    const clone = transferInstance({
      sourceArray: selected[arrayKey],
      instanceId,
      destinationCharacterId,
      destinationInventoryKey: arrayKey,
      destinationStoredAt: storedAt,
    });
    if (!clone) return false;

    clearEnchantmentAddFormSelection(instanceId);
    onEquipStateChanged();
    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

    offerUndo(() => {
      undoTransferInstance({
        destinationCharacterId,
        destinationInventoryKey: arrayKey,
        cloneId: clone.id,
      });
      selected[arrayKey] = before;
      onEquipStateChanged();
      renderListsPreserving(selected, data);
      triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    }, t("undo.sentMessage"));

    return true;
  }

  // Commits all three custom fields at once, only on "Salvar", never per keystroke. Blank strings normalize to null.
  function saveCustomFields(instanceId, { name, description, effect }) {
    const instance = findByInstanceId(instanceId);
    if (!instance) return;

    const norm = (v) => (v == null || v.trim() === "" ? null : v.trim());

    instance[`${customFieldPrefix}_custom_name`] = norm(name);
    instance[`${customFieldPrefix}_custom_description`] = norm(description);
    instance[`${customFieldPrefix}_custom_effect`] = norm(effect);

    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
  }

  function addEnchantment(instanceId, enchantmentId, params) {
    const instance = findByInstanceId(instanceId);
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
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

    offerUndo(() => {
      instance.enchantments = before;
      renderListsPreserving(selected, data, state.sheet);
      triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    }, t("common.added"));
  }

  // Keeps the entry's own id so its list position and price-lookup identity survive the edit.
  function updateEnchantment(
    instanceId,
    entryInstanceId,
    enchantmentId,
    params,
  ) {
    const instance = findByInstanceId(instanceId);
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
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

    offerUndo(() => {
      instance.enchantments = before;
      renderListsPreserving(selected, data, state.sheet);
      triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    });
  }

  function removeEnchantment(instanceId, entryInstanceId) {
    const instance = findByInstanceId(instanceId);
    if (!instance || !instance.enchantments) return;

    const before = structuredClone(instance.enchantments);

    removeEnchantmentEntry(instance.enchantments, entryInstanceId);

    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

    offerUndo(() => {
      instance.enchantments = before;
      renderListsPreserving(selected, data, state.sheet);
      triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    });
  }

  return {
    findByInstanceId,
    move,
    remove,
    sendToAlly,
    saveCustomFields,
    addEnchantment,
    updateEnchantment,
    removeEnchantment,
  };
}
