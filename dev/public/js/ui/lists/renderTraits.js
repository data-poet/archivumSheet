import { setHTML } from "../../shared/dom.js";

// ===== HELPERS =====

function emptyRow(colspan) {
  return `<tr class="empty-row"><td colspan="${colspan}">—</td></tr>`;
}

function formatRichText(raw) {
  if (!raw || raw.trim() === "") return "—";

  const lines = raw.split("\n").map((l) => l.trim());
  const bulletLines = lines.filter((l) => l.startsWith("-"));

  if (bulletLines.length === 0)
    return `<p class="scaling-note">${raw.trim()}</p>`;

  const items = bulletLines
    .map((l) => `<li>${l.slice(1).trim()}</li>`)
    .join("");
  const note = lines
    .filter((l) => l.length > 0 && !l.startsWith("-"))
    .join(" ");

  return `<ul class="scaling-list">${items}</ul>${note ? `<p class="scaling-note">${note}</p>` : ""}`;
}

function detailRow(colspan, fields) {
  const content = fields
    .filter(({ value }) => value && value !== "—")
    .map(({ label, value, rich }) =>
      rich
        ? `<div class="spell-detail-block"><em>${label}:</em>${value}</div>`
        : `<span class="spell-detail"><em>${label}:</em> ${value}</span>`,
    )
    .join("");

  if (!content) return "";

  return `
    <tr class="detail-row">
      <td colspan="${colspan}">
        <details>
          <summary>Details</summary>
          <div class="spell-detail-grid">${content}</div>
        </details>
      </td>
    </tr>`;
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
            const book = adv?.advantage_source_book ?? "—";
            const page = adv?.advantage_source_page ?? "—";
            const desc = formatRichText(adv?.advantage_description);

            return `
          <tr>
            <td>${name}</td>
            <td class="col-num">${cost}</td>
            <td>${type}</td>
            <td class="col-action">
              <button class="btn-remove remove-adv" data-id="${id}">✕</button>
            </td>
          </tr>
          ${detailRow(4, [
            {
              label: "Source",
              value: book !== "—" ? `${book} p.${page}` : "—",
            },
            { label: "Description", value: desc, rich: true },
          ])}`;
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
            const book = dis?.disadvantage_source_book ?? "—";
            const page = dis?.disadvantage_source_page ?? "—";
            const desc = formatRichText(dis?.disadvantage_description);

            return `
          <tr>
            <td>${name}</td>
            <td class="col-num">${cost}</td>
            <td>${type}</td>
            <td class="col-action">
              <button class="btn-remove remove-dis" data-id="${id}">✕</button>
            </td>
          </tr>
          ${detailRow(4, [
            {
              label: "Source",
              value: book !== "—" ? `${book} p.${page}` : "—",
            },
            { label: "Description", value: desc, rich: true },
          ])}`;
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
              label: "Source",
              value: book !== "—" ? `${book} p.${page}` : "—",
            },
            { label: "Description", value: desc, rich: true },
          ])}`;
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
                <summary>Details</summary>
                <div class="spell-detail-grid">
                  <span class="spell-detail"><em>Type:</em> ${type}</span>
                  <span class="spell-detail"><em>Cost:</em> ${cost}</span>
                  <span class="spell-detail"><em>Cast:</em> ${castTime}</span>
                  <span class="spell-detail"><em>Target:</em> ${target}</span>
                  <span class="spell-detail"><em>Range:</em> ${range}</span>
                  <span class="spell-detail"><em>Area:</em> ${area}</span>
                  <span class="spell-detail"><em>Duration:</em> ${duration}</span>
                  ${scaling !== "—" ? `<div class="spell-detail-block"><em>Scaling:</em>${scaling}</div>` : `<span class="spell-detail"><em>Scaling:</em> —</span>`}
                  ${desc !== "—" ? `<div class="spell-detail-block"><em>Description:</em>${desc}</div>` : ""}
                  ${obs !== "—" ? `<div class="spell-detail-block"><em>Observation:</em>${obs}</div>` : ""}
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
          <th>Name</th>
          <th>School</th>
          <th class="col-center">Diff</th>
          <th class="col-center">Tier</th>
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
