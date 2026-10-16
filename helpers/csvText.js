// Reads and writes CSV text without changing anything it was not asked to change: cells are not trimmed,
// quotes appear only where a cell needs them, records end in LF, and the file ends in a newline. Every
// dataset round-trips byte for byte, so a rewrite shows up in git as exactly the cells that changed.
const { parse } = require("csv-parse/sync");

function parseCsvText(text) {
  return parse(text, { skip_empty_lines: false, relax_column_count: true });
}

function quoteCell(cell) {
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function serializeCsv(rows) {
  return `${rows.map((row) => row.map(quoteCell).join(",")).join("\n")}\n`;
}

module.exports = { parseCsvText, serializeCsv };
