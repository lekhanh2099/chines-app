# PRD PHASE MỚI — HanziHome Productization Sprint

## 0. Mục tiêu phase này

Phase này không làm thêm feature mới cho vui. Phase này biến cái sườn hiện tại thành một app học được thật, sửa được thật, và không bị Codex tự diễn UI lung tung.

Tên phase:

Productization Sprint — Real Data, Context Panel, UX Discipline, Local JSON Save

Mục tiêu ngắn:

1. Giữ lại phần sườn đã có: sidebar, lesson list, tabs, vocab grid, detail panel, open/save/export.
2. Đập bỏ phần mơ hồ: panel sai context, UI thiếu hierarchy, layout rối, code lẫn component cũ/mới.
3. Bind data thật từ JSON bundle.
4. Làm state/router/store đúng kiến trúc React 19 + TanStack.
5. Làm File System / Local JSON theo nghĩa thật: mở file JSON local, sửa trong UI, save/export JSON an toàn.
6. Chuẩn hóa responsive và i18n.

Không làm trong phase này:

1. AI generation.
2. TTS/audio.
3. SRS phức tạp.
4. Cloud sync.
5. Auth.
6. Desktop Tauri.
7. HSK dataset mới.

---

## 1. Đánh giá hiện trạng từ screenshot

Bản hiện tại đã có sườn nhưng chưa đạt UX học tập.

Điểm đã có:

1. Sidebar lesson list.
2. Topbar có Open JSON / Export / Save.
3. Tab theo bài: Tổng quan, Từ vựng, Ngữ pháp, Ôn tập, Bộ thủ, Editor.
4. Vocab grid render được nhiều card.
5. Detail panel bên phải có nội dung từ vựng.
6. Có trạng thái Saved.

Vấn đề cần sửa ngay:

1. App đang giống “data grid + side detail” hơn là lesson workspace.
2. Sidebar chiếm ổn nhưng lesson card còn thiếu progress/priority.
3. Header bài quá đơn giản, không hướng dẫn bước học tiếp theo.
4. Vocab card đang dày chữ, thiếu visual hierarchy giữa word, pinyin, nghĩa, level.
5. Detail panel bên phải quá dài chữ, chưa có section navigation rõ.
6. Ngữ pháp chưa được ưu tiên ngang với từ vựng.
7. Search/filter chưa rõ scope: tìm trong bài hay toàn dataset.
8. Editor chưa được định nghĩa trong UX hiện tại.
9. Open JSON / Save / Export có UI nhưng cần chốt behavior thật.
10. Code có dấu hiệu bị lẫn component cũ/mới, cần cleanup trước khi build tiếp.

Kết luận:

Không vứt app. Nhưng phải làm phase “refactor + bind real data + UX discipline” trước khi thêm feature.

---

## 2. Product Goal của phase

Sau phase này, user phải làm được 5 việc chính:

1. Mở file JSON thật.
2. Chọn một bài.
3. Học từ vựng và xem detail theo rawSections.
4. Chuyển sang ngữ pháp và xem panel đúng ngữ cảnh.
5. Sửa một từ hoặc một grammar point rồi export/save JSON hợp lệ.

Definition of Done:

User mở app → Open JSON → chọn Bài 2 → xem vocab 病 → sửa meaning → save/export → reload file export → data vẫn đúng.

---

## 3. Scope phase này

## 3.1. Must-have

1. Architecture cleanup.
2. Real JSON bundle loader.
3. Runtime normalization.
4. Lesson workspace stable.
5. Context-aware right panel.
6. Vocab mode hoàn chỉnh.
7. Grammar mode hoàn chỉnh cấp MVP.
8. Editor MVP cho vocab + grammar.
9. Save/export local JSON.
10. i18n UI foundation.
11. Mobile no-overflow pass.
12. Validation report.

## 3.2. Should-have

1. Global search click-to-navigate.
2. Bookmark/difficult local flag.
3. Basic review queue from flashcards.
4. Radical detail liên kết với vocab.
5. Recent file metadata.

## 3.3. Could-have

1. Resizable panels.
2. Command palette.
3. Keyboard shortcuts.
4. Print/export lesson handout.

## 3.4. Won’t-have

1. AI content generation.
2. TTS.
3. Cloud storage.
4. Multi-user.
5. Auth.
6. Full SRS algorithm.

---

## 4. Architecture Requirement

