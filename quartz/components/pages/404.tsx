import { i18n, TRANSLATIONS, ValidLocale } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { SITE_LOCALES, localeFromSlug } from "../../i18n/siteLocales"

type Copy = { notFound: string; home: string; homeHref: string; title: string }

function copiesForLocales(): Record<string, Copy> {
  const out: Record<string, Copy> = {}
  for (const loc of SITE_LOCALES) {
    const ui = (loc.quartzLocale in TRANSLATIONS ? loc.quartzLocale : "en-US") as ValidLocale
    out[loc.code] = {
      title: i18n(ui).pages.error.title,
      notFound: i18n(ui).pages.error.notFound,
      home: i18n(ui).pages.error.home,
      homeHref: loc.prefix ? `/${loc.prefix}/` : "/",
    }
  }
  return out
}

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  // SSR default uses site cfg; client script rewrites from pathname (/en/… → English).
  const copies = copiesForLocales()
  const fallback = copies[localeFromSlug("index").code] ?? copies.zh
  const initial = i18n(cfg.locale).pages.error

  return (
    <article
      class="popover-hint not-found"
      data-i18n-404={JSON.stringify(copies)}
    >
      <h1>404</h1>
      <p class="not-found-msg">{initial.notFound}</p>
      <a class="not-found-home" href={fallback.homeHref}>
        {initial.home}
      </a>
    </article>
  )
}

NotFound.afterDOMLoaded = `
;(function () {
  function detectCode(pathname) {
    // Longest-prefix first so zh-tw is not matched as zh
    const prefixes = ["zh-tw", "en", "es", "pt", "ja", "de", "fr"]
    for (const p of prefixes) {
      if (pathname === "/" + p || pathname.startsWith("/" + p + "/")) return p
    }
    return "zh"
  }
  function htmlLang(code) {
    if (code === "zh") return "zh-CN"
    if (code === "zh-tw") return "zh-TW"
    return code
  }
  function apply404Locale() {
    const root = document.querySelector("[data-i18n-404]")
    if (!root) return
    let copies
    try { copies = JSON.parse(root.getAttribute("data-i18n-404") || "{}") } catch { return }
    const code = detectCode(location.pathname)
    const copy = copies[code] || copies.zh
    if (!copy) return
    const msg = root.querySelector(".not-found-msg")
    const home = root.querySelector(".not-found-home")
    if (msg) msg.textContent = copy.notFound
    if (home) {
      home.textContent = copy.home
      home.setAttribute("href", copy.homeHref)
    }
    if (copy.title) document.title = copy.title
    document.documentElement.lang = htmlLang(code)
  }
  apply404Locale()
  document.addEventListener("nav", apply404Locale)
})();
`

export default (() => NotFound) satisfies QuartzComponentConstructor
