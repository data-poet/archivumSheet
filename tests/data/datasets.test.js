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

describe("loadDataset caching", () => {
  const fs = require("fs");
  const { withEditedData } = require("tests/helpers/tempData");

  test("parses a file once and hands every caller the same frozen rows", () => {
    const first = loadDataset("ARMORS");
    expect(loadDataset("ARMORS")).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first[0])).toBe(true);
  });

  test("reads the file again as soon as it changes on disk", () => {
    withEditedData(
      "db_equipment_armors.csv",
      (rows) => rows,
      () => {
        const before = loadDataset("ARMORS");
        const file = datasetPath("ARMORS");
        const text = fs.readFileSync(file, "utf8");
        fs.writeFileSync(file, text.replace(`"Capuz",`, `"Capuz Editado",`));

        const after = loadDataset("ARMORS");
        expect(after).not.toBe(before);
        expect(after[0].armor_name).toBe("Capuz Editado");
      },
    );
  });

  test("keeps the data of different working directories apart", () => {
    const real = loadDataset("ARMORS");
    const edited = withEditedData(
      "db_equipment_armors.csv",
      (rows) => rows.slice(0, 1),
      () => loadDataset("ARMORS"),
    );
    expect(edited).toHaveLength(1);
    expect(loadDataset("ARMORS")).toBe(real);
  });
});
