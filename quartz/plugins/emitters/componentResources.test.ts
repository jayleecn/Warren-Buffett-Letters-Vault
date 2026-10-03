import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import type {
  QuartzEmitterPlugin,
  QuartzEmitterPluginInstance,
} from "../types";
import type { BuildCtx } from "../../util/ctx";
import type { QuartzComponent } from "../../components/types";
import type { StaticResources } from "../../util/resources";

// Exercise the actual resource hook and full/partial emitter. Browser-only script
// and Sass loaders stand in for the CLI's build-time loaders; fixture component
// scripts still pass through the production bundling, hashing and file writer.
const bundled = await build({
  entryPoints: [new URL("./componentResources.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  packages: "external",
  plugins: [
    {
      name: "browser-resource-fixtures",
      setup(builder) {
        builder.onLoad({ filter: /\.(scss|inline\.ts)$/ }, () => ({
          contents: 'export default ""',
          loader: "js",
        }));
      },
    },
  ],
});
const module: { exports: { ComponentResources?: QuartzEmitterPlugin } } = {
  exports: {},
};
runInNewContext(bundled.outputFiles[0].text, {
  module,
  exports: module.exports,
  require: createRequire(import.meta.url),
  Buffer,
});
assert.ok(module.exports.ComponentResources);
const createEmitter = module.exports.ComponentResources;

function context(
  output: string,
  emitter: QuartzEmitterPluginInstance,
  component: QuartzComponent,
): BuildCtx {
  const colors = {
    light: "#fff",
    lightgray: "#eee",
    gray: "#aaa",
    darkgray: "#333",
    dark: "#000",
    secondary: "#111",
    tertiary: "#222",
    highlight: "#ccc",
    textHighlight: "#bbb",
  };
  return {
    buildId: "fixture",
    incremental: false,
    allSlugs: [],
    allFiles: [],
    argv: {
      directory: "content",
      output,
      verbose: false,
      serve: false,
      watch: false,
      port: 8080,
      wsPort: 3001,
    },
    cfg: {
      configuration: {
        pageTitle: "Fixture",
        enableSPA: false,
        enablePopovers: false,
        analytics: null,
        locale: "en-US",
        ignorePatterns: [],
        defaultDateType: "modified",
        theme: {
          fontOrigin: "local",
          cdnCaching: true,
          typography: {
            header: "sans-serif",
            body: "sans-serif",
            code: "monospace",
          },
          colors: { lightMode: colors, darkMode: colors },
        },
      },
      plugins: {
        transformers: [],
        filters: [],
        emitters: [
          emitter,
          {
            name: "Fixture",
            getQuartzComponents: () => [component],
            async *emit() {},
          },
        ],
      },
    },
  };
}

async function consume(
  output: ReturnType<QuartzEmitterPluginInstance["emit"]>,
) {
  const emitted = await output;
  if (Symbol.asyncIterator in emitted) {
    for await (const _file of emitted) {
      /* Wait for each write. */
    }
  }
}

test("synchronous resource hooks keep full and incremental script files in sync with their hashes", async (t) => {
  const output = await mkdtemp(join(tmpdir(), "quartz-client-scripts-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  const emitter = createEmitter();
  const component: QuartzComponent = () => null;
  component.beforeDOMLoaded = "window.beforeFixture=1";
  component.afterDOMLoaded = "window.afterFixture=1";
  const ctx = context(output, emitter, component);
  function prepare(): StaticResources {
    const prepared = emitter.externalResources!(ctx);
    assert.ok(prepared?.clientScriptVersions);
    assert.equal(typeof prepared.clientScriptVersions.prescript, "string");
    assert.equal(typeof prepared.clientScriptVersions.postscript, "string");
    return { css: [], js: [], additionalHead: [], ...prepared };
  }
  async function verify(resources: StaticResources) {
    for (const name of ["prescript", "postscript"] as const) {
      const bytes = await readFile(join(output, `${name}.js`));
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        resources.clientScriptVersions?.[name],
      );
    }
  }

  const first = prepare();
  await consume(emitter.emit(ctx, [], first));
  await verify(first);
  ctx.incremental = true;
  const unchanged = prepare();
  assert.deepEqual(unchanged.clientScriptVersions, first.clientScriptVersions);
  await consume(emitter.partialEmit!(ctx, [], unchanged, [])!);
  await verify(unchanged);

  component.afterDOMLoaded = "window.afterFixture=2";
  const changed = prepare();
  assert.equal(
    changed.clientScriptVersions?.prescript,
    first.clientScriptVersions?.prescript,
  );
  assert.notEqual(
    changed.clientScriptVersions?.postscript,
    first.clientScriptVersions?.postscript,
  );
  await consume(emitter.partialEmit!(ctx, [], changed, [])!);
  await verify(changed);
});
