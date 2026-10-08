import { state } from "../../../state.js";
import { fetchAlchemy } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { offerUndo } from "../../../components/undo.js";
import { generateInstanceId } from "../../../store/instanceId.js";
import { t } from "../../../localization/pt-BR/index.js";
import {
  transferStackQuantity,
  undoTransferStackQuantity,
} from "../shared/transfer.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

// Rendering is not triggered here — main.js renders once after every load*() resolves.
export async function loadAlchemy() {
  data.alchemy = await fetchAlchemy();

  loadAlchemySelectors();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadAlchemySelectors() {
  updateAlchemyTypeOptions();
  updateAlchemyNameOptions();
  updateAlchemyTierOptions();
}

export function updateAlchemyTypeOptions() {
  const select = el("alchemyTypeFilter");
  if (!select) return;

  const types = [...new Set(data.alchemy.map((c) => c.consumable_type))].sort();
  const current = select.value;

  select.innerHTML =
    `<option value="">— Tipo —</option>` +
    types
      .map(
        (t) =>
          `<option value="${t}" ${t === current ? "selected" : ""}>${t}</option>`,
      )
      .join("");

  updateAlchemyNameOptions();
}

export function updateAlchemyNameOptions() {
  const typeSelect = el("alchemyTypeFilter");
  const nameSelect = el("alchemyNameSelect");
  if (!nameSelect) return;

  const typeFilter = typeSelect?.value || "";
  const filtered = typeFilter
    ? data.alchemy.filter((c) => c.consumable_type === typeFilter)
    : data.alchemy;

  const names = [...new Set(filtered.map((c) => c.consumable_name))].sort();

  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );

  updateAlchemyTierOptions();
}

export function updateAlchemyTierOptions() {
  const typeSelect = el("alchemyTypeFilter");
  const nameSelect = el("alchemyNameSelect");
  const tierSelect = el("alchemyTierSelect");
  if (!nameSelect || !tierSelect) return;

  const typeFilter = typeSelect?.value || "";
  const name = nameSelect.value;

  const tiers = [
    ...new Set(
      data.alchemy
        .filter(
          (c) =>
            c.consumable_name === name &&
            (!typeFilter || c.consumable_type === typeFilter),
        )
        .map((c) => c.consumable_tier),
    ),
  ];

  populateSelect(
    tierSelect,
    tiers.map((t) => ({ value: t, label: t })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

function findEntry(consumableId, storedAt) {
  return selected.alchemy.find(
    (e) => e.consumable_id === consumableId && e.storedAt === storedAt,
  );
}

/** Merges with an existing entry for the same consumable_id + storedAt. */
export function addAlchemy(consumableId, quantity, storedAt = "backpack") {
  if (!consumableId || quantity <= 0) return;

  const existing = findEntry(consumableId, storedAt);
  if (existing) {
    existing.quantity += quantity;
  } else {
    selected.alchemy.push({
      id: generateInstanceId(),
      consumable_id: consumableId,
      quantity,
      storedAt,
    });
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Removes the entry if quantity reaches zero. */
export function updateAlchemyQuantity(consumableId, storedAt, quantity) {
  if (quantity <= 0) {
    selected.alchemy = selected.alchemy.filter(
      (e) => !(e.consumable_id === consumableId && e.storedAt === storedAt),
    );
  } else {
    const entry = findEntry(consumableId, storedAt);
    if (entry) entry.quantity = quantity;
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function removeAlchemy(consumableId, storedAt) {
  const before = structuredClone(selected.alchemy);
  selected.alchemy = selected.alchemy.filter(
    (e) => !(e.consumable_id === consumableId && e.storedAt === storedAt),
  );
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.alchemy = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

/** Merges into the destination if an entry already exists there — the destination row's
 * id wins and the source row's id is discarded on merge. */
export function moveAlchemy(consumableId, fromLocation, toLocation) {
  if (fromLocation === toLocation) return;

  const source = findEntry(consumableId, fromLocation);
  if (!source) return;

  const qty = source.quantity;

  selected.alchemy = selected.alchemy.filter(
    (e) => !(e.consumable_id === consumableId && e.storedAt === fromLocation),
  );

  const dest = findEntry(consumableId, toLocation);
  if (dest) {
    dest.quantity += qty;
  } else {
    selected.alchemy.push({
      id: source.id,
      consumable_id: consumableId,
      quantity: qty,
      storedAt: toLocation,
    });
  }

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

export function sendAlchemyToAlly(instanceId, destinationCharacterId, amount, storedAt = "backpack") {
  const before = structuredClone(selected.alchemy);

  const result = transferStackQuantity({
    sourceArray: selected.alchemy,
    instanceId,
    amount,
    destinationCharacterId,
    destinationInventoryKey: "alchemy",
    destinationStoredAt: storedAt,
    matchKeyFields: ["consumable_id"],
  });
  if (!result) return false;

  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    undoTransferStackQuantity({
      destinationCharacterId,
      destinationInventoryKey: "alchemy",
      destinationRowId: result.destinationRowId,
      amount: result.amount,
    });
    selected.alchemy = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  }, t("undo.sentMessage"));

  return true;
}
