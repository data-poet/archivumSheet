const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../..");

// CLAUDE.md: comments explain a non-obvious WHY, never label sections. Banner bars and "─── Title ───" headers
// are section labels, so they are kept out of the source.
const BANNER = /^\s*(\/\/|\*|\/\*\*?)\s*[─═━]{3,}/;

test("no banner comments in the engine, helpers, scripts or frontend", () => {
  const offenders = [
    "engine",
    "helpers",
    "scripts",
    "dev/public/js",
    "dev/server.js",
  ]
    .flatMap((entry) => {
      const full = path.join(ROOT, entry);
      return fs.statSync(full).isFile()
        ? [entry]
        : fs
            .readdirSync(full, { recursive: true })
            .filter((file) => file.endsWith(".js"))
            .map((file) => path.join(entry, file));
    })
    .filter((file) =>
      fs
        .readFileSync(path.join(ROOT, file), "utf8")
        .split("\n")
        .some((line) => BANNER.test(line)),
    );

  expect(offenders).toEqual([]);
});
