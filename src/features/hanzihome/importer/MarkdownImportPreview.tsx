"use client";

import { useMemo, useState } from "react";
import {
 AlertTriangle,
 ChevronDown,
 FileText,
 GitBranch,
 Save,
 Settings2,
 WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
 applyParseProfile,
 learningFieldValueToPreview,
 sectionBlocksToPreview,
} from "@/features/hanzihome/importer/apply-parse-profile";
import {
 applyParsedResultToDraft,
 getApplyPreviewText,
 type ApplyImportMode,
 type ApplyImportTarget,
} from "@/features/hanzihome/importer/applyParsedResultToDraft";
import {
 getAvailableImportProfiles,
 loadCustomImportProfiles,
 saveCustomImportProfiles,
} from "@/features/hanzihome/importer/import-profile-storage";
import type {
 AppliedParseResult,
 FieldRule,
 LearningSection,
 MappedImportItem,
 MappedSpecialSection,
 ParseProfile,
 SectionRoleRule,
 UnknownSectionBehavior,
} from "@/features/hanzihome/importer/importer.types";
import { markdownToLearningDoc } from "@/features/hanzihome/importer/markdown-to-learning-doc";
import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { useUpdateLessonDraftMutation } from "@/features/hanzihome/lesson-drafts/use-lesson-drafts";
import { cn } from "@/lib/utils";

const sampleMarkdown = `# BÀI 24

## PHẦN I: CÂU PHỨC KHÔNG DÙNG TỪ NỐI

### 1. Câu mở khóa
他一边说，一边写。

### 2. Bản chất cốt lõi & Công thức
- Một chủ thể làm hai hành động song song.
- Công thức: Chủ ngữ + 一边 + V1 + 一边 + V2

### 3. Điểm mù & quy tắc ẩn
Không dùng dấu phẩy tiếng Việt để đoán cấu trúc.

### 4. Ví dụ
- 他一边听音乐，一边做作业。

### 5. Chốt bản chất
Nhấn vào tính đồng thời.

## PHẦN II: LƯỢNG TỪ LẶP LẠI

### 1. Câu mở khóa
一件一件地看。

### 2. Bản chất cốt lõi & Công thức
Lặp lượng từ để diễn tả từng cái một.

## PHẦN III: BỔ NGỮ TRẠNG THÁI DẠNG SO SÁNH

### 1. Câu mở khóa
他说得比我快。

### 2. Bản chất cốt lõi & Công thức
V + 得 + 比 + đối tượng + tính chất.

## BÀI ĐỌC THÊM ÁP DỤNG NGỮ PHÁP
他一边走路，一边听录音。

## TỔNG KẾT CUỐI BÀI
- 一边...一边...
- 一件一件
- V 得 比...`;

const unknownBehaviorOptions: Array<{
 value: UnknownSectionBehavior;
 label: string;
}> = [
 { value: "keepUnmapped", label: "Keep unmapped" },
 { value: "keepAsNotes", label: "Keep as notes" },
 { value: "ignore", label: "Ignore" },
];

const applyTargetOptions: Array<{
 value: ApplyImportTarget;
 label: string;
}> = [
 { value: "grammar", label: "Ngữ pháp" },
 { value: "vocab", label: "Từ vựng" },
 { value: "lessonText", label: "Bài khóa" },
 { value: "exercise", label: "Bài tập / ôn tập" },
 { value: "mixed", label: "Mixed auto" },
];

const applyModeOptions: Array<{
 value: ApplyImportMode;
 label: string;
}> = [
 { value: "replace", label: "Replace target" },
 { value: "append", label: "Append" },
 { value: "mergeByTitle", label: "Merge by title" },
];

function cloneProfile(profile: ParseProfile): ParseProfile {
 return structuredClone(profile);
}

function countSections(sections: LearningSection[]): number {
 return sections.reduce(
  (count, section) => count + 1 + countSections(section.children),
  0,
 );
}

