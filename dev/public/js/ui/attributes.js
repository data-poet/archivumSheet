import { getSecondaryAttributeLabel } from "../localization/pt-BR.js";
import { state } from "../state.js";

// ===== PRIMARY ATTRIBUTES UI =====
export function updateActualValues() {
  ["ST", "DX", "IQ", "HT"].forEach((attr) => {
    const base = Number(document.getElementById(`${attr}_base`).value) || 0;
    const mod  = Number(document.getElementById(`${attr}_mod`).value)  || 0;
    const raceMod =
      state.sheet?.character?.primary_attributes?.[attr]?.race_modifier ?? 0;

    const raceCell = document.getElementById(`${attr}_race`);
    if (raceCell) {
      raceCell.textContent = raceMod > 0 ? `+${raceMod}` : raceMod;
      raceCell.className = `col-num race-mod-cell${raceMod !== 0 ? " race-mod-active" : ""}`;
    }

    document.getElementById(`${attr}_actual`).textContent = base + raceMod + mod;
  });
}

// ===== SECONDARY ATTRIBUTES UI =====
export function renderSecondaryAttributes(sheet) {
  const sec = sheet?.character?.secondary_attributes;
  if (!sec) return;

  const tbody = document.getElementById("secondaryTable");

  tbody.innerHTML = Object.entries(sec)
    .map(([name, data]) => {
      const isBasicSpeed  = name === "BasicSpeed";
      const isMovement    = name === "Movement";

      const baseDisplay  = isBasicSpeed ? Number(data.base_value).toFixed(2) : data.base_value;
      const valueDisplay = isBasicSpeed ? Number(data.value).toFixed(2)      : data.value;

      const modifierStep = isBasicSpeed ? 0.5 : 1;

      const boughtCell = isMovement
        ? `<td>—</td>`
        : `<td>
            <div class="num-stepper">
              <input
                type="text"
                inputmode="numeric"
                class="secondary-input"
                data-name="${name}"
                data-field="bought"
                value="${data.bought}"
              />
              <div class="stepper-btns">
                <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
                <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
              </div>
            </div>
          </td>`;

      return `
        <tr>
          <td><strong>${getSecondaryAttributeLabel(name)}</strong></td>

          <td>${baseDisplay}</td>

          ${boughtCell}

          <td>
            <div class="num-stepper">
              <input
                type="text"
                inputmode="numeric"
                class="secondary-input"
                data-name="${name}"
                data-field="modifier"
                data-step="${modifierStep}"
                value="${data.modifier}"
              />
              <div class="stepper-btns">
                <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
                <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
              </div>
            </div>
          </td>

          <td>${valueDisplay}</td>
        </tr>
      `;
    })
    .join("");
}
