import { state } from "../state.js";
import { fetchAdvantages } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { t } from "../localization/pt-BR.js";

const data = state.data;
const selected = state.selected;

// Traits of this type only ever exist as race-innate grants (added by the
// engine when a race is selected) and must never be manually browsable or
// addable by the player. This does not affect data.advantages itself, which
// must keep every row so renderTraits.js can still display innate entries.
const RACIAL_TYPE = "Racial";

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadAdvantages() {
  data.advantages = await fetchAdvantages();

  // Populate type filter with sorted unique types, excluding race-only traits
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

  // Populate name select with all entries initially
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

  renderLists(selected, data);
  triggerAutoRun();
}

export function removeAdv(id) {
  delete selected.advantages[id];
  renderLists(selected, data);
  triggerAutoRun();
}
