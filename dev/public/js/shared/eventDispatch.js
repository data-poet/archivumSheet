// Whether a click started inside one of the given elements.
//
// composedPath() is captured when the event is dispatched, so it still answers correctly if a
// handler replaced the clicked node before the event reached document — which the selectors do:
// opening one re-renders its own trigger, orphaning the span that was clicked, and a
// contains(e.target) test would then wrongly report the click as coming from outside.
export function clickStartedInside(event, ...elements) {
  const targets = elements.filter(Boolean);
  if (targets.length === 0) return false;

  const path = event.composedPath?.();
  if (path?.length) return targets.some((el) => path.includes(el));

  return targets.some((el) => el.contains(event.target));
}
