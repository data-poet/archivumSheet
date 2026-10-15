// Canonical game terms. Reference markdown links them with [[KEY]] or [[KEY|shown text]]
// (see reference-content/README.md); keys are what the markdown writes, so keep them stable.
export const GLOSSARY = {
  ST: {
    term: "Força",
    definition:
      "Poder físico e massa muscular. Define o dano básico, a carga e entra no cálculo de PV e Toxicidade.",
  },
  DX: {
    term: "Destreza",
    definition:
      "Agilidade e coordenação motora. Base das perícias físicas e de combate; entra na Velocidade Básica.",
  },
  IQ: {
    term: "Inteligência",
    definition:
      "Poder mental. Base das perícias mentais, da Vontade e dos sentidos; entra no cálculo de Mana e Toxicidade.",
  },
  HT: {
    term: "Vitalidade",
    definition:
      "Saúde e vigor. Base dos testes de resistência; entra em PV, Mana, Toxicidade e Velocidade Básica.",
  },
  PV: {
    term: "Pontos de Vida",
    definition:
      "Quanto dano o personagem aguenta. Calculado a partir de HT e ST.",
  },
  PF: {
    term: "Pontos de Fadiga",
    definition:
      "Reserva de energia física. Perdida por esforço, fome, sede e algumas aflições.",
  },
  Mana: {
    term: "Mana",
    definition:
      "Energia mágica para conjurar e sustentar magias. Calculada a partir de IQ e HT.",
  },
  Toxicidade: {
    term: "Toxicidade",
    definition:
      "Limite do corpo para consumir substâncias alquímicas sem efeitos adversos. Calculada a partir de HT, ST e IQ.",
  },
  Vontade: {
    term: "Vontade",
    definition:
      "Resistência a pressão psicológica e ataques sobrenaturais. Começa igual a IQ.",
  },
  Per: {
    term: "Percepção",
    definition:
      "Atenção geral do personagem. Na ficha se divide em Visão, Audição e Olfato, cada um começando igual a IQ.",
  },
  VB: {
    term: "Velocidade Básica",
    definition:
      "Reflexos e rapidez. (HT + DX) / 4, sem arredondar; define a ordem de ação e o Deslocamento.",
  },
  Deslocamento: {
    term: "Deslocamento",
    definition:
      "Metros por segundo que o personagem percorre. Velocidade Básica mais o modificador de carga, arredondado para baixo.",
  },
  Esquiva: {
    term: "Esquiva",
    definition:
      "Defesa ativa para sair do caminho de um ataque. Deslocamento + 4; role 3d6 e tire igual ou menos.",
  },
  NH: {
    term: "Nível de Habilidade",
    definition:
      "O número alvo de um teste de perícia ou atributo. Role 3d6: igual ou menor é sucesso.",
  },
  GDP: {
    term: "Golpe de Ponta",
    definition:
      "Dano básico de estocadas: socos, chutes, mordidas, lanças e floretes. Vem da tabela de dano por ST.",
  },
  BAL: {
    term: "Golpe em Balanço",
    definition:
      "Dano básico de golpes que usam a arma como alavanca: machados, porretes e espadas. Vem da tabela de dano por ST.",
  },
  RD: {
    term: "Resistência a Dano",
    definition:
      "Quanto dano a armadura ou proteção natural absorve antes de atingir o personagem.",
  },
  Carga: {
    term: "Carga",
    definition:
      "Peso carregado em relação à ST. Níveis mais altos reduzem Deslocamento e Esquiva.",
  },
};
