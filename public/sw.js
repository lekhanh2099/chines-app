// HanziHome Service Worker — PWA & Safe Static Cache
const CACHE_VERSION = "v1";
const STATIC_CACHE = `hanzihome-static-${CACHE_VERSION}`;
const PAGES_CACHE = `hanzihome-pages-${CACHE_VERSION}`;

const PRECACHE_ASSETS = ["/favicon.svg"];

self.addEventListener("install", (event) => {
 event.waitUntil(
  caches.open(STATIC_CACHE).then((cache) => {
   return cache.addAll(PRECACHE_ASSETS);
  }),
 );
 self.skipWaiting();
});

self.addEventListener("activate", (event) => {
 event.waitUntil(
  caches.keys().then((keys) => {
   return Promise.all(
    keys.map((key) => {
     if (key !== STATIC_CACHE && key !== PAGES_CACHE) {
      return caches.delete(key);
     }
     return Promise.resolve(true);
    }),
   );
  }),
 );
 self.clients.claim();
});

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

 // Navigation requests: Network-first with cache fallback for cold boot
 if (request.mode === "navigate") {
  event.respondWith(
   fetch(request)
    .then((response) => {
     if (response.status === 200) {
      const clone = response.clone();
      caches.open(PAGES_CACHE).then((cache) => {
       cache.put(request, clone);
      });
     }
     return response;
    })
    .catch(async () => {
     const cached = await caches.match(request);
     if (cached) return cached;
     const fallback = await caches.match("/");
     if (fallback) return fallback;
     return new Response(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Offline — HanziHome</title><meta name='viewport' content='width=device-width, initial-scale=1'></head><body style='font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#f8fafc'><h2>Chế độ ngoại tuyến</h2><p>Vui lòng kết nối mạng hoặc quay lại bài học đã được lưu trên máy.</p><a href='/hanzihome' style='color:#38bdf8'>Vào HanziHome</a></body></html>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
     );
    }),
  );
  return;
 }

 // Static assets: Cache-first, falling back to network
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
   caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
     if (response.status === 200) {
      const clone = response.clone();
      caches.open(STATIC_CACHE).then((cache) => {
       cache.put(request, clone);
      });
     }
     return response;
    });
   }),
  );
 }
});
