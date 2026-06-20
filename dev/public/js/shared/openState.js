/**
 * openState.js
 *
 * Shared helpers for snapshotting and restoring the open/closed state of
 * <details> elements and the horizontal scroll position of .table-wrapper
 * elements before and after a DOM re-render.
 *
 * Two strategies are supported for keyFn:
 *
 *  1. tableRowKeyFn(keyAttr)
 *     For tbody-based lists where the key lives on the data-row preceding
 *     each .detail-row.  Uses `data-instance-id` or `data-id` / `data-name`.
 *
 *  2. divBlockKeyFn(keyAttr)
 *     For div-based equipped-slot layouts where each block has a
 *     data-instance-id (or similar) on a parent element and the
 *     .equipped-detail > details sits directly below it.
 *
 * For full-page re-renders (e.g. runEngine → renderLists), use the lower-level
 * snapshotAll / restoreAll pair to snapshot every managed container at once,
 * call renderLists, then restore in a rAF.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Internal: per-container snapshot helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All container IDs managed by renderLists that may contain .table-wrapper
 * elements or <details> rows the user can open.
 *
 * Kept here as the single source of truth so snapshotAll / restoreAll and
 * withOpenState all operate on the same set.
 */
const MANAGED_CONTAINER_IDS = [
  "advList",
  "disList",
  "skillList",
  "spellList",
  "armorSlots",
  "armorStorageList",
  "shieldSlot",
  "shieldStorageList",
  "meleeSlots",
  "meleeStorageList",
  "rangedSlots",
  "rangedStorageList",
  "ammoContainerList",
  "looseAmmoList",
  "alchemyList",
  "survivalGearList",
  "customInventoryList",
  "coinPurseList",
];

/**
 * Snapshot open <details> keys and .table-wrapper scroll positions for a
 * single container element.
 *
 * @param {Element}  container
 * @param {Function} keyFn      - (detailsEl) => string|null
 * @returns {{ open: Set<string>, scrollPositions: number[] }}
 */
function _snapshotContainer(container, keyFn) {
  const open = new Set();
  container.querySelectorAll("details[open]").forEach((d) => {
    const key = keyFn(d);
    if (key) open.add(key);
  });

  const scrollPositions = Array.from(
    container.querySelectorAll(".table-wrapper")
  ).map((w) => w.scrollLeft);

  return { open, scrollPositions };
}

/**
 * Restore open <details> and .table-wrapper scroll positions for a single
 * container element, using a previously captured snapshot.
 *
 * @param {Element}  container
 * @param {Function} keyFn
 * @param {{ open: Set<string>, scrollPositions: number[] }} snapshot
 */
