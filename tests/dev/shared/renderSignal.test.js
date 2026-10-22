import {
  onInventoryRendered,
  fireInventoryRendered,
} from "dev/public/js/shared/renderSignal.js";

test("calls every registered listener on fire", () => {
  const a = jest.fn();
  const b = jest.fn();
  onInventoryRendered(a);
  onInventoryRendered(b);

  fireInventoryRendered();

  expect(a).toHaveBeenCalledTimes(1);
  expect(b).toHaveBeenCalledTimes(1);
});

test("firing with no listeners is a no-op", () => {
  expect(() => fireInventoryRendered()).not.toThrow();
});

test("the same function registered twice only runs once per fire", () => {
  const fn = jest.fn();
  onInventoryRendered(fn);
  onInventoryRendered(fn);

  fireInventoryRendered();

  expect(fn).toHaveBeenCalledTimes(1);
});
