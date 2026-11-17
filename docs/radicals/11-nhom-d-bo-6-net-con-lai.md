# Nhóm D — Các Bộ Thủ 6 Nét Khang Hy Còn Lại (Bộ 141 – Bộ 161)

Tài liệu biên soạn chi tiết **21 bộ thủ 6 nét Khang Hy còn lại** (từ **Bộ 141 `米`** đến **Bộ 161 `襾`**), đối chiếu trực tiếp với dữ liệu hiện có trong bảng `public.hanzihome_radicals` và chuẩn hóa đầy đủ hệ thống **Chữ Hán thông dụng + Thiên bàng đứng chung** theo từng nhóm nghĩa.

> **Lưu ý phạm vi & tình trạng DB:**
>
> - Trong **29 bộ thủ 6 nét** của bảng 214 bộ Khang Hy (`#118` → `#146`), có **8 bộ** đã được biên soạn ở các tài liệu Nhóm A–C trước đó (`竹 #118`, `糸 #120`, `网 #122`, `耳 #128`, `肉 #130`, `艸 #140`, `虫 #142`, `衣 #145`). Tài liệu này xử lý trọn vẹn **21 bộ 6 nét Khang Hy còn lại**.
> - **Đã có trong DB:** **20 / 21 bộ**. Trong đó có **3 dòng trùng rỗng** cần lưu ý dọn/gộp khi chuẩn hóa DB: `radical-159` (`老`), `radical-166` (`自`), `radical-169` (`舌`). Riêng `148. 聿` (`radical-163`) hiện có sẵn 1 nhóm `groups` trong DB (`["建", "肇", "健"]` — cần hiệu chỉnh vì chỉ `肇` thuộc bộ `聿`).
> - **Chưa có trong DB (`MISSING`):** **1 / 21 bộ** — **Bộ 142 `缶` (Phẫu, Khang Hy #121)** (`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`).

| STT | Bộ thủ | Hán-Việt | Khang Hy | Trạng thái DB                | DB ID chính     | `radical_index` | Số nét | Dòng trùng / rỗng DB       | Liên kết nhanh                         |
| :-: | :----: | -------- | :------: | ---------------------------- | --------------- | :-------------: | :----: | -------------------------- | -------------------------------------- |
| 141 |   米   | Mễ       |   #119   | Đã có                        | `radical-025`   |       25        |   6    | —                          | [Bộ 141: 米 (Mễ)](#bộ-141-米-mễ)       |
| 142 |   缶   | Phẫu     |   #121   | **CHƯA CÓ TRONG DB**         | Đề xuất bổ sung | Đề xuất bổ sung |   6    | Cần bổ sung dòng mới       | [Bộ 142: 缶 (Phẫu)](#bộ-142-缶-phẫu)   |
| 143 |   羊   | Dương    |   #123   | Đã có                        | `radical-157`   |       157       |   6    | —                          | [Bộ 143: 羊 (Dương)](#bộ-143-羊-dương) |
| 144 |   羽   | Vũ       |   #124   | Đã có                        | `radical-158`   |       158       |   6    | —                          | [Bộ 144: 羽 (Vũ)](#bộ-144-羽-vũ)       |
| 145 |   老   | Lão      |   #125   | Đã có                        | `radical-057`   |       57        |   6    | `radical-159` (#159, rỗng) | [Bộ 145: 老 (Lão)](#bộ-145-老-lão)     |
| 146 |   而   | Nhi      |   #126   | Đã có                        | `radical-160`   |       160       |   6    | —                          | [Bộ 146: 而 (Nhi)](#bộ-146-而-nhi)     |
| 147 |   耒   | Lỗi      |   #127   | Đã có                        | `radical-161`   |       161       |   6    | —                          | [Bộ 147: 耒 (Lỗi)](#bộ-147-耒-lỗi)     |
| 148 |   聿   | Duật     |   #129   | Đã có (có sẵn 1 nhóm groups) | `radical-163`   |       163       |   6    | —                          | [Bộ 148: 聿 (Duật)](#bộ-148-聿-duật)   |
| 149 |   臣   | Thần     |   #131   | Đã có                        | `radical-165`   |       165       |   6    | —                          | [Bộ 149: 臣 (Thần)](#bộ-149-臣-thần)   |
| 150 |   自   | Tự       |   #132   | Đã có                        | `radical-085`   |       85        |   6    | `radical-166` (#166, rỗng) | [Bộ 150: 自 (Tự)](#bộ-150-自-tự)       |
| 151 |   至   | Chí      |   #133   | Đã có                        | `radical-167`   |       167       |   6    | —                          | [Bộ 151: 至 (Chí)](#bộ-151-至-chí)     |
| 152 |   臼   | Cữu      |   #134   | Đã có                        | `radical-168`   |       168       |   6    | —                          | [Bộ 152: 臼 (Cữu)](#bộ-152-臼-cữu)     |
| 153 |   舌   | Thiệt    |   #135   | Đã có                        | `radical-081`   |       81        |   6    | `radical-169` (#169, rỗng) | [Bộ 153: 舌 (Thiệt)](#bộ-153-舌-thiệt) |
| 154 |   舛   | Suyễn    |   #136   | Đã có                        | `radical-170`   |       170       |   6    | —                          | [Bộ 154: 舛 (Suyễn)](#bộ-154-舛-suyễn) |
| 155 |   舟   | Chu      |   #137   | Đã có                        | `radical-171`   |       171       |   6    | —                          | [Bộ 155: 舟 (Chu)](#bộ-155-舟-chu)     |
| 156 |   艮   | Cấn      |   #138   | Đã có                        | `radical-172`   |       172       |   6    | —                          | [Bộ 156: 艮 (Cấn)](#bộ-156-艮-cấn)     |
| 157 |   色   | Sắc      |   #139   | Đã có                        | `radical-076`   |       76        |   6    | —                          | [Bộ 157: 色 (Sắc)](#bộ-157-色-sắc)     |
| 158 |   虍   | Hô       |   #141   | Đã có                        | `radical-173`   |       173       |   6    | —                          | [Bộ 158: 虍 (Hô)](#bộ-158-虍-hô)       |
| 159 |   血   | Huyết    |   #143   | Đã có                        | `radical-175`   |       175       |   6    | —                          | [Bộ 159: 血 (Huyết)](#bộ-159-血-huyết) |
| 160 |   行   | Hành     |   #144   | Đã có                        | `radical-176`   |       176       |   6    | —                          | [Bộ 160: 行 (Hành)](#bộ-160-行-hành)   |
| 161 |   襾   | Á        |   #146   | Đã có (`襾 / 覀 / 西`)       | `radical-178`   |       178       |   6    | —                          | [Bộ 161: 襾 (Á)](#bộ-161-襾-á)         |

---

## Bộ 141: 米 (Mễ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-025` · `radical_index`: `25` · `strokes`: `6` nét · `name_vi`: `bộ Mễ` · Khang Hy: `#119` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `米` — dạng chính duy nhất (6 nét: `丶 ノ 一 丨 ノ 丶`); đứng độc lập (`米`), đứng **bên trái** (`粉, 粒, 粗, 精, 糖, 粮, 料` — khi đứng trái, nét mác cuối thu gọn thành nét chấm dài `丶` để nhường chỗ cho phần bên phải), đứng **phía trên** (`粟, 粪, 粥` giữa hai `弓`) hoặc đứng **bên dưới** (`菊, 迷` chứa làm linh kiện).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình những hạt gạo/hạt thóc tách rời rải trên mặt đất hoặc bông lúa chín đã tuốt lấy hạt.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Hạt gạo, ngũ cốc đã thu hoạch, bột mịn, lương thực, đồ ăn chế biến từ gạo bột (`米, 粒, 粮, 粉, 糕, 粽, 粥`) → quá trình tinh lọc, đo đếm và trạng thái thô/mịn (`精, 粹, 粗, 糙, 糠, 糟`) → mở rộng sang các vật nhỏ li ti dạng hạt, tinh thể (`糖, 粒子`) và đơn vị đo mét (`米`, phiên âm).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `米` thường liên quan đến gạo, hạt, bột, bánh kẹo, ngũ cốc sau thu hoạch, độ tinh khiết hay thô ráp của vật chất.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`米` (Mễ — 6 nét) vs `木` (Mộc — 4 nét) vs `禾` (Hòa — 5 nét):** Đây là bộ ba dễ nhầm nhất khi học nét gốc cây–lúa–gạo!
      - **`木` (4 nét: `一 丨 ノ 丶`)**: cây gỗ nói chung (thân, cành, rễ).
      - **`禾` (5 nét: `ノ 一 丨 ノ 丶`)**: thêm **1 nét phẩy nằm trên đỉnh `木`** mô tả bông lúa trĩu ngọn — chỉ **cây lúa / cây ngũ cốc đang mọc ngoài đồng** (`秋, 种, 稻, 租, 税`).
      - **`米` (6 nét: `丶 ノ 一 丨 ノ 丶`)**: thêm **hai nét chấm/phẩy trên vai chữ `木`** — chỉ **hạt gạo, ngũ cốc đã tuốt vỏ sau thu hoạch** (`粒, 粉, 粮, 粗`).
    - **`米` vs `来` (Lai — 7 nét) & `采` (Thái — 8 nét):** `来` thêm nét ngang dài phủ trên cùng (gốc là cây lúa mì, nay nghĩa "đến"); `采` có bộ trảo `爫` ở trên `木` (nghĩa "hái lượm, chọn lấy", không phải `米`).
    - **`米` vs `食 / 饣` (Thực):** `米` là nguyên liệu hạt gạo/bột; `食/饣` là ăn uống, bữa ăn, thực phẩm đã nấu chín nói chung.
    - **Lưu ý nghĩa hiện đại của `粉` (`fěn`):** Ngoài nghĩa gốc "bột gạo, phấn", `粉丝` (`fěnsī`) vốn là "miến/bún tàu", trong tiếng Trung hiện đại dùng để phiên âm tiếng Anh _fans_ ("người hâm mộ") — nghĩa "fan" đến từ vay mượn âm/chơi chữ hiện đại, không xuất phát từ nghĩa bộ `米`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Hạt gạo, lương thực & món ăn từ ngũ cốc

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                 |
| :-----: | :-------: | :------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
|   米    |    mǐ     |    Mễ    | Đứng độc lập          | Tượng hình những hạt gạo rời; gạo, hạt đã bỏ vỏ, đơn vị đo mét (大米, 玉米, 一米).                                                             |
|   粒    |    lì     |   Lạp    | `米` + `立`           | Hình thanh: `米` (hạt gạo) + `立` (`lì`, thanh phù); hạt gạo nhỏ → hạt, viên nhỏ, lượng từ cho vật nhỏ dạng hạt (米粒, 颗粒, 粒子).            |
|   粮    |   liáng   |  Lương   | `米` + `良`           | Hình thanh: `米` (gạo) + `良` (`liáng`, Phồn thể: `糧` dùng `量`, thanh phù); gạo thóc dự trữ → lương thực (粮食, 粮草, 干粮).                 |
|   粥    | zhōu / yù |   Chúc   | `弓` + `米` + `弓`    | Hội ý cổ: gạo (`米`) nấu sôi giữa hai luồng hơi nóng (lệ biến thành hai chữ `弓`) → cháo (`zhōu`: 喝粥, 小米粥, 八宝粥); `yù` trong từ cổ.     |
|   糕    |    gāo    |   Cao    | `米` + `羔`           | Hình thanh: `米` (bột gạo) + `羔` (`gāo`, thanh phù); bánh hấp làm từ bột gạo → bánh ngọt, bánh gạo (蛋糕, 年糕, 糕点).                        |
|   粽    |   zòng    |   Tống   | `米` + `宗`           | Hình thanh: `米` (gạo nếp) + `宗` (`zōng`, thanh phù); món gạo nếp gói lá luộc chín (tương đương bánh ú/bánh chưng Tết Đoan Ngọ) (粽子, 肉粽). |

### Nhóm B: Chế biến bột, đường, tinh lọc & kết dính

| Chữ Hán |   Pinyin    | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                  |
| :-----: | :---------: | :------: | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   粉    |     fěn     |   Phấn   | `米` + `分`           | Hội ý kiêm thanh: gạo (`米`) tán nhỏ chia rời (`分`, thanh phù) → bột, phấn trang điểm, miến/phở, fan hâm mộ (面粉, 粉末, 粉丝).                                |
|   糖    |    táng     |  Đường   | `米` + `唐`           | Hình thanh: `米` (hạt tinh thể/nấu từ mạch nha ngũ cốc) + `唐` (`táng`, thanh phù); đường, kẹo (白糖, 糖果, 糖尿病).                                            |
|   料    |    liào     |   Liệu   | `米` + `斗`           | Hội ý: dùng cái đấu (`斗`) đong hạt gạo (`米`) → đo đạc, liệu tính, vật liệu, nguyên liệu, gia vị (材料, 饮料, 意料).                                           |
|   精    |    jīng     |   Tinh   | `米` + `青`           | Hình thanh: `米` (gạo đã giã trắng) + `青` (`qīng`, thanh phù kiêm ý trong sạch); gạo tuyển chọn tinh khiết → tinh túy, tinh xảo, tinh thần (精神, 精彩, 精确). |
|   粹    |     cuì     |   Túy    | `米` + `卒`           | Hình thanh: `米` (gạo sạch) + `卒` (`zú`, thanh phù); gạo tinh chọn không tạp chất → tinh túy, thuần khiết (纯粹, 精粹, 国粹).                                  |
|   粘    | zhān / nián |   Niêm   | `米` + `占`           | Hình thanh: `米` (gạo nếp) + `占` (`zhān`, thanh phù); có chất dẻo như cơm nếp → dán, dính (`zhān`: 粘贴); dẻo dính (`nián`, nay hay viết 黏: 粘稠).            |

### Nhóm C: Độ thô ráp, cám trấu, bã hèm & hạt giống

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                  |
| :-----: | :----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
|   粗    |   cū   |   Thô    | `米` + `且`           | Hình thanh: `米` (gạo còn lẫn cám chưa giã mịn) + `且` (`qiě`, thanh phù); thô ráp, to lớn, cẩu thả, thô lỗ (粗心, 粗细, 粗糙). |
|   糙    |  cāo   |   Tháo   | `米` + `造`           | Hình thanh: `米` (gạo lứt chưa xát kỹ) + `造` (`zào`, thanh phù); gạo lứt, bề mặt nhám thô sơ (糙米, 粗糙).                     |
|   糠    |  kāng  |  Khang   | `米` + `康`           | Hình thanh: `米` (gạo) + `康` (`kāng`, thanh phù); vỏ trấu và cám xát từ hạt gạo → cám, xốp rỗng không chắc (米糠, 糟糠).       |
|   糟    |  zāo   |   Tao    | `米` + `曹`           | Hình thanh: `米` (gạo nếp ủ rượu) + `曹` (`cáo`, thanh phù); bã hèm rượu → mục nát, hỏng bét, tồi tệ (糟糕, 酒糟, 乱七八糟).    |
|   籽    |   zǐ   |    Tử    | `米` + `子`           | Hình thanh: `米` (hạt nhỏ) + `子` (`zǐ`, thanh phù kiêm ý hạt giống); hạt giống cây trồng, hạt rau quả (菜籽, 瓜籽, 棉籽).      |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`粮, 粉, 糖` (từ DB):** Các chữ thuộc trực tiếp bộ Mễ `米` (đã giải nghĩa ở mục 2).
- **`禾` (bộ Hòa — từ DB):** Cây lúa / cây ngũ cốc còn trên đồng (5 nét), bộ thủ riêng (`秋, 种, 稻`).
- **`食 / 饣` (bộ Thực — từ DB):** Ăn uống, bữa ăn, thực phẩm nói chung, bộ thủ riêng (`饭, 饮, 饱`).
- **Chữ chứa `米` ở vị trí phụ hoặc biến thể nhưng xếp ở bộ khác:**
  - `迷` (`mí`, Mê — `米` + `辶`, xếp bộ **Sước `辵/辶`**): lạc đường rối rắm như hạt gạo rải tứ tung → mê mẩn, lạc lối (迷路, 球迷).
  - `断` (`duàn`, Đoạn — `米` + `乚` + `斤`, Phồn: `斷`, xếp bộ **Cân `斤`**): giản thể lấy `米` thay khối chỉ tơ `𢇇` đứt đôi → cắt đứt, phán đoán (断开, 判断).
  - `数` (`shù / shǔ`, Số — `娄` + `攵`, Phồn: `數`, chứa `米` trong `娄`, xếp bộ **Phộc `攴/攵`**): đếm từng hạt/mục → con số, đếm (数字, 数学).
  - `类 / 類` (`lèi`, Loại — `米` + `大`, Phồn thể `類` xếp bộ **Hiệt `頁`**, Giản thể `类` xếp bộ **Đại `大`** hoặc **Mễ `米`**): giống nhau, chủng loại (人类, 分类).
  - `菊` (`jú`, Cúc — `艹` + `匊`, chứa `米`, xếp bộ **Thảo `艹`**): hoa cúc (菊花).
  - `奥` (`ào`, Áo — trên đầu có `米` trong khung `冂`, xếp bộ **Đại `大`**): thâm sâu, huyền bí (奥秘, 奥运).

---

## Bộ 142: 缶 (Phẫu)

> **[CHƯA CÓ TRONG DB - Đề xuất bổ sung]** — Bộ `缶` (Phẫu, Khang Hy `#121`) hiện chưa có bản ghi nào trong bảng `hanzihome_radicals` (`status: "MISSING"`). Dưới đây là toàn bộ thông số và dữ liệu đề xuất chuẩn hóa theo đúng schema DB.

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`) — Đề xuất bổ sung

- **Trạng thái DB:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`
- **DB ID & Thứ tự đề xuất:**
  - `id`: chưa gán — hiện toàn bảng DB có `244` dòng (`MAX(radical_index) = 244`, không có slot trống trong `1..244`); đề xuất cấp `id` và `radical_index` kế tiếp sau `244` khi bổ sung vào DB (Khang Hy: `#121`).
  - `radical`: `缶`
  - `name_vi`: `bộ Phẫu`
  - `strokes`: `6` nét
  - Ghi chú dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants` — Đề xuất):**
  - `缶` — dạng chính duy nhất (6 nét: `ノ 一 一 丨 ∟ 丨`); có thể đứng độc lập (`缶`), đứng **bên trái** (`缸, 缺, 罐, 罅` — khi đứng trái, nét ngang đáy hơi thu ngắn thành nét hất nhẹ), hoặc đứng **bên dưới** (`罂, 罄, 罍`).
- **Ý nghĩa cốt lõi (`core_meaning` — Đề xuất):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình chiếc vò / bình gốm bụng phình miệng nhỏ có nắp đậy ở trên (thời Xuân Thu Chiến Quốc còn dùng gõ làm nhạc cụ đệm hát).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Đồ đựng bằng gốm sành sứ (chum, vại, vò, bình, lọ, lon hộp `缸, 罐, 罂, 罍`) → tình trạng hư hỏng, nứt vỡ hoặc trống rỗng của đồ gốm (`缺` sứt mẻ/thiếu, `罅` vết nứt, `罄` cạn kiệt sạch trơn).
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — Đề xuất):**
  - _Nhận diện (`recognition`):_ Có `缶` thường liên quan đến bình, vò, chum vại sành sứ, hộp lon đựng đồ, hoặc vết nứt sứt mẻ, thiếu hụt, cạn sạch.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`缶` (Phẫu — 6 nét) vs `午` (Ngọ — 4 nét) + `山` (Sơn — 3 nét):** `缶` có nét sổ giữa chạy thẳng xuống chạm đáy khung mở (`∟`), **không** phải hai chữ tách rời; chú ý không tách thành `午 + 山` để tránh hiểu sai nghĩa.
    - **`缶` vs `瓦` (Ngõa) vs `皿` (Mãnh):** `缶` là **vò, chum, bình gốm có nắp/miệng nhỏ** (`缸, 罐`); `瓦` là **ngói lợp hoặc đồ gốm nung dạng mảnh/tấm** (`瓷, 瓶`); `皿` là **chén bát, đĩa, khay miệng rộng** (`盆, 盘, 盒`).
    - **`缶` vs `夬` trong `缺`:** `缺` (`quē`, thiếu/sứt) gồm `缶` (bình gốm) + `夬` (chọc vỡ, tách ra) → bình gốm bị sứt một mảnh → thiếu sót, khiếm khuyết (`缺少, 缺点`).

<details>
<summary>Đề xuất bản ghi JSON chuẩn schema <code>hanzihome_radicals</code> cho Bộ 142: 缶</summary>

```json
{
 "id": "radical-245",
 "radical_index": 245,
 "radical": "缶",
 "name_vi": "bộ Phẫu",
 "strokes": 6,
 "core_meaning": {
  "history": "hình cái vò, bình gốm bụng phình miệng nhỏ dùng đựng rượu nước hoặc gõ làm nhạc cụ cổ.",
  "modern": "đồ đựng bằng sành sứ, chum vại, bình lọ, hộp lon (缸, 罐); mở rộng sang trạng thái nứt vỡ, sứt mẻ, thiếu hụt và cạn kiệt (缺, 罅, 罄)."
 },
 "variants": [
  {
   "form": "缶",
   "note": "dạng chính (đứng độc lập, bên trái hoặc bên dưới chữ)"
  }
 ],
 "recognition": "Có 缶 thường liên quan vò gốm, chum vại, bình lọ, hộp đựng, hoặc nghĩa sứt mẻ, khe nứt, thiếu hụt, cạn sạch.",
 "distinguish": [
  "缶 là bình/vò gốm bụng phình miệng nhỏ; 皿 là bát đĩa miệng rộng; 瓦 là ngói và đồ sành sứ nói chung.",
  "缺 (thiếu) gồm 缶 + 夬: đồ gốm bị sứt mẻ một góc → thiếu hụt, khiếm khuyết.",
  "Trong chữ giản thể như 摇, 遥, 谣, phần trên phải là 䍃 (爫 + 缶), chỉ mượn âm/hình trong khối 䍃 và xếp bộ khác."
 ],
 "groups": [
  {
   "name": "Chum vại, bình vò & đồ chứa bằng gốm",
   "chars": ["缶", "缸", "罐", "罂", "罍"]
  },
  {
   "name": "Sứt mẻ, khe nứt & cạn kiệt",
   "chars": ["缺", "罅", "罄"]
  }
 ],
 "related_components": [
  {
   "form": "坛 / 罎",
   "note": "tán · Đàm · Phồn thể 罎 xếp bộ 缶 (vò rượu gốm), Giản thể gộp thành 坛 xếp bộ 土 (酒坛, 坛子)."
  },
  {
   "form": "陶",
   "note": "táo · Đào · 阝 + 勹 + 缶 · làm đồ gốm nung trong lò đất → đồ gốm, hun đúc (陶瓷, 陶冶); xếp bộ 阜 (阝)."
  },
  {
   "form": "窑 / 窯",
   "note": "yáo · Diêu · 穴 + 羔/缶 · lò nung gạch gốm, hang ở (窑洞, 砖窑); xếp bộ 穴."
  },
  {
   "form": "宝 / 寶",
   "note": "bǎo · Bảo · Phồn thể 寶 có 缶 trong nhà cùng 玉 và 貝 → vật quý (宝贝, 宝贵); xếp bộ 宀."
  },
  {
   "form": "摇 / 遥 / 谣",
   "note": "yáo · Dao/Diêu · đều mang khối thanh phù 䍃 (爫 + 缶) ở bên phải; lần lượt xếp bộ 手, 辶, 言."
  },
  {
   "form": "瓦",
   "note": "wǎ · Ngõa · bộ riêng (ngói, đồ sứ: 瓷, 瓶)."
  },
  {
   "form": "皿",
   "note": "mǐn · Mãnh · bộ riêng (bát đĩa miệng rộng: 盆, 盒)."
  }
 ]
}
```

</details>

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups` — Đề xuất)

