import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// 左侧「探索」顺序：请通过 content 下文件夹名称的字典序实现，例如
// 01-index、02-letters、03-concepts、04-companies、05-people。
// 勿使用自定义 sortFn：esbuild 会注入 __name()，序列化到浏览器后执行会报错，导致 Explorer 空白。

const breadcrumbLangBar = Component.Flex({
  gap: "0.75rem",
  components: [
    {
      Component: Component.Breadcrumbs(),
      grow: true,
      justify: "start",
      align: "center",
    },
    {
      Component: Component.LanguageSwitcher(),
      grow: false,
      shrink: false,
      justify: "end",
      align: "center",
    },
  ],
})

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
      links: {
        "Warren-Buffett-Letters-1956-2025": "https://github.com/jayleecn/Warren-Buffett-Letters-1956-2025",
      },
    }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    breadcrumbLangBar,
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// list pages (folders / tags): keep Graph so EN folder homes match ZH
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    breadcrumbLangBar,
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.Graph(),
    Component.Backlinks(),
  ],
}
