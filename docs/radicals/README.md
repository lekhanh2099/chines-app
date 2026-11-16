# Bộ Tài Liệu Chuẩn Hóa 69 Bộ Thủ Cốt Lõi (Khớp `hanzihome_radicals`)

Tài liệu này tổng hợp chi tiết **69 bộ thủ cốt lõi** (lọc trùng và chuẩn hóa từ 3 bảng tổng hợp 50 bộ thủ thông dụng) theo đúng bố cục giải nghĩa **Bộ thủ + Thiên bàng đứng chung**, đồng thời **ánh xạ trực tiếp vào cấu trúc bảng `hanzihome_radicals`** trong HanziHome (module **HÁN TỰ -> Bộ thủ**).

> **Trạng thái hiện tại:** Đây là bản tài liệu Markdown để xem duyệt trước. Chưa có thay đổi nào được ghi đè lên database Supabase (`hanzihome_radicals`).

---

## 1. Cấu trúc ánh xạ vào Schema `hanzihome_radicals`

Mỗi mục bộ thủ trong bộ tài liệu `01`–`06` được thiết kế để lắp thẳng vào các cột của bảng `public.hanzihome_radicals` (xem schema tại `supabase/migrations/20260820163000_hanzihome_remote_schema_baseline.sql` và form biên tập tại `src/features/hanzihome/editing/radical-edit-utils.ts`):

| Phần trong tài liệu Markdown                    | Cột đích trong `hanzihome_radicals`                    | Kiểu dữ liệu & Quy cách lưu                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **DB ID & Thứ tự / Số nét / Tên Việt**          | `id`, `radical_index`, `radical`, `name_vi`, `strokes` | Khóa chính dạng `radical-xxx`, `radical_index` duy nhất (khi `deleted_at IS NULL`).                                |
| **Hình thái & Biến thể**                        | `variants`                                             | `jsonb` mảng `{ "form": "...", "note": "..." }`.                                                                   |
| **Ý nghĩa cốt lõi** _(Lục thư + Hiện đại)_      | `core_meaning`                                         | `jsonb` object `{ "history": "...", "modern": "..." }`.                                                            |
| **Nhận diện nhanh**                             | `recognition`                                          | `text` mô tả dấu hiệu nhận biết trường nghĩa khi gặp bộ thủ.                                                       |
| **Phân biệt dễ nhầm**                           | `distinguish`                                          | `text[]` danh sách các điểm phân biệt với bộ/nét gần giống.                                                        |
| **Nhóm chữ thường gặp** _(theo nhóm nghĩa)_     | `groups`                                               | `jsonb` mảng `{ "name": "Tên nhóm nghĩa", "chars": ["字", ...] }` — lắp trực tiếp từ các nhóm A/B/C/D của từng bộ. |
| **Thành phần & Chữ liên quan (kèm giải nghĩa)** | `related_components`                                   | `jsonb` mảng `{ "form": "字 / bộ", "note": "pinyin · Hán Việt · phân tích thiên bàng & nghĩa" }`.                  |

---

## 2. Kết quả đối chiếu với dữ liệu hiện tại trong `hanzihome_radicals`

Snapshot đọc từ Supabase (`deleted_at IS NULL`) ghi nhận tổng cộng **244 dòng**:

- **Đã có dòng chính có dữ liệu (`name_vi IS NOT NULL`):** **64 / 69** bộ.
- **Chưa có trong DB (`MISSING`):** **5 / 69** bộ cần bổ sung dòng mới nếu muốn đưa đủ 69 bộ lên ứng dụng:
  1. **#38 — 巾 (Cân)** _(Nhóm B)_
  2. **#43 — 彳 (Xích)** _(Nhóm B)_
  3. **#47 — 冫 (Băng)** _(Nhóm B)_
  4. **#50 — 玉 / 王 (Ngọc)** _(Nhóm B)_
  5. **#69 — 小 (Tiểu)** _(Nhóm C)_
