import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { ApiError, fetchJson } from "../lib/api.ts";

test("fetchJson parses JSON and forwards headers and cancellation", async (context) => {
  const controller = new AbortController();
  context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/example");
    assert.equal(options.signal, controller.signal);
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.headers["x-request-id"], "test-request");
    return Response.json({ name: "LicenseDB" });
  });

  const result = await fetchJson("/api/example", {
    signal: controller.signal,
    headers: new Headers({ "x-request-id": "test-request" }),
  });
  assert.deepEqual(result, { name: "LicenseDB" });
});

test("fetchJson rejects HTTP errors with their status", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
  );

  await assert.rejects(fetchJson("/api/me"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    return true;
  });
});

test("fetchJson propagates cancellation", async (context) => {
  const controller = new AbortController();
  controller.abort();
  context.mock.method(globalThis, "fetch", async (_url, options) => {
    options.signal.throwIfAborted();
  });

  await assert.rejects(
    fetchJson("/api/me", { signal: controller.signal }),
    { name: "AbortError" },
  );
});

test("all locales contain the same translation keys and placeholders", async () => {
  const english = JSON.parse(
    await readFile(new URL("../messages/en.json", import.meta.url), "utf8"),
  );
  const german = JSON.parse(
    await readFile(new URL("../messages/de.json", import.meta.url), "utf8"),
  );

  function compareMessages(reference, translated) {
    assert.deepEqual(Object.keys(translated).sort(), Object.keys(reference).sort());
    for (const [key, value] of Object.entries(reference)) {
      if (typeof value === "string") {
        assert.equal(typeof translated[key], "string");
        assert.deepEqual(
          translated[key].match(/\{[^}]+\}/g) ?? [],
          value.match(/\{[^}]+\}/g) ?? [],
        );
      } else {
        compareMessages(value, translated[key]);
      }
    }
  }

  compareMessages(english, german);
});