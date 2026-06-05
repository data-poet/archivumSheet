const {
  validateCustomInventoryInstance,
} = require("engine/inventory/js/customInventory/customInventoryValidation");

describe("CUSTOM INVENTORY VALIDATION", () => {
  const validInstance = {
    custom_item_id: "abc-123",
    name: "Pedra Rúnica",
    weight: 0.5,
    price: 10,
    quantity: 2,
    description: "Encontrada nas ruínas.",
    storedAt: "backpack",
  };

  describe("valid instances", () => {
    test("Should return no errors for a fully valid instance", () => {
      expect(validateCustomInventoryInstance(validInstance, 0)).toEqual([]);
    });

    test("Should return no errors when description is null", () => {
      const instance = { ...validInstance, description: null };
      expect(validateCustomInventoryInstance(instance, 0)).toEqual([]);
    });

    test("Should return no errors when description is omitted", () => {
      const { description, ...instance } = validInstance;
      expect(validateCustomInventoryInstance(instance, 0)).toEqual([]);
    });

    test("Should return no errors when weight is 0", () => {
      const instance = { ...validInstance, weight: 0 };
      expect(validateCustomInventoryInstance(instance, 0)).toEqual([]);
    });

    test("Should return no errors when price is 0", () => {
      const instance = { ...validInstance, price: 0 };
      expect(validateCustomInventoryInstance(instance, 0)).toEqual([]);
    });

    test("Should accept all valid storedAt values", () => {
      for (const storedAt of ["stash", "camp", "backpack"]) {
        const instance = { ...validInstance, storedAt };
        expect(validateCustomInventoryInstance(instance, 0)).toEqual([]);
      }
    });
  });

  describe("invalid instance shape", () => {
    test("Should return error if instance is null", () => {
      const errors = validateCustomInventoryInstance(null, 0);
      expect(errors).toContain("customInventory[0]: must be an object");
    });

    test("Should return error if instance is not an object", () => {
      const errors = validateCustomInventoryInstance("string", 2);
      expect(errors).toContain("customInventory[2]: must be an object");
    });
  });

  describe("custom_item_id", () => {
    test("Should return error if custom_item_id is missing", () => {
      const { custom_item_id, ...instance } = validInstance;
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("custom_item_id"))).toBe(true);
    });

    test("Should return error if custom_item_id is an empty string", () => {
      const instance = { ...validInstance, custom_item_id: "" };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("custom_item_id"))).toBe(true);
    });

    test("Should return error if custom_item_id is whitespace only", () => {
      const instance = { ...validInstance, custom_item_id: "   " };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("custom_item_id"))).toBe(true);
    });

    test("Should return error if custom_item_id is a number", () => {
      const instance = { ...validInstance, custom_item_id: 123 };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("custom_item_id"))).toBe(true);
    });
  });

  describe("name", () => {
    test("Should return error if name is missing", () => {
      const { name, ...instance } = validInstance;
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("name"))).toBe(true);
    });

    test("Should return error if name is an empty string", () => {
      const instance = { ...validInstance, name: "" };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("name"))).toBe(true);
    });

    test("Should return error if name is whitespace only", () => {
      const instance = { ...validInstance, name: "   " };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("name"))).toBe(true);
    });
  });

  describe("weight", () => {
    test("Should return error if weight is missing", () => {
      const { weight, ...instance } = validInstance;
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("weight"))).toBe(true);
    });

    test("Should return error if weight is negative", () => {
      const instance = { ...validInstance, weight: -1 };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("weight"))).toBe(true);
    });

    test("Should return error if weight is a string", () => {
      const instance = { ...validInstance, weight: "heavy" };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("weight"))).toBe(true);
    });

    test("Should return error if weight is Infinity", () => {
      const instance = { ...validInstance, weight: Infinity };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("weight"))).toBe(true);
    });
  });

  describe("price", () => {
    test("Should return error if price is missing", () => {
      const { price, ...instance } = validInstance;
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("price"))).toBe(true);
    });

    test("Should return error if price is negative", () => {
      const instance = { ...validInstance, price: -5 };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("price"))).toBe(true);
    });

    test("Should return error if price is a string", () => {
      const instance = { ...validInstance, price: "cheap" };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("price"))).toBe(true);
    });
  });

  describe("quantity", () => {
    test("Should return error if quantity is zero", () => {
      const instance = { ...validInstance, quantity: 0 };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("quantity"))).toBe(true);
    });

    test("Should return error if quantity is negative", () => {
      const instance = { ...validInstance, quantity: -1 };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("quantity"))).toBe(true);
    });

    test("Should return error if quantity is a float", () => {
      const instance = { ...validInstance, quantity: 1.5 };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("quantity"))).toBe(true);
    });

    test("Should return error if quantity is a string", () => {
      const instance = { ...validInstance, quantity: "two" };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("quantity"))).toBe(true);
    });
  });

  describe("description", () => {
    test("Should return error if description is a number", () => {
      const instance = { ...validInstance, description: 42 };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("description"))).toBe(true);
    });

    test("Should return error if description is an object", () => {
      const instance = { ...validInstance, description: {} };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("description"))).toBe(true);
    });
  });

  describe("storedAt", () => {
    test("Should return error for invalid storedAt value", () => {
      const instance = { ...validInstance, storedAt: "equipped" };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("storedAt"))).toBe(true);
    });

    test("Should return error if storedAt is missing", () => {
      const { storedAt, ...instance } = validInstance;
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.some((e) => e.includes("storedAt"))).toBe(true);
    });
  });

  describe("error index prefix", () => {
    test("Should include the correct index in error messages", () => {
      const instance = { ...validInstance, quantity: 0 };
      const errors = validateCustomInventoryInstance(instance, 5);
      expect(errors[0]).toContain("customInventory[5]");
    });
  });

  describe("multiple errors", () => {
    test("Should collect all errors in a single call", () => {
      const instance = {
        custom_item_id: "",
        name: "",
        weight: -1,
        price: -1,
        quantity: 0,
        storedAt: "pocket",
      };
      const errors = validateCustomInventoryInstance(instance, 0);
      expect(errors.length).toBe(6);
    });
  });
});