- **Dữ liệu trùng / rỗng phát hiện trong DB:**
  - Toàn bảng `hanzihome_radicals` hiện có **42 dòng rỗng** (`name_vi IS NULL`, `strokes IS NULL`, `core_meaning = {}`).
  - Riêng trong phạm vi **69 bộ mục tiêu**, có **26 bộ bị trùng dòng** (tổng **27 dòng trùng/rỗng** liên quan):
    - **24 bộ** có 1 dòng rỗng phụ đi kèm ở các index phía sau (ví dụ: `言` có `radical-007` và dòng rỗng `radical-181`; `足` có `radical-009` và dòng rỗng `radical-189`).
    - **2 bộ** có dòng trùng đã điền dữ liệu: `宀` (`radical-012` và `radical-048`), `門` (`radical-031` và `radical-052`, kèm thêm 1 dòng rỗng `radical-201`).
  - _(Lưu ý thêm: Toàn bảng DB còn 1 dòng ghi chú ghép là `radical-113`: `"卩/㔾 — đã học ở mục 109"` cũng đang để `name_vi = null`.)_

---

## 3. Danh sách 6 file tài liệu chi tiết

| File                                                                                       | Phạm vi bộ thủ  | Số lượng | Nội dung chính                                                                                           |
| ------------------------------------------------------------------------------------------ | --------------- | :------: | -------------------------------------------------------------------------------------------------------- |
| [01-nhom-a-con-nguoi-giac-quan-hanh-dong.md](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md) | Bộ **01 -> 13** |    13    | Con người, giác quan, tâm trí & hành động (`人, 女, 口, 言, 目, 网, 耳, 頁, 心, 手, 足, 攴, 力`)         |
| [02-nhom-a-khong-gian-cong-cu.md](./02-nhom-a-khong-gian-cong-cu.md)                       | Bộ **14 -> 22** |    9     | Không gian, nhà cửa, công cụ & tài chính (`宀, 广, 門, 糸, 竹, 金, 刀, 貝, 車`)                          |
| [03-nhom-a-thien-nhien.md](./03-nhom-a-thien-nhien.md)                                     | Bộ **23 -> 31** |    9     | Thiên nhiên, nguyên tố & thời tiết (`水, 火, 土, 木, 艸, 日, 石, 山, 雨`)                                |
| [04-nhom-b-mo-rong-phan-1.md](./04-nhom-b-mo-rong-phan-1.md)                               | Bộ **32 -> 42** |    11    | Nhóm mở rộng — phần 1 (`月, 肉, 阜, 邑, 辵, 欠, 巾, 示, 禾, 疒, 子`)                                     |
| [05-nhom-b-mo-rong-phan-2.md](./05-nhom-b-mo-rong-phan-2.md)                               | Bộ **43 -> 52** |    10    | Nhóm mở rộng — phần 2 (`彳, 又, 囗, 皿, 冫, 衣, 馬, 玉, 田, 食`)                                         |
| [06-nhom-c-bo-sung.md](./06-nhom-c-bo-sung.md)                                             | Bộ **53 -> 69** |    17    | Nhóm bổ sung chuyên biệt & cơ bản (`止, 見, 尸, 穴, 酉, 犬, 立, 戶, 牛, 方, 大, 文, 虫, 一, 二, 十, 小`) |

---

## 4. Bảng ánh xạ đầy đủ 69 bộ thủ

