// localization/pt-BR/character/info.js
// ─────────────────────────────────────────────────────────────────────────────
// Character info fields — mirrors engine/character/info. Also backs
// engine/character/races/model.js and engine/character/skills/model.js,
// which read character.selectRace / character.selectSubRace /
// character.raceModifiers rather than a namespace of their own (there's no
// dedicated "races"/"skills" LABELS key to split out).
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTER = {
  playerName: "Nome do Jogador",
  characterName: "Nome do Personagem",
  sex: "Sexo",
  sexOption: "—",
  sexMale: "Masculino",
  sexFemale: "Feminino",
  age: "Idade",
  weight: "Peso (kg)",
  race: "Raça",
  subRace: "Sub-Raça",
  loadRaces: "Carregar Raças",
  selectRace: "Selecione uma raça",
  selectSubRace: "Selecione uma sub-raça",
  noRace: "Nenhuma",
  raceModifiers: "Modificadores Raciais",
  innate: "Inato",
  enchanted: "Encantado",
  pointsTitle: "Pontos",
  startingPoints: "Pontos Iniciais",
  experiencePoints: "Pontos de Experiência",
};
