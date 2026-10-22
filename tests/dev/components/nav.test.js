import {
  initNav,
  renderSidebarSections,
} from "dev/public/js/components/nav.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";
import { LAYOUT_SECTIONS } from "dev/public/js/layout/sheetLayout.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import {
  installMockFetch,
  mockFetchResponse,
  mockFetchError,
} from "tests/dev/helpers/mockFetch.js";
import { icon } from "dev/public/js/shared/icons.js";

// jsdom implements neither scrollIntoView nor IntersectionObserver.
class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
    MockIntersectionObserver.instances.push(this);
  }
  observe(el) {
    this.observed.push(el);
  }
  disconnect() {}
}
MockIntersectionObserver.instances = [];

function navDOM() {
  document.body.insertAdjacentHTML("beforeend", `<nav id="sidebar"></nav>`);
}

function sectionDOM(...ids) {
  ids.forEach((id) => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<section id="${id}" class="l-section"></section>`,
    );
  });
}

beforeEach(() => {
  resetDOM();
  navDOM();
  Element.prototype.scrollIntoView = jest.fn();
  MockIntersectionObserver.instances = [];
  global.IntersectionObserver = MockIntersectionObserver;
});

describe("initNav — building the nav bars", () => {
  test("renders one sidebar link per layout section, first one active, with icon/label/data-section/accent", () => {
    initNav();

    const links = document.querySelectorAll("#sidebar .sidebar-link");
    expect(links).toHaveLength(LAYOUT_SECTIONS.length);
    expect(links[0].classList.contains("is-active")).toBe(true);
    expect(links[1].classList.contains("is-active")).toBe(false);

    const first = LAYOUT_SECTIONS[0];
    const { label } = LABELS.nav.sections[first.id];
    expect(links[0].dataset.section).toBe(first.id);
    expect(links[0].dataset.accent).toBe(first.accent);
    expect(links[0].getAttribute("href")).toBe(`#${first.id}`);
    expect(links[0].querySelector(".sidebar-icon").textContent).toBe(
      icon(first.icon),
    );
    expect(links[0].querySelector(".sidebar-label").textContent).toBe(label);
  });

  test("does not throw when #sidebar is missing", () => {
    resetDOM();
    expect(() => initNav()).not.toThrow();
  });

  test("re-running initNav doesn't duplicate the sidebar <ul>", () => {
    initNav();
    initNav();
    expect(document.querySelectorAll("#sidebar .sidebar-nav")).toHaveLength(1);
    expect(document.querySelectorAll("#sidebar .sidebar-link")).toHaveLength(
      LAYOUT_SECTIONS.length,
    );
  });
});

describe("renderSidebarSections", () => {
  test("renders only the given sections, in the given order, first one active", () => {
    initNav();
    renderSidebarSections([LAYOUT_SECTIONS[1], LAYOUT_SECTIONS[3]]);

    const links = document.querySelectorAll("#sidebar .sidebar-link");
    expect(Array.from(links, (l) => l.dataset.section)).toEqual([
      LAYOUT_SECTIONS[1].id,
      LAYOUT_SECTIONS[3].id,
    ]);
    expect(links[0].classList.contains("is-active")).toBe(true);
    expect(document.querySelectorAll("#sidebar .sidebar-nav")).toHaveLength(1);
  });
});

describe("renderSidebarSections — icon-only sections", () => {
  test("an iconOnly section drops the visible label, using it as the link's aria-label instead", () => {
    initNav();
    const [a, b] = LAYOUT_SECTIONS;
    renderSidebarSections([{ ...a, iconOnly: true }, b], LABELS.nav.sections);

    const links = document.querySelectorAll("#sidebar .sidebar-link");
    expect(links[0].querySelector(".sidebar-label")).toBeNull();
    expect(links[0].getAttribute("aria-label")).toBe(
      LABELS.nav.sections[a.id].label,
    );
    expect(links[1].querySelector(".sidebar-label")).not.toBeNull();
  });
});

describe("initNav — click highlighting", () => {
  const nativeMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = nativeMatchMedia;
  });

  test("clicking a sidebar link prevents default, scrolls to the target section, and marks it active", () => {
    initNav();
    sectionDOM(LAYOUT_SECTIONS[1].id);

    const link = document.querySelectorAll("#sidebar .sidebar-link")[1];
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(link.classList.contains("is-active")).toBe(true);
    expect(
      document
        .querySelectorAll("#sidebar .sidebar-link")[0]
        .classList.contains("is-active"),
    ).toBe(false);
  });

  test("scrolls without animation when the OS reduce-motion setting is on", () => {
    window.matchMedia = jest.fn(() => ({ matches: true }));
    initNav();
    sectionDOM(LAYOUT_SECTIONS[1].id);

    document
      .querySelectorAll("#sidebar .sidebar-link")[1]
      .dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  test("does not throw when the clicked link's target section isn't in the DOM", () => {
    initNav();
    const link = document.querySelectorAll("#sidebar .sidebar-link")[1];
    expect(() =>
      link.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    ).not.toThrow();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  test("a click outside any nav link is ignored", () => {
    initNav();
    document.body.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("initNav — sidebar version", () => {
  beforeEach(() => {
    installMockFetch();
  });

  test("fetches /api/app-info and renders the version into the sidebar", async () => {
    mockFetchResponse("/api/app-info", { version: "1.8.14" });
    initNav();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      document.querySelector("#sidebar .sidebar-version").textContent,
    ).toBe("v1.8.14");
  });

  test("removes the version element when the fetch fails", async () => {
    mockFetchError("/api/app-info", 500);
    initNav();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector("#sidebar .sidebar-version")).toBeNull();
  });
});

describe("initNav — scroll-driven highlighting", () => {
  test("observes every .l-section with a 0.25 threshold", () => {
    initNav();
    sectionDOM(LAYOUT_SECTIONS[0].id, LAYOUT_SECTIONS[1].id);
    // Re-init: the observer is set up once over whatever .l-section elements exist at call time.
    initNav();

    const observer = MockIntersectionObserver.instances.at(-1);
    expect(observer.options).toEqual({ threshold: 0.25 });
    expect(observer.observed).toHaveLength(2);
  });

  test("marks a section's nav link active when it intersects the viewport", () => {
    sectionDOM(LAYOUT_SECTIONS[3].id);
    initNav();

    const observer = MockIntersectionObserver.instances.at(-1);
    observer.callback([
      { isIntersecting: true, target: { id: LAYOUT_SECTIONS[3].id } },
    ]);

    const link = document.querySelector(
      `#sidebar .sidebar-link[data-section="${LAYOUT_SECTIONS[3].id}"]`,
    );
    expect(link.classList.contains("is-active")).toBe(true);
  });

  test("ignores entries that are not currently intersecting", () => {
    sectionDOM(LAYOUT_SECTIONS[4].id);
    initNav();

    const observer = MockIntersectionObserver.instances.at(-1);
    observer.callback([
      { isIntersecting: false, target: { id: LAYOUT_SECTIONS[4].id } },
    ]);

    const link = document.querySelector(
      `#sidebar .sidebar-link[data-section="${LAYOUT_SECTIONS[4].id}"]`,
    );
    expect(link.classList.contains("is-active")).toBe(false);
  });
});
