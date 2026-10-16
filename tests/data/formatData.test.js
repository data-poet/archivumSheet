const { normalizeCsvText } = require("scripts/formatData.js");

describe("normalizeCsvText", () => {
  test("turns CRLF record endings into LF and adds the final newline", () => {
    expect(normalizeCsvText("a,b\r\n1,2\r\n3,4")).toBe("a,b\n1,2\n3,4\n");
  });

  test("leaves line breaks inside quoted cells alone", () => {
    const text = 'a,b\r\n1,"x\r\ny"\r\n';
    expect(normalizeCsvText(text)).toBe('a,b\n1,"x\r\ny"\n');
  });

  test("is idempotent", () => {
    const once = normalizeCsvText("a,b\r\n1,2");
    expect(normalizeCsvText(once)).toBe(once);
  });
});
