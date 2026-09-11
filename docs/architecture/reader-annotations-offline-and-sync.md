# Reader Annotations & Highlights — Offline Durability, Dual-Store Sync & Event Isolation

## 1. Bối cảnh & Mục tiêu (Context & Purpose)

Tính năng **Reader Annotations** (Highlight từ, lưu từ vựng, ghi chú và phiên âm ngay trên đoạn văn bản) là một trong những tính năng cốt lõi của Reader trong HanziHome. Khi hoạt động ở chế độ Local-first / Offline và hỗ trợ tương tác tức thì, hệ thống phải đối mặt với 4 bài toán hóc búa (gotchas):

1. **TTS Click Propagation Conflict**: Người dùng bấm vào highlight hoặc nút ghi chú nhưng hệ thống lại phát âm đọc cả câu do sự kiện click bị nổi bọt (event bubbling).
2. **Dual-Store Out-of-Sync on Deletion**: Xóa highlight/note xong nhưng trên màn hình vẫn trơ trơ vết màu highlight, chỉ khi reload trang mới biến mất.
3. **Paragraph Leakage / Over-highlighting**: Tô sáng một từ ở đoạn 1 nhưng các từ giống hệt ở đoạn 2, 3... cũng bị tô sáng oan.
4. **Offline Durability & Outbox Sync**: Khi mất mạng, mọi thao tác tạo, sửa, xoá annotation phải được lưu vào IndexedDB cục bộ và tự động đồng bộ lên server khi có mạng lại mà không gây xung đột hay lỗi 404.

Tài liệu này ghi lại các quy tắc kiến trúc bắt buộc để ngăn chặn hoàn toàn các lỗi trên trong tương lai.

---

## 2. Các quy tắc kiến trúc bắt buộc (Architectural Rules)

### Rule 1: Luôn chặn nổi bọt sự kiện trên các phần tử con tương tác trong Reader (`e.stopPropagation()`)

- **Root Cause**:
  Trong `src/features/reader/components/ReaderSegment.tsx`, phần tử bọc ngoài đoạn văn bản có `onClick={() => commands.speakSegment(segment.id)}`. Khi người dùng click vào từ vựng được highlight (`<mark>` hoặc button ghi chú con), click event lan truyền lên thẻ cha, kích hoạt lệnh đọc phát âm TTS ngoài ý muốn.
- **Quy tắc bắt buộc**:
  Bất kỳ interactive element nào nằm bên trong `ReaderSegment` (pills, popover triggers, inline badges, action buttons) **BẮT BUỘC** phải gọi `e.stopPropagation()` trong handler `onClick` / `onMouseDown`:
  ```tsx
  <button
   type="button"
   onClick={(e) => {
    e.stopPropagation();
    onOpenAnnotation(annotation);
   }}
  >
   ...
  </button>
  ```

---

### Rule 2: Đồng bộ Optimistic đồng thời trên cả 2 Store khi thao tác Annotation (Dual-Store Sync)

- **Root Cause**:
  Trong kiến trúc Reader, Annotations có **2 State Owner độc lập**:
  1. **Server / Remote State (TanStack Query)**: `queryKey: hanzihomeQueryKeys.readerAnnotations(userId, documentId)`.
  2. **Active Reader Session Store (TanStack Store / Reader Context)**: `readerStore.annotations`, được quản lý bởi `readerCommands.removeAnnotation(id)` hoặc `readerCommands.addAnnotation(...)`.

  Nếu chỉ gọi `queryClient.invalidateQueries()`, TanStack Query sẽ fetch lại ở background, nhưng `Reader` đang hiển thị trên màn hình đọc state từ `readerStore`. Dẫn đến: UI không cập nhật vết highlight bị xoá cho đến khi component bị unmount!

- **Quy tắc bắt buộc**:
  Mọi thao tác xoá hoặc cập nhật annotation trong `useReaderSelectionActions.tsx` hoặc các hook liên quan **BẮT BUỘC** phải dispatch đồng thời:
  ```tsx
  // 1. Optimistic update visual layer ngay lập tức
  readerCommands.removeAnnotation(annotationId);

  // 2. Cập nhật data layer & sync với server / offline store
  await deleteReaderAnnotation(annotationId);
  await queryClient.invalidateQueries({
   queryKey: hanzihomeQueryKeys.readerAnnotations(userId, documentId),
  });
  ```

---

### Rule 3: Khống chế phạm vi Highlight theo Paragraph (`paragraph_id`)

- **Root Cause**:
  Trong `src/features/hanzihome/components/reading/ContextualReaderText.tsx`, ban đầu code lọc highlight chỉ dựa trên `selected_text`:
  ```ts
  // ❌ SAI: Gây highlight lan truyền mọi đoạn có chứa từ này
  annotations.filter((a) => a.selected_text === word);
  ```
  Nếu từ "中国" (Trung Quốc) được người dùng highlight ở Đoạn 1, thì tất cả các từ "中国" ở Đoạn 2, Đoạn 3 cũng bị gán chung annotation đó!
- **Quy tắc bắt buộc**:
  Khi render theo từng đoạn/paragraph, bắt buộc phải filter theo cả `paragraph_id`:
  ```ts
  // ✅ ĐÚNG: Khống chế chặt chẽ trong phạm vi đoạn được chọn
  annotations.filter((a) => a.paragraph_id === paragraphId && a.selected_text === text);
  ```

---

### Rule 4: Mô hình Offline Storage & Outbox Sync (`reader-annotation-local-store.ts`)

- **Cấu trúc lưu trữ IndexedDB**:
  - Store: `reader_annotations` trong `hanzihome-local-db`.
  - Khóa: Composite key `${userId}:${documentId}` lưu snapshot mảng annotations.
  - Outbox Queue: `reader_annotation_queue` lưu các mutation pending (`upsert` hoặc `delete`).
- **Luồng ghi (Write Flow)**:
  1. Ghi/xoá trực tiếp vào IndexedDB snapshot trước (Optimistic local-first).
  2. Thử gọi API Supabase/Next.js.
  3. Nếu offline (`!navigator.onLine`) hoặc request ném lỗi mạng (`TypeError: Failed to fetch`): Đẩy action vào `reader_annotation_queue`.
  4. Trả về kết quả thành công cho UI mà không quăng Exception làm crash trải nghiệm người dùng.
- **Luồng xóa (Delete Flow & 404 Graceful)**:
  Khi xoá trên server, nếu API trả về `404 Not Found` (nghĩa là bản ghi đã bị xoá trên remote từ trước hoặc từ tab khác): Hàm xoá xem như thành công, không ném lỗi, xoá sạch khỏi IndexedDB.
- **Luồng đồng bộ khi có mạng (Reconnection Drain)**:
  `AutoSyncReconnectBridge.tsx` lắng nghe sự kiện `window.addEventListener('online')`:
  Tự động gọi `syncPendingReaderAnnotations()` để drain sạch các mutation trong queue và invalidate query cache.
