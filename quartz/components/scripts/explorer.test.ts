import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import { h } from "preact";
import renderToString from "preact-render-to-string";
import type {
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../types";

// Execute the production script and render the real component. Only browser DOM
// APIs and the component's build-time Sass/inline-script loaders are fixtures.
const { outputFiles } = await build({
  entryPoints: [new URL("./explorer.inline.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  format: "cjs",
});
const explorerScript = outputFiles[0].text;
const componentBundle = await build({
  entryPoints: [new URL("../Explorer.tsx", import.meta.url).pathname],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  packages: "external",
  plugins: [
    {
      name: "browser-resource-fixtures",
      setup(builder) {
        builder.onLoad({ filter: /\.(scss|inline\.ts)$/ }, () => ({
          contents: 'export default ""',
          loader: "js",
        }));
      },
    },
  ],
});
const module: { exports: { default?: QuartzComponentConstructor } } = {
  exports: {},
};
runInNewContext(componentBundle.outputFiles[0].text, {
  module,
  exports: module.exports,
  require: createRequire(import.meta.url),
});
assert.ok(module.exports.default);
const Explorer = module.exports.default(undefined);

function renderExplorer() {
  return renderToString(
    h(Explorer, { cfg: { locale: "en-US" } } as QuartzComponentProps),
  );
}

function attributes(tag: string) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]),
  );
}

class ClassListFixture extends Set<string> {
  contains(value: string) {
    return this.has(value);
  }
  remove(value: string) {
    this.delete(value);
  }
  toggle(value: string, force = !this.has(value)) {
    if (force) this.add(value);
    else this.delete(value);
    return force;
  }
}

class ElementFixture extends EventTarget {
  classList = new ClassListFixture();
  dataset: Record<string, string> = {};
  children: ElementFixture[] = [];
  scrollTop = 0;
  visible = true;
  parent: ElementFixture | null = null;
  private attributes: Record<string, string>;

