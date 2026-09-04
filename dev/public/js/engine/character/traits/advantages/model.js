import { state } from "../../../../state.js";
import { fetchAdvantages } from "../../../../api.js";
import { renderAdvantages } from "../render.js";
import { snapshotAll, restoreAll } from "../../../../shared/openState.js";
import { triggerAutoRun } from "../../../../compute/autorun.js";
import { t } from "../../../../localization/pt-BR/index.js";
import { offerUndo } from "../../../../components/undo.js";
import { RACIAL_TRAIT_TYPE } from "../../../../shared/constants.js";

const data = state.data;
const selected = state.selected;

// Race-innate grants only; excluded from filters below but data.advantages keeps every row so renderTraits.js can still display them.
const RACIAL_TYPE = RACIAL_TRAIT_TYPE;

// Re-renders only the advantages list, avoiding a full renderLists() sweep — mirrors shield's _renderShieldLists.
function _renderAdvantagesList() {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderAdvantages(selected, data);
    restoreAll(snapshots);
  });
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadAdvantages() {
  data.advantages = await fetchAdvantages();

  const types = [
    ...new Set(
      data.advantages
        .filter((a) => a.advantage_type !== RACIAL_TYPE)
        .map((a) => a.advantage_type),
    ),
  ].sort();
  const typeEl = document.getElementById("advTypeSelect");
  typeEl.innerHTML = `<option value="">${t("traits.typeFilter")}</option>`;
  types.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeEl.appendChild(opt);
  });

  populateAdvSelect("");
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function populateAdvSelect(type) {
  const sel = document.getElementById("advSelect");
  const filtered = (
    type
      ? data.advantages.filter((a) => a.advantage_type === type)
      : data.advantages
  ).filter((a) => a.advantage_type !== RACIAL_TYPE);

  sel.innerHTML = "";
  filtered.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.advantage_id;
    opt.textContent = a.advantage_box_name;
    sel.appendChild(opt);
  });
}

export function filterAdvByType() {
  const type = document.getElementById("advTypeSelect").value;
  populateAdvSelect(type);
}

// ─── Add / Remove ─────────────────────────────────────────────────────────────

export function addAdv() {
  const sel = document.getElementById("advSelect");
  const opt = sel.selectedOptions[0];
  if (!opt) return;

  selected.advantages[opt.value] = true;

  _renderAdvantagesList();
  triggerAutoRun();
}

export function removeAdv(id) {
  const before = structuredClone(selected.advantages);
  delete selected.advantages[id];
  _renderAdvantagesList();
  triggerAutoRun();

  offerUndo(() => {
    selected.advantages = before;
    _renderAdvantagesList();
    triggerAutoRun();
  });
}
