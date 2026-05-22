# PRD FINAL — HanziHome Local Studio

## 0. Tuyên bố sản phẩm

HanziHome Local Studio là một app học tiếng Trung chạy hoàn toàn local, dùng JSON làm nguồn dữ liệu chính, cho phép người học chọn bài, học từ vựng, học ngữ pháp, ôn flashcard, tra bộ thủ và chỉnh sửa dữ liệu ngay tại chỗ mà không cần server.

Sản phẩm không phải là một dashboard thống kê. Sản phẩm là một workspace học tập. Thống kê chỉ phục vụ định hướng, không được chiếm chỗ của nội dung học.

Câu định vị ngắn:

HanziHome Local Studio = Obsidian mini cho dữ liệu học tiếng Trung, nhưng có lesson workspace, vocab detail, grammar logic, flashcard review và JSON editor an toàn.

---

## 1. Vấn đề cần giải quyết

Người học có một bộ dữ liệu tiếng Trung khá lớn, gồm bài học, từ vựng, ngữ pháp, flashcards và bộ thủ. Nếu chỉ lưu trong JSON hoặc document rời, việc học sẽ bị rời rạc:

1. Muốn học bài nào phải tự tìm dữ liệu.
2. Muốn xem từ vựng phải nhảy qua file khác.
3. Muốn xem ngữ pháp lại tách khỏi bài.
4. Muốn sửa lỗi nhỏ trong từ vựng phải mở raw JSON, dễ phá schema.
5. Muốn ôn tập thì phải tạo flashcard thủ công.
6. Trên mobile dễ bị vỡ layout nếu thiết kế desktop-first.
7. Nếu build server/database quá sớm thì tự làm nặng một sản phẩm vốn chỉ cần chạy local.

Điểm chết của bản demo cũ:

1. Top area chiếm quá nhiều diện tích.
2. Dataset statistics bị đẩy lên như nội dung chính, trong khi người học cần bài học.
3. Grammar mode nhưng right panel vẫn hiện vocab, sai ngữ cảnh.
4. Layout nhìn giống dashboard quản trị hơn là app học.
5. Card spacing dày nhưng information hierarchy yếu.
6. Nhiều tab nhưng chưa trả lời câu hỏi: “Tui đang học bài này thì nên làm gì tiếp?”
7. Editor xuất hiện như feature phụ, chưa thành một local CMS an toàn.

---

## 2. Mục tiêu sản phẩm

## 2.1. Mục tiêu chính

Giúp người học mở một JSON dataset, chọn bài, học toàn bộ nội dung liên quan đến bài đó, và chỉnh sửa dữ liệu mà không cần server.

## 2.2. Mục tiêu học tập

App phải giúp người học:

1. Nắm cấu trúc bài trước khi đi vào chi tiết.
2. Học từ theo nhóm nghĩa.
3. Xem từ vựng sâu theo 7 lớp nội dung: nghĩa, logic, so sánh, collocation, ví dụ, văn hóa, lỗi sai.
4. Học ngữ pháp bằng công thức và logic, không chỉ markdown text.
5. Ôn nhanh bằng flashcard.
6. Tra bộ thủ và liên kết bộ thủ với chữ/từ đang học.
7. Tìm lại nội dung cực nhanh.

## 2.3. Mục tiêu kỹ thuật

App phải:

1. Chạy được như static React app.
2. Không cần backend.
3. Đọc được bundle JSON.
4. Có thể export JSON.
5. Có thể save trực tiếp local file nếu browser hỗ trợ File System Access API.
6. Có fallback tải file JSON mới nếu browser không hỗ trợ.
7. Không làm mất field cũ hoặc custom field khi save.
8. Validate dữ liệu trước khi ghi file.

---

## 3. Phạm vi dữ liệu hiện tại

Dataset hiện tại gồm:

1. Lessons: bài học, mã bài, số bài, tiêu đề, nhóm từ vựng, vocabIds, grammarPointIds.
2. Vocab: từ vựng chi tiết, pinyin, Hán Việt, nghĩa, từ loại, level, tone, rawSections.
3. Grammar points: tiêu đề, contentMd, structures, examplesRaw.
4. Radicals: bộ thủ, số nét, nghĩa lịch sử, nghĩa hiện đại, biến thể, cách nhận diện, điểm dễ nhầm.
5. Flashcards: bản nhẹ phục vụ review, gồm front, back, pinyin, Hán Việt, level, tags.

Quyết định quan trọng:

Bundle JSON là source of truth cho MVP.

Các file split như vocab, grammar, radicals, flashcards có thể dùng để import/export nâng cao sau, nhưng MVP nên ưu tiên đọc một file bundle trước để giảm complexity.

---

## 4. Người dùng mục tiêu

## 4.1. Primary user

Người học tiếng Trung tự học nghiêm túc, có dữ liệu bài học riêng, muốn học theo bài và muốn kiểm soát chất lượng nội dung.

Đặc điểm:

1. Học theo Giáo trình Hán ngữ hoặc HSK.
2. Cần pinyin, Hán Việt, nghĩa tiếng Việt, ví dụ và logic dùng từ.
3. Quan tâm đến bộ thủ, chiết tự, lỗi sai, so sánh dễ nhầm.
4. Có khả năng tự chỉnh data.
5. Không muốn dựng backend cho một app cá nhân.

## 4.2. Secondary user

Người tạo học liệu, giáo viên, hoặc người muốn biến JSON thành app học tập cá nhân.

---

## 5. Nguyên tắc sản phẩm bắt buộc

## 5.1. Lesson-first, không mode-first

Người học không mở app để chọn “mode”. Người học mở app để học “bài”.

Flow đúng:

