// Translates the persisted/exported sheet shape into the argument shape buildSheet()
// takes. Two vocabularies exist because persistence mirrors the UI's own naming
// (`character.primary`, `inventory.armors`, `inventory.survivalGear`) while the engine has
// its own (`primaryAttributes`, `armor`, `survival_gear`). This module is the only place
// that knows both.
//
// Pure on purpose: the sheet feeds it live state, the allies page feeds it a catalog file,
// and neither path may end up with a private copy of these key names.

// Not `Number(x) || 1` — a literal 0 (immune to this element) is a real value that `||` would erase.
function _raceMultiplier(raw) {
  if (raw === undefined || raw === null || raw === "") return 1;
  const n = Number(raw);
  return Number.isNaN(n) ? 1 : n;
}

function _idList(raw) {
  if (!raw) return [];

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function _modifierMap(source = {}) {
  return Object.fromEntries(
    Object.entries(source).map(([key, data]) => [
      key,
      { modifier: Number(data?.modifier) || 0 },
    ]),
  );
}

// A row from data/db_yrth_races.csv. A stored sheet already holds the result of this
// (export keeps the built `race` object), so only the live sheet needs to call it.
export function toEngineRace(raceRow) {
  if (!raceRow) return {};

  return {
    race_id: raceRow.race_id,
    race_name: raceRow.race_name,
    race_sub_name: raceRow.race_sub_name || null,
    race_physical_maturity: raceRow.race_physical_maturity || null,
    race_mental_maturity: raceRow.race_mental_maturity || null,
    race_life_expectancy: raceRow.race_life_expectancy || null,
    modifiers: {
      ST: Number(raceRow.race_st_modifier) || 0,
      DX: Number(raceRow.race_dx_modifier) || 0,
      IQ: Number(raceRow.race_iq_modifier) || 0,
      HT: Number(raceRow.race_ht_modifier) || 0,
    },
    elemental_modifiers: {
      Fire: _raceMultiplier(raceRow.race_fire_damage_multiplier),
      Water: _raceMultiplier(raceRow.race_water_damage_multiplier),
      Air: _raceMultiplier(raceRow.race_air_damage_multiplier),
      Electricity: _raceMultiplier(raceRow.race_electricity_damage_multiplier),
      Earth: _raceMultiplier(raceRow.race_earth_damage_multiplier),
      Corrosion: _raceMultiplier(raceRow.race_corrossion_damage_multiplier),
      Necrotic: _raceMultiplier(raceRow.race_necrotic_damage_multiplier),
      Holy: _raceMultiplier(raceRow.race_holy_damage_multiplier),
      Void: _raceMultiplier(raceRow.race_void_damage_multiplier),
      Arcane: _raceMultiplier(raceRow.race_arcane_damage_multiplier),
    },
    innate_advantage_ids: _idList(raceRow.race_innate_advantage_id),
    innate_disadvantage_ids: _idList(raceRow.race_innate_disadvantage_id),
    innate_advantage_names: _idList(raceRow.race_innate_advantage_name),
    innate_disadvantage_names: _idList(raceRow.race_innate_disadvantage_name),
  };
}

// `primary` is passed in rather than read from `character.primary` because the live sheet
// keeps the PC's primary attributes in the edit view's inputs, not in state.
export function toEngineCharacter(character = {}, primary = character.primary) {
  return {
    advantages: Object.keys(character.advantages ?? {}),
    disadvantages: Object.keys(character.disadvantages ?? {}),
    primaryAttributes: primary ?? {},

    secondaryAttributes: {
      ...(character.secondary ?? {}),
      damage: _modifierMap(character.damage),
      elementalResistances: _modifierMap(character.resistances),
    },

    // `data.base` is an older persisted spelling of base_value; imported sheets still carry it.
    skills: Object.entries(character.skills ?? {}).map(([skill_id, data]) => ({
      skill_id,
      base_value: Number(data.base_value ?? data.base) || 0,
      modifier: Number(data.modifier) || 0,
      isTrainedWithMaster: Boolean(data.isTrainedWithMaster ?? false),
    })),

    spells: character.spells ?? {},
  };
}

export function toEngineInventory(inventory = {}) {
  return {
    weight: Number(inventory.weight) || 0,
    armor: inventory.armors ?? [],
    shield: inventory.shields ?? [],
    melee: inventory.melee_weapons ?? [],
    ranged: inventory.ranged_weapons ?? [],
    firearms: inventory.firearms ?? [],
    ammo_containers: inventory.ammo_containers ?? [],
    loose_ammo: inventory.loose_ammo ?? [],
    alchemy: inventory.alchemy ?? [],
    survival_gear: inventory.survivalGear ?? [],
    accessories: inventory.accessories ?? [],
    magic_gear: inventory.magicGear ?? [],
    custom_inventory: inventory.customInventory ?? [],
    coins: inventory.coins ?? [],
  };
}

// For a sheet that is already fully persisted — a catalog ally, or an imported file —
// whose `race` is the stored engine-shaped object rather than a CSV row.
export function toEnginePayload({
  pc = {},
  race = {},
  character = {},
  inventory = {},
} = {}) {
  return {
    pc,
    race,
    character: toEngineCharacter(character),
    inventory: toEngineInventory(inventory),
  };
}
