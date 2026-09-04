const path = require("path");

jest.mock("helpers/dataUtils.js", () => ({
  loadCSV: jest.fn(),
}));

describe("getEnchantmentsDB", () => {
  let getEnchantmentsDB;
  let loadCSV;

  const mockRows = [
    {
      enchantment_id: "ENCHANTMENT-000",
      enchantment_name: "Fortificar ST",
      enchantment_type: "Fortificar Atributo",
      enchantment_effect_type: "fortify_attribute",
      enchantment_is_parametric: "FALSE",
      enchantment_target: "ST",
      enchantment_base_value: "1",
      enchantment_step: "1",
      enchantment_allowed_itens: "Acessórios, Cabeça",
      enchantment_base_price: "5000",
      enchantment_price_per_extra_value: "5000",
      enchantment_price_per_point: "",
      enchantment_price_per_difficulty: "",
      enchantment_description: "Aumenta a ST do usuário.",
    },
    {
      enchantment_id: "ENCHANTMENT-026",
      enchantment_name: "Adicionar Vantagem",
      enchantment_type: "Peculiaridade",
      enchantment_effect_type: "advantage",
      enchantment_is_parametric: "TRUE",
      enchantment_target: "",
      enchantment_base_value: "",
      enchantment_step: "",
      enchantment_allowed_itens: "Acessórios",
      enchantment_base_price: "",
      enchantment_price_per_extra_value: "",
      enchantment_price_per_point: "50",
      enchantment_price_per_difficulty: "",
      enchantment_description: "Concede uma vantagem existente.",
    },
    {
      enchantment_id: "ENCHANTMENT-036",
      enchantment_name: "Aumentar Peso",
      enchantment_type: "Peso",
      enchantment_effect_type: "add_weight",
      enchantment_is_parametric: "FALSE",
      enchantment_target: "",
      enchantment_base_value: "0.1",
      enchantment_step: "0.1",
      enchantment_is_percentage: "TRUE",
      enchantment_allowed_itens: "Cabeça, Tronco",
      enchantment_base_price: "500",
      enchantment_price_per_extra_value: "500",
      enchantment_price_per_point: "",
      enchantment_price_per_difficulty: "",
      enchantment_description: "Aumenta o peso do item.",
    },
    {
      enchantment_id: "ENCHANTMENT-040",
      enchantment_name: "Fortificar Resistência à Fogo",
      enchantment_type: "Resistência Elemental",
      enchantment_effect_type: "fortify_resistance",
      enchantment_is_parametric: "FALSE",
      enchantment_target: "Fire",
      enchantment_base_value: "0.05",
      enchantment_step: "0.05",
      enchantment_is_percentage: "TRUE",
      enchantment_allowed_itens: "Cabeça, Tronco, Braços, Mãos, Pernas, Pés",
      enchantment_base_price: "1000",
      enchantment_price_per_extra_value: "1000",
      enchantment_price_per_point: "",
      enchantment_price_per_difficulty: "",
      enchantment_description: "Aumenta a resistência a fogo.",
    },
  ];

  beforeEach(() => {
    jest.resetModules();

    ({
      getEnchantmentsDB,
    } = require("engine/inventory/js/shared/enchantmentsDB"));

    ({ loadCSV } = require("helpers/dataUtils.js"));

    loadCSV.mockReturnValue(mockRows);
  });

  test("Should load and parse the enchantments database correctly", () => {
    const result = getEnchantmentsDB();

    expect(loadCSV).toHaveBeenCalledTimes(1);

    expect(loadCSV).toHaveBeenCalledWith(
      path.resolve(process.cwd(), "data/db_magic_enchantments.csv"),
    );

    expect(result["ENCHANTMENT-000"]).toEqual({
      enchantment_id: "ENCHANTMENT-000",
      enchantment_name: "Fortificar ST",
      enchantment_type: "Fortificar Atributo",
      enchantment_effect_type: "fortify_attribute",
      enchantment_is_parametric: false,
      enchantment_target: "ST",
      enchantment_base_value: 1,
      enchantment_step: 1,
      enchantment_is_percentage: false,
      enchantment_allowed_itens: ["Acessórios", "Cabeça"],
      enchantment_base_price: 5000,
      enchantment_price_per_extra_value: 5000,
      enchantment_price_per_point: null,
      enchantment_price_per_difficulty: null,
      enchantment_description: "Aumenta a ST do usuário.",
    });
  });

  test("Should parse enchantment_is_parametric TRUE/FALSE as booleans", () => {
    const result = getEnchantmentsDB();

    expect(result["ENCHANTMENT-000"].enchantment_is_parametric).toBe(false);
    expect(result["ENCHANTMENT-026"].enchantment_is_parametric).toBe(true);
  });

  test("Should convert empty numeric fields to null, not 0 or NaN", () => {
    const result = getEnchantmentsDB();
    const advantage = result["ENCHANTMENT-026"];

    expect(advantage.enchantment_target).toBeNull();
    expect(advantage.enchantment_base_value).toBeNull();
    expect(advantage.enchantment_step).toBeNull();
    expect(advantage.enchantment_base_price).toBeNull();
    expect(advantage.enchantment_price_per_extra_value).toBeNull();
    expect(advantage.enchantment_price_per_difficulty).toBeNull();
    expect(advantage.enchantment_price_per_point).toBe(50);
  });

  test("Should split enchantment_allowed_itens on commas and trim whitespace", () => {
    const result = getEnchantmentsDB();

    expect(result["ENCHANTMENT-000"].enchantment_allowed_itens).toEqual([
      "Acessórios",
      "Cabeça",
    ]);
  });

  test("Should pass through enchantment_type as-is", () => {
    const result = getEnchantmentsDB();

    expect(result["ENCHANTMENT-000"].enchantment_type).toBe(
      "Fortificar Atributo",
    );
    expect(result["ENCHANTMENT-026"].enchantment_type).toBe("Peculiaridade");
  });

  test("Should parse enchantment_is_percentage TRUE/FALSE as booleans", () => {
    const result = getEnchantmentsDB();

    expect(result["ENCHANTMENT-000"].enchantment_is_percentage).toBe(false);
    expect(result["ENCHANTMENT-036"].enchantment_is_percentage).toBe(true);
    expect(result["ENCHANTMENT-040"].enchantment_is_percentage).toBe(true);
  });

  test("Should default enchantment_is_percentage to false when the CSV column is missing", () => {
    const result = getEnchantmentsDB();

    // ENCHANTMENT-026 has no enchantment_is_percentage key at all in
    // mockRows — confirms toBoolean() degrades safely rather than throwing.
    expect(result["ENCHANTMENT-026"].enchantment_is_percentage).toBe(false);
  });

  test("Should keep enchantment_base_value/enchantment_step as decimal fractions for percentage enchantments", () => {
    const result = getEnchantmentsDB();

    expect(result["ENCHANTMENT-036"].enchantment_base_value).toBe(0.1);
    expect(result["ENCHANTMENT-036"].enchantment_step).toBe(0.1);
    expect(result["ENCHANTMENT-040"].enchantment_base_value).toBe(0.05);
    expect(result["ENCHANTMENT-040"].enchantment_step).toBe(0.05);
  });

  test("Should parse a fixed elemental-resistance enchantment_target the same way as a fixed attribute target", () => {
    const result = getEnchantmentsDB();

    expect(result["ENCHANTMENT-040"].enchantment_target).toBe("Fire");
  });

  test("Should return null enchantment_target for item-stat types with no target column value", () => {
    const result = getEnchantmentsDB();

    expect(result["ENCHANTMENT-036"].enchantment_target).toBeNull();
  });

  test("Should cache database after first load", () => {
    const first = getEnchantmentsDB();
    const second = getEnchantmentsDB();

    expect(first).toBe(second);
    expect(loadCSV).toHaveBeenCalledTimes(1);
  });

  test("Should return empty object when CSV is empty", () => {
    loadCSV.mockReturnValue([]);

    const result = getEnchantmentsDB();

    expect(result).toEqual({});
  });
});
