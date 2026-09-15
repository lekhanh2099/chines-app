# Pinyin theo đơn vị đọc — review và implementation checkpoints

## Trạng thái và phạm vi

- Ngày review: 2026-09-14. Baseline local: `main`, HEAD `737cb13f310318d6f9466092d70a571c8f73bb65`; working tree sạch trước khi tạo tài liệu. Không fetch/xác nhận remote trong lượt review này.
- Yêu cầu hiện tại: kiểm tra PRD đính kèm, viết plan trong repo và hoàn tất implementation theo các checkpoint bên dưới.
- Đã đọc root/HanziHome `AGENTS.md`, ba skill `frontend-feature-workflow`, `frontend-ui-system`, `hanzihome-content-editing`, source/consumer/test liên quan và các hợp đồng UI/architecture.
- Precedent về ownership: [Unified Reader Architecture](./unified-reader-architecture-2026-08-18.md). Tên file/runtime trong tài liệu cũ không thay thế source hiện tại dưới `src/features/reader` và `src/features/reading`.
- Chỉ tick checkpoint khi acceptance và gate liên quan đã đạt trên source cuối cùng. Ghi file đổi, lệnh/kết quả, giới hạn và rollback trước khi sang phần tiếp theo. Không tick implementation từ kết quả baseline.

## 1. Kết luận review: giữ mục tiêu, sửa các giả định trước khi code

### 1.1. Pronunciation token chưa phải reading unit

Owner hiện tại là `src/lib/pronunciation/contextual-pronunciation.ts`; đường HanziHome cùng tên chỉ re-export.

`ContextualPronunciationToken` hiện có cả `pinyin` và nguồn `dictionary-exact | intl-segmenter | grapheme`. `intl-segmenter` chưa được dùng để tạo token. Dictionary tích hợp chứa `听得入迷`, `吹得不比`, `坚固得`, `我得去` để sửa âm trong ngữ cảnh. Các span này **không chứng minh toàn bộ cụm là một từ viết liền**. Lesson vocabulary cũng cho phép word/phrase, không có metadata xác nhận orthographic boundary.

Ngoài ra, token đang có tác dụng ngoài presentation:

