// Shared factory for the "Adicionar" button handler of the three weapon types
// (melee, ranged, firearms), whose add-forms are all name + tier + material +
// destination and were previously copy-pasted with only the element-id prefix
// changed.
//
// Armor (extra body-slot select), shield (storage only, no equip option),
// accessories (price), magicGear (name only) and alchemy/survivalGear (quantity +
// type filter) each read a different set of controls, so they keep their own.

import { state } from "../../../state.js";

const data = state.data;

export function createWeaponAddHandler({
  idPrefix,
  catalog,
  addEquipped,
  addStored,
}) {
  return function handleAddWeapon() {
    const nameEl = document.getElementById(`${idPrefix}NameSelect`);
    const tierEl = document.getElementById(`${idPrefix}TierSelect`);
    const materialEl = document.getElementById(`${idPrefix}MaterialSelect`);
    const storageEl = document.getElementById(`${idPrefix}Storage`);
    if (!nameEl || !tierEl || !materialEl || !storageEl) return;

    const weapon = catalog().find(
      (w) =>
        w.weapon_name === nameEl.value && w.weapon_tier === tierEl.value,
    );
    if (!weapon) return;

    const material = data.materials.find(
      (m) => m.material_name === materialEl.value,
    );
    const materialId = material?.material_id ?? null;

    if (storageEl.value === "equipped") {
      addEquipped(weapon.weapon_id, materialId);
    } else {
      addStored(weapon.weapon_id, materialId, storageEl.value);
    }
  };
}
