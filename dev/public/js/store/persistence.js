import { state } from "../state.js";
import { getPrimaryAttributes } from "../engine/attributes.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { resetInstanceCounters } from "./instanceId.js";
import { restoreRaceSelection } from "../character/races.js";

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA VERSION
// Bump this if the shape of the export JSON ever changes in a breaking way.
// ─────────────────────────────────────────────────────────────────────────────
const SCHEMA_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// A lightweight in-app notification — no alert() blocking the UI.
// ─────────────────────────────────────────────────────────────────────────────

export function showToast(message, type = "success") {
  // Remove any existing toast
  document.getElementById("_archivum-toast")?.remove();

  const toast = document.createElement("div");
  toast.id = "_archivum-toast";

  const colors = {
    success: { bg: "#22c55e", icon: "✓" },
    error:   { bg: "#ef4444", icon: "✕" },
    info:    { bg: "#3b82f6", icon: "ℹ" },
  };
  const { bg, icon } = colors[type] ?? colors.info;

  Object.assign(toast.style, {
    position:     "fixed",
    bottom:       "76px",   // above mobile bottom nav
    left:         "50%",
    transform:    "translateX(-50%)",
    background:   bg,
    color:        "#fff",
    padding:      "10px 18px",
    borderRadius: "8px",
    fontSize:     "14px",
    fontWeight:   "600",
    boxShadow:    "0 4px 12px rgba(0,0,0,0.2)",
    zIndex:       "9999",
    display:      "flex",
    alignItems:   "center",
    gap:          "8px",
    whiteSpace:   "nowrap",
    maxWidth:     "calc(100vw - 32px)",
    opacity:      "0",
    transition:   "opacity 0.2s ease",
    pointerEvents:"none",
  });

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => { toast.style.opacity = "1"; });

  // Fade out after 3 s
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serialize current sheet state to JSON and trigger a browser download.
 * Filename: archivum_<CharacterName>_<date>.json  (spaces → underscores)
 */
export function exportSheet() {
  const { selected, sheet } = state;

  const payload = {
    version:    SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    pc:         sheet?.pc ?? selected.character,
    race:       sheet?.race ?? {},
    character: {
      primary:        getPrimaryAttributes(),
      secondary:      selected.secondary,
      damage:         selected.damage,
      advantages:     selected.advantages,
      disadvantages:  selected.disadvantages,
      skills:         selected.skills,
      spells:         selected.spells,
    },
    inventory: {
      weight:         Number(document.getElementById("weight")?.value) || 0,
      armors:         selected.armors,
      shields:        selected.shields,
      melee_weapons:  selected.melee_weapons,
      ranged_weapons: selected.ranged_weapons,
      ammo_containers: selected.ammo_containers,
      loose_ammo:     selected.loose_ammo,
      alchemy:        selected.alchemy,
      survivalGear:   selected.survivalGear,
      customInventory: selected.customInventory,
    },
  };

  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    // Build a descriptive filename
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
    const filename = `archivum_${characterName}_${date}.json`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);

    showToast(`Ficha exportada: ${filename}`, "success");
  } catch (err) {
    showToast(`Erro ao exportar: ${err.message}`, "error");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read a JSON file chosen by the user and hydrate the sheet state from it.
 * Shows a toast on success or failure — no alert() calls.
 *
 * @param {File} file
 * @returns {Promise<void>}
 */
export function importSheet(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error("Nenhum arquivo selecionado.")); return; }

    // Validate file type before reading
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

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — apply a validated payload to state + DOM
// ─────────────────────────────────────────────────────────────────────────────

function _applyImport(payload) {
  if (!payload?.version || !payload?.character || !payload?.inventory) {
    throw new Error("Arquivo inválido — campos obrigatórios ausentes.");
  }

  const { selected, data } = state;
  const { pc, race, character, inventory } = payload;

  // ── PC info ───────────────────────────────────────────────────────────────
  selected.character = {
    player_name:       pc?.player_name       ?? "",
    character_name:    pc?.character_name    ?? "",
    character_sex:     pc?.character_sex     ?? "",
    character_age:     pc?.character_age     ?? null,
    character_weight:  pc?.character_weight  ?? null,
    race_id:           race?.race_id         ?? null,
    starting_points:   pc?.starting_points   ?? null,
    experience_points: pc?.experience_points ?? null,
  };

  // ── PC info → DOM inputs ──────────────────────────────────────────────────
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

  // ── Weight → DOM input ────────────────────────────────────────────────────
  const weightEl = document.getElementById("weight");
  if (weightEl) weightEl.value = inventory.weight ?? 0;

  // ── Reset instance ID counters so imported IDs don't clash ────────────────
  resetInstanceCounters();

  // ── Hydrate selected state ────────────────────────────────────────────────
  selected.secondary      = character.secondary      ?? {};
  selected.damage         = character.damage         ?? {};
  selected.advantages     = character.advantages     ?? {};
  selected.disadvantages  = character.disadvantages  ?? {};
  selected.skills         = character.skills         ?? {};
  selected.spells         = character.spells         ?? {};
  selected.armors         = inventory.armors         ?? [];
  selected.shields        = inventory.shields        ?? [];
  selected.melee_weapons  = inventory.melee_weapons  ?? [];
  selected.ranged_weapons = inventory.ranged_weapons ?? [];
  selected.ammo_containers = inventory.ammo_containers ?? [];
  selected.loose_ammo     = inventory.loose_ammo     ?? [];
  selected.alchemy        = inventory.alchemy        ?? [];
  selected.survivalGear   = inventory.survivalGear   ?? [];
  selected.customInventory = inventory.customInventory ?? [];

  // ── Re-render lists and recalculate ───────────────────────────────────────
  renderLists(selected, data);
  triggerAutoRun();
}