function parseHeadingLevelValue(value: string): Array<1 | 2 | 3 | 4 | 5 | 6> {
 const parsed = Number(value);

 if (
  parsed === 1 ||
  parsed === 2 ||
  parsed === 3 ||
  parsed === 4 ||
  parsed === 5 ||
  parsed === 6
 ) {
  return [parsed];
 }

 return [];
}

function firstHeadingLevel(rule: SectionRoleRule | FieldRule) {
 return String(rule.match.headingLevel?.[0] ?? "");
}

function firstHeadingRegex(rule: FieldRule) {
 return rule.match.headingRegex?.[0] ?? "";
}

function getDefaultApplyTarget(profile: ParseProfile): ApplyImportTarget {
 if (profile.target === "grammar") return "grammar";
 if (profile.target === "vocab") return "vocab";
 if (profile.target === "exercise") return "exercise";
 if (profile.target === "lessonText") return "lessonText";

 return "mixed";
}

function CollapsibleSection({
 title,
 summary,
 defaultOpen = false,
 children,
}: {
 title: string;
 summary?: string;
 defaultOpen?: boolean;
 children: React.ReactNode;
}) {
 const [open, setOpen] = useState(defaultOpen);

 return (
  <section className="rounded-xl border border-border-default bg-bg-subtle">
   <button
    type="button"
    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
    onClick={() => setOpen((current) => !current)}
   >
    <span className="min-w-0">
     <span className="block text-xs font-black uppercase tracking-wide text-text-muted">
      {title}
     </span>
     {summary && (
      <span className="block truncate text-xs font-semibold text-text-muted">
       {summary}
      </span>
     )}
    </span>
    <ChevronDown
     className={cn(
      "h-4 w-4 shrink-0 text-text-muted transition-transform",
      open && "rotate-180",
     )}
    />
   </button>

   {open && <div className="grid gap-3 border-t border-border-default p-3">{children}</div>}
  </section>
 );
}

function OutlineSection({ section }: { section: LearningSection }) {
 return (
  <li className="grid gap-1">
   <div className="flex items-start gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-2">
    <span className="shrink-0 rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-black text-text-muted">
     H{section.level}
    </span>
    <div className="min-w-0">
     <p className="truncate text-sm font-black text-text-primary">
      {section.title}
     </p>
     {section.directives.length > 0 && (
      <p className="text-xs font-bold text-text-muted">
       {section.directives
        .map((directive) => `@${directive.type}:${directive.value}`)
        .join(", ")}
      </p>
     )}
    </div>
   </div>

   {section.children.length > 0 && (
    <ol className="ml-4 grid gap-1 border-l border-border-default pl-3">
     {section.children.map((child) => (
      <OutlineSection key={child.id} section={child} />
     ))}
    </ol>
   )}
  </li>
 );
}

function MappedItemPreview({ item }: { item: MappedImportItem }) {
 const entries = Object.entries(item.fields);

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">
     {item.role}
    </p>
    <h3 className="text-lg font-black text-text-primary">{item.title}</h3>
   </div>

   {entries.length === 0 ? (
    <p className="rounded-lg border border-dashed border-border-default p-3 text-sm font-semibold text-text-muted">
     Chưa map được field nào.
    </p>
   ) : (
    <div className="grid gap-2">
     {entries.map(([field, values]) => (
      <div key={field} className="grid gap-1 rounded-lg bg-bg-subtle p-3">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        {field}
       </p>
       <div className="grid gap-2">
        {values.map((value, index) => (
         <pre
          key={`${field}-${index}`}
          className="whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-text-primary"
         >
          {learningFieldValueToPreview(value)}
         </pre>
        ))}
       </div>
      </div>
     ))}
    </div>
   )}
  </div>
 );
}

