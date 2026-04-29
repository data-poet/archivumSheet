const fs = require("fs");
const path = require("path");

/**
 * Load CSV and convert to objects
 */
function loadAdvantagesCSV(filePath) {
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
 * Build advantages + total cost from selected IDs
 */
function buildAdvantages(selectedIds) {
  // Resolve from project root
  const filePath = path.join(process.cwd(), "data", "db_advantages.csv");

  const rows = loadAdvantagesCSV(filePath);

  const advantages = {};
  let totalCost = 0;

  for (const row of rows) {
    const id = row.advantage_id;

    if (selectedIds.includes(id)) {
      const cost = Number(row.advantage_cost);

      advantages[id] = cost;
      totalCost += cost;
    }
  }

  return {
    advantages,
    character_points: {
      advantages: totalCost,
    },
  };
}

module.exports = {
  buildAdvantages,
};