  constructor(attrs: Record<string, string> = {}) {
    super();
    this.attributes = { ...attrs };
    for (const name of attrs.class?.split(" ") ?? []) this.classList.add(name);
  }
  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  }
  getAttribute(name: string) {
    return this.attributes[name] ?? null;
  }
  querySelectorAll(selector: string): ElementFixture[] {
    return this.children.flatMap((child) => [
      ...(child.classList.contains(selector.replace(/^\./, "")) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector: string) {
    return this.querySelectorAll(selector)[0] ?? null;
  }
  getElementsByClassName(name: string) {
    return this.querySelectorAll(`.${name}`);
  }
  closest(selector: string): ElementFixture | null {
    return this.classList.contains(selector.replace(/^\./, ""))
      ? this
      : (this.parent?.closest(selector) ?? null);
  }
  checkVisibility() {
    return this.visible;
  }
  insertBefore() {}
}

function createExplorer(mobile: boolean, collapsed = false) {
  const markup = renderExplorer();
  const explorer = new ElementFixture({ class: "explorer" });
  explorer.dataset = {
    behavior: "link",
    collapsed: "collapsed",
    savestate: "true",
  };
  explorer.classList.toggle("collapsed", collapsed);
  const buttons = [
    ...markup.matchAll(/<button\b[^>]*explorer-toggle[^>]*>/g),
  ].map(([tag]) => new ElementFixture(attributes(tag)));
  const mobileButton = buttons.find((button) =>
    button.classList.contains("mobile-explorer"),
  )!;
  const desktopButton = buttons.find((button) =>
    button.classList.contains("desktop-explorer"),
  )!;
  mobileButton.visible = mobile;
  desktopButton.visible = !mobile;
  const contentTag = markup.match(
    /<div\b[^>]*class="explorer-content"[^>]*>/,
  )![0];
  const content = new ElementFixture(attributes(contentTag));
  const list = new ElementFixture({ class: "explorer-ul" });
  content.children = [list];
  explorer.children = [...buttons, content];
  for (const child of explorer.children) child.parent = explorer;
  list.parent = content;
  return { explorer, buttons, mobileButton, desktopButton, content };
}

function createBrowser(mobile: boolean, collapsed = false) {
  const elements = createExplorer(mobile, collapsed);
  const document = Object.assign(new EventTarget(), {
    documentElement: new ElementFixture(),
    body: { dataset: { slug: "index" } },
    querySelectorAll: (selector: string) =>
      selector === "div.explorer" ? [elements.explorer] : [],
    querySelector: (selector: string) =>
      selector === ".explorer"
        ? elements.explorer
        : elements.explorer.querySelector(selector),
    getElementsByClassName: (name: string) =>
      name === "explorer" ? [elements.explorer] : [],
    createDocumentFragment: () => new ElementFixture(),
  });
  const cleanup = new Set<() => void>();
  const window = Object.assign(new EventTarget(), {
    location: new URL("https://example.com/"),
    addCleanup: (fn: () => void) => cleanup.add(fn),
  });
  const storage = new Map<string, string>();
  const storageFixture = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  };
  runInNewContext(explorerScript, {
    document,
    window,
    HTMLElement: ElementFixture,
    localStorage: storageFixture,
    sessionStorage: storageFixture,
    // No tree entries are needed to exercise disclosure and navigation handlers.
    fetchData: Promise.resolve({}),
    URL,
  });
  return Object.assign(elements, {
    document,
    async navigate(replaceDOM = false) {
      document.dispatchEvent(new Event("prenav"));
      for (const fn of cleanup) fn();
      cleanup.clear();
      if (replaceDOM) {
        Object.assign(elements, createExplorer(elements.mobileButton.visible));
      }
      document.dispatchEvent(
        new CustomEvent("nav", { detail: { url: "index" } }),
      );
      await setImmediate();
    },
    resize(mobile: boolean) {
      elements.mobileButton.visible = mobile;
      elements.desktopButton.visible = !mobile;
      window.dispatchEvent(new Event("resize"));
    },
  });
}

function assertExpanded(
  browser: ReturnType<typeof createBrowser>,
  expanded: boolean,
) {
  assert.equal(browser.explorer.classList.contains("collapsed"), !expanded);
  for (const button of browser.buttons) {
    assert.equal(button.getAttribute("aria-expanded"), String(expanded));
    assert.equal(
      button.getAttribute("aria-controls"),
      browser.content.getAttribute("id"),
    );
  }
  assert.equal(browser.explorer.getAttribute("aria-expanded"), null);
  assert.equal(browser.content.getAttribute("aria-expanded"), null);
}

test("Explorer renders named controls for one content region with responsive initial states", () => {
  const browser = createBrowser(false);
  assert.equal(browser.mobileButton.getAttribute("aria-expanded"), "false");
  assert.equal(browser.mobileButton.getAttribute("aria-label"), "Explorer");
  assert.equal(browser.desktopButton.getAttribute("aria-expanded"), "true");
  for (const button of browser.buttons) {
    assert.equal(
      button.getAttribute("aria-controls"),
      browser.content.getAttribute("id"),
    );
  }
  assert.equal(browser.content.getAttribute("aria-expanded"), null);
  assert.notEqual(
    createBrowser(false).content.getAttribute("id"),
    browser.content.getAttribute("id"),
  );
});

test("desktop collapse and repeated reopen update both buttons from the visible state", async () => {
  const browser = createBrowser(false);
  await browser.navigate();
  assertExpanded(browser, true);
  for (let i = 0; i < 3; i++) {
    browser.desktopButton.dispatchEvent(new Event("click"));
    assertExpanded(browser, false);
    browser.desktopButton.dispatchEvent(new Event("click"));
    assertExpanded(browser, true);
  }
});

test("desktop navigation preserves collapse and synchronizes stale button attributes", async () => {
  const browser = createBrowser(false, true);
  for (const button of browser.buttons)
    button.setAttribute("aria-expanded", "true");
  await browser.navigate();
  assertExpanded(browser, false);
  await browser.navigate();
  assertExpanded(browser, false);
  browser.desktopButton.dispatchEvent(new Event("click"));
  assertExpanded(browser, true);
});

test("mobile initialization, close, and navigation reset keep disclosure and scroll state aligned", async () => {
  const browser = createBrowser(true);
  await browser.navigate();
  assertExpanded(browser, false);
  assert.equal(
    browser.mobileButton.classList.contains("hide-until-loaded"),
    false,
  );
  for (let i = 0; i < 2; i++) {
    browser.mobileButton.dispatchEvent(new Event("click"));
    assertExpanded(browser, true);
    assert.equal(
      browser.document.documentElement.classList.contains("mobile-no-scroll"),
      true,
    );
    browser.mobileButton.dispatchEvent(new Event("click"));
    assertExpanded(browser, false);
    assert.equal(
      browser.document.documentElement.classList.contains("mobile-no-scroll"),
      false,
    );
    browser.mobileButton.dispatchEvent(new Event("click"));
    await browser.navigate();
    assertExpanded(browser, false);
    assert.equal(
      browser.document.documentElement.classList.contains("mobile-no-scroll"),
      false,
    );
  }
});

test("responsive control changes preserve the current disclosure state", async () => {
  const browser = createBrowser(false);
  await browser.navigate();
  browser.resize(true);
  assertExpanded(browser, true);
  browser.mobileButton.dispatchEvent(new Event("click"));
  assertExpanded(browser, false);
  browser.resize(false);
  assertExpanded(browser, false);
  browser.desktopButton.dispatchEvent(new Event("click"));
  assertExpanded(browser, true);
});

test("navigation binds replacement controls to their new content region and cleans up old controls", async () => {
  for (const mobile of [false, true]) {
    const browser = createBrowser(mobile);
    await browser.navigate();
    const previousButton = mobile
      ? browser.mobileButton
      : browser.desktopButton;
    const previousExplorer = browser.explorer;
    const previousRegionId = browser.content.getAttribute("id");
    previousButton.dispatchEvent(new Event("click"));
    assertExpanded(browser, mobile);

    await browser.navigate(true);
    assert.notEqual(browser.content.getAttribute("id"), previousRegionId);
    assert.notEqual(browser.explorer, previousExplorer);
    assertExpanded(browser, !mobile);
    previousButton.dispatchEvent(new Event("click"));
    assert.equal(previousExplorer.classList.contains("collapsed"), !mobile);
    assertExpanded(browser, !mobile);

    const nextButton = mobile ? browser.mobileButton : browser.desktopButton;
    nextButton.dispatchEvent(new Event("click"));
    assertExpanded(browser, mobile);
  }
});
