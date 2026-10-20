// The conditions dataset's own checks, apart from checkData.js, which stays about mistakes any CSV can have.
const { loadDataset } = require("../../helpers/datasets.js");
const {
  CONDITION_MODIFIER_COLUMNS,
  CONDITION_STATUS_TAGS,
  CONDITION_RECOVERY_ATTRIBUTES,
  CONDITION_RECOVERY_INTERVALS,
} = require("../../helpers/taxonomy.js");
const { LENIENT_TRAIT_KEYS } = require("../../helpers/ruleKeys.js");
const { splitList, idOf, finding } = require("./shared.js");

const REFERENCE_ANCHOR = /^tab-[a-z0-9-]+--[a-z0-9-]+$/;

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

module.exports = { checkConditions };
