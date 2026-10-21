const { buildCharacter } = require("./character/buildCharacter");
const { resolveMetaRaces } = require("./character/js/traits/metaRaces");
const { buildInventory } = require("./inventory/buildInventory");
const { liftingStrength } = require("./inventory/js/carryWeight");
const { resolveAll } = require("./magic/js/spellsResolver");
const { buildGrimoire } = require("./magic/buildGrimoire");
const { SPELL_ATTRIBUTE } = require("./magic/js/spellsConstants");
const { criticalRanges } = require("../helpers/criticalRanges");
const { REFLEXOS_EM_COMBATE_ID } = require("../helpers/ids");
const { pickRace } = require("./character/js/traits/races");
const { toBool } = require("../helpers/rowParsers");
const { VALID_STORED_AT, ALL_BUCKETS } = require("../helpers/storage");
const {
  shieldSkillId,
  blockFromLevel,
} = require("./inventory/js/shield/shieldBlock");
const {
  computeWeaponDamage,
  formatDamageString,
} = require("./inventory/js/shared/weaponDamage");
const {
  loadSkillRows,
  resolveSkillCheck,
} = require("./character/js/skills/skillCheck");
const {
  collectEquippedEnchantments,
} = require("./character/js/enchantments/collectEquippedEnchantments");
const {
  applyConditions,
} = require("./character/js/conditions/applyConditions");

function forEachStoredInstance(inventories, buckets, fn) {
  for (const inv of inventories) {
    for (const bucket of buckets) {
      (inv?.[bucket] || []).forEach(fn);
    }
  }
}

