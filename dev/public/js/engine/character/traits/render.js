import { icon } from "../../../shared/icons.js";
import { el } from "../../../shared/dom.js";
import { morphHTML } from "../../../shared/morph.js";
import { t } from "../../../localization/pt-BR/index.js";
import {
  formatRichText,
  detailRow,
  cardTitleCell,
  safeId,
} from "../../../shared/renderUtils.js";
import { dragHandleHTML } from "../../inventory/shared/inventoryRenderUtils.js";
import { sortByOrder } from "../../../shared/traitOrder.js";

function emptyRow(colspan) {
  return `<tr class="empty-row"><td colspan="${colspan}">—</td></tr>`;
}

export function renderAdvantages(selected, data, sheet) {
  const advMap = sheet?.character?.advantages ?? selected.advantages;
  const ids = sortByOrder(Object.keys(advMap), selected.order?.advantages);

  const rows =
    ids.length === 0
      ? emptyRow(5)
      : ids
          .map((id) => {
            const adv = data.advantages?.find((a) => a.advantage_id === id);
            const sheetEntry = advMap[id];
            const name = adv?.advantage_box_name ?? sheetEntry?.name ?? id;
            const isInnate = sheetEntry?.is_race_innate ?? false;
            const isMetaRace = sheetEntry?.is_meta_race ?? false;
            const isEnchantment = sheetEntry?.is_enchantment ?? false;
            const isFixed = isInnate || isMetaRace || isEnchantment;
            const cost = isFixed ? 0 : (adv?.advantage_cost ?? "—");
            const type = adv?.advantage_type ?? "—";
            const book = adv?.advantage_source_book ?? "—";
            const page = adv?.advantage_source_page ?? "—";
            const desc = formatRichText(adv?.advantage_description);

            const innateTag = isInnate
              ? `<span class="trait-innate-tag">${t("character.innate")}</span>`
              : "";
            const metaRaceTag = isMetaRace
              ? `<span class="trait-meta-race-tag">${t("character.metaRace")}</span>`
              : "";
            const enchantmentTag = isEnchantment
              ? `<span class="trait-enchantment-tag">${t("character.enchanted")}</span>`
              : "";
            // Item-granted entries have nothing to remove, same as innate — and nothing to drag.
            const actionCell = isFixed
              ? `<td class="col-action"></td>`
              : `<td class="col-action"><button class="btn-remove remove-adv" data-id="${id}">${icon("remove")}</button></td>`;
            const dragCell = isFixed
              ? `<td class="col-drag"></td>`
              : `<td class="col-drag" data-label="${t("common.dragHandle")}">${dragHandleHTML()}</td>`;

            return `
          <tr id="adv-${safeId(id)}" class="${isInnate ? "trait-innate" : isMetaRace ? "trait-meta-race" : isEnchantment ? "trait-enchantment" : ""}" data-id="${id}">
            ${dragCell}
            ${cardTitleCell(`${name}${innateTag}${metaRaceTag}${enchantmentTag}`)}
            <td class="col-num" data-label="${t("traits.cost")}">${cost}</td>
            <td data-label="${t("traits.type")}">${type}</td>
            ${actionCell}
          </tr>
          ${detailRow(
            5,
            [
              {
                label: t("traits.source"),
                value: book !== "—" ? `${book} p.${page}` : "—",
              },
              { label: t("traits.description"), value: desc, rich: true },
            ],
            `adv-${safeId(id)}`,
          )}`;
          })
          .join("");

  morphHTML(
    el("advList"),
    `
    <div class="table-wrapper table-wrapper--stack"><table>
      <thead>
        <tr>
          <th class="col-drag"></th>
          <th>${t("traits.name")}</th>
          <th class="col-num">${t("traits.cost")}</th>
          <th>${t("traits.type")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody id="adv-tbody">${rows}</tbody>
    </table></div>
  `,
  );
}

export function renderDisadvantages(selected, data, sheet) {
  const disMap = sheet?.character?.disadvantages ?? selected.disadvantages;
  const ids = sortByOrder(Object.keys(disMap), selected.order?.disadvantages);

  const rows =
    ids.length === 0
      ? emptyRow(5)
      : ids
          .map((id) => {
            const dis = data.disadvantages?.find(
              (d) => d.disadvantage_id === id,
            );
            const sheetEntry = disMap[id];
            const name = dis?.disadvantage_box_name ?? sheetEntry?.name ?? id;
            const isInnate = sheetEntry?.is_race_innate ?? false;
            const isMetaRace = sheetEntry?.is_meta_race ?? false;
            const isEnchantment = sheetEntry?.is_enchantment ?? false;
            const isFixed = isInnate || isMetaRace || isEnchantment;
            const cost = isFixed ? 0 : (dis?.disadvantage_cost ?? "—");
            const type = dis?.disadvantage_type ?? "—";
            const book = dis?.disadvantage_source_book ?? "—";
            const page = dis?.disadvantage_source_page ?? "—";
            const desc = formatRichText(dis?.disadvantage_description);

            const innateTag = isInnate
              ? `<span class="trait-innate-tag">${t("character.innate")}</span>`
              : "";
            const metaRaceTag = isMetaRace
              ? `<span class="trait-meta-race-tag">${t("character.metaRace")}</span>`
              : "";
            const enchantmentTag = isEnchantment
              ? `<span class="trait-enchantment-tag">${t("character.enchanted")}</span>`
              : "";
            const actionCell = isFixed
              ? `<td class="col-action"></td>`
              : `<td class="col-action"><button class="btn-remove remove-dis" data-id="${id}">${icon("remove")}</button></td>`;
            const dragCell = isFixed
              ? `<td class="col-drag"></td>`
              : `<td class="col-drag" data-label="${t("common.dragHandle")}">${dragHandleHTML()}</td>`;

            return `
          <tr id="dis-${safeId(id)}" class="${isInnate ? "trait-innate" : isMetaRace ? "trait-meta-race" : isEnchantment ? "trait-enchantment" : ""}" data-id="${id}">
            ${dragCell}
            ${cardTitleCell(`${name}${innateTag}${metaRaceTag}${enchantmentTag}`)}
            <td class="col-num" data-label="${t("traits.cost")}">${cost}</td>
            <td data-label="${t("traits.type")}">${type}</td>
            ${actionCell}
          </tr>
          ${detailRow(
            5,
            [
              {
                label: t("traits.source"),
                value: book !== "—" ? `${book} p.${page}` : "—",
              },
              { label: t("traits.description"), value: desc, rich: true },
            ],
            `dis-${safeId(id)}`,
          )}`;
          })
          .join("");

  morphHTML(
    el("disList"),
    `
    <div class="table-wrapper table-wrapper--stack"><table>
      <thead>
        <tr>
          <th class="col-drag"></th>
          <th>${t("traits.name")}</th>
          <th class="col-num">${t("traits.cost")}</th>
          <th>${t("traits.type")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody id="dis-tbody">${rows}</tbody>
    </table></div>
  `,
  );
}
