// ===== RENDER LISTS =====
export function renderLists(selected, data) {
  // ADVANTAGES
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

  // DISADVANTAGES
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

  // SKILLS
  document.getElementById("skillList").innerHTML = Object.entries(
    selected.skills,
  )
    .map(([id, data]) => {
      return `
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
      `;
    })
    .join("");

  // SPELLS
  document.getElementById("spellList").innerHTML = Object.entries(
    selected.spells,
  )
    .map(([name, data]) => {
      return `
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
      `;
    })
    .join("");

  // ───────────────────────────────────────────────────────────────────────────
  // ARMOR SLOTS
  // ───────────────────────────────────────────────────────────────────────────

  const ARMOR_SLOTS = ["Cabeça", "Tronco", "Braços", "Mãos", "Pernas", "Pés"];

  const equippedHtml = ARMOR_SLOTS.map((slot) => {
    // All armors for slot
    const slotArmors = data.armors.filter(
      (armor) => armor.armor_piece_location === slot,
    );

    // Equipped armor instance
    const equippedInstance = selected.armors.find((selectedArmor) => {
      if (!selectedArmor.is_equipped) {
        return false;
      }

      const dbArmor = data.armors.find(
        (armor) => armor.armor_id === selectedArmor.armor_id,
      );

      return dbArmor?.armor_piece_location === slot;
    });

    // Full DB armor
    const equippedArmor = equippedInstance
      ? data.armors.find(
          (armor) => armor.armor_id === equippedInstance.armor_id,
        )
      : null;

    // Unique names
    const names = [...new Set(slotArmors.map((armor) => armor.armor_name))];

    // Available tiers for selected name
    const tiers = equippedArmor
      ? slotArmors
          .filter((armor) => armor.armor_name === equippedArmor.armor_name)
          .map((armor) => armor.armor_tier)
      : [];

    return `
    <div class="armor-slot">
      <strong>${slot}</strong>

      <!-- NAME -->
      <select
        class="equipped-armor-name"
        data-slot="${slot}"
      >
        <option value="">
          Empty
        </option>

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
      <select
        class="equipped-armor-tier"
        data-slot="${slot}"
      >
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
            : `
              <option value="">
                -
              </option>
            `
        }
      </select>

      <!-- MATERIAL -->
      <select
        class="equipped-armor-material"
        data-slot="${slot}"
      >
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
      <select
        class="equipped-armor-move"
        data-slot="${slot}"
      >
        <option value="">
          Equipped
        </option>

        <option value="backpack">
          Backpack
        </option>

        <option value="stash">
          Stash
        </option>

        <option value="camp">
          Camp
        </option>
      </select>
    </div>
  `;
  }).join("");

  document.getElementById("armorSlots").innerHTML = equippedHtml;

  // ───────────────────────────────────────────────────────────────────────────
  // STORED ARMORS
  // ───────────────────────────────────────────────────────────────────────────

  const storedArmors = selected.armors.filter((armor) => !armor.is_equipped);

  document.getElementById("armorStorageList").innerHTML = storedArmors
    .map((selectedArmor, index) => {
      const armorData = data.armors.find(
        (armor) => armor.armor_id === selectedArmor.armor_id,
      );

      if (!armorData) {
        return "";
      }

      const material = data.materials.find(
        (material) => material.material_id === selectedArmor.material_id,
      );

      return `
      <li>
        <strong>
          ${armorData.armor_name}
        </strong>

        (${armorData.armor_piece_location})

        ${
          material
            ? `
              - ${material.material_name}
            `
            : ""
        }

        <!-- STORAGE -->
        <select
          class="armor-storage-select"
          data-index="${index}"
        >
          <option
            value="backpack"
            ${selectedArmor.storedAt === "backpack" ? "selected" : ""}
          >
            Backpack
          </option>

          <option
            value="stash"
            ${selectedArmor.storedAt === "stash" ? "selected" : ""}
          >
            Stash
          </option>

          <option
            value="camp"
            ${selectedArmor.storedAt === "camp" ? "selected" : ""}
          >
            Camp
          </option>
        </select>

        <!-- EQUIP -->
        <button
          class="equip-stored-armor"
          data-index="${index}"
        >
          Equip
        </button>

        <!-- REMOVE -->
        <button
          class="remove-armor"
          data-index="${index}"
        >
          ❌
        </button>
      </li>
    `;
    })
    .join("");
}

