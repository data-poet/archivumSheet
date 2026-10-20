// Adds (or fills) the stable `<prefix>_key` column of each dataset: a lowercase slug of the row's name
// that never changes when the name is corrected or the id is renumbered. Tests and code refer to rows
// by key, so a rename or renumber needs no edit elsewhere.
//
//   node scripts/generateKeys.js                  dry run: report keys and collisions
//   node scripts/generateKeys.js --write          add the column after the id column
//   node scripts/generateKeys.js --fill-missing   write keys only into empty key cells (new rows)
//
// The CSV text is edited in place, so the diff is exactly the new column.
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { datasetPath } = require("../helpers/datasets.js");

// `always` columns are part of every key (tiered rows share a name); `also` are added only to break a tie.
const KEYED_DATASETS = {
  ADVANTAGES: {
    column: "advantage_key",
    name: "advantage_name",
    also: ["advantage_type"],
  },
  DISADVANTAGES: {
    column: "disadvantage_key",
    name: "disadvantage_name",
    also: ["disadvantage_type"],
  },
  SKILLS: {
    column: "skill_key",
    name: "skill_name",
    also: ["skill_category"],
  },
  RACES: {
    column: "race_key",
    name: "race_name",
    always: ["race_sub_name"],
  },
  META_RACES: {
    column: "meta_race_key",
    name: "meta_race_name",
    always: ["meta_race_sub_name"],
  },
  ARMORS: {
    column: "armor_key",
    name: "armor_name",
    always: ["armor_tier"],
    also: ["armor_piece_location"],
  },
  SHIELDS: {
    column: "shield_key",
    name: "shield_name",
    always: ["shield_tier"],
  },
  MELEE_WEAPONS: {
    column: "weapon_key",
    name: "weapon_name",
    always: ["weapon_tier"],
    also: ["weapon_type"],
  },
  RANGED_WEAPONS: {
    column: "weapon_key",
    name: "weapon_name",
    always: ["weapon_tier"],
    also: ["weapon_type"],
  },
  FIREARMS: {
    column: "weapon_key",
    name: "weapon_name",
    always: ["weapon_tier"],
    also: ["weapon_type"],
  },
  AMMO: { column: "ammo_key", name: "ammo_name" },
  AMMO_CONTAINERS: {
    column: "container_key",
    name: "container_name",
    also: ["container_capacity", "container_ammo_type"],
  },
  ALCHEMY: {
    column: "consumable_key",
    name: "consumable_name",
    always: ["consumable_tier"],
    also: ["consumable_type"],
  },
  ADVENTURE_GEAR: {
    column: "adventure_gear_key",
    name: "adventure_gear_name",
    also: ["adventure_gear_type"],
  },
  ACCESSORIES: { column: "accessory_key", name: "accessory_name" },
  MAGIC_GEAR: { column: "magic_gear_key", name: "magic_gear_name" },
  ENCHANTMENTS: { column: "enchantment_key", name: "enchantment_name" },
  CONDITIONS: { column: "condition_key", name: "condition_name" },
  CRAFTING_MATERIALS: {
    column: "material_key",
    name: "material_name",
    always: ["material_tier"],
  },
};

const PARSE_OPTIONS = {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true,
};

function slugify(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// A part that already starts with what came before it (race "Anão" + sub-race "Anão da Montanha") replaces it.
function joinSlugs(row, columns) {
  return columns
    .map((column) => slugify(row[column]))
    .filter(Boolean)
    .reduce(
      (key, part) => (key && !part.startsWith(key) ? `${key}-${part}` : part),
      "",
    );
}

// Returns one key per row, widening only the rows that collide, then numbering what still collides.
function deriveKeys(rows, { name, always = [], also = [] }) {
  const keys = rows.map((row) => joinSlugs(row, [name, ...always]));
  const tiebreakers = [...also];
  const columnsUsed = rows.map(() => [name, ...always]);

  const collidingIndexes = () => {
    const byKey = new Map();
    keys.forEach((key, index) => {
      byKey.set(key, [...(byKey.get(key) ?? []), index]);
    });
    return [...byKey.values()].filter((indexes) => indexes.length > 1).flat();
  };

  while (tiebreakers.length > 0 && collidingIndexes().length > 0) {
    const column = tiebreakers.shift();
    collidingIndexes().forEach((index) => {
      columnsUsed[index] = [...columnsUsed[index], column];
      keys[index] = joinSlugs(rows[index], columnsUsed[index]);
    });
  }

  const numbered = [];
  const seen = new Map();
  keys.forEach((key, index) => {
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count > 1) {
      keys[index] = `${key}-${count}`;
      numbered.push(index);
    }
  });

  return { keys, numbered };
}

