// Copy of helpers/rowParsers.js for the browser (it cannot import from helpers/);
// tests/data/rowParsers.test.js keeps the two identical in behaviour.

export function toBool(value) {
  return (
    String(value ?? "")
      .trim()
      .toUpperCase() === "TRUE"
  );
}

export function toList(value, separator = ",") {
  return String(value ?? "")
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}
