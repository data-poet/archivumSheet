// {x} and {list} are filled in by components/thresholds.js.
export const THRESHOLDS = {
  basedOn: "Baseado em HT {x}",
  wounds: "Ferimentos",
  fatigue: "Fadiga",
  effect: "Efeito",
  noEffects: "Sem efeitos no momento",
  hpRows: [
    ["majorWound", "> {x} por golpe", "Ferimento Grave"],
    ["headStun", "> {x} no crânio", "Atordoado"],
    ["reeling", "< {x}", "Desl/Esq ½"],
    ["collapse", "≤ 0", "HT por turno"],
    ["deathChecks", "{list}", "Teste de morte"],
    ["death", "{x}", "Morto"],
    ["destroyed", "{x}", "Destruído"],
  ],
  fpRows: [
    ["exhausted", "< {x}", "Exausto: Desl/Esq/ST ½"],
    ["fpCollapse", "≤ 0", "Vontade para agir"],
    ["unconscious", "{x}", "Inconsciente"],
  ],
  states: {
    hp: {
      reeling: "Desl/Esq ½",
      collapsing: "HT por turno",
      dying: "{x} testes de morte",
      dyingOne: "1 teste de morte",
      dead: "Morto",
      destroyed: "Destruído",
    },
    fp: {
      exhausted: "Exausto: Desl/Esq/ST ½",
      collapsing: "Vontade para agir",
      unconscious: "Inconsciente",
    },
    toxicity: {
      saturado: "Saturado: Perícias -1",
      intoxicado: "Intoxicado: DX/IQ/Perícias -1",
      "envenenamento-leve": "Envenenado (leve)",
      "envenenamento-grave": "Envenenado (grave)",
      "envenenamento-critico": "Incapacitado (envenenamento)",
    },
    mana: {
      "esgotamento-arcano": "Esgotamento Arcano: magias custam PV",
    },
  },
  bar: {
    nextDeathCheck: "próximo teste em {x}",
    deathAt: "morte em {x}",
    unconsciousAt: "inconsciente em {x}",
  },
};
