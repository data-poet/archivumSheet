// constants.js
// All labels come from the localization file — never hardcoded here.

import { LABELS } from "../localization/pt-BR.js";

// ===== STORAGE LOCATIONS =====
export const STORAGE_LOCATIONS = ["backpack", "stash", "camp"];

export const STORAGE_LABELS = LABELS.storage;

// ===== ARMOR SLOTS =====
// Defined in the localization file so they translate automatically.
// If your data uses Portuguese slot names as keys in the DB, keep this
// list in sync with LABELS.armor.slots (add that key when ready to fully
// localize DB values too).
export const ARMOR_SLOTS = [
  "Cabeça",
  "Tronco",
  "Braços",
  "Mãos",
  "Pernas",
  "Pés",
];

// ===== ENCHANTMENT allowed_itens categories =====
// Matches enchantment_allowed_itens values from db_magic_enchantments.csv —
// armor pieces reuse ARMOR_SLOTS' Portuguese keys above, accessories get
// their own category since they aren't slotted the same way.
export const ACCESSORY_ITEM_CATEGORY = "Acessórios";

// ===== TRAIT TYPES =====
// Traits of this type only ever exist as race-innate grants and are never
// player-browsable — excluded from every "add advantage/disadvantage"
// picker (direct trait add, and enchantment target pickers alike), since a
// player shouldn't be able to grant a race-only trait through either path.
export const RACIAL_TRAIT_TYPE = "Racial";

// ===== DEFAULT MATERIAL =====
export const DEFAULT_MATERIAL_ID = "MAT-000";
