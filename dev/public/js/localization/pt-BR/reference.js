// Structural config (key/icon/file) is mixed with labels on purpose, as with `nav` — add a section here plus its .md files under /reference-content/<key>/, no HTML/JS changes needed.
export const REFERENCE = {
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
    {
      key: "homebrew",
      label: "Homebrew",
      icon: "3️⃣",
      tabs: [
        {
          key: "homebrew-rules",
          label: "Regras do Mestre",
          file: "/reference-content/homebrew/homebrew_rules.md",
        },
      ],
    },
  ],
};
