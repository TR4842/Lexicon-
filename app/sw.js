/* Vocab Ledger — offline service worker: precache everything, cache-first forever. */
const VERSION = "vocab-ledger-v1";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "js/store.js",
  "js/ui.js",
  "js/exam.js",
  "js/app.js",
  "data/vocab.js",
  "assets/fonts/fraunces-latin-400-normal.woff2",
  "assets/fonts/fraunces-latin-600-normal.woff2",
  "assets/fonts/fraunces-latin-700-normal.woff2",
  "assets/fonts/fraunces-latin-900-normal.woff2",
  "assets/fonts/nunito-latin-400-normal.woff2",
  "assets/fonts/nunito-latin-600-normal.woff2",
  "assets/fonts/nunito-latin-700-normal.woff2",
  "assets/fonts/nunito-latin-800-normal.woff2",
  "assets/fonts/noto-sans-bengali-bengali-400-normal.woff2",
  "assets/fonts/noto-sans-bengali-bengali-600-normal.woff2",
  "assets/fonts/noto-sans-bengali-bengali-700-normal.woff2",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png",
  "assets/icons/apple-touch-icon.png",
  "assets/icons/favicon-32.png",
  "assets/icons/favicon-96.png",
  "assets/icons/logo-mark-256.png",
  "assets/avatars/boy-1.png",
  "assets/avatars/boy-2.png",
  "assets/avatars/boy-3.png",
  "assets/avatars/girl-1.png",
  "assets/avatars/girl-2.png",
  "assets/avatars/girl-3.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match("index.html"));
    })
  );
});
