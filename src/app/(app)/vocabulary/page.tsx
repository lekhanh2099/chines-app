"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
 BookOpen,
 Brain,
 CalendarDays,
 Check,
 ChevronRight,
 Eye,
 FileText,
 HelpCircle,
 Keyboard,
 Loader2,
 Volume2,
 RotateCcw,
 Search,
 Settings,
 Sparkles,
 Trash2,
 Upload,
 WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVocabInspector } from "@/components/vocabulary/VocabInspectorProvider";
import { VocabImportModal } from "@/components/vocabulary/VocabImportModal";
import { useDeleteVocab } from "@/features/vocabulary/hooks/useDeleteVocab";
import { useVocabList } from "@/features/vocabulary/hooks/useVocabList";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { VocabWithProgress } from "@/types/database";

type StudyMode = "guess" | "flashcard" | "write" | "quiz" | "reverse";
type WordFilter = "all" | "new" | "learning" | "mastered" | "examples" | "missing";

type UnitGroup = {
 key: string;
 title: string;
 subtitle: string;
 items: VocabWithProgress[];
 lessonNumber: number;
 mastered: number;
 learning: number;
 fresh: number;
 progress: number;
 categories: { name: string; count: number }[];
};

const studyModes: {
 key: StudyMode;
 label: string;
 icon: typeof Brain;
 ready: boolean;
}[] = [
 { key: "guess", label: "Đoán từ", icon: Brain, ready: true },
 { key: "flashcard", label: "Flashcard", icon: Eye, ready: true },
 { key: "write", label: "Luyện viết", icon: Keyboard, ready: true },
 { key: "quiz", label: "Trắc nghiệm", icon: FileText, ready: true },
 { key: "reverse", label: "Trắc nghiệm ngược", icon: RotateCcw, ready: true },
];

const answerLabels = ["A", "B", "C", "D"];

function normalizeAnswer(value: string) {
 return value
  .trim()
  .toLowerCase()
  .replace(/\s+/g, "")
  .replace(/[，。！？、,.!?]/g, "");
}

function getMeaning(item: VocabWithProgress) {
 return item.ai_analysis.meaning_detail || item.ai_analysis.definitions?.[0]?.meaning || item.meaning;
}

function getPrimaryExample(item: VocabWithProgress) {
 return item.ai_analysis.examples?.[0];
}

function getStudyCharacters(item: VocabWithProgress) {
 return Array.from(item.hanzi).filter((character) => /[\u3400-\u9fff]/.test(character));
}

function shuffleItems<T>(items: T[]) {
 return [...items].sort(() => Math.random() - 0.5);
}

function hashForStudyOrder(value: string) {
 let hash = 0;
 for (let index = 0; index < value.length; index += 1) {
  hash = (hash << 5) - hash + value.charCodeAt(index);
  hash |= 0;
 }
 return Math.abs(hash);
}

function getStatusFromLevel(level: number): VocabWithProgress["status"] {
 if (level >= 4) return "mastered";
 if (level >= 2) return "learning";
 return "new";
}

function matchesQuery(item: VocabWithProgress, query: string) {
 if (!query.trim()) return true;
 const normalized = query.trim().toLowerCase();
 return (
  item.hanzi.toLowerCase().includes(normalized) ||
  item.pinyin.toLowerCase().includes(normalized) ||
  item.meaning.toLowerCase().includes(normalized) ||
  item.source?.category?.toLowerCase().includes(normalized)
 );
}

function buildUnitGroups(items: VocabWithProgress[]): UnitGroup[] {
 const grouped = new Map<string, VocabWithProgress[]>();

 for (const item of items) {
  const key = item.source?.lessonKey || "saved";
  const current = grouped.get(key) || [];
  current.push(item);
  grouped.set(key, current);
 }

 return Array.from(grouped.entries())
  .map(([key, groupItems]) => {
   const first = groupItems[0];
   const lessonNumber = first.source?.lessonNumber ?? 999;
   const mastered = groupItems.filter((item) => item.status === "mastered").length;
   const learning = groupItems.filter((item) => item.status === "learning").length;
   const fresh = groupItems.filter((item) => item.status === "new").length;
   const progress = groupItems.length ? Math.round((mastered / groupItems.length) * 100) : 0;
   const categories = Array.from(
    groupItems.reduce((map, item) => {
     const name = item.source?.category || "Bổ sung";
     map.set(name, (map.get(name) || 0) + 1);
     return map;
    }, new Map<string, number>()),
   )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

   return {
    key,
    title:
     key === "saved"
      ? "Từ đã lưu"
      : first.source?.lessonNumber
        ? `Bài ${first.source.lessonKey?.replace(/^L/, "") || first.source.lessonNumber}`
        : first.source?.lessonTitle?.match(/Bài\s+(.+)$/i)?.[0] ||
          `Bài ${first.source?.lessonKey?.replace(/^L/, "") || lessonNumber}`,
    subtitle:
     key === "saved"
      ? "Không có source lesson"
      : first.source?.lessonTitle || first.source?.lessonKey || key,
    items: groupItems,
    lessonNumber,
    mastered,
    learning,
    fresh,
    progress,
    categories,
   };
  })
  .sort((a, b) => a.lessonNumber - b.lessonNumber || a.title.localeCompare(b.title));
}

