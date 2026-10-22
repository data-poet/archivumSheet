// Shared drag-reorder for advantages/disadvantages/skills/spells — each keyed by id (spells by
// name), not an array, so order has to be tracked separately in selected.order[kind].
import { state } from "../state.js";

// Known ids first, in order; unknown/new ids appended in their current order. Keeps a stale or
// empty order array from ever dropping an id.
export function sortByOrder(ids, order = []) {
  const known = new Set(ids);
  const ordered = order.filter((id) => known.has(id));
  const seen = new Set(ordered);
  return [...ordered, ...ids.filter((id) => !seen.has(id))];
}

export function reorderTrait(kind, id, newIndex) {
  const { selected } = state;
  const ids = sortByOrder(
    Object.keys(selected[kind] ?? {}),
    selected.order?.[kind],
  );
  const fromIndex = ids.indexOf(id);
  if (fromIndex === -1) return;

  ids.splice(fromIndex, 1);
  ids.splice(newIndex, 0, id);
  selected.order = { ...selected.order, [kind]: ids };
}