## 4.1. Stack chốt

1. React 19.
2. TypeScript.
3. Vite.
4. TanStack Router.
5. TanStack Query.
6. TanStack Store.
7. TanStack Form.
8. Zod.
9. Tailwind CSS.
10. Radix UI / shadcn primitives.
11. react-i18next.
12. Dexie / IndexedDB.
13. File System Access API.
14. Fuse.js hoặc custom search index.
15. Vitest.
16. Playwright.

## 4.2. React Context dùng để làm gì

React Context chỉ dùng cho stable services:

1. FileSystemServiceContext.
2. I18nProvider.
3. AppConfigProvider.
4. ThemeProvider.
5. CommandProvider.
6. SchemaProvider.

Không dùng Context để chứa:

1. Toàn bộ dataset.
2. selected vocab.
3. search input.
4. editor dirty state.
5. review queue.

Lý do: các state này thay đổi thường xuyên, dễ gây re-render lớn.

## 4.3. TanStack Store dùng để làm gì

TanStack Store giữ client state chính:

1. normalized dataset.
2. current selection.
3. UI state.
4. editor drafts.
5. dirty state.
6. review queue.
7. settings.

Store bắt buộc chia module:

1. datasetStore.
2. selectionStore.
3. uiStore.
4. editorStore.
5. reviewStore.
6. settingsStore.

Không được có một `appStore` khổng lồ.

## 4.4. TanStack Query dùng để làm gì

TanStack Query giữ async workflows:

1. open JSON file.
2. read file.
3. parse JSON.
4. validate bundle.
5. build search index.
6. save same file.
7. export JSON.
8. create backup.
9. load IndexedDB progress.
10. persist review result.

Query không thay thế Store. Query là async/caching layer. Store là app state đang thao tác.

## 4.5. TanStack Router dùng để làm gì

Route phải phản ánh ngữ cảnh học:

1. `/` — open dataset / landing.
2. `/lessons/$lessonId` — overview.
3. `/lessons/$lessonId/vocab` — vocab list.
4. `/lessons/$lessonId/vocab/$vocabId` — selected vocab.
5. `/lessons/$lessonId/grammar` — grammar list.
6. `/lessons/$lessonId/grammar/$grammarId` — selected grammar.
7. `/lessons/$lessonId/review` — review.
8. `/radicals` — radical library.
9. `/radicals/$radicalId` — radical detail.
10. `/editor/vocab/$vocabId` — vocab editor.
11. `/editor/grammar/$grammarId` — grammar editor.
12. `/settings` — settings.

Không dùng route kiểu tab state mơ hồ nếu cần deep link.

---

## 5. Data Requirement

## 5.1. Source of truth

MVP dùng bundle JSON làm source chính.

File input:

`hanzihome_bundle_clean.json`

App phải đọc được shape:

1. meta.
2. lessons.
3. vocab.
4. grammarPoints.
5. radicals.
6. flashcards.

## 5.2. Normalize runtime data

Sau khi load, app normalize thành:

1. lessonsById.
2. lessonIds.
3. vocabById.
4. vocabIdsByLessonId.
5. grammarById.
6. grammarIdsByLessonId.
7. radicalsById.
8. radicalIds.
9. flashcardsById.
10. flashcardIdsByLessonId.
11. bundleVersion.
12. originalBundleSnapshot.

Không filter array thô trong component.

## 5.3. rawSections là first-class citizen

Vocab detail không được chỉ đọc `meaning`, `examples`, `collocations` top-level.

Rule:

1. Ưu tiên `rawSections.meaningBlock`.
2. Ưu tiên `rawSections.etymologyBlock`.
3. Ưu tiên `rawSections.comparisonBlock`.
4. Ưu tiên `rawSections.collocationsBlock`.
5. Ưu tiên `rawSections.examplesBlock`.
6. Ưu tiên `rawSections.cultureBlock`.
7. Ưu tiên `rawSections.notesBlock`.
8. Nếu section rỗng thì ẩn.
9. Nếu top-level có dữ liệu mà rawSections thiếu thì fallback.

## 5.4. Validation

Zod validate structural schema.

Custom validator validate reference integrity.

Validation phải bắt:

1. Missing required arrays.
2. Duplicate ids.
3. lesson.vocabIds trỏ tới id không tồn tại.
4. lesson.grammarPointIds trỏ tới id không tồn tại.
5. vocab.lessonId không tồn tại.
6. grammar.lessonId không tồn tại.
7. vocab thiếu word/pinyin/meaning.
8. grammar thiếu title.
9. rawSections sai type.

