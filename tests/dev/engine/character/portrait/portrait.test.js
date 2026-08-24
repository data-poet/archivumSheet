jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/store/persistence.js", () => ({
  showToast: jest.fn(),
}));
jest.mock("dev/public/js/components/dialog.js", () => ({
  showConfirm: jest.fn(),
}));

import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { showToast } from "dev/public/js/store/persistence.js";
import { showConfirm } from "dev/public/js/components/dialog.js";
import {
  renderResumeImage,
  renderCharacterImage,
  handleCharacterImageClick,
  handleCharacterImageChange,
  handleCharacterImageInput,
  initCharacterImage,
} from "dev/public/js/engine/character/portrait/portrait.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

// jsdom doesn't decode real images or implement canvas 2D context — mock
// both so the upload pipeline (dimension read + average-color sampling)
// can run deterministically. Confirmed via a scratch probe that firing
// onload synchronously on `.src =` assignment, combined with real
// FileReader (genuinely async in jsdom but resolves on its own), works
// with a short real-timer wait rather than fake timers.
class MockImage {
  constructor() {
    this.naturalWidth = 100;
    this.naturalHeight = 100;
  }
  set src(value) {
    this._src = value;
    if (this.onload) this.onload();
  }
  get src() {
    return this._src;
  }
}

function mockCanvasContext(pixel = [100, 150, 200, 255]) {
  jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(pixel) }),
  });
}

async function flush() {
  await new Promise((r) => setTimeout(r, 20));
}

const UPLOADED_IMAGE = {
  uploaded: true,
  data: "data:image/png;base64,xyz",
  background: "average",
  color: { r: 10, g: 20, b: 30 },
  orientation: "landscape",
  position: { x: 40, y: 60 },
  size: { width: 200, height: 100 },
  scale: 120,
};

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();
  global.Image = MockImage;
});

