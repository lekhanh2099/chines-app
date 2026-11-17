# Nhóm D — Các Bộ Thủ 4 Nét Khang Hy Còn Lại (Bộ 109 – Bộ 128)

Tài liệu biên soạn chi tiết **20 bộ thủ từ Bộ 109 đến Bộ 128** thuộc nhóm bộ thủ Khang Hy còn lại (chủ yếu là các bộ **4 nét** từ Khang Hy `#62` đến `#92`, cùng bộ `#95 玄` có **5 nét** được xếp tiếp nối sau khi bỏ qua `#93 牛` và `#94 犬` đã biên soạn ở [Nhóm C](./06-nhom-c-bo-sung.md)), đối chiếu trực tiếp với dữ liệu hiện có trong bảng `public.hanzihome_radicals` và chuẩn hóa hệ thống **Chữ Hán thông dụng + Thiên bàng đứng chung** theo từng nhóm nghĩa.

> **Tổng quan đối chiếu DB (`hanzihome_radicals`):**
>
> - **Đã có trong DB (`EXISTS`):** **16 / 20** bộ (`109`–`123`, `127`). Không có dòng trùng/rỗng đi kèm trong phạm vi 16 bộ này.
> - **Chưa có trong DB (`MISSING`):** **4 / 20** bộ cần đề xuất bổ sung dòng mới: **124. `爻` (Hào)**, **125. `爿` (Tường)**, **126. `片` (Phiến)**, **128. `玄` (Huyền)** (`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`).
> - **Lưu ý số nét & dị biệt tra cứu:**
>   - **Bộ 113 `无` (Vô):** Dòng `radical-133` trong DB hiện tại đang ghi `strokes: 12` (tính theo dạng Phồn thể `無`), trong khi bộ Khang Hy `#71` gốc viết `无` chỉ có **4 nét**.
>   - **Bộ 111 `斗` (Đẩu):** Khác hoàn toàn với bộ `#191 鬥` (Đấu — đánh nhau, `radical-221`, 10 nét), dù trong chữ Giản thể hiện đại `鬥` bị giản hóa đồng hình thành `斗` (ví dụ `斗争`, `战斗`).
>   - **Bộ 128 `玄` (Huyền):** Theo bảng Khang Hy `#95`, `玄` có **5 nét** (`亠 + 幺`), được gộp tiếp ở cuối tập này sau các bộ 4 nét còn lại.

| STT | Bộ thủ | Hán-Việt | Khang Hy # | Trạng thái DB        | DB ID chính   | `radical_index` | Số nét (DB / Chuẩn) | Tên hiện tại trong DB |
| :-: | :----: | -------- | :--------: | -------------------- | ------------- | :-------------: | :-----------------: | --------------------- |
| 109 |   戈   | Qua      |    #62     | Đã có                | `radical-117` |       117       |          4          | bộ Qua                |
| 110 |   支   | Chi      |    #65     | Đã có                | `radical-119` |       119       |          4          | bộ Chi                |
| 111 |   斗   | Đẩu      |    #68     | Đã có                | `radical-121` |       121       |          4          | bộ Đẩu                |
| 112 |   斤   | Cân      |    #69     | Đã có                | `radical-122` |       122       |          4          | bộ Cân                |
| 113 |   无   | Vô       |    #71     | Đã có                | `radical-133` |       133       |  12 (Khang Hy: 4)   | bộ Vô                 |
| 114 |   曰   | Viết     |    #73     | Đã có                | `radical-125` |       125       |          4          | bộ Viết / 曰          |
| 115 |   歹   | Đãi      |    #78     | Đã có                | `radical-127` |       127       |          4          | bộ Đãi / Ngạt         |
| 116 |   殳   | Thù      |    #79     | Đã có                | `radical-043` |       43        |          4          | bộ Thù                |
| 117 |   毋   | Vô       |    #80     | Đã có                | `radical-128` |       128       |          4          | bộ Vô / Mưu           |
| 118 |   比   | Tỷ       |    #81     | Đã có                | `radical-129` |       129       |          4          | bộ Tỷ                 |
| 119 |   毛   | Mao      |    #82     | Đã có                | `radical-130` |       130       |          4          | bộ Mao                |
| 120 |   氏   | Thị      |    #83     | Đã có                | `radical-131` |       131       |          4          | bộ Thị                |
| 121 |   气   | Khí      |    #84     | Đã có                | `radical-067` |       67        |          4          | bộ Khí                |
| 122 |   爪   | Trảo     |    #87     | Đã có                | `radical-037` |       37        |          4          | bộ Trảo               |
| 123 |   父   | Phụ      |    #88     | Đã có                | `radical-058` |       58        |          4          | bộ Phụ                |
| 124 |   爻   | Hào      |    #89     | **CHƯA CÓ TRONG DB** | —             |        —        |          4          | —                     |
| 125 |   爿   | Tường    |    #90     | **CHƯA CÓ TRONG DB** | —             |        —        |  4 (giản `丬`: 3)   | —                     |
| 126 |   片   | Phiến    |    #91     | **CHƯA CÓ TRONG DB** | —             |        —        |          4          | —                     |
| 127 |   牙   | Nha      |    #92     | Đã có                | `radical-082` |       82        |          4          | bộ Nha                |
| 128 |   玄   | Huyền    |    #95     | **CHƯA CÓ TRONG DB** | —             |        —        |          5          | —                     |

---

## Bộ 109: 戈 (Qua)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-117` · `radical_index`: `117` · `strokes`: `4` nét · `name_vi`: `bộ Qua` · Khang Hy `#62` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `戈` — dạng chính duy nhất (4 nét: `一 ㇂ 丿 丶`); đứng độc lập, đứng **bên phải** chữ ghép (`战, 戏, 戳`), hoặc làm khung bao từ phía trên-phải (`戒, 成, 或, 截`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cây qua** — một loại binh khí cán dài có lưỡi ngang nhọn để móc và đâm thời Thương–Chu.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Chiến tranh, vũ khí, đánh trận, tấn công (`战, 戎`) → **phòng bị, canh giữ, răn đe** (`戒, 戍`) → **cắt chặt, hoàn thành bình định, mang vác** (`截, 成, 戴`). Trong nhiều chữ hiện đại (`我, 戏, 或`), `戈` là thành phần cấu tạo cổ hoặc giả tá, không nên suy diễn trực tiếp thành "vũ khí".
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `戈` thường liên quan đến vũ khí cổ, chiến đấu, răn đe, phòng bị, cắt chặn, hoặc làm thành phần cấu tạo cổ.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`戈` (Qua — 4 nét: `一 ㇂ 丿 丶`) vs `弋` (Dặc — 3 nét: `一 ㇂ 丶`):** `戈` có **1 nét phẩy `丿`** cắt ngang thân đường xiên móc (tượng hình lưỡi qua); `弋` (bộ riêng `#56`, nghĩa gốc: cọc gỗ / tên buộc dây) **không có nét phẩy** cắt chéo thân (gặp trong `式, 代, 试`).
    - **`戈` vs `戊` / `戌` / `戍` / `成`:**
      - `戊` (`wù`, Mậu — 5 nét): thêm 1 nét phẩy dài `丿` bên trái bao ngoài `戈`, bên trong trống.
      - `戌` (`xū`, Tuất — 6 nét): giống `戊` nhưng bên trong có **1 nét ngang `一`**.
      - `戍` (`shù`, Thú — 6 nét): giống `戊` nhưng bên trong có **1 nét chấm `丶`** (người cầm qua canh gác).
      - `成` (`chéng`, Thành — 6 nét): bên trái có nét phẩy + ngang gập móc (`𠃌`), bên phải là `戈`.
    - **Lưu ý với `我` (`wǒ`):** `我` xếp ở bộ `戈` nhưng học hiện đại cần nhớ trực tiếp là đại từ "tôi", không giảng máy móc theo nghĩa "vũ khí".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Binh khí, chiến tranh, phòng bị & hành động mạnh

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                  |
| :-----: | :----: | :------: | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   戈    |   gē   |   Qua    | Đứng độc lập                     | [Tra bộ 戈] Tượng hình cây qua cán dài lưỡi ngang; chỉ binh khí cổ, chiến tranh (干戈: can qua/chiến tranh, 倒戈: quay giáo đầu hàng).                                          |
|   战    |  zhàn  |  Chiến   | `占` + `戈` (Phồn `戰`: `單+戈`) | [Tra bộ 戈] Hình thanh kiêm hội ý: chiến tranh, chiến đấu, giao tranh, run rẩy (战争 zhànzhēng: chiến tranh, 战斗 zhàndòu: chiến đấu, 挑战 tiǎozhàn: thách thức).               |
|   戒    |  jiè   |   Giới   | `廾` (hai tay) + `戈`            | [Tra bộ 戈] Hội ý: hai tay cầm binh khí đề phòng → cảnh giác, răn đe, kiêng/cai, chiếc nhẫn (戒烟 jièyān: cai thuốc, 警戒 jǐngjiè: cảnh giác, 戒指 jièzhi: nhẫn đeo tay).       |
|   戍    |  shù   |   Thú    | `人` (phẩy + chấm) + `戈`        | [Tra bộ 戈] Hội ý: người cầm qua đứng gác → đóng quân phòng thủ, canh giữ biên ải (卫戍 wèishù: phòng vệ kinh thành, 戍边 shùbiān: trấn giữ biên cương).                        |
|   戎    |  róng  |  Nhung   | `戈` + `十` (giáp trụ lồng trái) | [Tra bộ 戈] Hội ý: vũ khí `戈` kết hợp áo giáp → binh nhung, việc quân sự, tộc Tây Nhung xưa (兵戎 bīngróng: binh đao, 投笔从戎 tóubǐ-cóngróng: xếp bút nghiên theo việc binh). |
|   戳    |  chuō  |   Trạc   | `翟` + `戈`                      | [Tra bộ 戈] Hình thanh: `翟` gợi âm cổ + `戈` (mũi nhọn) → đâm thủng, chọc, đóng dấu, con dấu (戳穿 chuōchuān: vạch trần, 邮戳 yóuchuō: dấu bưu điện).                          |

### Nhóm B: Thành tựu, cắt chặn, mang vác & họ hàng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung              | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                 |
| :-----: | :----: | :------: | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   成    | chéng  |  Thành   | Phần trái (`丿 𠃌`) + `戈`         | [Tra bộ 戈] Hội ý cổ: dùng vũ khí bình định xong → hoàn thành, thành công, trở thành, một phần mười (成功 chénggōng: thành công, 完成 wánchéng: hoàn thành).   |
|   截    |  jié   |   Tiệt   | `𢦏` (`十+戈`) + `隹`              | [Tra bộ 戈] Hình thanh kiêm hội ý: dùng lưỡi qua cắt đứt → cắt ngang, chặn lại, đoạn/khúc, tính đến mốc (截断 jiéduàn: cắt đứt, 截至 jiézhì: tính đến).        |
|   戴    |  dài   |   Đái    | `𢦏` (`十+戈`) + `異`              | [Tra bộ 戈] Hình thanh kiêm hội ý: `𢦏` gợi âm + `異` đội lên đầu → đội (mũ), đeo (kính/đồng hồ), tôn kính (戴帽子 dài màozi: đội mũ, 戴眼镜: đeo kính).       |
|   戚    |   qī   |  Thích   | `戊/戈` + `尗`                     | [Tra bộ 戈] Cổ tự là một loại búa rìu; giả tá chỉ họ hàng thân thích, nỗi buồn thương (亲戚 qīnqi: họ hàng, 休戚相关 xiūqī-xiāngguān: sướng khổ có nhau).      |
|   戏    |   xì   |    Hí    | `又` + `戈` (Phồn `戲`: `虍豆+戈`) | [Tra bộ 戈] Giản thể thay phần trái của `戲` bằng `又`; vui đùa, trêu chọc, kịch, trò chơi (戏剧 xìjù: kịch nghệ, 游戏 yóuxì: trò chơi, 看戏 kànxì: xem kịch). |

### Nhóm C: Đại từ, giả tá & Thiên Can / Địa Chi

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                 |
| :-----: | :----: | :------: | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   我    |   wǒ   |   Ngã    | `丿` + nét nâng trái + `戈` | [Tra bộ 戈] Cổ tự vẽ binh khí có răng cưa; sớm giả tá làm đại từ ngôi thứ nhất: tôi, ta, chúng tôi (我们 wǒmen: chúng tôi, 我的 wǒde: của tôi).                |
|   或    |  huò   |   Hoặc   | `口` + `一` + `戈`          | [Tra bộ 戈] Hội ý cổ: lãnh thổ có tường thành bảo vệ bằng vũ khí (tiền thân của `域`, `国`); giả tá nghĩa: hoặc là, có lẽ (或者 huòzhě: hoặc là, 或许: có lẽ). |
|   戊    |   wù   |   Mậu    | `丿` + `戈`                 | [Tra bộ 戈] Cổ tự tượng hình cây búa lớn; dùng làm Thiên can thứ 5 trong hệ thống 10 Thiên can (戊戌变法 Wùxū Biànfǎ: cuộc biến pháp năm Mậu Tuất).            |
|   戌    |   xū   |   Tuất   | `戊` + `一` bên trong       | [Tra bộ 戈] Địa chi thứ 11 trong 12 Địa chi — chi Tuất (con chó, giờ Tuất 19h–21h) (戌时 xūshí: giờ Tuất, 戊戌: năm Mậu Tuất).                                 |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `找` (`zhǎo` · Trảo · `扌 + 戈` — tìm kiếm, trả lại tiền thừa: `寻找`, `找钱`; xếp bộ `手/扌`).
- `划` (`huá / huà` · Hoa / Hoạch · `戈 + 刂` — chèo thuyền, vạch kế hoạch: `划船`, `计划`; xếp bộ `刀/刂`).
- `钱` (`qián` · Tiền · `钅 + 戋`, Phồn `錢` dùng `戔` — tiền bạc: `赚钱`, `钱包`; xếp bộ `金/钅`).
- `浅` (`qiǎn` · Thiển · `氵 + 戋` — nông, cạn, màu nhạt: `深浅`, `浅色`; xếp bộ `水/氵`).
- `线` (`xiàn` · Tuyến · `纟 + 戋` — sợi chỉ, đường dây: `电线`, `路线`; xếp bộ `糸/纟`).
- `残` (`cán` · Tàn · `歹 + 戋` — tàn dư, tàn khốc: `残忍`, `残疾`; xếp bộ `歹`).
- `越` (`yuè` · Việt · `走 + 戋` — vượt qua: `超越`, `越来越`; xếp bộ `走`).
- `载 / 栽` (`zài / zāi` · Tải / Tài · chứa `𢦏 = 十 + 戈` — chở/tải và trồng cây: `下载`, `栽培`; lần lượt xếp bộ `車/车` và `木`).
- `武` (`wǔ` · Vũ · `止 + 戈` — võ thuật, vũ lực: `武术`, `武器`; xếp bộ `止`).
- `城 / 域` (`chéng / yù` · Thành / Vực · chứa `成` hoặc `或` — thành phố, khu vực: `城市`, `区域`; xếp bộ `土`).
- `岁 / 歲` (`suì` · Tuế — Phồn thể `歲` có `步 + 戌(戈)`, xếp bộ `止`; Giản thể `岁` viết `山 + 夕`, xếp bộ `山`).
- `弋` (`yì` · Dặc — bộ riêng `#56`, 3 nét, nhìn giống `戈` nhưng thiếu nét phẩy chéo giữa, gặp trong `式`, `代`, `试`).

---

## Bộ 110: 支 (Chi)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-119` · `radical_index`: `119` · `strokes`: `4` nét · `name_vi`: `bộ Chi` · Khang Hy `#65` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `支` — dạng chính duy nhất (4 nét: `一 丨 ㇇ ㇏`, gồm `十` trên và `又` dưới); đứng độc lập, đứng bên phải chữ ghép (`枝, 技, 肢, 歧, 攲`), hoặc làm khung bao trái-dưới (`翅`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý cổ: bàn tay (`又`) bẻ hoặc cầm một cành tre/cành cây (`十`); nghĩa gốc là **cành nhánh** tách ra từ thân chính.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Từ **cành nhánh** mở rộng sang **chi nhánh, phân nhánh** (`分支, 支行`) → **chống đỡ, nâng đỡ** (`支持, 支撑`) → **chi trả, điều phối, lượng từ cho vật thon dài như cành/bút hoặc đội quân** (`支出, 支票, 一支笔`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `支` thường gợi ý cành nhánh, chống đỡ, phân chia, hoặc đóng vai trò thanh phù phát âm `zhi` (`枝, 肢`) / biến âm `ji` (`技`). Lưu ý bản thân bộ `支` có rất ít chữ xếp trực tiếp dưới bộ; phần lớn chữ quen thuộc (`枝, 技, 肢`) xếp ở bộ nghĩa bên trái.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`支` vs `枝` / `肢` / `技`:** `支` đứng độc lập nghĩa gốc là nhánh/chống đỡ/chi trả; thêm `木` thành `枝` (cành cây thật); thêm `月/肉` thành `肢` (tay chân/tứ chi); thêm `扌` thành `技` (kỹ năng/thao tác tay).
    - **`支` (bộ Chi `#65`) vs `攴 / 攵` (bộ Phộc `#66`):** `支` trên là `十` (nét ngang trên + sổ dọc), dưới là `又`; `攴` trên là `卜`, dưới là `又` (tay cầm gậy gõ/đánh).
    - **`支` vs `友` / `发`:** `友` (bộ Hựu) nét đầu là ngang + phẩy `𠂇`; `支` nét đầu là chữ thập `十`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

> _Lưu ý tra cứu:_ Trong hệ thống 214 bộ Khang Hy, bộ `支` (`#65`) có rất ít chữ xếp trực tiếp dưới bộ (`支, 攲, 攰, 攱`); ngoài ra một số bảng tra chữ Giản thể hiện đại xếp `翅` theo khung bao trái-dưới `支` (trong khi Khang Hy xếp `翅` ở bộ `羽`).

### Nhóm A: Cành nhánh, chống đỡ & chữ xếp chính thức bộ `支` (Khang Hy #65)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                    |
| :-----: | :----: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   支    |  zhī   |   Chi    | Đứng độc lập          | [Tra bộ 支] Tay cầm cành tre → cành nhánh, chống đỡ, chi trả, phân nhánh, lượng từ cho bút/ca khúc (支持 zhīchí: ủng hộ, 支票 zhīpiào: séc, 一支笔: một cây bút). |
|   攲    |   qī   |   Khi    | `奇` + `支`           | [Tra bộ 支] Hình thanh (`奇` thanh phù): nghiêng lệch, tựa nghiêng, không ngay ngắn (攲斜 qīxié: nghiêng lệch, 攲侧 qīcè: nghiêng về một bên).                    |
|   攰    |  guì   |   Quỹ    | `支` + `力`           | [Tra bộ 支] Hội ý kiêm thanh: chống đỡ hết sức lực → kiệt sức, mệt rã rời (攰惓 guìquán: mệt lả trong văn cổ; vẫn dùng phổ biến trong khẩu ngữ Quảng Đông).       |
|   攱    |  guǐ   |   Quỷ    | `支` + `危`           | [Tra bộ 支] Cổ tự trong Khang Hy (`支` + 6 nét): giá đỡ, cất giữ, gác đồ vật lên cao (ít dùng trong tiếng Trung hiện đại).                                        |

