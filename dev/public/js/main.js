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
  fetchArmors,
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

  renderLists(selected, data);
  triggerAutoRun();
}

function removeAdv(id) {
  delete selected.advantages[id];
  renderLists(selected, data);
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

  renderLists(selected, data);
  triggerAutoRun();
}

function removeDis(id) {
  delete selected.disadvantages[id];
  renderLists(selected, data);
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

  renderLists(selected, data);
  triggerAutoRun();
}

function removeSkill(id) {
  delete selected.skills[id];
  renderLists(selected, data);
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

  renderLists(selected, data);
  triggerAutoRun();
}

function removeSpell(name) {
  delete selected.spells[name];
  renderLists(selected, data);
  triggerAutoRun();
}

// ===== ARMORS =====
async function loadArmors() {
  data.armors = await fetchArmors();

  loadArmorSelectors();

  renderLists(selected, data);

  triggerAutoRun();
}

/**
 * Initial slot selector.
 */
function loadArmorSelectors() {
  const slotSelect = document.getElementById("armorSlotSelect");

  slotSelect.innerHTML = "";

  const slots = [
    ...new Set(data.armors.map((armor) => armor.armor_piece_location)),
  ];

  slots.forEach((slot) => {
    const opt = document.createElement("option");

    opt.value = slot;

    opt.textContent = slot;

    slotSelect.appendChild(opt);
  });

  updateArmorNameOptions();
}

/**
 * Update armor names based on slot.
 */
function updateArmorNameOptions() {
  const slot = document.getElementById("armorSlotSelect").value;

  const nameSelect = document.getElementById("armorNameSelect");

  nameSelect.innerHTML = "";

  const names = [
    ...new Set(
      data.armors
        .filter((armor) => armor.armor_piece_location === slot)
        .map((armor) => armor.armor_name),
    ),
  ];

  names.forEach((name) => {
    const opt = document.createElement("option");

    opt.value = name;

    opt.textContent = name;

    nameSelect.appendChild(opt);
  });

  updateArmorTierOptions();
}

/**
 * Update tiers based on slot + name.
 */
function updateArmorTierOptions() {
  const slot = document.getElementById("armorSlotSelect").value;

  const name = document.getElementById("armorNameSelect").value;

  const tierSelect = document.getElementById("armorTierSelect");

  tierSelect.innerHTML = "";

  const tiers = [
    ...new Set(
      data.armors
        .filter(
          (armor) =>
            armor.armor_piece_location === slot && armor.armor_name === name,
        )
        .map((armor) => armor.armor_tier),
    ),
  ];

  tiers.forEach((tier) => {
    const opt = document.createElement("option");

    opt.value = tier;

    opt.textContent = tier;

    tierSelect.appendChild(opt);
  });
}

/**
 * Equip armor into a slot.
 *
 * Rules:
 * - only one equipped per slot
 * - equipped armor has storedAt = null
 */
function equipArmor(slot, armorId) {
  // Remove current equipped armor from slot
  selected.armors = selected.armors.filter((selectedArmor) => {
    if (!selectedArmor.is_equipped) {
      return true;
    }

    const dbArmor = data.armors.find(
      (armor) => armor.armor_id === selectedArmor.armor_id,
    );

    return dbArmor?.armor_piece_location !== slot;
  });

  // Empty slot
  if (!armorId) {
    renderLists(selected, data);

    triggerAutoRun();

    return;
  }

  // Check if armor already exists
  const existing = selected.armors.find((armor) => armor.armor_id === armorId);

  if (existing) {
    existing.is_equipped = true;
    existing.storedAt = null;

    renderLists(selected, data);

    triggerAutoRun();

    return;
  }

  // Add new equipped armor
  selected.armors.push({
    armor_id: armorId,
    is_equipped: true,
    storedAt: null,
  });

  renderLists(selected, data);

  triggerAutoRun();
}

/**
 * Add armor directly to storage.
 */
function addStoredArmor(armorId, storedAt = "backpack") {
  if (!armorId) {
    return;
  }

  selected.armors.push({
    armor_id: armorId,
    is_equipped: false,
    storedAt,
  });

  renderLists(selected, data);

  triggerAutoRun();
}

/**
 * Move armor between storages.
 */
function moveArmor(index, storedAt) {
  const armor = selected.armors[index];

  if (!armor) {
    return;
  }

  armor.is_equipped = false;
  armor.storedAt = storedAt;

  renderLists(selected, data);

  triggerAutoRun();
}

/**
 * Remove armor instance completely.
 */
