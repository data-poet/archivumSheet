const fs = require("fs");
const path = require("path");
const parsers = require("helpers/rowParsers.js");
const browser = require("dev/public/js/shared/rowParsers.js");

const ROOT = path.join(__dirname, "../..");

describe("toBool", () => {
  test.each([
    ["TRUE", true],
    ["true", true],
    [" True ", true],
    ["FALSE", false],
    ["", false],
    ["yes", false],
    [undefined, false],
    [null, false],
  ])("%j is %s", (value, expected) => {
    expect(parsers.toBool(value)).toBe(expected);
  });
});

describe("toList", () => {
  test.each([
    ["A, B,,C", undefined, ["A", "B", "C"]],
    ["A,B", ",", ["A", "B"]],
    [" SKILL-1:-2; SKILL-2:-3 ;", ";", ["SKILL-1:-2", "SKILL-2:-3"]],
    ["", undefined, []],
    [undefined, undefined, []],
    [null, ";", []],
  ])("%j with separator %j", (value, separator, expected) => {
    expect(parsers.toList(value, separator)).toEqual(expected);
  });
});

describe("toNumberOrNull", () => {
  test.each([
    ["5", 5],
    ["0.5", 0.5],
    ["0", 0],
    ["", null],
    [undefined, null],
    [null, null],
    ["abc", null],
    ["1,5", null],
  ])("%j is %s", (value, expected) => {
    expect(parsers.toNumberOrNull(value)).toBe(expected);
  });
});

describe("the browser copy behaves like helpers/rowParsers.js", () => {
  const values = [
    "TRUE",
    "true",
    " True ",
    "FALSE",
    "",
    "x",
    undefined,
    null,
    0,
    "A, B,,C",
    "A;B",
  ];

  test.each(values.map((value) => [value]))("toBool(%j)", (value) => {
    expect(browser.toBool(value)).toBe(parsers.toBool(value));
  });

  test.each(values.map((value) => [value]))("toList(%j)", (value) => {
    expect(browser.toList(value)).toEqual(parsers.toList(value));
    expect(browser.toList(value, ";")).toEqual(parsers.toList(value, ";"));
  });
});

// A cell parsed by hand somewhere else is how "TRUE" starts meaning two things.
describe("no hand-rolled cell parsing outside the parsers", () => {
  const sources = ["engine", "helpers", "dev/public/js"]
    .flatMap((directory) =>
      fs
        .readdirSync(path.join(ROOT, directory), { recursive: true })
        .filter((file) => file.endsWith(".js"))
        .map((file) => path.join(directory, file)),
    )
    .filter((file) => !file.includes(`${path.sep}localization${path.sep}`))
    .filter(
      (file) =>
        !file.endsWith(path.join("helpers", "rowParsers.js")) &&
        !file.endsWith(path.join("shared", "rowParsers.js")),
    );

  test.each(sources.map((file) => [file]))("%s", (file) => {
    const code = fs
      .readFileSync(path.join(ROOT, file), "utf8")
      .split("\n")
      .filter((line) => !/^\s*(\/\/|\*)/.test(line))
      .join("\n");
    expect(code).not.toMatch(/["']TRUE["']/);
    expect(code).not.toMatch(/\.split\(\s*["'],["']\s*\)/);
  });
});
