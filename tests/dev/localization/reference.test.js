import fs from "fs";
import path from "path";
import { REFERENCE } from "dev/public/js/localization/pt-BR/reference.js";

describe("REFERENCE manifest", () => {
  const files = REFERENCE.sections.flatMap((section) =>
    section.tabs.map((tab) => tab.file),
  );

  it.each(files)("%s exists on disk", (file) => {
    const resolved = path.join(__dirname, "../../../dev/public", file);
    expect(fs.existsSync(resolved)).toBe(true);
  });
});
