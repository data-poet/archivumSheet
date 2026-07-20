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

  // ── Multi-character selector ──────────────────────────────────────────────
  characters: {
    add: "Adicionar Personagem",
    remove: "Remover Personagem",
    replace: "Substituir",
    unnamed: "Sem nome",
    newCharacter: "Novo Personagem",
    namePrompt: "Nome do novo personagem:",
    confirmRemove: "Remover personagem",
    cannotRemoveLast: "Não é possível remover o único personagem.",
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  nav: [
    { key: "section-character", label: "Personagem", icon: "1️⃣" },
    { key: "section-attributes", label: "Atributos", icon: "2️⃣" },
    { key: "section-traits", label: "Traços", icon: "3️⃣" },
    { key: "section-skills", label: "Perícias", icon: "4️⃣" },
    { key: "section-magic", label: "Magia", icon: "5️⃣" },
    { key: "section-equipment", label: "Equipamento", icon: "6️⃣" },
    { key: "section-inventory", label: "Inventário", icon: "7️⃣" },
  ],

  // ── Tab labels (per section) ──────────────────────────────────────────────
  tabs: {
    character: {
      info: "Personagem",
      image: "Imagem",
      resume: "Resumo",
    },
    attributes: {
      primary: "Primários",
      secondary: "Secundários",
      baseDamage: "Dano Base",
    },
    traits: {
      advantages: "Vantagens",
      disadvantages: "Desvantagens",
    },
    skills: {
      skills: "Perícias",
    },
    magic: {
      spells: "Magias",
    },
    equipment: {
      armor: "Armaduras",
      shields: "Escudos",
      melee: "Corpo a Corpo",
      ranged: "À Distância",
      ammo: "Munição",
    },
    inventory: {
      alchemy: "Alquimia",
      survivalGear: "Sobrevivência",
      coinPurse: "Bolsa de Moedas",
      customInventory: "Itens Livres",
    },
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
    weightDetail: "Detalhes de Peso",
    valueTitle: "Valor Carregado",
    valueDetail: "Detalhes de Valor",
    pointsTitle: "Pontos Gastos",
    pointsDetail: "Detalhes de Pontos",
    category: "Categoria",
    points: "Pts",
    primaryAttributes: "Atributos Primários",
    secondaryAttributes: "Atributos Secundários",
    skills: "Perícias",
    advantages: "Vantagens",
    disadvantages: "Desvantagens",
    spells: "Magias",
    total: "Total",
    totalPoints: "Total de Pontos",
    availablePoints: "Disponíveis",
    sparePoints: "Restantes",
    insufficientPoints:
      "Pontos insuficientes — gasto total excede os pontos disponíveis.",
    totalWeight: "Peso Total",
    totalValue: "Valor Total",
    secondarySnapshot: "Atributos Secundários",
    baseWeightLabel: "Peso Base (kg):",
    armorWeight: "Armadura",
    shieldWeight: "Escudo",
    meleeWeight: "Corpo a Corpo",
    rangedWeight: "Longo Alcance",
    alchemyWeight: "Alquimia",
    survivalGearWeight: "Sobrevivência",
    customInventoryWeight: "Inv. Personalizado",
    encumbrance: "Sobrecarga",
    carryLimits: "Limites de Carga",
    coinsCarried: "💰 na mochila",
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
    pointsTitle: "Pontos",
    startingPoints: "Pontos Iniciais",
    experiencePoints: "Pontos de Experiência",
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
    final: "NH Final",
    aptitude: "Aptidão",
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
    parry: "Aparar",
    actions: "Ações",
    trainedWithMaster: "Treinado com Mestre",
    preDef: "Pré-Definido como",
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
    block: "Bloqueio",
  },

  // ── Equipment: Melee ──────────────────────────────────────────────────────
  melee: {
    loadMelee: "Carregar Armas Corpo a Corpo",
    addMelee: "Adicionar Arma Corpo a Corpo",
    melee: "Corpo a Corpo",
    reach: "Alcance",
    minST: "ST Mín.",
    damageType: "Tipo de Dano",
    gdpDmg: "Dano GDP",
    balDmg: "Dano BAL",
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
    gdpDmg: "Dano GDP",
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

  // ── Custom (user-defined) inventory ───────────────────────────────────────
  customInventory: {
    title: "Inventário Personalizado",
    addItem: "Adicionar Item",
    namePlaceholder: "Nome do item",
    weightLabel: "Peso",
    priceLabel: "Preço",
    qtyLabel: "Qtd.",
    qty: "Qtd.",
    descriptionLabel: "Descrição (opcional)",
    description: "Descrição",
    customInventoryWeight: "Inventário Personalizado",
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

  // ── Coin purse ────────────────────────────────────────────────────────────
  coinPurse: {
    title: "Bolsa de Moedas",
    copper: "Cobre",
    silver: "Prata",
    gold: "Ouro",
    qty: "Qtd.",
    weight: "Peso",
    value: "Valor (cobre)",
    location: "Local",
    coinPurseWeight: "Bolsa de Moedas",
    addCoins: "Adicionar",
    selectCoinType: "— Moeda —",
    selectLocation: "— Local —",
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
    comingSoon: "Em desenvolvimento — Poções serão adicionadas aqui.",
  },

  // ── View mode toggle ──────────────────────────────────────────────────────
  viewMode: {
    btnView: "📃 Visualizar",
    btnEdit: "📝 Editar",
    ariaView: "Entrar no modo visualização",
    ariaEdit: "Voltar ao modo edição",
  },

  // ── Theme toggle ────────────────────────────────────────────────────────────
  theme: {
    iconLight: "☀️",
    iconDark: "🌙",
    ariaLight: "Mudar para modo escuro",
    ariaDark: "Mudar para modo claro",
  },

  // ── Character image ───────────────────────────────────────────────────────
  characterImage: {
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

  // ── Output (debug) ────────────────────────────────────────────────────────
  output: {
    title: "Saída",
  },

  // ── Reference page (static rules/consultation page) ────────────────────────
  // Structural config (key/icon/file) is mixed with labels here on purpose,
  // following the same pattern already used by `nav` above. To add a new
  // reference section: add an entry below + its .md files under
  // /reference-content/<section-key-without-prefix>/. No HTML/JS changes needed.
  reference: {
    pageTitle: "Referência de Regras",
    topbarTitle: "Archivum — Referência",
    backToSheet: "Voltar à Ficha",
    openReference: "Abrir referência de regras",
    refButtonLabel: "Ref",
    loadError: "Não foi possível carregar este conteúdo.",
    sections: [
      {
        key: "section-combat",
        label: "Combate",
        icon: "1️⃣",
        tabs: [
          {
            key: "tab-combat-rules",
            label: "Regras de Combate",
            file: "/reference-content/combat/combat_rules.md",
          },
          {
            key: "tab-combat-maneuvers",
            label: "Manobras",
            file: "/reference-content/combat/maneuvers.md",
          },
          {
            key: "tab-combat-hit-locations",
            label: "Locais de Acerto",
            file: "/reference-content/combat/hit_locations.md",
          },
        ],
      },
      {
        key: "tables",
        label: "Tabelas",
        icon: "2️⃣",
        tabs: [
          {
            key: "tab-critical-hit-tables",
            label: "Acertos Críticos",
            file: "/reference-content/tables/critical_hit_tables.md",
          },
          {
            key: "tab-critical-miss-tables",
            label: "Erros Críticos",
            file: "/reference-content/tables/critical_miss_tables.md",
          },
          {
            key: "tab-reaction-table",
            label: "Reações",
            file: "/reference-content/tables/reaction_table.md",
          },
          {
            key: "tab-panic-table",
            label: "Pânico",
            file: "/reference-content/tables/panic_table.md",
          },
        ],
      },
    ],
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
