// ===== RAW DATA (from API) =====
export const state = {
  data: {
    advantages: [],
    disadvantages: [],
    skills: [],
    spells: [],
    armors: [],
    shields: [],
    melee_weapons: [],   // normalized: was "melee" in original state but "melee_weapons" everywhere else
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
  },

  // ===== UI STATE =====
  ui: {
    debounceTimer: null,
  },
};