| Consumer hiện tại                                                                      | Ý nghĩa của `analysis.tokens`                               |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/features/reading/components/ReaderPronunciationReviewPopover.tsx`                 | Chọn text/glyphs/start/end để sửa và save                   |
| `src/features/reading/hooks/useReaderPronunciationReview.tsx`                          | Tìm persistent override theo đúng range, lấy nghĩa và reset |
| `src/features/reading/hooks/useReaderSessionPronunciation.tsx`                         | Reset session override theo range                           |
| `src/features/hanzihome/components/business-chinese/BusinessChineseStudyWorkspace.tsx` | Reset pronunciation override của block                      |

**Quyết định đề xuất:** giữ nguyên `analysis.tokens`, `token.pinyin`, glyphs và review ranges trong V1. Tạo boundary trình bày được suy ra từ analysis, ngay trong owner hiện có. Không đổi semantics của token cũ hoặc xóa field vì chưa thấy renderer đọc nó.

### 1.2. Không coi tokenizer output là expected output

Probe local dùng Node `v24.11.0`, ICU `77.1`, `pinyin-pro` installed/locked `3.28.1` (`package.json`: `^3.28.0`). Không có `@pinyin-pro/data` trong manifest/lockfile.

| Input                | Token hiện tại                | Candidate `Intl.Segmenter` word  | Kết luận                                           |
| -------------------- | ----------------------------- | -------------------------------- | -------------------------------------------------- |
| `他不太伤心。`       | `他 / 不 / 太 / 伤 / 心 / 。` | `他 / 不太 / 伤心 / 。`          | Cần giữ `不 / 太`, nhận `伤心`                     |
| `我不知道怎么回答。` | Từng glyph                    | `我 / 不知道 / 怎么 / 回答 / 。` | Cần `不 / 知道`, không dùng candidate nguyên khối  |
| `一个人。`           | `一 / 个 / 人 / 。`           | `一个 / 人 / 。`                 | Cần chốt classifier boundary riêng                 |
| `我得去上课。`       | `我得去 / 上 / 课 / 。`       | `我 / 得 / 去 / 上课 / 。`       | Pronunciation phrase phải độc lập reading boundary |
| `听得入迷`           | `听得入迷`                    | `听 / 得 / 入 / 迷`              | Candidate cũng có thể thiếu một từ cần ghép        |
| `很好的朋友`         | Từng glyph                    | `很好 / 的 / 朋友`               | Phải review adverb boundary                        |
| `HSK 4，2026年。`    | Từng grapheme                 | `HSK / ␠ / 4，2026 / 年 / 。`    | Candidate còn có thể đi qua dấu câu                |

`pinyin-pro.segment()` không nạp data trong môi trường này vẫn trả từng chữ cho `伤心`, `知道`, `怎么`, `回答`, `西安`; có nhận một số phrase như `银行`, `行长`. Thay API segmentation đơn thuần chưa đạt target.

### 1.3. Source evidence và manual override có ưu tiên cụ thể

Glyph selection hiện tại ưu tiên manual override → source pinyin align được → dictionary align được → library. Spoken reading cũng giữ source reading khi align được.

Probe `他不太伤心。`:

- Không source: `tā bú tài shāng xīn。`.
- Source `tā bù tài shāng xīn。`: status `aligned`, output vẫn `tā bù tài shāng xīn。`.

Vì vậy target `bú tài` chỉ áp dụng khi chính glyph authority trả `bú`. Grouping không được áp biến điệu lại lên source `bù`.

PRD nói source mode luôn giữ nguyên source còn thiếu ngoại lệ hiện hữu: `ContextualReaderText` paragraph và `useReaderSessionPronunciation` cho phép **manual override thắng source**. Phải giữ ngoại lệ này. Source ruby align được hiện đã render từ glyph, không bảo toàn nguyên văn spacing/capitalization của dòng source như paragraph.

### 1.4. Regression pronunciation hiện tại có giới hạn

Test `银行行长还没有还钱。` dùng source pinyin đúng. Probe không source/dictionary hiện trả `yín háng háng cháng hái méi yǒu hái qián。`; không được tuyên bố engine tự sinh đã đọc đúng toàn bộ câu.

V1 giữ nguyên pronunciation authority, không sửa lỗi `长/还` này bằng segmentation hoặc hard-code reading. Corpus phải tách case có evidence với case không evidence; case sau ghi rõ baseline limitation. Tương tự, `你好` với `toneSandhi: true` hiện là `nǐ hǎo`.

### 1.5. Reader còn đường paragraph/cooker/source adapter

Chỉ đổi `ProgressiveStudyText` và hai ruby renderers là chưa đủ:

- `src/features/reader/model/cook-reader-data.ts`: sinh pinyin thiếu, title, chia text dài theo giới hạn 2.000 UTF-16 code units; phải giữ nguyên identity, source string và chunking contract.
- `src/features/reading/hooks/useReaderSessionPronunciation.tsx`: chuẩn bị pinyin tự động/manual cho lesson và Daily; nguyên liệu analysis là source segment, không phải dòng pinyin đã format.
- `src/features/hanzihome/reader-adapters/useLessonReader.tsx`: tạo title pinyin khi thiếu; giữ source title nếu có.
- `src/features/reading/hooks/useReaderStudyState.ts`: phân tích resource paragraphs với vocabulary và persistent overrides.
- `src/features/reading/workspaces/ReaderDocumentStudy.tsx`: truyền analysis qua service, document vẫn có source pinyin; không được mặc định coi nó giống session-prepared document.
- `ReaderSegment.tsx`: tap/paragraph dùng `segment.pinyin`; điều kiện ruby còn so sánh string với `formatContextualSpokenPinyin(analysis)`.
- `HanziInspectorWorkspace.tsx` và `DailyReadingLibrary.tsx` có các dòng generated pinyin riêng. Daily còn dùng formatter cho title chuyển sang reader resource.

Giữ formatter cũ cho các contract ngoài phạm vi, nhất là `formatContextualPinyinRange` đang tạo pinyin cho selection actions. Không thay tất cả call site bằng search/replace, vì output có thể đi vào dữ liệu lưu.

### 1.6. Có một contract cần chốt để giữ source mode ở generic Reader

`src/features/reader/model/reader-display.ts` không có `autoDetectPinyin`. Giá trị này thuộc `LessonDisplayMode` của HanziHome. Generic Reader nhận analysis không thể phân biệt source mode với auto mode có source align được bằng `sourcePinyinStatus` hoặc so sánh string.

Đề xuất tại CP0: mở rộng **service trình bày hiện hữu**, không thêm setting:

- Thêm required `readingUnitsBySegmentId` vào `ReaderServices.pronunciationReview`, là map chỉ đọc, suy ra từ analysis và `autoDetectPinyin` hiện có.
- Source mode cung cấp map rỗng; auto mode cung cấp boundary cho đúng segment/analysis đang hiển thị. Manual override ở source mode vẫn dùng behavior hiện tại.
- Source hooks/workspaces tạo map bằng `useMemo`; không setter, store, persisted field, query hay sync mới. Khi source/analysis/mode đổi phải cập nhật map trong cùng derivation.
- Boundary dùng `Pick` từ `ContextualPronunciationToken` cho `id`, `text`, `start`, `end`, `type`; không định nghĩa lại union, không copy lexical/spoken reading hoặc confidence. Không thêm enum `orthography` vào contract cũ.
- `ReaderSegment` dùng sự có mặt của entry để chọn presentation; paragraph/tap/ruby cùng dùng analysis tương ứng. Không suy ngược chế độ từ chuỗi pinyin.

Đây là **đề xuất additive TypeScript service contract**, chưa được triển khai hoặc coi là đã duyệt. CP0 phải chốt nó cùng corpus trước CP1; nếu không chấp thuận contract này thì cần phương án khác chứng minh được source-mode invariant. Không tự thêm prop/schema/state để né vấn đề. Các producer trực tiếp cần cập nhật chỉ là session hook, `ReaderDocumentStudy` và browser fixture; lesson/Daily đã nhận service từ session hook.

## 2. Hợp đồng V1 đề xuất

### Phạm vi giữ nguyên

- Hanzi text nodes, nghĩa Việt, source pinyin, lesson/static payloads, durable IDs, offset conventions, annotation/save/reset semantics và TTS input.
- `user_learning_state.settings.lessonTextDisplayMode` là owner duy nhất của preference; không toggle grouping mới.
- Không DB/RLS/migration, API/route/persistence-format change, dependency mới hoặc global state mới.
- Không rewrite pronunciation engine, không gọi `pinyin()` theo từng unit, không `addDict()` làm thay đổi global pronunciation dictionary.
- Không đưa feature imports vào shared `src/lib` hoặc đưa HanziHome types/typography vào generic Reader.
- Không thay `formatContextualSpokenPinyin`, `formatContextualPinyinRange` và review token output hiện có. Formatter mới chỉ được nối vào đường presentation đã kiểm kê.

### Boundary và formatter

1. Dùng cùng một hàm thuần trong `src/lib/pronunciation/contextual-pronunciation.ts` để suy ra reading units. Không thêm module segmentation/framework/normalizer tổng quát. Hàm được đề xuất: `getContextualReadingUnits(analysis)`.
2. Chỉ boundary đã được corpus/rule review xác nhận mới được ưu tiên. Không mặc định promote mọi dictionary phrase thành lexical word. Curated pronunciation phrases vẫn chỉ là pronunciation evidence.
3. `Intl.Segmenter` là candidate. Rule split/join phải có ví dụ dương, phản ví dụ và phạm vi rõ trong corpus; không `startsWith("不")`, ghép cặp chữ, hay regex đoán mọi tên riêng.
4. Bắt đầu bằng rule/table boundary cục bộ trong owner hiện có cho corpus đã duyệt. Không nhân bản cả lesson vocabulary vào shared source; không import static corpus vào client engine. Quality gate quyết định có thể nhận thêm generic candidates hay phải fallback.
5. Units phủ toàn bộ text đang phân tích, có thứ tự, không overlap/gap, start/end là UTF-16 offsets ở ranh giới grapheme. Không đi xuyên whitespace, punctuation, Latin/number hoặc segment/chunk boundary.
6. Fallback không đủ evidence hoặc segmentation lỗi: đơn vị grapheme và formatter hiện tại cho phần đó. Không bỏ Hanzi chưa có reading, không dùng `token.pinyin` hoặc pronunciation của tokenizer để vá.
7. `formatContextualReadingPinyin` dùng unit ranges để lấy reading đã được `preferredDisplayedPinyin` chọn từ glyph. Không tạo pronunciation authority thứ hai. Paragraph và ruby phải dùng cùng boundary và quy tắc separator.
8. Trong unit, nối syllable theo quy tắc được CP0 duyệt; cần xử lý dấu phân âm, ví dụ `西安 → xī'ān`, không dùng `join("")` vô điều kiện. Apostrophe chỉ nằm ở pinyin layer, không thành glyph/offset/click target mới.
9. Giữa hai Hanzi units kề nhau thêm một space ở dòng pinyin. Giữ nguyên các đoạn non-Hanzi và whitespace của source; không đổi `，` sang `,`, không `trim()`/collapse newline trong formatter. Giữ baseline mixed-text convention như `2026nián` trong V1, không mở rộng sang typography số/Latin.
10. Source paragraph giữ nguyên chữ hoa, dấu, apostrophe và spacing. Generated pinyin tiếp tục casing hiện tại; chưa làm toàn bộ proper-name capitalization/hyphen/erhua orthography. Erhua không được tự gộp/xóa glyph `儿` hoặc thay reading.
11. Phân biệt range của `normalizedText` với raw source: engine đang normalize NFC. Nếu NFC làm lệch source/offset, không tự sửa source hoặc invent offset mapping; giữ fallback hiện hữu và ghi baseline limitation. Không tuyên bố grouping sửa lỗi offset có sẵn.
12. Không tính lại segmentation theo playback tick. Memo theo analysis/text/mode, giữ subscriptions của Reader; kiểm tra hydration giữa Node ICU và browser, không dùng suppression để che mismatch.

