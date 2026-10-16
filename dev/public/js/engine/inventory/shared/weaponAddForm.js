// Shared factory for the "Adicionar" handler of melee, ranged and firearms (name + tier + material +
// destination, differing only in the element-id prefix). Armor, shield, accessories, magicGear, alchemy and
// survivalGear read different controls, so they keep their own.

import { STORED_AT } from "../../../shared/constants.js";
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
      (w) => w.weapon_name === nameEl.value && w.weapon_tier === tierEl.value,
    );
    if (!weapon) return;

    const material = data.materials.find(
      (m) => m.material_name === materialEl.value,
    );
    const materialId = material?.material_id ?? null;

    if (storageEl.value === STORED_AT.EQUIPPED) {
      addEquipped(weapon.weapon_id, materialId);
    } else {
      addStored(weapon.weapon_id, materialId, storageEl.value);
    }
  };
}
