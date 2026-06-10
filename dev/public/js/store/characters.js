// store/characters.js
// ─────────────────────────────────────────────────────────────────────────────
// Multi-character persistence via localStorage.
//
// Schema (key: "archivum_characters"):
// {
//   activeId: "c-<timestamp>",
//   list: [
//     { id: "c-<timestamp>", name: "Personagem 1", race: "", data: <payload> }
//   ]
// }
//
// "data" mirrors the exportSheet() payload shape so import/export is compatible.
// ─────────────────────────────────────────────────────────────────────────────

import { state } from "../state.js";
import { getPrimaryAttributes } from "../engine/attributes.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { resetInstanceCounters } from "./instanceId.js";
import { restoreRaceSelection } from "../character/races.js";

const STORAGE_KEY = "archivum_characters";
const SCHEMA_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function _generateId() {
  return "c-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

function _save(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error("[characters] localStorage write failed:", err);
  }
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
    },
    race: {},
    character: {
      primary: { ST: { base_value: 10, modifier: 0 }, DX: { base_value: 10, modifier: 0 }, IQ: { base_value: 10, modifier: 0 }, HT: { base_value: 10, modifier: 0 } },
      secondary: {},
      damage: {},
      advantages: {},
      disadvantages: {},
      skills: {},
      spells: {},
    },
    inventory: {
      weight: 0,
      armors: [],
      shields: [],
      melee_weapons: [],
      ranged_weapons: [],
      ammo_containers: [],
      loose_ammo: [],
      alchemy: [],
      survivalGear: [],
      customInventory: [],
    },
  };
}

function _blankCharacter(name) {
  const id = _generateId();
  return { id, name, race: "", data: _blankData() };
}

/**
 * Initialize store on first run (no existing data).
 * Creates one blank character and returns the store.
 */
function _initStore(firstCharName) {
  const first = _blankCharacter(firstCharName);
  const store = { activeId: first.id, list: [first] };
  _save(store);
  return store;
}

/**
 * Capture current state into a data payload (same shape as exportSheet).
 */
function _captureCurrentData() {
  const { selected, sheet } = state;
  return {
    version: SCHEMA_VERSION,
    pc: sheet?.pc ?? { ...selected.character },
    race: sheet?.race ?? {},
    character: {
      primary: getPrimaryAttributes(),
      secondary: selected.secondary,
      damage: selected.damage,
      advantages: selected.advantages,
      disadvantages: selected.disadvantages,
      skills: selected.skills,
      spells: selected.spells,
    },
    inventory: {
      weight: Number(document.getElementById("weight")?.value) || 0,
      armors: selected.armors,
      shields: selected.shields,
      melee_weapons: selected.melee_weapons,
      ranged_weapons: selected.ranged_weapons,
      ammo_containers: selected.ammo_containers,
      loose_ammo: selected.loose_ammo,
      alchemy: selected.alchemy,
      survivalGear: selected.survivalGear,
      customInventory: selected.customInventory,
    },
  };
}

/**
 * Apply a data payload to state + DOM (mirrors _applyImport in persistence.js).
 */
