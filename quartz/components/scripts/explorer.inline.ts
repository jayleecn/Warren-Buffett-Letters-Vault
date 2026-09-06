import { FileTrieNode } from "../../util/fileTrie"
import { FullSlug, simplifySlug } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"

type MaybeHTMLElement = HTMLElement | undefined

interface ParsedOptions {
  folderClickBehavior: "collapse" | "link"
  folderDefaultState: "collapsed" | "open"
  useSavedState: boolean
  sortFn: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn: (node: FileTrieNode) => boolean
  mapFn: (node: FileTrieNode) => void
  order: "sort" | "filter" | "map"[]
}

type FolderState = {
  path: string
  collapsed: boolean
}

/** Locale folder prefixes (keep in sync with quartz/i18n/siteLocales.ts). */
const LOCALE_PREFIXES = ["en", "es", "ja", "pt"] // keep in sync with siteLocales prefixes

function detectLocalePrefix(slug: string): string | null {
  // Accept FullSlug ("ja/index") or pathname ("/ja/", "/ja/index.html")
  let s = (slug || "").trim()
  try {
    if (s.startsWith("http://") || s.startsWith("https://")) s = new URL(s).pathname
  } catch {}
  s = s.replace(/^\/+/, "").replace(/\/+$/, "")
  if (s.endsWith(".html")) s = s.slice(0, -5)
  if (s.endsWith("/index")) s = s.slice(0, -6)
  for (const prefix of LOCALE_PREFIXES) {
    if (s === prefix || s === `${prefix}/index` || s.startsWith(`${prefix}/`)) {
      return prefix
    }
  }
  return null
}

function explorerStorageKey(slug: string): string {
  const prefix = detectLocalePrefix(slug)
  return prefix ? `fileTree-${prefix}` : "fileTree-zh"
}

/** Root-absolute href so Explorer never leaks into another locale via ../ relative resolution. */
function hrefForSlug(targetSlug: FullSlug): string {
  const simple = simplifySlug(targetSlug)
  if (!simple || simple === "/" || simple === "index" || simple === ".") return "/"
  return "/" + String(simple).replace(/^\/+/, "")
}

/** Keep only entries that belong to the active locale (or zh root). */
function entriesForLocale(
  all: [FullSlug, ContentDetails][],
  activePrefix: string | null,
): [FullSlug, ContentDetails][] {
  if (activePrefix) {
    const head = `${activePrefix}/`
    return all.filter(([slug]) => slug === `${activePrefix}/index` || slug.startsWith(head))
  }
  return all.filter(([slug]) => {
    const top = slug.split("/")[0]
    return !LOCALE_PREFIXES.includes(top)
  })
}

let currentExplorerState: Array<FolderState>
function toggleExplorer(this: HTMLElement) {
  const nearestExplorer = this.closest(".explorer") as HTMLElement
  if (!nearestExplorer) return
  const explorerCollapsed = nearestExplorer.classList.toggle("collapsed")
  nearestExplorer.setAttribute(
    "aria-expanded",
    nearestExplorer.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )

  if (!explorerCollapsed) {
    // Stop <html> from being scrollable when mobile explorer is open
    document.documentElement.classList.add("mobile-no-scroll")
  } else {
    document.documentElement.classList.remove("mobile-no-scroll")
  }
}

function toggleFolder(evt: MouseEvent) {
  evt.stopPropagation()
  const target = evt.target as MaybeHTMLElement
  if (!target) return

  // Check if target was svg icon or button
  const isSvg = target.nodeName === "svg"

  // corresponding <ul> element relative to clicked button/folder
  const folderContainer = (
    isSvg
      ? // svg -> div.folder-container
        target.parentElement
      : // button.folder-button -> div -> div.folder-container
        target.parentElement?.parentElement
  ) as MaybeHTMLElement
  if (!folderContainer) return
  const childFolderContainer = folderContainer.nextElementSibling as MaybeHTMLElement
  if (!childFolderContainer) return

  childFolderContainer.classList.toggle("open")

  // Collapse folder container
  const isCollapsed = !childFolderContainer.classList.contains("open")
  setFolderState(childFolderContainer, isCollapsed)

  const currentFolderState = currentExplorerState.find(
    (item) => item.path === folderContainer.dataset.folderpath,
  )
  if (currentFolderState) {
    currentFolderState.collapsed = isCollapsed
  } else {
    currentExplorerState.push({
      path: folderContainer.dataset.folderpath as FullSlug,
      collapsed: isCollapsed,
    })
  }

  const stringifiedFileTree = JSON.stringify(currentExplorerState)
  localStorage.setItem(explorerStorageKey(document.body.dataset.slug || ""), stringifiedFileTree)
}

