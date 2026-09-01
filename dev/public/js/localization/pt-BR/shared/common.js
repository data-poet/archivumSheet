// localization/pt-BR/shared/common.js
// ─────────────────────────────────────────────────────────────────────────────
// Genuinely cross-cutting vocabulary reused across inventory, character, and
// magic renderers (table headers, custom-fields editor, generic buttons).
// Not owned by any single domain, so it lives in shared/ rather than under
// engine/ or components/. `removed`/`undo` moved to components/undo.js since
// they were only ever consumed there; `added` stays here — it's also used by
// accessories/model.js and magicGear/model.js as a custom offerUndo() message.
// ─────────────────────────────────────────────────────────────────────────────

export const COMMON = {
  details: "Detalhes",
  empty: "Vazio",
  equip: "Equipar",
  material: "Material",
  materialEffect: "Efeito do Material",
  weight: "Peso",
  price: "Preço",
  description: "Descrição",
  type: "Tipo",
  name: "Nome",
  tier: "Tier",
  storage: "Armazenamento",
  skill: "Perícia",
  source: "Fonte",
  noEquipped: "Nenhum equipado",
  common: "Comum",
  unknown: "Desconhecido",
  mod: "Mod",
  hp: "PV",
  actual: "Atual",
  add: "Adicionar",
  remove: "Remover",
  added: "Adicionado",
  edit: "Editar",
  customize: "Personalizar",
  customName: "Nome Personalizado",
  customDescription: "Descrição Personalizada",
  customEffect: "Efeito Personalizado",
  customNamePlaceholder: "Ex: Anel do Vazio",
  customDescriptionPlaceholder: "Descrição livre do item...",
  customEffectPlaceholder: "Efeito mecânico livre do item...",
  save: "Salvar",
  cancel: "Cancelar",
  noCustomFields: "Nenhuma personalização definida.",
};
