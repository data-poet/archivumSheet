// Proves that renumbering dataset ids only needs the data and the id-owning files edited.
// Copies the repo to a temp dir, shifts every PREFIX-NNN id consistently in data/ and in the files
// below, then runs the whole Jest suite there. Any failure means a test (or code) hardcodes an id.
// The default shift is large so that no old id still exists after it: with a small shift a test that
// hardcodes ADV-002 would silently land on a different, existing row and pass.
// Usage: npm run test:renumber [-- --by N]
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const ID_FILES = [
  "helpers/ids.js",
  "dev/public/js/shared/constants.js",
  "scripts/dataKnownIssues.json",
];
const SKIP = new Set(["node_modules", ".git", ".claude", ".DS_Store"]);
const ID_PATTERN = /\b([A-Z][A-Z]*(?:[-_][A-Z]+)*)-(\d{3,4})\b/g;

const byFlag = process.argv.indexOf("--by");
const shiftBy = byFlag === -1 ? 500 : Number(process.argv[byFlag + 1]);

function filesUnder(dir, extensions) {
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((file) => extensions.some((ext) => file.endsWith(ext)))
    .map((file) => path.join(dir, file));
}

function prefixesIn(files) {
  const prefixes = new Set();
  files.forEach((file) => {
    for (const match of fs.readFileSync(file, "utf8").matchAll(ID_PATTERN)) {
      prefixes.add(match[1]);
    }
  });
  return prefixes;
}

function renumber(file, prefixes) {
  const source = fs.readFileSync(file, "utf8");
  const shifted = source.replace(ID_PATTERN, (match, prefix, number) => {
    if (!prefixes.has(prefix)) return match;
    const shiftedNumber = Number(number) + shiftBy;
    if (String(shiftedNumber).length > number.length) {
      throw new Error(
        `${match} + ${shiftBy} no longer fits ${number.length} digits`,
      );
    }
    return `${prefix}-${String(shiftedNumber).padStart(number.length, "0")}`;
  });
  fs.writeFileSync(file, shifted);
}

const workdir = fs.mkdtempSync(path.join(os.tmpdir(), "archivum-renumber-"));

try {
  fs.cpSync(ROOT, workdir, {
    recursive: true,
    filter: (source) => !SKIP.has(path.basename(source)),
  });
  fs.symlinkSync(
    path.join(ROOT, "node_modules"),
    path.join(workdir, "node_modules"),
  );

  const dataFiles = filesUnder(path.join(workdir, "data"), [".csv", ".json"]);
  const prefixes = prefixesIn(dataFiles);
  [...dataFiles, ...ID_FILES.map((file) => path.join(workdir, file))].forEach(
    (file) => renumber(file, prefixes),
  );

  console.log(
    `Renumbered ${[...prefixes].length} id prefixes by ${shiftBy} in ${workdir}`,
  );

  const jest = path.join(ROOT, "node_modules", ".bin", "jest");
  const result = spawnSync(jest, [], { cwd: workdir, stdio: "inherit" });

  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(workdir, { recursive: true, force: true });
}
