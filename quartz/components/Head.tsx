import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"
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

    const slug = fileData.slug ?? ""
    const isHome = slug === "index" || slug === "" || slug === "404"
    const keywords = (fileData.frontmatter?.keywords as string[] | undefined) ?? []

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page, normalize home to root for better SEO
    let socialUrl =
      fileData.slug === "404"
        ? url.toString()
        : joinSegments(url.toString(), fileData.slug!)
    if ((isHome || slug === "index") && !fileData.slug?.includes("404")) {
      socialUrl = url.toString().replace(/\/$/, "")
    }

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

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

        {/* Canonical URL for SEO */}
        <link rel="canonical" href={socialUrl} />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
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
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        {/* Additional SEO optimizations for homepage: keywords, hreflang, structured data */}
        {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}

        {cfg.baseUrl && (
          <>
            <link rel="alternate" hrefLang="zh-CN" href={`https://${cfg.baseUrl}/`} />
            <link rel="alternate" hrefLang="en" href={`https://${cfg.baseUrl}/en/`} />
            <link rel="alternate" hrefLang="zh-TW" href={`https://${cfg.baseUrl}/zh-tw/`} />
            <link rel="alternate" hrefLang="es" href={`https://${cfg.baseUrl}/es/`} />
            <link rel="alternate" hrefLang="pt-BR" href={`https://${cfg.baseUrl}/pt/`} />
            <link rel="alternate" hrefLang="ja" href={`https://${cfg.baseUrl}/ja/`} />
            <link rel="alternate" hrefLang="x-default" href={`https://${cfg.baseUrl}/`} />
          </>
        )}

        {isHome && cfg.baseUrl && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: cfg.pageTitle,
                url: `https://${cfg.baseUrl}`,
                description,
                inLanguage: cfg.locale,
                publisher: {
                  "@type": "Organization",
                  name: cfg.pageTitle,
                  url: `https://${cfg.baseUrl}`,
                  logo: `https://${cfg.baseUrl}/static/icon.png`,
                },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `https://${cfg.baseUrl}/?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
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