function _restoreContainer(container, keyFn, { open, scrollPositions }) {
  if (open.size > 0) {
    container.querySelectorAll("details").forEach((d) => {
      const key = keyFn(d);
      if (key && open.has(key)) d.setAttribute("open", "");
    });
  }

  if (scrollPositions.some((s) => s > 0)) {
    container.querySelectorAll(".table-wrapper").forEach((w, i) => {
      if (scrollPositions[i]) w.scrollLeft = scrollPositions[i];
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: single-scope helper (used by event handlers)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Snapshot open <details> and .table-wrapper scroll positions inside `scope`,
 * call renderFn, then restore both in a rAF (after browser reflow).
 *
 * @param {string}   scope    - CSS selector for the container to search
 * @param {Function} keyFn   - (detailsEl) => string|null key
 * @param {Function} renderFn - callback that performs the re-render
 */
export function withOpenState(scope, keyFn, renderFn) {
  const container = document.querySelector(scope);
  if (!container) { renderFn(); return; }

  const snapshot = _snapshotContainer(container, keyFn);

  renderFn();

  // Defer restore to after browser reflow caused by innerHTML replacement.
  requestAnimationFrame(() => {
    _restoreContainer(container, keyFn, snapshot);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: multi-container snapshot/restore (used by runEngine → renderLists)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Snapshot all managed containers at once, before a full renderLists call.
 * Returns an opaque token to pass to restoreAll.
 *
 * keyFn defaults to a generic key that covers table-row and div-block patterns.
 *
 * @returns {Map<string, { open: Set<string>, scrollPositions: number[] }>}
 */
export function snapshotAll() {
  const snapshots = new Map();

  MANAGED_CONTAINER_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    snapshots.set(id, _snapshotContainer(el, _genericKeyFn));
  });

  return snapshots;
}

/**
 * Restore all managed containers from a snapshot taken by snapshotAll.
 * Must be called inside a requestAnimationFrame (caller's responsibility).
 *
 * @param {Map<string, { open: Set<string>, scrollPositions: number[] }>} snapshots
 */
export function restoreAll(snapshots) {
  snapshots.forEach(({ open, scrollPositions }, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    _restoreContainer(el, _genericKeyFn, { open, scrollPositions });
  });
}

/**
 * Generic keyFn that tries both table-row and div-block patterns.
 * Covers all renderLists containers without needing per-container config.
 *
 * Priority: data-instance-id → data-id → data-name (table-row),
 * then div-block equipped-detail pattern.
 */
function _genericKeyFn(detailsEl) {
  // ── Table row pattern ─────────────────────────────────────────────────────
  const row = detailsEl.closest("tr");
  if (row) {
    const prev = row.previousElementSibling;
    if (prev) {
      for (const attr of ["data-instance-id", "data-id", "data-name", "data-ammo-id"]) {
        const val =
          prev.getAttribute(attr) ||
          prev.querySelector(`[${attr}]`)?.getAttribute(attr);
        if (val) {
          // For ammo detail rows, compose a namespaced key with the container
          if (attr === "data-ammo-id") {
            const instanceId =
              prev.getAttribute("data-instance-id") ||
              prev.querySelector("[data-instance-id]")?.getAttribute("data-instance-id") ||
              "";
            return `${instanceId}:${val}`;
          }
          return val;
        }
      }
    }
  }

  // ── Div-block pattern (equipped slots) ────────────────────────────────────
  const block = detailsEl.closest(".equipped-detail");
  if (block) {
    const slotGrid = block.previousElementSibling;
    if (slotGrid) {
      const val =
        slotGrid.getAttribute("data-instance-id") ||
        slotGrid.querySelector("[data-instance-id]")?.getAttribute("data-instance-id") ||
        slotGrid.getAttribute("data-slot") ||
        slotGrid.querySelector("[data-slot]")?.getAttribute("data-slot");
      if (val) return val;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built key functions (kept for backward compat with existing callers)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Key function for table-based detail rows.
 * The <details> lives in a .detail-row <tr>; the key is on the previous <tr>.
 *
 * @param {string} keyAttr  - e.g. "data-instance-id" | "data-id" | "data-name"
 */
export function tableRowKeyFn(keyAttr) {
  return (detailsEl) => {
    const row = detailsEl.closest("tr");
    if (!row) return null;
    const prevRow = row.previousElementSibling;
    if (!prevRow) return null;
    return (
      prevRow.getAttribute(keyAttr) ||
      prevRow.querySelector(`[${keyAttr}]`)?.getAttribute(keyAttr) ||
      null
    );
  };
}

/**
 * Key function for div-based equipped-detail blocks.
 * The <details> lives inside .equipped-detail; the instance key is on a
 * sibling .equipped-slot-grid or a child element of the parent wrapper.
 *
 * @param {string} keyAttr  - e.g. "data-instance-id"
 */
export function divBlockKeyFn(keyAttr) {
  return (detailsEl) => {
    const block = detailsEl.closest(".equipped-detail");
    if (!block) return null;
    const slotGrid = block.previousElementSibling;
    if (!slotGrid) return null;
    return (
      slotGrid.getAttribute(keyAttr) ||
      slotGrid.querySelector(`[${keyAttr}]`)?.getAttribute(keyAttr) ||
      null
    );
  };
}

/**
 * Key function for ammo container slots.
 * Composed key = containerInstanceId + ":" + ammoId on previous data-row.
 */
export function ammoDetailKeyFn(detailsEl) {
  const row = detailsEl.closest("tr");
  if (row) {
    const prev = row.previousElementSibling;
    if (prev) {
      const ammoId =
        prev.querySelector("[data-ammo-id]")?.getAttribute("data-ammo-id") ||
        prev.getAttribute("data-ammo-id");
      const instanceId =
        prev.querySelector("[data-instance-id]")?.getAttribute("data-instance-id") ||
        prev.getAttribute("data-instance-id");
      if (ammoId) return `${instanceId ?? ""}:${ammoId}`;
    }
  }
  return null;
}
