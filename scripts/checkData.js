// Checks the CSV datasets for the mistakes a hand edit or a spreadsheet export introduces: broken ids,
// dangling references, values outside the vocabularies the engine knows, columns the code reads that
// are missing, numbers that do not parse. Errors fail the run unless listed in scripts/dataKnownIssues.json.
//
//   npm run check:data              report errors, known issues and warnings
//   npm run check:data -- --verbose also list columns no code reads
const fs = require("fs");
const path = require("path");
const {
  DATASETS,
  datasetPath,
  loadDataset,
} = require("../helpers/datasets.js");
const { ID_COLUMN, KEY_COLUMN } = require("../helpers/datasetColumns.js");
const {
  DAMAGE_TYPES,
  CONDITION_MODIFIER_COLUMNS,
  CONDITION_STATUS_TAGS,
  CONDITION_RECOVERY_ATTRIBUTES,
  CONDITION_RECOVERY_INTERVALS,
} = require("../helpers/taxonomy.js");
const {
  resolveRuleKeys,
  LENIENT_TRAIT_KEYS,
} = require("../helpers/ruleKeys.js");
const { REFERENCES, idsInCell } = require("../helpers/datasetReferences.js");
const { costTableFor } = require("../engine/character/js/skills/skillsCost.js");
const { SLOT_MAP } = require("../engine/inventory/js/armor/armorConstants.js");
const {
  MAGIC_GEAR_TYPES,
} = require("../engine/inventory/js/magicGear/magicGearConstants.js");
const effectTypeGroups = require("../engine/inventory/js/shared/enchantmentsConstants.js");
const {
  ACCESSORY_ITEM_CATEGORY,
} = require("../engine/inventory/js/accessories/accessoriesValidation.js");
const {
  MAGIC_GEAR_ITEM_CATEGORY,
} = require("../engine/inventory/js/magicGear/magicGearValidation.js");
const {
  SHIELD_ITEM_CATEGORY,
} = require("../engine/inventory/js/shield/shieldValidation.js");
const {
  MELEE_ITEM_CATEGORY,
} = require("../engine/inventory/js/melee/meleeConstants.js");
const {
  RANGED_ITEM_CATEGORY,
} = require("../engine/inventory/js/ranged/rangedConstants.js");
const {
  FIREARMS_ITEM_CATEGORY,
} = require("../engine/inventory/js/firearms/firearmsConstants.js");

const ROOT = path.join(__dirname, "..");
const KNOWN_ISSUES_FILE = path.join(__dirname, "dataKnownIssues.json");

const ID_FORMAT = /^[A-Z][A-Z_]*(-[A-Z]+)*-\d{3,4}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REFERENCE_ANCHOR = /^tab-[a-z0-9-]+--[a-z0-9-]+$/;
const EQUIPMENT_TIERS = ["Comum", "Boa", "Superior", "Excelente", "Obra-Prima"];
const WEAPON_DATASETS = ["MELEE_WEAPONS", "RANGED_WEAPONS", "FIREARMS"];

// [dataset, column, allowed values, separator]: every value must be one of the allowed ones.
const allowedItemTokens = [
  ...Object.keys(SLOT_MAP),
  ACCESSORY_ITEM_CATEGORY,
  MAGIC_GEAR_ITEM_CATEGORY,
  SHIELD_ITEM_CATEGORY,
  MELEE_ITEM_CATEGORY,
  RANGED_ITEM_CATEGORY,
  FIREARMS_ITEM_CATEGORY,
];
const ENUMS = [
  ...WEAPON_DATASETS.map((d) => [
    d,
    "weapon_damage_type",
    Object.values(DAMAGE_TYPES),
    ",",
  ]),
  ...WEAPON_DATASETS.map((d) => [d, "weapon_tier", EQUIPMENT_TIERS]),
  ["ARMORS", "armor_tier", EQUIPMENT_TIERS],
  ["SHIELDS", "shield_tier", EQUIPMENT_TIERS],
  ["ARMORS", "armor_piece_location", Object.keys(SLOT_MAP)],
  ["MAGIC_GEAR", "magic_gear_type", Object.values(MAGIC_GEAR_TYPES)],
  [
    "ENCHANTMENTS",
    "enchantment_effect_type",
    Object.values(effectTypeGroups).flat(),
  ],
  ["ENCHANTMENTS", "enchantment_allowed_itens", allowedItemTokens, ","],
  ["SKILLS", "skill_base_attribute", ["ST", "DX", "IQ", "HT"]],
  ["SKILLS", "skill_difficulty", ["F", "M", "D", "MD"]],
];