// ─────────────────────────────────────────────────────────────────────────
// renderResumeImage
// ─────────────────────────────────────────────────────────────────────────
describe("renderResumeImage", () => {
  test("no-ops when the resume container is missing", () => {
    resetDOM();
    expect(() => renderResumeImage()).not.toThrow();
  });

  test("hides the container when nothing is uploaded", () => {
    resetDOM(`<div id="resume-charimg-wrapper"></div>`);
    renderResumeImage();
    expect(document.getElementById("resume-charimg-wrapper").hidden).toBe(true);
  });

  test("renders the frame with correct src, scale, position, and background", () => {
    resetDOM(`<div id="resume-charimg-wrapper"></div>`);
    Object.assign(state.selected.character.image, UPLOADED_IMAGE);

    renderResumeImage();

    const wrapper = document.getElementById("resume-charimg-wrapper");
    expect(wrapper.hidden).toBe(false);
    const img = document.getElementById("resume-charimg-img");
    expect(img.src).toBe(UPLOADED_IMAGE.data);
    expect(img.style.width).toBe("120%");
    expect(img.style.left).toBe("40%");
    expect(img.style.top).toBe("60%");
    expect(
      document.getElementById("resume-charimg-bg").style.backgroundColor,
    ).toBe("rgb(10, 20, 30)");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// renderCharacterImage
// ─────────────────────────────────────────────────────────────────────────
describe("renderCharacterImage", () => {
  test("no-ops when the preview element is missing", () => {
    resetDOM();
    expect(() => renderCharacterImage()).not.toThrow();
  });

  test("when nothing is uploaded: syncs controls to the pristine (empty-string) defaults, creates no image element", () => {
    resetDOM(`
      <div id="charimg-preview"></div>
      <div id="charimg-bg"></div>
      <input id="charimg-scale" />
    `);

    renderCharacterImage();

    expect(document.getElementById("charimg-img")).toBeNull();
    // state.js's pristine image.scale is "" (empty string), not undefined —
    // `_img().scale ?? 100` only falls back for null/undefined, so the
    // empty string passes straight through. This is real, current
    // behavior, not a 100-default in practice for a freshly-reset character.
    expect(document.getElementById("charimg-scale").value).toBe("");
  });

  test("_syncScaleControls genuinely falls back to 100 when scale is null/undefined (not just empty string)", () => {
    resetDOM(`
      <div id="charimg-preview"></div>
      <div id="charimg-bg"></div>
      <input id="charimg-scale" />
    `);
    delete state.selected.character.image.scale;

    renderCharacterImage();

    expect(document.getElementById("charimg-scale").value).toBe("100");
  });

  test("when uploaded: creates the preview image with correct style and background", () => {
    resetDOM(`
      <div id="charimg-preview"></div>
      <div id="charimg-bg"></div>
      <input id="charimg-scale" />
    `);
    Object.assign(state.selected.character.image, UPLOADED_IMAGE);

    renderCharacterImage();

    const img = document.getElementById("charimg-img");
    expect(img.src).toBe(UPLOADED_IMAGE.data);
    expect(img.style.width).toBe("120%");
    expect(img.style.left).toBe("40%");
    expect(img.style.top).toBe("60%");
    expect(document.getElementById("charimg-scale").value).toBe("120");
    expect(document.getElementById("charimg-bg").style.backgroundColor).toBe(
      "rgb(10, 20, 30)",
    );
  });

  test("removes a stale preview image before rendering again", () => {
    resetDOM(`
      <div id="charimg-preview"><img id="charimg-img" /></div>
      <div id="charimg-bg"></div>
      <input id="charimg-scale" />
    `);
    const staleImg = document.getElementById("charimg-img");

    renderCharacterImage(); // nothing uploaded -> should remove stale, not recreate

    expect(document.body.contains(staleImg)).toBe(false);
    expect(document.getElementById("charimg-img")).toBeNull();
  });

  test("marks the matching background radio button active", () => {
    resetDOM(`
      <div id="charimg-preview"></div>
      <button class="charimg-radio-btn" data-bg="black"></button>
      <button class="charimg-radio-btn" data-bg="white"></button>
    `);
    state.selected.character.image.background = "white";

    renderCharacterImage();

    expect(
      document
        .querySelector('[data-bg="black"]')
        .classList.contains("is-active"),
    ).toBe(false);
    expect(
      document
        .querySelector('[data-bg="white"]')
        .classList.contains("is-active"),
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Drag-to-reposition (exercised via renderCharacterImage's _bindDrag)
// ─────────────────────────────────────────────────────────────────────────
describe("drag to reposition", () => {
  function setup() {
    resetDOM(`
      <div id="charimg-preview"></div>
      <div id="charimg-bg"></div>
      <input id="charimg-scale" />
    `);
    Object.assign(state.selected.character.image, UPLOADED_IMAGE, {
      position: { x: 50, y: 50 },
    });
    renderCharacterImage();
    const preview = document.getElementById("charimg-preview");
    jest.spyOn(preview, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
    });
    return preview;
  }

  // NOTE ON TEST STRUCTURE: _bindDrag() attaches its mousemove/mouseup
  // listeners to `document` itself (not to the preview element), and does
  // so freshly on every renderCharacterImage() call without ever removing
  // the previous set — see the dedicated bug-documentation test at the
  // bottom of this describe block. That means multiple tests in this file
  // calling setup() (-> renderCharacterImage() -> _bindDrag()) each leave
  // a listener on the shared `document` for the rest of the test file's
  // lifetime. Those stale listeners are harmless AS LONG AS each test's
  // gesture is fully completed with a mouseup — completing a gesture resets
  // that closure's `dragging` flag to false, making it a permanent no-op
  // for every later test. So: every test below that starts a mousedown
  // must end with a mouseup, even where the mouseup itself isn't the
  // point of that particular test.

  test("full gesture: live updates during move, ignores movement before mousedown, commits once on mouseup, ignores movement after", () => {
    const preview = setup();

    // Movement before any mousedown is ignored.
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 999,
        clientY: 999,
        bubbles: true,
      }),
    );
    expect(state.selected.character.image.position.x).toBe(50);

    preview.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 100, clientY: 50, bubbles: true }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 120, clientY: 50, bubbles: true }),
    );
    // dx = 20px over a 200px-wide preview = +10%
    expect(state.selected.character.image.position.x).toBe(60);
    expect(triggerAutoRun).not.toHaveBeenCalled(); // not yet — only on mouseup

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);

    // Movement after the gesture ended (mouseup) no longer moves anything.
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: 99999,
        clientY: 0,
        bubbles: true,
      }),
    );
    expect(state.selected.character.image.position.x).toBe(60);
  });

  test("clamps position to the [-100, 200] range", () => {
    const preview = setup();

    preview.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 0, clientY: 0, bubbles: true }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX: -10000,
        clientY: 0,
        bubbles: true,
      }),
    );
    expect(state.selected.character.image.position.x).toBe(-100);

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true })); // complete the gesture
  });

  test("[fixed] repeated renderCharacterImage() calls do NOT stack duplicate drag listeners", () => {
    // Previously, _bindDrag() ran again on every renderCharacterImage()
    // call — which itself re-runs after nearly every portrait interaction
    // (background change, size/position preset, upload, clear) — without
    // ever removing the prior set of document-level mousemove/mouseup
    // listeners. A user changing the background a few times before
    // dragging the image would get triggerAutoRun() fired once per
    // accumulated render, not once per drag. Fixed via an idempotency
    // guard (previewEl._dragBound) since previewEl is the same persistent
    // DOM node across renders. This test proves the fix holds even after
    // multiple renders, not just a single one.
    const preview = setup();
    renderCharacterImage(); // second render of the SAME previewEl
    renderCharacterImage(); // third, for good measure

    preview.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 0, clientY: 0, bubbles: true }),
    );
    document.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 10, clientY: 0, bubbles: true }),
    );
    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleCharacterImageClick — background
