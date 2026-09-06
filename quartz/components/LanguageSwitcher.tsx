import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { FullSlug, simplifySlug, joinSegments } from "../util/path"
import translations from "../i18n/translations.json"
import {
  SITE_LOCALES,
  SiteLocaleCode,
  localeFromSlug,
  homeSlugForLocale,
  stripLocalePrefix,
  parseTagSlug,
  tagSlugForLocale,
} from "../i18n/siteLocales"

/** Per-locale path map on each i18nKey (extensible beyond zh/en). */
type LocalePaths = Partial<Record<SiteLocaleCode, string>>
type TranslationMap = Record<string, LocalePaths>
const map = translations as TranslationMap

/** Root-absolute href so SPA navigations from /ja|/es|/en never resolve relative to the wrong depth. */
function hrefForSlug(_currentSlug: FullSlug, targetSlug: string): string {
  const simple = simplifySlug(targetSlug as FullSlug)
  if (!simple || simple === "index" || simple === ".") return "/"
  return "/" + simple.replace(/^\/+/, "")
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

function normalizeTarget(target: string): string {
  const cleaned = target.replace(/\/+$/, "")
  for (const loc of SITE_LOCALES) {
    if (loc.prefix && (cleaned === loc.prefix || target === loc.prefix + "/")) {
      return loc.prefix + "/index"
    }
  }
  if (target === "" || target === "/") return "index"
  return target
}

/** Best-effort counterpart path when translations map has no entry yet. */
function fallbackSlug(simple: string, from: SiteLocaleCode, to: (typeof SITE_LOCALES)[number]): string {
  if (from === to.code) return simple === "" ? homeSlugForLocale(to) : simple

  // Tag pages: names differ across languages (投资概念 vs investment-concept).
  // Never invent a mapped tag — degrade to the target locale's tag index.
  if (parseTagSlug(simple)) {
    return tagSlugForLocale("index", to)
  }

  let rest = stripLocalePrefix(simple)
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

  const options = SITE_LOCALES.map((loc) => {
    const target = normalizeTarget(paths[loc.code] || fallbackSlug(simple, current.code, loc))
    return {
      loc,
      href: hrefForSlug(slug, target),
      active: loc.code === current.code,
    }
  })

  return (
    <nav class={classNames(displayClass, "language-switcher")} aria-label="Language">
      <label class="language-switcher-label" for="language-select">
        <span class="language-switcher-globe" aria-hidden="true">
          文A
        </span>
        <span class="sr-only">Language</span>
      </label>
      <select id="language-select" class="language-select" aria-label="Language">
        {options.map((item) => (
          <option value={item.href} selected={item.active} lang={item.loc.hreflang}>
            {item.loc.label}
          </option>
        ))}
      </select>
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
}
.language-switcher-label {
  display: inline-flex;
  align-items: center;
  color: var(--darkgray);
  cursor: default;
}
.language-switcher-globe {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.7;
  letter-spacing: -0.05em;
}
.language-select {
  font: inherit;
  font-size: 0.85rem;
  color: var(--dark);
  background: var(--light);
  border: 1px solid var(--lightgray);
  border-radius: 4px;
  padding: 0.25rem 0.4rem;
  cursor: pointer;
  max-width: 9rem;
}
.language-select:hover,
.language-select:focus {
  border-color: var(--secondary);
  outline: none;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

LanguageSwitcher.afterDOMLoaded = `
;(function () {
  const LANG_KEY = "buffett-lang"
  const HOMES = {
    zh: "/",
    en: "/en/",
    "zh-tw": "/zh-tw/",
    es: "/es/",
    pt: "/pt/",
    ja: "/ja/",
  }
  // Longest first for hyphenated prefixes
  const PREFIXES = ["zh-tw", "en", "es", "pt", "ja"]

  function getPref() {
    try {
      const ls = localStorage.getItem(LANG_KEY)
      if (ls) return ls
    } catch (e) {}
    const m = document.cookie.match(/(?:^|; )buffett-lang=([^;]*)/)
    return m ? decodeURIComponent(m[1]) : null
  }

  function setPref(code) {
    try { localStorage.setItem(LANG_KEY, code) } catch (e) {}
    document.cookie = LANG_KEY + "=" + encodeURIComponent(code) + ";path=/;max-age=31536000;SameSite=Lax"
  }

  function localeFromHref(href) {
    try {
      let path = new URL(href, window.location.origin).pathname
      path = path.replace(new RegExp("/+$"), "") || "/"
      for (const p of PREFIXES) {
        if (path === "/" + p || path.startsWith("/" + p + "/")) return p
      }
      return "zh"
    } catch (e) {
      return "zh"
    }
  }

  function detectBrowserLang() {
    const langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || "en"]
    for (const raw of langs) {
      const l = String(raw || "").toLowerCase()
      if (!l) continue
      if (l.startsWith("zh")) {
        if (l.includes("tw") || l.includes("hk") || l.includes("mo") || l.includes("hant")) return "zh-tw"
        return "zh"
      }
      if (l.startsWith("en")) return "en"
      if (l.startsWith("es")) return "es"
      if (l.startsWith("pt")) return "pt"
      if (l.startsWith("ja")) return "ja"
    }
    return "en"
  }

  function go(href, replace) {
    const url = new URL(href, window.location.toString())
    if (typeof window.spaNavigate === "function" && !replace) {
      window.spaNavigate(url)
    } else if (replace) {
      window.location.replace(url.toString())
    } else {
      window.location.assign(url.toString())
    }
  }

  function maybeAutoLangRedirect() {
    const path = window.location.pathname
    if (path !== "/" && path !== "/index.html") return
    let pref = getPref()
    if (!pref || !(pref in HOMES)) {
      pref = detectBrowserLang()
      setPref(pref)
    }
    const home = HOMES[pref] || "/en/"
    if (home === "/" || home === path) return
    go(home, true)
  }

  document.addEventListener("nav", () => {
    const selects = document.querySelectorAll("select.language-select")
    for (const sel of selects) {
      const el = sel
      const handler = (e) => {
        const href = e.target.value
        if (!href) return
        setPref(localeFromHref(href))
        go(href, false)
      }
      el.addEventListener("change", handler)
      window.addCleanup && window.addCleanup(() => el.removeEventListener("change", handler))
    }
    maybeAutoLangRedirect()
  })
})();
`

export default (() => LanguageSwitcher) satisfies QuartzComponentConstructor
