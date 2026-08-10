// ─────────────────────────────────────────────────────────────────────────────
// ENCHANTMENTS DB
//
// Single shared loader for db_magic_enchantments.csv. Mirrors materialsDB.js:
// one cache, one place to update if the enchantment schema changes. Shared
// (not accessories-specific) since armor will consume it too once Phase 2
// starts.
// ─────────────────────────────────────────────────────────────────────────────

const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

let _enchantmentsDB = null;

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const num = Number(value);

  return isFinite(num) ? num : null;
}

function toBoolean(value) {
  return String(value).trim().toUpperCase() === "TRUE";
}

function toItemList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getEnchantmentsDB() {
  if (_enchantmentsDB) {
    return _enchantmentsDB;
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_magic_enchantments.csv",
  );

  const rows = loadCSV(filePath);

  _enchantmentsDB = {};

  for (const row of rows) {
    _enchantmentsDB[row.enchantment_id] = {
      enchantment_id: row.enchantment_id,

      enchantment_name: row.enchantment_name,
      // Player-facing category ("Fortificar Atributo", "Peculiaridade",
      // "Perícia", "Feitiço", ...) — used only to group/filter the catalog
      // in the UI, never branched on for computation (that's still driven
      // entirely by enchantment_effect_type below).
      enchantment_type: row.enchantment_type,
      enchantment_effect_type: row.enchantment_effect_type,
      enchantment_is_parametric: toBoolean(row.enchantment_is_parametric),

      // Fixed target (attribute types only) — null for player-picked targets
      enchantment_target: row.enchantment_target || null,

      // Attribute magnitude pricing
      enchantment_base_value: toNumberOrNull(row.enchantment_base_value),
      enchantment_step: toNumberOrNull(row.enchantment_step),

      enchantment_allowed_itens: toItemList(row.enchantment_allowed_itens),

      // Pricing
      enchantment_base_price: toNumberOrNull(row.enchantment_base_price),
      enchantment_price_per_extra_value: toNumberOrNull(
        row.enchantment_price_per_extra_value,
      ),
      enchantment_price_per_point: toNumberOrNull(
        row.enchantment_price_per_point,
      ),
      enchantment_price_per_difficulty: toNumberOrNull(
        row.enchantment_price_per_difficulty,
      ),

      enchantment_description: row.enchantment_description || null,
    };
  }

  return _enchantmentsDB;
}

module.exports = {
  getEnchantmentsDB,
};
