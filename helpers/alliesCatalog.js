// The repo-shipped ally catalog. Each file under data/allies/ is a character in the very
// shape the sheet's own export produces ({ version, pc, race, character, inventory }), so
// an ally is authored by building it in the app and exporting it — no separate schema and
// no hand-written JSON.
//
// listAllies() is deliberately separate from getAlly(): the picker only needs a name and a
// race, and shipping every full payload on page load would send the whole catalog at once.

const fs = require("fs");
const path = require("path");

const { loadJSON } = require("./dataUtils.js");

const ALLIES_DIR = path.join(__dirname, "../data/allies");
const ALLY_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

// Which named tier-label list (see localization's allies.tierLists) a type/subtype's
// trailing _NN files resolve to. Subtype overrides type, which overrides the manifest's
// own default — so a new subtype needs no entry at all to inherit its type's list.
const TIER_LOGIC_CONFIG = require("../data/allies/tierLogic.config.json");

// Allies are grouped into type subfolders (data/allies/animals/, data/allies/humanoids/, ...),
// so the id alone doesn't say where the file lives. Built once and cached: a repo ally file
// never moves within a running process.
let _pathsById = null;

function _walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return _walk(full);
    if (!entry.name.endsWith(".json")) return [];

    return [[path.basename(entry.name, ".json"), full]];
  });
}

function _pathsFromDisk() {
  if (_pathsById) return _pathsById;

  _pathsById = new Map(fs.existsSync(ALLIES_DIR) ? _walk(ALLIES_DIR) : []);
  return _pathsById;
}

// Folder nesting is `<type>/[<subtype>/]<id>.json` — one optional level. Derived from the file's
// own path rather than stored in the JSON, so moving a file between folders is the only edit
// needed to change its classification.
function _typeSubtype(file) {
  const segments = path.relative(ALLIES_DIR, file).split(path.sep).slice(0, -1);
  return { type: segments[0] ?? "", subtype: segments[1] ?? null };
}

function _tierList(type, subtype) {
  const bySubtypeKey = subtype ? `${type}/${subtype}` : null;
  return (
    (bySubtypeKey && TIER_LOGIC_CONFIG.bySubtype?.[bySubtypeKey]) ??
    TIER_LOGIC_CONFIG.byType?.[type] ??
    TIER_LOGIC_CONFIG.default
  );
}

// Returns null rather than throwing for an unknown id, so the caller decides the status code.
function getAlly(allyId) {
  // A traversal-safe id check, not cosmetic: allyId arrives straight from the URL.
  if (!allyId || !ALLY_ID_PATTERN.test(allyId)) return null;

  const file = _pathsFromDisk().get(allyId);
  if (!file) return null;

  const { type, subtype } = _typeSubtype(file);
  return { ally_id: allyId, type, subtype, tierList: _tierList(type, subtype), ...loadJSON(file) };
}

function listAllies() {
  return [..._pathsFromDisk().keys()]
    .sort()
    .map((allyId) => {
      const ally = getAlly(allyId);
      if (!ally) return null;

      return {
        ally_id: allyId,
        type: ally.type,
        subtype: ally.subtype,
        tierList: ally.tierList,
        name: ally.pc?.character_name ?? "",
        race: ally.race?.race_sub_name || ally.race?.race_name || "",
        portrait: ally.portrait ?? "",
      };
    })
    .filter(Boolean);
}

module.exports = {
  getAlly,
  listAllies,
  ALLIES_DIR,
};
