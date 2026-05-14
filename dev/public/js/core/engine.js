import { state } from "../state.js";
import { buildSheet } from "../api.js";
import { getPrimaryAttributes } from "./attributes/attributesPrimary.js";
import {
  renderOutput,
  updateInventoryUI,
  renderSecondaryAttributes,
  renderDamage,
} from "../ui.js";

const selected = state.selected;

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
