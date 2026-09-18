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

function _allyPath(allyId) {
  return path.join(ALLIES_DIR, `${allyId}.json`);
}

function _idsFromDisk() {
  if (!fs.existsSync(ALLIES_DIR)) return [];

  return fs
    .readdirSync(ALLIES_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"))
    .sort();
}

// Returns null rather than throwing for an unknown id, so the caller decides the status code.
function getAlly(allyId) {
  // A traversal-safe id check, not cosmetic: allyId arrives straight from the URL.
  if (!allyId || !ALLY_ID_PATTERN.test(allyId)) return null;

  const file = _allyPath(allyId);
  if (!fs.existsSync(file)) return null;

  return { ally_id: allyId, ...loadJSON(file) };
}

function listAllies() {
  return _idsFromDisk()
    .map((allyId) => {
      const ally = getAlly(allyId);
      if (!ally) return null;

      return {
        ally_id: allyId,
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