function removeArmor(index) {
  selected.armors.splice(index, 1);

  renderLists(selected, data);

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

        armor: selected.armors,
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
  // ───────────────────────────────────────────────────────────────────────────
  // ADVANTAGES
  // ───────────────────────────────────────────────────────────────────────────

  document
    .getElementById("loadAdvantagesBtn")
    .addEventListener("click", loadAdvantages);

  document.getElementById("addAdvBtn").addEventListener("click", addAdv);

  // ───────────────────────────────────────────────────────────────────────────
  // DISADVANTAGES
  // ───────────────────────────────────────────────────────────────────────────

  document
    .getElementById("loadDisadvantagesBtn")
    .addEventListener("click", loadDisadvantages);

  document.getElementById("addDisBtn").addEventListener("click", addDis);

  // ───────────────────────────────────────────────────────────────────────────
  // SKILLS
  // ───────────────────────────────────────────────────────────────────────────

  document
    .getElementById("loadSkillsBtn")
    .addEventListener("click", loadSkills);

  document.getElementById("addSkillBtn").addEventListener("click", addSkill);

  // ───────────────────────────────────────────────────────────────────────────
  // SPELLS
  // ───────────────────────────────────────────────────────────────────────────

  document
    .getElementById("loadSpellsBtn")
    .addEventListener("click", loadSpells);

  document.getElementById("addSpellBtn").addEventListener("click", addSpell);

  // ───────────────────────────────────────────────────────────────────────────
  // ARMORS
  // ───────────────────────────────────────────────────────────────────────────

  document
    .getElementById("loadArmorsBtn")
    .addEventListener("click", loadArmors);

  // SLOT → update names
  document
    .getElementById("armorSlotSelect")
    .addEventListener("change", updateArmorNameOptions);

  // NAME → update tiers
  document
    .getElementById("armorNameSelect")
    .addEventListener("change", updateArmorTierOptions);

  // ADD ARMOR
  document.getElementById("addArmorBtn").addEventListener("click", () => {
    const slot = document.getElementById("armorSlotSelect").value;

    const name = document.getElementById("armorNameSelect").value;

    const tier = document.getElementById("armorTierSelect").value;

    const armor = data.armors.find(
      (armor) =>
        armor.armor_piece_location === slot &&
        armor.armor_name === name &&
        armor.armor_tier === tier,
    );

    if (!armor) {
      return;
    }

    const armorId = armor.armor_id;

    const storedAt = document.getElementById("armorStorage").value;

    addStoredArmor(armorId, storedAt);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ENGINE
  // ───────────────────────────────────────────────────────────────────────────

  document.getElementById("runEngineBtn").addEventListener("click", runEngine);

  // ───────────────────────────────────────────────────────────────────────────
  // CLICK EVENTS
  // ───────────────────────────────────────────────────────────────────────────

  document.addEventListener("click", (e) => {
    // ADVANTAGES
    if (e.target.classList.contains("remove-adv")) {
      removeAdv(e.target.dataset.id);
    }

    // DISADVANTAGES
    if (e.target.classList.contains("remove-dis")) {
      removeDis(e.target.dataset.id);
    }

    // SKILLS
    if (e.target.classList.contains("remove-skill")) {
      removeSkill(e.target.dataset.id);
    }

    // SPELLS
    if (e.target.classList.contains("remove-spell")) {
      removeSpell(e.target.dataset.name);
    }

    // ARMORS
    if (e.target.classList.contains("remove-armor")) {
      removeArmor(Number(e.target.dataset.index));
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // INPUT EVENTS
  // ───────────────────────────────────────────────────────────────────────────

  document.addEventListener("input", (e) => {
    // ─────────────────────────────────────────────────────────────────────────
    // SKILLS
    // ─────────────────────────────────────────────────────────────────────────

    if (e.target.classList.contains("skill-input")) {
      updateSkill(e.target.dataset.id, e.target.dataset.field, e.target.value);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SPELLS
    // ─────────────────────────────────────────────────────────────────────────

    if (e.target.classList.contains("spell-input")) {
      updateSpell(
        e.target.dataset.name,
        e.target.dataset.field,
        e.target.value,
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECONDARY ATTRIBUTES
    // ─────────────────────────────────────────────────────────────────────────

    if (e.target.classList.contains("secondary-input")) {
      const name = e.target.dataset.name;

      const field = e.target.dataset.field;

      const value = Number(e.target.value) || 0;

      if (!selected.secondary[name]) {
        selected.secondary[name] = {
          bought: 0,
          modifier: 0,
        };
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

    // ─────────────────────────────────────────────────────────────────────────
    // DAMAGE
    // ─────────────────────────────────────────────────────────────────────────

    if (e.target.classList.contains("damage-input")) {
      const type = e.target.dataset.type;

      const value = Number(e.target.value) || 0;

      if (!selected.damage[type]) {
        selected.damage[type] = {
          modifier: 0,
        };
      }

      selected.damage[type].modifier = value;

      triggerAutoRun();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ARMOR SLOT EQUIP
    // ─────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────────
    // EQUIPPED ARMOR NAME
    // ─────────────────────────────────────────────────────────────────────────────

    if (e.target.classList.contains("equipped-armor-name")) {
      const slot = e.target.dataset.slot;

      const name = e.target.value;

      // Empty slot
      if (!name) {
        equipArmor(slot, "");

        return;
      }

      const tierSelect = document.querySelector(
        `.equipped-armor-tier[data-slot="${slot}"]`,
      );

      const availableArmors = data.armors.filter(
        (armor) =>
          armor.armor_piece_location === slot && armor.armor_name === name,
      );

      tierSelect.innerHTML = availableArmors
        .map(
          (armor) => `
          <option value="${armor.armor_tier}">
            ${armor.armor_tier}
          </option>
        `,
        )
        .join("");

      const firstArmor = availableArmors[0];

      if (!firstArmor) {
        return;
      }

      equipArmor(slot, firstArmor.armor_id);

      renderLists(selected, data);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // EQUIPPED ARMOR TIER
    // ─────────────────────────────────────────────────────────────────────────────

    if (e.target.classList.contains("equipped-armor-tier")) {
      const slot = e.target.dataset.slot;

      const tier = e.target.value;

      const nameSelect = document.querySelector(
        `.equipped-armor-name[data-slot="${slot}"]`,
      );

      const name = nameSelect.value;

      const armor = data.armors.find(
        (armor) =>
          armor.armor_piece_location === slot &&
          armor.armor_name === name &&
          armor.armor_tier === tier,
      );

      if (!armor) {
        return;
      }

      equipArmor(slot, armor.armor_id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ARMOR STORAGE MOVE
    // ─────────────────────────────────────────────────────────────────────────

    if (e.target.classList.contains("armor-storage-select")) {
      const index = Number(e.target.dataset.index);

      moveArmor(index, e.target.value);
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
