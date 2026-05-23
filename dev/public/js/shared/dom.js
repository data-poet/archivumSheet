/**
 * Safely retrieve a DOM element by id.
 * Returns null (and logs a warning) if not found, instead of throwing.
 *
 * @param {string} id
 * @returns {HTMLElement|null}
 */
export function el(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`[dom] Element #${id} not found`);
  }
  return element;
}

/**
 * Safely query the first matching selector.
 *
 * @param {string} selector
 * @param {Element} [scope=document]
 * @returns {Element|null}
 */
export function qs(selector, scope = document) {
  const element = scope.querySelector(selector);
  if (!element) {
    console.warn(`[dom] Selector "${selector}" matched nothing`);
  }
  return element;
}

/**
 * Attach an event listener only if the element exists.
 *
 * @param {string} id
 * @param {string} event
 * @param {Function} handler
 */
export function on(id, event, handler) {
  const element = el(id);
  if (element) {
    element.addEventListener(event, handler);
  }
}

/**
 * Populate a <select> element from an array of { value, label } objects.
 * Clears existing options first.
 *
 * @param {string|HTMLSelectElement} target  - id string or the element itself
 * @param {Array<{value: string, label: string}>} options
 */
export function populateSelect(target, options) {
  const select = typeof target === "string" ? el(target) : target;
  if (!select) return;

  select.innerHTML = "";
  options.forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
}

/**
 * Set the inner HTML of an element by id.
 *
 * @param {string} id
 * @param {string} html
 */
export function setHTML(id, html) {
  const element = el(id);
  if (element) {
    element.innerHTML = html;
  }
}
