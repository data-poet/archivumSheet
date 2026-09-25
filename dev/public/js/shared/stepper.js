// Generic +/- click handling for `.num-stepper` widgets. Split out of events/index.js
// so ally resume rendering can wire the same steppers without pulling in that file's
// engine/inventory imports.

export function bindStepperButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".stepper-btn");
    if (!btn) return;
    const input = btn.closest(".num-stepper")?.querySelector("input");
    if (!input) return;
    const step = parseFloat(input.dataset.step ?? input.step) || 1;
    const current = parseFloat(input.value) || 0;
    let next = btn.classList.contains("stepper-inc")
      ? current + step
      : current - step;
    if (input.dataset.min !== undefined)
      next = Math.max(next, Number(input.dataset.min));
    if (input.dataset.max !== undefined)
      next = Math.min(next, Number(input.dataset.max));
    input.value = next;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
