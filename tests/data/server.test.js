const http = require("http");
const fs = require("fs");
const path = require("path");
const app = require("dev/server.js");
const { loadDataset } = require("helpers/datasets.js");

// The server reads the real CSVs, so this is the contract between the datasets and the browser: every
// route answers, the dataset routes serve rows, and every path the frontend fetches exists.
let server;
let port;

beforeAll(
  () =>
    new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        port = server.address().port;
        resolve();
      });
    }),
);
afterAll(() => new Promise((resolve) => server.close(resolve)));

function request(method, route, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        port,
        path: route,
        method,
        headers: data
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(data),
            }
          : {},
      },
      (res) => {
        let text = "";
        res.on("data", (chunk) => (text += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(text);
          } catch {
            // not JSON (static file)
          }
          resolve({ status: res.statusCode, json });
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

const router = app._router ?? app.router;
const getRoutes = router.stack
  .filter((layer) => layer.route?.methods.get)
  .map((layer) => layer.route.path)
  .filter((route) => route.startsWith("/api/") && !route.includes(":"));

describe("GET /api routes", () => {
  test("there are routes to test", () => {
    expect(getRoutes.length).toBeGreaterThan(25);
  });

  test.each(getRoutes)("%s answers 200 with JSON", async (route) => {
    const { status, json } = await request("GET", route);
    expect(status).toBe(200);
    expect(json).not.toBeNull();
  });

  test("the dataset routes serve every row of their CSV", async () => {
    const { json } = await request("GET", "/api/armors");
    expect(json).toHaveLength(loadDataset("ARMORS").length);
    expect(json[0]).toHaveProperty("armor_key");
  });

  test("an unknown ally is a 404", async () => {
    const { status } = await request("GET", "/api/allies/NOPE");
    expect(status).toBe(404);
  });
});

describe("every path the frontend fetches is served", () => {
  const apiSource = fs.readFileSync(
    path.join(__dirname, "../../dev/public/js/api.js"),
    "utf8",
  );
  const fetched = [...apiSource.matchAll(/["'`](\/api\/[a-z_/-]+)["'`]/g)].map(
    (match) => match[1],
  );

  test("api.js asks for something", () => {
    expect(fetched.length).toBeGreaterThan(25);
  });

  test.each([...new Set(fetched)])("%s", (route) => {
    const served = [
      ...getRoutes,
      ...router.stack
        .filter((layer) => layer.route?.methods.post)
        .map((layer) => layer.route.path),
    ];
    const base = route.replace(/\/$/, "");
    expect(served.some((r) => r === base || r.startsWith(`${base}/:`))).toBe(
      true,
    );
  });
});

describe("POST builders", () => {
  test("/api/sheet/build builds a sheet and resolves the race from race_id", async () => {
    const [{ race_id }] = loadDataset("RACES");
    const { status, json } = await request("POST", "/api/sheet/build", {
      pc: { character_name: "Smoke" },
      race_id,
      character: {
        primaryAttributes: {
          ST: { base_value: 10 },
          DX: { base_value: 10 },
          IQ: { base_value: 10 },
          HT: { base_value: 10 },
        },
      },
      inventory: {},
    });
    expect(status).toBe(200);
    expect(json.race.race_id).toBe(race_id);
    expect(json.character.primary_attributes.ST.value).toBeGreaterThan(0);
  });

  test("/api/sheet/build reports an engine failure as a 500 with a message", async () => {
    const { status, json } = await request("POST", "/api/sheet/build", {
      inventory: {
        armor: [{ armor_id: "ARMOR-NOPE", is_equipped: true, storedAt: null }],
      },
    });
    expect(status).toBe(500);
    expect(typeof json.error).toBe("string");
  });
});
