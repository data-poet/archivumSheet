// jsdom doesn't provide structuredClone even though it's a standard Web API.
if (typeof global.structuredClone !== "function") {
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}

// jsdom has no CSSOM CSS.escape either (idiomorph calls it when matching nodes by id).
// Algorithm per the CSSOM spec, same as the W3C's own reference polyfill.
if (typeof global.CSS === "undefined") {
  global.CSS = {};
}
if (typeof global.CSS.escape !== "function") {
  global.CSS.escape = (value) => {
    const string = String(value);
    const length = string.length;
    let result = "";
    let index = -1;
    let codeUnit;
    const firstCodeUnit = string.charCodeAt(0);

    while (++index < length) {
      codeUnit = string.charCodeAt(index);
      if (codeUnit === 0x0000) {
        result += "�";
        continue;
      }
      if (
        (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
        codeUnit === 0x007f ||
        (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (index === 1 &&
          codeUnit >= 0x0030 &&
          codeUnit <= 0x0039 &&
          firstCodeUnit === 0x002d)
      ) {
        result += `\\${codeUnit.toString(16)} `;
        continue;
      }
      if (
        index === 0 &&
        length === 1 &&
        codeUnit === 0x002d // U+002D HYPHEN-MINUS
      ) {
        result += `\\${string.charAt(index)}`;
        continue;
      }
      if (
        codeUnit >= 0x0080 ||
        codeUnit === 0x002d ||
        codeUnit === 0x005f ||
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
        (codeUnit >= 0x0061 && codeUnit <= 0x007a)
      ) {
        result += string.charAt(index);
        continue;
      }
      result += `\\${string.charAt(index)}`;
    }
    return result;
  };
}
