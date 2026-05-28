import { setHTML } from "../../shared/dom.js";

// ===== HELPERS =====
function emptyRow(colspan) {
  return `<tr class="empty-row"><td colspan="${colspan}">—</td></tr>`;
}

// ===== ADVANTAGES =====
export function renderAdvantages(selected, data) {
  const ids = Object.keys(selected.advantages);

  const rows =
    ids.length === 0
      ? emptyRow(4)
      : ids
          .map((id) => {
            const adv = data.advantages?.find((a) => a.advantage_id === id);
            const name = adv?.advantage_box_name ?? id;
            const cost = adv?.advantage_cost ?? "—";
            const type = adv?.advantage_type ?? "—";
            return `
          <tr>
            <td>${name}</td>
            <td class="col-num">${cost}</td>
            <td>${type}</td>
            <td class="col-action">
              <button class="btn-remove remove-adv" data-id="${id}">✕</button>
            </td>
          </tr>`;
          })
          .join("");

  setHTML(
    "advList",
    `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th class="col-num">Cost</th>
          <th>Type</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `,
  );
}

// ===== DISADVANTAGES =====
export function renderDisadvantages(selected, data) {
  const ids = Object.keys(selected.disadvantages);

  const rows =
    ids.length === 0
      ? emptyRow(4)
      : ids
          .map((id) => {
            const dis = data.disadvantages?.find(
              (d) => d.disadvantage_id === id,
            );
            const name = dis?.disadvantage_box_name ?? id;
            const cost = dis?.disadvantage_cost ?? "—";
            const type = dis?.disadvantage_type ?? "—";
            return `
          <tr>
            <td>${name}</td>
            <td class="col-num">${cost}</td>
            <td>${type}</td>
            <td class="col-action">
              <button class="btn-remove remove-dis" data-id="${id}">✕</button>
            </td>
          </tr>`;
          })
          .join("");

  setHTML(
    "disList",
    `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th class="col-num">Cost</th>
          <th>Type</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `,
  );
}

// ===== SKILLS =====
export function renderSkills(selected, data) {
  const entries = Object.entries(selected.skills);

  const rows =
    entries.length === 0
      ? emptyRow(7)
      : entries
          .map(([id, skillState]) => {
            const skill = data.skills?.find((s) => s.skill_id === id);
            const name = skill?.skill_name ?? id;
            const diff = skill?.skill_difficulty ?? "—";
            const attr = skill?.skill_base_attribute ?? "—";
            const base = skillState.base ?? 0;
            const mod = skillState.modifier ?? 0;
            const final = base + mod;
            return `
          <tr>
            <td>${name}</td>
            <td class="col-center">${attr}</td>
            <td class="col-center">${diff}</td>
            <td class="col-num">
              <input type="number" class="skill-input" data-id="${id}" data-field="base" value="${base}" />
            </td>
            <td class="col-num">
              <input type="number" class="skill-input" data-id="${id}" data-field="modifier" value="${mod}" />
            </td>
            <td class="col-num"><strong>${final}</strong></td>
            <td class="col-action">
              <button class="btn-remove remove-skill" data-id="${id}">✕</button>
            </td>
          </tr>`;
          })
          .join("");

  setHTML(
    "skillList",
    `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th class="col-center">Attr</th>
          <th class="col-center">Diff</th>
          <th class="col-num">Base</th>
          <th class="col-num">Mod</th>
          <th class="col-num">Final</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `,
  );
}

// ===== SPELLS =====
export function renderSpells(selected, data) {
  const entries = Object.entries(selected.spells);

  const rows =
    entries.length === 0
      ? emptyRow(6)
      : entries
          .map(([name, spellState]) => {
            const spell = data.spells?.find((s) => s.spell_name === name);
            const school = spell?.spell_school ?? "—";
            const base = spellState.base_value ?? 0;
            const mod = spellState.modifier ?? 0;
            const final = base + mod;
            return `
          <tr>
            <td>${name}</td>
            <td>${school}</td>
            <td class="col-num">
              <input type="number" class="spell-input" data-name="${name}" data-field="base_value" value="${base}" />
            </td>
            <td class="col-num">
              <input type="number" class="spell-input" data-name="${name}" data-field="modifier" value="${mod}" />
            </td>
            <td class="col-num"><strong>${final}</strong></td>
            <td class="col-action">
              <button class="btn-remove remove-spell" data-name="${name}">✕</button>
            </td>
          </tr>`;
          })
          .join("");

  setHTML(
    "spellList",
    `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>School</th>
          <th class="col-num">Base</th>
          <th class="col-num">Mod</th>
          <th class="col-num">Final</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `,
  );
}
