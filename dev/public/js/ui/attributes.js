import { getSecondaryAttributeLabel } from "../localization/pt-BR.js";
import { state } from "../state.js";

// ===== PRIMARY ATTRIBUTES UI =====
export function updateActualValues() {
  ["ST", "DX", "IQ", "HT"].forEach((attr) => {
    const base = Number(document.getElementById(`${attr}_base`).value) || 0;
    const mod = Number(document.getElementById(`${attr}_mod`).value) || 0;
    const raceMod =
      state.sheet?.character?.primary_attributes?.[attr]?.race_modifier ?? 0;

    const raceCell = document.getElementById(`${attr}_race`);
    if (raceCell) {
      raceCell.textContent = raceMod > 0 ? `+${raceMod}` : raceMod;
      raceCell.className = `col-num race-mod-cell${raceMod !== 0 ? " race-mod-active" : ""}`;
    }

    document.getElementById(`${attr}_actual`).textContent =
      base + raceMod + mod;
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

      const baseDisplay = isBasicSpeed
        ? Number(data.base_value).toFixed(2)
        : data.base_value;
      const valueDisplay = isBasicSpeed
        ? Number(data.value).toFixed(2)
        : data.value;

      const boughtMax = isBasicSpeed ? 6 : 5;
      const modifierStep = isBasicSpeed ? 0.5 : 1;

      return `
        <tr>
          <td><strong>${getSecondaryAttributeLabel(name)}</strong></td>

          <td>${baseDisplay}</td>

          <td>
            <input
              type="number"
              class="secondary-input"
              data-name="${name}"
              data-field="bought"
              min="0"
              max="${boughtMax}"
              step="1"
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
