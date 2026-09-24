// Roster and overlay data layer for the allies page. Reads/writes the same localStorage
// record store/characters.js owns, but only through characterStoreCore.js's raw primitives —
// this file must never import store/characters.js (see tests/dev/allies/main.test.js's guard):
// characters.js's saveActiveCharacter()/loadCharacter() rebuild state from the sheet page's own
// DOM, which doesn't exist on the allies page, and reaching that pipeline risks silently
// overwriting the active character with a blank sheet.
//
// A roster entry is `{ _instanceId, ally_id, overrides }`, never an embedded payload — this
// keeps a later "local ally store" migration a two-function change (resolveAlly/isRepoAlly)
// instead of a data migration.

import { loadStore, saveStore, generateId } from "../characterStoreCore.js";
import { getAlly as getRepoAlly, isRepoAlly } from "../../allies/catalog.js";
import { applyOverlay } from "../../allies/overlay.js";
import { ENTRY_KINDS } from "../../shared/constants.js";

function _activeEntry(store) {
  return store?.list.find((c) => c.id === store.activeId) ?? null;
}

function _roster(entry) {
  return entry?.data?.character?.allies ?? [];
}

// Reads and writes go through this pair so every mutator agrees on where the roster lives
// (`entry.data.character.allies`) without each function re-deriving the path.
function _mutateActiveEntry(mutate) {
  const store = loadStore();
  const entry = _activeEntry(store);
  if (!entry) return;

  if (!entry.data.character) entry.data.character = {};
  mutate(entry, store);
  saveStore(store);
}

export function getActiveCharacterDisplay() {
  const entry = _activeEntry(loadStore());
  if (!entry) return { name: "", kind: ENTRY_KINDS.CHARACTER };

  return {
    name: entry.name ?? "",
    kind: entry.kind === ENTRY_KINDS.ALLY ? ENTRY_KINDS.ALLY : ENTRY_KINDS.CHARACTER,
  };
}

export function getRoster() {
  return _roster(_activeEntry(loadStore()));
}

// Only real characters can carry a roster (an ally has no roster of its own — see
// pageSelector.js's page-hiding for the other half of that rule), so this is the allies
// page's whole "switch which character I'm viewing" list.
export function listSwitchableCharacters() {
  const store = loadStore();
  return (store?.list ?? [])
    .filter((c) => c.kind !== ENTRY_KINDS.ALLY)
    .map((c) => ({ id: c.id, name: c.name ?? "" }));
}

// Repo additions only — a local ally joins the roster by being linked to the character
// instead (see store/characters.js's linkAllyToCharacter).
export function addRosterEntry(ally_id) {
  if (!isRepoAlly(ally_id)) return null;

  const instanceId = generateId("ai");
  _mutateActiveEntry((entry) => {
    entry.data.character.allies = [
      ..._roster(entry),
      { _instanceId: instanceId, ally_id, overrides: {} },
    ];
  });
  return instanceId;
}

export function removeRosterEntry(instanceId) {
  _mutateActiveEntry((entry) => {
    entry.data.character.allies = _roster(entry).filter(
      (e) => e._instanceId !== instanceId,
    );
    if (entry.data.character.alliesActiveId === instanceId) {
      entry.data.character.alliesActiveId = null;
    }
  });
}

// A forked local ally (kind: "ally") can be deleted straight from the sheet's own character
// selector, which has no notion of roster entries pointing at it (store/characters.js never
// imports store/allies.js). Called on the allies page's bootstrap to drop any roster entry
// left pointing at a local id that no longer exists, so a deleted ally doesn't linger as a
// dead selection.
export function pruneOrphanedAllies() {
  _mutateActiveEntry((entry, store) => {
    const roster = _roster(entry);
    const live = roster.filter(
      (e) => isRepoAlly(e.ally_id) || store.list.some((c) => c.id === e.ally_id),
    );
    if (live.length === roster.length) return;

    entry.data.character.allies = live;
    if (!live.some((e) => e._instanceId === entry.data.character.alliesActiveId)) {
      entry.data.character.alliesActiveId = null;
    }
  });
}

export function getActiveAllyInstanceId() {
  return _activeEntry(loadStore())?.data?.character?.alliesActiveId ?? null;
}

export function setActiveAllyInstanceId(instanceId) {
  _mutateActiveEntry((entry) => {
    entry.data.character.alliesActiveId = instanceId ?? null;
  });
}

function _setPath(target, path, value) {
  const keys = Array.isArray(path) ? path : String(path).split(".");
  let cursor = target;
  keys.slice(0, -1).forEach((key) => {
    cursor[key] = { ...(cursor[key] ?? {}) };
    cursor = cursor[key];
  });
  cursor[keys[keys.length - 1]] = value;
  return target;
}

// Repo allies only — a local ally's roster entry has no `overrides`, its record is edited
// directly.
export function patchOverride(instanceId, path, value) {
  _mutateActiveEntry((entry) => {
    entry.data.character.allies = _roster(entry).map((e) => {
      if (e._instanceId !== instanceId || !isRepoAlly(e.ally_id)) return e;
      return { ...e, overrides: _setPath({ ...e.overrides }, path, value) };
    });
  });
}

// Repo ids resolve through the fetch cache in allies/catalog.js; local ids are another
// character-store entry (kind: "ally"), read straight from this same store.
export function resolveAlly(ally_id) {
  if (isRepoAlly(ally_id)) return getRepoAlly(ally_id);

  const store = loadStore();
  const entry = store?.list.find((c) => c.id === ally_id);
  return Promise.resolve(entry ? { ally_id, ...entry.data } : null);
}

// Bakes a repo ally's catalog values + overlay into a new local `kind: "ally"` entry, so
// editing it in the real character editor never touches the shared catalog file. The roster
// entry is rewritten in place to point at the new local id, with `overrides` dropped — the
// overlay is now baked into the entry itself.
export async function forkAllyToLocal(instanceId) {
  const store = loadStore();
  const entry = _activeEntry(store);
  const roster = _roster(entry).find((e) => e._instanceId === instanceId);
  if (!roster || !isRepoAlly(roster.ally_id)) return null;

  const resolved = await resolveAlly(roster.ally_id);
  const overlaid = applyOverlay(resolved, roster.overrides);
  if (!overlaid) return null;

  const { version, pc, race, character, inventory } = overlaid;
  const localId = generateId("c");

  _mutateActiveEntry((activeEntry, activeStore) => {
    activeStore.list.push({
      id: localId,
      name: pc?.character_name ?? "",
      race: race?.race_sub_name || race?.race_name || "",
      kind: ENTRY_KINDS.ALLY,
      data: { version, pc, race, character, inventory },
    });

    activeEntry.data.character.allies = _roster(activeEntry).map((e) =>
      e._instanceId === instanceId
        ? { _instanceId: instanceId, ally_id: localId }
        : e,
    );
  });

  return localId;
}
