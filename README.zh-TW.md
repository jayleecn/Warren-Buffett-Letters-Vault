# 華倫·巴菲特致股東信庫

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [日本語](README.ja.md)

華倫·巴菲特致股東信、合夥企業信函與核心投資理念的數位圖書館，以 [Quartz](https://quartz.jzhao.xyz/) 建置。

**線上瀏覽：** [https://buffett-letters.com](https://buffett-letters.com)

## 語言

| 語言 | 站點路徑 |
| --- | --- |
| English | `/en/` |
| 简体中文 | `/` |
| 繁體中文 | `/zh-tw/` |
| Español | `/es/` |
| Português | `/pt/` |
| 日本語 | `/ja/` |

### 說明

- 簡體中文內容位於內容根目錄（`content/01-index` 等）。
- 其他語言位於 `content/{prefix}/`（如 `content/en/`、`content/zh-tw/`、`content/es/`、`content/pt/`、`content/ja/`）。
- 首次造訪 `/` 會依瀏覽器語言跳轉；無法匹配時回退到 `/en/`。
- 微信公眾號名稱 **太白钓雪** 在所有語言版本中保持中文。

## 內容結構

- **01-index** — 信件、公司與人物的總覽與索引。
- **02-letters** — 波克夏·海瑟威致股東信（1970–2025）及合夥企業信函（1956–1969）。
- **03-concepts** — 核心投資理念（護城河、安全邊際、能力圈等）。
- **04-companies** — 巴菲特投資或收購的公司簡介。
- **05-people** — 巴菲特人生與事業中的關鍵人物。

## 本機執行

```bash
npm install
npx quartz build --serve
```

## SEO

網站設定了指向 `https://buffett-letters.com` 的 `sitemap.xml` 與 `robots.txt`，以提升搜尋引擎可見度。
