# Feature quality — master plan

Lập ngày 04/10/2026; đối chiếu và dọn tài liệu ngày 11/10/2026.

**CI và publication của các slice đã triển khai: COMPLETE. Audit toàn bộ feature: PARTIAL.** Không có item đang triển khai trong bản đối chiếu này. Dọn docs không phải bằng chứng hoàn thành feature.

Đây là **queue duy nhất** của chương trình. [Report](../audits/FEATURE_CODE_QUALITY_REPORT_2026-10-04.md) ghi kết quả và giới hạn; [coverage](../testing/frontend-flow-coverage.md) ghi test owners và cách kiểm chứng. Không chạy lại một extraction hoặc migration chỉ vì checklist cũ còn mở.

PDF được user tạm hoãn ngày 08/10/2026: row 13 **DEFERRED**, còn 31 nhóm active. Giữ source, tests, drafts và migration hiện hữu; không tiếp tục enhancement, focused audit hoặc production enforcement PDF. Full verification vẫn giữ regression tests hiện có. Migration enforce chung Notes/PDF chưa được phép apply.

## Checkpoints và acceptance còn lại

`[x]` chỉ áp dụng khi toàn bộ acceptance của item pass. Local, CI, Git deployment, live provider, DB production và thiết bị thật là các loại bằng chứng riêng. Một slice hoàn thành không tự đóng parent.

| Status | ID  | Phạm vi và điều kiện đóng parent                                                                                                                                                                 |
| ------ | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ ]    | C00 | Baseline/owner map đã có; hoàn tất R01–R12 trên final source với before/after hoặc measured no-change, toolchain/workload/mode và giới hạn rõ ràng.                                              |
| [x]    | C01 | Sửa đường chạy Studio corpus/assets CLI và Notes tests không thực thi invariant; giữ baseline corpus, không coi lỗi phát âm đã tự hết.                                                           |
| [ ]    | C02 | SRS commit-before-queued và query failures đã có proof; còn replay/receipt, concurrent paging và multi-device conflict ngoài contract hiện tại.                                                  |
| [ ]    | C03 | Notes ordering, CAS, per-tab drafts, metadata/folder/owner slices local pass; còn live rollout và đầy đủ durability/concurrency acceptance.                                                      |
| [ ]    | C04 | Latest-snapshot export, import acknowledgement và pane status có proof; import nhiều writes chưa atomic, còn failure/partial states ngoài các fixture đã chạy.                                   |
| [ ]    | C05 | Linked Reader Notes CAS/owner local pass; còn Reader reload/account/storage-failure matrix. PDF-specific acceptance deferred.                                                                    |
| [ ]    | C06 | Đã tách các slice Translation/Dictation/Notes/Search theo owner hiện có; còn review wiring/responsibilities các surface chưa đủ proof trong report.                                              |
| [ ]    | C07 | TTS/font/Reader/recorder/AI subscriber slices đã đo; còn shared shell, whole-workspace và physical-device proof. Không tính extraction là giảm rerender.                                         |
| [ ]    | C08 | CPU/text/search có utility và volume proof; còn corpus/segmenter correctness, cold index và các hotspot chưa đo.                                                                                 |
| [ ]    | C09 | Notes/SRS completeness, batching, Reader cache/owner và Search identity đã kiểm chứng; server cursor/snapshot, concurrent offsets, payload/capacity và historical Search 503 attribution còn mở. |
| [ ]    | C10 | Hoàn tất required states của 31 active feature rows trong report; không thay feature acceptance bằng test count.                                                                                 |
| [ ]    | C11 | Offline bootstrap/relaunch, owner isolation và Notes resource slices pass; còn cross-surface queue/retry-tail, cache generation/pinning/eviction và storage-failure/device proof.                |
| [ ]    | C12 | Locale/responsive/focus slices pass; còn toàn bộ chrome, learner/source interactions, touch và thiết bị thật.                                                                                    |
| [ ]    | C13 | Local SQL/RLS/auth/CAS compatibility pass; production enforcement/live providers và capacity proof chưa hoàn tất.                                                                                |
| [ ]    | C14 | CI policy complete, Node/mounted/product owners có executable proof; còn coverage các state/owner chưa kiểm chứng ở C10–C13.                                                                     |
| [ ]    | C15 | Publication completed slices pass; parent chỉ đóng sau acceptance C00–C14 trong scope active, final diff/report và required release gates.                                                       |

