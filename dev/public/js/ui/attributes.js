import { getSecondaryAttributeLabel } from "../localization/pt-BR.js";
import { state } from "../state.js";

// ===== PRIMARY ATTRIBUTES UI =====
export function updateActualValues() {
  ["ST", "DX", "IQ", "HT"].forEach((attr) => {
    const base = Number(document.getElementById(`${attr}_base`).value) || 0;
    const mod  = Number(document.getElementById(`${attr}_mod`).value)  || 0;

    const sheetAttr = state.sheet?.character?.primary_attributes?.[attr];
    const raceMod = sheetAttr?.race_modifier ?? 0;
    const enchantmentMod = sheetAttr?.enchantment_modifier ?? 0;
    const hasEnchantment = sheetAttr?.has_enchantment_modifier ?? false;

    const raceCell = document.getElementById(`${attr}_race`);
    if (raceCell) {
      raceCell.textContent = raceMod > 0 ? `+${raceMod}` : raceMod;
      raceCell.className = `col-num race-mod-cell${raceMod !== 0 ? " race-mod-active" : ""}`;
    }

    // Only shown when an equipped enchanted item actually touches this
    // attribute — presence-based (has_enchantment_modifier), not just
    // "nonzero", since the engine already distinguishes the two (a +2/-2
    // pair from two different items still counts as present).
    const enchantmentCell = document.getElementById(`${attr}_enchantment`);
    if (enchantmentCell) {
      enchantmentCell.textContent = hasEnchantment
        ? enchantmentMod > 0
          ? `+${enchantmentMod}`
          : `${enchantmentMod}`
        : "—";
      enchantmentCell.className = `col-num enchantment-mod-cell${hasEnchantment ? " enchantment-mod-active" : ""}`;
    }

    // Reads enchantment_modifier from the engine (state.sheet) — there's no
    // DOM input for it, unlike modifier/base, since it's entirely
    // equipment-driven. The engine is the source of truth for this term.
    document.getElementById(`${attr}_actual`).textContent =
      base + raceMod + mod + enchantmentMod;
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

      const enchantmentMod = data.enchantment_modifier ?? 0;
      const hasEnchantment = data.has_enchantment_modifier ?? false;
      const enchantmentDisplay = hasEnchantment
        ? enchantmentMod > 0
          ? `+${enchantmentMod}`
          : `${enchantmentMod}`
        : "—";

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

          <td class="col-num enchantment-mod-cell${hasEnchantment ? " enchantment-mod-active" : ""}">${enchantmentDisplay}</td>

          <td>${valueDisplay}</td>
        </tr>
      `;
    })
    .join("");
}
