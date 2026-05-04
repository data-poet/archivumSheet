import { state } from "./state.js";

import {
  renderLists,
  updateInventoryUI,
  updateActualValues,
  renderOutput,
  renderSecondaryAttributes,
  renderDamage,
} from "./ui.js";

import {
  fetchAdvantages,
  fetchDisadvantages,
  fetchSkills,
  fetchSpells,
  buildSheet,
} from "./api.js";

// ===== ALIASES =====
const data = state.data;
const selected = state.selected;
const ui = state.ui;

// ===== AUTO RUN =====
function triggerAutoRun() {
  updateActualValues();

  clearTimeout(ui.debounceTimer);
  ui.debounceTimer = setTimeout(() => {
    runEngine();
  }, 300);
}

// ===== PRIMARY ATTRIBUTES =====
function getPrimaryAttributes() {
  return {
    ST: {
      base_value: Number(document.getElementById("ST_base").value),
      modifier: Number(document.getElementById("ST_mod").value),
    },
    DX: {
      base_value: Number(document.getElementById("DX_base").value),
      modifier: Number(document.getElementById("DX_mod").value),
    },
    IQ: {
      base_value: Number(document.getElementById("IQ_base").value),
      modifier: Number(document.getElementById("IQ_mod").value),
    },
    HT: {
      base_value: Number(document.getElementById("HT_base").value),
      modifier: Number(document.getElementById("HT_mod").value),
    },
  };
}

// ===== AUTO-RUN SETUP =====
function setupAutoRun() {
  [
    "ST_base",
    "ST_mod",
    "DX_base",
    "DX_mod",
    "IQ_base",
    "IQ_mod",
    "HT_base",
    "HT_mod",
    "weight",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("input", triggerAutoRun);
  });
}

// ===== ADVANTAGES =====
async function loadAdvantages() {
  data.advantages = await fetchAdvantages();

  const sel = document.getElementById("advSelect");
  sel.innerHTML = "";

  data.advantages.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a.advantage_id;
    opt.textContent = `${a.advantage_box_name} (${a.advantage_cost})`;
    sel.appendChild(opt);
  });
}

function addAdv() {
  const sel = document.getElementById("advSelect");
  const opt = sel.selectedOptions[0];
  if (!opt) return;

  selected.advantages[opt.value] = true;

  renderLists(selected);
  triggerAutoRun();
}

function removeAdv(id) {
  delete selected.advantages[id];
  renderLists(selected);
  triggerAutoRun();
}

// ===== DISADVANTAGES =====
async function loadDisadvantages() {
  data.disadvantages = await fetchDisadvantages();

  const sel = document.getElementById("disSelect");
  sel.innerHTML = "";

  data.disadvantages.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.disadvantage_id;
    opt.textContent = `${d.disadvantage_box_name} (${d.disadvantage_cost})`;
    sel.appendChild(opt);
  });
}

function addDis() {
  const sel = document.getElementById("disSelect");
  const opt = sel.selectedOptions[0];
  if (!opt) return;

  selected.disadvantages[opt.value] = true;

  renderLists(selected);
  triggerAutoRun();
}

function removeDis(id) {
  delete selected.disadvantages[id];
  renderLists(selected);
  triggerAutoRun();
}

// ===== SKILLS =====
async function loadSkills() {
  data.skills = await fetchSkills();

  const sel = document.getElementById("skillSelect");
  sel.innerHTML = "";

  data.skills.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.skill_id;
    opt.textContent = `${s.skill_name} (${s.skill_difficulty})`;
    sel.appendChild(opt);
  });
}

function addSkill() {
  const sel = document.getElementById("skillSelect");
  const id = sel.value;
  if (!id) return;

  if (!selected.skills[id]) {
    selected.skills[id] = {
      base: 10,
      modifier: 0,
    };
  }

  renderLists(selected);
  triggerAutoRun();
}

function removeSkill(id) {
  delete selected.skills[id];
  renderLists(selected);
  triggerAutoRun();
}

// ===== SPELLS =====
async function loadSpells() {
  data.spells = await fetchSpells();

  const sel = document.getElementById("spellSelect");
  sel.innerHTML = "";

  const unique = [
    ...new Map(data.spells.map((s) => [s.spell_name, s])).values(),
  ];

  unique.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.spell_name;
    opt.textContent = `${s.spell_name} (${s.spell_school})`;
    sel.appendChild(opt);
  });
}

function addSpell() {
  const sel = document.getElementById("spellSelect");
  const name = sel.value;
  if (!name) return;

  if (!selected.spells[name]) {
    selected.spells[name] = {
      base_value: 10,
      modifier: 0,
    };
  }

  renderLists(selected);
  triggerAutoRun();
}

function removeSpell(name) {
  delete selected.spells[name];
  renderLists(selected);
  triggerAutoRun();
}

