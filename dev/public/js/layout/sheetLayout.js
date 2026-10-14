// Structure only: labels and icons live in localization (nav.js, tabs.js), keyed by these ids.
// Array order is render order — for groups in the group bar, for sections on the page and sidebar,
// for tabs in each strip. A section either holds tab panels (`tabs`) or one plain element (`content`).
// `box` picks the panel styling; `accent` maps to an --accent-* token (see navigation.css).
export const SHEET_LAYOUT = [
  {
    group: "character",
    sections: [
      {
        id: "section-character",
        box: "box--character",
        accent: "character",
        tabs: ["tab-char-info", "tab-char-points", "tab-char-image"],
      },
      {
        id: "section-attributes",
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
        box: "box--trait",
        accent: "traits",
        tabs: ["tab-traits-advantages", "tab-traits-disadvantages"],
      },
    ],
  },
  {
    group: "abilities",
    sections: [
      {
        id: "section-skills",
        box: "box--trait",
        accent: "skills",
        tabs: ["tab-skills-list"],
      },
      {
        id: "section-magic",
        box: "box--magic",
        accent: "magic",
        tabs: ["tab-magic-spells"],
      },
    ],
  },
  {
    group: "equipment",
    sections: [
      {
        id: "section-defense",
        box: "box--equip",
        accent: "equipment",
        tabs: ["tab-equip-armor", "tab-equip-shields"],
      },
      {
        id: "section-weapons",
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
        box: "box--equip",
        accent: "equipment",
        tabs: ["tab-magic-gear", "tab-inv-accessories"],
      },
    ],
  },
  {
    group: "inventory",
    sections: [
      {
        id: "section-consumables",
        box: "box--inv",
        accent: "inventory",
        tabs: ["tab-inv-alchemy", "tab-inv-survival"],
      },
      {
        id: "section-coins",
        box: "box--inv",
        accent: "inventory",
        tabs: ["tab-inv-coin"],
      },
      {
        id: "section-custom-items",
        box: "box--inv",
        accent: "inventory",
        tabs: ["tab-inv-custom"],
      },
    ],
  },
  {
    group: "misc",
    sections: [
      { id: "section-allies", content: "ally-add-control" },
      { id: "section-output", content: "output-box" },
    ],
  },
];

export const LAYOUT_SECTIONS = SHEET_LAYOUT.flatMap((group) => group.sections);
