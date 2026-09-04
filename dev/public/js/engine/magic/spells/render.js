import { setHTML } from "../../../shared/dom.js";
import { t } from "../../../localization/pt-BR/index.js";
import {
  formatRichText,
  detailRow,
  numStepper,
  emptyRow,
} from "../../../shared/renderUtils.js";

// ===== SPELLS =====

function getSpellTier(level) {
  if (level <= 12) return "Aprendiz";
  if (level <= 15) return "Experiente";
  if (level <= 17) return "Veterano";
  if (level <= 19) return "Especialista";
  return "Mestre";
}

function normalize(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Magic Aptitude (ADV-063 → ADV-065): column visibility and each spell's bonus are
// read straight from engine output — never recomputed client-side.
const MAGIC_APTITUDE_ADVANTAGE_IDS = ["ADV-063", "ADV-064", "ADV-065"];

function hasMagicAptitude(sheet) {
  const advantages = sheet?.character?.advantages ?? {};
  return MAGIC_APTITUDE_ADVANTAGE_IDS.some((id) => advantages[id]);
}

export function renderSpells(selected, data, sheet) {
  const grimoire = sheet?.grimoire ?? {};

  // Grimoire is keyed by spell_id (tier-specific), but spells are selected by name.
  const grimoireByName = {};
  for (const entry of Object.values(grimoire)) {
    grimoireByName[normalize(entry.name)] = entry;
  }

  // A purely item-granted spell (is_enchantment: true) never appears in
  // selected.spells, only in the engine's computed output.
  const grantedNames = Object.values(grimoire)
    .filter((entry) => entry.is_enchantment)
    .map((entry) => entry.name);
  const names = [
    ...new Set([...Object.keys(selected.spells), ...grantedNames]),
  ];

  const showAptitude = hasMagicAptitude(sheet);
  const COLS = showAptitude ? 9 : 8;

  const rows =
    names.length === 0
      ? emptyRow(COLS + 1)
      : names
          .map((name) => {
            const spellState = selected.spells[name]; // undefined for pure grants
            const grimoireEntry = grimoireByName[normalize(name)];

            const isEnchantment = grimoireEntry?.is_enchantment ?? false;

            // Show the winning source's base/mod if the grant won the collision,
            // not the player's losing selection sitting unused in state.
            const base = isEnchantment
              ? (grimoireEntry?.base_value ?? 0)
              : (spellState?.base_value ?? 0);
            const mod = isEnchantment
              ? (grimoireEntry?.modifier ?? 0)
              : (spellState?.modifier ?? 0);
            const aptitude = showAptitude
              ? (grimoireEntry?.aptitude_level ?? 0)
              : 0;

            const enchantmentMod = grimoireEntry?.enchantment_modifier ?? 0;
            const hasEnchantment =
              grimoireEntry?.has_enchantment_modifier ?? false;
            const enchantmentDisplay = hasEnchantment
              ? enchantmentMod > 0
                ? `+${enchantmentMod}`
                : `${enchantmentMod}`
              : "—";

            // Final value + tier read from the engine; local estimate is only a fallback
            // for the brief window before the debounced engine call first completes.
            const final = grimoireEntry?.value ?? base + mod + aptitude;
            const tier = grimoireEntry?.tier ?? getSpellTier(final);

            const spell =
              data.spells?.find(
                (s) =>
                  normalize(s.spell_name) === normalize(name) &&
                  normalize(s.spell_tier) === normalize(tier),
              ) ??
              data.spells?.find(
                (s) => normalize(s.spell_name) === normalize(name),
              );

            const school = spell?.spell_school ?? "—";
            const diff = spell?.spell_difficulty ?? "—";
            const type = spell?.spell_type ?? "—";
            const cost = spell?.spell_cost ?? "—";
            const castTime = spell?.spell_cast_time ?? "—";
            const target = spell?.spell_target_type ?? "—";
            const range = spell?.spell_range ?? "—";
            const area = spell?.spell_effect_area ?? "—";
            const scaling = formatRichText(spell?.spell_scaling);
            const duration = spell?.spell_duration ?? "—";
            const desc = formatRichText(spell?.spell_description);
            const obs = formatRichText(spell?.spell_observation);

            const baseCell = isEnchantment
              ? `<td class="col-num">${base}</td>`
              : `<td class="col-num">
                  ${numStepper("spell-input", `data-name="${name}" data-field="base_value"`, base)}
                </td>`;

            const modCell = isEnchantment
              ? `<td class="col-num">${mod}</td>`
              : `<td class="col-num">
                  ${numStepper("spell-input", `data-name="${name}" data-field="modifier"`, mod)}
                </td>`;

            // Item-granted rows have nothing in the player's own selection to remove.
            const actionCell = isEnchantment
              ? `<td class="col-action"></td>`
              : `<td class="col-action"><button class="btn-remove remove-spell" data-name="${name}">✕</button></td>`;

            const enchantmentTag = isEnchantment
              ? `<span class="trait-enchantment-tag">${t("character.enchanted")}</span>`
              : "";

            return `
          <tr class="${isEnchantment ? "trait-enchantment" : ""}">
            <td>${name}${enchantmentTag}</td>
            <td>${school}</td>
            <td class="col-center">${diff}</td>
            <td class="col-center">${tier}</td>
            ${baseCell}
            ${modCell}
            ${showAptitude ? `<td class="col-num">${aptitude}</td>` : ""}
            <td class="col-num enchantment-mod-cell${hasEnchantment ? " enchantment-mod-active" : ""}">${enchantmentDisplay}</td>
            <td class="col-num"><strong>${final}</strong></td>
            ${actionCell}
          </tr>
          <tr class="detail-row spell-detail-row">
            <td colspan="${COLS + 1}">
              <details>
                <summary>${t("common.details")}</summary>
                <div class="item-detail-grid">
                  <span class="item-detail"><em>${t("traits.spellType")}:</em> ${type}</span>
                  <span class="item-detail"><em>${t("traits.spellCost")}:</em> ${cost}</span>
                  <span class="item-detail"><em>${t("traits.cast")}:</em> ${castTime}</span>
                  <span class="item-detail"><em>${t("traits.target")}:</em> ${target}</span>
                  <span class="item-detail"><em>${t("traits.range")}:</em> ${range}</span>
                  <span class="item-detail"><em>${t("traits.area")}:</em> ${area}</span>
                  <span class="item-detail"><em>${t("traits.duration")}:</em> ${duration}</span>
                  ${scaling !== "—" ? `<div class="item-detail-block"><em>${t("traits.scaling")}:</em>${scaling}</div>` : `<span class="item-detail"><em>${t("traits.scaling")}:</em> —</span>`}
                  ${desc !== "—" ? `<div class="item-detail-block"><em>${t("traits.description")}:</em>${desc}</div>` : ""}
                  ${obs !== "—" ? `<div class="item-detail-block"><em>${t("traits.observation")}:</em>${obs}</div>` : ""}
                </div>
              </details>
            </td>
          </tr>`;
          })
          .join("");

  setHTML(
    "spellList",
    `
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("traits.name")}</th>
          <th>${t("traits.school")}</th>
          <th class="col-center">${t("traits.diff")}</th>
          <th class="col-center">${t("traits.tier")}</th>
          <th class="col-num">${t("traits.base")}</th>
          <th class="col-num">${t("traits.mod")}</th>
          ${showAptitude ? `<th class="col-num">${t("traits.aptitude")}</th>` : ""}
          <th class="col-num">${t("traits.enchantment")}</th>
          <th class="col-num">${t("traits.final")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table></div>
  `,
  );
}