Validation result có 3 cấp:

1. error — block save.
2. warning — cho save nhưng báo.
3. info — gợi ý.

---

## 6. UX Requirement

## 6.1. App shell

Topbar phải mỏng.

Topbar gồm:

1. App name.
2. Current file name.
3. Global search.
4. Saved/Unsaved state.
5. Open JSON.
6. Export.
7. Save.
8. Language switcher.

Không đưa dataset statistics lớn lên topbar.

## 6.2. Sidebar

Sidebar gồm:

1. Dataset name compact.
2. Counts compact: lessons, vocab, grammar.
3. Lesson search.
4. Lesson list.
5. Current lesson highlight.
6. Optional progress indicator.

Lesson card phải có:

1. Bài số.
2. TitleZh.
3. Vocab count.
4. Grammar count.
5. Active state rõ.

## 6.3. Lesson header

Lesson header trong main content gồm:

1. Bài số.
2. TitleZh lớn.
3. TitleVi nhỏ.
4. Vocab count.
5. Grammar count.
6. Current mode tabs.

Không để header cao quá mức.

## 6.4. Mode behavior

Tổng quan:

1. Hiển thị vocab groups.
2. Hiển thị grammar summary.
3. Hiển thị suggested next action.

Từ vựng:

1. Hiển thị vocab grid/list.
2. Right panel hiển thị vocab detail.
3. Search trong vocab của bài.
4. Filter level.

Ngữ pháp:

1. Hiển thị grammar cards.
2. Right panel hiển thị grammar detail.
3. Không hiển thị vocab detail ở mode này.

Ôn tập:

1. Hiển thị flashcard queue.
2. Right panel hiển thị review progress/filter.

Bộ thủ:

1. Hiển thị radical grid/list.
2. Right panel hiển thị radical detail.

Editor:

1. Hiển thị editor form.
2. Right panel hiển thị validation/schema/raw preview.

## 6.5. Vocab card redesign

Vocab card phải giảm nhiễu.

Card layout:

1. Word lớn.
2. Pinyin ngay dưới.
3. Meaning bold ngắn.
4. Hán Việt nhỏ.
5. Level badge.
6. Indicators: examples, notes, culture.

Không nhồi quá nhiều dòng trong card.

Click card thì:

1. Select vocab.
2. Update URL nếu có route vocabId.
3. Update right panel.

## 6.6. Vocab detail redesign

Right panel cần có section navigation.

Header:

1. Word.
2. Pinyin.
3. Hán Việt.
4. POS.
5. Meaning short.
6. Level.
7. Edit button.

Body sections:

1. Nghĩa.
2. Logic nhớ.
3. So sánh.
4. Cụm cố định.
5. Ví dụ.
6. Văn hóa.
7. Cảnh báo.

Requirement:

1. Section có anchor hoặc tabs nhỏ.
2. Section dài có collapse.
3. Examples phải group theo Chinese / Pinyin / Dịch / Phân tích nếu data có.
4. Panel scroll độc lập.

## 6.7. Grammar mode redesign

Grammar card không được là text markdown dump.

Card cần:

1. Title.
2. Core logic.
3. Structures as chips/code blocks.
4. Examples.
5. Traps.
6. Practice button optional.

Right panel grammar detail cần:

1. Title.
2. Core logic.
3. Formula.
4. Usage conditions.
5. Examples.
6. Common mistakes.
7. Related vocab.
8. Edit button.

## 6.8. Mobile requirement

Mobile phải có:

1. Sidebar as drawer.
2. Mode tabs horizontal scroll.
3. Vocab list 1 column.
4. Detail as bottom sheet/full screen.
5. No horizontal overflow.
6. Topbar height compact.
7. Save/Open actions in overflow menu if thiếu chỗ.

Playwright phải test no horizontal overflow.

---

## 7. File System / Local JSON Requirement

## 7.1. Ý nghĩa chính xác

File System / Local JSON có nghĩa là user sửa được file JSON thật trên máy nếu browser hỗ trợ và user cấp quyền.

Flow:

1. User click Open JSON.
2. User chọn file JSON trên máy.
3. App đọc file.
4. App validate.
5. User sửa data trong app.
6. User click Save.
7. App ghi ngược lại chính file JSON đó.

