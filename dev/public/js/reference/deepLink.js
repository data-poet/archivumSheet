// reference.html#<id> opens whatever holds that id: a tab panel, a section, or an item/heading anchor
// (see _assignAnchors in enhance.js). Runs after the markdown has loaded, since anchors come from it.
import { activateGroup } from "./groupNav.js";
import { openSection } from "../components/tabs.js";
import { REFERENCE_LAYOUT } from "./referenceLayout.js";

function _groupOf(sectionId) {
  return REFERENCE_LAYOUT.find(({ sections }) =>
    sections.some(({ id }) => id === sectionId),
  )?.group;
}

export function revealAnchor(id) {
  const target = id ? document.getElementById(id) : null;
  const section = target?.closest(".l-section");
  if (!section) return false;

  activateGroup(_groupOf(section.id));
  openSection(section.id, target.closest(".tab-panel")?.id);

  for (
    let d = target.closest("details");
    d;
    d = d.parentElement?.closest("details")
  ) {
    d.open = true;
  }

  let scrollTarget = target;
  if (target.matches(".tab-panel, .l-section")) scrollTarget = section;
  else if (target.tagName === "DETAILS")
    scrollTarget = target.querySelector(":scope > summary");
  requestAnimationFrame(() =>
    scrollTarget?.scrollIntoView?.({ block: "start" }),
  );
  return true;
}

function _revealFromHash() {
  revealAnchor(decodeURIComponent(window.location.hash.slice(1)));
}

export function initDeepLinks() {
  _revealFromHash();
  window.addEventListener("hashchange", _revealFromHash);
}
