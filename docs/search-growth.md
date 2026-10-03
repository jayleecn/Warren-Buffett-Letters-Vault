# Search and publishing checks

The six language trees each contain 194 documents. The sitemap must contain 1,164 content URLs, with working canonical and reciprocal language URLs. Dates in historical letters describe the original document; sitemap `lastmod` uses the web page's Git/frontmatter modification date.

## Before publishing

```sh
npm ci
npx tsc --noEmit
npm test
npm run build
npm run check:site
```

The site audit checks generated content URLs, article links, six-language alternates, sitemap dates, 404 indexing and search index counts. Also test a home page, deep letter, language switching, search and mobile layout in the browser. The repository-wide `npm run check` includes Prettier; many untouched files have pre-existing formatting differences. Format and check changed files without mixing a repository-wide reformat into functional work.

The lightweight `static/contentIndex-meta.json` is used by Explorer and Graph. Full-text search fetches `static/search-index/{locale}.json` only when opened. Keep `static/contentIndex.json` during migration so previously cached clients still work. Bump the search-index URL when changing its contract. Entry-script URLs automatically use SHA-256 hashes of the final emitted `prescript.js` and `postscript.js` bytes; no manual date version is needed. The synchronous component-resource hook prepares these hashes before full or incremental page rendering, and SPA URL rebasing preserves the version query. The site audit verifies every content page's script URLs against the emitted files.

Unwritten Obsidian links are rendered as plain text. Resolved aliases point directly to canonical pages. Resolution happens on a copy of the parsed tree, so later publishing a target restores the link on rebuild. Content pages are all re-rendered during incremental builds because a target/alias change can affect other pages' links and backlinks.

## Deployment and rollback

Cloudflare Pages project: `warren-buffett-letters`. Preview a branch deployment before merging into `main`. `npm run deploy` publishes directly to production and should only be used after the checks above.

Known-good deployment before the October 2026 changes:

- Commit: `fa06fabaea5d55e63a06ff667771ba4b14fcfa5c`
- Deployment: `198eff2c-d1bb-4562-9003-aff9bb20f9b6`
- Preview: <https://198eff2c.warren-buffett-letters.pages.dev>

If production checks fail, roll back to that deployment in Cloudflare Pages, then revert the release commit with a normal Git revert. Do not rewrite the main branch history. Check all six home pages, a deep letter, `robots.txt`, `sitemap.xml`, search and a real missing URL after publishing.

Analytics exports and account screenshots contain private data. Keep them outside the public repository. Site verification meta tags are public verification values, not API credentials.
