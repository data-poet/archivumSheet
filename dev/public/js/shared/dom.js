export function el(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`[dom] Element #${id} not found`);
  }
  return element;
}

export function qs(selector, scope = document) {
  const element = scope.querySelector(selector);
  if (!element) {
    console.warn(`[dom] Selector "${selector}" matched nothing`);
  }
  return element;
}

export function on(id, event, handler) {
  const element = el(id);
  if (element) {
    element.addEventListener(event, handler);
  }
}

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

export function setHTML(id, html) {
  const element = el(id);
  if (element) {
    element.innerHTML = html;
  }
}