Nếu browser không hỗ trợ ghi trực tiếp:

1. User vẫn import được.
2. User vẫn sửa được trong app.
3. User Export JSON copy.
4. App không được báo là đã save vào file gốc.

## 7.2. Save behavior

Save phải:

1. Chỉ enable nếu dirty.
2. Validate trước save.
3. Block nếu có error.
4. Warning nếu có warning.
5. Backup trước khi overwrite nếu có thể.
6. Ghi JSON format ổn định.
7. Clear dirty sau save thành công.

## 7.3. Export behavior

Export luôn khả dụng khi có dataset.

Export output:

1. bundle JSON đầy đủ.
2. Không mất field.
3. Pretty print 2 spaces.
4. File name có version/time nếu Save As.

## 7.4. Backup behavior

Backup filename:

`hanzihome_bundle.backup-YYYYMMDD-HHmmss.json`

Nếu không có permission tạo backup cùng folder:

1. Cho user tải backup.
2. Sau đó mới cho overwrite.

---

## 8. i18n Requirement

## 8.1. Scope

Phase này phải dựng i18n foundation.

Languages:

1. vi — default.
2. en — required.

Optional sau:

1. zh-CN.
2. zh-TW.

## 8.2. Rule

Đổi ngôn ngữ chỉ đổi UI, không tự dịch học liệu trong JSON.

Ví dụ:

1. Button “Từ vựng” đổi thành “Vocabulary”.
2. Nhưng meaning tiếng Việt trong JSON vẫn giữ nguyên.
3. Nếu muốn content đa ngôn ngữ thì dataset phải có field riêng như `meaningEn`.

## 8.3. Translation keys

Không hard-code UI text.

Cần tách namespace:

1. common.
2. navigation.
3. lesson.
4. vocab.
5. grammar.
6. editor.
7. validation.
8. file.
9. settings.

## 8.4. Language switcher

Language switcher nằm ở:

1. Settings.
2. Topbar overflow hoặc compact dropdown.

Language setting persist localStorage.

---

## 9. Editor Requirement

## 9.1. Editor MVP

Editor trong phase này chỉ cần sửa:

1. Vocab.
2. Grammar.
3. Lesson vocab categories optional.

Radical editor có thể để phase sau nếu thiếu thời gian.

## 9.2. Vocab editor

Fields:

1. word.
2. pinyin.
3. hanViet.
4. meaning.
5. pos.
6. level.
7. tone.
8. rawSections.meaningBlock.
9. rawSections.etymologyBlock.
10. rawSections.comparisonBlock.
11. rawSections.collocationsBlock.
12. rawSections.examplesBlock.
13. rawSections.cultureBlock.
14. rawSections.notesBlock.

rawSections editor:

1. Each block textarea.
2. Each line maps to string array.
3. Preview next to editor.
4. No raw JSON as default.

## 9.3. Grammar editor

Fields:

1. title.
2. contentMd.
3. structures.
4. examplesRaw.
5. optional core/logic/traps if app derives or extends schema.

If adding new fields not in original schema, store under safe namespace:

`appExtensions.grammarLogic`

or keep derived state separate. Do not pollute original schema randomly.

## 9.4. Dirty tracking

Dirty tracking levels:

1. item dirty.
2. form dirty.
3. bundle dirty.

User leaving dirty editor must get prompt:

Save / Discard / Cancel.

---

## 10. Search Requirement

## 10.1. Lesson search

Search only lesson list.

Fields:

1. lessonNumber.
2. titleZh.
3. titleVi.
4. sourceFile.
5. category names.
6. category words.

## 10.2. Vocab search within lesson

Fields:

1. word.
2. pinyin.
3. hanViet.
4. meaning.
5. rawSections.
6. pos.
7. level.

## 10.3. Global search

Fields:

1. lessons.
2. vocab.
3. grammar.
4. radicals.
5. examples.

Click global result must navigate correctly.

Example:

Search `打工` → route `/lessons/hanyu2-bai-11/vocab/vocab-id`.

---

## 11. Tasks / Tickets

## Epic 1 — Codebase Cleanup

### Ticket 1.1 — Remove dead/duplicated components

Problem:

Current code has signs of old components mixed with new components.

Tasks:

1. Delete unused old demo components.
2. Remove duplicate VocabList/VocabDetail versions.
3. Fix broken EditorView structure.
4. Enforce TypeScript types.
5. Add lint rule for unused imports.

