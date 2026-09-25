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
    if ((entry?.data?.character?.allies ?? []).some((r) => r.ally_id === allyId)) {
      return entry.id;
    }
  }
  return null;
}

// Same entries as listCharacters(), reordered so a forked local ally (kind: "ally") sits
// right after the PC whose roster still references it (indented: true), for the selector to
// visually group them. Ownership is derived from each PC's own roster ally_id, since forked
// allies don't record their origin on themselves. An ally with no PC pointing at it anymore
// (removed from the roster but never deleted, see unlinkAlly below) just
// keeps its own place in list order, un-indented.
export function listCharactersGrouped() {
  const list = getStore().list;

  const ownerIdOf = new Map();
  for (const entry of list) {
    for (const roster of entry?.data?.character?.allies ?? []) {
      ownerIdOf.set(roster.ally_id, entry.id);
    }
  }

  const idsInStore = new Set(list.map((entry) => entry.id));
  const childrenOf = new Map();
  for (const entry of list) {
    if (kindOf(entry) !== ENTRY_KINDS.ALLY) continue;
    const ownerId = ownerIdOf.get(entry.id);
    if (ownerId && idsInStore.has(ownerId)) {
      if (!childrenOf.has(ownerId)) childrenOf.set(ownerId, []);
      childrenOf.get(ownerId).push(entry);
    }
  }

  const toRow = (entry, indented) => ({
    id: entry.id,
    name: entry.name,
    race: entry.race,
    kind: kindOf(entry),
    indented,
  });

  const owned = new Set([...childrenOf.values()].flat().map((entry) => entry.id));
  const result = [];
  for (const entry of list) {
    if (owned.has(entry.id)) continue;

    result.push(toRow(entry, false));
    for (const child of childrenOf.get(entry.id) ?? []) {
      result.push(toRow(child, true));
    }
  }
  return result;
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
  if (removed && owner.data.character.alliesActiveId === removed._instanceId) {
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
    { _instanceId: generateId("ai"), ally_id: allyEntryId, overrides: {} },
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
    store.list.some((c) => c.id === r.ally_id && kindOf(c) === ENTRY_KINDS.ALLY),
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

  target.data.character.allies = (target.data.character.allies ?? []).map((r) =>
    idMap.has(r.ally_id) ? { ...r, ally_id: idMap.get(r.ally_id) } : r,
  );

  _save(store);
}
