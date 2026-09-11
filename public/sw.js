// HanziHome Service Worker — PWA & Safe Static Cache
const CACHE_VERSION = "v6";
const STATIC_CACHE = `hanzihome-static-${CACHE_VERSION}`;

const PRECACHE_ASSETS = ["/favicon.svg"];
const PRECACHE_ROUTES = [
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
  const text = await res.text();

  // Extract only _next/static stylesheets and scripts embedded in the HTML
  const assetMatches = text.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+)"/g);
  const assetUrls = Array.from(new Set(Array.from(assetMatches, (m) => m[1])));
  await Promise.allSettled(
   assetUrls.map(async (assetUrl) => {
    try {
     const assetRes = await fetch(assetUrl);
     if (assetRes.status === 200) {
      await staticCache.put(assetUrl, assetRes.clone());
      await staticCache.put(self.location.origin + assetUrl, assetRes);
     }
    } catch {
     // Ignore individual transient asset error
    }
   }),
  );
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
    keys.map((key) => {
     // Delete old static caches and any legacy shared pages caches
     if (key !== STATIC_CACHE) {
      return caches.delete(key);
     }
     return Promise.resolve(true);
    }),
   );
  }),
 );
 self.clients.claim();
});

self.addEventListener("message", (event) => {
 if (event.data && event.data.type === "WARMUP_OFFLINE_CACHE") {
  const routes = Array.isArray(event.data.routes) ? event.data.routes : [];
  caches.open(STATIC_CACHE).then((staticCache) => {
   routes.forEach((route) => {
    if (typeof route === "string" && route.startsWith("/")) {
     precacheRouteAssets(staticCache, route);
    }
   });
  });
 }
});

function getOfflineLauncherHtml() {
 return `<!DOCTYPE html>
<html lang="vi" class="dark">
<head>
  <meta charset="utf-8">
  <title>Chế độ ngoại tuyến — HanziHome</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b1329;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background-color: #131d38;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
    }
    .icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #f8fafc;
    }
    p {
      font-size: 14px;
      line-height: 1.5;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }
    .btn-primary {
      background: #0284c7;
      color: #ffffff;
    }
    .btn-primary:active {
      background: #0369a1;
      transform: scale(0.98);
    }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
    }
    .btn-secondary:active {
      background: #334155;
      transform: scale(0.98);
    }
    .links-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .nav-links {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .nav-link {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 10px 8px;
      font-size: 13px;
      color: #38bdf8;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.15s;
    }
    .nav-link:active {
      background: #1e293b;
    }
    .status-badge {
      display: none;
      margin-top: 18px;
      font-size: 12px;
      color: #4ade80;
      background: rgba(34, 197, 94, 0.1);
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m2 2 20 20"></path>
        <path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"></path>
        <path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"></path>
      </svg>
    </div>
    <h1>Chế độ ngoại tuyến</h1>
    <p>Không có kết nối mạng. Bạn vẫn có thể tiếp tục học các bài học hoặc ghi chú đã được lưu trên máy.</p>

    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.location.reload()">
        Thử tải lại trang
      </button>
      <button class="btn btn-secondary" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/vi/hanzihome'">
        Quay lại bài học trước
      </button>
    </div>

    <div class="links-title">Giáo trình có sẵn trên máy</div>
    <div class="nav-links">
      <a class="nav-link" href="/vi/hanzihome">Thư viện</a>
      <a class="nav-link" href="/vi/hsk/han-thuong-mai">Hán thương mại</a>
      <a class="nav-link" href="/vi/hsk/nhip-cau-han-ngu">Nhịp cầu Hán ngữ</a>
      <a class="nav-link" href="/vi/hsk/doc-hieu">Đọc hiểu</a>
    </div>

    <div id="statusBadge" class="status-badge">
      ✓ Đã sẵn sàng dữ liệu ngoại tuyến trong máy
    </div>
  </div>

  <script>
    window.addEventListener("online", function() {
      window.location.reload();
    });
    try {
      var req = indexedDB.open("hanzihome-local-db");
      req.onsuccess = function(e) {
        var db = e.target.result;
        if (db.objectStoreNames.contains("content_cache")) {
          document.getElementById("statusBadge").style.display = "inline-block";
        }
      };
    } catch(err) {}
  </script>
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

 // 1. Navigation requests: Network-first with neutral offline launcher fallback
 if (request.mode === "navigate") {
  event.respondWith(
   (async () => {
    try {
     return await fetch(request);
    } catch {
     // Network failed (offline): return neutral offline launcher shell
     // Zero private user data, prevents any cross-account cache leakage.
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

 // 2. Next.js RSC requests (client-side routing): Network-first without caching private state
 const isRscRequest = url.searchParams.has("_rsc") || request.headers.get("RSC") === "1";
 if (isRscRequest) {
  event.respondWith(
   fetch(request).catch(() => {
    return new Response("", { status: 503, statusText: "Offline" });
   }),
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
