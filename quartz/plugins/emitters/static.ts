import { FilePath, QUARTZ, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import fs from "fs"
import { glob } from "../../util/glob"
import { dirname } from "path"
import { write } from "./helpers"

export const Static: QuartzEmitterPlugin = () => ({
  name: "Static",
  async *emit(ctx) {
    const { argv, cfg } = ctx
    const staticPath = joinSegments(QUARTZ, "static")
    const fps = await glob("**", staticPath, cfg.configuration.ignorePatterns)
    const outputStaticPath = joinSegments(argv.output, "static")
    await fs.promises.mkdir(outputStaticPath, { recursive: true })
    for (const fp of fps) {
      const src = joinSegments(staticPath, fp) as FilePath
      const dest = joinSegments(outputStaticPath, fp) as FilePath
      await fs.promises.mkdir(dirname(dest), { recursive: true })
      await fs.promises.copyFile(src, dest)
      yield dest
    }

    // Search engines fetch /robots.txt at the site root, not /static/robots.txt.
    const robotsSrc = joinSegments(staticPath, "robots.txt") as FilePath
    if (fs.existsSync(robotsSrc)) {
      const robotsBody = await fs.promises.readFile(robotsSrc)
      yield write({
        ctx,
        slug: "robots" as any,
        ext: ".txt",
        content: robotsBody,
      })
    }
  },
  async *partialEmit() {},
})
