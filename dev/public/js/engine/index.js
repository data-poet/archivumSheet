import { state } from "../state.js";
import { buildSheet } from "../api.js";
import { getPrimaryAttributes } from "./attributes.js";
import {
  renderOutput,
  updateInventoryUI,
  renderSecondaryAttributes,
  renderDamage,
} from "../ui.js";

const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// runEngine
//
// Responsibility: call buildSheet with current state, then update ONLY the
// output/stats panels (output JSON, inventory weights, secondary attributes,
// damage table).
//
// It intentionally does NOT call renderLists(). Equipment list DOM is managed
// exclusively by explicit inventory mutations (add / remove / move / equip).
// This is what prevents selects from being destroyed mid-interaction.
// ─────────────────────────────────────────────────────────────────────────────

export async function runEngine() {
  try {
    const json = await buildSheet({
      character: {
        advantages: Object.keys(selected.advantages),
        disadvantages: Object.keys(selected.disadvantages),
        primaryAttributes: getPrimaryAttributes(),

        secondaryAttributes: {
          ...selected.secondary,
          damage: Object.fromEntries(
            Object.entries(selected.damage).map(([type, data]) => [
              type,
              { modifier: Number(data.modifier) || 0 },
            ]),
          ),
        },

        skills: Object.entries(selected.skills).map(([skill_id, data]) => ({
          skill_id,
          base: Number(data.base) || 0,
          modifier: Number(data.modifier) || 0,
        })),

        spells: selected.spells,
      },

      inventory: {
        weight: Number(document.getElementById("weight").value) || 0,
        armor: selected.armors,
        shield: selected.shields,
        melee: selected.melee_weapons,
      },
    });

    // ── Sync secondary attributes ──────────────────────────────────────────
    const sec = json.character?.secondary_attributes || {};

    Object.entries(sec).forEach(([name, data]) => {
      if (!selected.secondary[name]) {
        selected.secondary[name] = {
          bought: data.bought || 0,
          modifier: data.modifier || 0,
        };
      }
    });

    // ── Sync damage ────────────────────────────────────────────────────────
    const dmg = json.character?.base_damage || {};

    Object.entries(dmg).forEach(([type, data]) => {
      if (!selected.damage[type]) {
        selected.damage[type] = { modifier: data.modifier || 0 };
      }
    });

    renderOutput(json);
    updateInventoryUI(json);
    renderSecondaryAttributes(json);
    renderDamage(json);
  } catch (err) {
    renderOutput({ error: err.message });
  }
}