| STT | Nhóm | Bộ thủ | Hán-Việt | Trạng thái DB | DB ID chính   | `radical_index` | Số nét | Tên hiện tại trong DB  | Dòng trùng / rỗng cần lưu ý                            | Tài liệu chi tiết                                                       |
| :-: | :--: | :----: | -------- | ------------- | ------------- | :-------------: | :----: | ---------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| 01  |  A   |   人   | Nhân     | Đã có         | `radical-001` |        1        |   2    | bộ Nhân                | —                                                      | [Xem Bộ 01](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-01-人-nhân) |
| 02  |  A   |   女   | Nữ       | Đã có         | `radical-023` |       23        |   3    | bộ Nữ                  | —                                                      | [Xem Bộ 02](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-02-女-nữ)   |
| 03  |  A   |   口   | Khẩu     | Đã có         | `radical-006` |        6        |   3    | bộ Khẩu                | —                                                      | [Xem Bộ 03](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-03-口-khẩu) |
| 04  |  A   |   言   | Ngôn     | Đã có         | `radical-007` |        7        |   7    | bộ Ngôn                | `radical-181` (#181, rỗng)                             | [Xem Bộ 04](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-04-言-ngôn) |
| 05  |  A   |   目   | Mục      | Đã có         | `radical-010` |       10        |   5    | bộ Mục                 | `radical-147` (#147, rỗng)                             | [Xem Bộ 05](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-05-目-mục)  |
| 06  |  A   |   网   | Võng     | Đã có         | `radical-156` |       156       |   6    | bộ Võng                | —                                                      | [Xem Bộ 06](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-06-网-võng) |
| 07  |  A   |   耳   | Nhĩ      | Đã có         | `radical-011` |       11        |   6    | bộ Nhĩ                 | `radical-162` (#162, rỗng)                             | [Xem Bộ 07](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-07-耳-nhĩ)  |
| 08  |  A   |   頁   | Hiệt     | Đã có         | `radical-039` |       39        |   9    | bộ Hiệt                | `radical-213` (#213, rỗng)                             | [Xem Bộ 08](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-08-頁-hiệt) |
| 09  |  A   |   心   | Tâm      | Đã có         | `radical-002` |        2        |   4    | bộ Tâm                 | —                                                      | [Xem Bộ 09](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-09-心-tâm)  |
| 10  |  A   |   手   | Thủ      | Đã có         | `radical-005` |        5        |   4    | bộ Thủ                 | —                                                      | [Xem Bộ 10](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-10-手-thủ)  |
| 11  |  A   |   足   | Túc      | Đã có         | `radical-009` |        9        |   7    | bộ Túc                 | `radical-189` (#189, rỗng)                             | [Xem Bộ 11](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-11-足-túc)  |
| 12  |  A   |   攴   | Phộc     | Đã có         | `radical-042` |       42        |   4    | bộ Phộc                | `radical-124` (#124, rỗng)                             | [Xem Bộ 12](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-12-攴-phộc) |
| 13  |  A   |   力   | Lực      | Đã có         | `radical-035` |       35        |   2    | bộ Lực                 | —                                                      | [Xem Bộ 13](./01-nhom-a-con-nguoi-giac-quan-hanh-dong.md#bộ-13-力-lực)  |
| 14  |  A   |   宀   | Miên     | Đã có         | `radical-012` |       12        |   3    | bộ Miên                | `radical-048` (#48, trùng)                             | [Xem Bộ 14](./02-nhom-a-khong-gian-cong-cu.md#bộ-14-宀-miên)            |
| 15  |  A   |   广   | Nghiễm   | Đã có         | `radical-046` |       46        |   3    | bộ Nghiễm              | —                                                      | [Xem Bộ 15](./02-nhom-a-khong-gian-cong-cu.md#bộ-15-广-nghiễm)          |
| 16  |  A   |   門   | Môn      | Đã có         | `radical-031` |       31        |   8    | bộ Môn                 | `radical-052` (#52, trùng), `radical-201` (#201, rỗng) | [Xem Bộ 16](./02-nhom-a-khong-gian-cong-cu.md#bộ-16-門-môn)             |
| 17  |  A   |   糸   | Mịch     | Đã có         | `radical-016` |       16        |   6    | bộ Mịch                | —                                                      | [Xem Bộ 17](./02-nhom-a-khong-gian-cong-cu.md#bộ-17-糸-mịch)            |
| 18  |  A   |   竹   | Trúc     | Đã có         | `radical-135` |       135       |   6    | bộ Trúc                | —                                                      | [Xem Bộ 18](./02-nhom-a-khong-gian-cong-cu.md#bộ-18-竹-trúc)            |
| 19  |  A   |   金   | Kim      | Đã có         | `radical-015` |       15        |   8    | bộ Kim                 | `radical-199` (#199, rỗng)                             | [Xem Bộ 19](./02-nhom-a-khong-gian-cong-cu.md#bộ-19-金-kim)             |
| 20  |  A   |   刀   | Đao      | Đã có         | `radical-034` |       34        |   2    | bộ Đao                 | —                                                      | [Xem Bộ 20](./02-nhom-a-khong-gian-cong-cu.md#bộ-20-刀-đao)             |
| 21  |  A   |   貝   | Bối      | Đã có         | `radical-040` |       40        |   7    | bộ Bối                 | `radical-186` (#186, rỗng)                             | [Xem Bộ 21](./02-nhom-a-khong-gian-cong-cu.md#bộ-21-貝-bối)             |
| 22  |  A   |   車   | Xa       | Đã có         | `radical-030` |       30        |   7    | bộ Xa                  | `radical-191` (#191, rỗng)                             | [Xem Bộ 22](./02-nhom-a-khong-gian-cong-cu.md#bộ-22-車-xa)              |
| 23  |  A   |   水   | Thủy     | Đã có         | `radical-003` |        3        |   4    | bộ Thủy                | —                                                      | [Xem Bộ 23](./03-nhom-a-thien-nhien.md#bộ-23-水-thủy)                   |
| 24  |  A   |   火   | Hỏa      | Đã có         | `radical-004` |        4        |   4    | bộ Hỏa                 | —                                                      | [Xem Bộ 24](./03-nhom-a-thien-nhien.md#bộ-24-火-hỏa)                    |
| 25  |  A   |   土   | Thổ      | Đã có         | `radical-022` |       22        |   3    | bộ Thổ                 | —                                                      | [Xem Bộ 25](./03-nhom-a-thien-nhien.md#bộ-25-土-thổ)                    |
| 26  |  A   |   木   | Mộc      | Đã có         | `radical-014` |       14        |   4    | bộ Mộc                 | —                                                      | [Xem Bộ 26](./03-nhom-a-thien-nhien.md#bộ-26-木-mộc)                    |
| 27  |  A   |   艸   | Thảo     | Đã có         | `radical-013` |       13        |   6    | bộ Thảo                | —                                                      | [Xem Bộ 27](./03-nhom-a-thien-nhien.md#bộ-27-艸-thảo)                   |
| 28  |  A   |   日   | Nhật     | Đã có         | `radical-021` |       21        |   4    | bộ Nhật                | —                                                      | [Xem Bộ 28](./03-nhom-a-thien-nhien.md#bộ-28-日-nhật)                   |
| 29  |  A   |   石   | Thạch    | Đã có         | `radical-033` |       33        |   5    | bộ Thạch               | `radical-150` (#150, rỗng)                             | [Xem Bộ 29](./03-nhom-a-thien-nhien.md#bộ-29-石-thạch)                  |
| 30  |  A   |   山   | Sơn      | Đã có         | `radical-032` |       32        |   3    | bộ Sơn                 | —                                                      | [Xem Bộ 30](./03-nhom-a-thien-nhien.md#bộ-30-山-sơn)                    |
| 31  |  A   |   雨   | Vũ       | Đã có         | `radical-066` |       66        |   8    | bộ Vũ                  | `radical-205` (#205, rỗng)                             | [Xem Bộ 31](./03-nhom-a-thien-nhien.md#bộ-31-雨-vũ)                     |
| 32  |  B   |   月   | Nguyệt   | Đã có         | `radical-019` |       19        |   4    | bộ Nguyệt              | —                                                      | [Xem Bộ 32](./04-nhom-b-mo-rong-phan-1.md#bộ-32-月-nguyệt)              |
| 33  |  B   |   肉   | Nhục     | Đã có         | `radical-020` |       20        |   6    | bộ Nhục                | `radical-164` (#164, rỗng)                             | [Xem Bộ 33](./04-nhom-b-mo-rong-phan-1.md#bộ-33-肉-nhục)                |
| 34  |  B   |   阜   | Phụ      | Đã có         | `radical-044` |       44        |   8    | bộ Phụ                 | `radical-202` (#202, rỗng)                             | [Xem Bộ 34](./04-nhom-b-mo-rong-phan-1.md#bộ-34-阜-phụ)                 |
| 35  |  B   |   邑   | Ấp       | Đã có         | `radical-045` |       45        |   7    | bộ Ấp                  | `radical-195` (#195, rỗng)                             | [Xem Bộ 35](./04-nhom-b-mo-rong-phan-1.md#bộ-35-邑-ấp)                  |
| 36  |  B   |   辵   | Sước     | Đã có         | `radical-008` |        8        |   7    | bộ Sước / Xước         | `radical-194` (#194, rỗng)                             | [Xem Bộ 36](./04-nhom-b-mo-rong-phan-1.md#bộ-36-辵-sước)                |
| 37  |  B   |   欠   | Khiếm    | Đã có         | `radical-088` |       88        |   4    | bộ Khiếm               | —                                                      | [Xem Bộ 37](./04-nhom-b-mo-rong-phan-1.md#bộ-37-欠-khiếm)               |
| 38  |  B   |   巾   | Cân      | **CHƯA CÓ**   | —             |        —        |   3    | —                      | Cần bổ sung dòng mới                                   | [Xem Bộ 38](./04-nhom-b-mo-rong-phan-1.md#bộ-38-巾-cân)                 |
| 39  |  B   |   示   | Thị      | Đã có         | `radical-018` |       18        |   5    | bộ Thị                 | `radical-151` (#151, rỗng)                             | [Xem Bộ 39](./04-nhom-b-mo-rong-phan-1.md#bộ-39-示-thị)                 |
| 40  |  B   |   禾   | Hòa      | Đã có         | `radical-026` |       26        |   5    | bộ Hòa                 | `radical-153` (#153, rỗng)                             | [Xem Bộ 40](./04-nhom-b-mo-rong-phan-1.md#bộ-40-禾-hòa)                 |
| 41  |  B   |   疒   | Nạch     | Đã có         | `radical-142` |       142       |   5    | bộ Nạch / Tật bệnh đầu | —                                                      | [Xem Bộ 41](./04-nhom-b-mo-rong-phan-1.md#bộ-41-疒-nạch)                |
| 42  |  B   |   子   | Tử       | Đã có         | `radical-056` |       56        |   3    | bộ Tử                  | —                                                      | [Xem Bộ 42](./04-nhom-b-mo-rong-phan-1.md#bộ-42-子-tử)                  |
| 43  |  B   |   彳   | Xích     | **CHƯA CÓ**   | —             |        —        |   3    | —                      | Cần bổ sung dòng mới                                   | [Xem Bộ 43](./05-nhom-b-mo-rong-phan-2.md#bộ-43-彳-xích)                |
| 44  |  B   |   又   | Hựu      | Đã có         | `radical-036` |       36        |   2    | bộ Hựu                 | —                                                      | [Xem Bộ 44](./05-nhom-b-mo-rong-phan-2.md#bộ-44-又-hựu)                 |
| 45  |  B   |   囗   | Vi       | Đã có         | `radical-053` |       53        |   3    | bộ Vi                  | —                                                      | [Xem Bộ 45](./05-nhom-b-mo-rong-phan-2.md#bộ-45-囗-vi)                  |
| 46  |  B   |   皿   | Mãnh     | Đã có         | `radical-041` |       41        |   5    | bộ Mãnh, Mãnh bát      | `radical-146` (#146, rỗng)                             | [Xem Bộ 46](./05-nhom-b-mo-rong-phan-2.md#bộ-46-皿-mãnh)                |
| 47  |  B   |   冫   | Băng     | **CHƯA CÓ**   | —             |        —        |   2    | —                      | Cần bổ sung dòng mới                                   | [Xem Bộ 47](./05-nhom-b-mo-rong-phan-2.md#bộ-47-冫-băng)                |
| 48  |  B   |   衣   | Y        | Đã có         | `radical-017` |       17        |   6    | bộ Y                   | `radical-177` (#177, rỗng)                             | [Xem Bộ 48](./05-nhom-b-mo-rong-phan-2.md#bộ-48-衣-y)                   |
| 49  |  B   |   馬   | Mã       | Đã có         | `radical-029` |       29        |   10   | bộ Mã                  | —                                                      | [Xem Bộ 49](./05-nhom-b-mo-rong-phan-2.md#bộ-49-馬-mã)                  |
| 50  |  B   |   玉   | Ngọc     | **CHƯA CÓ**   | —             |        —        |   5    | —                      | Cần bổ sung dòng mới                                   | [Xem Bộ 50](./05-nhom-b-mo-rong-phan-2.md#bộ-50-玉-ngọc)                |
| 51  |  B   |   田   | Điền     | Đã có         | `radical-140` |       140       |   5    | bộ Điền                | —                                                      | [Xem Bộ 51](./05-nhom-b-mo-rong-phan-2.md#bộ-51-田-điền)                |
| 52  |  B   |   食   | Thực     | Đã có         | `radical-024` |       24        |   9    | bộ Thực                | `radical-216` (#216, rỗng)                             | [Xem Bộ 52](./05-nhom-b-mo-rong-phan-2.md#bộ-52-食-thực)                |
| 53  |  C   |   止   | Chỉ      | Đã có         | `radical-126` |       126       |   4    | bộ Chỉ                 | —                                                      | [Xem Bộ 53](./06-nhom-c-bo-sung.md#bộ-53-止-chỉ)                        |
| 54  |  C   |   見   | Kiến     | Đã có         | `radical-038` |       38        |   7    | bộ Kiến                | `radical-179` (#179, rỗng)                             | [Xem Bộ 54](./06-nhom-c-bo-sung.md#bộ-54-見-kiến)                       |
| 55  |  C   |   尸   | Thi      | Đã có         | `radical-054` |       54        |   3    | bộ Thi                 | —                                                      | [Xem Bộ 55](./06-nhom-c-bo-sung.md#bộ-55-尸-thi)                        |
| 56  |  C   |   穴   | Huyệt    | Đã có         | `radical-050` |       50        |   5    | bộ Huyệt               | `radical-154` (#154, rỗng)                             | [Xem Bộ 56](./06-nhom-c-bo-sung.md#bộ-56-穴-huyệt)                      |
| 57  |  C   |   酉   | Dậu      | Đã có         | `radical-196` |       196       |   7    | bộ Dậu                 | —                                                      | [Xem Bộ 57](./06-nhom-c-bo-sung.md#bộ-57-酉-dậu)                        |
| 58  |  C   |   犬   | Khuyển   | Đã có         | `radical-027` |       27        |   4    | bộ Khuyển              | —                                                      | [Xem Bộ 58](./06-nhom-c-bo-sung.md#bộ-58-犬-khuyển)                     |
| 59  |  C   |   立   | Lập      | Đã có         | `radical-061` |       61        |   5    | bộ Lập                 | `radical-155` (#155, rỗng)                             | [Xem Bộ 59](./06-nhom-c-bo-sung.md#bộ-59-立-lập)                        |
| 60  |  C   |   戶   | Hộ       | Đã có         | `radical-051` |       51        |   4    | bộ Hộ                  | `radical-123` (#123, rỗng)                             | [Xem Bộ 60](./06-nhom-c-bo-sung.md#bộ-60-戶-hộ)                         |
| 61  |  C   |   牛   | Ngưu     | Đã có         | `radical-028` |       28        |   4    | bộ Ngưu                | —                                                      | [Xem Bộ 61](./06-nhom-c-bo-sung.md#bộ-61-牛-ngưu)                       |
| 62  |  C   |   方   | Phương   | Đã có         | `radical-079` |       79        |   4    | bộ Phương              | —                                                      | [Xem Bộ 62](./06-nhom-c-bo-sung.md#bộ-62-方-phương)                     |
| 63  |  C   |   大   | Đại      | Đã có         | `radical-055` |       55        |   3    | bộ Đại                 | —                                                      | [Xem Bộ 63](./06-nhom-c-bo-sung.md#bộ-63-大-đại)                        |
| 64  |  C   |   文   | Văn      | Đã có         | `radical-078` |       78        |   4    | bộ Văn                 | —                                                      | [Xem Bộ 64](./06-nhom-c-bo-sung.md#bộ-64-文-văn)                        |
| 65  |  C   |   虫   | Trùng    | Đã có         | `radical-174` |       174       |   6    | bộ Trùng               | —                                                      | [Xem Bộ 65](./06-nhom-c-bo-sung.md#bộ-65-虫-trùng)                      |
| 66  |  C   |   一   | Nhất     | Đã có         | `radical-089` |       89        |   1    | bộ Nhất                | —                                                      | [Xem Bộ 66](./06-nhom-c-bo-sung.md#bộ-66-一-nhất)                       |
| 67  |  C   |   二   | Nhị      | Đã có         | `radical-095` |       95        |   2    | bộ Nhị                 | —                                                      | [Xem Bộ 67](./06-nhom-c-bo-sung.md#bộ-67-二-nhị)                        |
| 68  |  C   |   十   | Thập     | Đã có         | `radical-098` |       98        |   2    | bộ Thập                | —                                                      | [Xem Bộ 68](./06-nhom-c-bo-sung.md#bộ-68-十-thập)                       |
| 69  |  C   |   小   | Tiểu     | **CHƯA CÓ**   | —             |        —        |   3    | —                      | Cần bổ sung dòng mới                                   | [Xem Bộ 69](./06-nhom-c-bo-sung.md#bộ-69-小-tiểu)                       |
