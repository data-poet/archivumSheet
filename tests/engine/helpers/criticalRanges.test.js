const { criticalRanges } = require("helpers/criticalRanges");

describe("criticalRanges (official 4e)", () => {
  test.each([
    [3, 4, 13],
    [6, 4, 16],
    [7, 4, 17],
    [12, 4, 17],
    [14, 4, 17],
    [15, 5, 17],
    [16, 6, 18],
    [20, 6, 18],
  ])("NH %i → crit success ≤%i, crit failure ≥%i", (nh, success, failure) => {
    expect(criticalRanges(nh)).toEqual({ success, failure });
  });

  test("a very low NH never lets the failure range swallow the 3–4 success range", () => {
    expect(criticalRanges(-10)).toEqual({ success: 4, failure: 5 });
  });
});
