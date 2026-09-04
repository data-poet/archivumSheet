// Themed replacement for window.confirm() so the dialog respects dark theme.
import { t } from "../localization/pt-BR/index.js";

export function showConfirm({
  message,
  title = "",
  confirmLabel = t("dialog.confirm"),
  cancelLabel = t("dialog.cancel"),
  danger = false,
} = {}) {
  return new Promise((resolve) => {
    document.getElementById("_archivum-dialog")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "_archivum-dialog";
    overlay.className = "dialog-overlay";

    overlay.innerHTML = `
      <div class="dialog-card" role="alertdialog" aria-modal="true" ${title ? 'aria-labelledby="_archivum-dialog-title"' : ""}>
        ${title ? `<h3 id="_archivum-dialog-title" class="dialog-title">${title}</h3>` : ""}
        <p class="dialog-message">${message}</p>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn-cancel">${cancelLabel}</button>
          <button type="button" class="dialog-btn ${danger ? "dialog-btn-danger" : "dialog-btn-confirm"}">${confirmLabel}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cancelBtn = overlay.querySelector(".dialog-btn-cancel");
    const confirmBtn = overlay.querySelector(
      ".dialog-btn-danger, .dialog-btn-confirm",
    );

    const close = (result) => {
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      resolve(result);
    };

    const onKeydown = (e) => {
      if (e.key === "Escape") close(false);
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
    cancelBtn.addEventListener("click", () => close(false));
    confirmBtn.addEventListener("click", () => close(true));
    document.addEventListener("keydown", onKeydown);

    requestAnimationFrame(() => overlay.classList.add("is-visible"));
    confirmBtn.focus();
  });
}
