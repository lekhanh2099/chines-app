# Frontend user-flow coverage

Đối chiếu source và CI ngày 11/10/2026; receipts thực thi đến 10/10/2026. [Master plan](../refactors/feature-quality-audit-enhancement-2026-10-04.md) là queue duy nhất: PDF deferred, 31 nhóm còn active và whole-feature audit PARTIAL. Coverage ghi executable owners và proof boundaries, không tạo một plan khác.

## CI và local verification

Source of truth: [CI workflow](../../.github/workflows/ci.yml), [package scripts](../../package.json), [Vitest config](../../vitest.config.ts), [Playwright config](../../playwright.config.ts).

| Trigger / scope                              | Checks                                                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commit                                       | Existing staged-only Oxfmt/Oxlint; không full test suite.                                                                                                 |
| Docs/skills-only push/PR                     | Install + format và lightweight YAML/metadata/routing/file-reference check; `skills-lock.json` dùng cùng scope, không build/Node/browser/product E2E.     |
| Code push/PR                                 | Full static contract/type checks; Vitest related graph hoặc full Node nếu broad/deleted paths; owner/consumer map chọn mounted fixtures và product cases. |
| Runtime-loaded fixtures                      | Explicit map trong workflow, vì Vite URL imports không thuộc Vitest static graph. Mounted job riêng, không cần Supabase.                                  |
| Shared/auth/schema/dependency/unmapped paths | Conservative full Node/browser/product path; không silently mất consumer coverage.                                                                        |
| Manual Run workflow                          | Full Node, toàn bộ 14 mounted files và product/SQL suite.                                                                                                 |
| Local merge/release                          | `npm run check`; required mounted/SQL/product/coverage/corpus proof theo contract của slice. Performance profiling chạy manual khi cần.                   |

Job changes chọn diff base/outputs và ghi selected verification vào workflow summary. Verify, mounted browser và product E2E chạy độc lập sau selection. Product job build production app; verify build khi product job không build. E2E dùng isolated local Supabase và existing seed/SQL fixtures. Suite có một CI retry, 12-minute suite timeout; E2E job 20 phút bao gồm setup/build. Không giảm assertions/case deadlines để xanh.

Retry-recovered product tests fail CI via `failOnFlakyTests`; retained traces
remain available for diagnosis. The list reporter records each case's duration,
and web-server output exposes the production build. Fresh hosted runners apply
the canonical migrations and seed during Supabase startup, without a second
reset. CI excludes unused Studio, image proxy, analytics, pooler, metadata and
Edge Runtime services; database, Auth, REST, Storage and Realtime remain active.

Guidance check dùng Prettier hiện có để kiểm tra YAML, root routing, tên skill,
npm commands và local Markdown file targets; không fetch links hoặc benchmark
agent. Chạy khi docs/skills/metadata, workflow hoặc package scripts đổi, có file
bị xóa, hoặc manual full run. Xóa riêng docs/skills không kéo full Node; xóa app
source vẫn giữ conservative Node fallback. Global skills mức máy không nằm
trong checkout/CI và cần kiểm chứng riêng khi cập nhật.

