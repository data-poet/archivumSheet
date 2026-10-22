// Drag-to-reorder/move for inventory storage lists. A thin wrapper so every call site shares the
// same defaults instead of re-typing them, and so tests can inject a fake Sortable instead of the
// real library (jsdom has no pointer/drag events for it to attach to).
import RealSortable from "../../vendor/sortable/sortable.esm.js";

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

  return Sortable.create(container, {
    ...DEFAULTS,
    group,
    onEnd(evt) {
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
