# Archivo de Cartas de Warren Buffett

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [日本語](README.ja.md)

Un archivo digital de las cartas de Warren Buffett a los accionistas, las cartas de la sociedad y las ideas clave de inversión — construido con [Quartz](https://quartz.jzhao.xyz/).

**Sitio en vivo:** [https://buffett-letters.com](https://buffett-letters.com)

## Idiomas

| Idioma | Ruta del sitio |
| --- | --- |
| English | `/en/` |
| 简体中文 | `/` |
| 繁體中文 | `/zh-tw/` |
| Español | `/es/` |
| Português | `/pt/` |
| 日本語 | `/ja/` |

### Notas

- El contenido en chino simplificado está en la raíz de contenido (`content/01-index`, …).
- Los demás idiomas están bajo `content/{prefix}/` (p. ej. `content/en/`, `content/zh-tw/`, `content/es/`, `content/pt/`, `content/ja/`).
- La primera visita a `/` sigue el idioma del navegador; si no hay coincidencia, se redirige a `/en/`.
- El nombre de la cuenta oficial de WeChat **太白钓雪** se mantiene en chino en todos los idiomas.

## Contenidos

- **01-index** — Resúmenes e índices de cartas, empresas y personas.
- **02-letters** — Cartas a accionistas de Berkshire Hathaway (1970–2025) y cartas de la Partnership (1956–1969).
- **03-concepts** — Filosofías de inversión centrales (foso económico, margen de seguridad, círculo de competencia, etc.).
- **04-companies** — Perfiles de empresas en las que Buffett ha invertido o que ha adquirido.
- **05-people** — Figuras clave en la vida y carrera de Buffett.

## Ejecutar en local

```bash
npm ci
npx quartz build --serve
```

## SEO

`sitemap.xml` y `robots.txt` apuntan a `https://buffett-letters.com` para mejorar la visibilidad en buscadores.

## Desarrollo

Se requieren Node >=22 y npm >=10.9.2 (package.json). La [guía de desarrollo](docs/development.md) describe el código, los idiomas, el estado del contenido y las comprobaciones locales.
