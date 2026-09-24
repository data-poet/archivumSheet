import { initTheme } from "../components/theme.js";
import { initPageSelector } from "../components/pageSelector.js";
import { LABELS } from "../localization/pt-BR/index.js";
import { mountResumePanel } from "../components/resume/skeleton.js";
import { renderResume, RESUME_MODES } from "../components/resume/index.js";
import { initAllyRosterSelector, updateRosterButton, renderPopover as renderRosterPopover } from "../components/allyRosterSelector.js";
import { initAllyAddForm } from "../components/allyAddForm.js";
import { setEditTarget, getEditTarget } from "../shared/editTarget.js";
import { createAllyEditTarget } from "./allyEditTarget.js";
import { handleResumeAttributeInput } from "../engine/character/traits/resumeAttributeInput.js";
import { bindStepperButtons } from "../shared/stepper.js";
import { toEnginePayload } from "../shared/enginePayload.js";
import { buildSheet, fetchAmmo, fetchSpells } from "../api.js";
import { listAllies, isRepoAlly } from "./catalog.js";
import {
  getActiveCharacterDisplay,
  getRoster,
  getActiveAllyInstanceId,
  setActiveAllyInstanceId,
  resolveAlly,
  pruneOrphanedAllies,
} from "../store/allies.js";
import { applyOverlay } from "./overlay.js";
import { initPcSwitcher } from "../components/pcSwitcher.js";
import { ENTRY_KINDS } from "../shared/constants.js";

function _hydrateShell() {
  const L = LABELS.allies;
  document.title = `${LABELS.app.title} — ${L.pageTitle}`;
}

let _lastEmptyState = null;

function _showEmpty(show) {
  const empty = document.getElementById("allies-empty");
  const host = document.getElementById("resume-panel-host");
  if (empty) {
    empty.hidden = !show;
    empty.textContent = show ? LABELS.allies.emptyHint : "";
  }
  if (host) host.hidden = show;

  // Collapsed once a resume is showing, so the add form doesn't clutter it — but only on
  // an empty <-> active transition, so it doesn't fight a manual re-open mid-session.
  const addDetails = document.getElementById("ally-add-details");
  if (addDetails && _lastEmptyState !== show) addDetails.open = show;
  _lastEmptyState = show;
}

function _debounce(fn, ms) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

async function _rebuildAndRenderActive(catalogData) {
  const activeId = getActiveAllyInstanceId();
  const entry = getRoster().find((e) => e._instanceId === activeId);

  if (!entry) {
    _showEmpty(true);
    return;
  }

  const catalogAlly = await resolveAlly(entry.ally_id);
  if (!catalogAlly) {
    _showEmpty(true);
    return;
  }

  const ally = isRepoAlly(entry.ally_id)
    ? applyOverlay(catalogAlly, entry.overrides)
    : catalogAlly;

  const sheet = await buildSheet(toEnginePayload(ally));

  _showEmpty(false);
  renderResume(sheet, catalogData, {}, {
    mode: RESUME_MODES.ALLY,
    portraitSrc: ally.portrait ?? "",
  });
}

// An ally forked into the character editor has no roster of its own — pageSelector.js hides
// the nav link for this case, but this page is also reachable by direct URL, so it needs its
// own lock screen rather than trusting the nav to keep an ally out.
function _showNestedAllyLock() {
  const empty = document.getElementById("allies-empty");
  const addBox = document.getElementById("ally-add-box");
  const host = document.getElementById("resume-panel-host");
  const rosterBtn = document.getElementById("ally-selector-btn");

  if (empty) {
    empty.hidden = false;
    empty.textContent = LABELS.allies.noNestedAllies;
  }
  if (addBox) addBox.hidden = true;
  if (host) host.hidden = true;
  if (rosterBtn) rosterBtn.hidden = true;
}

export async function bootstrapAllies() {
  pruneOrphanedAllies();
  _hydrateShell();

  initTheme();
  initPageSelector();
  initPcSwitcher({
    onChange: () => {
      pruneOrphanedAllies();
      window.location.reload();
    },
  });

  if (getActiveCharacterDisplay().kind === ENTRY_KINDS.ALLY) {
    _showNestedAllyLock();
    return;
  }

  mountResumePanel();

  const [ammo, spells, index] = await Promise.all([
    fetchAmmo(),
    fetchSpells(),
    listAllies(),
  ]);
  const catalogData = { ammo, spells };

  const rebuild = _debounce(() => _rebuildAndRenderActive(catalogData), 150);

  initAllyRosterSelector({ index, onChange: rebuild });
  initAllyAddForm({
    index,
    onAdd: (instanceId) => {
      setActiveAllyInstanceId(instanceId);
      updateRosterButton();
      renderRosterPopover();
      rebuild();
    },
  });

  setEditTarget(createAllyEditTarget(rebuild));
  bindStepperButtons();
  document.addEventListener("input", (e) => {
    const target = getEditTarget();
    if (target) handleResumeAttributeInput(e, target);
  });

  await _rebuildAndRenderActive(catalogData);
}

document.addEventListener("DOMContentLoaded", bootstrapAllies);
