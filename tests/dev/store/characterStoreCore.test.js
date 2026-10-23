jest.mock("dev/public/js/shared/toast.js", () => ({
  showToast: jest.fn(),
}));

import { showToast } from "dev/public/js/shared/toast.js";
import {
  loadStore,
  saveStore,
} from "dev/public/js/store/characterStoreCore.js";

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("saveStore", () => {
  test("writes the store to localStorage", () => {
    saveStore({ list: [{ id: "c-1" }] });
    expect(loadStore()).toEqual({ list: [{ id: "c-1" }] });
    expect(showToast).not.toHaveBeenCalled();
  });

  // The whole character/ally roster shares one localStorage key, so a quota overflow (e.g. a
  // large portrait pushing the blob over the browser's limit) drops every unsaved field, not
  // just the portrait — silently, unless this toast fires.
  test("surfaces a toast instead of silently dropping the write on quota overflow", () => {
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("quota exceeded", "QuotaExceededError");
      });

    expect(() => saveStore({ list: [] })).not.toThrow();
    expect(showToast).toHaveBeenCalledWith(expect.any(String), "error");

    setItemSpy.mockRestore();
  });
});
