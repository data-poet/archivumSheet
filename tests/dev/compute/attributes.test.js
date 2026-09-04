// Unlike shared/dom.js's el()/on() helpers, compute/attributes.js reads the
// DOM with no null-checks — a missing element throws rather than warning.
import { resetDOM } from "tests/dev/helpers/domFixture.js";

jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  getPrimaryAttributes,
  setupAutoRun,
} from "dev/public/js/compute/attributes.js";

beforeEach(() => {
  resetDOM();
  triggerAutoRun.mockClear();
});

describe("getPrimaryAttributes", () => {
  test("reads base_value and modifier for all four attributes as numbers", () => {
    document.getElementById("ST_base").value = "13";
    document.getElementById("ST_mod").value = "1";
    document.getElementById("DX_base").value = "11";
    document.getElementById("DX_mod").value = "-1";
    document.getElementById("IQ_base").value = "14";
    document.getElementById("IQ_mod").value = "0";
    document.getElementById("HT_base").value = "12";
    document.getElementById("HT_mod").value = "2";

    expect(getPrimaryAttributes()).toEqual({
      ST: { base_value: 13, modifier: 1 },
      DX: { base_value: 11, modifier: -1 },
      IQ: { base_value: 14, modifier: 0 },
      HT: { base_value: 12, modifier: 2 },
    });
  });

  test("converts an empty input value to 0, not NaN", () => {
    document.getElementById("ST_base").value = "";
    expect(getPrimaryAttributes().ST.base_value).toBe(0);
  });

  test("throws if a required input is missing from the DOM", () => {
    document.getElementById("ST_base").remove();
    expect(() => getPrimaryAttributes()).toThrow();
  });
});

describe("setupAutoRun", () => {
  const AUTORUN_IDS = [
    "ST_base",
    "ST_mod",
    "DX_base",
    "DX_mod",
    "IQ_base",
    "IQ_mod",
    "HT_base",
    "HT_mod",
    "weight",
  ];

  test.each(AUTORUN_IDS)(
    "wires an input listener on #%s that calls triggerAutoRun",
    (id) => {
      setupAutoRun();
      document.getElementById(id).dispatchEvent(new Event("input"));
      expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    },
  );

  test("throws at setup time if any of the nine ids is missing from the DOM", () => {
    document.getElementById("weight").remove();
    expect(() => setupAutoRun()).toThrow();
  });
});
