import fs from "fs";
import path from "path";
import { STORAGE_KEYS } from "dev/public/js/shared/storageKeys.js";

const PUBLIC = path.join(__dirname, "../../../dev/public");

// These strings are already stored on users' devices; renaming one silently drops their data.
describe("STORAGE_KEYS", () => {
  test("values are pinned", () => {
    expect(STORAGE_KEYS).toEqual({
      characters: "archivum_characters",
      theme: "archivum:theme",
      viewMode: "archivum:viewMode",
      activeGroup: "archivum:activeGroup",
      referenceGroup: "archivum:referenceGroup",
      resumeGroup: "archivum:resumeGroup",
      debugTiming: "archivum:debugTiming",
    });
  });

  test("values are unique", () => {
    const values = Object.values(STORAGE_KEYS);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("no key literal outside storageKeys.js", () => {
  const sources = fs
    .readdirSync(path.join(PUBLIC, "js"), { recursive: true })
    .filter((f) => f.endsWith(".js"))
    .filter((f) => f !== path.join("shared", "storageKeys.js"));

  test.each(sources.map((f) => [f]))("%s", (file) => {
    const source = fs.readFileSync(path.join(PUBLIC, "js", file), "utf8");
    Object.values(STORAGE_KEYS).forEach((key) => {
      expect(source).not.toContain(`"${key}"`);
    });
  });
});

describe("inline theme script in the HTML shells", () => {
  test.each(["index.html", "reference.html"])(
    "%s reads the theme key",
    (page) => {
      const html = fs.readFileSync(path.join(PUBLIC, page), "utf8");
      expect(html).toContain(`localStorage.getItem("${STORAGE_KEYS.theme}")`);
    },
  );
});