### Nhóm B: Chữ mang khung `支` có khác biệt tra cứu (Bảng tra Giản thể xếp `支` / Khang Hy xếp `羽`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                          |
| :-----: | :----: | :------: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   翅    |  chì   |    Sí    | `支` (ôm trái-dưới) + `羽` | [Bảng tra Giản thể: bộ 支 / Khang Hy: bộ 羽] `支` (chìa ra hai bên) + `羽` (lông vũ) → cánh chim, vây cá (翅膀 chìbǎng: đôi cánh, 鸡翅 jīchì: cánh gà). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `枝` (`zhī` · Chi · `木 + 支` — cành cây thật: `树枝`, `枝叶`; xếp bộ `木`).
- `技` (`jì` · Kỹ · `扌 + 支` — kỹ năng, tay nghề: `技术`, `技能`, `科技`; xếp bộ `手/扌`).
- `肢` (`zhī` · Chi · `月(肉) + 支` — tay chân, chi thể: `四肢`, `下肢`; xếp bộ `肉/月`).
- `歧` (`qí` · Kỳ · `止 + 支` — ngã rẽ, bất đồng: `分歧`, `歧视`; xếp bộ `止`).
- `伎` (`jì` · Kỹ · `亻 + 支` — thủ đoạn, ca kỹ: `伎俩`; xếp bộ `人/亻`).
- `鼓` (`gǔ` · Cổ — bộ riêng `#207`, phần phải hiện đại viết giống `支` nhưng gốc cổ là `攴` chỉ tay cầm dùi đánh trống).
- `攴 / 攵` (`pū` · Phộc — bộ riêng `#66`, tay cầm gậy tác động, có nét `卜` ở trên chứ không phải `十`).
- `又` (`yòu` · Hựu — bộ riêng `#29`, tay phải, chính là nửa dưới của chữ `支`).

---

