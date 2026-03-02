"use client";

import { WordData } from "./LessonWorkspace";

type ReadingFrameProps = {
 content: string;
 dictionary: Record<string, WordData>;
 onWordSelect: (word: string) => void;
};

export function ReadingFrame({
 content,
 dictionary,
 onWordSelect,
}: ReadingFrameProps) {
 // A simple function to parse the text and replace dictionary words with spans
 // In a real app, this might need a more sophisticated tokenizer (e.g., node-segment)
 const renderContent = () => {
  const words = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  let elements: React.ReactNode[] = [content];

  for (const word of words) {
   elements = elements.flatMap((el, idx) => {
    if (typeof el !== "string") return [el];

    const parts = el.split(word);
    const result: React.ReactNode[] = [];
    parts.forEach((part, i) => {
     result.push(part);
     if (i < parts.length - 1) {
      result.push(
       <span
        key={`${word}-${idx}-${i}`}
        onClick={() => onWordSelect(word)}
        className="bg-blue-50 text-blue-700 border-b-2 border-blue-200 cursor-pointer transition hover:bg-blue-100 px-1 mx-0.5 rounded-sm"
       >
        {word}
       </span>,
      );
     }
    });
    return result;
   });
  }

  return elements;
 };

 return (
  <div className="bg-white p-6 rounded-3xl shadow-sm">
   <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
    Bài khóa
   </h2>
   <div className="text-2xl leading-loose text-slate-800 font-medium">
    {renderContent()}
   </div>
  </div>
 );
}
