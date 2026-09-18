// A one-line wrapper so callers can be tested: jsdom's window.location is neither assignable
// nor configurable, and its reload() is unimplemented, so a direct call is unobservable.
export function reloadPage() {
  window.location.reload();
}
