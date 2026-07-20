import { setHTML } from "../../shared/dom.js";
import { t } from "../../localization/pt-BR.js";
import { formatRichText, detailRow } from "./renderUtils.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyRow(colspan) {
  return `<tr class="empty-row"><td colspan="${colspan}">—</td></tr>`;
}

/** Wraps a text/numeric input in a num-stepper with ± buttons on the right. */
function numStepper(cls, dataAttrs, value, stepAttr = "") {
  return `
    <div class="num-stepper">
      <input
        type="text"
        inputmode="numeric"
        class="${cls}"
        ${dataAttrs}
        ${stepAttr}
        value="${value}"
      />
      <div class="stepper-btns">
        <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
        <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
      </div>
    </div>`;
}

// Categories that support isTrainedWithMaster and the actions formula
const MASTER_ELIGIBLE_CATEGORIES = new Set(["Armas e Combate", "Mágicas"]);

// ===== SKILLS =====

export function renderSkills(selected, data, sheet) {
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
            const book = skill?.skill_source_book ?? "—";
            const page = skill?.skill_source_page ?? "—";
            const desc = formatRichText(skill?.skill_description);
            const preDef = formatRichText(skill?.skill_pre_defined_level);
            const base = skillState.base_value ?? skillState.base ?? 0;
            const mod = skillState.modifier ?? 0;
            const final = base + mod;

            // Computed values from the engine output (state.sheet)
            const sheetSkill = sheet?.character?.skills?.[id];
            const parry = sheetSkill?.parry ?? null;
            const actions = sheetSkill?.actions ?? 1;

            // isTrainedWithMaster — driven by selected state, constrained to eligible categories
            const category = skill?.skill_category ?? "";
            const isEligible = MASTER_ELIGIBLE_CATEGORIES.has(category);
            const isMaster = isEligible
              ? Boolean(skillState.isTrainedWithMaster ?? false)
              : false;

            // ── Detail items ─────────────────────────────────────────────────
            const detailItems = [
              {
                label: t("traits.source"),
                value: book !== "—" ? `${book} p.${page}` : "—",
              },
            ];

            if (parry !== null) {
              detailItems.push({
                label: t("traits.parry"),
                value: String(parry),
              });
            }

            if (isEligible) {
              detailItems.push({
                label: t("traits.actions"),
                value: String(actions),
              });
              detailItems.push({
                label: t("traits.trainedWithMaster"),
                value: `<label class="checkbox-label">
                  <input
                    type="checkbox"
                    class="skill-master-checkbox"
                    data-id="${id}"
                    ${isMaster ? "checked" : ""}
                  />
                </label>`,
                rich: true,
              });
            }

            detailItems.push({
              label: t("traits.description"),
              value: desc,
              rich: true,
            });

            detailItems.push({
              label: t("traits.preDef"),
              value: preDef,
              rich: true,
            });

            return `
          <tr>
            <td>${name}</td>
            <td class="col-center">${attr}</td>
            <td class="col-center">${diff}</td>
            <td class="col-num">
              ${numStepper("skill-input", `data-id="${id}" data-field="base_value"`, base)}
            </td>
            <td class="col-num">
              ${numStepper("skill-input", `data-id="${id}" data-field="modifier"`, mod)}
            </td>
            <td class="col-num"><strong>${final}</strong></td>
            <td class="col-action">
              <button class="btn-remove remove-skill" data-id="${id}">✕</button>
            </td>
          </tr>
          ${detailRow(7, detailItems)}`;
          })
          .join("");

  setHTML(
    "skillList",
    `
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("traits.name")}</th>
          <th class="col-center">${t("traits.attr")}</th>
          <th class="col-center">${t("traits.diff")}</th>
          <th class="col-num">${t("traits.base")}</th>
          <th class="col-num">${t("traits.mod")}</th>
          <th class="col-num">${t("traits.final")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table></div>
  `,
  );
}

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

// Magic Aptitude (ADV-063 → ADV-065): whether the column is shown, and each
// spell's bonus, are read straight from engine output (state.sheet) — the
// engine is the single source of truth for this value, it is never
// recomputed here.
const MAGIC_APTITUDE_ADVANTAGE_IDS = ["ADV-063", "ADV-064", "ADV-065"];

function hasMagicAptitude(sheet) {
  const advantages = sheet?.character?.advantages ?? {};
  return MAGIC_APTITUDE_ADVANTAGE_IDS.some((id) => advantages[id]);
}

function getAptitudeLevelForSpell(sheet, name) {
  const grimoire = sheet?.grimoire ?? {};
  const entry = Object.values(grimoire).find(
    (g) => normalize(g.name) === normalize(name),
  );
  return entry?.aptitude_level ?? 0;
}

export function renderSpells(selected, data, sheet) {
  const entries = Object.entries(selected.spells);
  const showAptitude = hasMagicAptitude(sheet);
  const COLS = showAptitude ? 8 : 7;

  const rows =
    entries.length === 0
      ? emptyRow(COLS + 1)
      : entries
          .map(([name, spellState]) => {
            const base = spellState.base_value ?? 0;
            const mod = spellState.modifier ?? 0;
            const aptitude = showAptitude
              ? getAptitudeLevelForSpell(sheet, name)
              : 0;
            const final = base + mod + aptitude;
            const tier = getSpellTier(final);

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

            return `
          <tr>
            <td>${name}</td>
            <td>${school}</td>
            <td class="col-center">${diff}</td>
            <td class="col-center">${tier}</td>
            <td class="col-num">
              ${numStepper("spell-input", `data-name="${name}" data-field="base_value"`, base)}
            </td>
            <td class="col-num">
              ${numStepper("spell-input", `data-name="${name}" data-field="modifier"`, mod)}
            </td>
            ${showAptitude ? `<td class="col-num">${aptitude}</td>` : ""}
            <td class="col-num"><strong>${final}</strong></td>
            <td class="col-action">
              <button class="btn-remove remove-spell" data-name="${name}">✕</button>
            </td>
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
          <th class="col-num">${t("traits.final")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table></div>
  `,
  );
}
