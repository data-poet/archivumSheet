// ===== GENERIC HELPER =====
async function getJSON(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status}`);
  }

  return res.json();
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`POST ${url} failed: ${res.status}`);
  }

  return res.json();
}

// ===== LOADERS =====
export async function fetchAdvantages() {
  return getJSON("/api/advantages");
}

export async function fetchDisadvantages() {
  return getJSON("/api/disadvantages");
}

export async function fetchSkills() {
  return getJSON("/api/skills");
}

export async function fetchSpells() {
  return getJSON("/api/spells");
}

// ===== ENGINE =====
export async function buildSheet(payload) {
  return postJSON("/api/sheet/build", payload);
}
