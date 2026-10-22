// How allies attach to a PC: roster ownership, link/unlink, forking a fresh local ally from
// the repo catalog, and the import/export bundling that carries a linked ally's own sheet
// alongside its owner's. characters.js owns a single character's lifecycle; this module owns
// the relationship between one and its roster.

import { ENTRY_KINDS } from "../../shared/constants.js";
import { generateId, kindOf, saveStore } from "../characterStoreCore.js";
import { getStore } from "../characters.js";
import { getAlly } from "../../allies/catalog.js";
import { tierLabel } from "../../allies/tier.js";

function _save(store) {
  saveStore(store);
}

// Scans every entry's roster for one pointing at allyId and returns its owner's id, or null if
// no live entry currently claims it (orphaned, or never linked). This is the single mechanism
// behind both forked-ally nesting (listCharactersGrouped) and the linking API below — there
// is deliberately no separate `linkedCharacterId` field, since the roster entry itself already
// encodes the link and a second field could drift out of sync with it.
function _ownerIdOf(list, allyId) {
  for (const entry of list) {
    if (
      (entry?.data?.character?.allies ?? []).some((r) => r.ally_id === allyId)
    ) {
      return entry.id;
    }
  }
  return null;
}

// Same entries as listCharacters(), with each forked local ally nested right after the PC whose
// roster references it (indented: true), in that roster's own order — not list order, so dragging
// an ally within its roster (reorderAllyInRoster) changes what's shown here. An orphaned ally
// keeps its own place, un-indented. `ownerId` (own id for owners, owner's id for allies) is what
// the selector's drag-reorder uses to stop an ally from being dropped under a different PC.
export function listCharactersGrouped() {
  const list = getStore().list;
  const byId = new Map(list.map((entry) => [entry.id, entry]));

  const toRow = (entry, indented, ownerId) => ({
    id: entry.id,
    name: entry.name,
    race: entry.race,
    kind: kindOf(entry),
    indented,
    ownerId,
  });

  const childrenOf = new Map();
  const owned = new Set();
  for (const entry of list) {
    const children = (entry?.data?.character?.allies ?? [])
      .map((roster) => byId.get(roster.ally_id))
      .filter((child) => child && kindOf(child) === ENTRY_KINDS.ALLY);
    if (children.length === 0) continue;

    childrenOf.set(entry.id, children);
    children.forEach((child) => owned.add(child.id));
  }

  const result = [];
  for (const entry of list) {
    if (owned.has(entry.id)) continue;

    result.push(toRow(entry, false, entry.id));
    for (const child of childrenOf.get(entry.id) ?? []) {
      result.push(toRow(child, true, entry.id));
    }
  }
  return result;
}

// Repositions id among the store's top-level entries, rebuilding `list` so each owner stays
// immediately followed by its own roster. Drag reorder for the selector's top-level rows.
export function reorderCharacter(id, newIndex) {
  const store = getStore();
  const grouped = listCharactersGrouped();
  const topLevelIds = grouped.filter((c) => !c.indented).map((c) => c.id);
  const fromIndex = topLevelIds.indexOf(id);
  if (fromIndex === -1) return;

  topLevelIds.splice(fromIndex, 1);
  topLevelIds.splice(newIndex, 0, id);

  const byId = new Map(store.list.map((entry) => [entry.id, entry]));
  const rebuilt = [];
  for (const topId of topLevelIds) {
    const entry = byId.get(topId);
    if (!entry) continue;
    rebuilt.push(entry);
    for (const roster of entry.data?.character?.allies ?? []) {
      const child = byId.get(roster.ally_id);
      if (child) rebuilt.push(child);
    }
  }
  // Anything missed is appended, so nothing is lost.
  for (const entry of store.list) {
    if (!rebuilt.includes(entry)) rebuilt.push(entry);
  }

  store.list = rebuilt;
  _save(store);
}

// Repositions allyId within ownerId's own roster array. Drag reorder for the selector's indented rows.
export function reorderAllyInRoster(ownerId, allyId, newIndex) {
  const store = getStore();
  const owner = store.list.find((c) => c.id === ownerId);
  if (!owner) return;

  const roster = owner.data?.character?.allies ?? [];
  const fromIndex = roster.findIndex((r) => r.ally_id === allyId);
  if (fromIndex === -1) return;

  const [moved] = roster.splice(fromIndex, 1);
  roster.splice(newIndex, 0, moved);

  _save(store);
}

// Returns the id of whichever character's roster currently references allyEntryId, or null.
export function getAllyOwnerId(allyEntryId) {
  return _ownerIdOf(getStore().list, allyEntryId);
}

