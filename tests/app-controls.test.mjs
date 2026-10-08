import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

async function createAuthenticate(signOut, events) {
  const source = await readFile(new URL("../components/app-controls.tsx", import.meta.url), "utf8");
  const parsed = ts.createSourceFile("app-controls.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === "authenticate") {
      handler = node.getText(parsed);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  assert.ok(handler, "AppControls must have an authenticate handler");
  const { outputText } = ts.transpileModule(handler, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  });
  return runInNewContext(`${outputText}\nauthenticate`, {
    authenticated: true,
    window: { location: { href: "https://licenses.example.com/de" } },
    queryClient: { clear: () => events.push("clear") },
    router: { refresh: () => events.push("refresh") },
    setPending: (value) => events.push(`pending:${value}`),
    setError: (value) => events.push(`error:${value}`),
    signOut,
  });
}

test("logout disables document navigation and waits for sign-out before refreshing", async () => {
  const events = [];
  let finishSignOut;
  const authenticate = await createAuthenticate((options) => {
    assert.equal(options.redirect, false);
    assert.equal(options.callbackUrl, "https://licenses.example.com/de");
    return new Promise((resolve) => { finishSignOut = resolve; });
  }, events);

  const pending = authenticate();
  assert.deepEqual(events, ["pending:true", "error:false", "clear"]);
  finishSignOut();
  await pending;
  assert.deepEqual(events, ["pending:true", "error:false", "clear", "refresh", "pending:false"]);
});

test("failed logout reports the error without refreshing and resets pending state", async () => {
  const events = [];
  const authenticate = await createAuthenticate(async () => {
    throw new Error("NetworkError");
  }, events);

  await authenticate();
  assert.deepEqual(events, ["pending:true", "error:false", "clear", "error:true", "pending:false"]);
});