// ===== ENGINE =====
async function runEngine() {
  try {
    const json = await buildSheet({
      character: {
        advantages: Object.keys(selected.advantages),
        disadvantages: Object.keys(selected.disadvantages),
        primaryAttributes: getPrimaryAttributes(),

        secondaryAttributes: {
          ...selected.secondary,
          damage: Object.fromEntries(
            Object.entries(selected.damage).map(([type, data]) => [
              type,
              { modifier: Number(data.modifier) || 0 },
            ]),
          ),
        },

        skills: Object.entries(selected.skills).map(([skill_id, data]) => ({
          skill_id,
          base: Number(data.base) || 0,
          modifier: Number(data.modifier) || 0,
        })),

        spells: selected.spells,
      },

      inventory: {
        weight: Number(document.getElementById("weight").value) || 0,
      },
    });

    // ===== SYNC SECONDARY =====
    const sec = json.character?.secondary_attributes || {};

    Object.entries(sec).forEach(([name, data]) => {
      if (!selected.secondary[name]) {
        selected.secondary[name] = {
          bought: data.bought || 0,
          modifier: data.modifier || 0,
        };
      }
    });

    // ===== SYNC DAMAGE =====
    const dmg = json.character?.base_damage || {};

    Object.entries(dmg).forEach(([type, data]) => {
      if (!selected.damage[type]) {
        selected.damage[type] = {
          modifier: data.modifier || 0,
        };
      }
    });

    renderOutput(json);
    updateInventoryUI(json);
    renderSecondaryAttributes(json);
    renderDamage(json);
  } catch (err) {
    renderOutput({ error: err.message });
  }
}

// ===== UPDATE HELPERS =====
function updateSkill(id, field, value) {
  if (!selected.skills[id]) return;

  selected.skills[id][field] = Number(value);
  triggerAutoRun();
}

function updateSpell(name, field, value) {
  if (!selected.spells[name]) return;

  selected.spells[name][field] = Number(value);
  triggerAutoRun();
}

// ===== UI BINDING =====
function bindUI() {
  document
    .getElementById("loadAdvantagesBtn")
    .addEventListener("click", loadAdvantages);
  document.getElementById("addAdvBtn").addEventListener("click", addAdv);

  document
    .getElementById("loadDisadvantagesBtn")
    .addEventListener("click", loadDisadvantages);
  document.getElementById("addDisBtn").addEventListener("click", addDis);

  document
    .getElementById("loadSkillsBtn")
    .addEventListener("click", loadSkills);
  document.getElementById("addSkillBtn").addEventListener("click", addSkill);

  document
    .getElementById("loadSpellsBtn")
    .addEventListener("click", loadSpells);
  document.getElementById("addSpellBtn").addEventListener("click", addSpell);

  document.getElementById("runEngineBtn").addEventListener("click", runEngine);

  // CLICK EVENTS
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-adv")) {
      removeAdv(e.target.dataset.id);
    }
    if (e.target.classList.contains("remove-dis")) {
      removeDis(e.target.dataset.id);
    }
    if (e.target.classList.contains("remove-skill")) {
      removeSkill(e.target.dataset.id);
    }
    if (e.target.classList.contains("remove-spell")) {
      removeSpell(e.target.dataset.name);
    }
  });

  // INPUT EVENTS
  document.addEventListener("input", (e) => {
    // SKILLS
    if (e.target.classList.contains("skill-input")) {
      updateSkill(e.target.dataset.id, e.target.dataset.field, e.target.value);
    }

    // SPELLS
    if (e.target.classList.contains("spell-input")) {
      updateSpell(
        e.target.dataset.name,
        e.target.dataset.field,
        e.target.value,
      );
    }

    // SECONDARY
    if (e.target.classList.contains("secondary-input")) {
      const name = e.target.dataset.name;
      const field = e.target.dataset.field;
      const value = Number(e.target.value) || 0;

      if (!selected.secondary[name]) {
        selected.secondary[name] = { bought: 0, modifier: 0 };
      }

      if (field === "bought") {
        const max = name === "BasicSpeed" ? 6 : 5;
        selected.secondary[name].bought = Math.max(0, Math.min(max, value));
      }

      if (field === "modifier") {
        if (name === "BasicSpeed") {
          selected.secondary[name].modifier = Math.round(value * 2) / 2;
        } else {
          selected.secondary[name].modifier = value;
        }
      }

      triggerAutoRun();
    }

    // DAMAGE
    if (e.target.classList.contains("damage-input")) {
      const type = e.target.dataset.type;
      const value = Number(e.target.value) || 0;

      if (!selected.damage[type]) {
        selected.damage[type] = { modifier: 0 };
      }

      selected.damage[type].modifier = value;

      triggerAutoRun();
    }
  });
}

// ===== INIT =====
window.onload = () => {
  bindUI();
  setupAutoRun();
  updateActualValues();
  runEngine();
};
