import { state } from "../state.js";
import { fetchSkills } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { t } from "../localization/pt-BR.js";
import { getSkillAttributeBase } from "../shared/attributeUtils.js";
import { offerUndo } from "../ui/undo.js";

const data = state.data;
const selected = state.selected;

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadSkills() {
  data.skills = await fetchSkills();

  const types = [...new Set(data.skills.map((s) => s.skill_category))].sort();
  const typeEl = document.getElementById("skillCategorySelect");
  typeEl.innerHTML = `<option value="">${t("traits.categoryFilter")}</option>`;
  types.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeEl.appendChild(opt);
  });

  populateSkillSelect("");
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function populateSkillSelect(category) {
  const sel = document.getElementById("skillSelect");
  const filtered = category
    ? data.skills.filter((s) => s.skill_category === category)
    : data.skills;

  sel.innerHTML = "";
  filtered.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.skill_id;
    opt.textContent = `${s.skill_box_name}`;
    sel.appendChild(opt);
  });
}

export function filterSkillsByCategory() {
  const category = document.getElementById("skillCategorySelect").value;
  populateSkillSelect(category);
}

// ─── Add / Remove / Update ────────────────────────────────────────────────────

export function addSkill() {
  const sel = document.getElementById("skillSelect");
  const id = sel.value;
  if (!id) return;

  if (!selected.skills[id]) {
    const skillRow = data.skills.find((s) => s.skill_id === id);
    const attribute = skillRow?.skill_base_attribute || "DX";

    selected.skills[id] = {
      base_value: getSkillAttributeBase(state, attribute),
      modifier: 0,
      isTrainedWithMaster: false,
    };
  }

  renderLists(selected, data);
  triggerAutoRun();
}

export function removeSkill(id) {
  const before = structuredClone(selected.skills);
  delete selected.skills[id];
  renderLists(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.skills = before;
    renderLists(selected, data);
    triggerAutoRun();
  });
}

export function updateSkill(id, field, value) {
  if (!selected.skills[id]) return;
  selected.skills[id][field] = Number(value);
  triggerAutoRun();
}