export default function VocabularyPage() {
 const [activeUnitKey, setActiveUnitKey] = useState<string | null>(null);
 const [mode, setMode] = useState<StudyMode>("flashcard");
 const [searchQuery, setSearchQuery] = useState("");
 const [wordFilter, setWordFilter] = useState<WordFilter>("all");
 const [showWords, setShowWords] = useState(true);
 const [randomMode, setRandomMode] = useState(false);
 const [randomSeed, setRandomSeed] = useState(1);
 const [cardIndex, setCardIndex] = useState(0);
 const [revealed, setRevealed] = useState(false);
 const [guessInput, setGuessInput] = useState("");
 const [hintLevel, setHintLevel] = useState(0);
 const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
 const [quizChecked, setQuizChecked] = useState(false);
 const [writeCharIndex, setWriteCharIndex] = useState(0);
 const [mistakeQueue, setMistakeQueue] = useState<string[]>([]);
 const [sessionStats, setSessionStats] = useState({ seen: 0, remembered: 0, missed: 0 });
 const [showShortcuts, setShowShortcuts] = useState(false);
 const [importOpen, setImportOpen] = useState(false);
 const [docxImporting, setDocxImporting] = useState(false);
 const { openInspector } = useVocabInspector();
 const deleteVocab = useDeleteVocab();
 const { data: vocabList = [], isLoading } = useVocabList();
 const queryClient = useQueryClient();
 const supabase = useMemo(() => createClient(), []);
 const [currentUserId, setCurrentUserId] = useState<string | null>(null);

 const words = useMemo(() => vocabList.filter((item) => item.type === "word"), [vocabList]);
 const courseOptions = useMemo(() => {
  const map = new Map<string, { key: string; label: string; count: number; isDocx: boolean }>();
  for (const item of words) {
   const key = item.source?.courseKey || "legacy";
   const label = item.source?.sourceFile || (key === "legacy" ? "Dữ liệu cũ" : key);
   const current = map.get(key);
   map.set(key, {
    key,
    label,
    count: (current?.count || 0) + 1,
   isDocx: key.startsWith("docx:") || label.toLowerCase().includes(".docx"),
   });
  }
  return Array.from(map.values()).sort((a, b) => Number(b.isDocx) - Number(a.isDocx) || b.count - a.count);
 }, [words]);
 const hasDocxCourse = courseOptions.some((course) => course.isDocx);
 const [selectedCourseKey, setSelectedCourseKey] = useState<string>("__auto__");
 const resolvedCourseKey =
  selectedCourseKey === "__auto__"
   ? courseOptions.find((course) => course.isDocx)?.key || courseOptions[0]?.key || "all"
   : selectedCourseKey;
 const courseWords = useMemo(
  () => (resolvedCourseKey === "all" ? words : words.filter((item) => (item.source?.courseKey || "legacy") === resolvedCourseKey)),
  [resolvedCourseKey, words],
 );
 const groups = useMemo(() => buildUnitGroups(courseWords), [courseWords]);
 const activeGroup = groups.find((group) => group.key === activeUnitKey) || groups[0];
 const filteredItems = useMemo(() => {
  const base = (activeGroup?.items || []).filter((item) => matchesQuery(item, searchQuery));
  return base.filter((item) => {
   if (wordFilter === "all") return true;
   if (wordFilter === "examples") return Boolean(item.ai_analysis.examples?.length);
   if (wordFilter === "missing") {
    const ai = item.ai_analysis;
    return !ai.decomposition || !ai.examples?.length || !ai.collocations?.length || !ai.usage_note;
   }
   return item.status === wordFilter;
  });
 }, [activeGroup?.items, searchQuery, wordFilter]);
 const totals = useMemo(() => {
  const mastered = courseWords.filter((item) => item.status === "mastered").length;
  const learning = courseWords.filter((item) => item.status === "learning").length;
  const fresh = courseWords.filter((item) => item.status === "new").length;
  return { mastered, learning, fresh, total: courseWords.length };
 }, [courseWords]);
 const studyQueue = useMemo(() => {
  const byMistake = mistakeQueue
   .map((id) => filteredItems.find((item) => item.id === id))
   .filter((item): item is VocabWithProgress => Boolean(item));
  const mistakeIds = new Set(byMistake.map((item) => item.id));
  const rest = filteredItems.filter((item) => !mistakeIds.has(item.id));
  const orderedRest = randomMode
   ? [...rest].sort(
      (a, b) =>
       hashForStudyOrder(`${a.id}:${randomSeed}`) -
       hashForStudyOrder(`${b.id}:${randomSeed}`),
     )
   : [...rest].sort((a, b) => {
    const rank = { new: 0, learning: 1, mastered: 2 };
    return rank[a.status] - rank[b.status] || a.proficiency_level - b.proficiency_level;
   });
 return [...byMistake, ...orderedRest];
 }, [filteredItems, mistakeQueue, randomMode, randomSeed]);
 const activeCard = studyQueue[cardIndex] || studyQueue[0];
 const quizOptions = useMemo(() => {
  if (!activeCard) return [];
  const sameCategory = filteredItems.filter(
   (item) =>
    item.id !== activeCard.id &&
    item.source?.category &&
    item.source.category === activeCard.source?.category,
  );
  const sameUnit = filteredItems.filter((item) => item.id !== activeCard.id);
  const fallback = courseWords.filter((item) => item.id !== activeCard.id);
  const distractors = shuffleItems([...sameCategory, ...sameUnit, ...fallback])
   .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
   .slice(0, 3);
  return shuffleItems([activeCard, ...distractors]).slice(0, 4);
 }, [activeCard, courseWords, filteredItems]);

 useEffect(() => {
  setCardIndex(0);
  setRevealed(false);
  setGuessInput("");
  setHintLevel(0);
  setSelectedAnswerId(null);
  setQuizChecked(false);
  setWriteCharIndex(0);
 }, [activeGroup?.key, mode, searchQuery, wordFilter, resolvedCourseKey, randomMode, randomSeed]);

 useEffect(() => {
  let mounted = true;
  void supabase.auth.getSession().then(({ data }) => {
   if (!mounted) return;
   setCurrentUserId(data.session?.user.id || null);
  });
  return () => {
   mounted = false;
  };
 }, [supabase]);

 useEffect(() => {
  setRevealed(false);
  setGuessInput("");
  setHintLevel(0);
  setSelectedAnswerId(null);
  setQuizChecked(false);
  setWriteCharIndex(0);
 }, [activeCard?.id]);

 useEffect(() => {
  if (selectedCourseKey !== "__auto__") return;
  setActiveUnitKey(null);
 }, [resolvedCourseKey, selectedCourseKey]);

 const handleDelete = useCallback(
  (id: string, hanzi: string) => {
   const confirmed = window.confirm(`Xóa "${hanzi}" khỏi kho từ vựng?`);
   if (!confirmed) return;

   deleteVocab.mutate(
    { vocabId: id, hanzi },
    {
     onSuccess: () => toast.success(`Đã xóa "${hanzi}"`),
     onError: () => toast.error("Không thể xóa từ vựng"),
    },
   );
  },
  [deleteVocab],
 );

 const handleImportDocxSource = useCallback(async () => {
  setDocxImporting(true);
  try {
   const response = await fetch("/api/vocab/import/staged-hanyu?confirm=import&source=docx&clean=1", {
    method: "GET",
   });
   const result = (await response.json()) as {
    imported?: number;
    failed?: number;
    total?: number;
    skippedDuplicates?: number;
    error?: string;
   };

   if (!response.ok) {
    throw new Error(result.error || "Import thất bại");
   }

   toast.success(
    `Đã reset và import ${result.imported || 0}/${result.total || 0} từ từ docx${
     result.skippedDuplicates ? `, bỏ ${result.skippedDuplicates} dòng trùng` : ""
    }`,
   );
   setSelectedCourseKey("__auto__");
   setActiveUnitKey(null);
   await queryClient.invalidateQueries({ queryKey: ["vocab-list"] });
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không cập nhật được docx");
  } finally {
   setDocxImporting(false);
  }
 }, [queryClient]);

 const goNextCard = useCallback(() => {
  setRevealed(false);
  setCardIndex((index) => {
   if (!studyQueue.length) return 0;
   return (index + 1) % studyQueue.length;
  });
 }, [studyQueue.length]);

 const speakActiveCard = useCallback(() => {
  if (!activeCard || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(activeCard.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
 }, [activeCard]);

 const openActiveDictionary = useCallback(() => {
  if (!activeCard || typeof window === "undefined") return;
  window.location.href = `/dictionary/${encodeURIComponent(activeCard.hanzi)}`;
 }, [activeCard]);

 const goPreviousCard = useCallback(() => {
  setRevealed(false);
  setCardIndex((index) => (studyQueue.length ? (index - 1 + studyQueue.length) % studyQueue.length : 0));
 }, [studyQueue.length]);

 const saveProgressLevel = useCallback(
  (item: VocabWithProgress, nextLevel: number) => {
   if (!currentUserId) {
    toast.error("Cần đăng nhập để lưu tiến độ");
    return false;
   }

   queryClient.setQueryData<VocabWithProgress[]>(["vocab-list"], (current) =>
    current?.map((vocab) =>
     vocab.id === item.id
      ? {
         ...vocab,
         proficiency_level: nextLevel,
         status: getStatusFromLevel(nextLevel),
        }
      : vocab,
    ),
   );

   void supabase
    .from("user_vocab_progress")
    .update({ proficiency_level: nextLevel })
    .eq("user_id", currentUserId)
    .eq("vocab_id", item.id)
    .then(({ error }) => {
     if (error) {
      toast.error("Chưa lưu được tiến độ ôn");
      void queryClient.invalidateQueries({ queryKey: ["vocab-list"] });
     }
    });

   return true;
  },
  [currentUserId, queryClient, supabase],
 );

 const handleRememberCard = useCallback(() => {
  if (!activeCard) return;

  const nextLevel = Math.min((activeCard.proficiency_level || 0) + 1, 5);
  const saved = saveProgressLevel(activeCard, nextLevel);
  if (!saved) return;

  toast.success(`Đã ghi nhớ "${activeCard.hanzi}"`);
  setMistakeQueue((queue) => queue.filter((id) => id !== activeCard.id));
  setSessionStats((stats) => ({
   ...stats,
   seen: stats.seen + 1,
   remembered: stats.remembered + 1,
  }));
  goNextCard();
 }, [activeCard, goNextCard, saveProgressLevel]);

 const handleMissCard = useCallback((mode: "again" | "review") => {
  if (!activeCard) return;

  setMistakeQueue((queue) => {
   const next = queue.filter((id) => id !== activeCard.id);
   const insertAt = Math.min(3, next.length);
   next.splice(insertAt, 0, activeCard.id);
   return next;
  });
  setSessionStats((stats) => ({
   ...stats,
   seen: stats.seen + 1,
   missed: stats.missed + 1,
  }));

  if (mode === "again") {
   saveProgressLevel(activeCard, Math.max((activeCard.proficiency_level || 0) - 1, 0));
  }

  goNextCard();
 }, [activeCard, goNextCard, saveProgressLevel]);

 const handleShowHint = useCallback(() => {
  setHintLevel((level) => Math.min(level + 1, 4));
 }, []);

 const handleCheckGuess = useCallback(() => {
  if (!activeCard) return;
  const answer = normalizeAnswer(guessInput);
  const expected = normalizeAnswer(activeCard.hanzi);
  if (!answer) {
   toast.message("Nhập Hán tự trước đã nha");
   return;
  }

  if (answer === expected) {
   toast.success("Đúng rồi");
   void handleRememberCard();
   return;
  }

  toast.error(`Chưa đúng. Đáp án: ${activeCard.hanzi}`);
  setRevealed(true);
  void handleMissCard("review");
 }, [activeCard, guessInput, handleMissCard, handleRememberCard]);

 const handleSelectAnswer = useCallback(
  (item: VocabWithProgress) => {
   if (!activeCard || quizChecked) return;
   const correct = item.id === activeCard.id;
   setSelectedAnswerId(item.id);
   setQuizChecked(true);
   if (correct) {
    toast.success("Đúng rồi");
    window.setTimeout(() => void handleRememberCard(), 550);
   } else {
    toast.error(`Đáp án đúng: ${activeCard.hanzi}`);
    window.setTimeout(() => void handleMissCard("review"), 800);
   }
  },
  [activeCard, handleMissCard, handleRememberCard, quizChecked],
 );

 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
   const target = event.target as HTMLElement | null;
   if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

   if (event.key === " ") {
    event.preventDefault();
    if (mode === "flashcard") {
     revealed ? goNextCard() : setRevealed(true);
    }
   } else if (event.key === "Enter") {
    event.preventDefault();
    if (mode === "guess") handleCheckGuess();
   } else if (event.key === "1") {
    event.preventDefault();
    void handleMissCard("again");
   } else if (event.key === "2") {
    event.preventDefault();
    void handleMissCard("review");
   } else if (event.key === "3") {
    event.preventDefault();
    void handleRememberCard();
   } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "j") {
    event.preventDefault();
    goNextCard();
   } else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "k") {
    event.preventDefault();
    goPreviousCard();
   } else if (["a", "b", "c", "d"].includes(event.key.toLowerCase()) && (mode === "quiz" || mode === "reverse")) {
    event.preventDefault();
    const optionIndex = event.key.toLowerCase().charCodeAt(0) - 97;
    const option = quizOptions[optionIndex];
    if (option) handleSelectAnswer(option);
   } else if (event.key.toLowerCase() === "s") {
    event.preventDefault();
    speakActiveCard();
   } else if (event.key.toLowerCase() === "d") {
    event.preventDefault();
    openActiveDictionary();
   } else if (event.key.toLowerCase() === "h") {
    event.preventDefault();
    handleShowHint();
   } else if (event.key === "?") {
    event.preventDefault();
    setShowShortcuts((value) => !value);
   }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [
  goNextCard,
  goPreviousCard,
  handleCheckGuess,
  handleMissCard,
  handleRememberCard,
  handleSelectAnswer,
  handleShowHint,
  mode,
  openActiveDictionary,
  quizOptions,
  revealed,
  speakActiveCard,
 ]);

 return (
  <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-5 py-7 lg:px-8">
   <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div>
     <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50">
      ← Quay lại
     </Link>
     <h1 className="mt-5 text-4xl font-black tracking-normal text-stone-900">
      Từ vựng Hán ngữ
     </h1>
     <p className="mt-2 text-base font-bold text-stone-500">
      Học theo bài, ôn bằng flashcard và mở chi tiết khi cần hiểu sâu.
     </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
     <select
      value={selectedCourseKey}
      onChange={(event) => {
       setSelectedCourseKey(event.target.value);
       setActiveUnitKey(null);
      }}
      className="h-11 rounded-2xl border-2 border-stone-200 bg-white px-3 text-sm font-black text-stone-700 shadow-theme-sm outline-none"
     >
      <option value="__auto__">Nguồn docs mới nhất</option>
      <option value="all">Tất cả nguồn</option>
      {courseOptions.map((course) => (
       <option key={course.key} value={course.key}>
       {course.label} ({course.count})
       </option>
      ))}
     </select>
     <Button
      type="button"
      variant={hasDocxCourse ? "outline" : "default"}
      className={cn(
       "h-11 rounded-2xl font-black",
       hasDocxCourse
        ? "border-2 border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
        : "bg-emerald-500 text-white hover:bg-emerald-600",
      )}
      onClick={handleImportDocxSource}
      disabled={docxImporting}
     >
      {docxImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      {hasDocxCourse ? "Reset docs" : "Import docs"}
     </Button>
     <div className="flex rounded-2xl bg-stone-100 p-1">
      {studyModes.map((item) => {
       const Icon = item.icon;
       const active = mode === item.key;
       return (
        <button
         key={item.key}
         type="button"
         onClick={() => setMode(item.key)}
         className={cn(
          "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-black transition",
          active ? "bg-red-500 text-white shadow-theme-sm" : "text-stone-600 hover:bg-white",
         )}
        >
         <Icon className="h-4 w-4" />
         <span className="hidden md:inline">{item.label}</span>
        </button>
       );
      })}
     </div>
     <button
      type="button"
      onClick={() => {
       setRandomMode((value) => !value);
       setRandomSeed(Date.now());
      }}
      className={cn(
       "flex h-11 items-center gap-2 rounded-2xl border-2 px-4 text-sm font-black shadow-theme-sm transition",
       randomMode
        ? "border-purple-300 bg-purple-50 text-purple-700"
        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
      )}
      title="Học ngẫu nhiên"
     >
      <RotateCcw className="h-4 w-4" />
      <span className="hidden sm:inline">{randomMode ? "Đang random" : "Ngẫu nhiên"}</span>
     </button>
     <button className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-600 shadow-theme-sm">
      <CalendarDays className="h-5 w-5" />
     </button>
     <button className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-600 shadow-theme-sm">
      <Settings className="h-5 w-5" />
     </button>
     <button
      type="button"
      onClick={() => setShowShortcuts((value) => !value)}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-600 shadow-theme-sm"
      title="Shortcut"
     >
      <HelpCircle className="h-5 w-5" />
     </button>
     <Button className="h-11 rounded-2xl bg-red-500 hover:bg-red-600" onClick={() => setImportOpen(true)}>
      <Upload className="h-4 w-4" />
      Import
     </Button>
    </div>
   </div>

   <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
    <aside className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
     <div className="mb-4 flex items-center justify-between">
      <p className="text-lg font-black uppercase tracking-wide text-stone-900">Danh sách bài</p>
      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
       {groups.length}
      </span>
     </div>

     {isLoading ? (
      <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-bold text-stone-500">
       <Loader2 className="h-5 w-5 animate-spin" />
       Đang tải...
      </div>
     ) : groups.length === 0 ? (
      <EmptyUnitList onImport={() => setImportOpen(true)} />
     ) : (
      <div className="flex flex-col gap-3">
       {groups.map((group) => (
        <UnitButton
         key={group.key}
         group={group}
         active={activeGroup?.key === group.key}
         onClick={() => setActiveUnitKey(group.key)}
        />
       ))}
      </div>
     )}
    </aside>

    <main className="min-h-[620px] min-w-0 rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
     {!activeGroup ? (
      <EmptyLearningPanel onImport={() => setImportOpen(true)} />
     ) : (
      <div className="flex min-h-[560px] flex-col">
       <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
       <div>
         <p className="text-sm font-black uppercase tracking-wide text-red-500">
          {activeGroup.subtitle}
         </p>
         <h2 className="mt-1 text-3xl font-black text-stone-900">{activeGroup.title}</h2>
        <p className="mt-2 text-base font-bold text-stone-500">
          {activeGroup.items.length} từ trong nhóm này · {activeGroup.categories.slice(0, 2).map((item) => item.name).join(", ")}
         </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
         <Metric value={activeGroup.fresh} label="Đang học" tone="yellow" />
         <Metric value={activeGroup.learning} label="Đang ôn" tone="blue" />
         <Metric value={activeGroup.mastered} label="Thành thạo" tone="green" />
        </div>
       </div>

       <StudyProgressHeader
        title={activeGroup.title}
        current={studyQueue.length ? cardIndex + 1 : 0}
        total={studyQueue.length}
        stats={sessionStats}
        randomMode={randomMode}
       />

       <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-[28px] border-2 border-stone-100 bg-stone-50 p-4 text-center md:p-7">
        <ModePanel
         mode={mode}
         group={activeGroup}
         activeItem={activeCard}
         total={studyQueue.length}
         cardIndex={cardIndex}
         revealed={revealed}
         onReveal={() => setRevealed(true)}
         onAgain={() => void handleMissCard("again")}
         onNext={() => void handleMissCard("review")}
         onRemember={handleRememberCard}
         onSpeak={speakActiveCard}
         onDictionary={openActiveDictionary}
         guessInput={guessInput}
         onGuessInputChange={setGuessInput}
         hintLevel={hintLevel}
         onHint={handleShowHint}
         onCheckGuess={handleCheckGuess}
         quizOptions={quizOptions}
         selectedAnswerId={selectedAnswerId}
         quizChecked={quizChecked}
         onSelectAnswer={handleSelectAnswer}
         writeCharIndex={writeCharIndex}
         onWriteCharIndexChange={setWriteCharIndex}
         sessionStats={sessionStats}
        />
       </div>
       {showShortcuts && <ShortcutHelp />}

       <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <button
         type="button"
         onClick={() => setShowWords((value) => !value)}
         className="h-14 rounded-2xl border-2 border-stone-200 bg-white text-base font-black uppercase tracking-wide text-stone-800 shadow-theme-sm hover:bg-stone-50"
        >
         {showWords ? "Ẩn từ vựng" : "Xem từ vựng"}
        </button>
        <button
         type="button"
         onClick={() => {
          if (!activeGroup) return;
          const currentIndex = groups.findIndex((group) => group.key === activeGroup.key);
          const nextGroup = groups[currentIndex + 1] || groups[0];
          setActiveUnitKey(nextGroup?.key || null);
         }}
         className="h-14 rounded-2xl bg-red-500 text-base font-black uppercase tracking-wide text-white shadow-theme-md hover:bg-red-600"
        >
         Học nhóm tiếp theo
        </button>
       </div>

       {showWords && (
        <section className="mt-6">
         <div className="mb-4 flex flex-wrap gap-2">
          {[
           ["all", "Tất cả"],
           ["new", "Đang học"],
           ["learning", "Đang ôn"],
           ["mastered", "Thành thạo"],
           ["examples", "Có ví dụ"],
           ["missing", "Thiếu dữ liệu"],
          ].map(([key, label]) => (
           <button
            key={key}
            type="button"
            onClick={() => setWordFilter(key as WordFilter)}
            className={cn(
             "h-9 rounded-xl border-2 px-3 text-xs font-black transition",
             wordFilter === key
              ? "border-red-500 bg-red-500 text-white"
              : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
            )}
           >
            {label}
           </button>
          ))}
         </div>
         <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <Input
           value={searchQuery}
           onChange={(event) => setSearchQuery(event.target.value)}
           placeholder="Tìm Hán tự, pinyin, nghĩa..."
           className="h-12 rounded-2xl border-2 border-stone-200 bg-white pl-12 text-base font-bold"
          />
         </div>
         <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {filteredItems.map((item) => (
           <WordCard
            key={item.id}
            item={item}
            onInspect={openInspector}
            onDelete={handleDelete}
           />
          ))}
         </div>
        </section>
       )}
      </div>
     )}
    </main>
   </div>

   <VocabImportModal open={importOpen} onOpenChange={setImportOpen} />
  </div>
 );
}

