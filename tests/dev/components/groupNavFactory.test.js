// groupNav.test.js covers the default (sheet/reference) singleton; this covers what the
// factory itself has to guarantee once a second instance exists on the same page.
import { createGroupNav } from "dev/public/js/components/groupNav.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

const LAYOUT_A = [
  { group: "one", sections: [{ id: "a-1" }] },
  { group: "two", sections: [{ id: "a-2" }] },
];
const LABELS_A = {
  groupsAriaLabel: "A",
  groups: {
    one: { label: "One", short: "1", icon: "x" },
    two: { label: "Two", short: "2", icon: "y" },
  },
  sections: { "a-1": { label: "A1" }, "a-2": { label: "A2" } },
};

const LAYOUT_B = [
  { group: "red", sections: [{ id: "b-1" }] },
  { group: "blue", sections: [{ id: "b-2" }] },
];
const LABELS_B = {
  groupsAriaLabel: "B",
  groups: {
    red: { label: "Red", short: "R", icon: "r" },
    blue: { label: "Blue", short: "B", icon: "b" },
  },
  sections: { "b-1": { label: "B1" }, "b-2": { label: "B2" } },
};

function visible(root) {
  return Array.from(
    root.querySelectorAll(".l-section:not([hidden])"),
    (s) => s.id,
  );
}

beforeEach(() => {
  resetDOM();
  localStorage.clear();
  window.scrollTo = jest.fn();
});

test("two instances render into their own #navId without touching each other's markup", () => {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<nav id="nav-a"></nav><nav id="nav-b"></nav>`,
  );
  const navA = createGroupNav({ navId: "nav-a" });
  const navB = createGroupNav({ navId: "nav-b" });

  navA.initGroupNav({ layout: LAYOUT_A, labels: LABELS_A, storageKey: "k-a" });
  navB.initGroupNav({ layout: LAYOUT_B, labels: LABELS_B, storageKey: "k-b" });

  expect(
    document.querySelectorAll("#nav-a .groupnav-btn[data-group]"),
  ).toHaveLength(2);
  expect(
    document.querySelectorAll("#nav-b .groupnav-btn[data-group]"),
  ).toHaveLength(2);
  expect(document.querySelector("#nav-a .groupnav-btn").dataset.group).toBe(
    "one",
  );
  expect(document.querySelector("#nav-b .groupnav-btn").dataset.group).toBe(
    "red",
  );
});

test("sectionsRoot scopes which .l-section elements an instance can see or hide", () => {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<nav id="nav-a"></nav>
     <div id="scope-a"><section id="a-1" class="l-section"></section><section id="a-2" class="l-section"></section></div>
     <div id="scope-b"><section id="b-1" class="l-section"></section><section id="b-2" class="l-section"></section></div>`,
  );
  const scopeA = document.getElementById("scope-a");
  const scopeB = document.getElementById("scope-b");
  const navA = createGroupNav({ navId: "nav-a", sectionsRoot: scopeA });

  navA.initGroupNav({ layout: LAYOUT_A, labels: LABELS_A, storageKey: "k-a" });

  // Only scope A's sections were ever touched — b-1/b-2 default to visible (no hidden attr set).
  expect(visible(scopeA)).toEqual(["a-1"]);
  expect(visible(document)).toEqual(["a-1", "b-1", "b-2"]);

  navA.activateGroup("two");
  expect(visible(scopeA)).toEqual(["a-2"]);
  expect(visible(scopeB)).toEqual(["b-1", "b-2"]); // untouched by A's switch
});

test("activating one instance's group never hides a section belonging to another instance's scope", () => {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<nav id="nav-a"></nav><nav id="nav-b"></nav>
     <section id="a-1" class="l-section"></section>
     <section id="a-2" class="l-section"></section>
     <section id="b-1" class="l-section"></section>
     <section id="b-2" class="l-section"></section>`,
  );
  // Each instance scoped to a query that only matches its own sections, even though both
  // live in the same document — the realistic shape for two group bars on one page.
  const scopeA = {
    querySelectorAll: (sel) =>
      document.querySelectorAll(`#a-1${sel}, #a-2${sel}`),
  };
  const scopeB = {
    querySelectorAll: (sel) =>
      document.querySelectorAll(`#b-1${sel}, #b-2${sel}`),
  };
  const navA = createGroupNav({ navId: "nav-a", sectionsRoot: scopeA });
  const navB = createGroupNav({ navId: "nav-b", sectionsRoot: scopeB });

  navA.initGroupNav({ layout: LAYOUT_A, labels: LABELS_A, storageKey: "k-a" });
  navB.initGroupNav({ layout: LAYOUT_B, labels: LABELS_B, storageKey: "k-b" });

  expect(visible(document)).toEqual(["a-1", "b-1"]);

  navA.activateGroup("two");

  expect(visible(document)).toEqual(["a-2", "b-1"]); // B's selection survives A's switch
});

test("manageSidebar: false never touches the sidebar", () => {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<nav id="sidebar"></nav><nav id="nav-a"></nav>
     <section id="a-1" class="l-section"></section>`,
  );
  const navA = createGroupNav({ navId: "nav-a", manageSidebar: false });

  navA.initGroupNav({ layout: LAYOUT_A, labels: LABELS_A, storageKey: "k-a" });

  expect(document.getElementById("sidebar").innerHTML).toBe("");
});

test("each instance persists under its own storage key", () => {
  document.body.insertAdjacentHTML(
    "beforeend",
    `<nav id="nav-a"></nav><nav id="nav-b"></nav>`,
  );
  const navA = createGroupNav({ navId: "nav-a" });
  const navB = createGroupNav({ navId: "nav-b" });

  navA.initGroupNav({ layout: LAYOUT_A, labels: LABELS_A, storageKey: "k-a" });
  navB.initGroupNav({ layout: LAYOUT_B, labels: LABELS_B, storageKey: "k-b" });
  navA.activateGroup("two");
  navB.activateGroup("blue");

  expect(localStorage.getItem("k-a")).toBe("two");
  expect(localStorage.getItem("k-b")).toBe("blue");
});
