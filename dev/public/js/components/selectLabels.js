import { t } from "../localization/pt-BR/index.js";

// Add-form <select>s sit in bare control rows with no visible label to point at, so their
// accessible name is composed here as "<field> — <domain>" from the same localization keys the
// visible UI uses. Mirrors initAttributeTableHeaders' id -> key map.
const SELECT_LABELS = {
  raceNameSelect: ["character.race"],
  raceSubSelect: ["character.subRace"],
  metaRaceNameSelect: ["character.metaRace"],
  metaRaceSubSelect: ["character.subMetaRace"],

  advTypeSelect: ["common.type", "tabs.tab-traits-advantages"],
  advSelect: ["common.name", "tabs.tab-traits-advantages"],
  disTypeSelect: ["common.type", "tabs.tab-traits-disadvantages"],
  disSelect: ["common.name", "tabs.tab-traits-disadvantages"],
  skillCategorySelect: ["common.category", "tabs.tab-skills-list"],
  skillSelect: ["common.name", "tabs.tab-skills-list"],

  spellSchoolSelect: ["traits.school", "tabs.tab-magic-spells"],
  spellSelect: ["common.name", "tabs.tab-magic-spells"],
  magicGearTypeFilter: ["common.type", "tabs.tab-magic-gear"],
  magicGearNameSelect: ["common.name", "tabs.tab-magic-gear"],
  magicGearStorage: ["common.storage", "tabs.tab-magic-gear"],

  armorSlotSelect: ["armor.slot", "tabs.tab-equip-armor"],
  armorNameSelect: ["common.name", "tabs.tab-equip-armor"],
  armorTierSelect: ["common.tier", "tabs.tab-equip-armor"],
  armorMaterialSelect: ["common.material", "tabs.tab-equip-armor"],
  armorStorage: ["common.storage", "tabs.tab-equip-armor"],

  shieldNameSelect: ["common.name", "tabs.tab-equip-shields"],
  shieldTierSelect: ["common.tier", "tabs.tab-equip-shields"],
  shieldMaterialSelect: ["common.material", "tabs.tab-equip-shields"],
  shieldStorage: ["common.storage", "tabs.tab-equip-shields"],

  meleeTypeFilter: ["common.type", "tabs.tab-equip-melee"],
  meleeNameSelect: ["common.name", "tabs.tab-equip-melee"],
  meleeTierSelect: ["common.tier", "tabs.tab-equip-melee"],
  meleeMaterialSelect: ["common.material", "tabs.tab-equip-melee"],
  meleeStorage: ["common.storage", "tabs.tab-equip-melee"],

  rangedTypeFilter: ["common.type", "tabs.tab-equip-ranged"],
  rangedNameSelect: ["common.name", "tabs.tab-equip-ranged"],
  rangedTierSelect: ["common.tier", "tabs.tab-equip-ranged"],
  rangedMaterialSelect: ["common.material", "tabs.tab-equip-ranged"],
  rangedStorage: ["common.storage", "tabs.tab-equip-ranged"],

  firearmTypeFilter: ["common.type", "tabs.tab-equip-firearms"],
  firearmNameSelect: ["common.name", "tabs.tab-equip-firearms"],
  firearmTierSelect: ["common.tier", "tabs.tab-equip-firearms"],
  firearmMaterialSelect: ["common.material", "tabs.tab-equip-firearms"],
  firearmStorage: ["common.storage", "tabs.tab-equip-firearms"],

  ammoContainerTypeFilter: ["common.type", "ammo.containers"],
  ammoContainerSelect: ["common.name", "ammo.containers"],
  ammoContainerStorage: ["common.storage", "ammo.containers"],
  looseAmmoTypeFilter: ["common.type", "ammo.looseAmmo"],
  looseAmmoSelect: ["common.name", "ammo.looseAmmo"],
  looseAmmoStorage: ["common.storage", "ammo.looseAmmo"],

  alchemyTypeFilter: ["common.type", "tabs.tab-inv-alchemy"],
  alchemyNameSelect: ["common.name", "tabs.tab-inv-alchemy"],
  alchemyTierSelect: ["common.tier", "tabs.tab-inv-alchemy"],
  alchemyStorage: ["common.storage", "tabs.tab-inv-alchemy"],

  survivalGearTypeFilter: ["common.type", "tabs.tab-inv-survival"],
  survivalGearNameSelect: ["common.name", "tabs.tab-inv-survival"],
  survivalGearStorage: ["common.storage", "tabs.tab-inv-survival"],

  accessoryNameSelect: ["common.name", "tabs.tab-inv-accessories"],
  accessoryStorage: ["common.storage", "tabs.tab-inv-accessories"],

  customItemStorage: ["common.storage", "tabs.tab-inv-custom"],
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
