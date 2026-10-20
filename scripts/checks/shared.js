const { ID_COLUMN } = require("../../helpers/datasetColumns.js");

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

module.exports = { splitList, idOf, finding };
