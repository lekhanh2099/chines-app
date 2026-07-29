import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
export function PopularFontPreview({ word }: { word: string }) {
 return (
  <HanziText as="span" font="popular" size="detail" leading="none" clamp="one" className="block">
   {word}
  </HanziText>
 );
}
