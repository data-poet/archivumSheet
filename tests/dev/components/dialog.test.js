import { showConfirm } from "dev/public/js/components/dialog.js";
import { t } from "dev/public/js/localization/pt-BR.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function overlay() {
  return document.getElementById("_archivum-dialog");
}

beforeEach(() => {
  resetDOM();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("showConfirm — rendering", () => {
  test("renders the message and default button labels, without a title", () => {
    showConfirm({ message: "Tem certeza?" });

    expect(overlay().querySelector(".dialog-message").textContent).toBe(
      "Tem certeza?",
    );
    expect(overlay().querySelector(".dialog-title")).toBeNull();
    expect(overlay().querySelector(".dialog-btn-cancel").textContent).toBe(
      t("dialog.cancel"),
    );
    expect(overlay().querySelector(".dialog-btn-confirm").textContent).toBe(
      t("dialog.confirm"),
    );
  });

  test("renders a title when given", () => {
    showConfirm({ message: "x", title: "Excluir personagem" });
    expect(overlay().querySelector(".dialog-title").textContent).toBe(
      "Excluir personagem",
    );
  });

  test("accepts custom button labels", () => {
    showConfirm({
      message: "x",
      confirmLabel: "Sim, excluir",
      cancelLabel: "Não",
    });
    expect(overlay().querySelector(".dialog-btn-cancel").textContent).toBe(
      "Não",
    );
    expect(overlay().querySelector(".dialog-btn-confirm").textContent).toBe(
      "Sim, excluir",
    );
  });

  test("styles the confirm button as destructive when danger is true", () => {
    showConfirm({ message: "x", danger: true });
    expect(overlay().querySelector(".dialog-btn-danger")).not.toBeNull();
    expect(overlay().querySelector(".dialog-btn-confirm")).toBeNull();
  });

  test("focuses the confirm button so Enter confirms by default", () => {
    showConfirm({ message: "x" });
    const confirmBtn = overlay().querySelector(
      ".dialog-btn-danger, .dialog-btn-confirm",
    );
    expect(document.activeElement).toBe(confirmBtn);
  });

  test("fades in on the next animation frame", () => {
    showConfirm({ message: "x" });
    expect(overlay().classList.contains("is-visible")).toBe(false);
    jest.advanceTimersToNextFrame();
    expect(overlay().classList.contains("is-visible")).toBe(true);
  });

  test("replaces an already-open dialog rather than stacking them", () => {
    showConfirm({ message: "first" });
    showConfirm({ message: "second" });
    expect(document.querySelectorAll("#_archivum-dialog")).toHaveLength(1);
    expect(overlay().querySelector(".dialog-message").textContent).toBe(
      "second",
    );
  });
});

describe("showConfirm — resolution", () => {
  test("resolves true and removes the dialog when the confirm button is clicked", async () => {
    const result = showConfirm({ message: "x" });
    overlay().querySelector(".dialog-btn-confirm").click();
    await expect(result).resolves.toBe(true);
    expect(overlay()).toBeNull();
  });

  test("resolves false when the cancel button is clicked", async () => {
    const result = showConfirm({ message: "x" });
    overlay().querySelector(".dialog-btn-cancel").click();
    await expect(result).resolves.toBe(false);
  });

  test("resolves false when clicking the backdrop outside the card", async () => {
    const result = showConfirm({ message: "x" });
    overlay().dispatchEvent(new Event("click", { bubbles: true }));
    await expect(result).resolves.toBe(false);
  });

  test("does not resolve when clicking inside the card itself", () => {
    showConfirm({ message: "x" });
    const card = overlay().querySelector(".dialog-card");
    // Clicking the card bubbles to the overlay, but e.target is the card,
    // not the overlay, so the "click outside" branch must not fire.
    card.dispatchEvent(new Event("click", { bubbles: true }));
    expect(overlay()).not.toBeNull();
  });

  test("resolves false when Escape is pressed", async () => {
    const result = showConfirm({ message: "x" });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await expect(result).resolves.toBe(false);
  });

  test("ignores keys other than Escape", () => {
    showConfirm({ message: "x" });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(overlay()).not.toBeNull();
  });

  test("removes the global keydown listener once closed, so a later Escape is inert", async () => {
    const result = showConfirm({ message: "x" });
    overlay().querySelector(".dialog-btn-confirm").click();
    await result;

    // Should not throw, and definitely shouldn't try to resolve an
    // already-settled promise or touch a removed overlay.
    expect(() =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    ).not.toThrow();
  });
});
