const express = require("express");
const cors = require("cors");
const path = require("path");

const { loadCSV } = require("../helpers/dataUtils.js");
const { buildCharacter } = require("../engine/character/characterBuilder");

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
   CHARACTER BUILDER (MAIN ENGINE)
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
   START SERVER
------------------------ */
app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});