Mở app → Chọn dataset → Chọn bài → Vào workspace của bài → Chọn hành động học.

Flow sai:

Mở app → Chọn mode → Tìm bài → Mất ngữ cảnh.

## 5.2. Content-first, không dashboard-first

Dataset statistics chỉ nên nằm gọn ở sidebar hoặc header nhỏ.

Không được để thống kê 25 lessons, 1146 vocab, 59 grammar chiếm hero lớn. Người học cần nội dung bài hiện tại, không cần nhìn dashboard mỗi lần vào app.

## 5.3. Panel phải đúng ngữ cảnh

Nếu đang ở Vocab mode, right panel hiển thị vocab detail.

Nếu đang ở Grammar mode, right panel hiển thị grammar detail.

Nếu đang ở Radical mode, right panel hiển thị radical detail.

Nếu đang ở Review mode, right panel hiển thị review queue/progress.

Không được có tình huống đang học ngữ pháp mà panel bên phải vẫn hiện từ vựng.

## 5.4. Không giấu phần hay

Các phần quan trọng không được nằm sâu quá 1 click:

1. So sánh dễ nhầm.
2. Logic nhớ nghĩa.
3. Ví dụ dài.
4. Lỗi sai.
5. Văn hóa.
6. Công thức ngữ pháp.
7. Trap/cảnh báo ngữ pháp.

## 5.5. Editor phải an toàn trước, mạnh sau

Không cho người dùng sửa raw JSON làm mặc định.

Mặc định dùng form editor.

Raw JSON chỉ là advanced view.

Save luôn đi qua validate và backup.

---

## 6. Information Architecture

App có 5 vùng chính:

## 6.1. App Shell

Gồm:

1. Top bar mỏng.
2. Sidebar lesson navigator.
3. Main lesson workspace.
4. Context detail panel.
5. Mobile drawer/bottom sheet.

Top bar chỉ hiển thị:

1. Tên app.
2. Dataset đang mở.
3. Dirty state: Saved / Unsaved.
4. Open JSON.
5. Save.
6. Export.

Không để top bar thành dashboard.

## 6.2. Sidebar

Sidebar là nơi chọn bài và tìm kiếm.

Sidebar gồm:

1. Dataset compact summary.
2. Search lesson.
3. Lesson list.
4. Global search.
5. Optional filter: Hán ngữ / HSK / Bộ thủ.

Lesson card trong sidebar hiển thị:

1. Bài số.
2. Tên tiếng Trung.
3. Nghĩa tiếng Việt nếu có.
4. Số từ.
5. Số grammar.
6. Progress nếu có.

## 6.3. Lesson Workspace

Mỗi bài có workspace riêng.

Workspace gồm:

1. Lesson header nhỏ.
2. Mode tabs.
3. Main content.
4. Context panel.

Mode tabs gồm:

1. Tổng quan.
2. Từ vựng.
3. Ngữ pháp.
4. Ôn tập.
5. Bộ thủ.
6. Editor.

## 6.4. Context Panel

Context panel là panel bên phải trên desktop.

Nó không phải panel cố định một loại content. Nó thay đổi theo mode.

Vocab mode:

Hiển thị từ đang chọn.

Grammar mode:

Hiển thị grammar point đang chọn.

Overview mode:

Hiển thị “Next action”: học từ, học ngữ pháp, ôn flashcard.

Review mode:

Hiển thị queue, progress, filter review.

Radical mode:

Hiển thị bộ thủ đang chọn.

Editor mode:

Hiển thị schema guard, preview, validation errors.

## 6.5. Mobile IA

Mobile không dùng layout 3 cột.

Mobile flow:

1. Top bar gọn.
2. Lesson header gọn.
3. Mode tabs dạng horizontal scroll.
4. Content list toàn chiều rộng.
5. Detail mở bằng bottom sheet hoặc full page.
6. Sidebar lesson chuyển thành drawer.

Không được để horizontal overflow.

---

## 7. Layout Specification

## 7.1. Desktop layout

Desktop width từ 1200px trở lên:

1. Sidebar cố định: 300–340px.
2. Main content: flexible.
3. Context panel: 380–460px.
4. Top bar cao khoảng 56px.
5. Lesson header cao vừa đủ, không quá 120px.

Nội dung chính phải chiếm nhiều không gian nhất.

## 7.2. Laptop layout

Width 900–1199px:

1. Sidebar có thể collapse.
2. Context panel có thể ẩn.
3. Main content dùng 1 hoặc 2 columns.
4. Detail mở dạng drawer nếu thiếu chỗ.

## 7.3. Mobile layout

Width dưới 768px:

1. Sidebar ẩn thành drawer.
2. Context panel thành bottom sheet.
3. Cards một cột.
4. Tabs scroll ngang.
5. Font Chinese đủ lớn nhưng không làm card vỡ.
6. Action buttons gom vào bottom action bar khi cần.

## 7.4. Spacing rule

Không dùng margin tùm lum.

Dùng:

1. gap cho flex/grid.
2. padding trong component.
3. section spacing thống nhất.
4. container max-width rõ ràng.
5. sticky chỉ dùng cho sidebar/topbar/context panel.

---

## 8. Core User Flows

## 8.1. Flow mở dataset

1. User mở app.
2. App hiển thị landing rỗng nếu chưa có dataset.
3. User chọn Open JSON.
4. App đọc file.
5. App validate schema.
6. App normalize data vào runtime store.
7. App hiển thị Lesson Navigator.
8. App tự chọn bài đầu tiên hoặc bài học gần nhất.

Trường hợp lỗi:

