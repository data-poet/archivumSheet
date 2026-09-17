import { createWeaponAddHandler } from "dev/public/js/engine/inventory/shared/weaponAddForm.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const CATALOG = [
  { weapon_id: "W-1", weapon_name: "Espada", weapon_tier: "I" },
  { weapon_id: "W-2", weapon_name: "Espada", weapon_tier: "II" },
];

function renderForm({ name = "Espada", tier = "I", material = "Aço", storage = "backpack" } = {}) {
  resetDOM(`
    <select id="meleeNameSelect"><option value="${name}" selected>${name}</option></select>
    <select id="meleeTierSelect"><option value="${tier}" selected>${tier}</option></select>
    <select id="meleeMaterialSelect"><option value="${material}" selected>${material}</option></select>
    <select id="meleeStorage"><option value="${storage}" selected>${storage}</option></select>
  `);
}

function buildHandler(overrides = {}) {
  return createWeaponAddHandler({
    idPrefix: "melee",
    catalog: () => CATALOG,
    addEquipped: overrides.addEquipped ?? jest.fn(),
    addStored: overrides.addStored ?? jest.fn(),
  });
}

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();
  state.data.materials = [
    { material_id: "MAT-001", material_name: "Aço" },
    { material_id: "MAT-002", material_name: "Ferro" },
  ];
});

describe("createWeaponAddHandler", () => {
  test("reads the form by id prefix and adds to the chosen storage location", () => {
    const addStored = jest.fn();
    const addEquipped = jest.fn();
    renderForm({ storage: "stash" });

    buildHandler({ addStored, addEquipped })();

    expect(addStored).toHaveBeenCalledWith("W-1", "MAT-001", "stash");
    expect(addEquipped).not.toHaveBeenCalled();
  });

  test("routes to addEquipped (with no location) when the destination is 'equipped'", () => {
    const addStored = jest.fn();
    const addEquipped = jest.fn();
    renderForm({ storage: "equipped" });

    buildHandler({ addStored, addEquipped })();

    expect(addEquipped).toHaveBeenCalledWith("W-1", "MAT-001");
    expect(addStored).not.toHaveBeenCalled();
  });

  test("matches on name AND tier together, not name alone", () => {
    const addStored = jest.fn();
    renderForm({ tier: "II" });

    buildHandler({ addStored })();

    expect(addStored).toHaveBeenCalledWith("W-2", "MAT-001", "backpack");
  });

  test("resolves the material name to its id", () => {
    const addStored = jest.fn();
    renderForm({ material: "Ferro" });

    buildHandler({ addStored })();

    expect(addStored).toHaveBeenCalledWith("W-1", "MAT-002", "backpack");
  });

  test("passes a null material id when the chosen material isn't in the catalog", () => {
    const addStored = jest.fn();
    renderForm({ material: "Mithril" });

    buildHandler({ addStored })();

    expect(addStored).toHaveBeenCalledWith("W-1", null, "backpack");
  });

  test("does nothing when the name/tier pair matches no weapon", () => {
    const addStored = jest.fn();
    const addEquipped = jest.fn();
    renderForm({ name: "Machado" });

    buildHandler({ addStored, addEquipped })();

    expect(addStored).not.toHaveBeenCalled();
    expect(addEquipped).not.toHaveBeenCalled();
  });

  test.each([
    "meleeNameSelect",
    "meleeTierSelect",
    "meleeMaterialSelect",
    "meleeStorage",
  ])("bails without throwing when #%s is absent from the page", (missingId) => {
    const addStored = jest.fn();
    renderForm();
    document.getElementById(missingId).remove();

    const handler = buildHandler({ addStored });

    expect(() => handler()).not.toThrow();
    expect(addStored).not.toHaveBeenCalled();
  });

  test("uses the configured idPrefix, so each weapon type reads its own controls", () => {
    const addStored = jest.fn();
    resetDOM(`
      <select id="firearmNameSelect"><option value="Espada" selected>Espada</option></select>
      <select id="firearmTierSelect"><option value="I" selected>I</option></select>
      <select id="firearmMaterialSelect"><option value="Aço" selected>Aço</option></select>
      <select id="firearmStorage"><option value="camp" selected>camp</option></select>
    `);

    createWeaponAddHandler({
      idPrefix: "firearm",
      catalog: () => CATALOG,
      addEquipped: jest.fn(),
      addStored,
    })();

    expect(addStored).toHaveBeenCalledWith("W-1", "MAT-001", "camp");
  });
});
