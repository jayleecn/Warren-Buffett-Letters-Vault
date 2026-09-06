import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { ProcessedContent, QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FullSlug, getAllSegmentPrefixes, pathToRoot } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { TagContent } from "../../components"
import { write } from "./helpers"
import { i18n, TRANSLATIONS, ValidLocale } from "../../i18n"
import { BuildCtx } from "../../util/ctx"
import { StaticResources } from "../../util/resources"
import {
  SITE_LOCALES,
  SiteLocale,
  slugBelongsToLocale,
  tagSlugForLocale,
} from "../../i18n/siteLocales"

interface TagPageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

function computeTagInfo(
  localeFiles: QuartzPluginData[],
  content: ProcessedContent[],
  loc: SiteLocale,
): [Set<string>, Record<string, ProcessedContent>] {
  const uiLocale = (loc.quartzLocale in TRANSLATIONS ? loc.quartzLocale : "en-US") as ValidLocale
  const tags: Set<string> = new Set(
    localeFiles
      .flatMap((data) => data.frontmatter?.tags ?? [])
      .flatMap(getAllSegmentPrefixes)
      .filter((t) => typeof t === "string" && t.trim().length > 0),
  )

  tags.add("index")

  const tagDescriptions: Record<string, ProcessedContent> = Object.fromEntries(
    [...tags].map((tag) => {
      const isIndex = tag === "index"
      const title = isIndex
        ? i18n(uiLocale).pages.tagContent.tagIndex
        : `${i18n(uiLocale).pages.tagContent.tag}: ${tag}`
      const slug = tagSlugForLocale(isIndex ? "index" : tag, loc) as FullSlug
      return [
        tag,
        defaultProcessedContent({
          slug,
          frontmatter: { title, tags: [], lang: loc.code },
        }),
      ]
    }),
  )

  // Update with actual content if available (content/tags/*.md or content/en/tags/*.md)
  for (const [tree, file] of content) {
    const slug = file.data.slug!
    for (const tag of tags) {
      if (slug === tagSlugForLocale(tag, loc)) {
        tagDescriptions[tag] = [tree, file]
        if (file.data.frontmatter?.title === tag) {
          file.data.frontmatter.title = `${i18n(uiLocale).pages.tagContent.tag}: ${tag}`
        }
      }
    }
  }

  return [tags, tagDescriptions]
}

async function processTagPage(
  ctx: BuildCtx,
  tag: string,
  tagContent: ProcessedContent,
  allFiles: QuartzPluginData[],
  opts: FullPageLayout,
  resources: StaticResources,
) {
  const [tree, file] = tagContent
  const slug = file.data.slug!
  const cfg = ctx.cfg.configuration
  const externalResources = pageResources(pathToRoot(slug), resources)
  const componentData: QuartzComponentProps = {
    ctx,
    fileData: file.data,
    externalResources,
    cfg,
    children: [],
    tree,
    allFiles,
  }

  const content = renderPage(cfg, slug, componentData, opts, externalResources)
  return write({
    ctx,
    content,
    slug: file.data.slug!,
    ext: ".html",
  })
}

export const TagPage: QuartzEmitterPlugin<Partial<TagPageOptions>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: TagContent({ sort: userOpts?.sort }),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "TagPage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data)

      for (const loc of SITE_LOCALES) {
        const localeFiles = allFiles.filter((f) => slugBelongsToLocale(f.slug!, loc))
        // Skip emitting empty locale trees (future ja/de before content exists)
        if (localeFiles.length === 0 && loc.prefix) continue

        const [tags, tagDescriptions] = computeTagInfo(localeFiles, content, loc)
        const ordered = [...tags].sort((a, b) => Number(a === "index") - Number(b === "index"))
        for (const tag of ordered) {
          yield processTagPage(ctx, tag, tagDescriptions[tag], allFiles, opts, resources)
        }
      }
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      // Full rebuild of affected locale tag pages is cheap enough; reuse emit logic.
      const allFiles = content.map((c) => c[1].data)
      const touchedLocales = new Set<string>()

      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue
        const slug = changeEvent.file.data.slug!
        for (const loc of SITE_LOCALES) {
          const tagsPrefix = loc.prefix ? `${loc.prefix}/tags` : "tags"
          if (
            slug === tagsPrefix ||
            slug.startsWith(tagsPrefix + "/") ||
            slugBelongsToLocale(slug, loc)
          ) {
            touchedLocales.add(loc.code)
          }
        }
      }

      for (const loc of SITE_LOCALES) {
        if (!touchedLocales.has(loc.code)) continue
        const localeFiles = allFiles.filter((f) => slugBelongsToLocale(f.slug!, loc))
        if (localeFiles.length === 0 && loc.prefix) continue
        const [tags, tagDescriptions] = computeTagInfo(localeFiles, content, loc)
        const ordered = [...tags].sort((a, b) => Number(a === "index") - Number(b === "index"))
        for (const tag of ordered) {
          yield processTagPage(ctx, tag, tagDescriptions[tag], allFiles, opts, resources)
        }
      }
    },
  }
}
