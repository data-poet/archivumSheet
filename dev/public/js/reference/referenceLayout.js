// Same shape as js/layout/sheetLayout.js, so groupNav.js and nav.js serve both pages. Labels and icons
// live in localization (reference.js), keyed by these ids. Each tab renders one markdown file.
// `accent` maps to an --accent-* token (see navigation.css); a group's accent colours its group-bar button.
const CONTENT = "/reference-content";

export const REFERENCE_LAYOUT = [
  {
    group: "system",
    accent: "skills",
    sections: [
      {
        id: "section-reactions",
        accent: "skills",
        tabs: [
          {
            id: "tab-reaction-table",
            file: `${CONTENT}/tables/reaction_table.md`,
          },
        ],
      },
      {
        id: "section-conditions",
        accent: "skills",
        tabs: [
          {
            id: "tab-afflictions-conditions",
            file: `${CONTENT}/effects/afflictions_and_conditions.md`,
          },
        ],
      },
    ],
  },
  {
    group: "combat",
    accent: "combat",
    sections: [
      {
        id: "section-combat-rules",
        accent: "combat",
        tabs: [
          {
            id: "tab-combat-rules",
            file: `${CONTENT}/combat/combat_rules.md`,
          },
          {
            id: "tab-combat-hit-locations",
            file: `${CONTENT}/combat/hit_locations.md`,
          },
        ],
      },
      {
        id: "section-maneuvers",
        accent: "combat",
        tabs: [
          {
            id: "tab-combat-maneuvers",
            file: `${CONTENT}/combat/maneuvers.md`,
          },
        ],
      },
    ],
  },
  {
    group: "tables",
    accent: "inventory",
    sections: [
      {
        id: "section-criticals",
        accent: "inventory",
        tabs: [
          {
            id: "tab-critical-hit-tables",
            file: `${CONTENT}/tables/critical_hit_tables.md`,
          },
          {
            id: "tab-critical-miss-tables",
            file: `${CONTENT}/tables/critical_miss_tables.md`,
          },
        ],
      },
      {
        id: "section-panic",
        accent: "inventory",
        tabs: [
          {
            id: "tab-panic-table",
            file: `${CONTENT}/tables/panic_table.md`,
          },
        ],
      },
    ],
  },
  {
    group: "house",
    accent: "traits",
    sections: [
      {
        id: "section-homebrew",
        accent: "traits",
        tabs: [
          {
            id: "tab-homebrew-rules",
            file: `${CONTENT}/homebrew/homebrew_rules.md`,
          },
        ],
      },
    ],
  },
];

export const REFERENCE_SECTIONS = REFERENCE_LAYOUT.flatMap(
  ({ sections }) => sections,
);
