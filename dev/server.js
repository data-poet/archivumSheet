const express = require("express");
const cors = require("cors");
const path = require("path");

const { version } = require("../package.json");
const { loadDataset } = require("../helpers/datasets.js");
const alliesCatalog = require("../helpers/alliesCatalog.js");
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
const {
  SHIELD_ITEM_CATEGORY,
} = require("../engine/inventory/js/shield/shieldValidation.js");
const {
  MELEE_ITEM_CATEGORY,
} = require("../engine/inventory/js/melee/meleeConstants.js");
const {
  RANGED_ITEM_CATEGORY,
} = require("../engine/inventory/js/ranged/rangedConstants.js");
const {
  FIREARMS_ITEM_CATEGORY,
} = require("../engine/inventory/js/firearms/firearmsConstants.js");

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

// Repo-catalog ally portraits live beside their JSON under data/allies/<type>/[<subtype>/], not
// under public/ — this is a fallback for whatever the first static mount doesn't have (i.e. every
// hand-authored catalog portrait), so a new type/subtype needs no mirrored folder under public/.
app.use(
  "/images/allies",
  express.static(path.join(__dirname, "../data/allies")),
);

/* -----------------------
   APP INFO
------------------------ */
app.get("/api/app-info", (req, res) => {
  res.json({ version });
});

/* -----------------------
   ADVANTAGES
------------------------ */
app.get("/api/advantages", (req, res) => {
  const data = loadDataset("ADVANTAGES");

  res.json(data);
});

/* -----------------------
   DISADVANTAGES
------------------------ */
app.get("/api/disadvantages", (req, res) => {
  const data = loadDataset("DISADVANTAGES");

  res.json(data);
});

/* -----------------------
   SKILLS
------------------------ */
app.get("/api/skills", (req, res) => {
  const data = loadDataset("SKILLS");

  res.json(data);
});

/* -----------------------
   SPELLS
------------------------ */
app.get("/api/spells", (req, res) => {
  const data = loadDataset("GRIMOIRE");

  res.json(data);
});

/* -----------------------
   RACES
------------------------ */
app.get("/api/races", (req, res) => {
  const data = loadDataset("RACES");
  res.json(data);
});

/* -----------------------
   META-RACES
------------------------ */
app.get("/api/meta-races", (req, res) => {
  const data = loadDataset("META_RACES");

  res.json(data);
});

/* -----------------------
   MATERIALS
------------------------ */
app.get("/api/materials", (req, res) => {
  const data = loadDataset("CRAFTING_MATERIALS");

  res.json(data);
});

/* -----------------------
   INVENTORY
------------------------ */
app.get("/api/armors", (req, res) => {
  const data = loadDataset("ARMORS");

  res.json(data);
});

app.get("/api/shields", (req, res) => {
  const data = loadDataset("SHIELDS");

  res.json(data);
});

app.get("/api/melee_weapons", (req, res) => {
  const data = loadDataset("MELEE_WEAPONS");

  res.json(data);
});

app.get("/api/ranged_weapons", (req, res) => {
  const data = loadDataset("RANGED_WEAPONS");

  res.json(data);
});

app.get("/api/firearms", (req, res) => {
  const data = loadDataset("FIREARMS");

  res.json(data);
});

app.get("/api/ammo", (req, res) => {
  const data = loadDataset("AMMO");
  res.json(data);
});

app.get("/api/ammo_containers", (req, res) => {
  const data = loadDataset("AMMO_CONTAINERS");
  res.json(data);
});

app.get("/api/alchemy", (req, res) => {
  const data = loadDataset("ALCHEMY");
  res.json(data);
});

app.get("/api/survival_gear", (req, res) => {
  const data = loadDataset("ADVENTURE_GEAR");
  res.json(data);
});

app.get("/api/accessories", (req, res) => {
  const data = loadDataset("ACCESSORIES");
  res.json(data);
});

app.get("/api/magic_gear", (req, res) => {
  const data = loadDataset("MAGIC_GEAR");
  res.json(data);
});

app.get("/api/enchantments", (req, res) => {
  const data = loadDataset("ENCHANTMENTS");
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
    SHIELD: SHIELD_ITEM_CATEGORY,
    MELEE: MELEE_ITEM_CATEGORY,
    RANGED: RANGED_ITEM_CATEGORY,
    FIREARMS: FIREARMS_ITEM_CATEGORY,
  });
});

/* -----------------------
   ALLIES CATALOG
   The index is served separately from the full payloads so the picker doesn't
   pull every ally's whole sheet on page load. Allies are built by the client
   through /api/sheet/build — an ally is just another character.
------------------------ */
app.get("/api/allies", (req, res) => {
  res.json(alliesCatalog.listAllies());
});

app.get("/api/allies/:allyId", (req, res) => {
  const ally = alliesCatalog.getAlly(req.params.allyId);

  if (!ally) {
    return res.status(404).json({ error: "Ally not found" });
  }

  res.json(ally);
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

  try {
    const result = buildCharacter({
      advantages,
      disadvantages,
      primaryAttributes,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
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
