const fs = require("fs");
const path = require("path");

/**
 * Load CSV and convert to objects
 */
function loadDisadvantagesCSV(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");

  return raw
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "") // removes empty lines
    .map((line) => line.replace(/\r/g, "")) // fixes Windows line endings
    .map((line, index, arr) => {
      if (index === 0) return line; // header stays raw

      const headers = arr[0].split(",").map((h) => h.trim());
      const values = line.split(",").map((v) => v.trim());

      const obj = {};

      headers.forEach((h, i) => {
        obj[h] = values[i] ?? ""; // ✅ prevents undefined crash
      });

      return obj;
    })
    .slice(1);
}

/**
 * Build disadvantages + total cost from selected IDs
 */
function buildDisadvantages(selectedIds) {
  // Resolve from project root
  const filePath = path.join(process.cwd(), "data", "db_disadvantages.csv");

  const rows = loadDisadvantagesCSV(filePath);

  const disadvantages = {};
  let totalCost = 0;

  for (const row of rows) {
    const id = row.disadvantage_id;

    if (selectedIds.includes(id)) {
      const cost = Number(row.disadvantage_cost);

      disadvantages[id] = cost;
      totalCost += cost;
    }
  }

  return {
    disadvantages,
    character_points: {
      disadvantages: totalCost,
    },
  };
}

module.exports = {
  buildDisadvantages,
};
