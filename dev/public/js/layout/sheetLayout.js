// Structure only: labels live in localization (nav.js, tabs.js), keyed by these ids.
// Array order is render order — for groups in the group bar, for sections on the page and sidebar,
// for tabs in each strip. A section either holds tab panels (`tabs`) or one plain element (`content`).
// `box` picks the panel styling; `accent` maps to an --accent-* token (see navigation.css);
// `icon` names an entry in js/shared/icons.js.
export const SHEET_LAYOUT = [
  {
    group: "character",
    icon: "character",
    sections: [
      {
        id: "section-character",
        icon: "profile",
        box: "box--character",
        accent: "character",
        tabs: ["tab-char-info", "tab-char-points", "tab-char-image"],
      },
      {
        id: "section-attributes",
        icon: "attributes",
        box: "box--attr",
        accent: "attributes",
        tabs: [
          "tab-attr-primary",
          "tab-attr-secondary",
          "tab-attr-damage",
          "tab-attr-resistances",
        ],
      },
      {
        id: "section-traits",
        icon: "traits",
        box: "box--trait",
        accent: "traits",
        tabs: ["tab-traits-advantages", "tab-traits-disadvantages"],
      },
    ],
  },
  {
    group: "abilities",
    icon: "abilities",
    sections: [
      {
        id: "section-skills",
        icon: "skills",
        box: "box--trait",
        accent: "skills",
        tabs: ["tab-skills-list"],
      },
      {
        id: "section-magic",
        icon: "magic",
        box: "box--magic",
        accent: "magic",
        tabs: ["tab-magic-spells"],
      },
    ],
  },
  {
    group: "equipment",
    icon: "equipment",
    sections: [
      {
        id: "section-defense",
        icon: "defense",
        box: "box--equip",
        accent: "equipment",
        tabs: ["tab-equip-armor", "tab-equip-shields"],
      },
      {
        id: "section-weapons",
        icon: "weapons",
        box: "box--equip",
        accent: "equipment",
        tabs: [
          "tab-equip-melee",
          "tab-equip-ranged",
          "tab-equip-firearms",
          "tab-equip-ammo",
        ],
      },
      {
        id: "section-magic-gear",
        icon: "magic-gear",
        box: "box--equip",
        accent: "equipment",
        tabs: ["tab-magic-gear", "tab-inv-accessories"],
      },
    ],
  },
  {
    group: "inventory",
    icon: "inventory",
    sections: [
      {
        id: "section-consumables",
        icon: "consumables",
        box: "box--inv",
        accent: "inventory",
        tabs: ["tab-inv-alchemy", "tab-inv-survival"],
      },
      {
        id: "section-coins",
        icon: "coins",
        box: "box--inv",
        accent: "inventory",
        tabs: ["tab-inv-coin"],
      },
      {
        id: "section-custom-items",
        icon: "custom-items",
        box: "box--inv",
        accent: "inventory",
        tabs: ["tab-inv-custom"],
      },
    ],
  },
  {
    group: "misc",
    icon: "misc",
    sections: [
      { id: "section-allies", icon: "allies", content: "ally-add-control" },
      { id: "section-output", icon: "output", content: "output-box" },
    ],
  },
];

export const LAYOUT_SECTIONS = SHEET_LAYOUT.flatMap((group) => group.sections);