// Datasets whose same name and tier would make two rows indistinguishable to the add forms.
const NATURAL_KEYS = {
  ARMORS: ["armor_name", "armor_tier"],
  SHIELDS: ["shield_name", "shield_tier"],
  MELEE_WEAPONS: ["weapon_name", "weapon_tier"],
  RANGED_WEAPONS: ["weapon_name", "weapon_tier"],
  FIREARMS: ["weapon_name", "weapon_tier"],
  ALCHEMY: ["consumable_name", "consumable_tier"],
  SKILLS: ["skill_name"],
  ADVANTAGES: ["advantage_name"],
  DISADVANTAGES: ["disadvantage_name"],
  ENCHANTMENTS: ["enchantment_name"],
};

// [dataset, id list column, name list column, target dataset, target name column]
const DERIVED_NAMES = [
  [
    "RACES",
    "race_innate_advantage_id",
    "race_innate_advantage_name",
    "ADVANTAGES",
    "advantage_name",
  ],
  [
    "RACES",
    "race_innate_disadvantage_id",
    "race_innate_disadvantage_name",
    "DISADVANTAGES",
    "disadvantage_name",
  ],
  [
    "META_RACES",
    "meta_race_innate_advantage_id",
    "meta_race_innate_advantage_name",
    "ADVANTAGES",
    "advantage_name",
  ],
  [
    "META_RACES",
    "meta_race_innate_disadvantage_id",
    "meta_race_innate_disadvantage_name",
    "DISADVANTAGES",
    "disadvantage_name",
  ],
];

function splitList(cell, separators = /[,;]/) {
  return String(cell ?? "")
    .split(separators)
    .map((part) => part.trim())
    .filter(Boolean);
}

function idOf(dataset, row) {
  return row[ID_COLUMN[dataset]];
}

function finding(severity, check, dataset, id, message) {
  return { severity, check, dataset, id, message };
}

function checkFiles(findings) {
  Object.keys(DATASETS).forEach((dataset) => {
    const bytes = fs.readFileSync(datasetPath(dataset));
    const text = bytes.toString("utf8");
    const header = text.split(/\r?\n/, 1)[0].split(",");

    if (new Set(header).size !== header.length) {
      findings.push(
        finding(
          "error",
          "header-duplicates",
          dataset,
          null,
          "repeated column name in the header",
        ),
      );
    }
    if (header.some((name) => !name.trim())) {
      findings.push(
        finding(
          "error",
          "header-empty",
          dataset,
          null,
          "empty column name in the header",
        ),
      );
    }
    if (text.includes("\r\n")) {
      findings.push(
        finding(
          "warning",
          "line-endings",
          dataset,
          null,
          "CRLF line endings (run npm run data:format)",
        ),
      );
    }
    if (!text.endsWith("\n")) {
      findings.push(
        finding(
          "warning",
          "final-newline",
          dataset,
          null,
          "no final newline (run npm run data:format)",
        ),
      );
    }
  });
}

