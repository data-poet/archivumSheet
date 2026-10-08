// "data" below is the shape store/persistedSheet.js produces, which the export file uses too —
// that is what keeps autosave and import/export compatible.

import { state } from "../state.js";
import { capturePersistedSheet, SCHEMA_VERSION } from "./persistedSheet.js";
import { ENTRY_KINDS } from "../shared/constants.js";
import { renderListsPreserving } from "../ui.js";
import { triggerAutoRun } from "../compute/autorun.js";
import { ensureInstanceIds } from "./instanceId.js";
import { restoreRaceSelection } from "../engine/character/races/model.js";
import { renderCharacterImage, renderResumeImage } from "../engine/character/portrait/portrait.js";
import { generateId, loadStore, saveStore, kindOf } from "./characterStoreCore.js";

function _generateId() {
  return generateId("c");
}

function _load() {
  return loadStore();
}

function _save(store) {
  saveStore(store);
}

function _blankData() {
  return {
    version: SCHEMA_VERSION,
    pc: {
      player_name: "",
      character_name: "",
      character_sex: "",
      character_age: null,
      character_weight: null,
      race_id: null,
      starting_points: null,
      experience_points: null,
      ability_points: null,
      magic_points: null,
      image: {
        uploaded:    false,
        data:        "",
        background:  "",
        color:       { r: "", g: "", b: "" },
        orientation: "",
        position:    { x: "", y: "" },
        size:        { width: "", height: "" },
        scale:       "",
      },
    },
    race: {},
    character: {
      primary: { ST: { base_value: 10, modifier: 0 }, DX: { base_value: 10, modifier: 0 }, IQ: { base_value: 10, modifier: 0 }, HT: { base_value: 10, modifier: 0 } },
      secondary: {},
      damage: {},
      resistances: {},
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {},
      allies: [],
      alliesActiveId: null,
      meta_race_ids: [],
    },
    inventory: {
      weight: 0,
      armors: [],
      shields: [],
      melee_weapons: [],
      ranged_weapons: [],
      firearms: [],
      ammo_containers: [],
      loose_ammo: [],
      alchemy: [],
      survivalGear: [],
      accessories: [],
      magicGear: [],
      customInventory: [],
      coins: [],
    },
  };
}

function _blankCharacter(name, kind = ENTRY_KINDS.CHARACTER) {
  const id = _generateId();
  return { id, name, race: "", kind, data: _blankData() };
}

function _initStore(firstCharName) {
  const first = _blankCharacter(firstCharName);
  const store = { activeId: first.id, list: [first] };
  _save(store);
  return store;
}

