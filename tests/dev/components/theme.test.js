jest.mock("dev/public/js/store/themeState.js", () => ({
  getTheme: jest.fn(),
  setTheme: jest.fn(),
}));

import { getTheme, setTheme } from "dev/public/js/store/themeState.js";
import { initTheme } from "dev/public/js/components/theme.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

// jsdom doesn't implement matchMedia; stub it so tests can set the system preference and fire "change".
function mockMatchMedia(initialMatches) {
  const listeners = [];
  const mql = {
    matches: initialMatches,
    addEventListener: (event, cb) => listeners.push(cb),
    removeEventListener: jest.fn(),
  };
  window.matchMedia = jest.fn().mockReturnValue(mql);
  return {
    fireSystemChange(matches) {
      mql.matches = matches;
      listeners.forEach((cb) => cb({ matches }));
    },
  };
}

function btnDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<button id="theme-toggle-btn"></button>`,
  );
}

beforeEach(() => {
  resetDOM();
  jest.clearAllMocks();
});

describe("initTheme — initial resolution", () => {
  test("follows the system preference when the user has no manual choice", () => {
    getTheme.mockReturnValue(null);
    mockMatchMedia(true);
    btnDOM();

    initTheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    const btn = document.getElementById("theme-toggle-btn");
    expect(btn.textContent).toBe(t("theme.iconDark"));
    expect(btn.getAttribute("aria-label")).toBe(t("theme.ariaDark"));
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  test("resolves to light when the system does not prefer dark", () => {
    getTheme.mockReturnValue(null);
    mockMatchMedia(false);
    btnDOM();

    initTheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    const btn = document.getElementById("theme-toggle-btn");
    expect(btn.textContent).toBe(t("theme.iconLight"));
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  test("a manual choice wins over the system preference", () => {
    getTheme.mockReturnValue("light");
    mockMatchMedia(true);
    btnDOM();

    initTheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  test("does not throw when the toggle button isn't in the DOM", () => {
    getTheme.mockReturnValue(null);
    mockMatchMedia(false);
    expect(() => initTheme()).not.toThrow();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("initTheme — toggle button", () => {
  test("clicking the button flips the resolved theme and persists the choice", () => {
    getTheme.mockReturnValue(null);
    mockMatchMedia(false);
    btnDOM();
    initTheme();

    document.getElementById("theme-toggle-btn").click();

    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  test("toggling back from dark goes to light", () => {
    getTheme.mockReturnValue("dark");
    mockMatchMedia(false);
    btnDOM();
    initTheme();

    document.getElementById("theme-toggle-btn").click();

    expect(setTheme).toHaveBeenCalledWith("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("initTheme — live system-preference following", () => {
  test("updates the theme when the OS preference changes and there's no manual override", () => {
    getTheme.mockReturnValue(null);
    const { fireSystemChange } = mockMatchMedia(false);
    btnDOM();
    initTheme();

    fireSystemChange(true);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  test("ignores OS preference changes once the user has manually pinned a theme", () => {
    getTheme.mockReturnValue("light");
    const { fireSystemChange } = mockMatchMedia(false);
    btnDOM();
    initTheme();

    fireSystemChange(true);

    // Manual pin (getTheme() truthy) short-circuits the system-change handler before applyTheme runs.
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
