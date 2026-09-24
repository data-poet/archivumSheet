// Kind (character vs. ally draft) is set once when an entry is created — see
// characterSelector.js's "add-ally" action — and never toggled in place afterwards. This
// module only keeps the topbar's persistent visual cue in sync with whichever entry is active.

import { t } from "../localization/pt-BR/index.js";
import { getActiveKind } from "../store/characters.js";
import { ENTRY_KINDS } from "../shared/constants.js";
import { findAllyOnlyContent } from "../store/allyOnlyContent.js";
import { showToast } from "../store/persistence.js";

const BODY_CLASS = "is-ally-draft";

export function renderEntryKind() {
  document.body.classList.toggle(
    BODY_CLASS,
    getActiveKind() === ENTRY_KINDS.ALLY,
  );
}

export function warnAllyOnlyContent() {
  const offenders = findAllyOnlyContent();
  if (offenders.length === 0) return false;

  showToast(
    `${t("characters.allyOnlyWarning")} ${offenders.map((o) => o.label).join(", ")}`,
    "error",
    { duration: 8000 },
  );
  return true;
}