function SpecialSectionPreview({
 section,
}: {
 section: MappedSpecialSection;
}) {
 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-4">
   <div>
    <p className="text-xs font-black uppercase tracking-wide text-text-muted">
     {section.role}
    </p>
    <h3 className="text-base font-black text-text-primary">{section.title}</h3>
   </div>
   <pre className="whitespace-pre-wrap break-words text-sm font-semibold text-text-muted">
    {section.content || "Không có nội dung text."}
   </pre>
  </div>
 );
}

function ResultSummary({
 result,
 profile,
}: {
 result: AppliedParseResult | null;
 profile: ParseProfile;
}) {
 if (!result) {
  return (
   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3 text-sm font-semibold text-text-muted">
     <FileText className="h-6 w-6" />
     <p>
      Dán markdown, chỉnh profile nếu cần, rồi parse để xem outline và kết quả
      map. Import này chỉ preview, chưa tự lưu vào draft.
     </p>
    </div>
   </Card>
  );
 }

 return (
  <div className="grid gap-4">
   <div className="grid gap-3 sm:grid-cols-4">
    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Sections
     </p>
     <p className="text-2xl font-black text-text-primary">
      {countSections(result.doc.sections)}
     </p>
    </Card>

    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Items
     </p>
     <p className="text-2xl font-black text-text-primary">
      {result.items.length}
     </p>
    </Card>

    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Special
     </p>
     <p className="text-2xl font-black text-text-primary">
      {result.specialSections.length}
     </p>
    </Card>

    <Card padding="sm" className="rounded-xl">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Profile
     </p>
     <p className="truncate text-lg font-black text-text-primary">
      {profile.name}
     </p>
    </Card>
   </div>

   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <div className="flex items-center gap-2">
      <GitBranch className="h-5 w-5 text-text-muted" />
      <h2 className="text-lg font-black text-text-primary">Outline</h2>
     </div>

     {result.documentTitle && (
      <p className="rounded-lg bg-bg-subtle px-3 py-2 text-sm font-black text-text-primary">
       Document: {result.documentTitle}
      </p>
     )}

     {result.doc.sections.length === 0 ? (
      <p className="text-sm font-semibold text-text-muted">
       Markdown chưa có section.
      </p>
     ) : (
      <ol className="grid gap-2">
       {result.doc.sections.map((section) => (
        <OutlineSection key={section.id} section={section} />
       ))}
      </ol>
     )}
    </div>
   </Card>

   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <h2 className="text-lg font-black text-text-primary">Mapped result</h2>
     {result.items.length === 0 ? (
      <p className="rounded-xl border border-dashed border-border-default p-4 text-sm font-semibold text-text-muted">
       Không có item nào khớp item root rules của profile.
      </p>
     ) : (
      <div className="grid gap-3">
       {result.items.map((item) => (
        <MappedItemPreview key={item.id} item={item} />
       ))}
      </div>
     )}
    </div>
   </Card>

   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <h2 className="text-lg font-black text-text-primary">Special sections</h2>
     {result.specialSections.length === 0 ? (
      <p className="text-sm font-semibold text-text-muted">
       Không có reading/summary section.
      </p>
     ) : (
      <div className="grid gap-3">
       {result.specialSections.map((section) => (
        <SpecialSectionPreview key={section.id} section={section} />
       ))}
      </div>
     )}
    </div>
   </Card>

   <Card padding="lg" className="rounded-xl">
    <div className="grid gap-3">
     <h2 className="text-lg font-black text-text-primary">
      Unmapped sections
     </h2>
     {result.unmappedSections.length === 0 ? (
      <p className="text-sm font-semibold text-text-muted">
       Không có section bị bỏ lửng.
      </p>
     ) : (
      <div className="grid gap-2">
       {result.unmappedSections.map((section) => (
        <div
         key={section.id}
         className="grid gap-1 rounded-lg border border-border-default bg-bg-primary p-3"
        >
         <p className="text-sm font-black text-text-primary">
          {section.title}
         </p>
         <pre className="whitespace-pre-wrap break-words text-xs font-semibold text-text-muted">
          {sectionBlocksToPreview(section) || "Không có block text."}
         </pre>
        </div>
       ))}
      </div>
     )}
    </div>
   </Card>

   {result.warnings.length > 0 && (
    <Card padding="lg" className="rounded-xl">
     <div className="grid gap-3">
      <div className="flex items-center gap-2">
       <AlertTriangle className="h-5 w-5 text-text-muted" />
       <h2 className="text-lg font-black text-text-primary">Warnings</h2>
      </div>
      <ul className="grid gap-2">
       {result.warnings.map((warning, index) => (
        <li
         key={`${warning.message}-${index}`}
         className="rounded-lg bg-bg-subtle px-3 py-2 text-sm font-semibold text-text-muted"
        >
         {warning.sectionId ? `${warning.sectionId}: ` : ""}
         {warning.message}
        </li>
       ))}
      </ul>
     </div>
    </Card>
   )}
  </div>
 );
}

