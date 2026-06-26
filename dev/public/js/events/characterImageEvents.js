// events/characterImageEvents.js
// ─────────────────────────────────────────────────────────────────────────────
// Character portrait feature.
//
// State stored in state.selected.character.image:
//   { uploaded, data, background, color: {r,g,b},
//     orientation, position: {x,y}, size: {width,height}, scale }
//
// Edit UI:  #tab-char-image  (new tab in section-character)
// Resume:   #resume-char-image  (injected into .resume-row--name alongside name)
// ─────────────────────────────────────────────────────────────────────────────

import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";

// ── Internal helpers ──────────────────────────────────────────────────────────

function _img() {
  return state.selected.character.image;
}

function _setImg(patch) {
  Object.assign(state.selected.character.image, patch);
}

/** Compute average RGB of an image given its base64 data URL. */
function _averageColor(base64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 50; // sample at reduced size for speed
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
      resolve({
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
      });
    };
    img.onerror = () => resolve({ r: 0, g: 0, b: 0 });
    img.src = base64;
  });
}

/** Return CSS background-color string for a given background setting. */
function _bgColor(img) {
  if (img.background === "black")   return "rgb(0,0,0)";
  if (img.background === "white")   return "rgb(255,255,255)";
  if (img.background === "average") return `rgb(${img.color.r},${img.color.g},${img.color.b})`;
  return "";
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function _previewEl()   { return document.getElementById("charimg-preview"); }
function _imageEl()     { return document.getElementById("charimg-img"); }
function _bgEl()        { return document.getElementById("charimg-bg"); }
function _scaleInput()  { return document.getElementById("charimg-scale"); }

// ── Render helpers ────────────────────────────────────────────────────────────

/** Apply background color to both the edit preview and the resume portrait. */
function _applyBackground() {
  const img = _img();
  const color = _bgColor(img);
  const bgEl = _bgEl();
  if (bgEl) bgEl.style.backgroundColor = color;

  const resumeBg = document.getElementById("resume-charimg-bg");
  if (resumeBg) resumeBg.style.backgroundColor = color;
}

/** Apply scale (width %) to the draggable image element. */
function _applyScale(imgEl) {
  const img = _img();
  if (!imgEl) return;
  imgEl.style.width = img.scale + "%";
}

/** Apply left/top position to the draggable image element. */
function _applyPosition(imgEl) {
  const img = _img();
  if (!imgEl) return;
  imgEl.style.left = img.position.x + "%";
  imgEl.style.top  = img.position.y + "%";
}

/** Sync scale slider from state. */
function _syncScaleControls() {
  const scaleEl = _scaleInput();
  const scale   = _img().scale ?? 100;
  if (scaleEl) scaleEl.value = scale;
}

/** Update the radio button visual selection for background. */
function _syncBgRadios() {
  const bg = _img().background || "average";
  document.querySelectorAll(".charimg-radio-btn").forEach((r) => {
    r.classList.toggle("is-active", r.dataset.bg === bg);
  });
}

// ── Resume image render ───────────────────────────────────────────────────────

/**
 * Render (or clear) the portrait in the resume name row.
 * Called from resume.js after renderResumeHeader().
 */
export function renderResumeImage() {
  const container = document.getElementById("resume-charimg-wrapper");
  if (!container) return;

  const img = _img();
  if (!img?.uploaded) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  // Build inner HTML only once (avoid re-creating drag listeners)
  container.innerHTML = `
    <div class="resume-charimg-frame" id="resume-charimg-bg" style="background-color:${_bgColor(img)}">
      <img
        id="resume-charimg-img"
        class="resume-charimg-img"
        src="${img.data}"
        style="width:${img.scale}%; left:${img.position.x}%; top:${img.position.y}%;"
        alt=""
      />
    </div>
  `;
}

// ── Full editor render ────────────────────────────────────────────────────────

/**
 * Render the image tab panel content.
 * Called once from initCharacterImage() after the DOM is ready.
 * The panel HTML lives in index.html; this function wires the preview image.
 */
export function renderCharacterImage() {
  const img = _img();
  const previewEl = _previewEl();
  if (!previewEl) return;

  // Remove stale image element if any
  const old = _imageEl();
  if (old) old.remove();

  if (!img?.uploaded) {
    _syncScaleControls();
    _syncBgRadios();
    _applyBackground();
    return;
  }

  // Create image element
  const imgEl = document.createElement("img");
  imgEl.id = "charimg-img";
  imgEl.className = "charimg-img";
  imgEl.src = img.data;
  imgEl.alt = "";
  imgEl.style.width = img.scale + "%";
  imgEl.style.left  = img.position.x + "%";
  imgEl.style.top   = img.position.y + "%";
  previewEl.appendChild(imgEl);

  _applyBackground();
  _syncScaleControls();
  _syncBgRadios();
  _bindDrag(previewEl);
}

// ── Drag-to-reposition ────────────────────────────────────────────────────────

function _clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function _bindDrag(previewEl) {
  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  const onStart = (cx, cy) => {
    const imgEl = _imageEl();
    if (!imgEl) return;
    dragging = true;
    startX    = cx;
    startY    = cy;
    startLeft = parseFloat(imgEl.style.left) || 0;
    startTop  = parseFloat(imgEl.style.top)  || 0;
  };

  const onMove = (cx, cy) => {
    if (!dragging) return;
    const imgEl = _imageEl();
    if (!imgEl) return;
    const rect  = previewEl.getBoundingClientRect();
    const dx    = ((cx - startX) / rect.width)  * 100;
    const dy    = ((cy - startY) / rect.height) * 100;
    const newX  = _clamp(startLeft + dx, -100, 200);
    const newY  = _clamp(startTop  + dy, -100, 200);
    imgEl.style.left = newX + "%";
    imgEl.style.top  = newY + "%";
    _setImg({ position: { x: parseFloat(newX.toFixed(2)), y: parseFloat(newY.toFixed(2)) } });
  };

  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    triggerAutoRun();
  };

  // Mouse
  previewEl.addEventListener("mousedown",  (e) => { e.preventDefault(); onStart(e.clientX, e.clientY); });
  document.addEventListener("mousemove",   (e) => onMove(e.clientX, e.clientY));
  document.addEventListener("mouseup",     ()  => onEnd());
  // Touch
  previewEl.addEventListener("touchstart", (e) => { onStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  previewEl.addEventListener("touchmove",  (e) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  previewEl.addEventListener("touchend",   ()  => onEnd());
}

// ── File upload ───────────────────────────────────────────────────────────────

async function _loadFile(file) {
  // Type check
  if (!["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
    alert("Arquivo inválido. Use JPG, PNG, GIF ou WEBP.");
    return;
  }
  // Size check (1 MB)
  if (file.size > 1_000_000) {
    alert("Imagem muito grande. Tamanho máximo: 1 MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result;

    // Dimension check
    await new Promise((resolve) => {
      const tmp = new Image();
      tmp.onload = async () => {
        const w = tmp.naturalWidth;
        const h = tmp.naturalHeight;
        const orientation = w > h ? "landscape" : w < h ? "portrait" : "square";

        const color = await _averageColor(base64);

        _setImg({
          uploaded:    true,
          data:        base64,
          background:  "average",
          color,
          orientation,
          size:        { width: w, height: h },
          scale:       100,
          position:    { x: 50, y: 50 },
        });

        renderCharacterImage();
        renderResumeImage();
        triggerAutoRun();
        resolve();
      };
      tmp.src = base64;
    });
  };
  reader.readAsDataURL(file);
}

// ── Public event handlers ─────────────────────────────────────────────────────

export function handleCharacterImageClick(e) {
  // Background radio buttons
  const bgBtn = e.target.closest(".charimg-radio-btn");
  if (bgBtn) {
    const bg = bgBtn.dataset.bg;
    if (!bg) return false;
    _setImg({ background: bg });
    _applyBackground();
    _syncBgRadios();
    renderResumeImage();
    triggerAutoRun();
    return true;
  }

  // Size presets (cover / contain) — now shares .charimg-preset-btn with data-size
  const sizeBtn = e.target.closest(".charimg-preset-btn[data-size]");
  if (sizeBtn) {
    if (!_img().uploaded) return false;
    const preset  = sizeBtn.dataset.size;
    const imgEl   = _imageEl();
    const prevEl  = _previewEl();
    if (!imgEl || !prevEl) return false;

    const pr   = prevEl.getBoundingClientRect();
    const img  = _img();
    const { width: iw, height: ih } = img.size;
    let scale  = 100;

    if (preset === "cover") {
      if (img.orientation === "landscape") {
        scale = Math.round((pr.height / ((pr.width / iw) * ih)) * 100);
      }
    } else if (preset === "contain") {
      if (img.orientation === "portrait" || img.orientation === "square") {
        scale = Math.round((pr.height / ((pr.width / iw) * ih)) * 100);
      }
    }

    imgEl.style.width = scale + "%";
    imgEl.style.left  = "50%";
    imgEl.style.top   = "50%";
    _setImg({ scale, position: { x: 50, y: 50 } });
    _syncScaleControls();
    renderResumeImage();
    triggerAutoRun();
    return true;
  }

  // Position presets — .charimg-preset-btn with data-pos
  const posBtn = e.target.closest(".charimg-preset-btn[data-pos]");
  if (posBtn) {
    if (!_img().uploaded) return false;
    const preset = posBtn.dataset.pos;
    const imgEl  = _imageEl();
    const prevEl = _previewEl();
    if (!imgEl || !prevEl) return false;

    const pr = prevEl.getBoundingClientRect();
    const ir = imgEl.getBoundingClientRect();
    let x = parseFloat(imgEl.style.left) || 50;
    let y = parseFloat(imgEl.style.top)  || 50;

    if (preset === "center") { x = 50; y = 50; }
    else if (preset === "top")    { y = ((ir.height / 2) / pr.height) * 100; }
    else if (preset === "bottom") { y = ((pr.height - ir.height / 2) / pr.height) * 100; }
    else if (preset === "left")   { x = ((ir.width  / 2) / pr.width)  * 100; }
    else if (preset === "right")  { x = ((pr.width  - ir.width  / 2) / pr.width)  * 100; }

    x = parseFloat(x.toFixed(2));
    y = parseFloat(y.toFixed(2));

    imgEl.style.left = x + "%";
    imgEl.style.top  = y + "%";
    _setImg({ position: { x, y } });
    renderResumeImage();
    triggerAutoRun();
    return true;
  }

  // Clear button
  if (e.target.closest("#charimg-clear-btn")) {
    if (!_img().uploaded) return false;
    if (!confirm("Remover imagem do personagem?")) return true;
    _setImg({
      uploaded:    false,
      data:        "",
      background:  "",
      color:       { r: "", g: "", b: "" },
      orientation: "",
      position:    { x: "", y: "" },
      size:        { width: "", height: "" },
      scale:       "",
    });
    renderCharacterImage();
    renderResumeImage();
    triggerAutoRun();
    return true;
  }

  return false;
}

export function handleCharacterImageChange(e) {
  // File input
  if (e.target.id === "charimg-file-input") {
    const file = e.target.files?.[0];
    if (file) {
      _loadFile(file);
      e.target.value = ""; // reset so same file can be re-selected
    }
    return true;
  }
  return false;
}

export function handleCharacterImageInput(e) {
  // Scale slider
  if (e.target.id === "charimg-scale") {
    const scale  = parseInt(e.target.value, 10);
    const imgEl  = _imageEl();
    if (imgEl) imgEl.style.width = scale + "%";
    _setImg({ scale });
    renderResumeImage();
    triggerAutoRun();
    return true;
  }
  return false;
}

// ── Init ──────────────────────────────────────────────────────────────────────

/**
 * Call once from main.js after bindUI().
 * Renders the initial state if an image is already loaded (from persistence).
 */
export function initCharacterImage() {
  renderCharacterImage();
  renderResumeImage();
}