function checkIdsAndKeys(findings) {
  Object.keys(DATASETS).forEach((dataset) => {
    const rows = loadDataset(dataset);
    const seen = new Map();

    rows.forEach((row) => {
      const id = idOf(dataset, row);
      if (!ID_FORMAT.test(id ?? "")) {
        findings.push(
          finding(
            "error",
            "id-format",
            dataset,
            id,
            `id "${id}" is not PREFIX-NNN`,
          ),
        );
      }
      seen.set(id, (seen.get(id) ?? 0) + 1);
    });
    [...seen]
      .filter(([, count]) => count > 1)
      .forEach(([id, count]) => {
        findings.push(
          finding(
            "error",
            "id-unique",
            dataset,
            id,
            `id appears ${count} times`,
          ),
        );
      });

    const keyColumn = KEY_COLUMN[dataset];
    if (!keyColumn) return;
    const keys = new Map();
    rows.forEach((row) => {
      const key = row[keyColumn];
      const id = idOf(dataset, row);
      if (!key) {
        findings.push(
          finding("error", "key-missing", dataset, id, `${keyColumn} is empty`),
        );
      } else if (!SLUG.test(key)) {
        findings.push(
          finding(
            "error",
            "key-format",
            dataset,
            id,
            `key "${key}" is not a lowercase slug`,
          ),
        );
      }
      keys.set(key, (keys.get(key) ?? 0) + 1);
    });
    [...keys]
      .filter(([key, count]) => key && count > 1)
      .forEach(([key]) => {
        findings.push(
          finding(
            "error",
            "key-unique",
            dataset,
            key,
            "key appears more than once",
          ),
        );
      });
  });
}

function checkReferences(findings) {
  REFERENCES.forEach(({ dataset, column, target }) => {
    const targetIds = new Set(
      loadDataset(target).map((row) => idOf(target, row)),
    );
    loadDataset(dataset).forEach((row) => {
      idsInCell(row[column])
        .filter((reference) => !targetIds.has(reference))
        .forEach((reference) => {
          findings.push(
            finding(
              "error",
              "reference",
              dataset,
              idOf(dataset, row),
              `${column} points at ${reference}, which is not in ${target}`,
            ),
          );
        });
    });
  });

  const ammoTypes = new Set(loadDataset("AMMO").map((row) => row.ammo_type));
  loadDataset("AMMO_CONTAINERS").forEach((row) => {
    splitList(row.container_ammo_type).forEach((type) => {
      if (!ammoTypes.has(type)) {
        findings.push(
          finding(
            "error",
            "reference",
            "AMMO_CONTAINERS",
            row.container_id,
            `container_ammo_type "${type}" is not an ammo_type in AMMO`,
          ),
        );
      }
    });
  });

  WEAPON_DATASETS.forEach((dataset) => {
    loadDataset(dataset)
      .filter((row) => !row.weapon_skill_id)
      .forEach((row) => {
        findings.push(
          finding(
            "warning",
            "weapon-without-skill",
            dataset,
            row.weapon_id,
            `${row.weapon_name} has no weapon_skill_id`,
          ),
        );
      });
  });
}

function checkEnums(findings) {
  ENUMS.forEach(([dataset, column, allowed, separator]) => {
    const allowedSet = new Set(allowed);
    loadDataset(dataset).forEach((row) => {
      const values = separator
        ? splitList(row[column], separator)
        : [row[column]];
      values
        .filter((value) => value !== "" && value !== undefined)
        .filter((value) => !allowedSet.has(value))
        .forEach((value) => {
          findings.push(
            finding(
              "error",
              "enum",
              dataset,
              idOf(dataset, row),
              `${column} "${value}" is not one of the known values`,
            ),
          );
        });
    });
  });
}

// A skill whose attribute and difficulty have no cost table is silently priced at zero points.
function checkSkillCostTables(findings) {
  loadDataset("SKILLS").forEach((row) => {
    if (!costTableFor(row.skill_base_attribute, row.skill_difficulty)) {
      findings.push(
        finding(
          "error",
          "skill-cost-table",
          "SKILLS",
          row.skill_id,
          `${row.skill_base_attribute}/${row.skill_difficulty} has no cost table`,
        ),
      );
    }
  });
}