### Nhóm A: Chum vại, bình vò & đồ chứa bằng gốm

| Chữ Hán | Pinyin |  Hán Việt   | Thiên bàng đứng chung    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                 |
| :-----: | :----: | :---------: | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   缶    |  fǒu   |    Phẫu     | Đứng độc lập             | Tượng hình bình gốm miệng nhỏ bụng phình dùng đựng rượu nước, thời cổ còn gõ đệm nhịp (瓦缶, 击缶).                                                            |
|   缸    |  gāng  | Hang / Cang | `缶` + `工`              | Hình thanh: `缶` (đồ gốm) + `工` (`gōng`, thanh phù); chum vại lớn miệng rộng bằng sành hoặc thủy tinh → chum nước, bể cá, xi-lanh (水缸, 鱼缸, 气缸).         |
|   罐    |  guàn  |    Quán     | `缶` + `雚`              | Hình thanh: `缶` (đồ gốm) + `雚` (`guàn`, thanh phù); bình/hũ cổ cao → bình, lọ, hộp thiếc, lon nước (罐头, 茶叶罐, 易拉罐).                                   |
|   罂    |  yīng  |     Anh     | `賏` + `缶` (Phồn: `罌`) | Hình thanh: `賏` (`yīng`, thanh phù) + `缶` (vò); bình gốm bụng to cổ hẹp; hiện đại hay gặp trong tên cây thuốc phiện (罂粟 `yīngsù`, quả giống cái bình nhỏ). |
|   罍    |  léi   |     Lôi     | Ba `田` (`晶` cổ) + `缶` | Hình thanh kiêm hội ý: hình vân sấm sét khắc trên thân vò rượu cổ (`缶`) → chiếc bình/hồ lớn đựng rượu thời Thương–Chu (金罍, 瓦罍).                           |

