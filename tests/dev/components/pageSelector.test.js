import {
  initPageSelector,
  renderPageSelector,
  openPageSelector,
  closePageSelector,
  togglePageSelector,
  getCurrentPage,
} from "dev/public/js/components/pageSelector.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const SHELL = `
  <button id="page-selector-btn" aria-expanded="false"></button>
  <div id="page-selector-popover" class="char-selector-popover"></div>
`;

// jsdom's window.location isn't assignable, but pushState updates it for real.
function setPath(pathname) {
  window.history.pushState({}, "", pathname);
}

beforeEach(() => {
  resetDOM(SHELL);
  setPath("/");
});

describe("getCurrentPage", () => {
  test.each([
    ["/", "sheet"],
    ["/index.html", "sheet"],
    ["/reference.html", "reference"],
  ])("%s resolves to the %s page", (pathname, key) => {
    expect(getCurrentPage(pathname).key).toBe(key);
  });

  test("an unknown path resolves to no page rather than throwing", () => {
    expect(getCurrentPage("/nope.html")).toBeNull();
  });

  test("a trailing slash is normalized away", () => {
    expect(getCurrentPage("/reference.html/").key).toBe("reference");
  });

  // "/" must stay matched — the static server answers it with index.html.
  test("the bare root is not stripped to an empty path", () => {
    expect(getCurrentPage("/").key).toBe("sheet");
  });
});

describe("renderPageSelector", () => {
  test("the trigger shows the current page's label", () => {
    setPath("/reference.html");

    renderPageSelector();

    const btn = document.getElementById("page-selector-btn");
    expect(btn.textContent).toContain("Referência");
  });

  // The label is the only thing naming the page now, so it must never be empty.
  test("carries no emoji in the trigger or the rows", () => {
    renderPageSelector();

    const emoji = /\p{Extended_Pictographic}/u;
    expect(
      emoji.test(document.getElementById("page-selector-btn").textContent),
    ).toBe(false);
    document.querySelectorAll("#page-selector-popover a").forEach((a) => {
      expect(emoji.test(a.textContent)).toBe(false);
      expect(a.textContent.trim()).not.toBe("");
    });
  });

  test("one row per configured page, in config order", () => {
    renderPageSelector();

    const rows = document.querySelectorAll("#page-selector-popover a");
    expect(rows).toHaveLength(LABELS.pages.items.length);
    expect([...rows].map((a) => a.dataset.page)).toEqual(
      LABELS.pages.items.map((p) => p.key),
    );
  });

  // Same-tab navigation is a correctness requirement, not a preference: two live tabs
  // would race on localStorage through saveActiveCharacter().
  test("rows are real links with no target, so navigation stays in this tab", () => {
    renderPageSelector();

    document.querySelectorAll("#page-selector-popover a").forEach((a) => {
      expect(a.tagName).toBe("A");
      expect(a.getAttribute("href")).toBeTruthy();
      expect(a.hasAttribute("target")).toBe(false);
    });
  });

  test("the current page's row is marked active and aria-current", () => {
    setPath("/reference.html");

    renderPageSelector();

    const active = document.querySelector("#page-selector-popover a.is-active");
    expect(active.dataset.page).toBe("reference");
    expect(active.getAttribute("aria-current")).toBe("page");
    expect(
      document.querySelectorAll("#page-selector-popover a.is-active"),
    ).toHaveLength(1);
  });

  test("an unknown path leaves every row inactive without throwing", () => {
    setPath("/nope.html");

    expect(() => renderPageSelector()).not.toThrow();
    expect(
      document.querySelectorAll("#page-selector-popover a.is-active"),
    ).toHaveLength(0);
  });

  test("no-ops when the shell is absent, so a page may omit the selector", () => {
    resetDOM();
    expect(() => renderPageSelector()).not.toThrow();
  });
});

describe("open / close", () => {
  test("opening sets is-open and aria-expanded", () => {
    renderPageSelector();

    openPageSelector();

    expect(
      document.getElementById("page-selector-popover").classList,
    ).toContain("is-open");
    expect(
      document
        .getElementById("page-selector-btn")
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  test("closing clears both", () => {
    renderPageSelector();
    openPageSelector();

    closePageSelector();

    expect(
      document.getElementById("page-selector-popover").classList,
    ).not.toContain("is-open");
    expect(
      document
        .getElementById("page-selector-btn")
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  test("toggle flips the state", () => {
    renderPageSelector();

    togglePageSelector();
    expect(
      document.getElementById("page-selector-popover").classList,
    ).toContain("is-open");

    togglePageSelector();
    expect(
      document.getElementById("page-selector-popover").classList,
    ).not.toContain("is-open");
  });
});

describe("initPageSelector", () => {
  test("the trigger opens the popover on click", () => {
    initPageSelector();

    document.getElementById("page-selector-btn").click();

    expect(
      document.getElementById("page-selector-popover").classList,
    ).toContain("is-open");
  });

  test("Escape closes it and returns focus to the trigger", () => {
    initPageSelector();
    openPageSelector();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(
      document.getElementById("page-selector-popover").classList,
    ).not.toContain("is-open");
    expect(document.activeElement.id).toBe("page-selector-btn");
  });

  test("a click outside closes it", () => {
    initPageSelector();
    openPageSelector();

    document.body.click();

    expect(
      document.getElementById("page-selector-popover").classList,
    ).not.toContain("is-open");
  });

  test("a click inside leaves it open", () => {
    setPath("/reference.html");
    initPageSelector();
    openPageSelector();

    // A row other than the current page — choosing the current one closes it by design.
    document.querySelector('[data-page="sheet"]').click();

    expect(
      document.getElementById("page-selector-popover").classList,
    ).toContain("is-open");
  });

  // Reloading the page you're already on re-fetches every catalog for nothing.
  test("choosing the current page is prevented and just closes the popover", () => {
    setPath("/reference.html");
    initPageSelector();
    openPageSelector();

    const currentRow = document.querySelector('[data-page="reference"]');
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    currentRow.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(
      document.getElementById("page-selector-popover").classList,
    ).not.toContain("is-open");
  });

  test("choosing a different page is allowed to navigate", () => {
    setPath("/reference.html");
    initPageSelector();
    openPageSelector();

    const otherRow = document.querySelector('[data-page="sheet"]');
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    otherRow.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