### Source/display matrix

| Surface/mode                      | Không source                                      | Source aligned                                      | Source rejected                       | Manual override                                       |
| --------------------------------- | ------------------------------------------------- | --------------------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| Progressive, auto off             | Không invent pinyin                               | Giữ raw source                                      | Giữ raw source                        | Component này không nhận override; không mở rộng ở V1 |
| Progressive, auto on              | Group generated                                   | Group các source-selected glyph readings            | Group fallback pronunciation hiện tại | Giữ nguyên input contract                             |
| ContextualReaderText, auto off    | Giữ visibility/fallback do caller đang quyết định | Giữ ruby từng glyph hoặc raw paragraph như hiện tại | Giữ raw paragraph fallback            | Giữ correction thắng source; không tự bật grouping    |
| ContextualReaderText, auto on     | Group khi có analysis                             | Group source-selected readings                      | Group fallback khi có analysis        | Group reading đã sửa; vẫn review từng glyph           |
| Generic Reader có service         | Chỉ group entry do owner auto mode cung cấp       | Source mode không nhận group entry                  | Source mode không thay raw pinyin     | Save/reset range vẫn dựa token cũ                     |
| Generic Reader `generate-missing` | Group generated paragraph/title                   | Giữ supplied pinyin                                 | Giữ supplied pinyin                   | Không tự cài review service                           |

### Ruby và interaction

