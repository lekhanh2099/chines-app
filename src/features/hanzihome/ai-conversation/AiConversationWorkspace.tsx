"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

import { sendAiConversationMessage } from "./ai-conversation-api";
import type { AiConversationMessage } from "./ai-conversation.schemas";

const initialMessage: AiConversationMessage = {
 role: "assistant",
 content: "你好! Mình có thể luyện hội thoại, giải thích pinyin, ngữ pháp hoặc dịch câu cùng bạn.",
};

export function AiConversationWorkspace() {
 const [messages, setMessages] = useState<AiConversationMessage[]>([initialMessage]);
 const [draft, setDraft] = useState("");
 const [isSending, setIsSending] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const requestRef = useRef<AbortController | null>(null);

 useEffect(() => () => requestRef.current?.abort(), []);

 const send = async () => {
  const content = draft.normalize("NFC").trim();
  if (!content || isSending) return;

  const userMessage: AiConversationMessage = { role: "user", content };
  const nextMessages = [...messages, userMessage];
  setMessages(nextMessages);
  setDraft("");
  setError(null);
  setIsSending(true);
  requestRef.current?.abort();
  const controller = new AbortController();
  requestRef.current = controller;

  try {
   const reply = await sendAiConversationMessage(nextMessages, controller.signal);
   setMessages((current) => [...current, { role: "assistant", content: reply }]);
  } catch (caught) {
   if (controller.signal.aborted) return;
   setError(caught instanceof Error ? caught.message : "Không thể gửi hội thoại.");
  } finally {
   if (requestRef.current === controller) {
    requestRef.current = null;
    setIsSending(false);
   }
  }
 };

 return (
  <div className="grid min-w-0 gap-5">
   <div className="grid gap-1">
    <Typography as="h1" variant="pageTitle" weight="black">
     AI Conversation
    </Typography>
    <Typography as="p" variant="body" tone="muted">
     Luyện tiếng Trung với API key của chính bạn; hội thoại chỉ tồn tại trong phiên hiện tại.
    </Typography>
   </div>

   <Card variant="section" padding="md" className="grid min-w-0 gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      Tutor
     </Typography>
     <div className="flex flex-wrap gap-2">
      <Button
       type="button"
       variant="ghost"
       size="sm"
       onClick={() => {
        requestRef.current?.abort();
        setMessages([initialMessage]);
        setDraft("");
        setError(null);
       }}
      >
       <Trash2 data-icon="inline-start" />
       Xóa phiên
      </Button>
      <Button type="button" variant="outline" size="sm" asChild>
       <Link href="/settings?section=ai">Quản lý API key</Link>
      </Button>
     </div>
    </div>

    <div className="grid max-h-[min(55dvh,38rem)] min-h-56 gap-3 overflow-y-auto rounded-lg border border-border-default bg-bg-subtle p-3">
     {messages.map((message, index) => (
      <div
       key={`${message.role}-${index}`}
       className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
      >
       <div
        className={
         message.role === "user"
          ? "max-w-[min(90%,42rem)] rounded-xl bg-primary px-3 py-2 text-primary-foreground"
          : "max-w-[min(90%,42rem)] rounded-xl border border-border-default bg-bg-card px-3 py-2"
        }
       >
        <Typography as="p" variant="bodySmall" className="whitespace-pre-wrap">
         {message.content}
        </Typography>
       </div>
      </div>
     ))}
     {isSending ? (
      <Typography variant="caption" tone="muted">
       Tutor đang trả lời…
      </Typography>
     ) : null}
    </div>

    {error ? (
     <Card variant="subtle" padding="sm">
      <Typography variant="bodySmall" tone="danger">
       {error}
      </Typography>
     </Card>
    ) : null}

    <form
     className="grid gap-2"
     onSubmit={(event) => {
      event.preventDefault();
      void send();
     }}
    >
     <label className="grid gap-2">
      <Typography as="span" variant="label" weight="bold">
       Tin nhắn
      </Typography>
      <Textarea
       value={draft}
       onChange={(event) => setDraft(event.target.value)}
       onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
         event.preventDefault();
         void send();
        }
       }}
       maxLength={6000}
       disabled={isSending}
       placeholder="例如：Giải thích sự khác nhau giữa 觉得 và 感觉"
       className="min-h-24"
      />
     </label>
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography variant="caption" tone="muted">
       Ctrl/Cmd + Enter để gửi
      </Typography>
      <Button type="submit" disabled={!draft.trim() || isSending}>
       <Send data-icon="inline-start" />
       {isSending ? "Đang gửi…" : "Gửi"}
      </Button>
     </div>
    </form>
   </Card>
  </div>
 );
}
