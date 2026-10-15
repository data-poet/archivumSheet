const {
  WILL_BONUS_TIERS: willAdvGroup,
  WILL_PENALTY_TIERS: willDisGroup,
  HEARING_BONUS_TIERS: hearingSingleGroup,
  SMELL_BONUS_TIERS: smellSingleGroup,
  VISION_BONUS_TIERS: visionSingleGroup,
  FULL_SENSE_BONUS_TIERS: fullSenseGroup,
  REFLEXOS_EM_COMBATE_ID,
} = require("../../../../helpers/ids.js");

function pickHighest(ids, map) {
  let max = 0;

  for (const id of ids) {
    if (map[id] && map[id] > max) {
      max = map[id];
    }
  }

  return max;
}

function addEffect(effects, path, value) {
  if (value === 0 || value == null) return;

  if (!effects.secondary[path]) {
    effects.secondary[path] = {};
  }

  effects.secondary[path].base = (effects.secondary[path].base ?? 0) + value;
}

function buildTraitsEffects({ advantages = [], disadvantages = [] } = {}) {
  const effects = {
    secondary: {},
    primary: {},
    damage: {},
  };

  const advantageIds = Object.keys(advantages);
  const disadvantageIds = Object.keys(disadvantages);

  if (advantageIds.includes(REFLEXOS_EM_COMBATE_ID)) {
    addEffect(effects, "Dodge", 1);
  }

  const willBonus = pickHighest(advantageIds, willAdvGroup);
  addEffect(effects, "Will", willBonus);

  const hearingBonus = pickHighest(advantageIds, hearingSingleGroup);
  addEffect(effects, "Hearing", hearingBonus);

  const smellBonus = pickHighest(advantageIds, smellSingleGroup);
  addEffect(effects, "Smell", smellBonus);

  const visionBonus = pickHighest(advantageIds, visionSingleGroup);
  addEffect(effects, "Vision", visionBonus);

  const fullSenseBonus = pickHighest(advantageIds, fullSenseGroup);

  if (fullSenseBonus > 0) {
    addEffect(effects, "Vision", fullSenseBonus);
    addEffect(effects, "Hearing", fullSenseBonus);
    addEffect(effects, "Smell", fullSenseBonus);
  }

  const willPenalty = pickHighest(disadvantageIds, willDisGroup);
  addEffect(effects, "Will", -willPenalty);

  return effects;
}

module.exports = {
  buildTraitsEffects,
};
