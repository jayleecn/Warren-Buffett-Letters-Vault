import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, pathToRoot, simplifySlug, joinSegments } from "../util/path"
import translations from "../i18n/translations.json"

type TranslationMap = Record<string, { zh?: string; en?: string }>
const map = translations as TranslationMap

function isEnglishSlug(slug: string): boolean {
  return slug === "en" || slug === "en/index" || slug.startsWith("en/")
}

function hrefForSlug(currentSlug: FullSlug, targetSlug: string): string {
  // targetSlug is already quartz-sluggified (spaces -> -)
  const full = targetSlug as FullSlug
  return joinSegments(pathToRoot(currentSlug), simplifySlug(full))
}

const LanguageSwitcher: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const slug = fileData.slug!
  const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
  const i18nKey = typeof fm.i18nKey === "string" ? fm.i18nKey : undefined
  const fmTranslations = fm.translations as { zh?: string; en?: string } | undefined

  let zhSlug = fmTranslations?.zh
  let enSlug = fmTranslations?.en

  if (i18nKey && map[i18nKey]) {
    zhSlug = zhSlug || map[i18nKey].zh
    enSlug = enSlug || map[i18nKey].en
  }

  // Heuristic fallback
  if (!zhSlug || !enSlug) {
    if (isEnglishSlug(slug)) {
      enSlug = enSlug || simplifySlug(slug)
      // strip leading en/
      const stripped = simplifySlug(slug).replace(/^en\/?/, "") || "index"
      zhSlug = zhSlug || (stripped === "index" || stripped === "" ? "index" : stripped)
    } else {
      zhSlug = zhSlug || simplifySlug(slug)
      enSlug = enSlug || (simplifySlug(slug) === "index" || simplifySlug(slug) === "" ? "en/index" : joinSegments("en", simplifySlug(slug)))
    }
  }

  // Normalize index home
  if (zhSlug === "index" || zhSlug === "" || zhSlug === "/") zhSlug = "index"
  if (enSlug === "en" || enSlug === "en/") enSlug = "en/index"

  const onEn = isEnglishSlug(slug)
  const zhHref = hrefForSlug(slug, zhSlug!)
  const enHref = hrefForSlug(slug, enSlug!)

  return (
    <nav class={classNames(displayClass, "language-switcher")} aria-label="Language">
      <a href={zhHref} class={onEn ? undefined : "is-active"} hreflang="zh-CN" lang="zh-CN">
        中文
      </a>
      <span class="lang-sep" aria-hidden="true">
        |
      </span>
      <a href={enHref} class={onEn ? "is-active" : undefined} hreflang="en" lang="en">
        English
      </a>
    </nav>
  )
}

LanguageSwitcher.css = `
.language-switcher {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  line-height: 1;
  flex-shrink: 0;
  margin: 0 0.15rem;
}
.language-switcher a {
  color: var(--darkgray);
  text-decoration: none;
  opacity: 0.75;
}
.language-switcher a:hover {
  color: var(--secondary);
  opacity: 1;
}
.language-switcher a.is-active {
  color: var(--dark);
  opacity: 1;
  font-weight: 600;
}
.language-switcher .lang-sep {
  color: var(--gray);
  opacity: 0.8;
}
`

export default (() => LanguageSwitcher) satisfies QuartzComponentConstructor
