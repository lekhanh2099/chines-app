"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

const RecorderStatusSchema = z.enum([
 "idle",
 "requesting",
 "recording",
 "processing",
 "ready",
 "error",
]);
type RecorderStatus = z.infer<typeof RecorderStatusSchema>;
type NullableString = z.infer<z.ZodNullable<z.ZodString>>;

export function SpeakingRecorder({ label = "Thu âm phần luyện nói" }: { label?: string }) {
 const recorderRef = useRef<MediaRecorder | null>(null);
 const streamRef = useRef<MediaStream | null>(null);
 const chunksRef = useRef<Blob[]>([]);
 const audioUrlRef = useRef<NullableString>(null);
 const [status, setStatus] = useState<RecorderStatus>("idle");
 const [audioUrl, setAudioUrl] = useState<NullableString>(null);
 const [errorMessage, setErrorMessage] = useState<NullableString>(null);

 const stopStream = useCallback(() => {
  streamRef.current?.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
 }, []);

 const replaceAudioUrl = useCallback((nextUrl: NullableString) => {
  if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  audioUrlRef.current = nextUrl;
  setAudioUrl(nextUrl);
 }, []);

 const startRecording = useCallback(async () => {
  if (
   typeof navigator === "undefined" ||
   !navigator.mediaDevices?.getUserMedia ||
   typeof MediaRecorder === "undefined"
  ) {
   setStatus("error");
   setErrorMessage("Trình duyệt này chưa hỗ trợ thu âm bằng MediaRecorder.");
   return;
  }

  setStatus("requesting");
  setErrorMessage(null);
  replaceAudioUrl(null);

  try {
   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
   const recorder = new MediaRecorder(stream);
   streamRef.current = stream;
   recorderRef.current = recorder;
   chunksRef.current = [];

   recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunksRef.current.push(event.data);
   });
   recorder.addEventListener("stop", () => {
    const blob = new Blob(chunksRef.current, {
     type: recorder.mimeType || "audio/webm",
    });
    chunksRef.current = [];
    recorderRef.current = null;
    stopStream();

    if (blob.size === 0) {
     setStatus("error");
     setErrorMessage("Không nhận được dữ liệu âm thanh. Thử thu lại.");
     return;
    }

    replaceAudioUrl(URL.createObjectURL(blob));
    setStatus("ready");
   });
   recorder.addEventListener("error", () => {
    recorderRef.current = null;
    stopStream();
    setStatus("error");
    setErrorMessage("Thu âm bị gián đoạn. Thử lại sau khi kiểm tra quyền micro.");
   });

   recorder.start();
   setStatus("recording");
  } catch (error) {
   stopStream();
   setStatus("error");
   setErrorMessage(
    error instanceof DOMException && error.name === "NotAllowedError"
     ? "Chưa có quyền dùng micro. Cho phép micro rồi thử lại."
     : "Không mở được micro. Kiểm tra thiết bị và quyền truy cập rồi thử lại.",
   );
  }
 }, [replaceAudioUrl, stopStream]);

 const stopRecording = useCallback(() => {
  const recorder = recorderRef.current;
  if (!recorder || recorder.state === "inactive") return;

  setStatus("processing");
  recorder.stop();
 }, []);

 const resetRecording = useCallback(() => {
  const recorder = recorderRef.current;
  if (recorder && recorder.state !== "inactive") recorder.stop();
  recorderRef.current = null;
  chunksRef.current = [];
  stopStream();
  replaceAudioUrl(null);
  setErrorMessage(null);
  setStatus("idle");
 }, [replaceAudioUrl, stopStream]);

 useEffect(
  () => () => {
   const recorder = recorderRef.current;
   if (recorder && recorder.state !== "inactive") recorder.stop();
   stopStream();
   if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
   audioUrlRef.current = null;
  },
  [stopStream],
 );

 return (
  <Card variant="subtle" padding="md" className="grid gap-3">
   <div className="grid gap-1">
    <Typography as="h3" variant="bodySmall" tone="default" weight="black">
     {label}
    </Typography>
    <Typography as="p" variant="caption" tone="muted">
     Bản ghi chỉ tồn tại trong phiên trình duyệt này; app không tải audio lên server.
    </Typography>
   </div>

   <div className="flex flex-wrap items-center gap-2">
    {status !== "recording" && status !== "processing" ? (
     <Button type="button" size="touch" onClick={() => void startRecording()}>
      <Mic data-icon="inline-start" />
      {audioUrl ? "Thu lại" : "Bắt đầu thu"}
     </Button>
    ) : null}
    {status === "recording" ? (
     <Button type="button" variant="destructive" size="touch" onClick={stopRecording}>
      <Square data-icon="inline-start" />
      Dừng thu
     </Button>
    ) : null}
    {audioUrl ? (
     <Button type="button" variant="outline" size="touch" onClick={resetRecording}>
      <RotateCcw data-icon="inline-start" />
      Bỏ bản ghi
     </Button>
    ) : null}
   </div>

   <Typography
    as="p"
    variant="caption"
    tone={status === "error" ? "danger" : "muted"}
    aria-live="polite"
   >
    {status === "requesting" ? "Đang xin quyền micro…" : null}
    {status === "recording" ? "Đang thu âm…" : null}
    {status === "processing" ? "Đang tạo bản phát lại…" : null}
    {status === "ready" ? "Bản ghi đã sẵn sàng để nghe lại." : null}
    {status === "error" ? errorMessage : null}
    {status === "idle"
     ? "Nghe mẫu trước, sau đó thu và tự so sánh nhịp, thanh điệu, độ trôi chảy."
     : null}
   </Typography>

   {audioUrl ? <audio controls preload="metadata" src={audioUrl} className="w-full" /> : null}
  </Card>
 );
}
