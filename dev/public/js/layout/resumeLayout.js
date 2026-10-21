// The resume's own group→section membership — distinct from SHEET_LAYOUT's, which slices by
// where a rule lives (so an edit author finds it). This slices by when a player reaches for it
// in play: conditions sit with attributes here, not with "character info" as they do in edit mode.
// Same `{ group, icon, sections: [{ id }] }` shape groupNav.js already reads, so the resume's
// own createGroupNav() instance (main.js) needs no extra logic beyond a different layout object.
export const RESUME_LAYOUT = [
  {
    group: "status",
    icon: "attributes",
    sections: [
      { id: "resume-section-attributes" },
      { id: "resume-section-status" },
    ],
  },
  {
    group: "combat",
    icon: "combat",
    sections: [
      { id: "resume-section-weapons" },
      { id: "resume-section-protection" },
      { id: "resume-section-supplies" },
      { id: "resume-section-alchemy" },
    ],
  },
  {
    group: "abilities",
    icon: "abilities",
    sections: [
      { id: "resume-section-training" },
      { id: "resume-section-traits" },
    ],
  },
  {
    group: "info",
    icon: "output",
    sections: [
      { id: "resume-section-weight" },
      { id: "resume-section-value" },
      { id: "resume-section-points" },
    ],
  },
];
