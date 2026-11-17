# Nhóm D — Nét Cơ Bản 1 Nét & Các Bộ Thủ 2 Nét Khang Hy Còn Lại (Bộ 70 → 90)

> Tài liệu chuẩn hóa **21 bộ thủ** từ **Bộ 70 (`丨`) đến Bộ 90 (`厶`)** — bao gồm toàn bộ các bộ **1 nét cơ bản** và các bộ **2 nét Khang Hy còn lại** ngoài 69 bộ cốt lõi ở Nhóm A–C, đối chiếu trực tiếp với bảng `public.hanzihome_radicals` và chuẩn bị dữ liệu đầy đủ cho phần **Chữ Hán thông dụng + Thiên bàng đứng chung**.
>
> - **Đã có trong DB (`EXISTS`):** **19 / 21** bộ (`70`–`76`, `78`, `80`–`90`). Trong đó có **2 dòng trùng rỗng** cần lưu ý khi dọn DB: `radical-113` (`radical_index: 113` của `卩`) và `radical-112` (`radical_index: 112` của `厂`); riêng `匸` (`radical-107`) đang có dấu `**` dư ở cuối trường `name_vi`.
> - **Chưa có trong DB (`MISSING`):** **2 / 21** bộ — **Bộ 77 `入` (Nhập, Khang Hy #11)** và **Bộ 79 `冂` (Quynh, Khang Hy #13)** (`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`).
> - **Nguyên tắc xếp chữ Mục 2 vs Mục 3:** Bảng Mục 2 chỉ đưa các chữ thực sự xếp dưới bộ thủ đang xét (theo Khang Hy tự điển hoặc Tân Hoa tự điển với chữ giản thể, luôn ghi rõ `[Tra bộ ...]`); các chữ chỉ chứa nét/linh kiện giống bộ này nhưng xếp dưới bộ khác được phân tách rõ sang Mục 3 (`related_components`).

## Mục lục nhanh (Bộ 70 → Bộ 90)

| STT | Bộ thủ | Hán Việt | Khang Hy | Trạng thái DB | DB ID chính   | `radical_index` | Số nét | Dòng trùng / lưu ý DB                      | Liên kết nhanh                         |
| :-: | :----: | -------- | :------: | ------------- | ------------- | :-------------: | :----: | ------------------------------------------ | -------------------------------------- |
| 70  |   丨   | Cổn      |    #2    | Đã có         | `radical-090` |       90        |   1    | —                                          | [Bộ 70: 丨 (Cổn)](#bộ-70-丨-cổn)       |
| 71  |   丶   | Chủ      |    #3    | Đã có         | `radical-091` |       91        |   1    | —                                          | [Bộ 71: 丶 (Chủ)](#bộ-71-丶-chủ)       |
| 72  |   丿   | Phiệt    |    #4    | Đã có         | `radical-092` |       92        |   1    | —                                          | [Bộ 72: 丿 (Phiệt)](#bộ-72-丿-phiệt)   |
| 73  |   乙   | Ất       |    #5    | Đã có         | `radical-093` |       93        |   1    | —                                          | [Bộ 73: 乙 (Ất)](#bộ-73-乙-ất)         |
| 74  |   亅   | Quyết    |    #6    | Đã có         | `radical-094` |       94        |   1    | —                                          | [Bộ 74: 亅 (Quyết)](#bộ-74-亅-quyết)   |
| 75  |   亠   | Đầu      |    #8    | Đã có         | `radical-096` |       96        |   2    | —                                          | [Bộ 75: 亠 (Đầu)](#bộ-75-亠-đầu)       |
| 76  |   儿   | Nhi      |   #10    | Đã có         | `radical-101` |       101       |   2    | —                                          | [Bộ 76: 儿 (Nhi)](#bộ-76-儿-nhi)       |
| 77  |   入   | Nhập     |   #11    | **CHƯA CÓ**   | —             |        —        |   2    | Cần bổ sung dòng mới                       | [Bộ 77: 入 (Nhập)](#bộ-77-入-nhập)     |
| 78  |   八   | Bát      |   #12    | Đã có         | `radical-097` |       97        |   2    | —                                          | [Bộ 78: 八 (Bát)](#bộ-78-八-bát)       |
| 79  |   冂   | Quynh    |   #13    | **CHƯA CÓ**   | —             |        —        |   2    | Cần bổ sung dòng mới                       | [Bộ 79: 冂 (Quynh)](#bộ-79-冂-quynh)   |
| 80  |   冖   | Mịch     |   #14    | Đã có         | `radical-049` |       49        |   2    | —                                          | [Bộ 80: 冖 (Mịch)](#bộ-80-冖-mịch)     |
| 81  |   几   | Kỷ       |   #16    | Đã có         | `radical-103` |       103       |   2    | —                                          | [Bộ 81: 几 (Kỷ)](#bộ-81-几-kỷ)         |
| 82  |   凵   | Khảm     |   #17    | Đã có         | `radical-114` |       114       |   2    | —                                          | [Bộ 82: 凵 (Khảm)](#bộ-82-凵-khảm)     |
| 83  |   勹   | Bao      |   #20    | Đã có         | `radical-104` |       104       |   2    | —                                          | [Bộ 83: 勹 (Bao)](#bộ-83-勹-bao)       |
| 84  |   匕   | Chủy     |   #21    | Đã có         | `radical-102` |       102       |   2    | —                                          | [Bộ 84: 匕 (Chủy)](#bộ-84-匕-chủy)     |
| 85  |   匚   | Phương   |   #22    | Đã có         | `radical-106` |       106       |   2    | —                                          | [Bộ 85: 匚 (Phương)](#bộ-85-匚-phương) |
| 86  |   匸   | Hệ       |   #23    | Đã có         | `radical-107` |       107       |   2    | `name_vi` trong DB đang dư `**` cuối chuỗi | [Bộ 86: 匸 (Hệ)](#bộ-86-匸-hệ)         |
| 87  |   卜   | Bốc      |   #25    | Đã có         | `radical-099` |       99        |   2    | —                                          | [Bộ 87: 卜 (Bốc)](#bộ-87-卜-bốc)       |
| 88  |   卩   | Tiết     |   #26    | Đã có         | `radical-109` |       109       |   2    | Trùng rỗng `radical-113` (#113)            | [Bộ 88: 卩 (Tiết)](#bộ-88-卩-tiết)     |
| 89  |   厂   | Hán      |   #27    | Đã có         | `radical-047` |       47        |   2    | Trùng rỗng `radical-112` (#112)            | [Bộ 89: 厂 (Hán)](#bộ-89-厂-hán)       |
| 90  |   厶   | Tư       |   #28    | Đã có         | `radical-100` |       100       |   2    | —                                          | [Bộ 90: 厶 (Tư)](#bộ-90-厶-tư)         |

---

## Bộ 70: 丨 (Cổn)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-090` · `radical_index`: `90` · Khang Hy **#2** · `strokes`: `1` nét · `name_vi`: `bộ Cổn` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `丨` — dạng chính (1 nét sổ thẳng kéo từ trên xuống dưới).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Một nét dọc xuyên suốt từ trên xuống dưới; _Thuyết Văn Giải Tự_ giải nghĩa là "thông suốt trên dưới".
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chủ yếu là nét sổ cơ bản và linh kiện phân loại tra từ điển cho một nhóm nhỏ chữ ít nét hoặc chữ có trục dọc xuyên tâm (`中`, `串`); gần như không dùng làm bộ biểu nghĩa độc lập trong tiếng Trung hiện đại.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `丨` là nét sổ nền giúp tra cứu một số chữ ít nét hoặc chữ có trục thẳng đứng xuyên qua; không nên kỳ vọng đoán nghĩa hiện đại chỉ từ nét `丨`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`丨` (Cổn) vs `十` (Thập):** `丨` là 1 nét sổ cơ bản (bộ nét); `十` có thêm nét ngang (`一 + 丨`, 2 nét), là bộ thủ độc lập nghĩa "số mười".
    - **`丨` (Cổn) vs `亅` (Quyết):** `丨` kéo thẳng không có móc ở đáy; `亅` (Khang Hy #6) có móc nhọn hất ngược lên ở cuối nét.
    - **Phạm vi tra chữ:** Không phải mọi chữ có nét sổ dọc (như `王`, `干`, `木`, `引`) đều thuộc bộ `丨`; phần lớn các chữ có nét sổ chỉ dùng `丨` như một nét viết thông thường.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ thuần bộ `丨` truyền thống (trục dọc xuyên tâm & nhánh chạc)

| Chữ Hán |    Pinyin     | Hán Việt | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                            |
| :-----: | :-----------: | :------: | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   丨    |   gǔn / shù   |   Cổn    | Độc thể (Bộ thủ chính)              | [Tra bộ 丨] Cổ tự biểu thị nét vạch thẳng thông suốt trên dưới; trong thư pháp hiện đại gọi là nét sổ (`shù`) (丨画: nét sổ).                                                             |
|   丫    |      yā       |   Nha    | `丶` + `丶` + `丨`                  | [Tra bộ 丨] Hình cành cây rẽ hai nhánh ở đầu thân thẳng (`丨`) → chạc cây, ngã rẽ, con gái/cô hầu gái xưa (树丫 shùyā: chạc cây, 丫头 yātou: cô bé/nha đầu).                              |
|   中    | zhōng / zhòng |  Trung   | `口` + `丨` (trục xuyên giữa khung) | [Tra bộ 丨] Nét dọc xuyên chính giữa lá cờ/khung vuông → ở giữa, trung tâm, bên trong (`zhōng`: 中国 Zhōngguó, 中间 zhōngjiān); trúng đích (`zhòng`: 中奖 zhòngjiǎng, 命中 mìngzhòng).    |
|   丰    |     fēng      |  Phong   | Ba nét ngang + `丨` (giản của `豐`) | [Tra bộ 丨] Cổ tự vẽ cành lá mọc rậm rạp trên thân cây thẳng → tươi tốt, dồi dào, phong phú (丰富 fēngfù: phong phú, 丰收 fēngshōu: được mùa).                                            |
|   串    |     chuàn     |  Xuyến   | Hai khung `口` xâu bằng trục `丨`   | [Tra bộ 丨] Hai vật tròn/vuông được xâu xuyên qua một que thẳng (`丨`) → xâu chuỗi, móc nối, xiên (一串 yī chuàn: một xâu, 串门 chuànmén: sang nhà chơi, 羊肉串 yángròuchuàn: thịt xiên). |

### Nhóm B: Chữ thông dụng xếp bộ `丨` theo chuẩn từ điển Khang Hy / Tân Hoa giản thể

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                          |
| :-----: | :-----: | :------: | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   个    | gè / gě |    Cá    | `人` + `丨` (phồn thể `個` / `箇`)      | [Tra bộ 丨 (Khang Hy) / 人 (Tân Hoa)] Rút gọn từ trúc đơn lẻ (`箇`) và người (`個`) → lượng từ phổ biến nhất cho người và vật (一个 yī gè: một cái, 个人 gèrén: cá nhân).               |
|   旧    |   jiù   |   Cựu    | `丨` + `日` (giản của `舊`)             | [Tra bộ 丨 (Tân Hoa giản thể) / 臼 (phồn thể `舊`)] Hình chim cú hoặc đồ vật lâu năm được giản lược thành `丨 + 日` → cũ kỹ, xưa cũ (旧书 jiùshū: sách cũ, 依旧 yījiù: vẫn như cũ).     |
|   临    |   lín   |   Lâm    | `丨` + `丨` + phần giản của `品` (`臨`) | [Tra bộ 丨 (Tân Hoa giản thể) / 臣 (phồn thể `臨`)] Ghé mắt từ trên cao nhìn xuống → đến nơi, đối mặt, sắp sửa (光临 guānglín: ghé thăm, 临时 línshí: tạm thời, 面临 miànlín: đối mặt). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `十` (`shí` · Thập — bộ thủ riêng, gồm nét ngang `一` + nét sổ `丨`, nghĩa số mười).
- `亅` (`jué` · Quyết — bộ thủ riêng, nét sổ có móc ở đáy, khác `丨` không móc).
- `师 / 師` (`shī` · Sư — thầy giáo, quân đội; có hai nét sổ bên trái nhưng tra bộ `巾` #50).
- `帅 / 帥` (`shuài` · Soái — đẹp trai, nguyên soái; tra bộ `巾` #50).
- `归 / 歸` (`guī` · Quy — trở về; giản thể bắt đầu bằng `丨丿`, tra bộ `彐` #58 ở Tân Hoa, phồn thể tra `止` #77).
- `卡` (`kǎ / qiǎ` · Tạp — thẻ, kẹt; có nét sổ nhưng tra bộ `卜` #25).
- `甲 / 申 / 由` (`jiǎ / shēn / yóu` — đều có nét trục dọc `丨` xuyên giữa khung `日/田` nhưng tra bộ `田` #102).
- `引` (`yǐn` · Dẫn · `弓 + 丨` — kéo, dẫn dắt; hình dây cung đặt cạnh mũi tên `丨`, tra bộ `弓` #57).

---

## Bộ 71: 丶 (Chủ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-091` · `radical_index`: `91` · Khang Hy **#3** · `strokes`: `1` nét · `name_vi`: `bộ Chủ` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `丶` — dạng chính (1 nét chấm nghiêng nhẹ từ trên trái xuống phải).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Một dấu chấm nhỏ; trong _Thuyết Văn Giải Tự_ giải thích `丶` tượng trưng ngọn lửa cháy trên cây đèn (`主`), hoặc chỉ là dấu chấm đánh dấu vị trí.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chủ yếu là nét chấm cơ bản và bộ tra cứu từ điển cho một số ít chữ đơn giản; không mang nghĩa "chủ nhân / chính" khi đứng như nét chấm bình thường trong chữ ghép.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `丶` thường là dấu chấm nhỏ trong cấu trúc nét; khi làm bộ thủ, chủ yếu phục vụ tra các chữ rất ít nét trong từ điển.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`丶` (bộ Chủ) vs `主` (chữ Chủ):** `丶` (1 nét) chỉ là nét chấm / bộ tra cứu; `主` (5 nét, tra bộ `丶`) mới là chữ độc lập mang nghĩa "chủ nhân, chính yếu".
    - **`丶` vs `亠` / `宀` / `广`:** Các bộ `亠`, `宀`, `广` đều mở đầu bằng một nét chấm ở đỉnh nhưng là các bộ thủ độc lập riêng, không tra dưới `丶`.
    - **`丶` vs `点` (Điểm/Chấm):** Chữ `点` nghĩa hiện đại là "dấu chấm, điểm", nhưng tra bộ `火 / 灬` (Khang Hy) hoặc `占` (một số bảng), không tra bộ `丶`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ thuần bộ `丶` theo Khang Hy tự điển

| Chữ Hán |   Pinyin   | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                       |
| :-----: | :--------: | :------: | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   丶    | zhǔ / diǎn |   Chủ    | Độc thể (Bộ thủ chính)    | [Tra bộ 丶] Nét chấm cơ bản; cổ văn là chữ gốc chỉ ngọn đèn lửa nhỏ, nay hầu như chỉ dùng làm tên bộ thủ hoặc gọi nét chấm (`diǎnhuà`: nét chấm).                                    |
|   丸    |    wán     |   Hoàn   | `九` + `丶`               | [Tra bộ 丶] Hình viên tròn lăn nghiêng (với dấu chấm nhỏ) → viên tròn, viên thuốc, viên thịt (药丸 yàowán: viên thuốc, 肉丸 ròuwán: thịt viên, 弹丸 dànwán: viên đạn nhỏ).           |
|   丹    |    dān     |   Đan    | Khung giếng + `丶` + `一` | [Tra bộ 丶 (Khang Hy) / 丿 (Tân Hoa)] Hình mỏ khai thác đá chu sa (`丶` tượng trưng hạt khoáng chu sa đỏ) → màu đỏ son, thuốc tiên (丹心 dānxīn: lòng son, 牡丹 mǔdān: hoa mẫu đơn). |
|   主    |    zhǔ     |   Chủ    | `丶` (ngọn lửa) + `王`    | [Tra bộ 丶] Cổ tự vẽ chân đèn đặt ngọn lửa (`丶`) thắp sáng ở trên → người đứng đầu, chủ nhân, chính yếu (主人 zhǔrén: chủ nhà, 主要 zhǔyào: chủ yếu, 民主 mínzhǔ: dân chủ).         |

### Nhóm B: Chữ giản thể thông dụng xếp vào bộ `丶` trong Tân Hoa tự điển

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                        |
| :-----: | :-------: | :------: | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   义    |    yì     |  Nghĩa   | `丶` + `乂` (giản của `義`)               | [Tra bộ 丶 (Tân Hoa giản thể) / 羊 (phồn thể `義`)] Rút gọn theo hình thảo thư → chính nghĩa, ý nghĩa, nghĩa vụ (意义 yìyì: ý nghĩa, 正义 zhèngyì: chính nghĩa, 义务 yìwù: nghĩa vụ). |
|   为    | wéi / wèi | Vi / Vị  | `丶` + `丿` + `𠃌` + `丶` (giản của `為`) | [Tra bộ 丶 (Tân Hoa giản thể) / 爪 (phồn thể `為`)] Làm, trở thành (`wéi`: 成为 chéngwéi, 认为 rènwéi); vì, cho (`wèi`: 因为 yīnwèi, 为了 wèile).                                     |
|   举    |    jǔ     |    Cử    | `⺍` + `二` + `八` + `丰` (giản của `舉`) | [Tra bộ 丶 (Tân Hoa giản thể) / 臼 (phồn thể `舉`)] Giơ lên, tổ chức, nêu ví dụ (举手 jǔshǒu: giơ tay, 举行 jǔxíng: tổ chức, 举例 jǔlì: nêu ví dụ).                                   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `之` (`zhī` · Chi — của, đi đến; Khang Hy xếp bộ `丿` #4, một số bảng Tân Hoa xếp bộ `丶` theo nét đầu).
- `点` (`diǎn` · Điểm — dấu chấm, điểm; tra bộ `火 / 灬`).
- `头 / 頭` (`tóu` · Đầu — cái đầu, đứng đầu; giản thể có hai chấm đầu nhưng tra bộ `大` #37, phồn thể tra `頁`).
- `良` (`liáng` · Lương — tốt lành; có chấm trên đỉnh nhưng tra bộ `艮` #138).
- `太` (`tài` · Thái · `大 + 丶` — quá, rất, lớn; tra bộ `大` #37).
- `犬` (`quǎn` · Khuyển — con chó; khác `大` ở một chấm phía trên-phải, là bộ thủ riêng #94).
- `玉` (`yù` · Ngọc — ngọc quý; khác `王` ở một chấm bên trong, là bộ thủ riêng #96).
- `火 / 冰` (`huǒ / bīng` — đều có nét chấm nhưng thuộc bộ `火` #86 và bộ `水` #85).

---

## Bộ 72: 丿 (Phiệt)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-092` · `radical_index`: `92` · Khang Hy **#4** · `strokes`: `1` nét · `name_vi`: `bộ Phiệt / Phẩy` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `丿` — dạng chính (1 nét phẩy xiên từ trên phải xuống dưới trái).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Một nét phẩy nghiêng kéo xuống trái; biểu thị đường nét xiên lướt hoặc gạt sang trái.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Nét cơ bản dùng trong cấu tạo chữ và phân loại tra từ điển các chữ ít nét; sức biểu nghĩa độc lập rất thấp.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `丿` là nét phẩy xuất hiện phổ biến trong hàng nghìn chữ Hán, nhưng chỉ làm bộ tra cứu cho một nhóm chữ ít nét hoặc chữ có kết cấu đan xen không dễ tách bộ khác.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`丿` (Hán tự) vs `ノ` (Kana Nhật):** Ký tự katakana _no_ (`ノ`) trong tiếng Nhật có hình giống hệt nét phẩy `丿`, nhưng thuộc hệ âm tiết Nhật, không dùng để giải nghĩa bộ thủ chữ Hán.
    - **`丿` (Phẩy) vs `乀 / ㇏` (Mác):** `丿` kéo từ trên xuống **trái**; `㇏` kéo từ trên xuống **phải**.
    - **Không tự quy nghĩa:** Thấy nét phẩy ở đầu chữ (`千`, `白`, `手`, `年`) không có nghĩa là chữ thuộc bộ `丿`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ ít nét xếp bộ `丿`

| Chữ Hán |  Pinyin  | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                           |
| :-----: | :------: | :------: | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   丿    |   piě    |  Phiệt   | Độc thể (Bộ thủ chính) | [Tra bộ 丿] Nét phẩy kéo xiên xuống trái (撇画 piěhuà: nét phẩy).                                                                                                        |
|   乃    |   nǎi    |   Nãi    | `𠄎` + `丿`            | [Tra bộ 丿] Cổ tự vẽ hơi thở vươn lên hoặc dây kéo dài → bèn, chính là, mới (乃至 nǎizhì: cho đến tận, 乃至于 nǎizhìyú: đến mức).                                        |
|   久    |   jiǔ    |   Cửu    | `𠂊` + `㇏`            | [Tra bộ 丿] Hình người bước chậm hoặc có vật níu chân phía sau → lâu, dài lâu (长久 chángjiǔ: lâu dài, 很久 hěnjiǔ: rất lâu, 好久不见 hǎojiǔ bújiàn: lâu rồi không gặp). |
|   么    | me / yāo | Ma / Yêu | `丿` + `厶`            | [Tra bộ 丿] Hậu tố/tiếp vĩ ngữ dùng nhiều trong đại từ và trợ từ (`me`: 什么 shénme cái gì, 怎么 zěnme thế nào); đọc `yāo` chỉ số "một" khi đọc số điện thoại/mã số.     |
|   之    |   zhī    |   Chi    | `丶` + `㇇` + `㇏`     | [Tra bộ 丿 (Khang Hy) / 丶 (Tân Hoa)] Cổ tự vẽ bước chân tiến lên từ vạch đất → đi tới, của, ấy (之前 zhīqián: trước đây, 之后 zhīhòu: sau này, 百分之十: 10%).          |

### Nhóm B: Chữ thông dụng xếp bộ `丿` chuẩn Khang Hy & Tân Hoa

| Chữ Hán |    Pinyin     |  Hán Việt  | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                        |
| :-----: | :-----------: | :--------: | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   乍    |      zhà      |     Sạ     | `丿` + `一` + `丨` + `二` | [Tra bộ 丿] Cổ tự chỉ việc may vá dừng lại đột ngột → chợt, thoạt đầu, mới mẻ (初来乍到 chūlái-zhàdào: mới chân ướt chân ráo đến, 乍一看 zhà yī kàn: thoạt nhìn).     |
|   乎    |      hū       |     Hồ     | `丿` + `丷` + `一` + `亅` | [Tra bộ 丿] Hình làn hơi thở lan tỏa lên trên → trợ từ nghi vấn/cảm thán cổ, dường như, để tâm (似乎 sìhū: dường như, 几乎 jīhū: hầu như, 在乎 zàihu: để tâm).        |
|   乏    |      fá       |    Phạp    | `丿` + `之`               | [Tra bộ 丿] Chữ `正` đảo ngược trong cổ tự (bước chân lệch không tới đích) → thiếu thốn, mệt mỏi (缺乏 quēfá: thiếu thốn, 疲乏 pífá: mệt mỏi, 乏味 fáwèi: tẻ nhạt).   |
|   乘    | chéng / shèng | Thừa/Thặng | `禾` đan lồng `北`        | [Tra bộ 丿] Hình người trèo lên trên cây (`禾`/`木`) → cưỡi, đi (xe/tàu), nhân (toán học), lợi dụng thời cơ (`chéng`: 乘坐 chéngzuò ngồi xe, 乘法 chéngfǎ phép nhân). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `乂` (`yì` · Ngãi — cắt cỏ, trị vì; chữ ít gặp tra bộ `丿`, là thành phần hình trong `义`, `凶`, `区`).
- `乖` (`guāi` · Quai — ngoan ngoãn, trái ngược; tra bộ `丿`, như `乖巧`).
- `乒 / 乓` (`pīng / pāng` · Binh / Bảng — tượng thanh bóng bàn; đều tra bộ `丿`, như `乒乓球`).
- `乐 / 樂` (`lè / yuè` · Lạc / Nhạc — vui vẻ, âm nhạc; giản thể `乐` xếp bộ `丿` ở Tân Hoa, phồn thể `樂` tra bộ `木`).
- `千` (`qiān` · Thiên · `丿 + 十` — một nghìn; tra bộ `十` #24).
- `年` (`nián` · Niên — năm; bắt đầu bằng `𠂉`, tra bộ `干` #51).
- `重` (`zhòng / chóng` · Trọng / Trùng — nặng, lặp lại; bắt đầu bằng nét phẩy `丿` nhưng tra bộ `里` #166).
- `白` (`bái` · Bạch — màu trắng; có nét phẩy trên đỉnh nhưng là bộ thủ riêng #106).

---

## Bộ 73: 乙 (Ất)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-093` · `radical_index`: `93` · Khang Hy **#5** · `strokes`: `1` nét · `name_vi`: `bộ Ất` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `乙` — dạng chính (1 nét gập cong móc: `㇈`).
  - `乚` — biến thể sổ cong móc (xuất hiện ở đáy hoặc bên phải chữ như `乱`, `乳`, `礼`, `扎`).
  - `乛` — biến thể nét ngang móc đặt ở đỉnh chữ (dùng trong bảng bộ thủ Tân Hoa để xếp các chữ giản thể như `习`, `书`, `买`, `乡`, `飞`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình mầm cây uốn cong trồi lên khỏi mặt đất (hoặc hình xương cá uốn lượn); đồng thời được dùng làm tên Thiên Can thứ hai (**Ất**).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chữ `乙` chỉ Thiên Can thứ 2 ("Ất"), dùng đánh dấu thứ hạng B trong phân loại Giáp–Ất (`甲乙丙`, `乙方`); về mặt cấu chữ hiện đại chủ yếu là bộ nét cong/gập dùng để tra cứu nhiều chữ ít nét và chữ giản thể.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `乙` / `乚` / `乛` thường là nét cong hoặc ký hiệu phân loại (Thiên Can Ất), hầu như không giúp đoán nghĩa trực tiếp các chữ hiện đại chứa nó.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`乙` vs `乚` vs `乛`:** `乙` viết đủ 3 nhịp uốn (ngang–phẩy chéo–cong móc) trong 1 nét liền; `乚` là nét **sổ cong móc** (đặt ở đáy/phải chữ như `乱`, `乳`, `礼`); `乛` là nét **ngang móc nhỏ** trên đỉnh chữ (`习`, `书`, `买`, `了`). Không phải chữ nào có `乚` hoặc `乛` cũng mang nghĩa "Thiên Can Ất" — chúng chỉ là biến thể nét để gom tra từ điển.
    - **`乙` vs `几` vs `九`:** `乙` viết liền **1 nét**; `几` (bộ Kỷ #16) có **2 nét** (`丿 + ㇈`); `九` (số 9, tra bộ `乙`) cũng có **2 nét** (`丿 + ㇈` cắt ngang qua nhau).
    - **`乙` vs `已 / 己`:** `己`, `已` là bộ Kỷ (#49, 3 nét), hoàn toàn khác `乙` (1 nét).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Thiên Can, số đếm & hư từ cổ thuần bộ `乙`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                      |
| :-----: | :----: | :------: | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
|   乙    |   yǐ   |    Ất    | Độc thể (Bộ thủ chính) | [Tra bộ 乙] Thiên Can thứ 2 (sau Giáp); dùng đánh dấu bên B/hạng hai (甲乙丙 jiǎ yǐ bǐng: hạng A, B, C; 乙方 yǐfāng: bên B).                        |
|   九    |  jiǔ   |   Cửu    | `丿` + `乙` (2 nét)    | [Tra bộ 乙] Cổ tự vẽ cánh tay cong uốn, mượn âm ghi số chín (9) (九月 jiǔyuè: tháng Chín, 九牛一毛 jiǔniú-yīmáo: chín trâu một sợi lông / rất nhỏ). |
|   乞    |   qǐ   |   Khất   | `𠂉` + `乙`            | [Tra bộ 乙] Hình người khom hoặc mây tụ cầu xin → xin, cầu xin, ăn xin (乞求 qǐqiú: cầu xin, 乞丐 qǐgài: người ăn xin).                             |
|   也    |   yě   |    Dã    | `乛` + `丨` + `乚`     | [Tra bộ 乙] Cổ tự vẽ cái gáo múc nước/rắn, sau mượn làm hư từ → cũng, vậy (也是 yěshì: cũng là, 也许 yěxǔ: có lẽ, 也好 yěhǎo: cũng được).           |

### Nhóm B: Trạng thái, sự vật & biến thể `乚` thuộc bộ `乙` truyền thống

| Chữ Hán |   Pinyin   | Hán Việt  | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                          |
| :-----: | :--------: | :-------: | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   乱    |    luàn    |   Loạn    | `舌` + `乚` (phồn `亂`)   | [Tra bộ 乙] Phồn thể vẽ hai tay gỡ tơ rối (`乚` tượng trưng sợi tơ rối còn sót) → hỗn loạn, lộn xộn, bừa bãi (混乱 hùnluàn: hỗn loạn, 乱七八糟 luànqī-bāzāo: rối tung). |
|   乳    |     rǔ     |    Nhũ    | `孚` + `乚`               | [Tra bộ 乙] Mẹ (`爪/子` trong `孚`) ôm giữ con cho bú (cổ tự `乙` là hình chim én/người mẹ cúi ôm) → sữa, vú, cho bú (牛乳 niúrǔ: sữa bò, 哺乳 bǔrǔ: cho con bú).       |
|   乾    | qián / gān | Càn / Can | `十` + `日` + `十` + `乞` | [Tra bộ 乙 (Khang Hy & Phồn thể)] Khí dương bốc lên (hào trời/quẻ Càn `qián`: 乾坤 qiánkūn càn khôn); đọc `gān` nghĩa khô ráo (giản thể gộp nghĩa "khô" sang chữ `干`). |

### Nhóm C: Chữ giản thể thông dụng xếp bộ `乙 / 乛` trong Tân Hoa tự điển

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                           |
| :-----: | :----: | :------: | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   习    |   xí   |   Tập    | `乛` + `丶` + `㇀` (giản của `習`)    | [Tra bộ 乙/乛 (Tân Hoa giản thể) / 羽 (phồn thể `習`)] Chim non tập vỗ cánh bay → học tập, ôn luyện, thói quen (学习 xuéxí: học tập, 习惯 xíguàn: thói quen).            |
|   书    |  shū   |   Thư    | `乛` + `㇉` + `丨` + `丶` (giản `書`) | [Tra bộ 乙/乛 (Tân Hoa giản thể) / 曰 (phồn thể `書`)] Rút gọn theo lối thảo thư → sách, viết lách, thư từ (书本 shūběn: sách vở, 读书 dúshū: đọc sách).                 |
|   买    |  mǎi   |   Mãi    | `乛` + `头` (giản của `買`)           | [Tra bộ 乙/乛 (Tân Hoa giản thể) / 貝 (phồn thể `買`)] Lưới + vỏ sò (tiền) lược giản thành `乛 + 头` → mua (买东西 mǎi dōngxi: mua đồ, 买卖 mǎimài: buôn bán).           |
|   乡    | xiāng  |  Hương   | `𠃋` + `𠃋` + `丿` (giản của `鄉`)    | [Tra bộ 乙/乛 (Tân Hoa giản thể) / 邑 (phồn thể `鄉`)] Giản hóa từ hình hai người ngồi đối diện ăn uống ở làng quê → quê hương, nông thôn (故乡 gùxiāng, 乡村 xiāngcūn). |
|   飞    |  fēi   |   Phi    | `㇈` + `丿` + `丶` (giản của `飛`)    | [Tra bộ 乙/乛 (Tân Hoa giản thể) / 飛 (bộ Phi phồn thể)] Giữ dáng cánh chim đang sải bay → bay, nhanh (飞机 fēijī: máy bay, 起飞 qǐfēi: cất cánh).                       |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `了` (`le / liǎo` · Liễu — xong, rồi; có nét gập `乛` ở trên nhưng tra bộ `亅` #6).
- `孔` (`kǒng` · Khổng · `子 + 乚` — lỗ hổng, họ Khổng; tra bộ `子` #39).
- `扎` (`zhā / zā / zhá` · Trát · `扌 + 乚` — châm, buộc, vùng vẫy; tra bộ `手/扌` #64).
- `礼 / 禮` (`lǐ` · Lễ · `礻 + 乚` — lễ nghĩa, quà tặng; tra bộ `示/礻` #113).
- `艺 / 藝` (`yì` · Nghệ · `艹 + 乙` — nghệ thuật, kỹ năng; tra bộ `艸/艹` #140).
- `司` (`sī` · Tư — quản lý, công ty; có nét `𠃌` ngoài nhưng tra bộ `口` #30).
- `民` (`mín` · Dân — nhân dân; có nét sổ cong móc nhưng tra bộ `氏` #83).
- `已 / 己 / 巴` (`yǐ / jǐ / bā` — đều có nét `乚` ở đáy nhưng thuộc bộ `己` #49).
- `几` (`jī / jǐ` · Kỷ — bàn nhỏ / mấy; là bộ thủ riêng #16).

---

## Bộ 74: 亅 (Quyết)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-094` · `radical_index`: `94` · Khang Hy **#6** · `strokes`: `1` nét · `name_vi`: `bộ Quyết / Sổ móc` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `亅` — dạng chính (1 nét sổ thẳng có móc nhọn hất lên về bên trái ở đáy).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Nét sổ có móc ngược (như cái móc/ngạnh câu quay lên).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bộ **nét cơ bản** dùng để phân loại và tra cứu một số chữ đơn/cổ tự trong từ điển (`了`, `予`, `事`); không có trường nghĩa biểu ý trong tiếng Trung hiện đại.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `亅` là nét sổ móc dùng để nhận diện nét viết và tra từ điển các chữ ít nét; không dùng để suy đoán nghĩa của chữ hiện đại.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`亅` (Quyết) vs `了` (Liễu):** `亅` (1 nét) là nét sổ móc; `了` (2 nét, tra bộ `亅`) mới là chữ thông dụng nghĩa "xong, rồi".
    - **`亅` vs `丨` (Cổn):** `丨` sổ thẳng trơn; `亅` có móc ở đáy.
    - **`亅` vs `丁` (Đinh):** Chữ `丁` (`dīng`) gồm nét ngang `一` + nét sổ móc `亅`, nhưng trong hệ Khang Hy và Tân Hoa được xếp vào bộ `一` (#1), không xếp vào bộ `亅`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Nét sổ móc & chữ đơn ít nét thuộc bộ `亅`

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                            |
| :-----: | :-------: | :------: | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   亅    |    jué    |  Quyết   | Độc thể (Bộ thủ chính) | [Tra bộ 亅] Nét sổ có móc nhọn hất sang trái ở đáy (竖钩 shùgōu: nét sổ móc).                                                                                             |
|   了    | le / liǎo |   Liễu   | `乛` + `亅`            | [Tra bộ 亅] Cổ tự vẽ đứa trẻ quấn tã không lộ tay → kết thúc, xong xuôi (`liǎo`: 了解 liǎojiě hiểu rõ, 了不起 liǎobuqǐ phi thường); trợ từ hoàn thành (`le`: 好了, 来了). |

### Nhóm B: Hành động, trao tặng & sự việc xếp bộ `亅` chuẩn Khang Hy

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                              |
| :-----: | :----: | :------: | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   予    |   yǔ   |    Dữ    | `乛` + `丶` + `乛` + `亅`              | [Tra bộ 亅] Cổ tự vẽ hình hai bàn tay trao đồ vật cho nhau (đan nối ở nét giữa) → trao cho, ban tặng (给予 jǐyǔ: trao cho, 授予 shòuyǔ: phong tặng, 予以 yǔyǐ: tiến hành).  |
|   事    |  shì   |    Sự    | `一` + `口` + `彐` + `亅` (tay cầm cờ) | [Tra bộ 亅] Cổ tự vẽ bàn tay (`又/彐`) cầm ống/cờ hiệu làm công vụ → sự việc, công việc, chuyện (事情 shìqing: sự việc, 故事 gùshi: câu chuyện, 同事 tóngshì: đồng nghiệp). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `丁` (`dīng` · Đinh · `一 + 亅` — cái đinh, người đàn ông; tra bộ `一` #1, là thanh phù trong `打`, `灯`, `订`, `顶`).
- `于` (`yú` · Vu · `二 + 亅` — ở, tại, đối với; tra bộ `二` #7).
- `才` (`cái` · Tài — tài năng, mới; chứa nét sổ móc `亅` nhưng tra bộ `手` #64).
- `寸` (`cùn` · Thốn — tấc; có nét `亅` nhưng là bộ thủ riêng #41).
- `手 / 承` (`shǒu / chéng` — có nét `亅` ở trục giữa nhưng tra bộ `手` #64).
- `争 / 爭` (`zhēng` · Tranh — giành giật, tranh luận; giản thể có `亅` ở trục giữa nhưng tra bộ `刀/⺈` #18, phồn thể tra `爪` #87).
- `子 / 小 / 水` (`zǐ / xiǎo / shuǐ` — đều viết có nét sổ móc `亅` ở giữa nhưng là các bộ thủ độc lập riêng).

---

## Bộ 75: 亠 (Đầu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-096` · `radical_index`: `96` · Khang Hy **#8** · `strokes`: `2` nét · `name_vi`: `bộ Đầu / Đầu văn` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `亠` — dạng chính (2 nét: `丶 一`, luôn nằm ở đỉnh cao nhất của chữ).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Phần nắp, chóp đỉnh hoặc đầu người/nóc nhà trong cổ tự (trong nhiều chữ như `京`, `亭`, `享`, `交`, dạng `亠` xuất hiện do Lệ biến từ hình mái nhọn, đầu người hoặc bệ cao cổ).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chủ yếu là linh kiện đặt trên đỉnh chữ và bộ tra cứu từ điển phổ biến; ít mang nghĩa độc lập, nhưng trong một số chữ gợi "phần đầu, đỉnh cao, mái che trên" (`京`, `亭`, `亮`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `亠` luôn nằm trên đỉnh chữ như một cái "nón/nắp phẳng", nhưng rất thường chỉ là thành phần hình/âm kết quả của Lệ biến chứ không phải bộ biểu nghĩa mạnh.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`亠` (Đầu) vs `冖` (Mịch) vs `宀` (Miên):** `亠` = chấm + ngang (`丶 + 一`, không bẻ góc xuống hai bên); `冖` = phẩy/chấm ngắn bên trái + ngang móc (`冖`, không có chấm trên đỉnh); `宀` = chấm trên đỉnh + bộ Mịch (`丶 + 冖`, mái nhà có vách rủ hai bên).
    - **`亠` vs `二` (Nhị):** `亠` là một dấu chấm đặt trên một nét ngang; `二` là hai nét ngang song song.
    - **`亠` vs `立 / 文 / 方 / 衣 / 言 / 广`:** Các bộ này đều bắt đầu bằng hai nét `丶 + 一` giống `亠`, nhưng đều là bộ thủ độc lập riêng, không tra dưới `亠`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Công trình cao, kinh đô, ánh sáng & hưởng thụ

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                             |
| :-----: | :----: | :------: | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   京    |  jīng  |   Kinh   | `亠` + `口` + `小`      | [Tra bộ 亠] Tượng hình lầu cao dựng trên gò đất cao (mái nhọn biến thành `亠`) → kinh đô, thủ đô (北京 Běijīng: Bắc Kinh, 南京 Nánjīng: Nam Kinh, 京剧 jīngjù: kinh kịch). |
|   亭    |  tíng  |   Đình   | `亠` + `口` + `冖 + 丁` | [Tra bộ 亠] Tượng hình lầu đình có mái cao và cột trụ bên dưới → cái đình, trạm nghỉ, ki-ốt (凉亭 liángtíng: đình hóng mát, 报亭 bàotíng: sạp báo).                        |
|   亮    | liàng  |  Lượng   | `亠` + `口` + `冖 + 几` | [Tra bộ 亠] Hình người ở nơi cao sáng (`高` lược + `儿`) → sáng sủa, rạng rỡ, vang dội (月亮 yuèliang: mặt trăng, 漂亮 piàoliang: xinh đẹp, 响亮 xiǎngliàng: vang dội).    |
|   享    | xiǎng  |  Hưởng   | `亠` + `口` + `子`      | [Tra bộ 亠] Cổ tự vẽ ngôi đền cao dâng tế lễ vật → dâng lên, hưởng thụ, chia sẻ (享受 xiǎngshòu: hưởng thụ, 分享 fēnxiǎng: chia sẻ, 享有 xiǎngyǒu: được hưởng).            |

### Nhóm B: Giao kết, biến cố & từ cổ xếp bộ `亠` chuẩn Khang Hy

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                              |
| :-----: | :----: | :------: | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   亡    |  wáng  |   Vong   | `亠` + `∟`                              | [Tra bộ 亠] Cổ tự là hình người trốn khuất vào góc tường/lưỡi dao → bỏ trốn, mất, chết (死亡 sǐwáng: tử vong, 逃亡 táowáng: chạy trốn, 亡羊补牢: mất bò mới lo làm chuồng). |
|   亢    |  kàng  |  Kháng   | `亠` + `几`                             | [Tra bộ 亠] Cổ tự vẽ cổ họng và đầu người vươn thẳng lên → cao ngạo, quá mức, cực độ (高亢 gāokàng: cao vút, 不卑不亢: không tự ti cũng chẳng kiêu ngạo).                   |
|   交    |  jiāo  |   Giao   | `亠` + `父`                             | [Tra bộ 亠] Hình người (`亠 + 八`) đứng bắt chéo hai chân → giao nhau, trao đổi, kết bạn (交通 jiāotōng: giao thông, 交换 jiāohuàn: trao đổi, 社交 shèjiāo: giao tiếp).     |
|   亦    |   yì   |   Diệc   | `亠` + phần thân chữ `大` chấm hai nách | [Tra bộ 亠] Cổ tự là hình người đánh dấu hai bên nách (chữ gốc của `腋` nách), mượn làm hư từ → cũng (亦然 yìrán: cũng vậy, 人云亦云: nói theo người khác).                 |
|   亥    |  hài   |   Hợi    | `亠` + nét gập kép                      | [Tra bộ 亠] Địa chi thứ 12 (chi Hợi, giờ 21h–23h đêm); phần chữ trong `孩`, `刻`, `核`, `该` (亥时 hàishí: giờ Hợi, 辛亥 Xīnhài: Tân Hợi).                                  |

### Nhóm C: Chữ giản thể thông dụng xếp bộ `亠` trong Tân Hoa tự điển

| Chữ Hán |   Pinyin   |   Hán Việt   | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| :-----: | :--------: | :----------: | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   产    |    chǎn    |     Sản      | `亠` + `丷` + `厂` (giản `產`)      | [Tra bộ 亠 (Tân Hoa giản thể) / 生 (phồn thể `產`)] Sinh đẻ, sản xuất, tài sản (生产 shēngchǎn: sản xuất, 产品 chǎnpǐn: sản phẩm, 产业 chǎnyè: ngành nghề).          |
|   亲    | qīn / qìng | Thân / Thính | `亠` + `丷` + `一 + 木` (giản `親`) | [Tra bộ 亠 (Tân Hoa giản thể) / 見 (phồn thể `親`)] Lược mất phần `見` bên phải → cha mẹ, thân thiết, tự tay (亲人 qīnrén: người thân, 亲自 qīnzì: đích thân).       |
|   亩    |     mǔ     |     Mẫu      | `亠` + `田` (giản của `畝`)         | [Tra bộ 亠 (Tân Hoa giản thể) / 田 (phồn thể `畝`)] Lược phần `久` bên phải → đơn vị đo diện tích ruộng đất (~666,7 m²) (一亩地 yī mǔ dì: một mẫu đất, 田亩 tiánmǔ). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `六` (`liù` · Lục — số sáu; Khang Hy xếp bộ `八` #12, một số bảng Tân Hoa xếp bộ `亠`).
- `市` (`shì` · Thị — chợ, thành phố; có `亠` trên đầu nhưng tra bộ `巾` #50).
- `高` (`gāo` · Cao — cao; bắt đầu bằng `亠` nhưng là bộ thủ riêng #189).
- `夜` (`yè` · Dạ — đêm tối; có `亠` ở đỉnh nhưng tra bộ `夕` #36).
- `卒` (`zú` · Tốt — binh lính, kết thúc; có `亠` ở đỉnh nhưng tra bộ `十` #24).
- `主` (`zhǔ` · Chủ — chủ nhân; tra bộ `丶` #3).
- `充` (`chōng` · Sung — đầy đủ; có `亠` ở đỉnh nhưng tra bộ `儿` #10).
- `玄 / 文 / 方 / 立 / 衣` — đều mở đầu bằng hai nét `丶 + 一` nhưng là các bộ thủ độc lập riêng (`玄` #95, `文` #67, `方` #70, `立` #117, `衣` #145).

---

## Bộ 76: 儿 (Nhi)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-101` · `radical_index`: `101` · Khang Hy **#10** · `strokes`: `2` nét · `name_vi`: `bộ Nhân đi / Nhi` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `儿` — dạng chính (2 nét: `丿 乚`, thường đứng ở phần đáy của chữ ghép; trong chữ giản thể hiện đại còn thay thế cho chữ `兒`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hình dáng con người với hai chân bước đi (trong văn tự cổ là biến thể của chữ `人` khi đặt ở phía dưới thân chữ).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Gợi hình người hoặc đôi chân người ở đáy chữ (`兄`, `先`, `充`); chữ độc lập `儿` (giản hóa từ `兒`) mang nghĩa con trẻ, con trai, hoặc đọc nhẹ làm âm uốn lưỡi _erhua_ (`-r`) trong tiếng Bắc Kinh.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `儿` thường đứng dưới đáy chữ, gợi người/bước chân (`兄`, `先`) hoặc làm khung chân chữ cho nhóm chữ tra bộ `儿` (`元`, `光`, `免`, `兔`); nghĩa hiện đại của từng chữ cần xét riêng.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`儿` vs `人 / 亻`:** Cùng có gốc vẽ con người, nhưng `人 / 亻` (Khang Hy #9) đứng độc lập hoặc bên trái/trên; `儿` (Khang Hy #10) đứng ở **đáy chữ** như hai chân người.
    - **`儿` vs `子`:** `子` (bộ Tử #39, 3 nét) vẽ em bé quấn tã; `儿` (2 nét) vẽ chân người, chỉ mang nghĩa "con/trẻ em" khi đứng làm chữ thay thế `兒` (`儿子`).
    - **`儿` vs `几`:** `儿` có hai nét `丿` và `乚` tách rời phía trên; `几` (bộ Kỷ #16) có hai nét nối chạm nhau ở đỉnh trên.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Con người, thứ bậc, tiến bước & chấp thuận

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                         |
| :-----: | :----: | :------: | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   儿    | ér / r |   Nhi    | Độc thể (giản thể của `兒`)      | [Tra bộ 儿] Phồn thể `兒` là em bé chưa liền thóp đặt trên người (`儿`) → con trai, trẻ em (`儿子` érzi, `儿童` értóng); hậu tố uốn lưỡi `-r` (`这儿` zhèr, `一点儿`). |
|   兄    | xiōng  |  Huynh   | `口` (trên) + `儿` (người, dưới) | [Tra bộ 儿] Người (`儿`) cất tiếng (`口`) dạy bảo đàn em (hoặc người đứng đầu tế tự) → anh trai (兄弟 xiōngdì: anh em, 表兄 biǎoxiōng: anh họ).                        |
|   先    |  xiān  |   Tiên   | `之/牛` biến dạng + `儿`         | [Tra bộ 儿] Cổ tự vẽ bàn chân (`止`) đặt phía trên đầu người (`儿`) bước đi trước → trước tiên, người đi trước (首先 shǒuxiān: trước hết, 先生 xiānsheng: tiên sinh).  |
|   允    |  yǔn   |   Doãn   | `厶` + `儿`                      | [Tra bộ 儿] Cổ tự vẽ người gật đầu quay lại đồng thuận → cho phép, bằng lòng, công bằng (允许 yǔnxǔ: cho phép, 应允 yīngyǔn: nhận lời).                                |

### Nhóm B: Khởi đầu, ánh sáng, đầy đủ & điềm báo

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                      |
| :-----: | :----: | :------: | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   元    |  yuán  |  Nguyên  | `二` + `儿`                 | [Tra bộ 儿] Vạch chỉ phần đầu (`二`) của con người (`儿`) → đầu tiên, nguyên thủy, đơn vị tiền tệ (元旦 Yuándàn: Tết Dương lịch, 公元 gōngyuán: Công nguyên, 美元). |
|   光    | guāng  |  Quang   | `⺌` (lửa `火`) + `一 + 儿` | [Tra bộ 儿] Cổ tự vẽ ngọn lửa (`火`) cháy sáng trên đầu người (`儿`) → ánh sáng, quang vinh, hết sạch (阳光 yángguāng: ánh nắng, 光明 guāngmíng: sáng lạn).         |
|   充    | chōng  |   Sung   | `亠` + `厶` + `儿`          | [Tra bộ 儿] Đứa trẻ (`育` ngược) lớn lên đầy đặn → đầy đủ, nạp thêm, đảm nhiệm (充分 chōngfèn: đầy đủ, 充满 chōngmǎn: tràn ngập, 充电 chōngdiàn: sạc pin).          |
|   兆    |  zhào  |  Triệu   | Hai vạch rẽ + `儿`          | [Tra bộ 儿] Hình vết nứt mai rùa báo điềm khi bói → điềm báo, dấu hiệu, hàng triệu (兆头 zhàotou: điềm báo, 预兆 yùzhào: dự báo, 征兆 zhēngzhào: triệu chứng).      |

### Nhóm C: Năng lực, trao đổi, động vật & đồ vật xếp bộ `儿`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                     |
| :-----: | :----: | :------: | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   克    |   kè   |   Khắc   | `十` + `口` + `儿`      | [Tra bộ 儿] Cổ tự vẽ người đội vật nặng/áo giáp trên vai → gánh vác, thắng lợi, khắc phục, gram (克服 kèfú: khắc phục, 千克 qiānkè: kilôgam, 攻克 gōngkè: phá vỡ). |
|   兑    |  duì   |   Đoái   | `丷` + `口` + `儿`      | [Tra bộ 儿] Người cất lời vui vẻ/trao đổi → đổi tiền, pha chế (兑换 duìhuàn: quy đổi, 兑现 duìxiàn: thực hiện lời hứa/đổi tiền mặt).                               |
|   免    |  miǎn  |   Miễn   | Đầu mũ + `口` + `儿`    | [Tra bộ 儿] Hình người tháo bỏ mũ hoặc con thỏ trốn thoát → miễn trừ, tránh khỏi (免费 miǎnfèi: miễn phí, 避免 bìmiǎn: tránh, 难免 nánmiǎn: khó tránh).            |
|   兔    |   tù   |   Thỏ    | `免` + `丶` (đuôi ngắn) | [Tra bộ 儿] Tượng hình con thỏ tai dài, thân ngồi co hai chân sau (`儿`) và đuôi chấm ngắn (`丶`) → con thỏ (兔子 tùzi: con thỏ, 白兔 báitù: thỏ trắng).           |
|   兜    |  dōu   |   Đâu    | `白` kẹp + `儿`         | [Tra bộ 儿] Hình cái mũ/túi bọc bên ngoài → túi áo, bọc lấy, đi vòng quanh (衣兜 yīdōu: túi áo, 兜风 dōufēng: hóng gió).                                           |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `见 / 見` (`jiàn` · Kiến — nhìn thấy; có chân `儿` ở phồn thể `見` nhưng là bộ thủ riêng #147).
- `亮` (`liàng` · Lượng — sáng sủa; có phần đáy giống `儿` nhưng tra bộ `亠` #8).
- `洗 / 说 / 税` (`xǐ / shuō / shuì` — đều mang thanh phù `先` hoặc `兑` có đáy `儿` nhưng tra bộ `氵`, `讠`, `禾`).
- `党 / 黨` (`dǎng` · Đảng — đảng phái; giản thể `党` có đáy `儿`, Tân Hoa thường tra bộ `小/⺌` hoặc `儿`, phồn thể `黨` tra bộ `黑`).
- `竞 / 競` (`jìng` · Cạnh — thi đua; có đáy `兄` chứa `儿` nhưng tra bộ `立` #117).
- `子` (`zǐ` · Tử — con cái; bộ thủ riêng #39, thường dễ nhầm trường nghĩa với `儿`).
- `几` (`jī / jǐ` · Kỷ — bàn nhỏ / mấy; bộ thủ riêng #16).

---

## Bộ 77: 入 (Nhập)

> **[CHƯA CÓ TRONG DB - Đề xuất bổ sung]** — Hiện bảng `public.hanzihome_radicals` chưa có bản ghi cho bộ `入` (`status: "MISSING"`). Dưới đây là toàn bộ thông số và dữ liệu đề xuất chuẩn hóa theo đúng schema DB.

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`) — Đề xuất bổ sung

- **DB ID & Thứ tự:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]` · Khang Hy **#11** · `strokes`: `2` nét · `name_vi` (Đề xuất): `bộ Nhập` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants` — Đề xuất):**
  - `入` — dạng chính (2 nét: `丿 ㇏`, phẩy ngắn bên trái, mác dài trùm qua đỉnh bên phải).
  - _(Lưu ý hình thể hiện đại)_: Trong chữ ghép khải thư hiện đại, phần đầu của chữ `全` viết giống `人` (Khang Hy xếp bộ `入`, Tân Hoa chuyển sang bộ `人`); chữ `内` chứa `入` biến dạng bên trong (Khang Hy xếp bộ `入`, Tân Hoa xếp bộ `冂`).
- **Ý nghĩa cốt lõi (`core_meaning` — Đề xuất):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình đầu mũi tên nhọn hoặc rễ cây cắm sâu vào lòng đất/vật thể, biểu thị hành động "đi vào, chui vào".
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Vào, bước vào, gia nhập, thu vào, hợp nhau; tạo cặp đối nghĩa trực tiếp với `出` (ra) (`出入`, `输入/输出`, `收入`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — Đề xuất):**
  - _Nhận diện (`recognition`):_ Có `入` thường liên quan đến hướng đi vào bên trong, tiếp nhận, thu nhập hoặc trạng thái hòa nhập/toàn vẹn (`入`, `内`, `全`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`人` (Nhân) vs `入` (Nhập) vs `八` (Bát):** Ba chữ 2 nét cực dễ nhầm trong cả đọc lẫn viết:
      - **`人` (Nhân = người):** Nét phẩy `丿` ở bên trái kéo cao hơn làm đỉnh; nét mác `㇏` tựa vào thân nét phẩy ở khoảng giữa.
      - **`入` (Nhập = vào):** Nét mác `㇏` bên phải cao hơn hẳn và **trùm lên đỉnh** nét phẩy `丿` bên trái (mẹo nhớ: cúi đầu _bước vào_ cửa).
      - **`八` (Bát = tám / tách):** Hai nét tách rời nhau hoàn toàn ở phía trên, không chạm đỉnh.
    - **Lưu ý tra từ điển:** Số chữ thuần bộ `入` rất ít; nhiều chữ vốn xếp ở bộ `入` trong Khang Hy (`全`, `两/兩`, `内`, `俞`) khi tra từ điển giản thể Tân Hoa hiện đại được phân sang `人`, `一` hoặc `冂`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups` — Đề xuất)

### Nhóm A: Đi vào, thu nhập & không gian bên trong

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                        |
| :-----: | :----: | :------: | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   入    |   rù   |   Nhập   | Độc thể (Bộ thủ chính)  | [Tra bộ 入] Vào, bước vào, gia nhập, thu vào (进入 jìnrù: tiến vào, 输入 shūrù: nhập vào, 收入 shōurù: thu nhập).                                                                     |
|   内    |  nèi   |   Nội    | `冂` + `入` (phồn `內`) | [Tra bộ 入 (Khang Hy) / 冂 (Tân Hoa)] Vật đi vào (`入`) bên trong gian nhà/vùng kín (`冂`) → bên trong, nội bộ (内部 nèibù: nội bộ, 内容 nèiróng: nội dung, 国内 guónèi: trong nước). |

### Nhóm B: Toàn vẹn, đôi cặp & chữ xếp bộ `入` theo Khang Hy

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                          |
| :-----: | :----: | :------: | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   全    |  quán  |   Toàn   | `入/人` + `王`                    | [Tra bộ 入 (Khang Hy) / 人 (Tân Hoa)] Ngọc thuần khiết trọn vẹn (`入 + 玉/王`) → toàn bộ, đầy đủ, hoàn toàn (全部 quánbù: toàn bộ, 安全 ānquán: an toàn, 完全 wánquán). |
|   两    | liǎng  |  Lưỡng   | `一` + `冂` + 2`入/人` (`兩`)     | [Tra bộ 入 (Khang Hy phồn `兩`) / 一 (Tân Hoa giản `两`)] Hình hai vật sóng đôi cân bằng → hai, đôi, lạng (两个 liǎng gè: hai cái, 两边 liǎngbiān: hai bên).            |
|   俞    |   yú   |    Du    | `亼 (入)` + `月` + `刂` (`舟` cổ) | [Tra bộ 入 (Khang Hy) / 人 (Tân Hoa)] Thuyền độc mộc khoét gỗ (`舟` + dụng cụ), nghĩa cổ "đồng ý"; là thành phần âm trong `愉, 偷, 输, 愈` (俞穴 shùxué: huyệt du).     |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components` — Đề xuất)

- `人` (`rén` · Nhân — con người; bộ thủ riêng #9, cực dễ nhầm hình với `入`).
- `八` (`bā` · Bát — số tám; bộ thủ riêng #12, hai nét tách rời đỉnh).
- `闪` (`shǎn` · Thiểm · `门 + 人` — lóe sáng, né tránh; dễ nhầm bộ phận trong với `入` nhưng chứa `人`, tra bộ `門/门` #169).
- `坐` (`zuò` · Tọa · `从 + 土` — ngồi; chứa hai `人`, tra bộ `土` #32).
- `肉` (`ròu` · Nhục — thịt; bên trong giống hai nét `入` hoặc `人` lồng nhau, là bộ thủ riêng #130).
- `囚` (`qiú` · Tù · `囗 + 人` — giam cầm, tù nhân; tra bộ `囗` #31).
- `汆` (`cuān` · Thoan · `入 + 水` — chần nhanh đồ ăn vào nước sôi; mang nghĩa "đưa vào nước", tra bộ `水` #85).
- `纳 / 呐` (`nà` · Nạp / Nột — thu nhận, gào thét; mang `内` gợi âm `nà` và ý "thu vào", tra bộ `糸/纟` và bộ `口`).

---

## Bộ 78: 八 (Bát)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-097` · `radical_index`: `97` · Khang Hy **#12** · `strokes`: `2` nét · `name_vi`: `bộ Bát` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `八` — dạng chính (2 nét: `丿 ㇏`, tách rời nhau, đứng độc lập hoặc nằm ở đỉnh/đáy chữ).
  - `丷` — **bát ngửa / hai chấm tách trên** (2 nét: `丶 丿`, biến thể đứng ở đầu chữ ghép trong chữ hiện đại như `关`, `兰`, `单`, `养`, `兑`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hai nét tách rẽ sang hai bên, gốc nghĩa là **"phân chia, tách mở"** (mở đôi ra hai phía); đồng thời được mượn để ghi số **tám (8)** (con số chẵn chia đôi nhiều lần).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Số tám (`8`); nét nghĩa gốc "phân tách, chia đều, công bằng, chung" còn giữ rõ trong nhiều chữ cốt lõi (`公`, `共`, `兼`, `分`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `八` (hoặc `丷`) có thể gợi số tám, sự phân tách, chia đều/công chung (`公`, `共`, `兼`), nhưng trong nhiều chữ khác (`具`, `典`, `其`, `兴`) chủ yếu là thành phần hình dạng hoặc kết quả giản thể hóa.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`八` vs `人` vs `入`:** `八` có hai nét tách rời hoàn toàn ở đỉnh; `人` (người) có nét phẩy cao hơn tựa vào nét mác; `入` (vào) có nét mác cao hơn trùm lên đầu nét phẩy.
    - **`八` vs `丷`:** `丷` là biến thể đặt trên đỉnh ở nhiều chữ giản thể (`关`, `单`, `兰`), không phải chữ nào có `丷` cũng liên quan số 8.
    - **`八` vs `灬` (Hỏa bốn chấm):** `灬` ở đáy chữ có 4 nét chấm (`热`, `点`), còn `八` ở đáy chỉ có 2 nét rẽ sang hai bên (`共`, `具`, `典`, `只`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Số đếm, công bằng, cùng chung & kiêm nhiệm

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                        |
| :-----: | :----: | :------: | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   八    |   bā   |   Bát    | Độc thể (Bộ thủ chính)     | [Tra bộ 八] Số tám (8), mở rộng chỉ nhiều phương hướng (八月 bāyuè: tháng Tám, 四面八方 sìmiàn-bāfāng: bốn phương tám hướng).                                         |
|   六    |  liù   |   Lục    | `亠` + `八`                | [Tra bộ 八 (Khang Hy) / 亠 (một số bảng Tân Hoa)] Cổ tự vẽ mái lều tranh, mượn âm ghi số sáu (6) (六月 liùyuè: tháng Sáu, 星期六 xīngqīliù: thứ Bảy).                 |
|   公    |  gōng  |   Công   | `八` (chia) + `厶` (riêng) | [Tra bộ 八] Phân chia (`八`) cái riêng (`厶`) ra cho mọi người → công bằng, công cộng, ông/giống đực (公共 gōnggòng: công cộng, 公司 gōngsī: công ty, 公平 gōngpíng). |
|   共    |  gòng  |   Cộng   | `廿` + `八` (hai tay nâng) | [Tra bộ 八] Cổ tự vẽ hai bàn tay cùng nâng một vật → cùng nhau, tổng cộng, chia sẻ (共同 gòngtóng: cùng chung, 一共 yīgòng: tổng cộng, 公共 gōnggòng: công cộng).     |
|   兼    |  jiān  |   Kiêm   | `丷` + `秉` (hai bó lúa)   | [Tra bộ 八] Một tay nắm giữ liền hai bó lúa → kiêm nhiệm, gộp cả hai (兼职 jiānzhí: làm thêm/kiêm nhiệm, 兼顾 jiāngù: lo cả hai mặt).                                 |

### Nhóm B: Binh lính, dụng cụ, chuẩn mực & hư từ cổ xếp bộ `八`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                     |
| :-----: | :----: | :------: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   兵    |  bīng  |   Binh   | `斤` (rìu) + `廾/八` (tay) | [Tra bộ 八] Hai tay (`廾` biến thành `八`) cầm rìu chiến (`斤`) → binh khí, binh lính, chiến tranh (士兵 shìbīng: binh sĩ, 兵器 bīngqì: binh khí, 兵法 bīngfǎ).    |
|   具    |   jù   |    Cụ    | `目` (vạc `鼎`) + `八`     | [Tra bộ 八] Cổ tự vẽ hai tay bưng cái đỉnh lễ → dụng cụ, chuẩn bị sẵn, có đầy đủ (工具 gōngjù: công cụ, 具体 jùtǐ: cụ thể, 家具 jiājù: đồ nội thất).               |
|   典    |  diǎn  |   Điển   | `册` + `廾/八` (tay nâng)  | [Tra bộ 八] Hai tay đặt trang trọng sách thẻ tre (`册`) lên bệ → sách kinh điển, quy chuẩn, nghi lễ (字典 zìdiǎn: từ điển, 经典 jīngdiǎn: kinh điển, 典礼).        |
|   其    |   qí   |    Kỳ    | Cái sàng tre (`箕`) + `八` | [Tra bộ 八] Cổ tự vẽ cái sàng/giỏ tre có hai chân đế (`八`), mượn làm đại từ → cái đó, ấy, kỳ thực (其实 qíshí: kỳ thực, 其他 qítā: khác, 其中 qízhōng: trong đó). |
|   兮    |   xī   |    Hề    | `八` + `丂`                | [Tra bộ 八] Hơi thở ngân nga phân tán ra ngoài → trợ từ ngữ khí cảm thán trong thơ cổ (大风起兮: Gió lớn nổi lên thay!).                                           |

### Nhóm C: Chữ giản thể thông dụng mang đầu `丷` xếp bộ `八` trong Tân Hoa

| Chữ Hán |      Pinyin       |      Hán Việt       | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| :-----: | :---------------: | :-----------------: | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   关    |       guān        |        Quan         | `丷` + `天` (giản của `關`)    | [Tra bộ 八/丷 (Tân Hoa giản thể) / 門 (phồn thể `關`)] Đóng cửa, chốt then, liên quan, cửa ải (关心 guānxīn: quan tâm, 关闭 guānbì: đóng lại, 关系 guānxi: quan hệ). |
|   兴    |    xīng / xìng    |     Hưng / Hứng     | `⺍` + `一 + 八` (giản `興`)   | [Tra bộ 八 (Tân Hoa giản thể) / 臼 (phồn thể `興`)] Giản hóa hình bốn tay cùng nâng → hưng thịnh (`xīng`), vui thích (`xìng`: 高兴 gāoxìng, 兴趣 xìngqù).            |
|   兰    |        lán        |         Lan         | `丷` + `三` (giản của `蘭`)    | [Tra bộ 八/丷 (Tân Hoa giản thể) / 艸 (phồn thể `蘭`)] Lược giữ phần âm/cấu trúc của `蘭` → hoa lan, cây lan (兰花 lánhuā: hoa lan, 玉兰 yùlán: hoa ngọc lan).       |
|   单    | dān / shàn / chán | Đơn / Thiện / Thiền | `丷` + `甲 + 一` (giản `單`)   | [Tra bộ 八/丷 (Tân Hoa giản thể) / 口 (phồn thể `單`)] Đơn lẻ, một mình, tờ giấy đơn, họ Thiện (简单 jiǎndān: đơn giản, 菜单 càidān: thực đơn, 单位 dānwèi: đơn vị). |
|   养    |       yǎng        |        Dưỡng        | `丷` + `羊` lược + `介` (`養`) | [Tra bộ 八/丷 (Tân Hoa giản thể) / 食 (phồn thể `養`)] Nuôi nấng, chăm sóc, dưỡng bệnh (养育 yǎngyù: nuôi nấng, 营养 yíngyǎng: dinh dưỡng, 养成 yǎngchéng).          |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `分` (`fēn / fèn` · Phân / Phận · `八 + 刀` — dùng dao `刀` chia tách `八` → chia, phút, phân biệt; Khang Hy xếp bộ `刀` #18, Tân Hoa xếp bộ `八` #12).
- `半` (`bàn` · Bán · `丷 + 一 + 十` — chia đôi một nửa; tra bộ `十` #24).
- `只` (`zhǐ / zhī` · Chỉ / Chích · `口 + 八` — chỉ là, lượng từ con vật; tra bộ `口` #30).
- `真` (`zhēn` · Chân — chân thật; có hai chân `八` ở đáy nhưng Khang Hy tra bộ `目` #109, Tân Hoa tra `十`).
- `兑` (`duì` · Đoái · `丷 + 口 + 儿` — trao đổi; tra bộ `儿` #10).
- `并` (`bìng` · Tịnh/Tinh — gộp chung, đồng thời; có `丷` ở đầu, Khang Hy tra bộ `干` #51, Tân Hoa tra `丷/八`).
- `人 / 入` (`rén / rù` — hai bộ 2 nét khác dễ nhầm hình với `八`).
- `火 / 灬` (`huǒ` — bộ Hỏa 4 nét, khác `八` chỉ có 2 nét).

---

## Bộ 79: 冂 (Quynh)

> **[CHƯA CÓ TRONG DB - Đề xuất bổ sung]** — Hiện bảng `public.hanzihome_radicals` chưa có bản ghi cho bộ `冂` (`status: "MISSING"`). Dưới đây là toàn bộ thông số và dữ liệu đề xuất chuẩn hóa theo đúng schema DB.

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`) — Đề xuất bổ sung

- **DB ID & Thứ tự:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]` · Khang Hy **#13** · `strokes`: `2` nét · `name_vi` (Đề xuất): `bộ Quynh` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants` — Đề xuất):**
  - `冂` — dạng chính (2 nét: `丨 𠃌`, sổ thẳng bên trái + ngang gập sổ xuống bên phải, đóng vai trò khung bao ba cạnh mở hở phía đáy).
- **Ý nghĩa cốt lõi (`core_meaning` — Đề xuất):**
  - _Nguồn gốc / Lục thư (`history`):_ Vùng đất biên giới xa ngoại thành, ranh giới trống trải bao quanh (chữ gốc của `垌`/`坰`, vùng biên viễn ngoài đồng nội).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Không dùng làm chữ độc lập trong tiếng Trung hiện đại; chủ yếu làm khung bao mở đáy để phân loại tra từ điển cho một nhóm nhỏ chữ (`册`, `冉`, `再`, `内`, `冈`, `冒`, `冕`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — Đề xuất):**
  - _Nhận diện (`recognition`):_ `冂` đóng vai trò phần khung bao bên ngoài (mở ở dưới) cho nhiều chữ quen thuộc (`内`, `再`, `周`, `同`, `肉`), nhưng ít mang nghĩa "biên cương" rõ rệt trong chữ hiện đại mà chủ yếu giúp phân tích kết cấu chữ bao ngoài.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`冂` (Quynh) vs `几` (Kỷ) vs `冖` (Mịch) vs `宀` (Miên):** Bốn bộ 2–3 nét bao phần trên rất dễ nhầm:
      - **`冂` (Quynh, 2 nét):** Nét trái **sổ thẳng đứng `丨`**, nét phải **ngang gập sổ thẳng xuống `𠃌`**, tạo khung chữ U úp ngược ôm trọn phần ruột bên trong (`内`, `再`, `册`, `冈`).
      - **`几` (Kỷ, 2 nét):** Nét trái là **phẩy cong `丿`**, nét phải là **ngang gập cong móc vểnh ra ngoài `㇈`** như chân bàn nhỏ (`凡`, `凭`, `凳`).
      - **`冖` (Mịch, 2 nét):** Chỉ là **nắp che ngang dẹt** đặt trên đỉnh chữ (`丶/丨` ngắn + `乛`), **không có hai vách dọc dài** ôm lấy thân chữ và **không có chấm trên đầu** (`军`, `写`, `冠`).
      - **`宀` (Miên, 3 nét):** Là `冖` có **thêm một chấm `丶` ở chính giữa đỉnh**, biểu thị **mái nhà** (`家`, `安`, `字`, `室`).
    - **`冂` vs `囗` (Vi) vs `凵` (Khảm):** `冂` mở đáy; `凵` mở đỉnh; `囗` đóng kín 4 cạnh.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups` — Đề xuất)

### Nhóm A: Khung bao `冂` thuần túy (sách thẻ tre, tiếp nối & tiến dần)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                   |
| :-----: | :----: | :------: | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   冂    | jiōng  |  Quynh   | Độc thể (Bộ thủ chính)               | [Tra bộ 冂] Vùng đất biên giới xa xôi ngoài đồng nội (cổ tự chỉ ranh giới bao quanh).                                                                                            |
|   冉    |  rǎn   |  Nhiễm   | Khung `冂` + `土` xuyên              | [Tra bộ 冂] Hình bộ râu rậm rủ xuống mềm mại → chầm chậm, dần dần, họ Nhiễm (冉冉升起 rǎnrǎn shēngqǐ: từ từ dâng lên).                                                           |
|   册    |   cè   |   Sách   | Hai khung `冂` xâu nét ngang (`冊`)  | [Tra bộ 冂 (Khang Hy) / 丿 hoặc 冂 (Tân Hoa)] Hình những thẻ tre xếp hàng được xâu dây buộc lại thành tập → quyển sách, sổ sách (手册 shǒucè: sổ tay, 注册 zhùcè: đăng ký).      |
|   再    |  zài   |   Tái    | `一` + `冂` + `土` (giản của cấu cổ) | [Tra bộ 冂 (Khang Hy) / 一 (Tân Hoa)] Hai giỏ/vật cân đối xếp chồng → lại, thêm lần nữa (再见 zàijiàn: tạm biệt, 再次 zàicì: một lần nữa, 一再 yīzài: hết lần này đến lần khác). |

### Nhóm B: Chữ mở rộng & giản thể xếp bộ `冂`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                    |
| :-----: | :----: | :------: | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   内    |  nèi   |   Nội    | `冂` + `入/人` (phồn `內`)  | [Tra bộ 冂 (Tân Hoa) / 入 (Khang Hy)] Bước vào (`入`) trong khung không gian (`冂`) → bên trong, nội bộ (内容 nèiróng: nội dung, 国内 guónèi: trong nước).        |
|   冈    |  gāng  |  Cương   | `冂` + `乂` (giản của `岡`) | [Tra bộ 冂 (Tân Hoa giản thể) / 山 (phồn thể `岡`)] Giản hóa từ hình gò núi có lưới/sườn đồi → gò đồi, sườn núi (山冈 shāngāng: sườn đồi, 景阳冈).                |
|   冒    |  mào   |   Mạo    | `冃` (mũ) + `目` (mắt)      | [Tra bộ 冂 (Khang Hy) / 目 hoặc 冂 (Tân Hoa)] Cổ tự vẽ cái mũ (`冃`) trùm lên trên mắt (`目`) → đội lên, bốc lên, mạo hiểm, cảm mạo (感冒 gǎnmào, 冒险 màoxiǎn).  |
|   冕    |  miǎn  |   Miện   | `冃` + `免`                 | [Tra bộ 冂] Chiếc mũ lễ đội đầu của bậc vua chúa xưa (`冃` mũ + `免` âm `miǎn`) → mũ miện (加冕 jiāmiǎn: đăng quang/đội vương miện, 冠冕堂皇 guānmiǎn-tánghuáng). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components` — Đề xuất)

- `同` (`tóng` · Đồng — cùng nhau; có khung ngoài `冂` nhưng tra bộ `口` #30).
- `周` (`zhōu` · Chu — chu vi, tuần lễ, chu đáo; có khung ngoài `冂` nhưng tra bộ `口` #30).
- `向` (`xiàng` · Hướng — hướng về; có khung `冂` nhưng tra bộ `口` #30).
- `肉 / 月` (`ròu / yuè` — hình khung ngoài giống `冂` nhưng là hai bộ thủ độc lập #130 và #74).
- `用` (`yòng` · Dụng — dùng; có khung ngoài `冂` nhưng là bộ thủ riêng #101).
- `网` (`wǎng` · Võng — lưới; khung ngoài giống `冂` nhưng là bộ thủ riêng #122).
- `刚` (`gāng` · Cương · `冈 + 刂` — cứng rắn, vừa mới; chứa `冈` mang `冂` nhưng tra bộ `刀/刂` #18).
- `门 / 門` (`mén` · Môn — cửa; hai khung cửa khép mở, là bộ thủ riêng #169).

---

## Bộ 80: 冖 (Mịch)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-049` · `radical_index`: `49` · Khang Hy **#14** · `strokes`: `2` nét · `name_vi`: `bộ Mịch / Mịch cái` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `冖` — dạng chính (2 nét: `丶/丨` ngắn bên trái + `乛` ngang móc ngắn bên phải, nằm dẹt phía trên đầu chữ).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tấm khăn, nắp đậy hoặc vật che phủ trùm lên phía trên (_Thuyết Văn Giải Tự_ giải nghĩa là "phúc dã" — che phủ lên).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Che phủ, đậy nắp, trùm lên trên (`冠`, `冥`, `冤`); tuy nhiên trong nhiều chữ giản thể hiện đại (`写`, `军`, `农`), `冖` là dạng rút gọn nét từ phần đầu chữ phồn thể nên đã trừu tượng hóa.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `冖` luôn ở đỉnh chữ như chiếc nắp phẳng không chấm; gợi che phủ/đội lên trong chữ cổ (`冠`, `冤`, `冥`), hoặc làm phần đầu giản hóa; không nên gượng ép mọi chữ có `冖` đều mang nghĩa "che phủ".
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`冖` (Mịch) vs `宀` (Miên):** `冖` (2 nét) **không có dấu chấm trên đỉnh**, chỉ cái nắp/khăn che; `宀` (3 nét) **có 1 dấu chấm trên đỉnh**, là mái nhà (`家`, `安`, `室`).
    - **`冖` vs `亠` (Đầu):** `亠` là chấm + ngang thẳng, không bẻ móc xuống hai bên; `冖` có hai cạnh ngắn rủ xuống như cái nắp đậy.
    - **`冖` vs `冂` (Quynh) vs `几` (Kỷ):** `冖` nằm dẹt trên đỉnh chữ; `冂` là khung chữ U úp ngược cao ôm trọn phần ruột; `几` là bàn kỷ có chân phải vểnh cong móc ra ngoài.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Che phủ, mũ đội, tối tăm & chữ thuần bộ `冖` Khang Hy

| Chữ Hán |   Pinyin    |  Hán Việt   | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                  |
| :-----: | :---------: | :---------: | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   冖    |     mì      |    Mịch     | Độc thể (Bộ thủ chính) | [Tra bộ 冖] Nắp đậy, khăn phủ lên trên (tên gọi quen thuộc trong tiếng Việt là _Mịch cái_ hoặc _đầu Mịch_ để phân biệt với bộ Miên `宀` và bộ Mịch `糸`).       |
|   冗    |    rǒng     |    Nhũng    | `冖` + `几`            | [Tra bộ 冖] Cổ tự vẽ người ngồi nhàn rỗi dưới mái che → nhàn tản, thừa thãi, rườm rà (冗长 rǒngcháng: dài dòng, 冗余 rǒngyú: dư thừa).                          |
|   冠    | guān / guàn | Quan / Quán | `冖` + `元` + `寸`     | [Tra bộ 冖] Lấy tay (`寸`) đội vật che lên đầu (`元` + `冖`) → mũ, mào (`guān`: 皇冠 huángguān vương miện); đứng đầu, vô địch (`guàn`: 冠军 guànjūn quán quân). |
|   冢    |    zhǒng    |    Trủng    | `冖` + `豖`            | [Tra bộ 冖] Đất đắp cao trùm phủ lên (`冖`) như gò đồi → gò mả, ngôi mộ lớn (古冢 gǔzhǒng: mộ cổ, 衣冠冢 yīguānzhǒng: mộ chôn di vật).                          |
|   冤    |    yuān     |     Oan     | `冖` + `兔` (bỏ chấm)  | [Tra bộ 冖] Con thỏ (`兔`) bị úp lồng/lưới (`冖`) nhốt kín không chạy thoát → oan ức, khuất tất, thù oán (冤枉 yuānwang: oan uổng, 冤家 yuānjiā: oan gia).      |
|   冥    |    míng     |    Minh     | `冖` + `日` + `六`     | [Tra bộ 冖] Mặt trời (`日`) bị che khuất (`冖`) vào buổi tối → tối tăm, sâu thẳm, cõi âm, trầm tư (冥想 míngxiǎng: thiền/trầm tư, 冥王星: sao Diêm Vương).      |

### Nhóm B: Chữ giản thể & từ thông dụng xếp bộ `冖` trong Tân Hoa tự điển

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                |
| :-----: | :----: | :------: | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   写    |  xiě   |    Tả    | `冖` + `与` (giản của `寫`) | [Tra bộ 冖 (Tân Hoa giản thể) / 宀 (phồn thể `寫`)] Lược mất phần dưới phức tạp của `寫` → viết, miêu tả (写字 xiězì: viết chữ, 写作 xiězuò: sáng tác, 描写). |
|   军    |  jūn   |   Quân   | `冖` + `车` (giản của `軍`) | [Tra bộ 冖 (Tân Hoa giản thể) / 車 (phồn thể `軍`)] Cổ tự vẽ xe chiến (`車`) xếp thành vòng trại bao quanh (`勹/冖`) → quân đội (军队 jūnduì, 军人 jūnrén).   |
|   农    |  nóng  |   Nông   | `冖` + `𠂢` (giản của `農`) | [Tra bộ 冖 (Tân Hoa giản thể) / 辰 (phồn thể `農`)] Giản hóa từ hình người làm ruộng dưới rừng cây → nông nghiệp, nông dân (农民 nóngmín, 农业 nóngyè, 农村). |
|   幂    |   mì   |   Mịch   | `冖` + `日` + `大` + `巾`   | [Tra bộ 冖 (Tân Hoa) / 巾 (Khang Hy)] Tấm khăn đậy bình rượu thời cổ; toán học hiện đại dùng chỉ lũy thừa (乘幂 chéngmì: phép lũy thừa, 幂次方 mìcìfāng).     |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `罕` (`hǎn` · Hãn — hiếm hoi; phần đầu trong phồn/hiện đại viết như `冖` rút gọn từ lưới `罒`, Khang Hy xếp bộ `网` #122).
- `学 / 觉` (`xué / jué` · Học / Giác — đều có nét đầu `⺍ + 冖` do giản hóa phần phức tạp của phồn thể `學 / 覺`, tra bộ `子` #39 và `見/见` #147).
- `荣 / 营 / 劳` (`róng / yíng / láo` — giản thể có `艹 + 冖` ở giữa thân chữ, nhưng đều tra theo bộ `艸/艹` #140 hoặc `力` #19).
- `常 / 带` (`cháng / dài` — thường xuyên, mang theo; có phần nắp giống `冖` nhưng tra bộ `巾` #50).
- `宀 / 亠` (`mián / tóu` — mái nhà / đầu văn; hai bộ thủ độc lập dễ nhầm hình với `冖`).

---

## Bộ 81: 几 (Kỷ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-103` · `radical_index`: `103` · Khang Hy **#16** · `strokes`: `2` nét · `name_vi`: `bộ Kỷ` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `几` — dạng chính (2 nét: `丿 ㇈`, nét trái phẩy cong, nét phải ngang gập cong móc vểnh lên sang phải).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hình chiếc bàn thấp nhỏ có chân kê thời cổ (ghế kỷ / bàn trà thấp để tựa tay hoặc đặt đồ).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chữ `几` đọc `jī` nghĩa là "bàn nhỏ, gần như" (`茶几`, `几乎`), còn đọc `jǐ` (giản hóa từ `幾`) nghĩa là "mấy, vài" (`几个`, `几天`). Trong cấu tạo chữ cổ gợi bàn ghế nhỏ, chỗ tựa (`凭`, `凳`); trong nhiều chữ giản thể hiện đại (`机`, `肌`, `饥`) đóng vai trò thanh phù thay cho khối phồn thể phức tạp.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `几` có thể gợi bàn nhỏ/chỗ tựa (`凭`, `凳`) trong các chữ gốc, nhưng trong chữ giản thể hiện đại đa số là thành phần thanh phù hoặc hình giản hóa.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`几` (bàn kỷ `jī`) vs `几` (mấy/vài `jǐ`):** Chữ giản thể `几` gộp chữ `幾` (mấy/vài) vào `几` (bàn kỷ); vì thế tuyệt đối không giải nghĩa chữ `机` (máy móc, giản của `機`) là "cây + mấy cái".
    - **`几` vs `风 / 風`:** Chữ `风` (gió) có khung ngoài giống hệt `几`, nhưng là bộ thủ độc lập (`風` #182 được giản hóa phần ruột thành `ㄨ`), không thuộc bộ `几`.
    - **`几` vs `冂` vs `冖` vs `宀`:** `几` có nét phải vểnh cong móc ra ngoài (`㇈`), nét trái là phẩy cong `丿`; `冂` sổ thẳng đóng 3 mặt ôm ruột; `冖` là nắp ngang dẹt; `宀` là mái nhà có chấm đỉnh.
    - **`几` vs `儿`:** `儿` hai nét không chạm nhau ở trên đỉnh; `几` hai nét giao chạm nhau tại góc trên bên trái.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bàn nhỏ, chỗ dựa, số lượng & chữ thuần bộ `几` Khang Hy

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                        |
| :-----: | :-----: | :------: | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   几    | jī / jǐ |    Kỷ    | Độc thể (giản của `幾`)   | [Tra bộ 几] Bàn thấp nhỏ, gần như (`jī`: 茶几 chájī bàn trà, 几乎 jīhū hầu như); mấy, vài (`jǐ`, giản của `幾`: 几个 jǐ gè mấy cái, 几天 jǐ tiān vài ngày).           |
|   凡    |   fán   |   Phàm   | `几` + `丶`               | [Tra bộ 几] Hình bàn/khung đúc khuôn thông dụng → phàm là, tầm thường, trần thế (平凡 píngfán: bình phàm, 凡是 fánshì: phàm là, 非凡 fēifán: phi phàm).               |
|   凭    |  píng   |   Bằng   | `任` (người) + `几` (bàn) | [Tra bộ 几] Người (`任`) tựa vào chiếc bàn nhỏ (`几`) để nghỉ → dựa vào, căn cứ, bằng chứng (凭据 píngjù: bằng chứng, 文凭 wénpíng: bằng cấp, 任凭 rènpíng: mặc cho). |
|   凳    |  dèng   |   Đắng   | `登` + `几`               | [Tra bộ 几] Đồ ngồi giống cái bàn thấp (`几`) + `登` biểu âm `dèng` → cái ghế đẩu (凳子 dèngzi: ghế đẩu, 板凳 bǎndèng: ghế băng dài).                                 |

### Nhóm B: Chim linh, chiến thắng & chữ giản thể xếp bộ `几`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                  |
| :-----: | :----: | :------: | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   凯    |  kǎi   |   Khải   | `岂` + `几` (phồn `凱`)     | [Tra bộ 几] Phồn thể `凱` có phần ghế bàn nghi lễ đặt trống thắng trận → khúc nhạc thắng trận, khải hoàn (凯旋 kǎixuán: khải hoàn, 奏凯 zòukǎi: ca khúc thắng). |
|   凰    | huáng  |  Hoàng   | `几` + `皇`                 | [Tra bộ 几] Chim phượng hoàng mái (chữ `鳳` phồn thể viết lược kết hợp thanh phù `皇`) (凤凰 fènghuáng: phượng hoàng).                                          |
|   凤    |  fèng  |  Phượng  | `几` + `又` (giản của `鳳`) | [Tra bộ 几 (Tân Hoa giản thể) / 鳥 (phồn thể `鳳`)] Thay khung `鳥` bằng chữ `又` trong khung `几` → chim phượng (凤凰 fènghuáng: phượng hoàng, 龙凤 lóngfèng). |
|   凫    |   fú   |   Phù    | `鸟` lược + `几` (`鳧`)     | [Tra bộ 几 (Tân Hoa giản thể) / 鳥 (phồn thể `鳧`)] Loài chim nước như vịt trời, động tác bơi lội trên mặt nước (凫水 fúshuǐ: bơi lội, 野凫 yěfú: vịt trời).    |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `风 / 風` (`fēng` · Phong — gió; khung ngoài giống `几` nhưng là bộ thủ riêng #182, không tra dưới `几`).
- `机 / 機` (`jī` · Cơ · `木 + 几` — máy móc, cơ hội; giản thể mượn `几` thay `幾` để gợi âm `jī`, tra bộ `木` #75).
- `肌` (`jī` · Cơ · `月/⺼ + 几` — cơ bắp, da thịt; tra bộ `肉/月` #130).
- `饥 / 飢` (`jī` · Cơ · `饣 + 几` — đói kém; tra bộ `食/饣` #184).
- `叽` (`jī` · Ky · `口 + 几` — tiếng chim chíp, lầm bầm; tra bộ `口` #30).
- `亮` (`liàng` · Lượng — sáng sủa; phần đáy có `几` nhưng tra bộ `亠` #8).
- `处 / 處` (`chù / chǔ` · Xứ / Xử — nơi chốn, xử lý; giản thể là `夂 + 卜`, không phải `几`, tra bộ `夂` #34).
- `沉` (`chén` · Trầm — chìm xuống; phần bên phải là dạng nghiêng gần `几` trong chữ hiện đại, tra bộ `水/氵` #85).
- `儿` (`ér` · Nhi — bộ thủ riêng #10, hai nét rời ở đỉnh).

---

## Bộ 82: 凵 (Khảm)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-114` · `radical_index`: `114` · Khang Hy **#17** · `strokes`: `2` nét · `name_vi`: `bộ Khảm / Khảm há` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `凵` — dạng chính (2 nét: `∟ 丨`, khung đáy vuông góc mở miệng phía trên).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hình cái hố lõm trên mặt đất, miệng há ra hoặc vật chứa mở miệng lên trên (_Thuyết Văn Giải Tự_ giải nghĩa là "trương khẩu dã" — há miệng / miệng hố).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Khung mở phía trên, hố lõm, chỗ trũng, vật chứa; ít dùng độc lập trong tiếng Trung hiện đại mà chủ yếu đóng vai trò linh kiện hình dạng khung đáy (`凹`, `凸`, `出`, `凶`, `函`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `凵` trông như cái khung mở phía trên, thường gợi cái hố, chỗ lõm, hộp chứa hoặc hình ảnh vật nhô ra khỏi chỗ trũng (`出`, `凸`, `凹`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`凵` vs `匚` vs `囗` vs `冂`:** `凵` mở **phía trên**; `匚` mở **bên phải**; `囗` bao kín cả 4 cạnh; `冂` mở **phía dưới**.
    - **`凵` vs `山`:** `山` (bộ Sơn #46, 3 nét) có nét sổ giữa kéo dài xuyên xuống đáy như ngọn núi; `凵` (2 nét) là khung đáy rỗng bằng phẳng.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Hố lõm, nhô lên, xuất phát & nguy hiểm thuần bộ `凵`

| Chữ Hán |   Pinyin   | Hán Việt | Thiên bàng đứng chung    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                    |
| :-----: | :--------: | :------: | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   凵    | kǎn / qiǎn |   Khảm   | Độc thể (Bộ thủ chính)   | [Tra bộ 凵] Miệng hố, chỗ lõm mở lên trên (ít dùng độc lập, chủ yếu làm tên bộ thủ Khảm).                                                                         |
|   凹    |     āo     |    Ao    | Khung `凵` hõm giữa      | [Tra bộ 凵] Tượng hình mặt phẳng bị khoét lõm xuống ở giữa → lõm xuống, trũng (凹陷 āoxiàn: lõm xuống, 凹凸不平 āotū bùpíng: lồi lõm gồ ghề).                     |
|   凸    |     tū     |   Đột    | Khung đáy + phần nhô     | [Tra bộ 凵] Tượng hình phần giữa nhô cao hẳn lên trên mặt bằng → lồi ra, nổi bật (凸出 tūchū: nhô ra, 凹凸 āotū: lồi lõm).                                        |
|   出    |    chū     |   Xuất   | Hai nhánh / chân ra `凵` | [Tra bộ 凵] Cổ tự vẽ bàn chân (`止`) bước ra khỏi hang/hố (`凵`), hoặc mầm cây trồi lên → đi ra, xuất hiện (出去 chūqù: đi ra, 出现 chūxiàn: xuất hiện, 出口).    |
|   凶    |   xiōng    |   Hung   | `凵` (hố bẫy) + `乂`     | [Tra bộ 凵] Cái hố bẫy thú có cắm chông/vật cản bên trong → hung ác, nguy hiểm, điềm dữ (凶恶 xiōng'è: hung ác, 凶手 xiōngshǒu: hung thủ, 吉凶 jíxiōng: lành dữ). |

### Nhóm B: Hộp chứa, tác động & chữ giản thể xếp bộ `凵`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                         |
| :-----: | :----: | :------: | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   函    |  hán   |   Hàm    | `𠄎` + phần ruột + `凵`            | [Tra bộ 凵] Cổ tự vẽ mũi tên đựng trong ống bao (`凵`) → cái hộp, thư từ, bao hàm, hàm số (信函 xìnhán: thư từ, 函数 hánshù: hàm số, 包含 bāohán: bao hàm).            |
|   击    |   jī   |   Kích   | `二` + `丨` + `凵` (giản của `擊`) | [Tra bộ 凵 (Tân Hoa giản thể) / 手 (phồn thể `擊`)] Giản hóa phần tay và xe → đánh, gõ, tấn công (打击 dǎjī: đả kích, 攻击 gōngjī: tấn công, 点击 diǎnjī: nhấp chuột). |
|   凿    |  záo   |   Tạc    | `业` + `羊` lược + `凵` (`鑿`)     | [Tra bộ 凵 (Tân Hoa giản thể) / 金 (phồn thể `鑿`)] Đục khoét đá/gỗ, cái đục, xác thực (凿洞 záodòng: đục lỗ, 确凿 quèzáo: xác thực không chối cãi).                   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `画 / 畫` (`huà` · Họa — vẽ, bức tranh; giản thể có khung `凵` bọc đáy `田` nhưng tra bộ `田` #102).
- `幽` (`yōu` · U — u tối, yên tĩnh; có `凵` bọc hai chữ `幺` nhưng tra bộ `幺` #52).
- `山 / 岂` (`shān / qǐ` — đều có nét đáy giống `凵` nhưng thuộc bộ `山` #46).
- `世` (`shì` · Thế — thế hệ, thế giới; nét đáy gập tương tự `凵` nhưng tra bộ `一` #1).
- `齿 / 齒` (`chǐ` · Xỉ — răng; có `凵` bọc phần hàm dưới nhưng là bộ thủ riêng #211).
- `屈` (`qū` · Khuất — cong, khuất phục; phần ruột chứa `出` mang `凵` nhưng tra bộ `尸` #44).
- `匚 / 囗` (`fāng / wéi` — khung mở phải / khung bao kín 4 cạnh, hai bộ thủ riêng).

---

## Bộ 83: 勹 (Bao)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-104` · `radical_index`: `104` · Khang Hy **#20** · `strokes`: `2` nét · `name_vi`: `bộ Bao` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `勹` — dạng chính (2 nét: `丿 𠃌`, mở đầu bằng nét phẩy ngắn và nét ngang gập móc dài bao lấy góc trên-phải).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hình dáng người khom lưng ôm gói lấy đồ vật (hoặc bào thai bọc bên trong bụng).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bao bọc, gói ghém, ôm trùm (`包`, `匀`); trong nhiều chữ cổ/hiện đại khác (`勿`, `匆`, `勾`), bộ `勹` đã trở thành thành phần hình dạng hoặc dấu tích cổ tự nên không giải thích trực tiếp theo nghĩa "gói bọc".
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `勹` tạo khung cong ôm lấy phần ruột từ phía trên và bên phải, gợi hành động gói, bọc, giữ bên trong hoặc phân chia đều (`包`, `勺`, `匀`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`勹` vs `勺`:** `勺` (3 nét, cái thìa) là `勹` có thêm một dấu chấm `丶` bên trong (hạt thức ăn trong muỗng), tra ngay dưới bộ `勹`.
    - **`勹` vs `匚` vs `匸`:** `勹` có nét phẩy xiên và vòm cong bao từ trên-phải; `匚` và `匸` là khung vuông mở về bên phải.
    - **`勹` vs `勿 / 匆`:** Chữ `勿` (đừng/chớ) và `匆` (vội vàng) cùng xếp bộ `勹` trong từ điển, nhưng nguồn gốc lần lượt là lá cờ hiệu và cửa sổ thông khói, không gượng ép nghĩa "gói bọc".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bao bọc, đồ đựng, chia đều & móc nối

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                              |
| :-----: | :-------: | :------: | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   勹    |    bāo    |   Bao    | Độc thể (Bộ thủ chính) | [Tra bộ 勹] Cổ tự của chữ `包`, nghĩa gốc là gói, bao bọc, ôm lấy.                                                                                          |
|   包    |    bāo    |   Bao    | `勹` + `巳` (bào thai) | [Tra bộ 勹] Người/mẹ ôm bọc hài nhi trong lòng → gói, bọc, bao gồm, cái túi (包括 bāokuò: bao gồm, 书包 shūbāo: cặp sách, 面包 miànbāo: bánh mì).           |
|   勺    |   sháo    |  Thược   | `勹` + `丶` (vật múc)  | [Tra bộ 勹] Hình cái muôi/gáo múc có giọt chất lỏng bên trong → cái thìa, muỗng (勺子 sháozi: cái thìa, 汤勺 tāngsháo: muôi canh, 漏勺 lòusháo: vợt thủng). |
|   匀    |    yún    |   Quân   | `勹` + `冫` (hai phần) | [Tra bộ 勹] Gói chia lượng nhỏ bên trong thành phần bằng nhau → đều đặn, chia đều (均匀 jūnyún: đều đặn, 匀称 yúnchèn: cân đối).                            |
|   勾    | gōu / gòu |   Câu    | `勹` + `厶`            | [Tra bộ 勹] Cái móc uốn cong → móc lại, đánh dấu tích, phác họa, câu kết (打勾 dǎgōu: đánh dấu tích, 勾画 gōuhuà: phác họa, 勾结 gōujié: câu kết).          |

### Nhóm B: Trạng thái, cấm đoán, tư thế & từ cổ xếp bộ `勹`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                       |
| :-----: | :----: | :------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
|   匆    |  cōng  |  Thông   | `勹` + nét chéo/chấm  | [Tra bộ 勹] Cổ tự vẽ ống khói hoặc người vội vã → gấp gáp, vội vàng (匆忙 cōngmáng: vội vã, 来去匆匆 láiqù-cōngcōng: đi lại vội vàng).               |
|   勿    |   wù   |   Vật    | `勹` + 2 nét phẩy     | [Tra bộ 勹] Cổ tự vẽ lá cờ phất ra hiệu ngăn lại (sau nghĩa chuyển thành đừng/chớ) → chớ, đừng (请勿 qǐngwù: xin đừng, 切勿 qièwù: tuyệt đối đừng).  |
|   匈    | xiōng  |   Hung   | `勹` + `凶`           | [Tra bộ 勹] Cổ tự của chữ `胸` (lồng ngực — khoang ngực `勹` bao lấy phần ruột), nay dùng trong tên riêng (匈牙利 Xiōngyálì: Hungary, 匈奴 Xiōngnú). |
|   匍    |   pú   |    Bồ    | `勹` + `甫`           | [Tra bộ 勹] Người khom cúi sát đất → bò, trườn (匍匐 púfú: bò sát đất, 匍匐前进 púfú qiánjìn: trườn tiến lên phía trước).                            |
|   匐    |   fú   |   Phục   | `勹` + `畐`           | [Tra bộ 勹] Phục sát thân mình trên mặt đất → nằm rạp, bò sấp (匍匐 púfú: bò trườn).                                                                 |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `句` (`jù` · Câu · `勹 + 口` — câu văn, lời nói; tra bộ `口` #30).
- `旬` (`xún` · Tuần · `勹 + 日` — 10 ngày/10 năm; tra bộ `日` #72).
- `抱 / 跑 / 饱 / 泡` (`bào / pǎo / bǎo / pào` — nhóm chữ hình thanh mượn `包` làm thanh phù, tra theo các bộ `扌`, `⻊`, `饣`, `氵`).
- `物` (`wù` · Vật · `牜 + 勿` — đồ vật, sinh vật; có `勿` chứa `勹` làm thanh phù nhưng tra bộ `牛` #93).
- `忽` (`hū` · Hốt · `勿 + 心` — bỗng nhiên, lơ là; có `勿` làm thanh phù nhưng tra bộ `心` #61).
- `菊 / 陶` (`jú / táo` — hoa cúc / đồ gốm; đều có khung `勹` ở phần thanh phù nhưng tra bộ `艹` #140 và bộ `阝/阜` #170).

---

## Bộ 84: 匕 (Chủy)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-102` · `radical_index`: `102` · Khang Hy **#21** · `strokes`: `2` nét · `name_vi`: `bộ Chủy / Tỷ` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `匕` — dạng chính (2 nét: `丿 乚`, viết nét phẩy ngắn ở trên trước, rồi mới viết nét sổ cong móc).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Trong _Thuyết Văn Giải Tự_, `匕` vẽ cái thìa/muỗng xúc cơm thời cổ; đồng thời trong Giáp cốt văn, hình giống `匕` cũng được dùng để vẽ dáng người quay nghiêng hoặc lật ngược đầu (`化`, `北`, `比`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Ít dùng độc lập (chủ yếu gặp trong `匕首` = dao găm); thường xuất hiện làm linh kiện quan trọng trong một số chữ cơ bản (`化`, `北`, `匙`) hoặc đứng ở vị trí phụ của các bộ khác (`比`, `死`, `此`, `老`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Do hai nguồn cổ tự ("cái thìa" và "người quay nghiêng") hòa chung một mặt chữ `匕`, phần lớn chữ chứa `匕` không đoán nghĩa đồng loạt theo "cái thìa" mà nên học theo cấu tạo từng chữ.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`匕` (Chủy) vs `七` (Thất):** `匕` (bộ Chủy, 2 nét) bắt đầu bằng nét **phẩy ngắn từ phải sang trái `丿`**, không xuyên cắt ngang thân nét cong; `七` (số 7, tra bộ `一`) bắt đầu bằng nét **ngang xiên `一`** cắt ngang qua nét sổ cong móc `乚`.
    - **`匕` vs `比` (Tỷ):** `比` (bộ thủ riêng #81) gồm hai hình `匕` đứng song song với nghĩa "so sánh", không tra ở bộ `匕`.
    - **`匕` vs `勺`:** Ngày nay chữ `勺` (tra bộ `勹`) thông dụng hơn cho nghĩa "cái muỗng"; `匕` chỉ còn dùng trong `匕首` (dao găm) hoặc thành phần của `匙` (thìa / chìa khóa).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cái thìa, dao găm & gốc nghĩa đồ dùng

| Chữ Hán |  Pinyin   | Hán Việt  | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                    |
| :-----: | :-------: | :-------: | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   匕    |    bǐ     |   Chủy    | Độc thể (Bộ thủ chính) | [Tra bộ 匕] Cổ tự vẽ cái thìa/muỗng; ngày nay chủ yếu dùng chỉ con dao găm (匕首 bǐshǒu: dao găm).                                                                |
|   匙    | chí / shi | Thì / Thi | `是` + `匕`            | [Tra bộ 匕] Đồ dùng xúc thức ăn (`匕`) + `是` (`shì`, thanh phù) → cái thìa (`chí`: 汤匙 tāngchí thìa canh); đọc thanh nhẹ `shi` trong chìa khóa (`钥匙` yàoshi). |

### Nhóm B: Con người quay nghiêng — biến đổi & phương hướng

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                         |
| :-----: | :-------: | :------: | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   化    | huà / huā |   Hóa    | `亻` (người) + `匕` (người đảo) | [Tra bộ 匕] Một người đứng thẳng (`亻`) bên một người lộn ngược/đổi tư thế (`匕`) → biến đổi, cảm hóa, hóa học (变化 biànhuà: biến hóa, 文化 wénhuà: văn hóa, 化学).   |
|   北    |    běi    |   Bắc    | Hai người (`匕` đối) quay lưng  | [Tra bộ 匕] Hai người quay lưng lại với nhau (trái ngược, lánh mặt — chữ gốc của `背`), sau mượn chỉ hướng quay lưng về phía mặt trời → phương Bắc (北方, 北京, 南北). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `比` (`bǐ` · Tỷ — so sánh; hai `匕` đứng cùng chiều, là bộ thủ riêng #81).
- `此` (`cǐ` · Thử · `止 + 匕` — này, đây; tra bộ `止` #77).
- `死` (`sǐ` · Tử · `歹 + 匕` — chết; người quỳ trước hài cốt `歹`, tra bộ `歹` #78).
- `尼` (`ní` · Ni · `尸 + 匕` — ni cô, gần gũi; tra bộ `尸` #44).
- `仑 / 侖` (`lún` · Luân · `人 + 匕` — thứ tự, Luân Đôn; tra bộ `人` #9).
- `老` (`lǎo` · Lão — già cả; có phần đáy `匕` nhưng là bộ thủ riêng #125).
- `旨` (`zhǐ` · Chỉ · `匕 + 日` — ngon, ý chỉ; tra bộ `日` #72).
- `它` (`tā` · Tha — nó, con vật/đồ vật; có `匕` bên dưới mái `宀` nhưng tra bộ `宀` #40).
- `花 / 货 / 倾` (`huā / huò / qīng` — đều chứa thanh phù `化` mang `匕`, nhưng tra theo các bộ `艹`, `贝`, `亻`).
- `七` (`qī` · Thất — số bảy; nét ngang cắt xuyên khác `匕`, tra bộ `一` #1).

---

## Bộ 85: 匚 (Phương)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-106` · `radical_index`: `106` · Khang Hy **#22** · `strokes`: `2` nét · `name_vi`: `bộ Phương khuông / Khuông trái` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `匚` — dạng chính (2 nét: `一 ∟`, quy tắc viết chuẩn: viết nét ngang trên trước, viết phần ruột bên trong, rồi mới viết nét sổ gập ngang bao bên trái và đáy).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hình cái hộp, cái rương hoặc giỏ vuông mở một mặt để đựng đồ.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Khung hộp, vật chứa, khoang bao một phần; thường gợi cái hòm/hộp (`匣`, `匮`), khu vực phân vùng (`区`), dụng cụ/thợ thủ công (`匠`) hoặc tủ đựng dụng cụ y tế (`医`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ `匚` bao ba phía (trên – trái – dưới) và mở sang bên phải, thường gợi hộp chứa, công cụ nghề nghiệp hoặc khu vực được khoanh vùng.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`匚` (Phương khuông, Khang Hy #22) vs `匸` (Hệ, Khang Hy #23):** Đây là cặp bộ thủ **rất dễ nhầm**!
      - Về nghĩa gốc: `匚` vẽ **cái hộp đựng đồ** mở sang phải (`匣`, `匠`, `匡`); `匸` mang nghĩa **che đậy, ẩn giấu** (`匿`, `匹`, `匾`, `區`).
      - Về mặt chữ hiện đại: Trong chữ viết chuẩn truyền thống, `匸` có nét ngang trên hơi lệch/kín khác nhẹ so với `匚`, nhưng trong đa số font chữ in hiện đại và trong bảng tra cứu giản thể Tân Hoa, **hai bộ gần như giống hệt nhau** và `匚` thường gộp luôn nhóm chữ của `匸` (`区`, `医`).
    - **`匚` vs `凵` vs `囗`:** `匚` mở **bên phải**; `凵` mở **phía trên**; `囗` đóng **kín cả 4 cạnh**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Hộp đựng, rương tủ & vật chứa thuần bộ `匚` Khang Hy

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                              |
| :-----: | :----: | :------: | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   匚    |  fāng  |  Phương  | Độc thể (Bộ thủ chính)  | [Tra bộ 匚] Cái hòm vuông mở một bên (tên quen gọi là _Phương khuông_ hoặc _Khuông trái_).                                                                  |
|   匣    |  xiá   |   Hạp    | `匚` + `甲`             | [Tra bộ 匚] Hộp nhỏ (`匚`) + `甲` (`jiǎ`, thanh phù kiêm ý vỏ bọc) → cái hộp, tráp (匣子 xiázi: cái hộp, 剑匣 jiànxiá: hộp kiếm, 话匣子: người nói nhiều).  |
|   匮    |  kuì   |   Quỹ    | `匚` + `贵` (phồn `匱`) | [Tra bộ 匚] Hòm tủ đựng đồ (`匚`) + `贵` (đồ quý giá); sau chuyển nghĩa thiếu hụt, cạn kiệt (匮乏 kuìfá: thiếu thốn, 功亏一篑: hỏng việc ở bước cuối).      |
|   匦    |  guǐ   |   Quỹ    | `匚` + `轨` (phồn `匭`) | [Tra bộ 匚] Cái hộp nhỏ kín có khe bỏ thư/phiếu ở trên → hòm phiếu, hộp đóng góp (投票匦 tóupiàoguǐ: hòm phiếu bầu).                                        |
|   匪    |  fěi   |   Phỉ    | `匚` + `非`             | [Tra bộ 匚] Cổ tự là chiếc giỏ tre hình vuông; sau mượn làm từ phủ định ("chẳng phải") và chỉ kẻ cướp/thổ phỉ (土匪 tǔfěi: thổ phỉ, 受益匪浅: thu ích lớn). |

### Nhóm B: Nghề thủ công, chuẩn mực & chữ giản thể xếp bộ `匚` trong Tân Hoa

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                             |
| :-----: | :-----: | :------: | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   匠    |  jiàng  |  Tượng   | `匚` (hộp đồ) + `斤` (rìu)    | [Tra bộ 匚] Hộp đựng rìu búa và dụng cụ nghề mộc → người thợ thủ công, nghệ nhân (木匠 mùjiang: thợ mộc, 工匠 gōngjiàng: thợ lành nghề, 匠心 jiàngxīn: tâm huyết).         |
|   匡    |  kuāng  |  Khuông  | `匚` + `王` (giỏ có chân)     | [Tra bộ 匚] Cái giỏ vuông đựng đồ → uốn nắn, chỉnh sửa cho ngay ngắn, giúp đỡ (匡正 kuāngzhèng: chấn chỉnh, 匡扶 kuāngfú: phò tá giúp đỡ).                                 |
|   巨    |   jù    |    Cự    | Thước thợ vuông góc (`工` cổ) | [Tra bộ 匚 (Tân Hoa) / 工 (Khang Hy)] Cây thước vuông lớn của thợ mộc → to lớn, khổng lồ (巨大 jùdà: to lớn, 巨人 jùrén: người khổng lồ, 艰巨 jiānjù: gian nan).           |
|   区    | qū / ōu | Khu / Âu | `匚` + `乂` (giản của `區`)   | [Tra bộ 匚 (Tân Hoa giản thể) / 匸 (Khang Hy phồn thể `區`)] Phân chia vật đựng vào từng ô hộp → khu vực, phân biệt (地区 dìqū: khu vực, 区别 qūbié: phân biệt).           |
|   医    |   yī    |    Y     | `匚` + `矢` (tự gốc của `醫`) | [Tra bộ 匚 (Tân Hoa giản thể) / 匸 (tự gốc) · 酉 (phồn `醫`)] Hộp đựng mũi tên để chữa vết thương (cổ) → y học, thầy thuốc (医生 yīshēng: bác sĩ, 医院 yīyuàn: bệnh viện). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `汇 / 匯` (`huì` · Hối — hội tụ, chuyển tiền; phồn thể `匯` xếp bộ `匚`, giản thể `汇` đổi thành `氵 + 匚` nên Tân Hoa xếp bộ `水/氵` #85).
- `柜` (`guì` · Quỹ · `木 + 巨` — cái tủ; chứa `巨` giống `匚` nhưng tra bộ `木` #75).
- `匹 / 匿 / 匾` (`pǐ / nì / biǎn` — truyền thống Khang Hy xếp ở bộ `匸` #23, Tân Hoa hiện đại gộp vào `匚`).
- `匸` (`xì` · Hệ — bộ thủ riêng #23 trong Khang Hy, rất dễ nhầm hình với `匚`).
- `凵` (`kǎn` · Khảm — khung mở phía trên, bộ thủ riêng #17).

---

## Bộ 86: 匸 (Hệ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-107` · `radical_index`: `107` · Khang Hy **#23** · `strokes`: `2` nét · `name_vi`: `bộ Hệ / Hạp che**` _(lưu ý trong DB đang dư dấu `**` ở cuối chuỗi, đề xuất làm sạch thành `bộ Hệ / Hạp che`)_ · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `匸` — dạng chính (2 nét: `一 ∟`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Che giấu, cất kín vật gì đó vào chỗ khuất (_Thuyết Văn Giải Tự_ giải là "tàng dã" — cất giấu).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Che đậy, giấu kín, ẩn náu (`匿`, `匽`); trong tiếng Trung hiện đại rất ít chữ giữ rõ nghĩa này, và hệ từ điển giản thể Tân Hoa thường gộp thẳng bộ `匸` vào bộ `匚`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `匸` thường gợi sự ẩn giấu, che kín bên trong (`匿`), nhưng số chữ thông dụng ít và cần dựa vào từ điển khi tra cứu.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`匸` vs `匚` (mức độ dễ nhầm rất cao):** `匚` (Khang Hy #22) thiên về **cái hộp/khung chứa mở phải**; `匸` (Khang Hy #23) thiên về **che giấu/ẩn tàng**. Trong phần lớn font chữ hiện đại và trong bảng bộ thủ giản thể, hình hai bộ gần như trùng nhau hoàn toàn nên người học cần tra theo từng chữ cụ thể.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Che giấu, ẩn náu & lánh mặt thuần bộ `匸`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                 |
| :-----: | :----: | :------: | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   匸    |   xì   |    Hệ    | Độc thể (Bộ thủ chính) | [Tra bộ 匸] Cổ tự biểu thị cái hộp che giấu hoặc hành động cất giấu kín đáo.                                                                                                   |
|   匿    |   nì   |   Nặc    | `匸` + `若`            | [Tra bộ 匸 (Khang Hy) / 匚 (Tân Hoa)] Vật giấu kỹ trong chỗ khuất (`匸`) + `若` (`ruò`, thanh phù) → ẩn náu, giấu giếm (匿名 nìmíng: giấu tên, 藏匿 cángnì: ẩn náu, 销声匿迹). |
|   匽    |  yǎn   |   Yển    | `匸` + `日` + `女`     | [Tra bộ 匸 (Khang Hy) / 匚 (Tân Hoa)] Ẩn nấp, che giấu, đắp bờ đập (là phần tạo hình/âm trong chữ `偃` yǎn nằm ngửa, `堰` yàn con đập).                                        |

### Nhóm B: Vật dẹt, đơn vị sóng đôi & phân vùng xếp bộ `匸` truyền thống

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                             |
| :-----: | :-----: | :------: | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   匹    |   pǐ    |   Thất   | `匸` + `儿`                    | [Tra bộ 匸 (Khang Hy) / 匚 (Tân Hoa)] Một cuộn vải bốn trượng (4丈) xếp gọn trong hộp → tấm vải, con ngựa, sánh đôi (一匹马 yī pǐ mǎ: một con ngựa, 匹配 pǐpèi: ghép đôi). |
|   匾    |  biǎn   |   Biển   | `匸` + `扁`                    | [Tra bộ 匸 (Khang Hy) / 匚 (Tân Hoa)] Bức tranh/chữ hình chữ nhật dẹt (`扁`) treo trên cửa → tấm biển hiệu, dẹt/bẹt (匾额 biǎn'é: bức hoành phi, 牌匾 páibiǎn: bảng hiệu). |
|   區    | qū / ōu | Khu / Âu | `匸` + `品` (giản thể là `区`) | [Tra bộ 匸 (Khang Hy phồn thể) / 匚 (Tân Hoa giản thể `区`)] Cất giữ từng món đồ (`品`) trong các ngăn khuất (`匸`) → phân khu, khu vực (地區 dìqū: khu vực, 區別 qūbié).  |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `医 / 醫` (`yī` · Y — y học, bác sĩ; tự gốc `医` thuộc bộ `匸` trong Khang Hy, phồn thể `醫` xếp bộ `酉` #164, giản thể `医` xếp bộ `匚` #22 trong Tân Hoa).
- `匚` (`fāng` · Phương — cái hộp mở phải, bộ thủ riêng #22 rất dễ nhầm với `匸`).
- `匠 / 匣` (`jiàng / xiá` — thợ thủ công / cái hộp; thuộc bộ `匚` #22, dễ nhìn nhầm với `匸`).
- `亡` (`wáng` · Vong — mất, trốn; nét đáy giống nửa khung che nhưng tra bộ `亠` #8).
- `躲` (`duǒ` · Đóa — trốn tránh, né; tuy cùng trường nghĩa "ẩn trốn" với `匸` nhưng tra bộ `身` #158).

---

## Bộ 87: 卜 (Bốc)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-099` · `radical_index`: `99` · Khang Hy **#25** · `strokes`: `2` nét · `name_vi`: `bộ Bốc` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `卜` — dạng chính (2 nét: `丨 丶`, nét sổ đứng trước, nét chấm xiên phải sau).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình vết nứt chữ T nghiêng trên mai rùa hoặc xương bò khi đem hơ lửa để xem bói thời Thương–Chu.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bói toán, dự đoán (`占卜`, `卦`); chữ `卜` trong giản thể hiện đại còn dùng viết tắt cho `蔔` trong `萝卜` (củ cải); ở nhiều chữ thông dụng (`卡`, `外`, `卧`) chỉ còn đóng vai trò linh kiện hình/vị trí hoặc phân loại tra từ điển.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `卜` có thể gợi việc bói toán, đoán trước (`占`, `卦`), nhưng nhiều chữ hiện đại mang `卜` đã chuyển nghĩa hoàn toàn (`卡`, `外`, `萝卜`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`卜` vs `上 / 下`:** `上`, `下` có nét ngang dài làm đường mốc vị trí (thuộc bộ `一` #1); `卜` là nét sổ dài kèm nét chấm xiên sang phải (`丨 丶`).
    - **`卜` vs `不`:** `不` (4 nét, tra bộ `一`) nghĩa là "không"; `卜` (2 nét) là "bói" (hoặc củ cải trong `萝卜`).
    - **`卜` vs `占`:** `占` gồm `卜 + 口`, tra trực tiếp dưới bộ `卜`; nghĩa gốc là "hỏi bói / chiếm lấy".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bói toán, dự đoán & chữ cổ xếp bộ `卜`

| Chữ Hán |   Pinyin    |   Hán Việt    | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                          |
| :-----: | :---------: | :-----------: | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   卜    |   bǔ / bo   |      Bốc      | Độc thể (Bộ thủ chính) | [Tra bộ 卜] Nét vết nứt mai rùa → xem bói (`bǔ`: 占卜 zhānbǔ bói toán, 未卜先知); giản thể của `蔔` đọc thanh nhẹ `bo` trong củ cải (`萝卜` luóbo).                     |
|   占    | zhān / zhàn | Chiêm / Chiếm | `卜` + `口`            | [Tra bộ 卜] Dùng miệng (`口`) đọc lời giải vết nứt bói (`卜`) → xem bói (`zhān`: 占卜 zhānbǔ); mở rộng thành chiếm giữ (`zhàn`: 占有 zhànyǒu chiếm hữu, 占领 zhànlǐng). |
|   卦    |     guà     |     Quái      | `圭` + `卜`            | [Tra bộ 卜] Vạch que cỏ/đất (`圭` ghi âm kiêm que bói) + xem bói (`卜`) → quẻ bói (八卦 Bāguà: Bát quái, 算卦 suànguà: xem quẻ bói).                                    |
|   卞    |    biàn     |     Biện      | `亠` + `卜`            | [Tra bộ 卜] Nóng vội, gấp gáp; họ Biện (卞急 biànjí: nóng nảy gấp gáp, 卞和 Biàn Hé: Biện Hòa).                                                                         |
|   卣    |     yǒu     |      Dậu      | Nắp/quai + bình rượu   | [Tra bộ 卜] Tượng hình cái bình đồng có quai xách dùng đựng rượu thơm cúng tế thời cổ (铜卣 tóngyǒu: bình đồng cổ).                                                     |

### Nhóm B: Chữ hiện đại thông dụng & giản thể xếp bộ `卜` trong Tân Hoa

| Chữ Hán |  Pinyin  | Hán Việt | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                   |
| :-----: | :------: | :------: | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   卡    | kǎ / qiǎ |   Tạp    | `上` + `卜` (lên xuống lưỡng lự) | [Tra bộ 卜] Nửa trên nửa dưới chặn lại ở giữa → kẹt, trạm kiểm soát (`qiǎ`: 卡住 qiǎzhù bị kẹt); phiên âm tiếng Anh _card/calorie_ (`kǎ`: 信用卡, 卡车, 卡路里). |
|   卢    |    lú    |    Lư    | `卜` + `尸` (giản của `盧`)      | [Tra bộ 卜 (Tân Hoa giản thể) / 皿 (phồn thể `盧`)] Lò sưởi, túp lều tranh, họ Lư (卢布 lúbù: đồng rúp, 卢沟桥 Lúgōuqiáo: cầu Lư Câu).                           |
|   卤    |    lǔ    |    Lỗ    | `卜` + khung hạt muối (`鹵`)     | [Tra bộ 卜 (Tân Hoa giản thể) / 鹵 (bộ Lỗ phồn thể)] Nước muối mỏ, kho mặn kiểu Trung Hoa, nhóm halogen (卤味 lǔwèi: đồ kho mặn, 卤蛋 lǔdàn: trứng kho).         |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `外` (`wài` · Ngoại · `夕 + 卜` — bên ngoài; có `卜` bên phải nhưng tra bộ `夕` #36).
- `卧 / 臥` (`wò` · Ngọa · `臣 + 卜` — nằm; có `卜` bên phải nhưng tra bộ `臣` #131).
- `贞 / 貞` (`zhēn` · Trinh · `卜 + 贝` — trinh tiết, kiên định, hỏi bói cổ; tra bộ `貝/贝` #154).
- `处 / 處` (`chù / chǔ` · Xứ / Xử · `夂 + 卜` — nơi chốn, xử lý; giản thể có `卜` bên phải nhưng tra bộ `夂` #34).
- `补 / 扑 / 赴` (`bǔ / pū / fù` — vá/bù, vồ/đánh, đi đến; đều mượn `卜` làm thanh phù, tra theo các bộ `衤`, `扌`, `走`).
- `点` (`diǎn` · Điểm · `占 + 灬` — điểm, chấm; chứa `占` mang `卜`, tra bộ `火/灬` #86).
- `上 / 下` (`shàng / xià` — trên / dưới; nét gần giống `卜` nhưng là chữ chỉ sự thuộc bộ `一` #1).

---

## Bộ 88: 卩 (Tiết)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-109` · `radical_index`: `109` · Khang Hy **#26** · `strokes`: `2` nét · `name_vi`: `bộ Tiết` · Dòng trùng/rỗng: Có dòng trùng rỗng `radical-113` (`radical_index: 113`, `radical`: `"卩/㔾 — đã học ở mục 109"`, `name_vi: null`) cần gộp/dọn khi chuẩn hóa DB.
- **Hình thái & Biến thể (`variants`):**
  - `卩` — dạng đứng chính (2 nét: `𠃍 丨`, thường nằm ở **bên phải** chữ như `印`, `即`, `却`, `卸`).
  - `㔾 / ⺋` — dạng cong móc ở đáy (2 nét: `𠃍 乚`, thường nằm ở **phía dưới** chữ như `危`, `卷`, hoặc làm biến thể hình trong `厄`, `巴`, `色`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Trong Giáp cốt văn vẽ hình **người đang quỳ gối** (tuân lệnh, bái lạy); trong _Thuyết Văn Giải Tự_ giải là **phù tiết** — nửa mảnh thẻ tre/ngọc ghép đôi làm con dấu tín vật ban lệnh.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Con dấu, tín vật, lệnh phù, tiết chế/quy ước (`印`, `即`, `却`, `卫`); trong nhiều chữ hiện đại đóng vai trò linh kiện vị trí bên phải hoặc dưới.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `卩` / `㔾` / `⺋` ở bên phải hoặc đáy chữ có thể gợi hình người quỳ tiếp nhận mệnh lệnh, dấu ấn xác nhận, hoặc đơn thuần là linh kiện cấu chữ (`印`, `即`, `却`, `卷`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`卩` (Tiết) vs `阝` (Phụ / Ấp) vs `⺋`:** Bộ ba cực hay nhầm ở bên phải/trái chữ!
      - **`卩` (2 nét, _đơn nhĩ đao_):** Chỉ có **1 lần gập góc vuông** rồi kéo sổ thẳng (`𠃍 丨`), đứng bên phải (`印`, `即`, `却`, `卸`).
      - **`阝` (biến thể 2 nét, _song nhĩ đao_):** Có **2 vòng cong nối tiếp như số 3** (`㇌ 丨`): đứng **bên trái** là biến thể của **bộ Phụ `阜`** (gò đồi, như `院`, `阳`, `陈`), đứng **bên phải** là biến thể của **bộ Ấp `邑`** (đô thị, vùng đất, như `都`, `那`, `邮`). Hai bộ này hoàn toàn không phải bộ `卩`.
      - **`⺋` / `㔾` (dạng cong của `卩`):** Có nét sổ uốn cong móc ra ngoài (`𠃍 乚`), thường nằm ở **đáy chữ** (`危`, `卷`) hoặc góc phải trong một số chữ thuộc bộ khác (`犯`, `色`).
    - **`卩` vs `ㄗ` (Chú âm Đài Loan):** Ký hiệu ngữ âm _z_ trong hệ Chú âm (Bopomofo), không phải bộ thủ Hán tự.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Con dấu, tín vật, bảo vệ & chức quan

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                           |
| :-----: | :----: | :------: | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   卩    |  jié   |   Tiết   | Độc thể (Bộ thủ chính)      | [Tra bộ 卩] Phù tiết, mảnh thẻ khớp làm tín vật (ngày nay chữ "đốt/tiết" viết thành `节`).                                                               |
|   印    |  yìn   |    Ấn    | `爪` (bàn tay) + `卩` (quỳ) | [Tra bộ 卩] Bàn tay (`爪`) ấn giữ người quỳ xuống / đóng con dấu (`卩`) → con dấu, in ấn, dấu vết (印象 yìnxiàng: ấn tượng, 打印 dǎyìn: in ấn, 印尼).    |
|   卫    |  wèi   |    Vệ    | `㇇` + `丨` + `一` (`衛`)   | [Tra bộ 卩 (Tân Hoa giản thể) / 行 (phồn thể `衛`)] Giản hóa từ chữ `衛` → bảo vệ, canh giữ (保卫 bǎowèi: bảo vệ, 卫生 wèishēng: vệ sinh, 卫星 wèixīng). |
|   卿    |  qīng  |  Khanh   | `卯` + `皀` (cũ `卯 + 艮`)  | [Tra bộ 卩] Cổ tự vẽ hai người quỳ đối diện trước bàn tiệc → chức quan đại thần, cách gọi thân mật (公卿 gōngqīng: công khanh, 爱卿 àiqīng: ái khanh).   |

### Nhóm B: Hành động, tiến gần, từ chối & cuộn gập

| Chữ Hán |   Pinyin    | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                 |
| :-----: | :---------: | :------: | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   即    |     jí      |   Tức    | `皀` (mâm cơm) + `卩`   | [Tra bộ 卩] Người quỳ (`卩`) tiến sát lại bên mâm thức ăn (`皀`) → lập tức, ngay, tức là (立即 lìjí: lập tức, 即使 jíshǐ: cho dù, 即将 jíjiāng: sắp sửa).      |
|   却    |     què     |  Khước   | `去` + `卩`             | [Tra bộ 卩] Chữ cổ là `谷 + 卩` (nhượng bộ lùi lại), nay viết `去 + 卩` → nhưng, lại, từ chối, rút lui (可是/却 què: nhưng mà, 冷却 lěngquè: làm nguội, 推却). |
|   卸    |     xiè     |    Tá    | `午` + `止` + `卩`      | [Tra bộ 卩] Cởi bỏ yên cương ngựa chiến hoặc dỡ hàng hóa → tháo dỡ, bốc dỡ, trút bỏ (卸货 xièhuò: dỡ hàng, 推卸 tuīxiè: thoái thác, 拆卸 chāixiè: tháo rời).   |
|   卷    | juǎn / juàn |  Quyển   | `龹` + `⺋` (dạng cong) | [Tra bộ 卩] Hai tay cuộn tròn vật lại (`⺋` cong ở đáy) → cuộn, cuốn (`juǎn`: 卷发 juǎnfà tóc xoăn, 春卷); quyển/đề thi (`juàn`: 试卷 shìjuàn, 胶卷).          |

### Nhóm C: Trạng thái nguy hiểm & vật thể xếp bộ `卩`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                     |
| :-----: | :----: | :------: | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   危    |  wēi   |   Nguy   | `⺈` + `厂` + `⺋`      | [Tra bộ 卩] Người (`⺈`) đứng cheo leo trên vách đá cao (`厂`) mà cúi mình (`⺋`) → nguy hiểm, cao chót vót (危险 wēixiǎn: nguy hiểm, 危机 wēijī: khủng hoảng).    |
|   卵    |  luǎn  |   Noãn   | Hai mảnh trứng đối xứng | [Tra bộ 卩] Tượng hình buồng trứng / hai hạt trứng cá/chim xếp đối nhau (hình nét giống hai `卩` mở đối xứng) → trứng (卵巢 luǎncháo: buồng trứng, 卵石: đá cuội). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `节 / 節` (`jié` · Tiết — đốt tre, tiết học, ngày lễ; giản thể viết `艹 + 卩` nhưng tra bộ `艸/艹` #140, phồn thể tra `竹`).
- `犯` (`fàn` · Phạm · `犭 + ⺋` — phạm tội; có dạng cong `⺋` bên phải nhưng tra bộ `犬/犭` #94).
- `令 / 命` (`lìng / mìng` · Lệnh / Mệnh — ra lệnh, sinh mệnh; chứa `卩` biến dạng ở đáy hoặc bên phải nhưng tra bộ `人` #9 và `口` #30).
- `服` (`fú` · Phục · `月 + ⺋ + 又` — quần áo, phục tùng; tra bộ `月` #74).
- `报 / 報` (`bào` · Báo — báo tin, báo đáp; có `卩 + 又` bên phải nhưng tra bộ `手/扌` #64).
- `色` (`sè` · Sắc — màu sắc; đáy giống `⺋/巴` nhưng là bộ thủ riêng #139).
- `邮` (`yóu` · Bưu · `由 + 阝` — bưu điện; `阝` bên phải là bộ Ấp `邑` #163, không phải bộ `卩`).
- `阝 (阜 / 邑)` (`fù / yì` — đứng trái là gò đồi `阜`, đứng phải là vùng đất `邑`, bộ thủ riêng cực dễ nhầm với `卩`).

---

## Bộ 89: 厂 (Hán)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-047` · `radical_index`: `47` · Khang Hy **#27** · `strokes`: `2` nét · `name_vi`: `bộ Hán, Xưởng` · Dòng trùng/rỗng: Có dòng trùng rỗng `radical-112` (`radical_index: 112`, `radical`: `"厂"`, `name_vi: null`) cần gộp/dọn khi chuẩn hóa DB.
- **Hình thái & Biến thể (`variants`):**
  - `厂` — dạng chính (2 nét: `一 丿`, bao góc trên-trái; trong chữ giản thể hiện đại đồng thời là chữ viết tắt của `廠`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **vách núi, sườn đá nhô ra** che chở tự nhiên cho người trú ngụ bên dưới (âm cổ đọc là `hǎn`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Trong cấu tạo chữ cổ thường gợi vách đá, sườn dốc, độ dày/nguồn suối (`原`, `厚`); riêng chữ `厂` (`chǎng`) trong tiếng Trung giản thể hiện đại mang nghĩa **"nhà máy, công xưởng"** do giản hóa từ chữ `廠`, và hàng loạt chữ nhà cửa giản thể (`厅`, `厕`, `厨`, `厢`, `厦`) cũng mượn `厂` thay cho bộ `广` phồn thể (`廳`, `廁`, `廚`, `廂`, `廈`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `厂` thường gợi vách đá, chỗ che tự nhiên, độ sâu dày (`原`, `厚`); trong chữ giản thể hiện đại rất hay liên quan đến nhà xưởng, phòng ốc hoặc lực ép (`厅`, `厨`, `厕`, `压`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`厂` (Hán / Xưởng, 2 nét) vs `广` (Nghiễm, 3 nét):**
      - `厂` (`一 丿`) **KHÔNG có nét chấm trên đỉnh**, nghĩa gốc là **vách núi / sườn đá tự nhiên** (nay mượn làm chữ "nhà máy" `chǎng`).
      - `广` (`丶 一 丿`, Khang Hy #53) **CÓ một nét chấm `丶` trên đỉnh**, nghĩa gốc là **nhà cửa có mái che nhân tạo** (`店`, `库`, `床`, `座`, `庭`), đồng thời là chữ giản thể của `廣` ("rộng").
    - **`厂` vs `尸`:** `尸` (bộ Thi #44, 3 nét) có đầu khép thành ô vuông (`𠃍 一 丿`), còn `厂` (2 nét) chỉ là góc mở `一 丿`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Vách đá, nguồn gốc, mức độ & chữ thuần bộ `厂` Khang Hy

| Chữ Hán |   Pinyin    |  Hán Việt   | Thiên bàng đứng chung        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                      |
| :-----: | :---------: | :---------: | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   厂    | chǎng / hǎn | Xưởng / Hán | Độc thể (giản của `廠`)      | [Tra bộ 厂] Âm cổ `hǎn` nghĩa là vách đá; hiện đại giản hóa từ `廠` đọc `chǎng` nghĩa là nhà máy, xưởng (工厂 gōngchǎng: nhà máy, 厂长 chǎngzhǎng: giám đốc xưởng). |
|   原    |    yuán     |   Nguyên    | `厂` + `白` + `小` (`泉` cổ) | [Tra bộ 厂] Dòng suối (`泉`) chảy ra từ khe vách đá (`厂`) → nguồn gốc, nguyên thủy, đồng bằng rộng (原来 yuánlái: hóa ra/vốn dĩ, 原因 yuányīn: nguyên nhân, 高原). |
|   厚    |     hòu     |     Hậu     | `厂` + `日` + `子`           | [Tra bộ 厂] Lớp đá vách núi dày nặng (hợp khối dưới `厂`) → dày, hậu hĩnh, sâu sắc (厚重 hòuzhòng: dày nặng, 厚度 hòudù: độ dày, 厚道 hòudao: chất phác).           |
|   厄    |      è      |     Ách     | `厂` + `㔾`                  | [Tra bộ 厂] Người bị dồn kẹt dưới vách đá chật hẹp → tai ách, khốn khổ, cửa ải hiểm (厄运 èyùn: vận rủi, 困厄 kùn'è: khốn đốn).                                     |
|   厉    |     lì      |     Lệ      | `厂` + `万` (phồn `厲`)      | [Tra bộ 厂] Phồn thể vẽ con bọ cạp ẩn dưới vách đá/đá mài dao sắc → mài sắc, nghiêm khắc, dữ dội (厉害 lìhai: lợi hại/ghê gớm, 严厉 yánlì: nghiêm khắc).            |
|   厌    |     yàn     |     Yếm     | `厂` + `犬` (phồn `厭`)      | [Tra bộ 厂] Phồn thể là thịt chó đè ép dưới đá → no chán, ghét bỏ (讨厌 tǎoyàn: ghét, 厌倦 yànjuàn: chán nản, 百看不厌: xem mãi không chán).                        |

### Nhóm B: Công trình, phòng ốc giản thể chuyển từ `广` sang bộ `厂`

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                     |
| :-----: | :-------: | :------: | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   厅    |   tīng    |   Sảnh   | `厂` + `丁` (giản của `廳`)    | [Tra bộ 厂 (Tân Hoa giản thể) / 广 (phồn thể `廳`)] Lược phần bên trong, dùng `丁` gợi âm `tīng` → phòng lớn, sảnh, sở ban (客厅 kètīng: phòng khách, 餐厅, 大厅). |
|   厕    |    cè     |    Xí    | `厂` + `则` (giản của `廁`)    | [Tra bộ 厂 (Tân Hoa giản thể) / 广 (phồn thể `廁`)] Nhà phụ đặt ở cạnh bên → nhà vệ sinh (厕所 cèsuǒ: nhà vệ sinh, 公厕 gōngcè: nhà vệ sinh công cộng).            |
|   厨    |    chú    |   Trù    | `厂` + `豆` + `寸` (giản `廚`) | [Tra bộ 厂 (Tân Hoa giản thể) / 广 (phồn thể `廚`)] Gian nhà nấu nướng → nhà bếp, đầu bếp (厨房 chúfáng: nhà bếp, 厨师 chúshī: đầu bếp).                           |
|   厢    |   xiāng   |  Sương   | `厂` + `相` (giản của `廂`)    | [Tra bộ 厂 (Tân Hoa giản thể) / 广 (phồn thể `廂`)] Gian nhà hai bên sân, toa tàu, buồng riêng (车厢 chēxiāng: toa xe, 包厢 bāoxiāng: phòng riêng).                |
|   厦    | shà / xià |    Hạ    | `厂` + `夏` (giản của `廈`)    | [Tra bộ 厂 (Tân Hoa giản thể) / 广 (phồn thể `廈`)] Tòa nhà lớn cao tầng (`shà`: 大厦 dàshà); đọc `Xià` trong tên thành phố Hạ Môn (`厦门` Xiàmén).                |

### Nhóm C: Thời gian, đơn vị & lực đè ép xếp bộ `厂` trong Tân Hoa

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                              |
| :-----: | :-----: | :------: | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   历    |   lì    |   Lịch   | `厂` + `力` (giản của `歷` / `曆`) | [Tra bộ 厂 (Tân Hoa giản thể) / 止・日 (phồn `歷/曆`)] Trải qua, lịch sử, quyển lịch (历史 lìshǐ: lịch sử, 经历 jīnglì: trải qua, 日历 rìlì: lịch ngày).    |
|   厘    | lǐ / lí |    Ly    | `厂` + `里` (giản của `釐`)        | [Tra bộ 厂 (Tân Hoa giản thể) / 里 (phồn thể `釐`)] Đơn vị đo rất nhỏ, phân định (厘米 límǐ: xăng-ti-mét, 毫厘 háolí: mảy may).                             |
|   压    | yā / yà |    Áp    | `厂` + `土` (giản của `壓`)        | [Tra bộ 厂 hoặc 土 (Tân Hoa giản thể) / 土 (phồn thể `壓`)] Đất đá đè xuống → đè, nén, áp lực (压力 yālì: áp lực, 压迫 yāpò: áp bức, 电压 diànyā: điện áp). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `广` (`guǎng` · Nghiễm — nhà có mái che nhân tạo; có chấm trên đỉnh, là bộ thủ riêng #53 rất dễ nhầm với `厂`).
- `石` (`shí` · Thạch — đá; chứa góc `厂` ôm lấy `口` dưới vách đá, là bộ thủ riêng #112).
- `愿` (`yuàn` · Nguyện · `原 + 心` — mong muốn; chứa `原` mang `厂` nhưng tra bộ `心` #61).
- `灰 / 碳` (`huī / tàn` — tro / than đá; có nét mở góc trên-trái giống `厂` nhưng tra bộ `火` #86 và bộ `石` #112).
- `反` (`fǎn` · Phản — lật lại, phản đối; mở đầu bằng góc giống `厂` nhưng tra bộ `又` #29).
- `产` (`chǎn` · Sản — sản xuất; bên trong có hình giống `厂` nhưng tra bộ `亠` #8).

---

## Bộ 90: 厶 (Tư)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-100` · `radical_index`: `100` · Khang Hy **#28** · `strokes`: `2` nét · `name_vi`: `bộ Tư` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `厶` — dạng chính (2 nét: `𠃋 丶`, nét phẩy gập ngang chéo rồi chốt bằng một dấu chấm).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Chữ gốc biểu thị **"riêng tư, cá nhân"** (có thuyết giải là hình cánh tay uốn cong ôm vật gì về cho riêng mình, hoặc kén tằm cuộn tròn giữ cho riêng; sau viết tách nghĩa thành `私`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Riêng tư, cá nhân (`私`); trong đa số chữ ghép hiện đại chứa `厶` (`去`, `台`, `参`, `县`, `云`, `能`), `厶` chủ yếu đóng vai trò linh kiện hình/âm chứ không còn giữ nghĩa "riêng tư".
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `厶` có thể liên quan đến cái riêng/cá nhân trong trường hợp cổ (`私`, đối lập với `公`), nhưng phần lớn cần học theo cấu tạo từng chữ cụ thể.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`厶` (Tư) vs `私` (Tư):** `厶` là chữ gốc cổ của nghĩa "riêng tư"; `私` (`禾 + 厶`, tra bộ `禾` #115) mới là chữ hiện đại thông dụng nhất mang nghĩa "riêng tư" (`私人`, `自私`).
    - **`厶` vs `么` (Ma):** `么` (3 nét, tra bộ `丿` #4) có thêm nét phẩy `丿` ở trên đầu `厶` (dùng trong `什么`, `怎么`).
    - **`厶` vs `ム` (Katakana Nhật):** Chữ katakana _mu_ (`ム`) trong tiếng Nhật nhìn giống `厶`, nhưng thuộc hệ âm tiết Nhật, không dùng trong phân tích chữ Hán.
    - **`厶` vs `公` (Công):** Trong cách nhớ truyền thống, `公` (`八 + 厶`, tra bộ `八` #12) được lý giải là chia đều (`八`) cái riêng (`厶`) thành cái **chung/công bằng**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Riêng tư, rời đi & chồng chất thuần bộ `厶`

| Chữ Hán |  Pinyin  | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                           |
| :-----: | :------: | :------: | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   厶    | sī / mǒu | Tư / Mỗ  | Độc thể (Bộ thủ chính) | [Tra bộ 厶] Chữ cổ của `私` (riêng tư, cá nhân) và chữ cổ của `某` (`mǒu` — nào đó).                                                                                     |
|   去    |    qù    |   Khứ    | `土` + `厶`            | [Tra bộ 厶] Cổ tự vẽ người (`大`) bước qua khỏi miệng hố/cửa hang (`口/凵`) → đi, rời khỏi, đã qua (去哪儿 qù nǎr: đi đâu, 去年 qùnián: năm ngoái, 过去 guòqù: quá khứ). |
|   厽    |   lěi    |   Lũy    | Ba hình `厶` chồng lên | [Tra bộ 厶] Hình ba cục đất/vật chất chồng chất lên nhau → đắp lũy đất (là linh kiện cấu tạo trong chữ `累` lěi/lèi mệt/tích lũy, `垒` lěi thành lũy).                   |

### Nhóm B: Tham gia, số đếm & hành chính xếp bộ `厶`

| Chữ Hán |      Pinyin      |  Hán Việt  | Thiên bàng đứng chung        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| :-----: | :--------------: | :--------: | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   参    | cān / shēn / cēn | Tham / Sâm | `厶` + `大` + `彡` (`參`)    | [Tra bộ 厶] Cổ tự vẽ chòm sao Sâm ba ngôi sáng trên đầu người → tham gia, tham khảo (`cān`: 参加 cānjiā, 参考 cānkǎo); nhân sâm (`shēn`: 人参); so le (`cēn`: 参差). |
|   叁    |       sān        |    Tam     | `厶` + `大` + `三` (`參/叁`) | [Tra bộ 厶] Chữ số "ba (3)" viết hoa chống sửa đổi dùng trên chứng từ, hóa đơn tài chính (叁元 sān yuán: ba đồng, 壹贰叁: 1, 2, 3 viết hoa).                         |
|   县    |       xiàn       |   Huyện    | `且` + `ㄥ` (giản của `縣`)  | [Tra bộ 厶 (Tân Hoa giản thể) / 糸 (phồn thể `縣`)] Lược phần bên phải và dây treo của `縣` → đơn vị hành chính huyện (县城 xiànchéng: huyện lỵ, 知县 zhīxiàn).      |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `私` (`sī` · Tư · `禾 + 厶` — riêng tư, cá nhân; giữ rõ nhất nghĩa gốc của `厶` nhưng tra bộ `禾` #115).
- `公` (`gōng` · Công · `八 + 厶` — công cộng, công bằng; đối nghĩa với `厶`, tra bộ `八` #12).
- `台 / 臺` (`tái` · Đài · `厶 + 口` — bệ, sân khấu, Đài Loan; tra bộ `口` #30 trong Khang Hy và nhiều bảng Tân Hoa, một số từ điển xếp ở `厶`).
- `云 / 雲` (`yún` · Vân · `二 + 厶` — mây; giản thể lấy phần mây cuộn dưới thành `厶`, tra bộ `二` #7).
- `允 / 充` (`yǔn / chōng` · Doãn / Sung — cho phép / đầy đủ; đều chứa `厶` nhưng tra bộ `儿` #10).
- `能 / 育` (`néng / yù` · Năng / Dục — có thể / nuôi dạy; đều chứa `厶` nhưng tra bộ `肉/月` #130).
- `宏 / 雄 / 鬼` (`hóng / xióng / guǐ` — to lớn / hùng mạnh / ma quỷ; chứa `厶` nhưng tra theo các bộ `宀`, `隹`, `鬼`).
- `始 / 治 / 流` (`shǐ / zhì / liú` — bắt đầu / trị vì / trôi chảy; đều có `厶` trong thành phần phải nhưng tra theo các bộ `女`, `水/氵`).
- `矣 / 牟` (`yǐ / móu` — trợ từ ngữ khí cổ / mưu cầu; có `厶` ở đầu nhưng tra bộ `矢` #111 và bộ `牛` #93).
