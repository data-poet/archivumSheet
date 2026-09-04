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
// "" in production.
//
// CORRECTION (this pass): an earlier version of this fix nested the
// portrait-editor labels under `.editor`, on the assumption they had no
// consumer. That assumption was wrong — dev/public/index.html reads them
// directly off the flat path (`L.characterImage.tabLabel`, `.uploadBtn`,
// `.dragHint`, etc., around line 1938), so nesting them broke every one of
// those labels silently: setText() writes `undefined` into .textContent
// with no error, while the drag/upload/click handlers (bound by element ID,
// not by this text) keep working — which is exactly why it looked like
// "events work, but no text shows." Restored to flat, matching index.html's
// actual reads, with zero call-site changes elsewhere needed.
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTER_IMAGE = {
  invalidType: "Arquivo inválido. Use JPG, PNG, GIF ou WEBP.",
  tooLarge: "Imagem muito grande. Tamanho máximo: 1 MB.",
  confirmRemoveTitle: "Remover imagem?",
  confirmRemoveMessage: "Remover a imagem do personagem?",

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
};
