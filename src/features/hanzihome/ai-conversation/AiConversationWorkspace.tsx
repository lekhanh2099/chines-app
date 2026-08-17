"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, RotateCcw, Send, Settings2, Sparkles, Trash2, UserRound } from "lucide-react";

import { useAppForm } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { IconTile } from "@/components/ui/icon-tile";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/i18n/navigation";

import { sendAiConversationMessage } from "./ai-conversation-api";
import {
 saveAiConversationProfile,
 useAiConversationProfile,
} from "./ai-conversation-profile.client";
import {
 aiConversationCorrectionStyleSchema,
 aiConversationLearnerLevelSchema,
 aiConversationPersonaSchema,
 aiConversationProfileSchema,
 aiConversationReplyModeSchema,
 DEFAULT_AI_CONVERSATION_PROFILE,
 type AiConversationMessage,
 type AiConversationProfile,
} from "./ai-conversation.schemas";

const personaLabels: Record<AiConversationProfile["persona"], string> = {
 tutor: "Giáo viên",
 friend: "Bạn Trung Quốc",
 "hsk-examiner": "Giám khảo HSKK",
 "grammar-coach": "Coach ngữ pháp",
};

const levelLabels: Record<AiConversationProfile["learnerLevel"], string> = {
 beginner: "Sơ cấp",
 intermediate: "Trung cấp",
 advanced: "Cao cấp",
};

const correctionLabels: Record<AiConversationProfile["correctionStyle"], string> = {
 light: "Nhẹ — chỉ sửa lỗi quan trọng",
 balanced: "Cân bằng — sửa sau khi trả lời",
 strict: "Kỹ — bắt lỗi rõ và giải thích",
};

const replyModeLabels: Record<AiConversationProfile["replyMode"], string> = {
 adaptive: "Tự thích nghi",
 chinese: "Ưu tiên tiếng Trung",
 bilingual: "Trung + Việt hỗ trợ",
};

const personaOptions = aiConversationPersonaSchema.options.map((value) => ({
 value,
 label: personaLabels[value],
}));
const levelOptions = aiConversationLearnerLevelSchema.options.map((value) => ({
 value,
 label: levelLabels[value],
}));
const correctionOptions = aiConversationCorrectionStyleSchema.options.map((value) => ({
 value,
 label: correctionLabels[value],
}));
const replyModeOptions = aiConversationReplyModeSchema.options.map((value) => ({
 value,
 label: replyModeLabels[value],
}));

function greetingFor(profile: AiConversationProfile): AiConversationMessage {
 const role = personaLabels[profile.persona];
 return {
  role: "assistant",
  content: `你好，我是${profile.displayName}。Mình đang ở chế độ “${role}”. Cứ bắt đầu bằng tiếng Trung hoặc nói mục tiêu buổi luyện hôm nay nhé。`,
 };
}

