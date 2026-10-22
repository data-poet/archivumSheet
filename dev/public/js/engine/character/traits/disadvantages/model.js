import { state } from "../../../../state.js";
import { fetchDisadvantages } from "../../../../api.js";
import { renderDisadvantages } from "../render.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../../compute/autorun.js";
import { t } from "../../../../localization/pt-BR/index.js";
import { offerUndo } from "../../../../components/undo.js";
import { RACIAL_TRAIT_TYPE } from "../../../../shared/constants.js";
import { attachReorderableOnce } from "../../../../shared/sortable.js";
import { onInventoryRendered } from "../../../../shared/renderSignal.js";
import { reorderTrait } from "../../../../shared/traitOrder.js";
import { el } from "../../../../shared/dom.js";

const data = state.data;
const selected = state.selected;

// Race-innate grants only; excluded from filters below but data.disadvantages keeps every row so render.js can still display them.
const RACIAL_TYPE = RACIAL_TRAIT_TYPE;

// Re-renders only the disadvantages list, avoiding a full renderLists() sweep — mirrors shield's
// _renderShieldLists. Passes state.sheet so innate/meta-race/enchantment rows don't vanish until
// the next full engine run.
function _renderDisadvantagesList() {
  requestAnimationFrame(() => {
    renderDisadvantages(selected, data, state.sheet);
  });
}

onInventoryRendered(() => {
  attachReorderableOnce(el("dis-tbody"), {
    onReorder(tr) {
      const id = tr.dataset.id;
      if (!id) return;
      const ids = [...tr.parentElement.querySelectorAll("tr[data-id]")].map(
        (el) => el.dataset.id,
      );
      reorderTrait("disadvantages", id, ids.indexOf(id));
      _renderDisadvantagesList();
    },
  });
});

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

export function addDis() {
  const sel = document.getElementById("disSelect");
  const opt = sel.selectedOptions[0];
  if (!opt) return;

  selected.disadvantages[opt.value] = true;

  _renderDisadvantagesList();
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export function removeDis(id) {
  const before = structuredClone(selected.disadvantages);
  delete selected.disadvantages[id];
  _renderDisadvantagesList();
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

  offerUndo(() => {
    selected.disadvantages = before;
    _renderDisadvantagesList();
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
  });
}