function UnitButton({ group, active, onClick }: { group: UnitGroup; active: boolean; onClick: () => void }) {
 const complete = group.progress >= 100;
 return (
  <button
   type="button"
   onClick={onClick}
   className={cn(
    "flex min-h-20 items-center gap-3 rounded-3xl border-2 p-4 text-left shadow-theme-sm transition",
    active
     ? "border-red-700 bg-red-500 text-white"
     : group.progress > 0
       ? "border-yellow-300 bg-yellow-50 text-orange-700"
       : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
   )}
  >
   <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2", active ? "border-white/50 bg-white/20" : "border-stone-200 bg-white")}>
    {complete ? <Check className="h-5 w-5" /> : <span className="text-sm font-black">{group.progress}%</span>}
   </div>
   <div className="min-w-0 flex-1">
    <p className="truncate text-xl font-black">{group.title}</p>
   <p className={cn("mt-1 truncate text-sm font-bold", active ? "text-white/90" : "text-stone-500")}>
     {group.mastered}/{group.items.length} thẻ
    </p>
    <div className="mt-2 flex flex-wrap gap-1">
     {group.categories.slice(0, 3).map((category) => (
      <span
       key={category.name}
       className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-black",
        active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500",
       )}
      >
       {category.name} · {category.count}
      </span>
     ))}
    </div>
   </div>
  </button>
 );
}

