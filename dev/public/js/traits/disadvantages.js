import { state } from "../state.js";
import { fetchDisadvantages } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { t } from "../localization/pt-BR.js";
import { offerUndo } from "../ui/undo.js";

const data = state.data;
const selected = state.selected;

// Traits of this type only ever exist as race-innate grants (added by the
// engine when a race is selected) and must never be manually browsable or
// addable by the player. This does not affect data.disadvantages itself,
// which must keep every row so renderTraits.js can still display innate
// entries.
const RACIAL_TYPE = "Racial";

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadDisadvantages() {
  data.disadvantages = await fetchDisadvantages();

  // Populate type filter with sorted unique types, excluding race-only traits
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

  // Populate name select with all entries initially
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

  renderLists(selected, data);
  triggerAutoRun();
}

export function removeDis(id) {
  const before = structuredClone(selected.disadvantages);
  delete selected.disadvantages[id];
  renderLists(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.disadvantages = before;
    renderLists(selected, data);
    triggerAutoRun();
  });
}