// The code addresses these rows by key (helpers/ruleKeys.js): the keys must exist, and a tier group must
// not have more tiers in the data than the code registers.
function checkRuleKeys(findings, { verbose }) {
  const { missing, unregistered, dualUsePairs, lenient } = resolveRuleKeys();
  Object.entries(lenient).forEach(([group, { pending }]) => {
    const words = group.replace(/([A-Z])/g, " $1").toLowerCase();
    pending.forEach((key) => {
      const [dataset] = LENIENT_TRAIT_KEYS[group].find(([, k]) => k === key);
      findings.push(
        finding(
          "info",
          `${words.replaceAll(" ", "-")}-pending`,
          dataset,
          key,
          `${words} trait with no row yet; it applies once a row has this key`,
        ),
      );
    });
  });
  missing.forEach(({ dataset, key }) => {
    findings.push(
      finding(
        "error",
        "rule-key",
        dataset,
        key,
        "the code depends on this key, but no row has it",
      ),
    );
  });
  unregistered.forEach(({ dataset, key }) => {
    findings.push(
      finding(
        "error",
        "rule-tier",
        dataset,
        key,
        "tier beyond the ones the code registers (helpers/ruleKeys.js)",
      ),
    );
  });
  if (verbose) {
    findings.push(
      finding(
        "info",
        "dual-use",
        null,
        `${dualUsePairs.length} pairs`,
        "weapons whose key exists in both the melee and ranged tables",
      ),
    );
  }
}

function checkConditions(findings) {
  const rows = loadDataset("CONDITIONS");
  const knownImmunityKeys = new Set(
    LENIENT_TRAIT_KEYS.immunity.map(([, key]) => key),
  );
  const exclusiveGroups = new Map();

  Object.values(CONDITION_MODIFIER_COLUMNS)
    .filter((column) => !(column in rows[0]))
    .forEach((column) => {
      findings.push(
        finding(
          "error",
          "condition-column",
          "CONDITIONS",
          column,
          "numeric condition column is missing from the header",
        ),
      );
    });

  rows.forEach((row) => {
    const id = idOf("CONDITIONS", row);
    const report = (check, message) =>
      findings.push(finding("error", check, "CONDITIONS", id, message));
    const unknownIn = (cell, allowed) =>
      splitList(cell).filter((value) => !allowed.includes(value));

    Object.values(CONDITION_MODIFIER_COLUMNS).forEach((column) => {
      const value = String(row[column] ?? "");
      if (value !== "" && !/^-?\d+$/.test(value)) {
        report(
          "condition-number",
          `${column} "${value}" is not a whole number`,
        );
      }
    });

    const anchor = String(row.condition_reference_anchor ?? "");
    if (anchor !== "" && !REFERENCE_ANCHOR.test(anchor)) {
      report(
        "condition-anchor",
        `condition_reference_anchor "${anchor}" is not <tab id>--<slug>`,
      );
    }

    unknownIn(row.condition_grants, CONDITION_STATUS_TAGS).forEach((tag) =>
      report("condition-tag", `condition_grants "${tag}" is not a known tag`),
    );

    unknownIn(
      row.condition_recovery_attribute,
      CONDITION_RECOVERY_ATTRIBUTES,
    ).forEach((value) =>
      report(
        "condition-recovery",
        `condition_recovery_attribute "${value}" is not a known attribute`,
      ),
    );
    unknownIn(
      row.condition_recovery_interval,
      CONDITION_RECOVERY_INTERVALS,
    ).forEach((value) =>
      report(
        "condition-recovery",
        `condition_recovery_interval "${value}" is not a known interval`,
      ),
    );
    if (
      Boolean(row.condition_recovery_attribute) !==
      Boolean(row.condition_recovery_interval)
    ) {
      report(
        "condition-recovery",
        "condition_recovery_attribute and condition_recovery_interval go together",
      );
    }

    unknownIn(row.condition_immune_trait_keys, [...knownImmunityKeys]).forEach(
      (key) =>
        report(
          "condition-immune-key",
          `condition_immune_trait_keys "${key}" is not registered in helpers/ruleKeys.js`,
        ),
    );

    if (row.condition_exclusive_group) {
      exclusiveGroups.set(row.condition_exclusive_group, [
        ...(exclusiveGroups.get(row.condition_exclusive_group) ?? []),
        id,
      ]);
    }
  });

  exclusiveGroups.forEach((ids, group) => {
    if (ids.length < 2) {
      findings.push(
        finding(
          "error",
          "condition-exclusive-group",
          "CONDITIONS",
          ids[0],
          `exclusive group "${group}" has a single row, so it excludes nothing`,
        ),
      );
    }
  });
}

