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

// jsdom can't decode real images or run a canvas 2D context; mock both so the upload pipeline (dimension read + color sampling) runs deterministically with a short real-timer wait, not fake timers.
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
    // state.js's pristine image.scale is "" not undefined, so `_img().scale ?? 100` passes it straight through — there's no 100-default in practice for a fresh character.
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

  // _bindDrag() adds fresh mousemove/mouseup listeners on `document` every render without removing old ones — each test must end its gesture with a mouseup or stale listeners leak into later tests.

  test("full gesture: live updates during move, ignores movement before mousedown, commits once on mouseup, ignores movement after", () => {
    const preview = setup();

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

    document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });

  test("[fixed] repeated renderCharacterImage() calls do NOT stack duplicate drag listeners", () => {
    // _bindDrag() re-ran on every render without removing prior document
    // listeners; guarded via previewEl._dragBound since previewEl persists.
    const preview = setup();
    renderCharacterImage(); // second render of the SAME previewEl
    renderCharacterImage();

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
    // Let this test's upload chain fully resolve — otherwise a still-pending _loadFile() promise can resolve during a later test and mutate its freshly-reset state.
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
