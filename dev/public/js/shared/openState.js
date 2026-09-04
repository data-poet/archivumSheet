// Snapshots/restores open <details> state and .table-wrapper scroll position around a DOM
// re-render. keyFn is either tableRowKeyFn (tbody lists, key on the row preceding .detail-row)
// or divBlockKeyFn (equipped-slot divs, key on the block preceding .equipped-detail). For
// full-page re-renders (runEngine → renderLists), use snapshotAll/restoreAll instead.

// Without data-detail-kind, sibling blocks for the same instance (e.g. "stats" + "customize"
// panels) would collapse onto the same key, forcing all open together on next re-render.
function _withDetailKind(detailsEl, key) {
  if (!key) return null;
  const kind = detailsEl.dataset.detailKind;
  return kind ? `${key}:${kind}` : key;
}

// Single source of truth for which containers snapshotAll/restoreAll and withOpenState operate on.
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
  "accessorySlots",
  "accessoryStorageList",
  "magicGearSlots",
  "magicGearStorageList",
  "customInventoryList",
  "coinPurseList",
];

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

// renderFn is deferred by one rAF because it's called from native <select>/<input> "change"
// handlers — replacing the DOM ancestor of the still-mid-event element before some browsers
// (mobile Safari) finish closing the native option picker causes a visible flicker/scroll jump.
//
// The restore step must NOT be deferred to a second rAF: fresh <details> markup never carries
// `open`, so a later-frame restore paints the rebuilt DOM collapsed first, then open next frame
// — a visible flash. setAttribute("open")/scrollTo take effect synchronously, so restoring in
// the same task as renderFn ensures the browser only ever paints the final, correct state.
export function withOpenState(scope, keyFn, renderFn) {
  const container = document.querySelector(scope);
  if (!container) {
    requestAnimationFrame(renderFn);
    return;
  }

  const snapshot = _snapshotContainer(container, keyFn);
  const scrollY = window.scrollY;

  requestAnimationFrame(() => {
    renderFn();
    _restoreContainer(container, keyFn, snapshot);
    if (window.scrollY !== scrollY) window.scrollTo(0, scrollY);
  });
}

export function snapshotAll() {
  const snapshots = new Map();

  MANAGED_CONTAINER_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    snapshots.set(id, _snapshotContainer(el, _genericKeyFn));
  });

  return snapshots;
}

// Call synchronously right after renderLists(), not inside a later rAF — see withOpenState's
// comment for why a deferred restore causes a visible collapse-then-reopen flash.
export function restoreAll(snapshots) {
  snapshots.forEach(({ open, scrollPositions }, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    _restoreContainer(el, _genericKeyFn, { open, scrollPositions });
  });
}

// Covers all renderLists containers (table-row + div-block patterns) without per-container config.
function _genericKeyFn(detailsEl) {
  // Walk back through preceding <tr> siblings, not just the immediate one — a data row may be
  // followed by several sibling .detail-row rows (e.g. stats + customize), so the row carrying
  // the instance key may not be directly adjacent to this particular detail row.
  const row = detailsEl.closest("tr");
  if (row) {
    let prev = row.previousElementSibling;
    while (prev) {
      for (const attr of ["data-instance-id", "data-id", "data-name", "data-ammo-id", "data-custom-item-id"]) {
        const val =
          prev.getAttribute(attr) ||
          prev.querySelector(`[${attr}]`)?.getAttribute(attr);
        if (val) {
          if (attr === "data-ammo-id") {
            const instanceId =
              prev.getAttribute("data-instance-id") ||
              prev.querySelector("[data-instance-id]")?.getAttribute("data-instance-id") ||
              "";
            return _withDetailKind(detailsEl, `${instanceId}:${val}`);
          }
          return _withDetailKind(detailsEl, val);
        }
      }
      if (!prev.classList.contains("detail-row")) break;
      prev = prev.previousElementSibling;
    }
  }

  // Same reasoning as above: an equipped slot may render several sibling .equipped-detail
  // blocks, so walk back through preceding siblings rather than just the immediate one.
  const block = detailsEl.closest(".equipped-detail");
  if (block) {
    let sibling = block.previousElementSibling;
    while (sibling) {
      const val =
        sibling.getAttribute("data-instance-id") ||
        sibling.querySelector("[data-instance-id]")?.getAttribute("data-instance-id") ||
        sibling.getAttribute("data-slot") ||
        sibling.querySelector("[data-slot]")?.getAttribute("data-slot");
      if (val) return _withDetailKind(detailsEl, val);
      sibling = sibling.previousElementSibling;
    }
  }

  return null;
}

// Kept for backward compat with existing callers; _genericKeyFn covers renderLists containers.
export function tableRowKeyFn(keyAttr) {
  return (detailsEl) => {
    const row = detailsEl.closest("tr");
    if (!row) return null;
    let prevRow = row.previousElementSibling;
    while (prevRow) {
      const val =
        prevRow.getAttribute(keyAttr) ||
        prevRow.querySelector(`[${keyAttr}]`)?.getAttribute(keyAttr);
      if (val) return _withDetailKind(detailsEl, val);
      if (!prevRow.classList.contains("detail-row")) return null;
      prevRow = prevRow.previousElementSibling;
    }
    return null;
  };
}

export function divBlockKeyFn(keyAttr) {
  return (detailsEl) => {
    const block = detailsEl.closest(".equipped-detail");
    if (!block) return null;
    let sibling = block.previousElementSibling;
    while (sibling) {
      const val =
        sibling.getAttribute(keyAttr) ||
        sibling.querySelector(`[${keyAttr}]`)?.getAttribute(keyAttr);
      if (val) return _withDetailKind(detailsEl, val);
      sibling = sibling.previousElementSibling;
    }
    return null;
  };
}

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
