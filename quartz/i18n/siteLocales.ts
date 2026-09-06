/**
 * Site content languages. Add ja/de/fr here later — Explorer, locale UI,
 * LanguageSwitcher, and path helpers all read from this list.
 *
 * Convention: default locale (zh) lives at content root; others under content/{prefix}/.
 */
export type SiteLocaleCode = "zh" | "en" | "ja" | "de" | "fr"

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
