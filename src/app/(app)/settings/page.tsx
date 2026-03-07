"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
 loadClientAiPromptSettings,
 saveClientAiPromptSettings,
} from "@/lib/ai-prompt-settings-client";
import {
 DEFAULT_SENTENCE_LOOKUP_PROMPT,
 DEFAULT_WORD_LOOKUP_PROMPT,
 SENTENCE_PLACEHOLDER,
 WORD_PLACEHOLDER,
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 GEMINI_TEXT_MODEL_OPTIONS,
 getGeminiModelLabel,
 type GeminiModelId,
} from "@/lib/gemini-models";
import { toast } from "sonner";
import { Bot, RefreshCcw, Save } from "lucide-react";

type AiPromptSettingsResponse = {
 wordLookupPrompt: string;
 sentenceLookupPrompt: string;
 geminiModel: GeminiModelId;
};

export default function SettingsPage() {
 const [wordLookupPrompt, setWordLookupPrompt] = useState(
  DEFAULT_WORD_LOOKUP_PROMPT,
 );
 const [sentenceLookupPrompt, setSentenceLookupPrompt] = useState(
  DEFAULT_SENTENCE_LOOKUP_PROMPT,
 );
 const [geminiModel, setGeminiModel] =
  useState<GeminiModelId>(DEFAULT_GEMINI_MODEL);
 const [isLoading, setIsLoading] = useState(true);
 const [isSaving, setIsSaving] = useState(false);
 const [hasLoaded, setHasLoaded] = useState(false);

 useEffect(() => {
  let isMounted = true;

  async function loadSettings() {
   const localSettings = loadClientAiPromptSettings();

   try {
    const response = await fetch("/api/settings/ai-prompts", {
     method: "GET",
     credentials: "include",
    });

    if (!response.ok) {
     throw new Error("load_failed");
    }

    const data = (await response.json()) as AiPromptSettingsResponse;
    if (!isMounted) return;

    const merged = saveClientAiPromptSettings({
     wordLookupPrompt: data.wordLookupPrompt || localSettings.wordLookupPrompt,
     sentenceLookupPrompt:
      data.sentenceLookupPrompt || localSettings.sentenceLookupPrompt,
     geminiModel: data.geminiModel || localSettings.geminiModel,
    });

    setWordLookupPrompt(merged.wordLookupPrompt || DEFAULT_WORD_LOOKUP_PROMPT);
    setSentenceLookupPrompt(
     merged.sentenceLookupPrompt || DEFAULT_SENTENCE_LOOKUP_PROMPT,
    );
    setGeminiModel(merged.geminiModel || DEFAULT_GEMINI_MODEL);
    setHasLoaded(true);
   } catch {
    if (!isMounted) return;
    setWordLookupPrompt(localSettings.wordLookupPrompt);
    setSentenceLookupPrompt(localSettings.sentenceLookupPrompt);
    setGeminiModel(localSettings.geminiModel);
    setHasLoaded(true);
    toast.info("Đang dùng AI prompt settings lưu cục bộ trên trình duyệt");
   } finally {
    if (isMounted) {
     setIsLoading(false);
    }
   }
  }

  loadSettings();

  return () => {
   isMounted = false;
  };
 }, []);

 async function handleSave() {
  setIsSaving(true);

  try {
   const normalized = saveClientAiPromptSettings({
    wordLookupPrompt,
    sentenceLookupPrompt,
    geminiModel,
   });

   const response = await fetch("/api/settings/ai-prompts", {
    method: "PUT",
    headers: {
     "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
     wordLookupPrompt: normalized.wordLookupPrompt,
     sentenceLookupPrompt: normalized.sentenceLookupPrompt,
     geminiModel: normalized.geminiModel,
    }),
   });

   if (!response.ok) {
    throw new Error(String(response.status));
   }

   const data = (await response.json()) as AiPromptSettingsResponse;
   const synced = saveClientAiPromptSettings(data);
   setWordLookupPrompt(synced.wordLookupPrompt);
   setSentenceLookupPrompt(synced.sentenceLookupPrompt);
   setGeminiModel(synced.geminiModel);
   toast.success("Đã lưu AI prompt settings");
  } catch {
   const fallback = loadClientAiPromptSettings();
   setWordLookupPrompt(fallback.wordLookupPrompt);
   setSentenceLookupPrompt(fallback.sentenceLookupPrompt);
   setGeminiModel(fallback.geminiModel);
   toast.success("Đã lưu AI prompt settings trên trình duyệt này");
  } finally {
   setIsSaving(false);
  }
 }

 return (
  <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
   <section className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
     <div className="max-w-2xl space-y-2">
      <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-accent">
       <Bot className="h-3.5 w-3.5" />
       AI Prompt Settings
      </div>
      <h1 className="text-3xl font-bold text-text-primary">
       Cache từ vựng và prompt tra cứu
      </h1>
      <p className="text-sm leading-6 text-text-secondary">
       Hai prompt dưới đây điều khiển cách app gọi AI cho tra từ và phân tích
       câu. Word lookup được dùng cho cache dictionary trong bảng vocabularies;
       sentence lookup dùng cho dịch nghĩa và grammar points.
      </p>
      <div className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-primary px-3 py-1 text-xs text-text-secondary">
       <span className="font-semibold text-text-primary">Model hiện tại</span>
       <span>{getGeminiModelLabel(geminiModel)}</span>
      </div>
     </div>

     <div className="flex items-center gap-3">
      <Button
       variant="outline"
       onClick={() => {
        setWordLookupPrompt(DEFAULT_WORD_LOOKUP_PROMPT);
        setSentenceLookupPrompt(DEFAULT_SENTENCE_LOOKUP_PROMPT);
        setGeminiModel(DEFAULT_GEMINI_MODEL);
       }}
       disabled={isLoading || isSaving}
      >
       <RefreshCcw className="h-4 w-4" />
       Reset mặc định
      </Button>
      <Button
       onClick={handleSave}
       disabled={isLoading || isSaving || !hasLoaded}
       isLoading={isSaving}
       loadingText="Đang lưu..."
      >
       <Save className="h-4 w-4" />
       Lưu settings
      </Button>
     </div>
    </div>
   </section>

   <section className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
    <div className="mb-4 space-y-2">
     <h2 className="text-xl font-bold text-text-primary">Gemini Model</h2>
     <p className="max-w-3xl text-sm leading-6 text-text-secondary">
      Chọn model Gemini cho các request tra từ và phân tích câu. Nếu một model
      đang bị rate limit thì bạn có thể đổi sang model khác ngay tại đây.
     </p>
    </div>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px),minmax(0,1fr)] lg:items-start">
     <label className="space-y-2">
      <span className="text-sm font-semibold text-text-primary">
       Model text
      </span>
      <select
       value={geminiModel}
       onChange={(event) => setGeminiModel(event.target.value as GeminiModelId)}
       disabled={isLoading || isSaving}
       className="h-11 w-full rounded-xl border border-border-default bg-bg-primary px-4 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
       {GEMINI_TEXT_MODEL_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
         {option.label}
        </option>
       ))}
      </select>
     </label>

     <div className="rounded-xl border border-border-default bg-bg-primary p-4">
      <p className="text-sm font-semibold text-text-primary">
       {getGeminiModelLabel(geminiModel)}
      </p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
       {GEMINI_TEXT_MODEL_OPTIONS.find((option) => option.value === geminiModel)
        ?.description || "Model text dùng cho generateContent."}
      </p>
      <p className="mt-3 text-xs leading-5 text-text-muted">
       Gợi ý: `Gemini 2.5 Flash` là lựa chọn mặc định. Nếu một model bị quota,
       thử `Gemini 2.5 Flash-Lite`, `Gemini Flash Latest` hoặc một model Gemma.
      </p>
     </div>
    </div>
   </section>

   <section className="grid gap-6 xl:grid-cols-2">
    <PromptPanel
     title="Word Lookup Prompt"
     description="Dùng cho tra từ/cụm từ ngắn. Phải giữ placeholder {WORD} để backend thay từ cần tra vào prompt."
     placeholderToken={WORD_PLACEHOLDER}
     value={wordLookupPrompt}
     onChange={setWordLookupPrompt}
     defaultValue={DEFAULT_WORD_LOOKUP_PROMPT}
     disabled={isLoading || isSaving}
    />

    <PromptPanel
     title="Sentence Lookup Prompt"
     description="Dùng cho câu/đoạn văn. Phải giữ placeholder {SENTENCE} để backend thay nội dung thật vào prompt."
     placeholderToken={SENTENCE_PLACEHOLDER}
     value={sentenceLookupPrompt}
     onChange={setSentenceLookupPrompt}
     defaultValue={DEFAULT_SENTENCE_LOOKUP_PROMPT}
     disabled={isLoading || isSaving}
    />
   </section>
  </div>
 );
}

