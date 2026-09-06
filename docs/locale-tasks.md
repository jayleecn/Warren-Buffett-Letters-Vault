# Locale tasks checklist (new language)

Add a language to this Quartz site only after every item below is done.
Convention: Chinese at content root; other languages under `content/{prefix}/` (e.g. `en`, `es`, `pt`, `ja`).

## A. Enable locale wiring

- [ ] `quartz/i18n/siteLocales.ts` — add/enable `{ code, label, hreflang, quartzLocale, prefix }`
- [ ] Quartz UI pack exists and is registered (`quartz/i18n/locales/*`, `TRANSLATIONS` in `quartz/i18n/index.ts`)
- [ ] Page UI locale resolves via `siteLocales.quartzLocale` / `resolvePageLocale` — **no fallback to Chinese chrome**
- [ ] `renderPage` **pageTitle** set for this locale (not Chinese `cfg.pageTitle`)
- [ ] Explorer / Search / Backlinks locale prefix lists include the new prefix
- [ ] `quartz/components/scripts/explorer.inline.ts` + `search.inline.ts` `LOCALE_PREFIXES` includes the new prefix (**must match siteLocales** — missing entries break Explorer scoping and feel like “language switch broken”)
- [ ] Language switcher dropdown shows the language
- [ ] Language switcher hrefs are **root-absolute** (`/en/...`, not `../en/...`) so SPA from `/ja`/`/es` deep pages does not break
- [ ] Breadcrumb **Home** → `/{prefix}/` (default locale → `/`)
- [ ] Folder page titles use this locale’s string (not `文件夹`)
- [ ] `/{prefix}/404` + client rewrite by pathname
- [ ] Concept / entity language switch: `i18nKey` + `translations` / `translations.json` extended for **all** live locales
- [ ] Tags at `/{prefix}/tags/...`; tag-page language switch **degrades to target tag index** (no tag-name translation tables)
- [ ] Empty tags filtered (frontmatter only; no empty `#` pills in Tag Index)
- [ ] KaTeX `singleDollarTextMath: false`; letter appendices as Markdown tables

## B. Footer (repeated miss — do not skip)

EN already fixed this; every new locale must too.

- [ ] Source label localized (`Source:` / `Fuente:` / `Fonte:` / `出典：` / `信件源：` …)
- [ ] Curator / copyright / scan-QR sentence localized
- [ ] QR `alt` localized
- [ ] WeChat account name stays Chinese **太白钓雪** in every language
- [ ] Implementation must be a **locale map**, not `isEn ? en : zh` (that leaves es/pt/ja on Chinese)

Touch: `quartz/components/Footer.tsx`

## C. Content parity

- [ ] Full mirror of `content/en/` → `content/{prefix}/` (home, indexes, letters, concepts, companies, people)
- [ ] Real translation (not placeholders); filenames may stay parallel to EN
- [ ] Frontmatter `lang` / `i18nKey` / `translations` consistent with siblings

## D. Self-check (preview, then production)

- [ ] `/{prefix}/` title correct; UI chrome in target language (**no** 探索/搜索/关系图谱 leakage)
- [ ] Footer fully localized except **太白钓雪**
- [ ] Dropdown + concept cross-locale links
- [ ] `/ {prefix}/tags/` nonempty; no empty tag pills
- [ ] Breadcrumb Home; folder title; sample letter; 404
- [ ] Existing locales (`/`, `/en/`, …) still OK

## E. Known residuals (OK to ship with)

- Graph neighbors may still cross languages

## History of EN-era misses (why this file exists)

| Miss | Symptom | Fix area |
|------|---------|----------|
| UI locale not resolved for new prefix | Explorer/Search/Graph stay Chinese | `resolvePageLocale` / `siteLocales` |
| pageTitle only special-cased EN | Wrong `<title>` / site name | `renderPage.tsx` |
| Footer `isEn ? … : Chinese` | es/pt/ja footer still Chinese | `Footer.tsx` locale map |
| Tag switch tried name mapping | Broken/missing tag links | degrade to `/{prefix}/tags/` |
| Empty OFM `#tags` | Empty `#` on Tag Index | disable parseTags + filter empties |
| KaTeX `$` | Dollar amounts eaten | `singleDollarTextMath: false` |
| Breadcrumb Home → Chinese root | EN Home went to `/` | locale home slug |
| Folder title | `文件夹:` on EN pages | `folderPage` / locale |
| 404 language | Wrong language 404 | `/{prefix}/404` + client rewrite |
| Explorer/Search `LOCALE_PREFIXES` stuck on `["en"]` | es/ja trees leak into other locales / switcher feels broken | `explorer.inline.ts` / `search.inline.ts` |
| Explorer scopes via `body.dataset.slug` only | SPA nav can rebuild Explorer for the *previous* locale (zh tree on `/es/`) | Prefer `location.pathname` for locale; filter `contentIndex` before trie; absolute Explorer hrefs; fail closed |
| Unhashed `postscript.js` cached 4h at CDN/browser | Regression still sees old Explorer (relative hrefs, only `en` scoped) after merge | Bump `assetV` in `renderPage.tsx`; `_headers` max-age=0 for entry JS |
| Cross-locale `aliases:` collide at site root | Last writer wins (often JA); ES Company Index → Japanese page | Prefix alias slugs with locale in `frontmatter.ts`; root-absolute redirects in `aliases.ts`; same-locale prefer in `transformLink` |

When adding French/German/etc., copy this checklist; do not rely on memory.

## F. Browser false positives

- Chrome (and others) may **auto-translate** `/ja/` (or other locales) into Chinese/English and break the language dropdown / Explorer DOM. Incognito or “Never translate this site” → works.
- Before treating switcher bugs as code regressions, verify in a translation-disabled profile.

## G. Alias / wikilink locale trap (CRITICAL)

Company pages share English `aliases:` (e.g. `Illinois National Bank`) across en/es/ja/pt.
Without a locale prefix on emitted alias slugs, Quartz writes competing root HTML redirects and **last locale wins**. Spanish (or EN) users clicking a Company Index wikilink can land on Japanese content; the URL may also drop `/es`.

**Required when shipping any prefixed locale:**

1. `getAliasSlugs(aliases, pageSlug)` — if the page is under a locale prefix, emit `es/Illinois-National-Bank` (not root `Illinois-National-Bank`). Chinese (no prefix) stays root-level.
2. `AliasRedirects` — meta-refresh/`canonical` must be **root-absolute** (`/es/04-companies/...`), never `./es/...` relative.
3. `transformLink` — for bare targets (`[[Illinois National Bank]]`), prefer a **same-locale** match from `allSlugs` (absolute + shortest strategies).

Do not treat “alias href looks fine in one locale” as proof — check the *other* locales’ Company Index → same company.

