export const NAV = [
  { key: "section-character", label: "Personagem", icon: "1️⃣" },
  { key: "section-attributes", label: "Atributos", icon: "2️⃣" },
  { key: "section-traits", label: "Traços", icon: "3️⃣" },
  { key: "section-skills", label: "Perícias", icon: "4️⃣" },
  { key: "section-magic", label: "Magia", icon: "5️⃣" },
  { key: "section-equipment", label: "Equipamento", icon: "6️⃣" },
  { key: "section-inventory", label: "Inventário", icon: "7️⃣" },
  { key: "section-allies", label: "Aliados", icon: "8️⃣" },
  { key: "section-output", label: "Saída do app", icon: "9️⃣" },
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
      sections: ["section-equipment"],
    },
    {
      key: "inventory",
      label: "Inventário",
      icon: "🎒",
      sections: ["section-inventory"],
    },
    {
      key: "misc",
      label: "Misc",
      icon: "⚙️",
      sections: ["section-allies", "section-output"],
    },
  ],
};