1. JSON sai format → hiển thị lỗi parse.
2. Thiếu meta → cảnh báo nhưng vẫn cho xem nếu data chính đủ.
3. Thiếu lessons/vocab/grammar → block import.
4. Id bị lệch → cho xem validation report.

## 8.2. Flow học bài

1. User chọn bài.
2. App mở Lesson Workspace.
3. Mặc định vào Tổng quan.
4. User xem nhóm từ và grammar chính.
5. User chuyển sang Từ vựng.
6. User chọn từ.
7. Context panel hiện full detail.
8. User chuyển sang Ngữ pháp.
9. Context panel chuyển sang grammar detail.
10. User ôn tập bằng flashcard.

## 8.3. Flow sửa vocab

1. User chọn từ.
2. Click Edit.
3. App mở editor mode với từ đang chọn.
4. User sửa field.
5. App đánh dấu dirty.
6. User click Validate.
7. Nếu valid, user Save hoặc Export.
8. App tạo backup trước khi ghi file.
9. App ghi JSON hoặc tải file mới.

## 8.4. Flow tìm kiếm

1. User dùng global search.
2. App tìm trong vocab, rawSections, grammar, radicals.
3. Kết quả chia theo loại.
4. Click kết quả thì app nhảy đến đúng lesson/mode/item.

---

## 9. Module Requirements

## 9.1. Dataset Loader

Phải có:

1. Open JSON.
2. Drag and drop JSON.
3. Validate schema.
4. Dataset summary compact.
5. Recent file handle nếu browser hỗ trợ.
6. Fallback import/export nếu không hỗ trợ.

Không làm:

1. Login.
2. Cloud sync.
3. Server upload.
4. Database remote.

## 9.2. Lesson Navigator

Phải có:

1. Search bài.
2. Filter theo dataset/source.
3. Hiển thị số từ và grammar.
4. Quick jump tới bài trước/bài sau.
5. Remember last opened lesson.

Nên có sau MVP:

1. Progress per lesson.
2. Bookmark bài.
3. Recently studied.

## 9.3. Overview Mode

Mục tiêu của Overview không phải nhồi content. Nó trả lời 3 câu:

1. Bài này học gì?
2. Từ được chia theo nhóm nào?
3. Ngữ pháp lõi là gì?

Overview gồm:

1. Vocab category cards.
2. Grammar summary cards.
3. Suggested learning path.
4. “Start vocab” button.
5. “Start grammar” button.
6. “Review flashcards” button.

Suggested learning path mặc định:

1. Xem nhóm từ.
2. Học từ A++ / A+ trước.
3. Học grammar structures.
4. Xem ví dụ dài.
5. Ôn flashcard.

## 9.4. Vocab Mode

Vocab mode gồm 2 phần:

1. Vocab list.
2. Vocab detail panel.

Vocab list card hiển thị:

1. Chinese word.
2. Pinyin.
3. Hán Việt.
4. Nghĩa ngắn.
5. Level.
6. Tags hoặc category.
7. Indicators: có culture, có notes, có examples.

Vocab filter gồm:

1. Search chữ Hán.
2. Search pinyin.
3. Search Hán Việt.
4. Search nghĩa Việt.
5. Search trong rawSections.
6. Filter level.
7. Filter category.
8. Filter bookmarked.
9. Filter “has warning”.

Vocab detail gồm:

1. Header: word, pinyin, Hán Việt, pos, level, tone.
2. Nghĩa lõi.
3. Logic nhớ / chiết tự.
4. So sánh dễ nhầm.
5. Cụm cố định.
6. Ví dụ.
7. Văn hóa.
8. Cảnh báo lỗi sai.
9. Related radicals.
10. Related grammar nếu có.
11. Edit button.

Quy tắc render:

1. Ưu tiên rawSections.
2. Nếu rawSections thiếu thì fallback qua field top-level.
3. Nếu section rỗng thì ẩn.
4. Không hiển thị empty heading.
5. Long examples phải có line grouping.

## 9.5. Grammar Mode

Grammar mode gồm:

1. Grammar list.
2. Grammar formula cards.
3. Grammar detail panel.

Grammar card hiển thị:

1. Title.
2. Core logic.
3. Structures.
4. Examples.
5. Trap/cảnh báo.
6. Link đến vocab liên quan nếu có.

Grammar detail gồm:

1. Công dụng.
2. Công thức.
3. Logic bản chất.
4. Ví dụ cơ bản.
5. Ví dụ dài.
6. So sánh dễ nhầm.
7. Lỗi sai.
8. Drill mini.
9. Edit button.

Không được render markdown table thô trên mobile.

Nếu contentMd có bảng, app cần transform thành comparison cards hoặc stacked sections.

## 9.6. Flashcard Mode

MVP flashcard cần:

1. Review theo bài.
2. Flip card.
3. Show/hide pinyin.
4. Show/hide Hán Việt.
5. Again / Hard / Good / Easy.
6. Queue counter.
7. Review vocab only.
8. Review radicals only nếu có.

Không cần SRS thật trong MVP.

Sau MVP mới thêm:

1. Spaced repetition.
2. Review history.
3. Due cards.
4. Local progress in IndexedDB.
5. Export Anki CSV.

## 9.7. Radical Mode

Radical mode gồm:

1. Radical grid.
2. Search radical.
3. Filter strokes.
4. Detail panel.
5. Related vocab.

Radical detail hiển thị:

1. Radical.
2. NameVi.
3. Strokes.
4. Core meaning history.
5. Core meaning modern.
6. Variants.
7. Related components.
8. Recognition.
9. Distinguish.
10. Example characters.

Quan trọng:

Bộ thủ không nên chỉ là danh sách 244 items. Nó phải liên kết ngược lại vocab.

