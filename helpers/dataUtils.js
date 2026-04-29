const fs = require("fs");
const { parse } = require("csv-parse/sync");

function loadCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");

  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

module.exports = {
  loadCSV,
};
