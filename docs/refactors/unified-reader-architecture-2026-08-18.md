# Unified Reader — architecture reference

Đối chiếu current source ngày 11/10/2026. Đây là reference, không phải migration backlog. Progress/remaining acceptance thuộc [master plan](feature-quality-audit-enhancement-2026-10-04.md); các tên engine/provider cũ trong receipt tháng 8 đã được thay bằng source hiện tại.

## Canonical flow và owner

```text
source workspace / adapter
  → ReaderDataInput / ReaderDocumentModel
  → Reader + cookReaderData
  → ReaderProvider
  → ReaderToolbar / ReaderTools / ReaderContent / ReaderSegment / ReaderOutline
```

Sources compose một Reader engine; source-specific code giữ lesson/resource IDs, editing wrappers, progress, annotations, pronunciation analysis và domain actions. Generic Reader không đọc Supabase rows, không sở hữu Notes/drafts hoặc tạo nguồn progress thứ hai.

Source of truth:

- [Reader](../../src/features/reader/components/Reader.tsx) memoizes cooked content từ actual data/pronunciation inputs.
- [Provider](../../src/features/reader/runtime/ReaderProvider.tsx) tạo instance-local store, commands và element registry; dispose commands khi unmount.
- [Runtime store](../../src/features/reader/runtime/reader-store.ts) giữ content projection, active segment/position, playback và ephemeral outline/focus state.
- [Services](../../src/features/reader/runtime/reader-services.ts) là typed speech/lookup/annotation/pronunciation/render callbacks từ source owner.
- [Display adapter](../../src/features/reader/model/reader-display.ts) chứa visibility/font/size/reveal. Workspace truyền shared preferences; standalone Reader có local display fallback. Không tạo persisted Reader preference store khác.

Playback ticks dùng narrow store selectors. Loop và auto advance giữ mutual exclusion; passive scroll không ghi đè position trong playback. Source content replacement giữ active identity khi hợp lệ và reset playback khi spoken content không còn tương thích. Không đổi source IDs/offsets để sửa UI.

## Interaction và source integration

Hanzi click/keyboard activation starts playback từ character; Pinyin affordance mở pronunciation review. Character-start playback không tự trở thành full continuous-read command. Annotation mở note/highlight, giữ text selection và không phát TTS ngoài ý muốn; non-empty note có hover/focus preview. Xem [annotation guide](../architecture/reader-annotations-offline-and-sync.md) cho data/cache ownership.

`ReaderContent`/segment rows sở hữu learner typography, ruby/translation, selection capture và current playback indication. Render callbacks có thể bọc source sections/tools nhưng không tạo reading engine khác. Textbook node edit/section navigation, HSK study modules và Daily outer tabs giữ source ownership. Sticky toolbar offset theo source tab/page context; không dựng thêm independent sticky implementation.

Shared UI primitives giữ popup surface/viewport/focus ownership. Pronunciation review dùng named popup variant hiện có; full-analysis handoff thay review surface, không stack hai overlays. Settings/reveal behavior và keyboard shortcuts tránh editable inputs phải giữ nguyên.

## Pronunciation và grouped Pinyin

Authoritative implementation là [contextual-pronunciation](../../src/lib/pronunciation/contextual-pronunciation.ts); HanziHome facade re-export owner này. Reading groups là presentation, **không phải pronunciation authority** và dictionary phrase không phải orthographic gold standard.

- Context engine chọn glyph reading theo manual override, aligned source Pinyin, dictionary evidence rồi library/context rules. Formatter dùng evidence của glyph, không regenerate pronunciation bằng word segmenter.
- `getContextualReadingUnits` phân nhóm trong contiguous Hanzi spans; punctuation/whitespace/Latin/numbers giữ grapheme boundaries. Ranges theo UTF-16 trên analysis normalized text, giữ coverage/order và không crossing source segments.
- Reading units khác review tokens; không đổi annotation offsets, source Hanzi, IDs, review scope hoặc TTS input chỉ để gộp ruby đẹp hơn. Khi không có aligned reading, existing formatter/renderer giữ fallback; không fabricate Pinyin.
- Word segmentation dùng existing Intl candidates và reviewed orthographic rules. ICU/Node/browser parity và whole-corpus merge quality vẫn là acceptance mở; không coi `Intl.Segmenter` hoặc dictionary membership là oracle.
- Joined syllables dùng existing apostrophe rule trước a/e/o; không tự thêm proper-noun capitalization/erhua conventions hoặc global polyphonic override.

[Session pronunciation hook](../../src/features/reading/hooks/useReaderSessionPronunciation.tsx) giữ source-owned overrides/analysis/review target và trả prepared segments cùng typed service. Auto-detect bật thì truyền reading-unit map; tắt thì giữ source Pinyin trừ explicit manual override theo existing hook. Generic `ReaderDisplay` không có auto-detect flag hay một pronunciation store khác.

Persistent Reader corrections do source hook/API sở hữu; generic session correction phải nói rõ session-only, không báo durable confirmation. Confirming one phrase không cho phép global character override; corpus contrasts như `想得通`, `我得去`, `听得入迷` cần current-context proof ở utility owner. Không thêm dictionary/package hoặc normalization layer để che mismatch. Offset alignment/NFC và hydration parity thiếu proof giữ trong master.

## Verification boundary

Tests đặt tại actual model/runtime/component và source hook/API owners; mounted fixture chứng minh data/service wiring. Check interaction trên textbook/HSK/Daily/Reader, outline scroll owner, Hanzi/Pinyin/annotation/selection, loop/auto-advance, reveal/font và narrow-screen popup/focus khi thay những contract này.

Pure extraction/memo alone không chứng minh ít rerender. R05 controlled parent fixture có cooker/commit proof; TTS subscriptions và corpus/provider/device acceptance khác nằm trong report. Local CI xanh không đóng tất cả Reader states, physical continuous audio hoặc production persistence.

Historical Reader migration/Pinyin/UI journals đã retire khỏi current docs; [snapshot trước cleanup](https://github.com/lekhanh2099/chines-app/tree/bcb6b1333abde304e57167962fc18055e1fd83dc/docs) giữ nguyên receipt và prior decisions.