Ví dụ: xem 打工 thì thấy hint về 扌 / 手. Click mở bộ Thủ.

## 9.8. Editor Mode

Editor là local CMS.

MVP editor hỗ trợ:

1. Edit vocab.
2. Edit grammar.
3. Edit radicals.
4. Edit lesson category labels.
5. Preview before save.
6. Validate before save.
7. Export bundle.
8. Backup old JSON.

Editor không được:

1. Tự ý đổi id.
2. Xóa field lạ.
3. Normalize làm mất rawSections.
4. Auto-save đè file khi chưa có backup.

Vocab editor fields:

1. word.
2. pinyin.
3. hanViet.
4. meaning.
5. pos.vi.
6. pos.zh.
7. level.
8. tone.
9. meaningBlock.
10. etymologyBlock.
11. comparisonBlock.
12. collocationsBlock.
13. examplesBlock.
14. cultureBlock.
15. notesBlock.

Grammar editor fields:

1. title.
2. contentMd.
3. structures.
4. examplesRaw.
5. optional: logic.
6. optional: traps.

Radical editor fields:

1. radical.
2. nameVi.
3. strokes.
4. coreMeaning.history.
5. coreMeaning.modern.
6. variants.
7. relatedComponents.
8. recognition.
9. distinguish.
10. groups.

---

## 10. Data Architecture

## 10.1. Source of truth

MVP source of truth:

hanzihome_bundle_clean.json

Lý do:

1. Một file dễ mở.
2. Một file dễ backup.
3. Một file dễ export.
4. Ít lỗi sync giữa split files.

## 10.2. Runtime normalization

Khi load JSON, app không dùng array thô trực tiếp trong UI.

App normalize thành:

1. lessonsById.
2. vocabById.
3. grammarById.
4. radicalsById.
5. flashcardsById.
6. vocabIdsByLessonId.
7. grammarIdsByLessonId.
8. flashcardIdsByLessonId.
9. categoryByLessonId.

Lý do:

1. Truy cập nhanh.
2. Dễ update item.
3. Dễ validate reference.
4. Dễ render theo lesson.

## 10.3. Denormalization khi save

Khi export/save:

1. Runtime store chuyển về schema bundle gốc.
2. Giữ thứ tự bài.
3. Giữ thứ tự vocab trong bài.
4. Giữ id cũ.
5. Giữ custom fields.
6. Giữ rawSections đầy đủ.
7. Không tự xóa field app chưa dùng.

## 10.4. Schema validation

Cần validate:

1. meta tồn tại.
2. lessons là array.
3. vocab là array.
4. grammarPoints là array.
5. radicals là array.
6. flashcards là array.
7. lesson.vocabIds resolve được sang vocab.
8. lesson.grammarPointIds resolve được sang grammarPoints.
9. vocab.lessonId resolve được sang lessons.
10. grammar.lessonId resolve được sang lessons.
11. Không có duplicate id.
12. Required fields không rỗng: id, lessonId, word/title.

Validation report chia 3 mức:

1. Error: không save được.
2. Warning: save được nhưng cần kiểm tra.
3. Info: gợi ý cải thiện data.

---

## 11. Search Requirements

Search phải là core feature, không phải phụ.

Search scopes:

1. Lesson title.
2. Vocab word.
3. Pinyin.
4. Hán Việt.
5. Meaning.
6. rawSections.
7. Grammar title.
8. Grammar structures.
9. Grammar examplesRaw.
10. Radical radical/nameVi/recognition.

Global search result chia nhóm:

1. Lessons.
2. Vocab.
3. Grammar.
4. Radicals.
5. Examples.

Click result phải nhảy đúng context.

Ví dụ:

Search 打工 → mở Bài 11 → Vocab mode → select 打工 → right panel hiển thị 打工.

Search 是……的 → mở Bài 11 → Grammar mode → select grammar point tương ứng.

---

## 12. Save / Export / Local JSON Requirements

## 12.1. Định nghĩa rõ: Local JSON là gì?

Local JSON trong app này có nghĩa là:

1. User mở một file JSON thật trên máy, ví dụ `hanzihome_bundle_clean.json`.
2. App đọc nội dung file đó vào memory.
3. User học và chỉnh sửa data trong UI.
4. Khi user bấm Save, app ghi nội dung JSON mới ngược lại chính file đó nếu browser có quyền.
5. Nếu browser không có quyền ghi file thật, app export một file JSON mới để user tải về.

Nói thẳng: Có, mục tiêu của File System / Local JSON là sửa được file JSON thật trên máy, nhưng không phải app tự ý sửa file. User phải chọn file và cấp quyền trước.

## 12.2. Browser support mode

Nếu browser hỗ trợ File System Access API:

1. User chọn file JSON bằng Open JSON.
2. App nhận `FileSystemFileHandle`.
3. App đọc file bằng `getFile()`.
4. App parse JSON.
5. App validate schema.
6. App cho học và edit.
7. Khi Save, app dùng writable stream để ghi lại chính file đó.
8. Trước khi ghi, app tạo backup nếu có quyền folder hoặc yêu cầu user export backup.

Điều kiện kỹ thuật:

1. Chỉ chạy trong secure context: HTTPS hoặc localhost.
2. User gesture bắt buộc: mở file/save file phải bắt đầu từ click/tap của user.
3. Browser cần hỗ trợ File System Access API, tốt nhất là Chromium desktop.
4. Không được giả định Safari/Firefox đều ghi được file thật.

Nếu browser không hỗ trợ:

1. User import JSON.
2. App cho edit trong memory.
3. User export JSON mới.
4. App không được hiển thị trạng thái “saved to original file”.
5. App phải ghi rõ đây là exported copy.

