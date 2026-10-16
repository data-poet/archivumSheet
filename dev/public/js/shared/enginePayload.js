// Translates the persisted/exported sheet shape into the argument shape buildSheet()
// takes. Two vocabularies exist because persistence mirrors the UI's own naming
// (`character.primary`, `inventory.armors`, `inventory.survivalGear`) while the engine has
// its own (`primaryAttributes`, `armor`, `survival_gear`). This module is the only place
// that knows both.
//
// Pure on purpose: the sheet feeds it live state, ally rendering feeds it a catalog file,
// and neither path may end up with a private copy of these key names.

function _modifierMap(source = {}) {
  return Object.fromEntries(
    Object.entries(source).map(([key, data]) => [
      key,
      { modifier: Number(data?.modifier) || 0 },
    ]),
  );
}

// `primary` is passed in rather than read from `character.primary` because the live sheet
// keeps the PC's primary attributes in the edit view's inputs, not in state.
export function toEngineCharacter(character = {}, primary = character.primary) {
  return {
    advantages: Object.keys(character.advantages ?? {}),
    disadvantages: Object.keys(character.disadvantages ?? {}),
    meta_race_ids: character.meta_race_ids ?? [],
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
// A sheet or ally file carries a `race` snapshot: the engine reads the race from the dataset when it has it
// and falls back to the snapshot for a custom race.
export function toEnginePayload({
  pc = {},
  race = {},
  race_id = race?.race_id ?? null,
  character = {},
  inventory = {},
} = {}) {
  return {
    pc,
    race,
    race_id,
    character: toEngineCharacter(character),
    inventory: toEngineInventory(inventory),
  };
}
