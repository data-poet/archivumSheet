export const MAGIC_GEAR = {
  title: "Instrumentos Mágicos",
  addMagicGear: "Adicionar Instrumento",
  magicGear: "Instrumento Mágico",
  magicGearWeight: "Instrumentos Mágicos",
  typeFilter: "— Tipo —",
};

// Type-aware (Arcano vs Musical have separate caps in MAGIC_GEAR_EQUIP_LIMITS), so unlike accessories.limitReached this can't be a static string.
export function getMagicGearLimitReachedLabel(type, limit) {
  return `Limite de instrumentos do tipo "${type}" equipados atingido (máx. ${limit})`;
}
