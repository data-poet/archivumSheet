module.exports = {
  projects: [
    {
      displayName: "engine",
      testEnvironment: "node",
      modulePaths: ["<rootDir>"],
      testMatch: ["<rootDir>/tests/engine/**/*.test.js"],
      // No transform configured here — engine tests are plain CommonJS so
      // this is a no-op either way. IMPORTANT: do not set `transform: {}`
      // explicitly. That was tried and reproducibly broke self-mocked
      // bare-specifier modules (jest.mock("engine/inventory/js/ammo/ammo"))
      // under Jest's multi-`projects` resolution — ammo.test.js and
      // buildInventory.test.js would intermittently run twice and pollute
      // each other's mock state. Leaving transform unset lets Jest fall
      // back to its default (babel-jest via the root babel.config.js),
      // which is stable and behaviorally a no-op for CommonJS.
    },
    {
      displayName: "dev",
      testEnvironment: "jsdom",
      modulePaths: ["<rootDir>"],
      testMatch: ["<rootDir>/tests/dev/**/*.test.js"],
      setupFiles: ["<rootDir>/tests/dev/helpers/jestSetup.js"],
      transform: {
        "^.+\\.js$": "babel-jest",
      },
    },
  ],
};
