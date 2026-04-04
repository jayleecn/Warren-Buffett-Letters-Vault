import fs from "fs"
import path from "path"
import { FilePath, FullSlug, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"

/** 站点图标唯一来源：`content/attachments/favicon/`（与 Quartz 内容目录内 Obsidian 附件一致） */
const userFaviconDir = () =>
  path.join(process.cwd(), "content", "attachments", "favicon")

export const Favicon: QuartzEmitterPlugin = () => ({
  name: "Favicon",
  async *emit({ argv }) {
    const dir = userFaviconDir()
    const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => [])

    // 1) 根目录 /favicon.ico（浏览器默认请求）
    const icoSrc = path.join(dir, "favicon.ico")
    if (await fileExists(icoSrc)) {
      const icoBuf = await fs.promises.readFile(icoSrc)
      yield write({
        ctx: { argv } as BuildCtx,
        slug: "favicon" as FullSlug,
        ext: ".ico",
        content: icoBuf,
      })
    }

    // 2) 其余资源复制到 /static/，供 Head 与多尺寸引用
    for (const ent of entries) {
      if (!ent.isFile() || ent.name.startsWith(".") || ent.name === "favicon.ico") {
        continue
      }
      const src = path.join(dir, ent.name)
      const dest = joinSegments(argv.output, "static", ent.name) as FilePath
      await fs.promises.mkdir(path.dirname(dest), { recursive: true })
      await fs.promises.copyFile(src, dest)
      yield dest
    }

    // 3) Head 组件硬编码使用 `static/icon.png`：用 apple-touch 作为标签页主图标
    const iconSrc = path.join(dir, "apple-touch-icon.png")
    const iconDest = joinSegments(argv.output, "static", "icon.png") as FilePath
    if (await fileExists(iconSrc)) {
      await fs.promises.mkdir(path.dirname(iconDest), { recursive: true })
      await fs.promises.copyFile(iconSrc, iconDest)
      yield iconDest
    }
  },
  async *partialEmit() {},
})

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.promises.access(p)
    return true
  } catch {
    return false
  }
}