## 12.3. Direct save flow bắt buộc

Save flow:

1. User edit.
2. App set dirty state.
3. User click Save.
4. App validate.
5. Nếu có error, block save.
6. Nếu chỉ warning, cho user confirm.
7. App tạo backup hoặc yêu cầu user xác nhận backup/export backup.
8. App write file hoặc export.
9. App clear dirty state.
10. App show save summary.

## 12.4. Backup strategy

Backup file naming:

hanzihome_bundle_clean.backup-YYYYMMDD-HHmmss.json

Backup nên lưu cùng folder nếu app có directory permission.

Nếu chỉ có file handle mà không có folder permission, app có 2 lựa chọn:

1. Cho user tải backup thủ công trước khi overwrite.
2. Dùng Save As để user chọn nơi lưu backup.

Không được auto-save đè file khi chưa có backup strategy rõ ràng.

## 12.5. File operation API cần có

Tối thiểu cần các service functions:

1. `openBundleFile()` — mở file JSON và giữ file handle.
2. `readBundleFile()` — đọc text từ file handle.
3. `parseBundleJson()` — parse JSON an toàn.
4. `validateBundle()` — validate bằng Zod.
5. `serializeBundle()` — stringify JSON với format ổn định.
6. `saveBundleToSameFile()` — ghi lại file gốc nếu có quyền.
7. `exportBundleCopy()` — tải file JSON copy.
8. `createBackup()` — tạo backup trước khi ghi đè.
9. `checkFilePermission()` — kiểm tra quyền read/write.
10. `requestFilePermission()` — xin quyền read/write khi cần.

---

## 13. UX Rules

## 13.1. Không dùng dashboard hero lớn

Dataset summary chỉ là compact strip hoặc sidebar stats.

Nội dung bài phải nằm trên màn hình đầu tiên.

## 13.2. Mỗi mode có mục tiêu rõ

Tổng quan:

Hiểu bài học.

Từ vựng:

Học từ sâu.

Ngữ pháp:

Nắm công thức và logic.

Ôn tập:

Nhớ lại.

Bộ thủ:

Hiểu cấu tạo chữ.

Editor:

Sửa data an toàn.

## 13.3. Empty state phải có hướng dẫn

Không được chỉ hiện trắng.

Ví dụ:

Chưa chọn từ → “Chọn một từ để xem nghĩa, ví dụ, so sánh và lỗi sai.”

Không có result search → “Không thấy trong bài này. Thử global search.”

## 13.4. Long content phải đọc được

Các section dài phải:

1. Có heading rõ.
2. Có line grouping.
3. Có collapse/expand.
4. Không dùng paragraph quá dài.
5. Không nhét tất cả vào một card.

## 13.5. Chinese text hierarchy

Chinese word phải nổi bật hơn pinyin.

Pinyin phải rõ nhưng không lấn chữ Hán.

Vietnamese explanation phải dễ đọc, không quá nhỏ.

Đề xuất:

1. Word card Chinese: 32–40px desktop, 28–34px mobile.
2. Detail Chinese: 48–64px desktop.
3. Pinyin: 14–18px.
4. Meaning: 14–16px.

---

## 14. Technical Stack

## 14.0. Tech direction chốt

App dùng React 19 làm nền chính, tận dụng React Context cho dependency injection và app-level providers, đồng thời dùng hệ TanStack cho routing, async/local file workflow, form và store.

Không dùng Zustand trong bản chốt này nếu mục tiêu là tối đa hóa TanStack ecosystem.

Stack chốt:

1. React 19.
2. TypeScript.
3. Vite.
4. TanStack Router.
5. TanStack Query.
6. TanStack Store.
7. TanStack Form.
8. Zod.
9. Tailwind CSS.
10. Radix UI hoặc shadcn/ui.
11. React i18next hoặc Lingui.
12. IndexedDB với Dexie.
13. File System Access API.
14. Fuse.js hoặc TanStack-compatible local search layer.
15. Vitest + Playwright.

## 14.1. React 19 usage

React 19 là UI foundation.

Yêu cầu sử dụng:

1. Function components only.
2. Hooks-first architecture.
3. React Context cho app services và stable dependencies.
4. Context không dùng để chứa toàn bộ frequently-changing state.
5. State nhiều update phải để trong TanStack Store hoặc component-local state.
6. Error Boundary cho dataset loading/editor.
7. Suspense chỉ dùng khi có async boundary rõ ràng.

React Context nên dùng cho:

1. `AppConfigContext` — app config, feature flags.
2. `I18nContext` — ngôn ngữ hiện tại và direction nếu cần.
3. `FileSystemContext` — file service adapter.
4. `SchemaContext` — schema/version strategy.
5. `ThemeContext` — theme/font setting nếu không dùng CSS class thuần.
6. `CommandContext` — global command actions.

React Context không nên dùng cho:

1. selected vocab thay đổi liên tục.
2. search query thay đổi liên tục.
3. editor dirty state phức tạp.
4. review queue.
5. normalized dataset lớn.

Các state đó dùng TanStack Store.

## 14.2. TanStack Router

TanStack Router là router chính.

Lý do:

1. Type-safe routes.
2. Type-safe search params.
3. Deep link tốt cho lesson/mode/item.
4. Hợp với app workspace nhiều trạng thái.

Route đề xuất:

1. `/` — landing / open dataset.
2. `/lessons` — lesson navigator full page nếu cần.
3. `/lessons/$lessonId` — overview.
4. `/lessons/$lessonId/vocab` — vocab mode.
5. `/lessons/$lessonId/vocab/$vocabId` — vocab detail.
6. `/lessons/$lessonId/grammar` — grammar mode.
7. `/lessons/$lessonId/grammar/$grammarId` — grammar detail.
8. `/lessons/$lessonId/review` — flashcard mode.
9. `/radicals` — radical library.
10. `/radicals/$radicalId` — radical detail.
11. `/editor` — editor dashboard.
12. `/editor/vocab/$vocabId` — vocab editor.
13. `/settings` — app settings.

