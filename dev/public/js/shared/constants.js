// All labels come from the localization file — never hardcoded here.
import { LABELS } from "../localization/pt-BR/index.js";

export const STORAGE_LOCATIONS = ["backpack", "stash", "camp"];

export const STORAGE_LABELS = LABELS.storage;

// These are the DB's Portuguese slot-name keys; keep in sync with LABELS.armor.slots.
export const ARMOR_SLOTS = [
  "Cabeça",
  "Tronco",
  "Braços",
  "Mãos",
  "Pernas",
  "Pés",
];

// ACCESSORY_ITEM_CATEGORY / MAGIC_GEAR_ITEM_CATEGORY are fetched from
// /api/inventory/item-categories at bootstrap (see shared/enchantments/model.js),
// not hand-copied here. Armor pieces still reuse ARMOR_SLOTS' keys as their category.

// Race-innate-only traits, never player-browsable — excluded from every add/enchantment-target picker.
export const RACIAL_TRAIT_TYPE = "Racial";

export const DEFAULT_MATERIAL_ID = "MAT-000";

// An ally draft is an ordinary character entry that will be exported as an ally file rather than
// played. Keeping it a property of the entry — instead of a global UI mode — is what makes
// authoring safe: every write goes to store.activeId, so a draft can only write to its own row,
// and selecting a real character cannot leave the app in ally mode.
export const ENTRY_KINDS = { CHARACTER: "character", ALLY: "ally" };
