"use client";

import { Tabs } from "@base-ui/react";

export function ExerciseFrame() {
 const words = ["你好", "高兴", "认识", "我", "学习", "中文"];

 return (
  <div className="bg-white p-6 rounded-3xl shadow-sm mt-4">
   <Tabs.Root defaultValue="dien-tu">
    <Tabs.List className="flex border-b border-slate-200 mb-6 w-full">
     <Tabs.Tab
      value="trac-nghiem"
      className="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 data-[selected]:text-indigo-600 data-[selected]:border-b-2 data-[selected]:border-indigo-600 outline-none transition-colors"
     >
      Trắc Nghiệm
     </Tabs.Tab>
     <Tabs.Tab
      value="dung-sai"
      className="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 data-[selected]:text-indigo-600 data-[selected]:border-b-2 data-[selected]:border-indigo-600 outline-none transition-colors"
     >
      Đúng/Sai
     </Tabs.Tab>
     <Tabs.Tab
      value="dien-tu"
      className="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 data-[selected]:text-indigo-600 data-[selected]:border-b-2 data-[selected]:border-indigo-600 outline-none transition-colors"
     >
      Điền Từ
     </Tabs.Tab>
    </Tabs.List>

    <Tabs.Panel value="trac-nghiem" className="outline-none">
     <p className="text-slate-500">
      Nội dung câu hỏi trắc nghiệm sẽ hiển thị ở đây.
     </p>
    </Tabs.Panel>

    <Tabs.Panel value="dung-sai" className="outline-none">
     <p className="text-slate-500">
      Nội dung câu hỏi đúng/sai sẽ hiển thị ở đây.
     </p>
    </Tabs.Panel>

    <Tabs.Panel value="dien-tu" className="outline-none">
     {/* Word Bank */}
     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 mb-8">
      {words.map((w, idx) => (
       <div
        key={idx}
        className="bg-white px-4 py-2 rounded-full shadow-sm cursor-grab border border-slate-200 hover:border-indigo-400 font-medium text-slate-800 select-none active:cursor-grabbing transition-colors"
        draggable
       >
        {w}
       </div>
      ))}
     </div>

     {/* Exercise content */}
     <div className="text-lg text-slate-800 font-medium leading-loose">
      <p className="mb-6">
       1. Bố mẹ bạn có khỏe không?
       <br />
       <span className="text-slate-500 text-base">Nỉ ba ba mā ma </span>
       <span className="inline-block min-w-[80px] h-8 border-b-2 border-dashed border-slate-400 bg-slate-50 mx-2 align-bottom cursor-pointer hover:bg-slate-100 transition"></span>
       <span className="text-slate-500 text-base"> ma?</span>
      </p>

      <p>
       2. Rất vui được quen biết bạn.
       <br />
       <span className="inline-block min-w-[80px] h-8 border-b-2 border-dashed border-slate-400 bg-indigo-50 mx-2 align-bottom cursor-pointer relative top-1">
        <span className="absolute inset-0 flex items-center justify-center text-indigo-700 font-bold">
         认识
        </span>
       </span>
       <span className="text-slate-500 text-base"> nǐ hěn </span>
       <span className="inline-block min-w-[80px] h-8 border-b-2 border-dashed border-slate-400 bg-slate-50 mx-2 align-bottom cursor-pointer hover:bg-slate-100 transition"></span>
       <span className="text-slate-500 text-base">.</span>
      </p>
     </div>
    </Tabs.Panel>
   </Tabs.Root>
  </div>
 );
}