function _applyData(data) {
  if (!data) return;
  const { selected } = state;
  const { pc = {}, race = {}, character = {}, inventory = {} } = data;

  selected.character = {
    player_name:      pc.player_name      ?? "",
    character_name:   pc.character_name   ?? "",
    character_sex:    pc.character_sex    ?? "",
    character_age:    pc.character_age    ?? null,
    character_weight: pc.character_weight ?? null,
    race_id:          race.race_id        ?? null,
  };

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };
  setVal("playerNameInput",      selected.character.player_name);
  setVal("characterNameInput",   selected.character.character_name);
  setVal("characterSexSelect",   selected.character.character_sex);
  setVal("characterAgeInput",    selected.character.character_age);
  setVal("characterWeightInput", selected.character.character_weight);

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

  resetInstanceCounters();

  selected.secondary       = character.secondary      ?? {};
  selected.damage          = character.damage         ?? {};
  selected.advantages      = character.advantages     ?? {};
  selected.disadvantages   = character.disadvantages  ?? {};
  selected.skills          = character.skills         ?? {};
  selected.spells          = character.spells         ?? {};
  selected.armors          = inventory.armors         ?? [];
  selected.shields         = inventory.shields        ?? [];
  selected.melee_weapons   = inventory.melee_weapons  ?? [];
  selected.ranged_weapons  = inventory.ranged_weapons ?? [];
  selected.ammo_containers = inventory.ammo_containers ?? [];
  selected.loose_ammo      = inventory.loose_ammo     ?? [];
  selected.alchemy         = inventory.alchemy        ?? [];
  selected.survivalGear    = inventory.survivalGear   ?? [];
  selected.customInventory = inventory.customInventory ?? [];

  renderLists(selected, state.data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current store, initializing it on first run.
 * @returns {{ activeId: string, list: Array }}
 */
export function getStore() {
  return _load() ?? _initStore("Personagem 1");
}

/** @returns {Array<{ id: string, name: string, race: string }>} */
export function listCharacters() {
  return getStore().list.map(({ id, name, race }) => ({ id, name, race }));
}

/** @returns {string} */
export function getActiveCharacterId() {
  return getStore().activeId;
}

/**
 * Save current state into the active character slot.
 * Called automatically at the end of every runEngine().
 */
export function saveActiveCharacter() {
  const store = getStore();
  const idx = store.list.findIndex((c) => c.id === store.activeId);
  if (idx === -1) return;

  const data = _captureCurrentData();
  store.list[idx].data = data;

  // Update display name and race from live state
  const charName = state.selected.character?.character_name?.trim();
  if (charName) store.list[idx].name = charName;

  const raceId = state.selected.character?.race_id;
  if (raceId) {
    const raceRow = state.data.races.find((r) => r.race_id === raceId);
    store.list[idx].race = raceRow?.race_name ?? "";
  } else {
    store.list[idx].race = "";
  }

  _save(store);
}

/**
 * Load a character by id into state and re-run the engine.
 * @param {string} id
 */
export function loadCharacter(id) {
  const store = getStore();
  const entry = store.list.find((c) => c.id === id);
  if (!entry) return;

  store.activeId = id;
  _save(store);

  _applyData(entry.data);
}

/**
 * Create a blank character, set as active.
 * @param {string} name
 * @returns {string} new character id
 */
export function addCharacter(name) {
  const store = getStore();
  const entry = _blankCharacter(name || "Novo Personagem");
  store.list.push(entry);
  store.activeId = entry.id;
  _save(store);
  _applyData(entry.data);
  return entry.id;
}

/**
 * Delete a character by id. Activates the next (or previous) in the list.
 * If it was the last one, creates a fresh blank character.
 * @param {string} id
 */
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

/**
 * Replace the active character's data with an imported payload.
 * Used by the "Replace" action in the selector.
 * @param {object} payload — same shape as importSheet payload
 */
export function replaceActiveCharacter(payload) {
  const store = getStore();
  const idx = store.list.findIndex((c) => c.id === store.activeId);
  if (idx === -1) return;

  store.list[idx].data = payload;

  const charName = payload?.pc?.character_name?.trim();
  if (charName) store.list[idx].name = charName;

  const raceId = payload?.race?.race_id;
  if (raceId) {
    const raceRow = state.data.races.find((r) => r.race_id === raceId);
    store.list[idx].race = raceRow?.race_name ?? "";
  } else {
    store.list[idx].race = "";
  }

  _save(store);
  _applyData(payload);
}

/**
 * Initialize the store on app startup.
 * Ensures at least one character exists and loads the active one.
 */
export function initCharacters() {
  const store = getStore(); // creates if missing
  loadCharacter(store.activeId);
}
