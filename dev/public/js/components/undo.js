// Caller must snapshot state before mutating and restore it (+ re-render) in restoreFn.
import { showToast } from "../store/persistence.js";
import { t } from "../localization/pt-BR/index.js";

const UNDO_DURATION_MS = 5000;

// message defaults to "Removido"; pass an explicit one for non-removal mutations
// (e.g. an add the user might walk back) so the toast doesn't misreport what happened.
export function offerUndo(restoreFn, message = t("undo.removedMessage")) {
  showToast(message, "info", {
    actionLabel: t("undo.actionLabel"),
    duration: UNDO_DURATION_MS,
    onAction: restoreFn,
  });
}
