import { setHTML } from "../../../shared/dom.js";
import { t } from "../../../localization/pt-BR/index.js";
import { emptyRow, cardTitleCell } from "../../../shared/renderUtils.js";

// Mirrors traits/render.js's advantages/disadvantages tables, minus cost/type/description —
// a meta-race row has none of those, just a name and a remove action.
export function renderMetaRaces(selected, data) {
  const ids = selected.meta_race_ids ?? [];

  const rows =
    ids.length === 0
      ? emptyRow(2)
      : ids
          .map((id) => {
            const row = (data.metaRaces || []).find(
              (m) => m.meta_race_id === id,
            );
            const name = row?.meta_race_sub_name
              ? `${row.meta_race_name} — ${row.meta_race_sub_name}`
              : (row?.meta_race_name ?? id);

            return `
          <tr data-id="${id}">
            ${cardTitleCell(name)}
            <td class="col-action"><button class="btn-remove remove-meta-race" data-id="${id}">✕</button></td>
          </tr>`;
          })
          .join("");

  setHTML(
    "metaRaceList",
    `
    <div class="table-wrapper table-wrapper--stack"><table>
      <thead>
        <tr>
          <th>${t("traits.name")}</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table></div>
  `,
  );
}
