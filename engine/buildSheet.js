const { buildCharacter } = require("./character/buildCharacter");
const { buildInventory } = require("./inventory/buildInventory");
const { resolveAll } = require("./magic/js/spellsResolver");
const { buildGrimoire } = require("./magic/buildGrimoire");
const { computeShieldBlock } = require("./inventory/js/shield/shieldBlock");
const { computeWeaponDamage } = require("./inventory/js/shared/weaponDamage");

function sumObjectValues(obj = {}) {
  return Object.values(obj).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
}

function buildSheet({
  pc = {},
  race = {},
  character = {},
  inventory = {},
} = {}) {
  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 1. INITIAL CHARACTER BUILD
   * ───────────────────────────────────────────────────────────────────────────
   */

  const initialCharacterResult = buildCharacter({
    advantages: character.advantages,
    disadvantages: character.disadvantages,
    primaryAttributes: character.primaryAttributes,
    secondaryAttributes: character.secondaryAttributes,
    skills: character.skills,
    carry_weight: null,
    raceModifiers: race.modifiers || {},
    innateAdvantageIds: race.innate_advantage_ids || [],
    innateDisadvantageIds: race.innate_disadvantage_ids || [],
  });

  const initialCharacter = initialCharacterResult.character;

  const st = initialCharacter.primary_attributes.ST.value;

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 2. INVENTORY LAYER
   * ───────────────────────────────────────────────────────────────────────────
   */

  const inventoryResult = buildInventory({
    ST: st,
    weight: inventory.weight || 0,
    armorInventory: inventory.armor || [],
    shieldInventory: inventory.shield || [],
    meleeInventory: inventory.melee || [],
    rangedInventory: inventory.ranged || [],
    ammoContainerInventory: inventory.ammo_containers || [],
    looseAmmoInventory: inventory.loose_ammo || [],
    alchemyInventory: inventory.alchemy || [],
    survivalGearInventory: inventory.survival_gear || [],
    customInventory: inventory.custom_inventory || [],
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3. FINAL CHARACTER BUILD
   * ───────────────────────────────────────────────────────────────────────────
   */

  const characterResult = buildCharacter({
    advantages: character.advantages,
    disadvantages: character.disadvantages,
    primaryAttributes: character.primaryAttributes,
    secondaryAttributes: character.secondaryAttributes,
    skills: character.skills,
    carry_weight: inventoryResult.inventory.carry_weight,
    raceModifiers: race.modifiers || {},
    innateAdvantageIds: race.innate_advantage_ids || [],
    innateDisadvantageIds: race.innate_disadvantage_ids || [],
  });

  const characterData = characterResult.character;
  const iq = characterData.primary_attributes.IQ.value;

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3.5 SHIELD BLOCK COMPUTATION
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Block depends on the final character skills and DX, so it is computed here
   * after both the character and inventory layers are fully resolved.
   *
   * Each resolved shield (equipped + all storage buckets) receives a `block`
   * field computed by computeShieldBlock.
   */

  const _dxValue = characterData.primary_attributes.DX.value;
  const _skills = characterData.skills || {};
  const _shieldInv = inventoryResult.inventory.shield;

  function _attachBlock(shieldObj) {
    if (!shieldObj) return;
    shieldObj.block = computeShieldBlock(
      shieldObj.shield_id,
      _skills,
      _dxValue,
    );
  }

  _attachBlock(_shieldInv.equipped);
  for (const bucket of ["backpack", "stash", "camp"]) {
    (_shieldInv[bucket] || []).forEach(_attachBlock);
  }

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3.6 WEAPON DAMAGE COMPUTATION
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Depends on the final character base_damage, so it is computed here after
   * both the character and inventory layers are fully resolved.
   *
   * Each resolved melee and ranged instance (all buckets) receives
   * weapon_gdp_damage and/or weapon_bal_damage fields, depending on the
   * weapon's damage type:
   *   - "Perfuração" → weapon_gdp_damage
   *   - "Contusão" or "Corte" → weapon_bal_damage
   * Both can appear simultaneously (e.g. "Corte, Perfuração").
   */

  const _baseDamage = characterData.base_damage;
  const _meleeInv = inventoryResult.inventory.melee;
  const _rangedInv = inventoryResult.inventory.ranged;

  function _attachWeaponDamage(weapon) {
    if (!weapon) return;
    const damages = computeWeaponDamage(
      weapon.weapon_damage_type,
      weapon.weapon_final_gdp_modifier,
      weapon.weapon_final_bal_modifier ?? null,
      _baseDamage,
    );
    if (damages.weapon_gdp_damage !== undefined) {
      weapon.weapon_gdp_damage = damages.weapon_gdp_damage;
    }
    if (damages.weapon_bal_damage !== undefined) {
      weapon.weapon_bal_damage = damages.weapon_bal_damage;
    }
  }

  for (const bucket of ["equipped", "backpack", "stash", "camp"]) {
    (_meleeInv[bucket] || []).forEach(_attachWeaponDamage);
    (_rangedInv[bucket] || []).forEach(_attachWeaponDamage);
  }

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 4. SPELL RESOLUTION
   * ───────────────────────────────────────────────────────────────────────────
   */

  const resolvedSpells = resolveAll({
    spells: character.spells,
    character: { ...characterData, iq },
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 5. GRIMOIRE BUILD
   * ───────────────────────────────────────────────────────────────────────────
   */

  const grimoireResult = buildGrimoire(resolvedSpells.spells, {
    ...characterData,
    iq,
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 6. CHARACTER POINTS SUMMARY
   * ───────────────────────────────────────────────────────────────────────────
   */

  const basePoints = characterResult.character.character_points;

  const characterPoints = {
    primary_attributes: sumObjectValues(basePoints.primary_attributes),
    secondary_attributes: sumObjectValues(basePoints.secondary_attributes),
    skills: basePoints.skills || 0,
    advantages: basePoints.advantages || 0,
    disadvantages: basePoints.disadvantages || 0,
    spells: grimoireResult.character_points.spells || 0,
  };

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 7. FINAL SHEET — pc and race come first
   * ───────────────────────────────────────────────────────────────────────────
   */

  return {
    pc,
    race,
    ...characterResult,
    grimoire: grimoireResult.spells,
    character: {
      ...characterData,
      character_points: characterPoints,
    },
    inventory: inventoryResult.inventory,
  };
}

module.exports = {
  buildSheet,
};
