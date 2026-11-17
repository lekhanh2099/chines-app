# Nhóm D — Các Bộ 11 Đến 17 Nét Khang Hy Còn Lại (Bộ 195 – Bộ 214)

Tài liệu biên soạn chi tiết **20 bộ thủ cuối cùng (Khang Hy #195 → #214)** thuộc nhóm các bộ **11 đến 17 nét**, đối chiếu trực tiếp với bảng `public.hanzihome_radicals` trong HanziHome (xem quy ước ánh xạ schema tại [README.md](./README.md)).

> **Trạng thái đối chiếu DB (`hanzihome_radicals`):**
>
> - **Đã có dòng chính (`name_vi IS NOT NULL`):** **20 / 20** bộ (`195` → `214`).
> - **Dòng trùng / rỗng cần lưu ý dọn dẹp:** **4 bộ** có 1 dòng rỗng phụ đi kèm ở cụm cuối bảng (do trước đó 4 bộ này đã được đưa lên vùng index sớm `73, 77, 83, 84`):
>   - Bộ 201 `黃 / 黄`: dòng chính `radical-077` (#77) · dòng rỗng `radical-231` (#231, `name_vi: null`).
>   - Bộ 203 `黑`: dòng chính `radical-073` (#73) · dòng rỗng `radical-233` (#233, `name_vi: null`).
>   - Bộ 209 `鼻`: dòng chính `radical-084` (#84) · dòng rỗng `radical-239` (#239, `name_vi: null`).
>   - Bộ 211 `齒 / 齿`: dòng chính `radical-083` (#83) · dòng rỗng `radical-241` (#241, `name_vi: null`).
> - **Đối chiếu Giản thể – Phồn thể trong nhóm 195–214:** Có **10 bộ** có sự khác biệt rõ rệt giữa Phồn thể và Giản thể: `魚/鱼`, `鳥/鸟`, `鹵/卤`, `麥/麦`, `黃/黄`, `黽/黾`, `齊/齐`, `齒/齿`, `龍/龙`, `龜/龟`. Ngoài ra lưu ý hai bộ đồng âm Hán-Việt **"Thử"** là **Bộ 202 `黍`** (cây kê nếp) và **Bộ 208 `鼠`** (con chuột).

| Khang Hy # | Bộ thủ (Phồn / Giản) | Hán-Việt | DB ID chính   | `radical_index` | Số nét (KH / Giản) | `name_vi` trong DB  | Dòng trùng / rỗng DB       | Số chữ biên soạn |
| :--------: | :------------------: | -------- | ------------- | :-------------: | :----------------: | ------------------- | -------------------------- | :--------------: |
|    195     |       魚 / 鱼        | Ngư      | `radical-225` |       225       |       11 / 8       | `bộ Ngư`            | —                          |        16        |
|    196     |       鳥 / 鸟        | Điểu     | `radical-226` |       226       |       11 / 5       | `bộ Điểu`           | —                          |        16        |
|    197     |       鹵 / 卤        | Lỗ       | `radical-227` |       227       |       11 / 7       | `bộ Lỗ`             | —                          |        5         |
|    198     |          鹿          | Lộc      | `radical-228` |       228       |         11         | `bộ Lộc`            | —                          |        12        |
|    199     |       麥 / 麦        | Mạch     | `radical-229` |       229       |       11 / 7       | `bộ Mạch`           | —                          |        12        |
|    200     |          麻          | Ma       | `radical-230` |       230       |         11         | `bộ Ma`             | —                          |        11        |
|    201     |       黃 / 黄        | Hoàng    | `radical-077` |       77        |      12 / 11       | `bộ Hoàng`          | `radical-231` (#231, rỗng) |        6         |
|    202     |          黍          | Thử      | `radical-232` |       232       |         12         | `bộ Thử`            | —                          |        4         |
|    203     |          黑          | Hắc      | `radical-073` |       73        |         12         | `bộ Hắc`            | `radical-233` (#233, rỗng) |        16        |
|    204     |          黹          | Chỉ      | `radical-234` |       234       |         12         | `bộ Chỉ / May thêu` | —                          |        3         |
|    205     |       黽 / 黾        | Mãnh     | `radical-235` |       235       |       13 / 8       | `bộ Mãnh / Mẫn`     | —                          |        6         |
|    206     |          鼎          | Đỉnh     | `radical-236` |       236       |         13         | `bộ Đỉnh`           | —                          |        4         |
|    207     |          鼓          | Cổ       | `radical-237` |       237       |         13         | `bộ Cổ`             | —                          |        6         |
|    208     |          鼠          | Thử      | `radical-238` |       238       |         13         | `bộ Thử`            | —                          |        6         |
|    209     |          鼻          | Tỵ       | `radical-084` |       84        |         14         | `bộ Tỵ`             | `radical-239` (#239, rỗng) |        5         |
|    210     |       齊 / 齐        | Tề       | `radical-240` |       240       |       14 / 6       | `bộ Tề`             | —                          |        7         |
|    211     |       齒 / 齿        | Xỉ       | `radical-083` |       83        |       15 / 8       | `bộ Xỉ`             | `radical-241` (#241, rỗng) |        12        |
|    212     |       龍 / 龙        | Long     | `radical-242` |       242       |       16 / 5       | `bộ Long`           | —                          |        8         |
|    213     |       龜 / 龟        | Quy      | `radical-243` |       243       |       16 / 7       | `bộ Quy`            | —                          |        4         |
|    214     |          龠          | Dược     | `radical-244` |       244       |         17         | `bộ Dược / Sáo cổ`  | —                          |        6         |

---

## Bộ 195: 魚 (Ngư)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-225` · `radical_index`: `225` · `radical`: `"魚 / 鱼"` · `strokes`: `11` nét (chuẩn Khang Hy; Giản thể `鱼` rút xuống `8` nét) · `name_vi`: `bộ Ngư` · **Khang Hy:** `#195` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `魚` — dạng Phồn thể / đầy đủ (`11` nét: đầu `⺈` + thân `田` + đuôi `灬`). Khi đứng ở bên trái chữ ghép, nét cuối của `灬` thường viết hơi hất nhẹ để nhường chỗ cho phần bên phải.
  - `鱼` — dạng Giản thể chuẩn (`8` nét: biến 4 chấm `灬` ở đuôi cá thành **1 nét ngang `一`**). Trong chữ ghép hiện đại (như `鲜, 鲤, 鲸, 鲨`), nét ngang cuối ở chân `鱼` biến thành **nét hất `㇀`** khi đứng bên trái, và giữ nét ngang `一` khi đứng một mình hoặc nằm phía dưới (như `鲁`, `鳖`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **con cá** nhìn nghiêng từ trên xuống: phần `⺈` là đầu và miệng cá, phần `田` là thân và vảy cá, bốn nét `灬` là vây và đuôi cá đang quẫy.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **cá, thủy sản, sinh vật sống dưới nước, tên các loài cá cụ thể và món ăn từ cá**; từ hình ảnh cá tươi vừa đánh bắt còn mở rộng sang nghĩa **"tươi mới, ngon lành"** (`鲜`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Chữ có `魚 / 鱼` (thường ở bên trái hoặc bên dưới) đa phần là tên các loài cá, hải sản, bộ phận của cá (vảy, mang) hoặc món ăn chế biến từ cá.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`魚 / 鱼` (cá) vs `虫` (côn trùng / bò sát / nhuyễn thể nhỏ):** Một số loài sống dưới nước nhưng không phải cá như tôm (`虾`), cua (`蟹`), sò (`蛤`) dùng bộ `虫`; cá thật và động vật biển lớn theo phân loại cổ như cá voi (`鲸`), cá sấu (`鳄`), mực (`鱿`) dùng bộ `魚 / 鱼`.
    - **`鱼` (Giản thể) vs `角` (bộ Giác = sừng):** Hai chữ đều có đầu `⺈` và thân `田`/gần `田`, nhưng `角` có nét phẩy kéo dài ở cạnh trái (`丿`) và hai nét ngang bên trong xuyên ra hai nét thẳng ngoài, không có nét ngang đáy kiểu `鱼`.
    - **Lưu ý chữ `鲜` (`xiān`):** `鱼 + 羊` dễ nhớ theo mẹo "cá + dê = tươi ngon", nhưng không nên suy diễn cứng mọi chữ bộ `鱼` đều ghép nghĩa kiểu hội ý thuần túy vì đa số là chữ hình thanh (phần bên phải chỉ âm).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cá thông dụng & thủy sản nước ngọt / thực phẩm quen thuộc

| Chữ Hán | Pinyin      | Hán Việt    | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                      |
| ------- | ----------- | ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鱼 / 魚 | yú          | Ngư         | Độc thể (Bộ thủ chính)        | [Tra bộ 魚 / 鱼] Tượng hình con cá có đầu, thân vảy và đuôi → cá, loài cá; _từ ghép:_ 鱼肉 (yúròu: thịt cá), 金鱼 (jīnyú: cá vàng), 钓鱼 (diàoyú: câu cá).                                                          |
| 鲜 / 鮮 | xiān / xiǎn | Tiên / Tiển | 鱼/魚 (cá) + 羊 (dê)          | [Tra bộ 魚 / 鱼] Hội ý: cá tươi và thịt dê non → tươi ngon, mới mẻ, sáng sủa (`xiān`); đọc `xiǎn` nghĩa là ít ỏi, hiếm có; _từ ghép:_ 新鲜 (xīnxiān: tươi mới), 海鲜 (hǎixiān: hải sản), 鲜艳 (xiānyàn: tươi thắm). |
| 鲤 / 鯉 | lǐ          | Lý          | 鱼/魚 + 里 (`lǐ`, thanh phù)  | [Tra bộ 魚 / 鱼] Hình thanh: loài cá (`鱼`) đọc âm `lǐ` → cá chép; _từ ghép:_ 鲤鱼 (lǐyú: cá chép), 锦鲤 (jǐnlǐ: cá chép gấm / cá koi).                                                                             |
| 鲫 / 鯽 | jì          | Tức         | 鱼/魚 + 即 (`jí`, thanh phù)  | [Tra bộ 魚 / 鱼] Hình thanh: cá diếc (loài cá nước ngọt thân dẹt rất phổ biến trong ẩm thực Trung Hoa); _từ ghép:_ 鲫鱼 (jìyú: cá diếc), 鲫鱼汤 (jìyútāng: canh cá diếc).                                           |
| 鳅 / 鰍 | qiū         | Thu         | 鱼/魚 + 秋 (`qiū`, thanh phù) | [Tra bộ 魚 / 鱼] Hình thanh: loài cá trạch / cá chạch sống ở bùn ruộng; _từ ghép:_ 泥鳅 (níqiū: cá chạch bùn).                                                                                                      |
| 鳗 / 鰻 | mán         | Man         | 鱼/魚 + 曼 (`màn`, thanh phù) | [Tra bộ 魚 / 鱼] Hình thanh: loài cá chình / lươn biển thân dài trơn; _từ ghép:_ 鳗鱼 (mányú: cá chình/lươn Nhật), 烤鳗鱼 (kǎo mányú: lươn nướng).                                                                  |

### Nhóm B: Sinh vật biển lớn & hải sản phổ biến

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                            |
| ------- | ------ | -------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鲸 / 鯨 | jīng   | Kình     | 鱼/魚 + 京 (`jīng`, thanh phù)                            | [Tra bộ 魚 / 鱼] Hình thanh: loài thủy sinh khổng lồ (người xưa xếp vào loài cá) → cá voi; _từ ghép:_ 鲸鱼 (jīngyú: cá voi), 蓝鲸 (lánjīng: cá voi xanh).                                 |
| 鲨 / 鯊 | shā    | Sa       | 鱼/魚 + 沙 (`shā`, thanh phù)                             | [Tra bộ 魚 / 鱼] Hình thanh: loài cá dữ ngoài biển, da nhám như cát → cá mập; _từ ghép:_ 鲨鱼 (shāyú: cá mập), 大白鲨 (dàbáishā: cá mập trắng lớn).                                       |
| 鳄 / 鱷 | è      | Ngạc     | 鱼/魚 + 噩 (`è`, thanh phù)                               | [Tra bộ 魚 / 鱼] Hình thanh: loài bò sát nước hung dữ có hàm răng lớn (cổ thư xếp theo nhóm thủy tộc) → cá sấu; _từ ghép:_ 鳄鱼 (èyú: cá sấu), 鳄鱼泪 (èyúlèi: nước mắt cá sấu).          |
| 鲍 / 鮑 | bào    | Bào      | 鱼/魚 + 包 (`bāo`, thanh phù)                             | [Tra bộ 魚 / 鱼] Hình thanh: cổ nghĩa chỉ cá ướp muối, nay phổ biến là bào ngư (cũng là họ Bào); _từ ghép:_ 鲍鱼 (bàoyú: bào ngư), 鲍鱼之肆 (bàoyú zhī sì: hàng cá ươn — môi trường xấu). |
| 鱿 / 魷 | yóu    | Vưu      | 鱼/魚 + 尤 (`yóu`, thanh phù)                             | [Tra bộ 魚 / 鱼] Hình thanh: loài mực ống (nhuyễn thể biển được gọi tên theo thói quen thủy sản); _từ ghép:_ 鱿鱼 (yóuyú: mực ống), 炒鱿鱼 (chǎo yóuyú: sa thải/đuổi việc — khẩu ngữ).    |
| 鲑 / 鮭 | guī    | Khuê     | 鱼/魚 + 圭 (`guī`, thanh phù)                             | [Tra bộ 魚 / 鱼] Hình thanh: cá hồi; _từ ghép:_ 鲑鱼 (guīyú: cá hồi), 大马哈鱼 / 三文鱼 (tên gọi thương mại khác).                                                                        |
| 鳕 / 鱈 | xuě    | Tuyết    | 鱼/魚 + 雪 (`xuě`, thanh phù kiêm ý thịt trắng như tuyết) | [Tra bộ 魚 / 鱼] Hình thanh/hội ý: cá tuyết biển lạnh thịt trắng muốt; _từ ghép:_ 鳕鱼 (xuěyú: cá tuyết), 银鳕鱼 (yínxuěyú: cá tuyết bạc).                                                |

### Nhóm C: Bộ phận cơ thể cá & chữ mở rộng thông dụng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                        |
| ------- | ------ | -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鳞 / 鱗 | lín    | Lân      | 鱼/魚 + 粦 (`lín`, thanh phù) | [Tra bộ 魚 / 鱼] Hình thanh: lớp vảy xếp đều trên thân cá/bò sát → vảy cá, vảy rồng, xếp dày sát nhau; _từ ghép:_ 鱼鳞 (yúlín: vảy cá), 鳞次栉比 (líncì-zhìbǐ: san sát như vảy cá răng lược).                                         |
| 鳃 / 鰓 | sāi    | Tai      | 鱼/魚 + 思 (`sī`, thanh phù)  | [Tra bộ 魚 / 鱼] Hình thanh: cơ quan hô hấp ở hai bên đầu cá → mang cá; _từ ghép:_ 鱼鳃 (yúsāi: mang cá).                                                                                                                             |
| 鲁 / 魯 | lǔ     | Lỗ       | 鱼/魚 trên + 日 dưới          | [Tra bộ 魚 / 鱼] Gốc cổ liên quan tế lễ/cá ngon, sau chuyển nghĩa thành thô kệch, vụng về, thiếu lịch sự; tên tắt tỉnh Sơn Đông (nước Lỗ xưa); _từ ghép:_ 鲁莽 (lǔmǎng: lỗ mãng), 粗鲁 (cūlǔ: thô lỗ), 齐鲁 (Qílǔ: Tề Lỗ / Sơn Đông). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-225`):** `鲜 / 鮮`, `鲤 / 鯉`, `鲸 / 鯨`, `鳞 / 鱗` (các chữ tiêu biểu thuộc bộ `魚/鱼`), cùng hai bộ riêng liên quan là `水 / 氵` (môi trường nước) và `羊` (góp mặt trong cấu tạo `鲜`).
- **Chữ chứa `魚 / 鱼` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `渔 / 漁` (`yú`, Ngư — `氵 + 鱼/魚`, tra bộ **Thủy `氵`**): đánh bắt cá, nghề cá (`渔民`, `渔船`, `如鱼得水` vs `渔翁得利`).
  - `苏 / 蘇` (`sū`, Tô — Phồn thể `蘇` gồm `艹 + 魚 + 禾`, tra bộ **Thảo `艹`**; Giản thể `苏` viết `艹 + 办` không còn `魚`): cây tía tô, hồi sinh, tên tỉnh Giang Tô (`江苏`, `复苏`, `苏州`).
  - `稣 / 穌` (`sū`, Tô — `魚 + 禾`, tra bộ **Hòa `禾`**): sống lại, hồi sinh (`耶稣` Giê-su, `苏醒`).
  - `蓟 / 薊` (`jì`, Kế — `艹 + 鱼/魚 + 刂`, tra bộ **Thảo `艹`**): cây kế gai, địa danh Kế Châu / Bắc Kinh xưa (`蓟县`, `紫花地丁/大蓟`).
  - `衡` (`héng`, Hành — bên trong chữ có `角` và `大` chứ không phải `鱼`, nhưng người học hay nhìn nhầm nét giữa với `鱼`, tra bộ **Hành `行` / Xích `彳`**).

---

## Bộ 196: 鳥 (Điểu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-226` · `radical_index`: `226` · `radical`: `"鳥 / 鸟"` · `strokes`: `11` nét (chuẩn Khang Hy; Giản thể `鸟` rút xuống `5` nét) · `name_vi`: `bộ Điểu` · **Khang Hy:** `#196` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `鳥` — dạng Phồn thể / đầy đủ (`11` nét: mào và đầu chim có nét gạch mắt bên trong + thân + 4 chấm `灬` ở chân/đuôi). Khi ghép trái-phải thường đặt ở bên phải (như `雞, 鴨, 鵝, 鳴`) hoặc đặt bên dưới (như `鷹, 鷺, 鸚`).
  - `鸟` — dạng Giản thể chuẩn (`5` nét: `丿 𠃍 丶 ㇉ 一`), gộp 4 chấm `灬` thành **1 nét ngang `一`**, và giữ **1 dấu chấm `丶`** tượng trưng con mắt chim ở phần đầu.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **con chim có mào và đuôi dài** đứng quay nghiêng; thấy rõ mỏ, mắt, cánh và đuôi.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **các loài chim, gia cầm, loài có cánh biết bay, tiếng chim hót** (`鸣`), và hình tượng chim quý trong thần thoại (`鹏, 凤, 鸾`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `鳥 / 鸟` ở bên phải hoặc phía dưới thường chỉ tên loài chim, gia cầm, tiếng chim kêu hoặc hành vi liên quan đến chim.
  - _Phân biệt trọng yếu — **`鳥 / 鸟` vs `隹` vs `乌 / 烏`**:_
    1. **`鳥 / 鸟` (Điểu — `11` nét phồn / `5` nét giản):** Chỉ **chim nói chung** (gốc là chim đuôi dài). Điểm nhận diện bắt buộc là **có nét mắt ở phần đầu**: Phồn thể `鳥` có **2 gạch ngang** trong khung `白/日`-dạng đầu, Giản thể `鸟` có **1 dấu chấm `丶`** ở phần đầu.
    2. **`乌 / 烏` (Ô — `4` nét giản / `10` nét phồn, bộ riêng thuộc `火`/`丿`):** Nghĩa gốc là **con quạ đen**, mở rộng thành **màu đen, tối tăm** (`乌鸦` quạ, `乌云` mây đen, `乌龟` rùa đen). Vì lông quạ đen tuyền không phân biệt rõ con mắt, nên chữ `烏 / 乌` **CỐ Ý BỎ MẤT nét gạch/chấm con mắt** so với `鳥 / 鸟`! (`鳥` mất 1 gạch thành `烏`; `鸟` mất 1 chấm thành `乌`). Đây là điểm phân biệt kinh điển nhất tránh đọc nhầm `乌` thành `鸟`.
    3. **`隹` (Chuy — `8` nét, Khang Hy `#172`, DB `radical-204`):** Bộ thủ riêng chỉ **chim đuôi ngắn** trong văn tự cổ. Trong nhiều chữ hiện đại, `隹` đứng thay vai trò chỉ chim (như `雀` chim sẻ, `集` chim đậu trên cây, `雕` chim ưng, `雅` nhã/quạ cổ), thậm chí chữ Phồn thể `雞` (gà) dùng `隹` còn Giản thể `鸡` đổi sang `鸟` (`鸡` = `又 + 鸟`)!
    4. **Liên hệ thêm:** `羽` = lông vũ/cánh (bộ riêng); `飞 / 飛` = bay (bộ riêng); `岛 / 島` (`dǎo` — hòn đảo) là `鸟` đậu trên núi `山` (bỏ nét ngang đáy của `鸟`), xếp vào **bộ Sơn `山`**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Gia cầm quen thuộc & tiếng chim

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                           |
| ------- | ------ | -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鸟 / 鳥 | niǎo   | Điểu     | Độc thể (Bộ thủ chính)                           | [Tra bộ 鳥 / 鸟] Tượng hình con chim → chim chóc nói chung; _từ ghép:_ 小鸟 (xiǎoniǎo: chim nhỏ), 鸟巢 (niǎocháo: tổ chim), 候鸟 (hòuniǎo: chim di cư).                                                                                                  |
| 鸡 / 雞 | jī     | Kê       | Giản: `又` + `鸟` / Phồn: `奚` + `隹`            | [Tra bộ 鳥 / 鸟 (giản) · bộ 隹 (phồn)] Phồn thể dùng `隹` (chim đuôi ngắn) + `奚` thanh phù; Giản thể đổi thanh phù thành `又` và đổi ý phù thành `鸟` → con gà; _từ ghép:_ 鸡蛋 (jīdàn: trứng gà), 公鸡 (gōngjī: gà trống), 鸡肉 (jīròu: thịt gà).      |
| 鸭 / 鴨 | yā     | Áp       | 甲 (`jiǎ`, thanh phù mô phỏng tiếng vịt) + 鸟/鳥 | [Tra bộ 鳥 / 鸟] Hình thanh: loài gia cầm (`鸟`) kêu "quạc/áp" (`甲`) → con vịt; _từ ghép:_ 鸭子 (yāzi: con vịt), 烤鸭 (kǎoyā: vịt quay).                                                                                                                |
| 鹅 / 鵝 | é      | Nga      | 我 (`wǒ/é`, thanh phù) + 鸟/鳥                   | [Tra bộ 鳥 / 鸟] Hình thanh: loài chim nước cổ dài (`鸟`) có thanh phù `我` → con ngỗng; _từ ghép:_ 白鹅 (bái'é: ngỗng trắng), 企鹅 (qǐ'é: chim cánh cụt), 天鹅 (tiān'é: thiên nga).                                                                     |
| 鸣 / 鳴 | míng   | Minh     | 口 (miệng) + 鸟/鳥 (chim)                        | [Tra bộ 口 (Tân Hoa) / 鳥 (Khang Hy)] Hội ý: chim mở miệng (`口`) cất tiếng (`鸟`) → chim hót, kêu vang, vang tiếng; _từ ghép:_ 鸣叫 (míngjiào: kêu hót), 共鸣 (gòngmíng: cộng hưởng/đồng cảm), 一鸣惊人 (yìmíng-jīngrén: một tiếng vang dậy kinh ngạc). |

### Nhóm B: Chim hoang dã, chim săn mồi & chim nước

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                              |
| ------- | ------ | -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鸦 / 鴉 | yā     | Nha      | 牙 (`yá`, thanh phù) + 鸟/鳥        | [Tra bộ 鳥 / 鸟] Hình thanh: loài chim kêu "oa/nha" (`牙`) → con quạ; _từ ghép:_ 乌鸦 (wūyā: con quạ — phân biệt `乌` không chấm và `鸦` có `鸟`), 鸦片 (yāpiàn: thuốc phiện — phiên âm).                   |
| 鸽 / 鴿 | gē     | Cáp      | 合 (`hé/gē`, thanh phù) + 鸟/鳥     | [Tra bộ 鳥 / 鸟] Hình thanh: chim bồ câu; _từ ghép:_ 鸽子 (gēzi: bồ câu), 和平鸽 (hépínggē: bồ câu hòa bình).                                                                                               |
| 鹰 / 鷹 | yīng   | Ưng      | 广 + 亻+ 隹 (tức `䧹` tỉnh) + 鸟/鳥 | [Tra bộ 鳥 / 鸟] Chim săn mồi móng vuốt sắc trên vách núi → chim ưng, đại bàng; _từ ghép:_ 老鹰 (lǎoyīng: chim ưng/diều hâu), 鹰眼 (yīngyǎn: mắt chim ưng).                                                 |
| 鹊 / 鵲 | què    | Thước    | 昔 (`xī`, cổ âm gần) + 鸟/鳥        | [Tra bộ 鳥 / 鸟] Chim ác là (trong văn hóa Trung Hoa báo điềm lành); _từ ghép:_ 喜鹊 (xǐquè: chim khách/ác là báo tin vui), 鹊桥 (quèqiáo: cầu Ô Thước).                                                    |
| 鹤 / 鶴 | hè     | Hạc      | 隺 (`hè`, chim bay cao) + 鸟/鳥     | [Tra bộ 魚/鳥 → 鳥] Chim hạc cổ cao, biểu tượng trường thọ thanh cao; _từ ghép:_ 白鹤 (báihè: hạc trắng), 仙鹤 (xiānhè: tiên hạc), 鹤立鸡群 (hèlì-jīqún: hạc đứng giữa bầy gà).                             |
| 鸥 / 鷗 | ōu     | Âu       | 区/區 (`qū/ōu`, thanh phù) + 鸟/鳥  | [Tra bộ 鳥 / 鸟] Hình thanh: chim hải âu bay lượn trên mặt biển; _từ ghép:_ 海鸥 (hǎi'ōu: chim hải âu).                                                                                                     |
| 鸵 / 鴕 | tuó    | Đà       | 它 (`tā/tuó`, thanh phù) + 鸟/鳥    | [Tra bộ 鳥 / 鸟] Hình thanh: loài chim lớn chạy nhanh không bay, lưng gù như lạc đà (`驼`) → đà điểu; _từ ghép:_ 鸵鸟 (tuóniǎo: đà điểu), 鸵鸟心态 (tuóniǎo xīntài: tâm lý trốn tránh như đà điểu vùi đầu). |

### Nhóm C: Chim quý, thần thoại & chữ chứa `鸟` xếp bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                |
| ------- | ------ | -------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鹏 / 鵬 | péng   | Bằng     | 朋 (`péng`, thanh phù) + 鸟/鳥          | [Tra bộ 鳥 / 鸟] Hình thanh: chim đại bàng khổng lồ trong thần thoại (Trang Tử); _từ ghép:_ 鹏程万里 (péngchéng-wànlǐ: tiền đồ rộng lớn vạn dặm), 鲲鹏 (kūnpéng: cá Côn chim Bằng).                                           |
| 鸿 / 鴻 | hóng   | Hồng     | 江 (`jiāng` sông / `工` + `氵`) + 鸟/鳥 | [Tra bộ 鳥 / 鸟] Hình thanh kiêm hội ý: loài chim lớn sống vùng sông nước → hồng hộc/ngỗng trời, to lớn, thư tín (hồng nhạn đưa thư); _từ ghép:_ 鸿沟 (hónggōu: hố ngăn/khoảng cách lớn), 惊鸿 (jīnghóng: dáng vẻ kinh diễm). |
| 鹦 / 鸚 | yīng   | Anh      | 婴/嬰 (`yīng`, thanh phù) + 鸟/鳥       | [Tra bộ 鳥 / 鸟] Hình thanh: chim vẹt biết nhại tiếng người (như trẻ nhỏ `婴` bập bẹ); _từ ghép:_ 鹦鹉 (yīngwǔ: con vẹt), 鹦鹉学舌 (yīngwǔ-xuéshé: vẹt nhại tiếng người / nói leo).                                           |
| 岛 / 島 | dǎo    | Đảo      | 鸟/鳥 (lược đáy) + 山 (núi)             | [Tra bộ 山] Hội ý: ngọn núi (`山`) nhô giữa biển có chim biển (`鸟`) bay về đậu nghỉ → hòn đảo; _từ ghép:_ 海岛 (hǎidǎo: hải đảo), 半岛 (bàndǎo: bán đảo).                                                                    |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-226`):** `鸡 / 雞`, `鸭 / 鴨`, `鹅 / 鵝`, `鸣 / 鳴` (nhóm gia cầm & tiếng chim tiêu biểu), cùng 3 bộ thủ độc lập liên quan đến chim/bay là `隹` (chim đuôi ngắn), `羽` (lông vũ/cánh) và `飞 / 飛` (hành động bay).
- **Thành phần & Chữ chứa `鳥 / 鸟` hoặc gần dạng nhưng xếp ở bộ khác:**
  - `乌 / 烏` (`wū`, Ô — tra bộ **Phẩy `丿`** [giản] / **Hỏa `灬`** [phồn]): con quạ đen, màu đen (ít hơn `鸟/鳥` đúng **1 nét mắt**; `乌鸦` quạ đen, `乌云` mây đen).
  - `凤 / 鳳` (`fèng`, Phượng — Phồn thể `鳳` thuộc **bộ Điểu `鳥`**, Giản thể `凤` đổi thành khung `几` + `又` thuộc **bộ Kỷ `几`**): chim phượng hoàng (`凤凰`).
  - `岛 / 島` (`dǎo`, Đảo — tra bộ **Sơn `山`**): hòn đảo (`岛屿`, `半岛`).
  - `枭 / 梟` (`xiāo`, Kiêu — `鸟` trên + `木` dưới, tra bộ **Mộc `木`**): chim cú mèo đậu trên cây (`枭雄` kiêu hùng).
  - `焉` (`yān`, Yên — chữ văn ngôn cổ có gốc vẽ loài chim vàng, tra bộ **Hỏa `灬`**).
  - `鹑`, `鸳`, `鸯`, `鸾`, `鹉`, `鹫`, `鹭`, `鹂`: đều là chữ thuần **bộ Điểu `鳥 / 鸟`** thường gặp trong thành ngữ và tên loài chim (`鹌鹑` chim cút, `鸳鸯` uyên ương, `白鹭` cò trắng, `黄鹂` chim vàng anh).

---

## Bộ 197: 鹵 (Lỗ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-227` · `radical_index`: `227` · `radical`: `"鹵 / 卤"` · `strokes`: `11` nét (chuẩn Khang Hy; Giản thể `卤` rút xuống `7` nét) · `name_vi`: `bộ Lỗ` · **Khang Hy:** `#197` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `鹵` — dạng Phồn thể / đầy đủ (`11` nét: khung trên + `囗` chứa 4 nét chấm tinh thể muối bên trong). Trong Phồn thể, `鹵` xuất hiện rất rõ trong các chữ lõi về muối và vị mặn như `鹽` (muối), `鹹` (mặn), `鹼` (kiềm), `滷` (nước kho/nước muối).
  - `卤` — dạng Giản thể (`7` nét: `卜` trên + `囗` chứa `㐅` + chấm bên trong). Trong tiếng Trung Giản thể hiện đại, `卤` hợp nhất luôn nghĩa của chữ `滷` (nước kho, món kho/ngâm nước tương gia vị như `卤肉, 卤味`), trong khi `鹽` → `盐`, `鹹` → `咸`, `鹼` → `碱` đều đã **chuyển sang bộ thủ khác**!
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **ruộng muối / mỏ muối hoặc chum đựng tinh thể muối mỏ** (bên trong khung chứa vẽ các hạt muối kết tinh lấm tấm); nghĩa gốc chỉ đất mặn chứa muối tự nhiên, muối thô, nước muối.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Muối khoáng, nước muối đậm đặc, nước kho thịt/món kho** (`卤味`, `卤蛋`), đồng thời mang trường nghĩa **vị mặn và hóa chất kiềm** (`盐, 咸, 碱` ở hệ Phồn thể).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Trong Giản thể, chữ `卤` đứng một mình thường gặp nhất trên thực đơn đồ ăn (`卤肉, 卤水, 卤鸭`). Trong văn bản Phồn thể, gặp `鹵` ở bên trái gần như chắc chắn liên quan đến muối, độ mặn hoặc chất kiềm.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Chuyển bộ hàng loạt khi Giản thể hóa:** Ở chữ Phồn thể, `鹽` (muối), `鹹` (mặn), `鹼` (kiềm) đều tra bộ **`鹵`**; nhưng sang Giản thể, `盐` xếp bộ **Mãnh `皿`** (chậu/bát đựng muối), `咸` xếp bộ **Khẩu `口`** (hợp nhất với chữ `咸`), `碱` xếp bộ **Thạch `石`** (khoáng chất/đá kiềm). Vì vậy người học Giản thể ít thấy `卤` trong các chữ thông dụng nhất về "muối/mặn".
    - **`卤` vs `鲁` (`lǔ`):** Cả hai cùng đọc `lǔ` và đều xuất hiện trong `卤莽 / 鲁莽` (lỗ mãng, thô bạo); trong ẩm thực, `卤味` là đồ kho/ngâm nước sốt mặn (`卤`), còn `鲁菜` là ẩm thực Sơn Đông (`鲁`).
    - **`卤` vs `占` / `古`:** `卤` có khung `囗` chứa dấu nhân và các chấm hạt muối bên trong, không nhầm với `占` (3+2 nét) hay `古`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Muối, nước muối & ẩm thực món kho

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                              |
| ------- | ------ | -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 卤 / 鹵 | lǔ     | Lỗ       | Độc thể (Bộ thủ chính; Phồn `鹵` / `滷`)         | [Tra bộ 鹵 / 卤] Tượng hình tinh thể muối trong mỏ/chậu → muối mỏ, nước muối đặc (đông đậu phụ), nước kho/món kho gia vị (hợp nhất Phồn thể `滷`); _từ ghép:_ 卤肉 (lǔròu: thịt kho), 卤味 (lǔwèi: món kho nguội), 卤蛋 (lǔdàn: trứng kho). |
| 盐 / 鹽 | yán    | Diêm     | Phồn: `臣 + 人 + 鹵 + 皿` / Giản: `土 + 卜 + 皿` | [Tra bộ 皿 (giản) · bộ 鹵 (phồn)] Phồn thể `鹽` gồm quan coi muối (`臣`), nước muối (`鹵`) và chậu phơi muối (`皿`); Giản thể `盐` giữ cấu trúc gọn với đáy `皿` → muối ăn; _từ ghép:_ 食盐 (shíyán: muối ăn), 盐水 (yánshuǐ: nước muối).   |
| 鹺 / 鹾 | cuó    | Sa / Tha | 卤/鹵 + 差 (`chā/cuó`, thanh phù)                | [Tra bộ 鹵 / 卤] Hình thanh: muối mỏ tự nhiên, nước muối hoặc việc thu thuế muối thời xưa (từ văn ngôn/lịch sử); _từ ghép:_ 鹺务 (cuówù: việc muối/chế muối xưa), 盐鹺 (yáncuó: muối ăn nói chung).                                         |

### Nhóm B: Vị mặn, chất kiềm & biến đổi bộ khi giản thể hóa

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                   |
| ------- | ------ | -------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 咸 / 鹹 | xián   | Hàm      | Phồn: `鹵` + `咸` (`xián`, thanh phù) / Giản: hợp nhất thành `咸` | [Tra bộ 口 (giản) · bộ 鹵 (phồn)] Vị mặn của muối (`鹹`); khi giản thể hóa đã mượn chữ đồng âm `咸` (bộ Khẩu `口`) dùng chung → vị mặn; _từ ghép:_ 咸菜 (xiáncài: dưa muối mặn), 咸淡 (xiándàn: mặn nhạt), 咸鸭蛋 (xián yādàn: trứng vịt muối).  |
| 碱 / 鹼 | jiǎn   | Kiềm     | Phồn: `鹵` + `僉` / Giản: `石` + `咸`                             | [Tra bộ 石 (giản) · bộ 鹵 (phồn)] Chất muối kiềm tách từ đất mặn/khoáng đá → kiềm, bazơ (hóa học), sô-đa/bột nở làm bánh; Giản thể đổi `鹵` sang `石` (khoáng chất); _từ ghép:_ 碱性 (jiǎnxìng: tính kiềm), 碱水 (jiǎnshuǐ: nước tro/nước kiềm). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-227`):** `卤 / 滷`, `鹽 / 盐`, `鹹 / 咸` (các chữ lõi về muối/mặn giữa hai hệ chữ), cùng hai bộ riêng có liên quan chặt chẽ là `皿` (chậu phơi/đựng muối trong `盐`) và `水 / 氵` (nước muối trong `滷`).
- **Chữ liên quan hoặc từng thuộc `鹵` nhưng xếp ở bộ khác trong tiếng Trung hiện đại:**
  - `盐` (`yán`, Diêm — tra bộ **Mãnh `皿`**): muối (thay cho `鹽` thuộc `鹵`).
  - `咸` (`xián`, Hàm — tra bộ **Khẩu `口`**): vị mặn (thay cho `鹹` thuộc `鹵`).
  - `碱` (`jiǎn`, Kiềm — tra bộ **Thạch `石`**): kiềm, xút (thay cho `鹼` thuộc `鹵`).
  - `卤莽` (`lǔmǎng`, Lỗ mãng): biến thể viết của `鲁莽`, dùng `卤` làm phần âm `lǔ`.

---

## Bộ 198: 鹿 (Lộc)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-228` · `radical_index`: `228` · `radical`: `"鹿"` · `strokes`: `11` nét · `name_vi`: `bộ Lộc` · **Khang Hy:** `#198` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `鹿` — dạng chính duy nhất (`11` nét: `丶 一 丿 𠃍 丨 丨 一 一 乚 丿 乚`), dùng thống nhất ở cả Giản thể và Phồn thể. Trong chữ ghép, `鹿` thường đứng ở **bên trên** (như `麓, 麈, 麇`), **góc trên-trái** (như `麒, 麟, 麋, 麂, 麝`), hoặc biến đổi mạnh khi giản thể hóa ở một số chữ cổ (như `麗 → 丽`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **con hươu / con nai** đứng nghiêng: phần trên gợi cặp sừng và đầu vươn cao, phần giữa là thân, hai nét `比` ở dưới là bốn chân thon chạy nhanh.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **loài hươu, nai, thú ăn cỏ có sừng ở rừng núi** (`麋, 麂, 麝`), mở rộng sang **thần thú hình hươu** (`麒麟`), **chân núi rừng rậm nơi hươu sống** (`麓`), và trong văn hóa dân gian Hán Việt/Trung Hoa thường gắn biểu tượng may mắn qua đồng âm với `禄` (bổng lộc).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `鹿` thường chỉ các loài thuộc họ hươu nai, thú rừng có sừng, hoặc địa hình chân núi rừng (`麓`), hương liệu tự nhiên lấy từ hươu (`麝`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`鹿` (Lộc — con hươu) vs `禄` (Lộc — bổng lộc, phúc lộc):** `禄` dùng bộ **Thị `礻`** (liên quan tế lễ/ban phúc) + `录`, KHÔNG chứa bộ `鹿`. Hai chữ chỉ đồng âm `lù` nên tranh dân gian hay vẽ con hươu để chúc "phúc lộc".
    - **`鹿` vs `广` (bộ Nghiễm) & `麻` (bộ Ma):** Phần đầu mái `广` của `鹿` trông giống bộ `广`, nhưng bên trong `鹿` là khung ngang gập hai sổ + `比` ở đáy (`11` nét), không phải hai chữ `木` như `麻` (`广 + 林`).
    - **`麟` trong `麒麟` ("kỳ lân"):** Dùng bộ `鹿` vì truyền thuyết cổ xếp kỳ lân vào nhóm thần thú hình giống hươu/nai có sừng và vảy.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Hươu, nai & các loài thú rừng họ hươu

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                       |
| ------- | ------ | -------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鹿      | lù     | Lộc      | Độc thể (Bộ thủ chính)     | [Tra bộ 鹿] Tượng hình con hươu có sừng và chân thon → con hươu, con nai; _từ ghép:_ 梅花鹿 (méihuālù: hươu sao), 长颈鹿 (chángjǐnglù: hươu cao cổ), 指鹿为马 (zhǐlù-wéimǎ: chỉ hươu nói ngựa — đổi trắng thay đen). |
| 麋      | mí     | Mi       | 鹿 + 米 (`mǐ`, thanh phù)  | [Tra bộ 鹿] Hình thanh: loài nai lớn sừng phân nhánh (còn gọi "tứ bất tượng" trong văn hóa Trung Hoa), tuần lộc/nai nước; _từ ghép:_ 麋鹿 (mílù: tuần lộc/nai Père David).                                           |
| 麂      | jǐ     | Kỷ       | 鹿 + 几 (`jǐ`, thanh phù)  | [Tra bộ 鹿] Hình thanh: loài hoẵng / mang nhỏ sống ở rừng núi phía nam, da rất mềm; _từ ghép:_ 麂子 (jǐzi: con hoẵng/con mang), 麂皮 (jǐpí: da lộn).                                                                 |
| 麝      | shè    | Xạ       | 鹿 + 射 (`shè`, thanh phù) | [Tra bộ 鹿] Hình thanh: hươu xạ (loài hươu nhỏ không sừng nhưng có tuyến xạ hương ở bụng); _từ ghép:_ 麝香 (shèxiāng: xạ hương), 麝牛 (shèniú: bò xạ).                                                               |

### Nhóm B: Thần thú, địa hình rừng núi & thú hiếm cổ văn

| Chữ Hán | Pinyin    | Hán Việt | Thiên bàng đứng chung                                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| ------- | --------- | -------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 麒      | qí        | Kỳ       | 鹿 + 其 (`qí`, thanh phù)                            | [Tra bộ 鹿] Hình thanh: thần thú kỳ lân (theo thuyết cổ `麒` là con đực, `麟` là con cái), tượng trưng điềm lành thái bình; _từ ghép:_ 麒麟 (qílín: kỳ lân).                                        |
| 麟      | lín       | Lân      | 鹿 + 粦 (`lín`, thanh phù)                           | [Tra bộ 鹿] Hình thanh: kỳ lân, loài vật cực quý hiếm → người tài đức hiếm có; _từ ghép:_ 麒麟 (qílín: kỳ lân), 凤毛麟角 (fèngmáo-línjiǎo: lông phượng sừng lân — cực kỳ hiếm quý).                 |
| 麓      | lù        | Lộc      | 林 (rừng) + 鹿 (`lù`, thanh phù kiêm ý rừng có hươu) | [Tra bộ 鹿] Hình thanh kiêm hội ý: vùng rừng cây dưới chân núi nơi hươu nai trú ngụ → chân núi; _từ ghép:_ 山麓 (shānlù: chân núi), 岳麓山 (Yuèlù Shān: núi Nhạc Lộc).                              |
| 麈      | zhǔ       | Chủ      | 鹿 + 主 (`zhǔ`, thanh phù kiêm ý loài dẫn đầu đàn)   | [Tra bộ 鹿] Hình thanh: loài nai lớn dẫn đàn thời cổ, đuôi dùng làm cây phất trần của danh sĩ khi đàm đạo; _từ ghép:_ 麈尾 (zhǔwěi: phất trần đuôi hươu), 挥麈 (huīzhǔ: vung phất trần bàn chuyện). |
| 麇      | jūn / qún | Quân     | 鹿 + 禾 (`hé`, thanh phù cổ)                         | [Tra bộ 鹿] Hình thanh: loài hoẵng/cheo nhỏ (`jūn`); đọc `qún` nghĩa là tụ tập thành bầy (`麇集` kéo đến tụ tập đông đúc).                                                                          |

### Nhóm C: Chữ có nguồn gốc từ `鹿` nhưng biến đổi/xếp bộ khác

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung                           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                     |
| ------- | ------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 丽 / 麗 | lì / lí | Lệ       | Phồn: đôi sừng đối xứng + `鹿` / Giản: lược gọn | [Tra bộ 一 (giản) · bộ 鹿 (phồn)] Phồn thể `麗` vẽ cặp sừng hươu cân xứng đẹp đẽ trên chữ `鹿` → đẹp đẽ, rực rỡ (`lì`), hoặc Cao Câu Ly (`lí`); Giản thể lược thành `丽`; _từ ghép:_ 美丽 (měilì: xinh đẹp), 华丽 (huálì: hoa lệ). |
| 尘 / 塵 | chén    | Trần     | Phồn: `鹿` + `土` / Giản: `小` + `土`           | [Tra bộ 土] Hội ý: Phồn thể vẽ đàn hươu (`鹿`) chạy trên đất (`土`) làm bụi bay mù mịt; Giản thể đổi `鹿` thành `小` (hạt nhỏ) → bụi bặm, trần thế; _từ ghép:_ 灰尘 (huīchén: bụi bặm), 尘埃 (chén'āi: bụi trần).                  |
| 麤 / 粗 | cū      | Thô      | Ba con `鹿` (Phồn cổ `麤`) / `米` + `且` (`粗`) | [Tra bộ 米 (`粗`) · bộ 鹿 (`麤`)] Cổ tự `麤` gồm ba con hươu chạy vượt xa → thô sơ, thô ráp, bất cẩn; nay chữ tiêu chuẩn dùng `粗`; _từ ghép:_ 粗心 (cūxīn: bất cẩn), 粗鲁 (cūlǔ: thô lỗ).                                         |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-228`):** `鹿`, `麟`, `麓`, `麝` (các chữ chính thuộc bộ `鹿`), cùng `广` (chỉ giống nét đầu phía trên ở một số chữ) và `犭` (bộ Khuyển — dùng cho nhiều thú bốn chân khác như `狗, 猫, 狼`).
- **Chữ chứa `鹿` ở vị trí phụ hoặc biến đổi ở giản thể:**
  - `塵` (`chén`, Trần — `鹿 + 土`, tra bộ **Thổ `土`**): dạng Phồn thể của `尘` (bụi bặm).
  - `麗` (`lì`, Lệ — tra bộ **Lộc `鹿`** ở Phồn thể; Giản thể `丽` chuyển sang bộ **Nhất `一`**): xinh đẹp (`美丽`).
  - `庆 / 慶` (`qìng`, Khánh — tra bộ **Nghiễm `广`** [giản] / **Tâm `心`** [phồn]): Phồn thể `慶` có phần đầu lược giống `鹿` (`庆` viết gọn trong `广 + 大`) + `心` + `夂`, nghĩa gốc là mang da hươu đến chúc mừng (`庆祝` chúc mừng, `国庆` quốc khánh).
  - `荐 / 薦` (`jiàn`, Tiến — tra bộ **Thảo `艹`**): Phồn thể `薦` gồm `艹 + 廌` (`廌` là thần thú giống hươu một sừng, nay Giản thể rút gọn thành `存`), nghĩa là tiến cử, giới thiệu (`推荐`).
  - `漉` (`lù`, Lộc — `氵 + 鹿`, tra bộ **Thủy `氵`**): thấm dần, lọc khô nước (`湿漉漉` ướt sũng).

---

## Bộ 199: 麥 (Mạch)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-229` · `radical_index`: `229` · `radical`: `"麥 / 麦"` · `strokes`: `11` nét (chuẩn Khang Hy; Giản thể `麦` rút xuống `7` nét) · `name_vi`: `bộ Mạch` · **Khang Hy:** `#199` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `麥` — dạng Phồn thể / đầy đủ (`11` nét: `來` trên — cây lúa mì có hai bông rủ, + `夂` dưới — rễ hoặc bàn chân đi tới). Trong chữ ghép đứng bên trái thường có nét ngang đáy hơi hất hoặc kéo dài nâng chữ (`麵, 麩, 麴`).
  - `麦` — dạng Giản thể chuẩn (`7` nét: phần trên rút thành `龶` + phần dưới `夂`). Giản thể hóa cũng làm nhiều chữ rất thông dụng thuộc bộ `麥` trước đây chuyển sang chữ khác (như `麵` → `面`, `麴` → `曲`), còn `麸` giữ dạng `麦 + 夫`.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cây lúa mì / lúa mạch** mọc bông trĩu nặng ở trên và rễ/gốc ở dưới (`來` vốn là chữ tượng hình cây lúa mì trước khi bị giả tá thành nghĩa "đến", rồi thêm `夂` thành `麥`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **lúa mì, đại mạch, yến mạch, bột mì, cám mì, men ngũ cốc và thực phẩm chế biến từ bột mì** (`麦子, 面粉, 麸皮, 麦片`); trong phiên âm hiện đại còn dùng viết tắt/phiên âm tiếng Anh (`麦克风` micro, `麦当劳` McDonald's).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `麥 / 麦` thường liên quan đến cây lúa mì/mạch, sản phẩm từ bột mì, cám, hoặc làm phần thanh phù gợi âm `mài` (`唛`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`麥 / 麦` (lúa mì/mạch) vs `禾` (cây lúa nói chung) vs `米` (hạt gạo):** `禾` là cây lúa có hạt nói chung (`稻, 种, 秋`); `米` là hạt gạo đã xát vỏ (`米饭, 粉, 粮`); `麥 / 麦` chuyên về họ lúa mì/mạch và thực phẩm bột mì.
    - **`面` (trong `面条, 面包, 面粉`) vs `面` (bề mặt, khuôn mặt):** Trong tiếng Trung Phồn thể, hai chữ này tách biệt hoàn toàn: `麵` (thuộc bộ `麥`) là bột mì/mì sợi, còn `面` (bộ riêng `面`) là mặt/bề mặt. Sang Giản thể, cả hai gộp làm một mặt chữ `面` nên phải dựa vào ngữ cảnh để phân biệt.
    - **`麦` vs `表` (biểu):** Phần đầu `龶` + nét dưới gần giống nhau, nhưng `麦` đáy là bộ `夂` (`丿 ㇇ ㇏`), còn `表` đáy là phần `衣` lược (`丿 乚 丿 ㇏`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Lúa mì, bột mì, men ngũ cốc & thực phẩm từ mạch

| Chữ Hán | Pinyin | Hán Việt    | Thiên bàng đứng chung                                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                         |
| ------- | ------ | ----------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 麦 / 麥 | mài    | Mạch        | Độc thể (Bộ thủ chính)                                     | [Tra bộ 麥 / 麦] Tượng hình cây lúa mì → lúa mì, đại mạch, kiều mạch; _từ ghép:_ 小麦 (xiǎomài: lúa mì), 大麦 (dàmài: đại mạch), 麦片 (màipiàn: yến mạch/ngũ cốc cán), 麦克风 (màikèfēng: micrô).                      |
| 面 / 麵 | miàn   | Miến / Diện | Phồn: `麥` + `丏` (`miàn`, thanh phù) / Giản: gộp vào `面` | [Tra bộ 面 (giản) · bộ 麥 (phồn)] Hình thanh: bột xay từ lúa mì (`麥`) và các sợi mì làm từ bột mì; Giản thể dùng chung chữ `面`; _từ ghép:_ 面条 (miàntiáo: mì sợi), 面包 (miànbāo: bánh mì), 面粉 (miànfěn: bột mì). |
| 麸 / 麩 | fū     | Phu         | 麦/麥 + 夫 (`fū`, thanh phù)                               | [Tra bộ 麥 / 麦] Hình thanh: lớp vỏ cám tách ra khi xay hạt lúa mì → cám mì, gluten từ lúa mì; _từ ghép:_ 麸皮 (fūpí: cám lúa mì), 麸质 (fūzhì: gluten), 麦麸 (màifū: cám mạch).                                       |
| 曲 / 麴 | qū     | Khúc        | Phồn: `麥` + `匊` (`qū`, thanh phù) / Giản: gộp vào `曲`   | [Tra bộ 曰 / 丨 (giản) · bộ 麥 (phồn)] Men làm từ lúa mì/ngũ cốc lên men để ủ rượu, làm tương; Giản thể hợp nhất vào `曲`; _từ ghép:_ 酒曲 (jiǔqū: men rượu), 红曲 (hóngqū: men gạo đỏ).                               |
| 麹      | qū     | Khúc        | 麥 + 掬 tỉnh (`匊`, thanh phù)                             | [Tra bộ 麥] Dị thể thông dụng ở Nhật Bản và tài liệu chuyên ngành lên men cho chữ `麴` (men rượu, men tương); _từ ghép:_ 麹霉 (qūméi: nấm men Aspergillus).                                                            |
| 䴬      | qū     | Khúc        | 麦 + 曲 (`qū`, thanh phù)                                  | [Tra bộ 麦] Chữ chuẩn hóa trong Bảng chữ Hán quy phạm thông dụng (tầng 3) để viết riêng chữ `麴` (men rượu) trong tên riêng hoặc ngữ cảnh cần tránh nhầm với `曲` (cong/khúc nhạc).                                    |

### Nhóm B: Các giống mạch & từ cổ chỉ sản phẩm lúa mì

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                               |
| ------- | ------ | -------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 麰      | móu    | Mâu      | 麥 + 牟 (`móu`, thanh phù)                          | [Tra bộ 麥] Hình thanh: tên cổ của cây đại mạch (lúa mạch ủ bia/lương thực cổ); _từ ghép:_ 来麰 (láimóu: lúa mì và đại mạch — từ Kinh Thi).                                                  |
| 麳      | lái    | Lai      | 麥 + 來 (`lái`, thanh phù kiêm gốc hình cây lúa mì) | [Tra bộ 麥] Hình thanh cổ: chữ chuyên chỉ cây lúa mì sau khi chữ `來` bị mượn dùng cho nghĩa "đến"; _từ ghép:_ 麳麰 (láimóu: lúa mì và đại mạch).                                            |
| 麨      | chǎo   | Sao      | 麥 + 少 (`shǎo/chǎo`, thanh phù)                    | [Tra bộ 麥] Hình thanh cổ: hạt lúa mạch hoặc gạo rang chín rồi giã thành bột lương khô mang đi xa thời xưa (còn gọi `炒面`); _từ ghép:_ 糗麨 (qiǔchǎo: lương khô rang).                      |
| 麧      | hé     | Hột      | 麥 + 气 (`qì`, thanh phù cổ)                        | [Tra bộ 麥] Hình thanh: vỏ cám thô hoặc hạt lúa mạch giã dối làm thức ăn đạm bạc; _từ ghép:_ 糠麧 (kānghé: cám bã thô sơ).                                                                   |
| 麷      | fēng   | Phong    | 麥 + 豐 (`fēng`, thanh phù kiêm ý đầy đặn)          | [Tra bộ 麥] Hình thanh cổ: lúa mạch nấu chín mềm hoặc rang phồng thơm đầy (Thuyết Văn giải tự chú giải: "煮麦也" — lúa mì nấu chín); ngày nay rất hiếm dùng ngoài văn bản cổ và chữ tự điển. |

### Nhóm C: Chữ hiện đại dùng `麦` làm thành phần âm ở bộ khác

| Chữ Hán | Pinyin | Hán Việt   | Thiên bàng đứng chung                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                          |
| ------- | ------ | ---------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 唛 / 嘜 | mài    | Mạch / Mắc | 口 (miệng) + 麦/麥 (`mài`, thanh phù) | [Tra bộ 口] Hình thanh cận đại (phát âm từ tiếng Anh _mark_): ký hiệu, mã nhãn hiệu đóng trên kiện hàng xuất nhập khẩu; _từ ghép:_ 唛头 (màitóu: ký mã hiệu kiện hàng / shipping mark). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-229`):** `麦`, `麵 / 面`, `麸`, cùng hai bộ ngũ cốc độc lập là `禾` (cây lúa nói chung) và `米` (hạt gạo).
- **Chữ liên quan trường nghĩa lúa mì hoặc có yếu tố `麥 / 麦` xếp ở bộ khác:**
  - `面` (`miàn`, Diện/Miến — tra bộ **Diện `面`**): trong Giản thể thay thế luôn cho `麵` (bột mì, mì sợi).
  - `曲` (`qū`, Khúc — tra bộ **Viết `曰`**): trong Giản thể thay thế luôn cho `麴` (men rượu từ lúa mạch).
  - `来 / 來` (`lái`, Lai — tra bộ **Mộc `木` / Nhân `人`**): hình gốc chính là cây lúa mì (`來`), về sau được giả tá sang nghĩa "đến, tới".
  - `荞` (`qiáo`, Kiều — `艹 + 乔`, tra bộ **Thảo `艹`**): xuất hiện trong từ ghép quen thuộc `荞麦` (kiều mạch / tam giác mạch).
  - `燕麦` (`yànmài`, yến mạch) và `大麦` (`dàmài`, đại mạch): các cụm danh từ thực phẩm quen thuộc dùng `麦` làm danh tố chính ở cuối.

---

## Bộ 200: 麻 (Ma)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-230` · `radical_index`: `230` · `radical`: `"麻"` · `strokes`: `11` nét · `name_vi`: `bộ Ma` · **Khang Hy:** `#200` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `麻` — dạng chính duy nhất (`11` nét: `广` bao góc trên-trái + `林` gồm hai chữ `木` bên trong), thống nhất giữa Giản thể và Phồn thể. Trong chữ ghép, `麻` thường đóng vai trò **khung bao trên-trái** chứa một thành phần khác bên dưới (như `磨, 魔, 摩, 靡, 麾, 糜, 麼`), hoặc làm **thành phần bên phải** biểu âm `ma / mo` (như `嘛, 嬷`), hoặc nằm **bên dưới** (`蘑`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý: dưới mái nhà (`广`) treo bó thân cây gai tách vỏ (`林` biến thể từ hai bó sợi gai `𣏟`) để tước sợi dệt vải.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Nghĩa gốc là **cây gai, sợi gai, hạt mè/vừng** (`芝麻`), mở rộng sang:
    1. **Cảm giác tê dại, râm ran, rối rắm** (`麻木` tê liệt, `麻醉` gây mê, `麻辣` cay tê);
    2. **Phiền phức, lôi thôi, vướng mắc** (`麻烦` phiền phức);
    3. **Linh kiện biểu âm `mó / mā / mǐ`** trong rất nhiều chữ hiện đại thuộc các bộ thủ khác (`磨, 魔, 摩, 蘑, 嘛`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Thấy khối `麻` thường có 2 hướng đoán nghĩa/âm: (a) liên quan đến cây gai, sợi đan, cảm giác tê/rối; (b) đóng vai trò **thanh phù đọc `mó / ma`** kết hợp với bộ thủ thật bên dưới/bên trái (`石` → mài `磨`, `鬼` → ma quỷ `魔`, `手` → xoa `摩`, `艹` → nấm `蘑`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`麻` (bộ Ma, 11 nét) vs `广` (bộ Nghiễm, 3 nét):** `广` chỉ là mái hiên bên ngoài, bên trong chữ `麻` có thêm `林` (hai cây `木` — gợi bó gai). Khi gặp chữ có `麻` ôm góc trên-trái như `魔, 磨, 摩`, phần lớn chúng thuộc **bộ thủ ở thành phần bên dưới** (`鬼, 石, 手`), không xếp vào bộ `麻`!
    - **`麻` vs `林` (rừng cây):** Không giải thích máy móc `麻` là "rừng cây dưới mái nhà", vì phần bên trong `麻` vốn là hình bó sợi gai phơi khô bị quy đồng nét giống `林`.
    - **`麻辣` (`málà`):** Trong ẩm thực Trung Quốc (đặc biệt món Tứ Xuyên), `麻` chỉ vị **tê đầu lưỡi của hoa tiêu**, còn `辣` là vị **cay xé của ớt**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cây gai, tê dại, phiền phức & chữ thuộc bộ `麻` cổ-kim

| Chữ Hán | Pinyin        | Hán Việt | Thiên bàng đứng chung                                                    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                 |
| ------- | ------------- | -------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 麻      | má            | Ma       | Độc thể (Bộ thủ chính)                                                   | [Tra bộ 麻] Hội ý: bó sợi gai phơi dưới mái nhà → cây gai, vừng mè, tê dại, rỗ mặt, phiền toái; _từ ghép:_ 麻烦 (máfan: phiền phức), 麻木 (mámù: tê dại), 麻辣 (málà: cay tê), 芝麻 (zhīma: hạt vừng/mè).                                      |
| 麾      | huī           | Huy      | 麻 + 毛 (lông/cờ đuôi mao)                                               | [Tra bộ 麻] Cờ hiệu làm bằng tua vải gai hoặc lông đuôi trâu thời cổ dùng chỉ huy quân đội → cờ hiệu, chỉ huy, điều động; _từ ghép:_ 麾下 (huīxià: dưới trướng), 挥麾 (huīhuī: vẫy cờ chỉ huy).                                                |
| 么 / 麼 | me / mó / yāo | Ma / Yêu | Phồn: `麻` + `幺` (`yāo`, thanh phù) / Giản: lược còn `幺` trên nét phẩy | [Tra bộ 丿 (`么`) · bộ 麻 (`麼`)] Phồn thể `麼` nghĩa gốc là nhỏ nhặt (`幺`), nay dùng chủ yếu làm trợ từ nghi vấn/từ ghép; Giản thể thống nhất viết gọn `么`; _từ ghép:_ 什么 (shénme: cái gì), 这么 (zhème: thế này), 怎么 (zěnme: thế nào). |
| 靡      | mí / mǐ       | Mĩ / Mi  | 麻 + 非 (`fēi`, thanh phù kiêm ý rạp xuống)                              | [Tra bộ 非] Hình thanh: cỏ rạp theo gió → ngả rạp, tan tác, xa hoa phung phí (`mí`); không có, nhỏ bé (`mǐ`); _từ ghép:_ 奢靡 (shēmí: xa hoa lãng phí), 萎靡 (wěimǐ: ủ rũ suy sụp), 所向披靡 (suǒxiàng-pīmǐ: đánh đâu thắng đó).               |

### Nhóm B: Thành phần `麻` trong chữ hành động, vật lý & siêu nhiên

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                        |
| ------- | ------- | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 磨      | mó / mò | Ma       | 麻 (`mó`, thanh phù) + 石 (đá)  | [Tra bộ 石] Hình thanh: dùng đá (`石`) chà xát mài giũa → mài, nghiền nát, rèn luyện, trì hoãn (`mó`); cối xay đá (`mò`); _từ ghép:_ 磨练 (móliàn: rèn giũa), 折磨 (zhémó: giày vò), 石磨 (shímò: cối đá).            |
| 魔      | mó      | Ma       | 麻 (`mó`, thanh phù) + 鬼 (quỷ) | [Tra bộ 鬼] Hình thanh: ma quỷ (`鬼`) phiên âm Phạn _Māra_ → ma vương, ma thuật, mê hoặc, kỳ tài; _từ ghép:_ 魔鬼 (móguǐ: ma quỷ), 魔法 (mófǎ: phép thuật), 魔方 (mófāng: khối Rubik).                                |
| 摩      | mó / mā | Ma       | 麻 (`mó`, thanh phù) + 手 (tay) | [Tra bộ 手] Hình thanh: dùng tay (`手`) xoa nhẹ, cọ xát → xoa bóp, tiếp xúc, phỏng theo (`mó`); vuốt phẳng (`mā`); _từ ghép:_ 按摩 (ànmó: mát-xa/xoa bóp), 摩擦 (mócā: ma sát), 摩托车 (mótuōchē: xe máy — phiên âm). |

### Nhóm C: Thành phần `麻` trong thực phẩm, xưng hô & khẩu ngữ hiện đại

| Chữ Hán | Pinyin   | Hán Việt | Thiên bàng đứng chung                            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                          |
| ------- | -------- | -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 蘑      | mó       | Ma       | 艹 (cỏ/nấm) + 麻 (`mó`, thanh phù kiêm gợi `磨`) | [Tra bộ 艸 / 艹] Hình thanh: loại thực vật/nấm mọc mũ tròn (`艹`) → cây nấm; _từ ghép:_ 蘑菇 (mógu: nấm ăn / lề mề chần chừ trong khẩu ngữ).                                                            |
| 糜      | mí / méi | Mi       | 麻 (`mí`, thanh phù) + 米 (gạo)                  | [Tra bộ 米] Hình thanh: gạo (`米`) nấu nhừ như hồ → cháo loãng, nát vụn, thối rữa (`mí`); loài kê (`méi`); _từ ghép:_ 糜烂 (mílàn: thối rữa, suy đồi).                                                  |
| 嬷 / 嬤 | mó       | Ma       | 女 (phụ nữ) + 麻 (`mó`, thanh phù)               | [Tra bộ 女] Hình thanh: cách gọi bà vú nuôi, bà lão hoặc mẹ trong phương ngữ/tiểu thuyết cổ; _từ ghép:_ 嬷嬷 (mómo: vú em/nhũ mẫu thời xưa).                                                            |
| 嘛      | ma / má  | Ma       | 口 (miệng) + 麻 (`má`, thanh phù)                | [Tra bộ 口] Hình thanh: trợ từ ngữ khí đặt cuối câu nhấn mạnh sự hiển nhiên (`ma`), hoặc từ nghi vấn "gì" trong phương ngữ miền Bắc (`má`); _từ ghép:_ 干嘛 (gànmá: làm gì thế), 好嘛 (hǎoma: được mà). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-230`):** `麻`, `麻烦`, `麻木`, `魔` (`鬼`), `磨` (`石`), cùng `广` (bộ riêng tạo nên phần mái phía trên của `麻`).
- **Tóm tắt nhóm chữ mang `麻` ở trên/trái/dưới nhưng xếp ở bộ khác:**
  - `磨` (`mó/mò`, bộ **Thạch `石`**): mài, cối đá (`磨刀`, `磨蹭`).
  - `魔` (`mó`, bộ **Quỷ `鬼`**): ma quỷ, phép màu (`魔术`, `恶魔`).
  - `摩` (`mó/mā`, bộ **Thủ `手`**): xoa bóp, cọ xát (`揣摩`, `摩天大楼`).
  - `蘑` (`mó`, bộ **Thảo `艹`**): nấm (`蘑菇`).
  - `糜` (`mí`, bộ **Mễ `米`**): cháo nát, thối nát (`糜烂`, `糜费`).
  - `靡` (`mí/mǐ`, bộ **Phi `非`**): xa hoa, ngã rạp (`风靡`, `奢靡`).
  - `嘛` (`ma/má`, bộ **Khẩu `口`**): trợ từ ngữ khí cuối câu (`对嘛`, `干嘛`).
  - `嬷 / 嬤` (`mó`, bộ **Nữ `女`**): nhũ mẫu (`嬷嬷`).

---

## Bộ 201: 黃 (Hoàng)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-077` · `radical_index`: `77` · `radical`: `"黃 / 黄"` · `strokes`: `12` nét (chuẩn Khang Hy; Giản thể / chữ hiện đại `黄` rút xuống `11` nét) · `name_vi`: `bộ Hoàng` · **Khang Hy:** `#201`.
- **Ghi chú dòng trùng / rỗng:** Trong DB hiện có **1 dòng rỗng phụ** là `radical-231` (`radical_index`: `231`, `radical`: `"黃 / 黄"`, `name_vi: null`, `strokes: null`) ở cụm cuối 12 nét. Cần dọn/xóa mềm dòng `radical-231` khi chuẩn hóa DB, giữ dòng chính `radical-077`.
- **Hình thái & Biến thể (`variants`):**
  - `黃` — dạng truyền thống chuẩn Khang Hy (`12` nét: đầu viết nét ngang có hai gạch sổ xuyên thành phần `廿` ở giữa, dưới là `由 + 八`).
  - `黄` — dạng Giản thể và chuẩn chữ hiện đại (`11` nét: rút gọn phần đầu thành bộ `艹`-dạng `共` trên, cụ thể là viết ngang dài rồi hai sổ cắt ngang liền mạch, rồi mới đến `由 + 八` → `一 丨 丨 一 丨 𠃍 一 丨 一 丿 丶`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **ngọc bội hình bán nguyệt đeo trước ngực** (giáp cốt văn vẽ hình người đeo miếng ngọc bội sáng rực; nghĩa cổ gắn với ánh vàng rực của đất Hoàng Thổ và kim loại quý).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **màu vàng, sắc hoàng thổ, vàng ròng, họ Hoàng** (`黄色, 黄河, 黄金`); trong khẩu ngữ hiện đại còn mang nghĩa mở rộng **"hỏng việc / thất bại / vỡ kế hoạch"** (`黄了`) hoặc **"nội dung đồi trụy / người lớn"** (`扫黄`, `黄片` — bắt nguồn từ khái niệm báo chí giật gân _yellow journalism_), cần hiểu đúng theo ngữ cảnh.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Trong chữ ghép hiện đại, `黄` gần như chỉ xuất hiện với tư cách **thành phần thanh phù đọc `huáng / héng`** (`横, 簧, 潢, 磺`), ít khi trực tiếp làm bộ tra cứu cho chữ thông dụng ngoài chính chữ `黄` và `黉`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`黄` (màu vàng) vs `金` (kim loại / vàng ròng / tiền bạc):** `黄` thiên về **màu sắc vàng**; `金` là kim loại, tiền tệ và kim loại vàng (`黄金` kết hợp cả hai: kim loại có màu vàng → vàng ròng).
    - **Ngữ cảnh đặc biệt của `黄色` và `黄了`:** `黄色` bình thường nghĩa là "màu vàng", nhưng trong ngữ cảnh truyền thông/pháp luật có nghĩa "đồi trụy/khiêu dâm" (`黄色笑话`, `扫黄`); còn động từ `黄了` trong khẩu ngữ nghĩa là "hỏng bét, tan vỡ rồi" (ví dụ: hợp đồng/cuộc hẹn bị hủy).
    - **`黄` (11 nét) vs `寅` (11 nét, địa chi Dần) / `共`:** Phần đầu `黄` gần với `共` nhưng giữa có `由`, không phải `共` (`艹` + `一` + `八`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Màu vàng, hoàng thổ & chữ chính thức thuộc bộ `黃`

| Chữ Hán | Pinyin | Hán Việt      | Thiên bàng đứng chung                        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                    |
| ------- | ------ | ------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 黄 / 黃 | huáng  | Hoàng         | Độc thể (Bộ thủ chính)                       | [Tra bộ 黃 / 黄] Màu vàng, hoàng thổ, vàng, họ Hoàng; khẩu ngữ: hỏng/bể kèo; _từ ghép:_ 黄色 (huángsè: màu vàng / đồi trụy theo ngữ cảnh), 黄金 (huángjīn: vàng ròng), 黄河 (Huánghé: sông Hoàng Hà), 黄昏 (huánghūn: hoàng hôn). |
| 黉 / 黌 | hóng   | Huỳnh / Hoành | Phồn: `學` đầu + `黃` / Giản: `⺌ + 冖 + 黄` | [Tra bộ 黃 (Khang Hy) / 小 đầu hoặc 黄 (Tân Hoa)] Học cung, trường học thời cổ đại (tương truyền tường trường học xưa quét màu vàng son); _từ ghép:_ 黉门 (hóngmén: cửa Khổng sân Trình / trường học xưa).                        |

### Nhóm B: Chữ thông dụng dùng `黄 / 黃` làm thành phần biểu âm

| Chữ Hán | Pinyin      | Hán Việt | Thiên bàng đứng chung                                    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                       |
| ------- | ----------- | -------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 横 / 橫 | héng / hèng | Hoành    | 木 (gỗ) + 黄/黃 (`huáng`, thanh phù)                     | [Tra bộ 木] Hình thanh: thanh gỗ (`木`) đặt chắn ngang → nằm ngang, chiều ngang, băng qua (`héng`); ngang ngược, bất ngờ (`hèng`); _từ ghép:_ 横线 (héngxiàn: đường ngang), 人行横道 (rénxíng héngdào: vạch qua đường), 蛮横 (mánhèng: ngang ngược). |
| 簧      | huáng       | Hoàng    | ⺮ (trúc) + 黄 (`huáng`, thanh phù)                      | [Tra bộ 竹 / ⺮] Hình thanh: lưỡi gà bằng thanh tre/đồng mỏng rung tạo tiếng trong khèn sáo, lò xo; _từ ghép:_ 弹簧 (tánhuáng: lò xo), 双簧 (shuānghuáng: diễn nhị tấu/song tấu).                                                                    |
| 潢      | huáng       | Hoàng    | 氵 (nước) + 黄 (`huáng`, thanh phù)                      | [Tra bộ 水 / 氵] Hình thanh: hồ nước tù đọng; nhuộm giấy màu vàng chống mọt rồi bồi tranh → trang trí nội thất, đóng bồi tranh sách; _từ ghép:_ 装潢 (zhuānghuáng: trang hoàng/trang trí).                                                           |
| 磺      | huáng       | Hoàng    | 石 (đá/khoáng) + 黄 (`huáng`, thanh phù kiêm ý màu vàng) | [Tra bộ 石] Hình thanh kiêm hội ý: khoáng chất (`石`) màu vàng (`黄`) → lưu huỳnh; _từ ghép:_ 硫磺 (liúhuáng: lưu huỳnh), 磺胺 (huáng'àn: thuốc sulfonamide).                                                                                        |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-077`):** `横`, `簧`, `潢` (các chữ dùng `黄` làm thanh phù), cùng hai bộ riêng có liên hệ ngữ nghĩa là `金` (kim loại vàng) và `土` (hoàng thổ/đất).
- **Chữ chứa `黃 / 黄` khác xếp ở bộ khác:**
  - `广 / 廣` (`guǎng`, Quảng — Phồn thể `廣` gồm `广 + 黃`, tra bộ **Nghiễm `广`**): rộng lớn, phổ biến (`广场`, `广告`, `广州`). Giản thể `广` bỏ hoàn toàn `黃` bên trong.
  - `蟥` (`huáng`, Hoàng — `虫 + 黄`, tra bộ **Trùng `虫`**): con đỉa (`蚂蟥`).
  - `癀` (`huáng`, Hoàng — `疒 + 黄`, tra bộ **Nạch `疒`**): bệnh vàng da ở gia súc, hoặc tên vị thuốc cổ truyền (`片仔癀`).
  - `媖` không liên quan; còn `横`, `簧`, `潢`, `磺` là 4 chữ tần suất cao nhất mang `黄` làm thanh phù trong tiếng Trung hiện đại.

---

## Bộ 202: 黍 (Thử)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-232` · `radical_index`: `232` · `radical`: `"黍"` · `strokes`: `12` nét · `name_vi`: `bộ Thử` · **Khang Hy:** `#202` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `黍` — dạng chính duy nhất (`12` nét: `禾` trên + `入` + `氺` dưới), thống nhất giữa Giản thể và Phồn thể. Lưu ý trong chữ `黎`, phần `黍` bị viết tỉnh lược (thay `禾` bằng `𠂊 + 勿` rồi đến `氺` ở đáy).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý: phía trên là cây ngũ cốc (`禾`), phía dưới là hình giọt nước (`水/氺`) và hơi rủ xuống — tượng trưng **cây kê nếp** (loại lương thực hạt dẻo cực quan trọng ở lưu vực Hoàng Hà cổ đại, dùng nấu cơm và ủ rượu).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bộ hiếm; ngày nay chủ yếu gặp trong **ngữ văn/lịch sử chỉ cây kê** (`黍子`), trong tính từ **"dính, nhớt"** (`黏` — lấy hình ảnh độ dẻo dính của kê nếp), và trong chữ cực thông dụng **`黎`** (`黎明` bình minh, `黎民` dân chúng).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Gặp `黍` có thể gợi ngay đến ngũ cốc/kê nếp cổ, hoặc **tính chất dẻo dính** (`黏`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Bộ 202 `黍` (Thử — kê nếp, 12 nét) vs Bộ 208 `鼠` (Thử — con chuột, 13 nét):** Hai bộ có âm Hán-Việt giống hệt nhau là **"Thử"**, nhưng nghĩa và hình hoàn toàn khác biệt (`黍` = cây kê, dưới có `氺`; `鼠` = con chuột, trên có `臼` hình đầu chuột).
    - **`黏` (`nián`, bộ `黍`) vs `粘` (`nián / zhān`, bộ `米`):** Ở Trung Quốc đại lục hiện nay, hai chữ này thường có sự phân công tinh tế: `黏` thiên về tính từ/danh từ ("dính, độ nhớt" như `黏土, 黏性, 黏液`), còn `粘` thiên về động từ ("dán" như `粘贴` sao chép-dán, `粘信封` dán phong bì), tuy nhiên trong thực tế giao tiếp có nơi vẫn dùng `粘` thay `黏`.
    - **Không nhầm `黍` với `禾` hoặc `米`:** `禾` (5 nét) và `米` (6 nét) là các bộ ngũ cốc phổ thông; `黍` (12 nét) gồm `禾 + 人/入 + 氺` chuyên chỉ kê nếp.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cây kê nếp, lịch sử & dân chúng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                            |
| ------- | ------ | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 黍      | shǔ    | Thử      | Độc thể (Bộ thủ chính)       | [Tra bộ 黍] Hội ý: cây lương thực (`禾`) nấu dẻo có nước/nhựa (`氺`) → cây kê nếp; _từ ghép:_ 黍子 (shǔzi: cây kê nếp), 故宫禾黍 (gùgōng héshǔ: cảnh hoang tàn chốn kinh đô cũ).                                          |
| 黎      | lí     | Lê       | `黍` tỉnh (`𠂊 + 勿` + `氺`) | [Tra bộ 黍] Hình thanh/hội ý cổ: màu đen sẫm, nhiều, dân chúng đầu đen (Lê dân), lúc trời hửng sáng (hắc ám sắp tan → bình minh); họ Lê; _từ ghép:_ 黎明 (límíng: bình minh), 黎民百姓 (límín bǎixìng: lê dân bách tính). |

### Nhóm B: Tính chất kết dính từ hạt kê dẻo

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                           |
| ------- | ------ | -------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 黏      | nián   | Niêm     | 黍 (kê dẻo) + 占 (`zhān`, thanh phù) | [Tra bộ 黍] Hình thanh kiêm hội ý: dẻo dính như cơm kê nếp (`黍`) → dính, quánh, nhớt; _từ ghép:_ 黏液 (niányè: chất nhầy), 黏土 (niántǔ: đất sét), 黏性 (niánxìng: tính kết dính).                      |
| 黐      | chī    | Si / Ly  | 黍 + 离 (`lí`, thanh phù cổ)         | [Tra bộ 黍] Hình thanh cổ: chất nhựa keo bẫy chim, bám dính (nay hiếm dùng trong tiếng phổ thông, vẫn gặp trong tiếng Quảng Đông); _từ ghép:_ 黐线 (chīxiàn: điên rồ / chạm mạch — khẩu ngữ Quảng Đông). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-232`):** `黍`, `黏`, `黎`, cùng 3 bộ ngũ cốc độc lập gần nghĩa là `禾` (cây lúa), `米` (hạt gạo) và `麥 / 麦` (lúa mì).
- **Chữ chứa biến thể `黍` hoặc liên hệ gần nhưng xếp ở bộ khác:**
  - `粘` (`nián / zhān`, Niêm/Triêm — `米 + 占`, tra bộ **Mễ `米`**): động từ "dán, gắn kết" (`粘贴` dán, `胶粘` keo dán), cặp song sinh ngữ nghĩa với `黏` (`黏性`, `黏膜`).
  - `黧` (`lí`, Lê — phần trên `黎` tỉnh + dưới `黑`, tra bộ **Hắc `黑`**): màu đen ngăm, sạm đen (`面目黧黑` mặt mày sạm đen).
  - `漆` (`qī`, Tất — `氵 + 木/朩 + 人 + 氺`, tra bộ **Thủy `氵`**): cây sơn, nước sơn — phần bên phải là hình nhựa cây chảy giọt (`氺`), trông hơi giống phần dưới của `黍` nhưng không phải bộ `黍`.

---

## Bộ 203: 黑 (Hắc)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-073` · `radical_index`: `73` · `radical`: `"黑"` · `strokes`: `12` nét · `name_vi`: `bộ Hắc` · **Khang Hy:** `#203`.
- **Ghi chú dòng trùng / rỗng:** Trong DB hiện có **1 dòng rỗng phụ** là `radical-233` (`radical_index`: `233`, `radical`: `"黑"`, `name_vi: null`, `strokes: null`). Cần dọn dòng rỗng `radical-233` khi chuẩn hóa DB, giữ dòng chính `radical-073`.
- **Hình thái & Biến thể (`variants`):**
  - `黑` — dạng chính chuẩn (`12` nét: khung `口` có 2 chấm bên trong + 1 nét sổ giữa + 2 nét ngang + 4 chấm `灬` ở đáy). Dùng chung cho cả **Giản thể và Phồn thể** tiếng Trung!
  - _(Lưu ý dị thể Nhật Bản)_: Dạng `黒` (`11` nét, phần giữa gộp thành `里` không phải hai chấm tách hai bên sổ) là chữ **Tân tự thể (Shinjitai) của tiếng Nhật**, KHÔNG phải dạng Giản thể chuẩn của tiếng Trung hiện đại.
  - _(Lưu ý giản thể hóa chữ ghép)_: Dù bản thân `黑` giữ nguyên `12` nét, nhưng một số chữ rất thông dụng vốn thuộc bộ `黑` ở Phồn thể đã được giản thể hóa sang bộ khác (như `點` → `点` bộ `灬`, `黨` → `党` bộ `儿`, `黴` → `霉` bộ `雨`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **ống khói / bếp lò bị muội than hun đen** (phần trên là ống khói có bồ hóng bám hai bên, phần dưới `灬` là ngọn lửa tạo khói).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **màu đen, bóng tối, mực viết** (`黑色, 黑暗, 墨水`), mở rộng sang **âm u, buồn bã** (`黯然`), **im lặng không nói** (`沉默`), và nghĩa bóng **"bí mật, ngầm, phi pháp, xấu xa"** (`黑市` chợ đen, `黑心` lòng dạ độc ác, `黑客` hacker). Khi nói về màu da/chủng tộc, cần hiểu trung tính theo ngữ cảnh ngôn ngữ.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `黑` (ở bên trái hoặc phía dưới) thường liên quan đến màu đen, sắc tối, vết bẩn/mực, bóng tối, vẻ mặt sạm đen hoặc tính chất u ám, ngầm ẩn.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`黑` (12 nét) vs `里` (7 nét):** Phần thân trên của `黑` có hình gần `里`, nhưng `黑` có thêm 4 chấm hỏa `灬` dưới chân và hai nét chấm tách hai bên bên trong khung đầu (tổng 12 nét); `里` viết liền `曰 + 土` (7 nét).
    - **`墨` (`mò`, mực — `黑 + 土`) vs `默` (`mò`, im lặng — `黑 + 犬`):** Hai chữ cùng đọc `mò` nhưng `墨` chứa `土` (bộ Thổ — mực tàu luyện từ muội than và keo đất) chỉ **mực viết**, còn `默` chứa `犬` (bộ Hắc — chó núp trong bóng tối rình im lặng) chỉ **im lặng, thầm lặng**.
    - **`黑` nghĩa mở rộng "ngầm / phi pháp":** Trong `黑市` (chợ đen), `黑钱` (tiền bẩn), `黑心` (bất lương), `黑` mang nghĩa ẩn giấu/trái phép; không suy diễn tiêu cực về con người ngoài ngữ cảnh cụ thể.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Màu đen, bóng tối, mực & sự tĩnh lặng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                     |
| ------- | ------ | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 黑      | hēi    | Hắc      | Độc thể (Bộ thủ chính)         | [Tra bộ 黑] Tượng hình ống khói ám muội than → đen, tối tăm, bí mật, phi pháp; _từ ghép:_ 黑色 (hēisè: màu đen), 黑暗 (hēi'àn: hắc ám/tối tăm), 黑客 (hēikè: tin tặc), 黑板 (hēibǎn: bảng đen).                    |
| 墨      | mò     | Mặc      | 黑 (muội đen) + 土 (đất/khuôn) | [Tra bộ 土] Hội ý: muội than đen trộn keo đúc thành thỏi như đất cứng → mực tàu, màu đen, văn chương; _từ ghép:_ 墨水 (mòshuǐ: mực nước), 墨镜 (mòjìng: kính râm), 墨西哥 (Mòxīgē: Mexico).                        |
| 默      | mò     | Mặc      | 黑 (tối) + 犬 (chó)            | [Tra bộ 黑] Hội ý cổ: con chó trong bóng tối im phăng phắc chờ mồi → im lặng, thầm lặng, nhẩm thuộc lòng; _từ ghép:_ 沉默 (chénmò: trầm mặc/im lặng), 默默 (mòmò: âm thầm), 默认 (mòrèn: mặc định/ngầm thừa nhận). |
| 黯      | àn     | Ảm       | 黑 + 音 (`yīn`, thanh phù cổ)  | [Tra bộ 黑] Hình thanh: đen kịt, tối sầm, lòng buồn rầu u ám; _từ ghép:_ 黯淡 (àndàn: ảm đạm, mờ nhạt), 黯然神伤 (ànrán shénshāng: buồn bã ủ rũ).                                                                  |
| 黝      | yǒu    | Ưu / Ảnh | 黑 + 幼 (`yòu`, thanh phù)     | [Tra bộ 黑] Hình thanh: sắc đen xanh hoặc ngăm đen khỏe khoắn; _từ ghép:_ 黝黑 (yǒuhēi: đen sạm, ngăm đen).                                                                                                        |
| 黢      | qū     | Khuất    | 黑 + 夋 (`qūn/jùn`, thanh phù) | [Tra bộ 黑] Hình thanh: rất đen, đen kịt không thấy gì; _từ ghép:_ 黑黢黢 (hēiqūqū: đen ngòm, tối đen).                                                                                                            |

### Nhóm B: Trang điểm, sắc độ, địa danh & biến đổi Giản thể

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                                        |
| ------- | ------ | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 黛      | dài    | Đại      | 代 (`dài`, thanh phù) + 黑 (đen)               | [Tra bộ 黑] Hình thanh kiêm hội ý: bột khoáng màu xanh đen phụ nữ xưa dùng kẻ lông mày → mực kẻ mày, màu xanh đen thẫm; _từ ghép:_ 粉黛 (fěndài: phấn son, mỹ nhân), 青黛 (qīngdài: màu chàm đen / vị thuốc thanh đại).                                                               |
| 黔      | qián   | Kiềm     | 黑 + 今 (`jīn`, thanh phù cổ)                  | [Tra bộ 黑] Hình thanh: màu đen (cổ gọi dân thường quấn khăn đen là "Kiềm thủ"), tên gọi tắt của tỉnh Quý Châu (Trung Quốc); _từ ghép:_ 黔驴技穷 (Qiánlǘ jìqióng: lừa đất Kiềm hết phép — hết cách xoay xở).                                                                          |
| 黧      | lí     | Lê       | 黎 tỉnh + 黑                                   | [Tra bộ 黑] Hội ý kiêm thanh: màu đen pha vàng xám, da dẻ sạm đen vì nắng gió; _từ ghép:_ 面目黧黑 (miànmù líhēi: mặt mày sạm đen).                                                                                                                                                   |
| 点 / 點 | diǎn   | Điểm     | Phồn: `黑` + `占` (`zhàn`) / Giản: `占` + `灬` | [Tra bộ 灬 (giản) · bộ 黑 (phồn)] Phồn thể `點` nghĩa gốc là chấm đen nhỏ trên mặt giấy; Giản thể bỏ phần trên của `黑` chỉ giữ `占` + 4 chấm `灬` → dấu chấm, giọt nhỏ, điểm số, giờ, gọi món; _từ ghép:_ 一点 (yìdiǎn: một chút), 地点 (dìdiǎn: địa điểm), 点菜 (diǎncài: gọi món). |
| 党 / 黨 | dǎng   | Đảng     | Phồn: `尚` + `黑` / Giản: `尚` + `儿`          | [Tra bộ 儿 (giản) · bộ 黑 (phồn)] Phồn thể `黨` nghĩa gốc cổ là không sáng tỏ/bè phái, sau chỉ hội nhóm chính trị, dòng họ; Giản thể đổi `黑` thành `儿`; _từ ghép:_ 政党 (zhèngdǎng: chính đảng), 党派 (dǎngpài: đảng phái).                                                         |
| 霉 / 黴 | méi    | Mi       | Phồn: `黑` + `微` tỉnh / Giản: `雨` + `每`     | [Tra bộ 雨 (giản) · bộ 黑 (phồn)] Phồn thể `黴` chỉ vết mốc đen sinh ra vì ẩm; Giản thể gộp vào `霉` (bộ Vũ `雨`); _từ ghép:_ 发霉 (fāméi: bị mốc), 倒霉 (dǎoméi: xui xẻo).                                                                                                           |

### Nhóm C: Văn ngôn, tính cách, trừng phạt & thành ngữ với `黑`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                 |
| ------- | ------ | -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 黜      | chù    | Truất    | 黑 + 出 (`chū`, thanh phù kiêm ý đuổi ra) | [Tra bộ 黑] Hình thanh: phế truất, giáng chức, bãi bỏ khỏi hàng ngũ; _từ ghép:_ 罢黜 (bàchù: bãi miễn, phế truất), 废黜 (fèichù: phế bỏ).                                                      |
| 黠      | xiá    | Hiệt     | 黑 + 吉 (`jí`, thanh phù cổ)              | [Tra bộ 黑] Hình thanh: thông minh lanh lợi theo hướng tinh ranh, xảo quyệt; _từ ghép:_ 狡黠 (jiǎoxiá: giảo hoạt, tinh ranh), 慧黠 (huìxiá: thông minh sắc sảo).                               |
| 黩 / 黷 | dú     | Độc      | 黑 + 卖/賣 (`mài`, thanh phù)             | [Tra bộ 黑] Hình thanh: làm vấy bẩn, bôi nhọ, lạm dụng bừa bãi; _từ ghép:_ 穷兵黩武 (qióngbīng-dúwǔ: hiếu chiến lạm dụng vũ lực), 黩职 (dúzhí: làm nhơ chức trách).                            |
| 黥      | qíng   | Kình     | 黑 + 京 (`jīng`, thanh phù)               | [Tra bộ 黑] Hình thanh: hình phạt cổ đại khắc chữ rồi bôi mực đen lên mặt tội phạm (còn gọi là mặc hình); _từ ghép:_ 黥面 (qíngmiàn: thích chữ vào mặt), 黥刑 (qíngxíng: hình phạt thích mặt). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-073`):** `黒` (dị thể Nhật Bản), `墨` (`土`), `默` (`黑`), `黯` (`黑`), cùng `灬` (hỏa 4 chấm ở chân `黑` — lưu ý không tách `黑` một cách máy móc thành chữ có nghĩa thuần lửa khi phân tích hiện đại).
- **Chữ chứa `黑` (ở Phồn thể hoặc làm bộ phận cấu chữ) nhưng xếp ở bộ khác:**
  - `墨` (`mò`, Mặc — `黑 + 土`, tra bộ **Thổ `土`**): mực tàu (`墨水`, `笔墨`).
  - `点 / 點` (`diǎn`, Điểm — Giản thể `点` tra bộ **Hỏa `灬`**, Phồn thể `點` tra bộ **Hắc `黑`**): dấu chấm, giờ, điểm (`一点`, `重点`).
  - `党 / 黨` (`dǎng`, Đảng — Giản thể `党` tra bộ **Nhân đi `儿`**, Phồn thể `黨` tra bộ **Hắc `黑`**): đảng phái (`政党`, `死党`).
  - `霉 / 黴` (`méi`, Mi — Giản thể `霉` tra bộ **Vũ `雨`**, Phồn thể `黴` tra bộ **Hắc `黑`**): mốc meo, xui xẻo (`发霉`, `倒霉`).
  - `熏 / 燻` (`xūn / xùn`, Huân — `千 + 黑` lược hợp, tra bộ **Hỏa `灬`**): hun khói, xông khói (`熏肉` thịt xông khói, `熏陶` hun đúc giáo dục — phần chữ cổ chính là lửa hun khói đen bốc lên).

---

## Bộ 204: 黹 (Chỉ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-234` · `radical_index`: `234` · `radical`: `"黹"` · `strokes`: `12` nét · `name_vi`: `bộ Chỉ / May thêu` · **Khang Hy:** `#204` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `黹` — dạng chính duy nhất (`12` nét: phần trên gồm `业` + `八`, phần dưới là `巾` có hai nét phẩy chấm đan chéo hai bên), thống nhất giữa Giản thể và Phồn thể. Trong số ít chữ thuộc bộ này, `黹` luôn đứng ở **bên trái** (`黻, 黼`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **tấm vải (`巾`) đang được đường kim mũi chỉ thêu thùa dày đặc** (các nét chấm phẩy hai bên và phía trên mô phỏng mũi kim, sợi chỉ và hoa văn thêu).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bộ rất hiếm, không thuộc nhóm HSK thông dụng; nghĩa cốt lõi chỉ **may vá, thêu thùa, hoa văn gấm vóc trên lễ phục triều đình thời cổ** (`针黹`, `黼黻`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Chữ có `黹` gần như chỉ xuất hiện trong từ ghép cố định về nữ công gia chánh xưa (`针黹`) hoặc thuật ngữ lễ phục – văn chương cổ (`黼黻`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`黹` (Chỉ — may thêu) vs `糸 / 纟` (Mịch — sợi tơ/chỉ) vs `衣 / 衤` (Y — quần áo):** Các chữ thông dụng hiện đại nói về thêu thùa, dệt may và sợi chỉ gần như đều dùng **`糸 / 纟`** (`绣` thêu, `织` dệt, `缝` may, `线` sợi chỉ); chữ về trang phục dùng **`衣 / 衤`** (`衫, 裤, 袍`). `黹` chỉ bảo tồn trong lớp từ cổ.
    - **Cấu tạo đáy `巾`:** Phần đáy của `黹` chứa khung `巾` (khăn/tấm vải — bộ Cân), giải thích vì sao `黹` mang nghĩa thêu trên mặt vải.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Kỹ nghệ kim chỉ, may thêu truyền thống

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                          |
| ------- | ------ | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 黹      | zhǐ    | Chỉ      | Độc thể (Bộ thủ chính) | [Tra bộ 黹] Tượng hình mũi kim chỉ thêu trên tấm vải (`巾`) → việc may vá, thêu thùa; _từ ghép:_ 针黹 (zhēnzhǐ: việc kim chỉ, may thêu nữ công), 女红针黹 (nǚgōng zhēnzhǐ: nghề may vá của phụ nữ xưa). |

### Nhóm B: Hoa văn lễ phục cổ & thành ngữ văn chương

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                           |
| ------- | ------ | -------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 黻      | fú     | Phất     | 黹 (thêu) + 犮 (`bá/fú`, thanh phù cổ) | [Tra bộ 黹] Hình thanh: hoa văn thêu hình hai chữ "Kỷ" quay lưng vào nhau (hoặc hình chữ Á `亞`) màu xanh đen trên lễ phục tế lễ thiên tử, chư hầu cổ đại; _từ ghép:_ 黻衣 (fúyī: áo lễ thêu hoa văn), 黼黻 (fǔfú: hoa văn lễ phục / văn chương hoa mỹ). |
| 黼      | fǔ     | Phủ      | 黹 (thêu) + 甫 (`fǔ`, thanh phù)       | [Tra bộ 黹] Hình thanh: hoa văn thêu hình chiếc rìu nửa đen nửa trắng tượng trưng cho sự quyết đoán trên lễ phục cổ; _từ ghép:_ 黼黻文章 (fǔfú wénzhāng: văn chương trau chuốt hoa mỹ rực rỡ).                                                           |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-234`):** `黹`, `黻`, `黼` (3 chữ duy nhất phổ biến của bộ `黹`), cùng hai bộ thông dụng hơn về dệt may là `糸 / 纟` (tơ/chỉ) và `衣 / 衤` (áo quần).
- **Thành phần gần dạng hoặc cùng trường nghĩa may thêu ở bộ khác:**
  - `巾` (`jīn`, Cân — bộ thủ riêng): tấm khăn/tấm vải, nằm ở cấu tạo phía dưới của `黹`.
  - `绣 / 繡` (`xiù`, Tú — `纟 + 秀`, tra bộ **Mịch `糸 / 纟`**): thêu thùa (`刺绣`, `绣花`) — chữ dùng hàng ngày thay cho vai trò nghĩa của `黹`.
  - `缝 / 縫` (`féng / fèng`, Phùng — `纟 + 逢`, tra bộ **Mịch `糸 / 纟`**): khâu vá, may (`缝纫`, `缝衣服`).
  - `业` (`yè`, Nghiệp — tra bộ **Nhất `一`**): phần đỉnh chữ `黹` có hình nét gần với `业`, nhưng trong `黹` đó là nét mô phỏng mũi chỉ thêu, không liên quan nghĩa "sự nghiệp".

---

## Bộ 205: 黽 (Mãnh)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-235` · `radical_index`: `235` · `radical`: `"黽 / 黾"` · `strokes`: `13` nét (chuẩn Khang Hy; Giản thể `黾` rút xuống `8` nét) · `name_vi`: `bộ Mãnh / Mẫn` · **Khang Hy:** `#205` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `黽` — dạng Phồn thể / đầy đủ (`13` nét: đầu giống `口` + thân hai bên đối xứng mô phỏng chân ếch/nhái và chiếc bụng dài).
  - `黾` — dạng Giản thể chuẩn (`8` nét: phần trên rút thành `口` + phần dưới thành `电`-dạng `丨 𠃍 一 一 乚`). Khi làm thành phần trong chữ ghép Giản thể (`蝇, 绳, 鼋, 鼍`), dạng `黾` xuất hiện khá gọn ở bên phải hoặc phía dưới.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **con ếch / nhái** (hoặc loài lưỡng cư, bò sát mai mềm nhìn từ trên xuống, thấy rõ đầu, bốn chân xòe và bụng tròn).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bộ cổ hiếm; trong văn tự cổ dùng chỉ **các loài lưỡng cư, giải/rùa mai mềm, cá sấu** (`鼋, 鼍, 鳖` trong Phồn/dị thể cổ) và hàm ý **"cố gắng, gắng sức"** trong từ văn ngôn `黾勉` (`mǐnmiǎn` — nỗ lực không ngừng). Trong chữ Giản thể hiện đại, `黾` chủ yếu xuất hiện như **linh kiện cấu chữ rút gọn từ `黽`** trong các chữ quen thuộc như `蝇` (ruồi) và `绳` (dây thừng).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Gặp `黽 / 黾` trong các chữ thú vật cổ thường liên quan loài bò sát/lưỡng cư dưới nước (`鼋, 鼍`); nhưng trong chữ hiện đại thông dụng nhất (`蝇, 绳`), `黾` chỉ là khối nét rút gọn từ Phồn thể (`蠅, 繩`) chứ không mang nghĩa con ếch.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`黾 / 黽` vs `蛙` (`虫 + 圭`):** Trong tiếng Trung hiện đại, **con ếch** là `青蛙` (chữ `蛙` thuộc **bộ Trùng `虫`**), không dùng `黾`.
    - **`黽 / 黾` vs `龜 / 龟` (Quy — rùa):** Cả hai cùng là bộ động vật lưỡng cư/bò sát nhiều nét trong nhóm cuối bảng Khang Hy, nhưng `龜 / 龟` là bộ riêng (#213) chỉ con rùa có mai.
    - **`黾` (8 nét) vs `电` (5 nét, điện):** Đáy chữ `黾` có hình giống `电` nhưng phía trên có thêm một nét `口` đội đầu (`口` + `电` → viết liền nét sổ chính xuyên qua).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Lưỡng cư, bò sát nước & từ cổ thuộc/liên hệ `黽 / 黾`

| Chữ Hán | Pinyin     | Hán Việt   | Thiên bàng đứng chung                                        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                                           |
| ------- | ---------- | ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 黾 / 黽 | mǐn / měng | Mẫn / Mãnh | Độc thể (Bộ thủ chính)                                       | [Tra bộ 黽 / 黾] Tượng hình con ếch/nhái cổ (`měng`); đọc `mǐn` nghĩa là cố gắng nỗ lực không ngừng; _từ ghép:_ 黾勉 (mǐnmiǎn: cố gắng cần mẫn), 蛙黾 (wāměng: ếch nhái — cổ văn).                                                                                                       |
| 鼋 / 黿 | yuán       | Ngoan      | 元 (`yuán`, thanh phù) + 黾/黽                               | [Tra bộ 黽 / 黾] Hình thanh: loài giải khổng lồ (rùa mai mềm lớn sống sông hồ Trung Quốc); _từ ghép:_ 鼋头渚 (Yuántóuzhǔ: thắng cảnh Nguyên Đầu Chử ở Thái Hồ, Vô Tích), 巨鼋 (jùyuán: giải khổng lồ).                                                                                   |
| 鼍 / 鼉 | tuó        | Đà         | 單/单 tỉnh (hoặc `吅 + 电` cổ) + 黾/黽                       | [Tra bộ 黽 / 黾] Tượng thanh/hình thanh cổ: cá sấu Dương Tử (tiếng kêu vang như trống nên thời xưa lấy da cá sấu làm mặt trống — `鼍鼓`); _từ ghép:_ 鼍龙 (tuólóng: cá sấu sông Dương Tử).                                                                                               |
| 鳖 / 鼈 | biē        | Miết       | 敝 (`bì/biē`, thanh phù) + 鱼/魚 (dị thể cổ dùng `黽`: `龞`) | [Tra bộ 魚 / 鱼 (hiện đại) · dị thể `龞` bộ 黽/龜] Hình thanh: con ba ba (rùa nước ngọt mai mềm); Phồn thể chuẩn dùng `魚` (`鼈`), dị thể cổ dùng `黽` (`龞`); _từ ghép:_ 甲鱼 / 鳖 (jiǎyú / biē: ba ba), 瓮中捉鳖 (wèngzhōng-zhuōbiē: bắt ba ba trong chum — chắc chắn nắm phần thắng). |

### Nhóm B: Chữ hiện đại chứa `黾 / 黽` xếp ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                 |
| ------- | ------ | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 蝇 / 蠅 | yíng   | Dăng     | 虫 (côn trùng) + 黾/黽 (`yíng` âm cổ gần)       | [Tra bộ 虫] Hình thanh/hội ý: loài côn trùng (`虫`) thân bầu dục bụng phình → con ruồi; _từ ghép:_ 苍蝇 (cāngying: con ruồi), 蝇拍 (yíngpāi: vỉ đập ruồi).                                                     |
| 绳 / 繩 | shéng  | Thằng    | 纟/糸 (sợi dây) + 黾/黽 (`shéng`, thanh phù cổ) | [Tra bộ 糸 / 纟] Hình thanh: sợi dây bện (`纟`) dùng buộc trói → dây thừng, dây chão, khuôn phép ("mực thước"); _từ ghép:_ 绳子 (shéngzi: dây thừng), 跳绳 (tiàoshéng: nhảy dây), 准绳 (zhǔnshéng: chuẩn mực). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-235`):** `黽 / 黾`, `鼈 / 鳖` (con ba ba), `蛙` (con ếch hiện đại dùng bộ `虫`), cùng hai bộ riêng gần nhóm động vật nhỏ là `龜 / 龟` (rùa) và `虫` (côn trùng/bò sát nhỏ).
- **Chữ chứa `黽 / 黾` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `蝇 / 蠅` (`yíng`, Dăng — tra bộ **Trùng `虫`**): con ruồi (`苍蝇`).
  - `绳 / 繩` (`shéng`, Thằng — tra bộ **Mịch `糸 / 纟`**): dây thừng (`绳子`, `跳绳`).
  - `酃` (`líng`, Linh — `霝 + 阝`? Không, `霝` không có `黾`; các chữ mang `黾` phổ biến nhất ngoài `黽` đều rơi vào `鼋, 鼍, 蝇, 绳` và tên riêng `渑` `Miǎn/Shéng` — sông Thằng / Thằng Trì `渑池` thuộc bộ `氵`).

---

## Bộ 206: 鼎 (Đỉnh)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-236` · `radical_index`: `236` · `radical`: `"鼎"` · `strokes`: `13` nét · `name_vi`: `bộ Đỉnh` · **Khang Hy:** `#206` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `鼎` — dạng chính duy nhất (`13` nét: phần trên là `目` biểu thị thân vạc đồng, phần dưới là hai bên đối xứng vẽ hai tai và ba/bốn chân vạc vững chãi), thống nhất giữa Giản thể và Phồn thể. Lưu ý thứ tự nét chuẩn hiện đại của `鼎` viết là `目` trên + nét sổ gập trái (`㇞`) + ngang phẩy + sổ + ngang + sổ + ngang + ngang (`13` nét).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **chiếc đỉnh đồng ba chân hai quai** dùng để nấu đồ tế lễ và đặt trong tông miếu thời Thương – Chu. Vì là lễ khí quốc bảo tượng trưng cho vương quyền (như Cửu Đỉnh nhà Hạ), `鼎` mang giá trị biểu tượng cực cao.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Nghĩa gốc là **đỉnh đồng / vạc cổ**, mở rộng mạnh mẽ sang:
    1. **Vương quyền, uy tín tối cao, lời nói nặng cân** (`一言九鼎` một lời nặng bằng chín đỉnh, `问鼎` tranh ngôi bá chủ/chức vô địch);
    2. **Thế chân vạc ba bên cân bằng** (`三国鼎立` ba nước chia chân vạc);
    3. **Thời kỳ hưng thịnh cực điểm hoặc sự giúp đỡ hết lòng** (`鼎盛` cực thịnh, `鼎力相助` dốc toàn lực giúp đỡ).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Gặp `鼎` thường liên quan đến khí cụ đồng cổ, quyền lực/uy vọng, thế vững chãi ba chân hoặc trạng thái thịnh vượng bậc nhất.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`鼎` (Đỉnh — 13 nét) vs `鬲` (Cách — 10 nét, Khang Hy `#193`):** Cả hai đều là nồi/vạc ba chân cổ đại, nhưng `鬲` là nồi nấu bình dân chân rỗng, thuộc bộ riêng `鬲`; `鼎` là đỉnh đồng tế lễ, biểu tượng quyền lực quốc gia.
    - **`鼎` vs `皿` (Mãnh — bát/đĩa/đồ đựng):** `皿` là đồ chứa nói chung, dùng nhiều trong chữ hiện đại (`盘, 盆, 盒, 益, 盛`); `鼎` là chữ cổ quý, ít tạo chữ mới nhưng cực giàu thành ngữ.
    - **Không hiểu theo nghĩa nấu ăn hiện đại trong `鼎力相助`:** Trong giao tiếp trang trọng, `鼎力相助` nghĩa là "ra sức giúp đỡ hết mình" (kính ngữ dùng cho đối phương), không liên quan nấu nướng.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Đỉnh đồng cổ & các nghĩa chuyển quyền lực, thịnh vượng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                                                                         |
| ------- | ------ | -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鼎      | dǐng   | Đỉnh     | Độc thể (Bộ thủ chính)            | [Tra bộ 鼎] Tượng hình đỉnh đồng hai quai ba chân → vạc đồng cổ, ngôi vị/quyền uy, thịnh vượng, dốc hết sức; _từ ghép:_ 鼎盛 (dǐngshèng: cực kỳ thịnh vượng), 鼎力相助 (dǐnglì-xiāngzhù: hết lòng giúp đỡ), 三足鼎立 (sānzú-dǐnglì: thế chân vạc ba bên), 一言九鼎 (yìyán-jiǔdǐng: một lời nói cực kỳ có trọng lượng). |
| 鼐      | nài    | Nãi      | 乃 (`nǎi`, thanh phù) + 鼎 (đỉnh) | [Tra bộ 鼎] Hình thanh kiêm hội ý: chiếc đỉnh đồng kích thước cực lớn thời cổ đại; _từ ghép:_ 鼐鼎 (nàidǐng: đại đỉnh cổ).                                                                                                                                                                                             |

### Nhóm B: Chi tiết & khí cụ đồng cổ hiếm thuộc bộ `鼎`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                |
| ------- | ------ | -------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鼏      | mì     | Mịch     | 冖 (khăn trùm) + 鼎 (đỉnh)           | [Tra bộ 鼎] Hội ý: tấm khăn vải phủ đậy lên miệng chiếc đỉnh đồng tế lễ thời xưa để giữ sạch lễ vật (gặp trong _Nghi Lễ_ cổ văn với nghĩa nắp khăn đậy đỉnh).                 |
| 鼒      | zī     | Tư       | 才 (`cái`, thanh phù cổ) + 鼎 (đỉnh) | [Tra bộ 鼎] Hình thanh cổ: chiếc đỉnh đồng loại miệng nhỏ bụng tròn dùng nấu tế thời Chu; _dẫn chứng cổ:_ 鼐鼎及鼒 (nàidǐng jí zī: đỉnh lớn lẫn đỉnh miệng nhỏ — _Kinh Thi_). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-236`):** `鼎`, `鼎盛`, `鼎力`, cùng hai bộ đồ đựng liên quan là `鬲` (nồi ba chân cổ) và `皿` (đĩa/chậu/đồ chứa).
- **Thành phần gần hình hoặc có gốc liên hệ `鼎` ở bộ khác:**
  - `贝 / 貝` (`bèi`, Bối) và `贞 / 貞` (`zhēn`, Trinh — `卜 + 贝`, tra bộ **Bối `貝`**): trong Giáp cốt văn, chữ `貞` (hỏi quẻ bói) vốn dùng hình chiếc `鼎` vì âm `dǐng / zhēn` gần nhau, sau mới quy đồng về `貝`; nên `鼎` và `貞` có nguồn hình cổ liên thông thú vị.
  - `顶` (`dǐng`, Đỉnh — `丁 + 页`, tra bộ **Hiệt `页`**): chóp đầu, đỉnh cao (`山顶`, `屋顶`). Chú ý đừng viết nhầm `顶` (đỉnh đầu/đỉnh núi) thành `鼎` (vạc đồng/cực thịnh), dù cả hai đọc giống nhau là `dǐng`!
  - `锅` (`guō`, Oa — `钅 + 呙`, tra bộ **Kim `钅`**): cái nồi/chảo nấu ăn thông dụng trong đời sống hiện đại (khác hẳn chức năng tế lễ/trang trọng của `鼎`).

---

## Bộ 207: 鼓 (Cổ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-237` · `radical_index`: `237` · `radical`: `"鼓"` · `strokes`: `13` nét · `name_vi`: `bộ Cổ` · **Khang Hy:** `#207` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `鼓` — dạng chính duy nhất (`13` nét: bên trái là `壴` gồm `士 + 口 + 丷 + 一` vẽ cái trống đặt trên giá; bên phải là `支` vẽ bàn tay cầm dùi đánh trống). Thống nhất giữa Giản thể và Phồn thể.
  - _(Lưu ý dị thể cũ)_: Đôi khi trong ấn bản cổ hoặc thư pháp có dị thể `皷` (bên phải dùng `皮` = da bọc mặt trống thay cho `支`), nhưng chữ chuẩn hiện đại cả Giản thể và Phồn thể đều dùng `鼓`.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý: bên trái (`壴`) là hình **chiếc trống có trang trí lông vũ dựng trên bệ gỗ**, bên phải (`支`) là **bàn tay cầm dùi đang gõ vào mặt trống**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **cái trống, hành động đánh trống / gảy đàn** (`打鼓, 鼓瑟`), mở rộng tự nhiên sang:
    1. **Khích lệ, cổ vũ tinh thần, khuấy động** (`鼓励` khích lệ, `鼓舞` cổ vũ, `鼓动` cổ động);
    2. **Vỗ tay** (`鼓掌`);
    3. **Phồng lên, căng tròn, nhô ra như mặt trống** (`鼓起来` phồng lên, `鼓囊囊` căng phồng).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `鼓` thường liên quan đến trống, tiếng vang rền, hành động vỗ/đánh nhịp, cổ vũ tinh thần hoặc hình dáng căng phồng.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`鼓` (13 nét) vs `壴` (9 nét, linh kiện bên trái của `鼓`):** `壴` là thành phần cổ chỉ cái trống dựng trên giá, không dùng đứng độc lập trong tiếng Trung hiện đại nhưng lại xuất hiện trong nhiều chữ mở rộng như `喜` (vui mừng — tiếng trống và tiếng cười), `嘉` (tốt đẹp), `彭` (tiếng trống dồn / phình to).
    - **`鼓` vs `支` (bộ Chi — cành/tay cầm):** Phần bên phải của `鼓` là `支` (4 nét), nhưng toàn chữ `鼓` là bộ thủ độc lập riêng (#207), không tra theo bộ `支`.
    - **`鼓掌` (`gǔzhǎng`) vs `拍手` (`pāishǒu`):** Cả hai đều nghĩa là vỗ tay, nhưng `鼓掌` mang sắc thái trang trọng/hoan nghênh hơn.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Nhạc cụ trống, tiếng vang & cổ vũ

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                             |
| ------- | ------ | -------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鼓      | gǔ     | Cổ       | Độc thể (`壴` cái trống + `支` tay cầm dùi)               | [Tra bộ 鼓] Hội ý: tay cầm dùi đánh trống → cái trống, đánh trống, cổ vũ, phồng căng lên; _từ ghép:_ 鼓励 (gǔlì: khích lệ), 鼓掌 (gǔzhǎng: vỗ tay), 鼓舞 (gǔwǔ: cổ vũ), 鼓动 (gǔdòng: cổ động/kích động).  |
| 鼙      | pí     | Bề       | 卑 (`bēi`, thanh phù kiêm ý nhỏ) + 鼓 (trống)             | [Tra bộ 鼓] Hình thanh: loại trống nhỏ đánh trên lưng ngựa trong quân đội thời xưa (nhắc nổi tiếng trong câu thơ _Ngư Dương bề cổ_ của Bạch Cư Dị); _từ ghép:_ 鼙鼓 (pígǔ: trống trận quân nhạc xưa).      |
| 鼗      | táo    | Đào      | 兆 (`zhào`, thanh phù) + 鼓 (trống)                       | [Tra bộ 鼓] Hình thanh: chiếc trống lắc có tay cầm và hai viên bi treo hai bên dây, xoay tay để bi gõ vào mặt trống (nay thường gọi `拨浪鼓`); _từ ghép:_ 鼗鼓 (táogǔ: trống bỏi/trống lắc).               |
| 咚 / 鼕 | dōng   | Đông     | Giản: `口` + `冬` (`dōng`, thanh phù) / Phồn: `冬` + `鼓` | [Tra bộ 口 (giản) · bộ 鼓 (phồn)] Tượng thanh: tiếng trống đánh "thùng thùng / tùng tùng"; trong Giản thể thống nhất dùng `咚` (bộ Khẩu `口`); _từ ghép:_ 咚咚响 (dōngdōng xiǎng: vang tiếng thùng thùng). |

### Nhóm B: Chữ mở rộng cùng gốc trống `壴 / 鼓` ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                             |
| ------- | ------ | -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 瞽      | gǔ     | Cổ       | 鼓 (`gǔ`, thanh phù kiêm gợi nhạc sư) + 目 (mắt) | [Tra bộ 目] Hình thanh kiêm hội ý văn hóa: thời Chu, người mù thường đảm nhiệm việc đánh trống tấu nhạc trong triều đình nên mượn chữ `鼓` + `目` để chỉ người mù; _từ ghép:_ 瞽者 (gǔzhě: người khiếm thị xưa), 盲瞽 (mánggǔ: mù lòa).    |
| 彭      | péng   | Bành     | 壴 (cái trống) + 彡 (tiếng vang/hoa văn)         | [Tra bộ 彡] Hội ý cổ: tiếng trống đánh dồn dập vang rền (`壴 + 彡`), mở rộng thành dồi dào, to lớn, họ Bành; tạo nên `膨` (phình to); _từ ghép:_ 彭湃 (péngpài: biến thể cổ của `澎湃` cuồn cuộn), 膨胀 (péngzhàng: bành trướng/phình to). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-237`):** `鼓`, `鼓励`, `鼓掌`, `鼓动`, cùng linh kiện cổ `壴` (trống dựng trên giá) và bộ riêng `支` (phần bên phải của `鼓`).
- **Chữ dùng linh kiện gốc trống `壴` hoặc liên hệ gần với `鼓` ở bộ khác:**
  - `喜` (`xǐ`, Hỷ — `壴 + 口`, tra bộ **Khẩu `口`**): vui mừng (gốc vẽ đánh trống `壴` và miệng cười `口`; `喜欢`, `喜悦`).
  - `嘉` (`jiā`, Gia — `壴 + 加`, tra bộ **Khẩu `口`**): tốt đẹp, khen ngợi (`嘉宾`, `嘉奖`).
  - `彭` (`péng`, Bành — `壴 + 彡`, tra bộ **Sam `彡`**): họ Bành, dồi dào, mở rộng sang `膨` (`月 + 彭`, tra bộ **Nhục `月`** — phình nở `膨胀`).
  - `树 / 樹` (`shù`, Thụ — Phồn thể `樹` = `木 + 壴 + 寸`, tra bộ **Mộc `木`**): cây cối, trồng cây (`大树`, `树立`) — phần giữa `壴 + 寸` vẽ tay dựng vật thẳng đứng (`壴` gợi hình dựng đứng).
  - `瞽` (`gǔ`, Cổ — `鼓 + 目`, tra bộ **Mục `目`**): mù mắt.

---

## Bộ 208: 鼠 (Thử)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-238` · `radical_index`: `238` · `radical`: `"鼠"` · `strokes`: `13` nét · `name_vi`: `bộ Thử` · **Khang Hy:** `#208` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `鼠` — dạng chính duy nhất (`13` nét: đầu giống `臼` là mõm và răng gặm nhấm, phần dưới có hai phần ria/chân và nét đuôi cong dài ở ngoài cùng bên phải), thống nhất giữa Giản thể và Phồn thể. Trong chữ ghép (`鼬, 鼹, 鼯, 鼷`), `鼠` luôn đứng ở **bên trái** hoặc nằm dưới (`窜 / 竄`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **con chuột** đang đứng nghiêng: đầu lộ răng cửa nhọn đang gặm, bốn chân ngắn và cái đuôi dài cong phía sau.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **con chuột và các loài thú gặm nhấm nhỏ** (`老鼠, 松鼠, 袋鼠` chuột túi, `鼹鼠` chuột chũi), mở rộng sang **chuột máy tính** (`鼠标`), và nghĩa bóng **"nhỏ nhen, lén lút, chui lủi, tầm nhìn hạn hẹp"** (`鼠目寸光` mắt chuột nhìn ngắn một tấc, `抱头鼠窜` ôm đầu chạy trốn như chuột).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `鼠` ở bên trái gần như 100% chỉ các loài trong bộ gặm nhấm hoặc họ chồn/sóc (`鼬, 鼹, 鼯, 鼷`); xuất hiện trong `窜` (thoán) gợi hình ảnh chuột chui trốn.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Bộ 208 `鼠` (Thử — con chuột, 13 nét) vs Bộ 202 `黍` (Thử — kê nếp, 12 nét):** Hai bộ có âm Hán-Việt giống nhau là **"Thử"**, cần phân biệt rõ `鼠` (chuột — `老鼠, 鼠标`) và `黍` (cây kê — `黍子, 黏土`).
    - **`鼠` (13 nét) vs `鼻` (14 nét):** Cả hai đều nhiều nét và đứng gần cuối bảng bộ thủ Khang Hy (`208` và `209`), nhưng `鼠` phần đầu là `臼` hở đỉnh (`丿 丨 一 𠃍 一 一`) và chân kéo đuôi dài ngoặt móc, còn `鼻` phần đầu là `自` (mũi) + `田` + `廾` bên dưới.
    - **`鼠标` (`shǔbiāo`):** Nghĩa hiện đại hoàn toàn mới là "chuột máy tính" (con trỏ chuột).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Con chuột & các loài gặm nhấm / thú nhỏ thuộc bộ `鼠`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                          |
| ------- | ------ | -------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鼠      | shǔ    | Thử      | Độc thể (Bộ thủ chính)        | [Tra bộ 鼠] Tượng hình con chuột có răng gặm và đuôi dài → con chuột, thú gặm nhấm, chuột máy tính; _từ ghép:_ 老鼠 (lǎoshǔ: con chuột), 鼠标 (shǔbiāo: chuột máy tính), 松鼠 (sōngshǔ: con sóc), 鼠目寸光 (shǔmù-cùnguāng: thiển cận). |
| 鼬      | yòu    | Dữu      | 鼠 + 由 (`yóu`, thanh phù)    | [Tra bộ 鼠] Hình thanh: loài chồn (gần giống chuột lớn, có mùi xạ; dân gian hay gọi là chồn vàng); _từ ghép:_ 黄鼬 / 黄鼠狼 (huángyòu / huángshǔláng: chồn vàng/triết vàng).                                                            |
| 鼹      | yǎn    | Yển      | 鼠 + 晏/匽 (`yàn`, thanh phù) | [Tra bộ 鼠] Hình thanh: loài chuột chũi chuyên đào hang sống dưới lòng đất; _từ ghép:_ 鼹鼠 (yǎnshǔ: chuột chũi).                                                                                                                       |
| 鼯      | wú     | Ngô      | 鼠 + 吾 (`wú`, thanh phù)     | [Tra bộ 鼠] Hình thanh: loài sóc bay (có màng da nối chi giúp lượn giữa các cành cây); _từ ghép:_ 鼯鼠 (wúshǔ: sóc bay).                                                                                                                |
| 鼷      | xī     | Hề       | 鼠 + 奚 (`xī`, thanh phù)     | [Tra bộ 鼠] Hình thanh: loài chuột nhắt cực nhỏ; _từ ghép:_ 鼷鼠 (xīshǔ: chuột nhắt nhỏ).                                                                                                                                               |

### Nhóm B: Hành vi lẩn trốn gắn với hình tượng chuột

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                           |
| ------- | ------ | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 窜 / 竄 | cuàn   | Thoán    | 穴 (hang) + 鼠 (chuột) | [Tra bộ 穴] Hội ý: con chuột (`鼠`) lủi nhanh vào hang (`穴`) để trốn → chạy trốn tán loạn, lẩn trốn, sửa đổi lén lút văn bản; _từ ghép:_ 逃窜 (táocuàn: bỏ chạy trốn), 窜改 (cuàngǎi: sửa đổi bậy bạ/xuyên tạc), 抱头鼠窜 (bàotóu-shǔcuàn: ôm đầu chạy trốn nháo nhác). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-238`):** `鼠`, `鼠标`, cùng các loài thú thông dụng xếp ở bộ khác như `猫` (mèo — bộ `犭`), `兔` (thỏ — bộ `刀 / 儿`).
- **Chữ liên hệ gần hoặc chứa `鼠` xếp ở bộ khác:**
  - `窜 / 竄` (`cuàn`, Thoán — `穴 + 鼠`, tra bộ **Huyệt `穴`**): chạy trốn, sửa đổi lén lút (`逃窜`, `窜改`).
  - `鼬`, `鼹`, `鼯`, `鼷`: nhóm chữ chuyên chỉ họ chuột, chồn, sóc bay xếp trực tiếp ở **bộ Thử `鼠`**.
  - `袋鼠` (`dàishǔ`, đại thử = chuột túi/kangaroo) và `仓鼠` (`cāngshǔ`, thương thử = chuột hamster): từ ghép hiện đại dùng `鼠` kết hợp phân loại loài.

---

## Bộ 209: 鼻 (Tỵ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-084` · `radical_index`: `84` · `radical`: `"鼻"` · `strokes`: `14` nét · `name_vi`: `bộ Tỵ` · **Khang Hy:** `#209`.
- **Ghi chú dòng trùng / rỗng:** Trong DB hiện có **1 dòng rỗng phụ** là `radical-239` (`radical_index`: `239`, `radical`: `"鼻"`, `name_vi: null`, `strokes: null`). Cần dọn dòng `radical-239` khi chuẩn hóa DB, giữ dòng chính `radical-084`.
- **Hình thái & Biến thể (`variants`):**
  - `鼻` — dạng chính duy nhất (`14` nét: trên là `自`, giữa là `田`, dưới là `廾` gồm ngang và hai nét phẩy/sổ nâng đỡ), thống nhất giữa Giản thể và Phồn thể. Khi làm bộ thủ (`鼾, 齁, 齄, 鼽`), `鼻` luôn đứng ở **bên trái** chữ.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hình thanh kiêm hội ý: phần trên là chữ **`自`** (trong Giáp cốt văn, `自` vốn là hình tượng cái mũi!); về sau khi `自` bị giả tá sang nghĩa "tự mình / bản thân" (vì người xưa chỉ tay vào mũi mình để xưng "tôi"), người ta thêm phần thanh phù `畀` (`bì`, gồm `田 + 廾`) bên dưới để tạo thành chữ chuyên biệt **`鼻`** chỉ cái mũi.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **cái mũi, khứu giác, đường thở qua mũi, âm mũi** (`鼻子, 鼻音, 鼻涕`), mở rộng sang nghĩa **"người khởi xướng đầu tiên / thủy tổ"** (`鼻祖` — do phôi thai cổ quan niệm mũi hình thành đầu tiên).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `鼻` ở bên trái gần như luôn liên quan trực tiếp đến mũi, thở khò khè/ngáy (`鼾, 齁`) hoặc bệnh lý về mũi (`鼽, 齄`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`鼻` (14 nét) vs `自` (6 nét, bộ Tự):** Trong tiếng Trung hiện đại, `自` nghĩa là "tự mình, từ" (`自己, 自然`); tuy `自` là chữ gốc vẽ cái mũi thời cổ (vẫn giữ vết tích trong `臭` = `自` mũi + `犬` chó đánh hơi, `息` = hơi thở qua mũi `自` + tim `心`), nhưng không dùng `自` thay cho `鼻` khi nói về cơ quan mũi.
    - **`鼻` vs `口` (miệng):** Hành động **ngửi** (`嗅` `xiù`) thuộc **bộ Khẩu `口`** (`口 + 臭`), còn tiếng **ngáy** (`鼾` `hān`) thuộc **bộ Tỵ `鼻`**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cơ quan mũi, hơi thở & tiếng ngáy

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                                               |
| ------- | ------ | -------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 鼻      | bí     | Tỵ       | Độc thể (`自` mũi cổ + `畀` thanh phù) | [Tra bộ 鼻] Hình thanh: cái mũi, phần nhô đầu tiên → mũi, khứu giác, thủy tổ; _từ ghép:_ 鼻子 (bízi: cái mũi), 鼻涕 (bítì: nước mũi), 鼻音 (bíyīn: âm mũi), 鼻祖 (bízǔ: thủy tổ/người mở đầu).                                                                                               |
| 鼾      | hān    | Hãn      | 鼻 (mũi) + 干 (`gān`, thanh phù)       | [Tra bộ 鼻] Hình thanh: tiếng thở mạnh phát ra từ mũi họng khi ngủ say → tiếng ngáy, ngáy ngủ; _từ ghép:_ 打鼾 (dǎhān: ngủ ngáy), 鼾声 (hānshēng: tiếng ngáy).                                                                                                                               |
| 齁      | hōu    | Hâu      | 鼻 (mũi) + 句 (`jù/gōu`, thanh phù cổ) | [Tra bộ 鼻] Hình thanh: tiếng thở khò khè ở mũi họng (như người hen suyễn); trong khẩu ngữ miền Bắc còn dùng làm phó từ mức độ "quá đỗi / gắt" (nhất là vị ngọt/mặn gắt xộc lên mũi); _từ ghép:_ 齁甜 (hōutián: ngọt gắt), 齁咸 (hōuxián: mặn chát), 气喘齁齁 (qìchuǎn hōuhōu: thở khò khè). |

### Nhóm B: Bệnh lý & triệu chứng ở mũi

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                             |
| ------- | ------ | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 齄 / 齇 | zhā    | Tra      | 鼻 (mũi) + 且 (`qiě`, thanh phù) / dị thể `查` | [Tra bộ 鼻] Hình thanh: nốt sẩn đỏ trên chóp mũi (chứng mũi đỏ / mũi cà chua trong y học); _từ ghép:_ 酒齄鼻 / 酒糟鼻 (jiǔzhābí / jiǔzāobí: chứng mũi đỏ).                                 |
| 鼽      | qiú    | Cừu      | 鼻 (mũi) + 九 (`jiǔ`, thanh phù)               | [Tra bộ 鼻] Hình thanh: chứng nghẹt mũi, sổ mũi chảy nước mũi trong y học cổ truyền; _từ ghép:_ 鼻鼽 (bíqiú: viêm mũi dị ứng / nghẹt mũi Đông y), 鼽衄 (qiúnǜ: nghẹt mũi và chảy máu cam). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-084`):** `鼾`, `鼻涕`, `鼻音`, cùng hai bộ riêng liên quan về mặt ngũ quan là `自` (cổ tự chỉ cái mũi, phần đầu của `鼻`) và `口` (miệng — cùng trường nghĩa hô hấp/giác quan).
- **Chữ có liên hệ ngữ nghĩa/cổ tự với cái mũi (`自`) nhưng xếp ở bộ khác:**
  - `臭` (`chòu / xiù`, Xú/Khứu — `自 + 犬`, tra bộ **Tự `自`**): gốc vẽ con chó (`犬`) dùng mũi (`自`) đánh hơi → ngửi (`xiù`), nay nghĩa chính là mùi hôi (`臭味`).
  - `嗅` (`xiù`, Khứu — `口 + 臭`, tra bộ **Khẩu `口`**): ngửi bằng mũi (`嗅觉` khứu giác).
  - `息` (`xī`, Tức — `自 + 心`, tra bộ **Tâm `心`**): hơi thở ra vào từ mũi (`自`) kết nối tim (`心`) → hơi thở, nghỉ ngơi (`呼吸`, `休息`).
  - `擤` (`xǐng`, Hanh — `扌 + 鼻`, tra bộ **Thủ `扌`**): dùng tay bịt/bóp mũi để hỉ mũi ra (`擤鼻涕` xì mũi)! Đây là chữ thông dụng chứa nguyên chữ `鼻` ở bên phải.

---

## Bộ 210: 齊 (Tề)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-240` · `radical_index`: `240` · `radical`: `"齊 / 齐"` · `strokes`: `14` nét (chuẩn Khang Hy; Giản thể `齐` rút xuống `6` nét) · `name_vi`: `bộ Tề` · **Khang Hy:** `#210` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `齊` — dạng Phồn thể / đầy đủ (`14` nét: vẽ ba bông lúa hoặc hàng ngọn cao bằng nhau). Gặp rất nhiều trong thành phần bên phải của chữ Phồn thể như `劑, 濟, 擠, 臍, 霽` và chữ `齋` (nhà/ăn chay).
  - `齐` — dạng Giản thể chuẩn (`6` nét: phần đầu `文` rút gọn + hai nét `丨丨` ở đáy → `丶 一 丿 ㇏ 丿 丨`). Nhờ rút từ 14 nét xuống 6 nét, `齐` cực kỳ dễ nhận diện làm **thanh phù đọc `qí / jì / jǐ`** trong hàng loạt chữ hiện đại (`剂, 济, 挤, 脐, 霁`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cánh đồng lúa mì/ngũ cốc trổ bông cao bằng phẳng đều tăm tắp** (vào thời thu hoạch). Nghĩa gốc là "đều nhau, ngang bằng, chỉnh tề"; ngoài ra còn là tên nước **Tề** thời Xuân Thu – Chiến Quốc (ở Sơn Đông).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **đều đặn, ngay ngắn, chỉnh tề** (`整齐`), **đầy đủ không thiếu** (`齐全`), **cùng lúc/cùng nhau** (`一起/一齐`, `齐心`), và giữ vai trò **linh kiện thanh phù cực năng suất (`qí / jì / jǐ`)** trong hệ thống chữ ghép hiện đại.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Thấy chữ `齐` đứng một mình thường mang nghĩa đều, gọn, đủ, cùng nhau. Khi `齐` đứng làm thành phần phụ (thường bên phải hoặc bên dưới), chữ đó thường đọc quanh âm `qí / jì / jǐ`, còn nghĩa do bộ thủ chính đi kèm quyết định (`刂` dao cắt chia liều → `剂`, `氵` nước/sông → `济`, `扌` tay đẩy ép → `挤`, `月` thịt cơ thể → `脐`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`齐` (Tề — 6 nét) vs `齿` (Xỉ — răng, 8 nét):** Ở kích thước chữ nhỏ hoặc một số phông chữ, Giản thể `齐` (`文 + 儿/丨丨`) và `齿` (`止 + 人 + 凵`) đều có kết cấu trên-dưới đối xứng nên dễ nhìn lướt nhầm; nhưng `齐` trên là `文`, dưới không có khung `凵` bọc đáy, còn `齿` trên là `止`, dưới có khung `凵` ôm chữ `人`.
    - **`齐` (6 nét) vs `文` (4 nét):** `齐` có thêm hai nét sổ dưới phần `文` (một phẩy dài trái và một sổ thẳng phải); trong chữ `斋` (Giản thể của `齋`), `齐` bị lược mất hai nét đáy giống chữ `文` ôm `示` nhỏ bên dưới (`文` đầu là phần giản hóa của `齊`, tra bộ `文`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Chỉnh tề, đầy đủ & chữ gốc thuộc bộ `齊`

| Chữ Hán | Pinyin         | Hán Việt       | Thiên bàng đứng chung                                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                         |
| ------- | -------------- | -------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 齐 / 齊 | qí / jì / zhāi | Tề / Tễ / Trai | Độc thể (Bộ thủ chính)                                    | [Tra bộ 齊 / 齐] Tượng hình bông lúa bằng nhau → đều nhau, ngay ngắn, đầy đủ, cùng nhau; nước Tề; _từ ghép:_ 整齐 (zhěngqí: gọn gàng ngay ngắn), 齐全 (qíquán: đầy đủ), 一齐 (yìqí: cùng một lúc), 齐心协力 (qíxīn-xiélì: đồng tâm hiệp lực).                          |
| 斋 / 齋 | zhāi           | Trai           | Phồn: `齊` + `示` / Giản: `文` (lược từ `齊`) + `示` tỉnh | [Tra bộ 文 (giản) · bộ 齊 (phồn)] Tẩy rửa sạch sẽ chỉnh tề trước khi tế thần (`示`) → ăn chay, trai giới, phòng đọc sách thanh tịnh (thư phòng); _từ ghép:_ 斋戒 (zhāijiè: trai giới), 书斋 (shūzhāi: thư phòng), 吃斋 (chīzhāi: ăn chay), 聊斋 (Liáozhāi: Liêu Trai). |

### Nhóm B: Chữ thông dụng dùng `齐 / 齊` làm thành phần biểu âm

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                              |
| ------- | ------- | -------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 剂 / 劑 | jì      | Tễ       | 齐/齊 (`jì`, thanh phù) + 刂 (dao cắt)     | [Tra bộ 刀 / 刂] Hình thanh: cắt chia nguyên liệu đều đặn theo liều lượng → liều thuốc, chế phẩm hóa chất, lượng từ liều thuốc; _từ ghép:_ 药剂 (yàojì: dược phẩm/liều thuốc), 剂量 (jìliàng: liều lượng), 催化剂 (cuīhuàjì: chất xúc tác).                                 |
| 济 / 濟 | jì / jǐ | Tế / Tể  | 氵 (nước) + 齐/齊 (`jì`, thanh phù)        | [Tra bộ 水 / 氵] Hình thanh: lội qua sông (`氵`), cứu giúp người qua hoạn nạn, kinh tế (`jì`); tên sông Tế Thủy / Tế Nam (`jǐ`); _từ ghép:_ 经济 (jīngjì: kinh tế), 救济 (jiùjì: cứu tế), 济南 (Jǐnán: Tế Nam), 同舟共济 (tóngzhōu-gòngjì: cùng hội cùng thuyền giúp nhau). |
| 挤 / 擠 | jǐ      | Tễ       | 扌 (tay) + 齐/齊 (`jǐ`, thanh phù)         | [Tra bộ 手 / 扌] Hình thanh: dùng tay (`扌`) ép dồn lại cho khít nhau → chen lấn, xô đẩy, ép vắt; _từ ghép:_ 拥挤 (yōngjǐ: đông đúc chen chúc), 挤牛奶 (jǐ niúnǎi: vắt sữa bò), 挤眉弄眼 (jǐméi-nòngyǎn: nháy mắt ra hiệu).                                                 |
| 脐 / 臍 | qí      | Tề       | 月 (thịt/cơ thể) + 齐/齊 (`qí`, thanh phù) | [Tra bộ 肉 / 月] Hình thanh: phần lõm chính giữa ngang đều trên bụng (`月`) → cái rốn; _từ ghép:_ 肚脐 (dùqí: cái rốn), 脐带 (qídài: dây rốn).                                                                                                                              |
| 霁 / 霽 | jì      | Tế       | 雨 (mưa) + 齐/齊 (`jì`, thanh phù)         | [Tra bộ 雨] Hình thanh: mưa tạnh mây tan trời quang sáng sủa; _từ ghép:_ 雨霁 (yǔjì: mưa tạnh), 光风霁月 (guāngfēng-jìyuè: gió mát trăng thanh — phẩm chất quang minh lỗi lạc).                                                                                             |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-240`):** `齐`, `剂 / 劑`, `济 / 濟`, `挤 / 擠`, cùng `齿 / 齒` (bộ riêng dễ nhìn nhầm trong hệ Giản thể).
- **Tổng hợp chữ chứa `齊 / 齐` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `剂 / 劑` (`jì`, tra bộ **Đao `刂`**): liều thuốc, chế phẩm (`试剂`, `一剂药`).
  - `济 / 濟` (`jì / jǐ`, tra bộ **Thủy `氵`**): kinh tế, cứu giúp (`经济`, `救济`).
  - `挤 / 擠` (`jǐ`, tra bộ **Thủ `扌`**): chen lấn, nặn vắt (`拥挤`, `挤出`).
  - `脐 / 臍` (`qí`, tra bộ **Nhục `月`**): rốn (`肚脐`, `脐橙` cam rốn).
  - `霁 / 霽` (`jì`, tra bộ **Vũ `雨`**): tạnh mưa, trời quang (`光风霁月`).
  - `斋 / 齋` (`zhāi`, Trai — Phồn thể tra bộ **Tề `齊`**, Giản thể `文` đầu tra bộ **Văn `文`**): ăn chay, thư phòng (`书斋`, `斋饭`).
  - `荠 / 薺` (`jì`, Tễ — `艹 + 齐/齊`, tra bộ **Thảo `艹`**): rau tề (`荠菜`).

---

## Bộ 211: 齒 (Xỉ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-083` · `radical_index`: `83` · `radical`: `"齒"` (lưu ý dòng chính DB ghi `"齒"` trong cột `radical`, còn mảng `variants` đã chứa cả `齒` và `齿`) · `strokes`: `15` nét (chuẩn Khang Hy; Giản thể `齿` rút xuống `8` nét) · `name_vi`: `bộ Xỉ` · **Khang Hy:** `#211`.
- **Ghi chú dòng trùng / rỗng:** Trong DB hiện có **1 dòng rỗng phụ** là `radical-241` (`radical_index`: `241`, `radical`: `"齒 / 齿"`, `name_vi: null`, `strokes: null`). Cần dọn dòng `radical-241` khi chuẩn hóa DB, giữ dòng chính `radical-083`.
- **Hình thái & Biến thể (`variants`):**
  - `齒` — dạng Phồn thể / đầy đủ (`15` nét: phía trên là `止` đóng vai trò thanh phù cổ `zhǐ/chǐ`; phía dưới là khung `凵` mở lên chứa 4 hình `人` nhỏ xếp 2 tầng biểu thị hai hàm răng trên-dưới khép vào nhau). Trong chữ ghép (`齡, 齦, 齲, 齟, 齬`), `齒` đứng ở **bên trái**.
  - `齿` — dạng Giản thể chuẩn (`8` nét: giữ nguyên phần đầu `止`, rút gọn hai tầng răng bên trong thành **1 chữ `人` lớn nằm trong khung `凵`** → `丨 一 丨 一 丿 丶 ∟ 丨`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hình thanh kiêm tượng hình: Giáp cốt văn ban đầu chỉ vẽ **hàm răng trên và hàm răng dưới** với các răng đều đặn bên trong khuôn miệng; về sau thêm `止` lên trên làm thanh phù tạo thành `齒`.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **răng, hàm răng** (`牙齿`, `乳齿` răng sữa, `恒齿` răng vĩnh viễn), mở rộng sang:
    1. **Tuổi tác** (`年龄`, `高龄` — do thời xưa phán đoán tuổi người/ngựa qua chu kỳ mọc và rụng răng);
    2. **Hành động nhai, cắn, gặm và các dị tật/trạng thái của răng** (`啮, 龋, 龈, 龇, 龅`);
    3. **Vật có hình răng cưa** (`齿轮` bánh răng) và nghĩa bóng khập khiễng/bẩn thỉu (`龃龉`, `龌龊`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Có `齒 / 齿` (thường ở bên trái) gần như chắc chắn liên quan đến răng, lợi, tuổi tác, hành động cắn gặm hoặc răng cưa.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`齒 / 齿` (Xỉ) vs `牙` (Nha — ngà / răng, bộ riêng 4 nét):** Cả hai đều nghĩa là răng và kết hợp trong từ ghép quen thuộc `牙齿` (`yáchǐ`), nhưng phân công hiện đại hơi khác: `牙` thiên về **răng nói chung trong đời sống và nha khoa** (`刷牙` đánh răng, `牙医` nha sĩ, `牙膏` kem đánh răng), còn `齿` trang trọng/học thuật hơn (chỉ răng hàm, tuổi tác `年龄`, bánh răng `齿轮`, sâu răng `龋齿`).
    - **`齿` (8 nét) vs `齐` (6 nét, Giản thể của `齊`):** Cả hai dễ nhìn nhầm ở cỡ chữ nhỏ: `齿` có phần đầu là **`止`** và đáy là **`凵` bọc `人`**; `齐` có phần đầu là **`文`** và đáy chỉ có hai nét sổ `丿 丨`.
    - **`齿` vs `止`:** `止` là phần đầu phía trên của `齿`, vốn được thêm vào để gợi âm `chǐ` trong Phồn thể `齒`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Răng, tuổi tác & giải phẫu – bệnh lý nha khoa

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                          |
| ------- | ------ | -------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 齿 / 齒 | chǐ    | Xỉ       | Độc thể (Bộ thủ chính: `止` trên + hàm răng dưới) | [Tra bộ 齒 / 齿] Tượng hình hàm răng thêm thanh phù `止` → răng, tuổi tác, bánh răng, xếp ngang hàng nhắc tới (`不齿` khinh bỉ không nhắc tới); _từ ghép:_ 牙齿 (yáchǐ: răng), 齿轮 (chǐlún: bánh răng), 启齿 (qǐchǐ: mở miệng nói ra). |
| 龄 / 齡 | líng   | Linh     | 齿/齒 + 令 (`lìng`, thanh phù)                    | [Tra bộ 齒 / 齿] Hình thanh: tuổi tác (căn cứ vào số năm mọc/thay răng) → tuổi, năm tuổi, niên hạn; _từ ghép:_ 年龄 (niánlíng: tuổi tác), 工龄 (gōnglíng: thâm niên công tác), 高龄 (gāolíng: tuổi cao).                                |
| 龈 / 齦 | yín    | Ngân     | 齿/齒 + 艮 (`gěn`, thanh phù)                     | [Tra bộ 齒 / 齿] Hình thanh: phần thịt hồng ôm quanh chân răng → lợi, nướu răng; _từ ghép:_ 牙龈 (yáyín: nướu/lợi răng), 牙龈出血 (yáyín chūxuè: chảy máu chân răng).                                                                   |
| 龋 / 齲 | qǔ     | Củ       | 齿/齒 + 禹 (`yǔ`, thanh phù)                      | [Tra bộ 齒 / 齿] Hình thanh: bệnh sâu đục lỗ trên răng → sâu răng; _từ ghép:_ 龋齿 (qǔchǐ: sâu răng / răng sâu).                                                                                                                        |

### Nhóm B: Hành động cắn gặm, trạng thái & hình dáng răng

| Chữ Hán | Pinyin | Hán Việt      | Thiên bàng đứng chung                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                           |
| ------- | ------ | ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 啮 / 齧 | niè    | Niết / Nghiệt | Giản: `口` + `齿` / Phồn: `韧` tỉnh + `齒` | [Tra bộ 口 (giản) · bộ 齒 (phồn)] Dùng răng cắn, gặm nhấm, khớp vào nhau (bánh răng); _từ ghép:_ 啮合 (nièhé: ăn khớp), 啮齿动物 (nièchǐ dòngwù: động vật gặm nhấm).     |
| 龇 / 齜 | zī     | Tư / Tỳ       | 齿/齒 + 此 (`cǐ`, thanh phù)               | [Tra bộ 齒 / 齿] Hình thanh: nhe răng, nhăn mặt để lộ hàm răng ra ngoài; _từ ghép:_ 龇牙咧嘴 (zīyá-liězuǐ: nhe răng nhăn mặt vì đau/hung dữ).                            |
| 龅 / 齙 | bāo    | Bào           | 齿/齒 + 包 (`bāo`, thanh phù)              | [Tra bộ 齒 / 齿] Hình thanh: răng cửa hàm trên mọc chìa ra ngoài không ngậm kín môi → răng hô/răng vẩu; _từ ghép:_ 龅牙 (bāoyá: răng hô/vẩu).                            |
| 龆 / 齠 | tiáo   | Thiều         | 齿/齒 + 召 (`zhào`, thanh phù cổ)          | [Tra bộ 齒 / 齿] Hình thanh: thời kỳ trẻ em thay răng sữa (khoảng 7–8 tuổi) → tuổi ấu thơ; _từ ghép:_ 龆年 (tiáonián: tuổi thơ ấu), 龆龀 (tiáochèn: tuổi thay răng sữa). |

### Nhóm C: Khớp răng, tính chất & thành ngữ văn ngôn – hiện đại

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                |
| ------- | ------ | -------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 龃 / 齟 | jǔ     | Trở / Tử | 齿/齒 + 且 (`qiě`, thanh phù) | [Tra bộ 齒 / 齿] Hình thanh: răng mọc lệch không khớp vào nhau; dùng cố định trong từ ghép chỉ sự bất hòa; _từ ghép:_ 龃龉 (jǔyǔ: bất đồng, trục trặc không ăn khớp).         |
| 龉 / 齬 | yǔ     | Ngữ      | 齿/齒 + 吾 (`wú`, thanh phù)  | [Tra bộ 齒 / 齿] Hình thanh: răng so le khấp khểnh không ăn khớp với hàm đối diện; _từ ghép:_ 龃龉 (jǔyǔ: xích mích, bất hòa).                                                |
| 龊 / 齪 | chuò   | Xúc      | 齿/齒 + 足 (`zú`, thanh phù)  | [Tra bộ 齒 / 齿] Hình thanh: nghĩa gốc là răng mọc khít nhỏ hẹp/cẩn trọng, kết hợp với `龌` thành nghĩa bẩn thỉu, ti tiện; _từ ghép:_ 龌龊 (wòchuò: dơ bẩn, hèn hạ, ti tiện). |
| 龌 / 齷 | wò     | Ác / Ốc  | 齿/齒 + 屋 (`wū`, thanh phù)  | [Tra bộ 齒 / 齿] Hình thanh: nhỏ hẹp, chật chội, bẩn thỉu về vật chất lẫn nhân cách; _từ ghép:_ 龌龊 (wòchuò: bẩn thỉu, đê hèn).                                              |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-083`):** `龄 / 齡`, `齐 / 齊` (bộ riêng dễ nhìn nhầm trong Giản thể), `牙` (bộ riêng nghĩa răng/ngà) và `口` (bộ Khẩu — miệng).
- **Chữ chứa `齒 / 齿` ở vị trí phụ hoặc liên hệ gần nhưng xếp ở bộ khác:**
  - `啮` (`niè`, Niết — `口 + 齿`, tra bộ **Khẩu `口`** ở Giản thể; Phồn thể `齧` tra bộ **Xỉ `齒`**): cắn, gặm, ăn khớp (`啮合`).
  - `咬` (`yǎo`, Giảo — `口 + 交`, tra bộ **Khẩu `口`**): cắn (từ động tác thông dụng nhất trong khẩu ngữ thay cho các động từ cổ bộ `齒`: `咬一口` cắn một miếng).
  - `止` (`zhǐ`, Chỉ — bộ thủ riêng): tạo nên phần đầu chữ `齒 / 齿` (giải thích chi tiết ở Bộ 53).

---

## Bộ 212: 龍 (Long)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-242` · `radical_index`: `242` · `radical`: `"龍 / 龙"` · `strokes`: `16` nét (chuẩn Khang Hy; Giản thể `龙` rút xuống `5` nét) · `name_vi`: `bộ Long` · **Khang Hy:** `#212` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `龍` — dạng Phồn thể / đầy đủ (`16` nét: bên trái là `立` + `月` vẽ đầu và sừng rồng; bên phải vẽ thân rồng uốn lượn vảy gai). Dùng trong các chữ Phồn thể như `龐, 龔, 龕, 籠, 聾, 壟, 寵, 襲`.
  - `龙` — dạng Giản thể chuẩn (`5` nét: `一 丿 乚 丿 丶` — lấy dáng thảo thư của chữ `龍`, lược toàn bộ nét phức tạp thành một chữ gọn `5` nét!). Lưu ý nét cuối của `龙` là dấu chấm `丶` ở góc trên-phải.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **con rồng** — linh vật thần thoại tối cao trong văn hóa Á Đông (đầu có sừng, râu và thân dài uốn lượn như mây/rắn).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **rồng, biểu tượng hoàng gia – quyền uy – may mắn – sức mạnh lớn lao** (`龙舟` thuyền rồng, `恐龙` khủng long, `龙卷风` vòi rồng/lốc xoáy); trong chữ ghép Giản thể, `龙` đóng vai trò **thanh phù đọc `lóng / lǒng / chǒng`** cực kỳ phổ biến ở nhiều bộ thủ khác (`笼, 聋, 垄, 宠, 庞`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Trong từ vựng hiện đại, khi `龙` đứng độc lập thường nói về rồng hoặc hình tượng uốn lượn/khổng lồ (`恐龙, 龙卷风, 水龙头` vòi nước). Khi `龙` nằm trong chữ ghép (`笼, 聋, 垄`), nó chủ yếu **chỉ âm `lóng / lǒng`**, còn nghĩa do bộ đi kèm quyết định (`⺮` → cái lồng `笼`, `耳` → bị điếc `聋`, `土` → luống đất `垄`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`龙` (Long — 5 nét) vs `尤` (Vưu — 4 nét):** Cực kỳ hay viết nhầm! `尤` chỉ có **4 nét** (`一 丿 乚 丶`, KHÔNG có nét phẩy chéo cắt ngang vào nét sổ cong móc `乚`); `龙` có **5 nét** (`一 丿 乚 丿 丶`, có thêm **1 nét phẩy `丿` vắt chéo qua thân nét cong móc**).
    - **Không suy đoán nghĩa rồng cho mọi chữ có `龙`:** `聋` (điếc), `笼` (cái lồng), `垄` (luống ruộng) đều mượn `龙` để biểu âm, không liên quan trực tiếp đến con rồng.
    - **Biến động bộ thủ khi Giản thể hóa:** Chữ `龐` (to lớn, họ Bàng) ở Phồn thể tra bộ `龍`, sang Giản thể `庞` tra bộ **`广`**; tương tự `龙` (5 nét) trong từ điển giản thể xếp vào bộ **`龙`** (hoặc bộ `尤`/`丿` ở một số sách cũ).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Rồng, quyền uy & các chữ truyền thống thuộc bộ `龍`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                             |
| ------- | ------ | -------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 龙 / 龍 | lóng   | Long     | Độc thể (Bộ thủ chính)                                   | [Tra bộ 龍 / 龙] Tượng hình linh vật rồng → con rồng, hoàng đế, vật dài uốn lượn, họ Long; _từ ghép:_ 恐龙 (kǒnglóng: khủng long), 龙卷风 (lóngjuǎnfēng: lốc xoáy), 龙舟 (lóngzhōu: thuyền rồng), 画龙点睛 (huàlóng-diǎnjīng: vẽ rồng điểm mắt — điểm chốt làm bừng sáng). |
| 庞 / 龐 | páng   | Bàng     | 广 (nhà lớn) + 龙/龍 (`lóng`, thanh phù cổ)              | [Tra bộ 广 (giản) · bộ 龍 (phồn)] Hình thanh kiêm hội ý: ngôi nhà cao to vĩ đại → to lớn, đồ sộ, đông đúc, gương mặt (mặt mũi), họ Bàng; _từ ghép:_ 庞大 (pángdà: to lớn/khổng lồ), 面庞 (miànpáng: khuôn mặt).                                                            |
| 龚 / 龔 | gōng   | Cung     | 龙/龍 (`lóng`) + 共 (`gòng`, thanh phù kiêm ý cung kính) | [Tra bộ 龍 / 龙] Hình thanh cổ: dâng lên cung kính (cổ thông với `供`/`恭`), nay dùng phổ biến làm họ người (họ Cung); _từ ghép:_ 姓龚 (xìng Gōng: mang họ Cung).                                                                                                          |
| 龛 / 龕 | kān    | Kham     | 合 (`hé`, thanh phù/mái che) + 龙/龍                     | [Tra bộ 龍 / 龙] Hình thanh/hội ý cổ: hốc tường/tủ thờ chạm rồng để đặt tượng Phật, thần vị hoặc bài vị tổ tiên → khám thờ; _từ ghép:_ 佛龛 (fókān: khám thờ Phật), 神龛 (shénkān: khám thờ thần).                                                                         |

### Nhóm B: Chữ thông dụng dùng `龙 / 龍` làm thành phần biểu âm ở bộ khác

| Chữ Hán | Pinyin      | Hán Việt | Thiên bàng đứng chung                       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                         |
| ------- | ----------- | -------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 笼 / 籠 | lóng / lǒng | Lung     | ⺮ (tre trúc) + 龙/龍 (`lóng`, thanh phù)   | [Tra bộ 竹 / ⺮] Hình thanh: dụng cụ đan bằng tre (`⺮`) → cái lồng chim, xửng hấp (`lóng`); trùm phủ, bao bọc (`lǒng`); _từ ghép:_ 笼子 (lóngzi: cái lồng), 灯笼 (dēnglong: đèn lồng), 笼罩 (lǒngzhào: bao trùm).     |
| 聋 / 聾 | lóng        | Lung     | 龙/龍 (`lóng`, thanh phù) + 耳 (tai)        | [Tra bộ 耳] Hình thanh: tai (`耳`) mất thính lực → điếc; _từ ghép:_ 耳聋 (ěrlóng: điếc tai), 聋哑 (lóngyǎ: câm điếc), 震耳欲聋 (zhèn'ěr-yùlóng: vang động như muốn điếc tai).                                          |
| 垄 / 壟 | lǒng        | Lũng     | 龙/龍 (`lóng`, thanh phù) + 土 (đất)        | [Tra bộ 土] Hình thanh: gò đất (`土`) đắp dài thành luống ruộng, bờ thửa, gò mộ; mở rộng thành độc chiếm thị trường (độc quyền); _từ ghép:_ 垄断 (lǒngduàn: độc quyền/lũng đoạn), 田垄 (tiánlǒng: bờ ruộng/luống cày). |
| 宠 / 寵 | chǒng       | Sủng     | 宀 (mái nhà) + 龙/龍 (`lóng`, thanh phù cổ) | [Tra bộ 宀] Hình thanh kiêm hội ý: rồng quý vào nhà → được tôn quý, yêu chiều, sủng ái; _từ ghép:_ 宠爱 (chǒng'ài: cưng chiều), 宠物 (chǒngwù: thú cưng), 失宠 (shīchǒng: thất sủng).                                  |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-242`):** `龙`, `笼 / 籠`, `聋 / 聾`, `垄 / 壟`, cùng hai bộ động vật/thần thú riêng là `虫` (côn trùng/rắn rết cổ) và `龟` (rùa).
- **Chữ chứa `龍 / 龙` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `宠 / 寵` (`chǒng`, Sủng — `宀 + 龙/龍`, tra bộ **Miên `宀`**): cưng chiều, thú cưng (`宠物`, `宠坏`).
  - `拢 / 攏` (`lǒng`, Lũng — `扌 + 龙/龍`, tra bộ **Thủ `扌`**): thu gom lại, chải gọn (`拉拢` lôi kéo, `合拢` khép lại).
  - `胧 / 朧` (`lóng`, Lung — `月 + 龙/龍`, tra bộ **Nguyệt `月`**): trăng mờ ảo (`朦胧` mông lung, mờ ảo).
  - `咙 / 嚨` (`lóng`, Lung — `口 + 龙/龍`, tra bộ **Khẩu `口`**): cổ họng (`喉咙`).
  - `珑 / 瓏` (`lóng`, Lung — `王 + 龙/龍`, tra bộ **Ngọc `玉 / 王`**): ngọc đẹp chạm trổ tinh xảo (`玲珑` linh lung/khéo léo nhỏ nhắn).
  - `袭 / 襲` (`xí`, Tập — `龙/龍 + 衣`, tra bộ **Y `衣`**): tập kích, kế thừa, mặc áo dài (`袭击` tập kích, `抄袭` sao chép/đạo văn).

---

## Bộ 213: 龜 (Quy)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-243` · `radical_index`: `243` · `radical`: `"龜 / 龟"` · `strokes`: `16` nét (chuẩn Khang Hy; Giản thể `龟` rút xuống `7` nét) · `name_vi`: `bộ Quy` · **Khang Hy:** `#213` · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `龜` — dạng Phồn thể / đầy đủ (`16` nét: phần bên trái là đầu `⺈` + thân + chân, bên phải là đường viền mai rùa có các đốt mai và đuôi cong).
  - `龟` — dạng Giản thể chuẩn (`7` nét: `丿 𠃍 丨 𠃍 一 一 乚` — rút từ hình dáng đơn giản của con rùa nhìn nghiêng/trước: đầu `⺈` + mai `日` + nét sổ cong móc `乚` kéo dài làm đuôi).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **con rùa** có đầu vươn ra, mai lớn gồ và đuôi ngắn. Trong văn hóa nhà Thương – Chu, mai rùa (`龟甲`) là vật liệu tối quan trọng dùng để khắc chữ Giáp cốt và đốt xem quẻ bói toán.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chỉ **con rùa, mai rùa** (`乌龟, 海龟, 龟壳`), tượng trưng **sự trường thọ** (`龟寿`), và trong từ ghép `龟裂` (đọc âm `jūnliè`) mang nghĩa **"nứt nẻ thành từng ô giống vân mai rùa"** (đất khô nứt nẻ, da tay nứt nẻ).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Số lượng chữ độc lập thuộc bộ `龜 / 龟` trong từ điển rất ít (chủ yếu chính chữ `龟` và vài dị thể cổ), nhưng `龟` lại xuất hiện đều đặn trong tên các loài rùa và thành ngữ, từ vựng đời sống (`乌龟, 龟壳, 龟裂, 抓阄`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **Đa âm đọc của `龟`:** Thông thường đọc là **`guī`** (`乌龟` con rùa, `海龟` rùa biển, `龟壳` mai rùa); đọc là **`jūn`** trong `龟裂` (nứt nẻ như vân mai rùa — không đọc `guīliè` và không hiểu thành "con rùa bị nứt"); đọc là **`Qiū`** trong địa danh cổ Tây Vực `龟兹` (Quy Tư).
    - **`龟` (7 nét) vs `鱼` (8 nét) & `色` (6 nét):** Cả ba đều có đầu `⺈`, nhưng `龟` có khung giữa là `曰`-dạng bị nét sổ cong móc `乚` xuyên thẳng từ trong ra đáy; `鱼` đóng kín ngang ở đáy; `色` không có nét ngang đáy bên trong `巴` và có thêm nét sổ ngăn dọc.
    - **`龜 / 龟` (rùa) vs `黽 / 黾` (ếch nhái cổ):** `黾` là bộ 205 (hiếm), `龟` là bộ 213 chuyên về rùa.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Rùa, mai rùa & dị thể cổ thuộc bộ `龜`

| Chữ Hán | Pinyin          | Hán Việt          | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                    |
| ------- | --------------- | ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 龟 / 龜 | guī / jūn / qiū | Quy / Quân / Khâu | Độc thể (Bộ thủ chính)              | [Tra bộ 龜 / 龟] Tượng hình con rùa có mai và đuôi → con rùa (`guī`); nứt nẻ vân mai (`jūn`); địa danh cổ (`qiū`); _từ ghép:_ 乌龟 (wūguī: con rùa), 海龟 (hǎiguī: rùa biển / du học sinh về nước — hài âm `海归`), 龟壳 (guīké: mai rùa), 龟裂 (jūnliè: nứt nẻ). |
| 龞      | biē             | Miết              | 敝 (`bì/biē`, thanh phù) + 龜 (rùa) | [Tra bộ 龜 / 黽] Dị thể cổ của chữ `鼈 / 鳖` (con ba ba — loài rùa mai mềm nước ngọt); hiện đại chuẩn hóa viết là `鳖` (thuộc bộ `鱼`).                                                                                                                           |
| 龝      | qiū             | Thu               | 龜 + 禾 (lúa)                       | [Tra bộ 龜] Dị thể cổ cực hiếm của chữ `秋` (mùa thu — tương truyền cổ nhân lấy hình con vật giao mùa kết hợp cây lúa); hiện đại không dùng, chỉ gặp khi tra tự điển cổ.                                                                                          |

### Nhóm B: Chữ thông dụng hiện đại chứa `龟 / 龜` xếp ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                  |
| ------- | ------ | -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 阄 / 鬮 | jiū    | Cưu      | Phồn: `鬥` (đấu) + `龜` / Giản: `门` + `龟` | [Tra bộ 門 / 门 (giản) · bộ 鬥 (phồn)] Hình thanh/hội ý cổ: lá thăm làm từ mảnh thẻ/mai bói viết chữ để bốc chọn công bằng → lá thăm, phiếu rút thăm; _từ ghép:_ 抓阄 (zhuājiū: bốc thăm / bắt thăm), 拈阄 (niānjiū: rút thăm). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-243`):** `龟`, `龟壳`, `乌龟`, `龟裂`, cùng hai bộ riêng liên quan là `黽 / 黾` (lưỡng cư/bò sát cổ) và `卜` (bói toán — gắn với văn hóa đốt mai rùa Giáp cốt).
- **Chữ chứa `龟 / 龜` hoặc liên quan ngữ nghĩa ở bộ khác:**
  - `阄 / 鬮` (`jiū`, Cưu — `门 + 龟`, tra bộ **Môn `门`** [giản] / **Đấu `鬥`** [phồn]): bắt thăm (`抓阄`).
  - `甲` (`jiǎ`, Giáp — tra bộ **Điền `田`**): mai rùa / giáp xác (`龟甲` mai rùa dùng khắc chữ Giáp cốt `甲骨文`).
  - `卜` (`bǔ`, Bốc — bộ thủ riêng): mô phỏng vết nứt hình chữ T/Y trên mai rùa khi đốt nóng để bói (`占卜` bói toán).

---

## Bộ 214: 龠 (Dược)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-244` · `radical_index`: `244` · `radical`: `"龠"` · `strokes`: `17` nét · `name_vi`: `bộ Dược / Sáo cổ` · **Khang Hy:** `#214` (bộ cuối cùng trong hệ thống 214 bộ thủ Khang Hy) · **Dòng trùng/rỗng:** Không có.
- **Hình thái & Biến thể (`variants`):**
  - `龠` — dạng chính duy nhất (`17` nét: phần đỉnh là `亼` + `一`, ở giữa là ba chữ `口` xếp ngang `品`-biến thể chỉ các lỗ thổi/miệng ống, bên dưới là khung `冊` gồm nhiều ống tre ghép thành hàng thẳng), thống nhất giữa Giản thể và Phồn thể.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cây sáo cổ ghép nhiều ống trúc** (tương tự khèn bè/sáo Pan, thường có 3 hoặc 6 lỗ thổi ở trên và các ống tre buộc thành hàng `冊` ở dưới); đồng thời trong thời cổ đại còn là **đơn vị đong dung tích ngũ cốc nhỏ** (1 _dược_ chứa khoảng 1.200 hạt kê).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Đây là bộ nhiều nét nhất và là **bộ đứng cuối cùng (#214)** của từ điển Khang Hy; tần suất trong tiếng Trung giao tiếp hiện đại cực thấp. Nghĩa chính gặp trong **tài liệu âm nhạc cổ, lễ nhạc, thư pháp chữ Hán cổ và tên chữ cổ** (`龢` = hòa hợp, `籥` = sáo cổ/chìa khóa cổ, `籲` = kêu gọi).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh (`recognition`):_ Thấy khối `龠` gần như chắc chắn chữ đó thuộc lớp từ vựng cổ liên quan đến **nhạc khí hơi (ống sáo), tiếng thổi, sự hòa âm hoặc nghi thức khẩn cầu cổ đại**.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`龠` (Sáo cổ — 17 nét) vs `笛 / 箫` (Sáo/tiêu hiện đại — dùng bộ `竹 / ⺮`):** Ngày nay sáo trúc nói chung là `笛子`, ống tiêu là `箫`, kèn sáo hầu hết mang bộ `竹 / ⺮` ở đầu thay cho `龠`.
    - **`龠` vs `音` (Âm) / `声` (Thanh):** Từ vựng hiện đại chỉ âm thanh, âm nhạc đều dùng `音` (`音乐, 声音`), `声` (`声调`), không dùng `龠`.
    - **`龢` (bộ `龠`) vs `和` (bộ `口`):** `龢` là chữ cổ chuyên chỉ "âm nhạc hòa nhịp hài hòa", sau được dùng chung với chữ `和` (`hé` — hòa bình, và); nay ở Việt Nam/Hàn Quốc/Đài Loan trong biển hiệu truyền thống hoặc thư pháp vẫn còn gặp `龢`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Sáo cổ, hơi thổi & sự hòa âm thuộc bộ `龠`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                     |
| ------- | ------ | -------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 龠      | yuè    | Dược     | Độc thể (Bộ thủ chính)                     | [Tra bộ 龠] Tượng hình cây sáo nhiều ống trúc có ba miệng lỗ thổi → sáo cổ nhiều ống; đơn vị đong nhỏ thời cổ; _từ ghép:_ 管龠 (guǎnyuè: ống sáo và khóa cổ / yếu lĩnh then chốt).                 |
| 龢      | hé     | Hòa      | 龠 (nhạc cụ hòa âm) + 禾 (`hé`, thanh phù) | [Tra bộ 龠] Hình thanh kiêm hội ý: tiếng sáo nhiều ống hòa quyện nhịp nhàng → hòa âm, hài hòa (chữ cổ tương ứng nghĩa hài hòa của `和`); _từ ghép:_ 龢谐 (héxié: cách viết cổ của `和谐` hài hòa). |
| 龡      | chuī   | Xuy      | 龠 (sáo) + 欠 (há miệng hà hơi)            | [Tra bộ 龠] Hội ý: người há miệng thổi hơi (`欠`) vào ống sáo (`龠`) → thổi (dị thể cổ của chữ `吹`, nay dùng `吹` bộ `口`); _từ ghép:_ 龡嘘 (chuīxū: thổi hơi — cổ văn).                          |
| 龤      | xié    | Hài      | 龠 (sáo) + 皆 (`jiē`, thanh phù)           | [Tra bộ 龠] Hình thanh cổ: âm thanh tấu nhạc hòa hợp ăn ý nhau (cổ tự của chữ `谐`, nay dùng `谐` bộ `言/讠` trong `和谐`; Thuyết Văn giải tự chú giải: "乐和龤也").                               |

### Nhóm B: Chữ chứa `龠` trong nhạc cụ cổ & hành động khẩn cầu xếp ở bộ khác

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                              |
| ------- | ------ | -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 籥      | yuè    | Dược     | ⺮ (tre trúc) + 龠 (`yuè`, thanh phù kiêm ý sáo)          | [Tra bộ 竹 / ⺮] Hình thanh kiêm hội ý: ống sáo làm từ tre trúc (`⺮`), cổ văn còn chỉ thanh then khóa hòm/cổng thành; _từ ghép:_ 启籥 (qǐyuè: mở khóa hộp sách cổ xem bói/tài liệu quý).                                                   |
| 吁 / 籲 | yù     | Dụ / Dục | Phồn: `⺮ + 龠 + 頁` (`籲`) / Giản: mượn `吁` (`口 + 于`) | [Tra bộ 口 (giản `吁`) · bộ 竹 (phồn `籲`)] Phồn thể `籲` vẽ tiếng hòa tấu/hô vang khẩn thiết bằng cả hơi sáo (`龠`) lẫn đầu mặt (`頁`) → kêu gọi, thỉnh cầu (`yù`); Giản thể gộp dùng chữ `吁`; _từ ghép:_ 呼吁 (hūyù: kêu gọi, khẩn cầu). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-244`):** `龠`, `籥`, `龢`, cùng hai bộ thủ thông dụng hơn về âm nhạc và vật liệu làm sáo là `音` (âm thanh) và `竹 / ⺮` (tre trúc).
- **Chữ dùng nhạc khí/cách viết thay thế cho lớp chữ `龠` trong tiếng Trung hiện đại:**
  - `和` (`hé`, Hòa — `禾 + 口`, tra bộ **Khẩu `口`**): thay thế `龢` trong tiếng Trung hiện đại (`和谐`, `和平`).
  - `吹` (`chuī`, Xuy — `口 + 欠`, tra bộ **Khẩu `口`**): thay thế `龡` cho nghĩa thổi (`吹笛子` thổi sáo).
  - `谐` (`xié`, Hài — `讠 + 皆`, tra bộ **Ngôn `讠`**): thay thế `龤` cho nghĩa hài hòa (`和谐`, `诙谐`).
  - `呼吁` (`hūyù`, Hô dụ — Giản thể dùng `吁` thuộc bộ **Khẩu `口`**; Phồn thể viết `呼籲` với `籲` chứa `龠` thuộc bộ **Trúc `竹`**): kêu gọi, thỉnh cầu.
  - `笛` (`dí`, Địch — `⺮ + 由`, tra bộ **Trúc `竹`**): cây sáo trúc thông dụng trong đời sống hiện đại (`笛子`).
