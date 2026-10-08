import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

async function loadProviders() {
  const source = await readFile(new URL("../app/providers.tsx", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  runInNewContext(outputText, {
    exports,
    require(name) {
      if (name === "react") return { useState: (initialize) => [initialize()] };
      if (name === "@tanstack/react-query") {
        return { QueryClient: class {}, QueryClientProvider: "QueryClientProvider" };
      }
      if (name === "next-auth/react") {
        return { SessionProvider: "SessionProvider", SessionContext: { Provider: "SessionContextProvider" } };
      }
      return require(name);
    },
  });
  return exports.Providers;
}

test("anonymous users do not mount a fetching session provider during login redirects", async () => {
  const Providers = await loadProviders();
  const element = Providers({ authConfigured: true, session: null, children: "content" });
  const provider = element.props.children;
  assert.equal(provider.type, "SessionContextProvider");
  assert.equal(provider.props.value.data, null);
  assert.equal(provider.props.value.status, "unauthenticated");
  assert.equal(provider.props.children, "content");
});

test("authenticated users receive their server session", async () => {
  const Providers = await loadProviders();
  const session = { user: { id: "oauth:user-123" }, expires: "2099-01-01T00:00:00Z" };
  const element = Providers({ authConfigured: true, session, children: "content" });
  assert.equal(element.props.children.props.session, session);
});

test("unconfigured authentication does not mount SessionProvider", async () => {
  const Providers = await loadProviders();
  const element = Providers({ authConfigured: false, session: null, children: "content" });
  assert.equal(element.props.children.type, "SessionContextProvider");
  assert.equal(element.props.children.props.value.status, "unauthenticated");
});