"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mic, Square, Star, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { upsertLearningLoopItem } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";

import type { ReaderDocumentResource } from "./reader-content-api";
import { buildReaderSourceHref } from "./reader-source-target";
import { useShadowingRecorder } from "./useShadowingRecorder";

type ShadowingAttempt = {
 confirmed: boolean;
 durationSeconds: number;
 id: string;
 isSaving: boolean;
 saveError: string | null;
 transcript: string;
 url: string;
};

type ShadowingPracticePanelProps = {
 paragraph: ReaderDocumentResource["paragraphs"][number];
 activeIndex: number;
 total: number;
 onNext: () => void;
 onPrevious: () => void;
};

export function ShadowingPracticePanel({
 paragraph,
 activeIndex,
 total,
 onNext,
 onPrevious,
}: ShadowingPracticePanelProps) {
 const t = useTranslations("Reader.study.shadowing");
 const tts = useSharedMandarinTts();
 const stopTts = tts.stop;
 const recorder = useShadowingRecorder();
 const [delayMs, setDelayMs] = useState(250);
 const [isShadowing, setIsShadowing] = useState(false);
 const [attempts, setAttempts] = useState<ShadowingAttempt[]>([]);
 const timerRef = useRef<number | null>(null);
 const attemptUrlsRef = useRef<string[]>([]);
 const lastBlobRef = useRef<Blob | null>(null);

 const clearTimer = () => {
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
 };

 useEffect(() => {
  const blob = recorder.audioBlob;
  if (blob === null || blob === lastBlobRef.current) return;
  lastBlobRef.current = blob;
  const url = URL.createObjectURL(blob);
  attemptUrlsRef.current.push(url);
  setAttempts((current) =>
   [
    {
     confirmed: false,
     durationSeconds: recorder.durationSeconds,
     id: `${paragraph.id}-${Date.now()}`,
     isSaving: false,
     saveError: null,
     transcript: "",
     url,
    },
    ...current,
   ].slice(0, 3),
  );
 }, [paragraph.id, recorder.audioBlob, recorder.durationSeconds]);

 useEffect(
  () => () => {
   clearTimer();
   stopTts();
   attemptUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
   attemptUrlsRef.current = [];
  },
  [stopTts],
 );

 const stopShadowing = () => {
  clearTimer();
  stopTts();
  recorder.stop();
  setIsShadowing(false);
 };

 const startShadowing = async () => {
  stopShadowing();
  recorder.clear();
  const started = await recorder.start();
  if (!started) return;
  setIsShadowing(true);
  timerRef.current = window.setTimeout(() => {
   timerRef.current = null;
   tts.speakSequence([paragraph.zh], () => {
    recorder.stop();
    setIsShadowing(false);
   });
  }, delayMs);
 };

 const confirmAttempt = (attempt: ShadowingAttempt) => {
  const transcript = attempt.transcript.trim();
  if (!transcript || attempt.confirmed || attempt.isSaving) return;
  setAttempts((current) =>
   current.map((item) =>
    item.id === attempt.id ? { ...item, isSaving: true, saveError: null } : item,
   ),
  );
  void savePracticeAttempt({
   surface: "shadowing",
   contentId: paragraph.id,
   direction: null,
   answer: {
    expectedText: paragraph.zh,
    transcript,
    durationSeconds: attempt.durationSeconds,
   },
   scorePercent: null,
   responseMs: attempt.durationSeconds * 1000,
  })
   .then(() => {
    setAttempts((current) =>
     current.map((item) =>
      item.id === attempt.id ? { ...item, confirmed: true, isSaving: false } : item,
     ),
    );
   })
   .catch((error: Error) => {
    setAttempts((current) =>
     current.map((item) =>
      item.id === attempt.id ? { ...item, isSaving: false, saveError: error.message } : item,
     ),
    );
   });
 };

 const recorderError =
  recorder.error === "permission-denied"
   ? t("errors.permissionDenied")
   : recorder.error === "unsupported"
     ? t("errors.unsupported")
     : recorder.error === "recording-failed"
       ? t("errors.recordingFailed")
       : !recorder.isSupported
         ? t("errors.unsupported")
         : null;

 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="black">
      Shadowing
     </Typography>
     <Typography variant="caption" tone="muted">
      {t("description", { delay: delayMs, current: activeIndex + 1, total })}
     </Typography>
    </div>
    <div className="flex items-center gap-1">
     <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      disabled={activeIndex === 0 || isShadowing}
      onClick={onPrevious}
      aria-label={t("previous")}
     >
      <ChevronLeft />
     </Button>
     <Button
      type="button"
      size="icon-xs"
      variant="ghost"
      disabled={activeIndex >= total - 1 || isShadowing}
      onClick={onNext}
      aria-label={t("next")}
     >
      <ChevronRight />
     </Button>
    </div>
   </div>

   <Card
    variant="subtle"
    padding="sm"
    className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
   >
    <label className="grid gap-1">
     <Typography as="span" variant="caption" tone="muted" weight="bold">
      {t("delay", { delay: delayMs })}
     </Typography>
     <Input
      type="range"
      min={0}
      max={1500}
      step={250}
      value={delayMs}
      disabled={isShadowing}
      onChange={(event) => setDelayMs(Number(event.target.value))}
      aria-label={t("delayAria")}
     />
    </label>
    <Button
     type="button"
     variant="outline"
     size="sm"
     onClick={() => {
      void savePracticeAttempt({
       surface: "shadowing",
       contentId: paragraph.id,
       direction: "review",
       answer: { expectedText: paragraph.zh, pinyin: paragraph.pinyin },
       scorePercent: null,
       responseMs: null,
      }).catch(() => undefined);
      const now = new Date().toISOString();
      void upsertLearningLoopItem({
       id: `shadowing:${paragraph.id}`,
       stable_key: `shadowing:${paragraph.id}`,
       kind: "shadowing",
       source_id: paragraph.id,
       source_href: buildReaderSourceHref({
        source: "shadowing",
        documentId: paragraph.document_id,
        paragraphId: paragraph.id,
       }),
       title_zh: "Shadowing",
       title_vi: "Ôn nói theo mẫu",
       prompt_zh: paragraph.zh,
       pinyin: paragraph.pinyin,
       meaning_vi: "",
       user_answer: "",
       error_key: "marked-difficult",
       state: "new",
       due_at: now,
       interval_days: 0,
       correct_streak: 0,
       lapse_count: 0,
       revision: 0,
      }).catch(() => undefined);
     }}
    >
     <Star data-icon="inline-start" />
     {t("markDifficult")}
    </Button>
   </Card>

   <div className="flex flex-wrap gap-2">
    <Button
     type="button"
     variant="outline"
     disabled={isShadowing || tts.isLoading}
     onClick={() => tts.speakSequence([paragraph.zh])}
    >
     <Volume2 data-icon="inline-start" />
     {t("listen")}
    </Button>
    {isShadowing || recorder.isRecording ? (
     <Button type="button" variant="destructive" onClick={stopShadowing}>
      <Square data-icon="inline-start" />
      {t("stopRecording")}
     </Button>
    ) : (
     <Button
      type="button"
      disabled={recorder.isRequesting || !recorder.isSupported}
      onClick={() => void startShadowing()}
     >
      <Mic data-icon="inline-start" />
      {recorder.isRequesting ? t("requestingPermission") : t("start")}
     </Button>
    )}
    {recorder.isRecording ? (
     <Typography
      as="span"
      variant="caption"
      tone="danger"
      className="inline-flex items-center gap-2 self-center"
     >
      <span className="size-2 animate-pulse rounded-full bg-danger" />
      {t("recording", { seconds: recorder.durationSeconds })}
     </Typography>
    ) : null}
   </div>

   {attempts.length > 0 ? (
    <Card variant="subtle" padding="sm" className="grid gap-2">
     <Typography as="h4" variant="caption" weight="black">
      {t("sessionRecordings")}
     </Typography>
     {attempts.map((attempt, index) => (
      <Card key={attempt.id} variant="default" padding="sm" className="grid gap-2">
       <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Typography variant="caption" tone="muted">
         {t("attempt", { number: attempts.length - index, seconds: attempt.durationSeconds })}
        </Typography>
        <audio
         controls
         preload="metadata"
         src={attempt.url}
         className="min-w-0 flex-1"
         aria-label={t("audioAria")}
        />
       </div>
       <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-1">
         <Typography as="span" variant="caption" tone="muted" weight="bold">
          {t("transcriptLabel")}
         </Typography>
         <Textarea
          value={attempt.transcript}
          disabled={attempt.confirmed || attempt.isSaving}
          onChange={(event) =>
           setAttempts((current) =>
            current.map((item) =>
             item.id === attempt.id
              ? { ...item, transcript: event.target.value, saveError: null }
              : item,
            ),
           )
          }
          placeholder={t("transcriptPlaceholder")}
          rows={2}
         />
        </label>
        <Button
         type="button"
         size="sm"
         disabled={!attempt.transcript.trim() || attempt.confirmed || attempt.isSaving}
         onClick={() => confirmAttempt(attempt)}
        >
         {attempt.confirmed ? t("saved") : attempt.isSaving ? t("saving") : t("saveAttempt")}
        </Button>
       </div>
       {attempt.saveError ? (
        <Typography variant="caption" tone="danger">
         {attempt.saveError}
        </Typography>
       ) : null}
      </Card>
     ))}
    </Card>
   ) : null}

   {recorderError ? (
    <Typography variant="caption" tone="danger">
     {recorderError}
    </Typography>
   ) : null}
  </Card>
 );
}
