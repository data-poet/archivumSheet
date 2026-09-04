// Keys must stay flat (not nested under .editor): dev/public/index.html reads them via flat paths like L.characterImage.tabLabel, and nesting breaks the text silently since setText() swallows undefined.
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
