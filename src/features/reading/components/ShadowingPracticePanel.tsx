"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";

import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import { useShadowingRecorder } from "@/features/reading/hooks/useShadowingRecorder";
import {
 ShadowingAttemptList,
 type ShadowingAttempt,
} from "@/features/reading/components/ShadowingAttemptList";
import { ShadowingDelayControls } from "@/features/reading/components/ShadowingDelayControls";
import { ShadowingPracticeHeader } from "@/features/reading/components/ShadowingPracticeHeader";

type ShadowingPracticePanelProps = {
 paragraph: ReaderDocumentResource["paragraphs"][number];
 activeIndex: number;
 total: number;
 onNext: () => void;
 onPrevious: () => void;
 /** Called when a recording session starts, so the parent can pin this paragraph. */
 onSessionStart: () => void;
};

export function ShadowingPracticePanel({
 paragraph,
 activeIndex,
 total,
 onNext,
 onSessionStart,
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
 const pendingTtsRef = useRef(false);
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
   // The shared lifecycle releases this flag before a Reader successor starts.
   if (pendingTtsRef.current) stopTts();
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
  onSessionStart();
  const started = await recorder.start();
  if (!started) return;
  setIsShadowing(true);
  timerRef.current = window.setTimeout(() => {
   timerRef.current = null;
   stopTts();
   pendingTtsRef.current = true;
   void tts
    .speakWithLifecycle(paragraph.zh, {
     rate: tts.rate,
     onSettled: () => {
      pendingTtsRef.current = false;
      recorder.stop();
      setIsShadowing(false);
     },
    })
    .catch(() => {});
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

 const updateTranscript = (attemptId: string, event: ChangeEvent<HTMLTextAreaElement>) =>
  setAttempts((current) =>
   current.map((item) =>
    item.id === attemptId ? { ...item, transcript: event.target.value, saveError: null } : item,
   ),
  );

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
   <ShadowingPracticeHeader
    delayMs={delayMs}
    activeIndex={activeIndex}
    total={total}
    navigationDisabled={isShadowing}
    onPrevious={onPrevious}
    onNext={onNext}
   />

   <ShadowingDelayControls
    paragraph={paragraph}
    delayMs={delayMs}
    disabled={isShadowing}
    onDelayChange={setDelayMs}
   />

   <div className="flex flex-wrap gap-2">
    <Button
     type="button"
     variant="outline"
     disabled={isShadowing || tts.isLoading}
     onClick={() => {
      stopTts();
      pendingTtsRef.current = true;
      void tts
       .speakWithLifecycle(paragraph.zh, {
        rate: tts.rate,
        onSettled: () => {
         pendingTtsRef.current = false;
        },
       })
       .catch(() => {});
     }}
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
    <ShadowingAttemptList
     attempts={attempts}
     onTranscriptChange={updateTranscript}
     onConfirm={confirmAttempt}
    />
   ) : null}

   {recorderError ? (
    <Typography variant="caption" tone="danger">
     {recorderError}
    </Typography>
   ) : null}
  </Card>
 );
}