- Một ruby cho một reading unit được chấp nhận, nhiều base spans và nhiều syllable spans bên trong một `rt`.
- Mỗi Hanzi giữ click/Enter/Space, annotation priority, selection guard, aria label và playback offset của chính glyph đó. Mỗi pinyin syllable giữ inspect/alternatives/review marker riêng.
- Active highlight/`aria-current` đặt ở glyph active; không làm cả từ active khi chỉ một chữ đang phát.
- Chữ Hán không có reading vẫn phải xuất hiện. Khi hide pinyin không để syllable/inspect target còn focus được.
- Giữ các marker `data-reader-source`, `data-reader-hanzi-content`, `data-study-annotation-node`, paragraph/node IDs, `rt`/`rp` exclusion của selection/copy.
- TTS tiếp tục nhận Chinese source và start offset; không nhận grouped pinyin.
- Giữ typography owner tại từng surface: `PinyinText`/`ReaderHanziText` ở HanziHome; `LearnerHanziText`/presentation hiện có của generic Reader. Không tạo shared ruby React component ở CP đầu.
- Long unit/word wrapping phải có rendered evidence. Không tự cắt từ theo số chữ hoặc chèn space vào Hanzi để làm vừa viewport.

## 3. Corpus khởi điểm cho CP0

40 case dưới đây là **đầu vào và kỳ vọng đề xuất**, chưa phải bộ regression đã hoàn tất. CP0 phải ghi exact units/reading output hoặc explicit fallback cho từng case; không lấy kết quả tokenizer làm oracle. Nhóm có pronunciation chưa đúng phải giữ baseline và đánh dấu riêng, không sửa pronunciation trong task grouping.

| ID  | Input/context                                                                 | Kỳ vọng hoặc invariant cần freeze                                                              |
| --- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| C01 | `他不太伤心。`, không source                                                  | `他 / 不 / 太 / 伤心 / 。`; `tā bú tài shāngxīn。`                                             |
| C02 | C01, source `tā bù tài shāng xīn。`                                           | Auto giữ reading `bù`; source mode giữ raw line                                                |
| C03 | `我不知道怎么回答。`                                                          | `我 / 不 / 知道 / 怎么 / 回答 / 。`; `wǒ bù zhīdào zěnme huídá。`                              |
| C04 | `一个人。`, không source                                                      | `一 / 个 / 人 / 。`; `yí gè rén。`                                                             |
| C05 | C04, source `yī gè rén。`                                                     | Auto vẫn giữ `yī`; không re-sandhi                                                             |
| C06 | `银行行长还没有还钱。`, source đúng                                           | Group từ đã duyệt; giữ `hang2 / zhang3 / hai2 / huan2` đúng vị trí                             |
| C07 | C06, không source/dictionary                                                  | Ghi pronunciation sai sẵn ở `长/还`; grouping không đổi evidence/keys                          |
| C08 | `银行行长。`, dictionary `银行`, `行长`                                       | Pronunciation và approved lexical boundaries không bị candidate phá                            |
| C09 | `我得去上课。`                                                                | `我 / 得 / 去 / 上课 / 。`, `děi`; không ghép `wǒděiqù`                                        |
| C10 | `听得入迷`                                                                    | Đề xuất `听 / 得 / 入迷`, `de`; review complement boundary                                     |
| C11 | `他得到了奖品。`                                                              | Giữ `dé`; CP0 chốt `得到`/particle boundary                                                    |
| C12 | `吹得不比他们差。`                                                            | Giữ `de`, không ghép nguyên pronunciation phrase                                               |
| C13 | `既然你的盾坚固得什么矛都刺不进去。`                                          | Giữ contextual `de`; review `坚固 / 得`                                                        |
| C14 | `很好。`                                                                      | `很 / 好 / 。`; không invent third-tone sandhi                                                 |
| C15 | `很好的朋友`                                                                  | `很 / 好 / 的 / 朋友`                                                                          |
| C16 | `不得不说`                                                                    | Counterexample cho prefix `不`; chốt toàn cụm hoặc conservative fallback                       |
| C17 | `不错。`                                                                      | Không áp split-prefix tổng quát; explicit reviewed boundary                                    |
| C18 | `差不多。`                                                                    | Lexicalized expression; không cắt theo `不`                                                    |
| C19 | `西安` và source `Xī'ān`                                                      | Generated có dấu phân âm; source giữ casing/apostrophe                                         |
| C20 | `女儿`                                                                        | Dấu phân âm chỉ ở annotation; giữ hai glyph/reading                                            |
| C21 | `哪儿，这儿。`, source `nǎ'er, zhèr.`                                         | Source/erhua alignment không regress; không tự đổi thành một glyph                             |
| C22 | `你好`                                                                        | Giữ `nǐ hǎo` readings; không expand sandhi support                                             |
| C23 | `“怎么回答？”她说：“不知道！”`                                                | Giữ chính xác dấu `“”？！：`; approved unit boundaries                                         |
| C24 | `HSK 4，2026年。`                                                             | Không nuốt `，`; Latin/number/space nguyên vẹn                                                 |
| C25 | `伤心  回答\n怎么\t知道`                                                      | Giữ double space, newline, tab; không ghép qua chúng                                           |
| C26 | `😀伤心𠮷。` và prefix Latin decomposed `e\u0301`                             | Emoji/supplementary/grapheme/NFC; không đổi hệ offset                                          |
| C27 | `中国`, source `hǎo`                                                          | Source rejected/raw fallback không bị grouped formatter thay                                   |
| C28 | `银行`, phrase override `yin2/yin2`; thêm sentence-instance ở lần lặp thứ hai | Giữ override ở glyph/range; save/reset không lan sang occurrence khác                          |
| C29 | Một Hanzi không có reading; segmentation candidate không được chấp nhận       | Không mất text, không mất các reading sẵn có; grapheme fallback                                |
| C30 | `中国。` lặp 800 lần; prefix 1.999 ký tự + emoji                              | Giữ chunking/identity, đủ text và pinyin; không throw vì vượt 2.000                            |
| C31 | `古城西安在哪一个省？` — R1                                                   | Proper noun/dấu phân âm, classifier, punctuation                                               |
| C32 | `后来，他在一个银行里工作，他既会写又会算，只是总不精细。` — R2               | Boundary trong câu thật, không sửa source                                                      |
| C33 | `差不多先生的相貌和你我都差不多。` — R3                                       | Tên/lexicalized phrase, repeated occurrence                                                    |
| C34 | `他常常说："凡事只要差不多就好了，何必太精细呢？"` — R4                       | Quote/particle/adverb; kiểm cả block                                                           |
| C35 | `这时俄罗斯的经济情况不太好，他们这个跨国家庭的生活日益艰难。` — R5           | Proper noun, `不 / 太`, câu dài                                                                |
| C36 | `萨沙是他们的骄傲。` — R6                                                     | Tên người ngoài dictionary, fallback có kiểm soát                                              |
| C37 | `谈到未来，林虹说：也许她会带萨沙去香港，一家人总是要团聚的。` — R7           | Tên riêng, punctuation và word wrap                                                            |
| C38 | `赵经理： 您好！请问是孙经理吗？` — R8                                        | Dialogue label, space có sẵn, honorific                                                        |
| C39 | Đoạn `浙江省绍兴市…` — R9                                                     | Grouped source pinyin, địa danh; kiểm toàn paragraph                                           |
| C40 | Đoạn `有个老木匠准备退休…` — R10                                              | Source pinyin chứa cả ghi chú Việt `(Thiên luân chi lạc)`; giữ raw fallback khi align rejected |

