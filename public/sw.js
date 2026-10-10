// HanziHome Service Worker — PWA & Safe Static Cache
const CACHE_VERSION = "v13";
const STATIC_CACHE = `hanzihome-static-${CACHE_VERSION}`;
const OFFLINE_OWNER_CACHE = "hanzihome-offline-owner";
const OFFLINE_OWNER_CACHE_PATH = "/__hanzihome-offline-owner";

const PRECACHE_ASSETS = ["/favicon.svg"];
const OFFLINE_ROUTES = ["/vi/offline", "/en/offline", "/zh-CN/offline"];
const PRECACHE_ROUTES = [
 ...OFFLINE_ROUTES,
 "/vi/hanzihome",
 "/vi/hsk/han-thuong-mai",
 "/vi/hsk/nhip-cau-han-ngu",
 "/vi/hsk/doc-hieu",
];

/**
 * Pre-caches public static assets (CSS, JS) linked in route pages.
 * Safe PWA Principle: Never cache dynamic/authenticated HTML in shared caches.
 */
async function precacheRouteAssets(staticCache, route) {
 try {
  const res = await fetch(route);
  if (res.status !== 200) return;
  const htmlResponse = res.clone();
  const text = await res.text();

  // Extract only _next/static stylesheets and scripts embedded in the HTML
  const assetMatches = text.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g);
  const assetUrls = Array.from(new Set(Array.from(assetMatches, (m) => m[1])));
  const readyAssets = await Promise.all(
   assetUrls.map(async (assetUrl) => {
    try {
     if (await staticCache.match(assetUrl)) return true;
     const assetRes = await fetch(assetUrl);
     if (assetRes.status === 200) {
      await staticCache.put(assetUrl, assetRes.clone());
      await staticCache.put(self.location.origin + assetUrl, assetRes);
      return true;
     }
     return false;
    } catch {
     return false;
    }
   }),
  );
  const routePath = new URL(route, self.location.origin).pathname;
  if (
   OFFLINE_ROUTES.includes(routePath) &&
   new URL(res.url).pathname === routePath &&
   res.headers.get("content-type")?.includes("text/html") &&
   assetUrls.length > 0 &&
   readyAssets.every(Boolean)
  ) {
   await staticCache.put(routePath, htmlResponse);
  }
 } catch {
  // Ignore route error
 }
}

self.addEventListener("install", (event) => {
 event.waitUntil(
  (async () => {
   const staticCache = await caches.open(STATIC_CACHE);
   await staticCache.addAll(PRECACHE_ASSETS);
   await Promise.allSettled(
    PRECACHE_ROUTES.map((route) => precacheRouteAssets(staticCache, route)),
   );
  })(),
 );
 self.skipWaiting();
});

self.addEventListener("activate", (event) => {
 event.waitUntil(
  caches.keys().then((keys) => {
   return Promise.all(
    keys.map(async (key) => {
     if (key === OFFLINE_OWNER_CACHE) return;
     if (key === STATIC_CACHE || key.startsWith("hanzihome-static-")) {
      // Earlier workers stored authenticated HTML/RSC in these shared caches.
      // Remove those copies while retaining public assets and owner-scoped IDB data.
      const cache = await caches.open(key);
      await Promise.all(
       (await cache.keys()).map(async (request) => {
        const response = await cache.match(request);
        const contentType = response?.headers.get("content-type") ?? "";
        if (
         request.headers.get("RSC") === "1" ||
         new URL(request.url).searchParams.has("_rsc") ||
         (contentType.includes("text/html") &&
          (key !== STATIC_CACHE || !OFFLINE_ROUTES.includes(new URL(request.url).pathname))) ||
         contentType.includes("text/x-component")
        ) {
         await cache.delete(request);
        }
       }),
      );
      return;
     }
     return caches.delete(key);
    }),
   ).then(() => self.clients.claim());
  }),
 );
});

function offlineOwnerCacheUrl() {
 return new URL(OFFLINE_OWNER_CACHE_PATH, self.location.origin).toString();
}

async function setOfflineOwner(ownerId) {
 const cache = await caches.open(OFFLINE_OWNER_CACHE);
 const markerUrl = offlineOwnerCacheUrl();

 if (typeof ownerId !== "string" || !ownerId.trim()) {
  await cache.delete(markerUrl);
  return;
 }

 await cache.put(
  markerUrl,
  new Response(ownerId.trim(), {
   headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  }),
 );
}

self.addEventListener("message", (event) => {
 if (event.data && event.data.type === "SET_OFFLINE_OWNER") {
  event.waitUntil(setOfflineOwner(event.data.ownerId));
  return;
 }

 if (event.data && event.data.type === "WARMUP_OFFLINE_CACHE") {
  const routes = Array.isArray(event.data.routes) ? event.data.routes : [];
  event.waitUntil(
   caches
    .open(STATIC_CACHE)
    .then((staticCache) =>
     Promise.allSettled(
      routes
       .filter((route) => typeof route === "string" && route.startsWith("/"))
       .map((route) => precacheRouteAssets(staticCache, route)),
     ),
    ),
  );
 }
});

