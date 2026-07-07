import { state } from "../state.js";
import { fetchSpells } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { t } from "../localization/pt-BR.js";
import { getSpellAttributeBase } from "../shared/attributeUtils.js";

const data = state.data;
const selected = state.selected;

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadSpells() {
  data.spells = await fetchSpells();

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

// ─── Filter helpers ───────────────────────────────────────────────────────────

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

// ─── Add / Remove / Update ────────────────────────────────────────────────────

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

  renderLists(selected, data);
  triggerAutoRun();
}

export function removeSpell(name) {
  delete selected.spells[name];
  renderLists(selected, data);
  triggerAutoRun();
}

export function updateSpell(name, field, value) {
  if (!selected.spells[name]) return;
  selected.spells[name][field] = Number(value);
  triggerAutoRun();
}
