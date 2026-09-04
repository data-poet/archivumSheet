import { state } from "../../../../state.js";
import { fetchDisadvantages } from "../../../../api.js";
import { renderDisadvantages } from "../render.js";
import { snapshotAll, restoreAll } from "../../../../shared/openState.js";
import { triggerAutoRun } from "../../../../compute/autorun.js";
import { t } from "../../../../localization/pt-BR/index.js";
import { offerUndo } from "../../../../components/undo.js";
import { RACIAL_TRAIT_TYPE } from "../../../../shared/constants.js";

const data = state.data;
const selected = state.selected;

// Race-innate grants only; excluded from filters below but data.disadvantages keeps every row so renderTraits.js can still display them.
const RACIAL_TYPE = RACIAL_TRAIT_TYPE;

// Re-renders only the disadvantages list, avoiding a full renderLists() sweep — mirrors shield's _renderShieldLists.
function _renderDisadvantagesList() {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderDisadvantages(selected, data);
    restoreAll(snapshots);
  });
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadDisadvantages() {
  data.disadvantages = await fetchDisadvantages();

  const types = [
    ...new Set(
      data.disadvantages
        .filter((d) => d.disadvantage_type !== RACIAL_TYPE)
        .map((d) => d.disadvantage_type),
    ),
  ].sort();
  const typeEl = document.getElementById("disTypeSelect");
  typeEl.innerHTML = `<option value="">${t("traits.typeFilter")}</option>`;
  types.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeEl.appendChild(opt);
  });

  populateDisSelect("");
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function populateDisSelect(type) {
  const sel = document.getElementById("disSelect");
  const filtered = (
    type
      ? data.disadvantages.filter((d) => d.disadvantage_type === type)
      : data.disadvantages
  ).filter((d) => d.disadvantage_type !== RACIAL_TYPE);

  sel.innerHTML = "";
  filtered.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.disadvantage_id;
    opt.textContent = d.disadvantage_box_name;
    sel.appendChild(opt);
  });
}

export function filterDisByType() {
  const type = document.getElementById("disTypeSelect").value;
  populateDisSelect(type);
}

// ─── Add / Remove ─────────────────────────────────────────────────────────────

export function addDis() {
  const sel = document.getElementById("disSelect");
  const opt = sel.selectedOptions[0];
  if (!opt) return;

  selected.disadvantages[opt.value] = true;

  _renderDisadvantagesList();
  triggerAutoRun();
}

export function removeDis(id) {
  const before = structuredClone(selected.disadvantages);
  delete selected.disadvantages[id];
  _renderDisadvantagesList();
  triggerAutoRun();

  offerUndo(() => {
    selected.disadvantages = before;
    _renderDisadvantagesList();
    triggerAutoRun();
  });
}
