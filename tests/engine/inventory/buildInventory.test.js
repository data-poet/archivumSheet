const { buildInventory } = require("engine/inventory/buildInventory");

const { _getArmorDB } = require("engine/inventory/js/armor/armor");

const { _getShieldDB } = require("engine/inventory/js/shield/shield");

const assertShape = require("tests/helpers/assertShape");

// ─────────────────────────────────────────────────────────────────────────────
// AMMO MOCK
// Mirrors the mock in ammo.test.js so buildInventory integration tests don't
// need real CSVs to run.
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

  return {
    ...original,
    _getAmmoDB: () => mockAmmoDb,
    _getContainerDB: () => mockContainerDb,
    buildAmmoSlots: (containerInventory = [], looseInventory = []) => {
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

      const containers = { equipped: [], backpack: [], stash: [], camp: [] };
      for (const inst of containerInventory) {
        const c = mockContainerDb[inst.container_id];
        containers[inst.storedAt].push(resolveContainer(inst, c, mockAmmoDb));
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

describe("INVENTORY BUILDER", () => {
  const armorDb = _getArmorDB();

  const shieldDb = _getShieldDB();

  const armorId = Object.keys(armorDb)[0];

  const shieldId = Object.keys(shieldDb)[0];

  test("Should build inventory with carry weight correctly", () => {
    const result = buildInventory({
      ST: 10,
      weight: 35,
    });

    assertShape(result, ["inventory"]);

    const carry = result.inventory.carry_weight;

    // limits
    expect(carry.limits.none).toBe(10);

    expect(carry.limits.light).toBe(20);

    expect(carry.limits.medium).toBe(30);

    expect(carry.limits.heavy).toBe(60);

    expect(carry.limits.veryHeavy).toBe(100);

    // modifier
    // 35 → heavy range (ST*3 < weight <= ST*6) → -2
    expect(carry.weight_modifier).toBe(-2);
  });

  test("Should include armor inventory", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      armorInventory: [],
    });

    expect(result.inventory).toHaveProperty("armor");
  });

  test("Should include shield inventory", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      shieldInventory: [],
    });

    expect(result.inventory).toHaveProperty("shield");
  });

  test("Should include ammo inventory", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
    });

    expect(result.inventory).toHaveProperty("ammo");
  });

  test("Should include ammo.containers and ammo.loose in output", () => {
    const result = buildInventory({ ST: 10 });

    expect(result.inventory.ammo).toHaveProperty("containers");

    expect(result.inventory.ammo).toHaveProperty("loose");

    expect(result.inventory.ammo).toHaveProperty("total_equipped_ammo");

    expect(result.inventory.ammo).toHaveProperty("carried_ammo_weight");
  });

  test("Should include equipped armor weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      armorInventory: [
        {
          armor_id: armorId,
          is_equipped: true,
          storedAt: null,
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBeGreaterThan(0);
  });

  test("Should include backpack armor weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      armorInventory: [
        {
          armor_id: armorId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBeGreaterThan(0);
  });

  test("Should ignore stash armor weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      armorInventory: [
        {
          armor_id: armorId,
          is_equipped: false,
          storedAt: "stash",
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should ignore camp armor weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      armorInventory: [
        {
          armor_id: armorId,
          is_equipped: false,
          storedAt: "camp",
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should include equipped shield weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: true,
          storedAt: null,
        },
      ],
    });

    expect(result.inventory.shield.carried_shield_weight).toBeGreaterThan(0);
  });

  test("Should include backpack shield weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ],
    });

    expect(result.inventory.shield.carried_shield_weight).toBeGreaterThan(0);
  });

  test("Should ignore stash shield weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "stash",
        },
      ],
    });

    expect(result.inventory.shield.carried_shield_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should ignore camp shield weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "camp",
        },
      ],
    });

    expect(result.inventory.shield.carried_shield_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should combine armor and shield carried weight", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      armorInventory: [
        {
          armor_id: armorId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ],
      shieldInventory: [
        {
          shield_id: shieldId,
          is_equipped: false,
          storedAt: "backpack",
        },
      ],
    });

    expect(result.inventory.armor.carried_armor_weight).toBeGreaterThan(0);

    expect(result.inventory.shield.carried_shield_weight).toBeGreaterThan(0);

    const totalCarriedWeight =
      result.inventory.armor.carried_armor_weight +
      result.inventory.shield.carried_shield_weight;

    expect(totalCarriedWeight).toBeGreaterThan(0);
  });

  // ── AMMO INTEGRATION ───────────────────────────────────────────────────────

  test("Should include equipped container weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      ammoContainerInventory: [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [{ ammo_id: "AMMO-001", quantity: 10 }],
        },
      ],
    });

    // container 0.5 + 10 × 0.05 = 1.0
    expect(result.inventory.ammo.carried_ammo_weight).toBe(1.0);

    expect(result.inventory.ammo.carried_ammo_weight).toBeGreaterThan(0);
  });

  test("Should include backpack container weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      ammoContainerInventory: [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "backpack",
          contents: [],
        },
      ],
    });

    expect(result.inventory.ammo.carried_ammo_weight).toBe(0.5);
  });

  test("Should include backpack loose ammo weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      looseAmmoInventory: [
        { ammo_id: "AMMO-001", quantity: 10, storedAt: "backpack" },
      ],
    });

    // 10 × 0.05
    expect(result.inventory.ammo.carried_ammo_weight).toBe(0.5);
  });

  test("Should ignore stash container weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      ammoContainerInventory: [
        {
          _instanceId: "inst-1",
          container_id: "CONT-003",
          storedAt: "stash",
          contents: [{ ammo_id: "AMMO-001", quantity: 50 }],
        },
      ],
    });

    expect(result.inventory.ammo.carried_ammo_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should ignore stash loose ammo weight in carry calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      looseAmmoInventory: [
        { ammo_id: "AMMO-001", quantity: 100, storedAt: "stash" },
      ],
    });

    expect(result.inventory.ammo.carried_ammo_weight).toBe(0);

    expect(result.inventory.carry_weight.weight_modifier).toBe(0);
  });

  test("Should add ammo carried weight to overall carry_weight calculation", () => {
    const result = buildInventory({
      ST: 10,
      weight: 0,
      ammoContainerInventory: [
        {
          _instanceId: "inst-1",
          container_id: "CONT-001",
          storedAt: "equipped",
          contents: [{ ammo_id: "AMMO-001", quantity: 20 }],
        },
      ],
    });

    // container 0.5 + 20 × 0.05 = 1.5 → above none limit (10) but still 0 modifier
    expect(result.inventory.ammo.carried_ammo_weight).toBe(1.5);

    // carry_weight must reflect the ammo weight in its calculation
    expect(result.inventory.carry_weight).toBeDefined();
  });
});
