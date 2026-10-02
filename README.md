# Warren Buffett Letters Vault

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [日本語](README.ja.md)

A digital vault of Warren Buffett’s shareholder letters, partnership letters, and core investment ideas — built with [Quartz](https://quartz.jzhao.xyz/).

**Live site:** [https://buffett-letters.com](https://buffett-letters.com)

## Languages

| Language | Site path |
| --- | --- |
| English | `/en/` |
| 简体中文 | `/` |
| 繁體中文 | `/zh-tw/` |
| Español | `/es/` |
| Português | `/pt/` |
| 日本語 | `/ja/` |

### Notes

- Simplified Chinese content lives at the content root (`content/01-index`, …).
- Other languages live under `content/{prefix}/` (e.g. `content/en/`, `content/zh-tw/`, `content/es/`, `content/pt/`, `content/ja/`).
- A first visit to `/` follows the browser language; unmatched languages fall back to `/en/`.
- The WeChat Official Account name **太白钓雪** stays in Chinese in every locale.

## Contents

- **01-index** — Overviews and indexes for letters, companies, and people.
- **02-letters** — Berkshire Hathaway shareholder letters (1970–2025) and Partnership letters (1956–1969).
- **03-concepts** — Core investment philosophies (Moat, Margin of Safety, Circle of Competence, and more).
- **04-companies** — Profiles of companies Buffett has invested in or acquired.
- **05-people** — Key figures in Buffett’s life and career.

## Run locally

```bash
npm ci
npx quartz build --serve
```

## SEO

`sitemap.xml` and `robots.txt` point to `https://buffett-letters.com` for search visibility.

## Developer navigation

Requires Node >=22 and npm >=10.9.2 (see package.json). See the [development map](docs/development.md) for code entry points, locale maintenance, content completeness, and local checks.
