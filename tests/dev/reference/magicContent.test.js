import fs from "fs";
import path from "path";

const { COST_TABLES } = require("engine/magic/js/spellsConstants.js");

// The spell point-cost table documents the engine's COST_TABLES; this fails if they drift apart.
const markdown = fs
  .readFileSync(
    path.join(
      __dirname,
      "../../../dev/public/reference-content/magic/level_and_tier.md",
    ),
    "utf8",
  )
  .replace(/ {2,}/g, " ");

const DIFFICULTIES = ["F", "M", "D", "MD"];
const format = (value) =>
  value === undefined ? "—" : String(value).replace(".", ",");
const label = (relative) =>
  relative > 0 ? `+${relative}` : relative === 0 ? "+0" : `${relative}`;

describe("level_and_tier.md point-cost table", () => {
  const relatives = Array.from({ length: 15 }, (_, i) => i - 4);

  test.each(relatives)(
    "relative %i matches COST_TABLES for every difficulty",
    (relative) => {
      const cells = DIFFICULTIES.map((d) =>
        format(COST_TABLES.IQ[d][relative]),
      );
      expect(markdown).toContain(
        `| **${label(relative)}** | ${cells.join(" | ")} |`,
      );
    },
  );
});
