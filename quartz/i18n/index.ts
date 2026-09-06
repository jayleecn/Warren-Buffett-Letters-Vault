import { Translation, CalloutTranslation } from "./locales/definition"
import { localeFromSlug } from "./siteLocales"
import enUs from "./locales/en-US"
import enGb from "./locales/en-GB"
import fr from "./locales/fr-FR"
import it from "./locales/it-IT"
import ja from "./locales/ja-JP"
import de from "./locales/de-DE"
import nl from "./locales/nl-NL"
import ro from "./locales/ro-RO"
import ca from "./locales/ca-ES"
import es from "./locales/es-ES"
import ar from "./locales/ar-SA"
import uk from "./locales/uk-UA"
import ru from "./locales/ru-RU"
import ko from "./locales/ko-KR"
import zh from "./locales/zh-CN"
import zhTw from "./locales/zh-TW"
import vi from "./locales/vi-VN"
import pt from "./locales/pt-BR"
import hu from "./locales/hu-HU"
import fa from "./locales/fa-IR"
import pl from "./locales/pl-PL"
import cs from "./locales/cs-CZ"
import tr from "./locales/tr-TR"
import th from "./locales/th-TH"
import lt from "./locales/lt-LT"
import fi from "./locales/fi-FI"
import no from "./locales/nb-NO"
import id from "./locales/id-ID"
import kk from "./locales/kk-KZ"
import he from "./locales/he-IL"

export const TRANSLATIONS = {
  "en-US": enUs,
  "en-GB": enGb,
  "fr-FR": fr,
  "it-IT": it,
  "ja-JP": ja,
  "de-DE": de,
  "nl-NL": nl,
  "nl-BE": nl,
  "ro-RO": ro,
  "ro-MD": ro,
  "ca-ES": ca,
  "es-ES": es,
  "ar-SA": ar,
  "ar-AE": ar,
  "ar-QA": ar,
  "ar-BH": ar,
  "ar-KW": ar,
  "ar-OM": ar,
  "ar-YE": ar,
  "ar-IR": ar,
  "ar-SY": ar,
  "ar-IQ": ar,
  "ar-JO": ar,
  "ar-PL": ar,
  "ar-LB": ar,
  "ar-EG": ar,
  "ar-SD": ar,
  "ar-LY": ar,
  "ar-MA": ar,
  "ar-TN": ar,
  "ar-DZ": ar,
  "ar-MR": ar,
  "uk-UA": uk,
  "ru-RU": ru,
  "ko-KR": ko,
  "zh-CN": zh,
  "zh-TW": zhTw,
  "vi-VN": vi,
  "pt-BR": pt,
  "hu-HU": hu,
  "fa-IR": fa,
  "pl-PL": pl,
  "cs-CZ": cs,
  "tr-TR": tr,
  "th-TH": th,
  "lt-LT": lt,
  "fi-FI": fi,
  "nb-NO": no,
  "id-ID": id,
  "kk-KZ": kk,
  "he-IL": he,
} as const

export const defaultTranslation = "en-US"
export const i18n = (locale: ValidLocale): Translation => TRANSLATIONS[locale ?? defaultTranslation]
export type ValidLocale = keyof typeof TRANSLATIONS
export type ValidCallout = keyof CalloutTranslation

/** Pick UI locale from page slug / frontmatter; keeps zh-CN default for Chinese root. */
export function resolvePageLocale(
  slug: string,
  frontmatterLang: string | undefined,
  fallback: ValidLocale = "zh-CN",
): ValidLocale {
  const fm = (frontmatterLang || "").toLowerCase()
  const fmMap: Record<string, ValidLocale> = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
    ja: "ja-JP",
    de: "de-DE",
    fr: "fr-FR",
    zh: "zh-CN",
  }
  for (const [code, loc] of Object.entries(fmMap)) {
    if (fm === code || fm.startsWith(`${code}-`)) {
      return loc in TRANSLATIONS ? loc : defaultTranslation
    }
  }

  // Prefixed content trees — driven by siteLocales (en/es/pt/ja/…)
  const siteLoc = localeFromSlug(slug)
  const quartz = siteLoc.quartzLocale as ValidLocale
  if (quartz in TRANSLATIONS) return quartz

  return fallback in TRANSLATIONS ? fallback : defaultTranslation
}