## Queue tồn đọng duy nhất

Các mục dưới đây là acceptance chưa đạt, không phải chỉ thị tự mở rộng architecture hoặc apply production. Bắt đầu một slice bằng current-source reproduction và owner map; không dùng lỗi/log cũ làm kết luận hiện tại.

| ID / parent        | Trạng thái                    | Bước kiểm chứng cần thiết                                                                                                                                                                                                                                     |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C03-R              | EXPAND APPLIED / ENFORCE OPEN | Chứng minh cloud save/reload và app compatibility; chuẩn bị review Notes/Reader enforcement riêng. Không apply migration chung có PDF.                                                                                                                        |
| C00 / C07–C09      | MEASUREMENTS PARTIAL          | Hoàn tất các dimension còn thiếu của R01–R12; giữ no-change decisions có số đo, không bọc thêm memo/cache để đạt mục tiêu giả.                                                                                                                                |
| C09-S              | HISTORICAL 503 UNCLASSIFIED   | Chỉ điều tra khi có current failing request hoặc evidence cùng session/request. Local authenticated Search pass không giải thích lỗi cloud cũ.                                                                                                                |
| C10-02 / C12 / C14 | HYDRATION NOT REPRODUCED      | CP1 cũ cần cùng bundle, authenticated server HTML và first-client output; không thêm suppression hoặc gọi đã fix.                                                                                                                                             |
| C01 / C08 / C10    | CORPUS PARTIAL                | Báo failed cases và tỷ lệ grouped/fallback/sai merge trên corpus thực; so existing Intl/pinyin-pro segmenter. Dataset/package research cần review coverage, load cost và pronunciation authority trước thay dependency.                                       |
| C11                | DURABILITY PARTIAL            | Trace intent → durable commit → remote ack → conditional cleanup; kiểm chứng retry-tail/review identity, content-write sau eviction, pin retention khi ordinary cache write, owner/generation fences và unacknowledged panes. Không chạy lại fix đã có proof. |
| C10–C14            | FEATURE STATES PARTIAL        | Dùng cột còn thiếu trong report: mỗi slice có loading/empty/error/retry/stale/permission/success và transitions thực sự tồn tại; live provider/DB/device proof tách riêng.                                                                                    |
| Row 13             | DEFERRED BY USER              | Giữ regression/data compatibility; không cộng completion và không dành thêm effort PDF.                                                                                                                                                                       |

Default Studio inventory cần sibling `reading-course.json` hiện không có trong checkout. Lệnh đã chạy với explicit clean corpus root và 26 assets pass là proof khác; không ghi default invocation pass khi thiếu input.

## Các slice đã hoàn thành — không làm lại

Những dòng này ghi **phạm vi local đã chứng minh**, không đóng toàn bộ feature row. Receipt chi tiết trước cleanup nằm trong Git history.

