// localStorage keys. The values are already on users' devices, so changing one orphans saved data
// (note "archivum_characters" uses "_" where the rest use ":"). The inline theme script in
// index.html and reference.html can't import this; a test keeps its copy in sync.
export const STORAGE_KEYS = Object.freeze({
  characters: "archivum_characters",
  theme: "archivum:theme",
  viewMode: "archivum:viewMode",
  activeGroup: "archivum:activeGroup",
  referenceGroup: "archivum:referenceGroup",
  resumeGroup: "archivum:resumeGroup",
  // Opt-in only, never set by the app itself — see shared/timing.js.
  debugTiming: "archivum:debugTiming",
});