function StudyProgressHeader({
 title,
 current,
 total,
 stats,
 randomMode,
}: {
 title: string;
 current: number;
 total: number;
 stats: { seen: number; remembered: number; missed: number };
 randomMode: boolean;
}) {
 const progress = total ? Math.min(100, Math.round((current / total) * 100)) : 0;
 return (
  <section className="mt-7">
   <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
     <p className="text-lg font-black uppercase tracking-wide text-stone-600">
      Tiến độ - {title}
     </p>
     <p className="mt-1 text-sm font-bold text-stone-500">
      Đã học {stats.seen} · Nhớ {stats.remembered} · Cần ôn {stats.missed}
      {randomMode ? " · Đang xáo bài" : ""}
     </p>
    </div>
    <p className="text-xl font-black uppercase tracking-wide text-stone-700">
     {current} / {total} thẻ
    </p>
   </div>
   <div className="mt-3 h-3 rounded-full border-2 border-stone-200 bg-red-100">
    <div
     className="h-full rounded-full bg-red-500 transition-all"
     style={{ width: `${progress}%` }}
    />
   </div>
  </section>
 );
}

function ModePanel({
 mode,
 group,
 activeItem,
 total,
 cardIndex,
 revealed,
 onReveal,
 onAgain,
 onNext,
 onRemember,
 onSpeak,
 onDictionary,
 guessInput,
 onGuessInputChange,
 hintLevel,
 onHint,
 onCheckGuess,
 quizOptions,
 selectedAnswerId,
 quizChecked,
 onSelectAnswer,
 writeCharIndex,
 onWriteCharIndexChange,
 sessionStats,
}: {
 mode: StudyMode;
 group: UnitGroup;
 activeItem?: VocabWithProgress;
 total: number;
 cardIndex: number;
 revealed: boolean;
 onReveal: () => void;
 onAgain: () => void;
 onNext: () => void;
 onRemember: () => void;
 onSpeak: () => void;
 onDictionary: () => void;
 guessInput: string;
 onGuessInputChange: (value: string) => void;
 hintLevel: number;
 onHint: () => void;
 onCheckGuess: () => void;
 quizOptions: VocabWithProgress[];
 selectedAnswerId: string | null;
 quizChecked: boolean;
 onSelectAnswer: (item: VocabWithProgress) => void;
 writeCharIndex: number;
 onWriteCharIndexChange: (index: number) => void;
 sessionStats: { seen: number; remembered: number; missed: number };
}) {
 if (!activeItem) {
  return (
   <div className="mx-auto max-w-md">
    <Sparkles className="mx-auto h-16 w-16 text-stone-300" />
    <h3 className="mt-4 text-2xl font-black text-stone-900">Không có từ phù hợp</h3>
    <p className="mt-2 text-base font-bold text-stone-500">Đổi tìm kiếm hoặc chọn bài khác.</p>
   </div>
  );
 }

 if (mode === "guess") {
  return (
   <GuessPanel
    item={activeItem}
    group={group}
    total={total}
    cardIndex={cardIndex}
    value={guessInput}
    hintLevel={hintLevel}
    onValueChange={onGuessInputChange}
    onHint={onHint}
    onCheck={onCheckGuess}
    onUnknown={onAgain}
    onSpeak={onSpeak}
   />
  );
 }

 if (mode === "write") {
  return (
   <WritingPanel
    item={activeItem}
    group={group}
    total={total}
    cardIndex={cardIndex}
    charIndex={writeCharIndex}
    onCharIndexChange={onWriteCharIndexChange}
    onRemember={onRemember}
    onNext={onNext}
    onSpeak={onSpeak}
   />
  );
 }

 if (mode === "quiz" || mode === "reverse") {
  return (
   <QuizPanel
    mode={mode}
    item={activeItem}
    group={group}
    total={total}
    cardIndex={cardIndex}
    options={quizOptions}
    selectedAnswerId={selectedAnswerId}
    checked={quizChecked}
    onSelectAnswer={onSelectAnswer}
    onSpeak={onSpeak}
   />
  );
 }

 return (
  <div className="w-full max-w-4xl">
   <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-100 text-4xl shadow-theme-sm">
    🧠
   </div>
   <div className="flex flex-wrap items-center justify-center gap-2">
    <p className="text-sm font-black uppercase tracking-wide text-red-500">{group.title}</p>
    {activeItem.source?.category && (
     <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-500 shadow-theme-sm">
      {activeItem.source.category}
     </span>
    )}
   </div>
   <p className="mt-1 text-sm font-black text-stone-400">
    Thẻ {Math.min(cardIndex + 1, total)} / {total}
   </p>
   <h3 className="mt-3 text-6xl font-black text-stone-900">{activeItem.hanzi}</h3>
   {revealed ? (
    <>
     <FlashcardBack item={activeItem} onSpeak={onSpeak} />
     <div className="mt-8 grid gap-3 sm:grid-cols-3">
      <button
       type="button"
       onClick={onAgain}
       className="h-12 rounded-2xl border-2 border-stone-200 bg-white px-5 text-sm font-black uppercase text-stone-700 shadow-theme-sm hover:bg-stone-50"
      >
       Chưa nhớ
      </button>
      <button
       type="button"
       onClick={onNext}
       className="h-12 rounded-2xl border-2 border-blue-300 bg-blue-50 px-5 text-sm font-black uppercase text-blue-600 shadow-theme-sm hover:bg-blue-100"
      >
       Cần ôn lại
      </button>
      <button
       type="button"
       onClick={onRemember}
       className="h-12 rounded-2xl bg-emerald-500 px-5 text-sm font-black uppercase text-white shadow-theme-md hover:bg-emerald-600"
      >
       Đã nhớ
      </button>
     </div>
     <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-black text-stone-500">
      <span>Đã học: {sessionStats.seen}</span>
      <span>Nhớ: {sessionStats.remembered}</span>
      <span>Cần ôn: {sessionStats.missed}</span>
     </div>
    </>
   ) : (
    <>
     <p className="mx-auto mt-4 max-w-xl text-lg font-bold leading-8 text-stone-500">
      Tự đoán pinyin và nghĩa trước khi lật thẻ.
     </p>
     <button
      type="button"
      onClick={onReveal}
      className="mt-8 h-14 rounded-2xl bg-red-500 px-10 text-base font-black uppercase tracking-wide text-white shadow-theme-md hover:bg-red-600"
     >
      Lật thẻ
     </button>
     <div className="mt-4 flex flex-wrap justify-center gap-2">
      <button
       type="button"
       onClick={onSpeak}
       className="h-10 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-600 shadow-theme-sm hover:bg-stone-50"
      >
       S · Phát âm
      </button>
      <button
       type="button"
       onClick={onDictionary}
       className="h-10 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-600 shadow-theme-sm hover:bg-stone-50"
      >
       D · Chi tiết
      </button>
     </div>
    </>
   )}
  </div>
 );
}

