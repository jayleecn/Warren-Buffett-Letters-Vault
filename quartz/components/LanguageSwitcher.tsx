import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, pathToRoot, simplifySlug, joinSegments } from "../util/path"
import translations from "../i18n/translations.json"
import { SITE_LOCALES, SiteLocaleCode, localeFromSlug, homeSlugForLocale } from "../i18n/siteLocales"

/** Per-locale path map on each i18nKey (extensible beyond zh/en). */
type LocalePaths = Partial<Record<SiteLocaleCode, string>>
type TranslationMap = Record<string, LocalePaths>
const map = translations as TranslationMap

function hrefForSlug(currentSlug: FullSlug, targetSlug: string): string {
  const full = targetSlug as FullSlug
  return joinSegments(pathToRoot(currentSlug), simplifySlug(full))
}

function lookupBySlug(simple: string): LocalePaths | undefined {
  for (const pair of Object.values(map)) {
    for (const path of Object.values(pair)) {
      if (!path) continue
      if (path === simple || simplifySlug(path as FullSlug) === simple) return pair
    }
  }
  return undefined
}

/** Best-effort counterpart path when translations map has no entry yet. */
function fallbackSlug(simple: string, from: SiteLocaleCode, to: (typeof SITE_LOCALES)[number]): string {
  if (from === to.code) return simple === "" ? homeSlugForLocale(to) : simple

  // strip known prefixes
  let rest = simple
  for (const loc of SITE_LOCALES) {
    if (!loc.prefix) continue
    if (rest === loc.prefix) {
      rest = ""
      break
    }
    if (rest.startsWith(loc.prefix + "/")) {
      rest = rest.slice(loc.prefix.length + 1)
      break
    }
  }
  if (rest === "index") rest = ""

  if (!to.prefix) {
    return rest === "" ? "index" : rest
  }
  return rest === "" ? `${to.prefix}/index` : joinSegments(to.prefix, rest)
}

const LanguageSwitcher: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const slug = fileData.slug!
  const simple = simplifySlug(slug)
  const current = localeFromSlug(slug)
  const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
  const i18nKey = typeof fm.i18nKey === "string" ? fm.i18nKey : undefined
  const fmTranslations = (fm.translations ?? {}) as LocalePaths

  let paths: LocalePaths = { ...fmTranslations }
  if (i18nKey && map[i18nKey]) {
    paths = { ...map[i18nKey], ...paths }
  }
  if (Object.keys(paths).length < 2) {
    const found = lookupBySlug(simple)
    if (found) paths = { ...found, ...paths }
  }

  // Only show locales that are enabled in SITE_LOCALES (adding ja later = one config line)
  const links = SITE_LOCALES.map((loc) => {
    const target =
      paths[loc.code] ||
      fallbackSlug(simple, current.code, loc)
    const normalized =
      target === "en" || target === "en/"
        ? "en/index"
        : target === "" || target === "/"
          ? "index"
          : target
    return {
      loc,
      href: hrefForSlug(slug, normalized),
      active: loc.code === current.code,
    }
  })

  return (
    <nav class={classNames(displayClass, "language-switcher")} aria-label="Language">
      {links.map((item, i) => (
        <>
          {i > 0 && (
            <span class="lang-sep" aria-hidden="true">
              |
            </span>
          )}
          <a
            href={item.href}
            class={item.active ? "is-active" : undefined}
            hreflang={item.loc.hreflang}
            lang={item.loc.hreflang}
          >
            {item.loc.label}
          </a>
        </>
      ))}
    </nav>
  )
}

LanguageSwitcher.css = `
.language-switcher {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  font-size: 0.85rem;
  line-height: 1;
  flex-shrink: 0;
  white-space: nowrap;
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

/* Breadcrumb row: crumbs left, languages right */
.flex-component:has(> div .breadcrumb-container) {
  width: 100%;
  align-items: center;
  margin-bottom: 0.5rem;
}
.flex-component:has(> div .breadcrumb-container) .breadcrumb-container {
  margin-bottom: 0;
}
`

export default (() => LanguageSwitcher) satisfies QuartzComponentConstructor
