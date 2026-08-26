const express = require("express");
const cors = require("cors");
const path = require("path");

const { loadCSV } = require("../helpers/dataUtils.js");
const { buildCharacter } = require("../engine/character/buildCharacter.js");
const { buildSheet } = require("../engine/buildSheet.js");
const enchantmentsConstants = require("../engine/inventory/js/shared/enchantmentsConstants.js");
const dualUseWeapons = require("../engine/inventory/js/shared/dualUseWeapons.js");
const magicGearConstants = require("../engine/inventory/js/magicGear/magicGearConstants.js");
const {
  ACCESSORY_ITEM_CATEGORY,
} = require("../engine/inventory/js/accessories/accessoriesValidation.js");
const {
  MAGIC_GEAR_ITEM_CATEGORY,
} = require("../engine/inventory/js/magicGear/magicGearValidation.js");

const app = express();

app.use(cors());
app.use(
  express.json({
    limit: "10mb",
  }),
);

// prevent favicon noise
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// serve UI
app.use(express.static(path.join(__dirname, "public")));

/* -----------------------
   ADVANTAGES
------------------------ */
app.get("/api/advantages", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_traits_advantages.csv"),
  );

  res.json(data);
});

/* -----------------------
   DISADVANTAGES
------------------------ */
app.get("/api/disadvantages", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_traits_disadvantages.csv"),
  );

  res.json(data);
});

/* -----------------------
   SKILLS
------------------------ */
app.get("/api/skills", (req, res) => {
  const data = loadCSV(path.join(__dirname, "../data/db_skills.csv"));

  res.json(data);
});

/* -----------------------
   SPELLS
------------------------ */
app.get("/api/spells", (req, res) => {
  const data = loadCSV(path.join(__dirname, "../data/db_magic_grimoire.csv"));

  res.json(data);
});

/* -----------------------
   RACES
------------------------ */
app.get("/api/races", (req, res) => {
  const data = loadCSV(path.join(__dirname, "../data/db_yrth_races.csv"));
  res.json(data);
});

/* -----------------------
   MATERIALS
------------------------ */
app.get("/api/materials", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_crafting_materials.csv"),
  );

  res.json(data);
});

/* -----------------------
   INVENTORY
------------------------ */
app.get("/api/armors", (req, res) => {
  const data = loadCSV(path.join(__dirname, "../data/db_equipment_armors.csv"));

  res.json(data);
});

app.get("/api/shields", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_equipment_shields.csv"),
  );

  res.json(data);
});

app.get("/api/melee_weapons", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_equipment_melee_weapons.csv"),
  );

  res.json(data);
});

app.get("/api/ranged_weapons", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_equipment_ranged_weapons.csv"),
  );

  res.json(data);
});

app.get("/api/firearms", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_equipment_firearms_weapons.csv"),
  );

  res.json(data);
});

app.get("/api/ammo", (req, res) => {
  const data = loadCSV(path.join(__dirname, "../data/db_equipment_ammo.csv"));
  res.json(data);
});

app.get("/api/ammo_containers", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_equipment_ammo_containers.csv"),
  );
  res.json(data);
});

app.get("/api/alchemy", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_alchemy_consumables.csv"),
  );
  res.json(data);
});

app.get("/api/survival_gear", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_itens_adventure_gear.csv"),
  );
  res.json(data);
});

app.get("/api/accessories", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_itens_accessories.csv"),
  );
  res.json(data);
});

app.get("/api/magic_gear", (req, res) => {
  const data = loadCSV(path.join(__dirname, "../data/db_magic_gear.csv"));
  res.json(data);
});

app.get("/api/enchantments", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_magic_enchantments.csv"),
  );
  res.json(data);
});

app.get("/api/enchantments/effect-types", (req, res) => {
  res.json(enchantmentsConstants);
});

/* -----------------------
   DUAL-USE WEAPONS
   Serves engine/inventory/js/shared/dualUseWeapons.js's own maps directly —
   the engine is the sole source of truth for these pairings, the client
   never hardcodes them.
------------------------ */
app.get("/api/inventory/dual-use-weapons", (req, res) => {
  res.json({
    MELEE_TO_RANGED: dualUseWeapons.MELEE_TO_RANGED,
    RANGED_TO_MELEE: dualUseWeapons.RANGED_TO_MELEE,
  });
});

/* -----------------------
   MAGIC GEAR EQUIP LIMITS
   Serves engine/inventory/js/magicGear/magicGearConstants.js's
   MAGIC_GEAR_EQUIP_LIMITS directly — same rationale as effect-types above.
------------------------ */
app.get("/api/magic-gear/equip-limits", (req, res) => {
  res.json(magicGearConstants.MAGIC_GEAR_EQUIP_LIMITS);
});

/* -----------------------
   ENCHANTMENT-ALLOWED ITEM CATEGORIES
   Serves the enchantment_allowed_itens category strings owned by each
   equipment type's validation module directly — the engine remains the
   sole source of truth for these, same rationale as the endpoints above.
------------------------ */
app.get("/api/inventory/item-categories", (req, res) => {
  res.json({
    ACCESSORY: ACCESSORY_ITEM_CATEGORY,
    MAGIC_GEAR: MAGIC_GEAR_ITEM_CATEGORY,
  });
});

/* -----------------------
   CHARACTER BUILDER
------------------------ */
app.post("/api/character/build", (req, res) => {
  const {
    advantages = [],
    disadvantages = [],
    primaryAttributes = {},
  } = req.body;

  const result = buildCharacter({
    advantages,
    disadvantages,
    primaryAttributes,
  });

  res.json(result);
});

/* -----------------------
   SHEET BUILDER (MAIN ENGINE)
------------------------ */
app.post("/api/sheet/build", (req, res) => {
  const { pc = {}, race = {}, character = {}, inventory = {} } = req.body;

  try {
    const result = buildSheet({
      pc,
      race,
      character,
      inventory,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/* -----------------------
   START SERVER
------------------------ */
app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});

module.exports = app;