| Slice               | Kết quả và owner/invariant đã kiểm chứng                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C10-02-N / C10-02-R | Home Notes/overview/activity/count phân biệt error với empty/0; giữ cached data, retry đúng nguồn; 27 controlled dashboard cases và locale/viewport proof.    |
| C05-R / C09-A       | Linked Reader Notes expected-base CAS, full conflict snapshot và explicit choice; Reader expected-owner header, stale callback/cache isolation.               |
| C06-T               | Translation capture source tại recording start; pure payload ở utils, lifecycle tại hook; direction/re-record/unmount, rubric/history và countdown isolation. |
| C06-D               | Studio Dictation domain transformations/submission ở utilities/hook hiện có; active-lesson error/retry/source switch và debounced latest input.               |
| C09-S-K             | Canonical Search node identity, thứ tự/IDs/navigation không đổi; actual authenticated index và ranking regressions.                                           |
| C06-NL / D04-UI     | Notes policies ở utils, Query commands ở hook; toàn-list filter/count và 25-row UI pagination, error/retry/cache, volume measurement.                         |
| C10-03-L            | Library pending/error/retry/true empty/cached error; summary-only selected resource và matching lesson route; ba locale/viewports.                            |
| C06-NQ / C06-NM     | Quick create và metadata payload expectations ở utils; actual Query/session commands, retained failed form/drafts và acknowledged revision.                   |
| C10-NF / C10-NV     | Folder pending/failure/cancel/reopen; late delete giữ current view/page, chỉ fallback nếu folder vừa xóa vẫn được chọn; one delete/no extra write.            |
| C10-NA / C10-NT     | Actual SDK/provider/service/IDB A→guest→B và late acknowledgements; tabs/title theo owner, legacy key giữ nguyên, reload/direct-route sau session resolve.    |
| C14-RF              | Re-evaluated Reading fixture dispose root/container cũ, một viewport và giữ actual study flow.                                                                |
| C11-NR              | 45 Notes resource samples: 1k/10k/50k chars × 1/5/20 tabs; close/unmount disposal và five-minute cache expiry. Measured no-change, không đổi gcTime.          |
| C09-NQ              | Notes 10k/links completeness và local SQL plans; recent summary bounded. Offset/concurrent snapshot và production capacity chưa chứng minh.                   |
| C08-SR / C07-FS     | Search một shared request, bounded visible results và query retirement; font settings-only subscription giữ full sync owner.                                  |
| C10-SC              | Actual SRS server page/SDK/API, localized native retry, raw q, empty/matching/guest/error; chín locale/viewport contexts.                                     |
| C04-DL / C12-NF     | Native V2 two-pane downloads/latest snapshots/URL cleanup; mobile Sheet focus return và split/edit transitions.                                               |
| C14-CV / C15-L      | Final-source local Node/mounted/coverage/build/audit và isolated product/SQL checks theo receipt publication bên dưới.                                        |
| C15-P / C15-CI      | Scoped publication và affected CI policy complete, matching full CI xanh; không đóng feature/provider/production acceptance.                                  |

PDF first-create/outbox/CAS local proof đã có trước defer; giữ trong Git và regression suite, không là queue active.

## Hợp đồng đã được duyệt và phải giữ

Approval không bị mất khi dọn receipt. Không hỏi lại cùng quyết định; thay đổi vượt phạm vi đã duyệt vẫn phải có concrete review theo [risk policy](../agent/risk-confirmation.md).

| Decision                 | Phạm vi được duyệt / invariant                                                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 SRS / D03 PDF outbox | IndexedDB commit trước queued; operation/current-owner identity, conditional generation acknowledgement, cùng owner mới retry; giữ intent chưa ack. PDF implementation/proof cũ được giữ, enhancement tiếp theo deferred. |
| D02 Notes CAS            | Whole-note revision + RPC expected version; conflict giữ server snapshot và local draft, user chọn trước ghi tiếp; không last-write-wins. Local schema/proof được duyệt.                                                  |
| D02 per-tab draft        | Tab ID trong draft key, identity lease và recovery source generation; giữ legacy draft và original đến khi required panes được server acknowledge; không overwrite draft tab khác.                                        |
| Expand/enforce split     | Exception chỉ cho ba migration chưa publish được duyệt; giữ exact SQL và real migration history. Production expand + tool-assigned version alignment được duyệt; không fake history/reset DB local user.                  |
| Reader owner fence       | Caller mới gửi `X-HanziHome-Owner-Id`, API reject stale owner bằng 412 trước write; headerless caller cũ tương thích trong expand. Giữ body/URL/CAS.                                                                      |
| D04 Notes UI page        | 25 notes/trang; search/filter/count dùng toàn bộ list, filter đổi về page 1, giữ order/drafts. Backend cursor/snapshot contract chưa duyệt.                                                                               |
| QuickNoteButton          | Props `isCreating` / `onCreate`; hook/utils Notes hiện có giữ create/session/error behavior.                                                                                                                              |
| Pending folder delete    | `onFolderDeleted` và current parent view/page state cùng một owner; utils quyết định preserve/fallback, không late response kéo về navigation cũ.                                                                         |
| Notes tabs persistence   | Owner-scoped key, 20-tab limit/schema v1; legacy ownerless key giữ nguyên, không tự gán tài khoản; initial-route effect chạy lại khi owner resolve.                                                                       |
| Home source errors       | Nine existing app owners + existing tests; loading/error/availability/retry từng nguồn, retained cache và valid zero/empty khác unavailable.                                                                              |
| D05 offline bootstrap    | Public offline entry reuse Reader/cache; xác định account trước đọc private cached data; không cache private HTML/RSC.                                                                                                    |

