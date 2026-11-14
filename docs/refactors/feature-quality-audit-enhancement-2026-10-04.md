# Feature quality — master plan

Lập ngày 04/10/2026; đối chiếu và dọn tài liệu ngày 11/10/2026.

**CI và publication của các slice đã triển khai: COMPLETE. Audit toàn bộ feature: PARTIAL.** Không có item đang triển khai trong bản đối chiếu này. Dọn docs không phải bằng chứng hoàn thành feature.

Đây là **queue duy nhất** của chương trình, giữ acceptance còn mở và các quyết định đã duyệt. [Coverage](../testing/frontend-flow-coverage.md) ghi test owners và cách kiểm chứng; [report lịch sử](https://github.com/lekhanh2099/chines-app/blob/ab61e2631a689019ab49318d103e4fb10037de74/docs/audits/FEATURE_CODE_QUALITY_REPORT_2026-10-04.md) giữ feature matrix và kết quả R01–R12. Không chạy lại một extraction hoặc migration chỉ vì checklist cũ còn mở.

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
| [ ]    | C06 | Đã tách các slice Translation/Dictation/Notes/Search theo owner hiện có; còn review wiring/responsibilities các surface chưa đủ proof trong coverage và feature matrix lịch sử.                  |
| [ ]    | C07 | TTS/font/Reader/recorder/AI subscriber slices đã đo; còn shared shell, whole-workspace và physical-device proof. Không tính extraction là giảm rerender.                                         |
| [ ]    | C08 | CPU/text/search có utility và volume proof; còn corpus/segmenter correctness, cold index và các hotspot chưa đo.                                                                                 |
| [ ]    | C09 | Notes/SRS completeness, batching, Reader cache/owner và Search identity đã kiểm chứng; server cursor/snapshot, concurrent offsets, payload/capacity và historical Search 503 attribution còn mở. |
| [ ]    | C10 | Hoàn tất required states của 31 active feature rows trong feature matrix lịch sử; đối chiếu current source, không thay feature acceptance bằng test count.                                       |
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
| C10–C14            | FEATURE STATES PARTIAL        | Đối chiếu feature matrix lịch sử với current source và coverage: mỗi slice có loading/empty/error/retry/stale/permission/success và transitions thực sự tồn tại; live provider/DB/device proof tách riêng.                                                    |
| Row 13             | DEFERRED BY USER              | Giữ regression/data compatibility; không cộng completion và không dành thêm effort PDF.                                                                                                                                                                       |

Tool packaging Studio và các test riêng đã retire theo yêu cầu dọn scripts ngày 11/10/2026. Giữ nguyên seed JSON/assets và regression tests của runtime; proof CLI lịch sử không phải một bước verification hiện hành.

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

Contract lâu dài nằm tại [responsibility và test boundaries](../architecture/frontend-structure.md#8-responsibility-and-test-boundaries): UI, workspace, pure utils/model, hook, API/service, route/repository và local/runtime. Giữ existing owners và test đúng boundary tái hiện được lỗi. Scope/type/diff review theo `AGENTS.md`; master này chỉ giữ acceptance và approvals của chương trình.

## Performance: phân biệt dimension

Contract và phương pháp đo nằm tại [performance evidence](../architecture/frontend-structure.md#9-performance-evidence). Phân biệt CPU, React commits, DOM, network/payload, DB và retained resources; extraction không tự giảm rerender.

R01–R12 results và measured limits nằm trong report lịch sử đã link ở đầu tài liệu. Performance profiling chạy manual khi acceptance của slice yêu cầu, không nằm trong automatic CI hay `npm run check`.

## Verification policy hiện hành

- Local commit: existing lint-staged Oxfmt/Oxlint trên staged files; không full-suite pre-commit.
- Automatic CI: diff-based owner/consumer selection, static contracts/typecheck cho code, Vitest related hoặc full fallback; mounted fixtures tách job không Supabase; selected product E2E dùng isolated Supabase. Một production build; jobs có thể chạy song song.
- Docs/skills-only: format và lightweight YAML/metadata/routing/reference check khi hướng dẫn đổi; không build/Node/mounted/E2E chỉ vì sửa docs hoặc `skills-lock.json`.
- Shared/auth/schema/dependency/unmapped paths dùng conservative full proof; manual Run workflow chạy full Node + 14 mounted files + toàn bộ product/SQL. Skip phải ghi rõ; không đổi test để xanh.
- `npm run check` giữ full local release gate. Coverage/corpus/integration/performance được chạy khi acceptance của slice yêu cầu, không benchmark mặc định mỗi push.
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

Lượt dọn tiếp ngày 11/10/2026 giữ năm core skills và docs phục vụ flow hiện hành. Report lịch sử, skill inventory/scorecard và vendor skill bundles được retire; skill-maintenance invariants chuyển về `AGENTS.md`, Memory Tips chuyển về current architecture. [Snapshot trước lượt này](https://github.com/lekhanh2099/chines-app/tree/ab61e2631a689019ab49318d103e4fb10037de74) giữ toàn bộ nội dung để khôi phục. Không thay app, dependencies, schema, storage hoặc acceptance/approval đang mở. Verification dùng format/diff/reference và routing review; không chạy lại app tests cho cleanup docs/skills.

Receipt cleanup trước audit: `npm run format:check` và `git diff --check` pass; 37 Markdown files/99 local links không có target hỏng, cả 21 docs có trong index, năm core skills chưa đổi nội dung tại thời điểm đó. Next.js managed block, approval table và production snapshot giữ nguyên. Routing review gồm năm domain và các exclusions hiện hữu; đây không phải benchmark agent. Preview lúc đó cho thấy xóa `skills-lock.json` chọn full Node, 14 mounted files và full product E2E; lỗi phân loại metadata được sửa trong update bên dưới.

Agent guidance update sau audit ngày 11/10: `AGENTS.md` thống nhất TypeScript với yêu cầu trực tiếp của user; responsibility/test/performance contract chuyển về frontend structure, skill architecture route thêm performance. CI dùng inline Node pattern hiện có và Prettier hiện có để kiểm tra YAML/metadata/routing/file references; docs/skills/`skills-lock.json` không kéo app tests, xóa app source và manual full vẫn giữ fallback. 25 selection cases và 13 contract cases (12 negative fixtures) pass trên final workflow; năm core skills pass Codex validator. Không thêm file/dependency hoặc thay app/schema/storage/acceptance.

Hai global skills sửa riêng trên máy: HanziHome UI audit dùng current Card/Button/docs và scoped rollout; Impeccable resolve helper từ installed skill root, actual context command đọc được `PRODUCT.md`. Generic Codex validator từ chối field `version` của Impeccable; giữ field vì vendor context loader đang đọc trực tiếp, YAML/helper/reference proof đã pass riêng. Global changes không nằm trong checkout/CI. Diff của riêng instruction/tooling update lúc đó chọn static/full Node/build, không chọn mounted/product E2E; chưa commit/push hoặc chạy CI remote mới. App tests không rerun cho instruction/tooling update; đây không phải agent benchmark.

Dọn scripts theo yêu cầu ngày 11/10/2026: bỏ bảy file tooling/test Studio và manual performance/session/font, cùng năm npm commands; còn 15 file phục vụ CI/E2E và Supabase types. Seed/types/fonts/lockfile giữ nguyên qua 20 SHA-256 checks; không đổi app source, API, schema, storage hoặc dependency. Full `npm run check` với test env placeholders và hai workers như CI pass: 279 files/1.584 tests, 53 skipped, audit 0 và build 132 pages; lần đầu tests fail do thiếu public Supabase env. Guidance check pass năm skills/37 Markdown files/105 local references. Browser/product E2E và CI remote chưa chạy mới; rollback khôi phục bảy file và năm commands cùng nhau từ Git, giữ runtime artifacts.
