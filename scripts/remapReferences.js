// Repoints the id references between datasets after a dataset was renumbered or reordered. Rows are matched
// by their stable key: the ids of the committed version (HEAD) are compared with the ids in the working
// file, and every cell that referenced an old id is rewritten to the new one.
//
//   node scripts/remapReferences.js SKILLS ADVANTAGES            dry run: report what would change
//   node scripts/remapReferences.js SKILLS ADVANTAGES --write    rewrite the referencing CSVs
//   --force    also remap referencing CSVs that differ from HEAD (they are skipped by default)
//
// Run it after exporting the renumbered dataset (and `npm run data:format`), then `npm run check:data`.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { DATASETS, datasetPath } = require("../helpers/datasets.js");
const { ID_COLUMN, KEY_COLUMN } = require("../helpers/datasetColumns.js");
const {
  REFERENCES,
  idsInCell,
  mapIdsInCell,
} = require("../helpers/datasetReferences.js");
const { parseCsvText, serializeCsv } = require("../helpers/csvText.js");

const ROOT = path.join(__dirname, "..");

// The data of a CSV, ignoring formatting and key columns, for telling whether a dataset was really edited.
function contentOf(text) {
  const [header, ...records] = parseCsvText(text);
  const keep = header
    .map((column, at) => ({ column, at }))
    .filter(({ column }) => !column.endsWith("_key"));
  return JSON.stringify([
    keep.map(({ column }) => column),
    ...records
      .filter((record) => record.some((cell) => cell !== ""))
      .map((record) => keep.map(({ at }) => (record[at] ?? "").trim())),
  ]);
}

function rowsOf(text) {
  const [header, ...records] = parseCsvText(text);
  return {
    header,
    records: records.filter((record) => record.some((cell) => cell !== "")),
  };
}

// Old id -> new id for the rows whose key is in both versions and whose id changed.
function buildIdMap(dataset, oldText, newText) {
  const readIds = (text) => {
    const { header, records } = rowsOf(text);
    const keyAt = header.indexOf(KEY_COLUMN[dataset]);
    const idAt = header.indexOf(ID_COLUMN[dataset]);
    if (keyAt === -1) {
      throw new Error(
        `${dataset} has no ${KEY_COLUMN[dataset]} column; add the keys (scripts/generateKeys.js) before remapping`,
      );
    }
    return new Map(records.map((record) => [record[keyAt], record[idAt]]));
  };

  const before = readIds(oldText);
  const after = readIds(newText);
  const mapping = new Map();
  const removed = [];
  before.forEach((oldId, key) => {
    if (!after.has(key)) removed.push({ key, id: oldId });
    else if (after.get(key) !== oldId) mapping.set(oldId, after.get(key));
  });
  const added = [...after.keys()].filter((key) => !before.has(key));
  return { mapping, removed, added };
}

// Rewrites, in one referencing CSV, every reference column that points at a remapped dataset.
function remapCsv(text, columns, mappings) {
  const rows = parseCsvText(text);
  const [header, ...records] = rows;
  let changedCells = 0;
  const dangling = [];

  columns.forEach(({ column, target }) => {
    const at = header.indexOf(column);
    const { mapping, removed } = mappings[target];
    const removedIds = new Set(removed.map((entry) => entry.id));
    if (at === -1) return;
    records.forEach((record) => {
      const cell = record[at] ?? "";
      idsInCell(cell)
        .filter((id) => removedIds.has(id))
        .forEach((id) => dangling.push({ column, id }));
      const remapped = mapIdsInCell(cell, (id) => mapping.get(id));
      if (remapped !== cell) {
        record[at] = remapped;
        changedCells += 1;
      }
    });
  });

  return { text: serializeCsv([header, ...records]), changedCells, dangling };
}

// `readOld` and `readNew` give a dataset's CSV text before and after the renumbering. A referencing
// dataset that was itself re-exported (its text differs from `readOld`) already carries the ids its author
// chose, so it is skipped unless it is one of the renumbered targets (a self-reference such as skill_defaults).
function planRemap(
  targets,
  { readOld, readNew, readReferencing, skipReexported = false },
) {
  const mappings = Object.fromEntries(
    targets.map((dataset) => [
      dataset,
      buildIdMap(dataset, readOld(dataset), readNew(dataset)),
    ]),
  );

  const byDataset = new Map();
  REFERENCES.filter(({ target }) => targets.includes(target)).forEach(
    (reference) => {
      byDataset.set(reference.dataset, [
        ...(byDataset.get(reference.dataset) ?? []),
        reference,
      ]);
    },
  );

  const skipped = [];
  const files = [];
  byDataset.forEach((columns, dataset) => {
    const reexported =
      skipReexported &&
      !targets.includes(dataset) &&
      contentOf(readOld(dataset)) !== contentOf(readReferencing(dataset));
    if (reexported) skipped.push(dataset);
    else
      files.push({
        dataset,
        ...remapCsv(readReferencing(dataset), columns, mappings),
      });
  });

  return { mappings, files, skipped };
}

function readFromHead(dataset) {
  const relative = path.relative(ROOT, datasetPath(dataset));
  return execFileSync("git", ["show", `HEAD:${relative}`], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
  });
}

function main(args) {
  const write = args.includes("--write");
  const targets = args.filter((arg) => !arg.startsWith("--"));
  const unknown = targets.filter((dataset) => !DATASETS[dataset]);

  if (targets.length === 0 || unknown.length > 0) {
    console.error(
      `Usage: node scripts/remapReferences.js <DATASET> [<DATASET>...] [--write]${
        unknown.length ? `\nUnknown: ${unknown.join(", ")}` : ""
      }`,
    );
    process.exit(1);
  }

  const readText = (dataset) => fs.readFileSync(datasetPath(dataset), "utf8");
  const { mappings, files, skipped } = planRemap(targets, {
    readOld: readFromHead,
    readNew: readText,
    readReferencing: readText,
    skipReexported: !args.includes("--force"),
  });
  skipped.forEach((dataset) =>
    console.log(
      `${dataset}: skipped, it was exported too and should already use the new ids (--force remaps it anyway)`,
    ),
  );

  targets.forEach((dataset) => {
    const { mapping, removed, added } = mappings[dataset];
    console.log(
      `${dataset}: ${mapping.size} id(s) changed, ${removed.length} row(s) gone, ${added.length} new`,
    );
    removed.forEach(({ key, id }) =>
      console.log(`    gone: ${key} (was ${id})`),
    );
  });

  files.forEach(({ dataset, text, changedCells, dangling }) => {
    console.log(`${dataset}: ${changedCells} cell(s) repointed`);
    dangling.forEach(({ column, id }) =>
      console.log(`    ${column} still points at ${id}, whose row is gone`),
    );
    if (write && changedCells > 0) fs.writeFileSync(datasetPath(dataset), text);
  });

  if (!write)
    console.log("\nDry run. Re-run with --write to rewrite the CSVs.");
}

module.exports = { buildIdMap, remapCsv, planRemap, readFromHead };

if (require.main === module) main(process.argv.slice(2));
