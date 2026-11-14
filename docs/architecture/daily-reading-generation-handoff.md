# Daily Reading — source acquisition contract

Đối chiếu source ngày 11/10/2026. Đây là reference về source capture/browser article storage, không phải release checklist hoặc plan active. Durable enrichment jobs/runtime/stream/reuse/metrics nằm trong [operations guide](ai-runtime-daily-reading-operations.md); [BYOK contract](ai-runtime-byok.md) sở hữu credentials/task routing. Remaining verification thuộc master/coverage ở docs index.

## Article-first flow

```text
discover → extract → validate/rerank → persist source article → readable
                                           → optional AI enrichment jobs
```

Article acquisition success khác AI enrichment success. Missing/disabled key, quota, invalid provider response hoặc failed module không được hide/invalidate article đã captured. Captured Chinese article immutable; AI enrichments không rewrite source text.

## Scheduler và settings

[Scheduler agent](../../src/features/daily-reading/runtime/DailyReadingSchedulerAgent.tsx) chạy theo authenticated visible browser session, không phải server cron. Default capture time 10:00 `Asia/Ho_Chi_Minh`, user settings có thể đổi; next visible session thực hiện catch-up khi policy cho phép. Persisted scheduled article là ngày capture thành công dù enrichment lỗi. Existing generation lock điều phối multiple tabs; không claim source acquisition chạy khi mọi app/browser session đã đóng.

Settings gồm capture time, HSK level, freshness, topics/reviewed sources, preferred length, diversity/recent-article avoidance, no-match skip/bounded expansion và auto enrichment. Internal quality/bounds vẫn app-owned; settings không mở publisher allowlist hoặc bypass quality validation.

Source test/capture không cần AI key; missing key chỉ chặn learning support và dùng existing Add API Key recovery. Reader dùng được khi enrichment idle/blocked/failed; ready learning modules hiển thị khi data sẵn sàng. Interface tách Source article và AI learning support; source criteria dùng existing progressive disclosure.

## Discovery/extraction

[Source server](../../src/features/daily-reading/source/daily-reading-source.server.ts) dùng reviewed RSS/listing sources và bounded GDELT discovery. Metadata ranking không phải final selection authority: extract nhiều candidates rồi rerank validated body.

Extraction priority giữ source-specific precedence:

```text
JSON-LD articleBody
→ itemprop=articleBody
→ semantic article
→ reviewed content containers
→ main
→ generic paragraph fallback
```

Parser giữ cleaned paragraph boundaries. Validation xét extraction confidence, Chinese density, paragraph coherence, title/body consistency, freshness/preferred length, truncation/date evidence. Early candidate batch fail thì thử bounded later batches; không coi first eight failures là không có bài.

## Persistence và legacy compatibility

[Client capture](../../src/features/daily-reading/services/daily-reading.client.ts) nhận validated result, [lưu article](../../src/features/daily-reading/local/daily-reading-storage.client.ts) và chỉ sau đó record capture success/telemetry, optionally enqueue enrichment. Telemetry failure không roll article back. Storage read/write failure phải giữ actual failure, không báo capture success từ RAM.

Current captures có `source-captured` provenance. Dedup dùng article ID, canonical source URL/content fingerprint. Legacy migration additive khi current storage absent; giữ legacy storage cho recovery và label `legacy-adapted`, không giả source-captured. Không remove V1 read/migration support khi chưa có recovery proof.

Article/settings/capture ledger vẫn browser-local; enrichment jobs, runtime metadata và validated results có server persistence qua [job service](../../src/features/daily-reading/enrichment/daily-reading-enrichment-jobs.server.ts) và existing migrations. Do đó không mô tả toàn feature là “không có Supabase schema”. Server jobs tiếp tục sau page leave; source capture scheduler vẫn browser-owned. Article text không trở thành hosted article library chỉ vì job metadata được lưu server.

## Pinyin và enrichment evidence

Current article contract không persist Pinyin. Title/paragraph/vocabulary display derive từ contextual-pronunciation và Reader settings, không dùng auto-generated pronunciation như source of truth. Legacy Pinyin/review fields không copy vào current article contract.

Independent translation/vocabulary/grammar/questions modules giữ ready siblings khi một module fail. Shared personal BYOK runtime resolve task/key/model; assigned tasks không fallback sang app-wide provider key. Translation giữ source paragraph IDs/order; vocabulary phải có trong source; grammar evidence match sentence; question evidence trỏ valid source paragraph/phrase và required question coverage.

Progressive translation, terminal reconciliation, request signatures/reuse và live operations procedure có một owner ở operations guide; không duplicate implementation/release queue ở đây.

## Verification boundary

Existing schema/migration/settings/policy/source/capture/storage/scheduler/enrichment và route/i18n tests là owner proof. Browser acceptance cần capture không key, catch-up/multi-tab, partial enrichment/retry, Add-Key, Pinyin/reload/offline interruption và responsive/focus states theo current coverage. Local controlled pass không chứng minh live publishers/providers/physical devices.

[Master](../refactors/feature-quality-audit-enhancement-2026-10-04.md) và [coverage](../testing/frontend-flow-coverage.md) giữ remaining acceptance/actual commands. Production migration/deploy vẫn theo risk confirmation, không tự chạy từ runbook.
