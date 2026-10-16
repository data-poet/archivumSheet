// Gives every row of a dataset its stable key when a spreadsheet export arrives without the `_key` column
// (or with empty key cells). Rows are matched to the committed version first, so a renumbered, reordered
// or lightly edited row keeps its key; only rows that match nothing get a freshly derived key.
const { parseCsvText, serializeCsv } = require("../helpers/csvText.js");
const { ID_COLUMN } = require("../helpers/datasetColumns.js");
const { KEYED_DATASETS, deriveKeys } = require("./generateKeys.js");

function readRows(text) {
  const [header, ...records] = parseCsvText(text);
  return {
    header,
    records: records.filter((record) => record.some((cell) => cell !== "")),
  };
}

function asObjects(header, records) {
  return records.map((record) =>
    Object.fromEntries(
      header.map((column, i) => [column, (record[i] ?? "").trim()]),
    ),
  );
}

// One matching pass: pairs unmatched working rows with unused committed rows that share a signature, but
// only where exactly one of each shares it (an ambiguous signature is left for the next pass), or, in the
// ordered pass, where as many committed rows as working rows share it.
function matchPass(
  working,
  head,
  signature,
  assigned,
  usedHead,
  ordered = false,
) {
  const bySignature = (rows, isCandidate) => {
    const groups = new Map();
    rows.forEach((row, index) => {
      if (!isCandidate(index)) return;
      const key = signature(row);
      groups.set(key, [...(groups.get(key) ?? []), index]);
    });
    return groups;
  };
  const workingGroups = bySignature(working, (i) => assigned[i] === undefined);
  const headGroups = bySignature(head, (i) => !usedHead.has(i));

  workingGroups.forEach((workingIndexes, key) => {
    const headIndexes = headGroups.get(key) ?? [];
    const unique = workingIndexes.length === 1 && headIndexes.length === 1;
    const sameSize = ordered && headIndexes.length === workingIndexes.length;
    if (!unique && !sameSize) return;
    workingIndexes.forEach((workingIndex, at) => {
      assigned[workingIndex] = head[headIndexes[at]];
      usedHead.add(headIndexes[at]);
    });
  });
}

function carryKeys(dataset, { headText, workingText }) {
  const config = KEYED_DATASETS[dataset];
  const idColumn = ID_COLUMN[dataset];
  const { header, records } = readRows(workingText);
  const working = asObjects(header, records);
  const hasKeyColumn = header.includes(config.column);

  const head = headText
    ? (() => {
        const parsed = readRows(headText);
        return parsed.header.includes(config.column)
          ? asObjects(parsed.header, parsed.records)
          : [];
      })()
    : [];

  const assigned = working.map((row) => row[config.column] || undefined);
  const needsKey = (index) => assigned[index] === undefined;
  const alreadyKeyed = new Set(assigned.filter(Boolean));
  const usedHead = new Set(
    head
      .map((row, i) => (alreadyKeyed.has(row[config.column]) ? i : -1))
      .filter((i) => i >= 0),
  );

  // Matching hands over the committed row; its key is what gets carried.
  const carried = working.map(() => undefined);
  const fullTuple = [
    config.name,
    ...(config.always ?? []),
    ...(config.also ?? []),
  ];
  const baseTuple = [config.name, ...(config.always ?? [])];
  const tupleOf = (columns) => (row) => columns.map((c) => row[c]).join("|");

  const pending = working.map((_row, i) => (needsKey(i) ? undefined : null));
  [
    (row) => `${row[idColumn]}|${row[config.name]}`,
    tupleOf(fullTuple),
    tupleOf(baseTuple),
  ].forEach((signature) =>
    matchPass(working, head, signature, pending, usedHead),
  );
  // Rows identical but for their id (five Shuriken tiers) cannot be told apart: keep their order.
  matchPass(working, head, tupleOf(baseTuple), pending, usedHead, true);
  pending.forEach((match, i) => {
    if (match) carried[i] = match[config.column];
  });

  const used = new Set([
    ...assigned.filter(Boolean),
    ...carried.filter(Boolean),
  ]);
  const derived = deriveKeys(working, config).keys;
  const created = [];

  const keys = working.map((row, i) => {
    if (assigned[i]) return assigned[i];
    if (carried[i]) return carried[i];
    let candidate = derived[i];
    for (let n = 2; used.has(candidate); n += 1)
      candidate = `${derived[i]}-${n}`;
    used.add(candidate);
    created.push({ id: row[idColumn], key: candidate, name: row[config.name] });
    return candidate;
  });

  const keptHeadKeys = new Set(keys);
  const gone = head
    .filter((row) => !keptHeadKeys.has(row[config.column]))
    .map((row) => ({ key: row[config.column], name: row[config.name] }));

  const idAt = header.indexOf(idColumn);
  const keyAt = hasKeyColumn ? header.indexOf(config.column) : idAt + 1;
  const outHeader = hasKeyColumn
    ? header
    : [...header.slice(0, keyAt), config.column, ...header.slice(keyAt)];
  const outRecords = records.map((record, i) =>
    hasKeyColumn
      ? record.map((cell, at) => (at === keyAt ? keys[i] : cell))
      : [...record.slice(0, keyAt), keys[i], ...record.slice(keyAt)],
  );

  const text = serializeCsv([outHeader, ...outRecords]);
  const carriedCount = carried.filter(Boolean).length;
  return {
    text,
    carried: carriedCount,
    kept: assigned.filter(Boolean).length,
    created,
    gone,
  };
}

module.exports = { carryKeys };
