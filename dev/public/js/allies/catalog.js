// The single resolution point for allies: everything else asks here rather than fetching, so adding user-authored
// allies later means teaching these two functions about a second source, not touching every call site.
// IDs are namespaced by source (repo allies `ALLY_*`, user-created `ally-<ts>-<rand>` from store/characters.js),
// which keeps a merged list collision-free and tells read-only from editable by id alone.

import { fetchAllyIndex, fetchAlly } from "../api.js";

const REPO_ID_PATTERN = /^ALLY_/;

const _fullAllies = new Map();
let _index = null;

export function isRepoAlly(allyId) {
  return REPO_ID_PATTERN.test(allyId ?? "");
}

// Read-only for now: a repo ally is shipped in git, so the player can't change its sheet.
// Only its overlay (see the allies store) is editable.
export function isEditableAlly(allyId) {
  return !isRepoAlly(allyId);
}

export async function listAllies({ refresh = false } = {}) {
  if (_index && !refresh) return _index;

  _index = await fetchAllyIndex();
  return _index;
}

// Full payloads are cached because a catalog ally is immutable within a session; the
// player's edits live in the overlay, never in the payload this returns.
export async function getAlly(allyId) {
  if (!allyId) return null;
  if (_fullAllies.has(allyId)) return _fullAllies.get(allyId);

  const ally = await fetchAlly(allyId);
  _fullAllies.set(allyId, ally);
  return ally;
}

export function clearAllyCache() {
  _fullAllies.clear();
  _index = null;
}
