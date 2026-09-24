// Split out of store/persistence.js: that module imports compute/autorun.js for its
// save/export flows, and the allies page's import graph is guarded against ever reaching
// compute/* (see tests/dev/allies/main.test.js). This file stays a leaf so both pages can
// show a toast.

const TOAST_ICONS = { success: "✓", error: "✕", info: "ℹ" };

export function showToast(message, type = "success", options = {}) {
  document.getElementById("_archivum-toast")?.remove();

  const { actionLabel, onAction, duration = 3000 } = options;
  const icon = TOAST_ICONS[type] ?? TOAST_ICONS.info;

  const toast = document.createElement("div");
  toast.id = "_archivum-toast";
  toast.className = `toast toast--${type}`;

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${message}</span>
    ${actionLabel ? `<button type="button" class="toast-action">${actionLabel}</button>` : ""}
  `;
  // A live region only announces mutations it was already present for, so the toast goes into the
  // persistent #toast-host rather than straight into <body>.
  const host = document.getElementById("toast-host");
  if (host) {
    host.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  }
  (host ?? document.body).appendChild(toast);

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.remove("is-visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  };

  if (actionLabel && onAction) {
    toast.querySelector(".toast-action")?.addEventListener("click", () => {
      onAction();
      dismiss();
    });
  }

  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(dismiss, duration);
}
