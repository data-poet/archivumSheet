const fs = require("fs");
const path = require("path");
const {
  STORED_AT,
  VALID_STORED_AT,
  ALL_BUCKETS,
} = require("helpers/storage.js");

const ROOT = path.join(__dirname, "../../..");

describe("storage registry", () => {
  test("names the four buckets", () => {
    expect(STORED_AT).toEqual({
      EQUIPPED: "equipped",
      BACKPACK: "backpack",
      STASH: "stash",
      CAMP: "camp",
    });
  });

  test("VALID_STORED_AT keeps the validation-message order and excludes equipped", () => {
    expect(VALID_STORED_AT).toEqual(["stash", "camp", "backpack"]);
  });

  test("ALL_BUCKETS is equipped plus every stored location", () => {
    expect(ALL_BUCKETS).toEqual(["equipped", "stash", "camp", "backpack"]);
  });
});

// Saved characters key off these strings, so a typo in a literal fails silently at runtime.
describe("no bucket literal outside the registries", () => {
  const BUCKET = /["'](equipped|backpack|stash|camp)["']/;

  // firearms/render.js passes "equipped" as an element-id prefix, not a bucket.
  const allowed = new Set([
    path.join("helpers", "storage.js"),
    path.join("dev", "public", "js", "shared", "constants.js"),
    path.join(
      "dev",
      "public",
      "js",
      "engine",
      "inventory",
      "firearms",
      "render.js",
    ),
  ]);

  const sources = ["engine", path.join("dev", "public", "js")].flatMap((dir) =>
    fs
      .readdirSync(path.join(ROOT, dir), { recursive: true })
      .map((f) => path.join(dir, f))
      .filter((f) => f.endsWith(".js"))
      .filter((f) => !f.includes(`${path.sep}localization${path.sep}`))
      .filter((f) => !allowed.has(f)),
  );

  test.each(sources.map((f) => [f]))("%s", (file) => {
    const code = fs
      .readFileSync(path.join(ROOT, file), "utf8")
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\*)/.test(line))
      .join("\n");
    expect(code).not.toMatch(BUCKET);
  });
});
