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

// ===== DEFAULT MATERIAL =====
export const DEFAULT_MATERIAL_ID = "MAT-000";
