import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { renderMarkdownInline } from "./markdown-inline";

export function MarkdownParagraph({ text }: { text: string }) {
 return (
  <StudyInstructionText tone="secondary" leading="relaxed" wrapping="preLine">
   {renderMarkdownInline(text)}
  </StudyInstructionText>
 );
}
