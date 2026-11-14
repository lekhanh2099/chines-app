"use client";

import { Mic, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Label } from "@/components/ui/forms/label";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";

import type { useAiConversationSpeech } from "../useAiConversationSpeech";

export function AiConversationComposer({
 draft,
 isSending,
 isSessionError,
 canSend,
 speech,
 onDraftChange,
 onSend,
}: {
 draft: string;
 isSending: boolean;
 isSessionError: boolean;
 canSend: boolean;
 speech: ReturnType<typeof useAiConversationSpeech>;
 onDraftChange: (value: string) => void;
 onSend: () => void;
}) {
 const t = useTranslations("AiConversation");
 const { isSpeechSupported, isListening, isSpeechPending, speechError, toggleSpeech } = speech;

 return (
  <form
   className="grid shrink-0 gap-2 border-t border-border-default bg-surface px-3 py-3 sm:px-4"
   onSubmit={(event) => {
    event.preventDefault();
    onSend();
   }}
  >
   <Label htmlFor="ai-conversation-message" className="sr-only">
    {t("message.label")}
   </Label>
   <div className="flex items-end gap-2">
    <Textarea
     id="ai-conversation-message"
     value={draft}
     onChange={(event) => onDraftChange(event.target.value)}
     onKeyDown={(event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
       event.preventDefault();
       onSend();
      }
     }}
     rows={1}
     maxLength={6000}
     disabled={isSending || isSessionError}
     placeholder={t("message.placeholder")}
     className="min-h-11 max-h-40 flex-1"
    />
    {isSpeechSupported ? (
     <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleSpeech}
      disabled={isSpeechPending || isSending || isSessionError}
      aria-label={isListening ? t("actions.stopVoice") : t("actions.startVoice")}
      aria-pressed={isListening}
      title={isListening ? t("actions.stopVoice") : t("actions.startVoice")}
     >
      <Mic className={isListening ? "motion-safe:animate-pulse text-danger" : undefined} />
     </Button>
    ) : null}
    <Button
     type="submit"
     size="icon"
     disabled={!draft.trim() || !canSend}
     aria-label={isSending ? t("actions.sending") : t("actions.send")}
    >
     <Send />
    </Button>
   </div>
   <Typography variant="caption" tone="muted">
    {t("message.hint")}
   </Typography>
   {isSpeechSupported ? (
    <Typography
     variant="caption"
     tone={speechError ? "danger" : "muted"}
     role={speechError ? "alert" : "status"}
    >
     {speechError ||
      (isSpeechPending && isListening
       ? t("message.speechStopping")
       : isSpeechPending
         ? t("message.speechPending")
         : isListening
           ? t("message.speechListening")
           : t("message.speechHint"))}
    </Typography>
   ) : null}
  </form>
 );
}