function createFileNode(currentSlug: FullSlug, node: FileTrieNode): HTMLLIElement {
  const template = document.getElementById("template-file") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const a = li.querySelector("a") as HTMLAnchorElement
  a.href = hrefForSlug(node.slug)
  a.dataset.for = node.slug
  a.textContent = node.displayName

  if (currentSlug === node.slug) {
    a.classList.add("active")
  }

  return li
}

function createFolderNode(
  currentSlug: FullSlug,
  node: FileTrieNode,
  opts: ParsedOptions,
): HTMLLIElement {
  const template = document.getElementById("template-folder") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const folderContainer = li.querySelector(".folder-container") as HTMLElement
  const titleContainer = folderContainer.querySelector("div") as HTMLElement
  const folderOuter = li.querySelector(".folder-outer") as HTMLElement
  const ul = folderOuter.querySelector("ul") as HTMLUListElement

  const folderPath = node.slug
  folderContainer.dataset.folderpath = folderPath

  if (currentSlug === folderPath) {
    folderContainer.classList.add("active")
  }

  if (opts.folderClickBehavior === "link") {
    // Replace button with link for link behavior
    const button = titleContainer.querySelector(".folder-button") as HTMLElement
    const a = document.createElement("a")
    a.href = hrefForSlug(folderPath)
    a.dataset.for = folderPath
    a.className = "folder-title"
    a.textContent = node.displayName
    button.replaceWith(a)
  } else {
    const span = titleContainer.querySelector(".folder-title") as HTMLElement
    span.textContent = node.displayName
  }

  // if the saved state is collapsed or the default state is collapsed
  const isCollapsed =
    currentExplorerState.find((item) => item.path === folderPath)?.collapsed ??
    opts.folderDefaultState === "collapsed"

  // if this folder is a prefix of the current path we
  // want to open it anyways
  const simpleFolderPath = simplifySlug(folderPath)
  const folderIsPrefixOfCurrentSlug =
    simpleFolderPath === currentSlug.slice(0, simpleFolderPath.length)

  if (!isCollapsed || folderIsPrefixOfCurrentSlug) {
    folderOuter.classList.add("open")
  }

  for (const child of node.children) {
    const childNode = child.isFolder
      ? createFolderNode(currentSlug, child, opts)
      : createFileNode(currentSlug, child)
    ul.appendChild(childNode)
  }

  return li
}

let explorerSetupGeneration = 0

