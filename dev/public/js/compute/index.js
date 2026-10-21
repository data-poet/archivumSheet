import { state } from "../state.js";
import { buildSheet, getLastServerTiming } from "../api.js";
import { getPrimaryAttributes } from "./attributes.js";
import {
  renderOutput,
  renderLists,
  renderSecondaryAttributes,
  renderDamage,
  renderElementalResistances,
  renderThresholds,
  renderEditConditions,
  renderResume,
  syncViewMode,
} from "../ui.js";
import {
  toEngineCharacter,
  toEngineInventory,
} from "../shared/enginePayload.js";
import { showToast } from "../shared/toast.js";
import { t } from "../localization/pt-BR/index.js";
import { isTimingEnabled, mark, logRunTiming } from "../shared/timing.js";
import { buildPcPayload } from "../shared/pcPayload.js";

const selected = state.selected;

const _round = (ms) => Math.round(ms * 100) / 100;

// `signal`/`isCurrent` are only ever supplied by compute/autorun.js's scheduler — a direct call
// (every existing test, and any future one-off use) runs unconditionally, same as before.
export async function runEngine({ signal, isCurrent } = {}) {
  const timing = isTimingEnabled();
  const tStart = timing ? mark() : 0;

  try {
    const info = selected.character ?? {};
    // image never leaves the device: it can be several KB of base64 and the engine only
    // echoes pc back, so sending it would cost bytes both ways for nothing read on return —
    // state.selected.character.image stays the source of truth (see resumeImage.js).
    const { image: _unused, ...pc } = buildPcPayload(info);

    const payload = {
      pc,
      race_id: info.race_id ?? null,
      character: toEngineCharacter(
        {
          advantages: selected.advantages,
          disadvantages: selected.disadvantages,
          conditions: selected.conditions,
          secondary: selected.secondary,
          damage: selected.damage,
          resistances: selected.resistances,
          skills: selected.skills,
          spells: selected.spells,
          meta_race_ids: selected.meta_race_ids,
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
    };

    const tPayload = timing ? mark() : 0;
    const json = await buildSheet(payload, { signal });
    const tResponse = timing ? mark() : 0;

    // A newer trigger already started another run while this one was in flight — that run
    // owns the next render and save, so applying this now-stale response would overwrite it.
    if (isCurrent && !isCurrent()) return;

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

    // A flag for a condition the dataset no longer has would stay invisible, and uncheckable, until "Limpar".
    const unknownConditions = (json.character?.conditions?.dropped ?? [])
      .filter((entry) => entry.reason === "unknown")
      .map((entry) => entry.key);
    if (unknownConditions.length > 0) {
      selected.conditions = Object.fromEntries(
        Object.entries(selected.conditions).filter(
          ([key]) => !unknownConditions.includes(key),
        ),
      );
    }

    renderOutput(json);
    renderSecondaryAttributes(json);
    renderDamage(json);
    renderElementalResistances(json);
    renderThresholds(json);
    renderEditConditions(json, state.data, state.selected);
    renderResume(json, state.data, state.selected);
    syncViewMode();

    const tRender = timing ? mark() : 0;

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

    renderLists(selected, state.data, state.sheet);

    if (timing) {
      const tEnd = mark();
      logRunTiming({
        payloadBuildMs: _round(tPayload - tStart),
        requestMs: _round(tResponse - tPayload),
        serverTiming: getLastServerTiming(),
        renderMs: _round(tRender - tResponse),
        listsMs: _round(tEnd - tRender),
        totalMs: _round(tEnd - tStart),
        requestBytes: JSON.stringify(payload).length,
        responseBytes: JSON.stringify(json).length,
      });
    }
  } catch (err) {
    // A superseded request's own abort, not a failure — the run that superseded it already
    // owns rendering the error, if there is one.
    if (err?.name === "AbortError") return;
    renderOutput({ error: err.message });
  }
}
