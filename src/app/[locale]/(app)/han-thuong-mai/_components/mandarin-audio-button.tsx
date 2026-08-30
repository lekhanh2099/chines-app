"use client";

import { Loader2, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const voiceSchema = z.strictObject({
 name: z.string(),
 shortName: z.string(),
 gender: z.string(),
 locale: z.string(),
});
const voicesSchema = z.array(voiceSchema);

let preferredVoice: string | null = null;

async function loadPreferredVoice() {
 if (preferredVoice !== null) return preferredVoice;
 const response = await fetch("/api/tts", { method: "GET" });
 if (!response.ok) throw new Error("voice-list-failed");
 const parsed = voicesSchema.safeParse(await response.json());
 if (!parsed.success) throw new Error("voice-list-invalid");
 const voice =
  parsed.data.find((candidate) => candidate.shortName === "zh-CN-XiaoxiaoNeural") ??
  parsed.data.at(0);
 if (voice === undefined) throw new Error("voice-list-empty");
 preferredVoice = voice.shortName;
 return voice.shortName;
}

export function MandarinAudioButton({ text }: { text: string }) {
 const t = useTranslations("BusinessChinese");
 const [loading, setLoading] = useState(false);
 const activeAudioRef = useRef<{ audio: HTMLAudioElement; url: string } | null>(null);

 useEffect(
  () => () => {
   const active = activeAudioRef.current;
   if (active === null) return;
   active.audio.pause();
   URL.revokeObjectURL(active.url);
  },
  [],
 );

 async function play() {
  if (loading) return;
  setLoading(true);
  try {
   const previous = activeAudioRef.current;
   if (previous !== null) {
    previous.audio.pause();
    URL.revokeObjectURL(previous.url);
    activeAudioRef.current = null;
   }

   const voice = await loadPreferredVoice();
   const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice, rate: 1 }),
   });
   if (!response.ok) throw new Error("tts-failed");

   const url = URL.createObjectURL(await response.blob());
   const audio = new Audio(url);
   activeAudioRef.current = { audio, url };
   audio.addEventListener(
    "ended",
    () => {
     if (activeAudioRef.current?.audio === audio) activeAudioRef.current = null;
     URL.revokeObjectURL(url);
    },
    { once: true },
   );
   await audio.play();
  } catch {
   toast.error(t("audio.failed"));
  } finally {
   setLoading(false);
  }
 }

 return (
  <Button
   type="button"
   variant="ghost"
   size="icon-toolbar"
   aria-label={t("audio.play")}
   title={t("audio.play")}
   disabled={loading}
   onClick={() => void play()}
  >
   {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
  </Button>
 );
}