Production schema snapshot **đã kiểm chứng ngày 10/10/2026**, không phải live audit mới trong lượt dọn docs: cloud `pdrzkirlhbkmfpbcsujp` có expand versions `20261008105051`, `20261008105101`, `20261008105112`; enforce `20261008113000` chưa apply. Legacy Notes writer còn được phép trong expand, nên không claim production đạt đầy đủ CAS. Current migration files là source cho SQL/history; apply/enforce/deploy thủ công cần review riêng.

## Ownership và tests

Reuse existing feature owners theo [frontend structure](../architecture/frontend-structure.md), không tạo layer chung vì logic xuất hiện hai lần.

| Owner            | Trách nhiệm / test đúng nơi                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI component     | Render semantic/locale/loading/error/disabled/focus/keyboard và callback; không fetch, score, domain grouping hoặc autosave pipeline. Test visible behavior và interaction.          |
| Workspace        | Compose existing hooks/UI/route props; không giữ editable copy của Query/Form. Ít integration cases chứng minh event → owner → result.                                               |
| Pure utils       | Input → output: grading/filter/order/segmentation/snapshot/export/timing policy; không React/fetch/storage/timer scheduling. Expected outputs độc lập với implementation.            |
| Hook             | Query/Form subscriptions, lifecycle/debounce/flush/order/cleanup; gọi utils và I/O owners. Test actual callbacks với Query/timers/deferred requests, mounted effect/cleanup khi cần. |
| API/service      | Endpoint/method/headers/payload và runtime response/error contract; không toast/navigation hoặc biến failure thành success. Test transport/auth/owner/cancel/malformed response.     |
| Route/repository | Trusted identity/role/parent/revision, canonical DB/provider reads/writes. Local SQL/RLS proof riêng với controlled HTTP test.                                                       |
| Local/runtime    | Durable commit/replay/locks/generation/store selectors/adapters. Test race/quota/restart/stale ack/resource disposal; không thêm competing owner.                                    |

Giữ routes, formats, source IDs/offsets, learning semantics và authoritative generated/schema/domain types. Diff audit không để unused exports, debug/profiling code, speculative wrappers hoặc suppressions. Shared contracts/storage/schema/dependencies đổi ngoài approval hiện hữu cần dừng để review, không widen type để xanh.

## Performance: phân biệt dimension

| Thay đổi                              | Kết luận được phép                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Tách utils/hook/UI                    | Tăng testability/ownership; tự nó không giảm owner render hoặc tạo memo boundary.                                                           |
| `memo` / narrow selector / skip no-op | Có thể giảm commit/subscriber work khi props/selected value thật sự ổn định; own state/context vẫn update. Cần actual trigger/commit proof. |
| `useMemo` / `useCallback`             | Calculation/reference reuse; không ngăn owner render. Dependencies/callers phải đúng.                                                       |
| Debounce / TTS prepare / batching     | Giảm request/write hoặc latency; không tự giảm input renders. Latest intent/cancellation/retry vẫn phải đúng.                               |
| Pagination / bounded rendering        | Giảm DOM/mount work; không tự giảm owner triggers hoặc full-list network/memory. Giữ completeness/filter/selection.                         |
| Stable key / resource cleanup         | Giữ identity, tránh remount hoặc release resources; không dùng key để che stale state, giữ intentional auth-owner retirement.               |
| Deferred/transition/lazy load         | Scheduling hoặc initial load; không tự giảm total CPU/interaction commits. Đo đúng metric.                                                  |

R01–R12 results và measured limits nằm trong report. Source guard `npm run check:hanzihome:perf` là **manual source check**, không phải benchmark, không nằm trong automatic CI hay `npm run check`.

Mỗi comparison ghi source SHA/diff, toolchain, mode/device/viewport, real/synthetic fixture và cold/warm controls. Lặp tối thiểu 5 flow samples; pure utility timing dùng warm-up và đủ samples nếu báo percentile. Dev/mock Profiler không chứng minh production Web Vitals; production build thường không cung cấp React profiling callbacks. Đo CPU, React commits, DOM, HTTP/payload, DB và retained resources riêng. Chỉ giữ optimization có invariant và measured benefit; delta trong noise ghi no demonstrated improvement.

Memory đo sau close/unmount và sau intentional cache expiry; warmed cache/hidden mounted tabs không tự là leak. Pending intents không được evict để đạt budget. Server/provider volume chỉ chạy isolated/local fixtures trong scope được duyệt; không load-test production hoặc suy ra N users từ mock timings.

## Verification policy hiện hành

