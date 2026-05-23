import { setHTML } from "../../shared/dom.js";

// ===== ADVANTAGES =====
export function renderAdvantages(selected) {
  setHTML(
    "advList",
    Object.keys(selected.advantages)
      .map(
        (a) => `
          <li>
            ${a}
            <button class="remove-adv" data-id="${a}">❌</button>
          </li>
        `,
      )
      .join(""),
  );
}

// ===== DISADVANTAGES =====
export function renderDisadvantages(selected) {
  setHTML(
    "disList",
    Object.keys(selected.disadvantages)
      .map(
        (d) => `
          <li>
            ${d}
            <button class="remove-dis" data-id="${d}">❌</button>
          </li>
        `,
      )
      .join(""),
  );
}

// ===== SKILLS =====
export function renderSkills(selected) {
  setHTML(
    "skillList",
    Object.entries(selected.skills)
      .map(
        ([id, data]) => `
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
        `,
      )
      .join(""),
  );
}

// ===== SPELLS =====
export function renderSpells(selected) {
  setHTML(
    "spellList",
    Object.entries(selected.spells)
      .map(
        ([name, data]) => `
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
        `,
      )
      .join(""),
  );
}
