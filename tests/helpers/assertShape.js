function assertShape(obj, keys) {
  keys.forEach((key) => {
    expect(obj).toHaveProperty(key);
  });
}

module.exports = assertShape;
