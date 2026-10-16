import {
  VITAL_ATTRIBUTES,
  isVitalAttribute,
} from "dev/public/js/shared/constants.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";

const css = require("fs").readFileSync(
  "dev/public/css/base/variables.css",
  "utf8",
);

describe("VITAL_ATTRIBUTES", () => {
  test("lists PV, PF, Mana and Toxicidade in display order", () => {
    expect(VITAL_ATTRIBUTES.map(({ key }) => key)).toEqual([
      "HP",
      "FP",
      "Mana",
      "Toxicity",
    ]);
  });

  test.each(VITAL_ATTRIBUTES)(
    "$key has a label and a --color-bar-$bar colour",
    ({ key, bar }) => {
      expect(LABELS.secondaryAttributes[key]).toBeTruthy();
      expect(css).toContain(`--color-bar-${bar}:`);
    },
  );

  test("isVitalAttribute matches the list only", () => {
    expect(isVitalAttribute("FP")).toBe(true);
    expect(isVitalAttribute("Will")).toBe(false);
  });
});
