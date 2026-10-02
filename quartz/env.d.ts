declare module "*.scss" {
  const content: string;
  export default content;
}

type ContentIndex = Record<
  import("./util/path").FullSlug,
  import("./plugins/emitters/contentIndex").ContentDetails
>;
declare const fetchData: Promise<ContentIndex>;

interface CustomEventMap {
  nav: CustomEvent<{ url: import("./util/path").FullSlug }>;
  prenav: CustomEvent;
  themechange: CustomEvent<{ theme: "light" | "dark" }>;
  readermodechange: CustomEvent<{ mode: "on" | "off" }>;
}

interface DocumentEventMap extends CustomEventMap {}

interface Window {
  spaNavigate: (url: URL, isBack?: boolean) => Promise<void>;
  addCleanup: (fn: () => void) => void;
}
