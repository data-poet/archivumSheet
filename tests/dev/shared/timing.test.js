import {
  isTimingEnabled,
  mark,
  logRunTiming,
} from "dev/public/js/shared/timing.js";

beforeEach(() => localStorage.clear());

describe("isTimingEnabled", () => {
  test("false by default", () => {
    expect(isTimingEnabled()).toBe(false);
  });

  test('true only when the flag is exactly "1"', () => {
    localStorage.setItem("archivum:debugTiming", "1");
    expect(isTimingEnabled()).toBe(true);

    localStorage.setItem("archivum:debugTiming", "true");
    expect(isTimingEnabled()).toBe(false);
  });
});

test("mark() returns performance.now()", () => {
  const spy = jest.spyOn(performance, "now").mockReturnValue(123.45);

  expect(mark()).toBe(123.45);
  spy.mockRestore();
});

test("logRunTiming() prints the entry as a table", () => {
  const spy = jest.spyOn(console, "table").mockImplementation(() => {});
  const entry = { totalMs: 12.3 };

  logRunTiming(entry);

  expect(spy).toHaveBeenCalledWith(entry);
  spy.mockRestore();
});
