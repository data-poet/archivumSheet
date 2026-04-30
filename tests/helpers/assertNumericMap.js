function assertNumericMap(map) {
  expect(typeof map).toBe("object");

  Object.values(map).forEach((value) => {
    expect(typeof value).toBe("number");
    expect(Number.isNaN(value)).toBe(false);
  });
}

module.exports = assertNumericMap;
