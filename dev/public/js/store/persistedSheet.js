// The one writer of the persisted sheet shape, used by the autosave (store/characters.js) and the export
// (store/persistence.js): two hand-written copies let a field save but never leave the device.
// shared/enginePayload.js translates this shape for buildSheet().

import { state } from "../state.js";
import { getPrimaryAttributes } from "../compute/attributes.js";
import { buildPcPayload } from "../shared/pcPayload.js";

// Bump if the shape below ever changes in a breaking way.
export const SCHEMA_VERSION = 1;

export function capturePersistedSheet() {
  const { selected, sheet } = state;

  return {
    version: SCHEMA_VERSION,
    // Built straight from selected.character, never from sheet.pc: a save can now fire before
    // the engine has ever answered (autorun's save is decoupled from its run — see
    // compute/autorun.js), and sheet.pc is only ever an echo of a past request anyway.
    pc: buildPcPayload(selected.character),
    race: sheet?.race ?? {},
    character: {
      primary: getPrimaryAttributes(),
      secondary: selected.secondary,
      damage: selected.damage,
      resistances: selected.resistances,
      advantages: selected.advantages,
      disadvantages: selected.disadvantages,
      conditions: selected.conditions,
      skills: selected.skills,
      spells: selected.spells,
      allies: selected.allies,
      alliesActiveId: selected.alliesActiveId,
      meta_race_ids: selected.meta_race_ids,
    },
    inventory: {
      weight: Number(document.getElementById("weight")?.value) || 0,
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
    },
  };
}
