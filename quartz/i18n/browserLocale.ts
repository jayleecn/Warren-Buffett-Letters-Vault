import { SITE_LOCALES, type SiteLocaleCode } from "./siteLocales";

export const LANGUAGE_PREFERENCE_KEY = "buffett-language-preference";

export function supportedLocale(
  value: string | null,
): SiteLocaleCode | undefined {
  return SITE_LOCALES.find((locale) => locale.code === value)?.code;
}

/** Browser language negotiation is separate from the Chinese content-root default. */
export function browserLocale(languages: readonly string[]): SiteLocaleCode {
  for (const language of languages) {
    try {
      const locale = new Intl.Locale(language);
      if (locale.language === "zh") {
        if (locale.script === "Hant") return "zh-tw";
        if (locale.script === "Hans") return "zh";
        return ["TW", "HK", "MO"].includes(locale.region ?? "")
          ? "zh-tw"
          : "zh";
      }
      const supported = supportedLocale(locale.language);
      if (supported) return supported;
    } catch {
      // Ignore malformed/empty browser values and continue through preferences.
    }
  }
  return "en";
}

export function localeHome(code: SiteLocaleCode): string {
  const prefix = SITE_LOCALES.find((locale) => locale.code === code)?.prefix;
  return prefix ? `/${prefix}/` : "/";
}