function StudyMeta({
 group,
 item,
 total,
 cardIndex,
}: {
 group: UnitGroup;
 item: VocabWithProgress;
 total: number;
 cardIndex: number;
}) {
 return (
  <>
   <div className="flex flex-wrap items-center justify-center gap-2">
    <p className="text-sm font-black uppercase tracking-wide text-red-500">{group.title}</p>
    {item.source?.category && (
     <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-500 shadow-theme-sm">
      {item.source.category}
     </span>
    )}
   </div>
   <p className="mt-1 text-sm font-black text-stone-400">
    Thẻ {Math.min(cardIndex + 1, total)} / {total}
   </p>
  </>
 );
}

function GuessPanel({
 item,
 group,
 total,
 cardIndex,
 value,
 hintLevel,
 onValueChange,
 onHint,
 onCheck,
 onUnknown,
 onSpeak,
}: {
 item: VocabWithProgress;
 group: UnitGroup;
 total: number;
 cardIndex: number;
 value: string;
 hintLevel: number;
 onValueChange: (value: string) => void;
 onHint: () => void;
 onCheck: () => void;
 onUnknown: () => void;
 onSpeak: () => void;
}) {
 const example = getPrimaryExample(item);
 const hiddenExample = example?.zh?.replaceAll(item.hanzi, "____");
 const hints = [
  `${item.hanzi.length} chữ Hán`,
  item.pinyin ? `Pinyin: ${item.pinyin}` : "",
  item.ai_analysis.han_viet || item.sino_vietnamese ? `Hán Việt: ${item.ai_analysis.han_viet || item.sino_vietnamese}` : "",
  item.hanzi ? `Gợi ý chữ đầu: ${item.hanzi.slice(0, 1)}` : "",
 ].filter(Boolean);

 return (
  <div className="w-full max-w-5xl">
   <StudyMeta group={group} item={item} total={total} cardIndex={cardIndex} />
   <div className="mx-auto mt-7 max-w-4xl rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-9">
    <button
     type="button"
     onClick={onSpeak}
     className="mx-auto mb-4 flex h-11 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-600 shadow-theme-sm hover:bg-stone-50"
    >
     <Volume2 className="h-4 w-4" />
     Nghe từ
    </button>
    <p className="text-sm font-black uppercase tracking-wide text-stone-500">Định nghĩa</p>
    <p className="mx-auto mt-2 max-w-2xl text-2xl font-black leading-9 text-red-500">
     {getMeaning(item)}
    </p>
    {hiddenExample && (
     <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-stone-50 p-4">
      <p className="text-sm font-black uppercase tracking-wide text-stone-500">Ví dụ</p>
      <p className="mt-2 text-lg font-black leading-8 text-stone-800">{hiddenExample}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-stone-500">{example?.vi}</p>
     </div>
    )}
    {hintLevel > 0 && (
     <div className="mx-auto mt-5 max-w-lg rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-4 text-left">
      <p className="text-xs font-black uppercase tracking-wide text-orange-600">Gợi ý</p>
      <ul className="mt-2 space-y-1 text-sm font-bold text-stone-700">
       {hints.slice(0, hintLevel).map((hint) => (
        <li key={hint}>• {hint}</li>
       ))}
      </ul>
     </div>
    )}
    <form
     className="mx-auto mt-7 max-w-2xl"
     onSubmit={(event) => {
      event.preventDefault();
      onCheck();
     }}
    >
     <Input
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder="Nhập Hán tự..."
      className="h-16 rounded-2xl border-4 border-red-400 bg-white text-center text-2xl font-black text-stone-900 shadow-theme-sm focus-visible:ring-red-200"
     />
     <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <button
       type="button"
       onClick={onUnknown}
       className="h-14 rounded-2xl bg-red-500 px-5 text-sm font-black uppercase text-white shadow-theme-md hover:bg-red-600"
      >
       Không biết
      </button>
      <button
       type="button"
       onClick={onHint}
       className="h-14 rounded-2xl border-2 border-yellow-300 bg-yellow-50 px-5 text-sm font-black uppercase text-orange-700 shadow-theme-sm hover:bg-yellow-100"
      >
       H · Gợi ý
      </button>
      <button
       type="submit"
       className="h-14 rounded-2xl bg-emerald-400 px-5 text-sm font-black uppercase text-white shadow-theme-md hover:bg-emerald-500"
      >
       Enter · Kiểm tra
      </button>
     </div>
    </form>
   </div>
  </div>
 );
}