function buildSheet({
  pc = {},
  race_id = null,
  race: resolvedRace,
  character = {},
  inventory = {},
} = {}) {
  const race = pickRace({ race_id, race: resolvedRace });

  // Meta-races resolve first: their attribute modifiers can shift ST, which the inventory layer needs.
  const metaRaces = resolveMetaRaces(character.meta_race_ids || []);

  const initialCharacterResult = buildCharacter({
    advantages: character.advantages,
    disadvantages: character.disadvantages,
    primaryAttributes: character.primaryAttributes,
    secondaryAttributes: character.secondaryAttributes,
    skills: character.skills,
    carry_weight: null,
    raceModifiers: race.modifiers || {},
    raceElementalMultipliers: race.elemental_modifiers || {},
    innateAdvantageIds: race.innate_advantage_ids || [],
    innateDisadvantageIds: race.innate_disadvantage_ids || [],
    metaRaceAttributeModifiers: metaRaces.attributeModifiers,
    metaRaceElementalMultipliers: metaRaces.elementalMultipliers,
    metaRaceAdvantageIds: metaRaces.innateAdvantageIds,
    metaRaceDisadvantageIds: metaRaces.innateDisadvantageIds,
  });

  const initialCharacter = initialCharacterResult.character;

  const st = initialCharacter.primary_attributes.ST.value;

  function runInventory(inventoryST, liftingST) {
    return buildInventory({
      ST: inventoryST,
      liftingST,
      weight: inventory.weight || 0,
      armorInventory: inventory.armor || [],
      shieldInventory: inventory.shield || [],
      meleeInventory: inventory.melee || [],
      rangedInventory: inventory.ranged || [],
      firearmsInventory: inventory.firearms || [],
      ammoContainerInventory: inventory.ammo_containers || [],
      looseAmmoInventory: inventory.loose_ammo || [],
      alchemyInventory: inventory.alchemy || [],
      survivalGearInventory: inventory.survival_gear || [],
      accessoryInventory: inventory.accessories || [],
      magicGearInventory: inventory.magic_gear || [],
      customInventory: inventory.custom_inventory || [],
      coinInventory: inventory.coins || [],
    });
  }

  const initialLiftingST = liftingStrength(
    st,
    initialCharacter.secondary_attributes.FP,
  );
  let inventoryResult = runInventory(st, initialLiftingST);

  // Equipped enchantments bridge inventory into character: they need the built inventory and feed the final
  // character build. Armor's equipped is slot-keyed and shield's a single object, so both are flattened first.
  const equippedAccessories =
    inventoryResult.inventory.accessories?.equipped || [];
  const equippedMagicGear = inventoryResult.inventory.magicGear?.equipped || [];
  const equippedArmor = Object.values(
    inventoryResult.inventory.armor?.equipped || {},
  ).filter(Boolean);
  const equippedShield = inventoryResult.inventory.shield?.equipped
    ? [inventoryResult.inventory.shield.equipped]
    : [];
  const enchantmentEffects = collectEquippedEnchantments([
    ...equippedAccessories,
    ...equippedMagicGear,
    ...equippedArmor,
    ...equippedShield,
  ]);

  function runCharacter(carryWeight) {
    return buildCharacter({
      advantages: character.advantages,
      disadvantages: character.disadvantages,
      primaryAttributes: character.primaryAttributes,
      secondaryAttributes: character.secondaryAttributes,
      skills: character.skills,
      carry_weight: carryWeight,
      raceModifiers: race.modifiers || {},
      raceElementalMultipliers: race.elemental_modifiers || {},
      innateAdvantageIds: race.innate_advantage_ids || [],
      innateDisadvantageIds: race.innate_disadvantage_ids || [],
      enchantmentAttributeModifiers: enchantmentEffects.attributeModifiers,
      enchantmentElementalModifiers: enchantmentEffects.elementalModifiers,
      enchantmentAdvantageIds: enchantmentEffects.advantageIds,
      enchantmentDisadvantageIds: enchantmentEffects.disadvantageIds,
      enchantmentSkillGrants: enchantmentEffects.skillGrants,
      enchantmentSkillModifiers: enchantmentEffects.skillModifiers,
      metaRaceAttributeModifiers: metaRaces.attributeModifiers,
      metaRaceElementalMultipliers: metaRaces.elementalMultipliers,
      metaRaceAdvantageIds: metaRaces.innateAdvantageIds,
      metaRaceDisadvantageIds: metaRaces.innateDisadvantageIds,
    });
  }

  let characterResult = runCharacter(inventoryResult.inventory.carry_weight);

  // Equipped ST enchantments are known only after the step above, but ranged distances and carry_weight (hence Movement)
  // were resolved with the base ST: re-run the inventory and the character once when ST changed.
  // IQ/DX/HT need no extra pass, their consumers run after the final character build.
  const correctedST = characterResult.character.primary_attributes.ST.value;
  const correctedLiftingST = liftingStrength(
    correctedST,
    characterResult.character.secondary_attributes.FP,
  );

  if (correctedST !== st || correctedLiftingST !== initialLiftingST) {
    inventoryResult = runInventory(correctedST, correctedLiftingST);
    characterResult = runCharacter(inventoryResult.inventory.carry_weight);
  }

  const characterData = characterResult.character;
  const iq = characterData.primary_attributes[SPELL_ATTRIBUTE].value;

  // Shield block needs the final skills and DX, so it is computed once both layers are resolved.
  const _primary = characterData.primary_attributes;
  const _skills = characterData.skills || {};
  const _hasReflexos =
    REFLEXOS_EM_COMBATE_ID in (characterData.advantages || {});
  const _skillRows = loadSkillRows();

  function _skillCheck(skillId, minStrength = 0) {
    if (!skillId) return null;
    return resolveSkillCheck(skillId, {
      rows: _skillRows,
      skills: _skills,
      primary: _primary,
      hasReflexos: _hasReflexos,
      stPenalty: Math.max(0, minStrength - _primary.ST.value),
    });
  }

  const _shieldInv = inventoryResult.inventory.shield;

  function _attachBlock(shieldObj) {
    if (!shieldObj) return;
    shieldObj.skill_check = _skillCheck(shieldSkillId(shieldObj.shield_id));
    shieldObj.block = blockFromLevel(
      shieldObj.skill_check?.level,
      _hasReflexos,
    );
  }

  _attachBlock(_shieldInv.equipped);
  forEachStoredInstance([_shieldInv], VALID_STORED_AT, _attachBlock);

  // Weapon damage needs the final base damage. "cr"/"cut" get weapon_bal_damage, every other
  // type gets weapon_gdp_damage, and a weapon can have both.
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

  forEachStoredInstance(
    [_meleeInv, _rangedInv],
    ALL_BUCKETS,
    _attachWeaponDamage,
  );

  function _attachSkillCheck(weapon) {
    if (!weapon) return;
    weapon.skill_check = _skillCheck(
      weapon.weapon_skill_id,
      weapon.weapon_min_strength,
    );
  }

  forEachStoredInstance(
    [_meleeInv, _rangedInv, inventoryResult.inventory.firearms],
    ALL_BUCKETS,
    _attachSkillCheck,
  );

  // Punch is thrust-1 and kick is thrust (4e); a skill flagged skill_is_unarmed gets its own row once learned.
  const _gdp = _baseDamage?.GDP;
  const _unarmedDamage = _gdp
    ? {
        punch: formatDamageString(_gdp.dice, _gdp.final_modifier - 1),
        kick: formatDamageString(_gdp.dice, _gdp.final_modifier),
      }
    : null;

  characterData.unarmed = [
    {
      skill_id: null,
      name: null,
      level: _primary.DX.value,
      source: { type: "attribute", attribute: "DX", penalty: 0 },
      st_penalty: 0,
      parry: 3 + Math.floor(_primary.DX.value / 2) + (_hasReflexos ? 1 : 0),
      actions: 1,
      critical: criticalRanges(_primary.DX.value),
      damage: _unarmedDamage,
    },
    ...Object.values(_skillRows)
      .filter((row) => toBool(row.skill_is_unarmed) && _skills[row.skill_id])
      .map((row) => ({
        ..._skillCheck(row.skill_id),
        damage: _unarmedDamage,
      })),
  ];

  const resolvedSpells = resolveAll({
    spells: character.spells,
    character: { ...characterData, iq },
    enchantmentSpellGrants: enchantmentEffects.spellGrants,
    enchantmentSpellModifiers: enchantmentEffects.spellModifiers,
  });

  const grimoireResult = buildGrimoire(resolvedSpells.spells, {
    ...characterData,
    iq,
  });

  applyConditions({
    activeKeys: character.conditions,
    characterData,
    grimoire: grimoireResult.spells,
    inventory: inventoryResult.inventory,
    skillRows: _skillRows,
  });

  const basePoints = characterResult.character.character_points;

  const characterPoints = {
    primary_attributes: basePoints.primary_attributes || 0,
    secondary_attributes: basePoints.secondary_attributes || 0,
    skills: basePoints.skills || 0,
    advantages: basePoints.advantages || 0,
    disadvantages: basePoints.disadvantages || 0,
    spells: grimoireResult.character_points.spells || 0,
  };

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
