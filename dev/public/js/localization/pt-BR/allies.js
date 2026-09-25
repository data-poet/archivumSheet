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
  subtypeNone: "-",
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
  // Display labels for a file's trailing _NN, used instead of typeNames/subtypeNames' name
  // selector whenever a whole subtype's files carry no character_name (see allyAddInline.js's
  // _isUnnamedGroup). Which list applies to a given type/subtype is decided server-side (see
  // data/allies/tierLogic.config.json) and shipped as each ally's tierList field. Falls back
  // to "tierLabel NN" if the list or the number in it is unlisted.
  tierLists: {
    default: {
      "01": "Menor",
      "02": "Comum",
      "03": "Maior",
      "04": "Elite",
      "05": "Lendário",
    },
  },
};
