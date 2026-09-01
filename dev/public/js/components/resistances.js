import { getElementalResistanceLabel } from "../localization/pt-BR.js";

// The engine works entirely in raw decimal multipliers (1 = normal damage,
// 2 = double damage, 0.5 = half damage — same unit for race_base, modifier,
// enchantment_modifier, and final). Reading/typing that as a decimal is
// unintuitive for a percentage-based mechanic, so every one of those columns
// displays as a whole percentage instead (100%, 200%, 50%, ...) and — for
// the one editable column, the modifier — accepts input the same way.
// decimalToPercent/percentToDecimal convert at the UI boundary only:
// state.selected.resistances and the engine payload still deal exclusively
// in the raw decimal form.
function decimalToPercent(value) {
  return Math.round((value ?? 0) * 100 * 100) / 100; // 2 decimal places
}

function percentToDecimal(percent) {
  return Math.round((percent / 100) * 10000) / 10000; // 4 decimal places
}

// ===== ELEMENTAL RESISTANCES UI (edit mode) =====
//
// Mirrors renderSecondaryAttributes's shape (base/modifier/enchantment/final
// columns, conditional enchantment cell) minus the "bought" column, since
// there's no points-purchase concept for elemental resistances — just the
// race's base multiplier plus a player-entered modifier.
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
