# Nhóm E — 14 Bộ Thủ & Linh Kiện Mở Rộng Có Sẵn Trong DB (Bộ 215 – Bộ 228)

Tài liệu biên soạn chi tiết **14 mục bộ thủ / linh kiện mở rộng** đã có sẵn dữ liệu trong bảng `public.hanzihome_radicals` (mã thứ tự từ **Bộ 215 đến Bộ 228**, nằm **ngoài 214 bộ thủ Khang Hy chuẩn**). Trong lộ trình HanziHome, các mục này giúp người học nhận diện nhanh những thành phần cấu chữ hoặc thanh phù xuất hiện rất nhiều trong chữ Hán thông dụng (`每, 海, 夫, 云, 天, 声, 勺, 匹, 厄, 迅, 凶, 凡, 戊, 民, 既…`).

> **Nguyên tắc đối chiếu trung thực (chống nhầm tra từ điển):**
>
> - Cả 14 mục trong tài liệu này đều là **`[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`** (trừ `旡` là biến thể phụ gộp trong bộ `无` #71 của Khang Hy).
> - Trong **Mục 1**, mỗi bài đều ghi đúng **DB ID, `radical_index`, `strokes`, `name_vi` nguyên văn từ DB** kèm **bộ thủ Khang Hy gốc của chính chữ đó**.
> - Trong **Mục 2**, bảng chữ trình bày rõ vai trò thực tế của thành phần đang xét (**gốc nghĩa / linh kiện cấu chữ / thanh phù / giản hóa từ phồn thể**) và ghi rõ **`[Tra bộ Khang Hy: ...]`** của từng chữ để người học vừa nhớ nhanh theo linh kiện, vừa tra cứu từ điển chính xác.

| STT | Bộ / Linh kiện | Hán-Việt | DB ID chính   | `radical_index` | Số nét DB | `name_vi` nguyên văn trong DB                                               | Bộ thủ Khang Hy gốc của chính chữ đó                               |
| :-: | :------------: | -------- | ------------- | :-------------: | :-------: | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 215 |       母       | Mẫu      | `radical-059` |       59        |     5     | `bộ Mẫu`                                                                    | Bộ **Vô `毋` (#80)**                                               |
| 216 |       夫       | Phu      | `radical-060` |       60        |     4     | `bộ Phu`                                                                    | Bộ **Đại `大` (#37)**                                              |
| 217 |       云       | Vân      | `radical-069` |       69        |     4     | `bộ Vân`                                                                    | `云` thuộc bộ **Nhị `二` (#7)**; `雲` thuộc bộ **Vũ `雨` (#173)**  |
| 218 |       天       | Thiên    | `radical-071` |       71        |     4     | `bộ Thiên`                                                                  | Bộ **Đại `大` (#37)**                                              |
| 219 |    声 / 聲     | Thanh    | `radical-086` |       86        |     7     | `thường học là “thanh/tiếng”; trong Khang Hy liên quan chữ 聲 phức tạp hơn` | `声` thuộc bộ **Sĩ `士` (#33)**; `聲` thuộc bộ **Nhĩ `耳` (#128)** |
| 220 |       勺       | Chước    | `radical-105` |       105       |     3     | `bộ Chước / Thược**`                                                        | Bộ **Bao `勹` (#20)**                                              |
| 221 |       匹       | Thất     | `radical-108` |       108       |     4     | `bộ Thất / Sơ nghĩa là đôi-ngang hàng, về sau lượng từ**`                   | Bộ **Hệ `匸` (#23)** (tự điển Giản thể gộp về **Phương `匚` #22**) |
| 222 |       厄       | Ách      | `radical-110` |       110       |     4     | `bộ Ách**`                                                                  | Bộ **Hán `厂` (#27)**                                              |
| 223 |       卂       | Tấn      | `radical-111` |       111       |     3     | `bộ Tấn / bay nhanh**`                                                      | Bộ **Thập `十` (#24)**                                             |
| 224 |       凶       | Hung     | `radical-115` |       115       |     4     | `bộ Hung`                                                                   | Bộ **Khảm `凵` (#17)**                                             |
| 225 |       凡       | Phàm     | `radical-116` |       116       |     3     | `bộ Phàm`                                                                   | Bộ **Kỷ `几` (#16)**                                               |
| 226 |       戊       | Mậu      | `radical-118` |       118       |     5     | `bộ Mậu`                                                                    | Bộ **Qua `戈` (#62)**                                              |
| 227 |       民       | Dân      | `radical-132` |       132       |     5     | `bộ Dân`                                                                    | Bộ **Thị `氏` (#83)**                                              |
| 228 |       旡       | Ký       | `radical-134` |       134       |     4     | `bộ Ký / Ký vô`                                                             | Biến thể phụ của bộ **Vô `无` (#71)**                              |

---

## Bộ 215: 母 (Mẫu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-059` · `radical_index`: `59` · `strokes`: `5` nét · `name_vi`: `bộ Mẫu` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `母`:** Thuộc bộ **Vô `毋` (#80)** (`毋` 4 nét, `母` 5 nét xếp ở mục `+1` nét dưới bộ `毋`; trong một số từ điển Giản thể hiện đại có thể xếp mục tra 5 nét riêng cho `母`).
- **Hình thái & Biến thể (`variants`):**
  - `母` — dạng chính (5 nét: `𡿨 𠃌 丶 一 丶`), có khung gần hình chữ nhật và **hai chấm nhỏ** ở trên và dưới nét ngang giữa.
  - `毋` — bộ thủ Khang Hy riêng (#80, 4 nét, nghĩa “đừng/chớ”); nhìn gần `母` nhưng không có hai chấm rời mà là một nét sổ/phẩy xuyên thẳng qua giữa.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình người phụ nữ (tương tự `女`) có thêm hai dấu nhấn ở bầu ngực, biểu thị “người mẹ, người sinh dưỡng”.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Nghĩa gốc là mẹ, giống cái (`母鸡`: gà mái, `母校`: trường cũ); mở rộng sang nguồn sinh ra, thành phần gốc, khuôn mẫu (`字母`: chữ cái, `分母`: mẫu số, `酵母`: men cái).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Chứa `母` có thể liên quan đến mẹ, sinh sản/nuôi dưỡng, nguồn gốc; tuy nhiên trong rất nhiều chữ ghép thông dụng (`海, 梅, 侮, 悔, 敏`), `母` nằm trong thành phần `每` (`𠂉 + 母`) và đóng vai trò **thanh phù hoặc linh kiện cấu chữ**, không mang nghĩa “mẹ”.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`母` = mẹ** (5 nét, có 2 chấm trên và dưới nét ngang) vs **`毋` = đừng/chớ** (4 nét, bộ riêng #80, nét phẩy xuyên thẳng qua khung).
    - **`母` vs `女` (Nữ, #38):** `女` chỉ nữ giới nói chung, là bộ thủ chính (3 nét); `母` nhấn nghĩa người mẹ/nguồn gốc.
    - **`每` chứa `母` nhưng nghĩa hiện đại là “mỗi”:** Không nên đoán nghĩa chữ chứa `每` (`海, 梅, 悔`) là “mẹ”.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ trực tiếp mang `母` (ý mẹ, sinh dưỡng, gốc rễ & biến dạng `毋/母`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                          |
| :-----: | :----: | :------: | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   母    |   mǔ   |   Mẫu    | Độc thể (5 nét)               | `[Tra bộ Khang Hy: 毋 (#80)]` Tượng hình người mẹ cho con bú; nghĩa: mẹ, giống cái, nguồn gốc, khuôn mẫu; _từ ghép:_ 母亲 (mǔqīn: mẹ), 字母 (zìmǔ: chữ cái), 母校 (mǔxiào: trường cũ).                                  |
|   姆    |   mǔ   | Mỗ / Mẫu | `女` (Nữ) + `母` (`mǔ`)       | `[Tra bộ Khang Hy: 女 (#38)]` Hình thanh kiêm ý: phụ nữ (`女`) có vai trò chăm sóc như người mẹ (`母`, thanh phù `mǔ`) → bảo mẫu, cô giữ trẻ; _từ ghép:_ 保姆 (bǎomǔ: bảo mẫu/người giúp việc).                         |
|   拇    |   mǔ   |   Mẫu    | `扌` (Thủ) + `母` (`mǔ`)      | `[Tra bộ Khang Hy: 手/扌 (#64)]` Hình thanh kiêm hội ý: ngón “mẹ” (to nhất) trên bàn tay (`扌`) + `母` (`mǔ`, thanh phù) → ngón tay cái / ngón chân cái; _từ ghép:_ 拇指 (mǔzhǐ: ngón cái), 大拇指 (dàmǔzhǐ).           |
|   毒    |   dú   |   Độc    | Phần đầu cỏ rậm + `母` (`毋`) | `[Tra bộ Khang Hy: 毋 (#80)]` Cổ tự phần đáy là `毋` (trong Khải/Giản thể hiện đại thường viết thành `母` có 2 chấm); nghĩa gốc cỏ độc mọc dày hại người → chất độc, tàn độc; _từ ghép:_ 病毒 (bìngdú), 中毒 (zhòngdú). |
|   毓    |   yù   |   Dục    | `每` (chứa `母`) + `㐬`       | `[Tra bộ Khang Hy: 毋 (#80)]` Hội ý cổ: người mẹ (`每/母`) sinh nở và nuôi dưỡng đứa trẻ (`㐬`) → sinh thành, nuôi dưỡng, bồi đắp nhân tài; _từ ghép:_ 钟灵毓秀 (zhōnglíng-yùxiù: địa linh sinh nhân kiệt).             |

### Nhóm B: Chữ dùng `每` (`𠂉 + 母`) làm thành phần cấu chữ & thanh phù

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                       |
| :-----: | :----: | :------: | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   每    |  měi   |   Mỗi    | `𠂉` + `母`                    | `[Tra bộ Khang Hy: 毋 (#80)]` Cổ tự vẽ người mẹ đội trâm cài đầu (hoặc mầm cỏ đội lên), nghĩa gốc “cỏ mọc tươi tốt”; sau chuyển thành từ chỉ tần suất/phân phối: mỗi, từng; _từ ghép:_ 每天 (měitiān), 每次 (měicì). |
|   海    |  hǎi   |   Hải    | `氵` (Thủy) + `每` (chứa `母`) | `[Tra bộ Khang Hy: 水/氵 (#85)]` Hình thanh: `氵` (nước) + `每` (thanh phù cổ gợi vùng nước lớn, không mang nghĩa “mẹ”) → biển cả, đại dương; _từ ghép:_ 大海 (dàhǎi: biển lớn), 上海 (Shànghǎi: Thượng Hải).        |
|   梅    |  méi   |   Mai    | `木` (Mộc) + `每` (chứa `母`)  | `[Tra bộ Khang Hy: 木 (#75)]` Hình thanh: `木` (cây cối) + `每` (`měi` → `méi`, thanh phù) → cây hoa mai, quả mơ/mận; _từ ghép:_ 梅花 (méihuā: hoa mai), 乌梅 (wūméi: ô mai).                                        |
|   悔    |  huǐ   |   Hối    | `忄` (Tâm) + `每` (chứa `母`)  | `[Tra bộ Khang Hy: 心/忄 (#61)]` Hình thanh: `忄` (tâm trạng) + `每` (`měi` → `huǐ`, thanh phù) → ăn năn, hối hận; _từ ghép:_ 后悔 (hòuhuǐ: hối hận), 悔改 (huǐgǎi: hối cải).                                        |
|   侮    |   wǔ   |    Vũ    | `亻` (Nhân) + `每` (chứa `母`) | `[Tra bộ Khang Hy: 人/亻 (#9)]` Hình thanh: `亻` (con người) + `每` (thanh phù cổ chuyển thành `wǔ`) → khinh miệt, sỉ nhục; _từ ghép:_ 侮辱 (wǔrǔ: sỉ nhục), 欺侮 (qīwǔ: ức hiếp).                                   |
|   敏    |  mǐn   |   Mẫn    | `每` (chứa `母`) + `攵` (Phộc) | `[Tra bộ Khang Hy: 攴/攵 (#66)]` Hình thanh kiêm hội ý: tay thao tác nhanh (`攵`) + `每` (thanh phù cổ) → nhanh nhẹn, nhạy bén, mẫn cảm; _từ ghép:_ 敏捷 (mǐnjié: nhanh nhẹn), 敏感 (mǐngǎn: nhạy cảm).              |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`每` (Mỗi — từ DB):** Thường phân tích học nhớ là `𠂉 + 母`; trong tiếng Trung hiện đại mang nghĩa “mỗi, từng” (`每天`), làm thanh phù cho `海, 梅, 悔, 侮, 敏`.
- **`侮` (Vũ — từ DB):** Khinh thường/sỉ nhục (`亻 + 每`), `每` (chứa `母`) đóng vai trò phần âm, tra ở bộ Nhân `人/亻` (#9).
- **`海` (Hải — từ DB):** Biển (`氵 + 每`), thuộc bộ Thủy `水/氵` (#85), không tra ở bộ `母` hay `毋`.
- **`女` (Nữ — từ DB):** Bộ thủ riêng (#38) chỉ nữ giới nói chung, cùng trường nghĩa gia đình với `母`.
- **`毋` (Vô, #80) & `贯 / 貫` (Quán):** `毋` (4 nét, không có 2 chấm) nghĩa “đừng/chớ” là bộ thủ Khang Hy gốc quản lý chữ `母`. Chữ `贯` (xâu tiền, quán triệt) có phần trên là `毌` (một nét ngang xuyên qua hai khung, không có hai chấm như `母`), thuộc bộ Bối `貝/贝` (#154) — cần tránh nhầm phần trên của `贯` với `母`.

---

## Bộ 216: 夫 (Phu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-060` · `radical_index`: `60` · `strokes`: `4` nét · `name_vi`: `bộ Phu` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `夫`:** Thuộc bộ **Đại `大` (#37)** (`大` 3 nét; `夫` 4 nét xếp mục `+1` nét dưới bộ `大`).
- **Hình thái & Biến thể (`variants`):**
  - `夫` — dạng chính duy nhất (4 nét: `一 一 丿 ㇏`); nét phẩy `丿` xuất phát từ phía trên nét ngang đầu tiên rồi xiên xuống.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Dựa trên hình người lớn dang tay (`大`) thêm một nét ngang vắt qua đỉnh đầu, tượng trưng cây trâm cài búi tóc của người đàn ông khi làm lễ đội mũ trưởng thành thời cổ.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ người đàn ông trưởng thành, người chồng (`丈夫, 夫妻`), người lao động theo nghề (`农夫, 渔夫`); đọc `fú` trong văn ngôn làm trợ từ đầu câu hoặc đại từ chỉ định (“còn như, kẻ ấy”).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `夫` có thể gợi người đàn ông/chồng, nhưng trong chữ ghép hiện đại (`扶, 肤, 麸`) thường làm **thanh phù** _fū / fú_, hoặc làm linh kiện trong chữ hội ý/giản thể (`规, 替, 潜`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`夫` (Phu) vs `天` (Thiên):** Cả hai đều 4 nét; `夫` có nét phẩy giữa **nhô cao vượt lên trên** nét ngang thứ nhất; `天` có nét phẩy bắt đầu từ nét ngang thứ nhất, **không nhô lên trên**.
    - **`夫` vs `大` (Đại, #37):** `大` có 3 nét, nghĩa “to lớn”.
    - **`夫` vs `失` (Thất):** `失` (5 nét, bộ `大` #37) có nét phẩy ngắn ở góc trên bên trái tách riêng rồi mới tới hai nét ngang, nghĩa “mất”.
    - **`夫` vs `父` (Phụ, #88):** `父` (4 nét) nghĩa “cha”, gồm hai nét mở phía trên và chữ `乂` chéo ở dưới.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ `夫` gốc & chữ dùng `夫` làm thanh phù `fū / fú`

| Chữ Hán | Pinyin  | Hán Việt | Thành phần ghép cùng      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                   |
| :-----: | :-----: | :------: | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   夫    | fū / fú |   Phu    | Độc thể (`大` + nét trâm) | `[Tra bộ Khang Hy: 大 (#37)]` Đàn ông trưởng thành, chồng, người lao động (`fū`: 夫妻 fūqī vợ chồng, 农夫 nóngfū nông dân); trợ từ văn ngôn (`fú`: 若夫 ruòfú còn như).                                          |
|   扶    |   fú    |   Phù    | `扌` (Thủ) + `夫` (`fú`)  | `[Tra bộ Khang Hy: 手/扌 (#64)]` Hình thanh kiêm hội ý: dùng tay (`扌`) nâng đỡ người (`夫`, thanh phù `fú`) → dìu, vịn, nâng đỡ, giúp đỡ; _từ ghép:_ 扶手 (fúshǒu: tay vịn), 扶贫 (fúpín: giúp đỡ người nghèo). |
|   肤    |   fū    |   Phu    | `月` (Nhục) + `夫` (`fū`) | `[Tra bộ Khang Hy: 肉/月 (#130)]` Hình thanh giản thể (`膚` phồn thể): `月` (da thịt) + `夫` (`fū`, thanh phù viết gọn) → làn da; _từ ghép:_ 皮肤 (pífū: làn da), 护肤 (hùfū: dưỡng da).                         |
|   麸    |   fū    |   Phu    | `麦` (Mạch) + `夫` (`fū`) | `[Tra bộ Khang Hy: 麥/麦 (#199)]` Hình thanh (Phồn thể: `麩`): `麦` (lúa mì) + `夫` (`fū`, thanh phù) → vỏ cám lúa mì; _từ ghép:_ 麦麸 (màifū: cám lúa mì).                                                      |

### Nhóm B: Chữ dùng `夫` (hoặc song `夫`) làm linh kiện hội ý & giản thể

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                 |
| :-----: | :----: | :------: | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   规    |  guī   |   Quy    | `夫` + `见` (`見`, Kiến)               | `[Tra bộ Khang Hy: 見/见 (#147)]` Hội ý cổ (Phồn thể: `規`): người giữ chuẩn mực (`夫`) xem xét đo đạc (`见`) → cái compa, quy tắc, quy định; _từ ghép:_ 规则 (guīzé: quy tắc), 规划 (guīhuà: quy hoạch).      |
|   替    |   tì   |   Thế    | Hai `夫` song song + `曰`              | `[Tra bộ Khang Hy: 曰 (#73)]` Hội ý cổ: hai người (`夫 + 夫`) đứng bên cạnh thay chỗ cho nhau → thay thế, làm thay, suy tàn; _từ ghép:_ 代替 (dàitì: thay thế), 替补 (tìbǔ: dự bị/thay thế).                   |
|   潜    |  qián  |   Tiềm   | `氵` (Thủy) + `替` (giản hóa cho `朁`) | `[Tra bộ Khang Hy: 水/氵 (#85)]` Hình thanh giản thể (`潛` phồn thể dùng `朁`): dùng `替` (chứa song `夫`) viết gọn + `氵` (nước) → lặn sâu, ẩn kín; _từ ghép:_ 潜水 (qiánshuǐ: lặn), 潜力 (qiánlì: tiềm lực). |
|   辇    |  niǎn  |   Liễn   | Hai `夫` trên + `车` (`車`, Xa) dưới   | `[Tra bộ Khang Hy: 車/车 (#159)]` Hội ý (Phồn thể: `輦`): hai người (`夫 + 夫`) kéo cỗ xe (`车`) → xe kéo tay thời xưa (dành cho vua chúa); _từ ghép:_ 辇车 (niǎnchē: xe liễn).                                |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`夫妻` (vợ chồng) & `夫人` (phu nhân/bà) — từ DB:** Các từ ghép lõi giữ trực tiếp nghĩa “chồng / đàn ông trưởng thành” của `夫`.
- **`失` (Thất — từ DB):** Mất (`失去`), 5 nét (thêm nét phẩy ngắn ở đầu trái so với `夫`), thuộc bộ Đại `大` (#37); không nhập vào `夫` dù hình dáng gần nhau.
- **`天` (Thiên — từ DB):** Trời, 4 nét, khác `夫` ở đỉnh nét phẩy (`天` không xuyên lên trên nét ngang đầu).
- **`大` (Đại — từ DB):** Bộ thủ riêng (#37), to lớn; là bộ gốc chứa cả `夫` lẫn `天` và `太`.
- **`父` (Phụ, #88) & `矢` (Thỉ, #111):** `父` nghĩa “cha” (hai nét mở ở đầu, nét chéo dưới); `矢` nghĩa “mũi tên” (5 nét như `失`, nét đầu là phẩy ngắn nhưng nét phẩy giữa dừng lại ở nét ngang thứ hai).

---

## Bộ 217: 云 (Vân)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-069` · `radical_index`: `69` · `strokes`: `4` nét · `name_vi`: `bộ Vân` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `云`:** Chữ `云` (4 nét) thuộc bộ **Nhị `二` (#7)** (`二` 2 nét + `厶` 2 nét = 4 nét); còn dạng phồn thể `雲` (12 nét) thuộc bộ **Vũ `雨` (#173)**.
- **Hình thái & Biến thể (`variants`):**
  - `云` — dạng chính (4 nét: `一 一 ㄥ 丶`), đồng thời là chữ giản thể chính thức thay cho `雲`.
  - `雲` — dạng phồn thể của “mây”, gồm bộ `雨` (Vũ — mưa/khí tượng) ở trên + `云` ở dưới.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình làn mây hơi cuộn tròn bốc lên (`云`). Trong cổ văn, `云` từng bị mượn âm để làm động từ “nói rằng” (`人云亦云`), nên chữ cổ thêm `雨` tạo thành `雲` chuyên nghĩa “mây”. Giản thể khôi phục `云` dùng chung.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Mây, đám mây (`白云, 云彩`); trong công nghệ hiện đại chỉ “đám mây / cloud” (`云计算, 云端`); nghĩa văn ngôn vẫn giữ “nói rằng”.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `云 / 雲` có thể liên quan đến mây, hơi khí bốc lên (`魂, 昙`) hoặc âm _yún_; nhưng trong chữ giản thể (`动, 会, 运, 层, 坛`), `云` chỉ là **ký hiệu giản hóa nét** thay thế cho những phần phồn thể rất phức tạp (`重, 會, 軍, 曾, 亶`), tuyệt đối không giải nghĩa theo “mây”.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`云` giản thể = mây** (thay cho `雲`), nhưng trong thành ngữ/văn ngôn (`人云亦云`) nghĩa là “nói rằng”.
    - **Cẩn trọng khi tách chữ giản thể:** `动 (動), 会 (會), 运 (運), 层 (層)` dùng `云` do rút gọn tự dạng chữ thảo/giản thể, không xuất phát từ nghĩa “mây”.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ có `云` mang nghĩa mây, khí hơi & thanh phù `yún`

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                         |
| :-----: | :----: | :------: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 云 / 雲 |  yún   |   Vân    | Độc thể (`云`) / `雨 + 云` | `[Tra bộ Khang Hy: 二 (#7) cho 云 / 雨 (#173) cho 雲]` Tượng hình cuộn mây; nghĩa: mây, điện toán đám mây, (văn ngôn) nói rằng; _từ ghép:_ 白云 (báiyún: mây trắng), 云计算 (yún jìsuàn), 人云亦云.    |
|   芸    |  yún   |   Vân    | `艹` (Thảo) + `云` (`yún`) | `[Tra bộ Khang Hy: 艸/艹 (#140)]` Hình thanh (`蕓` phồn thể hợp nhất về `芸`): `艹` (cỏ cây) + `云` (`yún`, thanh phù) → cỏ thơm (vân hương), đông đảo, đậu cô ve; _từ ghép:_ 芸芸众生, 芸豆 (yúndòu). |
|   昙    |  tán   |   Đàm    | `日` (Nhật) + `云` (`雲`)  | `[Tra bộ Khang Hy: 日 (#72)]` Hội ý (`曇` phồn thể): mây (`云/雲`) che mặt trời (`日`) → trời u ám; mượn phiên âm hoa ưu đàm trong Phật giáo; _từ ghép:_ 昙花一现 (tánhuā-yīxiàn: sớm nở tối tàn).     |
|   魂    |  hún   |   Hồn    | `云` (khí/âm) + `鬼` (Quỷ) | `[Tra bộ Khang Hy: 鬼 (#194)]` Hình thanh kiêm hội ý: luồng khí nhẹ bay bổng như mây (`云`, gợi âm `hún`) gắn với linh thể (`鬼`) → linh hồn, tinh thần; _từ ghép:_ 灵魂 (línghún), 魂魄 (húnpò).      |

### Nhóm B: Chữ giản thể dùng `云` thay cho linh kiện phồn thể nhiều nét

| Chữ Hán |   Pinyin   | Hán Việt | Thành phần ghép cùng             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                          |
| :-----: | :--------: | :------: | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   动    |    dòng    |   Động   | `云` (thay `重`) + `力` (Lực)    | `[Tra bộ Khang Hy: 力 (#19)]` Giản thể từ `動` (`重 + 力`): dùng `云` viết gọn phần `重` + `力` (sức lực) — không mang nghĩa “mây” → chuyển động, hành động; _từ ghép:_ 运动 (yùndòng), 活动 (huódòng). |
|   会    | huì / kuài |   Hội    | `人` + `云` (rút gọn từ `會`)    | `[Tra bộ Khang Hy: 人 (#9) cho 会 / 曰 (#73) cho 會]` Giản thể từ `會`: mượn nét thảo thành `人 + 云` (không phải “người trên mây”) → tụ họp, biết/sẽ (`huì`: 开会, 会说); kế toán (`kuài`: 会计).      |
|   运    |    yùn     |   Vận    | `辶` (Sước) + `云` (thay `軍`)   | `[Tra bộ Khang Hy: 辵/辶 (#162)]` Giản thể từ `運` (`辶 + 軍`): `辶` (di chuyển) + `云` (thanh phù `yún→yùn` thay `軍`) → vận chuyển, vận mệnh; _từ ghép:_ 运气 (yùnqi), 运输 (yùnshū).                 |
|   层    |    céng    |   Tầng   | `尸` (Thi) + `云` (thay `曾`)    | `[Tra bộ Khang Hy: 尸 (#44)]` Giản thể từ `層` (`尸 + 曾`): dùng `云` thay cho `曾` (không phải nghĩa mây) → tầng lầu, lớp, cấp bậc; _từ ghép:_ 一层 (yī céng: một tầng), 层次 (céngcì: tầng bậc).      |
|   坛    |    tán     |   Đàn    | `土` (Thổ) + `云` (thay `亶/曇`) | `[Tra bộ Khang Hy: 土 (#32)]` Giản thể gộp từ `壇` (đàn tế) và `罎` (vò/hũ): `土` + `云` viết gọn; ngày nay thông dụng chỉ diễn đàn, bồn hoa; _từ ghép:_ 论坛 (lùntán: diễn đàn), 花坛 (huātán).        |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`运 / 運` (Vận — từ DB):** Giản thể dùng `辶 + 云`, phồn thể dùng `辶 + 軍`; không nên đoán nghĩa `运` là “mây đi”.
- **`会 / 會` (Hội — từ DB):** Cấu tạo giản thể `会` có phần dưới là `云` do viết tắt chữ thảo của `會`, không liên quan đến mây.
- **`雨` (Vũ — từ DB):** Bộ thủ riêng (#173) chỉ mưa/thời tiết; xuất hiện phía trên `雲` phồn thể để nhấn nghĩa khí tượng.
- **`去` (Khứ) & `厶` (Tư, #28):** Chữ `去` (đi, bộ `厶` #28) có `土` ở trên và `厶` ở dưới, nhìn gần phần đáy của `云` nhưng nét trên hoàn toàn khác (`土` chứ không phải `二`).

---

## Bộ 218: 天 (Thiên)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-071` · `radical_index`: `71` · `strokes`: `4` nét · `name_vi`: `bộ Thiên` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `天`:** Thuộc bộ **Đại `大` (#37)** (`大` 3 nét; `天` 4 nét xếp mục `+1` nét dưới bộ `大`).
- **Hình thái & Biến thể (`variants`):**
  - `天` — dạng chính duy nhất (4 nét: `一 一 丿 ㇏`); nét đầu `一` ngắn hoặc ngang bằng nét thứ hai, nét phẩy `丿` bắt đầu từ nét ngang thứ nhất chứ không nhô đầu lên trên.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Từ hình người đứng dang tay (`大`), chữ cổ nhấn mạnh phần đỉnh phía trên đầu con người (trên đầu người là bầu trời) → nghĩa gốc “đỉnh đầu”, rồi mở rộng thành “trời, bầu trời”.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bầu trời, không gian tự nhiên (`天空, 天气`), ngày/thời gian (`今天, 天天`), thiên nhiên/bẩm sinh (`天然, 天才`), trời đất/thiên mệnh (`天地`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Khi `天` đứng độc lập hoặc làm phần chính thường gợi trời, ngày, thiên nhiên, phía trên cao; khi xuất hiện ở chữ giản thể (`关, 吴, 蚕`) thường là thành phần rút gọn nét thay cho tự dạng phồn thể phức tạp.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`天` (trời/ngày) vs `夫` (chồng/đàn ông):** `天` có đỉnh phẳng (`丿` không nhô qua nét ngang trên cùng); `夫` có nét phẩy giữa đâm xuyên nhô lên trên nét ngang đầu.
    - **`天` vs `大` (lớn, #37) & `太` (quá/rất):** `大` có 3 nét; `太` thêm một chấm ở dưới chứ không thêm nét ngang trên đầu.
    - **`天` vs `夭` (non/yểu — gặp trong `笑`):** `夭` (thuộc bộ `大` #37) có **nét đầu là phẩy nghiêng `丿`**, không phải nét ngang `一` như `天`.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ mang `天` biểu nghĩa trời, không gian hoặc thanh phù `tiān`

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                    |
| :-----: | :----: | :------: | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   天    |  tiān  |  Thiên   | Độc thể (`一` trên + `大` dưới)    | `[Tra bộ Khang Hy: 大 (#37)]` Bầu trời phía trên đầu, thời tiết, ngày, thiên nhiên, bẩm sinh; _từ ghép:_ 天气 (tiānqì: thời tiết), 今天 (jīntiān: hôm nay), 天才 (tiāncái: thiên tài).                                                            |
|   吞    |  tūn   |   Thôn   | `天` + `口` (Khẩu)                 | `[Tra bộ Khang Hy: 口 (#30)]` Hội ý kiêm thanh cổ (`天` gợi âm cổ và vóc người/trời rộng mở, `口` là miệng) → nuốt chửng, chiếm đoạt; _từ ghép:_ 吞咽 (tūnyàn: nuốt), 吞吐 (tūntǔ: nhả nuốt/lưu thông).                                           |
|   昊    |  hào   |   Hạo    | `日` (Nhật) + `天` (Thiên)         | `[Tra bộ Khang Hy: 日 (#72)]` Hội ý: mặt trời (`日`) rọi sáng khắp bầu trời (`天`) → bầu trời mùa hạ rộng lớn, mênh mông; _từ ghép:_ 昊天 (hàotiān: trời cao bao la).                                                                             |
|   添    |  tiān  |  Thiêm   | `氵` (Thủy) + `忝` (gốc `天 + ⺗`) | `[Tra bộ Khang Hy: 水/氵 (#85)]` Hình thanh: `氵` (rót thêm nước) + `忝` (cổ tự dùng `天` làm thanh phù `tiān` + `⺗`; trong Khải/Giản thể nét trên của `忝` thường hơi nghiêng gần `夭`) → thêm vào; _từ ghép:_ 添置 (tiānzhì), 增添 (zēngtiān). |

### Nhóm B: Chữ giản thể dùng `天` & chữ dùng `夭` rất hay bị nhầm là `天` (`笑`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng                           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                      |
| :-----: | :----: | :------: | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   关    |  guān  |   Quan   | `丷` + `天` (giản hóa từ `關`)                 | `[Tra bộ Khang Hy: 八 (#12) cho 关 / 門 (#169) cho 關]` Giản thể thay thế cho `關` (mượn nét giản ước, không giải nghĩa theo “trời”); nghĩa: đóng cửa, cửa ải, liên quan; _từ ghép:_ 关心 (guānxīn), 关系 (guānxi). |
|   吴    |   wú   |   Ngô    | `口` + `天` (Phồn thể: `吳` gồm `口 + 夨`)     | `[Tra bộ Khang Hy: 口 (#30)]` Chữ giản thể/chuẩn hiện đại chuẩn hóa phần đáy chữ `吳` (người nghiêng đầu nói lớn) thành `天`; họ Ngô, nước Ngô; _từ ghép:_ 吴语 (Wúyǔ: tiếng Ngô).                                  |
|   蚕    |  cán   |   Tằm    | `天` + `虫` (Trùng — giản hóa từ `蠶`)         | `[Tra bộ Khang Hy: 虫 (#142)]` Tục thể/giản thể thay phần đầu nhiều nét của `蠶` bằng `天` đặt trên `虫` (côn trùng) → con tằm nhả tơ; _từ ghép:_ 春蚕 (chūncán: tằm xuân), 蚕丝 (cánsī: tơ tằm).                   |
|   笑    |  xiào  |   Tiếu   | `⺮` (`竹`, Trúc) + `夭` (**không phải `天`**) | `[Tra bộ Khang Hy: 竹 (#118)]` Lưu ý quan trọng: phần dưới của `笑` là **`夭` (nét đầu phẩy nghiêng `丿`)**, không phải `天` (`一`); nghĩa: cười, mỉm cười; _từ ghép:_ 微笑 (wēixiào: mỉm cười), 笑话 (xiàohua).    |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`大` (Đại — từ DB):** Bộ thủ gốc (#37) chứa `天`; `大` có 3 nét, thêm 1 nét ngang ở trên đỉnh thành `天` (4 nét).
- **`夫` (Phu — từ DB):** Khác `天` ở nét phẩy giữa đâm nhô lên trên nét ngang đầu tiên.
- **`关` (Quan — từ DB):** Dạng giản thể của `關`, có phần dưới viết thành `天` thuần túy để rút gọn nét, không liên hệ ngữ nghĩa “bầu trời”.
- **`夭` (Yểu — từ DB):** Bộ/chữ riêng thuộc bộ Đại `大` (#37), nét đầu là phẩy nghiêng `丿` (`丿 一 丿 ㇏`), nghĩa gốc là uốn cong/non yểu; là phần dưới của chữ `笑` (`xiào`) và thanh phù của `妖` (`yāo`), `沃` (`wò`).
- **`太` (Thái) & `犬` (Khuyển, #94):** `太` (chấm bên dưới) là “quá, rất”; `犬` (chấm ở góc trên bên phải) là “chó”.

---

## Bộ 219: 声/聲 (Thanh)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-086` · `radical_index`: `86` · `strokes`: `7` nét (số nét của dạng giản thể `声`; dạng phồn thể `聲` có `17` nét) · `name_vi`: `thường học là “thanh/tiếng”; trong Khang Hy liên quan chữ 聲 phức tạp hơn` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `声 / 聲`:**
  - Dạng giản thể **`声`** (7 nét) xếp ở bộ **Sĩ `士` (#33)** (`士` 3 nét + 4 nét = 7 nét).
  - Dạng phồn thể **`聲`** (17 nét) xếp ở bộ **Nhĩ `耳` (#128)** (`耳` 6 nét + `殸` 11 nét = 17 nét).
- **Hình thái & Biến thể (`variants`):**
  - `聲` — dạng phồn thể / truyền thống (17 nét), gồm phần `殸` (cái khánh đá treo trên giá + tay cầm dùi `殳` gõ) ở trên và `耳` (tai nghe) ở dưới.
  - `声` — dạng giản thể thông dụng (7 nét: `士` + phần dưới `尸`-khuyết nét), vốn có nguồn gốc là phần góc trên bên trái của `殸` (vẽ cái khánh đá treo) được tách dùng làm chữ giản thể.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Chữ `聲` ghép hình nhạc khí bằng đá (`声` ở góc trên trái của `殸`), bàn tay cầm dùi gõ (`殳`) và cái tai lắng nghe (`耳`), biểu thị âm thanh phát ra khi gõ nhạc cụ lọt vào tai.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Tiếng động, âm thanh (`声音`), giọng nói (`大声, 小声`), thanh điệu (`声调`), danh tiếng (`名声`), tuyên bố/lên tiếng (`声明`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Trong chữ truyền thống, cụm `殸` (chứa `声` ở góc trên bên trái) thường mang ý nhạc cụ khánh đá hoặc âm thanh vang vọng (`聲, 馨, 磬, 罄`); trong chữ giản thể hiện đại, `声` hầu như đứng độc lập hoặc làm từ ghép (`声音, 声调`) hơn là làm bộ thủ ghép trái-phải.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Trong 214 bộ Khang Hy không có bộ `声`:** `聲` xếp bộ Nhĩ `耳` (#128), còn `声` xếp bộ Sĩ `士` (#33). Bộ chính chỉ âm thanh đơn giản trong Khang Hy là **`音` (#180)**.
    - **`音` (Âm, #180) vs `声` (Thanh):** `音` thiên về âm thanh, âm nhạc, phát âm (`音乐, 发音`); `声` thiên về tiếng vang phát ra, giọng nói, danh tiếng (`声音, 笑声, 名声`).
    - **`声` vs phần đầu `士` của `壳` (vỏ):** Cả hai đều bắt đầu bằng `士` (nét ngang trên dài hơn nét ngang dưới), tránh nhầm phần dưới của `声` với `冖 + 几` của `壳`.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ chứa trực tiếp `声` hoặc phần `殸` (góc trên trái là `声`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                   |
| :-----: | :----: | :------: | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 声 / 聲 | shēng  |  Thanh   | `声` (từ góc trên `殸`) / `殸+耳` | `[Tra bộ Khang Hy: 士 (#33) cho 声 / 耳 (#128) cho 聲]` Gõ khánh đá (`殸`) truyền tới tai (`耳`) → tiếng, giọng, âm thanh, thanh điệu, danh tiếng; _từ ghép:_ 声音 (shēngyīn), 声调 (shēngdiào). |
|   殸    |  qìng  |  Khánh   | `声` (góc trên trái) + `殳` (Thù) | `[Tra bộ Khang Hy: 殳 (#79)]` Cổ tự của “khánh đá”: tay cầm dùi (`殳`) gõ vào phiến đá treo (`声`) phát tiếng; là thành phần sinh âm/nghĩa chung cho nhóm `聲, 馨, 磬, 罄`.                      |
|   馨    |  xīn   |   Hinh   | `殸` (chứa `声`) + `香` (Hương)   | `[Tra bộ Khang Hy: 香 (#186)]` Hình thanh kiêm hội ý: phần thanh `殸` (chứa `声`) + `香` (mùi thơm) → mùi hương thơm ngát lan xa; _từ ghép:_ 温馨 (wēnxīn: ấm áp êm đềm), 芳馨 (fāngxīn).        |
|   磬    |  qìng  |  Khánh   | `殸` (chứa `声`) + `石` (Thạch)   | `[Tra bộ Khang Hy: 石 (#112)]` Hội ý kiêm thanh: nhạc khí làm bằng đá ngọc (`石`) gõ vang tiếng (`殸`) → cái khánh đá cổ; _từ ghép:_ 钟磬 (zhōngqìng: chuông khánh).                             |
|   罄    |  qìng  |  Khánh   | `殸` (chứa `声`) + `缶` (Phẫu)    | `[Tra bộ Khang Hy: 缶 (#121)]` Hội ý kiêm thanh: bình sành (`缶`) rỗng không gõ kêu vang (`殸`) → cạn sạch, hết nhẵn; _từ ghép:_ 告罄 (gàoqìng: hết sạch), 罄竹难书 (qìngzhú-nánshū).            |
|   謦    |  qǐng  |  Khánh   | `殸` (chứa `声`) + `言` (Ngôn)    | `[Tra bộ Khang Hy: 言 (#149)]` Hình thanh kiêm hội ý: tiếng hắng giọng phát ra lời (`言` + `殸`) → ho nhẹ, tằng hắng; _từ ghép văn ngôn:_ 謦欬 (qǐngkài: tiếng ho khẽ / lời nói).                |

### Nhóm B: Chữ đối chiếu cặp nghĩa Âm – Thanh (`音, 响`) & Chữ đầu `士` dễ nhầm hình (`壳`)

| Chữ Hán |  Pinyin   | Hán Việt | Thành phần ghép cùng                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                  |
| :-----: | :-------: | :------: | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   音    |    yīn    |    Âm    | Độc thể (bộ Âm #180)                      | `[Tra bộ Khang Hy: 音 (#180)]` Không chứa `声`, là bộ thủ gốc biểu thị âm thanh/nhạc âm (`言` thêm nét trong miệng); ghép với `声` tạo từ 声音 (shēngyīn: âm thanh); _từ ghép:_ 音乐 (yīnyuè), 发音 (fāyīn).    |
|   响    |   xiǎng   |  Hưởng   | `口` + `向` (giản thể của `響` dùng `音`) | `[Tra bộ Khang Hy: 口 (#30) cho 响 / 音 (#180) cho 響]` Không chứa `声`; `向` làm thanh phù giản hóa cho `鄉 + 音` trong `響` → vang lên, âm lượng; _từ ghép:_ 音响 (yīnxiǎng: dàn âm thanh), 影响 (yǐngxiǎng). |
|   壳    | ké / qiào |   Xác    | `士` + `冖` + `几` (**không phải `声`**)  | `[Tra bộ Khang Hy: 士 (#33) cho 壳 / 殳 (#79) cho 殼]` Giản thể của `殼`: dùng đầu `士` giống phần đầu của `声`, nhưng dưới là `冖 + 几` → vỏ cứng (`ké`: 外壳 wàiké; `qiào`: 地壳 dìqiào).                     |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`声音` (âm thanh), `声调` (thanh điệu), `名声` (danh tiếng) — từ DB:** Ba từ ghép cốt lõi minh họa đầy đủ các tầng nghĩa “âm thanh – ngữ âm – danh tiếng” của `声`.
- **`耳` (Nhĩ, #128) — từ DB:** Bộ thủ gốc chứa chữ phồn thể `聲` (17 nét).
- **`音` (Âm, #180) — từ DB:** Bộ thủ gốc trong 214 bộ Khang Hy chỉ âm thanh/âm nhạc; phân biệt rõ `音` là bộ Khang Hy chính thức còn `声` là chữ giản thể hóa phần trên của `聲`.
- **`士` (Sĩ, #33) & `壳` (Xác):** `士` (nét ngang trên dài, nét ngang dưới ngắn) là bộ quản lý chữ giản thể `声` và `壳` trong từ điển hiện đại — cần nhìn kỹ phần đáy `声` khác hoàn toàn `壳`.

---

## Bộ 220: 勺 (Chước)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-105` · `radical_index`: `105` · `strokes`: `3` nét · `name_vi`: `bộ Chước / Thược**` _(lưu ý: chuỗi `name_vi` trong DB hiện còn sót ký tự `**`)_ · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `勺`:** Thuộc bộ **Bao `勹` (#20)** (`勹` 2 nét + chấm `丶` 1 nét = 3 nét; xếp mục `+1` nét dưới bộ `勹`).
- **Hình thái & Biến thể (`variants`):**
  - `勺` — dạng chính duy nhất (3 nét: `丿 𠃌 丶`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình cái muôi / cái thìa cong lòng (`勹`) đựng một giọt chất lỏng hoặc thức ăn bên trong (`丶`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Cái thìa, cái muỗng (`勺子`), đơn vị đong múc nhỏ (`一勺`); nhưng trong chữ Hán ghép hiện đại, `勺` đóng vai trò nổi bật nhất là **thanh phù** (_sháo / zhuó / diào / yuē_) hoặc phần giản hóa trong chữ tần suất cao (`的, 约, 钓, 药`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `勺` đôi khi gợi động tác múc (`酌`), nhưng đại đa số trường hợp chỉ làm **thanh phù** trong chữ hình thanh (`的, 约, 钓, 灼, 芍, 豹`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`勺` = cái muỗng/thìa** (có chấm `丶` bên trong) vs **`勹` = bao bọc** (#20, khung rỗng không có chấm).
    - **`的` có `勺` nhưng không giải theo “trắng + muỗng = của”:** `的` là trợ từ ngữ pháp tần suất cao nhất (`我的`), `勺` trong `的` vốn là thanh phù cổ (_dí_ / _dì_ trong `的确, 目的`).
    - **`药` (`yào`) giản thể không phân tích máy móc theo nghĩa “cái thìa”:** `药` dùng `约` (`纟 + 勺`) thay thế âm/nét cho `樂` trong phồn thể `藥`.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ có `勺` gợi nghĩa múc / thanh phù truyền thống (`勺, 酌, 灼, 钓, 约`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                   |
| :-----: | :----: | :------: | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   勺    |  sháo  |  Chước   | Độc thể (`勹` + `丶`)             | `[Tra bộ Khang Hy: 勹 (#20)]` Tượng hình cái thìa múc; nghĩa: cái muỗng, cái thìa, đơn vị đong nhỏ; _từ ghép:_ 勺子 (sháozi: cái thìa), 汤勺 (tāngsháo: muôi canh).                              |
|   酌    |  zhuó  |  Chước   | `酉` (Dậu) + `勺` (`zhuó`)        | `[Tra bộ Khang Hy: 酉 (#164)]` Hình thanh kiêm hội ý: dùng thìa (`勺`) múc rượu từ bình (`酉`) → rót rượu mời, cân nhắc suy xét kỹ (“châm chước”); _từ ghép:_ 斟酌 (zhēnzhuó), 小酌 (xiǎozhuó).  |
|   灼    |  zhuó  |  Chước   | `火` (Hỏa) + `勺` (`zhuó`)        | `[Tra bộ Khang Hy: 火 (#86)]` Hình thanh: `火` (lửa) + `勺` (`zhuó`, thanh phù) → đốt cháy, nóng rực, sáng rực, lo âu nóng ruột; _từ ghép:_ 灼热 (zhuórè: nóng bỏng), 焦灼 (jiāozhuó).           |
|   钓    |  diào  |   Điếu   | `钅` (Kim) + `勺` (thanh phù cổ)  | `[Tra bộ Khang Hy: 金/钅 (#167)]` Hình thanh (Phồn thể: `釣`): `钅` (lưỡi câu kim loại) + `勺` (thanh phù cổ _diào_) → câu cá, dụ mồi; _từ ghép:_ 钓鱼 (diàoyú: câu cá), 钓竿 (diàogān).         |
|   约    |  yuē   |   Ước    | `纟` (Mịch) + `勺` (thanh phù cổ) | `[Tra bộ Khang Hy: 糸/纟 (#120)]` Hình thanh (Phồn thể: `約`): `纟` (dây buộc) + `勺` (thanh phù cổ _yuē_) → ràng buộc, hẹn ước, tiết kiệm, khoảng chừng; _từ ghép:_ 大约 (dàyuē), 预约 (yùyuē). |

### Nhóm B: Chữ tần suất cao dùng `勺` làm thanh phù / phần giản hóa (`的, 豹, 芍, 药`)

| Chữ Hán |    Pinyin    | Hán Việt | Thành phần ghép cùng             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                 |
| :-----: | :----------: | :------: | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   的    | de / dí / dì |   Đích   | `白` (Bạch) + `勺` (`dí` / `dì`) | `[Tra bộ Khang Hy: 白 (#106)]` Hình thanh: nghĩa gốc là màu trắng sáng của bia ngắm (`白` + `勺` thanh phù); nay dùng làm trợ từ sở hữu/kết cấu (`de`: 我的) và đích xác (`dí`: 的确; `dì`: 目的).             |
|   豹    |     bào      |   Báo    | `豸` (Trĩ) + `勺` (thanh phù cổ) | `[Tra bộ Khang Hy: 豸 (#153)]` Hình thanh: `豸` (thú dữ thân dài) + `勺` (thanh phù cổ) → con báo (hoa văn đốm); _từ ghép:_ 豹子 (bàozi: con báo), 猎豹 (lièbào: báo săn).                                     |
|   芍    |     sháo     |  Thược   | `艹` (Thảo) + `勺` (`sháo`)      | `[Tra bộ Khang Hy: 艸/艹 (#140)]` Hình thanh: `艹` (thực vật) + `勺` (`sháo`, thanh phù) → cây hoa thược dược; _từ ghép:_ 芍药 (sháoyao: hoa thược dược).                                                      |
|   药    |     yào      |   Dược   | `艹` (Thảo) + `约` (`纟 + 勺`)   | `[Tra bộ Khang Hy: 艸/艹 (#140)]` Hình thanh giản thể (`藥` phồn thể dùng `樂`): mượn `约` (chứa `勺`) làm phần thanh phù viết gọn cho `藥` → thuốc men, dược phẩm; _từ ghép:_ 吃药 (chīyào), 中药 (zhōngyào). |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`的`, `约`, `钓` — từ DB:** Ba chữ tần suất cao nhất chứa `勺` đóng vai trò thanh phù (`dí/dì`, `yuē`, `diào`), thuộc các bộ Khang Hy khác nhau (`白`, `糸/纟`, `金/钅`).
- **`药 / 藥` (Dược — từ DB):** Chữ giản thể `药` chứa `勺` bên trong `约` do quy ước giản hóa thay cho `樂`, không liên hệ nghĩa cái thìa.
- **`匕` (Chủy, #21 — từ DB):** Bộ thủ riêng (2 nét), tượng hình cái thìa cổ hoặc người ngồi quay lưng; khác `勺` về nét viết và bộ quản lý.
- **`勹` (Bao, #20), `匀` (Quân) & `勾` (Câu):** `勹` là bộ gốc của `勺` (không có chấm trong); `匀` có hai nét ngắn `二` bên trong; `勾` có `厶` bên trong — tất cả đều thuộc bộ Bao `勹` (#20).

---

## Bộ 221: 匹 (Thất)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-108` · `radical_index`: `108` · `strokes`: `4` nét · `name_vi`: `bộ Thất / Sơ nghĩa là đôi-ngang hàng, về sau lượng từ**` _(lưu ý: chuỗi `name_vi` trong DB hiện còn sót ký tự `**`)_ · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `匹`:** Theo tự điển Khang Hy truyền thống xếp ở bộ **Hệ `匸` (#23)** (`匸` 2 nét + `儿` 2 nét = 4 nét); trong chuẩn tự điển Giản thể hiện đại (như _Tân Hoa Tự Điển_), bộ `匸` gộp vào bộ **Phương `匚` (#22)** nên `匹` thường tra ở **`匚` (#22)**.
- **Hình thái & Biến thể (`variants`):**
  - `匹` — dạng chính duy nhất (4 nét: `一 丿 乚 ∟`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Nghĩa cổ chỉ hai vật tương xứng ghép thành đôi/cặp bằng nhau (hoặc đơn vị đo một tấm vải cuộn gấp đôi lại dài 4 trượng); từ đó mở rộng sang dùng làm lượng từ cho ngựa, lừa, vải vóc.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Lượng từ cho ngựa/vải (`一匹马, 布匹`), xứng đôi, khớp nhau (`匹配`), ngang sức ngang tài (`匹敌`), hoặc đơn độc/thường dân (`单枪匹马, 匹夫`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Ít chữ dùng `匹` trực tiếp để suy nghĩa; `匹` chủ yếu xuất hiện độc lập làm lượng từ hoặc nằm ở đáy chữ **`甚`** (`甘 + 匹`) và họ chữ mang `甚` (`堪, 勘, 湛`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`匹` không phải `马` (Ngựa, #187):** Tuy `匹` là lượng từ chuẩn cho ngựa (`一匹马`), tự hình hoàn toàn khác bộ Mã `马`.
    - **`匹` vs `匚` (#22) / `匸` (#23):** `匹` dùng khung bao mở bên phải giống `匚/匸`, nhưng bên trong chứa `儿` (`一 + 儿 + ∟`), là chữ cụ thể thuộc bộ đó.
    - **`匹` vs `四` (Tứ — số 4):** `四` có khung kín 4 cạnh (`囗` #31) bao quanh `儿`; `匹` hở mặt phải (nét đầu ngang, nét cuối sổ gập).

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ `匹` độc lập & nhóm chữ chứa `甚` (`甘 + 匹`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                   |
| :-----: | :----: | :------: | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   匹    |   pǐ   |   Thất   | Độc thể (`匚/匸` + `儿`)       | `[Tra bộ Khang Hy: 匸 (#23) / 匚 (#22)]` Xứng đôi, ngang hàng; lượng từ cho ngựa, vải; kẻ tầm thường; _từ ghép:_ 匹配 (pǐpèi: ghép đôi/khớp), 匹敌 (pǐdí: ngang sức), 一匹马 (yī pǐ mǎ).         |
|   甚    |  shèn  |   Thậm   | `甘` (Cam) + `匹` (đôi/cặp)    | `[Tra bộ Khang Hy: 甘 (#99)]` Hội ý cổ (_Thuyết Văn_): vui thích ngọt ngào (`甘`) có đôi có cặp (`匹`) → quá đỗi, rất mực, thậm chí; _từ ghép:_ 甚至 (shènzhì: thậm chí), 什么 (shénme: cái gì). |
|   堪    |  kān   |   Kham   | `土` (Thổ) + `甚` (chứa `匹`)  | `[Tra bộ Khang Hy: 土 (#32)]` Hình thanh: `土` (đất chịu tải) + `甚` (thanh phù) → gánh vác nổi, chịu đựng được, xứng đáng; _từ ghép:_ 不堪 (bùkān: không chịu nổi), 堪称 (kānchēng: xứng gọi).  |
|   勘    |  kān   |   Kham   | `甚` (chứa `匹`) + `力` (Lực)  | `[Tra bộ Khang Hy: 力 (#19)]` Hình thanh: `力` (sức lực tra xét) + `甚` (thanh phù) → khảo sát, đối chiếu kiểm tra; _từ ghép:_ 勘探 (kāntàn: thăm dò), 校勘 (jiàokān: hiệu đính).                |
|   湛    |  zhàn  |   Trạm   | `氵` (Thủy) + `甚` (chứa `匹`) | `[Tra bộ Khang Hy: 水/氵 (#85)]` Hình thanh: `氵` (nước) + `甚` (thanh phù cổ) → sâu lắng, trong vắt, tinh thông sâu sắc; _từ ghép:_ 精湛 (jīngzhàn: tinh thông), 湛蓝 (zhànlán: xanh thẫm).     |

### Nhóm B: Chữ cùng khung bao `匚 / 匸` dễ nhầm nét trong với `匹`

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng                       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                   |
| :-----: | :----: | :------: | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   区    |   qū   |   Khu    | `匚` + `乂` (**không chứa `儿` như `匹`**) | `[Tra bộ Khang Hy: 匸 (#23) / 匚 (#22)]` Giản thể từ `區`: dùng khung `匸/匚` giống `匹` nhưng bên trong là `乂` → khu vực, phân biệt; _từ ghép:_ 地区 (dìqū: khu vực), 区别 (qūbié: phân biệt). |
|   医    |   yī   |    Y     | `匚` + `矢` (**không chứa `儿` như `匹`**) | `[Tra bộ Khang Hy: 匸 (#23) / 匚 (#22) cho 医 / 酉 (#164) cho 醫]` Giản thể lấy góc trên trái của `醫` (hộp đựng mũi tên `矢` trị thương) → y học, bác sĩ; _từ ghép:_ 医生 (yīshēng), 医院.      |
|   匠    | jiàng  |  Tượng   | `匚` + `斤` (**không chứa `儿` như `匹`**) | `[Tra bộ Khang Hy: 匚 (#22)]` Hội ý: hộp đựng đồ nghề (`匚`) chứa rìu búa (`斤`) → thợ thủ công, nghệ nhân; _từ ghép:_ 工匠 (gōngjiàng: thợ thủ công), 木匠 (mùjiàng: thợ mộc).                  |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`匹马` (một con ngựa), `匹配` (ghép đôi/khớp), `匹敌` (ngang sức/địch nổi) — từ DB:** Các từ ghép thông dụng nhất của `匹`, đặc biệt `匹配` rất hay gặp trong ngữ cảnh hiện đại (matching).
- **`匚` (Phương, #22) & `匸` (Hệ, #23) — từ DB:** Hai bộ khung bao hở phải tương tự nhau trong Khang Hy; `匹` nằm ở `匸` (#23) trong Khang Hy cổ nhưng quy về `匚` (#22) ở từ điển Giản thể hiện đại.
- **`马` (Mã, #187 — từ DB):** Bộ ngựa riêng; `匹` là lượng từ đi cùng ngựa (`一匹马`), không phải bộ chỉ ngựa.
- **`比` (Tỷ, #81):** Có âm đọc gần giống ở chữ `媲` (`pì`, sánh ngang trong `媲美`), nhưng tự hình `比` gồm hai người quay phải hoàn toàn khác `匹`.

---

## Bộ 222: 厄 (Ách)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-110` · `radical_index`: `110` · `strokes`: `4` nét · `name_vi`: `bộ Ách**` _(lưu ý: chuỗi `name_vi` trong DB hiện còn sót ký tự `**`)_ · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `厄`:** Thuộc bộ **Hán `厂` (#27)** (`厂` 2 nét + `㔾` 2 nét = 4 nét; xếp mục `+2` nét dưới bộ `厂`).
- **Hình thái & Biến thể (`variants`):**
  - `厄` — dạng chính duy nhất (4 nét: `一 丿 ㇆ 乚`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Cấu tạo gồm vách đá dốc `厂` che trên và hình người quỳ co cụm `㔾` (hoặc khúc gỗ/khớp đốt mắc kẹt dưới vách núi) → bị chèn ép, lâm vào nơi hiểm trở, khốn đốn.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Tai ách, hoạn nạn, khó khăn (`厄运, 困厄`); trong chữ ghép truyền thống gợi nghĩa bị kẹp/khống chế và làm thanh phù _è_ (`扼, 轭, 呃`), đồng thời xuất hiện làm phần đáy trong `危` và thành phần giản hóa bên trái của `顾` (`顧`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `厄` trong nhóm chữ cổ thường gợi tình thế khó khăn, bị bóp chặt/kẹp giữ (`扼, 轭`) hoặc nghẹn hơi (`呃`), nhưng số lượng chữ dùng trực tiếp không nhiều; trong chữ giản thể `顾`, `厄` chỉ là phần rút gọn thay thế cho `雇`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Không tách máy móc mọi chữ có `厄` thành “vách đá + người quỳ”:** Đặc biệt với `顾` (`gù`), `厄` chỉ thay thế giản thể cho thanh phù `雇`.
    - **`厄` (4 nét) vs `尸` (Thi, #44, 3 nét):** `尸` có phần đầu khép hình chữ nhật trên nét phẩy, không có móc `㔾` lồng bên dưới như `厄`.
    - **`厄` vs `危` (Nguy):** `危` (6 nét) chính là `⺈` (người nhìn từ trên cao) đặt lên trên `厄` (`厂 + 㔾`).

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ dùng `厄` biểu nghĩa bóp chặt, kìm kẹp & thanh phù `è`

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                             |
| :-----: | :----: | :------: | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   厄    |   è    |   Ách    | `厂` (Hán) + `㔾` (Tiết) | `[Tra bộ Khang Hy: 厂 (#27)]` Bị kẹt dưới vách hiểm → tai ách, hoạn nạn, khó khăn; _từ ghép:_ 厄运 (èyùn: vận rủi/tai ách), 困厄 (kùn'è: khốn khó).                                        |
|   扼    |   è    |   Ách    | `扌` (Thủ) + `厄` (`è`)  | `[Tra bộ Khang Hy: 手/扌 (#64)]` Hình thanh kiêm hội ý: dùng tay (`扌`) kẹp giữ, bóp chặt (`厄`, thanh phù `è`) → bóp cổ, nắm chỗ hiểm yếu; _từ ghép:_ 扼杀 (èshā), 扼要 (èyào: ngắn gọn). |
|   轭    |   è    |   Ách    | `车` (Xa) + `厄` (`è`)   | `[Tra bộ Khang Hy: 車/车 (#159)]` Hình thanh kiêm hội ý (Phồn thể: `軛`): bộ phận của xe (`车`) kẹp ngang cổ trâu ngựa (`厄`) → cái ách xe, trói buộc; _từ ghép:_ 车轭 (chē'è: ách xe).    |
|   呃    |   è    |   Ách    | `口` (Khẩu) + `厄` (`è`) | `[Tra bộ Khang Hy: 口 (#30)]` Hình thanh: tiếng hơi nghẹn (`厄`, thanh phù `è`) bật ra ở miệng (`口`) → nấc cụt, tiếng ngập ngừng “ơ, ờ”; _từ ghép:_ 打呃 (dǎ'è: nấc), 呃逆 (ènì).         |

### Nhóm B: Chữ chứa `厄` trong cụm `危` & chữ giản thể chứa `厄` (`顾`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| :-----: | :----: | :------: | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   危    |  wēi   |   Nguy   | `⺈` + `厄` (`厂 + 㔾`)              | `[Tra bộ Khang Hy: 卩 (#26)]` Hội ý: người (`⺈`) đứng cheo leo bên vách hiểm (`厄`) → nguy hiểm, nguy cơ, cao chót vót; _từ ghép:_ 危险 (wēixiǎn: nguy hiểm), 危机 (wēijī: khủng hoảng).           |
|   诡    |  guǐ   |   Quỷ    | `讠` (Ngôn) + `危` (chứa `厄`)       | `[Tra bộ Khang Hy: 言/讠 (#149)]` Hình thanh (Phồn thể: `詭`): lời nói (`讠`) ẩn chứa nguy hiểm, lừa lọc (`危` thanh phù cổ) → dối trá, quỷ dị; _từ ghép:_ 诡计 (guǐjì: mưu kế), 诡异 (guǐyì).      |
|   脆    |  cuì   |   Thúy   | `月` (Nhục) + `危` (chứa `厄`)       | `[Tra bộ Khang Hy: 肉/月 (#130)]` Hình thanh: `月` (chất thịt) + `危` (chứa `厄`, thanh phù cổ) → giòn, dễ vỡ, âm thanh trong trẻo; _từ ghép:_ 脆弱 (cuìruò: yếu ớt), 清脆 (qīngcuì: trong trẻo).   |
|   顾    |   gù   |    Cố    | `厄` (thay `雇`) + `页` (`頁`, Hiệt) | `[Tra bộ Khang Hy: 頁/页 (#181)]` Giản thể từ `顧` (`雇 + 頁`): dùng `厄` thay thế phần bên trái `雇` + `页` (đầu/quay đầu nhìn) → ngoái lại nhìn, chăm sóc; _từ ghép:_ 照顾 (zhàogù), 顾客 (gùkè). |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`危` (Nguy — từ DB):** Chứa trọn vẹn `厄` ở phần đáy dưới (`⺈ + 厄`), rất thông dụng và giữ rõ sắc thái “nguy hiểm, cheo leo”.
- **`扼` (bóp chặt) & `轭` (ách xe) — từ DB:** Hai chữ tiêu biểu giữ rõ cả nghĩa “kẹp/khống chế” lẫn âm _è_ của `厄`.
- **`厂` (Hán, #27 — từ DB):** Bộ thủ gốc của `厄`, nghĩa gốc là vách đá/mái dốc (`压, 厅, 原`).
- **`卩 / 㔾` (Tiết, #26 — từ DB):** Bộ người quỳ/con dấu, là phần bên trong của `厄` và là bộ Khang Hy tra cứu chữ `危`.
- **`尸` (Thi, #44) & `巴 / 巳`:** `尸` không có nét móc vòng dưới `㔾`; còn `巴` (`bā`), `巳` (`sì`, Tỵ) thuộc bộ Kỷ `己` (#49), không có nét vách `厂` che phía trên như `厄`.

---

## Bộ 223: 卂 (Tấn)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-111` · `radical_index`: `111` · `strokes`: `3` nét · `name_vi`: `bộ Tấn / bay nhanh**` _(lưu ý: chuỗi `name_vi` trong DB hiện còn sót ký tự `**`)_ · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `卂`:** Thuộc bộ **Thập `十` (#24)** (`⺄` 1 nét + `十` 2 nét = 3 nét; xếp mục `+1` nét dưới bộ `十`).
- **Hình thái & Biến thể (`variants`):**
  - `卂` — dạng chính duy nhất (3 nét: `⺄ 一 丨`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình con chim sải cánh bay vọt lên rất nhanh (nét móc cong `⺄` mô tả cánh chim xòe bay vút).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Hầu như không còn dùng độc lập trong tiếng Trung hiện đại; chủ yếu làm **linh kiện và thanh phù** (_xùn_) biểu thị âm và sắc thái “nhanh, vọt lên, truyền cấp tốc” trong bộ chữ thông dụng (`迅, 讯, 汛`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Gặp `卂` trong chữ hiện đại gần như chắc chắn chữ đọc là **`xùn`** và thuộc nhóm 3 chữ cốt lõi `迅` (nhanh), `讯` (tin tức), `汛` (nước lũ).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`卂` là linh kiện hiếm dùng độc lập:** Chỉ cần nhớ qua 3 chữ thông dụng `迅, 讯, 汛` (đều đọc `xùn`).
    - **`卂` vs `飞 / 飛` (Phi, #183):** `飞` mới là chữ và bộ thủ thông dụng hiện đại mang nghĩa “bay” (`飞机`); `飞` có nét móc `⺄` + hai nét chấm nhỏ, không có chữ thập `十` bên trong như `卂`.
    - **`卂` vs `凡` (Phàm):** `凡` (3 nét) có khung ngoài đối xứng gần giống `几` + dấu chấm giữa; `卂` có nét ngang ngắn cắt nét sổ (`十`) nằm ở phía dưới nét móc vươn dài sang phải.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Toàn bộ nhóm chữ thông dụng chứa `卂` (đọc `xùn`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                              |
| :-----: | :----: | :------: | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   卂    |  xùn   |   Tấn    | Độc thể (`⺄` + `十`)      | `[Tra bộ Khang Hy: 十 (#24)]` Chữ cổ tượng hình chim bay vút nhanh; ngày nay chủ yếu làm thành phần thanh phù _xùn_ trong các chữ hình thanh.                                                               |
|   迅    |  xùn   |   Tấn    | `辶` (Sước) + `卂` (`xùn`) | `[Tra bộ Khang Hy: 辵/辶 (#162)]` Hình thanh kiêm hội ý: bước đi (`辶`) nhanh như chim bay (`卂`, thanh phù `xùn`) → nhanh chóng, mau lẹ; _từ ghép:_ 迅速 (xùnsù: nhanh chóng), 迅猛 (xùnměng: nhanh mạnh). |
|   讯    |  xùn   |   Tấn    | `讠` (Ngôn) + `卂` (`xùn`) | `[Tra bộ Khang Hy: 言/讠 (#149)]` Hình thanh (Phồn thể: `訊`): lời nói/thông điệp (`讠`) truyền đi nhanh (`卂`, thanh phù `xùn`) → tin tức, hỏi thăm, thẩm vấn; _từ ghép:_ 通讯 (tōngxùn), 资讯 (zīxùn).    |
|   汛    |  xùn   |   Tấn    | `氵` (Thủy) + `卂` (`xùn`) | `[Tra bộ Khang Hy: 水/氵 (#85)]` Hình thanh: nước (`氵`) dâng lên nhanh chóng theo kỳ (`卂`, thanh phù `xùn`) → mùa nước lũ định kỳ, thủy triều lên; _từ ghép:_ 汛期 (xùnqī: mùa lũ), 防汛 (fángxùn).       |

### Nhóm B: Chữ dễ nhầm hình dáng nét móc bay (`⺄`) & bộ “bay” thông dụng để đối chiếu

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| :-----: | :----: | :------: | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   虱    |  shī   |   Sắt    | `⺄` + `虫` (**không phải `卂`**) | `[Tra bộ Khang Hy: 虫 (#142)]` Giản thể từ `蝨`: dùng khung nét móc `⺄` ôm lấy `虫` (sâu bọ) chứ không chứa `十` như `卂` → con rận, rệp; _từ ghép:_ 虱子 (shīzi: con rận).                        |
|   飞    |  fēi   |   Phi    | Độc thể (**không phải `卂`**)     | `[Tra bộ Khang Hy: 飛/飞 (#183)]` Bộ thủ riêng chỉ “bay” (giản thể từ `飛`): dùng nét móc `⺄` + hai nét ngắn bên phải biểu thị đôi cánh; _từ ghép:_ 飞机 (fēijī: máy bay), 起飞 (qǐfēi: cất cánh). |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`迅` (nhanh chóng), `讯 / 訊` (tin tức), `汛` (mùa nước lũ) — từ DB:** Bộ ba chữ thông dụng duy nhất dùng `卂` làm thanh phù `xùn`, cần tra cứu ở các bộ ý tương ứng là `辶` (#162), `言/讠` (#149) và `水/氵` (#85).
- **`飞 / 飛` (Phi, #183 — từ DB):** Bộ thủ biểu nghĩa “bay” chính thức và phổ biến hơn về mặt ngữ nghĩa hiện đại.
- **`辶` (Sước, #162 — từ DB):** Bộ di chuyển, kết hợp với `卂` tạo nên chữ `迅` (đi nhanh).
- **`十` (Thập, #24):** Bộ thủ Khang Hy gốc của chữ `卂`, đồng thời là phần chữ thập nằm gọn dưới nét móc `⺄` của `卂`.

---

## Bộ 224: 凶 (Hung)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-115` · `radical_index`: `115` · `strokes`: `4` nét · `name_vi`: `bộ Hung` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `凶`:** Thuộc bộ **Khảm `凵` (#17)** (`凵` 2 nét + `乂` 2 nét = 4 nét; xếp mục `+2` nét dưới bộ `凵`).
- **Hình thái & Biến thể (`variants`):**
  - `凶` — dạng chính duy nhất (4 nét: `丿 丶 ∟ 丨`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Chỉ sự / hội ý: vẽ một cái hố bẫy sâu (`凵`) bên trong có vật nhọn hoặc dấu gạch chéo (`乂`) biểu thị nguy hiểm, tai họa rình rập.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Hung dữ, tàn ác (`凶猛, 凶手`), điềm xấu, bất lợi, mất mùa (`吉凶, 凶年`); trong chữ ghép hiện đại vừa biểu nghĩa dữ dội (`汹, 酗`), vừa làm **thanh phù** _xiōng_ (`匈, 胸`), vừa làm **ký hiệu giản thể** thay cho `囟` (hộp sọ/não trong `脑, 恼`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `凶` có thể gợi sự dữ tợn, nguy hiểm (`汹, 酗`), nhưng trong họ chữ `匈 / 胸` chủ yếu làm phần âm _xiōng_, còn trong `脑 / 恼` chỉ là dạng viết gọn phần đầu của phồn thể `腦 / 惱` (không liên quan nghĩa “hung ác”).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`凶` = hung/dữ/xấu** (thuộc bộ `凵`) vs **`凵` = hố/khung mở trên** (#17, chỉ có 2 nét khung ngoài).
    - **`胸` có `凶` nhưng nghĩa là “ngực”:** Bộ `肉/月` quyết định nghĩa cơ thể, còn `匈` (chứa `凶`) chỉ góp âm _xiōng_.
    - **`脑 / 恼` có `亠 + 凶` do giản hóa từ `囟`:** Không giải thích “não/phiền não” theo nghĩa “hung dữ”.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ mang `凶` biểu nghĩa hung dữ, tai họa, mất kiểm soát

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                      |
| :-----: | :----: | :------: | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   凶    | xiōng  |   Hung   | `凵` (hố) + `乂` (dấu hiểm)   | `[Tra bộ Khang Hy: 凵 (#17)]` Hố bẫy nguy hiểm → hung dữ, ác, điềm gở, tai họa, mất mùa; _từ ghép:_ 凶猛 (xiōngměng: hung dữ), 凶手 (xiōngshǒu: hung thủ), 吉凶 (jíxiōng: lành dữ). |
|   汹    | xiōng  |   Hung   | `氵` (Thủy) + `凶` (`xiōng`)  | `[Tra bộ Khang Hy: 水/氵 (#85)]` Hình thanh kiêm hội ý (Phồn thể: `洶`): sóng nước (`氵`) dâng trào dữ dội (`凶`) → cuồn cuộn, sôi sục; _từ ghép:_ 汹涌 (xiōngyǒng: cuồn cuộn).     |
|   酗    |   xù   |    Hú    | `酉` (Dậu) + `凶` (hung hăng) | `[Tra bộ Khang Hy: 酉 (#164)]` Hội ý: uống rượu (`酉`) đến mức hung hăng mất lý trí (`凶`) → say xỉn làm càn; _từ ghép:_ 酗酒 (xùjiǔ: nghiện rượu/say xỉn quậy phá).                |
|   讻    | xiōng  |   Hung   | `讠` (Ngôn) + `凶` (`xiōng`)  | `[Tra bộ Khang Hy: 言/讠 (#149)]` Hình thanh kiêm hội ý (Phồn thể: `訩`): lời nói (`讠`) hung hăng cãi vã (`凶`) → ồn ào cãi cọ; _từ ghép:_ 讻讻 (xiōngxiōng: ồn ào náo động).      |

### Nhóm B: Chữ dùng `凶` làm thanh phù `xiōng` (`匈, 胸`) & giản hóa thay `囟` (`脑, 恼`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng                  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                           |
| :-----: | :----: | :------: | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   匈    | xiōng  |   Hung   | `勹` (Bao) + `凶` (`xiōng`)           | `[Tra bộ Khang Hy: 勹 (#20)]` Chữ gốc của lồng ngực (bao bọc bên trong, `凶` góp âm _xiōng_); nay dùng trong tên dân tộc/quốc gia; _từ ghép:_ 匈奴 (Xiōngnú: Hung Nô), 匈牙利 (Hungary). |
|   胸    | xiōng  |   Hung   | `月` (Nhục) + `匈` (chứa `凶`)        | `[Tra bộ Khang Hy: 肉/月 (#130)]` Hình thanh: `月` (cơ thể) + `匈` (`xiōng`, thanh phù) → lồng ngực, tấm lòng; _từ ghép:_ 胸口 (xiōngkǒu: ngực), 胸怀 (xiōnghuái: tấm lòng).             |
|   脑    |  nǎo   |   Não    | `月` (Nhục) + `亠` + `凶` (thay `囟`) | `[Tra bộ Khang Hy: 肉/月 (#130)]` Giản thể từ `腦`: phần đầu hộp sọ (`囟`) được viết gọn thành `亠 + 凶` (không mang nghĩa “hung”) → bộ não; _từ ghép:_ 大脑 (dànǎo), 电脑 (diànnǎo).    |
|   恼    |  nǎo   |   Não    | `忄` (Tâm) + `亠` + `凶` (thay `囟`)  | `[Tra bộ Khang Hy: 心/忄 (#61)]` Giản thể từ `惱`: tương tự `脑`, dùng `亠 + 凶` thay cho `囟` + `川` → phiền não, tức giận; _từ ghép:_ 烦恼 (fánnǎo: phiền não), 恼火 (nǎohuǒ: bực).    |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`胸` (ngực) & `汹` (sóng dữ) — từ DB:** Hai chữ tiêu biểu giúp phân biệt rõ vai trò: `胸` dùng `凶` thuần túy cho âm _xiōng_ (nghĩa nằm ở `月`), còn `汹` giữ cả âm _xiōng_ lẫn sắc thái “dữ dội” với `氵`.
- **`凵` (Khảm, #17 — từ DB):** Bộ thủ Khang Hy gốc của `凶`, tượng hình hố/khung mở miệng lên trên (`山` có nét giữa xuyên đứng, `凵` rỗng hoặc chứa nét khác như `凶, 出, 击`).
- **`区` (Khu — từ DB):** Thuộc bộ `匸/匚`, khung mở sang phải (`区`), khác khung mở lên trên của `凶`, và không mang nghĩa hung dữ.
- **`离` (Ly) & `画` (Họa):** Đáy `离` (giản thể của `離`) cũng viết gần `凶` nhưng nét giữa tách khác cấu tạo; `画` (tranh) là `一 + 田 + 凵` (thuộc bộ `田` #102).

---

## Bộ 225: 凡 (Phàm)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-116` · `radical_index`: `116` · `strokes`: `3` nét · `name_vi`: `bộ Phàm` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `凡`:** Thuộc bộ **Kỷ `几` (#16)** (`几` 2 nét + chấm `丶` 1 nét = 3 nét; xếp mục `+1` nét dưới bộ `几`).
- **Hình thái & Biến thể (`variants`):**
  - `凡` — dạng chính duy nhất (3 nét: `丿 ⺄ 丶`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Cổ tự có thuyết giải là hình chiếc mâm đựng/cái khuôn đúc, cũng có thuyết giải là hình cánh buồm căng gió (sau tách nghĩa bằng cách thêm `巾` thành `帆`), còn `凡` được mượn làm từ biểu thị “tất cả, nói chung, phàm là”.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bình thường, tầm thường (`平凡`), cõi trần thế (`凡间`), phàm là/tất cả mọi (`凡是`); trong chữ ghép, `凡` thường làm **thanh phù** _fán / fàn_ (`帆, 梵, 钒`) hoặc làm **linh kiện giản hóa** thay thế cụm nét phức tạp (`巩, 筑`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Gặp `凡` ở chữ truyền thống (`帆, 梵, 钒`) thường đọc gần _fán / fān / fàn_; gặp `凡` trong chữ giản thể (`巩, 筑`) là ký hiệu viết gọn chứ không phải âm _fán_.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`凡` = phàm/thường/tất cả** (3 nét, có chấm `丶` ở giữa) vs **`几` = bàn nhỏ / mấy-vài** (#16, 2 nét, bên trong rỗng).
    - **`凡` vs `风` (gió, #182) & `凤` (phượng):** `风` (`几 + 乂`) và `凤` (`几 + 又`) ở dạng giản thể dùng khung `几`, **không phải `凡`**.
    - **`帆` (buồm):** Bộ `巾` gợi vải buồm, còn `凡` chủ yếu gợi âm `fān` (và dấu vết chữ cổ của cánh buồm).

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ thực sự mang `凡` (thanh phù `fán/fān/fàn` & giản hóa `巩, 筑`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng                  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                           |
| :-----: | :----: | :------: | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   凡    |  fán   |   Phàm   | Độc thể (`几` + `丶`)                 | `[Tra bộ Khang Hy: 几 (#16)]` Tất cả mọi, phàm là, bình thường, cõi trần; _từ ghép:_ 平凡 (píngfán: bình thường), 凡是 (fánshì: phàm là/bất cứ), 非凡 (fēifán: phi thường).                              |
|   帆    |  fān   |   Phàm   | `巾` (Cân) + `凡` (`fán` → `fān`)     | `[Tra bộ Khang Hy: 巾 (#50)]` Hình thanh: `巾` (tấm vải) + `凡` (thanh phù kiêm nguồn chữ cổ cánh buồm) → cánh buồm; _từ ghép:_ 帆船 (fānchuán: thuyền buồm), 一帆风顺 (yì fān fēng shùn).               |
|   梵    |  fàn   |   Phạm   | `林` (`木木`) + `凡` (`fán` → `fàn`)  | `[Tra bộ Khang Hy: 木 (#75)]` Hình thanh: `林` (rừng cây thanh tịnh) + `凡` (thanh phù _fàn_) → tiếng Phạn, cõi Phật thanh tịnh; _từ ghép:_ 梵文 (fànwén: chữ Phạn), 梵语 (fànyǔ: tiếng Phạn).           |
|   钒    |  fán   |   Phàm   | `钅` (Kim) + `凡` (`fán`)             | `[Tra bộ Khang Hy: 金/钅 (#167)]` Hình thanh (Phồn thể: `釩`): `钅` (kim loại) + `凡` (`fán`, thanh phù) → nguyên tố Vanađi (V); _từ ghép:_ 钒钢 (fángāng: thép vanađi).                                 |
|   巩    |  gǒng  |   Củng   | `工` (Công) + `凡` (rút gọn từ `鞏`)  | `[Tra bộ Khang Hy: 工 (#48) cho 巩 / 革 (#177) cho 鞏]` Giản thể từ `鞏`: giữ phần `工` và dùng `凡` viết gọn cho cụm `𢀜 + 革` (không liên hệ âm `fán`) → củng cố, vững chắc; _từ ghép:_ 巩固 (gǒnggù). |
|   筑    |  zhù   |   Trúc   | `⺮` (`竹`) + `工` + `凡` (`⺮ + 巩`) | `[Tra bộ Khang Hy: 竹 (#118)]` Giản thể từ `築`: thay phần đáy của `築` bằng `巩` (`工 + 凡`) kết hợp `⺮` (tre trúc làm khung đắp đất) → xây dựng; _từ ghép:_ 建筑 (jiànzhù: kiến trúc), 筑路.          |

### Nhóm B: Chữ dùng khung `几` dễ nhầm với `凡` (`风, 凤`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                     |
| :-----: | :----: | :------: | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   风    |  fēng  |  Phong   | `几` + `乂` (**không phải `凡`**) | `[Tra bộ Khang Hy: 風/风 (#182)]` Bộ thủ riêng chỉ “gió” (giản thể của `風`): khung ngoài là `几`, bên trong là nét chéo `乂` chứ không phải chấm `丶` của `凡`; _từ ghép:_ 刮风, 风景 (fēngjǐng). |
|   凤    |  fèng  |  Phượng  | `几` + `又` (**không phải `凡`**) | `[Tra bộ Khang Hy: 几 (#16) cho 凤 / 鳥 (#196) cho 鳳]` Giản thể của `鳳`: dùng khung `几` ôm lấy `又` (nhìn gần `凡` nhưng không có chấm giữa) → chim phượng hoàng; _từ ghép:_ 凤凰 (fènghuáng).  |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`帆` (buồm — từ DB):** Chữ thông dụng nhất giữ trọn nét viết và gần âm của `凡` (`巾 + 凡`).
- **`风 / 風` (gió) & `凤 / 鳳` (phượng) — từ DB:** Dạng giản thể đều dùng khung `几` + nét trong (`乂` hoặc `又`) nên rất dễ nhìn nhầm sang `凡`; đặc biệt `风` là một trong 214 bộ Khang Hy độc lập (#182).
- **`几` (Kỷ, #16 — từ DB):** Bộ thủ Khang Hy gốc của `凡`, nghĩa “cái bàn nhỏ / mấy, vài”.
- **`乏` (Phạp, `丿 + 之`):** Có âm gần (`fá`, thiếu hụt trong `缺乏`), thuộc bộ Phiệt `丿` (#4), dễ nhầm với `凡` khi nghe phát âm hoặc đọc lướt.

---

## Bộ 226: 戊 (Mậu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-118` · `radical_index`: `118` · `strokes`: `5` nét · `name_vi`: `bộ Mậu` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `戊`:** Thuộc bộ **Qua `戈` (#62)** (`戈` 4 nét + 1 nét phẩy dài bên trái = 5 nét, bỏ chấm bên trong; xếp mục `+1` nét dưới bộ `戈`).
- **Hình thái & Biến thể (`variants`):**
  - `戊` — dạng chính duy nhất (5 nét: `一 丿 ㇂ 丿 丶`); **bên trong khung rỗng** (không có nét ngang hay chấm nào bên trong giữa nét phẩy trái và nét mác móc phải).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình một thứ binh khí cán dài lưỡi rìu rộng thời cổ (`戊`), về sau được mượn cố định để làm **Thiên Can thứ 5 (Mậu)** trong hệ lịch Can Chi (`甲乙丙丁戊己庚辛壬癸`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Thiên Can Mậu (lịch pháp, năm tháng lịch sử như `戊戌变法`), cành lá xum xuê (`茂` do mượn âm cổ); trong cấu chữ hiện đại đóng vai trò linh kiện hình/âm trong nhóm chữ `茂, 咸, 威` và các chữ dẫn xuất của `咸` (`感, 喊, 减`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `戊` thường khó đoán trực tiếp nghĩa hiện đại; nên ghi nhớ theo cụm Thiên Can/vũ khí cổ (`戊`) và họ chữ **`咸`** (`感, 喊, 减`), đồng thời tách bạch hẳn với nhóm chữ nhìn gần giống (`戌, 戍, 戎, 成`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Mẹo phân biệt 5 chữ dễ nhầm nhất (`戊, 戌, 戍, 戎, 成`):**
      - **`戊` (Mậu — Thiên Can thứ 5):** Bên trong **trống rỗng** (5 nét, có chấm ở góc trên phải).
      - **`戌` (Tuất — Địa Chi thứ 11):** Bên trong có **một nét ngang ngắn `一`** (6 nét).
      - **`戍` (Thú — canh giữ biên cương):** Bên trong có **một chấm `丶`** (6 nét).
      - **`戎` (Nhung — binh khí/quân sự):** Bên trong có **nét chữ thập giao chéo `十`** (6 nét).
      - **`成` (Thành — hoàn thành):** Bên trong có **nét ngang gập móc `𠃌`** (6 nét).

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ mang trực tiếp thành phần `戊` & họ chữ `咸` (`茂, 咸, 感, 喊, 威`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                              |
| :-----: | :----: | :------: | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   戊    |   wù   |   Mậu    | Độc thể (`戈` biến đổi, 5 nét)    | `[Tra bộ Khang Hy: 戈 (#62)]` Thiên Can thứ 5 trong Thập Can (xưa là vũ khí lưỡi rìu); _từ ghép:_ 戊戌 (wùxū: năm Mậu Tuất), 戊辰 (wùchén: năm Mậu Thìn).                                   |
|   茂    |  mào   |   Mậu    | `艹` (Thảo) + `戊` (thanh phù cổ) | `[Tra bộ Khang Hy: 艸/艹 (#140)]` Hình thanh: `艹` (cây cỏ) + `戊` (thanh phù cổ) → cây cối xum xuê, rậm rạp, tài đức thịnh vượng; _từ ghép:_ 茂盛 (màoshèng), 茂密 (màomì).                |
|   咸    |  xián  |   Hàm    | `戊` + `一` + `口` (Khẩu)         | `[Tra bộ Khang Hy: 口 (#30) cho 咸 / 鹵 (#197) cho 鹹]` Hội ý cổ: vũ khí `戊` + `口` → tất cả, đều; giản thể kiêm nghĩa vị mặn của `鹹`; _từ ghép:_ 老少咸宜, 咸菜 (xiáncài: dưa muối).     |
|   感    |  gǎn   |   Cảm    | `咸` (chứa `戊`) + `心` (Tâm)     | `[Tra bộ Khang Hy: 心 (#61)]` Hình thanh: `心` (tâm trí/tình cảm) + `咸` (`xián` → `gǎn`, thanh phù) → cảm nhận, cảm động, cảm ơn; _từ ghép:_ 感觉 (gǎnjué), 感动 (gǎndòng), 感谢 (gǎnxiè). |
|   喊    |  hǎn   |   Hám    | `口` (Khẩu) + `咸` (chứa `戊`)    | `[Tra bộ Khang Hy: 口 (#30)]` Hình thanh: miệng (`口`) + `咸` (`xián` → `hǎn`, thanh phù) → kêu to, hò hét; _từ ghép:_ 喊叫 (hǎnjiào: kêu gọi), 大喊 (dàhǎn: hét to).                       |
|   威    |  wēi   |    Uy    | `戊` + `一` + `女` (Nữ)           | `[Tra bộ Khang Hy: 女 (#38)]` Khải thư viết `戊` + `一` bao lấy `女` (cổ tự nghĩa uy nghiêm khiến người kính nể) → uy lực, oai phong; _từ ghép:_ 威力 (wēilì: uy lực), 威胁 (wēixié).       |
|   蔑    |  miè   |   Miệt   | `艹` (Thảo) + `罒` + `戊`         | `[Tra bộ Khang Hy: 艸/艹 (#140)]` Không rõ/nhỏ bé, coi thường, khinh miệt (cụm đáy dùng `戊` tạo nét thanh/hình); _từ ghép:_ 蔑视 (mièshì: khinh miệt), 轻蔑 (qīngmiè).                     |

### Nhóm B: Chữ nhóm `戈 / 成 / 戌 / 戍` dễ nhầm trực tiếp với `戊`

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng                         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| :-----: | :----: | :------: | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   城    | chéng  |  Thành   | `土` + `成` (**chứa `𠃌`, không phải `戊`**) | `[Tra bộ Khang Hy: 土 (#32)]` Hình thanh: `土` (tường đất) + `成` (`chéng`, thanh phù có thêm nét `𠃌` ở trong, khác `戊`) → tường thành, thành phố; _từ ghép:_ 城市 (chéngshì), 长城 (Chángchéng). |
|   越    |  yuè   |   Việt   | `走` + `戉` (**không phải `戊`**)            | `[Tra bộ Khang Hy: 走 (#156)]` Hình thanh kiêm hội ý: bước qua (`走`) + `戉` (cái rìu lớn — có nét xiên gập trên `戈`, không phải `戊`) → vượt qua, càng ngày càng; _từ ghép:_ 超越, 越来越.        |
|   戌    |   xū   |   Tuất   | `戊` + `一` bên trong                        | `[Tra bộ Khang Hy: 戈 (#62)]` Khác `戊` ở một nét ngang ngắn `一` bên trong; nghĩa: Địa Chi thứ 11 (giờ Tuất, con chó); _từ ghép:_ 戊戌 (wùxū: năm Mậu Tuất).                                       |
|   戍    |  shù   |   Thú    | `戊` + `丶` bên trong                        | `[Tra bộ Khang Hy: 戈 (#62)]` Hội ý: người (`丶` viết gọn từ `人`) cầm vũ khí (`戈/戊`) canh gác → đóng quân giữ biên ải; _từ ghép:_ 卫戍 (wèishù: phòng thủ), 戍边 (shùbiān).                      |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`戌` (Tuất), `戍` (Thú), `戎` (Nhung) — từ DB:** Ba chữ dễ nhầm nét nhất với `戊`, tất cả đều xếp ở bộ Qua `戈` (#62). Ghi nhớ câu khẩu quyết Trung văn: _“Hoành Tuất, điểm Thú, Mậu trung không; thập tự giao xoa tựu thị Nhung”_ (ngang là `戌`, chấm là `戍`, ở giữa trống là `戊`, chữ thập giao nhau là `戎`).
- **`成` (Thành — từ DB):** Mang nét cong móc `𠃌` bên trong khung `戈`, tạo ra cả họ chữ rất thông dụng như `城, 诚, 盛` — cần phân biệt tách bạch với `戊`.
- **`戈` (Qua, #62 — từ DB):** Bộ thủ vũ khí cổ gốc quản lý trực tiếp `戊, 戌, 戍, 戎, 成`.

---

## Bộ 227: 民 (Dân)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-132` · `radical_index`: `132` · `strokes`: `5` nét · `name_vi`: `bộ Dân` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `民`:** Thuộc bộ **Thị `氏` (#83)** (`氏` 4 nét; `民` 5 nét xếp mục `+1` nét dưới bộ `氏`).
- **Hình thái & Biến thể (`variants`):**
  - `民` — dạng chính duy nhất (5 nét: `𠃍 一 乚 一 ㇂`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Giáp cốt văn và Kim văn vẽ hình con mắt bị vật nhọn đâm vào, ban đầu chỉ tù binh / nô lệ bị cai trị; theo thời gian ngữ nghĩa mờ đi dấu vết cổ, chuyển sang chỉ “thường dân, lê dân, người dân”.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Nhân dân, dân chúng (`人民, 公民`), dân tộc (`民族`), dân sự, dân gian (`民事, 民间`); trong chữ ghép hiện đại (`眠, 抿, 泯, 岷`), `民` hầu như chỉ làm **thanh phù** _mín / mǐn / mián_.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Khi đứng độc lập hoặc ghép từ (`人民, 民族`) mang nghĩa “dân”; nhưng khi làm thành phần bên phải của chữ ghép (`眠, 抿, 泯, 岷`), `民` chủ yếu chỉ **đọc âm** (_mín / mǐn / mián_), còn bộ ý bên trái mới quyết định nghĩa (`目` mắt → ngủ, `扌` tay → mím/vuốt, `氵` nước → tiêu tan).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`民` = dân** (5 nét, có khung đầu `𠃍 一` giống cái miệng dẹt rồi sổ gập `乚`) vs **`氏` = họ tộc** (#83, 4 nét, nét đầu là phẩy `丿` chứ không có khung `𠃍`).
    - **`民` vs `人` (#9):** `人` chỉ con người nói chung (cá nhân); `民` chỉ cộng đồng dân chúng, công dân, dân tộc.
    - **`眠` có `民` nhưng không mang nghĩa “dân”:** Bộ `目` (mắt) quyết định nghĩa “nhắm mắt ngủ”, `民` chỉ làm phần âm _mián_.

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ mang nghĩa nhân dân & thanh phù gần âm `mín / mián` (`民, 氓, 眠`)

| Chữ Hán |   Pinyin    | Hán Việt | Thành phần ghép cùng       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                          |
| :-----: | :---------: | :------: | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   民    |     mín     |   Dân    | Độc thể (5 nét)            | `[Tra bộ Khang Hy: 氏 (#83)]` Người dân, nhân dân, công dân, dân sự, dân tộc; _từ ghép:_ 人民 (rénmín: nhân dân), 公民 (gōngmín: công dân), 民族 (mínzú: dân tộc).                      |
|   眠    |    mián     |   Miên   | `目` (Mục) + `民` (`mián`) | `[Tra bộ Khang Hy: 目 (#109)]` Hình thanh: `目` (mắt) + `民` (`mín` → `mián`, thanh phù) → nhắm mắt ngủ, ngủ đông; _từ ghép:_ 睡眠 (shuìmián: giấc ngủ), 失眠 (shīmián: mất ngủ), 冬眠. |
|   氓    | máng / méng |   Manh   | `亡` (Vong) + `民` (Dân)   | `[Tra bộ Khang Hy: 氏 (#83)]` Hội ý: người dân (`民`) lưu tán bỏ xứ (`亡`) → kẻ du thủ du thực, lưu manh (`máng`: 流氓 liúmáng); dân thường cổ (`méng`).                                |

### Nhóm B: Chữ dùng `民` làm thanh phù chuẩn `mǐn / mín` (`抿, 泯, 岷, 珉`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                       |
| :-----: | :----: | :------: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   抿    |  mǐn   |   Mẫn    | `扌` (Thủ) + `民` (`mǐn`)  | `[Tra bộ Khang Hy: 手/扌 (#64)]` Hình thanh: `扌` (cử động nhẹ của tay) + `民` (`mǐn`, thanh phù) → mím nhẹ (môi), vuốt nhẹ (tóc), nhấp ngụm nhỏ; _từ ghép:_ 抿嘴 (mǐnzuǐ: mím môi). |
|   泯    |  mǐn   |   Mẫn    | `氵` (Thủy) + `民` (`mǐn`) | `[Tra bộ Khang Hy: 水/氵 (#85)]` Hình thanh: `氵` (nước) + `民` (`mǐn`, thanh phù) → rửa trôi, mai một, tiêu tan hết; _từ ghép:_ 泯灭 (mǐnmiè: tiêu tan/mai một), 恩怨两泯.          |
|   岷    |  mín   |   Mân    | `山` (Sơn) + `民` (`mín`)  | `[Tra bộ Khang Hy: 山 (#46)]` Hình thanh: `山` (núi) + `民` (`mín`, thanh phù) → tên dãy núi và sông lớn ở Tứ Xuyên; _từ ghép:_ 岷山 (Mínshān: núi Mân Sơn), 岷江 (Mínjiāng).        |
|   珉    |  mín   |   Mân    | `王` (Ngọc) + `民` (`mín`) | `[Tra bộ Khang Hy: 玉/王 (#96)]` Hình thanh: `王` (đá ngọc) + `民` (`mín`, thanh phù) → loại đá đẹp giống ngọc; _từ ghép:_ 珉玉 (mínyù: đá mân ngọc).                                |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`眠` (ngủ) & `泯` (tiêu tan) — từ DB:** Hai chữ ghép tiêu biểu sử dụng `民` làm phần âm bên phải, tra cứu theo bộ bên trái (`目` #109 và `水/氵` #85).
- **`氏` (Thị, #83 — từ DB):** Bộ thủ Khang Hy gốc của `民`, nghĩa “họ tộc”. Cần chú ý phân biệt để không nhầm phần trên của chữ **`昏`** (`hūn`, hoàng hôn = `氏 + 日`) hoặc chữ **`纸`** (`zhǐ`, giấy = `纟 + 氏`) là `民`!
- **`人 / 亻` (Nhân, #9) & `口` (Khẩu, #30) — từ DB:** Các bộ liên quan đến con người và nhân khẩu nhưng là bộ thủ độc lập, khác cấu tạo với `民`.

---

## Bộ 228: 旡 (Ký)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Phân loại:** `[Linh kiện mở rộng trong DB - Ngoài 214 bộ Khang Hy]`
- **DB ID & Thứ tự:** `radical-134` · `radical_index`: `134` · `strokes`: `4` nét · `name_vi`: `bộ Ký / Ký vô` · Dòng trùng/rỗng: Không có.
- **Bộ thủ Khang Hy gốc của chữ `旡`:** Là **biến thể phụ của bộ Vô `无` (#71)** trong hệ thống 214 bộ Khang Hy (`无` là dạng chính của bộ #71, `旡` là biến thể phụ thường ghi kèm `无 / 旡`; trong tự học cổ văn, `旡` đọc _jì_ nghĩa “nghẹn hơi”, khác với `无` đọc _wú_ nghĩa “không có”, nhưng Khang Hy nhập chung thành một bộ #71).
- **Hình thái & Biến thể (`variants`):**
  - `旡` — dạng chính (4 nét: `一 𠃍 丿 乚`), nét thứ hai gập góc `𠃍`, tạo đầu dẹt phẳng khác với nét ngang dài thứ hai của `无`.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình người quay đầu sang bên, há miệng ợ nghẹn vì ăn đã no căng không nuốt nổi nữa (ngược hướng với `欠` là người há miệng hướng về trước thở/ngáp).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Gần như không còn dùng độc lập trong tiếng Trung hiện đại; giá trị thực tế lớn nhất là nhận diện được **`旡`** nằm ở nửa bên phải của chữ **`既`** (`jì`, “đã, rồi”) và chuỗi chữ hình thanh mang `既` (`慨, 概, 厩`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Trong học tập tiếng Trung hiện đại, nên xếp `旡` vào nhóm **linh kiện nhận diện/tra từ điển** thông qua chữ **`既`** (và từ dẫn xuất `既然, 感慨, 大概`) thay vì học như một từ đơn.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`旡` (Ký, biến thể #71) vs `无` (Vô, #71):** `无` nghĩa “không có” (giản thể của `無`, viết `一 一 丿 乚`); `旡` có nét gập `𠃍` (`一 𠃍 丿 乚`) và chỉ gặp trong `既`.
    - **`既` (dùng `旡`, đọc `jì`) vs `即` (dùng `卩`, đọc `jí`):** Cả hai có phần bên trái giống nhau (`皀` biến thể), nhưng bên phải của **`既`** là `旡` (quay đầu đi vì đã ăn xong = “đã, rồi”), còn bên phải của **`即`** là `卩` (người quỳ ngồi trước mâm cơm = “ngay, sắp sửa”).

### 2. Giải nghĩa chữ Hán dùng thành phần này làm linh kiện/thanh phù (theo Nhóm nghĩa `groups`)

### Nhóm A: Chữ gốc `旡` & chữ ghép trực tiếp từ `旡` (`旡, 既, 塈`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                         |
| :-----: | :----: | :------: | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   旡    |   jì   |    Ký    | Độc thể (biến thể của `无` #71) | `[Tra bộ Khang Hy: 无 (#71)]` Cổ tự vẽ người quay đầu nghẹn hơi vì ăn đã no; ngày nay không dùng độc lập, chủ yếu là phần phải của `既`.                                               |
|   既    |   jì   |    Ký    | `皀` (bát cơm) biến thể + `旡`  | `[Tra bộ Khang Hy: 无 (#71)]` Hội ý: ăn hết cơm (`皀`) rồi quay đầu đi (`旡`) → đã xong, đã rồi, vì đã…; _từ ghép:_ 既然 (jìrán: đã/vì đã), 既往 (jìwǎng: đã qua), 既…又… (vừa… vừa…). |
|   塈    |   jì   |    Ký    | `既` (chứa `旡`) + `土` (Thổ)   | `[Tra bộ Khang Hy: 土 (#32)]` Hình thanh cổ: lấy đất bùn (`土`) trát tường hoặc dừng chân nghỉ (`既`, thanh phù `jì`); chữ cổ ít dùng trong giao tiếp hiện đại.                        |

### Nhóm B: Họ chữ mang `既` (chứa `旡`) làm thanh phù (`慨, 概, 厩`) & đối chiếu tránh nhầm (`即`)

| Chữ Hán | Pinyin | Hán Việt | Thành phần ghép cùng              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                     |
| :-----: | :----: | :------: | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   慨    |  kǎi   |   Khái   | `忄` (Tâm) + `既` (chứa `旡`)     | `[Tra bộ Khang Hy: 心/忄 (#61)]` Hình thanh: `忄` (tâm trạng) + `既` (thanh phù cổ) → cảm khái, bùi ngùi, hào phóng; _từ ghép:_ 慷慨 (kāngkǎi: hào phóng), 感慨 (gǎnkǎi: cảm khái), 愤慨 (fènkǎi). |
|   概    |  gài   |   Khái   | `木` (Mộc) + `既` (chứa `旡`)     | `[Tra bộ Khang Hy: 木 (#75)]` Hình thanh: `木` (thanh gỗ gạt phẳng miệng đấu đong thóc) + `既` (thanh phù cổ) → gạt bằng, đại khái, khái quát; _từ ghép:_ 大概 (dàgài), 概念 (gàiniàn: khái niệm). |
|   厩    |  jiù   |   Cứu    | `广` (Nghiễm) + `既` (chứa `旡`)  | `[Tra bộ Khang Hy: 广 (#53)]` Hội ý kiêm thanh (Phồn thể: `廏 / 廐`): mái nhà (`广`) chứa ngựa ăn xong (`既` gợi âm `jiù`) → chuồng ngựa; _từ ghép:_ 马厩 (mǎjiù: chuồng ngựa).                    |
|   即    |   jí   |   Tức    | `皀` + `卩` (**không phải `旡`**) | `[Tra bộ Khang Hy: 卩 (#26)]` Chữ đối chiếu tránh nhầm: bên phải là `卩` (người quỳ trước mâm cơm), không phải `旡` → ngay tức thì, tức là; _từ ghép:_ 即使 (jíshǐ: cho dù), 立即 (lìjí: lập tức). |

### 3. Thành phần liên quan & Phân biệt dễ nhầm (`related_components`)

- **`既` (đã, rồi) & `概` (khái quát) — từ DB:** Hai chữ cốt lõi để ghi nhớ `旡`; toàn bộ nhóm `慨, 概, 厩` đều kế thừa khối chữ `既` ở bên phải.
- **`即` (ngay/tức thì — từ DB):** Cặp song sinh rất dễ viết nhầm với `既`; `即` dùng bộ Tiết `卩` (#26), còn `既` dùng `旡` (#71).
- **`无` (Vô, #71 — từ DB):** Dạng chính của bộ thủ #71 trong Khang Hy (chuyên dùng với nghĩa “không có” như `无人, 无线` trong tiếng Trung giản thể); `旡` là dạng biến thể thứ hai được ghép chung vào bộ này.
