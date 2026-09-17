import { t } from "../localization/pt-BR/index.js";

// Add-form <select>s sit in bare control rows with no visible label to point at, so their
// accessible name is composed here as "<field> — <domain>" from the same localization keys the
// visible UI uses. Mirrors initAttributeTableHeaders' id -> key map.
const SELECT_LABELS = {
  raceNameSelect: ["character.race"],
  raceSubSelect: ["character.subRace"],

  advTypeSelect: ["common.type", "tabs.traits.advantages"],
  advSelect: ["common.name", "tabs.traits.advantages"],
  disTypeSelect: ["common.type", "tabs.traits.disadvantages"],
  disSelect: ["common.name", "tabs.traits.disadvantages"],
  skillCategorySelect: ["common.category", "tabs.skills.skills"],
  skillSelect: ["common.name", "tabs.skills.skills"],

  spellSchoolSelect: ["traits.school", "tabs.magic.spells"],
  spellSelect: ["common.name", "tabs.magic.spells"],
  magicGearTypeFilter: ["common.type", "tabs.magic.gear"],
  magicGearNameSelect: ["common.name", "tabs.magic.gear"],
  magicGearStorage: ["common.storage", "tabs.magic.gear"],

  armorSlotSelect: ["armor.slot", "tabs.equipment.armor"],
  armorNameSelect: ["common.name", "tabs.equipment.armor"],
  armorTierSelect: ["common.tier", "tabs.equipment.armor"],
  armorMaterialSelect: ["common.material", "tabs.equipment.armor"],
  armorStorage: ["common.storage", "tabs.equipment.armor"],

  shieldNameSelect: ["common.name", "tabs.equipment.shields"],
  shieldTierSelect: ["common.tier", "tabs.equipment.shields"],
  shieldMaterialSelect: ["common.material", "tabs.equipment.shields"],
  shieldStorage: ["common.storage", "tabs.equipment.shields"],

  meleeTypeFilter: ["common.type", "tabs.equipment.melee"],
  meleeNameSelect: ["common.name", "tabs.equipment.melee"],
  meleeTierSelect: ["common.tier", "tabs.equipment.melee"],
  meleeMaterialSelect: ["common.material", "tabs.equipment.melee"],
  meleeStorage: ["common.storage", "tabs.equipment.melee"],

  rangedTypeFilter: ["common.type", "tabs.equipment.ranged"],
  rangedNameSelect: ["common.name", "tabs.equipment.ranged"],
  rangedTierSelect: ["common.tier", "tabs.equipment.ranged"],
  rangedMaterialSelect: ["common.material", "tabs.equipment.ranged"],
  rangedStorage: ["common.storage", "tabs.equipment.ranged"],

  firearmTypeFilter: ["common.type", "tabs.equipment.firearms"],
  firearmNameSelect: ["common.name", "tabs.equipment.firearms"],
  firearmTierSelect: ["common.tier", "tabs.equipment.firearms"],
  firearmMaterialSelect: ["common.material", "tabs.equipment.firearms"],
  firearmStorage: ["common.storage", "tabs.equipment.firearms"],

  ammoContainerTypeFilter: ["common.type", "ammo.containers"],
  ammoContainerSelect: ["common.name", "ammo.containers"],
  ammoContainerStorage: ["common.storage", "ammo.containers"],
  looseAmmoTypeFilter: ["common.type", "ammo.looseAmmo"],
  looseAmmoSelect: ["common.name", "ammo.looseAmmo"],
  looseAmmoStorage: ["common.storage", "ammo.looseAmmo"],

  alchemyTypeFilter: ["common.type", "tabs.inventory.alchemy"],
  alchemyNameSelect: ["common.name", "tabs.inventory.alchemy"],
  alchemyTierSelect: ["common.tier", "tabs.inventory.alchemy"],
  alchemyStorage: ["common.storage", "tabs.inventory.alchemy"],

  survivalGearTypeFilter: ["common.type", "tabs.inventory.survivalGear"],
  survivalGearNameSelect: ["common.name", "tabs.inventory.survivalGear"],
  survivalGearStorage: ["common.storage", "tabs.inventory.survivalGear"],

  accessoryNameSelect: ["common.name", "tabs.inventory.accessories"],
  accessoryStorage: ["common.storage", "tabs.inventory.accessories"],

  customItemStorage: ["common.storage", "tabs.inventory.customInventory"],
};

export function initSelectLabels() {
  for (const [id, [fieldKey, domainKey]] of Object.entries(SELECT_LABELS)) {
    const el = document.getElementById(id);
    if (!el) continue;

    const field = t(fieldKey);
    el.setAttribute(
      "aria-label",
      domainKey ? `${field} — ${t(domainKey)}` : field,
    );
  }
}
