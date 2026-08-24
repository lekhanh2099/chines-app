import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { GrammarViewModel } from "@/features/hanzihome/types";

vi.mock("@/features/hanzihome/listening/MandarinSpeakButton", () => ({
 MandarinSpeakButton: ({ text, touchTarget }: { text: string; touchTarget?: boolean }) => (
  <button type="button" data-touch-target={touchTarget}>
   Nghe {text}
  </button>
 ),
}));

import { StructuredGrammarContent } from "./StructuredGrammarContent";

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
});
