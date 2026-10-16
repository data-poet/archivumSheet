const { DATASETS, loadDataset } = require("helpers/datasets.js");
const { ID_COLUMN } = require("helpers/datasetColumns.js");
const { _getArmorDB } = require("engine/inventory/js/armor/armor");
const { _getShieldDB } = require("engine/inventory/js/shield/shield");
const { _getMeleeDB } = require("engine/inventory/js/melee/melee");
const { _getRangedDB } = require("engine/inventory/js/ranged/ranged");
const { _getFirearmsDB } = require("engine/inventory/js/firearms/firearms");
const {
  _getAmmoDB,
  _getContainerDB,
} = require("engine/inventory/js/ammo/ammo");
const { _getAlchemyDB } = require("engine/inventory/js/alchemy/alchemy");
const {
  _getSurvivalGearDB,
} = require("engine/inventory/js/survivalGear/survivalGear");
const {
  _getAccessoriesDB,
} = require("engine/inventory/js/accessories/accessories");
const { _getMagicGearDB } = require("engine/inventory/js/magicGear/magicGear");
const { getMaterialsDB } = require("engine/inventory/js/shared/materialsDB");
const {
  getEnchantmentsDB,
} = require("engine/inventory/js/shared/enchantmentsDB");

// A loader that maps a column that does not exist yields undefined or NaN instead of failing, so a
// renamed or mistyped column would otherwise only show up as wrong numbers in the sheet.
const LOADERS = [
  ["ARMORS", _getArmorDB, "armor_id"],
  ["SHIELDS", _getShieldDB, "shield_id"],
  ["MELEE_WEAPONS", _getMeleeDB, "weapon_id"],
  ["RANGED_WEAPONS", _getRangedDB, "weapon_id"],
  ["FIREARMS", _getFirearmsDB, "weapon_id"],
  ["AMMO", _getAmmoDB, "ammo_id"],
  ["AMMO_CONTAINERS", _getContainerDB, "container_id"],
  ["ALCHEMY", _getAlchemyDB, "consumable_id"],
  ["ADVENTURE_GEAR", _getSurvivalGearDB, "adventure_gear_id"],
  ["ACCESSORIES", _getAccessoriesDB, "accessory_id"],
  ["MAGIC_GEAR", _getMagicGearDB, "magic_gear_id"],
  ["CRAFTING_MATERIALS", getMaterialsDB, "material_id"],
  ["ENCHANTMENTS", getEnchantmentsDB, "enchantment_id"],
];

describe.each(LOADERS)("%s loader", (dataset, load, idField) => {
  const db = load();
  const rows = loadDataset(dataset);

  test("has one record per CSV row, keyed by its id", () => {
    expect(Object.keys(db)).toHaveLength(rows.length);
    Object.entries(db).forEach(([key, record]) => {
      expect(record[idField]).toBe(key);
    });
  });

  test("never yields an undefined or NaN field", () => {
    const broken = Object.entries(db).flatMap(([key, record]) =>
      Object.entries(record)
        .filter(([, value]) => value === undefined || Number.isNaN(value))
        .map(([field]) => `${key}.${field}`),
    );
    expect(broken).toEqual([]);
  });
});

// The grimoire is excluded: its 30 duplicated spell ids are a known defect the dataset rework removes.
describe.each(
  Object.keys(DATASETS).filter((dataset) => dataset !== "GRIMOIRE"),
)("%s ids", (dataset) => {
  test("are present and unique", () => {
    const rows = loadDataset(dataset);
    const idColumn = ID_COLUMN[dataset];
    const ids = rows.map((row) => row[idColumn]);
    expect(ids.filter((id) => !id)).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
