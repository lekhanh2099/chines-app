# Nhóm D — Các Bộ Thủ 7–8 Nét Khang Hy Còn Lại (Bộ 162 → Bộ 178)

> Tài liệu chuẩn hóa **17 bộ thủ thuộc Nhóm D** từ **Bộ 162 (`角`) đến Bộ 178 (`非`)** (tương ứng các bộ 7–8 nét còn lại từ Khang Hy `#148` đến `#175`), ánh xạ trực tiếp vào bảng `public.hanzihome_radicals` theo quy chuẩn trong [README.md](./README.md).
>
> - **Đã có trong DB (`hanzihome_radicals`):** **17 / 17** bộ (`status: "EXISTS"`).
> - **Dòng trùng / rỗng cần lưu ý dọn/gộp khi chuẩn hóa DB:** Có **3 bộ** đang mang 1 dòng rỗng phụ ở chỉ số phía sau:
>   - `167. 赤`: dòng chính `radical-074` (`radical_index`: `74`), dòng rỗng `radical-187` (`radical_index`: `187`, `name_vi: null`).
>   - `169. 身`: dòng chính `radical-062` (`radical_index`: `62`), dòng rỗng `radical-190` (`radical_index`: `190`, `name_vi: null`).
>   - `177. 青`: dòng chính `radical-075` (`radical_index`: `75`), dòng rỗng `radical-206` (`radical_index`: `206`, `name_vi: null`).
> - **Kế thừa `groups` đã có sẵn trong DB:** Bộ `176. 隹` (`radical-204`) đã có sẵn 2 nhóm `groups` (`Tụ tập/đậu lại`: `集`; `Linh kiện âm hình/mở rộng`: `谁, 难, 准, 推, 维, 雇`). Khi chuẩn hóa, tài liệu giữ các chữ thực sự thuộc bộ `隹` (`集, 难` cùng `雀, 雅, 雄, 雕, 虽/雖...`) ở **Mục 2** và tách nhóm chữ mà `隹` chỉ đóng vai trò thành phần phụ ở bộ khác (`谁, 准, 推, 维, 雇`) sang **Mục 3**.
> - **Quy ước tra cứu trong bảng Mục 2:** Mọi dòng giải nghĩa đều ghi rõ chữ đó lấy bộ đang xét làm bộ tra cứu chính (`[Tra bộ ...]`) hay chỉ chứa bộ ở vị trí thành phần phụ/thanh phù (`[Tra bộ khác: ..., chứa ...]`) để tránh nhầm lẫn giữa tự điển Khang Hy (phồn thể) và tự điển Tân Hoa (giản thể).

| STT | Bộ thủ | Hán-Việt | Khang Hy | DB ID chính   | `radical_index` | Số nét | Dòng trùng / rỗng DB       | Liên kết nhanh                           |
| :-: | :----: | -------- | :------: | ------------- | :-------------: | :----: | -------------------------- | ---------------------------------------- |
| 162 |   角   | Giác     |   #148   | `radical-180` |       180       |   7    | —                          | [Bộ 162: 角 (Giác)](#bộ-162-角-giác)     |
| 163 |   谷   | Cốc      |   #150   | `radical-182` |       182       |   7    | —                          | [Bộ 163: 谷 (Cốc)](#bộ-163-谷-cốc)       |
| 164 |   豆   | Đậu      |   #151   | `radical-183` |       183       |   7    | —                          | [Bộ 164: 豆 (Đậu)](#bộ-164-豆-đậu)       |
| 165 |   豕   | Thỉ      |   #152   | `radical-184` |       184       |   7    | —                          | [Bộ 165: 豕 (Thỉ)](#bộ-165-豕-thỉ)       |
| 166 |   豸   | Trĩ      |   #153   | `radical-185` |       185       |   7    | —                          | [Bộ 166: 豸 (Trĩ)](#bộ-166-豸-trĩ)       |
| 167 |   赤   | Xích     |   #155   | `radical-074` |       74        |   7    | `radical-187` (#187, rỗng) | [Bộ 167: 赤 (Xích)](#bộ-167-赤-xích)     |
| 168 |   走   | Tẩu      |   #156   | `radical-188` |       188       |   7    | —                          | [Bộ 168: 走 (Tẩu)](#bộ-168-走-tẩu)       |
| 169 |   身   | Thân     |   #158   | `radical-062` |       62        |   7    | `radical-190` (#190, rỗng) | [Bộ 169: 身 (Thân)](#bộ-169-身-thân)     |
| 170 |   辛   | Tân      |   #160   | `radical-192` |       192       |   7    | —                          | [Bộ 170: 辛 (Tân)](#bộ-170-辛-tân)       |
| 171 |   辰   | Thần     |   #161   | `radical-193` |       193       |   7    | —                          | [Bộ 171: 辰 (Thần)](#bộ-171-辰-thần)     |
| 172 |   釆   | Biện     |   #165   | `radical-197` |       197       |   7    | —                          | [Bộ 172: 釆 (Biện)](#bộ-172-釆-biện)     |
| 173 |   里   | Lý       |   #166   | `radical-198` |       198       |   7    | —                          | [Bộ 173: 里 (Lý)](#bộ-173-里-lý)         |
| 174 |   長   | Trường   |   #168   | `radical-200` |       200       |   8    | —                          | [Bộ 174: 長 (Trường)](#bộ-174-長-trường) |
| 175 |   隶   | Đãi      |   #171   | `radical-203` |       203       |   8    | —                          | [Bộ 175: 隶 (Đãi)](#bộ-175-隶-đãi)       |
| 176 |   隹   | Chuy     |   #172   | `radical-204` |       204       |   8    | —                          | [Bộ 176: 隹 (Chuy)](#bộ-176-隹-chuy)     |
| 177 |   青   | Thanh    |   #174   | `radical-075` |       75        |   8    | `radical-206` (#206, rỗng) | [Bộ 177: 青 (Thanh)](#bộ-177-青-thanh)   |
| 178 |   非   | Phi      |   #175   | `radical-207` |       207       |   8    | —                          | [Bộ 178: 非 (Phi)](#bộ-178-非-phi)       |

---

## Bộ 162: 角 (Giác)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-180` | `radical_index`: `180` | `strokes`: `7` nét | `name_vi`: `bộ Giác` | _Khang Hy:_ `#148` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `角` — dạng chính duy nhất (`⺈` trên + khung `用` kín đáy dưới); đứng độc lập, đứng bên trái chữ ghép (`解, 触, 觞, 觥`) hoặc phía dưới/trên trong một số chữ ít gặp hơn (`觜, 觭`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình chiếc sừng thú nhọn cong có các ngấn đốt bên trong (Giáp cốt văn và Kim văn vẽ rõ nét sừng trâu, bò).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Sừng thú, góc nhọn, cạnh, vai diễn (`角色`), đơn vị tiền hào bằng 1/10 đồng Nhân dân tệ (`一角钱`); mở rộng sang húc/chạm (`触`), chia tách/mổ xẻ (`解` — dùng dao xẻ sừng bò), và tranh đua/đọ sức (`角逐`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `角` thường liên quan đến sừng thú, góc cạnh, chạm/đụng, chén rượu làm từ sừng thời cổ, hoặc sự phân giải/tách rời; đôi khi làm thanh phù gợi âm `jiǎo / jué`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Hai cách đọc của `角`:** Đọc **`jiǎo`** khi chỉ _sừng, góc, cạnh, tiền hào_ (`牛角, 三角形, 五角`); đọc **`jué`** khi chỉ _vai diễn, tranh tài, giác đấu_ (`角色, 主角, 角逐`).
    - **`角` vs `牛` / `羊`:** `牛` (trâu/bò) và `羊` (dê/cừu) là các loài vật có sừng, nhưng là những bộ thủ riêng biệt; bộ `角` chuyên biểu thị bản thân chiếc sừng và khái niệm góc cạnh.
    - **`角` vs `用` / `鱼 / 魚`:** Phần dưới của `角` giống chữ `用` nhưng có thêm đầu `⺈` và đáy ngang khép kín; còn `鱼` (cá) có phần thân dưới là `田` + nét ngang đuôi `一`, khác với khung chữ nhật có 2 nét ngang và nét sổ giữa của `角`.
    - **`解` (`jiě / jiè / xiè`) thuộc bộ `角`:** Cấu tạo `角 + 刀 + 牛` (dùng dao tách sừng khỏi đầu bò), nghĩa gốc là mổ xẻ/phân tách, mở rộng thành tháo gỡ, giải thích, hiểu rõ — không nên nhầm sang bộ `刀` hay bộ `牛`.
    - **Lưu ý dữ liệu DB cũ về `觅`:** Trong `related_components` cũ của DB từng liệt kê `觅` (`mì`, tìm kiếm), nhưng chữ giản thể `觅` (`爫 + 见`, phồn thể `覓`) thực chất liên quan bộ `爪/爫` và `见/見`, **không** thuộc hay chứa bộ `角`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Sừng thú, góc cạnh, va chạm & phân tách (tra bộ `角`)

| Chữ Hán | Pinyin          | Hán Việt    | Thiên bàng đứng chung                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                     |
| ------- | --------------- | ----------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 角      | jiǎo / jué      | Giác        | Độc thể (Bộ thủ chính)                  | [Tra bộ 角] Tượng hình sừng thú → sừng, góc cạnh, đơn vị tiền hào (`jiǎo`), vai diễn/đọ sức (`jué`); _từ ghép:_ 三角形 (sānjiǎoxíng: hình tam giác), 角色 (juésè: vai diễn).       |
| 解      | jiě / jiè / xiè | Giải        | 角 (sừng) + 刀 (dao) + 牛 (bò)          | [Tra bộ 角] Dùng dao tách sừng bò → mổ xẻ, cởi mở, giải thích, thấu hiểu (`jiě`), áp giải (`jiè`), họ Giải (`xiè`); _từ ghép:_ 了解 (liǎojiě: hiểu rõ), 解决 (jiějué: giải quyết). |
| 触      | chù             | Xúc         | 角 (Giác) + 虫 (giản của 蜀, phồn `觸`) | [Tra bộ 角] Thú dùng sừng húc chạm vào → tiếp xúc, đụng chạm, cảm động; _từ ghép:_ 接触 (jiēchù: tiếp xúc), 触动 (chùdòng: xúc động).                                              |
| 觜      | zī / zuǐ        | Chủy / Trủy | 此 (Thử) trên + 角 (Giác) dưới          | [Tra bộ 角] Chòm sừng nhỏ trên đầu chim cú, tên chòm sao Chủy (`zī`), thông với `嘴` chỉ cái mỏ/miệng (`zuǐ`); _từ ghép:_ 觜宿 (Zīxiù: sao Chủy), 凤头觜 (fèngtóuzī: mào chim cú). |
| 觭      | jī              | Cơ / Kỳ     | 角 (Giác) + 奇 (Kỳ)                     | [Tra bộ 角] Một sừng chĩa lên, một sừng cụp xuống → khập khiễng, đơn lẻ, không cân đối; _từ ghép:_ 觭梦 (jīmèng: giấc mộng kỳ lạ), 觭角 (jījiǎo: góc lẻ/nghiêng lệch).             |

### Nhóm B: Chén sừng nghi lễ cổ & trạng thái văn ngôn (tra bộ `角`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                            |
| ------- | ------ | -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 觞      | shāng  | Thương   | 角 (Giác) + 𠂉/昜 (phồn `觴`) | [Tra bộ 角] Chén uống rượu làm từ sừng thú thời cổ → chén rượu, nâng ly mời rượu; _từ ghép:_ 滥觞 (lànshāng: nguồn khởi thủy), 举觞 (jǔshāng: nâng chén).                 |
| 觥      | gōng   | Quang    | 角 (Giác) + 光 (Quang)        | [Tra bộ 角] Chén rượu lớn làm bằng sừng tê hoặc sừng trâu rừng thời Thương–Chu; _từ ghép:_ 觥筹交错 (gōngchóu-jiāocuò: chén thẻ chạm nhau rộn ràng tiệc rượu).            |
| 觚      | gū     | Cô       | 角 (Giác) + 瓜 (Qua)          | [Tra bộ 角] Bình/ly uống rượu hình loa có cạnh góc thời cổ, hoặc thẻ gỗ đa diện để tập viết; _từ ghép:_ 操觚 (cāogū: cầm bút viết văn), 铜觚 (tónggū: bình đồng hình cô). |
| 觳      | hú     | Hộc      | 壳 (Xác) + 角 (Giác)          | [Tra bộ 角] Sợ hãi run rẩy như thú trước khi bị giết tế, hoặc dụng cụ đong cổ; _từ ghép:_ 觳觫 (húsù: run rẩy sợ hãi).                                                    |
| 觖      | jué    | Quyết    | 角 (Giác) + 夬 (Quái)         | [Tra bộ 角] Bực bội, oán trách vì mong ước không thành; _từ ghép:_ 觖望 (juéwàng: oán vọng, bất mãn).                                                                     |

### Nhóm C: Chữ thông dụng chứa `角` (hoặc `解`) ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                      |
| ------- | ------ | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 嘴      | zuǐ    | Chủy     | 口 (Khẩu) + 觜 (chứa 角)                  | [Tra bộ 口] Cái miệng, cái mỏ, vòi ấm/đầu nhọn (`口` + thanh phù `觜`); _từ ghép:_ 嘴巴 (zuǐba: cái miệng), 闭嘴 (bìzuǐ: ngậm miệng).                               |
| 蟹      | xiè    | Giải     | 解 (chứa 角) + 虫 (Trùng)                 | [Tra bộ 虫] Loài giáp xác lột vỏ/càng sắc như dao cắt sừng → con cua; _từ ghép:_ 螃蟹 (pángxiè: con cua), 蟹黄 (xièhuáng: gạch cua).                                |
| 懈      | xiè    | Giải     | 忄 (Tâm) + 解 (chứa 角)                   | [Tra bộ 心/忄] Tinh thần (`忄`) buông lỏng, tháo rời (`解`) → lơ là, biếng nhác; _từ ghép:_ 松懈 (sōngxiè: lơi lỏng), 坚持不懈 (jiānchí-búxiè: kiên trì không nản). |
| 确      | què    | Xác      | 石 (Thạch) + 角 (giản thay 隺, phồn `確`) | [Tra bộ 石] Chắc chắn, chính xác (giản thể dùng `角` thay cho phần phải `隺` ở chữ phồn `確`); _từ ghép:_ 正确 (zhèngquè: chính xác), 确定 (quèdìng: xác định).     |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `解` (`jiě / jiè / xiè` · Giải · `角 + 刀 + 牛` — tháo gỡ, giải thích; tra bộ `角`, đồng thời làm gốc cấu tạo cho `懈`, `蟹`, `邂` `xiè` gặp gỡ tình cờ).
- `触 / 觸` (`chù` · Xúc · `角 + 虫/蜀` — đụng chạm, tiếp xúc; tra bộ `角`).
- `嘴` (`zuǐ` · Chủy · `口 + 觜` — miệng, mỏ; chứa `角` trong `觜`, tra bộ `口`).
- `蟹` (`xiè` · Giải · `解 + 虫` — con cua; chứa `角` trong `解`, tra bộ `虫`).
- `懈` (`xiè` · Giải · `忄 + 解` — lơi lỏng, lơ là; chứa `角` trong `解`, tra bộ `心/忄`).
- `确 / 確` (`què` · Xác · giản thể `石 + 角` — chắc chắn, xác thực; tra bộ `石`).
- `牛` (`niú` · Ngưu) & `羊` (`yáng` · Dương) — hai bộ thủ riêng chỉ loài vật có sừng, không nhập vào `角`.
- `觅 / 覓` (`mì` · Mịch · `爫 + 见` — tìm kiếm; bản ghi DB cũ từng nhắc ở `related_components` của `角`, nhưng chữ này thuộc bộ `见/見`, không thuộc và không chứa `角`).

---

## Bộ 163: 谷 (Cốc)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-182` | `radical_index`: `182` | `strokes`: `7` nét | `name_vi`: `bộ Cốc` | _Khang Hy:_ `#150` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `谷` — dạng chính duy nhất (`八 + 人 + 口`); đứng độc lập, đứng bên trái hoặc bên phải trong chữ ghép (`豁, 欲, 浴, 俗`), hoặc nằm phía dưới (`容`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình dòng nước chảy từ khe núi đổ tụ xuống miệng hang/thung lũng (hai nét mở phía trên tượng trưng khe nước và sườn núi, `口` bên dưới là miệng lũng).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Thung lũng, khe núi (`山谷, 峡谷`), khoảng trống rộng chứa đựng (`虚怀若谷`), đồng thời trong chữ giản thể hiện đại còn mang nghĩa **ngũ cốc, thóc lúa** (`谷物, 稻谷`) do giản hóa gộp chữ phồn thể `穀` (vốn thuộc bộ `禾`) vào chung mặt chữ `谷`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `谷` thường liên quan đến thung lũng, khe hở, sự trống rộng/dung nạp (`豁, 容`), sự ham muốn/khe khát (`欲`), hoặc làm thanh phù gợi âm `gǔ / yù / sú`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`谷` (thung lũng) vs `穀` (ngũ cốc phồn thể):** Trong phồn thể, `谷` là thung lũng (bộ `谷`), còn `穀` là lúa gạo/ngũ cốc (bộ `禾`). Giản thể dùng chung chữ `谷`, nên phải dựa vào ngữ cảnh để hiểu `山谷` (thung lũng núi) khác với `谷物` (ngũ cốc).
    - **`谷` (`八 + 人 + 口`, 7 nét) vs `㕣` (`八 + 口`, 5 nét):** Phần bên phải của `沿, 船, 铅` là `㕣` (bát trên khẩu = vũng đầm lầy, **không** có nét `人` ở giữa), KHÔNG phải bộ `谷`!
    - **`容` (`宀 + 谷`, tra bộ `宀`) vs `裕` (`衤 + 谷`, tra bộ `衣/衤`) vs `欲` (`谷 + 欠`, tra bộ `欠`):** Tự điển Khang Hy có rất ít chữ đứng trực tiếp dưới bộ `谷`; đa số chữ thông dụng chứa `谷` như `欲, 裕, 容, 俗, 浴` đều tra theo bộ khác (`欠, 衤, 宀, 亻, 氵`).
    - **`谷` vs `山` / `水`:** `山` (núi) và `水/氵` (nước) là các bộ thủ riêng cùng xuất hiện trong cảnh quan thung lũng.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Thung lũng, khe hở, dòng suối & ngũ cốc (tra bộ `谷`)

