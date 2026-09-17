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

export function getRangedCounterpart(meleeWeaponId) {
  return data.dualUseWeapons.MELEE_TO_RANGED[meleeWeaponId] ?? null;
}

export function getMeleeCounterpart(rangedWeaponId) {
  return data.dualUseWeapons.RANGED_TO_MELEE[rangedWeaponId] ?? null;
}

// Handles both link directions: whichever side was created first points at the
// other, so a lookup has to try "they point at me" before "I point at them".
// counterparts is the opposite collection (melee → selected.ranged_weapons).
export function findLinkedCounterpart(instance, counterparts) {
  if (!instance || !counterparts) return null;

  // Both id comparisons are guarded against null/undefined: an unlinked
  // counterpart has no _linkedInstanceId, so an unset id on either side would
  // otherwise match it via undefined === undefined.
  if (instance._instanceId) {
    const pointingAtUs = counterparts.find(
      (c) => c._linkedInstanceId === instance._instanceId,
    );
    if (pointingAtUs) return pointingAtUs;
  }

  if (instance._linkedInstanceId) {
    return (
      counterparts.find((c) => c._instanceId === instance._linkedInstanceId) ??
      null
    );
  }

  return null;
}
