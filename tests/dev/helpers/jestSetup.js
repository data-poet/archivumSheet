// jest-environment-jsdom doesn't forward every standard browser global from
// the Node process automatically. structuredClone is a real Web API
// (supported in all modern browsers this app targets) but is absent here
// unless polyfilled — this is a test-environment gap, not a source bug.
if (typeof global.structuredClone !== "function") {
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
