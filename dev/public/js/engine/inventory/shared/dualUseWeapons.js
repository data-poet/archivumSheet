// ─────────────────────────────────────────────────────────────────────────────
// DUAL-USE WEAPONS  (ES module — dev/public layer)
//
// MELEE_TO_RANGED / RANGED_TO_MELEE are NOT duplicated here. They're fetched
// from /api/inventory/dual-use-weapons at bootstrap (see loadDualUseWeapons
// below), which serves engine/inventory/js/shared/dualUseWeapons.js's own
// maps directly — the engine remains the single source of truth for these
// pairings.
// ─────────────────────────────────────────────────────────────────────────────

import { state } from "../../../state.js";
import { fetchDualUseWeapons } from "../../../api.js";

const data = state.data;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadDualUseWeapons() {
  data.dualUseWeapons = await fetchDualUseWeapons();
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUPS
// ─────────────────────────────────────────────────────────────────────────────

/** Given a melee weapon_id, returns the matching ranged weapon_id, or null. */
export function getRangedCounterpart(meleeWeaponId) {
  return data.dualUseWeapons.MELEE_TO_RANGED[meleeWeaponId] ?? null;
}

/** Given a ranged weapon_id, returns the matching melee weapon_id, or null. */
export function getMeleeCounterpart(rangedWeaponId) {
  return data.dualUseWeapons.RANGED_TO_MELEE[rangedWeaponId] ?? null;
}
