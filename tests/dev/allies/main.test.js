// The R6 guard, enforced structurally rather than by review.
//
// runEngine() ends every build with saveActiveCharacter(), which rebuilds the whole
// active character from the sheet page's own DOM (#weight, #ST_base, ...). The allies
// page has none of those elements, so if it ever reaches that pipeline it will overwrite
// the player's character with a blank sheet — silently, with localStorage the only copy.
//
// Walking the real import graph (not just main.js's own imports) is the point: the danger
// is an innocuous-looking dependency pulling compute/ in three hops down.

const fs = require("fs");
const path = require("path");

const JS_ROOT = path.join(__dirname, "../../../dev/public/js");
const ENTRY = path.join(JS_ROOT, "allies/main.js");

const FORBIDDEN = [
  {
    pattern: /^compute\//,
    why: "runEngine/triggerAutoRun — the PC build pipeline",
  },
  {
    pattern: /^store\/characters\.js$/,
    why: "saveActiveCharacter rebuilds the character from the sheet DOM",
  },
];

function _imports(file) {
  const source = fs.readFileSync(file, "utf-8");
  const specifiers = [];
  const re = /(?:^|\n)\s*import\s[^;]*?from\s+["']([^"']+)["']/g;

  let match;
  while ((match = re.exec(source)) !== null) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function _resolve(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  return path.resolve(path.dirname(fromFile), specifier);
}

function collectGraph(entry) {
  const seen = new Set();
  const queue = [entry];

  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);

    _imports(file).forEach((specifier) => {
      const resolved = _resolve(file, specifier);
      if (resolved) queue.push(resolved);
    });
  }

  return [...seen].map((file) => path.relative(JS_ROOT, file));
}

describe("the allies page import graph", () => {
  const graph = collectGraph(ENTRY);

  test("is non-empty, so the walk actually resolved something", () => {
    expect(graph).toContain("allies/main.js");
    expect(graph.length).toBeGreaterThan(1);
  });

  test.each(FORBIDDEN)("never reaches $pattern ($why)", ({ pattern }) => {
    const offenders = graph.filter((file) => pattern.test(file));
    expect(offenders).toEqual([]);
  });

  test("reaches no module that calls saveActiveCharacter", () => {
    // Comments are stripped first — several files in this feature name the function
    // precisely to explain why they must not call it.
    const stripComments = (source) =>
      source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

    const callers = graph.filter((file) => {
      const full = path.join(JS_ROOT, file);
      if (!fs.existsSync(full)) return false;

      const source = stripComments(fs.readFileSync(full, "utf-8"));
      return /saveActiveCharacter\s*\(/.test(source);
    });

    expect(callers).toEqual([]);
  });
});
