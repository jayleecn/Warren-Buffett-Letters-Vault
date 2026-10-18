import {
  browserLocale,
  LANGUAGE_PREFERENCE_KEY,
  localeHome,
  supportedLocale,
} from "../../i18n/browserLocale";
import { SITE_LOCALES } from "../../i18n/siteLocales";

function remember(code: string | undefined) {
  if (!code) return;
  try {
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, code);
  } catch {
    // Private/restricted storage must never prevent an explicit language switch.
  }
}

function go(href: string) {
  const url = new URL(href, window.location.href);
  if (typeof window.spaNavigate === "function") window.spaNavigate(url);
  else window.location.assign(url.toString());
}

// Run once per document, not on Quartz's repeated SPA nav events. Explicit
// deep links, anchored links, same-site navigation and history traversal win.
function chooseEntryLanguage() {
  if (window.location.pathname !== "/" || window.location.hash) return;
  if (
    performance
      .getEntriesByType("navigation")
      .some(
        (entry) =>
          (entry as PerformanceNavigationTiming).type === "back_forward",
      )
  )
    return;
  try {
    if (
      document.referrer &&
      new URL(document.referrer).origin === window.location.origin
    )
      return;
  } catch {
    // An absent or malformed referrer does not prevent first-entry negotiation.
  }
  let preferred;
  try {
    preferred = supportedLocale(localStorage.getItem(LANGUAGE_PREFERENCE_KEY));
  } catch {
    // Browser preferences still work when persistence is unavailable.
  }
  const code =
    preferred ??
    browserLocale(
      navigator.languages?.length ? navigator.languages : [navigator.language],
    );
  const home = localeHome(code);
  if (home !== "/") {
    const target = new URL(home, window.location.href);
    target.search = window.location.search;
    window.location.replace(target.toString());
  }
}
chooseEntryLanguage();

// Delegated listeners survive SPA morphing without accumulating per-page handlers.
document.addEventListener("change", (event) => {
  const select = event.target;
  if (
    !(select instanceof HTMLSelectElement) ||
    !select.matches("select.language-select")
  )
    return;
  const option = select.selectedOptions[0];
  remember(supportedLocale(option?.dataset.locale ?? null));
  if (select.value) go(select.value);
});

// The home pages also expose ordinary language links. Treat those exactly like
// the switcher, without mistaking a breadcrumb or site-title link for a choice.
document.addEventListener(
  "click",
  (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a");
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    const locale = SITE_LOCALES.find(
      (loc) =>
        url.pathname.replace(/\/$/, "") ===
          localeHome(loc.code).replace(/\/$/, "") &&
        (link.hreflang === loc.hreflang ||
          link.textContent?.trim() === loc.label),
    );
    remember(locale?.code);
  },
  { capture: true },
);
