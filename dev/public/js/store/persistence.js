import { state } from "../state.js";
import { getPrimaryAttributes } from "../engine/attributes.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { resetInstanceCounters } from "./instanceId.js";
import { restoreRaceSelection } from "../character/races.js";

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA VERSION
// Bump this if the shape of the export JSON ever changes in a breaking way.
// ─────────────────────────────────────────────────────────────────────────────
const SCHEMA_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serialize current sheet state to JSON and trigger a browser download.
 * The filename includes the current date for easy identification.
 */
export function exportSheet() {
  const { selected, sheet } = state;

  // The engine output (state.sheet) is the source of truth for pc and race.
  // For selected state (primary inputs, skills, equipment) we read from selected
  // so that unsaved mid-edit values are always captured.
  const payload = {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    pc: sheet?.pc ?? selected.character,
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
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `archivum_sheet_${date}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read a JSON file chosen by the user and hydrate the sheet state from it.
 * Requires that data CSVs (shields, melee, armors) are already loaded — the
 * caller is responsible for ensuring this before calling importSheet().
 *
 * @param {File} file
 * @returns {Promise<void>}
 */
export function importSheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        _applyImport(payload);
        resolve();
      } catch (err) {
        reject(new Error(`Import failed: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsText(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — apply a validated payload to state + DOM
// ─────────────────────────────────────────────────────────────────────────────

function _applyImport(payload) {
  if (!payload?.version || !payload?.character || !payload?.inventory) {
    throw new Error("Invalid sheet file — missing required fields.");
  }

  const { selected, data } = state;
  const { pc, race, character, inventory } = payload;

  // ── PC info ───────────────────────────────────────────────────────────────
  selected.character = {
    player_name: pc?.player_name ?? "",
    character_name: pc?.character_name ?? "",
    character_sex: pc?.character_sex ?? "",
    character_age: pc?.character_age ?? null,
    character_weight: pc?.character_weight ?? null,
    race_id: race?.race_id ?? null,
  };

  // ── PC info → DOM inputs ──────────────────────────────────────────────────
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };
  setVal("playerNameInput", selected.character.player_name);
  setVal("characterNameInput", selected.character.character_name);
  setVal("characterSexSelect", selected.character.character_sex);
  setVal("characterAgeInput", selected.character.character_age);
  setVal("characterWeightInput", selected.character.character_weight);

  if (selected.character.race_id && state.data.races.length) {
    restoreRaceSelection(selected.character.race_id);
  }
  const attrs = ["ST", "DX", "IQ", "HT"];
  attrs.forEach((attr) => {
    const src = character.primary?.[attr];
    if (!src) return;
    const base = document.getElementById(`${attr}_base`);
    const mod = document.getElementById(`${attr}_mod`);
    if (base) base.value = src.base_value ?? 10;
    if (mod) mod.value = src.modifier ?? 0;
  });

  // ── Weight → DOM input ────────────────────────────────────────────────────
  const weightEl = document.getElementById("weight");
  if (weightEl) weightEl.value = inventory.weight ?? 0;

  // ── Reset instance ID counters so imported IDs don't clash ────────────────
  resetInstanceCounters();

  // ── Hydrate selected state ────────────────────────────────────────────────
  selected.secondary = character.secondary ?? {};
  selected.damage = character.damage ?? {};
  selected.advantages = character.advantages ?? {};
  selected.disadvantages = character.disadvantages ?? {};
  selected.skills = character.skills ?? {};
  selected.spells = character.spells ?? {};
  selected.armors = inventory.armors ?? [];
  selected.shields = inventory.shields ?? [];
  selected.melee_weapons = inventory.melee_weapons ?? [];
  selected.ranged_weapons = inventory.ranged_weapons ?? [];

  // ── Re-render lists and recalculate ───────────────────────────────────────
  renderLists(selected, data);
  triggerAutoRun();
}
