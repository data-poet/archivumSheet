// localization/pt-BR.js
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for ALL visible text in the application.
// To add a new language, duplicate this file (e.g. en-US.js) and swap the
// import in main.js:  import { LABELS } from "./localization/en-US.js";
// ─────────────────────────────────────────────────────────────────────────────

export const LABELS = {
  // ── App meta ──────────────────────────────────────────────────────────────
  app: {
    title: "Archivum Sheet",
    menuOpen: "Abrir menu",
    menuClose: "Fechar menu",
    export: "Exportar",
    exportTitle: "Exportar Ficha",
    import: "Importar",
    importTitle: "Importar Ficha",
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  nav: {
    character: "Personagem",
    traits: "Traços",
    skills: "Perícias",
    magic: "Magia",
    equipment: "Equipamento",
    inventory: "Inventário",
  },

  // ── Sections / headings ───────────────────────────────────────────────────
  sections: {
    character: "Personagem",
    characterInfo: "Informações",
    race: "Raça",
    attributes: "Atributos",
    primaryAttributes: "Atributos Primários",
    secondaryAttributes: "Atributos Secundários",
    baseDamage: "Dano Base",
    traits: "Traços",
    advantages: "Vantagens",
    disadvantages: "Desvantagens",
    skills: "Perícias",
    magic: "Magia",
    spells: "Magias",
    equipment: "Equipamento",
    armor: "Armaduras",
    shields: "Escudos",
    melee: "Armas Corpo a Corpo",
    ranged: "Armas de Longo Alcance",
    munition: "Munição",
    inventory: "Inventário",
    potions: "Poções",
    survivalGear: "Equipamento de Sobrevivência",
    freeInventory: "Inventário Livre",
    output: "Saída",
    equipped: "Equipado",
    stored: "Armazenado",
  },

  // ── Resume / Summary panel ────────────────────────────────────────────────
  resume: {
    title: "Resumo do Personagem",
    weightTitle: "Peso Carregado",
    pointsTitle: "Pontos Gastos",
    category: "Categoria",
    points: "Pts",
    primaryAttributes: "Atributos Primários",
    secondaryAttributes: "Atributos Secundários",
    skills: "Perícias",
    advantages: "Vantagens",
    disadvantages: "Desvantagens",
    spells: "Magias",
    total: "Total",
    baseWeightLabel: "Peso Base (kg):",
    armorWeight: "Armadura",
    shieldWeight: "Escudo",
    meleeWeight: "Corpo a Corpo",
    rangedWeight: "Longo Alcance",
    alchemyWeight: "Alquimia",
    survivalGearWeight: "Sobrevivência",
    totalWeight: "Peso Total",
    encumbrance: "Sobrecarga",
    carryLimits: "Limites de Carga",
  },

  // ── Attributes table headers ───────────────────────────────────────────────
  attributes: {
    attribute: "Atributo",
    base: "Base",
    race: "Raça",
    modifier: "Modificador",
    actual: "Atual",
    bought: "Comprado",
    final: "Final",
    type: "Tipo",
    dice: "Dados",
    baseMod: "Mod. Base",
  },

  // ── Character info fields ──────────────────────────────────────────────────
  character: {
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
  },

  // ── Secondary attributes ──────────────────────────────────────────────────
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

  // ── Traits (advantages, disadvantages, skills, spells) ────────────────────
  traits: {
    loadAdvantages: "Carregar Vantagens",
    loadDisadvantages: "Carregar Desvantagens",
    loadSkills: "Carregar Perícias",
    addAdvantage: "Adicionar",
    addDisadvantage: "Adicionar",
    addSkill: "Adicionar",
    typeFilter: "— Tipo —",
    categoryFilter: "— Categoria —",
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

  // ── Magic ─────────────────────────────────────────────────────────────────
  magic: {
    loadSpells: "Carregar Magias",
    addSpell: "Adicionar",
    schoolFilter: "— Escola —",
  },

  // ── Common / shared ───────────────────────────────────────────────────────
  common: {
    details: "Detalhes",
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
    source: "Fonte",
    noEquipped: "Nenhum equipado",
    common: "Comum",
    unknown: "Desconhecido",
    mod: "Mod",
    hp: "PV",
    actual: "Atual",
    add: "Adicionar",
    remove: "Remover",
  },

  // ── Equipment: Armor ──────────────────────────────────────────────────────
  armor: {
    loadArmors: "Carregar Armaduras",
    addArmor: "Adicionar Armadura",
    slot: "Local",
    dr: "RD",
    hp: "PV",
    slotFilter: "— Local —",
  },

  // ── Equipment: Shield ─────────────────────────────────────────────────────
  shield: {
    loadShields: "Carregar Escudos",
    addShield: "Adicionar Escudo",
    shield: "Escudo",
    dr: "RD",
    hp: "PV",
    gdpMod: "Mod. GDP",
  },

  // ── Equipment: Melee ──────────────────────────────────────────────────────
  melee: {
    loadMelee: "Carregar Armas Corpo a Corpo",
    addMelee: "Adicionar Arma Corpo a Corpo",
    melee: "Corpo a Corpo",
    reach: "Alcance",
    minST: "ST Mín.",
    damageType: "Tipo de Dano",
    balMod: "Mod. BAL",
    gdpMod: "Mod. GDP",
    hp: "PV",
  },

  // ── Equipment: Ranged ─────────────────────────────────────────────────────
  ranged: {
    loadRanged: "Carregar Armas de Longo Alcance",
    addRanged: "Adicionar Arma de Longo Alcance",
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

  // ── Survival Gear ─────────────────────────────────────────────────────────
  survivalGear: {
    loadSurvivalGear: "Carregar Equipamentos",
    addSurvivalGear: "Adicionar",
    title: "Equipamento de Sobrevivência",
    typeFilter: "— Tipo —",
    qty: "Qtd.",
    observation: "Observação",
    survivalGearWeight: "Sobrevivência",
  },

  // ── Alchemy consumables ───────────────────────────────────────────────────
  alchemy: {
    loadAlchemy: "Carregar Alquimia",
    addAlchemy: "Adicionar",
    title: "Alquimia",
    typeFilter: "— Tipo —",
    noEntries: "Nenhum consumível adicionado",
    qty: "Qtd.",
    type: "Tipo",
    category: "Categoria",
    tier: "Tier",
    duration: "Duração",
    effect: "Efeito",
    toxicity: "Toxicidade",
    method: "Método",
    effectArea: "Área de Efeito",
    description: "Descrição",
    observation: "Observação",
    alchemyWeight: "Alquimia",
  },

  // ── Equipment: Ammo ───────────────────────────────────────────────────────
  ammo: {
    loadAmmo: "Carregar Munição",
    addContainer: "Adicionar Aljava",
    addLooseAmmo: "Adicionar Solta",
    addAmmo: "Adicionar",
    containers: "Aljavas",
    looseAmmo: "Munição Solta",
    noContainers: "Nenhuma aljava adicionada",
    containerFull: "Aljava cheia",
    notCarriable: "Não carregável",
    capacity: "Capacidade",
    qty: "Qtd.",
    ammoType: "— Tipo —",
    selectContainer: "— Aljava —",
    selectAmmo: "— Munição —",
    equippedAmmo: "Munição Equipada",
    ammoWeight: "Munição",
    category: "Categoria",
    price: "Preço",
    weight: "Peso",
    effect: "Efeito",
    description: "Descrição",
  },

  // ── Storage locations ─────────────────────────────────────────────────────
  storage: {
    backpack: "Mochila",
    stash: "Baú",
    camp: "Acampamento",
    equipped: "Equipado",
  },

  // ── Encumbrance ───────────────────────────────────────────────────────────
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
    comingSoon:
      "Em desenvolvimento — Poções e Inventário Livre serão adicionados aqui.",
  },

  // ── Output (debug) ────────────────────────────────────────────────────────
  output: {
    title: "Saída",
  },
};

// ── Accessor helpers ──────────────────────────────────────────────────────────

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