### Nhóm B: Sứt mẻ, khe nứt & trạng thái cạn kiệt

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                      |
| :-----: | :----: | :------: | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
|   缺    |  quē   |  Khuyết  | `缶` + `夬`           | Hình thanh kiêm hội ý: đồ gốm (`缶`) bị làm vỡ/tách ra (`夬`, thanh phù `guài`) → sứt mẻ, thiếu hụt, khiếm khuyết (缺少, 缺点, 缺乏).               |
|   罅    |  xià   |    Há    | `缶` + `虍` + `乎`    | Hình thanh: `缶` (đồ gốm) + `𧇊` (`hū`, thanh phù); vết rạn nứt trên thân đồ gốm → khe nứt, kẽ hở, thiếu sót (罅隙, 罅漏).                          |
|   罄    |  qìng  |  Khánh   | `殸` + `缶`           | Hình thanh kiêm hội ý: `缶` (vò đựng) rỗng không còn gì + `殸` (`qìng`, thanh phù kiêm ý rỗng kêu vang) → sạch nhẵn, cạn kiệt hết (告罄, 罄竹难书). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components` — Đề xuất)

- **`坛 / 罎`** (`tán`, Đàm): Phồn thể `罎` (`缶 + 雲`) xếp bộ **Phẫu `缶`** chỉ bình rượu/hũ gốm; Giản thể gộp chung vào `坛` (xếp bộ **Thổ `土`**) (酒坛, 坛子).
- **`陶`** (`táo`, Đào — `阝` + `勹` + `缶`, xếp bộ **Phụ `阜/阝`**): nung đồ gốm (`缶`) trong lò đất trên sườn đồi (`阝`) → đồ gốm sứ, hun đúc tính cách (陶瓷, 陶冶).
- **`窑 / 窯`** (`yáo`, Diêu — `穴` + `䍃/羔`, xếp bộ **Huyệt `穴`**): lò nung gạch gốm, nhà hang (窑洞, 砖窑).
- **`宝 / 寶`** (`bǎo`, Bảo — Phồn thể `寶` gồm `宀 + 玉 + 缶 + 貝`, xếp bộ **Miên `宀`**): đồ quý (`玉, 缶, 貝`) cất trong nhà → châu báu, quý giá (宝贝, 宝贵).
- **`摇 / 遥 / 谣`** (`yáo`, Dao / Diêu — Phồn: `搖 / 遙 / 謠`, đều chứa khối `䍃` = `爫 + 缶` làm thanh phù `yáo`, lần lượt xếp bộ **Thủ `扌`**, **Sước `辶`**, **Ngôn `讠`**): lắc rung (摇动), xa xôi (遥远), lời đồn/bài hát (谣言, 民谣).
- **`瓦` (bộ Ngõa) & `皿` (bộ Mãnh):** Bộ thủ riêng về đồ gốm sứ (`瓷, 瓶`) và chén bát miệng rộng (`盆, 盘, 盒`).

---

## Bộ 143: 羊 (Dương)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-157` · `radical_index`: `157` · `strokes`: `6` nét · `name_vi`: `bộ Dương` · Khang Hy: `#123` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `羊` — dạng chính (6 nét: `丶 ノ 一 一 一 丨`); đứng độc lập (`羊`), đứng **bên trái** (`羚, 羯, 羧, 羟` — nét ngang cuối viết hơi chếch thành hất hoặc thu gọn), hoặc **bên phải** (`群, 翔`).
  - `⺶` — **dương đầu có đuôi phẩy**, biến thể khi đặt ở **bên trên** chữ ghép lệch (như `美, 羞, 养, 差, 着` — nét sổ dọc uốn thành nét phẩy kéo xuống bên trái).
  - `⺷` — biến thể nét sổ **dừng ở nét ngang thứ 3**, không xuyên xuống dưới (gặp khi nằm trên đầu các chữ như `美, 善, 羔, 義` tùy chuẩn chữ Khải/In từng vùng).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình đầu con dê/cừu nhìn chính diện với hai chiếc sừng cong vểnh lên, đôi tai chìa hai bên và mũi miệng nhọn bên dưới.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Con dê, con cừu và sản phẩm/tập tính bầy đàn của loài dê (`羊, 羔, 羚, 群, 羯, 羌`) → vật phẩm tế lễ trang trọng và thịt dê ngon béo thời cổ, từ đó liên hệ tới sự đẹp đẽ, ngon lành, thèm muốn, điều tốt lành (`美, 羞, 羡, 羹, 義`) → dùng trong thuật ngữ hóa học hiện đại cho nguyên tố oxy `氧` / gốc hóa học (`羟, 羧`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `羊` / `⺶` thường liên quan đến dê/cừu, bầy đàn, món ăn ngon/canh thịt, hoặc giá trị tốt đẹp/nghi lễ trong một số chữ cổ.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`羊 / ⺶` (Dương — 6 nét) vs `半` (Bán — 5 nét):** Cực hay viết nhầm số nét ngang!
      - **`羊` (6 nét)** có **3 nét ngang** (`丶 ノ 一 一 一 丨` — giống `丷` + `王`).
      - **`半` (5 nét)** chỉ có **2 nét ngang** (`丶 ノ 一 一 丨` — giống `丷` + `干`, nghĩa là "một nửa", xếp bộ **Thập `十`**), **không phải bộ Dương** (`伴, 胖, 判` đều lấy âm/nghĩa từ `半`).
    - **`羊` vs `兰` (Lan — 5 nét):** `兰` (giản thể của `蘭`) cũng có `丷` và **3 nét ngang** ở dưới, nhưng **không có nét sổ xuyên dọc giữa**.
    - **`羊` (dê/cừu) vs `牛` (trâu/bò):** `羊` hai sừng hướng lên đối xứng (`丷`); `牛` (4 nét) chỉ có một nét phẩy sừng lệch bên trái.
    - **Thận trọng khi giải nghĩa `美` (`měi`) và `鲜` (`xiān`):**
      - Trong mẹo nhớ phổ thông hay nói "`羊 + 大` = dê to là đẹp", nhưng cổ tự học cho thấy `美` trong Giáp cốt văn vẽ **người (`大`) đội mũ lông vũ/sừng dê nhảy múa trong nghi lễ**, vì thế không nên giải cứng nhắc một chiều.
      - `鲜` (`xiān`, tươi/ngon, xếp bộ **Ngư `鱼/魚`**) ghép `鱼` (cá) + `羊` (dê), rất dễ nhớ theo ẩm thực cổ "cá + thịt dê tạo vị tươi ngon", nhưng bộ tra cứu chính là `鱼`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Loài dê/cừu, bầy đàn & bộ tộc

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                   |
| :-----: | :----: | :------: | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
|   羊    |  yáng  |  Dương   | Đứng độc lập          | Tượng hình đầu dê có sừng cong; con dê, con cừu (山羊, 绵羊, 羊毛).                                                              |
|   羔    |  gāo   |   Cao    | `⺷` + `灬`           | Hội ý: dê nhỏ (`羊`) đặt gần lửa (`灬`, hoặc giữ ấm cho con non) → dê con, cừu non (羊羔, 羔羊, 替罪羊).                         |
|   羚    |  líng  |   Linh   | `羊` + `令`           | Hình thanh: `羊` (loài dê) + `令` (`lìng`, thanh phù); loài linh dương (羚羊, 藏羚羊).                                           |
|   羯    |  jié   |   Yết    | `羊` + `曷`           | Hình thanh: `羊` (dê) + `曷` (`hé`, thanh phù); dê đực thiến, tên cổ tộc Yết, cung Ma Kết (羯羊, 摩羯座).                        |
|   羌    | qiāng  |  Khương  | `⺶` + `儿`           | Hội ý: người (`儿`) gắn liền nghề chăn dê hoặc đội mũ sừng dê (`⺶`) → tộc người Khương vùng Tây Bắc Trung Quốc (羌族, 氐羌).    |
|   群    |  qún   |   Quần   | `君` + `羊`           | Hình thanh kiêm hội ý: `君` (`jūn`, thanh phù) + `羊` (dê sống tụ thành đàn) → bầy đàn, đám đông, nhóm người (群众, 一群, 羊群). |

### Nhóm B: Đẹp đẽ, ngon lành, lễ nghi & cảm xúc cổ truyền

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                           |
| :-----: | :----: | :------: | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   美    |  měi   |    Mỹ    | `⺷` + `大`              | Hội ý cổ: người (`大`) đội trang sức sừng/lông vũ (`羊` dạng đầu) trong lễ hội → đẹp đẽ, tốt đẹp, ngon lành, nước Mỹ (美丽, 美好, 美食).                 |
|   羞    |  xiū   |    Tu    | `⺶` + `丑`              | Hội ý cổ: bàn tay (`丑/又`) dâng món thịt dê (`⺶`) → món ăn ngon (`珍羞`), sau mượn nghĩa thẹn thùng, hổ thẹn (害羞, 羞耻, 羞愧).                       |
|   羡    |  xiàn  |   Tiện   | `⺶` + `㳄` (`氵 + 欠`)  | Hội ý: nhìn thấy thịt dê ngon (`⺶`) chảy nước miếng (`㳄`) → thèm muốn, ngưỡng mộ, ghen tị (羡慕, 艳羡).                                                |
|   羹    |  gēng  |   Canh   | `羔` + `美`              | Hội ý: nấu thịt dê non (`羔`) thành món ngon (`美`) → món canh đặc, súp thịt/rau (肉羹, 玉米羹, 闭门羹).                                                 |
| 义 / 義 |   yì   |  Nghĩa   | `⺷` + `我` (`義`)       | [Phồn thể `義` xếp bộ `羊`; Giản thể `义` xếp bộ `丶`] Hội ý: lễ tế dê trang trọng dùng binh khí `我` → chính nghĩa, đạo lý, ý nghĩa (意义, 正义, 义务). |
|   羲    |   xī   |    Hi    | `⺷` + `兮` + `戈`       | Hình thanh kiêm hội ý cổ: tên vua thần thoại Phục Hi (`伏羲`), khí thở cổ; họ Hi (伏羲, 羲和).                                                           |
|   羸    |  léi   |   Luy    | `亡 + 口 + 月 + 羊 + 凡` | Hình thanh kiêm hội ý: con dê gầy trơ xương → gầy yếu, suy kiệt (羸弱, 羸瘦; lưu ý khác chữ `赢` thắng).                                                 |

### Nhóm C: Thuật ngữ hóa học hiện đại ghép từ `羊` (lấy từ `氧` oxy)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                              |
| :-----: | :----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
|   羟    | qiǎng  |  Kháng   | `羊` + `巠`           | Chữ tạo mới hóa học: ghép nửa trái `氧` (`yǎng`, oxy → mượn `羊`) + nửa phải `氢` (`qīng`, hydro → mượn `巠`) → nhóm hydroxyl `-OH` (羟基). |
|   羧    |  suō   |   Toa    | `羊` + `夋`           | Chữ tạo mới hóa học: ghép nửa trái `氧` (`羊`) + nửa phải `酸` (`suān`, axit → mượn `夋`) → nhóm carboxyl `-COOH` (羧基, 羧酸).             |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`美, 群` (từ DB):** Đều là chữ chính thức thuộc bộ Dương `羊` (đã giải nghĩa ở mục 2).
- **`牛` & `犬 / 犭` (từ DB):** Các bộ động vật gia súc riêng (`牛` trâu bò; `犬/犭` chó/thú).
- **Chữ chứa `羊 / ⺶ / ⺷` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `鲜 / 鮮` (`xiān / xiǎn`, Tiên — `鱼` + `羊`, xếp bộ **Ngư `魚/鱼`**): cá + thịt dê → tươi sống, ngon ngọt, ít ỏi (`xiǎn`) (新鲜, 海鲜, 鲜艳).
  - `善` (`shàn`, Thiện — `⺷` + `丷` + `口`, xếp bộ **Khẩu `口`**): nói lời tốt lành như lễ tế dê → hiền lành, tốt đẹp, giỏi (善良, 改善, 善于).
  - `养 / 養` (`yǎng`, Dưỡng — `⺶` + `介` giản / `⺶` + `食` phồn, Khang Hy xếp bộ **Thực `食`**, Tân Hoa xếp bộ **Bát `丷`** hoặc **Dương `羊`**): cho ăn uống nuôi nấng → nuôi dưỡng, dưỡng dục (培养, 营养, 养老).
  - `差` (`chà / chā / chāi / cī`, Sai / Si — `⺶` + `工`, xếp bộ **Công `工`**): gốc là lúa mạch/bàn tay không đều → sai lệch, kém (`chà`), chênh lệch (`chā`), sai đi công tác (`chāi`) (差不多, 差别, 出差).
  - `着` (`zhe / zháo / zhuó`, Trứ — `⺷` + `目`, xếp bộ **Mục `目`**): biến thể từ `著` (bộ Thảo), mang phần đầu giống `⺷` (看着, 着急, 穿着).
  - `翔` (`xiáng`, Tường — `羊` + `羽`, xếp bộ **Vũ `羽`**): chim bay sải cánh lượn vòng (飞翔, 滑翔).
  - `洋` (bộ Thủy `氵`: đại dương `海洋`), `样` (bộ Mộc `木`: kiểu dáng `样子`), `详` (bộ Ngôn `讠`: chi tiết `详细`), `祥` (bộ Thị `礻`: tốt lành `吉祥`), `氧` (bộ Khí `气`: khí oxy `氧气`), `痒` (bộ Nạch `疒`: ngứa `发痒`), `姜` (bộ Nữ `女`: gừng `生姜`) — đều dùng `羊` làm **thanh phù** (`yáng / xiáng / jiāng`), nghĩa chính do bộ thủ còn lại quyết định.

---

## Bộ 144: 羽 (Vũ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-158` · `radical_index`: `158` · `strokes`: `6` nét · `name_vi`: `bộ Vũ` · Khang Hy: `#124` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `羽` — dạng chính (6 nét: `𠃌 丶 ㇀ 𠃌 丶 ㇀`), là hai cánh lông xếp song song; có thể đứng độc lập (`羽`), đứng **bên trái** (`翌` nằm trên, `翊`), **bên phải** (`翅, 翔, 翱, 翻, 翩, 翰`), **bên trên** (`翠, 翁, 翟, 習`), hoặc **bên dưới** (`翳, 翼`).
  - `习` — dạng giản hóa của `習` (trong đó bỏ phần `白` dưới, chỉ giữ một nửa nét cánh `习`); chỉ dùng trong `习` và một số chữ liên quan, **không** phải biến thể chung thay cho `羽` ở mọi chữ.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình đôi cánh chim hoặc hai chiếc lông vũ dài đối xứng nhau.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Lông vũ, đôi cánh, hành động bay lượn nhẹ nhàng (`羽, 翅, 翼, 翔, 翱, 翩, 翻`) → màu sắc rực rỡ của lông chim quý, đồ trang sức/tán lọng lông chim (`翠, 翡, 翟, 翳`), lông cổ chim bạc trắng chuyển sang chỉ người già (`翁`) → dùng lông chim làm bút viết (`翰`) và chim non tập vỗ cánh liên tục chuyển sang nghĩa học tập, luyện tập (`習/习`, `翌` ngày tiếp nối hôm nay).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `羽` thường liên quan đến lông vũ, cánh chim, bay lượn, chuyển động nhẹ nhàng/xoay lật, màu xanh lông chim hoặc chữ cổ về tập luyện/văn bút.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`羽` (lông vũ/cánh) vs `飞` (bay) vs `鸟` (chim):** `羽` là bộ phận **lông và cánh**; `飞` (3 nét) là **hành động bay**; `鸟` (5 nét) là **con chim**.
    - **`羽` vs `习` (`習`):** Trong Phồn thể `習` có `羽` ở trên + `白` ở dưới (chim non vỗ cánh luyện bay hàng ngày); Giản thể `习` giản lược chỉ còn một nửa khung cánh (xếp bộ **Ất `乙`** hoặc bộ `习`), nên không đồng nhất mọi `习` với `羽`.
    - **`羽` vs `弱` (`ruò`, yếu):** `弱` (xếp bộ **Cung `弓`**) là hai cây cung kèm nét trang trí lông/chỉ hai bên, không phải bộ `羽`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Lông vũ, đôi cánh & động tác bay lượn

| Chữ Hán | Pinyin |  Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                   |
| :-----: | :----: | :--------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
|   羽    |   yǔ   |     Vũ     | Đứng độc lập          | Tượng hình hai chiếc lông cánh chim đối xứng; lông vũ, cánh chim, một âm trong ngũ cung (羽毛, 羽毛球, 羽绒服).                                  |
|   翅    |  chì   |     Sí     | `支` + `羽`           | Hình thanh: `支` (`zhī`, thanh phù) + `羽` (cánh); cánh chim hoặc côn trùng, vây cá (翅膀, 鱼翅, 展翅).                                          |
|   翼    |   yì   |    Dực     | `羽` + `异`           | Hình thanh kiêm hội ý: `羽` (đôi cánh) + `异` (`yì`, thanh phù); đôi cánh chim/máy bay, sườn bên, giúp đỡ, cẩn trọng (羽翼, 机翼, 小心翼翼).     |
|   翔    | xiáng  |   Tường    | `羊` + `羽`           | Hình thanh: `羊` (`yáng`, thanh phù) + `羽` (cánh); chim sải cánh bay lượn vòng trên không (飞翔, 滑翔, 翱翔).                                   |
|   翱    |   áo   | Cao / Ngao | `皋` + `羽`           | Hình thanh: `皋` (`gāo`, thanh phù) + `羽` (cánh); bay lượn tự do trên tầng cao (翱翔).                                                          |
|   翻    |  fān   |   Phiên    | `番` + `羽`           | Hình thanh: `番` (`fān`, thanh phù) + `羽` (cánh bay); vỗ cánh bay lộn ngược → lật ngược, trở mình, vượt qua, dịch thuật (翻译, 翻车, 翻山越岭). |
|   翩    |  piān  |   Phiên    | `扁` + `羽`           | Hình thanh: `扁` (`biǎn`, thanh phù) + `羽` (cánh bay); bay lượn nhẹ nhàng, dáng dấp phong nhã thanh thoát (翩翩, 翩然, 浮想联翩).               |

### Nhóm B: Lông chim quý, sắc màu, đồ che & văn chương

| Chữ Hán |  Pinyin   |   Hán Việt   | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                     |
| :-----: | :-------: | :----------: | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
|   翠    |    cuì    |     Thúy     | `羽` + `卒`           | Hình thanh: `羽` (lông chim) + `卒` (`zú`, thanh phù); loài chim bói cá lông xanh biếc → màu xanh ngọc bích (翡翠, 翠绿, 青翠).                    |
|   翡    |    fěi    |     Phỉ      | `非` + `羽`           | Hình thanh: `非` (`fēi`, thanh phù) + `羽` (lông chim); chim trả lông đỏ (ghép cùng `翠` chim xanh thành tên đá ngọc phỉ thúy) (翡翠).             |
|   翟    | dí / zhái | Địch / Trạch | `羽` + `隹`           | Hội ý: chim đuôi dài (`隹` có `羽`); chim trĩ lông dài, tộc Địch cổ (`dí`), họ Trạch (`zhái`) (墨翟).                                              |
|   翳    |    yì     |      Ế       | `医 + 殳` + `羽`      | Hình thanh: `𣪠` (`yī`, thanh phù) + `羽` (tán lọng bằng lông chim); che khuất ánh sáng, vẩn đục giác mạc mắt (阴翳, 白内障/眼翳).                 |
|   翰    |    hàn    |     Hàn      | `𠦝` + `羽`           | Hình thanh: `𠦝` (`gàn`, thanh phù) + `羽` (lông chim); lông cánh chim dài cứng (xưa dùng làm bút hoặc gắn tên) → văn chương, thư từ (翰林, 书翰). |
|   耀    |    yào    |     Diệu     | `光` + `翟`           | Hình thanh: `光` (ánh sáng) + `翟` (`dí`, thanh phù, chứa `羽`); chiếu sáng rực rỡ, khoe khoang (照耀, 炫耀, 荣耀).                                |

### Nhóm C: Tuổi tác, thời gian, luyện tập & nghĩa mở rộng

| Chữ Hán |   Pinyin    | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                |
| :-----: | :---------: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   翁    |    wēng     |   Ông    | `公` + `羽`           | Hình thanh: `公` (`gōng`, thanh phù) + `羽` (lông cổ chim bạc trắng); cổ chim lông xù → người đàn ông lớn tuổi, cụ ông, bố (老翁, 渔翁, 主人翁).              |
|   翌    |     yì      |   Dực    | `羽` + `立`           | Hình thanh kiêm hội ý: `羽` (cánh bay tiếp nối) + `立` (`lì`, thanh phù); ngày kế tiếp ngay sau hôm nay → ngày mai, năm sau (翌日, 翌年).                     |
|   翘    | qiào / qiáo |   Kiều   | `尧` + `羽`           | Hình thanh: `尧` (`yáo`, Phồn: `翹` dùng `堯`, thanh phù) + `羽` (lông đuôi); lông đuôi vểnh cao → nhô lên, vểnh (`qiào`: 翘起), xuất chúng (`qiáo`: 翘楚).   |
| 习 / 習 |     xí      |   Tập    | `羽` + `白` (`習`)    | [Phồn thể `習` xếp bộ `羽`; Giản thể `习` xếp bộ `乙/习`] Chim non (`白/自`) tập vỗ cánh (`羽`) nhiều lần → học tập, luyện tập, thói quen (学习, 练习, 习惯). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`翅, 翔, 翻, 习 / 習` (từ DB):** Đều liên quan trực tiếp đến bộ Vũ `羽` (`翅, 翔, 翻` thuộc bộ `羽`; `習` Phồn thể thuộc bộ `羽`, Giản thể `习` xếp bộ `乙`).
- **`飞 / 飛` & `鸟 / 鳥` (từ DB):** Hai bộ thủ riêng biểu thị hành động bay (`飞`) và loài chim (`鸟`).
- **Chữ chứa `羽` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `扇` (`shàn / shān`, Phiến — `户` + `羽`, xếp bộ **Hộ `戶/户`**): cánh cửa hai lá hoặc cái quạt lông chim → cái quạt, cánh cửa, quạt gió (风扇, 一扇门).
  - `塌` (`tā`, Tháp — `土` + `日` + `羽`, xếp bộ **Thổ `土`**): phần phải là `𦐇` (`日 + 羽`, thanh phù `tà`), nghĩa sụp đổ, lún xuống (倒塌, 塌陷).
  - `剪` (`jiǎn`, Tiễn — `前` + `刀`, dạng gốc là `翦` xếp bộ `羽`, nay `剪` xếp bộ **Đao `刀`**): cắt tỉa bằng kéo (剪刀, 剪纸).
  - `戳` (`chuō`, Trạc — `翟` + `戈`, chứa `羽` trong `翟`, xếp bộ **Qua `戈`**): đâm, chọc, đóng dấu (戳穿, 邮戳).
  - `跃 / 躍` (`yuè`, Dược — `足` + `翟`, chứa `羽` trong `翟`, xếp bộ **Túc `足/⻊`**): nhảy vọt lên (跳跃, 活跃).
  - `弱` (`ruò`, Nhược — xếp bộ **Cung `弓`**): yếu ớt (lưu ý nét bên cạnh `弓` nhìn hơi giống lông/cánh nhưng không thuộc `羽`) (虚弱, 弱点).

---

## Bộ 145: 老 (Lão)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-057` · `radical_index`: `57` · `strokes`: `6` nét · `name_vi`: `bộ Lão` · Khang Hy: `#125` · **Dòng trùng/rỗng:** Có dòng trùng rỗng **`radical-159`** (`radical_index`: `159`, `radical`: `"老"`, `name_vi: null`, `strokes: null`, `core_meaning: {}`) cần dọn/gộp khi chuẩn hóa DB.
- **Hình thái & Biến thể (`variants`):**
  - `老` — dạng chính (6 nét: `一 丨 一 丿 丿 乚`), gồm `耂` ở trên + `匕` ở dưới; đứng độc lập (`老`) hoặc đứng bên trái/phải trong một số chữ ít dùng hơn (`姥`).
  - `耂` — **lão đầu** (4 nét: `一 丨 一 丿`), phần đầu rút gọn của `老` khi nằm phía trên các chữ khác (`考, 者, 孝, 耄, 耆, 耋`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Giáp cốt văn vẽ hình người cao tuổi tóc dài lưa thưa, lưng còng chống gậy đứng tựa (gồm phần người đội tóc + cây gậy biến thành `匕`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Già cả, lớn tuổi, lâu năm, giàu kinh nghiệm (`老, 耄, 耆, 耋, 考`) → con cái phụng dưỡng cha mẹ già (`孝`), người/đại từ chỉ người (`者`) → mở rộng trong tiếng Trung hiện đại thành từ xưng hô thân mật, tôn kính hoặc nhấn mạnh mức độ/tính thường xuyên (`老师, 老板, 老王, 老实, 老是`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `老` / `耂` thường liên quan đến tuổi già, bậc tiền bối, thời gian lâu dài, sự chăm sóc cha mẹ hoặc kinh nghiệm lão luyện.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`老` vs `耂` vs `考`:** Đây là cặp dễ nhầm cấu tạo phần đáy!
      - **`老` (`耂 + 匕`, 6 nét)** có phần dưới là `匕` (2 nét: `ノ 乚`), nghĩa gốc là già, lâu năm (`老人, 古老`).
      - **`耂` (4 nét)** chỉ là phần đầu lược bỏ `匕`, **không dùng đứng độc lập**.
      - **`考` (`耂 + 丂`, 6 nét — xếp bộ `老` Khang Hy)** có phần dưới là `丂` (2 nét: `一 ㇉`, âm cổ `kǎo`), nghĩa gốc là "người già, cha đã khuất", nay nghĩa thông dụng là **khảo cứu, kiểm tra, thi cử** (`考试, 考察, 思考`). Đừng viết nhầm đáy `考` thành `匕` hay `与`.
    - **`者` (`耂 + 丶 + 日`):** Trong từ điển Khang Hy, `者` xếp thẳng vào bộ `老` (#125); tuy nhiên trong chữ hiện đại `者` chủ yếu làm trợ từ/danh từ hóa chỉ "người/kẻ/vật" (`作者, 记者, 或者`), không nên giải cứng mọi chữ chứa `者` (`煮, 暑, 都, 猪`) theo nghĩa "người già".
    - **Chữ dùng xưng hô hiện đại:** `老师` (thầy/cô giáo), `老板` (ông chủ), `老朋友` (bạn cũ lâu năm), `老张` (anh/ông Trương) — mang sắc thái thân tình hoặc thâm niên chứ không phải lúc nào cũng chỉ "già".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Tuổi già, kính lão & thâm niên (chữ thuộc bộ `老 / 耂`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                               |
| :-----: | :----: | :------: | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
|   老    |  lǎo   |   Lão    | Độc thể (`耂 + 匕`)     | [Tra bộ 老] Tượng hình cụ già chống gậy; già, cũ, lâu năm, giàu kinh nghiệm, tiền tố xưng hô/phó từ "luôn/rất" (老人, 老师, 老实).           |
|   考    |  kǎo   |   Khảo   | `耂` + `丂`             | [Tra bộ 老] Hình thanh: `耂` (người già, nghĩa gốc) + `丂` (`kǎo`, thanh phù); khảo sát, kiểm tra, thi cử, suy nghĩ (考试, 考察, 思考).      |
|   耄    |  mào   |   Mạo    | `耂` + `毛`             | [Tra bộ 老] Hình thanh kiêm hội ý: `耂` (tuổi già) + `毛` (`máo`, thanh phù); người rất già (80–90 tuổi), lẩm cẩm lẫn (耄耋, 耄耋之年).      |
|   耆    |   qí   |    Kỳ    | `耂` + `旨` (hoặc `日`) | [Tra bộ 老] Hình thanh: `耂` (già) + phần dưới biến dạng `日/旨`; người cao tuổi đức cao (khoảng 60 tuổi trở lên) (耆老, 耆宿).              |
|   耋    |  dié   |   Điệt   | `耂` + `至`             | [Tra bộ 老] Hình thanh kiêm hội ý: `耂` (già) + `至` (`zhì`, thanh phù kiêm ý tuổi đạt đỉnh cao); người cao tuổi (70–80 tuổi) (耄耋).        |
|   耇    |  gǒu   |   Cẩu    | `耂` + `句`             | [Tra bộ 老] Hình thanh: `耂` (già) + `句` (`jù`, thanh phù); người già da nhăn nheo, sống thọ (cũng viết `耈`) (黄耇, 耇老).                 |
|   孝    |  xiào  |   Hiếu   | `耂` + `子`             | [Tân Hoa xếp bộ 耂/老; Khang Hy xếp bộ 子] Hội ý: con (`子`) nâng đỡ, phụng dưỡng cha mẹ già (`耂`) → hiếu thảo, để tang (孝顺, 孝敬, 尽孝). |

### Nhóm B: Chữ chỉ người / đại từ hóa xếp ở bộ `老` & các chữ mở rộng từ `耂 / 老`

| Chữ Hán |   Pinyin    | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                               |
| :-----: | :---------: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   者    |     zhě     |   Giả    | `耂` + `丶` + `日`    | [Tra bộ 老] Cổ tự vẽ cành củi cháy trên bếp (thanh phù cho chữ chỉ người), Khải thư hợp thành `耂 + 日`; người làm việc gì, cái ấy, hoặc (作者, 记者, 或者). |
|   姥    |  lǎo / mǔ   |    Mỗ    | `女` + `老`           | [Tra bộ 女, chứa `老`] Bà ngoại (`lǎolao`: 姥姥); nhũ mẫu/bà già (`mǔ`: 天姥山).                                                                             |
|   烤    |     kǎo     |   Khảo   | `火` + `考`           | [Tra bộ 火, chứa `考` (`耂`)] Dùng lửa (`火`) nướng chín (`考` thanh phù `kǎo`) → nướng, sưởi ấm (烤鸭, 烧烤, 烤肉).                                         |
|   教    | jiāo / jiào |   Giáo   | `孝` + `攵`           | [Tra bộ 攴/攵, chứa `孝` (`耂`)] Người lớn dùng roi/lời khuyên (`攵`) dạy dỗ trẻ học hiếu lễ (`孝`) → dạy học, giáo dục (教书, 教育, 教室).                  |
|   煮    |     zhǔ     |   Chử    | `者` + `灬`           | [Tra bộ 火/灬, chứa `者` (`耂`)] Đặt nồi lên lửa (`灬`) đun nấu (`者` thanh phù `zhǔ`) → luộc, nấu, đun (煮饭, 水煮鱼).                                      |
|   都    |  dōu / dū   |    Đô    | `者` + `阝`           | [Tra bộ 邑/阝, chứa `者` (`耂`)] Kinh đô, đô thị (`dū`: 首都, 都市); tất cả, đều (`dōu`: 都是, 大家).                                                        |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`考, 耄` (từ DB):** Các chữ thuộc trực tiếp bộ Lão `老` (đã giải nghĩa ở mục 2).
- **`孝` (từ DB):** `耂 + 子` — Khang Hy xếp bộ **Tử `子`**, Tân Hoa xếp bộ **`耂`** (hiếu thảo: 孝顺).
- **`者` (từ DB):** Xếp bộ **Lão `老`** trong Khang Hy, nhưng hoạt động như một **khối thanh phù cực mạnh** tạo nên hàng chục chữ thông dụng ở các bộ khác:
  - `暑` (`shǔ`, Thử — `日` + `者`, xếp bộ **Nhật `日`**): nóng nực, mùa hè (暑假, 中暑).
  - `署` (`shǔ`, Thự — `罒` + `者`, xếp bộ **Võng `网/罒`**): công sở, ký tên, bố trí (签署, 部署).
  - `猪` (`zhū`, Trư — `犭` + `者`, xếp bộ **Khuyển `犬/犭`**): con lợn, heo (猪肉, 小猪).
  - `诸` (`zhū`, Chư — `讠` + `者`, xếp bộ **Ngôn `言/讠`**): các, mọi (诸位, 诸多).
  - `堵` (`dǔ`, Đổ — `土` + `者`, xếp bộ **Thổ `土`**): chặn lại, tắc nghẽn (堵车, 堵塞).
  - `赌` (`dǔ`, Đổ — `贝` + `者`, xếp bộ **Bối `貝/贝`**): đánh bạc, cá cược (赌博, 打赌).
  - `绪` (`xù`, Tự — `纟` + `者`, xếp bộ **Mịch `糸/纟`**): đầu mối, tâm trạng (情绪, 头绪).
  - `奢` (`shē`, Xa — `大` + `者`, xếp bộ **Đại `大`**): xa xỉ, phung phí (奢侈).
  - `著` (`zhù`, Trứ — `艹` + `者`, xếp bộ **Thảo `艹`**): nổi tiếng, viết sách (著名, 著作).

---

## Bộ 146: 而 (Nhi)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-160` · `radical_index`: `160` · `strokes`: `6` nét · `name_vi`: `bộ Nhi` · Khang Hy: `#126` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `而` — dạng chính duy nhất (6 nét: `一 丿 丨 𠃌 丨 丨`); đứng độc lập (`而`), đứng **bên trái** (`耐`), **bên dưới** (`耍, 耑` — và trong chữ ghép như `需`), hoặc **bên trên** (`耎`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Theo _Thuyết văn giải tự_, tượng hình bộ râu quai nón / chòm râu quanh miệng và má (gồm nét ngang trên mô tả cằm/mép và các nét rủ xuống là sợi râu).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Nghĩa gốc "râu/quai hàm" gần như biến mất hoàn toàn trong tiếng Trung hiện đại; `而` bị giả tá sớm làm **liên từ ngữ pháp** ("mà, nhưng, và, rồi mới": `而且, 然而, 因而, 从而`), còn trong cấu tạo chữ cổ lưu dấu ở các chữ liên quan chịu đựng/kiềm chế (`耐`), đùa nghịch (`耍`), mềm yếu (`耎`) hoặc đóng vai trò khối hình/âm (`耑` → `端, 瑞, 喘`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Gặp `而` trong chữ hiện đại **không nên đoán cứng nghĩa theo "râu"**, vì đa phần chữ dùng `而` đã trừu tượng hóa hoặc chuyển sang làm linh kiện hình/thanh phù; khi đứng độc lập, `而` là liên từ cực kỳ quan trọng.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`而` (6 nét: 2 nét sổ thẳng ở giữa) vs `面` (Diện — 9 nét) & `页/頁` (Hiệt):** Cả ba đều nằm trong nhóm đầu-mặt cổ tự, nhưng `而` không có khung khép kín bên dưới (`一 丿 丨 𠃌 丨 丨`), còn `面` có khung chữ nhật khép kín bọc `口` bên trong.
    - **`而` vs `西` / `两`:** `而` mở đáy ở dưới (không có nét ngang đóng đáy), trong khi `西` đóng đáy thành khung kín.
    - **Chữ then chốt nên nhớ:** `耐` (`而 + 寸`, chịu đựng, nhẫn nại: `耐心, 耐用`) và các từ ngữ pháp dùng `而` (`而且, 然而, 从而, 反而`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Liên từ ngữ pháp & trạng thái chịu đựng, đùa nghịch

| Chữ Hán | Pinyin |  Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                              |
| :-----: | :----: | :--------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
|   而    |   ér   |    Nhi     | Đứng độc lập          | Tượng hình bộ râu cổ, giả tá làm liên từ nối (mà, nhưng, và, để rồi); nay cực phổ biến trong liên từ (而且, 然而, 因而).                    |
|   耐    |  nài   |    Nại     | `而` + `寸`           | Hội ý cổ: phạt cạo râu (`而`) nhẹ hơn hình phạt khác hoặc dùng tay (`寸`) kìm nén giữ râu → chịu đựng, nhẫn nại, bền bỉ (耐心, 耐劳, 耐用). |
|   耍    |  shuǎ  | Sái / Thỏa | `而` + `女`           | Hội ý/hình thanh cổ: người nữ (`女`) múa may/đùa giỡn (lệ biến thành `而 + 女`) → chơi đùa, biểu diễn, giở trò (玩耍, 耍赖, 杂耍).          |

### Nhóm B: Linh kiện cổ thuộc bộ `而` (nguồn gốc cho nhiều chữ thông dụng)

| Chữ Hán |    Pinyin    |   Hán Việt    | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                  |
| :-----: | :----------: | :-----------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
|   耑    | duān / zhuān | Đoan / Chuyên | `山` + `而`           | Tượng hình cổ: mầm cây nhú lên trên (`山`) và rễ đâm xuống dưới (`而`) → đầu mút, cội nguồn; là gốc của `端, 瑞, 喘, 湍` (发耑/发端).           |
|   耎    |     ruǎn     |    Nhuyễn     | `而` + `大`           | Hội ý cổ: dạng mềm mại dẻo dai (cổ văn viết gốc cho `软` mềm mại); nay chủ yếu gặp làm thành phần cấu chữ trong `软, 糯` (phồn `稬` chứa `耎`). |
|   耏    |   ér / nài   |   Nhi / Nại   | `而` + `彡`           | Hội ý: râu dài (`而`) mọc rậm (`彡`) → râu quai nón; hình phạt cắt râu cổ đại (chữ gốc của `耐`) (耏刑).                                        |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`耐, 耍` (từ DB):** Thuộc trực tiếp bộ Nhi `而` (đã giải nghĩa ở mục 2).
- **`面` & `頁 / 页` (từ DB):** Hai bộ thủ riêng cùng vùng đầu–mặt (`面` mặt/bề mặt, `頁/页` đầu/trang giấy).
- **Chữ chứa `而` hoặc `耑 / 耎` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `需` (`xū`, Nhu — `雨` + `而`, xếp bộ **Vũ `雨`**): gặp mưa (`雨`) dừng lại chờ đợi (`而` cổ là râu/dầm mưa) → cần thiết, nhu cầu (需要, 需求, 必需).
  - `儒` (`rú`, Nho — `亻` + `需`, chứa `而`, xếp bộ **Nhân `人`**): nhà nho, Nho giáo (儒家, 儒雅).
  - `端` (`duān`, Đoan — `立` + `耑`, xếp bộ **Lập `立`**): đầu mút, ngay ngắn, bưng bê (开始/开端, 端正, 端水).
  - `瑞` (`ruì`, Thụy — `王` + `耑`, xếp bộ **Ngọc `玉/王`**): ngọc bích làm tin, điềm lành (祥瑞, 瑞士).
  - `喘` (`chuǎn`, Suyễn — `口` + `耑`, xếp bộ **Khẩu `口`**): thở dốc, hen suyễn (喘气, 气喘).
  - `软 / 軟` (`ruǎn`, Nhuyễn — `车` + `欠`, cổ tự liên hệ `耎`, xếp bộ **Xa `車/车`**): mềm mại, phần mềm (柔软, 软件).
  - `濡` (`rú`, Nhu — `氵` + `需`, chứa `而`, xếp bộ **Thủy `水/氵`**): thấm ướt, chần chừ (耳濡目染).

---

## Bộ 147: 耒 (Lỗi)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-161` · `radical_index`: `161` · `strokes`: `6` nét · `name_vi`: `bộ Lỗi / Lỗi cày` · Khang Hy: `#127` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `耒` — dạng chính duy nhất (6 nét: `一 一 一 丨 ノ 丶`); đứng độc lập (`耒`) hoặc đứng **bên trái** chữ ghép (`耕, 耗, 耘, 耙, 耦, 耖, 耢` — khi đứng trái, nét mác cuối thu gọn thành nét chấm `丶`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình chiếc cày gỗ hai răng thời cổ (nét phẩy và chấm phía trên là thanh tay cầm hoặc phần cán cong, bên dưới giống cây gỗ `木` có lưỡi chẻ nhánh để xới đất).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Công cụ nông nghiệp và thao tác cày bừa, làm cỏ, canh tác ngoài ruộng (`耒, 耕, 耘, 耙, 耖, 耢`) → hai người cùng đẩy một cái cày thành nghĩa đôi cặp (`耦`) → thóc lúa/lương thực sau canh tác bị tiêu giảm, mòn hụt thành nghĩa tiêu hao, hao tổn (`耗`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `耒` ở bên trái gần như chắc chắn liên quan đến cày bừa, công cụ làm đất, việc đồng áng hoặc nghĩa tiêu hao phát sinh từ nông nghiệp (`耗`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`耒` (Lỗi — 6 nét) vs `木` (Mộc — 4 nét) vs `禾` (Hòa — 5 nét) vs `来` (Lai — 7 nét):**
      - **`木` (4 nét)**: chỉ có **1 nét ngang** (`一 丨 ノ 丶`) — cây gỗ.
      - **`禾` (5 nét)**: 1 nét phẩy đầu + **1 nét ngang** (`ノ 一 丨 ノ 丶`) — cây lúa.
      - **`耒` (6 nét)**: **3 nét ngang** (`一 一 一 丨 ノ 丶`, hoặc nét phẩy trên thành ngang ngắn + 2 nét ngang dưới) — cái cày, **không có nét chấm phẩy hai bên như `米/来`**.
      - **`来` (7 nét)**: nét ngang đỉnh + chữ `米` ở dưới (nghĩa "đến").
    - **`耒` vs `田` (Điền):** `耒` là **nông cụ và hành động cày bừa** (`耕` cày, `耘` làm cỏ), còn `田` là **thửa ruộng** (`男, 留, 画`).
    - **Lưu ý chữ `耗` (`hào`):** Phổ biến nhất trong tiếng Trung hiện đại (`消耗` tiêu hao, `耗费` hao tốn, `耗子` con chuột — vì chuột hay cắn phá làm hao hụt thóc lúa!).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cày bừa, làm cỏ & công cụ canh tác ruộng đất

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                          |
| :-----: | :-----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   耒    |   lěi   |   Lỗi    | Đứng độc lập          | Tượng hình cái cày gỗ lưỡi chẻ thời cổ; tay cày, nông cụ cổ (耒耜 `lěisì`, cái cày và lưỡi cày).                                                        |
|   耕    |  gēng   |   Canh   | `耒` + `井`           | Hội ý kiêm thanh: dùng cái cày (`耒`) xới từng ô ruộng vuông vức (`井`, âm gần `gēng`) → cày ruộng, canh tác, lao động cần mẫn (耕地, 耕种, 笔耕).      |
|   耘    |   yún   |   Vân    | `耒` + `云`           | Hình thanh: `耒` (nông cụ) + `云` (`yún`, thanh phù); nhổ cỏ và xới đất quanh gốc lúa → làm cỏ ruộng (耕耘, 耘田).                                      |
|   耙    | pá / bà |    Bà    | `耒` + `巴`           | Hình thanh: `耒` (nông cụ) + `巴` (`bā`, thanh phù); cái bừa đất (`bà`: 钉耙); động tác bừa, cào cho tơi đất (`pá`: 耙地).                              |
|   耖    |  chào   |   Sao    | `耒` + `少`           | Hình thanh: `耒` (nông cụ) + `少` (`shǎo`, thanh phù); cái bừa răng thưa dùng đánh tơi đất bùn ruộng nước trước khi cấy (耖田).                         |
|   耢    |   lào   |   Lạo    | `耒` + `劳`           | Hình thanh: `耒` (nông cụ) + `劳` (`láo`, Phồn: `耮` dùng `勞`, thanh phù); bàn lăn/bừa không răng kéo phẳng mặt đất để giữ ẩm sau khi gieo hạt (耢地). |

### Nhóm B: Hao tổn & kết đôi phát sinh từ việc cày ruộng

| Chữ Hán | Pinyin | Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                       |
| :-----: | :----: | :-------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
|   耗    |  hào   | Háo / Hao | `耒` + `毛`           | Hình thanh: `耒` (lương thực từ đồng ruộng) + `毛` (`máo`, thanh phù); thóc lúa giảm hụt → tiêu hao, lãng phí, tin dữ, con chuột (消耗, 耗费, 噩耗). |
|   耦    |   ǒu   |   Ngẫu    | `耒` + `禺`           | Hình thanh kiêm hội ý: `耒` (cày) + `禺` (`yú`, thanh phù); hai người đi song song cùng đẩy hai lưỡi cày → đôi, cặp, sánh đôi (耦耕; gốc chữ `偶`).  |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`耕, 耗, 耘` (từ DB):** Các chữ thông dụng nhất thuộc trực tiếp bộ Lỗi `耒` (đã giải nghĩa ở mục 2).
- **`禾` & `田` (từ DB):** Hai bộ thủ riêng thuộc trường nghĩa nông nghiệp (`禾` cây lúa; `田` ruộng đất).
- **Chữ chứa `耒` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `藉` (`jiè / jí`, Tạ / Tịch — `艹` + `耤`, xếp bộ **Thảo `艹`**): chứa `耤` (`耒 + 昔`, chiếu rơm/cỏ lót), nghĩa là dựa vào, nhờ vào (`jiè`: 凭借/慰藉), hoặc bừa bãi hỗn độn (`jí`: 狼藉).
  - `籍` (`jí`, Tịch — `竹` + `耤`, chứa `耒` trong `耤`, xếp bộ **Trúc `竹`**): sách vở ghi chép trên thẻ tre → sổ sách, hộ tịch, quốc tịch (书籍, 国籍, 户籍).
  - `偶` (`ǒu`, Ngẫu — `亻` + `禺`, xếp bộ **Nhân `人`**): đồng âm, kế thừa nghĩa "cặp đôi" từ chữ `耦` (`耒 + 禺`) (偶尔, 偶像, 偶数).

---

## Bộ 148: 聿 (Duật)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-163` · `radical_index`: `163` · `strokes`: `6` nét · `name_vi`: `bộ Duật` · Khang Hy: `#129` · Dòng trùng/rỗng: Không có.
  - _Lưu ý dữ liệu DB hiện tại:_ Trong snapshot DB, bản ghi `radical-163` đã có sẵn 1 nhóm `groups`: `{"name": "Xây dựng/thiết lập/linh kiện liên quan", "chars": ["建", "肇", "健"]}`. Khi chuẩn hóa cần lưu ý chỉ **`肇`** thực sự xếp bộ `聿` trong Khang Hy, còn **`建`** xếp bộ `廴` và **`健`** xếp bộ `人` (đã chuyển sang Mục 3 để giữ Mục 2 chuẩn theo bộ thủ).
- **Hình thái & Biến thể (`variants`):**
  - `聿` — dạng chính (6 nét: `𠃌 一 一 一 一 丨`), có thể đứng độc lập (`聿`) hoặc đứng bên phải/bên dưới (`肆, 肇, 肄`).
  - `肀` — dạng rút gọn phần chân nét sổ không xuyên qua nét ngang trên cùng (4–6 nét, xuất hiện trong khối cấu tạo của `书/書, 画/畫, 尽/盡, 津, 律, 建`); ngoài ra khi biến dạng trong Khải thư, nét giữa của `聿` còn tạo ra phần đầu trong `唐, 康, 庸` (`肀` biến hình).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình bàn tay (`又/彐`) cầm cây bút lông/que tre nhúng mực để viết lên thẻ tre thời cổ.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Cây bút, việc viết lách và ghi chép (`聿`, gốc của `筆/笔`, `書/书`) → mở rộng sang rèn luyện kỹ năng, học tập (`肄`), sắp đặt bầy biện, buông thả hoặc cửa hàng sách (`肆`), khởi dựng/mở đầu (`肇`), sự trang nghiêm chỉnh tề (`肃/肅`) và quy tắc/pháp luật (`律`, bộ `彳`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `聿` / `肀` thường liên quan đến bút viết, sách vở, học tập, sự thiết lập, trật tự kỷ luật hoặc đóng vai trò linh kiện cấu chữ cổ.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`聿` (Duật — tay cầm bút) vs `耳` (Nhĩ — cái tai):** `聿` có nét ngang dài ở giữa/dưới và nét sổ dọc thẳng cắt xuyên tất cả các nét ngang; `耳` gồm hai nét sổ dọc bao hai nét ngang ngắn bên trong khung.
    - **`筆` (Phồn thể) vs `笔` (Giản thể):** `筆` (`⺮ + 聿`, tay cầm bút làm từ ống trúc) giữ nguyên `聿` rất rõ nghĩa, còn Giản thể `笔` đổi thành `⺮ + 毛` (cán trúc + lông thú).
    - **`建` và `健` chứa `聿` nhưng không xếp bộ `聿`:** `建` (`廴 + 聿`, xây dựng) xếp bộ **Dẫn `廴`**, còn `健` (`亻 + 建`, khỏe mạnh) xếp bộ **Nhân `人`**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bút viết, học tập & bày biện (chữ thuộc bộ `聿`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                |
| :-----: | :----: | :------: | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
|   聿    |   yù   |   Duật   | Đứng độc lập          | Tượng hình bàn tay cầm bút viết cổ; cây bút viết (gốc chữ `笔/筆`), cũng là trợ từ phát ngữ trong Kinh Thi (聿修厥德).                        |
|   肄    |   yì   |    Dị    | `𠤎` + `聿`           | Hội ý: cầm bút (`聿`) luyện viết đi viết lại → tập luyện, đang theo học tại trường (chưa tốt nghiệp) (肄业 `yìyè`, 肄习).                     |
|   肆    |   sì   |    Tứ    | `镸` + `聿`           | Hình thanh/hội ý cổ: phô bày hàng hóa ra hết → bày biện, buông thả bừa bãi, cửa hàng/tiệm sách, số bốn viết hoa tài chính (放肆, 肆意, 书肆). |

### Nhóm B: Khởi dựng & trang nghiêm (chữ thuộc bộ `聿`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                               |
| :-----: | :----: | :------: | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
|   肇    |  zhào  |  Triệu   | `户 + 攵` (`攴`) + `聿`     | Hội ý: tay mở cửa (`户 + 攵`) cầm bút (`聿`) ghi nhận sự khởi đầu → bắt đầu, gây ra, tạo dựng (肇事, 肇始, 肇因).            |
| 肃 / 肅 |   sù   |   Túc    | `肀` + khung chân (`肅` cổ) | Hội ý cổ: tay cầm bút (`聿`) đứng trên vực sâu cẩn trọng → nghiêm trang, kính cẩn, thanh trừng, dọn sạch (严肃, 肃静, 肃清). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`筆 / 笔` (từ DB):** `⺮ + 聿` (`bǐ`, Bút — cái bút, nét chữ; Phồn thể giữ `聿`, xếp bộ **Trúc `竹`**) (毛笔, 笔记).
- **`書 / 书` (từ DB):** `聿 + 曰` (`shū`, Thư — dùng bút ghi lời nói → sách, thư từ, viết; Phồn thể `書` xếp bộ **Viết `曰`**, Giản thể `书` xếp bộ **Ất `乙`**) (书本, 书法).
- **`建` (từ DB):** `廴 + 聿` (`jiàn`, Kiến — xây dựng, thiết lập; xếp bộ **Dẫn `廴`**) (建设, 建筑, 建议).
- **`健` (có trong DB `groups` của `聿`):** `亻 + 建` (`jiàn`, Kiện — khỏe mạnh; mang `建` chứa `聿`, xếp bộ **Nhân `人`**) (健康, 健身).
- **`律` (từ DB):** `彳 + 聿` (`lǜ`, Luật — quy chuẩn viết ra để bước đi theo → luật lệ, quy luật; xếp bộ **Xích `彳`**) (法律, 规律).
- **Chữ thông dụng khác chứa `聿 / 肀` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `画 / 畫` (`huà`, Họa — `田 + 聿` trong Phồn thể `畫`, xếp bộ **Điền `田`**): cầm bút vẽ ranh giới ruộng → vẽ, bức tranh (画画, 画家).
  - `津` (`jīn`, Tân — `氵 + 聿`, xếp bộ **Thủy `水/氵`**): bến đò, nước bọt, trợ cấp (天津, 津贴).
  - `昼 / 晝` (`zhòu`, Trú — `尺 + 日` giản / `聿 + 日` phồn, xếp bộ **Nhật `日`**): ban ngày (昼夜).
  - `尽 / 盡` (`jìn / jǐn`, Tận — Phồn thể `盡` có `聿 + 灬 + 皿`, xếp bộ **Mãnh `皿`**, Giản thể `尽` xếp bộ **Thi `尸`**): hết sạch, dốc hết sức (尽力, 尽量).
  - `唐 / 康 / 庸` (`táng / kāng / yōng` — phần giữa mang nét `肀/聿` biến dạng, lần lượt xếp bộ **Khẩu `口`**, **Nghiễm `广`**).

---

## Bộ 149: 臣 (Thần)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-165` · `radical_index`: `165` · `strokes`: `6` nét · `name_vi`: `bộ Thần` · Khang Hy: `#131` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `臣` — dạng chính duy nhất (6 nét: `一 丨 𠃍 一 丨 ∟`), đứng độc lập (`臣`), đứng bên trái (`卧, 临`), hoặc bên phải (`臧`), và làm linh kiện phía trên/góc trái nhiều chữ ghép khác (`坚, 贤, 紧, 肾, 览, 鉴, 盐`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Giáp cốt văn vẽ hình **con mắt mở dọc** khi người bề tôi cúi đầu nhìn xuống tỏ lòng quy phục trước quân vương.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Bề tôi, quan thần, người dưới quyền, phục tùng (`臣`) → tư thế cúi xuống/nằm nghỉ hoặc từ trên cao nhìn xuống/đối mặt (`卧` nằm, `临` đến gần/nhìn xuống) → làm linh kiện gốc trong khối `臤` (kéo chặt, bền vững) và `𦣞` (nhìn xuống xem xét) ở hàng loạt chữ hiện đại (`坚, 贤, 紧, 览, 鉴`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `臣` có thể liên quan đến quan thần, bề tôi, tư thế cúi/nằm, nhìn xuống hoặc cai quản; tuy nhiên trong chữ hiện đại `臣` xuất hiện cực nhiều như một linh kiện hình/cấu tạo ở góc trái trên.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`臣` (Thần — 6 nét) vs `目` (Mục — 5 nét):** Dù cùng gốc tượng hình con mắt, `臣` quay dọc với khung mở nét gập bên phải và có ngăn `口` nhỏ ở giữa; `目` là khung đóng kín 4 cạnh.
    - **`臣` vs `匚 / 匸` (Phương / Hệ):** Khung chữ `臣` có ô `口` lồng bên trong vách trái-phải và nét ngang trên-dưới hoàn chỉnh, không phải khung rỗng 3 cạnh `匚`.
    - **`臨` (Phồn thể) vs `临` (Giản thể):** Phồn thể `臨` giữ trọn bộ `臣` bên trái (Khang Hy xếp bộ `臣`), còn Giản thể `临` giản lược thành hai nét sổ `〢` ở bên trái (Tân Hoa xếp bộ **Cổn `丨`**).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bề tôi, nằm nghỉ & đến gần nhìn xuống

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                               |
| :-----: | :----: | :------: | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   臣    |  chén  |   Thần   | Đứng độc lập              | Tượng hình con mắt cúi nhìn xuống tỏ lòng thần phục; bề tôi, quan lại thời phong kiến (大臣, 君臣, 忠臣).                                                    |
| 卧 / 臥 |   wò   |   Ngọa   | `臣` + `卜` (`人` cổ)     | Hội ý: người (`人` trong `臥`, giản thành `卜` trong `卧`) cúi rạp xuống nghỉ (`臣`) → nằm xuống, nằm nghỉ (卧室, 卧铺, 仰卧起坐).                           |
| 临 / 臨 |  lín   |   Lâm    | `臣` + `人` + `品` (`臨`) | [Phồn thể `臨` xếp bộ `臣`; Giản thể `临` xếp bộ `丨`] Từ trên cao cúi nhìn xuống (`臣`) nhiều đồ vật (`品`) → đến nơi, đối mặt, sắp sửa (临时, 面临, 临近). |

### Nhóm B: Chữ cổ & linh kiện gốc thuộc bộ `臣`

| Chữ Hán |   Pinyin    |   Hán Việt   | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                          |
| :-----: | :---------: | :----------: | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
|   臧    |    zāng     |     Tang     | `戈 + 爿` + `臣`      | Hình thanh: phần ngoài `爿 + 戈` (`qiāng`, thanh phù) + `臣`; tốt lành, khen ngợi (thành ngữ: 否臧 `pǐzāng` tốt xấu/khen chê); họ Tang. |
|   臤    | qiān / xián | Khang / Hiền | `臣` + `又`           | Hội ý cổ: bàn tay (`又`) nắm giữ chắc (`臣`) → cứng rắn, bền chặt; là khối gốc tạo nên hàng loạt chữ thông dụng (`坚, 贤, 紧, 肾, 竖`). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`目` & `匚 / 匸` (từ DB):** Bộ thủ riêng (`目` con mắt; `匚/匸` khung hộp che đậy).
- **Chữ thông dụng chứa `臣` (hoặc khối `臤 / 𦣞`) ở vị trí phụ nhưng xếp ở bộ khác:**
  - `坚 / 堅` (`jiān`, Kiên — `臤` + `土`, xếp bộ **Thổ `土`**): đất đá cứng chắc → kiên cố, kiên trì (坚持, 坚强, 坚定).
  - `贤 / 賢` (`xián`, Hiền — `臤` + `贝`, xếp bộ **Bối `貝/贝`**): người hiền tài đức độ (贤惠, 圣贤).
  - `紧 / 緊` (`jǐn`, Khẩn — `臤` + `糸`, xếp bộ **Mịch `糸`**): buộc dây siết chặt → căng, gấp gáp, chặt chẽ (紧张, 赶紧, 要紧).
  - `肾 / 腎` (`shèn`, Thận — `臤` + `月`, xếp bộ **Nhục `肉/⺼`**): quả thận (tạng trong cơ thể) (肾脏).
  - `竖 / 豎` (`shù`, Thụ — `臤` + `立`, xếp bộ **Lập `立`**): dựng thẳng đứng (竖立, 横竖).
  - `览 / 覽` (`lǎn`, Lãm — Phồn thể `覽` có `臣`, Giản thể thay bằng `〢`, xếp bộ **Kiến `見/见`**): ngắm nhìn, xem xét (展览, 浏览).
  - `鉴 / 鑑` (`jiàn`, Giám — Phồn thể `鑑` có `臣`, Giản thể dùng `〢`, xếp bộ **Kim `金`**): soi gương, xem xét, làm bài học (鉴定, 借鉴).
  - `盐 / 鹽` (`yán`, Diêm — Phồn thể `鹽` có `臣` trên `皿`, xếp bộ **Mãnh `皿`**): muối ăn (食盐, 盐水).
  - `藏` (`cáng / zàng`, Tàng / Tạng — `艹` + `臧`, chứa `臣`, xếp bộ **Thảo `艹`**): ẩn giấu, kho tàng (收藏, 西藏).
  - `宦` (`huàn`, Hoạn — `宀` + `臣`, xếp bộ **Miên `宀`**): quan lại trong cung, hoạn quan (宦官, 官宦).
  - `姬` (`jī`, Cơ — `女` + `𦣞`, chứa `臣`, xếp bộ **Nữ `女`**): mỹ nhân, họ Cơ, công chúa (霸王别姬).
  - `卧 / 临` (`wò / lín`): đã giải nghĩa ở mục 2.

---

## Bộ 150: 自 (Tự)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-085` · `radical_index`: `85` · `strokes`: `6` nét · `name_vi`: `bộ Tự` · Khang Hy: `#132` · **Dòng trùng/rỗng:** Có dòng trùng rỗng **`radical-166`** (`radical_index`: `166`, `radical`: `"自"`, `name_vi: null`, `strokes: null`, `core_meaning: {}`) cần dọn/gộp khi chuẩn hóa DB.
- **Hình thái & Biến thể (`variants`):**
  - `自` — dạng chính duy nhất (6 nét: `ノ 丨 𠃍 一 一 一`); đứng độc lập (`自`), đứng **bên trên** (`臭, 臬, 息, 鼻`), hoặc nằm trong cấu chữ phức (`咱, 嗅, 皆` — trong `皆` phần trên là `比`, còn dưới là `白`, chú ý không nhầm!).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cái mũi** nhìn chính diện (sống mũi và lỗ mũi). Trong văn hóa Trung Hoa xưa (cũng như động tác chỉ tay vào mũi khi nói "chính tôi"), cái mũi trở thành ký hiệu chỉ **"bản thân, tự mình"**, sau đó chữ `鼻` (`自 + 畀`) mới được tạo thêm để chuyên chỉ bộ phận cái mũi.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Tự mình, bản thân, tự nhiên, tự động, xuất phát từ (`自己, 自然, 自动, 来自`) → lưu dấu nghĩa gốc "cái mũi / ngửi" trong chữ `臭` (mùi/ngửi), `鼻` (mũi), `息` (hơi thở qua mũi), `嗅` (ngửi) → mở rộng sang cột mốc/chuẩn mực (`臬`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `自` thường liên quan đến bản thân/tự mình trong từ hiện đại (`自己, 自由, 自信`), hoặc mang dấu vết cổ về mũi, hơi thở và khứu giác (`臭, 息, 鼻, 嗅`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`自` (Tự — 6 nét) vs `白` (Bạch — 5 nét) vs `目` (Mục — 5 nét):** Đây là bộ ba cực dễ nhầm ở số nét ngang và nét phẩy trên đỉnh!
      - **`自` (6 nét: `ノ 丨 𠃍 一 一 一`)**: **CÓ nét phẩy `ノ` trên đỉnh** và có **2 nét ngang bên trong** khung (chia lòng chữ thành 3 ô trống).
      - **`白` (5 nét: `ノ 丨 𠃍 一 一`)**: **CÓ nét phẩy `ノ` trên đỉnh** nhưng chỉ có **1 nét ngang bên trong** khung (chia lòng chữ thành 2 ô trống) — nghĩa là "màu trắng" (`白色, 明白`).
      - **`目` (5 nét: `丨 𠃍 一 一 一`)**: **KHÔNG có nét phẩy `ノ` trên đỉnh**, đầu khung phẳng và có **2 nét ngang bên trong** — nghĩa là "con mắt" (`眼睛, 目标`).
    - **`自` vs `百` (Bách — 6 nét):** `百` (`一 + 白`) có nét ngang dài nằm trên cùng phủ qua đầu chữ `白`, không phải nét phẩy của `自`.
    - **`自` vs `鼻` (Tỵ):** `自` trong tiếng Trung hiện đại hầu như chỉ dùng với nghĩa "tự mình / từ" (`自己, 来自`), còn danh từ "cái mũi" phải dùng `鼻` (`鼻子`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bản thân, khứu giác & chuẩn mực (chữ thuộc bộ `自`)

| Chữ Hán |   Pinyin   | Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                        |
| :-----: | :--------: | :-------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
|   自    |     zì     |    Tự     | Đứng độc lập          | Tượng hình cái mũi, giả tá làm "tự mình"; bản thân, tự thân, tự nhiên, từ (mốc xuất phát) (自己, 自然, 自动, 来自).                                   |
|   臭    | chòu / xiù | Xú / Khứu | `自` + `犬`           | Hội ý: chó (`犬`) dùng mũi (`自`) đánh hơi → ngửi (`xiù`: 乳臭未干); mùi khó chịu, hôi thối (`chòu`: 臭味, 臭氧, 臭名远扬).                           |
|   臬    |    niè     |   Niết    | `自` + `木`           | Hội ý cổ: cọc gỗ (`木`) dựng thẳng làm bia bắn hay cột đo bóng nắng (`自` là mục tiêu chính giữa) → chuẩn mực, quy tắc, quan án xưa (圭臬, 奉为圭臬). |

### Nhóm B: Chữ cổ thuộc bộ `自`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                             |
| :-----: | :----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
|   臲    |  niè   |   Niết   | `自` + `兀`           | Hình thanh/hội ý cổ: chỉ trạng thái chênh vênh, bất ổn, lung lay (hay dùng trong từ láy cổ `臲卼` `nièwù`, nguy nan bất an).               |
|   臯    |  gāo   |   Cao    | `自` + `夲`           | Dạng cổ của chữ `皋` (xếp bộ `自` trong Khang Hy, nay chuẩn hiện đại viết `皋` xếp bộ `白`); gò đất cao bên bờ nước, đầm lầy (皋陶, 汉皋). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`息` (từ DB):** `自 + 心` (`xī`, Tức — hơi thở qua mũi `自` đi xuống tim `心` → hơi thở, nghỉ ngơi, tin tức, tiền lãi; xếp bộ **Tâm `心`**) (休息, 消息, 信息).
- **`鼻` (từ DB):** `自 + 畀` (`bí`, Tỵ — `自` biểu nghĩa cái mũi + `畀` biểu âm `bì` → cái mũi; là **bộ thủ riêng** #209 Khang Hy) (鼻子, 鼻音).
- **`白` & `目` (từ DB):** Bộ thủ riêng, cực dễ nhầm hình dáng khung chữ nhật với `自`.
- **Chữ thông dụng khác chứa `自` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `嗅` (`xiù`, Khứu — `口` + `臭`, chứa `自`, xếp bộ **Khẩu `口`**): hít ngửi bằng mũi (嗅觉, 轻嗅).
  - `咱` (`zán / zá`, Tán — `口` + `自`, xếp bộ **Khẩu `口`**): chúng ta, tôi (khẩu ngữ miền Bắc Trung Quốc) (咱们, 咱俩).
  - `首` (`shǒu`, Thủ — bộ thủ riêng #185): đầu, đứng đầu; phần dưới là `自` (trên là nét tóc/sừng).
  - `道` (`dào`, Đạo — `辶` + `首`, xếp bộ **Sước `辶`**): con đường, đạo lý (道路, 知道).

---

## Bộ 151: 至 (Chí)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-167` · `radical_index`: `167` · `strokes`: `6` nét · `name_vi`: `bộ Chí` · Khang Hy: `#133` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `至` — dạng chính duy nhất (6 nét: `一 𠃋 丶 一 丨 一`); đứng độc lập (`至`), đứng **bên trái** (`到, 致` — nét ngang đáy chuyển thành nét hất nhẹ `㇀`), hoặc nằm **bên dưới / bên phải** trong chữ ghép (`室, 屋, 窒, 倒, 侄, 臺, 臻`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Giáp cốt văn vẽ hình **con chim** hoặc **mũi tên** bay chúc đầu cắm xuống chạm tới mặt đất (`一`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Đi tới đích, đến nơi (`至, 到`) → đưa đẩy, dẫn đến kết quả, gửi gắm hoặc đạt độ tinh xảo (`致, 臻`) → nơi con người đi đến dừng chân cư trú (`室` phòng, `屋` nhà, `臺` đài cao) → chạm tới mức tối đa/cực điểm (`甚至, 至少, 冬至`) → đồng thời đóng vai trò thanh phù `zhì / dào` trong nhiều chữ ghép (`侄, 倒, 窒`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `至` thường liên quan đến việc đi đến, đạt tới, cực điểm, nơi dừng chân (phòng, nhà) hoặc đóng vai trò phần âm `zhì / dào / shì`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`至` vs `到` vs `致`:**
      - **`至`** là bộ thủ gốc (6 nét), trong tiếng Trung hiện đại thiên về văn viết, liên từ và phó từ mức độ (`至于, 至少, 甚至, 冬至`).
      - **`到`** (`至 + 刂`, xếp bộ **Đao `刀/刂`**) là động từ khẩu ngữ thông dụng nhất nghĩa "đến, tới, đạt được" (`到达, 看到, 迟到`).
      - **`致`** (`至 + 攵`, xếp bộ **Chí `至`**) có phạm vi nghĩa rộng: đưa tới/gửi (`致敬, 致电`), dẫn đến (`导致`), nhất quán (`一致`), tinh tế (`细致`).
    - **`至` vs `圣`:** Tránh nhầm phần đáy chữ `轻, 经, 劲` là `至` — các chữ này dùng `圣` (4 nét giản thể thay `巠`), **không phải `至`** (6 nét).
    - **`室` và `屋` mang `至` nhưng không xếp bộ `至`:** `室` (`宀 + 至`, phòng) xếp bộ **Miên `宀`**; `屋` (`尸 + 至`, nhà/phòng) xếp bộ **Thi `尸`**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Đi tới, gửi đến & đạt tới cực điểm (chữ thuộc bộ `至`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                |
| :-----: | :----: | :------: | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
|   至    |  zhì   |   Chí    | Đứng độc lập            | [Tra bộ 至] Tượng hình mũi tên/chim bay chạm đất; đến, tới, cực điểm, rất, tiết chí (甚至, 至于, 至少, 冬至).                                 |
|   致    |  zhì   |   Trí    | `至` + `攵`             | [Tra bộ 至] Hội ý: đưa đến (`至`) bằng hành động/tác động (`攵`) → gửi lời, dẫn đến, đạt tới mức tinh tế, nhất quán (导致, 一致, 细致, 致敬). |
| 台 / 臺 |  tái   |   Đài    | `吉 + 冖` + `至` (`臺`) | [Phồn thể `臺` xếp bộ `至`; Giản thể `台` xếp bộ `口`] Nền đất đắp cao vươn tới tầm nhìn → bệ đài, sân khấu, trạm, đài (平台, 舞台, 台湾).    |
|   臻    |  zhēn  |   Trăn   | `至` + `秦`             | [Tra bộ 至] Hình thanh: `至` (đạt tới) + `秦` (`qín`, thanh phù); tiến tới, đạt đến mức độ hoàn mỹ/cao nhất (日臻完善, 渐臻佳境).             |

### Nhóm B: Đến nơi, ngã đổ, bế tắc & cầm nắm (chữ chứa `至` tra bộ khác)

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                   |
| :-----: | :-------: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
|   到    |    dào    |   Đáo    | `至` + `刂`           | [Tra bộ 刀/刂, chứa `至`] Hình thanh kiêm hội ý: `至` (đến) + `刂` (con dao, âm cổ gần hoặc ranh giới) → đến nơi, đạt được (到达, 看到, 做到).   |
|   倒    | dǎo / dào |   Đảo    | `亻` + `到` (`至`)    | [Tra bộ 人, chứa `至`] Hình thanh: `亻` (người) + `到` (`dào`, thanh phù); ngã xuống chạm đất (`dǎo`: 摔倒); lật ngược, rót (`dào`: 倒水, 倒车). |
|   窒    |    zhì    |   Trất   | `穴` + `至`           | [Tra bộ 穴, chứa `至`] Hình thanh kiêm hội ý: hang lỗ (`穴`) bị bít tới tận cùng (`至`, thanh phù `zhì`) → ngạt thở, tắc nghẽn (窒息).           |
|   握    |    wò     |    Ác    | `扌` + `屋` (`至`)    | [Tra bộ 手, chứa `屋/至`] Hình thanh: `扌` (tay) + `屋` (`wū`, thanh phù); nắm chặt trong tay, bắt tay (握手, 把握, 掌握).                       |

### Nhóm C: Nhà cửa, thân phận & công cụ (chữ chứa `至` tra bộ khác)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                           |
| :-----: | :----: | :------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
|   室    |  shì   |   Thất   | `宀` + `至`           | [Tra bộ 宀, chứa `至`] Hội ý: nơi có mái nhà (`宀`) mọi người tìm đến (`至`) nghỉ ngơi → căn phòng, gian phòng (教室, 卧室, 办公室).     |
|   屋    |   wū   |    Ốc    | `尸` + `至`           | [Tra bộ 尸, chứa `至`] Hội ý: mái lều/thân người (`尸`) dừng bước đến ở (`至`) → ngôi nhà, căn phòng (房屋, 屋子, 屋顶).                 |
|   侄    |  zhí   |   Điệt   | `亻` + `至`           | [Tra bộ 人, chứa `至`] Hình thanh: `亻` (người) + `至` (`zhì`, thanh phù); cháu trai/cháu gái (con của anh chị em) (侄子, 侄女).         |
|   桎    |  zhì   |   Chất   | `木` + `至`           | [Tra bộ 木, chứa `至`] Hình thanh: `木` (gỗ) + `至` (`zhì`, thanh phù); gông cùm bằng gỗ khóa chân, sự trói buộc kìm hãm (桎梏 `zhìgù`). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`到, 室, 侄` (từ DB):** Đều mang `至` ở vị trí thành phần nghĩa hoặc thanh phù, lần lượt xếp ở bộ **Đao `刀/刂`**, **Miên `宀`**, **Nhân `人`** (đã giải nghĩa ở mục 2).
- **`土` (từ DB):** Bộ thủ riêng, tạo thành phần đáy của `至` khi nhìn bằng mắt thường.
- **Chữ chứa `至` khác xếp ở bộ khác & cảnh báo dễ nhầm:**
  - `蛭` (`zhì`, Điệt — `虫` + `至`, xếp bộ **Trùng `虫`**): con đỉa (水蛭).
  - `絰 / 绖` (`dié`, Điệt — `糸` + `至`, xếp bộ **Mịch `糸`**): khăn tang bằng vải gai (từ cổ).
  - `轻 / 经 / 劲` (`qīng / jīng / jìn`): phần bên phải/trái là `圣` (4 nét), **KHÔNG chứa bộ `至`** (đừng nhầm nét gập với `至`).

---

## Bộ 152: 臼 (Cữu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-168` · `radical_index`: `168` · `strokes`: `6` nét · `name_vi`: `bộ Cữu` · Khang Hy: `#134` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `臼` — dạng chính (6 nét: `ノ 丨 一 𠃌 一 一`, chú ý **hai nét ngang bên trong không chạm nhau ở giữa**, khác với `白` và `日`); đứng độc lập (`臼`) hoặc đứng bên dưới/trên (`舀, 舂, 舅, 臾`).
  - `𦥑` (Cúc — 2 tay chụm lại): Trong chữ ghép cổ và Phồn thể (`興, 舉, 與, 學, 覺`), nét hai bên mở giống `臼` thực chất là hình **hai bàn tay cùng nâng đỡ (`𦥑`)**, Khang Hy thường gộp tra cứu vào bộ `臼`.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cái cối giã gạo** đục lõm bằng đá hoặc gỗ (hai bên miệng cối có các vạch răng khía vào lòng cối).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Cái cối giã, khớp xương lõm như lòng cối (`臼, 臼齿, 脱臼`) → động tác giã và múc từ cối/bình chứa (`舂` giã gạo, `舀` múc nước) → mượn âm trong chữ chỉ thân tộc (`舅` cậu) → trong chữ Phồn thể còn biểu thị hai bàn tay nâng lên (`與/与`, `興/兴`, `舉/举`) và tên loài chim cổ (`舊/旧`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `臼` có thể gợi cái cối, hốc lõm, động tác múc/giã (`舀, 舂, 陷`), nhưng ở nhiều chữ hiện đại (`舅`, và nhóm chữ giản hóa từ Phồn thể) `臼` chỉ là thanh phù hoặc linh kiện cổ.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`臼` (Cữu — 6 nét) vs `白` (Bạch — 5 nét) vs `日` (Nhật — 4 nét):** Nét ngang ở giữa của `臼` **bị ngắt làm đôi ở chính giữa** (`一` trái và `一` phải tách rời nhau), biểu thị thành cối rỗng lòng; trong khi `白` và `日` có nét ngang nối liền một mạch.
    - **`臼` vs `皿` (Mãnh):** `臼` là **cái cối giã** lòng sâu (hoặc bàn tay chụm); `皿` là **chén, đĩa, khay đựng** miệng rộng (`盆, 盘`).
    - **`舅` (`jiù`, cậu):** Chỉ mượn `臼` làm **thanh phù** (`jiù`) ghép với `男` (đàn ông), **không** đoán nghĩa "cậu" từ cái cối.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cối giã, múc nước & thân tộc (chữ thuộc bộ `臼` chuẩn)

| Chữ Hán | Pinyin |  Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                 |
| :-----: | :----: | :--------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
|   臼    |  jiù   |    Cữu     | Đứng độc lập          | Tượng hình cái cối giã; cái cối, khớp xương tròn lõm, răng hàm (石臼, 脱臼, 臼齿).                                             |
|   舀    |  yǎo   | Diểu / Yểu | `爫` + `臼`           | Hội ý: bàn tay/gáo (`爫`) múc chất lỏng từ trong cối/chậu (`臼`) → múc, tát (舀水, 舀汤, 舀一勺).                              |
|   舂    | chōng  |   Thung    | `𡗗` + `臼`           | Hội ý: hai bàn tay cầm chày (`𡗗`) giã xuống lòng cối (`臼`) → giã gạo, đâm giã (舂米, 舂药).                                  |
|   舅    |  jiù   |    Cữu     | `臼` + `男`           | Hình thanh: `臼` (`jiù`, thanh phù) + `男` (đàn ông); anh em trai của mẹ (cậu), bố chồng hoặc anh em vợ (舅舅, 大舅, 姑舅).    |
|   臾    |   yú   |     Du     | `𦥑` (`臼`) + `人`    | Hội ý cổ: hai tay nắm kéo; trong tiếng Trung hiện đại chỉ dùng trong từ chỉ khoảng thời gian rất ngắn (须臾 `xūyú`, chốc lát). |

### Nhóm B: Chữ thông dụng xếp bộ `臼` ở dạng Phồn thể (Khang Hy)

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                       |
| :-----: | :-----: | :------: | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 旧 / 舊 |   jiù   |   Cựu    | `艹 + 隹` + `臼` (`舊`) | [Phồn thể `舊` xếp bộ `臼`; Giản thể `旧` xếp bộ `丨`] Gốc vẽ con chim cú trên cỏ + `臼` (âm `jiù`), mượn nghĩa cũ kỹ, xưa (旧书, 依然/依旧, 怀旧).  |
| 与 / 與 | yǔ / yù |    Dữ    | `𦥑` + `与` (`與`)      | [Phồn thể `與` xếp bộ `臼`; Giản thể `与` xếp bộ `一`] Hai đôi tay cùng trao/nhận vật → trao cho, cùng với (`yǔ`: 与其, 给与), tham dự (`yù`: 参与). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`舀, 舅` (từ DB):** Thuộc trực tiếp bộ Cữu `臼` (đã giải nghĩa ở mục 2).
- **`皿` & `米` (từ DB):** Bộ thủ riêng (`皿` đồ đựng miệng rộng; `米` hạt gạo).
- **Chữ Phồn thể dùng khối `𦥑/臼` xếp bộ `臼` trong Khang Hy (Giản thể đổi bộ khác):**
  - `兴 / 興` (`xīng / xìng`, Hưng / Hứng — Phồn thể `興` xếp bộ **Cữu `臼`**, Giản thể `兴` xếp bộ **Bát `八`**): hưng thịnh, phấn khởi (高兴, 兴趣).
  - `举 / 舉` (`jǔ`, Cử — Phồn thể `舉` xếp bộ **Cữu `臼`**, Giản thể `举` xếp bộ **Chủ `丶`**): giơ lên, cử hành, bầu chọn (举手, 举行).
  - `舆 / 輿` (`yú`, Dư — `𦥑 + 車 + 八`, xếp bộ **Xa `車/车`**): xe ngựa, dư luận (舆论).
- **Chữ chứa `臼` (hoặc `臽 = 𠂊 + 臼`, cái hố) ở vị trí phụ nhưng xếp ở bộ khác:**
  - `插` (`chā`, Sáp — `扌` + `千` + `臼`, xếp bộ **Thủ `扌`**): cắm cái chày vào cối → cắm vào, xen vào (插花, 插嘴, 插头).
  - `稻` (`dào`, Đạo — `禾` + `爫 + 臼`, xếp bộ **Hòa `禾`**): cây lúa (gặt đập giã cối) (水稻, 稻谷).
  - `陷` (`xiàn`, Hãm — `阝` + `臽`, xếp bộ **Phụ `阜/阝`**): rơi xuống hố như lòng cối → sụt lún, rơi vào bẫy, khiếm khuyết (陷害, 缺陷, 沦陷).
  - `焰` (`yàn`, Diệm — `火` + `臽`, xếp bộ **Hỏa `火`**): ngọn lửa bốc lên (火焰, 气焰).
  - `鼠` (`shǔ`, Thử — bộ thủ riêng #208): con chuột (đầu chuột viết giống `臼`).
  - `儿 / 兒` (`ér`, Nhi — Giản thể `儿` bộ `儿`, Phồn thể `兒` có đầu `臼` xếp bộ `儿`): trẻ em, con (儿子, 儿童).

---

## Bộ 153: 舌 (Thiệt)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-081` · `radical_index`: `81` · `strokes`: `6` nét · `name_vi`: `bộ Thiệt` · Khang Hy: `#135` · **Dòng trùng/rỗng:** Có dòng trùng rỗng **`radical-169`** (`radical_index`: `169`, `radical`: `"舌"`, `name_vi: null`, `strokes: null`, `core_meaning: {}`) cần dọn/gộp khi chuẩn hóa DB.
- **Hình thái & Biến thể (`variants`):**
  - `舌` — dạng chính duy nhất (6 nét: `ノ 一 丨 丨 𠃌 一`), gồm `千` (lưỡi thò ra) + `口` (miệng); đứng độc lập (`舌`), đứng **bên trái** (`甜, 辞, 乱, 敌`), hoặc **bên phải** (`活, 话, 括, 刮, 适`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cái lưỡi** thè ra khỏi khoang miệng (`口`) có nét chẻ ở đầu lưỡi.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Cái lưỡi, bộ phận phát âm và vị giác trong miệng (`舌, 舐, 舔`) → nếm vị ngọt ngào (`甜`) → thư thái dễ chịu (`舒`, vốn từ `舍`) → mở rộng sang lời nói, ngôn từ (`辞`, `话`) và khối hình `舌` trong nhiều chữ hiện đại (`活, 刮, 括, 乱`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `舌` thường liên quan đến lưỡi, liếm, nếm vị (`甜, 舔, 舐`) hoặc ngôn từ (`话, 辞`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`舌` (lưỡi) vs `口` (miệng) vs `言 / 讠` (lời nói):** `舌` chỉ bộ phận cái lưỡi và vị giác; `口` là miệng; `言/讠` là lời nói, ngôn ngữ.
    - **`舌` vs `千 + 口` vs `古` (`十 + 口`):** `舌` có nét đầu là **nét phẩy nghiêng `ノ`** đặt trên ngang (`千 + 口`); còn `古` (xưa cũ, bộ `口`) là **nét ngang + sổ thẳng `十`** trên `口` (không có nét phẩy đầu).
    - **Lưu ý cổ tự học với nhóm `话, 活, 括, 刮, 适, 敌`:** Về mặt hình chữ Khải hiện đại, bên phải các chữ này viết giống hệt `舌`; nhưng trong cổ tự, phần `舌` của `活, 括, 适` thực chất biến dạng từ `𠯑` (lưỡi/cái xẻng/thanh phù `kuò`), còn `话` (Phồn `話`) lại lấy `舌` (cái lưỡi phát âm) ghép với `言`. Với người học, nhớ theo dấu hiệu hình `舌` kèm lưu ý phân biệt bộ tra cứu chính (`讠`, `氵`, `扌`, `刂`, `辶`, `攵`) là hợp lý nhất.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cái lưỡi, nếm vị & cảm giác thư thái (chữ thuộc bộ `舌`)

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                  |
| :-----: | :-------: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
|   舌    |    shé    |  Thiệt   | Đứng độc lập          | [Tra bộ 舌] Tượng hình cái lưỡi thè khỏi miệng; lưỡi, bộ phận hình lưỡi, lời lẽ (舌头, 口舌, 舌尖).                                             |
|   舐    |    shì    |   Thỉ    | `舌` + `氏`           | [Tra bộ 舌] Hình thanh: `舌` (lưỡi) + `氏` (`shì`, thanh phù); dùng lưỡi liếm (舐犊情深 `shìdú-qíngshēn`, tình thương con sâu sắc).             |
|   舔    |   tiǎn    |  Thiểm   | `舌` + `忝`           | [Tra bộ 舌] Hình thanh: `舌` (lưỡi) + `忝` (`tiǎn`, thanh phù); dùng lưỡi liếm nhẹ (舔一舔, 舔嘴唇).                                            |
|   甜    |   tián    |   Điềm   | `舌` + `甘`           | [Tân Hoa xếp bộ 舌; Khang Hy xếp bộ 甘] Hội ý: lưỡi (`舌`) nếm vị ngon ngọt (`甘`) → ngọt ngào, dễ chịu, ngủ ngon (甜蜜, 甜美, 香甜).           |
|   舍    | shě / shè | Xả / Xá  | `人` + `舌` (`𠯑` cổ) | [Tra bộ 舌] Cổ tự là nhà lợp mái tranh, Khải biến giống `人 + 舌`; nhà ở, lều quán (`shè`: 宿舍, 舍友); buông bỏ, cho đi (`shě`: 舍不得, 舍弃). |
|   舒    |    shū    |   Thư    | `舍` + `予`           | [Tra bộ 舌] Hình thanh: `舍` (`shě`) + `予` (`yú`, thanh phù); duỗi thẳng ra, thoải mái, thư giãn, khoan thai (舒服, 舒适, 舒展).               |

### Nhóm B: Ngôn từ, rối loạn & chữ Giản thể xếp vào bộ `舌`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                 |
| :-----: | :----: | :------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 辞 / 辭 |   cí   |    Từ    | `舌` + `辛` (`辞`)    | [Tân Hoa xếp bộ 舌; Phồn thể `辭` xếp bộ 辛] Lời nói (`舌` trong dạng giản) bày tỏ rõ ràng → lời từ, từ biệt, từ chức (辞职, 修辞, 告别/辞行). |
| 乱 / 亂 |  luàn  |   Loạn   | `舌` + `乚` (`乱`)    | [Tân Hoa xếp bộ 舌; Khang Hy xếp bộ 乙] Giản thể thay phần gỡ tơ rối cổ thành `舌 + 乚`; rối bời, lộn xộn, hỗn loạn (乱七八糟, 混乱, 捣乱).    |

### Nhóm C: Chữ thông dụng mang hình thái `舌` ở vị trí thành phần (tra bộ khác)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                              |
| :-----: | :----: | :------: | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
|   话    |  huà   |  Thoại   | `讠` + `舌` (Phồn: `話`) | [Tra bộ 言/讠, chứa `舌`] Hội ý: lời nói (`讠`) phát ra từ đầu lưỡi (`舌`) → lời nói, câu chuyện, ngôn ngữ (说话, 电话, 普通话).            |
|   活    |  huó   |   Hoạt   | `氵` + `舌` (`𠯑` cổ)    | [Tra bộ 水/氵, chứa hình `舌`] Hình thanh: `氵` (nước chảy) + `𠯑` (`kuò`, thanh phù); sống động, sinh hoạt, công việc (生活, 活动, 干活).  |
|   括    |  kuò   |   Quát   | `扌` + `舌` (`𠯑` cổ)    | [Tra bộ 手/扌, chứa hình `舌`] Hình thanh: `扌` (tay) + `𠯑` (`kuò`, thanh phù); buộc túm lại → bao gồm, tổng quát (包括, 概括, 括号).      |
|   刮    |  guā   |   Quát   | `舌` (`𠯑`) + `刂`       | [Tra bộ 刀/刂, chứa hình `舌`] Hình thanh: `𠯑` (thanh phù) + `刂` (dao); cạo gọt bằng dao, thổi mạnh (gió) (刮风, 刮胡子).                 |
|   敌    |   dí   |   Địch   | `舌` + `攵` (Phồn: `敵`) | [Tra bộ 攴/攵, chứa hình `舌`] Giản thể dùng `舌` thay khối `啇` bên trái Phồn thể `敵`; kẻ thù, đối thủ, chống lại (敌人, 对敌, 势均力敌). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`甜, 话 / 話, 乱 / 亂` (từ DB):** Đã phân tích nguồn gốc và bộ tra cứu cụ thể ở mục 2.
- **`口` & `言 / 讠` (từ DB):** Bộ thủ riêng liên quan miệng (`口`) và lời nói (`言/讠`).
- **Chữ chứa `舌` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `适 / 適` (`shì`, Thích — `辶` + `舌`, xếp bộ **Sước `辵/辶`**): thích hợp, vừa vặn (Giản thể mượn chữ cổ `适` dùng `舌` thay `啇` ở Phồn thể `適`) (合适, 适应).
  - `阔 / 闊` (`kuò`, Khoát — `门` + `活`, chứa hình `舌`, xếp bộ **Môn `門/门`**): rộng rãi, khoáng đạt (广阔, 辽阔).
  - `憩` (`qì`, Khế — `舌 + 自` trên + `心` dưới, xếp bộ **Tâm `心`**): nghỉ ngơi (休憩, 小憩).
  - `刮 / 括 / 活 / 敌`: đã giải nghĩa ở mục 2 (Nhóm C).

---

## Bộ 154: 舛 (Suyễn)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-170` · `radical_index`: `170` · `strokes`: `6` nét · `name_vi`: `bộ Suyễn` · Khang Hy: `#136` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `舛` — dạng chính duy nhất (6 nét: `ノ ㇇ 丶 一 ㇆ 丨`), gồm `夕` (biến thể cổ của bàn chân hướng trái) + `㐄` (bàn chân hướng phải); đứng độc lập (`舛`) hoặc nằm **phía dưới** chữ ghép (`舞, 舜, 桀, 粼`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **hai bàn chân quay ngược chiều nhau** (một bàn chân bước sang trái, một bàn chân bước sang phải).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Hai bàn chân hướng ngược chiều nhau → **trái ngược, sai lệch, lộn xộn, trắc trở** (`舛`) → hai bàn chân nhảy nhịp đối xứng hai bên khi **múa** (`舞`) → tên riêng vua Thuấn / loài hoa (`舜`) và linh kiện cổ (`舝`). Bộ `舛` có rất ít chữ đứng bộ chính, chủ yếu gặp trong `舞` và làm linh kiện ở đáy các chữ ghép khác (`瞬, 桀, 磷, 鳞`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Gặp `舛` ở phần dưới chữ có thể gợi hình đôi bàn chân múa (`舞`) hoặc chuyển động đối chéo; nhưng ở hầu hết chữ phổ thông (`瞬, 邻, 磷`), nó chỉ còn đóng vai trò linh kiện hình/âm trong khối phức tạp hơn.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`舛` (6 nét) vs `止` (Chỉ — 4 nét) vs `足` (Túc — 7 nét):** `止` là một bàn chân/dừng lại; `足` là cả cẳng và bàn chân; `舛` là hai bàn chân hướng **ngược chiều nhau** (khi viết tách thành phần trái giống `夕`, phần phải là nét ngang–gập–sổ `㐄` có 3 nét).
    - **`舞` (`wǔ`, múa):** Chữ quan trọng nhất của bộ `舛` — phần trên là hình người cầm chùm lông/cành hoa tay xòe ra, phần dưới là đôi chân `舛` đang bước nhịp (`跳舞, 舞蹈, 鼓舞`).
    - **Không nhầm phần phải `舛` với `牛`:** Phần phải của `舛` gồm `一 ㇆ 丨` (nét gập khuyết không đóng ngang đáy và có nét sổ xuyên dọc), đọc là `㐄` (dạng bàn chân ngược của `止/夊`), khác với `牛`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Bước chân trái ngược & múa may (chữ thuộc bộ `舛`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                |
| :-----: | :----: | :------: | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
|   舛    | chuǎn  |  Suyễn   | Đứng độc lập          | Tượng hình hai bàn chân bước ngược chiều; trái ngược, sai lệch, lầm lẫn, trắc trở (命途多舛, 舛误, 乖舛).                                     |
|   舞    |   wǔ   |    Vũ    | `无/無` (lược) + `舛` | Hội ý cổ: người cầm đồ trang sức tay vung lên trên + đôi chân `舛` nhảy theo nhịp ở dưới → múa, khiêu vũ, vung vẩy, cổ vũ (跳舞, 舞蹈, 鼓舞). |

### Nhóm B: Nhân danh cổ & linh kiện thuộc bộ `舛`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                 |
| :-----: | :----: | :------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
|   舜    |  shùn  |  Thuấn   | `爫 + 冖` + `舛`      | Chữ cổ (họ/tên vua Thuấn hiền minh thời Nghiêu–Thuấn), cũng chỉ cây hoa dâm bụt/mộc cận (尧舜, 虞舜, 颜如舜华).                                |
|   舝    |  xiá   |   Hạt    | `丰 + 口` + `舛`      | Hội ý cổ: chốt sắt cài hai đầu trục xe ngựa (`舛` mô phỏng hai đầu ngược hướng giữ bánh xe); nay gặp làm phần gốc của `辖` (quản lý, phạm vi). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`舞, 舜` (từ DB):** Thuộc trực tiếp bộ Suyễn `舛` (đã giải nghĩa ở mục 2).
- **`止` & `足` (từ DB):** Bộ thủ riêng liên quan chân/bước (`止` bàn chân/dừng; `足` chân).
- **Chữ chứa `舛` ở vị trí phụ nhưng xếp ở bộ khác:**
  - `桀` (`jié`, Kiệt — `舛` + `木`, xếp bộ **Mộc `木`**): cột gỗ xử hình thời cổ, tên vua Hạ Kiệt bạo ngược, hung dữ (桀骜不驯).
  - `杰 / 傑` (`jié`, Kiệt — Giản thể `木 + 灬`, Phồn thể `人 + 桀` chứa `舛`, xếp bộ **Mộc `木` / Nhân `人`**): kiệt xuất, anh hùng (杰出, 豪杰).
  - `瞬` (`shùn`, Thuấn — `目` + `舜`, chứa `舛`, xếp bộ **Mục `目`**): chớp mắt, thoáng chốc (瞬间, 转瞬即逝).
  - `粼 / 磷 / 鳞 / 邻` (`lín`, Lân — các chữ dùng khối `粦 = 米 + 舛` làm thanh phù `lín`, lần lượt xếp bộ **Mễ `米`**, **Thạch `石`**, **Ngư `魚/鱼`**, **Ấp `阝`**): nước trong lấp lánh (波光粼粼), phốt pho (磷), vảy cá (鱼鳞), hàng xóm (邻居 — Giản thể lược `粦` thành `令`).
  - `辖 / 轄` (`xiá`, Hạt — `车` + `害`, gốc cổ liên quan `舝`, xếp bộ **Xa `車/车`**): chốt trục xe → cai quản, phạm vi quản lý (管辖, 直辖市).

---

## Bộ 155: 舟 (Chu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-171` · `radical_index`: `171` · `strokes`: `6` nét · `name_vi`: `bộ Chu` · Khang Hy: `#137` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `舟` — dạng chính duy nhất (6 nét: `ノ 丿 ㇆ 丶 一 丶`); đứng độc lập (`舟`) hoặc đứng **bên trái** chữ ghép (`船, 航, 舰, 艇, 舱, 舵, 舷, 舶, 艄, 舢, 舫, 舸` — khi đứng bên trái, nét ngang giữa viết thành nét hất lên `㇀` gọn nhẹ, không đâm xuyên sang bên phải).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **chiếc thuyền gỗ** nhìn từ trên xuống hoặc nhìn nghiêng thân thuyền thon hai đầu, có các vách ngăn ngang và khoang giữa.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Thuyền, tàu, xuồng đi trên sông biển (`舟, 船, 艇, 舰, 舶, 舢, 舫, 舸`) → các bộ phận cấu thành con tàu (`舱` khoang tàu, `舵` bánh lái, `舷` mạn thuyền, `艄` đuôi thuyền) → hoạt động điều khiển, chở đi và vượt không gian, từ đường thủy mở rộng sang đường không và vũ trụ (`航`: 航海, 航空, 航天; `般`: di chuyển/chuyển dời → loại, hạng).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `舟` ở bên trái hầu như luôn chỉ tàu thuyền, bộ phận của tàu, hàng hải và vận chuyển đường thủy (hoặc hàng không mở rộng từ hàng hải).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`舟` vs `船`:** `舟` là bộ thủ gốc (6 nét), trong tiếng Trung hiện đại hay dùng trong văn viết hoặc tên gọi (`小舟, 龙舟, 轻舟`); `船` (`舟 + 㕣`, 11 nét) mới là từ thông dụng nhất trong khẩu ngữ và đời sống hiện đại cho "thuyền, tàu" (`轮船, 帆船, 坐船`).
    - **`舟` vs `车 / 車` (Xa) & `辶` (Sước):** `舟` chỉ phương tiện đường nước (mở rộng ra tàu bay/tàu vũ trụ: `飞船, 航`); `车` chỉ phương tiện có bánh chạy trên bộ; `辶` chỉ hành động di chuyển đi lại trên đường.
    - **`航` (`háng`):** Khởi thủy là đi thuyền vượt sông biển (`航海`), nay mở rộng sang bay trên trời và vũ trụ (`航空` hàng không, `航天` hàng không vũ trụ).
    - **Chữ biến dạng từ `舟` sang `月` trong chữ Khải:** Ở các chữ `服, 朕, 前`, thành phần cổ tự vốn là `舟` nhưng khi chuyển sang Khải thư bị biến hình thành `月`, do đó từ điển xếp `服, 朕` vào bộ `月` và `前` vào bộ `刀` (xem Mục 3).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Các loại thuyền, tàu thủy & chiến hạm

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                               |
| :-----: | :----: | :------: | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
|   舟    |  zhōu  |   Chu    | Đứng độc lập          | Tượng hình con thuyền; thuyền nhỏ (thường dùng trong văn viết, thành ngữ, tên gọi) (小舟, 龙舟, 破釜沉舟).                                   |
|   船    | chuán  |  Thuyền  | `舟` + `㕣`           | Hình thanh: `舟` (thuyền) + `㕣` (`yǎn`, thanh phù); tàu, thuyền (từ thông dụng nhất), tàu vũ trụ (轮船, 帆船, 宇宙飞船).                    |
|   艇    |  tǐng  |   Đĩnh   | `舟` + `廷`           | Hình thanh: `舟` (thuyền) + `廷` (`tíng`, thanh phù); thuyền/tàu cỡ nhỏ tốc độ nhanh hoặc tàu chuyên dụng (潜艇, 快艇, 游艇).                |
| 舰 / 艦 |  jiàn  |   Hạm    | `舟` + `见` (`見`)    | Hình thanh: `舟` (tàu) + `见` (`jiàn`, Phồn: `見`, thanh phù); tàu chiến cỡ lớn, hàng không mẫu hạm (军舰, 舰队, 航空母舰).                  |
|   舶    |   bó   |   Bạc    | `舟` + `白`           | Hình thanh: `舟` (tàu) + `白` (`bái`, thanh phù); tàu biển lớn vượt đại dương; dùng trong từ chỉ hàng hóa nhập từ nước ngoài (船舶, 舶来品). |
|   舫    |  fǎng  |  Phảng   | `舟` + `方`           | Hình thanh: `舟` (thuyền) + `方` (`fāng`, thanh phù); thuyền du ngoạn có mái che trang trí đẹp, hai thuyền ghép song song (画舫, 石舫).      |

### Nhóm B: Bộ phận cấu tạo tàu thuyền & thuyền nhỏ

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                        |
| :-----: | :----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 舱 / 艙 |  cāng  |  Thương  | `舟` + `仓` (`倉`)    | Hình thanh: `舟` (tàu) + `仓` (`cāng`, kho chứa, thanh phù); khoang tàu thủy, khoang máy bay, khoang phi thuyền (船舱, 机舱, 太空舱). |
|   舵    |  duò   |    Đà    | `舟` + `它`           | Hình thanh: `舟` (thuyền) + `它` (`tā`, thanh phù); bánh lái tàu thuyền để điều chỉnh hướng đi, người cầm lái (掌舵, 舵手, 船舵).     |
|   舷    |  xián  |  Huyền   | `舟` + `玄`           | Hình thanh: `舟` (thuyền) + `玄` (`xuán`, thanh phù); mạn thuyền, thành tàu thủy hai bên, cửa sổ mạn máy bay/tàu (船舷, 舷窗, 舷梯).  |
|   艄    |  shāo  |   Sao    | `舟` + `肖`           | Hình thanh: `舟` (thuyền) + `肖` (`xiāo`, thanh phù); phần đuôi thuyền, người lái chèo ở đuôi thuyền (船艄, 艄公).                    |
|   舢    |  shān  |   San    | `舟` + `山`           | Hình thanh: `舟` (thuyền) + `山` (`shān`, thanh phù); thuyền gỗ nhỏ đáy bằng chèo tay, xuồng tam bản (舢板 `shānbǎn`).                |

### Nhóm C: Hàng hải, chuyển dời & thuyền văn ngôn

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                       |
| :-----: | :----: | :------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
|   航    |  háng  |   Hàng   | `舟` + `亢`           | Hình thanh: `舟` (thuyền) + `亢` (`kàng`, thanh phù); đi thuyền vượt sông biển, mở rộng sang hàng không và vũ trụ (航海, 航空, 航行).                |
|   般    |  bān   |   Ban    | `舟` + `殳`           | Hội ý cổ: tay cầm sào (`殳`) đẩy thuyền (`舟`) quay chuyển; gốc là chở/chuyển (gốc của `搬`), nay nghĩa là loại, hạng, giống như (一般, 这般, 百般). |
|   舸    |   gě   |   Kha    | `舟` + `可`           | Hình thanh: `舟` (thuyền) + `可` (`kě`, thanh phù); chiếc thuyền lớn (gặp nhiều trong thơ văn: 百舸争流 `bǎigě-zhēngliú`, trăm thuyền đua sóng).     |
|   舴    |   zé   |  Trách   | `舟` + `乍`           | Hình thanh: `舟` (thuyền) + `乍` (`zhà`, thanh phù); dùng ghép thành `舴艋` (`zéměng`), chỉ chiếc thuyền nhỏ dài nhẹ như con cào cào (舴艋舟).       |
|   艋    |  měng  |   Mãnh   | `舟` + `孟`           | Hình thanh: `舟` (thuyền) + `孟` (`mèng`, thanh phù); ghép cùng `舴` thành `舴艋` chỉ con thuyền nhỏ (舴艋).                                         |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`船, 航, 般, 舰` (từ DB):** Đều là chữ chính thức thuộc bộ Chu `舟` (đã giải nghĩa ở mục 2).
- **`车 / 車` & `辶` (từ DB):** Bộ thủ riêng chỉ xe cộ trên cạn (`车`) và sự di chuyển đi lại (`辶`).
- **Chữ chứa `舟` (hoặc biến thể `月` gốc `舟`) ở vị trí phụ nhưng xếp ở bộ khác:**
  - `搬` (`bān`, Ban — `扌` + `般`, chứa `舟`, xếp bộ **Thủ `扌`**): di chuyển, dọn chuyển đồ đạc (搬家, 搬运).
  - `盘 / 盤` (`pán`, Bàn — `般` + `皿` ở Phồn thể `盤`, Giản thể viết `舟` + `皿`, xếp bộ **Mãnh `皿`**): cái đĩa, mâm, khay tròn (盘子, 键盘).
  - `服` (`fú`, Phục — `月` + `𠬝`, xếp bộ **Nguyệt `月`**): cổ tự bên trái là `舟` (lệ biến thành `月`) + tay chế ngự → phục tùng, quần áo, uống thuốc (衣服, 服务).
  - `朕` (`zhèn`, Trẫm — `月` + `灷`, xếp bộ **Nguyệt `月`**): cổ tự bên trái là `舟` (lệ biến thành `月`) → điềm báo nhỏ, đại từ tự xưng của hoàng đế (朕兆).
  - `前` (`qián`, Tiền — `丷 + 一 + 月 + 刂`, xếp bộ **Đao `刀/刂`**): cổ tự là bàn chân `止` trên thuyền `舟` tiến về phía trước, Khải thư biến `舟` thành `月` (前面, 以前).

---

## Bộ 156: 艮 (Cấn)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-172` · `radical_index`: `172` · `strokes`: `6` nét · `name_vi`: `bộ Cấn` · Khang Hy: `#138` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `艮` — dạng chính duy nhất (6 nét: `𠃍 一 一 乚 ノ 丶`), đứng độc lập (`艮`), đứng **bên phải** (`很, 根, 跟, 眼, 银, 恨, 狠, 限, 艰`) hoặc ở **bên trên/giữa** (`恳, 垦, 退`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Giáp cốt văn vẽ hình **con mắt (`目`) quay ngoái lại nhìn người (`匕/人`)** phía sau — biểu thị ý dừng bước ngoái nhìn, ngăn cản, không chịu đi tiếp. Trong Kinh Dịch Bát Quái, `艮` là quẻ Cấn tượng trưng cho **núi cao, sự dừng lại yên tĩnh**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Dừng lại, cương quyết, dai dẳng/bộc trực (`艮` khẩu ngữ Bắc Kinh đọc `gěn`), quẻ Cấn (`艮卦`) → tốt lành, lương thiện (`良`, thêm chấm trên đầu) và gian khó (`艰`, có gốc dừng cản bước). Trong tiếng Trung hiện đại, `艮` **cực kỳ ít gặp đứng bộ chính**, mà đóng vai trò **thanh phù chủ lực** (âm `gen / hen / yan / ken / yin`) trong hàng loạt chữ thông dụng (`很, 根, 跟, 眼, 银, 恨, 狠, 限`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Gặp `艮` trong chữ ghép **không nên đoán nghĩa từ `艮`**, mà hãy nhìn **bộ thủ ở bên trái/dưới** để đoán nghĩa (`彳` → phó từ mức độ `很`, `木` → rễ cây `根`, `足` → gót chân/đi theo `跟`, `目` → con mắt `眼`, `钅` → bạc `银`, `忄` → oán hận `恨`, `土` → khai khẩn `垦`), còn `艮` chỉ gợi vần âm `-en / -an / -in`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`艮` (Cấn — 6 nét) vs `良` (Lương — 7 nét):** Đây là cặp nhầm nét chấm cực kỳ phổ biến!
      - **`艮` (6 nét: `𠃍 一 一 乚 ノ 丶`)**: **KHÔNG có nét chấm `丶` trên đỉnh**, đỉnh bằng phẳng (`很, 根, 跟, 眼, 银, 恨, 狠, 限, 退`).
      - **`良` (7 nét: `丶 𠃍 一 一 乚 ノ 丶`)**: **CÓ thêm 1 nét chấm `丶` ở chính giữa đỉnh đầu** (`丶 + 艮`), nghĩa là **tốt lành, lương thiện** (`良好, 善良, 良心`; cũng là linh kiện trong `朗, 浪, 狼`, chú ý `郎` bỏ nét mác thành `阝`).
    - **`艮` vs `皀` (cổ tự `既`):** Chữ `既` (`jì`, đã) có phần trái `皀` giống `艮` nhưng phần dưới không kéo nét hất dài kiểu `艮` mà chuyển thành nét gập ôm sang `旡`.
    - **Tuyệt đối không giải `艮` là "rất":** `很` (`彳 + 艮`) mới là phó từ "rất"; `艮` chỉ làm thanh phù cho `很`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

> **Lưu ý chuẩn bộ thủ:** Trong từ điển Khang Hy (`#138`), chỉ có `艮`, `良`, `艱 (艰)` thực sự xếp ở bộ `艮` (cùng chữ `既` mang phần trái `皀` chung nguồn cổ tự thường được ghép tra gần `艮` trong một số bảng hiện đại). Toàn bộ các chữ thông dụng mượn `艮` làm thanh phù/linh kiện như `跟, 很, 银, 根, 眼, 恨, 狠, 限, 退` thuộc các bộ khác và được trình bày đầy đủ ở **Mục 3**.

### Nhóm A: Quẻ Cấn, tốt lành & gian khó (thuộc bộ `艮` Khang Hy)

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                     |
| :-----: | :-------: | :------: | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
|   艮    | gèn / gěn |   Cấn    | Đứng độc lập          | [Tra bộ 艮] Tượng hình mắt ngoái nhìn/dừng lại; quẻ Cấn (núi, dừng) trong Bát Quái (`gèn`: 艮卦); dai/bộc trực (`gěn`, khẩu ngữ Bắc Kinh: 很艮).   |
|   良    |   liáng   |  Lương   | `丶` + `艮`           | [Tra bộ 艮] Hội ý cổ (hình hành lang/điện rộng hoặc hạt lúa sạch); tốt đẹp, lương thiện, hiền lành, rất/sâu sắc (良好, 善良, 良心).                |
| 艰 / 艱 |   jiān    |   Gian   | `又` + `艮` (`艰`)    | [Tra bộ 艮] Phồn thể `艱` gồm `𦰩` (đất sét khô cứng) + `艮` (dừng cản bước); Giản thể thay `𦰩` bằng `又`; khó khăn, gian khổ (艰难, 艰苦, 艰巨). |

### Nhóm B: Chữ chung nguồn cổ tự với `艮`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                    |
| :-----: | :----: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 既 / 旣 |   jì   |    Ký    | `皀` + `旡`           | [Khang Hy xếp bộ `无`; phần trái `皀` chung gốc quay đầu với `艮`, hay ghép nhóm cùng `艮`] Ăn no xong quay đầu đi → đã, đã từng, vì rằng (既然, 既定, 一如既往). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Chữ thông dụng mượn `艮` làm thanh phù / linh kiện (xếp ở bộ khác):**
  - `很` (`hěn`, Ngận — `彳` + `艮`, xếp bộ **Xích `彳`**): `艮` làm thanh phù `hěn`; nghĩa gốc đi chậm ngoan cố, nay là phó từ "rất" (很好, 很多) _(từ DB)_.
  - `根` (`gēn`, Căn — `木` + `艮`, xếp bộ **Mộc `木`**): `木` (cây) + `艮` (âm `gēn`) → rễ cây, căn nguyên, gốc rễ, lượng từ vật thuôn dài (树根, 根本, 一根线) _(từ DB)_.
  - `跟` (`gēn`, Căn — `足` + `艮`, xếp bộ **Túc `足/⻊`**): `⻊` (chân) + `艮` (âm `gēn`) → gót chân, đi theo sau, cùng với (脚跟, 跟着, 跟朋友去) _(từ DB)_.
  - `银 / 銀` (`yín`, Ngân — `钅` + `艮`, xếp bộ **Kim `金/钅`**): `钅` (kim loại) + `艮` (thanh phù âm cổ gần `yín`) → kim loại bạc, tiền bạc, ngân hàng (银行, 银子, 银河).
  - `眼` (`yǎn`, Nhãn — `目` + `艮`, xếp bộ **Mục `目`**): `目` (mắt) + `艮` (thanh phù) → con mắt, ánh mắt, lỗ nhỏ (眼睛, 眼神, 眼镜) _(từ DB)_.
  - `恨` (`hèn`, Hận — `忄` + `艮`, xếp bộ **Tâm `心/忄`**): `忄` (tâm trạng) + `艮` (thanh phù `hèn`) → căm ghét, hận thù, ân hận (仇恨, 悔恨, 怨恨).
  - `狠` (`hěn`, Ngoan — `犭` + `艮`, xếp bộ **Khuyển `犬/犭`**): `犭` (thú dữ) + `艮` (thanh phù `hěn`) → tàn nhẫn, hung ác, quyết liệt (狠心, 凶狠).
  - `限` (`xiàn`, Hạn — `阝` + `艮`, xếp bộ **Phụ `阜/阝`**): `阝` (sườn núi/bờ ngăn) + `艮` (dừng cản/thanh phù) → giới hạn, hạn chế, kỳ hạn (限制, 有限, 期限).
  - `退` (`tuì`, Thoái — `艮` + `辶`, xếp bộ **Sước `辵/辶`**): quay lưng (`艮`) bước đi (`辶`) → lùi lại, rút lui, trả lại (后退, 退休, 退货).
  - `恳 / 懇` (`kěn`, Khẩn — `貇` + `心`, chứa `艮`, xếp bộ **Tâm `心`**): thành khẩn, tha thiết (诚恳, 恳求).
  - `垦 / 墾` (`kěn`, Khẩn — `貇` + `土`, chứa `艮`, xếp bộ **Thổ `土`**): khai khẩn đất hoang (开垦, 农垦).
- **Chữ chứa `良` (có chấm đầu — tránh nhầm với `艮`):**
  - `朗` (`lǎng`, Lãng — `良` + `月`, bộ `月`: sáng rõ `晴朗, 朗读`), `浪` (`làng`, Lãng — `氵` + `良`, bộ `水`: sóng nước `波浪, 浪费`), `狼` (`láng`, Lang — `犭` + `良`, bộ `犬`: chó sói `野狼`), `郎` (`láng`, Lang — `良` biến + `阝`, bộ `邑`: chàng trai `新郎`).

---

## Bộ 157: 色 (Sắc)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-076` · `radical_index`: `76` · `strokes`: `6` nét · `name_vi`: `bộ Sắc` · Khang Hy: `#139` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `色` — dạng chính duy nhất (6 nét: `ノ 𠃌 𠃍 丨 一 乚`), gồm phần trên giống `⺈` (Đao đầu) và phần dưới giống `巴`; đứng độc lập (`色`), đứng bên phải (`艳, 绝, 艴, 艵`), hoặc ghép thành từ 2 âm tiết cực phổ biến (`颜色, 脸色, 景色`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Theo văn tự cổ và _Thuyết văn_, vẽ hình **một người cúi xuống ôm hoặc ép sát vào người đang quỳ (`卩`)**, biểu thị sự giao hợp/ham muốn hoặc **sắc thái biểu cảm lộ trên gương mặt con người**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Sắc mặt, biểu hiện nét mặt (`脸色, 艴然`) → vẻ đẹp, diện mạo, quang cảnh (`景色, 美色, 艳`) → **màu sắc** (`颜色, 红色, 蓝色`) → chất lượng/chủng loại (`成色, 角色`) → nghĩa "sắc dục" trong một số ngữ cảnh riêng (`好色, 色情`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `色` thường liên quan đến màu sắc, vẻ đẹp rực rỡ, sắc mặt, cảnh sắc hoặc sắc thái biểu hiện bên ngoài.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`色` (Sắc — 6 nét) vs `巴` (Ba — 4 nét):** Phần dưới của `色` viết giống hệt `巴` (`𠃍 丨 一 乚`, bộ thủ của riêng nhóm chữ `吧, 把, 爸`), nhưng `色` có thêm **nắp đầu `⺈` (`ノ 𠃌`)** ở phía trên.
    - **`色` (màu sắc nói chung) vs `青, 赤, 黑, 白, 黄`:** Các bộ kia chỉ **từng màu cụ thể** (xanh, đỏ, đen, trắng, vàng), còn `色` chỉ khái niệm "màu sắc, sắc thái, sắc mặt" nói chung (`颜色, 彩色`).
    - **`艳` (Giản thể) vs `艷` (Phồn thể):** Giản thể `艳` (`丰 + 色`) xếp bộ **Sắc `色`**; trong khi Phồn thể `艷` (`豐 + 秬/色`, dạng chuẩn truyền thống dùng `豆/豐`) thường xếp bộ **Đậu `豆`**, còn dị thể `艶` xếp bộ `色`.
    - **Ngữ cảnh nghĩa của `色`:** Nghĩa "sắc dục" (`好色`) chỉ là một nhánh ngữ nghĩa cổ/ngữ cảnh cụ thể, tuyệt đối không gán nghĩa tiêu cực này cho `颜色` (màu sắc), `景色` (phong cảnh) hay `特色` (đặc sắc).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Màu sắc, rực rỡ & vẻ ngoài

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                             |
| :-----: | :-------: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
|   色    | sè / shǎi |   Sắc    | Đứng độc lập          | Màu sắc, sắc mặt, cảnh sắc, loại/phẩm chất (`sè`: 颜色, 脸色, 景色, 角色); màu phai/xúc xắc trong khẩu ngữ (`shǎi`: 掉色, 色子).           |
| 艳 / 艷 |    yàn    |   Diễm   | `丰` + `色` (`艳`)    | [Giản thể `艳` và `艶` xếp bộ `色`; Phồn thể `艷` xếp bộ `豆`] Màu sắc tươi tắn, lộng lẫy, xinh đẹp nổi bật, ngưỡng mộ (鲜艳, 艳丽, 惊艳). |

### Nhóm B: Sắc mặt biến đổi trong văn viết cổ (thuộc bộ `色`)

| Chữ Hán |   Pinyin    |  Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                         |
| :-----: | :---------: | :--------: | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
|   艴    |   fú / bó   | Phất / Bột | `弗` + `色`           | Hình thanh kiêm hội ý: `弗` (`fú`, thanh phù) + `色` (sắc mặt); sắc mặt bừng lên giận dữ, bực tức lộ ra mặt (艴然不悦 `fúrán bù yuè`). |
|   艵    | pēng / pīng |   Phanh    | `并` + `色`           | Hình thanh: `并` (`bìng`, thanh phù) + `色` (sắc mặt); sắc mặt đỏ bừng lên vì tức giận (trong văn tự cổ hay dùng cùng `艴`).           |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`颜色, 景色, 脸色, 艳` (từ DB):** Các từ ghép và chữ thông dụng nhất gắn với bộ Sắc `色`.
- **`巴` (từ DB):** Phần dưới của chữ `色` giống `巴` (4 nét, gặp trong `吧, 把, 爸` — không phải bộ `色`).
- **Chữ chứa `色` hoặc dễ nhầm hình thể nhưng xếp ở bộ khác:**
  - `绝 / 絕` (`jué`, Tuyệt — `纟` + `色`, xếp bộ **Mịch `糸/纟`**): cắt đứt sợi dây → đứt đoạn, tuyệt đối, tuyệt vời (绝对, 拒绝, 绝望).
  - `危` (`wēi`, Nguy — `⺈ + 厂 + 厄`, xếp bộ **Tiết `卩`**): người đứng trên vách đá cheo leo → nguy hiểm, nguy cơ; nét đầu và giữa hơi giống `色` nhưng đáy là `㔾` chứ không phải `巴` (危险, 危机).
  - `青 / 赤 / 黑 / 白` (từ DB): các bộ thủ riêng chỉ màu sắc cơ bản (xanh, đỏ, đen, trắng).

---

## Bộ 158: 虍 (Hô)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-173` · `radical_index`: `173` · `strokes`: `6` nét · `name_vi`: `bộ Hô / Hổ đầu` · Khang Hy: `#141` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `虍` — dạng chính duy nhất (6 nét: `丨 一 乛 ノ 一 乚`), thường nằm **bao trùm phía trên và bên trái** chữ (gọi là _Hổ đầu_ 虎头, như `虎, 虐, 虑, 虚, 虏, 虞, 虔`), hoặc nằm trong khối ghép lớn (`卢/盧, 剧/劇, 献/獻`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **đầu con hổ và bộ lông vằn vện trên mình hổ** (về sau thêm phần chân `儿` bên dưới thành chữ `虎` hoàn chỉnh chỉ con hổ).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Con hổ, loài mãnh thú uy dũng (`虍, 虎`) → sức mạnh hung bạo, tàn nhẫn, bắt bớ (`虐` ngược đãi, `虏` bắt làm tù binh) → mở rộng trừu tượng trong nhiều chữ cổ/hiện đại thành **trống rỗng** (`虚`), **lo lắng suy nghĩ** (`虑, 虞`), **thành kính** (`虔`), và các chữ có âm/lịch sử phức tạp (`号/號, 处/處, 亏/虧`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `虍` (hổ đầu) thường gợi liên hệ tới hổ, uy lực, sự hung bạo/áp chế (`虎, 虐, 虏`), hoặc đóng vai trò phần đầu cấu tạo trong các chữ trừu tượng (`虚, 虑, 虞, 虔`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`虍` (Hổ đầu — 6 nét) vs `虎` (Hổ — 8 nét):** `虍` là bộ thủ (chỉ có 6 nét, phần dưới là nét sổ cong móc `乚`, chưa có 2 chân `儿`); `虎` là chữ hoàn chỉnh chỉ "con hổ" (thêm `儿` ở đáy thành 8 nét).
    - **`虍` vs `广 / 厂` (Nghiễm / Hán) vs `虫` (Trùng):** `虍` có nét sổ dọc nhỏ trên đỉnh kèm nét ngang ngắn bên phải (`卜` trên mái) và khối `七` nhỏ lồng dưới mái `乛 ノ`, không phải mái nhà `广` và càng không phải bộ `虫`.
    - **Không suy diễn nghĩa "hổ" cứng nhắc cho `虚, 虑`:** Trong `虚` (trống rỗng/khiêm tốn) và `虑` (lo lắng/suy nghĩ), `虍` chủ yếu giữ vai trò linh kiện hình/âm cổ (trống rỗng từ hình gò núi cổ `丘 + 虍`), không nên giải thích gượng ép theo con hổ.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Con hổ, mãnh lực, tàn bạo & bắt giữ

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                        |
| :-----: | :----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
|   虍    |   hū   |    Hô    | Đứng độc lập          | Tượng hình vằn hổ và đầu hổ (ít đứng độc lập, chủ yếu làm bộ thủ _hổ đầu_ trong từ điển) (虍部).                                      |
|   虎    |   hǔ   |    Hổ    | `虍` + `儿`           | Tượng hình toàn thân con hổ (đầu vằn `虍` + chân hổ `儿`); con hổ, dũng mãnh như hổ (老虎, 虎口, 马马虎虎).                           |
|   虐    |  nüè   |  Ngược   | `虍` + `彐` ngược     | Hội ý: móng vuốt thú dữ (`虍` + vuốt `爪/彐` xoay ngược) vồ xé → tàn bạo, ngược đãi, hành hạ (虐待, 暴虐, 肆虐).                      |
| 虏 / 虜 |   lǔ   |    Lỗ    | `虍` + `力` (`虏`)    | [Phồn thể `虜` gồm `虍 + 男`; Giản thể `虏` rút thành `虍 + 力`] Dùng sức mạnh khuất phục → bắt sống, tù binh, cướp bóc (俘虏, 虏获). |

### Nhóm B: Trống rỗng, lo toan, suy nghĩ & thành kính

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                  |
| :-----: | :----: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 虚 / 虛 |   xū   |    Hư    | `虍` + `业` (`丘` cổ) | Hình thanh kiêm hội ý cổ: gò núi lớn (`丘`) + `虍` (`hū`, thanh phù); trống rỗng, giả dối, yếu ớt, khiêm tốn (虚心, 谦虚, 虚伪).                |
| 虑 / 慮 |   lǜ   |    Lự    | `虍` + `心` (`虑`)    | [Giản thể `虑` xếp bộ `虍`; Phồn thể `慮` gồm `虍 + 思`, xếp bộ `心`] Lo lắng trong lòng (`心`) → suy nghĩ, cân nhắc, lo âu (考虑, 忧虑, 顾虑). |
|   虞    |   yú   |   Ngu    | `虍` + `吴`           | Hình thanh: `虍` (biểu hình/tượng) + `吴` (`wú`, thanh phù); suy tính đề phòng, lo lắng, lừa dối, tên triều đại cổ (无虞, 尔虞我诈, 虞舜).      |
|   虔    |  qián  |   Kiền   | `虍` + `文`           | Hình thanh: `虍` (vẻ uy nghiêm của hổ) + `文` (`wén`, thanh phù); cung kính, thành tâm kính cẩn (虔诚 `qiánchéng`).                             |

### Nhóm C: Chữ thông dụng xếp bộ `虍` ở Phồn thể (Khang Hy) & chữ cổ

| Chữ Hán |  Pinyin   |  Hán Việt  | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                |
| :-----: | :-------: | :--------: | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 号 / 號 | hào / háo | Hiệu / Hào | `口 + 丂` + `虎` (`號`) | [Phồn thể `號` xếp bộ `虍`; Giản thể `号` xếp bộ `口`] Gào thét như tiếng hổ (`háo`: 呼号, 哀号); ký hiệu, tên gọi, ngày (`hào`: 号码, 符号). |
| 处 / 處 | chù / chǔ |  Xứ / Xử   | `虍 + 夂` + `几` (`處`) | [Phồn thể `處` xếp bộ `虍`; Giản thể `处` xếp bộ `夂`] Ở lại/dừng chân (`chǔ`: 处理, 相处); nơi chốn, chỗ, phòng ban (`chù`: 到处, 好处).     |
| 亏 / 虧 |    kuī    |    Khuy    | `虍 + 𠧗` + `丂` (`虧`) | [Phồn thể `虧` xếp bộ `虍`; Giản thể `亏` xếp bộ `二`] Khí thở bị tắc đứt → thiếu hụt, thua thiệt, may nhờ (吃亏, 亏损, 多亏).                |
|   虢    |    guó    |    Quắc    | `𠂤 + 寽` + `虍`        | Hội ý cổ: vết móng vuốt hổ cào, tên một nước chư hầu thời Chu (thành ngữ: 假道灭虢 `jiǎdào-mièguó`, mượn đường diệt Quắc).                    |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`虎, 虐, 虚, 虑` (từ DB):** Đều thuộc trực tiếp bộ Hô `虍` (đã giải nghĩa ở mục 2).
- **`犬 / 犭` & `豸` (từ DB):** Bộ thủ riêng về loài chó/thú (`犬/犭`) và loài thú thân dài/thú hoang (`豸`).
- **Chữ chứa `虍` (hoặc khối `虎 / 豦 / 盧` mang `虍`) ở vị trí phụ nhưng xếp ở bộ khác:**
  - `剧 / 劇` (`jù`, Kịch — `豦` + `刂`, xếp bộ **Đao `刀/刂`**): vở kịch, kịch liệt, dữ dội (京剧, 电视剧, 剧烈).
  - `据 / 據` (`jù / jū`, Cứ — `扌` + `居` giản / `扌` + `豦` phồn, xếp bộ **Thủ `扌`**): chiếm giữ, căn cứ vào (根据, 证据, 占据).
  - `戏 / 戲` (`xì`, Hí — `又` + `戈` giản / `虍 + 豆` + `戈` phồn, xếp bộ **Qua `戈`**): trò chơi, tuồng kịch, trêu đùa (游戏, 看戏).
  - `卢 / 盧` (`lú`, Lô — Phồn thể `盧` gồm `虍 + 田 + 皿`, xếp bộ **Mãnh `皿`**; Giản thể `卢` xếp bộ **Bốc `卜`**): bình chứa cơm/rượu cổ, họ Lô; là thanh phù của `炉` (lò, bộ `火`), `芦` (lau sậy, bộ `艹`), `驴` (con lừa, bộ `马`).
  - `肤 / 膚` (`fū`, Phu — Phồn thể `膚` có `虍 + 胃`, xếp bộ **Nhục `肉/⺼`**): da thịt (皮肤, 肤色).
  - `献 / 獻` (`xiàn`, Hiến — `南` + `犬` giản / `鬳` + `犬` phồn có `虍`, xếp bộ **Khuyển `犬`**): dâng hiến, cống hiến (贡献, 献血).
  - `唬` (`hǔ / xià`, Hổ / Hách — `口` + `虎`, xếp bộ **Khẩu `口`**): tiếng hổ gầm, hù dọa (吓唬 `xiàhu`).

---

## Bộ 159: 血 (Huyết)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-175` · `radical_index`: `175` · `strokes`: `6` nét · `name_vi`: `bộ Huyết` · Khang Hy: `#143` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `血` — dạng chính duy nhất (6 nét: `ノ 丨 𠃍 丨 丨 一`), gồm nét phẩy `ノ` ở đỉnh + phần đáy là `皿`; đứng độc lập (`血`), đứng **bên trái** (`衅, 衄, 衊, 恤, 洫` — nét ngang đáy chuyển thành nét hất lên `㇀`), hoặc nằm **phía trên** (`衆`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Giáp cốt văn vẽ hình **giọt máu hoặc dòng máu (`丶/ノ`) nhỏ vào trong cái chén/bát tế lễ (`皿`)** khi cử hành nghi thức cắt máu ăn thề hay tế thần linh thời cổ.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Máu, dịch máu trong cơ thể, chảy máu (`血, 血液, 血压, 衄`) → quan hệ huyết thống máu mủ, sự hy sinh và nhiệt huyết (`血统, 心血, 热血`) → tập tục cổ lấy máu bôi lên đồ vật mới đúc (gọi là `衅`) chuyển nghĩa sang hiềm khích, khiêu khích, xung đột (`挑衅, 寻衅`) và bôi nhọ (`污衊`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `血` thường liên quan đến máu, chảy máu, huyết áp/huyết thống hoặc nghĩa tế máu, xung đột, bôi nhọ trong văn viết.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`血` (Huyết — 6 nét) vs `皿` (Mãnh — 5 nét):** `血` **CÓ thêm 1 nét phẩy nhỏ `ノ`** cắm xuống ở chính giữa đỉnh khung (biểu thị giọt máu); `皿` (bát, đĩa, đồ chứa) **KHÔNG có nét phẩy trên đỉnh** (`盆, 盘, 盒, 孟, 盟` đều dùng `皿`, không phải `血`!).
    - **`血` vs `肉 / ⺼` (Nhục):** Đều thuộc sinh học cơ thể, nhưng `血` chuyên chỉ **máu/huyết dịch**, còn `肉/⺼` chỉ **thịt, cơ bắp và nội tạng** (`肝, 肺, 胃, 脑`).
    - **Hai cách đọc hiện đại của `血`:** Đọc là **`xuè`** trong từ ghép trang trọng, y học và thành ngữ (`血液, 血压, 血统, 流血`); đọc là **`xiě`** trong khẩu ngữ đơn âm tiết hoặc từ gần gũi hàng ngày (`流了一点儿血, 鸡血`).
    - **Chữ `衅` (`xìn`):** Giản thể viết `血 + 半` (xếp bộ `血`), Phồn thể là `釁` (xếp bộ `酉`); nghĩa hiện đại phổ biến nhất là "khiêu khích, gây sự" (`挑衅, 寻衅`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Máu, chảy máu & nghi lễ cổ (thuộc bộ `血`)

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                              |
| :-----: | :-------: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
|   血    | xuè / xiě |  Huyết   | Đứng độc lập          | Tượng hình giọt máu trong chén tế `皿`; máu, huyết thống, nhiệt huyết (血液, 血压, 血统, 流血).                                             |
| 衅 / 釁 |    xìn    |   Hấn    | `血` + `半` (`衅`)    | [Giản thể `衅` xếp bộ `血`; Phồn thể `釁` xếp bộ `酉`] Nghi lễ trét máu lên đồ tế mới đúc → khe nứt, hiềm khích, gây sự (挑衅, 寻衅, 衅端). |
|   衄    |    nǜ     |   Nục    | `血` + `丑`           | Hình thanh: `血` (máu) + `丑` (`chǒu`, thanh phù); chảy máu cam (xuất huyết mũi), thất bại tổn thất trong chiến trận (鼻衄 `bí nǜ`, 挫衄).  |

### Nhóm B: Chữ Phồn thể / Văn viết thuộc bộ `血`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                         |
| :-----: | :----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   衊    |  miè   |   Miệt   | `血` + `蔑`           | Hình thanh: `血` (máu) + `蔑` (`miè`, thanh phù); máu bẩn dính vào → làm nhơ bẩn, vu khống, bôi nhọ (污衊 `wūmiè`, chuẩn giản thể hay viết 污蔑).      |
| 众 / 眾 | zhòng  |  Chúng   | `血` + `乑` (`衆`)    | [Phồn thể `衆` xếp bộ `血` (phần trên vốn là `目` cổ bị biến dạng); Giản thể `众` ba chữ `人` xếp bộ `人`] Nhiều người, quần chúng (群众, 观众, 众多). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`衅, 血液` (từ DB):** `衅` (khiêu khích, xếp bộ `血`); `血液` (dịch máu, ghép hai chữ có `血` và `液`).
- **`皿` & `肉 / ⺼` (từ DB):** Bộ thủ riêng chỉ đồ chứa (`皿`) và thịt/cơ thể (`肉/⺼`).
- **Chữ chứa `血` ở vị trí phụ hoặc hay nhầm với `皿` nhưng xếp ở bộ khác:**
  - `恤` (`xù`, Tuất — `忄` + `血`, xếp bộ **Tâm `心/忄`**): đau lòng xót thương máu chảy → thương xót, trợ cấp, áo phông phiên âm (`T恤` `T-xù`) (体恤, 抚恤, 恤衫).
  - `洫` (`xù`, Hức — `氵` + `血`, xếp bộ **Thủy `水/氵`**): mương rãnh dẫn nước ngoài đồng ruộng (沟洫).
  - `孟` (`mèng`, Mạnh — `子` + `皿`, xếp bộ **Tử `子`**) & `盟` (`méng`, Minh — `明` + `皿`, xếp bộ **Mãnh `皿`**): phần dưới là **`皿`** (đồ đựng), **không phải `血`**!

---

## Bộ 160: 行 (Hành)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-176` · `radical_index`: `176` · `strokes`: `6` nét · `name_vi`: `bộ Hành` · Khang Hy: `#144` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `行` — dạng chính (6 nét: `ノ ノ 丨 一 一 亅`), đứng độc lập (`行`), hoặc **tách đôi `彳` (trái) và `亍` (phải) để kẹp thành phần khác ở chính giữa** (kết cấu trái–giữa–phải đặc trưng của bộ `行`, như `街, 衍, 衡, 衔, 衙, 衢, 衛/卫, 衝/冲, 術/术`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Giáp cốt văn vẽ hình **ngã tư đường phố lớn giao nhau** (gồm nửa trái `彳` và nửa phải `亍`), biểu thị con đường đi lại giữa khu dân cư.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Con đường, phố xá thông thương (`行, 街, 衢, 衕`) → đi lại, lưu thông, tiến hành, thực hiện (`行走, 行动, 进行, 衍`) → đánh giá tiêu chuẩn được hay không (`行不行`, "được/ổn") → dãy thẳng tắp như lối đường chuyển sang **hàng, lối, ngành nghề, hiệu buôn** (`háng`: 银行, 行业, 同行) → cơ quan, chức tước, kỹ thuật, bảo vệ và cân đo (`衙, 衔, 术, 卫, 衡`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `行` (hoặc khung `彳 ... 亍` kẹp phần giữa) thường liên quan đến đường phố, di chuyển, hành động thực hiện, lưu thông hoặc thiết chế/nghề nghiệp.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`行` (chia đôi kẹp giữa: `街, 衍, 衡`) vs `彳` (bộ Xích — 3 nét):** Đây là điểm cấu tạo chữ cực kỳ đặc sắc và dễ nhầm khi tra từ điển!
      - **`行` (6 nét, Khang Hy #144)** vốn ghép từ nửa trái `彳` (bước chân trái, 3 nét) + nửa phải `亍` (bước chân phải, 3 nét). Khi tạo chữ ghép, `行` **tách đôi ra hai bên để ôm kẹp thành phần khác vào chính giữa**: `街` (`彳 + 圭 + 亍`: đường phố), `衍` (`彳 + 氵 + 亍`: nước tràn lan), `衡` (`彳 + 𩵋/鱼+大 + 亍`: cân bằng, cái cân), `衔` (`彳 + 钅 + 亍`), `衙` (`彳 + 吾 + 亍`), `衛` (`彳 + 韋 + 亍`), `衝` (`彳 + 重 + 亍`), `術` (`彳 + 术 + 亍`).
      - **`彳` (3 nét, Khang Hy #60)** chỉ là **một nửa bên trái**, không kẹp phần đối xứng `亍` ở bên phải (`很, 往, 待, 律, 得, 微`).
      - _Lưu ý tra cứu:_ Từ điển Khang Hy xếp tất cả chữ khung `彳...亍` vào bộ **`行`**, còn một số từ điển hiện đại (như _Tân Hoa_) quy gọn các chữ giữ khung `彳...亍` (`街, 衡, 衔, 衍`) sang bộ `彳` để người học dễ tìm theo bộ bên trái.
    - **Hai âm đọc cực quan trọng của `行`:**
      - **`xíng`**: đi, thực hiện, được/ổn (`行走, 行动, 旅行, 行不行`).
      - **`háng`**: hàng lối, ngành nghề, hãng/ngân hàng (`银行, 行业, 换行`). _(Ngoài ra còn đọc `hàng` hiếm trong `树行子`, `héng` trong `道行`)._

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Đường phố, ngã tư & sự lưu thông lan tỏa

| Chữ Hán |   Pinyin    |  Hán Việt   | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                      |
| :-----: | :---------: | :---------: | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
|   行    | xíng / háng | Hành / Hàng | Đứng độc lập (`彳 + 亍`)  | Tượng hình ngã tư đường; đi, thi hành, được/ổn (`xíng`: 行动, 旅行, 不行); hàng, ngành, ngân hàng (`háng`: 银行, 行业).                             |
|   街    |     jiē     |    Nhai     | `彳` + `圭` + `亍` (`行`) | Hình thanh kiêm hội ý: khung đường `行` (`彳...亍`) kẹp `圭` (`guī`, thanh phù kiêm ý đường đắp cao) ở giữa → đường phố, phố xá (街道, 上街, 大街). |
|   衢    |     qú      |     Cù      | `彳` + `瞿` + `亍` (`行`) | Hình thanh kiêm hội ý: khung `行` kẹp `瞿` (`qú`, thanh phù kiêm ý nhìn bốn phía) → đường cái lớn thông bốn ngả (通衢, 衢州).                       |
|   衍    |     yǎn     |    Diễn     | `彳` + `氵` + `亍` (`行`) | Hội ý: nước (`氵`) chảy tràn giữa đường phố (`彳...亍`) → tràn lan, kéo dài, phát triển rộng ra (衍生, 衍射, 敷衍).                                 |
|   衕    | tóng / tòng |    Đồng     | `彳` + `同` + `亍` (`行`) | Hình thanh: khung đường `行` kẹp `同` (`tóng`, thanh phù); ngõ nhỏ, hẻm phố (nay phổ biến viết `胡同` `hútòng`, dạng cổ là `衚衕`).                 |

### Nhóm B: Cân bằng, công sở, hàm thiếc & bày tỏ

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                               |
| :-----: | :----: | :------: | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
|   衡    |  héng  |   Hành   | `彳` + `鱼/角 + 大` + `亍` (`行`) | Hội ý cổ: cái cân thăng bằng buộc vào thanh ngang trên sừng bò/đường thẳng (`行`) → cân đo, cân bằng, cân nhắc (平衡, 衡量, 均衡).           |
|   衙    |   yá   |   Nha    | `彳` + `吾` + `亍` (`行`)         | Hình thanh: khung `行` (nơi tụ họp/công đường) + `吾` (`wú`, thanh phù); nha môn, cơ quan quan lại thời xưa (衙门, 官衙).                    |
| 衔 / 銜 |  xián  |   Hàm    | `彳` + `钅` (`金`) + `亍` (`行`)  | Hội ý: thanh sắt/vàng (`金/钅`) ngậm ở miệng ngựa khi đi đường (`行`) → hàm thiếc, ngậm trong miệng, chức tước, nối liền (军衔, 头衔, 衔接). |
|   衒    |  xuàn  |  Huyễn   | `彳` + `玄` + `亍` (`行`)         | Hình thanh: đi ngoài đường phố (`行`) + `玄` (`xuán`, thanh phù); rao bán ngoài phố, phô trương khoe khoang (chữ gốc của `炫`: 衒耀, 自衒).  |
|   衎    |  kàn   |   Khán   | `彳` + `干` + `亍` (`行`)         | Chữ cổ (từ láy `衎衎` `kànkàn`: vui vẻ, hòa nhã, thẳng thắn; hay gặp trong kinh điển và tên người).                                          |

### Nhóm C: Chữ thông dụng xếp bộ `行` ở Phồn thể (cấu tạo `彳 ... 亍` kẹp giữa)

| Chữ Hán |    Pinyin     | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                     |
| :-----: | :-----------: | :------: | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 卫 / 衛 |      wèi      |    Vệ    | `彳` + `韋` + `亍` (`衛`) | [Phồn thể `衛` xếp bộ `行`; Giản thể `卫` xếp bộ `卩`] Đi tuần tra (`行`) quanh thành (`韋`) → bảo vệ, canh giữ, vệ sinh (保卫, 卫生, 卫星).       |
| 冲 / 衝 | chōng / chòng |   Xung   | `彳` + `重` + `亍` (`衝`) | [Phồn thể `衝` xếp bộ `行`; Giản thể `冲` xếp bộ `冫`] Đi mạnh (`行`) xông thẳng tới (`重`, thanh phù) → xung đột, va chạm, xông pha (冲突, 冲击). |
| 术 / 術 |   shù / zhú   |  Thuật   | `彳` + `术` + `亍` (`術`) | [Phồn thể `術` xếp bộ `行`; Giản thể `术` xếp bộ `木`] Con đường (`行`) trong thành ấp → phương pháp, kỹ thuật, nghệ thuật (技术, 艺术, 手术).     |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`街, 衙, 衡` (từ DB):** Các chữ tiêu biểu giữ nguyên cấu trúc tách đôi `彳 ... 亍` của bộ Hành `行` (đã giải nghĩa ở mục 2).
- **`彳` (bộ Xích — từ DB):** Bộ thủ riêng (3 nét, nửa trái của `行`), biểu thị bước chân/đi lại, đứng bên trái trong `很, 得, 待, 律, 往, 征`.
- **`辶` (bộ Sước) & `走` (bộ Tẩu) (từ DB):** Các bộ thủ riêng khác chuyên chỉ sự di chuyển (`这, 过, 远`; `走, 起, 跑`).
- **Chữ chứa bộ `行` ở dạng cấu thành từ ghép hay bộ khác:**
  - `道` (`dào`, Đạo — bộ `辶`), `路` (`lù`, Lộ — bộ `足`): đồng trường nghĩa đường đi.
  - `亍` (`chù`, Xúc — 3 nét, xếp bộ **Nhị `二`**): nửa bên phải của ngã tư `行` (bước chân phải), ghép với `彳` thành từ `彳亍` (`chìchù`, đi từng bước chậm rãi ngập ngừng).

---

## Bộ 161: 襾 (Á)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-178` · `radical_index`: `178` · `strokes`: `6` nét · `radical`: `"襾 / 覀 / 西"` · `name_vi`: `bộ Á / Tây` · Khang Hy: `#146` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `襾` — dạng bộ thủ truyền thống (6 nét: `一 丨 𠃌 丨 丨 一`, hai nét trong sổ thẳng xuống chạm nét ngang đáy).
  - `覀` — biến thể dẹt thường thấy khi đặt **trên đầu chữ** (`要, 覆, 覃, 票, 栗, 贾/賈` — hai nét sổ thẳng ngắn kẹp trong khung chữ nhật dẹt).
  - `西` — chữ độc lập & dạng biến thể quen thuộc (6 nét: `一 丨 𠃌 丿 乚 一`, hai nét bên trong là nét phẩy `丿` và nét sổ cong `乚`), mang nghĩa hiện đại rất phổ biến là "phương Tây".
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Bộ `襾` vốn tượng hình **vật che phủ, úp đậy từ phía trên xuống** (giống cái nắp/cái lồng úp). Còn chữ `西` nguyên thủy trong Giáp cốt văn vẽ hình **cái tổ chim** — người xưa thấy chim bay về tổ lúc mặt trời lặn ở hướng Tây, nên mượn chữ `西` chỉ **phương Tây**; về sau hệ thống bộ thủ Khang Hy gộp chung `西` và `覀` vào bộ `襾` (#146) vì hình dạng chữ Khải tương đồng.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_
    - Theo nhánh `襾 / 覀`: che phủ, úp lật, bao trùm, tra xét kỹ (`覆, 覈, 覃`), hoặc làm phần đầu hình/âm cổ (`要, 票, 栗, 贾`).
    - Theo nhánh `西`: phương Tây, hướng Tây, văn hóa Âu Mỹ (`西方, 东西, 西瓜`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Gặp `襾 / 覀` ở trên đầu có thể gợi ý "nắp đậy, che phủ" (`覆`), nhưng trong đa số chữ thông dụng hiện đại (`要, 票, 栗`), nó chỉ là **linh kiện cổ không mang nghĩa "phương tây"**; chỉ khi thấy dạng `西` rõ ràng (đứng độc lập hoặc làm thanh phù `晒, 洒, 栖, 迁`) mới liên quan "phương Tây" hoặc vần `xī / sǎ`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`襾` vs `覀` vs `西`:** Tuy DB gộp chung nhãn `"襾 / 覀 / 西"` (`bộ Á / Tây`), cần phân biệt rõ 3 hình thái:
      - **`襾`** (nét đứng song song kéo dài, hiếm gặp độc lập): bộ thủ gốc nghĩa "che phủ".
      - **`覀`** (dạng nắp dẹt đặt trên đầu chữ `要, 票, 覆, 栗, 贾`): khung trên dẹt, hai nét giữa thẳng đứng vuông góc với đáy.
      - **`西`** (chữ độc lập hoặc đứng bên/trên trong `西方, 晒, 洒, 栖`): hai nét bên trong là **phẩy `丿` và sổ gập `乚`**, nghĩa gốc tổ chim → "phương Tây".
    - **`西` / `覀` (6 nét) vs `酉` (Dậu — 7 nét):** Cực hay nhìn lẫn! `酉` (bình rượu, chi Dậu — bộ thủ riêng #164 trong DB) **CÓ thêm 1 nét ngang `一` ở sát đáy bên trong khung**, tạo thành 7 nét (`酒, 醒, 酸, 配`); còn `西/覀` không có nét ngang phụ này nên chỉ có 6 nét.
    - **Thận trọng khi giải nghĩa `要` (`yào`):** Dù có `覀` phía trên và `女` phía dưới, chữ `要` nguyên thủy vẽ **hai bàn tay ôm ngang thắt lưng người (`腰` cổ)** rồi mới chuyển nghĩa thành "yêu cầu, cần, muốn", **không** giải đơn giản là "tây + nữ".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Che phủ, phương Tây & nhu cầu cốt lõi (thuộc bộ `襾`)

| Chữ Hán |  Pinyin   | Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                    |
| :-----: | :-------: | :-------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
|   襾    | yà / xià  |     Á     | Đứng độc lập          | Tượng hình vật úp đậy, che phủ từ trên xuống (chữ gốc của bộ thủ `#146` Khang Hy, ít đứng độc lập trong tiếng Trung hiện đại).                    |
|   西    |    xī     |    Tây    | Đứng độc lập          | Cổ tự vẽ cái tổ chim (chim về tổ lúc xế tà → hướng Tây); phương Tây, phía Tây, châu Âu/Âu Mỹ (西方, 东西, 西瓜).                                  |
|   要    | yào / yāo | Yếu / Yêu | `覀` + `女`           | Cổ tự là "thắt lưng" (chữ gốc của `腰`), Khải thư biến đầu thành `覀`; muốn, cần, sắp sửa, quan trọng (`yào`: 需要, 重要); đòi hỏi (`yāo`: 要求). |

### Nhóm B: Che lấp, lật úp, sâu rộng & tra xét (thuộc bộ `襾`)

| Chữ Hán |  Pinyin   | Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                  |
| :-----: | :-------: | :-------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
|   覆    |    fù     |   Phúc    | `覀` + `復`           | Hình thanh kiêm hội ý: `覀` (che phủ) + `復` (`fù`, thanh phù kiêm ý quay lật lại); che phủ lên, lật úp, trả lời (覆盖, 颠覆, 回复).            |
|   覃    | tán / qín | Đàm / Tầm | `覀` + `早` (`厚` cổ) | Hình thanh/hội ý cổ: kéo dài, sâu rộng; nay chủ yếu dùng làm họ người (`Qín` hoặc `Tán`) và làm thanh phù cho `谭, 潭` (覃恩).                  |
|   覈    |    hé     |   Hạch    | `覀` + `敫`           | Hình thanh: `覀` + `敫` (`jiǎo/hé`, thanh phù); tra xét kỹ thực hư, hột quả (dạng chuẩn hiện đại thường dùng thay bằng `核` bộ Mộc: 覈实/核实). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **`票` (từ DB):** `覀` + `示` (`piào`, Phiếu — gốc là lửa tàn bay lên, Khải biến đầu thành `覀`, xếp bộ **Thị `示`**): tờ phiếu, vé, hóa đơn (车票, 门票, 发票).
- **`西` & `酉` (từ DB):** `西` là phương Tây (thuộc bộ `襾`); `酉` (bộ Dậu riêng, 7 nét có thêm nét ngang bên trong, chỉ rượu/lên men: `酒, 酸, 醒`).
- **Chữ thông dụng khác chứa `覀` hoặc `西` nhưng xếp ở bộ khác:**
  - `栗` (`lì`, Lật — `覀` + `木`, xếp bộ **Mộc `木`**): cây dẻ, hạt dẻ (phần trên vẽ quả dẻ có gai, Khải biến thành `覀`) (板栗, 栗子).
  - `贾 / 賈` (`jiǎ / gǔ`, Giả / Cổ — `覀` + `贝`, xếp bộ **Bối `貝/贝`**): buôn bán, thương nhân (`gǔ`: 商贾), họ Giả (`jiǎ`).
  - `霸` (`bà`, Bá — `雨 + 革 + 月`, dị thể `覇` dùng `覀` xếp bộ `襾`; chữ chuẩn `霸` xếp bộ **Vũ `雨`**): bá chủ, chiếm đoạt (霸主, 霸道).
  - `晒 / 曬` (`shài`, Sái — `日` + `西`, xếp bộ **Nhật `日`**): phơi nắng (晒太阳, 防晒).
  - `洒 / 灑` (`sǎ`, Sái — `氵` + `西`, xếp bộ **Thủy `水/氵`**): vẩy nước, rắc, phóng khoáng (洒水, 潇洒).
  - `栖 / 棲` (`qī`, Thê — `木` + `西`, xếp bộ **Mộc `木`**): chim đậu trên cây về tổ (`西` gốc tổ chim!) → đậu, cư trú (栖息, 栖身).
  - `迁 / 遷` (`qiān`, Thiên — Giản thể `千 + 辶`, Phồn thể `遷` có `覀` ở đỉnh, xếp bộ **Sước `辵/辶`**): dời đi, di chuyển (搬迁, 变迁).
  - `烟 / 煙` (`yān`, Yên — xếp bộ **Hỏa `火`**): khói, thuốc lá (Phồn thể `煙` gồm `火 + 垔`, trong đó `垔` có `西` ở trên + `土` ở dưới; Giản thể `烟` dùng `因`).
