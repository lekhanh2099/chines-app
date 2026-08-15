"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Volume2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";

import { fetchLearningLoopItems, rateLearningLoopItem } from "./learning-loop-api";
import type { LearningLoopItem } from "./learning-loop.schemas";

const kindLabels: Record<LearningLoopItem["kind"], string> = {
 dictation_mistake: "Dictation",
 vocabulary: "Từ vựng",
 reading_bookmark: "Reader",
 shadowing: "Shadowing",
 minimal_contrast: "Minimal contrast",
 error_correction: "Sửa lỗi",
 sentence_transformation: "Biến đổi câu",
 guided_production: "Tạo câu",
 timed_production: "Phản xạ",
 delayed_transfer: "Transfer",
};

export function LearningLoopWorkspace() {
 const tts = useSharedMandarinTts();
 const queryClient = useQueryClient();
 const [answer, setAnswer] = useState("");
 const [error, setError] = useState<string | null>(null);
 const query = useQuery({
  queryKey: [...hanzihomeQueryKeys.root, "learning-loop"],
  queryFn: fetchLearningLoopItems,
  staleTime: 0,
 });
 const rateMutation = useMutation({
  mutationFn: rateLearningLoopItem,
  onSuccess: async () => {
   setAnswer("");
   setError(null);
   await queryClient.invalidateQueries({ queryKey: [...hanzihomeQueryKeys.root, "learning-loop"] });
  },
  onError: (caught: Error) => setError(caught.message),
 });
 const item = useMemo(() => query.data?.[0] ?? null, [query.data]);

 if (query.isPending) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     Đang tải Learning Loop…
    </Typography>
   </Card>
  );
 }
 if (query.isError) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="danger">
     {query.error.message}
    </Typography>
   </Card>
  );
 }
 if (item === null) {
  return (
   <Card variant="section" padding="lg" className="grid gap-2">
    <Typography as="h1" variant="pageTitle" weight="black">
     Learning Loop
    </Typography>
    <Typography variant="body" tone="muted">
     Chưa có item đến hạn. Các lỗi và bookmark mới sẽ xuất hiện ở đây.
    </Typography>
    <Button type="button" variant="outline" onClick={() => void query.refetch()}>
     <RotateCcw data-icon="inline-start" />
     Kiểm tra lại
    </Button>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-5">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     Learning Loop
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     Review lỗi, shadowing và từ vựng theo lịch học của HanziHome.
    </Typography>
   </div>
   <Card variant="section" padding="lg" className="grid gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <Badge variant="purple">{kindLabels[item.kind] ?? item.kind}</Badge>
      <Typography as="h2" variant="sectionTitle" weight="black" lang="zh-CN">
       {item.prompt_zh}
      </Typography>
      <Typography variant="bodySmall" tone="muted">
       {item.title_vi || item.meaning_vi}
      </Typography>
     </div>
     <Typography variant="caption" tone="muted">
      Chuỗi đúng: {item.correct_streak}
     </Typography>
    </div>
    {item.pinyin ? (
     <Typography variant="body" tone="accent">
      {item.pinyin}
     </Typography>
    ) : null}
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      variant="outline"
      disabled={tts.isLoading}
      onClick={() => tts.speakSequence([item.prompt_zh])}
     >
      <Volume2 data-icon="inline-start" />
      Nghe
     </Button>
     <Button
      type="button"
      variant="ghost"
      disabled={!tts.isSpeaking && !tts.isLoading}
      onClick={tts.stop}
     >
      Dừng
     </Button>
    </div>
    <label className="grid gap-2">
     <Typography as="span" variant="label" weight="bold">
      Câu trả lời của bạn
     </Typography>
     <Input
      value={answer}
      onChange={(event) => setAnswer(event.target.value)}
      placeholder="Nhập câu trả lời hoặc ghi nhớ…"
     />
    </label>
    {item.meaning_vi ? (
     <Typography variant="caption" tone="muted">
      Nghĩa tham chiếu: {item.meaning_vi}
     </Typography>
    ) : null}
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      variant="destructive"
      disabled={rateMutation.isPending}
      onClick={() =>
       rateMutation.mutate({ itemId: item.id, rating: "again", expectedRevision: item.revision })
      }
     >
      Lại
     </Button>
     <Button
      type="button"
      variant="outline"
      disabled={rateMutation.isPending}
      onClick={() =>
       rateMutation.mutate({ itemId: item.id, rating: "hard", expectedRevision: item.revision })
      }
     >
      Khó
     </Button>
     <Button
      type="button"
      disabled={rateMutation.isPending}
      onClick={() =>
       rateMutation.mutate({ itemId: item.id, rating: "good", expectedRevision: item.revision })
      }
     >
      Tốt
     </Button>
    </div>
    {error ? (
     <Typography variant="caption" tone="danger">
      {error}
     </Typography>
    ) : null}
   </Card>
  </div>
 );
}
