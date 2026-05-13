// ===== RAW DATA (from API) =====
export const state = {
  data: {
    advantages: [],
    disadvantages: [],
    skills: [],
    spells: [],
    armors: [],
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
  },

  // ===== UI STATE =====
  ui: {
    debounceTimer: null,
  },
};