## Bộ 111: 斗 (Đẩu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-121` · `radical_index`: `121` · `strokes`: `4` nét · `name_vi`: `bộ Đẩu` · Khang Hy `#68` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `斗` — dạng chính duy nhất (4 nét: `丶 丶 一 丨`); đứng độc lập hoặc đứng **bên phải** chữ ghép (`料, 斜, 斟, 斡, 斛`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cái đấu đong** hoặc chiếc gáo múc có cán dài thời cổ (dụng cụ đo thể tích lương thực: 1 đấu = 10 thăng).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Đo lường, cái đấu/gáo múc, chòm sao Bắc Đẩu (`北斗`) → **đong đếm, tính toán vật liệu** (`料`), **nghiêng rót cái gáo** (`斜, 斟`), **xoay cán gáo điều phối** (`斡`). Riêng chữ Giản thể `斗` còn mang nghĩa **đấu tranh, đánh nhau** (`斗争, 战斗`) do giản hóa đồng hình từ bộ `#191 鬥`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `斗` thường liên quan đến đo lường, gáo múc, nghiêng rót, xoay chuyển; riêng trong văn bản Giản thể hiện đại, chữ `斗` đứng riêng hoặc ghép từ như `斗争, 战斗, 奋斗` lại mang nghĩa của chữ `鬥` (đánh nhau).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **111. `斗` (`dǒu`, Đẩu — Khang Hy `#68`, 4 nét) vs bộ 191 `鬥` (`dòu`, Đấu — Khang Hy `#191`, 10 nét, `radical-221`):** Đây là **hai bộ thủ hoàn toàn khác nhau**. Bộ `#68 斗` nghĩa gốc là **cái đấu đong / cái gáo**; bộ `#191 鬥` nghĩa là **đánh nhau / đấu tranh** (hình hai người giao chiến). Khi giản hóa chữ Hán, `鬥` bị gộp cách viết thành `斗` (ví dụ `鬥爭 → 斗争`, `戰鬥 → 战斗`), nên một mặt chữ `斗` hiện đại gánh hai âm đọc và hai gốc nghĩa riêng biệt (`dǒu` ≠ `dòu`).
    - **Khác biệt cách viết chấm:** `斗` có 2 nét chấm xếp dọc (`丶 丶`) ở góc trên trái trước nét ngang và nét sổ; tránh nhầm với `头` (Đầu — 2 nét chấm trên trái, nét cuối là chấm dài `丶` vẩy phải chứ không phải nét sổ `丨`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Đấu đong, múc rót & đơn vị đo lường cổ

| Chữ Hán |  Pinyin   | Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| :-----: | :-------: | :-------: | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   斗    | dǒu / dòu | Đẩu / Đấu | Đứng độc lập          | [Tra bộ 斗] `dǒu`: cái đấu đong (10 thăng), chòm sao Bắc Đẩu (北斗 Běidǒu, 斗胆 dǒudǎn: gan to); `dòu` (giản thay `鬥` bộ #191): đấu tranh, đánh nhau (斗争, 战斗).  |
|   料    |   liào    |   Liệu    | `米` + `斗`           | [Tra bộ 斗] Hội ý: dùng đấu (`斗`) đong gạo (`米`) → đo lường, dự liệu, nguyên liệu, thức ăn gia súc (材料 cáiliào: vật liệu, 资料 zīliào: tư liệu, 预料: dự đoán).  |
|   斟    |   zhēn    |   Châm    | `甚` + `斗`           | [Tra bộ 斗] Hình thanh kiêm hội ý: dùng gáo/muôi (`斗`) rót rượu trà → rót (rượu, trà), cân nhắc kỹ lưỡng (斟酒 zhēnjiǔ: rót rượu, 斟酌 zhēnzhuó: cân nhắc suy xét). |
|   斛    |    hú     |    Hộc    | `角` + `斗`           | [Tra bộ 斗] Hình thanh kiêm hội ý: dụng cụ/đơn vị đo lường cổ bằng 10 (sau thành 5) đấu → cái hộc (石斛 shíhú: cây thạch hộc trong Đông y, 斗斛: đấu và hộc).        |
|   斝    |    jiǎ    |    Giả    | `吅` + `冖` + `斗`    | [Tra bộ 斗] Tượng hình cổ: chén đồng ba chân hai tai dùng rót rượu tế lễ thời Thương–Chu (玉斝 yùjiǎ: chén ngọc giả, dùng trong khảo cổ và văn học cổ).              |
|   斞    |    yǔ     |    Dũ     | `臾` + `斗`           | [Tra bộ 斗] Hình thanh kiêm hội ý: đơn vị đo dung tích cổ tương đương 16 đấu (dùng trong thư tịch Chu Lễ và văn ngôn cổ).                                            |

### Nhóm B: Nghiêng rót, xoay chuyển & hiệu chuẩn dụng cụ đong

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                        |
| :-----: | :----: | :------: | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   斜    |  xié   |    Tà    | `余` + `斗`           | [Tra bộ 斗] Hình thanh kiêm hội ý: nghiêng cái gáo để rót nước ra → nghiêng, xiên, dốc, lệch (倾斜 qīngxié: nghiêng lệch, 斜坡 xiépō: dốc nghiêng, 斜线: đường chéo). |
|   斡    |   wò   |   Oát    | `𠦝` + `斗`           | [Tra bộ 斗] Hình thanh kiêm hội ý: xoay chuyển cán gáo/bánh xe → xoay chuyển, điều phối, đứng ra hòa giải (斡旋 wòxuán: điều đình, hòa giải).                         |
|   斠    |  jiào  |   Giác   | `冓` + `斗`           | [Tra bộ 斗] Hình thanh kiêm hội ý: dùng thanh gỗ gạt phẳng miệng đấu khi đong để bảo đảm công bằng → hiệu chuẩn đo lường (斠量 jiàoliáng: đong đo đối chiếu).         |
|   斘    | shēng  |  Thăng   | `斗` + `丿`           | [Tra bộ 斗] Cổ tự của chữ `升` (thăng — đơn vị đong bằng 1/10 đấu) được lưu trong bảng Khang Hy `#68`; hiện đại dùng `升` (xếp bộ `十`).                              |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `科` (`kē` · Khoa · `禾 + 斗` — gốc là dùng đấu đo thóc để phân hạng → môn khoa học, khoa mục, phòng ban: `科学`, `眼科`, `本科`; xếp bộ `禾`).
- `抖` (`dǒu` · Đẩu · `扌 + 斗` — rung lắc, run rẩy: `发抖`, `抖动`; xếp bộ `手/扌`, `斗` ghi âm).
- `陡` (`dǒu` · Đẩu · `阝 + 斗` — dốc đứng, đột ngột: `陡峭`, `陡坡`; xếp bộ `阜/阝 trái`, `斗` ghi âm).
- `蚪` (`dǒu` · Đẩu · `虫 + 斗` — nòng nọc: `蝌蚪`; xếp bộ `虫`, `斗` ghi âm).
- `升` (`shēng` · Thăng — 1/10 đấu, tăng lên: `上升`, `一升水`; xếp bộ `十`).
- `鬥` (`dòu` · Đấu — bộ thủ riêng `#191`, `radical-221`, 10 nét — đánh nhau, đấu tranh; giản thể gộp mặt chữ thành `斗` như trong `斗争`, `战斗`, `奋斗`).

---

## Bộ 112: 斤 (Cân)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-122` · `radical_index`: `122` · `strokes`: `4` nét · `name_vi`: `bộ Cân` · Khang Hy `#69` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `斤` — dạng chính duy nhất (4 nét: `丿 丿 一 丨`); đứng độc lập, nằm bên dưới (`斧`), hoặc thường đứng **bên phải** chữ ghép (`斩, 断, 新, 斯, 所`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cái rìu / cái búa** lưỡi cong có cán cong thời cổ dùng để chặt cây, đẽo gỗ. Về sau, lưỡi rìu đồng chuẩn khối lượng được dùng làm quả cân, tạo thành đơn vị trọng lượng "cân".
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Từ **rìu chặt** phát triển thành **chặt, chém, cắt đứt, tách biệt** (`斧, 斩, 断, 斫`) → **chặt củi lấy gỗ mới** (`新`) → **xua đuổi bằng vũ lực** (`斥`) → **đơn vị cân nặng** trong đời sống (`公斤, 斤两`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `斤` trong chữ ghép (`新, 断, 斩, 斧`) thường gợi nghĩa cái rìu, chặt/cắt/phân tách hoặc âm `xin / jin / qin` (`近, 欣, 听`). Khi đứng độc lập hiện đại (`斤`), nghĩa thông dụng nhất là đơn vị cân nặng (1 `斤` tại Trung Quốc đại lục = 500g = 0,5 `公斤`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`斤` (Cân — cái rìu) vs `刀 / 刂` (Đao — con dao):** `斤` là rìu bổ/chặt có cán; `刀/刂` là con dao gọt/cắt sắc mỏng.
    - **`斤` vs `斥`:** `斥` là chữ `斤` thêm 1 nét chấm `丶` bên trong (5 nét, bộ `斤`), nghĩa là xua đuổi, quở trách.
    - **`斤` vs `厂` / `广`:** `斤` nét đầu là **phẩy ngắn ngang đỉnh** (`丿`), nét thứ hai là phẩy dọc trái, rồi đến ngang và sổ thẳng giữa.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cái rìu, chặt chém, cắt đứt & trọng lượng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                 |
| :-----: | :----: | :------: | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   斤    |  jīn   |   Cân    | Đứng độc lập                        | [Tra bộ 斤] Cổ tự vẽ cái rìu; hiện đại là đơn vị cân nặng (500g ở Trung Quốc), cân nhắc chi li (公斤 gōngjīn: kilôgam, 斤斤计较: tính toán so đo từng li).     |
|   斧    |   fǔ   |   Phủ    | `父` (trên) + `斤` (dưới)           | [Tra bộ 斤] Hình thanh kiêm hội ý: `父` (`fù`, thanh phù) + `斤` (cái rìu) → cái rìu, cái búa (斧头 fǔtou: cái rìu, 大刀阔斧 dàdāo-kuòfǔ: mạnh tay dứt khoát). |
|   斩    |  zhǎn  |   Trảm   | `车` + `斤` (Phồn `斬`: `車+斤`)    | [Tra bộ 斤] Hội ý cổ: xe và rìu (hình phạt chặt chém) → chặt, chém, cắt phăng dứt khoát (斩断 zhǎnduàn: chặt đứt, 斩钉截铁: chém đinh chặt sắt / dứt khoát).   |
|   断    |  duàn  |   Đoạn   | `米` biến + `乚` + `斤` (Phồn `斷`) | [Tra bộ 斤] Hội ý: dùng rìu (`斤`) chặt đứt cuộn tơ (`𢇇` ở Phồn thể) → cắt đứt, gián đoạn, phán đoán (断开 duànkāi: ngắt, 不断: liên tục, 判断: phán đoán).   |
|   斫    |  zhuó  |   Trác   | `石` + `斤`                         | [Tra bộ 斤] Hội ý: dùng rìu/đục sắc đẽo đá, chặt gỗ → chặt, bổ, đẽo gọt (斫木 zhuómù: đẽo gỗ, 斫轮老手: thợ già khéo nghề đẽo bánh xe).                        |
|   斨    | qiāng  |  Thương  | `爿` + `斤`                         | [Tra bộ 斤] Hình thanh kiêm hội ý: cái rìu có lỗ tra cán hình vuông thời cổ (xuất hiện trong Kinh Thi: 既破我斧，又缺我斨).                                    |

### Nhóm B: Xua đuổi, mới mẻ, đại từ & nơi chốn

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                            |
| :-----: | :----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   斥    |  chì   |   Xích   | `斤` + `丶`           | [Tra bộ 斤] Chỉ sự: vung rìu đẩy lùi ra ngoài → bài xích, đuổi đi, quở trách, tràn ngập (排斥 páichì: bài xích, 斥责 chìzé: khiển trách, 充斥: tràn ngập).                |
|   新    |  xīn   |   Tân    | `亲` + `斤`           | [Tra bộ 斤] Hình thanh kiêm hội ý: dùng rìu (`斤`) chặt cây (`亲/木`) lấy gỗ mới → mới mẻ, tân tiến, gần đây (新鲜 xīnxiān: tươi mới, 新闻: tin tức, 重新: làm lại).      |
|   斯    |   sī   |    Tư    | `其` + `斤`           | [Tra bộ 斤] Gốc nghĩa dùng rìu chặt tách củi; giả tá làm đại từ văn ngôn ("này, ấy"), nhã nhặn, và dùng phiên âm tên riêng (斯文 sīwén: nho nhã, 瓦斯: khí ga).           |
|   所    |  suǒ   |    Sở    | `户` + `斤`           | [Khang Hy: bộ 戶 / Nhiều bảng tra Giản thể: bộ 斤] Tiếng rìu đẽo gỗ trước cửa → nơi chốn, cơ quan, sở hữu, trợ từ (所以 suǒyǐ: cho nên, 厕所: nhà vệ sinh, 所有: tất cả). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `欣` (`xīn` · Hân · `斤 + 欠` — vui mừng, thưởng thức: `欣赏`, `欣喜`; xếp bộ `欠`).
- `听` (`tīng` · Thính · `口 + 斤` — nghe: `听说`, `听音乐`; Phồn thể `聽` xếp bộ `耳`, Giản thể xếp bộ `口`).
- `近` (`jìn` · Cận · `斤 + 辶` — gần gũi, gần đây: `最近`, `附近`; xếp bộ `辵/辶`).
- `折` (`zhé / shé / zhē` · Chiết · `扌 + 斤` — bẻ gãy, gập lại, giảm giá: `打折`, `折断`; xếp bộ `手/扌`).
- `析` (`xī` · Tích · `木 + 斤` — bổ gỗ tách ra → phân tích: `分析`, `解析`; xếp bộ `木`).
- `诉` (`sù` · Tố · `讠 + 斥` — kể lể, tố cáo: `告诉`, `投诉`; xếp bộ `言/讠`).
- `质` (`zhì` · Chất · `厂 + 十 + 贝`, Phồn `質` là hai `斤` trên `貝` — chất lượng, bản chất: `质量`, `素质`; xếp bộ `貝/贝`).
- `兵` (`bīng` · Binh · `斤 + 八` — hai tay cầm rìu → binh lính, vũ khí: `士兵`, `兵器`; xếp bộ `八`).
- `匠` (`jiàng` · Tượng · `匚 + 斤` — người thợ dùng rìu và hộp dụng cụ → thợ thủ công: `工匠`, `木匠`; xếp bộ `匚`).
- `祈 / 芹` (`qí / qín` — mang `斤` làm thanh phù, lần lượt xếp bộ `示/礻` và `艸/艹`).
- `暂 / 渐` (`zàn / jiàn` — mang `斩`, lần lượt xếp bộ `日` và `水/氵`).

---

## Bộ 113: 无 (Vô)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-133` · `radical_index`: `133` · `radical`: `"无 / 無"` · **`strokes`: `12` nét** _(lưu ý: giá trị `12` trong DB hiện tại đang đếm theo chữ Phồn thể `無`; bộ Khang Hy `#71` gốc viết `无` chỉ có **4 nét**)_ · `name_vi`: `bộ Vô` · Khang Hy `#71` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `无` — dạng chuẩn bộ thủ Khang Hy `#71` (4 nét: `一 一 丿 乚`) và cũng là chữ Giản thể thông dụng nhất hiện nay.
  - `無` — dạng Phồn thể (12 nét; trong từ điển Khang Hy xếp dưới bộ `火/灬`, nhưng DB hợp nhất cùng `无` ở `radical-133` và lấy số nét `12` theo `無`).
  - `旡` — biến thể phụ từng ghép chung trong bộ `#71` của Khang Hy (4 nét: `一 𠃍 丿 乚`, nghĩa gốc: nghẹn hơi, gặp trong `既, 暨`); lưu ý trong DB `hanzihome_radicals`, `旡` được tách thành dòng riêng `radical-134` (`radical_index: 134`, `name_vi: "bộ Ký"`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Chữ `無` trong Giáp cốt và Kim văn gốc là hình người cầm đuôi bò/lông chim nhảy múa cầu mưa (chữ gốc của `舞`); sau được giả tá rộng rãi sang nghĩa phủ định **"không, không có"**, còn chữ `无` (biến dạng cổ của `無`/`亡`) được chuẩn Giản thể chọn làm dạng chính thống.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Không, không có, chẳng, tiền tố phủ định (`无法, 无聊, 无论, 无限`). Trong nhiều chữ Giản thể ghép (`抚, 芜, 妩`), `无` đóng vai trò phần ghi âm thay thế cho `無`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Gặp `无` / `無` đứng riêng hoặc trong từ ghép thường mang nghĩa phủ định "không, thiếu vắng, vô-"; khi làm thành phần trong chữ Giản thể khác (`抚, 芜, 怃`), chủ yếu thay `無` để gợi âm `wu / fu`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`无` (Vô — 4 nét: `一 一 丿 乚`) vs `旡` (Ký — 4 nét: `一 𠃍 丿 乚`):** `无` có hai nét ngang song song (`一 一`) rồi sổ phẩy; `旡` nét thứ hai gập thẳng xuống từ nét ngang trên (`𠃍`), không có nét ngang thứ hai tách biệt, nghĩa là nghẹn/nấc hơi (làm phần phải của `既`).
    - **`无` vs `天` (Thiên) / `元` (Nguyên):** `天` nét cuối là nét mác `㇏` duỗi thẳng xuống phải; `无` nét cuối là sổ cong móc `乚` uốn lên. `元` nét ngang dưới dài hơn nét ngang trên và hai chân tách bên dưới nét ngang thứ hai (`二 + 儿`), khác `无` có nét phẩy xuyên từ nét ngang trên xuống.
    - **Lưu ý số nét DB:** Khi tra cứu bộ thủ 4 nét Khang Hy dùng `无` (4 nét), còn trên dữ liệu DB hiện tại `radical-133` đang ghi `12` nét theo Phồn thể `無`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

> _Lưu ý tra cứu:_ Bộ `无` (`#71`) là một trong các bộ có rất ít chữ trong tự điển; bên cạnh `无` (và dạng Phồn thể `無`), nhóm chữ truyền thống xếp dưới bộ `#71` còn có phần biến thể `旡` và các chữ ghép từ `旡` (`既, 暨`).

### Nhóm A: Phủ định "không, không có" (`无 / 無`)

| Chữ Hán | Pinyin  | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                         |
| :-----: | :-----: | :------: | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   无    | wú / mó |    Vô    | Đứng độc lập (Giản thể) | [Tra bộ 无] Không, không có, chẳng, vô- (无法 wúfǎ: hết cách, 无聊 wúliáo: chán nản, 无论 wúlùn: bất luận); đọc `mó` trong phiên âm Phật giáo 南无 (Námó: Nam mô).     |
|   無    | wú / mó |    Vô    | Đứng độc lập (Phồn thể) | [Khang Hy: bộ 火/灬 / DB: gộp cùng `radical-133`] Dạng Phồn thể 12 nét của `无`, vốn là hình người múa lễ cầu mưa được giả tá làm từ phủ định "không có" (無窮, 無論). |

### Nhóm B: Nghẹn hơi, ăn no & hoàn tất (`旡` ghép chung nhóm bộ #71)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                           |
| :-----: | :----: | :------: | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   旡    |   jì   |    Ký    | Đứng độc lập (biến thể)    | [Khang Hy: bộ 无 #71 / DB: tách `radical-134`] Cổ tự vẽ người quay đầu mở miệng vì nghẹn hơi/ăn no quá mức; hiện đại ít dùng độc lập, chủ yếu nằm trong `既`.            |
|   既    |   jì   |    Ký    | `艮` (tỉnh nét móc) + `旡` | [Tra bộ 无 (#71) / 艮] Hội ý: ăn xong quay lưng thở ra (`旡`) → đã, đã rồi, vừa... lại vừa... (既然 jìrán: đã... thì, 既定 jìdìng: đã định, 既往不咎: bỏ qua chuyện cũ). |
|   暨    |   jì   |    Kỵ    | `既` + `旦`                | [Tra bộ 无 (#71)] Hình thanh kiêm hội ý: `既` (thanh phù) + `旦` (mặt trời lên) → đến tận, và, cùng với (dùng trang trọng trong văn bản: ××暨××会议).                    |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `旡` (`jì` · Ký — biến thể cùng nhóm bộ `#71` trong Khang Hy, nhưng trong DB tách thành `radical-134`, `radical_index: 134`).
- `抚` (`fǔ` · Phủ · `扌 + 无`, Phồn `撫` — vỗ về, an ủi: `抚摸`, `安抚`; xếp bộ `手/扌`, `无` thay `無` ghi âm).
- `芜` (`wú` · Vu · `艹 + 无`, Phồn `蕪` — cỏ mọc hoang rậm: `荒芜`; xếp bộ `艸/艹`).
- `妩` (`wǔ` · Vũ · `女 + 无`, Phồn `嫵` — duyên dáng, kiều diễm: `妩媚`; xếp bộ `女`).
- `怃` (`wǔ` · Vũ · `忄 + 无`, Phồn `憮` — buồn bã, thẫn thờ: `怃然`; xếp bộ `心/忄`).
- `庑` (`wǔ` · Vũ · `广 + 无`, Phồn `廡` — mái hiên nhà xưa: `廊庑`; xếp bộ `广`).
- `舞` (`wǔ` · Vũ · gốc cùng nguồn tượng hình múa với `無` + `舛` hai bàn chân nhảy múa — nhảy múa: `跳舞`, `舞蹈`; xếp bộ `舛`).
- `天 / 元` (`tiān / yuán` — hình dáng dễ nhầm với `无`, lần lượt xếp bộ `大` và `儿`).

---

## Bộ 114: 曰 (Viết)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-125` · `radical_index`: `125` · `strokes`: `4` nét · `name_vi`: `bộ Viết / 曰` · Khang Hy `#73` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `曰` — dạng chính duy nhất (4 nét: `丨 𠃍 一 一`, nét ngang giữa chạm nét sổ trái nhưng thường ngắn hoặc khít khung); đứng độc lập, đứng trên (`最, 曼, 曷`), ở giữa (`曹`), hoặc đứng dưới (`曾, 替, 書`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cái miệng đang mở ra và có làn hơi/lời nói thoát ra bên trên** (giáp cốt văn vẽ `口` kèm một nét cong nhỏ phía trên chỉ âm thanh/lời nói), nghĩa gốc là **"nói, nói rằng"**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Dùng trực tiếp trong văn ngôn, trích dẫn kinh điển (`子曰: Khổng Tử nói rằng`). Trong phần lớn chữ Hán hiện đại xếp dưới bộ `曰` (`曲, 更, 曾, 最, 替, 曼`), `曰` không xuất phát từ nghĩa "nói" mà do quá trình Khải thư hóa đã biến đổi các hình tượng cổ khác (cái giỏ, chõ đồ xôi, chiếc mũ `冃`) thành mặt chữ giống `曰`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Gặp `曰` đứng độc lập trong câu cổ văn là "nói rằng"; khi nằm trong chữ ghép hiện đại (`最, 曾, 更, 曹`), người học nên nhận biết mặt chữ để tra cứu hơn là suy đoán nghĩa "lời nói" một cách máy móc.
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `曰` vs `日` vs `口`:_
    - **`曰` (`yuē`, Viết — bộ `#73`) vs `日` (`rì`, Nhật — bộ `#72`):**
      1. **Hình dáng:** Trong thư pháp và chữ in chuẩn truyền thống, `曰` có dáng **bè ngang, rộng và thấp** (tượng trưng cái miệng); còn `日` có dáng **cao và hẹp theo chiều dọc** (tượng trưng vầng mặt trời). Tuy nhiên ở nhiều font chữ Giản thể hiện đại và phần ghép nhỏ bên trong chữ (`最, 曼, 曾`), nét ngang-dọc gần như bằng nhau khiến mắt thường rất dễ nhầm.
      2. **Ý nghĩa:** `曰` là **nói rằng** (thuộc lời nói); `日` là **mặt trời / ngày** (thuộc thời gian, ánh sáng như `明, 早, 时, 春`).
      3. **Quy tắc tra từ điển:** Chữ cổ điển như `曲, 曳, 更, 曹, 曾, 替, 最, 曼` theo Khang Hy đều tra ở bộ `曰`; một số bảng tra Giản thể rút gọn có thể quy một phần sang `日` cho tiện đếm nét.
    - **`曰` (4 nét) vs `口` (Khẩu — 3 nét):** `口` bên trong rỗng hoàn toàn; `曰` có thêm 1 nét ngang ở giữa.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Lời nói, dẫn lời & văn thư đối đáp

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                   |
| :-----: | :----: | :------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   曰    |  yuē   |   Viết   | Đứng độc lập          | [Tra bộ 曰] Tượng hình miệng phát ra lời nói → nói, nói rằng, gọi là (dùng trong văn ngôn, trích dẫn: 子曰 Zǐ yuē: Khổng Tử nói rằng, 美其名曰: gọi mỹ miều là). |
|   曷    |   hé   |   Hạt    | `曰` + `匃`           | [Tra bộ 曰] Hội ý/thanh cổ: lời hỏi vặn lại → sao, há, bao giờ (trong văn ngôn: 曷不: sao chẳng?; làm thanh phù cho loạt chữ `喝, 渴, 褐`).                      |
|   曹    |  cáo   |   Tào    | `𠩺` + `曰`           | [Tra bộ 曰] Hội ý cổ: hai bên đối chất lời nói (`曰`) trước công đường → bọn/nhóm người, cơ quan xưa, họ Tào (曹操 Cáo Cāo: Tào Tháo, 阴曹地府: âm phủ).         |

### Nhóm B: Chữ Khải thư hóa mang dạng `曰` — hành động, biến đổi & thay thế

| Chữ Hán |   Pinyin    |  Hán Việt   | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                   |
| :-----: | :---------: | :---------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   曲    |   qū / qǔ   |    Khúc     | Khung `曰` + 2 sổ dọc | [Tra bộ 曰] Cổ tự tượng hình cái giỏ đan hoặc góc uốn → `qū`: cong, quanh co, oan khuất (弯曲, 委曲); `qǔ`: bài hát, giai điệu (歌曲 gēqǔ, 戏曲).                |
|   曳    |     yè      |     Duệ     | `曰` + `丿` + `㇂`    | [Tra bộ 曰] Tượng hình cổ: kéo sợi dây dài → lôi, kéo lê, lay động (摇曳 yáoyè: đung đưa nhẹ nhàng, 拖曳 tuōyè: kéo lê).                                         |
|   更    | gēng / gèng | Canh / Cánh | `一` + `曰` + `乂`    | [Tra bộ 曰] Hội ý cổ: bàn tay cầm roi đổi mới/sửa → `gēng`: thay đổi, canh giờ đêm (更改, 三更); `gèng`: càng, hơn nữa (更好 gènghǎo: tốt hơn, 更加: càng thêm). |
|   替    |     tì      |     Thế     | `夫 + 夫` + `曰`      | [Tra bộ 曰] Khải thư biến từ hình hai người đứng song song → thay thế, làm thay, giúp cho (代替 dàitì: thay thế, 替换 tìhuàn: đổi thay, 替身: người đóng thế).   |

### Nhóm C: Tầng lớp, cực điểm, kéo dài & chữ viết (`書`)

| Chữ Hán |   Pinyin    |  Hán Việt   | Thiên bàng đứng chung        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                               |
| :-----: | :---------: | :---------: | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 書 / 书 |     shū     |     Thư     | Phồn `聿` + `曰` (Giản `书`) | [Khang Hy `書`: bộ 曰 / Giản thể `书`: bộ 乛] Bút (`聿`) viết lời lên sách → viết, sách vở, thư từ (看书 kànshū: đọc sách, 书法: thư pháp, 秘书: thư ký).    |
|   曾    | céng / zēng | Tằng / Tăng | `丷 + 𠮛` + `曰`             | [Tra bộ 曰] Cổ tự là cái chõ đồ xôi có hơi bốc → `céng`: đã từng (曾经 céngjīng); `zēng`: tầng trên/xa hơn (曾祖: cụ, 曾孙: chắt), họ Tăng.                  |
|   最    |     zuì     |     Tối     | `曰` (từ `冃`) + `取`        | [Tra bộ 曰] Hội ý cổ: đội mũ (`冃` biến thành `曰`) giành công đầu → nhất, cực điểm, tối đa (最好 zuìhǎo: tốt nhất, 最近 zuìjìn: gần đây, 最多: nhiều nhất). |
|   曼    |     màn     |     Mạn     | `曰` (từ `冃`) + `罒` + `又` | [Tra bộ 曰] Hội ý cổ: kéo dài dây mũ/vải → dài, dịu dàng, uyển chuyển (曼妙 mànmiào: thướt tha, 浪漫 làngmàn: lãng mạn, 轻歌曼舞: hát nhẹ múa dẻo).          |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `日` (`rì` · Nhật — bộ riêng `#72`, dáng hẹp cao hơn `曰`, nghĩa là mặt trời/ngày; cặp dễ nhầm nhất với `曰`).
- `昌` (`chāng` · Xương · `日 + 曰` — phồn thịnh, sáng rực: `昌盛`, `繁荣昌盛`; xếp bộ `日`).
- `會 / 会` (`huì / kuài` · Hội — Phồn thể `會` chứa `曾` rút gọn xếp bộ `曰`; Giản thể `会` viết `人 + 云`, xếp bộ `人`: `开会`, `机会`).
- `喝 / 渴 / 褐` (`hē / kě / hè` — mang `曷` chứa `曰` làm thanh phù, lần lượt xếp bộ `口`, `水/氵`, `衣/衤`).
- `慢 / 漫 / 蔓` (`màn` — mang `曼` chứa `曰` làm thanh phù, lần lượt xếp bộ `心/忄`, `水/氵`, `艸/艹`).
- `增 / 赠 / 僧` (`zēng / zèng / sēng` — mang `曾` chứa `曰` làm thanh phù, lần lượt xếp bộ `土`, `貝/贝`, `人/亻`).
- `遭 / 糟` (`zāo` — mang `曹` chứa `曰` làm thanh phù, lần lượt xếp bộ `辵/辶` và `米`).
- `口` (`kǒu` · Khẩu — bộ riêng `#30`, 3 nét, không có nét ngang ở giữa).

---

## Bộ 115: 歹 (Đãi)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-127` · `radical_index`: `127` · `strokes`: `4` nét · `name_vi`: `bộ Đãi / Ngạt` · Khang Hy `#78` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `歹` — dạng chính thông dụng (4 nét: `一 丿 ㇇ 丶`); thường đứng **bên trái** chữ ghép (`残, 殊, 殉, 殖, 殃`), hoặc đứng ở bên trên-trái (`死`).
  - `歺` — dạng cổ / biến thể **Ngạt** (ít gặp độc lập, bảo lưu trong thành phần chữ như `餐, 列`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **đống xương tàn, mẩu xương vỡ còn sót lại** của người chết hay thú vật; đọc cổ là Ngạt (`è`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Từ **xương tàn / cái chết** phát triển thành **tử vong, chết chóc, tang lễ** (`死, 殉, 殇, 殁, 殓, 殡`) → **hư hại, tàn dư, tai họa, tiêu diệt** (`残, 殃, 殆, 歼, 殚`) → **xấu xa, hung ác** khi đứng độc lập (`歹徒, 好歹`). Một số chữ như `殊` (đặc biệt) và `殖` (sinh sản, thực dân) đã chuyển nghĩa rất xa nghĩa gốc.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `歹` ở bên trái gần như luôn mang trường nghĩa chết chóc, tang ma, thương tật, hư nát, tàn dư, tai họa hoặc điều xấu.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`歹` (Đãi — 4 nét) vs `夕` (Tịch — 3 nét):** `歹` nhìn giống hệt chữ `夕` có thêm **1 nét ngang `一` ở trên đỉnh**. `歹` chỉ **cái chết, tàn dư, xấu xa**; `夕` chỉ **chiều tối, ban đêm** (`多, 外, 夜, 梦`).
    - **`歹` vs `死`:** `死` gồm `歹` + `匕` (người gục bên xương tàn), thuộc bộ `歹`.
    - **Chú ý nghĩa chuyển xa trong `殊` và `殖`:** `殊` (`特殊`: đặc biệt) gốc là chặt lìa/chết tách rời → khác biệt, đặc biệt; `殖` (`繁殖`: sinh sôi) gốc là xương thịt phân hủy làm màu mỡ đất → sinh sôi nảy nở.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cái chết, tử vong & hy sinh

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                |
| :-----: | :----: | :------: | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   歹    |  dǎi   |   Đãi    | Đứng độc lập                    | [Tra bộ 歹] Gốc là xương tàn; hiện đại nghĩa xấu, ác, bất lương, dở hay (歹徒 dǎitú: kẻ xấu/côn đồ, 好歹 hǎodǎi: tốt xấu/dù sao, 为非作歹: làm điều ác).                      |
|   死    |   sǐ   |    Tử    | `歹` (ôm trên-trái) + `匕`      | [Tra bộ 歹] Hội ý: người (`匕`) ngã gục bên xương tàn (`歹`) → chết, tắt, cứng nhắc, cực độ (死亡 sǐwáng: tử vong, 生死: sống chết, 饿死了: đói chết đi được).                |
|   殉    |  xùn   |   Tuẫn   | `歹` + `旬`                     | [Tra bộ 歹] Hình thanh kiêm hội ý: `歹` (chết) + `旬` (thanh phù) → chôn sống theo người chết xưa, hy sinh vì nghĩa/chức trách (殉职 xùnzhí: hy sinh khi làm nhiệm vụ, 殉国). |
|   殇    | shāng  |  Thương  | `歹` + `𠆢/昜` tỉnh (Phồn `殤`) | [Tra bộ 歹] Hình thanh kiêm hội ý: chết non, chết trẻ trước tuổi trưởng thành hoặc hy sinh vì tổ quốc (国殇 guóshāng: người hy sinh vì nước, 早殇: chết yểu).                 |
|   殁    |   mò   |   Một    | `歹` + `殳` tỉnh                | [Tra bộ 歹] Hội ý/hình thanh: chìm xuống cõi chết → chết, qua đời, khuất núi (dùng trong văn viết trang trọng: 病殁 bìngmò: chết vì bệnh, 殁世: suốt đời/qua đời).            |

### Nhóm B: Tàn dư, tai họa, nguy hiểm & tiêu diệt

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                    |
| :-----: | :----: | :------: | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   残    |  cán   |   Tàn    | `歹` + `戋` (Phồn `殘`: `戔`) | [Tra bộ 歹] Hình thanh kiêm hội ý: hư hại còn sót lại → tàn dư, khuyết tật, tàn nhẫn (残忍 cánrěn: tàn nhẫn, 残疾 cánjí: tàn tật, 残留: còn sót lại).             |
|   殆    |  dài   |   Đãi    | `歹` + `台`                   | [Tra bộ 歹] Hình thanh: `歹` + `台` (`tái`, thanh phù) → nguy hiểm, gần như, hầu hết (危殆 wēidài: nguy kịch, 百战不殆: trăm trận không nguy, 殆尽: gần như hết). |
|   殃    |  yāng  |   Ương   | `歹` + `央`                   | [Tra bộ 歹] Hình thanh kiêm hội ý: `歹` (họa chết) + `央` (`yāng`, thanh phù) → tai họa, tai ương, làm hại (遭殃 zāoyāng: gặp vạ, 祸国殃民: hại nước hại dân).    |
|   殚    |  dān   |   Đàn    | `歹` + `单` (Phồn `殫`: `單`) | [Tra bộ 歹] Hình thanh: sức lực mòn cạn → dốc hết, cạn kiệt (殚精竭虑 dānjīng-jiélǜ: dốc cạn tâm huyết suy nghĩ, 殚力: hết sức).                                  |
|   歼    |  jiān  |   Tiêm   | `歹` + `千` (Phồn `殲`: `韱`) | [Tra bộ 歹] Hình thanh kiêm hội ý: tiêu diệt sạch sẽ, giết hết quân địch (歼灭 jiānmiè: tiêu diệt gọn, 全歼: tiêu diệt toàn bộ, 歼击机: máy bay tiêm kích).       |

### Nhóm C: Tang lễ & các chữ chuyển nghĩa rộng (`殊, 殖`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                               |
| :-----: | :----: | :------: | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   殊    |  shū   |   Thù    | `歹` + `朱`                   | [Tra bộ 歹] Hình thanh: `歹` + `朱` (`zhū`, thanh phù); gốc là chặt lìa/chết riêng → khác biệt, đặc biệt, hết sức (特殊 tèshū: đặc biệt, 殊不知: nào ngờ, 悬殊: chênh lệch). |
|   殖    |  zhí   |   Thực   | `歹` + `直`                   | [Tra bộ 歹] Hình thanh: `歹` + `直` (`zhí`, thanh phù); gốc là xương thịt phân hủy → sinh sôi nảy nở, gây dựng thuộc địa (繁殖 fánzhí: sinh sản, 殖民地: thuộc địa).         |
|   殓    |  liàn  |   Liễm   | `歹` + `佥` (Phồn `殮`: `僉`) | [Tra bộ 歹] Hình thanh kiêm hội ý: khâm liệm thi thể vào áo quan (入殓 rùliàn: nhập liệm, 装殓: liệm táng, 收殓: thu xác khâm liệm).                                         |
|   殡    |  bìn   |   Tấn    | `歹` + `宾` (Phồn `殯`: `賓`) | [Tra bộ 歹] Hình thanh kiêm hội ý: quàn giữ linh cữu làm lễ tang → tang lễ, đưa tang (殡仪馆 bìnyíguǎn: nhà tang lễ, 出殡 chūbìn: đưa đám).                                  |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `夕` (`xī` · Tịch — bộ riêng `#36`, 3 nét, chiều tối/đêm, thiếu nét ngang trên đầu so với `歹`; gặp trong `外, 多, 夜`).
- `骨` (`gǔ` · Cốt — bộ riêng `#188`, xương).
- `列` (`liè` · Liệt · `歹(歺) + 刂` — tách hàng, hàng ngũ, liệt kê: `排列`, `列车`; xếp bộ `刀/刂`).
- `烈` (`liè` · Liệt · `列 + 灬` — mãnh liệt, anh liệt: `热烈`, `烈士`; xếp bộ `火/灬`).
- `例` (`lì` · Lệ · `亻 + 列` — ví dụ, lệ thường: `例子`, `例如`; xếp bộ `人/亻`).
- `餐` (`cān` · Xán · `𣦼(chứa 歺) + 食` — bữa ăn: `餐厅`, `早餐`; xếp bộ `食`).
- `外` (`wài` · Ngoại · `夕 + 卜` — bên ngoài; chứa `夕`, không phải `歹`, xếp bộ `夕`).
- `怨` (`yuàn` · Oán · `夗(夕+卩) + 心` — oán giận; phần trên trái là `夕`, xếp bộ `心`).

---

## Bộ 116: 殳 (Thù)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-043` · `radical_index`: `43` · `strokes`: `4` nét · `name_vi`: `bộ Thù` · Khang Hy `#79` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `殳` — dạng chính duy nhất (4 nét: `丿 ㇇ ㇇ ㇏`, gồm phần trên giống `几` nhưng nét thứ 2 **không có móc** và phần dưới là `又`); hầu như luôn đứng **bên phải** chữ ghép (`段, 殴, 殿, 毁, 毅, 殷, 投, 设, 没, 役`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý: bàn tay (`又`) cầm **cây thù** — một loại gậy dài / binh khí cán dài không lưỡi nhọn (hoặc chày gỗ dài) thời cổ.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Từ hình ảnh **tay cầm gậy dài đập đánh** mở rộng thành **tấn công, đánh đập, phá hủy, giết chóc** (`殴, 毁, 殺/杀`) → **tác động lực mạnh làm tách đoạn** (`段`) → **vang dội uy nghiêm, kiên quyết mạnh mẽ** (`殿, 毅, 殷`). Trong nhiều chữ ghép rất thông dụng (`投, 设, 没, 役, 股, 般`), `殳` nằm bên phải nhưng chữ lại xếp theo bộ nghĩa bên trái.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `殳` bên phải thường gợi ý tác động mạnh bằng tay/vũ khí, đập vỡ, cắt chia, hoặc đóng vai trò thành phần cấu tạo cổ (`股, 般`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`殳` (Thù `#79`) vs `攴 / 攵` (Phộc `#66`):** Cả hai đều có gốc từ bàn tay cầm gậy/que; nhưng `殳` thiên về **binh khí dài, đánh đập, đập vỡ mạnh** (`殴, 毁, 殺`), còn `攵` thiên về **gõ nhẹ, thúc giục, sửa sang, cai quản, dạy dỗ** (`教, 改, 政, 放`).
    - **Phần trên của `殳` vs `几`:** Phần trên của `殳` viết nét ngang gập cong `㇇` **không có móc lên** ở đuôi (không tách riêng thành chữ `几` = cái bàn/mấy để đoán nghĩa).
    - **Phân biệt với `没 / 沿 / 船`:** Trong `沿` và `船`, phần bên phải là `㕣` (`几 không móc + 口`), KHÔNG phải `殳` (`几 không móc + 又`); còn `没` có `殳` bên phải nhưng tra bộ `氵`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Đánh đập, phá hủy & binh khí tác động mạnh

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                           |
| :-----: | :----: | :------: | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   殳    |  shū   |   Thù    | Đứng độc lập                         | [Tra bộ 殳] Tay (`又`) cầm gậy dài không lưỡi → cây thù (binh khí cổ thời Chu), họ Thù (ít dùng độc lập hiện đại, chủ yếu làm bộ cấu chữ).                               |
|   殴    |   ōu   |    Ẩu    | `区` + `殳` (Phồn `毆`: `區+殳`)     | [Tra bộ 殳] Hình thanh kiêm hội ý: `区` (`ōu`, thanh phù) + `殳` (đánh bằng gậy/tay) → đánh đập, hành hung (殴打 ōudǎ: đánh đập, 斗殴 dòu'ōu: ẩu đả).                    |
|   毁    |  huǐ   |   Hủy    | `臼 + 工` + `殳` (Phồn `毀`)         | [Tra bộ 殳] Hình thanh kiêm hội ý: dùng gậy (`殳`) đập tan đồ đất/nhà cửa → phá hủy, thiêu hủy, bôi nhọ (毁坏 huǐhuài: phá hỏng, 烧毁: thiêu hủy, 诋毁: phỉ báng).       |
| 杀 / 殺 |  shā   |   Sát    | Giản `乂 + 木` / Phồn `𠂩 + 木 + 殳` | [Khang Hy `殺`: bộ 殳 / Giản thể `杀`: bộ 木 hoặc 乂] Cổ tự là tay cầm vũ khí chém giết; nghĩa: giết, triệt tiêu, phanh xe, rất mực (杀害 shāhài: sát hại, 刹车: phanh). |

### Nhóm B: Chia đoạn, cung điện, mạnh mẽ & chuyển dạng Phồn–Giản

| Chữ Hán |   Pinyin   | Hán Việt | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| :-----: | :--------: | :------: | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   段    |    duàn    |   Đoạn   | `𠂇` + 2 ngang + `殳`            | [Tra bộ 殳] Hội ý: dùng gậy/chày đập tách vách đá → đoạn, khúc, giai đoạn, thủ đoạn (一段 yíduàn: một đoạn, 阶段 jiēduàn: giai đoạn, 手段: thủ đoạn).                |
|   殿    |    diàn    |   Điện   | `尸 + 共` + `殳`                 | [Tra bộ 殳] Hình thanh kiêm hội ý: tiếng dội vang lớn ở nhà cao rộng → cung điện, đền đài, đi cuối (宫殿 gōngdiàn: cung điện, 大殿: chính điện, 殿后: chặn hậu).     |
|   殷    | yīn / yān  | Ân / Yên | Phần trái (`丿 𠂇` biến) + `殳`  | [Tra bộ 殳] Hội ý cổ: tay cầm dùi gõ nhạc khí tế lễ thịnh đại → thịnh vượng, ân cần, nhà Ân (殷勤 yīnqín: ân cần, 殷商: nhà Ân-Thương); `yān`: đỏ sẫm (殷红).        |
|   毅    |     yì     |   Nghị   | `𧱺` (lợn rừng) + `殳`           | [Tra bộ 殳] Hình thanh kiêm hội ý: tinh thần quyết liệt xông pha không lùi → kiên cường, nghị lực, quả quyết (毅力 yìlì: nghị lực, 坚毅 jiānyì: kiên nghị).          |
|   殽    | yáo / xiáo |   Hào    | `肴` + `殳`                      | [Tra bộ 殳] Hình thanh kiêm hội ý: trộn lẫn, hỗn tạp (thông với `淆`), đồ ăn thức nhắm tế lễ (殽乱 yáoluàn: hỗn loạn, 殽杂: pha tạp).                                |
| 壳 / 殼 | ké / qiào  |   Xác    | Giản `士+冖+几` / Phồn `𣪊 + 殳` | [Khang Hy `殼`: bộ 殳 / Giản thể `壳`: bộ 士] Vỏ cứng bên ngoài (vỏ trứng, vỏ sò); Giản thể lược `殳` (贝壳 bèiké: vỏ sò, 外壳: vỏ ngoài, 地壳 dìqiào: vỏ Trái Đất). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `投` (`tóu` · Đầu · `扌 + 殳` — ném, bỏ phiếu, đầu tư: `投入`, `投票`, `投资`; xếp bộ `手/扌`).
- `设` (`shè` · Thiết · `讠 + 殳` — thiết lập, giả sử, thiết bị: `设计`, `设备`, `假设`; xếp bộ `言/讠`).
- `没` (`méi / mò` · Một · `氵 + 殳` — không có, chìm xuống: `没有`, `淹没`; xếp bộ `水/氵`).
- `役` (`yì` · Dịch · `彳 + 殳` — lao dịch, chiến dịch, vai diễn: `战役`, `兵役`, `角色`; xếp bộ `彳`).
- `股` (`gǔ` · Cổ · `月 + 殳` — đùi, cổ phần, luồng: `股票`, `屁股`, `一股风`; xếp bộ `肉/月`).
- `般` (`bān` · Ban · `舟 + 殳` — giống như, loại, thông thường: `一般`, `这般`; xếp bộ `舟`).
- `锻` (`duàn` · Đoán · `钅 + 段(chứa 殳)` — rèn kim loại, rèn luyện: `锻炼`, `锻造`; xếp bộ `金/钅`).
- `毂` (`gǔ` · Cốc · `𡔉 + 车 + 殳`, Phồn `轂` — trục bánh xe: `轮毂`; xếp bộ `車/车`).
- `船 / 沿` (`chuán / yán` — phần bên phải là `㕣 = 几 không móc + 口`, KHÔNG phải `殳`).
- `攴 / 攵` (`pū` · Phộc — bộ riêng `#66`, cũng có gốc tay cầm gậy tác động).

---

## Bộ 117: 毋 (Vô)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-128` · `radical_index`: `128` · `strokes`: `4` nét · `name_vi`: `bộ Vô / Mưu` · Khang Hy `#80` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `毋` — dạng chính duy nhất (4 nét: `𠃋 𠃍 丿 一`), nét ngang dài xuyên qua giữa thân khung, **không có 2 chấm bên trong**.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Chữ cổ xuất phát từ hình chữ `女` thêm nét vạch ngang ngăn lại (chỉ sự: ngăn cấm, răn giữ); nghĩa gốc là **"chớ, đừng"** (từ phủ định mệnh lệnh trong văn ngôn).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Ít dùng độc lập trong khẩu ngữ hiện đại; chủ yếu xuất hiện trong thành ngữ, văn bản trang trọng (`宁缺毋滥, 毋庸置疑`). Do sự gần gũi hình thái với `母` (mẹ — 5 nét), hệ thống Khang Hy `#80` xếp cả `母, 每, 毒` vào bộ `毋`.
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Khi gặp mặt chữ `毋`, cần nhận diện ngay nghĩa "chớ/đừng" và tách bạch hoàn toàn với `母` (mẹ) vốn có tần suất cao hơn gấp nhiều lần.
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `毋` vs `母` vs `毌` vs `勿`:_
    - **`毋` (`wú`, Vô/Mưu — 4 nét) vs `母` (`mǔ`, Mẫu — 5 nét):**
      1. **Hình dạng:** `毋` gồm 4 nét (`𠃋 𠃍 丿 一`), nét giữa là một nét phẩy xuyên xuống cắt ngang qua nét ngang, bên trong **trống, không có dấu chấm**. `母` gồm 5 nét (`𠃋 𠃍 丶 一 丶`), có **2 dấu chấm nhỏ** nằm hai bên nét ngang giữa (tượng trưng hai bầu sữa nuôi con).
      2. **Ý nghĩa:** `毋` = **chớ, đừng** (ngăn cấm); `母` = **mẹ, cái, gốc sinh ra** (`母亲, 父母, 字母`).
      3. **Vị trí trong từ điển & DB:** Theo 214 bộ Khang Hy, `母, 每, 毒` nằm chung trong bộ `#80 毋`; nhưng bảng tra Giản thể hiện đại và dữ liệu DB `hanzihome_radicals` đã tách riêng `母` thành một mục độc lập (`radical-059`, `radical_index: 59`, `strokes: 5`, `name_vi: "bộ Mẫu"`).
    - **`毋` vs `毌` (`guàn`):** `毌` (gặp ở đỉnh chữ `贯`: xuyên suốt) gồm hai ô vuông nhỏ xâu trên một nét ngang xuyên qua, nghĩa gốc là xuyên xâu tiền/ngọc, KHÔNG phải `毋` hay `母`.
    - **`毋` vs `勿` (`wù`):** `勿` (bộ Bao `勹`) cũng có nghĩa "chớ, đừng" (`请勿吸烟`), nhưng hình dáng và bộ thủ hoàn toàn khác `毋`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cấm đoán, phủ định & độc hại (`毋`, `毒`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| :-----: | :----: | :------: | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   毋    |   wú   | Vô / Mưu | Đứng độc lập          | [Tra bộ 毋] Chỉ sự: ngăn cấm không cho làm → chớ, đừng (dùng trong thành ngữ, văn ngôn: 宁缺毋滥 nìngquē-wúlàn: thà thiếu còn hơn ẩu, 毋庸置疑: không cần nghi ngờ). |
|   毒    |   dú   |   Độc    | `龶` (cỏ dày) + `毋`  | [Khang Hy: bộ 毋 / Hiện đại: bộ 母 hoặc 毋] Cỏ dại mọc tràn gây hại → chất độc, độc hại, tàn ác (中毒 zhòngdú: trúng độc, 病毒: virus, 毒品: ma túy).                |

### Nhóm B: Sinh nở, mẫu hệ & lặp lại (Khang Hy #80 gộp chung `毋`; DB tách riêng `母`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                  |
| :-----: | :----: | :------: | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   母    |   mǔ   |   Mẫu    | `毋` + 2 chấm (5 nét)   | [Khang Hy: bộ 毋 #80 / DB & Hiện đại: bộ riêng 母 (`radical-059`)] Tượng hình bầu sữa người mẹ → mẹ, giống cái, cội nguồn (母亲 mǔqīn: mẹ, 父母: cha mẹ, 字母). |
|   每    |  měi   |   Mỗi    | `𠂉` (trâm) + `母`      | [Khang Hy: bộ 毋 #80 / Hiện đại: bộ 母 hoặc 𠂉] Phụ nữ sinh nở nối tiếp → mỗi, từng, thường xuyên (每天 měitiān: mỗi ngày, 每年: mỗi năm, 每个: mỗi cái).       |
|   毓    |   yù   |   Dục    | `每` + `𠫓` (`流` tỉnh) | [Tra bộ 毋 (#80)] Hội ý: sinh đẻ và nuôi dưỡng lớn lên (biến thể cổ trang trọng của `育`: 钟灵毓秀 zhōnglíng-yùxiù: nơi linh khí hun đúc ra nhân tài).          |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `母` (`mǔ` · Mẫu — trong DB tách riêng `radical-059`, `radical_index: 59`, 5 nét; dễ nhầm nhất với `毋`).
- `海` (`hǎi` · Hải · `氵 + 每` — biển cả: `大海`, `上海`; xếp bộ `水/氵`).
- `悔` (`huǐ` · Hối · `忄 + 每` — hối hận: `后悔`, `悔改`; xếp bộ `心/忄`).
- `敏` (`mǐn` · Mẫn · `每 + 攵` — nhanh nhạy: `敏感`, `敏捷`; xếp bộ `攴/攵`).
- `梅` (`méi` · Mai · `木 + 每` — hoa mai, quả mận: `梅花`, `杨梅`; xếp bộ `木`).
- `繁` (`fán` · Phồn · `敏` biến + `糸` — phồn thịnh, phức tạp: `繁荣`, `繁重`; xếp bộ `糸`).
- `贯` (`guàn` · Quán · `毌 + 贝` — xuyên suốt, thói quen: `习惯`, `贯彻`; xếp bộ `貝/贝`; phần trên là `毌`, không phải `毋` hay `母`).
- `勿` (`wù` · Vật — bộ Bao `勹`, 4 nét — cũng mang nghĩa "chớ, đừng" nhưng khác hoàn toàn hình dạng `毋`).

---

## Bộ 118: 比 (Tỷ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-129` · `radical_index`: `129` · `strokes`: `4` nét · `name_vi`: `bộ Tỷ` · Khang Hy `#81` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `比` — dạng chính duy nhất (4 nét: `一 𠄌 丿 乚`); đứng độc lập, đứng bên trái (`毗`), đứng bên trên (`毕, 毙, 毖, 皆`), hoặc đứng bên phải (`批, 屁`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Hội ý: **hai người (`匕 + 匕`) đứng sóng vai quay mặt cùng về một hướng** để so cao thấp hoặc kề sát cạnh nhau.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **So sánh, đối chiếu, thi đấu, tỉ lệ, ví dụ** (`比较, 比赛, 比例, 比如`) → **kề sát, tiếp giáp cạnh nhau** (`毗`). Trong hai chữ Giản thể thông dụng (`毕, 毙`), phần đầu `比` được dùng thay thế cho khối nét phức tạp của Phồn thể (`畢, 斃`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `比` thường liên quan đến so sánh, sát cạnh, hoặc làm thành phần ghi âm `bi / pi` trong chữ hình thanh (`批, 屁, 庇, 陛`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`比` (Tỷ — hai người xuôi cùng hướng) vs `北` (Bắc — hai người quay lưng nhau):** `比` hai nửa đều mở hướng sang bên phải; `北` (xếp bộ `匕`, 5 nét) nửa trái quay sang trái, nửa phải quay sang phải, biểu thị hai người quay lưng lại nhau (nghĩa gốc "lưng" → phương Bắc).
    - **`比` vs `匕` (Chủy `#21`):** `匕` (2 nét) chỉ là một nửa cấu tạo nên chữ `比` (`匕 + 匕`).
    - **Chú ý chữ giản thể `毕, 毙`:** Phồn thể `畢` (xếp bộ `田`) và `斃` (xếp bộ `攴`) khi giản thể hóa đều đổi phần đầu thành `比`, nên trong bảng tra chữ Giản thể hiện đại thường xếp vào bộ `比`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: So sánh, kề sát & thận trọng (xếp chính thức bộ `比` Khang Hy #81)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                  |
| :-----: | :----: | :------: | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   比    |   bǐ   |    Tỷ    | Đứng độc lập          | [Tra bộ 比] Hai người đứng kề nhau → so sánh, tỉ lệ, ví dụ, thi đấu (比较 bǐjiào: so sánh, 比如 bǐrú: ví dụ như, 比赛 bǐsài: thi đấu, 比例: tỉ lệ).             |
|   毗    |   pí   |    Tỳ    | `比` + `田`           | [Tra bộ 比] Hình thanh kiêm hội ý: `比` (sát cạnh) + `田` (ruộng đất) → tiếp giáp, liền kề nhau (毗邻 pílín: giáp ranh láng giềng, 毗连 pílián: nối liền nhau). |
|   毖    |   bì   |    Bí    | `比` + `必`           | [Tra bộ 比] Hình thanh kiêm hội ý: `比` + `必` (`bì`, thanh phù) → cẩn trọng, đề phòng trước sau (惩前毖后 chéngqián-bìhòu: răn trước ngừa sau, 毖饬: cẩn mật). |

### Nhóm B: Chữ Giản thể lấy `比` làm bộ đầu tra cứu (khác biệt Giản – Phồn)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| :-----: | :----: | :------: | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   毕    |   bì   |   Tất    | `比` + `十` (Phồn `畢`: bộ `田`) | [Giản thể: bộ 比 / Khang Hy `畢`: bộ 田] Giản thể dùng `比` thay nửa trên của `畢`; nghĩa: hoàn tất, kết thúc, rốt cuộc (毕业 bìyè: tốt nghiệp, 完毕: hoàn tất).     |
|   毙    |   bì   |    Tệ    | `比` + `死` (Phồn `斃`: bộ `攴`) | [Giản thể: bộ 比 / Khang Hy `斃`: bộ 攴] Giản thể thay `敝` bằng `比`; nghĩa: chết, ngã gục, xử bắn (枪毙 qiāngbì: xử bắn, 倒毙: ngã chết, 坐以待毙: ngồi chờ chết). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `批` (`pī` · Phê · `扌 + 比` — phê duyệt, phê bình, lô hàng: `批准`, `批评`, `一批`; xếp bộ `手/扌`, `比` gợi âm).
- `屁` (`pì` · Thí · `尸 + 比` — đánh rắm, mông: `放屁`, `屁股`; xếp bộ `尸`).
- `陛` (`bì` · Bệ · `阝 + 比 + 土` — bậc thềm cung điện, bệ hạ: `陛下`; xếp bộ `阜/阝 trái`).
- `庇` (`bì` · Tý · `广 + 比` — che chở, bao che: `庇护`, `包庇`; xếp bộ `广`).
- `皆` (`jiē` · Giai · `比 + 白` — đều, tất cả: `皆大欢喜`, `比比皆是`; xếp bộ `白`).
- `昆` (`kūn` · Côn · `日 + 比` — anh em, côn trùng: `昆虫`, `昆仑山`; xếp bộ `日`).
- `琵` (`pí` · Tỳ · `王 + 王 + 比` — đàn tỳ bà: `琵琶`; xếp bộ `玉/王`).
- `匕 / 北` (`bǐ / běi` — `匕` là một nửa của `比`; `北` là hai người quay lưng nhau, xếp bộ `匕`).

---

## Bộ 119: 毛 (Mao)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-130` · `radical_index`: `130` · `strokes`: `4` nét · `name_vi`: `bộ Mao` · Khang Hy `#82` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `毛` — dạng chính duy nhất (4 nét: `丿 一 一 乚`); đứng độc lập, nằm bên dưới (`毫, 毳`), hoặc thường bao từ **bên trái-dưới** (`毯, 毡, 毽, 毵, 毹, 氆`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **sợi lông / chùm lông thú** rủ cong mềm mại.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Lông, lông thú, tóc tơ, len dạ** (`羽毛, 毛衣`) → **sản phẩm dệt/ép từ lông** (`毯, 毡, 毽`) → **nhỏ bé mảnh mai như sợi lông** (`毫`) → **thô sơ, chưa gọt giũa, nóng vội, đơn vị tiền lẻ 1 hào** (`毛病, 毛糙, 五毛钱`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `毛` thường liên quan đến lông, sợi mảnh, len dạ, thảm, bút lông (`笔`), hoặc sự nhỏ nhặt (`毫`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`毛` (Mao — 4 nét) vs `手` (Thủ — 4 nét):** `毛` có hai nét ngang (`一 一`) và nét cuối là **sổ cong móc sang phải (`乚`)**; `手` nét cuối là **sổ móc sang trái (`亅`)**.
    - **`毛` vs `彡` (Sam) / `髟` (Tiêu):** `毛` thiên về lông vũ, lông thú, sợi len dệt thảm; `髟` (bộ `#190`) chuyên chỉ tóc dài trên đầu người; `彡` (bộ `#59`) là 3 vệt ngắn trang trí/ánh sáng/lông nhẹ.
    - **Chú ý nghĩa hiện đại của `毛`:** Trong `毛病` (khuyết điểm/bệnh tật/lỗi hỏng) hay `五毛钱` (năm hào = 0,5 tệ), nghĩa đã mở rộng khỏi "lông".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Lông thú, sợi mảnh & tính chất nhỏ bé

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                     |
| :-----: | :----: | :------: | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   毛    |  máo   |   Mao    | Đứng độc lập             | [Tra bộ 毛] Tượng hình sợi lông → lông, len, thô sơ, đơn vị tiền (1 hào = 0,1 tệ), tính nóng/tật (羽毛 yǔmáo: lông vũ, 毛衣: áo len, 毛病: tật/lỗi).               |
|   毫    |  háo   |   Hào    | `高` tỉnh + `毛`         | [Tra bộ 毛] Hình thanh kiêm hội ý: đầu sợi lông nhọn mảnh → lông nhỏ, chút xíu, không hề, đơn vị mili (毫无 háowú: hoàn toàn không, 丝毫: mảy may, 毫米: milimét). |
|   毳    |  cuì   |   Thúy   | Ba chữ `毛` xếp tam giác | [Tra bộ 毛] Hội ý: ba lớp lông dày → lớp lông tơ mềm mịn dưới bụng chim thú (毳毛 cuìmáo: lông tơ mịn).                                                            |
|   毵    |  sān   |   Tam    | `参` + `毛` (Phồn `毿`)  | [Tra bộ 毛] Hình thanh kiêm hội ý: `参` (`sān`, thanh phù) + `毛` → lông/tóc hoặc cành liễu rủ dài thướt tha (毵毵 sānsān: rủ dài lất phất).                       |
|   毦    |   ěr   |   Nhĩ    | `耳` + `毛`              | [Tra bộ 毛] Hình thanh kiêm hội ý: `耳` (tai, gợi âm) + `毛` → đồ trang sức bện bằng lông thú/lông chim gắn trên mũ thời cổ.                                       |

### Nhóm B: Sản phẩm dệt từ lông, thảm nỉ & cầu lông

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                            |
| :-----: | :----: | :------: | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   毯    |  tǎn   |   Thảm   | `毛` + `炎`             | [Tra bộ 毛] Hình thanh: `毛` (lông/len) + `炎` (`yán`, thanh phù) → tấm thảm, chăn len dày (地毯 dìtǎn: thảm trải sàn, 毛毯 máotǎn: chăn lông).           |
|   毡    |  zhān  |  Chiên   | `毛` + `占` (Phồn `氈`) | [Tra bộ 毛] Hình thanh: `毛` (lông cừu) + `占` (`zhān`, thanh phù) → vải dạ, phớt ép từ lông, lều nỉ (毡子 zhānzi: tấm nỉ, 如坐针毡: ngồi trên đống gai). |
|   毽    |  jiàn  |   Kiến   | `毛` + `建`             | [Tra bộ 毛] Hình thanh: `毛` (lông gà) + `建` (`jiàn`, thanh phù) → quả cầu lông để đá bằng chân (毽子 jiànzi: quả cầu đá, 踢毽子: đá cầu).               |
|   毹    |  shū   |    Du    | `俞` + `毛`             | [Tra bộ 毛] Hình thanh: thảm len dệt hoa văn cổ (thường dùng trong từ ghép văn ngôn 氍毹 qúshū: thảm len dệt hoa).                                        |
|   氆    |   pǔ   |   Phổ    | `普` + `毛`             | [Tra bộ 毛] Hình thanh: loại vải len dệt thủ công truyền thống vùng Tây Tạng (氆氇 pǔlu: vải len Tạng).                                                   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `笔 / 筆` (`bǐ` · Bút · `⺮ + 毛` — cây bút lông, cây bút nói chung: `毛笔`, `铅笔`; xếp bộ `竹`).
- `尾` (`wěi / yǐ` · Vĩ · `尸 + 毛` — cái đuôi, phần cuối: `尾巴`, `结尾`; xếp bộ `尸`).
- `耗` (`hào` · Háo · `耒 + 毛` — tiêu hao, tổn thất: `消耗`, `耗费`; xếp bộ `耒`).
- `表` (`biǎo` · Biểu · gốc gồm `衣 + 毛` áo lông mặc ngoài — bề ngoài, đồng hồ, biểu thị: `表示`, `手表`; xếp bộ `衣`).
- `撬 / 橇` (`qiào / qiāo` — chứa `毳` = 3 `毛`, lần lượt xếp bộ `手/扌` và `木`: `撬开`, `雪橇`).
- `手` (`shǒu` · Thủ — bộ `#64`, nét sổ giữa móc sang trái, khác `毛` móc sang phải).
- `彡 / 髟` (`shān / biāo` — bộ Sam `#59` và bộ Tiêu `#190`, cùng trường nghĩa lông/tóc nhưng là bộ thủ riêng).

---

## Bộ 120: 氏 (Thị)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-131` · `radical_index`: `131` · `strokes`: `4` nét · `name_vi`: `bộ Thị` · Khang Hy `#83` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `氏` — dạng chính duy nhất (4 nét: `丿 𠄌 一 ㇂`); đứng độc lập, đứng bên phải (`纸, 厎`), hoặc đứng bên trên (`昏`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Chữ cổ vẽ cây/vật cắm rễ hoặc nhánh tách ra từ gốc, từ đó chỉ **chi nhánh dòng họ, thị tộc** trong xã hội cổ đại.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Họ, dòng họ, thị tộc** (`姓氏`), cách xưng hô theo họ hoặc dịch tên học giả phương Tây (`摄氏度`: độ Celsius, `华氏度`: độ Fahrenheit). Trong chữ hiện đại, `氏` xuất hiện rất nhiều với vai trò **thanh phù** đọc `zhi / di / shi` (`纸, 低, 底, 抵`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `氏` đứng riêng hoặc ở sau họ là chỉ dòng họ/danh xưng; nằm trong chữ ghép thường làm thành phần âm `zhi / shi` (`纸`) hoặc biến thành `氐` (`低, 底`).
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `氏` vs `民` vs `氐`:_
    - **`氏` (`shì`, Thị — 4 nét: `丿 𠄌 一 ㇂`) vs `民` (`mín`, Dân — 5 nét: `𠃍 一 𠄌 一 ㇂`):**
      1. **Hình dạng:** `氏` bắt đầu bằng **1 nét phẩy `丿` ngắn** trên đỉnh, phần trên mở (4 nét); `民` bắt đầu bằng **khung hộp `𠃍 一`** kín ở góc trên-trái (5 nét).
      2. **Nguồn gốc & Nghĩa:** `氏` nghĩa là **họ tộc, thị tộc** (`姓氏`); `民` cổ tự vẽ con mắt bị vật nhọn đâm (tù binh/dân thường), nghĩa là **nhân dân, dân chúng** (`人民, 公民`).
      3. **Vị trí trong Khang Hy vs DB:** Khang Hy `#83` xếp cả `民` và `氓` chung vào bộ `氏`; còn trong DB `hanzihome_radicals` (và một số bảng tra Giản thể), `民` được tách riêng thành linh kiện `radical-132` (`radical_index: 132`, `strokes: 5`, `name_vi: "bộ Dân"`).
    - **`氏` (4 nét) vs `氐` (5 nét):** `氐` (`dī / dǐ`, gốc rễ/đáy) là `氏` thêm **1 nét chấm/ngang ngắn ở dưới đáy**, tạo ra loạt chữ `低, 底, 抵` (không được bỏ quên nét đáy này).
    - **`氏` vs `姓`:** `姓` (`女 + 生`, bộ `女`) là "họ" thông dụng nhất trong giao tiếp hiện đại (`姓名`, `姓张`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Dòng họ, gốc rễ & vị trí (xếp chính thức bộ `氏` Khang Hy #83)

| Chữ Hán |  Pinyin   | Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                             |
| :-----: | :-------: | :-------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   氏    | shì / zhī | Thị / Chi | Đứng độc lập          | [Tra bộ 氏] Thị tộc, dòng họ, danh hiệu theo họ hoặc học giả (姓氏 xìngshì: họ tên, 摄氏度 Shèshìdù: độ C); đọc `zhī` trong tên tộc cổ 月氏 (Yuèzhī).      |
|   氐    |  dī / dǐ  |  Đê / Để  | `氏` + `丶/一` đáy    | [Tra bộ 氏] Chỉ sự: đánh dấu phần gốc rễ/đáy dưới; nay chỉ tộc người cổ 氐族 (`dī`), chòm sao Đê, hoặc thông với `抵/底` nghĩa gốc rễ (`dǐ` trong cổ văn). |
|   厎    | dǐ / zhǐ  | Để / Chỉ  | `厂` + `氏`           | [Tra bộ 氏] Hình thanh kiêm hội ý: đá mài mịn bên vách đá → đá mài, dừng lại, bằng phẳng (厎平 zhǐpíng; chú ý phân biệt với `底` dùng `广 + 氐`).          |

### Nhóm B: Dân chúng & cư dân (Khang Hy #83 xếp bộ `氏`; DB tách `民` ở `radical-132`)

| Chữ Hán |   Pinyin    | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                   |
| :-----: | :---------: | :------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   民    |     mín     |   Dân    | Độc thể (5 nét)       | [Khang Hy: bộ 氏 #83 / DB: tách `radical-132`] Nhân dân, công dân, dân tộc, thuộc về dân (人民 rénmín: nhân dân, 公民: công dân, 民族: dân tộc, 农民: nông dân). |
|   氓    | máng / méng |   Manh   | `亡` + `民`           | [Khang Hy: bộ 氏 #83 / Giản thể: bộ 亠 hoặc 民] Dân lưu lạc không nơi nương tựa → `máng`: kẻ lưu manh, côn đồ (流氓 liúmáng); `méng`: dân thường thời cổ (氓隶). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `民` (`mín` · Dân — trong DB tách thành `radical-132`, `radical_index: 132`, 5 nét; rất dễ nhầm mặt chữ với `氏`).
- `纸 / 紙` (`zhǐ` · Chỉ · `纟 + 氏` — giấy: `纸张`, `报纸`; xếp bộ `糸/纟`, `氏` làm thanh phù).
- `昏` (`hūn` · Hôn · `氏 + 日` — mặt trời lặn xuống dưới → hoàng hôn, tối, choáng váng: `黄昏`, `昏迷`; xếp bộ `日`).
- `婚` (`hūn` · Hôn · `女 + 昏` — lễ cưới cổ tiến hành lúc chạng vạng → kết hôn: `结婚`, `婚姻`; xếp bộ `女`).
- `低 / 底 / 抵` (`dī / dǐ / dǐ` — đều mang `氐` ở bên phải/dưới làm thanh phù kiêm ý thấp/đáy: `高低`, `底下`, `抵达`; lần lượt xếp bộ `人/亻`, `广`, `手/扌`).
- `眠` (`mián` · Miên · `目 + 民` — nhắm mắt ngủ: `睡眠`, `失眠`; xếp bộ `目`).
- `姓` (`xìng` · Tính · `女 + 生` — họ tên: `姓名`, `百姓`; xếp bộ `女`, cùng trường nghĩa họ tộc với `氏`).

---

## Bộ 121: 气 (Khí)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-067` · `radical_index`: `67` · `strokes`: `4` nét · `name_vi`: `bộ Khí` · Khang Hy `#84` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `气` — dạng chính chuẩn (4 nét: `丿 一 一 ㇈`); đứng độc lập (trong Giản thể) hoặc làm khung ôm **bên trên-phải** chữ ghép (`氧, 氢, 氮, 氯, 氛, 氨`).
  - `氣` — dạng Phồn thể của chữ "khí" (10 nét, thêm `米` bên trong khung `气`, trong Khang Hy vẫn xếp ở bộ `气`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **ba làn hơi mây bốc lên** bay ngang tầng trời; về sau chữ Phồn thể thêm chữ `米` (gạo — hơi nấu cơm/lương thực dâng khách) tạo thành `氣`, còn `气` gốc giữ vai trò bộ thủ và được khôi phục làm chữ chuẩn trong Giản thể.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Không khí, hơi, khí quyển, thời tiết** (`空气, 天气, 气氛`) → **hơi thở, sức sống, tinh thần, tính khí, cơn giận** (`力气, 生气, 客气, 脾气`) → **chất khí trong hóa học hiện đại** (`氧, 氢, 氮, 氯, 氨, 氦`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Hầu như 100% chữ có khung `气` bao ngoài ở góc trên-phải đều là **tên nguyên tố/chất khí hóa học** hoặc hiện tượng khí quyển (`氧, 氢, 氮, 氯, 氛, 氤`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`气` (Khí — 4 nét) vs `乞` (Khất — 3 nét):** `气` có **2 nét ngang ngắn** phía dưới nét phẩy; `乞` (xin ăn, gặp trong `吃, 乞丐`) chỉ có **1 nét ngang**! Cực hay viết thiếu nét ngang thứ hai của `气`.
    - **`气` vs `汽` (`氵 + 气`, bộ `水`):** `气` chỉ không khí/hơi nói chung và tinh thần; thêm 3 chấm thủy thành `汽` chuyên chỉ **hơi nước, động cơ hơi nước/xăng** (`汽车` ô tô, `汽油` xăng, `水汽` hơi nước).
    - **`氣` (Phồn thể có `米`):** Không nên giải thích máy móc chữ Phồn thể `氣` theo kiểu "hơi + gạo" trong học chữ hiện đại; `米` gốc liên quan việc dâng cơm gạo/năng lượng nuôi sống.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Khí, hơi, bầu không khí & trạng thái tự nhiên

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                   |
| :-----: | :----: | :------: | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   气    |   qì   |   Khí    | Đứng độc lập (Phồn `氣`) | [Tra bộ 气] Tượng hình làn hơi bốc lên → không khí, hơi, thời tiết, sức lực, tức giận (空气 kōngqì: không khí, 天气 tiānqì: thời tiết, 生气 shēngqì: tức giận).  |
|   氛    |  fēn   |   Phân   | `气` + `分`              | [Tra bộ 气] Hình thanh: `气` (hơi khí) + `分` (`fēn`, thanh phù) → bầu không khí, không khí/bối cảnh tâm lý (气氛 qìfēn: bầu không khí, 氛围 fēnwéi: không khí). |
|   氤    |  yīn   |   Nhân   | `气` + `因`              | [Tra bộ 气] Hình thanh: `气` + `因` (`yīn`, thanh phù) → hơi mây mù mịt, khí quấn quyện hòa hợp (氤氲 yīnyūn: mù mịt, ngào ngạt hơi hương).                      |
|   氲    |  yūn   |   Uân    | `气` + `昷` (Phồn `氳`)  | [Tra bộ 气] Hình thanh: `气` + `昷` (`wēn`, thanh phù) → khí tụ dày đặc (chủ yếu ghép đôi trong 氤氲 yīnyūn: bảng lảng, mịt mù).                                 |

### Nhóm B: Các chất khí phổ biến trong hóa học & đời sống (phần 1)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                 |
| :-----: | :----: | :------: | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   氧    |  yǎng  |  Dưỡng   | `气` + `羊`             | [Tra bộ 气] Hình thanh: `气` (khí) + `羊` (`yáng`, thanh phù kiêm ý "dưỡng" `养`) → khí Oxy O₂ (氧气 yǎngqì: khí oxy, 二氧化碳: khí CO₂, 缺氧: thiếu oxy).     |
|   氢    |  qīng  |  Khinh   | `气` + `巠` (Phồn `氫`) | [Tra bộ 气] Hình thanh: `气` (khí) + `巠` (`jīng`, gợi "nhẹ" `轻`) → chất khí nhẹ nhất: khí Hydro H₂ (氢气 qīngqì: khí hydro, 氢弹: bom khinh khí).            |
|   氮    |  dàn   |   Đạm    | `气` + `炎`             | [Tra bộ 气] Hình thanh/định danh hóa học: `气` + `炎` (phiên âm từ _đạm khí_ — khí làm nhạt nồng độ oxy) → khí Nitơ N₂ (氮气 dànqì: khí nitơ, 氮肥: phân đạm). |
|   氯    |   lǜ   |   Lục    | `气` + `录`             | [Tra bộ 气] Hình thanh: `气` (khí) + `录` (`lù`, gợi màu vàng lục của khí clo) → khí Clo Cl₂ (氯气 lǜqì: khí clo, 氯化钠: natri clorua / muối ăn).             |

### Nhóm C: Các chất khí hợp chất & khí hiếm (phần 2)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                            |
| :-----: | :----: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
|   氨    |   ān   |    Am    | `气` + `安`           | [Tra bộ 气] Hình thanh phiên âm: `气` + `安` (`ān`, âm _ammonia_) → khí Amoniac NH₃ (氨气 ānqì: khí amoniac, 氨基酸 ānjīsuān: axit amin). |
|   氦    |  hài   |   Hợi    | `气` + `亥`           | [Tra bộ 气] Hình thanh phiên âm: `气` + `亥` (`hài`, âm _helium_) → khí Heli He (氦气 hàiqì: khí heli bơm bóng bay/khinh khí cầu).        |
|   氖    |  nǎi   |   Nãi    | `气` + `乃`           | [Tra bộ 气] Hình thanh phiên âm: `气` + `乃` (`nǎi`, âm _neon_) → khí Neon Ne (氖气 nǎiqì: khí neon, 氖灯 nǎidēng: đèn neon).             |
|   氟    |   fú   |   Phất   | `气` + `弗`           | [Tra bộ 气] Hình thanh phiên âm: `气` + `弗` (`fú`, âm _fluorine_) → khí Flo F₂ (氟气 fúqì: khí flo, 含氟牙膏: kem đánh răng chứa flo).   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `汽` (`qì` · Khí · `氵 + 气` — hơi nước, chạy hơi/xăng: `汽车`, `汽油`, `水汽`; xếp bộ `水/氵`).
- `吃` (`chī` · Ngật · `口 + 乞` — ăn: `吃饭`, `好吃`; xếp bộ `口`, phần phải là `乞` 3 nét chứ không phải `气` 4 nét).
- `忾` (`kài` · Khái · `忄 + 气`, Phồn `愾` — căm phẫn: `同仇敌忾`; xếp bộ `心/忄`).
- `乞` (`qǐ` · Khất — bộ Ất `乙`, 3 nét — cầu xin: `乞讨`; rất dễ viết nhầm với `气` vì thiếu 1 nét ngang).
- `云` (`yún` · Vân — bộ Nhị `二`, 4 nét — đám mây: `白云`, `乌云`; gần trường nghĩa khí/hơi nhưng là bộ khác).

---

## Bộ 122: 爪 (Trảo)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-037` · `radical_index`: `37` · `strokes`: `4` nét · `name_vi`: `bộ Trảo` · Khang Hy `#87` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `爪` — dạng đầy đủ (4 nét: `丿 丿 丨 丶`); đứng độc lập hoặc bên trái chữ ghép (`爬, 抓`).
  - `爫` — **trảo đầu** (4 nét: `丿 丶 丶 丿`); biến thể rất phổ biến luôn nằm ở **đỉnh trên** chữ ghép giống bàn tay úp xuống (`妥, 受, 爱, 采, 争, 爵, 爰, 觅`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **bàn tay với các ngón xòe úp xuống** hoặc **móng vuốt** chim thú vươn ra chụp lấy vật.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Móng vuốt, cào, bò bằng tứ chi** (`爪牙, 爬`) → **dùng tay chụp xuống bắt, hái, nhận, tranh giành** (`采, 受, 爭/争`) → **vỗ về, chăm sóc, yêu thương** (`妥, 爱` ở dạng giản thể).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Khi thấy `爪` bên trái hoặc `爫` úp trên đầu chữ, thường liên quan đến móng vuốt, bò, chụp lấy, hái nhặt, nhận lấy hoặc tranh giành.
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `爪/爫` vs `瓜` vs `手/扌` vs `又`:_
    - **`爪 / 爫` (bộ Trảo `#87` — 4 nét) vs `瓜` (bộ Qua `#97` — 5 nét):**
      1. **Số nét & Hình dạng:** `爪` có **4 nét** (`丿 丿 丨 丶`), nét giữa là một nét sổ thẳng đứng, bên trong **không có dấu chấm**. `瓜` (quả dưa) có **5 nét** (`丿 丿 ㇗ 丶 ㇏`), có một khung gập ở dưới và **1 nét chấm nhỏ `丶` nằm giữa bụng** (tượng trưng hạt/quả dưa treo trên giàn).
      2. **Ý nghĩa:** `爪` = móng vuốt, bàn tay chụp; `瓜` = quả dưa/bầu bí (`西瓜, 黄瓜, 瓜分`).
    - **`爪/爫` vs `手/扌` vs `又`:** Cả ba đều thuộc nhóm "bàn tay", nhưng `爪/爫` nhấn mạnh tư thế **bàn tay úp xuống chụp/bắt** hoặc **móng vuốt**; `手/扌` là bàn tay và động tác tay nói chung; `又` là bàn tay phải cầm nắm.
    - **Chữ Giản thể `爱` (yêu):** Phồn thể `愛` có bộ `心` ở giữa (tên bộ chính là `心`), khi giản thể lược bỏ `心` biến phần đầu `爫` thành bộ tra cứu trong bảng tra Giản thể — không nên giải thích đơn giản `爱` chỉ là "tay + ..." mà cần biết biến đổi lịch sử từ `愛`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Móng vuốt, bò & hành động tay chụp (xếp bộ `爪` chuẩn Khang Hy)

| Chữ Hán |   Pinyin    | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                |
| :-----: | :---------: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   爪    | zhuǎ / zhǎo |   Trảo   | Đứng độc lập          | [Tra bộ 爪] Tượng hình móng vuốt → `zhuǎ`: móng vuốt/chân thú (爪子 zhuǎzi: móng vuốt); `zhǎo`: vuốt nanh trong từ Hán-Việt (张牙舞爪: nhe nanh múa vuốt, 爪牙: tay sai).     |
|   爬    |     pá      |    Ba    | `爪` + `巴`           | [Tra bộ 爪] Hình thanh kiêm hội ý: `爪` (tay chân bám cào) + `巴` (`bā`, thanh phù) → bò, trườn, leo trèo (爬山 páshān: leo núi, 爬行 páxíng: bò, 爬虫: bò sát).              |
| 争 / 爭 |    zhēng    |  Tranh   | Phồn `爫 + 彐 + 亅`   | [Khang Hy `爭`: bộ 爪 / Giản thể `争`: bộ ⺈ hoặc 亅] Hội ý cổ: hai tay (`爫` và `又/彐`) cùng kéo giật một vật → tranh giành, phấn đấu (战争: chiến tranh, 争取: tranh thủ). |
|   爰    |    yuán     |   Viên   | `爫` + `友`           | [Tra bộ 爪] Hội ý cổ: hai tay nắm kéo/dẫn dắt; giả tá làm hư từ văn ngôn nghĩa "bèn, do đó" (làm gốc thanh/ý cho `援, 暖, 缓`: 爰引, 爰例).                                   |

### Nhóm B: Dẫn dắt, chức tước & cổ tự thuộc bộ `爪`

| Chữ Hán |  Pinyin   | Hán Việt | Thiên bàng đứng chung     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                 |
| :-----: | :-------: | :------: | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 为 / 爲 | wéi / wèi | Vi / Vị  | Phồn `爲` (bộ `爪`)       | [Khang Hy `爲`: bộ 爪 / Giản thể `为`: bộ 丶] Cổ tự `爲` vẽ bàn tay (`爫`) dắt voi làm việc → `wéi`: làm, trở thành (认为, 作为); `wèi`: vì, cho (为了, 因为). |
|   爵    |    jué    |   Tước   | `爫` + `罒` + `艮` + `寸` | [Tra bộ 爪] Cổ tự là tay rót chén rượu tế 3 chân bằng đồng → chén tước, tước vị phong kiến (爵位 juéwèi: tước vị, 爵士 juéshì: hiệp sĩ/nhạc jazz).             |
|   爯    |   chēng   |   Xưng   | `爫` + `冉`               | [Tra bộ 爪] Hội ý cổ: bàn tay (`爫`) nhấc vật lên để cân đo (chính là hình gốc của chữ `称` trong cổ tự, nghĩa là cân nhắc, giơ lên).                          |

### Nhóm C: Chữ có trảo đầu `爫` tra theo bộ `爪` trong bảng tra Giản thể hiện đại

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                          |
| :-----: | :----: | :------: | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   爱    |   ài   |    Ái    | `爫` + `冖` + `友` (Phồn `愛`)   | [Giản thể: bộ 爪(爫) / Phồn thể `愛`: bộ 心] Lược `心` ở giữa trong Giản thể; nghĩa: yêu, thích, dễ bị (爱情 àiqíng: tình yêu, 爱好 àihào: sở thích, 可爱: đáng yêu).   |
|   采    |  cǎi   |   Thái   | `爫` (tay) + `木` (cây)          | [Bảng tra hiện đại: bộ 爪(爫) hoặc 木 / Khang Hy: bộ 釆] Hội ý: bàn tay (`爫`) hái quả trên cây (`木`) → hái, thu thập, tinh thần (采摘 cǎizhāi: hái, 采访: phỏng vấn). |
|   觅    |   mì   |   Mịch   | `爫` + `见` (Phồn `覓`: `爫+見`) | [Một số bảng tra Giản thể: bộ 爪(爫) / Khang Hy `覓`: bộ 見] Hội ý: giơ tay che mắt ngóng tìm → tìm kiếm (寻觅 xúnmì: tìm kiếm, 觅食 mìshí: kiếm ăn).                   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `抓` (`zhuā` · Trảo · `扌 + 爪` — túm bắt, cào: `抓住`, `抓紧`; xếp bộ `手/扌`).
- `受` (`shòu` · Thụ · `爫 + 冖 + 又` — tay trên trao, tay dưới nhận → tiếp nhận, chịu đựng: `接受`, `感受`; xếp bộ `又`).
- `妥` (`tuǒ` · Thỏa · `爫 + 女` — vỗ về yên ổn → ổn thỏa, thích đáng: `妥当`, `妥协`; xếp bộ `女`).
- `孚 / 乳 / 浮` (`fú / rǔ / fú` — đều chứa `爫 + 子`, lần lượt xếp bộ `子`, `乙`, `水/氵`).
- `瓜` (`guā` · Qua — bộ riêng `#97`, 5 nét, có chấm trong khung bụng — quả dưa: `西瓜`, `黄瓜`; rất dễ nhầm với `爪`).
- `摇 / 溪 / 瑶` (chứa `爫` ở thành phần bên phải `䍃` hoặc `奚`, lần lượt xếp bộ `手/扌`, `水/氵`, `玉/王`).
- `手 / 扌` và `又` (bộ riêng cùng nhóm nghĩa bàn tay).

---

## Bộ 123: 父 (Phụ)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-058` · `radical_index`: `58` · `strokes`: `4` nét · `name_vi`: `bộ Phụ` · Khang Hy `#88` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `父` — dạng chính duy nhất (4 nét: `丿 丶 丿 ㇏`); đứng độc lập hoặc đặt **bên trên** chữ ghép (`爸, 爷, 爹, 斧, 釜`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình cổ vẽ **bàn tay cầm chiếc rìu đá hoặc cây gậy**, biểu thị người đàn ông lao động trụ cột, người cha và quyền uy gia trưởng trong gia đình thời cổ.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Cha, bố, bậc cha chú / ông lão, nam giới thế hệ bề trên** (`父亲, 爸, 爹, 爷`). Ngoài ra đôi khi dùng làm thành phần ghi âm/hình trong chữ chỉ rìu hoặc vạc (`斧, 釜`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Có `父` đặt trên đầu chữ hầu như đều liên quan trực tiếp đến các bậc cha, ông trong gia đình (`爸, 爹, 爷`), trừ một số chữ chỉ công cụ mượn âm `fu` (`斧, 釜`).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`父` (Phụ — cha) vs `夫` (Phu — chồng):** `父` (4 nét: 2 nét trên mở sang hai bên + 2 nét giao chéo) là **người cha**; `夫` (`大` đội trâm cài, bộ `大`) là **chồng / người đàn ông trưởng thành** (`丈夫`).
    - **`父` vs `交` (Giao):** Chữ `交` (`亠 + 父`, bộ `亠`) có phần dưới viết giống hệt `父`, nhưng nguồn gốc là hình người đứng vắt chéo hai chân ("giao nhau"), không liên quan đến "cha".
    - **`父` vs `文` (Văn):** `文` có 1 nét chấm + 1 nét ngang ở đỉnh trước hai nét chéo giao nhau; `父` đỉnh trên tách đôi thành phẩy ngắn và chấm phải.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

> _Lưu ý tra cứu:_ Trong hệ thống 214 bộ Khang Hy và từ điển hiện đại, bộ `父` (`#88`) chỉ gồm **4 chữ** thông dụng xếp trực tiếp dưới bộ (`父, 爸, 爹, 爷`), toàn bộ đều là danh từ xưng hô bậc cha, ông.

### Nhóm A: Bậc cha — Cha ruột (`父`, `爸`)

| Chữ Hán | Pinyin  | Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                   |
| :-----: | :-----: | :-------: | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   父    | fù / fǔ | Phụ / Phủ | Đứng độc lập          | [Tra bộ 父] Cha, bố, bậc chú bác (`fù`: 父亲 fùqīn: cha, 父母 fùmǔ: cha mẹ, 祖父: ông nội); đọc `fǔ` trong danh xưng kính trọng cổ (渔父 yúfǔ: ông lão đánh cá). |
|   爸    |   bà    |    Ba     | `父` + `巴`           | [Tra bộ 父] Hình thanh: `父` (cha) + `巴` (`bā`, thanh phù) → bố, ba, cha (gọi thân mật; 爸爸 bàba: bố, 老爸 lǎobà: ông bố, 爸妈: bố mẹ).                        |

### Nhóm B: Cha, ông trong xưng hô địa phương & gia tộc (`爹`, `爷`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                            |
| :-----: | :----: | :------: | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   爹    |  diē   |    Đa    | `父` + `多`                   | [Tra bộ 父] Hình thanh: `父` (cha) + `多` (`duō`, thanh phù cổ) → cha, bố, thầy (khẩu ngữ địa phương & văn học; 爹娘 diēniáng: cha mẹ, 干爹: bố nuôi).                    |
|   爷    |   yé   |   Gia    | `父` + `卩` (Phồn `爺`: `耶`) | [Tra bộ 父] Hình thanh: `父` (bậc trên) + `卩/耶` (thanh phù) → ông nội, ông già, cách gọi tôn xưng thời xưa (爷爷 yéye: ông nội, 大爷 dàyé: bác trai, 老天爷: ông trời). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `斧` (`fǔ` · Phủ · `父 + 斤` — cái rìu: `斧头`, `大刀阔斧`; xếp bộ `斤`, `父` làm phần âm).
- `釜` (`fǔ` · Phủ · `父 + 金` — cái vạc/nồi nấu cổ: `破釜沉舟`; xếp bộ `金`, `父` làm phần âm).
- `布` (`bù` · Bố · `𠂇 + 巾` — vải vóc, bố trí: `布料`, `公布`; xếp bộ `巾`; trong văn tự cổ, phần trên lấy `父` rút gọn làm thanh phù).
- `交` (`jiāo` · Giao · `亠 + 父` — giao nhau, trao đổi: `交通`, `交流`; xếp bộ `亠`, phần dưới chỉ đồng hình với `父`).
- `夫` (`fū` · Phu — bộ Đại `大` — chồng, đàn ông trưởng thành: `丈夫`, `夫妻`).
- `文` (`wén` · Văn — bộ riêng `#67` — văn tự, văn hóa, có nét chấm và ngang trên đỉnh khác `父`).

---

## Bộ 124: 爻 (Hào)

> **`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`** — Bộ `爻` hiện chưa có bản ghi nào trong bảng `hanzihome_radicals` (`status: MISSING`). Dưới đây là thông số và dữ liệu chuẩn hóa đề xuất theo đúng schema DB.

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`) — Đề xuất bổ sung

- **DB ID & Thứ tự:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]` · Đề xuất cấp `id` và `radical_index` kế tiếp chưa sử dụng sau `#244` và sau các bộ bổ sung trước đó khi đồng bộ toàn bộ Nhóm D · `radical`: `爻` · `strokes`: `4` nét · `name_vi`: `bộ Hào` · Khang Hy `#89` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants` — Đề xuất):**
  - `爻` — dạng chính duy nhất (4 nét: `丿 丶 丿 丶`, gồm hai dấu chéo `乂` xếp chồng lên nhau); đứng độc lập, đứng bên trái (`肴` biến thành trên, `驳` bên phải), hoặc lặp đôi ở hai bên chữ (`爽`, Phồn thể `爾, 學, 覺`).
- **Ý nghĩa cốt lõi (`core_meaning` — Đề xuất):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **các thẻ tre / cọng cỏ thi xếp đan chéo vào nhau** khi gieo quẻ bói Chu Dịch; mỗi vạch âm (`--`) hoặc dương (`—`) hợp thành quẻ Bát quái gọi là một **hào** (`爻`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Hào trong quẻ Dịch** (`爻辞, 六爻`) → **đan xen, giao thoa, xuyên suốt** (`驳` màu đan xen, `肴` đồ nhắm bày biện) → **ánh sáng lọt qua khung cửa lưới đan xen chiếu rọi rộng khắp** tạo nghĩa **sáng sủa, sảng khoái** (`爽`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — Đề xuất):**
  - _Nhận diện (`recognition`):_ Trong chữ hiện đại, `爻` hiếm khi đứng độc lập (chủ yếu gặp trong sách về Kinh Dịch), nhưng là thành phần nhận diện cốt lõi trong `爽` (sảng khoái), `驳` (bác bỏ/loang màu) và `肴` (món ngon).
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`爻` (Hào — 2 chữ `乂` chồng, 4 nét) vs `乂` / `文` / `父`:** `爻` có **hai chữ `乂` chồng dọc** thành 4 nét chéo nhau; `文` là `亠` trên một chữ `乂` (cấu tạo văn tự); `父` phần trên mở phẩy-chấm chứ không chéo kín hai tầng như `爻`.
    - **`爻` vs ký hiệu giản hóa `⺍` trong `学, 觉`:** Trong Phồn thể `學` và `覺`, phần đầu có hai chữ `爻` kẹp lấy `臼`; khi giản hóa thành `学, 觉`, hai chữ `爻` bị lược sạch thành `⺍` (3 chấm/phẩy), chỉ còn giữ ở bộ `子` và `见`.
    - **`爾` (Phồn thể — bộ `爻`) vs `尔` (Giản thể — bộ `小`):** `爾` có 4 nét chéo `爻` ở giữa nên Khang Hy xếp bộ `爻`; khi giản thể thành `尔`, phần đáy đổi thành `小`.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups` — Đề xuất)

> _Lưu ý tra cứu:_ Bộ `爻` (`#89`) có rất ít chữ xếp trực tiếp dưới bộ trong tự điển; ngoài `爻` và `爽`, chữ quen thuộc `尔` chỉ xếp ở bộ `爻` ở dạng Phồn thể `爾`.

### Nhóm A: Quẻ Dịch & Sáng sủa, thông thoáng (`爻`, `爽`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                               |
| :-----: | :----: | :------: | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   爻    |  yáo   |   Hào    | Đứng độc lập                 | [Tra bộ 爻] Tượng hình thẻ cỏ thi xếp chéo khi bói → vạch hào trong quẻ Dịch, sự giao thoa (爻辞 yáocí: lời giải hào quẻ Dịch, 六爻: sáu hào).                               |
|   爽    | shuǎng |   Sảng   | `大` + 4 chữ `乂` (hai `爻`) | [Khang Hy: bộ 爻 / Bảng tra Giản thể có khi xếp 大] Ánh sáng qua ô cửa lưới đan xen → sảng khoái, mát mẻ, thẳng thắn, sai lệch (凉爽 liángshuǎng: mát mẻ, 爽快: sảng khoái). |

### Nhóm B: Khác biệt Phồn–Giản & cổ tự xếp bộ `爻`

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                        |
| :-----: | :----: | :------: | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 尔 / 爾 |   ěr   |   Nhĩ    | Phồn `爾` chứa 4 `乂` (2 `爻`) | [Khang Hy `爾`: bộ 爻 / Giản thể `尔`: bộ 小] Đại từ ngôi thứ hai cổ ("ngươi, mày"), như thế (偶尔 ǒu'ěr: thỉnh thoảng, 首尔 Shǒu'ěr: Seoul, 尔虞我诈: lừa lọc nhau). |
|   爼    |   zǔ   |   Trở    | `爻` + `且`                    | [Tra bộ 爻] Cổ tự dị thể của `俎` (`且` cái bàn thờ/thớt bày đồ tế có nét đan chéo); nghĩa: thớt thái thịt, đồ bày lễ vật tế (爼豆 zǔdòu: đồ tế lễ).                  |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components` — Đề xuất)

- `驳` (`bó` · Bác · `马 + 爻`, Phồn `駁` — ngựa màu lông đan xen → bác bỏ, phản đối, vận chuyển nối tiếp: `反驳`, `驳回`; xếp bộ `馬/马`).
- `肴` (`yáo` · Hào · `爻 + 月(肉)` — món ăn, thức nhắm ngon: `佳肴`, `菜肴`; xếp bộ `肉/月`).
- `学 / 學` và `觉 / 覺` (`xué / jué` — Phồn thể mang cặp `爻` hai bên đầu chữ `𦥯`, Giản thể rút gọn thành `⺍`; xếp bộ `子` và `見/见`).
- `希` (`xī` · Hi · `乂 + 布` — thưa thớt, hy vọng: `希望`, `稀少`; chỉ chứa 1 `乂` trên đầu, không phải `爻` 2 tầng, xếp bộ `巾`).
- `凶` (`xiōng` · Hung · `凵 + 乂` — hung dữ, tai họa; chỉ chứa 1 `乂` trong khung `凵`, xếp bộ `凵`).

---

## Bộ 125: 爿 (Tường)

> **`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`** — Bộ `爿` hiện chưa có bản ghi nào trong bảng `hanzihome_radicals` (`status: MISSING`). Dưới đây là thông số và dữ liệu chuẩn hóa đề xuất theo đúng schema DB.

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`) — Đề xuất bổ sung

- **DB ID & Thứ tự:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]` · Đề xuất cấp `id` và `radical_index` kế tiếp chưa sử dụng sau `#244` và sau các bộ bổ sung trước đó khi đồng bộ toàn bộ Nhóm D · `radical`: `爿` (biến thể Giản thể: `丬`) · `strokes`: `4` nét (dạng Giản thể `丬` có `3` nét) · `name_vi`: `bộ Tường` · Khang Hy `#90` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants` — Đề xuất):**
  - `爿` — dạng chính truyền thống (4 nét: `㇄ 丨 一 丿` hoặc `丨 一 丨 丶` tùy chuẩn chữ); đứng bên **trái** trong chữ Phồn thể (`牆, 壯, 狀, 將, 裝, 妝, 牀`).
  - `丬` — **tướng tự bàng** (`将字旁`), biến thể Giản thể chuẩn hóa còn **3 nét** (`丶 ㇀ 丨`), hầu như luôn đứng bên **trái** chữ Giản thể (`壮, 状, 将, 妆, 装, 寝`).
- **Ý nghĩa cốt lõi (`core_meaning` — Đề xuất):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **nửa bên trái của cây gỗ `木` khi bị bổ dọc làm đôi** (bên trái là `爿`, bên phải là `片`). Khi dựng thẳng, tấm gỗ dày bên trái biểu trưng cho **cái giường, phản gỗ, vách tường dựng đứng**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Giường phản, vách tường, tấm ván dựng** (`牀, 牆`) → đóng vai trò **thành phần cấu tạo chỉ thanh âm `qiang / zhuang / jiang`** trong hàng loạt chữ ghép hiện đại rất quen thuộc (`壮, 状, 将, 妆, 装, 奖, 酱`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — Đề xuất):**
  - _Nhận diện (`recognition`):_ Thấy `丬` (3 nét) bên trái chữ Giản thể (tương ứng `爿` 4 nét ở Phồn thể) thường liên quan tới gốc gỗ dựng giường/tường hoặc gợi vần `zhuang / jiang / qiang`.
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `爿 / 丬` vs `片`:_
    - **`爿 / 丬` (bộ Tường `#90`) vs `片` (bộ Phiến `#91`):**
      1. **Cặp đối xứng từ chữ `木` bổ đôi:** `爿` là **nửa bên trái** (nét sổ thẳng nằm bên phải, lưng hướng vào giữa chữ ghép), nghĩa gốc thiên về **ván dày dựng đứng, giường phản, tường vách**; `片` là **nửa bên phải** (nét phẩy đứng nằm bên trái), nghĩa gốc thiên về **tấm ván mỏng, mảnh lát, thẻ viết**.
      2. **Sự thay đổi ở chữ Giản thể:** `爿` được đơn giản hóa hàng loạt thành `丬` (3 nét: chấm, hất, sổ — giống như `氵/冫` gắn vào một nét sổ) trong `壮, 状, 将, 妆` hoặc biến hẳn ở `墙` (đổi sang `土`) và `床` (đổi sang `广`); ngược lại, `片` giữ nguyên dạng 4 nét `片` trong cả Phồn thể lẫn Giản thể (`版, 牌, 牒`).
    - **Phân biệt `丬` (3 nét) vs `氵` (3 nét) / `冫` (2 nét):** `丬` gồm 1 chấm + 1 hất + **1 nét sổ thẳng dài** bên phải; `氵` gồm 3 chấm/hất rời nhau, không có nét sổ dài.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups` — Đề xuất)

> _Lưu ý tra cứu:_ Trong 214 bộ Khang Hy, các chữ thông dụng dùng `爿` như `壯, 狀, 將, 裝, 妝` lần lượt được xếp ở các bộ `士, 犬, 寸, 衣, 女`; chỉ một số ít chữ như `牆, 牀, 牂, 牁` xếp trực tiếp ở bộ `爿` (`#90`). Trong bảng tra Giản thể hiện đại, các chữ giữ mặt `丬` ở bên trái (`壮, 状, 将, 妆`) thường được quy chung về bộ `丬` (`爿`).

### Nhóm A: Tường vách, giường phản & chữ xếp chính thức bộ `爿` (Khang Hy #90)

| Chữ Hán |   Pinyin    | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                |
| :-----: | :---------: | :------: | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   爿    | pán / qiáng |  Tường   | Đứng độc lập                    | [Tra bộ 爿] Tượng hình nửa trái tấm gỗ bổ đôi; chỉ mảnh ván bổ đôi, cái sạp/phản, lượng từ cho cửa hàng/ruộng đồng phương ngôn (`一爿店`: một cửa hàng).      |
| 墙 / 牆 |    qiáng    |  Tường   | Phồn `爿 + 嗇` / Giản `土 + 啬` | [Khang Hy `牆`: bộ 爿 / Giản thể `墙`: bộ 土] Bức tường vách dựng thẳng (墙壁 qiángbì: bức tường, 城墙: tường thành, 墙角: góc tường).                        |
| 床 / 牀 |   chuáng    |   Sàng   | Phồn `爿 + 木` / Giản `广 + 木` | [Khang Hy `牀`: bộ 爿 / Giản thể `床`: bộ 广] Giường phản bằng gỗ ghép ván → cái giường, lòng sông, máy tiện (床单 chuángdān: ga trải giường, 起床: ngủ dậy). |
|   牂    |    zāng     |   Tang   | `爿` + `羊`                     | [Tra bộ 爿] Hình thanh kiêm hội ý: cừu cái, cỏ cây tươi tốt, tên địa danh cổ (牂牁 Zāngkē: quận/sông Tang Kha thời Hán).                                      |
|   牁    |     kē      |   Kha    | `爿` + `可`                     | [Tra bộ 爿] Hình thanh kiêm hội ý: cọc gỗ đóng dưới nước để buộc thuyền (dùng trong địa danh lịch sử 牂牁).                                                   |

### Nhóm B: Chữ Giản thể dùng biến thể `丬` ở bên trái (Bảng tra hiện đại xếp `丬/爿`)

| Chữ Hán |    Pinyin     | Hán Việt | Thiên bàng đứng chung            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                   |
| :-----: | :-----------: | :------: | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   壮    |    zhuàng     |  Tráng   | `丬` + `士` (Phồn `壯`: `爿+士`) | [Bảng tra Giản thể: bộ 丬(爿) / Khang Hy: bộ 士] Người đàn ông (`士`) vạm vỡ cao lớn (`爿`) → khỏe mạnh, tráng kiện, hùng vĩ (强壮: khỏe mạnh, 壮观: hùng vĩ).   |
|   状    |    zhuàng     |  Trạng   | `丬` + `犬` (Phồn `狀`: `爿+犬`) | [Bảng tra Giản thể: bộ 丬(爿) / Khang Hy: bộ 犬] Hình dáng, trạng thái, tờ trạng/giấy chứng nhận (状态 zhuàngtài: trạng thái, 形状: hình dạng, 奖状: giấy khen). |
|   将    | jiāng / jiàng |  Tương   | `丬` + `夕+寸` (Phồn `將`)       | [Bảng tra Giản thể: bộ 丬(爿) / Khang Hy: bộ 寸] `jiāng`: sắp sửa, sẽ, đem (将来 jiānglái: tương lai); `jiàng`: vị tướng, chỉ huy (将军 jiāngjūn: tướng quân).   |
|   妆    |    zhuāng     |  Trang   | `丬` + `女` (Phồn `妝`: `爿+女`) | [Bảng tra Giản thể: bộ 丬(爿) / Khang Hy: bộ 女] Phụ nữ chải chuốt làm đẹp → trang điểm, của hồi môn (化妆 huàzhuāng: trang điểm, 嫁妆: của hồi môn).            |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components` — Đề xuất)

- `片` (`piàn / piān` · Phiến — bộ riêng `#91` kế tiếp, nửa phải của cây gỗ bổ đôi, đối xứng với `爿`).
- `装` (`zhuāng` · Trang · `壮 + 衣` — trang phục, đóng gói, giả vờ: `服装`, `安装`, `装作`; xếp bộ `衣`).
- `寝` (`qǐn` · Tẩm · `宀 + 丬 + ...`, Phồn `寢` — ngủ nghỉ: `寝室`, `就寝`; xếp bộ `宀`).
- `酱` (`jiàng` · Tương · `将` tỉnh `丬+夕` + `酉`, Phồn `醬` — nước tương, xốt: `酱油`, `果酱`; xếp bộ `酉`).
- `奖` (`jiǎng` · Tưởng · `丬+夕 + 大`, Phồn `獎` — khen thưởng, giải thưởng: `奖金`, `奖励`; xếp bộ `大`).
- `浆` (`jiāng` · Tương · `丬+夕 + 水`, Phồn `漿` — chất lỏng sệt, bột hồ: `豆浆`, `纸浆`; xếp bộ `水`).
- `戕` (`qiāng` · Tường · `爿 + 戈` — giết hại: `自相残戕`; xếp bộ `戈`).
- `斨` (`qiāng` · Thương · `爿 + 斤` — cái rìu lỗ vuông cổ; xếp bộ `斤`).

---

## Bộ 126: 片 (Phiến)

> **`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`** — Bộ `片` hiện chưa có bản ghi nào trong bảng `hanzihome_radicals` (`status: MISSING`). Dưới đây là thông số và dữ liệu chuẩn hóa đề xuất theo đúng schema DB.

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`) — Đề xuất bổ sung

- **DB ID & Thứ tự:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]` · Đề xuất cấp `id` và `radical_index` kế tiếp chưa sử dụng sau `#244` và sau các bộ bổ sung trước đó khi đồng bộ toàn bộ Nhóm D · `radical`: `片` · `strokes`: `4` nét · `name_vi`: `bộ Phiến` · Khang Hy `#91` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants` — Đề xuất):**
  - `片` — dạng chính duy nhất (4 nét: `丿 丨 一 𠃍`); giữ nguyên hình thái cả ở Phồn thể và Giản thể; đứng độc lập hoặc luôn đứng **bên trái** chữ ghép (`版, 牌, 牒, 牍, 牖`).
- **Ý nghĩa cốt lõi (`core_meaning` — Đề xuất):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **nửa bên phải của cây gỗ `木` bị bổ dọc làm đôi** (bên trái là `爿`, bên phải là `片`); chỉ **tấm ván gỗ, mảnh gỗ mỏng xẻ ra**.
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ Từ **mảnh gỗ mỏng** mở rộng sang **tấm phẳng mỏng, lát cắt, khoảnh khắc ngắn, lượng từ cho ảnh/thuốc/mảnh đất** (`照片, 一片, 肉片, 动画片`) → **ván khắc in ấn, biển bảng gỗ, thẻ gỗ viết văn thư, khung cửa sổ gỗ** (`版, 牌, 牒, 牍, 牖`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — Đề xuất):**
  - _Nhận diện (`recognition`):_ Có `片` ở bên trái gần như luôn liên quan đến tấm ván, bản in, bảng biển, thẻ văn thư hoặc mảnh mỏng/tấm phẳng.
  - _Phân biệt dễ nhầm (`distinguish`) — Đặc biệt làm rõ `片` vs `爿`:_
    - **`片` (bộ Phiến `#91` — 4 nét: `丿 丨 一 𠃍`) vs `爿` (bộ Tường `#90`):** `片` có nét phẩy đứng bên **trái** và hai nét tạo góc móc bên phải (nửa phải cây gỗ bổ đôi), luôn giữ nguyên dạng 4 nét trong Giản thể; `爿` là nửa trái (nét sổ dài ở bên phải) và đã rút gọn thành `丬` (3 nét) trong chữ Giản thể (`壮, 状`).
    - **`版` (`片 + 反`) vs `板` (`木 + 反`):** Hai chữ cùng đọc `bǎn` (Bản) và đều có gốc ván gỗ: `版` (bộ `片`) chỉ **bản in, ấn bản, phiên bản, trang báo** (`出版, 版本`); `板` (bộ `木`) chỉ **tấm ván, bảng đen, ông chủ** (`黑板, 地板, 老板`).
    - **Phát âm của `片`:** Đọc `piàn` khi chỉ mảnh, tấm, lát, bức ảnh (`照片, 名片`); đọc `piān` (hoặc khẩu ngữ Bắc Kinh thêm nhi hóa `piānr`) khi chỉ băng đĩa, phim ảnh (`唱片, 动画片`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups` — Đề xuất)

### Nhóm A: Mảnh mỏng, bản in & bảng hiệu thông dụng

| Chữ Hán |   Pinyin    | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                          |
| :-----: | :---------: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   片    | piàn / piān |  Phiến   | Đứng độc lập          | [Tra bộ 片] Tấm ván, mảnh mỏng, lát cắt, lượng từ (`piàn`: 照片 zhàopiàn: ảnh chụp, 名片: danh thiếp, 一片: một mảnh/vùng); phim, đĩa (`piān`: 动画片: phim hoạt hình). |
|   版    |     bǎn     |   Bản    | `片` + `反`           | [Tra bộ 片] Hình thanh kiêm hội ý: ván gỗ phẳng khắc chữ in → bản khắc, ấn bản, phiên bản, trang báo (出版 chūbǎn: xuất bản, 版本 bǎnběn: phiên bản, 版权: bản quyền).  |
|   牌    |     pái     |   Bài    | `片` + `卑`           | [Tra bộ 片] Hình thanh kiêm hội ý: tấm gỗ treo thông báo/ghi hiệu → tấm bảng, biển hiệu, quân bài, thương hiệu (品牌 pǐnpái: thương hiệu, 牌子: biển/hiệu, 扑克牌).     |
|   牓    |    bǎng     |   Bảng   | `片` + `旁`           | [Tra bộ 片] Hình thanh kiêm hội ý: tấm bảng gỗ yết thị niêm yết tên người đỗ đạt (dị thể cổ của chữ `榜`, dùng trong văn thư cổ: 牓文, 榜眼).                           |

### Nhóm B: Thẻ gỗ, giấy tờ & công văn hành chính cổ

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                   |
| :-----: | :----: | :------: | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   牒    |  dié   |   Điệp   | `片` + `枼`                   | [Tra bộ 片] Hình thanh kiêm hội ý: thẻ gỗ lát mỏng để viết → công văn, văn thư, gia phả, giấy thông hành (通牒 tōngdié: tối hậu thư, 谱牒 pǔdié: gia phả).       |
|   牍    |   dú   |   Độc    | `片` + `卖` (Phồn `牘`: `賣`) | [Tra bộ 片] Hình thanh kiêm hội ý: thẻ gỗ dài 1 thước dùng viết công văn/thư từ thời Hán → văn thư, hồ sơ (文牍 wéndú: công văn giấy tờ, 案牍: hồ sơ công việc). |
|   牋    |  jiān  |   Tiên   | `片` + `戋` (hoặc `箋`)       | [Tra bộ 片] Hình thanh: thẻ gỗ/giấy nhỏ hoa văn dùng viết thư tín, thơ ca hoặc chú giải kinh sách (dị thể cổ của `笺`, gặp trong 诗牋, 牋注).                    |

### Nhóm C: Khung cửa gỗ, ghép đôi & cấu tạo ván ghép

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                           |
| :-----: | :----: | :------: | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   牖    |  yǒu   |    Dũ    | `片` + `戶` + `甫`    | [Tra bộ 片] Hội ý: cửa sổ đóng khung gỗ trổ trên vách tường (để đón ánh sáng, soi sáng) → cửa sổ, khai sáng (蓬户瓮牖 pénghù-wèngyǒu: nhà nghèo cửa cỏ, 牖民: khai trí). |
|   牉    |  pàn   |   Phán   | `片` + `半`           | [Tra bộ 片] Hội ý: nửa mảnh gỗ tách đôi rồi khớp ghép lại làm tín vật; trong lễ nghi cổ dùng chỉ hai nửa hợp thành vợ chồng (牉合 pànhé: kết hợp vợ chồng).              |
|   牎    | chuāng |   Song   | `片` + `囱`           | [Tra bộ 片] Hội ý: cửa sổ làm bằng khung gỗ thông gió/ánh sáng (dị thể cổ của `窗`, thường gặp trong văn bia và thư tịch cổ).                                            |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components` — Đề xuất)

- `爿` (`pán / qiáng` · Tường — bộ riêng `#90`, nửa bên trái của cây gỗ bổ đôi, đối xứng với `片`).
- `板` (`bǎn` · Bản · `木 + 反` — tấm ván gỗ, bảng đen, ông chủ: `黑板`, `地板`, `老板`; xếp bộ `木`, đồng âm và rất dễ nhầm với `版`).
- `偏 / 遍 / 骗 / 篇` (`piān / biàn / piàn / piān` — mang phần `扁`, KHÔNG chứa bộ `片`; dễ nhầm do đọc gần giống `片`).
- `判 / 叛` (`pàn` · Phán / Bội · `半 + 刂` và `半 + 反` — phán xét, phản bội; xếp bộ `刀/刂` và `又`).
- `鼎` (`dǐng` · Đỉnh — bộ Đỉnh `#206`, hai bên thân chân đỉnh cổ có nét gần `爿` và `片`).
- `渊` (`yuān` · Uyên · `氵 + 𣶒` — vực sâu: `渊博`; phần giữa là hình hai bờ kẹp nước trông hơi giống `爿/片`, xếp bộ `水/氵`).

---

## Bộ 127: 牙 (Nha)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-082` · `radical_index`: `82` · `strokes`: `4` nét · `name_vi`: `bộ Nha` · Khang Hy `#92` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants`):**
  - `牙` — dạng chính duy nhất (4 nét: `一 𠄌 亅 丿`); đứng độc lập, đứng bên trái (`雅, 邪, 鸦`), bên phải (`呀, 讶`), hoặc bên dưới (`芽, 穿`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **răng hàm / răng nanh trên dưới cắn khớp vào nhau** (hai chiếc răng nanh mọc sole ăn khớp).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Răng, răng nanh, nha khoa, ngà voi, vật có răng cưa ăn khớp** (`牙齿, 牙医, 象牙, 蓝牙`). Trong phần lớn chữ ghép thông dụng (`芽, 呀, 鸦, 雅, 邪`), `牙` đóng vai trò **thanh phù** gợi âm `ya / ye / xie`, không trực tiếp mang nghĩa "răng".
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện (`recognition`):_ Khi đứng riêng hoặc nằm trong từ ghép (`牙齿, 牙膏, 刷牙`), `牙` nghĩa là răng/nha/ngà; khi làm linh kiện trong chữ ghép (`芽, 呀, 讶, 鸦`), chủ yếu gợi âm đọc `ya`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`牙` (bộ Nha `#92`, 4 nét) vs `齒 / 齿` (bộ Xỉ `#211`):** Trong cổ văn, `齒/齿` chỉ răng cửa/răng nói chung, còn `牙` chỉ răng hàm/răng nanh. Trong tiếng Trung hiện đại, hai chữ thường ghép chung thành `牙齿` (yáchǐ: răng), hoặc dùng `牙` trong hầu hết từ ghép sinh hoạt (`牙刷, 牙膏, 牙医`), còn bộ `齿` giữ vai trò bộ thủ của nhóm chữ chuyên sâu về răng (`龄, 龋`).
    - **`牙` vs `乐` (Lạc / Nhạc — 5 nét):** `牙` nét đầu là ngang thẳng `一`, có nét sổ móc `亅` thẳng đứng; `乐` nét đầu là phẩy ngắn `丿` ở đỉnh và phần dưới có dạng `小`.
    - **Ý nghĩa hiện đại mở rộng:** `蓝牙` (lányá: Bluetooth — dịch nghĩa từ "Răng Xanh"), `月牙` (yuèyá: trăng lưỡi liềm).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

> _Lưu ý tra cứu:_ Trong 214 bộ Khang Hy và từ điển hiện đại, bộ `牙` (`#92`) chỉ có **2 chữ** xếp trực tiếp dưới bộ là `牙` và cổ tự `牚` (`撑`). Để người học nắm trọn vẹn các chữ thông dụng có thành phần `牙`, Nhóm B liệt kê thêm 5 chữ ghép quen thuộc mang `牙` ở vị trí thanh/ý kèm ký hiệu `[Tra bộ khác]` và đối chiếu chi tiết tại Mục 3.

### Nhóm A: Răng, ngà & chữ xếp chính thức bộ `牙` (Khang Hy #92)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                        |
| :-----: | :----: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
|   牙    |   yá   |   Nha    | Đứng độc lập          | [Tra bộ 牙] Tượng hình hai hàm răng khớp nhau → răng, răng nanh, ngà, nha khoa (牙齿 yáchǐ: răng, 牙医 yáyī: nha sĩ, 刷牙: đánh răng, 象牙: ngà voi). |
|   牚    | chēng  |   Xanh   | `尚` + `牙`           | [Tra bộ 牙] Hình thanh kiêm hội ý: thanh chống nghiêng, chống đỡ vững chắc (chữ cổ/dị thể của `撑`; hiện đại dùng `撑` xếp bộ `扌`).                  |

### Nhóm B: Chữ thông dụng mang `牙` làm thành phần ý hoặc thanh phù (thuộc bộ khác)

| Chữ Hán |  Pinyin  | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                    |
| :-----: | :------: | :------: | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   穿    |  chuān   |  Xuyên   | `穴` + `牙`           | [Tra bộ 穴, chứa 牙] Hội ý: thú dùng răng (`牙`) khoét hang (`穴`) → đâm xuyên, luồn qua, mặc (quần áo) (穿过 chuānguò: đi xuyên qua, 穿衣服: mặc áo).            |
|   雅    |    yǎ    |   Nhã    | `牙` + `隹`           | [Tra bộ 隹, chứa 牙] Hình thanh: `牙` (thanh phù) + `隹` (chim); gốc tên loài chim quạ, giả tá nghĩa tao nhã, lịch sự (优雅 yōuyǎ: tao nhã, 雅致: thanh nhã).     |
|   邪    | xié / yé | Tà / Da  | `牙` + `阝`           | [Tra bộ 邑/阝, chứa 牙] Hình thanh: gốc tên đất cổ, sau chuyển nghĩa tà ác, lệch lạc, ma tà (邪恶 xié'è: tà ác, 邪门: kỳ quái); đọc `yé` trong văn ngôn (`莫邪`). |
|   芽    |    yá    |   Nha    | `艹` + `牙`           | [Tra bộ 艹, chứa 牙] Hình thanh kiêm hội ý: `艹` (cỏ cây) + `牙` (nhú mầm nhọn như răng nanh, thanh phù) → mầm non, chồi cây (发芽 fāyá: nảy mầm, 豆芽: giá đỗ).  |
|   鸦    |    yā    |   Nha    | `牙` + `鸟`           | [Tra bộ 鸟/鳥, chứa 牙] Hình thanh: `牙` (thanh phù mô phỏng tiếng kêu) + `鸟` (chim) → con quạ (乌鸦 wūyā: con quạ đen, 鸦雀无声: im phăng phắc).                |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `穿` (`chuān` · Xuyên · `穴 + 牙` — xuyên thủng, mặc quần áo: `穿过`, `穿衣服`; xếp bộ `穴`).
- `雅` (`yǎ` · Nhã · `牙 + 隹` — tao nhã, lịch thiệp: `优雅`, `高雅`; xếp bộ `隹`).
- `邪` (`xié / yé` · Tà / Da · `牙 + 阝` — tà ác, lệch lạc: `邪恶`, `正邪`; xếp bộ `邑/阝 phải`).
- `芽` (`yá` · Nha · `艹 + 牙` — mầm non, chồi: `发芽`, `豆芽`; xếp bộ `艸/艹`).
- `呀` (`ya / yā` · Nha · `口 + 牙` — trợ từ ngữ khí cuối câu / tiếng kêu kinh ngạc: `哎呀`, `好呀`; xếp bộ `口`).
- `鸦` (`yā` · Nha · `牙 + 鸟`, Phồn `鴉` — con quạ: `乌鸦`; xếp bộ `鳥/鸟`).
- `讶` (`yà` · Nhạ · `讠 + 牙`, Phồn `訝` — ngạc nhiên: `惊讶`; xếp bộ `言/讠`).
- `齒 / 齿` (`chǐ` · Xỉ — bộ riêng `#211` — răng nói chung: `牙齿`, `年龄`).

---

## Bộ 128: 玄 (Huyền)

> **`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`** — Bộ `玄` hiện chưa có bản ghi nào trong bảng `hanzihome_radicals` (`status: MISSING`). Dưới đây là thông số và dữ liệu chuẩn hóa đề xuất theo đúng schema DB.

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`) — Đề xuất bổ sung

- **DB ID & Thứ tự:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]` · Đề xuất cấp `id` và `radical_index` kế tiếp chưa sử dụng sau `#244` và sau các bộ bổ sung trước đó khi đồng bộ toàn bộ Nhóm D · `radical`: `玄` · `strokes`: `5` nét _(lưu ý: theo chuẩn Khang Hy `#95`, bộ `玄` có **5 nét** `亠 + 幺`, được biên soạn tiếp nối ở cuối tập 09 sau khi bỏ qua `#93 牛` và `#94 犬` đã có ở Nhóm C)_ · `name_vi`: `bộ Huyền` · Khang Hy `#95` · Dòng trùng/rỗng: Không có.
- **Hình thái & Biến thể (`variants` — Đề xuất):**
  - `玄` — dạng chính duy nhất (5 nét: `丶 一 𠃋 𠃋 丶`, gồm `亠` trên `幺`); đứng độc lập, nằm ở giữa (`率`), bên trên (`蓄` dưới `艹`, `悬` qua `县`), hoặc bên phải (`弦, 炫, 眩`).
- **Ý nghĩa cốt lõi (`core_meaning` — Đề xuất):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cuộn tơ nhỏ xoắn lại nhuộm màu đen sẫm (màu huyền)**; trong văn hóa cổ đại, màu đen thẫm của bầu trời đêm sâu thẳm gọi là "huyền" (`天地玄黄`).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Màu đen huyền** → **sâu xa, huyền bí, cao siêu, khó lường** (`玄妙, 玄学, 玄关`) → **mơ hồ, khó tin** trong khẩu ngữ hiện đại (`玄乎`). Khi đóng vai trò thanh phù (`弦, 炫, 眩, 悬`) mang âm `xuan / xian` và thường gợi ý ánh sáng chói lòa, treo lơ lửng hoặc dây cung căng.
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — Đề xuất):**
  - _Nhận diện (`recognition`):_ Có `玄` đứng riêng gợi màu đen sẫm, sự huyền bí sâu xa; nằm trong chữ ghép (`弦, 悬, 炫, 眩`) phần lớn làm thanh phù phát âm `xuan / xian`.
  - _Phân biệt dễ nhầm (`distinguish`):_
    - **`玄` (Huyền `#95` — 5 nét: `亠 + 幺`) vs `幺` (Yêu `#52` — 3 nét):** `玄` có thêm phần đầu `亠` (`丶 + 一`) đặt trên `幺`; `幺` chỉ có 3 nét (`𠃋 𠃋 丶`), nghĩa là nhỏ bé.
    - **`玄` vs `兹` (`zī`, Tư):** Trong Giản thể `兹` (Phồn thể `茲`, xếp bộ `艹`), cặp `幺` đặt dưới `丷 + 一`, khác `玄` chỉ có 1 `幺` dưới `亠`.
    - **Chữ `率` (`shuài / lǜ`):** Đây là chữ thông dụng bậc nhất thực sự xếp ở bộ `玄` trong Khang Hy (`玄` nằm chính giữa khung lưới săn).
    - **Phân biệt `悬` (treo — bộ `心`) vs `玄`:** Trong Giản thể `悬`, chữ `县` ở trên mang dáng nét gần `且`, bản chất lịch sử là rút gọn của `縣` (treo ngược cái đầu, có chứa `系`), không phải chứa `玄` nguyên vẹn.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups` — Đề xuất)

> _Lưu ý tra cứu:_ Trong 214 bộ Khang Hy, bộ `玄` (`#95`, 5 nét) chỉ có **4 chữ** cơ bản xếp trực tiếp dưới bộ (`玄, 率, 玅, 玆`). Để người học nắm đầy đủ hệ thống từ vựng thông dụng gắn với hình thể/thanh phù `玄`, Nhóm B bổ sung thêm các chữ quen thuộc chứa `玄` (hoặc cấu tạo liên quan) kèm ký hiệu `[Tra bộ khác]` và đối chiếu chi tiết tại Mục 3.

### Nhóm A: Sâu xa, dẫn dắt & chữ xếp chính thức bộ `玄` (Khang Hy #95)

| Chữ Hán |   Pinyin   |  Hán Việt   | Thiên bàng đứng chung       | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                           |
| :-----: | :--------: | :---------: | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|   玄    |    xuán    |    Huyền    | Đứng độc lập                | [Tra bộ 玄] Tơ nhuộm đen sẫm → màu đen huyền, sâu xa, huyền bí, khó tin (玄妙 xuánmiào: huyền diệu, 玄学: huyền học, 玄关: tiền sảnh vào nhà, 玄乎: khó tin).            |
|   率    | shuài / lǜ | Suất / Luật | `亠` + `玄` + 4 chấm + `十` | [Tra bộ 玄] Lưới săn chim có dây rút giữa → `shuài`: dẫn dắt, thẳng thắn, khinh suất (率领, 坦率, 草率); `lǜ`: tỷ lệ, tần suất (效率 xiàolǜ: hiệu suất, 利率: lãi suất). |
|   玅    |    miào    |    Diệu     | `玄` + `少`                 | [Tra bộ 玄] Cổ tự dị thể của `妙` (`女 + 少`): tinh tế, huyền diệu, kỳ ảo (gặp trong văn ngôn và thư tịch Đạo gia như `众玅之门`).                                       |
|   玆    |     zī     |     Tư      | `玄` + `玄`                 | [Tra bộ 玄] Dị thể cổ của chữ `兹 / 茲`: này, đây, lúc này, tươi tốt (gặp trong bia ký và văn bản cổ trước khi chuẩn hóa thành `兹`).                                    |

### Nhóm B: Chữ thông dụng mang `玄` làm thành phần thanh / ý (thuộc bộ khác)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                         |
| :-----: | :----: | :------: | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   弦    |  xián  |  Huyền   | `弓` + `玄`                                      | [Tra bộ 弓, chứa 玄] Hình thanh kiêm hội ý: sợi tơ căng trên cây cung (`弓`) → dây cung, dây đàn, cạnh huyền (弓弦 gōngxián: dây cung, 琴弦: dây đàn, 上弦月).         |
|   炫    |  xuàn  |  Huyễn   | `火` + `玄`                                      | [Tra bộ 火, chứa 玄] Hình thanh: `火` (ánh lửa) + `玄` (`xuán`, thanh phù) → chói mắt, khoe khoang, phô trương (炫耀 xuànyào: khoe khoang, 炫目: chói lòa).            |
|   眩    |  xuàn  |  Huyễn   | `目` + `玄`                                      | [Tra bộ 目, chứa 玄] Hình thanh: `目` (mắt) + `玄` (`xuán`, thanh phù) → hoa mắt, chóng mặt, choáng váng (头晕目眩 tóuyūn-mùxuàn: hoa mắt chóng mặt, 眩晕: chóng mặt). |
|   牵    |  qiān  |  Khiên   | Phồn `牽` (`玄 + 冖 + 牛`) / Giản `大 + 冖 + 牛` | [Tra bộ 牛, Phồn thể `牽` chứa 玄] Hội ý: sợi dây (`玄`) luồn dắt con trâu (`牛`) → kéo, dắt, liên lụy (牵手 qiānshǒu: nắm tay, 牵连: liên lụy).                       |
|   蓄    |   xù   |   Súc    | `艹` + `玄 + 田` (`畜`)                          | [Tra bộ 艹, chứa 玄 trong `畜`] Hình thanh kiêm hội ý: tích trữ cỏ lương thực → tích lũy, nuôi dưỡng, để dành (储蓄 chǔxù: gửi tiết kiệm, 蓄意: cố ý, 蓄水: trữ nước). |
|   悬    |  xuán  |  Huyền   | `县` + `心` (Phồn `懸`)                          | [Tra bộ 心, đồng âm với 玄] Phồn thể `懸` là `縣 + 心`, Giản thể lược `縣` thành `县`; nghĩa: treo lơ lửng, lo lắng, cách biệt (悬挂 xuánguà: treo, 悬念: hồi hộp).    |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components` — Đề xuất)

- `弦` (`xián` · Huyền · `弓 + 玄` — dây cung, dây đàn, cạnh huyền: `琴弦`, `弓弦`; xếp bộ `弓`).
- `炫` (`xuàn` · Huyễn · `火 + 玄` — chói lòa, khoe khoang: `炫耀`, `炫目`; xếp bộ `火`).
- `眩` (`xuàn` · Huyễn · `目 + 玄` — hoa mắt, chóng mặt: `眩晕`, `目眩`; xếp bộ `目`).
- `畜 / 蓄` (`chù / xù` · Súc · `玄 + 田` và `艹 + 畜` — gia súc và tích trữ: `牲畜`, `储蓄`; lần lượt xếp bộ `田` và `艸/艹`).
- `牵` (`qiān` · Khiên — kéo dắt: `牵手`, `牵扯`; xếp bộ `牛`).
- `悬 / 懸` (`xuán` · Huyền · `县 + 心` — treo, lơ lửng: `悬挂`, `悬崖`; xếp bộ `心`).
- `兹 / 茲` (`zī` · Tư — này, đây: `念兹在兹`; Phồn thể xếp bộ `艸/艹`, Giản thể `兹` xếp bộ `八/丷`, gồm cặp `幺` song song khác `玄`).
- `幺` (`yāo` · Yêu — bộ riêng `#52`, 3 nét — nhỏ bé; là phần dưới của chữ `玄`).
