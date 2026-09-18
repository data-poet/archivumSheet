// Builds an ally catalog file from whatever character is currently being edited.
//
// An ally IS a character — same attributes, same traits, same gear — so this reuses the sheet's
// own persisted payload rather than inventing a shape. The differences are only at the edges:
// the heavy base64 portrait becomes a path, and the file is named so it can be dropped straight
// into data/allies/.

import { capturePersistedSheet } from "./persistedSheet.js";

const PORTRAIT_DIR = "/images/allies";
const COMBINING_MARKS = /[̀-ͯ]/g;

// Accents are stripped rather than escaped because the slug becomes both a filename and an id:
// "Elemental de Água" → "elemental-de-agua".
export function slugify(name) {
  return String(name ?? "")
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function allyIdFor(name, date = new Date()) {
  const slug = slugify(name) || "aliado";
  // Same YYYY-MM-DD the character export uses. A catalog file is renamed to ally-0001-<slug>
  // by hand on commit, and that counter is what tells a repo ally from a user-created one.
  const day = date.toISOString().slice(0, 10);

  return `ally-${day}-${slug}`;
}

// The framing (scale / position / background) is kept while `data` is dropped: it is what makes
// the saved PNG sit in the frame it was arranged in on the sheet. See portrait.js's _layoutOf.
//
// `image.path` mirrors the top-level `portrait` deliberately: the catalog index reads the
// top-level key, the sheet's renderers read the image block, and both are written here from the
// same id so they cannot disagree within a file.
function _detachPortrait(pc = {}, portrait) {
  const { image = {}, ...rest } = pc;

  return {
    ...rest,
    image: { ...image, uploaded: false, data: "", path: portrait },
  };
}

export function buildAllyFile(name, date = new Date()) {
  const sheet = capturePersistedSheet();
  const allyId = allyIdFor(name, date);
  const portrait = `${PORTRAIT_DIR}/${allyId}.png`;

  return {
    allyId,
    filename: `${allyId}.json`,
    // No `exportedAt`: a catalog file is content, and a timestamp changing on every re-export
    // would be noise in the diff.
    payload: {
      version: sheet.version,
      portrait,
      pc: _detachPortrait(sheet.pc, portrait),
      race: sheet.race,
      character: sheet.character,
      inventory: sheet.inventory,
    },
  };
}

// Recognises a file this module wrote, so re-importing an ally reopens it as a draft and the
// edit → re-export round trip needs no manual step.
//
// `portrait` is the marker because only an ally file has it: capturePersistedSheet() never
// produces one and the character export adds only `exportedAt`. Deliberately a positive test —
// a file that is merely missing `exportedAt` (hand-written, hand-edited, from an older build)
// stays a character, which is the safe direction.
export function isAllyFile(payload) {
  return typeof payload?.portrait === "string" && payload.portrait !== "";
}
