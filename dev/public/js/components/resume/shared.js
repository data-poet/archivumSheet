// Cross-section resume helpers: the collapsible-section machinery and the two
// stepper cells reused by the equipment and supplies sections.

import { el } from "../../shared/dom.js";

const _collapseOpen = new Map();

export function hpStepperCell({
  cssClass,
  dataAttrs,
  maxHp,
  modifier,
  actualHp,
}) {
  return `
    <td>
      <div class="hp-modifier">
        <div class="num-stepper">
          <input
            type="text"
            inputmode="numeric"
            class="${cssClass}"
            ${dataAttrs}
            value="${modifier}"
          />
          <div class="stepper-btns">
            <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
            <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
          </div>
        </div>
        <strong class="resume-hp-actual">${actualHp}</strong>/<strong>${maxHp}</strong>
      </div>
    </td>
  `;
}

export function roundsStepperCell({
  cssClass,
  dataAttrs,
  magazineSize,
  roundsLoaded,
}) {
  return `
    <td>
      <div class="hp-modifier">
        <div class="num-stepper">
          <input
            type="text"
            inputmode="numeric"
            class="${cssClass}"
            ${dataAttrs}
            data-min="0"
            data-max="${magazineSize}"
            value="${roundsLoaded}"
          />
          <div class="stepper-btns">
            <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
            <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
          </div>
        </div>
        / <strong>${magazineSize}</strong>
      </div>
    </td>
  `;
}

export function collapsibleHeader(title) {
  return `
    <button class="resume-section-toggle" type="button" aria-expanded="false">
      <span class="resume-expander-arrow">&#8250;</span>
      <span class="resume-section-title">${title}</span>
    </button>
  `;
}

export function bindCollapse(container) {
  const btn = container.querySelector(".resume-section-toggle");
  const body = container.querySelector(".resume-collapse-body");
  if (!btn || !body) return;

  const title = btn.querySelector(".resume-section-title")?.textContent ?? "";
  const isOpen = _collapseOpen.get(title) ?? false;

  body.hidden = !isOpen;
  btn.setAttribute("aria-expanded", String(isOpen));
  const arrow = btn.querySelector(".resume-expander-arrow");
  if (arrow) arrow.classList.toggle("resume-expander-arrow--open", isOpen);
}

export function renderCollapsibleNameList(containerId, entries, title) {
  const container = el(containerId);
  if (!container) return;

  if (entries.length === 0) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const rows = entries
    .map((item) => `<tr><td>${item.name ?? "—"}</td></tr>`)
    .join("");

  container.innerHTML = `
    ${collapsibleHeader(title)}
    <div class="resume-collapse-body">
      <div class="table-wrapper">
        <table class="resume-table">
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
  bindCollapse(container);
}

let _expandersBound = false;
export function initResumeExpanders() {
  if (_expandersBound) return;
  _expandersBound = true;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".resume-section-toggle");
    if (!btn) return;
    const parent = btn.parentElement;
    if (!parent) return;
    const body = parent.querySelector(".resume-collapse-body");
    if (!body) return;

    const isOpen = body.hidden === false;
    const title = btn.querySelector(".resume-section-title")?.textContent ?? "";

    body.hidden = isOpen;
    btn.setAttribute("aria-expanded", String(!isOpen));
    const arrow = btn.querySelector(".resume-expander-arrow");
    if (arrow) arrow.classList.toggle("resume-expander-arrow--open", !isOpen);

    _collapseOpen.set(title, !isOpen);
  });
}
