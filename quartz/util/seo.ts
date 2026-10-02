import { SITE_LOCALES, homeSlugForLocale } from "../i18n/siteLocales";

export function isLocaleHome(slug: string): boolean {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  return SITE_LOCALES.some((loc) =>
    [homeSlugForLocale(loc), loc.prefix ?? ""].includes(normalized),
  );
}

/** One URL policy for HTML canonicals, hreflang and XML sitemaps. */
export function canonicalUrl(base: string, slug: string): string {
  let path = slug.replace(/^\/+/, "");
  if (path === "index" || path === ".") path = "";
  else if (path.endsWith("/index")) path = path.slice(0, -5);
  else if (SITE_LOCALES.some((loc) => loc.prefix === path)) path += "/";
  return `https://${base}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function sitemapLastmod(date?: Date): string | undefined {
  // Never claim a build time or a historical letter date as a page update.
  if (
    !date ||
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() < 2000 ||
    date.getTime() > Date.now()
  )
    return undefined;
  return date.toISOString();
}
