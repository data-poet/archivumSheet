// The single resolution point for allies. Everything else in the allies feature asks
// here rather than fetching, which is what keeps the planned migration cheap: today only
// the repo catalog (data/allies/) answers, and adding user-authored allies later means
// teaching these two functions about a second source — not touching every call site.
//
// IDs are namespaced by source from the start: repo allies are `ALLY-*`, user-created
// ones will use the `ally-<ts>-<rand>` form that store/characters.js already generates.
// That keeps a merged list collision-free and lets callers tell read-only from editable
// by looking at the id alone.

import { fetchAllyIndex, fetchAlly } from "../api.js";

const REPO_ID_PATTERN = /^ALLY-/;

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
