import { Root } from "hast";
import { visit } from "unist-util-visit";
import { FullSlug, resolveRelative, simplifySlug } from "./path";
import { QuartzPluginData } from "../plugins/vfile";
import { localeFromSlug, parseTagSlug } from "../i18n/siteLocales";

type Page = { slug: string; aliases?: string[] };
const normalize = (slug: string) =>
  slug.replace(/^\/+|\/+$/g, "").replace(/(?:^|\/)index$/, "");

/** Resolve only published pages, preferring exact paths and unambiguous local aliases. */
export function publishedLinkResolver(pages: Page[]) {
  const targets = new Map<string, string>();
  const names = new Map<string, Set<string>>();
  for (const page of pages) {
    targets.set(normalize(page.slug), page.slug);
    for (const path of [page.slug, ...(page.aliases ?? [])]) {
      const name = `${localeFromSlug(page.slug).code}:${path.split("/").at(-1)}`;
      const matches = names.get(name) ?? new Set<string>();
      matches.add(page.slug);
      names.set(name, matches);
    }
  }
  for (const page of pages) {
    for (const alias of page.aliases ?? []) {
      if (!targets.has(normalize(alias)))
        targets.set(normalize(alias), page.slug);
    }
  }
  return (target: string, source: string): string | undefined => {
    const direct = targets.get(normalize(target));
    if (direct) return direct;
    // Tags and assets are emitted separately. Do not invent or redirect content.
    if (parseTagSlug(target) || /\.[a-zA-Z0-9]{2,5}$/.test(target))
      return target;
    const name = `${localeFromSlug(source).code}:${target.split("/").at(-1)}`;
    const candidates = names.get(name);
    return candidates?.size === 1 ? [...candidates][0] : undefined;
  };
}

const resolvers = new WeakMap<
  QuartzPluginData[],
  ReturnType<typeof publishedLinkResolver>
>();
export function resolverForFiles(files: QuartzPluginData[]) {
  let resolve = resolvers.get(files);
  if (!resolve) {
    resolve = publishedLinkResolver(
      files.map((file) => ({ slug: file.slug!, aliases: file.aliases })),
    );
    resolvers.set(files, resolve);
  }
  return resolve;
}

/** Modify only the render copy; the parser's cached AST retains unresolved targets. */
export function resolveRenderedLinks(
  tree: Root,
  source: FullSlug,
  resolve: ReturnType<typeof publishedLinkResolver>,
) {
  visit(tree, "element", (node) => {
    if (
      node.tagName !== "a" ||
      typeof node.properties["data-slug"] !== "string"
    )
      return;
    const target = resolve(node.properties["data-slug"], source);
    if (!target) {
      node.tagName = "span";
      node.properties = {};
      return;
    }
    const href = String(node.properties.href ?? "");
    const fragment = href.includes("#") ? href.slice(href.indexOf("#")) : "";
    node.properties.href =
      resolveRelative(source, target as FullSlug) + fragment;
    node.properties["data-slug"] = target;
  });
}

const outgoingCache = new WeakMap<
  ReturnType<typeof publishedLinkResolver>,
  WeakMap<QuartzPluginData, ReturnType<typeof simplifySlug>[]>
>();

export function publishedOutgoingLinks(
  file: QuartzPluginData,
  resolve: ReturnType<typeof publishedLinkResolver>,
) {
  let cache = outgoingCache.get(resolve);
  if (!cache) {
    cache = new WeakMap();
    outgoingCache.set(resolve, cache);
  }
  const cached = cache.get(file);
  if (cached) return cached;
  const links = [
    ...new Set(
      (file.links ?? []).flatMap((link) => {
        const target = resolve(link, file.slug!);
        return target ? [simplifySlug(target as FullSlug)] : [];
      }),
    ),
  ];
  cache.set(file, links);
  return links;
}
