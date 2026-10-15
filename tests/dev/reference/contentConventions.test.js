import fs from "fs";
import path from "path";
import { REFERENCE_SECTIONS } from "dev/public/js/reference/referenceLayout.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";

// Structural rules from reference-content/README.md that marked silently mis-renders when broken.
const files = REFERENCE_SECTIONS.flatMap(({ tabs }) => tabs).map(({ file }) => [
  file,
  fs.readFileSync(path.join(__dirname, "../../../dev/public", file), "utf8"),
]);

describe.each(files)("%s", (_file, markdown) => {
  test("every [[term]] exists in the glossary", () => {
    const keys = [...markdown.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map(
      (m) => m[1].trim(),
    );
    keys.forEach((key) => expect(LABELS.glossary).toHaveProperty([key]));
  });

  test("<details> blocks are balanced, unindented and have plain summaries", () => {
    const opens = markdown.match(/<details>/g) ?? [];
    const closes = markdown.match(/<\/details>/g) ?? [];
    expect(opens.length).toBe(closes.length);
    expect(markdown).not.toMatch(/^[ \t]+<\/?(details|summary)/m);
    expect(markdown).not.toMatch(/<summary>\s*<b>/);
  });

  test("never nests <details>, except an Exemplo inside an item", () => {
    let depth = 0;
    for (const match of markdown.matchAll(
      /<\/?details>(\n<summary>(.*)<\/summary>)?/g,
    )) {
      if (match[0] === "</details>") {
        depth -= 1;
        continue;
      }
      depth += 1;
      if (depth > 1) expect(match[2]).toMatch(/^Exemplos?$/);
      expect(depth).toBeLessThanOrEqual(2);
    }
  });

  test("uses callout syntax instead of emoji-prefixed quotes, and Exemplo disclosures for examples", () => {
    expect(markdown).not.toMatch(/^>\s*(⚠️|🗡️|💡|ℹ️)/mu);
    expect(markdown).not.toMatch(/\[!EXAMPLE\]/);
  });
});
