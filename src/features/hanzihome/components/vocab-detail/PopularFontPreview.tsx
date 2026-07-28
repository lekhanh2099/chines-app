export function PopularFontPreview({ word }: { word: string }) {
 return (
  <span className="font-popular-xingkai block truncate text-6xl leading-none text-text-primary sm:text-7xl">
   {word}
  </span>
 );
}