Nguồn thật đã xác nhận bằng read-only inspection; excerpt không phải sửa payload:

| Ref | File và stable node                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `src/features/hanzihome/static-json/nhip-cau.json`, `nhip-cau-lesson-02-source-21`                                                           |
| R2  | Cùng file, `nhip-cau-lesson-02-source-25`                                                                                                    |
| R3  | Cùng file, `nhip-cau-lesson-02-source-9`                                                                                                     |
| R4  | Cùng file, `nhip-cau-lesson-02-source-13`                                                                                                    |
| R5  | `src/features/hanzihome/static-json/doc-hieu.json`, `doc-hieu-unit-03-article-02-text-block-237`                                             |
| R6  | Cùng file, `doc-hieu-unit-03-article-02-text-block-243`                                                                                      |
| R7  | Cùng file, `doc-hieu-unit-03-article-02-text-block-245`                                                                                      |
| R8  | `src/features/hanzihome/static-json/business-chinese.json`, `business-chinese-tm2-lesson-01-section-03-block-003`                            |
| R9  | `src/features/hanzihome/static-json/studio-seed.json`, `reader.paragraphs`, document `hanzihome-studio-reading:U3-R1`, paragraph `U3-R1-p01` |
| R10 | Cùng file, document `hanzihome-studio-reading:U4-R1`, paragraph `U4-R1-p01`                                                                  |

PRD nhắc screenshot nhưng attachment hiện chỉ có văn bản, không có screenshot/lesson ID. Chưa xác nhận bài gốc của screenshot. Khi biết ID phải bổ sung đúng payload; không coi R1–R10 là bằng chứng cho bài đó.

## 4. Checkpoints

| Status | Checkpoint                            | Phụ thuộc   | Kết quả phải có                                                         |
| ------ | ------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| [x]    | Review baseline và tạo plan           | —           | Source/consumer inspection, 86 baseline tests, probes được ghi bên dưới |
| [x]    | CP0 — Freeze corpus và contract       | Review      | Exact expectations, fallback/rule ledger, service boundary được chốt    |
| [x]    | CP1 — Reading boundaries và formatter | CP0         | Pure logic, không UI, không đổi pronunciation/review token              |
| [x]    | CP2 — Paragraph và source adapters    | CP1         | Auto/source/manual/tap nhất quán ở các đường đã liệt kê                 |
| [x]    | CP3a — ContextualReaderText ruby      | CP2         | Word ruby + glyph interaction giữ nguyên                                |
| [x]    | CP3b — Generic ReaderSegment ruby     | CP3a        | Cùng boundary ở Reader, không kéo HanziHome ownership vào engine        |
| [x]    | CP4 — Interaction regression          | CP3a + CP3b | Actual event/range/copy/save/reset proof                                |
| [x]    | CP5 — Rendered QA và final gate       | CP4         | Phone/iPad/desktop + full `npm run check`                               |

CP3a/CP3b là các phần nhỏ để review, không được kết luận feature xong khi mới hoàn tất một renderer. Dependency upgrade là nhánh có điều kiện ở mục 6, không phải việc tự động chạy sau CP5.

### CP0 — Freeze corpus và chốt boundary trình bày

**Files:** tài liệu này; case tables trong `src/features/hanzihome/pronunciation/contextual-pronunciation.test.ts`; implementation owner ở CP1.

