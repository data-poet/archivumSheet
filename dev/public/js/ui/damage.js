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
            <input
              type="number"
              class="damage-input"
              data-type="${type}"
              value="${data.modifier}"
            />
          </td>

          <td>${data.final_modifier}</td>
        </tr>
      `,
    )
    .join("");
}
