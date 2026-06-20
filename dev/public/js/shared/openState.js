/**
 * openState.js
 *
 * Shared helpers for snapshotting and restoring the open/closed state of
 * <details> elements and the horizontal scroll position of .table-wrapper
 * elements before and after a DOM re-render.
 *
 * Two strategies are supported:
 *
 *  1. withTableOpenState(containerSelector, keyAttr, renderFn)
 *     For tbody-based lists where the key lives on the data-row preceding
 *     each .detail-row.  Uses `data-instance-id` or `data-id` / `data-name`.
 *
 *  2. withDivOpenState(containerSelector, keyAttr, renderFn)
 *     For div-based equipped-slot layouts where each block has a
 *     data-instance-id (or similar) on a parent element and the
 *     .equipped-detail > details sits directly below it.
 *
 *  3. withContainerOpenState(containerSelector, keyFn, renderFn)
 *     Generic version — caller supplies a function that extracts a key
 *     string from a <details> element.
 */

/**
 * Snapshot all open <details> and .table-wrapper scroll positions inside
 * `scope`, then render, then restore both.
 *
 * Scroll positions are indexed by DOM order so nested wrappers (e.g. ammo
 * containers) are handled correctly without needing extra keys.
 *
 * @param {string}   scope     - CSS selector for the container to search
 * @param {Function} keyFn     - (detailsEl) => string|null key
 * @param {Function} renderFn  - callback that performs the re-render
 */
export function withOpenState(scope, keyFn, renderFn) {
  const container = document.querySelector(scope);
  if (!container) { renderFn(); return; }

  // Snapshot: collect keys of currently-open <details>
  const open = new Set();
  container.querySelectorAll("details[open]").forEach((d) => {
    const key = keyFn(d);
    if (key) open.add(key);
  });

  // Snapshot: collect scrollLeft of every .table-wrapper by index
  const scrollPositions = Array.from(
    container.querySelectorAll(".table-wrapper")
  ).map((w) => w.scrollLeft);

  renderFn();

  // Restore after reflow: rAF ensures the browser has finished laying out
  // the new DOM before we write back open state and scroll positions.
  // Without this, a synchronous restore is overwritten by the browser's
  // post-innerHTML reflow triggered by the stepper button click.
  requestAnimationFrame(() => {
    // Restore: re-open matching <details>
    if (open.size > 0) {
      container.querySelectorAll("details").forEach((d) => {
        const key = keyFn(d);
        if (key && open.has(key)) d.setAttribute("open", "");
      });
    }

    // Restore: scroll positions by index
    if (scrollPositions.some((s) => s > 0)) {
      container.querySelectorAll(".table-wrapper").forEach((w, i) => {
        if (scrollPositions[i]) w.scrollLeft = scrollPositions[i];
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built key functions
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
    // The key may be on the row itself or on a child element
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
    // Walk up to find the equipped-detail div, then look at its prev sibling
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
 * The <details> for inner ammo rows lives inside .ammo-container-body;
 * the container key is data-instance-id on a sibling .equipped-slot-grid.
 * Composed key = containerInstanceId + ":" + ammoId on previous data-row.
 */
export function ammoDetailKeyFn(detailsEl) {
  // Try table row approach first (loose ammo / container contents detail rows)
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