function ProfileSettingsPanel({
 profile,
 onChange,
}: {
 profile: ParseProfile;
 onChange: (profile: ParseProfile) => void;
}) {
 const rootRule = profile.itemRootRules[0] ?? null;

 const updateRootRule = (patch: Partial<SectionRoleRule>) => {
  if (!rootRule) return;

  onChange({
   ...profile,
   itemRootRules: [
    {
     ...rootRule,
     ...patch,
     match: {
      ...rootRule.match,
      ...patch.match,
     },
    },
    ...profile.itemRootRules.slice(1),
   ],
  });
 };

 const updateSpecialRule = (
  ruleId: string,
  patch: Partial<SectionRoleRule["match"]>,
 ) => {
  onChange({
   ...profile,
   specialSectionRules: profile.specialSectionRules.map((rule) =>
    rule.id === ruleId
     ? {
        ...rule,
        match: {
         ...rule.match,
         ...patch,
        },
       }
     : rule,
   ),
  });
 };

 const updateFieldRule = (
  ruleId: string,
  patch: Partial<FieldRule["match"]>,
 ) => {
  onChange({
   ...profile,
   fieldRules: profile.fieldRules.map((rule) =>
    rule.id === ruleId
     ? {
        ...rule,
        match: {
         ...rule.match,
         ...patch,
        },
       }
     : rule,
   ),
  });
 };

 return (
  <div className="grid gap-4">
   <div className="flex items-center gap-2">
    <Settings2 className="h-5 w-5 text-text-muted" />
    <h2 className="text-lg font-black text-text-primary">Profile settings</h2>
   </div>

   <CollapsibleSection
    title="Root item"
    summary={rootRule ? `H${firstHeadingLevel(rootRule)} ${rootRule.match.headingRegex ?? ""}` : "No root rule"}
   >
    {rootRule ? (
     <div className="grid gap-3">
      <label className="grid gap-2">
       <span className="text-xs font-bold text-text-muted">
        Root heading level
       </span>
       <Select
        value={firstHeadingLevel(rootRule)}
        onValueChange={(value) =>
         updateRootRule({
          match: {
           headingLevel: parseHeadingLevelValue(value),
          },
         })
        }
       >
        <SelectTrigger className="h-9 w-full bg-bg-primary text-sm">
         <SelectValue placeholder="Chọn heading level" />
        </SelectTrigger>
        <SelectContent>
         {[1, 2, 3, 4, 5, 6].map((level) => (
          <SelectItem key={level} value={String(level)}>
           H{level}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </label>

      <label className="grid gap-2">
       <span className="text-xs font-bold text-text-muted">
        Root heading regex
       </span>
       <Input
        value={rootRule.match.headingRegex ?? ""}
        className="h-9 text-sm"
        onChange={(event) =>
         updateRootRule({
          match: {
           headingRegex: event.target.value,
          },
         })
        }
       />
      </label>

      <label className="grid gap-2">
       <span className="text-xs font-bold text-text-muted">
        Unknown behavior
       </span>
       <Select
        value={profile.unknownSectionBehavior}
        onValueChange={(value) =>
         onChange({
          ...profile,
          unknownSectionBehavior: value as UnknownSectionBehavior,
         })
        }
       >
        <SelectTrigger className="h-9 w-full bg-bg-primary text-sm">
         <SelectValue placeholder="Chọn behavior" />
        </SelectTrigger>
        <SelectContent>
         {unknownBehaviorOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
           {option.label}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </label>
     </div>
    ) : (
     <p className="text-sm font-semibold text-text-muted">
      Profile chưa có item root rule.
     </p>
    )}
   </CollapsibleSection>

   <CollapsibleSection
    title="Special sections"
    summary={`${profile.specialSectionRules.length} rule`}
   >
    {profile.specialSectionRules.length === 0 ? (
     <p className="text-sm font-semibold text-text-muted">
      Profile chưa có special section rule.
     </p>
    ) : (
     profile.specialSectionRules.map((rule) => (
      <div
       key={rule.id}
       className="grid gap-2 rounded-lg border border-border-default bg-bg-primary p-3"
      >
       <p className="text-sm font-black text-text-primary">{rule.role}</p>
       <div className="grid gap-2 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
        <Select
         value={firstHeadingLevel(rule)}
         onValueChange={(value) =>
          updateSpecialRule(rule.id, {
           headingLevel: parseHeadingLevelValue(value),
          })
         }
        >
         <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue placeholder="H" />
         </SelectTrigger>
         <SelectContent>
          {[1, 2, 3, 4, 5, 6].map((level) => (
           <SelectItem key={level} value={String(level)}>
            H{level}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Input
         value={rule.match.headingRegex ?? ""}
         className="h-9 text-sm"
         onChange={(event) =>
          updateSpecialRule(rule.id, {
           headingRegex: event.target.value,
          })
         }
        />
       </div>
      </div>
     ))
    )}
   </CollapsibleSection>

   <CollapsibleSection
    title="Field mapping"
    summary={`${profile.fieldRules.length} field rule`}
   >
    <div className="grid max-h-96 gap-2 overflow-y-auto pr-1">
     {profile.fieldRules.map((rule) => (
      <div
       key={rule.id}
       className="grid gap-2 rounded-lg border border-border-default bg-bg-primary p-3"
      >
       <p className="truncate text-sm font-black text-text-primary">
        {rule.field}
       </p>
       <div className="grid gap-2 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
        <Select
         value={firstHeadingLevel(rule)}
         onValueChange={(value) =>
          updateFieldRule(rule.id, {
           headingLevel: parseHeadingLevelValue(value),
          })
         }
        >
         <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue placeholder="H" />
         </SelectTrigger>
         <SelectContent>
          {[1, 2, 3, 4, 5, 6].map((level) => (
           <SelectItem key={level} value={String(level)}>
            H{level}
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Input
         value={firstHeadingRegex(rule)}
         className="h-9 text-sm"
         onChange={(event) =>
          updateFieldRule(rule.id, {
           headingRegex: event.target.value ? [event.target.value] : [],
          })
         }
        />
       </div>
      </div>
     ))}
    </div>
   </CollapsibleSection>
  </div>
 );
}

type MarkdownImportPreviewProps = {
 draft: LessonDraft;
};

export function MarkdownImportPreview({ draft }: MarkdownImportPreviewProps) {
 const updateDraftMutation = useUpdateLessonDraftMutation();
 const initialProfileState = useMemo(() => getAvailableImportProfiles(), []);
 const [profiles, setProfiles] = useState(initialProfileState.profiles);
 const storageWarnings = initialProfileState.warnings;
 const [markdown, setMarkdown] = useState("");
 const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
 const selectedProfile = useMemo(
  () => profiles.find((profile) => profile.id === profileId) ?? profiles[0],
  [profileId, profiles],
 );
 const [editableProfile, setEditableProfile] = useState<ParseProfile | null>(
  selectedProfile ? cloneProfile(selectedProfile) : null,
 );
 const [result, setResult] = useState<AppliedParseResult | null>(null);
 const [applyTarget, setApplyTarget] = useState<ApplyImportTarget>(
  selectedProfile ? getDefaultApplyTarget(selectedProfile) : "mixed",
 );
 const [applyMode, setApplyMode] = useState<ApplyImportMode>("replace");

 const activeProfile = editableProfile ?? selectedProfile ?? null;
 const applyPreview = result ? getApplyPreviewText(result) : null;

 const handleProfileChange = (nextProfileId: string) => {
  const nextProfile =
   profiles.find((profile) => profile.id === nextProfileId) ?? null;

  setProfileId(nextProfileId);
  setEditableProfile(nextProfile ? cloneProfile(nextProfile) : null);
  setApplyTarget(nextProfile ? getDefaultApplyTarget(nextProfile) : "mixed");
  setResult(null);
 };

 const handleSaveCustomProfile = () => {
  if (!activeProfile) {
   toast.error("Không có profile để lưu.");
   return;
  }

  const isCustomProfile = activeProfile.id.startsWith("custom-");
  const customId = isCustomProfile
   ? activeProfile.id
   : `custom-${activeProfile.id}-${Date.now()}`;

  const savedProfile: ParseProfile = {
   ...activeProfile,
   id: customId,
   name: isCustomProfile ? activeProfile.name : `${activeProfile.name} (custom)`,
  };

  const existingCustomProfiles = loadCustomImportProfiles().profiles.filter(
   (profile) => profile.id !== customId,
  );

  saveCustomImportProfiles([...existingCustomProfiles, savedProfile]);

  setProfiles((currentProfiles) => [
   ...currentProfiles.filter((profile) => profile.id !== customId),
   savedProfile,
  ]);
  setProfileId(customId);
  setEditableProfile(cloneProfile(savedProfile));
  setResult(null);

  toast.success("Đã lưu custom import profile.");
 };

 const handleParse = () => {
  if (!activeProfile) {
   toast.error("Không có parse profile hợp lệ.");
   return;
  }

  if (!markdown.trim()) {
   toast.error("Chưa có markdown để parse.");
   return;
  }

  const doc = markdownToLearningDoc(markdown);
  const nextResult = applyParseProfile(doc, activeProfile);
  setResult(nextResult);
  toast.success(`Parsed ${nextResult.items.length} item.`);
 };

 const handleApply = async () => {
  if (!result) {
   toast.error("Parse markdown trước khi apply.");
   return;
  }

  const nextContent = applyParsedResultToDraft({
   draftContent: draft.content,
   parsedResult: result,
   target: applyTarget,
   mode: applyMode,
  });

  await updateDraftMutation.mutateAsync({
   draftId: draft.id,
   input: {
    content: nextContent,
   },
  });

  toast.success("Đã apply import vào draft.");
 };

 return (
  <div className="grid h-[calc(100dvh-11rem)] min-h-[34rem] gap-4 overflow-hidden xl:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.4fr)]">
   <aside className="h-full overflow-y-auto pr-1">
    <Card padding="lg" className="rounded-xl">
     <div className="grid gap-4">
      <div>
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Markdown import
       </p>
       <h2 className="text-xl font-black text-text-primary">
        Parse bằng profile
       </h2>
       <p className="text-sm font-semibold text-text-muted">
        Parser đọc markdown AST trước rồi mới áp profile. Không dùng AI và chưa
        tự lưu vào draft.
       </p>
      </div>

      <label className="grid gap-2">
       <span className="text-xs font-black uppercase tracking-wide text-text-muted">
        Profile
       </span>
       <Select value={activeProfile?.id ?? ""} onValueChange={handleProfileChange}>
        <SelectTrigger className="w-full">
         <SelectValue placeholder="Chọn parse profile" />
        </SelectTrigger>
        <SelectContent>
         {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
           {profile.name}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </label>

      {activeProfile && (
       <div className="grid gap-3">
        <ProfileSettingsPanel
         profile={activeProfile}
         onChange={setEditableProfile}
        />
        <Button
         type="button"
         variant="outline"
         onClick={handleSaveCustomProfile}
        >
         <Save className="h-4 w-4" />
         Lưu profile custom
        </Button>
       </div>
      )}

      <CollapsibleSection
       title="Apply adapter"
       summary={`${applyTarget} · ${applyMode}`}
       defaultOpen
      >
       <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
         <label className="grid gap-2">
          <span className="text-xs font-bold text-text-muted">Apply vào</span>
          <Select
           value={applyTarget}
           onValueChange={(value) => setApplyTarget(value as ApplyImportTarget)}
          >
           <SelectTrigger className="h-9 w-full bg-bg-primary text-sm">
            <SelectValue placeholder="Chọn target" />
           </SelectTrigger>
           <SelectContent>
            {applyTargetOptions.map((option) => (
             <SelectItem key={option.value} value={option.value}>
              {option.label}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
         </label>

         <label className="grid gap-2">
          <span className="text-xs font-bold text-text-muted">Chế độ</span>
          <Select
           value={applyMode}
           onValueChange={(value) => setApplyMode(value as ApplyImportMode)}
          >
           <SelectTrigger className="h-9 w-full bg-bg-primary text-sm">
            <SelectValue placeholder="Chọn mode" />
           </SelectTrigger>
           <SelectContent>
            {applyModeOptions.map((option) => (
             <SelectItem key={option.value} value={option.value}>
              {option.label}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
         </label>
        </div>

        {applyPreview && (
         <div className="grid gap-1 rounded-lg bg-bg-primary p-3 text-xs font-semibold text-text-muted">
          <p>{applyPreview.grammarCount} grammar item</p>
          <p>{applyPreview.vocabCount} vocab item</p>
          <p>{applyPreview.readingCount} reading section</p>
          <p>{applyPreview.summaryCount} summary section</p>
          <p>{applyPreview.exerciseCount} exercise set</p>
         </div>
        )}
       </div>
      </CollapsibleSection>

      <label className="grid gap-2">
       <span className="text-xs font-black uppercase tracking-wide text-text-muted">
        Markdown
       </span>
       <Textarea
        value={markdown}
        onChange={(event) => setMarkdown(event.target.value)}
        className="min-h-72 font-mono text-xs"
        placeholder={sampleMarkdown}
       />
      </label>

      <div className="flex flex-wrap gap-2">
       <Button type="button" onClick={handleParse}>
        <WandSparkles className="h-4 w-4" />
        Parse
       </Button>
       <Button
        type="button"
        variant="outline"
        onClick={() => setMarkdown(sampleMarkdown)}
       >
        Dùng mẫu
       </Button>
       <Button
        type="button"
        variant="outline"
        disabled={!result || updateDraftMutation.isPending}
        onClick={() => void handleApply()}
       >
        <Save className="h-4 w-4" />
        {updateDraftMutation.isPending ? "Đang apply..." : "Apply vào draft"}
       </Button>
      </div>

      {storageWarnings.length > 0 && (
       <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
        {storageWarnings.map((warning) => (
         <p key={warning} className="text-sm font-semibold text-text-muted">
          {warning}
         </p>
        ))}
       </div>
      )}
     </div>
    </Card>
   </aside>

   <section className="h-full overflow-y-auto pr-1">
    {activeProfile ? (
     <ResultSummary result={result} profile={activeProfile} />
    ) : (
     <Card padding="lg" className="rounded-xl">
      <p className="text-sm font-semibold text-text-muted">
       Không có profile khả dụng.
      </p>
     </Card>
    )}
   </section>
  </div>
 );
}
