export const ALLIES = {
  pageTitle: "Aliados",
  empty: "Nenhum aliado selecionado.",
  emptyHint: "Escolha um aliado para ver a ficha dele aqui.",

  noNestedAllies: "Um aliado não pode ter aliados próprios.",
  noCharacters: "Nenhum personagem disponível.",

  pickPrompt: "Escolher aliado",
  rosterEmpty: "Nenhum aliado na lista ainda.",
  edit: "Editar",
  remove: "Remover",
  confirmRemoveTitle: "Remover aliado",
  confirmRemove: "Remover",

  addToggle: "Adicionar aliado",

  typeLabel: "Tipo",
  subtypeLabel: "Subtipo",
  subtypeNone: "Nenhum",
  nameLabel: "Nome",
  tierLabel: "Nível",
  add: "Adicionar",
  addError: "Erro ao adicionar aliado.",

  // Display labels for each data/allies/ subfolder — folder name is the source of truth,
  // this map just makes it presentable. Falls back to the raw folder name if unlisted.
  typeNames: {
    humanoids: "Humanoides",
    animals: "Animais",
    elementals: "Elementais",
  },
  subtypeNames: {
    mounts: "Montarias",
    earth: "Terra",
  },
  // Display label for a file's trailing _NN, used instead of typeNames/subtypeNames' name
  // selector whenever a whole subtype's files carry no character_name (see allyAddInline.js's
  // _isUnnamedGroup). Falls back to "tierLabel NN" if unlisted.
  tierNames: {
    "01": "Menor",
  },
};
