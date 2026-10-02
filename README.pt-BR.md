# Arquivo de Cartas de Warren Buffett

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [日本語](README.ja.md)

Um arquivo digital das cartas de Warren Buffett aos acionistas, cartas da partnership e ideias centrais de investimento — construído com [Quartz](https://quartz.jzhao.xyz/).

**Site ao vivo:** [https://buffett-letters.com](https://buffett-letters.com)

## Idiomas

| Idioma | Caminho do site |
| --- | --- |
| English | `/en/` |
| 简体中文 | `/` |
| 繁體中文 | `/zh-tw/` |
| Español | `/es/` |
| Português | `/pt/` |
| 日本語 | `/ja/` |

### Notas

- O conteúdo em chinês simplificado fica na raiz do conteúdo (`content/01-index`, …).
- Os demais idiomas ficam em `content/{prefix}/` (ex.: `content/en/`, `content/zh-tw/`, `content/es/`, `content/pt/`, `content/ja/`).
- A primeira visita a `/` segue o idioma do navegador; sem correspondência, redireciona para `/en/`.
- O nome da conta oficial do WeChat **太白钓雪** permanece em chinês em todos os idiomas.

## Conteúdo

- **01-index** — Visões gerais e índices de cartas, empresas e pessoas.
- **02-letters** — Cartas aos acionistas da Berkshire Hathaway (1970–2025) e cartas da Partnership (1956–1969).
- **03-concepts** — Filosofias centrais de investimento (fosso econômico, margem de segurança, círculo de competência, etc.).
- **04-companies** — Perfis de empresas em que Buffett investiu ou que adquiriu.
- **05-people** — Figuras-chave na vida e carreira de Buffett.

## Executar localmente

```bash
npm ci
npx quartz build --serve
```

## SEO

`sitemap.xml` e `robots.txt` apontam para `https://buffett-letters.com` para melhorar a visibilidade nos buscadores.

## Desenvolvimento

Requer Node >=22 e npm >=10.9.2 (package.json). O [guia de desenvolvimento](docs/development.md) descreve o código, os idiomas, o estado do conteúdo e as verificações locais.