- [x] Freeze 40 case từ bảng trên: input, source/dictionary/override, expected units hoặc fallback, displayed pinyin, pronunciation invariant và reason/rule.
- [x] Chốt dấu phân âm, classifier, `得/了`, lexicalized `不`, proper noun và compound; core C01/C03 không được fallback từng chữ.
- [x] Chốt additive runtime service ở mục 1.6 và producer/consumer: source mode gửi map rỗng; auto mode gửi units từ analysis. `analysis.tokens` không đổi.
- [x] Ghi recognized boundaries và negative cases. Candidate ambiguous vẫn dùng `Intl.Segmenter` fallback, không được tính là pronunciation authority.
- [x] Giữ raw/source/NFC offset và range review baseline; không sửa static JSON hay fetch toàn bộ DB.

**Gate:** review xong expectations/contract trước khi đổi engine. Baseline pronunciation tests pass; exact grouping expectations phải phân biệt target mới với current output, không thêm `skip`/`todo` rồi coi đạt. Chỉ thêm assertions cho feature mới cùng CP1 khi có implementation.

**Evidence:** C01/C03/C04/C09/C10/C15, source `bù`, apostrophe, mixed-script, token/range independence đều có regression trong `contextual-pronunciation.test.ts`; corpus table giữ case source/dictionary/fallback còn lại. **Rollback:** revert tài liệu/test thuộc checkpoint; không có dữ liệu thay đổi.

### CP1 — Shared reading boundaries và formatter

**Files:** `src/lib/pronunciation/contextual-pronunciation.ts`, HanziHome facade `src/features/hanzihome/pronunciation/contextual-pronunciation.ts`, test pronunciation hiện có.

- [x] Thêm `ContextualReadingUnit`, `getContextualReadingUnits`, formatter và export tối thiểu trong pronunciation owner/facade.
- [x] Giữ original/normalized text, glyph start/end, lexical/spoken keys, alternatives, confidence, evidence, unresolved, source status và review tokens.
- [x] Bảo vệ punctuation, whitespace, missing reading, mixed scripts, UTF-16 grapheme và apostrophe; missing reading rơi về glyph rendering.
- [x] Dictionary phrase chỉ tiếp tục là pronunciation evidence; reading unit lấy reviewed spelling rule rồi `Intl.Segmenter` fallback, không đọc `token.pinyin` hay gọi lại pronunciation.
- [x] Core targets có exact regression; fallback không được báo là pronunciation correction.
- [x] Boundary/formatter chỉ đọc analysis; cache chỉ là immutable `Intl.Segmenter`/candidate constants.

**Gate:** `npm run test:run -- src/features/hanzihome/pronunciation/contextual-pronunciation.test.ts`; `npm run typecheck`; `npm run source:check`; `git diff --check`; complete diff audit.

**Evidence:** focused pronunciation suite pass và `npm run typecheck`, `npm run source:check`, `git diff --check` pass. **Rollback:** revert exports/logic/tests CP1; không persistence migration.

### CP2 — Paragraph, generated data và source mode

**Files dự kiến:**

- `src/features/hanzihome/components/lesson-overview/ProgressiveStudyText.tsx` và test cùng tên.
- `src/features/reader/model/cook-reader-data.ts` và test cùng tên.
- `src/features/reading/hooks/useReaderSessionPronunciation.tsx`.
- `src/features/hanzihome/reader-adapters/useLessonReader.tsx`.
- `src/features/reader/runtime/reader-services.ts` theo contract đã chốt CP0.
- `src/features/reading/workspaces/ReaderDocumentStudy.tsx`, `src/features/reader/components/ReaderSegment.tsx`, `src/features/reader/components/Reader.test.tsx`.
- `src/features/hanzihome/inspector/HanziInspectorWorkspace.tsx`, `src/features/daily-reading/DailyReadingLibrary.tsx`: chỉ generated reading presentation được kiểm kê.
- `src/features/reader/runtime/Reader.browser.fixture.tsx`: cập nhật producer service contract nếu CP0 chọn phương án đề xuất.

- [x] Progressive đổi riêng auto path; source raw line, visibility, meaning, tap sizing và TTS handlers giữ nguyên.
- [x] Cooker đổi riêng generated-missing paragraph/title; supplied pinyin, IDs, capabilities, chunking và Hanzi input giữ nguyên.
- [x] Session/source owners cung cấp units theo auto mode; generated line không quay vào analysis source evidence.
- [x] Reader resource/session paragraph và tap nhận grouped auto line; source/manual vẫn dùng line cũ.
- [x] Source ruby gửi map rỗng và còn per-glyph; auto source gửi unit map cho CP3.
- [x] Inspector và Daily generated previews/title dùng formatter mới; Inspector explicit `autoDetectPinyin: true`. Không sửa payload/schema/settings.
- [x] `formatContextualPinyinRange` cho selection và review token contract không đổi.

**Gate:** các test pronunciation, Progressive, cooker, `Reader.test.tsx`; `npm run typecheck`, `npm run source:check`, `git diff --check`. Test `ReaderWorkspace.test.tsx` hiện mock `ReaderDocumentStudy` thành `null`, **không phải** integration proof cho paragraph/source mode. Dùng fixture Reader/Reading ở CP4 cho source adapter flow.

**Evidence:** cooker/progressive/Reader regression, type/source checks pass. **Rollback:** revert riêng call sites/service additions CP2; không migration.

### CP3a — ContextualReaderText grouped ruby

**Files:** `src/features/hanzihome/components/reading/ContextualReaderText.tsx`, test cùng tên.

