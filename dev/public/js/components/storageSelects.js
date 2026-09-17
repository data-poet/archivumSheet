// Fills every add-form's destination <select>. The options used to be spelled out
// in index.html — four <option> elements per section, each with its own id, plus a
// matching setText entry in the hydration script — so adding a section meant
// keeping three lists in sync. Now it's one descriptor entry.

import { STORAGE_LOCATIONS, STORAGE_LABELS } from "../shared/constants.js";

// equippable sections offer "equipped" ahead of the storage locations; the rest
// can only be stored.
export const STORAGE_SELECTS = [
  { id: "armorStorage", equippable: false },
  { id: "shieldStorage", equippable: false },
  { id: "meleeStorage", equippable: true },
  { id: "rangedStorage", equippable: true },
  { id: "firearmStorage", equippable: true },
  { id: "ammoContainerStorage", equippable: true },
  { id: "looseAmmoStorage", equippable: false },
  { id: "alchemyStorage", equippable: false },
  { id: "survivalGearStorage", equippable: false },
  { id: "accessoryStorage", equippable: true },
  { id: "magicGearStorage", equippable: true },
  { id: "customItemStorage", equippable: false },
];

// Sections that render an "equipped" list above a "stored" list.
export const EQUIP_SECTION_PREFIXES = [
  "armor",
  "shield",
  "melee",
  "ranged",
  "firearm",
  "accessory",
  "magic-gear",
];

export function storageValuesFor(equippable) {
  return equippable ? ["equipped", ...STORAGE_LOCATIONS] : STORAGE_LOCATIONS;
}

export function populateStorageSelects() {
  STORAGE_SELECTS.forEach(({ id, equippable }) => {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = storageValuesFor(equippable)
      .map(
        (value) => `<option value="${value}">${STORAGE_LABELS[value]}</option>`,
      )
      .join("");
  });
}
