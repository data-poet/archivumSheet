// The one writer of the persisted sheet shape.
//
// This payload is produced in two situations — autosaving the active character
// (store/characters.js) and writing an export file (store/persistence.js) — and it used to be
// hand-written in both. That made adding a field a two-file change where missing the second file
// fails silently: the field saves but never leaves the device, and the player only finds out on
// another machine. One writer, one shape.
//
// shared/enginePayload.js translates this shape into what buildSheet() wants; the two are
// deliberately different vocabularies (see that file).

import { state } from "../state.js";
import { getPrimaryAttributes } from "../compute/attributes.js";

// Bump if the shape below ever changes in a breaking way.
export const SCHEMA_VERSION = 1;

export function capturePersistedSheet() {
  const { selected, sheet } = state;

  return {
    version: SCHEMA_VERSION,
    // `image` is taken from selected rather than the built sheet: it is edited live and the last
    // build may predate the current crop/scale.
    pc: {
      ...(sheet?.pc ?? selected.character),
      image: selected.character.image,
    },
    race: sheet?.race ?? {},
    character: {
      primary: getPrimaryAttributes(),
      secondary: selected.secondary,
      damage: selected.damage,
      resistances: selected.resistances,
      advantages: selected.advantages,
      disadvantages: selected.disadvantages,
      skills: selected.skills,
      spells: selected.spells,
      allies: selected.allies,
      alliesActiveId: selected.alliesActiveId,
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
