const { buildCharacter } = require("./character/buildCharacter");
const { resolveMetaRaces } = require("./character/js/traits/metaRaces");
const { buildInventory } = require("./inventory/buildInventory");
const { liftingStrength } = require("./inventory/js/carryWeight");
const { resolveAll } = require("./magic/js/spellsResolver");
const { buildGrimoire } = require("./magic/buildGrimoire");
const { SPELL_ATTRIBUTE } = require("./magic/js/spellsConstants");
const { criticalRanges } = require("../helpers/criticalRanges");
const { REFLEXOS_EM_COMBATE_ID } = require("../helpers/ids");
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

function buildSheet({
  pc = {},
  race = {},
  character = {},
  inventory = {},
} = {}) {
  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 0. META-RACE RESOLUTION
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Resolves character.meta_race_ids (e.g. Undead) against db_yrth_meta_races.csv before either
   * character build — same rationale as race: attribute modifiers can shift ST, which the
   * inventory layer needs, so this can't wait until step 2.5 like equipped enchantments do.
   */

  const metaRaces = resolveMetaRaces(character.meta_race_ids || []);

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

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 2. INVENTORY LAYER
   * ───────────────────────────────────────────────────────────────────────────
   */

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

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 2.5 EQUIPPED ENCHANTMENT EFFECTS
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Bridges the inventory layer into the character layer: reads ONLY
   * equipped items' resolved enchantments (accessories, magic gear, armor,
   * shield) and turns them into attribute modifiers, elemental-resistance
   * modifiers, advantage/disadvantage grants, and skill/spell
   * grants+modifiers. Must happen after inventory is built (equipped items
   * aren't known before that) and before the final character build (which
   * needs to consume this).
   *
   * Armor's `equipped` is slot-keyed (one piece per slot, some slots
   * null), unlike accessories/magicGear's flat equipped array — flatten
   * it here before merging. Shield's `equipped` is simpler still: a
   * single object or null (no slot map at all — see shieldConstants.js),
   * so it's just wrapped into a one-item array.
   */

  const equippedAccessories =
    inventoryResult.inventory.accessories?.equipped || [];
  const equippedMagicGear = inventoryResult.inventory.magicGear?.equipped || [];
  const equippedArmor = Object.values(
    inventoryResult.inventory.armor?.equipped || {},
  ).filter(Boolean);
  // Shield's `equipped` is a single object (or null), unlike armor's
  // slot-keyed map — wrap it into a one-item array (or none) before
  // merging, same flattening armor needs, just simpler since there's no
  // slot map to flatten.
  const equippedShield = inventoryResult.inventory.shield?.equipped
    ? [inventoryResult.inventory.shield.equipped]
    : [];
  const enchantmentEffects = collectEquippedEnchantments([
    ...equippedAccessories,
    ...equippedMagicGear,
    ...equippedArmor,
    ...equippedShield,
  ]);

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3. FINAL CHARACTER BUILD
   * ───────────────────────────────────────────────────────────────────────────
   */

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

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3.5 ST-DEPENDENT INVENTORY CORRECTION
   * ───────────────────────────────────────────────────────────────────────────
   *
   * ST-boosting/weakening equipped enchantments (e.g. ENCHANTMENT-000/001,
   * "Fortificar/Enfraquecer ST") are only known after step 2.5, but ranged
   * weapon distances and carry_weight were already resolved in step 2 using
   * the pre-enchantment ST. Re-run the inventory layer with the corrected ST
   * and rebuild the character once more so Movement (which is derived from
   * carry_weight's load level) reflects it too.
   *
   * IQ/DX/HT have no equivalent leak: their only consumers (skills, spells,
   * shield block, weapon damage) all run after this final character build,
   * so they already see enchantment-corrected values with no extra pass.
   *
   * Skipped when ST didn't change — the common case with no ST-affecting
   * gear equipped — so this costs nothing for the vast majority of sheets.
   */

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

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3.6 SHIELD BLOCK COMPUTATION
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Block depends on the final character skills and DX, so it is computed here
   * after both the character and inventory layers are fully resolved.
   *
   * Each resolved shield (equipped + all storage buckets) receives its
   * `skill_check` (Broquel/Escudo, learned or default) and a 4e `block`.
   */

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
  for (const bucket of VALID_STORED_AT) {
    (_shieldInv[bucket] || []).forEach(_attachBlock);
  }

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3.7 WEAPON DAMAGE COMPUTATION
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

  for (const bucket of ALL_BUCKETS) {
    (_meleeInv[bucket] || []).forEach(_attachWeaponDamage);
    (_rangedInv[bucket] || []).forEach(_attachWeaponDamage);
  }

  function _attachSkillCheck(weapon) {
    if (!weapon) return;
    weapon.skill_check = _skillCheck(
      weapon.weapon_skill_id,
      weapon.weapon_min_strength,
    );
  }

  for (const inv of [
    _meleeInv,
    _rangedInv,
    inventoryResult.inventory.firearms,
  ]) {
    for (const bucket of ALL_BUCKETS) {
      (inv?.[bucket] || []).forEach(_attachSkillCheck);
    }
  }

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
      .filter(
        (row) =>
          String(row.skill_is_unarmed).trim().toUpperCase() === "TRUE" &&
          _skills[row.skill_id],
      )
      .map((row) => ({
        ..._skillCheck(row.skill_id),
        damage: _unarmedDamage,
      })),
  ];

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 4. SPELL RESOLUTION
   * ───────────────────────────────────────────────────────────────────────────
   */

  const resolvedSpells = resolveAll({
    spells: character.spells,
    character: { ...characterData, iq },
    enchantmentSpellGrants: enchantmentEffects.spellGrants,
    enchantmentSpellModifiers: enchantmentEffects.spellModifiers,
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
    primary_attributes: basePoints.primary_attributes || 0,
    secondary_attributes: basePoints.secondary_attributes || 0,
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
