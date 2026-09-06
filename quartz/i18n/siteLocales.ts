/**
 * Site content languages. Add de/fr here later — Explorer, locale UI,
 * LanguageSwitcher, tags, and path helpers all read from this list.
 *
 * Convention: default locale (zh Simplified) lives at content root; others under content/{prefix}/.
 * SITE_LOCALES order = language switcher order (English first). DEFAULT_LOCALE is looked up by
 * code "zh", never SITE_LOCALES[0].
 */
export type SiteLocaleCode = "zh" | "en" | "zh-tw" | "es" | "pt" | "ja" | "de" | "fr"

export type SiteLocale = {
  code: SiteLocaleCode
  /** Visible label in the language switcher */
  label: string
  hreflang: string
  /** Quartz i18n key in quartz/i18n/locales */
  quartzLocale: string
  /** URL/content folder prefix; null = site root (default language) */
  prefix: string | null
}

export const SITE_LOCALES: readonly SiteLocale[] = [
  { code: "en", label: "English", hreflang: "en", quartzLocale: "en-US", prefix: "en" },
  { code: "zh", label: "简体中文", hreflang: "zh-CN", quartzLocale: "zh-CN", prefix: null },
  { code: "zh-tw", label: "繁體中文", hreflang: "zh-TW", quartzLocale: "zh-TW", prefix: "zh-tw" },
  { code: "es", label: "Español", hreflang: "es", quartzLocale: "es-ES", prefix: "es" },
  { code: "pt", label: "Português", hreflang: "pt-BR", quartzLocale: "pt-BR", prefix: "pt" },
  { code: "ja", label: "日本語", hreflang: "ja", quartzLocale: "ja-JP", prefix: "ja" },
  // Enable when content exists:
  // { code: "de", label: "Deutsch", hreflang: "de", quartzLocale: "de-DE", prefix: "de" },
  // { code: "fr", label: "Français", hreflang: "fr", quartzLocale: "fr-FR", prefix: "fr" },
] as const

/** Simplified Chinese at content root — must NOT use SITE_LOCALES[0] (English is listed first). */
export const DEFAULT_LOCALE: SiteLocale =
  SITE_LOCALES.find((l) => l.code === "zh") ?? SITE_LOCALES[0]

/** Prefixed locales, longest prefix first (zh-tw before any bare zh if ever added). */
function prefixedLocalesLongestFirst(): SiteLocale[] {
  return SITE_LOCALES.filter((l) => !!l.prefix).sort(
    (a, b) => (b.prefix?.length ?? 0) - (a.prefix?.length ?? 0),
  )
}

export function localePrefixes(): string[] {
  return prefixedLocalesLongestFirst().map((l) => l.prefix!)
}

/** Detect content language from a Quartz full slug (longest-prefix match). */
export function localeFromSlug(slug: string): SiteLocale {
  let s = (slug || "").replace(/^\/+/, "").replace(/\/+$/, "")
  if (s.endsWith(".html")) s = s.slice(0, -5)
  if (s.endsWith("/index")) s = s.slice(0, -6)
  for (const loc of prefixedLocalesLongestFirst()) {
    const p = loc.prefix!
    if (s === p || s === `${p}/index` || s.startsWith(`${p}/`)) {
      return loc
    }
  }
  return DEFAULT_LOCALE
}

export function homeSlugForLocale(loc: SiteLocale): string {
  return loc.prefix ? `${loc.prefix}/index` : "index"
}

/** True if slug belongs to this content language tree. */
export function slugBelongsToLocale(slug: string, loc: SiteLocale): boolean {
  if (loc.prefix) {
    return slug === loc.prefix || slug === `${loc.prefix}/index` || slug.startsWith(`${loc.prefix}/`)
  }
  for (const p of localePrefixes()) {
    if (slug === p || slug === `${p}/index` || slug.startsWith(`${p}/`)) return false
  }
  return true
}

/** Strip a known locale prefix; returns path relative to that locale root. */
export function stripLocalePrefix(slug: string): string {
  for (const loc of prefixedLocalesLongestFirst()) {
    const p = loc.prefix!
    if (slug === p || slug === `${p}/index`) return "index"
    if (slug.startsWith(`${p}/`)) return slug.slice(p.length + 1)
  }
  return slug
}

/**
 * Tag listing slug for a locale.
 * zh: tags/{tag}   en: en/tags/{tag}   zh-tw: zh-tw/tags/{tag}
 * Pass tag without "tags/" prefix; use "index" for the all-tags page.
 */
export function tagSlugForLocale(tag: string, loc: SiteLocale): string {
  const cleaned = (tag || "").trim()
  const leaf =
    !cleaned || cleaned === "/" || cleaned === "index" ? "tags/index" : `tags/${cleaned}`
  return loc.prefix ? `${loc.prefix}/${leaf}` : leaf
}

/** Parse tags/... or {prefix}/tags/... slugs. */
export function parseTagSlug(slug: string): { loc: SiteLocale; tag: string } | null {
  const s = slug.replace(/\/+$/, "") // simplifySlug may leave trailing slash
  for (const loc of prefixedLocalesLongestFirst()) {
    const head = `${loc.prefix}/tags`
    if (s === head || s === `${head}/index`) {
      return { loc, tag: "/" }
    }
    if (s.startsWith(`${head}/`)) {
      const rest = s.slice(head.length + 1)
      return { loc, tag: !rest || rest === "index" ? "/" : rest }
    }
  }
  if (s === "tags" || s === "tags/index") {
    return { loc: DEFAULT_LOCALE, tag: "/" }
  }
  if (s.startsWith("tags/")) {
    const rest = s.slice("tags/".length)
    return { loc: DEFAULT_LOCALE, tag: !rest || rest === "index" ? "/" : rest }
  }
  return null
}
