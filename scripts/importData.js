// One command for a fresh spreadsheet export: put the exported CSVs in data/, then run
//   npm run data:import              apply every step, then run check:data
//   npm run data:import -- --dry-run show what would change without writing anything
//
// Steps, in order:
//   1. format   LF line endings and a final newline (what `npm run data:format` does)
//   2. keys     give every row its `_key`: kept if present, else carried over from the committed
//               version of the row, else derived from its name (what `scripts/carryKeys.js` does)
//   3. remap    repoint id references (weapon skills, innate traits, skill_defaults) to datasets whose ids
//               changed since the committed version (what `npm run data:remap` does)
//   4. check    `npm run check:data`
// Everything is an ordinary change in the working tree: review with `git diff`, undo with `git checkout -- data`.
const fs = require("fs");
const { DATASETS, datasetPath } = require("../helpers/datasets.js");
const { REFERENCES } = require("../helpers/datasetReferences.js");
const { normalizeCsvText } = require("./formatData.js");
const { KEYED_DATASETS } = require("./generateKeys.js");
const { carryKeys } = require("./carryKeys.js");
const { buildIdMap, planRemap, readFromHead } = require("./remapReferences.js");
const { runChecks, printReport } = require("./checkData.js");

function runImport({ readHead, readWorking }) {
  const original = {};
  const texts = {};
  Object.keys(DATASETS).forEach((dataset) => {
    original[dataset] = readWorking(dataset);
    texts[dataset] = normalizeCsvText(original[dataset]);
  });
  const formatted = Object.keys(texts).filter((d) => texts[d] !== original[d]);

  const keyReports = {};
  Object.keys(KEYED_DATASETS).forEach((dataset) => {
    const result = carryKeys(dataset, {
      headText: readHead(dataset),
      workingText: texts[dataset],
    });
    texts[dataset] = result.text;
    keyReports[dataset] = result;
  });

  const targets = [...new Set(REFERENCES.map(({ target }) => target))].filter(
    (dataset) => {
      const head = readHead(dataset);
      return head && buildIdMap(dataset, head, texts[dataset]).mapping.size > 0;
    },
  );
  const remap =
    targets.length > 0
      ? planRemap(targets, {
          readOld: readHead,
          readNew: (dataset) => texts[dataset],
          readReferencing: (dataset) => texts[dataset],
          skipReexported: true,
        })
      : { mappings: {}, files: [], skipped: [] };
  remap.files.forEach(({ dataset, text }) => {
    texts[dataset] = text;
  });

  return { texts, original, formatted, keyReports, targets, remap };
}

function describeKeys(dataset, report) {
  const parts = [
    `${report.kept} kept`,
    `${report.carried} carried over`,
    `${report.created.length} new`,
    `${report.gone.length} gone`,
  ];
  console.log(`  ${dataset.padEnd(20)} ${parts.join(", ")}`);
  report.created
    .slice(0, 8)
    .forEach(({ id, key, name }) =>
      console.log(`      new: ${id} ${name} -> ${key}`),
    );
  report.gone
    .slice(0, 8)
    .forEach(({ key, name }) => console.log(`      gone: ${key} (${name})`));
}

function main(args) {
  const dryRun = args.includes("--dry-run");
  const readHead = (dataset) => {
    try {
      return readFromHead(dataset);
    } catch {
      return null;
    }
  };
  const result = runImport({
    readHead,
    readWorking: (dataset) => fs.readFileSync(datasetPath(dataset), "utf8"),
  });

  console.log(`1. format: ${result.formatted.length} file(s) normalized`);
  console.log("2. keys:");
  Object.entries(result.keyReports).forEach(([dataset, report]) =>
    describeKeys(dataset, report),
  );
  console.log(
    `3. remap: ${result.targets.length === 0 ? "no dataset was renumbered" : `renumbered ${result.targets.join(", ")}`}`,
  );
  result.remap.files.forEach(({ dataset, changedCells, dangling }) => {
    console.log(`  ${dataset}: ${changedCells} cell(s) repointed`);
    dangling.forEach(({ column, id }) =>
      console.log(`      ${column} still points at ${id}, whose row is gone`),
    );
  });
  result.remap.skipped.forEach((dataset) =>
    console.log(
      `  ${dataset}: skipped, it was edited too and should already use the new ids (npm run data:remap -- <DATASET> --force)`,
    ),
  );

  if (dryRun) {
    console.log("\nDry run: nothing was written.");
    return;
  }

  Object.keys(result.texts)
    .filter((dataset) => result.texts[dataset] !== result.original[dataset])
    .forEach((dataset) =>
      fs.writeFileSync(datasetPath(dataset), result.texts[dataset]),
    );

  console.log("4. check:data");
  const checks = runChecks();
  printReport(checks);
  console.log("\nReview with `git diff`; undo with `git checkout -- data`.");
  process.exitCode = checks.errors.length > 0 ? 1 : 0;
}

module.exports = { runImport };

if (require.main === module) main(process.argv.slice(2));
