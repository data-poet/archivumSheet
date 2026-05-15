// ===== RAW DATA (from API) =====
export const state = {
  data: {
    advantages: [],
    disadvantages: [],
    skills: [],
    spells: [],
    armors: [],
    shields: [],
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
  },

  // ===== UI STATE =====
  ui: {
    debounceTimer: null,
  },
};
