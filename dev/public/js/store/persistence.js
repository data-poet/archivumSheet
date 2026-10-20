import { state } from "../state.js";
import { capturePersistedSheet } from "./persistedSheet.js";
import { buildAllyFile } from "./allies/allyExport.js";
import { getActiveCharacterId } from "./characters.js";
import { getLinkedAllies } from "./allies/characterLinking.js";
import { loadStore } from "./characterStoreCore.js";
import { showToast } from "../shared/toast.js";

// A linked local ally is another row in this same browser's store, keyed by an id that only
// means something here — the file has to carry its full data so importing elsewhere (or later,
// once the ids may already be reused) can recreate it under a fresh id (see
// characterLinking.js's recreateLinkedAllies()).
function _linkedAlliesPayload() {
  const characterId = getActiveCharacterId();
  const linked = getLinkedAllies(characterId);
  if (linked.length === 0) return undefined;

  const store = loadStore();
  const entries = linked
    .map((r) => [r.ally_id, store?.list.find((c) => c.id === r.ally_id)?.data])
    .filter(([, data]) => data);

  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function exportSheet() {
  const { selected, sheet } = state;

  const linked_allies = _linkedAlliesPayload();
  const payload = {
    ...capturePersistedSheet(),
    ...(linked_allies ? { linked_allies } : {}),
    exportedAt: new Date().toISOString(),
  };

  const characterName =
    (
      sheet?.pc?.character_name ||
      selected.character?.character_name ||
      "personagem"
    )
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-áéíóúâêîôûãõàèìòùçÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌÒÙÇ]/g, "") ||
    "personagem";

  const date = new Date().toISOString().slice(0, 10);

  _downloadJSON(
    payload,
    `archivum_${characterName}_${date}.json`,
    "Ficha exportada",
  );
}

// Writes the active sheet as an ally catalog file, ready to drop into data/allies/. The
// portrait is saved beside it as a PNG of the same name — see store/allies/allyExport.js.
export function exportAllySheet() {
  const { selected, sheet } = state;
  const name =
    sheet?.pc?.character_name || selected.character?.character_name || "";

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
