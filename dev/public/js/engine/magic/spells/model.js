import { state } from "../../../state.js";
import { fetchSpells, fetchMagicAptitudeAdvantageIds } from "../../../api.js";
import { renderSpells } from "./render.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { t } from "../../../localization/pt-BR/index.js";
import { getSpellAttributeBase } from "../../../shared/attributeUtils.js";
import { offerUndo } from "../../../components/undo.js";

const data = state.data;
const selected = state.selected;

// Re-renders only the spell list, not a full renderLists() sweep of all 21 sections.
function _renderSpellList() {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderSpells(selected, data);
    restoreAll(snapshots);
  });
}

export async function loadSpells() {
  const [spells, magicAptitudeAdvantageIds] = await Promise.all([
    fetchSpells(),
    fetchMagicAptitudeAdvantageIds(),
  ]);
  data.spells = spells;
  data.magicAptitudeAdvantageIds = magicAptitudeAdvantageIds;

  const schools = [...new Set(data.spells.map((s) => s.spell_school))].sort();
  const schoolEl = document.getElementById("spellSchoolSelect");
  schoolEl.innerHTML = `<option value="">${t("magic.schoolFilter")}</option>`;
  schools.forEach((sc) => {
    const opt = document.createElement("option");
    opt.value = sc;
    opt.textContent = sc;
    schoolEl.appendChild(opt);
  });

  populateSpellSelect("");
}

function populateSpellSelect(school) {
  const sel = document.getElementById("spellSelect");

  // Deduplicate by spell_name within the filtered set
  const filtered = school
    ? data.spells.filter((s) => s.spell_school === school)
    : data.spells;

  const unique = [...new Map(filtered.map((s) => [s.spell_name, s])).values()];

  sel.innerHTML = "";
  unique.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.spell_name;
    opt.textContent = s.spell_box_name;
    sel.appendChild(opt);
  });
}

export function filterSpellsBySchool() {
  const school = document.getElementById("spellSchoolSelect").value;
  populateSpellSelect(school);
}

export function addSpell() {
  const sel = document.getElementById("spellSelect");
  const name = sel.value;
  if (!name) return;

  if (!selected.spells[name]) {
    selected.spells[name] = {
      base_value: getSpellAttributeBase(state),
      modifier: 0,
    };
  }

  _renderSpellList();
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export function removeSpell(name) {
  const before = structuredClone(selected.spells);
  delete selected.spells[name];
  _renderSpellList();
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

  offerUndo(() => {
    selected.spells = before;
    _renderSpellList();
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
  });
}

export function updateSpell(name, field, value) {
  if (!selected.spells[name]) return;
  selected.spells[name][field] = Number(value);
  triggerAutoRun();
}
