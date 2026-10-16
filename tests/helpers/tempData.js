const fs = require("fs");
const os = require("os");
const path = require("path");
const { parse } = require("csv-parse/sync");

const ROOT = path.join(__dirname, "../..");

function toCsv(rows) {
  const header = Object.keys(rows[0]).join(",");
  const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = rows.map((row) => Object.values(row).map(quote).join(","));
  return `${[header, ...lines].join("\n")}\n`;
}

// Runs `run` with the working directory switched to a copy of data/ in which `edit` has changed the rows
// of one CSV (the datasets are read from ./data), then restores everything.
function withEditedData(file, edit, run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "temp-data-"));
  const previous = process.cwd();
  try {
    fs.cpSync(path.join(ROOT, "data"), path.join(directory, "data"), {
      recursive: true,
    });
    const target = path.join(directory, "data", file);
    const text = fs.readFileSync(target, "utf8");
    const edited = edit(
      parse(text, { columns: true, skip_empty_lines: true, trim: true }),
      text,
    );
    fs.writeFileSync(
      target,
      typeof edited === "string" ? edited : toCsv(edited),
    );
    process.chdir(directory);
    return run();
  } finally {
    process.chdir(previous);
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

module.exports = { withEditedData };
