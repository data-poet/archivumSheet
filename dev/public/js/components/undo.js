// ui/undo.js
// ─────────────────────────────────────────────────────────────────────────────
// Offers a brief "Undo" action after a destructive removal, via the toast
// component. Callers are responsible for snapshotting the affected state
// before mutating it, and for restoring it (+ re-rendering) in restoreFn.
//
// Usage (inside a removeX() function, after the removal + re-render):
//   const before = structuredClone(selected.advantages);
//   delete selected.advantages[id];
//   renderLists(selected, data);
//   triggerAutoRun();
//   offerUndo(() => {
//     selected.advantages = before;
//     renderLists(selected, data);
//     triggerAutoRun();
//   });
// ─────────────────────────────────────────────────────────────────────────────

import { showToast } from "../store/persistence.js";
import { t } from "../localization/pt-BR/index.js";

const UNDO_DURATION_MS = 5000;

/**
 * @param {Function} restoreFn - called if the user taps "Desfazer"
 * @param {string} [message] - toast text; defaults to "Removido" since most
 *   callers are removals. Pass e.g. t("common.added") for non-removal
 *   mutations (like an add the user might want to walk back) so the toast
 *   doesn't misleadingly say something was removed.
 */
export function offerUndo(restoreFn, message = t("undo.removedMessage")) {
  showToast(message, "info", {
    actionLabel: t("undo.actionLabel"),
    duration: UNDO_DURATION_MS,
    onAction: restoreFn,
  });
}
