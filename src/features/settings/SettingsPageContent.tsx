"use client";

import { useSelector } from "@tanstack/react-store";
import { Bot, Languages, RefreshCcw, Save, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ComponentProps, type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageContainer } from "@/components/layout/page-container";
import ApiKeyManagerSection from "@/components/settings/ApiKeyManagerSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
 ClientAiPromptSettingsSchema,
 loadClientAiPromptSettings,
 saveClientAiPromptSettings,
 type ClientAiPromptSettings,
} from "@/lib/ai-prompt-settings-client";
import {
 DEFAULT_SENTENCE_LOOKUP_PROMPT,
 DEFAULT_WORD_LOOKUP_PROMPT,
 SENTENCE_PLACEHOLDER,
 WORD_PLACEHOLDER,
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 DEFAULT_GEMINI_QUICK_MODEL,
 GEMINI_DETAIL_MODEL_OPTIONS,
 GeminiModelIdSchema,
 getGeminiModelLabel,
} from "@/lib/gemini-models";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { focusModeStore } from "@/stores/focus-mode-store";

import { AppearanceSettingsSection } from "./AppearanceSettingsSection";

export const SettingsSectionSchema = z.enum(["app", "reading", "ai"]);
const SettingsSectionParamSchema = z.string().optional();

export function resolveSettingsSection(value: z.input<typeof SettingsSectionParamSchema>) {
 const param = SettingsSectionParamSchema.safeParse(value);
 if (!param.success) return SettingsSectionSchema.enum.app;

 const parsed = SettingsSectionSchema.safeParse(param.data);
 return parsed.success ? parsed.data : SettingsSectionSchema.enum.app;
}

type SettingsPageContentProps = {
 sectionValue: z.input<typeof SettingsSectionParamSchema>;
 readingSettings: ReactNode;
};

const focusModeEnabledMessage =
 "Focus mode đã bật. Bạn sẽ ở lại bài hiện tại; chỉ đổi đề mục hoặc tab ghi chú đang mở.";