Không dùng duration hoặc loaded-file coverage thay feature acceptance. Performance profiling chạy manual theo [performance evidence](../architecture/frontend-structure.md#9-performance-evidence).

## Required proof by change type

Đây là checklist canonical dùng cho test review và feature verification. Chọn các row bị ảnh hưởng; test placement và independent expected outputs theo [responsibility/test boundaries](../architecture/frontend-structure.md#8-responsibility-and-test-boundaries).

| Surface / change   | Minimum proof                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog/library    | Pending, error + retry, true empty, summary-only payload.                                                                                   |
| Lesson selection   | Selected ID in query key, one detail payload, missing lesson.                                                                               |
| Query              | First pending render, error vs empty, retry, all cache-key variables, stale/refetch behavior.                                               |
| Mapper/renderer    | Representative exact source shape, sparse fields, unmapped shape fallback, no hidden available data.                                        |
| Form/dialog        | Adapter-derived initial values, validation, dirty/reset/cancel, submit disabled/pending/error.                                              |
| Node mutation      | Owned fields accepted, parent/sibling fields rejected, only the selected field/node changes and siblings remain untouched.                  |
| Route/RPC          | Invalid payload, no session, wrong owner/parent, valid owner/success, conflict/stale update.                                                |
| Query invalidation | Smallest resource plus dependent lesson/catalog only.                                                                                       |
| Import             | Count/identity reconciliation, duplicates, orphans, unmapped fields.                                                                        |
| Migration          | Existing-row safety, nullability, RLS/policies/grants/RPC and generated-type drift under [Supabase instructions](../../supabase/AGENTS.md). |
| Responsive overlay | Focus, keyboard, scroll lock, nested layer and overflow checks from [UI verification](../ui/ui-verification.md).                            |

## Mounted test owners

Các test opt-in dùng Chromium harness hiện hữu. Normal `test:run` có thể skip chúng; bắt buộc kiểm tra actual selected file/case count, không báo skipped là pass. Flags/files bên dưới là map hiện tại, không phải shell command tự chạy tất cả trên mọi edit.

| Feature                   | Existing files                                                                                                                                         | Opt-in flag                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| Notes                     | [NoteEditor](../../src/features/notes/hooks/NoteEditor.browser.test.ts), [NoteOwner](../../src/features/notes/hooks/NoteOwner.browser.test.ts)         | `NOTES_BROWSER_TEST=1`              |
| SRS                       | [Outbox](../../src/features/dictionary/dictionary-srs-outbox.browser.test.ts), [Server page](../../src/features/dictionary/DictionarySrsPage.test.tsx) | `SRS_BROWSER_TEST=1`                |
| PDF, retained regression  | [Annotations](../../src/features/reading/pdf/PdfAnnotations.browser.test.ts)                                                                           | `PDF_BROWSER_TEST=1`                |
| TTS preview               | [Preview](../../src/features/hanzihome/tts/TtsAudioPreview.browser.test.ts)                                                                            | `TTS_BROWSER_TEST=1`                |
| Listening                 | [Exercises](../../src/features/hanzihome/listening/ListeningExercises.browser.test.ts)                                                                 | `LISTENING_BROWSER_TEST=1`          |
| Recording                 | [ShadowingRecorder](../../src/features/reading/hooks/ShadowingRecorder.browser.test.ts)                                                                | `RECORDER_BROWSER_TEST=1`           |
| Reading sources           | [Reading](../../src/features/reading/workspaces/Reading.browser.test.ts)                                                                               | `READER_BROWSER_TEST=1`             |
| Reader runtime            | [Reader](../../src/features/reader/runtime/Reader.browser.test.ts)                                                                                     | `READER_BROWSER_TEST=1`             |
| Translation               | [Workspace](../../src/features/translation/TranslationWorkspace.browser.test.ts)                                                                       | `TRANSLATION_BROWSER_TEST=1`        |
| Home/Search/font          | [Dashboard](../../src/features/home/HomeDashboard.browser.test.ts)                                                                                     | `HOME_BROWSER_TEST=1`               |
| Lesson/linked annotations | [Annotations](../../src/features/hanzihome/annotations/LessonAnnotations.browser.test.ts)                                                              | `LESSON_ANNOTATIONS_BROWSER_TEST=1` |
| AI streaming              | [Conversation](../../src/features/hanzihome/ai-conversation/AiConversation.browser.test.ts)                                                            | `AI_CONVERSATION_BROWSER_TEST=1`    |

Ví dụ targeted command đã có trong repository:

```bash
RECORDER_BROWSER_TEST=1 npm run test:run -- src/features/reading/hooks/ShadowingRecorder.browser.test.ts
npm run format:check
```

Full mounted CI bật các flags trong workflow và truyền selected files. Không yêu cầu mở external browser cho docs-only hoặc routine app edit; browser automation và seed/live targets phải giữ đúng authorization.

## Product/DB proof và boundary

[Product suite](../../e2e/hanzihome.spec.ts) đi qua production app, local auth/API/DB và browser, gồm Search, learning/review conflicts, Notes two-tab/linked owner, Reader explicit completion, guest Daily Reading, PDF regressions và offline shell/cache/privacy/relaunch. [Seed](../../scripts/e2e/seed-fixtures.mjs) chỉ dùng isolated test accounts/database đã xác định.

[SQL fixtures](../../supabase/tests) kiểm chứng Notes/linked annotation/PDF CAS, expand compatibility, AI routing RLS và auth session constraints. Local enforce pass không cho phép tự apply production enforce; PDF-specific remaining work deferred, existing regressions vẫn giữ.

D05 offline proof dùng public offline entry, actual DB lesson/cache/Reader và session-before-selection. Có full Chromium close/relaunch offline, reload/reopen, A→B/logout/late IndexedDB reads, storage failure/retry, quota/evicted asset failures và exact private HTML/RSC non-cache assertions. Three real visible textbooks có offline lesson/tab/resume/focus/locale proof. Không gọi whole product suite là chỉ offline tests; Safari/physical devices vẫn thiếu.

## Flow matrix — proof cần ở đúng owner

| Flow                            | Existing proof                                                                                                                                                                 | Remaining boundary                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Auth                            | Callback/confirm/URL tests, local Supabase product owner transitions/SQL.                                                                                                      | OAuth/live/device/production eviction.                                                |
| Home/Library                    | Actual Query/API/UI pending/error/retry/empty/cache, summaries/selected-resource/27 Home cases.                                                                                | Remaining admin/forms/healthy copy/live roles.                                        |
| Lesson/content edit             | Schema, renderer, smallest-node routes/resources/invalidation.                                                                                                                 | Sparse renderer families và actual form/role/concurrency flow.                        |
| Notes                           | Real SDK/provider/services/IDB/Lexical, CAS two tabs, per-owner title/draft/direct URL, 25-row UI, create/import/metadata/folder navigation; native V2 downloads/mobile focus. | Production enforcement, remaining devices/partial import/cursor/concurrent snapshots. |
| SRS/dictionary                  | Pure rules/API/hook failure, durable IDB reload/replay/locks/owner cleanup, actual drawer queued warning và nine server-page locale/viewport retry cases.                      | Provider lookup/cancel, concurrency/receipt/multi-device conflict.                    |
| Reader/annotations              | Runtime selectors, actual ruby/selection/review/tooltip/annotation wiring; linked Notes CAS and expected-owner product requests.                                               | All corpus/reload/storage failure/physical audio.                                     |
| Translation/Dictation/Listening | Actual source transitions/errors/retry, pure grading/payloads, recording start capture/cleanup và controlled countdown/media.                                                  | Whole source matrix/live microphone/provider/hotkeys.                                 |
| AI/BYOK                         | API/NDJSON completed-body isolation/stop/retry/abort và secret/task-routing boundaries.                                                                                        | History/settings/session/live provider và remaining HTML artifact lifecycle.          |
| Offline                         | Public shell/local DB/privacy/relaunch/account/quota/three textbooks.                                                                                                          | Queue/cache generation/pinning/retained capacity across surfaces, Safari/device.      |
| PDF                             | Prior revision/outbox/SVG/DB proof retained.                                                                                                                                   | Deferred, không tiếp tục focused acceptance.                                          |

Chọn test đúng owner theo [responsibility/test boundaries](../architecture/frontend-structure.md#8-responsibility-and-test-boundaries); rendered integration chứng minh actual wiring. Test count không thay missing state/owner evidence.

## Viewports và measurement

Rendered scenarios dùng desktop `1440×900`, tablet/touch `820×1180`, Android-width `412×915`; Reader fixtures còn có `390px`. Labels/locales `vi`, `en`, `zh-CN` và keyboard/focus/overflow được kiểm tra ở những surface có receipt. Không coi width emulation là thiết bị/microphone thật.

Resource/CPU/commit measurements R01–R12 nằm trong [report lịch sử](https://github.com/lekhanh2099/chines-app/blob/ab61e2631a689019ab49318d103e4fb10037de74/docs/audits/FEATURE_CODE_QUALITY_REPORT_2026-10-04.md#r01r12-số-đo-đúng-dimension). Notes có 45 isolated contexts (1k/10k/50k chars × 1/5/20 tabs), Search có 1k/10k/50k index fixtures; controlled heap/GC không thành production capacity. Historical hydration CP1 vẫn NOT REPRODUCED, cần server HTML/first-client cùng bundle. Next cancellation-path log attribution không giải thích historical Search cloud 503.

## Latest verified receipt

- Source `1053a088f681423a56a68a17c70565b41356aad4`: [full CI 38056167012](https://github.com/lekhanh2099/chines-app/actions/runs/38056167012) SUCCESS: 1.599 Node, 14 mounted files/59 cases zero skips, 93 SQL/auth-session và 21 product cases zero retry.
- Final local `npm run check`: 281 files/1.599 tests, 53 ordinary opt-in skips, audit0/build132. Mounted execution là proof riêng bên trên.
- Home-final V8 loaded-file coverage pass: statements 57,52%, branches 41,77%, functions 48,20%, lines 59,64%. Config không mở rộng denominator toàn `src`; unimported owners/mounted execution không được tự tính vào whole-app coverage.
- Docs receipt `bcb6b133`: [CI 38057081795](https://github.com/lekhanh2099/chines-app/actions/runs/38057081795) SUCCESS format-only, code/build/browser/E2E deliberately skipped.
- Default Studio input thiếu sibling `reading-course.json`; explicit clean corpus root/26 assets pass trước đó, không ghi default command pass.

Các kết quả trên đã kiểm chứng ngày 10/10, không rerun trong docs cleanup. Publication/deployment/production snapshot và rollback nằm trong master. [Git history trước cleanup](https://github.com/lekhanh2099/chines-app/tree/bcb6b1333abde304e57167962fc18055e1fd83dc/docs) giữ raw receipt/source manifests/prior failures; không dùng temporary artifact paths làm current source of truth.
