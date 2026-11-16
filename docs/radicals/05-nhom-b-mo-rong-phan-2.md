# Nhóm B (Mở rộng — Phần 2): 10 Bộ Thủ (Bộ 43 → Bộ 52)

Tài liệu biên soạn chi tiết **10 bộ thủ mở rộng phần 2** (từ **Bộ 43** đến **Bộ 52**) theo cấu trúc ánh xạ vào bảng `public.hanzihome_radicals` trong HanziHome (xem quy ước schema tại [README.md](./README.md)).

- **Đã có trong DB (`hanzihome_radicals`):** **7 / 10** bộ (`44. 又`, `45. 囗`, `46. 皿`, `48. 衣`, `49. 馬`, `51. 田`, `52. 食`).
- **Chưa có trong DB (`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`):** **3 / 10** bộ (`43. 彳`, `47. 冫`, `50. 玉`).
- **Dòng trùng / rỗng cần lưu ý khi dọn DB:** `radical-146` (#146 — `皿`), `radical-177` (#177 — `衣`), `radical-216` (#216 — `食 / 饣`).

| STT | Bộ thủ | Hán-Việt | Trạng thái DB        | DB ID chính     | `radical_index` | Số nét | Dòng trùng / rỗng          | Số chữ biên soạn |
| :-: | :----: | -------- | -------------------- | --------------- | :-------------: | :----: | -------------------------- | :--------------: |
| 43  |   彳   | Xích     | **CHƯA CÓ TRONG DB** | Đề xuất bổ sung | Đề xuất bổ sung |   3    | —                          |        19        |
| 44  |   又   | Hựu      | Đã có                | `radical-036`   |       36        |   2    | —                          |        18        |
| 45  |   囗   | Vi       | Đã có                | `radical-053`   |       53        |   3    | —                          |        16        |
| 46  |   皿   | Mãnh     | Đã có                | `radical-041`   |       41        |   5    | `radical-146` (#146, rỗng) |        15        |
| 47  |   冫   | Băng     | **CHƯA CÓ TRONG DB** | Đề xuất bổ sung | Đề xuất bổ sung |   2    | —                          |        17        |
| 48  |   衣   | Y        | Đã có                | `radical-017`   |       17        |   6    | `radical-177` (#177, rỗng) |        18        |
| 49  |   馬   | Mã       | Đã có                | `radical-029`   |       29        |   10   | —                          |        18        |
| 50  |   玉   | Ngọc     | **CHƯA CÓ TRONG DB** | Đề xuất bổ sung | Đề xuất bổ sung |   5    | —                          |        18        |
| 51  |   田   | Điền     | Đã có                | `radical-140`   |       140       |   5    | —                          |        16        |
| 52  |   食   | Thực     | Đã có                | `radical-024`   |       24        |   9    | `radical-216` (#216, rỗng) |        19        |

---

## Bộ 43: 彳 (Xích)

> **`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`** — Bộ `彳` hiện chưa có dòng nào trong `hanzihome_radicals` (`status: MISSING`).

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Trạng thái DB:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`
- **DB ID & Thứ tự đề xuất:**
  - `id`: chưa gán — đề xuất cấp mới theo thứ tự trống / sau `MAX(radical_index)` trong 244 dòng hiện có (ví dụ `radical-245`, cần đối chiếu toàn bộ bảng trước khi insert để tránh đụng index).
  - `radical_index`: đề xuất `245` (tạm đặt, không trùng index 1–244 hiện có).
  - `radical`: `彳`
  - `name_vi`: `bộ Xích`
  - `strokes`: `3` nét
  - Ghi chú dòng trùng/rỗng: không có.
- **Hình thái & Biến thể (`variants` — đề xuất):**
  - `彳` — dạng chính, còn gọi là _song nhân bàng_ (双人旁), hầu như luôn đứng ở bên trái chữ.
  - _(Ghi chú cấu tạo liên quan)_: Trong chữ gốc `行` (hành), `彳` đứng bên trái đối xứng với `亍` ở bên phải tạo thành hình ngã tư đường; một số chữ giữ nguyên khung tách `彳 ... 亍` ôm thành phần ở giữa (như `街`, `衡`).
- **Ý nghĩa cốt lõi (`core_meaning` — đề xuất):**
  - **Nguồn gốc / Lục thư (`history`):** Tượng hình nửa bên trái của ngã tư đường (chữ `行` gồm `彳` bên trái + `亍` bên phải); nghĩa gốc là bước chân trái bước ngắn, lối nhỏ, đi lại trên đường.
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):** Bước đi, đi lại, đường phố, tuân theo trình tự/luật lệ, chờ đợi, hành vi và phẩm hạnh của con người trên đường đời. Ở một số chữ tần suất cực cao (`很`, `得`), nghĩa gốc "đi/bướng" đã hư hóa thành phó từ chỉ mức độ hoặc trợ từ kết cấu ngữ pháp.
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — đề xuất):**
  - **Nhận diện (`recognition`):** Có `彳` (song nhân bàng) ở bên trái thường liên quan bước đi, đường xá, đi lại, theo sau, chờ đợi, luật lệ hoặc hành vi con người.
  - **Phân biệt (`distinguish`) — Đặc biệt làm rõ `彳` vs `亻` vs `辶`:**
    1. **`彳` (bộ Xích, 3 nét: 2 phẩy + 1 sổ — _song nhân bàng_) vs `亻` (bộ Nhân đứng, 2 nét: 1 phẩy + 1 sổ — _đơn nhân bàng_):** `彳` có **hai nét phẩy** xếp chồng trên nét sổ, mang trường nghĩa _bước đi, đường đi, qua lại, hành vi, đợi chờ_ (như `往, 待, 律, 街, 很`); trong khi `亻` chỉ có **một nét phẩy** trên nét sổ, là biến thể của `人`, mang trường nghĩa _con người, thân phận, hành động của người_ (như `你, 他, 们, 做, 住`).
    2. **`彳` (đứng bên trái) vs `辶` (bộ Sước/Xước, ôm trái và đáy dưới):** Cả hai đều liên quan di chuyển, nhưng `彳` đứng **gọn ở bên trái** (gốc là nửa ngã tư / bước chân ngắn, nghiêng về qua lại, hành vi, chờ đợi, tuần tự), còn `辶` **ôm cạnh trái và lót ngang dưới đáy** như chiếc thuyền (gốc gồm `彳` + `止` bước đi và dừng, nghiêng về _đi đến, quãng đường, quá trình di chuyển_ như `这, 过, 进, 远, 送`).
    3. **Khung tách `彳 ... 亍`:** Trong `行`, `街`, `衡`, phần `彳` nằm trái và `亍` nằm phải chính là một khung hình ngã tư tách đôi; từ điển Khang Hy xếp các chữ này vào bộ `行` (bộ 144), còn từ điển giản thể hiện đại thường quy chung vào bộ `彳` để dễ tra.

<details>
<summary>Đề xuất bản ghi JSON chuẩn schema <code>hanzihome_radicals</code> cho Bộ 43: 彳</summary>

```json
{
 "id": "radical-245",
 "radical_index": 245,
 "radical": "彳",
 "name_vi": "bộ Xích",
 "strokes": 3,
 "core_meaning": {
  "history": "hình nửa bên trái của ngã tư đường (chữ 行 gồm 彳 bên trái và 亍 bên phải); nghĩa gốc là bước chân trái bước ngắn, lối nhỏ.",
  "modern": "bước đi, đi lại, đường phố, chờ đợi, tuân theo quy tắc, hành vi; trong vài chữ tần suất rất cao (很, 得) đã chuyển thành phó từ/trợ từ ngữ pháp."
 },
 "variants": [
  {
   "form": "彳",
   "note": "song nhân bàng, thường đứng bên trái chữ"
  }
 ],
 "recognition": "Có 彳 (song nhân bàng) bên trái thường liên quan bước đi, đường đi, qua lại, theo sau, đợi chờ, luật lệ hoặc hành vi.",
 "distinguish": [
  "彳 (3 nét: 2 phẩy + 1 sổ, song nhân bàng) khác 亻 (2 nét: 1 phẩy + 1 sổ, đơn nhân bàng): 彳 chỉ bước đi/đường/hành vi, còn 亻 chỉ con người.",
  "彳 đứng gọn bên trái chữ, khác 辶 (Sước/Xước) ôm cả bên trái lẫn lót ngang dưới đáy chữ (这, 过, 远).",
  "彳 ghép với 亍 thành 行 (ngã tư đường); trong 街, 衡 hai phần 彳 và 亍 ôm lấy thành phần giữa."
 ],
 "groups": [
  {
   "name": "Bước đi, đường xá & di chuyển",
   "chars": ["行", "往", "径", "街", "徒", "征", "循", "徐"]
  },
  {
   "name": "Chờ đợi, quy tắc, hành vi & phẩm hạnh",
   "chars": ["待", "律", "彼", "役", "德", "彻", "御"]
  },
  {
   "name": "Từ tần suất cao chuyển nghĩa ngữ pháp & tinh vi",
   "chars": ["很", "得", "微", "徽"]
  }
 ],
 "related_components": [
  {
   "form": "亍",
   "note": "chù · Xúc · nửa bên phải của ngã tư đường trong 行 (彳 + 亍), gặp trong 街, 衡."
  },
  {
   "form": "衡",
   "note": "héng · Hành · 彳 + 鱼/角/大 + 亍 · Khang Hy xếp bộ 行 (144), hiện đại hay tra bộ 彳; nghĩa: cân bằng, đo lường (平衡, 衡量)."
  },
  {
   "form": "复 / 復",
   "note": "fù · Phục · phồn thể 復 có 彳 + 复 (đi trở lại, khôi phục); giản thể gộp 復 và 複 thành 复 (bộ 夂/丿) làm mất 彳."
  },
  {
   "form": "彷",
   "note": "páng / fǎng · Bàng / Phảng · 彳 + 方 · đi quanh quẩn, na ná (彷徨 bàng hoàng, 仿佛 phảng phất)."
  },
  {
   "form": "徘 / 徊",
   "note": "páihuái · Bồi hồi · 彳 + 非 / 回 · đi đi lại lại, do dự không nỡ rời."
  },
  {
   "form": "亻",
   "note": "nhân đứng (đơn nhân bàng, 2 nét) · biến thể của 人, dễ nhầm với 彳 nhưng chỉ người."
  },
  {
   "form": "辶",
   "note": "bộ Sước/Xước · ôm trái và đáy chữ, cùng trường nghĩa di chuyển nhưng là bộ riêng."
  }
 ]
}
```

</details>

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Bước đi, đường xá & di chuyển

| Chữ Hán | Pinyin      | Hán Việt    | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                                                             |
| ------- | ----------- | ----------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 行      | xíng / háng | Hành / Hàng | 亍 (xúc)              | `彳` (trái) + `亍` (phải) tượng hình ngã tư đường cái; nghĩa gốc là đi lại, thi hành, được/ổn (_xíng_: 行走 đi bộ, 行动 hành động, 不行 không được); mở rộng thành hàng lối, ngành nghề (_háng_: 银行 _yínháng_ ngân hàng, 行业 ngành nghề). _(Khang Hy xếp là bộ 行 số 144; từ điển giản thể tra bộ 彳.)_ |
| 往      | wǎng        | Vãng        | 主 (chủ)              | `彳` (bước đi) + `主` (chữ cổ là `㞷/王`, thanh phù); nghĩa gốc là bước chân đi tới -> đi về hướng, qua lại, quá khứ (来往 qua lại, 往常 thường lệ, 往往 thường hay).                                                                                                                                      |
| 径      | jìng        | Kính        | 圣 (thánh)            | Phồn thể `徑`: `彳` (đường đi) + `圣` (giản thể thay `巠`, thanh phù); nghĩa: lối mòn nhỏ, đường tắt, đường kính (路径 lộ trình, 半径 bán kính, 直径 đường kính).                                                                                                                                          |
| 街      | jiē         | Nhai        | 圭 (khuê) + 亍        | Khung `行` (`彳` trái + `亍` phải, đường cái) bọc `圭` (thanh phù _guī_ -> _jiē_) ở giữa; nghĩa: đường phố, khu phố (街道 đường phố, 上街 ra phố, 逛街 dạo phố). _(Khang Hy xếp bộ 行, hiện đại tra bộ 彳.)_                                                                                               |
| 徒      | tú          | Đồ          | 土 (thổ) + 龰         | `彳` (đi đường) + `土` trên `龰` (chân/bước); hội ý người đi bộ trên đường đất không đi xe -> đi bộ, đồ đệ đi theo thầy, kẻ xấu (徒步 đi bộ, 徒弟 học trò, 歹徒 kẻ côn đồ).                                                                                                                                |
| 征      | zhēng       | Chinh       | 正 (chính)            | `彳` (đi đường) + `正` (thanh phù _zhèng_ kiêm ý đi ngay ngắn); nghĩa: đi xa đánh dẹp, trưng thu, dấu hiệu (长征 Trường Chinh, 征求 trưng cầu, 特征 đặc trưng).                                                                                                                                            |
| 循      | xún         | Tuần        | 盾 (thuẫn)            | `彳` (bước đi) + `盾` (mộc/thuẫn, thanh phù _dùn_ -> _xún_); nghĩa: đi men theo lối sẵn, xoay vòng, tuân theo (循环 tuần hoàn, 遵循 tuân theo, 循序渐进 tuần tự tiến lên).                                                                                                                                 |
| 徐      | xú          | Từ          | 余 (dư)               | `彳` (bước đi) + `余` (thanh phù _yú_ -> _xú_); nghĩa gốc là đi chậm rãi khoan thai -> từ tốn, thong thả, họ Từ (徐徐 từ từ, 徐步 bước khoan thai, 清风徐来 gió mát thoảng nhẹ).                                                                                                                           |

### Nhóm 2: Chờ đợi, quy tắc, hành vi & phẩm hạnh

| Chữ Hán | Pinyin    | Hán Việt  | Thiên bàng đứng chung    | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                |
| ------- | --------- | --------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 待      | dài / dāi | Đãi / Đợi | 寺 (tự)                  | `彳` (dừng bước trên đường) + `寺` (thanh phù _sì_ -> _dài_); nghĩa: chờ đợi, đối đãi, tiếp đãi (_dài_: 等待 chờ đợi, 对待 đối xử, 招待 chiêu đãi); khẩu ngữ đọc _dāi_ nghĩa là ở lại một lúc (待会儿 lát nữa, 待在家 ở nhà). |
| 律      | lǜ        | Luật      | 聿 (duật)                | `彳` (hành vi/đi lại) + `聿` (cây bút/chuẩn mực); nghĩa gốc là phép đo chỉnh âm luật bằng ống sáo -> quy luật, pháp luật, kỷ luật (法律 pháp luật, 规律 quy luật, 律师 luật sư).                                              |
| 彼      | bǐ        | Bỉ        | 皮 (bì)                  | `彳` + `皮` (thanh phù _pí_ -> _bǐ_); nghĩa gốc là đi tách ra xa -> bên kia, người ấy, đối phương (彼此 lẫn nhau, 彼岸 bờ bên kia, 知己知彼 biết người biết ta).                                                              |
| 役      | yì        | Dịch      | 殳 (thù)                 | `彳` (đi đường) + `殳` (tay cầm gậy/binh khí); hội ý người đi tuần tra biên ải hoặc làm lao dịch -> nghĩa vụ, lao dịch, chiến dịch, vai diễn (战役 chiến dịch, 兵役 nghĩa vụ quân sự, 奴役 nô dịch).                          |
| 德      | dé        | Đức       | 悳 (`十 + 罒 + 一 + 心`) | `彳` (hành động/đường đi) + `悳` (mắt nhìn ngay thẳng hướng về lòng `心`); hội ý bước đi theo cái tâm ngay thẳng -> đạo đức, phẩm hạnh, ân đức (道德 đạo đức, 品德 phẩm đức, 德国 nước Đức).                                  |
| 彻      | chè       | Triệt     | 切 (thiết)               | Phồn thể `徹`: `彳` + `切` (giản thể rút gọn khối `育 + 攵` cổ); nghĩa: xuyên thông suốt từ đầu đến cuối, triệt để (彻底 triệt để, 贯彻 quán triệt, 彻夜 suốt đêm).                                                           |
| 御      | yù        | Ngự       | 卸 (tá)                  | `彳` (đường đi) + `卸` (gốc là điều khiển ngựa tháo ách); nghĩa: đánh xe, cai quản vua chúa, chống giữ (hợp nhất với `禦` trong giản thể) (防御 phòng ngự, 抵御 chống cự, 御用 ngự dụng).                                     |

### Nhóm 3: Từ tần suất cao chuyển nghĩa ngữ pháp & tinh vi

| Chữ Hán | Pinyin        | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                    |
| ------- | ------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 很      | hěn           | Ngận     | 艮 (cấn)              | `彳` + `艮` (thanh phù _gèn_ -> _hěn_); nghĩa cổ là bướng bỉnh, trái ý không nghe; tiếng Trung hiện đại mượn làm phó từ chỉ mức độ "rất" (很好 rất tốt, 很多 rất nhiều, 很大 rất lớn).                                                            |
| 得      | dé / de / děi | Đắc      | 㝵 (`日 + 一 + 寸`)   | `彳` (đi trên đường) + `寸` (tay cầm vật/vỏ sò trong chữ cổ); đi đường nhặt được của -> thu được, đạt được (_dé_: 得到 đạt được); ngữ pháp hóa thành trợ từ bổ ngữ (_de_: 跑得快 chạy nhanh) và động từ năng nguyện "phải" (_děi_: 得去 phải đi). |
| 微      | wēi           | Vi       | `山 + 一 + 几 + 攵`   | `彳` (đi lặng lẽ/ẩn khuất) + phần giữa `山 + 一 + 几` + `攵`; nghĩa gốc là đi lén, ẩn kín -> nhỏ bé, tinh vi, hơi hơi, suy yếu (微笑 mỉm cười, 微信 WeChat, 细微 nhỏ nhặt tinh vi).                                                               |
| 徽      | huī           | Huy      | `山 + 一 + 糸 + 攵`   | Khác `微` ở thành phần `糸` (dây tơ) thay cho `几`; `彳` + `山 + 一 + 糸 + 攵`; nghĩa gốc là sợi dây cờ lớn đẹp -> huy hiệu, dấu hiệu đẹp, tên tỉnh An Huy (国徽 quốc huy, 校徽 phù hiệu trường, 安徽 An Huy).                                    |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `亍` (`chù` · Xúc): nửa phải của ngã tư đường trong `行` (`彳` + `亍`), xuất hiện ở rìa phải các chữ tách khung như `街`, `衡`.
- `衡` (`héng` · Hành): khung `彳 ... 亍` bọc phần giữa (`角` rút gọn + `大`); Khang Hy xếp bộ `行` (144), hiện đại nhiều bảng tra xếp bộ `彳`; nghĩa: cân bằng, đo lường (`平衡` cân bằng, `衡量` cân nhắc đo lường).
- `复 / 復` (`fù` · Phục): phồn thể `復` (`彳` + `复`, quay lại/khôi phục) thuộc bộ `彳`; giản thể gộp chung với `複` thành `复` (xếp bộ `夂`/`丿`), không còn giữ `彳`.
- `彷` (`páng / fǎng` · Bàng / Phảng): `彳` + `方` (thanh phù); nghĩa đi quanh quẩn (`彷徨` bàng hoàng) hoặc tương tự (`仿佛` phảng phất).
- `徘 / 徊` (`páihuái` · Bồi hồi): `彳` + `非` và `彳` + `回`; luôn đi cặp `徘徊` chỉ bước đi qua đi lại, do dự.
- `亻` (nhân đứng / đơn nhân bàng): biến thể của bộ `人`, có 1 nét phẩy, tránh nhầm với `彳` có 2 nét phẩy.
- `辶` (bộ Sước/Xước): ôm bên trái và đáy chữ, cùng trường nghĩa di chuyển nhưng là bộ độc lập.

---

## Bộ 44: 又 (Hựu)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:**
  - `id`: `radical-036`
  - `radical_index`: `36`
  - `radical`: `又`
  - `name_vi`: `bộ Hựu`
  - `strokes`: `2` nét
  - Ghi chú dòng trùng/rỗng: không có dòng trùng/rỗng liên quan trong DB.
- **Hình thái & Biến thể (`variants`):**
  - `又` — dạng chính (DB ghi nhận 1 biến thể duy nhất là dạng đầy đủ `又`).
  - _(Lưu ý thực hành trong giản thể)_: `又` còn được dùng làm **linh kiện thay thế** (ký hiệu giản hóa) cho nhiều thành phần nhiều nét ở vị trí bên trái hoặc bên phải (như `对`, `观`, `欢`, `难`, `汉`, `仅`, `鸡`), nhưng hình dạng vẫn giữ nguyên 2 nét `又`.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - **Nguồn gốc / Lục thư (`history` — DB):** _bàn tay phải / hình bàn tay._ (Chữ giáp cốt vẽ bàn tay phải với các ngón xòe nhẹ hướng sang trái.)
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern` — DB):** _trong nhiều chữ vẫn gợi ý cầm nắm, lấy, nhận, thao tác; 又 đứng riêng trong tiếng Trung hiện đại nghĩa là “lại, nữa”, nhưng đó là nghĩa vay/mở rộng._ (Logic chuyển nghĩa: từ hình bàn tay phải thực hiện động tác lặp lại hoặc tiếp nối, mượn âm chỉ phó từ "lại, một lần nữa" — giả tá; trong cấu chữ cổ vẫn giữ rõ nét nghĩa bàn tay cầm/nắm/nhận/đối đáp.)
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện (`recognition` — DB):** _Có 又 trong cấu chữ thường có thể liên quan tay, cầm, lấy, nhận, thao tác; nhưng trong chữ hiện đại nhiều khi chỉ là linh kiện âm/hình._
  - **Phân biệt (`distinguish` — DB & mở rộng):**
    - `又` có nguồn gốc tay phải, nhưng không gộp vào `手` (`扌`).
    - `又` đứng riêng nghĩa hiện đại là "lại/nữa": `又来了` = lại tới rồi.
    - Không phải chữ nào có `又` cũng đoán được nghĩa tay ngay; phải phân biệt rõ **2 lớp chữ**: (a) chữ **hội ý bàn tay** truyền thống (`友, 双, 取, 受, 及, 反, 叔`) và (b) chữ **giản thể hóa** mượn hình `又` thay cho phần nét rườm rà (`对` ← `對`, `观` ← `觀`, `欢` ← `歡`, `难` ← `難`, `汉` ← `漢`, `仅` ← `僅`, `鸡` ← `雞`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Hành động bàn tay — cầm nắm, tiếp nhận, kết đôi & phản hồi

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                     |
| ------- | ------ | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 又      | yòu    | Hựu      | _(độc lập)_           | Tượng hình bàn tay phải cổ; về sau giả tá làm phó từ chỉ sự lặp lại hoặc song hành: lại, nữa, vừa... vừa... (又来了 lại tới rồi, 又高又大 vừa cao vừa to, 又是 lại là).                            |
| 友      | yǒu    | Hữu      | 𠂇 (tay trái)         | Chữ cổ là hai bàn tay cùng hướng về một phía hỗ trợ nhau (nét trên `𠂇` + nét dưới `又`); nghĩa: bạn bè, thân thiện, hữu nghị (朋友 bạn bè, 友好 hữu hảo, 友谊 tình hữu nghị).                     |
| 双      | shuāng | Song     | 又 (hựu)              | Giản thể ghép hai bàn tay `又` cạnh nhau (phồn thể `雙` vẽ 1 bàn tay `又` giữ 2 con chim `隹`); nghĩa: đôi, cặp, hai bên (一双鞋 một đôi giày, 双方 hai bên, 双手 hai tay).                        |
| 取      | qǔ     | Thủ      | 耳 (nhĩ)              | `耳` (tai) + `又` (bàn tay): nghĩa gốc thời cổ là tay cầm tai (lấy tai thú săn hoặc chiến lợi phẩm để tính công); nay nghĩa là lấy, chọn, giành được (取消 hủy bỏ, 取得 đạt được, 争取 tranh thủ). |
| 受      | shòu   | Thụ      | 爫 (trảo) + 冖 (mịch) | Tay trên (`爫`) trao vật (`冖`/thuyền cổ) xuống bàn tay dưới (`又`) đỡ lấy; hội ý trao và nhận -> nhận lấy, chịu đựng, hưởng (接受 tiếp nhận, 感受 cảm nhận, 难受 khó chịu).                       |
| 及      | jí     | Cập      | 丿/人 (nhân)          | Chữ cổ vẽ người đi trước + bàn tay (`又`) đưa ra nắm với theo phía sau; nghĩa: đuổi kịp, đạt tới, và (及时 kịp thời, 及格 đạt chuẩn, 普及 phổ cập).                                                |
| 反      | fǎn    | Phản     | 厂 (hán)              | `厂` + `又` (hình cổ là bàn tay lật ngửa/lật úp từ vách đá); nghĩa: lật ngược, quay lại, trái ngược, phản đối (反对 phản đối, 反应 phản ứng, 相反 trái ngược).                                     |

### Nhóm 2: Quan hệ, tự sự, phản bội & xếp chồng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                        |
| ------- | ------ | -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 叔      | shū    | Thúc     | 尗 (thúc)             | `尗` (gốc là cây đậu) + `又` (tay nhặt hạt đậu); nghĩa gốc nhặt đậu, mượn chỉ chú (em trai của cha) hoặc người đàn ông trạc tuổi chú (叔叔 chú, 大叔 bác/chú, 叔父 chú ruột).                         |
| 叙      | xù     | Tự       | 余 (dư)               | Phồn thể `敘`: `余` (thanh phù _yú_ -> _xù_) + `又` (biến thể của `攵`, thao tác sắp đặt thứ tự); nghĩa: kể lại, trình bày theo thứ tự, trò chuyện (叙述 tường thuật, 叙事 tự sự, 叙旧 ôn chuyện cũ). |
| 叛      | pàn    | Bạn      | 半 (bán)              | `半` (chia nửa, thanh phù _bàn_ -> _pàn_) + `反` (`厂 + 又`, làm trái/quay lưng); nghĩa: tách nửa làm phản, phản bội (背叛 phản bội, 叛徒 kẻ phản đồ, 叛逆 phản nghịch).                              |
| 叠      | dié    | Điệp     | 又 + 冖 + 且          | Giản thể dùng ba chữ `又` chồng lên `冖 + 且` (phồn thể `疊` dùng ba chữ `田` chồng trên `宜`); nghĩa: gấp, xếp chồng nhiều lớp (折叠 gấp lại, 重叠 chồng chéo, 叠衣服 gấp quần áo).                  |

### Nhóm 3: Chữ giản thể thông dụng dùng `又` làm ký hiệu thay thế

| Chữ Hán | Pinyin    | Hán Việt  | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                              |
| ------- | --------- | --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 对      | duì       | Đối       | 寸 (thốn)             | Giản thể từ `對`: dùng `又` thay cho khối rườm rà bên trái, giữ `寸` (bàn tay/phép tắc) bên phải; nghĩa: đúng, đối diện, đối với, cặp đôi (对不起 xin lỗi, 对面 đối diện, 不对 không đúng). |
| 观      | guān      | Quan      | 见 (kiến)             | Giản thể từ `觀`: dùng `又` thay cho `雚` bên trái, giữ `见` (nhìn thấy) biểu nghĩa; nghĩa: xem, ngắm, quan sát, quan điểm (参观 tham quan, 观察 quan sát, 乐观 lạc quan).                  |
| 欢      | huān      | Hoan      | 欠 (khiếm)            | Giản thể từ `歡`: dùng `又` thay cho `雚`, giữ `欠` (mở miệng reo cười) biểu nghĩa; nghĩa: vui mừng, yêu thích, chào đón (欢迎 hoan nghênh, 喜欢 thích, 欢乐 hoan lạc).                     |
| 难      | nán / nàn | Nan / Nạn | 隹 (chuy)             | Giản thể từ `難`: dùng `又` thay cho `𦰩` bên trái, giữ `隹` (chim); nghĩa: khó khăn (_nán_: 困难 khó khăn, 难过 buồn), tai nạn (_nàn_: 灾难 tai nạn, 遇难 gặp nạn).                        |
| 汉      | hàn       | Hán       | 氵 (thủy)             | Giản thể từ `漢`: `氵` (sông nước, gốc chỉ sông Hán Thủy) + `又` (thay cho `𦰩`); nghĩa: sông Hán, người Hán, tiếng Hán (汉语 tiếng Hán, 汉字 chữ Hán, 男子汉 nam tử hán).                  |
| 仅      | jǐn       | Cẩn       | 亻 (nhân)             | Giản thể từ `僅`: `亻` (người) + `又` (thay cho `堇`); nghĩa: chỉ, vỏn vẹn, vừa mới (仅仅 chỉ có, 不仅 không những).                                                                        |
| 鸡      | jī        | Kê        | 鸟 (điểu)             | Giản thể từ `雞 / 鷄`: `又` (thay phần thanh phù `奚`) + `鸟` (chim/gia cầm); nghĩa: con gà (鸡蛋 trứng gà, 鸡肉 thịt gà, 公鸡 gà trống).                                                   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `手 / 扌` (bộ Thủ): bộ tay chính 4 nét trong hệ bộ thủ; có liên hệ trường nghĩa bàn tay với `又` nhưng là bộ độc lập.
- `爪 / 爫` (bộ Trảo): hình bàn tay úp/móng vuốt chụp từ trên xuống (như phần đầu của `受`, `采`, `爱`), là bộ độc lập.
- `圣` (`shèng` · Thánh · phồn `聖`): giản thể dùng `又` trên `土` thay phần `耳 + 口` cổ; nhiều bảng tra hiện đại xếp `圣` vào bộ `又` hoặc `土` (神圣 thần thánh, 圣经 Kinh Thánh).
- `戏` (`xì` · Hý · phồn `戲`): `又` thay phần `虍 + 豆` cổ bên trái + `戈` (bộ `戈`); nghĩa: vở kịch, trêu đùa (`戏剧` kịch, `游戏` trò chơi).
- `叹` (`tàn` · Thán · phồn `歎`): `口` + `又` (thay `𦰩`); xếp bộ `口`, nghĩa: thở dài, ca ngợi (`叹气` thở dài, `赞叹` khen ngợi).
- `变` (`biàn` · Biến · phồn `變`): `亦` + `又` (thay `攵` bên dưới); xếp bộ `又` hoặc `言` tùy từ điển (phồn thể ở bộ `言`), nghĩa: biến đổi (`变化` biến hóa, `改变` thay đổi).
- `爱` (`ài` · Ái · phồn `愛`): `爫 + 冖 + 友` (rút gọn mất `心`, lộ thành phần `友` có `又` ở đáy); xếp bộ `爫`, nghĩa: yêu (`爱情` tình yêu, `可爱` đáng yêu).

---

## Bộ 45: 囗 (Vi)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:**
  - `id`: `radical-053`
  - `radical_index`: `53`
  - `radical`: `囗`
  - `name_vi`: `bộ Vi`
  - `strokes`: `3` nét
  - Ghi chú dòng trùng/rỗng: không có dòng trùng/rỗng liên quan trong DB.
- **Hình thái & Biến thể (`variants`):**
  - `囗` — dạng chính (khung vuông lớn bao quanh gần như trọn bộ các thành phần bên trong chữ).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - **Nguồn gốc / Lục thư (`history` — DB):** _vòng vây/khung bao quanh, tường bao._
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern` — DB):** _bao vây, phạm vi, quốc gia/khu vực được bao quanh, khung chứa; thường bao quanh toàn bộ chữ._ (Logic chuyển nghĩa: từ bức tường thành/hàng rào khép kín -> ranh giới lãnh thổ/khu vườn (`国, 园`), hành động vây kín/giam giữ (`围, 囚, 困`), sự vững chắc khép kín (`固, 团`) và hình khối tròn đầy (`圆`).)
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện (`recognition` — DB):** _Có 囗 thường là khung bao quanh toàn chữ, liên quan bao bọc, phạm vi, khu vực, đất nước, vây quanh._
  - **Phân biệt (`distinguish` — DB & mở rộng) — Đặc biệt làm rõ `囗` (Vi bao ngoài) vs `口` (Khẩu):**
    1. **`囗` (bộ Vi — khung bao ngoài) vs `口` (bộ Khẩu — cái miệng):** Cả hai đều viết bằng 3 nét (`丨, 𠃍, 一`), nhưng:
       - **`囗` (Vi)** luôn có kích thước **lớn**, đóng vai trò **khung tường bao bọc trọn vẹn** thành phần nằm bên trong (kết cấu toàn bao vây 全包围), gợi ý _ranh giới, bao vây, đất nước, khu vườn, giam nhốt_ (`国, 园, 围, 图, 囚, 困`). Không dùng `囗` đứng trơn một mình làm chữ thông dụng.
       - **`口` (Khẩu)** luôn có kích thước **nhỏ**, đứng độc lập làm chữ ("cái miệng") hoặc nằm ở một phía (trái/trên/dưới/trong) của chữ, gợi ý _miệng, ăn uống, nói năng, âm thanh, lỗ hổng_ (`吃, 喝, 叫, 问, 品`).
    2. **Ví dụ đối chiếu kinh điển `回`:** Trong chữ `回` (hồi = quay về), khung lớn bên ngoài là **`囗`** (Vi), còn ô vuông nhỏ nằm lọt ở chính giữa là **`口`** (Khẩu) — một chữ chứa cả hai bộ rất dễ so sánh.
    3. **Khung hở vs khung kín:** `门` (cửa) chỉ che bên trên và hai bên (hở đáy), `凵` (khảm) hở bên trên (như `画, 凶`), còn `囗` đóng kín cả bốn cạnh (kết thúc bằng nét ngang đóng đáy cuối cùng sau khi viết xong phần ruột bên trong).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Lãnh thổ, quốc gia, địa điểm & không gian quy hoạch

| Chữ Hán | Pinyin      | Hán Việt       | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                        |
| ------- | ----------- | -------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 国      | guó         | Quốc           | 玉 (ngọc)             | Phồn thể `國` (`囗` + `或`: vùng bờ cõi có vũ khí bảo vệ); giản thể dùng `囗` (biên giới) bao lấy `玉` (ngọc báu/quốc ấn); nghĩa: đất nước, quốc gia (中国 Trung Quốc, 国家 quốc gia, 国际 quốc tế).  |
| 园      | yuán        | Viên           | 元 (nguyên)           | Phồn thể `園` (`囗` + `袁`); giản thể dùng `囗` (tường rào bao quanh) bọc `元` (thanh phù _yuán_); nghĩa: khu vườn, công viên, khu quy hoạch (公园 công viên, 花园 vườn hoa, 幼儿园 trường mẫu giáo). |
| 圈      | quān / juàn | Khuyên / Quyển | 卷 (quyển)            | `囗` (vòng bao quanh) + `卷` (thanh phù _juǎn_ -> _quān/juàn_); nghĩa: vòng tròn, khoanh tròn, phạm vi (_quān_: 圆圈 vòng tròn, 朋友圈 vòng bạn bè), chuồng gia súc (_juàn_: 猪圈 chuồng lợn).        |
| 图      | tú          | Đồ             | 冬 (đông)             | Phồn thể `圖` (`囗` + `啚`); giản thể dùng `囗` (khung bản vẽ/bản đồ) bọc `冬`; nghĩa: bản đồ, bức tranh, sơ đồ, mưu tính (地图 bản đồ, 图片 hình ảnh, 图书馆 thư viện).                              |
| 圃      | pǔ          | Phố            | 甫 (phủ)              | `囗` (hàng rào vườn) + `甫` (thanh phù _fǔ_ -> _pǔ_); nghĩa: vườn trồng rau hoặc cây giống (花圃 vườn hoa, 苗圃 vườn ươm, 菜圃 vườn rau).                                                             |
| 囤      | tún / dùn   | Độn            | 屯 (truân)            | `囗` (kho/cót vây tròn) + `屯` (thanh phù _tún_); nghĩa: tích trữ hàng hóa (_tún_: 囤积 tích trữ), bồ/cót đựng thóc (_dùn_: 粮囤 cót thóc).                                                           |

### Nhóm 2: Bao vây, giam giữ, khốn khó & cố định

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                   |
| ------- | ------ | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 围      | wéi    | Vi       | 韦 (vi)               | Phồn thể `圍`: `囗` (vòng vây) + `韦` (thanh phù _wéi_ kiêm ý đi tuần xung quanh); nghĩa: bao vây, vây quanh, chu vi, phạm vi (周围 xung quanh, 范围 phạm vi, 包围 bao vây).                     |
| 囚      | qiú    | Tù       | 人 (nhân)             | Hội ý: một người (`人`) bị nhốt kín trong bốn bức tường (`囗`); nghĩa: giam cầm, tù nhân (囚犯 tù nhân, 囚禁 giam giữ, 死囚 tử tù).                                                              |
| 困      | kùn    | Khốn     | 木 (mộc)              | Hội ý: cây (`木`) bị bít kín trong khung (`囗`) không vươn cành lá được (cũng có thuyết chỉ nhà cũ mục nát); nghĩa: vây khốn, khó khăn, buồn ngủ (困难 khó khăn, 困倦 buồn ngủ, 贫困 nghèo khó). |
| 固      | gù     | Cố       | 古 (cổ)               | `囗` (tường bao vững chắc) + `古` (thanh phù _gǔ_ -> _gù_); nghĩa: kiên cố, chắc chắn, cố định, vốn dĩ (固定 cố định, 坚固 kiên cố, 固执 cố chấp).                                               |
| 团      | tuán   | Đoàn     | 才 (tài)              | Phồn thể `團` (`囗` + `專`); giản thể dùng `囗` (khối tròn khép kín) bọc `才`; nghĩa: khối tròn, nắm, đoàn thể, đoàn kết (团结 đoàn kết, 代表团 đoàn đại biểu, 饭团 cơm nắm).                    |

### Nhóm 3: Tròn đầy, quay về, nguyên nhân & hình tượng đặc biệt

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung  | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                          |
| ------- | ------ | -------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 圆      | yuán   | Viên     | 员 (viên)              | Phồn thể `圓` (`囗` + `員`); `囗` (vòng tròn) + `员` (thanh phù _yuán_ kiêm ý hình cầu); nghĩa: hình tròn, tròn trịa, đồng Nhân dân tệ (圆形 hình tròn, 汤圆 bánh trôi, 圆满 viên mãn). |
| 回      | huí    | Hồi      | 口 (khẩu)              | Tượng hình dòng nước xoáy tròn cuộn vào tâm (`囗` bao ngoài + `口` nhỏ bên trong); nghĩa: xoay lại, quay về, đáp lại, lần/hồi (回家 về nhà, 回答 trả lời, 回忆 hồi ức).                 |
| 因      | yīn    | Nhân     | 大 (đại)               | Tượng hình người (`大`) nằm trên tấm chiếu/nệm (`囗`); nghĩa gốc là chỗ dựa/chiếu nằm -> nguyên nhân, căn cứ, vì (因为 bởi vì, 原因 nguyên nhân, 因素 nhân tố).                         |
| 四      | sì     | Tứ       | 儿 (nhân đi/nét trong) | Chữ giả tá: hình cổ là hơi thở chia đôi từ miệng mũi, sau biến dạng thành khung `囗` chứa 2 nét bên trong, mượn chỉ số 4 (四个 bốn cái, 四季 bốn mùa, 四面八方 bốn phương tám hướng).   |
| 囱      | cōng   | Thông    | nét chéo trong khung   | Phồn thể `囪`: tượng hình cửa sổ lấy sáng / ống thông khói có khung chắn (`囗`); hiện đại gặp trong từ ghép chỉ ống khói (烟囱 _yāncōng_ ống khói).                                     |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `口` (bộ Khẩu): ô vuông nhỏ, bộ độc lập chỉ miệng/nói/ăn, dễ nhầm nhất với `囗` khi tách riêng nét.
- `门 / 門` (bộ Môn): khung cửa hai cánh bao trên và hai bên (hở đáy), xếp bộ riêng (`问, 间, 闹`).
- `恩` (`ēn` · Ân): `因` (`囗` + `大`) trên `心`; chữ xếp bộ `心` (lòng biết ơn: `感恩`, `恩情`).
- `咽` (`yān / yàn / yè` · Yết / Yến): `口` + `因`; xếp bộ `口`, nghĩa: nuốt, họng (`咽喉` yết hầu, `下咽` nuốt xuống).
- `烟` (`yān` · Yên): `火` + `因`; xếp bộ `火`, nghĩa: khói, thuốc lá (`抽烟` hút thuốc, `烟花` pháo hoa).
- `画` (`huà` · Họa): phần trên `一` + `田` nằm trong khung `凵` hở trên (KHÔNG phải `囗` đóng kín); xếp bộ `田`.

---

## Bộ 46: 皿 (Mãnh)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:**
  - `id`: `radical-041`
  - `radical_index`: `41`
  - `radical`: `皿`
  - `name_vi`: `bộ Mãnh, Mãnh bát`
  - `strokes`: `5` nét
  - **Ghi chú dòng trùng / rỗng:** Trong DB có thêm 1 dòng rỗng phụ là **`radical-146`** (`radical_index: 146`, `radical: "皿"`, `name_vi: null`, `strokes: null`, `core_meaning: {}`) cần lưu ý xử lý/gộp khi làm sạch dữ liệu.
- **Hình thái & Biến thể (`variants`):**
  - `皿` — dạng chính, hầu như luôn nằm ở **phần đáy (bên dưới)** của chữ, dáng dẹt ngang rộng đáy để nâng phần thành phần phía trên.
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - **Nguồn gốc / Lục thư (`history` — DB):** _đồ đựng, chén/bát/đĩa/mâm._ (Chữ giáp cốt vẽ cái bát/đĩa nông có miệng loe và chân đế.)
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern` — DB):** _đồ chứa, vật chứa, bát đĩa; mở rộng sang việc đựng/chứa, đầy/tràn trong một số chữ._ (Logic chuyển nghĩa: từ vật chứa đựng thực phẩm (`盆, 盘, 盒, 盏`) -> hành động múc/đựng vào bát -> sự tràn đầy, dồi dào, ích lợi (`盛, 益, 盈`) -> hành động soi mặt vào chậu nước (`监`), ăn trộm đồ trong bình (`盗`), lấy máu trong bát để thề ước (`盟`).)
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện (`recognition` — DB):** _Có 皿 thường liên quan đồ đựng, chậu, bát, mâm, chứa đựng._
  - **Phân biệt (`distinguish` — DB & mở rộng):**
    - **`皿` (nằm dưới chữ) vs `罒` (thường nằm trên đỉnh chữ):** Cả hai đều có hình chữ nhật ngang chia ngăn dọc bên trong, nhưng `皿` có **nét ngang đáy dài chìa ra** làm đế bát (5 nét) và nằm dưới đáy chữ (`盆, 盒, 盛`), còn `罒` không có đế đáy và thường là biến thể của bộ `网` (lưới) nằm trên đầu chữ (`罗, 罪, 罚`).
    - **`皿` vs `血` (bộ Huyết — máu):** `血` (6 nét) chính là hình cái chén tế `皿` có thêm một nét phẩy `丿` ở trên đỉnh tượng trưng giọt máu nhỏ vào bát; là bộ thủ độc lập không gộp vào `皿`.
    - **`皿` vs `且` (thả/bàn thờ):** `且` đặt dọc có 2 nét ngang bên trong và 1 đáy dài, không phải `皿` đặt ngang có 2 nét sổ chia ngăn.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Đồ chứa, bát đĩa, hộp nắp & vật dụng hằng ngày

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| ------- | ------ | -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 盆      | pén    | Bồn      | 分 (phân)             | `分` (thanh phù _fēn_ -> _pén_, ở trên) + `皿` (đồ đựng miệng rộng, ở dưới); nghĩa: cái chậu, bồn, vùng trũng (脸盆 chậu rửa mặt, 花盆 chậu hoa, 盆地 bồn địa).                                     |
| 盘      | pán    | Bàn      | 舟 (chu)              | Phồn thể `盤`: giản thể rút gọn `般` thành `舟` (thanh phù _bān_ -> _pán_) trên `皿` (đồ đựng nông); nghĩa: cái đĩa lớn, mâm, bàn xoay, ổ đĩa (盘子 cái đĩa, 键盘 bàn phím, 硬盘 ổ cứng).           |
| 盒      | hé     | Hạp      | 合 (hợp)              | `合` (thanh phù _hé_ kiêm ý nắp khớp khít, ở trên) + `皿` (đồ đựng, ở dưới); nghĩa: cái hộp, tráp (盒子 cái hộp, 饭盒 hộp cơm, 铅笔盒 hộp bút).                                                     |
| 盖      | gài    | Cái      | 羊 biến thể (`⺶`)    | Phồn thể `蓋` (`艹 + 盍` gồm `去 + 皿`, Khang Hy xếp bộ `艹`; giản thể xếp bộ `皿`): nắp đậy đồ chứa `皿`; nghĩa: cái nắp, đậy, che phủ, xây nhà (盖子 cái nắp, 覆盖 che phủ, 盖房子 xây nhà).      |
| 盏      | zhǎn   | Trản     | 戋 (tiên)             | Phồn thể `盞`: `戋` (thanh phù _jiān_ -> _zhǎn_, ở trên) + `皿` (chén nhỏ, ở dưới); nghĩa: cái chén nhỏ, đĩa đèn dầu, lượng từ cho đèn (一盏灯 một ngọn đèn, 灯盏 đĩa đèn, 金盏花 hoa cúc vạn thọ). |
| 盅      | zhōng  | Chung    | 中 (trung)            | `中` (thanh phù _zhōng_, ở trên) + `皿` (đồ đựng, ở dưới); nghĩa: chén nhỏ không tay cầm (茶盅 chén trà, 酒盅 chén rượu nhỏ).                                                                       |
| 盔      | kuī    | Khôi     | 灰 (hôi)              | `灰` (thanh phù _huī_ -> _kuī_, ở trên) + `皿` (vật đựng hình vòm úp lên đầu, ở dưới); nghĩa: mũ giáp, mũ bảo hiểm (头盔 mũ bảo hiểm, 钢盔 mũ sắt).                                                 |
| 盂      | yú     | Vu       | 于 (vu)               | `于` (thanh phù _yú_, ở trên) + `皿` (chậu/bát, ở dưới); nghĩa: cái bát sâu lòng, ống nhổ, bình bát (痰盂 ống nhổ, 钵盂 bình bát nhà sư).                                                           |

### Nhóm 2: Đựng đầy, thịnh vượng & lợi ích

| Chữ Hán | Pinyin        | Hán Việt | Thiên bàng đứng chung      | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                              |
| ------- | ------------- | -------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 盛      | chéng / shèng | Thịnh    | 成 (thành)                 | `成` (thanh phù _chéng_, ở trên) + `皿` (bát đựng, ở dưới); nghĩa gốc là xới thức ăn đầy vào bát (_chéng_: 盛饭 xới cơm); mở rộng thành hưng thịnh, rực rỡ, long trọng (_shèng_: 盛开 nở rộ, 茂盛 sum suê). |
| 益      | yì            | Ích      | `八 + 一 + 八` (nước tràn) | Chữ cổ vẽ nước (`水` nằm ngang biến dạng phía trên) tràn ra khỏi bình `皿`; nghĩa gốc là tràn đầy -> dư dật, lợi ích, tăng thêm (利益 lợi ích, 有益 có ích, 日益 ngày càng).                                |
| 盈      | yíng          | Doanh    | `乃 + 又` (đầy ắp)         | Phần trên (gốc hình đầy tràn/vượt mức) + `皿` (bát đựng, ở dưới); nghĩa: đầy ắp, dồi dào, có lãi (盈利 sinh lời, 盈亏 lãi lỗ, 轻盈 nhẹ nhàng uyển chuyển).                                                  |

### Nhóm 3: Giám sát, trộm cướp, thề ước & sản vật

| Chữ Hán | Pinyin      | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                   |
| ------- | ----------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 监      | jiān / jiàn | Giám     | `刂 + 丶 + 一`        | Phồn thể `監`: chữ cổ vẽ người (`人`) cúi mắt to (`臣`) soi xuống chậu nước (`皿`) để nhìn hình -> nhìn xuống, giám sát, kiểm tra, nhà giam (_jiān_: 监督 giám sát, 监控 theo dõi, 监狱 nhà tù). |
| 盗      | dào         | Đạo      | 次 (thứ)              | `次` (gốc hình người há miệng nhỏ dãi thèm thuồng) + `皿` (bình bát đựng đồ quý); hội ý thèm đồ trong bình mà lấy trộm -> trộm cướp, kẻ trộm (盗窃 trộm cắp, 海盗 hải tặc, 强盗 kẻ cướp).        |
| 盟      | méng        | Minh     | 明 (minh)             | `明` (thanh phù _míng_ -> _méng_, ở trên) + `皿` (bát đựng máu vật tế khi thề ước thời cổ, ở dưới); nghĩa: kết minh, đồng minh, lời thề (联盟 liên minh, 加盟 gia nhập, 欧盟 Liên minh châu Âu). |
| 盐      | yán         | Diêm     | `土 + 卜 + 口`        | Phồn thể `鹽` (`臣 + 人 + 鹵 + 皿`, xếp bộ `鹵`; giản thể rút gọn trên `皿`, xếp bộ `皿`); nghĩa: muối ăn kết tinh đựng trong chậu/khay `皿` (食盐 muối ăn, 盐水 nước muối, 咸盐 muối mặn).      |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `温` (`wēn` · Ôn): `氵` + `日` + `皿` (phồn `溫` dùng `囚` trên `皿`); xếp bộ `氵`, nghĩa gốc là nước ấm rửa bát (`温暖` ấm áp, `温度` nhiệt độ).
- `蓝` (`lán` · Lam): `艹` + `监` (chứa `皿`); xếp bộ `艹`, nghĩa: màu xanh lam (`蓝色` màu xanh dương).
- `篮` (`lán` · Lam): `竹` + `监` (chứa `皿`); xếp bộ `竹`, nghĩa: cái giỏ/rổ đan bằng tre (`篮球` bóng rổ, `菜篮` giỏ đi chợ).
- `尽 / 盡` (`jìn / jǐn` · Tận): phồn thể `盡` có `皿` ở đáy (lau rửa cạn sạch đồ trong bát); giản thể `尽` biến thành `尺 + 冫` và xếp bộ `尸`.
- `血` (`xuè / xiě` · Huyết): bộ riêng 6 nét — nét phẩy nhỏ trên `皿` tượng trưng giọt máu trong chén tế; dễ nhầm với `皿`.
- `罒` (võng đầu): thuộc bộ `网` (lưới), nằm ở phần trên chữ, phân biệt với `皿` nằm ở đáy chữ.

---

## Bộ 47: 冫 (Băng)

> **`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`** — Bộ `冫` hiện chưa có dòng nào trong `hanzihome_radicals` (`status: MISSING`).

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Trạng thái DB:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`
- **DB ID & Thứ tự đề xuất:**
  - `id`: chưa gán — đề xuất cấp mới theo thứ tự trống / sau `MAX(radical_index)` trong 244 dòng hiện có (ví dụ `radical-246`, cần đối chiếu toàn bộ bảng trước khi insert để tránh đụng index).
  - `radical_index`: đề xuất `246` (tạm đặt, không trùng index 1–244 hiện có).
  - `radical`: `冫`
  - `name_vi`: `bộ Băng`
  - `strokes`: `2` nét
  - Ghi chú dòng trùng/rỗng: không có.
- **Hình thái & Biến thể (`variants` — đề xuất):**
  - `冫` — dạng chính, còn gọi là _hai chấm băng_ / _lưỡng điểm thủy_ (两点水: gồm 1 nét chấm trên `丶` + 1 nét hất lên `㇀`), hầu như luôn đứng ở bên trái chữ.
- **Ý nghĩa cốt lõi (`core_meaning` — đề xuất):**
  - **Nguồn gốc / Lục thư (`history`):** Tượng hình hai tinh thể băng nứt hoặc hai lớp băng đông kết (chữ gốc của "băng" là `仌`, sau viết thành `冰`); nghĩa gốc là băng đá, giá rét.
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):** Băng tuyết, lạnh giá, đông đặc, mát mẻ; mở rộng sang sự héo tàn vì rét (`凋`), sạch trong (`净`), lạnh nhạt về tình cảm (`冷淡`), hoặc làm luyện chảy kim loại như băng tan (`冶`). Ngoài ra, trong chữ Hán hiện đại có một nhóm chữ tần suất rất cao dùng `冫` do kế thừa dạng giản thể hóa từ `氵` hoặc biến dạng chữ cổ (`决, 准, 冲, 减, 况, 次`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — đề xuất):**
  - **Nhận diện (`recognition`):** Có `冫` (hai chấm băng) ở bên trái thường gợi trường nghĩa băng, lạnh, đông cứng, mát, ngưng kết; tuy nhiên cần nhớ riêng nhóm chữ hiện đại viết `冫` do quy chuẩn giản thể (`决, 准, 冲, 减, 况`) vốn bắt nguồn từ `氵` (nước) hoặc `二`.
  - **Phân biệt (`distinguish`) — Đặc biệt làm rõ `冫` (2 chấm băng) vs `氵` (3 chấm thủy):**
    1. **Số nét & Hình thái:** `冫` chỉ có **2 nét** (1 chấm + 1 hất — _lưỡng điểm thủy_), còn `氵` có **3 nét** (2 chấm + 1 hất — _tam điểm thủy_, biến thể bên trái của bộ `水`).
    2. **Trường nghĩa cốt lõi:** `冫` thiên về **băng giá, đông đặc, lạnh lẽo, mát mẻ** (`冰, 冷, 冻, 凉, 凝, 凌`), còn `氵` thiên về **nước lỏng, dòng chảy, sông biển, rửa sạch** (`河, 海, 洗, 汗, 汤, 液`).
    3. **Các cặp cực dễ viết nhầm trong giản thể:**
       - `净` (sạch, `冫`, phồn `淨`) vs `洁` (sạch, `氵`).
       - `准` (chuẩn, `冫`, phồn `準`) vs `淮` (sông Hoài, `氵`).
       - `决` (quyết định, `冫`, phồn `決`), `况` (tình huống, `冫`, phồn `況`), `减` (giảm, `冫`, phồn `減`), `冲` (xông/pha, `冫`, phồn `沖`) đều chuyển từ `氵` ở phồn thể (hoặc dạng cổ) sang `冫` trong quy chuẩn chữ giản thể hiện đại.
       - `凉` (mát/lạnh) trong chuẩn giản thể dùng `冫`, còn một số biến thể/tên riêng cổ viết `涼` (`氵`).

<details>
<summary>Đề xuất bản ghi JSON chuẩn schema <code>hanzihome_radicals</code> cho Bộ 47: 冫</summary>

```json
{
 "id": "radical-246",
 "radical_index": 246,
 "radical": "冫",
 "name_vi": "bộ Băng",
 "strokes": 2,
 "core_meaning": {
  "history": "hình hai tinh thể băng nứt hoặc hai lớp băng đông kết (chữ gốc 仌); nghĩa gốc là băng đá, giá lạnh.",
  "modern": "băng tuyết, lạnh giá, đông cứng, mát mẻ, ngưng tụ; mở rộng sang sạch trong (净), lạnh nhạt, héo úa vì rét (凋), luyện chảy (冶); ngoài ra một số chữ giản thể quy về 冫 như 决, 准, 冲, 减, 况."
 },
 "variants": [
  {
   "form": "冫",
   "note": "hai chấm băng (lưỡng điểm thủy), thường đứng bên trái chữ"
  }
 ],
 "recognition": "Có 冫 (2 chấm băng) bên trái thường liên quan băng, lạnh, đông, mát, kết tụ; lưu ý một số chữ hiện đại dùng 冫 theo quy chuẩn giản thể từ 氵 (决, 准, 冲, 减, 况).",
 "distinguish": [
  "冫 (2 chấm băng: 1 chấm + 1 hất) khác 氵 (3 chấm thủy: 2 chấm + 1 hất, biến thể của 水): 冫 thiên về băng giá, đông lạnh; 氵 thiên về nước lỏng, dòng chảy.",
  "Các cặp dễ nhầm: 冷/冻/冰/凉 (冫) vs 河/海/洗/汤 (氵); 净 (冫) vs 洁 (氵); 准 (冫) vs 淮 (氵).",
  "Trong chữ giản thể hiện đại, một nhóm chữ như 决 (決), 减 (減), 况 (況), 冲 (沖), 准 (準) dùng 冫 thay cho 氵 ở dạng truyền thống."
 ],
 "groups": [
  {
   "name": "Băng tuyết, lạnh giá, mát mẻ & ngưng tụ",
   "chars": ["冰", "冷", "冻", "凉", "凝", "凌"]
  },
  {
   "name": "Thu nhỏ, héo úa, tinh sạch & nung chảy",
   "chars": ["净", "减", "凑", "凋", "冶"]
  },
  {
   "name": "Trình tự, phán đoán & nhóm chữ giản thể hóa",
   "chars": ["次", "准", "决", "况", "冲", "冯"]
  }
 ],
 "related_components": [
  {
   "form": "冬",
   "note": "dōng · Đông · 夂 + 冫 · hai chấm ở đáy tượng trưng băng giá mùa đông, chữ xếp bộ 夂 (冬天 mùa đông)."
  },
  {
   "form": "寒",
   "note": "hán · Hàn · 宀 + 艹/一 + 人 + 冫 · hai nét băng ở đáy nhà rét buốt, chữ xếp bộ 宀 (寒冷 lạnh giá)."
  },
  {
   "form": "疼",
   "note": "téng · Đông (đau) · 疒 + 冬 · phần 冬 bên trong mang 2 chấm băng, chữ xếp bộ 疒 (头疼 đau đầu)."
  },
  {
   "form": "终",
   "note": "zhōng · Chung · 纟 + 冬 · phần 冬 làm thanh phù, chữ xếp bộ 糸 (终于 cuối cùng)."
  },
  {
   "form": "氵",
   "note": "thủy đứng (3 chấm thủy) · biến thể của 水, rất dễ nhầm với 冫 (2 chấm băng)."
  }
 ]
}
```

</details>

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Băng tuyết, lạnh giá, mát mẻ & ngưng tụ

| Chữ Hán | Pinyin        | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                       |
| ------- | ------------- | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 冰      | bīng          | Băng     | 水 (thủy)             | Hội ý: nước (`水`) gặp lạnh đóng thành băng (`冫`); nghĩa: nước đá, băng giá, làm lạnh (冰箱 tủ lạnh, 冰淇淋 kem, 滑冰 trượt băng).                                  |
| 冷      | lěng          | Lãnh     | 令 (lệnh)             | `冫` (băng lạnh) + `令` (thanh phù _lìng_ -> _lěng_); nghĩa: lạnh, nguội, lạnh nhạt, vắng vẻ (冷风 gió lạnh, 冷静 bình tĩnh, 冷淡 lạnh nhạt).                        |
| 冻      | dòng          | Đống     | 东 (đông)             | Phồn thể `凍`: `冫` (băng) + `东` (thanh phù _dōng_ -> _dòng_); nghĩa: đóng băng, đông cứng, cóng, làm lạnh (冷冻 đông lạnh, 冻伤 cước/bỏng lạnh, 果冻 thạch).       |
| 凉      | liáng / liàng | Lương    | 京 (kinh)             | `冫` (lạnh; cũng có dị thể `涼` dùng `氵`) + `京` (thanh phù); nghĩa: mát mẻ, lạnh (_liáng_: 凉快 mát mẻ, 凉爽 thoáng mát), để nguội (_liàng_: 凉一凉 để nguội bớt). |
| 凝      | níng          | Ngưng    | 疑 (nghi)             | `冫` (đóng băng) + `疑` (thanh phù _yí_ -> _níng_); nghĩa: đông đặc, ngưng kết, tập trung chú ý (凝固 đông đặc, 凝视 nhìn chằm chằm, 混凝土 bê tông).                |
| 凌      | líng          | Lăng     | 夌 (lăng)             | `冫` (băng giá) + `夌` (thanh phù _líng_); nghĩa gốc là băng tích thành tầng -> lấn át, chạm tới, lúc rạng sáng (凌晨 rạng sáng, 凌乱 bừa bộn, 欺凌 bắt nạt).        |

### Nhóm 2: Thu nhỏ, héo úa, tinh sạch & nung chảy

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| ------- | ------ | -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 净      | jìng   | Tịnh     | 争 (tranh)            | Phồn thể `淨` (`氵` + `爭`); giản thể chuyển thành `冫` + `争` (thanh phù); nghĩa: sạch sẽ, tinh khiết, ròng, chỉ toàn (干净 sạch sẽ, 净重 trọng lượng tịnh, 净化 thanh lọc).                       |
| 减      | jiǎn   | Giảm     | 咸 (hàm)              | Phồn thể `減` (`氵` + `咸`); giản thể đổi sang `冫` + `咸` (thanh phù); nghĩa: bớt đi, cắt giảm, phép trừ (减少 giảm bớt, 减肥 giảm cân, 加减 cộng trừ).                                            |
| 凑      | còu    | Thấu     | 奏 (tấu)              | `冫` (cổ dùng `氵`, nước dồn tụ lại) + `奏` (thanh phù); nghĩa: tụ họp lại, gom góp, tiến sát lại (凑巧 tình cờ, 拼凑 gom góp/chắp vá, 凑合 tạm được).                                              |
| 凋      | diāo   | Điêu     | 周 (chu)              | `冫` (sương giá) + `周` (thanh phù _zhōu_ -> _diāo_); nghĩa: cỏ cây gặp sương giá héo rũ -> héo tàn, suy tàn (凋谢 tàn úa, 凋零 điêu tàn).                                                          |
| 冶      | yě     | Dã       | 台 (đài)              | `冫` (gốc là làm tan chảy vật rắn như băng tan!) + `台` (thanh phù _tái_ -> _yě_); nghĩa: nấu luyện kim loại, hun đúc, trang điểm diễm lệ (冶金 luyện kim, 冶炼 nung luyện, 陶冶 tu dưỡng/hun đúc). |

### Nhóm 3: Trình tự, phán đoán & nhóm chữ giản thể hóa

| Chữ Hán | Pinyin        | Hán Việt     | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                             |
| ------- | ------------- | ------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 次      | cì            | Thứ          | 欠 (khiếm)            | Chữ cổ là `二` (hai lớp/kế tiếp) + `欠` (người há miệng), sau `二` viết biến thành `冫`; nghĩa: lần, lượt, thứ tự, hạng nhì (一次 một lần, 下次 lần sau, 次序 thứ tự).                                     |
| 准      | zhǔn          | Chuẩn        | 隹 (chuy)             | Phồn thể `準` (`氵` + `隼`, lấy mặt nước phẳng làm thước đo thăng bằng); giản thể dùng dạng tục `准` (`冫` + `隹`); nghĩa: chuẩn xác, cho phép, chuẩn bị (准备 chuẩn bị, 准确 chính xác, 标准 tiêu chuẩn). |
| 决      | jué           | Quyết        | 夬 (quái)             | Phồn thể `決` (`氵` + `夬`: dòng nước vỡ đê tuôn ra -> dứt khoát); giản thể quy về `决` (`冫` + `夬`); nghĩa: quyết định, giải quyết, vỡ đê (决定 quyết định, 解决 giải quyết, 坚决 kiên quyết).           |
| 况      | kuàng         | Huống        | 兄 (huynh)            | Phồn thể `況` (`氵` + `兄` thanh phù); giản thể đổi thành `况` (`冫` + `兄`); nghĩa: tình hình, trạng huống, huống chi (情况 tình hình, 状况 trạng thái, 何况 huống hồ).                                   |
| 冲      | chōng / chòng | Xung         | 中 (trung)            | Giản thể gộp `沖` (`氵` + `中`) và `衝` thành `冲` (`冫` + `中`); nghĩa: xông thẳng, pha nước, rửa trôi (_chōng_: 冲突 xung đột, 冲茶 pha trà, 冲刺 nước rút); hướng về, nồng gắt (_chòng_).               |
| 冯      | féng / píng   | Phùng / Bằng | 马 (mã)               | Phồn thể `馮`: `冫` + `马` (gốc là tiếng vó ngựa chạy nhanh trên đất / sông Băng); hiện đại chủ yếu làm họ Phùng (_Féng_) hoặc nghĩa dựa vào (_píng_) (姓冯 họ Phùng).                                     |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `冬` (`dōng` · Đông): `夂` + `冫`; hai chấm ở đáy biểu thị băng giá mùa đông, nhưng chữ xếp bộ `夂` (`冬天` mùa đông).
- `寒` (`hán` · Hàn): `宀 + 艹/一 + 人 + 冫`; hai nét `冫` dưới đáy biểu thị rét buốt, chữ xếp bộ `宀` (`寒冷` lạnh giá, `寒假` nghỉ đông).
- `疼` (`téng` · Đông/đau): `疒` + `冬`; chứa `冬` (có 2 chấm dưới), xếp bộ `疒` (`头疼` đau đầu).
- `终` (`zhōng` · Chung): `纟` + `冬`; `冬` làm thanh phù, xếp bộ `糸` (`终于` cuối cùng).
- `氵` (thủy đứng / ba chấm thủy): biến thể của bộ `水` (3 nét), rất dễ nhầm với `冫` (2 nét).

---

## Bộ 48: 衣 (Y)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:**
  - `id`: `radical-017`
  - `radical_index`: `17`
  - `radical`: `衣`
  - `name_vi`: `bộ Y`
  - `strokes`: `6` nét
  - **Ghi chú dòng trùng / rỗng:** Trong DB có thêm 1 dòng rỗng phụ là **`radical-177`** (`radical_index: 177`, `radical: "衣"`, `name_vi: null`, `strokes: null`, `core_meaning: {}`) cần lưu ý xử lý/gộp khi làm sạch dữ liệu.
- **Hình thái & Biến thể (`variants`):**
  - `衣` — dạng đầy đủ (6 nét), có thể đứng độc lập, nằm ở **phía dưới** (`装, 袋, 裂, 袭`), hoặc **tách đôi trên–dưới** (`亠` trên đỉnh + `𧘇` ở đáy) bao bọc thành phần giữa (`裹, 衷, 哀, 衰`, biến thể cổ trong `表, 裁`).
  - `衤` — y bàng (5 nét), thường đứng ở **bên trái** chữ (`补, 衬, 裤, 被, 裕, 袖, 裙, 袜`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - **Nguồn gốc / Lục thư (`history` — DB):** _áo/quần áo, hình dạng áo mặc trên người._ (Chữ giáp cốt vẽ cổ áo giao vạt cùng hai tay áo buông rộng.)
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern` — DB):** _quần áo, vải mặc, trang phục, che phủ cơ thể, mặc/đắp; mở rộng sang lớp vỏ/bề ngoài trong một số chữ._ (Logic chuyển nghĩa: từ chiếc áo mặc che thân (`衣, 衬, 裤, 袖, 裙`) -> chăn đắp/che chở rồi ngữ pháp hóa thành giới từ bị động (`被`), áo rộng thành giàu có (`裕`), áo mặc ngoài thành bề mặt/biểu thị (`表`), cắt may áo thành phán xét/cắt giảm (`裁`), mặc nhiều lớp áo thành bọc gói/tập kích (`裹, 装, 袭`), vải thừa xé ra thành nứt rách (`裂`).)
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện (`recognition` — DB):** _Có 衣 / 衤 thường liên quan áo quần, mặc, vải, trang phục, che phủ, lớp ngoài._
  - **Phân biệt (`distinguish` — DB & mở rộng) — Đặc biệt làm rõ `衤` (Y - 2 chấm) vs `礻` (Thị - 1 chấm):**
    1. **`衤` (bộ Y — 5 nét, "2 chấm" bên phải) vs `礻` (bộ Thị — 4 nét, "1 chấm" bên phải):**
       - **`衤` (Y bàng, 5 nét):** Khi nhìn ở **cạnh phải nét sổ thẳng (`丨`)**, có **2 nét nhỏ** (1 phẩy ngắn `ノ` ở trên + 1 chấm dài `丶` ở dưới — dân gian hay gọi gọn là **"Y 2 chấm"**, DB mô tả là thêm 1 nét **"vạt áo"**). Chữ có `衤` luôn liên quan **quần áo, vải vóc, che đắp** (`补, 衬, 裤, 被, 裕, 初, 袖, 裙`).
       - **`礻` (Thị bàng, 4 nét):** Biến thể của `示`, ở cạnh phải nét sổ chỉ có **1 nét chấm (`丶`)** (gọi gọn là **"Thị 1 chấm"**), gọn hơn `衤` 1 nét. Chữ có `礻` liên quan **thần linh, thờ cúng, lễ nghi, phúc họa** (`神, 社, 祝, 福, 礼, 祖, 视`).
       - **Mẹo nhớ đối chiếu:** _Áo (`衤`) cần 2 tà/2 nét cài khuy (5 nét); Thần (`礻`) chỉ có 1 chấm hương/1 nét (4 nét)._
    2. **Dạng tách trên–dưới của `衣`:** Nhiều người mới học dễ bỏ sót bộ `衣` khi thấy chữ bị chẻ đôi (`亠` ở đỉnh và `𧘇` ở đáy ôm lấy bộ phận giữa) như `裹` (`衣` ôm `果`), `衷` (`衣` ôm `中`), `衰` (`衣` ôm hình áo tơi), hoặc biến dạng chân đế `衣` ở dưới (`表, 裁, 装, 袋, 裂`).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Dạng đứng bên trái `衤` — Quần áo, may vá, che đắp & mở rộng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                        |
| ------- | ------ | -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 补      | bǔ     | Bổ       | 卜 (bốc)              | Phồn thể `補`: `衤` (áo) + `卜` (thanh phù _bǔ_, phồn là `甫`); nghĩa gốc: vá chỗ rách trên áo -> bổ sung, bù đắp, tẩm bổ (补充 bổ sung, 弥补 bù đắp, 补习 học thêm).                                 |
| 衬      | chèn   | Sấn      | 寸 (thốn)             | Phồn thể `襯`: `衤` (áo) + `寸` (giản thể thay `親`); nghĩa: áo lót mặc sát người, đệm lót, làm nổi bật (衬衫 áo sơ mi, 衬托 làm nền tôn lên, 内衬 lớp lót trong).                                    |
| 裤      | kù     | Khố      | 库 (khố)              | Phồn thể `褲`: `衤` (trang phục) + `库` (thanh phù _kù_); nghĩa: cái quần (裤子 cái quần, 牛仔裤 quần bò/jeans, 短裤 quần đùi).                                                                       |
| 被      | bèi    | Bị       | 皮 (bì)               | `衤` (áo/chăn) + `皮` (thanh phù _pí_ -> _bèi_); nghĩa gốc: chăn đắp khi ngủ -> bị/được (trợ từ bị động trong câu bị động) (被子 cái chăn, 被动 bị động, 被批评 bị phê bình).                         |
| 裕      | yù     | Dụ       | 谷 (cốc)              | `衤` (quần áo) + `谷` (thanh phù _gǔ_ -> _yù_ kiêm ý rộng rãi); nghĩa gốc: quần áo rộng rãi dư vải -> giàu có, dồi dào, khoan dung (富裕 giàu có, 充裕 dồi dào, 宽裕 dư dả).                          |
| 袖      | xiù    | Tụ       | 由 (do)               | `衤` (áo) + `由` (thanh phù _yóu_ -> _xiù_); nghĩa: ống tay áo, giấu trong tay áo (袖子 tay áo, 短袖 áo cộc tay, 领袖 lãnh tụ — gốc chỉ cổ áo và tay áo!).                                            |
| 裙      | qún    | Quần     | 君 (quân)             | `衤` (trang phục) + `君` (thanh phù _jūn_ -> _qún_); nghĩa: cái váy (lưu ý tiếng Trung hiện đại `裙子` là váy, khác nghĩa "cái quần" trong tiếng Việt!) (裙子 cái váy, 连衣裙 váy liền, 围裙 tạp dề). |
| 袜      | wà     | Miệt     | 末 (mạt)              | Phồn thể `襪`: `衤` (đồ mặc) + `末` (thanh phù _mò_ -> _wà_, phồn là `蔑`); nghĩa: đôi tất, vớ (袜子 đôi tất, 丝袜 tất da chân, 棉袜 tất bông).                                                       |

### Nhóm 2: Dạng đặt dưới hoặc tách trên–dưới `衣` (`亠...𧘇`) — Trang phục, bọc gói, cắt may & bề ngoài

| Chữ Hán | Pinyin      | Hán Việt   | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                                                |
| ------- | ----------- | ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 装      | zhuāng      | Trang      | 壮 (tráng)            | Phồn thể `裝`: `壮` (thanh phù _zhuàng_, ở trên) + `衣` (nằm ở dưới); nghĩa gốc: gói hành lý, mặc y phục chỉnh tề -> trang phục, mặc/đựng, đóng gói, giả vờ, lắp đặt (服装 trang phục, 包装 đóng gói, 假装 giả vờ, 安装 lắp đặt).                             |
| 表      | biǎo        | Biểu       | 毛 (mao) biến dạng    | Chữ cổ là `衣` tách ra ôm phần `毛` (lông thú) ở giữa (`表` viết liền phần đỉnh vào thân trên phần đáy `𧘇` của `衣`): áo lông mặc mặt ngoài -> bề ngoài, biểu thị, bảng biểu, đồng hồ (外表 bề ngoài, 表现 biểu hiện, 手表 đồng hồ đeo tay, 表格 bảng biểu). |
| 袋      | dài         | Đại        | 代 (đại)              | `代` (thanh phù _dài_, ở trên) + `衣` (nằm ở dưới); nghĩa gốc: túi đựng đồ khâu bằng vải -> cái túi, bao tải, đơn vị túi/bao (袋子 cái túi, 口袋 túi áo/quần, 塑料袋 túi ni-lông).                                                                            |
| 裁      | cái         | Tài        | 𢦏 (`十 + 戈`)        | `𢦏` (phần trên-phải có `戈` cây qua/dao cắt, kiêm thanh phù _cái_) ôm lấy `衣` (nằm ở góc dưới-trái); hội ý dùng dao kéo cắt vải may áo -> cắt may, cắt giảm, phán xét (裁剪 cắt may, 裁判 trọng tài, 裁员 cắt giảm nhân sự).                                |
| 裂      | liè         | Liệt       | 列 (liệt)             | `列` (thanh phù _liè_ kiêm ý hàng đường xé, ở trên) + `衣` (vải áo, ở dưới); nghĩa gốc: vải thừa bị xé tách ra -> nứt, rách, tách rời (破裂 nứt vỡ, 分裂 chia rẽ, 裂开 nứt toác).                                                                             |
| 裹      | guǒ         | Quả        | 果 (quả)              | `衣` **tách đôi trên–dưới** (`亠` ở đỉnh và `𧘇` ở đáy) bao kín lấy `果` (thanh phù _guǒ_) ở chính giữa; nghĩa: dùng vải/áo bọc đồ lại -> gói, bọc, quấn (包裹 bưu kiện/bọc gói, 裹着 quấn lấy, 裹足不前 chùn bước).                                          |
| 衰      | shuāi / cuī | Suy / Thôi | ruột áo tơi cổ        | Chữ tượng hình cái áo tơi bện rơm che mưa (nét ngang/khung giữa mô phỏng lớp cỏ rơm) lồng trong bộ `衣` tách trên–dưới (`亠` trên + `𧘇` dưới); nghĩa mở rộng: tàn tạ, yếu dần (_shuāi_: 衰老 già yếu, 衰退 suy thoái, 衰弱 suy nhược).                       |

### Nhóm 3: Dạng gốc `衣` và chữ mở rộng thông dụng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                   |
| ------- | ------ | -------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 衣      | yī     | Y        | _(độc lập)_           | Tượng hình chiếc áo cổ giao vạt hai tay buông; nghĩa: quần áo, lớp vỏ/màng bọc (衣服 quần áo, 大衣 áo khoác, 毛衣 áo len, 内衣 đồ lót).                                                                          |
| 袭      | xí     | Tập      | 龙 (long)             | Phồn thể `襲`: `龙` (giản thể thay khối `龍 + 𠂢` cổ ở trên) + `衣` (ở dưới); nghĩa gốc: mặc chồng thêm áo ngoài / che trùm bất ngờ -> tập kích, sao chép, kế thừa (袭击 tập kích, 抄袭 đạo văn, 沿袭 noi theo). |
| 衷      | zhōng  | Trung    | 中 (trung)            | `衣` tách đôi trên–dưới (`亠` + `𧘇`) bọc lấy `中` (thanh phù _zhōng_ kiêm ý áo lót mặc sát trong cùng); nghĩa: lòng dạ, nội tâm sâu kín (由衷 chân thành từ đáy lòng, 衷心 thành tâm, 苦衷 nỗi khổ tâm).        |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `初` (`chū` · Sơ): `衤` + `刀`; hội ý dùng dao kéo cắt mảnh vải đầu tiên để may áo -> ban đầu, sơ khai (`开始/起初` ban đầu, `初中` trung học cơ sở, `初级` sơ cấp). _(Khang Hy xếp bộ `刀`; nhiều bảng tra hiện đại xếp ở cả `衤` và `刀`.)_
- `巾` (bộ Cân): khăn, mảnh vải treo, thuộc bộ độc lập cùng trường nghĩa vải vóc (`帽, 带, 帆, 帮`), không phải `衣`.
- `哀` (`āi` · Ai): `衣` tách đôi trên–dưới (`亠 ... 𧘇`) bọc lấy `口` (than khóc); Khang Hy xếp bộ `口` (`哀求` khẩn cầu, `悲哀` bi ai).
- `依` (`yī` · Y): `亻` + `衣` (thanh phù _yī_); xếp bộ `亻`, nghĩa: dựa vào, nương tựa (`依然` vẫn như cũ, `依靠` dựa vào).
- `卒` (`zú` · Tốt): gốc là áo của binh lính có dấu vạch ngang, viết biến dạng phần dưới giống `十`; xếp bộ `十` (`士兵/士卒` binh sĩ, `毕业` tốt nghiệp).
- `礻` (thị bàng, 4 nét — 1 chấm bên phải): biến thể của bộ `示`, liên quan thần linh/lễ nghi, rất dễ nhầm với `衤`.

---

## Bộ 49: 馬 (Mã)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:**
  - `id`: `radical-029`
  - `radical_index`: `29`
  - `radical`: `馬`
  - `name_vi`: `bộ Mã`
  - `strokes`: `10` nét _(dạng phồn thể `馬` là 10 nét; dạng giản thể `马` là 3 nét)_
  - Ghi chú dòng trùng/rỗng: không có dòng trùng/rỗng liên quan trong DB.
- **Hình thái & Biến thể (`variants`):**
  - `馬` — dạng phồn thể/đầy đủ (10 nét).
  - `马` — dạng giản thể (3 nét), đứng độc lập, đứng bên trái (`骑, 驶, 验`) hoặc bên dưới (`驾`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - **Nguồn gốc / Lục thư (`history` — DB):** _con ngựa, hình ngựa trong chữ cổ._ (Chữ giáp cốt vẽ đầu, bờm, bốn chân và đuôi con ngựa.)
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern` — DB):** _ngựa, cưỡi, kéo xe, tốc độ, di chuyển; trong giản thể nhiều chữ chuyển 馬 thành 马._ (Logic chuyển nghĩa: từ con ngựa và các loài cùng họ (`马, 驴, 骡, 驼`) -> cưỡi ngựa, điều khiển xe cộ, chạy nhanh, đóng quân (`骑, 驾, 驶, 驱, 驻, 驰`) -> kiểm tra chọn giống ngựa tốt xấu thành khảo nghiệm (`验`), ngựa nhảy vọt/hung hăng/nhiều màu thành lừa dối, kiêu ngạo, bác bỏ, thuần hóa (`骗, 骄, 驳, 驯`).)
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện (`recognition` — DB):** _Có 馬 / 马 thường liên quan ngựa, cưỡi, lái, chạy nhanh, di chuyển; đôi khi chỉ còn vai trò âm trong chữ hình thanh._
  - **Phân biệt (`distinguish` — DB & mở rộng):**
    - `马` (3 nét) là dạng giản thể của `馬` (10 nét).
    - **Phân biệt vai trò nghĩa phù vs thanh phù:** Khi `马` đứng ở các chữ thuộc bộ `马` (`骑, 驾, 驶, 验`), nó đóng vai **nghĩa phù** (ngựa/chạy/điều khiển). Khi `马` đứng bên phải hoặc dưới ở các chữ như `妈, 吗, 码, 蚂, 骂`, nó chủ yếu đóng vai **thanh phù** đọc âm _ma_ (bộ gốc là `女, 口, 石, 虫, 网`).
    - Đừng nhầm `马` (ngựa, không có nét chấm bên trong khung đầu) với `鸟` (chim, phồn `鳥`, có một nét chấm ở phần đầu tượng trưng mắt chim) và `乌` (quạ đen — không có mắt).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Ngựa & các loài thú cưỡi / thồ hàng họ ngựa

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                 |
| ------- | ------ | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 马      | mǎ     | Mã       | _(độc lập)_           | Phồn thể `馬`: tượng hình con ngựa có bờm, bốn chân và đuôi; giản thể rút gọn thành 3 nét `马`; nghĩa: con ngựa, ngay lập tức (马上 lập tức, 马路 đường cái, 白马 ngựa trắng). |
| 驴      | lǘ     | Lư       | 户 (hộ)               | Phồn thể `驢`: `马` (họ ngựa) + `户` (giản thể thay `盧` _lú_ -> _lǘ_); nghĩa: con lừa (毛驴 con lừa, 驴肉 thịt lừa, 骑驴找马 cưỡi lừa tìm ngựa).                              |
| 骡      | luó    | La       | 累 (lũy)              | Phồn thể `騾`: `马` + `累` (thanh phù _lěi_ -> _luó_); nghĩa: con la (loài lai giữa lừa và ngựa, chuyên dùng thồ hàng) (骡子 con la, 骡马 ngựa và la).                         |
| 驼      | tuó    | Đà       | 它 (tha)              | Phồn thể `駝`: `马` (thú cưỡi/thồ) + `它` (thanh phù _tā_ -> _tuó_); nghĩa: con lạc đà, gù lưng (骆驼 lạc đà, 驼背 lưng gù).                                                   |
| 骆      | luò    | Lạc      | 各 (các)              | Phồn thể `駱`: `马` + `各` (thanh phù _gè_ -> _luò_); nghĩa cổ là ngựa trắng bờm đen, hiện đại dùng chủ yếu trong từ ghép chỉ lạc đà (骆驼 lạc đà).                            |

### Nhóm 2: Cưỡi, lái xe, thúc chạy & đóng quân

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                 |
| ------- | ------ | -------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 骑      | qí     | Kỵ       | 奇 (kỳ)               | Phồn thể `騎`: `马` (ngựa) + `奇` (thanh phù _qí_); nghĩa: cưỡi ngựa, cưỡi/đi (xe đạp, xe máy) (骑马 cưỡi ngựa, 骑自行车 đi xe đạp, 骑士 hiệp sĩ).                                             |
| 驾      | jià    | Giá      | 加 (gia)              | Phồn thể `駕`: `加` (thanh phù _jiā_ -> _jià_ kiêm ý đặt ách lên ngựa, ở trên) + `马` (ở dưới); nghĩa: đóng ách ngựa, lái (xe, tàu, máy bay) (驾驶 lái xe, 驾照 bằng lái xe, 驾车 lái ô tô).   |
| 驶      | shǐ    | Sử       | 史 (sử)               | Phồn thể `駛`: `马` + `史` (thanh phù _shǐ_); nghĩa gốc là ngựa chạy nhanh -> điều khiển, lái, di chuyển (xe, tàu) (驾驶 lái xe, 行驶 lưu hành/chạy, 驶向 chạy về hướng).                      |
| 驱      | qū     | Khu      | 区 (khu)              | Phồn thể `驅`: `马` + `区` (thanh phù _qū_); nghĩa: thúc ngựa chạy, xua đuổi, dẫn động (驱逐 trục xuất/xua đuổi, 先驱 tiên phong, 驱动 trình điều khiển/driver).                               |
| 驻      | zhù    | Trú      | 主 (chủ)              | Phồn thể `駐`: `马` + `主` (thanh phù _zhù_ kiêm ý dừng lại trụ vững); nghĩa gốc ngựa dừng chân nghỉ -> đóng quân, cư trú, đóng trụ sở (驻扎 đóng quân, 常驻 thường trú, 驻华 tại Trung Quốc). |
| 驰      | chí    | Trì      | 也 (dã)               | Phồn thể `馳`: `马` + `也` (thanh phù); nghĩa: ngựa phi nước đại, chạy nhanh, vang danh xa (奔驰 lao nhanh / hãng Mercedes-Benz, 驰名 nổi tiếng khắp nơi).                                     |

### Nhóm 3: Khảo nghiệm, tính nết, thuần hóa & biến cố

| Chữ Hán | Pinyin | Hán Việt     | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| ------- | ------ | ------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 验      | yàn    | Nghiệm       | 佥 (thiêm)            | Phồn thể `驗`: `马` (gốc là kiểm tra chứng thực ngựa tốt) + `佥` (giản thể thay `僉`, thanh phù); nghĩa: kiểm tra, nghiệm chứng, kinh nghiệm (经验 kinh nghiệm, 实验 thí nghiệm, 检验 kiểm nghiệm). |
| 骗      | piàn   | Biến / Phiến | 扁 (biển)             | Phồn thể `騙`: `马` + `扁` (thanh phù _biǎn_ -> _piàn_, gốc là nhảy vọt lên lưng ngựa); nghĩa chuyển: lừa gạt, dối trá (骗人 lừa người, 欺骗 lừa dối, 骗子 kẻ lừa đảo).                             |
| 骄      | jiāo   | Kiêu         | 乔 (kiều)             | Phồn thể `驕`: `马` (ngựa cao lớn sung sức khó thuần) + `乔` (thanh phù _qiáo_ -> _jiāo_); nghĩa: kiêu ngạo, tự hào, cưng chiều (骄傲 tự hào / kiêu ngạo, 骄阳 nắng chói chang).                    |
| 骚      | sāo    | Tao          | 蚤 (tảo)              | Phồn thể `騷`: `马` (ngựa hoảng động loạn) + `蚤` (thanh phù); nghĩa: khuấy động, quấy nhiễu, bồn chồn, văn thơ tao nhã (骚扰 quấy rối, 牢骚 càu nhàu, 离骚 Ly Tao).                                |
| 驳      | bó     | Bác          | 爻 (hào)              | Phồn thể `駁`: `马` + `爻` (đan chéo); nghĩa gốc ngựa lông pha hai màu -> lẫn tạp, bác bỏ, chuyển tải bằng xà lan (反驳 phản bác, 驳回 bác bỏ, 驳船 xà lan).                                        |
| 驯      | xùn    | Thuần        | 川 (xuyên)            | Phồn thể `馴`: `马` + `川` (thanh phù _chuān_ -> _xùn_); nghĩa: thuần hóa, thuần thục, hiền lành (驯服 thuần phục, 驯养 thuần dưỡng, 温驯 hiền lành dễ bảo).                                        |
| 骤      | zhòu   | Sậu          | 聚 (tụ)               | Phồn thể `驟`: `马` + `聚` (thanh phù); nghĩa gốc ngựa phi gấp -> đột ngột, dồn dập, bước/quy trình (步骤 bước đi/quy trình, 骤然 đột nhiên, 暴风骤雨 mưa to gió lớn).                              |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `骂 / 罵` (`mà` · Mạ): `口 + 口` trên `马`; phồn thể `罵` xếp bộ `网` (`罒`), giản thể một số bảng tra xếp `马` hoặc `口`; `马` ở đây chỉ âm _ma_ (gần _mà_), không mang nghĩa ngựa (`骂人` mắng người).
- `妈` (`mā` · Ma): `女` + `马` (thanh phù _mǎ_ -> _mā_); xếp bộ `女`, nghĩa: mẹ (`妈妈` mẹ).
- `吗` (`ma` · Ma): `口` + `马` (thanh phù); xếp bộ `口`, trợ từ nghi vấn cuối câu (`好吗` được không).
- `码` (`mǎ` · Mã): `石` + `马` (thanh phù); xếp bộ `石`, nghĩa: mã số, bến cảng (`号码` con số, `密码` mật mã, `码头` bến tàu).
- `蚂` (`mǎ / mà` · Mã): `虫` + `马` (thanh phù); xếp bộ `虫`, gặp trong `蚂蚁` (con kiến).
- `惊 / 驚` (`jīng` · Kinh): phồn thể `驚` là `敬` trên `馬` (xếp bộ `馬`, nghĩa ngựa giật mình hoảng sợ); giản thể đổi hoàn toàn sang `忄 + 京`, xếp bộ `心` (`惊喜` bất ngờ vui sướng, `吃惊` giật mình).
- `腾 / 騰` (`téng` · Đằng): phồn thể `騰` xếp bộ `馬`; giản thể `腾` xếp bộ `月` (bên trái là `月`, dưới phải là `马`), nghĩa: bay vọt, sôi sục, dọn trống (`腾飞` bay vút lên, `腾出` nhường trống).
- `鸟 / 鳥` (bộ Điểu): chim, dễ nhầm với `马 / 馬` ở nét chấm con mắt bên trên.

---

## Bộ 50: 玉 (Ngọc)

> **`[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`** — Bộ `玉` hiện chưa có dòng nào trong `hanzihome_radicals` (`status: MISSING`).

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **Trạng thái DB:** `[CHƯA CÓ TRONG DB - Đề xuất bổ sung]`
- **DB ID & Thứ tự đề xuất:**
  - `id`: chưa gán — đề xuất cấp mới theo thứ tự trống / sau `MAX(radical_index)` trong 244 dòng hiện có (ví dụ `radical-247`, cần đối chiếu toàn bộ bảng trước khi insert để tránh đụng index).
  - `radical_index`: đề xuất `247` (tạm đặt, không trùng index 1–244 hiện có).
  - `radical`: `玉`
  - `name_vi`: `bộ Ngọc`
  - `strokes`: `5` nét _(dạng đầy đủ `玉` 5 nét; dạng đứng trái `王` 4 nét)_
  - Ghi chú dòng trùng/rỗng: không có.
- **Hình thái & Biến thể (`variants` — đề xuất):**
  - `玉` — dạng đầy đủ (5 nét, có chấm `丶` ở góc dưới-phải), dùng khi đứng độc lập, nằm bên dưới (`宝, 璧, 玺`) hoặc nằm trong khung (`国`).
  - `王` — _ngọc bàng_ / _tà ngọc bàng_ (王旁 / 斜玉旁, 4 nét lược mất chấm, nét ngang cuối viết hơi hất xiên lên `㇀`), thường đứng bên trái chữ (`现, 理, 环, 珍, 珠, 球, 瑞, 玩, 玻, 璃, 琢`) hoặc ghép đôi ở trên (`琴`) / hai bên (`班, 斑`).
- **Ý nghĩa cốt lõi (`core_meaning` — đề xuất):**
  - **Nguồn gốc / Lục thư (`history`):** Tượng hình chuỗi 3 miếng ngọc xâu lại bằng sợi dây (trong giáp cốt và kim văn, `玉` viết giống hệt `王`); về sau để phân biệt với chữ `王` (vua), người ta thêm một nét chấm `丶` ở giữa dưới thành `玉`.
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern`):** Ngọc bích, đá quý, trang sức đẹp quý giá; mở rộng sang các vật tròn bóng như hạt ngọc/cầu (`珠, 球, 环`), vật trong sáng như ngọc (`玻, 璃`), âm thanh trong trẻo của nhạc cụ ngọc/đàn (`琴`), thao tác chế tác ngọc (`琢`), đường vân trật tự trong đá ngọc thành đạo lý/quản lý (`理`), ánh ngọc lộ ra thành xuất hiện/hiện tại (`现`), tín vật ngọc lành thành điềm tốt (`瑞`), và thưởng ngoạn ngọc quý thành vui chơi (`玩`).
- **Nhận diện & Phân biệt (`recognition` & `distinguish` — đề xuất):**
  - **Nhận diện (`recognition`):** Khi thấy `玉` hoặc thành phần `王` đứng ở bên trái chữ (`王旁/斜玉旁`), gần như chắc chắn chữ liên quan đá quý, ngọc báu, vật tròn sáng, vẻ đẹp trân quý, trật tự vân ngọc (`理`) hoặc sự tỏa sáng lộ rõ (`现, 瑞`).
  - **Phân biệt (`distinguish`) — Đặc biệt làm rõ `王` (bộ Ngọc đứng trái thiếu chấm: 王旁/斜玉旁) vs bộ Vương (`王`):**
    1. **Bản chất `王` bên trái là `玉` thiếu chấm:** Trong các chữ như `现, 理, 环, 班, 珍, 珠, 球, 瑞, 玩, 玻, 璃, 琢`, thành phần bên trái viết giống chữ `王` (4 nét, nét đáy hất lên thành _tà ngọc bàng_ 斜玉旁) thực chất **chính là bộ `玉` bị lược bỏ dấu chấm** cho gọn khi ghép chữ — nghĩa gốc là **ngọc/đá quý**, hoàn toàn **không mang nghĩa "vua"**.
    2. **Đối chiếu với chữ `王` (Vương = vua) và quy tắc Khang Hy:** Khi đứng độc lập thành một chữ riêng, `王` (_wáng_ = vua, 4 nét, gốc tượng hình chiếc rìu lớn của người đứng đầu hoặc 3 gạch Thiên–Địa–Nhân nối thông) khác nghĩa hoàn toàn với `玉` (_yù_ = ngọc, 5 nét). Tuy nhiên, trong hệ thống **214 bộ thủ Khang Hy truyền thống không lập riêng "bộ Vương"**, mà **xếp cả chữ `王` lẫn toàn bộ các chữ có `王` bên trái vào bộ `玉` (bộ số 96)**! (Một số từ điển giản thể hiện đại tách riêng bộ `王` 4 nét để dễ đếm nét khi tra, nhưng về Lục thư và ngữ nghĩa thì `王旁` vẫn là bộ Ngọc `玉`.)
    3. **Khi nào giữ chấm `玉`?** Khi đứng một mình (`玉`), nằm bên dưới (`宝, 璧, 玺, 莹`) hoặc lồng trong khung (`国`), bộ Ngọc giữ nguyên dấu chấm 5 nét; riêng `班` (`王 + 刂 + 王`), `斑` (`王 + 文 + 王`), `琴` (`王 + 王 + 今`) dùng dạng không chấm `王`.
    4. **Tránh nhầm với `土` (Thổ) và `士` (Sĩ):** `王/玉` có 3 nét ngang và 1 nét sổ thông suốt (hoặc thêm 1 chấm), khác `土`/`士` chỉ có 2 nét ngang.

<details>
<summary>Đề xuất bản ghi JSON chuẩn schema <code>hanzihome_radicals</code> cho Bộ 50: 玉</summary>

```json
{
 "id": "radical-247",
 "radical_index": 247,
 "radical": "玉",
 "name_vi": "bộ Ngọc",
 "strokes": 5,
 "core_meaning": {
  "history": "hình 3 miếng ngọc xâu thành chuỗi bằng sợi dây; chữ cổ giống 王 nên về sau thêm một nét chấm 丶 thành 玉 để phân biệt với 王 (vua).",
  "modern": "ngọc bích, đá quý, trang sức quý giá; mở rộng sang vật tròn/sáng như ngọc (珠, 球, 环, 玻璃), đẽo mài/trật tự vân ngọc (琢, 理), ánh ngọc lộ ra (现), điềm lành (瑞) và thưởng ngoạn (玩)."
 },
 "variants": [
  {
   "form": "玉",
   "note": "dạng đầy đủ (5 nét, có chấm), đứng độc lập, nằm dưới hoặc trong khung"
  },
  {
   "form": "王",
   "note": "ngọc bàng / tà ngọc bàng (王旁/斜玉旁, 4 nét lược mất chấm), thường đứng bên trái chữ"
  }
 ],
 "recognition": "Thấy 玉 hoặc 王 đứng bên trái chữ (王旁/斜玉旁) gần như luôn liên quan đá quý, ngọc báu, vật hình cầu tròn (珠, 球, 环), vẻ sáng đẹp (现, 玻璃) hoặc sự trật tự, mài giũa (理, 琢).",
 "distinguish": [
  "王 đứng bên trái chữ (王旁/斜玉旁 như trong 现, 理, 环, 珍, 珠, 球, 瑞, 玩, 玻璃, 琢) là biến thể của bộ 玉 lược bỏ dấu chấm cho gọn, mang nghĩa NGỌC chứ KHÔNG phải 'vua'.",
  "Phân biệt với chữ Vương (王): đứng độc lập thì 王 (wáng = vua) ≠ 玉 (yù = ngọc), nhưng trong hệ 214 bộ Khang Hy không có bộ Vương riêng mà xếp hết chữ 王 và 王旁 vào bộ 玉 (số 96).",
  "Dạng đầy đủ 玉 vẫn giữ dấu chấm khi đứng một mình (玉), nằm đáy dưới (宝, 璧) hoặc nằm trong khung (国).",
  "Phân biệt 王 (3 nét ngang) với 土 (Thổ) và 士 (Sĩ) chỉ có 2 nét ngang."
 ],
 "groups": [
  {
   "name": "Ngọc báu, đá quý & vật chất dạng hạt, vòng, cầu",
   "chars": ["玉", "珍", "珠", "球", "环", "玻", "璃"]
  },
  {
   "name": "Chế tác ngọc, trật tự lý lẽ, biểu hiện & thưởng ngoạn",
   "chars": ["理", "琢", "班", "现", "玩", "瑞"]
  },
  {
   "name": "Chữ Vương, nhạc cụ, hoa văn & vật quý mở rộng",
   "chars": ["王", "琴", "珊", "玛", "斑"]
  }
 ],
 "related_components": [
  {
   "form": "宝 / 寶",
   "note": "bǎo · Bảo · 宀 + 玉 · ngọc quý cất dưới mái nhà, chữ xếp bộ 宀 (宝贝 bảo bối, 宝石 đá quý)."
  },
  {
   "form": "国",
   "note": "guó · Quốc · 囗 + 玉 · ngọc báu (quốc ấn) trong biên giới nước, chữ xếp bộ 囗 (国家 quốc gia)."
  },
  {
   "form": "望",
   "note": "wàng · Vọng · đáy chữ có hình 王 (gốc là chữ 壬 - người đứng trên đất ngóng trăng), xếp bộ 月 (希望 hy vọng)."
  },
  {
   "form": "皇",
   "note": "huáng · Hoàng · 白 + 王 · hào quang chói lọi trên vương miện/vua, xếp bộ 白 (皇帝 hoàng đế)."
  },
  {
   "form": "全",
   "note": "quán · Toàn · 人 + 王 · chữ cổ là 入 + 玉 (viên ngọc nguyên vẹn), xếp bộ 入/人 (完全 hoàn toàn)."
  },
  {
   "form": "弄",
   "note": "nòng · Lộng · 王 + 廾 · hai tay mân mê đồ ngọc -> chơi đùa/làm, xếp bộ 廾 (弄坏 làm hỏng)."
  }
 ]
}
```

</details>

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Ngọc báu, đá quý & vật chất dạng hạt, vòng, cầu

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                |
| ------- | ------ | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 玉      | yù     | Ngọc     | _(độc lập)_           | Tượng hình chuỗi 3 miếng ngọc thêm nét chấm `丶` để phân biệt với `王`; nghĩa: ngọc quý, đẹp đẽ, trong sạch (玉石 đá ngọc, 玉米 ngô/bắp, 宝玉 bảo ngọc).                                                      |
| 珍      | zhēn   | Trân     | 㐱 (chẩn)             | `王` (ngọc `玉` lược chấm) + `㐱` (thanh phù _zhěn_ -> _zhēn_); nghĩa: châu báu quý hiếm, trân trọng (珍珠 ngọc trai, 珍惜 trân trọng, 珍贵 quý giá).                                                         |
| 珠      | zhū    | Châu     | 朱 (chu)              | `王` (ngọc `玉`) + `朱` (thanh phù _zhū_); nghĩa: hạt ngọc, ngọc trai, vật tròn nhỏ như giọt (珍珠 ngọc trai, 眼珠 tròng mắt, 泪珠 giọt lệ).                                                                  |
| 球      | qiú    | Cầu      | 求 (cầu)              | `王` (ngọc `玉`, gốc chỉ viên ngọc tròn đẹp) + `求` (thanh phù _qiú_); nghĩa: quả cầu, quả bóng, địa cầu (足球 bóng đá, 篮球 bóng rổ, 地球 Trái Đất).                                                         |
| 环      | huán   | Hoàn     | 不 (bất)              | Phồn thể `環`: `王` (ngọc `玉`) + `不` (giản thể thay `睘` thanh phù); nghĩa gốc: chiếc vòng bằng ngọc có lỗ tròn ở giữa -> cái vòng, bao quanh, hoàn cảnh (环境 môi trường, 圆环 vòng tròn, 环绕 vây quanh). |
| 玻      | bō     | Pha      | 皮 (bì)               | `王` (ngọc `玉`, ví chất liệu trong suốt sáng như ngọc) + `皮` (thanh phù _pí_ -> _bō_); ghép với `璃` thành `玻璃` (_bōli_) nghĩa là thủy tinh, kính (玻璃窗 cửa kính, 玻璃杯 cốc thủy tinh).                |
| 璃      | lí     | Ly       | 离 (ly)               | `王` (ngọc `玉`) + `离` (thanh phù _lí_); kết hợp với `玻` tạo từ `玻璃` (thủy tinh, pha lê) hoặc với `琉` tạo `琉璃` (ngọc lưu ly, men sứ).                                                                  |

### Nhóm 2: Chế tác ngọc, trật tự lý lẽ, biểu hiện & thưởng ngoạn

| Chữ Hán | Pinyin     | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                                            |
| ------- | ---------- | -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 理      | lǐ         | Lý       | 里 (lý)               | `王` (ngọc `玉`) + `里` (thanh phù _lǐ_); nghĩa gốc là **đường vân thớ trong viên ngọc** và công việc xẻ gọt theo thớ ngọc -> quy luật, đạo lý, sắp xếp, xử lý (道理 đạo lý, 管理 quản lý, 理解 thấu hiểu, 整理 chỉnh lý).                |
| 琢      | zhuó / zuó | Trác     | 豖 (trác/súc)         | `王` (ngọc `玉`) + `豖` (thanh phù _zhuó_ kiêm ý đục đẽo); nghĩa: đẽo mài ngọc, gọt giũa câu chữ, suy ngẫm (_zhuó_: 雕琢 chạm trổ/gọt giũa; _zuó_: 琢磨 _zuómo_ suy ngẫm, _zhuómó_ mài giũa).                                             |
| 班      | bān        | Ban      | 刂 (đao) + 王         | Hội ý: dùng dao (`刂` đứng giữa) chia tách viên ngọc (`王` hai bên) thành phần đều nhau -> phân chia, thứ bậc, lớp học, ca làm, chuyến xe/bay (班级 lớp học, 上班 đi làm, 航班 chuyến bay).                                               |
| 现      | xiàn       | Hiện     | 见 (kiến)             | Phồn thể `現`: `王` (ngọc `玉`, ánh ngọc rực sáng) + `见` (nhìn thấy, thanh phù _jiàn_ -> _xiàn_ kiêm ý lộ ra cho mắt thấy); nghĩa: hiện ra, xuất hiện, hiện tại, tiền mặt (现在 bây giờ, 发现 phát hiện, 出现 xuất hiện, 现金 tiền mặt). |
| 玩      | wán        | Ngoạn    | 元 (nguyên)           | `王` (ngọc `玉`) + `元` (thanh phù _yuán_ -> _wán_); nghĩa gốc: nâng niu thưởng ngoạn đồ ngọc quý trong tay -> vui chơi, đùa nghịch, đồ chơi (玩儿/玩耍 vui chơi, 玩具 đồ chơi, 好玩 vui/thú vị).                                         |
| 瑞      | ruì        | Thụy     | 耑 (đoan)             | `王` (ngọc `玉`, tín vật ngọc vua ban cho chư hầu) + `耑` (thanh phù _duān_ -> _ruì_); nghĩa: điềm lành, cát tường, may mắn (瑞雪 tuyết lành, 祥瑞 điềm lành, 瑞士 Thụy Sĩ).                                                              |

### Nhóm 3: Chữ Vương, nhạc cụ, hoa văn & vật quý mở rộng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                                 |
| ------- | ------ | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 王      | wáng   | Vương    | _(độc lập 4 nét)_     | Tượng hình cây rìu lớn biểu trưng quyền lực hoặc 3 nét Thiên–Địa–Nhân nối thông; nghĩa: vua, thủ lĩnh, họ Vương. _(Khang Hy xếp chính chữ `王` vào bộ `玉`!)_ (国王 quốc vương, 王子 hoàng tử, 姓王 họ Vương). |
| 琴      | qín    | Cầm      | 王 + 今               | Hai chữ `王` (`玉`) ở trên tượng hình dây đàn và phím ngọc trên mặt đàn + `今` (thanh phù _jīn_ -> _qín_) ở dưới; nghĩa: đàn, nhạc cụ dây/phím (钢琴 đàn piano, 小提琴 đàn vĩ cầm, 口琴 kèn harmonica).        |
| 珊      | shān   | San      | 册 (sách)             | `王` (ngọc `玉`, ví thứ quý đẹp dưới biển) + `册` (thanh phù _cè_ -> _shān_); gặp phổ biến trong `珊瑚` san hô (珊瑚礁 rạn san hô, 阑珊 tàn tạ/thưa dần).                                                      |
| 玛      | mǎ     | Mã       | 马 (mã)               | Phồn thể `瑪`: `王` (ngọc/đá quý `玉`) + `马` (thanh phù _mǎ_); ghép trong `玛瑙` (_mǎnǎo_) nghĩa là đá mã não — một loại đá quý vân đẹp.                                                                      |
| 斑      | bān    | Ban      | 文 (văn) + 王         | `王` + `文` (hoa văn) + `王`: vẻ lốm đốm nhiều màu như hoa văn trên ngọc bích; nghĩa: đốm, vằn, vệt (斑马 ngựa vằn, 斑点 vết đốm, 雀斑 tàn nhang).                                                             |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `宝 / 寶` (`bǎo` · Bảo): `宀` + `玉` (phồn `寶` có `宀 + 玉 + 缶 + 貝`); ngọc quý cất giữ trong nhà, xếp bộ `宀` (`宝贝` bảo bối, `宝石` đá quý).
- `国` (`guó` · Quốc): `囗` + `玉`; viên ngọc đặt trong khung biên giới `囗`, xếp bộ `囗` (`国家` quốc gia).
- `望` (`wàng` · Vọng): phần đáy có hình `王` (thực chất biến thể từ chữ `壬` — người đứng ngóng lên), xếp bộ `月` (`希望` hy vọng).
- `皇` (`huáng` · Hoàng): `白` + `王`; ánh sáng trắng rực rỡ trên vương vị, xếp bộ `白` (`皇帝` hoàng đế).
- `全` (`quán` · Toàn): `人` + `王` (chữ cổ là `入` + `玉`, ngọc nguyên vẹn không tì vết); xếp bộ `入`/`人` (`完全` hoàn toàn, `安全` an toàn).
- `弄` (`nòng` · Lộng): `王` (`玉`) + `廾` (hai bàn tay nâng mân mê viên ngọc -> đùa nghịch, làm); xếp bộ `廾` (`弄坏` làm hỏng, `捉弄` trêu chọc).

---

## Bộ 51: 田 (Điền)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:**
  - `id`: `radical-140`
  - `radical_index`: `140`
  - `radical`: `田`
  - `name_vi`: `bộ Điền`
  - `strokes`: `5` nét
  - Ghi chú dòng trùng/rỗng: không có dòng trùng/rỗng liên quan trong DB.
- **Hình thái & Biến thể (`variants`):**
  - `田` — dạng chính (5 nét), có thể đứng độc lập, đứng bên trái (`略, 畔, 畸`), nằm trên (`男, 界, 畏`), nằm dưới (`留, 番, 畜`) hoặc nằm giữa khung (`画`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - **Nguồn gốc / Lục thư (`history` — DB):** _ruộng đất chia ô/thửa ruộng._ (Chữ giáp cốt vẽ khu đất chia thành các ô vuông có bờ ngăn.)
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern` — DB):** _ruộng, đồng, nông nghiệp, đất canh tác; trong nhiều chữ mở rộng sang khu vực/ô/lĩnh vực._ (Logic chuyển nghĩa: từ thửa ruộng chia ô (`田, 亩, 畔, 畴`) -> ranh giới chia khu vực (`界`), lao động nông nghiệp (`男`), chiếm/chia đất thành mưu lược (`略`), dấu chân thú trên đồng thành lượt/phen (`番`), vẽ đường ranh giới thành bức tranh (`画`). Lưu ý: một số chữ như `留, 畏, 由, 甲, 申` có ô giống `田` do hình vẽ cổ biến đổi chứ không mang nghĩa ruộng.)
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện (`recognition` — DB):** _Có 田 thường liên quan ruộng, đất, nông nghiệp, ô/vùng, khu vực._
  - **Phân biệt (`distinguish` — DB & mở rộng) — Đặc biệt làm rõ `田` vs `日` / `由` / `申` (và `甲`):**
    1. **`田` (Điền, 5 nét — kín 4 mặt):** Khung ô vuông chia **4 ngăn đều nhau** bởi dấu chữ thập `+` nằm **gọn hoàn toàn bên trong** khung `口`, không nét nào chọc ra ngoài; nghĩa gốc là _ruộng đất_ (`男, 界, 留, 略, 画`).
    2. **`日` (Nhật, 4 nét — không có nét sổ giữa):** Khung chữ nhật hẹp cao hơn, bên trong chỉ có **1 nét ngang** duy nhất, nghĩa là _mặt trời, ngày_ (`明, 时, 早, 晴`).
    3. **`由` (Do, 5 nét — nét sổ nhô lên trên):** Giống chữ `田` nhưng nét sổ dọc ở giữa **thò đầu vượt lên khỏi cạnh trên** (gốc tượng hình chiếc bình/mầm cây, nay nghĩa _do, từ, nguyên nhân_; vd: `油, 邮, 抽`).
    4. **`申` (Thân, 5 nét — nét sổ xuyên suốt trên & dưới):** Giống chữ `田` nhưng nét sổ dọc ở giữa **xuyên thò ra cả phía trên lẫn phía dưới** (gốc hình tia chớp, cũng là địa chi Thân; vd: `神, 伸, 审`).
    5. **`甲` (Giáp, 5 nét — nét sổ thò xuống dưới):** Giống chữ `田` nhưng nét sổ dọc **kéo thò xuống phía dưới** (gốc hình mai rùa/áo giáp, can Giáp; vd: `押, 鸭, 闸`).
    6. **Lưu ý tra từ điển & định kiến:** Hệ Khang Hy xếp cả `由, 甲, 申` vào bộ `田` vì đều có khung ô 5 nét, nhưng nguồn gốc hình thể và nghĩa hoàn toàn khác ruộng. Với chữ `男` (`田 + 力`), cần hiểu đó là dấu vết phân công lao động nông nghiệp cổ chứ không suy diễn định kiến hiện đại.

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Ruộng đất, ranh giới, nông nghiệp & chăn nuôi

| Chữ Hán | Pinyin   | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                         |
| ------- | -------- | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 田      | tián     | Điền     | _(độc lập)_           | Tượng hình thửa ruộng có bờ ngang dọc chia ô; nghĩa: ruộng đồng, vùng sản xuất, họ Điền (田野 đồng ruộng, 种田 làm ruộng, 梯田 ruộng bậc thang).                                       |
| 界      | jiè      | Giới     | 介 (giới)             | `田` (ruộng) + `介` (thanh phù _jiè_ kiêm ý đường phân chia ranh giới); nghĩa: ranh giới, phạm vi, thế giới (世界 thế giới, 边界 biên giới, 外界 thế giới bên ngoài).                  |
| 亩      | mǔ       | Mẫu      | 亠 + 久 (rút gọn)     | Phồn thể `畝` (`田` + `十` + `久`); giản thể giữ `田` dưới nét đầu `亠`; nghĩa: mẫu (đơn vị đo diện tích ruộng đất Trung Quốc, 1 mẫu ≈ 666,7 m²) (一亩地 một mẫu đất, 田亩 ruộng đất). |
| 畔      | pàn      | Bạn      | 半 (bán)              | `田` (ruộng) + `半` (thanh phù _bàn_ -> _pàn_); nghĩa gốc: bờ ruộng -> bờ sông, bờ hồ, bên cạnh (河畔 bờ sông, 湖畔 bờ hồ, 耳畔 bên tai).                                              |
| 畜      | chù / xù | Súc      | 玄 (huyền)            | `玄` (biến dạng từ hình cỏ/dây buộc ở trên) + `田` (đồng cỏ/ruộng nuôi thả); nghĩa: gia súc (_chù_: 牲畜 gia súc, 家畜 vật nuôi), chăn nuôi (_xù_: 畜牧 chăn nuôi).                    |
| 畴      | chóu     | Trù      | 寿 (thọ)              | Phồn thể `疇`: `田` (ruộng) + `寿` (giản thể thay `壽`, thanh phù); nghĩa gốc: thửa ruộng canh tác đều đặn -> đồng ruộng, phạm trù/lĩnh vực (范畴 phạm trù, 田畴 đồng ruộng).          |

### Nhóm 2: Lao động, lưu giữ, vẽ ranh giới & trạng thái đặc biệt

| Chữ Hán | Pinyin    | Hán Việt     | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                  |
| ------- | --------- | ------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 男      | nán       | Nam          | 力 (lực)              | Hội ý: dùng sức lực (`力`) canh tác ngoài đồng ruộng (`田`), phản ánh phân công lao động nông nghiệp cổ; nghĩa: đàn ông, con trai (男人 đàn ông, 男孩 bé trai, 男女 nam nữ).                    |
| 留      | liú       | Lưu          | `𠂎 + 刀`             | Phần trên là `𠂎 + 刀` (biến thể âm/hình cổ) + `田` ở dưới; nghĩa: ở lại, giữ lại, để lại (留学 du học, 留下 giữ lại, 留言 để lại lời nhắn).                                                    |
| 略      | lüè       | Lược         | 各 (các)              | `田` (đất đai/ruộng) + `各` (thanh phù _gè_ -> _lüè_, gốc ý phân chia hoặc đánh chiếm đất); nghĩa: sách lược, sơ lược, bỏ qua (策略 sách lược, 忽略 lơ là/bỏ qua, 省略 giản lược).              |
| 画      | huà       | Họa          | `一` + `凵`           | Phồn thể `畫` (`聿` tay cầm bút vẽ đường ranh ruộng `田`); giản thể giữ `一` trên `田` đặt trong khung `凵`; nghĩa: vẽ, bức tranh, vạch/nét chữ (画画儿 vẽ tranh, 计划 kế hoạch, 笔画 nét chữ). |
| 番      | fān / pān | Phiên / Phan | 釆 (biện)             | `釆` (dấu chân thú ở trên) + `田` (mảnh đất/ruộng ở dưới -> bước đi thay phiên trên đồng); nghĩa: lượt, lần, phen, ngoại lai (一番 một phen, 番茄 cà chua, 轮番 luân phiên).                    |
| 畏      | wèi       | Úy           | `𧘇/戉` phần dưới     | Chữ cổ tượng hình hình ma quỷ đầu to (đầu biến thành hình `田`) cầm gậy gây khiếp sợ; nghĩa: sợ hãi, kính sợ (畏惧 sợ hãi, 敬畏 kính sợ, 无畏 không sợ hãi).                                    |
| 畸      | jī        | Cơ           | 奇 (kỳ)               | `田` (ruộng) + `奇` (thanh phù _qí_ -> _jī_, nghĩa lẻ loi không cân); nghĩa gốc: mảnh ruộng lẻ đầu thừa méo mó -> lệch lạc, dị dạng (畸形 dị dạng, 畸重 lệch nặng).                             |

### Nhóm 3: Nhóm chữ khung ô gần `田` (Khang Hy xếp bộ `田`)

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung           | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                 |
| ------- | ------ | -------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 由      | yóu    | Do       | _(nét sổ nhô lên trên `田`)_    | Gốc tượng hình cái bình có cổ hoặc mầm mọc, KHÔNG phải ruộng; nghĩa: do, bởi vì, nguyên do, tự do (由于 do/bởi vì, 自由 tự do, 理由 lý do). _(Khang Hy xếp bộ `田`.)_                          |
| 甲      | jiǎ    | Giáp     | _(nét sổ thò xuống dưới `田`)_  | Gốc tượng hình vết nứt mai rùa hoặc áo giáp bảo vệ, KHÔNG phải ruộng; nghĩa: thiên can Giáp, lớp vỏ cứng/móng, đứng đầu (指甲 móng tay, 盔甲 áo giáp, 甲乙 Giáp Ất). _(Khang Hy xếp bộ `田`.)_ |
| 申      | shēn   | Thân     | _(nét sổ xuyên trên–dưới `田`)_ | Gốc tượng hình tia chớp kéo dài, KHÔNG phải ruộng; nghĩa: duỗi/bày tỏ, thưa trình, địa chi Thân (申请 xin/đăng ký, 申明 tuyên bố rõ, 重申 nhắc lại). _(Khang Hy xếp bộ `田`.)_                 |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `思` (`sī` · Tư): `田` trên `心`; phần trên vốn là hình **hộp sọ/não** (không phải ruộng), chữ xếp bộ `心` (`思考` suy nghĩ, `意思` ý nghĩa).
- `细` (`xì` · Tế): `纟` + `田`; phần `田` vốn là biến thể hình hộp sọ/hạt nhỏ, xếp bộ `糸` (`仔细` cẩn thận, `细胞` tế bào).
- `累` (`lèi / lěi` · Lũy): `田` trên `糸` (phần `田` rút gọn từ nhiều vòng dây buộc/ruộng chồng), xếp bộ `糸` (`好累` mệt quá, `积累` tích lũy).
- `胃` (`wèi` · Vị): `田` trên `月` (nhục/thịt — phần `田` tượng hình túi dạ dày chứa cơm gạo); xếp bộ `肉/月` (`胃口` khẩu vị, `肠胃` dạ dày ruột).
- `猫` (`māo` · Miêu): `犭` + `苗` (`艹 + 田`, thanh phù _miáo_ -> _māo_); xếp bộ `犬` (`小猫` mèo con).
- `果` (`guǒ` · Quả): hình quả tròn trên cành cây `木` (KHÔNG phải ruộng `田`); xếp bộ `木` (`水果` hoa quả, `结果` kết quả).
- `当 / 當`, `异 / 異`, `毕 / 畢`, `叠 / 疊`: dạng phồn thể đều có `田` rõ rệt (`當`, `異`, `畢`, `疊`), khi giản thể hóa đã biến đổi nét nên không còn thấy `田`.
- `日` (bộ Nhật, 4 nét): khác `田` (5 nét) ở chỗ chỉ có một nét ngang bên trong, không có nét sổ chia bốn ô.

---

## Bộ 52: 食 (Thực)

### 1. Thông tin khớp DB hiện tại (`hanzihome_radicals`)

- **DB ID & Thứ tự:**
  - `id`: `radical-024`
  - `radical_index`: `24`
  - `radical`: `食`
  - `name_vi`: `bộ Thực`
  - `strokes`: `9` nét _(dạng đầy đủ `食` 9 nét; dạng giản thể bên trái `饣` 3 nét; dạng phồn thể bên trái `飠` 8 nét)_
  - **Ghi chú dòng trùng / rỗng:** Trong DB có thêm 1 dòng rỗng phụ là **`radical-216`** (`radical_index: 216`, `radical: "食 / 饣"`, `name_vi: null`, `strokes: null`, `core_meaning: {}`) cần lưu ý xử lý/gộp khi làm sạch dữ liệu.
- **Hình thái & Biến thể (`variants`):**
  - `食` — dạng đầy đủ (9 nét), đứng độc lập hoặc nằm bên dưới chữ (`餐`, phồn `養`).
  - `飠` — thực bàng phồn thể (8 nét), thường đứng bên trái chữ (`飯, 飲, 餓, 飽`).
  - `饣` — thực bàng giản thể (3 nét), thường đứng bên trái chữ hiện đại (`饭, 饮, 饿, 饱, 饺, 饼, 馆`).
- **Ý nghĩa cốt lõi (`core_meaning`):**
  - **Nguồn gốc / Lục thư (`history` — DB):** _ăn, thức ăn; hình liên quan đồ ăn/miệng ăn._ (Chữ giáp cốt vẽ cái bát cao chân đựng cơm đầy và có nắp đậy úp bên trên.)
  - **Ý nghĩa hiện đại & Logic chuyển nghĩa (`modern` — DB):** _ăn uống, thức ăn, cơm, đói/no, nuôi dưỡng, món ăn._ (Logic chuyển nghĩa: từ bát cơm và hành động ăn (`食, 饭, 餐, 饮`) -> các loại bánh/món ăn chế biến (`饺, 饼, 馒, 馅`) -> trạng thái dạ dày/cơn thèm (`饿, 饱, 饥, 馋`) -> quán xá đãi cơm cho khách (`馆`), chăn nuôi cho ăn (`饲`), ăn mòn (`蚀`), dồi dào cơm áo (`饶`) và dâng thức ăn làm quà biếu (`馈`).)
- **Nhận diện & Phân biệt (`recognition` & `distinguish`):**
  - **Nhận diện (`recognition` — DB):** _Có 食 / 飠 / 饣 thường liên quan ăn uống, thức ăn, vị giác, đói/no, nuôi dưỡng._
  - **Phân biệt (`distinguish` — DB & mở rộng):**
    - `饣` (3 nét) là dạng giản thể cực quan trọng của `飠` / `食` bên trái: `饭, 饮, 饿, 饱, 饺, 饼, 馆`.
    - **`食/饣` vs `口` (bộ Khẩu):** `食/饣` thiên về **thức ăn, cơm bánh, đói/no, nuôi dưỡng** (`饭, 饿, 饱`), còn `口` thiên về **miệng và động tác dùng miệng trực tiếp** như ăn, uống, nuốt, nhai (`吃, 喝, 喂, 咬`).
    - **`食/饣` vs `米` (bộ Mễ):** `米` thiên về **hạt gạo, ngũ cốc, bột và bánh ngọt từ bột** (`糖, 糕, 粉, 粮`), còn `食/饣` thiên về **bữa ăn, món ăn, hành động và cảm giác ăn uống**.
    - **Cẩn thận chữ `饣` vs `钅` / `讠`:** `饣` (3 nét: `ノ`, `乛`, `し` — đầu phẩy + móc gập + sổ hất) khác `讠` (bộ Ngôn, có chấm trên đầu `丶`) và `钅` (bộ Kim, có 3 nét ngang bên trong).

### 2. Giải nghĩa chữ Hán thông dụng & Thiên bàng đứng chung (theo Nhóm nghĩa `groups`)

### Nhóm 1: Bữa ăn, cơm & các món ăn thông dụng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                 |
| ------- | ------ | -------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 食      | shí    | Thực     | _(độc lập)_           | Tượng hình bát đựng cơm đầy có nắp đậy bên trên; nghĩa: ăn, thức ăn, nhật/nguyệt thực (食物 thức ăn, 食品 thực phẩm, 饮食 ăn uống, 日食 nhật thực).            |
| 饭      | fàn    | Phạn     | 反 (phản)             | Phồn thể `飯`: `饣` (thức ăn) + `反` (thanh phù _fǎn_ -> _fàn_); nghĩa: cơm, bữa ăn (吃饭 ăn cơm, 米饭 cơm trắng, 早饭 bữa sáng).                              |
| 饺      | jiǎo   | Giảo     | 交 (giao)             | Phồn thể `餃`: `饣` (món ăn) + `交` (thanh phù _jiāo_ -> _jiǎo_); nghĩa: bánh chẻo, sủi cảo (饺子 bánh chẻo/sủi cảo, 水饺 sủi cảo luộc, 蒸饺 há cảo hấp).      |
| 饼      | bǐng   | Bính     | 并 (tịnh)             | Phồn thể `餅`: `饣` (món ăn) + `并` (thanh phù _bìng_ -> _bǐng_); nghĩa: bánh dẹt, bánh nướng, bánh quy (月饼 bánh trung thu, 饼干 bánh quy, 煎饼 bánh kếp).   |
| 馒      | mán    | Man      | 曼 (mạn)              | Phồn thể `饅`: `饣` (món ăn) + `曼` (thanh phù _màn_ -> _mán_); gặp trong `馒头` (_mántou_) — bánh bao không nhân / bánh màn thầu.                             |
| 馅      | xiàn   | Hãm      | 臽 (hãm)              | Phồn thể `餡`: `饣` (món ăn) + `臽` (thanh phù _xiàn_); nghĩa: nhân bánh (肉馅 nhân thịt, 馅饼 bánh có nhân, 露馅 lộ tẩy / hở nhân).                           |
| 餐      | cān    | Xan      | 𣦻 (`歺 + 又`)        | `𣦻` (tay cầm thìa/thức ăn, thanh phù _cān_, ở trên) + `食` (dạng đầy đủ ở dưới); nghĩa: bữa ăn, ăn uống (餐厅 nhà hàng/phòng ăn, 早餐 bữa sáng, 西餐 món Âu). |

### Nhóm 2: Ăn uống, tiếp đãi, chăn nuôi & tác động

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                                                      |
| ------- | ------ | -------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 饮      | yǐn    | Ẩm       | 欠 (khiếm)            | Phồn thể `飲`: `饣` (đồ ăn uống) + `欠` (người há miệng uống); nghĩa: uống, đồ uống (饮料 đồ uống, 饮水 nước uống, 饮食 ẩm thực / ăn uống).                                                         |
| 馆      | guǎn   | Quán     | 官 (quan)             | Phồn thể `館`: `饣` (gốc là trạm khách tiếp đãi cơm ăn!) + `官` (thanh phù _guān_ -> _guǎn_); nghĩa: quán ăn, nhà khách, cơ sở công cộng/văn hóa (饭馆 quán cơm, 图书馆 thư viện, 博物馆 bảo tàng). |
| 饲      | sì     | Tự       | 司 (tư)               | Phồn thể `飼`: `饣` (cho ăn) + `司` (thanh phù _sī_ -> _sì_); nghĩa: cho ăn, nuôi dưỡng, chăn nuôi (饲养 chăn nuôi, 饲料 thức ăn gia súc).                                                          |
| 饰      | shì    | Sức      | `𠂉 + 巾`             | Phồn thể `飾`: `饣` (lau sạch đồ ăn) + `𠂉 + 巾` (khăn lau); nghĩa mở rộng: trang điểm, trang sức, đóng vai (装饰 trang trí, 首饰 đồ trang sức, 饰演 đóng vai).                                     |
| 蚀      | shí    | Thực     | 虫 (trùng)            | Phồn thể `蝕`: `饣` (ăn) + `虫` (sâu bọ gặm nhấm); nghĩa: ăn mòn, gặm khuyết, nhật/nguyệt thực (腐蚀 ăn mòn, 侵蚀 xâm thực, 日蚀 nhật thực).                                                        |
| 饶      | ráo    | Nhiêu    | 尧 (nghiêu)           | Phồn thể `饒`: `饣` (lương thực dư dả) + `尧` (thanh phù _yáo_ -> _ráo_); nghĩa: dồi dào, tha thứ, thêm vào (富饶 trù phú, 饶恕 tha thứ, 求饶 xin tha).                                             |

### Nhóm 3: Đói, no, thèm ăn & biếu tặng

| Chữ Hán | Pinyin | Hán Việt | Thiên bàng đứng chung | Giải nghĩa cấu tạo & ý nghĩa chữ (kèm từ ghép)                                                                                                                     |
| ------- | ------ | -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 饿      | è      | Ngạ      | 我 (ngã)              | Phồn thể `餓`: `饣` (cơm ăn) + `我` (thanh phù _wǒ_ -> _è_); nghĩa: đói, đói bụng (饿了 đói rồi, 饥饿 đói khát, 饿肚子 nhịn đói).                                  |
| 饱      | bǎo    | Bão      | 包 (bao)              | Phồn thể `飽`: `饣` (cơm ăn) + `包` (thanh phù _bāo_ -> _bǎo_ kiêm ý bụng căng tròn); nghĩa: no bụng, căng đầy (吃饱 ăn no, 饱满 căng đầy/sung mãn, 饱和 bão hòa). |
| 饥      | jī     | Cơ       | 几 (kỷ)               | Phồn thể `饑 / 飢`: `饣` (lương thực) + `几` (thanh phù _jī_); nghĩa: đói kém, mất mùa (饥饿 đói khát, 饥荒 nạn đói).                                              |
| 馋      | chán   | Sàm      | 毚 (sàm)              | Phồn thể `饞`: `饣` (thức ăn) + phần phải rút gọn từ `毚` (thanh phù); nghĩa: thèm ăn, tham ăn (嘴馋 háu ăn/thèm ăn, 眼馋 thèm thuồng).                            |
| 馈      | kuì    | Quỹ      | 贵 (quý)              | Phồn thể `饋`: `饣` (dâng thức ăn làm lễ biếu) + `贵` (thanh phù _guì_ -> _kuì_); nghĩa: tặng quà, phản hồi lại (反馈 phản hồi, 馈赠 tặng biếu).                   |
| 饵      | ěr     | Nhĩ      | 耳 (nhĩ)              | Phồn thể `餌`: `饣` (thức ăn/bánh) + `耳` (thanh phù _ěr_); nghĩa: bánh ăn cổ, mồi nhử, mồi câu (诱饵 mồi nhử, 鱼饵 mồi câu cá).                                   |

### 3. Thành phần liên quan / Chữ chứa bộ ở vị trí phụ nhưng xếp ở bộ khác (`related_components`)

- `养 / 養` (`yǎng` · Dưỡng): phồn thể `養` là `羊` (dê) trên `食` (nuôi ăn -> nuôi dưỡng), xếp bộ `食`; giản thể `养` rút gọn đáy thành dạng `丷/羊`, tra bộ `丷/羊` (`营养` dinh dưỡng, `培养` bồi dưỡng).
- `余 / 餘` (`yú` · Dư): phồn thể `餘` là `飠` + `余` mang nghĩa thừa thức ăn/dư dả (bộ `食`); giản thể dùng chung `余` (bộ `人`), nghĩa: dư thừa (`多余` dư thừa, `业余` nghiệp dư).
- `良` (`liáng` · Lương): phần dưới của chữ `食` nhìn rất giống `良` (gốc là hình cái sàng/kho lương, không phải bộ `食`); là linh kiện trong `食, 娘, 浪, 狼`, xếp bộ `艮` (`良好` tốt đẹp).
- `口` (bộ Khẩu): miệng/ăn uống trực tiếp, gặp trong các động từ ăn uống dùng miệng như `吃, 喝, 喂`, là bộ riêng.
- `米` (bộ Mễ): hạt gạo/ngũ cốc/bánh kẹo từ bột gạo (`糖, 糕, 粉, 粮`), là bộ riêng cùng trường ẩm thực.
