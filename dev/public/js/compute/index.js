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
import { t } from "../localization/pt-BR.js";

const selected = state.selected;

// Blank/missing/non-numeric → 1 ("no special resistance"). A literal 0
// ("immune to this element") is a real value and must be preserved, which
// is why this isn't just `Number(x) || 1` (0 is falsy and would collide
// with the missing-cell fallback).
function parseRaceMultiplier(raw) {
  if (raw === undefined || raw === null || raw === "") return 1;
  const n = Number(raw);
  return Number.isNaN(n) ? 1 : n;
}

// ─────────────────────────────────────────────────────────────────────────────
// runEngine
//
// Responsibility: call buildSheet with current state, then update the
// output/stats panels (output JSON, inventory weights, secondary attributes,
// damage table) AND the equipment lists.
//
// renderLists() IS called here, but only wrapped in a synchronous
// snapshotAll() → renderLists() → restoreAll() sequence — see the comment
// at that call site for why the restore must happen in the same task rather
// than on a later frame. Equipment list DOM is otherwise managed exclusively
// by explicit inventory mutations (add / remove / move / equip); this is
// what prevents selects from being destroyed mid-interaction on every
// autorun tick.
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
          // Percentage-based elemental damage multipliers (1 = normal
          // damage). Blank/missing/non-numeric CSV cells default to 1 ("no
          // special resistance"), but a literal 0 ("immune to this
          // element") is a real, meaningful value and must survive —
          // `Number(x) || 1` would wrongly coerce it back to 1, so a
          // dedicated parser is used instead.
          elemental_modifiers: {
            Fire: parseRaceMultiplier(raceRow.race_fire_damage_multiplier),
            Water: parseRaceMultiplier(raceRow.race_water_damage_multiplier),
            Earth: parseRaceMultiplier(raceRow.race_earth_damage_multiplier),
            Air: parseRaceMultiplier(raceRow.race_air_damage_multiplier),
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

    // ── Sync elemental resistances ─────────────────────────────────────────
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

    // Store resolved sheet so render files can use final computed values
    state.sheet = json;

    // ── Insufficient points warning ────────────────────────────────────────
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

    // Snapshot open details + scroll positions across all list containers
    // before renderLists wipes and rebuilds the DOM, then restore
    // immediately after — same task, not a later rAF. Fresh <details>
    // markup never carries the `open` attribute, so deferring the restore
    // to a later frame means the browser paints the rebuilt DOM collapsed
    // first, then open again next frame — a visible flash. Restoring
    // synchronously right after renderLists means the browser only ever
    // paints the final, correct state. See openState.js's withOpenState
    // for the identical fix and full rationale.
    const snapshots = snapshotAll();

    renderLists(selected, state.data, state.sheet);

    restoreAll(snapshots);

    // Persist active character and refresh selector label
    saveActiveCharacter();
    updateSelectorButton();
  } catch (err) {
    renderOutput({ error: err.message });
  }
}
