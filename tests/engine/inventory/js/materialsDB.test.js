const path = require("path");

jest.mock("helpers/dataUtils.js", () => ({
  loadCSV: jest.fn(),
}));

describe("getMaterialsDB", () => {
  let getMaterialsDB;
  let loadCSV;

  const mockRows = [
    {
      material_id: "iron",
      material_name: "Iron",
      material_type: "metal",
      material_tier: "common",
      material_gdp_modifier: "1",
      material_bal_modifier: "2",
      material_dr_modifier: "3",
      material_atk_effect: "none",
      material_def_effect: "heavy",
      material_weight_modifier: "1.5",
      material_price_modifier: "100",
      material_hit_points_modifier: "25",
    },

    {
      material_id: "steel",
      material_name: "Steel",
      material_type: "metal",
      material_tier: "rare",
      material_gdp_modifier: "2",
      material_bal_modifier: "1",
      material_dr_modifier: "5",
      material_atk_effect: "sharp",
      material_def_effect: "strong",
      material_weight_modifier: "1.2",
      material_price_modifier: "250",
      material_hit_points_modifier: "50",
    },
  ];

  beforeEach(() => {
    jest.resetModules();

    ({ getMaterialsDB } = require("engine/inventory/js/materialsDB"));

    ({ loadCSV } = require("helpers/dataUtils.js"));

    loadCSV.mockReturnValue(mockRows);
  });

  test("Should load and parse materials database correctly", () => {
    const result = getMaterialsDB();

    expect(loadCSV).toHaveBeenCalledTimes(1);

    expect(loadCSV).toHaveBeenCalledWith(
      path.resolve(process.cwd(), "data/db_crafting_materials.csv"),
    );

    expect(result).toEqual({
      iron: {
        material_id: "iron",

        material_name: "Iron",
        material_type: "metal",
        material_tier: "common",

        material_gdp_modifier: 1,
        material_bal_modifier: 2,
        material_dr_modifier: 3,

        material_atk_effect: "none",
        material_def_effect: "heavy",

        material_weight_modifier: 1.5,
        material_price_modifier: 100,
        material_hit_points_modifier: 25,
      },

      steel: {
        material_id: "steel",

        material_name: "Steel",
        material_type: "metal",
        material_tier: "rare",

        material_gdp_modifier: 2,
        material_bal_modifier: 1,
        material_dr_modifier: 5,

        material_atk_effect: "sharp",
        material_def_effect: "strong",

        material_weight_modifier: 1.2,
        material_price_modifier: 250,
        material_hit_points_modifier: 50,
      },
    });
  });

  test("Should cache database after first load", () => {
    const first = getMaterialsDB();

    const second = getMaterialsDB();

    expect(first).toBe(second);

    expect(loadCSV).toHaveBeenCalledTimes(1);
  });

  test("Should return empty object when CSV is empty", () => {
    loadCSV.mockReturnValue([]);

    const result = getMaterialsDB();

    expect(result).toEqual({});
  });
});