function WritingPanel({
 item,
 group,
 total,
 cardIndex,
 charIndex,
 onCharIndexChange,
 onRemember,
 onNext,
 onSpeak,
}: {
 item: VocabWithProgress;
 group: UnitGroup;
 total: number;
 cardIndex: number;
 charIndex: number;
 onCharIndexChange: (index: number) => void;
 onRemember: () => void;
 onNext: () => void;
 onSpeak: () => void;
}) {
 const characters = getStudyCharacters(item);
 const activeChar = characters[charIndex] || characters[0] || item.hanzi.slice(0, 1);

 return (
  <div className="w-full max-w-5xl">
   <StudyMeta group={group} item={item} total={total} cardIndex={cardIndex} />
   <div className="mx-auto mt-7 max-w-4xl rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-9">
    <h3 className="text-5xl font-black text-red-500 md:text-6xl">{item.hanzi}</h3>
    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-lg font-black text-stone-600">
     <span>{item.pinyin}</span>
     <button type="button" onClick={onSpeak} className="rounded-full bg-stone-100 p-2 text-stone-600">
      <Volume2 className="h-5 w-5" />
     </button>
    </div>
    <p className="mx-auto mt-3 max-w-2xl text-lg font-bold leading-8 text-stone-600">{getMeaning(item)}</p>
    <div className="mt-7 flex flex-wrap justify-center gap-2">
     {characters.map((character, index) => (
      <button
       key={`${character}-${index}`}
       type="button"
       onClick={() => onCharIndexChange(index)}
       className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl border-2 text-xl font-black shadow-theme-sm",
        index === charIndex
         ? "border-red-500 bg-red-500 text-white"
         : "border-stone-200 bg-white text-stone-800 hover:bg-stone-50",
       )}
      >
       {character}
      </button>
     ))}
    </div>
    <div className="mx-auto mt-6 flex justify-center">
     <CharacterWriterCard character={activeChar} />
    </div>
    <div className="mt-7 grid gap-3 sm:grid-cols-2">
     <button
      type="button"
      onClick={onNext}
      className="h-14 rounded-2xl border-2 border-stone-200 bg-white px-5 text-sm font-black uppercase text-stone-700 shadow-theme-sm hover:bg-stone-50"
     >
      Cần luyện lại
     </button>
     <button
      type="button"
      onClick={onRemember}
      className="h-14 rounded-2xl bg-emerald-500 px-5 text-sm font-black uppercase text-white shadow-theme-md hover:bg-emerald-600"
     >
      Đã viết được
     </button>
    </div>
   </div>
  </div>
 );
}