// Mirrors _applyImport in persistence.js.
function _applyData(data) {
  if (!data) return;
  const { selected } = state;
  const { pc = {}, race = {}, character = {}, inventory = {} } = data;

  selected.character = {
    player_name:       pc.player_name       ?? "",
    character_name:    pc.character_name    ?? "",
    character_sex:     pc.character_sex     ?? "",
    character_age:     pc.character_age     ?? null,
    character_weight:  pc.character_weight  ?? null,
    race_id:           race.race_id         ?? null,
    starting_points:   pc.starting_points   ?? null,
    experience_points: pc.experience_points ?? null,
    ability_points:    pc.ability_points    ?? null,
    magic_points:      pc.magic_points      ?? null,
    // Only ever set by forkAndLinkAllyToCharacter() for a nameless catalog ally — see
    // allies/tier.js and components/resume/vitals.js's renderResumeHeader.
    tier_label:        pc.tier_label        ?? "",
    image: pc.image ?? {
      uploaded:    false,
      data:        "",
      background:  "",
      color:       { r: "", g: "", b: "" },
      orientation: "",
      position:    { x: "", y: "" },
      size:        { width: "", height: "" },
      scale:       "",
    },
  };

  // An ally file keeps its portrait on disk, so carry the path into the image block — that is
  // what lets a re-imported ally still render while it is being edited.
  if (data.portrait) {
    selected.character.image = {
      ...selected.character.image,
      path: data.portrait,
    };
  }

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };
  setVal("playerNameInput",        selected.character.player_name);
  setVal("characterNameInput",     selected.character.character_name);
  setVal("characterSexSelect",     selected.character.character_sex);
  setVal("characterAgeInput",      selected.character.character_age);
  setVal("characterWeightInput",   selected.character.character_weight);
  setVal("startingPointsInput",    selected.character.starting_points);
  setVal("experiencePointsInput",  selected.character.experience_points);
  setVal("abilityPointsInput",     selected.character.ability_points);
  setVal("magicPointsInput",       selected.character.magic_points);

  if (selected.character.race_id && state.data.races.length) {
    restoreRaceSelection(selected.character.race_id);
  }

  ["ST", "DX", "IQ", "HT"].forEach((attr) => {
    const src = character.primary?.[attr];
    if (!src) return;
    const base = document.getElementById(`${attr}_base`);
    const mod  = document.getElementById(`${attr}_mod`);
    if (base) base.value = src.base_value ?? 10;
    if (mod)  mod.value  = src.modifier   ?? 0;
  });

  const weightEl = document.getElementById("weight");
  if (weightEl) weightEl.value = inventory.weight ?? 0;

  selected.secondary       = character.secondary      ?? {};
  selected.damage          = character.damage         ?? {};
  selected.resistances     = character.resistances    ?? {};
  selected.advantages      = character.advantages     ?? {};
  selected.disadvantages   = character.disadvantages  ?? {};
  selected.skills          = character.skills         ?? {};
  selected.spells          = character.spells         ?? {};
  selected.allies          = character.allies         ?? [];
  selected.alliesActiveId  = character.alliesActiveId ?? null;
  selected.meta_race_ids   = character.meta_race_ids  ?? [];
  selected.armors          = ensureInstanceIds(inventory.armors         ?? []);
  selected.shields         = ensureInstanceIds(inventory.shields        ?? []);
  selected.melee_weapons   = ensureInstanceIds(inventory.melee_weapons  ?? []);
  selected.ranged_weapons  = ensureInstanceIds(inventory.ranged_weapons ?? []);
  selected.firearms        = ensureInstanceIds(inventory.firearms       ?? []);
  selected.ammo_containers = ensureInstanceIds(inventory.ammo_containers ?? []);
  selected.loose_ammo      = ensureInstanceIds(inventory.loose_ammo     ?? []);
  selected.alchemy         = ensureInstanceIds(inventory.alchemy        ?? []);
  selected.survivalGear    = ensureInstanceIds(inventory.survivalGear   ?? []);
  selected.accessories     = ensureInstanceIds(inventory.accessories    ?? []);
  selected.magicGear       = ensureInstanceIds(inventory.magicGear      ?? []);
  selected.customInventory = ensureInstanceIds(inventory.customInventory ?? []);
  selected.coins           = ensureInstanceIds(inventory.coins          ?? []);

  renderListsPreserving(selected, state.data);
  renderCharacterImage();
  renderResumeImage();
  triggerAutoRun();
}

export function getStore() {
  return _load() ?? _initStore("Personagem 1");
}

export function listCharacters() {
  return getStore().list.map((entry) => ({
    id: entry.id,
    name: entry.name,
    race: entry.race,
    kind: kindOf(entry),
  }));
}

export function getActiveKind() {
  const store = getStore();
  return kindOf(store.list.find((c) => c.id === store.activeId));
}

// Converting is deliberately just a label change: the sheet's data is identical either way, so
// nothing is migrated and nothing can be lost by toggling back and forth.
export function setActiveKind(kind) {
  const store = getStore();
  const entry = store.list.find((c) => c.id === store.activeId);
  if (!entry) return;

  entry.kind = kind === ENTRY_KINDS.ALLY
    ? ENTRY_KINDS.ALLY
    : ENTRY_KINDS.CHARACTER;
  _save(store);
}

