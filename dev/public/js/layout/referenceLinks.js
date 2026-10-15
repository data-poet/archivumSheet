// Sheet tab panel → reference.html anchor, shown as a "?" link in the section's tab strip.
// Targets are reference tab ids (see js/reference/referenceLayout.js); a guard test keeps them valid.
export const REFERENCE_LINKS = {
  "tab-attr-primary": "tab-attr-primary",
  "tab-attr-secondary": "tab-attr-secondary",
  "tab-attr-damage": "tab-attr-base-damage",
  "tab-attr-resistances": "tab-attr-resistances",
  "tab-survival-thresholds": "tab-combat-rules",
};

export function referenceHref(anchor) {
  return `/reference.html#${anchor}`;
}
