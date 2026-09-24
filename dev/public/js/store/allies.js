// Roster and overlay data layer for the allies page. Reads/writes the same localStorage
// record store/characters.js owns, but only through characterStoreCore.js's raw primitives —
// this file must never import store/characters.js (see tests/dev/allies/main.test.js's guard):
// characters.js's saveActiveCharacter()/loadCharacter() rebuild state from the sheet page's own
// DOM, which doesn't exist on the allies page, and reaching that pipeline risks silently
// overwriting the active character with a blank sheet.
//
// A roster entry is `{ _instanceId, ally_id, overrides }`, never an embedded payload (decision
// #15 in ALLIES_FEATURE.md) — this keeps a later "local ally store" migration a two-function
// change (resolveAlly/isRepoAlly) instead of a data migration.

import { loadStore, saveStore, generateId } from "./characterStoreCore.js";
import { getAlly as getRepoAlly, isRepoAlly } from "../allies/catalog.js";
import { ENTRY_KINDS } from "../shared/constants.js";

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

// Repo additions only — a local ally joins the roster by being linked to the character
// (out of scope for this batch; see ALLIES_FEATURE.md Part B).
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
// directly (decision #20 in ALLIES_FEATURE.md).
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
