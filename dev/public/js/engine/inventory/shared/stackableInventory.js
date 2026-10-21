import { STORED_AT } from "../../../shared/constants.js";
import { state } from "../../../state.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { generateInstanceId } from "../../../store/instanceId.js";
import { offerUndo } from "../../../components/undo.js";
import { t } from "../../../localization/pt-BR/index.js";
import {
  transferStackQuantity,
  undoTransferStackQuantity,
} from "./transfer.js";

const data = state.data;
const selected = state.selected;

// Shared CRUD for entries keyed by (idField value, storedAt) that merge on add/move instead
// of staying as separate instances: coins, alchemy, survival gear, loose ammo.
export function createStackableInventory(arrayKey, idField) {
  function findEntry(itemId, storedAt) {
    return selected[arrayKey].find(
      (e) => e[idField] === itemId && e.storedAt === storedAt,
    );
  }

  function add(itemId, quantity, storedAt = STORED_AT.BACKPACK) {
    if (!itemId || quantity <= 0) return;

    const existing = findEntry(itemId, storedAt);
    if (existing) {
      existing.quantity += quantity;
    } else {
      selected[arrayKey].push({
        id: generateInstanceId(),
        [idField]: itemId,
        quantity,
        storedAt,
      });
    }

    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
  }

  function updateQuantity(itemId, storedAt, quantity) {
    if (quantity <= 0) {
      selected[arrayKey] = selected[arrayKey].filter(
        (e) => !(e[idField] === itemId && e.storedAt === storedAt),
      );
    } else {
      const entry = findEntry(itemId, storedAt);
      if (entry) entry.quantity = quantity;
    }

    renderListsPreserving(selected, data);
    triggerAutoRun();
  }

  function remove(itemId, storedAt) {
    const before = structuredClone(selected[arrayKey]);
    selected[arrayKey] = selected[arrayKey].filter(
      (e) => !(e[idField] === itemId && e.storedAt === storedAt),
    );
    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

    offerUndo(() => {
      selected[arrayKey] = before;
      renderListsPreserving(selected, data);
      triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    });
  }

  function move(itemId, fromLocation, toLocation) {
    if (fromLocation === toLocation) return;

    const source = findEntry(itemId, fromLocation);
    if (!source) return;

    const qty = source.quantity;

    selected[arrayKey] = selected[arrayKey].filter(
      (e) => !(e[idField] === itemId && e.storedAt === fromLocation),
    );

    const dest = findEntry(itemId, toLocation);
    if (dest) {
      dest.quantity += qty;
    } else {
      selected[arrayKey].push({
        id: source.id,
        [idField]: itemId,
        quantity: qty,
        storedAt: toLocation,
      });
    }

    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
  }

  function sendToAlly(
    instanceId,
    destinationCharacterId,
    amount,
    storedAt = STORED_AT.BACKPACK,
  ) {
    const before = structuredClone(selected[arrayKey]);

    const result = transferStackQuantity({
      sourceArray: selected[arrayKey],
      instanceId,
      amount,
      destinationCharacterId,
      destinationInventoryKey: arrayKey,
      destinationStoredAt: storedAt,
      matchKeyFields: [idField],
    });
    if (!result) return false;

    renderListsPreserving(selected, data);
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

    offerUndo(() => {
      undoTransferStackQuantity({
        destinationCharacterId,
        destinationInventoryKey: arrayKey,
        destinationRowId: result.destinationRowId,
        amount: result.amount,
      });
      selected[arrayKey] = before;
      renderListsPreserving(selected, data);
      triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    }, t("undo.sentMessage"));

    return true;
  }

  return { findEntry, add, updateQuantity, remove, move, sendToAlly };
}
