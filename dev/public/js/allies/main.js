import { initTheme } from "../components/theme.js";
import { initPageSelector } from "../components/pageSelector.js";
import { LABELS } from "../localization/pt-BR/index.js";
import { mountResumePanel } from "../components/resume/skeleton.js";
import { renderResume, RESUME_MODES } from "../components/resume/index.js";
import { initAllyRosterSelector, updateRosterButton, renderPopover as renderRosterPopover } from "../components/allyRosterSelector.js";
import { initAllyAddForm } from "../components/allyAddForm.js";
import { setEditTarget } from "../shared/editTarget.js";
import { createAllyEditTarget } from "./allyEditTarget.js";
import { toEnginePayload } from "../shared/enginePayload.js";
import { buildSheet, fetchAmmo, fetchSpells } from "../api.js";
import { listAllies, isRepoAlly } from "./catalog.js";
import {
  getActiveCharacterDisplay,
  getRoster,
  getActiveAllyInstanceId,
  setActiveAllyInstanceId,
  resolveAlly,
} from "../store/allies.js";
import { applyOverlay } from "./overlay.js";

function _hydrateShell() {
  const L = LABELS.allies;
  document.title = `${LABELS.app.title} — ${L.pageTitle}`;

  const display = getActiveCharacterDisplay();
  const label = document.getElementById("active-character-label");
  if (label) {
    label.textContent = display.name
      ? `${L.activeCharacterLabel} ${display.name}`
      : "";
  }
}

function _showEmpty(show) {
  const empty = document.getElementById("allies-empty");
  const host = document.getElementById("resume-panel-host");
  if (empty) {
    empty.hidden = !show;
    empty.textContent = show ? LABELS.allies.emptyHint : "";
  }
  if (host) host.hidden = show;
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

export async function bootstrapAllies() {
  _hydrateShell();
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

  await _rebuildAndRenderActive(catalogData);

  initTheme();
  initPageSelector();
}

document.addEventListener("DOMContentLoaded", bootstrapAllies);
