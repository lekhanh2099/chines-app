import { describe, expect, it } from "vitest";

import { parseLessonDraftImport } from "@/features/hanzihome/lesson-drafts/import-parser";

describe("parseLessonDraftImport", () => {
  it("parses quick glossary vocab lines", () => {
    const result = parseLessonDraftImport(`
**哈尔滨**: Cáp Nhĩ Tân, thành phố miền Đông Bắc.

**海南岛**: đảo Hải Nam, khí hậu nóng/ấm hơn.

**北京**: Bắc Kinh.

**西安**: Tây An, cố đô.
`);

    expect(result.kind).toBe("quick_glossary");
    expect(result.vocabItems).toHaveLength(4);
    expect(result.vocabItems[0]?.word).toBe("哈尔滨");
    expect(result.vocabItems[0]?.meaning).toContain("Cáp Nhĩ Tân");
  });

  it("parses full vocab markdown separated by horizontal rules and bold headings", () => {
    const result = parseLessonDraftImport(`
**故宫 – gùgōng – Cố Cung – Tử Cấm Thành / Cố Cung**

*Danh từ riêng / Danh thắng 【专名】*

**1. Hán Việt & Liên hệ Tiếng Việt**

**故宫** là Cố Cung.

**4. Kết hợp thường gặp**

1. **参观故宫** – tham quan Cố Cung

**5. Ví dụ**

1. 中文: 我们明天去参观故宫。
Pinyin: Wǒmen míngtiān qù cānguān Gùgōng.
Dịch: Ngày mai chúng tôi đi tham quan Cố Cung.

**7. Lưu ý**

Không nên dịch máy móc.

---

**参观故宫 – cānguān Gùgōng – Tham quan Cố Cung – tham quan Cố Cung**

**1. Hán Việt & Liên hệ Tiếng Việt**

Đây là cụm động-tân.

**5. Ví dụ**

1. 中文: 我想参观故宫。
Pinyin: Wǒ xiǎng cānguān Gùgōng.
Dịch: Tôi muốn tham quan Cố Cung.
`);

    expect(result.vocabItems).toHaveLength(2);
    expect(result.vocabItems[0]?.word).toBe("故宫");
    expect(result.vocabItems[1]?.word).toBe("参观故宫");
    expect(result.vocabItems[0]?.sections.warning).not.toContain("参观故宫");
    expect(result.vocabItems[0]?.collocations[0]?.phrase).toBe("参观故宫");
  });

  it("parses short grammar outline", () => {
    const result = parseLessonDraftImport(`
BÀI 23: 寒假你打算去哪儿旅行

1. Cách dùng mở rộng của đại từ nghi vấn
Công dụng: Đại từ nghi vấn không dùng để hỏi.
Cấu trúc: 什么 + 都/也 + 肯定/否定
吃什么都可以。(Ăn gì cũng được.)

2. Hai hành động đồng thời: 一边……一边……
Công dụng: Diễn tả hai hành động xảy ra đồng thời.
Cấu trúc: 一边 + Động từ 1 + 一边 + Động từ 2
一边走路一边听音乐。(Vừa đi đường vừa nghe nhạc.)

3. Thứ tự động tác liên tiếp: 先……再……然后……最后……
Công dụng: Diễn tả trình tự các hành động xảy ra lần lượt.
Cấu trúc: 先 + A + 再 + B + 然后 + C + 最后 + D
你先写作业，再看电视。(Bạn làm bài tập trước, rồi xem TV sau.)

Từ vựng: 渴，点菜，好吃
Tên riêng: 重庆，长江
`);

    expect(result.kind).toBe("grammar_batch");
    expect(result.grammarPoints).toHaveLength(3);
    expect(result.grammarPoints[0]?.title).toContain("đại từ nghi vấn");
    expect(result.lessonNotes?.vocabularyText).toContain("渴");
    expect(result.lessonNotes?.properNounsText).toContain("重庆");
  });

  it("keeps application section as lesson notes in mixed lesson markdown", () => {
    const result = parseLessonDraftImport(`
# BÀI 23: 寒假你打算去哪儿旅行

## PHẦN I: ĐẠI TỪ NGHI VẤN MỞ RỘNG

**Công thức chuẩn:**
> Đại từ nghi vấn + 都/也 + Động từ

- *谁都认识他。* (Ai cũng quen anh ta.)

## PHẦN II: "一边……一边……"

**Công thức chuẩn:**
> 一边 + Hành động 1 + 一边 + Hành động 2

- *一边吃饭一边聊天。* (Vừa ăn cơm vừa trò chuyện.)

## PHẦN III: TRÌNH TỰ LIÊN TIẾP

**Công thức chuẩn:**
> 先 + A + 再 + B + 然后 + C + 最后 + D

- *你先写作业，再看电视。* (Bạn làm bài tập trước rồi xem TV.)

## PHẦN IV: ĐIỂN TÍCH & ỨNG DỤNG HÀNG NGÀY

桂林山水甲天下。
`);

    expect(result.kind).toBe("lesson_mixed");
    expect(result.grammarPoints).toHaveLength(3);
    expect(result.lessonNotes?.applicationMarkdown).toContain("桂林山水甲天下");
  });
});
