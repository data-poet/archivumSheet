const { buildAdvantages } = require("../character/js/advantages");
const { buildDisadvantages } = require("../character/js/disadvantages");

/**
 * Builds full character sheet from selected IDs
 */
function buildCharacter({ advantages = [], disadvantages = [] }) {
  const advantagesResult = buildAdvantages(advantages);
  const disadvantagesResult = buildDisadvantages(disadvantages);

  return {
    character: {
      advantages: advantagesResult.advantages,
      disadvantages: disadvantagesResult.disadvantages,
      character_points: {
        advantages: advantagesResult.character_points.advantages,
        disadvantages: disadvantagesResult.character_points.disadvantages,
      },
    },
  };
}

module.exports = { buildCharacter };