Search params nên dùng cho UI state có thể share:

1. `q` — search query.
2. `level` — vocab level filter.
3. `section` — selected detail section.
4. `panel` — context panel open/closed.
5. `lang` — language nếu muốn URL-driven language.

## 14.3. TanStack Query

TanStack Query dùng cho async state, không chỉ server fetch.

Trong app này, Query quản lý các async workflows:

1. Open/read JSON file.
2. Parse bundle.
3. Validate bundle.
4. Build search index.
5. Load persisted progress từ IndexedDB.
6. Export JSON.
7. Save JSON vào file gốc.
8. Create backup.

Query keys đề xuất:

1. `['bundle', 'active']`.
2. `['bundle', 'validation', bundleVersion]`.
3. `['search-index', bundleVersion, language]`.
4. `['lesson', lessonId]`.
5. `['progress', datasetId]`.
6. `['settings']`.

Mutations đề xuất:

1. `openBundleMutation`.
2. `saveBundleMutation`.
3. `exportBundleMutation`.
4. `createBackupMutation`.
5. `updateVocabMutation`.
6. `updateGrammarMutation`.
7. `updateRadicalMutation`.
8. `markFlashcardMutation`.

Quan trọng:

TanStack Query không thay thế TanStack Store. Query giữ async lifecycle/cache. Store giữ normalized client state đang edit.

## 14.4. TanStack Store

TanStack Store là client state chính.

Store split đề xuất:

1. `datasetStore` — normalized dataset, meta, ids, maps.
2. `selectionStore` — selected lesson/mode/vocab/grammar/radical.
3. `editorStore` — draft edits, dirty fields, validation state.
4. `uiStore` — sidebar, panel, drawers, view preferences.
5. `reviewStore` — current queue, current card, review filters.
6. `settingsStore` — language, theme, font size, pinyin/Hán Việt visibility.

Dataset store shape:

1. `meta`.
2. `lessonsById`.
3. `lessonIds`.
4. `vocabById`.
5. `vocabIdsByLessonId`.
6. `grammarById`.
7. `grammarIdsByLessonId`.
8. `radicalsById`.
9. `radicalIds`.
10. `flashcardsById`.
11. `flashcardIdsByLessonId`.
12. `originalBundleSnapshot`.
13. `dirty`.
14. `bundleVersion`.

Store rules:

1. Không mutate raw object trực tiếp.
2. Update item theo id.
3. Giữ original snapshot để diff.
4. Selector theo lessonId để tránh render lại toàn app.
5. Không để raw large arrays chạy qua Context value.

## 14.5. TanStack Form

TanStack Form dùng cho editor.

Form cần:

1. Vocab form.
2. Grammar form.
3. Radical form.
4. Lesson category form.
5. Settings form.

Validation:

1. Field-level validation bằng Zod.
2. Form-level validation bằng Zod.
3. Cross-reference validation bằng custom validator.
4. Submit chỉ tạo draft patch, không ghi file ngay.

rawSections editor rule:

1. Mỗi block là textarea.
2. Mỗi dòng map thành một string trong array.
3. Có preview render giống view mode.
4. Có raw JSON advanced view nhưng không làm default editor.

## 14.6. Internationalization / Chuyển đổi ngôn ngữ

App phải hỗ trợ chuyển đổi ngôn ngữ UI.

MVP languages:

1. Vietnamese: `vi`.
2. English: `en`.

Optional sau:

1. Simplified Chinese UI: `zh-CN`.
2. Traditional Chinese UI: `zh-TW` nếu thật sự cần.

Thư viện đề xuất:

1. `react-i18next` nếu muốn ecosystem ổn, dễ tìm tài liệu.
2. `@lingui/react` nếu muốn compile-time extraction gọn hơn.

Khuyến nghị MVP: dùng `react-i18next`.

Yêu cầu i18n:

1. Toàn bộ UI labels phải qua translation key.
2. Không hard-code text UI trong component.
3. Nội dung học liệu không bị dịch tự động.
4. Language setting lưu trong settingsStore và localStorage.
5. Có language switcher trong Settings và topbar compact.
6. Search không bị phụ thuộc UI language.
7. Date/number format dùng Intl API.

Phân biệt rõ:

1. UI language là ngôn ngữ giao diện app.
2. Learning content language là dữ liệu học trong JSON.
3. User đổi UI sang English thì nội dung từ vựng tiếng Việt trong JSON không tự biến thành tiếng Anh, trừ khi dataset có field tiếng Anh riêng.

Translation file structure:

1. `src/i18n/locales/vi/common.json`.
2. `src/i18n/locales/en/common.json`.
3. `src/i18n/locales/vi/editor.json`.
4. `src/i18n/locales/en/editor.json`.
5. `src/i18n/locales/vi/validation.json`.
6. `src/i18n/locales/en/validation.json`.

## 14.7. Zod schema validation

Zod dùng cho:

1. Bundle schema.
2. Lesson schema.
3. Vocab schema.
4. Grammar schema.
5. Radical schema.
6. Flashcard schema.
7. Editor form schema.
8. Settings schema.

Validation levels:

1. Error: block save.
2. Warning: cho save nhưng cảnh báo.
3. Info: gợi ý cải thiện data.

## 14.8. Styling and UI system

Styling:

