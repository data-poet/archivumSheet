const fs = require("fs");

const { DATASETS, datasetPath, loadDataset } = require("helpers/datasets.js");

describe("datasets registry", () => {
  test.each(Object.keys(DATASETS))(
    "%s points to an existing CSV file",
    (key) => {
      expect(fs.existsSync(datasetPath(key))).toBe(true);
    },
  );

  test.each(Object.keys(DATASETS))("%s loads at least one row", (key) => {
    expect(loadDataset(key).length).toBeGreaterThan(0);
  });

  test("throws on an unknown dataset key", () => {
    expect(() => datasetPath("NOT_A_REAL_DATASET")).toThrow(
      /Unknown dataset key/,
    );
  });
});
