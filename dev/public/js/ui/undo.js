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
import { t } from "../localization/pt-BR.js";

const UNDO_DURATION_MS = 5000;

/**
 * @param {Function} restoreFn - called if the user taps "Desfazer"
 */
export function offerUndo(restoreFn) {
  showToast(t("common.removed"), "info", {
    actionLabel: t("common.undo"),
    duration: UNDO_DURATION_MS,
    onAction: restoreFn,
  });
}
