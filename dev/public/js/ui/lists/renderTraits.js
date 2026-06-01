import { setHTML } from "../../shared/dom.js";
import { t } from "../../localization/pt-BR.js";
import { formatRichText, detailRow } from "./renderUtils.js";

// ===== HELPERS =====

function emptyRow(colspan) {
  return `<tr class="empty-row"><td colspan="${colspan}">—</td></tr>`;
}

// ===== ADVANTAGES =====
export function renderAdvantages(selected, data, sheet) {
  // Read from sheet if available (engine is source of truth), fall back to selected
  const advMap = sheet?.character?.advantages ?? selected.advantages;
  const ids = Object.keys(advMap);

  const rows =
    ids.length === 0
      ? emptyRow(4)
      : ids
          .map((id) => {
            const adv = data.advantages?.find((a) => a.advantage_id === id);
            const sheetEntry = advMap[id];
            const name = adv?.advantage_box_name ?? sheetEntry?.name ?? id;
            const isInnate = sheetEntry?.is_race_innate ?? false;
            const cost = isInnate ? 0 : (adv?.advantage_cost ?? "—");
            const type = adv?.advantage_type ?? "—";
            const book = adv?.advantage_source_book ?? "—";
            const page = adv?.advantage_source_page ?? "—";
            const desc = formatRichText(adv?.advantage_description);

            const innateTag = isInnate
              ? `<span class="trait-innate-tag">${t("character.innate")}</span>`
              : "";
            const actionCell = isInnate
              ? `<td class="col-action"></td>`
              : `<td class="col-action"><button class="btn-remove remove-adv" data-id="${id}">✕</button></td>`;

            return `
          <tr ${isInnate ? 'class="trait-innate"' : ""}>
            <td>${name}${innateTag}</td>
            <td class="col-num">${cost}</td>
            <td>${type}</td>
            ${actionCell}
          </tr>
          ${detailRow(4, [
            {
              label: t("traits.source"),
              value: book !== "—" ? `${book} p.${page}` : "—",
            },
            { label: t("traits.description"), value: desc, rich: true },
          ])}`;
          })
          .join("");

  setHTML(
    "advList",
    `
    <table>
      <thead>
        <tr>
          <th>${t("traits.name")}</th>
          <th class="col-num">${t("traits.cost")}</th>
          <th>${t("traits.type")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `,
  );
}

// ===== DISADVANTAGES =====
export function renderDisadvantages(selected, data, sheet) {
  const disMap = sheet?.character?.disadvantages ?? selected.disadvantages;
  const ids = Object.keys(disMap);

  const rows =
    ids.length === 0
      ? emptyRow(4)
      : ids
          .map((id) => {
            const dis = data.disadvantages?.find(
              (d) => d.disadvantage_id === id,
            );
            const sheetEntry = disMap[id];
            const name = dis?.disadvantage_box_name ?? sheetEntry?.name ?? id;
            const isInnate = sheetEntry?.is_race_innate ?? false;
            const cost = isInnate ? 0 : (dis?.disadvantage_cost ?? "—");
            const type = dis?.disadvantage_type ?? "—";
            const book = dis?.disadvantage_source_book ?? "—";
            const page = dis?.disadvantage_source_page ?? "—";
            const desc = formatRichText(dis?.disadvantage_description);

            const innateTag = isInnate
              ? `<span class="trait-innate-tag">${t("character.innate")}</span>`
              : "";
            const actionCell = isInnate
              ? `<td class="col-action"></td>`
              : `<td class="col-action"><button class="btn-remove remove-dis" data-id="${id}">✕</button></td>`;

            return `
          <tr ${isInnate ? 'class="trait-innate"' : ""}>
            <td>${name}${innateTag}</td>
            <td class="col-num">${cost}</td>
            <td>${type}</td>
            ${actionCell}
          </tr>
          ${detailRow(4, [
            {
              label: t("traits.source"),
              value: book !== "—" ? `${book} p.${page}` : "—",
            },
            { label: t("traits.description"), value: desc, rich: true },
          ])}`;
          })
          .join("");

  setHTML(
    "disList",
    `
    <table>
      <thead>
        <tr>
          <th>${t("traits.name")}</th>
          <th class="col-num">${t("traits.cost")}</th>
          <th>${t("traits.type")}</th>
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
            const book = skill?.skill_source_book ?? "—";
            const page = skill?.skill_source_page ?? "—";
            const desc = formatRichText(skill?.skill_description);
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
          </tr>
          ${detailRow(7, [
            {
              label: t("traits.source"),
              value: book !== "—" ? `${book} p.${page}` : "—",
            },
            { label: t("traits.description"), value: desc, rich: true },
          ])}`;
          })
          .join("");

  setHTML(
    "skillList",
    `
    <table>
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
    </table>
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

export function renderSpells(selected, data) {
  const entries = Object.entries(selected.spells);
  const COLS = 7;

  const rows =
    entries.length === 0
      ? emptyRow(COLS + 1)
      : entries
          .map(([name, spellState]) => {
            const base = spellState.base_value ?? 0;
            const mod = spellState.modifier ?? 0;
            const final = base + mod;
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
              <input type="number" class="spell-input" data-name="${name}" data-field="base_value" value="${base}" />
            </td>
            <td class="col-num">
              <input type="number" class="spell-input" data-name="${name}" data-field="modifier" value="${mod}" />
            </td>
            <td class="col-num"><strong>${final}</strong></td>
            <td class="col-action">
              <button class="btn-remove remove-spell" data-name="${name}">✕</button>
            </td>
          </tr>
          <tr class="detail-row spell-detail-row">
            <td colspan="${COLS + 1}">
              <details>
                <summary>${t("common.details")}</summary>
                <div class="spell-detail-grid">
                  <span class="spell-detail"><em>${t("traits.spellType")}:</em> ${type}</span>
                  <span class="spell-detail"><em>${t("traits.spellCost")}:</em> ${cost}</span>
                  <span class="spell-detail"><em>${t("traits.cast")}:</em> ${castTime}</span>
                  <span class="spell-detail"><em>${t("traits.target")}:</em> ${target}</span>
                  <span class="spell-detail"><em>${t("traits.range")}:</em> ${range}</span>
                  <span class="spell-detail"><em>${t("traits.area")}:</em> ${area}</span>
                  <span class="spell-detail"><em>${t("traits.duration")}:</em> ${duration}</span>
                  ${scaling !== "—" ? `<div class="spell-detail-block"><em>${t("traits.scaling")}:</em>${scaling}</div>` : `<span class="spell-detail"><em>${t("traits.scaling")}:</em> —</span>`}
                  ${desc !== "—" ? `<div class="spell-detail-block"><em>${t("traits.description")}:</em>${desc}</div>` : ""}
                  ${obs !== "—" ? `<div class="spell-detail-block"><em>${t("traits.observation")}:</em>${obs}</div>` : ""}
                </div>
              </details>
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
          <th>${t("traits.name")}</th>
          <th>${t("traits.school")}</th>
          <th class="col-center">${t("traits.diff")}</th>
          <th class="col-center">${t("traits.tier")}</th>
          <th class="col-num">${t("traits.base")}</th>
          <th class="col-num">${t("traits.mod")}</th>
          <th class="col-num">${t("traits.final")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `,
  );
}
