# Locale tasks checklist (new language)

Add a language to this Quartz site only after every item below is done.
Convention: Chinese at content root; other languages under `content/{prefix}/` (e.g. `en`, `es`, `pt`, `ja`).

## A. Enable locale wiring

- [ ] `quartz/i18n/siteLocales.ts` — add/enable `{ code, label, hreflang, quartzLocale, prefix }`
- [ ] Quartz UI pack exists and is registered (`quartz/i18n/locales/*`, `TRANSLATIONS` in `quartz/i18n/index.ts`)
- [ ] Page UI locale resolves via `siteLocales.quartzLocale` / `resolvePageLocale` — **no fallback to Chinese chrome**
- [ ] `renderPage` **pageTitle** set for this locale (not Chinese `cfg.pageTitle`)
- [ ] Explorer / Search / Backlinks locale prefix lists include the new prefix
- [ ] Language switcher dropdown shows the language
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

When adding French/German/etc., copy this checklist; do not rely on memory.
