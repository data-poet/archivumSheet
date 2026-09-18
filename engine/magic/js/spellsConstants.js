const SPELL_ATTRIBUTE = "IQ";

const COST_TABLES = {
  IQ: {
    F: {
      "-4": 0.5,
      "-3": 0.5,
      "-2": 0.5,
      "-1": 0.5,
      0: 1,
      1: 2,
      2: 4,
      3: 6,
      4: 8,
      5: 10,
      6: 12,
      7: 14,
      8: 16,
      9: 18,
      10: 20,
    },
    M: {
      "-3": 0.5,
      "-2": 1,
      "-1": 2,
      0: 2,
      1: 4,
      2: 6,
      3: 8,
      4: 10,
      5: 12,
      6: 14,
      7: 16,
      8: 18,
      9: 20,
      10: 22,
    },
    D: {
      "-2": 1,
      "-1": 2,
      0: 4,
      1: 6,
      2: 8,
      3: 10,
      4: 12,
      5: 14,
      6: 16,
      7: 18,
      8: 20,
      9: 22,
      10: 24,
    },
    MD: {
      "-2": 2,
      "-1": 4,
      0: 6,
      1: 8,
      2: 10,
      3: 12,
      4: 14,
      5: 16,
      6: 18,
      7: 20,
      8: 22,
      9: 24,
      10: 26,
    },
  },
};

// Only the highest-ranked advantage in the group applies — they're mutually exclusive tiers of the same trait.
const MAGIC_APTITUDE_GROUP = {
  "ADV-063": 1,
  "ADV-064": 2,
  "ADV-065": 3,
};

// Ordered ascending by max; the first threshold the level doesn't exceed wins. Anything above the last entry falls through to SPELL_TIER_DEFAULT.
const SPELL_TIER_THRESHOLDS = [
  { max: 12, tier: "Aprendiz" },
  { max: 15, tier: "Experiente" },
  { max: 17, tier: "Veterano" },
  { max: 19, tier: "Especialista" },
];
const SPELL_TIER_DEFAULT = "Mestre";

module.exports = {
  SPELL_ATTRIBUTE,
  COST_TABLES,
  MAGIC_APTITUDE_GROUP,
  SPELL_TIER_THRESHOLDS,
  SPELL_TIER_DEFAULT,
};