function PromptPanel({
 title,
 description,
 placeholderToken,
 value,
 onChange,
 defaultValue,
 disabled,
}: {
 title: string;
 description: string;
 placeholderToken: string;
 value: string;
 onChange: (value: string) => void;
 defaultValue: string;
 disabled: boolean;
}) {
 const hasPlaceholder = value.includes(placeholderToken);

 return (
  <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-theme-sm">
   <div className="mb-4 flex items-start justify-between gap-4">
    <div className="space-y-2">
     <h2 className="text-xl font-bold text-text-primary">{title}</h2>
     <p className="text-sm leading-6 text-text-secondary">{description}</p>
    </div>

    <Button
     size="sm"
     variant="ghost"
     onClick={() => onChange(defaultValue)}
     disabled={disabled}
    >
     Reset block
    </Button>
   </div>

   <div className="mb-3 flex items-center justify-between text-xs">
    <span
     className={`rounded-full px-2.5 py-1 font-semibold ${hasPlaceholder ? "bg-success/10 text-success" : "bg-danger/10 text-danger-text"}`}
    >
     {hasPlaceholder
      ? `Có placeholder ${placeholderToken}`
      : `Thiếu placeholder ${placeholderToken}`}
    </span>
    <span className="text-text-muted">{value.length} ký tự</span>
   </div>

   <textarea
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    spellCheck={false}
    className="min-h-90 w-full rounded-xl border border-border-default bg-bg-primary px-4 py-4 font-mono text-sm leading-6 text-text-primary outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
   />
  </div>
 );
}
