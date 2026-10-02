# Development map

This repository combines site-specific changes to Quartz with a multilingual content vault. The [source archive](https://github.com/jayleecn/Warren-Buffett-Letters-1956-2025) stores the original English Markdown/PDF documents; this repository stores the published knowledge pages and translations. There is no automated cross-repository import/sync script here.

## Find the right code

| Task | First files |
| --- | --- |
| Site URL, theme, enabled plugins | [quartz.config.ts](../quartz.config.ts) |
| Page component composition | [quartz.layout.ts](../quartz.layout.ts) |
| Content language codes and URL prefixes | [siteLocales.ts](../quartz/i18n/siteLocales.ts) |
| UI translation registration and locale resolution | [i18n/index.ts](../quartz/i18n/index.ts), [i18n/locales](../quartz/i18n/locales) |
| Language counterparts and switcher | [translations.json](../quartz/i18n/translations.json), [LanguageSwitcher.tsx](../quartz/components/LanguageSwitcher.tsx), page frontmatter |
| Explorer/search locale scoping | [explorer.inline.ts](../quartz/components/scripts/explorer.inline.ts), [search.inline.ts](../quartz/components/scripts/search.inline.ts) |
| Page titles and entry-script cache version | [renderPage.tsx](../quartz/components/renderPage.tsx) |
| Footer and breadcrumbs | [Footer.tsx](../quartz/components/Footer.tsx), [Breadcrumbs.tsx](../quartz/components/Breadcrumbs.tsx) |
| Alias redirects and wikilink resolution | [frontmatter.ts](../quartz/plugins/transformers/frontmatter.ts), [aliases.ts](../quartz/plugins/emitters/aliases.ts), [path.ts](../quartz/util/path.ts) |
| Sitemap / SEO / response cache headers | [contentIndex.tsx](../quartz/plugins/emitters/contentIndex.tsx), [Head.tsx](../quartz/components/Head.tsx), [componentResources.ts](../quartz/plugins/emitters/componentResources.ts) |

For new-language work, read [locale-tasks.md](locale-tasks.md). `SITE_LOCALES` is the server-side registry, but the two browser scripts currently keep their own `LOCALE_PREFIXES` arrays. Keep all three in sync; the checklist identifies further UI/title/content touchpoints. URL slugs normalize spaces to hyphens; a translation path such as `en/03-concepts/Owner-Earnings` maps to the source file `content/en/03-concepts/Owner Earnings.md`.

## Find the right content

Simplified Chinese is at `content/`; other trees are `content/en/`, `content/zh-tw/`, `content/es/`, `content/pt/`, and `content/ja/`. Each published tree has 194 pages: 91 letters, 38 concepts, 52 companies, 8 people, and 5 home/index pages. `content/templates/` contains five authoring templates and is excluded by `ignorePatterns` in `quartz.config.ts`.

Start from the relevant language's `01-index/`, then search just the needed `02-letters/`, `03-concepts/`, `04-companies/`, or `05-people/` directory. For example:

```bash
rg -n 'Munger' content/en/02-letters
rg -n 'i18nKey: concept/owner-earnings' content -g '*.md'
```

Language counterparts use `i18nKey` and `translations` in frontmatter plus `quartz/i18n/translations.json`. Frontmatter can override that JSON in the switcher; check both when correcting a counterpart.

English content completeness is uneven: 32 of the 38 concept pages, all 52 company pages, and all 8 person pages currently provide short metadata/navigation summaries rather than the full Chinese entry. A working counterpart URL is not proof of a complete translation. For detailed content, follow the same `i18nKey` to the Chinese entry or read the underlying letter. For example, the English [Owner Earnings entry](../content/en/03-concepts/Owner%20Earnings.md) is a summary; its [Chinese counterpart](../content/03-concepts/所有者盈余.md) contains the definition and quotation. Other locales should be reviewed for content completeness separately.

Keep operational guides in `docs/` or at the repository root: Markdown inside `content/` is published unless an ignore pattern excludes it.

## Local commands and checks

Node >=22 and npm >=10.9.2 are declared in [package.json](../package.json).

```bash
npm ci
npm run build
npx quartz build --serve
```

Source changes under `quartz/`: `npm test` runs the existing path/file-trie tests; `npm run check` runs TypeScript and repository-wide formatting checks. Locale/navigation behavior also needs a served-site check: open the home page and a deep page in each affected locale, then test Explorer, Search, language switch, breadcrumbs, and aliases. The full locale checklist describes known browser auto-translation false positives.

`npm run deploy` builds and publishes to Cloudflare Pages; `npm run build` only generates the local site. When paths/counts/commands change, update this map, the locale checklist, and the short root agent guide together.
