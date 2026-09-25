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
import {
  toEngineRace,
  toEngineCharacter,
  toEngineInventory,
} from "../shared/enginePayload.js";
import { showToast } from "../store/persistence.js";
import { t } from "../localization/pt-BR/index.js";

const selected = state.selected;

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
      ability_points: info.ability_points ?? null,
      magic_points: info.magic_points ?? null,
      // Mirrors store/characters.js's _applyData — see that whitelist entry's comment.
      tier_label: info.tier_label ?? "",
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

    const json = await buildSheet({
      pc,
      race: toEngineRace(raceRow),
      character: toEngineCharacter(
        {
          advantages: selected.advantages,
          disadvantages: selected.disadvantages,
          secondary: selected.secondary,
          damage: selected.damage,
          resistances: selected.resistances,
          skills: selected.skills,
          spells: selected.spells,
        },
        getPrimaryAttributes(),
      ),
      inventory: toEngineInventory({
        weight: document.getElementById("weight").value,
        armors: selected.armors,
        shields: selected.shields,
        melee_weapons: selected.melee_weapons,
        ranged_weapons: selected.ranged_weapons,
        firearms: selected.firearms,
        ammo_containers: selected.ammo_containers,
        loose_ammo: selected.loose_ammo,
        alchemy: selected.alchemy,
        survivalGear: selected.survivalGear,
        accessories: selected.accessories,
        magicGear: selected.magicGear,
        customInventory: selected.customInventory,
        coins: selected.coins,
      }),
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
    const abilityPts = json.pc?.ability_points ?? null;
    const magicPts = json.pc?.magic_points ?? null;

    const available =
      (startingPts ?? 0) +
      (experiencePts ?? 0) +
      (abilityPts ?? 0) +
      (magicPts ?? 0);

    const totalAvailableEl = document.getElementById(
      "totalAvailablePointsValue",
    );
    if (totalAvailableEl) totalAvailableEl.textContent = String(available);

    if (
      startingPts !== null ||
      experiencePts !== null ||
      abilityPts !== null ||
      magicPts !== null
    ) {
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
