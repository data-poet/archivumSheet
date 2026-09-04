jest.mock("helpers/dataUtils.js", () => ({
  loadCSV: jest.fn(),
}));

describe("getEnchantmentTargetsDB", () => {
  let getEnchantmentTargetsDB;
  let loadCSV;

  const advantageRows = [
    {
      advantage_id: "ADV-000",
      advantage_name: "Atraente",
      advantage_cost: "5",
    },
  ];

  const disadvantageRows = [
    {
      disadvantage_id: "DIS-000",
      disadvantage_name: "Aparência Desagradável",
      disadvantage_cost: "-5",
    },
  ];

  const skillRows = [
    {
      skill_id: "SKILL-014",
      skill_name: "Esquiva e Aparo",
      skill_difficulty: "D",
      skill_base_attribute: "DX",
    },
  ];

  const spellRows = [
    {
      spell_id: "MAN-0000",
      spell_name: "Moldar Mana",
      spell_tier: "Aprendiz",
      spell_difficulty: "F",
    },
    {
      spell_id: "MAN-0001",
      spell_name: "Moldar Mana",
      spell_tier: "Experiente",
      spell_difficulty: "F",
    },
  ];

  beforeEach(() => {
    jest.resetModules();

    ({
      getEnchantmentTargetsDB,
    } = require("engine/inventory/js/shared/enchantmentTargetsDB"));

    ({ loadCSV } = require("helpers/dataUtils.js"));

    loadCSV.mockImplementation((filePath) => {
      if (filePath.includes("db_traits_advantages.csv")) return advantageRows;
      if (filePath.includes("db_traits_disadvantages.csv"))
        return disadvantageRows;
      if (filePath.includes("db_skills.csv")) return skillRows;
      if (filePath.includes("db_magic_grimoire.csv")) return spellRows;
      return [];
    });
  });

  test("Should index advantages by advantage_id", () => {
    const result = getEnchantmentTargetsDB();

    expect(result.advantages["ADV-000"]).toEqual({
      name: "Atraente",
      cost: 5,
    });
  });

  test("Should index disadvantages by disadvantage_id, keeping cost negative", () => {
    const result = getEnchantmentTargetsDB();

    expect(result.disadvantages["DIS-000"]).toEqual({
      name: "Aparência Desagradável",
      cost: -5,
    });
  });

  test("Should index skills by skill_id", () => {
    const result = getEnchantmentTargetsDB();

    expect(result.skills["SKILL-014"]).toEqual({
      name: "Esquiva e Aparo",
      difficulty: "D",
      base_attribute: "DX",
    });
  });

  test("Should index spells by spell_name, keeping only the first tier-row seen", () => {
    const result = getEnchantmentTargetsDB();

    expect(result.spells["Moldar Mana"]).toEqual({
      name: "Moldar Mana",
      difficulty: "F",
    });

    expect(Object.keys(result.spells)).toEqual(["Moldar Mana"]);
  });

  test("Should cache the result across calls", () => {
    const first = getEnchantmentTargetsDB();
    const second = getEnchantmentTargetsDB();

    expect(first).toBe(second);
    expect(loadCSV).toHaveBeenCalledTimes(4);
  });
});
