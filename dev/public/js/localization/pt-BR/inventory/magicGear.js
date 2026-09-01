// localization/pt-BR/inventory/magicGear.js
// ─────────────────────────────────────────────────────────────────────────────
// Magic Gear (Instrumentos Mágicos) — mirrors engine/inventory/magicGear.
// ─────────────────────────────────────────────────────────────────────────────

export const MAGIC_GEAR = {
  title: "Instrumentos Mágicos",
  addMagicGear: "Adicionar Instrumento",
  magicGear: "Instrumento Mágico",
  magicGearWeight: "Instrumentos Mágicos",
  typeFilter: "— Tipo —",
};

/**
 * Magic gear's equip-limit message is type-aware (Arcano vs Musical each
 * have their own cap — see engine/inventory/js/magicGear/magicGearConstants.js's
 * MAGIC_GEAR_EQUIP_LIMITS), so it can't be a single static string the way
 * accessories.limitReached is. type/limit are passed in by the caller,
 * sourced from data.magicGear / data.magicGearEquipLimits.
 */
export function getMagicGearLimitReachedLabel(type, limit) {
  return `Limite de instrumentos do tipo "${type}" equipados atingido (máx. ${limit})`;
}
