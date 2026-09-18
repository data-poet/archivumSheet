import { state } from "../state.js";
import { capturePersistedSheet } from "./persistedSheet.js";
import { buildAllyFile } from "./allyExport.js";
import { renderListsPreserving } from "../ui.js";
import { triggerAutoRun } from "../compute/autorun.js";
import { resetInstanceCounters } from "./instanceId.js";
import { restoreRaceSelection } from "../engine/character/races/model.js";
import { renderCharacterImage, renderResumeImage } from "../engine/character/portrait/portrait.js";

const TOAST_ICONS = { success: "✓", error: "✕", info: "ℹ" };

export function showToast(message, type = "success", options = {}) {
  document.getElementById("_archivum-toast")?.remove();

  const { actionLabel, onAction, duration = 3000 } = options;
  const icon = TOAST_ICONS[type] ?? TOAST_ICONS.info;

  const toast = document.createElement("div");
  toast.id = "_archivum-toast";
  toast.className = `toast toast--${type}`;

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${message}</span>
    ${actionLabel ? `<button type="button" class="toast-action">${actionLabel}</button>` : ""}
  `;
  // A live region only announces mutations it was already present for, so the toast goes into the
  // persistent #toast-host rather than straight into <body>.
  const host = document.getElementById("toast-host");
  if (host) {
    host.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  }
  (host ?? document.body).appendChild(toast);

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.remove("is-visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  };

  if (actionLabel && onAction) {
    toast.querySelector(".toast-action")?.addEventListener("click", () => {
      onAction();
      dismiss();
    });
  }

  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(dismiss, duration);
}

export function exportSheet() {
  const { selected, sheet } = state;

  const payload = {
    ...capturePersistedSheet(),
    exportedAt: new Date().toISOString(),
  };

  const characterName = (
    sheet?.pc?.character_name ||
    selected.character?.character_name ||
    "personagem"
  )
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-áéíóúâêîôûãõàèìòùçÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ]/g, "")
    || "personagem";

  const date = new Date().toISOString().slice(0, 10);

  _downloadJSON(payload, `archivum_${characterName}_${date}.json`, "Ficha exportada");
}

// Writes the active sheet as an ally catalog file, ready to drop into data/allies/. The
// portrait is saved beside it as a PNG of the same name — see store/allyExport.js.
export function exportAllySheet() {
  const { selected, sheet } = state;
  const name = sheet?.pc?.character_name || selected.character?.character_name || "";

  const { filename, payload } = buildAllyFile(name);

  _downloadJSON(payload, filename, "Aliado exportado");
}

function _downloadJSON(payload, filename, successLabel) {
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);

    showToast(`${successLabel}: ${filename}`, "success");
  } catch (err) {
    showToast(`Erro ao exportar: ${err.message}`, "error");
  }
}

export function importSheet(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error("Nenhum arquivo selecionado.")); return; }

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      const err = new Error("O arquivo deve ser um .json exportado pelo Archivum.");
      showToast(err.message, "error");
      reject(err);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);
        _applyImport(payload);

        const charName =
          payload?.pc?.character_name ||
          payload?.character?.name ||
          "Desconhecido";
        showToast(`Ficha de "${charName}" importada com sucesso.`, "success");
        resolve();
      } catch (err) {
        showToast(`Erro ao importar: ${err.message}`, "error");
        reject(err);
      }
    };

    reader.onerror = () => {
      const err = new Error("Não foi possível ler o arquivo.");
      showToast(err.message, "error");
      reject(err);
    };

    reader.readAsText(file);
  });
}

function _applyImport(payload) {
  if (!payload?.version || !payload?.character || !payload?.inventory) {
    throw new Error("Arquivo inválido — campos obrigatórios ausentes.");
  }

  const { selected, data } = state;
  const { pc, race, character, inventory } = payload;

  selected.character = {
    player_name:       pc?.player_name       ?? "",
    character_name:    pc?.character_name    ?? "",
    character_sex:     pc?.character_sex     ?? "",
    character_age:     pc?.character_age     ?? null,
    character_weight:  pc?.character_weight  ?? null,
    race_id:           race?.race_id         ?? null,
    starting_points:   pc?.starting_points   ?? null,
    experience_points: pc?.experience_points ?? null,
    ability_points:    pc?.ability_points    ?? null,
    magic_points:      pc?.magic_points      ?? null,
    image: pc?.image ?? {
      uploaded:    false,
      data:        "",
      background:  "",
      color:       { r: "", g: "", b: "" },
      orientation: "",
      position:    { x: "", y: "" },
      size:        { width: "", height: "" },
      scale:       "",
    },
  };

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v ?? "";
  };
  setVal("playerNameInput",       selected.character.player_name);
  setVal("characterNameInput",    selected.character.character_name);
  setVal("characterSexSelect",    selected.character.character_sex);
  setVal("characterAgeInput",     selected.character.character_age);
  setVal("characterWeightInput",  selected.character.character_weight);
  setVal("startingPointsInput",   selected.character.starting_points);
  setVal("experiencePointsInput", selected.character.experience_points);
  setVal("abilityPointsInput",    selected.character.ability_points);
  setVal("magicPointsInput",      selected.character.magic_points);

  if (selected.character.race_id && state.data.races.length) {
    restoreRaceSelection(selected.character.race_id);
  }

  ["ST", "DX", "IQ", "HT"].forEach((attr) => {
    const src = character.primary?.[attr];
    if (!src) return;
    const base = document.getElementById(`${attr}_base`);
    const mod  = document.getElementById(`${attr}_mod`);
    if (base) base.value = src.base_value ?? 10;
    if (mod)  mod.value  = src.modifier   ?? 0;
  });

  const weightEl = document.getElementById("weight");
  if (weightEl) weightEl.value = inventory.weight ?? 0;

  resetInstanceCounters();

  selected.secondary      = character.secondary      ?? {};
  selected.damage         = character.damage         ?? {};
  selected.resistances    = character.resistances    ?? {};
  selected.advantages     = character.advantages     ?? {};
  selected.disadvantages  = character.disadvantages  ?? {};
  selected.skills         = character.skills         ?? {};
  selected.spells         = character.spells         ?? {};
  selected.armors         = inventory.armors         ?? [];
  selected.shields        = inventory.shields        ?? [];
  selected.melee_weapons  = inventory.melee_weapons  ?? [];
  selected.ranged_weapons = inventory.ranged_weapons ?? [];
  selected.firearms       = inventory.firearms       ?? [];
  selected.ammo_containers = inventory.ammo_containers ?? [];
  selected.loose_ammo     = inventory.loose_ammo     ?? [];
  selected.alchemy        = inventory.alchemy        ?? [];
  selected.survivalGear   = inventory.survivalGear   ?? [];
  selected.accessories    = inventory.accessories    ?? [];
  selected.magicGear      = inventory.magicGear      ?? [];
  selected.customInventory = inventory.customInventory ?? [];
  selected.coins          = inventory.coins          ?? [];

  renderListsPreserving(selected, data);
  renderCharacterImage();
  renderResumeImage();
  triggerAutoRun();
}
