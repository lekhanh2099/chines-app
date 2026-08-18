"use client";

import { ChevronRight, FileText, RefreshCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

import {
 generateDailyReadingNow,
 useDailyReadingLibrary,
 useDailyReadingSettings,
} from "./daily-reading-client";
import type { DailyReading } from "./daily-reading.schemas";

const generatedTabs = [
 { key: "reader", label: "Đọc bài" },
 { key: "questions", label: "Câu hỏi" },
 { key: "vocabulary", label: "Từ vựng" },
 { key: "grammar", label: "Ngữ pháp" },
 { key: "source", label: "Nguồn" },
] as const;
type GeneratedTab = (typeof generatedTabs)[number]["key"];

export function GeneratedDailyReadingLibrary({ onOpen }: { onOpen(id: string): void }) {
 const library = useDailyReadingLibrary();
 const { settings } = useDailyReadingSettings();
 const [generating, setGenerating] = useState(false);

 async function generate() {
  setGenerating(true);
  try {
   const reading = await generateDailyReadingNow("manual", settings.preferredLevel);
   toast.success(`Đã tạo bài: ${reading.titleZh}`);
   onOpen(reading.id);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : "Không thể tạo Daily Reading.");
  } finally {
   setGenerating(false);
  }
 }

 return (
  <section className="grid gap-3" aria-labelledby="generated-daily-reading-heading">
   <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="grid gap-1">
     <Typography variant="overline" tone="accent" weight="black">Thư viện local</Typography>
     <Typography as="h2" variant="sectionTitle" id="generated-daily-reading-heading" weight="black">
      Bài được tạo từ nguồn thật
     </Typography>
     <Typography variant="bodySmall" tone="muted">
      Mỗi bài là 学习版 được AI biên soạn từ một nguồn báo chí đã trích xuất và kiểm tra domain.
     </Typography>
    </div>
    <Button type="button" size="toolbar" onClick={() => void generate()} disabled={generating}>
     {generating ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
     Tìm và tạo bài ngay
    </Button>
   </div>

   {library.items.length === 0 ? (
    <Card variant="subtle" padding="md" className="flex flex-wrap items-center justify-between gap-3">
     <div className="grid gap-1">
      <Typography weight="semibold">Chưa có bài AI nào trên thiết bị này.</Typography>
      <Typography variant="bodySmall" tone="muted">
       Auto đang {settings.autoGenerateEnabled ? "bật" : "tắt"}; mặc định {settings.preferredLevel}.
      </Typography>
     </div>
     <Badge variant={settings.autoGenerateEnabled ? "success" : "default"}>
      {settings.autoGenerateEnabled ? "Auto 10:00" : "Manual only"}
     </Badge>
    </Card>
   ) : (
    <div className="grid gap-3 lg:grid-cols-2">
     {library.items.slice(0, 8).map((reading) => (
      <Card key={reading.id} variant="interactive" padding="md">
       <button
        type="button"
        className="group grid w-full min-w-0 gap-3 text-left"
        onClick={() => onOpen(reading.id)}
       >
        <div className="flex flex-wrap gap-2">
         <Badge variant={reading.releaseKind === "scheduled" ? "success" : "info"} size="sm">
          {reading.releaseKind === "scheduled" ? "Tự động" : "Thủ công"}
         </Badge>
         <Badge variant="warning" size="sm">{reading.level}</Badge>
         <Badge size="sm">{reading.topic}</Badge>
        </div>
        <div className="grid min-w-0 gap-1">
         <Typography variant="caption" tone="muted" weight="bold">
          {reading.publishedDate} · {reading.estimatedMinutes} phút · {reading.source.publisher}
         </Typography>
         <HanziText as="h3" size="card" clamp="two">{reading.titleZh}</HanziText>
         <Typography variant="bodySmall" tone="secondary" clamp="two">{reading.titleVi}</Typography>
        </div>
        <div className="flex items-center gap-1">
         <Typography as="span" variant="bodySmall" tone="accent" weight="bold">Đọc bài</Typography>
         <ChevronRight aria-hidden />
        </div>
       </button>
      </Card>
     ))}
    </div>
   )}
  </section>
 );
}

function Questions({ reading }: { reading: DailyReading }) {
 const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
 return (
  <div className="grid gap-3">
   {reading.questions.map((question, index) => {
    const isRevealed = revealed.has(question.id);
    return (
     <Card key={question.id} variant="section" padding="md" className="grid gap-3">
      <div className="flex items-start gap-3">
       <Badge variant="info" size="sm">{index + 1}</Badge>
       <div className="grid min-w-0 gap-1">
        <HanziText as="p" size="body">{question.promptZh}</HanziText>
        <Typography variant="bodySmall" tone="muted">{question.promptVi}</Typography>
       </div>
      </div>
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       className="justify-self-start"
       onClick={() =>
        setRevealed((current) => {
         const next = new Set(current);
         if (next.has(question.id)) next.delete(question.id);
         else next.add(question.id);
         return next;
        })
       }
      >
       {isRevealed ? "Ẩn đáp án" : "Xem đáp án"}
      </Button>
      {isRevealed ? (
       <Card variant="subtle" padding="md" className="grid gap-1">
        <HanziText as="p" size="body">{question.answerZh}</HanziText>
        <Typography variant="bodySmall" tone="secondary">{question.answerVi}</Typography>
       </Card>
      ) : null}
     </Card>
    );
   })}
  </div>
 );
}

export function GeneratedDailyReadingView({
 id,
 onBack,
}: {
 id: string;
 onBack(): void;
}) {
 const library = useDailyReadingLibrary();
 const reading = library.items.find((item) => item.id === id) ?? null;
 const [tab, setTab] = useState<GeneratedTab>("reader");
 if (reading === null) {
  return (
   <Card variant="subtle" padding="lg" className="grid gap-3">
    <Typography tone="danger">Không tìm thấy bài Daily Reading đã lưu trên thiết bị này.</Typography>
    <Button type="button" variant="outline" size="toolbar" className="justify-self-start" onClick={onBack}>
     Quay lại thư viện
    </Button>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-4">
   <Button type="button" variant="ghost" size="toolbar" className="justify-self-start" onClick={onBack}>
    ← Danh sách bài hằng ngày
   </Button>
   <div className="grid gap-3 border-b border-border-default pb-4">
    <div className="flex flex-wrap gap-2">
     <Badge variant={reading.releaseKind === "scheduled" ? "success" : "info"}>
      {reading.releaseKind === "scheduled" ? "Tự động" : "Thủ công"}
     </Badge>
     <Badge variant="warning">{reading.level}</Badge>
     <Badge>{reading.topic}</Badge>
     <Badge>{reading.estimatedMinutes} phút</Badge>
    </div>
    <HanziText as="h1" size="card" weight="black">{reading.titleZh}</HanziText>
    <Typography variant="bodySmall" tone="secondary">{reading.titleVi}</Typography>
    <Typography variant="bodySmall" tone="muted">{reading.whyWorthReadingVi}</Typography>
   </div>

   <Tabs value={tab} items={generatedTabs} onValueChange={setTab} aria-label="Các phần của Daily Reading tạo tự động">
    <TabsContent value={tab} className="pt-4">
     {tab === "reader" ? (
      <div className="grid gap-4">
       {reading.paragraphs.map((paragraph) => (
        <Card key={paragraph.id} variant="section" padding="md" className="grid gap-2">
         {paragraph.roleVi ? <Typography variant="caption" tone="muted" weight="bold">{paragraph.roleVi}</Typography> : null}
         <HanziText as="p" size="large" leading="relaxed" wrapping="breakWords">{paragraph.zh}</HanziText>
         <Separator />
         <Typography as="p" tone="secondary" leading="relaxed">{paragraph.vi}</Typography>
        </Card>
       ))}
      </div>
     ) : null}
     {tab === "questions" ? <Questions reading={reading} /> : null}
     {tab === "vocabulary" ? (
      <div className="grid gap-3 sm:grid-cols-2">
       {reading.vocabulary.map((item) => (
        <Card key={item.id} variant="section" padding="md" className="grid gap-1">
         <div className="flex flex-wrap items-center gap-2">
          <HanziText as="h3" size="body" weight="black">{item.hanzi}</HanziText>
          <Badge size="sm">{item.categoryVi}</Badge>
         </div>
         <Typography variant="bodySmall" weight="semibold">{item.meaningVi}</Typography>
         <Typography variant="bodySmall" tone="muted">Trong bài: {item.meaningInContextVi}</Typography>
        </Card>
       ))}
      </div>
     ) : null}
     {tab === "grammar" ? (
      <div className="grid gap-3">
       {reading.grammarPoints.map((grammar, index) => (
        <Card key={grammar.id} variant="section" padding="md" className="grid gap-2">
         <div className="flex items-center gap-2">
          <Badge variant="warning">{index + 1}</Badge>
          <HanziText as="h3" size="body" weight="black">{grammar.patternZh}</HanziText>
         </div>
         <Typography variant="bodySmall" tone="secondary">{grammar.explanationVi}</Typography>
         <HanziText as="p" size="body" leading="relaxed">{grammar.evidenceSentenceZh}</HanziText>
        </Card>
       ))}
      </div>
     ) : null}
     {tab === "source" ? (
      <Card variant="subtle" padding="md" className="grid gap-3">
       <div className="flex items-start gap-3">
        <FileText aria-hidden />
        <div className="grid min-w-0 gap-1">
         <HanziText as="h3" size="body" weight="black">{reading.source.titleZh}</HanziText>
         <Typography variant="bodySmall" tone="muted">{reading.source.publisher} · {new Date(reading.source.publishedAt).toLocaleString()}</Typography>
        </div>
       </div>
       <Typography variant="bodySmall" tone="secondary">{reading.adaptationNoticeVi}</Typography>
       <Typography variant="bodySmall" tone="muted">{reading.verificationSummaryVi}</Typography>
       <Button type="button" variant="outline" size="toolbar" asChild className="justify-self-start">
        <a href={reading.source.url} target="_blank" rel="noreferrer">Mở bài nguồn</a>
       </Button>
       <Typography variant="caption" tone="muted">AI: {reading.generatedByProvider} · {reading.generatedByModel}</Typography>
      </Card>
     ) : null}
    </TabsContent>
   </Tabs>
  </div>
 );
}
