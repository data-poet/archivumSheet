import { state } from "../state.js";
import { buildSheet } from "../api.js";
import { getPrimaryAttributes } from "./attributes.js";
import {
  renderOutput,
  renderLists,
  updateInventoryUI,
  renderSecondaryAttributes,
  renderDamage,
  renderResume,
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
    // ── Build pc object ────────────────────────────────────────────────────
    const info = selected.character ?? {};
    const pc = {
      player_name: info.player_name || "",
      character_name: info.character_name || "",
      character_sex: info.character_sex || "",
      character_age: info.character_age ?? null,
      character_weight: info.character_weight ?? null,
    };

    // ── Build race object ──────────────────────────────────────────────────
    const raceRow = info.race_id
      ? state.data.races.find((r) => r.race_id === info.race_id)
      : null;

    const race = raceRow
      ? {
          race_id: raceRow.race_id,
          race_name: raceRow.race_name,
          race_sub_name: raceRow.race_sub_name || null,
          race_physical_maturity: raceRow.race_physical_maturity || null,
          race_mental_maturity: raceRow.race_mental_maturity || null,
          race_life_expectancy: raceRow.race_life_expectancy || null,
          modifiers: {
            ST: Number(raceRow.race_st_modifier) || 0,
            DX: Number(raceRow.race_dx_modifier) || 0,
            IQ: Number(raceRow.race_iq_modifier) || 0,
            HT: Number(raceRow.race_ht_modifier) || 0,
          },
          innate_advantage_ids: raceRow.race_innate_advantage_id
            ? raceRow.race_innate_advantage_id
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          innate_disadvantage_ids: raceRow.race_innate_disadvantage_id
            ? raceRow.race_innate_disadvantage_id
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          innate_advantage_names: raceRow.race_innate_advantage_name
            ? raceRow.race_innate_advantage_name
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          innate_disadvantage_names: raceRow.race_innate_disadvantage_name
            ? raceRow.race_innate_disadvantage_name
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        }
      : {};

    const json = await buildSheet({
      pc,
      race,
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
          base_value: Number(data.base_value ?? data.base) || 0,
          modifier: Number(data.modifier) || 0,
          isTrainedWithMaster: Boolean(data.isTrainedWithMaster ?? false),
        })),

        spells: selected.spells,
      },

      inventory: {
        weight: Number(document.getElementById("weight").value) || 0,
        armor: selected.armors,
        shield: selected.shields,
        melee: selected.melee_weapons,
        ranged: selected.ranged_weapons,
        ammo_containers: selected.ammo_containers,
        loose_ammo: selected.loose_ammo,
        alchemy: selected.alchemy,
        survival_gear: selected.survivalGear,
        custom_inventory: selected.customInventory,
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
    renderResume(json);

    // Store resolved sheet so render files can use final computed values
    state.sheet = json;

    renderLists(selected, state.data, state.sheet);
  } catch (err) {
    renderOutput({ error: err.message });
  }
}