| Chữ Hán | Pinyin    | Hán Việt  | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                  |
| ------- | --------- | --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 谷      | gǔ / yù   | Cốc / Dục | Độc thể (Bộ thủ chính) | [Tra bộ 谷] Khe núi, thung lũng; trong giản thể còn thay `穀` nghĩa là thóc lúa/ngũ cốc (`gǔ`); đọc `yù` trong tên tộc cổ `吐谷浑`; _từ ghép:_ 山谷 (shāngǔ: thung lũng), 谷物 (gǔwù: ngũ cốc). |
| 豁      | huō / huò | Khoát     | 害 (Hại) + 谷 (Cốc)    | [Tra bộ 谷] Thung lũng mở thông rộng → khe hở/sứt mẻ (`huō`), rộng mở, thông suốt, miễn trừ (`huò`); _từ ghép:_ 豁达 (huòdá: khoát đạt/rộng lượng), 豁免 (huòmiǎn: miễn trừ).                   |
| 谿      | xī        | Khê       | 奚 (Hề) + 谷 (Cốc)     | [Tra bộ 谷] Khe suối chảy qua thung lũng núi (dạng cổ/văn ngôn của `溪`); _từ ghép:_ 谿壑 (xīhè: khe suối và thung lũng), 谿谷 (xīgǔ: khe lũng).                                                |
| 谺      | xiā       | Ha / Hạt  | 谷 (Cốc) + 牙 (Nha)    | [Tra bộ 谷] Dáng thung lũng sâu rộng, hang hốc trống trải; _từ ghép:_ 谺豁 (xiāhuò: trống trải sâu rộng).                                                                                       |

### Nhóm B: Chữ thông dụng chứa `谷` làm thành phần nghĩa/âm ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                        |
| ------- | ------ | -------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 欲      | yù     | Dục      | 谷 (Cốc - thanh phù) + 欠 (Khiếm - há miệng) | [Tra bộ 欠] Há miệng (`欠`) khao khát điều còn thiếu → ham muốn, dục vọng, sắp sửa; _từ ghép:_ 欲望 (yùwàng: dục vọng), 食欲 (shíyù: sự thèm ăn).     |
| 裕      | yù     | Dụ       | 衤 (Y - áo) + 谷 (Cốc - rộng/thanh phù)      | [Tra bộ 衣/衤] Áo quần rộng rãi đầy đủ như thung lũng → giàu có, dư dả, khoan dung; _từ ghép:_ 富裕 (fùyù: giàu có), 宽裕 (kuānyù: dư dả).            |
| 容      | róng   | Dung     | 宀 (Miên - nhà) + 谷 (Cốc)                   | [Tra bộ 宀] Nhà rộng chứa được nhiều → dung nạp, chứa đựng, dung mạo, dễ dàng; _từ ghép:_ 容易 (róngyì: dễ dàng), 内容 (nèiróng: nội dung).           |
| 俗      | sú     | Tục      | 亻 (Nhân) + 谷 (Cốc - thanh phù)             | [Tra bộ 人/亻] Thói quen phổ biến nơi thôn dã/thung lũng → phong tục, tục lệ, tầm thường; _từ ghép:_ 风俗 (fēngsú: phong tục), 俗话 (súhuà: tục ngữ). |
| 浴      | yù     | Dục      | 氵 (Thủy) + 谷 (Cốc - thanh phù)             | [Tra bộ 水/氵] Dùng nước (`氵`) dội tắm gội → tắm rửa, đắm mình; _từ ghép:_ 沐浴 (mùyù: tắm gội), 浴室 (yùshì: phòng tắm).                            |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `欲` (`yù` · Dục · `谷 + 欠` — ham muốn, sắp sửa; tra bộ `欠`).
- `裕` (`yù` · Dụ · `衤 + 谷` — giàu có, dư dả; tra bộ `衣/衤`).
- `容` (`róng` · Dung · `宀 + 谷` — chứa đựng, dung mạo, dễ; tra bộ `宀`).
- `俗` (`sú` · Tục · `亻 + 谷` — phong tục, bình dân; tra bộ `人/亻`).
- `浴` (`yù` · Dục · `氵 + 谷` — tắm rửa; tra bộ `水/氵`).
- `卻 / 却` (`què` · Khước · phồn thể `卻` gồm `谷 + 卩`, giản thể viết `去 + 卩` — từ chối, lại/nhưng; tra bộ `卩`).
- `穀` (`gǔ` · Cốc — lúa gạo, ngũ cốc trong phồn thể; tra bộ `禾`, giản thể hợp nhất thành `谷`).
- `㕣` (`yǎn` · Duyên — vũng đầm lầy, gồm `八 + 口` không có nét `人` ở giữa, gặp trong `沿, 船, 铅`; tránh nhầm với `谷`).
- `山` (`shān` · Sơn) & `水 / 氵` (`shuǐ` · Thủy) — các bộ thủ thiên nhiên độc lập liên quan đến cảnh quan thung lũng.

---

## Bộ 164: 豆 (Đậu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-183` | `radical_index`: `183` | `strokes`: `7` nét | `name_vi`: `bộ Đậu` | _Khang Hy:_ `#151` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `豆` — dạng chính duy nhất (`一 + 口 + 丷 + 一`); đứng độc lập, đứng bên trái (`豌, 豇, 豉`), đứng bên phải (`短, 逗`), hoặc đứng bên dưới (`登, 竖` trong phồn `豎`, `豊/豐`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình chiếc bát/đài đựng đồ tế lễ có chân cao thời cổ đại (nét ngang trên là nắp hoặc miệng bát, `口` là bầu bát, phần dưới là chân đế), ban đầu **không phải** hạt đậu ăn.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Nghĩa thông dụng hiện đại là **hạt đậu / cây họ đậu** (do giả tá mượn âm cổ); trong cấu tạo chữ cổ vẫn lưu giữ nghĩa gốc là **đồ đựng, nghi lễ dâng cúng, sự đầy đặn phong phú** (`豐, 登`), đo lường (`短`) hoặc đóng vai trò thanh phù `dòu`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `豆` ở bên trái chữ hiện đại thường chỉ các loại cây/món từ đậu (`豌, 豇, 豉`); ở vị trí khác có thể liên quan đến đồ chứa cổ, bước lên/phong phú (`登, 豐`), hoặc làm thanh phù `dòu` (`逗, 痘`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Không suy diễn máy móc "hạt đậu" cho mọi chữ có `豆`:** Trong `短` (ngắn — dùng tên `矢` và đồ đựng `豆` để đo chuẩn) hay `登` (leo lên — hai bàn chân `癶` bước lên đài `豆`), `豆` mang nghĩa đồ đựng cổ hoặc chuẩn đo, không liên quan đến hạt đậu.
    - **`豆` vs `亚 / 亞`:** `豆` có hộp `口` kín ở giữa và nét ngang `一` tách biệt phía trên; `亚` (6 nét, giản thể của `亞`) gồm hai nét ngang kẹp hai nét sổ và hai nét chấm/phẩy đối xứng hai bên.
    - **`豆` vs `皿` / `食`:** `皿` (bộ Mãnh) là bát đĩa đáy phẳng không chân đế cao; `食/饣` (bộ Thực) chỉ thức ăn nói chung.
    - **Biến đổi Phồn–Giản ở bộ `豆`:** Nhiều chữ rất quen thuộc trong phồn thể thuộc trực tiếp bộ `豆` như `豈` (khởi), `豎` (thụ), `豐` (phong), `豔` (diễm), nhưng sang giản thể đã lược mất hình `豆` thành `岂, 竖, 丰, 艳`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Các loại đậu, chế phẩm từ đậu & đồ lễ cổ (tra bộ `豆`)

| Chữ Hán | Pinyin | Hán Việt   | Thiên bàng đứng chung                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                         |
| ------- | ------ | ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 豆      | dòu    | Đậu        | Độc thể (Bộ thủ chính)                | [Tra bộ 豆] Gốc vẽ đài đựng đồ tế chân cao, nghĩa hiện đại là hạt đậu, cây họ đậu; _từ ghép:_ 大豆 (dàdòu: đậu tương), 土豆 (tǔdòu: khoai tây), 豆腐 (dòufu: đậu phụ). |
| 豌      | wān    | Uyển / Oản | 豆 (Đậu) + 宛 (Uyển - thanh phù)      | [Tra bộ 豆] Cây đậu leo có quả cong → đậu Hà Lan (`豆` biểu nghĩa + `宛` biểu âm); _từ ghép:_ 豌豆 (wāndòu: đậu Hà Lan).                                               |
| 豇      | jiāng  | Giang      | 豆 (Đậu) + 工 (Công - thanh phù)      | [Tra bộ 豆] Đậu quả dài (đậu đũa); _từ ghép:_ 豇豆 (jiāngdòu: đậu đũa).                                                                                                |
| 豉      | chǐ    | Thị        | 豆 (Đậu) + 支 (Chi)                   | [Tra bộ 豆] Hạt đậu lên men ủ muối làm gia vị; _từ ghép:_ 豆豉 (dòuchǐ: tàu xì / đậu tương lên men).                                                                   |
| 豊      | lǐ     | Lễ         | Hai chùm ngọc trên + 豆 (đài tế) dưới | [Tra bộ 豆] Chữ cổ vẽ bình ngọc đặt trên đài `豆` dùng trong nghi lễ (gốc của chữ `禮/礼`, phân biệt với `豐` `fēng`); _từ ghép:_ 豊礼 (lǐlǐ: lễ nghi cổ).             |

### Nhóm B: Chữ phồn thể thuộc bộ `豆` & dạng giản thể hiện đại

| Chữ Hán | Pinyin | Hán Việt    | Thiên bàng đứng chung                    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                   |
| ------- | ------ | ----------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 岂 / 豈 | qǐ     | Khởi / Khải | Giản `山 + 己`; phồn `山/𡳾 + 豆`        | [Tra bộ 山 (giản) / 豆 (phồn)] Gốc là tiếng trống khải hoàn (`豈`), mượn làm phó từ nghi vấn “lẽ nào, há chẳng”; _từ ghép:_ 岂有此理 (qǐ yǒu cǐ lǐ: há có lý ấy sao).            |
| 竖 / 豎 | shù    | Thụ         | Giản `刂/又 + 立`; phồn `臤 + 豆`        | [Tra bộ 立 (giản) / 豆 (phồn)] Đặt thẳng đứng cái đài `豆` → dựng thẳng đứng, nét sổ dọc; _từ ghép:_ 竖立 (shùlì: dựng đứng), 横竖 (héngshù: ngang dọc/dù sao đi nữa).           |
| 丰 / 豐 | fēng   | Phong       | Giản `丰`; phồn `豐` (hai chùm lúa + 豆) | [Tra bộ 丨 (giản) / 豆 (phồn)] Đài tế `豆` chất đầy ngọc/lúa tốt → dồi dào, phong phú, được mùa; _từ ghép:_ 丰富 (fēngfù: phong phú), 丰收 (fēngshōu: bội thu).                  |
| 艳 / 豔 | yàn    | Diễm        | Giản `丰 + 色`; phồn `豐 + 盇`           | [Tra bộ 色 (giản) / 豆 (phồn)] Vẻ đầy đặn rực rỡ (`豐`) của sắc thái → tươi đẹp, diễm lệ, ghen tị (`羡慕` khác âm); _từ ghép:_ 鲜艳 (xiānyàn: tươi thắm), 艳丽 (yànlì: diễm lệ). |

### Nhóm C: Chữ thông dụng dùng `豆` làm thành phần cấu tạo ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                          |
| ------- | ------ | -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 短      | duǎn   | Đoản     | 矢 (Thỉ - mũi tên) + 豆 (đồ đo cổ)    | [Tra bộ 矢] Mũi tên và thước/đồ đựng chuẩn cổ dùng đo vật ngắn → ngắn, thiếu hụt, khuyết điểm; _từ ghép:_ 长短 (chángduǎn: dài ngắn), 缺点/短处 (duǎnchù: khuyết điểm). |
| 登      | dēng   | Đăng     | 癶 (Bát - hai chân) + 豆 (bệ cao)     | [Tra bộ 癶] Hai chân bước lên bệ/đài cao → trèo lên, đăng ký, đăng tải; _từ ghép:_ 登山 (dēngshān: leo núi), 登录 (dēnglù: đăng nhập).                                  |
| 逗      | dòu    | Đậu      | 辶 (Sước) + 豆 (Đậu - thanh phù)      | [Tra bộ 辶] Dừng chân dọc đường → dừng lại, nấn ná, chọc ghẹo/gây cười; _từ ghép:_ 逗留 (dòuliú: nấn ná lại), 逗人笑 (dòu rén xiào: làm người ta cười).                 |
| 痘      | dòu    | Đậu      | 疒 (Nạch - bệnh) + 豆 (Đậu - hình/âm) | [Tra bộ 疒] Bệnh nổi mụn hạt như hạt đậu → bệnh đậu mùa, mụn trứng cá; _từ ghép:_ 青春痘 (qīngchūndòu: mụn trứng cá), 水痘 (shuǐdòu: thủy đậu).                         |
| 厨 / 廚 | chú    | Trù      | 广 (Nghiễm) + 尌 (chứa 豆 + 寸)       | [Tra bộ 广] Gian nhà (`广`) bày biện đồ đựng thức ăn (`尌` chứa `豆`) → nhà bếp; _từ ghép:_ 厨房 (chúfáng: nhà bếp), 厨师 (chúshī: đầu bếp).                            |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `短` (`duǎn` · Đoản · `矢 + 豆` — ngắn, khuyết điểm; tra bộ `矢`).
- `登` (`dēng` · Đăng · `癶 + 豆` — leo lên, đăng nhập; tra bộ `癶`).
- `逗` (`dòu` · Đậu · `辶 + 豆` — dừng lại, trêu chọc; tra bộ `辶`).
- `痘` (`dòu` · Đậu · `疒 + 豆` — mụn đậu, thủy đậu; tra bộ `疒`).
- `头 / 頭` (`tóu` · Đầu — cái đầu; phồn thể `頭` gồm `豆 + 頁`, tra bộ `頁`, giản thể viết `头`).
- `树 / 樹` (`shù` · Thụ — cây cối; phồn thể `樹` gồm `木 + 尌` chứa `豆`, giản thể viết `木 + 对`, tra bộ `木`).
- `喜` (`xǐ` · Hỷ — vui mừng) & `鼓` (`gǔ` · Cổ — cái trống): chứa linh kiện `壴` (chiếc trống đứng trên chân giống `豆`, nhưng không đồng nhất ngữ nghĩa với hạt đậu).
- `皿` (`mǐn` · Mãnh) & `食 / 饣` (`shí` · Thực) — các bộ thủ riêng về đồ đựng đáy phẳng và thức ăn.

---