// Removes allyEntryId's roster entry from whichever character currently owns it, if any. The
// underlying ally entry is never touched — this is the "orphan" case: the ally survives as a
// standalone draft, just unowned.
export function unlinkAlly(allyEntryId) {
  const store = getStore();
  const owner = store.list.find(
    (c) => c.id === _ownerIdOf(store.list, allyEntryId),
  );
  if (!owner) return;

  const roster = owner.data.character.allies ?? [];
  const removed = roster.find((r) => r.ally_id === allyEntryId);
  owner.data.character.allies = roster.filter((r) => r.ally_id !== allyEntryId);
  if (removed && owner.data.character.alliesActiveId === removed.id) {
    owner.data.character.alliesActiveId = null;
  }

  _save(store);
}

// Links a standalone local ally draft to a character by pushing an ordinary roster entry — this
// is what listCharactersGrouped()'s roster scan then picks up for nesting, with no separate
// wiring needed. Refuses linking when the target is itself an ally — no allies-of-allies.
export function linkAllyToCharacter(allyEntryId, characterId) {
  const store = getStore();
  const allyEntry = store.list.find((c) => c.id === allyEntryId);
  const target = store.list.find((c) => c.id === characterId);
  if (!allyEntry || kindOf(allyEntry) !== ENTRY_KINDS.ALLY) return;
  if (!target || kindOf(target) === ENTRY_KINDS.ALLY) return;

  unlinkAlly(allyEntryId);

  const freshStore = getStore();
  const freshTarget = freshStore.list.find((c) => c.id === characterId);
  if (!freshTarget) return;

  if (!freshTarget.data.character) freshTarget.data.character = {};
  freshTarget.data.character.allies = [
    ...(freshTarget.data.character.allies ?? []),
    { id: generateId("ai"), ally_id: allyEntryId, overrides: {} },
  ];

  _save(freshStore);
}

// Bakes a fresh repo-catalog ally straight into a new local `kind: "ally"` entry and links it
// under ownerCharacterId in one step — the character editor's "Adicionar aliado" entry point.
// No overlay to apply here: this is a brand new fork with no prior overrides to carry over.
export async function forkAndLinkAllyToCharacter(allyId, ownerCharacterId) {
  const resolved = await getAlly(allyId);
  if (!resolved) return null;

  const { version, pc, race, character, inventory } = resolved;
  const localId = generateId("c");

  // A catalog file with no character_name (e.g. a size-tiered elemental) carries its label in
  // the id itself (see allies/tier.js), which the fork loses — bake it in now, the only point
  // that still has allyId, or it has nowhere left to come from once this is an ordinary local ally.
  const pcWithTier = pc?.character_name
    ? pc
    : { ...pc, tier_label: tierLabel(resolved) };

  const store = getStore();
  store.list.push({
    id: localId,
    name: pc?.character_name ?? "",
    race: race?.race_sub_name || race?.race_name || "",
    kind: ENTRY_KINDS.ALLY,
    data: { version, pc: pcWithTier, race, character, inventory },
  });
  _save(store);

  linkAllyToCharacter(localId, ownerCharacterId);

  return localId;
}

// Roster entries on characterId whose ally_id resolves to a local (kind: "ally") entry still
// present in the store — repo-catalog entries (ALLY_*) are excluded, they need no export bundling
// since they resolve from the shipped catalog on any machine.
export function getLinkedAllies(characterId) {
  const store = getStore();
  const owner = store.list.find((c) => c.id === characterId);
  const roster = owner?.data?.character?.allies ?? [];
  return roster.filter((r) =>
    store.list.some(
      (c) => c.id === r.ally_id && kindOf(c) === ENTRY_KINDS.ALLY,
    ),
  );
}

// Import-side counterpart to getLinkedAllies()/exportSheet()'s `linked_allies` bundling: recreates
// a local ally entry per bundled ally under a fresh id (ids are only ever unique within one
// machine's store) and rewrites characterId's roster to point at the new id instead of the old one.
export function recreateLinkedAllies(linkedAllies, characterId) {
  if (!linkedAllies) return;

  const store = getStore();
  const target = store.list.find((c) => c.id === characterId);
  if (!target) return;

  const idMap = new Map();
  for (const [oldAllyId, allyData] of Object.entries(linkedAllies)) {
    const newId = generateId("c");
    idMap.set(oldAllyId, newId);
    store.list.push({
      id: newId,
      name: allyData?.pc?.character_name ?? "",
      race: allyData?.race?.race_sub_name || allyData?.race?.race_name || "",
      kind: ENTRY_KINDS.ALLY,
      data: allyData,
    });
  }

  target.data.character.allies = (target.data.character.allies ?? []).map(
    (r) => (idMap.has(r.ally_id) ? { ...r, ally_id: idMap.get(r.ally_id) } : r),
  );

  _save(store);
}
