import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

async function request(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    signal: AbortSignal.timeout(10000),
  });
}

test("API health endpoint returns 200", async () => {
  const response = await request("/api/health");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(body.timestamp);
});

test("Protected profile endpoint rejects unauthenticated requests", async () => {
  const response = await request("/api/users/profile");
  assert.equal(response.status, 401);
});

test("Protected preferences endpoint rejects unauthenticated requests", async () => {
  const response = await request("/api/users/preferences");
  assert.equal(response.status, 401);
});

test("Protected dashboard endpoint rejects unauthenticated requests", async () => {
  const response = await request("/api/users/dashboard");
  assert.equal(response.status, 401);
});

test("Protected projects endpoint rejects unauthenticated requests", async () => {
  const response = await request("/api/projects");
  assert.equal(response.status, 401);
});

test("Protected recommendations endpoint rejects unauthenticated requests", async () => {
  const response = await request("/api/projects/recommendations");
  assert.equal(response.status, 401);
});

test("Protected user projects endpoint rejects unauthenticated requests", async () => {
  const response = await request("/api/users/projects");
  assert.equal(response.status, 401);
});

test("Unknown API route returns 404", async () => {
  const response = await request("/unknown-route");
  assert.equal(response.status, 404);
});
