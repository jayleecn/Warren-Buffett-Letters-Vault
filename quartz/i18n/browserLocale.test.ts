import assert from "node:assert/strict";
import test from "node:test";
import { browserLocale, localeHome, supportedLocale } from "./browserLocale";
import { SITE_LOCALES } from "./siteLocales";

for (const [input, expected] of [
  ["en-US", "en"],
  ["en-GB", "en"],
  ["ja-JP", "ja"],
  ["es-MX", "es"],
  ["pt-PT", "pt"],
  ["pt-BR", "pt"],
  ["zh", "zh"],
  ["zh-CN", "zh"],
  ["zh-SG", "zh"],
  ["zh-Hans", "zh"],
  ["zh-TW", "zh-tw"],
  ["zh-HK", "zh-tw"],
  ["zh-MO", "zh-tw"],
  ["zh-Hant", "zh-tw"],
  ["zh-Hans-TW", "zh"],
  ["zh-Hant-CN", "zh-tw"],
  ["ZH-hant-hk", "zh-tw"],
  ["fr-FR", "en"],
  ["de", "en"],
  ["ko-KR", "en"],
  ["", "en"],
  ["not a language", "en"],
]) {
  test(`browser locale ${JSON.stringify(input)} resolves to ${expected}`, () => {
    assert.equal(browserLocale([input]), expected);
  });
}
test("browser priority chooses the first supported language, otherwise English", () => {
  assert.equal(browserLocale(["fr-FR", "ja-JP", "en"]), "ja");
  assert.equal(browserLocale(["invalid value", "zh-HK"]), "zh-tw");
  assert.equal(browserLocale(["es", "zh"]), "es");
  assert.equal(browserLocale(["fr", "de"]), "en");
  assert.equal(browserLocale([]), "en");
});
test("persisted choices accept only enabled locales and preserve existing homes", () => {
  for (const locale of SITE_LOCALES) {
    assert.equal(supportedLocale(locale.code), locale.code);
    assert.equal(
      localeHome(locale.code),
      locale.prefix ? `/${locale.prefix}/` : "/",
    );
  }
  for (const invalid of [null, "de", "fr", "en-US", "garbage", ""]) {
    assert.equal(supportedLocale(invalid), undefined);
  }
});
