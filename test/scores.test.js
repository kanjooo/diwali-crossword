import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/scores.js";

function response() {
  return { statusCode: 0, body: null, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

const originalFetch = global.fetch;
test.afterEach(() => { global.fetch = originalFetch; delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.TEACHER_EMAIL_ALLOWLIST; });

function configure() {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-key";
  process.env.TEACHER_EMAIL_ALLOWLIST = "teacher@example.edu";
}

test("scores returns 401 with no bearer token", async () => {
  configure(); const res = response();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 401);
});

test("scores returns 401 for an invalid bearer token", async () => {
  configure(); global.fetch = async () => new Response("invalid", { status: 401 }); const res = response();
  await handler({ method: "GET", headers: { authorization: "Bearer invalid" } }, res);
  assert.equal(res.statusCode, 401);
});

test("scores returns 403 for an authenticated non-teacher", async () => {
  configure(); global.fetch = async () => new Response(JSON.stringify({ email: "student@example.edu" }), { status: 200 }); const res = response();
  await handler({ method: "GET", headers: { authorization: "Bearer valid" } }, res);
  assert.equal(res.statusCode, 403);
});

test("scores returns attempts only for an allowlisted teacher", async () => {
  configure(); let calls = 0;
  global.fetch = async () => ++calls === 1 ? new Response(JSON.stringify({ email: "TEACHER@example.edu" }), { status: 200 }) : new Response(JSON.stringify([{ name: "Aarav" }]), { status: 200 });
  const res = response(); await handler({ method: "GET", headers: { authorization: "Bearer valid" } }, res);
  assert.equal(res.statusCode, 200); assert.deepEqual(res.body, [{ name: "Aarav" }]); assert.equal(calls, 2);
});