1. Tailwind CSS.
2. CSS variables cho semantic colors.
3. Radix UI hoặc shadcn/ui cho accessible primitives.
4. Lucide React icons.
5. Framer Motion chỉ dùng nhẹ cho drawer, panel, accordion.

Không được dùng animation để che UX yếu.

Component primitives cần có:

1. AppShell.
2. Sidebar.
3. TopBar.
4. LessonHeader.
5. ModeTabs.
6. ContextPanel.
7. VocabCard.
8. VocabDetail.
9. GrammarCard.
10. GrammarDetail.
11. RadicalCard.
12. EditorFormShell.
13. ValidationReport.
14. FileOperationDialog.
15. LanguageSwitcher.

## 14.9. Search

MVP dùng Fuse.js hoặc custom indexed search.

Search index nên build bằng TanStack Query sau khi bundle load xong.

Search sources:

1. lessons.
2. vocab.
3. rawSections.
4. grammar.
5. radicals.
6. examples.

Search result phải điều hướng qua TanStack Router.

## 14.10. Local persistence

Dùng localStorage cho settings nhẹ:

1. UI language.
2. theme.
3. font size.
4. last opened lesson.
5. last mode.
6. panel preference.

Dùng IndexedDB với Dexie cho data dài hạn:

1. review history.
2. bookmark vocab.
3. difficult vocab.
4. lesson progress.
5. recent files metadata.
6. autosave drafts nếu có.

Không lưu full bundle lớn vào localStorage.

## 14.11. Markdown rendering

Grammar có `contentMd`, nên cần:

1. `react-markdown`.
2. `remark-gfm`.

Rule:

1. Desktop có thể render markdown table nếu đủ rộng.
2. Mobile không render table thô nếu gây overflow.
3. Có transform table sang stacked comparison cards.
4. Code/structure inline phải có style riêng.

## 14.12. Performance requirements

Cần:

1. Không render full detail của toàn bộ vocab.
2. Không render toàn bộ markdown upfront.
3. Debounce search 150–250ms.
4. Selector theo lessonId/itemId.
5. Virtualize list nếu danh sách dài.
6. Lazy render detail panel.
7. Memo search index theo `bundleVersion`.
8. Không đưa normalized dataset lớn vào React Context value.

Virtualization:

1. `@tanstack/react-virtual` cho vocab list dài.
2. `@tanstack/react-virtual` cho radical list nếu cần.
3. Không cần virtualize ngay mọi list nhỏ.

## 14.13. Testing

Unit tests:

1. Vitest.
2. normalize/denormalize.
3. Zod schema.
4. reference validation.
5. rawSections fallback.
6. search index.
7. save payload.

Component tests:

1. React Testing Library.
2. lesson navigator.
3. vocab detail.
4. grammar context panel.
5. editor dirty state.
6. language switcher.
7. validation report.

E2E tests:

1. Playwright.
2. open JSON.
3. select lesson.
4. switch vocab/grammar.
5. edit vocab.
6. export JSON.
7. re-import exported JSON.
8. language switch.
9. mobile no horizontal overflow.

## 14.14. Package list chốt

Core:

1. `react`.
2. `react-dom`.
3. `typescript`.
4. `vite`.
5. `tailwindcss`.

TanStack:

1. `@tanstack/react-router`.
2. `@tanstack/react-query`.
3. `@tanstack/store`.
4. `@tanstack/react-form`.
5. `@tanstack/react-virtual`.

Validation/forms:

1. `zod`.

UI:

1. `@radix-ui/react-dialog`.
2. `@radix-ui/react-popover`.
3. `@radix-ui/react-tabs`.
4. `@radix-ui/react-accordion`.
5. `@radix-ui/react-tooltip`.
6. `lucide-react`.
7. `framer-motion`.

I18n:

1. `i18next`.
2. `react-i18next`.

Search/markdown/storage:

1. `fuse.js`.
2. `react-markdown`.
3. `remark-gfm`.
4. `dexie`.

Testing:

1. `vitest`.
2. `@testing-library/react`.
3. `@testing-library/user-event`.
4. `playwright`.

## 14.15. Không dùng trong MVP

Không cần:

1. Backend.
2. Remote database.
3. Auth.
4. Cloud sync.
5. Zustand.
6. Redux.
7. Electron.
8. Next.js nếu chỉ làm local static app.
9. AI generation.
10. Server-side rendering.

Có thể cân nhắc sau:

1. Tauri desktop wrapper.
2. PWA.
3. Cloud sync optional.
4. AI-assisted content generation.

---

## 15. MVP Definition

## 15.1. MVP 1 — Viewer nghiêm túc

MVP 1 hoàn thành khi app có:

1. Load bundle JSON.
2. Validate cơ bản.
3. Lesson navigator.
4. Lesson workspace.
5. Overview mode.
6. Vocab mode.
7. Vocab detail theo rawSections.
8. Grammar mode.
9. Grammar detail đúng context.
10. Radical mode.
11. Basic flashcard mode.
12. Global search.
13. Responsive desktop/mobile.

Chưa cần save trực tiếp file gốc.

## 15.2. MVP 2 — Local editor

MVP 2 hoàn thành khi app có:

1. Edit vocab bằng form.
2. Edit grammar bằng form.
3. Edit radical bằng form.
4. Dirty state.
5. Validation report.
6. Export bundle JSON.
7. Import lại file vừa export không lỗi.
8. Không làm mất rawSections.

## 15.3. MVP 3 — Direct file save

MVP 3 hoàn thành khi app có:

1. File System Access API.
2. Save to same file.
3. Backup before save.
4. Fallback export nếu browser không hỗ trợ.
5. Recent file handle.

## 15.4. MVP 4 — Learning progress

MVP 4 hoàn thành khi app có:

