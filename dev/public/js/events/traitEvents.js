import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { renderLists } from "../ui.js";
import { removeAdv } from "../traits/advantages.js";
import { removeDis } from "../traits/disadvantages.js";
import { removeSkill, updateSkill } from "../traits/skills.js";
import { removeSpell, updateSpell } from "../traits/spells.js";

const selected = state.selected;

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleTraitClick(e) {
  if (e.target.classList.contains("remove-adv")) {
    removeAdv(e.target.dataset.id);
    return true;
  }
  if (e.target.classList.contains("remove-dis")) {
    removeDis(e.target.dataset.id);
    return true;
  }
  if (e.target.classList.contains("remove-skill")) {
    removeSkill(e.target.dataset.id);
    return true;
  }
  if (e.target.classList.contains("remove-spell")) {
    removeSpell(e.target.dataset.name);
    return true;
  }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleTraitInput(e) {
  if (e.target.classList.contains("skill-input")) {
    updateSkill(e.target.dataset.id, e.target.dataset.field, e.target.value);
    updateFinalCell(e.target, "skill-input", e.target.dataset.id, "data-id");

    withOpenState("#skillList", "[data-id]", "data-id", () => {
      renderLists(state.selected, state.data);
    });
    return true;
  }

  if (e.target.classList.contains("spell-input")) {
    updateSpell(e.target.dataset.name, e.target.dataset.field, e.target.value);

    withOpenState("#spellList", "[data-name]", "data-name", () => {
      renderLists(state.selected, state.data);
    });
    return true;
  }

  if (e.target.classList.contains("secondary-input")) {
    const { name, field } = e.target.dataset;
    const value = Number(e.target.value) || 0;

    if (!selected.secondary[name]) {
      selected.secondary[name] = { bought: 0, modifier: 0 };
    }

    if (field === "bought") {
      const max = name === "BasicSpeed" ? 6 : 5;
      selected.secondary[name].bought = Math.max(0, Math.min(max, value));
    }

    if (field === "modifier") {
      selected.secondary[name].modifier =
        name === "BasicSpeed" ? Math.round(value * 2) / 2 : value;
    }

    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("damage-input")) {
    const { type } = e.target.dataset;
    const value = Number(e.target.value) || 0;

    if (!selected.damage[type]) {
      selected.damage[type] = { modifier: 0 };
    }

    selected.damage[type].modifier = value;
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Snapshot which detail expanders are open inside a list container,
 * run a re-render callback, then restore the open state.
 *
 * @param {string}   listSelector  - e.g. "#skillList"
 * @param {string}   keySelector   - attribute selector for the key element, e.g. "[data-id]"
 * @param {string}   keyAttr       - dataset attribute name, e.g. "data-id"
 * @param {Function} renderFn      - callback that triggers the re-render
 */
function withOpenState(listSelector, keySelector, keyAttr, renderFn) {
  const open = new Set(
    [
      ...document.querySelectorAll(
        `${listSelector} tr.detail-row details[open]`,
      ),
    ]
      .map(
        (d) =>
          d.closest("tr").previousElementSibling?.querySelector(keySelector)?.[
            keyAttr
          ],
      )
      .filter(Boolean),
  );

  renderFn();

  document
    .querySelectorAll(`${listSelector} tr.detail-row details`)
    .forEach((d) => {
      const key = d
        .closest("tr")
        .previousElementSibling?.querySelector(keySelector)?.[keyAttr];
      if (key && open.has(key)) d.setAttribute("open", "");
    });
}

/**
 * After a base/modifier input changes, find the other input in the same row
 * and write base + modifier into the Final <td> (last non-action cell).
 */
function updateFinalCell(changedInput, cssClass, key, attr) {
  const row = changedInput.closest("tr");
  if (!row) return;

  // Collect both inputs in this row by class + matching key attribute
  const inputs = row.querySelectorAll(`input.${cssClass}[${attr}="${key}"]`);
  let base = 0;
  let mod = 0;

  inputs.forEach((inp) => {
    const val = Number(inp.value) || 0;
    if (inp.dataset.field === "base" || inp.dataset.field === "base_value") {
      base = val;
    } else if (inp.dataset.field === "modifier") {
      mod = val;
    }
  });

  // The Final cell is the <td> holding <strong> that comes after the modifier td
  const finalTd = row.querySelector("td strong");
  if (finalTd) finalTd.textContent = base + mod;
}
