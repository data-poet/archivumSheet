// Roster read/edit primitives shared by the character editor's ally-edit mode
// (allyEditTarget.js). Reads/writes go through characterStoreCore.js's raw primitives — see
// store/characters.js for the roster-mutation entry points used elsewhere (linkAllyToCharacter,
// forkAndLinkAllyToCharacter, ...).
//
// A roster entry is `{ _instanceId, ally_id, overrides }`, never an embedded payload — this
// keeps a later "local ally store" migration a two-function change (resolveAlly/isRepoAlly)
// instead of a data migration.

import { loadStore, saveStore } from "../characterStoreCore.js";
import { isRepoAlly } from "../../allies/catalog.js";

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

export function getRoster() {
  return _roster(_activeEntry(loadStore()));
}

export function getActiveAllyInstanceId() {
  return _activeEntry(loadStore())?.data?.character?.alliesActiveId ?? null;
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