function checkValueTypes(findings) {
  Object.keys(DATASETS).forEach((dataset) => {
    const rows = loadDataset(dataset);
    Object.keys(rows[0]).forEach((column) => {
      const cells = rows
        .map((row) => ({ id: idOf(dataset, row), value: row[column] }))
        .filter((cell) => cell.value !== "");
      if (cells.length < 5) return;

      const isNumber = (v) => /^-?\d+(\.\d+)?$/.test(v);
      const isDecimalComma = (v) => /^-?\d+,\d+$/.test(v);
      const isBoolean = (v) => v === "TRUE" || v === "FALSE";

      const numeric = cells.filter(
        (c) => isNumber(c.value) || isDecimalComma(c.value),
      );
      const boolean = cells.filter((c) => isBoolean(c.value));

      if (numeric.length / cells.length >= 0.8) {
        cells
          .filter((c) => isDecimalComma(c.value))
          .forEach((c) => {
            findings.push(
              finding(
                "error",
                "decimal-comma",
                dataset,
                c.id,
                `${column} "${c.value}" uses a decimal comma`,
              ),
            );
          });
      } else if (boolean.length / cells.length >= 0.8) {
        cells
          .filter((c) => !isBoolean(c.value))
          .forEach((c) => {
            findings.push(
              finding(
                "warning",
                "not-a-boolean",
                dataset,
                c.id,
                `${column} "${c.value}" in a TRUE/FALSE column`,
              ),
            );
          });
      }
    });
  });
}

function checkNaturalKeys(findings) {
  Object.entries(NATURAL_KEYS).forEach(([dataset, columns]) => {
    const seen = new Map();
    loadDataset(dataset).forEach((row) => {
      const natural = columns.map((column) => row[column]).join(" | ");
      seen.set(natural, [...(seen.get(natural) ?? []), idOf(dataset, row)]);
    });
    [...seen]
      .filter(([, ids]) => ids.length > 1)
      .forEach(([natural, ids]) => {
        findings.push(
          finding(
            "warning",
            "natural-key",
            dataset,
            ids.join(", "),
            `"${natural}" is shared by ${ids.length} rows`,
          ),
        );
      });
  });
}

function checkDerivedNames(findings) {
  DERIVED_NAMES.forEach(
    ([dataset, idColumn, nameColumn, target, targetName]) => {
      const names = new Map(
        loadDataset(target).map((row) => [idOf(target, row), row[targetName]]),
      );
      loadDataset(dataset).forEach((row) => {
        const fromIds = splitList(row[idColumn]).map(
          (id) => names.get(id) ?? `?${id}`,
        );
        const written = splitList(row[nameColumn]);
        if (fromIds.join("|") !== written.join("|")) {
          findings.push(
            finding(
              "warning",
              "derived-name-drift",
              dataset,
              idOf(dataset, row),
              `${nameColumn} does not match the names of ${idColumn} (the id is the truth)`,
            ),
          );
        }
      });
    },
  );
}

function sourceFiles(directory) {
  return fs
    .readdirSync(path.join(ROOT, directory), { recursive: true })
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join(ROOT, directory, file));
}

