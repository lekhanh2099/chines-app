# Textbook settings, continuation and Home

Approved scope: per-book display preferences; per-book lesson + tab continuation; Home grouped by series; tm2 stays hidden. Preserve existing Pinyin WIP. Do not persist reader segments.

## Checkpoints

- [ ] CP1 — hydration: not reproduced on fresh IAB loads or navigation. No hydration fix claimed. Current AppScrollViewport class is fixed; no suppression added. Authenticated server HTML was not captured for a server/first-client comparison (the unauthenticated HTTP request redirects). Further diagnosis requires a reproducible mismatch on the same bundle.
- [x] CP2 — per-book display: existing settings/schema, useLearningState writes and local-first conflict merge now persist namespaced catalog/static book entries. Untouched books inherit the existing defaults without eager writes. Reader and non-Reader consumers use the same saved display. Tests cover remount, other-book isolation, inherited first-write conflicts, independent fields and durable outbox payloads; IAB translation toggles survived reload in Hán ngữ and Nhịp cầu.
- [x] CP3 — continuation: settings store an atomic lesson/module target per book. Explicit lesson/tab URLs take precedence, state loading blocks default writes, invalid saved targets fall back, and routes contain course/book IDs. Tests cover duplicate lesson numbers, legacy scope, removed lessons/tabs and account isolation. IAB Home continuation opened the correct book/lesson/tab; Back and Forward restored Bài khóa/Từ vựng on Nhịp cầu without audio playback.
- [x] CP4 — Home: reuse ContinueLearningPanel, groupLibraryCourses, buildHanziHomeLessonHref and existing UI primitives. Render catalog summaries plus static summaries passed by the server route, with tm2 excluded. Preserve notes/activity/statistics. Locale tests cover vi/en/zh-CN. IAB verified desktop 1440×900, portrait iPad 820×1180 and mobile 390×844, keyboard group expansion and no horizontal overflow.
- [x] Release — complete scoped diff audited; final `npm run check` exited 0 and `git diff --check` passed. No unrelated source cleanup or changes to the five existing Pinyin files.

## Owners and changed files

- Existing `learning-state.schema.ts`, `useLearningState.ts`, `learning-state-conflict-merge.ts` and `utils/learning-state.ts`: additive `bookDisplayModes` and `bookResume` settings; no new DB schema/table, store or sync mechanism.
- Existing `useLessonReader.tsx`, `HanziHomeWorkspace.tsx`, `BusinessChineseStudyWorkspace.tsx`, lesson text/module/layout/listening/translation consumers: connect saved book settings and continuation to current surfaces.
- Existing Home route, dashboard, hook, utilities, types and ContinueLearningPanel: summary-only grouped book navigation; existing home locale files updated.
- Existing test files extended, including renderer mocks for the existing lesson resource query. This plan is the only new file. Five pre-existing Pinyin/typography changes remain untouched.

## Verification record

- Initial focused persistence/Reader batch: 52 tests passed; persistence/Home batch: 30 passed; textbook workspace: 24 passed; affected renderer batch: 85 passed; durable storage: 7 passed.
- Earlier full `npm run check` passed lint, source/route/UI/API/performance checks, typecheck, 1,282 tests (3 skipped), format, production audit and production build. Subsequent edge-case changes require the final rerun below.
- The new removed-tab regression initially failed (inherited legacy grammar instead of overview), then the fallback was corrected. Explicit lesson URLs now also use the default static tab unless a tab is supplied; an explicit tab is preserved when restoring a saved lesson.
- One rerun hit a generated `.next/dev/types/routes.d.ts` module error while the dev server was active; regeneration/retry passed typecheck. No source/compiler suppression was added.
- IAB fresh-load error log was empty after the final reload. Earlier HMR translation errors occurred while locale files were being edited and did not recur on fresh loads. Toolbar toggles and scrolling worked.
- Account separation and offline/outbox/conflict behavior were verified with deterministic existing-store tests, not a live two-device or two-account synchronization session. CI and deployment were not run.

Final verification: `npm run check` passed on the final application source: 243 test files passed, 2 skipped; 1,284 tests passed, 3 skipped; lint/source/route/UI/API/performance/typecheck/format/audit/build passed. Production audit reported zero known vulnerabilities. Final log: `/tmp/textbook-check-final.log`. The final edge-case rerun also caught a missing effect dependency, which was corrected before this successful gate. At implementation handoff, no commit, push, CI or deployment had been performed.

## Rollback

Revert only this task's source/test/locale changes, preserving the five prior Pinyin files. Existing legacy settings remain readable. Do not delete user learning data or run a database migration. New settings fields are additive and may remain stored when rolling source back.

## Authorized release follow-up

The follow-up Home enhancement keeps series cards and exposes each started book directly while the group is collapsed; expanding the group shows the full list without duplicate visible continuation cards. IAB verified the 390px viewport, keyboard expansion and direct navigation to the saved Nhịp cầu lesson/text tab.

Before the user-authorized push, the complete 38-file diff (including the five existing Pinyin files) was reviewed. `npm run check` passed again after the quick-continuation enhancement, including 1,284 tests, production build and zero known vulnerabilities; `git diff --check` passed. Log: `/tmp/textbook-release-check.log`. No workflow changes were made. The existing CI workflow runs the full gate on main; its E2E job is explicitly disabled, so CI success does not establish E2E coverage. Remote CI and Vercel status will be verified against the pushed commit and reported in the handoff.
