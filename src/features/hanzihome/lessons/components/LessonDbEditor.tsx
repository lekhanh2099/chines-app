"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonTextInlineEditor } from "@/features/hanzihome/components/LessonTextInlineEditor";
import { VocabWorkspace } from "@/features/hanzihome/components/VocabWorkspace";
import { useHanziHomeLessonDetail } from "@/features/hanzihome/hooks/useHanziHomeLessonDetail";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type { LearningStatus } from "@/features/hanzihome/types";

type LessonDbEditorProps = {
 lessonId: string;
};

type EditorTab = "overview" | "lessonText" | "vocab" | "grammar" | "import" | "preview";

const tabs: Array<{ key: EditorTab; label: string }> = [
 { key: "overview", label: "Tổng quan" },
 { key: "lessonText", label: "Bài khóa" },
 { key: "vocab", label: "Từ vựng" },
 { key: "grammar", label: "Ngữ pháp" },
 { key: "import", label: "Import" },
 { key: "preview", label: "Preview" },
];

export function LessonDbEditor({ lessonId }: LessonDbEditorProps) {
 const searchParams = useSearchParams();
 const courseId = searchParams.get("courseId") || "";
 const [activeTab, setActiveTab] = useState<EditorTab>("overview");

 const lesson = useHanziHomeLessonDetail(lessonId);
 const learning = useLearningState();

 const markVocab = (id: string, status: LearningStatus) => {
  learning.updateVocabProgress(id, status);
 };

 const markGrammar = (id: string, status: LearningStatus) => {
  learning.updateGrammarProgress(id, status);
 };

 if (!lesson) {
  return (
   <main className="hanzihome-static-page">
    <Card padding="lg" className="rounded-xl">
     <p className="text-sm font-semibold text-text-muted">
      Đang tải bài học hoặc không tìm thấy lesson.
     </p>
    </Card>
   </main>
  );
 }

 const isSeedLesson = lesson.courseId === "hanyu-jiaocheng";
 const backHref = courseId
  ? `/hanzihome?courseId=${courseId}&lessonId=${lesson.id}`
  : `/hanzihome?lessonId=${lesson.id}`;

 return (
  <main className="hanzihome-static-page">
   <div className="grid w-full max-w-full gap-4">
    <Card padding="md" className="rounded-xl">
     <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="min-w-0">
       <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href={backHref}>
         <ArrowLeft className="h-4 w-4" />
         Quay lại bài học
        </Link>
       </Button>

       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Lesson editor
       </p>

       <h1 className="truncate text-2xl font-black text-text-primary sm:text-3xl">
        Bài {lesson.lessonNumber}: {lesson.titleZh}
       </h1>

       <p className="text-sm font-bold text-text-muted">
        {isSeedLesson
         ? "Bài mặc định chỉ đọc"
         : "Bản cá nhân · chỉnh sửa trực tiếp trong DB"}
       </p>
      </div>
     </div>
    </Card>

    {isSeedLesson && (
     <Card padding="lg" className="rounded-xl border-warning bg-warning-subtle">
      <p className="text-sm font-black text-warning-text">
       Đây là seed course mặc định. Muốn sửa, hãy tạo bản cá nhân trước.
      </p>
     </Card>
    )}

    <div className="grid gap-3 md:grid-cols-3">
     <StatCard label="Từ vựng" value={lesson.vocab.length} />
     <StatCard label="Ngữ pháp" value={lesson.grammar.length} />
     <StatCard label="Bài" value={lesson.lessonNumber} />
    </div>

    <Card padding="sm" className="rounded-xl">
     <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
       <Button
        key={tab.key}
        type="button"
        variant={activeTab === tab.key ? "default" : "ghost"}
        onClick={() => setActiveTab(tab.key)}
       >
        {tab.key === "import" && <Upload className="h-4 w-4" />}
        {tab.label}
       </Button>
      ))}
     </div>
    </Card>

    {activeTab === "overview" && (
     <Card padding="lg" className="rounded-xl">
      <div className="grid gap-2">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Metadata
       </p>
       <h2 className="text-xl font-black text-text-primary">
        {lesson.title}
       </h2>
       <p className="text-sm font-semibold text-text-muted">
        Metadata editor cho lesson thật sẽ nối ở bước sau. Hiện tại sửa nội dung ở các tab Bài khóa, Từ vựng, Ngữ pháp.
       </p>
      </div>
     </Card>
    )}

    {activeTab === "lessonText" && <LessonTextInlineEditor lesson={lesson} />}

    {activeTab === "vocab" && (
     <VocabWorkspace
      lesson={lesson}
      state={learning.state}
      onBookmark={(id) => learning.toggleBookmark("vocab", id)}
      onMarkStatus={markVocab}
     />
    )}

    {activeTab === "grammar" && (
     <GrammarWorkspace
      lesson={lesson}
      state={learning.state}
      onBookmark={(id) => learning.toggleBookmark("grammar", id)}
      onMarkStatus={markGrammar}
     />
    )}

    {activeTab === "import" && (
     <Card padding="lg" className="rounded-xl">
      <div className="grid gap-3">
       <FileText className="h-6 w-6 text-text-muted" />
       <h2 className="text-xl font-black text-text-primary">Import Markdown</h2>
       <p className="text-sm font-semibold text-text-muted">
        Import Markdown hiện vẫn đang gắn với draft editor. Bước sau mới nối importer này để apply trực tiếp vào DB lesson.
       </p>
      </div>
     </Card>
    )}

    {activeTab === "preview" && (
     <Card padding="lg" className="rounded-xl">
      <div className="grid gap-3">
       <FileText className="h-6 w-6 text-text-muted" />
       <h2 className="text-xl font-black text-text-primary">Preview</h2>
       <p className="text-sm font-semibold text-text-muted">
        Preview lesson thật đang nằm ở workspace học bài.
       </p>
       <Button asChild className="w-fit">
        <Link href={backHref}>Mở bài học</Link>
       </Button>
      </div>
     </Card>
    )}
   </div>
  </main>
 );
}

function StatCard({ label, value }: { label: string; value: number }) {
 return (
  <Card padding="sm" className="rounded-xl">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">
    {label}
   </p>
   <p className="text-2xl font-black text-text-primary">{value}</p>
  </Card>
 );
}
