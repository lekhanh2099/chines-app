import { renderMarkdownInline } from "./markdown-inline";

export function MarkdownParagraph({ text }: { text: string }) {
 return (
  <p className="whitespace-pre-line leading-relaxed text-text-secondary">
   {renderMarkdownInline(text)}
  </p>
 );
}
