# 沃伦·巴菲特致股东信库

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [日本語](README.ja.md)

沃伦·巴菲特致股东信、合伙企业信函与核心投资理念的数字图书馆，基于 [Quartz](https://quartz.jzhao.xyz/) 构建。

**在线访问：** [https://buffett-letters.com](https://buffett-letters.com)

## 语言

| 语言 | 站点路径 |
| --- | --- |
| English | `/en/` |
| 简体中文 | `/` |
| 繁體中文 | `/zh-tw/` |
| Español | `/es/` |
| Português | `/pt/` |
| 日本語 | `/ja/` |

### 说明

- 简体中文内容位于内容根目录（`content/01-index` 等）。
- 其他语言位于 `content/{prefix}/`（如 `content/en/`、`content/zh-tw/`、`content/es/`、`content/pt/`、`content/ja/`）。
- 首次访问 `/` 会按浏览器语言跳转；无法匹配时回退到 `/en/`。
- 微信公众号名称 **太白钓雪** 在所有语言版本中保持中文。

## 内容结构

- **01-index** — 信件、公司与人物的总览与索引。
- **02-letters** — 伯克希尔·哈撒韦致股东信（1970–2025）及合伙企业信函（1956–1969）。
- **03-concepts** — 核心投资理念（护城河、安全边际、能力圈等）。
- **04-companies** — 巴菲特投资或收购的公司简介。
- **05-people** — 巴菲特人生与事业中的关键人物。

## 本地运行

```bash
npm ci
npx quartz build --serve
```

## SEO

站点配置了指向 `https://buffett-letters.com` 的 `sitemap.xml` 与 `robots.txt`，便于搜索引擎收录。

## 开发导航

需要 Node >=22、npm >=10.9.2（见 package.json）。[开发地图](docs/development.md) 列出源码入口、多语言维护、内容完整性和本地复核。
