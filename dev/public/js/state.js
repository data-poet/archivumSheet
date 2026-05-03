// ===== RAW DATA (from API) =====
export const state = {
  data: {
    advantages: [],
    disadvantages: [],
    skills: [],
    spells: [],
  },

  // ===== USER SELECTION =====
  selected: {
    advantages: {},
    disadvantages: {},
    skills: {},
    spells: {},
    secondary: {},
    damage: {},
  },

  // ===== UI STATE =====
  ui: {
    debounceTimer: null,
  },
};
