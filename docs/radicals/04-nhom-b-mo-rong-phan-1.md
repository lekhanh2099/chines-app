# Nhóm B (Mở rộng — Phần 1): 11 Bộ Thủ Từ 32 Đến 42

Tài liệu này biên soạn chi tiết **11 bộ thủ thuộc Nhóm B — Phần 1** (`32. 月`, `33. 肉`, `34. 阜`, `35. 邑`, `36. 辵`, `37. 欠`, `38. 巾`, `39. 示`, `40. 禾`, `41. 疒`, `42. 子`), ánh xạ trực tiếp vào schema bảng `public.hanzihome_radicals` theo quy chuẩn trong [README.md](./README.md).

> **Lưu ý về tình trạng DB:** Trong 11 bộ ở phần này, **10/11 bộ đã có dữ liệu chính** trong `hanzihome_radicals` (trong đó có **6 dòng rỗng trùng lặp** cần lưu ý: `radical-164`, `radical-202`, `radical-195`, `radical-194`, `radical-151`, `radical-153`), và **1 bộ chưa có trong DB** cần đề xuất bổ sung mới là **Bộ 38 `巾` (Cân)**.

---

## Mục lục nhanh (Bộ 32 -> Bộ 42)

| STT | Bộ thủ | Hán Việt | Trạng thái DB                 | DB ID chính   | `radical_index` | Số nét | Số chữ giải nghĩa | Liên kết nhanh                         |
| :-: | :----: | -------- | ----------------------------- | ------------- | :-------------: | :----: | :---------------: | -------------------------------------- |
| 32  |   月   | Nguyệt   | Đã có                         | `radical-019` |       19        |   4    |        15         | [Bộ 32: 月 (Nguyệt)](#bộ-32-月-nguyệt) |
| 33  |   肉   | Nhục     | Đã có (`radical-164` rỗng)    | `radical-020` |       20        |   6    |        21         | [Bộ 33: 肉 (Nhục)](#bộ-33-肉-nhục)     |
| 34  |   阜   | Phụ      | Đã có (`radical-202` rỗng)    | `radical-044` |       44        |   8    |        20         | [Bộ 34: 阜 (Phụ)](#bộ-34-阜-phụ)       |
| 35  |   邑   | Ấp       | Đã có (`radical-195` rỗng)    | `radical-045` |       45        |   7    |        16         | [Bộ 35: 邑 (Ấp)](#bộ-35-邑-ấp)         |
| 36  |   辵   | Sước     | Đã có (`radical-194` rỗng)    | `radical-008` |        8        |   7    |        22         | [Bộ 36: 辵 (Sước)](#bộ-36-辵-sước)     |
| 37  |   欠   | Khiếm    | Đã có                         | `radical-088` |       88        |   4    |        15         | [Bộ 37: 欠 (Khiếm)](#bộ-37-欠-khiếm)   |
| 38  |   巾   | Cân      | **[CHƯA CÓ TRONG DB]**        | —             |        —        |   3    |        21         | [Bộ 38: 巾 (Cân)](#bộ-38-巾-cân)       |
| 39  |   示   | Thị      | Đã có (`radical-151` rỗng)    | `radical-018` |       18        |   5    |        20         | [Bộ 39: 示 (Thị)](#bộ-39-示-thị)       |
| 40  |   禾   | Hòa      | Đã có (`radical-153` rỗng)    | `radical-026` |       26        |   5    |        21         | [Bộ 40: 禾 (Hòa)](#bộ-40-禾-hòa)       |
| 41  |   疒   | Nạch     | Đã có (đã có 1 nhóm `groups`) | `radical-142` |       142       |   5    |        21         | [Bộ 41: 疒 (Nạch)](#bộ-41-疒-nạch)     |
| 42  |   子   | Tử       | Đã có                         | `radical-056` |       56        |   3    |        18         | [Bộ 42: 子 (Tử)](#bộ-42-子-tử)         |

---

## Bộ 32: 月 (Nguyệt)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-019"` · `radical_index: 19` · `strokes: 4` nét · `name_vi: "bộ Nguyệt"` · Không có dòng trùng/rỗng.
- **Hình thái & Biến thể (`variants`):**
  - `月` — dạng chính (4 nét, có thể đứng độc lập hoặc nằm bên trái, bên phải, bên dưới chữ ghép).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "mặt trăng." — Chữ tượng hình (Giáp cốt văn, Kim văn vẽ vầng trăng khuyết hình lưỡi liềm có chấm/nét bên trong biểu thị bóng trăng).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "mặt trăng, tháng, thời gian theo tháng; đôi khi trong chữ hiện đại bị lẫn hình với 肉 khi in/viết." Từ nghĩa mặt trăng, bộ `月` chuyển sang chỉ chu kỳ tròn khuyết của trăng (1 tháng âm lịch), thời gian, ánh sáng ban đêm và sự trông ngóng theo kỳ hạn.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** Nếu `月` đi với nghĩa thời gian, ánh sáng, đêm, tháng thì thường là bộ Nguyệt thật.
  - **Phân biệt dễ nhầm (`distinguish`) — Cặp cực hay nhầm `月` (Nguyệt) vs `肉 / ⺼` (Nhục):**
    - `月` và `肉/⺼` là cặp dễ sai nhất vì trong font chữ Khải/Tống giản thể hiện đại, biến thể `⺼` (Nhục nguyệt) thường bị in giống hệt chữ `月` (Nguyệt).
    - **Nhóm chữ thực sự thuộc bộ `月` (Khang Hy bộ 74):** liên quan đến mặt trăng, ánh sáng, thời gian, tháng, kỳ hạn hoặc gốc cổ tự ghép về `月`, tiêu biểu là: **`期` (kỳ), `朗` (lãng), `朝` (triều/chiêu), `望` (vọng), `朋` (bằng), `有` (hữu), `服` (phục), `朕` (trẫm)** cùng `朔` (sóc), `朦` (mông), `胧` (lung), `朏` (phỉ), `朓` (thiêu), `朣` (đồng). _(Lưu ý cổ tự học: `有` cổ văn là `又` cầm thịt, `服` và `朕` cổ văn chứa `舟` "thuyền" bị lệ biến thành `月`, `朋` là hai xâu ngọc; nhưng tất cả đều được từ điển Khang Hy & Tân Hoa xếp vào bộ `月`.)_
    - **Nhóm chữ thuộc bộ `肉 / ⺼` (Khang Hy bộ 130 — KHÔNG phải Nguyệt):** luôn liên quan đến thịt, cơ thể, bộ phận thân thể, nội tạng, thể trạng hoặc hoạt động cơ thể, tiêu biểu là: **`脑` (não), `脸` (kiểm), `股` (cổ), `背` (bối), `胜` (thắng/tinh), `胖` (bàn), `胃` (vị), `能` (năng), `脱` (thoát)** cùng `腿, 脚, 肚, 肠, 肝, 肺, 肥, 育`.
    - **Mẹo phân biệt nhanh bằng chữ viết & vị trí:** Trong chữ phồn thể chuẩn thư pháp, hai nét bên trong `月` (Nguyệt) viết ngang song song sát hai bên, còn hai nét trong `⺼` (Nhục) viết thành chấm + hất; tuy nhiên ở chữ in giản thể cả hai đều trông như `月`, nên **phải căn cứ vào trường nghĩa** (trăng/tháng/ánh sáng/thời gian -> `月`; cơ thể/thịt/nội tạng/béo gầy -> `肉`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Mặt trăng, ánh trăng & chu kỳ âm lịch (7 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                 |
| ------- | ------ | -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 月      | yuè    | nguyệt   | Độc thể (`月`)                  | Tượng hình vầng trăng khuyết -> mặt trăng, tháng (chu kỳ trăng tròn khuyết). Từ ghép: `月亮` (mặt trăng), `一月` (tháng Giêng), `岁月` (năm tháng).                                                                                            |
| 朗      | lǎng   | lãng     | `良` (trái) + `月` (phải)       | Hình thanh kiêm hội ý: `良` (tốt, trong sáng, ghi âm `lǎng`) + `月` (ánh trăng) -> ánh trăng sáng rõ -> sáng sủa, quang đãng, âm thanh vang rõ. Từ ghép: `晴朗` (nắng ráo quang đãng), `朗读` (đọc to rõ ràng), `开朗` (cởi mở).               |
| 朔      | shuò   | sóc      | `屰` (trái) + `月` (phải)       | Hội ý: `屰` (quay ngược trở lại) + `月` (mặt trăng) -> mặt trăng bắt đầu quay lại chu kỳ mới -> ngày mồng 1 âm lịch (trăng non); mở rộng chỉ phương Bắc. Từ ghép: `朔日` (ngày mồng 1 âm lịch), `朔望` (mồng 1 và ngày rằm), `朔风` (gió bấc). |
| 朏      | fěi    | phỉ      | `月` (trái) + `出` (phải)       | Hội ý kiêm hình thanh: `月` (trăng) + `出` (mọc ra) -> ánh trăng non mới nhú sáng vào ngày mồng 3 âm lịch. Từ ghép: `朏魄` (ánh sáng trăng non), `朏明` (sáng lờ mờ lúc trăng non mọc).                                                        |
| 朦      | méng   | mông     | `月` (trái) + `蒙` (phải)       | Hình thanh: `月` (mặt trăng) + `蒙` (che phủ, ghi âm `méng`) -> ánh trăng bị mây sương che khuất -> mờ ảo, lờ mờ, chưa tỉnh hẳn. Từ ghép: `朦胧` (mờ ảo, mơ màng), `月色朦胧` (ánh trăng mờ ảo).                                               |
| 胧      | lóng   | lung     | `月` (trái) + `龙` (`龍`, phải) | Hình thanh: `月` (mặt trăng; phồn thể `朧` thuộc bộ `月`) + `龙` (rồng, ghi âm `lóng`) -> ánh trăng vừa mọc còn mờ dịu. Từ ghép: `朦胧` (lờ mờ, hư ảo), `胧明` (lờ mờ sáng).                                                                   |
| 朣      | tóng   | đồng     | `月` (trái) + `童` (phải)       | Hình thanh: `月` (trăng) + `童` (trẻ nhỏ, ghi âm `tóng`) -> trăng mới nhô lên ánh sáng còn yếu, lờ mờ. Từ ghép: `朣胧` (trăng sáng lờ mờ).                                                                                                     |

#### Nhóm B: Thời gian, kỳ hạn & trông ngóng (4 chữ)

| Chữ Hán | Pinyin      | Hán Việt      | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                              |
| ------- | ----------- | ------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 朝      | zhāo / cháo | chiêu / triều | `龺` (trái) + `月` (phải)        | Hội ý: `龺` (mặt trời nhô lên giữa cỏ cây) + `月` (mặt trăng còn chưa lặn hẳn, hoặc nước thủy triều dâng theo trăng) -> `zhāo`: buổi sáng sớm; `cháo`: thủy triều, triều đình, hướng về. Từ ghép: `朝夕` (sớm tối), `朝代` (triều đại), `朝向` (hướng về).  |
| 期      | qī / jī     | kỳ            | `其` (trái) + `月` (phải)        | Hình thanh: `其` (ghi âm `qī`) + `月` (tháng, chu kỳ trăng) -> thời gian ước hẹn theo chu kỳ tháng -> kỳ hạn, thời kỳ, mong chờ (`jī`: một năm tròn). Từ ghép: `星期` (tuần lễ), `日期` (ngày tháng), `期待` (kỳ vọng).                                     |
| 望      | wàng        | vọng          | `亡` + `月` (trên) + `王` (dưới) | Hình thanh kiêm hội ý: cổ văn người đứng trên gò đất (`壬/王`) ngẩng nhìn mặt trăng (`月`), `亡` ghi âm -> đứng xa ngắm trăng rằm -> nhìn xa, trông mong, hy vọng, ngày rằm (15 âm lịch). Từ ghép: `希望` (hy vọng), `看望` (thăm hỏi), `失望` (thất vọng). |
| 朓      | tiǎo        | thiêu         | `月` (trái) + `兆` (phải)        | Hình thanh: `月` (trăng) + `兆` (điềm báo, ghi âm `tiǎo`) -> hiện tượng trăng khuyết cuối tháng đã ló ở phương Đông trước bình minh. Từ ghép: `朓朒` (hiện tượng mặt trăng đi nhanh/chậm cuối và đầu tháng).                                                |

#### Nhóm C: Chữ xếp ở bộ `月` mang gốc cổ tự đặc biệt (4 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                                      |
| ------- | ------ | -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 朋      | péng   | bằng     | `月` (trái) + `月` (phải)          | Tượng hình (xếp bộ `月`): cổ văn vẽ hai chuỗi ngọc bội hoặc hai xâu vỏ sò treo song song nhau, khải biến thành hai chữ `月` đứng cạnh -> đôi lứa, bạn bè, kết bè phái. Từ ghép: `朋友` (bạn bè), `亲朋` (bà con bạn bè), `良朋` (bạn tốt).                                          |
| 有      | yǒu    | hữu      | `𠂇` (trên) + `月` (dưới)          | Hội ý (xếp bộ `月`): cổ văn là `又` (bàn tay) cầm miếng thịt (`肉` viết giống `月`) -> nắm giữ trong tay -> có, tồn tại, sở hữu. Từ ghép: `没有` (không có), `有用` (hữu ích), `所有` (tất cả, sở hữu).                                                                             |
| 服      | fú     | phục     | `月` (trái) + `𠬝` (`卩+又`, phải) | Hội ý (xếp bộ `月`): cổ văn bên trái là `舟` (thuyền, lệ biến thành `月`) + bên phải là `𠬝` (tay chế ngự người quỳ) -> điều khiển, khuất phục, phục tùng; mở rộng nghĩa quần áo, uống thuốc. Từ ghép: `衣服` (quần áo), `服务` (phục vụ), `舒服` (thoải mái).                      |
| 朕      | zhèn   | trẫm     | `月` (trái) + `灷` (`关`, phải)    | Hội ý (xếp bộ `月`): cổ văn bên trái là `舟` (thuyền, lệ biến thành `月`) + bên phải là hai tay cầm đuốc/đồ sửa khe hở thuyền -> khe nứt nhỏ, dấu hiệu, điềm báo; từ thời Tần Thủy Hoàng dùng làm đại từ tự xưng của vua ("Trẫm"). Từ ghép: `朕兆` (điềm báo, triệu chứng ban đầu). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `明` — `míng · minh · 日 (mặt trời) + 月 (mặt trăng) · hội ý chỉ ánh sáng rực rỡ, sáng sủa, ngày mai (明天, 明白); Khang Hy xếp bộ 日.`
- `阴` — `yīn · âm · 阝 (Phụ trái) + 月 (mặt trăng) · mặt sườn núi khuất nắng, ánh trăng mang tính âm -> âm u, âm lịch, âm tính (阴天, 阴历); xếp bộ 阜 (阝 trái).`
- `霸` — `bà · bá · 雨 + 革 + 月 · cổ văn là phần sáng mờ của trăng đầu tháng (phách 魄/霸), sau mượn nghĩa bá chủ (霸主, 霸占); xếp bộ 雨.`
- `夕` — `xī · tịch · bộ riêng (3 nét), tượng hình vầng trăng non mới ló lúc hoàng hôn -> chiều tối, đêm (夕阳, 除夕).`
- `肉 / ⺼` — `ròu · nhục · bộ riêng (#20 trong DB), khi đứng bên trái hay bên dưới (脸, 胃, 胖) thường in giống 月 nhưng mang nghĩa thịt và cơ thể.`
- `前` — `qián · tiền · 止 (bàn chân) + 舟 (biến thành 月) + 刂 (dao) · nghĩa gốc là người ngồi thuyền tiến về phía trước, phần dưới trái giống 月 nhưng gốc là 舟; xếp bộ 刀.`
- `青` — `qīng · thanh · bộ riêng, cổ văn trên là 生 (cỏ mọc) dưới là 丹 (mỏ khoáng chu sa/giếng nước), phần dưới giống 月 nhưng hoàn toàn không phải Nguyệt hay Nhục.`

---

## Bộ 33: 肉 (Nhục)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-020"` · `radical_index: 20` · `strokes: 6` nét · `name_vi: "bộ Nhục"` · **Có 1 dòng trùng/rỗng:** `radical-164` (`radical_index: 164`, `radical: "肉"`, toàn bộ trường dữ liệu hiện đang để rỗng/`null`).
- **Hình thái & Biến thể (`variants`):**
  - `肉` — dạng đầy đủ (6 nét, khi đứng độc lập như `肉`, hoặc nằm bên dưới/giữa như `腐`, `脔`).
  - `⺼` — nhục nguyệt (4 nét), dạng biến thể phổ biến nhất khi đứng bên trái (như `脑, 脸, 股, 胖, 脱`) hoặc nằm ở phía dưới (như `胃, 背, 肯, 育, 膏`), trong nhiều font chữ hiện đại bị in giống hệt `月`.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "miếng thịt/cơ thịt." — Chữ tượng hình (Giáp cốt văn vẽ một lát thịt thái có thớ gân ở giữa).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "thịt, cơ thể, bộ phận cơ thể, nội tạng, trạng thái thân thể." Từ nghĩa miếng thịt động vật, bộ `肉 / ⺼` mở rộng thành bộ thủ chủ lực để tạo nhóm chữ chỉ toàn bộ giải phẫu cơ thể người (đầu mặt, tứ chi, da thịt, nội tạng), thể trạng (béo, mập, phì nhiêu) và chức năng sinh lý/năng lực cơ thể.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** Nếu thấy "`月`" trong chữ mà chữ đó liên quan cơ thể, thịt, nội tạng, béo/gầy, đau/sưng… thì rất có thể là biến thể của `肉`, không phải `月`.
  - **Phân biệt dễ nhầm (`distinguish`) — Cặp cực hay nhầm `肉 / ⺼` (Nhục) vs `月` (Nguyệt):**
    - **Các chữ nhìn có `月` nhưng thuộc bộ `肉 / ⺼`:** **`脸` (khuôn mặt), `脑` (não), `股` (đùi), `背` (lưng), `胜` (thắng — giản thể dùng `⺼ + 生`), `胖` (béo), `胃` (dạ dày), `能` (năng lực — gốc hình con gấu có thân thịt `⺼`), `脱` (cởi/thoát)** cùng `肚, 腿, 脚, 腰, 肠, 肝, 肺, 肥, 育`. Tất cả phải quy về `肉 / ⺼`.
    - **Các chữ thực sự thuộc bộ `月` (KHÔNG xếp sang `肉`):** `期, 朗, 朝, 望, 朋, 有, 服, 朕` — thiên về trăng, tháng, thời gian, ánh sáng hoặc gốc cổ tự riêng.
    - **Phân biệt với `骨` (Cốt - xương) và `疒` (Nạch - bệnh):** `骨` là bộ riêng chỉ xương cốt (`骨头`); `疒` chỉ trạng thái bệnh lý (`瘦` "gầy" thuộc bộ `疒`, không phải `肉`, dù đối nghĩa với `胖` thuộc `肉`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Đầu mặt, tứ chi & bộ phận bên ngoài cơ thể (9 chữ)

| Chữ Hán | Pinyin    | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                         |
| ------- | --------- | -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 脸      | liǎn      | kiểm     | `⺼` (trái) + `佥` (`僉`, phải) | Hình thanh: `⺼` (da thịt cơ thể) + `佥` (ghi âm) -> gò má, khuôn mặt, thể diện. Từ ghép: `洗脸` (rửa mặt), `脸色` (sắc mặt), `笑脸` (gương mặt cười).                                                                 |
| 脑      | nǎo       | não      | `⺼` (trái) + `𠜱` (phải)       | Hình thanh: `⺼` (mô thịt cơ thể) + phần phải giản hóa từ `巛+囟` (tóc và thóp đầu) -> bộ não, đầu óc, trí tuệ. Từ ghép: `大脑` (đại não), `电脑` (máy tính), `脑子` (đầu óc).                                         |
| 肩      | jiān      | kiên     | `户` (trên) + `⺼` (dưới)       | Hội ý: `户` (cánh cửa/khung xương mở đóng) + `⺼` (phần thịt cơ thể) -> bả vai (phần thân trên nối với cánh tay), gánh vác. Từ ghép: `肩膀` (bờ vai), `并肩` (sát cánh, kề vai).                                       |
| 背      | bèi / bēi | bối      | `北` (trên) + `⺼` (dưới)       | Hình thanh kiêm hội ý: `北` (hai người quay lưng vào nhau, ghi âm) + `⺼` (cơ thể) -> `bèi`: tấm lưng, mặt sau, quay lưng; `bēi`: cõng trên lưng. Từ ghép: `后背` (sau lưng), `背包` (ba lô), `背书` (học thuộc lòng). |
| 腰      | yāo       | yêu      | `⺼` (trái) + `要` (phải)       | Hình thanh: `⺼` (cơ thể) + `要` (cổ văn là hai tay chống hông, ghi âm `yāo`) -> phần eo, thắt lưng, chỗ thắt giữa. Từ ghép: `弯腰` (cúi lưng), `腰带` (thắt lưng), `山腰` (sườn núi).                                 |
| 股      | gǔ        | cổ       | `⺼` (trái) + `殳` (phải)       | Hình thanh: `⺼` (thịt cơ thể) + `殳` (ghi âm `gǔ`) -> bắp đùi; mở rộng chỉ phần hùn vốn (cổ phần), nhánh/luồng, lượng từ cho sợi/mùi. Từ ghép: `屁股` (mông), `股票` (cổ phiếu), `一股气` (một luồng hơi).            |
| 腿      | tuǐ       | thối     | `⺼` (trái) + `退` (phải)       | Hình thanh: `⺼` (cơ thể) + `退` (ghi âm) -> đùi và bắp chân, chân (của người, động vật, bàn ghế). Từ ghép: `大腿` (đùi), `小腿` (bắp chân), `鸡腿` (đùi gà).                                                          |
| 脚      | jiǎo      | cước     | `⺼` (trái) + `却` (phải)       | Hình thanh: `⺼` (cơ thể) + `却` (ghi âm) -> bàn chân, phần chân dưới cùng (chân núi, chân tường). Từ ghép: `脚步` (bước chân), `洗脚` (rửa chân), `山脚` (chân núi).                                                  |
| 肤      | fū        | phu      | `⺼` (trái) + `夫` (phải)       | Hình thanh: `⺼` (da thịt) + `夫` (ghi âm `fū`) -> lớp da bên ngoài cơ thể; mở rộng nghĩa nông cạn, bề ngoài. Từ ghép: `皮肤` (da dẻ), `肤色` (màu da), `肤浅` (nông cạn).                                             |

#### Nhóm B: Thịt, nội tạng & cấu trúc bên trong cơ thể (6 chữ)

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung                    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                  |
| ------- | ------- | -------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 肉      | ròu     | nhục     | Độc thể (`肉`)                           | Tượng hình miếng thịt thái có thớ -> thịt (người, động vật), phần cùi thịt của hoa quả. Từ ghép: `猪肉` (thịt lợn), `牛肉` (thịt bò), `肌肉` (cơ bắp).                                                                                          |
| 胃      | wèi     | vị       | `田` (trên) + `⺼` (dưới)                | Tượng hình kiêm hội ý: `田` (cái túi chứa đầy thức ăn) + `⺼` (cơ quan thịt) -> dạ dày, bao tử. Từ ghép: `胃口` (khẩu vị, sự ngon miệng), `肠胃` (đường tiêu hóa), `胃疼` (đau dạ dày).                                                         |
| 肚      | dù / dǔ | đỗ       | `⺼` (trái) + `土` (phải)                | Hình thanh: `⺼` (thịt/nội tạng) + `土` (ghi âm `dù`) -> `dù`: cái bụng; `dǔ`: dạ dày động vật dùng làm thức ăn (bao tử). Từ ghép: `肚子` (cái bụng), `肚皮` (da bụng), `猪肚` (dạ dày lợn).                                                    |
| 肠      | cháng   | trường   | `⺼` (trái) + `𠃓` (`昜` giản hóa, phải) | Hình thanh: `⺼` (nội tạng) + `昜` giản hóa thành phần phải (ghi âm `cháng`) -> ruột (ruột non, ruột già), xúc xích/lạp xưởng. Từ ghép: `大肠` (ruột già), `香肠` (lạp xưởng/xúc xích), `热心肠` (nhiệt tình tốt bụng).                         |
| 肝      | gān     | can      | `⺼` (trái) + `干` (phải)                | Hình thanh: `⺼` (nội tạng) + `干` (ghi âm `gān`) -> lá gan (trong Đông y thuộc hành Mộc, gắn với tình chí). Từ ghép: `肝脏` (gan), `心肝` (tâm can, người thương yêu), `肝炎` (viêm gan).                                                      |
| 肺      | fèi     | phế      | `⺼` (trái) + `巿` (phải)                | Hình thanh: `⺼` (nội tạng) + `巿` (`fú`, cây cối um tùm -> xốp rỗng, ghi âm) -> lá phổi _(chú ý phần phải là `巿` sổ thẳng xuyên ngang, không phải `市` có chấm trên)_. Từ ghép: `肺部` (phổi), `肺炎` (viêm phổi), `肺活量` (dung tích phổi). |

#### Nhóm C: Trạng thái thân thể, năng lực & biến đổi (6 chữ)

| Chữ Hán | Pinyin       | Hán Việt     | Thiên bàng đứng chung                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                |
| ------- | ------------ | ------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 胖      | pàng / pán   | bàn          | `⺼` (trái) + `半` (phải)             | Hình thanh: `⺼` (thân thể/thịt) + `半` (ghi âm `pàng`) -> `pàng`: béo, mập; `pán`: rộng rãi, thư thái (nghĩa cổ). Từ ghép: `胖子` (người mập), `发胖` (lên cân), `心广体胖` (lòng rộng thân an).                                             |
| 肥      | féi          | phì          | `⺼` (trái) + `巴` (phải)             | Hội ý kiêm hình thanh: `⺼` (thịt mỡ) + `巴` (con rắn/người cúi mình hoặc nhiều thịt) -> béo, nhiều mỡ, màu mỡ, phân bón. Từ ghép: `肥胖` (béo phì), `肥料` (phân bón), `肥皂` (xà phòng).                                                    |
| 胜      | shèng / xīng | thắng / tinh | `⺼` (trái) + `生` (phải)             | Giản thể dùng `⺼ + 生` (gộp chữ `勝` bộ `力` "thắng lợi" và `胜` bộ `肉` "thịt sống có mùi tanh/mỡ") -> chiến thắng, vượt trội, cảnh đẹp (`名胜`). Từ ghép: `胜利` (thắng lợi), `名胜` (danh thắng), `胜任` (đảm đương nổi).                 |
| 能      | néng         | năng         | `厶` + `⺼` (trái) + `匕 + 匕` (phải) | Tượng hình (xếp bộ `肉`): cổ văn vẽ hình con gấu lớn khỏe mạnh — phần dưới trái là `⺼` (thân thịt con gấu), hai chữ `匕` là bốn chân gấu -> có sức mạnh, năng lực, có thể. Từ ghép: `能力` (năng lực), `可能` (có thể), `能源` (năng lượng). |
| 脱      | tuō          | thoát        | `⺼` (trái) + `兑` (phải)             | Hình thanh: `⺼` (da thịt, cơ thể) + `兑` (ghi âm `tuō`) -> lột da, cởi bỏ khỏi cơ thể -> cởi ra, rụng, trốn thoát, tách rời. Từ ghép: `脱鞋` (cởi giày), `脱离` (tách rời), `脱发` (rụng tóc).                                               |
| 育      | yù           | dục          | `𠫓` (`亠+厶`, trên) + `⺼` (dưới)    | Hội ý: phần trên là hình đứa trẻ mới sinh lộn ngược + `⺼` (thân thể/xương thịt) -> sinh đẻ, nuôi nấng thân thể và trí tuệ -> nuôi dưỡng, giáo dục. Từ ghép: `教育` (giáo dục), `体育` (thể dục), `生育` (sinh đẻ).                           |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `月` — `yuè · nguyệt · bộ riêng (#19 trong DB), hình dạng hiện đại thường trùng với ⺼ trong các chữ chỉ cơ thể nhưng về bản chất ngữ nghĩa là 肉.`
- _(Ghi chú đối chiếu DB hiện tại: `胃, 肚, 脑, 脸, 腿` trong `related_components` của DB đều phải hiểu theo `肉 / ⺼`, không phải `月`.)_
- `骨` — `gǔ · cốt · bộ riêng (10 nét), chỉ xương cốt, cùng trường nghĩa giải phẫu cơ thể với 肉 nhưng là bộ độc lập (骨头, 骨折).`
- `祭` — `jì · tế · ⺼ (thịt tế, trên trái) + 又 (tay, trên phải) + 示 (bàn thờ, dưới) · dâng thịt lên bàn thờ tế lễ (祭祀); xếp bộ 示.`
- `然` — `rán · nhiên · ⺼ (thịt, trên trái) + 犬 (chó, trên phải) + 灬 (lửa, dưới) · gốc là nướng thịt chó trên lửa, sau mượn làm liên từ/trợ từ "nhiên, đúng vậy" (然后, 自然); xếp bộ 火 (灬).`
- `赢` — `yíng · doanh · 亡 + 口 + ⺼ + 贝 + 凡 · dưới có ⺼ đứng cạnh 贝 và 凡, nghĩa thắng cuộc, kiếm lời (赢得, 赢家); xếp bộ 贝.`
- `消` — `xiāo · tiêu · 氵 (nước) + 肖 (小 + ⺼) · bộ phận 肖 thuộc bộ 肉 (thịt con giống cha mẹ), ghép với 氵 thành tiêu tan (消息, 消灭); xếp bộ 水.`
- `湖` — `hú · hồ · 氵 (nước) + 胡 (古 + ⺼, phần thịt yếm bò) · mượn chữ 胡 (thuộc bộ 肉) làm thanh phù chỉ hồ nước (湖泊, 西湖); xếp bộ 水.`

---

## Bộ 34: 阜 (Phụ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-044"` · `radical_index: 44` · `strokes: 8` nét · `name_vi: "bộ Phụ"` · **Có 1 dòng trùng/rỗng:** `radical-202` (`radical_index: 202`, `radical: "阜 / 阝 trái"`, toàn bộ trường dữ liệu hiện đang để rỗng/`null`).
- **Hình thái & Biến thể (`variants`):**
  - `阜` — dạng đầy đủ (8 nét, rất ít xuất hiện nguyên dạng trong chữ thông dụng).
  - `阝` — phụ trái (2 nét viết trong giản thể/khải thư hiện đại, nhưng tính theo nguyên bộ 8 nét), tức **`阝` nằm bên trái chữ**, ví dụ `院, 队, 险, 陆`.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "gò đất, mô đất, sườn núi/địa hình cao thấp." — Chữ tượng hình (Giáp cốt văn vẽ dãy bậc thang đất hoặc sườn núi xếp tầng thẳng đứng).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "đồi, gò, bậc thềm, địa hình, vùng đất; khi làm bộ bên trái thường liên quan nơi chốn, địa thế, trở ngại, cao thấp." Từ hình tượng gò đất và bậc thềm, bộ `阜` mở rộng sang ranh giới, phòng vệ, ngăn trở, hướng sáng/tối của sườn núi (`阳`/`阴`), sự lên xuống (`降`/`阶`) và đội ngũ xếp hàng theo tầng lớp (`队`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** `阝` bên trái thường liên quan gò đất, địa hình, nơi chốn, bậc thềm, vùng đất, trở ngại.
  - **Phân biệt dễ nhầm (`distinguish`) — Cặp cực hay nhầm `阜` (`阝` trái) vs `邑` (`阝` phải):**
    - Đây là một trong những điểm dễ nhầm nhất vì biến thể `阝` của hai bộ có hình dáng **giống hệt nhau**, chỉ khác **vị trí đứng**:
      - **`阝` bên trái = bộ `阜` (Phụ):** nghĩa gốc là gò đất, bậc thềm, địa hình, nơi chốn, ngăn trở (như `院, 队, 险, 陆, 阳, 阴, 限, 阻`).
      - **`阝` bên phải = bộ `邑` (Ấp):** nghĩa gốc là thành ấp, vùng dân cư, đơn vị hành chính, địa danh (như `都, 部, 邮, 邻, 郊, 郡`).
    - Không nên chỉ ghi "`阝` = bộ phụ" rồi xong, vì trái–phải khác hẳn gốc chữ và trường nghĩa.
    - Mẹo nhớ: **"Trái Phụ (đồi gò `阜`), Phải Ấp (làng thành `邑`)"** — đồi núi thường bao chắn ở phía trái mở đường, thành ấp tập trung ở bên phải.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Địa hình, cao thấp, âm dương & đất liền (7 chữ)

| Chữ Hán | Pinyin   | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                |
| ------- | -------- | -------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 陆      | lù / liù | lục      | `阝` (trái) + `击` (phải)       | Hình thanh: `阝` (địa thế cao) + `击` (giản hóa từ `坴`, đống đất cao) -> gò đất cao ráo, đất liền, lục địa (`liù`: chữ viết hoa số 6). Từ ghép: `大陆` (đại lục), `陆地` (đất liền), `登陆` (đổ bộ, đăng nhập).                              |
| 阳      | yáng     | dương    | `阝` (trái) + `日` (phải)       | Hội ý kiêm hình thanh: `阝` (sườn núi, gò đất) + `日` (mặt trời; phồn thể `陽` có `昜` tia nắng chiếu) -> sườn núi phía đón ánh mặt trời -> ánh sáng, mặt trời, dương tính. Từ ghép: `太阳` (mặt trời), `阳光` (ánh nắng), `阳台` (ban công). |
| 阴      | yīn      | âm       | `阝` (trái) + `月` (phải)       | Hội ý: `阝` (sườn núi) + `月` (mặt trăng/bóng tối; phồn thể `陰` có `侌` mây che) -> sườn núi phía khuất nắng -> bóng râm, âm u, mặt tối, âm tính. Từ ghép: `阴天` (trời âm u), `阴凉` (râm mát), `阴暗` (tối tăm).                           |
| 险      | xiǎn     | hiểm     | `阝` (trái) + `佥` (`僉`, phải) | Hình thanh: `阝` (núi cao vách đá) + `佥` (ghi âm) -> địa hình núi cao dốc đứng khó đi -> hiểm trở, nguy hiểm. Từ ghép: `危险` (nguy hiểm), `保险` (bảo hiểm), `冒险` (mạo hiểm).                                                             |
| 陡      | dǒu      | đẩu      | `阝` (trái) + `走` (phải)       | Hình thanh: `阝` (sườn núi/bậc thềm) + `走` (ghi âm) -> vách núi dựng đứng khó bước lên -> dốc đứng, đột ngột. Từ ghép: `陡峭` (dốc đứng cheo leo), `陡坡` (dốc đứng), `陡然` (bỗng nhiên).                                                   |
| 陵      | líng     | lăng     | `阝` (trái) + `夌` (phải)       | Hình thanh: `阝` (gò đất) + `夌` (cao vượt lên, ghi âm `líng`) -> gò đất cao lớn, đồi lớn; lăng mộ vua chúa đắp cao như đồi. Từ ghép: `丘陵` (đồi núi trập trùng), `陵墓` (lăng mộ), `陵园` (khu lăng viên).                                  |
| 阶      | jiē      | giai     | `阝` (trái) + `介` (phải)       | Hình thanh: `阝` (bậc đất xếp tầng) + `介` (ghi âm `jiē`) -> bậc thềm đá/đất -> bậc thang, cấp bậc, giai đoạn. Từ ghép: `台阶` (bậc thềm), `阶段` (giai đoạn), `阶级` (giai cấp).                                                             |

#### Nhóm B: Kiến trúc, ranh giới, phòng thủ & ngăn cách (7 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                     |
| ------- | ------ | -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 院      | yuàn   | viện     | `阝` (trái) + `完` (phải)       | Hình thanh: `阝` (tường đất đắp quanh) + `完` (trọn vẹn, ghi âm `yuàn`) -> khu đất có tường rào bao quanh -> sân, khuôn viên, viện, bệnh viện/học viện. Từ ghép: `医院` (bệnh viện), `学院` (học viện), `院子` (cái sân).          |
| 际      | jì     | tế       | `阝` (trái) + `示` (`祭`, phải) | Hình thanh: `阝` (tường đất ranh giới) + `示` (giản hóa từ `祭`, ghi âm `jì`) -> chỗ tiếp giáp hai bức tường/vùng đất -> ranh giới, giao tiếp, thực tế, nhân dịp. Từ ghép: `国际` (quốc tế), `实际` (thực tế), `交际` (giao tiếp). |
| 限      | xiàn   | hạn      | `阝` (trái) + `艮` (phải)       | Hình thanh: `阝` (bờ đất ngăn cản) + `艮` (dừng lại nhìn ngược, ghi âm) -> đường ranh giới, ngưỡng ngăn -> giới hạn, hạn chế, kỳ hạn. Từ ghép: `限制` (hạn chế), `有限` (hữu hạn), `期限` (thời hạn).                              |
| 防      | fáng   | phòng    | `阝` (trái) + `方` (phải)       | Hình thanh: `阝` (đê đất đắp cao) + `方` (ghi âm `fáng`) -> bờ đê ngăn lũ -> phòng thủ, đề phòng, ngăn ngừa. Từ ghép: `预防` (phòng ngừa), `国防` (quốc phòng), `防止` (ngăn chặn).                                                |
| 阻      | zǔ     | trở      | `阝` (trái) + `且` (phải)       | Hình thanh: `阝` (địa thế hiểm trở) + `且` (ghi âm `zǔ`) -> núi gò chắn ngang đường đi -> ngăn trở, cản trở, trắc trở. Từ ghép: `阻止` (ngăn cản), `阻碍` (cản trở), `阻挡` (chắn ngang).                                          |
| 隔      | gé     | cách     | `阝` (trái) + `鬲` (phải)       | Hình thanh: `阝` (vách ngăn/gò đất) + `鬲` (ghi âm `gé`) -> vách đất ngăn đôi hai không gian -> ngăn cách, cách biệt, hàng xóm cách vách. Từ ghép: `隔壁` (nhà bên cạnh), `隔离` (cách ly), `间隔` (khoảng cách).                  |
| 障      | zhàng  | chướng   | `阝` (trái) + `章` (phải)       | Hình thanh: `阝` (núi cao/thành lũy) + `章` (ghi âm `zhàng`) -> dãy núi/lũy đất che chắn -> vật chắn, chướng ngại; che chở bảo vệ. Từ ghép: `障碍` (chướng ngại), `保障` (bảo đảm), `故障` (sự cố).                                |

#### Nhóm C: Đội ngũ, trật tự & chuyển động lên xuống (6 chữ)

| Chữ Hán | Pinyin        | Hán Việt     | Thiên bàng đứng chung        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                    |
| ------- | ------------- | ------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 队      | duì           | đội          | `阝` (trái) + `人` (phải)    | Giản thể thay `𠂢` trong `隊` bằng `人`: người đứng tụ tập thành hàng từ gò cao -> hàng ngũ, đoàn, đội. Từ ghép: `排队` (xếp hàng), `队长` (đội trưởng), `军队` (quân đội).                                                       |
| 降      | jiàng / xiáng | giáng / hàng | `阝` (trái) + `夅` (phải)    | Hội ý: `阝` (bậc thềm, sườn đồi) + `夅` (hai bàn chân quay mũi đi xuống) -> `jiàng`: đi từ cao xuống thấp, hạ xuống, rơi xuống; `xiáng`: khuất phục, đầu hàng. Từ ghép: `下降` (giảm xuống), `降落` (hạ cánh), `投降` (đầu hàng). |
| 随      | suí           | tùy          | `阝` (trái) + `有+辶` (phải) | Giản thể rút gọn `隓` thành `有`: đi dọc theo triền đồi -> đi theo sau, thuận theo, tùy ý. Từ ghép: `随便` (tùy tiện/thoải mái), `随着` (cùng với), `随时` (bất cứ lúc nào).                                                      |
| 除      | chú           | trừ          | `阝` (trái) + `余` (phải)    | Hình thanh: `阝` (bậc thềm cung điện) + `余` (ghi âm `chú`) -> quét dọn bậc thềm -> loại bỏ, trừ đi (phép chia), bổ nhiệm, ngoài ra. Từ ghép: `除了` (ngoài ra), `消除` (loại bỏ), `除法` (phép chia).                            |
| 陪      | péi           | bồi          | `阝` (trái) + `咅` (phải)    | Hình thanh: `阝` (mô đất) + `咅` (ghi âm `péi`) -> đắp thêm một lớp đất nữa -> đi kèm theo bên cạnh, tiếp đón, bầu bạn. Từ ghép: `陪伴` (bầu bạn, ở bên), `陪同` (đi cùng), `陪练` (tập cùng).                                    |
| 阿      | ā / ē         | a            | `阝` (trái) + `可` (phải)    | Hình thanh: `阝` (gò đất lớn) + `可` (ghi âm) -> gò đất cong lớn (nghĩa cổ); dùng làm tiền tố gọi thân mật trong gia đình (`ā`) hoặc phiên âm. Từ ghép: `阿姨` (dì/cô), `阿哥` (anh trai), `阿拉伯` (Ả Rập).                      |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `山` — `shān · sơn · bộ riêng (#30 trong DB), chỉ núi non tự nhiên có đỉnh nhọn, phân biệt với 阜 thiên về gò đất, bậc thềm, sườn dốc.`
- `土` — `tǔ · thổ · bộ riêng (#25 trong DB), chỉ đất đai/vật liệu đất nói chung, thường đứng cạnh hoặc dưới.`
- `邑 / 阝 phải` — `yì · ấp · bộ #35 (bên phải), đối xứng hình thể với 阜 (阝 trái) nhưng chỉ thành ấp, vùng hành chính.`
- `追` — `zhuī · truy · 辶 + 𠂤 · phần trên bên phải là 𠂤 (đống đất/bậc nhỏ, dạng cổ gần gũi với 阜 không có nét dưới cùng); xếp bộ 辵 (辶).`
- `官` — `guān · quan · 宀 (mái nhà) + 𠂤 (đống đất/kho công) · nghĩa gốc là phủ làm việc công; xếp bộ 宀.`
- `陈 / 阵` — `chén / zhèn · trần / trận · đều thuộc bộ 阜 (阝 trái + 东 / 车), có thể bổ sung khi học mở rộng từ ghép 阵雨, 陈旧.`

---

## Bộ 35: 邑 (Ấp)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-045"` · `radical_index: 45` · `strokes: 7` nét · `name_vi: "bộ Ấp"` · **Có 1 dòng trùng/rỗng:** `radical-195` (`radical_index: 195`, `radical: "邑 / 阝 phải"`, toàn bộ trường dữ liệu hiện đang để rỗng/`null`).
- **Hình thái & Biến thể (`variants`):**
  - `邑` — dạng đầy đủ (7 nét, gồm `囗` thành quách ở trên và `巴` người quỳ/định cư ở dưới).
  - `阝` — ấp phải (2 nét viết trong giản thể/khải thư hiện đại, tính bộ 7 nét), tức **`阝` nằm bên phải chữ**, ví dụ `都, 部, 邮, 邻, 郊`.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "thành ấp, khu dân cư có người ở; hình liên quan vùng cư trú." — Chữ hội ý (Giáp cốt văn vẽ khu đất có tường bao `囗` ở trên và hình người ngồi quỳ `卩/巴` ở dưới -> nơi con người định cư lập ấp).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "thành phố, làng ấp, vùng đất, địa danh, khu hành chính, quan hệ với đô thị/quốc gia." Do thời Chu–Hán nhiều vùng đất, tên nước chư hầu và dòng họ quý tộc lấy tên đất phong đặt chữ có bộ `邑`, nên bộ này xuất hiện dày đặc trong tên địa danh, đơn vị hành chính (`都, 郡, 部, 邦`), cộng đồng (`邻, 郊, 邮`) và họ người (`郑, 邓, 郭, 郎`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** `阝` bên phải thường liên quan thành ấp, địa danh, khu vực, đơn vị hành chính, cộng đồng cư trú.
  - **Phân biệt dễ nhầm (`distinguish`) — Cặp cực hay nhầm `邑` (`阝` phải) vs `阜` (`阝` trái):**
    - `阝` phải = `邑` (Ấp), không phải `阜` (Phụ).
    - Trong giản thể lẫn phồn thể đều cần nhìn vị trí: **`院`**: `阝` trái -> `阜`; **`都`**: `阝` phải -> `邑`.
    - Một số chữ nghĩa đã mở rộng xa như `部` ("bộ phận/phòng ban"), `那` ("kia/đó"), `邪` ("tà ác"), nhưng gốc cổ văn vẫn bắt nguồn từ khu vực, đơn vị cư trú hoặc tên đất cổ.
    - **Cảnh báo dễ nhầm với `卩` (Tiết):** `卩` cũng nằm bên phải (như `即, 印, 却, 节`), nhưng nét sổ bên trái của `卩` kéo thẳng không uốn cong hai vòng tai như `阝`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Đô thị, vùng miền, hành chính & tổ chức (6 chữ)

| Chữ Hán | Pinyin   | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                           |
| ------- | -------- | -------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 邑      | yì       | ấp       | Độc thể (`囗 + 巴`)       | Hội ý: vùng đất có tường bao (`囗`) và người định cư (`巴`) -> ấp, thành ấp, huyện (đơn vị hành chính cổ). Từ ghép: `城邑` (thành ấp), `通都大邑` (đô thị lớn sầm uất).                                                                  |
| 都      | dū / dōu | đô       | `者` (trái) + `阝` (phải) | Hình thanh: `者` (ghi âm) + `阝` (thành ấp) -> `dū`: kinh đô, đô thị lớn nơi vua đóng; `dōu`: mượn làm phó từ "đều, tất cả". Từ ghép: `首都` (thủ đô), `都市` (đô thị), `都是` (đều là).                                                 |
| 郡      | jùn      | quận     | `君` (trái) + `阝` (phải) | Hình thanh kiêm hội ý: `君` (vua chúa/người cai quản, ghi âm `jùn`) + `阝` (vùng đất) -> vùng đất đặt quan cai quản -> quận (đơn vị hành chính cổ). Từ ghép: `郡县` (quận huyện), `州郡` (châu quận).                                    |
| 邦      | bāng     | bang     | `丰` (trái) + `阝` (phải) | Hình thanh: `丰` (cây cối tốt tươi hoặc mốc ranh giới, ghi âm `bāng`) + `阝` (thành ấp) -> nước chư hầu, quốc gia, liên bang. Từ ghép: `联邦` (liên bang), `邻邦` (nước láng giềng), `城邦` (thành bang).                                |
| 郊      | jiāo     | giao     | `交` (trái) + `阝` (phải) | Hình thanh: `交` (giao tiếp, ranh giới tiếp giáp, ghi âm `jiāo`) + `阝` (thành ấp) -> vùng đất giáp ranh bên ngoài kinh thành -> ngoại ô, vùng ven. Từ ghép: `郊区` (ngoại ô), `郊外` (ngoài thành), `郊游` (dã ngoại).                  |
| 部      | bù       | bộ       | `咅` (trái) + `阝` (phải) | Hình thanh: `咅` (ghi âm `bù`) + `阝` (khu vực, địa giới) -> khu vực phân chia trong một vùng -> bộ phận, phòng ban, cơ quan cấp Bộ, toàn bộ; lượng từ cho phim/sách/xe. Từ ghép: `部门` (bộ phận), `部分` (một phần), `全部` (toàn bộ). |

#### Nhóm B: Cư dân, bưu chính & trạng thái cộng đồng (6 chữ)

| Chữ Hán | Pinyin        | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                         |
| ------- | ------------- | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 邻      | lín           | lân      | `令` (trái) + `阝` (phải) | Hình thanh: `令` (giản hóa từ `粦`, ghi âm `lín`) + `阝` (thành ấp) -> năm nhà hợp thành một "lân" -> hàng xóm, láng giềng, gần kề. Từ ghép: `邻居` (hàng xóm), `邻国` (nước láng giềng), `相邻` (tiếp giáp nhau).                                     |
| 邮      | yóu           | bưu      | `由` (trái) + `阝` (phải) | Giản thể dùng `由 + 阝` (phồn thể `郵` là `垂` biên giới + `阝`) -> trạm dịch ở vùng biên ấp truyền công văn -> bưu điện, gửi thư. Từ ghép: `邮局` (bưu điện), `邮件` (bưu kiện/email), `邮票` (tem thư).                                              |
| 鄙      | bǐ            | bỉ       | `啚` (trái) + `阝` (phải) | Hình thanh kiêm hội ý: `啚` (kho lương thực nơi biên thùy) + `阝` (làng ấp) -> vùng ấp hẻo lánh ngoài biên -> quê mùa, thô thiển, thấp hèn, khinh bỉ (cũng dùng tự xưng khiêm tốn). Từ ghép: `卑鄙` (đê tiện), `鄙视` (khinh bỉ), `鄙人` (kẻ hèn này). |
| 郁      | yù            | uất      | `有` (trái) + `阝` (phải) | Hình thanh: `有` (ghi âm `yù`) + `阝` (tên đất cổ) -> tên đất cổ; mở rộng nghĩa rậm rạp, thơm ngào ngạt; giản thể gộp `鬱` nên mang thêm nghĩa u sầu, uất kết. Từ ghép: `浓郁` (đậm đặc, thơm nồng), `忧郁` (u sầu), `郁闷` (uất ức, buồn bực).        |
| 邪      | xié / yé      | tà / gia | `牙` (trái) + `阝` (phải) | Hình thanh: `牙` (ghi âm) + `阝` (tên đất cổ Lang Nha `琅邪`) -> mượn âm nghĩa lệch lạc, tà ác (`xié`); đọc `yé` làm trợ từ nghi vấn văn ngôn. Từ ghép: `邪恶` (tà ác), `正邪` (chính tà), `邪气` (tà khí).                                            |
| 那      | nà / nèi / nā | na       | `冄` (trái) + `阝` (phải) | Hình thanh: `冄` (ghi âm) + `阝` (địa danh cổ nước Na) -> mượn âm dùng làm đại từ chỉ định "kia, đó, ấy" (`nā`: họ Na). Từ ghép: `那里` (ở đó), `那个` (cái kia), `那么` (như vậy).                                                                    |

#### Nhóm C: Danh xưng & Họ người gốc địa danh cổ (4 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                       |
| ------- | ------ | -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 郎      | láng   | lang     | `良` (trái) + `阝` (phải) | Hình thanh: `良` (ghi âm `láng`) + `阝` (tên ấp cổ thời Xuân Thu) -> mượn âm chỉ quan chức thị vệ (Lang trung), chàng trai trẻ, tân lang (chú rể). Từ ghép: `新郎` (chú rể), `郎中` (thầy thuốc Đông y), `牛郎` (Ngưu Lang).         |
| 郑      | zhèng  | trịnh    | `关` (trái) + `阝` (phải) | Giản thể dùng `关` thay `奠` (phồn thể `鄭`): tên nước Trịnh thời Chu; trang trọng, nghiêm túc; họ Trịnh. Từ ghép: `郑重` (trịnh trọng, nghiêm túc), `郑州` (Trịnh Châu).                                                            |
| 邓      | dèng   | đặng     | `又` (trái) + `阝` (phải) | Giản thể dùng `又` thay `登` (phồn thể `鄧`): tên nước Đặng thời cổ, sau trở thành họ Đặng phổ biến. Từ ghép: `邓州` (Đặng Châu), `姓邓` (họ Đặng).                                                                                  |
| 郭      | guō    | quách    | `享` (trái) + `阝` (phải) | Hình thanh kiêm hội ý: `享` (vòng thành quách cao, ghi âm `guō`) + `阝` (thành ấp) -> vòng thành ngoài bảo vệ thành nội -> thành quách, vành ngoài; họ Quách. Từ ghép: `城郭` (thành quách), `外郭` (vành ngoài), `耳郭` (vành tai). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `囗` — `wéi · vi · bộ riêng (#45 trong tập tài liệu), nghĩa bao quanh/tường thành, là thành phần phía trên của chữ 邑 và nhiều chữ địa giới (国, 围, 园).`
- `土` — `tǔ · thổ · bộ riêng (#25 trong DB), chỉ đất đai tự nhiên, khác với 邑 nhấn mạnh khu dân cư/đơn vị hành chính.`
- `乡 / 鄉` — `xiāng · hương · chữ phồn thể 鄉 chứa 阝/邑 ẩn ở cấu trúc đối xứng hai bên bàn tiệc (làng quê, quê hương); dạng giản thể 乡 viết gọn nên xếp ở bộ 乙/幺 (家乡, 故乡).`
- `巷` — `xiàng / hàng · hạng · 共 (trên) + 巳 (dưới) · nghĩa gốc là đường nhỏ giữa các dãy nhà trong ấp (phần dưới vốn biến từ 邑); hiện nay xếp bộ 己 (小巷, 街巷).`
- `阜 / 阝 trái` — `fù · phụ · bộ #34 (bên trái), cặp đối lập vị trí trái–phải cực hay nhầm với 邑 (阝 phải).`

---

## Bộ 36: 辵 (Sước)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-008"` · `radical_index: 8` · `strokes: 7` nét · `name_vi: "bộ Sước / Xước"` · **Có 1 dòng trùng/rỗng:** `radical-194` (`radical_index: 194`, `radical: "辵 / 辶"`, toàn bộ trường dữ liệu hiện đang để rỗng/`null`).
- **Hình thái & Biến thể (`variants`):**
  - `辵` — dạng đầy đủ cổ/ít gặp (7 nét: `彳` bước đi + `止` bàn chân).
  - `辶` — dạng phổ biến trong chữ hiện đại (3 nét trong quy chuẩn viết giản thể, nằm bên trái và ôm đáy chữ theo kết cấu bán bao vây góc dưới-trái).
  - `⻌` — dạng viết/hiển thị khác của `辶` (thường thấy trong bộ gõ/font Trung Quốc đại lục với 1 chấm + nét gấp).
  - `⻍` — biến thể khác trong một số bảng/font (phổ biến trong quy chuẩn phồn thể Đài Loan/Nhật Bản với 2 chấm hoặc đường gấp rõ hơn).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "bước đi, di chuyển trên đường." — Chữ hội ý (Giáp cốt văn ghép `彳` "đường phố/bước chân" và `止` "bàn chân" -> vừa đi vừa dừng, di chuyển trên đường xá).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "đi, đến, qua, tiến/lùi, di chuyển, hành trình, quá trình, thay đổi vị trí/trạng thái." Từ hành động đi lại vật lý (`进, 退, 逃, 追`), bộ `辶` chuyển nghĩa sang khoảng cách không gian-thời gian (`远, 近, 过`), vận chuyển/truyền đạt (`运, 送, 通`) và các khái niệm trừu tượng chỉ quá trình hoặc đại từ chỉ hướng (`这, 选, 连`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** Có `辶 / ⻌` thường liên quan đi, đến, qua, đưa, chuyển, đuổi, tránh, xa/gần.
  - **Phân biệt dễ nhầm (`distinguish`) — Cặp cực hay nhầm `辵 (辶)` vs `廴` (Dẫn) và `走`, `彳`:**
    - **`辶` (Sước - 3 nét viết) vs `廴` (Dẫn - 2 nét viết):**
      - `辶` **CÓ 1 nét chấm ở trên đầu**, sau đó mới tới nét gập ngang-gập-phẩy và nét mác dài ôm bên dưới chữ (như `这, 过, 进, 送, 远, 道`).
      - `廴` (bộ Dẫn — kéo dài, bước dài) **KHÔNG có nét chấm ở trên**, chỉ có nét ngang gập phẩy liền + nét mác kéo dài bên dưới. Bộ `廴` có rất ít chữ thông dụng, tiêu biểu là **`建` (kiến), `延` (diên), `廷` (đình)** — tuyệt đối **không xếp nhầm `建, 延, 廷` sang bộ `辶`**!
    - `走` (Tẩu - chạy), `彳` (Xích - bước chân trái), `廴` (Dẫn - bước dài) đều liên quan chuyển động nhưng là các bộ độc lập khác nhau.
    - `辶` đôi khi biểu thị nghĩa trừu tượng kiểu "quá trình" (`过`, `通`, `连`) hoặc ngữ pháp (`这`, `还`) chứ không chỉ đi bộ thật.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Đi, đến, tiến lùi & khoảng cách (8 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                   |
| ------- | ------ | -------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 进      | jìn    | tiến     | `辶` + `井`           | Giản thể dùng `井` thay `隹` (phồn thể `進`): chim bay/người bước thẳng lên phía trước -> đi vào, tiến lên, tiến bộ. Từ ghép: `进入` (đi vào), `进步` (tiến bộ), `进口` (nhập khẩu/lối vào).                     |
| 退      | tuì    | thoái    | `辶` + `艮`           | Hội ý: `辶` (bước đi) + `艮` (người ngoái đầu nhìn lại phía sau) -> lùi bước, rút lui, trả lại, phai màu. Từ ghép: `后退` (lùi lại), `退货` (trả hàng), `退休` (nghỉ hưu).                                       |
| 过      | guò    | quá      | `辶` + `寸`           | Giản thể dùng `寸` thay `咼` (phồn thể `過`): đi ngang qua -> trải qua, quá khứ, vượt quá; trợ từ động thái biểu thị từng làm qua. Từ ghép: `过去` (quá khứ), `经过` (trải qua), `过年` (ăn Tết).                |
| 达      | dá     | đạt      | `辶` + `大`           | Giản thể dùng `大` (phồn thể `達` là `辶 + 羍`): đường thông suốt đi tới đích -> đến nơi, đạt được, biểu đạt. Từ ghép: `到达` (đến nơi), `表达` (biểu đạt), `发达` (phát đạt).                                   |
| 近      | jìn    | cận      | `辶` + `斤`           | Hình thanh: `辶` (khoảng cách đi lại) + `斤` (cái rìu, ghi âm `jìn`) -> gần gũi (về không gian, thời gian, quan hệ). Từ ghép: `附近` (lân cận), `最近` (gần đây), `接近` (tiếp cận).                             |
| 远      | yuǎn   | viễn     | `辶` + `元`           | Hình thanh: `辶` (đường đi) + `元` (phồn thể `遠` có `袁`, ghi âm `yuǎn`) -> khoảng cách đi dài -> xa xôi, lâu dài. Từ ghép: `遥远` (xa xôi), `永远` (mãi mãi), `远方` (phương xa).                              |
| 返      | fǎn    | phản     | `辶` + `反`           | Hình thanh kiêm hội ý: `辶` (đi) + `反` (lật ngược, quay đầu, ghi âm `fǎn`) -> quay trở lại nơi xuất phát. Từ ghép: `返回` (quay về), `往返` (khứ hồi, đi lại), `返程` (chuyến về).                              |
| 迎      | yíng   | nghênh   | `辶` + `卬`           | Hình thanh kiêm hội ý: `辶` (đi ra) + `卬` (người ngẩng lên hướng về phía trước, ghi âm `yíng`) -> đi ra đón tiếp, hướng về, đối mặt. Từ ghép: `欢迎` (hoan nghênh), `迎接` (đón tiếp), `迎面` (ngay trước mặt). |

#### Nhóm B: Vận chuyển, truyền đưa, rượt đuổi & lẩn tránh (7 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                      |
| ------- | ------ | -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 送      | sòng   | tống     | `辶` + `关` (`𢀖`)    | Hội ý: `辶` (đi đường) + phần trong gốc là hai tay cầm đuốc tiễn người đi xa -> tiễn đưa, giao hàng, tặng quà. Từ ghép: `送礼` (tặng quà), `发送` (gửi đi), `送别` (tiễn biệt).                                                     |
| 运      | yùn    | vận      | `辶` + `云`           | Giản thể dùng `云` thay `軍` (phồn thể `運`): xoay chuyển di dời -> vận chuyển, vận động, vận dụng, vận mệnh. Từ ghép: `运动` (vận động/thể thao), `运输` (vận tải), `运气` (vận may).                                              |
| 追      | zhuī   | truy     | `辶` + `𠂤`           | Hình thanh kiêm hội ý: `辶` (chạy bước) + `𠂤` (gò đất/đội quân, ghi âm `zhuī`) -> chạy theo phía sau -> đuổi theo, truy tìm, theo đuổi. Từ ghép: `追求` (theo đuổi), `追赶` (đuổi theo), `追问` (truy hỏi).                        |
| 逃      | táo    | đào      | `辶` + `兆`           | Hình thanh: `辶` (chạy bước) + `兆` (chia tách, ghi âm `táo`) -> chạy trốn khỏi nơi nguy hiểm, trốn tránh. Từ ghép: `逃跑` (chạy trốn), `逃避` (trốn tránh), `逃学` (trốn học).                                                     |
| 避      | bì     | tị       | `辶` + `辟`           | Hình thanh: `辶` (đi lánh) + `辟` (ghi âm `bì`) -> đi vòng qua để né -> tránh né, phòng tránh. Từ ghép: `避免` (tránh khỏi), `逃避` (lẩn tránh), `避暑` (tránh nóng).                                                               |
| 迁      | qiān   | thiên    | `辶` + `千`           | Hình thanh: `辶` (di chuyển) + `千` (phồn thể `遷` có `䙴`, ghi âm `qiān`) -> dời chỗ ở, thăng chuyển chức vụ, biến đổi. Từ ghép: `搬迁` (chuyển nhà/dời chỗ), `变迁` (biến thiên), `迁就` (nhân nhượng).                           |
| 迷      | mí     | mê       | `辶` + `米`           | Hình thanh kiêm hội ý: `辶` (đi lại) + `米` (hạt gạo nhỏ rải bốn phương, ghi âm `mí`) -> đi lạc phương hướng -> lạc đường, mê hoặc, say mê, người hâm mộ. Từ ghép: `迷路` (lạc đường), `球迷` (người hâm mộ bóng), `入迷` (say mê). |

#### Nhóm C: Đường xá, kết nối, chọn lựa & chỉ định (7 chữ)

| Chữ Hán | Pinyin     | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                       |
| ------- | ---------- | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 道      | dào        | đạo      | `辶` + `首`           | Hội ý kiêm hình thanh: `辶` (đi lại) + `首` (cái đầu hướng đi) -> con đường đi -> đạo lý, quy luật, phương pháp, nói; lượng từ cho dòng sông/món ăn/cửa. Từ ghép: `道路` (đường xá), `知道` (biết), `道理` (đạo lý). |
| 边      | biān       | biên     | `辶` + `力`           | Giản thể rút gọn `臱` thành `力` (phồn thể `邊`): đi dọc theo mép rìa -> bên cạnh, rìa, biên giới. Từ ghép: `旁边` (bên cạnh), `一边` (một bên/vừa... vừa...), `边境` (biên giới).                                   |
| 通      | tōng       | thông    | `辶` + `甬`           | Hình thanh: `辶` (đi qua) + `甬` (ống thông suốt, ghi âm `tōng`) -> đi thẳng không vướng -> thông suốt, thông báo, giao thông, thông thạo. Từ ghép: `交通` (giao thông), `通知` (thông báo), `普通` (phổ thông).     |
| 连      | lián       | liên     | `辶` + `车`           | Hội ý: `辶` (đi lại) + `车` (xe cộ nối đuôi nhau thành hàng) -> nối liền, liên tiếp, thậm chí, ngay cả. Từ ghép: `连接` (kết nối), `连续` (liên tục), `连忙` (vội vàng).                                             |
| 选      | xuǎn       | tuyển    | `辶` + `先`           | Hình thanh: `辶` (dẫn đi/đưa ra) + `先` (phồn thể `選` có `巽`, ghi âm) -> kén chọn người/vật đi đầu -> lựa chọn, tuyển chọn, bầu cử. Từ ghép: `选择` (lựa chọn), `选手` (tuyển thủ), `选举` (bầu cử).               |
| 还      | hái / huán | hoàn     | `辶` + `不`           | Giản thể dùng `不` thay `睘` (phồn thể `還`): đi vòng quay về -> `huán`: trả lại, trở về; `hái`: mượn làm phó từ "vẫn, còn, nữa". Từ ghép: `归还` (trả lại), `还有` (còn có), `还是` (vẫn là / hay là).              |
| 这      | zhè / zhèi | giá      | `辶` + `文`           | Giản thể dùng `文` thay `言` (phồn thể `這`): nghĩa cổ là đón tiếp, sau mượn làm đại từ chỉ thị gần "này, đây". Từ ghép: `这里` (ở đây), `这个` (cái này), `这样` (như thế này).                                     |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `走` — `zǒu · tẩu · bộ riêng (#53 trong tập tài liệu phần 3), nghĩa gốc là chạy, hiện đại là đi bộ (走路, 跑步); không nhập vào 辵.`
- `彳` — `chì · xích · bộ riêng (#43 trong tập tài liệu phần 2), vẽ ngã ba đường/bước chân trái, chỉ hành động đi chậm, tuần hành (行, 很, 得, 往).`
- `廴` — `yǐn · dẫn · bộ riêng (2 nét, không có chấm đầu), cực hay nhầm với 辶 vì cùng ôm dưới chữ; chỉ gồm vài chữ tiêu biểu như 建 (kiến - xây dựng), 延 (diên - kéo dài), 廷 (đình - triều đình).`
- `止` — `zhǐ · chỉ · bộ riêng (#53), hình bàn chân, chính là thành phần bên dưới tạo nên chữ 辵.`
- `随` — `suí · tùy · 阝 (Phụ trái) + 有 + 辶 · tuy phần bên phải có 辶, nhưng toàn chữ xếp ở bộ 阜 (阝 trái) (随便, 随着).`
- `链` — `liàn · liên · 钅 (Kim) + 连 (có 辶) · sợi dây xích kim loại (项链, 链条); xếp bộ 金 (钅).`

---

## Bộ 37: 欠 (Khiếm)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-088"` · `radical_index: 88` · `strokes: 4` nét · `name_vi: "bộ Khiếm"` · Không có dòng trùng/rỗng.
- **Hình thái & Biến thể (`variants`):**
  - `欠` — dạng chính (4 nét: phẩy, ngang gập móc, phẩy, mác; thường đứng bên phải chữ ghép).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "người há miệng thở/há hốc/ngáp." — Chữ tượng hình (Giáp cốt văn vẽ hình người quỳ `人` ở dưới với cái đầu ngửa lên há to miệng thở ra làn hơi ở trên).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "thiếu/nợ, ngáp, hơi thở; trong nhiều chữ gợi âm thanh/hành động phát ra từ miệng hoặc cảm xúc thở than." Từ hình ảnh mở miệng hà hơi, bộ `欠` tạo nhóm chữ về ca hát (`歌`), vui mừng reo cười (`欢, 欣`), thở than/nức nở (`欷, 欸, 欤`), nghỉ lấy hơi (`歇`), thèm muốn há miệng (`欲`); đồng thời khi đứng độc lập, nghĩa ngáp/hụt hơi chuyển sang "thiếu hụt, mắc nợ" (`欠缺, 欠款`) và "áy náy vì thiếu sót" (`歉`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** Có `欠` có thể liên quan há miệng, thở, âm thanh/cảm xúc; nhưng `欠` đứng riêng hiện đại nghĩa là thiếu/nợ.
  - **Phân biệt dễ nhầm (`distinguish`):**
    - `欠` đứng riêng = thiếu/nợ (`欠款`, `欠债`) hoặc ngáp (`打哈欠`).
    - Trong `歌, 欣, 欢`, `欠` gợi trạng thái mở miệng/hơi thở/cảm xúc vui mừng hoặc ca hát hơn là nghĩa "nợ".
    - `次` có `欠` nhưng nghĩa "lần/thứ tự" đã phát triển riêng từ cổ văn (`二 + 欠` -> xếp hàng nối tiếp nhau), không đoán máy móc theo nghĩa "thiếu".
    - **Phân biệt hình dạng:** `欠` (4 nét: nét trên có mũ `𠂊` ôm lấy `人`) khác với `文` (có nét chấm đầu và nét ngang), `反` (bên ngoài là vách `厂`, bên trong là `又`) và `攵` (bộ Phộc — nét phẩy + ngang ở trên rồi mới đánh chéo `乂`, không có đầu `人` móc).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Hơi thở, âm thanh, ca hát & cảm xúc (7 chữ)

| Chữ Hán | Pinyin       | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                  |
| ------- | ------------ | -------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 欠      | qiàn         | khiếm    | Độc thể (`欠`)            | Tượng hình người há miệng ngáp -> ngáp (`哈欠`); chuyển nghĩa thành thiếu hụt, mắc nợ, cúi gập người (hơi nghiêng). Từ ghép: `哈欠` (ngáp), `欠款` (nợ tiền), `欠佳` (chưa được tốt).                           |
| 欢      | huān         | hoan     | `又` (trái) + `欠` (phải) | Giản thể dùng `又` thay `雚` (phồn thể `歡`): há miệng reo vui, hoan hô -> vui mừng, yêu thích, hoan nghênh. Từ ghép: `喜欢` (thích), `欢迎` (hoan nghênh), `欢乐` (vui vẻ).                                    |
| 欣      | xīn          | hân      | `斤` (trái) + `欠` (phải) | Hình thanh kiêm hội ý: `斤` (ghi âm `xīn`) + `欠` (cười mỉm, vui lòng mở miệng) -> vui mừng, hân hoan, thưởng thức. Từ ghép: `欣赏` (thưởng thức/đánh giá cao), `欣喜` (vui mừng), `欣慰` (an ủi, hài lòng).    |
| 歌      | gē           | ca       | `哥` (trái) + `欠` (phải) | Hình thanh kiêm hội ý: `哥` (ghi âm `gē`, bản thân `哥` cổ văn cũng là `可+可` chỉ kéo dài tiếng) + `欠` (há miệng cất hơi) -> hát, bài hát, ca ngợi. Từ ghép: `唱歌` (hát), `歌曲` (bài hát), `诗歌` (thơ ca). |
| 歆      | xīn          | hâm      | `音` (trái) + `欠` (phải) | Hội ý kiêm hình thanh: `音` (âm thanh/hương vị) + `欠` (há miệng hít vào/thưởng thức) -> thần linh hưởng mùi thơm lễ vật -> ưa thích, hâm mộ. Từ ghép: `歆羡` (ngưỡng mộ, thèm muốn), `歆享` (hưởng lễ vật).    |
| 欷      | xī           | hi       | `希` (trái) + `欠` (phải) | Hình thanh kiêm hội ý: `希` (ghi âm `xī`) + `欠` (thở hơi) -> nức nở, thở dài sụt sùi khi thương cảm. Từ ghép: `欷歔` (thút thít thở dài), `叹欷` (than thở).                                                   |
| 欸      | ǎi / éi / xǔ | ai / hĩ  | `矣` (trái) + `欠` (phải) | Hình thanh: `矣` (trợ từ) + `欠` (phát tiếng từ miệng) -> thán từ đáp lời, tiếng thở dài, tiếng hò mái chèo sông nước. Từ ghép: `欸乃` (tiếng kẽo kẹt mái chèo và tiếng hò).                                    |

#### Nhóm B: Mong muốn, thiếu sót, nghỉ ngơi & hành vi (5 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                     |
| ------- | ------ | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 欲      | yù     | dục      | `谷` (trái) + `欠` (phải)      | Hình thanh kiêm hội ý: `谷` (khe sâu trống rỗng, ghi âm `yù`) + `欠` (há miệng thèm khát) -> ham muốn, khát khao, sắp sửa. Từ ghép: `欲望` (dục vọng), `食欲` (cảm giác thèm ăn), `欲言又止` (muốn nói lại thôi).  |
| 歇      | xiē    | hiết     | `曷` (trái) + `欠` (phải)      | Hình thanh kiêm hội ý: `曷` (hết, ghi âm) + `欠` (ngừng thở dốc, nghỉ lấy hơi) -> dừng lại nghỉ ngơi, ngưng, tắt. Từ ghép: `歇息` (nghỉ ngơi), `歇会` (nghỉ một lát), `停歇` (ngừng nghỉ).                         |
| 歉      | qiàn   | khiểm    | `兼` (trái) + `欠` (phải)      | Hình thanh kiêm hội ý: `兼` (ghi âm) + `欠` (thiếu hụt) -> thu hoạch mất mùa, thiếu thốn -> cảm thấy thiếu sót, áy náy, xin lỗi. Từ ghép: `道歉` (xin lỗi), `抱歉` (lấy làm tiếc), `歉收` (mất mùa).               |
| 欺      | qī     | khi      | `其` (trái) + `欠` (phải)      | Hình thanh: `其` (ghi âm `qī`) + `欠` (nói dối/há miệng lừa phỉnh) -> lừa dối, ức hiếp, bắt nạt. Từ ghép: `欺骗` (lừa gạt), `欺负` (bắt nạt), `自欺欺人` (tự dối mình dối người).                                  |
| 款      | kuǎn   | khoản    | `士 + 示` (trái) + `欠` (phải) | Hình thanh kiêm hội ý: phần trái gốc là thờ cúng trang trọng (`𥘅`) + `欠` (lời khấn thành tâm) -> thành khẩn, khoản mục, tiền tệ, kiểu dáng. Từ ghép: `存款` (tiền gửi), `款式` (kiểu dáng), `条款` (điều khoản). |

#### Nhóm C: Thứ tự, ngữ khí & nghĩa mở rộng/phiên âm (3 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                |
| ------- | ------ | -------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 次      | cì     | thứ      | `冫` (trái) + `欠` (phải)       | Hội ý: cổ văn là `二` (xếp hàng thứ hai) + `欠` -> không phải đầu tiên -> thứ bậc, lần (lượng từ), chất lượng kém/thứ yếu, dừng chân dọc đường. Từ ghép: `一次` (một lần), `其次` (thứ đến/ngoài ra), `次品` (hàng thứ phẩm). |
| 欧      | ōu     | âu       | `区` (`區`, trái) + `欠` (phải) | Hình thanh: `区` (ghi âm `ōu`) + `欠` (há miệng nôn mửa trong nghĩa cổ) -> hiện đại dùng để phiên âm châu Âu, đơn vị điện trở Ôm, họ Âu. Từ ghép: `欧洲` (châu Âu), `欧元` (đồng Euro), `欧美` (Âu Mỹ).                       |
| 欤      | yú     | dư       | `与` (`與`, trái) + `欠` (phải) | Hình thanh: `与` (ghi âm `yú`) + `欠` (hơi thở cuối câu) -> trợ từ ngữ khí đặt cuối câu trong văn ngôn để hỏi hoặc cảm thán. Từ ghép: `可乎欤` (có được chăng?), `嗟欤` (than ôi!).                                           |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `口` — `kǒu · khẩu · bộ riêng (#03 trong DB), chỉ cái miệng, hay phối hợp với chữ nhóm 欠 về phát âm và cảm xúc.`
- `吹` — `chuī · xuy · 口 (miệng) + 欠 (thổi hơi) · thổi, khoác lác (吹牛, 吹风); xếp bộ 口.`
- `饮` — `yǐn · ẩm · 饣 (Thực) + 欠 (há miệng hớp) · uống, đồ uống (饮料, 饮食); xếp bộ 食 (饣).`
- `软` — `ruǎn · nhuyễn · 车 (xe) + 欠 (lún nhẹ, ghi âm) · mềm mại, yếu ớt (柔软, 软件); xếp bộ 車 (车).`
- `砍` — `kǎn · khảm · 石 (đá) + 欠 (há miệng/rìu bổ, ghi âm) · chặt, chém (砍树, 砍价); xếp bộ 石.`
- `炊` — `chuī · xuy · 火 (lửa) + 欠 (thổi lửa) · thổi lửa nấu cơm (炊烟, 野炊); xếp bộ 火.`
- `盗 / 资 / 姿` — `dào / zī / zī · đạo / tư / tư · đều mang thành phần 次 (冫+欠) ở phía trên làm nghĩa/thanh phù (trộm cắp, tiền vốn, tư thế), nhưng lần lượt xếp ở bộ 皿, 贝, 女.`
- `钦` — `qīn · khâm · 钅 (Kim) + 欠 · kính trọng, khâm phục (钦佩, 钦差); phồn thể 欽 xếp bộ 欠, giản thể thường quy về bộ 金 (钅).`
- `叹` — `tàn · thán · 口 + 又 · thở dài, cảm thán (叹气, 赞叹); phồn thể 歎 thuộc bộ 欠, giản thể đổi phần phải thành 又 và xếp bộ 口.`

---

## Bộ 38: 巾 (Cân)

> **[CHƯA CÓ TRONG DB - Đề xuất bổ sung]**

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`) — Đề xuất bổ sung

- **DB ID & Thứ tự:** **[CHƯA CÓ TRONG DB - Đề xuất bổ sung]** · Hiện chưa tồn tại dòng nào cho bộ `巾` trong snapshot `hanzihome_radicals`.
  - **Đề xuất khi thêm mới vào DB:** cấp `id` và `radical_index` kế tiếp (ví dụ nối tiếp sau `#244`), đặt `radical: "巾"`, `name_vi: "bộ Cân"`, `strokes: 3`.
- **Hình thái & Biến thể (`variants` — Đề xuất):**
  - `巾` — dạng chính (3 nét: sổ thẳng, ngang gập móc, sổ xuyên giữa từ trên xuống), có thể đứng độc lập (`毛巾`), đứng bên trái (`帽, 帕, 幅, 帐`), hoặc nằm bên dưới (`布, 常, 帮, 席, 带, 幕`).
- **Ý nghĩa cốt lõi (`core_meaning` — Đề xuất):**
  - _Nguồn gốc / Lục thư (`history`):_ "chiếc khăn/tấm vải treo rủ xuống." — Chữ tượng hình (Giáp cốt văn vẽ dải vải đeo ngang thắt lưng buông rủ hai đầu xuống dưới).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "khăn, vải vóc, lều trướng, cờ hiệu, mũ đai và trang phục che phủ; mở rộng sang tiền tệ, chợ búa và trạng thái thường lệ." Vì vải lụa thời xưa vừa dùng làm khăn mũ, rèm trướng (`帽, 帐, 幕`), cờ hiệu quân đội (`帜, 师, 帅`), vừa làm vật ngang giá trao đổi tại chợ (`市, 币`), bộ `巾` bao trùm từ đồ vải vóc hằng ngày đến tiền bạc và tổ chức xã hội.
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — Đề xuất):**
  - **Nhận diện nhanh (`recognition`):** Có `巾` thường liên quan khăn, vải, màn trướng, mũ nón, dây đai, cờ hiệu, bức tranh/diện tích vải hoặc chợ búa, tiền tệ cổ.
  - **Phân biệt dễ nhầm (`distinguish`):**
    - `巾` (3 nét): không có nét chấm trên đầu, không có nét ngang trên cùng (`毛巾, 布, 帮, 帽`).
    - **`巾` vs `市` vs `巿`:** `市` (thị - chợ, 5 nét) là `亠 + 巾` (xếp bộ `巾`); còn `巿` (phất - 4 nét, nét sổ giữa xuyên thẳng qua nét ngang trên như trong `肺, 沛`) KHÔNG có nét chấm tách rời như `市`, và `肺` thuộc bộ `肉`, không thuộc `巾`.
    - **`巾` vs `衣 / 衤` (Y) vs `糸 / 纟` (Mịch):** `巾` thiên về **tấm vải dệt, khăn, rèm, mũ, cờ**; `衣/衤` thiên về **áo quần may mặc trên người** (`衬衫, 裙子`); `糸/纟` thiên về **sợi tơ, dây chỉ, dệt buộc** (`线, 红, 织`).
    - Tránh xếp nhầm chữ `吊` (treo — bộ `口`), `归` (về — bộ `彐`), `扫` (quét — bộ `扌`) vào bộ `巾` dù phần nét có dáng gần `巾`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups` — Đề xuất)

#### Nhóm A: Khăn, vải vóc, buồm & màn trướng (9 chữ)

| Chữ Hán | Pinyin          | Hán Việt      | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                 |
| ------- | --------------- | ------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 巾      | jīn             | cân           | Độc thể (`巾`)            | Tượng hình tấm khăn rủ xuống -> khăn lau, khăn choàng. Từ ghép: `毛巾` (khăn mặt), `围巾` (khăn quàng cổ), `纸巾` (khăn giấy).                                                                                                                                 |
| 布      | bù              | bố            | `𠂇` (trên) + `巾` (dưới) | Hình thanh kiêm hội ý: `父` cổ văn ghi âm (rút gọn thành `𠂇`) + `巾` (tấm vải) -> vải dệt (vải bông, vải gai); mở rộng nghĩa trải ra, bố trí, công bố. Từ ghép: `布料` (vải vóc), `公布` (công bố), `布置` (bố trí).                                          |
| 帕      | pà              | mạt / phạ     | `巾` (trái) + `白` (phải) | Hình thanh: `巾` (khăn) + `白` (trắng, ghi âm) -> khăn tay vuông, khăn trùm đầu. Từ ghép: `手帕` (khăn tay), `头帕` (khăn đội đầu), `帕米尔` (cao nguyên Pamir).                                                                                               |
| 帖      | tiē / tiě / tiè | thiếp         | `巾` (trái) + `占` (phải) | Hình thanh: `巾` (vải lụa viết chữ/trải phẳng) + `占` (ghi âm) -> `tiē`: phục tùng, dán vào, ổn thỏa (`妥帖`); `tiě`: thiệp mời, giấy ghi chú; `tiè`: sách tập viết chữ đẹp (`字帖`). Từ ghép: `请帖` (thiệp mời), `妥帖` (ổn thỏa), `字帖` (vở mẫu thư pháp). |
| 帆      | fān             | phàm          | `巾` (trái) + `凡` (phải) | Hình thanh kiêm hội ý: `巾` (tấm vải lớn) + `凡` (chỉ gió thổi căng, ghi âm `fān`) -> cánh buồm căng gió, đi thuyền buồm. Từ ghép: `帆船` (thuyền buồm), `一帆风顺` (thuận buồm xuôi gió).                                                                     |
| 帐      | zhàng           | trướng        | `巾` (trái) + `长` (phải) | Hình thanh: `巾` (màn vải) + `长` (dài, ghi âm `zhàng`) -> màn che, lều trướng; sổ sách ghi chép (xưa viết trên lụa/sổ -> sổ sách, tài khoản). Từ ghép: `蚊帐` (màn chống muỗi), `帐篷` (lều bạt), `结帐` (thanh toán).                                        |
| 幕      | mù              | mạc           | `莫` (trên) + `巾` (dưới) | Hình thanh kiêm hội ý: `莫` (mặt trời lặn giữa cỏ, che khuất, ghi âm `mù`) + `巾` (màn vải) -> tấm màn lớn, phông rèm, màn hình, hồi kịch. Từ ghép: `屏幕` (màn hình), `开幕` (khai mạc), `字幕` (phụ đề).                                                     |
| 幅      | fú              | bức / phúc    | `巾` (trái) + `畐` (phải) | Hình thanh: `巾` (tấm vải) + `畐` (đầy đủ, ghi âm `fú`) -> khổ rộng của tấm vải -> biên độ, phạm vi; lượng từ cho tranh, ảnh, vải. Từ ghép: `一幅画` (một bức tranh), `幅度` (biên độ), `大幅` (biên độ lớn).                                                  |
| 帧      | zhēn            | trinh / chính | `巾` (trái) + `贞` (phải) | Hình thanh: `巾` (tranh lụa) + `贞` (ghi âm `zhēn`) -> lượng từ cho bức tranh, bức ảnh, khung hình video/ảnh động. Từ ghép: `一帧画` (một bức tranh), `帧率` (tốc độ khung hình FPS).                                                                          |

#### Nhóm B: Mũ nón, dây đai, chiếu & cờ hiệu (4 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                       |
| ------- | ------ | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 帽      | mào    | mạo      | `巾` (trái) + `冒` (phải)        | Hình thanh kiêm hội ý: `巾` (vải khăn trùm) + `冒` (chụp lên đầu, ghi âm `mào`) -> mũ, nón, nắp đậy giống mũ. Từ ghép: `帽子` (cái mũ), `草帽` (mũ cói), `笔帽` (nắp bút).                                           |
| 带      | dài    | đới      | `丗` + `冖` (trên) + `巾` (dưới) | Tượng hình: phần trên vẽ đồ trang sức móc vào đai lưng + `巾` (dải vải) -> thắt lưng, dây đai, dải đất/băng đĩa; động từ: mang theo, dẫn dắt. Từ ghép: `皮带` (thắt lưng da), `带来` (mang đến), `热带` (nhiệt đới). |
| 席      | xí     | tịch     | `广 + 廿` (trên) + `巾` (dưới)   | Hội ý: mái nhà `广` và vật đan dệt (`廿` + `巾`) -> chiếc chiếu trải ngồi -> chỗ ngồi, ghế đại biểu, bữa tiệc. Từ ghép: `主席` (chủ tịch), `出席` (tham dự), `酒席` (tiệc rượu).                                     |
| 帜      | zhì    | xí       | `巾` (trái) + `只` (phải)        | Giản thể thay `戠` bằng `只` (phồn thể `幟`): tấm vải đánh dấu nhận diện -> lá cờ, cờ hiệu, biểu tượng. Từ ghép: `旗帜` (cờ xí, ngọn cờ), `独树一帜` (độc đáo một phong cách riêng).                                 |

#### Nhóm C: Chợ búa, tiền tệ, quân sư & tính chất thường lệ (8 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                             |
| ------- | ------ | -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 市      | shì    | thị      | `亠` (trên) + `巾` (dưới)           | Hội ý kiêm hình thanh (xếp bộ `巾`): cổ văn trên là người/ký hiệu tụ họp + `巾` (lều vải nơi buôn bán) -> chợ búa, thị trường, thành phố. Từ ghép: `城市` (thành phố), `市场` (thị trường), `超市` (siêu thị).                             |
| 币      | bì     | tệ       | `丿` (trên) + `巾` (dưới)           | Giản thể từ `幣` (`敝 + 巾`): tấm lụa vải dùng làm lễ vật và vật ngang giá trao đổi -> tiền tệ, đồng tiền. Từ ghép: `货币` (tiền tệ), `人民币` (Nhân dân tệ), `硬币` (tiền xu).                                                            |
| 帮      | bāng   | bang     | `邦` (trên) + `巾` (dưới)           | Hình thanh (phồn thể `幫` là `封 + 巾`): `邦` (ghi âm `bāng`) + `巾` (vải bọc mép giày hoặc cờ hiệu tụ họp) -> giúp đỡ, hỗ trợ; băng nhóm, bọn. Từ ghép: `帮助` (giúp đỡ), `帮忙` (giúp một tay), `帮派` (bang phái).                      |
| 师      | shī    | sư       | `丨+丿` (trái) + `一+巾` (phải)     | Hội ý (giản hóa từ `師` = `𠂤 + 帀`): gò đất đồn trú có cờ vải cắm quanh (`巾`) -> đơn vị quân đội xưa (sư đoàn), người đứng đầu truyền dạy -> thầy giáo, thợ giỏi. Từ ghép: `老师` (giáo viên), `师傅` (sư phụ/bác thợ), `医师` (bác sĩ). |
| 帅      | shuài  | soái     | `丨+丿` (trái) + `巾` (phải)        | Hội ý (giản hóa từ `帥` = `𠂤 + 巾`): chiếc khăn đeo hông biểu trưng cho tướng lĩnh -> thống soái, người chỉ huy; mở rộng nghĩa khôi ngô, đẹp trai. Từ ghép: `元帅` (nguyên soái), `帅哥` (anh chàng đẹp trai), `帅气` (bảnh bao).         |
| 帝      | dì     | đế       | `亠 + 丷 + 冖` (trên) + `巾` (dưới) | Tượng hình (xếp bộ `巾`): cổ văn vẽ đài hoa hoặc giàn củi tế trời, khải biến tách phần dưới thành `巾` -> Thượng đế, hoàng đế, vua tối cao. Từ ghép: `皇帝` (hoàng đế), `帝国` (đế quốc), `上帝` (Thượng đế).                              |
| 常      | cháng  | thường   | `尚` (trên) + `巾` (dưới)           | Hình thanh: `尚` (ghi âm `cháng`) + `巾` (váy xiêm bên dưới thời cổ) -> quy tắc cố định, bình thường, thường xuyên. Từ ghép: `经常` (thường xuyên), `非常` (rất, phi thường), `正常` (bình thường).                                        |
| 希      | xī     | hy       | `乂` (trên) + `𠂇 + 巾` (dưới)      | Hội ý: `乂` (sợi đan thưa) + `巾` (vải) -> vải dệt thưa -> thưa thớt, ít ỏi (`稀`); mượn dùng với nghĩa mong ước, hy vọng. Từ ghép: `希望` (hy vọng), `希奇` (hiếm lạ), `希腊` (Hy Lạp).                                                   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components` — Đề xuất)

- `衣 / 衤` — `yī · y · bộ riêng (#48 trong tập tài liệu phần 2), chỉ quần áo may mặc mặc lên người (衫, 裙, 袜), phân biệt với 巾 thiên về vải tấm, khăn và mũ đai.`
- `糸 / 纟` — `mì · mịch · bộ riêng (#17 trong DB), chỉ sợi tơ chỉ dệt và dây buộc (红, 线, 纸).`
- `吊` — `diào · điếu · 口 (trên) + 巾 (dưới) · treo lủng lẳng (吊车, 吊桥); chữ chứa 巾 nhưng xếp bộ 口.`
- `闹` — `nào · náo · 门 (cửa) + 市 (tấm lều chợ, thuộc bộ 巾) · chợ họp ồn ào nơi cửa thành -> náo nhiệt, làm ồn (热闹, 闹钟); xếp bộ 門 (门).`
- `棉` — `mián · miên · 木 (cây) + 帛 (白 + 巾) · cây bông cho sợi dệt vải trắng (棉花, 棉被); xếp bộ 木.`
- `锦` — `jǐn · cẩm · 钅 (Kim) + 帛 (白 + 巾) · vải gấm dệt kim tuyến lộng lẫy (锦绣, 前程似锦); xếp bộ 金 (钅).`
- `肺` — `fèi · phế · ⺼ (Nhục) + 巿 · phần phải là 巿 (4 nét sổ thẳng, không phải 市 của bộ 巾); xếp bộ 肉.`

---

## Bộ 39: 示 (Thị)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-018"` · `radical_index: 18` · `strokes: 5` nét · `name_vi: "bộ Thị"` · **Có 1 dòng trùng/rỗng:** `radical-151` (`radical_index: 151`, `radical: "示"`, toàn bộ trường dữ liệu hiện đang để rỗng/`null`).
- **Hình thái & Biến thể (`variants`):**
  - `示` — dạng đầy đủ (5 nét: hai nét ngang + `小`, thường đứng độc lập hoặc nằm ở phía dưới chữ như `祭, 禁, 票, 禀`).
  - `礻` — thị bàng (4 nét), dạng rút gọn cực kỳ phổ biến khi đứng bên trái chữ ghép (`神, 福, 礼, 社, 祝, 祖`).
  - `⺬` — dạng biến thể gần `示` trong một số bảng chữ/font (phổ biến khi giữ gần nguyên dạng `示` ở bên trái trong các bộ chữ truyền thống/Nhật Bản).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "bàn thờ/tế đàn, nơi bày lễ vật để thờ cúng." — Chữ tượng hình (Giáp cốt văn vẽ bàn thờ đá hình chữ T, sau thêm hai nét hai bên tượng trưng lễ vật hoặc rượu tế nhỏ xuống bàn thờ; nét ngang trên cùng tượng trưng trời cao).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "thần linh, thờ cúng, lễ nghi, cầu phúc, điều lành/dữ; ngoài ra `示` đứng riêng nghĩa là 'chỉ ra, biểu thị'." Từ bàn thờ giao tiếp với thần linh, bộ `示 / 礻` tạo thành toàn bộ trường từ vựng tâm linh, lễ tết, tế tự, tổ tiên, cầu khấn, phúc họa và điều cấm kỵ; khi đứng riêng `示` chuyển sang nghĩa "thần linh hiển thị điềm báo" -> "chỉ thị, biểu thị, cho xem".
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** Có `示 / 礻` thường liên quan lễ nghi, thần linh, cầu chúc, thờ cúng, phúc họa, điều thiêng/liêng.
  - **Phân biệt dễ nhầm (`distinguish`) — Cặp cực hay nhầm `示 (礻)` vs `衣 (衤)`:**
    - **`礻` là bộ `示` (Thị, 4 nét):** liên quan đến lễ nghi, thần linh, cầu phúc (`神, 福, 礼, 社, 祝, 祖, 祈, 祥`).
    - **`衤` là bộ `衣` (Y, 5 nét):** liên quan đến quần áo, vải mặc, che phủ (`初, 被, 裙, 补, 裤, 袜, 衬, 裕`). Tuyệt đối **không xếp nhầm các chữ `衤` sang `示`**!
    - **Cách soi nét phân biệt tức thì:** Hai bộ nhìn rất giống, phải soi số nét bên phải nét sổ dọc:
      - **`礻` (Thị):** chỉ có **1 nét chấm** (nét số 4) ở bên phải nét sổ (tổng **4 nét**).
      - **`衤` (Y):** có **2 nét** ở bên phải nét sổ (1 nét phẩy ngắn ở trên + 1 nét chấm dài ở dưới, tổng **5 nét** — giống cái "vạt áo").
    - **Mẹo nhớ:** **"Áo (`衤`) hai vạt (5 nét) — Thờ (`礻`) một nhang (4 nét)"**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Thần linh, tế tự, lễ nghi & cầu khấn (10 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                 |
| ------- | ------ | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 示      | shì    | thị      | Độc thể (`示`)                 | Tượng hình bàn thờ dâng lễ -> thần linh hiển thị điềm lành dữ -> bày ra, chỉ rõ, biểu thị. Từ ghép: `表示` (biểu thị), `指示` (chỉ thị), `显示` (hiển thị).                                                                    |
| 礼      | lǐ     | lễ       | `礻` (trái) + `乚` (phải)      | Giản thể dùng `乚` thay `豊` (phồn thể `禮`, bình ngọc cúng thần trên bàn thờ) -> lễ nghi tế thần -> lễ phép, lễ nghĩa, lễ vật, quà tặng. Từ ghép: `礼物` (quà tặng), `礼貌` (lễ phép), `婚礼` (hôn lễ).                       |
| 神      | shén   | thần     | `礻` (trái) + `申` (phải)      | Hình thanh kiêm hội ý: `礻` (thần linh) + `申` (tia chớp giáng từ trời, ghi âm `shén`) -> thần thánh, tinh thần, thần sắc, kỳ diệu. Từ ghép: `神仙` (thần tiên), `精神` (tinh thần), `神奇` (thần kỳ).                         |
| 社      | shè    | xã       | `礻` (trái) + `土` (phải)      | Hội ý: `礻` (thờ cúng) + `土` (đất) -> thần đất (Thổ Địa) và lễ tế thần đất thời cổ -> cộng đồng thờ chung một miếu Thổ Địa -> xã hội, đoàn thể, hãng. Từ ghép: `社会` (xã hội), `社区` (khu dân cư), `出版社` (nhà xuất bản). |
| 祖      | zǔ     | tổ       | `礻` (trái) + `且` (phải)      | Hình thanh kiêm hội ý: `礻` (bàn thờ cúng) + `且` (bài vị thờ cổ, ghi âm `zǔ`) -> tổ tiên, ông bà đời trước, người sáng lập. Từ ghép: `祖先` (tổ tiên), `祖国` (tổ quốc), `祖父` (ông nội).                                    |
| 祈      | qí     | kỳ       | `礻` (trái) + `斤` (phải)      | Hình thanh: `礻` (thần linh) + `斤` (cái rìu, ghi âm `qí`) -> cầu xin thần linh ban phước, cầu khấn, mong mỏi. Từ ghép: `祈祷` (cầu nguyện), `祈求` (khẩn cầu), `祈福` (cầu phúc).                                             |
| 祷      | dǎo    | đảo      | `礻` (trái) + `寿` (phải)      | Hình thanh: `礻` (thờ cúng) + `寿` (trường thọ, ghi âm `dǎo`) -> cầu khấn thần linh ban phúc lành, cầu nguyện. Từ ghép: `祷告` (cầu nguyện), `祈祷` (cầu khấn).                                                                |
| 祭      | jì     | tế       | `⺼ + 又` (trên) + `示` (dưới) | Hội ý: tay (`又`) cầm miếng thịt (`⺼`) đặt lên bàn thờ (`示`) -> tế lễ, cúng bái tổ tiên/thần linh. Từ ghép: `祭祀` (tế tự), `祭奠` (tế lễ tưởng niệm), `祭祖` (cúng tổ tiên).                                                |
| 祠      | cí     | từ       | `礻` (trái) + `司` (phải)      | Hình thanh: `礻` (thờ cúng) + `司` (ghi âm `cí`) -> lễ cúng mùa xuân; nhà thờ họ, đền miếu thờ danh nhân/tổ tiên. Từ ghép: `祠堂` (nhà thờ họ), `宗祠` (tông từ), `武侯祠` (đền Vũ Hầu).                                       |
| 祀      | sì     | tự       | `礻` (trái) + `巳` (phải)      | Hình thanh: `礻` (thờ cúng) + `巳` (ghi âm `sì`) -> tế tự, thờ cúng thần linh và tổ tiên; năm (thời nhà Thương tính 1 năm là 1 chu kỳ tế tự). Từ ghép: `祭祀` (thờ cúng tế lễ), `香火祀奉` (hương khói thờ phụng).             |

#### Nhóm B: Phúc họa, điềm lành & tôn giáo (7 chữ)

| Chữ Hán | Pinyin      | Hán Việt      | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                |
| ------- | ----------- | ------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 祝      | zhù         | chúc          | `礻` (trái) + `兄` (phải)       | Hội ý: người quỳ (`兄` miệng to trên thân người) cầu khấn trước bàn thờ (`礻`) -> khấn vái, chúc tụng, chúc mừng. Từ ghép: `庆祝` (ăn mừng), `祝贺` (chúc mừng), `祝福` (chúc phúc).                                                          |
| 福      | fú          | phúc          | `礻` (trái) + `畐` (phải)       | Hình thanh kiêm hội ý: `礻` (thần ban) + `畐` (vò rượu đầy đủ) -> thần ban cho no đủ yên vui -> hạnh phúc, may mắn, điều tốt lành. Từ ghép: `幸福` (hạnh phúc), `祝福` (chúc phúc), `福气` (phúc khí).                                        |
| 祸      | huò         | họa           | `礻` (trái) + `呙` (`咼`, phải) | Hình thanh: `礻` (thần linh giáng phạt/điềm xấu) + `呙` (ghi âm `huò`) -> tai họa, tai nạn, gây họa. Từ ghép: `车祸` (tai nạn xe cộ), `灾祸` (tai họa), `惹祸` (gây họa).                                                                     |
| 祥      | xiáng       | tường         | `礻` (trái) + `羊` (phải)       | Hình thanh kiêm hội ý: `礻` (điềm báo) + `羊` (con dê — vật tế tốt lành, ghi âm `xiáng`) -> điềm lành, may mắn, tốt đẹp, hiền hòa. Từ ghép: `吉祥` (cát tường, tốt lành), `祥和` (an lành, hòa nhã), `安祥` (an tường).                       |
| 禄      | lù          | lộc           | `礻` (trái) + `录` (phải)       | Hình thanh: `礻` (phúc lành) + `录` (ghi âm `lù`) -> phúc lộc, bổng lộc của quan lại thời xưa. Từ ghép: `福禄` (phúc lộc), `俸禄` (bổng lộc), `高官厚禄` (chức cao bổng hậu).                                                                 |
| 禅      | chán / shàn | thiền / thiện | `礻` (trái) + `单` (phải)       | Hình thanh: `礻` (tế trời đất) + `单` (ghi âm) -> `shàn`: lễ tế đất đắp đàn, nhường ngôi (`禅让`); `chán`: phiên âm tiếng Phạn _dhyāna_ (thiền định, Phật giáo). Từ ghép: `禅宗` (Thiền tông), `打坐参禅` (ngồi thiền), `禅让` (nhường ngôi). |
| 祟      | suì         | túy           | `出` (trên) + `示` (dưới)       | Hình thanh kiêm hội ý: `出` (xuất hiện, ghi âm `suì`) + `示` (thần quỷ) -> ma quỷ quấy phá -> tai vạ, hành vi lén lút ám muội. Từ ghép: `作祟` (quấy phá), `鬼鬼祟祟` (lén lút mờ ám).                                                        |

#### Nhóm C: Cấm đoán & nghĩa mở rộng (3 chữ)

| Chữ Hán | Pinyin    | Hán Việt   | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                        |
| ------- | --------- | ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 禁      | jìn / jīn | cấm / khâm | `林` (trên) + `示` (dưới) | Hình thanh kiêm hội ý: `林` (rừng rậm cấm địa, ghi âm `jìn`) + `示` (lệnh thiêng thần thánh/vua) -> `jìn`: cấm đoán, giam giữ; `jīn`: chịu đựng, kìm nén. Từ ghép: `禁止` (cấm), `禁不住` (không nhịn được), `紫禁城` (Tử Cấm Thành). |
| 票      | piào      | phiếu      | `覀` (trên) + `示` (dưới) | Chữ gốc vẽ lửa bay lên (`火` biến thể), khải biến phần dưới thành `示` (xếp bộ `示`) -> mảnh giấy/thẻ viết dấu lệnh -> vé, phiếu, tiền giấy. Từ ghép: `车票` (vé xe), `发票` (hóa đơn), `投票` (bỏ phiếu).                            |
| 禀      | bǐng      | bẩm        | `㐭` (trên) + `示` (dưới) | Hội ý: `㐭` (kho thóc lương bổng) + `示` (thần linh ban cho/trình lên) -> bẩm báo lên trên; thiên phú trời cho (bẩm sinh). Từ ghép: `禀报` (bẩm báo), `禀赋` (bẩm sinh, thiên tư), `禀性` (bản tính).                                 |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `宗` — `zōng · tông · 宀 (mái nhà) + 示 (bàn thờ) · bàn thờ tổ tiên đặt dưới mái nhà thờ -> tổ tông, tôn giáo, tông phái (宗教, 祖宗); xếp bộ 宀.`
- `察` — `chá · sát · 宀 (mái nhà) + 祭 (tế lễ, có 示) · xem xét kỹ lưỡng khi tế lễ -> quan sát, điều tra, cảnh sát (观察, 警察); xếp bộ 宀.`
- `视` — `shì · thị · 礻 (Thị) + 见 (Kiến - nhìn) · tuy mang 礻 bên trái, cả Khang Hy và Tân Hoa đều xếp ở bộ 見/见, nghĩa nhìn xem, coi trọng (电视, 重视).`
- `际` — `jì · tế · 阝 (Phụ trái) + 示 · xếp bộ 阜 (阝 trái), không xếp bộ 示.`
- `款` — `kuǎn · khoản · phần trái vốn chứa 示 biến thể + 欠 · xếp bộ 欠.`
- `衣 / 衤` — `yī · y · bộ riêng (#48), dạng 衤 (5 nét) cực dễ nhầm với 礻 (4 nét); các chữ 初, 被, 裙, 补, 裤, 衬, 裕 đều thuộc bộ 衣 (衤).`

---

## Bộ 40: 禾 (Hòa)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-026"` · `radical_index: 26` · `strokes: 5` nét · `name_vi: "bộ Hòa"` · **Có 1 dòng trùng/rỗng:** `radical-153` (`radical_index: 153`, `radical: "禾"`, toàn bộ trường dữ liệu hiện đang để rỗng/`null`).
- **Hình thái & Biến thể (`variants`):**
  - `禾` — dạng chính (5 nét: phẩy ngang trên đầu + `木`, khi đứng bên trái nét cuối của `木` viết thành nét chấm gọn: `和, 秋, 科, 种`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "cây lúa/cây ngũ cốc có bông rủ xuống." — Chữ tượng hình (Giáp cốt văn vẽ cây lúa thân thẳng, lá xòe, trên đỉnh có bông lúa nặng hạt rủ nghiêng sang một bên).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "lúa, ngũ cốc, mùa màng, thu hoạch, nông nghiệp; mở rộng sang tính toán/sản lượng trong vài chữ." Vì xã hội nông nghiệp cổ đại đo đếm sản lượng lương thực bằng đấu, thu thuế bằng thóc lúa (`税, 租`), cân đo (`秤, 称`), phân chia thóc giống thành hạng mục (`科, 程, 秩`), nên bộ `禾` gắn chặt với cả nông nghiệp lẫn toán học, khoa mục, trình tự và thời gian (`秒`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** Có `禾` thường liên quan lúa, cây trồng, mùa vụ, nông nghiệp, thu hoạch, sản lượng.
  - **Phân biệt dễ nhầm (`distinguish`) — Bộ `禾` vs `木` vs `米` vs `艹`:**
    - **`禾` (Hòa - 5 nét):** là **cây lúa / cây ngũ cốc** — có **1 nét phẩy ngang trên đầu** (tượng trưng bông lúa rủ xuống), ví dụ `秋, 种, 稻, 税, 程, 科, 秒`.
    - **`木` (Mộc - 4 nét):** là **cây cối / gỗ nói chung** — phần đầu bằng phẳng, **KHÔNG có nét phẩy** ở trên cùng, ví dụ `树, 林, 桌, 枝, 桃, 松`.
    - **`米` (Mễ - 6 nét):** là **hạt gạo đã tách vỏ** (hạt rời), ví dụ `大米, 粉, 粮, 精, 糖`.
    - **`艹` (Thảo - 3 nét):** là **cỏ / rau / thảo mộc nhỏ**, ví dụ `草, 花, 菜, 茶`.
    - Chú ý một số chữ thông dụng có `禾` ở vị trí phụ nhưng lại xếp ở bộ khác: `和` (bộ `口`), `利` (bộ `刀/刂`), `香` (bộ `香`), `季` (bộ `子`), `委` (bộ `女`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Cây lúa, mùa vụ & nông nghiệp (7 chữ)

| Chữ Hán | Pinyin        | Hán Việt      | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                       |
| ------- | ------------- | ------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 禾      | hé            | hòa           | Độc thể (`丿 + 木`)       | Tượng hình cây lúa bông rủ -> cây lúa non, cây ngũ cốc nói chung. Từ ghép: `禾苗` (mạ non/cây lúa non), `嘉禾` (lúa tốt).                                                                            |
| 稻      | dào           | đạo           | `禾` (trái) + `舀` (phải) | Hình thanh kiêm hội ý: `禾` (cây ngũ cốc) + `舀` (múc thóc trong cối giã, ghi âm `dào`) -> cây lúa (lúa nước, lúa nếp). Từ ghép: `水稻` (lúa nước), `稻田` (ruộng lúa), `稻谷` (thóc lúa).           |
| 稼      | jià           | giá           | `禾` (trái) + `家` (phải) | Hình thanh kiêm hội ý: `禾` (lúa) + `家` (nhà, ghi âm `jià`) -> gieo trồng ngũ cốc; trồng trọt, cây lương thực. Từ ghép: `庄稼` (hoa màu, mùa màng), `耕稼` (cày cấy).                               |
| 秋      | qiū           | thu           | `禾` (trái) + `火` (phải) | Hội ý: `禾` (lúa chín vàng) + `火` (nắng thu/đốt rơm rạ sau gặt) -> mùa thu (mùa gặt hái). Từ ghép: `秋天` (mùa thu), `中秋` (Trung thu), `春秋` (Xuân Thu / năm tháng).                             |
| 种      | zhǒng / zhòng | chủng / trúng | `禾` (trái) + `中` (phải) | Giản thể thay `重` bằng `中` (phồn thể `種`): `禾` (cây lúa) -> `zhǒng`: hạt giống, chủng loại; `zhòng`: trồng trọt, gieo cấy. Từ ghép: `种子` (hạt giống), `种类` (chủng loại), `种树` (trồng cây). |
| 秀      | xiù           | tú            | `禾` (trên) + `乃` (dưới) | Tượng hình kiêm hội ý: cây lúa (`禾`) trổ bông cong xuống (`乃`) -> lúa trổ đòng -> tốt đẹp, thanh tú, xuất sắc. Từ ghép: `优秀` (ưu tú), `秀丽` (tú lệ), `秀才` (tú tài).                           |
| 秆      | gǎn           | cán           | `禾` (trái) + `干` (phải) | Hình thanh: `禾` (cây lúa) + `干` (thân cây, ghi âm `gǎn`) -> thân cây rạ của lúa mì, lúa gạo, ngô (rơm rạ). Từ ghép: `麦秆` (cọng rơm lúa mì), `稻秆` (rơm rạ), `秸秆` (thân rạ).                   |

#### Nhóm B: Thuế khóa, cân đong, tích lũy & ổn định (7 chữ)

| Chữ Hán | Pinyin       | Hán Việt    | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                          |
| ------- | ------------ | ----------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 税      | shuì         | thuế        | `禾` (trái) + `兑` (phải) | Hình thanh kiêm hội ý: `禾` (thóc lúa thu hoạch) + `兑` (trao đổi/nộp ra, ghi âm `shuì`) -> nộp phần thóc lúa cho nhà nước -> tiền thuế, thuế khóa. Từ ghép: `税收` (thu thuế), `交税` (nộp thuế), `免税` (miễn thuế).  |
| 租      | zū           | tô          | `禾` (trái) + `且` (phải) | Hình thanh kiêm hội ý: `禾` (thóc ruộng) + `且` (ghi âm `zū`) -> thóc nộp cho chủ ruộng -> tiền thuê, thuê mướn, cho thuê. Từ ghép: `租房` (thuê nhà), `房租` (tiền thuê nhà), `出租车` (xe taxi).                      |
| 秤      | chèng        | xứng        | `禾` (trái) + `平` (phải) | Hình thanh kiêm hội ý: `禾` (sản vật nông nghiệp) + `平` (thăng bằng) -> dụng cụ cân thăng bằng -> cái cân (cân đòn, cân điện tử). Từ ghép: `杆秤` (cân đòn), `电子秤` (cân điện tử), `天秤座` (chòm Thiên Bình).       |
| 称      | chēng / chèn | xưng / xứng | `禾` (trái) + `尔` (phải) | Giản thể rút gọn `稱`: dùng tay nhấc cân kiểm tra trọng lượng thóc (`禾`) -> `chēng`: cân trọng lượng, gọi tên, khen ngợi; `chèn`: vừa vặn, tương xứng. Từ ghép: `称呼` (xưng hô), `名称` (tên gọi), `对称` (đối xứng). |
| 积      | jī           | tích        | `禾` (trái) + `只` (phải) | Giản thể dùng `只` thay `責` (phồn thể `積`): gom góp thóc lúa thành đống -> tích lũy, tích tụ; phép nhân, diện tích. Từ ghép: `积极` (tích cực), `积累` (tích lũy), `面积` (diện tích).                                |
| 稳      | wěn          | ổn          | `禾` (trái) + `急` (phải) | Giản thể dùng `急` (phồn thể `穩`): thu dọn gặt hái xong thóc lúa (`禾`) vào kho yên ổn -> vững vàng, ổn định, điềm tĩnh. Từ ghép: `稳定` (ổn định), `稳重` (điềm đạm vững vàng), `站稳` (đứng vững).                   |
| 私      | sī           | tư          | `禾` (trái) + `厶` (phải) | Hình thanh kiêm hội ý: `禾` (thóc lúa) + `厶` (vòng tay ôm giữ riêng cho mình, ghi âm `sī`) -> lúa riêng, của riêng -> riêng tư, cá nhân, bí mật. Từ ghép: `私人` (tư nhân), `自私` (ích kỷ), `隐私` (đời tư).          |

#### Nhóm C: Khoa mục, trình tự, thời gian & mức độ (7 chữ)

| Chữ Hán | Pinyin      | Hán Việt  | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                       |
| ------- | ----------- | --------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 科      | kē          | khoa      | `禾` (trái) + `斗` (phải) | Hội ý: `禾` (thóc lúa) + `斗` (cái đấu đong lường) -> dùng đấu đong phân loại thóc -> phân loại, môn học, khoa học, phòng ban. Từ ghép: `科学` (khoa học), `科目` (môn học), `外科` (khoa ngoại).                                    |
| 程      | chéng       | trình     | `禾` (trái) + `呈` (phải) | Hình thanh: `禾` (đơn vị đo lường hạt thóc/độ dài cổ) + `呈` (trình bày, ghi âm `chéng`) -> quy chuẩn đo đạc -> trình tự, quá trình, quãng đường, chương trình. Từ ghép: `过程` (quá trình), `课程` (khóa học), `工程` (công trình). |
| 秩      | zhì         | trật      | `禾` (trái) + `失` (phải) | Hình thanh: `禾` (lúa xếp hàng, lương bổng quan lại) + `失` (ghi âm) -> tích tụ đều đặn có thứ tự -> trật tự, thứ bậc, tuổi thọ (một "trật" là 10 năm). Từ ghép: `秩序` (trật tự), `秩序井然` (trật tự ngăn nắp).                    |
| 秒      | miǎo        | miểu      | `禾` (trái) + `少` (phải) | Hình thanh kiêm hội ý: `禾` (ngọn lúa) + `少` (nhỏ ít, ghi âm `miǎo`) -> cái râu cực nhỏ trên đầu hạt thóc -> cái gì cực nhỏ -> đơn vị giây (thời gian/góc). Từ ghép: `秒钟` (giây), `分秒必争` (tranh thủ từng giây từng phút).     |
| 移      | yí          | di        | `禾` (trái) + `多` (phải) | Hình thanh: `禾` (cây mạ lúa) + `多` (ghi âm `yí`) -> nhổ mạ cấy chuyển sang ruộng khác -> di chuyển, dời đi, thay đổi. Từ ghép: `移动` (di động), `移民` (di dân), `转移` (chuyển dời).                                             |
| 稀      | xī          | hy        | `禾` (trái) + `希` (phải) | Hình thanh kiêm hội ý: `禾` (cây lúa) + `希` (thưa thớt, ghi âm `xī`) -> lúa mọc thưa -> thưa thớt, hiếm hoi, loãng (cháo loãng). Từ ghép: `稀少` (hiếm có), `稀奇` (hiếm lạ), `稀饭` (cháo loãng).                                  |
| 稍      | shāo / shào | sảo / sáo | `禾` (trái) + `肖` (phải) | Hình thanh: `禾` (ngọn cây lúa nhỏ dần lên đầu) + `肖` (nhỏ, ghi âm `shāo`) -> hơi một chút, một lát (`shào`: chút nữa, đứng canh `稍息`). Từ ghép: `稍微` (hơi một chút), `稍等` (đợi một lát), `稍后` (lát nữa).                   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `米` — `mǐ · mễ · bộ riêng, tượng hình hạt gạo đã xát tách khỏi bông lúa (大米, 粮食).`
- `木` — `mù · mộc · bộ riêng (#26 trong DB), chỉ cây gỗ nói chung, phân biệt với 禾 có nét phẩy đầu là cây lúa.`
- `艹` — `cǎo · thảo · bộ riêng (#27 trong DB), chỉ cỏ cây, hoa rau, thảo mộc nói chung.`
- `和` — `hé / hè / huó · hòa · 禾 (lúa) + 口 (miệng) · có lương thực ăn no nên hòa thuận, ấm áp; tuy có 禾 bên trái nhưng xếp ở bộ 口 (和平, 和好).`
- `利` — `lì · lợi · 禾 (lúa) + 刂 (dao/liềm) · dùng dao sắc cắt lúa -> sắc bén, thuận lợi, lợi ích (利益, 流利); xếp ở bộ 刀 (刂).`
- `香` — `xiāng · hương · 禾 (lúa) + 日 (mặt trời/cam vị) · mùi lúa chín thơm ngát -> thơm (香水, 香味); là bộ 香 riêng (9 nét).`
- `季` — `jì · quý · 禾 (trên) + 子 (dưới) · vụ mùa, mùa, con út (季节, 四季); xếp ở bộ 子.`
- `委` — `wěi · ủy · 禾 (trên) + 女 (dưới) · người phụ nữ cúi mình như bông lúa nặng hạt -> ủy thác, uyển chuyển (委托, 委员会); xếp ở bộ 女.`

---

## Bộ 41: 疒 (Nạch)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-142"` · `radical_index: 142` · `strokes: 5` nét · `name_vi: "bộ Nạch / Tật bệnh đầu"` · Không có dòng trùng/rỗng.
  - _(Lưu ý DB: Bộ `疒` là bộ duy nhất trong nhóm 32–42 đã có sẵn 1 nhóm trong `groups`: `"Trạng thái cơ thể/tinh thần"` gồm 5 chữ `["疲", "瘦", "疯", "痴", "瘾"]`, được tích hợp đầy đủ ở Nhóm B bên dưới.)_
- **Hình thái & Biến thể (`variants`):**
  - `疒` — dạng chính (5 nét: chấm, ngang, phẩy dài, chấm trên, hất lên ở bên trái), thường bao phía trên-trái chữ (`病, 痛, 疲, 瘦, 疗`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "người nằm trên giường bệnh; ý bệnh tật/ốm đau." — Chữ tượng hình (Giáp cốt văn vẽ một chiếc giường dựng đứng bên trái và hình người đổ mồ hôi nằm dựa vào ở bên phải -> người ốm nằm liệt giường).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "bệnh, đau, triệu chứng, trạng thái cơ thể không khỏe, y học." Từ nghĩa ốm đau thể xác (`病, 痛, 疾, 癌`), bộ `疒` mở rộng sang thương tích ngoài da (`疮, 疤, 痕`), triệu chứng giác quan (`痒, 疲, 瘦`), rối loạn tâm thần/thần kinh (`疯, 痴, 癫`) và sự nghiện ngập lệ thuộc (`瘾`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** Có `疒` gần như rất mạnh: thường liên quan bệnh tật, đau, trạng thái cơ thể bất thường.
  - **Phân biệt dễ nhầm (`distinguish`) — Bộ `疒` (Nạch) vs `广` (Nghiễm) vs `厂` (Hán):**
    - **`疒` (Nạch - 5 nét):** là bộ **bệnh**, nhìn như cái giường có người bệnh nằm — **bên trái nét phẩy dài có thêm 2 nét nhỏ (1 chấm + 1 hất)** tạo thành dáng chữ `冫` dựa vào `广` (`病, 痛, 疲, 瘦, 疗`).
    - **`广` (Nghiễm - 3 nét):** có mái nhà (1 chấm + ngang + phẩy dài), **KHÔNG có 2 nét chấm-hất bên trái**, liên quan nhà cửa, nơi chốn (`店, 床, 府, 庭, 广, 应`).
    - **`厂` (Hán - 2 nét):** chỉ gồm ngang + phẩy dài (không có chấm đầu lẫn 2 nét bên trái), nghĩa vách đá/xưởng (`厂, 厅, 原, 厚`).
    - Các chữ `病, 痛, 疲, 瘦` là những chữ cốt lõi cực đáng học đầu tiên theo bộ này.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Bệnh tật, triệu chứng, đau nhức & chữa trị (10 chữ)

| Chữ Hán | Pinyin        | Hán Việt      | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                          |
| ------- | ------------- | ------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 疒      | nè / nǐ       | nạch          | Độc thể (`疒`)                      | Tượng hình người ốm nằm dựa trên giường -> bệnh tật (bộ thủ dùng ghép chữ, ít dùng độc lập).                                                                                                                            |
| 病      | bìng          | bệnh          | `疒` (bao trên-trái) + `丙` (trong) | Hình thanh: `疒` (bệnh) + `丙` (ghi âm `bìng`) -> bệnh tật, ốm đau, sai sót, khuyết điểm. Từ ghép: `生病` (bị ốm), `医院看病` (khám bệnh), `毛病` (tật xấu/trục trặc).                                                  |
| 症      | zhèng / zhēng | chứng / trưng | `疒` (bao trên-trái) + `正` (trong) | Hình thanh: `疒` (bệnh) + `正` (ghi âm `zhèng`) -> biểu hiện bệnh lý -> triệu chứng, chứng bệnh (`zhēng`: cục tích báng trong bụng). Từ ghép: `症状` (triệu chứng), `急症` (bệnh cấp tính), `癌症` (bệnh ung thư).      |
| 疾      | jí            | tật           | `疒` (bao trên-trái) + `矢` (trong) | Hội ý: `疒` (người nằm giường) + `矢` (mũi tên bắn trúng) -> bị thương trúng tên -> bệnh tật cấp tính; nhanh chóng (như tên bay), căm ghét. Từ ghép: `疾病` (bệnh tật), `疟疾` (bệnh sốt rét), `疾风` (gió mạnh nhanh). |
| 疗      | liáo          | liệu          | `疒` (bao trên-trái) + `了` (trong) | Giản thể dùng `了` thay `尞` (phồn thể `療`): điều trị cho người ốm -> chữa bệnh, trị liệu. Từ ghép: `治疗` (chữa trị), `医疗` (y tế), `疗效` (hiệu quả chữa bệnh).                                                     |
| 疼      | téng          | đông          | `疒` (bao trên-trái) + `冬` (trong) | Hình thanh: `疒` (bệnh) + `冬` (mùa đông lạnh cóng, ghi âm `téng`) -> đau nhức; mở rộng nghĩa thương yêu, cưng chiều. Từ ghép: `头疼` (đau đầu), `疼爱` (thương yêu), `心疼` (đau lòng/xót).                            |
| 痛      | tòng          | thống         | `疒` (bao trên-trái) + `甬` (trong) | Hình thanh: `疒` (bệnh) + `甬` (ghi âm `tòng`) -> đau đớn (thể xác và tinh thần), hết sức/thỏa thích (`痛快`). Từ ghép: `痛苦` (đau khổ), `胃痛` (đau dạ dày), `痛快` (sảng khoái/dứt khoát).                           |
| 痒      | yǎng          | dương         | `疒` (bao trên-trái) + `羊` (trong) | Hình thanh: `疒` (bệnh ngoài da) + `羊` (ghi âm `yǎng`) -> ngứa ngáy, nôn nao muốn làm gì. Từ ghép: `发痒` (bị ngứa), `手痒` (ngứa tay), `不痛不痒` (không đau không ngứa/vô thưởng vô phạt).                           |
| 疫      | yì            | dịch          | `疒` (bao trên-trái) + `殳` (trong) | Hình thanh: `疒` (bệnh) + `殳` (ghi âm `yì`) -> bệnh truyền nhiễm lây lan diện rộng -> dịch bệnh, miễn dịch. Từ ghép: `疫情` (tình hình dịch bệnh), `疫苗` (vắc xin), `防疫` (phòng dịch).                              |
| 癌      | ái            | nham          | `疒` (bao trên-trái) + `喦` (trong) | Hình thanh: `疒` (bệnh) + `喦` (hòn đá lởm chởm như khối u cứng, ghi âm `ái`) -> khối u ác tính, bệnh ung thư. Từ ghép: `癌症` (ung thư), `肺癌` (ung thư phổi), `抗癌` (chống ung thư).                                |

#### Nhóm B: Trạng thái cơ thể, tinh thần & thói quen (khớp DB: `疲, 瘦, 疯, 痴, 瘾`, 6 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                            |
| ------- | ------ | -------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 疲      | pí     | bì       | `疒` (bao trên-trái) + `皮` (trong) | Hình thanh: `疒` (trạng thái cơ thể suy yếu) + `皮` (ghi âm `pí`) -> mệt mỏi, kiệt sức. Từ ghép: `疲劳` (mệt mỏi), `疲惫` (kiệt quệ), `筋疲力尽` (kiệt sức rã rời).                                       |
| 瘦      | shòu   | sấu      | `疒` (bao trên-trái) + `叟` (trong) | Hình thanh: `疒` (bệnh làm hao mòn thân thể) + `叟` (ông già, ghi âm `shòu`) -> gầy gò, ốm yếu, ít mỡ (thịt nạc), đất cằn. Từ ghép: `瘦弱` (gầy yếu), `减肥变瘦` (giảm cân thành gầy), `瘦肉` (thịt nạc). |
| 疯      | fēng   | phong    | `疒` (bao trên-trái) + `风` (trong) | Giản thể dùng `风` thay `風` (bệnh trúng phong/điên loạn): điên rồ, mất kiểm soát, phát cuồng. Từ ghép: `疯狂` (điên cuồng), `疯子` (người điên), `发疯` (phát điên).                                     |
| 痴      | chī    | si       | `疒` (bao trên-trái) + `知` (trong) | Giản thể dùng `知` thay `疑` (phồn thể `癡`): bệnh mất trí khôn -> ngu si, đần độn, say mê cuồng dại (si mê). Từ ghép: `痴呆` (sa sút trí tuệ), `白痴` (đồ ngốc), `痴迷` (si mê).                         |
| 瘾      | yǐn    | ẩn       | `疒` (bao trên-trái) + `隐` (trong) | Hình thanh: `疒` (chứng bệnh/lệ thuộc) + `隐` (ghi âm `yǐn`) -> cơn thèm thuốc/cơn nghiện ngấm ngầm -> nghiện, ham mê khó bỏ. Từ ghép: `上瘾` (nghiện), `烟瘾` (cơn thèm thuốc lá), `网瘾` (nghiện mạng). |
| 癫      | diān   | điên     | `疒` (bao trên-trái) + `颠` (trong) | Hình thanh: `疒` (bệnh thần kinh) + `颠` (đỉnh đầu/lộn ngược, ghi âm `diān`) -> bệnh thần kinh co giật (động kinh), điên loạn. Từ ghép: `癫痫` (bệnh động kinh), `疯癫` (điên dại), `癫狂` (điên cuồng).  |

#### Nhóm C: Thương tích, vết sẹo & phát ban (5 chữ)

| Chữ Hán | Pinyin    | Hán Việt | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                        |
| ------- | --------- | -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 疮      | chuāng    | sang     | `疒` (bao trên-trái) + `仓` (trong) | Giản thể dùng `仓` thay `倉` (phồn thể `瘡`): vết thương bị lở loét, mụn nhọt, ghẻ lở. Từ ghép: `疮口` (miệng vết lở), `冻疮` (cước tay chân mùa đông), `千疮百孔` (rách nát trăm bề).                |
| 疤      | bā        | ba       | `疒` (bao trên-trái) + `巴` (trong) | Hình thanh: `疒` (vết thương) + `巴` (ghi âm `bā`) -> vết sẹo sau khi lành vết thương. Từ ghép: `伤疤` (vết sẹo), `疤痕` (sẹo lồi lõm), `结疤` (lên da non thành sẹo).                                |
| 痕      | hén       | ngân     | `疒` (bao trên-trái) + `艮` (trong) | Hình thanh: `疒` (vết thương để lại dấu) + `艮` (ghi âm `hén`) -> vết sẹo, dấu vết, vết hằn. Từ ghép: `痕迹` (dấu vết), `泪痕` (vệt nước mắt), `伤痕` (vết thương tích).                              |
| 疹      | zhěn      | chẩn     | `疒` (bao trên-trái) + `㐱` (trong) | Hình thanh: `疒` (bệnh) + `㐱` (dày đặc, ghi âm `zhěn`) -> nốt mẩn đỏ nổi dày trên da -> phát ban, bệnh sởi, chàm. Từ ghép: `麻疹` (bệnh sởi), `湿疹` (bệnh chàm), `皮疹` (phát ban da).              |
| 疟      | nüè / yào | ngược    | `疒` (bao trên-trái) + `虐` (trong) | Hình thanh: `疒` (bệnh) + `虐` (tàn bạo, ghi âm `nüè`) -> cơn sốt rét lúc nóng lúc lạnh hành hạ thân thể (`yào` trong khẩu ngữ `疟子`). Từ ghép: `疟疾` (bệnh sốt rét), `防疟` (phòng chống sốt rét). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `广` — `guǎng · nghiễm · bộ riêng (#15 trong DB), chỉ mái nhà/công trình (店, 床, 府, 庭); chỉ có 3 nét, không có 2 nét chấm-hất bên trái như 疒.`
- `医` — `yī · y · bộ 匚 (trong giản thể) + 矢 (mũi tên); liên quan y học, chữa bệnh (医生, 医院) nhưng không mang bộ 疒 (phồn thể 醫 dưới có 酉 rượu thuốc).`
- `肉 / ⺼` — `ròu · nhục · bộ riêng (#33), chỉ thịt và cơ thể khỏe mạnh bình thường, kết hợp với 疒 khi học cặp nghĩa đối lập hoặc bệnh lý nội tạng.`
- `伤` — `shāng · thương · 亻 (Nhân đứng) + 力/𠃓 · vết thương, bị thương (受伤, 伤口); xếp bộ 人 (亻).`
- `药` — `yào · dược · 艹 (Thảo) + 约 · cây cỏ làm thuốc -> thuốc chữa bệnh (吃药, 中药); xếp bộ 艸 (艹).`

---

## Bộ 42: 子 (Tử)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `id: "radical-056"` · `radical_index: 56` · `strokes: 3` nét · `name_vi: "bộ Tử"` · Không có dòng trùng/rỗng.
- **Hình thái & Biến thể (`variants`):**
  - `子` — dạng chính (3 nét: ngang gập, sổ cong móc, ngang), khi đứng bên trái nét ngang thứ ba viết hất nhẹ lên (`孩, 孙, 孤, 孔`).
  - `孑` — dạng/linh kiện gần `子` (thiếu nét tay bên trái, cũng được tách giới thiệu như thành phần riêng trong một số bảng bộ thủ, trong Khang Hy xếp chung dưới bộ `子`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ "hình đứa trẻ/con nhỏ." — Chữ tượng hình (Giáp cốt văn vẽ đứa trẻ đầu to, hai tay giơ ra và hai chân quấn tã).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ "con, trẻ em, con trai, hậu duệ; mở rộng thành hậu tố danh từ như `桌子, 椅子, 孩子`." Từ nghĩa em bé/con cái (`孩, 孙, 孕, 孪`), bộ `子` mở rộng sang con trưởng/con út (`孟, 季`), đạo làm con (`孝`), việc dạy dỗ trẻ em dưới mái nhà (`学, 字`), nuôi dưỡng bảo tồn (`存, 孵`) và hậu tố đọc thanh nhẹ `zi` tạo danh từ thông dụng trong tiếng Trung hiện đại.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện nhanh (`recognition`):** Có `子` thường liên quan trẻ em, con cái, học tập, sinh sản/hậu duệ, hoặc làm hậu tố danh từ.
  - **Phân biệt dễ nhầm (`distinguish`) — `子` vs `孑` / `了` / `孓`:**
    - **`子` (Tử - 3 nét):** có **đầy đủ nét ngang** vắt qua giữa thân (giống hai cánh tay dang ra), nghĩa con/trẻ (`孩子, 儿子, 桌子`).
    - **`了` (Liễu - 2 nét):** nhìn giống `子` **thiếu nét ngang** (chỉ có đầu và thân quấn tã), là chữ riêng (trợ từ động thái / "xong, hiểu rõ"), xếp ở bộ `亅` (Quyết).
    - **`孑` (Kiết - 3 nét):** mất một nét tay bên trái (nét ngang chỉ hất sang phải), nghĩa là cụt tay, cô độc/lẻ loi (`孑然一身` — trong bảng Khang Hy xếp dưới bộ `子`, nhiều học liệu tách làm thành phần riêng).
    - **`孓` (Quyết - 3 nét):** mất nét tay bên phải (nét hất chỉ hướng sang trái), rất hiếm, chỉ gặp trong từ `孑孓` (con lăng quăng/bọ gậy).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

#### Nhóm A: Con cái, sinh nở & quan hệ gia đình (10 chữ)

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                   |
| ------- | ------- | -------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 子      | zǐ / zi | tử       | Độc thể (`子`)                     | Tượng hình em bé giơ tay -> con cái, hạt giống, bậc hiền tài (`孔子`), chi Tý; đọc thanh nhẹ `zi` làm hậu tố danh từ. Từ ghép: `儿子` (con trai), `孩子` (trẻ em), `桌子` (cái bàn).                             |
| 孩      | hái     | hài      | `子` (trái) + `亥` (phải)          | Hình thanh kiêm hội ý: `子` (trẻ em) + `亥` (hài nhi, ghi âm `hái`) -> trẻ nhỏ, con cái. Từ ghép: `孩子` (trẻ con/con cái), `小孩` (em bé), `女孩` (bé gái).                                                     |
| 孙      | sūn     | tôn      | `子` (trái) + `小` (phải)          | Hội ý (phồn thể `孫` là `子 + 系`, dòng dõi nối tiếp): `子` (con) + `小` (nhỏ) -> con của con mình -> cháu, hậu duệ; họ Tôn. Từ ghép: `孙子` (cháu trai nội), `外孙` (cháu ngoại), `子孙` (con cháu).            |
| 孕      | yùn     | dựng     | `乃` (trên) + `子` (dưới)          | Hội ý: cổ văn vẽ đứa bé (`子`) nằm trong bụng người mẹ (`乃`) -> mang thai, thai nghén, ấp ủ hình thành. Từ ghép: `怀孕` (mang thai), `孕妇` (phụ nữ có thai), `孕育` (thai nghén, nuôi dưỡng).                  |
| 孪      | luán    | loan     | `亦` (trên) + `子` (dưới)          | Giản thể dùng `亦` thay `䜌` (phồn thể `孿`): hai đứa trẻ sinh cùng lúc -> sinh đôi, song sinh. Từ ghép: `孪生` (sinh đôi), `孪生兄弟` (anh em sinh đôi).                                                        |
| 孤      | gū      | cô       | `子` (trái) + `瓜` (phải)          | Hình thanh: `子` (trẻ em) + `瓜` (quả dưa, ghi âm `gū`) -> trẻ mất cha (mồ côi) -> cô đơn, lẻ loi, tách biệt; vua tự xưng ("Quả nhân/Cô"). Từ ghép: `孤儿` (trẻ mồ côi), `孤单` (cô đơn), `孤独` (cô độc).       |
| 孝      | xiào    | hiếu     | `耂` (trên) + `子` (dưới)          | Hội ý: `耂` (giản hóa từ `老` người già) + `子` (người con ở dưới nâng đỡ) -> con cái phụng dưỡng cha mẹ già -> hiếu thảo, có hiếu; đồ tang. Từ ghép: `孝顺` (hiếu thảo), `孝敬` (kính hiếu), `不孝` (bất hiếu). |
| 孟      | mèng    | mạnh     | `子` (trên) + `皿` (dưới)          | Hình thanh: `子` (con) + `皿` (cái bát, ghi âm `mèng`) -> anh cả, con trưởng (trong thứ tự `孟仲季`); tháng đầu mùa; họ Mạnh. Từ ghép: `孟子` (Mạnh Tử), `孟春` (tháng Giêng đầu xuân), `孟浪` (bồng bột).       |
| 季      | jì      | quý      | `禾` (trên) + `子` (dưới)          | Hội ý: `禾` (lúa non) + `子` (con út nhỏ bé) -> con út (`孟仲季`), cuối mùa -> một mùa, một quý (3 tháng). Từ ghép: `季节` (mùa), `四季` (bốn mùa), `旺季` (mùa cao điểm).                                       |
| 孵      | fū      | phu      | `卵` (trái) + `孚` (`爫+子`, phải) | Hội ý kiêm hình thanh: `卵` (trứng) + `孚` (chim mẹ lấy móng `爫` ấp ủ con `子`, ghi âm `fū`) -> ấp trứng nở con, ươm tạo. Từ ghép: `孵蛋` (ấp trứng), `孵化` (ấp nở / ươm mầm startup).                         |

#### Nhóm B: Học tập, chữ nghĩa & rèn luyện (4 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| ------- | ------ | -------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 学      | xué    | học      | `⺍ + 冖` (trên) + `子` (dưới) | Giản thể từ `學` (hai tay dạy phép tính cho đứa trẻ `子` dưới mái nhà `冖`) -> học tập, bắt chước, trường học, môn học. Từ ghép: `学习` (học tập), `学生` (học sinh), `大学` (đại học).             |
| 字      | zì     | tự       | `宀` (trên) + `子` (dưới)      | Hội ý: đứa trẻ (`子`) được sinh ra và nuôi lớn dưới mái nhà (`宀`) -> sinh nở -> chữ cái được "sinh ra" từ lục thư -> chữ viết, tên tự. Từ ghép: `汉字` (chữ Hán), `名字` (tên), `写字` (viết chữ). |
| 孜      | zī     | tư       | `子` (trái) + `攵` (phải)      | Hình thanh kiêm hội ý: `子` (đứa trẻ) + `攵` (tay cầm roi đốc thúc, ghi âm `zī`) -> chăm chỉ không ngừng nghỉ, cần mẫn. Từ ghép: `孜孜不倦` (cần mẫn không biết mệt).                               |
| 孺      | rú     | nhũ      | `子` (trái) + `需` (phải)      | Hình thanh: `子` (trẻ em) + `需` (ghi âm `rú`) -> trẻ nhỏ đang bú sữa, nhi đồng. Từ ghép: `妇孺` (phụ nữ và trẻ em), `孺子` (đứa trẻ nhỏ), `老少妇孺` (già trẻ gái trai).                           |

#### Nhóm C: Tồn tại, khe hở & nghĩa mở rộng (4 chữ)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                                                        |
| ------- | ------ | -------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 存      | cún    | tồn      | `𠂇` (trên) + `子` (dưới)      | Hội ý kiêm hình thanh: `才` biến hình (`𠂇`, nâng đỡ/ghi âm) + `子` (trẻ nhỏ) -> giữ gìn chăm sóc -> tồn tại, còn lại, lưu trữ, gửi tiết kiệm. Từ ghép: `存在` (tồn tại), `存款` (gửi tiền), `保存` (bảo quản).                                                                                       |
| 孔      | kǒng   | khổng    | `子` (trái) + `乚` (phải)      | Hội ý: cổ văn vẽ em bé (`子`) bú sữa mẹ (`乙/乚` bầu vú hay chim én) -> rất tốt, thông suốt -> cái lỗ, khe hở; họ Khổng. Từ ghép: `孔子` (Khổng Tử), `面孔` (khuôn mặt), `鼻孔` (lỗ mũi).                                                                                                             |
| 孰      | shú    | thục     | `享` (trên trái) + `丸` (phải) | Cổ văn là hai tay dâng thức ăn chín (`孰` nguyên nghĩa là chín, sau viết thêm `灬` thành `熟`), khải biến phần dưới trái giống `子` nên Khang Hy xếp bộ `子` -> dùng trong văn ngôn nghĩa là "ai, cái nào". Từ ghép: `孰轻孰重` (bên nào nhẹ bên nào nặng), `人非圣贤，孰能无过` (nhân vô thập toàn). |
| 孽      | niè    | nghiệt   | `薛` (trên) + `子` (dưới)      | Hình thanh: `薛` (ghi âm `niè`) + `子` (con) -> con vợ lẽ (nghĩa cổ) -> mầm tai họa, tội lỗi, nghiệp chướng. Từ ghép: `罪孽` (tội nghiệt), `妖孽` (yêu nghiệt), `作孽` (tạo nghiệp ác).                                                                                                               |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `女` — `nǚ · nữ · bộ riêng (#02 trong DB), phụ nữ/người mẹ, thường kết hợp với 子 để tạo chữ gia đình tình cảm.`
- `好` — `hǎo / hào · hảo · 女 (mẹ) + 子 (con) · mẹ ôm con -> tốt đẹp, yêu thích (很好, 爱好); xếp ở bộ 女.`
- `李` — `lǐ · lý · 木 (cây) + 子 (quả/hạt) · cây mận/quả mận, họ Lý (行李, 李子); xếp ở bộ 木.`
- `游` — `yóu · du · 氵 (nước) + 方 + 𠂉 + 子 · đứa trẻ cầm cờ vùng vẫy dưới nước -> bơi lội, du ngoạn (游泳, 旅游); xếp ở bộ 水 (氵).`
- `教` — `jiāo / jiào · giáo · 孝 (trên-trái) + 攵 (tay cầm roi) · thầy cầm roi uốn nắn trẻ học -> dạy học, giáo dục (教书, 教室); xếp ở bộ 攴 (攵).`
- `仔` — `zǐ / zǎi · tử / tể · 亻 (Nhân đứng) + 子 · gánh vác, tỉ mỉ (仔细), con thú nhỏ (牛仔裤); xếp ở bộ 人 (亻).`
- `了` — `le / liǎo · liễu · bộ 亅 (2 nét), hình dáng thiếu nét ngang so với 子 nhưng là chữ độc lập hoàn toàn khác nghĩa.`