function QuizPanel({
 mode,
 item,
 group,
 total,
 cardIndex,
 options,
 selectedAnswerId,
 checked,
 onSelectAnswer,
 onSpeak,
}: {
 mode: "quiz" | "reverse";
 item: VocabWithProgress;
 group: UnitGroup;
 total: number;
 cardIndex: number;
 options: VocabWithProgress[];
 selectedAnswerId: string | null;
 checked: boolean;
 onSelectAnswer: (item: VocabWithProgress) => void;
 onSpeak: () => void;
}) {
 const reverse = mode === "reverse";
 const promptTitle = reverse ? item.hanzi : getMeaning(item);
 const promptSub = reverse ? item.pinyin : "Chọn Hán tự đúng";

 return (
  <div className="w-full max-w-5xl">
   <StudyMeta group={group} item={item} total={total} cardIndex={cardIndex} />
   <div className="mx-auto mt-7 max-w-4xl rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-sm md:p-9">
    <button type="button" onClick={onSpeak} className="mb-4 rounded-full bg-stone-100 p-3 text-stone-600">
     <Volume2 className="h-5 w-5" />
    </button>
    <h3 className={cn("mx-auto max-w-2xl font-black leading-tight", reverse ? "text-6xl text-red-500" : "text-3xl text-blue-500")}>
     {promptTitle}
    </h3>
    <p className="mt-4 text-lg font-bold text-stone-600">{promptSub}</p>
    <div className="mx-auto mt-8 grid max-w-3xl gap-3">
     {options.map((option, index) => {
      const isSelected = selectedAnswerId === option.id;
      const isCorrect = option.id === item.id;
      return (
       <button
        key={option.id}
        type="button"
        onClick={() => onSelectAnswer(option)}
        disabled={checked}
        className={cn(
         "flex min-h-20 items-center gap-4 rounded-3xl border-2 bg-white p-4 text-left shadow-theme-sm transition",
         checked && isCorrect && "border-emerald-400 bg-emerald-50",
         checked && isSelected && !isCorrect && "border-red-400 bg-red-50",
         !checked && "border-stone-200 hover:border-red-300 hover:bg-red-50/30",
        )}
       >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-stone-300 text-lg font-black text-stone-600">
         {answerLabels[index]}
        </span>
        <span>
         <span className="block text-2xl font-black text-red-500">
          {reverse ? getMeaning(option) : option.hanzi}
         </span>
         <span className="mt-1 block text-sm font-bold leading-6 text-stone-500">
          {reverse ? option.pinyin : getMeaning(option)}
         </span>
        </span>
       </button>
      );
     })}
    </div>
   </div>
  </div>
 );
}

function FlashcardBack({
 item,
 onSpeak,
}: {
 item: VocabWithProgress;
 onSpeak: () => void;
}) {
 const ai = item.ai_analysis || {};
 const primaryExample = ai.examples?.[0];
 const meaningDetail = ai.meaning_detail || ai.definitions?.[0]?.meaning || item.meaning;

 return (
  <div className="mx-auto mt-5 grid w-full gap-4 text-left lg:grid-cols-[0.9fr_1.1fr]">
   <div className="rounded-3xl border-2 border-stone-200 bg-white p-5 shadow-theme-sm">
    <div className="flex items-start justify-between gap-3">
     <div>
      <p className="text-2xl font-black text-red-500">{item.pinyin}</p>
      {(ai.han_viet || item.sino_vietnamese) && (
       <p className="mt-1 text-sm font-black text-stone-500">
        Hán Việt: {ai.han_viet || item.sino_vietnamese}
       </p>
      )}
     </div>
     <button
      type="button"
      onClick={onSpeak}
      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500"
      title="S phát âm"
     >
      <Volume2 className="h-5 w-5" />
     </button>
    </div>
    {ai.word_type && (
     <span className="mt-4 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
      {ai.word_type}
     </span>
    )}
    <p className="mt-4 text-lg font-black leading-8 text-stone-800">{meaningDetail}</p>
    {ai.decomposition && (
     <div className="mt-4 rounded-2xl bg-yellow-50 p-3">
      <p className="text-xs font-black uppercase text-orange-600">Chiết tự</p>
      <p className="mt-1 text-sm font-bold leading-6 text-stone-700">{ai.decomposition}</p>
     </div>
    )}
   </div>

   <div className="rounded-3xl border-2 border-stone-200 bg-white p-5 shadow-theme-sm">
    {ai.collocations?.length ? (
     <div>
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">Cụm hay gặp</p>
      <div className="mt-2 flex flex-wrap gap-2">
       {ai.collocations.slice(0, 3).map((collocation) => (
        <span key={collocation} className="rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-stone-700">
         {collocation}
        </span>
       ))}
      </div>
     </div>
    ) : null}

    {primaryExample && (
     <div className="mt-5 rounded-2xl bg-stone-50 p-4">
      <p className="text-sm font-black leading-6 text-stone-900">{primaryExample.zh}</p>
      <p className="mt-1 text-xs font-bold text-red-500">{primaryExample.pinyin}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{primaryExample.vi}</p>
      {primaryExample.note && (
       <p className="mt-2 text-xs font-bold leading-5 text-stone-500">→ {primaryExample.note}</p>
      )}
     </div>
    )}

    {(ai.usage_note || ai.cultural_note) && (
     <div className="mt-5 grid gap-2">
      {ai.usage_note && (
       <p className="rounded-2xl bg-blue-50 p-3 text-sm font-bold leading-6 text-blue-700">
        Lưu ý: {ai.usage_note}
       </p>
      )}
      {ai.cultural_note && (
       <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-700">
        Trung Việt: {ai.cultural_note}
       </p>
      )}
     </div>
    )}

    <Link
     href={`/dictionary/${encodeURIComponent(item.hanzi)}`}
     className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50"
    >
     Xem đủ 7 phần
     <ChevronRight className="h-4 w-4" />
    </Link>
   </div>
  </div>
 );
}