// Splits the CSV text into the spans of its records, honouring quoted cells that contain line breaks.
function recordSpans(text) {
  const spans = [];
  let start = 0;
  let inQuotes = false;

  for (let i = 0; i <= text.length; i += 1) {
    const char = text[i];
    if (char === '"') inQuotes = !inQuotes;
    const atEnd = i === text.length;
    if (atEnd || (!inQuotes && (char === "\n" || char === "\r"))) {
      if (i > start) spans.push({ start, end: i });
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      start = i + 1;
    }
  }
  return spans;
}

function firstFieldEnd(record) {
  const comma = record.indexOf(",");
  if (comma === -1 || record.slice(0, comma).includes('"')) {
    throw new Error(
      `Cannot find an unquoted id field in: ${record.slice(0, 60)}`,
    );
  }
  return comma;
}

function secondFieldEnd(record, from) {
  const comma = record.indexOf(",", from);
  return comma === -1 ? record.length : comma;
}

// mode "add" inserts the column after the id column; mode "fill" writes keys into empty key cells.
function rewriteCsv(text, column, keys, mode) {
  const spans = recordSpans(text);
  let output = "";
  let cursor = 0;

  spans.forEach((span, spanIndex) => {
    const record = text.slice(span.start, span.end);
    const idEnd = firstFieldEnd(record);
    let rewritten = record;

    if (mode === "add") {
      const cell = spanIndex === 0 ? column : keys[spanIndex - 1];
      rewritten = `${record.slice(0, idEnd)},${cell}${record.slice(idEnd)}`;
    } else if (spanIndex > 0) {
      const keyEnd = secondFieldEnd(record, idEnd + 1);
      const current = record.slice(idEnd + 1, keyEnd);
      if (current === "") {
        rewritten = `${record.slice(0, idEnd + 1)}${keys[spanIndex - 1]}${record.slice(keyEnd)}`;
      }
    }

    output += text.slice(cursor, span.start) + rewritten;
    cursor = span.end;
  });

  return output + text.slice(cursor);
}

function withoutColumn(rows, column) {
  return rows.map(({ [column]: _removed, ...rest }) => rest);
}

function planDataset(datasetKey, config, { fillMissing }) {
  const file = datasetPath(datasetKey);
  const text = fs.readFileSync(file, "utf8");
  const rows = parse(text, PARSE_OPTIONS);
  const hasColumn = config.column in rows[0];

  if (fillMissing && !hasColumn) {
    throw new Error(`${datasetKey} has no ${config.column} column to fill`);
  }
  if (!fillMissing && hasColumn) {
    return { datasetKey, file, skipped: `${config.column} already exists` };
  }

  const derived = deriveKeys(rows, config);
  const existing = hasColumn ? rows.map((row) => row[config.column]) : [];
  const keys = rows.map((_row, index) =>
    existing[index] ? existing[index] : derived.keys[index],
  );
  const updated = rewriteCsv(
    text,
    config.column,
    keys,
    fillMissing ? "fill" : "add",
  );

  const reparsed = parse(updated, PARSE_OPTIONS);
  const sameData =
    JSON.stringify(withoutColumn(reparsed, config.column)) ===
    JSON.stringify(withoutColumn(rows, config.column));
  const finalKeys = reparsed.map((row) => row[config.column]);
  const unique = new Set(finalKeys).size === finalKeys.length;

  if (!sameData || !unique) {
    throw new Error(
      `${datasetKey}: the rewrite changed data or produced duplicate keys`,
    );
  }

  return {
    datasetKey,
    file,
    updated,
    rows,
    keys: finalKeys,
    numbered: derived.numbered,
  };
}

function main(args) {
  const write = args.includes("--write") || args.includes("--fill-missing");
  const fillMissing = args.includes("--fill-missing");

  Object.entries(KEYED_DATASETS).forEach(([datasetKey, config]) => {
    const plan = planDataset(datasetKey, config, { fillMissing });

    if (plan.skipped) {
      console.log(`${datasetKey.padEnd(20)} skipped: ${plan.skipped}`);
      return;
    }

    const widened = plan.keys.filter(
      (key, index) =>
        key !==
        joinSlugs(plan.rows[index], [config.name, ...(config.always ?? [])]),
    ).length;
    console.log(
      `${datasetKey.padEnd(20)} ${String(plan.rows.length).padStart(4)} rows, ` +
        `${widened} widened with a tie-breaker, ${plan.numbered.length} numbered`,
    );
    plan.numbered.forEach((index) => {
      console.log(
        `    needs a better key: ${plan.rows[index][config.name]} -> ${plan.keys[index]}`,
      );
    });

    if (write) fs.writeFileSync(plan.file, plan.updated);
  });

  if (!write) console.log("\nDry run. Re-run with --write to add the columns.");
}

module.exports = {
  KEYED_DATASETS,
  slugify,
  joinSlugs,
  deriveKeys,
  recordSpans,
  rewriteCsv,
};

if (require.main === module) main(process.argv.slice(2));
