import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

// Run the real router, isolating only browser parsing and body morphing. Fixtures
// stand in for parsed response documents; navigation, fetch and history are real
// router code rather than a copy of the behavior under test.
const { outputFiles } = await build({
  entryPoints: [new URL("./spa.inline.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  format: "cjs",
  external: ["micromorph"],
});
const routerScript = outputFiles[0].text;

class ElementFixture {
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
  lang = "";
  dir = "";
  textContent = "";
  private attributes = new Map<string, string>();

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  getAttribute(name: string) {
    return this.attributes.get(name) ?? null;
  }
  appendChild() {}
  contains() {
    return false;
  }
  querySelectorAll() {
    return [];
  }
}

type PageFixture = { lang: string; dir: string; slug: string };

class DocumentFixture extends EventTarget {
  documentElement = new ElementFixture();
  body = new ElementFixture();
  head = new ElementFixture();
  title = "";

  constructor(page: PageFixture) {
    super();
    this.documentElement.lang = page.lang;
    this.documentElement.dir = page.dir;
    this.body.dataset.slug = page.slug;
  }
  createElement() {
    return new ElementFixture();
  }
  querySelector(selector: string) {
    return selector === "title"
      ? { textContent: this.body.dataset.slug }
      : null;
  }
  querySelectorAll() {
    return [];
  }
}

function createBrowser() {
  const pages = new Map<string, PageFixture>([
    ["/", { lang: "zh", dir: "ltr", slug: "index" }],
    ["/en/", { lang: "en", dir: "ltr", slug: "en/index" }],
    ["/zh-tw/", { lang: "zh-tw", dir: "ltr", slug: "zh-tw/index" }],
    ["/es/", { lang: "es", dir: "ltr", slug: "es/index" }],
    ["/pt/", { lang: "pt", dir: "ltr", slug: "pt/index" }],
    ["/ja/", { lang: "ja", dir: "ltr", slug: "ja/index" }],
    ["/rtl/", { lang: "ar", dir: "rtl", slug: "rtl/index" }],
  ]);
  const document = new DocumentFixture(pages.get("/")!);
  document.documentElement.setAttribute("saved-theme", "dark");
  const window = Object.assign(new EventTarget(), {
    document,
    location: new URL("https://example.com/"),
    scrollTo() {},
    async spaNavigate(_url: URL) {},
  });
  const entries = [window.location.href];
  let position = 0;
  const history = {
    pushState(_state: unknown, _title: string, url: URL) {
      window.location = new URL(url);
      entries.splice(++position, entries.length, url.href);
    },
  };
  runInNewContext(routerScript, {
    window,
    document,
    history,
    URL,
    CustomEvent,
    console,
    // The loading animation is unrelated to document language.
    setTimeout() {},
    customElements: { get: () => true },
    DOMParser: class {
      parseFromString(contents: string) {
        return new DocumentFixture(JSON.parse(contents));
      }
    },
    fetch: async (url: string) => {
      const page = pages.get(new URL(url).pathname);
      assert.ok(page, `unexpected navigation: ${url}`);
      return new Response(JSON.stringify(page), {
        headers: { "content-type": "text/html" },
      });
    },
    require(name: string) {
      assert.equal(name, "micromorph");
      return async (body: ElementFixture, next: ElementFixture) => {
        body.dataset = { ...next.dataset };
      };
    },
  });
  return {
    document,
    window,
    navigate: (path: string) =>
      window.spaNavigate(new URL(path, window.location)),
    async traverse(delta: number) {
      const navigated = new Promise<void>((resolve) => {
        document.addEventListener("nav", () => resolve(), { once: true });
      });
      window.location = new URL(entries[(position += delta)]);
      window.dispatchEvent(new Event("popstate"));
      await navigated;
      await setImmediate();
    },
    historyLength: () => entries.length,
  };
}

test("SPA language switches update the document language across all six locales", async () => {
  const browser = createBrowser();
  for (const [path, lang] of [
    ["/en/", "en"],
    ["/zh-tw/", "zh-tw"],
    ["/es/", "es"],
    ["/pt/", "pt"],
    ["/ja/", "ja"],
    ["/", "zh"],
  ]) {
    await browser.navigate(path);
    assert.equal(browser.window.location.pathname, path);
    assert.equal(browser.document.documentElement.lang, lang);
  }
});

test("back and forward restore language before nav listeners run without adding history", async () => {
  const browser = createBrowser();
  await browser.navigate("/en/");
  await browser.navigate("/es/");
  const announcedLanguages: string[] = [];
  browser.document.addEventListener("nav", () => {
    announcedLanguages.push(browser.document.documentElement.lang);
  });

  await browser.traverse(-1);
  assert.equal(browser.window.location.pathname, "/en/");
  assert.equal(browser.document.documentElement.lang, "en");
  await browser.traverse(-1);
  assert.equal(browser.window.location.pathname, "/");
  assert.equal(browser.document.documentElement.lang, "zh");
  await browser.traverse(1);
  await browser.traverse(1);
  assert.equal(browser.window.location.pathname, "/es/");
  assert.deepEqual(announcedLanguages, ["en", "zh", "en", "es"]);
  assert.equal(browser.historyLength(), 3);
});

test("navigation updates document direction while preserving the saved theme", async () => {
  const browser = createBrowser();
  await browser.navigate("/rtl/");
  assert.equal(browser.document.documentElement.dir, "rtl");
  assert.equal(
    browser.document.documentElement.getAttribute("saved-theme"),
    "dark",
  );
  await browser.navigate("/en/");
  assert.equal(browser.document.documentElement.dir, "ltr");
  assert.equal(
    browser.document.documentElement.getAttribute("saved-theme"),
    "dark",
  );
});
