// api.js's getJSON/postJSON call global fetch() expecting a Response-shaped object ({ ok, status, json() }); this stubs it per-URL.
let routes;

// An unregistered URL rejects loudly rather than resolving undefined, so a missing stub shows up as a failing test, not a false pass.
export function installMockFetch() {
  routes = new Map();
  global.fetch = jest.fn((url) => {
    if (!routes.has(url)) {
      return Promise.reject(
        new Error(`mockFetch: no stubbed response registered for "${url}"`),
      );
    }
    const { body, status, ok, headers } = routes.get(url);
    return Promise.resolve({
      ok,
      status,
      headers: {
        get: (name) => headers?.[name] ?? null,
      },
      json: () => Promise.resolve(body),
    });
  });
  return global.fetch;
}

export function mockFetchResponse(url, body, { headers } = {}) {
  routes.set(url, { body, status: 200, ok: true, headers });
}

export function mockFetchError(
  url,
  status = 500,
  body = null,
  { headers } = {},
) {
  routes.set(url, { body, status, ok: false, headers });
}
