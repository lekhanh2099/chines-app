"use client";

import { WordData } from "./LessonWorkspace";

type InspectorPanelProps = {
 word: string | null;
 data: WordData | null;
 onClose: () => void;
};

export function InspectorPanel({ word, data, onClose }: InspectorPanelProps) {
 if (!word || !data) {
  // Default state: Notes
  return (
   <div className="bg-white p-6 rounded-3xl shadow-sm h-full flex flex-col">
    <h2 className="text-xl font-bold text-slate-800 mb-4">Ghi chú Bài học</h2>
    <textarea
     className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
     placeholder="Nhập ghi chú của bạn ở đây..."
    />
    <button className="mt-4 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition duration-200 w-full shadow-sm">
     Lưu Ghi Chú
    </button>
   </div>
  );
 }

 // Active state: Inspector
 return (
  <div className="bg-white p-6 rounded-3xl shadow-sm h-full flex flex-col overflow-y-auto relative">
   <button
    onClick={onClose}
    className="absolute top-6 right-6 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition"
   >
    [Đóng / Ghi chú]
   </button>

   {/* Header */}
   <div className="text-center mt-4 mb-6">
    <h1 className="text-6xl font-bold text-slate-900">{word}</h1>
    <div className="flex justify-between items-center text-slate-500 mt-4 px-4 font-medium">
     <span className="text-lg">{data.pinyin}</span>
     <span className="text-lg text-indigo-600">{data.meaning}</span>
    </div>
   </div>

   {/* Body Blocks */}
   <div className="flex-1 flex flex-col gap-4">
    <div className="bg-slate-50 p-4 rounded-2xl">
     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
      Chiết tự
     </h3>
     <p className="text-slate-800 font-medium">{data.components}</p>
    </div>

    <div className="bg-slate-50 p-4 rounded-2xl">
     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
      Core Logic
     </h3>
     <p className="text-slate-800 font-medium">{data.logic}</p>
    </div>

    <div className="bg-slate-50 p-4 rounded-2xl border border-rose-100 bg-rose-50/50">
     <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-2">
      Bẫy Tiếng Việt
     </h3>
     <p className="text-rose-900 font-medium">{data.trap}</p>
    </div>

    <div className="bg-slate-50 p-4 rounded-2xl">
     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
      Ví dụ thực chiến
     </h3>
     <p className="text-slate-800 font-medium text-lg">{data.example}</p>
    </div>
   </div>

   <button className="mt-6 border-2 border-indigo-100 text-indigo-700 font-semibold py-3 px-6 rounded-xl hover:bg-indigo-50 transition duration-200 w-full">
    Chỉnh sửa Note này
   </button>
  </div>
 );
}
