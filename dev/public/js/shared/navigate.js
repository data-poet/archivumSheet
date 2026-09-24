// Thin wrapper so same-tab navigation can be mocked in tests — jsdom's window.location
// is non-configurable, so tests can't spy on window.location.assign directly.
export function navigateTo(href) {
  window.location.assign(href);
}
