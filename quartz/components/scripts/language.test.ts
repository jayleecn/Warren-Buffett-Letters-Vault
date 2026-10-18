import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import { LANGUAGE_PREFERENCE_KEY } from "../../i18n/browserLocale";

const { outputFiles } = await build({
  entryPoints: [new URL("./language.inline.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  format: "iife",
});
const script = outputFiles[0].text;
class ElementFixture {
  href = "/";
  hreflang = "";
  textContent = "";
  closest() {
    return this;
  }
}
class SelectFixture extends ElementFixture {
  value = "/";
  selectedOptions = [{ dataset: { locale: "zh" } }];
  matches(selector: string) {
    return selector === "select.language-select";
  }
}
function browser(
  options: {
    path?: string;
    languages?: string[];
    language?: string;
    preference?: string;
    blocked?: boolean;
    referrer?: string;
    navigation?: string;
    spa?: boolean;
  } = {},
) {
  const listeners = new Map<string, ((event: unknown) => void)[]>();
  const stored = new Map(
    options.preference ? [[LANGUAGE_PREFERENCE_KEY, options.preference]] : [],
  );
  const replacements: string[] = [];
  const navigations: string[] = [];
  const location = Object.assign(
    new URL(options.path ?? "/", "https://example.com"),
    {
      replace(url: string) {
        replacements.push(url);
      },
      assign(url: string) {
        navigations.push(url);
      },
    },
  );
  const window = {
    location,
    ...(options.spa === false
      ? {}
      : {
          spaNavigate(url: URL) {
            navigations.push(url.href);
          },
        }),
  };
  runInNewContext(script, {
    window,
    URL,
    Element: ElementFixture,
    HTMLSelectElement: SelectFixture,
    navigator: {
      languages: options.languages ?? ["en-US"],
      language: options.language ?? "en-US",
    },
    performance: {
      getEntriesByType: () => [{ type: options.navigation ?? "navigate" }],
    },
    document: {
      referrer: options.referrer ?? "",
      addEventListener(name: string, listener: (event: unknown) => void) {
        listeners.set(name, [...(listeners.get(name) ?? []), listener]);
      },
    },
    localStorage: {
      getItem(key: string) {
        if (options.blocked) throw Error("denied");
        return stored.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        if (options.blocked) throw Error("denied");
        stored.set(key, value);
      },
    },
  });
  return {
    window,
    replacements,
    navigations,
    stored,
    dispatch(name: string, target?: unknown) {
      for (const listener of listeners.get(name) ?? []) listener({ target });
    },
  };
}
test("root initial entry uses browser preference and preserves query", () => {
  assert.deepEqual(
    browser({ path: "/?utm_source=test", languages: ["ja-JP"] }).replacements,
    ["https://example.com/ja/?utm_source=test"],
  );
  assert.deepEqual(browser({ languages: ["zh-CN"] }).replacements, []);
  assert.deepEqual(browser({ languages: ["fr"] }).replacements, [
    "https://example.com/en/",
  ]);
  assert.deepEqual(browser({ languages: [], language: "es-MX" }).replacements, [
    "https://example.com/es/",
  ]);
});
test("manual preference wins and invalid saved values fall back to browser", () => {
  assert.deepEqual(browser({ preference: "zh" }).replacements, []);
  assert.deepEqual(
    browser({ preference: "ja", languages: ["zh"] }).replacements,
    ["https://example.com/ja/"],
  );
  assert.deepEqual(
    browser({ preference: "de", languages: ["pt"] }).replacements,
    ["https://example.com/pt/"],
  );
});
test("explicit URLs, same-origin entries and history traversal never negotiate", () => {
  for (const path of [
    "/en/",
    "/zh-tw/",
    "/es/",
    "/pt/",
    "/ja/",
    "/03-concepts/example",
    "/en/letters/test",
    "/#navigation",
  ]) {
    assert.deepEqual(
      browser({ path, preference: "ja" }).replacements,
      [],
      path,
    );
  }
  assert.deepEqual(
    browser({ referrer: "https://example.com/03-concepts/example" })
      .replacements,
    [],
  );
  assert.deepEqual(browser({ navigation: "back_forward" }).replacements, []);
  assert.equal(
    browser({ referrer: "https://elsewhere.com/" }).replacements.length,
    1,
  );
});
test("SPA navigation events do not rerun entry negotiation", () => {
  const page = browser({ path: "/en/" });
  page.window.location.pathname = "/";
  page.dispatch("nav");
  page.dispatch("nav");
  assert.deepEqual(page.replacements, []);
});
test("switcher persists explicit choice and navigates once, across repeated SPA nav", () => {
  const page = browser({ path: "/en/" });
  const select = new SelectFixture();
  page.dispatch("nav");
  page.dispatch("nav");
  page.dispatch("change", select);
  assert.equal(page.stored.get(LANGUAGE_PREFERENCE_KEY), "zh");
  assert.deepEqual(page.navigations, ["https://example.com/"]);
});
test("storage failure cannot block detection or explicit switching; non-SPA fallback works", () => {
  const page = browser({ blocked: true, spa: false });
  assert.deepEqual(page.replacements, ["https://example.com/en/"]);
  page.dispatch("change", new SelectFixture());
  assert.deepEqual(page.navigations, ["https://example.com/"]);
});
test("ordinary home language links save choices, breadcrumbs and external links do not", () => {
  const page = browser({ path: "/en/" });
  const link = new ElementFixture();
  link.textContent = "Home";
  page.dispatch("click", link);
  assert.equal(page.stored.size, 0);
  link.textContent = "简体中文";
  page.dispatch("click", link);
  assert.equal(page.stored.get(LANGUAGE_PREFERENCE_KEY), "zh");
  link.href = "https://elsewhere.com/ja/";
  link.textContent = "日本語";
  page.dispatch("click", link);
  assert.equal(page.stored.get(LANGUAGE_PREFERENCE_KEY), "zh");
  link.href = "/zh-tw/";
  link.hreflang = "zh-TW";
  link.textContent = "Traditional Chinese";
  page.dispatch("click", link);
  assert.equal(page.stored.get(LANGUAGE_PREFERENCE_KEY), "zh-tw");
});
