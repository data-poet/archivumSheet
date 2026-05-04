// ===== RENDER LISTS =====
export function renderLists(selected) {
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
}

// ===== INVENTORY UI =====
export function updateInventoryUI(sheet) {
  const carry = sheet?.inventory?.carry_weight;
  if (!carry) return;

  const weight = Number(document.getElementById("weight").value) || 0;

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
