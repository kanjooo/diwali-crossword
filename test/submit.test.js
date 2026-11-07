import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import handler from "../api/submit.js";

function response() {
  return { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, setHeader() {} };
}

const originalFetch = global.fetch;
test.afterEach(() => { global.fetch = originalFetch; delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });

test("student submission is still written through the server endpoint", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-key";
  let request;
  global.fetch = async (url, options) => { request = { url, options }; return new Response("{}", { status: 201 }); };
  const res = response();
  await handler({ method: "POST", body: { name: " Aarav ", className: "8-A", schoolName: "School", city: " Delhi ", email: "aarav@example.edu", score: 12, seconds: 90, certId: "CERT-1" } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { success: true });
  assert.match(request.url, /\/rest\/v1\/attempts$/);
  assert.equal(JSON.parse(request.options.body).name, "Aarav");
  assert.equal(JSON.parse(request.options.body).city, "Delhi");
});

test("student submission rejects an empty city", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-key";
  const res = response();
  await handler({ method: "POST", body: { name: "Aarav", className: "8-A", schoolName: "School", city: " ", email: "aarav@example.edu", score: 12 } }, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Missing required fields" });
});

test("student submission rejects an invalid email", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-key";
  const res = response();
  await handler({ method: "POST", body: { name: "Aarav", className: "8-A", schoolName: "School", city: "Delhi", email: "not-an-email", score: 12 } }, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "Invalid email address" });
});

test("completed attempts post every registration and score field to the relative submit route", async () => {
  const page = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/submit", \{/);
  assert.doesNotMatch(page, /API_BASE/);
  for (const field of ["name", "className", "schoolName", "city", "email", "score", "seconds", "certId"]) {
    assert.match(page, new RegExp(`${field}: attempt\\.${field}`));
  }
});
