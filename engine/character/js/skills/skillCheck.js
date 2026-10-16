const { toList } = require("../../../../helpers/rowParsers.js");
const { loadDataset } = require("../../../../helpers/datasets.js");
const { criticalRanges } = require("../../../../helpers/criticalRanges.js");

const DIFFICULTY_DEFAULT_PENALTY = { F: 4, M: 5, D: 6 };

// An empty skill_parry_modifier means the skill can't parry; otherwise it's a flat 4e bonus (e.g. Bastão +2, Faca -1).
function computeParry(row, level, hasReflexos) {
  const raw = row?.skill_parry_modifier;
  if (level == null || raw == null || String(raw).trim() === "") return null;
  return 3 + Math.floor(level / 2) + Number(raw) + (hasReflexos ? 1 : 0);
}

function parseSkillDefaults(text = "") {
  return toList(text, ";")
    .map((entry) => {
      const [skillId, penalty] = entry.split(":");
      return { skillId: skillId.trim(), penalty: Number(penalty) };
    })
    .filter(({ skillId, penalty }) => skillId && !Number.isNaN(penalty));
}

function loadSkillRows() {
  const rows = loadDataset("SKILLS");
  return Object.fromEntries(rows.map((row) => [row.skill_id, row]));
}

// Best of: related skills the character knows (skill_defaults) and the 4e difficulty default on the base attribute.
function defaultLevel(row, skills, primary) {
  const candidates = parseSkillDefaults(row.skill_defaults)
    .filter(({ skillId }) => skills[skillId])
    .map(({ skillId, penalty }) => ({
      level: skills[skillId].value + penalty,
      source: { type: "skill", skill_id: skillId, penalty },
    }));

  const penalty = DIFFICULTY_DEFAULT_PENALTY[row.skill_difficulty];
  const attribute = row.skill_base_attribute || "DX";
  const attributeValue = primary?.[attribute]?.value;
  if (penalty != null && attributeValue != null) {
    candidates.push({
      level: attributeValue - penalty,
      source: { type: "attribute", attribute, penalty: -penalty },
    });
  }

  return candidates.reduce(
    (best, candidate) =>
      best === null || candidate.level > best.level ? candidate : best,
    null,
  );
}

function resolveSkillCheck(
  skillId,
  { rows, skills = {}, primary = {}, hasReflexos = false, stPenalty = 0 },
) {
  const row = rows[skillId];
  if (!row) return null;

  const learned = skills[skillId];
  const resolved = learned
    ? { level: learned.value, source: { type: "learned" } }
    : defaultLevel(row, skills, primary);

  if (!resolved) {
    return {
      skill_id: skillId,
      name: row.skill_name,
      level: null,
      source: { type: "none" },
      st_penalty: 0,
      parry: null,
      actions: null,
      critical: null,
    };
  }

  const level = resolved.level - stPenalty;
  return {
    skill_id: skillId,
    name: row.skill_name,
    level,
    source: resolved.source,
    st_penalty: stPenalty,
    parry: computeParry(row, level, hasReflexos),
    actions: learned?.actions ?? 1,
    critical: criticalRanges(level),
  };
}

module.exports = {
  computeParry,
  parseSkillDefaults,
  loadSkillRows,
  resolveSkillCheck,
};
