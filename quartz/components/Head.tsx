import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"
import {
  SITE_LOCALES,
  SiteLocaleCode,
  homeSlugForLocale,
} from "../i18n/siteLocales"
import translations from "../i18n/translations.json"

type LocalePaths = Partial<Record<SiteLocaleCode, string>>
type TranslationMap = Record<string, LocalePaths>
const translationMap = translations as TranslationMap

/** Canonical: locale homes use trailing slash; other pages do not. */
function canonicalUrl(baseUrl: string, slug: string): string {
  const base = `https://${baseUrl}`
  if (slug === "404") return `${base}/404.html`
  if (slug === "index" || slug === "") return `${base}/`
  if (slug.endsWith("/index")) return `${base}/${slug.slice(0, -"/index".length)}/`
  return `${base}/${slug}`
}

function resolveAlternates(fileData: QuartzComponentProps["fileData"]): LocalePaths {
  const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
  const i18nKey = typeof fm.i18nKey === "string" ? fm.i18nKey : undefined
  const fmTranslations = (fm.translations ?? {}) as LocalePaths
  let paths: LocalePaths = { ...fmTranslations }
  if (i18nKey && translationMap[i18nKey]) {
    paths = { ...translationMap[i18nKey], ...paths }
  }
  return paths
}

function ogImageMime(imagePath: string): string {
  const ext = (getFileExtension(imagePath) ?? "png").replace(/^\./, "")
  return `image/${ext}`
}

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const slug = fileData.slug ?? "index"
    const isNotFound = slug === "404"
    const isLocaleHome = slug === "index" || slug.endsWith("/index")
    const keywords = (fileData.frontmatter?.keywords as string[] | undefined) ?? []

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = isNotFound ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    const socialUrl = cfg.baseUrl ? canonicalUrl(cfg.baseUrl, slug) : url.toString()

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`
    const alternates = resolveAlternates(fileData)
    const hasPageAlternates = SITE_LOCALES.some((loc) => !!alternates[loc.code])

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {isNotFound && <meta name="robots" content="noindex, nofollow" />}
        {cfg.baseUrl && !isNotFound && <link rel="canonical" href={socialUrl} />}

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content={isLocaleHome ? "website" : "article"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta property="og:image:type" content={ogImageMime(ogImageDefaultPath)} />
          </>
        )}

        {cfg.baseUrl && !isNotFound && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}

        {cfg.baseUrl &&
          (hasPageAlternates
            ? SITE_LOCALES.filter((loc) => alternates[loc.code]).map((loc) => (
                <link
                  rel="alternate"
                  hrefLang={loc.hreflang}
                  href={canonicalUrl(cfg.baseUrl!, alternates[loc.code]!)}
                />
              ))
            : isLocaleHome
              ? SITE_LOCALES.map((loc) => (
                  <link
                    rel="alternate"
                    hrefLang={loc.hreflang}
                    href={canonicalUrl(cfg.baseUrl!, homeSlugForLocale(loc))}
                  />
                ))
              : null)}

        {cfg.baseUrl && (hasPageAlternates || isLocaleHome) && (
          <link
            rel="alternate"
            hrefLang="x-default"
            href={canonicalUrl(
              cfg.baseUrl,
              (hasPageAlternates
                ? (alternates.zh ?? alternates.en ?? Object.values(alternates).find(Boolean))
                : undefined) ?? "index",
            )}
          />
        )}

        {isLocaleHome && cfg.baseUrl && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: title,
                url: socialUrl,
                description,
                inLanguage:
                  SITE_LOCALES.find((l) => homeSlugForLocale(l) === slug)?.hreflang ?? cfg.locale,
                publisher: {
                  "@type": "Organization",
                  name: cfg.pageTitle,
                  url: `https://${cfg.baseUrl}/`,
                  logo: `https://${cfg.baseUrl}/static/icon.png`,
                },
              }),
            }}
          />
        )}

        {!isLocaleHome && !isNotFound && cfg.baseUrl && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: title,
                description,
                url: socialUrl,
                image: ogImageDefaultPath,
                inLanguage: cfg.locale,
                isPartOf: {
                  "@type": "WebSite",
                  name: cfg.pageTitle,
                  url: `https://${cfg.baseUrl}/`,
                },
              }),
            }}
          />
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
