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
   SPELLS (FIXED ENDPOINT NAME)
------------------------ */
app.get("/api/spells", (req, res) => {
  const data = loadCSV(path.join(__dirname, "../data/db_magic_grimoire.csv"));

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
  const { character = {}, inventory = {} } = req.body;

  try {
    const result = buildSheet({
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
