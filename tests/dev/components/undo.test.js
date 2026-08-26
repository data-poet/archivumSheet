jest.mock("dev/public/js/store/persistence.js", () => ({
  showToast: jest.fn(),
}));

import { showToast } from "dev/public/js/store/persistence.js";
import { offerUndo } from "dev/public/js/components/undo.js";
import { t } from "dev/public/js/localization/pt-BR.js";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("offerUndo", () => {
  test("shows an info toast with a default 'Removido' message and an undo action", () => {
    const restoreFn = jest.fn();

    offerUndo(restoreFn);

    expect(showToast).toHaveBeenCalledWith(t("common.removed"), "info", {
      actionLabel: t("common.undo"),
      duration: 5000,
      onAction: restoreFn,
    });
  });

  test("accepts a custom message for non-removal mutations", () => {
    const restoreFn = jest.fn();

    offerUndo(restoreFn, t("common.added"));

    expect(showToast).toHaveBeenCalledWith(
      t("common.added"),
      "info",
      expect.any(Object),
    );
  });

  test("wires the toast's onAction straight to the given restoreFn", () => {
    const restoreFn = jest.fn();

    offerUndo(restoreFn);

    const options = showToast.mock.calls[0][2];
    options.onAction();
    expect(restoreFn).toHaveBeenCalledTimes(1);
  });
});
