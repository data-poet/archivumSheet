// Normalizes the CSVs after a spreadsheet export: LF record endings and a final newline. Line breaks
// inside quoted cells are left as they are. Safe to run repeatedly.
//
//   npm run data:format           rewrite the files that need it
//   npm run data:format -- --check   list them and exit 1 without writing
const fs = require("fs");
const { DATASETS, datasetPath } = require("../helpers/datasets.js");

function normalizeCsvText(text) {
  let output = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') inQuotes = !inQuotes;
    if (char === "\r" && text[i + 1] === "\n" && !inQuotes) continue;
    output += char;
  }

  return output.endsWith("\n") || output === "" ? output : `${output}\n`;
}

function main(args) {
  const checkOnly = args.includes("--check");
  const changed = Object.keys(DATASETS).filter((dataset) => {
    const file = datasetPath(dataset);
    const text = fs.readFileSync(file, "utf8");
    const normalized = normalizeCsvText(text);
    if (normalized === text) return false;
    if (!checkOnly) fs.writeFileSync(file, normalized);
    return true;
  });

  console.log(
    changed.length === 0
      ? "All CSVs are already normalized."
      : `${checkOnly ? "Needs formatting" : "Formatted"}: ${changed.join(", ")}`,
  );
  process.exitCode = checkOnly && changed.length > 0 ? 1 : 0;
}

module.exports = { normalizeCsvText };

if (require.main === module) main(process.argv.slice(2));
