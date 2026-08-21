/**
 * mockFetch.js
 *
 * api.js's getJSON/postJSON both call the global fetch() with a relative
 * URL (e.g. "/api/advantages") and expect a Response-shaped object back
 * ({ ok, status, json() }). This stub lets tests control that response
 * per-URL without ever touching a real server.
 *
 * Usage:
 *   import { installMockFetch, mockFetchResponse } from ".../mockFetch.js";
 *
 *   beforeEach(() => installMockFetch());
 *
 *   test("fetches advantages", async () => {
 *     mockFetchResponse("/api/advantages", [{ id: 1 }]);
 *     const result = await fetchAdvantages();
 *     expect(result).toEqual([{ id: 1 }]);
 *   });
 */

let routes;

/**
 * Installs global.fetch as a jest mock. Call in beforeEach so routes reset
 * between tests. Any URL not registered via mockFetchResponse/mockFetchError
 * rejects loudly instead of silently returning undefined — a test relying
 * on an unregistered route is a test with a gap, not a passing test.
 */
export function installMockFetch() {
  routes = new Map();
  global.fetch = jest.fn((url) => {
    if (!routes.has(url)) {
      return Promise.reject(
        new Error(`mockFetch: no stubbed response registered for "${url}"`),
      );
    }
    const { body, status, ok } = routes.get(url);
    return Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(body),
    });
  });
  return global.fetch;
}

/**
 * Registers a successful (200, ok:true) JSON response for a given URL.
 */
export function mockFetchResponse(url, body) {
  routes.set(url, { body, status: 200, ok: true });
}

/**
 * Registers a failing response for a given URL, so tests can exercise
 * getJSON/postJSON's `if (!res.ok) throw` path.
 */
export function mockFetchError(url, status = 500, body = null) {
  routes.set(url, { body, status, ok: false });
}
