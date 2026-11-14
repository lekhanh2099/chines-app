import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { cookReaderData } from "../model/cook-reader-data";
import { ReaderProvider } from "./ReaderProvider";
import { defaultReaderDisplay } from "../model/reader-display";
import {
 useReaderDisplay,
 useReaderSegmentIds,
 useReaderSegment,
 useReaderServices,
} from "./reader-context";

function Segment({ id }: { id: string }) {
 const segment = useReaderSegment(id);
 const { value: display } = useReaderDisplay();
 const services = useReaderServices();
 return (
  <p data-speech={Boolean(services.speech)}>
   {segment?.zh}
   {display.showPinyin ? segment?.pinyin : null}
  </p>
 );
}

function Content() {
 const ids = useReaderSegmentIds();
 return ids.map((id) => <Segment key={id} id={id} />);
}

describe("Reader provider", () => {
 it("supplies scoped content and optional services without the Mandarin provider", () => {
  const html = renderToStaticMarkup(
   <>
    <ReaderProvider
     content={cookReaderData([{ id: "same", zh: "你好", pinyin: "nǐ hǎo" }])}
     display={{ ...defaultReaderDisplay, showPinyin: false }}
    >
     <Content />
    </ReaderProvider>
    <ReaderProvider content={cookReaderData([{ id: "same", zh: "再见", pinyin: "zài jiàn" }])}>
     <Content />
    </ReaderProvider>
   </>,
  );
  expect(html).toBe('<p data-speech="false">你好</p><p data-speech="false">再见zài jiàn</p>');
 });

 it("requires a scoped provider for content hooks", () => {
  expect(() => renderToStaticMarkup(<Content />)).toThrow("Reader hooks require ReaderProvider");
 });
});
