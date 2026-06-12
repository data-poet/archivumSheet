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
    races: [],
    ammo: [],
    ammo_containers: [],
    alchemy: [],
    survivalGear: [],
    customInventory: [],
  },

  // ===== USER SELECTION =====
  selected: {
    character: {
      player_name: "",
      character_name: "",
      character_sex: "",
      character_age: null,
      character_weight: null,
      race_id: null,
    },
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
    ammo_containers: [],
    loose_ammo: [],
    alchemy: [],
    survivalGear: [],
    customInventory: [],
    coins: [],
  },

  // ===== UI STATE =====
  ui: {
    debounceTimer: null,
  },
};
