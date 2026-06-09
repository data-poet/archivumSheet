import { setHTML } from "../../shared/dom.js";
import { t } from "../../localization/pt-BR.js";
import { formatRichText, detailRow } from "./renderUtils.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyRow(colspan) {
  return `<tr class="empty-row"><td colspan="${colspan}">—</td></tr>`;
}

// ===== ADVANTAGES =====

export function renderAdvantages(selected, data, sheet) {
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
            { label: t("traits.source"), value: book !== "—" ? `${book} p.${page}` : "—" },
            { label: t("traits.description"), value: desc, rich: true },
          ])}`;
          })
          .join("");

  setHTML("advList", `
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("traits.name")}</th>
          <th class="col-num">${t("traits.cost")}</th>
          <th>${t("traits.type")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table></div>
  `);
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
            const dis = data.disadvantages?.find((d) => d.disadvantage_id === id);
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
            { label: t("traits.source"), value: book !== "—" ? `${book} p.${page}` : "—" },
            { label: t("traits.description"), value: desc, rich: true },
          ])}`;
          })
          .join("");

  setHTML("disList", `
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("traits.name")}</th>
          <th class="col-num">${t("traits.cost")}</th>
          <th>${t("traits.type")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table></div>
  `);
}
