import test from "node:test";
import assert from "node:assert/strict";
import { canonicalUrl, isLocaleHome, sitemapLastmod } from "./seo";
import { publishedLinkResolver, resolveRenderedLinks } from "./publishedLinks";

test("canonical URLs agree for home, folders and Unicode article paths", () => {
  assert.equal(canonicalUrl("example.com", "index"), "https://example.com/");
  assert.equal(
    canonicalUrl("example.com", "en/index"),
    "https://example.com/en/",
  );
  assert.equal(canonicalUrl("example.com", "en/"), "https://example.com/en/");
  assert.equal(
    canonicalUrl("example.com", "03/浮存金"),
    "https://example.com/03/%E6%B5%AE%E5%AD%98%E9%87%91",
  );
  assert.equal(isLocaleHome("en/tags/index"), false);
  assert.equal(isLocaleHome("zh-tw/index"), true);
});

test("sitemap refuses historical, invalid and future page modification dates", () => {
  for (const date of [
    undefined,
    new Date("invalid"),
    new Date("1956-05-01"),
    new Date("2999-01-01"),
  ]) {
    assert.equal(sitemapLastmod(date), undefined);
  }
  assert.equal(
    sitemapLastmod(new Date("2026-04-06")),
    "2026-04-06T00:00:00.000Z",
  );
});

test("published links use canonical paths, local aliases and never ambiguous guesses", () => {
  const resolve = publishedLinkResolver([
    { slug: "en/03/Float", aliases: ["en/Float"] },
    { slug: "03/浮存金", aliases: ["浮存金"] },
    { slug: "en/04/Apple" },
    { slug: "en/05/Apple" },
  ]);
  assert.equal(resolve("en/Float", "en/index"), "en/03/Float");
  assert.equal(resolve("Float", "en/index"), "en/03/Float");
  assert.equal(resolve("Float", "index"), undefined);
  assert.equal(resolve("Apple", "en/index"), undefined);
  assert.equal(resolve("雪佛龙", "index"), undefined);
  assert.equal(resolve("en/tags/investing", "en/index"), "en/tags/investing");
  assert.equal(resolve("static/icon.png", "index"), "static/icon.png");
});

test("an unwritten target can become a link on the next render without reparsing the source", () => {
  const original = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "a",
        properties: { href: "./Missing", "data-slug": "en/Missing" },
        children: [{ type: "text", value: "Missing" }],
      },
    ],
  } as import("hast").Root;
  const first = structuredClone(original);
  resolveRenderedLinks(
    first,
    "en/index" as import("./path").FullSlug,
    publishedLinkResolver([{ slug: "en/index" }]),
  );
  assert.equal((first.children[0] as import("hast").Element).tagName, "span");
  const second = structuredClone(original);
  resolveRenderedLinks(
    second,
    "en/index" as import("./path").FullSlug,
    publishedLinkResolver([{ slug: "en/index" }, { slug: "en/Missing" }]),
  );
  assert.equal((second.children[0] as import("hast").Element).tagName, "a");
  assert.equal((original.children[0] as import("hast").Element).tagName, "a");
});
