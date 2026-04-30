const {
  getSkillCost,
  getRelativeLevel,
  COST_TABLES,
} = require("engine/character/js/skillsCost");

describe("skillsCost", () => {
  describe("getRelativeLevel", () => {
    it("Should calculate correct relative level", () => {
      expect(getRelativeLevel(10, 12)).toBe(2);
      expect(getRelativeLevel(12, 10)).toBe(-2);
      expect(getRelativeLevel(0, 0)).toBe(0);
    });
  });

  describe("getSkillCost - DX skills", () => {
    it("Should return correct cost for DX F skill", () => {
      const cost = getSkillCost({
        attribute: "DX",
        base: 10,
        level: 11,
        difficulty: "F",
      });

      expect(cost).toBe(1);
    });

    it("Should return correct cost for DX M skill", () => {
      const cost = getSkillCost({
        attribute: "DX",
        base: 10,
        level: 12,
        difficulty: "M",
      });

      expect(cost).toBe(4);
    });

    it("Should return correct cost for DX D skill", () => {
      const cost = getSkillCost({
        attribute: "DX",
        base: 10,
        level: 12,
        difficulty: "D",
      });

      expect(cost).toBe(8);
    });

    it("Should return correct cost for DX MD skill", () => {
      const cost = getSkillCost({
        attribute: "DX",
        base: 10,
        level: 12,
        difficulty: "MD",
      });

      expect(cost).toBe(16);
    });
  });

  describe("getSkillCost - IQ skills", () => {
    it("Should return correct cost for IQ F skill", () => {
      const cost = getSkillCost({
        attribute: "IQ",
        base: 10,
        level: 10,
        difficulty: "F",
      });

      expect(cost).toBe(1);
    });

    it("Should return correct cost for IQ M skill", () => {
      const cost = getSkillCost({
        attribute: "IQ",
        base: 10,
        level: 11,
        difficulty: "M",
      });

      expect(cost).toBe(4);
    });

    it("Should return correct cost for IQ D skill", () => {
      const cost = getSkillCost({
        attribute: "IQ",
        base: 10,
        level: 12,
        difficulty: "D",
      });

      expect(cost).toBe(8);
    });

    it("Should return correct cost for IQ MD skill", () => {
      const cost = getSkillCost({
        attribute: "IQ",
        base: 10,
        level: 10,
        difficulty: "MD",
      });

      expect(cost).toBe(6);
    });
  });

  describe("edge cases", () => {
    it("Should return 0 for invalid attribute", () => {
      const cost = getSkillCost({
        attribute: "STRANGE",
        base: 10,
        level: 12,
        difficulty: "F",
      });

      expect(cost).toBe(0);
    });

    it("Should return 0 for invalid difficulty", () => {
      const cost = getSkillCost({
        attribute: "DX",
        base: 10,
        level: 12,
        difficulty: "UNKNOWN",
      });

      expect(cost).toBe(0);
    });

    it("Should clamp extreme values safely", () => {
      const cost = getSkillCost({
        attribute: "DX",
        base: 10,
        level: 1000,
        difficulty: "F",
      });

      expect(typeof cost).toBe("number");
    });
  });

  describe("cost table integrity", () => {
    it("Should have DX and IQ tables defined", () => {
      expect(COST_TABLES.DX).toBeDefined();
      expect(COST_TABLES.IQ).toBeDefined();
    });

    it("Should contain all difficulty types", () => {
      expect(COST_TABLES.DX.F).toBeDefined();
      expect(COST_TABLES.DX.M).toBeDefined();
      expect(COST_TABLES.DX.D).toBeDefined();
      expect(COST_TABLES.DX.MD).toBeDefined();

      expect(COST_TABLES.IQ.F).toBeDefined();
      expect(COST_TABLES.IQ.M).toBeDefined();
      expect(COST_TABLES.IQ.D).toBeDefined();
      expect(COST_TABLES.IQ.MD).toBeDefined();
    });
  });
});
