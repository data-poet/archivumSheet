const express = require("express");
const cors = require("cors");
const path = require("path");

const { version } = require("../package.json");
const { loadDataset } = require("../helpers/datasets.js");
const { MAGIC_APTITUDE_TIERS } = require("../helpers/ids.js");
const { MASTER_ELIGIBLE_CATEGORIES } = require("../helpers/taxonomy.js");
const rules = require("../helpers/rules.js");
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
   DATASETS
   One route per CSV, serving its parsed rows as they are.
------------------------ */
const DATASET_ROUTES = {
  "/api/advantages": "ADVANTAGES",
  "/api/disadvantages": "DISADVANTAGES",
  "/api/skills": "SKILLS",
  "/api/spells": "GRIMOIRE",
  "/api/races": "RACES",
  "/api/meta-races": "META_RACES",
  "/api/materials": "CRAFTING_MATERIALS",
  "/api/armors": "ARMORS",
  "/api/shields": "SHIELDS",
  "/api/melee_weapons": "MELEE_WEAPONS",
  "/api/ranged_weapons": "RANGED_WEAPONS",
  "/api/firearms": "FIREARMS",
  "/api/ammo": "AMMO",
  "/api/ammo_containers": "AMMO_CONTAINERS",
  "/api/alchemy": "ALCHEMY",
  "/api/survival_gear": "ADVENTURE_GEAR",
  "/api/accessories": "ACCESSORIES",
  "/api/magic_gear": "MAGIC_GEAR",
  "/api/enchantments": "ENCHANTMENTS",
};

Object.entries(DATASET_ROUTES).forEach(([route, dataset]) => {
  app.get(route, (req, res) => {
    res.json(loadDataset(dataset));
  });
});

/* -----------------------
   APP INFO
------------------------ */
app.get("/api/app-info", (req, res) => {
  res.json({ version });
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
   MAGIC APTITUDE ADVANTAGE IDS
   Serves helpers/ids.js's MAGIC_APTITUDE_TIERS keys directly — the engine
   remains the sole source of truth for these, same rationale as above.
------------------------ */
app.get("/api/magic/aptitude-advantage-ids", (req, res) => {
  res.json(Object.keys(MAGIC_APTITUDE_TIERS));
});

/* -----------------------
   MASTER-ELIGIBLE SKILL CATEGORIES
   Serves helpers/taxonomy.js's MASTER_ELIGIBLE_CATEGORIES directly — the
   engine remains the sole source of truth for these, same rationale as above.
------------------------ */
app.get("/api/skills/master-eligible-categories", (req, res) => {
  res.json([...MASTER_ELIGIBLE_CATEGORIES]);
});

/* -----------------------
   ATTRIBUTE RULES
   Serves helpers/rules.js directly — the engine remains the sole source of
   truth for these numbers, same rationale as above.
------------------------ */
app.get("/api/rules", (req, res) => {
  res.json(rules);
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
  const { pc = {}, race_id = null, character = {}, inventory = {} } = req.body;

  try {
    const result = buildSheet({
      pc,
      race_id,
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
if (require.main === module) {
  app.listen(3000, () => {
    console.log("API running on http://localhost:3000");
  });
}

module.exports = app;
