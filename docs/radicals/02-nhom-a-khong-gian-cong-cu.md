# Nhóm A — Không Gian, Nhà Cửa, Công Cụ & Tài Chính (Bộ 14–22)

Tài liệu chi tiết cho **9 bộ thủ nhóm A (STT 14–22)** trong hệ thống 69 bộ thủ cốt lõi của HanziHome (`hanzihome_radicals`), tập trung vào nhóm trường nghĩa **không gian cư trú, công trình, cửa cổng, sợi dệt, vật liệu tre–kim khí, công cụ cắt gọt, tiền tệ–tài sản và phương tiện giao thông**.

> **Lưu ý đối chiếu dữ liệu (`hanzihome_radicals`):** Toàn bộ thông tin DB ID, `radical_index`, số nét, biến thể, ý nghĩa cốt lõi và ghi chú trùng/rỗng dưới đây đều khớp trực tiếp với snapshot `existing-69-radicals.json`. Riêng bộ **14. 宀** đã hợp nhất điểm bổ trợ từ dòng trùng `radical-048` vào dòng chính `radical-012`; bộ **16. 門** đã hợp nhất từ dòng trùng `radical-052` vào `radical-031` (và ghi chú dòng rỗng `radical-201`).

| STT | Bộ thủ | Hán Việt | DB ID chính   | `radical_index` | Số nét | Dòng trùng / rỗng cần xử lý                            | Số chữ phân tích (Mục 2) |
| :-: | :----: | -------- | ------------- | :-------------: | :----: | ------------------------------------------------------ | :----------------------: |
| 14  |   宀   | Miên     | `radical-012` |       12        |   3    | `radical-048` (#48, trùng đã điền dữ liệu)             |            20            |
| 15  |   广   | Nghiễm   | `radical-046` |       46        |   3    | —                                                      |            18            |
| 16  |   門   | Môn      | `radical-031` |       31        |   8    | `radical-052` (#52, trùng), `radical-201` (#201, rỗng) |            18            |
| 17  |   糸   | Mịch     | `radical-016` |       16        |   6    | —                                                      |            21            |
| 18  |   竹   | Trúc     | `radical-135` |       135       |   6    | —                                                      |            20            |
| 19  |   金   | Kim      | `radical-015` |       15        |   8    | `radical-199` (#199, rỗng)                             |            21            |
| 20  |   刀   | Đao      | `radical-034` |       34        |   2    | —                                                      |            20            |
| 21  |   貝   | Bối      | `radical-040` |       40        |   7    | `radical-186` (#186, rỗng)                             |            20            |
| 22  |   車   | Xa       | `radical-030` |       30        |   7    | `radical-191` (#191, rỗng)                             |            18            |

---

## Bộ 14: 宀 (Miên)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-012` (`radical_index`: `12`, `3` nét, `name_vi`: `bộ Miên`).
  - _Ghi chú dòng trùng:_ Trong DB hiện có dòng trùng `radical-048` (`radical_index`: `48`, `radical`: `宀`, `name_vi`: `bộ Miên`, `strokes`: `3`) đã điền đầy đủ dữ liệu. Bản chuẩn hóa dưới đây hợp nhất phần bổ sung từ `radical-048` (nhóm ví dụ cốt lõi `家, 安, 室, 容` và điểm phân biệt với `穴`) vào dòng chính `radical-012`.
- **Hình thái & Biến thể (`variants`):**
  - `宀` (dạng chính, 3 nét — luôn nằm **trên đầu** chữ, tiếng Trung gọi là _miên bảo cái / 宝盖头_, dùng chung cho cả Giản thể và Phồn thể).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **mái nhà / mái che phủ bên trên** có chóp nhọn ở giữa và hai mái rủ xuống che hai bên (Khang Hy bộ #40).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Nhà cửa, nơi ở, không gian bên trong nhà, sự che chở, an định/ổn định, cất giữ**. Từ hình ảnh mái nhà kín đáo che mưa nắng, nghĩa chuyển tự nhiên sang gia đình sống dưới mái nhà (`家`, `安`), phòng ốc và công trình (`室`, `宫`, `宅`), vật quý được bảo vệ cất giữ bên trong (`宝`, `富`, `实`, `容`), rồi mở rộng thành trạng thái yên ổn, chắc chắn và xem xét kỹ lưỡng bên trong (`定`, `守`, `完`, `察`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Gặp `宀` ở đỉnh chữ thường liên quan đến **nhà cửa, mái che, nơi ở, không gian bên trong, che chở, cất giữ, sự ổn định, hoặc người/vật ở bên trong**.
  - _Phân biệt dễ nhầm:_
    - **`宀` (Miên, 3 nét) vs `冖` (Mịch, 2 nét):** `宀` có **dấu chấm trên đỉnh**, giống mái nhà đầy đủ; `冖` **không có chấm**, nghĩa thiên về "nắp đậy / che phủ" (như `写` giản thể, `军`, `冠`, `冗`).
    - **`宀` (Miên) vs `穴` (Huyệt, 5 nét = `宀 + 八`):** `穴` mang `宀` phía trên nhưng có thêm `八` bên dưới, là **bộ riêng** nghĩa là "hang/hốc, khoảng trống" (như `空`, `穿`, `窗`, `究`, `穷`).
    - **`宀` (Miên) vs `广` (Nghiễm, 3 nét) & `厂` (Hán, 2 nét):** `宀` là mái nhà cân đối phủ kín cả hai bên; `广` có nét phẩy dài lệch sang trái như mái hiên tựa vách (`店`, `府`); `厂` không có dấu chấm trên đỉnh, gốc chỉ vách đá/xưởng thô (`厅`, `压`, `原`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Nhà cửa, phòng ốc & nơi cư trú

| Chữ Hán | Pinyin         | Hán Việt | Thiên bàng đứng chung                                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                         |
| ------- | -------------- | -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 家      | jiā            | gia      | `豕` (con lợn)                                       | **Hội ý:** Dưới mái nhà `宀` có nuôi lợn `豕` — biểu tượng của gia đình định cư có sinh kế thời cổ. Nghĩa: nhà, gia đình, chuyên gia. Từ ghép: `家庭` (jiātíng · gia đình), `回家` (huí jiā · về nhà), `专家` (zhuānjiā · chuyên gia). |
| 室      | shì            | thất     | `至` (đi đến)                                        | **Hội ý kiêm thanh phù:** Nơi từ ngoài đi vào `至` dưới mái nhà `宀` để nghỉ ngơi, sinh hoạt. Nghĩa: căn phòng, nội thất. Từ ghép: `教室` (jiàoshì · phòng học), `办公室` (bàngōngshì · văn phòng), `卧室` (wòshì · phòng ngủ).        |
| 宅      | zhái           | trạch    | `乇` (thanh phù _zhé/tuō_, gợi rễ bám chỗ)           | **Hình thanh kiêm nghĩa:** Ngôi nhà cắm rễ cố định để cư ngụ lâu dài. Nghĩa: nhà ở, dinh cơ; hiện đại dùng chỉ người thích ở nhà. Từ ghép: `住宅` (zhùzhái · nhà ở), `宅男` (zháinán · chàng trai thích ở nhà).                        |
| 宫 / 宮 | gōng           | cung     | `吕` (hai gian phòng nối nhau)                       | **Hội ý:** Dưới một mái nhà lớn `宀` có nhiều gian phòng thông nhau `吕`. Nghĩa: cung điện, cung văn hóa, tử cung. Từ ghép: `故宫` (Gùgōng · Cố Cung), `宫殿` (gōngdiàn · cung điện), `迷宫` (mígōng · mê cung).                       |
| 宿      | sù / xiǔ / xiù | túc / tú | `佰` (giản lược từ `亻` người + `百` chiếc chiếu cổ) | **Hội ý:** Người nằm nghỉ trên chiếu dưới mái nhà `宀`. Nghĩa: nghỉ qua đêm, ký túc (`sù`); lượng từ đêm (`xiǔ`); chòm sao (`xiù`). Từ ghép: `宿舍` (sùshè · ký túc xá), `住宿` (zhùsù · lưu trú), `一宿` (yì xiǔ · một đêm).          |
| 宇      | yǔ             | vũ       | `于` (thanh phù _yú_, gợi mở rộng ra)                | **Hình thanh kiêm nghĩa:** Phần mái hiên nhà vươn rộng ra bốn phía -> không gian, tòa nhà. Từ ghép: `宇宙` (yǔzhòu · vũ trụ), `楼宇` (lóuyǔ · tòa nhà).                                                                                |

### Nhóm B: Con người, sự yên ổn, che chở & vị thế trong nhà

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                  |
| ------- | ------ | -------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 安      | ān     | an       | `女` (người phụ nữ)                                       | **Hội ý:** Người phụ nữ ở yên dưới mái nhà `宀` tránh gió bão, hiểm nguy. Nghĩa: yên ổn, an toàn, lắp đặt, sắp xếp. Từ ghép: `安全` (ānquán · an toàn), `安排` (ānpái · sắp xếp), `安心` (ānxīn · yên tâm).                                     |
| 客      | kè     | khách    | `各` (đi đến, thanh phù _gè_ -> _kè_)                     | **Hình thanh kiêm nghĩa:** Người từ phương khác bước đến dưới mái nhà mình. Nghĩa: khách, khách hàng, du khách. Từ ghép: `客人` (kèrén · khách), `客户` (kèhù · khách hàng), `黑客` (hēikè · hacker).                                           |
| 守      | shǒu   | thủ      | `寸` (bàn tay / phép tắc)                                 | **Hội ý:** Bàn tay cầm giữ phép tắc trong ngôi nhà `宀`. Nghĩa: canh giữ, bảo vệ, tuân thủ. Từ ghép: `遵守` (zūnshǒu · tuân thủ), `保守` (bǎoshǒu · bảo thủ), `守护` (shǒuhù · bảo vệ).                                                         |
| 定      | dìng   | định     | `正` (biến thể chân đứng yên ngay ngắn)                   | **Hội ý kiêm thanh phù:** Dừng bước yên ổn dưới mái nhà `宀`. Nghĩa: ổn định, quyết định, đặt trước, nhất định. Từ ghép: `决定` (juédìng · quyết định), `肯定` (kěndìng · khẳng định), `稳定` (wěndìng · ổn định).                              |
| 官      | guān   | quan     | `㠯` (nhiều người/chúng dân xếp hàng)                     | **Hội ý:** Ngôi nhà/công sở `宀` nơi quản lý việc công và dân chúng. Nghĩa: quan chức, cơ quan, cơ quan giác quan. Từ ghép: `官方` (guānfāng · chính thức/chính hãng), `五官` (wǔguān · ngũ quan), `高官` (gāoguān · quan chức cấp cao).        |
| 宾 / 賓 | bīn    | tân      | Giản thể: `兵` (_bīng_, thanh phù); Phồn thể: `𠔁` + `貝` | **Hội ý (Phồn thể):** Khách quý dưới mái nhà `宀` được đón tiếp với lễ vật tiền bối `貝`. Giản thể thay phần dưới bằng thanh phù `兵`. Nghĩa: khách quý, tân khách. Từ ghép: `宾馆` (bīnguǎn · khách sạn), `嘉宾` (jiābīn · khách mời danh dự). |

### Nhóm C: Cất giữ, độ rộng, sự hoàn chỉnh & xem xét

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                                        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                               |
| ------- | ------ | -------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 宝 / 寶 | bǎo    | bảo      | Giản thể: `玉` (ngọc); Phồn thể: `玉` + `缶` + `貝`                          | **Hội ý:** Phồn thể vẽ trong nhà `宀` cất giữ ngọc `玉`, bình quý `缶` và tiền bối `貝`; Giản thể giữ gọn `宀 + 玉`. Nghĩa: báu vật, quý giá. Từ ghép: `宝贝` (bǎobèi · bảo bối/cục cưng), `宝石` (bǎoshí · đá quý), `淘宝` (Táobǎo · Taobao).                               |
| 富      | fù     | phú      | `畐` (hũ rượu đầy, thanh phù _fú_ -> _fù_)                                   | **Hình thanh kiêm hội ý:** Trong nhà `宀` có vò rượu/kho lương đầy ắp `畐`. Nghĩa: giàu có, phong phú. Từ ghép: `丰富` (fēngfù · phong phú), `富裕` (fùyù · giàu có), `财富` (cáifù · tài sản).                                                                              |
| 容      | róng   | dung     | `谷` (thung lũng rộng)                                                       | **Hội ý:** Không gian trong nhà `宀` rộng sâu như thung lũng `谷`. Nghĩa: chứa đựng, dung nạp, dễ dàng, dung mạo. Từ ghép: `容易` (róngyì · dễ dàng), `内容` (nèiróng · nội dung), `容量` (róngliàng · dung lượng).                                                          |
| 宽 / 寬 | kuān   | khoan    | Giản thể: `苋` (lược tự); Phồn thể: `萈` (dê rừng sừng to, thanh phù _huán_) | **Hình thanh:** Phồn thể dùng thanh phù `萈` (_huán_) chỉ ngôi nhà rộng rãi; Giản thể tỉnh lược `萈` thành nét giống `苋`. Nghĩa: rộng lớn, khoan dung, nới lỏng. Từ ghép: `宽带` (kuāndài · băng thông rộng), `宽容` (kuānróng · khoan dung), `放宽` (fàngkuān · nới lỏng). |
| 实 / 實 | shí    | thật     | Giản thể: `头` (lược tự); Phồn thể: `毌` + `貝` (xâu tiền bối)               | **Hội ý:** Phồn thể vẽ trong nhà `宀` đầy ắp chuỗi tiền bối `毌 + 貝`; Giản thể rút gọn phần dưới thành `头`. Nghĩa: đầy đặn, thực tế, chân thật, quả thực. Từ ghép: `其实` (qíshí · kỳ thực), `实现` (shíxiàn · thực hiện), `真实` (zhēnshí · chân thật).                   |
| 完      | wán    | hoàn     | `元` (thanh phù _yuán_ -> _wán_)                                             | **Hình thanh kiêm nghĩa:** Hoàn thiện mái nhà đến mức vẹn toàn. Nghĩa: đầy đủ, xong, hoàn thành. Từ ghép: `完成` (wánchéng · hoàn thành), `完全` (wánquán · hoàn toàn), `完美` (wánměi · hoàn mỹ).                                                                           |
| 察      | chá    | sát      | `祭` (tế lễ, thanh phù _jì_ + ý cẩn trọng)                                   | **Hình thanh kiêm hội ý:** Xem xét kỹ lưỡng việc tế lễ trong tông miếu `宀`. Nghĩa: quan sát, tra xét, điều tra. Từ ghép: `观察` (guānchá · quan sát), `警察` (jǐngchá · cảnh sát), `考察` (kǎochá · khảo sát).                                                              |
| 密      | mì     | mật      | `必` (thanh phù _bì_ -> _mì_, ý kín) + `山` (núi sâu)                        | **Hình thanh kiêm hội ý:** Ngôi nhà `宀` kín đáo ở chốn núi sâu `山`. Nghĩa: bí mật, kín, dày đặc, mật khẩu. Từ ghép: `秘密` (mìmì · bí mật), `密码` (mìmǎ · mật khẩu), `紧密` (jǐnmì · chặt chẽ).                                                                           |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-012` & `radical-048`):** `家`, `安`, `室`, `容` (các chữ tiêu biểu của bộ `宀` được liệt kê tham chiếu ở `radical-048`), cùng `冖`, `穴`, `广` (ba bộ thủ riêng dễ nhầm).
- **Chữ chứa `宀` (hoặc biến dạng ở Giản thể) nhưng xếp ở bộ khác:**
  - `字` (_zì_ · tự): Gồm `宀 + 子` (nuôi dạy con trong nhà -> sinh sôi, chữ viết), Khang Hy xếp vào **bộ `子`** (#39).
  - `空` (_kōng/kòng_ · không), `穿` (_chuān_ · xuyên/mặc), `窗` (_chuāng_ · cửa sổ), `究` (_jiū_ · nghiên cứu), `穷 / 窮` (_qióng_ · nghèo): Đều mang `宀` ở đỉnh nhưng thực chất thuộc **bộ `穴`** (`宀 + 八`, hang hốc/khoảng rỗng).
  - `写 / 寫` (_xiě_ · tả · viết): Phồn thể `寫` thuộc **bộ `宀`**, nhưng Giản thể `写` bỏ dấu chấm trên đầu nên chuyển sang **bộ `冖`**.
  - `牢` (_láo_ · lao · chuồng trâu, nhà tù, vững chắc): Gồm `宀 + 牛` (chuồng nhốt trâu bò), Khang Hy xếp **bộ `牛`** (#93).
  - `冖` (_mì_ · bộ Mịch): Bộ riêng chỉ nắp đậy/che phủ (`军`, `冠`, `冤`), không có dấu chấm trên đầu.

---

## Bộ 15: 广 (Nghiễm)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-046` (`radical_index`: `46`, `3` nét, `name_vi`: `bộ Nghiễm`). Không có dòng trùng hay dòng rỗng.
- **Hình thái & Biến thể (`variants`):**
  - `广` (dạng chính, 3 nét — đứng độc lập làm chữ `广` hoặc bao góc **trên-trái** của chữ, tiếng Trung gọi là _nghiễm tự bàng / 广字旁_).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **mái nhà dựa vào vách / nhà có mái che một bên** (Khang Hy bộ #53, gồm chấm trên nóc, thanh ngang và nét phẩy dài như mái hiên tựa sườn núi).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Nhà cửa, công trình, không gian có mái che, nơi chốn**; mở rộng sang **cơ quan/nơi làm việc** (`府`, `庭`, `库`) hoặc **sự rộng lớn** (`广` là dạng giản thể của `廣` = rộng rãi, phổ biến).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Có `广` thường liên quan đến **nhà/công trình có mái, nơi chốn, không gian trú ngụ, cơ sở hoặc kích thước/mức độ không gian**.
  - _Phân biệt dễ nhầm:_
    - **`广` (Nghiễm, 3 nét) vs `厂` (Hán, 2 nét):** `广` có **dấu chấm trên đỉnh** và nét phẩy dài như mái nhà; `厂` **không có dấu chấm**, gốc là vách đá/sườn núi hoặc nhà xưởng đơn giản (`厅`, `历`, `压`, `原`, `厚`).
    - **`广` (Nghiễm) vs `宀` (Miên, 3 nét):** `宀` là mái nhà cân đối phủ kín phía trên (`家`, `室`), khác với `广` mở lệch về một bên trái.
    - **`广` (Nghiễm, 3 nét) vs `疒` (Nạch, 5 nét):** `疒` giống `广` nhưng có thêm 2 nét chấm-hất `冫` ở mép trái, chuyên chỉ bệnh tật (`病`, `痛`, `瘦`, `疲`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Công trình, cơ sở dịch vụ & phòng chức năng

| Chữ Hán | Pinyin    | Hán Việt | Thiên bàng đứng chung                                                        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                   |
| ------- | --------- | -------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 店      | diàn      | điếm     | `占` (chiếm chỗ, thanh phù _zhàn_ -> _diàn_)                                 | **Hình thanh kiêm nghĩa:** Ngôi nhà có mái che `广` chiếm một chỗ bày hàng hóa bán. Nghĩa: cửa hàng, tiệm, khách sạn. Từ ghép: `商店` (shāngdiàn · cửa hàng), `酒店` (jiǔdiàn · khách sạn), `网店` (wǎngdiàn · cửa hàng online). |
| 库 / 庫 | kù        | khố      | `车 / 車` (xe cộ)                                                            | **Hội ý:** Ngôi nhà có mái che `广` dùng để cất giữ xe cộ, binh khí. Nghĩa: nhà kho, kho lưu trữ, kho dữ liệu. Từ ghép: `仓库` (cāngkù · nhà kho), `数据库` (shùjùkù · cơ sở dữ liệu), `车库` (chēkù · nhà để xe).               |
| 厨 / 廚 | chú       | trù      | `尌` (`豆` + `寸`, bày biện đồ ăn, thanh phù _shù_ -> _chú_)                 | **Hình thanh kiêm hội ý:** Gian nhà `广` dùng để chế biến, bày biện thức ăn. Nghĩa: nhà bếp. Từ ghép: `厨房` (chúfáng · nhà bếp), `厨师` (chúshī · đầu bếp).                                                                     |
| 厕 / 廁 | cè        | xí       | `则 / 則` (thanh phù _zé_ -> _cè_, ý mé bên cạnh)                            | **Hình thanh kiêm nghĩa:** Công trình phụ dựng ở mé bên cạnh `广` của ngôi nhà chính. Nghĩa: nhà vệ sinh. Từ ghép: `厕所` (cèsuǒ · nhà vệ sinh), `公厕` (gōngcè · nhà vệ sinh công cộng).                                        |
| 厦 / 廈 | shà / xià | hạ       | `夏` (thanh phù _xià_ -> _shà_)                                              | **Hình thanh kiêm nghĩa:** Tòa nhà lớn có mái hiên rộng. Nghĩa: tòa nhà cao lớn (`shà`); dùng trong địa danh Hạ Môn (`xià`). Từ ghép: `大厦` (dàshà · tòa cao ốc), `厦门` (Xiàmén · Hạ Môn).                                     |
| 庙 / 廟 | miào      | miếu     | Giản thể: `由` (_yóu_, thanh phù thay thế); Phồn thể: `朝` (_cháo_, chầu lễ) | **Hình thanh kiêm nghĩa:** Phồn thể vẽ công trình `广` nơi cử hành nghi lễ triều bái `朝` tổ tiên; Giản thể mượn `由` viết gọn. Nghĩa: đền, miếu. Từ ghép: `寺庙` (sìmiào · chùa miếu), `庙会` (miàohuì · hội đền).              |

### Nhóm B: Kiến trúc nội khu, cơ quan & tiện nghi

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                         |
| ------- | ------ | -------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 床      | chuáng | sàng     | `木` (gỗ)                               | **Hội ý:** Tấm gỗ `木` đặt bên trong nhà `广` để nằm nghỉ hoặc kê đồ. Nghĩa: cái giường, bệ máy, lòng sông. Từ ghép: `床单` (chuángdān · ga giường), `起床` (qǐchuáng · thức dậy), `机床` (jīchuáng · máy công cụ).                    |
| 庭      | tíng   | đình     | `廷` (triều đình, thanh phù _tíng_)     | **Hình thanh kiêm nghĩa:** Khoảng sân rộng/gian chính trước mái nhà `广`. Nghĩa: sân, đình, gia đình, tòa án. Từ ghép: `家庭` (jiātíng · gia đình), `法庭` (fǎtíng · tòa án), `庭院` (tíngyuàn · sân vườn).                            |
| 府      | fǔ     | phủ      | `付` (giao phó, thanh phù _fù_ -> _fǔ_) | **Hình thanh kiêm nghĩa:** Công trình `广` nơi cất giữ văn thư, tài sản giao phó. Nghĩa: phủ, dinh thự, cơ quan chính quyền. Từ ghép: `政府` (zhèngfǔ · chính phủ), `首府` (shǒufǔ · thủ phủ).                                         |
| 廊      | láng   | lang     | `郎` (thanh phù _láng_)                 | **Hình thanh kiêm nghĩa:** Phần mái hiên dài nối dọc các gian nhà `广`. Nghĩa: hành lang, phòng trưng bày. Từ ghép: `走廊` (zǒuláng · hành lang), `画廊` (huàláng · phòng triển lãm tranh).                                            |
| 座      | zuò    | tọa      | `坐` (ngồi, thanh phù _zuò_)            | **Hội ý kiêm thanh phù:** Chỗ ngồi `坐` được bố trí dưới mái nhà `广`. Nghĩa: chỗ ngồi, bệ đỡ, lượng từ cho công trình/núi lớn. Từ ghép: `座位` (zuòwèi · chỗ ngồi), `星座` (xīngzuò · chòm sao), `一座楼` (yí zuò lóu · một tòa nhà). |
| 底      | dǐ     | để       | `氐` (thấp/gốc, thanh phù _dī_ -> _dǐ_) | **Hình thanh kiêm nghĩa:** Phần nền thấp nhất dưới chân công trình/đồ vật. Nghĩa: đáy, nền, cuối cùng. Từ ghép: `到底` (dàodǐ · rốt cuộc), `海底` (hǎidǐ · đáy biển), `年底` (niándǐ · cuối năm).                                      |

### Nhóm C: Quy mô không gian, chuẩn mực & trạng thái mở rộng

| Chữ Hán | Pinyin   | Hán Việt | Thiên bàng đứng chung                         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                   |
| ------- | -------- | -------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 广 / 廣 | guǎng    | quảng    | Phồn thể: `黃` (thanh phù _huáng_ -> _guǎng_) | **Hình thanh kiêm nghĩa:** Ngôi nhà lớn mênh mông; Giản thể lược bỏ phần `黃`, dùng luôn bộ `广` làm chữ độc lập. Nghĩa: rộng lớn, phổ biến, quảng bá. Từ ghép: `广告` (guǎnggào · quảng cáo), `广场` (guǎngchǎng · quảng trường), `推广` (tuīguǎng · quảng bá). |
| 度      | dù / duó | độ / đạc | `廿` biến dạng + `又` (tay đo)                | **Hội ý:** Dùng tay dang đo kích thước không gian dưới mái nhà `广`. Nghĩa: mức độ, đơn vị đo, chế độ, trải qua (`dù`); suy đoán (`duó`). Từ ghép: `态度` (tàidù · thái độ), `温度` (wēndù · nhiệt độ), `制度` (zhìdù · chế độ).                                 |
| 序      | xù       | tự       | `予` (trao/đặt, thanh phù _yǔ_ -> _xù_)       | **Hình thanh kiêm nghĩa:** Bức tường/hành lang đông-tây phân định thứ bậc chỗ ngồi trong nhà cổ. Nghĩa: thứ tự, trình tự, lời tựa. Từ ghép: `顺序` (shùnxù · thứ tự), `程序` (chéngxù · chương trình/phần mềm), `秩序` (zhìxù · trật tự).                        |
| 康      | kāng     | khang    | `隶` (nắm giữ/đập lúa sạch)                   | **Hình thanh/hội ý:** Ngôi nhà yên vui, thóc gạo no đủ (cũng mượn âm cổ). Nghĩa: khỏe mạnh, yên vui, khá giả. Từ ghép: `健康` (jiànkāng · sức khỏe), `小康` (xiǎokāng · khá giả/tiểu khang).                                                                     |
| 廉      | lián     | liêm     | `兼` (thanh phù _jiān_ -> _lián_)             | **Hình thanh kiêm nghĩa:** Góc cạnh ngay ngắn, thẳng thắn của gian nhà `广`. Nghĩa: liêm khiết, ngay thẳng, giá rẻ. Từ ghép: `廉价` (liánjià · giá rẻ), `清廉` (qīnglián · thanh liêm).                                                                          |
| 废 / 廢 | fèi      | phế      | `发 / 發` (thanh phù _fā_ -> _fèi_)           | **Hình thanh kiêm nghĩa:** Ngôi nhà sụp đổ bỏ hoang. Nghĩa: bỏ đi, phế thải, lãng phí. Từ ghép: `浪费` (làngfèi · lãng phí), `废话` (fèihuà · lời vô ích), `作废` (zuòfèi · hết hiệu lực).                                                                       |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-046`):** `床`, `店`, `府`, `庭` (bốn chữ tiêu biểu thuộc `广`), cùng `宀`, `厂` (hai bộ riêng dễ nhầm).
- **Chữ có dáng `广` (nhất là ở Giản thể) nhưng Khang Hy xếp ở bộ khác hoặc cần phân biệt:**
  - `厅 / 廳` (_tīng_ · sảnh · phòng lớn: `客厅`, `餐厅`): Phồn thể `廳` thuộc **bộ `广`**, nhưng Giản thể `厅` bỏ dấu chấm trên đỉnh nên chuyển sang **bộ `厂`** (#27).
  - `庄 / 莊` (_zhuāng_ · trang · thôn trang, nghiêm trang): Phồn thể `莊` thuộc **bộ `艹`** (#140); Giản thể `庄` rút gọn thành `广 + 土` nên tra theo `广`.
  - `应 / 應` (_yīng/yìng_ · ứng · nên, đáp ứng: `应该`, `应用`) & `庆 / 慶` (_qìng_ · khánh · chúc mừng: `庆祝`): Phồn thể đều mang **bộ `心`** (#61) ở dưới; Giản thể lược `心` còn `应`, `庆` nên tự điển giản thể thường tra theo `广`.
  - `席` (_xí_ · tịch · chiếc chiếu, chỗ ngồi, tiệc: `主席`, `出席`): Có mái `广` nhưng phía dưới là `巾` (khăn/vải), Khang Hy xếp **bộ `巾`** (#50).
  - `唐` (_táng_ · đường · nhà Đường, đường đột): Có khung `广` nhưng xếp **bộ `口`** (#30).
  - `厂` (bộ Hán — `历`, `压`, `原`, `厚`) và `疒` (bộ Nạch — `病`, `痛`, `瘦`): Hai bộ riêng dễ nhầm nhất về mặt chữ viết với `广`.

---

## Bộ 16: 門 (Môn)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-031` (`radical_index`: `31`, `8` nét, `name_vi`: `bộ Môn`).
  - _Ghi chú dòng trùng & rỗng:_ DB hiện có 1 dòng trùng đã điền dữ liệu là `radical-052` (`radical_index`: `52`, `radical`: `門`, `name_vi`: `bộ Môn`, `strokes`: `8`) và 1 dòng rỗng là `radical-201` (`radical_index`: `201`, `radical`: `門 / 门`, `name_vi`: `null`, `strokes`: `null`). Bản này đã hợp nhất đầy đủ phần bổ trợ từ `radical-052` (thêm chữ `开 / 開`, giải nghĩa cấu tạo chữ `间 / 間`, nghĩa "ngành học/hạng mục") vào dòng chính `radical-031`.
- **Hình thái & Biến thể (`variants`):**
  - `門` (dạng phồn thể / đầy đủ, 8 nét — bao khung **trên-trái-phải**).
  - `门` (dạng giản thể, 3 nét — gọi là _môn tự khuông / 门字框_, bao khung **trên-trái-phải**, hoặc đứng trái làm thanh phù trong vài chữ như `们`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cửa hai cánh / cổng lớn** đối xứng nhau có bản lề trên dưới (Khang Hy bộ #169).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Cửa, cổng, thao tác đóng/mở, ra vào, khoảng không gian ngăn cách**; mở rộng sang **môn phái, ngành học, hạng mục, bộ phận** (`部门`, `入门`, `专门`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Có `門 / 门` thường liên quan đến **cửa/cổng, đóng mở, ra vào, không gian bên trong/giữa hoặc bên ngoài, hoặc ngành/môn/phái**.
  - _Phân biệt dễ nhầm:_
    - **`门` (Môn, 3 nét giản thể) vs `斗 / 鬥` (Đấu, 10 nét phồn thể):** Phồn thể phân biệt rạch ròi `門` (cửa hai cánh) và `鬥` (hai người đánh nhau giằng co). Giản thể gộp hình thái khiến `鬧` (gốc `鬥`) biến thành `闹` mang khung `门`, dễ bị nhầm là bộ Môn.
    - **`门 / 門` vs `户 / 戶` (bộ Hộ, 4 nét):** `門` là cửa lớn hai cánh; `戶/户` là cửa một cánh / hộ gia đình, là **bộ riêng** (`房`, `所`, `扇`).
    - **`门 / 門` vs `囗` (bộ Vi, 3 nét):** `门` có lối mở ở cạnh dưới; `囗` là khung đóng kín bốn phía (`国`, `园`, `回`), không phải cửa.
    - **Chữ giản thể bị mất khung `門`:** Khi học giản thể cần nhớ `开` (mở) và `关` (đóng) có Phồn thể là `開` và `關` đều thuộc bộ `門`. Ngược lại, `问`, `闻`, `闷` dùng khung `门` nhưng Khang Hy xếp lần lượt ở bộ `口`, `耳`, `心` (xem Mục 3).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Cửa cổng & thao tác đóng mở, ra vào

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                              |
| ------- | ------ | -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 门 / 門 | mén    | môn      | — (chữ độc lập)                                  | **Tượng hình:** Hai cánh cửa đối xứng mở ra vào. Nghĩa: cửa, cổng, phòng ban, môn học, lượng từ. Từ ghép: `门口` (ménkǒu · cửa ra vào), `部门` (bùmén · phòng ban), `入门` (rùmén · nhập môn).                                              |
| 开 / 開 | kāi    | khai     | Phồn thể: `开` (hai tay `廾` nhấc then cài `一`) | **Hội ý:** Phồn thể vẽ hai tay tháo then mở hai cánh cửa `門`. Giản thể bỏ khung `門` chỉ giữ `开`. Nghĩa: mở, bắt đầu, lái xe, bật máy. Từ ghép: `开始` (kāishǐ · bắt đầu), `打开` (dǎkāi · mở ra), `开发` (kāifā · phát triển/lập trình). |
| 关 / 關 | guān   | quan     | Phồn thể: `𢇅` (then cài xuyên chốt cửa)         | **Hội ý:** Phồn thể vẽ luồn chốt ngang khóa chặt cánh cửa `門`. Giản thể rút gọn thành `关`. Nghĩa: đóng, tắt máy, liên quan, cửa ải. Từ ghép: `关闭` (guānbì · đóng/tắt), `关系` (guānxì · quan hệ), `关键` (guānjiàn · then chốt).        |
| 闭 / 閉 | bì     | bế       | `才` (biến thể hình chốt gỗ chặn cửa)            | **Hội ý:** Cài thanh gỗ `才` chắn ngang cửa `门/門`. Nghĩa: đóng lại, khép kín, tắt. Từ ghép: `关闭` (guānbì · đóng), `闭嘴` (bìzuǐ · ngậm miệng), `封闭` (fēngbì · khép kín/phong tỏa).                                                    |
| 闯 / 闖 | chuǎng | sấm      | `马 / 馬` (con ngựa)                             | **Hội ý:** Con ngựa phi thẳng qua cổng cửa `门/門`. Nghĩa: xông pha, lao vào, lập nghiệp. Từ ghép: `闯关` (chuǎngguān · vượt ải), `闯红灯` (chuǎng hóngdēng · vượt đèn đỏ).                                                                 |
| 闪 / 閃 | shǎn   | thiểm    | `人` (người)                                     | **Hội ý:** Người thoáng lướt qua khe cửa `门/門`. Nghĩa: lóe sáng, né tránh, bộ nhớ flash/sập ứng dụng. Từ ghép: `闪电` (shǎndiàn · tia chớp), `闪退` (shǎntuì · văng app/crash), `躲闪` (duǒshǎn · né tránh).                              |

### Nhóm B: Không gian, kiến trúc & khoảng ngăn cách

| Chữ Hán | Pinyin      | Hán Việt    | Thiên bàng đứng chung                          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                    |
| ------- | ----------- | ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 间 / 間 | jiān / jiàn | gian / gián | `日` (mặt trời; cổ văn dùng `月` mặt trăng)    | **Hội ý:** Ánh sáng mặt trời/trăng `日/月` lọt qua khe cửa `門` -> khe hở, khoảng giữa, gian phòng, thời gian (`jiān`); ngăn cách (`jiàn`). Từ ghép: `时间` (shíjiān · thời gian), `房间` (fángjiān · căn phòng), `空间` (kōngjiān · không gian). |
| 阁 / 閣 | gé          | các         | `各` (thanh phù _gè_ -> _gé_)                  | **Hình thanh kiêm nghĩa:** Công trình lầu gác có cửa cao dựng thanh đỡ. Nghĩa: lầu, gác, nội các. Từ ghép: `阁楼` (gélóu · gác mái), `内阁` (nèigé · nội các).                                                                                    |
| 闺 / 閨 | guī         | khuê        | `圭` (ngọc khuê/cửa vòm nhọn, thanh phù _guī_) | **Hình thanh kiêm nghĩa:** Cửa nhỏ hình vòm bên trong hậu cung -> phòng riêng phụ nữ. Từ ghép: `闺蜜` (guīmì · bạn thân nữ), `闺房` (guīfáng · khuê phòng).                                                                                       |
| 阔 / 闊 | kuò         | khoát       | `活` (thanh phù _huó_ -> _kuò_)                | **Hình thanh kiêm nghĩa:** Cánh cửa rộng thoáng mở ra không gian lớn. Nghĩa: rộng lớn, khoáng đạt, giàu có. Từ ghép: `宽阔` (kuānkuò · rộng lớn), `辽阔` (liáokuò · bao la).                                                                      |
| 阈 / 閾 | yù          | vực         | `或` (thanh phù _huò_ -> _yù_)                 | **Hình thanh kiêm nghĩa:** Bậu cửa gỗ ngăn ranh giới trong ngoài. Nghĩa: ngưỡng cửa, giá trị ngưỡng (kỹ thuật/tâm lý). Từ ghép: `阈值` (yùzhí · giá trị ngưỡng/threshold).                                                                        |
| 闸 / 閘 | zhá         | áp / trát   | `甲` (thanh phù _jiǎ_ -> _zhá_)                | **Hình thanh kiêm nghĩa:** Cánh cửa chắn nước đóng mở lên xuống. Nghĩa: cửa cống, cầu dao điện, phanh xe. Từ ghép: `水闸` (shuǐzhá · cống xả nước), `拉闸` (lāzhá · ngắt cầu dao).                                                                |

### Nhóm C: Trạng thái, đọc duyệt, trình bày & quy ước

| Chữ Hán     | Pinyin | Hán Việt | Thiên bàng đứng chung                                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                            |
| ----------- | ------ | -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 闲 / 閑・閒 | xián   | nhàn     | `木` (cây gỗ; dị thể Phồn dùng `月`)                  | **Hội ý:** Đặt thanh gỗ `木` cài cửa không cho khách vào quấy rầy (hoặc nhàn nhã ngắm trăng qua cửa). Nghĩa: nhàn rỗi, bỏ trống. Từ ghép: `空闲` (kòngxián · rảnh rỗi), `休闲` (xiūxián · giải trí/thư giãn).             |
| 阅 / 閱     | yuè    | duyệt    | `兑` (thanh phù _duì_ -> _yuè_)                       | **Hình thanh kiêm nghĩa:** Đứng ở cổng `門` kiểm đếm số lượng người/vật đi qua. Nghĩa: xem xét, kiểm duyệt, đọc sách. Từ ghép: `阅读` (yuèdú · đọc), `订阅` (dìngyuè · đăng ký/subscribe), `审阅` (shěnyuè · thẩm duyệt). |
| 阐 / 闡     | chǎn   | xiển     | `单 / 單` (thanh phù _dān/chán_ -> _chǎn_, ý mở rộng) | **Hình thanh kiêm nghĩa:** Mở rộng cánh cửa cho ánh sáng chiếu vào. Nghĩa: giảng giải sáng tỏ, trình bày rõ. Từ ghép: `阐述` (chǎnshù · trình bày rõ), `阐明` (chǎnmíng · làm sáng tỏ).                                   |
| 阀 / 閥     | fá     | phiệt    | `伐` (công lao, thanh phù _fá_)                       | **Hình thanh kiêm nghĩa:** Cổng lớn nhà quyền quý ghi công trạng bên trái/phải -> thế lực quyền quý; hiện đại chỉ van điều tiết đóng mở dòng chảy. Từ ghép: `阀门` (fámén · cái van), `财阀` (cáifá · tài phiệt).         |
| 阂 / 閡     | hé     | ngại     | `亥` (thanh phù _hài_ -> _hé_)                        | **Hình thanh kiêm nghĩa:** Cửa ngoài đóng chặt ngăn cách giao lưu. Nghĩa: ngăn cách, trở ngại. Từ ghép: `隔阂` (géhé · sự ngăn cách/hiểu lầm).                                                                            |
| 闰 / 閏     | rùn    | nhuận    | `王` (nhà vua)                                        | **Hội ý:** Nghi lễ cổ vua `王` đứng trong cổng tông miếu `門` vào tháng dư âm lịch. Nghĩa: năm nhuận, tháng nhuận. Từ ghép: `闰年` (rùnnián · năm nhuận), `闰月` (rùnyuè · tháng nhuận).                                  |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-031` & `radical-052`):** `问 / 問`, `间 / 間`, `闻 / 聞`, `开 / 開`, `户`, `囗`.
- **Chữ dùng khung `门 / 門` nhưng Khang Hy xếp ở bộ khác (rất dễ nhầm khi tra tự điển):**
  - `问 / 問` (_wèn_ · vấn · hỏi: `问题`): Gồm `门/門 + 口` (đến cửa mở miệng hỏi), Khang Hy xếp **bộ `口`** (#30); tự điển giản thể thường tra theo `门`.
  - `闻 / 聞` (_wén_ · văn · nghe, ngửi, tin tức: `新闻`): Gồm `门/門 + 耳` (ghé tai vào cửa nghe ngóng), Khang Hy xếp **bộ `耳`** (#128).
  - `闷 / 悶` (_mèn/mēn_ · muộn · buồn bực, ngột ngạt: `郁闷`, `闷热`): Gồm `门/門 + 心` (tấm lòng bị nhốt kín sau cánh cửa), Khang Hy xếp **bộ `心`** (#61).
  - `闹 / 鬧` (_nào_ · náo · ồn ào, náo nhiệt: `热闹`): Phồn thể viết `鬥 + 市` (đánh nhau ầm ĩ ngoài chợ), thuộc **bộ `鬥`** (#191); Giản thể mượn khung `门` viết thành `闹`.
  - `们 / 們` (_men_ · môn · các, chúng: `我们`): Thuộc **bộ `亻` (`人`)**; ở đây `门/門` chỉ là **thanh phù** mượn âm.
  - `润 / 潤` (_rùn_ · nhuận · ẩm ướt, lợi nhuận: `利润`, `滋润`): Gồm `氵 + 闰`, xếp **bộ `氵` (`水`)**.
  - `户 / 戶` (bộ Hộ — cửa một cánh) và `囗` (bộ Vi — khung bao kín bốn phía): Hai bộ thủ độc lập.

---

## Bộ 17: 糸 (Mịch)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-016` (`radical_index`: `16`, `6` nét, `name_vi`: `bộ Mịch`). Không có dòng trùng hay dòng rỗng.
- **Hình thái & Biến thể (`variants`):**
  - `糸` (dạng đầy đủ, 6 nét — thường nằm **bên dưới** chữ như `系`, `紧`, `素`, `紫`, `繁`).
  - `糹` (mịch đứng phồn thể, 6 nét — nằm **bên trái** chữ).
  - `纟` (mịch đứng giản thể, 3 nét — gọi là _giảo ti bàng / 绞丝旁_, luôn nằm **bên trái** chữ).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **bó sợi tơ, sợi chỉ mảnh** xoắn lại có đầu mối và nút buộc phía dưới (Khang Hy bộ #120).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Sợi, chỉ, dây, dệt may, vải vóc, màu sắc nhuộm lụa**; mở rộng trừu tượng sang **sự kết nối, ràng buộc, quan hệ, thứ bậc và hệ thống** (`结`, `组`, `级`, `统`, `经`, `维`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Có `糸 / 糹 / 纟` thường liên quan đến **sợi, dây, buộc, dệt may, màu sắc vải, hoặc liên kết/cấp bậc/hệ thống**.
  - _Phân biệt dễ nhầm:_
    - **`纟` (3 nét) vs `乡` (3 nét):** `纟` là biến thể giản thể bên trái luôn có nét hất ngang cuối (`线`, `红`, `纸`, `练`); `乡` (giản thể của `鄉` = quê hương) là chữ độc lập, nét cuối là phẩy dài cong chứ không phải nét hất.
    - **`糸` (6 nét) vs `幺` (bộ Yêu, 3 nét):** `糸` có phần `小` ở dưới; `幺` không có `小`, là **bộ riêng** nghĩa là sợi tơ rất nhỏ/non (`幼`, `幻`, `幽`), không gộp vào `糸`.
    - **`糸` vs `系` & `丝 / 絲`:** `系` (_xì/jì_) có thêm nét phẩy `丿` ở đỉnh (`关系`, `系统`); `丝 / 絲` là hai bó tơ đứng cạnh nhau.
    - **Nghĩa mở rộng không còn thấy "sợi":** Nhiều chữ rất thông dụng mang `纟` không còn nghĩa dây/vải trực tiếp mà đã chuyển sang nghĩa trừu tượng như **cấp bậc (`级`), nhóm (`组`), kết quả (`结`), hệ thống (`统`)**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Sợi, dệt may, giấy vải & màu sắc nhuộm

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                                           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                        |
| ------- | ------ | -------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 线 / 線 | xiàn   | tuyến    | Giản thể: `戋` (thanh phù _jiān_ -> _xiàn_); Phồn thể: `泉` (thanh phù)         | **Hình thanh kiêm nghĩa:** Sợi chỉ dài -> sợi dây, đường thẳng, dây cáp, trực tuyến. Từ ghép: `电线` (diànxiàn · dây điện), `在线` (zàixiàn · trực tuyến/online), `路线` (lùxiàn · lộ trình).         |
| 纸 / 紙 | zhǐ    | chỉ      | `氏` (thanh phù _shì_ -> _zhǐ_)                                                 | **Hình thanh kiêm nghĩa:** Thời cổ giấy làm từ xơ tơ/vỏ cây ngâm giã nhuyễn. Nghĩa: tờ giấy. Từ ghép: `白纸` (báizhǐ · giấy trắng), `报纸` (bàozhǐ · báo giấy), `壁纸` (bìzhǐ · hình nền/wallpaper).  |
| 织 / 織 | zhī    | chức     | Giản thể: `只` (_zhǐ_, thanh phù); Phồn thể: `戠` (_zhí_, thanh phù)            | **Hình thanh kiêm nghĩa:** Đan xen sợi tơ dọc ngang thành tấm vải. Nghĩa: dệt, đan, tổ chức. Từ ghép: `纺织` (fǎngzhī · dệt may), `组织` (zǔzhī · tổ chức), `编织` (biānzhī · đan lát).               |
| 练 / 練 | liàn   | luyện    | Giản thể: `东` (lược tự); Phồn thể: `柬` (chọn lọc, thanh phù _jiǎn_ -> _liàn_) | **Hình thanh kiêm nghĩa:** Nấu tẩy lọc sạch tơ sống cho trắng mềm -> rèn luyện thuần thục. Từ ghép: `练习` (liànxí · luyện tập), `训练` (xùnliàn · huấn luyện), `熟练` (shúliàn · thành thạo).        |
| 红 / 紅 | hóng   | hồng     | `工` (thanh phù _gōng_ -> _hóng_)                                               | **Hình thanh kiêm nghĩa:** Sợi tơ nhuộm màu đỏ nhạt/đỏ. Nghĩa: màu đỏ, may mắn, nổi tiếng. Từ ghép: `红色` (hóngsè · màu đỏ), `网红` (wǎnghóng · người nổi tiếng mạng), `红包` (hóngbāo · bao lì xì). |
| 绿 / 綠 | lǜ     | lục      | `录 / 彔` (thanh phù _lù_ -> _lǜ_)                                              | **Hình thanh kiêm nghĩa:** Vải lụa nhuộm màu xanh lá cây. Nghĩa: màu xanh lục. Từ ghép: `绿色` (lǜsè · màu xanh lá), `绿茶` (lǜchá · trà xanh).                                                       |
| 紫      | zǐ     | tử       | `此` (thanh phù _cǐ_ -> _zǐ_, ở trên `糸`)                                      | **Hình thanh kiêm nghĩa:** Lụa nhuộm màu tím sẫm (sắc tím hoàng gia cổ). Nghĩa: màu tím. Từ ghép: `紫色` (zǐsè · màu tím), `紫外线` (zǐwàixiàn · tia cực tím/UV).                                     |

### Nhóm B: Kết nối, ràng buộc, độ mảnh & kết thúc

| Chữ Hán | Pinyin    | Hán Việt | Thiên bàng đứng chung                                                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                  |
| ------- | --------- | -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 结 / 結 | jié / jiē | kết      | `吉` (thanh phù _jí_ -> _jié_)                                          | **Hình thanh kiêm nghĩa:** Thắt nút sợi dây nối chặt hai đầu. Nghĩa: kết nối, kết thúc, kết quả (`jié`); đơm hoa kết trái (`jiē`). Từ ghép: `结果` (jiéguǒ · kết quả), `结束` (jiéshù · kết thúc), `总结` (zǒngjié · tổng kết). |
| 约 / 約 | yuē       | ước      | `勺` (thanh phù _sháo_ -> _yuē_)                                        | **Hình thanh kiêm nghĩa:** Dùng dây buộc túm gọn lại. Nghĩa: hẹn ước, giao ước, tiết kiệm, ước chừng. Từ ghép: `约定` (yuēdìng · hẹn ước), `大约` (dàyuē · khoảng chừng), `节约` (jiéyuē · tiết kiệm).                          |
| 紧 / 緊 | jǐn       | khẩn     | `臤` (chặt/cứng, nằm trên `糸`)                                         | **Hội ý kiêm thanh phù:** Quấn dây thừng siết thật chặt. Nghĩa: chặt chẽ, căng thẳng, khẩn cấp. Từ ghép: `紧张` (jǐnzhāng · căng thẳng), `赶紧` (gǎnjǐn · mau lên), `紧急` (jǐnjí · khẩn cấp).                                  |
| 细 / 細 | xì        | tế       | `田` (biến thể từ `囟` thóp đầu nhỏ)                                    | **Hội ý:** Sợi tơ nhỏ mảnh như sợi tóc. Nghĩa: nhỏ, mịn, tỉ mỉ, chi tiết. Từ ghép: `仔细` (zǐxì · cẩn thận), `详细` (xiángxì · chi tiết), `细菌` (xìjūn · vi khuẩn).                                                            |
| 终 / 終 | zhōng     | chung    | `冬` (mùa đông cuối năm, thanh phù _dōng_ -> _zhōng_)                   | **Hình thanh kiêm nghĩa:** Đầu mối cuối cùng của cuộn chỉ. Nghĩa: kết thúc, cuối cùng, trọn đời. Từ ghép: `终于` (zhōngyú · cuối cùng thì), `最终` (zuìzhōng · sau cùng), `始终` (shǐzhōng · trước sau như một).                |
| 绝 / 絕 | jué       | tuyệt    | `色` (biến thể từ hình dao cắt bó tơ)                                   | **Hội ý:** Dùng dao cắt đứt rời bó sợi tơ. Nghĩa: cắt đứt, cạn kiệt, từ chối, tuyệt đối. Từ ghép: `拒绝` (jùjué · từ chối), `绝对` (juéduì · tuyệt đối), `绝望` (juéwàng · tuyệt vọng).                                         |
| 继 / 繼 | jì        | kế       | Giản thể: `米` + nét gập (lược tự); Phồn thể: `𢇇` (bốn bó tơ nối nhau) | **Hội ý:** Phồn thể vẽ bốn bó tơ nối tiếp nhau (trái ngược với `斷` cắt đứt). Nghĩa: nối tiếp, tiếp tục, kế thừa. Từ ghép: `继续` (jìxù · tiếp tục), `继承` (jìchéng · kế thừa).                                                |

### Nhóm C: Tổ chức, hệ thống, cấp bậc & biên soạn

| Chữ Hán | Pinyin   | Hán Việt | Thiên bàng đứng chung                                                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                          |
| ------- | -------- | -------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 组 / 組 | zǔ       | tổ       | `且` (thanh phù _qiě_ -> _zǔ_)                                             | **Hình thanh kiêm nghĩa:** Dải lụa rộng bện từ nhiều sợi tơ -> tập hợp thành nhóm, tổ chức, lắp ghép. Từ ghép: `小组` (xiǎozǔ · nhóm nhỏ), `组织` (zǔzhī · tổ chức), `数组` (shùzǔ · mảng dữ liệu/array).                               |
| 级 / 級 | jí       | cấp      | `及` (kịp/nối tiếp, thanh phù _jí_)                                        | **Hình thanh kiêm nghĩa:** Phân loại thứ bậc thô–mịn của sợi tơ theo trình tự. Nghĩa: cấp bậc, lớp học, hạng, bậc thang. Từ ghép: `年级` (niánjí · khối lớp), `高级` (gāojí · cao cấp), `升级` (shēngjí · nâng cấp).                    |
| 经 / 經 | jīng     | kinh     | Giản thể: `圣` (lược tự); Phồn thể: `巠` (khung dệt dọc, thanh phù _jīng_) | **Hình thanh kiêm nghĩa:** Sợi dọc căng thẳng trên khung dệt -> trục chính, trải qua, kinh nghiệm, kinh tế, sách kinh điển. Từ ghép: `已经` (yǐjīng · đã), `经历` (jīnglì · trải qua), `经济` (jīngjì · kinh tế).                       |
| 统 / 統 | tǒng     | thống    | `充` (thanh phù _chōng_ -> _tǒng_)                                         | **Hình thanh kiêm nghĩa:** Nắm đầu mối chính của bó tơ để rút cả chùm. Nghĩa: đầu mối, thống nhất, tổng hợp, hệ thống. Từ ghép: `系统` (xìtǒng · hệ thống), `统计` (tǒngjì · thống kê), `传统` (chuántǒng · truyền thống).              |
| 编 / 編 | biān     | biên     | `扁` (dẹt, thanh phù _biǎn_)                                               | **Hình thanh kiêm nghĩa:** Dùng dây `纟/糹` xâu các thẻ tre dẹt `册/扁` thành quyển sách. Nghĩa: đan bện, biên soạn, lập trình, đánh số. Từ ghép: `编辑` (biānjí · biên tập), `编程` (biānchéng · lập trình), `编号` (biānhào · mã số). |
| 维 / 維 | wéi      | duy      | `隹` (chim đuôi ngắn, thanh phù _zhuī_ -> _wéi_)                           | **Hình thanh kiêm nghĩa:** Sợi dây thừng lớn buộc giữ mui xe hoặc lưới. Nghĩa: nối giữ, duy trì, bảo trì, chiều không gian. Từ ghép: `维护` (wéihù · bảo trì), `思维` (sīwéi · tư duy), `维度` (wéidù · chiều/khía cạnh).               |
| 给 / 給 | gěi / jǐ | cấp      | `合` (hợp/đủ, thanh phù _hé_ -> _gěi/jǐ_)                                  | **Hình thanh kiêm nghĩa:** Cung cấp đầy đủ sợi tơ, vật tư. Nghĩa: đưa cho (`gěi`); cung cấp, cấp phát (`jǐ`). Từ ghép: `送给` (sòng gěi · tặng cho), `自给自足` (zìjǐ-zìzú · tự cung tự cấp), `给予` (jǐyǔ · trao cho).                 |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-016`):** `幺` (bộ riêng chỉ sợi tơ nhỏ), `系` (`xì/jì` · hệ · buộc/hệ thống), `丝 / 絲` (`sī` · ty · sợi tơ).
- **Chữ có liên hệ với `糸 / 糹 / 纟` nhưng xếp ở bộ khác hoặc chuyển bộ ở Giản thể:**
  - `幺` (_yāo_ · yêu · nhỏ bé): Bộ riêng (#52), 3 nét (`幼`, `幻`, `幽`), không gộp vào `糸`.
  - `丝 / 絲` (_sī_ · ty · sợi tơ: `丝绸`): Phồn thể `絲` là hai bộ `糸` ghép cạnh nhau (xếp bộ `糸`); Giản thể `丝` lược phần `小` dưới chân nên thường tra theo **bộ `一`**.
  - `网 / 網` (_wǎng_ · võng · lưới, mạng: `网络`): Phồn thể `網` thuộc bộ `糸` (`糹 + 罔`); Giản thể `网` quay về tượng hình cái lưới nên xếp **bộ `网`** (#122).
  - `恋 / 戀` (_liàn_ · luyến · yêu mến) & `变 / 變` (_biàn_ · biến · thay đổi): Phồn thể có cụm `䜌` (`糸 + 言 + 糸` — lời nói ràng buộc bằng sợi dây), nhưng xếp lần lượt ở **bộ `心`** và **bộ `言`/`又`**.
  - `断 / 斷` (_duàn_ · đoạn · chặt đứt, quyết đoán): Phồn thể bên trái vẽ hai bó tơ bị cắt rời `㡭`, ghép với `斤` (rìu) bên phải -> xếp **bộ `斤`** (#69).
  - `药 / 藥` (_yào_ · dược · thuốc): Giản thể viết `艹 + 约`, trong đó `约` chỉ đóng vai trò lược tự thay cho `樂`, xếp **bộ `艹`** (#140).

---

## Bộ 18: 竹 (Trúc)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-135` (`radical_index`: `135`, `6` nét, `name_vi`: `bộ Trúc`). Không có dòng trùng hay dòng rỗng.
- **Hình thái & Biến thể (`variants`):**
  - `竹` (dạng đầy đủ, 6 nét — đứng độc lập làm chữ `竹` hoặc hiếm gặp ở bên trái).
  - `⺮` (trúc đầu / 竹字头, 6 nét — biến dạng nằm **trên đầu** chữ, nét sổ thẳng thu ngắn thành nét chấm ở mỗi cụm).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **cây tre / trúc** với hai thân nhánh rủ lá xuống (Khang Hy bộ #118).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Tre, trúc, vật dụng đan lát từ tre** (`筷`, `箱`, `篮`, `笼`); mở rộng sang **thẻ tre viết chữ, sách vở cổ, cây bút** (`笔`, `简`, `篇`, `籍`, `策`, `签`), **que tính đếm & thứ tự** (`算`, `第`, `等`), và **vật hình ống, dụng cụ dài/rỗng** (`管`, `筒`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Có `竹 / ⺮` thường liên quan đến **tre, đồ dùng bằng tre, vật hình ống, que, thẻ, sách vở/dụng cụ viết cổ hoặc phép tính đếm**.
  - _Phân biệt dễ nhầm:_
    - **`⺮` (Trúc đầu, 6 nét) vs `艹` (Thảo đầu, 3–4 nét):** `⺮` có 2 cụm lá nhọn 6 nét chỉ tre trúc; `艹` chỉ cỏ cây thân mềm. Cặp chữ rất dễ nhầm: `篮` (cái giỏ tre, bộ `⺮`) vs `蓝` (màu xanh lam từ cây chàm, bộ `艹`); `笨` (ngốc, bộ `⺮`) vs `范` (phạm vi, bộ `艹`).
    - **`竹` (tre, thân đốt rỗng) vs `木` (bộ Mộc, cây thân gỗ):** Hai bộ thực vật độc lập.
    - **Chú ý mẹo nhớ & ngoại lệ:** `笔` giản thể = `⺮` (cán tre) + `毛` (lông) rất dễ nhớ nghĩa "cây bút". Ngược lại, `笑` mang `⺮` ở đầu nhưng lịch sử tạo chữ phức tạp, không nên suy đoán máy móc nghĩa "tre".

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Đồ dùng từ tre, ống rỗng & vật dụng đời sống

| Chữ Hán | Pinyin      | Hán Việt | Thiên bàng đứng chung                         | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                         |
| ------- | ----------- | -------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 竹      | zhú         | trúc     | — (chữ độc lập)                               | **Tượng hình:** Hai nhánh lá tre rủ xuống. Nghĩa: cây tre, cây trúc. Từ ghép: `竹子` (zhúzi · cây tre), `竹笋` (zhúsǔn · măng tre).                                                                    |
| 筷      | kuài        | khoái    | `快` (nhanh, thanh phù _kuài_)                | **Hình thanh kiêm nghĩa:** Đôi đũa làm từ tre `⺮` giúp gắp thức ăn nhanh `快` (thay cho chữ `箸` cổ kiêng kỵ âm "dừng/mắc cạn"). Từ ghép: `筷子` (kuàizi · đũa).                                      |
| 箱      | xiāng       | tương    | `相` (thanh phù _xiāng_)                      | **Hình thanh kiêm nghĩa:** Thùng đựng đồ đan bằng tre xưa đặt trên xe -> hòm, thùng, tủ, hộp. Từ ghép: `冰箱` (bīngxiāng · tủ lạnh), `邮箱` (yóuxiāng · hòm thư/email), `行李箱` (xínglixiāng · vali). |
| 篮 / 籃 | lán         | lam      | `监 / 監` (thanh phù _jiān_ -> _lán_)         | **Hình thanh kiêm nghĩa:** Giỏ có quai xách đan bằng nan tre. Nghĩa: cái giỏ, rổ. Từ ghép: `篮球` (lánqiú · bóng rổ), `菜篮` (càilán · giỏ đi chợ).                                                    |
| 管      | guǎn        | quản     | `官` (thanh phù _guān_ -> _guǎn_, ý cai quản) | **Hình thanh kiêm nghĩa:** Gốc là ống sáo tre 6 lỗ -> ống dẫn rỗng; mở rộng sang nắm chốt quản lý. Từ ghép: `管理` (guǎnlǐ · quản lý), `不管` (bùguǎn · bất kể), `血管` (xuèguǎn · mạch máu).          |
| 筒      | tǒng        | đồng     | `同` (thanh phù _tóng_ -> _tǒng_)             | **Hình thanh kiêm nghĩa:** Đoạn ống tre rỗng ruột dày thành. Nghĩa: ống đựng, vật hình ống. Từ ghép: `话筒` (huàtǒng · micro/ống nghe), `手电筒` (shǒudiàntǒng · đèn pin).                             |
| 笼 / 籠 | lóng / lǒng | lung     | `龙 / 龍` (thanh phù _lóng_)                  | **Hình thanh kiêm nghĩa:** Lồng chim, lồng hấp đan bằng nan tre (`lóng`); chụp xuống bao phủ (`lǒng`). Từ ghép: `笼子` (lóngzi · cái lồng), `灯笼` (dēnglong · đèn lồng), `笼罩` (lǒngzhào · bao phủ). |

### Nhóm B: Thẻ tre, sách vở, viết lách & quy ước

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                               | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                      |
| ------- | ------ | -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 笔 / 筆 | bǐ     | bút      | Giản thể: `毛` (lông); Phồn thể: `聿` (tay cầm bút) | **Hội ý:** Phồn thể vẽ tay cầm bút lông `聿` cán tre `⺮`; Giản thể biểu đạt trực quan bằng `⺮` (cán tre) + `毛` (đầu lông). Nghĩa: cây bút, nét chữ, viết lách. Từ ghép: `笔记本` (bǐjìběn · sổ tay/laptop), `钢笔` (gāngbǐ · bút máy), `笔记` (bǐjì · ghi chép). |
| 简 / 簡 | jiǎn   | giản     | `间 / 間` (thanh phù _jiān_ -> _jiǎn_)              | **Hình thanh kiêm nghĩa:** Thẻ tre viết chữ thời cổ (mỗi thẻ chỉ ghi được ít chữ, gọn nhẹ). Nghĩa: thẻ tre, đơn giản, sơ lược. Từ ghép: `简单` (jiǎndān · đơn giản), `简历` (jiǎnlì · sơ yếu lý lịch/CV).                                                           |
| 篇      | piān   | thiên    | `扁` (thanh phù _biǎn_ -> _piān_)                   | **Hình thanh kiêm nghĩa:** Tập hợp nhiều thẻ tre xâu thành một thiên/chương sách hoàn chỉnh. Nghĩa: bài viết, chương, lượng từ cho bài văn. Từ ghép: `一篇` (yì piān · một bài), `篇幅` (piānfú · độ dài bài viết).                                                 |
| 籍      | jí     | tịch     | `耤` (thanh phù _jí_)                               | **Hình thanh kiêm nghĩa:** Sổ sách, văn bản chép trên thẻ tre thời cổ. Nghĩa: sách vở, sổ hộ tịch, quốc tịch. Từ ghép: `国籍` (guójí · quốc tịch), `书籍` (shūjí · sách vở), `户籍` (hùjí · hộ khẩu).                                                               |
| 签 / 簽 | qiān   | thiêm    | `佥 / 僉` (thanh phù _qiān_)                        | **Hình thanh kiêm nghĩa:** Thẻ tre nhỏ vót nhọn dùng để ghi chú đánh dấu hoặc bốc thăm (gộp cả Phồn thể `籤`). Nghĩa: thẻ, nhãn dán, ký tên. Từ ghép: `签名` (qiānmíng · ký tên), `签证` (qiānzhèng · visa), `标签` (biāoqiān · nhãn/tag).                          |
| 策      | cè     | sách     | `朿` (gai/cọc nhọn, thanh phù _cì_ -> _cè_)         | **Hình thanh kiêm nghĩa:** Roi tre thúc ngựa hoặc thẻ tre ghi mưu lược. Nghĩa: kế sách, chính sách, roi ngựa. Từ ghép: `政策` (zhèngcè · chính sách), `策略` (cèlüè · sách lược), `对策` (duìcè · đối sách).                                                        |
| 符      | fú     | phù      | `付` (giao phó, thanh phù _fù_ -> _fú_)             | **Hình thanh kiêm nghĩa:** Mảnh thẻ tre khắc chữ bẻ đôi để đối chiếu khớp nhau làm tín vật. Nghĩa: khớp nhau, phù hợp, ký hiệu, bùa chú. Từ ghép: `符合` (fúhé · phù hợp), `符号` (fúhào · ký hiệu).                                                                |

### Nhóm C: Tính đếm, thứ tự & hành động mở rộng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                           |
| ------- | ------ | -------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 算      | suàn   | toán     | `目` (mắt) + `廾` (hai tay)                                          | **Hội ý:** Hai tay `廾` gảy các que tính bằng tre `⺮`, mắt `目` nhìn đối chiếu để tính đếm. Nghĩa: tính toán, coi như, dự định. Từ ghép: `计算` (jìsuàn · tính toán), `打算` (dǎsuàn · dự định), `算法` (suànfǎ · thuật toán).                          |
| 第      | dì     | đệ       | `弔` biến dạng (dây buộc thẻ xếp theo thứ tự)                        | **Tượng hình / Hội ý:** Các thẻ tre được buộc xâu sắp xếp theo thứ tự trước sau. Nghĩa: thứ tự (dùng trước số từ). Từ ghép: `第一` (dì-yī · thứ nhất), `第几` (dì jǐ · thứ mấy).                                                                         |
| 等      | děng   | đẳng     | `寺` (công sở, thanh phù _sì_ -> _děng_, ý phép tắc)                 | **Hình thanh kiêm nghĩa:** Sắp xếp các thẻ tre sổ sách ngay ngắn ngang hàng trong công sở `寺`. Nghĩa: ngang bằng, cấp bậc, chờ đợi, vân vân. Từ ghép: `等等` (děngděng · vân vân), `平等` (píngděng · bình đẳng), `等待` (děngdài · chờ đợi).           |
| 答      | dá     | đáp      | `合` (khớp nhau)                                                     | **Hội ý kiêm thanh phù:** Khớp thẻ tre làm tin / dùng ống tre truyền lời đối ứng ăn khớp. Nghĩa: trả lời, đáp lại. Từ ghép: `回答` (huídá · trả lời), `答案` (dá'àn · đáp án).                                                                           |
| 筑 / 築 | zhù    | trúc     | Giản thể: `巩`; Phồn thể: `鞏` (nện chặt, thanh phù _gǒng_ -> _zhù_) | **Hình thanh kiêm nghĩa:** Thời cổ dùng thanh tre/gỗ cứng giã nện đất làm nền tường. Nghĩa: xây dựng, kiến trúc. Từ ghép: `建筑` (jiànzhù · kiến trúc/xây dựng), `筑路` (zhùlù · làm đường).                                                             |
| 笑      | xiào   | tiếu     | `夭` (uốn nghiêng mềm mại)                                           | **Hội ý/Hình thanh (tranh luận cổ):** Thân tre lay động trong gió hoặc hình dáng người cúi nghiêng vui vẻ (với `⺮` ở trên). Nghĩa: cười, cười cợt. Từ ghép: `微笑` (wēixiào · mỉm cười), `开玩笑` (kāi wánxiào · nói đùa), `搞笑` (gǎoxiào · hài hước). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-135`):** `笔 / 筆`, `管`, `笑` (ví dụ tiêu biểu của `竹`), cùng `木`, `艹` (hai bộ thực vật riêng dễ nhầm).
- **Chữ liên hệ giữa `⺮` và `艹` hoặc biến đổi Giản–Phồn:**
  - `节 / 節` (_jié_ · tiết · đốt tre, tiết học, ngày lễ: `春节`, `节省`): Phồn thể `節` thuộc **bộ `竹`** (#118, nghĩa gốc là đốt tre -> phân đoạn, tiết kiệm); Giản thể `节` biến đổi đầu thành `艹` nên xếp **bộ `艹`**.
  - `范 / 範` (_fàn_ · phạm · khuôn mẫu, phạm vi: `范围`, `示范`): Phồn thể phân biệt `範` (khuôn bằng tre, thuộc **bộ `竹`**) và `范` (họ Phạm/cỏ, bộ `艹`); Giản thể gộp cả hai thành `范` (**bộ `艹`**).
  - `蓝` (_lán_ · lam · màu xanh lam: `蓝天`): Cùng thanh phù `监` với `篮 / 籃` (cái giỏ), nhưng `蓝` thuộc **bộ `艹`** vì xưa dùng cây chàm (thảo mộc) nhuộm xanh.
  - `笨` (_bèn_ · bổn · ngu ngốc, vụng về: `笨蛋`, `笨拙`): Xếp **bộ `竹`** (nghĩa gốc là phần lõi thô bên trong cây tre), nhưng nghĩa hiện đại không còn nhắc trực tiếp đến tre trúc.

---

## Bộ 19: 金 (Kim)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-015` (`radical_index`: `15`, `8` nét, `name_vi`: `bộ Kim`).
  - _Ghi chú dòng rỗng:_ DB có dòng rỗng trùng ở `radical-199` (`radical_index`: `199`, `radical`: `金 / 钅`, `name_vi`: `null`, `strokes`: `null`).
- **Hình thái & Biến thể (`variants`):**
  - `金` (dạng đầy đủ, 8 nét — đứng độc lập làm chữ `金`, hoặc nằm **bên dưới** chữ như `鉴 / 鑑`, `釜`).
  - `釒` (kim đứng phồn thể, 8 nét — nằm **bên trái** chữ).
  - `钅` (kim đứng giản thể, 5 nét — gọi là _kim tự bàng / 金字旁_, nằm **bên trái** chữ).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ **Kim loại nói chung**; trong văn hóa cổ thường gắn với vàng, đồng, đồ kim khí (tượng hình các khối quặng kim loại nằm trong đất `土` dưới mái lò đúc/lớp đất phủ; Khang Hy bộ #167).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Kim loại, khoáng vật, tiền tệ bằng kim loại, công cụ–dụng cụ cơ khí, vật cứng/sắc nhọn, âm thanh kim khí** (`钟`, `锐`, `锻`, `错`, `销`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Có `金 / 釒 / 钅` thường liên quan đến **kim loại, tiền, đồ nghề, máy móc, vật cứng, vật nhọn, dụng cụ**. Dạng `钅` là biến thể giản thể cực kỳ quan trọng khi học tiếng Trung hiện đại.
  - _Phân biệt dễ nhầm:_
    - **`钅` (bộ Kim đứng, 5 nét) vs `针` (chữ "cây kim" = `钅 + 十`):** Không nhầm tên gọi hay hình dáng giữa bộ `钅` và chữ `针`.
    - **`金` (8 nét) vs `全` (6 nét):** `金` có **hai nét chấm `丷`** hai bên nét sổ dưới (`土` + `丷`); `全` là `人 + 王` (nghĩa "toàn bộ"), không có hai nét chấm.
    - **`钅` (5 nét, 3 gạch ngang) vs `饣` (bộ Thực giản thể, 3 nét):** `钅` có 3 gạch ngang ngắn; `饣` chỉ có phẩy, ngang gập, sổ-hất (`饭`, `饮`).
    - **`金 / 钅` vs `刀 / 刂` & `贝 / 貝`:** `刀 / 刂` chuyên về hành động cắt/dao (dù dao làm từ kim loại); `贝 / 貝` thiên về giá trị/giao dịch, còn `金 / 钅` thiên về vật liệu kim loại và tiền kim loại (`钱`, `银`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Kim loại, tiền tệ & khoáng chất

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                                      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                          |
| ------- | ------ | -------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 金      | jīn    | kim      | — (chữ độc lập)                                                            | **Tượng hình/Hội ý:** Khối quặng kim loại trong lòng đất. Nghĩa: vàng, kim loại, tiền bạc, màu vàng kim. Từ ghép: `黄金` (huángjīn · vàng ròng), `金属` (jīnshǔ · kim loại), `现金` (xiànjīn · tiền mặt).                                               |
| 钱 / 錢 | qián   | tiền     | `戋 / 戔` (nhỏ/ít, thanh phù _jiān_ -> _qián_)                             | **Hình thanh kiêm nghĩa:** Xưa chỉ nông cụ bằng đồng (như cái xẻng/cuốc nhỏ) rồi trở thành hình dáng đồng tiền đúc. Nghĩa: tiền bạc, đơn vị tiền tệ. Từ ghép: `赚钱` (zhuànqián · kiếm tiền), `钱包` (qiánbāo · ví tiền), `花钱` (huāqián · tiêu tiền). |
| 银 / 銀 | yín    | ngân     | `艮` (thanh phù _gěn_ -> _yín_)                                            | **Hình thanh kiêm nghĩa:** Kim loại trắng sáng quý hiếm. Nghĩa: bạc, tiền tệ, ngân hàng. Từ ghép: `银行` (yínháng · ngân hàng), `银色` (yínsè · màu bạc).                                                                                               |
| 铁 / 鐵 | tiě    | thiết    | Giản thể: `失` (_shī_, lược tự); Phồn thể: `𢧤` (thanh phù _zhí_ -> _tiě_) | **Hình thanh kiêm nghĩa:** Kim loại màu đen, cứng và phổ biến nhất trong công nghiệp. Nghĩa: sắt, cứng rắn. Từ ghép: `地铁` (dìtiě · tàu điện ngầm), `高铁` (gāotiě · tàu cao tốc).                                                                     |
| 钢 / 鋼 | gāng   | cương    | `冈 / 岡` (sống núi cứng, thanh phù _gāng_)                                | **Hình thanh kiêm nghĩa:** Sắt được tôi luyện cứng cáp như sống núi. Nghĩa: thép. Từ ghép: `钢笔` (gāngbǐ · bút máy), `钢铁` (gāngtiě · gang thép).                                                                                                     |
| 铜 / 銅 | tóng   | đồng     | `同` (thanh phù _tóng_)                                                    | **Hình thanh kiêm nghĩa:** Kim loại màu đỏ/vàng dễ đúc trộn hợp kim cùng các kim loại khác. Nghĩa: đồng. Từ ghép: `铜牌` (tóngpái · huy chương đồng), `青铜` (qīngtóng · đồng thanh).                                                                   |
| 铅 / 鉛 | qiān   | duyên    | `㕣` (thanh phù _yǎn_ -> _qiān_)                                           | **Hình thanh kiêm nghĩa:** Kim loại mềm màu xám đen. Nghĩa: chì (hiện đại dùng chỉ ruột than bút chì). Từ ghép: `铅笔` (qiānbǐ · bút chì).                                                                                                              |

### Nhóm B: Công cụ, linh kiện cơ khí & vật dụng kim loại

| Chữ Hán | Pinyin      | Hán Việt | Thiên bàng đứng chung                                                   | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                                 |
| ------- | ----------- | -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 针 / 針 | zhēn        | châm     | `十` (thanh phù _shí_ cổ / hình cây kim thẳng)                          | **Hội ý kiêm hình thanh:** Vật kim loại nhỏ nhọn thẳng đứng. Nghĩa: cây kim, mũi tiêm, kim đồng hồ, châm cứu. Từ ghép: `针对` (zhēnduì · nhắm vào), `打针` (dǎzhēn · tiêm thuốc), `指针` (zhǐzhēn · kim đồng hồ/con trỏ).                                                      |
| 钉 / 釘 | dīng / dìng | đinh     | `丁` (hình cái đinh, thanh phù _dīng_)                                  | **Hình thanh kiêm hội ý:** Thanh kim loại đầu bẹt dùng để đóng giữ (`dīng` danh từ; `dìng` động từ đóng đinh). Từ ghép: `钉子` (dīngzi · cái đinh), `图钉` (túdīng · đinh ghim).                                                                                               |
| 锁 / 鎖 | suǒ         | tỏa      | `𧴪` (giản hóa thành `小` + `贝`, gợi mắt xích khóa)                    | **Hình thanh kiêm nghĩa:** Dây xích/ổ khóa kim loại dùng khóa giữ cửa hoặc tài sản. Nghĩa: cái khóa, khóa lại. Từ ghép: `锁门` (suǒmén · khóa cửa), `解锁` (jiěsuǒ · mở khóa), `密码锁` (mìmǎsuǒ · khóa mật mã).                                                               |
| 键 / 鍵 | jiàn        | kiện     | `建` (thanh phù _jiàn_)                                                 | **Hình thanh kiêm nghĩa:** Chốt cài bằng sắt tra vào ổ khóa hoặc trục xe. Nghĩa: chốt then chốt, phím bấm máy tính/nhạc cụ. Từ ghép: `键盘` (jiànpán · bàn phím), `关键` (guānjiàn · then chốt), `快捷键` (kuàijiéjiàn · phím tắt).                                            |
| 链 / 鏈 | liàn        | liên     | `连 / 連` (nối liền, thanh phù _lián_ -> _liàn_)                        | **Hình thanh kiêm nghĩa:** Các vòng kim loại móc nối liên tiếp với nhau. Nghĩa: dây xích, chuỗi, liên kết mạng. Từ ghép: `链接` (liànjiē · đường link), `区块链` (qūkuàiliàn · blockchain), `供应链` (gōngyìngliàn · chuỗi cung ứng).                                          |
| 钟 / 鐘 | zhōng       | chung    | Giản thể: `中` (_zhōng_, thanh phù); Phồn thể: `童` (_tóng_ -> _zhōng_) | **Hình thanh kiêm nghĩa:** Nhạc khí đúc bằng đồng phát âm vang; Giản thể gộp chung `鐘` (chuông/đồng hồ) và `鍾` (họ Chung/tình cảm). Nghĩa: chuông, đồng hồ, giờ/phút. Từ ghép: `分钟` (fēnzhōng · phút), `闹钟` (nàozhōng · đồng hồ báo thức), `钟表` (zhōngbiǎo · đồng hồ). |
| 镜 / 鏡 | jìng        | kính     | `竟` (thanh phù _jìng_)                                                 | **Hình thanh kiêm nghĩa:** Xưa đúc đĩa đồng đánh bóng làm gương soi. Nghĩa: cái gương, kính mắt, thấu kính. Từ ghép: `镜子` (jìngzi · cái gương), `眼镜` (yǎnjìng · kính mắt), `镜头` (jìngtóu · ống kính/cảnh quay).                                                          |
| 锅 / 鍋 | guō         | oa       | `呙 / 咼` (thanh phù _guō_)                                             | **Hình thanh kiêm nghĩa:** Vật dụng đun nấu bằng kim loại. Nghĩa: cái nồi, chảo. Từ ghép: `火锅` (huǒguō · lẩu), `锅盖` (guōgài · vung nồi).                                                                                                                                   |

### Nhóm C: Gia công kim khí, tính chất & nghĩa mở rộng

| Chữ Hán | Pinyin      | Hán Việt | Thiên bàng đứng chung                                                          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                  |
| ------- | ----------- | -------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 错 / 錯 | cuò         | thác     | `昔` (thanh phù _xī_ -> _cuò_ cổ)                                              | **Hình thanh kiêm nghĩa:** Xưa chỉ kỹ thuật dát/khảm vàng bạc đan xen lên đồ đồng -> đan xen, lệch lạc, sai sót. Từ ghép: `不错` (búcuò · khá tốt), `错误` (cuòwù · sai lầm), `错过` (cuòguò · bỏ lỡ).                          |
| 销 / 銷 | xiāo        | tiêu     | `肖` (thanh phù _xiāo_)                                                        | **Hình thanh kiêm nghĩa:** Nấu chảy kim loại bằng lửa -> tan biến, hủy bỏ, tiêu thụ hàng hóa. Từ ghép: `销售` (xiāoshòu · bán hàng/sales), `报销` (bàoxiāo · thanh toán chi phí), `注销` (zhùxiāo · hủy tài khoản).             |
| 锻 / 鍛 | duàn        | đoạn     | `段` (thanh phù _duàn_)                                                        | **Hình thanh kiêm nghĩa:** Nung đỏ và dùng búa đập rèn kim loại cho cứng chắc. Nghĩa: rèn sắt, rèn luyện. Từ ghép: `锻炼` (duànliàn · rèn luyện/tập thể dục).                                                                   |
| 钻 / 鑽 | zuān / zuàn | toản     | Giản thể: `占` (_zhān_, lược thanh phù); Phồn thể: `贊` (_zàn_ -> _zuān/zuàn_) | **Hình thanh kiêm nghĩa:** Mũi nhọn kim loại xoay khoét sâu vào vật cứng. Nghĩa: khoan, chui sâu, nghiên cứu (`zuān`); mũi khoan, kim cương (`zuàn`). Từ ghép: `钻研` (zuānyán · nghiên cứu sâu), `钻石` (zuànshí · kim cương). |
| 锐 / 銳 | ruì         | nhuệ     | `兑` (thanh phù _duì_ -> _ruì_)                                                | **Hình thanh kiêm nghĩa:** Lưỡi binh khí kim loại sắc bén. Nghĩa: sắc nhọn, nhạy bén, hăng hái. Từ ghép: `锐利` (ruìlì · sắc bén), `敏锐` (mǐnruì · nhạy bén).                                                                  |
| 镇 / 鎮 | zhèn        | trấn     | `真` (thanh phù _zhēn_)                                                        | **Hình thanh kiêm nghĩa:** Quả cân hoặc vật nặng bằng kim loại dùng để đè giữ. Nghĩa: đè nén, giữ bình tĩnh, thị trấn. Từ ghép: `镇定` (zhèndìng · bình tĩnh), `小镇` (xiǎozhèn · thị trấn nhỏ).                                |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-015`):** `针 / 針`, `钱 / 錢`, `铜 / 銅`, `铁 / 鐵` (ví dụ tiêu biểu của `金`), cùng `刂 / 刀` (bộ riêng).
- **Chữ chứa `金 / 钅` nhưng xếp ở bộ khác hoặc mất bộ khi giản thể hóa:**
  - `录 / 錄` (_lù_ · lục · ghi chép, lưu lại: `记录`, `登录`): Phồn thể `錄` thuộc **bộ `金`** (`釒 + 彔`, gốc là chạm khắc chữ lên kim khí); Giản thể `录` lược bỏ `釒`, nên tra theo **bộ `彐`**.
  - `衔 / 銜` (_xián_ · hàm · hàm ngựa sắt, chức hàm: `头衔`): Gồm `金` kẹp giữa bộ `行` (`彳 + 金 + 亍`), xếp **bộ `行`** (#144).
  - `钦 / 欽` (_qīn_ · khâm · kính trọng, khâm phục: `钦佩`): Gồm `钅/金 + 欠`, Khang Hy xếp **bộ `欠`** (#76).
  - `釜` (_fǔ_ · phủ · cái vạc, nồi): Gồm `父 + 金`, xếp **bộ `父`** (#88).
  - `全` (_quán_ · toàn · toàn bộ: `安全`, `完全`): Dáng giống `金` nhưng là `人 + 王` (không có 2 chấm `丷`), xếp **bộ `入` / `人`**.
  - `刂 / 刀` (bộ Đao) & `贝 / 貝` (bộ Bối): Hai bộ riêng có trường nghĩa gần (đồ sắc / tiền bạc), không nhập vào `金`.

---

## Bộ 20: 刀 (Đao)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-034` (`radical_index`: `34`, `2` nét, `name_vi`: `bộ Đao`). Không có dòng trùng hay dòng rỗng.
- **Hình thái & Biến thể (`variants`):**
  - `刀` (dạng đầy đủ, 2 nét — đứng độc lập, bên phải như `切`, hoặc nằm **bên dưới** như `分`, `剪`, `券`).
  - `刂` (đao đứng / 立刀旁, 2 nét — luôn nằm **bên phải** chữ).
  - `⺈` (dạng liên quan ở đầu một số chữ cổ/linh kiện như `色`, `危`, `负`, `免`, `急` — cần xét từng chữ vì phần lớn xếp sang bộ khác).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **con dao**, vật sắc nhọn dùng để cắt, chém (Khang Hy bộ #18).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Dao, hành động cắt, chém, gọt, khắc, mổ xẻ**; mở rộng sang **phân chia, tách bạch, xét đoán, quy định chuẩn mực và xử lý công việc rạch ròi** (`分`, `别`, `判`, `则`, `制`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Có `刀 / 刂` thường liên quan đến **cắt, chém, dao, phân chia, tách rời, chạm khắc hoặc xử lý bằng vật sắc**.
  - _Phân biệt dễ nhầm:_
    - **`刂` (Đao đứng, 2 nét thẳng) vs `卩` (bộ Tiết, 2 nét):** `刂` (sổ ngắn + sổ móc dài) luôn đứng bên phải (`到`, `别`, `利`, `刻`); `卩` gồm nét ngang-gập-móc + nét sổ dài (`印`, `即`, `却`), không phải bộ Đao.
    - **`刀` (2 nét) vs `力` (bộ Lực, 2 nét):** Trong `刀`, nét phẩy nằm gọn bên dưới nét ngang-gập-móc; trong `力`, nét phẩy **nhô vượt lên trên** đỉnh chữ (`功`, `动`), nghĩa là "sức lực".
    - **`刀` vs `刃` (lưỡi dao):** `刃` (_rèn_) là chữ chỉ sự thêm một nét chấm vào `刀` để chỉ phần mép lưỡi sắc bén.
    - **`刀 / 刂` vs `金 / 钅`:** Dù dao làm bằng kim loại, bộ `刀 / 刂` nhấn mạnh **hành động cắt/tách**, còn `金 / 钅` nhấn mạnh **vật liệu kim loại**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Con dao, lưỡi dao & hành động cắt, gọt, khắc

| Chữ Hán | Pinyin     | Hán Việt | Thiên bàng đứng chung                            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                               |
| ------- | ---------- | -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 刀      | dāo        | đao      | — (chữ độc lập)                                  | **Tượng hình:** Lưỡi dao cong có chuôi cầm. Nghĩa: con dao, vật hình dao. Từ ghép: `菜刀` (càidāo · dao thái rau), `剪刀` (jiǎndāo · cái kéo).                                                                                               |
| 刃      | rèn        | nhận     | Nét chấm chỉ sự                                  | **Chỉ sự:** Thêm một chấm vào mép cong của chữ `刀` để chỉ phần lưỡi sắc bén. Nghĩa: lưỡi dao. Từ ghép: `刀刃` (dāorèn · lưỡi dao), `迎刃而解` (yíngrèn-érjiě · giải quyết dễ như chẻ tre).                                                  |
| 切      | qiē / qiè  | thiết    | `七` (thanh phù _qī_ -> _qiē/qiè_ + ý cắt ngang) | **Hình thanh kiêm hội ý:** Dùng dao `刀` cắt ngang đứt đoạn. Nghĩa: cắt, thái (`qiē`); sát gần, thiết thực, tất cả (`qiè`). Từ ghép: `切菜` (qiē cài · thái rau), `一切` (yíqiè · tất cả), `亲切` (qīnqiè · thân thiết).                     |
| 剪      | jiǎn       | tiễn     | `前` (thanh phù _qián_ -> _jiǎn_)                | **Hình thanh kiêm nghĩa:** Chữ `前` bên trên + `刀` bên dưới chỉ dùng dao kép cắt gọn. Nghĩa: cái kéo, cắt bằng kéo, cắt ghép. Từ ghép: `剪刀` (jiǎndāo · cái kéo), `剪辑` (jiǎnjí · dựng/edit video).                                       |
| 削      | xuē / xiāo | tước     | `肖` (thanh phù _xiāo_)                          | **Hình thanh kiêm nghĩa:** Dùng dao `刂` gọt mỏng đi. Nghĩa: gọt vỏ (`xiāo`); cắt giảm, tước bỏ (`xuē`). Từ ghép: `削苹果` (xiāo píngguǒ · gọt táo), `削减` (xuējiǎn · cắt giảm).                                                            |
| 刮      | guā        | quát     | `舌` (lược tự `𠯑`, thanh phù _kuò_ -> _guā_)    | **Hình thanh kiêm nghĩa:** Dùng lưỡi dao `刂` cạo phẳng bề mặt. Nghĩa: cạo, nạo, gió thổi tạt. Từ ghép: `刮胡子` (guā húzi · cạo râu), `刮风` (guā fēng · nổi gió).                                                                          |
| 刻      | kè         | khắc     | `亥` (thanh phù _hài_ -> _kè_)                   | **Hình thanh kiêm nghĩa:** Dùng dao `刂` chạm khắc lên gỗ đá (xưa khắc vạch lên đồng hồ nước đo giờ). Nghĩa: chạm khắc, khắc nghiệt, khoảnh khắc. Từ ghép: `立刻` (lìkè · lập tức), `时刻` (shíkè · thời khắc), `雕刻` (diāokè · điêu khắc). |
| 刷      | shuā       | xoát     | `𡰣` (`尸 + 巾`, hình giẻ/bàn chải lau)          | **Hội ý:** Dùng công cụ lau cạo `𡰣` cùng `刂` quét sạch bụi bẩn. Nghĩa: chải, quét (thẻ), làm mới dữ liệu. Từ ghép: `刷牙` (shuā yá · đánh răng), `刷卡` (shuā kǎ · quẹt thẻ), `刷新` (shuāxīn · tải lại/refresh).                          |

### Nhóm B: Phân chia, tách biệt, sắp xếp & xét đoán

| Chữ Hán | Pinyin    | Hán Việt    | Thiên bàng đứng chung                                                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                               |
| ------- | --------- | ----------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 分      | fēn / fèn | phân / phận | `八` (chia tách ra hai bên)                                               | **Hội ý:** Dùng dao `刀` chém tách vật ra làm hai phần `八`. Nghĩa: chia, phân biệt, phút, điểm (`fēn`); bổn phận, phần (`fèn`). Từ ghép: `分别` (fēnbié · phân biệt), `十分` (shífēn · vô cùng), `部分` (bùfen · bộ phận).                  |
| 别      | bié / biè | biệt        | `另` (gốc là `冎` khung xương)                                            | **Hội ý:** Dùng dao `刂` róc tách thịt rời khỏi bộ xương `冎`. Nghĩa: phân biệt, tách biệt, khác, đừng; bướng bỉnh (`biè`). Từ ghép: `别人` (biérén · người khác), `区别` (qūbié · sự khác biệt), `特别` (tèbié · đặc biệt).                 |
| 判      | pàn       | phán        | `半` (một nửa, thanh phù _bàn_ -> _pàn_ + ý chia đôi)                     | **Hội ý kiêm thanh phù:** Dùng dao `刂` chia rạch ròi làm hai nửa `半`. Nghĩa: phân xử, phán đoán, đánh giá. Từ ghép: `判断` (pànduàn · phán đoán), `谈判` (tánpàn · đàm phán), `裁判` (cáipàn · trọng tài).                                 |
| 列      | liè       | liệt        | `歹` (xương thịt chia phần)                                               | **Hội ý:** Dùng dao `刂` cắt xẻ xếp từng phần ngay ngắn thành hàng. Nghĩa: xếp hàng, danh sách, hàng loạt. Từ ghép: `排列` (páiliè · sắp xếp), `列表` (lièbiǎo · danh sách/list), `系列` (xìliè · chuỗi/series).                             |
| 则 / 則 | zé        | tắc         | `贝 / 貝` (đỉnh vạc / vật quý)                                            | **Hội ý:** Dùng dao `刂` khắc điều lệ lên đỉnh đồng hoặc vật quý `貝` để làm chuẩn mực chung. Nghĩa: quy tắc, nguyên tắc, bèn/thì. Từ ghép: `规则` (guīzé · quy tắc), `原则` (yuánzé · nguyên tắc), `否则` (fǒuzé · nếu không thì).          |
| 划 / 劃 | huà / huá | hoạch / hoa | Giản thể: `戈` (lược tự); Phồn thể: `畫` (thanh phù _huà_ + ý vạch đường) | **Hình thanh kiêm nghĩa:** Dùng dao `刂` vạch đường ranh giới rõ ràng. Nghĩa: vạch, hoạch định (`huà`); chèo thuyền, quẹt, có lợi (`huá`). Từ ghép: `计划` (jìhuà · kế hoạch), `划分` (huàfēn · phân chia), `划算` (huásuàn · đáng giá/hời). |

### Nhóm C: Tạo tác, thành quả & trạng thái mở rộng

| Chữ Hán | Pinyin          | Hán Việt      | Thiên bàng đứng chung                        | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                             |
| ------- | --------------- | ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 利      | lì              | lợi           | `禾` (cây lúa)                               | **Hội ý:** Dùng lưỡi dao/liềm `刂` gặt lúa `禾` -> sắc bén, thuận lợi, thu hoạch lợi ích. Từ ghép: `顺利` (shùnlì · thuận lợi), `利益` (lìyì · lợi ích), `锋利` (fēnglì · sắc bén).                                                        |
| 刚 / 剛 | gāng            | cương         | `冈 / 岡` (sống núi cứng, thanh phù _gāng_)  | **Hình thanh kiêm nghĩa:** Lưỡi dao thép cứng rắn. Nghĩa: cứng cỏi, kiên cường, vừa mới đây. Từ ghép: `刚才` (gāngcái · vừa nãy), `刚好` (gānghǎo · vừa vặn), `刚强` (gāngqiáng · kiên cường).                                             |
| 创 / 創 | chuàng / chuāng | sáng / thương | `仓 / 倉` (thanh phù _cāng_ -> _chuàng_)     | **Hình thanh kiêm nghĩa:** Vết dao chém mở đường đầu tiên -> mở mang, sáng tạo (`chuàng`); vết thương (`chuāng`). Từ ghép: `创造` (chuàngzào · sáng tạo), `创业` (chuàngyè · khởi nghiệp), `创新` (chuàngxīn · đổi mới).                   |
| 制      | zhì             | chế           | `未` (biến thể cây nhiều cành cần tỉa)       | **Hội ý:** Dùng dao `刂` cắt tỉa cành lá rậm rạp cho vào khuôn phép. Nghĩa: quy chế, kiềm chế, chế tạo (Giản thể kiêm luôn Phồn thể `製`). Từ ghép: `制度` (zhìdù · chế độ), `控制` (kòngzhì · kiểm soát), `复制` (fùzhì · sao chép/copy). |
| 到      | dào             | đáo           | `至` (tới nơi, thanh phù _zhì_ -> _dào_ cổ)  | **Hình thanh kiêm nghĩa:** Mũi tên/người đi tới đích (`至`), ghép thêm `刂` làm thanh phù/tăng cường. Nghĩa: đến nơi, đạt tới. Từ ghép: `到达` (dàodá · đến nơi), `收到` (shōudào · nhận được), `迟到` (chídào · đến muộn).                |
| 剩      | shèng           | thặng         | `乘` (thừa/dư, thanh phù _chéng_ -> _shèng_) | **Hình thanh kiêm nghĩa:** Phần cắt gọt ra còn dư thừa lại. Nghĩa: còn lại, dư thừa. Từ ghép: `剩下` (shèngxià · còn lại), `剩余` (shèngyú · thặng dư).                                                                                    |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-034`):** `切`, `分`, `初`, `剪` (ví dụ tiêu biểu liên quan `刀`), cùng `金 / 钅` (bộ riêng).
- **Chữ chứa `刀`, `刂` hoặc `⺈` nhưng xếp ở bộ khác (hoặc có lưu ý đặc biệt):**
  - `初` (_chū_ · sơ · ban đầu: `开始`, `当初`): Gồm `衤 + 刀` (dùng dao cắt tấm vải mở đầu việc may áo). Khang Hy xếp bộ `刀`, nhưng tự điển hiện đại thường xếp theo **bộ `衤` (`衣`)**.
  - `解` (_jiě_ · giải · tháo gỡ, giải thích: `解决`, `理解`): Gồm `角 + 刀 + 牛` (dùng dao mổ tách sừng bò -> phân tích, tháo gỡ), xếp **bộ `角`** (#148).
  - `照` (_zhào_ · chiếu · soi sáng: `照顾`, `拍照`): Chứa `昭` (`日 + 召`, mà `召 = 刀 + 口`), xếp **bộ `灬` (`火`)**.
  - `超` (_chāo_ · siêu · vượt qua: `超市`): Chứa `召` (`刀 + 口`), xếp **bộ `走`** (#156).
  - `负 / 負` (_fù_ · phụ · gánh vác), `色` (_sè_ · sắc · màu sắc), `危` (_wēi_ · nguy · nguy hiểm): Đều mang nét đầu `⺈` (vốn tượng hình người cúi đầu/đầu người, không phải `刀`), lần lượt xếp bộ `貝`, bộ `色` và bộ `卩`.
  - `力` (bộ Lực — `功`, `动`) & `卩` (bộ Tiết — `印`, `即`): Hai bộ thủ độc lập dễ nhầm nét với `刀` và `刂`.

---

## Bộ 21: 貝 (Bối)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-040` (`radical_index`: `40`, `7` nét, `name_vi`: `bộ Bối`).
  - _Ghi chú dòng rỗng:_ DB có dòng rỗng trùng ở `radical-186` (`radical_index`: `186`, `radical`: `貝 / 贝`, `name_vi`: `null`, `strokes`: `null`).
- **Hình thái & Biến thể (`variants`):**
  - `貝` (dạng phồn thể / đầy đủ, 7 nét — đứng độc lập, bên **trái**, hoặc **bên dưới** chữ).
  - `贝` (dạng giản thể, 4 nét — đứng độc lập, bên **trái**, hoặc **bên dưới** chữ).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **vỏ sò biển** (có hai mảnh vỏ khép lại và tua chân bên dưới); thời cổ đại (nhà Thương–Chu) vỏ sò quý hiếm được dùng làm vật ngang giá / tiền tệ (Khang Hy bộ #154).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Tiền bạc, tài sản, hàng hóa, mua bán, giá trị, trao đổi, vay nợ, bồi thường, quà tặng, trách nhiệm** (`财`, `货`, `贵`, `费`, `购`, `贷`, `责`, `赠`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Có `貝 / 贝` thường liên quan đến **tiền bạc, tài sản, mua bán, nợ nần, giá trị, hàng hóa, trao đổi hoặc thưởng phạt**. Trong cấu chữ Hán hiện đại, `贝` hầu như không mang nghĩa "con sò" sinh học mà mang nghĩa lõi "tiền / giá trị".
  - _Phân biệt dễ nhầm:_
    - **`贝` (Bối, 4 nét) vs `见` (bộ Kiến, 4 nét):** Cả hai gần giống nhau trong Giản thể, nhưng `贝` kết thúc bằng **phẩy dài và chấm dài** (`购`, `财`); `见` (nghĩa "nhìn thấy") kết thúc bằng **sổ-cong-móc `乚`** (`观`, `觉`, `视`).
    - **`贝` (Bối, 4 nét) vs `页` (bộ Hiệt, 6 nét):** `页` có thêm nét ngang và phẩy ngắn phía trên `贝`, nghĩa là "đầu / trang giấy" (`顶`, `领`, `题`, `顺`).
    - **`贝 / 貝` vs `金 / 钅`:** `金 / 钅` thiên về **kim loại / tiền kim loại** (`钱`, `银`); `贝 / 貝` thiên về **giá trị, tài sản, giao dịch kinh tế**.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Tài sản, giá trị, phẩm chất & giàu nghèo

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                     | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                              |
| ------- | ------ | -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 财 / 財 | cái    | tài      | `才` (thanh phù _cái_)                                    | **Hình thanh kiêm nghĩa:** Tiền bối là nguồn gốc tạo nên của cải. Nghĩa: tiền của, tài sản, tài chính. Từ ghép: `财产` (cáichǎn · tài sản), `财务` (cáiwù · tài vụ/tài chính), `发财` (fācái · phát tài).                                   |
| 货 / 貨 | huò    | hóa      | `化` (biến đổi/trao đổi, thanh phù _huà_ -> _huò_)        | **Hình thanh kiêm nghĩa:** Vật phẩm đem ra trao đổi ngang giá với tiền tệ `贝/貝`. Nghĩa: hàng hóa, tiền tệ. Từ ghép: `货物` (huòwù · hàng hóa), `百货` (bǎihuò · bách hóa), `退货` (tuìhuò · trả hàng).                                    |
| 资 / 資 | zī     | tư       | `次` (thanh phù _cì_ -> _zī_)                             | **Hình thanh kiêm nghĩa:** Tiền bạc tích lũy để cung cấp làm vốn liếng. Nghĩa: vốn, tài nguyên, tư liệu, tư cách. Từ ghép: `资源` (zīyuán · tài nguyên), `投资` (tóuzī · đầu tư), `工资` (gōngzī · tiền lương), `资料` (zīliào · tài liệu). |
| 贵 / 貴 | guì    | quý      | Phần trên biến thể từ chữ `臾` (hai tay bưng giỏ của cải) | **Hội ý:** Hai tay trân trọng nâng niu tiền bối/của cải `贝/貝`. Nghĩa: đắt đỏ, quý giá, tôn quý. Từ ghép: `昂贵` (ángguì · đắt đỏ), `宝贵` (bǎoguì · quý báu), `贵姓` (guìxìng · quý danh).                                                |
| 贫 / 貧 | pín    | bần      | `分` (chia tách)                                          | **Hội ý kiêm thanh phù:** Tiền của `贝/貝` bị chia tách `分` nhỏ hết đi. Nghĩa: nghèo đói, thiếu thốn. Từ ghép: `贫穷` (pínqióng · nghèo khổ), `贫富` (pínfù · giàu nghèo), `扶贫` (fúpín · xóa đói giảm nghèo).                            |
| 质 / 質 | zhì    | chất     | Giản thể: `斤` (lược tự); Phồn thể: `斦` (hai cái rìu)    | **Hội ý:** Dùng tài sản giá trị làm vật thế chấp/đối chứng bản chất thực. Nghĩa: chất lượng, bản chất, vật chất. Từ ghép: `质量` (zhìliàng · chất lượng), `素质` (sùzhì · tố chất), `本质` (běnzhì · bản chất).                             |
| 贪 / 貪 | tān    | tham     | `今` (thanh phù _jīn_ -> _tān_)                           | **Hình thanh kiêm nghĩa:** Lòng luôn ôm ấp ham muốn tiền tài. Nghĩa: tham lam, tham nhũng. Từ ghép: `贪心` (tānxīn · tham lam), `贪污` (tānwū · tham ô).                                                                                    |

### Nhóm B: Mua bán, chi tiêu, vay nợ & kế toán

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                                | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                               |
| ------- | ------ | -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 购 / 購 | gòu    | cấu      | Giản thể: `勾` (_gōu_, thanh phù); Phồn thể: `冓` (_gòu_, thanh phù) | **Hình thanh kiêm nghĩa:** Dùng tiền `贝/貝` đi thu gom hàng hóa về. Nghĩa: mua sắm, thu mua. Từ ghép: `购买` (gòumǎi · mua sắm), `网购` (wǎnggòu · mua hàng online), `采购` (cǎigòu · thu mua).             |
| 费 / 費 | fèi    | phí      | `弗` (tán mất/không, thanh phù _fú_ -> _fèi_)                        | **Hình thanh kiêm nghĩa:** Tiền bạc `贝/貝` tiêu tán ra ngoài. Nghĩa: chi phí, hao tốn, tiêu phí. Từ ghép: `花费` (huāfèi · tốn kém), `费用` (fèiyòng · chi phí), `免费` (miǎnfèi · miễn phí).               |
| 贸 / 貿 | mào    | mậu      | `卯` (mở cửa trao đổi, thanh phù _mǎo_ -> _mào_)                     | **Hình thanh kiêm nghĩa:** Mở cửa trao đổi hàng hóa lấy tiền bạc. Nghĩa: buôn bán, thương mại. Từ ghép: `贸易` (màoyì · thương mại), `外贸` (wàimào · ngoại thương).                                         |
| 赚 / 賺 | zhuàn  | trám     | `兼` (gom thêm, thanh phù _jiān_ -> _zhuàn_)                         | **Hình thanh kiêm nghĩa:** Giao dịch bán buôn thu gộp thêm tiền lãi. Nghĩa: kiếm tiền, sinh lời. Từ ghép: `赚钱` (zhuànqián · kiếm tiền), `赚取` (zhuànqǔ · kiếm được).                                      |
| 赔 / 賠 | péi    | bồi      | `咅` (thanh phù _pǒu_ -> _péi_)                                      | **Hình thanh kiêm nghĩa:** Bỏ tiền bù đắp phần thiệt hại cho người khác. Nghĩa: đền bù, chịu lỗ. Từ ghép: `赔偿` (péicháng · bồi thường), `赔钱` (péiqián · lỗ vốn).                                         |
| 贷 / 貸 | dài    | thải     | `代` (thay thế/chuyển giao, thanh phù _dài_)                         | **Hình thanh kiêm nghĩa:** Giao tạm tiền của cho người khác dùng thay thế. Nghĩa: cho vay, vay nợ. Từ ghép: `贷款` (dàikuǎn · cho vay/khoản vay), `房贷` (fángdài · vay mua nhà).                            |
| 账 / 賬 | zhàng  | trướng   | `长 / 長` (thanh phù _cháng_ -> _zhàng_)                             | **Hình thanh kiêm nghĩa:** Sổ ghi chép dài các khoản thu chi tiền bạc. Nghĩa: sổ sách, tài khoản, món nợ. Từ ghép: `记账` (jìzhàng · ghi sổ), `账号` (zhànghào · tài khoản), `结账` (jiézhàng · thanh toán). |

### Nhóm C: Trách nhiệm, quà tặng, khen thưởng & đánh giá

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                            | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                |
| ------- | ------ | -------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 责 / 責 | zé     | trách    | `龶` (biến thể từ `朿` gai nhọn, thanh phù _cì_ -> _zé_)         | **Hình thanh kiêm nghĩa:** Đòi hỏi nghiêm khắc nghĩa vụ/nợ nần tiền bạc. Nghĩa: trách nhiệm, trách móc, tra hỏi. Từ ghép: `责任` (zérèn · trách nhiệm), `负责` (fùzé · phụ trách).                                            |
| 负 / 負 | fù     | phụ      | `⺈` (biến thể từ `人` người)                                    | **Hội ý:** Người mang vác gánh nặng tài sản `贝/貝` trên lưng. Nghĩa: gánh vác, mang theo, số âm, thua cuộc, phụ bạc. Từ ghép: `负责` (fùzé · chịu trách nhiệm), `负担` (fùdān · gánh nặng), `胜负` (shèngfù · thắng thua).   |
| 贴 / 貼 | tiē    | thiếp    | `占` (thanh phù _zhān_ -> _tiē_)                                 | **Hình thanh kiêm nghĩa:** Đem tiền vật áp vào thế chấp hoặc bù đắp -> dán vào, trợ cấp, ân cần. Từ ghép: `贴纸` (tiēzhǐ · nhãn dán/sticker), `补贴` (bǔtiē · trợ cấp), `体贴` (tǐtiē · chu đáo/ân cần).                      |
| 赠 / 贈 | zèng   | tặng     | `曾` (tăng thêm, thanh phù _céng_ -> _zèng_)                     | **Hình thanh kiêm nghĩa:** Trao thêm tiền của, quà cáp cho người khác. Nghĩa: biếu, tặng. Từ ghép: `赠送` (zèngsòng · biếu tặng), `赠品` (zèngpǐn · quà tặng kèm).                                                            |
| 赏 / 賞 | shǎng  | thưởng   | `尚` (cao quý, thanh phù _shàng_ -> _shǎng_)                     | **Hình thanh kiêm nghĩa:** Ban phát tiền thưởng cho người lập công. Nghĩa: ban thưởng, thưởng thức/ngưỡng mộ. Từ ghép: `欣赏` (xīnshǎng · thưởng thức/tán thưởng), `奖赏` (jiǎngshǎng · khen thưởng).                         |
| 赞 / 贊 | zàn    | tán      | `兟` (`先 + 先` — hai người tiến lên, thanh phù _shēn_ -> _zàn_) | **Hình thanh kiêm nghĩa:** Hai người cùng mang lễ vật tiền bối tiến lên giúp đỡ/tôn vinh. Nghĩa: khen ngợi, tài trợ, bấm "thích". Từ ghép: `赞美` (zànměi · ca ngợi), `点赞` (diǎnzàn · bấm like), `赞助` (zànzhù · tài trợ). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-040`):** `财 / 財`, `货 / 貨`, `贵 / 貴`, `费 / 費` (ví dụ tiêu biểu của `貝`), cùng `金 / 钅` và `钱` (bộ `金`).
- **Chữ có liên hệ với `貝 / 贝` nhưng xếp ở bộ khác hoặc ẩn mất ở Giản thể:**
  - `买 / 買` (_mǎi_ · mãi · mua: `买东西`) & `卖 / 賣` (_mài_ · mại · bán: `外卖`): Phồn thể `買` (`罒 + 貝`) và `賣` (`士 + 罒 + 貝`) đều thuộc **bộ `貝`** (#154); Giản thể rút gọn `貝` thành `买/头`, nên tự điển giản thể xếp theo **bộ `乛`** hoặc **bộ `十`**.
  - `宝 / 寶` (_bǎo_ · bảo · báu vật), `实 / 實` (_shí_ · thật · đầy đủ/thực tế) & `宾 / 賓` (_bīn_ · tân · khách quý): Phồn thể đều chứa `貝` bên trong (cất tài sản trong nhà hoặc lễ vật tiếp khách), nhưng cùng xếp **bộ `宀`** (Bộ 14).
  - `员 / 員` (_yuán_ · viên · thành viên, nhân viên: `员工`, `会员`): Gồm `口 + 贝` (nguyên nghĩa hình miệng tròn trên chiếc đỉnh đồng), Khang Hy xếp **bộ `口`** (#30).
  - `败 / 敗` (_bài_ · bại · thua, hỏng: `失败`): Gồm `贝 + 攵` (dùng gậy đập vỡ tài sản), xếp **bộ `攴 / 攵`** (#66).
  - `锁 / 鎖` (_suǒ_ · tỏa · cái khóa): Giản thể có `贝` ở phần bên phải (`钅 + 小 + 贝`), nhưng xếp **bộ `金 / 钅`** (Bộ 19).
  - `见` (bộ Kiến — nhìn thấy) & `页` (bộ Hiệt — đầu/trang): Hai bộ thủ độc lập rất dễ nhầm nét với `贝`.

---

## Bộ 22: 車 (Xa)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:** `radical-030` (`radical_index`: `30`, `7` nét, `name_vi`: `bộ Xa`).
  - _Ghi chú dòng rỗng:_ DB có dòng rỗng trùng ở `radical-191` (`radical_index`: `191`, `radical`: `車 / 车`, `name_vi`: `null`, `strokes`: `null`).
- **Hình thái & Biến thể (`variants`):**
  - `車` (dạng phồn thể / đầy đủ, 7 nét — đứng độc lập, bên **trái**, **giữa**, hoặc **dưới**).
  - `车` (dạng giản thể, 4 nét — đứng độc lập, bên **trái**, hoặc **dưới**; khi nằm bên trái chữ, nét ngang đáy biến thành nét hất `㇀`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - _Nguồn gốc / Lục thư (`history`):_ Tượng hình **xe có bánh, trục xe và thùng xe** (xe kéo / chiến xa thời cổ nhìn từ trên xuống; Khang Hy bộ #159).
  - _Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):_ **Xe cộ, phương tiện giao thông, bộ phận bánh–trục xe, đường ray** (`车`, `轮`, `轴`, `轨`, `辆`); mở rộng sang **vận chuyển, chuyển động xoay vòng, truyền tải dữ liệu, trọng tải nặng–nhẹ và sự sắp xếp hàng ngũ** (`转`, `载`, `输`, `轻`, `较`, `辑`, `辈`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - _Nhận diện nhanh:_ Có `車 / 车` thường liên quan đến **xe cộ, bánh xe, vận chuyển, chuyển động quay, truyền tải hoặc giao thông**.
  - _Phân biệt dễ nhầm:_
    - **`车` (4 nét) vs `东` (5 nét):** `车` là giản thể của `車`; `东` (giản thể của `東` = phương Đông) có nét sổ-móc ở giữa và hai dấu chấm hai bên (`东`, `陈`), **không phải bộ Xe**.
    - **`车 / 車` vs `辶` (bộ Sước) & `舟` (bộ Chu):** `车` gắn với **phương tiện bánh xe / vòng quay / tải trọng**; `辶` chỉ **di chuyển nói chung** trên đường (`运`, `连`); `舟` chỉ **thuyền bè trên mặt nước** (`船`, `航`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm A: Xe cộ, bộ phận xe & đường chạy

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                             | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                            |
| ------- | ------ | -------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 车 / 車 | chē    | xa       | — (chữ độc lập)                                   | **Tượng hình:** Xe hai bánh gắn trục nhìn từ trên xuống. Nghĩa: xe cộ, máy móc dùng bánh quay. Từ ghép: `汽车` (qìchē · ô tô), `火车` (huǒchē · tàu hỏa), `自行车` (zìxíngchē · xe đạp).                                                  |
| 轮 / 輪 | lún    | luân     | `仑 / 侖` (thanh phù _lún_, ý tròn đều có thứ tự) | **Hình thanh kiêm nghĩa:** Bánh xe tròn quay đều theo trật tự. Nghĩa: bánh xe, luân phiên, lượt/vòng, tàu thủy. Từ ghép: `车轮` (chēlún · bánh xe), `轮流` (lúnliú · thay phiên), `第一轮` (dì-yī lún · vòng một).                        |
| 轴 / 軸 | zhóu   | trục     | `由` (thanh phù _yóu_ -> _zhóu_)                  | **Hình thanh kiêm nghĩa:** Thanh trụ xuyên qua tâm để giữ và xoay bánh xe. Nghĩa: trục xe, trục tọa độ, cuộn trục. Từ ghép: `车轴` (chēzhóu · trục xe), `坐标轴` (zuòbiāozhóu · trục tọa độ), `中轴线` (zhōngzhóuxiàn · đường trục giữa). |
| 轨 / 軌 | guǐ    | quỹ      | `九` (thanh phù _jiǔ_ -> _guǐ_)                   | **Hình thanh kiêm nghĩa:** Khoảng cách cố định và vết hằn hai bánh xe chạy. Nghĩa: đường ray, quỹ đạo, quy củ. Từ ghép: `轨道` (guǐdào · quỹ đạo/đường ray), `铁轨` (tiěguǐ · đường sắt), `接轨` (jiēguǐ · hội nhập/nối ray).             |
| 辆 / 輛 | liàng  | lượng    | `两 / 兩` (hai, thanh phù _liǎng_ -> _liàng_)     | **Hình thanh kiêm nghĩa:** Một cỗ xe có hai bánh đi cặp. Nghĩa: lượng từ chuyên đếm xe cộ. Từ ghép: `一辆车` (yí liàng chē · một chiếc xe), `车辆` (chēliàng · xe cộ).                                                                    |
| 轿 / 轎 | jiào   | kiệu     | `乔 / 喬` (thanh phù _qiáo_ -> _jiào_)            | **Hình thanh kiêm nghĩa:** Kiệu có mui che; hiện đại chỉ xe ô tô con có khoang kín (sedan). Từ ghép: `轿车` (jiàochē · xe hơi con), `花轿` (huājiào · kiệu hoa).                                                                          |

### Nhóm B: Vận chuyển, xoay chuyển & truyền tải

| Chữ Hán | Pinyin        | Hán Việt  | Thiên bàng đứng chung                          | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                      |
| ------- | ------------- | --------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 转 / 轉 | zhuǎn / zhuàn | chuyển    | `专 / 專` (thanh phù _zhuān_ -> _zhuǎn/zhuàn_) | **Hình thanh kiêm nghĩa:** Bánh xe quay vòng đổi hướng đi. Nghĩa: chuyển hướng, chuyển tiếp (`zhuǎn`); xoay tròn (`zhuàn`). Từ ghép: `转弯` (zhuǎnwān · rẽ), `转发` (zhuǎnfā · chuyển tiếp/share), `转换` (zhuǎnhuàn · chuyển đổi). |
| 载 / 載 | zài / zǎi     | tải       | `𢦏` (thanh phù _zāi_ -> _zài_)                | **Hình thanh kiêm nghĩa:** Chất hàng hóa lên xe chuyên chở đi. Nghĩa: chở, tải dữ liệu (`zài`); ghi chép, năm (`zǎi`). Từ ghép: `下载` (xiàzài · tải xuống/download), `加载` (jiāzài · tải/loading), `载客` (zàikè · chở khách).    |
| 输 / 輸 | shū           | thâu / du | `俞` (thanh phù _yú_ -> _shū_)                 | **Hình thanh kiêm nghĩa:** Dùng xe chở vật tư đi giao nộp -> vận chuyển, truyền dữ liệu, thua cuộc. Từ ghép: `输入` (shūrù · nhập liệu/input), `输出` (shūchū · xuất dữ liệu/output), `传输` (chuánshū · truyền tải).               |
| 辅 / 輔 | fǔ            | phụ       | `甫` (thanh phù _fǔ_)                          | **Hình thanh kiêm nghĩa:** Thanh gỗ kẹp hai bên má bánh xe giúp xe chạy vững. Nghĩa: hỗ trợ, giúp đỡ, phụ trợ. Từ ghép: `辅导` (fǔdǎo · hướng dẫn/phụ đạo), `辅助` (fǔzhù · phụ trợ).                                               |
| 辑 / 輯 | jí            | tập       | `咠` (thanh phù _qī_ -> _jí_)                  | **Hình thanh kiêm nghĩa:** Lắp ghép các bộ phận rời thành cỗ xe hoàn chỉnh. Nghĩa: thu thập, biên tập, cắt dựng, logic. Từ ghép: `编辑` (biānjí · biên tập), `逻辑` (luóji · logic), `剪辑` (jiǎnjí · dựng/edit video).             |
| 轰 / 轟 | hōng          | oanh      | Ba chữ `车 / 車` xếp chồng                     | **Hội ý:** Tiếng nhiều cỗ xe cùng lao rầm rầm tạo âm vang lớn. Nghĩa: tiếng nổ ầm, ném bom, gây chấn động. Từ ghép: `轰动` (hōngdòng · gây chấn động), `炮轰` (pàohōng · pháo kích/công kích).                                      |

### Nhóm C: Tính chất, so sánh, quản lý & hàng ngũ mở rộng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung                                                 | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                    |
| ------- | ------ | -------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 轻 / 輕 | qīng   | khinh    | Giản thể: `𢀖` (lược tự); Phồn thể: `巠` (thanh phù _jīng_ -> _qīng_) | **Hình thanh kiêm nghĩa:** Xe nhỏ gọn nhẹ chạy lướt nhanh. Nghĩa: nhẹ, nhẹ nhàng, trẻ tuổi, xem nhẹ. Từ ghép: `轻松` (qīngsōng · nhẹ nhàng/thoải mái), `年轻` (niánqīng · trẻ tuổi), `轻重` (qīngzhòng · nặng nhẹ).                                               |
| 软 / 軟 | ruǎn   | nhuyễn   | `欠` (yếu ớt/há miệng)                                                | **Hội ý:** Bánh xe xưa bọc cỏ lau cho êm dịu; nay dùng ghép đối lập với cứng ("phần mềm"). Nghĩa: mềm dẻo, yếu ớt, phần mềm. Từ ghép: `软件` (ruǎnjiàn · phần mềm/software), `微软` (Wēiruǎn · Microsoft), `柔软` (róuruǎn · mềm mại).                            |
| 较 / 較 | jiào   | giảo     | `交` (giao nhau, thanh phù _jiāo_ -> _jiào_)                          | **Hình thanh kiêm nghĩa:** Thanh gỗ đặt ngang trên hai thành xe cân bằng nhau để đối chiếu. Nghĩa: so sánh, tương đối, khá là. Từ ghép: `比较` (bǐjiào · so sánh/khá là), `较好` (jiàohǎo · khá tốt).                                                             |
| 辖 / 轄 | xiá    | hạt      | `害` (thanh phù _hài_ -> _xiá_)                                       | **Hình thanh kiêm nghĩa:** Chốt sắt cài đầu trục bánh xe giữ bánh không tuột -> nắm then chốt cai quản. Nghĩa: quản lý, cai quản, phạm vi quản hạt. Từ ghép: `管辖` (guǎnxiá · cai quản), `直辖市` (zhíxiáshì · thành phố trực thuộc trung ương).                 |
| 辈 / 輩 | bèi    | bối      | `非` (thanh phù _fēi_ -> _bèi_, ý xếp thành hai hàng)                 | **Hình thanh kiêm nghĩa:** Đoàn chiến xa dàn thành hàng ngũ lớp lang -> hạng người, thế hệ, đời người. Từ ghép: `长辈` (zhǎngbèi · bậc trưởng bối), `一辈子` (yíbèizi · cả đời).                                                                                  |
| 军 / 軍 | jūn    | quân     | `冖` (bao bọc xung quanh)                                             | **Hội ý:** Chiến xa `車` vây vòng `冖` bảo vệ doanh trại quân đội (Khang Hy xếp bộ `車` #159; Giản thể rút thành `冖 + 车` nên tự điển giản thể thường tra bộ `冖`). Nghĩa: quân đội, quân sự. Từ ghép: `军队` (jūnduì · quân đội), `冠军` (guànjūn · quán quân). |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- **Từ DB (`radical-030`):** `转 / 轉`, `轮 / 輪`, `辆 / 輛` (ví dụ tiêu biểu của `車`), cùng `辵 / 辶` và `舟` (hai bộ riêng cùng trường nghĩa giao thông/di chuyển).
- **Chữ chứa `车 / 車` ở vị trí phụ hoặc bên trong nhưng xếp ở bộ khác:**
  - `连 / 連` (_lián_ · liên · nối liền, liên tục: `联系`, `连接`): Gồm `车/車 + 辶` (đoàn xe nối đuôi nhau đi trên đường), xếp **bộ `辶` (`辵`)**.
  - `运 / 運` (_yùn_ · vận · vận chuyển, vận động: `运动`, `幸运`): Phồn thể `運` gồm `軍` (có `車`) + `辶`, xếp **bộ `辶` (`辵`)**.
  - `库 / 庫` (_kù_ · khố · kho chứa: `仓库`, `数据库`): Gồm `广 + 车/車` (nhà có mái che cất xe cộ), xếp **bộ `广`** (Bộ 15).
  - `阵 / 陣` (_zhèn_ · trận · trận địa, một đợt: `一阵风`, `矩阵`): Gồm `阝 + 车/車` (gò đất và chiến xa dàn trận), xếp **bộ `阝` (`阜`)**.
  - `辉 / 輝` (_huī_ · huy · rực rỡ: `辉煌`): Phồn thể `輝` (`光 + 軍`) trong Khang Hy xếp bộ `車`; Giản thể `辉` (`光 + 军`) thường tra theo **bộ `光` / `小`**.
  - `暂 / 暫` (_zàn_ · tạm · tạm thời: `暂时`) & `渐 / 漸` (_jiàn_ · tiệm · dần dần: `逐渐`): Đều mang thành phần `斩 / 斬` (`车/車 + 斤`, chặt gãy), xếp lần lượt ở **bộ `日`** và **bộ `氵` (`水`)**.