1. Bookmark vocab.
2. Mark difficult.
3. Review history.
4. Again / Hard / Good / Easy persisted locally.
5. Progress per lesson.
6. Continue studying.

## 15.5. MVP 5 — Desktop wrapper

Sau khi web app ổn, có thể bọc bằng Tauri.

Mục tiêu:

1. File access ổn định hơn.
2. App riêng cho macOS/Windows.
3. Không lệ thuộc browser support.
4. Vẫn dùng React UI.

---

## 16. Acceptance Criteria

## 16.1. Dataset

App đạt nếu:

1. Load được bundle JSON.
2. Hiển thị đúng số bài.
3. Hiển thị vocab theo lesson.
4. Hiển thị grammar theo lesson.
5. Hiển thị radicals.
6. Không crash khi một section rỗng.
7. Validation phát hiện duplicate id.
8. Validation phát hiện reference id bị thiếu.

## 16.2. UX

App đạt nếu:

1. Người dùng chọn bài trước.
2. Không cần quay lại home để đổi mode.
3. Mode nào panel hiện đúng content mode đó.
4. Top area không chiếm quá nhiều.
5. Content bài hiện sớm trên màn hình.
6. Search dùng được từ mọi màn chính.
7. Mobile không bị horizontal overflow.
8. Long content đọc được.

## 16.3. Vocab

App đạt nếu:

1. Vocab card hiển thị đủ word, pinyin, Hán Việt, nghĩa, level.
2. Detail render đủ rawSections.
3. Empty sections không hiện.
4. Từ có examplesBlock phải xem được ví dụ.
5. Từ có notesBlock phải xem được lỗi sai.
6. Edit một từ không làm mất rawSections khác.

## 16.4. Grammar

App đạt nếu:

1. Grammar card hiển thị title, structures, examples.
2. Grammar detail hiện đúng khi chọn grammar.
3. Markdown table không làm vỡ mobile.
4. Grammar mode không hiện vocab detail sai ngữ cảnh.

## 16.5. Editor

App đạt nếu:

1. Sửa field tạo dirty state.
2. Validate trước save.
3. Export JSON hợp lệ.
4. Import lại file export không lỗi.
5. Save không đổi id nếu user không chủ động đổi.
6. Save không xóa field lạ.
7. Có backup trước ghi đè.

---

## 17. Anti-patterns phải tránh

1. Làm dashboard to trước, học liệu nhỏ sau.
2. Để grammar mode nhưng panel hiện vocab.
3. Dùng margin tùm lum để spacing.
4. Render raw markdown table trên mobile.
5. Sửa raw JSON làm editor mặc định.
6. Auto-save đè file không backup.
7. Normalize data rồi làm mất field gốc.
8. Chia quá nhiều tabs nhỏ theo field data.
9. Nhét 7 section vocab vào một card dài.
10. Dùng mobile layout bằng cách ép desktop co lại.
11. Tạo server/database trước khi local workflow chạy tốt.

---

## 18. Design Direction

Visual style:

1. Clean study workspace.
2. Ít màu, dùng màu để phân loại content.
3. Chinese text nổi bật.
4. Cards vừa đủ, không quá nhiều shadow.
5. Sidebar thực dụng.
6. Header gọn.
7. Main content rộng.
8. Panel đúng ngữ cảnh.

Color semantics:

1. Vocab: blue.
2. Grammar: violet.
3. Radicals: green.
4. Warning/traps: amber/rose.
5. Saved state: green.
6. Dirty state: amber.
7. Error: rose.

---

## 19. Implementation Plan

## Phase 1 — Rebuild shell

1. Tạo app shell.
2. Sidebar lesson navigator.
3. Compact top bar.
4. Lesson workspace.
5. Mode tabs.
6. Context-aware right panel.

Deliverable:

Static demo không cần real file loading nhưng flow đúng.

## Phase 2 — Bind real JSON

1. Import bundle JSON.
2. Build Zod schema.
3. Normalize runtime store.
4. Render lessons từ data thật.
5. Render vocab từ data thật.
6. Render grammar từ data thật.
7. Render radicals từ data thật.

Deliverable:

Viewer đọc được dataset thật.

## Phase 3 — Search

1. Lesson search.
2. Vocab search.
3. Global search.
4. Click result navigation.

Deliverable:

Search ra item và nhảy đúng context.

## Phase 4 — Editor

1. Vocab form editor.
2. Grammar form editor.
3. Radical form editor.
4. Dirty state.
5. Validation report.
6. Export JSON.

Deliverable:

Sửa data và export được.

## Phase 5 — Direct save

1. Open file handle.
2. Save same file.
3. Backup.
4. Fallback export.

Deliverable:

Local CMS đúng nghĩa.

## Phase 6 — Review progress

1. Flashcard queue.
2. Local progress.
3. Bookmark/difficult words.
4. Continue studying.

Deliverable:

App học được mỗi ngày, không chỉ xem data.

---

## 20. Final Product Decision

Bản đúng không phải là “dashboard học tiếng Trung”.

Bản đúng là “lesson workspace + local JSON CMS”.

Ưu tiên build theo thứ tự:

1. Shell đúng.
2. Lesson flow đúng.
3. Panel đúng ngữ cảnh.
4. Vocab detail đọc rawSections đúng.
5. Grammar không bị giấu.
6. Editor an toàn.
7. Save/export local.
8. Review progress.

Nếu app làm đúng PRD này, nó sẽ không còn cảm giác UI chật, rối, tab vô nghĩa, hoặc “có data nhưng học không sướng”. Nó sẽ thành một công cụ học thật: mở bài, học sâu, sửa nhanh, lưu local, không cần server.

