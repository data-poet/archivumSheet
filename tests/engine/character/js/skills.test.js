const { buildSkills } = require("engine/character/js/skills");

describe("BUILD SKILLS (ENGINE)", () => {
  const character = {
    primary_attributes: {
      DX: { base_value: 12 },
      IQ: { base_value: 10 },
    },
  };

  const selectedSkills = {
    "SKILL-000": { base: 14, modifier: 0 },
    "SKILL-001": { base: 12, modifier: 1 },
  };

  test("Should build selected skills only", () => {
    const result = buildSkills(selectedSkills, character);

    expect(result).toHaveProperty("skills");
    expect(result).toHaveProperty("character_points");

    expect(typeof result.character_points.skills).toBe("number");
  });

  test("Should only include selected skill IDs", () => {
    const result = buildSkills(selectedSkills, character);

    const skillIds = Object.keys(result.skills);

    expect(skillIds.length).toBe(Object.keys(selectedSkills).length);

    skillIds.forEach((id) => {
      expect(Object.keys(selectedSkills)).toContain(id);
    });
  });

  test("Should compute points for selected skills", () => {
    const result = buildSkills(selectedSkills, character);

    const skills = Object.values(result.skills);

    expect(skills.length).toBe(Object.keys(selectedSkills).length);

    const allHavePoints = skills.every(
      (skill) => typeof skill.points === "number",
    );

    expect(allHavePoints).toBe(true);
  });

  test("Should ensure attribute mapping correct (DX/IQ)", () => {
    const result = buildSkills(selectedSkills, character);

    Object.values(result.skills).forEach((skill) => {
      expect(["DX", "IQ", "ST", "HT"]).toContain(skill.attribute);
    });
  });

  test("Should ensure total equals sum of individual points", () => {
    const result = buildSkills(selectedSkills, character);

    const manualSum = Object.values(result.skills).reduce(
      (sum, s) => sum + s.points,
      0,
    );

    expect(result.character_points.skills).toBe(manualSum);
  });

  test("Should be deterministic (same input = same output)", () => {
    const r1 = buildSkills(selectedSkills, character);
    const r2 = buildSkills(selectedSkills, character);

    expect(r1.character_points.skills).toBe(r2.character_points.skills);
  });
});
