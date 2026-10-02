// HanziHome Service Worker — PWA & Safe Static Cache
const CACHE_VERSION = "v11";
const STATIC_CACHE = `hanzihome-static-${CACHE_VERSION}`;
const OFFLINE_OWNER_CACHE = "hanzihome-offline-owner";
const OFFLINE_OWNER_CACHE_PATH = "/__hanzihome-offline-owner";

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
  // Cache the route HTML shell itself for offline React app mount
  await staticCache.put(route, res.clone());
  await staticCache.put(self.location.origin + route, res.clone());
  await staticCache.put("/__app_shell", res.clone());
  await staticCache.put(self.location.origin + "/__app_shell", res.clone());

  // Also pre-cache the Next.js RSC payload for client-side navigation
  try {
   const rscRes = await fetch(route, { headers: { RSC: "1" } });
   if (rscRes.status === 200) {
    await staticCache.put(new Request(route, { headers: { RSC: "1" } }), rscRes.clone());
    await staticCache.put(
     new Request(self.location.origin + route, { headers: { RSC: "1" } }),
     rscRes,
    );
   }
  } catch {
   // Ignore transient RSC error
  }

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
     // Keep the per-browser owner marker and existing static caches as offline safety net
     if (
      key === STATIC_CACHE ||
      key === OFFLINE_OWNER_CACHE ||
      key.startsWith("hanzihome-static-")
     ) {
      return Promise.resolve(true);
     }
     return caches.delete(key);
    }),
   );
  }),
 );
 self.clients.claim();
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
      padding: 24px 16px;
    }
    .card {
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 32px 28px;
      max-width: 560px;
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
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #f8fafc;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
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
      text-align: left;
    }
    .nav-links {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .nav-link {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 14px;
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.15s ease;
      text-align: center;
    }
    .nav-link:hover {
      background: #334155;
      border-color: #38bdf8;
    }
    .nav-link:active {
      transform: scale(0.98);
    }
    .status-badge {
      display: none;
      margin-top: 20px;
      font-size: 12px;
      color: #4ade80;
      background: rgba(34, 197, 94, 0.1);
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }
    .offline-lessons {
      display: grid;
      gap: 12px;
      margin-top: 16px;
      text-align: left;
    }
    .offline-lessons h2 {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .offline-lesson-list {
      display: grid;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .offline-lesson-button {
      width: 100%;
      border: 1px solid #1e293b;
      border-radius: 10px;
      background: #131d38;
      color: #e0f2fe;
      cursor: pointer;
      font: inherit;
      padding: 12px 16px;
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      transition: all 0.15s ease;
    }
    .offline-lesson-button:hover {
      background: #1e293b;
      border-color: #38bdf8;
      transform: translateY(-1px);
    }
    .offline-lesson-button:active {
      transform: translateY(0);
    }
    .offline-lesson-button:focus-visible {
      outline: 2px solid #38bdf8;
      outline-offset: 2px;
    }
    .offline-lesson-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .offline-lesson-title {
      font-size: 15px;
      font-weight: 600;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .offline-lesson-subtitle {
      color: #94a3b8;
      font-size: 13px;
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .offline-lesson-arrow {
      color: #38bdf8;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
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
    <h1 id="offlineTitle">Chế độ ngoại tuyến</h1>
    <p id="offlineDescription">Chọn một bài học đã tải hoặc chuyển sang giáo trình để tiếp tục học với đầy đủ giao diện, tra từ điển và phát âm.</p>

    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.location.reload()">
        Thử tải lại trang
      </button>
      <button class="btn btn-secondary" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/vi/hanzihome'">
        Quay lại bài học trước
      </button>
    </div>

    <div id="courseLinksTitle" class="links-title">Giáo trình trên máy</div>
    <div class="nav-links">
      <a class="nav-link" href="/vi/hanzihome">Thư viện</a>
      <a class="nav-link" href="/vi/hsk/han-thuong-mai">Hán thương mại</a>
      <a class="nav-link" href="/vi/hsk/nhip-cau-han-ngu">Nhịp cầu Hán ngữ</a>
      <a class="nav-link" href="/vi/hsk/doc-hieu">Đọc hiểu</a>
    </div>

    <section id="offlineLessons" class="offline-lessons" hidden>
      <h2 id="offlineLessonsHeading">Bài đã tải</h2>
      <div id="offlineLessonList" class="offline-lesson-list"></div>
    </section>

    <div id="statusBadge" class="status-badge">
      ✓ Dữ liệu ngoại tuyến đã sẵn sàng trong máy
    </div>
  </div>

  <script>
    (function() {
      var ownerCache = "hanzihome-offline-owner";
      var ownerMarker = "/__hanzihome-offline-owner";
      var databaseName = "hanzihome-local-db";
      var cacheStoreName = "content_cache";
      var title = document.getElementById("offlineTitle");
      var description = document.getElementById("offlineDescription");
      var lessons = document.getElementById("offlineLessons");
      var lessonList = document.getElementById("offlineLessonList");

      function text(value) {
        return typeof value === "string" ? value.trim() : "";
      }

      function record(value) {
        return value && typeof value === "object" && !Array.isArray(value) ? value : null;
      }

      function list(value) {
        return Array.isArray(value) ? value : [];
      }

      function firstText(values) {
        for (var index = 0; index < values.length; index += 1) {
          var candidate = text(values[index]);
          if (candidate) return candidate;
        }
        return "";
      }

      function lessonData(entry) {
        return record(entry.data);
      }

      function sourceLesson(data) {
        var source = record(data && data.sourceLesson);
        return source ? record(source.lesson) : null;
      }

      function lessonTitle(entry) {
        var data = lessonData(entry);
        var source = sourceLesson(data);
        var sourceTitle = source ? record(source.title) : null;
        return firstText([
          data && data.title,
          sourceTitle && sourceTitle.vi,
          sourceTitle && sourceTitle.zh,
          sourceTitle && sourceTitle.en,
          data && data.titleZh,
          entry.resourceId,
        ]);
      }

      function lessonSubtitle(entry) {
        var data = lessonData(entry);
        var source = sourceLesson(data);
        var sourceTitle = source ? record(source.title) : null;
        return firstText([
          sourceTitle && sourceTitle.zh,
          data && data.titleZh,
          data && data.courseTitle,
          data && data.bookTitle,
        ]);
      }

      function getLessonUrl(entry) {
        var data = lessonData(entry);
        var resourceId = text(entry && entry.resourceId).toLowerCase();
        var courseId = text(data && data.courseId).toLowerCase();
        var bookId = text(data && data.bookId).toLowerCase();
        var lessonNum = (data && data.lessonNumber) || 1;

        if (resourceId.includes("doc-hieu") || courseId.includes("doc-hieu") || bookId.includes("doc-hieu")) {
          return "/vi/hsk/doc-hieu?lesson=" + lessonNum;
        }
        if (resourceId.includes("nhip-cau") || courseId.includes("nhip-cau") || bookId.includes("nhip-cau")) {
          return "/vi/hsk/nhip-cau-han-ngu?lesson=" + lessonNum;
        }
        if (resourceId.includes("han-thuong-mai") || resourceId.includes("tm") || courseId.includes("han-thuong-mai") || bookId.includes("tm")) {
          return "/vi/hsk/han-thuong-mai?lesson=" + lessonNum;
        }
        var id = text(data && data.id) || text(entry && entry.resourceId);
        if (courseId && id) {
          return "/vi/hanzihome?courseId=" + encodeURIComponent(courseId) + "&lessonId=" + encodeURIComponent(id);
        }
        if (id) {
          return "/vi/hanzihome?lessonId=" + encodeURIComponent(id);
        }
        return "/vi/hanzihome";
      }

      function showLessonList(entries) {
        lessons.hidden = false;
        lessonList.hidden = false;
        lessonList.replaceChildren();
        document.getElementById("statusBadge").style.display = "inline-block";

        entries.forEach(function(entry) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "offline-lesson-button";

          var info = document.createElement("div");
          info.className = "offline-lesson-info";

          var titleEl = document.createElement("span");
          titleEl.className = "offline-lesson-title";
          titleEl.textContent = lessonTitle(entry);
          info.appendChild(titleEl);

          var subtitle = lessonSubtitle(entry);
          if (subtitle && subtitle !== lessonTitle(entry)) {
            var subtitleElement = document.createElement("span");
            subtitleElement.className = "offline-lesson-subtitle";
            subtitleElement.textContent = subtitle;
            info.appendChild(subtitleElement);
          }
          button.appendChild(info);

          var arrow = document.createElement("span");
          arrow.className = "offline-lesson-arrow";
          arrow.textContent = "→";
          button.appendChild(arrow);

          var targetUrl = getLessonUrl(entry);
          button.addEventListener("click", function() {
            window.location.href = targetUrl;
          });
          lessonList.appendChild(button);
        });
      }

      function cachedLessonsFor(ownerId) {
        return new Promise(function(resolve, reject) {
          var openRequest = indexedDB.open(databaseName);
          openRequest.onerror = function() {
            reject(openRequest.error || new Error("Không thể mở dữ liệu ngoại tuyến."));
          };
          openRequest.onsuccess = function() {
            var database = openRequest.result;
            if (!database.objectStoreNames.contains(cacheStoreName)) {
              database.close();
              resolve([]);
              return;
            }
            var transaction = database.transaction(cacheStoreName, "readonly");
            var request = transaction.objectStore(cacheStoreName).getAll();
            request.onerror = function() {
              database.close();
              reject(request.error || new Error("Không thể đọc dữ liệu ngoại tuyến."));
            };
            request.onsuccess = function() {
              var entries = list(request.result).filter(function(value) {
                var entry = record(value);
                var metadata = entry ? record(entry.metadata) : null;
                return Boolean(
                  entry &&
                    metadata &&
                    entry.ownerId === ownerId &&
                    entry.resourceType === "lesson_detail" &&
                    metadata.deletedAt === undefined &&
                    lessonData(entry),
                );
              });
              database.close();
              entries.sort(function(left, right) {
                return lessonTitle(left).localeCompare(lessonTitle(right), "vi");
              });
              resolve(entries);
            };
          };
        });
      }

      function readOfflineOwner() {
        return caches
          .open(ownerCache)
          .then(function(cache) {
            return cache.match(new URL(ownerMarker, window.location.origin).toString());
          })
          .then(function(response) {
            return response ? response.text() : "";
          })
          .then(function(ownerId) {
            return text(ownerId);
          });
      }

      window.addEventListener("online", function() {
        window.location.reload();
      });

      readOfflineOwner()
        .then(function(ownerId) {
          if (!ownerId) {
            title.textContent = "Cần mở lại khi có mạng";
            description.textContent =
              "Không thể xác định tài khoản đã tải bài khi không có mạng.";
            return [];
          }
          return cachedLessonsFor(ownerId);
        })
        .then(function(entries) {
          if (entries.length === 0) {
            title.textContent = "Chưa có bài đã tải";
            description.textContent =
              "Khi có mạng, mở một giáo trình và chọn tải để học ngoại tuyến.";
            return;
          }
          description.textContent =
            "Chọn một bài học đã lưu trên máy để mở giao diện học tập hoàn chỉnh.";
          showLessonList(entries);
        })
        .catch(function() {
          title.textContent = "Không thể mở thư viện ngoại tuyến";
          description.textContent =
            "Hãy thử tải lại khi kết nối mạng được khôi phục.";
        });
    })();
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

 // 1. Navigation requests: Network-first with App Shell cache fallback
 if (request.mode === "navigate") {
  event.respondWith(
   (async () => {
    try {
     const networkResponse = await fetch(request);
     if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, networkResponse.clone());
      await cache.put(url.pathname, networkResponse.clone());
      await cache.put(self.location.origin + url.pathname, networkResponse.clone());
      await cache.put("/__app_shell", networkResponse.clone());
      await cache.put(self.location.origin + "/__app_shell", networkResponse.clone());
     }
     return networkResponse;
    } catch {
     // 1. Exact request match
     const cachedResponse = await caches.match(request);
     if (cachedResponse) return cachedResponse;

     // 2. Pathname variants
     const pathnameVariants = [
      url.pathname,
      self.location.origin + url.pathname,
      url.pathname.startsWith("/vi/")
       ? url.pathname
       : "/vi" + (url.pathname.startsWith("/") ? url.pathname : "/" + url.pathname),
      self.location.origin +
       (url.pathname.startsWith("/vi/")
        ? url.pathname
        : "/vi" + (url.pathname.startsWith("/") ? url.pathname : "/" + url.pathname)),
      url.pathname.replace(/^\/(?:vi|en|zh-CN)/, ""),
     ];
     for (const p of pathnameVariants) {
      const match = await caches.match(p);
      if (match) return match;
     }

     // 3. Fallback to master App Shell
     const appShell = await caches.match("/__app_shell");
     if (appShell) return appShell;
     const fullAppShell = await caches.match(self.location.origin + "/__app_shell");
     if (fullAppShell) return fullAppShell;

     // 4. Fallback to ANY cached App Shell from PRECACHE_ROUTES
     for (const candidate of PRECACHE_ROUTES) {
      const shell = await caches.match(candidate);
      if (shell) return shell;
      const fullShell = await caches.match(self.location.origin + candidate);
      if (fullShell) return fullShell;
     }

     // 4. Scan all cached HTML pages across all static caches
     const allKeys = await caches.keys();
     for (const key of allKeys) {
      if (key.startsWith("hanzihome-static-")) {
       const openCache = await caches.open(key);
       const requests = await openCache.keys();
       for (const r of requests) {
        if (r.url.includes("/vi/") || r.url.includes("/hsk/")) {
         const resp = await openCache.match(r);
         if (resp && resp.status === 200) {
          const contentType = resp.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
           return resp;
          }
         }
        }
       }
      }
     }

     // Last resort fallback
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

 // 2. Next.js RSC requests (client-side routing): Network-first with cache fallback
 const isRscRequest = url.searchParams.has("_rsc") || request.headers.get("RSC") === "1";
 if (isRscRequest) {
  event.respondWith(
   (async () => {
    try {
     const networkResponse = await fetch(request);
     if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, networkResponse.clone());
      await cache.put(
       new Request(url.pathname, { headers: { RSC: "1" } }),
       networkResponse.clone(),
      );
     }
     return networkResponse;
    } catch {
     const cachedRsc = await caches.match(request);
     if (cachedRsc) return cachedRsc;

     const pathnameRsc = await caches.match(new Request(url.pathname, { headers: { RSC: "1" } }));
     if (pathnameRsc) return pathnameRsc;

     const originPathRsc = await caches.match(
      new Request(self.location.origin + url.pathname, { headers: { RSC: "1" } }),
     );
     if (originPathRsc) return originPathRsc;

     for (const candidateRoute of PRECACHE_ROUTES) {
      const rscMatch = await caches.match(new Request(candidateRoute, { headers: { RSC: "1" } }));
      if (rscMatch) return rscMatch;
     }

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
