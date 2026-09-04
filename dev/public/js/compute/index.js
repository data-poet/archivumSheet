import { state } from "../state.js";
import { buildSheet } from "../api.js";
import { saveActiveCharacter } from "../store/characters.js";
import { updateSelectorButton } from "../components/characterSelector.js";
import { getPrimaryAttributes } from "./attributes.js";
import {
  renderOutput,
  renderLists,
  updateInventoryUI,
  renderSecondaryAttributes,
  renderDamage,
  renderElementalResistances,
  renderResume,
  syncViewMode,
} from "../ui.js";
import { snapshotAll, restoreAll } from "../shared/openState.js";
import { showToast } from "../store/persistence.js";
import { t } from "../localization/pt-BR/index.js";

const selected = state.selected;

// Not `Number(x) || 1` — a literal 0 (immune to this element) is a real value that `||` would erase.
function parseRaceMultiplier(raw) {
  if (raw === undefined || raw === null || raw === "") return 1;
  const n = Number(raw);
  return Number.isNaN(n) ? 1 : n;
}

// renderLists() here is wrapped in a synchronous snapshot/restore (see call site below)
// so equipment selects aren't destroyed mid-interaction on every autorun tick.
export async function runEngine() {
  try {
    const info = selected.character ?? {};
    const pc = {
      player_name: info.player_name || "",
      character_name: info.character_name || "",
      character_sex: info.character_sex || "",
      character_age: info.character_age ?? null,
      character_weight: info.character_weight ?? null,
      starting_points: info.starting_points ?? null,
      experience_points: info.experience_points ?? null,
      image: info.image ?? {
        uploaded: false,
        data: "",
        background: "",
        color: { r: "", g: "", b: "" },
        orientation: "",
        position: { x: "", y: "" },
        size: { width: "", height: "" },
        scale: "",
      },
    };

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
          elemental_modifiers: {
            Fire: parseRaceMultiplier(raceRow.race_fire_damage_multiplier),
            Ice: parseRaceMultiplier(raceRow.race_ice_damage_multiplier),
            Electricity: parseRaceMultiplier(
              raceRow.race_electricity_damage_multiplier,
            ),
            Corrosion: parseRaceMultiplier(
              raceRow.race_corrossion_damage_multiplier,
            ),
            Necrotic: parseRaceMultiplier(
              raceRow.race_necrotic_damage_multiplier,
            ),
            Holy: parseRaceMultiplier(raceRow.race_holy_damage_multiplier),
            Void: parseRaceMultiplier(raceRow.race_void_damage_multiplier),
            Arcane: parseRaceMultiplier(raceRow.race_arcane_damage_multiplier),
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
          elementalResistances: Object.fromEntries(
            Object.entries(selected.resistances).map(([type, data]) => [
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
        firearms: selected.firearms,
        ammo_containers: selected.ammo_containers,
        loose_ammo: selected.loose_ammo,
        alchemy: selected.alchemy,
        survival_gear: selected.survivalGear,
        accessories: selected.accessories,
        magic_gear: selected.magicGear,
        custom_inventory: selected.customInventory,
        coins: selected.coins,
      },
    });

    const sec = json.character?.secondary_attributes || {};

    Object.entries(sec).forEach(([name, data]) => {
      if (!selected.secondary[name]) {
        selected.secondary[name] = {
          bought: data.bought || 0,
          modifier: data.modifier || 0,
        };
      }
    });

    const dmg = json.character?.base_damage || {};

    Object.entries(dmg).forEach(([type, data]) => {
      if (!selected.damage[type]) {
        selected.damage[type] = { modifier: data.modifier || 0 };
      }
    });

    const resist = json.character?.elemental_resistances || {};

    Object.entries(resist).forEach(([type, data]) => {
      if (!selected.resistances[type]) {
        selected.resistances[type] = { modifier: data.modifier || 0 };
      }
    });

    renderOutput(json);
    updateInventoryUI(json);
    renderSecondaryAttributes(json);
    renderDamage(json);
    renderElementalResistances(json);
    renderResume(json, state.data, state.selected);
    syncViewMode();

    state.sheet = json;

    const cp = json.character?.character_points ?? {};
    const totalSpent =
      (cp.primary_attributes ?? 0) +
      (cp.secondary_attributes ?? 0) +
      (cp.advantages ?? 0) +
      (cp.disadvantages ?? 0) +
      (cp.skills ?? 0) +
      (cp.spells ?? 0);

    const startingPts = json.pc?.starting_points ?? null;
    const experiencePts = json.pc?.experience_points ?? null;

    if (startingPts !== null || experiencePts !== null) {
      const available = (startingPts ?? 0) + (experiencePts ?? 0);
      if (totalSpent > available) {
        showToast(t("resume.insufficientPoints"), "error");
      }
    }

    // Restore must happen synchronously in the same task, not a later rAF — fresh <details>
    // markup never carries `open`, so a deferred restore paints collapsed then flashes open.
    // See openState.js's withOpenState for the identical fix.
    const snapshots = snapshotAll();

    renderLists(selected, state.data, state.sheet);

    restoreAll(snapshots);

    saveActiveCharacter();
    updateSelectorButton();
  } catch (err) {
    renderOutput({ error: err.message });
  }
}
