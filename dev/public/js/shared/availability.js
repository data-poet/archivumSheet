// Who a catalog row may be picked by.
//
// Ally-only content (an elemental's race, a construct's innate traits) lives in the same
// data/db_*.csv tables as everything else, marked with an `available_for` column. One table per
// domain is not a convenience — 17 engine resolvers each load their own CSV and match by id, so a
// parallel db_ally_*.csv would mean teaching all 17 about a second source, and getting it wrong
// fails silently (the id resolves to nothing and the trait just never appears on the built sheet).
//
// An extra column costs the engine nothing: loadCSV passes `columns: true`, so unknown columns are
// ignored, and resolution is by id regardless. Availability is purely an authoring-UI concern.
//
// THE ENGINE MUST NEVER FILTER ON THIS. An ally's ally-only content has to resolve at build time;
// only the pickers care who may choose it.

export const AUDIENCE = { PLAYER: "pc", ALLY: "npc" };

export const AVAILABLE_FOR_COLUMN = "available_for";

// Blank means "both", so none of the existing rows need editing and new content is opt-in marked.
// An unrecognized value is also treated as both: showing a row that should have been hidden is a
// visible, fixable mistake, while hiding one that should have shown is the silent failure this
// whole design is trying to avoid.
export function isAvailableFor(row, audience) {
  const raw = row?.[AVAILABLE_FOR_COLUMN];
  if (raw === undefined || raw === null) return true;

  const declared = String(raw)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

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

// Two facts about the data, both recorded as rows stream past the transport filter.
//
// `_marked` answers "would a different audience see a different catalog at all?" — false while
// no CSV declares available_for, which is what lets a kind change skip its reload today.
// It is not the same as "something was dropped": an ally-only row is invisible to the player
// audience but would still change what the ally audience sees.
//
// `_dropped` is the backstop's raw material: a character must not keep content its audience
// cannot pick, and the filter is the only place that ever saw both sets.
let _marked = false;
const _dropped = new Map();

export function availableFor(rows, audience, { record = false } = {}) {
  if (!Array.isArray(rows)) return rows;

  return rows.filter((row) => {
    const allowed = isAvailableFor(row, audience);

    if (record) {
      const raw = row?.[AVAILABLE_FOR_COLUMN];
      if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
        _marked = true;
      }
      if (!allowed) {
        const id = _idOf(row);
        if (id) _dropped.set(id, row);
      }
    }

    return allowed;
  });
}

// True once any catalog row declares an availability, i.e. once the audiences can diverge.
export function audienceAffectsCatalogs() {
  return _marked;
}

export function getDroppedIds() {
  return new Set(_dropped.keys());
}

export function getDroppedRow(id) {
  return _dropped.get(id) ?? null;
}

export function resetAudienceRecord() {
  _marked = false;
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
