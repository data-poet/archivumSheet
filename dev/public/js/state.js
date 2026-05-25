// ===== RAW DATA (from API) =====
export const state = {
  data: {
    advantages: [],
    disadvantages: [],
    skills: [],
    spells: [],
    armors: [],
    shields: [],
    melee_weapons: [],
    ranged_weapons: [],
    materials: [],
  },

  // ===== USER SELECTION =====
  selected: {
    advantages: {},
    disadvantages: {},
    skills: {},
    spells: {},
    secondary: {},
    damage: {},
    armors: [],
    shields: [],
    melee_weapons: [],
    ranged_weapons: [],
  },

  // ===== UI STATE =====
  ui: {
    debounceTimer: null,
  },
};
