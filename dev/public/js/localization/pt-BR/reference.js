// Labels only, keyed by the ids in js/reference/referenceLayout.js. `nav` mirrors the sheet's NAV shape
// so components/nav.js and components/groupNav.js can render it unchanged.
export const REFERENCE = {
  pageTitle: "Referência de Regras",
  topbarTitle: "Archivum — Referência",
  loadError: "Não foi possível carregar este conteúdo.",
  nav: {
    groupsAriaLabel: "Grupos de referência",
    groups: {
      system: { label: "Sistema", short: "Sistema", icon: "🎲" },
      combat: { label: "Combate", short: "Combate", icon: "⚔️" },
      tables: { label: "Tabelas", short: "Tabelas", icon: "📜" },
      house: { label: "Mesa", short: "Mesa", icon: "🏠" },
    },
    sections: {
      "section-reactions": { label: "Reações", icon: "🤝" },
      "section-conditions": { label: "Aflições e Condições", icon: "🩸" },
      "section-combat-rules": { label: "Regras de Combate", icon: "⚔️" },
      "section-maneuvers": { label: "Manobras", icon: "🤺" },
      "section-criticals": { label: "Críticos", icon: "🎯" },
      "section-panic": { label: "Pânico", icon: "😱" },
      "section-homebrew": { label: "Regras do Mestre", icon: "📖" },
    },
  },
  tabs: {
    "tab-reaction-table": "Reações",
    "tab-afflictions-conditions": "Aflições e Condições",
    "tab-combat-rules": "Regras de Combate",
    "tab-combat-hit-locations": "Locais de Acerto",
    "tab-combat-maneuvers": "Manobras",
    "tab-critical-hit-tables": "Acertos Críticos",
    "tab-critical-miss-tables": "Erros Críticos",
    "tab-panic-table": "Pânico",
    "tab-homebrew-rules": "Regras do Mestre",
  },
};