async function setupExplorer(currentSlug: FullSlug) {
  const setupGeneration = ++explorerSetupGeneration
  const allExplorers = document.querySelectorAll("div.explorer") as NodeListOf<HTMLElement>

  for (const explorer of allExplorers) {
    const dataFns = JSON.parse(explorer.dataset.dataFns || "{}")
    const opts: ParsedOptions = {
      folderClickBehavior: (explorer.dataset.behavior || "collapse") as "collapse" | "link",
      folderDefaultState: (explorer.dataset.collapsed || "collapsed") as "collapsed" | "open",
      useSavedState: explorer.dataset.savestate === "true",
      order: dataFns.order || ["filter", "map", "sort"],
      sortFn: new Function("return " + (dataFns.sortFn || "undefined"))(),
      filterFn: new Function("return " + (dataFns.filterFn || "undefined"))(),
      mapFn: new Function("return " + (dataFns.mapFn || "undefined"))(),
    }

    // Get folder state from local storage (per locale)
    const fileTreeKey = explorerStorageKey(currentSlug)
    const storageTree = localStorage.getItem(fileTreeKey)
    const serializedExplorerState = storageTree && opts.useSavedState ? JSON.parse(storageTree) : []
    const oldIndex = new Map<string, boolean>(
      serializedExplorerState.map((entry: FolderState) => [entry.path, entry.collapsed]),
    )

    const data = await fetchData
    if (setupGeneration !== explorerSetupGeneration) return
    // Pathname is source of truth for locale (body dataset.slug can lag on SPA nav).
    const activePrefix =
      detectLocalePrefix(window.location.pathname) ?? detectLocalePrefix(currentSlug)
    // Filter contentIndex first so a missing locale folder cannot silently
    // leave the full multilingual trie on screen.
    const entries = entriesForLocale(
      [...Object.entries(data)] as [FullSlug, ContentDetails][],
      activePrefix,
    )
    const trie = FileTrieNode.fromEntries(entries)

    // Apply functions in order
    for (const fn of opts.order) {
      switch (fn) {
        case "filter":
          if (opts.filterFn) trie.filter(opts.filterFn)
          break
        case "map":
          if (opts.mapFn) trie.map(opts.mapFn)
          break
        case "sort":
          if (opts.sortFn) trie.sort(opts.sortFn)
          break
      }
    }

    // Prefixed locales still nest under en/|es/|… — unwrap that folder.
    // Fail closed (empty) instead of showing the unscoped tree.
    if (activePrefix) {
      const localeFolder = trie.children.find((c) => c.slugSegment === activePrefix)
      trie.children = localeFolder?.isFolder ? localeFolder.children : []
    }

    // Get folder paths for state management
    const folderPaths = trie.getFolderPaths()
    currentExplorerState = folderPaths.map((path) => {
      const previousState = oldIndex.get(path)
      return {
        path,
        collapsed:
          previousState === undefined ? opts.folderDefaultState === "collapsed" : previousState,
      }
    })

    const explorerUl = explorer.querySelector(".explorer-ul")
    if (!explorerUl) continue

    // Drop previous tree (keep OverflowList sentinel .overflow-end)
    for (const child of [...explorerUl.children]) {
      if (!(child instanceof HTMLElement) || !child.classList.contains("overflow-end")) {
        child.remove()
      }
    }

    // Create and insert new content
    const fragment = document.createDocumentFragment()
    for (const child of trie.children) {
      const node = child.isFolder
        ? createFolderNode(currentSlug, child, opts)
        : createFileNode(currentSlug, child)

      fragment.appendChild(node)
    }
    const end = explorerUl.querySelector(".overflow-end")
    explorerUl.insertBefore(fragment, end ?? null)

    // restore explorer scrollTop position if it exists
    const scrollTop = sessionStorage.getItem("explorerScrollTop")
    if (scrollTop) {
      explorerUl.scrollTop = parseInt(scrollTop)
    } else {
      // try to scroll to the active element if it exists
      const activeElement = explorerUl.querySelector(".active")
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth" })
      }
    }

    // Set up event handlers
    const explorerButtons = explorer.getElementsByClassName(
      "explorer-toggle",
    ) as HTMLCollectionOf<HTMLElement>
    for (const button of explorerButtons) {
      button.addEventListener("click", toggleExplorer)
      window.addCleanup(() => button.removeEventListener("click", toggleExplorer))
    }

    // Set up folder click handlers
    if (opts.folderClickBehavior === "collapse") {
      const folderButtons = explorer.getElementsByClassName(
        "folder-button",
      ) as HTMLCollectionOf<HTMLElement>
      for (const button of folderButtons) {
        button.addEventListener("click", toggleFolder)
        window.addCleanup(() => button.removeEventListener("click", toggleFolder))
      }
    }

    const folderIcons = explorer.getElementsByClassName(
      "folder-icon",
    ) as HTMLCollectionOf<HTMLElement>
    for (const icon of folderIcons) {
      icon.addEventListener("click", toggleFolder)
      window.addCleanup(() => icon.removeEventListener("click", toggleFolder))
    }
  }
}

document.addEventListener("prenav", async () => {
  // save explorer scrollTop position
  const explorer = document.querySelector(".explorer-ul")
  if (!explorer) return
  sessionStorage.setItem("explorerScrollTop", explorer.scrollTop.toString())
})

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const fromBody = document.body?.dataset?.slug
  const currentSlug = (fromBody || e.detail.url) as FullSlug
  await setupExplorer(currentSlug)

  // if mobile hamburger is visible, collapse by default
  for (const explorer of document.getElementsByClassName("explorer")) {
    const mobileExplorer = explorer.querySelector(".mobile-explorer")
    if (!mobileExplorer) return

    if (mobileExplorer.checkVisibility()) {
      explorer.classList.add("collapsed")
      explorer.setAttribute("aria-expanded", "false")

      // Allow <html> to be scrollable when mobile explorer is collapsed
      document.documentElement.classList.remove("mobile-no-scroll")
    }

    mobileExplorer.classList.remove("hide-until-loaded")
  }
})

window.addEventListener("resize", function () {
  // Desktop explorer opens by default, and it stays open when the window is resized
  // to mobile screen size. Applies `no-scroll` to <html> in this edge case.
  const explorer = document.querySelector(".explorer")
  if (explorer && !explorer.classList.contains("collapsed")) {
    document.documentElement.classList.add("mobile-no-scroll")
    return
  }
})

function setFolderState(folderElement: HTMLElement, collapsed: boolean) {
  return collapsed ? folderElement.classList.remove("open") : folderElement.classList.add("open")
}
