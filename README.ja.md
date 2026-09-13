# ウォーレン・バフェット書簡保管庫

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [日本語](README.ja.md)

ウォーレン・バフェットの株主への手紙、パートナーシップ書簡、および主要な投資思想を収めたデジタル保管庫です。[Quartz](https://quartz.jzhao.xyz/) で構築されています。

**公開サイト:** [https://buffett-letters.com](https://buffett-letters.com)

## 言語

| 言語 | サイトパス |
| --- | --- |
| English | `/en/` |
| 简体中文 | `/` |
| 繁體中文 | `/zh-tw/` |
| Español | `/es/` |
| Português | `/pt/` |
| 日本語 | `/ja/` |

### 注意事項

- 簡体字中国語のコンテンツはコンテンツルートに置かれます（`content/01-index` など）。
- その他の言語は `content/{prefix}/` 配下にあります（例: `content/en/`、`content/zh-tw/`、`content/es/`、`content/pt/`、`content/ja/`）。
- `/` への初回アクセスはブラウザ言語に従い、一致しない場合は `/en/` にフォールバックします。
- WeChat 公式アカウント名 **太白钓雪** はすべての言語版で中国語のままです。

## コンテンツ構成

- **01-index** — 書簡・企業・人物の概要と索引。
- **02-letters** — バークシャー・ハサウェイ株主への手紙（1970–2025）およびパートナーシップ書簡（1956–1969）。
- **03-concepts** — 主要な投資哲学（経済的堀、安全余裕、能力の輪など）。
- **04-companies** — バフェットが投資・買収した企業のプロフィール。
- **05-people** — バフェットの人生とキャリアにおける重要人物。

## ローカルで実行

```bash
npm install
npx quartz build --serve
```

## SEO

`sitemap.xml` と `robots.txt` は `https://buffett-letters.com` を指し、検索エンジンでの可視性を高めます。
