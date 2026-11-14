import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { GrammarViewModel } from "@/features/hanzihome/types";

vi.mock("server-only", () => ({}));

vi.mock("@/features/hanzihome/listening/MandarinSpeakButton", () => ({
 MandarinSpeakButton: ({ text, touchTarget }: { text: string; touchTarget?: boolean }) => (
  <button type="button" data-touch-target={touchTarget}>
   Nghe {text}
  </button>
 ),
}));

import { StructuredGrammarContent } from "./StructuredGrammarContent";
import { getStaticStudioLessonDetail } from "@/features/hanzihome/static-json/studio-static-content";

const point: GrammarViewModel = {
 id: "grammar-01",
 cleanTitle: "虽然……但是……",
 core: "Biểu thị quan hệ nhượng bộ.",
 structuresView: [],
 examplesParsed: [
  {
   id: "grammar-01-example-01",
   zh: "虽然下雨，但是我们还是出门了。",
   pinyin: "Suīrán xiàyǔ, dànshì wǒmen háishi chūmén le.",
   vi: "Tuy trời mưa nhưng chúng tôi vẫn ra ngoài.",
  },
 ],
 notes: [],
 detailSections: [],
};

describe("StructuredGrammarContent", () => {
 it("renders a Mandarin speech action next to each structured example", () => {
  const html = renderToStaticMarkup(<StructuredGrammarContent point={point} />);

  expect(html).toContain("虽然下雨，但是我们还是出门了。");
  expect(html).toContain("Nghe 虽然下雨，但是我们还是出门了。");
  expect(html).toContain('data-touch-target="true"');
  expect(html).toContain("font-hanzi");
 });

 it.each(["source", "verification", "categories"])(
  "keeps examples and pitfalls before collapsed %s details without dropping their content",
  (key) => {
   const html = renderToStaticMarkup(
    <StructuredGrammarContent
     point={{
      ...point,
      notes: ["Không bỏ 但是 khi cần nhấn mạnh sự tương phản."],
      detailSections: [
       {
        id: "grammar-01-source",
        key,
        title: "Nguồn",
        lines: ["Tài liệu ngữ pháp HSK."],
       },
      ],
     }}
    />,
   );

   expect(html.indexOf("Ví dụ nhanh")).toBeLessThan(html.indexOf("Lưu ý / bẫy sai"));
   expect(html.indexOf("Lưu ý / bẫy sai")).toBeLessThan(html.indexOf("<details"));
   expect(html.match(/<details\b[^>]*>/)?.[0]).not.toContain("open=");
   expect(html).toContain("Tài liệu ngữ pháp HSK.");
   expect(html.indexOf("Tài liệu ngữ pháp HSK.")).toBeGreaterThan(html.indexOf("<details"));
  },
 );

 it("keeps teaching sections outside the metadata disclosures", () => {
  const html = renderToStaticMarkup(
   <StructuredGrammarContent
    point={{
     ...point,
     detailSections: [
      {
       id: "grammar-01-examples",
       key: "examples",
       title: "Ví dụ trong ngữ cảnh",
       lines: ["虽然很累，但是她没有放弃。"],
      },
      {
       id: "grammar-01-verification",
       key: "verification",
       title: "Kiểm chứng",
       lines: ["Đã đối chiếu tài liệu."],
      },
     ],
    }}
   />,
  );

  expect(html).not.toContain("Ví dụ nhanh");
  expect(html.match(/<details\b[^>]*>/)?.[0]).not.toContain("open=");
  expect(html).toContain("虽然很累");
  expect(html).toContain("但是她没有放弃");
  expect(html.indexOf("虽然很累")).toBeLessThan(html.indexOf("<details"));
 });

 it("keeps reference details open in edit mode", () => {
  const html = renderToStaticMarkup(
   <StructuredGrammarContent
    editMode
    point={{
     ...point,
     detailSections: [
      {
       id: "grammar-01-source",
       key: "source",
       title: "Nguồn",
       lines: ["Tài liệu ngữ pháp HSK."],
      },
     ],
    }}
   />,
  );

  expect(html.match(/<details\b[^>]*>/)?.[0]).toContain('open=""');
 });

 it("preserves the displayed teaching and reference content of the real first HSK1 point", () => {
  const hskPoint = getStaticStudioLessonDetail("hanzihome-studio-grammar:lesson:HSK1")?.grammar[0];
  if (!hskPoint) throw new Error("The first HSK1 grammar point must exist.");

  const html = renderToStaticMarkup(<StructuredGrammarContent point={hskPoint} />);
  const text = html.replace(/<[^>]*>/g, "");

  expect(text).toContain(hskPoint.core);
  for (const structure of hskPoint.structuresView) {
   expect(text).toContain(structure);
  }
  for (const example of hskPoint.examplesParsed) {
   expect(text).toContain(example.zh);
   expect(text).toContain(example.pinyin);
   expect(text).toContain(example.vi);
  }
  for (const note of hskPoint.notes) {
   expect(text).toContain(note);
  }
  for (const section of hskPoint.detailSections ?? []) {
   expect(text).toContain(section.title);
   for (const line of section.lines) {
    expect(text).toContain(line);
   }
  }
  expect(html.match(/<details\b/g)).toHaveLength(3);
  expect(html.match(/<details\b[^>]*>/g)?.every((tag) => !tag.includes("open="))).toBe(true);
  expect(html.indexOf("Ví dụ nhanh")).toBeLessThan(html.indexOf("<details"));
 });
});
