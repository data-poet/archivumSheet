// Intentionally not persisted — sections start collapsed on every page load, then keep
// their state for the rest of the session.
const _state = {};

// Sections that have never been toggled return true (start closed).
export function isCollapsed(sectionId) {
  return _state[sectionId] ?? true;
}

export function setCollapsed(sectionId, collapsed) {
  _state[sectionId] = collapsed;
}
