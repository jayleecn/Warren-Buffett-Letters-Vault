import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRelativeURLs } from "./path";

test("SPA rebasing preserves resource query versions and anchors", () => {
  const attributes = new Map([
    ["src", "../postscript.js?v=0123456789abcdef#module"],
    ["href", "../index.css?v=style-hash"],
  ]);
  const element = {
    getAttribute: (name: string) => attributes.get(name),
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  };
  const document = { querySelectorAll: () => [element] };
  Reflect.apply(normalizeRelativeURLs, undefined, [
    document,
    new URL("https://example.com/en/letter"),
  ]);
  assert.equal(
    attributes.get("src"),
    "/postscript.js?v=0123456789abcdef#module",
  );
  assert.equal(attributes.get("href"), "/index.css?v=style-hash");
});