- [x] Render unit ruby + base/`rt` glyph spans khi auto; source mode dùng exact per-glyph renderer cũ.
- [x] Glyph play/inspect/annotation labels, focus, review warning và active highlight tiếp tục ở từng glyph.
- [x] Mất reading rơi về glyph và non-Hanzi giữ nguyên.
- [x] Paragraph auto dùng formatter mới; source/manual paragraph giữ behavior cũ.
- [x] Business Chinese thừa hưởng display mode hiện có; Inspector explicit auto preview; rejected source regression giữ paragraph raw fallback.

**Gate:** ContextualReaderText + Progressive tests; `npm run typecheck`, `npm run ui:check`, `git diff --check`. Static markup chỉ chứng minh anatomy/attributes; hành vi phải qua CP4.

**Evidence:** static ContextualReaderText regressions cover grouped ruby, source ruby, paragraph auto/source, annotations và review labels. **Rollback:** revert renderer/tests CP3a.

### CP3b — Generic ReaderSegment grouped ruby

**Files:** `src/features/reader/components/ReaderSegment.tsx`, `src/features/reader/components/Reader.test.tsx`, Reader browser fixture/test hiện có.

- [x] Dùng `readingUnitsBySegmentId` do source owner cung cấp; generic Reader không parse pinyin hay đọc persisted setting.
- [x] Giữ `grapheme.index` UTF-16 cho play, annotation, selection/copy.
- [x] Active highlight, memo/subscriptions, paragraph/tap và service/render hooks giữ owner cũ.
- [x] Không thêm shared React renderer/hook/setting/store/dependency.

**Gate:** Reader static tests, playback/store tests, `npm run typecheck`, `npm run ui:check`, `git diff --check`; actual grouped DOM proof ở CP4.

**Evidence:** Reader SSR regression verifies four ruby units and separate later-glyph labels. **Rollback:** revert ReaderSegment/service/fixture/tests CP3b.

### CP4 — Interaction và source integration regression

**Precedent/files:** `src/features/reader/runtime/Reader.browser.fixture.tsx`, `Reader.browser.test.ts`, `src/features/reading/workspaces/Reading.browser.fixture.tsx`, `Reading.browser.test.ts`; `src/features/reading/hooks/useReaderSelectionActions.test.tsx`; pronunciation/component test hiện có.

- [x] Browser fixture click pinyin của `心` (glyph cuối của `伤心`) gọi review callback đúng glyph; existing Reader keyboard/playback regressions vẫn pass.
- [x] Browser selection qua toàn source sau unit ruby trả `他不太伤心。`; `rt`/`rp` bị loại, không dính pinyin.
- [x] Existing selection/annotation regressions và full suite giữ source annotation guard/copy handlers; grouped DOM fixture xác nhận contract không đổi.
- [x] Token regression giữ `我得去` khác reading units `我 / 得 / 去`; persistent/session review owners không đổi và không có API mutation.
- [x] Source/auto/manual matrix có unit, source ruby và paragraph regressions; map được derive theo analysis/mode, không shared state.
- [x] Generic Reader fixture thực sự render DOM, không chỉ SSR.

**Gate:** tests trên dữ liệu/DOM thật đạt các invariant; ghi expected/actual offsets và callbacks. Browser suites hiện **opt-in** bằng `READER_BROWSER_TEST=1`; `npm run check` mặc định không chứng minh đã chạy chúng.

User sau đó đã yêu cầu hoàn tất implementation và kiểm tra kỹ, nên focused existing browser fixture được chạy; browser tab local chỉ được đọc ở trang login, không dùng account/session người dùng:

```sh
READER_BROWSER_TEST=1 npm run test:run -- src/features/reader/runtime/Reader.browser.test.ts src/features/reading/workspaces/Reading.browser.test.ts
```

Đóng browser/server sau verification. Nếu chưa có phương tiện/authorization cho required event proof, để CP4 unchecked và ghi giới hạn; không đổi test gate thành pass giả.

**Evidence:** `READER_BROWSER_TEST=1 npm run test:run -- src/features/reader/runtime/Reader.browser.test.ts -t "renders grouped ruby"` pass (1 test). Cả `Reader.browser.test.ts` full suite và `Reading.browser.test.ts` source-workspace suite đều dừng trước assertions grouped ở cùng pre-existing responsive locator: không tìm được combobox `Mục lục bài đọc` trong vòng viewport mobile. Đây không nằm trong `npm run check`; không sửa test/layout ngoài scope để che failure. **Rollback:** corrections chỉ trong file có reproduction; không cần sửa selection/annotation owner.

### CP5 — Rendered QA và completion

**Viewport:** `390×844`, `820×1180`, `1440×900`; iPad portrait bắt buộc. Render paragraph và ruby ở lesson/Business Chinese, resource Reader/HSK và Inspector/Daily consumer bị ảnh hưởng.

- [x] Grouped browser fixture has no horizontal overflow at `390×844`, `820×1180`, `1440×900`; no Chinese whitespace inserted.
- [x] Existing Reader display/tap/keyboard regressions and DOM fixture cover pinyin visibility/focus; this slice adds no typography/font setting.
- [x] SSR + browser fixture render the same four units; local Node/ICU remains the reviewed runtime. No hydration warning in focused browser run.
- [x] R1–R10 stay read-only corpus references; no authenticated local route was used, so this evidence is fixture/source-level rather than live user-session proof.
- [x] Cooker long-content/unicode regressions preserve chunking and identity with grouped output.
- [x] Diff audit: no schema, setting, static payload, dependency, global store, new production file or duplicated pronunciation authority.
- [x] `npm run check` and `git diff --check` pass on final source.