function ShortcutHelp() {
 return (
  <div className="mt-4 rounded-3xl border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <p className="text-sm font-black uppercase tracking-wide text-stone-500">Shortcut</p>
   <div className="mt-3 grid gap-2 text-sm font-bold text-stone-600 md:grid-cols-4">
    <span><kbd>Space</kbd> lật/tiếp</span>
    <span><kbd>1</kbd> chưa nhớ</span>
   <span><kbd>2</kbd> cần ôn</span>
   <span><kbd>3</kbd> đã nhớ</span>
    <span><kbd>Enter</kbd> kiểm tra</span>
    <span><kbd>A-D</kbd> chọn đáp án</span>
    <span><kbd>H</kbd> gợi ý</span>
    <span><kbd>J/K</kbd> tới/lùi</span>
    <span><kbd>S</kbd> phát âm</span>
    <span><kbd>D</kbd> mở chi tiết (ngoài quiz)</span>
    <span><kbd>?</kbd> ẩn/hiện</span>
   </div>
  </div>
 );
}

function Metric({ value, label, tone }: { value: number; label: string; tone: "yellow" | "blue" | "green" }) {
 const toneClass = {
  yellow: "border-yellow-300 bg-yellow-50 text-orange-600",
  blue: "border-blue-300 bg-blue-50 text-blue-600",
  green: "border-emerald-300 bg-emerald-50 text-emerald-600",
 }[tone];
 return (
  <div className={cn("min-w-24 rounded-2xl border-2 px-4 py-3 text-center shadow-theme-sm", toneClass)}>
   <p className="text-2xl font-black">{value}</p>
   <p className="text-xs font-black">{label}</p>
  </div>
 );
}

function WordCard({ item, onInspect, onDelete }: { item: VocabWithProgress; onInspect: (text: string) => void; onDelete: (id: string, hanzi: string) => void }) {
 return (
  <article className="rounded-3xl border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <div className="flex items-start justify-between gap-3">
    <Link href={`/dictionary/${encodeURIComponent(item.hanzi)}`} className="min-w-0">
     <h3 className="truncate text-3xl font-black text-stone-900">{item.hanzi}</h3>
     <p className="mt-1 truncate text-sm font-black text-red-500">{item.pinyin || "Không có pinyin"}</p>
    </Link>
    <StatusPill status={item.status} />
   </div>
   <p className="mt-3 line-clamp-2 min-h-11 text-sm font-bold leading-6 text-stone-600">
    {item.meaning || "Chưa có nghĩa tiếng Việt"}
   </p>
   <div className="mt-4 flex items-center justify-between border-t-2 border-stone-100 pt-3">
    <span className="truncate text-xs font-black uppercase tracking-wide text-stone-400">
     {item.source?.category || item.source?.lessonKey || "Đã lưu"}
    </span>
    <div className="flex gap-1">
     <IconButton label="Tra nhanh" onClick={() => onInspect(item.hanzi)} icon={Eye} />
     <IconButton label="Xóa" onClick={() => onDelete(item.id, item.hanzi)} icon={Trash2} danger />
    </div>
   </div>
  </article>
 );
}

function StatusPill({ status }: { status: VocabWithProgress["status"] }) {
 const config = {
  new: "bg-yellow-50 text-orange-600 border-yellow-300",
  learning: "bg-blue-50 text-blue-600 border-blue-300",
  mastered: "bg-emerald-50 text-emerald-600 border-emerald-300",
 }[status];
 const label = { new: "Mới", learning: "Đang ôn", mastered: "Thuộc" }[status];
 return <span className={cn("rounded-full border-2 px-2.5 py-1 text-xs font-black", config)}>{label}</span>;
}

function IconButton({ label, onClick, icon: Icon, danger }: { label: string; onClick: () => void; icon: typeof Eye; danger?: boolean }) {
 return (
  <button
   type="button"
   onClick={onClick}
   title={label}
   className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition", danger ? "text-red-500 hover:bg-red-50" : "text-stone-500 hover:bg-stone-100")}
  >
   <Icon className="h-4 w-4" />
  </button>
 );
}

function EmptyUnitList({ onImport }: { onImport: () => void }) {
 return (
  <div className="rounded-3xl border-2 border-dashed border-stone-200 p-5 text-center">
   <WalletCards className="mx-auto h-10 w-10 text-stone-300" />
   <p className="mt-3 text-sm font-black text-stone-700">Chưa có bài từ vựng</p>
   <button type="button" onClick={onImport} className="mt-4 text-sm font-black text-red-500">
    Import ngay
   </button>
  </div>
 );
}

function EmptyLearningPanel({ onImport }: { onImport: () => void }) {
 return (
  <div className="flex min-h-[540px] flex-col items-center justify-center text-center">
   <WalletCards className="h-16 w-16 text-stone-300" />
   <h2 className="mt-5 text-3xl font-black text-stone-900">Chưa có từ vựng</h2>
   <p className="mt-3 max-w-md text-base font-bold leading-7 text-stone-500">
    Import danh sách đã soạn để bắt đầu học theo bài.
   </p>
   <Button className="mt-6 rounded-2xl bg-red-500 hover:bg-red-600" onClick={onImport}>
    <Upload className="h-4 w-4" />
    Import từ vựng
   </Button>
  </div>
 );
}
