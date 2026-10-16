import { showToast } from "dev/public/js/shared/toast.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

beforeEach(() => {
  resetDOM();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("showToast", () => {
  test("renders the message and the matching icon per type", () => {
    showToast("Saved!", "success");
    const toast = document.getElementById("_archivum-toast");
    expect(toast.querySelector(".toast-message").textContent).toBe("Saved!");
    expect(toast.querySelector(".toast-icon").textContent).toBe("✓");
    expect(toast.className).toBe("toast toast--success");
  });

  test("mounts into the persistent #toast-host live region when one exists", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="toast-host" aria-live="polite" aria-atomic="true"></div>`,
    );

    showToast("Announced", "success");

    const host = document.getElementById("toast-host");
    expect(host.querySelector("#_archivum-toast")).not.toBeNull();
    expect(host.getAttribute("aria-live")).toBe("polite");
  });

  test("escalates the live region to assertive for errors only", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="toast-host" aria-live="polite"></div>`,
    );
    const host = document.getElementById("toast-host");

    showToast("Broke", "error");
    expect(host.getAttribute("aria-live")).toBe("assertive");

    showToast("Fine", "success");
    expect(host.getAttribute("aria-live")).toBe("polite");
  });

  test("falls back to <body> when no host is present, without making <body> a live region", () => {
    showToast("No host", "error");

    expect(document.body.querySelector("#_archivum-toast")).not.toBeNull();
    expect(document.body.hasAttribute("aria-live")).toBe(false);
  });

  test("falls back to the info icon for an unrecognized type", () => {
    showToast("Hmm", "not-a-real-type");
    const toast = document.getElementById("_archivum-toast");
    expect(toast.querySelector(".toast-icon").textContent).toBe("ℹ");
  });

  test("replaces any existing toast rather than stacking them", () => {
    showToast("First");
    showToast("Second");
    const toasts = document.querySelectorAll("#_archivum-toast");
    expect(toasts).toHaveLength(1);
    expect(toasts[0].querySelector(".toast-message").textContent).toBe(
      "Second",
    );
  });

  test("renders an action button only when actionLabel + onAction are both given", () => {
    showToast("With action", "info", {
      actionLabel: "Desfazer",
      onAction: () => {},
    });
    expect(document.querySelector(".toast-action").textContent).toBe(
      "Desfazer",
    );
  });

  test("renders the action button even without onAction, but it's inert (no listener)", () => {
    // Markup is gated on actionLabel alone; the click listener needs actionLabel && onAction.
    showToast("No handler", "info", { actionLabel: "Desfazer" });
    const button = document.querySelector(".toast-action");
    expect(button.textContent).toBe("Desfazer");
    expect(() => button.dispatchEvent(new Event("click"))).not.toThrow();
  });

  test("clicking the action button calls onAction and starts the dismiss", () => {
    const onAction = jest.fn();
    showToast("Actionable", "info", { actionLabel: "Desfazer", onAction });

    document.querySelector(".toast-action").dispatchEvent(new Event("click"));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(
      document
        .getElementById("_archivum-toast")
        .classList.contains("is-visible"),
    ).toBe(false);
  });

  test("fades in on the next frame", () => {
    showToast("Fade in");
    const toast = document.getElementById("_archivum-toast");
    expect(toast.classList.contains("is-visible")).toBe(false);

    // advanceTimersToNextFrame() flushes only the fade-in rAF, not the 3000ms
    // dismiss timer; runOnlyPendingTimers() would fire both and defeat this test.
    jest.advanceTimersToNextFrame();

    expect(toast.classList.contains("is-visible")).toBe(true);
  });

  test("auto-dismisses after the default 3000ms", () => {
    showToast("Auto dismiss");
    jest.advanceTimersToNextFrame(); // flush the fade-in first
    const toast = document.getElementById("_archivum-toast");

    jest.advanceTimersByTime(3000);

    expect(toast.classList.contains("is-visible")).toBe(false);
  });

  test("respects a custom duration", () => {
    showToast("Quick", "info", { duration: 500 });
    jest.advanceTimersToNextFrame(); // consumes ~16ms of virtual time itself
    const toast = document.getElementById("_archivum-toast");

    jest.advanceTimersByTime(400);
    expect(toast.classList.contains("is-visible")).toBe(true);

    jest.advanceTimersByTime(200); // total now well past the 500ms duration
    expect(toast.classList.contains("is-visible")).toBe(false);
  });

  test("fully removes the element once the dismiss transition ends", () => {
    showToast("Removable");
    const toast = document.getElementById("_archivum-toast");

    jest.advanceTimersByTime(3000); // triggers dismiss()
    toast.dispatchEvent(new Event("transitionend"));

    expect(document.getElementById("_archivum-toast")).toBeNull();
  });
});
