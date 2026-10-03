import assert from "node:assert/strict";
import test from "node:test";
import { bundleClientScript } from "./clientScripts";

test("client script versions identify the exact final bytes deterministically", () => {
  const bundle = bundleClientScript(["window.fixture=1"]);
  assert.deepEqual(bundle, {
    contents: "(function(){window.fixture=1})();\n",
    version: "e3375353372b1fcda0a606c05dea2ffa632f439f1088abeb6843cb4e8d836765",
  });
  assert.deepEqual(bundleClientScript(["window.fixture=1"]), bundle);
  assert.deepEqual(
    bundleClientScript(["  window.fixture = 1; // formatting\n"]),
    bundle,
  );
  assert.notEqual(
    bundleClientScript(["window.fixture=2"]).version,
    bundle.version,
  );
});
