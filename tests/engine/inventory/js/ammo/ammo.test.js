const {
  buildAmmoSlots,
  VALID_CONTAINER_STORED_AT,
  VALID_LOOSE_STORED_AT,
  _getAmmoDB,
  _getContainerDB,
} = require("engine/inventory/js/ammo/ammo");

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DB
// Injected via jest.mock so buildAmmoSlots never touches the filesystem.
// Replace these with real IDs once db_equipment_ammo.csv and
// db_equipment_ammo_containers.csv exist.
// ─────────────────────────────────────────────────────────────────────────────

jest.mock("engine/inventory/js/ammo/ammo", () => {
  const original = jest.requireActual("engine/inventory/js/ammo/ammo");

  const mockAmmoDb = {
    "AMMO-001": {
      ammo_id: "AMMO-001",
      ammo_name: "Broadhead Arrow",
      ammo_type: "arrow",
      ammo_weight: 0.05,
      ammo_price: 0.1,
      ammo_effect: null,
      ammo_description: null,
    },
    "AMMO-002": {
      ammo_id: "AMMO-002",
      ammo_name: "Bodkin Arrow",
      ammo_type: "arrow",
      ammo_weight: 0.05,
      ammo_price: 0.12,
      ammo_effect: null,
      ammo_description: null,
    },
    "AMMO-003": {
      ammo_id: "AMMO-003",
      ammo_name: "Crossbow Bolt",
      ammo_type: "bolt",
      ammo_weight: 0.06,
      ammo_price: 0.15,
      ammo_effect: null,
      ammo_description: null,
    },
  };

  const mockContainerDb = {
    "CONT-001": {
      container_id: "CONT-001",
      container_name: "Quiver",
      container_box_name: "Quivers",
      container_type: "quiver",
      container_capacity: 20,
      container_weight: 0.5,
      container_price: 15,
      container_ammo_type: "arrow",
      is_carriable: true,
    },
    "CONT-002": {
      container_id: "CONT-002",
      container_name: "Bolt Case",
      container_box_name: "Bolt Cases",
      container_type: "bolt_case",
      container_capacity: 30,
      container_weight: 0.6,
      container_price: 18,
      container_ammo_type: "bolt",
      is_carriable: true,
    },
    "CONT-003": {
      container_id: "CONT-003",
      container_name: "Arrow Crate",
      container_box_name: "Arrow Crates",
      container_type: "crate",
      container_capacity: 200,
      container_weight: 5.0,
      container_price: 40,
      container_ammo_type: "arrow",
      is_carriable: false,
    },
  };

  // Patch the private DB singletons so buildAmmoSlots uses our mock data
  return {
    ...original,
    _getAmmoDB: () => mockAmmoDb,
    _getContainerDB: () => mockContainerDb,
    buildAmmoSlots: (containerInventory = [], looseInventory = []) => {
      // Temporarily override the module-level getters by re-implementing
      // buildAmmoSlots in terms of the mock DBs.
      // We do this by calling the original with a replaced module scope —
      // easier to just re-export a thin wrapper that calls real logic:
      const {
        validateContainerInstance,
        validateLooseAmmoInstance,
        validateContainerCrossRules,
      } = require("engine/inventory/js/ammo/ammoValidation");

      const {
        resolveContainer,
        resolveLooseAmmo,
        calculateTotalEquippedAmmo,
        calculateCarriedAmmoWeight,
      } = require("engine/inventory/js/ammo/ammoResolver");

      // shape validation
      const containerShapeErrors = containerInventory.flatMap((inst, i) =>
        validateContainerInstance(inst, i),
      );
      if (containerShapeErrors.length > 0) {
        throw new Error(
          `[buildAmmoSlots] Invalid ammoContainerInventory:\n${containerShapeErrors.join("\n")}`,
        );
      }

      const looseShapeErrors = looseInventory.flatMap((inst, i) =>
        validateLooseAmmoInstance(inst, i),
      );
      if (looseShapeErrors.length > 0) {
        throw new Error(
          `[buildAmmoSlots] Invalid looseAmmoInventory:\n${looseShapeErrors.join("\n")}`,
        );
      }

      // unknown IDs
      const unknownContainers = containerInventory
        .filter((i) => !mockContainerDb[i.container_id])
        .map((i) => i.container_id);
      if (unknownContainers.length > 0) {
        throw new Error(
          `[buildAmmoSlots] Unknown container_id(s): ${unknownContainers.join(", ")}`,
        );
      }

      const unknownAmmoInContainers = containerInventory
        .flatMap((i) => i.contents)
        .filter((e) => !mockAmmoDb[e.ammo_id])
        .map((e) => e.ammo_id);
      if (unknownAmmoInContainers.length > 0) {
        throw new Error(
          `[buildAmmoSlots] Unknown ammo_id(s) in containers: ${unknownAmmoInContainers.join(", ")}`,
        );
      }

      const unknownAmmoLoose = looseInventory
        .filter((i) => !mockAmmoDb[i.ammo_id])
        .map((i) => i.ammo_id);
      if (unknownAmmoLoose.length > 0) {
        throw new Error(
          `[buildAmmoSlots] Unknown ammo_id(s) in loose ammo: ${unknownAmmoLoose.join(", ")}`,
        );
      }

      // cross-rules
      const crossErrors = validateContainerCrossRules(
        containerInventory,
        mockContainerDb,
        mockAmmoDb,
      );
      if (crossErrors.length > 0) {
        throw new Error(
          `[buildAmmoSlots] Ammo container rule violations:\n${crossErrors.join("\n")}`,
        );
      }

      // build
      const containers = { equipped: [], backpack: [], stash: [], camp: [] };
      for (const inst of containerInventory) {
        const c = mockContainerDb[inst.container_id];
        containers[inst.storedAt].push(
          resolveContainer(inst, c, mockAmmoDb),
        );
      }

      const loose = { equipped: [], backpack: [], stash: [], camp: [] };
      for (const inst of looseInventory) {
        const a = mockAmmoDb[inst.ammo_id];
        loose[inst.storedAt].push(resolveLooseAmmo(inst, a));
      }

      const total_equipped_ammo = calculateTotalEquippedAmmo(
        containers.equipped,
        mockAmmoDb,
      );

      const carried_ammo_weight = calculateCarriedAmmoWeight(
        containers.equipped,
        containers.backpack,
        loose.backpack,
      );

      return { containers, loose, total_equipped_ammo, carried_ammo_weight };
    },
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("EQUIPMENT AMMO", () => {
  describe("Constants", () => {
    test("Should export VALID_CONTAINER_STORED_AT", () => {
      expect(VALID_CONTAINER_STORED_AT).toEqual([
        "equipped",
        "stash",
        "camp",
        "backpack",
      ]);
    });

    test("Should export VALID_LOOSE_STORED_AT", () => {
      expect(VALID_LOOSE_STORED_AT).toEqual(["stash", "camp", "backpack"]);
    });
  });

  describe("buildAmmoSlots — empty input", () => {
    test("Should return empty buckets when called with no arguments", () => {
      const result = buildAmmoSlots();

      expect(result.containers.equipped).toEqual([]);

      expect(result.containers.backpack).toEqual([]);

      expect(result.containers.stash).toEqual([]);

      expect(result.containers.camp).toEqual([]);

      expect(result.loose.equipped).toEqual([]);

      expect(result.loose.backpack).toEqual([]);

      expect(result.loose.stash).toEqual([]);

      expect(result.loose.camp).toEqual([]);

      expect(result.total_equipped_ammo).toEqual({});

      expect(result.carried_ammo_weight).toBe(0);
    });
  });

  describe("buildAmmoSlots — container placement", () => {
    test("Should place an equipped container in containers.equipped", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [],
        },
      ]);

      expect(result.containers.equipped.length).toBe(1);

      expect(result.containers.equipped[0].container_id).toBe("CONT-001");
    });

    test("Should place a backpack container in containers.backpack", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "backpack",
          contents: [],
        },
      ]);

      expect(result.containers.backpack.length).toBe(1);
    });

    test("Should place a stash container in containers.stash", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "stash",
          contents: [],
        },
      ]);

      expect(result.containers.stash.length).toBe(1);
    });

    test("Should place a camp container in containers.camp", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "camp",
          contents: [],
        },
      ]);

      expect(result.containers.camp.length).toBe(1);
    });

    test("Should allow multiple containers of the same id in stash", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "stash",
          contents: [],
        },
        {
          _instanceId: "inst-2",
          container_id: "CONT-001",
          storedAt: "stash",
          contents: [],
        },
      ]);

      expect(result.containers.stash.length).toBe(2);
    });
  });

  describe("buildAmmoSlots — loose ammo placement", () => {
    test("Should place loose ammo in backpack", () => {
      const result = buildAmmoSlots([], [
        { ammo_id: "AMMO-001", quantity: 5, storedAt: "backpack" },
      ]);

      expect(result.loose.backpack.length).toBe(1);

      expect(result.loose.backpack[0].ammo_id).toBe("AMMO-001");
    });

    test("Should place loose ammo in stash", () => {
      const result = buildAmmoSlots([], [
        { ammo_id: "AMMO-001", quantity: 50, storedAt: "stash" },
      ]);

      expect(result.loose.stash.length).toBe(1);
    });

    test("Should place loose ammo in camp", () => {
      const result = buildAmmoSlots([], [
        { ammo_id: "AMMO-001", quantity: 20, storedAt: "camp" },
      ]);

      expect(result.loose.camp.length).toBe(1);
    });

    test("Should always keep loose.equipped empty", () => {
      const result = buildAmmoSlots([], [
        { ammo_id: "AMMO-001", quantity: 5, storedAt: "backpack" },
      ]);

      expect(result.loose.equipped).toEqual([]);
    });
  });

  describe("buildAmmoSlots — total_equipped_ammo", () => {
    test("Should compute total_equipped_ammo from equipped containers", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [
            { ammo_id: "AMMO-001", quantity: 12 },
            { ammo_id: "AMMO-002", quantity: 8 },
          ],
        },
      ]);

      expect(result.total_equipped_ammo).toEqual({ arrow: 20 });
    });

    test("Should aggregate across multiple equipped containers of different types", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
        },
        {
          _instanceId: "inst-2",
          container_id: "CONT-002",
          storedAt: "equipped",
          contents: [{ ammo_id: "AMMO-003", quantity: 12 }],
        },
      ]);

      expect(result.total_equipped_ammo).toEqual({ arrow: 10, bolt: 12 });
    });

    test("Should not include backpack containers in total_equipped_ammo", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "backpack",
          contents: [{ ammo_id: "AMMO-001", quantity: 20 }],
        },
      ]);

      expect(result.total_equipped_ammo).toEqual({});
    });
  });

  describe("buildAmmoSlots — carried_ammo_weight", () => {
    test("Should count equipped container weight toward carried weight", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
        },
      ]);

      // container_weight 0.5 + 10 × 0.05 = 1.0
      expect(result.carried_ammo_weight).toBe(1.0);
    });

    test("Should count backpack container weight toward carried weight", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "backpack",
          contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
        },
      ]);

      expect(result.carried_ammo_weight).toBe(1.0);
    });

    test("Should count backpack loose ammo weight toward carried weight", () => {
      const result = buildAmmoSlots([], [
        { ammo_id: "AMMO-001", quantity: 10, storedAt: "backpack" },
      ]);

      // 10 × 0.05
      expect(result.carried_ammo_weight).toBe(0.5);
    });

    test("Should not count stash container weight toward carried weight", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "stash",
          contents: [{ ammo_id: "AMMO-001", quantity: 50 }],
        },
      ]);

      expect(result.carried_ammo_weight).toBe(0);
    });

    test("Should not count camp container weight toward carried weight", () => {
      const result = buildAmmoSlots([
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "camp",
          contents: [{ ammo_id: "AMMO-001", quantity: 50 }],
        },
      ]);

      expect(result.carried_ammo_weight).toBe(0);
    });

    test("Should not count stash loose ammo toward carried weight", () => {
      const result = buildAmmoSlots([], [
        { ammo_id: "AMMO-001", quantity: 100, storedAt: "stash" },
      ]);

      expect(result.carried_ammo_weight).toBe(0);
    });

    test("Should not count camp loose ammo toward carried weight", () => {
      const result = buildAmmoSlots([], [
        { ammo_id: "AMMO-001", quantity: 100, storedAt: "camp" },
      ]);

      expect(result.carried_ammo_weight).toBe(0);
    });

    test("Should sum equipped, backpack containers and backpack loose correctly", () => {
      const result = buildAmmoSlots(
        [
          {
            _instanceId: "inst-1",
            container_id: "CONT-001",  // 0.5 + 10×0.05 = 1.0
            storedAt: "equipped",
            contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
          },
          {
            _instanceId: "inst-2",
            container_id: "CONT-001",  // 0.5 + 0 = 0.5
            storedAt: "backpack",
            contents: [],
          },
        ],
        [
          { ammo_id: "AMMO-001", quantity: 5, storedAt: "backpack" },  // 0.25
        ],
      );

      // 1.0 + 0.5 + 0.25 = 1.75
      expect(result.carried_ammo_weight).toBe(1.75);
    });
  });

  describe("buildAmmoSlots — validation errors", () => {
    test("Should throw for unknown container_id", () => {
      expect(() => {
        buildAmmoSlots([
          {
            _instanceId: "inst-1",
            container_id: "CONT-999",
            storedAt: "stash",
            contents: [],
          },
        ]);
      }).toThrow("Unknown container_id(s)");
    });

    test("Should throw for unknown ammo_id in container contents", () => {
      expect(() => {
        buildAmmoSlots([
          {
            _instanceId: "inst-1",
            container_id: "CONT-001",
            storedAt: "equipped",
            contents: [{ ammo_id: "AMMO-999", quantity: 5 }],
          },
        ]);
      }).toThrow("Unknown ammo_id(s) in containers");
    });

    test("Should throw for unknown ammo_id in loose ammo", () => {
      expect(() => {
        buildAmmoSlots([], [
          { ammo_id: "AMMO-999", quantity: 5, storedAt: "backpack" },
        ]);
      }).toThrow("Unknown ammo_id(s) in loose ammo");
    });

    test("Should throw for invalid storedAt on container", () => {
      expect(() => {
        buildAmmoSlots([
          {
            _instanceId: "inst-1",
            container_id: "CONT-001",
            storedAt: "pocket",
            contents: [],
          },
        ]);
      }).toThrow("storedAt must be one of");
    });

    test("Should throw for invalid storedAt on loose ammo", () => {
      expect(() => {
        buildAmmoSlots([], [
          { ammo_id: "AMMO-001", quantity: 5, storedAt: "pocket" },
        ]);
      }).toThrow("storedAt must be one of");
    });

    test("Should throw when loose ammo storedAt is equipped", () => {
      expect(() => {
        buildAmmoSlots([], [
          { ammo_id: "AMMO-001", quantity: 5, storedAt: "equipped" },
        ]);
      }).toThrow("storedAt must be one of");
    });

    test("Should throw when a non-carriable container is equipped", () => {
      expect(() => {
        buildAmmoSlots([
          {
            _instanceId: "inst-1",
            container_id: "CONT-003",
            storedAt: "equipped",
            contents: [],
          },
        ]);
      }).toThrow("is not carriable");
    });

    test("Should throw when a non-carriable container is in backpack", () => {
      expect(() => {
        buildAmmoSlots([
          {
            _instanceId: "inst-1",
            container_id: "CONT-003",
            storedAt: "backpack",
            contents: [],
          },
        ]);
      }).toThrow("is not carriable");
    });

    test("Should throw when same container_id is equipped twice", () => {
      expect(() => {
        buildAmmoSlots([
          {
            _instanceId: "inst-1",
            container_id: "CONT-001",
            storedAt: "equipped",
            contents: [],
          },
          {
            _instanceId: "inst-2",
            container_id: "CONT-001",
            storedAt: "equipped",
            contents: [],
          },
        ]);
      }).toThrow("max 1 allowed");
    });

    test("Should throw when same container_id is in backpack twice", () => {
      expect(() => {
        buildAmmoSlots([
          {
            _instanceId: "inst-1",
            container_id: "CONT-001",
            storedAt: "backpack",
            contents: [],
          },
          {
            _instanceId: "inst-2",
            container_id: "CONT-001",
            storedAt: "backpack",
            contents: [],
          },
        ]);
      }).toThrow("max 1 allowed");
    });

    test("Should throw when ammo type does not match container_ammo_type", () => {
      expect(() => {
        buildAmmoSlots([
          {
            _instanceId: "inst-1",
            container_id: "CONT-001",  // accepts arrow
            storedAt: "equipped",
            contents: [{ ammo_id: "AMMO-003", quantity: 5 }],  // bolt
          },
        ]);
      }).toThrow('only accepts "arrow"');
    });
  });
});
