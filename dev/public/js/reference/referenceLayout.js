// Same shape as js/layout/sheetLayout.js, so groupNav.js and nav.js serve both pages. Labels live in
// localization (reference.js), keyed by these ids; `icon` names an entry in js/shared/icons.js. Each tab renders one markdown file.
// `accent` maps to an --accent-* token (see navigation.css); a group's accent colours its group-bar button.
const CONTENT = "/reference-content";

export const REFERENCE_LAYOUT = [
  {
    group: "character",
    icon: "character",
    accent: "attributes",
    sections: [
      {
        id: "section-attributes",
        icon: "attributes",
        accent: "attributes",
        tabs: [
          {
            id: "tab-attr-primary",
            file: `${CONTENT}/attributes/primary.md`,
          },
          {
            id: "tab-attr-secondary",
            file: `${CONTENT}/attributes/secondary.md`,
          },
          {
            id: "tab-attr-points",
            file: `${CONTENT}/attributes/points_and_buying.md`,
          },
        ],
      },
      {
        id: "section-base-damage",
        icon: "base-damage",
        accent: "attributes",
        tabs: [
          {
            id: "tab-attr-base-damage",
            file: `${CONTENT}/attributes/base_damage.md`,
          },
          {
            id: "tab-attr-resistances",
            file: `${CONTENT}/attributes/elemental_resistances.md`,
          },
        ],
      },
      {
        id: "section-carry",
        icon: "carry",
        accent: "attributes",
        tabs: [
          {
            id: "tab-attr-carry",
            file: `${CONTENT}/attributes/carry_and_movement.md`,
          },
        ],
      },
    ],
  },
  {
    group: "system",
    icon: "system",
    accent: "skills",
    sections: [
      {
        id: "section-tests",
        icon: "success-rolls",
        accent: "skills",
        tabs: [
          {
            id: "tab-success-rolls-basic",
            file: `${CONTENT}/system/success_rolls_basic.md`,
          },
          {
            id: "tab-success-rolls-repeated",
            file: `${CONTENT}/system/success_rolls_repeated.md`,
          },
          {
            id: "tab-success-rolls-contests",
            file: `${CONTENT}/system/success_rolls_contests.md`,
          },
          {
            id: "tab-success-rolls-resistance",
            file: `${CONTENT}/system/success_rolls_resistance.md`,
          },
        ],
      },
      {
        id: "section-reactions",
        icon: "reactions",
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
        icon: "conditions",
        accent: "skills",
        tabs: [
          {
            id: "tab-afflictions-conditions",
            file: `${CONTENT}/effects/afflictions_and_conditions.md`,
          },
          {
            id: "tab-fatigue-healing",
            file: `${CONTENT}/effects/fatigue_and_healing.md`,
          },
        ],
      },
      {
        id: "section-hazards",
        icon: "hazards",
        accent: "skills",
        tabs: [
          {
            id: "tab-hazards",
            file: `${CONTENT}/effects/hazards.md`,
          },
        ],
      },
    ],
  },
  {
    group: "combat",
    icon: "combat",
    accent: "combat",
    sections: [
      {
        id: "section-combat-rules",
        icon: "combat-rules",
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
          {
            id: "tab-damage-types",
            file: `${CONTENT}/combat/damage_types.md`,
          },
        ],
      },
      {
        id: "section-maneuvers",
        icon: "maneuvers",
        accent: "combat",
        tabs: [
          {
            id: "tab-maneuvers-attack-movement",
            file: `${CONTENT}/combat/maneuvers_attack_movement.md`,
          },
          {
            id: "tab-maneuvers-defense",
            file: `${CONTENT}/combat/maneuvers_defense.md`,
          },
          {
            id: "tab-maneuvers-martial",
            file: `${CONTENT}/combat/maneuvers_martial.md`,
          },
        ],
      },
      {
        id: "section-ranged",
        icon: "ranged",
        accent: "combat",
        tabs: [
          {
            id: "tab-ranged-combat",
            file: `${CONTENT}/combat/ranged_combat.md`,
          },
        ],
      },
    ],
  },
  {
    group: "magic",
    icon: "arcana",
    accent: "magic",
    sections: [
      {
        id: "section-spells",
        icon: "spells",
        accent: "magic",
        tabs: [
          {
            id: "tab-magic-grimoire",
            file: `${CONTENT}/magic/grimoire.md`,
          },
          {
            id: "tab-magic-level",
            file: `${CONTENT}/magic/level_and_tier.md`,
          },
        ],
      },
      {
        id: "section-magic",
        icon: "casting",
        accent: "magic",
        tabs: [
          {
            id: "tab-magic-casting",
            file: `${CONTENT}/magic/casting.md`,
          },
        ],
      },
      {
        id: "section-mana-zones",
        icon: "mana-zones",
        accent: "magic",
        tabs: [
          {
            id: "tab-mana-zones",
            file: `${CONTENT}/magic/mana_zones.md`,
          },
        ],
      },
    ],
  },
  {
    group: "tables",
    icon: "tables",
    accent: "inventory",
    sections: [
      {
        id: "section-criticals",
        icon: "criticals",
        accent: "inventory",
        tabs: [
          {
            id: "tab-critical-hit-tables",
            file: `${CONTENT}/tables/critical_hit_tables.md`,
          },
          {
            id: "tab-critical-failures",
            file: `${CONTENT}/tables/critical_failures.md`,
          },
          {
            id: "tab-critical-failures-magic",
            file: `${CONTENT}/tables/critical_failures_magic.md`,
          },
        ],
      },
      {
        id: "section-panic",
        icon: "panic",
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
    icon: "house",
    accent: "traits",
    sections: [
      {
        id: "section-homebrew",
        icon: "homebrew",
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
