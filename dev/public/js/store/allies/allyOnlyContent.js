// Finds ally-only content held by the sheet that is currently being edited.
//
// Nothing breaks technically if a character keeps an ally-only advantage — the engine resolves
// it by id like any other. It is a rules violation, not a bug, so this reports rather than
// blocks. It exists because the player audience discards those rows on arrival, which leaves the
// sheet unable to tell an ally-only id from a nonexistent one; shared/availability.js records
// what it dropped precisely so this check is possible.

import { state } from "../../state.js";
import { getDroppedIds, getDroppedRow } from "../../shared/availability.js";

// Every id the sheet references, whatever collection it lives in.
function _selectedIds() {
  const { selected } = state;
  const ids = [
    ...Object.keys(selected.advantages ?? {}),
    ...Object.keys(selected.disadvantages ?? {}),
    ...Object.keys(selected.skills ?? {}),
    ...Object.keys(selected.spells ?? {}),
  ];

  if (selected.character?.race_id) ids.push(selected.character.race_id);

  const itemLists = [
    selected.armors,
    selected.shields,
    selected.melee_weapons,
    selected.ranged_weapons,
    selected.firearms,
    selected.ammo_containers,
    selected.loose_ammo,
    selected.alchemy,
    selected.survivalGear,
    selected.accessories,
    selected.magicGear,
  ];

  itemLists.forEach((list) => {
    (list ?? []).forEach((entry) => {
      Object.entries(entry ?? {}).forEach(([key, value]) => {
        if (key.endsWith("_id") && typeof value === "string") ids.push(value);
      });
    });
  });

  return ids;
}

// A row's display name is whatever `<domain>_name` it carries; falls back to the bare id.
function _labelOf(id) {
  const row = getDroppedRow(id);
  if (!row) return id;

  const key = Object.keys(row).find(
    (k) => k.endsWith("_name") && !k.endsWith("_box_name"),
  );
  return key ? row[key] : id;
}

export function findAllyOnlyContent() {
  const dropped = getDroppedIds();
  if (dropped.size === 0) return [];

  const seen = new Set();

  return _selectedIds()
    .filter((id) => dropped.has(id) && !seen.has(id) && seen.add(id))
    .map((id) => ({ id, label: _labelOf(id) }));
}
