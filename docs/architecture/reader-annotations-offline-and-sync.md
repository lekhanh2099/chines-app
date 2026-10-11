# Reader annotations — ownership, cache và offline sync

Đối chiếu source ngày 11/10/2026. Tài liệu mô tả current implementation và giới hạn, không cam kết mọi offline write đã durable. [Master plan](../refactors/feature-quality-audit-enhancement-2026-10-04.md) giữ remaining acceptance C05/C11; PDF-specific work deferred.

## Owners hiện tại

| Owner                                                                                                                                            | Trách nhiệm                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| [ReaderServices](../../src/features/reader/runtime/reader-services.ts) / [ReaderSegment](../../src/features/reader/components/ReaderSegment.tsx) | Typed annotation projection, segment/range rendering, hover/focus note preview, selection và open callbacks.  |
| [useReaderSelectionActions](../../src/features/reading/hooks/useReaderSelectionActions.tsx)                                                      | Actual create/update/delete commands, pending/error UI, query projections và invalidation sau service result. |
| [reading-annotation-api](../../src/features/reading/services/reading-annotation-api.ts)                                                          | Authenticated HTTP, expected owner/revision, local fallback/pending merge và reconnect replay.                |
| [reader-annotation-local-store](../../src/features/reading/local/reader-annotation-local-store.ts)                                               | IndexedDB rows/pending generations và conditional acknowledgement.                                            |
| [AutoSyncReconnectBridge](../../src/features/hanzihome/components/layout/AutoSyncReconnectBridge.tsx)                                            | Current session/online trigger, replay và query invalidation theo sync result.                                |

Reader runtime store giữ navigation/playback/UI state; **không có canonical `readerStore.annotations` hoặc `readerCommands.addAnnotation/removeAnnotation`**. Không tạo owner thứ hai để sửa highlight freshness.

## Rendering và events

Generic Reader annotation có `segmentId`, selected text, start/end offsets và note text. Source row adapter giữ `paragraph_id` và ranges tương ứng. `ReaderSegment` lọc annotation đúng segment trước range/text match; không chỉ match từ như `中国` rồi tô tất cả paragraphs.

Existing Hanzi handler chặn event propagation, kiểm tra selection và mở annotation nếu hit range. Ordinary Hanzi activation phát từ character; annotation click không được gây TTS ngoài ý muốn. Hover/focus preview không thay click/edit contract; empty note không tạo tooltip nội dung giả. Giữ keyboard/selection behavior của component hiện tại, không thêm blanket handlers làm chặn text selection.

## Hai Query projections, một data flow

Sau create/update service result, `useReaderSelectionActions` cập nhật cả annotation-query arrays và `ReaderStateBootstrap.annotations` trong current Query client. Delete result loại ID khỏi cả hai projections. Hook sau đó invalidate owning reader state/annotation query theo `stateOwner`.

Hai projections cùng phản ánh dữ liệu annotation; đây không phải hai independent editable stores. Query invalidation alone không thay explicit projection update đã có. Không dùng pseudocode dispatch vào Reader runtime vì commands đó không tồn tại.

QueryProvider/session/cache isolation và expected-owner fencing là phần khác của owner boundary. Linked Reader Notes revision conflict cũng là contract khác; không coi generic local fallback là proof mọi linked writer production đã enforce.

## Read và storage contract

Read HTTP dùng `/api/reading/annotations?documentId=...`, no-store và captured expected-owner header `X-HanziHome-Owner-Id` khi có owner.

- Thiếu owner/document: không đọc private annotations.
- Already offline: đọc local rows cùng owner/document.
- HTTP 401/403/412: trả empty, không lấy private cache để che auth/owner rejection.
- Network/non-auth failure hoặc invalid response: có same-owner local fallback theo service hiện tại.
- Successful read merge pending creates và suppress pending deletes trước cache projection.

IndexedDB dùng existing [local DB stores](../../src/features/hanzihome/local/hanzihome-local-db.ts): `readerAnnotations` chứa từng row theo annotation ID; local read lọc `user_id`, `document_id`, non-deleted và valid textual ranges. **Không lưu một snapshot array bằng `${userId}:${documentId}`.**

Outbox nằm trong `pendingMutations`, không có store riêng tên `reader_annotation_queue`. Owning schema có create/update/delete variants, owner/document identity, pending/syncing/failed status, timestamps/attempts; update/delete mang expected revision. Generation comparison dùng mutation ID/type/user/updatedAt; late acknowledgement không được clear intent mới hơn.

## Write/reconnect và giới hạn

API owner giữ create/update/delete offline/retry semantics, pending-create cancellation/coalescing và in-flight ordering. Reconnect sync single-flight theo owner; owner rejection giữ failure boundary, không silently replay bằng tài khoản mới. Replay delete xử lý remote 404 như đã absent theo service hiện tại. Current sync result quyết định invalidate, không tuyên bố queue luôn drain sạch.

**Storage failure chưa có durable guarantee:** các local save/enqueue helpers hiện catch IndexedDB errors như non-fatal. Vì thế một service result hoặc màu highlight trên màn hình không chứng minh intent đã commit vào IDB khi storage unavailable/quota failure. Không mô tả tất cả annotations là commit-before-queued; C11 phải kiểm chứng seam này trước khi đóng durability acceptance. Việc dọn docs không sửa application behavior.

Production Notes/Reader rollout mới có additive expand trong last-verified snapshot; enforcement cần quyết định riêng trong master. Không xóa local rows/drafts/pending intent hoặc reset DB để rollback code. Tests cần actual hook/API/IDB/query wiring, same-owner reload và stale-generation/auth failure; mocks không chứng minh production DB/provider behavior.
