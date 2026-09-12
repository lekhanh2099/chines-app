// HanziHome Service Worker — PWA & Safe Static Cache
const CACHE_VERSION = "v7";
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
     // Keep the per-browser owner marker. It lets the offline reader shell
     // select only the authenticated user's owner-scoped IndexedDB records.
     if (key !== STATIC_CACHE && key !== OFFLINE_OWNER_CACHE) {
      return caches.delete(key);
     }
     return Promise.resolve(true);
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
    .offline-lessons {
      display: grid;
      gap: 10px;
      margin-top: 18px;
      text-align: left;
    }
    .offline-lessons h2 {
      font-size: 14px;
      color: #e2e8f0;
    }
    .offline-lesson-list {
      display: grid;
      gap: 8px;
    }
    .offline-lesson-button {
      width: 100%;
      border: 1px solid #1e293b;
      border-radius: 8px;
      background: #0f172a;
      color: #e0f2fe;
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      padding: 12px;
      text-align: left;
    }
    .offline-lesson-button:focus-visible {
      outline: 2px solid #38bdf8;
      outline-offset: 2px;
    }
    .offline-lesson-subtitle {
      color: #94a3b8;
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-top: 4px;
    }
    .offline-reader {
      display: grid;
      gap: 12px;
      margin-top: 8px;
      text-align: left;
    }
    .offline-reader h2 {
      color: #f8fafc;
      font-size: 18px;
      line-height: 1.4;
    }
    .offline-reader h3 {
      color: #bae6fd;
      font-size: 14px;
      margin-top: 12px;
    }
    .offline-line {
      border-left: 2px solid #334155;
      padding-left: 12px;
    }
    .offline-hanzi {
      color: #f8fafc;
      font-size: 19px;
      line-height: 1.65;
    }
    .offline-pinyin, .offline-translation, .offline-speaker {
      color: #cbd5e1;
      font-size: 13px;
      line-height: 1.55;
    }
    .offline-pinyin, .offline-speaker {
      color: #94a3b8;
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
    <p id="offlineDescription">Đang mở các bài học đã được lưu trên máy.</p>

    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.location.reload()">
        Thử tải lại trang
      </button>
      <button class="btn btn-secondary" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/vi/hanzihome'">
        Quay lại bài học trước
      </button>
    </div>

    <div id="courseLinksTitle" class="links-title">Giáo trình có sẵn trên máy</div>
    <div class="nav-links">
      <a class="nav-link" href="/vi/hanzihome">Thư viện</a>
      <a class="nav-link" href="/vi/hsk/han-thuong-mai">Hán thương mại</a>
      <a class="nav-link" href="/vi/hsk/nhip-cau-han-ngu">Nhịp cầu Hán ngữ</a>
      <a class="nav-link" href="/vi/hsk/doc-hieu">Đọc hiểu</a>
    </div>

    <section id="offlineLessons" class="offline-lessons" hidden>
      <h2 id="offlineLessonsHeading">Bài đã tải</h2>
      <div id="offlineLessonList" class="offline-lesson-list"></div>
      <article id="offlineReader" class="offline-reader" hidden>
        <button id="offlineBack" class="btn btn-secondary" type="button">← Danh sách bài đã tải</button>
        <h2 id="offlineReaderTitle"></h2>
        <div id="offlineReaderContent"></div>
      </article>
    </section>

    <div id="statusBadge" class="status-badge">
      ✓ Đã sẵn sàng dữ liệu ngoại tuyến trong máy
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
      var courseLinksTitle = document.getElementById("courseLinksTitle");
      var courseLinks = document.querySelector(".nav-links");
      var lessons = document.getElementById("offlineLessons");
      var lessonList = document.getElementById("offlineLessonList");
      var reader = document.getElementById("offlineReader");
      var readerTitle = document.getElementById("offlineReaderTitle");
      var readerContent = document.getElementById("offlineReaderContent");

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

      function appendText(parent, tagName, className, value) {
        var element = document.createElement(tagName);
        element.className = className;
        element.textContent = value;
        parent.appendChild(element);
      }

      function appendLine(lines, value) {
        var item = record(value);
        if (!item) return;
        var hanzi = firstText([item.zh, item.text]);
        var pinyin = text(item.pinyin);
        var translation = firstText([item.vi, item.en]);
        if (!hanzi && !pinyin && !translation) return;
        lines.push({
          speaker: text(item.speaker),
          hanzi: hanzi,
          pinyin: pinyin,
          translation: translation,
        });
      }

      function lessonLines(entry) {
        var data = lessonData(entry);
        var source = sourceLesson(data);
        var lines = [];

        if (source) {
          list(source.sections).forEach(function(sectionValue) {
            var section = record(sectionValue);
            if (!section || section.type !== "text") return;
            var sectionTitle = firstText([section.title_vi, section.title]);
            if (sectionTitle) lines.push({ heading: sectionTitle });
            list(section.blocks).forEach(function(blockValue) {
              var block = record(blockValue);
              if (!block) return;
              var blockTitle = firstText([block.title_vi, block.title]);
              if (blockTitle) lines.push({ heading: blockTitle });
              list(block.paragraphs).forEach(function(paragraph) {
                appendLine(lines, paragraph);
              });
              list(block.lines).forEach(function(line) {
                appendLine(lines, line);
              });
              list(block.scenes).forEach(function(sceneValue) {
                var scene = record(sceneValue);
                if (!scene) return;
                var sceneSummary = text(scene.summary_vi);
                if (sceneSummary) lines.push({ translation: sceneSummary });
                list(scene.lines).forEach(function(line) {
                  appendLine(lines, line);
                });
              });
            });
          });
        }

        if (lines.length > 0) return lines;
        var notes = record(data && data.notes);
        var fallback = firstText([
          notes && notes.lessonTextMarkdown,
          notes && notes.readingMarkdown,
        ]);
        return fallback ? [{ hanzi: fallback, pinyin: "", translation: "" }] : [];
      }

      function showLesson(entry) {
        var lines = lessonLines(entry);
        lessonList.hidden = true;
        reader.hidden = false;
        readerTitle.textContent = lessonTitle(entry);
        readerContent.replaceChildren();

        if (lines.length === 0) {
          appendText(
            readerContent,
            "p",
            "offline-translation",
            "Bài này đã được tải nhưng chưa có phần văn bản nào để đọc ngoại tuyến.",
          );
          return;
        }

        lines.forEach(function(line) {
          if (line.heading) {
            appendText(readerContent, "h3", "", line.heading);
            return;
          }
          var lineElement = document.createElement("div");
          lineElement.className = "offline-line";
          if (line.speaker) appendText(lineElement, "p", "offline-speaker", line.speaker);
          if (line.hanzi) appendText(lineElement, "p", "offline-hanzi", line.hanzi);
          if (line.pinyin) appendText(lineElement, "p", "offline-pinyin", line.pinyin);
          if (line.translation) {
            appendText(lineElement, "p", "offline-translation", line.translation);
          }
          readerContent.appendChild(lineElement);
        });
      }

      function showLessonList(entries) {
        lessons.hidden = false;
        lessonList.hidden = false;
        reader.hidden = true;
        lessonList.replaceChildren();
        courseLinksTitle.hidden = true;
        courseLinks.hidden = true;
        document.getElementById("statusBadge").style.display = "inline-block";

        entries.forEach(function(entry) {
          var button = document.createElement("button");
          button.type = "button";
          button.className = "offline-lesson-button";
          button.textContent = lessonTitle(entry);
          var subtitle = lessonSubtitle(entry);
          if (subtitle && subtitle !== lessonTitle(entry)) {
            var subtitleElement = document.createElement("span");
            subtitleElement.className = "offline-lesson-subtitle";
            subtitleElement.textContent = subtitle;
            button.appendChild(subtitleElement);
          }
          button.addEventListener("click", function() {
            showLesson(entry);
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

      document.getElementById("offlineBack").addEventListener("click", function() {
        reader.hidden = true;
        lessonList.hidden = false;
      });
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
            "Bạn có thể đọc các bài đã tải mà không cần kết nối mạng.";
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

 // 1. Navigation requests: Network-first with an owner-scoped offline reader fallback
 if (request.mode === "navigate") {
  event.respondWith(
   (async () => {
    try {
     return await fetch(request);
    } catch {
     // The shell reads only content_cache rows whose owner matches the last
     // authenticated owner marker. Authenticated HTML/RSC stays uncached.
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
