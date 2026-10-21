// Resume sections rebuild their markup on every autorun tick; morphing in place instead of
// replacing it via innerHTML is what keeps a focused input, its caret and whatever the user is
// mid-typing intact across that rebuild.
import { Idiomorph } from "../../vendor/idiomorph/idiomorph.esm.js";

// `ignoreActiveValue` is what stops a freshly rendered value from overwriting a focused input
// mid-edit; idiomorph's own default `restoreFocus` is what keeps focus itself from moving even
// when sibling nodes are added or removed. A row idiomorph can't match to its old self (no
// stable `id`) is matched by position instead, silently moving focus onto the wrong row — every
// row template needs one.

// Mobile card-expand (tables.css's table-wrapper--stack, tr.is-card-expanded) and an open
// <details> are both toggled imperatively by a click handler (cardCollapse.js; openState.js),
// never present in the freshly rendered markup itself — without this guard, idiomorph strips
// both because the new source doesn't have them, silently re-collapsing whatever the user just
// opened on the very next render. Confirmed empirically (no callback: class → "", open → false;
// with it: both survive) before adding this, not assumed.
function _preserveImperativeState(attr, element) {
  if (attr === "open" && element.tagName === "DETAILS") return false;
  if (attr === "class" && element.classList.contains("is-card-expanded"))
    return false;
  return true;
}

export function morphHTML(container, html) {
  if (!container) return;
  Idiomorph.morph(container, html, {
    morphStyle: "innerHTML",
    ignoreActiveValue: true,
    callbacks: { beforeAttributeUpdated: _preserveImperativeState },
  });
}
