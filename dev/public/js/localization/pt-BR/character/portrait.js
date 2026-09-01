// localization/pt-BR/character/portrait.js
// ─────────────────────────────────────────────────────────────────────────────
// Character portrait — mirrors engine/character/portrait.
//
// NOTE — collision fix: the original pt-BR.js defined a top-level
// `characterImage` key TWICE. The second definition (portrait-editor UI:
// tabLabel, uploadBtn, sizeAndPosition, background presets, etc.) silently
// overwrote the first (invalidType/tooLarge/confirmRemoveTitle/
// confirmRemoveMessage), which engine/character/portrait/portrait.js calls
// on every upload-error and remove-image path. Those calls were resolving to
// "" in production. Fixed here by keeping the live keys flat (zero call-site
// changes) and nesting the unused portrait-editor labels under `.editor` —
// grepped across dev/public/js and index.html, they have no current
// consumer, so they're preserved (not deleted) for whenever that UI is built.
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTER_IMAGE = {
  invalidType: "Arquivo inválido. Use JPG, PNG, GIF ou WEBP.",
  tooLarge: "Imagem muito grande. Tamanho máximo: 1 MB.",
  confirmRemoveTitle: "Remover imagem?",
  confirmRemoveMessage: "Remover a imagem do personagem?",

  // Currently unused — no consumer as of this refactor. Kept for a future
  // portrait editor (crop/position/background) UI.
  editor: {
    tabLabel: "Imagem",
    uploadBtn: "Selecionar imagem",
    clearBtn: "✕",
    sizeAndPosition: "Tamanho & Posição",
    background: "Fundo",
    bgAverage: "Automático",
    bgBlack: "Preto",
    bgWhite: "Branco",
    presetCover: "Cobrir",
    presetContain: "Conter",
    presetCenter: "Centro",
    presetTop: "Topo",
    presetBottom: "Base",
    presetLeft: "Esquerda",
    presetRight: "Direita",
    dragHint: "Arraste a imagem para reposicionar. Máx 1 MB.",
  },
};
