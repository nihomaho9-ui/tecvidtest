const SHELL = "tecvid-shell-v23";
const FONTS = "https://mushafuk.online/yazi-fonts/";
// Replaced at build time with the hashed JS/CSS filenames in dist/assets.
const ASSETS = "__SHELL_ASSETS__";

function shellList() {
  const base = self.registration.scope;
  const listed = Array.isArray(ASSETS) ? ASSETS : [];
  const defaults = [
    "./",
    "./index.html",
    "./sura_names.woff2",
    "./corpus.json",
    "./ort/ort-wasm-simd-threaded.wasm",
    "./ort/ort-wasm-simd-threaded.mjs",
    "./fonts/AmiriQuran-arabic.woff2",
    "./mic-worklet.js",
    "./surah-banner.png",
    "./manifest.webmanifest",
    "./pg/index.json",
    "./favicon.ico",
    "./favicon-32.png",
    "./icon-192.png",
    "./apple-touch-icon.png",
  ];
  return [...new Set([...defaults, ...listed])].map((path) => new URL(path, base).href);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        Promise.all(shellList().map((url) => cache.add(url).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => (key.startsWith("tecvid-shell-") && key !== SHELL) || key === "tartil-audio").map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "precache" || !Array.isArray(data.urls)) return;
  event.waitUntil(
    caches.open(SHELL).then((cache) => Promise.all(data.urls.map((url) => cache.add(url).catch(() => undefined)))),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  const font = url.href.startsWith(FONTS);
  if (url.origin !== self.location.origin && !font) return;
  if (url.pathname.endsWith("/model.onnx")) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
        }
        return res;
      })
      .catch(async () => {
        const hit = (await caches.match(event.request)) || (await caches.match(event.request, { ignoreSearch: true }));
        if (hit) return hit;
        if (event.request.mode === "navigate") {
          return (
            (await caches.match(new URL("./", self.registration.scope))) ||
            (await caches.match(new URL("./index.html", self.registration.scope))) ||
            Response.error()
          );
        }
        return Response.error();
      }),
  );
});