Acceptance criteria:

1. App builds without TypeScript errors.
2. No duplicated old component names.
3. No unreachable JSX fragments.
4. No unused imports.

### Ticket 1.2 — Define folder structure

Target structure:

`src/app`

`src/routes`

`src/features/dataset`

`src/features/lessons`

`src/features/vocab`

`src/features/grammar`

`src/features/radicals`

`src/features/review`

`src/features/editor`

`src/features/settings`

`src/shared/ui`

`src/shared/lib`

`src/shared/i18n`

`src/shared/types`

Acceptance criteria:

1. Components live in feature folders.
2. Shared UI has no app-specific data logic.
3. Feature modules do not import from each other randomly.

---

## Epic 2 — Data Loading & Store

### Ticket 2.1 — Zod bundle schema

Tasks:

1. Define bundle schema.
2. Define lesson schema.
3. Define vocab schema.
4. Define grammar schema.
5. Define radical schema.
6. Define flashcard schema.
7. Allow unknown fields to preserve data.

Acceptance criteria:

1. Valid bundle passes.
2. Invalid JSON shows useful error.
3. Unknown fields are preserved.

### Ticket 2.2 — Normalize bundle

Tasks:

1. Convert arrays to maps.
2. Build ids by lesson.
3. Build reference indexes.
4. Store original snapshot.

Acceptance criteria:

1. Vocab list renders from normalized data.
2. Grammar list renders from normalized data.
3. No component filters full dataset array directly.

### Ticket 2.3 — Validation report

Tasks:

1. Duplicate id checker.
2. Missing reference checker.
3. Required field checker.
4. Warning/info formatting.

Acceptance criteria:

1. Validation report visible.
2. Errors block save.
3. Warnings do not block save.

---

## Epic 3 — Router & Selection

### Ticket 3.1 — TanStack Router routes

Tasks:

1. Setup routes.
2. Lesson route.
3. Vocab route.
4. Grammar route.
5. Review route.
6. Editor route.

Acceptance criteria:

1. URL changes when selecting lesson/mode/item.
2. Reload URL restores context.
3. Invalid route shows friendly state.

### Ticket 3.2 — Selection store

Tasks:

1. selectedLessonId.
2. selectedVocabId.
3. selectedGrammarId.
4. selectedRadicalId.
5. sync route to store.

Acceptance criteria:

1. Selecting vocab updates panel and URL.
2. Switching grammar clears vocab panel context.
3. No stale detail panel.

---

## Epic 4 — Vocab UX

### Ticket 4.1 — Vocab grid redesign

Tasks:

1. Clean card layout.
2. Level filter.
3. Search within lesson.
4. Indicators for rawSections.
5. Selected state.

Acceptance criteria:

1. Cards readable at 1440px and 1920px.
2. Cards not too tall.
3. Search is fast.
4. Click selects item.

### Ticket 4.2 — Vocab detail panel

Tasks:

1. Header.
2. Section nav.
3. rawSections render.
4. Fallback render.
5. Edit button.

Acceptance criteria:

1. meaningBlock appears.
2. examplesBlock appears.
3. empty sections hidden.
4. Panel scroll independent.

---

## Epic 5 — Grammar UX

### Ticket 5.1 — Grammar cards

Tasks:

1. Structure chips.
2. Core logic.
3. Examples.
4. Traps.

Acceptance criteria:

1. Grammar mode useful without opening raw markdown.
2. Structures stand out.
3. Examples readable.

### Ticket 5.2 — Grammar detail panel

Tasks:

1. Context panel switches to grammar.
2. Formula section.
3. Examples section.
4. Common mistakes.
5. Edit button.

Acceptance criteria:

1. No vocab detail in grammar mode.
2. Selecting grammar updates panel.
3. URL can deep link grammar.

---

## Epic 6 — Local JSON File Operations

### Ticket 6.1 — Open JSON

Tasks:

1. Implement FileSystemService.
2. Open file picker.
3. Read file.
4. Parse JSON.
5. Validate.
6. Load store.

Acceptance criteria:

1. User opens bundle file.
2. App shows file name.
3. App displays lessons.
4. Invalid file shows error.

### Ticket 6.2 — Export JSON

Tasks:

1. Denormalize store.
2. Preserve unknown fields.
3. Pretty stringify.
4. Download file.

