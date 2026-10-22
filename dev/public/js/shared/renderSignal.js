// Fires once after every full inventory render (components/renderLists.js), so a storage list's
// Sortable instance (shared/sortable.js) attaches the moment its <tbody> first exists — on initial
// load and every autorun cycle, not only when that specific item type happens to re-render on its
// own. One-direction dependency on purpose: renderLists.js only imports this tiny module, never a
// type's model.js, so a subscriber (an events.js, which already imports both) can't create a
// model.js → ui.js → renderLists.js → model.js cycle.
const listeners = new Set();

export function onInventoryRendered(fn) {
  listeners.add(fn);
}

export function fireInventoryRendered() {
  listeners.forEach((fn) => fn());
}
