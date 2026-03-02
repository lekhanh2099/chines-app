"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
 ArrowLeft,
 Volume2,
 BookmarkPlus,
 CheckCircle,
 Loader2,
 Pen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pinyin as getPinyin } from "pinyin-pro";
import { extractChinese } from "@/lib/chinese-utils";
import { toast } from "sonner";
import type { VocabData } from "@/stores/inspector-store";

export default function DictionaryPage() {
 const params = useParams();
 const hanzi = decodeURIComponent(params.hanzi as string);
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 const [vocabData, setVocabData] = useState<VocabData | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [isSaved, setIsSaved] = useState(false);
 const [personalNote, setPersonalNote] = useState("");

 const hanziContainerRef = useRef<HTMLDivElement>(null);
 const writerRef = useRef<ReturnType<typeof Object> | null>(null);

 const fetchData = useCallback(async () => {
  setIsLoading(true);
  const chineseText = extractChinese(hanzi) || hanzi;
  const pinyinText = getPinyin(chineseText);

  try {
   const { data: vocab } = await supabase
    .from("vocabularies")
    .select("*")
    .eq("hanzi", chineseText)
    .single();

   if (vocab) {
    setVocabData({
     id: vocab.id,
     hanzi: vocab.hanzi,
     pinyin: vocab.pinyin || pinyinText,
     meaning: vocab.meaning || "",
     ai_analysis: vocab.ai_analysis || {},
    });
   } else {
    setVocabData({
     hanzi: chineseText,
     pinyin: pinyinText,
     meaning: "",
     ai_analysis: {},
    });
   }
  } catch {
   setVocabData({
    hanzi: chineseText,
    pinyin: pinyinText,
    meaning: "",
    ai_analysis: {},
   });
  }

  setIsLoading(false);
 }, [hanzi]);

 useEffect(() => {
  fetchData();
 }, [fetchData]);

 useEffect(() => {
  if (
   !vocabData?.hanzi ||
   !hanziContainerRef.current ||
   typeof window === "undefined"
  )
   return;

  const container = hanziContainerRef.current;
  container.innerHTML = "";

  const chars = vocabData.hanzi.split("");

  import("hanzi-writer").then((HanziWriterModule) => {
   const HanziWriter = HanziWriterModule.default;
   chars.forEach((char) => {
    if (/[\u4e00-\u9fff]/.test(char)) {
     const charDiv = document.createElement("div");
     charDiv.style.display = "inline-block";
     container.appendChild(charDiv);

     try {
      const writer = HanziWriter.create(charDiv, char, {
       width: 160,
       height: 160,
       padding: 10,
       strokeAnimationSpeed: 1,
       delayBetweenStrokes: 200,
       strokeColor: "var(--text-primary)",
       radicalColor: "var(--accent)",
       outlineColor: "var(--border)",
       drawingColor: "var(--accent)",
       showOutline: true,
       showCharacter: false,
      });
      writer.animateCharacter();
      writerRef.current = writer;
     } catch {
      charDiv.textContent = char;
      charDiv.style.fontSize = "100px";
      charDiv.style.fontWeight = "bold";
     }
    }
   });
  });

  return () => {
   container.innerHTML = "";
  };
 }, [vocabData?.hanzi]);

 const handleSpeak = () => {
  if (!vocabData) return;
  const utterance = new SpeechSynthesisUtterance(vocabData.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
 };

 const handleReplay = () => {
  if (
   writerRef.current &&
   typeof (writerRef.current as Record<string, unknown>).animateCharacter ===
    "function"
  ) {
   (writerRef.current as { animateCharacter: () => void }).animateCharacter();
  }
 };

 const handleSave = async () => {
  if (!vocabData || isSaving) return;
  setIsSaving(true);

  try {
   const {
    data: { user },
   } = await supabase.auth.getUser();
   if (!user) return;

   const { data: vocab, error: vocabError } = await supabase
    .from("vocabularies")
    .upsert(
     {
      hanzi: vocabData.hanzi,
      pinyin: vocabData.pinyin,
      meaning: vocabData.meaning || "",
     },
     { onConflict: "hanzi" },
    )
    .select("id")
    .single();

   if (vocabError) throw vocabError;

   if (vocab?.id) {
    await supabase.from("user_vocab_progress").upsert(
     {
      user_id: user.id,
      vocab_id: vocab.id,
      is_favorited: true,
     },
     { onConflict: "user_id,vocab_id" },
    );
   }

   setIsSaved(true);
   toast.success(`Đã thêm "${vocabData.hanzi}" vào kho ôn tập SRS!`);
   setTimeout(() => setIsSaved(false), 3000);
  } catch (error) {
   console.error("Save vocab failed:", error);
   toast.error("Không thể lưu từ vựng");
  } finally {
   setIsSaving(false);
  }
 };

 if (isLoading) {
  return (
   <div className="flex items-center justify-center h-full gap-3">
    <Loader2 className="w-8 h-8 animate-spin text-accent" />
    <span className="text-text-muted">Đang tải dữ liệu...</span>
   </div>
  );
 }

 if (!vocabData) {
  return (
   <div className="flex flex-col items-center justify-center h-full gap-4">
    <p className="text-text-muted">Không tìm thấy từ vựng</p>
    <Link
     href="/vocabulary"
     className="text-accent hover:text-accent-hover font-medium text-sm"
    >
     Quay về kho từ vựng
    </Link>
   </div>
  );
 }

 const ai = vocabData.ai_analysis;

 return (
  <div className="w-full max-w-6xl mx-auto">
   <Link
    href="/vocabulary"
    className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors mb-6"
   >
    <ArrowLeft className="w-4 h-4" />
    Quay về kho từ vựng
   </Link>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-1 bg-bg-card rounded-2xl border border-border-default shadow-theme-sm p-8 flex flex-col items-center">
     <div
      ref={hanziContainerRef}
      className="flex items-center justify-center min-h-40 mb-4"
     />

     <div className="flex items-center gap-3 mb-2">
      <h1 className="text-5xl font-bold text-text-primary">
       {vocabData.hanzi}
      </h1>
      <button
       onClick={handleSpeak}
       className="p-2.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-colors"
      >
       <Volume2 className="w-6 h-6" />
      </button>
      <button
       onClick={handleReplay}
       className="p-2.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-colors"
       title="Xem lại nét viết"
      >
       <Pen className="w-5 h-5" />
      </button>
     </div>

     <p className="text-2xl font-medium text-accent mb-6">{vocabData.pinyin}</p>

     <div className="grid grid-cols-2 gap-3 w-full">
      {vocabData.meaning && (
       <div className="bg-bg-primary rounded-xl p-4 text-center border border-border-default">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
         Nghĩa
        </span>
        <span className="text-sm font-semibold text-text-primary">
         {vocabData.meaning}
        </span>
       </div>
      )}
      {ai?.han_viet && (
       <div className="bg-bg-primary rounded-xl p-4 text-center border border-border-default">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
         Hán-Việt
        </span>
        <span className="text-sm font-semibold text-text-primary">
         {ai.han_viet}
        </span>
       </div>
      )}
      {ai?.word_type && (
       <div className="col-span-2 bg-bg-primary rounded-xl p-4 text-center border border-border-default">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
         Loại từ
        </span>
        <span className="text-sm font-semibold text-text-primary">
         {ai.word_type}
        </span>
       </div>
      )}
     </div>

     <button
      onClick={handleSave}
      disabled={isSaving || isSaved}
      className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-border-default text-sm font-bold text-text-primary hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-60"
     >
      {isSaved ? (
       <>
        <CheckCircle className="w-4 h-4 text-success" />
        Đã lưu vào SRS
       </>
      ) : isSaving ? (
       <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang lưu...
       </>
      ) : (
       <>
        <BookmarkPlus className="w-4 h-4" />
        Lưu vào kho từ vựng
       </>
      )}
     </button>
    </div>

    <div className="lg:col-span-2 flex flex-col gap-6">
     {ai?.etymology && (
      <div className="bg-bg-card rounded-2xl border border-border-default shadow-theme-sm p-6">
       <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
        📖 Chiết tự & Nguồn gốc
       </h3>
       <p className="text-sm text-text-secondary leading-relaxed">
        {ai.etymology}
       </p>
      </div>
     )}

     {ai?.usage_logic && ai.usage_logic.length > 0 && (
      <div className="bg-bg-card rounded-2xl border border-border-default shadow-theme-sm p-6">
       <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
        💡 Tư duy cốt lõi
       </h3>
       <ul className="space-y-2">
        {ai.usage_logic.map((item, i) => (
         <li
          key={i}
          className="text-sm text-text-secondary flex items-start gap-2.5 bg-bg-primary rounded-xl p-3 border border-border-default"
         >
          <span className="text-accent mt-1 text-[8px]">●</span>
          <span className="flex-1">{item}</span>
         </li>
        ))}
       </ul>
      </div>
     )}

     {ai?.vn_trap && (
      <div className="bg-danger-subtle rounded-2xl border border-danger/20 p-6">
       <h3 className="text-sm font-bold text-danger mb-3 flex items-center gap-2">
        ⚠️ Bẫy tiếng Việt
       </h3>
       <p className="text-sm text-danger-text leading-relaxed">{ai.vn_trap}</p>
      </div>
     )}

     {ai?.examples && ai.examples.length > 0 && (
      <div className="bg-bg-card rounded-2xl border border-border-default shadow-theme-sm p-6">
       <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
        📝 Ví dụ thực tế
       </h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ai.examples.map((ex, i) => (
         <div
          key={i}
          className="bg-bg-primary rounded-xl p-4 border border-border-default"
         >
          <p className="text-sm font-medium text-text-primary mb-1">{ex.zh}</p>
          <p className="text-xs text-accent font-medium">{ex.pinyin}</p>
          <p className="text-xs text-text-muted italic mt-0.5">{ex.vi}</p>
         </div>
        ))}
       </div>
      </div>
     )}

     {ai?.collocations && ai.collocations.length > 0 && (
      <div className="bg-bg-card rounded-2xl border border-border-default shadow-theme-sm p-6">
       <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
        🔗 Từ ghép thường gặp
       </h3>
       <div className="flex flex-wrap gap-2">
        {ai.collocations.map((col, i) => (
         <span
          key={i}
          className="text-sm font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-lg"
         >
          {col}
         </span>
        ))}
       </div>
      </div>
     )}

     <div className="bg-bg-card rounded-2xl border border-border-default shadow-theme-sm p-6">
      <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
       ✏️ Ghi chú của tôi
      </h3>
      <textarea
       value={personalNote}
       onChange={(e) => setPersonalNote(e.target.value)}
       placeholder="Ghi chú riêng cho từ này... (VD: mẹo nhớ, ngữ cảnh gặp, câu ví dụ của mình)"
       className="w-full min-h-32 bg-bg-primary border border-border-default rounded-xl p-4 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all resize-y"
      />
     </div>

     {!ai?.etymology && !ai?.usage_logic?.length && !ai?.examples?.length && (
      <div className="bg-bg-card rounded-2xl border border-border-default shadow-theme-sm p-8 text-center">
       <p className="text-sm text-text-muted mb-3">
        Chưa có dữ liệu phân tích chi tiết cho từ này
       </p>
       <button
        onClick={() =>
         toast.info("Tính năng phân tích AI sẽ sớm được cập nhật!")
        }
        className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
       >
        Yêu cầu phân tích sâu (AI)
       </button>
      </div>
     )}
    </div>
   </div>
  </div>
 );
}