export function SettingsPageContent({ sectionValue, readingSettings }: SettingsPageContentProps) {
 const section = resolveSettingsSection(sectionValue);
 const router = useRouter();
 useSelector(dictionaryLookupStore, (state) => state.overrides);
 const globalLookupEnabled = dictionaryLookupStore.actions.isEnabled("/");
 const notesLookupEnabled = dictionaryLookupStore.actions.isEnabled("/notes");
 const { setEnabled: setLookupEnabled } = dictionaryLookupStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { setEnabled: setFocusModeEnabled } = focusModeStore.actions;
 const [wordLookupPrompt, setWordLookupPrompt] = useState(DEFAULT_WORD_LOOKUP_PROMPT);
 const [sentenceLookupPrompt, setSentenceLookupPrompt] = useState(DEFAULT_SENTENCE_LOOKUP_PROMPT);
 const [geminiModel, setGeminiModel] =
  useState<ClientAiPromptSettings["geminiModel"]>(DEFAULT_GEMINI_MODEL);
 const [savedSettings, setSavedSettings] =
  useState<z.infer<z.ZodNullable<typeof ClientAiPromptSettingsSchema>>>(null);
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

    if (!response.ok) throw new Error("load_failed");

    const data = ClientAiPromptSettingsSchema.parse(await response.json());
    if (!isMounted) return;

    const merged = saveClientAiPromptSettings({
     wordLookupPrompt: data.wordLookupPrompt || localSettings.wordLookupPrompt,
     sentenceLookupPrompt: data.sentenceLookupPrompt || localSettings.sentenceLookupPrompt,
     geminiModel: data.geminiModel || localSettings.geminiModel,
    });

    setWordLookupPrompt(merged.wordLookupPrompt || DEFAULT_WORD_LOOKUP_PROMPT);
    setSentenceLookupPrompt(merged.sentenceLookupPrompt || DEFAULT_SENTENCE_LOOKUP_PROMPT);
    setGeminiModel(merged.geminiModel || DEFAULT_GEMINI_MODEL);
    setSavedSettings({
     wordLookupPrompt: merged.wordLookupPrompt || DEFAULT_WORD_LOOKUP_PROMPT,
     sentenceLookupPrompt: merged.sentenceLookupPrompt || DEFAULT_SENTENCE_LOOKUP_PROMPT,
     geminiModel: merged.geminiModel || DEFAULT_GEMINI_MODEL,
    });
    setHasLoaded(true);
   } catch {
    if (!isMounted) return;
    setWordLookupPrompt(localSettings.wordLookupPrompt);
    setSentenceLookupPrompt(localSettings.sentenceLookupPrompt);
    setGeminiModel(localSettings.geminiModel);
    setSavedSettings({
     wordLookupPrompt: localSettings.wordLookupPrompt,
     sentenceLookupPrompt: localSettings.sentenceLookupPrompt,
     geminiModel: localSettings.geminiModel,
    });
    setHasLoaded(true);
    toast.info("Đang dùng AI prompt settings lưu cục bộ trên trình duyệt");
   } finally {
    if (isMounted) setIsLoading(false);
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
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
     wordLookupPrompt: normalized.wordLookupPrompt,
     sentenceLookupPrompt: normalized.sentenceLookupPrompt,
     geminiModel: normalized.geminiModel,
    }),
   });

   if (!response.ok) throw new Error(String(response.status));

   const data = ClientAiPromptSettingsSchema.parse(await response.json());
   const synced = saveClientAiPromptSettings(data);
   setWordLookupPrompt(synced.wordLookupPrompt);
   setSentenceLookupPrompt(synced.sentenceLookupPrompt);
   setGeminiModel(synced.geminiModel);
   setSavedSettings({
    wordLookupPrompt: synced.wordLookupPrompt,
    sentenceLookupPrompt: synced.sentenceLookupPrompt,
    geminiModel: synced.geminiModel,
   });
   toast.success("Đã lưu AI prompt settings");
  } catch {
   const fallback = loadClientAiPromptSettings();
   setWordLookupPrompt(fallback.wordLookupPrompt);
   setSentenceLookupPrompt(fallback.sentenceLookupPrompt);
   setGeminiModel(fallback.geminiModel);
   setSavedSettings({
    wordLookupPrompt: fallback.wordLookupPrompt,
    sentenceLookupPrompt: fallback.sentenceLookupPrompt,
    geminiModel: fallback.geminiModel,
   });
   toast.success("Đã lưu AI prompt settings trên trình duyệt này");
  } finally {
   setIsSaving(false);
  }
 }

 const hasUnsavedWordPrompt =
  !!savedSettings && wordLookupPrompt !== savedSettings.wordLookupPrompt;
 const hasUnsavedSentencePrompt =
  !!savedSettings && sentenceLookupPrompt !== savedSettings.sentenceLookupPrompt;
 const hasUnsavedPromptChanges = hasUnsavedWordPrompt || hasUnsavedSentencePrompt;
 const hasUnsavedModelChange = !!savedSettings && geminiModel !== savedSettings.geminiModel;
 const hasUnsavedChanges = hasUnsavedPromptChanges || hasUnsavedModelChange;
 const selectedDetailModel = GEMINI_DETAIL_MODEL_OPTIONS.find(
  (option) => option.value === geminiModel,
 );

 return (
  <PageContainer>
   <main className="grid w-full gap-5">
    <PageHeader
     title="Cài đặt"
     description="Tùy chỉnh giao diện, trải nghiệm đọc và tra cứu AI mà không làm lẫn các cài đặt học với hồ sơ tài khoản."
    />

    <Tabs<z.infer<typeof SettingsSectionSchema>>
     value={section}
     items={[
      { key: SettingsSectionSchema.enum.app, label: "Ứng dụng", icon: Settings2 },
      { key: SettingsSectionSchema.enum.reading, label: "Đọc", icon: Languages },
      { key: SettingsSectionSchema.enum.ai, label: "AI & API", icon: Bot },
     ]}
     onValueChange={(nextSection) => {
      router.push(`/settings?section=${nextSection}`, { scroll: false });
     }}
    >
     <TabsContent active={section === SettingsSectionSchema.enum.app} className="mt-4 grid gap-4">
      <AppearanceSettingsSection />

      <Card variant="section" padding="lg" className="grid gap-3">
       <SectionHeading
        title="Hành vi học tập"
        description="Các lựa chọn có tác động toàn ứng dụng được gom ở đây; cài đặt đọc chuyên biệt nằm trong mục Đọc."
       />

       <div className="grid">
        <SettingsToggleRow
         id="global-dictionary-lookup"
         label="Tra từ mặc định"
         description="Áp dụng trên các trang học, từ vựng và dashboard; Ghi chú có scope riêng bên dưới."
         checked={globalLookupEnabled}
         onCheckedChange={(enabled) => setLookupEnabled("/", enabled)}
         tone="accent"
        />
        <Separator />
        <SettingsToggleRow
         id="notes-dictionary-lookup"
         label="Tra từ trong Ghi chú"
         description="Giữ tùy chọn riêng cho `/notes`, không ảnh hưởng các trang học khác."
         checked={notesLookupEnabled}
         onCheckedChange={(enabled) => setLookupEnabled("/notes", enabled)}
         tone="accent"
        />
        <Separator />
        <SettingsToggleRow
         id="focus-mode"
         label="Focus mode"
         description="Khóa đổi route và bài học cho đến khi bạn tắt lại từ Gear hoặc trang này."
         checked={focusModeEnabled}
         onCheckedChange={(enabled) => {
          if (enabled && !focusModeEnabled) {
           toast.warning(focusModeEnabledMessage, { duration: 5200 });
          }
          setFocusModeEnabled(enabled);
         }}
         tone="warning"
        />
       </div>
      </Card>
     </TabsContent>

     <TabsContent active={section === SettingsSectionSchema.enum.reading} className="mt-4">
      {readingSettings}
     </TabsContent>

     <TabsContent active={section === SettingsSectionSchema.enum.ai} className="mt-4 grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
       <div className="min-w-0 max-w-3xl">
        <Badge variant="accent" size="md">
         <Bot />
         AI Settings
        </Badge>
        <Typography as="h2" variant="sectionTitle" weight="bold" className="mt-2">
         Cài đặt tra cứu AI
        </Typography>
        <Typography as="p" tone="secondary" leading="standard" className="mt-1">
         Tra nhanh ưu tiên dữ liệu bài học và từ điển. AI nhẹ chỉ chạy khi cache không có; model
         mạnh chỉ chạy khi bạn chủ động mở phần chi tiết.
        </Typography>
        <div className="mt-3">
         <Badge variant={hasUnsavedChanges ? "warning" : "success"} size="md">
          {hasUnsavedChanges ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
         </Badge>
        </div>
       </div>

       <div className="flex flex-wrap items-center gap-3">
        <Button
         variant="outline"
         onClick={() => {
          setWordLookupPrompt(DEFAULT_WORD_LOOKUP_PROMPT);
          setSentenceLookupPrompt(DEFAULT_SENTENCE_LOOKUP_PROMPT);
          setGeminiModel(DEFAULT_GEMINI_MODEL);
         }}
         disabled={isLoading || isSaving}
        >
         <RefreshCcw data-icon="inline-start" />
         Reset mặc định
        </Button>
        <Button
         onClick={handleSave}
         disabled={isLoading || isSaving || !hasLoaded || !hasUnsavedChanges}
        >
         {isSaving ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
         Lưu thay đổi
        </Button>
       </div>
      </div>

      <Card variant="section" padding="lg" className="grid gap-4">
       <SectionHeading
        icon={<Sparkles />}
        title="Xem chi tiết"
        description="Chỉ dùng khi mở phân tích sâu, ví dụ, cấu tạo hoặc ngữ pháp. Nếu chưa thêm key cá nhân, app dùng model Gemini hệ thống đã chọn bên dưới."
       />

       <div className="grid max-w-xl gap-2">
        <Label htmlFor="gemini-model" variant="label" tone="default" weight="semibold">
         Model chi tiết mặc định
        </Label>
        <Select
         value={geminiModel}
         onValueChange={(value) => setGeminiModel(GeminiModelIdSchema.parse(value))}
         disabled={isLoading || isSaving}
        >
         <SelectTrigger id="gemini-model" width="full" aria-label="Chọn model Gemini">
          <SelectValue />
         </SelectTrigger>
         <SelectContent align="start">
          {!selectedDetailModel ? (
           <SelectItem value={geminiModel}>{getGeminiModelLabel(geminiModel)} (đã lưu)</SelectItem>
          ) : null}
          {GEMINI_DETAIL_MODEL_OPTIONS.map((option) => (
           <SelectItem key={option.value} value={option.value}>
            {option.label}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Typography as="p" variant="bodySmall" tone="muted" leading="compact">
         {selectedDetailModel?.description || "Model cũ đang được giữ. Chọn model mới để cập nhật."}
        </Typography>
       </div>
      </Card>

      <Card variant="section" padding="lg" className="grid gap-4">
       <SectionHeading
        icon={<Languages />}
        title="Tra nhanh và dịch nghĩa"
        description="Luồng: từ vựng bài học → từ điển chung → cache cũ → AI nhẹ. User không cần nhập API key."
       />

       <div className="flex flex-wrap items-center gap-3 border-t border-border-default pt-4">
        <div>
         <Typography as="p" tone="default" weight="semibold">
          {getGeminiModelLabel(DEFAULT_GEMINI_QUICK_MODEL)}
         </Typography>
         <Typography as="p" variant="bodySmall" tone="muted" className="mt-1">
          Tối ưu độ trễ cho nghĩa và Hán Việt ngắn.
         </Typography>
        </div>
        <Badge variant="success" size="md">
         Không cần key cá nhân
        </Badge>
        <Badge variant="info" size="md">
         Free-tier eligible
        </Badge>
       </div>
      </Card>

      <ApiKeyManagerSection />

      <div className="space-y-4">
       <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <SectionHeading
         title="Lookup Prompts"
         description="Các prompt nâng cao chỉ dùng cho phân tích chi tiết. Tra nhanh giữ prompt ngắn cố định để giảm độ trễ và lượng token."
        />

        <div className="flex flex-wrap items-center gap-3">
         <Badge variant={hasUnsavedPromptChanges ? "warning" : "success"} size="md">
          {hasUnsavedPromptChanges ? "Prompt có thay đổi chưa lưu" : "Prompt đã đồng bộ"}
         </Badge>
         <Button
          onClick={handleSave}
          disabled={isLoading || isSaving || !hasLoaded || !hasUnsavedPromptChanges}
         >
          {isSaving ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
          Lưu prompt mới
         </Button>
        </div>
       </div>

       <div className="grid gap-6 xl:grid-cols-2">
        <PromptPanel
         title="Word Lookup Prompt"
         description="Dùng cho tra từ/cụm từ ngắn. Phải giữ placeholder {WORD} để backend thay từ cần tra vào prompt."
         placeholderToken={WORD_PLACEHOLDER}
         value={wordLookupPrompt}
         onChange={setWordLookupPrompt}
         defaultValue={DEFAULT_WORD_LOOKUP_PROMPT}
         disabled={isLoading || isSaving}
         isDirty={hasUnsavedWordPrompt}
        />

        <PromptPanel
         title="Sentence Lookup Prompt"
         description="Dùng cho câu/đoạn văn. Phải giữ placeholder {SENTENCE} để backend thay nội dung thật vào prompt."
         placeholderToken={SENTENCE_PLACEHOLDER}
         value={sentenceLookupPrompt}
         onChange={setSentenceLookupPrompt}
         defaultValue={DEFAULT_SENTENCE_LOOKUP_PROMPT}
         disabled={isLoading || isSaving}
         isDirty={hasUnsavedSentencePrompt}
        />
       </div>
      </div>
     </TabsContent>
    </Tabs>
   </main>
  </PageContainer>
 );
}

function SectionHeading({
 title,
 description,
 icon,
}: {
 title: string;
 description: string;
 icon?: ReactNode;
}) {
 return (
  <div className="flex min-w-0 max-w-3xl items-start gap-3">
   {icon ? <IconTile tone="accent" size="sm">{icon}</IconTile> : null}
   <div className="min-w-0">
    <Typography as="h2" variant="sectionTitle" tone="default" weight="bold">
     {title}
    </Typography>
    <Typography as="p" tone="secondary" leading="standard" className="mt-1">
     {description}
    </Typography>
   </div>
  </div>
 );
}

function SettingsToggleRow({
 id,
 label,
 description,
 checked,
 onCheckedChange,
 tone,
}: {
 id: string;
 label: string;
 description: string;
 checked: boolean;
 onCheckedChange: (checked: boolean) => void;
 tone: ComponentProps<typeof Switch>["tone"];
}) {
 const descriptionId = `${id}-description`;

 return (
  <div className="flex min-w-0 items-center justify-between gap-4 py-3">
   <div className="min-w-0 space-y-1">
    <Label htmlFor={id} variant="label" tone="default" weight="bold">
     {label}
    </Label>
    <Typography as="p" id={descriptionId} variant="bodySmall" tone="muted" leading="standard">
     {description}
    </Typography>
   </div>
   <Switch
    id={id}
    checked={checked}
    onCheckedChange={onCheckedChange}
    aria-describedby={descriptionId}
    tone={tone}
   />
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
 isDirty,
}: {
 title: string;
 description: string;
 placeholderToken: string;
 value: string;
 onChange: (value: string) => void;
 defaultValue: string;
 disabled: boolean;
 isDirty: boolean;
}) {
 const hasPlaceholder = value.includes(placeholderToken);

 return (
  <Card variant="default" padding="lg">
   <div className="mb-4 flex items-start justify-between gap-4">
    <div className="space-y-2">
     <Typography as="h3" variant="sectionTitle" tone="default" weight="bold">
      {title}
     </Typography>
     <Typography as="p" tone="secondary" leading="standard">
      {description}
     </Typography>
    </div>

    <div className="flex items-center gap-2">
     <Badge variant={isDirty ? "warning" : "default"} size="sm">
      {isDirty ? "Chưa lưu" : "Đã lưu"}
     </Badge>
     <Button size="sm" variant="ghost" onClick={() => onChange(defaultValue)} disabled={disabled}>
      Khôi phục block
     </Button>
    </div>
   </div>

   <div className="mb-3 flex items-center justify-between">
    <Badge variant={hasPlaceholder ? "success" : "danger"} size="sm">
     {hasPlaceholder
      ? `Có placeholder ${placeholderToken}`
      : `Thiếu placeholder ${placeholderToken}`}
    </Badge>
    <Typography as="span" variant="caption" tone="muted">
     {value.length} ký tự
    </Typography>
   </div>

   <Textarea
    aria-label={title}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    spellCheck={false}
    rows={16}
    font="mono"
   />
  </Card>
 );
}
