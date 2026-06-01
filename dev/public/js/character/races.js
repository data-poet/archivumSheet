import { state } from "../state.js";
import { fetchRaces } from "../api.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { t } from "../localization/pt-BR.js";

const data = state.data;
const selected = state.selected;

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadRaces() {
  if (data.races.length) {
    _showRaceSelects();
    return;
  }

  data.races = await fetchRaces();

  _populateRaceNameSelect();
  _showRaceSelects();

  // Restore selection if state already has a race_id (e.g. after import)
  if (selected.character.race_id) {
    restoreRaceSelection(selected.character.race_id);
  }
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function _populateRaceNameSelect() {
  const nameSelect = document.getElementById("raceNameSelect");
  if (!nameSelect) return;

  const raceNames = [...new Set(data.races.map((r) => r.race_name))].sort();

  nameSelect.innerHTML = `<option value="">${t("character.selectRace")}</option>`;
  raceNames.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    nameSelect.appendChild(opt);
  });
}

export function filterSubRacesByName() {
  const raceName = document.getElementById("raceNameSelect").value;
  const subSelect = document.getElementById("raceSubSelect");

  selected.character.race_id = null;

  if (!raceName) {
    subSelect.style.display = "none";
    subSelect.innerHTML = `<option value="">${t("character.selectSubRace")}</option>`;
    updateRaceModifiers();
    triggerAutoRun();
    return;
  }

  const subRows = data.races.filter((r) => r.race_name === raceName);

  subSelect.innerHTML =
    `<option value="">${t("character.selectSubRace")}</option>` +
    subRows
      .map(
        (r) =>
          `<option value="${r.race_id}">${_esc(r.race_sub_name || r.race_name)}</option>`,
      )
      .join("");

  subSelect.style.display = "";

  // Auto-select if only one sub-race
  if (subRows.length === 1) {
    subSelect.value = subRows[0].race_id;
    selectSubRace();
  }
}

export function selectSubRace() {
  const raceId = document.getElementById("raceSubSelect").value;
  selected.character.race_id = raceId || null;
  updateRaceModifiers();
  triggerAutoRun();
}

// ─── Modifiers display ────────────────────────────────────────────────────────

export function updateRaceModifiers() {
  const container = document.getElementById("raceModifiers");
  if (!container) return;

  const raceId = selected.character.race_id;
  if (!raceId) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  const row = data.races.find((r) => r.race_id === raceId);
  if (!row) return;

  const mods = [
    { label: "ST", value: Number(row.race_st_modifier) || 0 },
    { label: "DX", value: Number(row.race_dx_modifier) || 0 },
    { label: "IQ", value: Number(row.race_iq_modifier) || 0 },
    { label: "HT", value: Number(row.race_ht_modifier) || 0 },
  ].filter((m) => m.value !== 0);

  if (!mods.length) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  const modTags = mods
    .map(
      (m) =>
        `<span class="race-mod-tag">${m.label} ${m.value > 0 ? "+" : ""}${m.value}</span>`,
    )
    .join("");

  container.innerHTML = `<em>${t("character.raceModifiers")}:</em> ${modTags}`;
  container.style.display = "";
}

// ─── Hydrate (called by persistence after import) ─────────────────────────────

export function restoreRaceSelection(raceId) {
  const row = data.races.find((r) => r.race_id === raceId);
  if (!row) return;

  const nameSelect = document.getElementById("raceNameSelect");
  const subSelect = document.getElementById("raceSubSelect");
  if (!nameSelect || !subSelect) return;

  nameSelect.value = row.race_name;

  const subRows = data.races.filter((r) => r.race_name === row.race_name);
  subSelect.innerHTML =
    `<option value="">${t("character.selectSubRace")}</option>` +
    subRows
      .map(
        (r) =>
          `<option value="${r.race_id}">${_esc(r.race_sub_name || r.race_name)}</option>`,
      )
      .join("");
  subSelect.value = raceId;
  subSelect.style.display = "";

  updateRaceModifiers();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _showRaceSelects() {
  const btn = document.getElementById("loadRacesBtn");
  const nameSelect = document.getElementById("raceNameSelect");
  if (btn) btn.style.display = "none";
  if (nameSelect) nameSelect.style.display = "";
}

function _esc(str) {
  return String(str ?? "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