function getMaterialName(materialId, materials = []) {
  if (!materialId) {
    return "Common";
  }

  const material = materials.find(
    (material) => material.material_id === materialId,
  );

  return material?.material_name || "Unknown";
}

// ===== INVENTORY UI =====
export function updateInventoryUI(sheet) {
  const carry = sheet?.inventory?.carry_weight;
  if (!carry) return;

  const baseWeight = Number(document.getElementById("weight").value) || 0;

  const armorWeight = sheet?.inventory?.armor?.carried_armor_weight || 0;

  const weight = baseWeight + armorWeight;

  document.getElementById("armor_weight").textContent = armorWeight;

  document.getElementById("total_weight").textContent = weight;

  let stateLabel = "None";

  if (weight >= carry.limits.veryHeavy) stateLabel = "Overloaded";
  else if (weight >= carry.limits.heavy) stateLabel = "Very Heavy";
  else if (weight >= carry.limits.medium) stateLabel = "Heavy";
  else if (weight >= carry.limits.light) stateLabel = "Medium";
  else if (weight > carry.limits.none) stateLabel = "Light";

  document.getElementById("encumbrance").textContent =
    `${stateLabel} (${carry.weight_modifier})`;

  const limitsText = `
    None: ${carry.limits.none} |
    Light: ${carry.limits.light} |
    Medium: ${carry.limits.medium} |
    Heavy: ${carry.limits.heavy} |
    Very Heavy: ${carry.limits.veryHeavy}
  `;

  document.getElementById("carry_limits").textContent = limitsText
    .replace(/\s+/g, " ")
    .trim();
}

// ===== PRIMARY ATTRIBUTES UI =====
export function updateActualValues() {
  ["ST", "DX", "IQ", "HT"].forEach((attr) => {
    const base = Number(document.getElementById(`${attr}_base`).value) || 0;
    const mod = Number(document.getElementById(`${attr}_mod`).value) || 0;

    document.getElementById(`${attr}_actual`).textContent = base + mod;
  });
}

// ===== SECONDARY ATTRIBUTES UI =====
export function renderSecondaryAttributes(sheet) {
  const sec = sheet?.character?.secondary_attributes;
  if (!sec) return;

  const tbody = document.getElementById("secondaryTable");

  tbody.innerHTML = Object.entries(sec)
    .map(([name, data]) => {
      const isBasicSpeed = name === "BasicSpeed";

      // DISPLAY (2 decimals only for BasicSpeed)
      const baseDisplay = isBasicSpeed
        ? Number(data.base_value).toFixed(2)
        : data.base_value;

      const valueDisplay = isBasicSpeed
        ? Number(data.value).toFixed(2)
        : data.value;

      // INPUT RULES
      const boughtMax = isBasicSpeed ? 6 : 5;
      const boughtStep = 1;

      const modifierStep = isBasicSpeed ? 0.5 : 1;

      return `
        <tr>
          <td><strong>${name}</strong></td>

          <td>${baseDisplay}</td>

          <td>
            <input
              type="number"
              class="secondary-input"
              data-name="${name}"
              data-field="bought"
              min="0"
              max="${boughtMax}"
              step="${boughtStep}"
              value="${data.bought}"
            />
          </td>

          <td>
            <input
              type="number"
              class="secondary-input"
              data-name="${name}"
              data-field="modifier"
              step="${modifierStep}"
              value="${data.modifier}"
            />
          </td>

          <td>${valueDisplay}</td>
        </tr>
      `;
    })
    .join("");
}

// ===== BASE DAMAGE UI =====
export function renderDamage(sheet) {
  const dmg = sheet?.character?.base_damage;
  if (!dmg) return;

  const tbody = document.getElementById("damageTable");

  tbody.innerHTML = Object.entries(dmg)
    .map(([type, data]) => {
      return `
        <tr>
          <td><strong>${type}</strong></td>

          <td>${data.dice}</td>

          <td>${data.base_modifier}</td>

          <td>
            <input
              type="number"
              class="damage-input"
              data-type="${type}"
              value="${data.modifier}"
            />
          </td>

          <td>${data.final_modifier}</td>
        </tr>
      `;
    })
    .join("");
}

// ===== OUTPUT =====
export function renderOutput(json) {
  document.getElementById("out").textContent = JSON.stringify(json, null, 2);
}