export function getActiveCharacterId() {
  return getStore().activeId;
}

export function getCharacterData(characterId) {
  return getStore().list.find((c) => c.id === characterId)?.data ?? null;
}

// For reading/writing a non-active entry (e.g. an ally) without touching state.selected or
// store.activeId — those stay bound to whichever entry is currently loaded into the sheet.
export function withCharacterInventory(characterId, mutator) {
  const store = getStore();
  const entry = store.list.find((c) => c.id === characterId);
  if (!entry) return false;

  entry.data.inventory = { ..._blankData().inventory, ...entry.data.inventory };
  mutator(entry.data.inventory, entry.data);
  _save(store);
  return true;
}

export function saveActiveCharacter() {
  const store = getStore();
  const idx = store.list.findIndex((c) => c.id === store.activeId);
  if (idx === -1) return;

  const data = capturePersistedSheet();
  store.list[idx].data = data;

  // Unconditional, not `if (charName)` — clearing the name field back to blank must clear
  // the stored display name too, or the selector's name → race → "unnamed" fallback
  // (characterSelector.js's _displayName) never gets a real blank to fall through to.
  store.list[idx].name = state.selected.character?.character_name?.trim() || "";

  const raceId = state.selected.character?.race_id;
  if (raceId) {
    const raceRow = state.data.races.find((r) => r.race_id === raceId);
    store.list[idx].race = raceRow?.race_sub_name || raceRow?.race_name || "";
  } else {
    store.list[idx].race = "";
  }

  _save(store);
}

// Returns whether a character was found and applied — bootstrap relies on this to
// know whether _applyData already rendered, or whether it must paint the empty sheet.
export function loadCharacter(id) {
  const store = getStore();
  const entry = store.list.find((c) => c.id === id);
  if (!entry) return false;

  store.activeId = id;
  _save(store);

  _applyData(entry.data);
  return true;
}

// Saves the outgoing character first, same as switching does: autosave is debounced 300ms, so
// adding a character right after a keystroke would otherwise drop that last edit. getStore() below
// re-reads, so it sees the write.
export function addCharacter(name, kind = ENTRY_KINDS.CHARACTER) {
  saveActiveCharacter();

  const store = getStore();
  const entry = _blankCharacter(name || "Novo Personagem", kind);
  store.list.push(entry);
  store.activeId = entry.id;
  _save(store);
  _applyData(entry.data);
  return entry.id;
}

// Activates the next (or previous) character in the list; if it was the last one,
// creates a fresh blank character instead of leaving the list empty.
export function removeCharacter(id) {
  const store = getStore();
  const idx = store.list.findIndex((c) => c.id === id);
  if (idx === -1) return;

  store.list.splice(idx, 1);

  if (store.list.length === 0) {
    const fresh = _blankCharacter("Personagem 1");
    store.list.push(fresh);
    store.activeId = fresh.id;
  } else {
    const nextIdx = Math.min(idx, store.list.length - 1);
    store.activeId = store.list[nextIdx].id;
  }

  _save(store);
  loadCharacter(store.activeId);
}

export function replaceActiveCharacter(payload) {
  const store = getStore();
  const idx = store.list.findIndex((c) => c.id === store.activeId);
  if (idx === -1) return;

  store.list[idx].data = payload;

  // Unconditional — see the identical comment in saveActiveCharacter().
  store.list[idx].name = payload?.pc?.character_name?.trim() || "";

  const raceId = payload?.race?.race_id;
  if (raceId) {
    const raceRow = state.data.races.find((r) => r.race_id === raceId);
    store.list[idx].race = raceRow?.race_sub_name || raceRow?.race_name || "";
  } else {
    store.list[idx].race = "";
  }

  _save(store);
  _applyData(payload);
}

export function initCharacters() {
  const store = getStore();
  return loadCharacter(store.activeId);
}
