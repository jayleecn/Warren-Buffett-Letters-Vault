import { pathToRoot, resolveRelative, FullSlug } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { localeFromSlug, homeSlugForLocale } from "../i18n/siteLocales"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const slug = fileData.slug!
  const loc = localeFromSlug(slug)
  // Prefixed locales (en/ja/…) return to their own home; default zh uses site root
  const baseDir = loc.prefix
    ? resolveRelative(slug, homeSlugForLocale(loc) as FullSlug)
    : pathToRoot(slug)
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir}>{title}</a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
