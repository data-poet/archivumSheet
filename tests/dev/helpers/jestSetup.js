// jsdom doesn't provide structuredClone even though it's a standard Web API.
if (typeof global.structuredClone !== "function") {
  global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}
