import { t } from "../../localization/pt-BR.js";
import { setHTML } from "../../shared/dom.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const COIN_TYPES     = ["copper", "silver", "gold"];
const STORAGE_LOCS   = ["backpack", "stash", "camp"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function coinLabel(coinType) {
  return t(`coinPurse.${coinType}`);
}

function storageLabel(loc) {
  return t(`storage.${loc}`);
}

/** Location <select> for moving a coin stack. */
function locationSelect(coinType, currentLocation) {
  const options = STORAGE_LOCS.map((loc) => {
    const selected = loc === currentLocation ? "selected" : "";
    return `<option value="${loc}" ${selected}>${storageLabel(loc)}</option>`;
  }).join("");

  return `
    <select
      class="coin-location-select"
      data-coin-type="${coinType}"
      data-stored-at="${currentLocation}"
    >
      ${options}
    </select>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION RENDERER
// ─────────────────────────────────────────────────────────────────────────────

function renderCoinSection(location, coins, sheet) {
  const entries = coins.filter((c) => c.storedAt === location);

  let bodyRows = "";

  if (entries.length === 0) {
    bodyRows = `<tr class="empty-row"><td colspan="5">${t("common.empty")}</td></tr>`;
  } else {
    bodyRows = entries
      .map((entry) => {
        const bucket   = sheet?.inventory?.coinPurse?.[location] ?? [];
        const resolved = bucket.find((e) => e.coin_type === entry.coin_type);
        const totalWeight = resolved?.total_weight ?? "—";
        const totalValue  = resolved?.total_value  ?? "—";

        return `
          <tr>
            <td>${coinLabel(entry.coin_type)}</td>
            <td class="col-num">
              <div class="num-stepper">
                <input
                  type="text"
                  inputmode="numeric"
                  class="coin-qty"
                  data-coin-type="${entry.coin_type}"
                  data-stored-at="${location}"
                  value="${entry.quantity}"
                  style="width:55px"
                />
                <div class="stepper-btns">
                  <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
                  <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
                </div>
              </div>
            </td>
            <td class="col-num">${totalWeight}</td>
            <td class="col-num">${totalValue}</td>
            <td class="col-action">
              ${locationSelect(entry.coin_type, location)}
              <button
                class="btn-remove remove-coin"
                data-coin-type="${entry.coin_type}"
                data-stored-at="${location}"
              >✕</button>
            </td>
          </tr>`;
      })
      .join("");
  }

  return `
    <div class="storage-section-header">${storageLabel(location)}</div>
    <div class="table-wrapper"><table>
      <thead>
        <tr>
          <th>${t("common.type")}</th>
          <th class="col-num">${t("coinPurse.qty")}</th>
          <th class="col-num">${t("coinPurse.weight")}</th>
          <th class="col-num">${t("coinPurse.value")}</th>
          <th class="col-action">${t("common.storage")}</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table></div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD FORM
// ─────────────────────────────────────────────────────────────────────────────

function renderAddForm() {
  const coinOptions = COIN_TYPES.map(
    (ct) => `<option value="${ct}">${coinLabel(ct)}</option>`,
  ).join("");

  const locationOptions = STORAGE_LOCS.map(
    (loc) => `<option value="${loc}">${storageLabel(loc)}</option>`,
  ).join("");

  return `
    <div class="add-form">
      <select id="coinTypeSelect">
        <option value="">${t("coinPurse.selectCoinType")}</option>
        ${coinOptions}
      </select>
      <input
        type="text"
        inputmode="numeric"
        id="coinQtyInput"
        placeholder="${t("coinPurse.qty")}"
        style="width:60px"
      />
      <select id="coinLocationSelect">
        ${locationOptions}
      </select>
      <button id="addCoinBtn">${t("coinPurse.addCoins")}</button>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function renderCoinPurse(selected, data, sheet) {
  const coins = selected.coins ?? [];

  const sections = STORAGE_LOCS.map((loc) =>
    renderCoinSection(loc, coins, sheet),
  ).join("");

  setHTML(
    "coinPurseList",
    `${renderAddForm()}${sections}`,
  );
}
