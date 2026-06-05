const express = require("express");
const cors = require("cors");
const path = require("path");

const { loadCSV } = require("../helpers/dataUtils.js");
const { buildCharacter } = require("../engine/character/buildCharacter.js");
const { buildSheet } = require("../engine/buildSheet.js");

const app = express();

app.use(cors());
app.use(express.json());

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

app.get("/api/ammo", (req, res) => {
  const data = loadCSV(
    path.join(__dirname, "../data/db_equipment_ammo.csv"),
  );
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
