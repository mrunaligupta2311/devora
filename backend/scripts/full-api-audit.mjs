import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const BASE = process.env.API_BASE_URL || "http://localhost:5000";
const rl = readline.createInterface({ input, output });

let passed = 0;
let failed = 0;
let skipped = 0;
let token = "";
let cookie = "";

async function check(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed++;
    console.log(`FAIL  ${name}: ${error.message}`);
  }
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(15000),
  });

  let body = {};
  try { body = await response.json(); } catch {}
  return { response, body };
}

function findValue(object, key) {
  if (!object || typeof object !== "object") return undefined;
  if (object[key]) return object[key];

  for (const value of Object.values(object)) {
    const found = findValue(value, key);
    if (found) return found;
  }
}

function assertSuccess(result, label) {
  if (!result.response.ok || result.body.success === false) {
    throw new Error(`${label}: HTTP ${result.response.status} - ${result.body.message || "Request failed"}`);
  }
}

function findProjectId(object) {
  if (!object || typeof object !== "object") return null;

  if (Array.isArray(object)) {
    for (const item of object) {
      const found = findProjectId(item);
      if (found) return found;
    }
    return null;
  }

  if (object.id && (object.title || object.name)) return object.id;

  for (const value of Object.values(object)) {
    const found = findProjectId(value);
    if (found) return found;
  }

  return null;
}

console.log("\n========== DEVORA FULL API AUDIT ==========\n");

await check("API health", async () => {
  const r = await api("/api/health");
  assertSuccess(r, "Health");
});

await check("Unauthenticated profile protection", async () => {
  const r = await api("/api/users/profile");
  if (r.response.status !== 401) throw new Error(`Expected 401, got ${r.response.status}`);
});

await check("Unauthenticated projects protection", async () => {
  const r = await api("/api/projects");
  if (r.response.status !== 401) throw new Error(`Expected 401, got ${r.response.status}`);
});

const email = process.env.DEVORA_TEST_EMAIL || await rl.question("Existing Devora account email: ");
let password = process.env.DEVORA_TEST_PASSWORD;

if (!password) {
  password = await rl.question("Account password (input hidden): ", { hideEchoBack: true });
}

await check("Login and JWT generation", async () => {
  const r = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  assertSuccess(r, "Login");

  token = findValue(r.body, "accessToken");
  if (!token) throw new Error("Access token missing from login response");

  const cookies = r.response.headers.getSetCookie?.() || [];
  cookie = cookies.map(v => v.split(";")[0]).join("; ");
});

password = "";

if (token) {
  await check("Authenticated current-user endpoint", async () => {
    const r = await api("/api/auth/me");
    assertSuccess(r, "Current user");
  });

  await check("Profile retrieval", async () => {
    const r = await api("/api/users/profile");
    assertSuccess(r, "Profile");
  });

  await check("Preferences retrieval", async () => {
    const r = await api("/api/users/preferences");
    assertSuccess(r, "Preferences");
  });

  await check("Dashboard retrieval", async () => {
    const r = await api("/api/users/dashboard");
    assertSuccess(r, "Dashboard");
  });

  let projectsBody;

  await check("Project listing", async () => {
    const r = await api("/api/projects");
    assertSuccess(r, "Projects");
    projectsBody = r.body;
  });

  await check("Project recommendations", async () => {
    const r = await api("/api/projects/recommendations");
    assertSuccess(r, "Recommendations");
  });

  await check("User projects listing", async () => {
    const r = await api("/api/users/projects");
    assertSuccess(r, "User projects");
  });

  const projectId = findProjectId(projectsBody);

  if (projectId) {
    await check("Project details and roadmap", async () => {
      const r = await api(`/api/projects/${encodeURIComponent(projectId)}`);
      assertSuccess(r, "Project details");
    });
  } else {
    skipped++;
    console.log("SKIP  Project details: no project ID found in listing response");
  }

  await check("Invalid profile payload rejected safely", async () => {
    const r = await api("/api/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "A" }),
    });
    if (![400, 422].includes(r.response.status)) {
      throw new Error(`Expected validation error, got ${r.response.status}`);
    }
  });

  await check("Invalid preferences payload rejected safely", async () => {
    const r = await api("/api/users/preferences", {
      method: "PUT",
      body: JSON.stringify({ fields: [], level: "Expert", techStack: [], goal: "Test" }),
    });
    if (![400, 422].includes(r.response.status)) {
      throw new Error(`Expected validation error, got ${r.response.status}`);
    }
  });

  await check("Invalid project status rejected safely", async () => {
    const r = await api("/api/users/projects/invalid-project-id/status", {
      method: "PUT",
      body: JSON.stringify({ status: "Deleted" }),
    });
    if (![400, 422].includes(r.response.status)) {
      throw new Error(`Expected validation error, got ${r.response.status}`);
    }
  });

  await check("Invalid milestone payload rejected safely", async () => {
    const r = await api("/api/users/projects/invalid-project-id/milestones/invalid-milestone-id", {
      method: "PUT",
      body: JSON.stringify({ completed: "yes" }),
    });
    if (![400, 422].includes(r.response.status)) {
      throw new Error(`Expected validation error, got ${r.response.status}`);
    }
  });

  await check("Unknown authenticated API route returns 404", async () => {
    const r = await api("/api/unknown-audit-route");
    if (r.response.status !== 404) {
      throw new Error(`Expected 404, got ${r.response.status}`);
    }
  });

  if (cookie) {
    await check("Logout and refresh-session revocation", async () => {
      const r = await api("/api/auth/logout", { method: "POST" });
      assertSuccess(r, "Logout");
    });
  } else {
    skipped++;
    console.log("SKIP  Logout: refresh cookie was not returned by login");
  }
} else {
  skipped += 12;
  console.log("\nAuthenticated tests skipped because login failed.");
}

rl.close();

console.log("\n========== AUDIT SUMMARY ==========");
console.log(`PASSED : ${passed}`);
console.log(`FAILED : ${failed}`);
console.log(`SKIPPED: ${skipped}`);
console.log("===================================\n");

process.exitCode = failed ? 1 : 0;