function checkColumnReads(findings, { verbose }) {
  const headers = new Set(
    Object.keys(DATASETS).flatMap((dataset) =>
      Object.keys(loadDataset(dataset)[0]),
    ),
  );
  const engineFiles = [...sourceFiles("engine"), ...sourceFiles("helpers")];

  engineFiles.forEach((file) => {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(
      /\brow\.([a-z][a-z0-9]*(?:_[a-z0-9]+)+)/g,
    )) {
      if (!headers.has(match[1])) {
        findings.push(
          finding(
            "error",
            "column-read",
            null,
            path.relative(ROOT, file),
            `reads row.${match[1]}, which no dataset has`,
          ),
        );
      }
    }
  });

  if (!verbose) return;
  const everySource = [
    ...engineFiles,
    ...sourceFiles("dev/public/js"),
    path.join(ROOT, "dev/server.js"),
  ]
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  [...headers]
    .filter((column) => !everySource.includes(column))
    .forEach((column) => {
      findings.push(
        finding(
          "info",
          "column-unread",
          null,
          column,
          "no code reads this column",
        ),
      );
    });
}

function applyKnownIssues(findings) {
  const known = JSON.parse(fs.readFileSync(KNOWN_ISSUES_FILE, "utf8"));
  const isKnown = (found) =>
    known.some(
      (entry) =>
        entry.check === found.check &&
        (entry.dataset ?? null) === (found.dataset ?? null) &&
        (!entry.ids || entry.ids.includes(found.id)),
    );
  return {
    errors: findings.filter((f) => f.severity === "error" && !isKnown(f)),
    known: findings.filter((f) => f.severity === "error" && isKnown(f)),
    warnings: findings.filter((f) => f.severity === "warning"),
    info: findings.filter((f) => f.severity === "info"),
  };
}

function runChecks({ verbose = false } = {}) {
  const findings = [];
  checkFiles(findings);
  checkIdsAndKeys(findings);
  checkReferences(findings);
  checkEnums(findings);
  checkSkillCostTables(findings);
  checkRuleKeys(findings, { verbose });
  checkConditions(findings);
  checkValueTypes(findings);
  checkNaturalKeys(findings);
  checkDerivedNames(findings);
  checkColumnReads(findings, { verbose });
  return applyKnownIssues(findings);
}

function describe(f) {
  return `${(f.dataset ?? "-").padEnd(20)} ${String(f.id ?? "-").padEnd(28)} ${f.check}: ${f.message}`;
}

function printSection(title, list, limit = 12) {
  if (list.length === 0) return;
  console.log(`\n${title} (${list.length})`);
  list.slice(0, limit).forEach((f) => console.log(`  ${describe(f)}`));
  if (list.length > limit) console.log(`  ... and ${list.length - limit} more`);
}

// Many findings of one kind (50 exotic weapons without a skill) collapse into one line.
function printGrouped(title, list) {
  if (list.length === 0) return;
  const groups = new Map();
  list.forEach((f) => {
    const key = `${f.check} ${f.dataset ?? "-"}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  });
  console.log(`\n${title} (${list.length})`);
  groups.forEach((items, key) => {
    const sample = items
      .slice(0, 3)
      .map((f) => f.id)
      .join(", ");
    console.log(`  ${key.padEnd(40)} ${items.length}  e.g. ${sample}`);
  });
}

function printReport(result) {
  printSection("ERRORS", result.errors, 50);
  printGrouped("KNOWN ISSUES (scripts/dataKnownIssues.json)", result.known);
  printGrouped("WARNINGS", result.warnings);
  printSection("INFO", result.info, 200);
  console.log(
    `\n${result.errors.length} error(s), ${result.known.length} known, ${result.warnings.length} warning(s)`,
  );
}

function main(args) {
  const result = runChecks({ verbose: args.includes("--verbose") });
  printReport(result);
  process.exitCode = result.errors.length > 0 ? 1 : 0;
}

module.exports = { runChecks, printReport, splitList };

if (require.main === module) main(process.argv.slice(2));
