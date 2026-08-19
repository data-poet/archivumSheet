// ===== BASE DAMAGE UI =====
export function renderDamage(sheet) {
  const dmg = sheet?.character?.base_damage;
  if (!dmg) return;

  const tbody = document.getElementById("damageTable");

  tbody.innerHTML = Object.entries(dmg)
    .map(
      ([type, data]) => `
        <tr>
          <td><strong>${type}</strong></td>
          <td>${data.dice}</td>
          <td>${data.base_modifier}</td>
          <td>
            <div class="num-stepper">
              <input
                type="text"
                inputmode="numeric"
                class="damage-input"
                data-type="${type}"
                value="${data.modifier}"
              />
              <div class="stepper-btns">
                <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
                <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
              </div>
            </div>
          </td>
          <td>${data.final_modifier}</td>
        </tr>
      `,
    )
    .join("");
}
