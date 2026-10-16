// Safety net for refactors. `record` freezes data/ as of a git ref into .golden/ and dumps what the engine
// builds from it; `compare` rebuilds the dumps with the current code and fails on any difference.
// Because the data is frozen, the check stays valid while the live CSVs are being reworked.
//
//   npm run golden:record [-- --ref <git ref>]   default ref: HEAD
//   npm run golden:compare
//   npm run coverage:record      per-file coverage baseline, so deleting or merging tests can be proven safe
//   npm run coverage:compare     fails if any file's lines or branches dropped below the baseline
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const GOLDEN = path.join(ROOT, ".golden");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    ...options,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function freezeData(ref) {
  fs.rmSync(GOLDEN, { recursive: true, force: true });
  fs.mkdirSync(GOLDEN, { recursive: true });
  const result = spawnSync(
    "sh",
    ["-c", `git archive ${ref} data | tar -x -C .golden`],
    {
      cwd: ROOT,
      stdio: "inherit",
    },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`Froze data/ from ${ref} into .golden/`);
}

function runDumps(mode) {
  run(
    path.join(ROOT, "node_modules/.bin/jest"),
    ["--config", "jest.golden.config.js"],
    {
      env: { ...process.env, GOLDEN_MODE: mode },
    },
  );
}

function measureCoverage(directory) {
  run(path.join(ROOT, "node_modules/.bin/jest"), [
    "--silent",
    "--coverage",
    "--coverageReporters=json-summary",
    `--coverageDirectory=${directory}`,
    "--collectCoverageFrom=engine/**/*.js",
    "--collectCoverageFrom=helpers/**/*.js",
    "--collectCoverageFrom=dev/public/js/**/*.js",
  ]);
  return JSON.parse(
    fs.readFileSync(path.join(directory, "coverage-summary.json"), "utf8"),
  );
}

function compareCoverage() {
  const baselineFile = path.join(GOLDEN, "coverage-baseline.json");
  if (!fs.existsSync(baselineFile)) {
    console.error(
      "No coverage baseline yet: run npm run coverage:record first.",
    );
    process.exit(1);
  }
  const baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
  const current = measureCoverage(path.join(GOLDEN, "coverage-now"));
  const drops = Object.keys(baseline)
    .filter((file) => file !== "total")
    .flatMap((file) => {
      const now = current[file];
      return ["lines", "branches"]
        .filter(
          (kind) => !now || now[kind].covered < baseline[file][kind].covered,
        )
        .map(
          (kind) =>
            `${path.relative(ROOT, file)} ${kind}: ${baseline[file][kind].covered} -> ${now ? now[kind].covered : "file gone"} covered`,
        );
    });
  drops.forEach((line) => console.log(`  ${line}`));
  console.log(
    drops.length === 0
      ? "Coverage did not drop."
      : `${drops.length} drop(s) below the baseline.`,
  );
  process.exit(drops.length === 0 ? 0 : 1);
}

const [command, ...args] = process.argv.slice(2);

if (command === "record") {
  const refFlag = args.indexOf("--ref");
  freezeData(refFlag === -1 ? "HEAD" : args[refFlag + 1]);
  runDumps("record");
} else if (command === "compare") {
  if (!fs.existsSync(path.join(GOLDEN, "baseline"))) {
    console.error("No baseline yet: run npm run golden:record first.");
    process.exit(1);
  }
  runDumps("compare");
} else if (command === "coverage-record") {
  fs.mkdirSync(GOLDEN, { recursive: true });
  const summary = measureCoverage(path.join(GOLDEN, "coverage-baseline-run"));
  fs.writeFileSync(
    path.join(GOLDEN, "coverage-baseline.json"),
    JSON.stringify(summary),
  );
  console.log(
    `Recorded coverage for ${Object.keys(summary).length - 1} files.`,
  );
} else if (command === "coverage-compare") {
  compareCoverage();
} else {
  console.error(
    "Usage: node scripts/golden.js record [--ref <git ref>] | compare | coverage-record | coverage-compare",
  );
  process.exit(1);
}
