/**
 * Traits Effects Builder
 *
 * Produces a normalized "effects" object based on selected traits.
 * This does NOT mutate attributes directly.
 */

const willAdvGroup = {
  "ADV-088": 1,
  "ADV-089": 2,
  "ADV-090": 3,
  "ADV-091": 4,
  "ADV-092": 5,
};

const willDisGroup = {
  "DIS-100": 1,
  "DIS-101": 2,
  "DIS-102": 3,
  "DIS-103": 4,
  "DIS-104": 5,
};

const hearingSingleGroup = {
  "ADV-021": 1,
  "ADV-022": 2,
  "ADV-023": 3,
  "ADV-024": 4,
  "ADV-025": 5,
};

const smellSingleGroup = {
  "ADV-026": 1,
  "ADV-027": 2,
  "ADV-028": 3,
  "ADV-029": 4,
  "ADV-030": 5,
};

const visionSingleGroup = {
  "ADV-037": 1,
  "ADV-038": 2,
  "ADV-039": 3,
  "ADV-040": 4,
  "ADV-041": 5,
};

const fullSenseGroup = {
  "ADV-031": 1,
  "ADV-032": 2,
  "ADV-033": 3,
  "ADV-034": 4,
  "ADV-035": 5,
};

/**
 * Helpers
 */
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

/**
 * Main builder
 */
function buildTraitsEffects({ advantages = [], disadvantages = [] } = {}) {
  const effects = {
    secondary: {},
    primary: {},
    damage: {},
  };

  /**
   * ADVANTAGES
   */

  // DODGE (ADV-055)
  if (advantages.includes("ADV-055")) {
    addEffect(effects, "Dodge", 1);
  }

  // WILL (ADV-088 → ADV-092)
  const willBonus = pickHighest(advantages, willAdvGroup);
  addEffect(effects, "Will", willBonus);

  // HEARING (ADV-021 → ADV-025)
  const hearingBonus = pickHighest(advantages, hearingSingleGroup);
  addEffect(effects, "Hearing", hearingBonus);

  // SMELL (ADV-026 → ADV-030)
  const smellBonus = pickHighest(advantages, smellSingleGroup);
  addEffect(effects, "Smell", smellBonus);

  // VISION (ADV-037 → ADV-041)
  const visionBonus = pickHighest(advantages, visionSingleGroup);
  addEffect(effects, "Vision", visionBonus);

  // FULL SENSE GROUP (ADV-031 → ADV-035)
  const fullSenseBonus = pickHighest(advantages, fullSenseGroup);

  if (fullSenseBonus > 0) {
    addEffect(effects, "Vision", fullSenseBonus);
    addEffect(effects, "Hearing", fullSenseBonus);
    addEffect(effects, "Smell", fullSenseBonus);
  }

  /**
   * DISADVANTAGES
   */

  // WILL penalties (DIS-100 → DIS-104)
  const willPenalty = pickHighest(disadvantages, willDisGroup);
  addEffect(effects, "Will", -willPenalty);

  return effects;
}

module.exports = {
  buildTraitsEffects,
};
