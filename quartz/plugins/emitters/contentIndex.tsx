import {
  publishedOutgoingLinks,
  resolverForFiles,
} from "../../util/publishedLinks";
import { Root } from "hast";
import { GlobalConfiguration } from "../../cfg";
import {
  canonicalUrl as pageUrl,
  isLocaleHome,
  sitemapLastmod,
} from "../../util/seo";
import { escapeHTML } from "../../util/escape";
import {
  FilePath,
  FullSlug,
  SimpleSlug,
  joinSegments,
  simplifySlug,
} from "../../util/path";
import { QuartzEmitterPlugin } from "../types";
import { toHtml } from "hast-util-to-html";
import { write } from "./helpers";
import { i18n } from "../../i18n";
import {
  SITE_LOCALES,
  SiteLocaleCode,
  homeSlugForLocale,
  localeFromSlug,
} from "../../i18n/siteLocales";
import translationsJson from "../../i18n/translations.json";

type LocalePaths = Partial<Record<SiteLocaleCode, string>>;
type TranslationMap = Record<string, LocalePaths>;
const translationMap = translationsJson as TranslationMap;

function xhtmlAlternates(base: string, paths: LocalePaths): string {
  const links: string[] = [];
  for (const loc of SITE_LOCALES) {
    const target = paths[loc.code];
    if (!target) continue;
    links.push(
      `<xhtml:link rel="alternate" hreflang="${loc.hreflang}" href="${escapeHTML(pageUrl(base, target))}" />`,
    );
  }
  if (paths.zh || paths.en) {
    const def = paths.zh ?? paths.en!;
    links.push(
      `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeHTML(pageUrl(base, def))}" />`,
    );
  }
  return links.join("\n    ");
}

export type ContentIndexMap = Map<FullSlug, ContentDetails>;
export type ContentDetails = {
  slug: FullSlug;
  filePath: FilePath;
  title: string;
  links: SimpleSlug[];
  tags: string[];
  content: string;
  richContent?: string;
  date?: Date;
  description?: string;
  alternates?: LocalePaths;
};

interface Options {
  enableSiteMap: boolean;
  enableRSS: boolean;
  rssLimit?: number;
  rssFullHtml: boolean;
  rssSlug: string;
  includeEmptyFiles: boolean;
}

const defaultOptions: Options = {
  enableSiteMap: true,
  enableRSS: true,
  rssLimit: 10,
  rssFullHtml: false,
  rssSlug: "index",
  includeEmptyFiles: true,
};

function generateSiteMap(
  cfg: GlobalConfiguration,
  idx: ContentIndexMap,
): string {
  const base = cfg.baseUrl ?? "";
  const createURLEntry = (
    slug: SimpleSlug,
    content: ContentDetails,
  ): string => {
    const loc = pageUrl(base, slug);
    const alts = content.alternates
      ? xhtmlAlternates(base, content.alternates)
      : "";
    // Locale homes without explicit alternates still get the home map
    const homeAlts =
      !alts && isLocaleHome(slug)
        ? xhtmlAlternates(
            base,
            Object.fromEntries(
              SITE_LOCALES.map((l) => [l.code, homeSlugForLocale(l)]),
            ) as LocalePaths,
          )
        : "";
    const linkBlock = alts || homeAlts;
    const lastmod = sitemapLastmod(content.date);
    return `<url>
    <loc>${escapeHTML(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    ${linkBlock ? linkBlock : ""}
  </url>`;
  };
  const urls = Array.from(idx)
    .map(([slug, content]) => createURLEntry(simplifySlug(slug), content))
    .join("");
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}

