import { createHash } from "node:crypto";
import { transformSync } from "esbuild";

export function bundleClientScript(scripts: string[]) {
  // Hash the final emitted bytes, including the minifier's output. Reformatting
  // source without changing the bundle must not change its cache identity.
  const source = scripts
    .map((script) => `(function () {${script}})();`)
    .join("\n");
  const contents = transformSync(source, { minify: true }).code;
  return {
    contents,
    version: createHash("sha256").update(contents).digest("hex"),
  };
}