## Bộ 165: 豕 (Thỉ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-184` | `radical_index`: `184` | `strokes`: `7` nét | `name_vi`: `bộ Thỉ` | _Khang Hy:_ `#152` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `豕` — dạng chính duy nhất (`一 + ノ + 𠃌/亅 + ノ + ノ + ノ + ㇏`); đứng độc lập, đứng bên phải (`豚, 逐`), hoặc đứng phía dưới (`家, 豪, 豢`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình con heo / con lợn đứng nghiêng nhìn rõ đầu, lưng cong, bụng, bốn chân và đuôi.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Con heo/lợn trong cổ văn (tiếng Trung hiện đại thường dùng chữ `猪`); trong hệ thống chữ ghép giữ vai trò gợi loài heo, gia súc, loài thú thân lớn (`象, 豪, 豫`), hay hình ảnh nhà có nuôi heo (`家`), đuổi theo bầy thú (`逐`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `豕` thường liên quan đến con heo/lợn, gia súc, loài thú thân lớn (`象, 豪`), hoặc hình ảnh sinh hoạt nông nghiệp cổ (`家`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`豕` vs `猪`:** `豕` (`shǐ`) là chữ và bộ cổ chỉ con heo; `猪` (`zhū` = `犭 + 者`, tra bộ `犬/犭`) mới là chữ thông dụng hàng ngày chỉ "con lợn/thịt lợn" trong tiếng Trung hiện đại (`猪肉, 小猪`).
    - **`豕` vs `犬 / 犭`:** `犭` (khuyển bàng) là bộ chỉ chó và loài thú nói chung (`狗, 猫, 狼`), xuất hiện thường xuyên hơn `豕`.
    - **`豕` vs `豖` (`chù`):** `豖` là `豕` có thêm 1 nét chấm ở chân (tượng hình con heo bị trói chân), là linh kiện trung tâm trong `琢` (đẽo ngọc), `啄` (chim mổ), `逐` (bản cổ) và đáy chữ `家` cổ.
    - **`象` (`xiàng`, voi) thuộc bộ `豕`:** Phần đầu trên của `象` vẽ đầu và chiếc vòi dài của con voi, phần dưới lệ biến thành hình giống `豕` biểu thị thân thú bốn chân đồ sộ — không nên tách thô thành "cái gì + con lợn".
    - **`家` (`jiā`, nhà) thuộc bộ `宀`:** `宀` (mái nhà) + `豕` (con heo), phản ánh nếp sống định cư nuôi gia súc dưới mái nhà thời nông nghiệp cổ; người học dùng hình ảnh này làm mẹo nhớ chữ `家` = gia đình/nhà cửa, không hiểu máy móc thành "chuồng lợn".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Loài heo, loài thú lớn & ý nghĩa mở rộng (tra bộ `豕`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                     |
| ------- | ------ | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 豕      | shǐ    | Thỉ      | Độc thể (Bộ thủ chính)                     | [Tra bộ 豕] Tượng hình con heo/lợn; ít dùng độc lập hiện đại, còn gặp trong thành ngữ; _từ ghép:_ 狼奔豕突 (lángbēn-shǐtū: chạy tán loạn như sói như heo).         |
| 象      | xiàng  | Tượng    | Đầu vòi voi trên + thân 豕 dưới            | [Tra bộ 豕] Tượng hình con voi có vòi dài và thân lớn → con voi, hình tượng, hiện tượng, giống như; _từ ghép:_ 大象 (dàxiàng: con voi), 印象 (yìnxiàng: ấn tượng). |
| 豪      | háo    | Hào      | 髙 (tỉnh lược) trên + 豕 (Thỉ) dưới        | [Tra bộ 豕] Gốc là loài nhím lông cứng sắc → người kiệt xuất, hào sảng, xa hoa; _từ ghép:_ 自豪 (zìháo: tự hào), 豪华 (háohuá: sang trọng).                        |
| 豫      | yù     | Dự       | 予 (Dư - thanh phù) + 象 (Tượng - chứa 豕) | [Tra bộ 豕] Gốc là con voi lớn an nhàn → do dự, chuẩn bị trước, tên tắt tỉnh Hà Nam; _từ ghép:_ 犹豫 (yóuyù: do dự), 豫剧 (Yùjù: kịch Hà Nam).                     |
| 豚      | tún    | Đồn      | 月 (Nhục - thịt) + 豕 (Thỉ)                | [Tra bộ 豕] Heo sữa nhỏ thịt béo → heo con, mượn gọi cá heo, cá nóc; _từ ghép:_ 海豚 (hǎitún: cá heo), 河豚 (hétún: cá nóc).                                       |
| 豢      | huàn   | Hoạn     | 𠔉 (hai tay bưng thóc) + 豕 (Thỉ)          | [Tra bộ 豕] Cho heo/gia súc ăn ngũ cốc → nuôi dưỡng, mua chuộc bằng lợi ích; _từ ghép:_ 豢养 (huànyǎng: nuôi dưỡng, nuôi nấng).                                    |
| 豨      | xī     | Hy       | 豕 (Thỉ) + 希 (Hy - thanh phù)             | [Tra bộ 豕] Loài lợn lớn trong văn ngôn cổ; _từ ghép:_ 封豕长蛇 (fēngshǐ-chángshé: kẻ tham lam tàn bạo như lợn lớn rắn dài).                                       |

### Nhóm B: Chữ thông dụng mang `豕` (hoặc `豖`) làm linh kiện ở bộ khác

| Chữ Hán | Pinyin     | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                        |
| ------- | ---------- | -------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 家      | jiā        | Gia      | 宀 (Miên - mái nhà) + 豕 (Thỉ) | [Tra bộ 宀] Mái nhà có nuôi gia súc → nhà, gia đình, chuyên gia, nhà trường phái; _từ ghép:_ 家人 (jiārén: người nhà), 大家 (dàjiā: mọi người).       |
| 逐      | zhú        | Trục     | 辶 (Sước - đi/chạy) + 豕 (Thỉ) | [Tra bộ 辶] Đuổi theo dấu chân bầy heo/thú → xua đuổi, đuổi theo, lần lượt từng bước; _từ ghép:_ 追逐 (zhuīzhú: đuổi theo), 逐渐 (zhújiàn: dần dần).  |
| 琢      | zhuó / zuó | Trác     | 王 (Ngọc) + 豖 (chứa 豕)       | [Tra bộ 玉/王] Đẽo gọt viên ngọc (`zhuó`), nghiền ngẫm suy nghĩ (`zuó`); _từ ghép:_ 雕琢 (diāozhuó: điêu khắc gọt giũa), 琢磨 (zuómo: suy ngẫm).      |
| 啄      | zhuó       | Trác     | 口 (Khẩu) + 豖 (chứa 豕)       | [Tra bộ 口] Dùng mỏ (`口`) gõ mổ liên tiếp → chim mổ thức ăn; _từ ghép:_ 啄木鸟 (zhuómùniǎo: chim gõ kiến).                                           |
| 缘 / 緣 | yuán       | Duyên    | 纟 (Mịch) + 彖 (chứa 豕)       | [Tra bộ 糸/纟] Đường viền tơ áo men theo bờ mép → duyên phận, nguyên nhân, men theo; _từ ghép:_ 缘分 (yuánfèn: duyên phận), 边缘 (biānyuán: rìa mép). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `家` (`jiā` · Gia · `宀 + 豕` — nhà, gia đình; tra bộ `宀`).
- `逐` (`zhú` · Trục · `辶 + 豕` — đuổi theo, từng bước; tra bộ `辶`).
- `琢` (`zhuó / zuó` · Trác · `王 + 豖` — đẽo gọt, suy ngẫm; tra bộ `玉/王`).
- `啄` (`zhuó` · Trác · `口 + 豖` — mổ; tra bộ `口`).
- `缘 / 緣` (`yuán` · Duyên · `纟 + 彖` — duyên phận, mép viền; tra bộ `糸/纟`).
- `队 / 隊` (`duì` · Đội — đội ngũ; phồn thể `隊` gồm `阝 + 𠂢/豕`, giản thể viết `阝 + 人`, tra bộ `阜/阝`).
- `猪` (`zhū` · Trư · `犭 + 者` — con lợn trong tiếng Trung hiện đại; tra bộ `犬/犭`, không dùng `豕`).
- `犬 / 犭` (`quǎn` · Khuyển) — bộ thủ riêng chỉ chó và loài thú nói chung.

---

## Bộ 166: 豸 (Trĩ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-185` | `radical_index`: `185` | `strokes`: `7` nét | `name_vi`: `bộ Trĩ / Trãi` | _Khang Hy:_ `#153` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `豸` — dạng chính duy nhất (`ノ 丶 丶 ノ 𠃌 ノ ノ`); hầu như luôn đứng ở **bên trái** chữ ghép trái–phải (`貌, 豹, 豺, 貂, 貉`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình loài thú hoang thân dài, lưng uốn mềm đang rình mồi hoặc bò trườn (phần đầu là nét phẩy và hai chấm như tai/mắt thú, thân cong có hai nét phẩy chân); trong văn tự cổ cũng từng dùng cho sâu trùng không chân, sau chuyên chỉ mãnh thú họ mèo, báo, sói, chồn.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Thú hoang thân dài, mãnh thú ăn thịt (`豹, 豺, 貂, 貉, 貘`); đặc biệt mở rộng sang hình dáng, vẻ ngoài trong chữ rất thông dụng `貌` (dung mạo, lễ mạo).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `豸` ở bên trái thường liên quan đến các loài thú hoang ăn thịt thân dài (họ mèo, chồn, báo, sói) hoặc dáng vẻ bên ngoài (`貌`).
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `豸` vs `犭`:**
    - **`豸` (bộ Trĩ, 7 nét) vs `犭` (Khuyển bàng, 3 nét):** `豸` có 7 nét với phần đầu `爫`-gần (`ノ 丶 丶 ノ`) và thân dài uốn cong, là bộ thú cổ thiên về thú hoang họ mèo/chồn/báo; `犭` chỉ có 3 nét (`ノ 𠃌 ノ`, biến thể của bộ `犬`), là bộ phổ biến nhất trong chữ giản thể hiện đại để chỉ chó và động vật bốn chân nói chung (`狗, 狼, 猴, 猪, 狐`).
    - **Chuyển đổi Phồn–Giản dễ gây "sốc chữ" (`貓` → `猫`):** Nhiều tên loài thú từng dùng `豸` trong phồn thể hoặc dị thể cổ đã chuyển sang dùng `犭` trong giản thể chuẩn hiện đại: tiêu biểu nhất là **`貓` (phồn thể, bộ `豸`) → `猫` (giản thể, bộ `犭`)**; tương tự `貍` (cổ/dị thể, bộ `豸`) → `狸` (thông dụng, bộ `犭`). Ngược lại, các chữ `貌, 豹, 豺, 貂, 貉` vẫn giữ nguyên `豸` ở cả phồn lẫn giản thể.
    - **`豸` vs `虫`:** `虫` chỉ côn trùng, rắn rết, sâu bọ; `豸` chỉ thú có vú thân dài (không suy diễn theo nghĩa cổ "trùng không chân").
    - **`豸` vs `豕`:** `豕` (con heo) có đầu là nét ngang `一` và thường đứng độc lập hoặc bên phải/dưới; `豸` luôn có phẩy + hai chấm trên đầu và đứng ở bên trái.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Dung mạo & mãnh thú họ báo, sói, chồn (tra bộ `豸`)

| Chữ Hán | Pinyin        | Hán Việt   | Thiên bàng đứng chung                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                            |
| ------- | ------------- | ---------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 豸      | zhì           | Trĩ / Trãi | Độc thể (Bộ thủ chính)                | [Tra bộ 豸] Loài thú thân dài, linh thú trong truyền thuyết (giải trãi biết phân biệt đúng sai); _từ ghép:_ 獬豸 (xièzhì: con giải trãi).                 |
| 貌      | mào           | Mạo        | 豸 (Trĩ) + 皃 (Mạo - hình đầu người)  | [Tra bộ 豸] Dáng vẻ, diện mạo, ngoại hình, thái độ lịch sự; _từ ghép:_ 礼貌 (lǐmào: lễ phép), 外貌 (wàimào: ngoại hình).                                  |
| 豹      | bào           | Báo        | 豸 (Trĩ) + 勺 (Thược - thanh phù/đốm) | [Tra bộ 豸] Loài thú dữ thân dài lông có đốm tròn → con báo; _từ ghép:_ 豹子 (bàozi: con báo), 猎豹 (lièbào: báo săn).                                    |
| 豺      | chái          | Sài        | 豸 (Trĩ) + 才 (Tài - thanh phù)       | [Tra bộ 豸] Loài chó sói đỏ hung dữ, ẩn dụ kẻ tham lam tàn ác; _từ ghép:_ 豺狼 (cháiláng: lang sói/kẻ tàn bạo).                                           |
| 貂      | diāo          | Điêu       | 豸 (Trĩ) + 召 (Triệu - thanh phù)     | [Tra bộ 豸] Con chồn điêu thân mảnh lông mượt quý giá; _từ ghép:_ 貂皮 (diāopí: da lông chồn), 狗尾续貂 (gǒuwěi-xùdiāo: nối đuôi chó vào lông chồn).      |
| 貉      | hé / háo / mò | Hạc / Mạch | 豸 (Trĩ) + 各 (Các - thanh phù)       | [Tra bộ 豸] Con lửng chó (`hé` trong thành ngữ, `háo` trong khẩu ngữ); tên bộ tộc phương Bắc cổ (`mò`); _từ ghép:_ 一丘之貉 (yìqiūzhīhé: cùng một giuộc). |

### Nhóm B: Thú hoang khác, linh thú & cặp chuyển đổi `豸` ↔ `犭`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| ------- | ------ | -------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 貘      | mò     | Mạch     | 豸 (Trĩ) + 莫 (Mạc - thanh phù)   | [Tra bộ 豸] Loài thú thân mập mũi vòi ngắn (heo vòi); _từ ghép:_ 大貘 (dàmò: heo vòi lớn), 马来貘 (Mǎláimò: heo vòi Mã Lai).                                         |
| 貊      | mò     | Mạch     | 豸 (Trĩ) + 百 (Bách - thanh phù)  | [Tra bộ 豸] Tên gọi bộ tộc phương Đông–Bắc thời cổ đại; _từ ghép:_ 蛮貊 (mánmò: các tộc man di cổ).                                                                  |
| 貔      | pí     | Tỳ       | 豸 (Trĩ) + 比 (Tỷ - thanh phù)    | [Tra bộ 豸] Mãnh thú truyền thuyết biểu tượng cho quân đội dũng mãnh; _từ ghép:_ 貔貅 (píxiū: tỳ hưu — linh thú chiêu tài).                                          |
| 貅      | xiū    | Hưu      | 豸 (Trĩ) + 休 (Hưu - thanh phù)   | [Tra bộ 豸] Thú dữ cổ truyền thuyết, luôn đi cặp với `貔`; _từ ghép:_ 貔貅 (píxiū: tỳ hưu).                                                                          |
| 貓 / 猫 | māo    | Miêu     | Phồn `豸 + 苗`; giản `犭 + 苗`    | [Tra bộ 豸 (phồn) / 犬-犭 (giản)] Con mèo (giản thể chuyển hẳn bộ thú cổ `豸` sang khuyển bàng `犭`); _từ ghép:_ 小猫 (xiǎomāo: mèo con), 熊猫 (xióngmāo: gấu trúc). |
| 貍 / 狸 | lí     | Ly       | Dị thể `豸 + 里`; chuẩn `犭 + 里` | [Tra bộ 豸 (dị thể) / 犬-犭 (chuẩn)] Loài cáo, chồn hương, mèo rừng; _từ ghép:_ 狐狸 (húli: con cáo), 果子狸 (guǒzilí: cầy vòi hương).                               |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `犭 / 犬` (`quǎn` · Khuyển — bộ chó/thú; thường thay thế `豸` trong chữ giản thể hiện đại như `貓 → 猫`, `貍 → 狸`).
- `藐` (`miǎo` · Miểu · `艹 + 貌(chứa 豸)` — nhỏ bé, khinh thường, coi nhẹ; tra bộ `艹`, như `藐视` miệt thị/khinh thường).
- `恳 / 懇` (`kěn` · Khẩn) & `垦 / 墾` (`kěn` · Khẩn): trong phồn thể `懇` (`豤 + 心`) và `墾` (`豤 + 土`), phần bên trái `豤` chính là `豸 + 艮`; giản thể lược mất `豸` chỉ còn `艮` (`恳, 垦`), tra bộ `心` và bộ `土`.
- `虫` (`chóng` · Trùng — sâu bọ, bò sát; bộ thủ riêng, không phải thú có vú như `豸`).

---

## Bộ 167: 赤 (Xích)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-074` | `radical_index`: `74` | `strokes`: `7` nét | `name_vi`: `bộ Xích` | _Khang Hy:_ `#155` | _Dòng trùng/rỗng:_ Có **1 dòng trùng rỗng `radical-187`** (`radical_index`: `187`, `radical`: `"赤"`, `name_vi: null`) cần gộp/dọn khi chuẩn hóa DB.
- **Hình thái & Biến thể (`variants`):**
  - `赤` — dạng chính duy nhất (`土` trên + phần đáy biến dạng từ `火` thành `丿 亅 丿 丶`); đứng độc lập hoặc đứng bên trái chữ ghép (`赦, 赫, 赧, 赭`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý cổ: phía trên là `大` (người/to lớn), phía dưới là `火` (ngọn lửa lớn); về sau Khải thư biến đổi phần trên thành `土` và phần dưới giống `亦`, biểu thị **màu đỏ rực của lửa**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Màu đỏ (`赤道` xích đạo, `赤潮` thủy triều đỏ), trống trơn/trần trụi không che đậy (`赤脚` chân trần, `赤裸` trần trụi), lòng son chân thành (`赤诚, 赤子之心`), và thâm hụt tài chính (`赤字` mực đỏ ghi lỗ → thâm hụt ngân sách).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `赤` thường liên quan đến sắc đỏ rực rỡ, sự nóng sáng, trần trụi hoặc cảm xúc/ân xá văn ngôn (`赫, 赧, 赦`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`赤` vs `红`:** Trong tiếng Trung hiện đại, **`红`** (`hóng`, bộ `糸/纟`) mới là từ phổ biến nhất chỉ màu đỏ (`红色, 红茶`); còn `赤` mang sắc thái trang trọng, văn chương, Hán-Việt hoặc chỉ sắc thái trần trụi/thâm hụt (`赤裸, 赤诚, 赤字`).
    - **`赤` (7 nét) vs `亦` (6 nét):** `赤` phần đầu là `土` (ngang–sổ–ngang), `亦` ("cũng") phần đầu là `亠` (chấm–ngang).
    - **`赦` (`shè`, tha tội):** Kết hợp `赤` + `攵`, nghĩa gốc liên quan đến làm dịu tội/ân xá, không đoán trực tiếp là "đánh màu đỏ".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Sắc đỏ rực, trần trụi & biểu lộ trên gương mặt (tra bộ `赤`)

| Chữ Hán | Pinyin | Hán Việt   | Thiên bàng đứng chung             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                  |
| ------- | ------ | ---------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 赤      | chì    | Xích       | Độc thể (Bộ thủ chính)            | [Tra bộ 赤] Màu đỏ rực, trần trụi không che, chân thành, thâm hụt; _từ ghép:_ 赤道 (chìdào: đường xích đạo), 赤字 (chìzì: thâm hụt), 赤脚 (chìjiǎo: chân trần). |
| 赫      | hè     | Hách       | 赤 (Xích) + 赤 (Xích)             | [Tra bộ 赤] Hai màu đỏ rực cháy sáng rọi → rực rỡ, hiển hách, lừng lẫy; _từ ghép:_ 显赫 (xiǎnhè: hiển hách), 赫赫有名 (hèhè-yǒumíng: nổi danh lừng lẫy).        |
| 赧      | nǎn    | Noãn / Nản | 赤 (Xích) + 𠬝/艮 (thanh phù)     | [Tra bộ 赤] Mặt đỏ ửng lên vì xấu hổ, thẹn thùng; _từ ghép:_ 赧颜 (nǎnyán: đỏ mặt ngượng ngùng), 羞赧 (xiūnǎn: thẹn thùng).                                     |
| 赭      | zhě    | Giả        | 赤 (Xích) + 者 (Giả - thanh phù)  | [Tra bộ 赤] Màu đỏ nâu / đất son đỏ; cổ đại còn chỉ áo màu đỏ nâu của phạm nhân; _từ ghép:_ 赭石 (zhěshí: đá son đỏ), 赭色 (zhěsè: màu nâu đỏ).                 |
| 赪 / 赬 | chēng  | Sanh       | 赤 (Xích) + 贞 (Trinh, phồn `貞`) | [Tra bộ 赤] Sắc đỏ tươi, đỏ sẫm (ít gặp trong khẩu ngữ, thường dùng trong miêu tả văn học); _từ ghép:_ 赪颜 (chēngyán: gương mặt ửng đỏ).                       |

### Nhóm B: Ân xá & chữ thông dụng chứa `赤` xếp ở bộ khác

| Chữ Hán | Pinyin   | Hán Việt | Thiên bàng đứng chung                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                |
| ------- | -------- | -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 赦      | shè      | Xá       | 赤 (Xích) + 攵 (Phộc)                 | [Tra bộ 赤] Xóa bỏ tội lỗi, ân xá, tha bổng (`赤` góp âm cổ và nét lịch sử); _từ ghép:_ 赦免 (shèmiǎn: ân xá, miễn tội), 大赦 (dàshè: đại xá).                                |
| 郝      | hǎo      | Hác      | 赤 (Xích) + 阝 (Ấp - đất)             | [Tra bộ 邑/阝] Tên vùng đất cổ thời Chu, ngày nay dùng làm họ người phổ biến (họ Hác); _từ ghép:_ 姓郝 (xìng Hǎo: họ Hác).                                                    |
| 吓 / 嚇 | xià / hè | Hách     | Giản `口 + 下`; phồn `口 + 赫(赤+赤)` | [Tra bộ 口] Hù dọa làm giật mình (`xià`), quát nạt thị uy (`hè`, bản phồn chứa chữ `赫` gồm hai `赤`); _từ ghép:_ 吓一跳 (xià yí tiào: giật bắn mình), 恐吓 (kǒnghè: đe dọa). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `郝` (`hǎo` · Hác · `赤 + 阝` — địa danh cổ, họ Hác; tra bộ `邑/阝`).
- `吓 / 嚇` (`xià / hè` · Hách — hù dọa, đe dọa; phồn thể `嚇` là `口 + 赫` chứa hai `赤`, giản thể đổi thành `吓`, tra bộ `口`).
- `红 / 紅` (`hóng` · Hồng · `纟 + 工` — màu đỏ thông dụng hiện đại; tra bộ `糸/纟`, không dùng `赤`).
- `火` (`huǒ` · Hỏa — lửa; bộ thủ riêng, là gốc hình thành nửa dưới của `赤`).

---

## Bộ 168: 走 (Tẩu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-188` | `radical_index`: `188` | `strokes`: `7` nét | `name_vi`: `bộ Tẩu` | _Khang Hy:_ `#156` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `走` — dạng chính duy nhất (`土` trên + `龰` dưới, 7 nét); khi đứng ghép chữ thường đóng vai trò **bán bao vây trái–dưới**, kéo dài nét mác cuối `㇏` sang phải để nâng đỡ thành phần còn lại (`起, 越, 超, 赶, 趣, 赴, 趋`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý: phía trên là hình người chạy vung hai tay (`夭` biến dạng thành `土`), phía dưới là hình bàn chân (`止` biến dạng thành `龰`). Nghĩa gốc trong Hán cổ là **chạy** (`走马观花` cưỡi ngựa phi nhanh ngắm hoa).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Trong tiếng Trung hiện đại, nghĩa chính của `走` chuyển thành **đi bộ, đi lại, rời đi** (`走路, 走开`); trong hệ thống chữ ghép bộ `走` vẫn giữ mạnh sắc thái **chuyển động nhanh, đứng dậy khởi đầu, đuổi theo, vượt qua, hướng tới** (`起, 赶, 越, 超, 赴, 趋`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Thấy khung `走` ôm bên trái và lót dưới đáy thường liên quan đến đi, chạy, đứng lên, đuổi, vượt, tiến trình hoặc chí hướng.
  - _Phân biệt dễ nhầm (`distinguish`) — Làm rõ bộ ba chuyển động `走` vs `⻊/足` vs `辶`:**
    1. **`走` (bộ Tẩu, 7 nét: `土 + 龰`):** Ôm trái và lót đáy bằng nét mác dài. Nghĩa thiên về **bước đi/chạy tới, khởi phát, đuổi bắt, vượt qua** (`起` đứng dậy, `赶` đuổi kịp, `越` vượt qua, `超` siêu việt, `赴` đi tới).
    2. **`⻊ / 足` (bộ Túc, 7 nét: `口 + 止`):** Độc thể viết `足`, khi đứng bên trái biến thành **`⻊`** (không lót đáy chữ khác). Nghĩa thiên về **bàn chân và động tác cụ thể của đôi chân** (`跑` chạy, `跳` nhảy, `踢` đá, `踩` giẫm, `路` con đường). Phân biệt nhanh nét đầu: `走` đầu là `土`, `足` đầu là `口`.
    3. **`辶` (bộ Sước/Xước, 3 nét giản thể — gốc `辵`):** Cũng ôm trái và lót đáy bằng nét mác dài giống `走`, nhưng nét gọn chỉ có `丶 ㇋ ㇏`. Nghĩa thiên về **quá trình di chuyển, đi qua, đến/rời, khoảng cách trên đường** (`这, 过, 进, 远, 送, 追`).
    4. **Mẹo nhớ bộ ba:** **`⻊/足` = cái chân & động tác chân**; **`走` = chạy/rảo bước vượt tới**; **`辶` = con đường & hành trình di chuyển**.
    5. **`彳` (bộ Xích, 3 nét):** Chỉ bước chân đi lại, phố xá, hành vi (`很, 行, 街, 往`), đứng gọn bên trái như `⻊`, không lót đáy.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Đi lại, đứng dậy & tiến bước về phía trước (tra bộ `走`)

| Chữ Hán | Pinyin      | Hán Việt      | Thiên bàng đứng chung              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                  |
| ------- | ----------- | ------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 走      | zǒu         | Tẩu           | Độc thể (Bộ thủ chính)             | [Tra bộ 走] Cổ nghĩa là chạy, hiện đại là đi bộ, rời đi, trôi qua; _từ ghép:_ 走路 (zǒulù: đi bộ), 走开 (zǒukāi: đi chỗ khác).                                  |
| 起      | qǐ          | Khởi          | 走 (Tẩu) + 己 (Kỷ - thanh phù)     | [Tra bộ 走] Đứng dậy, nhấc lên, khởi đầu, nảy sinh; làm bổ ngữ xu hướng chỉ chiều đi lên/bắt đầu; _từ ghép:_ 起床 (qǐchuáng: thức dậy), 一起 (yìqǐ: cùng nhau). |
| 赴      | fù          | Phó           | 走 (Tẩu) + 卜 (Bốc - thanh phù)    | [Tra bộ 走] Rảo bước đi thẳng tới một nơi hay sự kiện → dấn thân, đi dự; _từ ghép:_ 赴约 (fùyuē: đi đúng hẹn), 全力以赴 (quánlì yǐ fù: dốc toàn lực).           |
| 趋 / 趨 | qū          | Xu            | 走 (Tẩu) + 刍 (Sô, phồn `芻`)      | [Tra bộ 走] Bước nhanh hướng về phía trước → ngả theo, xu hướng; _từ ghép:_ 趋势 (qūshì: xu thế), 趋向 (qūxiàng: hướng về).                                     |
| 趟      | tàng / tāng | Thang / Thảng | 走 (Tẩu) + 尚 (Thượng - thanh phù) | [Tra bộ 走] Lượng từ chỉ số lượt đi lại (`tàng`), lội qua nước/bùn (`tāng`); _từ ghép:_ 一趟 (yí tàng: một chuyến), 趟水 (tāngshuǐ: lội nước).                  |

### Nhóm B: Vượt qua, đuổi kịp & tranh thủ thời cơ (tra bộ `走`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                             |
| ------- | ------ | -------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 越      | yuè    | Việt     | 走 (Tẩu) + 戉 (Việt - rìu/thanh phù) | [Tra bộ 走] Bước vượt qua rào cản → vượt qua, càng ngày càng, tên nước Việt Nam; _từ ghép:_ 越来越 (yuèláiyuè: càng ngày càng), 超越 (chāoyuè: vượt trội). |
| 超      | chāo   | Siêu     | 走 (Tẩu) + 召 (Triệu - thanh phù)    | [Tra bộ 走] Nhảy vọt lên trước → vượt quá, siêu việt, siêu; _từ ghép:_ 超过 (chāoguò: vượt quá), 超市 (chāoshì: siêu thị).                                 |
| 赶 / 趕 | gǎn    | Cản      | 走 (Tẩu) + 干 (Can, phồn `旱`)       | [Tra bộ 走] Chạy đuổi theo sát → đuổi kịp, vội vã làm kịp giờ, xua đuổi; _từ ghép:_ 赶快 (gǎnkuài: mau lên), 赶上 (gǎnshàng: bắt kịp).                     |
| 趁      | chèn   | Sấn      | 走 (Tẩu) + 㐱 (Chẩn - thanh phù)     | [Tra bộ 走] Bước nối theo ngay → nhân dịp, tranh thủ lúc thuận tiện; _từ ghép:_ 趁机 (chènjī: nhân cơ hội), 趁早 (chènzǎo: tranh thủ sớm).                 |

### Nhóm C: Chí hướng, dáng bước & họ danh từ riêng (tra bộ `走`)

| Chữ Hán | Pinyin   | Hán Việt  | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                    |
| ------- | -------- | --------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 趣      | qù       | Thú       | 走 (Tẩu) + 取 (Thủ - nắm bắt)   | [Tra bộ 走] Vội rảo bước tìm tới điều ưa thích → chí hướng, hứng thú, thú vị; _từ ghép:_ 兴趣 (xìngqù: hứng thú), 有趣 (yǒuqù: thú vị).                                           |
| 赵 / 趙 | zhào     | Triệu     | 走 (Tẩu) + 乂 (phồn `肖`)       | [Tra bộ 走] Tên nước Triệu thời Chiến Quốc, ngày nay là họ phổ biến hàng đầu (đứng đầu Bách gia tính); _từ ghép:_ 姓赵 (xìng Zhào: họ Triệu), 赵国 (Zhàoguó: nước Triệu).         |
| 赳      | jiū      | Củ        | 走 (Tẩu) + 丩 (Cưu - thanh phù) | [Tra bộ 走] Dáng đi mạnh mẽ, khí thế hiên ngang dũng mãnh; _từ ghép:_ 雄赳赳 (xióngjiūjiū: oai phong lẫm liệt).                                                                   |
| 趑      | zī       | Tư        | 走 (Tẩu) + 次 (Thứ - thanh phù) | [Tra bộ 走] Chần chừ không bước tới được (chủ yếu dùng trong từ ghép với `趄`); _từ ghép:_ 趑趄 (zījū: chần chừ tiến thoái lưỡng lự).                                             |
| 趄      | jū / qiè | Thư / Thả | 走 (Tẩu) + 且 (Thả - thanh phù) | [Tra bộ 走] Bước đi lưỡng lự (`jū` trong `趑趄`); đứng/ngồi nghiêng ngả trượt chân (`qiè`); _từ ghép:_ 趑趄不前 (zījū-bùqián: ngập ngừng không tiến), 打趄 (dǎqiè: loạng choạng). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `⻊ / 足` (`zú` · Túc — chân, bàn chân; bộ thủ riêng đứng gọn bên trái trong `跑, 跳, 踢, 路`).
- `辶` (`chuò` · Sước — di chuyển, qua lại; bộ thủ riêng ôm trái–đáy trong `这, 进, 过, 远`).
- `彳` (`chì` · Xích — bước đi, đường phố, hành vi; bộ thủ riêng trong `很, 得, 往, 行`).
- `徒` (`tú` · Đồ · `彳 + 走` — đi bộ, học trò, tay không, uổng công; chứa `走` ở bên phải, tra bộ `彳`, như `徒步` đi bộ, `师徒` thầy trò).
- `陡` (`dǒu` · Đẩu · `阝 + 走` — dốc đứng, đột ngột; chứa `走` ở bên phải, tra bộ `阜/阝`, như `陡峭` dốc đứng).

---

## Bộ 169: 身 (Thân)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-062` | `radical_index`: `62` | `strokes`: `7` nét | `name_vi`: `bộ Thân` | _Khang Hy:_ `#158` | _Dòng trùng/rỗng:_ Có **1 dòng trùng rỗng `radical-190`** (`radical_index`: `190`, `radical`: `"身"`, `name_vi: null`) cần gộp/dọn khi chuẩn hóa DB.
- **Hình thái & Biến thể (`variants`):**
  - `身` — dạng chính duy nhất (`ノ 丨 𠃌 一 一 一 ノ`); khi đứng bên trái chữ ghép (`躬, 躲, 躺, 躯, 射`), nét ngang đáy thu ngắn thành nét hất nhẹ để nét phẩy dài vươn chéo lên không đâm vào phần bên phải.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình thân người đứng nghiêng nổi bật phần bụng nhô (Giáp cốt văn gợi hình người mang thai / thân mình con người).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Thân thể, cơ thể (`身体`), bản thân/tự mình (`本身, 亲自`), thân phận (`身份`), cuộc đời (`终身, 一生`); trong chữ ghép thường chỉ tư thế cúi, nằm, né tránh hoặc thân xác (`躬, 躺, 躲, 躯`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `身` thường liên quan đến toàn bộ thân mình, tư thế của cơ thể (`躬, 躺, 躲`) hoặc vóc dáng.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`身` vs `肉 / ⺼` vs `骨` vs `亻`:** `身` thiên về **bản thân / tổng thể thân mình**; `肉/⺼` thiên về **thịt, nội tạng và bộ phận cơ thể** (`脑, 脸, 腿, 胃`); `骨` là **xương cốt**; `亻` là **con người, hành động xã hội**.
    - **`射` (`shè`, bắn) — cấu tạo cổ tự học:** Nhiều người dễ nhớ mẹo `射 = 身 + 寸` (thân thể + tấc), nhưng cổ tự chữ `射` vốn vẽ **mũi tên gác trên cánh cung có bàn tay (`寸`) kéo dây**, về sau hình mũi tên–cánh cung lệ biến giống chữ `身`; dù vậy, trong hệ thống bộ thủ chuẩn `射` vẫn xếp vào **bộ `身`**.
    - **`体 / 體` (thân thể):** Tuy nghĩa gắn liền với `身`, nhưng phồn thể `體` xếp bộ `骨` (`骨 + 豊`), còn giản thể `体` (`亻 + 本`) xếp bộ `人/亻` (đừng nhầm tìm ở bộ `身`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Thân thể, tư thế & chuyển động của bản thân (tra bộ `身`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                          |
| ------- | ------ | -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 身      | shēn   | Thân     | Độc thể (Bộ thủ chính)              | [Tra bộ 身] Thân thể, bản thân, thân phận, đời người; _từ ghép:_ 身体 (shēntǐ: cơ thể), 身份 (shēnfèn: thân phận), 本身 (běnshēn: bản thân).                            |
| 躬      | gōng   | Cung     | 身 (Thân) + 弓 (Cung - uốn cong)    | [Tra bộ 身] Uốn thân mình cong như cây cung → cúi gập mình kính lễ, tự mình làm; _từ ghép:_ 鞠躬 (jūgōng: cúi chào), 事必躬亲 (shìbì-gōngqīn: việc gì cũng tự tay làm). |
| 躲      | duǒ    | Đóa      | 身 (Thân) + 朵 (Đóa - thanh phù)    | [Tra bộ 身] Thu thân mình lánh sang bên → né tránh, trốn nấp; _từ ghép:_ 躲避 (duǒbì: né tránh), 躲藏 (duǒcáng: ẩn nấp).                                                |
| 躺      | tǎng   | Thảng    | 身 (Thân) + 尚 (Thượng - thanh phù) | [Tra bộ 身] Ngả thân mình duỗi dài xuống → nằm nghỉ; _từ ghép:_ 躺下 (tǎngxià: nằm xuống), 躺椅 (tǎngyǐ: ghế tựa nằm).                                                  |
| 躯 / 軀 | qū     | Khu      | 身 (Thân) + 区 (Khu, phồn `區`)     | [Tra bộ 身] Thân xác, tấm thân, phần thân của cơ thể; _từ ghép:_ 身躯 (shēnqū: thân xác/vóc người), 躯干 (qūgàn: thân mình).                                            |

### Nhóm B: Chữ đặc biệt & biến thể cổ thuộc bộ `身`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                         |
| ------- | ------ | -------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 射      | shè    | Xạ       | 身 (cung tên biến dạng) + 寸 (tay) | [Tra bộ 身] Kéo cung bắn tên → bắn, phóng tia, ám chỉ; _từ ghép:_ 射击 (shèjī: bắn súng), 发射 (fāshè: phóng đi), 注射 (zhùshè: tiêm). |
| 躭      | dān    | Đam      | 身 (Thân) + 冘 (Dâm - thanh phù)   | [Tra bộ 身] Dị thể cổ của chữ `耽` (trì hoãn, ham mê say đắm); _từ ghép:_ 躭搁 (dāngē: làm lỡ dở, đồng nghĩa `耽搁`).                  |
| 躶      | luǒ    | Lỏa      | 身 (Thân) + 果 (Quả - thanh phù)   | [Tra bộ 身] Dị thể cổ của chữ `裸` (để trần thân thể, không mặc áo); _từ ghép:_ 躶体 (luǒtǐ: khỏa thân, đồng nghĩa `裸体`).            |
| 軆      | tǐ     | Thể      | 身 (Thân) + 豊 (Lễ)                | [Tra bộ 身] Dị thể cổ của chữ `體 / 体` (thân thể, thể xác); trong tự điển cổ xếp trực tiếp dưới bộ `身`.                              |

### Nhóm C: Chữ thông dụng chứa `身` (qua `射 / 躬`) xếp ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                             |
| ------- | ------ | -------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 谢 / 謝 | xiè    | Tạ       | 讠 (Ngôn) + 射 (chứa 身 - thanh phù)  | [Tra bộ 言/讠] Lời nói bày tỏ lòng biết ơn hoặc cáo từ → cảm ơn, tạ lỗi, hoa tàn; _từ ghép:_ 谢谢 (xièxie: cảm ơn), 感谢 (gǎnxiè: cảm tạ).                                 |
| 榭      | xiè    | Tạ       | 木 (Mộc) + 射 (chứa 身 - thanh phù)   | [Tra bộ 木] Nhà gỗ xây trên bục đất cao hoặc nhô ra mặt nước → thủy tạ; _từ ghép:_ 水榭 (shuǐxiè: nhà thủy tạ), 歌台舞榭 (gētái-wǔxiè: đài ca múa).                        |
| 麝      | shè    | Xạ       | 鹿 (Lộc) + 射 (chứa 身 - thanh phù)   | [Tra bộ 鹿] Loài hươu có túi tiết chất thơm gọi là xạ hương; _từ ghép:_ 麝香 (shèxiāng: xạ hương), 麝鹿 (shèlù: hươu xạ).                                                  |
| 穷 / 窮 | qióng  | Cùng     | Giản `穴 + 力`; phồn `穴 + 躳(身+弓)` | [Tra bộ 穴] Phồn thể là thân mình (`躳`) bị kẹt cong trong hang (`穴`) → cùng quẫn, nghèo khó, tận cùng; _từ ghép:_ 穷人 (qióngrén: người nghèo), 无穷 (wúqióng: vô cùng). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `谢 / 謝` (`xiè` · Tạ · `讠/言 + 射` — cảm ơn, từ tạ, tàn úa; chứa `射/身`, tra bộ `言/讠`).
- `榭` (`xiè` · Tạ · `木 + 射` — nhà thủy tạ; tra bộ `木`).
- `麝` (`shè` · Xạ · `鹿 + 射` — hươu xạ, xạ hương; tra bộ `鹿`).
- `穷 / 窮` (`qióng` · Cùng — nghèo khổ, tận cùng; phồn thể `窮` có `躳(身+弓)` dưới `穴`, giản thể thay bằng `力`, tra bộ `穴`).
- `体 / 體` (`tǐ` · Thể — thân thể, thể chế; giản thể `体` tra bộ `人/亻`, phồn thể `體` tra bộ `骨`).
- `肉 / ⺼` (`ròu` · Nhục) & `骨` (`gǔ` · Cốt) — các bộ thủ riêng chỉ thịt, cơ quan và xương trên cơ thể.

---

## Bộ 170: 辛 (Tân)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-192` | `radical_index`: `192` | `strokes`: `7` nét | `name_vi`: `bộ Tân` | _Khang Hy:_ `#160` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `辛` — dạng chính duy nhất (`立` trên + `十` dưới); đứng độc lập, đứng bên trái hoặc bên phải (`辣, 辞, 辟, 辜`), hoặc xuất hiện thành cặp hai chữ `辛` đối xứng kẹp linh kiện ở giữa (`辩, 辨, 辫, 瓣`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình chiếc đục / con dao nhọn dùng để xăm mặt trừng phạt tội phạm thời cổ đại (trên là cán tay cầm, dưới là mũi lưỡi sắc nhọn). Ngoài ra còn là **can thứ 8 trong Thiên Can (Tân)**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Từ cảm giác đau đớn, xót xé của hình cụ chuyển nghĩa sang **vị cay xé** (`辛辣`), **vất vả đắng cay** (`辛苦, 艰辛`), **tội lỗi/trừng phạt** (`辜, 辠`); đồng thời trong nhóm chữ ghép có 2 `辛` (song Tân) biểu thị sự **tranh luận, phân biệt, tách chia, lời lẽ sắc bén** (`辩, 辨, 辞, 瓣`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `辛` thường liên quan đến vị cay, sự vất vả gian lao, hình phạt/tội lỗi cổ, hoặc xuất hiện thành cặp trong nhóm chữ về biện luận, phân biệt, lời nói (`辩, 辨, 辞`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`辛` (7 nét) vs `立` (5 nét):** `辛` giống chữ `立` đặt trên chữ `十`; `立` là bộ thủ riêng nghĩa "đứng, thiết lập".
    - **`辛` vs `幸` (`xìng`, may mắn):** Cặp cực dễ nhầm khi mới học vì `辛苦` (vất vả) khác hẳn `幸福` (hạnh phúc)! So sánh đầu chữ: `辛` đầu là `立` (chấm–ngang `亠`), còn `幸` đầu là `土` (ngang–sổ–ngang).
    - **Nghĩa của `辛苦` (`xīnkǔ`):** Dùng để chỉ sự _vất vả, cực nhọc_ (hoặc câu cảm ơn "anh/chị vất vả rồi!"), không hiểu theo nghĩa "cay đắng" của vị giác ăn uống.
    - **Nhóm song `辛` (`辯, 辨, 辮, 瓣`):** Trong phồn thể đều kẹp phần nghĩa giữa hai chữ `辛`: kẹp `言` thành `辯/辩` (biện luận bằng lời), kẹp `刂` thành `辨` (dùng dao phân biệt rạch ròi), kẹp `糸` thành `辮/辫` (bện dây/bím tóc), kẹp `瓜` thành `瓣` (múi/cánh tách như múi dưa).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Vị cay, gian khổ, tội lỗi & khai mở (tra bộ `辛`)

| Chữ Hán | Pinyin  | Hán Việt  | Thiên bàng đứng chung                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| ------- | ------- | --------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 辛      | xīn     | Tân       | Độc thể (Bộ thủ chính)                     | [Tra bộ 辛] Vị cay, vất vả gian khổ, can Tân trong Thiên Can; _từ ghép:_ 辛苦 (xīnkǔ: vất vả), 辛辣 (xīnlà: cay nồng/sắc sảo).                                       |
| 辣      | là      | Lạt       | 辛 (Tân - cay) + 束 (Thúc - thanh phù)     | [Tra bộ 辛] Vị cay xé miệng, nóng bỏng, tính cách quyết liệt/cay nghiệt; _từ ghép:_ 辣椒 (làjiāo: quả ớt), 酸甜苦辣 (suān-tián-kǔ-là: chua ngọt đắng cay).           |
| 辜      | gū      | Cô        | 古 (Cổ - thanh phù) + 辛 (Tân - hình phạt) | [Tra bộ 辛] Tội lỗi, tội vạ (từ hình phạt cổ); ngày nay hay dùng nghĩa phủ định "vô tội" hoặc "phụ lòng"; _từ ghép:_ 无辜 (wúgū: vô tội), 辜负 (gūfù: phụ lòng).     |
| 辟      | pì / bì | Tịch / Tị | 𡰪 (người quỳ) + 辛 (hình cụ)              | [Tra bộ 辛] Dùng pháp lệnh xử lý, mở mang/bác bỏ (`pì`), bậc vua chúa/phục vị (`bì`); _từ ghép:_ 开辟 (kāipì: khai phá), 复辟 (fùbì: phục tịch/khôi phục ngai vàng). |
| 辠      | zuì     | Tội       | 自 (Tự) + 辛 (Tân)                         | [Tra bộ 辛] Chữ cổ của `罪` (tội lỗi — hình cụ xăm mũi phạm nhân; thời Tần cho rằng mặt chữ giống `皇` nên đổi sang dùng chữ `罪`).                                  |

### Nhóm B: Lời từ, biện luận & bện tách — nhóm song `辛` (tra bộ `辛`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                       |
| ------- | ------ | -------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 辞 / 辭 | cí     | Từ       | Giản `舌 + 辛`; phồn `𤔔 + 辛` | [Tra bộ 辛] Lời lẽ phân giải rõ ràng → từ ngữ, lời văn, từ chức, từ biệt; _từ ghép:_ 辞职 (cízhí: từ chức), 告辞 (gàocí: cáo từ).                    |
| 辩 / 辯 | biàn   | Biện     | 辛 + 讠/言 + 辛                | [Tra bộ 辛] Hai phía đối đáp dùng lời (`讠/言`) phân trần → tranh luận, biện giải; _từ ghép:_ 辩论 (biànlùn: tranh luận), 辩解 (biànjiě: biện bạch). |
| 辨      | biàn   | Biện     | 辛 + 刂 (Đao) + 辛             | [Tra bộ 辛] Dùng dao (`刂`) rạch phân minh hai bên → phân biệt rõ ràng; _từ ghép:_ 分辨 (fēnbiàn: phân biệt), 辨认 (biànrèn: nhận diện phân biệt).   |
| 辫 / 辮 | biàn   | Biện     | 辛 + 纟/糸 + 辛                | [Tra bộ 辛] Vặn bện các sợi tơ (`纟/糸`) đan chéo vào nhau → tết tóc, bím tóc; _từ ghép:_ 辫子 (biànzi: bím tóc), 编辫子 (biān biànzi: tết bím).     |

### Nhóm C: Chữ thông dụng mang `辛` (hoặc `辟`) xếp ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                       |
| ------- | ------ | -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 瓣      | bàn    | Biện     | 辛 + 瓜 (Qua - dưa) + 辛             | [Tra bộ 瓜] Múi ruột quả dưa tách ra từng phần → cánh hoa, múi quả, van tim/máy; _từ ghép:_ 花瓣 (huābàn: cánh hoa), 蒜瓣 (suànbàn: tép tỏi).                                        |
| 宰      | zǎi    | Tể       | 宀 (Miên - nhà) + 辛 (Tân - dao)     | [Tra bộ 宀] Người cầm dao chia thịt dưới mái nhà/quan coi việc bếp núc → giết mổ gia súc, cai quản/chức Tể tướng; _từ ghép:_ 宰杀 (zǎishā: giết mổ), 主宰 (zhǔzǎi: chủ tể/chi phối). |
| 避      | bì     | Tị       | 辶 (Sước) + 辟 (chứa 辛 - thanh phù) | [Tra bộ 辶] Đi tránh khỏi hình phạt/nguy hiểm → tránh né, lẩn tránh; _từ ghép:_ 避免 (bìmiǎn: tránh khỏi), 躲避 (duǒbì: trốn tránh).                                                 |
| 壁      | bì     | Bích     | 辟 (chứa 辛 - thanh phù) + 土 (Thổ)  | [Tra bộ 土] Bức tường đắp bằng đất (`土`), vách đá; _từ ghép:_ 墙壁 (qiángbì: bức tường), 隔壁 (gébì: nhà bên cạnh).                                                                 |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `瓣` (`bàn` · Biện · `辛 + 瓜 + 辛` — cánh hoa, múi quả; tra bộ `瓜`).
- `宰` (`zǎi` · Tể · `宀 + 辛` — giết mổ, cai quản; tra bộ `宀`).
- `避` (`bì` · Tị · `辶 + 辟` — tránh né; chứa `辛` trong `辟`, tra bộ `辶`).
- `壁` (`bì` · Bích · `辟 + 土` — tường vách; chứa `辛` trong `辟`, tra bộ `土`).
- `梓` (`zǐ` · Tử · `木 + 辛` — cây tử/gỗ quý, quê hương `桑梓`; tra bộ `木`).
- `新` (`xīn` · Tân — mới mẻ): cổ tự `亲` vốn là `辛 + 木`, cùng `斤` (rìu) mang nghĩa dùng rìu chặt gỗ làm mới (xếp bộ `斤`).
- `立` (`lì` · Lập) & `幸` (`xìng` · Hạnh) — hai chữ có hình đầu gần giống `辛`, dễ nhầm mặt chữ khi tra và viết.

---

## Bộ 171: 辰 (Thần)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-193` | `radical_index`: `193` | `strokes`: `7` nét | `name_vi`: `bộ Thần` | _Khang Hy:_ `#161` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `辰` — dạng chính duy nhất (`一 ノ 一 一 乚 ノ ㇏`); đứng độc lập, đứng bên dưới (`晨, 震`), đứng trên (`辱, 唇`), hoặc đứng bên phải (`振, 蜃`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Giáp cốt văn vẽ hình con sò lớn / vỏ trai có cạnh sắc được người xưa mài làm nông cụ cuốc xới đất trồng trọt (vì vậy xuất hiện trong `農` nông, `辱` nhục, `蜃` sò/ảo ảnh). Sau đó được giả tá làm **chi thứ 5 trong 12 Địa Chi (Thìn)**, đồng thời chỉ **sao Thần, thời điểm, buổi sớm, mùa vụ**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chi Thìn, thời khắc/ngày sinh (`生辰, 良辰`), tinh tú (`星辰`); trong chữ ghép thường làm thành phần gợi thời gian buổi sáng (`晨`), chấn động (`震, 振`), nông nghiệp (`農`), hoặc làm thanh phù đọc `chén / zhèn / chún`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `辰` thường liên quan đến thời gian/ngày tháng, nông cụ/nông nghiệp cổ, sự rung chuyển/chấn động, hoặc đóng vai trò thanh phù gợi âm `chén / zhèn / chún / shèn`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`辰` (7 nét) vs `厂` (2 nét):** Phần khung trên–trái của `辰` trông giống bộ `厂` (vách đá), nhưng `辰` là bộ thủ 7 nét hoàn chỉnh, KHÔNG phải chữ ghép từ `厂`.
    - **`辰` (7 nét) vs `长 / 長` (4/8 nét):** Đáy của `辰` có hai nét ngang và bộ chân `乚 ノ ㇏`, không nhầm với nét gấp và mác của `长`.
    - **Đoán nghĩa nhóm chữ mang `辰` theo bộ đi kèm:** `晨` có `日` (mặt trời) → buổi sáng; `震` có `雨` (mưa sấm) → sấm rung/động đất; `振` có `扌` (tay) → vung tay rung lắc/chấn hưng; `唇` có `口` (miệng) → đôi môi.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Thời gian, nông nghiệp cổ & sỉ nhục (tra bộ `辰` trong truyền thống)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                        |
| ------- | ------ | -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 辰      | chén   | Thần     | Độc thể (Bộ thủ chính)            | [Tra bộ 辰] Chi Thìn (thứ 5 trong Địa Chi), thời khắc, ngày tháng, tinh tú; _từ ghép:_ 星辰 (xīngchén: tinh tú/sao trời), 生辰 (shēngchén: ngày sinh).                                |
| 辱      | rǔ     | Nhục     | 辰 (nông cụ cổ) + 寸 (tay)        | [Tra bộ 辰] Gốc là cầm nông cụ làm ruộng sai mùa vụ bị trừng phạt → sỉ nhục, làm nhục; _từ ghép:_ 侮辱 (wǔrǔ: sỉ nhục), 耻辱 (chǐrǔ: nỗi nhục).                                       |
| 农 / 農 | nóng   | Nông     | Giản `冖 + 𠂇...`; phồn `曲 + 辰` | [Tra bộ 冖 (giản) / 辰 (phồn)] Phồn thể `農` gồm hai tay cầm nông cụ vỏ sò (`辰`) làm cỏ nơi đồng ruộng → nghề nông; _từ ghép:_ 农民 (nóngmín: nông dân), 农业 (nóngyè: nông nghiệp). |

### Nhóm B: Chữ cực thông dụng mang `辰` làm thanh phù ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                 |
| ------- | ------ | -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 晨      | chén   | Thần     | 日 (Nhật) + 辰 (Thần - âm/thời)        | [Tra bộ 日] Mặt trời (`日`) ló rạng vào thời điểm sao Thần khuất dần → buổi sáng sớm; _từ ghép:_ 早晨 (zǎochen: buổi sáng), 清晨 (qīngchén: sáng sớm tinh mơ).                 |
| 震      | zhèn   | Chấn     | 雨 (Vũ) + 辰 (Thần - thanh phù)        | [Tra bộ 雨] Mưa gió sấm sét (`雨`) làm rung chuyển đất trời → động đất, chấn động, kinh ngạc; _từ ghép:_ 地震 (dìzhèn: động đất), 震惊 (zhènjīng: chấn động kinh ngạc).        |
| 振      | zhèn   | Chấn     | 扌 (Thủ - tay) + 辰 (Thần - thanh phù) | [Tra bộ 手/扌] Dùng tay (`扌`) lay động, vung lên → rung động, phấn chấn, chấn hưng; _từ ghép:_ 振奋 (zhènfèn: phấn chấn), 振兴 (zhènxīng: chấn hưng).                         |
| 唇      | chún   | Thần     | 辰 (Thần - thanh phù) + 口 (Khẩu)      | [Tra bộ 口] Bộ phận ở miệng (`口`) → đôi môi (dị thể cổ `脣` tra bộ `肉/月`); _từ ghép:_ 嘴唇 (zuǐchún: đôi môi), 唇膏 (chúngāo: son môi).                                     |
| 蜃      | shèn   | Thận     | 辰 (Thần - vỏ sò/âm) + 虫 (Trùng)      | [Tra bộ 虫] Con sò/trai biển khổng lồ cổ đại, tương truyền thở hơi tạo ảo ảnh trên biển/sa mạc; _từ ghép:_ 海市蜃楼 (hǎishì-shènlóu: ảo ảnh lâu đài trên biển/điều viển vông). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `晨` (`chén` · Thần · `日 + 辰` — buổi sáng sớm; tra bộ `日`).
- `震` (`zhèn` · Chấn · `雨 + 辰` — sấm sét, động đất, chấn động; tra bộ `雨`).
- `振` (`zhèn` · Chấn · `扌 + 辰` — rung động, phấn chấn; tra bộ `手/扌`).
- `唇` (`chún` · Thần · `辰 + 口` — đôi môi; tra bộ `口`).
- `蜃` (`shèn` · Thận · `辰 + 虫` — con sò lớn, ảo ảnh; tra bộ `虫`).
- `农 / 農` (`nóng` · Nông — nông nghiệp; phồn thể `農` tra bộ `辰`, giản thể `农` lược bỏ `辰` và tra bộ `冖`).
- `厂` (`hǎn / chǎng` · Hán — vách đá; bộ thủ riêng, chỉ giống phần khung bao góc trên của `辰`).

---

## Bộ 172: 釆 (Biện)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-197` | `radical_index`: `197` | `strokes`: `7` nét | `name_vi`: `bộ Biện` | _Khang Hy:_ `#165` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `釆` — dạng chính duy nhất (`ノ` ngang trên + `米` dưới, tổng 7 nét); trong chữ hiện đại hầu như chỉ xuất hiện ở vị trí cấu thành bên trái (`释, 釉`) hoặc bên trên (`番, 悉`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình dấu chân thú in rõ ngón vuốt trên đất; thợ săn nhìn dấu chân thú để **phân biệt** loài vật, từ đó sinh nghĩa **phân biệt, chia tách rạch ròi** (cổ âm gần với `辨 / 别`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bộ thủ hiếm, không đứng độc lập làm từ vựng hiện đại; chủ yếu góp nghĩa phân tách/thấu suốt/thứ tự trong một số chữ ghép lịch sử (`释` giải thích/buông ra, `悉` biết tường tận, `番` lần lượt/thay phiên, `审` xét kỹ).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `釆` ít khi giúp đoán trực tiếp nghĩa hiện đại, nhưng thường gắn với nét nghĩa phân tách, xem xét thấu suốt hoặc tuần tự (`释, 悉, 番`).
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `釆` (Biện) vs `采` (Thái) vs `米` (Mễ):**
    1. **`釆` (Biện, `biàn`, 7 nét) vs `采` (Thái, `cǎi / cài`, 8 nét):**
       - **`釆` (Biện):** Đỉnh chữ chỉ có **1 nét phẩy ngang ngắn (`ノ`)**, bên dưới là **`米`** (`丶 ノ 一 丨 ノ ㇏`). Nghĩa gốc là **phân biệt**, không dùng độc lập ngày nay.
       - **`采` (Thái):** Đỉnh chữ là **bộ Trảo `爫`** gồm **4 nét** (`ノ 丶 丶 ノ` — bàn tay chụp xuống), bên dưới là chữ **`木`** (cây — chỉ có 1 nét ngang, **không** có hai chấm trên nét ngang). Nghĩa gốc là **dùng tay hái quả trên cây** → hái lượm, thu thập, thần sắc (`采访, 采取, 精彩, 色彩`).
       - _Lưu ý hệ thống tự điển:_ Về mặt cấu tạo chữ, `采` thuộc bộ `爫/爪` (nhưng vì hình thể Khải thư nhìn gần giống `釆`, tự điển Khang Hy xưa từng xếp gộp chữ `采` vào bộ `釆`; còn tự điển hiện đại như Tân Hoa tách `采` trả về bộ `爫/爪` hoặc `木`). Người học cần tách bạch hai mặt chữ này!
    2. **`釆` (7 nét) vs `米` (6 nét):** `米` (hạt gạo) không có nét phẩy ngang chụp trên đỉnh đầu.
    3. **Biến đổi Phồn–Giản:** Chữ `釋` giữ `釆` khi giản hóa thành `释`; trong khi `審` (phồn có `釆` trong `番`) giản hóa thành `审` (thay bằng `申`), `奧` giản hóa thành `奥` (đổi `釆` thành `米`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Phân tách, giải tỏa & men phủ (tra bộ `釆`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                      |
| ------- | ------ | -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 釆      | biàn   | Biện     | Độc thể (Bộ thủ chính)          | [Tra bộ 釆] Dấu chân thú trên đất → phân biệt, chia tách (bộ thủ cổ, không đứng làm từ hiện đại).                                                                   |
| 释 / 釋 | shì    | Thích    | Giản `釆 + 𠬝`; phồn `釆 + 睪`  | [Tra bộ 釆] Phân tách gỡ rối ra → giải thích, buông thả, giải phóng, phiên âm Thích Ca; _từ ghép:_ 解释 (jiěshì: giải thích), 释放 (shìfàng: trả tự do/giải phóng). |
| 釉      | yòu    | Dứu / Du | 釆 (Biện - thanh phù) + 由 (Do) | [Tra bộ 釆] Lớp men thủy tinh phủ bóng bề mặt đồ gốm sứ; _từ ghép:_ 釉彩 (yòucǎi: màu men), 陶瓷釉 (táocí yòu: men gốm sứ).                                         |

### Nhóm B: Chữ thông dụng chứa `釆` ở vị trí thành phần (tra bộ khác) & phân biệt `采`

| Chữ Hán | Pinyin    | Hán Việt     | Thiên bàng đứng chung                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                             |
| ------- | --------- | ------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 悉      | xī        | Tất          | 釆 (phân rõ) trên + 心 (Tâm) dưới         | [Tra bộ 心] Lòng nắm rõ phân minh từng chi tiết → biết tường tận, dốc hết lòng; _từ ghép:_ 熟悉 (shúxī: quen thuộc), 获悉 (huòxī: được tin).                                                               |
| 番      | fān / pān | Phiên / Phan | 釆 (Biện - dấu thú) trên + 田 (ruộng)     | [Tra bộ 田] Dấu chân thú trên đồng ruộng → thay phiên, lần lượt, ngoại lai (`fān`), họ Phan (`pān`); _từ ghép:_ 番茄 (fānqié: cà chua), 轮番 (lúnfān: thay phiên).                                         |
| 审 / 審 | shěn      | Thẩm         | Giản `宀 + 申`; phồn `宀 + 番(chứa 釆)`   | [Tra bộ 宀] Phân tích tỉ mỉ dưới mái công đường (`宀`) → xét xử, thẩm định, xem kỹ; _từ ghép:_ 审查 (shěnchá: thẩm tra), 审判 (shěnpàn: xét xử).                                                           |
| 翻      | fān       | Phiên        | 番 (chứa 釆 - thanh phù) + 羽 (Vũ - cánh) | [Tra bộ 羽] Vỗ cánh lật trở mình → lật ngược, trèo qua, dịch thuật; _từ ghép:_ 翻译 (fānyì: phiên dịch), 翻开 (fānkāi: lật mở).                                                                            |
| 播      | bō        | Bá           | 扌 (Thủ - tay) + 番 (chứa 釆 - gieo)      | [Tra bộ 手/扌] Dùng tay rải hạt giống trên ruộng → gieo rắc, phát sóng, truyền bá; _từ ghép:_ 广播 (guǎngbō: phát thanh), 传播 (chuánbō: truyền bá).                                                       |
| 采      | cǎi / cài | Thái         | 爫 (Trảo - tay) + 木 (Mộc - cây)          | [Tra bộ 爫/爪 (Tân Hoa) / 釆 (Khang Hy)] Dùng tay hái quả trên cây → hái lượm, thu thập, sắc thái (**chữ khác gốc `釆`**, rất hay bị nhầm); _từ ghép:_ 采访 (cǎifǎng: phỏng vấn), 精彩 (jīngcǎi: đặc sắc). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `采` (`cǎi / cài` · Thái · `爫 + 木` — hái lượm, thu thập, sắc thái; tự điển Tân Hoa xếp bộ `爫/爪` hoặc `木`, Khang Hy xưa xếp dưới `釆` vì hình Khải thư gần giống — cần phân biệt rõ với `釆` Biện!).
- `悉` (`xī` · Tất · `釆 + 心` — biết rõ, quen thuộc; tra bộ `心`).
- `番` (`fān / pān` · Phiên · `釆 + 田` — lần, lượt, ngoại quốc; tra bộ `田`, là thanh–hình phù cho `翻, 播, 潘` `pān`, `蕃` `fán`).
- `审 / 審` (`shěn` · Thẩm — xét duyệt, thẩm tra; phồn thể `審` chứa `釆` trong `番`, giản thể `审` bỏ `釆`, tra bộ `宀`).
- `奥 / 奧` (`ào` · Áo — sâu kín, huyền bí; phồn thể `奧` chứa `釆` ở giữa, giản thể `奥` đổi thành `米`, tra bộ `大`).
- `米` (`mǐ` · Mễ) & `爪 / 爫` (`zhǎo` · Trảo) — hai bộ thủ riêng có hình dáng gần gũi nhưng khác hẳn `釆`.

---

## Bộ 173: 里 (Lý)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-198` | `radical_index`: `198` | `strokes`: `7` nét | `name_vi`: `bộ Lý` | _Khang Hy:_ `#166` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `里` — dạng chính duy nhất (`田` trên + `土` dưới, tổng 7 nét, nét sổ giữa của `田` kéo xuyên liền xuống làm nét sổ của `土`); đứng độc lập, đứng bên trái (`野`), bên phải (`理, 埋, 鲤, 俚`), bên dưới (`重, 量, 童, 厘`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý: phía trên là `田` (ruộng đồng), phía dưới là `土` (đất đai). Nơi con người quây quần sống trên đất cày ruộng hợp thành **làng xóm, đơn vị hành chính cư trú** (thời Chu 25 hộ làm 1 Lý), đồng thời là **đơn vị đo chiều dài** (1 Lý/dặm = 500m hiện đại).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Trong chữ giản thể hiện đại, `里` gánh hai nguồn chữ hợp nhất:
    1. **`里` gốc:** làng quê, đơn vị dặm (`故里, 公里, 里程`);
    2. **`裡 / 裏` phồn thể (bộ `衣`):** phần lót bên trong lớp áo → **bên trong, ở trong** (`里面, 家里, 这里, 哪里`).
       Ngoài ra `里` là thanh phù `lǐ / lí` cực kỳ phổ biến trong các chữ hình thanh (`理, 埋, 鲤, 俚, 锂`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `里` có thể gợi nơi chốn, đồng quê/diện tích, đo lường trọng lượng (`野, 量, 重`), nhưng rất thường chỉ đóng vai trò thanh phù gợi âm `lǐ / lí` cho các bộ ở bên trái (`理, 鲤, 锂, 俚`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`里` (giản thể) vs `裡 / 裏` (phồn thể):** Phồn thể phân tách rõ `里` (làng/dặm) và `裡/裏` (bên trong, tra bộ `衣`); giản thể viết chung thành `里`, nên dựa vào từ ghép để phân biệt (`公里` km ≠ `家里` trong nhà).
    - **`里` vs `田` + `土`:** `里` viết liền 7 nét (`丨 𠃌 一 一 丨 一 一`), nét sổ dọc xuyên thẳng từ `田` xuống đáy `土`.
    - **`里` trong `重` (`zhòng / chóng`) và `童` (`tóng`):** `重` (9 nét, tra bộ `里`) thêm phẩy ngang ở đỉnh và nét ngang phụ; `童` (`立 + 里`, 12 nét, tra bộ `立`) cũng mượn phần thân dưới hình `里`.
    - **`里` trong `理` (`lǐ`, lý lẽ):** `理` gồm `王(玉)` + `里` (tra bộ `玉/王`), nghĩa gốc là mài giũa đường vân trên ngọc (`玉`) theo trật tự, còn `里` chủ yếu góp âm `lǐ`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Làng xóm, bên trong, đồng quê & đo lường (tra bộ `里`)

| Chữ Hán | Pinyin        | Hán Việt      | Thiên bàng đứng chung                       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                    |
| ------- | ------------- | ------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 里      | lǐ            | Lý            | Độc thể (`田 + 土`, cũng giản thay `裡/裏`) | [Tra bộ 里] Làng xóm, đơn vị dặm (500m); hợp nhất với `裡/裏` thành nghĩa "bên trong, ở trong"; _từ ghép:_ 里面 (lǐmiàn: bên trong), 公里 (gōnglǐ: kilômét), 故里 (gùlǐ: quê cũ). |
| 重      | zhòng / chóng | Trọng / Trùng | Phẩy + 千 + 里 lồng ghép                    | [Tra bộ 里] Nặng, nghiêm trọng, coi trọng (`zhòng`); chồng chất, lặp lại lần nữa (`chóng`); _từ ghép:_ 重要 (zhòngyào: quan trọng), 重复 (chóngfù: lặp lại).                      |
| 野      | yě            | Dã            | 里 (Lý - làng) + 予 (Dư - thanh phù)        | [Tra bộ 里] Vùng đất bên ngoài làng xóm → đồng nội, hoang dã, không bị gò bó; _từ ghép:_ 野外 (yěwài: ngoài trời/dã ngoại), 野生 (yěshēng: hoang dã).                             |
| 量      | liáng / liàng | Lượng         | 旦 (Đán) trên + 里 (Lý) dưới                | [Tra bộ 里] Đo đạc, cân đong (`liáng`); số lượng, dung lượng, chất lượng (`liàng`); _từ ghép:_ 测量 (cèliáng: đo lường), 数量 (shùliàng: số lượng).                               |
| 厘 / 釐 | lí            | Ly            | Giản `厂 + 里`; phồn `未 + 攵 + 厂 + 里`    | [Tra bộ 厂 (giản) / 里 (phồn)] Đơn vị đo rất nhỏ (1/100 hoặc 1/1000), chỉnh đốn (phồn `釐`); _từ ghép:_ 厘米 (límǐ: xăng-ti-mét), 毫厘 (háolí: chút ít).                          |

### Nhóm B: Chữ thông dụng mượn `里` làm thanh phù `lǐ / lí / mái` ở bộ khác

| Chữ Hán | Pinyin    | Hán Việt | Thiên bàng đứng chung                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                  |
| ------- | --------- | -------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 理      | lǐ        | Lý       | 王 (Ngọc) + 里 (Lý - thanh phù)           | [Tra bộ 玉/王] Gọt dũa ngọc theo thớ vân → trật tự, lý lẽ, quản lý, chăm sóc; _từ ghép:_ 道理 (dàolǐ: đạo lý), 管理 (guǎnlǐ: quản lý).          |
| 埋      | mái / mán | Mai      | 土 (Thổ - đất) + 里 (Lý - thanh phù)      | [Tra bộ 土] Vùi chôn xuống đất, giấu kín (`mái`); trách móc, oán trách (`mán`); _từ ghép:_ 埋葬 (máizàng: chôn cất), 埋怨 (mányuàn: trách móc). |
| 鲤 / 鯉 | lǐ        | Lý       | 鱼 (Ngư - cá) + 里 (Lý - thanh phù)       | [Tra bộ 鱼/魚] Loài cá chép (`鱼` biểu nghĩa cá + `里` biểu âm `lǐ`); _từ ghép:_ 鲤鱼 (lǐyú: cá chép), 锦鲤 (jǐnlǐ: cá chép gấm Koi).           |
| 狸      | lí        | Ly       | 犭 (Khuyển - thú) + 里 (Lý - thanh phù)   | [Tra bộ 犬/犭] Loài cáo hoặc cầy hương (`犭` thú + `里` âm `lí`); _từ ghép:_ 狐狸 (húli: con cáo), 狸猫 (límāo: mèo rừng).                      |
| 锂 / 鋰 | lǐ        | Lý       | 钅 (Kim - kim loại) + 里 (Lý - thanh phù) | [Tra bộ 金/钅] Nguyên tố kim loại kiềm nhẹ nhất: Liti (Li); _từ ghép:_ 锂电池 (lǐdiànchí: pin lithium).                                         |
| 俚      | lǐ        | Lý       | 亻 (Nhân) + 里 (Lý - thôn dã/âm)          | [Tra bộ 人/亻] Lời nói dân dã bình dân, thô mộc nơi thôn quê; _từ ghép:_ 俚语 (lǐyǔ: tiếng lóng, tục ngữ dân gian).                             |

### Nhóm C: Chữ có cấu trúc `里` biến dạng hoặc kết hợp đặc biệt ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                             |
| ------- | ------ | -------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 童      | tóng   | Đồng     | 立 (Lập) trên + 里 (Lý) dưới   | [Tra bộ 立] Cổ tự là hình cụ + chữ `重` tỉnh lược, Khải thư viết thành `立 + 里` → trẻ em, chưa trưởng thành; _từ ghép:_ 儿童 (értóng: trẻ em), 童年 (tóngnián: tuổi thơ). |
| 缠 / 纏 | chán   | Triền    | 纟 (Mịch - dây) + 广 + 里 + 儿 | [Tra bộ 糸/纟] Cuộn quấn dây quanh nhiều vòng → quấn quanh, dây dưa, vướng bận; _từ ghép:_ 缠绕 (chánrào: quấn quanh), 纠缠 (jiūchán: dây dưa vướng mắc).                  |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `理` (`lǐ` · Lý · `王 + 里` — lý lẽ, quản lý, xử lý; tra bộ `玉/王`).
- `埋` (`mái / mán` · Mai · `土 + 里` — chôn vùi, trách móc; tra bộ `土`).
- `鲤 / 鯉` (`lǐ` · Lý · `鱼 + 里` — cá chép; tra bộ `鱼/魚`).
- `狸` (`lí` · Ly · `犭 + 里` — con cáo, cầy hương; tra bộ `犬/犭`).
- `锂 / 鋰` (`lǐ` · Lý · `钅 + 里` — kim loại liti; tra bộ `金/钅`).
- `俚` (`lǐ` · Lý · `亻 + 里` — dân dã, tiếng lóng; tra bộ `人/亻`).
- `童` (`tóng` · Đồng · `立 + 里` — trẻ em; tra bộ `立`).
- `裡 / 裏` (`lǐ` · Lý — bên trong; phồn thể thuộc bộ `衣`, giản thể hợp nhất thành `里`).
- `田` (`tián` · Điền) & `土` (`tǔ` · Thổ) — hai bộ thủ độc lập ghép thành hình tự của `里`.

---

## Bộ 174: 長 (Trường)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-200` | `radical_index`: `200` | `strokes`: `8` nét (`長` phồn thể 8 nét; `长` giản thể 4 nét) | `name_vi`: `bộ Trường / Trưởng` | _Khang Hy:_ `#168` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `長` — dạng phồn thể / đầy đủ (8 nét; làm bộ thủ tra cứu chuẩn trong tự điển Khang Hy).
  - `长` — dạng giản thể chuẩn hiện đại (4 nét: `ノ 一 乚 ㇏`); đứng độc lập hoặc làm thành phần cấu chữ ở bên phải (`张, 帐, 账, 胀`).
  - `镸` — dạng thu gọn của `長` khi đứng bên trái một số chữ phồn thể cổ (như `肆` — chữ này tra bộ `聿`, không tra bộ `長`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình một người lớn tuổi mái tóc dài phấp phới tay chống gậy (Giáp cốt văn vẽ rõ đầu, tóc dài và cây gậy). Từ hình ảnh "tóc dài / người cao niên" tách ra hai nhánh nghĩa chính: **chiều dài / kéo dài** và **người lớn tuổi / trưởng thành / thủ lĩnh**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Dài, lâu dài, sở trường (`cháng`: `长短, 长期, 特长`); lớn lên, sinh trưởng, trưởng thành, bậc đứng đầu (`zhǎng`: `长大, 成长, 校长, 家长`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `長 / 长` thường liên quan đến chiều dài, sự kéo căng/mở rộng, lớn lên/phồng lên (`张, 涨, 胀`), hoặc đóng vai trò thanh phù cực ổn định đọc vần `zhāng / zhàng / cháng`.
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `長/长` vs `张/帐`:**
    1. **Hai âm đọc của `长`:** Đọc **`cháng`** (Trường) khi nghĩa là _dài, xa, lâu, giỏi về_ (`很长, 长短, 长城, 长处`); đọc **`zhǎng`** (Trưởng) khi nghĩa là _lớn lên, mọc ra, tăng, người đứng đầu_ (`长大, 成长, 校长, 班长`).
    2. **`長/长` vs `张` vs `帐` (bộ ba hình thanh dễ nhầm):**
       - **`长`** (4 nét): Chữ gốc / bộ thủ (dài, trưởng).
       - **`张 / 張`** (`弓 + 长`, tra bộ **`弓`**): Thêm bộ **Cung `弓`** → nghĩa gốc là _kéo căng dây cung_, mở rộng thành _giương mở, căng thẳng, lượng từ tờ/bàn/giường, họ Trương_ (`一张纸, 紧张, 开张, 姓张`).
       - **`帐 / 帳`** (`巾 + 长`, tra bộ **`巾`**): Thêm bộ **Cân `巾`** (khăn, vải) → nghĩa gốc là _tấm vải căng ra_ → _màn, trướng, lều vải_ (`蚊帐, 帐篷, 营帐`).
       - _(Mở rộng với **`账 / 賬`** bộ `贝` và **`涨 / 漲`** bộ `氵`):_ `账` (sổ sách, tài khoản: `记账, 算账`) dùng `贝` (tiền bạc) để tách nghĩa khỏi vải/lều `帐`; `涨` (nước dâng, tăng giá: `涨价`) dùng `氵` (nước).
    3. **`長 / 长` vs `髟` (bộ Tiêu, 10 nét):** `髟` (`长 + 彡`) là bộ thủ riêng chỉ _tóc dài, râu tóc_ (`发/髮, 胡/鬍`), không nhập chung vào `長`.
    4. **Đặc điểm phân loại tự điển:** Trong tự điển Khang Hy hầu như chỉ có chính chữ `長 / 长` là chữ thông dụng tra trực tiếp dưới bộ `長`; toàn bộ các chữ phổ biến mang `长` ở bên phải (`张, 帐, 账, 涨, 胀`) đều xếp ở bộ biểu nghĩa bên trái.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bộ `長 / 长` độc thể (tra bộ `長 / 长`)

| Chữ Hán | Pinyin        | Hán Việt        | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                              |
| ------- | ------------- | --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 长 / 長 | cháng / zhǎng | Trường / Trưởng | Độc thể (Bộ thủ chính) | [Tra bộ 長/长] Dài, lâu dài, sở trường (`cháng`); lớn lên, mọc ra, người đứng đầu (`zhǎng`); _từ ghép:_ 长短 (chángduǎn: dài ngắn), 长大 (zhǎngdà: lớn lên), 校长 (xiàozhǎng: hiệu trưởng). |

### Nhóm B: Chữ thông dụng mang `長 / 长` làm thanh phù ở bộ khác

| Chữ Hán | Pinyin        | Hán Việt | Thiên bàng đứng chung                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                      |
| ------- | ------------- | -------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 张 / 張 | zhāng         | Trương   | 弓 (Cung) + 长 (Trường - căng/âm)         | [Tra bộ 弓] Kéo căng dây cung → mở rộng, giương ra, căng thẳng, lượng từ (tờ/chiếc), họ Trương; _từ ghép:_ 一张纸 (yì zhāng zhǐ: một tờ giấy), 紧张 (jǐnzhāng: căng thẳng).         |
| 帐 / 帳 | zhàng         | Trướng   | 巾 (Cân - vải) + 长 (Trường - căng/âm)    | [Tra bộ 巾] Tấm vải căng rộng che phủ → màn, trướng, lều trại; _từ ghép:_ 帐篷 (zhàngpeng: lều trại), 蚊帐 (wénzhàng: màn chống muỗi).                                              |
| 账 / 賬 | zhàng         | Trướng   | 贝 (Bối - tiền) + 长 (Trường - thanh phù) | [Tra bộ 贝/貝] Sổ ghi chép tiền bạc, công nợ, tài khoản (dùng `贝` phân biệt với `帐` vải/lều); _từ ghép:_ 记账 (jìzhàng: ghi sổ), 银行账户 (yínháng zhànghù: tài khoản ngân hàng). |
| 涨 / 漲 | zhǎng / zhàng | Trướng   | 氵 (Thủy) + 张 (chứa 长 - thanh phù)      | [Tra bộ 水/氵] Nước dâng lên, giá tăng (`zhǎng`); sưng phồng, đỏ bừng mặt (`zhàng`); _từ ghép:_ 涨价 (zhǎngjià: tăng giá), 涨潮 (zhǎngcháo: thủy triều lên).                        |
| 胀 / 脹 | zhàng         | Trướng   | 月 (Nhục - cơ thể) + 长 (Trường - âm)     | [Tra bộ 肉/⺼] Cơ thể hoặc vật thể căng phồng lên → trướng bụng, sưng, lạm phát; _từ ghép:_ 膨胀 (péngzhàng: phình to/lạm phát), 肚子胀 (dùzi zhàng: đầy bụng).                     |
| 伥 / 倀 | chāng         | Trành    | 亻 (Nhân) + 长 (Trường - thanh phù)       | [Tra bộ 人/亻] Oan hồn người bị hổ ăn thịt dẫn đường cho hổ hại người khác → kẻ tiếp tay cho cái ác; _từ ghép:_ 为虎作伥 (wèihǔ-zuòchāng: nối giáo cho giặc).                       |
| 苌 / 萇 | cháng         | Trường   | 艹 (Thảo) + 长 (Trường - thanh phù)       | [Tra bộ 艸/艹] Tên loài cây cổ (dương đào/cây khế gọi là `苌楚`), nay thường gặp làm họ Trường; _từ ghép:_ 苌楚 (chángchǔ: cây khế cổ), 苌弘 (Cháng Hóng: Trường Hoằng).            |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `张 / 張` (`zhāng` · Trương · `弓 + 长` — mở, căng, tờ, họ Trương; tra bộ `弓`).
- `帐 / 帳` (`zhàng` · Trướng · `巾 + 长` — màn, lều vải; tra bộ `巾`).
- `账 / 賬` (`zhàng` · Trướng · `贝 + 长` — sổ sách, tài khoản; tra bộ `贝/貝`).
- `涨 / 漲` (`zhǎng / zhàng` · Trướng · `氵 + 张` — nước dâng, tăng giá, sưng phồng; tra bộ `水/氵`).
- `胀 / 脹` (`zhàng` · Trướng · `月 + 长` — sưng phồng, trướng bụng; tra bộ `肉/⺼`).
- `套` (`tào` · Sáo — bộ/lớp bọc ngoài; phần dưới có hình biến thể gần `长`, tra bộ `大`, như `一套` một bộ, `手套` găng tay).
- `髟` (`biāo` · Tiêu — tóc dài; bộ thủ riêng gồm `长 + 彡`, không gộp chung với `長`).

---

## Bộ 175: 隶 (Đãi)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-203` | `radical_index`: `203` | `strokes`: `8` nét | `name_vi`: `bộ Đãi / Lệ` | _Khang Hy:_ `#171` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `隶` — dạng chính (8 nét: `肀` trên + `氺` biến dạng dưới); ít đứng độc lập làm từ, hay gặp trong cấu tạo chữ ghép (`逮, 康, 棣`).
  - `隸` — dạng phồn thể của chữ mang nghĩa _nô lệ, lệ thuộc, chữ Lệ thư_ (`柰/肀 + 隶`, 17 nét); giản thể hợp nhất `隸` thành `隶` (nhưng không thay thế `隶` trong mọi chữ phồn thể như `逮, 康` vốn đã dùng sẵn `隶`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý: phía trên là bàn tay (`肀` — giống `又`), phía dưới là hình đuôi thú (`𡳿` biến dạng thành giống `氺`). Nghĩa gốc là **tay nắm bắt được đuôi thú từ phía sau → đuổi kịp, bắt giữ**. Về sau mượn sang chữ `隸` chỉ **người bị bắt làm nô lệ, thuộc hạ, phụ thuộc**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bộ thủ hiếm; hiện đại dùng trong chữ `隶` với nghĩa _nô lệ, trực thuộc, chữ Lệ thư_ (`奴隶, 隶属, 隶书`), và làm thành phần âm–hình trong một số chữ thông dụng như `逮` (đuổi bắt), `康` (an khang), `棣` (cây đường lệ).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `隶` thường không dễ đoán nghĩa hiện đại trực tiếp từ "bắt giữ/lệ thuộc", ngoài chữ `隶` và `逮` (`辶 + 隶`: đuổi bắt); ở nhóm `康, 慷, 糠`, `隶` nằm bên trong `康` làm thành phần cấu chữ.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`隶` vs `水 / 氺`:** Phần dưới của `隶` viết thành nét sổ móc và 4 nét chấm hất giống hệt `氺` (biến thể của `水`), nhưng nguồn gốc là **đuôi thú / bàn tay**, hoàn toàn **không** mang nghĩa nước.
    - **`隶` (8 nét) vs `录` (`lù`, 8 nét):** `隶` phần trên là `肀` (nét sổ thẳng xuyên từ đầu qua hai nét ngang xuống dưới), còn `录` (`彐 + 氺`, tra bộ `彐`) phần đầu là `彐` (nét sổ chỉ dừng lại trên khung dưới, không xuyên suốt từ đỉnh).
    - **`逮` (`dài / dǎi`):** Kết hợp `辶` (chạy/di chuyển) + `隶` (đuổi kịp bắt) → bắt giữ (`逮捕` `dàibǔ`: bắt giữ; `逮住` `dǎizhù`: tóm được).
    - **`肆` (`sì`, phóng túng / số 4 viết hoa):** Phần bên phải của `肆` là bộ **`聿`** (`dù` — cây bút), KHÔNG phải bộ `隶`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bắt giữ, lệ thuộc & kiểu chữ Lệ thư

| Chữ Hán | Pinyin    | Hán Việt | Thiên bàng đứng chung             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                    |
| ------- | --------- | -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 隶 / 隸 | lì / dài  | Lệ / Đãi | Độc thể (phồn `隸`: `肀 + 隶`)    | [Tra bộ 隶] Nghĩa gốc đuổi kịp (`dài`); hợp nhất phồn thể `隸` nghĩa là nô lệ, trực thuộc, kiểu chữ Lệ thư (`lì`); _từ ghép:_ 奴隶 (núlì: nô lệ), 隶属 (lìshǔ: trực thuộc), 隶书 (lìshū: Lệ thư). |
| 逮      | dài / dǎi | Đãi / Đệ | 辶 (Sước - đuổi) + 隶 (Đãi - bắt) | [Tra bộ 辶] Chạy đuổi theo bắt kịp → bắt giữ (`dàibǔ`), tóm lấy (`dǎizhù`); _từ ghép:_ 逮捕 (dàibǔ: bắt giữ), 力有未逮 (lì yǒu wèi dài: lực bất tòng tâm).                                        |

### Nhóm B: Chữ thông dụng mang `隶` (trực tiếp hoặc qua `康`) ở bộ khác

| Chữ Hán | Pinyin   | Hán Việt | Thiên bàng đứng chung                    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                          |
| ------- | -------- | -------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 康      | kāng     | Khang    | 广 (Nghiễm) + 隶 (Đãi)                   | [Tra bộ 广] Cổ tự vẽ giã gạo tách vỏ trấu (`庚` + dấu gạo rơi gần dạng `隶`) → yên ổn, khỏe mạnh, sung túc; _từ ghép:_ 健康 (jiànkāng: khỏe mạnh), 小康 (xiǎokāng: khá giả/tiểu khang). |
| 慷      | kāng     | Khảng    | 忄 (Tâm) + 康 (chứa 隶 - thanh phù)      | [Tra bộ 心/忄] Tấm lòng (`忄`) rộng rãi hào hiệp, sục sôi khí phách; _từ ghép:_ 慷慨 (kāngkǎi: hào phóng, khảng khái).                                                                  |
| 糠      | kāng     | Khang    | 米 (Mễ - gạo) + 康 (chứa 隶 - thanh phù) | [Tra bộ 米] Vỏ trấu/cám xát ra từ hạt gạo (`米`), xốp rỗng; _từ ghép:_ 米糠 (mǐkāng: cám gạo), 糟糠 (zāokāng: bã rượu cám gạo/nghĩa vợ chồng thuở hàn vi).                              |
| 棣      | dì / dài | Đệ / Đãi | 木 (Mộc - cây) + 隶 (Đãi - thanh phù)    | [Tra bộ 木] Cây đường lệ (loài hoa mận dại kết chùm), biểu tượng cho tình anh em hòa thuận; _từ ghép:_ 棠棣 (tángdì: hoa đường lệ, tình anh em).                                        |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `逮` (`dài / dǎi` · Đãi / Đệ · `辶 + 隶` — đuổi bắt, bắt giữ; tra bộ `辶`).
- `康` (`kāng` · Khang · `广 + 隶` — khỏe mạnh, an khang; tra bộ `广`, làm thanh–hình phù cho `慷` và `糠`).
- `棣` (`dì / dài` · Đệ · `木 + 隶` — cây đường lệ; tra bộ `木`).
- `录 / 錄` (`lù` · Lục · `彐 + 氺` — ghi chép, sao lục; tra bộ `彐`, phần dưới là `氺`, không phải `隶`).
- `肆` (`sì` · Tứ · `镸 + 聿` — phóng túng, số bốn viết hoa; tra bộ `聿`, không phải `隶`).
- `彐 / 彑` (`jì` · Kệ) & `水 / 氺` (`shuǐ` · Thủy) — các bộ thủ khác dễ nhầm nét với phần đầu hoặc phần đuôi của `隶`.

---

## Bộ 176: 隹 (Chuy)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-204` | `radical_index`: `204` | `strokes`: `8` nét | `name_vi`: `bộ Chuy` | _Khang Hy:_ `#172` | _Dòng trùng/rỗng:_ Không có.
- **Ghi chú kế thừa `groups` đã có sẵn trong DB:**
  - Bản ghi `radical-204` hiện đã có sẵn 2 `groups`:
    1. `"Tụ tập/đậu lại"`: `["集"]`
    2. `"Linh kiện âm hình/mở rộng"`: `["谁", "难", "准", "推", "维", "雇"]`
  - **Chuẩn hóa phân loại bộ thủ:** Trong 7 chữ trên, **`集`** và **`难`** thực sự thuộc **bộ `隹`** (nên giữ ở **Mục 2** cùng các chữ thuộc bộ `隹` như `雀, 雅, 雄, 雌, 雕, 雏, 雁, 虽/雖...`). Năm chữ còn lại (**`谁, 准, 推, 维, 雇`**) chỉ mượn `隹` làm thành phần phụ/thanh phù, còn bộ tra cứu chính thức nằm ở bên trái/trên (`讠/言, 冫, 扌, 纟/糸, 户`), do đó được tách rạch ròi sang **Mục 3 (`related_components`)** để tránh hiểu nhầm là tra theo bộ `隹`.
- **Hình thái & Biến thể (`variants`):**
  - `隹` — dạng chính duy nhất (`亻` + `丶` + 4 nét ngang + 1 nét sổ giữa, tổng 8 nét); đứng bên phải (`难, 雄, 雌, 雕`), bên dưới (`雀, 雁`), hoặc bên trên (`集, 售, 焦`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình con chim đuôi ngắn nhìn nghiêng (có đầu, mào/mắt, thân, cánh và đuôi ngắn cụp xuống).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chim chóc nói chung (`雀` chim sẻ, `雏` chim non, `雁` chim nhạn, `雄 / 雌` chim trống/chim mái → giống đực/giống cái), đậu tụ tập trên cây (`集` — chim tụ trên cây `木`), thanh nhã (`雅`); ngoài ra là linh kiện âm–hình rất phổ biến (`难, 谁, 准, 推, 维, 雇`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `隹` ở chữ thuộc bộ `隹` thường liên quan đến chim chóc, giống đực/cái, sự tụ họp (`集, 雀, 雄, 雌, 雁, 雏`); nhưng ở rất nhiều chữ hiện đại (`谁, 准, 推, 维`), `隹` chỉ đóng vai trò thành phần lịch sử hoặc thanh phù (`shuí / zhǔn / tuī / wéi`), nghĩa chính do bộ bên trái quyết định.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`隹` (chim đuôi ngắn) vs `鳥 / 鸟` (chim đuôi dài / chim nói chung):** Hai bộ thủ khác nhau cùng chỉ loài chim; trong Hán cổ `隹` nghiêng về chim đuôi ngắn (`雀, 雁, 雏`), còn `鳥/鸟` nghiêng về chim đuôi dài (`鸡, 鸭, 鹅, 鸣`).
    - **`集` (`隹 + 木`):** Hình ảnh cực dễ nhớ: đàn chim (`隹`) cùng đậu trên ngọn cây (`木`) → tập hợp, tụ họp, tập sách (`集合, 集中, 收集`).
    - **`隹` (8 nét, 4 nét ngang) vs `住` (`亻 + 主`, 7 nét, 3 nét ngang):** `住` là `亻 + 主` (chỉ có 3 nét ngang và chấm trên đầu `主`); `隹` bên trái là `亻`, bên phải có chấm phẩy + **4 nét ngang** xuyên qua 1 nét sổ thẳng.
    - **`虽 / 雖` & `双 / 雙` & `只 / 隻`:** Ở chữ phồn thể (`雖, 雙, 隻, 離`), toàn bộ đều mang `隹` và thuộc **bộ `隹`** trong Khang Hy; khi giản hóa (`虽, 双, 只, 离`), các chữ này lược bỏ phần `隹` nên trong tự điển giản thể chuyển sang tra ở bộ khác (`虫/口, 又, 口, 亠`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Chim chóc, tụ tập & tính chất loài chim (thực sự tra bộ `隹`)

| Chữ Hán | Pinyin            | Hán Việt | Thiên bàng đứng chung                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                |
| ------- | ----------------- | -------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 隹      | zhuī              | Chuy     | Độc thể (Bộ thủ chính)                  | [Tra bộ 隹] Tượng hình con chim đuôi ngắn (bộ thủ gốc, ít dùng độc lập hiện đại).                                                                                                             |
| 集      | jí                | Tập      | 隹 (Chuy - chim) trên + 木 (Mộc - cây)  | [Tra bộ 隹] Đàn chim tụ về đậu trên cây (`木`) → tụ hợp, tập trung, sưu tập, tập (phim/sách); _từ ghép:_ 集合 (jíhé: tập hợp), 收集 (shōují: thu thập). _(Kế thừa DB group "Tụ tập/đậu lại")_ |
| 雀      | què / qiāo / qiǎo | Tước     | 小 (Tiểu - nhỏ) trên + 隹 (Chuy - chim) | [Tra bộ 隹] Con chim nhỏ bé (`小 + 隹`) → chim sẻ (`què`), tàn nhang (`qiāo/qiǎo`); _từ ghép:_ 麻雀 (máquè: chim sẻ), 孔雀 (kǒngquè: chim công).                                              |
| 雄      | xióng             | Hùng     | 厷 (Quăng - cánh tay) + 隹 (Chuy)       | [Tra bộ 隹] Chim trống khỏe mạnh → giống đực, người anh hùng, hùng mạnh; _từ ghép:_ 英雄 (yīngxióng: anh hùng), 雄伟 (xióngwěi: hùng vĩ).                                                     |
| 雌      | cí                | Thư      | 此 (Thử - thanh phù) + 隹 (Chuy)        | [Tra bộ 隹] Chim mái, mở rộng thành giống cái (đối ứng với `雄`); _từ ghép:_ 雌雄 (cíxióng: trống mái/đực cái), 雌性 (cíxìng: giống cái).                                                     |
| 雅      | yǎ                | Nhã      | 牙 (Nha - thanh phù) + 隹 (Chuy)        | [Tra bộ 隹] Cổ tự chỉ loài quạ/chim rừng, giả tá thành thanh nhã, cao quý, đúng mực; _từ ghép:_ 优雅 (yōuyǎ: tao nhã), 文雅 (wényǎ: nho nhã).                                                 |
| 雕      | diāo              | Điêu     | 周 (Chu - thanh phù) + 隹 (Chuy)        | [Tra bộ 隹] Chim đại bàng/ưng lớn; mượn dùng cho nghĩa điêu khắc, chạm trổ (thay cả `彫`); _từ ghép:_ 雕刻 (diāokè: điêu khắc), 雕塑 (diāosù: điêu khắc tượng).                               |
| 雏 / 雛 | chú               | Sồ       | 刍 (Sô, phồn `芻`) + 隹 (Chuy)          | [Tra bộ 隹] Chim non mới nở tự mổ ăn được → con non, hình hài sơ khai; _từ ghép:_ 雏鸟 (chúniǎo: chim non), 雏形 (chúxíng: mô hình sơ khai).                                                  |
| 雁      | yàn               | Nhạn     | 厂 + 亻 + 隹 (đàn chim bay hàng)        | [Tra bộ 隹] Chim nhạn bay thành hàng ngay ngắn theo mùa; _từ ghép:_ 大雁 (dàyàn: chim nhạn lớn), 鸿雁 (hóngyàn: chim hồng nhạn/thư tín).                                                      |

### Nhóm B: Chữ thuộc bộ `隹` chuẩn Khang Hy & biến đổi Phồn–Giản liên quan

| Chữ Hán | Pinyin     | Hán Việt     | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                      |
| ------- | ---------- | ------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 难 / 難 | nán / nàn  | Nan / Nạn    | Giản `又 + 隹`; phồn `𦰩 + 隹`      | [Tra bộ 隹 (Khang Hy & Tân Hoa; giản thể cũng tra phụ ở `又`)] Gốc là tên loài chim cổ, giả tá thành khó khăn (`nán`), tai nạn (`nàn`); _từ ghép:_ 困难 (kùnnan: khó khăn), 灾难 (zāinàn: tai nạn). _(Kế thừa DB group)_            |
| 虽 / 雖 | suī        | Tuy          | Phồn `口 + 虫 + 隹`; giản `口 + 虫` | [Tra bộ 隹 (phồn `雖`) / 虫 hoặc 口 (giản `虽`)] Gốc là tên loài bò sát/sâu giống thằn lằn, giả tá làm liên từ nhượng bộ "tuy rằng, mặc dù" (giản thể lược `隹`); _từ ghép:_ 虽然 (suīrán: tuy nhiên), 虽说 (suīshuō: tuy nói là).  |
| 双 / 雙 | shuāng     | Song         | Phồn `隹 + 隹 + 又`; giản `又 + 又` | [Tra bộ 隹 (phồn `雙`) / 又 (giản `双`)] Một bàn tay (`又`) bắt hai con chim (`隹隹`) → một đôi, cặp, chẵn; _từ ghép:_ 一双鞋 (yì shuāng xié: một đôi giày), 双方 (shuāngfāng: hai bên).                                            |
| 只 / 隻 | zhī / zhǐ  | Chích / Chỉ  | Phồn `隹 + 又`; giản `口 + 八`      | [Tra bộ 隹 (phồn `隻`) / 口 (giản `只`)] Một bàn tay (`又`) cầm một con chim (`隹`) → lượng từ cho chim/thú/tay/mắt (`zhī`), chỉ có (`zhǐ`, vốn là chữ `只`); _từ ghép:_ 一只鸟 (yì zhī niǎo: một con chim), 只有 (zhǐyǒu: chỉ có). |
| 离 / 離 | lí         | Ly           | Phồn `离 + 隹`; giản `亠 + 凶 + 禸` | [Tra bộ 隹 (phồn `離`) / 亠 hoặc 禸 (giản `离`)] Chim mắc lưới bay đi → rời khỏi, chia lìa, khoảng cách (giản thể lược `隹`); _từ ghép:_ 离开 (líkāi: rời đi), 距离 (jùlí: khoảng cách).                                            |
| 隽 / 雋 | juàn / jùn | Tuyển / Tuấn | 隹 (Chuy) trên + 乃/弓 dưới         | [Tra bộ 隹] Thịt chim béo ngon → lời văn hàm súc sâu sắc (`juàn`), tài giỏi tuấn tú (`jùn`, thông với `俊`); _từ ghép:_ 隽永 (juànyǒng: thâm thúy sâu sắc), 隽秀 (jùnxiù: thanh tú).                                                |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **5 chữ thông dụng thuộc `groups` cũ trong DB (`隹` chỉ làm thành phần phụ/âm–hình, tra theo bộ khác):**
  - `谁 / 誰` (`shuí / shéi` · Thùy · `讠/言 + 隹` — ai, người nào; **tra bộ `言/讠`**, `隹` gợi âm, như `谁知道` ai biết được).
  - `准` (`zhǔn` · Chuẩn · `冫 + 隹` — chuẩn xác, cho phép, tiêu chuẩn; **tra bộ `冫`** trong giản thể, phồn thể `準` tra bộ `氵`, như `准备` chuẩn bị, `标准` tiêu chuẩn).
  - `推` (`tuī` · Thôi · `扌 + 隹` — đẩy, suy đoán, tiến cử; **tra bộ `手/扌`**, như `推门` đẩy cửa, `推荐` giới thiệu/tiến cử).
  - `维 / 維` (`wéi` · Duy · `纟/糸 + 隹` — dây buộc lớn, duy trì, chiều kích; **tra bộ `糸/纟`**, như `维持` duy trì, `思维` tư duy).
  - `雇` (`gù` · Cố · `户 + 隹` — thuê mướn nhân công; **tra bộ `戶/户`**, cổ tự là chim bay đậu dưới mái cửa, như `雇佣` thuê mướn, `解雇` sa thải).
- **Các chữ thông dụng khác chứa `隹` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `焦` (`jiāo` · Tiêu · `隹 + 灬` — chim nướng trên lửa → cháy khét, lo âu, tiêu điểm; **tra bộ `火/灬`**, như `焦急` sốt ruột, `焦点` tiêu điểm).
  - `售` (`shòu` · Thụ · `隹 + 口` — bán hàng; **tra bộ `口`**, như `销售` tiêu thụ/bán hàng, `售票` bán vé).
  - `携 / 攜` (`xié` · Huề · `扌 + 乃 + 隹` — mang theo, dắt tay; **tra bộ `手/扌`**, như `携带` mang theo).
  - `霍` (`huò` · Hoắc · `雨 + 隹` — nhanh chóng, bệnh dịch tả `霍乱`, họ Hoắc; **tra bộ `雨`**).
- **`鳥 / 鸟` (`niǎo` · Điểu):** Bộ thủ riêng chỉ loài chim đuôi dài / chim nói chung, phân biệt với `隹` (chim đuôi ngắn).

---

## Bộ 177: 青 (Thanh)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-075` | `radical_index`: `75` | `strokes`: `8` nét | `name_vi`: `bộ Thanh` | _Khang Hy:_ `#174` | _Dòng trùng/rỗng:_ Có **1 dòng trùng rỗng `radical-206`** (`radical_index`: `206`, `radical`: `"青"`, `name_vi: null`) cần gộp/dọn khi chuẩn hóa DB.
- **Hình thái & Biến thể (`variants`):**
  - `青` — dạng chính (8 nét); chuẩn chữ Trung Quốc đại lục viết phần dưới là **`月`** (2 nét ngang lồng bên trong), trong khi chữ phồn thể truyền thống Đài Loan/Hồng Kông thường viết phần dưới dạng **`円`** (`青` cổ). Đứng độc lập, đứng bên trái (`静, 靓`), hoặc cực kỳ phổ biến ở bên phải làm thanh phù (`清, 晴, 情, 请, 精, 睛, 猜`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý cổ: phía trên là `生` (mầm cây mọc lên khỏi mặt đất), phía dưới vốn là `丹` (chất khoáng/màu nhuộm, về sau lệ biến thành `月 / 円`). Nghĩa gốc là **màu xanh non của cỏ cây mới nhú**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Sắc xanh có dải màu rộng trong tiếng Hán (xanh lá non `青草`, xanh da trời `青天`, xanh đen `乌青`), mở rộng sang **tuổi trẻ, thanh xuân** (`青年, 青春`), **chín tới chưa hết / còn xanh** (`青果`); đồng thời là **thanh phù năng suất bậc nhất** tạo ra cả họ chữ mang vần `qīng / qíng / jīng`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Thấy `青` trong chữ ghép thuộc họ hình thanh thường gợi ngay âm đọc quanh **`qīng / qíng / qǐng / jīng`**, còn trường nghĩa do bộ thủ bên trái quy định.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Phổ màu đa dạng của `青`:** Không gán cứng `青` là duy nhất màu xanh dương hay xanh lá; tùy ngữ cảnh nó có thể là xanh lục (`青菜`), xanh lam (`青天`), xám đen (`青砖`) hoặc trẻ trung (`青春`).
    - **Công thức học nhanh họ hình thanh `青` (bên trái quyết định nghĩa, `青` gợi âm):**
      - `氵` (nước) + `青` → **`清`** (`qīng`: nước trong sạch)
      - `日` (mặt trời) + `青` → **`晴`** (`qíng`: trời quang nắng ráo)
      - `忄` (tâm) + `青` → **`情`** (`qíng`: tình cảm, tình huống)
      - `讠` (lời nói) + `青` → **`请`** (`qǐng`: mời, xin phép)
      - `米` (gạo) + `青` → **`精`** (`jīng`: gạo lọc kỹ → tinh túy, tinh thần)
      - `目` (mắt) + `青` → **`睛`** (`jīng`: con ngươi mắt)
      - `犭` (thú/tính chất) + `青` → **`猜`** (`cāi`: đoán — ngoại lệ âm hiện đại đổi sang `cāi`).
    - **`青` vs `生`:** `生` (5 nét) là phần trên của `青` và là một bộ thủ độc lập.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Sắc xanh, tĩnh lặng & dung nhan (tra bộ `青`)

| Chữ Hán | Pinyin       | Hán Việt     | Thiên bàng đứng chung                         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                       |
| ------- | ------------ | ------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 青      | qīng         | Thanh        | Độc thể (Bộ thủ chính)                        | [Tra bộ 青] Xanh lam, xanh lục, xanh non, tuổi trẻ thanh xuân; _từ ghép:_ 青年 (qīngnián: thanh niên), 青春 (qīngchūn: thanh xuân), 青菜 (qīngcài: rau cải xanh).                                    |
| 静 / 靜 | jìng         | Tĩnh         | 青 (Thanh - âm/thuần) + 争 (Tranh, phồn `爭`) | [Tra bộ 青] Yên lặng, tĩnh tại, điềm tĩnh, không động đậy; _từ ghép:_ 安静 (ānjìng: yên tĩnh), 冷静 (lěngjìng: bình tĩnh).                                                                           |
| 靓 / 靚 | liàng / jìng | Lượng / Tịnh | 青 (Thanh) + 见 (Kiến, phồn `見`)             | [Tra bộ 青 (hoặc 见/見)] Trang điểm thanh tú (`jìng`), xinh đẹp/bảnh bao (`liàng`, phổ biến từ tiếng Quảng Đông); _từ ghép:_ 靓丽 (liànglì: xinh đẹp rạng rỡ), 靓仔 (liàngzǎi: chàng trai bảnh bao). |
| 靖      | jìng         | Tĩnh         | 立 (Lập) + 青 (Thanh - âm/yên)                | [Tra bộ 青] Yên ổn, dẹp yên biến loạn, giữ bình an (hay dùng trong tên người/địa danh); _từ ghép:_ 靖难 (jìngnàn: dẹp loạn), 绥靖 (suíjìng: vỗ yên/nhân nhượng).                                     |
| 靛      | diàn         | Điện         | 青 (Thanh - xanh) + 定 (Định - thanh phù)     | [Tra bộ 青] Thuốc nhuộm màu xanh chàm đậm chiết xuất từ cây chàm; _từ ghép:_ 靛蓝 (diànlán: xanh chàm), 蓝靛 (lándiàn: bột chàm).                                                                    |

### Nhóm B: Họ hình thanh `青` đọc vần `qīng / qíng / qǐng / qiàn` (tra bộ khác)

| Chữ Hán | Pinyin | Hán Việt     | Thiên bàng đứng chung              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                           |
| ------- | ------ | ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 清      | qīng   | Thanh        | 氵 (Thủy - nước) + 青 (Thanh - âm) | [Tra bộ 水/氵] Nước trong suốt sạch sẽ → trong trẻo, thanh toán, rõ ràng; _từ ghép:_ 清楚 (qīngchu: rõ ràng), 清洁 (qīngjié: sạch sẽ).   |
| 晴      | qíng   | Tình         | 日 (Nhật - trời) + 青 (Thanh - âm) | [Tra bộ 日] Bầu trời quang đãng không mây mưa → trời nắng, tạnh ráo; _từ ghép:_ 晴天 (qíngtiān: trời nắng), 晴朗 (qínglǎng: quang đãng). |
| 情      | qíng   | Tình         | 忄 (Tâm) + 青 (Thanh - âm)         | [Tra bộ 心/忄] Rung động trong tâm hồn → tình cảm, tâm trạng, tình huống; _từ ghép:_ 感情 (gǎnqíng: tình cảm), 事情 (shìqing: sự việc).  |
| 请 / 請 | qǐng   | Thỉnh        | 讠 (Ngôn - lời) + 青 (Thanh - âm)  | [Tra bộ 言/讠] Lời nói nhã nhặn ngỏ ý → mời, xin phép, thỉnh cầu; _từ ghép:_ 请问 (qǐngwèn: xin hỏi), 请客 (qǐngkè: mời khách).          |
| 倩      | qiàn   | Thiến / Sảnh | 亻 (Nhân) + 青 (Thanh - âm)        | [Tra bộ 人/亻] Dáng người đẹp đẽ tươi tắn, hoặc nhờ người làm thay; _từ ghép:_ 倩影 (qiànyǐng: bóng dáng xinh đẹp).                      |

### Nhóm C: Họ hình thanh `青` đọc vần `jīng / cāi` (tra bộ khác)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                        |
| ------- | ------ | -------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 精      | jīng   | Tinh     | 米 (Mễ - gạo) + 青 (Thanh - âm)         | [Tra bộ 米] Hạt gạo xát kỹ trắng tinh → tinh túy, tinh xảo, tinh thần, thông thạo; _từ ghép:_ 精神 (jīngshén: tinh thần), 精彩 (jīngcǎi: đặc sắc).    |
| 睛      | jīng   | Tình     | 目 (Mục - mắt) + 青 (Thanh - âm)        | [Tra bộ 目] Con ngươi trong mắt; _từ ghép:_ 眼睛 (yǎnjing: đôi mắt), 画龙点睛 (huàlóng-diǎnjīng: vẽ rồng điểm mắt).                                   |
| 蜻      | qīng   | Thanh    | 虫 (Trùng) + 青 (Thanh - âm)            | [Tra bộ 虫] Loài côn trùng thân mảnh màu xanh → chuồn chuồn; _từ ghép:_ 蜻蜓 (qīngtíng: con chuồn chuồn).                                             |
| 菁      | jīng   | Tinh     | 艹 (Thảo) + 青 (Thanh - âm)             | [Tra bộ 艸/艹] Hoa cỏ tươi tốt, phần tinh hoa tinh túy nhất; _từ ghép:_ 菁华 (jīnghuá: tinh hoa), 菁英 (jīngyīng: tầng lớp tinh anh).                 |
| 猜      | cāi    | Sai      | 犭 (Khuyển) + 青 (Thanh - thanh phù cổ) | [Tra bộ 犬/犭] Gốc là nghi kỵ dè chừng, hiện đại nghĩa là đoán, phỏng đoán, nghi ngờ; _từ ghép:_ 猜测 (cāicè: suy đoán), 猜想 (cāixiǎng: phỏng đoán). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `清` (`qīng` · Thanh · `氵 + 青` — trong sạch, rõ ràng; tra bộ `水/氵`).
- `晴` (`qíng` · Tình · `日 + 青` — trời quang nắng; tra bộ `日`).
- `情` (`qíng` · Tình · `忄 + 青` — tình cảm, tình hình; tra bộ `心/忄`).
- `请 / 請` (`qǐng` · Thỉnh · `讠/言 + 青` — mời, xin; tra bộ `言/讠`).
- `精` (`jīng` · Tinh · `米 + 青` — tinh túy, tinh thần; tra bộ `米`).
- `睛` (`jīng` · Tình · `目 + 青` — tròng mắt; tra bộ `目`).
- `蜻` (`qīng` · Thanh · `虫 + 青` — chuồn chuồn; tra bộ `虫`).
- `猜` (`cāi` · Sai · `犭 + 青` — đoán, nghi ngờ; tra bộ `犬/犭`).
- `生` (`shēng` · Sinh — sinh ra, sống, xanh non; bộ thủ riêng nằm ở phần trên của `青`).

---

## Bộ 178: 非 (Phi)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-207` | `radical_index`: `207` | `strokes`: `8` nét | `name_vi`: `bộ Phi` | _Khang Hy:_ `#175` | _Dòng trùng/rỗng:_ Không có.
- **Hình thái & Biến thể (`variants`):**
  - `非` — dạng chính duy nhất (`丨 一 一 一` bên trái + `丨 一 一 一` bên phải, tổng 8 nét); đứng độc lập, đứng bên trên (`悲`), bên dưới (`靠, 罪, 靡, 菲`), hoặc bên phải (`排, 啡`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình đôi cánh chim quay lưng trái ngược nhau sang hai phía; từ hình ảnh rẽ ngược hướng sinh nghĩa **trái ngược, không phải, sai trái, tách biệt**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Không phải, sai trái (`是非, 非法`), tiền tố phủ định "phi-" (`非正式, 非洲` phiên âm châu Phi); khi tham gia cấu chữ gợi ý sự **đối lập trong lòng** (`悲` buồn bã), **vi phạm điều sai trái** (`罪` tội lỗi), **tựa lưng vào nhau** (`靠`), **xếp hàng hai bên** (`排, 辈`), hoặc làm thanh phù `fēi / fěi / pái`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `非` thường liên quan đến sự phủ định/trái chiều, tựa dựa (`靠`), cảm xúc đối nghịch/tội lỗi (`悲, 罪`), hoặc làm thanh phù `fēi / fěi / pái`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Nghĩa của `非常` (`fēicháng`):** Trong giao tiếp hiện đại, `非常` mang nghĩa **"rất, vô cùng"** (`非常好`), không dịch máy móc thành "không bình thường" (chỉ mang sắc thái "đặc biệt/khác thường" trong một vài cụm như `非常时期`).
    - **`非` vs `飞 / 飛` vs `羽`:** Cả ba đều bắt nguồn từ hình ảnh đôi cánh chim, nhưng `飞` (bộ riêng) là **bay lượn**, `羽` (bộ riêng) là **lông vũ/cánh**, còn `非` vẽ hai cánh **quay lưng ngược chiều** nên mang nghĩa **trái ngược / phủ định**.
    - **Phân tích nhanh chữ quen thuộc mang `非`:** `悲` (`非 + 心`) là lòng trái ngược mong muốn → đau buồn; `罪` (`罒 + 非`) là lưới pháp luật chụp lên điều sai trái → tội lỗi; `靠` (`告 + 非`) là tựa lưng vào nhau → dựa vào, kề gần.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Phủ định, tựa lưng & ngả rạp (tra bộ `非`)

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                              |
| ------- | ------- | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 非      | fēi     | Phi      | Độc thể (Bộ thủ chính)                    | [Tra bộ 非] Không phải, sai trái, tiền tố "phi-", cực kỳ (`非常`), phiên âm châu Phi; _từ ghép:_ 非常 (fēicháng: vô cùng/rất), 是非 (shìfēi: đúng sai/thị phi), 非法 (fēifǎ: bất hợp pháp). |
| 靠      | kào     | Kháo     | 告 (Cáo - thanh phù) trên + 非 (Phi) dưới | [Tra bộ 非] Tựa lưng vào nhau → dựa vào, tin cậy, kề sát bên; _từ ghép:_ 依靠 (yīkào: dựa vào), 可靠 (kěkào: đáng tin cậy), 靠近 (kàojìn: đến gần).                                         |
| 靡      | mǐ / mí | Mỹ / Mi  | 麻 (Ma) trên + 非 (Phi) dưới              | [Tra bộ 非] Ngả rạp xuống theo gió, lan tỏa rộng (`mǐ`), xa hoa lãng phí (`mí`); _từ ghép:_ 风靡 (fēngmǐ: làm say mê lan rộng), 奢靡 (shēmí: xa xỉ).                                        |

### Nhóm B: Chữ thông dụng mang `非` làm thành phần nghĩa/âm ở bộ khác

| Chữ Hán | Pinyin    | Hán Việt  | Thiên bàng đứng chung                          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                  |
| ------- | --------- | --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 悲      | bēi       | Bi        | 非 (Phi - trái ngược) trên + 心 (Tâm) dưới     | [Tra bộ 心] Lòng (`心`) trái ngược ý nguyện (`非`) → đau buồn, bi thương; _từ ghép:_ 悲伤 (bēishāng: buồn bã), 悲观 (bēiguān: bi quan).                                         |
| 罪      | zuì       | Tội       | 罒 (Võng - lưới) trên + 非 (Phi - sai trái)    | [Tra bộ 网/罒] Lưới pháp luật chụp lấy hành vi sai trái → tội lỗi, lỗi lầm, chịu khổ; _từ ghép:_ 犯罪 (fànzuì: phạm tội), 得罪 (dézuì: đắc tội/làm mất lòng).                   |
| 排      | pái       | Bài       | 扌 (Thủ - tay) + 非 (Phi - song song/âm)       | [Tra bộ 手/扌] Dùng tay đẩy gạt ra hoặc xếp thẳng thành hàng song song → đẩy ra, sắp hàng, diễn tập; _từ ghép:_ 排队 (páiduì: xếp hàng), 安排 (ānpái: sắp xếp).                 |
| 菲      | fēi / fěi | Phi / Phỉ | 艹 (Thảo - cỏ) + 非 (Phi - thanh phù)          | [Tra bộ 艸/艹] Cỏ hoa thơm ngát (`fēi`, dùng phiên âm Philippines), mỏng manh ít ỏi (`fěi`); _từ ghép:_ 菲律宾 (Fēilǜbīn: Philippines), 妄自菲薄 (wàngzì-fěibó: tự ti quá mức). |
| 啡      | fēi       | Phê       | 口 (Khẩu) + 非 (Phi - thanh phù)               | [Tra bộ 口] Chữ phiên âm ngoại lai kết hợp bộ Khẩu (`口`) và thanh phù `非`; _từ ghép:_ 咖啡 (kāfēi: cà phê), 吗啡 (mǎfēi: moóc-phin).                                          |
| 辈 / 輩 | bèi       | Bối       | 非 (Phi - song song) trên + 车 (Xa, phồn `車`) | [Tra bộ 车/車] Hàng trăm cỗ xe xếp hàng nối đuôi → thế hệ, bậc, suốt đời; _từ ghép:_ 前辈 (qiánbèi: tiền bối), 一辈子 (yíbèizi: cả một đời người).                              |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `悲` (`bēi` · Bi · `非 + 心` — đau buồn, bi thương; tra bộ `心`).
- `罪` (`zuì` · Tội · `罒 + 非` — tội lỗi, phạm tội; tra bộ `网/罒`).
- `排` (`pái` · Bài · `扌 + 非` — xếp hàng, sắp xếp, đẩy ra; tra bộ `手/扌`).
- `菲` (`fēi / fěi` · Phi / Phỉ · `艹 + 非` — thơm ngát, mỏng manh; tra bộ `艸/艹`).
- `啡` (`fēi` · Phê · `口 + 非` — dùng trong phiên âm `咖啡` cà phê; tra bộ `口`).
- `辈 / 輩` (`bèi` · Bối · `非 + 车/車` — thế hệ, bậc, cả đời; tra bộ `车/車`).
- `徘` (`pái` · Bồi · `彳 + 非` — đi đi lại lại do dự; tra bộ `彳`, như `徘徊` bồi hồi/đi quanh quẩn).
- `飞 / 飛` (`fēi` · Phi — bay) & `羽` (`yǔ` · Vũ — lông cánh) — hai bộ thủ riêng có chung hình tượng cánh chim nhưng khác nghĩa với `非`.
