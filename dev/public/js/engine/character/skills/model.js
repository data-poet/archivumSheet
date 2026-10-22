import { state } from "../../../state.js";
import { fetchSkills, fetchMasterEligibleCategories } from "../../../api.js";
import { renderSkills } from "./render.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { t } from "../../../localization/pt-BR/index.js";
import { getSkillAttributeBase } from "../../../shared/attributeUtils.js";
import { offerUndo } from "../../../components/undo.js";
import { attachReorderableOnce } from "../../../shared/sortable.js";
import { onInventoryRendered } from "../../../shared/renderSignal.js";
import { reorderTrait } from "../../../shared/traitOrder.js";
import { el } from "../../../shared/dom.js";

const data = state.data;
const selected = state.selected;

// Re-renders only the skill list, avoiding a full renderLists() sweep — mirrors shield's
// _renderShieldLists. Passes state.sheet so enchantment-granted rows don't vanish until the
// next full engine run.
function _renderSkillList() {
  requestAnimationFrame(() => {
    renderSkills(selected, data, state.sheet);
  });
}

onInventoryRendered(() => {
  attachReorderableOnce(el("skill-tbody"), {
    onReorder(tr) {
      const id = tr.dataset.id;
      if (!id) return;
      const ids = [...tr.parentElement.querySelectorAll("tr[data-id]")].map(
        (row) => row.dataset.id,
      );
      reorderTrait("skills", id, ids.indexOf(id));
      _renderSkillList();
    },
  });
});

export async function loadSkills() {
  const [skills, masterEligibleCategories] = await Promise.all([
    fetchSkills(),
    fetchMasterEligibleCategories(),
  ]);
  data.skills = skills;
  data.masterEligibleCategories = masterEligibleCategories;

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

  _renderSkillList();
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export function removeSkill(id) {
  const before = structuredClone(selected.skills);
  delete selected.skills[id];
  _renderSkillList();
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

  offerUndo(() => {
    selected.skills = before;
    _renderSkillList();
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
  });
}

export function updateSkill(id, field, value) {
  if (!selected.skills[id]) return;
  selected.skills[id][field] = Number(value);
  triggerAutoRun();
}
