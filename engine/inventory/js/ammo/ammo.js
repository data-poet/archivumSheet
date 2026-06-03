const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const {
  VALID_CONTAINER_STORED_AT,
  VALID_LOOSE_STORED_AT,
} = require("./ammoConstants.js");

const {
  validateContainerInstance,
  validateLooseAmmoInstance,
  validateContainerCrossRules,
} = require("./ammoValidation.js");

const {
  resolveContainer,
  resolveLooseAmmo,
  calculateTotalEquippedAmmo,
  calculateCarriedAmmoWeight,
} = require("./ammoResolver.js");

// ─────────────────────────────────────────────────────────────────────────────
// AMMO DB
// ─────────────────────────────────────────────────────────────────────────────

let _ammoDB = null;

function getAmmoDB() {
  if (_ammoDB) return _ammoDB;

  const filePath = path.join(process.cwd(), "data", "db_equipment_ammo.csv");
  const rows = loadCSV(filePath);

  _ammoDB = {};

  for (const row of rows) {
    _ammoDB[row.ammo_id] = {
      ammo_id: row.ammo_id,
      ammo_name: row.ammo_name,
      ammo_type: row.ammo_type,
      ammo_category: row.ammo_category,
      ammo_price: Number(row.ammo_price),
      ammo_weight: Number(row.ammo_weight),
      ammo_effect: row.ammo_effect || null,
      ammo_description: row.ammo_description || null,
    };
  }

  return _ammoDB;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER DB
// ─────────────────────────────────────────────────────────────────────────────

let _containerDB = null;

function getContainerDB() {
  if (_containerDB) return _containerDB;

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_equipment_ammo_containers.csv",
  );
  const rows = loadCSV(filePath);

  _containerDB = {};

  for (const row of rows) {
    _containerDB[row.container_id] = {
      container_id: row.container_id,
      container_box_name: row.container_box_name,
      container_name: row.container_name,
      container_type: row.container_type,
      container_capacity: Number(row.container_capacity),
      container_weight: Number(row.container_weight),
      container_price: Number(row.container_price),
      container_ammo_type: row.container_ammo_type,
      is_carriable: String(row.is_carriable).toLowerCase() === "true",
    };
  }

  return _containerDB;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildStorageBucket() {
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function buildAmmoSlots(ammoContainerInventory = [], looseAmmoInventory = []) {
  const ammoDb = getAmmoDB();
  const containerDb = getContainerDB();

  // ── VALIDATE CONTAINER INSTANCES (shape) ──────────────────────────────────

  const containerShapeErrors = ammoContainerInventory.flatMap(
    (instance, index) => validateContainerInstance(instance, index),
  );

  if (containerShapeErrors.length > 0) {
    throw new Error(
      `[buildAmmoSlots] Invalid ammoContainerInventory:\n${containerShapeErrors.join("\n")}`,
    );
  }

  // ── VALIDATE LOOSE AMMO INSTANCES (shape) ─────────────────────────────────

  const looseShapeErrors = looseAmmoInventory.flatMap((instance, index) =>
    validateLooseAmmoInstance(instance, index),
  );

  if (looseShapeErrors.length > 0) {
    throw new Error(
      `[buildAmmoSlots] Invalid looseAmmoInventory:\n${looseShapeErrors.join("\n")}`,
    );
  }

  // ── VALIDATE UNKNOWN CONTAINER IDS ────────────────────────────────────────

  const unknownContainerIds = ammoContainerInventory
    .filter((instance) => !containerDb[instance.container_id])
    .map((instance) => instance.container_id);

  if (unknownContainerIds.length > 0) {
    throw new Error(
      `[buildAmmoSlots] Unknown container_id(s): ${unknownContainerIds.join(", ")}`,
    );
  }

  // ── VALIDATE UNKNOWN AMMO IDS (containers) ────────────────────────────────

  const unknownAmmoIdsInContainers = ammoContainerInventory
    .flatMap((instance) => instance.contents)
    .filter((entry) => !ammoDb[entry.ammo_id])
    .map((entry) => entry.ammo_id);

  if (unknownAmmoIdsInContainers.length > 0) {
    throw new Error(
      `[buildAmmoSlots] Unknown ammo_id(s) in containers: ${unknownAmmoIdsInContainers.join(", ")}`,
    );
  }

  // ── VALIDATE UNKNOWN AMMO IDS (loose) ────────────────────────────────────

  const unknownAmmoIdsLoose = looseAmmoInventory
    .filter((instance) => !ammoDb[instance.ammo_id])
    .map((instance) => instance.ammo_id);

  if (unknownAmmoIdsLoose.length > 0) {
    throw new Error(
      `[buildAmmoSlots] Unknown ammo_id(s) in loose ammo: ${unknownAmmoIdsLoose.join(", ")}`,
    );
  }

  // ── VALIDATE CROSS-INSTANCE RULES ────────────────────────────────────────

  const crossRuleErrors = validateContainerCrossRules(
    ammoContainerInventory,
    containerDb,
    ammoDb,
  );

  if (crossRuleErrors.length > 0) {
    throw new Error(
      `[buildAmmoSlots] Ammo container rule violations:\n${crossRuleErrors.join("\n")}`,
    );
  }

  // ── BUILD CONTAINER BUCKETS ───────────────────────────────────────────────

  const containers = {
    equipped: buildStorageBucket(),
    backpack: buildStorageBucket(),
    stash: buildStorageBucket(),
    camp: buildStorageBucket(),
  };

  for (const instance of ammoContainerInventory) {
    const container = containerDb[instance.container_id];
    const resolved = resolveContainer(instance, container, ammoDb);
    containers[instance.storedAt].push(resolved);
  }

  // ── BUILD LOOSE AMMO BUCKETS ─────────────────────────────────────────────

  const loose = {
    equipped: [], // always empty — loose ammo cannot be equipped
    backpack: buildStorageBucket(),
    stash: buildStorageBucket(),
    camp: buildStorageBucket(),
  };

  for (const instance of looseAmmoInventory) {
    const ammo = ammoDb[instance.ammo_id];
    const resolved = resolveLooseAmmo(instance, ammo);
    loose[instance.storedAt].push(resolved);
  }

  // ── TOTALS ────────────────────────────────────────────────────────────────

  const total_equipped_ammo = calculateTotalEquippedAmmo(
    containers.equipped,
    ammoDb,
  );

  const carried_ammo_weight = calculateCarriedAmmoWeight(
    containers.equipped,
    containers.backpack,
    loose.backpack,
  );

  return {
    containers,
    loose,
    total_equipped_ammo,
    carried_ammo_weight,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildAmmoSlots,
  VALID_CONTAINER_STORED_AT,
  VALID_LOOSE_STORED_AT,
  _getAmmoDB: getAmmoDB,
  _getContainerDB: getContainerDB,
};