Acceptance criteria:

1. Exported file can re-import.
2. rawSections not lost.
3. ids unchanged.

### Ticket 6.3 — Save same file

Tasks:

1. Check write permission.
2. Request permission.
3. Validate.
4. Backup strategy.
5. Write file.
6. Clear dirty state.

Acceptance criteria:

1. Save updates original JSON on supported browser.
2. Unsupported browser falls back to export.
3. Save blocked if validation error.

---

## Epic 7 — Editor MVP

### Ticket 7.1 — Vocab editor

Tasks:

1. TanStack Form.
2. Zod validation.
3. rawSections textareas.
4. Preview.
5. Submit patch to store.

Acceptance criteria:

1. Edit meaning updates detail.
2. Edit rawSections updates preview.
3. Dirty state appears.
4. Export includes edits.

### Ticket 7.2 — Grammar editor

Tasks:

1. Edit title.
2. Edit structures.
3. Edit examplesRaw.
4. Edit contentMd.
5. Preview markdown.

Acceptance criteria:

1. Grammar card updates.
2. Grammar detail updates.
3. Export includes edits.

---

## Epic 8 — i18n Foundation

### Ticket 8.1 — Install i18n

Tasks:

1. Setup react-i18next.
2. Add vi/en locales.
3. Add language switcher.
4. Persist language.

Acceptance criteria:

1. UI switches vi/en.
2. User content does not auto-translate.
3. Reload keeps selected language.

### Ticket 8.2 — Extract UI strings

Tasks:

1. Topbar strings.
2. Sidebar strings.
3. Tabs.
4. Vocab labels.
5. Grammar labels.
6. Editor labels.
7. Validation labels.

Acceptance criteria:

1. No hard-coded major UI labels.
2. Missing keys visible in development.

---

## Epic 9 — Responsive & QA

### Ticket 9.1 — Mobile layout pass

Tasks:

1. Sidebar drawer.
2. Detail bottom sheet/full page.
3. Tabs horizontal scroll.
4. Save actions overflow.

Acceptance criteria:

1. No horizontal overflow at 375px.
2. Vocab detail usable on mobile.
3. Editor usable enough on mobile.

### Ticket 9.2 — Playwright smoke tests

Tests:

1. Open app.
2. Load demo/bundle.
3. Select Bài 2.
4. Select vocab 病.
5. Switch grammar.
6. Ensure panel not showing 病 in grammar mode.
7. Edit meaning.
8. Export JSON.
9. Switch language.
10. Mobile no overflow.

Acceptance criteria:

All smoke tests pass.

---

## 12. Final acceptance for phase

Phase này được coi là xong khi:

1. App load được JSON thật.
2. Sidebar lesson hoạt động với data thật.
3. Vocab tab render đúng toàn bộ vocab của bài.
4. Vocab detail render rawSections đúng.
5. Grammar tab có UI riêng và panel riêng.
6. Editor sửa được vocab và grammar.
7. Export JSON re-import được.
8. Save same file hoạt động trên browser hỗ trợ.
9. UI đổi được vi/en.
10. Mobile không bể layout.
11. Codebase sạch, không còn component demo lẫn lộn.

---

## 13. Prompt ngắn cho Codex phase này

Bạn đang refactor HanziHome Local Studio từ prototype thành productized MVP. Không thêm feature ngoài scope. Mục tiêu là làm app load/edit/save JSON thật, với lesson workspace đúng context.

Hard requirements:

1. React 19 + TypeScript + Vite.
2. TanStack Router for routes.
3. TanStack Query for async file/validation/save workflows.
4. TanStack Store for normalized dataset, selection, editor, UI state.
5. TanStack Form + Zod for editor forms.
6. react-i18next for UI language switching vi/en.
7. File System Access API for Open/Save JSON, fallback Export JSON.
8. No backend.
9. No cloud sync.
10. No AI/TTS.

UX requirements:

1. Lesson-first flow.
2. Topbar compact.
3. Sidebar lesson navigator.
4. Main lesson workspace.
5. Context-aware right panel.
6. Vocab mode shows vocab detail.
7. Grammar mode shows grammar detail, never stale vocab detail.
8. Vocab detail renders rawSections.
9. Editor uses form fields, not raw JSON as default.
10. Mobile no horizontal overflow.

Deliver clean code with feature folders, typed schemas, validation report, and Playwright smoke tests.

