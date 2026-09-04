// To add a new language, duplicate this pt-BR/ folder (e.g. en-US/) and swap the import in main.js.

import { APP } from "./app.js";
import { REFERENCE } from "./reference.js";

import { ATTRIBUTES, SECONDARY_ATTRIBUTES } from "./components/attributes.js";
import { CHARACTERS } from "./components/characterSelector.js";
import { DIALOG } from "./components/dialog.js";
import { INVENTORY } from "./components/inventory.js";
import { NAV } from "./components/nav.js";
import { OUTPUT } from "./components/output.js";
import { ELEMENTAL_RESISTANCES } from "./components/resistances.js";
import { RESUME, SECTIONS } from "./components/resume.js";
import { TABS } from "./components/tabs.js";
import { THEME } from "./components/theme.js";
import { UNDO } from "./components/undo.js";
import { VIEW_MODE } from "./components/viewMode.js";

import { COMMON } from "./shared/common.js";

import { CHARACTER } from "./character/info.js";
import { CHARACTER_IMAGE } from "./character/portrait.js";
import { TRAITS } from "./character/traits.js";

import { MAGIC } from "./magic/spells.js";

import { ACCESSORIES } from "./inventory/accessories.js";
import { ALCHEMY } from "./inventory/alchemy.js";
import { AMMO } from "./inventory/ammo.js";
import { ARMOR } from "./inventory/armor.js";
import { COIN_PURSE } from "./inventory/coinPurse.js";
import { CUSTOM_INVENTORY } from "./inventory/customInventory.js";
import { FIREARMS } from "./inventory/firearms.js";
import {
  MAGIC_GEAR,
  getMagicGearLimitReachedLabel,
} from "./inventory/magicGear.js";
import { MELEE } from "./inventory/melee.js";
import { RANGED } from "./inventory/ranged.js";
import { SHIELD } from "./inventory/shield.js";
import { SURVIVAL_GEAR } from "./inventory/survivalGear.js";
import { ENCHANTMENTS } from "./inventory/shared/enchantments.js";
import { STORAGE } from "./inventory/shared/equipmentSelectors.js";

export const LABELS = {
  app: APP,
  characters: CHARACTERS,
  dialog: DIALOG,
  characterImage: CHARACTER_IMAGE,
  nav: NAV,
  tabs: TABS,
  sections: SECTIONS,
  resume: RESUME,
  attributes: ATTRIBUTES,
  character: CHARACTER,
  secondaryAttributes: SECONDARY_ATTRIBUTES,
  elementalResistances: ELEMENTAL_RESISTANCES,
  traits: TRAITS,
  magic: MAGIC,
  common: COMMON,
  armor: ARMOR,
  shield: SHIELD,
  melee: MELEE,
  ranged: RANGED,
  firearms: FIREARMS,
  survivalGear: SURVIVAL_GEAR,
  accessories: ACCESSORIES,
  magicGear: MAGIC_GEAR,
  enchantments: ENCHANTMENTS,
  customInventory: CUSTOM_INVENTORY,
  alchemy: ALCHEMY,
  ammo: AMMO,
  coinPurse: COIN_PURSE,
  storage: STORAGE,
  inventory: INVENTORY,
  viewMode: VIEW_MODE,
  theme: THEME,
  output: OUTPUT,
  reference: REFERENCE,
  undo: UNDO,
};

export function t(path, fallback = "") {
  return path.split(".").reduce((obj, key) => obj?.[key], LABELS) ?? fallback;
}

export function getSecondaryAttributeLabel(key) {
  return LABELS.secondaryAttributes[key] ?? key;
}

export function getElementalResistanceLabel(key) {
  return LABELS.elementalResistances[key] ?? key;
}

export function getEncumbranceLabel(key) {
  return LABELS.inventory.encumbrance[key] ?? key;
}

export function getCarryLimitLabel(key) {
  return LABELS.inventory.carryLimits[key] ?? key;
}

export { getMagicGearLimitReachedLabel };
