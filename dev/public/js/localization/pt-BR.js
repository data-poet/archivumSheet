// localization/pt-BR.js

export const LABELS = {
  secondaryAttributes: {
    HP: "PV",
    Mana: "Mana",
    Toxicity: "Toxicidade",
    Will: "Vontade",
    Vision: "Visão",
    Hearing: "Audição",
    Smell: "Olfato",
    BasicSpeed: "Velocidade Básica",
    Movement: "Deslocamento",
    Dodge: "Esquiva",
  },

  inventory: {
    encumbrance: {
      none: "Insignificante",
      light: "Leve",
      medium: "Médio",
      heavy: "Pesado",
      veryHeavy: "Muito Pesado",
      overloaded: "Sobrecarregado",
    },

    carryLimits: {
      none: "Nenhuma",
      light: "Leve",
      medium: "Média",
      heavy: "Pesada",
      veryHeavy: "Muito Pesada",
    },
  },

  storage: {
    backpack: "Mochila",
    stash: "Baú",
    camp: "Acampamento",
    equipped: "Equipado",
  },

  common: {
    empty: "Vazio",
    equip: "Equipar",
    material: "Material",
    weight: "Peso",
    price: "Preço",
    description: "Descrição",
    type: "Tipo",
    name: "Nome",
    tier: "Tier",
    storage: "Armazenamento",
    skill: "Perícia",
    details: "Detalhes",
    source: "Fonte",
    noEquipped: "Nenhum equipado",
    common: "Comum",
    unknown: "Desconhecido",
    mod: "Mod",
    hp: "PV",
    actual: "Atual",
  },

  armor: {
    slot: "Local",
    dr: "RD",
    hp: "PV",
  },

  shield: {
    shield: "Escudo",
    dr: "RD",
    hp: "PV",
    gdpMod: "Mod. GDP",
  },

  melee: {
    melee: "Corpo a Corpo",
    reach: "Alcance",
    minST: "ST Mín.",
    damageType: "Tipo de Dano",
    balMod: "Mod. BAL",
    gdpMod: "Mod. GDP",
    hp: "PV",
  },

  ranged: {
    ranged: "Longo Alcance",
    minST: "ST Mín.",
    damageType: "Tipo de Dano",
    gdpMod: "Mod. GDP",
    halfDist: "½ Dist.",
    maxDist: "Dist. Máx.",
    reload: "Recarga",
    hp: "PV",
    tr: "TR",
    prec: "PREC",
  },

  character: {
    playerName: "Nome do Jogador",
    characterName: "Nome do Personagem",
    sex: "Sexo",
    sexMale: "Masculino",
    sexFemale: "Feminino",
    age: "Idade",
    weight: "Peso (kg)",
    race: "Raça",
    subRace: "Sub-Raça",
    selectRace: "Selecione uma raça",
    selectSubRace: "Selecione uma sub-raça",
    noRace: "Nenhuma",
    raceModifiers: "Modificadores Raciais",
    innate: "Inato",
  },

  traits: {
    advantages: "Vantagens",
    disadvantages: "Desvantagens",
    skills: "Perícias",
    spells: "Magias",
    name: "Nome",
    cost: "Custo",
    type: "Tipo",
    source: "Fonte",
    description: "Descrição",
    attr: "Atributo",
    diff: "Dificuldade",
    base: "Base",
    mod: "Mod",
    final: "Final",
    school: "Escola",
    tier: "Tier",
    spellType: "Tipo",
    spellCost: "Custo",
    cast: "Conjuração",
    target: "Alvo",
    range: "Alcance",
    area: "Área",
    duration: "Duração",
    scaling: "Escalonamento",
    observation: "Observação",
  },
};

export function t(path, fallback = "") {
  return path.split(".").reduce((obj, key) => obj?.[key], LABELS) ?? fallback;
}

export function getSecondaryAttributeLabel(key) {
  return LABELS.secondaryAttributes[key] ?? key;
}

export function getEncumbranceLabel(key) {
  return LABELS.inventory.encumbrance[key] ?? key;
}

export function getCarryLimitLabel(key) {
  return LABELS.inventory.carryLimits[key] ?? key;
}
