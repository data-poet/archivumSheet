import { getSecondaryAttributeLabel, t } from "../localization/pt-BR.js";
import { state } from "../state.js";

// ===== TABLE HEADERS =====
// th-attr-*/th-sec-* ids existed in the HTML but were never populated —
// pre-existing gap predating the enchantment column, not something new.
// Fixing both tables' full header sets here rather than just the new
// enchantment column, since attributes.base/race/modifier/etc. already
// exist in the localization file, just unused until now.
export function initAttributeTableHeaders() {
  const primaryHeaders = {
    "th-attr-attribute": "attributes.attribute",
    "th-attr-base": "attributes.base",
    "th-attr-race": "attributes.race",
    "th-attr-modifier": "attributes.modifier",
    "th-attr-enchantment": "attributes.enchantment",
    "th-attr-actual": "attributes.actual",
  };

  const secondaryHeaders = {
    "th-sec-attribute": "attributes.attribute",
    "th-sec-base": "attributes.base",
    "th-sec-bought": "attributes.bought",
    "th-sec-modifier": "attributes.modifier",
    "th-sec-enchantment": "attributes.enchantment",
    "th-sec-final": "attributes.final",
  };

  const resistancesHeaders = {
    "th-res-type": "attributes.type",
    "th-res-race": "attributes.race",
    "th-res-modifier": "attributes.modifierPercent",
    "th-res-enchantment": "attributes.enchantment",
    "th-res-final": "attributes.finalDamageReceived",
  };

  for (const [id, key] of Object.entries({
    ...primaryHeaders,
    ...secondaryHeaders,
    ...resistancesHeaders,
  })) {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  }
}

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
      // HP/Mana/Toxicity's modifier is a "damage/spent" tracker (≤ 0 only),
      // not a stat bonus — mirrors the cap enforced in traits/events.js and
      // the resume-bar steppers, so edit mode and view mode agree.
      const isVital       = name === "HP" || name === "Mana" || name === "Toxicity";

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
                ${isVital ? 'data-max="0"' : ""}
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
