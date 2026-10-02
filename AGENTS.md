# Repository navigation

Read [docs/development.md](docs/development.md) for the task-to-file map and content caveats. For locale changes, also read [docs/locale-tasks.md](docs/locale-tasks.md).

- Site/theme/plugins: `quartz.config.ts`; component composition: `quartz.layout.ts`.
- Locale registry: `quartz/i18n/siteLocales.ts`; browser prefix copies: `quartz/components/scripts/explorer.inline.ts`, `search.inline.ts`.
- Counterpart paths: `quartz/i18n/translations.json` plus each page's `i18nKey`/`translations` frontmatter; switcher: `quartz/components/LanguageSwitcher.tsx`.
- Locale titles/cache version: `quartz/components/renderPage.tsx`; UI text: `quartz/i18n/index.ts`, `locales/`.
- Aliases/links: `quartz/plugins/transformers/frontmatter.ts`, `quartz/plugins/emitters/aliases.ts`, `quartz/util/path.ts`.

Chinese content lives at the content root; en/zh-tw/es/pt/ja use prefixed trees. Search one language and content category first. Start with that tree's `01-index/`; avoid loading every translation to find one topic. `content/templates/` is excluded from publishing.

Many English concepts and all English company/person pages are metadata summaries, not full translations. Resolve the same `i18nKey` to Chinese or the source letter for detail. Original documents live in [the separate source archive](https://github.com/jayleecn/Warren-Buffett-Letters-1956-2025); this repo has no automatic import/sync.

Node >=22, npm >=10.9.2. Install: `npm ci`; build: `npm run build`; serve: `npx quartz build --serve`; existing tests: `npm test`; TS/format check: `npm run check`. Operational docs belong outside published `content/`. `npm run deploy` publishes the site.
