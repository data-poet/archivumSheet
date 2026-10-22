// Drag-to-reorder/move for inventory storage lists. A thin wrapper so every call site shares the
// same defaults instead of re-typing them, and so tests can inject a fake Sortable instead of the
// real library (jsdom has no pointer/drag events for it to attach to).
import RealSortable from "../../vendor/sortable/sortable.esm.js";
import { el } from "./dom.js";
import { STORAGE_LOCATIONS } from "./constants.js";

// handle-only (never the whole row) so tapping a select/button inside a row doesn't start a drag;
// delay + delayOnTouchOnly stop a scroll gesture on a phone from being mistaken for a drag.
const DEFAULTS = {
  handle: ".drag-handle",
  dataIdAttr: "data-instance-id",
  animation: 150,
  delay: 150,
  delayOnTouchOnly: true,
};

// `from`/`to` are each list's own container (one per storage location), given a `data-stored-at`
// attribute by the caller — that's what tells a cross-location move apart from a same-location
// reorder. `changed: false` on a same-location drop means nothing persisted; the caller decides
// whether that's worth acting on (today: no type reorders within one location, so it's a no-op
// and the next render puts the row back in array order).
export function createSortableList(
  container,
  { group, onDrop } = {},
  Sortable = RealSortable,
) {
  if (!container) return null;

  // Sortable only drags the bound row, leaving its detail-row/magazine-row siblings stranded.
  // Captured at drag-start and re-attached after the row's new position at drag-end.
  let trailingSiblings = [];

  return Sortable.create(container, {
    ...DEFAULTS,
    group,
    onStart(evt) {
      trailingSiblings = [];
      let sibling = evt.item.nextElementSibling;
      while (
        sibling &&
        (sibling.classList.contains("detail-row") ||
          sibling.classList.contains("magazine-row"))
      ) {
        trailingSiblings.push(sibling);
        sibling = sibling.nextElementSibling;
      }
    },
    onEnd(evt) {
      let anchor = evt.item;
      trailingSiblings.forEach((row) => {
        anchor.after(row);
        anchor = row;
      });
      trailingSiblings = [];

      const instanceId = evt.item?.dataset?.instanceId;
      const toLocation = evt.to?.dataset?.storedAt;
      const fromLocation = evt.from?.dataset?.storedAt;
      if (!instanceId || !toLocation) return;

      onDrop?.({
        instanceId,
        fromLocation,
        toLocation,
        changed: toLocation !== fromLocation,
      });
    },
  });
}

// Containers are morphed in place (shared/morph.js) and keep their id/node identity across
// re-renders, so binding Sortable again on every render would stack duplicate instances on the
// same node. The `data-sortable-bound` flag makes (re)attaching idempotent.
export function attachSortableOnce(
  container,
  options,
  Sortable = RealSortable,
) {
  if (!container || container.dataset.sortableBound === "true") return null;
  container.dataset.sortableBound = "true";
  return createSortableList(container, options, Sortable);
}

// Same idempotency guard as attachSortableOnce, for createReorderableList.
export function attachReorderableOnce(
  container,
  options,
  Sortable = RealSortable,
) {
  if (!container || container.dataset.sortableBound === "true") return null;
  container.dataset.sortableBound = "true";
  return createReorderableList(container, options, Sortable);
}

// A plain reorder-within-one-list wrapper — no storage-location concept, just "this item moved to
// this index". `canSwap(dragged, related)` is an optional guard (Sortable's `onMove`) for lists
// that mix unrelated groups of rows, like the character selector's owners and each owner's own
// indented allies: it returns false to reject a drop, letting the caller keep an ally from landing
// under a different PC without a second Sortable `group`. `onReorder(item)` fires after the drop
// with the moved element itself — the caller reads whatever context it needs off its dataset.
export function createReorderableList(
  container,
  { canSwap, onReorder } = {},
  Sortable = RealSortable,
) {
  if (!container) return null;

  return Sortable.create(container, {
    ...DEFAULTS,
    onMove: canSwap ? (evt) => canSwap(evt.dragged, evt.related) : undefined,
    onEnd(evt) {
      onReorder?.(evt.item);
    },
  });
}

// One Sortable instance per storage location's <tbody> (`${idPrefix}-tbody-${location}`, the id
// every storage render.js now gives it), scoped by `group` so an item can't drop into another
// type's table. A same-location drop is a no-op: moveFn only changes storedAt, nothing persists a
// finer position yet, so the row returns to array order on the next render.
//
// moveFn is called as (instanceId, toLocation, fromLocation): every equipped-item type's
// moveX(instanceId, storedAt) only needs the first two and ignores the third. Stackable types
// (alchemy, custom items, survival gear, coins, ammo — createStackableInventory's move(itemId,
// fromLocation, toLocation)) need fromLocation too, since the same item id can have a separate
// stack in more than one location at once; their events.js passes a small adapter lambda instead
// of the bare model function.
export function createStorageDragHandler({
  idPrefix,
  group,
  moveFn,
  locations = STORAGE_LOCATIONS,
  Sortable = RealSortable,
}) {
  return function attachStorageSortable() {
    locations.forEach((location) => {
      attachSortableOnce(
        el(`${idPrefix}-tbody-${location}`),
        {
          group,
          onDrop: ({ instanceId, toLocation, fromLocation, changed }) => {
            if (!changed) return;
            moveFn(instanceId, toLocation, fromLocation);
          },
        },
        Sortable,
      );
    });
  };
}
