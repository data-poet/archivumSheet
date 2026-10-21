// Resume sections rebuild their markup on every autorun tick; morphing in place instead of
// replacing it via innerHTML is what keeps a focused input, its caret and whatever the user is
// mid-typing intact across that rebuild.
import { Idiomorph } from "../../vendor/idiomorph/idiomorph.esm.js";

// `ignoreActiveValue` is what stops a freshly rendered value from overwriting a focused input
// mid-edit; idiomorph's own default `restoreFocus` is what keeps focus itself from moving even
// when sibling nodes are added or removed. A row idiomorph can't match to its old self (no
// stable `id`) is matched by position instead, silently moving focus onto the wrong row — every
// resume row template needs one.
export function morphHTML(container, html) {
  if (!container) return;
  Idiomorph.morph(container, html, {
    morphStyle: "innerHTML",
    ignoreActiveValue: true,
  });
}
