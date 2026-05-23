import { state } from "../state.js";
import { getPrimaryAttributes } from "../engine/attributes.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { resetInstanceCounters } from "./instanceId.js";

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
  const primary = getPrimaryAttributes();
  const { selected } = state;

  const payload = {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    character: {
      primary,
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
  const { character, inventory } = payload;

  // ── Primary attributes → DOM inputs ───────────────────────────────────────
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
  selected.secondary    = character.secondary    ?? {};
  selected.damage       = character.damage       ?? {};
  selected.advantages   = character.advantages   ?? {};
  selected.disadvantages = character.disadvantages ?? {};
  selected.skills       = character.skills       ?? {};
  selected.spells       = character.spells       ?? {};
  selected.armors       = inventory.armors       ?? [];
  selected.shields      = inventory.shields      ?? [];
  selected.melee_weapons = inventory.melee_weapons ?? [];

  // ── Re-render lists and recalculate ───────────────────────────────────────
  renderLists(selected, data);
  triggerAutoRun();
}
