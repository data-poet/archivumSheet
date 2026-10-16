import { state } from "../../../state.js";
import { fetchMetaRaces } from "../../../api.js";
import { renderMetaRaces } from "./render.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { t } from "../../../localization/pt-BR/index.js";
import { escapeHtml } from "../../../shared/renderUtils.js";
import { offerUndo } from "../../../components/undo.js";

const data = state.data;
const selected = state.selected;

// meta_race_ids is a list so meta-races can stack. The name and sub-name selects only pick; "Adicionar" pushes the
// id, and the table below is the source of truth for what is applied.

// Re-renders only the meta-race list, avoiding a full renderLists() sweep — mirrors advantages'
// own _renderAdvantagesList.
function _renderMetaRacesList() {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderMetaRaces(selected, data);
    restoreAll(snapshots);
  });
}

export async function loadMetaRaces() {
  if (data.metaRaces.length) {
    _showMetaRaceSelects();
    return;
  }

  data.metaRaces = await fetchMetaRaces();

  _populateMetaRaceNameSelect();
  _showMetaRaceSelects();
}

function _populateMetaRaceNameSelect() {
  const nameSelect = document.getElementById("metaRaceNameSelect");
  if (!nameSelect) return;

  const names = [
    ...new Set(data.metaRaces.map((r) => r.meta_race_name)),
  ].sort();

  nameSelect.innerHTML = `<option value="">${t("character.selectMetaRace")}</option>`;
  names.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    nameSelect.appendChild(opt);
  });
}

export function filterSubMetaRacesByName() {
  const name = document.getElementById("metaRaceNameSelect").value;
  const subSelect = document.getElementById("metaRaceSubSelect");

  if (!name) {
    subSelect.style.display = "none";
    subSelect.innerHTML = `<option value="">${t("character.selectSubMetaRace")}</option>`;
    return;
  }

  const subRows = data.metaRaces.filter((r) => r.meta_race_name === name);

  subSelect.innerHTML =
    `<option value="">${t("character.selectSubMetaRace")}</option>` +
    subRows
      .map(
        (r) =>
          `<option value="${r.meta_race_id}">${escapeHtml(r.meta_race_sub_name || r.meta_race_name)}</option>`,
      )
      .join("");

  subSelect.style.display = "";

  if (subRows.length === 1) {
    subSelect.value = subRows[0].meta_race_id;
  }
}

export function addMetaRace() {
  const subSelect = document.getElementById("metaRaceSubSelect");
  const metaRaceId = subSelect?.value;
  if (!metaRaceId) return;

  if (!selected.meta_race_ids.includes(metaRaceId)) {
    selected.meta_race_ids = [...selected.meta_race_ids, metaRaceId];
  }

  _resetMetaRacePicker();
  _renderMetaRacesList();
  triggerAutoRun();
}

export function removeMetaRace(id) {
  const before = [...selected.meta_race_ids];
  selected.meta_race_ids = selected.meta_race_ids.filter(
    (metaRaceId) => metaRaceId !== id,
  );

  _renderMetaRacesList();
  triggerAutoRun();

  offerUndo(() => {
    selected.meta_race_ids = before;
    _renderMetaRacesList();
    triggerAutoRun();
  });
}

function _showMetaRaceSelects() {
  const nameSelect = document.getElementById("metaRaceNameSelect");
  if (nameSelect) nameSelect.style.display = "";
}

// Clears the picker back to its placeholder state after a successful add, ready for the next pick.
function _resetMetaRacePicker() {
  const nameSelect = document.getElementById("metaRaceNameSelect");
  const subSelect = document.getElementById("metaRaceSubSelect");
  if (nameSelect) nameSelect.value = "";
  if (subSelect) {
    subSelect.innerHTML = `<option value="">${t("character.selectSubMetaRace")}</option>`;
    subSelect.style.display = "none";
  }
}
