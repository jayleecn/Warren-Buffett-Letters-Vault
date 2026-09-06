/**
 * Site content languages. Add ja/de/fr here later — Explorer, locale UI,
 * LanguageSwitcher, tags, and path helpers all read from this list.
 *
 * Convention: default locale (zh) lives at content root; others under content/{prefix}/.
 */
export type SiteLocaleCode = "zh" | "en" | "es" | "ja" | "de" | "fr"

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
  { code: "zh", label: "中文", hreflang: "zh-CN", quartzLocale: "zh-CN", prefix: null },
  { code: "en", label: "English", hreflang: "en", quartzLocale: "en-US", prefix: "en" },
  { code: "es", label: "Español", hreflang: "es", quartzLocale: "es-ES", prefix: "es" },
  // Enable when content exists:
  // { code: "ja", label: "日本語", hreflang: "ja", quartzLocale: "ja-JP", prefix: "ja" },
  // { code: "de", label: "Deutsch", hreflang: "de", quartzLocale: "de-DE", prefix: "de" },
  // { code: "fr", label: "Français", hreflang: "fr", quartzLocale: "fr-FR", prefix: "fr" },
] as const

export const DEFAULT_LOCALE = SITE_LOCALES[0]

export function localePrefixes(): string[] {
  return SITE_LOCALES.map((l) => l.prefix).filter((p): p is string => !!p)
}

/** Detect content language from a Quartz full slug. */
export function localeFromSlug(slug: string): SiteLocale {
  for (const loc of SITE_LOCALES) {
    if (!loc.prefix) continue
    if (slug === loc.prefix || slug === `${loc.prefix}/index` || slug.startsWith(`${loc.prefix}/`)) {
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
  for (const loc of SITE_LOCALES) {
    if (!loc.prefix) continue
    if (slug === loc.prefix || slug === `${loc.prefix}/index`) return "index"
    if (slug.startsWith(`${loc.prefix}/`)) return slug.slice(loc.prefix.length + 1)
  }
  return slug
}

/**
 * Tag listing slug for a locale.
 * zh: tags/{tag}   en: en/tags/{tag}
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
  for (const loc of SITE_LOCALES) {
    if (!loc.prefix) continue
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
