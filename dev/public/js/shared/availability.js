import { toList } from "./rowParsers.js";

// Who a catalog row may be picked by. Ally-only content lives in the same data/db_*.csv tables, marked by an
// `available_for` column: 17 engine resolvers each load their own CSV by id, so a parallel table would mean teaching
// all of them a second source, and a miss fails silently.
// THE ENGINE MUST NEVER FILTER ON THIS: ally-only content has to resolve at build time; only the pickers care.

export const AUDIENCE = { PLAYER: "pc", ALLY: "npc" };

export const AVAILABLE_FOR_COLUMN = "available_for";

// Blank, or an unrecognized value, means "both": showing a row that should be hidden is a visible, fixable mistake,
// while hiding one that should show fails silently.
export function isAvailableFor(row, audience) {
  const raw = row?.[AVAILABLE_FOR_COLUMN];
  if (raw === undefined || raw === null) return true;

  const declared = toList(raw).map((value) => value.toLowerCase());

  if (declared.length === 0) return true;

  const known = declared.filter((value) =>
    Object.values(AUDIENCE).includes(value),
  );
  if (known.length === 0) return true;

  return known.includes(audience);
}

// Every catalog row's id column is `<domain>_id` (advantage_id, race_id, ...).
function _idOf(row) {
  const key = Object.keys(row ?? {}).find((k) => k.endsWith("_id"));
  return key ? row[key] : null;
}

// The backstop's raw material: a character must not keep content its audience cannot pick, and
// the transport filter is the only place that ever saw both sets.
const _dropped = new Map();

export function availableFor(rows, audience, { record = false } = {}) {
  if (!Array.isArray(rows)) return rows;

  return rows.filter((row) => {
    const allowed = isAvailableFor(row, audience);

    if (record && !allowed) {
      const id = _idOf(row);
      if (id) _dropped.set(id, row);
    }

    return allowed;
  });
}

export function getDroppedIds() {
  return new Set(_dropped.keys());
}

export function getDroppedRow(id) {
  return _dropped.get(id) ?? null;
}

export function resetAudienceRecord() {
  _dropped.clear();
}

// A page declares its audience once, before any catalog is fetched, and api.js applies it as the
// rows arrive. That single choke point is the whole point: each load*() assigns its catalog and
// builds its own add-form selectors in the same breath, so filtering afterwards would leave ~14
// dropdowns populated from unfiltered rows — invisible until someone spotted an elemental in the
// race list.
//
// Unset means no filtering, which is what ally rendering wants: it needs every row to resolve
// names for display, including ally-only ones. An "author an ally" mode would set ALLY here.
let _audience = null;

export function setCatalogAudience(audience) {
  _audience = audience ?? null;
}

export function getCatalogAudience() {
  return _audience;
}
