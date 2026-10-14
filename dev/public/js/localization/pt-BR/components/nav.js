export const NAV = [
  { key: "section-character", label: "Personagem", icon: "👤" },
  { key: "section-attributes", label: "Atributos", icon: "💪" },
  { key: "section-traits", label: "Traços", icon: "🧬" },
  { key: "section-skills", label: "Perícias", icon: "🎯" },
  { key: "section-magic", label: "Magia", icon: "🔮" },
  { key: "section-defense", label: "Defesa", icon: "🛡️" },
  { key: "section-weapons", label: "Armas", icon: "⚔️" },
  { key: "section-magic-gear", label: "Mágicos & Acessórios", icon: "💍" },
  { key: "section-consumables", label: "Consumíveis", icon: "🧪" },
  { key: "section-coins", label: "Moedas", icon: "🪙" },
  { key: "section-custom-items", label: "Itens Livres", icon: "📦" },
  { key: "section-allies", label: "Aliados", icon: "🤝" },
  { key: "section-output", label: "Saída do app", icon: "🧾" },
];

export const GROUPS = {
  ariaLabel: "Grupos de seções",
  items: [
    {
      key: "character",
      label: "Personagem",
      icon: "🧙",
      sections: ["section-character", "section-attributes", "section-traits"],
    },
    {
      key: "abilities",
      label: "Habilidades",
      icon: "✨",
      sections: ["section-skills", "section-magic"],
    },
    {
      key: "equipment",
      label: "Equipamento",
      icon: "🛡️",
      sections: ["section-defense", "section-weapons", "section-magic-gear"],
    },
    {
      key: "inventory",
      label: "Inventário",
      icon: "🎒",
      sections: [
        "section-consumables",
        "section-coins",
        "section-custom-items",
      ],
    },
    {
      key: "misc",
      label: "Misc",
      icon: "⚙️",
      sections: ["section-allies", "section-output"],
    },
  ],
};