- Local commit: existing lint-staged Oxfmt/Oxlint trên staged files; không full-suite pre-commit.
- Automatic CI: diff-based owner/consumer selection, static contracts/typecheck cho code, Vitest related hoặc full fallback; mounted fixtures tách job không Supabase; selected product E2E dùng isolated Supabase. Một production build; jobs có thể chạy song song.
- Docs-only: format; không build/Node/mounted/E2E chỉ vì sửa `.md`.
- Shared/auth/schema/dependency/unmapped paths dùng conservative full proof; manual Run workflow chạy full Node + 14 mounted files + toàn bộ product/SQL. Skip phải ghi rõ; không đổi test để xanh.
- `npm run check` giữ full local release gate. Coverage/Studio/corpus/integration/performance được chạy khi acceptance của slice yêu cầu, không benchmark mặc định mỗi push.
- External browser/fixture seeding/live paid provider/schema mutation phải giữ scope/target/authorization; mocks không thành live proof.

## Publication receipt — 10/10/2026

C15-P và C15-CI **COMPLETE cho completed slices**; parent C15 vẫn PARTIAL.

| Proof                     | Source / kết quả                                                                                                                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Whole scoped diff / local | 214-path audit; user `check1.js` excluded. Final `npm run check`: 281 files / 1.599 Node tests, audit 0, build 132 routes. Mandatory mounted 14 files / 59 cases, zero skips; coverage pass trong phạm vi loaded owners.                                                 |
| Isolated DB/product       | Fresh 13-migration history, expand compatibility trước enforce; 93 SQL/auth-session checks và full 21 product cases, zero retry. Không reset user DB hoặc apply production enforce.                                                                                      |
| Full matching CI          | Source `1053a088f681423a56a68a17c70565b41356aad4`, [run 38056167012](https://github.com/lekhanh2099/chines-app/actions/runs/38056167012) SUCCESS: Node 1.599, mounted 59, SQL/auth-session 93, product 21. E2E job 11m03s, trước 16m45s; giảm 5m42s (~34%) với đủ cases. |
| Docs-only CI              | Receipt source `bcb6b1333abde304e57167962fc18055e1fd83dc`, [run 38057081795](https://github.com/lekhanh2099/chines-app/actions/runs/38057081795) SUCCESS: verify 44s format-only; code/build/browser/E2E deliberately skipped.                                           |
| Git deployments           | Exact source 1053a088 deployment `dpl_HhXUdREwocd9igy6STwyUofQa4kh` READY; bcb6b133 deployment `dpl_DiT1ddbsyejdPAfq3BjtVV96oxh6` READY. Đây là Git integration status, không chứng minh live feature/provider writes.                                                   |

Receipt trên là lịch sử đã kiểm chứng, không phải các lệnh chạy lại trong cleanup ngày 11/10. Không gọi 21 product cases là 21 offline cases hoặc toàn bộ 31-feature acceptance.

## Retirement và rollback

Các plan/PRD/receipts cũ đã bỏ khỏi docs hiện hành theo yêu cầu user ngày 11/10. Unique Reader/Pinyin contract giữ ở [Reader reference](unified-reader-architecture-2026-08-18.md); historical remaining acceptance chỉ xuất hiện một lần trong queue trên. Bỏ stale proposal không đồng nghĩa đã triển khai proposal đó.

[Snapshot đầy đủ trước cleanup](https://github.com/lekhanh2099/chines-app/tree/bcb6b1333abde304e57167962fc18055e1fd83dc/docs) giữ receipts, prior decisions/failures, raw measurement references và danh sách file cũ. Không tạo archive/plan thứ hai trong checkout.

Rollback từng app slice cùng caller/owner consumers; không delete drafts/pending intents hoặc sửa migration history. DB rollback phải review data impact riêng. Cleanup docs chỉ khôi phục các file Markdown từ Git nếu cần; không ảnh hưởng app, schema, storage hoặc user data.

Cleanup verification ngày 11/10/2026: `npm run format:check` và `git diff --check` pass; local Markdown link targets và retired-path references đã kiểm tra. Chỉ sửa/xóa existing Markdown docs; không đổi app, `AGENTS.md`/`.agents`, dependencies, schema hoặc storage. User đã duyệt push cleanup; verification của lượt docs dùng format/diff/reference checks, không rerun app tests. Automatic CI khi publish dùng docs-only selection hiện hành.
