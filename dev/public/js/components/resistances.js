import { getElementalResistanceLabel } from "../localization/pt-BR/index.js";

// Engine and state stay in raw decimal multipliers (1 = normal, 2 = double, 0.5 = half);
// these convert to/from percent at the UI boundary only.
function decimalToPercent(value) {
  return Math.round((value ?? 0) * 100 * 100) / 100;
}

function percentToDecimal(percent) {
  return Math.round((percent / 100) * 10000) / 10000;
}

// Mirrors renderSecondaryAttributes's columns minus "bought" — no points-purchase for resistances.
export function renderElementalResistances(sheet) {
  const resistances = sheet?.character?.elemental_resistances;
  if (!resistances) return;

  const tbody = document.getElementById("resistancesTable");
  if (!tbody) return;

  tbody.innerHTML = Object.entries(resistances)
    .map(([type, data]) => {
      const enchantmentPercent = decimalToPercent(data.enchantment_modifier);
      const hasEnchantment = data.has_enchantment_modifier ?? false;
      const enchantmentDisplay = hasEnchantment
        ? enchantmentPercent > 0
          ? `+${enchantmentPercent}%`
          : `${enchantmentPercent}%`
        : "—";

      return `
        <tr>
          <td><strong>${getElementalResistanceLabel(type)}</strong></td>

          <td class="col-num">${decimalToPercent(data.race_base)}%</td>

          <td>
            <div class="num-stepper">
              <input
                type="text"
                inputmode="decimal"
                class="resistance-input"
                data-type="${type}"
                data-step="5"
                value="${decimalToPercent(data.modifier)}"
              />
              <div class="stepper-btns">
                <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
                <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
              </div>
            </div>
          </td>

          <td class="col-num enchantment-mod-cell${hasEnchantment ? " enchantment-mod-active" : ""}">${enchantmentDisplay}</td>

          <td class="col-num">${decimalToPercent(data.final)}%</td>
        </tr>
      `;
    })
    .join("");
}

export { decimalToPercent, percentToDecimal };