function getOfflineLauncherHtml() {
 return `<!DOCTYPE html>
<html lang="vi">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <title>Chế độ ngoại tuyến — HanziHome</title>
 <style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; font-family: system-ui, sans-serif; background: #0b1329; color: #f1f5f9; }
  main { width: 100%; max-width: 480px; padding: 24px; border: 1px solid #334155; border-radius: 16px; background: #0f172a; }
  p { line-height: 1.6; }
  button, a { font: inherit; color: #e0f2fe; background: #1e293b; border: 1px solid #64748b; border-radius: 8px; padding: 12px 16px; display: inline-block; }
  button:focus-visible, a:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
 </style>
</head>
<body>
 <main>
  <h1 id="offlineTitle">Chế độ ngoại tuyến</h1>
  <p>Trang học offline chưa được tải đầy đủ trên thiết bị này. Kết nối mạng rồi mở lại HanziHome để tải trang học.</p>
  <button onclick="window.location.reload()">Thử tải lại trang</button>
  <a href="/vi/offline">Mở trang học offline</a>
 </main>
 <script>window.addEventListener("online", function() { window.location.reload(); });</script>
</body>
</html>`;
}

self.addEventListener("fetch", (event) => {
 const request = event.request;
 const url = new URL(request.url);

 // Only intercept GET requests
 if (request.method !== "GET") return;

 // Do not intercept non-HTTP schemes (e.g. chrome-extension:)
 if (!url.protocol.startsWith("http")) return;

 // Safe PWA principle: NEVER cache private API or auth responses
 if (
  url.pathname.startsWith("/api/") ||
  url.hostname.includes("supabase.co") ||
  url.pathname.includes("/auth/")
 ) {
  return;
 }

 // 1. Private navigation stays network-only; only the public offline shell may be reused.
 if (request.mode === "navigate") {
  event.respondWith(
   (async () => {
    try {
     return await fetch(request);
    } catch {
     const locale = url.pathname.split("/")[1];
     const offlinePath =
      OFFLINE_ROUTES.find((path) => path === `/${locale}/offline`) ?? "/vi/offline";
     const cache = await caches.open(STATIC_CACHE);
     const shell = await cache.match(offlinePath);
     const assetUrls = shell
      ? Array.from(
         (await shell.clone().text()).matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g),
         (match) => match[1],
        )
      : [];
     const assets = await Promise.all(assetUrls.map((asset) => caches.match(asset)));
     if (shell && assetUrls.length > 0 && assets.every(Boolean)) {
      if (url.pathname === offlinePath) return shell;
      const target = new URL(offlinePath, self.location.origin);
      const textbookPath = url.pathname.slice(url.pathname.indexOf("/hsk/"));
      const book =
       textbookPath === "/hsk/han-thuong-mai"
        ? "tm3"
        : textbookPath === "/hsk/nhip-cau-han-ngu"
          ? "nhip-cau"
          : textbookPath === "/hsk/doc-hieu"
            ? "doc-hieu"
            : null;
      if (book) target.searchParams.set("book", book);
      for (const key of ["courseId", "bookId", "lesson", "lessonId", "module", "tab"]) {
       const value = url.searchParams.get(key);
       if (value) target.searchParams.set(key, value);
      }
      return Response.redirect(target.toString());
     }
     return new Response(getOfflineLauncherHtml(), {
      headers: {
       "Content-Type": "text/html; charset=utf-8",
       "Cache-Control": "no-store",
      },
     });
    }
   })(),
  );
  return;
 }

 // 2. Next.js RSC requests stay network-only, including authenticated payloads.
 const isRscRequest = url.searchParams.has("_rsc") || request.headers.get("RSC") === "1";
 if (isRscRequest) {
  event.respondWith(
   (async () => {
    try {
     return await fetch(request);
    } catch {
     return new Response("", { status: 503, statusText: "Offline" });
    }
   })(),
  );
  return;
 }

 // Bypass dev HMR / hot-reload connections so developer iteration stays immediate
 if (
  url.pathname.includes("webpack-hmr") ||
  url.pathname.includes("turbopack-hmr") ||
  url.pathname.startsWith("/_next/development")
 ) {
  return;
 }

 // 3. Static assets: Cache-first, falling back to network
 const isStaticAsset =
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/fonts/") ||
  url.pathname.endsWith(".svg") ||
  url.pathname.endsWith(".png") ||
  url.pathname.endsWith(".webp") ||
  url.pathname.endsWith(".css") ||
  url.pathname.endsWith(".woff2");

 if (isStaticAsset) {
  event.respondWith(
   caches.match(request, { ignoreSearch: true }).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((networkResponse) => {
     if (networkResponse.status === 200) {
      const clone = networkResponse.clone();
      caches.open(STATIC_CACHE).then((cache) => {
       cache.put(request, clone);
      });
     }
     return networkResponse;
    });
   }),
  );
 }
});
