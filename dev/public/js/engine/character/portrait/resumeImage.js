// Split out of portrait.js on purpose: portrait.js imports compute/autorun.js for its
// editor-side handlers, and the allies page's import graph is guarded against ever
// reaching compute/* (see tests/dev/allies/main.test.js) since it shares the resume
// renderer with the sheet page. This file stays a leaf so both pages can use it.

import { state } from "../../../state.js";
import { escapeAttr } from "../../../shared/renderUtils.js";

function _img() {
  return state.selected.character.image;
}

// Used only when nothing framed the portrait at all — centred at natural size.
const DEFAULT_IMAGE_LAYOUT = { scale: 100, position: { x: 50, y: 50 } };

// `color` is optional-chained because a hand-edited ally file can declare "average" without it.
function _bgColor(img) {
  if (img?.background === "black") return "rgb(0,0,0)";
  if (img?.background === "white") return "rgb(255,255,255)";
  if (img?.background === "average" && img.color)
    return `rgb(${img.color.r},${img.color.g},${img.color.b})`;
  return "";
}

// An ally exported from the sheet keeps the framing it was given there but drops the base64
// blob (which would bloat a committed catalog file), so scale/position/background arrive
// without `data`. Treat them as framing whenever they are present, whatever the src is.
function _layoutOf(image) {
  const scale = image?.scale;
  const x = image?.position?.x;
  const y = image?.position?.y;
  const framed =
    scale !== undefined && scale !== "" && x !== undefined && x !== "";

  return framed ? { scale, position: { x, y } } : DEFAULT_IMAGE_LAYOUT;
}

// Resolves what to actually show. `path` is how a portrait that lives on disk rather than in
// the sheet travels: an ally file carries the framing but not the pixels, so re-importing one
// to edit still renders it. Optional everywhere — an image object without `path` behaves
// exactly as before.
function _srcOf(image, fallbackSrc = "") {
  if (image?.uploaded && image.data) return image.data;
  return image?.path || fallbackSrc;
}

// Called from components/resume/index.js after renderResumeHeader(). `image` defaults to
// the active character's; other sheets (a catalog ally) pass their own, plus fallbackSrc
// when the portrait ships as a file path rather than uploaded base64.
export function renderResumeImage(image = _img(), fallbackSrc = "") {
  const container = document.getElementById("resume-charimg-wrapper");
  if (!container) return;

  const src = _srcOf(image, fallbackSrc);

  if (!src) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  const layout = _layoutOf(image);
  const background = image ? _bgColor(image) : "";

  // Every interpolation is escaped because an imported sheet's JSON supplies these
  // verbatim — a quote in image.data would otherwise break out of the src attribute.
  // escapeAttr leaves valid numbers and empty strings untouched.
  container.innerHTML = `
    <div class="resume-charimg-frame" id="resume-charimg-bg" style="background-color:${escapeAttr(background)}">
      <img
        id="resume-charimg-img"
        class="resume-charimg-img"
        src="${escapeAttr(src)}"
        style="width:${escapeAttr(layout.scale)}%; left:${escapeAttr(layout.position.x)}%; top:${escapeAttr(layout.position.y)}%;"
        alt=""
      />
    </div>
  `;
}
