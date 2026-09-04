// Intentionally not persisted — tabs reset to their default on page load; this is a pure
// view concern with no meaning to the engine or persistence layers.
const _active = {};

export function getActiveTab(sectionId) {
  return _active[sectionId] ?? null;
}

export function setActiveTab(sectionId, tabId) {
  _active[sectionId] = tabId;
}
