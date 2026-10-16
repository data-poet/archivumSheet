// How a CSV cell becomes a value. Every module that reads a dataset uses these, so "TRUE", an empty cell and a
// comma-separated list mean the same thing everywhere. The browser cannot import this file: it keeps a copy in
// dev/public/js/shared/rowParsers.js, and tests/data/rowParsers.test.js pins the two together.

function toBool(value) {
  return (
    String(value ?? "")
      .trim()
      .toUpperCase() === "TRUE"
  );
}

// "A, B,,C" -> ["A", "B", "C"]; pass another separator for ";" lists.
function toList(value, separator = ",") {
  return String(value ?? "")
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

// An empty or non-numeric cell is null, not 0 or NaN.
function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

module.exports = { toBool, toList, toNumberOrNull };
