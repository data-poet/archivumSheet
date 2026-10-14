// Intentionally not persisted — sections start expanded on every page load, then keep
// their state for the rest of the session.
const _state = {};

// Sections that have never been toggled return false (start open), so switching to a
// group shows its content without a tap per section.
export function isCollapsed(sectionId) {
  return _state[sectionId] ?? false;
}

export function setCollapsed(sectionId, collapsed) {
  _state[sectionId] = collapsed;
}
