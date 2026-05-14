const ARMOR_SLOTS = ["Cabeça", "Tronco", "Braços", "Mãos", "Pernas", "Pés"];

// ===== ADVANTAGES =====
function renderAdvantages(selected) {
  document.getElementById("advList").innerHTML = Object.keys(
    selected.advantages,
  )
    .map(
      (a) => `
        <li>
          ${a}
          <button class="remove-adv" data-id="${a}">❌</button>
        </li>
      `,
    )
    .join("");
}

// ===== DISADVANTAGES =====
function renderDisadvantages(selected) {
  document.getElementById("disList").innerHTML = Object.keys(
    selected.disadvantages,
  )
    .map(
      (d) => `
        <li>
          ${d}
          <button class="remove-dis" data-id="${d}">❌</button>
        </li>
      `,
    )
    .join("");
}

// ===== SKILLS =====
function renderSkills(selected) {
  document.getElementById("skillList").innerHTML = Object.entries(
    selected.skills,
  )
    .map(
      ([id, data]) => `
        <li>
          <strong>${id}</strong>

          Base:
          <input
            type="number"
            class="skill-input"
            data-id="${id}"
            data-field="base"
            value="${data.base}"
          />

          Mod:
          <input
            type="number"
            class="skill-input"
            data-id="${id}"
            data-field="modifier"
            value="${data.modifier}"
          />

          <button class="remove-skill" data-id="${id}">❌</button>
        </li>
      `,
    )
    .join("");
}

// ===== SPELLS =====
function renderSpells(selected) {
  document.getElementById("spellList").innerHTML = Object.entries(
    selected.spells,
  )
    .map(
      ([name, data]) => `
        <li>
          <strong>${name}</strong>

          Base:
          <input
            type="number"
            class="spell-input"
            data-name="${name}"
            data-field="base_value"
            value="${data.base_value}"
          />

          Mod:
          <input
            type="number"
            class="spell-input"
            data-name="${name}"
            data-field="modifier"
            value="${data.modifier}"
          />

          <button class="remove-spell" data-name="${name}">❌</button>
        </li>
      `,
    )
    .join("");
}

// ===== ARMOR SLOTS (equipped) =====
function renderArmorSlots(selected, data) {
  const equippedHtml = ARMOR_SLOTS.map((slot) => {
    const slotArmors = data.armors.filter(
      (armor) => armor.armor_piece_location === slot,
    );

    const equippedInstance = selected.armors.find((selectedArmor) => {
      if (!selectedArmor.is_equipped) return false;

      const dbArmor = data.armors.find(
        (armor) => armor.armor_id === selectedArmor.armor_id,
      );

      return dbArmor?.armor_piece_location === slot;
    });

    const equippedArmor = equippedInstance
      ? data.armors.find(
          (armor) => armor.armor_id === equippedInstance.armor_id,
        )
      : null;

    const names = [...new Set(slotArmors.map((armor) => armor.armor_name))];

    const tiers = equippedArmor
      ? slotArmors
          .filter((armor) => armor.armor_name === equippedArmor.armor_name)
          .map((armor) => armor.armor_tier)
      : [];

    return `
      <div class="armor-slot">
        <strong>${slot}</strong>

        <!-- NAME -->
        <select class="equipped-armor-name" data-slot="${slot}">
          <option value="">Empty</option>

          ${names
            .map(
              (name) => `
                <option
                  value="${name}"
                  ${equippedArmor?.armor_name === name ? "selected" : ""}
                >
                  ${name}
                </option>
              `,
            )
            .join("")}
        </select>

        <!-- TIER -->
        <select class="equipped-armor-tier" data-slot="${slot}">
          ${
            equippedArmor
              ? tiers
                  .map(
                    (tier) => `
                      <option
                        value="${tier}"
                        ${equippedArmor?.armor_tier === tier ? "selected" : ""}
                      >
                        ${tier}
                      </option>
                    `,
                  )
                  .join("")
              : `<option value="">-</option>`
          }
        </select>

        <!-- MATERIAL -->
        <select class="equipped-armor-material" data-slot="${slot}">
          ${data.materials
            .map(
              (material) => `
                <option
                  value="${material.material_id}"
                  ${
                    equippedInstance?.material_id === material.material_id
                      ? "selected"
                      : ""
                  }
                >
                  ${material.material_name}
                </option>
              `,
            )
            .join("")}
        </select>

        <!-- MOVE -->
        <select class="equipped-armor-move" data-slot="${slot}">
          <option value="">Equipped</option>
          <option value="backpack">Backpack</option>
          <option value="stash">Stash</option>
          <option value="camp">Camp</option>
        </select>
      </div>
    `;
  }).join("");

  document.getElementById("armorSlots").innerHTML = equippedHtml;
}

// ===== STORED ARMORS =====
function renderStoredArmors(selected, data) {
  const storedArmors = selected.armors.filter((armor) => !armor.is_equipped);

  document.getElementById("armorStorageList").innerHTML = storedArmors
    .map((selectedArmor, index) => {
      const armorData = data.armors.find(
        (armor) => armor.armor_id === selectedArmor.armor_id,
      );

      if (!armorData) return "";

      const material = data.materials.find(
        (material) => material.material_id === selectedArmor.material_id,
      );

      return `
        <li>
          <strong>${armorData.armor_name}</strong>

          (${armorData.armor_piece_location})

          ${material ? `- ${material.material_name}` : ""}

          <!-- STORAGE -->
          <select class="armor-storage-select" data-index="${index}">
            <option value="backpack" ${selectedArmor.storedAt === "backpack" ? "selected" : ""}>Backpack</option>
            <option value="stash"    ${selectedArmor.storedAt === "stash" ? "selected" : ""}>Stash</option>
            <option value="camp"     ${selectedArmor.storedAt === "camp" ? "selected" : ""}>Camp</option>
          </select>

          <!-- EQUIP -->
          <button class="equip-stored-armor" data-index="${index}">Equip</button>

          <!-- REMOVE -->
          <button class="remove-armor" data-index="${index}">❌</button>
        </li>
      `;
    })
    .join("");
}

// ===== ORCHESTRATOR =====
export function renderLists(selected, data) {
  renderAdvantages(selected);
  renderDisadvantages(selected);
  renderSkills(selected);
  renderSpells(selected);
  renderArmorSlots(selected, data);
  renderStoredArmors(selected, data);
}