**Gate:** CP0–CP4 đạt, corpus targets đạt, visual matrix có evidence và full quality gate pass. Local/browser/CI/deployment là các loại bằng chứng khác nhau. Không commit/push/merge/deploy tự động từ plan này.

**Evidence:** `npm run check` pass: lint, architecture/UI/API/performance checks, typecheck, 239 Vitest files (1227 pass, 3 skipped), format, production audit, and webpack production build. Focused grouped browser fixture passes; the separate full opt-in browser suites have the CP4 outline-locator limitation above. **Rollback:** revert feature diff consumer → formatter; no DB rollback.

## 5. Evidence đã thực hiện trong lượt review

Baseline test command:

```sh
npm run test:run -- src/features/hanzihome/pronunciation/contextual-pronunciation.test.ts src/features/hanzihome/components/lesson-overview/ProgressiveStudyText.test.tsx src/features/hanzihome/components/reading/ContextualReaderText.test.tsx src/features/reader/model/cook-reader-data.test.ts src/features/reader/components/Reader.test.tsx src/features/reader/runtime/reader-playback.test.ts src/features/reader/runtime/reader-store.test.ts
```

**PASS: 7 files / 86 tests**, 2026-09-14, Vitest `4.1.10`. Đây là engine/SSR/pure-runtime baseline, chưa có test cho grouped feature mới. Không chạy browser automation.

Đã probe trực tiếp module TS hiện tại bằng Node strip-types, đối chiếu current formatter/tokens với `Intl.Segmenter` và `pinyin-pro.segment()`; kết quả ở mục 1. Node chỉ báo `MODULE_TYPELESS_PACKAGE_JSON` khi import TS theo cách probe này; không đổi module settings để xử lý cảnh báo của probe.

Đã đọc real payloads bằng stable IDs ở mục 3. Không probe live Supabase, TTS provider, saved user override hoặc production. Sau implementation, `npm run check` đã pass như ghi ở CP5; các giới hạn live-service vẫn giữ nguyên.

Document checks: `npm run format:check` lần đầu chỉ báo format của file plan mới; đã chạy `npm exec --no -- oxfmt --write docs/refactors/word-grouped-pinyin-reading-2026-09-14.md`, sau đó `npm run format:check` **PASS trên 1.419 files**. `git diff --check` không báo lỗi; diff `--no-index` của file mới cũng không có whitespace diagnostics. Đã đọc toàn bộ nội dung file mới để audit diff; Git chỉ có một file plan mới, HEAD không đổi. Đây chỉ là kiểm tra tài liệu, không chứng nhận implementation.

## 6. Nhánh có điều kiện — nâng chất lượng segmentation

Chỉ mở nếu CP0/CP1 cho thấy core cases không đạt hoặc fallback quá nhiều trên corpus đại diện. Không bắt buộc phải hoàn tất UI trước khi phát hiện engine không đủ chất lượng.

- [ ] Báo case thất bại và tỷ lệ grouped/fallback/sai merge, so `Intl` và `pinyin-pro.segment` hiện có.
- [ ] Đánh giá `@pinyin-pro/data/modern` hoặc `complete`: coverage, bundle/load cost, browser/SSR behavior và global `addDict` ảnh hưởng pronunciation authority.
- [ ] Nêu cụ thể package/version/files/contracts và phương án cô lập ảnh hưởng phát âm trước khi xin phép cài dependency.
- [ ] Chỉ thực hiện sau explicit approval; nếu làm phải re-run toàn bộ pronunciation baseline/corpus và gate liên quan, không dùng dependency để âm thầm đổi reading.

Nhánh này chưa được mở; không thuộc dependency budget V1.

## 7. Nguồn đối chiếu và giới hạn phát biểu

- [SAMR — GB/T 16159-2012](https://std.samr.gov.cn/gb/search/gbDetailed?id=71F772D7E196D3A7E05397BE0A0AB82A): trang chính thức ghi còn hiệu lực, review 2025-09-05 tiếp tục hiệu lực. Đây là bằng chứng trạng thái tiêu chuẩn, không chứng nhận toàn bộ policy của app tuân thủ chuẩn.
- [Bản PDF Bộ Giáo dục Trung Quốc](https://www.moe.gov.cn/ewebeditor/uploadfile/2015/01/13/20150113091717604.pdf): tìm thấy nguồn gốc nhưng fetch timeout trong lượt này; chưa đối chiếu toàn văn từng điều khoản. CP0 cần đối chiếu quy tắc còn tranh luận trước khi gắn nhãn orthography-compliant.
- [pinyin-pro segment docs](https://pinyin-pro.cn/en/use/segment.html): API từ 3.24; tài liệu yêu cầu comprehensive dictionary để có segmentation chính xác. Kết luận về installed behavior trong plan dựa thêm local probe, không suy từ docs latest.
- [Issue #286](https://github.com/zh-lx/pinyin-pro/issues/286) và [PR #356](https://github.com/zh-lx/pinyin-pro/pull/356): upstream còn theo dõi third-tone sandhi; PR list được đọc ghi mở 2026-08-22. Không dùng trạng thái upstream thay cho bằng chứng version đang cài.

V1 là presentation theo đơn vị đọc đã được duyệt, giữ pronunciation capabilities hiện có. Chưa tuyên bố thực hiện toàn bộ GB/T 16159, proper-name casing hoặc mọi biến điệu tiếng Trung.