export function AiConversationWorkspace() {
 const profile = useAiConversationProfile();
 const [isSetupOpen, setIsSetupOpen] = useState(false);
 const [messages, setMessages] = useState<AiConversationMessage[]>([]);
 const [draft, setDraft] = useState("");
 const [isSending, setIsSending] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [lastRuntime, setLastRuntime] = useState<{ provider: string; model: string } | null>(null);
 const requestRef = useRef<AbortController | null>(null);
 const messageViewportRef = useRef<HTMLDivElement | null>(null);
 const displayMessages = [greetingFor(profile), ...messages];

 useEffect(() => () => requestRef.current?.abort(), []);

 useEffect(() => {
  const viewport = messageViewportRef.current;
  if (!viewport) return;
  viewport.scrollTop = viewport.scrollHeight;
 }, [isSending, messages]);

 const clearSession = () => {
  requestRef.current?.abort();
  setMessages([]);
  setDraft("");
  setError(null);
  setLastRuntime(null);
 };

 const saveProfile = (nextProfile: AiConversationProfile) => {
  saveAiConversationProfile(nextProfile);
  setIsSetupOpen(false);
 };

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
   const response = await sendAiConversationMessage(
    nextMessages.slice(-24),
    profile,
    controller.signal,
   );
   setMessages((current) => [...current, { role: "assistant", content: response.message }]);
   setLastRuntime({ provider: response.provider, model: response.model });
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

 const learnerTurns = messages.filter((message) => message.role === "user").length;

 return (
  <div className="grid min-w-0 gap-5">
   <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
    <div className="grid min-w-0 gap-1">
     <Typography as="h1" variant="pageTitle" weight="black">
      Hội thoại AI
     </Typography>
     <Typography as="p" variant="body" tone="muted">
      Luyện tiếng Trung với nhân vật và cách sửa lỗi do bạn chọn. Hồ sơ nhân vật được lưu trên thiết
      bị; nội dung hội thoại vẫn chỉ tồn tại trong phiên hiện tại.
     </Typography>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="outline" onClick={() => setIsSetupOpen(true)}>
      <Settings2 data-icon="inline-start" />
      Thiết lập nhân vật
     </Button>
     <Button type="button" variant="ghost" asChild>
      <Link href="/settings?section=ai">API key</Link>
     </Button>
    </div>
   </div>

   <Card variant="section" padding="md" className="grid min-w-0 gap-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
     <div className="flex min-w-0 items-center gap-3">
      <IconTile tone="accent" size="md">
       {profile.persona === "friend" ? <UserRound /> : <Bot />}
      </IconTile>
      <div className="grid min-w-0 gap-1">
       <div className="flex flex-wrap items-center gap-2">
        <Typography as="h2" variant="sectionTitle" weight="bold">
         {profile.displayName}
        </Typography>
        <Badge variant="accent" casing="natural">
         {personaLabels[profile.persona]}
        </Badge>
        <Badge variant="default" casing="natural">
         {levelLabels[profile.learnerLevel]}
        </Badge>
       </div>
       <Typography variant="caption" tone="muted" clamp="one">
        {profile.interests || "Hội thoại tiếng Trung"}
       </Typography>
      </div>
     </div>
     <Button type="button" variant="ghost" size="sm" onClick={clearSession}>
      <Trash2 data-icon="inline-start" />
      Xóa phiên
     </Button>
    </div>

    <div className="grid grid-cols-2 gap-3 border-y border-border-default py-3 sm:grid-cols-4">
     <SessionStat label="Lượt của bạn" value={String(learnerTurns)} />
     <SessionStat label="Ngữ cảnh gần" value={`${Math.min(messages.length, 20)} tin`} />
     <SessionStat label="Provider" value={lastRuntime?.provider ?? "Chưa gọi"} />
     <SessionStat label="Model" value={lastRuntime?.model ?? "—"} />
    </div>

    <div
     ref={messageViewportRef}
     className="grid min-h-80 max-h-[60dvh] content-start gap-3 overflow-y-auto rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4"
     aria-live="polite"
    >
     {displayMessages.map((message, index) => (
      <div
       key={`${message.role}-${index}`}
       className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
      >
       <div
        className={
         message.role === "user"
          ? "max-w-[min(92%,46rem)] rounded-xl bg-primary px-3 py-2 text-primary-foreground"
          : "max-w-[min(92%,46rem)] rounded-xl border border-border-default bg-bg-card px-3 py-2"
        }
       >
        <Typography as="p" variant="bodySmall" wrapping="preWrap">
         {message.content}
        </Typography>
       </div>
      </div>
     ))}
     {isSending ? (
      <div className="flex items-center gap-2 text-text-muted">
       <Sparkles className="size-4 animate-pulse" aria-hidden="true" />
       <Typography variant="caption" tone="muted">
        {profile.displayName} đang trả lời…
       </Typography>
      </div>
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
     <Label htmlFor="ai-conversation-message" className="sr-only">
      Tin nhắn
     </Label>
     <Textarea
      id="ai-conversation-message"
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
      placeholder="例如：今天下班以后我想练习聊日常生活。"
      className="min-h-24"
     />
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography variant="caption" tone="muted">
       Ctrl/Cmd + Enter để gửi · AI giữ tối đa 20 tin gần nhất + hồ sơ ghi nhớ ổn định.
      </Typography>
      <Button type="submit" disabled={!draft.trim() || isSending}>
       <Send data-icon="inline-start" />
       {isSending ? "Đang gửi…" : "Gửi"}
      </Button>
     </div>
    </form>
   </Card>

   {isSetupOpen ? (
    <PersonaSetupDialog
     initialProfile={profile}
     onOpenChange={setIsSetupOpen}
     onSave={saveProfile}
    />
   ) : null}
  </div>
 );
}

function SessionStat({ label, value }: { label: string; value: string }) {
 return (
  <div className="grid min-w-0 gap-0.5">
   <Typography variant="caption" tone="muted">
    {label}
   </Typography>
   <Typography weight="semibold" clamp="one">
    {value}
   </Typography>
  </div>
 );
}

function PersonaSetupDialog({
 initialProfile,
 onOpenChange,
 onSave,
}: {
 initialProfile: AiConversationProfile;
 onOpenChange: (open: boolean) => void;
 onSave: (profile: AiConversationProfile) => void;
}) {
 const form = useAppForm({
  defaultValues: initialProfile,
  validators: { onSubmit: aiConversationProfileSchema },
  onSubmit: ({ value }) => {
   onSave(value);
  },
 });

 return (
  <Dialog open onOpenChange={onOpenChange}>
   <DialogContent size="lg">
    <DialogHeader>
     <DialogTitle>Thiết lập nhân vật hội thoại</DialogTitle>
     <DialogDescription>
      Chọn vai trò, mức sửa lỗi và những điều AI cần nhớ. Hồ sơ này chỉ lưu trên trình duyệt của
      thiết bị hiện tại.
     </DialogDescription>
    </DialogHeader>
    <form
     onSubmit={(event) => {
      event.preventDefault();
      void form.handleSubmit();
     }}
    >
     <DialogBody className="grid gap-5 md:grid-cols-2">
      <form.AppField name="persona">
       {(field) => <field.Select label="Vai trò" options={personaOptions} required />}
      </form.AppField>
      <form.AppField name="displayName">
       {(field) => (
        <field.TextField label="Tên nhân vật" required maxLength={40} placeholder="Ví dụ: 小林" />
       )}
      </form.AppField>
      <form.AppField name="learnerLevel">
       {(field) => <field.Select label="Trình độ của bạn" options={levelOptions} required />}
      </form.AppField>
      <form.AppField name="correctionStyle">
       {(field) => <field.Select label="Cách sửa lỗi" options={correctionOptions} required />}
      </form.AppField>
      <div className="md:col-span-2">
       <form.AppField name="replyMode">
        {(field) => <field.Select label="Ngôn ngữ trả lời" options={replyModeOptions} required />}
       </form.AppField>
      </div>
      <div className="md:col-span-2">
       <form.AppField name="interests">
        {(field) => (
         <field.Textarea
          label="Chủ đề muốn nói"
          maxLength={300}
          rows={3}
          placeholder="Ví dụ: cuộc sống ở Trung Quốc, phim, công việc, đi ăn, du lịch…"
         />
        )}
       </form.AppField>
      </div>
      <div className="md:col-span-2">
       <form.AppField name="characterNotes">
        {(field) => (
         <field.Textarea
          label="Tính cách / cách nói"
          maxLength={600}
          rows={3}
          placeholder="Ví dụ: nói như bạn cùng tuổi, thỉnh thoảng dùng khẩu ngữ phổ biến nhưng không lạm dụng slang."
         />
        )}
       </form.AppField>
      </div>
      <div className="md:col-span-2">
       <form.AppField name="memoryNotes">
        {(field) => (
         <field.Textarea
          label="Điều cần nhớ lâu dài"
          description="Phần này được gửi lại ở mỗi lượt nên vẫn giữ được các thông tin cốt lõi khi đoạn chat dài."
          maxLength={1200}
          rows={4}
          placeholder="Ví dụ: Tôi học khoảng HSK4, yếu trật tự từ và dịch Việt → Trung; ưu tiên 普通话 tại Trung Quốc đại lục."
         />
        )}
       </form.AppField>
      </div>
     </DialogBody>
     <DialogFooter>
      <Button
       type="button"
       variant="ghost"
       onClick={() => form.reset(DEFAULT_AI_CONVERSATION_PROFILE)}
      >
       <RotateCcw data-icon="inline-start" />
       Mặc định
      </Button>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
       Hủy
      </Button>
      <Button type="submit">Lưu thiết lập</Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