function generateRSSFeed(
  cfg: GlobalConfiguration,
  idx: ContentIndexMap,
  limit?: number,
): string {
  const base = cfg.baseUrl ?? "";

  const createURLEntry = (
    slug: SimpleSlug,
    content: ContentDetails,
  ): string => `<item>
    <title>${escapeHTML(content.title)}</title>
    <link>https://${joinSegments(base, encodeURI(slug))}</link>
    <guid>https://${joinSegments(base, encodeURI(slug))}</guid>
    <description><![CDATA[ ${content.richContent ?? content.description} ]]></description>
    <pubDate>${content.date?.toUTCString()}</pubDate>
  </item>`;

  const items = Array.from(idx)
    .sort(([_, f1], [__, f2]) => {
      if (f1.date && f2.date) {
        return f2.date.getTime() - f1.date.getTime();
      } else if (f1.date && !f2.date) {
        return -1;
      } else if (!f1.date && f2.date) {
        return 1;
      }

      return f1.title.localeCompare(f2.title);
    })
    .map(([slug, content]) => createURLEntry(simplifySlug(slug), content))
    .slice(0, limit ?? idx.size)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(cfg.pageTitle)}</title>
      <link>https://${base}</link>
      <description>${!!limit ? i18n(cfg.locale).pages.rss.lastFewNotes({ count: limit }) : i18n(cfg.locale).pages.rss.recentNotes} on ${escapeHTML(
        cfg.pageTitle,
      )}</description>
      <generator>Quartz -- quartz.jzhao.xyz</generator>
      ${items}
    </channel>
  </rss>`;
}

export const ContentIndex: QuartzEmitterPlugin<Partial<Options>> = (opts) => {
  opts = { ...defaultOptions, ...opts };
  return {
    name: "ContentIndex",
    async *emit(ctx, content) {
      const resolve = resolverForFiles(content.map(([, file]) => file.data));
      const cfg = ctx.cfg.configuration;
      const linkIndex: ContentIndexMap = new Map();
      for (const [tree, file] of content) {
        const slug = file.data.slug!;
        const date = file.data.dates?.modified;
        if (
          opts?.includeEmptyFiles ||
          (file.data.text && file.data.text !== "")
        ) {
          linkIndex.set(slug, {
            slug,
            filePath: file.data.relativePath!,
            title: file.data.frontmatter?.title!,
            links: publishedOutgoingLinks(file.data, resolve),
            tags: file.data.frontmatter?.tags ?? [],
            content: file.data.text ?? "",
            richContent: opts?.rssFullHtml
              ? escapeHTML(toHtml(tree as Root, { allowDangerousHtml: true }))
              : undefined,
            date: date,
            description: file.data.description ?? "",
            alternates: (() => {
              const fm = (file.data.frontmatter ?? {}) as Record<
                string,
                unknown
              >;
              const key =
                typeof fm.i18nKey === "string" ? fm.i18nKey : undefined;
              const fromFm = (fm.translations ?? {}) as LocalePaths;
              const fromMap =
                key && translationMap[key] ? translationMap[key] : {};
              const merged = { ...fromMap, ...fromFm };
              return Object.keys(merged).length ? merged : undefined;
            })(),
          });
        }
      }

      if (opts?.enableSiteMap) {
        yield write({
          ctx,
          content: generateSiteMap(cfg, linkIndex),
          slug: "sitemap" as FullSlug,
          ext: ".xml",
        });
      }

      if (opts?.enableRSS) {
        yield write({
          ctx,
          content: generateRSSFeed(cfg, linkIndex, opts.rssLimit),
          slug: (opts?.rssSlug ?? "index") as FullSlug,
          ext: ".xml",
        });
      }

      const fp = joinSegments("static", "contentIndex") as FullSlug;
      const simplifiedIndex = Object.fromEntries(
        Array.from(linkIndex).map(([slug, content]) => {
          // remove description and from content index as nothing downstream
          // actually uses it. we only keep it in the index as we need it
          // for the RSS feed
          delete content.description;
          delete content.date;
          return [slug, content];
        }),
      );

      yield write({
        ctx,
        content: JSON.stringify(simplifiedIndex),
        slug: fp,
        ext: ".json",
      });
      // Keep the original index for cached clients; new readers load metadata only.
      const metadata = Object.fromEntries(
        Object.entries(simplifiedIndex).map(([slug, entry]) => {
          const {
            content: _content,
            richContent: _rich,
            alternates: _alternates,
            ...rest
          } = entry;
          return [slug, { ...rest, content: "" }];
        }),
      );
      yield write({
        ctx,
        content: JSON.stringify(metadata),
        slug: "static/contentIndex-meta" as FullSlug,
        ext: ".json",
      });
      for (const loc of SITE_LOCALES) {
        const entries = Object.fromEntries(
          Object.entries(simplifiedIndex).filter(
            ([slug]) => localeFromSlug(slug).code === loc.code,
          ),
        );
        yield write({
          ctx,
          content: JSON.stringify(entries),
          slug: `static/search-index/${loc.code}` as FullSlug,
          ext: ".json",
        });
      }
    },
    externalResources: (ctx) => {
      if (opts?.enableRSS) {
        return {
          additionalHead: [
            <link
              rel="alternate"
              type="application/rss+xml"
              title="RSS Feed"
              href={`https://${ctx.cfg.configuration.baseUrl}/index.xml`}
            />,
          ],
        };
      }
    },
  };
};
