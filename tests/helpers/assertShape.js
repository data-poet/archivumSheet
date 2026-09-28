// CommonJS on purpose: shared by tests/engine/, which jest.config.js keeps plain CJS.
// tests/dev/helpers/ is the ESM counterpart, for tests/dev/'s babel-transformed suite.
function assertShape(obj, keys) {
  keys.forEach((key) => {
    expect(obj).toHaveProperty(key);
  });
}

module.exports = assertShape;