// ─────────────────────────────────────────────────────────────────────────
describe("handleCharacterImageClick — background radios", () => {
  test("sets the background and re-syncs UI", () => {
    resetDOM(`
      <button class="charimg-radio-btn" data-bg="black"></button>
      <div id="resume-charimg-wrapper"></div>
    `);
    const target = document.querySelector('[data-bg="black"]');

    const result = handleCharacterImageClick({ target });

    expect(result).toBe(true);
    expect(state.selected.character.image.background).toBe("black");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("returns false when the radio button has no data-bg", () => {
    resetDOM(`<button class="charimg-radio-btn"></button>`);
    const target = document.querySelector(".charimg-radio-btn");
    expect(handleCharacterImageClick({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleCharacterImageClick — size presets
// ─────────────────────────────────────────────────────────────────────────
describe("handleCharacterImageClick — size presets", () => {
  function setupPresetDOM() {
    resetDOM(`
      <div id="charimg-preview"></div>
      <img id="charimg-img" />
      <button class="charimg-preset-btn" data-size="cover"></button>
      <button class="charimg-preset-btn" data-size="contain"></button>
    `);
    jest
      .spyOn(
        document.getElementById("charimg-preview"),
        "getBoundingClientRect",
      )
      .mockReturnValue({ width: 200, height: 100 });
  }

  test("returns false (no-op) when nothing is uploaded", () => {
    setupPresetDOM();
    const target = document.querySelector('[data-size="cover"]');
    expect(handleCharacterImageClick({ target })).toBe(false);
  });

  test("'cover' computes a fill scale for a landscape image", () => {
    setupPresetDOM();
    Object.assign(state.selected.character.image, UPLOADED_IMAGE, {
      orientation: "landscape",
      size: { width: 200, height: 100 },
    });
    const target = document.querySelector('[data-size="cover"]');

    handleCharacterImageClick({ target });

    // scale = round(previewHeight / ((previewWidth/imgWidth) * imgHeight) * 100)
    // = round(100 / ((200/200) * 100) * 100) = 100
    expect(state.selected.character.image.scale).toBe(100);
    expect(state.selected.character.image.position).toEqual({ x: 50, y: 50 });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("'cover' leaves scale at 100 (branch not triggered) for a non-landscape image", () => {
    setupPresetDOM();
    Object.assign(state.selected.character.image, UPLOADED_IMAGE, {
      orientation: "portrait",
    });
    const target = document.querySelector('[data-size="cover"]');

    handleCharacterImageClick({ target });

    expect(state.selected.character.image.scale).toBe(100);
  });

  test("'contain' computes a fit scale for a portrait image", () => {
    setupPresetDOM();
    Object.assign(state.selected.character.image, UPLOADED_IMAGE, {
      orientation: "portrait",
      size: { width: 100, height: 200 },
    });
    const target = document.querySelector('[data-size="contain"]');

    handleCharacterImageClick({ target });

    // scale = round(100 / ((200/100) * 200) * 100) = round(100/400*100) = 25
    expect(state.selected.character.image.scale).toBe(25);
  });

  test("returns false when the preview or image element is missing", () => {
    resetDOM(`<button class="charimg-preset-btn" data-size="cover"></button>`);
    Object.assign(state.selected.character.image, UPLOADED_IMAGE);
    const target = document.querySelector('[data-size="cover"]');
    expect(handleCharacterImageClick({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleCharacterImageClick — position presets
// ─────────────────────────────────────────────────────────────────────────
describe("handleCharacterImageClick — position presets", () => {
  function setupPresetDOM() {
    resetDOM(`
      <div id="charimg-preview"></div>
      <img id="charimg-img" />
      <button class="charimg-preset-btn" data-pos="center"></button>
      <button class="charimg-preset-btn" data-pos="top"></button>
      <button class="charimg-preset-btn" data-pos="left"></button>
    `);
    jest
      .spyOn(
        document.getElementById("charimg-preview"),
        "getBoundingClientRect",
      )
      .mockReturnValue({ width: 200, height: 100 });
    jest
      .spyOn(document.getElementById("charimg-img"), "getBoundingClientRect")
      .mockReturnValue({ width: 50, height: 20 });
    Object.assign(state.selected.character.image, UPLOADED_IMAGE);
  }

  test("returns false when nothing is uploaded", () => {
    resetDOM(`<button class="charimg-preset-btn" data-pos="center"></button>`);
    const target = document.querySelector('[data-pos="center"]');
    expect(handleCharacterImageClick({ target })).toBe(false);
  });

  test("'center' resets position to 50/50", () => {
    setupPresetDOM();
    const target = document.querySelector('[data-pos="center"]');
    handleCharacterImageClick({ target });
    expect(state.selected.character.image.position).toEqual({ x: 50, y: 50 });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("'top' computes y from the image's half-height over the preview height", () => {
    setupPresetDOM();
    const target = document.querySelector('[data-pos="top"]');
    handleCharacterImageClick({ target });
    // y = (20/2) / 100 * 100 = 10
    expect(state.selected.character.image.position.y).toBe(10);
  });

  test("'left' computes x from the image's half-width over the preview width", () => {
    setupPresetDOM();
    const target = document.querySelector('[data-pos="left"]');
    handleCharacterImageClick({ target });
    // x = (50/2) / 200 * 100 = 12.5
    expect(state.selected.character.image.position.x).toBe(12.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleCharacterImageClick — clear button
// ─────────────────────────────────────────────────────────────────────────
describe("handleCharacterImageClick — clear button", () => {
  test("returns false when nothing is uploaded (no dialog shown)", () => {
    resetDOM(`<button id="charimg-clear-btn"></button>`);
    const target = document.getElementById("charimg-clear-btn");
    expect(handleCharacterImageClick({ target })).toBe(false);
    expect(showConfirm).not.toHaveBeenCalled();
  });

  test("claims the click synchronously, then does nothing if the user cancels", async () => {
    resetDOM(`<button id="charimg-clear-btn"></button>`);
    Object.assign(state.selected.character.image, UPLOADED_IMAGE);
    showConfirm.mockResolvedValue(false);
    const target = document.getElementById("charimg-clear-btn");

    const result = handleCharacterImageClick({ target });
    expect(result).toBe(true); // claimed synchronously
    await flush();

    expect(state.selected.character.image.uploaded).toBe(true); // unchanged
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("clears the image when the user confirms", async () => {
    resetDOM(`
      <button id="charimg-clear-btn"></button>
      <div id="charimg-preview"></div>
      <div id="resume-charimg-wrapper"></div>
    `);
    Object.assign(state.selected.character.image, UPLOADED_IMAGE);
    showConfirm.mockResolvedValue(true);
    const target = document.getElementById("charimg-clear-btn");

    handleCharacterImageClick({ target });
    await flush();

    expect(state.selected.character.image.uploaded).toBe(false);
    expect(state.selected.character.image.data).toBe("");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

test("handleCharacterImageClick returns false for an unrelated click target", () => {
  resetDOM(`<div id="unrelated"></div>`);
  const target = document.getElementById("unrelated");
  expect(handleCharacterImageClick({ target })).toBe(false);
});

// ─────────────────────────────────────────────────────────────────────────
// handleCharacterImageChange — file upload
// ─────────────────────────────────────────────────────────────────────────
describe("handleCharacterImageChange", () => {
  function fileInput(file) {
    const input = document.createElement("input");
    input.id = "charimg-file-input";
    Object.defineProperty(input, "files", {
      value: file ? [file] : [],
      configurable: true,
    });
    return input;
  }

  test("returns false for an unrelated change target", () => {
    const target = document.createElement("input");
    target.id = "something-else";
    expect(handleCharacterImageChange({ target })).toBe(false);
  });

  test("handles (true) but does nothing when no file is selected", () => {
    const target = fileInput(null);
    expect(handleCharacterImageChange({ target })).toBe(true);
    expect(state.selected.character.image.uploaded).toBe(false);
  });

  test("resets the input's value synchronously so the same file can be re-selected", async () => {
    mockCanvasContext();
    const file = new File(["x"], "a.png", { type: "image/png" });
    const target = fileInput(file);

    handleCharacterImageChange({ target });

    expect(target.value).toBe("");
    // Let this test's own upload chain fully resolve before the next test
    // runs — otherwise its still-pending _loadFile() promise can resolve
    // DURING a later test and mutate that test's freshly-reset state.
    await flush();
  });

  test("rejects an unsupported file type with a toast, without reading it", async () => {
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    const target = fileInput(file);

    handleCharacterImageChange({ target });
    await flush();

    expect(showToast).toHaveBeenCalledWith(expect.any(String), "error");
    expect(state.selected.character.image.uploaded).toBe(false);
  });

  test("rejects a file over 1MB with a toast, without reading it", async () => {
    const bigFile = new File([new Uint8Array(1_000_001)], "big.png", {
      type: "image/png",
    });
    const target = fileInput(bigFile);

    handleCharacterImageChange({ target });
    await flush();

    expect(showToast).toHaveBeenCalledWith(expect.any(String), "error");
    expect(state.selected.character.image.uploaded).toBe(false);
  });

  test("a valid upload computes dimensions, orientation, and average color, then renders and triggers autorun", async () => {
    mockCanvasContext([10, 20, 30, 255]);
    const file = new File(["x"], "a.png", { type: "image/png" });
    const target = fileInput(file);
    resetDOM(`
      <input id="charimg-file-input" />
      <div id="charimg-preview"></div>
      <div id="charimg-bg"></div>
      <input id="charimg-scale" />
      <div id="resume-charimg-wrapper"></div>
    `);
    // MockImage always reports 100x100 -> "square" orientation
    handleCharacterImageChange({ target });
    await flush();

    const img = state.selected.character.image;
    expect(img.uploaded).toBe(true);
    expect(img.background).toBe("average");
    expect(img.color).toEqual({ r: 10, g: 20, b: 30 });
    expect(img.orientation).toBe("square");
    expect(img.scale).toBe(100);
    expect(img.position).toEqual({ x: 50, y: 50 });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("classifies landscape vs portrait orientation correctly", async () => {
    mockCanvasContext();
    class LandscapeMockImage extends MockImage {
      constructor() {
        super();
        this.naturalWidth = 200;
        this.naturalHeight = 100;
      }
    }
    global.Image = LandscapeMockImage;
    const file = new File(["x"], "a.png", { type: "image/png" });
    const target = fileInput(file);

    handleCharacterImageChange({ target });
    await flush();

    expect(state.selected.character.image.orientation).toBe("landscape");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleCharacterImageInput — scale slider
// ─────────────────────────────────────────────────────────────────────────
describe("handleCharacterImageInput", () => {
  test("updates scale, patches the live preview image if present, and re-renders resume", () => {
    resetDOM(`
      <input id="charimg-scale" value="80" />
      <img id="charimg-img" />
      <div id="resume-charimg-wrapper"></div>
    `);
    const target = document.getElementById("charimg-scale");

    const result = handleCharacterImageInput({ target });

    expect(result).toBe(true);
    expect(state.selected.character.image.scale).toBe(80);
    expect(document.getElementById("charimg-img").style.width).toBe("80%");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("returns false for an unrelated input target", () => {
    const target = document.createElement("input");
    target.id = "something-else";
    expect(handleCharacterImageInput({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// initCharacterImage
// ─────────────────────────────────────────────────────────────────────────
describe("initCharacterImage", () => {
  test("renders both the editor preview and the resume portrait", () => {
    resetDOM(`
      <div id="charimg-preview"></div>
      <div id="resume-charimg-wrapper"></div>
    `);
    Object.assign(state.selected.character.image, UPLOADED_IMAGE);

    initCharacterImage();

    expect(document.getElementById("charimg-img")).not.toBeNull();
    expect(document.getElementById("resume-charimg-wrapper").hidden).toBe(
      false,
    );
  });
});
