import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { FullPageLayout } from "../../cfg"
import { FullSlug, RelativeURL, pathToRoot } from "../../util/path"
import { sharedPageComponents } from "../../../quartz.layout"
import { NotFound } from "../../components"
import { defaultProcessedContent } from "../vfile"
import { write } from "./helpers"
import { i18n, TRANSLATIONS, ValidLocale } from "../../i18n"
import { SITE_LOCALES } from "../../i18n/siteLocales"

/**
 * Cloudflare Pages serves root /404.html for unknown URLs at any depth.
 * Root copy uses absolute "/" asset prefixes so /en/missing still loads CSS/JS.
 * NotFound rewrites visible strings from pathname (/en/… → English).
 * Prefixed copies (en/404) exist for direct visits / language-switch targets.
 */
export const NotFoundPage: QuartzEmitterPlugin = () => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    pageBody: NotFound(),
    beforeBody: [],
    left: [],
    right: [],
  }

  const { head: Head, pageBody, footer: Footer } = opts
  const Body = BodyConstructor()

  return {
    name: "404Page",
    getQuartzComponents() {
      return [Head, Body, pageBody, Footer]
    },
    async *emit(ctx, _content, resources) {
      const cfg = ctx.cfg.configuration

      for (const loc of SITE_LOCALES) {
        const ui = (loc.quartzLocale in TRANSLATIONS ? loc.quartzLocale : "en-US") as ValidLocale
        const slug = (loc.prefix ? `${loc.prefix}/404` : "404") as FullSlug
        const notFound = i18n(ui).pages.error.title
        const [tree, vfile] = defaultProcessedContent({
          slug,
          text: notFound,
          description: notFound,
          frontmatter: { title: notFound, tags: [], lang: loc.code },
        })
        // Root 404: absolute asset paths. Prefixed: normal relative pathToRoot.
        const resourceBase = (
          loc.prefix ? pathToRoot(slug) : ("/" as RelativeURL)
        ) as FullSlug | RelativeURL
        const externalResources = pageResources(resourceBase, resources)
        const componentData: QuartzComponentProps = {
          ctx,
          fileData: vfile.data,
          externalResources,
          cfg,
          children: [],
          tree,
          allFiles: [],
        }

        yield write({
          ctx,
          content: renderPage(cfg, slug, componentData, opts, externalResources),
          slug,
          ext: ".html",
        })
      }
    },
    async *partialEmit() {},
  }
}
