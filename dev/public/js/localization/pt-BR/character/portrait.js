// Keys must stay flat (not under .editor): index.html reads them by flat path and setText() swallows undefined, so nesting breaks the text silently.
export const CHARACTER_IMAGE = {
  invalidType: "Arquivo inválido. Use JPG, PNG, GIF ou WEBP.",
  tooLarge: "Imagem muito grande. Tamanho máximo: 1 MB.",
  confirmRemoveTitle: "Remover imagem?",
  confirmRemoveMessage: "Remover a imagem do personagem?",

  tabLabel: "Imagem",
  uploadBtn: "Selecionar imagem",
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
