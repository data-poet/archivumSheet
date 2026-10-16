const { loadDataset } = require("helpers/datasets.js");
const { KEY_COLUMN } = require("tests/helpers/dataRefs");

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Keys are the stable identity of a row: tests and code refer to rows by them, so each must exist,
// be a slug, and be unique within its dataset.
describe.each(Object.entries(KEY_COLUMN))("%s keys", (dataset, column) => {
  const rows = loadDataset(dataset);

  test(`every row has a ${column}`, () => {
    expect(column in rows[0]).toBe(true);
    expect(rows.filter((row) => !row[column])).toEqual([]);
  });

  test("keys are lowercase slugs", () => {
    expect(
      rows.map((row) => row[column]).filter((key) => !SLUG.test(key)),
    ).toEqual([]);
  });

  test("keys are unique", () => {
    const keys = rows.map((row) => row[column]);
    const duplicated = keys.filter((key, i) => keys.indexOf(key) !== i);
    expect(duplicated).toEqual([]);
  });
});
