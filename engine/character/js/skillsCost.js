const path = require("path");
const { loadCSV } = require("../../../helpers/dataUtils.js");

let _skillsCache = null;

/**
 * Load skills directly from CSV (single source of truth)
 */
function getAllSkills() {
  if (_skillsCache) return _skillsCache;

  const filePath = path.join(process.cwd(), "data", "db_skills.csv");
  _skillsCache = loadCSV(filePath);

  return _skillsCache;
}

/**
 * Cost tables (unchanged)
 */
const COST_TABLES = {
  DX: {
    F: {
      "-3": 0.5,
      "-2": 0.5,
      "-1": 0.5,
      0: 0.5,
      1: 1,
      2: 2,
      3: 4,
      4: 8,
      5: 16,
      6: 24,
      7: 32,
      8: 40,
      9: 48,
      10: 56,
    },
    M: {
      "-2": 0.5,
      "-1": 1,
      0: 1,
      1: 2,
      2: 4,
      3: 8,
      4: 16,
      5: 24,
      6: 32,
      7: 40,
      8: 48,
      9: 56,
      10: 64,
    },
    D: {
      "-1": 2,
      0: 2,
      1: 4,
      2: 8,
      3: 16,
      4: 24,
      5: 32,
      6: 40,
      7: 48,
      8: 56,
      9: 64,
      10: 72,
    },
    MD: {
      0: 4,
      1: 8,
      2: 16,
      3: 24,
      4: 32,
      5: 40,
      6: 48,
      7: 56,
      8: 64,
      9: 72,
      10: 80,
    },
  },

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

/**
 * Relative level
 */
function getRelativeLevel(base, level) {
  return level - base;
}

/**
 * Unified cost function
 */
function getSkillCost({ attribute = "DX", base = 0, level = 0, difficulty }) {
  const relative = getRelativeLevel(base, level);

  const table = COST_TABLES[attribute]?.[difficulty];
  if (!table) return 0;

  const clamped = Math.max(-4, Math.min(10, relative));

  return table[clamped] ?? 0;
}

module.exports = {
  getAllSkills, // now lives here
  getSkillCost,
  getRelativeLevel,
  COST_TABLES,
};
